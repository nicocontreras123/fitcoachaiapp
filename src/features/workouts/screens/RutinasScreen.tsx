import React from 'react';
import { View, ScrollView, Alert, StyleSheet } from 'react-native';
import { useWorkoutStore } from '../store/useWorkoutStore';
import { RutinaCard } from '../components/RutinaCard';
import { TodayWorkoutCard } from '../components/TodayWorkoutCard';
import { WorkoutLoading } from '../components/WorkoutLoading';
import { useUserStore } from '@/features/profile/store/userStore';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Text, Button, Surface, useTheme } from 'react-native-paper';

export default function RutinasScreen() {
    const { currentWeeklyRoutine, generateWeeklyRoutine, loadWeeklyRoutine, isGenerating, setCurrentWorkout } = useWorkoutStore();
    const { userData } = useUserStore();
    const router = useRouter();
    const theme = useTheme();

    React.useEffect(() => {
        loadWeeklyRoutine();
    }, []);

    const handleGenerate = () => {
        if (!userData) {
            Alert.alert("Error", "Completa tu perfil primero");
            return;
        }

        generateWeeklyRoutine({
            sport: 'mixed',
            level: userData.level || 'intermediate',
            goals: userData.goals || 'Estar en forma',
            userProfile: {
                name: userData.name,
                age: userData.age,
                weight: userData.weight,
                height: userData.height,
            }
        });
    };

    const handleDayPress = (dayKey: string) => {
        const dayInfo = currentWeeklyRoutine?.days?.[dayKey];
        if (!dayInfo || !dayInfo.workout) return;

        const workout = dayInfo.workout;
        setCurrentWorkout(workout);

        router.push('/(tabs)/tracking');
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.header}>
                    <Text variant="headlineMedium" style={{ fontWeight: 'bold', color: theme.colors.onBackground, marginBottom: 8 }}>
                        Tu Plan Semanal
                    </Text>
                    <Text variant="bodyLarge" style={{ color: theme.colors.onSurfaceVariant }}>
                        {currentWeeklyRoutine?.goal || "Genera tu rutina personalizada con IA"}
                    </Text>
                </View>

                {isGenerating ? (
                    <WorkoutLoading sport="mixed" />
                ) : !currentWeeklyRoutine ? (
                    <Surface style={[styles.emptyState, { backgroundColor: theme.colors.surface }]} elevation={1}>
                        <MaterialCommunityIcons name="robot" size={64} color={theme.colors.primary} />
                        <Text variant="titleLarge" style={{ fontWeight: 'bold', marginTop: 16, marginBottom: 8, textAlign: 'center' }}>
                            Sin rutina activa
                        </Text>
                        <Text variant="bodyMedium" style={{ textAlign: 'center', marginBottom: 24, color: theme.colors.onSurfaceVariant }}>
                            Usa nuestra IA para crear un plan de 7 días adaptado a ti.
                        </Text>
                        <Button
                            mode="contained"
                            onPress={handleGenerate}
                            icon="flash"
                            contentStyle={{ height: 48 }}
                        >
                            Generar Nueva Rutina
                        </Button>
                    </Surface>
                ) : (
                    <View>
                        {currentWeeklyRoutine.days && (() => {
                            const today = new Date().toLocaleDateString('es-CL', { weekday: 'long' }).toLowerCase();
                            const entries = Object.entries(currentWeeklyRoutine.days);

                            // Find today's workout
                            const todayEntry = entries.find(([key]) => key.toLowerCase() === today);

                            // Filter out today from the rest
                            const otherEntries = entries.filter(([key]) => key.toLowerCase() !== today);

                            return (
                                <>
                                    {/* Today's workout - destacado */}
                                    {todayEntry && (
                                        <View>
                                            <TodayWorkoutCard
                                                dayInfo={todayEntry[1]}
                                                onPress={() => handleDayPress(todayEntry[0])}
                                            />

                                            {/* Separator */}
                                            <View style={styles.separator}>
                                                <View style={[styles.separatorLine, { backgroundColor: theme.colors.outlineVariant }]} />
                                                <Text variant="labelLarge" style={[styles.separatorText, { color: theme.colors.onSurfaceVariant }]}>
                                                    RESTO DE LA SEMANA
                                                </Text>
                                                <View style={[styles.separatorLine, { backgroundColor: theme.colors.outlineVariant }]} />
                                            </View>
                                        </View>
                                    )}

                                    {/* Other days */}
                                    {otherEntries.map(([key, dayInfo]) => (
                                        <RutinaCard
                                            key={key}
                                            dayInfo={dayInfo}
                                            onPress={() => handleDayPress(key)}
                                        />
                                    ))}
                                </>
                            );
                        })()}

                        <Button
                            mode="outlined"
                            onPress={handleGenerate}
                            style={{ marginTop: 24 }}
                        >
                            Regenerar Rutina
                        </Button>
                    </View>
                )}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        padding: 16,
        paddingTop: 60,
        paddingBottom: 100,
    },
    header: {
        marginBottom: 24,
    },
    loadingContainer: {
        height: 300,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyState: {
        padding: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    separator: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 24,
        gap: 12,
    },
    separatorLine: {
        flex: 1,
        height: 2,
        borderRadius: 1,
    },
    separatorText: {
        fontWeight: '900',
        letterSpacing: 1.5,
        paddingHorizontal: 8,
    },
});
