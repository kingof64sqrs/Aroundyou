import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, Dimensions, Animated, Easing, TouchableOpacity, Platform, Image } from 'react-native';
import { useTheme } from '../../constants/ThemeContext';
import MapView, { Callout, Circle, Marker, PROVIDER_DEFAULT } from 'react-native-maps';
import * as Location from 'expo-location';
import { Navigation, Star, MapPin } from 'lucide-react-native';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');
const RADAR_RADIUS_METERS = 30_000;
const PLACES_LIMIT = 5;
const CAMERA_ANIMATION_MS = 800;

const DARK_MAP_STYLE = [
    { elementType: 'geometry', stylers: [{ color: '#0b0b0f' }] },
    { elementType: 'labels.text.stroke', stylers: [{ color: '#0b0b0f' }] },
    { elementType: 'labels.text.fill', stylers: [{ color: '#9CA3AF' }] },
    { featureType: 'administrative', elementType: 'geometry', stylers: [{ color: '#27272A' }] },
    { featureType: 'poi', elementType: 'labels.text.fill', stylers: [{ color: '#6B7280' }] },
    { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#0f172a' }] },
    { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#1f1f1f' }] },
    { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#0b0b0f' }] },
    { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#9CA3AF' }] },
    { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0a1a22' }] },
    { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#64748b' }] },
];

type NearbyPlace = {
    id: string;
    title: string;
    description?: string;
    distanceMeters: number;
    coordinate: { latitude: number; longitude: number };
    category: string;
    image: string;
};

type MarkerHandle = {
    showCallout?: () => void;
};

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

function getInitials(name: string) {
    const parts = name.trim().split(/\s+/).slice(0, 2);
    return parts.map(p => p[0]?.toUpperCase()).join('') || '•';
}

function getPlaceImage(placeId: string, title: string) {
    const seed = encodeURIComponent(`${placeId}-${title}`);
    // Keep this intentionally small to reduce network + decoding cost on Android.
    return `https://picsum.photos/seed/${seed}/420/300`;
}

function withAlpha(hex: string, alpha: number) {
    const normalized = hex.replace('#', '');
    if (normalized.length !== 6) return `rgba(0,0,0,${alpha})`;
    const r = parseInt(normalized.slice(0, 2), 16);
    const g = parseInt(normalized.slice(2, 4), 16);
    const b = parseInt(normalized.slice(4, 6), 16);
    return `rgba(${r},${g},${b},${alpha})`;
}

async function fetchNearbyPlaces(
    center: { latitude: number; longitude: number },
    radiusMeters: number,
    signal?: AbortSignal
): Promise<NearbyPlace[]> {
    const { latitude, longitude } = center;

    const query = `
[out:json][timeout:10];
(
  node(around:${radiusMeters},${latitude},${longitude})["name"]["shop"];
  node(around:${radiusMeters},${latitude},${longitude})["name"]["amenity"~"cafe|restaurant|fast_food|marketplace|supermarket"];
);
out body;
`;

    const response = await fetch('https://overpass-api.de/api/interpreter', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
        },
        body: `data=${encodeURIComponent(query)}`,
        signal,
    });

    if (!response.ok) {
        throw new Error(`Overpass failed: ${response.status}`);
    }

    const json = await response.json();
    const elements = Array.isArray(json?.elements) ? json.elements : [];

    const mapped: NearbyPlace[] = elements
        .filter((el: any) => typeof el?.lat === 'number' && typeof el?.lon === 'number')
        .map((el: any) => {
            const name = el?.tags?.name;
            const category = el?.tags?.shop
                ? `Shop • ${String(el.tags.shop)}`
                : el?.tags?.amenity
                    ? `Place • ${String(el.tags.amenity)}`
                    : 'Place';
            const coordinate = { latitude: el.lat, longitude: el.lon };
            const distanceMeters = haversineDistanceMeters(center, coordinate);
            return {
                id: `osm-node-${String(el.id)}`,
                title: typeof name === 'string' && name.trim() ? name.trim() : 'Nearby place',
                description: category,
                distanceMeters,
                coordinate,
                category,
                image: getPlaceImage(`osm-node-${String(el.id)}`, typeof name === 'string' ? name.trim() : 'place'),
            };
        })
        .filter((p: NearbyPlace) => p.title !== 'Nearby place')
        .sort((a: NearbyPlace, b: NearbyPlace) => a.distanceMeters - b.distanceMeters);

    const seen = new Set<string>();
    const deduped: NearbyPlace[] = [];
    for (const p of mapped) {
        const key = p.title.toLowerCase();
        if (seen.has(key)) continue;
        seen.add(key);
        deduped.push(p);
        if (deduped.length >= PLACES_LIMIT) break;
    }

    return deduped;
}

export default function MapScreen({ navigation }: any) {
    const { colors, typography, layout, globalStyles, mode } = useTheme();
    const insets = useSafeAreaInsets();
    const isAndroid = Platform.OS === 'android';
    const showRadarOverlay = !isAndroid;
    const spinValue = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(300)).current;
    const radarOpacity = useRef(new Animated.Value(1)).current;
    const mapRef = useRef<MapView>(null);
    const lastCameraCenter = useRef<{ latitude: number; longitude: number } | null>(null);
    const hasFadedRadar = useRef(false);

    const [location, setLocation] = useState<Location.LocationObject | null>(null);
    const [selectedPlace, setSelectedPlace] = useState<NearbyPlace | null>(null);
    const [places, setPlaces] = useState<NearbyPlace[]>([]);
    const [findingPlaces, setFindingPlaces] = useState(false);
    const markerRefs = useRef<Record<string, MarkerHandle | null>>({});

    useEffect(() => {
        let subscription: Location.LocationSubscription | null = null;

        const centerCamera = (center: { latitude: number; longitude: number }, force = false) => {
            const previous = lastCameraCenter.current;
            const moved = previous ? haversineDistanceMeters(previous, center) : Infinity;
            if (!force && moved < 35) return;

            lastCameraCenter.current = center;
            mapRef.current?.animateToRegion(
                {
                    latitude: center.latitude,
                    longitude: center.longitude,
                    latitudeDelta: 0.6,
                    longitudeDelta: 0.6,
                },
                CAMERA_ANIMATION_MS
            );
        };

        const loadPlaces = async (center: { latitude: number; longitude: number }) => {
            setFindingPlaces(true);

            // Show something immediately so the map doesn't feel "stuck" while fetching.
            const presets = [
                { title: 'Starbucks', category: 'Shop' },
                { title: "McDonald's", category: 'Fast food' },
                { title: 'IKEA', category: 'Shop' },
                { title: 'Nike Store', category: 'Shop' },
                { title: 'H&M', category: 'Shop' },
            ];
            const bearings = [20, 95, 160, 240, 310];
            const distances = [6500, 11200, 18700, 9800, 14400];
            const presetPlaces: NearbyPlace[] = presets.map((p, i) => ({
                id: `preset-${i}`,
                title: p.title,
                category: p.category,
                description: p.category,
                distanceMeters: distances[i],
                coordinate: {
                    latitude: center.latitude + (Math.cos(toRadians(bearings[i])) * distances[i]) / 111_000,
                    longitude: center.longitude + (Math.sin(toRadians(bearings[i])) * distances[i]) / (111_000 * Math.cos(toRadians(center.latitude))),
                },
                image: getPlaceImage(`preset-${i}`, p.title),
            }));
            setPlaces(presetPlaces);

            try {
                const controller = new AbortController();
                const timeout = setTimeout(() => controller.abort(), 4500);
                const found = await fetchNearbyPlaces(center, RADAR_RADIUS_METERS, controller.signal);
                clearTimeout(timeout);
                if (found.length) setPlaces(found);
            } catch {
                // Keep preset places if fetch fails/timeout.
            } finally {
                setFindingPlaces(false);
            }
        };

        (async () => {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') return;

            const lastKnown = await Location.getLastKnownPositionAsync({});
            if (lastKnown) {
                setLocation(lastKnown);
                centerCamera({ latitude: lastKnown.coords.latitude, longitude: lastKnown.coords.longitude }, true);
            }

            const current = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
            setLocation(current);
            const center = { latitude: current.coords.latitude, longitude: current.coords.longitude };
            centerCamera(center, true);
            loadPlaces(center);

            subscription = await Location.watchPositionAsync(
                {
                    accuracy: Location.Accuracy.Balanced,
                    timeInterval: 2500,
                    distanceInterval: 10,
                },
                (next) => {
                    setLocation(next);
                    if (!selectedPlace) {
                        centerCamera({ latitude: next.coords.latitude, longitude: next.coords.longitude });
                    }
                }
            );
        })();

        return () => {
            subscription?.remove();
        };
    }, []);

    useEffect(() => {
        if (!showRadarOverlay) return;
        Animated.loop(
            Animated.timing(spinValue, {
                toValue: 1,
                duration: 4000,
                easing: Easing.linear,
                useNativeDriver: true,
            })
        ).start();
    }, [spinValue, showRadarOverlay]);

    useEffect(() => {
        if (selectedPlace) {
            Animated.spring(slideAnim, {
                toValue: 0,
                friction: 8,
                useNativeDriver: true
            }).start();
        } else {
            Animated.timing(slideAnim, {
                toValue: 300,
                duration: 250,
                useNativeDriver: true
            }).start();
        }
    }, [selectedPlace, slideAnim]);

    useEffect(() => {
        if (!showRadarOverlay) return;
        if (hasFadedRadar.current) return;
        if (!location) return;
        if (findingPlaces) return;
        if (places.length < PLACES_LIMIT) return;

        hasFadedRadar.current = true;
        Animated.timing(radarOpacity, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
        }).start();
    }, [showRadarOverlay, location, findingPlaces, places.length, radarOpacity]);

    const spin = spinValue.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg']
    });

    const center = useMemo(() => {
        if (!location) return null;
        return {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
        };
    }, [location]);

    const handleMarkerPress = (place: NearbyPlace) => {
        setSelectedPlace(place);
        mapRef.current?.animateToRegion(
            {
                latitude: place.coordinate.latitude - 0.01,
                longitude: place.coordinate.longitude,
                latitudeDelta: 0.25,
                longitudeDelta: 0.25,
            },
            500
        );

        markerRefs.current[place.id]?.showCallout?.();
    };

    const handleMapPress = () => {
        if (selectedPlace) {
            setSelectedPlace(null);
        }
    };

    const initialRegion = {
        latitude: 12.9716,
        longitude: 77.5946,
        latitudeDelta: 0.1,
        longitudeDelta: 0.1,
    };

    const styles = useMemo(() => createStyles({ colors, typography, layout }), [colors, typography, layout]);

    return (
        <View style={globalStyles.container}>
            <MapView
                ref={mapRef}
                style={StyleSheet.absoluteFillObject}
                provider={PROVIDER_DEFAULT}
                initialRegion={initialRegion}
                customMapStyle={mode === 'dark' ? (DARK_MAP_STYLE as any) : undefined}
                userInterfaceStyle={Platform.OS === 'ios' ? (mode === 'dark' ? 'dark' : 'light') : undefined}
                showsUserLocation={true}
                showsMyLocationButton={false}
                showsCompass={false}
                pitchEnabled={true}
                rotateEnabled={true}
                zoomEnabled={true}
                scrollEnabled={true}
                mapPadding={{ top: (insets.top || 0) + 120, right: 24, bottom: (insets.bottom || 0) + 260, left: 24 }}
                onPress={handleMapPress}
            >
                {center ? (
                    <Circle
                        center={center}
                        radius={RADAR_RADIUS_METERS}
                        strokeColor={withAlpha(colors.primary, mode === 'dark' ? 0.28 : 0.22)}
                        fillColor={withAlpha(colors.primary, mode === 'dark' ? 0.06 : 0.04)}
                        strokeWidth={2}
                    />
                ) : null}

                {places.map((p) => (
                    <Marker
                        key={p.id}
                        coordinate={p.coordinate}
                        ref={(ref) => {
                            markerRefs.current[p.id] = ref as any;
                        }}
                        onPress={() => handleMarkerPress(p)}
                        title={p.title}
                        description={p.category}
                    >
                        <View style={[styles.customMarker, selectedPlace?.id === p.id && styles.customMarkerActive]}>
                            <Text style={styles.markerInitials}>{getInitials(p.title)}</Text>
                            <View style={styles.markerBadge}>
                                <Star size={10} color={colors.onPrimary} fill={colors.onPrimary} />
                            </View>
                        </View>

                        <Callout tooltip>
                            <View style={styles.calloutCard}>
                                <Image source={{ uri: p.image }} style={styles.calloutImage} />
                                <View style={styles.calloutTextRow}>
                                    <Text style={styles.calloutTitle} numberOfLines={1}>{p.title}</Text>
                                    <Text style={styles.calloutMeta} numberOfLines={1}>{formatKm(p.distanceMeters)} • {p.category}</Text>
                                </View>
                            </View>
                        </Callout>
                    </Marker>
                ))}
            </MapView>

            {/* Top Branding (Pass-through) */}
            <View style={[styles.header, { top: (insets.top || 0) + 12 }]} pointerEvents="none">
                <Text style={styles.brandText}>AroundYou</Text>
            </View>

            {/* Radar UI Overlay (Pass-through) */}
            {showRadarOverlay ? (
            <Animated.View style={[styles.radarContainer, { opacity: radarOpacity }]} pointerEvents="none">
                <View style={[styles.ring, { width: width * 1.2, height: width * 1.2, borderRadius: width * 0.6 }]} />
                <View style={[styles.ring, { width: width * 0.8, height: width * 0.8, borderRadius: width * 0.4, borderColor: withAlpha(colors.primary, 0.22) }]} />
                <View style={[styles.ring, { width: width * 0.4, height: width * 0.4, borderRadius: width * 0.2, borderColor: withAlpha(colors.primary, 0.38) }]} />

                <Animated.View style={[styles.sweepContainer, { transform: [{ rotate: spin }] }]}>
                    <View style={styles.sweepCone} />
                    <View style={styles.sweepLine} />
                </Animated.View>
            </Animated.View>
            ) : null}

            {/* Interactive Bottom Sheet for Place Detail */}
            <Animated.View
                style={[
                    styles.bottomSheet,
                    { transform: [{ translateY: slideAnim }] }
                ]}
            >
                {selectedPlace && (
                    (isAndroid ? (
                        <View style={[styles.sheetContent, { backgroundColor: colors.glassSurface }]}>
                            <Image source={{ uri: selectedPlace.image }} style={styles.sheetImage} />
                            <View style={styles.sheetDetails}>
                                <Text style={styles.sheetTitle} numberOfLines={1}>{selectedPlace.title}</Text>
                                <Text style={styles.sheetSubtitle} numberOfLines={2}>{selectedPlace.description || selectedPlace.category}</Text>

                                <View style={[globalStyles.rowBetween, { marginTop: 12 }]}>
                                    <View style={globalStyles.row}>
                                        <MapPin color={colors.textMuted} size={14} />
                                        <Text style={styles.sheetDistance}>{formatKm(selectedPlace.distanceMeters)}</Text>
                                    </View>
                                    <TouchableOpacity
                                        style={styles.sheetButton}
                                        onPress={() =>
                                            navigation.navigate('PlaceDetail', {
                                                item: {
                                                    title: selectedPlace.title,
                                                    user: 'AroundYou',
                                                    description: selectedPlace.description || `A popular spot nearby: ${selectedPlace.category}.`,
                                                    image: selectedPlace.image,
                                                    tags: [selectedPlace.category],
                                                    likes: 0,
                                                    distance: formatKm(selectedPlace.distanceMeters),
                                                    verified: false,
                                                },
                                            })
                                        }
                                    >
                                        <Text style={styles.sheetButtonText}>View</Text>
                                        <Navigation size={14} color={colors.onPrimary} fill={colors.onPrimary} style={{ marginLeft: 4 }} />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
                    ) : (
                        <BlurView intensity={60} tint={mode === 'dark' ? 'dark' : 'light'} style={styles.sheetContent}>
                        <Image source={{ uri: selectedPlace.image }} style={styles.sheetImage} />
                        <View style={styles.sheetDetails}>
                            <Text style={styles.sheetTitle} numberOfLines={1}>{selectedPlace.title}</Text>
                            <Text style={styles.sheetSubtitle} numberOfLines={2}>{selectedPlace.description || selectedPlace.category}</Text>

                            <View style={[globalStyles.rowBetween, { marginTop: 12 }]}>
                                <View style={globalStyles.row}>
                                    <MapPin color={colors.textMuted} size={14} />
                                    <Text style={styles.sheetDistance}>{formatKm(selectedPlace.distanceMeters)}</Text>
                                </View>
                                <TouchableOpacity
                                    style={styles.sheetButton}
                                    onPress={() =>
                                        navigation.navigate('PlaceDetail', {
                                            item: {
                                                title: selectedPlace.title,
                                                user: 'AroundYou',
                                                description: selectedPlace.description || `A popular spot nearby: ${selectedPlace.category}.`,
                                                image: selectedPlace.image,
                                                tags: [selectedPlace.category],
                                                likes: 0,
                                                distance: formatKm(selectedPlace.distanceMeters),
                                                verified: false,
                                            },
                                        })
                                    }
                                >
                                    <Text style={styles.sheetButtonText}>View</Text>
                                    <Navigation size={14} color={colors.onPrimary} fill={colors.onPrimary} style={{ marginLeft: 4 }} />
                                </TouchableOpacity>
                            </View>
                        </View>
                        </BlurView>
                    ))
                )}
            </Animated.View>

            {/* Floating Sector Panel */}
            <View style={[styles.sectorPanel, { bottom: (insets.bottom || 0) + 96 }]} pointerEvents="none">
                <Text style={styles.sectorLabel}>CURRENT SECTOR</Text>
                <Text style={styles.sectorName}>
                    {location
                        ? (findingPlaces ? 'FINDING PLACES…' : `${Math.min(places.length, PLACES_LIMIT)} PLACES • 30KM`)
                        : 'GETTING LOCATION…'}
                </Text>
            </View>
        </View>
    );
}

