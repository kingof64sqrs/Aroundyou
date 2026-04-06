import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Animated, Platform } from 'react-native';
import { useTheme } from '../../constants/ThemeContext';
import { useAuth } from '../../context/AuthContext';

export default function SplashScreen() {
    const { colors, globalStyles, typography, layout } = useTheme();
    const { token } = useAuth();
    const useNativeDriver = Platform.OS !== 'web';
    const opacity = new Animated.Value(0);
    const scale = new Animated.Value(0.95);

    useEffect(() => {
        Animated.parallel([
            Animated.timing(opacity, {
                toValue: 1,
                duration: 800,
                useNativeDriver,
            }),
            Animated.spring(scale, {
                toValue: 1,
                friction: 6,
                useNativeDriver,
            })
        ]).start();
    }, []);

    const styles = React.useMemo(() => createStyles({ colors, typography, layout }), [colors, typography, layout]);

    return (
        <View style={[globalStyles.container, globalStyles.center]}>
            <Animated.View style={{ opacity, transform: [{ scale }], alignItems: 'center' }}>
                <Text style={styles.title}>Around</Text>
                <Text style={[styles.title, { marginTop: -10, color: colors.accent }]}>You</Text>
                <View style={styles.line} />
                {token && <Text style={styles.welcomeBack}>Welcome back!</Text>}
            </Animated.View>
        </View>
    );
}

function createStyles({ colors, typography, layout }: any) {
    return StyleSheet.create({
        title: {
            fontFamily: 'BebasNeue_400Regular',
            fontSize: 72,
            textAlign: 'center',
            lineHeight: 80,
            letterSpacing: 1.5,
            color: colors.text,
        },
        line: {
            width: 60,
            height: 4,
            marginTop: 12,
            backgroundColor: colors.primary,
            borderRadius: layout.radius.round,
        },
        welcomeBack: {
            fontSize: 14,
            color: colors.textMuted,
            marginTop: 20,
            fontStyle: 'italic',
        }
    });
}
