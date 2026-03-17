import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, Dimensions, Image, TouchableOpacity, StatusBar, ScrollView, Share, Alert, Platform } from 'react-native';
import { useTheme } from '../../constants/ThemeContext';
import { MapPin, Heart, MessageCircle, Share2, Navigation, Star } from 'lucide-react-native';
import { BlurView } from 'expo-blur';

const { width, height } = Dimensions.get('window');
const TAB_BAR_HEIGHT = 85;

// Mock Data
const DISCOVERIES = [
    {
        id: '1',
        user: 'Sarah K.',
        title: 'Hidden Rooftop Matchaa',
        description: 'Found this insane secret matcha place above the old bookstore. Vibe is 10/10.',
        image: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24',
        tags: ['Hidden gem', 'Cafe', 'Quiet'],
        likes: 124,
        comments: 18,
        distance: '1.2 km',
        verified: true,
    },
    {
        id: '2',
        user: 'Alex M.',
        title: 'Midnight Ramen Stand',
        description: 'Only opens after 11 PM. Best spicy miso bowl in the city hands down. Usually a line.',
        image: 'https://images.unsplash.com/photo-1552611052-33e04de081de',
        tags: ['Street food', 'Late night', 'Spicy'],
        likes: 342,
        comments: 56,
        distance: '3.5 km',
        verified: true,
    },
    {
        id: '3',
        user: 'Priya D.',
        title: 'Vintage Thrift Pop-up',
        description: 'They just set up in the warehouse district for the weekend. Vintage jackets for crazy cheap.',
        image: 'https://images.unsplash.com/photo-1528698827591-e19ccd7bc23d',
        tags: ['Thrifting', 'Weekend only', 'Cheap'],
        likes: 89,
        comments: 5,
        distance: '0.8 km',
        verified: false,
    }
];

const DiscoveryCard = ({ item, navigation }: any) => {
    const { colors, typography, layout, globalStyles, mode } = useTheme();
    const isAndroid = Platform.OS === 'android';
    const [liked, setLiked] = useState(false);
    const [likeCount, setLikeCount] = useState(item.likes);

    const styles = React.useMemo(() => createStyles({ colors, typography, layout, globalStyles }), [colors, typography, layout, globalStyles]);

    const handleLike = () => {
        setLiked(!liked);
        setLikeCount(liked ? likeCount - 1 : likeCount + 1);
    };

    const handleShare = async () => {
        try {
            await Share.share({
                message: `Check out ${item.title} on AroundYou! Download the app to discover it.`,
            });
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <View style={styles.cardContainer}>
            <Image
                source={{ uri: item.image }}
                style={styles.backgroundImage}
                resizeMode="cover"
            />

            {/* Top Gradient Overlay for Header */}
            <View style={styles.topGradient} />

            {/* Header Info */}
            <View style={styles.header}>
                <View style={globalStyles.row}>
                    <View style={styles.avatarPlaceholder} />
                    <View style={{ marginLeft: 10 }}>
                        <Text style={styles.username}>{item.user}</Text>
                        <View style={globalStyles.row}>
                            <MapPin color={colors.textMuted} size={12} />
                            <Text style={styles.distance}>{item.distance}</Text>
                        </View>
                    </View>
                </View>
                {item.verified && (
                    isAndroid ? (
                        <View style={[styles.verifiedBadge, { backgroundColor: colors.glassSurface, borderColor: colors.glassBorder }]}>
                            <Star color={colors.accent} size={14} fill={colors.accent} />
                            <Text style={styles.verifiedText}>Verified</Text>
                        </View>
                    ) : (
                        <BlurView intensity={30} tint={mode === 'dark' ? 'dark' : 'light'} style={styles.verifiedBadge}>
                            <Star color={colors.accent} size={14} fill={colors.accent} />
                            <Text style={styles.verifiedText}>Verified</Text>
                        </BlurView>
                    )
                )}
            </View>

            {/* Bottom Gradient for Content */}
            <View style={styles.bottomGradient} />

            {/* Content Area */}
            <View style={styles.contentArea}>
                {/* Right Side Actions */}
                <View style={styles.actionSidebar}>
                    <TouchableOpacity style={styles.actionButton} onPress={handleLike} activeOpacity={0.7}>
                        <Heart color={liked ? colors.danger : "white"} fill={liked ? colors.danger : "transparent"} size={32} strokeWidth={liked ? 0 : 2} />
                        <Text style={styles.actionText}>{likeCount}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionButton} onPress={() => Alert.alert('Comments', 'Comments section opening...')} activeOpacity={0.7}>
                        <MessageCircle color="white" size={32} />
                        <Text style={styles.actionText}>{item.comments}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionButton} onPress={handleShare} activeOpacity={0.7}>
                        <Share2 color="white" size={32} />
                        <Text style={styles.actionText}>Share</Text>
                    </TouchableOpacity>
                </View>

                {/* Text details */}
                <View style={styles.textContainer}>
                    <Text style={styles.title}>{item.title}</Text>
                    <Text style={styles.description} numberOfLines={2}>{item.description}</Text>

                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tagsScroll}>
                        {item.tags.map((tag: string, idx: number) => (
                            <View key={idx} style={styles.tag}>
                                <Text style={styles.tagText}>{tag}</Text>
                            </View>
                        ))}
                    </ScrollView>

                    <TouchableOpacity
                        style={styles.navigateButton}
                        onPress={() => navigation.navigate('PlaceDetail', { item })}
                        activeOpacity={0.8}
                    >
                        <Navigation color={colors.onPrimary} size={18} fill={colors.onPrimary} />
                        <Text style={styles.navigateText}>I'm Going</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
};

