import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, Dimensions, Share, Alert, Platform, StatusBar } from 'react-native';
import { useTheme } from '../../constants/ThemeContext';
import { ChevronLeft, Heart, Share2, MapPin, Navigation as NavIcon, Bookmark, Users, CheckCircle, Star } from 'lucide-react-native';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { getPlace, getPresence, pingPresence, PlacePublic } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Shadows } from '../../constants/Theme';

const { width } = Dimensions.get('window');

function placeHeroImage(placeId: string, title: string) {
    const seed = encodeURIComponent(`${placeId}-${title}`);
    return `https://picsum.photos/seed/${seed}/1200/800`;
}

function toRadians(degrees: number) {
    return (degrees * Math.PI) / 180;
}

function haversineDistanceMeters(
    a: { latitude: number; longitude: number },
    b: { latitude: number; longitude: number }
) {
    const R = 6_371_000;
    const dLat = toRadians(b.latitude - a.latitude);
    const dLon = toRadians(b.longitude - a.longitude);
    const lat1 = toRadians(a.latitude);
    const lat2 = toRadians(b.latitude);

    const sinDLat = Math.sin(dLat / 2);
    const sinDLon = Math.sin(dLon / 2);
    const aa = sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLon * sinDLon;
    return 2 * R * Math.atan2(Math.sqrt(aa), Math.sqrt(1 - aa));
}

function formatKm(distanceMeters: number) {
    const km = distanceMeters / 1000;
    return km < 10 ? `${km.toFixed(1)} km` : `${Math.round(km)} km`;
}

