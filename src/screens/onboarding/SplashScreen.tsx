import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useTheme } from '../../constants/ThemeContext';

export default function SplashScreen({ navigation }: any) {
    const { colors, globalStyles } = useTheme();
    const opactiy = new Animated.Value(0);
    const scale = new Animated.Value(0.9);

    useEffect(() => {
        Animated.parallel([
            Animated.timing(opactiy, {
                toValue: 1,
                duration: 800,
                useNativeDriver: true,
            }),
            Animated.spring(scale, {
                toValue: 1,
                friction: 4,
                useNativeDriver: true,
            })
        ]).start();

        const timer = setTimeout(() => {
            navigation.replace('SignUp');
        }, 2500);

        return () => clearTimeout(timer);
    }, [navigation, opactiy, scale]);

    return (
        <View style={[globalStyles.container, globalStyles.center, styles.container, { backgroundColor: colors.background }]}>
            <Animated.View style={{ opacity: opactiy, transform: [{ scale }], alignItems: 'center' }}>
                <Text style={[styles.title, { color: colors.text }]}>Around</Text>
                <Text style={[styles.title, { marginTop: -15, color: colors.text }]}>You</Text>
                <View style={[styles.line, { backgroundColor: colors.primary }]} />
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {},
    title: {
        fontFamily: 'SpaceGrotesk_700Bold',
        fontSize: 72,
        textAlign: 'center',
        lineHeight: 80,
        letterSpacing: -2,
    },
    line: {
        width: '100%',
        height: 6,
        marginTop: 10,
    }
});
