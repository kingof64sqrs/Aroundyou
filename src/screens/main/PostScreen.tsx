import React, { useState, useRef, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Image, Dimensions, Animated, KeyboardAvoidingView, ScrollView, Platform, Alert, StatusBar } from 'react-native';
import { useTheme } from '../../constants/ThemeContext';
import { Camera as CameraIcon, Image as ImageIcon, MapPin, X, Check, Star, ChevronRight, Zap } from 'lucide-react-native';
import * as Location from 'expo-location';
import { createPost, getNearbyPlaces, PlacePublic } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Shadows } from '../../constants/Theme';
import { BlurView } from 'expo-blur';

const { width, height } = Dimensions.get('window');

// Mock image for the camera simulation
const MOCK_PHOTO = 'https://images.unsplash.com/photo-1509042239860-f550ce710b93';

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

export default function PostScreen({ navigation }: any) {
    const { colors, typography, layout, globalStyles, mode } = useTheme();
    const { token } = useAuth();
    const useNativeDriver = Platform.OS !== 'web';
    const [step, setStep] = useState(1);
    const [caption, setCaption] = useState('');
    const [publishing, setPublishing] = useState(false);

    // Animation values
    const xpScale = useRef(new Animated.Value(0)).current;
    const xpOpacity = useRef(new Animated.Value(0)).current;
    const stepFade = useRef(new Animated.Value(1)).current;

    const transitionToStep = (nextStep: number) => {
        Animated.timing(stepFade, {
            toValue: 0,
            duration: 200,
            useNativeDriver,
        }).start(() => {
            setStep(nextStep);
            Animated.timing(stepFade, {
                toValue: 1,
                duration: 300,
                useNativeDriver,
            }).start();
        });
    };

    const handleNextStep = () => {
        if (step === 3) {
            if (!token) {
                Alert.alert('Not logged in', 'Please login again.');
                return;
            }
            if (publishing) return;

            setPublishing(true);
            (async () => {
                let placeId: string | null = null;
                try {
                    const perm = await Location.getForegroundPermissionsAsync();
                    if (perm.status === 'granted') {
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
                        placeId = nearest?.place?.id ?? null;
                    }
                } catch {
                    // ignore
                }

                try {
                    await createPost(token, {
                        caption: caption?.trim() ? caption.trim() : null,
                        media_url: MOCK_PHOTO,
                        place_id: placeId,
                    });

                    // Trigger success animation
                    setStep(4);
                    Animated.sequence([
                        Animated.parallel([
                            Animated.spring(xpScale, {
                                toValue: 1,
                                friction: 6,
                                tension: 40,
                                useNativeDriver,
                            }),
                            Animated.timing(xpOpacity, {
                                toValue: 1,
                                duration: 400,
                                useNativeDriver,
                            })
                        ]),
                        Animated.delay(2500),
                    ]).start(() => {
                        setStep(1);
                        setCaption('');
                        navigation.navigate('HomeTab');
                    });
                } catch {
                    Alert.alert('Failed to publish', 'Please try again.');
                } finally {
                    setPublishing(false);
                }
            })();

            return;
        }

        transitionToStep(step + 1);
    };

    const styles = useMemo(() => createStyles({ colors, typography, layout, mode }), [colors, typography, layout, mode]);

    const renderStep1_Camera = () => (
        <Animated.View style={[styles.fullScreenContent, { opacity: stepFade }]}>
            <View style={styles.cameraPlaceholder}>
                <Image source={{ uri: MOCK_PHOTO }} style={StyleSheet.absoluteFillObject} />
                <View style={styles.cameraOverlay} />

                <View style={styles.cameraHeader}>
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <X color="#fff" size={28} />
                    </TouchableOpacity>
                    <View style={styles.cameraStatus}>
                        <View style={styles.statusDot} />
                        <Text style={styles.statusText}>SURVEYING</Text>
                    </View>
                    <TouchableOpacity>
                        <Zap color="#fff" size={24} />
                    </TouchableOpacity>
                </View>

                <View style={styles.cameraFrame}>
                    <View style={[styles.corner, styles.topLeft]} />
                    <View style={[styles.corner, styles.topRight]} />
                    <View style={[styles.corner, styles.bottomLeft]} />
                    <View style={[styles.corner, styles.bottomRight]} />
                </View>
            </View>

            <View style={styles.cameraControls}>
                <TouchableOpacity style={styles.galleryBtn}>
                    <ImageIcon color={colors.text} size={24} />
                </TouchableOpacity>

                <TouchableOpacity style={styles.shutterBtn} onPress={handleNextStep} activeOpacity={0.8}>
                    <View style={styles.shutterInner} />
                </TouchableOpacity>

                <TouchableOpacity style={styles.switchBtn}>
                    <Text style={styles.controlText}>1X</Text>
                </TouchableOpacity>
            </View>
        </Animated.View>
    );

    const renderStep2_Details = () => (
        <Animated.View style={[styles.stepContainer, { opacity: stepFade }]}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => transitionToStep(1)}><X color={colors.text} size={24} /></TouchableOpacity>
                    <Text style={styles.headerTitle}>Discovery Details</Text>
                    <View style={{ width: 24 }} />
                </View>

                <ScrollView contentContainerStyle={styles.detailsScroll}>
                    <View style={styles.inputCard}>
                        <Image source={{ uri: MOCK_PHOTO }} style={styles.imageThumb} />
                        <TextInput
                            style={styles.captionInput}
                            placeholder="What's the vibe here? Tag friends or add thoughts..."
                            placeholderTextColor={colors.textMuted}
                            multiline
                            value={caption}
                            onChangeText={setCaption}
                        />
                    </View>

                    <Text style={styles.sectionLabel}>ENHANCE</Text>

                    <View style={styles.optionsContainer}>
                        <TouchableOpacity style={styles.optionRow}>
                            <View style={[styles.optionIconBox, { backgroundColor: withAlpha(colors.primary, 0.1) }]}>
                                <MapPin color={colors.primary} size={20} />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.optionTitle}>Location</Text>
                                <Text style={styles.optionSubtitle}>Identify where you found this</Text>
                            </View>
                            <ChevronRight color={colors.textMuted} size={18} />
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.optionRow}>
                            <View style={[styles.optionIconBox, { backgroundColor: withAlpha(colors.accent, 0.1) }]}>
                                <Star color={colors.accent} size={20} fill={colors.accent} />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.optionTitle}>Vibe Tags</Text>
                                <Text style={styles.optionSubtitle}>Hidden Gems, Vibes, etc.</Text>
                            </View>
                            <ChevronRight color={colors.textMuted} size={18} />
                        </TouchableOpacity>
                    </View>
                </ScrollView>

                <View style={[styles.footer, { paddingBottom: 40 }]}>
                    <TouchableOpacity style={styles.primaryBtn} onPress={handleNextStep}>
                        <Text style={styles.primaryBtnText}>Preview Discovery</Text>
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </Animated.View>
    );

    const renderStep3_Preview = () => (
        <Animated.View style={[styles.stepContainer, { opacity: stepFade }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => transitionToStep(2)}><ChevronRight style={{ transform: [{ rotate: '180deg' }] }} color={colors.text} size={24} /></TouchableOpacity>
                <Text style={styles.headerTitle}>Post Preview</Text>
                <View style={{ width: 24 }} />
            </View>

            <View style={styles.previewCardContainer}>
                <View style={styles.previewCard}>
                    <Image source={{ uri: MOCK_PHOTO }} style={styles.previewImageLarge} />
                    <View style={styles.previewContent}>
                        <BlurView intensity={30} tint="dark" style={styles.previewTextOverlay}>
                            <Text style={styles.previewCaption}>{caption || "Uncovering a new side of the city..."}</Text>
                            <View style={styles.previewMeta}>
                                <Text style={styles.previewLocation}>Just now • Nearby</Text>
                                <View style={styles.previewBadge}>
                                    <Star size={10} color={colors.onAccent} fill={colors.onAccent} />
                                    <Text style={styles.previewBadgeText}>TRENDING</Text>
                                </View>
                            </View>
                        </BlurView>
                    </View>
                </View>
            </View>

            <View style={[styles.footer, { paddingBottom: 40 }]}>
                <TouchableOpacity
                    style={[styles.primaryBtn, { backgroundColor: colors.accent }]}
                    onPress={handleNextStep}
                    disabled={publishing}
                >
                    <Text style={[styles.primaryBtnText, { color: colors.onAccent }]}>
                        {publishing ? 'Publishing...' : 'Publish to Feed'}
                    </Text>
                </TouchableOpacity>
            </View>
        </Animated.View>
    );

    const renderStep4_Success = () => (
        <View style={[styles.successContainer, { backgroundColor: mode === 'dark' ? '#0B0B0F' : '#F8FAFC' }]}>
            <Animated.View style={{
                alignItems: 'center',
                opacity: xpOpacity,
                transform: [{ scale: xpScale }]
            }}>
                <View style={styles.xpCircle}>
                    <Text style={styles.xpValue}>+50</Text>
                    <Text style={styles.xpLabel}>XP</Text>
                </View>
                <Text style={styles.successTitle}>Discovery Published!</Text>
                <Text style={styles.successSubtitle}>Your contribution has been mapped.</Text>
                <View style={styles.progressRow}>
                    <View style={styles.miniProgress}>
                        <View style={[styles.miniProgressFill, { width: '80%' }]} />
                    </View>
                </View>
            </Animated.View>
        </View>
    );

    return (
        <View style={styles.container}>
            <StatusBar barStyle={step === 1 || step === 4 ? "light-content" : (mode === 'dark' ? "light-content" : "dark-content")} />
            {step === 1 && renderStep1_Camera()}
            {step === 2 && renderStep2_Details()}
            {step === 3 && renderStep3_Preview()}
            {step === 4 && renderStep4_Success()}
        </View>
    );
}

