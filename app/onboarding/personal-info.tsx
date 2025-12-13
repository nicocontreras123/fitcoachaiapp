import { useState } from 'react';
import { View, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Button, TextInput, ProgressBar, Text, HelperText, useTheme } from 'react-native-paper';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useOnboardingStore } from '@/features/onboarding/store/onboardingStore';
import { personalInfoSchema } from '@/features/onboarding/schemas';

export default function PersonalInfoScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { formData, setFormData } = useOnboardingStore();

  const [name, setName] = useState(formData.name || '');
  const [age, setAge] = useState(formData.age?.toString() || '');
  const [weight, setWeight] = useState(formData.weight?.toString() || '');
  const [height, setHeight] = useState(formData.height?.toString() || '');
  const [errors, setErrors] = useState<Record<string, string>>({});

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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (error as any).errors.forEach((err: any) => {
          zodErrors[err.path[0]] = err.message;
        });
        setErrors(zodErrors);
      }
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1, backgroundColor: theme.colors.background }}
    >
      <View style={{ paddingTop: 60, paddingHorizontal: 20, paddingBottom: 10 }}>
        <ProgressBar progress={0.2} color={theme.colors.primary} style={{ height: 6, borderRadius: 3 }} />
        <Text style={{ marginTop: 10, textAlign: 'right', color: theme.colors.onSurfaceVariant }}>1 de 4</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 24 }}>
        <Animated.View entering={FadeInDown.delay(100).duration(500)}>
          <Text variant="headlineMedium" style={{ fontWeight: 'bold', marginBottom: 8, color: theme.colors.onBackground }}>
            Información Personal
          </Text>
          <Text variant="bodyLarge" style={{ color: theme.colors.onSurfaceVariant, marginBottom: 32 }}>
            Cuéntanos un poco sobre ti para personalizar tu experiencia
          </Text>

          <View style={{ marginBottom: 16 }}>
            <TextInput
              mode="outlined"
              label="Nombre"
              placeholder="Tu nombre"
              value={name}
              onChangeText={setName}
              error={!!errors.name}
              style={{ backgroundColor: theme.colors.surface }}
            />
            {errors.name && <HelperText type="error" visible={!!errors.name}>{errors.name}</HelperText>}
          </View>

          <View style={{ marginBottom: 16 }}>
            <TextInput
              mode="outlined"
              label="Edad"
              placeholder="Tu edad"
              value={age}
              onChangeText={setAge}
              keyboardType="numeric"
              error={!!errors.age}
              style={{ backgroundColor: theme.colors.surface }}
            />
            {errors.age && <HelperText type="error" visible={!!errors.age}>{errors.age}</HelperText>}
          </View>

          <View style={{ marginBottom: 16 }}>
            <TextInput
              mode="outlined"
              label="Peso (kg)"
              placeholder="Tu peso en kilogramos"
              value={weight}
              onChangeText={setWeight}
              keyboardType="decimal-pad"
              error={!!errors.weight}
              style={{ backgroundColor: theme.colors.surface }}
            />
            {errors.weight && <HelperText type="error" visible={!!errors.weight}>{errors.weight}</HelperText>}
          </View>

          <View style={{ marginBottom: 32 }}>
            <TextInput
              mode="outlined"
              label="Altura (cm)"
              placeholder="Tu altura en centímetros"
              value={height}
              onChangeText={setHeight}
              keyboardType="numeric"
              error={!!errors.height}
              style={{ backgroundColor: theme.colors.surface }}
            />
            {errors.height && <HelperText type="error" visible={!!errors.height}>{errors.height}</HelperText>}
          </View>

          <Button
            mode="contained"
            onPress={handleContinue}
            contentStyle={{ height: 50 }}
            labelStyle={{ fontSize: 16 }}
          >
            Continuar
          </Button>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
