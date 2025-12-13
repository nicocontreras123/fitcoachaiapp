import { create } from 'zustand';
import { useColorScheme as _useColorScheme } from 'react-native';
import { DARK_COLORS, LIGHT_COLORS } from '../constants/colors';
import { MD3DarkTheme, MD3LightTheme } from 'react-native-paper';
import { useEffect, useState } from 'react';

type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeState {
    mode: ThemeMode;
    setMode: (mode: ThemeMode) => void;
}

export const useThemeStore = create<ThemeState>((set) => ({
    mode: 'system',
    setMode: (mode) => set({ mode }),
}));

import { theme as staticTheme } from '../theme/paperTheme';

export function useTheme() {
    const systemScheme = _useColorScheme();
    const { mode, setMode } = useThemeStore();
    const [isDark, setIsDark] = useState(systemScheme === 'dark');

    useEffect(() => {
        if (mode === 'system') {
            setIsDark(systemScheme === 'dark');
        } else {
            setIsDark(mode === 'dark');
        }
    }, [mode, systemScheme]);

    const colors = isDark ? DARK_COLORS : LIGHT_COLORS;

    // Paper Theme Adaptation
    // Paper Theme Adaptation
    const paperTheme = isDark ? {
        ...MD3DarkTheme,
        roundness: 3,
        colors: {
            ...MD3DarkTheme.colors,
            primary: colors.primary,
            onPrimary: colors.white,
            primaryContainer: colors.primaryContainer,
            onPrimaryContainer: colors.white,

            background: colors.background,
            onBackground: colors.textPrimary,

            surface: colors.surface,
            onSurface: colors.textPrimary,
            surfaceVariant: colors.surfaceVariant,
            onSurfaceVariant: colors.textSecondary,

            error: colors.danger,
            onError: colors.white,

            outline: colors.textDisabled,
            outlineVariant: colors.surfaceVariant,
        },
        fonts: staticTheme.fonts,
    } : {
        ...MD3LightTheme,
        roundness: 3,
        colors: {
            ...MD3LightTheme.colors,
            primary: colors.primary,
            onPrimary: colors.white,
            primaryContainer: colors.primaryContainer,
            onPrimaryContainer: colors.white, // Or a contrasting dark blue

            background: colors.background,
            onBackground: colors.textPrimary,

            surface: colors.surface,
            onSurface: colors.textPrimary,
            surfaceVariant: colors.surfaceVariant,
            onSurfaceVariant: colors.textSecondary,

            error: colors.danger,
            onError: colors.white,

            outline: colors.textDisabled,
            outlineVariant: colors.surfaceVariant,
        },
        fonts: staticTheme.fonts,
    };

    const toggleTheme = () => {
        setMode(isDark ? 'light' : 'dark');
    };

    return {
        colors,
        isDark,
        mode,
        setMode,
        toggleTheme,
        paperTheme,
    };
}
