import React from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, TouchableOpacity, Platform } from 'react-native';
import { useTheme } from '../../constants/ThemeContext';
import { Flame, Trophy, Award, Crown, MapIcon, Compass } from 'lucide-react-native';
import { BlurView } from 'expo-blur';

const { width } = Dimensions.get('window');

const BADGES = [
    { id: '1', name: 'First Discovery', icon: <Compass color="#FCD34D" size={24} />, unlocked: true },
    { id: '2', name: 'Street Food Hunter', icon: <Flame color="#EF4444" size={24} />, unlocked: true },
    { id: '3', name: 'Night Owl', icon: <MapIcon color="#8B5CF6" size={24} />, unlocked: false },
    { id: '4', name: 'City Master', icon: <Crown color="#F59E0B" size={24} />, unlocked: false },
];

export default function GamifyScreen() {
    const { colors, typography, layout, globalStyles, mode } = useTheme();
    const isAndroid = Platform.OS === 'android';
    const styles = React.useMemo(() => createStyles({ colors, typography, layout }), [colors, typography, layout]);

    return (
        <View style={globalStyles.container}>
            <View style={styles.header}>
                <Text style={typography.h1}>Your Journey</Text>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>

                {/* Streak Banner */}
                {isAndroid ? (
                    <View style={[styles.streakCard, { backgroundColor: colors.glassSurface, borderColor: colors.glassBorder }]}> 
                        <View style={styles.streakIconContainer}>
                            <Flame color={colors.contribute} size={32} fill={colors.contribute} />
                        </View>
                        <View style={styles.textColumn}>
                            <Text style={typography.h2}>3 Day Streak!</Text>
                            <Text style={{ ...typography.body, color: colors.textMuted }}>Keep discovering to earn a free coffee reward tomorrow.</Text>
                        </View>
                    </View>
                ) : (
                    <BlurView intensity={20} tint={mode === 'dark' ? 'dark' : 'light'} style={styles.streakCard}>
                        <View style={styles.streakIconContainer}>
                            <Flame color={colors.contribute} size={32} fill={colors.contribute} />
                        </View>
                        <View style={styles.textColumn}>
                            <Text style={typography.h2}>3 Day Streak!</Text>
                            <Text style={{ ...typography.body, color: colors.textMuted }}>Keep discovering to earn a free coffee reward tomorrow.</Text>
                        </View>
                    </BlurView>
                )}

                {/* Reputation Level */}
                <View style={styles.sectionHeader}>
                    <Text style={typography.h3}>Reputation Level</Text>
                    <Text style={{ ...typography.bodyLarge, color: colors.accent }}>Local Insider</Text>
                </View>

                <View style={styles.levelCard}>
                    <View style={globalStyles.rowBetween}>
                        <Text style={typography.bodyLarge}>Level 4</Text>
                        <Text style={typography.bodyLarge}>Level 5</Text>
                    </View>

                    <View style={styles.progressTrack}>
                        <View style={styles.progressFill} />
                    </View>

                    <Text style={{ ...typography.caption, alignSelf: 'center', marginTop: 12, color: colors.textMuted }}>
                        450 XP to City Expert
                    </Text>
                </View>

                {/* Leaderboard Glimpse */}
                <View style={styles.sectionHeader}>
                    <Text style={typography.h3}>Top Explorers This Week</Text>
                    <TouchableOpacity>
                        <Text style={{ ...typography.body, color: colors.primary }}>See All</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.leaderboardCard}>
                    {[1, 2, 3].map((rank, idx) => (
                        <View key={rank} style={styles.leaderboardRow}>
                            <View style={globalStyles.row}>
                                <Text style={styles.rankText}>#{rank}</Text>
                                <View style={styles.avatarMini} />
                                <Text style={styles.username}>Explorer{rank}00</Text>
                            </View>
                            <Text style={styles.scoreText}>{1200 - (idx * 250)} XP</Text>
                        </View>
                    ))}
                </View>

                {/* Badges Collection */}
                <View style={styles.sectionHeader}>
                    <Text style={typography.h3}>Badges (2/12)</Text>
                </View>

                <View style={styles.badgesGrid}>
                    {BADGES.map(badge => (
                        <View key={badge.id} style={[styles.badgeItem, !badge.unlocked && styles.badgeLocked]}>
                            <View style={[styles.badgeIconRing, !badge.unlocked && { borderColor: colors.border }]}>
                                {badge.icon}
                            </View>
                            <Text style={styles.badgeName}>{badge.name}</Text>
                        </View>
                    ))}
                </View>
            </ScrollView>
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
    header: {
        padding: layout.padding.xl,
        paddingTop: 80,
    },
    scrollContent: {
        paddingHorizontal: layout.padding.m,
        paddingBottom: 100, // Bottom tab space
        gap: layout.padding.l,
    },
    streakCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: layout.padding.l,
        borderRadius: layout.radius.l,
        borderWidth: 1,
        borderColor: 'rgba(249, 115, 22, 0.3)',
        backgroundColor: 'rgba(249, 115, 22, 0.1)',
    },
    streakIconContainer: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: 'rgba(249, 115, 22, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: layout.padding.m,
    },
    textColumn: {
        flex: 1,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        marginTop: layout.padding.m,
    },
    levelCard: {
        backgroundColor: colors.surface,
        padding: layout.padding.l,
        borderRadius: layout.radius.m,
        borderWidth: 1,
        borderColor: colors.border,
    },
    progressTrack: {
        height: 12,
        backgroundColor: colors.surfaceHighlight,
        borderRadius: 6,
        marginTop: 16,
        overflow: 'hidden',
    },
    progressFill: {
        width: '65%',
        height: '100%',
        backgroundColor: colors.accent,
        borderRadius: 6,
    },
    leaderboardCard: {
        backgroundColor: colors.surface,
        borderRadius: layout.radius.m,
        borderWidth: 1,
        borderColor: colors.border,
        overflow: 'hidden',
    },
    leaderboardRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: layout.padding.m,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    rankText: {
        ...typography.h3,
        color: '#FCD34D',
        width: 30,
    },
    avatarMini: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: colors.primary,
        marginRight: 12,
    },
    username: {
        ...typography.bodyLarge,
        fontWeight: '600',
    },
    scoreText: {
        ...typography.bodyLarge,
        color: colors.accent,
        fontWeight: '700',
    },
    badgesGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    badgeItem: {
        width: (width - layout.padding.m * 2 - layout.padding.m) / 2, // 2 columns
        backgroundColor: colors.surface,
        padding: layout.padding.m,
        borderRadius: layout.radius.m,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.border,
        marginBottom: layout.padding.m,
    },
    badgeLocked: {
        opacity: 0.4,
    },
    badgeIconRing: {
        width: 60,
        height: 60,
        borderRadius: 30,
        borderWidth: 2,
        borderColor: colors.textSubtle,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    badgeName: {
        ...typography.body,
        textAlign: 'center',
        fontWeight: '600',
    }
    });
}
