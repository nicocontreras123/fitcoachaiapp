import { useState } from 'react';
import {
  View,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Button, Text, TextInput, Surface, ProgressBar, HelperText, useTheme, Chip } from 'react-native-paper';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useOnboardingStore } from '@/features/onboarding/store/onboardingStore';
import { useUserStore } from '@/features/profile/store/userStore';
import { useWorkoutStore } from '@/features/workouts/store/useWorkoutStore';
import { goalsSchema } from '@/features/onboarding/schemas';
import { UserData } from '@/features/profile/types';
import { WorkoutLoading } from '@/features/workouts/components/WorkoutLoading';
import { getDaysToGenerate } from '@/utils/dateUtils';

// Objetivos predefinidos
const PREDEFINED_GOALS = [
  { id: 'weight-loss', label: 'Perder peso', icon: '🔥' },
  { id: 'muscle-gain', label: 'Ganar músculo', icon: '💪' },
  { id: 'endurance', label: 'Mejorar resistencia', icon: '🏃' },
  { id: 'strength', label: 'Aumentar fuerza', icon: '🏋️' },
  { id: 'technique', label: 'Mejorar técnica', icon: '🥊' },
  { id: 'flexibility', label: 'Ganar flexibilidad', icon: '🧘' },
  { id: 'health', label: 'Salud general', icon: '❤️' },
  { id: 'competition', label: 'Preparar competencia', icon: '🏆' },
  { id: 'stress', label: 'Reducir estrés', icon: '😌' },
  { id: 'energy', label: 'Más energía', icon: '⚡' },
];

