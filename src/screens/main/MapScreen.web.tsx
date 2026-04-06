import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native';
import * as Location from 'expo-location';
import { useTheme } from '../../constants/ThemeContext';
import { getNearbyPlaces, PlacePublic } from '../../services/api';

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

type Nearby = PlacePublic & { distanceMeters: number };

export default function MapScreenWeb({ navigation }: any) {
  const { colors, typography, layout, globalStyles } = useTheme();
  const [items, setItems] = useState<Nearby[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const styles = useMemo(() => createStyles({ colors, typography, layout }), [colors, typography, layout]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      let center = { latitude: 12.9716, longitude: 77.5946 };

      const perm = await Location.getForegroundPermissionsAsync();
      if (perm.status === 'granted') {
        const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        center = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
      }

      const nearby = await getNearbyPlaces({
        lat: center.latitude,
        lon: center.longitude,
        radius_meters: 2000,
        limit: 20,
      });

      const rows = nearby
        .map((p) => ({
          ...p,
          distanceMeters: haversineDistanceMeters(center, { latitude: p.lat, longitude: p.lon }),
        }))
        .sort((a, b) => a.distanceMeters - b.distanceMeters);

      setItems(rows);
    } catch (e: any) {
      setError(e?.message || 'Failed to load nearby places');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <View style={globalStyles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Nearby Places</Text>
        <TouchableOpacity style={styles.refreshBtn} onPress={load}>
          <Text style={styles.refreshBtnText}>Refresh</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.subtitle}>
        Web fallback mode: list view is used instead of native map.
      </Text>

      {loading ? <ActivityIndicator style={{ marginTop: 24 }} color={colors.primary} /> : null}
      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 24 }}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate('PlaceDetail', { placeId: item.id })}
            activeOpacity={0.8}
          >
            <Text style={styles.cardTitle}>{item.name}</Text>
            <Text style={styles.cardMeta}>{item.category} • {formatKm(item.distanceMeters)}</Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={!loading ? <Text style={styles.emptyText}>No places found nearby.</Text> : null}
      />
    </View>
  );
}

function createStyles({ colors, typography, layout }: { colors: any; typography: any; layout: any }) {
  return StyleSheet.create({
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: layout.padding.m,
      paddingTop: 24,
      paddingBottom: 12,
    },
    title: {
      ...typography.h2,
    },
    subtitle: {
      ...typography.bodySmall,
      color: colors.textMuted,
      paddingHorizontal: layout.padding.m,
      marginBottom: 8,
    },
    refreshBtn: {
      backgroundColor: colors.primary,
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: layout.radius.round,
    },
    refreshBtnText: {
      ...typography.bodySmall,
      color: colors.onPrimary,
      fontWeight: '700',
    },
    card: {
      marginHorizontal: layout.padding.m,
      marginTop: 10,
      padding: layout.padding.m,
      borderRadius: layout.radius.m,
      borderWidth: 1,
      borderColor: colors.glassBorder,
      backgroundColor: colors.surface,
    },
    cardTitle: {
      ...typography.h3,
      marginBottom: 4,
    },
    cardMeta: {
      ...typography.bodySmall,
      color: colors.textMuted,
    },
    errorText: {
      ...typography.bodySmall,
      color: colors.danger,
      paddingHorizontal: layout.padding.m,
      marginBottom: 6,
    },
    emptyText: {
      ...typography.body,
      color: colors.textMuted,
      textAlign: 'center',
      marginTop: 24,
    },
  });
}