export default function PlaceDetailScreen({ route, navigation }: any) {
    const { colors, typography, layout, globalStyles, mode } = useTheme();
    const insets = useSafeAreaInsets();
    const isAndroid = Platform.OS === 'android';
    const { token } = useAuth();

    const placeId: string | undefined = route?.params?.placeId;

    const legacyItem = route?.params?.item || {
        title: 'Hidden Rooftop Matcha',
        user: 'Sarah K.',
        description: 'Found this insane secret matcha place above the old bookstore. Vibe is 10/10. Highly recommend coming around sunset.',
        image: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24',
        tags: ['Hidden gem', 'Cafe', 'Quiet'],
        likes: 124,
        distance: '1.2 km',
        verified: true,
    };

    const [place, setPlace] = useState<PlacePublic | null>(null);
    const [presenceCount, setPresenceCount] = useState<number | null>(null);
    const [distanceText, setDistanceText] = useState<string | null>(null);
    const [liked, setLiked] = useState(false);
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        if (!placeId) return;
        let mounted = true;

        (async () => {
            let fetched: PlacePublic | null = null;
            try {
                const [p, presence] = await Promise.all([
                    getPlace(placeId),
                    getPresence(placeId).catch(() => null),
                ]);
                if (!mounted) return;
                fetched = p;
                setPlace(p);
                setPresenceCount(presence?.active ?? null);
            } catch {
                if (!mounted) return;
            }

            try {
                const perm = await Location.getForegroundPermissionsAsync();
                if (perm.status !== 'granted') return;
                const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
                if (!mounted) return;
                const target = fetched ?? place;
                if (!target) return;
                const meters = haversineDistanceMeters(
                    { latitude: pos.coords.latitude, longitude: pos.coords.longitude },
                    { latitude: target.lat, longitude: target.lon }
                );
                setDistanceText(formatKm(meters));
            } catch {
                // ignore
            }
        })();

        return () => {
            mounted = false;
        };
    }, [placeId, place]);

    const viewModel = useMemo(() => {
        if (placeId && place) {
            return {
                title: place.name,
                user: 'AroundYou',
                description: place.category,
                image: placeHeroImage(place.id, place.name),
                tags: [place.category].filter(Boolean),
                distance: distanceText ?? '—',
                verified: false,
            };
        }
        return legacyItem;
    }, [placeId, place, legacyItem, distanceText]);

    const handleShare = async () => {
        try {
            await Share.share({
                message: `Check out ${viewModel.title} on AroundYou! Download the app to explore.`,
            });
        } catch (error) {
            console.error(error);
        }
    };

    const handleAction = () => {
        if (token && placeId) {
            pingPresence(token, placeId).catch(() => { });
        }
        Alert.alert("Awesome!", "You're all set to go. We'll track your arrival for XP points!");
        setTimeout(() => navigation.goBack(), 1500);
    };

    const styles = useMemo(() => createStyles({ colors, typography, layout, globalStyles }), [colors, typography, layout, globalStyles]);

    return (
        <View style={globalStyles.container}>
            <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Hero Image */}
                <View style={styles.heroContainer}>
                    <Image source={{ uri: viewModel.image }} style={styles.heroImage} />
                    <View style={styles.heroOverlay} />

                    {/* Floating Info */}
                    <View style={styles.heroInfo}>
                        <View style={styles.categoryPill}>
                            <Text style={styles.categoryText}>{viewModel.tags[0] || 'Discovery'}</Text>
                        </View>
                        <Text style={styles.heroTitle}>{viewModel.title}</Text>
                        <View style={globalStyles.row}>
                            <MapPin color={colors.accent} size={14} />
                            <Text style={styles.heroDistance}>{viewModel.distance} away</Text>
                        </View>
                    </View>

                    <TouchableOpacity
                        style={[styles.backBtn, { top: (insets.top || 0) + 12 }]}
                        onPress={() => navigation.goBack()}
                    >
                        <ChevronLeft color="#fff" size={24} />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.shareBtn, { top: (insets.top || 0) + 12 }]}
                        onPress={handleShare}
                    >
                        <Share2 color="#fff" size={20} />
                    </TouchableOpacity>
                </View>

                {/* Content */}
                <View style={styles.contentSection}>
                    <View style={styles.statsRow}>
                        <View style={styles.statBox}>
                            <Heart color={colors.danger} size={20} fill={liked ? colors.danger : 'transparent'} />
                            <Text style={styles.statValue}>1,240</Text>
                            <Text style={styles.statLabel}>Likes</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statBox}>
                            <Star color={colors.accent} size={20} fill={colors.accent} />
                            <Text style={styles.statValue}>4.8</Text>
                            <Text style={styles.statLabel}>Rating</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statBox}>
                            <Users color={colors.primary} size={20} />
                            <Text style={styles.statValue}>{presenceCount || 42}</Text>
                            <Text style={styles.statLabel}>Active</Text>
                        </View>
                    </View>

                    {/* Shared By */}
                    <View style={styles.userRow}>
                        <View style={styles.avatarMini} />
                        <View>
                            <Text style={styles.sharedByText}>Shared by</Text>
                            <Text style={styles.username}>{viewModel.user}</Text>
                        </View>
                        {viewModel.verified && (
                            <View style={styles.verifiedBadge}>
                                <CheckCircle color={colors.accent} size={14} fill={colors.accent} />
                                <Text style={styles.verifiedText}>Verified</Text>
                            </View>
                        )}
                    </View>

                    <Text style={styles.sectionTitle}>About this place</Text>
                    <Text style={styles.description}>
                        {viewModel.description}. A perfect spot for explorers looking to discover something unique in the city. Excellent atmosphere and highly rated by the community.
                    </Text>

                    <View style={styles.tagsContainer}>
                        {viewModel.tags.map((tag: string, i: number) => (
                            <View key={i} style={styles.tagPill}>
                                <Text style={styles.tagPillText}>{tag}</Text>
                            </View>
                        ))}
                        <View style={styles.tagPill}>
                            <Text style={styles.tagPillText}>Trending</Text>
                        </View>
                    </View>

                    {/* Action Cards */}
                    <View style={styles.cardsRow}>
                        <TouchableOpacity
                            style={[styles.actionCard, liked && { borderColor: colors.danger }]}
                            onPress={() => setLiked(!liked)}
                        >
                            <Heart color={liked ? colors.danger : colors.textSubtle} size={24} fill={liked ? colors.danger : 'transparent'} />
                            <Text style={[styles.cardLabel, liked && { color: colors.danger }]}>Favorite</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.actionCard, saved && { borderColor: colors.accent }]}
                            onPress={() => setSaved(!saved)}
                        >
                            <Bookmark color={saved ? colors.accent : colors.textSubtle} size={24} fill={saved ? colors.accent : 'transparent'} />
                            <Text style={[styles.cardLabel, saved && { color: colors.accent }]}>Save</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>

            {/* Sticky Bottom Bar */}
            <View style={[styles.bottomBar, { paddingBottom: (insets.bottom || 0) + 16 }]}>
                {(!isAndroid) && (
                    <BlurView intensity={80} tint={mode === 'dark' ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
                )}
                <View style={[styles.bottomBarInner, isAndroid && { backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border }]}>
                    <TouchableOpacity style={styles.primaryBtn} onPress={handleAction} activeOpacity={0.8}>
                        <NavIcon color={colors.onPrimary} size={20} fill={colors.onPrimary} />
                        <Text style={styles.primaryBtnText}>Navigate to Place</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
}

