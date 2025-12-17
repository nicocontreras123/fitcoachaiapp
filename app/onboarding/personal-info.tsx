import { useState } from 'react';
import { View, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, ImageBackground } from 'react-native';
import { useRouter } from 'expo-router';
import { Text } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useOnboardingStore } from '@/features/onboarding/store/onboardingStore';
import { personalInfoSchema } from '@/features/onboarding/schemas';
import { COLORS } from '@/constants/theme';
import { PrimaryButton, LabeledInput, ProgressIndicator } from '@/components/common';

export default function PersonalInfoScreen() {
  const router = useRouter();
  const { formData, setFormData } = useOnboardingStore();

  const [name, setName] = useState(formData.name || '');
  const [age, setAge] = useState(formData.age?.toString() || '');
  const [weight, setWeight] = useState(formData.weight?.toString() || '');
  const [height, setHeight] = useState(formData.height?.toString() || '');
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Form validation
  const isFormValid =
    name.trim().length >= 2 &&
    age.trim().length > 0 && parseInt(age) >= 13 && parseInt(age) <= 100 &&
    weight.trim().length > 0 && parseFloat(weight) >= 30 && parseFloat(weight) <= 300 &&
    height.trim().length > 0 && parseFloat(height) >= 80 && parseFloat(height) <= 250;

  const handleContinue = () => {
    try {
      const data = {
        name,
        age: parseInt(age),
        weight: parseFloat(weight),
        height: parseFloat(height),
      };

      personalInfoSchema.parse(data);
      setFormData(data);
      setErrors({});
      router.push('/onboarding/sport-selection');
    } catch (error) {
      if (error instanceof Error && 'errors' in error) {
        const zodErrors: Record<string, string> = {};
        (error as any).errors.forEach((err: any) => {
          zodErrors[err.path[0]] = err.message;
        });
        setErrors(zodErrors);
      }
    }
  };

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
        keyboardVerticalOffset={0}
      >
        {/* Header Image */}
        <View style={styles.headerContainer}>
          <ImageBackground
            source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDFCDV-MrRNS5dnpLryfEshOFK60tbp7JFa5iznv_IfL80iEdmbj6oUAhV96AsMcMWA8SLc_BBcpIyWRv_G7nv6G8mtpwsF6LlVhNJGxAYJkCs0Qr4FrNlpCdHp0dqiITJnigy9LTmB2OvbLjTaPPtO1-T2kCzMLuSDxpiXq5PjHAOff2N3qciTnwE9BGdYJxCuH56u7iUsXBVH5E2bkQu2Eqy79RppvkyJInH9xBHsInvo9rAqAApepTnEJeKXswC8QcgXChBAlSo' }}
            style={styles.headerImage}
            resizeMode="cover"
          >
            <LinearGradient
              colors={['transparent', COLORS.background.dark]}
              style={styles.headerGradient}
            />
          </ImageBackground>

          {/* Progress Indicator with Dots - Absolute Position */}
          <View style={styles.progressContainer}>
            <ProgressIndicator
              current={1}
              total={6}
              onBack={() => router.back()}
            />
          </View>
        </View>

        {/* Content */}
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          bounces={false}
        >
          {/* Headline */}
          <View style={styles.headlineContainer}>
            <Text style={styles.headline}>Información Personal</Text>
            <Text style={styles.subtitle}>
              Cuéntanos un poco sobre ti para personalizar tu experiencia
            </Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            {/* Name */}
            <LabeledInput
              label="Nombre"
              icon="account"
              placeholder="Ej: Alex Smith"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
              error={errors.name}
            />

            {/* Age */}
            <LabeledInput
              label="Edad"
              icon="cake"
              placeholder="Ej: 25"
              value={age}
              onChangeText={setAge}
              keyboardType="numeric"
              error={errors.age}
            />

            {/* Weight */}
            <LabeledInput
              label="Peso (kg)"
              icon="weight"
              placeholder="Ej: 70"
              value={weight}
              onChangeText={setWeight}
              keyboardType="decimal-pad"
              error={errors.weight}
            />

            {/* Height */}
            <LabeledInput
              label="Altura (cm)"
              icon="human-male-height"
              placeholder="Ej: 175"
              value={height}
              onChangeText={setHeight}
              keyboardType="numeric"
              error={errors.height}
            />

            {/* Continue Button */}
            <PrimaryButton
              onPress={handleContinue}
              icon="arrow-right"
              disabled={!isFormValid}
            >
              CONTINUAR
            </PrimaryButton>
          </View>

          {/* Extra space at bottom for keyboard */}
          <View style={styles.bottomSpacer} />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background.dark,
  },
  keyboardView: {
    flex: 1,
  },
  headerContainer: {
    height: 280,
    position: 'relative',
  },
  headerImage: {
    width: '100%',
    height: '100%',
  },
  headerGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  progressContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  content: {
    flex: 1,
    marginTop: -40,
  },
  contentContainer: {
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  headlineContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  headline: {
    fontSize: 32,
    fontFamily: 'Lexend_700Bold',
    color: '#ffffff',
    textAlign: 'center',
    lineHeight: 40,
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: 'Lexend_400Regular',
    color: '#9ca3af',
    textAlign: 'center',
    maxWidth: 320,
  },
  form: {
    gap: 16,
  },
  bottomSpacer: {
    height: 24,
  },
});
