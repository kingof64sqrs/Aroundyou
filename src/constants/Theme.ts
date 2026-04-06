import { Platform, StyleSheet } from 'react-native';

export type ThemeMode = 'light' | 'dark';

export type ThemeColors = {
  background: string;
  surface: string;
  surfaceHighlight: string;

  // Text
  text: string;
  textMuted: string;
  textSubtle: string;

  // Accents & Gamification phases
  primary: string;
  secondary: string;
  accent: string;
  danger: string;

  // Activity specific
  contribute: string;
  gamify: string;
  retain: string;

  // Utility
  border: string;
  overlay: string;
  transparent: string;

  // Contrast helpers
  onPrimary: string;
  onAccent: string;

  // Glass UI
  glassSurface: string;
  glassBorder: string;
};

export const DarkColors: ThemeColors = {
  background: '#0d0e13', // Midnight
  surface: '#121319', // surface-container-low
  surfaceHighlight: '#1e1f26', // surface-container-high

  // Text
  text: '#f7f5fd', // on-surface
  textMuted: '#abaab1', // on-surface-variant
  textSubtle: '#54545b', // inverse-on-surface

  // Accents
  primary: '#99f7ff',
  secondary: '#fd8b00',
  accent: '#99f7ff',
  danger: '#ff716c', // error

  // Activity specific
  contribute: '#99f7ff',
  gamify: '#6bfe9c', // tertiary-container
  retain: '#fd8b00',

  // Utility
  border: 'rgba(247, 245, 253, 0.10)', // 10% on-surface
  overlay: 'rgba(0, 0, 0, 0.8)',
  transparent: 'transparent',

  onPrimary: '#000000',
  onAccent: '#000000',

  glassSurface: 'rgba(30, 31, 38, 0.70)',
  glassBorder: 'rgba(247, 245, 253, 0.10)',
};

export const LightColors: ThemeColors = {
  background: '#F8FAFC', // Slate 50
  surface: '#FFFFFF',
  surfaceHighlight: '#F1F5F9', // Slate 100

  // Text
  text: '#0F172A', // Slate 900
  textMuted: '#64748B', // Slate 500
  textSubtle: '#94A3B8', // Slate 400

  // Accents (Sophisticated Green for Light Mode)
  primary: '#059669', // Emerald 600 - Better contrast on white
  secondary: '#0EA5E9', // Sky 500
  accent: '#10B981', // Emerald 500
  danger: '#E11D48', // Rose 600

  // Activity specific
  contribute: '#10B981',
  gamify: '#8B5CF6',
  retain: '#EC4899',

  // Utility
  border: 'rgba(0, 0, 0, 0.06)',
  overlay: 'rgba(0, 0, 0, 0.4)',
  transparent: 'transparent',

  onPrimary: '#FFFFFF',
  onAccent: '#FFFFFF',

  glassSurface: 'rgba(255, 255, 255, 0.85)',
  glassBorder: 'rgba(0, 0, 0, 0.05)',
};

export const Colors = DarkColors;

export type TypographyScale = {
  h1: any;
  h2: any;
  h3: any;
  bodyLarge: any;
  body: any;
  bodySmall: any;
  caption: any;
};

export function createTypography(colors: ThemeColors): TypographyScale {
  return {
    h1: { fontSize: 56, lineHeight: 64, fontFamily: 'SpaceGrotesk_700Bold', color: colors.text, letterSpacing: -1 }, // display-lg
    h2: { fontSize: 28, lineHeight: 36, fontFamily: 'SpaceGrotesk_600SemiBold', color: colors.text, letterSpacing: 0 }, // headline-md
    h3: { fontSize: 22, lineHeight: 30, fontFamily: 'PlusJakartaSans_600SemiBold', color: colors.text }, // title-lg
    bodyLarge: { fontSize: 16, lineHeight: 24, fontFamily: 'PlusJakartaSans_500Medium', color: colors.text }, // body-lg
    body: { fontSize: 14, lineHeight: 22, fontFamily: 'PlusJakartaSans_400Regular', color: colors.text }, // body-md
    bodySmall: { fontSize: 12, lineHeight: 16, fontFamily: 'PlusJakartaSans_400Regular', color: colors.textMuted }, // label-md
    caption: { fontSize: 12, lineHeight: 16, fontFamily: 'PlusJakartaSans_600SemiBold', color: colors.textMuted, textTransform: 'uppercase' as const, letterSpacing: 0.8 }, // label-md bold
  };
}

