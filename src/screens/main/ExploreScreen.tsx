import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions, TextInput, FlatList, Image, TouchableOpacity, SafeAreaView, Platform } from 'react-native';
import { useTheme } from '../../constants/ThemeContext';
import { Search, MapPin } from 'lucide-react-native';
import { BlurView } from 'expo-blur';
import { Shadows } from '../../constants/Theme';

const { width } = Dimensions.get('window');
const COLUMN_COUNT = 3;
const SPACING = 2;
const ITEM_WIDTH = (width - SPACING * (COLUMN_COUNT - 1)) / COLUMN_COUNT;

// Generate dummy data for the grid
const generateDummyPosts = (count: number) => {
    return Array.from({ length: count }).map((_, i) => {
        const isFocus = i % 10 === 0;
        return {
            id: `post-${i}`,
            imageUrl: `https://picsum.photos/seed/${i + 140}/400/${isFocus ? 800 : 400}`,
            type: isFocus ? 'reel' : 'photo',
        };
    });
};

const MOCK_PLACES = [
    { id: '1', name: 'Central Park', address: 'New York, NY', distance: '1.2 km' },
    { id: '2', name: 'Brooklyn Bridge', address: 'New York, NY', distance: '3.4 km' },
    { id: '3', name: 'Empire State Building', address: 'New York, NY', distance: '2.1 km' },
    { id: '4', name: 'Times Square', address: 'London, UK', distance: '0.8 km' },
];

const ExploreScreen = () => {
    const { colors, typography, layout, globalStyles, mode } = useTheme();
    const isAndroid = Platform.OS === 'android';
    const [searchQuery, setSearchQuery] = useState('');
    const [posts] = useState(generateDummyPosts(60));

    const styles = useMemo(() => createStyles({ colors, typography, layout, mode }), [colors, typography, layout, mode]);

    const renderHeader = () => (
        <View style={styles.headerContainer}>
            <Text style={styles.headerTitle}>Explore</Text>
            <View style={styles.searchBarWrapper}>
                <View style={styles.searchIconContainer}>
                    <Search color={colors.textMuted} size={20} />
                </View>
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search places..."
                    placeholderTextColor={colors.textMuted}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    returnKeyType="search"
                />
            </View>
        </View>
    );

    const renderGridItem = ({ item }: { item: any }) => (
        <TouchableOpacity activeOpacity={0.8} style={styles.gridItem}>
            <Image source={{ uri: item.imageUrl }} style={styles.image} resizeMode="cover" />
        </TouchableOpacity>
    );

    const renderPlaceItem = ({ item }: { item: typeof MOCK_PLACES[0] }) => (
        <TouchableOpacity style={styles.placeItem}>
            <View style={styles.placeIcon}>
                <MapPin color={colors.accent} size={20} />
            </View>
            <View style={styles.placeInfo}>
                <Text style={styles.placeName}>{item.name}</Text>
                <Text style={styles.placeAddress}>{item.address}</Text>
            </View>
            <Text style={styles.placeDistance}>{item.distance}</Text>
        </TouchableOpacity>
    );

    return (
        <View style={globalStyles.container}>
            <View style={{ height: Platform.OS === 'android' ? 40 : 50, zIndex: 10, backgroundColor: colors.background }} />

            {renderHeader()}

            {searchQuery.length > 0 ? (
                <FlatList
                    data={MOCK_PLACES.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.address.toLowerCase().includes(searchQuery.toLowerCase()))}
                    keyExtractor={(item) => item.id}
                    renderItem={renderPlaceItem}
                    contentContainerStyle={styles.listContent}
                    keyboardShouldPersistTaps="handled"
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyText}>No places found for "{searchQuery}"</Text>
                        </View>
                    }
                />
            ) : (
                <FlatList
                    data={posts}
                    keyExtractor={(item) => item.id}
                    numColumns={COLUMN_COUNT}
                    renderItem={renderGridItem}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.listContent}
                    columnWrapperStyle={styles.columnWrapper}
                />
            )}
        </View>
    );
};

function createStyles({ colors, typography, layout, mode }: any) {
    return StyleSheet.create({
        headerContainer: {
            paddingHorizontal: layout.padding.m,
            paddingBottom: layout.padding.m,
            backgroundColor: colors.background,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
        },
        headerTitle: {
            ...typography.h1,
            marginBottom: layout.padding.s,
            color: colors.text,
        },
        searchBarWrapper: {
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: colors.surfaceHighlight,
            borderRadius: layout.radius.round,
            paddingHorizontal: layout.padding.m,
            height: 48,
            borderWidth: 1,
            borderColor: colors.border,
        },
        searchIconContainer: {
            marginRight: layout.padding.s,
        },
        searchInput: {
            flex: 1,
            ...typography.body,
            color: colors.text,
            height: '100%',
        },
        listContent: {
            paddingBottom: 100, // padding for bottom tab bar
        },
        columnWrapper: {
            gap: SPACING,
            marginBottom: SPACING,
        },
        gridItem: {
            width: ITEM_WIDTH,
            height: ITEM_WIDTH,
            backgroundColor: colors.surfaceHighlight,
        },
        image: {
            width: '100%',
            height: '100%',
        },
        placeItem: {
            flexDirection: 'row',
            alignItems: 'center',
            padding: layout.padding.m,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
        },
        placeIcon: {
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: colors.surfaceHighlight,
            justifyContent: 'center',
            alignItems: 'center',
            marginRight: layout.padding.m,
        },
        placeInfo: {
            flex: 1,
        },
        placeName: {
            ...typography.h3,
            color: colors.text,
            marginBottom: 2,
        },
        placeAddress: {
            ...typography.caption,
            color: colors.textMuted,
        },
        placeDistance: {
            ...typography.caption,
            color: colors.textMuted,
        },
        emptyContainer: {
            padding: layout.padding.xl,
            alignItems: 'center',
        },
        emptyText: {
            ...typography.body,
            color: colors.textMuted,
        },
    });
}

export default ExploreScreen;
