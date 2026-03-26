import React, { useMemo, useState } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, TextInput,
    ScrollView, KeyboardAvoidingView, Platform, Alert, Image, ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Camera, User as UserIcon, ArrowRight, AtSign, Sparkles } from 'lucide-react-native';

import { useTheme } from '../../constants/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { Shadows } from '../../constants/Theme';
import { updateMe, uploadAvatar } from '../../services/api';

// 8 preset avatar options using placeholder images
const PRESET_AVATARS = [
    'https://i.pravatar.cc/150?img=11',
    'https://i.pravatar.cc/150?img=32',
    'https://i.pravatar.cc/150?img=33',
    'https://i.pravatar.cc/150?img=44',
    'https://i.pravatar.cc/150?img=55',
    'https://i.pravatar.cc/150?img=60',
    'https://i.pravatar.cc/150?img=68',
    'https://i.pravatar.cc/150?img=69',
];
const AVATAR_BG_COLORS = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4',
    '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F',
];

export default function UsernameScreen({ navigation }: any) {
    const { colors, typography, layout, globalStyles, mode } = useTheme();
    const { token, me } = useAuth();

    const [name, setName] = useState(me?.name || '');
    const [username, setUsername] = useState('');
    const [selectedPreset, setSelectedPreset] = useState<number | null>(null);
    const [customAvatarUri, setCustomAvatarUri] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const styles = useMemo(() => createStyles({ colors, typography, layout, mode }), [colors, typography, layout, mode]);

    const isValid = name.trim().length >= 2 && username.trim().length >= 3 && (selectedPreset !== null || customAvatarUri);

    const handlePickPhoto = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission needed', 'Please allow photo library access to upload an avatar.');
            return;
        }
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
        });
        if (!result.canceled && result.assets[0]) {
            setCustomAvatarUri(result.assets[0].uri);
            setSelectedPreset(null);
        }
    };

    const handleContinue = async () => {
        if (!isValid || !token) return;
        setLoading(true);
        try {
            let avatarUrl: string | null = null;

            if (customAvatarUri) {
                try {
                    avatarUrl = await uploadAvatar(token, customAvatarUri);
                } catch (err) {
                    console.warn('[UsernameScreen] Avatar upload failed, continuing without avatar');
                }
            } else if (selectedPreset !== null) {
                // For preset avatars we store a special string marker "preset:{index}"
                avatarUrl = `preset:${selectedPreset}`;
            }

            await updateMe(token, {
                name: name.trim(),
                username: username.trim().toLowerCase(),
                avatar_url: avatarUrl,
            });

            navigation.replace('Interests');
        } catch (err: any) {
            const msg = err?.message || 'Something went wrong';
            Alert.alert('Error', msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={globalStyles.container}>
            <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
                <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                    {/* Header */}
                    <View style={styles.header}>
                        <View style={styles.logoBadge}>
                            <Sparkles color={colors.onAccent} size={28} />
                        </View>
                        <Text style={typography.h1}>Set up your profile</Text>
                        <Text style={[typography.body, { color: colors.textMuted, marginTop: layout.padding.m, textAlign: 'center' }]}>
                            Tell us who you are — this is how other explorers will know you.
                        </Text>
                    </View>

                    {/* Avatar Section */}
                    <View style={styles.avatarSection}>
                        <Text style={styles.sectionLabel}>Choose your avatar</Text>

                        {/* Custom photo button */}
                        <View style={{ alignSelf: 'center', marginBottom: layout.padding.l, position: 'relative' }}>
                            <TouchableOpacity style={styles.photoUploadBtn} onPress={handlePickPhoto} activeOpacity={0.8}>
                                {customAvatarUri ? (
                                    <Image source={{ uri: customAvatarUri }} style={styles.customAvatarImg} />
                                ) : (
                                    <>
                                        <Camera color={colors.accent} size={32} />
                                        <Text style={styles.photoUploadText}>Upload photo</Text>
                                    </>
                                )}
                            </TouchableOpacity>
                            {customAvatarUri && (
                                <View style={styles.photoEditBadge}>
                                    <Camera color={colors.onAccent} size={16} />
                                </View>
                            )}
                        </View>

                        {/* OR divider */}
                        <View style={styles.dividerRow}>
                            <View style={styles.dividerLine} />
                            <Text style={styles.dividerText}>or pick one</Text>
                            <View style={styles.dividerLine} />
                        </View>

                        {/* Preset avatars grid */}
                        <View style={styles.presetGrid}>
                            {PRESET_AVATARS.map((url, idx) => {
                                const isSelected = selectedPreset === idx && !customAvatarUri;
                                return (
                                    <TouchableOpacity
                                        key={idx}
                                        style={[
                                            styles.presetItem,
                                            { backgroundColor: AVATAR_BG_COLORS[idx] + '33' },
                                            isSelected && { borderColor: colors.accent, borderWidth: 2, ...Shadows.glow(colors.accent) },
                                        ]}
                                        onPress={() => {
                                            setSelectedPreset(idx);
                                            setCustomAvatarUri(null);
                                        }}
                                        activeOpacity={0.7}
                                    >
                                        <Image source={{ uri: url }} style={{ width: 60, height: 60, borderRadius: 18 }} />
                                        {isSelected && (
                                            <View style={[styles.presetCheck, { backgroundColor: colors.accent }]}>
                                                <Text style={{ color: colors.onAccent, fontSize: 10, fontWeight: '800' }}>✓</Text>
                                            </View>
                                        )}
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </View>

                    {/* Name + Username Inputs */}
                    <View style={styles.formSection}>
                        <Text style={styles.sectionLabel}>Your details</Text>

                        <View style={styles.inputWrapper}>
                            <UserIcon color={colors.textMuted} size={18} style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="Display name"
                                placeholderTextColor={colors.textSubtle}
                                value={name}
                                onChangeText={setName}
                                maxLength={50}
                                autoCapitalize="words"
                            />
                        </View>

                        <View style={styles.inputWrapper}>
                            <AtSign color={colors.textMuted} size={18} style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="username (min 3 chars, lowercase)"
                                placeholderTextColor={colors.textSubtle}
                                value={username}
                                onChangeText={t => setUsername(t.toLowerCase().replace(/[^a-z0-9_.]/g, ''))}
                                maxLength={40}
                                autoCapitalize="none"
                                autoCorrect={false}
                            />
                        </View>
                    </View>
                </ScrollView>

                {/* Footer CTA */}
                <View style={styles.footer}>
                    <TouchableOpacity
                        style={[styles.button, (!isValid || loading) && styles.buttonDisabled]}
                        onPress={handleContinue}
                        disabled={!isValid || loading}
                        activeOpacity={0.85}
                    >
                        {loading
                            ? <ActivityIndicator color={colors.onAccent} size="small" style={{ marginRight: 8 }} />
                            : <Sparkles color={colors.onAccent} size={20} style={{ marginRight: 8 }} />}
                        <Text style={styles.buttonText}>{loading ? 'Saving...' : 'Continue'}</Text>
                        {!loading && <ArrowRight color={isValid ? colors.onAccent : colors.textSubtle} size={20} style={{ marginLeft: 8 }} />}
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </View>
    );
}

function createStyles({ colors, typography, layout, mode }: any) {
    return StyleSheet.create({
        scroll: {
            paddingBottom: 20,
        },
        header: {
            alignItems: 'center',
            paddingHorizontal: layout.padding.xl,
            paddingTop: 80,
            paddingBottom: layout.padding.l,
        },
        logoBadge: {
            width: 64,
            height: 64,
            borderRadius: 20,
            backgroundColor: colors.accent,
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: layout.padding.l,
            ...Shadows.glow(colors.accent),
        },
        sectionLabel: {
            ...typography.caption,
            color: colors.textMuted,
            fontWeight: '700',
            textTransform: 'uppercase',
            letterSpacing: 1.2,
            marginBottom: layout.padding.m,
        },
        avatarSection: {
            paddingHorizontal: layout.padding.xl,
            marginBottom: layout.padding.l,
        },
        photoUploadBtn: {
            width: 120,
            height: 120,
            borderRadius: 60,
            backgroundColor: colors.surfaceHighlight,
            borderWidth: 2,
            borderColor: colors.border,
            borderStyle: 'dashed',
            justifyContent: 'center',
            alignItems: 'center',
            overflow: 'hidden',
        },
        customAvatarImg: {
            width: 120,
            height: 120,
            borderRadius: 60,
            resizeMode: 'cover',
        },
        photoEditBadge: {
            position: 'absolute',
            bottom: 4,
            right: 4,
            width: 32,
            height: 32,
            borderRadius: 16,
            backgroundColor: colors.accent,
            justifyContent: 'center',
            alignItems: 'center',
            ...Shadows.medium,
        },
        photoUploadText: {
            ...typography.caption,
            color: colors.textMuted,
            marginTop: 6,
            fontWeight: '600',
        },
        dividerRow: {
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: layout.padding.l,
        },
        dividerLine: {
            flex: 1,
            height: 1,
            backgroundColor: colors.border,
        },
        dividerText: {
            ...typography.caption,
            color: colors.textMuted,
            marginHorizontal: layout.padding.m,
        },
        presetGrid: {
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: 12,
            justifyContent: 'center',
        },
        presetItem: {
            width: 64,
            height: 64,
            borderRadius: 20,
            justifyContent: 'center',
            alignItems: 'center',
            borderWidth: 1.5,
            borderColor: colors.border,
            position: 'relative',
        },
        presetEmoji: {
            display: 'none',
        },
        presetCheck: {
            position: 'absolute',
            top: -6,
            right: -6,
            width: 18,
            height: 18,
            borderRadius: 9,
            justifyContent: 'center',
            alignItems: 'center',
        },
        formSection: {
            paddingHorizontal: layout.padding.xl,
            marginTop: layout.padding.l,
            gap: layout.padding.m,
        },
        inputWrapper: {
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: colors.surface,
            borderRadius: layout.radius.m,
            borderWidth: 1,
            borderColor: colors.border,
            paddingHorizontal: layout.padding.m,
            height: 52,
            ...Shadows.soft,
        },
        inputIcon: {
            marginRight: layout.padding.s,
        },
        input: {
            flex: 1,
            ...typography.body,
            color: colors.text,
        },
        footer: {
            padding: layout.padding.xl,
            paddingBottom: 40,
            backgroundColor: colors.background,
        },
        button: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: colors.accent,
            height: 56,
            borderRadius: layout.radius.round,
            ...Shadows.glow(colors.accent),
        },
        buttonDisabled: {
            backgroundColor: colors.surfaceHighlight,
            shadowOpacity: 0,
            elevation: 0,
            opacity: 0.5,
        },
        buttonText: {
            ...typography.h3,
            color: colors.onAccent,
            fontWeight: '700',
        },
    });
}
