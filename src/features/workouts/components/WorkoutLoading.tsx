import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { Text, Surface, ActivityIndicator } from 'react-native-paper';
import { useTheme } from '@/hooks/useTheme';

interface WorkoutLoadingProps {
    sport: 'boxing' | 'running' | 'gym' | 'general' | 'mixed';
}

const MESSAGES = {
    boxing: ['Analizando técnica...', 'Diseñando combinaciones...', 'Configurando rounds...', 'Preparando al coach...'],
    running: ['Calculando ritmos...', 'Diseñando intervalos...', 'Mapeando ruta...', 'Ajustando recuperación...'],
    gym: ['Seleccionando ejercicios...', 'Calculando cargas...', 'Optimizando series...', 'Estructurando rutina...'],
    general: ['Analizando perfil...', 'Diseñando plan...', 'Personalizando experiencia...', 'Finalizando...'],
    mixed: ['Balanceando disciplinas...', 'Integrando boxeo y running...', 'Diseñando rutina híbrida...', 'Optimizando energía...'],
};

const ICONS = {
    boxing: '🥊',
    running: '🏃',
    gym: '💪',
    general: '⚡',
    mixed: '🥊🏃',
};

export function WorkoutLoading({ sport }: WorkoutLoadingProps) {
    const { colors } = useTheme();
    const [messageIndex, setMessageIndex] = React.useState(0);

    // Animation values
    const scale = useRef(new Animated.Value(1)).current;
    const opacity = useRef(new Animated.Value(0.5)).current;

    useEffect(() => {
        // Pulse animation
        Animated.loop(
            Animated.sequence([
                Animated.timing(scale, {
                    toValue: 1.2,
                    duration: 1000,
                    useNativeDriver: true,
                }),
                Animated.timing(scale, {
                    toValue: 1,
                    duration: 1000,
                    useNativeDriver: true,
                }),
            ])
        ).start();

        // Glow opacity animation
        Animated.loop(
            Animated.sequence([
                Animated.timing(opacity, {
                    toValue: 1,
                    duration: 1000,
                    useNativeDriver: true,
                }),
                Animated.timing(opacity, {
                    toValue: 0.5,
                    duration: 1000,
                    useNativeDriver: true,
                }),
            ])
        ).start();

        // Message rotation
        const interval = setInterval(() => {
            setMessageIndex((prev) => (prev + 1) % MESSAGES[sport].length);
        }, 2000);

        return () => clearInterval(interval);
    }, [sport, scale, opacity]);

    const animatedIconStyle = {
        transform: [{ scale }],
    };

    const animatedGlowStyle = {
        opacity,
        transform: [{ scale: scale.interpolate({
            inputRange: [1, 1.2],
            outputRange: [1.5, 1.8],
        }) }],
    };

    const activeColor = sport === 'boxing' ? colors.boxing :
        sport === 'running' ? colors.running :
            sport === 'gym' ? colors.gym :
                sport === 'mixed' ? '#9333ea' : colors.primary;

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <Surface style={[styles.card, { backgroundColor: colors.surface, borderRadius: 24 }]} elevation={2}>

                {/* Animated Icon Container */}
                <View style={styles.iconContainer}>
                    {/* Background circle for contrast in dark mode */}
                    <View style={[
                        styles.iconBackground,
                        { backgroundColor: activeColor + '20', borderColor: activeColor + '40' }
                    ]} />
                    <Animated.View style={[
                        styles.glow,
                        { backgroundColor: activeColor },
                        animatedGlowStyle
                    ]} />
                    <Animated.Text style={[styles.icon, animatedIconStyle]}>
                        {ICONS[sport] || ICONS.general}
                    </Animated.Text>
                </View>

                <Text variant="headlineSmall" style={{ fontWeight: 'bold', color: colors.textPrimary, marginBottom: 8, textAlign: 'center' }}>
                    Generando Rutina
                </Text>

                <Text variant="bodyLarge" style={{ color: activeColor, marginBottom: 24, fontWeight: '600', minHeight: 24, textAlign: 'center' }}>
                    {MESSAGES[sport][messageIndex]}
                </Text>

                <ActivityIndicator size="large" color={activeColor} />
            </Surface>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    card: {
        padding: 40,
        alignItems: 'center',
        width: '100%',
        maxWidth: 340,
    },
    iconContainer: {
        width: 100,
        height: 100,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
    },
    iconBackground: {
        position: 'absolute',
        width: 90,
        height: 90,
        borderRadius: 45,
        borderWidth: 3,
    },
    icon: {
        fontSize: 64,
    },
    glow: {
        position: 'absolute',
        width: 70,
        height: 70,
        borderRadius: 35,
        opacity: 0.4,
    },
});
