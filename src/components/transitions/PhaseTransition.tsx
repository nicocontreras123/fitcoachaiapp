import React, { useEffect, useRef } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    withSpring,
    Easing,
    interpolate,
    runOnJS,
} from 'react-native-reanimated';

export type TransitionType = 'slide' | 'zoom' | 'fade' | 'slideZoom' | 'elastic';

interface PhaseTransitionProps {
    children: React.ReactNode;
    phaseKey: string; // Unique key for each phase to trigger transitions
    type?: TransitionType;
    duration?: number;
    onTransitionComplete?: () => void;
}

/**
 * PhaseTransition - Componente reutilizable para transiciones de fase
 * 
 * Proporciona diferentes tipos de transiciones animadas para cambios de pantalla/fase
 * en el timer de boxeo.
 * 
 * @param children - Contenido a animar
 * @param phaseKey - Clave única para cada fase (cambia cuando la fase cambia)
 * @param type - Tipo de transición: 'slide' | 'zoom' | 'fade' | 'slideZoom' | 'elastic'
 * @param duration - Duración de la animación en ms (default: 400)
 * @param onTransitionComplete - Callback cuando la transición termina
 */
export const PhaseTransition: React.FC<PhaseTransitionProps> = ({
    children,
    phaseKey,
    type = 'elastic',
    duration = 500,
    onTransitionComplete,
}) => {
    const progress = useSharedValue(1);
    const isFirstRender = useRef(true);

    useEffect(() => {
        // Skip animation on first render to avoid flash
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }

        // Reset and animate when phase changes
        progress.value = 0;

        if (type === 'elastic') {
            // Usar spring para efecto elástico - perfecto para boxing!
            progress.value = withSpring(
                1,
                {
                    damping: 18,
                    stiffness: 120,
                    mass: 0.8,
                },
                (finished) => {
                    if (finished && onTransitionComplete) {
                        runOnJS(onTransitionComplete)();
                    }
                }
            );
        } else {
            // Usar timing para otras animaciones
            progress.value = withTiming(
                1,
                {
                    duration,
                    easing: Easing.bezier(0.25, 0.1, 0.25, 1),
                },
                (finished) => {
                    if (finished && onTransitionComplete) {
                        runOnJS(onTransitionComplete)();
                    }
                }
            );
        }
    }, [phaseKey, type, duration]);

    const animatedStyle = useAnimatedStyle(() => {
        switch (type) {
            case 'slide':
                return {
                    opacity: progress.value,
                    transform: [
                        {
                            translateX: interpolate(
                                progress.value,
                                [0, 1],
                                [50, 0]
                            ),
                        },
                    ],
                };

            case 'zoom':
                return {
                    opacity: progress.value,
                    transform: [
                        {
                            scale: interpolate(
                                progress.value,
                                [0, 1],
                                [0.85, 1]
                            ),
                        },
                    ],
                };

            case 'fade':
                return {
                    opacity: progress.value,
                };

            case 'slideZoom':
                return {
                    opacity: progress.value,
                    transform: [
                        {
                            translateY: interpolate(
                                progress.value,
                                [0, 1],
                                [30, 0]
                            ),
                        },
                        {
                            scale: interpolate(
                                progress.value,
                                [0, 1],
                                [0.9, 1]
                            ),
                        },
                    ],
                };

            case 'elastic':
                // Efecto elástico con rebote - ideal para boxing timer
                return {
                    opacity: interpolate(
                        progress.value,
                        [0, 0.3, 1],
                        [0, 1, 1]
                    ),
                    transform: [
                        {
                            scale: progress.value,
                        },
                        {
                            translateY: interpolate(
                                progress.value,
                                [0, 1],
                                [25, 0]
                            ),
                        },
                    ],
                };

            default:
                return {
                    opacity: progress.value,
                };
        }
    });

    return (
        <Animated.View style={[styles.container, animatedStyle]}>
            {children}
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
});