function createStyles({ colors, typography, layout, mode }: any) {
    return StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: colors.background,
        },
        fullScreenContent: {
            flex: 1,
        },
        stepContainer: {
            flex: 1,
        },
        cameraPlaceholder: {
            flex: 1,
            position: 'relative',
        },
        cameraOverlay: {
            ...StyleSheet.absoluteFillObject,
            backgroundColor: 'rgba(0,0,0,0.15)',
        },
        cameraHeader: {
            position: 'absolute',
            top: 60,
            left: layout.padding.l,
            right: layout.padding.l,
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            zIndex: 10,
        },
        cameraStatus: {
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: 'rgba(0,0,0,0.4)',
            paddingHorizontal: 10,
            paddingVertical: 4,
            borderRadius: 4,
        },
        statusDot: {
            width: 6,
            height: 6,
            borderRadius: 3,
            backgroundColor: '#EF4444',
            marginRight: 6,
        },
        statusText: {
            fontSize: 10,
            fontWeight: '900',
            color: '#fff',
            letterSpacing: 2,
        },
        cameraFrame: {
            ...StyleSheet.absoluteFillObject,
            margin: 40,
            borderWidth: 0,
            position: 'relative',
        },
        corner: {
            position: 'absolute',
            width: 24,
            height: 24,
            borderColor: '#fff',
        },
        topLeft: { top: 0, left: 0, borderTopWidth: 2, borderLeftWidth: 2 },
        topRight: { top: 0, right: 0, borderTopWidth: 2, borderRightWidth: 2 },
        bottomLeft: { bottom: 0, left: 0, borderBottomWidth: 2, borderLeftWidth: 2 },
        bottomRight: { bottom: 0, right: 0, borderBottomWidth: 2, borderRightWidth: 2 },

        cameraControls: {
            height: 160,
            flexDirection: 'row',
            justifyContent: 'space-around',
            alignItems: 'center',
            paddingBottom: 40,
            backgroundColor: '#000',
        },
        shutterBtn: {
            width: 76,
            height: 76,
            borderRadius: 38,
            borderWidth: 4,
            borderColor: '#fff',
            justifyContent: 'center',
            alignItems: 'center',
        },
        shutterInner: {
            width: 60,
            height: 60,
            borderRadius: 30,
            backgroundColor: '#fff',
        },
        galleryBtn: {
            width: 44,
            height: 44,
            borderRadius: 12,
            backgroundColor: 'rgba(255,255,255,0.15)',
            justifyContent: 'center',
            alignItems: 'center',
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.1)',
        },
        switchBtn: {
            width: 44,
            height: 44,
            borderRadius: 22,
            backgroundColor: 'rgba(255,255,255,0.15)',
            justifyContent: 'center',
            alignItems: 'center',
        },
        controlText: {
            color: '#fff',
            fontSize: 12,
            fontWeight: '800',
        },
        header: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingTop: 60,
            paddingHorizontal: layout.padding.l,
            paddingBottom: layout.padding.m,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
        },
        headerTitle: {
            ...typography.h3,
            color: colors.text,
        },
        detailsScroll: {
            padding: layout.padding.l,
        },
        inputCard: {
            backgroundColor: colors.surface,
            borderRadius: layout.radius.l,
            padding: layout.padding.m,
            flexDirection: 'row',
            borderWidth: 1,
            borderColor: colors.border,
            marginBottom: layout.padding.xl,
            ...Shadows.soft,
        },
        imageThumb: {
            width: 80,
            height: 100,
            borderRadius: layout.radius.m,
            marginRight: layout.padding.m,
        },
        captionInput: {
            flex: 1,
            ...typography.body,
            color: colors.text,
            textAlignVertical: 'top',
        },
        sectionLabel: {
            ...typography.caption,
            color: colors.textMuted,
            fontWeight: '800',
            letterSpacing: 1.5,
            marginBottom: 12,
            marginLeft: 4,
        },
        optionsContainer: {
            backgroundColor: colors.surface,
            borderRadius: layout.radius.l,
            borderWidth: 1,
            borderColor: colors.border,
            overflow: 'hidden',
            ...Shadows.soft,
        },
        optionRow: {
            flexDirection: 'row',
            alignItems: 'center',
            padding: layout.padding.m,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
        },
        optionIconBox: {
            width: 40,
            height: 40,
            borderRadius: 10,
            justifyContent: 'center',
            alignItems: 'center',
            marginRight: 14,
        },
        optionTitle: {
            ...typography.bodyLarge,
            fontWeight: '600',
            color: colors.text,
        },
        optionSubtitle: {
            ...typography.caption,
            color: colors.textMuted,
        },
        footer: {
            padding: layout.padding.l,
        },
        primaryBtn: {
            backgroundColor: colors.primary,
            height: 56,
            borderRadius: layout.radius.round,
            justifyContent: 'center',
            alignItems: 'center',
            ...Shadows.medium,
        },
        primaryBtnText: {
            ...typography.h3,
            color: colors.onPrimary,
            fontWeight: '800',
        },
        previewCardContainer: {
            flex: 1,
            padding: layout.padding.l,
            justifyContent: 'center',
        },
        previewCard: {
            height: height * 0.55,
            borderRadius: 24,
            overflow: 'hidden',
            backgroundColor: colors.surfaceHighlight,
            ...Shadows.medium,
        },
        previewImageLarge: {
            ...StyleSheet.absoluteFillObject,
        },
        previewContent: {
            ...StyleSheet.absoluteFillObject,
            justifyContent: 'flex-end',
        },
        previewTextOverlay: {
            padding: layout.padding.l,
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            overflow: 'hidden',
        },
        previewCaption: {
            ...typography.h3,
            color: '#fff',
            marginBottom: 12,
        },
        previewMeta: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
        },
        previewLocation: {
            ...typography.bodySmall,
            color: 'rgba(255,255,255,0.7)',
        },
        previewBadge: {
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: colors.accent,
            paddingHorizontal: 8,
            paddingVertical: 4,
            borderRadius: 4,
        },
        previewBadgeText: {
            fontSize: 9,
            fontWeight: '900',
            color: colors.onAccent,
            marginLeft: 4,
        },
        successContainer: {
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
        },
        xpCircle: {
            width: 140,
            height: 140,
            borderRadius: 70,
            backgroundColor: colors.accent,
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: 32,
            ...Shadows.glow(colors.accent),
        },
        xpValue: {
            fontSize: 48,
            fontWeight: '900',
            color: colors.onAccent,
        },
        xpLabel: {
            fontSize: 16,
            fontWeight: '900',
            color: colors.onAccent,
            marginTop: -8,
        },
        successTitle: {
            ...typography.h2,
            color: colors.text,
            marginBottom: 8,
        },
        successSubtitle: {
            ...typography.bodyLarge,
            color: colors.textMuted,
            textAlign: 'center',
            marginBottom: 32,
        },
        progressRow: {
            width: 200,
            alignItems: 'center',
        },
        miniProgress: {
            height: 6,
            width: '100%',
            backgroundColor: colors.surfaceHighlight,
            borderRadius: 3,
            overflow: 'hidden',
        },
        miniProgressFill: {
            height: '100%',
            backgroundColor: colors.accent,
        }
    });
}

function withAlpha(hex: string, alpha: number) {
    const normalized = hex.replace('#', '');
    if (normalized.length !== 6) return `rgba(0,0,0,${alpha})`;
    const r = parseInt(normalized.slice(0, 2), 16);
    const g = parseInt(normalized.slice(2, 4), 16);
    const b = parseInt(normalized.slice(4, 6), 16);
    return `rgba(${r},${g},${b},${alpha})`;
}