function createStyles({ colors, typography, layout, globalStyles }: any) {
    return StyleSheet.create({
        heroContainer: {
            height: 450,
            width,
            position: 'relative',
        },
        heroImage: {
            ...StyleSheet.absoluteFillObject,
        },
        heroOverlay: {
            ...StyleSheet.absoluteFillObject,
            backgroundColor: 'rgba(0,0,0,0.35)', // Soften image
        },
        heroInfo: {
            position: 'absolute',
            bottom: 40,
            left: layout.padding.l,
            right: layout.padding.l,
        },
        categoryPill: {
            alignSelf: 'flex-start',
            backgroundColor: colors.accent,
            paddingHorizontal: 12,
            paddingVertical: 4,
            borderRadius: layout.radius.s,
            marginBottom: 12,
        },
        categoryText: {
            ...typography.caption,
            color: colors.onAccent,
            fontWeight: '900',
            textTransform: 'uppercase',
            letterSpacing: 1,
        },
        heroTitle: {
            ...typography.h1,
            color: '#fff',
            fontSize: 32,
            marginBottom: 4,
            textShadowColor: 'rgba(0,0,0,0.5)',
            textShadowOffset: { width: 0, height: 2 },
            textShadowRadius: 4,
        },
        heroDistance: {
            ...typography.body,
            color: '#fff',
            opacity: 0.9,
            marginLeft: 6,
        },
        backBtn: {
            position: 'absolute',
            left: layout.padding.l,
            width: 44,
            height: 44,
            borderRadius: 22,
            backgroundColor: 'rgba(0,0,0,0.3)',
            justifyContent: 'center',
            alignItems: 'center',
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.2)',
        },
        shareBtn: {
            position: 'absolute',
            right: layout.padding.l,
            width: 44,
            height: 44,
            borderRadius: 22,
            backgroundColor: 'rgba(0,0,0,0.3)',
            justifyContent: 'center',
            alignItems: 'center',
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.2)',
        },
        scrollContent: {
            paddingBottom: 140,
        },
        contentSection: {
            padding: layout.padding.l,
            backgroundColor: colors.background,
            borderTopLeftRadius: 30,
            borderTopRightRadius: 30,
            marginTop: -30,
        },
        statsRow: {
            flexDirection: 'row',
            backgroundColor: colors.surface,
            borderRadius: layout.radius.l,
            padding: layout.padding.m,
            marginBottom: layout.padding.xl,
            borderWidth: 1,
            borderColor: colors.border,
            ...Shadows.soft,
        },
        statBox: {
            flex: 1,
            alignItems: 'center',
        },
        statValue: {
            ...typography.h3,
            color: colors.text,
            marginTop: 4,
        },
        statLabel: {
            ...typography.caption,
            color: colors.textMuted,
        },
        statDivider: {
            width: 1,
            backgroundColor: colors.border,
            marginVertical: 10,
        },
        userRow: {
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: layout.padding.xl,
        },
        avatarMini: {
            width: 44,
            height: 44,
            borderRadius: 22,
            backgroundColor: colors.surfaceHighlight,
            marginRight: 12,
            borderWidth: 1,
            borderColor: colors.border,
        },
        sharedByText: {
            ...typography.caption,
            color: colors.textMuted,
        },
        username: {
            ...typography.bodyLarge,
            fontWeight: '700',
            color: colors.text,
        },
        verifiedBadge: {
            marginLeft: 'auto',
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: withAlpha(colors.accent, 0.1),
            paddingHorizontal: 10,
            paddingVertical: 5,
            borderRadius: layout.radius.round,
            borderWidth: 1,
            borderColor: withAlpha(colors.accent, 0.2),
        },
        verifiedText: {
            ...typography.caption,
            color: colors.accent,
            fontWeight: '800',
            marginLeft: 4,
        },
        sectionTitle: {
            ...typography.h3,
            color: colors.text,
            marginBottom: 8,
        },
        description: {
            ...typography.bodyLarge,
            color: colors.textMuted,
            lineHeight: 24,
            marginBottom: layout.padding.l,
        },
        tagsContainer: {
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: 8,
            marginBottom: layout.padding.xl,
        },
        tagPill: {
            paddingHorizontal: 14,
            paddingVertical: 8,
            borderRadius: layout.radius.round,
            backgroundColor: colors.surfaceHighlight,
            borderWidth: 1,
            borderColor: colors.border,
        },
        tagPillText: {
            ...typography.bodySmall,
            fontWeight: '600',
            color: colors.text,
        },
        cardsRow: {
            flexDirection: 'row',
            gap: 12,
        },
        actionCard: {
            flex: 1,
            backgroundColor: colors.surface,
            borderRadius: layout.radius.l,
            padding: layout.padding.l,
            alignItems: 'center',
            borderWidth: 1,
            borderColor: colors.border,
            ...Shadows.soft,
        },
        cardLabel: {
            ...typography.caption,
            fontWeight: '700',
            color: colors.textSubtle,
            marginTop: 8,
        },
        bottomBar: {
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            overflow: 'hidden',
        },
        bottomBarInner: {
            padding: layout.padding.l,
        },
        primaryBtn: {
            flexDirection: 'row',
            backgroundColor: colors.primary,
            height: 60,
            borderRadius: layout.radius.round,
            justifyContent: 'center',
            alignItems: 'center',
            ...Shadows.medium,
        },
        primaryBtnText: {
            ...typography.h3,
            color: colors.onPrimary,
            fontWeight: '900',
            marginLeft: 10,
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
