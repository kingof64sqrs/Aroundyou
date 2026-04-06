import React, { useEffect, useState, useRef, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, Dimensions, Image, TouchableOpacity, Share, Platform, ActivityIndicator, Animated } from 'react-native';
import { useTheme } from '../../constants/ThemeContext';
import { MapPin, Heart, Bookmark, Share2, Flame, CheckCircle, Navigation, Star, Users } from 'lucide-react-native';
import { BlurView } from 'expo-blur';
import * as Location from 'expo-location';
import { FeedItem, getFeed, recordFeedActivity } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width: windowWidth, height: windowHeight } = Dimensions.get('window');

const PLAIN_PHOTOS = [
    'https://images.unsplash.com/photo-1493246507139-91e8fad9978e?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1513694203232-719a280e022f?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1449247709967-d4461a6a6103?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1507608616759-54f48f0af0ee?q=80&w=1200&auto=format&fit=crop',
];

function feedImage(seed: string) {
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
        hash = seed.charCodeAt(i) + ((hash << 5) - hash);
    }
    return PLAIN_PHOTOS[Math.abs(hash) % PLAIN_PHOTOS.length];
}

function auraPoints(seed: string) {
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
        hash = seed.charCodeAt(i) + ((hash << 5) - hash);
    }
    // 100..9999, stable per post id
    return 100 + (Math.abs(hash) % 9900);
}

// -------------------------------------------------------------
// Top Navigation Bar (Fixed Overlay)
// -------------------------------------------------------------
const TopNav = ({ me, scrollY }: any) => {
    // Hide the title and background when scrolled past 100px
    const headerOpacity = scrollY.interpolate({
        inputRange: [0, 100],
        outputRange: [1, 0],
        extrapolate: 'clamp'
    });

    return (
        <View style={styles.topNav} pointerEvents="box-none">
            {/* Animated Backgound Blur */}
            <Animated.View style={[StyleSheet.absoluteFill, { opacity: headerOpacity }]}>
                {Platform.OS !== 'android' ? (
                    <BlurView tint="dark" intensity={80} style={StyleSheet.absoluteFill} />
                ) : (
                    <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(14,14,16,0.85)' }]} />
                )}
            </Animated.View>

            <View style={styles.topNavContent} pointerEvents="box-none">
                {/* App Name and Icon hide smoothly */}
                <Animated.View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, opacity: headerOpacity }}>
                    <Flame color="#00f1fe" size={24} />
                    <Text style={styles.topNavTitle}>AroundYou</Text>
                </Animated.View>

                <View />
            </View>
        </View>
    );
};

// -------------------------------------------------------------
// Horizontal Trending Card
// -------------------------------------------------------------
const TrendingCard = ({ item, navigation, onView }: any) => {
    return (
        <TouchableOpacity
            style={styles.trendingCard}
            activeOpacity={0.8}
            onPress={() => {
                onView(item.id);
                navigation.navigate('PlaceDetail', { postId: item.id, placeId: item.place_id });
            }}
        >
            <Image
                source={{ uri: feedImage(item.id + 'trend') }}
                style={StyleSheet.absoluteFillObject}
                resizeMode="cover"
            />
            <View style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(0,0,0,0.5)' }]} />
            <View style={styles.trendingContent}>
                <View style={styles.liveBadge}>
                    <View style={styles.liveDot} />
                    <Text style={styles.liveText}>Live Event</Text>
                </View>
                <Text style={styles.trendingTitle} numberOfLines={1}>{item.caption || 'Trending Now'}</Text>
            </View>
        </TouchableOpacity>
    );
};

// -------------------------------------------------------------
// Tonight Near You Header (Rendered inside FlatList)
// -------------------------------------------------------------
const TonightNearYouHeader = ({ trendingItems, navigation, onView }: any) => {
    const { colors, typography } = useTheme();

    return (
        <View style={styles.tonightHeaderContainer}>
            <View style={styles.sectionHeader}>
                <Text style={typography.h2}>Tonight <Text style={{ color: '#00e2ee' }}>Near You</Text></Text>
            </View>
            <FlatList
                data={trendingItems}
                keyExtractor={i => i.id + 'trend'}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 20, gap: 16 }}
                renderItem={({ item }) => <TrendingCard item={item} navigation={navigation} onView={onView} />}
            />
            <View style={styles.headerSpacer} />
        </View>
    );
};

