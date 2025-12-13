import { useState } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Button, Text, ProgressBar, useTheme, Chip, Surface, TouchableRipple } from 'react-native-paper';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useOnboardingStore } from '@/features/onboarding/store/onboardingStore';

const DAYS_OF_WEEK = [
    { id: 'lunes', label: 'Lunes', short: 'L' },
    { id: 'martes', label: 'Martes', short: 'M' },
    { id: 'miércoles', label: 'Miércoles', short: 'X' },
    { id: 'jueves', label: 'Jueves', short: 'J' },
    { id: 'viernes', label: 'Viernes', short: 'V' },
    { id: 'sábado', label: 'Sábado', short: 'S' },
    { id: 'domingo', label: 'Domingo', short: 'D' },
];

const TRAINING_FREQUENCY = [
    { days: 3, label: '3 días/semana', description: 'Ideal para principiantes', icon: '🌱' },
    { days: 4, label: '4 días/semana', description: 'Balance perfecto', icon: '⚖️' },
    { days: 5, label: '5 días/semana', description: 'Entrenamiento intenso', icon: '🔥' },
    { days: 6, label: '6 días/semana', description: 'Máximo rendimiento', icon: '💪' },
];

export default function TrainingDaysScreen() {
    const router = useRouter();
    const theme = useTheme();
    const { formData, setFormData } = useOnboardingStore();

    const [selectedDays, setSelectedDays] = useState<string[]>(
        formData.availableDays || []
    );
    const [selectedFrequency, setSelectedFrequency] = useState<number | null>(
        formData.trainingDaysPerWeek || null
    );

    const toggleDay = (dayId: string) => {
        setSelectedDays(prev =>
            prev.includes(dayId)
                ? prev.filter(d => d !== dayId)
                : [...prev, dayId]
        );
    };

    const handleContinue = () => {
        if (selectedDays.length === 0 || !selectedFrequency) return;

        setFormData({
            availableDays: selectedDays,
            trainingDaysPerWeek: selectedFrequency,
        });
        router.push('/onboarding/goals');
    };

    return (
        <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
            <View style={{ paddingTop: 60, paddingHorizontal: 20, paddingBottom: 10 }}>
                <ProgressBar progress={0.7} color={theme.colors.primary} style={{ height: 6, borderRadius: 3 }} />
                <Text style={{ marginTop: 10, textAlign: 'right', color: theme.colors.onSurfaceVariant }}>4 de 5</Text>
            </View>

            <ScrollView contentContainerStyle={{ padding: 24 }}>
                <Animated.View entering={FadeInDown.delay(100).duration(500)}>
                    <Text variant="headlineMedium" style={{ fontWeight: 'bold', marginBottom: 8, color: theme.colors.onBackground }}>
                        Días de Entrenamiento
                    </Text>
                    <Text variant="bodyLarge" style={{ color: theme.colors.onSurfaceVariant, marginBottom: 32 }}>
                        Selecciona cuántos días quieres entrenar y qué días tienes disponibles
                    </Text>

                    {/* Frecuencia de entrenamiento */}
                    <Text variant="titleMedium" style={{ fontWeight: 'bold', marginBottom: 12, color: theme.colors.onSurface }}>
                        ¿Cuántos días por semana?
                    </Text>
                    <View style={{ gap: 12, marginBottom: 32 }}>
                        {TRAINING_FREQUENCY.map((freq, index) => {
                            const isSelected = selectedFrequency === freq.days;
                            return (
                                <Animated.View key={freq.days} entering={FadeInDown.delay(200 + index * 50).duration(400)}>
                                    <Surface
                                        style={{
                                            borderRadius: 12,
                                            backgroundColor: isSelected ? theme.colors.primaryContainer : theme.colors.surface,
                                            borderWidth: 2,
                                            borderColor: isSelected ? theme.colors.primary : 'transparent',
                                            overflow: 'hidden',
                                        }}
                                        elevation={isSelected ? 3 : 1}
                                    >
                                        <TouchableRipple
                                            onPress={() => setSelectedFrequency(freq.days)}
                                            style={{ padding: 16 }}
                                        >
                                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                                <Text style={{ fontSize: 24, marginRight: 12 }}>{freq.icon}</Text>
                                                <View style={{ flex: 1 }}>
                                                    <Text
                                                        variant="titleSmall"
                                                        style={{
                                                            fontWeight: 'bold',
                                                            color: isSelected ? theme.colors.onPrimaryContainer : theme.colors.onSurface
                                                        }}
                                                    >
                                                        {freq.label}
                                                    </Text>
                                                    <Text
                                                        variant="bodySmall"
                                                        style={{ color: theme.colors.onSurfaceVariant }}
                                                    >
                                                        {freq.description}
                                                    </Text>
                                                </View>
                                                {isSelected && (
                                                    <Text style={{ color: theme.colors.primary, fontSize: 20, marginLeft: 8 }}>✓</Text>
                                                )}
                                            </View>
                                        </TouchableRipple>
                                    </Surface>
                                </Animated.View>
                            );
                        })}
                    </View>

                    {/* Días disponibles */}
                    <Text variant="titleMedium" style={{ fontWeight: 'bold', marginBottom: 12, color: theme.colors.onSurface }}>
                        ¿Qué días tienes disponibles?
                    </Text>
                    <View style={styles.daysContainer}>
                        {DAYS_OF_WEEK.map((day) => (
                            <Chip
                                key={day.id}
                                selected={selectedDays.includes(day.id)}
                                onPress={() => toggleDay(day.id)}
                                style={[
                                    styles.dayChip,
                                    selectedDays.includes(day.id) && {
                                        backgroundColor: theme.colors.primaryContainer,
                                    }
                                ]}
                                textStyle={{
                                    color: selectedDays.includes(day.id)
                                        ? theme.colors.onPrimaryContainer
                                        : theme.colors.onSurface,
                                    fontWeight: 'bold',
                                }}
                            >
                                {day.label}
                            </Chip>
                        ))}
                    </View>

                    {/* Resumen */}
                    {selectedDays.length > 0 && selectedFrequency && (
                        <Animated.View entering={FadeInDown.duration(300)}>
                            <Surface
                                style={{
                                    padding: 16,
                                    borderRadius: 12,
                                    marginTop: 24,
                                    backgroundColor: theme.colors.elevation.level2,
                                    borderWidth: 1,
                                    borderColor: theme.colors.outline,
                                }}
                                elevation={0}
                            >
                                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                                    <Text style={{ fontSize: 18, marginRight: 8 }}>📅</Text>
                                    <Text variant="titleSmall" style={{ fontWeight: 'bold', color: theme.colors.primary }}>
                                        Tu Plan de Entrenamiento
                                    </Text>
                                </View>
                                <Text variant="bodyMedium" style={{ color: theme.colors.onSurface }}>
                                    • {selectedFrequency} días de entrenamiento por semana
                                </Text>
                                <Text variant="bodyMedium" style={{ color: theme.colors.onSurface }}>
                                    • Días disponibles: {selectedDays.length}
                                </Text>
                                <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginTop: 8 }}>
                                    La IA generará tu rutina optimizada para estos días
                                </Text>
                            </Surface>
                        </Animated.View>
                    )}

                    {/* Botones */}
                    <View style={{ marginTop: 40, gap: 12 }}>
                        <Button
                            mode="contained"
                            onPress={handleContinue}
                            disabled={selectedDays.length === 0 || !selectedFrequency}
                            contentStyle={{ height: 50 }}
                        >
                            Continuar
                        </Button>
                        <Button
                            mode="outlined"
                            onPress={() => router.back()}
                            contentStyle={{ height: 50 }}
                        >
                            Atrás
                        </Button>
                    </View>
                </Animated.View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    daysContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    dayChip: {
        marginBottom: 4,
    },
});
