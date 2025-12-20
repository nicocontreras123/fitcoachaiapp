import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Pressable,
    Linking,
    StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

interface PrepTimerProps {
    exerciseName: string;
    timerType: 'boxing' | 'gym' | 'running';
    routinePreview: {
        warmup?: Array<{ name: string; duration?: number; description?: string }>;
        workout: Array<{
            name: string;
            description?: string;
            sets?: number;
            reps?: string;
            rounds?: string;
        }>;
        cooldown?: Array<{ name: string; duration?: number; description?: string }>;
        stats: {
            duration: string;
            intensity: string;
            circuits?: string;
            rounds?: string;
        };
    };
    onStart: () => void;
    onBack?: () => void;
    onEdit?: () => void;
}

const COLORS = {
    boxing: {
        primary: '#ec1313',
        bg: '#221010',
        card: '#2d1616',
        cardBorder: 'rgba(236, 19, 19, 0.2)',
        iconBg: '#482323',
        secondary: '#c99292',
    },
    gym: {
        primary: '#13ec5b',
        bg: '#102216',
        card: '#193322',
        cardBorder: 'rgba(19, 236, 91, 0.2)',
        iconBg: 'rgba(19, 236, 91, 0.1)',
        secondary: '#9ca3af',
    },
    running: {
        primary: '#3b82f6',
        bg: '#0f1629',
        card: '#1e2a47',
        cardBorder: 'rgba(59, 130, 246, 0.2)',
        iconBg: 'rgba(59, 130, 246, 0.1)',
        secondary: '#9ca3af',
    },
};

