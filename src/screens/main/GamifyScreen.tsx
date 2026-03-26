import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, TouchableOpacity, Platform, ActivityIndicator } from 'react-native';
import { useTheme } from '../../constants/ThemeContext';
import { Flame, Trophy, Award, Crown, MapIcon, Compass, Star, ChevronRight, AlertCircle } from 'lucide-react-native';
import { BlurView } from 'expo-blur';
import { Shadows } from '../../constants/Theme';
import { useAuth } from '../../context/AuthContext';
import { getXP, getLeaderboard, XPResponse, LeaderboardEntry } from '../../services/api';

const { width } = Dimensions.get('window');

// Preset avatar emoji map (matches backend "preset:N" format)
const PRESET_EMOJIS = ['🦊', '🐼', '🦋', '🐉', '🌙', '⚡', '🔥', '🌊'];
const PRESET_COLORS = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F'];

function AvatarMini({ avatarUrl, name, size = 36 }: { avatarUrl?: string | null; name?: string | null; size?: number }) {
    const { colors } = useTheme();
    if (avatarUrl?.startsWith('preset:')) {
        const idx = parseInt(avatarUrl.split(':')[1], 10);
        const emoji = PRESET_EMOJIS[idx] ?? '🦊';
        const bg = PRESET_COLORS[idx] ?? colors.surfaceHighlight;
        return (
            <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: bg + '55', justifyContent: 'center', alignItems: 'center' }}>
                <Text style={{ fontSize: size * 0.48 }}>{emoji}</Text>
            </View>
        );
    }
    // Initials fallback
    const initials = (name || '?').slice(0, 2).toUpperCase();
    return (
        <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: colors.surfaceHighlight, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: colors.border }}>
            <Text style={{ fontSize: size * 0.36, fontWeight: '700', color: colors.textMuted }}>{initials}</Text>
        </View>
    );
}

