import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Image, Dimensions, Animated, KeyboardAvoidingView, ScrollView, Platform } from 'react-native';
import { useTheme } from '../../constants/ThemeContext';
import { Camera, Image as ImageIcon, MapPin, X, Check, Star } from 'lucide-react-native';

const { width, height } = Dimensions.get('window');

// Mock image for the camera simulation
const MOCK_PHOTO = 'https://images.unsplash.com/photo-1509042239860-f550ce710b93';

export default function PostScreen({ navigation }: any) {
    const { colors, typography, layout, globalStyles } = useTheme();
    const [step, setStep] = useState(1);
    const [caption, setCaption] = useState('');

    // Animation value for XP Burst
    const xpScale = React.useRef(new Animated.Value(0)).current;
    const xpOpacity = React.useRef(new Animated.Value(0)).current;

    const handleNextStep = () => {
        if (step === 3) {
            // Trigger success animation
            setStep(4);
            Animated.sequence([
                Animated.parallel([
                    Animated.spring(xpScale, {
                        toValue: 1,
                        friction: 4,
                        useNativeDriver: true,
                    }),
                    Animated.timing(xpOpacity, {
                        toValue: 1,
                        duration: 300,
                        useNativeDriver: true,
                    })
                ]),
                Animated.delay(2000),
            ]).start(() => {
                // Reset and go home
                setStep(1);
                setCaption('');
                navigation.navigate('HomeTab');
            });
        } else {
            setStep(s => s + 1);
        }
    };

    const styles = React.useMemo(() => createStyles({ colors, typography, layout, globalStyles }), [colors, typography, layout, globalStyles]);

    const ChevronRightIcon = () => <Text style={{ color: colors.textMuted, fontSize: 18 }}>›</Text>;
    const ChevronLeftIcon = () => <Text style={{ color: colors.text, fontSize: 24 }}>‹</Text>;

    const renderStep1_Camera = () => (
        <View style={styles.fullScreenContent}>
            <View style={styles.cameraPlaceholder}>
                <Image source={{ uri: MOCK_PHOTO }} style={StyleSheet.absoluteFillObject} />
                <View style={styles.cameraOverlay}>
                    <Text style={typography.bodyLarge}>Simulating Camera View</Text>
                </View>
            </View>

            <View style={styles.cameraControls}>
                <TouchableOpacity style={styles.galleryBtn}>
                    <ImageIcon color={colors.text} size={24} />
                </TouchableOpacity>

                <TouchableOpacity style={styles.shutterBtn} onPress={handleNextStep}>
                    <View style={styles.shutterInner} />
                </TouchableOpacity>

                <TouchableOpacity style={styles.switchBtn}>
                    <Text style={typography.bodyLarge}>Switch</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    const renderStep2_Details = () => (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={globalStyles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => setStep(1)}><X color={colors.text} size={24} /></TouchableOpacity>
                <Text style={typography.h3}>New Discovery</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView contentContainerStyle={{ padding: layout.padding.m }}>
                <View style={styles.previewStrip}>
                    <Image source={{ uri: MOCK_PHOTO }} style={styles.imageThumb} />
                    <TextInput
                        style={styles.captionInput}
                        placeholder="What's the vibe here?"
                        placeholderTextColor={colors.textMuted}
                        multiline
                        value={caption}
                        onChangeText={setCaption}
                    />
                </View>

                <TouchableOpacity style={styles.optionRow}>
                    <MapPin color={colors.textMuted} size={20} />
                    <Text style={styles.optionText}>Add Location</Text>
                    <ChevronRightIcon />
                </TouchableOpacity>

                <TouchableOpacity style={styles.optionRow}>
                    <Star color={colors.textMuted} size={20} />
                    <Text style={styles.optionText}>Add Vibe Tags</Text>
                    <ChevronRightIcon />
                </TouchableOpacity>
            </ScrollView>

            <View style={{ padding: layout.padding.m }}>
                <TouchableOpacity style={styles.primaryBtn} onPress={handleNextStep}>
                    <Text style={styles.primaryBtnText}>Preview Post</Text>
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );

    const renderStep3_Preview = () => (
        <View style={globalStyles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => setStep(2)}><ChevronLeftIcon /></TouchableOpacity>
                <Text style={typography.h3}>Preview</Text>
                <View style={{ width: 24 }} />
            </View>

            <View style={styles.feedPreviewCard}>
                <Image source={{ uri: MOCK_PHOTO }} style={styles.previewImageLarge} />
                <View style={styles.previewOverlay}>
                    <Text style={typography.h2}>{caption || "Awesome new spot!"}</Text>
                    <Text style={typography.body}>Just now • 0.0 km</Text>
                </View>
            </View>

            <View style={{ padding: layout.padding.m, position: 'absolute', bottom: 100, left: 0, right: 0 }}>
                <TouchableOpacity style={styles.primaryBtn} onPress={handleNextStep}>
                    <Text style={styles.primaryBtnText}>Publish Discovery</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    const renderStep4_Success = () => (
        <View style={[globalStyles.container, globalStyles.center, { backgroundColor: colors.overlay }]}>
            <Animated.View style={{
                alignItems: 'center',
                opacity: xpOpacity,
                transform: [{ scale: xpScale }]
            }}>
                <View style={styles.xpBadge}>
                    <Text style={styles.xpText}>+50 XP</Text>
                </View>
                <Text style={styles.successTitle}>Discovery Published!</Text>
                <Text style={styles.successSub}>You're on your way to becoming a City Expert.</Text>
            </Animated.View>
        </View>
    );

    return (
        <View style={globalStyles.container}>
            {step === 1 && renderStep1_Camera()}
            {step === 2 && renderStep2_Details()}
            {step === 3 && renderStep3_Preview()}
            {step === 4 && renderStep4_Success()}
        </View>
    );
}

function createStyles({
    colors,
    typography,
    layout,
    globalStyles,
}: {
    colors: any;
    typography: any;
    layout: any;
    globalStyles: any;
}) {
    return StyleSheet.create({
    fullScreenContent: {
        flex: 1,
        backgroundColor: colors.background,
    },
    cameraPlaceholder: {
        flex: 1,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
        overflow: 'hidden',
    },
    cameraOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.3)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    cameraControls: {
        height: 150,
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        paddingBottom: 40,
    },
    shutterBtn: {
        width: 80,
        height: 80,
        borderRadius: 40,
        borderWidth: 4,
        borderColor: colors.text,
        justifyContent: 'center',
        alignItems: 'center',
    },
    shutterInner: {
        width: 66,
        height: 66,
        borderRadius: 33,
        backgroundColor: colors.text,
    },
    galleryBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: colors.surfaceHighlight,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.glassBorder,
    },
    switchBtn: {
        width: 44,
        height: 44,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 60,
        paddingHorizontal: layout.padding.m,
        paddingBottom: layout.padding.m,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    previewStrip: {
        flexDirection: 'row',
        marginBottom: layout.padding.xl,
        paddingVertical: layout.padding.m,
    },
    imageThumb: {
        width: 80,
        height: 100,
        borderRadius: layout.radius.s,
        marginRight: layout.padding.m,
    },
    captionInput: {
        flex: 1,
        ...typography.bodyLarge,
        color: colors.text,
        textAlignVertical: 'top',
    },
    optionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: layout.padding.m,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    optionText: {
        ...typography.bodyLarge,
        flex: 1,
        marginLeft: 12,
    },
    primaryBtn: {
        backgroundColor: colors.primary,
        height: 56,
        borderRadius: layout.radius.round,
        justifyContent: 'center',
        alignItems: 'center',
    },
    primaryBtnText: {
        ...typography.h3,
        color: colors.onPrimary,
        fontWeight: '800',
    },
    feedPreviewCard: {
        flex: 1,
        margin: layout.padding.m,
        marginBottom: 180,
        borderRadius: layout.radius.m,
        overflow: 'hidden',
    },
    previewImageLarge: {
        ...StyleSheet.absoluteFillObject,
    },
    previewOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: layout.padding.l,
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    xpBadge: {
        backgroundColor: colors.accent,
        paddingHorizontal: 30,
        paddingVertical: 15,
        borderRadius: layout.radius.round,
        marginBottom: 20,
        shadowColor: colors.accent,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 20,
    },
    xpText: {
        ...typography.h1,
        color: colors.onPrimary,
    },
    successTitle: {
        ...typography.h2,
        marginBottom: 8,
    },
    successSub: {
        ...typography.bodyLarge,
        color: colors.textMuted,
        textAlign: 'center',
    }
    });
}