// -------------------------------------------------------------
// Vertical Vibe Check Card (Full Page Snap)
// -------------------------------------------------------------
const VibeCheckCard = ({ item, navigation, onView, onLike }: any) => {
    const { colors, typography } = useTheme();
    const [liked, setLiked] = useState(false);
    const [likeCount, setLikeCount] = useState(Math.floor(Math.random() * 1000) + 100);
    const points = useMemo(() => item.aura_points ?? auraPoints(item.id), [item.aura_points, item.id]);

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
                message: `Check out ${item.caption || 'this discovery'} on AroundYou!`,
            });
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <View style={styles.vibeCardContainer}>
            <Image
                source={{ uri: feedImage(item.id) }}
                style={StyleSheet.absoluteFillObject}
                resizeMode="cover"
            />
            {/* Simple smooth full screen gradient instead of ugly blocks (four shades) to keep it simple plain photos */}
            <View style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(0,0,0,0.4)' }]} />

            {/* Aura Score (Top Right) */}
            <View style={styles.auraScoreCard}>
                <Text style={styles.auraScoreLabel}>AURA</Text>
                <Text style={styles.auraScoreValue}>9.8</Text>
                <View style={styles.auraScoreBarWrap}>
                    <View style={styles.auraScoreBarFill} />
                </View>
            </View>

            {/* Aura Points (Per Post) */}
            <View style={[styles.auraPill, styles.postAuraPill]}>
                <Flame color="#ff51fa" size={14} fill="#ff51fa" />
                <Text style={styles.auraPillText}>{points} Aura</Text>
            </View>

            {/* Right Action Bar */}
            <View style={styles.actionBar}>
                <View style={styles.actionItem}>
                    <TouchableOpacity style={[styles.actionBtn, { backgroundColor: liked ? '#00f1fe' : 'rgba(24,24,27,0.6)' }]} onPress={handleLike}>
                        <Heart color={liked ? '#09090b' : '#fff'} fill={liked ? '#09090b' : "transparent"} size={26} />
                    </TouchableOpacity>
                    <Text style={styles.actionText}>Vibe Check</Text>
                </View>

                <View style={styles.actionItem}>
                    <TouchableOpacity style={styles.actionBtn}>
                        <MapPin color="#fff" size={26} />
                    </TouchableOpacity>
                    <Text style={styles.actionText}>Drop Pin</Text>
                </View>

                <View style={styles.actionItem}>
                    <TouchableOpacity style={styles.actionBtn} onPress={handleShare}>
                        <Share2 color="#fff" size={26} />
                    </TouchableOpacity>
                    <Text style={styles.actionText}>Flex</Text>
                </View>
            </View>

            {/* Bottom Info Section */}
            <View style={styles.vibeCardBottom}>
                <View style={styles.vibeBadgesRow}>
                    <View style={styles.hypePill}>
                        <Users size={12} color="#00f1fe" />
                        <Text style={styles.hypeText}>12.5k Hype</Text>
                    </View>
                </View>

                <Text style={styles.vibeTitle} numberOfLines={2}>{item.caption || 'Void Rave 01'}</Text>
                <Text style={styles.vibeDesc} numberOfLines={1}>Secret Industrial Complex • Berlin</Text>

                <View style={styles.verifiedCommunityBadge}>
                    <Text style={styles.verifiedCommunityText}>Verified by 128 Main Characters</Text>
                </View>
            </View>
        </View>
    );
};

// -------------------------------------------------------------
// Home Screen Main
// -------------------------------------------------------------
const HEADER_HEIGHT = 380; // Height allocated for "Tonight Near You" block 

