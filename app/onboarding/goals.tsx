import { useState } from 'react';
import { View, ScrollView, StyleSheet, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { useOnboardingStore } from '@/features/onboarding/store/onboardingStore';
import { COLORS } from '@/constants/theme';
import { PrimaryButton, ProgressIndicator, GoalCard } from '@/components/common';

const GOALS = [
  {
    id: 'lose-weight',
    title: 'Perder Peso',
    description: 'Quemar grasa y adelgazar',
    icon: 'scale-bathroom' as const,
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA7ZZlg4tQZg61dN0sbAjhThKNql9CrVdkrnIUj4VmmCq7F2SvnS0fkIEKA1PVOAegbliR4NraazDjBmtb5FV3sqAoRWGp5Gw4zXmsyDam2lXlymO7FPA-fVI6h986l3KB-uwXPHI5xIiUZEy7gD51NChNAiX0NcwcwRzz4beLK-fBsBrhU1Da7ZNJDkZpsIfgEa0TYJHS7lQHqOloiIOKdmRuZrZMGxoPbMhewu9O6lvsOpZdZIBSjdqDO9P4eZj2oD27RNKrbq9Q',
  },
  {
    id: 'build-muscle',
    title: 'Desarrollar Músculo',
    description: 'Ganar masa y fuerza',
    icon: 'dumbbell' as const,
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAwOH1iFjZuzbZLX5MopcgwSA-ZmJdZ2IS8CnnkT-bEsX2w787uFapzS3wo4hWjQ166M3nc4_TLHuaNAtP1w4J9_RtG_R9ZCgGob-KOuK4Url7arOfYR0vSXQJyYNYf0Gt4bq4qOcT7lAsyqG0D_Cqet6Bn6a1u3HLZhmtX_kKcVlt3mUFOEEoH2etE3NmcHE0FvuV1XFzZEmsCea7AkV6TT1x9MKCd7ZKu7oVkXhSp0heDmR6jGHFIu5-lInupzZW90zxUo7ifpf0',
  },
  {
    id: 'improve-endurance',
    title: 'Mejorar Resistencia',
    description: 'Correr más lejos, más tiempo',
    icon: 'run' as const,
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAoLx2fgP9-pT8U1Df1ZpYuci8Q-O436Ix5m4jgKHvzNKKHew_4kxeHCm6pUic7c6i5mK80KMwQ03l8X0cLOld6f2lPGQtkui3frDQVzfwEVOTXmyLCm6Y5zHKTr7w3A7GuidhGlOc4SNcFnSEPcoXXho0h0c8gXx4TQewZAbxZYWp_sMOEbvOBr50oSleuxKLDJNVQcGO6GYhdC66O32sElkYZaCQuptxtegjsronk5Nau_KPZihhb0p7GlsiAofQ7QLWombKPlP8',
  },
  {
    id: 'get-toned',
    title: 'Tonificar',
    description: 'Definir tu cuerpo',
    icon: 'yoga' as const,
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBZ6HQs1Ccu3_jmBTPpTjPPusxUSEOeADv_HpXBLRiaclsfaTmNn0V9TrrJLYajhc3kyq8z4O-Ytm2K39GcWhFx2ynEV3qsXWmoReuQGCFRX2LJPq5wxQVQTTj4N-WhrR9atx8wVML0DmS7Cu15fHJoCxJejQdoR4YyAnzQAxWo1IPrJsv-Au8Bq6NOz4bEN2Nk8Lq13ZiSKxJ_7Qca-zJPX-LXWrJ8DVwOYVWH2z84FyRyAqbJeThVGEvgMnCOugyZ5tqITNZ3H6Y',
  },
];

export default function GoalsScreen() {
  const router = useRouter();
  const { formData, setFormData } = useOnboardingStore();

  const [selectedGoal, setSelectedGoal] = useState<string | null>(
    formData.goals?.[0] || null
  );

  const handleContinue = () => {
    if (!selectedGoal) return;
    setFormData({ goals: [selectedGoal] });
    router.push('/onboarding/loading');
  };

  return (
    <View style={styles.container}>
      {/* Progress Indicator */}
      <View style={styles.headerContainer}>
        <ProgressIndicator
          current={6}
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
            Establece tu{' '}
            <Text style={styles.headlineAccent}>objetivo</Text>
          </Text>
          <Text style={styles.subtitle}>
            Selecciona tu enfoque principal para comenzar tu plan personalizado. Adaptaremos la dificultad a ti.
          </Text>
        </View>

        {/* Goals Grid */}
        <View style={styles.grid}>
          {GOALS.map((goal) => (
            <View key={goal.id} style={styles.gridItem}>
              <GoalCard
                title={goal.title}
                description={goal.description}
                icon={goal.icon}
                imageUrl={goal.imageUrl}
                isSelected={selectedGoal === goal.id}
                onPress={() => setSelectedGoal(goal.id)}
              />
            </View>
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
          disabled={!selectedGoal}
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
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 32,
  },
  headlineContainer: {
    marginBottom: 24,
  },
  headline: {
    fontSize: 32,
    fontFamily: 'Lexend_800ExtraBold',
    color: '#ffffff',
    lineHeight: 40,
    letterSpacing: -0.5,
    marginBottom: 12,
  },
  headlineAccent: {
    color: COLORS.primary.DEFAULT,
    textShadowColor: 'rgba(19,236,91,0.25)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 15,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Lexend_500Medium',
    color: '#9ca3af',
    lineHeight: 24,
    maxWidth: 400,
  },
  grid: {
    gap: 16,
  },
  gridItem: {
    width: '100%',
  },
  bottomSpacer: {
    height: 120,
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 32,
    backgroundColor: 'transparent',
    shadowColor: COLORS.background.dark,
    shadowOffset: { width: 0, height: -20 },
    shadowOpacity: 1,
    shadowRadius: 30,
  },
});
