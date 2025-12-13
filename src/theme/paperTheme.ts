import { MD3LightTheme, configureFonts } from 'react-native-paper';
import { COLORS } from '../constants/theme';

const fontConfig = {
    displayLarge: {
        fontFamily: 'Inter_700Bold',
        fontSize: 57,
        fontWeight: '700' as const,
        letterSpacing: 0,
        lineHeight: 64,
    },
    displayMedium: {
        fontFamily: 'Inter_700Bold',
        fontSize: 45,
        fontWeight: '700' as const,
        letterSpacing: 0,
        lineHeight: 52,
    },
    displaySmall: {
        fontFamily: 'Inter_700Bold',
        fontSize: 36,
        fontWeight: '700' as const,
        letterSpacing: 0,
        lineHeight: 44,
    },
    headlineLarge: {
        fontFamily: 'Inter_700Bold',
        fontSize: 32,
        fontWeight: '700' as const,
        letterSpacing: 0,
        lineHeight: 40,
    },
    headlineMedium: {
        fontFamily: 'Inter_700Bold',
        fontSize: 28,
        fontWeight: '700' as const,
        letterSpacing: 0,
        lineHeight: 36,
    },
    headlineSmall: {
        fontFamily: 'Inter_700Bold',
        fontSize: 24,
        fontWeight: '700' as const,
        letterSpacing: 0,
        lineHeight: 32,
    },
    titleLarge: {
        fontFamily: 'Inter_500Medium',
        fontSize: 22,
        fontWeight: '500' as const,
        letterSpacing: 0,
        lineHeight: 28,
    },
    titleMedium: {
        fontFamily: 'Inter_500Medium',
        fontSize: 16,
        fontWeight: '500' as const,
        letterSpacing: 0.15,
        lineHeight: 24,
    },
    titleSmall: {
        fontFamily: 'Inter_500Medium',
        fontSize: 14,
        fontWeight: '500' as const,
        letterSpacing: 0.1,
        lineHeight: 20,
    },
    labelLarge: {
        fontFamily: 'Inter_500Medium',
        fontSize: 14,
        fontWeight: '500' as const,
        letterSpacing: 0.1,
        lineHeight: 20,
    },
    labelMedium: {
        fontFamily: 'Inter_500Medium',
        fontSize: 12,
        fontWeight: '500' as const,
        letterSpacing: 0.5,
        lineHeight: 16,
    },
    labelSmall: {
        fontFamily: 'Inter_500Medium',
        fontSize: 11,
        fontWeight: '500' as const,
        letterSpacing: 0.5,
        lineHeight: 16,
    },
    bodyLarge: {
        fontFamily: 'Inter_400Regular',
        fontSize: 16,
        fontWeight: '400' as const,
        letterSpacing: 0.15,
        lineHeight: 24,
    },
    bodyMedium: {
        fontFamily: 'Inter_400Regular',
        fontSize: 14,
        fontWeight: '400' as const,
        letterSpacing: 0.25,
        lineHeight: 20,
    },
    bodySmall: {
        fontFamily: 'Inter_400Regular',
        fontSize: 12,
        fontWeight: '400' as const,
        letterSpacing: 0.4,
        lineHeight: 16,
    },
};

export const theme = {
    ...MD3LightTheme,
    colors: {
        ...MD3LightTheme.colors,
        primary: COLORS.primary[700], // Deep Energy Blue for primary actions
        onPrimary: COLORS.white,
        primaryContainer: COLORS.primary[100],
        onPrimaryContainer: COLORS.primary[900],

        secondary: COLORS.secondary[600], // Natural Green
        onSecondary: COLORS.white,
        secondaryContainer: COLORS.secondary[100],
        onSecondaryContainer: COLORS.secondary[900],

        tertiary: COLORS.accent, // Amber Energy
        onTertiary: COLORS.black,
        tertiaryContainer: '#FEF3C7', // Amber 100-ish
        onTertiaryContainer: '#451A03', // Amber 900-ish

        background: COLORS.gray[50], // Professional Light BG
        onBackground: COLORS.gray[900],
        surface: COLORS.white,
        onSurface: COLORS.gray[800],
        surfaceVariant: COLORS.gray[100],
        onSurfaceVariant: COLORS.gray[600],

        outline: COLORS.gray[300],
        outlineVariant: COLORS.gray[200],

        error: COLORS.error,
        onError: COLORS.white,
        errorContainer: '#FEF2F2', // Red 50
        onErrorContainer: COLORS.danger,

        // Custom Elevation Colors
        elevation: {
            level0: 'transparent',
            level1: COLORS.white,
            level2: COLORS.white,
            level3: COLORS.white,
            level4: COLORS.white,
            level5: COLORS.white,
        },
    },
    fonts: configureFonts({ config: fontConfig }),
};
