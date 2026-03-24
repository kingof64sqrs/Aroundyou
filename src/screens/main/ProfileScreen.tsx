import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Alert, Switch } from 'react-native';
import { useTheme } from '../../constants/ThemeContext';
import { Settings, Bookmark, History, Bell, MapPin, ChevronRight, LogOut, Shield } from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';
import { Shadows } from '../../constants/Theme';

export default function ProfileScreen({ navigation }: any) {
    const { colors, typography, layout, globalStyles, mode, toggleMode } = useTheme();
    const { me, logout } = useAuth();

    const MENU_ITEMS = useMemo(
        () => [
            { icon: <History color={colors.accent} size={22} />, label: 'My Discoveries', count: 12 },
            { icon: <Bookmark color={colors.accent} size={22} />, label: 'Saved Places', count: 45 },
            { icon: <MapPin color={colors.accent} size={22} />, label: 'Visited', count: 89 },
            { icon: <Bell color={colors.accent} size={22} />, label: 'Notifications', badge: true },
            { icon: <Shield color={colors.accent} size={22} />, label: 'Privacy' },
        ],
        [colors.accent]
    );

    const handleComingSoon = (feature: string) => {
        Alert.alert('Coming Soon', `${feature} will be available in the next update!`);
    };

    const styles = useMemo(() => createStyles({ colors, typography, layout }), [colors, typography, layout]);

    return (
        <View style={globalStyles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                {/* Profile Header */}
                <View style={styles.header}>
                    <View style={styles.avatarLarge}>
                        <Image
                            source={{ uri: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb' }}
                            style={StyleSheet.absoluteFillObject}
                        />
                    </View>
                    <Text style={styles.name}>{me?.name || me?.phone || me?.email || 'Explorer'}</Text>
                    <Text style={styles.handle}>{me?.phone || me?.email || ''}</Text>
                    {!!me?.email && <Text style={styles.detailRow}>Email: {me.email}</Text>}
                    {!!me?.interests?.length && <Text style={styles.detailRow}>Interests: {me.interests.join(', ')}</Text>}

                    <View style={styles.statsRow}>
                        <View style={styles.statItem}>
                            <Text style={styles.statNumber}>1.2K</Text>
                            <Text style={styles.statLabel}>Followers</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statItem}>
                            <Text style={styles.statNumber}>340</Text>
                            <Text style={styles.statLabel}>Following</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statItem}>
                            <Text style={styles.statNumber}>12</Text>
                            <Text style={styles.statLabel}>Posts</Text>
                        </View>
                    </View>

                    <TouchableOpacity style={styles.editBtn} onPress={() => handleComingSoon('Edit Profile')} activeOpacity={0.8}>
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
                                {item.count !== undefined && <Text style={styles.menuCount}>{item.count}</Text>}
                                {item.badge && <View style={styles.notificationBadge} />}
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
        scrollContent: {
            paddingTop: 80,
            paddingBottom: 100,
        },
        header: {
            alignItems: 'center',
            paddingHorizontal: layout.padding.xl,
            marginBottom: layout.padding.xl,
        },
        avatarLarge: {
            width: 110,
            height: 110,
            borderRadius: 55,
            backgroundColor: colors.surfaceHighlight,
            marginBottom: layout.padding.m,
            overflow: 'hidden',
            borderWidth: 3,
            borderColor: colors.surface,
            ...Shadows.medium,
        },
        name: {
            ...typography.h2,
            color: colors.text,
            marginBottom: 4,
        },
        handle: {
            ...typography.body,
            color: colors.textMuted,
            marginBottom: layout.padding.l,
        },
        detailRow: {
            ...typography.caption,
            color: colors.textMuted,
            marginBottom: 4,
        },
        statsRow: {
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: colors.glassSurface,
            paddingVertical: layout.padding.m,
            paddingHorizontal: layout.padding.l,
            borderRadius: layout.radius.l,
            marginBottom: layout.padding.l,
            width: '100%',
            justifyContent: 'space-between',
            borderWidth: 1,
            borderColor: colors.glassBorder,
            ...Shadows.soft,
        },
        statItem: {
            flex: 1,
            alignItems: 'center',
        },
        statNumber: {
            ...typography.h3,
            color: colors.text,
            marginBottom: 2,
        },
        statLabel: {
            ...typography.caption,
            color: colors.textMuted,
            textTransform: 'uppercase',
            letterSpacing: 1,
        },
        statDivider: {
            width: 1,
            height: 24,
            backgroundColor: colors.border,
            opacity: 0.5,
        },
        editBtn: {
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
        editBtnText: {
            ...typography.bodyLarge,
            fontWeight: '700',
            color: colors.text,
        },
        menuContainer: {
            paddingHorizontal: layout.padding.m,
        },
        menuItem: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingVertical: layout.padding.m,
            paddingHorizontal: layout.padding.m,
            backgroundColor: colors.surface,
            marginBottom: 10,
            borderRadius: layout.radius.m,
            borderWidth: 1,
            borderColor: colors.border,
            ...Shadows.soft,
        },
        iconBox: {
            width: 44,
            height: 44,
            borderRadius: 12,
            backgroundColor: colors.surfaceHighlight,
            justifyContent: 'center',
            alignItems: 'center',
            marginRight: 16,
            borderWidth: 1,
            borderColor: colors.border,
        },
        menuLabel: {
            ...typography.bodyLarge,
            fontWeight: '600',
            color: colors.text,
        },
        menuCount: {
            ...typography.bodyLarge,
            color: colors.textMuted,
            marginRight: 8,
            fontWeight: '600',
        },
        notificationBadge: {
            width: 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: colors.accent,
            marginRight: 10,
        },
        logoutBtn: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            marginTop: layout.padding.l,
            marginBottom: layout.padding.xl,
            padding: layout.padding.m,
            backgroundColor: colors.danger + '10', // 10% opacity
            borderRadius: layout.radius.m,
            marginHorizontal: layout.padding.m,
        },
        logoutText: {
            ...typography.bodyLarge,
            color: colors.danger,
            fontWeight: '700',
            marginLeft: 12,
        }
    });
}
