import { useState } from 'react';
import { View, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Button, Text, Surface, TouchableRipple, ProgressBar, useTheme } from 'react-native-paper';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useOnboardingStore } from '@/features/onboarding/store/onboardingStore';
import { FitnessLevel } from '@/features/profile/types';

const LEVELS = [
  {
    id: 'beginner' as FitnessLevel,
    title: 'Principiante',
    description: 'Estoy comenzando o tengo menos de 6 meses de experiencia',
    icon: '🌱',
  },
  {
    id: 'intermediate' as FitnessLevel,
    title: 'Intermedio',
    description: 'Tengo entre 6 meses y 2 años de experiencia regular',
    icon: '💪',
  },
  {
    id: 'advanced' as FitnessLevel,
    title: 'Avanzado',
    description: 'Tengo más de 2 años de experiencia y entreno regularmente',
    icon: '🔥',
  },
];

export default function LevelSelectionScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { formData, setFormData } = useOnboardingStore();
  const [selectedLevel, setSelectedLevel] = useState<FitnessLevel | null>(formData.level || null);

  const handleContinue = () => {
    if (!selectedLevel) return;

    setFormData({ level: selectedLevel });
    router.push('/onboarding/training-days');
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <View style={{ paddingTop: 60, paddingHorizontal: 20, paddingBottom: 10 }}>
        <ProgressBar progress={0.6} color={theme.colors.primary} style={{ height: 6, borderRadius: 3 }} />
        <Text style={{ marginTop: 10, textAlign: 'right', color: theme.colors.onSurfaceVariant }}>3 de 4</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 24 }}>
        <Animated.View entering={FadeInDown.delay(100).duration(500)}>
          <Text variant="headlineMedium" style={{ fontWeight: 'bold', marginBottom: 8, color: theme.colors.onBackground }}>
            Tu Nivel de Fitness
          </Text>
          <Text variant="bodyLarge" style={{ color: theme.colors.onSurfaceVariant, marginBottom: 32 }}>
            Esto nos ayuda a adaptar las rutinas a tu experiencia
          </Text>

          <View style={{ gap: 16 }}>
            {LEVELS.map((level, index) => {
              const isSelected = selectedLevel === level.id;
              return (
                <Animated.View
                  key={level.id}
                  entering={FadeInDown.delay(200 + index * 100).duration(500)}
                >
                  <Surface
                    style={{
                      borderRadius: 16,
                      backgroundColor: isSelected ? theme.colors.elevation.level2 : theme.colors.surface,
                      borderWidth: 2,
                      borderColor: isSelected ? theme.colors.primary : 'transparent',
                      overflow: 'hidden',
                    }}
                    elevation={isSelected ? 4 : 1}
                  >
                    <TouchableRipple
                      onPress={() => setSelectedLevel(level.id)}
                      style={{ padding: 20 }}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                        <Text style={{ fontSize: 32, marginRight: 16 }}>{level.icon}</Text>
                        <View style={{ flex: 1 }}>
                          <Text variant="titleMedium" style={{ fontWeight: 'bold', marginBottom: 4, color: isSelected ? theme.colors.primary : theme.colors.onSurface }}>
                            {level.title}
                          </Text>
                          <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, lineHeight: 20 }}>
                            {level.description}
                          </Text>
                        </View>
                      </View>
                    </TouchableRipple>
                  </Surface>
                </Animated.View>
              );
            })}
          </View>

          <View style={{ marginTop: 40, gap: 12 }}>
            <Button
              mode="contained"
              onPress={handleContinue}
              disabled={!selectedLevel}
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
