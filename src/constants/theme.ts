// Palette: FitCoach AI (Neon Green Energy)
export const COLORS = {
  // Brand Core - Neon Green Theme
  primary: {
    DEFAULT: '#13ec5b', // Neon Green - Main brand color
    50: '#f0fdf4',
    100: '#dcfce7',
    200: '#bbf7d0',
    300: '#86efac',
    400: '#4ade80',
    500: '#13ec5b', // Neon Green
    600: '#10c94d',
    700: '#0da640',
    800: '#0a8333',
    900: '#076026',
  },

  // Background colors
  background: {
    light: '#f6f8f6',
    dark: '#102216',
    darker: '#0a1510',
  },

  // Surface colors for inputs and cards
  surface: {
    dark: '#192e21',
    input: '#0c1b11',
  },
  secondary: {
    50: '#f0fdf4',
    100: '#dcfce7',
    200: '#bbf7d0',
    300: '#86efac',
    400: '#4ade80',
    500: '#22c55e', // Success/Progress Green
    600: '#16a34a',
    700: '#15803d',
    800: '#166534',
    900: '#14532d',
  },

  // Functional Semantics
  accent: '#F59E0B', // Amber 500 - Attention/Energy
  energy: '#EAB308', // Yellow 500 - High Voltage/Timers
  success: '#10B981', // Emerald 500
  warning: '#F97316', // Orange 500
  error: '#EF4444', // Red 500
  danger: '#DC2626', // Red 600

  // Neutrals (Surface & Text)
  gray: {
    50: '#f8fafc', // Ultra light background
    100: '#f1f5f9', // Card background hover
    200: '#e2e8f0', // Borders/Lines
    300: '#cbd5e1', // Disabled states
    400: '#94a3b8', // Icons/Hints
    500: '#64748b', // Secondary Text
    600: '#475569',
    700: '#334155', // Primary Text (Softer than black)
    800: '#1e293b',
    900: '#0f172a', // Heavy contrast
  },
  white: '#ffffff',
  black: '#000000',

  // Sport Specific Modes
  boxing: {
    primary: '#DC2626', // Aggressive Red
    secondary: '#1F2937', // Dark Slate
    accent: '#FBBF24', // Gold (Belt/Win)
    surface: '#FEF2F2', // Light Red Tint
  },
  running: {
    primary: '#0EA5E9', // Sky Blue (Outdoors)
    secondary: '#64748B', // Pavement Gray
    accent: '#84CC16', // Lime (Visibility)
    surface: '#F0F9FF', // Light breathable blue
  },
  gym: {
    primary: '#4F46E5', // Indigo (Focus/Structure)
    secondary: '#374151', // Iron Gray
    accent: '#22D3EE', // Electric Cyan
    surface: '#EEF2FF',
  },

  // Legacy mappings for compatibility (mapped to new palette)
  red: {
    50: '#fef2f2',
    100: '#fee2e2',
    200: '#fecaca',
    400: '#f87171',
    500: '#ef4444',
    700: '#b91c1c',
  },
  green: {
    50: '#f0fdf4',
    100: '#dcfce7',
    200: '#bbf7d0',
    400: '#4ade80',
    500: '#22c55e',
    700: '#15803d',
  },
  orange: {
    50: '#fff7ed',
    100: '#ffedd5',
    200: '#fed7aa',
    400: '#fb923c',
    500: '#f97316',
    600: '#ea580c',
    700: '#c2410c',
  },
  blue: {
    50: '#eff6ff',
    100: '#dbeafe',
    200: '#bfdbfe',
    400: '#60a5fa',
    500: '#3b82f6',
    600: '#2563eb',
    700: '#1d4ed8',
  },
  yellow: {
    50: '#fefce8',
    200: '#fef08a',
    700: '#a16207',
    800: '#854d0e',
  },
  purple: {
    50: '#faf5ff',
    100: '#f3e8ff',
    200: '#e9d5ff',
    700: '#7e22ce',
  },
  indigo: {
    50: '#eef2ff',
    100: '#e0e7ff',
    200: '#c7d2fe',
    400: '#818cf8',
    500: '#6366f1',
    700: '#4338ca',
  },
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  '2xl': 32,
  '3xl': 48,
};

export const BORDER_RADIUS = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  '2xl': 24,
  full: 9999,
};

export const FONT_SIZE = {
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 30,
  '4xl': 36,
};

export const FONT_WEIGHT = {
  normal: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
};
