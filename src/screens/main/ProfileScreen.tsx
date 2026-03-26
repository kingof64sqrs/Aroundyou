import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Alert, Switch } from 'react-native';
import { useTheme } from '../../constants/ThemeContext';
import { Settings, Bookmark, History, Bell, MapPin, ChevronRight, LogOut, Shield, AtSign } from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';
import { Shadows } from '../../constants/Theme';

// Preset avatar data (must match UsernameScreen + GamifyScreen)
const PRESET_EMOJIS = ['🦊', '🐼', '🦋', '🐉', '🌙', '⚡', '🔥', '🌊'];
const PRESET_COLORS = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F'];

function UserAvatar({ avatarUrl, name, size = 110 }: { avatarUrl?: string | null; name?: string | null; size?: number }) {
    const { colors } = useTheme();

    if (avatarUrl && !avatarUrl.startsWith('preset:')) {
        return (
            <Image
                source={{ uri: avatarUrl }}
                style={{ width: size, height: size, borderRadius: size / 2 }}
                resizeMode="cover"
            />
        );
    }

    if (avatarUrl?.startsWith('preset:')) {
        const idx = parseInt(avatarUrl.split(':')[1], 10);
        const emoji = PRESET_EMOJIS[idx] ?? '🦊';
        const bg = PRESET_COLORS[idx] ?? colors.surfaceHighlight;
        return (
            <View style={{
                width: size, height: size, borderRadius: size / 2,
                backgroundColor: bg + '55', justifyContent: 'center', alignItems: 'center',
            }}>
                <Text style={{ fontSize: size * 0.46 }}>{emoji}</Text>
            </View>
        );
    }

    // Initials fallback
    const initials = (name || '?').slice(0, 2).toUpperCase();
    return (
        <View style={{
            width: size, height: size, borderRadius: size / 2,
            backgroundColor: colors.surfaceHighlight, justifyContent: 'center', alignItems: 'center',
            borderWidth: 2, borderColor: colors.border,
        }}>
            <Text style={{ fontSize: size * 0.36, fontWeight: '800', color: colors.textMuted }}>{initials}</Text>
        </View>
    );
}

export default function ProfileScreen({ navigation }: any) {
    const { colors, typography, layout, globalStyles, mode, toggleMode } = useTheme();
    const { me, logout } = useAuth();

    const MENU_ITEMS = useMemo(
        () => [
            { icon: <History color={colors.accent} size={22} />, label: 'My Discoveries' },
            { icon: <Bookmark color={colors.accent} size={22} />, label: 'Saved Places' },
            { icon: <MapPin color={colors.accent} size={22} />, label: 'Visited' },
            { icon: <Bell color={colors.accent} size={22} />, label: 'Notifications' },
            { icon: <Shield color={colors.accent} size={22} />, label: 'Privacy' },
        ],
        [colors.accent]
    );

    const handleComingSoon = (feature: string) => {
        Alert.alert('Coming Soon', `${feature} will be available in the next update!`);
    };

    const styles = useMemo(() => createStyles({ colors, typography, layout }), [colors, typography, layout]);

    const displayName = me?.name || me?.email || 'Explorer';
    const handle = me?.username ? `@${me.username}` : (me?.email ?? '');

    return (
        <View style={globalStyles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                {/* Profile Header */}
                <View style={styles.header}>
                    <View style={styles.avatarLarge}>
                        <UserAvatar avatarUrl={me?.avatar_url} name={me?.name} size={110} />
                    </View>
                    <Text style={styles.name}>{displayName}</Text>
                    {!!handle && <Text style={styles.handle}>{handle}</Text>}
                    {!!me?.email && me?.username && (
                        <Text style={styles.detailRow}>{me.email}</Text>
                    )}
                    {!!me?.interests?.length && (
                        <View style={styles.interestRow}>
                            {me.interests.map(i => (
                                <View key={i} style={styles.interestChip}>
                                    <Text style={styles.interestText}>{i}</Text>
                                </View>
                            ))}
                        </View>
                    )}

                    <TouchableOpacity
                        style={styles.editBtn}
                        onPress={() => handleComingSoon('Edit Profile')}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.editBtnText}>Edit Profile</Text>
                    </TouchableOpacity>
                </View>

                {/* Menu Items */}
                <View style={styles.menuContainer}>
                    {MENU_ITEMS.map((item, index) => (
                        <TouchableOpacity key={index} style={styles.menuItem} onPress={() => handleComingSoon(item.label)} activeOpacity={0.7}>
                            <View style={globalStyles.row}>
                                <View style={styles.iconBox}>{item.icon}</View>
                                <Text style={styles.menuLabel}>{item.label}</Text>
                            </View>
                            <View style={globalStyles.row}>
                                <ChevronRight color={colors.textMuted} size={20} />
                            </View>
                        </TouchableOpacity>
                    ))}

                    {/* Theme Toggle */}
                    <View style={styles.menuItem}>
                        <View style={globalStyles.row}>
                            <View style={styles.iconBox}>
                                <Settings color={colors.accent} size={22} />
                            </View>
                            <Text style={styles.menuLabel}>Dark theme</Text>
                        </View>
                        <Switch
                            value={mode === 'dark'}
                            onValueChange={toggleMode}
                            trackColor={{ false: colors.border, true: colors.primary }}
                            thumbColor={mode === 'dark' ? colors.onPrimary : colors.surfaceHighlight}
                        />
                    </View>
                </View>

                {/* Logout */}
                <TouchableOpacity style={styles.logoutBtn} onPress={logout} activeOpacity={0.8}>
                    <LogOut color={colors.danger} size={22} />
                    <Text style={styles.logoutText}>Log Out</Text>
                </TouchableOpacity>

            </ScrollView>
        </View>
    );
}

