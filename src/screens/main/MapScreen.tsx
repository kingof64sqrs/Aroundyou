import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, Dimensions, Animated, TouchableOpacity, Platform, Image, FlatList } from 'react-native';
import { useTheme } from '../../constants/ThemeContext';
import MapView, { Callout, Circle, Marker, PROVIDER_DEFAULT } from 'react-native-maps';
import * as Location from 'expo-location';
import { Navigation, MapPin, Search, Layers, ChevronRight, Flame, Coffee, Store, X } from 'lucide-react-native';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getNearbyPlaces, pingPresence, PlacePublic } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const { width, height } = Dimensions.get('window');
const RADAR_RADIUS_METERS = 2_000;
const PLACES_LIMIT = 20;
const CAMERA_ANIMATION_MS = 800;

const DARK_MAP_STYLE = [
    { elementType: 'geometry', stylers: [{ color: '#0B0B0F' }] },
    { elementType: 'labels.text.stroke', stylers: [{ color: '#0B0B0F' }] },
    { elementType: 'labels.text.fill', stylers: [{ color: '#94A3B8' }] },
    { featureType: 'administrative', elementType: 'geometry', stylers: [{ color: '#1F1F2B' }] },
    { featureType: 'poi', elementType: 'all', stylers: [{ visibility: 'off' }] },
    { featureType: 'transit', elementType: 'all', stylers: [{ visibility: 'off' }] },
    { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#1F1F2B' }] },
    { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#0B0B0F' }] },
    { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#94A3B8' }] },
    { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#08080C' }] },
    { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#475569' }] },
];

type NearbyPlace = {
    id: string;
    title: string;
    description?: string;
    distanceMeters: number;
    coordinate: { latitude: number; longitude: number };
    category: string;
    image: string;
    postCount?: number;
};

// ============================================
// Utilites
// ============================================

function toRadians(degrees: number) { return (degrees * Math.PI) / 180; }
function haversineDistanceMeters(a: { latitude: number; longitude: number }, b: { latitude: number; longitude: number }) {
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
    return km < 2 ? `${Math.round(distanceMeters)}m` : `${km.toFixed(1)} km`;
}

function withAlpha(hex: string, alpha: number) {
    const normalized = hex.replace('#', '');
    if (normalized.length !== 6) return `rgba(0,0,0,${alpha})`;
    const r = parseInt(normalized.slice(0, 2), 16);
    const g = parseInt(normalized.slice(2, 4), 16);
    const b = parseInt(normalized.slice(4, 6), 16);
    return `rgba(${r},${g},${b},${alpha})`;
}

// Icon Mapping
const getCategoryStyling = (category: string) => {
    const cat = category.toLowerCase();
    if (cat.includes('cafe') || cat.includes('restaurant')) return { color: '#09090b', bg: '#fd8b00', Icon: Coffee };
    if (cat.includes('bar') || cat.includes('club') || cat.includes('lounge')) return { color: '#09090b', bg: '#00f1fe', Icon: Flame };
    if (cat.includes('park')) return { color: '#09090b', bg: '#6bfe9c', Icon: MapPin };
    return { color: '#fff', bg: '#3f3f46', Icon: Store };
};

// ============================================
// Main Map Screen
// ============================================
export default function MapScreen({ navigation }: any) {
    const { colors, mode } = useTheme();
    const { token, me } = useAuth();
    const insets = useSafeAreaInsets();
    const useNativeDriver = Platform.OS !== 'web';

    // Bottom sheet animation values
    const sheetAnim = useRef(new Animated.Value(500)).current;
    const carouselAnim = useRef(new Animated.Value(500)).current;

    const mapRef = useRef<MapView>(null);
    const lastCameraCenter = useRef<{ latitude: number; longitude: number } | null>(null);

    const [location, setLocation] = useState<Location.LocationObject | null>(null);
    const [selectedPlace, setSelectedPlace] = useState<NearbyPlace | null>(null);
    const [places, setPlaces] = useState<NearbyPlace[]>([]);
    const [showCarousel, setShowCarousel] = useState(false);
    const markerRefs = useRef<Record<string, any>>({});

    const centerCamera = (center: { latitude: number; longitude: number }, force = false) => {
        const previous = lastCameraCenter.current;
        const moved = previous ? haversineDistanceMeters(previous, center) : Infinity;
        if (!force && moved < 50) return;
        lastCameraCenter.current = center;
        mapRef.current?.animateToRegion(
            { latitude: center.latitude - 0.005, longitude: center.longitude, latitudeDelta: 0.02, longitudeDelta: 0.02 },
            CAMERA_ANIMATION_MS
        );
    };

    const loadPlaces = async (center: { latitude: number; longitude: number }) => {
        try {
            // Loading hardcoded vibrant mock places for UI prototyping
            const dummyPlaces: NearbyPlace[] = [
                { id: '1', title: 'Midnight Tacos & Grill', category: 'Restaurant', distanceMeters: 450, coordinate: { latitude: center.latitude + 0.002, longitude: center.longitude + 0.002 }, image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800' },
                { id: '2', title: 'The Cobalt Lounge', category: 'Bar', distanceMeters: 800, coordinate: { latitude: center.latitude - 0.003, longitude: center.longitude + 0.001 }, image: 'https://images.unsplash.com/photo-1514933651103-005eab06c04d?w=800' },
                { id: '3', title: 'Archive Study Cafe', category: 'Cafe', distanceMeters: 1200, coordinate: { latitude: center.latitude + 0.001, longitude: center.longitude - 0.004 }, image: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800' },
                { id: '4', title: 'Neon Noodles', category: 'Restaurant', distanceMeters: 250, coordinate: { latitude: center.latitude - 0.004, longitude: center.longitude - 0.002 }, image: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800' },
                { id: '5', title: 'Starlight Square', category: 'Park', distanceMeters: 1800, coordinate: { latitude: center.latitude + 0.005, longitude: center.longitude + 0.006 }, image: 'https://images.unsplash.com/photo-1519331379826-f10be5486c6f?w=800' }
            ];
            setPlaces(dummyPlaces);
        } catch { }
    };

    useEffect(() => {
        let subscription: Location.LocationSubscription | null = null;
        (async () => {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') return;

            // Instant fallback to hit user's location immediately before GPS spins up
            const cached = await Location.getLastKnownPositionAsync();
            if (cached) {
                centerCamera({ latitude: cached.coords.latitude, longitude: cached.coords.longitude }, true);
            }

            const current = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
            setLocation(current);
            const initialCenter = { latitude: current.coords.latitude, longitude: current.coords.longitude };
            centerCamera(initialCenter, true);
            loadPlaces(initialCenter);

            subscription = await Location.watchPositionAsync(
                { accuracy: Location.Accuracy.Balanced, timeInterval: 5000, distanceInterval: 100 },
                (next: Location.LocationObject) => { setLocation(next); }
            );
        })();
        return () => { subscription?.remove(); };
    }, []);

    useEffect(() => {
        Animated.spring(sheetAnim, {
            toValue: selectedPlace ? 0 : 500,
            friction: 8, tension: 40, useNativeDriver
        }).start();
    }, [selectedPlace]);

    useEffect(() => {
        Animated.spring(carouselAnim, {
            toValue: showCarousel ? 0 : 500,
            friction: 8, tension: 40, useNativeDriver
        }).start();
    }, [showCarousel]);

    const center = useMemo(() => location ? { latitude: location.coords.latitude, longitude: location.coords.longitude } : null, [location]);

    const handleMarkerPress = (place: NearbyPlace) => {
        setSelectedPlace(place);
        setShowCarousel(false); // hide carousel if it's open to show intel
        if (token) pingPresence(token, place.id).catch(() => { });
        mapRef.current?.animateToRegion(
            { latitude: place.coordinate.latitude - 0.015, longitude: place.coordinate.longitude, latitudeDelta: 0.05, longitudeDelta: 0.05 },
            600
        );
    };

    // ============================================
    // Sub-components
    // ============================================

    const CarouselCard = ({ item }: { item: NearbyPlace }) => (
        <TouchableOpacity
            style={styles.carouselCard}
            activeOpacity={0.9}
            onPress={() => {
                mapRef.current?.animateToRegion({ latitude: item.coordinate.latitude, longitude: item.coordinate.longitude, latitudeDelta: 0.02, longitudeDelta: 0.02 });
                setSelectedPlace(item);
            }}
        >
            <View style={styles.cardImageContainer}>
                <Image source={{ uri: item.image }} style={styles.cardImage} />
                <View style={styles.cardTopBadge}>
                    <Text style={styles.cardBadgeText}>TRENDING</Text>
                </View>
            </View>
            <View style={styles.cardInfo}>
                <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
                <Text style={styles.cardSubtitle}>{item.category} • {formatKm(item.distanceMeters)} away</Text>
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            {/* Main Map */}
            <MapView
                ref={mapRef}
                style={StyleSheet.absoluteFillObject}
                provider={PROVIDER_DEFAULT}
                customMapStyle={DARK_MAP_STYLE as any}
                showsUserLocation={false}
                showsMyLocationButton={false}
                showsCompass={false}
                mapPadding={{ top: (insets.top || 0) + 100, right: 24, bottom: height * 0.4, left: 24 }}
                onPress={() => setSelectedPlace(null)}
            >
                {/* Custom User Location Pin */}
                {center && (
                    <Marker coordinate={center} zIndex={999} anchor={{ x: 0.5, y: 0.5 }}>
                        <View style={styles.userLocationMarker} />
                    </Marker>
                )}

                {/* Glowing Map Pins */}
                {places.map((p) => {
                    const styleBlock = getCategoryStyling(p.category);
                    const IconComp = styleBlock.Icon;
                    return (
                        <Marker key={p.id} coordinate={p.coordinate} onPress={() => handleMarkerPress(p)}>
                            <View style={[styles.markerPill, { backgroundColor: styleBlock.bg }]}>
                                <IconComp color={styleBlock.color} size={16} />
                            </View>
                            <Callout tooltip>
                                <View style={styles.calloutCard}>
                                    <Text style={styles.calloutText}>{p.title}</Text>
                                </View>
                            </Callout>
                        </Marker>
                    );
                })}
            </MapView>

            {/* Gradient Overlays safe mimic via absolutes covering */}
            <View style={styles.topGradient} pointerEvents="none" />

            {/* Urban Pulse TopAppBar */}
            <View style={[styles.topNav, { paddingTop: Platform.OS === 'ios' ? 50 : 20 }]}>
                {Platform.OS === 'ios' ?
                    <BlurView intensity={70} tint="dark" style={StyleSheet.absoluteFillObject} /> :
                    <View style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(13, 14, 19, 0.8)' }]} />
                }

                <View style={styles.topNavContent}>
                    <View style={styles.brandGroup}>
                        <MapPin color="#00f1fe" size={20} />
                        <Text style={styles.brandText}>AroundYou</Text>
                    </View>

                    <View style={styles.navActions}>
                        <TouchableOpacity style={styles.iconBtn}>
                            <Search color="rgba(255,255,255,0.7)" size={22} />
                        </TouchableOpacity>
                        <View style={styles.avatarWrap}>
                            <Image style={styles.avatarImg} source={{ uri: `https://i.pravatar.cc/150?u=${me?.id || 'demo'}` }} />
                        </View>
                    </View>
                </View>
            </View>

            {/* Live City Pulse Floating Overlay */}
            <View style={[styles.livePulseCard, { top: (insets.top || 40) + 70 }]} pointerEvents="none">
                {Platform.OS === 'ios' ? <BlurView intensity={50} tint="dark" style={StyleSheet.absoluteFillObject} /> : <View style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(36, 37, 45, 0.8)' }]} />}
                <Text style={styles.livePulseTitle}>Live City Pulse</Text>
                <View style={styles.livePulseRow}>
                    <View style={styles.livePulseDot} />
                    <Text style={styles.livePulseDesc}>4.2k active explorers tonight</Text>
                </View>
            </View>

            {/* Show Tonight's Places Toggle */}
            {!showCarousel && !selectedPlace && (
                <TouchableOpacity style={styles.showPlacesBtn} onPress={() => setShowCarousel(true)} activeOpacity={0.8}>
                    <Flame color="#00f1fe" fill="transparent" size={20} />
                    <Text style={styles.showPlacesText}>Tonight Near You</Text>
                </TouchableOpacity>
            )}

            {/* Tonight Near You Carousel (Toggleable) */}
            <Animated.View style={[styles.carouselContainer, { transform: [{ translateY: carouselAnim }] }]} pointerEvents={showCarousel ? 'auto' : 'none'}>
                <View style={styles.carouselHeaderRow}>
                    <Text style={styles.carouselHeaderTitle}>Tonight Near You</Text>
                    <TouchableOpacity onPress={() => setShowCarousel(false)}>
                        <Text style={styles.carouselHeaderAction}>CLOSE</Text>
                    </TouchableOpacity>
                </View>
                <FlatList
                    data={places}
                    keyExtractor={p => p.id}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ paddingHorizontal: 24, gap: 16 }}
                    renderItem={({ item }) => <CarouselCard item={item} />}
                />
            </Animated.View>

            {/* Selected Place Intel Sheet */}
            <Animated.View style={[styles.selectedSheetWrapper, { transform: [{ translateY: sheetAnim }] }]} pointerEvents={selectedPlace ? 'auto' : 'none'}>
                {selectedPlace && (
                    <View style={styles.selectedSheetContent}>
                        {Platform.OS === 'ios' ? <BlurView intensity={90} tint="dark" style={StyleSheet.absoluteFillObject} /> : <View style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(18, 19, 25, 0.95)' }]} />}
                        <Image source={{ uri: selectedPlace.image }} style={styles.sheetImage} />
                        <View style={styles.sheetInfo}>
                            <Text style={styles.sheetTitle} numberOfLines={1}>{selectedPlace.title}</Text>
                            <Text style={styles.sheetSubtitle}>{selectedPlace.category} • {formatKm(selectedPlace.distanceMeters)}</Text>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                <TouchableOpacity
                                    style={styles.sheetBtn}
                                    onPress={() => navigation.navigate('PlaceDetail', { placeId: selectedPlace.id })}
                                >
                                    <Text style={styles.sheetBtnText}>View Intel</Text>
                                    <ChevronRight size={14} color="#000" />
                                </TouchableOpacity>

                                <TouchableOpacity onPress={() => setSelectedPlace(null)} style={styles.closeSheetBtn}>
                                    <X size={20} color="#abaab1" />
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                )}
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1, backgroundColor: '#0d0e13'
    },
    topGradient: {
        position: 'absolute', top: 0, left: 0, right: 0, height: 200,
        backgroundColor: 'transparent',
    },
    topNav: {
        position: 'absolute', top: 0, left: 0, right: 0,
        height: 100,
        zIndex: 50,
        overflow: 'hidden',
    },
    topNavContent: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingHorizontal: 24, paddingTop: 10,
    },
    brandGroup: {
        flexDirection: 'row', alignItems: 'center', gap: 10,
    },
    brandText: {
        fontFamily: 'SpaceGrotesk_700Bold', fontSize: 22, color: '#00f1fe', letterSpacing: -0.5,
    },
    navActions: {
        flexDirection: 'row', alignItems: 'center', gap: 16,
    },
    iconBtn: {
        width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center',
    },
    avatarWrap: {
        width: 34, height: 34, borderRadius: 17,
        borderWidth: 1, borderColor: 'rgba(0, 241, 254, 0.4)',
        overflow: 'hidden', backgroundColor: '#24252d'
    },
    avatarImg: { width: '100%', height: '100%' },

    livePulseCard: {
        position: 'absolute', left: 24, zIndex: 40,
        padding: 16, borderRadius: 16,
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)',
        overflow: 'hidden', width: 220,
    },
    livePulseTitle: {
        fontFamily: 'SpaceGrotesk_700Bold', fontSize: 18, color: '#fff', letterSpacing: -0.5,
    },
    livePulseRow: {
        flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8,
    },
    livePulseDot: {
        width: 8, height: 8, borderRadius: 4, backgroundColor: '#6bfe9c',
    },
    livePulseDesc: {
        fontFamily: 'PlusJakartaSans_500Medium', fontSize: 12, color: '#abaab1',
    },

    userLocationMarker: {
        width: 16, height: 16,
        backgroundColor: '#00f2ff', borderRadius: 8,
        borderWidth: 2, borderColor: '#fff',
        overflow: 'hidden',
    },

    markerPill: {
        width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center',
        borderWidth: 2, borderColor: '#fff',
        overflow: 'hidden',
    },
    calloutCard: {
        backgroundColor: '#1e1f26', paddingHorizontal: 12, paddingVertical: 6,
        borderRadius: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)'
    },
    calloutText: {
        fontFamily: 'SpaceGrotesk_700Bold', fontSize: 12, color: '#fff',
    },

    fabBtn: {
        position: 'absolute', right: 24, bottom: 260, zIndex: 50,
        width: 56, height: 56, borderRadius: 20,
        backgroundColor: '#00f1fe',
        alignItems: 'center', justifyContent: 'center',
        shadowColor: '#00f1fe', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 15, elevation: 10,
    },

    showPlacesBtn: {
        position: 'absolute', bottom: 120, alignSelf: 'center', zIndex: 40,
        flexDirection: 'row', alignItems: 'center', gap: 8,
        backgroundColor: 'rgba(9, 9, 11, 0.9)',
        borderWidth: 1, borderColor: '#00f1fe',
        paddingHorizontal: 20, paddingVertical: 12, borderRadius: 99,
        shadowColor: '#00f1fe', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10,
    },
    showPlacesText: {
        fontFamily: 'PlusJakartaSans_700Bold', fontSize: 12, color: '#fff', textTransform: 'uppercase', letterSpacing: 0.5,
    },

    carouselContainer: {
        position: 'absolute', bottom: 100, left: 0, right: 0, zIndex: 40,
    },
    carouselHeaderRow: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingHorizontal: 24, marginBottom: 12,
    },
    carouselHeaderTitle: {
        fontFamily: 'SpaceGrotesk_700Bold', fontSize: 18, color: '#fff',
    },
    carouselHeaderAction: {
        fontFamily: 'PlusJakartaSans_700Bold', fontSize: 10, color: '#00f1fe', letterSpacing: 1.5,
    },
    carouselCard: {
        width: 250, backgroundColor: 'rgba(30, 31, 38, 0.8)',
        borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)',
    },
    cardImageContainer: { height: 110, position: 'relative' },
    cardImage: { width: '100%', height: '100%' },
    cardTopBadge: {
        position: 'absolute', top: 8, left: 8,
        backgroundColor: '#fd8b00', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4,
    },
    cardBadgeText: { fontFamily: 'SpaceGrotesk_700Bold', fontSize: 10, color: '#fff', textTransform: 'uppercase' },
    cardInfo: { padding: 12 },
    cardTitle: { fontFamily: 'SpaceGrotesk_700Bold', fontSize: 14, color: '#fff', marginBottom: 2 },
    cardSubtitle: { fontFamily: 'PlusJakartaSans_500Medium', fontSize: 11, color: '#abaab1' },

    selectedSheetWrapper: {
        position: 'absolute', bottom: 100, left: 24, right: 24, zIndex: 60,
    },
    selectedSheetContent: {
        flexDirection: 'row', padding: 16, borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
        alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.8, shadowRadius: 20, shadowOffset: { width: 0, height: 10 },
    },
    sheetImage: { width: 64, height: 64, borderRadius: 12, marginRight: 16 },
    sheetInfo: { flex: 1, justifyContent: 'center' },
    sheetTitle: { fontFamily: 'SpaceGrotesk_700Bold', fontSize: 18, color: '#fff', marginBottom: 4 },
    sheetSubtitle: { fontFamily: 'PlusJakartaSans_500Medium', fontSize: 12, color: '#abaab1', marginBottom: 16 },
    sheetBtn: {
        backgroundColor: '#00f1fe', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12,
        flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start',
    },
    sheetBtnText: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 12, color: '#000' },
    closeSheetBtn: {
        padding: 8,
        backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 20,
    },
});
