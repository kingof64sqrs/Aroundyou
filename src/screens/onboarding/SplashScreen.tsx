import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Animated, Platform } from 'react-native';
import { useTheme } from '../../constants/ThemeContext';

export default function SplashScreen({ navigation }: any) {
    const { colors, globalStyles, typography, layout } = useTheme();
    const useNativeDriver = Platform.OS !== 'web';
    const opacity = new Animated.Value(0);
    const scale = new Animated.Value(0.95);

    useEffect(() => {
        Animated.parallel([
            Animated.timing(opacity, {
                toValue: 1,
                duration: 1000,
                useNativeDriver,
            }),
            Animated.spring(scale, {
                toValue: 1,
                friction: 6,
                useNativeDriver,
            })
        ]).start();

        const timer = setTimeout(() => {
            navigation.replace('SignUp');
        }, 2500);

        return () => clearTimeout(timer);
    }, [navigation]);

    const styles = React.useMemo(() => createStyles({ colors, typography, layout }), [colors, typography, layout]);

    return (
        <View style={[globalStyles.container, globalStyles.center]}>
            <Animated.View style={{ opacity, transform: [{ scale }], alignItems: 'center' }}>
                <Text style={styles.title}>Around</Text>
                <Text style={[styles.title, { marginTop: -10, color: colors.accent }]}>You</Text>
                <View style={styles.line} />
            </Animated.View>
        </View>
    );
}

function createStyles({ colors, typography, layout }: any) {
    return StyleSheet.create({
        title: {
            fontFamily: 'SpaceGrotesk_700Bold',
            fontSize: 72,
            textAlign: 'center',
            lineHeight: 80,
            letterSpacing: -3,
            color: colors.text,
        },
        line: {
            width: 60,
            height: 4,
            marginTop: 12,
            backgroundColor: colors.primary,
            borderRadius: layout.radius.round,
        }
    });
}
