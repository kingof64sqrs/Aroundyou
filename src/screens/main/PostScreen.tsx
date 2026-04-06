import React, { useMemo, useState, useEffect } from 'react';
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
  Dimensions,
  Modal,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { ImagePlus, X, Send, MapPin, Edit3, Plus, Check } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MapView, { PROVIDER_DEFAULT } from 'react-native-maps';

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
  const insets = useSafeAreaInsets();

  const [selectedUris, setSelectedUris] = useState<string[]>([]);
  const [caption, setCaption] = useState('');
  const [hashtagsInput, setHashtagsInput] = useState('');
  const [gemType, setGemType] = useState<string | null>(null);
  const [publishing, setPublishing] = useState(false);

  const [currentLocationName, setCurrentLocationName] = useState('Resolving location...');
  const [isMapModalVisible, setIsMapModalVisible] = useState(false);
  const [mapRegion, setMapRegion] = useState({ latitude: 12.9716, longitude: 77.5946, latitudeDelta: 0.05, longitudeDelta: 0.05 });
  const [selectedCoordinate, setSelectedCoordinate] = useState<{ latitude: number, longitude: number } | null>(null);
  const [resolvedPlaceId, setResolvedPlaceId] = useState<string | null>(null);

  const styles = useMemo(() => createStyles({ colors, typography, mode }), [colors, typography, mode]);

  useEffect(() => {
    (async () => {
      try {
        const perm = await Location.getForegroundPermissionsAsync();
        if (perm.status !== 'granted') {
          setCurrentLocationName('Location disabled');
          return;
        }
        const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        const initialCoord = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
        setMapRegion({ ...initialCoord, latitudeDelta: 0.02, longitudeDelta: 0.02 });
        setSelectedCoordinate(initialCoord);
        resolveLocationName(initialCoord);
      } catch {
        setCurrentLocationName('Location unknown');
      }
    })();
  }, []);

  const resolveLocationName = async (coord: { latitude: number, longitude: number }) => {
    try {
      setCurrentLocationName('Locating...');
      const nearby = await getNearbyPlaces({
        lat: coord.latitude,
        lon: coord.longitude,
        radius_meters: 2500,
        limit: 15,
      });

      if (nearby.length > 0) {
        const nearest = nearby
          .map((p: PlacePublic) => ({
            place: p,
            distance: haversineDistanceMeters(coord, { latitude: p.lat, longitude: p.lon }),
          }))
          .sort((a, b) => a.distance - b.distance)[0];

        setCurrentLocationName(nearest.place.name);
        setResolvedPlaceId(nearest.place.id);
      } else {
        setCurrentLocationName(`${coord.latitude.toFixed(4)}, ${coord.longitude.toFixed(4)}`);
        setResolvedPlaceId(null);
      }
    } catch {
      setCurrentLocationName(`${coord.latitude.toFixed(4)}, ${coord.longitude.toFixed(4)}`);
      setResolvedPlaceId(null);
    }
  };

  const openMapPicker = () => {
    if (selectedCoordinate) {
      setMapRegion({ ...selectedCoordinate, latitudeDelta: 0.02, longitudeDelta: 0.02 });
    }
    setIsMapModalVisible(true);
  };

  const handleMapPinSet = () => {
    setIsMapModalVisible(false);
    if (selectedCoordinate) {
      resolveLocationName(selectedCoordinate);
    }
  };

  const handleMediaAdd = () => {
    Alert.alert('Add Visual', 'Choose source', [
      { text: 'Camera', onPress: addFromCamera },
      { text: 'Gallery', onPress: addFromGallery },
      { text: 'Cancel', style: 'cancel' }
    ]);
  };

  const addFromCamera = async () => {
    const cameraPerm = await ImagePicker.requestCameraPermissionsAsync();
    if (!cameraPerm.granted) return Alert.alert('Camera permission needed');

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
    if (!mediaPerm.granted) return Alert.alert('Gallery permission needed');

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

  const publish = async () => {
    if (!token) return Alert.alert('Not logged in');
    if (publishing) return;
    if (!selectedUris.length) return Alert.alert('Add images', 'Drop your visual first.');
    if (!gemType) return Alert.alert('Pulse Tag required', 'Select what type of gem this is.');

    const hashtags = parseHashtags(hashtagsInput);
    if (!hashtags.length) return Alert.alert('Pulse Tags required', 'Add at least one custom tag (#neon, #view).');

    setPublishing(true);
    try {
      const uploadedUrls: string[] = [];
      for (const uri of selectedUris) {
        const up = await uploadPostMedia(token, uri);
        if (up) uploadedUrls.push(up);
      }

      await createPost(token, {
        place_id: resolvedPlaceId,
        caption: caption.trim() || null,
        media_url: uploadedUrls.length > 0 ? uploadedUrls[0] : null,
        media_urls: uploadedUrls,
        hashtags,
        gem_type: gemType,
      });

      Alert.alert('Live on Pulse', 'Your discovery has been shared!');
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
      <StatusBar barStyle="light-content" />
      <View style={[styles.glowOrbBase, styles.glowOrbTop]} />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 30, paddingBottom: insets.bottom + 120 }]} showsVerticalScrollIndicator={false}>

          <View style={styles.headlineSection}>
            <Text style={styles.headlineTitle}>Share Your Discovery</Text>
            <Text style={styles.headlineSubtitle}>Broadcast the city's hidden rhythm to the community.</Text>
          </View>

          <View style={styles.canvasContainer}>
            {selectedUris.length > 0 ? (
              <View style={styles.canvasFilledWrapper}>
                <Image source={{ uri: selectedUris[0] }} style={styles.canvasImageFull} />
                <TouchableOpacity style={styles.canvasRemoveBtn} onPress={() => removeImage(selectedUris[0])}>
                  <X color="#fff" size={24} />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity style={styles.canvasEmpty} activeOpacity={0.8} onPress={handleMediaAdd}>
                <View style={styles.canvasIconRing}>
                  <ImagePlus color="#99f7ff" size={32} />
                </View>
                <Text style={styles.canvasPrompt}>Drop your visual</Text>
                <Text style={styles.canvasSubPrompt}>High-res photo or short clip</Text>
              </TouchableOpacity>
            )}
          </View>

          {selectedUris.length > 1 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.extraStrip}>
              {selectedUris.slice(1).map((uri) => (
                <View key={uri} style={styles.extraStripItem}>
                  <Image source={{ uri }} style={styles.extraStripImage} />
                  <TouchableOpacity style={styles.extraStripRemove} onPress={() => removeImage(uri)}>
                    <X color="#fff" size={14} />
                  </TouchableOpacity>
                </View>
              ))}
              <TouchableOpacity style={styles.extraAddMoreBtn} onPress={handleMediaAdd}>
                <Plus color="#00f1fe" size={24} />
              </TouchableOpacity>
            </ScrollView>
          )}

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>THE NARRATIVE</Text>
            <TextInput
              style={styles.inputArea}
              value={caption}
              onChangeText={setCaption}
              placeholder="Caption your discovery..."
              placeholderTextColor="#abaab1"
              multiline
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>LOCATION ANCHOR</Text>
            <TouchableOpacity style={styles.locationStrip} activeOpacity={0.8} onPress={openMapPicker}>
              <MapPin color="#fd8b00" size={20} />
              <TextInput
                style={styles.locationInput}
                value={currentLocationName}
                editable={false}
                pointerEvents="none"
              />
              <Edit3 color="#47474e" size={20} />
            </TouchableOpacity>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>PULSE TAGS</Text>
            <TextInput
              style={styles.tagsInput}
              value={hashtagsInput}
              onChangeText={setHashtagsInput}
              placeholder="Custom tags: #cafe #neon"
              placeholderTextColor="#47474e"
              autoCapitalize="none"
            />
            <View style={styles.gemGrid}>
              {GEM_TYPES.map((item) => {
                const selected = item === gemType;
                return (
                  <TouchableOpacity
                    key={item}
                    style={[styles.gemPill, selected ? styles.gemPillActive : styles.gemPillInactive]}
                    onPress={() => setGemType(item)}
                  >
                    <Text style={[styles.gemPillText, selected ? styles.gemPillTextActive : styles.gemPillTextInactive]}>{selected ? `#${item.replace(' ', '')}` : `#${item.replace(' ', '')}`}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <TouchableOpacity activeOpacity={0.8} onPress={publish} disabled={publishing} style={styles.publishWrapper}>
            <LinearGradient colors={['#99f7ff', '#00f1fe']} start={[0, 0]} end={[1, 0]} style={styles.publishBtn}>
              <Text style={styles.publishText}>{publishing ? 'PUBLISHING...' : 'PUBLISH TO PULSE'}</Text>
              <Send color="#00555a" fill="#00555a" size={24} />
            </LinearGradient>
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>

      <Modal visible={isMapModalVisible} animationType="slide" transparent={false}>
        <View style={styles.modalContainer}>
          <MapView
            provider={PROVIDER_DEFAULT}
            style={styles.fullMap}
            initialRegion={mapRegion}
            onRegionChangeComplete={(region) => setSelectedCoordinate({ latitude: region.latitude, longitude: region.longitude })}
            showsUserLocation={true}
            userInterfaceStyle="dark"
          />
          <View style={styles.crosshairContainer} pointerEvents="none">
            <View style={styles.crosshairDot} />
            <View style={styles.crosshairRing} />
          </View>

          <View style={[styles.modalHeader, { paddingTop: insets.top + 16 }]}>
            <TouchableOpacity onPress={() => setIsMapModalVisible(false)} style={styles.modalCloseBtn}>
              <X color="#fff" size={24} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>PINPOINT DISCOVERY</Text>
            <View style={{ width: 44 }} />
          </View>

          <View style={[styles.modalFooter, { paddingBottom: Math.max(insets.bottom, 24) }]}>
            <TouchableOpacity style={styles.modalConfirmBtn} activeOpacity={0.8} onPress={handleMapPinSet}>
              <Text style={styles.modalConfirmText}>SET PULSE ANCHOR</Text>
              <Check color="#000" size={20} />
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function createStyles({ colors, typography, mode }: any) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#0d0e13',
    },
    glowOrbBase: {
      position: 'absolute', width: Dimensions.get('window').width * 1.5, height: Dimensions.get('window').width * 1.5,
      borderRadius: 9999, zIndex: -1, opacity: 0.05,
    },
    glowOrbTop: { top: -100, right: -150, backgroundColor: '#99f7ff' },

    scrollContent: {
      paddingHorizontal: 24,
    },
    headlineSection: {
      marginBottom: 32,
    },
    headlineTitle: {
      fontFamily: 'SpaceGrotesk_700Bold', fontSize: 36, color: '#fff', letterSpacing: -1, marginBottom: 8,
    },
    headlineSubtitle: {
      fontFamily: 'PlusJakartaSans_500Medium', fontSize: 16, color: '#abaab1',
    },

    canvasContainer: {
      width: '100%', aspectRatio: 4 / 5, borderRadius: 32, marginBottom: 24, overflow: 'hidden',
    },
    canvasEmpty: {
      flex: 1, backgroundColor: '#121319', borderWidth: 2, borderColor: '#47474e', borderStyle: 'dashed', borderRadius: 32,
      alignItems: 'center', justifyContent: 'center', padding: 20,
    },
    canvasFilledWrapper: {
      flex: 1, borderRadius: 32, overflow: 'hidden',
    },
    canvasImageFull: {
      width: '100%', height: '100%', resizeMode: 'cover',
    },
    canvasRemoveBtn: {
      position: 'absolute', top: 16, right: 16, backgroundColor: 'rgba(0,0,0,0.6)',
      width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center',
    },
    canvasIconRing: {
      width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(153, 247, 255, 0.1)',
      alignItems: 'center', justifyContent: 'center', marginBottom: 16,
    },
    canvasPrompt: {
      fontFamily: 'SpaceGrotesk_700Bold', fontSize: 20, color: '#fff', marginBottom: 4,
    },
    canvasSubPrompt: {
      fontFamily: 'PlusJakartaSans_500Medium', fontSize: 14, color: '#abaab1',
    },

    extraStrip: { gap: 12, marginBottom: 24 },
    extraStripItem: { width: 80, height: 80, borderRadius: 16, overflow: 'hidden' },
    extraStripImage: { width: '100%', height: '100%', resizeMode: 'cover' },
    extraStripRemove: { position: 'absolute', right: 4, top: 4, backgroundColor: 'rgba(0,0,0,0.7)', padding: 4, borderRadius: 12 },
    extraAddMoreBtn: { width: 80, height: 80, borderRadius: 16, borderWidth: 1, borderColor: '#00f1fe', backgroundColor: '#121319', alignItems: 'center', justifyContent: 'center', borderStyle: 'dashed' },

    formGroup: { marginBottom: 24 },
    formLabel: {
      fontFamily: 'PlusJakartaSans_700Bold', fontSize: 11, color: '#00e2ee', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 8, marginLeft: 4,
    },
    inputArea: {
      backgroundColor: '#121319', borderRadius: 16, padding: 16, color: '#f7f5fd', fontFamily: 'PlusJakartaSans_500Medium', fontSize: 16, minHeight: 120, textAlignVertical: 'top',
    },
    tagsInput: {
      backgroundColor: '#121319', borderRadius: 16, padding: 16, color: '#f7f5fd', fontFamily: 'PlusJakartaSans_500Medium', fontSize: 14, marginBottom: 12,
    },
    locationStrip: {
      flexDirection: 'row', alignItems: 'center', backgroundColor: '#121319', padding: 16, borderRadius: 16, gap: 12,
    },
    locationInput: {
      flex: 1, color: '#f7f5fd', fontFamily: 'PlusJakartaSans_500Medium', fontSize: 16, padding: 0,
    },

    gemGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    gemPill: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 99, borderWidth: 1 },
    gemPillInactive: { backgroundColor: '#1e1f26', borderColor: '#24252d' },
    gemPillActive: { backgroundColor: '#fd8b00', borderColor: '#fd8b00' },
    gemPillText: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 14 },
    gemPillTextInactive: { color: '#abaab1' },
    gemPillTextActive: { color: '#442100' },

    publishWrapper: { marginTop: 16, shadowColor: '#00f2ff', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.3, shadowRadius: 20, elevation: 15 },
    publishBtn: {
      width: '100%', paddingVertical: 20, borderRadius: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12,
    },
    publishText: {
      fontFamily: 'SpaceGrotesk_700Bold', fontSize: 20, color: '#00555a', letterSpacing: -0.5,
    },

    modalContainer: { flex: 1, backgroundColor: '#000' },
    fullMap: { width: '100%', height: '100%' },
    crosshairContainer: { position: 'absolute', top: '50%', left: '50%', width: 64, height: 64, marginLeft: -32, marginTop: -32, alignItems: 'center', justifyContent: 'center' },
    crosshairDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#00f1fe', zIndex: 2 },
    crosshairRing: { position: 'absolute', width: 64, height: 64, borderRadius: 32, borderWidth: 2, borderColor: '#00f1fe', opacity: 0.5 },
    modalHeader: { position: 'absolute', top: 0, width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, backgroundColor: 'rgba(0,0,0,0.5)' },
    modalCloseBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center' },
    modalTitle: { fontFamily: 'Syncopate_700Bold', fontSize: 12, color: '#00f1fe', letterSpacing: 2 },
    modalFooter: { position: 'absolute', bottom: 0, width: '100%', paddingHorizontal: 24, paddingVertical: 24, backgroundColor: 'rgba(0,0,0,0.5)' },
    modalConfirmBtn: { backgroundColor: '#00f1fe', paddingVertical: 18, borderRadius: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12 },
    modalConfirmText: { fontFamily: 'SpaceGrotesk_700Bold', fontSize: 18, color: '#000', letterSpacing: -0.5 },
  });
}
