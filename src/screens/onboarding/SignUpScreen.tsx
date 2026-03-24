import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { ArrowRight, LogIn } from 'lucide-react-native';
import * as WebBrowser from 'expo-web-browser';
import { API_BASE_URL } from '../../constants/Config';

import { useTheme } from '../../constants/ThemeContext';
import { Shadows } from '../../constants/Theme';
import { useAuth } from '../../context/AuthContext';

WebBrowser.maybeCompleteAuthSession();

export default function SignUpScreen() {
    const { colors, typography, layout, globalStyles } = useTheme();
    const auth = useAuth();
    const [pendingGoogleAuth, setPendingGoogleAuth] = useState(false);

    useEffect(() => {
        if (__DEV__ && Platform.OS === 'web') {
            console.log('[GoogleAuth] Backend start URL:', `${API_BASE_URL}/auth/google/start`);
        }
    }, []);

    const onGooglePress = async () => {
        if (Platform.OS === 'web') {
            setPendingGoogleAuth(true);
            window.location.assign(`${API_BASE_URL}/auth/google/start`);
            return;
        }

        Alert.alert('Not Supported Here', 'Use web sign-in or configure a native Google OAuth client for Expo Go.');
    };

    const styles = useMemo(() => createStyles({ colors, typography, layout }), [colors, typography, layout]);
    const busy = auth.isLoading || pendingGoogleAuth;

    return (
        <View style={globalStyles.container}>
            <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
                <View style={styles.content}>
                    <View style={styles.header}>
                        <View style={styles.logoBadge}>
                            <Text style={styles.logoText}>A'Y</Text>
                        </View>

                        <Text style={typography.h1}>
                            <Text style={{ color: colors.text }}>Enter </Text>
                            <Text style={{ color: colors.accent }}>AroundYou</Text>
                        </Text>

                        <Text style={[typography.body, styles.subtitle]}>
                            Discover your city with real-time recommendations. Continue with your Google account.
                        </Text>
                    </View>

                    <View style={styles.formContainer}>
                        <TouchableOpacity
                            style={[styles.button, busy && styles.buttonDisabled]}
                            onPress={onGooglePress}
                            disabled={busy}
                            activeOpacity={0.8}
                        >
                            <LogIn color={colors.onAccent} size={20} style={{ marginRight: 8 }} />
                            <Text style={styles.buttonText}>{busy ? 'Signing in...' : 'Sign In with Google'}</Text>
                            <ArrowRight color={colors.onAccent} size={20} style={{ marginLeft: 8 }} />
                        </TouchableOpacity>

                        <Text style={styles.termsText}>By continuing, you agree to our Terms & Privacy Policy</Text>
                    </View>
                </View>
            </KeyboardAvoidingView>
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
        },
        content: {
            flex: 1,
            justifyContent: 'center',
            paddingBottom: layout.padding.xxl,
        },
        header: {
            padding: layout.padding.xl,
            paddingBottom: layout.padding.l,
            alignItems: 'center',
        },
        logoBadge: {
            width: 64,
            height: 64,
            borderRadius: layout.radius.l,
            backgroundColor: colors.accent,
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: layout.padding.xl,
            ...Shadows.glow(colors.accent),
        },
        logoText: {
            ...typography.h2,
            color: colors.onAccent,
            fontWeight: '900',
        },
        subtitle: {
            marginTop: layout.padding.m,
            color: colors.textMuted,
            textAlign: 'center',
        },
        formContainer: {
            marginHorizontal: layout.padding.l,
            padding: layout.padding.xl,
            borderRadius: layout.radius.xl,
            borderWidth: 1,
            borderColor: colors.glassBorder,
            backgroundColor: colors.glassSurface,
        },
        button: {
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: colors.accent,
            height: 56,
            borderRadius: layout.radius.round,
            justifyContent: 'center',
            ...Shadows.glow(colors.accent),
        },
        buttonDisabled: {
            backgroundColor: colors.surfaceHighlight,
            shadowOpacity: 0,
            elevation: 0,
            opacity: 0.5,
        },
        buttonText: {
            ...typography.h3,
            color: colors.onAccent,
            fontWeight: '700',
        },
        termsText: {
            ...typography.caption,
            textAlign: 'center',
            marginTop: layout.padding.xl,
            color: colors.textSubtle,
            fontSize: 10,
        },
    });
}