export const PrepTimerScreen: React.FC<PrepTimerProps> = ({
    exerciseName,
    timerType,
    routinePreview,
    onStart,
    onBack,
    onEdit,
}) => {
    const router = useRouter();
    const colors = COLORS[timerType];

    const handleBack = () => {
        if (onBack) {
            onBack();
        } else {
            router.back();
        }
    };

    const handleSearch = (exerciseName: string) => {
        const searchQuery = encodeURIComponent(`${exerciseName} ejercicio como hacer`);
        Linking.openURL(`https://www.google.com/search?q=${searchQuery}`);
    };

    const formatDuration = (seconds?: number) => {
        if (!seconds) return '5 min';
        const mins = Math.floor(seconds / 60);
        return mins > 0 ? `${mins} min` : `${seconds} seg`;
    };

    return (
        <SafeAreaView
            style={[styles.container, { backgroundColor: colors.bg }]}
            edges={['top', 'left', 'right']}
        >
            <StatusBar barStyle="light-content" />

            {/* Header */}
            <View style={styles.header}>
                <Pressable onPress={handleBack} style={styles.backButton}>
                    <MaterialCommunityIcons name="arrow-left" size={24} color="#ffffff" />
                </Pressable>
                <Text style={styles.headerTitle}>Rutina de Hoy</Text>
                <Pressable onPress={onEdit} style={styles.editButton}>
                    <Text style={[styles.editText, { color: colors.secondary }]}>Editar</Text>
                </Pressable>
            </View>

            {/* Stats Cards */}
            <View style={styles.statsSection}>
                <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
                    <MaterialCommunityIcons name="timer" size={24} color={colors.primary} />
                    <Text style={styles.statValue}>{routinePreview.stats.duration}</Text>
                    <Text style={[styles.statLabel, { color: colors.secondary }]}>DURACIÓN</Text>
                </View>
                <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
                    <MaterialCommunityIcons name="fire" size={24} color={colors.primary} />
                    <Text style={styles.statValue}>{routinePreview.stats.intensity}</Text>
                    <Text style={[styles.statLabel, { color: colors.secondary }]}>INTENSIDAD</Text>
                </View>
                <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
                    <MaterialCommunityIcons
                        name={timerType === 'boxing' ? 'boxing-glove' : 'format-list-bulleted'}
                        size={24}
                        color={colors.primary}
                    />
                    <Text style={styles.statValue}>
                        {routinePreview.stats.rounds || routinePreview.stats.circuits || '12+'}
                    </Text>
                    <Text style={[styles.statLabel, { color: colors.secondary }]}>
                        {timerType === 'boxing' ? 'ROUNDS' : 'CIRCUITOS'}
                    </Text>
                </View>
            </View>

            <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Warmup Section */}
                {routinePreview.warmup && routinePreview.warmup.length > 0 && (
                    <View style={styles.section}>
                        <View style={[styles.sectionHeader, { backgroundColor: colors.bg }]}>
                            <Text style={styles.sectionTitle}>Calentamiento</Text>
                            <Text style={[styles.sectionDuration, { color: colors.secondary }]}>
                                {formatDuration(routinePreview.warmup.reduce((sum, ex) => sum + (ex.duration || 300), 0))}
                            </Text>
                        </View>
                        <View style={styles.exerciseList}>
                            {routinePreview.warmup.map((exercise, index) => (
                                <View
                                    key={`warmup-${index}`}
                                    style={styles.exerciseRow}
                                >
                                    <View style={[styles.exerciseIconCircle, { backgroundColor: colors.iconBg }]}>
                                        <MaterialCommunityIcons
                                            name="run-fast"
                                            size={24}
                                            color={colors.primary}
                                        />
                                    </View>
                                    <View style={styles.exerciseContent}>
                                        <Text style={styles.exerciseName}>{exercise.name}</Text>
                                        <Text style={[styles.exerciseDescription, { color: colors.secondary }]}>
                                            {exercise.description || `${formatDuration(exercise.duration)} • Ritmo medio`}
                                        </Text>
                                    </View>
                                    <Pressable
                                        style={styles.searchButton}
                                        onPress={() => handleSearch(exercise.name)}
                                    >
                                        <MaterialCommunityIcons name="magnify" size={20} color="#9ca3af" />
                                    </Pressable>
                                </View>
                            ))}
                        </View>
                    </View>
                )}

                {/* Workout Section */}
                <View style={styles.section}>
                    <View style={[styles.sectionHeader, { backgroundColor: colors.bg }]}>
                        <Text style={[styles.sectionTitle, { color: colors.primary }]}>
                            {timerType === 'boxing' ? 'Circuito de Pelea' : 'Ejercicios Principales'}
                        </Text>
                        <Text style={[styles.sectionDuration, { color: colors.primary }]}>
                            {routinePreview.stats.duration}
                        </Text>
                    </View>
                    <View style={[styles.workoutCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
                        {routinePreview.workout.map((exercise, index) => (
                            <View
                                key={`workout-${index}`}
                                style={[
                                    styles.workoutExerciseRow,
                                    index < routinePreview.workout.length - 1 && {
                                        borderBottomWidth: 1,
                                        borderBottomColor: colors.cardBorder,
                                    },
                                ]}
                            >
                                <View style={[styles.exerciseIconCircle, { backgroundColor: colors.iconBg }]}>
                                    {exercise.rounds ? (
                                        <Text style={[styles.roundBadgeText, { color: colors.primary }]}>
                                            {exercise.rounds}
                                        </Text>
                                    ) : (
                                        <MaterialCommunityIcons
                                            name="dumbbell"
                                            size={24}
                                            color={colors.primary}
                                        />
                                    )}
                                </View>
                                <View style={styles.exerciseContent}>
                                    <Text style={styles.exerciseName}>{exercise.name}</Text>
                                    <Text style={[styles.exerciseDescription, { color: colors.secondary }]}>
                                        {exercise.description ||
                                            (exercise.sets && exercise.reps
                                                ? `${exercise.sets} series • ${exercise.reps} reps`
                                                : exercise.description || '')}
                                    </Text>
                                </View>
                                <Pressable
                                    style={styles.searchButton}
                                    onPress={() => handleSearch(exercise.name)}
                                >
                                    <MaterialCommunityIcons name="magnify" size={20} color="#9ca3af" />
                                </Pressable>
                            </View>
                        ))}
                    </View>
                </View>

                {/* Cooldown Section */}
                {routinePreview.cooldown && routinePreview.cooldown.length > 0 && (
                    <View style={[styles.section, { marginBottom: 100 }]}>
                        <View style={[styles.sectionHeader, { backgroundColor: colors.bg }]}>
                            <Text style={styles.sectionTitle}>Enfriamiento</Text>
                            <Text style={[styles.sectionDuration, { color: colors.secondary }]}>
                                {formatDuration(routinePreview.cooldown.reduce((sum, ex) => sum + (ex.duration || 180), 0))}
                            </Text>
                        </View>
                        <View style={styles.exerciseList}>
                            {routinePreview.cooldown.map((exercise, index) => (
                                <View
                                    key={`cooldown-${index}`}
                                    style={styles.exerciseRow}
                                >
                                    <View style={[styles.exerciseIconCircle, { backgroundColor: colors.iconBg }]}>
                                        <MaterialCommunityIcons
                                            name="stretch"
                                            size={24}
                                            color={colors.primary}
                                        />
                                    </View>
                                    <View style={styles.exerciseContent}>
                                        <Text style={styles.exerciseName}>{exercise.name}</Text>
                                        <Text style={[styles.exerciseDescription, { color: colors.secondary }]}>
                                            {exercise.description || `Estático • ${formatDuration(exercise.duration)}`}
                                        </Text>
                                    </View>
                                    <Pressable
                                        style={styles.searchButton}
                                        onPress={() => handleSearch(exercise.name)}
                                    >
                                        <MaterialCommunityIcons name="magnify" size={20} color="#9ca3af" />
                                    </Pressable>
                                </View>
                            ))}
                        </View>
                    </View>
                )}
            </ScrollView>

            {/* Fixed Bottom Button */}
            <View style={[styles.bottomGradient, { backgroundColor: colors.bg }]}>
                <LinearGradient
                    colors={['transparent', colors.bg, colors.bg]}
                    style={styles.gradient}
                >
                    <Pressable
                        style={[styles.startButton, { backgroundColor: colors.primary }]}
                        onPress={onStart}
                    >
                        <MaterialCommunityIcons name="play" size={24} color="#ffffff" />
                        <Text style={styles.startButtonText}>INICIAR TIMER</Text>
                    </Pressable>
                </LinearGradient>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontFamily: 'Lexend_700Bold',
        color: '#ffffff',
        letterSpacing: -0.5,
    },
    editButton: {
        paddingHorizontal: 8,
    },
    editText: {
        fontSize: 16,
        fontFamily: 'Lexend_700Bold',
    },
    statsSection: {
        flexDirection: 'row',
        gap: 12,
        paddingHorizontal: 16,
        paddingVertical: 24,
    },
    statCard: {
        flex: 1,
        alignItems: 'center',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        gap: 4,
    },
    statValue: {
        fontSize: 20,
        fontFamily: 'Lexend_700Bold',
        color: '#ffffff',
        marginTop: 4,
    },
    statLabel: {
        fontSize: 10,
        fontFamily: 'Lexend_500Medium',
        textTransform: 'uppercase',
        letterSpacing: 1.5,
        marginTop: 2,
    },
    scrollContent: {
        flex: 1,
    },
    section: {
        marginBottom: 8,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backdropFilter: 'blur(10px)',
    },
    sectionTitle: {
        fontSize: 20,
        fontFamily: 'Lexend_700Bold',
        color: '#ffffff',
    },
    sectionDuration: {
        fontSize: 14,
        fontFamily: 'Lexend_500Medium',
    },
    exerciseList: {
        borderTopWidth: 1,
        borderTopColor: 'rgba(255, 255, 255, 0.05)',
    },
    exerciseRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 16,
        gap: 16,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.05)',
    },
    exerciseIconCircle: {
        width: 48,
        height: 48,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    exerciseContent: {
        flex: 1,
    },
    exerciseName: {
        fontSize: 16,
        fontFamily: 'Lexend_500Medium',
        color: '#ffffff',
        marginBottom: 2,
    },
    exerciseDescription: {
        fontSize: 14,
        fontFamily: 'Lexend_400Regular',
    },
    searchButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    workoutCard: {
        marginHorizontal: 16,
        borderRadius: 16,
        borderWidth: 1,
        overflow: 'hidden',
    },
    workoutExerciseRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 16,
        gap: 16,
    },
    roundsBadge: {
        width: 48,
        height: 48,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    roundsBadgeLabel: {
        fontSize: 10,
        fontFamily: 'Lexend_700Bold',
        color: '#ffffff',
        textTransform: 'uppercase',
    },
    roundsBadgeValue: {
        fontSize: 18,
        fontFamily: 'Lexend_800ExtraBold',
        color: '#ffffff',
        lineHeight: 18,
    },
    roundBadgeText: {
        fontSize: 14,
        fontFamily: 'Lexend_700Bold',
        textAlign: 'center',
    },
    bottomGradient: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
    },
    gradient: {
        paddingHorizontal: 16,
        paddingTop: 24,
        paddingBottom: 32,
    },
    startButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        height: 56,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    startButtonText: {
        fontSize: 18,
        fontFamily: 'Lexend_700Bold',
        color: '#ffffff',
        letterSpacing: 1,
    },
});
