import { StyleSheet } from 'react-native';

// Pulse Fit Dark Palette (Modeled for OLED Displays & Night Use)
export const DARK_COLORS = {
    // Brand Core
    primary: '#3B82F6', // Brighter Blue for Dark Mode contrast against black
    primaryContainer: '#1E3A8A',
    secondary: '#22C55E', // Vibrant Green for progress
    secondaryContainer: '#14532D',

    // Semantics
    accent: '#F59E0B', // Amber for immediate attention (timers)
    danger: '#EF4444', // Red for stop/error
    success: '#10B981', // Emerald
    warning: '#F97316',
    info: '#3B82F6',

    // Backgrounds (OLED Optimized)
    background: '#000000', // True Black for OLED battery saving
    surface: '#111827', // Dark Gray (Gray 900)
    surfaceVariant: '#1F2937', // Slightly lighter (Gray 800) for cards

    // Text
    textPrimary: '#F9FAFB', // Gray 50 (High legibility)
    textSecondary: '#9CA3AF', // Gray 400
    textDisabled: '#4B5563', // Gray 600

    // Sport Specific (Neon/Vibrant versions for Dark Mode)
    boxing: '#EF4444', // Neon Red
    running: '#22C55E', // Neon Green
    gym: '#3B82F6', // Neon Blue

    white: '#FFFFFF',
    black: '#000000',
    transparent: 'transparent',

    // Extra specific for Pulse Fit
    orange: '#F97316',
};

// Pulse Fit Light Palette (Existing - refined for consistency)
export const LIGHT_COLORS = {
    primary: '#1D4ED8', // Deeper Blue on Light
    primaryContainer: '#DBEAFE',
    secondary: '#16A34A',
    secondaryContainer: '#DCFCE7',

    accent: '#D97706',
    danger: '#DC2626',
    success: '#059669',
    warning: '#EA580C',
    info: '#2563EB',

    background: '#F8FAFC', // Gray 50
    surface: '#FFFFFF',
    surfaceVariant: '#F1F5F9', // Gray 100

    textPrimary: '#111827', // Gray 900
    textSecondary: '#64748B', // Gray 500
    textDisabled: '#94A3B8',

    boxing: '#DC2626',
    running: '#059669',
    gym: '#2563EB',

    white: '#FFFFFF',
    black: '#000000',
    transparent: 'transparent',

    orange: '#F97316',
};

// Exportable StyleSheet object for direct usage if needed (though hook is preferred)
export const STYLES = StyleSheet.create({
    primary: { backgroundColor: DARK_COLORS.primary },
    surface: { backgroundColor: DARK_COLORS.surface },
    background: { backgroundColor: DARK_COLORS.background },
});
