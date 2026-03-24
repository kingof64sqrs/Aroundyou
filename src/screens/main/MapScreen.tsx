import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, Dimensions, Animated, Easing, TouchableOpacity, Platform, Image, StatusBar } from 'react-native';
import { useTheme } from '../../constants/ThemeContext';
import MapView, { Callout, Circle, Marker, PROVIDER_DEFAULT } from 'react-native-maps';
import * as Location from 'expo-location';
import { Navigation, Star, MapPin } from 'lucide-react-native';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getNearbyPlaces, pingPresence, PlacePublic } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Shadows } from '../../constants/Theme';

const { width } = Dimensions.get('window');
const RADAR_RADIUS_METERS = 30_000;
const PLACES_LIMIT = 5;
const CAMERA_ANIMATION_MS = 800;

const DARK_MAP_STYLE = [
    { elementType: 'geometry', stylers: [{ color: '#0B0B0F' }] },
    { elementType: 'labels.text.stroke', stylers: [{ color: '#0B0B0F' }] },
    { elementType: 'labels.text.fill', stylers: [{ color: '#94A3B8' }] },
    { featureType: 'administrative', elementType: 'geometry', stylers: [{ color: '#1F1F2B' }] },
    { featureType: 'poi', elementType: 'labels.text.fill', stylers: [{ color: '#475569' }] },
    { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#16161E' }] },
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
    return `https://picsum.photos/seed/${seed}/600/400`;
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
    radiusMeters: number
): Promise<NearbyPlace[]> {
    try {
        const rows = await getNearbyPlaces({
            lat: center.latitude,
            lon: center.longitude,
            radius_meters: radiusMeters,
            limit: 25,
        });

        return rows
            .filter((p: PlacePublic) => typeof p?.lat === 'number' && typeof p?.lon === 'number')
            .map((p: PlacePublic) => {
                const coordinate = { latitude: p.lat, longitude: p.lon };
                const distanceMeters = haversineDistanceMeters(center, coordinate);
                return {
                    id: p.id,
                    title: p.name,
                    description: p.category,
                    distanceMeters,
                    coordinate,
                    category: p.category,
                    image: getPlaceImage(p.id, p.name),
                };
            })
            .sort((a: NearbyPlace, b: NearbyPlace) => a.distanceMeters - b.distanceMeters)
            .slice(0, PLACES_LIMIT);
    } catch {
        return [];
    }
}

export default function MapScreen({ navigation }: any) {
    const { colors, typography, layout, globalStyles, mode } = useTheme();
    const { token } = useAuth();
    const useNativeDriver = Platform.OS !== 'web';
    const insets = useSafeAreaInsets();
    const isAndroid = Platform.OS === 'android';
    const showRadarOverlay = !isAndroid;
    const spinValue = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(400)).current;
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
            if (!force && moved < 50) return;

            lastCameraCenter.current = center;
            mapRef.current?.animateToRegion(
                {
                    latitude: center.latitude - 0.05, // Slightly offset so center marker is visible
                    longitude: center.longitude,
                    latitudeDelta: 0.5,
                    longitudeDelta: 0.5,
                },
                CAMERA_ANIMATION_MS
            );
        };

        const loadPlaces = async (center: { latitude: number; longitude: number }) => {
            setFindingPlaces(true);
            try {
                const found = await fetchNearbyPlaces(center, RADAR_RADIUS_METERS);
                if (found.length) setPlaces(found);
            } catch {
                // ignore
            } finally {
                setFindingPlaces(false);
            }
        };

        (async () => {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') return;

            const current = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
            setLocation(current);
            const center = { latitude: current.coords.latitude, longitude: current.coords.longitude };
            centerCamera(center, true);
            loadPlaces(center);

            subscription = await Location.watchPositionAsync(
                {
                    accuracy: Location.Accuracy.Balanced,
                    timeInterval: 5000,
                    distanceInterval: 100,
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
                useNativeDriver,
            })
        ).start();
    }, [spinValue, showRadarOverlay]);

    useEffect(() => {
        if (selectedPlace) {
            Animated.spring(slideAnim, {
                toValue: 0,
                friction: 8,
                tension: 40,
                useNativeDriver
            }).start();
        } else {
            Animated.timing(slideAnim, {
                toValue: 400,
                duration: 300,
                useNativeDriver
            }).start();
        }
    }, [selectedPlace]);

    useEffect(() => {
        if (!showRadarOverlay || hasFadedRadar.current || !location || findingPlaces || places.length < 2) return;
        hasFadedRadar.current = true;
        Animated.timing(radarOpacity, {
            toValue: 0,
            duration: 1000,
            useNativeDriver,
        }).start();
    }, [showRadarOverlay, location, findingPlaces, places.length]);

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
        if (token) pingPresence(token, place.id).catch(() => { });

        mapRef.current?.animateToRegion(
            {
                latitude: place.coordinate.latitude - 0.08,
                longitude: place.coordinate.longitude,
                latitudeDelta: 0.3,
                longitudeDelta: 0.3,
            },
            600
        );
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
                mapPadding={{ top: (insets.top || 0) + 120, right: 24, bottom: (insets.bottom || 0) + 260, left: 24 }}
                onPress={() => setSelectedPlace(null)}
            >
                {center && (
                    <Circle
                        center={center}
                        radius={RADAR_RADIUS_METERS}
                        strokeColor={withAlpha(colors.accent, mode === 'dark' ? 0.35 : 0.25)}
                        fillColor={withAlpha(colors.accent, mode === 'dark' ? 0.08 : 0.05)}
                        strokeWidth={2}
                    />
                )}

                {places.map((p) => (
                    <Marker
                        key={p.id}
                        coordinate={p.coordinate}
                        ref={(ref) => { markerRefs.current[p.id] = ref as any; }}
                        onPress={() => handleMarkerPress(p)}
                    >
                        <View style={[styles.customMarker, selectedPlace?.id === p.id && styles.customMarkerActive]}>
                            <Text style={styles.markerInitials}>{getInitials(p.title)}</Text>
                            <View style={styles.markerBadge}>
                                <Star size={9} color={colors.onAccent} fill={colors.onAccent} />
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

            <View style={[styles.header, { top: (insets.top || 0) + 12, pointerEvents: 'none' }]}>
                <Text style={styles.brandText}>AroundYou</Text>
            </View>

            {showRadarOverlay && (
                <Animated.View style={[styles.radarContainer, { opacity: radarOpacity, pointerEvents: 'none' }]}>
                    <View style={[styles.ring, { width: width * 1.2, height: width * 1.2, borderRadius: width * 0.6 }]} />
                    <View style={[styles.ring, { width: width * 0.8, height: width * 0.8, borderRadius: width * 0.4, borderColor: withAlpha(colors.accent, 0.2) }]} />
                    <View style={[styles.ring, { width: width * 0.4, height: width * 0.4, borderRadius: width * 0.2, borderColor: withAlpha(colors.accent, 0.3) }]} />

                    <Animated.View style={[styles.sweepContainer, { transform: [{ rotate: spin }] }]}>
                        <View style={styles.sweepCone} />
                        <View style={styles.sweepLine} />
                    </Animated.View>
                </Animated.View>
            )}

            <Animated.View style={[styles.bottomSheet, { transform: [{ translateY: slideAnim }] }]}>
                {selectedPlace && (
                    <BlurView intensity={Platform.OS === 'ios' ? 70 : 100} tint={mode === 'dark' ? 'dark' : 'light'} style={styles.sheetContent}>
                        <Image source={{ uri: selectedPlace.image }} style={styles.sheetImage} />
                        <View style={styles.sheetDetails}>
                            <Text style={styles.sheetTitle} numberOfLines={1}>{selectedPlace.title}</Text>
                            <Text style={styles.sheetSubtitle} numberOfLines={2}>{selectedPlace.description || selectedPlace.category}</Text>

                            <View style={[globalStyles.rowBetween, { marginTop: 12 }]}>
                                <View style={globalStyles.row}>
                                    <MapPin color={colors.accent} size={14} />
                                    <Text style={styles.sheetDistance}>{formatKm(selectedPlace.distanceMeters)}</Text>
                                </View>
                                <TouchableOpacity
                                    style={styles.sheetButton}
                                    onPress={() =>
                                        navigation.navigate('PlaceDetail', { placeId: selectedPlace.id.startsWith('preset-') ? undefined : selectedPlace.id })
                                    }
                                >
                                    <Text style={styles.sheetButtonText}>View</Text>
                                    <Navigation size={14} color={colors.onAccent} fill={colors.onAccent} style={{ marginLeft: 4 }} />
                                </TouchableOpacity>
                            </View>
                        </View>
                    </BlurView>
                )}
            </Animated.View>

            <View style={[styles.sectorPanel, { bottom: (insets.bottom || 0) + 96, pointerEvents: 'none' }]}>
                <Text style={styles.sectorLabel}>CURRENT SECTOR</Text>
                <Text style={styles.sectorName}>
                    {location
                        ? (findingPlaces ? 'SCANNING…' : `${Math.min(places.length, PLACES_LIMIT)} DETECTED • 30KM`)
                        : 'OFFLINE'}
                </Text>
            </View>
        </View>
    );
}

function createStyles({ colors, typography, layout }: any) {
    return StyleSheet.create({
        header: {
            position: 'absolute',
            left: layout.padding.l,
            zIndex: 10,
            backgroundColor: colors.glassSurface,
            paddingHorizontal: 20,
            paddingVertical: 10,
            borderRadius: layout.radius.round,
            borderWidth: 1,
            borderColor: colors.glassBorder,
            ...Shadows.soft,
        },
        brandText: {
            fontFamily: 'SpaceGrotesk_700Bold',
            fontSize: 22,
            color: colors.accent,
            letterSpacing: -0.5,
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
            borderColor: withAlpha(colors.accent, 0.08),
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
            backgroundColor: colors.accent,
            opacity: 0.05,
            borderTopRightRadius: width * 0.6,
        },
        sweepLine: {
            position: 'absolute',
            width: 1.5,
            height: width * 0.6,
            backgroundColor: colors.accent,
            top: 0,
            left: width * 0.6,
            ...Shadows.glow(colors.accent),
        },
        sectorPanel: {
            position: 'absolute',
            left: layout.padding.l,
            backgroundColor: colors.surface,
            paddingVertical: 12,
            paddingHorizontal: 20,
            borderRadius: layout.radius.l,
            borderWidth: 1,
            borderColor: colors.border,
            zIndex: 10,
            ...Shadows.medium,
        },
        sectorLabel: {
            ...typography.caption,
            color: colors.textSubtle,
            marginBottom: 2,
            fontSize: 10,
        },
        sectorName: {
            fontFamily: 'SpaceGrotesk_700Bold',
            fontSize: 14,
            color: colors.primary,
            letterSpacing: 0.8,
        },
        customMarker: {
            width: 44,
            height: 44,
            borderRadius: 22,
            borderWidth: 2,
            borderColor: colors.border,
            backgroundColor: colors.surface,
            justifyContent: 'center',
            alignItems: 'center',
            ...Shadows.soft,
        },
        markerInitials: {
            fontFamily: 'SpaceGrotesk_700Bold',
            fontSize: 13,
            color: colors.text,
        },
        customMarkerActive: {
            borderColor: colors.accent,
            transform: [{ scale: 1.15 }],
            zIndex: 100,
            ...Shadows.glow(colors.accent),
        },
        markerBadge: {
            position: 'absolute',
            bottom: -2,
            right: -2,
            backgroundColor: colors.accent,
            width: 16,
            height: 16,
            borderRadius: 8,
            justifyContent: 'center',
            alignItems: 'center',
            borderWidth: 1.5,
            borderColor: colors.surface,
        },
        calloutCard: {
            width: 200,
            borderRadius: layout.radius.m,
            borderWidth: 1,
            borderColor: colors.border,
            backgroundColor: colors.surface,
            overflow: 'hidden',
            ...Shadows.medium,
        },
        calloutImage: {
            width: '100%',
            height: 100,
        },
        calloutTextRow: {
            padding: 10,
        },
        calloutTitle: {
            ...typography.body,
            fontFamily: 'SpaceGrotesk_600SemiBold',
            color: colors.text,
            marginBottom: 2,
        },
        calloutMeta: {
            ...typography.caption,
            fontSize: 11,
            color: colors.textMuted,
        },
        bottomSheet: {
            position: 'absolute',
            left: layout.padding.m,
            right: layout.padding.m,
            zIndex: 30,
        },
        sheetContent: {
            flexDirection: 'row',
            padding: layout.padding.m,
            borderRadius: layout.radius.xl,
            borderWidth: 1,
            borderColor: colors.border,
            overflow: 'hidden',
        },
        sheetImage: {
            width: 72,
            height: 72,
            borderRadius: layout.radius.m,
            marginRight: 16,
            backgroundColor: colors.surfaceHighlight,
        },
        sheetDetails: {
            flex: 1,
            justifyContent: 'center',
        },
        sheetTitle: {
            ...typography.h3,
            color: colors.text,
            marginBottom: 2,
            fontSize: 18,
        },
        sheetSubtitle: {
            ...typography.bodySmall,
            color: colors.textMuted,
            marginBottom: 8,
        },
        sheetDistance: {
            ...typography.caption,
            color: colors.textSubtle,
            marginLeft: 4,
        },
        sheetButton: {
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: colors.accent,
            paddingHorizontal: 16,
            paddingVertical: 8,
            borderRadius: layout.radius.round,
            ...Shadows.glow(colors.accent),
        },
        sheetButtonText: {
            ...typography.caption,
            fontWeight: '800',
            color: colors.onAccent,
        }
    });
}