export default function HomeScreen({ navigation }: any) {
    const { globalStyles } = useTheme();
    return (
        <View style={globalStyles.container}>
            <FlatList
                data={DISCOVERIES}
                renderItem={({ item }) => <DiscoveryCard item={item} navigation={navigation} />}
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
        height: 150,
        backgroundColor: 'rgba(0,0,0,0.5)', // Placeholder for LinearGradient
    },
    bottomGradient: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 400,
        backgroundColor: 'rgba(0,0,0,0.7)', // Placeholder for LinearGradient
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
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: colors.primary,
    },
    username: {
        ...typography.bodyLarge,
        fontWeight: '700',
        color: 'white',
        textShadowColor: 'rgba(0,0,0,0.5)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 3,
    },
    distance: {
        ...typography.caption,
        color: '#E5E7EB',
        marginLeft: 4,
        textShadowColor: 'rgba(0,0,0,0.5)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 3,
    },
    verifiedBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: layout.radius.round,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    verifiedText: {
        ...typography.caption,
        fontWeight: '700',
        color: colors.accent,
        marginLeft: 4,
    },
    contentArea: {
        position: 'absolute',
        bottom: TAB_BAR_HEIGHT + 20,
        left: 0,
        right: 0,
        paddingHorizontal: layout.padding.m,
        flexDirection: 'row-reverse',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
    },
    actionSidebar: {
        alignItems: 'center',
        gap: 20,
        marginBottom: 10,
    },
    actionButton: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    actionText: {
        ...typography.caption,
        color: 'white',
        marginTop: 4,
        fontWeight: '600',
        textShadowColor: 'rgba(0,0,0,0.5)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 3,
    },
    textContainer: {
        flex: 1,
        paddingRight: layout.padding.xl,
    },
    title: {
        ...typography.h1,
        color: 'white',
        marginBottom: 8,
        textShadowColor: 'rgba(0,0,0,0.5)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
    },
    description: {
        ...typography.body,
        color: '#F3F4F6',
        marginBottom: 12,
        lineHeight: 22,
        textShadowColor: 'rgba(0,0,0,0.5)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 3,
    },
    tagsScroll: {
        flexDirection: 'row',
        marginBottom: 16,
    },
    tag: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: layout.radius.s,
        marginRight: 8,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.3)',
    },
    tagText: {
        ...typography.caption,
        fontWeight: '600',
        color: 'white',
    },
    navigateButton: {
        ...globalStyles.row,
        backgroundColor: colors.primary,
        alignSelf: 'flex-start',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: layout.radius.round,
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
        elevation: 5,
    },
    navigateText: {
        ...typography.body,
        fontWeight: '800',
        color: colors.onPrimary,
        marginLeft: 8,
    }
    });
}
