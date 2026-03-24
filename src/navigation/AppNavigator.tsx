import React from 'react';
import { DarkTheme, DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { BlurView } from 'expo-blur';
import { Platform, StyleSheet, View } from 'react-native';

// Import screens (To be implemented)
import SplashScreen from '../screens/onboarding/SplashScreen';
import SignUpScreen from '../screens/onboarding/SignUpScreen';
import InterestsScreen from '../screens/onboarding/InterestsScreen';
import LocationScreen from '../screens/onboarding/LocationScreen';

import HomeScreen from '../screens/main/HomeScreen';
import MapScreen from '../screens/main/MapScreen';
import PostScreen from '../screens/main/PostScreen';
import GamifyScreen from '../screens/main/GamifyScreen';
import ProfileScreen from '../screens/main/ProfileScreen';
import PlaceDetailScreen from '../screens/main/PlaceDetailScreen';

import { useTheme } from '../constants/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { Home, Map, PlusSquare, Trophy, User } from 'lucide-react-native';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const TabNavigator = () => {
    const { colors, mode } = useTheme();
    const isAndroid = Platform.OS === 'android';
    return (
        <Tab.Navigator
            screenOptions={{
                headerShown: false,
                tabBarStyle: {
                    elevation: 0,
                    backgroundColor: colors.glassSurface,
                    borderTopWidth: 1,
                    borderTopColor: colors.glassBorder,
                    height: isAndroid ? 64 : 72,
                    paddingTop: isAndroid ? 8 : 10,
                    paddingBottom: isAndroid ? 8 : 10,
                },
                tabBarBackground: () =>
                    isAndroid ? (
                        <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.glassSurface }]} />
                    ) : (
                        <BlurView tint={mode === 'dark' ? 'dark' : 'light'} intensity={35} style={StyleSheet.absoluteFill} />
                    ),
                tabBarActiveTintColor: colors.primary,
                tabBarInactiveTintColor: colors.textMuted,
                tabBarShowLabel: false,
                tabBarHideOnKeyboard: true,
            }}
        >
            <Tab.Screen
                name="HomeTab"
                component={HomeScreen}
                options={{ tabBarIcon: ({ color, size }) => <Home color={color} size={28} /> }}
            />
            <Tab.Screen
                name="MapTab"
                component={MapScreen}
                options={{ tabBarIcon: ({ color, size }) => <Map color={color} size={28} /> }}
            />
            <Tab.Screen
                name="PostTab"
                component={PostScreen}
                options={{
                    tabBarIcon: ({ color, size }) => (
                        <View style={{
                            backgroundColor: colors.primary,
                            width: 56,
                            height: 56,
                            borderRadius: 28,
                            justifyContent: 'center',
                            alignItems: 'center',
                            marginTop: isAndroid ? -22 : -28,
                            ...(Platform.OS === 'web'
                                ? { boxShadow: `0px 0px 12px ${colors.primary}` }
                                : {
                                    shadowColor: colors.primary,
                                    shadowOffset: { width: 0, height: 0 },
                                    shadowOpacity: 0.35,
                                    shadowRadius: 12,
                                }),
                            elevation: 6,
                        }}>
                            <PlusSquare color={colors.onPrimary} size={28} />
                        </View>
                    )
                }}
            />
            <Tab.Screen
                name="GamifyTab"
                component={GamifyScreen}
                options={{ tabBarIcon: ({ color, size }) => <Trophy color={color} size={28} /> }}
            />
            <Tab.Screen
                name="ProfileTab"
                component={ProfileScreen}
                options={{ tabBarIcon: ({ color, size }) => <User color={color} size={28} /> }}
            />
        </Tab.Navigator>
    );
};

export default function AppNavigator() {
    const { colors, mode } = useTheme();
    const { token, me } = useAuth();
    const base = mode === 'dark' ? DarkTheme : DefaultTheme;
    const needsOnboarding = !!token && !!me && (!me.interests?.length || me.lat == null || me.lon == null);

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
                {!token ? (
                    <>
                        {/* Auth Flow */}
                        <Stack.Screen name="Splash" component={SplashScreen} />
                        <Stack.Screen name="SignUp" component={SignUpScreen} />
                    </>
                ) : (
                    <>
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
            </Stack.Navigator>
        </NavigationContainer>
    );
}
