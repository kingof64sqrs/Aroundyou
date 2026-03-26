import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Dimensions, Image, TouchableOpacity, StatusBar, Share, Alert, Platform, ActivityIndicator } from 'react-native';
import { useTheme } from '../../constants/ThemeContext';
import { MapPin, Heart, MessageCircle, Share2, Navigation, Star, RefreshCw } from 'lucide-react-native';
import { BlurView } from 'expo-blur';
import * as Location from 'expo-location';
import { FeedItem, getFeed, recordFeedActivity } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Shadows } from '../../constants/Theme';

const { width, height } = Dimensions.get('window');
const TAB_BAR_HEIGHT = 85;

function feedImage(seed: string) {
    const safe = encodeURIComponent(seed);
    return `https://picsum.photos/seed/${safe}/1200/1600`;
}

const DiscoveryCard = ({ item, navigation, onView, onLike }: { item: FeedItem, navigation: any, onView: (id: string) => void, onLike: (id: string) => void }) => {
    const { colors, typography, layout, globalStyles } = useTheme();
    const isAndroid = Platform.OS === 'android';
    const [liked, setLiked] = useState(false);
    const [likeCount, setLikeCount] = useState(0);

    const styles = React.useMemo(() => createStyles({ colors, typography, layout }), [colors, typography, layout]);

    const handleLike = () => {
        if (!liked) {
            onLike(item.id);
        }
        setLiked(!liked);
        setLikeCount(liked ? likeCount - 1 : likeCount + 1);
    };

    const handleShare = async () => {
        try {
            await Share.share({
                message: `Check out ${item.caption || 'this discovery'} on AroundYou! Download the app to discover it.`,
            });
        } catch (error) {
            console.error(error);
        }
    };


    return (
        <View style={styles.cardContainer}>
            <Image
                source={{ uri: item.media_url || item.media_urls?.[0] || feedImage(item.id) }}
                style={styles.backgroundImage}
                resizeMode="cover"
            />

            {/* Gradients should stay dark to ensure text readability on any image */}
            <View style={[styles.topGradient, { backgroundColor: 'rgba(0,0,0,0.4)' }]} />
            <View style={[styles.bottomGradient, { backgroundColor: 'rgba(0,0,0,0.6)' }]} />

            {/* Header Info */}
            <View style={styles.header}>
                <View style={globalStyles.row}>
                    <View style={styles.avatarPlaceholder} />
                    <View style={{ marginLeft: layout.padding.s }}>
                        <Text style={styles.username}>Explorer</Text>
                        <View style={globalStyles.row}>
                            <MapPin color="rgba(255,255,255,0.7)" size={12} />
                            <Text style={styles.distance}>{item.source}</Text>
                        </View>
                    </View>
                </View>
                {item.source === 'trending' && (
                    <View style={styles.verifiedBadge}>
                        {(!isAndroid) && (
                            <BlurView
                                intensity={40}
                                tint="dark"
                                style={StyleSheet.absoluteFill}
                            />
                        )}
                        <Star color={colors.accent} size={14} fill={colors.accent} />
                        <Text style={styles.verifiedText}>Verified</Text>
                    </View>
                )}
            </View>

            {/* Content Area */}
            <View style={styles.contentArea}>
                {/* Right Side Actions */}
                <View style={styles.actionSidebar}>
                    <TouchableOpacity style={styles.actionButton} onPress={handleLike} activeOpacity={0.7}>
                        <Heart
                            color={liked ? colors.danger : "white"}
                            fill={liked ? colors.danger : "transparent"}
                            size={32}
                            strokeWidth={liked ? 0 : 2}
                        />
                        <Text style={styles.actionText}>{likeCount}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.actionButton} onPress={() => Alert.alert('Comments', 'Comments coming soon!')} activeOpacity={0.7}>
                        <MessageCircle color="white" size={32} />
                        <Text style={styles.actionText}>—</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.actionButton} onPress={handleShare} activeOpacity={0.7}>
                        <Share2 color="white" size={32} />
                        <Text style={styles.actionText}>Share</Text>
                    </TouchableOpacity>
                </View>

                {/* Text details */}
                <View style={styles.textContainer}>
                    <Text style={styles.title} numberOfLines={1}>{item.caption || 'New discovery'}</Text>
                    <Text style={styles.description} numberOfLines={2}>{item.caption || ''}</Text>

                    <TouchableOpacity
                        style={styles.navigateButton}
                        onPress={() => {
                            onView(item.id);
                            navigation.navigate('PlaceDetail', { postId: item.id, placeId: item.place_id });
                        }}
                        activeOpacity={0.8}
                    >
                        <Navigation color={colors.onAccent} size={18} fill={colors.onAccent} />
                        <Text style={styles.navigateText}>I'm Going</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
};

const LoadingPlaceholder = () => {
    const { colors } = useTheme();
    return (
        <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
            <ActivityIndicator size="large" color={colors.accent} />
            <Text style={{ marginTop: 16, color: colors.textMuted }}>Loading personalized feed...</Text>
        </View>
    );
};

const EmptyState = ({ onRetry }: { onRetry: () => void }) => {
    const { colors, typography, layout } = useTheme();
    return (
        <View style={[styles.emptyContainer, { backgroundColor: colors.background }]}>
            <Text style={[typography.h2, { color: colors.text, marginBottom: layout.padding.m }]}>No posts yet</Text>
            <Text style={[typography.body, { color: colors.textMuted, textAlign: 'center', marginBottom: layout.padding.xl }]}>
                Complete your profile and select interests to see personalized content.
            </Text>
            <TouchableOpacity
                style={[styles.retryButton, { backgroundColor: colors.accent }]}
                onPress={onRetry}
                activeOpacity={0.8}
            >
                <RefreshCw color={colors.onAccent} size={18} />
                <Text style={[typography.h3, { color: colors.onAccent, marginLeft: layout.padding.s }]}>Retry</Text>
            </TouchableOpacity>
        </View>
    );
};

