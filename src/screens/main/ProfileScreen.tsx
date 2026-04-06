import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Dimensions, StatusBar } from 'react-native';
import { useTheme } from '../../constants/ThemeContext';
import { Settings, ChevronUp, ChevronDown, Bookmark, CheckCircle, Moon, Shield, Award, LogOut } from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

const MOCK_LEADERBOARD = [
    { id: '1', rank: '01', name: 'NEON_VULTURE', clout: '12.4k', isMe: false, avatar: 'https://images.unsplash.com/photo-1542156822-6924d1a71ace?w=150' },
    { id: '2', rank: '02', name: 'STEEZ_LORD', clout: '9.2k', isMe: true, avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150' },
    { id: '3', rank: '03', name: 'VOID_WALKER', clout: '8.9k', isMe: false, avatar: 'https://images.unsplash.com/photo-1544723795-3fb6469f5b39?w=150' },
];

const MOCK_DROPS = [
    { id: '1', title: 'SPEAKEASY', subtitle: 'RED_ROOM_01', img: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=400' },
    { id: '2', title: 'MINIMALIST', subtitle: 'DARK_ROAST', img: 'https://images.unsplash.com/photo-1497935586351-b67a49e012bf?w=400' },
    { id: '3', title: 'VIEWPOINT', subtitle: 'LEVEL_7_SKY', img: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=400' },
    { id: '4', title: 'STREET FOOD', subtitle: 'NEON_RAMEN', img: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400' },
];

export default function ProfileScreen() {
    const { mode } = useTheme();
    const { me, logout } = useAuth();
    const insets = useSafeAreaInsets();
    const [activeTab, setActiveTab] = useState<'treasures' | 'drops'>('treasures');

    const styles = useMemo(() => createStyles(), []);

    const displayName = me?.username ? me.username.toUpperCase() : 'STEEZ_LORD';

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />

            {/* Top App Bar */}
            <BlurView intensity={80} tint="dark" style={[styles.topBar, { paddingTop: insets.top + 16 }]}>
                <View style={styles.topBarLeft}>
                    <View style={styles.miniAvatarWrap}>
                        <Image
                            source={{ uri: me?.avatar_url || 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150' }}
                            style={styles.miniAvatar}
                        />
                    </View>
                    <Text style={styles.mainCharText}>MAIN CHARACTER</Text>
                </View>
                <View style={styles.topBarRight}>
                    <View style={styles.cloutBlock}>
                        <Text style={styles.cloutLabel}>CLOUT</Text>
                        <Text style={styles.cloutValue}>9.2k</Text>
                    </View>
                    <TouchableOpacity activeOpacity={0.8} onPress={logout}>
                        <LogOut color="rgba(255,255,255,0.6)" size={20} />
                    </TouchableOpacity>
                </View>
            </BlurView>

            <ScrollView contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 80, paddingBottom: 160 }]} showsVerticalScrollIndicator={false}>

                {/* Profile Header */}
                <View style={styles.headerSection}>
                    <View>
                        <Text style={styles.heroName}>{displayName}</Text>
                        <View style={styles.levelRow}>
                            <Text style={styles.levelLabel}>LEVEL 42</Text>
                            <View style={styles.levelDot} />
                            <Text style={styles.titleLabel}>NIGHT CRAWLER</Text>
                        </View>
                    </View>
                    <TouchableOpacity style={styles.editBtn}>
                        <Text style={styles.editBtnText}>EDIT_HUB</Text>
                    </TouchableOpacity>
                </View>

                {/* Aura Bento */}
                <View style={styles.bentoGrid}>
                    <View style={[styles.bentoCard, { borderLeftColor: '#00f1fe' }]}>
                        <Text style={styles.bentoLabel}>Aura Points</Text>
                        <View style={styles.bentoValueRow}>
                            <Text style={styles.bentoValue}>+1,204</Text>
                            <Award color="#00f1fe" fill="#00f1fe" size={24} />
                        </View>
                    </View>
                    <View style={[styles.bentoCard, { borderLeftColor: '#ff00ff' }]}>
                        <Text style={styles.bentoLabel}>City Rank</Text>
                        <View style={styles.bentoValueRow}>
                            <Text style={styles.bentoValue}>#02</Text>
                            <Text style={styles.legendTag}>LEGEND</Text>
                        </View>
                    </View>
                </View>

                {/* Leaderboard */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Legends Leaderboard</Text>
                    <Text style={styles.sectionSub}>REFRESHING...</Text>
                </View>
                <View style={styles.leaderboardList}>
                    {MOCK_LEADERBOARD.map((item, index) => {
                        if (item.isMe) {
                            return (
                                <View key={item.id} style={styles.rankMeContainer}>
                                    <View style={styles.rankMeGradientStrip} />
                                    <View style={styles.rankRow}>
                                        <Text style={styles.rankMeNum}>{item.rank}</Text>
                                        <Image source={{ uri: item.avatar }} style={styles.rankMeAvatar} />
                                        <View style={styles.rankInfo}>
                                            <View style={styles.rankNameRow}>
                                                <Text style={styles.rankNameMe}>{item.name}</Text>
                                                <View style={styles.youBadge}><Text style={styles.youBadgeText}>YOU</Text></View>
                                            </View>
                                            <Text style={styles.rankCloutMe}>{item.clout} Clout</Text>
                                        </View>
                                    </View>
                                    <LinearGradient colors={['#22d3ee', '#06b6d4']} start={[0, 0]} end={[1, 0]} style={styles.hypeTag}>
                                        <Text style={styles.hypeTagText}>MAIN_CHAR</Text>
                                    </LinearGradient>
                                </View>
                            );
                        }
                        return (
                            <View key={item.id} style={styles.rankCard}>
                                <View style={styles.rankRow}>
                                    <Text style={styles.rankNum}>{item.rank}</Text>
                                    <Image source={{ uri: item.avatar }} style={[styles.rankAvatar, { opacity: 0.7 }]} />
                                    <View style={styles.rankInfo}>
                                        <Text style={styles.rankName}>{item.name}</Text>
                                        <Text style={styles.rankClout}>{item.clout} Clout</Text>
                                    </View>
                                </View>
                                {index === 0 ? <ChevronUp color="rgba(255,255,255,0.2)" size={20} /> : <ChevronDown color="rgba(255,255,255,0.2)" size={20} />}
                            </View>
                        );
                    })}
                </View>

                {/* Vibe Badges */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Vibe Collection</Text>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.vibeScroll}>
                    <View style={[styles.vibeCard, { borderBottomColor: '#00f1fe' }]}>
                        <View style={[styles.vibeIconWrap, { backgroundColor: 'rgba(0, 241, 254, 0.1)' }]}>
                            <Moon color="#00f1fe" fill="#00f1fe" size={32} />
                        </View>
                        <Text style={styles.vibeText}>NIGHT{'\n'}OWL</Text>
                    </View>
                    <View style={[styles.vibeCard, { borderBottomColor: '#ff00ff' }]}>
                        <View style={[styles.vibeIconWrap, { backgroundColor: 'rgba(255, 0, 255, 0.1)' }]}>
                            <CheckCircle color="#ff00ff" fill="#ff00ff" size={32} />
                        </View>
                        <Text style={styles.vibeText}>SASHIMI{'\n'}HUNTER</Text>
                    </View>
                    <View style={[styles.vibeCard, { borderBottomColor: '#b190ff' }]}>
                        <View style={[styles.vibeIconWrap, { backgroundColor: 'rgba(177, 144, 255, 0.1)' }]}>
                            <Shield color="#b190ff" fill="#b190ff" size={32} />
                        </View>
                        <Text style={styles.vibeText}>CITY{'\n'}LEGEND</Text>
                    </View>
                    <View style={[styles.vibeCard, { borderBottomColor: 'transparent', opacity: 0.4 }]}>
                        <View style={[styles.vibeIconWrap, { backgroundColor: 'rgba(255, 255, 255, 0.05)' }]}>
                            <Shield color="rgba(255, 255, 255, 0.2)" fill="rgba(255, 255, 255, 0.2)" size={32} />
                        </View>
                        <Text style={[styles.vibeText, { color: 'rgba(255, 255, 255, 0.2)' }]}>LOCKED</Text>
                    </View>
                </ScrollView>

                {/* Tabbed View */}
                <View style={styles.tabContainer}>
                    <TouchableOpacity style={[styles.tabBtn, activeTab === 'treasures' && styles.tabBtnActive]} onPress={() => setActiveTab('treasures')}>
                        <Text style={[styles.tabText, activeTab === 'treasures' && styles.tabTextActive]}>TREASURES</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.tabBtn, activeTab === 'drops' && styles.tabBtnActive]} onPress={() => setActiveTab('drops')}>
                        <Text style={[styles.tabText, activeTab === 'drops' && styles.tabTextActive]}>MY_DROPS</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.gridContainer}>
                    {MOCK_DROPS.map((drop) => (
                        <TouchableOpacity key={drop.id} style={styles.gridItem} activeOpacity={0.9}>
                            <Image source={{ uri: drop.img }} style={styles.gridImg} />
                            <LinearGradient colors={['transparent', 'rgba(0,0,0,0.8)']} style={styles.gridOverlay} />
                            <View style={styles.gridBottom}>
                                <Text style={styles.gridSub}>{drop.title}</Text>
                                <Text style={styles.gridMain}>{drop.subtitle}</Text>
                            </View>
                            <View style={styles.gridTopRight}>
                                <Bookmark color="#00f1fe" fill="#00f1fe" size={18} />
                            </View>
                        </TouchableOpacity>
                    ))}
                </View>

                <TouchableOpacity style={styles.loadMoreBtn}>
                    <Text style={styles.loadMoreText}>LOAD_MORE_INTEL</Text>
                </TouchableOpacity>

            </ScrollView>
        </View>
    );
}

