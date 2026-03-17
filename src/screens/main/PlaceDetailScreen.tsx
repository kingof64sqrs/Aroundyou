import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, Dimensions, Share, Alert, Platform } from 'react-native';
import { useTheme } from '../../constants/ThemeContext';
import { ChevronLeft, Heart, Share2, MapPin, Navigation, Bookmark, Users, CheckCircle } from 'lucide-react-native';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

export default function PlaceDetailScreen({ route, navigation }: any) {
    const { colors, typography, layout, globalStyles, mode } = useTheme();
    const insets = useSafeAreaInsets();
    const isAndroid = Platform.OS === 'android';

    // Using optional chaining and fallback
    const item = route?.params?.item || {
        title: 'Hidden Rooftop Matcha',
        user: 'Sarah K.',
        description: 'Found this insane secret matcha place above the old bookstore. Vibe is 10/10. Highly recommend coming around sunset.',
        image: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24',
        tags: ['Hidden gem', 'Cafe', 'Quiet'],
        likes: 124,
        distance: '1.2 km',
        verified: true,
    };

    const [liked, setLiked] = useState(false);
    const [saved, setSaved] = useState(false);

    const handleShare = async () => {
        try {
            await Share.share({
                message: `Check out ${item.title} on AroundYou! Download the app to explore.`,
            });
        } catch (error) {
            console.error(error);
        }
    };

    const handleAction = () => {
        Alert.alert("Awesome!", "You're all set to go. We'll track your arrival for XP points!");
        // Simulate a delay then pop back
        setTimeout(() => navigation.goBack(), 1500);
    };

    const styles = React.useMemo(() => createStyles({ colors, typography, layout, globalStyles }), [colors, typography, layout, globalStyles]);

    return (
        <View style={globalStyles.container}>
            {/* Hero Image */}
            <View style={styles.heroContainer}>
                <Image source={{ uri: item.image }} style={styles.heroImage} />

                {/* Back Button */}
                <TouchableOpacity style={[styles.backBtn, { top: (insets.top || 0) + 10 }]} onPress={() => navigation.goBack()} activeOpacity={0.8}>
                    <ChevronLeft color="#fff" size={28} />
                </TouchableOpacity>

                <View style={styles.imageOverlay} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* Main Details */}
                <View style={styles.contentSection}>
                    <Text style={styles.title}>{item.title}</Text>

                    <View style={globalStyles.rowBetween}>
                        <View style={globalStyles.row}>
                            <View style={styles.avatarMini} />
                            <Text style={styles.username}>Shared by {item.user}</Text>
                        </View>
                        <View style={globalStyles.row}>
                            <MapPin color={colors.textMuted} size={14} />
                            <Text style={styles.distance}>{item.distance}</Text>
                        </View>
                    </View>

                    {/* Verification Banner */}
                    {item.verified && (
                        <View style={styles.verifiedBanner}>
                            <CheckCircle color={colors.accent} size={16} />
                            <Text style={styles.verifiedText}>Community Verified (17 visits this week)</Text>
                        </View>
                    )}

                    {/* Action Row */}
                    <View style={styles.actionRow}>
                        <TouchableOpacity style={styles.actionIconBtn} onPress={() => setLiked(!liked)} activeOpacity={0.7}>
                            <Heart color={liked ? colors.danger : colors.text} fill={liked ? colors.danger : "transparent"} size={28} />
                            <Text style={[styles.actionLabel, liked && { color: colors.danger, fontWeight: 'bold' }]}>
                                {liked ? 'Liked' : 'Like'}
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.actionIconBtn} onPress={() => setSaved(!saved)} activeOpacity={0.7}>
                            <Bookmark color={saved ? colors.accent : colors.text} fill={saved ? colors.accent : "transparent"} size={28} />
                            <Text style={[styles.actionLabel, saved && { color: colors.accent, fontWeight: 'bold' }]}>
                                {saved ? 'Saved' : 'Save'}
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.actionIconBtn} onPress={handleShare} activeOpacity={0.7}>
                            <Share2 color={colors.text} size={28} />
                            <Text style={styles.actionLabel}>Share</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Description */}
                    <Text style={styles.sectionTitle}>About</Text>
                    <Text style={styles.description}>{item.description}</Text>

                    {/* Vibe Tags */}
                    <View style={styles.tagsContainer}>
                        {item.tags.map((tag: string, i: number) => (
                            <View key={i} style={styles.tagPill}>
                                <Text style={styles.tagPillText}>{tag}</Text>
                            </View>
                        ))}
                    </View>

                    {/* Who's Here */}
                    <View style={styles.whosHereContainer}>
                        <View style={globalStyles.row}>
                            <Users color={colors.primary} size={20} />
                            <Text style={[typography.body, { marginLeft: 8, fontWeight: '600' }]}>3 Explorers here right now</Text>
                        </View>
                        <Text style={{ ...typography.bodySmall, marginTop: 4, color: colors.textMuted }}>Unlock to see details</Text>
                    </View>

                </View>
            </ScrollView>

            {/* Sticky Bottom Bar */}
            {isAndroid ? (
                <View style={[styles.bottomBar, { backgroundColor: colors.glassSurface, borderTopColor: colors.glassBorder }]}>
                    <TouchableOpacity style={styles.primaryBtn} onPress={handleAction} activeOpacity={0.8}>
                        <Navigation color={colors.onPrimary} size={20} fill={colors.onPrimary} />
                        <Text style={styles.primaryBtnText}>I'm Going</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <BlurView intensity={80} tint={mode === 'dark' ? 'dark' : 'light'} style={styles.bottomBar}>
                    <TouchableOpacity style={styles.primaryBtn} onPress={handleAction} activeOpacity={0.8}>
                        <Navigation color={colors.onPrimary} size={20} fill={colors.onPrimary} />
                        <Text style={styles.primaryBtnText}>I'm Going</Text>
                    </TouchableOpacity>
                </BlurView>
            )}
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
    heroContainer: {
        height: 350,
        width,
        position: 'relative',
    },
    heroImage: {
        ...StyleSheet.absoluteFillObject,
    },
    imageOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 100,
        backgroundColor: 'rgba(10,10,10,0.8)', // Simulated gradient
    },
    backBtn: {
        position: 'absolute',
        top: 50,
        left: layout.padding.m,
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    scrollContent: {
        paddingBottom: 100, // Space for sticky bottom bar
    },
    contentSection: {
        padding: layout.padding.m,
        marginTop: -20, // Slide up slightly over the image fade
    },
    title: {
        ...typography.h1,
        marginBottom: layout.padding.m,
    },
    avatarMini: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: colors.primary,
        marginRight: 8,
    },
    username: {
        ...typography.bodySmall,
        fontWeight: '600',
    },
    distance: {
        ...typography.bodySmall,
        marginLeft: 4,
    },
    verifiedBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 255, 135, 0.10)',
        borderWidth: 1,
        borderColor: 'rgba(0, 255, 135, 0.25)',
        borderRadius: layout.radius.s,
        padding: layout.padding.s,
        marginTop: layout.padding.l,
    },
    verifiedText: {
        ...typography.caption,
        color: colors.accent,
        marginLeft: 8,
        fontWeight: '600',
    },
    actionRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingVertical: layout.padding.xl,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        marginBottom: layout.padding.l,
    },
    actionIconBtn: {
        alignItems: 'center',
    },
    actionLabel: {
        ...typography.caption,
        marginTop: 6,
    },
    sectionTitle: {
        ...typography.h3,
        marginBottom: layout.padding.s,
    },
    description: {
        ...typography.bodyLarge,
        color: colors.textMuted,
        lineHeight: 26,
        marginBottom: layout.padding.l,
    },
    tagsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: layout.padding.xl,
    },
    tagPill: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: layout.radius.round,
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.glassBorder,
    },
    tagPillText: {
        ...typography.bodySmall,
    },
    whosHereContainer: {
        backgroundColor: colors.surfaceHighlight,
        borderRadius: layout.radius.m,
        padding: layout.padding.m,
        borderWidth: 1,
        borderColor: colors.glassBorder,
    },
    bottomBar: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: layout.padding.m,
        paddingBottom: 30, // Safe area
        borderTopWidth: 1,
        borderTopColor: colors.glassBorder,
    },
    primaryBtn: {
        flexDirection: 'row',
        backgroundColor: colors.primary,
        height: 56,
        borderRadius: layout.radius.round,
        justifyContent: 'center',
        alignItems: 'center',
    },
    primaryBtnText: {
        ...typography.h3,
        color: colors.onPrimary,
        fontWeight: '800',
        marginLeft: 8,
    }
    });
}
