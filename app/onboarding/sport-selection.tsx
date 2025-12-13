import { useState, useEffect } from 'react';
import { View, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Button, Text, Surface, TouchableRipple, ProgressBar, useTheme } from 'react-native-paper';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useOnboardingStore } from '@/features/onboarding/store/onboardingStore';
import { Sport } from '@/features/profile/types';

const SPORTS = [
  {
    id: 'boxing',
    title: 'Boxeo',
    description: 'Entrena con rutinas de boxeo que incluyen calentamiento, rounds, combos y cooldown',
    icon: '🥊',
  },
  {
    id: 'running',
    title: 'Running',
    description: 'Monitorea tus carreras con tracking GPS, distancia en tiempo real y notificaciones por voz',
    icon: '🏃',
  },
  {
    id: 'functional',
    title: 'Entrenamiento Funcional',
    description: 'Rutinas de fuerza, resistencia y movilidad con ejercicios funcionales',
    icon: '💪',
  },
];

export default function SportSelectionScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { formData, setFormData } = useOnboardingStore();

  // Local state to track selected sports. Initialize based on potential existing 'mixed' value
  const [selectedIds, setSelectedIds] = useState<string[]>(() => {
    if (formData.sport === 'mixed') return ['boxing', 'running'];
    if (formData.sport) return [formData.sport];
    return [];
  });

  const toggleSport = (id: string) => {
    setSelectedIds(prev => {
      if (prev.includes(id)) {
        return prev.filter(s => s !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  const handleContinue = () => {
    if (selectedIds.length === 0) return;

    // Guardar los deportes seleccionados como array
    setFormData({ deportes: selectedIds });

    // Navegar a la pantalla de equipamiento
    router.push('/onboarding/equipment');
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <View style={{ paddingTop: 60, paddingHorizontal: 20, paddingBottom: 10 }}>
        <ProgressBar progress={0.4} color={theme.colors.primary} style={{ height: 6, borderRadius: 3 }} />
        <Text style={{ marginTop: 10, textAlign: 'right', color: theme.colors.onSurfaceVariant }}>2 de 4</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 24 }}>
        <Animated.View entering={FadeInDown.delay(100).duration(500)}>
          <Text variant="headlineMedium" style={{ fontWeight: 'bold', marginBottom: 8, color: theme.colors.onBackground }}>
            Elige tu Deporte
          </Text>
          <Text variant="bodyLarge" style={{ color: theme.colors.onSurfaceVariant, marginBottom: 32 }}>
            Selecciona uno o ambos deportes para personalizar tu experiencia.
          </Text>

          <View style={{ gap: 16 }}>
            {SPORTS.map((sport, index) => {
              const isSelected = selectedIds.includes(sport.id);
              return (
                <Animated.View
                  key={sport.id}
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
                      onPress={() => toggleSport(sport.id)}
                      style={{ padding: 20 }}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Text style={{ fontSize: 32, marginRight: 16 }}>{sport.icon}</Text>
                        <View style={{ flex: 1 }}>
                          <Text variant="titleMedium" style={{ fontWeight: 'bold', marginBottom: 4, color: isSelected ? theme.colors.primary : theme.colors.onSurface }}>
                            {sport.title}
                          </Text>
                          <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, lineHeight: 20 }}>
                            {sport.description}
                          </Text>
                        </View>
                        {isSelected && (
                          <View style={{ marginLeft: 12 }}>
                            <Text style={{ color: theme.colors.primary, fontSize: 24, fontWeight: 'bold' }}>✓</Text>
                          </View>
                        )}
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
              disabled={selectedIds.length === 0}
              contentStyle={{ height: 50 }}
            >
              Continuar {selectedIds.length > 0 ? `(${selectedIds.length})` : ''}
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
