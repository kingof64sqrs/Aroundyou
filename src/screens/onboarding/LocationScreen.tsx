import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../../constants/ThemeContext';
import { MapPin, Navigation } from 'lucide-react-native';

export default function LocationScreen({ navigation }: any) {
    const { colors, typography, layout, globalStyles } = useTheme();

    const styles = React.useMemo(() => createStyles({ colors, typography, layout, globalStyles }), [colors, typography, layout, globalStyles]);

    const handleAllow = () => {
        // In a real app we would request permissions here
        navigation.replace('MainTabs');
    };

    return (
        <View style={globalStyles.container}>
            <View style={[globalStyles.container, styles.container]}>
                <View style={styles.content}>
                    <View style={styles.iconContainer}>
                        <View style={styles.iconGlow} />
                        <View style={styles.iconCircle}>
                            <MapPin color={colors.primary} size={48} strokeWidth={2} />
                        </View>
                    </View>

                    <Text style={[typography.h1, styles.title]}>Where are you?</Text>
                    <Text style={styles.subtitle}>
                        AroundYou needs your location to reveal hidden gems, trending cafes, and underground events happening nearby right now.
                    </Text>
                </View>

                <View style={styles.footer}>
                    <TouchableOpacity style={styles.button} onPress={handleAllow} activeOpacity={0.8}>
                        <Navigation color={colors.onPrimary} size={20} style={{ marginRight: 8 }} />
                        <Text style={styles.buttonText}>Enable Location</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.secondaryButton} onPress={() => navigation.replace('MainTabs')}>
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
    globalStyles,
}: {
    colors: any;
    typography: any;
    layout: any;
    globalStyles: any;
}) {
    return StyleSheet.create({
    container: {
        backgroundColor: 'transparent',
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
        marginBottom: layout.padding.xl,
        position: 'relative',
    },
    iconGlow: {
        position: 'absolute',
        width: 140,
        height: 140,
        borderRadius: 70,
        backgroundColor: colors.primary,
        opacity: 0.15,
        transform: [{ scale: 1.2 }],
    },
    iconCircle: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        borderWidth: 1,
        borderColor: colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 15,
        elevation: 8,
    },
    title: {
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
        borderTopWidth: 1,
        borderColor: colors.glassBorder,
    },
    button: {
        ...globalStyles.row,
        backgroundColor: colors.primary,
        height: 60,
        borderRadius: layout.radius.round,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: layout.padding.l,
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 10,
        elevation: 6,
    },
    buttonText: {
        ...typography.h3,
        color: colors.onPrimary,
        fontWeight: '800',
    },
    secondaryButton: {
        height: 50,
        justifyContent: 'center',
        alignItems: 'center',
    },
    secondaryButtonText: {
        ...typography.bodyLarge,
        color: colors.textMuted,
        fontWeight: '600',
    }
    });
}
