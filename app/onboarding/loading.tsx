import { useEffect, useState } from 'react';
import { View, StyleSheet, Text, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useWorkoutStore } from '@/features/workouts/store/useWorkoutStore';
import { useOnboardingStore } from '@/features/onboarding/store/onboardingStore';
import { useUserStore } from '@/features/profile/store/userStore';
import { COLORS } from '@/constants/theme';

const LOADING_PHASES = [
    { progress: 15, message: 'Analizando tu perfil físico...', duration: 1500 },
    { progress: 30, message: 'Procesando objetivos y nivel...', duration: 1500 },
    { progress: 45, message: 'Consultando con IA especializada...', duration: 2000 },
    { progress: 60, message: 'Generando rutina personalizada...', duration: 3000 },
    { progress: 75, message: 'Optimizando ejercicios para ti...', duration: 2500 },
    { progress: 85, message: 'Calibrando intensidad y volumen...', duration: 2000 },
    { progress: 92, message: 'Ajustando días de entrenamiento...', duration: 1500 },
    { progress: 97, message: 'Finalizando detalles...', duration: 1000 },
];

export default function LoadingScreen() {
    const router = useRouter();
    const { formData } = useOnboardingStore();
    const { generateWeeklyRoutine } = useWorkoutStore();
    const { completeOnboarding } = useUserStore();

    const [progress, setProgress] = useState(0);
    const [currentPhase, setCurrentPhase] = useState(0);
    const [isGenerating, setIsGenerating] = useState(false);
    const [pulseAnim] = useState(new Animated.Value(1));
    const [spinAnim] = useState(new Animated.Value(0));
    const [glowAnim] = useState(new Animated.Value(0));

    useEffect(() => {
        // Pulse animation
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1.1,
                    duration: 2000,
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 2000,
                    useNativeDriver: true,
                }),
            ])
        ).start();

        // Spin animation - más rápido cuando está generando
        const spinDuration = isGenerating ? 2000 : 3000;
        Animated.loop(
            Animated.timing(spinAnim, {
                toValue: 1,
                duration: spinDuration,
                useNativeDriver: true,
            })
        ).start();

        // Glow animation cuando está en fase de generación
        if (isGenerating) {
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
        }
    }, [isGenerating]);

    useEffect(() => {
        const generateRoutine = async () => {
            try {


                // Progreso por fases realistas
                const advancePhases = async () => {
                    for (let i = 0; i < LOADING_PHASES.length; i++) {
                        const phase = LOADING_PHASES[i];
                        setCurrentPhase(i);

                        // Marcar cuando comienza la generación real de IA
                        if (i === 3) {
                            setIsGenerating(true);
                        }

                        // Animar progreso suavemente hacia el objetivo
                        const startProgress = progress;
                        const targetProgress = phase.progress;
                        const steps = 20;
                        const increment = (targetProgress - startProgress) / steps;

                        for (let j = 0; j < steps; j++) {
                            await new Promise(resolve => setTimeout(resolve, phase.duration / steps));
                            setProgress(prev => Math.min(prev + increment, targetProgress));
                        }

                        // Pequeña pausa entre fases
                        if (i < LOADING_PHASES.length - 1) {
                            await new Promise(resolve => setTimeout(resolve, 200));
                        }
                    }
                };

                // Iniciar progreso por fases
                advancePhases();

                // Generate weekly routine with AI


                // Map sport to valid type
                const sportMap: Record<string, 'boxing' | 'running' | 'gym' | 'mixed'> = {
                    'boxing': 'boxing',
                    'boxeo': 'boxing',
                    'running': 'running',
                    'funcional': 'gym',
                    'gym': 'gym',
                };

                const sport = sportMap[formData.deportes?.[0]?.toLowerCase() || ''] || 'mixed';

                // Map selected days to English day names
                const dayMap: Record<string, string> = {
                    'lunes': 'monday',
                    'martes': 'tuesday',
                    'miércoles': 'wednesday',
                    'jueves': 'thursday',
                    'viernes': 'friday',
                    'sábado': 'saturday',
                    'domingo': 'sunday',
                };

                const availableDays = ((formData as any).available_days || []).map((day: string) => dayMap[day] || day);
                const weeklyFrequency = (formData as any).weekly_frequency || 3;




                const userLevel = formData.level || 'intermediate';

                console.log('🎯 Onboarding - Level selected:', {
                    formDataLevel: formData.level,
                    finalLevel: userLevel,
                });

                await generateWeeklyRoutine({
                    sport,
                    level: userLevel,
                    goals: formData.goals?.[0] || 'build-muscle',
                    availableDays: availableDays.length > 0 ? availableDays : undefined,
                    userProfile: {
                        name: formData.name || 'Usuario',
                        age: formData.age || 25,
                        weight: formData.weight || 70,
                        height: formData.height || 170,
                        level: userLevel,
                        trainingDaysPerWeek: weeklyFrequency,
                        deportes: formData.deportes || [],
                        equipment: formData.equipment || [],
                    } as any,
                });


                setIsGenerating(false);

                // Complete onboarding - saves all form data and marks as completed

                setCurrentPhase(LOADING_PHASES.length); // Última fase
                setProgress(98);



                await completeOnboarding({
                    name: formData.name || 'Usuario',
                    age: formData.age || 25,
                    weight: formData.weight || 70,
                    height: formData.height || 170,
                    level: userLevel as any,
                    sports: formData.deportes || [],
                    goals: (formData.goals?.[0] || 'build-muscle') as any,
                    trainingDays: availableDays,
                    equipment: formData.equipment || [],
                    voiceEnabled: true,
                    timerSoundEnabled: true,
                    prepTimeMinutes: 0,
                    prepTimeSeconds: 10,
                } as any);


                // Completar al 100%
                setProgress(100);

                // Navigate to home
                setTimeout(() => {
                    router.replace('/(tabs)');
                }, 800);
            } catch (error) {
                console.error('[Loading] Error generating routine:', error);
                setIsGenerating(false);
                // Still navigate even if there's an error
                setProgress(100);
                setTimeout(() => {
                    router.replace('/(tabs)');
                }, 1500);
            }
        };

        generateRoutine();
    }, []);

    const spin = spinAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
    });

    return (
        <View style={styles.container}>
            {/* Background Glows */}
            <View style={[styles.glow, styles.glowTop]} />
            <View style={[styles.glow, styles.glowBottom]} />

            {/* Content */}
            <View style={styles.content}>
                {/* Central Animation */}
                <View style={styles.animationContainer}>
                    {/* Outer Pulse Ring */}
                    <Animated.View
                        style={[
                            styles.pulseRing,
                            { transform: [{ scale: pulseAnim }] }
                        ]}
                    />

                    {/* Middle Ring */}
                    <View style={styles.middleRing} />

                    {/* Spinning Ring */}
                    <Animated.View
                        style={[
                            styles.spinningRing,
                            { transform: [{ rotate: spin }] }
                        ]}
                    />

                    {/* Core Icon */}
                    <View style={styles.coreIcon}>
                        <MaterialCommunityIcons
                            name="brain"
                            size={72}
                            color={COLORS.primary.DEFAULT}
                        />
                    </View>

                    {/* Floating Dots */}
                    <Animated.View
                        style={[styles.floatingDot, styles.dot1, { opacity: pulseAnim }]}
                    />
                    <View style={[styles.floatingDot, styles.dot2]} />
                </View>

                {/* Headline & Message */}
                <View style={styles.textContainer}>
                    <Text style={styles.headline}>Generando tu Plan</Text>
                    <Animated.Text
                        style={[styles.message, { opacity: pulseAnim }]}
                    >
                        {LOADING_PHASES[currentPhase]?.message || 'Preparando tu entrenamiento...'}
                    </Animated.Text>
                    {isGenerating && (
                        <View style={styles.aiIndicator}>
                            <Animated.View
                                style={[
                                    styles.aiDot,
                                    {
                                        opacity: glowAnim.interpolate({
                                            inputRange: [0, 1],
                                            outputRange: [0.3, 1],
                                        }),
                                    },
                                ]}
                            />
                            <Text style={styles.aiText}>IA Trabajando</Text>
                        </View>
                    )}
                </View>

                {/* Processing Modules */}
                <View style={styles.modulesSection}>
                    <Text style={styles.modulesTitle}>MÓDULOS DE PROCESAMIENTO</Text>

                    <View style={styles.modulesGrid}>
                        {/* Profile Module */}
                        <View style={styles.moduleCard}>
                            <View style={styles.moduleIcon}>
                                <MaterialCommunityIcons
                                    name="account-check"
                                    size={24}
                                    color={currentPhase >= 1 ? COLORS.primary.DEFAULT : "#9ca3af"}
                                />
                            </View>
                            <View style={styles.moduleText}>
                                <Text style={styles.moduleName}>Perfil</Text>
                                <View style={styles.moduleStatus}>
                                    {currentPhase >= 1 ? (
                                        <>
                                            <MaterialCommunityIcons name="check-circle" size={12} color={COLORS.primary.DEFAULT} />
                                            <Text style={styles.moduleStatusTextDone}>Analizado</Text>
                                        </>
                                    ) : (
                                        <>
                                            <MaterialCommunityIcons name="dots-horizontal" size={12} color="rgba(255,255,255,0.6)" />
                                            <Text style={styles.moduleStatusTextLoading}>Esperando...</Text>
                                        </>
                                    )}
                                </View>
                            </View>
                        </View>

                        {/* AI Module */}
                        <View style={styles.moduleCard}>
                            <View style={styles.moduleIcon}>
                                <MaterialCommunityIcons
                                    name="brain"
                                    size={24}
                                    color={currentPhase >= 3 ? COLORS.primary.DEFAULT : "#9ca3af"}
                                />
                            </View>
                            <View style={styles.moduleText}>
                                <Text style={styles.moduleName}>IA Generativa</Text>
                                <View style={styles.moduleStatus}>
                                    {currentPhase >= 6 ? (
                                        <>
                                            <MaterialCommunityIcons name="check-circle" size={12} color={COLORS.primary.DEFAULT} />
                                            <Text style={styles.moduleStatusTextDone}>Completado</Text>
                                        </>
                                    ) : currentPhase >= 3 ? (
                                        <>
                                            <Animated.View
                                                style={{
                                                    opacity: glowAnim.interpolate({
                                                        inputRange: [0, 1],
                                                        outputRange: [0.3, 1],
                                                    }),
                                                }}
                                            >
                                                <MaterialCommunityIcons name="sync" size={12} color={COLORS.primary.DEFAULT} />
                                            </Animated.View>
                                            <Text style={[styles.moduleStatusTextLoading, { color: COLORS.primary.DEFAULT }]}>Procesando...</Text>
                                        </>
                                    ) : (
                                        <>
                                            <MaterialCommunityIcons name="dots-horizontal" size={12} color="rgba(255,255,255,0.6)" />
                                            <Text style={styles.moduleStatusTextLoading}>En cola...</Text>
                                        </>
                                    )}
                                </View>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Progress Bar */}
                <View style={styles.progressSection}>
                    <View style={styles.progressHeader}>
                        <Text style={styles.progressLabel}>Progreso General</Text>
                        <Text style={styles.progressPercentage}>{Math.round(progress)}%</Text>
                    </View>
                    <View style={styles.progressBarContainer}>
                        <Animated.View
                            style={[
                                styles.progressBar,
                                {
                                    width: `${Math.min(progress, 100)}%`,
                                }
                            ]}
                        />
                        {isGenerating && progress < 95 && (
                            <Animated.View
                                style={[
                                    styles.progressGlow,
                                    {
                                        left: `${Math.min(progress, 100)}%`,
                                        opacity: glowAnim,
                                    },
                                ]}
                            />
                        )}
                    </View>
                </View>

                {/* Quote */}
                <View style={styles.quoteCard}>
                    <Text style={styles.quoteText}>
                        "La grandeza toma tiempo, pero tu plan está casi listo. La consistencia supera la intensidad."
                    </Text>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background.dark,
    },
    glow: {
        position: 'absolute',
        width: 300,
        height: 300,
        backgroundColor: `${COLORS.primary.DEFAULT}0D`,
        borderRadius: 150,
    },
    glowTop: {
        top: '-10%',
        right: '-20%',
    },
    glowBottom: {
        bottom: '-10%',
        left: '-20%',
    },
    content: {
        flex: 1,
        paddingHorizontal: 24,
        paddingTop: 60,
        paddingBottom: 24,
        justifyContent: 'space-between',
    },
    animationContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        height: 224,
        marginVertical: 40,
    },
    pulseRing: {
        position: 'absolute',
        width: 224,
        height: 224,
        borderRadius: 112,
        backgroundColor: `${COLORS.primary.DEFAULT}0D`,
    },
    middleRing: {
        position: 'absolute',
        width: 200,
        height: 200,
        borderRadius: 100,
        borderWidth: 1,
        borderColor: `${COLORS.primary.DEFAULT}33`,
    },
    spinningRing: {
        position: 'absolute',
        width: 216,
        height: 216,
        borderRadius: 108,
        borderWidth: 2,
        borderColor: `${COLORS.primary.DEFAULT}4D`,
        borderTopColor: COLORS.primary.DEFAULT,
    },
    coreIcon: {
        width: 144,
        height: 144,
        borderRadius: 72,
        backgroundColor: '#1a3324',
        borderWidth: 1,
        borderColor: `${COLORS.primary.DEFAULT}33`,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: COLORS.primary.DEFAULT,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.15,
        shadowRadius: 30,
        elevation: 8,
    },
    floatingDot: {
        position: 'absolute',
        borderRadius: 6,
        backgroundColor: COLORS.primary.DEFAULT,
    },
    dot1: {
        width: 12,
        height: 12,
        right: -8,
        top: 40,
        shadowColor: COLORS.primary.DEFAULT,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 1,
        shadowRadius: 10,
    },
    dot2: {
        width: 8,
        height: 8,
        left: -8,
        bottom: 40,
        opacity: 0.5,
    },
    textContainer: {
        alignItems: 'center',
        gap: 12,
    },
    headline: {
        fontSize: 32,
        fontFamily: 'Lexend_700Bold',
        color: '#ffffff',
        textAlign: 'center',
    },
    message: {
        fontSize: 18,
        fontFamily: 'Lexend_500Medium',
        color: COLORS.primary.DEFAULT,
        textAlign: 'center',
        minHeight: 28,
    },
    aiIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginTop: 12,
        paddingHorizontal: 16,
        paddingVertical: 8,
        backgroundColor: `${COLORS.primary.DEFAULT}1A`,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: `${COLORS.primary.DEFAULT}33`,
    },
    aiDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: COLORS.primary.DEFAULT,
        shadowColor: COLORS.primary.DEFAULT,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 1,
        shadowRadius: 8,
    },
    aiText: {
        fontSize: 12,
        fontFamily: 'Lexend_600SemiBold',
        color: COLORS.primary.DEFAULT,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    modulesSection: {
        marginTop: 40,
    },
    modulesTitle: {
        fontSize: 10,
        fontFamily: 'Lexend_700Bold',
        color: 'rgba(255,255,255,0.4)',
        letterSpacing: 1.5,
        marginBottom: 16,
    },
    modulesGrid: {
        flexDirection: 'row',
        gap: 12,
    },
    moduleCard: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        padding: 12,
        borderRadius: 12,
        backgroundColor: '#1a332480',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    moduleIcon: {
        width: 40,
        height: 40,
        borderRadius: 8,
        backgroundColor: '#1a3324',
        justifyContent: 'center',
        alignItems: 'center',
    },
    moduleText: {
        flex: 1,
    },
    moduleName: {
        fontSize: 14,
        fontFamily: 'Lexend_500Medium',
        color: '#ffffff',
        marginBottom: 2,
    },
    moduleStatus: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    moduleStatusTextDone: {
        fontSize: 12,
        fontFamily: 'Lexend_600SemiBold',
        color: COLORS.primary.DEFAULT,
    },
    moduleStatusTextLoading: {
        fontSize: 12,
        fontFamily: 'Lexend_400Regular',
        color: 'rgba(255,255,255,0.6)',
    },
    progressSection: {
        marginTop: 24,
        gap: 8,
    },
    progressHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
    },
    progressLabel: {
        fontSize: 14,
        fontFamily: 'Lexend_500Medium',
        color: 'rgba(255,255,255,0.8)',
    },
    progressPercentage: {
        fontSize: 16,
        fontFamily: 'Lexend_700Bold',
        color: COLORS.primary.DEFAULT,
    },
    progressBarContainer: {
        height: 8,
        backgroundColor: '#1F1F1F',
        borderRadius: 4,
        overflow: 'hidden',
    },
    progressBar: {
        height: '100%',
        backgroundColor: COLORS.primary.DEFAULT,
        borderRadius: 4,
        shadowColor: COLORS.primary.DEFAULT,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 1,
        shadowRadius: 15,
    },
    progressGlow: {
        position: 'absolute',
        width: 20,
        height: '100%',
        backgroundColor: '#ffffff',
        marginLeft: -10,
        borderRadius: 4,
        shadowColor: '#ffffff',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 10,
    },
    quoteCard: {
        marginTop: 24,
        padding: 16,
        borderRadius: 8,
        backgroundColor: '#1a332480',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    quoteText: {
        fontSize: 14,
        fontFamily: 'Lexend_400Regular',
        color: '#92c9a4',
        textAlign: 'center',
        lineHeight: 22,
    },
});