export default function HomeScreen({ navigation }: any) {
    const { colors, globalStyles } = useTheme();
    const { token } = useAuth();
    const [items, setItems] = useState<FeedItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadFeed = async () => {
        if (!token) return;

        setLoading(true);
        setError(null);

        try {
            let coords: { latitude: number; longitude: number } | null = null;
            try {
                const perm = await Location.getForegroundPermissionsAsync();
                if (perm.status === 'granted') {
                    const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
                    coords = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
                }
            } catch {
                // ignore location errors
                console.log('[HomeScreen] Location permission not granted');
            }

            console.log('[HomeScreen] Fetching feed with coords:', coords);

            // Add timeout to prevent infinite loading
            const feedPromise = getFeed(token, {
                limit: 30,
                lat: coords?.latitude,
                lon: coords?.longitude,
            });

            const timeoutPromise = new Promise<never>((_, reject) =>
                setTimeout(() => reject(new Error('Feed request timeout after 10s')), 10000)
            );

            const feed = await Promise.race([feedPromise, timeoutPromise]);
            console.log('[HomeScreen] Feed loaded:', feed.length, 'items');
            setItems(feed);
        } catch (err: any) {
            console.error('[HomeScreen] Feed error:', err);
            setError(err?.message || 'Failed to load feed');
            setItems([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadFeed();
    }, [token]);

    const onView = useMemo(
        () => (postId: string) => {
            if (!token) return;
            recordFeedActivity(token, postId, 'view').catch(() => { });
        },
        [token]
    );

    const onLike = useMemo(
        () => (postId: string) => {
            if (!token) return;
            recordFeedActivity(token, postId, 'like').catch(() => { });
        },
        [token]
    );

    if (loading) {
        return <LoadingPlaceholder />;
    }

    if (items.length === 0) {
        return <EmptyState onRetry={loadFeed} />;
    }

    return (
        <View style={globalStyles.container}>
            <FlatList
                data={items}
                renderItem={({ item }) => <DiscoveryCard item={item} navigation={navigation} onView={onView} onLike={onLike} />}
                keyExtractor={item => item.id}
                pagingEnabled
                showsVerticalScrollIndicator={false}
                snapToInterval={height}
                snapToAlignment="start"
                decelerationRate="fast"
            />
        </View>
    );
}

const styles = StyleSheet.create({
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        width,
        height,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        width,
        height,
    },
    retryButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 20,
    },
});

function createStyles({
    colors,
    typography,
    layout,
}: {
    colors: any;
    typography: any;
    layout: any;
}) {
    const shadowStyle = {
        textShadowColor: 'rgba(0,0,0,0.6)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 4,
    };

    return StyleSheet.create({
        cardContainer: {
            width,
            height: height,
            position: 'relative',
            backgroundColor: colors.background,
        },
        backgroundImage: {
            ...StyleSheet.absoluteFillObject,
        },
        topGradient: {
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 180,
        },
        bottomGradient: {
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: 450,
        },
        header: {
            position: 'absolute',
            top: StatusBar.currentHeight ? StatusBar.currentHeight + 20 : 60,
            left: layout.padding.m,
            right: layout.padding.m,
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            zIndex: 10,
        },
        avatarPlaceholder: {
            width: 44,
            height: 44,
            borderRadius: 22,
            backgroundColor: colors.accent,
            borderWidth: 2,
            borderColor: 'rgba(255,255,255,0.3)',
        },
        username: {
            ...typography.bodyLarge,
            fontWeight: '700',
            color: 'white',
            ...shadowStyle,
        },
        distance: {
            ...typography.caption,
            color: 'rgba(255,255,255,0.8)',
            marginLeft: 4,
            ...shadowStyle,
        },
        verifiedBadge: {
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 12,
            paddingVertical: 8,
            borderRadius: layout.radius.round,
            overflow: 'hidden',
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.15)',
            backgroundColor: Platform.OS === 'android' ? 'rgba(0,0,0,0.4)' : 'transparent',
        },
        verifiedText: {
            ...typography.caption,
            fontWeight: '800',
            color: colors.accent,
            marginLeft: 6,
        },
        contentArea: {
            position: 'absolute',
            bottom: TAB_BAR_HEIGHT + 30,
            left: 0,
            right: 0,
            paddingHorizontal: layout.padding.m,
            flexDirection: 'row-reverse',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
        },
        actionSidebar: {
            alignItems: 'center',
            gap: 24,
            marginBottom: 10,
        },
        actionButton: {
            alignItems: 'center',
            justifyContent: 'center',
        },
        actionText: {
            ...typography.caption,
            color: 'white',
            marginTop: 6,
            fontWeight: '700',
            ...shadowStyle,
        },
        textContainer: {
            flex: 1,
            paddingRight: layout.padding.l,
        },
        title: {
            ...typography.h1,
            color: 'white',
            marginBottom: 8,
            ...shadowStyle,
            textShadowRadius: 8,
        },
        description: {
            ...typography.body,
            color: 'rgba(255,255,255,0.9)',
            marginBottom: 20,
            lineHeight: 22,
            ...shadowStyle,
        },
        navigateButton: {
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: colors.accent,
            alignSelf: 'flex-start',
            paddingHorizontal: 24,
            paddingVertical: 14,
            borderRadius: layout.radius.round,
            ...Shadows.glow(colors.accent),
        },
        navigateText: {
            ...typography.h3,
            fontWeight: '800',
            color: colors.onAccent,
            marginLeft: 10,
        }
    });
}
