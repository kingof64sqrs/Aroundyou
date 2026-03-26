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
  background: '#0B0B0F', // Deeper Obsidian
  surface: '#16161E', // Charcoal
  surfaceHighlight: '#1F1F2B',

  // Text
  text: '#FFFFFF',
  textMuted: '#94A3B8', // Slate 400
  textSubtle: '#475569', // Slate 600

  // Accents (Electric Emerald)
  primary: '#00FF87',
  secondary: '#00E0FF', // Vivid Cyan
  accent: '#00FF87',
  danger: '#FF3366',

  // Activity specific
  contribute: '#00FF87',
  gamify: '#A855F7', // Purple 500
  retain: '#EC4899', // Pink 500

  // Utility
  border: 'rgba(255, 255, 255, 0.08)',
  overlay: 'rgba(0, 0, 0, 0.8)',
  transparent: 'transparent',

  onPrimary: '#000000',
  onAccent: '#000000',

  glassSurface: 'rgba(22, 22, 30, 0.75)',
  glassBorder: 'rgba(255, 255, 255, 0.12)',
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
    h1: { fontSize: 36, lineHeight: 44, fontFamily: 'BebasNeue_400Regular', color: colors.text, letterSpacing: 1 },
    h2: { fontSize: 26, lineHeight: 32, fontFamily: 'BebasNeue_400Regular', color: colors.text, letterSpacing: 0.5 },
    h3: { fontSize: 18, lineHeight: 26, fontFamily: 'Outfit_600SemiBold', color: colors.text },
    bodyLarge: { fontSize: 16, lineHeight: 24, fontFamily: 'Outfit_500Medium', color: colors.text },
    body: { fontSize: 14, lineHeight: 22, fontFamily: 'Outfit_400Regular', color: colors.text },
    bodySmall: { fontSize: 13, lineHeight: 18, fontFamily: 'Outfit_400Regular', color: colors.textMuted },
    caption: { fontSize: 12, lineHeight: 16, fontFamily: 'Outfit_600SemiBold', color: colors.textMuted, textTransform: 'uppercase' as const, letterSpacing: 0.8 },
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
      boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.10)',
    },
    default: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 2,
    },
  }) as any,
  medium: Platform.select({
    web: {
      boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.15)',
    },
    default: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 12,
      elevation: 4,
    },
  }) as any,
  glow: (color: string) => (
    Platform.select({
      web: {
        boxShadow: `0px 0px 15px ${color}`,
      },
      default: {
        shadowColor: color,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 15,
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
      fontFamily: 'Inter_400Regular',
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
