import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Animated } from 'react-native';
import { useTheme } from '../../constants/ThemeContext';
import { ArrowRight, Smartphone } from 'lucide-react-native';

export default function SignUpScreen({ navigation }: any) {
    const { colors, typography, layout, globalStyles, mode } = useTheme();
    const [phoneNumber, setPhoneNumber] = useState('');
    const [otpSent, setOtpSent] = useState(false);
    const [otp, setOtp] = useState(['', '', '', '']);

    const otpRefs = useRef<Array<TextInput | null>>([null, null, null, null]);

    const handleContinue = () => {
        if (!otpSent) {
            if (phoneNumber.length === 10) setOtpSent(true);
        } else {
            const code = otp.join('');
            if (code.length === 4) {
                navigation.replace('Interests');
            }
        }
    };

    const handleOtpChange = (text: string, index: number) => {
        let newOtp = [...otp];
        newOtp[index] = text;
        setOtp(newOtp);

        if (text.length === 1 && index < 3) {
            otpRefs.current[index + 1]?.focus();
        }
    };

    const styles = React.useMemo(() => createStyles({ colors, typography, layout, globalStyles, mode }), [colors, typography, layout, globalStyles, mode]);

    return (
        <View style={globalStyles.container}>
            <KeyboardAvoidingView
                style={styles.container}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                <View style={styles.content}>
                    <View style={styles.header}>
                        <View style={styles.logoBadge}>
                            <Text style={styles.logoText}>A'Y</Text>
                        </View>
                        <Text style={typography.h1}>
                            <Text style={{ color: colors.text }}>Enter </Text>
                            <Text style={{ color: colors.accent }}>AroundYou</Text>
                        </Text>
                        <Text style={[typography.bodyLarge, { marginTop: layout.padding.s, color: colors.textMuted }]}>
                            {otpSent ? 'Enter the secret 4-digit code sent to your phone' : 'Drop your number to discover the city\'s pulse'}
                        </Text>
                    </View>

                    <View style={styles.formContainer}>
                        {!otpSent ? (
                            <View style={styles.inputSection}>
                                <Text style={styles.label}>Phone Number</Text>
                                <View style={styles.inputWrapper}>
                                    <View style={styles.prefixBox}>
                                        <Smartphone color={colors.accent} size={20} />
                                        <Text style={styles.prefix}>+91</Text>
                                    </View>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="00000 00000"
                                        placeholderTextColor={colors.textSubtle}
                                        keyboardType="phone-pad"
                                        value={phoneNumber}
                                        onChangeText={setPhoneNumber}
                                        maxLength={10}
                                        selectionColor={colors.accent}
                                    />
                                </View>
                            </View>
                        ) : (
                            <View style={styles.inputSection}>
                                <Text style={styles.label}>Verification Code</Text>
                                <View style={globalStyles.rowBetween}>
                                    {otp.map((digit, index) => (
                                        <TextInput
                                            key={index}
                                            ref={(el) => { otpRefs.current[index] = el; }}
                                            style={[styles.otpInput, digit ? styles.otpInputActive : null]}
                                            keyboardType="numeric"
                                            maxLength={1}
                                            value={digit}
                                            onChangeText={(text) => handleOtpChange(text, index)}
                                            selectionColor={colors.accent}
                                        />
                                    ))}
                                </View>
                            </View>
                        )}

                        <TouchableOpacity
                            style={[styles.button, (!phoneNumber && !otpSent) ? styles.buttonDisabled : null]}
                            onPress={handleContinue}
                            disabled={(!otpSent && phoneNumber.length < 10) || (otpSent && otp.join('').length < 4)}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.buttonText}>{otpSent ? 'Verify & Enter' : 'Send Code'}</Text>
                            <ArrowRight color={colors.onPrimary} size={20} style={{ marginLeft: 8 }} />
                        </TouchableOpacity>

                        {!otpSent && (
                            <Text style={styles.termsText}>
                                By continuing, you agree to our Terms & Privacy Policy
                            </Text>
                        )}
                    </View>
                </View>
            </KeyboardAvoidingView>
        </View>
    );
}

function createStyles({
    colors,
    typography,
    layout,
    globalStyles,
    mode,
}: {
    colors: any;
    typography: any;
    layout: any;
    globalStyles: any;
    mode: any;
}) {
    const darkInput = 'rgba(0, 0, 0, 0.5)';
    const lightInput = 'rgba(255, 255, 255, 0.65)';
    const inputBg = mode === 'dark' ? darkInput : lightInput;
    const prefixBg = mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)';
    const otpActiveBg = 'rgba(0, 255, 135, 0.12)';

    return StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        flex: 1,
        justifyContent: 'flex-end',
        paddingBottom: 40,
    },
    header: {
        padding: layout.padding.xl,
        paddingBottom: layout.padding.l,
    },
    logoBadge: {
        width: 48,
        height: 48,
        borderRadius: layout.radius.s,
        backgroundColor: colors.accent,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: layout.padding.l,
        shadowColor: colors.accent,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.5,
        shadowRadius: 10,
        elevation: 8,
    },
    logoText: {
        ...typography.h2,
        color: colors.onPrimary,
        fontWeight: '900',
    },
    formContainer: {
        marginHorizontal: layout.padding.m,
        padding: layout.padding.xl,
        borderRadius: layout.radius.l,
        borderWidth: 1,
        borderColor: colors.glassBorder,
        backgroundColor: colors.glassSurface,
        overflow: 'hidden',
    },
    inputSection: {
        marginBottom: layout.padding.xl,
    },
    label: {
        ...typography.caption,
        color: colors.textMuted,
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 12,
    },
    inputWrapper: {
        ...globalStyles.row,
        backgroundColor: inputBg,
        borderRadius: layout.radius.m,
        borderWidth: 1,
        borderColor: colors.border,
        height: 64,
        overflow: 'hidden',
    },
    prefixBox: {
        ...globalStyles.row,
        paddingHorizontal: layout.padding.m,
        backgroundColor: prefixBg,
        height: '100%',
        borderRightWidth: 1,
        borderRightColor: colors.border,
    },
    prefix: {
        ...typography.h3,
        color: colors.text,
        marginLeft: 8,
    },
    input: {
        flex: 1,
        ...typography.h2,
        color: colors.text,
        paddingHorizontal: layout.padding.m,
        height: '100%',
    },
    otpInput: {
        width: 65,
        height: 75,
        backgroundColor: inputBg,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: layout.radius.m,
        ...typography.h1,
        color: colors.text,
        textAlign: 'center',
    },
    otpInputActive: {
        borderColor: colors.accent,
        backgroundColor: otpActiveBg,
    },
    button: {
        ...globalStyles.row,
        backgroundColor: colors.accent,
        height: 60,
        borderRadius: layout.radius.round,
        justifyContent: 'center',
        shadowColor: colors.accent,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 10,
        elevation: 6,
    },
    buttonDisabled: {
        backgroundColor: colors.surfaceHighlight,
        shadowOpacity: 0,
        elevation: 0,
        opacity: 0.7,
    },
    buttonText: {
        ...typography.h3,
        color: colors.onPrimary,
        fontWeight: '800',
    },
    termsText: {
        ...typography.caption,
        textAlign: 'center',
        marginTop: layout.padding.l,
        color: colors.textSubtle,
    }
    });
}
