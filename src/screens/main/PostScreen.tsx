import React, { useMemo, useState } from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { Camera, Image as ImageIcon, X } from 'lucide-react-native';

import { useTheme } from '../../constants/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import {
  createPost,
  getNearbyPlaces,
  PlacePublic,
  uploadPostMedia,
} from '../../services/api';

const GEM_TYPES = [
  'Hidden Cafe',
  'Sunset Spot',
  'Street Food',
  'Night Vibes',
  'Art Corner',
  'Nature Escape',
  'Work Friendly',
  'Photo Spot',
];

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

function parseHashtags(input: string): string[] {
  const seen = new Set<string>();
  const raw = input.split(/[\s,]+/).map((v) => v.trim()).filter(Boolean);
  for (const tag of raw) {
    const normalized = (tag.startsWith('#') ? tag : `#${tag}`).toLowerCase();
    if (normalized.length <= 40) {
      seen.add(normalized);
    }
  }
  return Array.from(seen);
}

export default function PostScreen({ navigation }: any) {
  const { colors, typography, mode } = useTheme();
  const { token } = useAuth();

  const [selectedUris, setSelectedUris] = useState<string[]>([]);
  const [caption, setCaption] = useState('');
  const [hashtagsInput, setHashtagsInput] = useState('');
  const [gemType, setGemType] = useState<string | null>(null);
  const [publishing, setPublishing] = useState(false);

  const styles = useMemo(() => createStyles({ colors, typography, mode }), [colors, typography, mode]);

  const addFromCamera = async () => {
    const cameraPerm = await ImagePicker.requestCameraPermissionsAsync();
    if (!cameraPerm.granted) {
      Alert.alert('Camera permission needed', 'Please allow camera access to take a photo.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 0.8,
      allowsEditing: false,
    });

    if (!result.canceled && result.assets?.[0]?.uri) {
      setSelectedUris((prev) => [...prev, result.assets[0].uri]);
    }
  };

  const addFromGallery = async () => {
    const mediaPerm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!mediaPerm.granted) {
      Alert.alert('Gallery permission needed', 'Please allow photo library access to pick images.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
      allowsMultipleSelection: true,
      selectionLimit: 10,
    });

    if (!result.canceled && result.assets?.length) {
      const picked = result.assets.map((asset) => asset.uri).filter(Boolean);
      setSelectedUris((prev) => [...prev, ...picked].slice(0, 10));
    }
  };

  const removeImage = (uri: string) => {
    setSelectedUris((prev) => prev.filter((item) => item !== uri));
  };

  const resolveNearestPlaceId = async (): Promise<string | null> => {
    try {
      const perm = await Location.getForegroundPermissionsAsync();
      if (perm.status !== 'granted') return null;

      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const center = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
      const nearby = await getNearbyPlaces({
        lat: center.latitude,
        lon: center.longitude,
        radius_meters: 2500,
        limit: 15,
      });

      const nearest = nearby
        .map((p: PlacePublic) => ({
          place: p,
          distance: haversineDistanceMeters(center, { latitude: p.lat, longitude: p.lon }),
        }))
        .sort((a, b) => a.distance - b.distance)[0];

      return nearest?.place?.id ?? null;
    } catch {
      return null;
    }
  };

  const publish = async () => {
    if (!token) {
      Alert.alert('Not logged in', 'Please login again.');
      return;
    }
    if (publishing) return;
    if (!selectedUris.length) {
      Alert.alert('Add images', 'Please capture or select at least one image.');
      return;
    }

    const hashtags = parseHashtags(hashtagsInput);
    if (!hashtags.length) {
      Alert.alert('Hashtags required', 'Add at least one hashtag (example: #cafe #sunset).');
      return;
    }
    if (!gemType) {
      Alert.alert('Gem type required', 'Select what type of gem this discovery is.');
      return;
    }

    setPublishing(true);
    try {
      const uploadedUrls: string[] = [];
      for (const uri of selectedUris) {
        const url = await uploadPostMedia(token, uri);
        uploadedUrls.push(url);
      }

      const placeId = await resolveNearestPlaceId();

      await createPost(token, {
        place_id: placeId,
        caption: caption.trim() || null,
        media_url: uploadedUrls[0],
        media_urls: uploadedUrls,
        hashtags,
        gem_type: gemType,
      });

      Alert.alert('Posted', 'Your discovery is now live.');
      setSelectedUris([]);
      setCaption('');
      setHashtagsInput('');
      setGemType(null);
      navigation.navigate('HomeTab');
    } catch (err: any) {
      Alert.alert('Failed to publish', err?.message || 'Please try again.');
    } finally {
      setPublishing(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle={mode === 'dark' ? 'light-content' : 'dark-content'} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <X color={colors.text} size={24} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Add Post</Text>
            <View style={{ width: 24 }} />
          </View>

          <View style={styles.mediaActions}>
            <TouchableOpacity style={styles.actionBtn} onPress={addFromCamera}>
              <Camera color={colors.onAccent} size={18} />
              <Text style={styles.actionBtnText}>Camera</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtn} onPress={addFromGallery}>
              <ImageIcon color={colors.onAccent} size={18} />
              <Text style={styles.actionBtnText}>Gallery (Multi)</Text>
            </TouchableOpacity>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.previewStrip}>
            {selectedUris.map((uri) => (
              <View key={uri} style={styles.previewItem}>
                <Image source={{ uri }} style={styles.previewImage} />
                <TouchableOpacity style={styles.removeBtn} onPress={() => removeImage(uri)}>
                  <X color={colors.onAccent} size={14} />
                </TouchableOpacity>
              </View>
            ))}
            {!selectedUris.length && (
              <View style={styles.emptyPreview}>
                <Text style={styles.emptyText}>No images selected yet</Text>
              </View>
            )}
          </ScrollView>

          <View style={styles.fieldBlock}>
            <Text style={styles.label}>Caption</Text>
            <TextInput
              style={styles.input}
              value={caption}
              onChangeText={setCaption}
              placeholder="Write a short description"
              placeholderTextColor={colors.textMuted}
              multiline
            />
          </View>

          <View style={styles.fieldBlock}>
            <Text style={styles.label}>Hashtags (required)</Text>
            <TextInput
              style={styles.input}
              value={hashtagsInput}
              onChangeText={setHashtagsInput}
              placeholder="#cafe #cozy #city"
              placeholderTextColor={colors.textMuted}
              autoCapitalize="none"
            />
          </View>

          <View style={styles.fieldBlock}>
            <Text style={styles.label}>Gem Type (required)</Text>
            <View style={styles.gemGrid}>
              {GEM_TYPES.map((item) => {
                const selected = item === gemType;
                return (
                  <TouchableOpacity
                    key={item}
                    style={[styles.gemChip, selected && styles.gemChipSelected]}
                    onPress={() => setGemType(item)}
                  >
                    <Text style={[styles.gemChipText, selected && styles.gemChipTextSelected]}>{item}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.postBtn, publishing && { opacity: 0.6 }]}
            onPress={publish}
            disabled={publishing}
          >
            <Text style={styles.postBtnText}>{publishing ? 'Posting...' : 'Post Discovery'}</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

function createStyles({ colors, typography, mode }: any) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scrollContent: {
      padding: 16,
      gap: 16,
      paddingBottom: 24,
    },
    headerRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 8,
      marginBottom: 4,
    },
    headerTitle: {
      ...typography.h3,
      color: colors.text,
    },
    mediaActions: {
      flexDirection: 'row',
      gap: 10,
    },
    actionBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      flex: 1,
      backgroundColor: colors.accent,
      borderRadius: 12,
      paddingVertical: 12,
    },
    actionBtnText: {
      ...typography.body,
      color: colors.onAccent,
      fontWeight: '600',
    },
    previewStrip: {
      gap: 10,
      paddingVertical: 4,
    },
    previewItem: {
      width: 110,
      height: 110,
      borderRadius: 12,
      overflow: 'hidden',
      position: 'relative',
      backgroundColor: mode === 'dark' ? '#1E293B' : '#E2E8F0',
    },
    previewImage: {
      width: '100%',
      height: '100%',
    },
    removeBtn: {
      position: 'absolute',
      right: 6,
      top: 6,
      backgroundColor: 'rgba(0,0,0,0.65)',
      width: 22,
      height: 22,
      borderRadius: 11,
      alignItems: 'center',
      justifyContent: 'center',
    },
    emptyPreview: {
      width: '100%',
      minHeight: 90,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 12,
    },
    emptyText: {
      ...typography.body,
      color: colors.textMuted,
    },
    fieldBlock: {
      gap: 8,
    },
    label: {
      ...typography.body,
      fontWeight: '700',
      color: colors.text,
    },
    input: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      paddingHorizontal: 12,
      paddingVertical: 12,
      color: colors.text,
      minHeight: 48,
      textAlignVertical: 'top',
      backgroundColor: colors.surface,
    },
    gemGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    gemChip: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 999,
      paddingHorizontal: 12,
      paddingVertical: 8,
      backgroundColor: colors.surface,
    },
    gemChipSelected: {
      borderColor: colors.accent,
      backgroundColor: colors.accent,
    },
    gemChipText: {
      ...typography.caption,
      color: colors.text,
    },
    gemChipTextSelected: {
      color: colors.onAccent,
      fontWeight: '700',
    },
    footer: {
      paddingHorizontal: 16,
      paddingBottom: Platform.OS === 'ios' ? 24 : 16,
      paddingTop: 8,
    },
    postBtn: {
      backgroundColor: colors.primary,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 50,
    },
    postBtnText: {
      ...typography.bodyLarge,
      color: colors.onPrimary,
      fontWeight: '700',
    },
  });
}
