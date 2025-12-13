import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { Text, Button, Surface, useTheme } from 'react-native-paper';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { COLORS } from '@/constants/theme';
import { Logo } from '@/components/common/Logo';

export default function WelcomeScreen() {
  const router = useRouter();
  const theme = useTheme();

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <View style={{ flex: 1, justifyContent: 'center', paddingHorizontal: 32, paddingBottom: 40 }}>
        <Animated.View entering={FadeInDown.delay(100).duration(800)} style={{ alignItems: 'center' }}>
          <Logo size="xlarge" style={{ marginBottom: 32 }} />
          <Text
            variant="headlineSmall"
            style={{
              color: theme.colors.secondary,
              marginBottom: 48,
              maxWidth: '90%',
              textAlign: 'center',
            }}
          >
            Tu entrenador personal inteligente.
          </Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(300).duration(800)} style={{ gap: 20 }}>
          <Surface
            elevation={2}
            style={{
              backgroundColor: theme.colors.surface,
              borderRadius: 12,
              padding: 16,
              borderWidth: 1,
              borderColor: theme.colors.outline
            }}
          >
            <FeatureItem icon="🥊" title="Boxeo" desc="Rutinas técnicas y combos." theme={theme} />
            <View style={{ height: 1, backgroundColor: theme.colors.outlineVariant, marginVertical: 12 }} />
            <FeatureItem icon="🏃" title="Running" desc="Tracking GPS y ritmo en vivo." theme={theme} />
            <View style={{ height: 1, backgroundColor: theme.colors.outlineVariant, marginVertical: 12 }} />
            <FeatureItem icon="🤖" title="IA Personalizada" desc="Adaptada a tu progreso." theme={theme} />
          </Surface>
        </Animated.View>
      </View>

      <Animated.View
        entering={FadeInUp.delay(600).springify()}
        style={{ paddingHorizontal: 32, paddingBottom: 60 }}
      >
        <Button
          mode="contained"
          onPress={() => router.push('/onboarding/auth')}
          contentStyle={{ height: 60 }}
          labelStyle={{ fontSize: 18, fontWeight: '700' }}
          style={{ borderRadius: 30 }}
        >
          Comenzar
        </Button>
      </Animated.View>
    </View>
  );
}

function FeatureItem({ icon, title, desc, theme }: { icon: string; title: string; desc: string; theme: any }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      <Text style={{ fontSize: 24, marginRight: 16 }}>{icon}</Text>
      <View>
        <Text variant="titleMedium" style={{ fontWeight: 'bold', color: theme.colors.onSurface }}>{title}</Text>
        <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>{desc}</Text>
      </View>
    </View>
  );
}
