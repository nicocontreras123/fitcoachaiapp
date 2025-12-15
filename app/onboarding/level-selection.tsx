import { useState } from 'react';
import { View, ScrollView, StyleSheet, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { useOnboardingStore } from '@/features/onboarding/store/onboardingStore';
import { FitnessLevel } from '@/features/profile/types';
import { COLORS } from '@/constants/theme';
import { PrimaryButton, ProgressIndicator, LevelCard } from '@/components/common';

const LEVELS = [
  {
    id: 'beginner' as FitnessLevel,
    title: 'Principiante',
    subtitle: 'Estoy comenzando',
    description: 'Nuevo en el fitness o volviendo después de un descanso. Comenzaremos despacio y nos enfocaremos en la forma.',
    icon: 'account' as const,
  },
  {
    id: 'intermediate' as FitnessLevel,
    title: 'Intermedio',
    subtitle: 'Entreno 2-3 veces por semana',
    description: 'Entrenamiento consistente. Buscando mejorar resistencia y tono muscular.',
    icon: 'dumbbell' as const,
  },
  {
    id: 'advanced' as FitnessLevel,
    title: 'Avanzado',
    subtitle: 'Estoy listo para un desafío',
    description: 'Empujando límites. Se requieren intervalos de alta intensidad y movimientos complejos.',
    icon: 'lightning-bolt' as const,
  },
];

export default function LevelSelectionScreen() {
  const router = useRouter();
  const { formData, setFormData } = useOnboardingStore();

  const [selectedLevel, setSelectedLevel] = useState<FitnessLevel | null>(
    formData.fitness_level || null
  );

  const handleContinue = () => {
    if (!selectedLevel) return;
    setFormData({ fitness_level: selectedLevel });
    router.push('/onboarding/training-days');
  };

  return (
    <View style={styles.container}>
      {/* Progress Indicator */}
      <View style={styles.headerContainer}>
        <ProgressIndicator
          current={4}
          total={6}
          onBack={() => router.back()}
        />
      </View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Headline */}
        <View style={styles.headlineContainer}>
          <Text style={styles.headline}>
            Define tu{'\n'}
            <Text style={styles.headlineAccent}>Punto de Partida</Text>
          </Text>
          <Text style={styles.subtitle}>
            Adaptamos la intensidad a tu ritmo. Elige el nivel que mejor se ajuste a ti ahora.
          </Text>
        </View>

        {/* Level Cards */}
        <View style={styles.levelsList}>
          {LEVELS.map((level) => (
            <LevelCard
              key={level.id}
              title={level.title}
              subtitle={level.subtitle}
              description={level.description}
              icon={level.icon}
              isSelected={selectedLevel === level.id}
              onPress={() => setSelectedLevel(level.id)}
            />
          ))}
        </View>

        {/* Bottom spacer */}
        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Fixed Bottom Button */}
      <View style={styles.bottomContainer}>
        <PrimaryButton
          onPress={handleContinue}
          icon="arrow-right"
          disabled={!selectedLevel}
        >
          CONTINUAR
        </PrimaryButton>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background.dark,
  },
  headerContainer: {
    paddingTop: 16,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 32,
  },
  headlineContainer: {
    marginBottom: 24,
  },
  headline: {
    fontSize: 32,
    fontFamily: 'Lexend_700Bold',
    color: '#ffffff',
    lineHeight: 38,
    letterSpacing: -0.5,
    marginBottom: 12,
  },
  headlineAccent: {
    color: COLORS.primary.DEFAULT,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Lexend_400Regular',
    color: '#92c9a4',
    lineHeight: 26,
  },
  levelsList: {
    gap: 16,
  },
  bottomSpacer: {
    height: 120,
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    paddingTop: 48,
    paddingBottom: 32,
    backgroundColor: 'transparent',
    shadowColor: COLORS.background.dark,
    shadowOffset: { width: 0, height: -20 },
    shadowOpacity: 1,
    shadowRadius: 30,
  },
});
