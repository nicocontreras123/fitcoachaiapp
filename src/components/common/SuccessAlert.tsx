import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Modal, Pressable, Dimensions } from 'react-native';
import { Text } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';

interface SuccessAlertProps {
    visible: boolean;
    title?: string;
    message?: string;
    onClose?: () => void;
    onContinue?: () => void;
    autoHideDuration?: number; // ms, 0 = no auto-hide
}

export const SuccessAlert: React.FC<SuccessAlertProps> = ({
    visible,
    title = '¡Excelente!',
    message = 'Has completado tu rutina.\n¡Sigue así!',
    onClose,
    onContinue,
    autoHideDuration = 0,
}) => {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0.8)).current;
    const glowAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (visible) {
            // Entrada con fade-in y zoom-in
            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                }),
                Animated.spring(scaleAnim, {
                    toValue: 1,
                    friction: 8,
                    tension: 40,
                    useNativeDriver: true,
                }),
            ]).start();

            // Efecto de glow pulsante
            Animated.loop(
                Animated.sequence([
                    Animated.timing(glowAnim, {
                        toValue: 1,
                        duration: 1500,
                        useNativeDriver: false,
                    }),
                    Animated.timing(glowAnim, {
                        toValue: 0,
                        duration: 1500,
                        useNativeDriver: false,
                    }),
                ])
            ).start();

            // Auto-hide si está configurado
            if (autoHideDuration > 0) {
                const timer = setTimeout(() => {
                    handleClose();
                }, autoHideDuration);
                return () => clearTimeout(timer);
            }
        } else {
            fadeAnim.setValue(0);
            scaleAnim.setValue(0.8);
        }
    }, [visible, autoHideDuration]);

    const handleClose = () => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true,
            }),
            Animated.timing(scaleAnim, {
                toValue: 0.8,
                duration: 200,
                useNativeDriver: true,
            }),
        ]).start(() => {
            onClose?.();
        });
    };

    const handleContinue = () => {
        handleClose();
        setTimeout(() => {
            onContinue?.();
        }, 250);
    };

    const glowOpacity = glowAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0.2, 0.5],
    });

    if (!visible) return null;

    return (
        <Modal transparent visible={visible} animationType="none" onRequestClose={handleClose}>
            <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
                <BlurView intensity={20} style={styles.blurContainer}>
                    <Pressable style={styles.backdropPress} onPress={handleClose} />

                    <Animated.View
                        style={[
                            styles.alertCard,
                            {
                                opacity: fadeAnim,
                                transform: [{ scale: scaleAnim }],
                            },
                        ]}
                    >
                        {/* Botón de cerrar */}
                        <Pressable style={styles.closeButton} onPress={handleClose}>
                            <MaterialCommunityIcons name="close" size={20} color="rgba(255, 255, 255, 0.5)" />
                        </Pressable>

                        <View style={styles.content}>
                            {/* Ícono de éxito con efecto glow */}
                            <View style={styles.iconContainer}>
                                <Animated.View style={[styles.glow, { opacity: glowOpacity }]} />
                                <LinearGradient
                                    colors={['rgba(19, 236, 91, 0.1)', 'rgba(19, 236, 91, 0.3)']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                    style={styles.iconCircle}
                                >
                                    <MaterialCommunityIcons name="check" size={40} color="#13ec5b" />
                                </LinearGradient>
                            </View>

                            {/* Título */}
                            <Text style={styles.title}>{title}</Text>

                            {/* Mensaje */}
                            <Text style={styles.message}>{message}</Text>

                            {/* Botón principal */}
                            <Pressable
                                style={({ pressed }) => [
                                    styles.continueButton,
                                    pressed && styles.continueButtonPressed,
                                ]}
                                onPress={handleContinue}
                            >
                                <LinearGradient
                                    colors={['#13ec5b', '#10c94d']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    style={styles.continueButtonGradient}
                                >
                                    <Text style={styles.continueButtonText}>Continuar</Text>
                                </LinearGradient>
                            </Pressable>
                        </View>

                        {/* Barra decorativa inferior */}
                        <LinearGradient
                            colors={['rgba(19, 236, 91, 0.2)', '#13ec5b', 'rgba(19, 236, 91, 0.2)']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.decorativeBar}
                        />
                    </Animated.View>
                </BlurView>
            </Animated.View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(16, 34, 22, 0.8)',
    },
    blurContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 16,
    },
    backdropPress: {
        ...StyleSheet.absoluteFillObject,
    },
    alertCard: {
        width: '100%',
        maxWidth: 340,
        backgroundColor: '#193322',
        borderRadius: 16,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.05)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 20 },
        shadowOpacity: 0.5,
        shadowRadius: 25,
        elevation: 20,
    },
    closeButton: {
        position: 'absolute',
        top: 16,
        right: 16,
        zIndex: 10,
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
    },
    content: {
        padding: 32,
        alignItems: 'center',
    },
    iconContainer: {
        marginBottom: 24,
        position: 'relative',
        justifyContent: 'center',
        alignItems: 'center',
    },
    glow: {
        position: 'absolute',
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#13ec5b',
        shadowColor: '#13ec5b',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 1,
        shadowRadius: 30,
    },
    iconCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(19, 236, 91, 0.2)',
    },
    title: {
        fontSize: 24,
        fontWeight: '700',
        color: '#ffffff',
        marginBottom: 8,
        textAlign: 'center',
        letterSpacing: -0.5,
    },
    message: {
        fontSize: 14,
        color: '#92c9a4',
        textAlign: 'center',
        lineHeight: 21,
        marginBottom: 32,
        maxWidth: 240,
    },
    continueButton: {
        width: '100%',
        borderRadius: 12,
        overflow: 'hidden',
        shadowColor: '#13ec5b',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.3,
        shadowRadius: 15,
        elevation: 8,
    },
    continueButtonPressed: {
        opacity: 0.9,
        transform: [{ scale: 0.98 }],
    },
    continueButtonGradient: {
        paddingVertical: 14,
        paddingHorizontal: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },
    continueButtonText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#102216',
        letterSpacing: 0.5,
    },
    decorativeBar: {
        height: 6,
        width: '100%',
    },
});