function createStyles({ colors, typography, layout }: { colors: any; typography: any; layout: any }) {
    return StyleSheet.create({
        scrollContent: { paddingTop: 80, paddingBottom: 100 },
        header: {
            alignItems: 'center',
            paddingHorizontal: layout.padding.xl,
            marginBottom: layout.padding.xl,
        },
        avatarLarge: {
            width: 110, height: 110, borderRadius: 55,
            backgroundColor: colors.surfaceHighlight,
            marginBottom: layout.padding.m,
            overflow: 'hidden',
            borderWidth: 3, borderColor: colors.surface,
            ...Shadows.medium,
        },
        name: { ...typography.h2, color: colors.text, marginBottom: 4 },
        handle: { ...typography.body, color: colors.accent, marginBottom: layout.padding.s, fontWeight: '600' },
        detailRow: { ...typography.caption, color: colors.textMuted, marginBottom: 4 },
        interestRow: {
            flexDirection: 'row',
            flexWrap: 'wrap',
            justifyContent: 'center',
            gap: 8,
            marginTop: layout.padding.s,
            marginBottom: layout.padding.m,
        },
        interestChip: {
            paddingHorizontal: 12,
            paddingVertical: 5,
            borderRadius: layout.radius.round,
            backgroundColor: colors.surfaceHighlight,
            borderWidth: 1,
            borderColor: colors.border,
        },
        interestText: {
            ...typography.caption,
            color: colors.textMuted,
            fontWeight: '600',
        },
        editBtn: {
            marginTop: layout.padding.l,
            width: '100%',
            height: 52,
            borderRadius: layout.radius.round,
            backgroundColor: colors.surfaceHighlight,
            justifyContent: 'center',
            alignItems: 'center',
            borderWidth: 1,
            borderColor: colors.border,
            ...Shadows.soft,
        },
        editBtnText: { ...typography.bodyLarge, fontWeight: '700', color: colors.text },
        menuContainer: { paddingHorizontal: layout.padding.m },
        menuItem: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingVertical: layout.padding.m,
            paddingHorizontal: layout.padding.m,
            backgroundColor: colors.surface,
            marginBottom: 10,
            borderRadius: layout.radius.m,
            borderWidth: 1, borderColor: colors.border,
            ...Shadows.soft,
        },
        iconBox: {
            width: 44, height: 44, borderRadius: 12,
            backgroundColor: colors.surfaceHighlight,
            justifyContent: 'center', alignItems: 'center',
            marginRight: 16,
            borderWidth: 1, borderColor: colors.border,
        },
        menuLabel: { ...typography.bodyLarge, fontWeight: '600', color: colors.text },
        logoutBtn: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            marginTop: layout.padding.l,
            marginBottom: layout.padding.xl,
            padding: layout.padding.m,
            backgroundColor: colors.danger + '10',
            borderRadius: layout.radius.m,
            marginHorizontal: layout.padding.m,
        },
        logoutText: { ...typography.bodyLarge, color: colors.danger, fontWeight: '700', marginLeft: 12 },
    });
}
