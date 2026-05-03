import { Platform } from 'react-native';

/* ─── Warm Cream Design System ─────────────────────────────────── */
/*
 * Vibe: cozy lifestyle journal · warm & inviting · modern craft
 * Base: warm cream / ivory
 * Accent: electric blue — modern edge against warmth
 * Typography: large, generous, rounded
 * Cards: warm shadows, organic radius, no cold borders
 */

export const palette = {
  /* Backgrounds — warm ivory / cream spectrum */
  bg: '#FAF9F6',              // warm cream page base
  bgCard: '#FFFFFF',          // card / surface
  bgElevated: '#FFFEFA',      // modals, sheets
  bgWash: '#F5F0EB',          // subtle warm wash for sections
  bgInset: '#F0ECE6',         // inset / recessed areas

  /* Text — warm dark, never pure black */
  textPrimary: '#1C1917',     // warm charcoal (stone-900)
  textSecondary: '#78716C',   // warm gray (stone-500)
  textTertiary: '#A8A29E',    // muted warm (stone-400)
  textOnAccent: '#FFFFFF',

  /* Accent — electric blue, one and only */
  accent: '#0A84FF',
  accentSoft: 'rgba(10, 132, 255, 0.10)',
  accentMuted: 'rgba(10, 132, 255, 0.50)',

  /* Warm functional */
  success: '#34C759',
  warning: '#FF9F0A',
  error: '#FF453A',
  heart: '#FF6B6B',           // warm red for collect/favorite

  /* Separators — warm, not cold gray */
  separator: 'rgba(120, 113, 108, 0.12)',
  separatorStrong: 'rgba(120, 113, 108, 0.24)',

  /* Overlay */
  overlay: 'rgba(28, 25, 23, 0.40)',
  white: '#FFFFFF',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 20,
  xl: 28,
  xxl: 40,
  xxxl: 56,
} as const;

export const radius = {
  sm: 10,
  md: 14,
  lg: 20,
  xl: 24,
  xxl: 28,
  pill: 999,
} as const;

export const typography = {
  caption: 11,
  footnote: 13,
  subhead: 15,
  body: 17,
  title3: 20,
  title2: 22,
  title1: 28,
  largeTitle: 34,
  hero: 42,
} as const;

export const fontWeight = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  heavy: '800' as const,
};

/* Warm shadow — golden undertone, soft spread */
export const cardShadow = Platform.select({
  ios: {
    shadowColor: 'rgba(120, 100, 70, 0.45)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
  },
  android: {
    elevation: 4,
  },
  default: {
    shadowColor: 'rgba(120, 100, 70, 0.45)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
  },
}) as Record<string, unknown>;

/* Subtle lift for floating elements */
export const floatShadow = Platform.select({
  ios: {
    shadowColor: 'rgba(120, 100, 70, 0.50)',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
  },
  android: {
    elevation: 8,
  },
  default: {
    shadowColor: 'rgba(120, 100, 70, 0.50)',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
  },
}) as Record<string, unknown>;

export const theme = {
  palette,
  spacing,
  radius,
  typography,
  fontWeight,
  cardShadow,
  floatShadow,
} as const;
