import React from 'react';
import { DarkTheme, DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { BlurView } from 'expo-blur';
import { Platform, StyleSheet, View, TouchableOpacity, Text, Dimensions } from 'react-native';

// Import screens (To be implemented)
import SplashScreen from '../screens/onboarding/SplashScreen';
import SignUpScreen from '../screens/onboarding/SignUpScreen';
import UsernameScreen from '../screens/onboarding/UsernameScreen';
import InterestsScreen from '../screens/onboarding/InterestsScreen';
import LocationScreen from '../screens/onboarding/LocationScreen';

import HomeScreen from '../screens/main/HomeScreen';
import MapScreen from '../screens/main/MapScreen';
import PostScreen from '../screens/main/PostScreen';
import GamifyScreen from '../screens/main/GamifyScreen';
import ExploreScreen from '../screens/main/ExploreScreen';
import ProfileScreen from '../screens/main/ProfileScreen';
import PlaceDetailScreen from '../screens/main/PlaceDetailScreen';
import UserActivityScreen from '../screens/main/UserActivityScreen';

import { useTheme } from '../constants/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { Compass, Map as MapIcon, PlusSquare, BarChart3, User, Search } from 'lucide-react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const { width: windowWidth } = Dimensions.get('window');
const pillWidth = Math.min(windowWidth * 0.9, 400);

const CustomTabBar = ({ state, descriptors, navigation }: BottomTabBarProps) => {
    const { colors, mode } = useTheme();

    return (
        <View style={navStyles.tabContainer}>
            {Platform.OS !== 'android' ? (
                <BlurView tint="dark" intensity={80} style={StyleSheet.absoluteFill} />
            ) : (
                <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(24, 24, 27, 0.9)' }]} />
            )}

            <View style={navStyles.tabContent}>
                {state.routes.map((route, index) => {
                    const isFocused = state.index === index;

                    const onPress = () => {
                        const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
                        if (!isFocused && !event.defaultPrevented) {
                            navigation.navigate(route.name);
                        }
                    };

                    let icon = null;
                    if (route.name === 'HomeTab') {
                        icon = <Compass size={24} color={isFocused ? '#09090b' : '#a1a1aa'} />;
                    } else if (route.name === 'MapTab') {
                        icon = <MapIcon size={24} color={isFocused ? '#09090b' : '#a1a1aa'} />;
                    } else if (route.name === 'PostTab') {
                        icon = <PlusSquare size={24} color={isFocused ? '#09090b' : '#a1a1aa'} />;
                    } else if (route.name === 'ExploreTab') {
                        icon = <Search size={24} color={isFocused ? '#09090b' : '#a1a1aa'} />;
                    } else if (route.name === 'ProfileTab') {
                        icon = <User size={24} color={isFocused ? '#09090b' : '#a1a1aa'} />;
                    }

                    return (
                        <TouchableOpacity
                            key={index}
                            onPress={onPress}
                            activeOpacity={0.7}
                            style={[
                                navStyles.tabButton,
                                isFocused && navStyles.activeTabButton
                            ]}
                        >
                            {icon}
                        </TouchableOpacity>
                    );
                })}
            </View>
        </View>
    );
};

const navStyles = StyleSheet.create({
    tabContainer: {
        position: 'absolute',
        bottom: 24,
        left: (windowWidth - pillWidth) / 2,
        width: pillWidth,
        borderRadius: 99,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        backgroundColor: 'rgba(24, 24, 27, 0.6)',
        shadowColor: '#00f1fe',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 32,
        elevation: 10,
    },
    tabContent: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        height: 64,
        paddingHorizontal: 8,
    },
    tabButton: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },
    activeTabButton: {
        backgroundColor: '#00f1fe',
        shadowColor: '#00f1fe',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.6,
        shadowRadius: 15,
        elevation: 10,
    }
});

const TabNavigator = () => {
    return (
        <Tab.Navigator tabBar={(props) => <CustomTabBar {...props} />} screenOptions={{ headerShown: false }}>
            <Tab.Screen name="HomeTab" component={HomeScreen} />
            <Tab.Screen name="MapTab" component={MapScreen} />
            <Tab.Screen name="PostTab" component={PostScreen} />
            <Tab.Screen name="ExploreTab" component={ExploreScreen} />
            <Tab.Screen name="ProfileTab" component={ProfileScreen} />
        </Tab.Navigator>
    );
};

export default function AppNavigator() {
    const { colors, mode } = useTheme();
    const { token, me, isLoading } = useAuth();
    const base = mode === 'dark' ? DarkTheme : DefaultTheme;
    const needsOnboarding = !!token && !!me && !me.username;

    const navigationTheme: any = {
        ...base,
        colors: {
            ...base.colors,
            primary: colors.primary,
            background: colors.background,
            card: colors.surface,
            text: colors.text,
            border: colors.border,
            notification: colors.danger,
        },
        fonts: {
            regular: { fontFamily: '', fontWeight: 'normal' },
            medium: { fontFamily: '', fontWeight: '500' },
            bold: { fontFamily: '', fontWeight: 'bold' },
            heavy: { fontFamily: '', fontWeight: '900' },
        }
    };

    return (
        <NavigationContainer theme={navigationTheme}>
            <Stack.Navigator screenOptions={{ headerShown: false, animation: 'fade' }}>
                {isLoading ? (
                    <>
                        {/* Show splash while loading auth state */}
                        <Stack.Screen name="Splash" component={SplashScreen} />
                    </>
                ) : !token ? (
                    <>
                        {/* Auth Flow - user not logged in */}
                        <Stack.Screen name="SignUp" component={SignUpScreen} />
                    </>
                ) : (
                    <>
                        {needsOnboarding && <Stack.Screen name="Username" component={UsernameScreen} />}
                        {needsOnboarding && <Stack.Screen name="Interests" component={InterestsScreen} />}
                        {needsOnboarding && <Stack.Screen name="Location" component={LocationScreen} />}
                        {/* Main App Shell */}
                        <Stack.Screen name="MainTabs" component={TabNavigator} />
                    </>
                )}

                {/* Detail Screens */}
                <Stack.Screen
                    name="PlaceDetail"
                    component={PlaceDetailScreen}
                    options={{ presentation: 'fullScreenModal', animation: 'slide_from_bottom' }}
                />
                <Stack.Screen
                    name="UserActivity"
                    component={UserActivityScreen}
                    options={{ animation: 'slide_from_right' }}
                />
            </Stack.Navigator>
        </NavigationContainer>
    );
}
