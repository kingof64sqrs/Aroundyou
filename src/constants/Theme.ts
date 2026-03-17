import { StyleSheet } from 'react-native';

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

  // Glass UI
  glassSurface: string;
  glassBorder: string;
};

export const DarkColors: ThemeColors = {
  background: '#030303',
  surface: '#121212',
  surfaceHighlight: '#1f1f1f',

  // Text
  text: '#FFFFFF',
  textMuted: '#9CA3AF',
  textSubtle: '#4B5563',

  // Accents & Gamification phases
  primary: '#00FF87', // Pulse Emerald Green
  secondary: '#00C2FF', // Cyan
  accent: '#00FF87', // Pulse Emerald Green
  danger: '#FF3366', // Vibrant Red

  // Activity specific
  contribute: '#00FF87',
  gamify: '#8B5CF6',
  retain: '#EC4899',

  // Utility
  border: '#27272A',
  overlay: 'rgba(0, 0, 0, 0.7)',
  transparent: 'transparent',

  onPrimary: '#000000',

  glassSurface: 'rgba(18, 18, 18, 0.7)',
  glassBorder: 'rgba(255, 255, 255, 0.10)',
};

export const LightColors: ThemeColors = {
  background: '#FFFFFF',
  surface: '#F5F6F8',
  surfaceHighlight: '#FFFFFF',

  // Text
  text: '#0B0B0F',
  textMuted: '#4B5563',
  textSubtle: '#6B7280',

  // Accents & Gamification phases
  primary: '#00FF87',
  secondary: '#00C2FF',
  accent: '#00FF87',
  danger: '#FF3366',

  // Activity specific
  contribute: '#00FF87',
  gamify: '#8B5CF6',
  retain: '#EC4899',

  // Utility
  border: '#E5E7EB',
  overlay: 'rgba(0, 0, 0, 0.35)',
  transparent: 'transparent',

  onPrimary: '#000000',

  glassSurface: 'rgba(255, 255, 255, 0.75)',
  glassBorder: 'rgba(0, 0, 0, 0.06)',
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
    h1: { fontSize: 34, lineHeight: 40, fontFamily: 'SpaceGrotesk_700Bold', color: colors.text },
    h2: { fontSize: 24, lineHeight: 32, fontFamily: 'SpaceGrotesk_600SemiBold', color: colors.text },
    h3: { fontSize: 18, lineHeight: 26, fontFamily: 'SpaceGrotesk_500Medium', color: colors.text },
    bodyLarge: { fontSize: 17, lineHeight: 26, fontFamily: 'Inter_400Regular', color: colors.text },
    body: { fontSize: 15, lineHeight: 24, fontFamily: 'Inter_400Regular', color: colors.text },
    bodySmall: { fontSize: 13, lineHeight: 18, fontFamily: 'Inter_400Regular', color: colors.textMuted },
    caption: { fontSize: 12, lineHeight: 16, fontFamily: 'Inter_500Medium', color: colors.textMuted, textTransform: 'uppercase' as const, letterSpacing: 0.6 },
  };
}

export const Typography = createTypography(DarkColors);

export const Layout = {
  padding: {
    s: 8,
    m: 16,
    l: 24,
    xl: 32,
  },
  radius: {
    s: 8,
    m: 16,
    l: 24,
    round: 9999,
  },
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
    shadow: {
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 10,
      elevation: 5,
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
