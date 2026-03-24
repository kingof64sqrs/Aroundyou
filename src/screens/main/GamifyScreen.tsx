import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, TouchableOpacity, Platform, StatusBar } from 'react-native';
import { useTheme } from '../../constants/ThemeContext';
import { Flame, Trophy, Award, Crown, MapIcon, Compass, Star, ChevronRight } from 'lucide-react-native';
import { BlurView } from 'expo-blur';
import { Shadows } from '../../constants/Theme';

const { width } = Dimensions.get('window');

const GamifyScreen = () => {
    const { colors, typography, layout, globalStyles, mode } = useTheme();
    const isAndroid = Platform.OS === 'android';

    const BADGES = useMemo(() => [
        { id: '1', name: 'First Discovery', icon: <Compass color={colors.accent} size={24} />, unlocked: true },
        { id: '2', name: 'Street Food Hunter', icon: <Flame color={colors.danger} size={24} />, unlocked: true },
        { id: '3', name: 'Night Owl', icon: <MapIcon color="#8B5CF6" size={24} />, unlocked: false },
        { id: '4', name: 'City Master', icon: <Crown color={colors.accent} size={24} />, unlocked: false },
    ], [colors]);

    const styles = useMemo(() => createStyles({ colors, typography, layout }), [colors, typography, layout]);

    return (
        <View style={globalStyles.container}>
            <View style={styles.header}>
                <Text style={typography.h1}>Your Journey</Text>
                <TouchableOpacity style={styles.historyBtn}>
                    <Trophy color={colors.accent} size={20} />
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                {/* Streak Banner */}
                <View style={styles.streakCardContainer}>
                    {(!isAndroid) && (
                        <BlurView intensity={40} tint={mode === 'dark' ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
                    )}
                    <View style={[styles.streakCard, isAndroid && { backgroundColor: mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)' }]}>
                        <View style={styles.streakIconContainer}>
                            <Flame color={colors.accent} size={32} fill={colors.accent} />
                        </View>
                        <View style={styles.textColumn}>
                            <Text style={styles.streakTitle}>3 Day Streak!</Text>
                            <Text style={styles.streakSubtitle}>Keep discovering to earn a free coffee reward tomorrow.</Text>
                        </View>
                        <View style={styles.streakBadge}>
                            <Text style={styles.streakBadgeText}>+50 XP</Text>
                        </View>
                    </View>
                </View>

                {/* Reputation Level */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Reputation Level</Text>
                    <View style={styles.levelBadge}>
                        <Award color={colors.accent} size={14} />
                        <Text style={styles.levelBadgeText}>Local Insider</Text>
                    </View>
                </View>

                <View style={styles.levelCard}>
                    <View style={globalStyles.rowBetween}>
                        <View>
                            <Text style={styles.levelText}>Level 4</Text>
                            <Text style={styles.xpText}>1,550 XP</Text>
                        </View>
                        <View style={{ alignItems: 'flex-end' }}>
                            <Text style={styles.levelText}>Level 5</Text>
                            <Text style={styles.xpText}>2,000 XP</Text>
                        </View>
                    </View>

                    <View style={styles.progressTrack}>
                        <View style={[styles.progressFill, { width: '65%' }]} />
                    </View>

                    <Text style={styles.progressLabel}>
                        450 XP TO <Text style={{ color: colors.accent }}>CITY EXPERT</Text>
                    </Text>
                </View>

                {/* Leaderboard Glimpse */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Weekly Leaderboard</Text>
                    <TouchableOpacity style={globalStyles.row}>
                        <Text style={styles.seeAllText}>See All</Text>
                        <ChevronRight color={colors.primary} size={16} />
                    </TouchableOpacity>
                </View>

                <View style={styles.leaderboardCard}>
                    {[1, 2, 3].map((rank, idx) => (
                        <View key={rank} style={[styles.leaderboardRow, rank === 3 && { borderBottomWidth: 0 }]}>
                            <View style={globalStyles.row}>
                                <View style={[styles.rankBadge, rank === 1 && styles.rankGold, rank === 2 && styles.rankSilver, rank === 3 && styles.rankBronze]}>
                                    <Text style={styles.rankText}>{rank}</Text>
                                </View>
                                <View style={styles.avatarMini} />
                                <Text style={styles.username}>Explorer{rank}00</Text>
                            </View>
                            <Text style={styles.scoreText}>{1200 - (idx * 250)} XP</Text>
                        </View>
                    ))}
                </View>

                {/* Badges Collection */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Unlocked Badges</Text>
                    <Text style={styles.countText}>2/12</Text>
                </View>

                <View style={styles.badgesGrid}>
                    {BADGES.map(badge => (
                        <TouchableOpacity key={badge.id} style={[styles.badgeItem, !badge.unlocked && styles.badgeLocked]} activeOpacity={0.7}>
                            <View style={[styles.badgeIconRing, badge.unlocked && { borderColor: colors.accent, backgroundColor: colors.surfaceHighlight }]}>
                                {badge.icon}
                                {!badge.unlocked && <View style={styles.lockOverlay} />}
                            </View>
                            <Text style={styles.badgeName}>{badge.name}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </ScrollView>
        </View>
    );
}

function createStyles({ colors, typography, layout }: any) {
    return StyleSheet.create({
        header: {
            paddingHorizontal: layout.padding.l,
            paddingTop: 80,
            paddingBottom: layout.padding.m,
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
        },
        historyBtn: {
            width: 44,
            height: 44,
            borderRadius: 22,
            backgroundColor: colors.surfaceHighlight,
            justifyContent: 'center',
            alignItems: 'center',
            borderWidth: 1,
            borderColor: colors.border,
        },
        scrollContent: {
            paddingHorizontal: layout.padding.l,
            paddingBottom: 110,
            gap: layout.padding.l,
        },
        streakCardContainer: {
            borderRadius: layout.radius.l,
            overflow: 'hidden',
            borderWidth: 1,
            borderColor: withAlpha(colors.accent, 0.2),
            ...Shadows.medium,
        },
        streakCard: {
            flexDirection: 'row',
            alignItems: 'center',
            padding: layout.padding.l,
        },
        streakIconContainer: {
            width: 56,
            height: 56,
            borderRadius: 28,
            backgroundColor: withAlpha(colors.accent, 0.15),
            justifyContent: 'center',
            alignItems: 'center',
            marginRight: layout.padding.m,
            borderWidth: 1,
            borderColor: withAlpha(colors.accent, 0.2),
        },
        textColumn: {
            flex: 1,
        },
        streakTitle: {
            ...typography.h2,
            fontSize: 20,
            color: colors.text,
            marginBottom: 2,
        },
        streakSubtitle: {
            ...typography.caption,
            color: colors.textMuted,
            lineHeight: 16,
        },
        streakBadge: {
            paddingHorizontal: 8,
            paddingVertical: 4,
            backgroundColor: colors.accent,
            borderRadius: 6,
            marginLeft: 8,
        },
        streakBadgeText: {
            ...typography.caption,
            color: colors.onAccent,
            fontWeight: '800',
            fontSize: 10,
        },
        sectionHeader: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: layout.padding.s,
        },
        sectionTitle: {
            ...typography.h3,
            color: colors.text,
        },
        levelBadge: {
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: colors.surfaceHighlight,
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderRadius: layout.radius.round,
            borderWidth: 1,
            borderColor: colors.border,
        },
        levelBadgeText: {
            ...typography.caption,
            color: colors.accent,
            fontWeight: '700',
            marginLeft: 6,
        },
        levelCard: {
            backgroundColor: colors.surface,
            padding: layout.padding.l,
            borderRadius: layout.radius.l,
            borderWidth: 1,
            borderColor: colors.border,
            ...Shadows.soft,
        },
        levelText: {
            ...typography.bodyLarge,
            fontWeight: '700',
            color: colors.text,
        },
        xpText: {
            ...typography.caption,
            color: colors.textMuted,
            marginTop: 2,
        },
        progressTrack: {
            height: 10,
            backgroundColor: colors.surfaceHighlight,
            borderRadius: 5,
            marginTop: 16,
            overflow: 'hidden',
            borderWidth: 1,
            borderColor: colors.border,
        },
        progressFill: {
            height: '100%',
            backgroundColor: colors.accent,
            borderRadius: 5,
            ...Shadows.glow(colors.accent),
        },
        progressLabel: {
            ...typography.caption,
            alignSelf: 'center',
            marginTop: 14,
            color: colors.textMuted,
            fontWeight: '700',
            letterSpacing: 1,
        },
        leaderboardCard: {
            backgroundColor: colors.surface,
            borderRadius: layout.radius.l,
            borderWidth: 1,
            borderColor: colors.border,
            overflow: 'hidden',
            ...Shadows.soft,
        },
        leaderboardRow: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: layout.padding.m,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
        },
        rankBadge: {
            width: 24,
            height: 24,
            borderRadius: 12,
            justifyContent: 'center',
            alignItems: 'center',
            marginRight: 10,
            backgroundColor: colors.surfaceHighlight,
        },
        rankGold: { backgroundColor: '#FFD700' },
        rankSilver: { backgroundColor: '#C0C0C0' },
        rankBronze: { backgroundColor: '#CD7F32' },
        rankText: {
            fontSize: 12,
            fontWeight: '900',
            color: colors.text,
        },
        avatarMini: {
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: colors.surfaceHighlight,
            marginRight: 12,
            borderWidth: 1,
            borderColor: colors.border,
        },
        username: {
            ...typography.body,
            fontWeight: '600',
            color: colors.text,
        },
        scoreText: {
            ...typography.body,
            color: colors.accent,
            fontWeight: '800',
        },
        seeAllText: {
            ...typography.bodySmall,
            color: colors.primary,
            fontWeight: '700',
            marginRight: 2,
        },
        countText: {
            ...typography.caption,
            color: colors.textMuted,
            fontWeight: '700',
        },
        badgesGrid: {
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: layout.padding.m,
        },
        badgeItem: {
            width: (width - layout.padding.l * 2 - layout.padding.m) / 2,
            backgroundColor: colors.surface,
            padding: layout.padding.m,
            borderRadius: layout.radius.l,
            alignItems: 'center',
            borderWidth: 1,
            borderColor: colors.border,
            ...Shadows.soft,
        },
        badgeLocked: {
            backgroundColor: colors.surfaceHighlight + '50', // Half opaque
        },
        badgeIconRing: {
            width: 64,
            height: 64,
            borderRadius: 32,
            borderWidth: 2,
            borderColor: colors.border,
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: 12,
            position: 'relative',
        },
        lockOverlay: {
            ...StyleSheet.absoluteFillObject,
            backgroundColor: 'rgba(0,0,0,0.1)',
            borderRadius: 32,
        },
        badgeName: {
            ...typography.caption,
            textAlign: 'center',
            fontWeight: '700',
            color: colors.text,
        }
    });
}

function withAlpha(hex: string, alpha: number) {
    const normalized = hex.replace('#', '');
    if (normalized.length !== 6) return `rgba(0,0,0,${alpha})`;
    const r = parseInt(normalized.slice(0, 2), 16);
    const g = parseInt(normalized.slice(2, 4), 16);
    const b = parseInt(normalized.slice(4, 6), 16);
    return `rgba(${r},${g},${b},${alpha})`;
}

export default GamifyScreen;