export default function HomeScreen({ navigation }: any) {
    const { colors, globalStyles } = useTheme();
    const { token, me } = useAuth();
    const [items, setItems] = useState<FeedItem[]>([]);
    const [loading, setLoading] = useState(true);

    const scrollY = useRef(new Animated.Value(0)).current;

    const loadFeed = async () => {
        if (!token) return;
        setLoading(true);
        try {
            let coords = null;
            try {
                const perm = await Location.getForegroundPermissionsAsync();
                if (perm.status === 'granted') {
                    const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
                    coords = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
                }
            } catch (e) { }

            const feed = await getFeed(token, { limit: 30, lat: coords?.latitude, lon: coords?.longitude });
            setItems(feed);
        } catch (err: any) {
            console.error('[HomeScreen] Feed error:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadFeed();
    }, [token]);

    const onView = (postId: string) => { if (token) recordFeedActivity(token, postId, 'view').catch(() => { }); };
    const onLike = (postId: string) => { if (token) recordFeedActivity(token, postId, 'like').catch(() => { }); };

    if (loading) {
        return (
            <View style={[globalStyles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color="#00f1fe" />
            </View>
        );
    }

    const trendingItems = items.slice(0, 5);
    const feedItems = items.slice(5);

    // Compute explicit snap offsets: 0, HEADER_HEIGHT, HEADER_HEIGHT+WINDOW_HEIGHT, etc.
    const offsets = [
        0,
        HEADER_HEIGHT,
        ...feedItems.map((_, i) => HEADER_HEIGHT + windowHeight * (i + 1))
    ];

    return (
        <View style={styles.rootContainer}>
            <TopNav me={me} scrollY={scrollY} />

            <Animated.FlatList
                data={feedItems}
                keyExtractor={(item: any) => item.id}
                showsVerticalScrollIndicator={false}
                decelerationRate="fast"
                snapToOffsets={offsets}
                snapToAlignment="start"
                onScroll={Animated.event(
                    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                    { useNativeDriver: true }
                )}
                scrollEventThrottle={16}
                ListHeaderComponent={
                    <TonightNearYouHeader
                        trendingItems={trendingItems}
                        navigation={navigation}
                        onView={onView}
                    />
                }
                renderItem={({ item }) => (
                    <VibeCheckCard
                        item={item}
                        navigation={navigation}
                        onView={onView}
                        onLike={onLike}
                    />
                )}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    rootContainer: {
        flex: 1,
        backgroundColor: '#0e0e10',
    },
    topNav: {
        position: 'absolute',
        top: 0, left: 0, right: 0,
        height: 100,
        paddingTop: Platform.OS === 'ios' ? 40 : 20,
        zIndex: 50,
        justifyContent: 'center',
    },
    topNavContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
    },
    topNavTitle: {
        fontFamily: 'SpaceGrotesk_700Bold',
        fontSize: 24,
        color: '#00f1fe',
        letterSpacing: -1,
        textTransform: 'uppercase',
        textShadowColor: 'rgba(0,242,255,0.8)',
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 8,
    },
    auraPill: {
        flexDirection: 'row', alignItems: 'center', gap: 4,
        backgroundColor: '#19191c',
        paddingHorizontal: 12, paddingVertical: 6,
        borderRadius: 99,
        borderWidth: 1, borderColor: 'rgba(72,71,74,0.2)',
    },
    auraPillText: {
        fontFamily: 'SpaceGrotesk_700Bold',
        fontSize: 12, color: '#fffbfe',
        textTransform: 'uppercase', letterSpacing: -0.5,
    },
    postAuraPill: {
        position: 'absolute',
        top: 130,
        left: 24,
        zIndex: 20,
    },
    tonightHeaderContainer: {
        height: HEADER_HEIGHT,
        paddingTop: 110,
        backgroundColor: '#0e0e10',
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        paddingHorizontal: 24,
        marginBottom: 16,
    },
    sectionLabel: {
        fontFamily: 'SpaceGrotesk_700Bold',
        fontSize: 10,
        color: '#abaab1',
        letterSpacing: 1.5,
        textTransform: 'uppercase',
    },
    trendingCard: {
        width: 280,
        height: 176,
        borderRadius: 16,
        backgroundColor: '#1e1f26',
        overflow: 'hidden',
        position: 'relative',
    },
    trendingContent: {
        position: 'absolute',
        bottom: 16, left: 16, right: 16,
    },
    liveBadge: {
        flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6,
    },
    liveDot: {
        width: 8, height: 8, borderRadius: 4, backgroundColor: '#fd8b00',
    },
    liveText: {
        fontFamily: 'SpaceGrotesk_700Bold',
        fontSize: 10, color: '#fd8b00', textTransform: 'uppercase', letterSpacing: -0.5,
    },
    trendingTitle: {
        fontFamily: 'SpaceGrotesk_700Bold',
        fontSize: 18, color: '#ffffff',
    },
    headerSpacer: {
        flex: 1, // Fills remaining height from 380
    },
    // Vibe Check Vertical Cards
    vibeCardContainer: {
        width: windowWidth,
        height: windowHeight,
        position: 'relative',
        backgroundColor: '#000',
    },
    auraScoreCard: {
        position: 'absolute',
        top: 130, right: 24, zIndex: 10,
        backgroundColor: 'rgba(9,9,11,0.8)',
        borderTopWidth: 2, borderTopColor: '#00f1fe',
        padding: 16,
        alignItems: 'center',
        shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.5, shadowRadius: 20, elevation: 15,
    },
    auraScoreLabel: {
        fontFamily: 'SpaceGrotesk_700Bold',
        fontSize: 10, textTransform: 'uppercase', color: '#00f1fe', letterSpacing: 2, marginBottom: 4,
    },
    auraScoreValue: {
        fontFamily: 'SpaceGrotesk_700Bold',
        fontSize: 36, color: '#fff',
    },
    auraScoreBarWrap: {
        width: '100%', height: 4, backgroundColor: '#27272a', marginTop: 8,
    },
    auraScoreBarFill: {
        position: 'absolute', top: 0, left: 0, bottom: 0, width: '98%',
        backgroundColor: '#00f1fe',
        shadowColor: '#00f1fe', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 1, shadowRadius: 10,
    },
    actionBar: {
        position: 'absolute',
        right: 24, bottom: 140,
        alignItems: 'center', gap: 32, zIndex: 20,
    },
    actionItem: {
        alignItems: 'center', gap: 8,
    },
    actionBtn: {
        width: 56, height: 56, borderRadius: 28,
        backgroundColor: 'rgba(24,24,27,0.6)',
        borderWidth: 1, borderColor: 'rgba(113,113,122,0.5)',
        alignItems: 'center', justifyContent: 'center',
    },
    actionText: {
        fontFamily: 'SpaceGrotesk_700Bold',
        fontSize: 10, color: '#fff',
    },
    vibeCardBottom: {
        position: 'absolute',
        bottom: 120, left: 24, right: 80, zIndex: 10,
    },
    vibeBadgesRow: {
        flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16,
    },
    hypePill: {
        flexDirection: 'row', alignItems: 'center', gap: 4,
        backgroundColor: 'rgba(24,24,27,0.4)',
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)',
        paddingHorizontal: 8, paddingVertical: 4, borderRadius: 99,
    },
    hypeText: {
        fontFamily: 'PlusJakartaSans_700Bold',
        fontSize: 10, color: 'rgba(255,255,255,0.8)',
    },
    vibeTitle: {
        fontFamily: 'SpaceGrotesk_700Bold',
        fontSize: 40, color: '#fff', letterSpacing: -1, marginBottom: 4,
    },
    vibeDesc: {
        fontFamily: 'PlusJakartaSans_500Medium',
        fontSize: 14, color: '#a1a1aa', maxWidth: 250, marginBottom: 16,
    },
    verifiedCommunityBadge: {
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
        paddingHorizontal: 16, paddingVertical: 8, borderRadius: 99, alignSelf: 'flex-start',
    },
    verifiedCommunityText: {
        fontFamily: 'SpaceGrotesk_700Bold',
        fontSize: 10, color: '#ff51fa', textTransform: 'uppercase', letterSpacing: 0.5,
    }
});
