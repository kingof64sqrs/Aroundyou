import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useTheme } from '../../constants/ThemeContext';
import { ArrowRight, Sparkles } from 'lucide-react-native';

const ALL_INTERESTS = [
    'Cafes', 'Street food', 'Study spots', 'Nightlife',
    'Cheap eats', 'Hidden gems', 'Events', 'Live Music',
    'Desserts', 'Rooftops', 'Parks', 'Thrifting'
];

export default function InterestsScreen({ navigation }: any) {
    const { colors, typography, layout, globalStyles, mode } = useTheme();
    const [selected, setSelected] = useState<string[]>([]);

    const toggleInterest = (interest: string) => {
        if (selected.includes(interest)) {
            setSelected(selected.filter(i => i !== interest));
        } else if (selected.length < 5) {
            setSelected([...selected, interest]);
        }
    };

    const styles = React.useMemo(() => createStyles({ colors, typography, layout, globalStyles, mode }), [colors, typography, layout, globalStyles, mode]);

    return (
        <View style={globalStyles.container}>
            <View style={styles.header}>
                <Text style={typography.h1}>What's your vibe?</Text>
                <Text style={[typography.bodyLarge, { marginTop: layout.padding.s, color: colors.textMuted }]}>
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
                    style={[styles.button, selected.length < 2 && styles.buttonDisabled]}
                    onPress={() => navigation.replace('Location')}
                    disabled={selected.length < 2}
                    activeOpacity={0.8}
                >
                    {selected.length >= 2 && <Sparkles color={colors.onPrimary} size={20} style={{ marginRight: 8 }} />}
                    <Text style={styles.buttonText}>Continue</Text>
                    <ArrowRight color={selected.length < 2 ? colors.textMuted : colors.onPrimary} size={20} style={{ marginLeft: 8 }} />
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
    const tagBg = mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)';
    const tagBorder = mode === 'dark' ? 'rgba(255, 255, 255, 0.10)' : colors.glassBorder;
    const selectedBg = 'rgba(0, 255, 135, 0.15)';

    return StyleSheet.create({
    header: {
        padding: layout.padding.xl,
        paddingTop: 100,
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
        borderRadius: layout.radius.round,
        backgroundColor: tagBg,
        borderWidth: 1,
        borderColor: tagBorder,
    },
    tagSelected: {
        backgroundColor: selectedBg,
        borderColor: colors.accent,
        shadowColor: colors.accent,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.4,
        shadowRadius: 10,
        elevation: 5,
    },
    tagText: {
        ...typography.bodyLarge,
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
        borderTopWidth: 1,
        borderColor: colors.glassBorder,
    },
    button: {
        ...globalStyles.row,
        justifyContent: 'center',
        backgroundColor: colors.accent,
        height: 60,
        borderRadius: layout.radius.round,
        shadowColor: colors.accent,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 10,
        elevation: 6,
    },
    buttonDisabled: {
        backgroundColor: tagBg,
        shadowOpacity: 0,
        elevation: 0,
    },
    buttonText: {
        ...typography.h3,
        color: colors.onPrimary,
        fontWeight: '800',
    }
    });
}