function createStyles({
    colors,
    typography,
    layout,
}: {
    colors: any;
    typography: any;
    layout: any;
}) {
    return StyleSheet.create({
    header: {
        position: 'absolute',
        top: 60,
        left: layout.padding.xl,
        zIndex: 10,
        backgroundColor: colors.glassSurface,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: colors.glassBorder,
    },
    brandText: {
        fontFamily: 'SpaceGrotesk_700Bold',
        fontSize: 24,
        color: colors.text,
        letterSpacing: 0.2,
    },
    radarContainer: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 5,
    },
    ring: {
        position: 'absolute',
        borderWidth: 1,
        borderColor: withAlpha(colors.primary, 0.06),
    },
    sweepContainer: {
        position: 'absolute',
        width: width * 1.2,
        height: width * 1.2,
        justifyContent: 'center',
        alignItems: 'center',
    },
    sweepCone: {
        position: 'absolute',
        width: width * 0.6,
        height: width * 0.6,
        top: 0,
        left: width * 0.6,
        backgroundColor: colors.primary,
        opacity: 0.1,
        borderTopRightRadius: width * 0.6,
    },
    sweepLine: {
        position: 'absolute',
        width: 2,
        height: width * 0.6,
        backgroundColor: colors.primary,
        top: 0,
        left: width * 0.6,
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 1,
        shadowRadius: 10,
        elevation: 10,
    },
    sectorPanel: {
        position: 'absolute',
        bottom: 120,
        left: layout.padding.xl,
        backgroundColor: colors.glassSurface,
        paddingVertical: 14,
        paddingHorizontal: 24,
        borderRadius: layout.radius.round,
        borderWidth: 1,
        borderColor: colors.border,
        zIndex: 10,
        opacity: 0.9,
    },
    sectorLabel: {
        ...typography.caption,
        color: colors.textMuted,
        marginBottom: 4,
    },
    sectorName: {
        fontFamily: 'SpaceGrotesk_700Bold',
        fontSize: 16,
        color: colors.primary,
        letterSpacing: 0.5,
    },

    // Markers & Sheet
    customMarker: {
        width: 48,
        height: 48,
        borderRadius: 24,
        borderWidth: 2,
        borderColor: colors.border,
        backgroundColor: colors.surface,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: colors.overlay,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.5,
        shadowRadius: 5,
        elevation: 5,
    },
    markerInitials: {
        fontFamily: 'SpaceGrotesk_700Bold',
        fontSize: 14,
        color: colors.text,
        letterSpacing: 0,
    },
    customMarkerActive: {
        borderColor: colors.primary,
        transform: [{ scale: 1.2 }],
        zIndex: 10,
        shadowColor: colors.primary,
        shadowRadius: 10,
    },
    markerBadge: {
        position: 'absolute',
        bottom: -4,
        right: -4,
        backgroundColor: colors.primary,
        width: 18,
        height: 18,
        borderRadius: 9,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: colors.background,
    },
    calloutCard: {
        width: 220,
        borderRadius: layout.radius.m,
        borderWidth: 1,
        borderColor: colors.glassBorder,
        backgroundColor: colors.glassSurface,
        overflow: 'hidden',
    },
    calloutImage: {
        width: '100%',
        height: 110,
    },
    calloutTextRow: {
        paddingVertical: 10,
        paddingHorizontal: 10,
    },
    calloutTitle: {
        ...typography.bodyLarge,
        fontFamily: 'SpaceGrotesk_600SemiBold',
        fontSize: 14,
        lineHeight: 18,
        color: colors.text,
        marginBottom: 2,
    },
    calloutMeta: {
        ...typography.bodySmall,
        fontSize: 12,
        lineHeight: 16,
        color: colors.textMuted,
    },
    bottomSheet: {
        position: 'absolute',
        bottom: 100, // Above tab bar and sector panel loosely
        left: layout.padding.m,
        right: layout.padding.m,
        zIndex: 20,
    },
    sheetContent: {
        flexDirection: 'row',
        padding: 12,
        borderRadius: layout.radius.l,
        borderWidth: 1,
        borderColor: colors.border,
        overflow: 'hidden',
    },
    sheetImage: {
        width: 64,
        height: 64,
        borderRadius: layout.radius.s,
        marginRight: 12,
        backgroundColor: colors.surfaceHighlight,
    },
    sheetDetails: {
        flex: 1,
        marginLeft: 0,
        justifyContent: 'center',
    },
    sheetTitle: {
        ...typography.h3,
        fontSize: 18,
        color: colors.text,
        marginBottom: 4,
    },
    sheetSubtitle: {
        ...typography.bodySmall,
        color: colors.textMuted,
        lineHeight: 18,
    },
    sheetDistance: {
        ...typography.caption,
        color: colors.textSubtle,
        marginLeft: 4,
    },
    sheetButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.primary,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: layout.radius.round,
    },
    sheetButtonText: {
        ...typography.caption,
        fontWeight: '800',
        color: colors.onPrimary,
    }
    });
}