export const Typography = createTypography(DarkColors);

export const Layout = {
  padding: {
    xs: 4,
    s: 8,
    m: 16,
    l: 24,
    xl: 32,
    xxl: 48,
  },
  radius: {
    xs: 4,
    s: 8,
    m: 12,
    l: 20,
    xl: 32,
    round: 9999,
  },
};

export const Shadows = {
  soft: Platform.select({
    web: {
      boxShadow: '0px 4px 20px rgba(247, 245, 253, 0.04)',
    },
    default: {
      shadowColor: '#f7f5fd',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.04,
      shadowRadius: 20,
      elevation: 2,
    },
  }) as any,
  medium: Platform.select({
    web: {
      boxShadow: '0px 8px 40px rgba(247, 245, 253, 0.08)',
    },
    default: {
      shadowColor: '#f7f5fd',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.08,
      shadowRadius: 40,
      elevation: 4,
    },
  }) as any,
  glow: (color: string) => (
    Platform.select({
      web: {
        boxShadow: `0px 0px 25px ${color}80`,
      },
      default: {
        shadowColor: color,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 25,
        elevation: 8,
      },
    }) as any
  ),
};

export function createGlobalStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    center: {
      justifyContent: 'center',
      alignItems: 'center',
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    rowBetween: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    glassCard: {
      backgroundColor: colors.glassSurface,
      borderRadius: Layout.radius.m,
      borderWidth: 1,
      borderColor: colors.glassBorder,
      overflow: 'hidden',
    },
    card: {
      backgroundColor: colors.surface,
      borderRadius: Layout.radius.m,
      padding: Layout.padding.m,
      borderWidth: 1,
      borderColor: colors.border,
      ...Shadows.soft,
    },
    input: {
      backgroundColor: colors.surfaceHighlight,
      borderRadius: Layout.radius.m,
      paddingHorizontal: Layout.padding.m,
      paddingVertical: Layout.padding.s,
      borderWidth: 1,
      borderColor: colors.border,
      color: colors.text,
      fontFamily: 'PlusJakartaSans_400Regular',
    },
  });
}

export const GlobalStyles = createGlobalStyles(DarkColors);

export type AppTheme = {
  mode: ThemeMode;
  colors: ThemeColors;
  typography: TypographyScale;
  layout: typeof Layout;
  globalStyles: ReturnType<typeof createGlobalStyles>;
};

export function createTheme(mode: ThemeMode): AppTheme {
  const colors = mode === 'dark' ? DarkColors : LightColors;
  return {
    mode,
    colors,
    typography: createTypography(colors),
    layout: Layout,
    globalStyles: createGlobalStyles(colors),
  };
}

export const PRESET_AVATARS = [
  'https://api.dicebear.com/9.x/avataaars/png?seed=Alex&backgroundColor=transparent',
  'https://api.dicebear.com/9.x/avataaars/png?seed=Sarah&backgroundColor=transparent',
  'https://api.dicebear.com/9.x/avataaars/png?seed=Oliver&backgroundColor=transparent',
  'https://api.dicebear.com/9.x/avataaars/png?seed=Emma&backgroundColor=transparent',
  'https://api.dicebear.com/9.x/avataaars/png?seed=David&backgroundColor=transparent',
  'https://api.dicebear.com/9.x/avataaars/png?seed=Sophia&backgroundColor=transparent',
  'https://api.dicebear.com/9.x/avataaars/png?seed=Lucas&backgroundColor=transparent',
  'https://api.dicebear.com/9.x/avataaars/png?seed=Isabella&backgroundColor=transparent',
];

export const AVATAR_BG_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F'
];
