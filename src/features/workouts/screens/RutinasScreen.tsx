import React, { useMemo } from 'react';
import { View, ScrollView, StyleSheet, Text, Pressable, Image, Modal, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useWorkoutStore } from '../store/useWorkoutStore';
import { useUserStore } from '@/features/profile/store/userStore';
import { COLORS } from '@/constants/theme';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { NotificationService } from '@/services/notificationService';

const DAY_NAMES: Record<string, string> = {
    'lunes': 'LUN',
    'martes': 'MAR',
    'miércoles': 'MIÉ',
    'jueves': 'JUE',
    'viernes': 'VIE',
    'sábado': 'SÁB',
    'domingo': 'DOM',
};

const WORKOUT_TYPE_COLORS: Record<string, { bg: string; text: string; label: string }> = {
    'boxing': { bg: '#ef444420', text: '#fca5a5', label: 'BOXEO' },
    'running': { bg: '#3b82f620', text: '#93c5fd', label: 'CARDIO' },
    'gym': { bg: '#f59e0b20', text: '#fbbf24', label: 'FUERZA' },
    'recovery': { bg: '#3b82f620', text: '#93c5fd', label: 'RECUPERACIÓN' },
};

export default function RutinasScreen() {
    const router = useRouter();
    const { currentWeeklyRoutine, generateWeeklyRoutine, isGenerating, setCurrentWorkout, loadWeeklyRoutine } = useWorkoutStore();
    const { userData } = useUserStore();
    const { todayWorkouts } = useDashboardStats();

    // Cargar rutina al montar el componente
    React.useEffect(() => {
        if (!currentWeeklyRoutine) {

            loadWeeklyRoutine();
        }
    }, []);

    // Solicitar permisos de notificaciones al montar el componente
    React.useEffect(() => {
        const setupNotifications = async () => {
            const hasPermission = await NotificationService.requestPermissions();
            if (hasPermission) {
                console.log('✅ Notification permissions granted');

                // Schedule week-end reminder if not already scheduled
                await NotificationService.scheduleWeekEndReminder();

                // If there's a current routine, schedule daily reminders
                if (currentWeeklyRoutine) {
                    await NotificationService.scheduleDailyWorkoutReminders(currentWeeklyRoutine);
                }
            } else {
                console.log('⚠️ Notification permissions denied');
            }
        };

        setupNotifications();
    }, []);

    // Find today's workout
    const todayWorkout = useMemo(() => {
        if (!currentWeeklyRoutine?.days) return null;

        const today = new Date().toLocaleDateString('es-CL', { weekday: 'long' }).toLowerCase();
        const dayData = currentWeeklyRoutine.days[today];

        if (dayData && !dayData.restDay && dayData.workout) {
            return {
                dayName: today,
                ...dayData,
            };
        }

        return null;
    }, [currentWeeklyRoutine]);

    // Get upcoming days (excluding today)
    const upcomingDays = useMemo(() => {
        if (!currentWeeklyRoutine?.days) return [];

        const today = new Date().toLocaleDateString('es-CL', { weekday: 'long' }).toLowerCase();
        const daysOfWeek = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'];
        const todayIndex = daysOfWeek.indexOf(today);

        const upcoming = [];
        for (let i = 1; i < 7; i++) {
            const dayIndex = (todayIndex + i) % 7;
            const dayName = daysOfWeek[dayIndex];
            const dayData = currentWeeklyRoutine.days[dayName];

            if (dayData) {
                upcoming.push({
                    dayName,
                    dayShort: DAY_NAMES[dayName] || dayName.substring(0, 3).toUpperCase(),
                    dayNumber: new Date(Date.now() + i * 24 * 60 * 60 * 1000).getDate(),
                    ...dayData,
                });
            }
        }

        return upcoming;
    }, [currentWeeklyRoutine]);

    const handleStartWorkout = (workout: any) => {
        setCurrentWorkout(workout);
        router.push('/(tabs)/tracking');
    };

    const handleGenerateRoutine = async () => {
        if (!userData) return;

        try {


            // Mapear días disponibles de español a inglés
            const dayMap: Record<string, string> = {
                'lunes': 'monday',
                'martes': 'tuesday',
                'miércoles': 'wednesday',
                'jueves': 'thursday',
                'viernes': 'friday',
                'sábado': 'saturday',
                'domingo': 'sunday',
            };

            // Usar available_days que es el campo correcto del onboarding
            const trainingDays = (userData as any).available_days || (userData as any).trainingDays || [];
            const availableDays = trainingDays.map((day: string) => dayMap[day] || day);

            // Usar weekly_frequency que es el campo correcto del onboarding
            const weeklyFrequency = (userData as any).weekly_frequency || (userData as any).trainingDaysPerWeek || 3;





            const userLevel = (userData as any).level || 'intermediate';

            await generateWeeklyRoutine({
                sport: (userData as any).sports?.[0] || (userData as any).deportes?.[0] || 'mixed',
                level: userLevel,
                goals: (userData as any).goals?.[0] || (userData as any).goals || 'build-muscle',
                availableDays: availableDays.length > 0 ? availableDays : undefined,
                userProfile: {
                    name: userData.name,
                    age: userData.age,
                    weight: userData.weight,
                    height: userData.height,
                    level: userLevel,
                    trainingDaysPerWeek: weeklyFrequency,
                    deportes: (userData as any).sports || (userData as any).deportes || [],
                    equipment: (userData as any).equipment || [],
                } as any,
            });
        } catch (error) {
            console.error('[RutinasScreen] Error generating routine:', error);
        }
    };

    const getWorkoutTypeInfo = (workout: any) => {
        const type = workout?.type || 'gym';
        return WORKOUT_TYPE_COLORS[type] || WORKOUT_TYPE_COLORS['gym'];
    };

    // Log para debug de tiempos
    // Log para debug de tiempos
    console.log('📊 [RutinasScreen] upcomingDays:', upcomingDays?.map(d => ({
        day: d.dayName,
        totalDuration: d.workout?.totalDuration,
        title: d.workout?.title
    })));

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Plan Semanal</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Headline Section */}
                <View style={styles.headlineSection}>
                    <View style={styles.headlineContent}>
                        <View>
                            <Text style={styles.headlineSubtitle}>SEMANA 1 • DÍA 1</Text>
                            <Text style={styles.headlineTitle}>
                                Tu Objetivo:{'\n'}
                                <Text style={styles.headlineGradient}>
                                    {(() => {
                                        const goal = currentWeeklyRoutine?.goal || 'Mejorar Rendimiento';
                                        const translations: Record<string, string> = {
                                            'Improve endurance': 'Mejorar Resistencia',
                                            'Build muscle': 'Ganar Músculo',
                                            'Lose weight': 'Perder Peso',
                                            'Increase strength': 'Aumentar Fuerza',
                                            'Keep fit': 'Mantenimiento',
                                            'improve-endurance': 'Mejorar Resistencia',
                                            'build-muscle': 'Ganar Músculo',
                                            'lose-weight': 'Perder Peso',
                                            'increase-strength': 'Aumentar Fuerza',
                                            'keep-fit': 'Mantenimiento'
                                        };
                                        return translations[goal] || goal;
                                    })()}
                                </Text>
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Today's Workout Card */}
                {todayWorkout ? (
                    <View style={styles.featuredSection}>
                        <Pressable
                            style={styles.featuredCard}
                            onPress={() => handleStartWorkout(todayWorkout.workout)}
                        >
                            <Image
                                source={{ uri: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800' }}
                                style={styles.featuredImage}
                            />
                            <LinearGradient
                                colors={['transparent', 'rgba(16,34,22,0.8)', COLORS.background.dark]}
                                style={styles.featuredGradient}
                            />

                            <View style={styles.featuredContent}>
                                <View style={styles.featuredHeader}>
                                    <View style={{ flexDirection: 'row', gap: 8 }}>
                                        <View style={styles.todayBadge}>
                                            <Text style={styles.todayBadgeText}>HOY</Text>
                                        </View>
                                        {todayWorkouts > 0 && (
                                            <View style={styles.completedBadge}>
                                                <MaterialCommunityIcons name="check-circle" size={14} color="#10b981" />
                                                <Text style={styles.completedText}>COMPLETADO</Text>
                                            </View>
                                        )}
                                    </View>
                                    <MaterialCommunityIcons name="dots-vertical" size={24} color="rgba(255,255,255,0.7)" />
                                </View>

                                <View style={styles.featuredInfo}>
                                    <Text style={styles.featuredTitle}>
                                        {todayWorkout.workout?.title || getWorkoutTypeInfo(todayWorkout.workout).label}
                                    </Text>
                                    <Text style={styles.featuredDescription} numberOfLines={2}>
                                        {todayWorkout.workout?.description || 'Entrenamiento personalizado generado por IA'}
                                    </Text>

                                    <View style={styles.featuredMeta}>
                                        <View style={styles.metaItem}>
                                            <MaterialCommunityIcons name="timer-outline" size={18} color={COLORS.primary.DEFAULT} />
                                            <Text style={styles.metaText}>
                                                {todayWorkout.workout?.totalDuration || 45} min
                                            </Text>
                                        </View>
                                        <View style={styles.metaDot} />
                                        <View style={styles.metaItem}>
                                            <MaterialCommunityIcons name="lightning-bolt" size={18} color="#fb923c" />
                                            <Text style={styles.metaTextOrange}>
                                                {todayWorkout.workout?.difficulty === 'advanced' ? 'Difícil' :
                                                    todayWorkout.workout?.difficulty === 'beginner' ? 'Fácil' : 'Intermedio'}
                                            </Text>
                                        </View>
                                    </View>

                                    <Pressable
                                        style={[styles.startButton, { backgroundColor: todayWorkouts > 0 ? '#10b981' : COLORS.primary.DEFAULT }]}
                                        onPress={() => handleStartWorkout(todayWorkout.workout)}
                                    >
                                        <MaterialCommunityIcons
                                            name={todayWorkouts > 0 ? 'refresh' : 'play'}
                                            size={24}
                                            color={COLORS.background.dark}
                                        />
                                        <Text style={styles.startButtonText}>
                                            {todayWorkouts > 0 ? 'Empezar Nuevamente' : 'Iniciar ahora'}
                                        </Text>
                                    </Pressable>
                                </View>
                            </View>
                        </Pressable>
                    </View>
                ) : (
                    <View style={styles.noWorkoutCard}>
                        <MaterialCommunityIcons name="calendar-blank" size={48} color="rgba(255,255,255,0.3)" />
                        <Text style={styles.noWorkoutText}>No hay entrenamiento para hoy</Text>
                        <Text style={styles.noWorkoutSubtext}>Día de descanso</Text>
                    </View>
                )}

                {/* Upcoming Days Section */}
                <View style={styles.upcomingHeader}>
                    <Text style={styles.upcomingTitle}>Próximos días</Text>
                </View>

                <View style={styles.upcomingList}>
                    {upcomingDays.map((day, index) => (
                        <Pressable
                            key={index}
                            style={[styles.dayCard, day.restDay && styles.dayCardRest]}
                            onPress={() => day.workout && handleStartWorkout(day.workout)}
                        >
                            <View style={styles.dayDate}>
                                <Text style={[styles.dayShort, day.restDay && styles.dayShortRest]}>
                                    {day.dayShort}
                                </Text>
                                <Text style={[styles.dayNumber, day.restDay && styles.dayNumberRest]}>
                                    {day.dayNumber}
                                </Text>
                            </View>

                            <View style={styles.dayInfo}>
                                {!day.restDay && day.workout && (
                                    <>
                                        <View style={styles.dayBadge}>
                                            <View style={[
                                                styles.typeBadge,
                                                { backgroundColor: getWorkoutTypeInfo(day.workout).bg }
                                            ]}>
                                                <Text style={[
                                                    styles.typeBadgeText,
                                                    { color: getWorkoutTypeInfo(day.workout).text }
                                                ]}>
                                                    {getWorkoutTypeInfo(day.workout).label}
                                                </Text>
                                            </View>
                                        </View>
                                        <Text style={styles.dayTitle} numberOfLines={1}>
                                            {day.workout.title || getWorkoutTypeInfo(day.workout).label}
                                        </Text>
                                        <Text style={styles.daySubtitle} numberOfLines={1}>
                                            {day.workout.totalDuration || 45} min • {
                                                day.workout.difficulty === 'advanced' ? 'Avanzado' :
                                                    day.workout.difficulty === 'beginner' ? 'Principiante' : 'Intermedio'
                                            }
                                        </Text>
                                    </>
                                )}
                                {day.restDay && (
                                    <>
                                        <Text style={styles.dayTitleRest}>Día de Descanso Total</Text>
                                        <Text style={styles.daySubtitleRest}>Recuperación muscular</Text>
                                    </>
                                )}
                            </View>

                            <View style={[styles.dayArrow, !day.restDay && styles.dayArrowActive]}>
                                <MaterialCommunityIcons
                                    name={day.restDay ? "sleep" : "chevron-right"}
                                    size={24}
                                    color={day.restDay ? "#6b7280" : "rgba(255,255,255,0.4)"}
                                />
                            </View>
                        </Pressable>
                    ))}
                </View>

                {/* Regenerate Button */}
                <Pressable
                    style={[styles.regenerateButton, isGenerating && styles.regenerateButtonDisabled]}
                    onPress={handleGenerateRoutine}
                    disabled={isGenerating}
                >
                    <MaterialCommunityIcons
                        name="autorenew"
                        size={24}
                        color={isGenerating ? '#6b7280' : COLORS.primary.DEFAULT}
                    />
                    <Text style={[styles.regenerateButtonText, isGenerating && styles.regenerateButtonTextDisabled]}>
                        {isGenerating ? 'Generando...' : 'Regenerar Rutina Semanal'}
                    </Text>
                </Pressable>

                <View style={{ height: 120 }} />
            </ScrollView>

            {/* Loading Modal */}
            <Modal
                visible={isGenerating}
                transparent
                animationType="fade"
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <ActivityIndicator size="large" color={COLORS.primary.DEFAULT} />
                        <Text style={styles.modalTitle}>Generando Rutina</Text>
                        <Text style={styles.modalSubtitle}>La IA está creando tu plan personalizado...</Text>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background.dark,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.05)',
    },
    headerButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontFamily: 'Lexend_700Bold',
        color: '#fff',
    },
    content: {
        flex: 1,
        paddingHorizontal: 16,
    },
    headlineSection: {
        paddingTop: 24,
        paddingBottom: 16,
    },
    headlineContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    headlineSubtitle: {
        fontSize: 12,
        fontFamily: 'Lexend_600SemiBold',
        color: COLORS.primary.DEFAULT,
        letterSpacing: 1.2,
        marginBottom: 4,
    },
    headlineTitle: {
        fontSize: 28,
        fontFamily: 'Lexend_700Bold',
        color: '#fff',
        lineHeight: 36,
    },
    headlineGradient: {
        color: '#9ca3af',
    },
    aiIcon: {
        backgroundColor: '#182e21',
        padding: 8,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    featuredSection: {
        marginBottom: 32,
    },
    featuredCard: {
        borderRadius: 12,
        overflow: 'hidden',
        height: 380,
        position: 'relative',
    },
    featuredImage: {
        ...StyleSheet.absoluteFillObject,
        opacity: 0.6,
    },
    featuredGradient: {
        ...StyleSheet.absoluteFillObject,
    },
    featuredContent: {
        flex: 1,
        padding: 20,
        justifyContent: 'space-between',
    },
    featuredHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    todayBadge: {
        backgroundColor: COLORS.primary.DEFAULT,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
    },
    todayBadgeText: {
        fontSize: 12,
        fontFamily: 'Lexend_700Bold',
        color: COLORS.background.dark,
        letterSpacing: 1,
    },
    featuredInfo: {
        gap: 8,
    },
    featuredTitle: {
        fontSize: 24,
        fontFamily: 'Lexend_700Bold',
        color: '#fff',
    },
    featuredDescription: {
        fontSize: 14,
        fontFamily: 'Lexend_400Regular',
        color: '#d1d5db',
        lineHeight: 20,
    },
    featuredMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginTop: 8,
        marginBottom: 16,
    },
    metaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    metaText: {
        fontSize: 14,
        fontFamily: 'Lexend_500Medium',
        color: COLORS.primary.DEFAULT,
    },
    metaTextOrange: {
        fontSize: 14,
        fontFamily: 'Lexend_500Medium',
        color: '#fb923c',
    },
    metaDot: {
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: 'rgba(255,255,255,0.2)',
    },
    startButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.primary.DEFAULT,
        height: 48,
        borderRadius: 8,
        gap: 8,
        shadowColor: COLORS.primary.DEFAULT,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 8,
    },
    startButtonText: {
        fontSize: 16,
        fontFamily: 'Lexend_700Bold',
        color: COLORS.background.dark,
    },
    noWorkoutCard: {
        backgroundColor: '#182e2180',
        borderRadius: 12,
        padding: 40,
        alignItems: 'center',
        marginBottom: 32,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    noWorkoutText: {
        fontSize: 18,
        fontFamily: 'Lexend_600SemiBold',
        color: '#fff',
        marginTop: 16,
    },
    noWorkoutSubtext: {
        fontSize: 14,
        fontFamily: 'Lexend_400Regular',
        color: '#9ca3af',
        marginTop: 4,
    },
    upcomingHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
        paddingHorizontal: 4,
    },
    upcomingTitle: {
        fontSize: 18,
        fontFamily: 'Lexend_700Bold',
        color: '#fff',
    },
    upcomingLink: {
        fontSize: 14,
        fontFamily: 'Lexend_500Medium',
        color: COLORS.primary.DEFAULT,
    },
    upcomingList: {
        gap: 12,
    },
    dayCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#182e2180',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
        borderRadius: 12,
        padding: 16,
        gap: 16,
    },
    dayCardRest: {
        backgroundColor: '#182e2150',
        opacity: 0.7,
    },
    dayDate: {
        alignItems: 'center',
        width: 48,
    },
    dayShort: {
        fontSize: 12,
        fontFamily: 'Lexend_500Medium',
        color: '#9ca3af',
        textTransform: 'uppercase',
    },
    dayShortRest: {
        color: '#6b7280',
    },
    dayNumber: {
        fontSize: 18,
        fontFamily: 'Lexend_700Bold',
        color: '#fff',
    },
    dayNumberRest: {
        color: '#6b7280',
    },
    dayInfo: {
        flex: 1,
        gap: 4,
    },
    dayBadge: {
        flexDirection: 'row',
        marginBottom: 4,
    },
    typeBadge: {
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    typeBadgeText: {
        fontSize: 10,
        fontFamily: 'Lexend_700Bold',
        textTransform: 'uppercase',
    },
    dayTitle: {
        fontSize: 16,
        fontFamily: 'Lexend_500Medium',
        color: '#fff',
    },
    dayTitleRest: {
        fontSize: 16,
        fontFamily: 'Lexend_500Medium',
        color: '#d1d5db',
    },
    daySubtitle: {
        fontSize: 14,
        fontFamily: 'Lexend_400Regular',
        color: '#9ca3af',
    },
    daySubtitleRest: {
        fontSize: 14,
        fontFamily: 'Lexend_400Regular',
        color: '#6b7280',
    },
    dayArrow: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: 'rgba(255,255,255,0.05)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    dayArrowActive: {
        backgroundColor: 'rgba(19,236,91,0.1)',
    },
    regenerateButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        backgroundColor: '#182e21',
        borderWidth: 1,
        borderColor: COLORS.primary.DEFAULT,
        paddingHorizontal: 24,
        paddingVertical: 16,
        borderRadius: 12,
        marginTop: 24,
        marginHorizontal: 16,
    },
    regenerateButtonDisabled: {
        backgroundColor: '#1a1a1a',
        borderColor: '#4b5563',
        opacity: 0.6,
    },
    regenerateButtonText: {
        fontSize: 16,
        fontFamily: 'Lexend_700Bold',
        color: COLORS.primary.DEFAULT,
    },
    regenerateButtonTextDisabled: {
        color: '#6b7280',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: '#193322',
        borderRadius: 16,
        padding: 32,
        alignItems: 'center',
        gap: 16,
        borderWidth: 1,
        borderColor: 'rgba(19, 236, 91, 0.3)',
    },
    modalTitle: {
        fontSize: 20,
        fontFamily: 'Lexend_700Bold',
        color: '#fff',
    },
    modalSubtitle: {
        fontSize: 14,
        fontFamily: 'Lexend_400Regular',
        color: '#9ca3af',
        textAlign: 'center',
    },
    completedBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: 'rgba(16, 185, 129, 0.2)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
        borderWidth: 1,
        borderColor: '#10b981',
    },
    completedText: {
        fontSize: 10,
        fontFamily: 'Lexend_700Bold',
        color: '#10b981',
        letterSpacing: 0.5,
    },
});
