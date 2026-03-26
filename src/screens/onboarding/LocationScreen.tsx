import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useTheme } from '../../constants/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { MapPin, Navigation as NavIcon, Loader } from 'lucide-react-native';
import * as Location from 'expo-location';
import { Shadows } from '../../constants/Theme';
import { updateMe } from '../../services/api';

export default function LocationScreen({ navigation }: any) {
    const { colors, typography, layout, globalStyles } = useTheme();
    const { token } = useAuth();
    const [busy, setBusy] = useState(false);

    React.useEffect(() => {
        (async () => {
            const { status } = await Location.getForegroundPermissionsAsync();
            if (status === 'granted') {
                navigation.replace('MainTabs');
            }
        })();
    }, [navigation]);

    const styles = React.useMemo(() => createStyles({ colors, typography, layout }), [colors, typography, layout]);

    const handleAllow = async () => {
        setBusy(true);
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status === 'granted') {
                const location = await Location.getCurrentPositionAsync({});
                if (token) {
                    await updateMe(token, {
                        lat: location.coords.latitude,
                        lon: location.coords.longitude,
                    });
                }
            }
        } catch (err: any) {
            console.error('[LocationScreen] Error:', err);
            Alert.alert('Error', 'Failed to get or save location');
        } finally {
            setBusy(false);
            navigation.replace('MainTabs');
        }
    };

    const handleSkip = () => {
        navigation.replace('MainTabs');
    };

    return (
        <View style={globalStyles.container}>
            <View style={styles.container}>
                <View style={styles.content}>
                    <View style={styles.iconContainer}>
                        <View style={styles.iconGlow} />
                        <View style={styles.iconCircle}>
                            <MapPin color={colors.accent} size={48} strokeWidth={1.5} />
                        </View>
                    </View>

                    <Text style={styles.title}>Where are you?</Text>
                    <Text style={styles.subtitle}>
                        AroundYou needs your location to reveal hidden gems, trending cafes, and underground events happening nearby right now.
                    </Text>
                </View>

                <View style={styles.footer}>
                    <TouchableOpacity style={styles.button} onPress={handleAllow} activeOpacity={0.8} disabled={busy}>
                        {busy ? (
                            <Loader color={colors.onAccent} size={20} style={{ marginRight: 8 }} />
                        ) : (
                            <NavIcon color={colors.onAccent} size={20} fill={colors.onAccent} style={{ marginRight: 8 }} />
                        )}
                        <Text style={styles.buttonText}>{busy ? 'Getting location...' : 'Enable Location'}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.secondaryButton} onPress={handleSkip} activeOpacity={0.6} disabled={busy}>
                        <Text style={styles.secondaryButtonText}>Not Right Now</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
}

function createStyles({
    colors,
    typography,
    layout,
}: {
    colors: any;
    typography: any;
    layout: any;
}) {
    return StyleSheet.create({
        container: {
            flex: 1,
            justifyContent: 'space-between',
        },
        content: {
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            paddingHorizontal: layout.padding.xl,
        },
        iconContainer: {
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: layout.padding.xxl,
        },
        iconGlow: {
            position: 'absolute',
            width: 160,
            height: 160,
            borderRadius: 80,
            backgroundColor: colors.accent,
            opacity: 0.1,
        },
        iconCircle: {
            width: 100,
            height: 100,
            borderRadius: 50,
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: colors.border,
            justifyContent: 'center',
            alignItems: 'center',
            ...Shadows.medium,
        },
        title: {
            ...typography.h1,
            textAlign: 'center',
            marginBottom: layout.padding.m,
            color: colors.text,
        },
        subtitle: {
            ...typography.bodyLarge,
            color: colors.textMuted,
            textAlign: 'center',
            lineHeight: 24,
        },
        footer: {
            padding: layout.padding.xl,
            paddingBottom: 40,
            backgroundColor: colors.background,
        },
        button: {
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: colors.accent,
            height: 56,
            borderRadius: layout.radius.round,
            justifyContent: 'center',
            marginBottom: layout.padding.m,
            ...Shadows.glow(colors.accent),
        },
        buttonText: {
            ...typography.h3,
            color: colors.onAccent,
            fontWeight: '700',
        },
        secondaryButton: {
            height: 50,
            justifyContent: 'center',
            alignItems: 'center',
        },
        secondaryButtonText: {
            ...typography.body,
            color: colors.textSubtle,
            fontWeight: '600',
        }
    });
}
