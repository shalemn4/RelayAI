export const COLORS = {
  // Brand & Accent: Industrial Sleek Grey & Vibrant Orange (Omni-Style)
  primary: '#18181B', // Deep Charcoal / Zinc 900
  primaryHover: '#27272A',
  primaryForeground: '#FFFFFF',

  secondary: '#F4F5F7', // Soft Cool Light Grey
  secondaryHover: '#E5E7EB',
  secondaryForeground: '#18181B',

  accent: '#FF5520', // Radiant Electric Orange (from reference UI)
  accentHover: '#E04616',
  accentLight: '#FFF2ED', // Warm Cream Peach
  accentBorder: '#FFD7CA',
  accentForeground: '#FFFFFF',

  // Backgrounds & Surfaces (Luxury Bento Box)
  background: '#F3F4F6', // Soft Light Grey Canvas
  surface: '#FFFFFF',
  surfaceSubtle: '#F8F9FA',
  surfaceElevated: '#FFFFFF',
  surfaceDark: '#18181B', // Dark Bento Card Background
  surfaceDarkCard: '#24242B', // Inner floating card on dark bento
  surfaceDarkBorder: '#2E2E38',

  // Borders & Dividers
  border: '#E5E7EB', // Neutral Zinc 200
  borderStrong: '#D1D5DB', // Zinc 300
  borderFocus: '#FF5520', // Vibrant Orange focus ring

  // Typography
  text: '#111827', // Pitch Black / Zinc 950
  textMuted: '#6B7280', // Cool Grey 500
  textSubtle: '#9CA3AF', // Cool Grey 400
  textInverse: '#FFFFFF',
  textInverseMuted: '#A1A1AA',

  // Status & Semantic Colors
  success: '#10B981', // Emerald
  successBg: '#ECFDF5',
  successText: '#065F46',

  warning: '#F59E0B', // Amber
  warningBg: '#FFFBEB',
  warningText: '#92400E',

  danger: '#EF4444', // Red
  dangerBg: '#FEF2F2',
  dangerText: '#991B1B',

  info: '#64748B', // Slate
  infoBg: '#F1F5F9',
  infoText: '#334155',

  // AI Theme (Radiant Orange & Soft Peach Harmony)
  ai: '#FF5520', // Electric Orange
  aiHover: '#E04616',
  aiBg: '#FFF4F0', // Soft Orange Wash
  aiBorder: '#FED7AA', // Subtle Orange Border
  aiText: '#C2410C', // Orange 800

  // Channel Brand Colors
  channelSms: '#10B981',
  channelWhatsapp: '#22C55E',
  channelEmail: '#FF5520', // Radiant Orange
  channelWebchat: '#6B7280', // Zinc Grey
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const RADIUS = {
  sm: 6,
  md: 10,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  full: 9999, // Pill shape
};

export const TYPOGRAPHY = {
  size: {
    xs: 11,
    sm: 12,
    base: 14,
    md: 15,
    lg: 16,
    xl: 18,
    xxl: 20,
    title: 24,
    header: 28,
    metric: 34,
  },
  weight: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
    black: '800' as const,
  },
};

export const SHADOWS = {
  sm: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },
  md: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 18,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.08,
    shadowRadius: 30,
    elevation: 6,
  },
};