export default function GoalsScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { formData, resetOnboarding } = useOnboardingStore();
  const { completeOnboarding, userData } = useUserStore();
  const { generateWeeklyRoutine } = useWorkoutStore();

  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const [customGoals, setCustomGoals] = useState(formData.goals || '');
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeneratingRoutine, setIsGeneratingRoutine] = useState(false);

  const toggleGoal = (goalId: string) => {
    setSelectedGoals(prev =>
      prev.includes(goalId)
        ? prev.filter(id => id !== goalId)
        : [...prev, goalId]
    );
    setError('');
  };

  const handleComplete = async () => {
    try {
      setIsSubmitting(true);

      // Combinar objetivos seleccionados con objetivos personalizados
      const selectedGoalsText = selectedGoals
        .map(id => PREDEFINED_GOALS.find(g => g.id === id)?.label)
        .filter(Boolean)
        .join(', ');

      const finalGoals = [selectedGoalsText, customGoals]
        .filter(Boolean)
        .join('. ');

      if (!finalGoals.trim()) {
        setError('Selecciona al menos un objetivo o escribe uno personalizado');
        setIsSubmitting(false);
        return;
      }

      goalsSchema.parse({ goals: finalGoals });

      // Determinar el deporte principal para compatibilidad
      const mainSport = formData.deportes?.[0] || formData.sport || 'boxing';

      const newUserData: UserData = {
        name: formData.name!,
        age: formData.age!,
        weight: formData.weight!,
        height: formData.height!,
        sport: mainSport as any,
        deportes: formData.deportes,
        equipment: formData.equipment,
        availableDays: formData.availableDays,
        trainingDaysPerWeek: formData.trainingDaysPerWeek,
        level: formData.level!,
        goals: finalGoals,
        hasCompletedOnboarding: true,
      };

      // Completar onboarding
      console.log('✅ Completando onboarding');
      await completeOnboarding(newUserData);
      console.log('✅ Onboarding completado');

      // Mostrar pantalla de carga
      setIsSubmitting(false);
      setIsGeneratingRoutine(true);

      // Calcular días a generar (solo días restantes de esta semana)
      const userAvailableDays = formData.availableDays || ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'];
      const { days: daysToGenerate, weekStarting } = getDaysToGenerate(userAvailableDays, true);

      console.log('📅 Generando rutina para:', daysToGenerate);
      console.log('📅 Semana iniciando:', weekStarting);

      try {
        await generateWeeklyRoutine({
          userProfile: newUserData,
          goals: finalGoals,
          level: newUserData.level,
          availableDays: daysToGenerate,
          sport: mainSport as any,
        });

        // Esperar un momento para que se vea la animación
        await new Promise(resolve => setTimeout(resolve, 1500));

        // Resetear y redirigir
        resetOnboarding();
        router.replace('/(tabs)');
      } catch (routineError) {
        console.error('Error generating routine:', routineError);
        Alert.alert('Error', 'No se pudo generar la rutina. Puedes generarla desde la pantalla de Rutinas.');
        resetOnboarding();
        router.replace('/(tabs)');
      }
    } catch (err) {
      if (err instanceof Error && 'errors' in err) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setError((err as any).errors[0]?.message || 'Error al guardar');
      } else {
        Alert.alert('Error', 'No se pudo completar el onboarding. Intenta de nuevo.');
      }
      setIsSubmitting(false);
      setIsGeneratingRoutine(false);
    }
  };

  // Mostrar pantalla de carga mientras genera la rutina
  if (isGeneratingRoutine) {
    const sportType = formData.deportes && formData.deportes.length > 1
      ? 'mixed'
      : (formData.deportes?.[0] as any) || 'general';

    return <WorkoutLoading sport={sportType} />;
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1, backgroundColor: theme.colors.background }}
    >
      <View style={{ paddingTop: 60, paddingHorizontal: 20, paddingBottom: 10 }}>
        <ProgressBar progress={1.0} color={theme.colors.primary} style={{ height: 6, borderRadius: 3 }} />
        <Text style={{ marginTop: 10, textAlign: 'right', color: theme.colors.onSurfaceVariant }}>5 de 5</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 24 }}>
        <Animated.View entering={FadeInDown.delay(100).duration(500)}>
          <Text variant="headlineMedium" style={{ fontWeight: 'bold', marginBottom: 8, color: theme.colors.onBackground }}>
            Tus Objetivos
          </Text>
          <Text variant="bodyLarge" style={{ color: theme.colors.onSurfaceVariant, marginBottom: 32 }}>
            ¿Qué esperas lograr con tus entrenamientos?
          </Text>

          {/* Objetivos Predefinidos */}
          <View style={{ marginBottom: 24 }}>
            <Text variant="titleMedium" style={{ marginBottom: 12, fontWeight: 'bold', color: theme.colors.onSurface }}>
              Selecciona tus objetivos
            </Text>
            <View style={styles.chipsContainer}>
              {PREDEFINED_GOALS.map((goal) => (
                <Chip
                  key={goal.id}
                  selected={selectedGoals.includes(goal.id)}
                  onPress={() => toggleGoal(goal.id)}
                  style={[
                    styles.chip,
                    selectedGoals.includes(goal.id) && {
                      backgroundColor: theme.colors.primaryContainer,
                    }
                  ]}
                  textStyle={{
                    color: selectedGoals.includes(goal.id)
                      ? theme.colors.onPrimaryContainer
                      : theme.colors.onSurface,
                  }}
                  icon={() => <Text style={{ fontSize: 16 }}>{goal.icon}</Text>}
                >
                  {goal.label}
                </Chip>
              ))}
            </View>
          </View>

          {/* Botón para mostrar campo personalizado */}
          <Button
            mode="outlined"
            onPress={() => setShowCustomInput(!showCustomInput)}
            icon={showCustomInput ? "chevron-up" : "chevron-down"}
            style={{ marginBottom: 16 }}
          >
            {showCustomInput ? 'Ocultar objetivos personalizados' : 'Agregar objetivos personalizados'}
          </Button>

          {/* Campo de texto personalizado */}
          {showCustomInput && (
            <Animated.View entering={FadeInDown.duration(300)} style={{ marginBottom: 24 }}>
              <Text variant="titleMedium" style={{ marginBottom: 8, fontWeight: 'bold', color: theme.colors.onSurface }}>
                Objetivos específicos (opcional)
              </Text>
              <TextInput
                mode="outlined"
                placeholder="Ej: Quiero prepararme para una competencia en 3 meses, mejorar mi velocidad de golpeo..."
                value={customGoals}
                onChangeText={text => {
                  setCustomGoals(text);
                  setError('');
                }}
                multiline
                numberOfLines={4}
                error={!!error}
                style={{ backgroundColor: theme.colors.surface, minHeight: 100 }}
              />
              <Text style={{ textAlign: 'right', color: theme.colors.onSurfaceVariant, marginTop: 4, fontSize: 12 }}>
                {customGoals.length}/500 caracteres
              </Text>
            </Animated.View>
          )}

          {/* Error message */}
          {error && <HelperText type="error" visible={!!error} style={{ marginBottom: 16 }}>{error}</HelperText>}

          {/* Resumen de objetivos seleccionados */}
          {selectedGoals.length > 0 && (
            <Surface
              style={{
                padding: 16,
                borderRadius: 12,
                marginBottom: 24,
                backgroundColor: theme.colors.primaryContainer,
                borderWidth: 1,
                borderColor: theme.colors.primary,
              }}
              elevation={0}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                <Text style={{ fontSize: 18, marginRight: 8 }}>🎯</Text>
                <Text variant="titleSmall" style={{ fontWeight: 'bold', color: theme.colors.onPrimaryContainer }}>
                  Objetivos seleccionados: {selectedGoals.length}
                </Text>
              </View>
              <Text variant="bodyMedium" style={{ color: theme.colors.onPrimaryContainer }}>
                {selectedGoals
                  .map(id => PREDEFINED_GOALS.find(g => g.id === id)?.label)
                  .join(', ')}
              </Text>
            </Surface>
          )}

          {/* Consejo */}
          <Surface
            style={{
              padding: 16,
              borderRadius: 12,
              marginBottom: 32,
              backgroundColor: theme.colors.elevation.level2,
              borderWidth: 1,
              borderColor: theme.colors.outline,
            }}
            elevation={0}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
              <Text style={{ fontSize: 18, marginRight: 8 }}>💡</Text>
              <Text variant="titleSmall" style={{ fontWeight: 'bold', color: theme.colors.primary }}>
                Consejo
              </Text>
            </View>
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurface }}>
              Selecciona los objetivos que mejor se adapten a ti. Puedes agregar detalles específicos en el campo personalizado para rutinas más precisas.
            </Text>
          </Surface>

          {/* Botones de acción */}
          <View style={{ gap: 12 }}>
            <Button
              mode="contained"
              onPress={handleComplete}
              loading={isSubmitting}
              disabled={isSubmitting}
              contentStyle={{ height: 50 }}
            >
              Completar
            </Button>
            <Button
              mode="outlined"
              onPress={() => router.back()}
              disabled={isSubmitting}
              contentStyle={{ height: 50 }}
            >
              Atrás
            </Button>
          </View>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    marginBottom: 4,
  },
});