const GamifyScreen = () => {
    const { colors, typography, layout, globalStyles, mode } = useTheme();
    const { token, me } = useAuth();
    const isAndroid = Platform.OS === 'android';

    const [xpData, setXpData] = useState<XPResponse | null>(null);
    const [streak, setStreak] = useState<number | null>(null);
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadData = useCallback(async () => {
        if (!token) return;
        setLoading(true);
        setError(null);
        try {
            const [xp, lb, streakRes] = await Promise.all([
                getXP(token),
                getLeaderboard(token, 5),
                fetch(`${require('../../constants/Config').API_BASE_URL}/api/v1/rewards/streak`, {
                    headers: { Authorization: `Bearer ${token}` },
                }).then(r => r.json()),
            ]);
            setXpData(xp);
            setLeaderboard(lb.entries);
            setStreak(streakRes?.streak_days ?? 0);
        } catch (err: any) {
            setError(err?.message || 'Failed to load rewards');
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => { loadData(); }, [loadData]);

    const styles = useMemo(() => createStyles({ colors, typography, layout }), [colors, typography, layout]);

    const renderRankBadge = (rank: number) => {
        const colors3: Record<number, string> = { 1: '#FFD700', 2: '#C0C0C0', 3: '#CD7F32' };
        return (
            <View style={[styles.rankBadge, rank <= 3 && { backgroundColor: colors3[rank] }]}>
                <Text style={styles.rankText}>{rank}</Text>
            </View>
        );
    };

    if (loading) {
        return (
            <View style={[globalStyles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color={colors.accent} />
                <Text style={[typography.body, { color: colors.textMuted, marginTop: 16 }]}>Loading your journey...</Text>
            </View>
        );
    }

    if (error) {
        return (
            <View style={[globalStyles.container, { justifyContent: 'center', alignItems: 'center', padding: 32 }]}>
                <AlertCircle color={colors.danger} size={48} />
                <Text style={[typography.h3, { color: colors.text, marginTop: 16, marginBottom: 8 }]}>Could not load data</Text>
                <Text style={[typography.body, { color: colors.textMuted, textAlign: 'center', marginBottom: 24 }]}>{error}</Text>
                <TouchableOpacity onPress={loadData} style={[styles.retryBtn, { backgroundColor: colors.accent }]}>
                    <Text style={{ color: colors.onAccent, fontWeight: '700' }}>Retry</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const progressWidth = xpData ? `${Math.min(xpData.progress_pct, 100)}%` : '0%';
    const myLbEntry = leaderboard.find(e => e.user_id === me?.id);
    const myRank = myLbEntry?.rank;

    return (
        <View style={globalStyles.container}>
            <View style={styles.header}>
                <Text style={typography.h1}>Your Journey</Text>
                <TouchableOpacity style={styles.historyBtn} onPress={loadData}>
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
                            <Flame color={colors.accent} size={32} fill={streak && streak > 0 ? colors.accent : 'transparent'} />
                        </View>
                        <View style={styles.textColumn}>
                            <Text style={styles.streakTitle}>
                                {streak === 0 ? 'No streak yet' : `${streak} Day Streak!`}
                            </Text>
                            <Text style={styles.streakSubtitle}>
                                {streak === 0 ? 'Post or check in to start your streak.' : 'Keep discovering to keep it alive!'}
                            </Text>
                        </View>
                        {streak != null && streak > 0 && (
                            <View style={styles.streakBadge}>
                                <Text style={styles.streakBadgeText}>🔥 {streak}d</Text>
                            </View>
                        )}
                    </View>
                </View>

                {/* XP / Level */}
                {xpData && (
                    <>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Reputation Level</Text>
                            <View style={styles.levelBadge}>
                                <Award color={colors.accent} size={14} />
                                <Text style={styles.levelBadgeText}>{xpData.level_name}</Text>
                            </View>
                        </View>

                        <View style={styles.levelCard}>
                            <View style={globalStyles.rowBetween}>
                                <View>
                                    <Text style={styles.levelText}>Level {xpData.level}</Text>
                                    <Text style={styles.xpText}>{xpData.xp.toLocaleString()} XP</Text>
                                </View>
                                <View style={{ alignItems: 'flex-end' }}>
                                    <Text style={styles.levelText}>Level {xpData.level + 1}</Text>
                                    <Text style={styles.xpText}>{xpData.next_level_xp.toLocaleString()} XP</Text>
                                </View>
                            </View>

                            <View style={styles.progressTrack}>
                                <View style={[styles.progressFill, { width: progressWidth as any }]} />
                            </View>

                            <Text style={styles.progressLabel}>
                                {xpData.next_level_xp - xpData.xp} XP TO{' '}
                                <Text style={{ color: colors.accent }}>NEXT LEVEL</Text>
                            </Text>
                        </View>
                    </>
                )}

                {/* Leaderboard */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Leaderboard</Text>
                    {myRank != null && (
                        <View style={styles.myRankBadge}>
                            <Star color={colors.accent} size={12} fill={colors.accent} />
                            <Text style={styles.myRankText}>You #{myRank}</Text>
                        </View>
                    )}
                </View>

                <View style={styles.leaderboardCard}>
                    {leaderboard.length === 0 ? (
                        <View style={styles.emptyLb}>
                            <Text style={[typography.body, { color: colors.textMuted, textAlign: 'center' }]}>
                                No explorers yet. Post or check in to appear!
                            </Text>
                        </View>
                    ) : leaderboard.slice(0, 5).map((entry, idx) => {
                        const isMe = entry.user_id === me?.id;
                        return (
                            <View key={entry.user_id} style={[styles.leaderboardRow, idx === leaderboard.length - 1 && { borderBottomWidth: 0 }, isMe && { backgroundColor: withAlpha(colors.accent, 0.06) }]}>
                                <View style={globalStyles.row}>
                                    {renderRankBadge(entry.rank)}
                                    <View style={{ marginRight: 10 }}>
                                        <AvatarMini avatarUrl={entry.avatar_url} name={entry.name} size={36} />
                                    </View>
                                    <View>
                                        <Text style={[styles.username, isMe && { color: colors.accent }]}>
                                            {isMe ? 'You' : (entry.username ? `@${entry.username}` : (entry.name || 'Explorer'))}
                                        </Text>
                                    </View>
                                </View>
                                <Text style={[styles.scoreText, isMe && { color: colors.accent }]}>{entry.xp.toLocaleString()} XP</Text>
                            </View>
                        );
                    })}
                </View>
            </ScrollView>
        </View>
    );
};

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
            width: 44, height: 44, borderRadius: 22,
            backgroundColor: colors.surfaceHighlight,
            justifyContent: 'center', alignItems: 'center',
            borderWidth: 1, borderColor: colors.border,
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
            flexDirection: 'row', alignItems: 'center', padding: layout.padding.l,
        },
        streakIconContainer: {
            width: 56, height: 56, borderRadius: 28,
            backgroundColor: withAlpha(colors.accent, 0.15),
            justifyContent: 'center', alignItems: 'center',
            marginRight: layout.padding.m,
            borderWidth: 1, borderColor: withAlpha(colors.accent, 0.2),
        },
        textColumn: { flex: 1 },
        streakTitle: { ...typography.h2, fontSize: 20, color: colors.text, marginBottom: 2 },
        streakSubtitle: { ...typography.caption, color: colors.textMuted, lineHeight: 16 },
        streakBadge: {
            paddingHorizontal: 8, paddingVertical: 4,
            backgroundColor: colors.accent, borderRadius: 6, marginLeft: 8,
        },
        streakBadgeText: { ...typography.caption, color: colors.onAccent, fontWeight: '800', fontSize: 10 },
        sectionHeader: {
            flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
            marginTop: layout.padding.s,
        },
        sectionTitle: { ...typography.h3, color: colors.text },
        levelBadge: {
            flexDirection: 'row', alignItems: 'center',
            backgroundColor: colors.surfaceHighlight,
            paddingHorizontal: 12, paddingVertical: 6,
            borderRadius: layout.radius.round,
            borderWidth: 1, borderColor: colors.border,
        },
        levelBadgeText: { ...typography.caption, color: colors.accent, fontWeight: '700', marginLeft: 6 },
        levelCard: {
            backgroundColor: colors.surface,
            padding: layout.padding.l,
            borderRadius: layout.radius.l,
            borderWidth: 1, borderColor: colors.border,
            ...Shadows.soft,
        },
        levelText: { ...typography.bodyLarge, fontWeight: '700', color: colors.text },
        xpText: { ...typography.caption, color: colors.textMuted, marginTop: 2 },
        progressTrack: {
            height: 10, backgroundColor: colors.surfaceHighlight,
            borderRadius: 5, marginTop: 16,
            overflow: 'hidden', borderWidth: 1, borderColor: colors.border,
        },
        progressFill: { height: '100%', backgroundColor: colors.accent, borderRadius: 5, ...Shadows.glow(colors.accent) },
        progressLabel: {
            ...typography.caption, alignSelf: 'center',
            marginTop: 14, color: colors.textMuted, fontWeight: '700', letterSpacing: 1,
        },
        myRankBadge: {
            flexDirection: 'row', alignItems: 'center',
            backgroundColor: withAlpha(colors.accent, 0.1),
            paddingHorizontal: 10, paddingVertical: 4,
            borderRadius: layout.radius.round,
            borderWidth: 1, borderColor: withAlpha(colors.accent, 0.2),
        },
        myRankText: { ...typography.caption, color: colors.accent, fontWeight: '700', marginLeft: 4 },
        leaderboardCard: {
            backgroundColor: colors.surface,
            borderRadius: layout.radius.l,
            borderWidth: 1, borderColor: colors.border,
            overflow: 'hidden', ...Shadows.soft,
        },
        leaderboardRow: {
            flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
            padding: layout.padding.m,
            borderBottomWidth: 1, borderBottomColor: colors.border,
        },
        rankBadge: {
            width: 24, height: 24, borderRadius: 12,
            justifyContent: 'center', alignItems: 'center',
            marginRight: 10, backgroundColor: colors.surfaceHighlight,
        },
        rankText: { fontSize: 12, fontWeight: '900', color: '#333' },
        username: { ...typography.body, fontWeight: '600', color: colors.text },
        scoreText: { ...typography.body, color: colors.accent, fontWeight: '800' },
        retryBtn: {
            paddingHorizontal: 24, paddingVertical: 12, borderRadius: 20,
        },
        emptyLb: {
            padding: layout.padding.xl,
        },
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
