import { useState } from 'react';
import { View, ScrollView, StyleSheet, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { useOnboardingStore } from '@/features/onboarding/store/onboardingStore';
import { COLORS } from '@/constants/theme';
import { PrimaryButton, ProgressIndicator, SportCard } from '@/components/common';

const SPORTS = [
  {
    id: 'boxing',
    title: 'Boxeo',
    description: 'Combate de alta intensidad',
    icon: 'boxing-glove' as const,
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCH2XLqNI7kcQdBRWSTKpYpwoHLQIHWqHj3ctVsNv_mu3OrvZpLY8Wzua24JcT4Cdm90i26gLzAV009EkquUz7W-E2dMTn1QOxJ4qGGNKi1rAzzXgRJGQl5AHwLtOOSZ9Foes7W_9qHKh4keW-YqlCxf0EtUxGC09m1RaMVlZ0qLsREmoAdmuHQ8JRLhi10tE19Big9F2q_MQAiCMBhEcmm4xWv-T2WVEzJoXzzbjA_a-hdsN9iWIXa87s8VsWVio2k1_tqUFono_Y',
  },
  {
    id: 'running',
    title: 'Running',
    description: 'Cardio y resistencia',
    icon: 'run' as const,
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBcABW2jLPqNsPmGPtzFzy2a42Vlx9EN12m0xSGo9sZ2MSR4UdeSTSpJ_ZHxdjPMJlycKHySGvWNAjJnyd1t8-QtvA98nT9_pfJZQp4IJrf-TVwAGGuXUxW5uU6uucDV1P7WbsvCCHeq0F8Al9rLLXqRcwLMBsaDLYaejkPVWsOKjh4ZUN3y43epHeFnzocA2yNwkxyDj39R36fg3WpZgCKN4OepBNB9WOZrS9Cn9CtMIyldMrN0mpbWkgF4Bb_EjMCQYNAoCrvCYE',
  },
  {
    id: 'functional',
    title: 'Funcional',
    description: 'Fuerza y movilidad',
    icon: 'dumbbell' as const,
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBEi-c9CAhWxSLGtInDToFAyjfXEiBTNKOhT_sKnj0kiFTVWHmLBOhtwhUTtBU8qEYbp8ZqhHbWONBUIvANW1WqzYS_N2v-4E5Y1aw_-qyJsZrlnywByu1jYGdXqH3g77NvFW-gfBwyvMXFLGHTj9EI7neud691TeMGvkvyjYhXeKzO3uM7IXilIiPBoUGMbYfIGL-D0r2EU4V-hQrtpU2nLgdTlcV1aCkgJxIaP2SnhlNmsXbG5gGRJ9QAMefGDbWuM46GgIrnbkM',
  },
];

export default function SportSelectionScreen() {
  const router = useRouter();
  const { formData, setFormData } = useOnboardingStore();

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
    setFormData({ deportes: selectedIds });
    router.push('/onboarding/equipment');
  };

  return (
    <View style={styles.container}>
      {/* Progress Indicator */}
      <View style={styles.headerContainer}>
        <ProgressIndicator
          current={2}
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
            ¿Qué te <Text style={styles.headlineAccent}>mueve?</Text>
          </Text>
          <Text style={styles.subtitle}>
            Elige los que quieras. Adaptaremos tu plan a tu estilo de vida.
          </Text>
        </View>

        {/* Sport Cards Grid */}
        <View style={styles.grid}>
          {SPORTS.map((sport) => (
            <SportCard
              key={sport.id}
              title={sport.title}
              description={sport.description}
              icon={sport.icon}
              imageUrl={sport.imageUrl}
              isSelected={selectedIds.includes(sport.id)}
              onPress={() => toggleSport(sport.id)}
            />
          ))}
        </View>

        {/* Bottom spacer for fixed button */}
        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Fixed Bottom Button */}
      <View style={styles.bottomContainer}>
        <PrimaryButton
          onPress={handleContinue}
          icon="arrow-right"
          disabled={selectedIds.length === 0}
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
    paddingTop: 16,
    paddingBottom: 32,
  },
  headlineContainer: {
    marginBottom: 32,
  },
  headline: {
    fontSize: 32,
    fontFamily: 'Lexend_800ExtraBold',
    color: '#ffffff',
    lineHeight: 40,
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  headlineAccent: {
    color: COLORS.primary.DEFAULT,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Lexend_500Medium',
    color: '#9ca3af',
    lineHeight: 24,
  },
  grid: {
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
    // Gradient effect simulated with shadow
    shadowColor: COLORS.background.dark,
    shadowOffset: { width: 0, height: -20 },
    shadowOpacity: 1,
    shadowRadius: 30,
  },
});
