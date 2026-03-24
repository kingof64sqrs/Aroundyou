import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useTheme } from '../../constants/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { ArrowRight, Sparkles, Loader } from 'lucide-react-native';
import { Shadows } from '../../constants/Theme';
import { updateMe } from '../../services/api';

const ALL_INTERESTS = [
    'Cafes', 'Street food', 'Study spots', 'Nightlife',
    'Cheap eats', 'Hidden gems', 'Events', 'Live Music',
    'Desserts', 'Rooftops', 'Parks', 'Thrifting'
];

export default function InterestsScreen({ navigation }: any) {
    const { colors, typography, layout, globalStyles, mode } = useTheme();
    const { token } = useAuth();
    const [selected, setSelected] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);

    const toggleInterest = (interest: string) => {
        if (selected.includes(interest)) {
            setSelected(selected.filter(i => i !== interest));
        } else if (selected.length < 5) {
            setSelected([...selected, interest]);
        }
    };

    const handleContinue = async () => {
        if (selected.length < 2 || !token) return;
        
        setLoading(true);
        try {
            await updateMe(token, { interests: selected });
            navigation.replace('Location');
        } catch (err: any) {
            const message = err?.message || 'Failed to save interests';
            console.error('[InterestsScreen] Save error:', message);
            Alert.alert('Error', message);
        } finally {
            setLoading(false);
        }
    };

    const styles = React.useMemo(() => createStyles({ colors, typography, layout, globalStyles, mode }), [colors, typography, layout, globalStyles, mode]);

    return (
        <View style={globalStyles.container}>
            <View style={styles.header}>
                <Text style={typography.h1}>What's your vibe?</Text>
                <Text style={[typography.body, { marginTop: layout.padding.m, color: colors.textMuted }]}>
                    Pick 2-5 interests to personalize your city pulse ({selected.length}/5).
                </Text>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <View style={styles.tagsContainer}>
                    {ALL_INTERESTS.map((interest) => {
                        const isSelected = selected.includes(interest);
                        return (
                            <TouchableOpacity
                                key={interest}
                                style={[
                                    styles.tag,
                                    isSelected && styles.tagSelected
                                ]}
                                onPress={() => toggleInterest(interest)}
                                activeOpacity={0.7}
                                disabled={loading}
                            >
                                <Text style={[
                                    styles.tagText,
                                    isSelected && styles.tagTextSelected
                                ]}>
                                    {interest}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>
            </ScrollView>

            <View style={styles.footer}>
                <TouchableOpacity
                    style={[styles.button, (selected.length < 2 || loading) && styles.buttonDisabled]}
                    onPress={handleContinue}
                    disabled={selected.length < 2 || loading}
                    activeOpacity={0.8}
                >
                    {loading ? (
                        <Loader color={colors.onAccent} size={20} style={{ marginRight: 8 }} />
                    ) : selected.length >= 2 ? (
                        <Sparkles color={colors.onAccent} size={20} style={{ marginRight: 8 }} />
                    ) : null}
                    <Text style={styles.buttonText}>{loading ? 'Saving...' : 'Continue'}</Text>
                    {!loading && <ArrowRight color={selected.length < 2 ? colors.textSubtle : colors.onAccent} size={20} style={{ marginLeft: 8 }} />}
                </TouchableOpacity>
            </View>
        </View>
    );
}

function createStyles({
    colors,
    typography,
    layout,
    globalStyles,
    mode,
}: {
    colors: any;
    typography: any;
    layout: any;
    globalStyles: any;
    mode: any;
}) {
    const tagBg = mode === 'dark' ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.03)';
    const selectedBg = mode === 'dark' ? 'rgba(0, 255, 135, 0.12)' : 'rgba(16, 185, 129, 0.08)';

    return StyleSheet.create({
        header: {
            paddingHorizontal: layout.padding.xl,
            paddingTop: 100,
            paddingBottom: layout.padding.xl,
        },
        scrollContent: {
            paddingHorizontal: layout.padding.xl,
            paddingBottom: 40,
        },
        tagsContainer: {
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: 12,
        },
        tag: {
            paddingVertical: 14,
            paddingHorizontal: 22,
            borderRadius: layout.radius.l,
            backgroundColor: tagBg,
            borderWidth: 1,
            borderColor: colors.border,
        },
        tagSelected: {
            backgroundColor: selectedBg,
            borderColor: colors.accent,
            ...Shadows.glow(colors.accent),
            shadowOpacity: 0.2, // Toned down for chips
        },
        tagText: {
            ...typography.body,
            color: colors.textMuted,
            fontWeight: '500',
        },
        tagTextSelected: {
            color: colors.accent,
            fontWeight: '700',
        },
        footer: {
            padding: layout.padding.xl,
            paddingBottom: 40,
            backgroundColor: colors.background,
        },
        button: {
            ...globalStyles.row,
            justifyContent: 'center',
            backgroundColor: colors.accent,
            height: 56,
            borderRadius: layout.radius.round,
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
        }
    });
}
