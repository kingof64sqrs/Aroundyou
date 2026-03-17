import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Alert, Switch } from 'react-native';
import { useTheme } from '../../constants/ThemeContext';
import { Settings, Bookmark, History, Bell, MapPin, ChevronRight, LogOut } from 'lucide-react-native';

export default function ProfileScreen({ navigation }: any) {
    const { colors, typography, layout, globalStyles, mode, toggleMode } = useTheme();

    const MENU_ITEMS = useMemo(
        () => [
            { icon: <History color={colors.text} size={24} />, label: 'My Discoveries', count: 12 },
            { icon: <Bookmark color={colors.text} size={24} />, label: 'Saved Places', count: 45 },
            { icon: <MapPin color={colors.text} size={24} />, label: 'Visited', count: 89 },
            { icon: <Bell color={colors.text} size={24} />, label: 'Notifications', badge: true },
            { icon: <Settings color={colors.text} size={24} />, label: 'Settings' },
        ],
        [colors.text]
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
                    <Text style={styles.name}>Sarah K.</Text>
                    <Text style={styles.handle}>@sarah_explores</Text>

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
                                <Settings color={colors.text} size={22} />
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
                <TouchableOpacity style={styles.logoutBtn} onPress={() => navigation.replace('Splash')} activeOpacity={0.8}>
                    <LogOut color={colors.accent} size={24} />
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
        paddingBottom: 100, // accommodate bottom tab
    },
    header: {
        alignItems: 'center',
        paddingHorizontal: layout.padding.xl,
        marginBottom: layout.padding.xl,
    },
    avatarLarge: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: colors.primary,
        marginBottom: layout.padding.m,
        overflow: 'hidden',
        borderWidth: 2,
        borderColor: colors.surface,
    },
    name: {
        ...typography.h2,
        marginBottom: 4,
    },
    handle: {
        ...typography.body,
        color: colors.textMuted,
        marginBottom: layout.padding.l,
    },
    statsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.surface,
        paddingVertical: layout.padding.m,
        paddingHorizontal: layout.padding.xl,
        borderRadius: layout.radius.m,
        marginBottom: layout.padding.l,
        width: '100%',
        justifyContent: 'space-between',
    },
    statItem: {
        alignItems: 'center',
    },
    statNumber: {
        ...typography.h3,
        marginBottom: 4,
    },
    statLabel: {
        ...typography.caption,
        color: colors.textMuted,
    },
    statDivider: {
        width: 1,
        height: 30,
        backgroundColor: colors.border,
    },
    editBtn: {
        width: '100%',
        height: 48,
        borderRadius: layout.radius.round,
        backgroundColor: colors.surfaceHighlight,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.glassBorder,
    },
    editBtnText: {
        ...typography.bodyLarge,
        fontWeight: '600',
    },
    menuContainer: {
        paddingHorizontal: layout.padding.m,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: layout.padding.l,
        paddingHorizontal: layout.padding.m,
        backgroundColor: colors.surface,
        marginBottom: 8,
        borderRadius: layout.radius.m,
        borderWidth: 1,
        borderColor: colors.glassBorder,
    },
    iconBox: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: colors.surfaceHighlight,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
        borderWidth: 1,
        borderColor: colors.glassBorder,
    },
    menuLabel: {
        ...typography.bodyLarge,
        fontWeight: '500',
    },
    menuCount: {
        ...typography.bodyLarge,
        color: colors.textMuted,
        marginRight: 12,
    },
    notificationBadge: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: colors.accent,
        marginRight: 12,
    },
    logoutBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: layout.padding.xl,
        padding: layout.padding.m,
    },
    logoutText: {
        ...typography.bodyLarge,
        color: colors.accent,
        fontWeight: '600',
        marginLeft: 12,
    }
    });
}