function createStyles() {
    return StyleSheet.create({
        container: { flex: 1, backgroundColor: '#0a0a0c' },

        topBar: { position: 'absolute', top: 0, width: '100%', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingBottom: 20, zIndex: 10, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
        topBarLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
        miniAvatarWrap: { width: 36, height: 36, borderRadius: 18, borderWidth: 1, borderColor: '#00f1fe50', padding: 2, overflow: 'hidden' },
        miniAvatar: { width: '100%', height: '100%', borderRadius: 18 },
        mainCharText: { fontFamily: 'Syncopate_700Bold', fontSize: 14, color: '#00f1fe', letterSpacing: 1 },

        topBarRight: { flexDirection: 'row', alignItems: 'center', gap: 24 },
        cloutBlock: { alignItems: 'flex-end' },
        cloutLabel: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 10, color: 'rgba(255,255,255,0.4)', letterSpacing: 2, marginBottom: 2 },
        cloutValue: { fontFamily: 'Syncopate_700Bold', fontSize: 14, color: '#00f1fe' },

        scrollContent: { paddingHorizontal: 24 },

        headerSection: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 },
        heroName: { fontFamily: 'Syncopate_700Bold', fontSize: 24, color: '#fff', letterSpacing: -1, marginBottom: 8 },
        levelRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
        levelLabel: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 10, letterSpacing: 3, color: 'rgba(255,255,255,0.5)' },
        levelDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.2)' },
        titleLabel: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 10, letterSpacing: 3, color: '#00f1fe' },
        editBtn: { backgroundColor: '#fff', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 99 },
        editBtnText: { fontFamily: 'Syncopate_700Bold', fontSize: 10, color: '#000', letterSpacing: 2 },

        bentoGrid: { flexDirection: 'row', gap: 16, marginBottom: 40 },
        bentoCard: { flex: 1, backgroundColor: 'rgba(255,255,255,0.03)', padding: 24, borderRadius: 16, borderLeftWidth: 2 },
        bentoLabel: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 10, letterSpacing: 2, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', marginBottom: 16 },
        bentoValueRow: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
        bentoValue: { fontFamily: 'Syncopate_700Bold', fontSize: 24, color: '#fff' },
        legendTag: { fontFamily: 'Syncopate_700Bold', fontSize: 9, color: '#ff00ff', letterSpacing: 1 },

        sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 24 },
        sectionTitle: { fontFamily: 'Syncopate_700Bold', fontSize: 12, letterSpacing: 3, color: 'rgba(255,255,255,0.9)', fontStyle: 'italic' },
        sectionSub: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 9, letterSpacing: 2, color: 'rgba(255,255,255,0.3)' },

        leaderboardList: { gap: 4, marginBottom: 40 },
        rankCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 16 },
        rankMeContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(0,241,254,0.3)', overflow: 'hidden' },
        rankMeGradientStrip: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, backgroundColor: '#00f1fe' },
        rankRow: { flexDirection: 'row', alignItems: 'center', gap: 20 },
        rankNum: { fontFamily: 'Syncopate_700Bold', fontSize: 14, color: 'rgba(255,255,255,0.2)', width: 24, fontStyle: 'italic' },
        rankMeNum: { fontFamily: 'Syncopate_700Bold', fontSize: 14, color: '#00f1fe', width: 24, fontStyle: 'italic' },
        rankAvatar: { width: 48, height: 48, borderRadius: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
        rankMeAvatar: { width: 48, height: 48, borderRadius: 24, borderWidth: 2, borderColor: 'rgba(0,241,254,0.5)' },
        rankInfo: { justifyContent: 'center' },
        rankName: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 14, color: 'rgba(255,255,255,0.9)', letterSpacing: -0.5 },
        rankClout: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 9, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 2, marginTop: 4 },
        rankNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
        rankNameMe: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 14, color: '#fff', letterSpacing: -0.5 },
        youBadge: { borderWidth: 1, borderColor: 'rgba(0,241,254,0.3)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
        youBadgeText: { fontFamily: 'Syncopate_700Bold', fontSize: 8, color: '#00f1fe' },
        rankCloutMe: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 9, color: '#00f1fe', textTransform: 'uppercase', letterSpacing: 2, marginTop: 4 },
        hypeTag: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
        hypeTagText: { fontFamily: 'Syncopate_700Bold', fontSize: 8, color: '#000', letterSpacing: 1 },

        vibeScroll: { gap: 16, paddingBottom: 16, marginBottom: 32 },
        vibeCard: { width: 128, height: 160, backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 16, alignItems: 'center', justifyContent: 'center', padding: 16, borderBottomWidth: 2 },
        vibeIconWrap: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
        vibeText: { fontFamily: 'Syncopate_700Bold', fontSize: 9, color: '#fff', textAlign: 'center', letterSpacing: 2, lineHeight: 14 },

        tabContainer: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)', marginBottom: 20 },
        tabBtn: { flex: 1, paddingBottom: 16, alignItems: 'center', justifyContent: 'center', borderBottomWidth: 1, borderBottomColor: 'transparent' },
        tabBtnActive: { borderBottomColor: '#00f1fe' },
        tabText: { fontFamily: 'Syncopate_700Bold', fontSize: 10, color: 'rgba(255,255,255,0.3)', letterSpacing: 2 },
        tabTextActive: { color: '#00f1fe' },

        gridContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 20 },
        gridItem: { width: (width - 48 - 20) / 2, aspectRatio: 4 / 5, borderRadius: 16, overflow: 'hidden', backgroundColor: '#141417' },
        gridImg: { width: '100%', height: '100%', resizeMode: 'cover' },
        gridOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, height: '50%' },
        gridBottom: { position: 'absolute', bottom: 16, left: 16, right: 16 },
        gridSub: { fontFamily: 'Syncopate_700Bold', fontSize: 8, color: '#00f1fe', letterSpacing: 1, marginBottom: 4 },
        gridMain: { fontFamily: 'Syncopate_700Bold', fontSize: 12, color: '#fff', letterSpacing: -0.5 },
        gridTopRight: { position: 'absolute', top: 16, right: 16 },

        loadMoreBtn: { marginTop: 32, alignItems: 'center' },
        loadMoreText: { fontFamily: 'Syncopate_700Bold', fontSize: 9, color: 'rgba(255,255,255,0.3)', letterSpacing: 4 },
    });
}
