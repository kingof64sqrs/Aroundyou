import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useTheme } from '../../constants/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { getBookmarks, getVisits, listPosts, PlacePublic, PostPublic } from '../../services/api';
import { MapPin, ArrowLeft, History, Bookmark, Compass, Image as ImageIcon } from 'lucide-react-native';
import { Shadows } from '../../constants/Theme';

export default function UserActivityScreen({ route, navigation }: any) {
    const { colors, typography, layout, globalStyles, mode } = useTheme();
    const { token, me } = useAuth();

    // type can be 'discoveries', 'saved', or 'visited'
    const { type, title } = route.params;

    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!token) return;
        setLoading(true);

        const fetchData = async () => {
            try {
                if (type === 'saved') {
                    const res = await getBookmarks(token);
                    setData(res);
                } else if (type === 'visited') {
                    const res = await getVisits(token);
                    setData(res);
                } else if (type === 'discoveries' && me?.id) {
                    const res = await listPosts({ user_id: me.id });
                    setData(res);
                }
            } catch (err) {
                console.warn(`Failed to fetch ${type}:`, err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [type, token, me?.id]);

    const styles = useMemo(() => createStyles({ colors, typography, layout }), [colors, typography, layout]);

    const renderPlace = ({ item }: { item: PlacePublic }) => (
        <View style={styles.card}>
            <View style={styles.iconBox}>
                <MapPin color={colors.accent} size={24} />
            </View>
            <View style={styles.cardInfo}>
                <Text style={styles.cardTitle} numberOfLines={1}>{item.name}</Text>
                <Text style={styles.cardSubtitle}>{item.category || 'Location'}</Text>
            </View>
        </View>
    );

    const renderPost = ({ item }: { item: PostPublic }) => (
        <View style={styles.card}>
            <View style={styles.iconBox}>
                <ImageIcon color={colors.accent} size={24} />
            </View>
            <View style={styles.cardInfo}>
                <Text style={styles.cardTitle} numberOfLines={1}>{item.caption || 'A beautiful discovery'}</Text>
                {item.hashtags && item.hashtags.length > 0 && (
                    <Text style={styles.cardSubtitle}>#{item.hashtags.join(' #')}</Text>
                )}
            </View>
        </View>
    );

    let Icon = History;
    let fallbackText = "You haven't made any discoveries yet.";
    if (type === 'saved') {
        Icon = Bookmark;
        fallbackText = "You haven't saved any places yet.";
    } else if (type === 'visited') {
        Icon = Compass;
        fallbackText = "You haven't visited any places yet.";
    }

    return (
        <View style={globalStyles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <ArrowLeft color={colors.text} size={24} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{title}</Text>
                <View style={{ width: 44 }} />
            </View>

            {loading ? (
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color={colors.accent} />
                </View>
            ) : data.length === 0 ? (
                <View style={styles.centerContainer}>
                    <Icon color={colors.textMuted} size={64} style={{ marginBottom: 16, opacity: 0.5 }} />
                    <Text style={[typography.bodyLarge, { color: colors.textMuted, textAlign: 'center', paddingHorizontal: 32 }]}>
                        {fallbackText}
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={data}
                    keyExtractor={(item: any) => item.id}
                    contentContainerStyle={styles.listContent}
                    renderItem={({ item }) =>
                        type === 'discoveries' ? renderPost({ item: item as any }) : renderPlace({ item: item as any })
                    }
                />
            )}
        </View>
    );
}

function createStyles({ colors, typography, layout }: any) {
    return StyleSheet.create({
        header: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingTop: 60,
            paddingBottom: layout.padding.m,
            paddingHorizontal: layout.padding.m,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
            backgroundColor: colors.surface,
        },
        backBtn: {
            width: 44, height: 44,
            justifyContent: 'center', alignItems: 'center',
        },
        headerTitle: {
            ...typography.h3,
            color: colors.text,
        },
        centerContainer: {
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
        },
        listContent: {
            padding: layout.padding.m,
            paddingBottom: 100,
        },
        card: {
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: colors.surface,
            padding: layout.padding.m,
            marginBottom: layout.padding.m,
            borderRadius: layout.radius.m,
            borderWidth: 1,
            borderColor: colors.border,
            ...Shadows.soft,
        },
        iconBox: {
            width: 48, height: 48,
            borderRadius: 24,
            backgroundColor: colors.surfaceHighlight,
            justifyContent: 'center', alignItems: 'center',
            marginRight: layout.padding.m,
        },
        cardInfo: {
            flex: 1,
        },
        cardTitle: {
            ...typography.bodyLarge,
            color: colors.text,
            fontWeight: '600',
            marginBottom: 4,
        },
        cardSubtitle: {
            ...typography.caption,
            color: colors.textMuted,
        },
    });
}
