import { View, StyleSheet, ImageBackground, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Text } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '@/constants/theme';
import { PrimaryButton } from '@/components/common/PrimaryButton';
import { FeatureChip } from '@/components/common/FeatureChip';
import { useFonts, Lexend_300Light, Lexend_400Regular, Lexend_500Medium, Lexend_600SemiBold, Lexend_700Bold, Lexend_800ExtraBold } from '@expo-google-fonts/lexend';
import { useEffect } from 'react';
import * as SplashScreen from 'expo-splash-screen';

// Keep splash screen visible while fonts load
SplashScreen.preventAutoHideAsync();

export default function WelcomeScreen() {
  const router = useRouter();

  const [fontsLoaded] = useFonts({
    Lexend_300Light,
    Lexend_400Regular,
    Lexend_500Medium,
    Lexend_600SemiBold,
    Lexend_700Bold,
    Lexend_800ExtraBold,
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <View style={styles.container}>
      {/* Background Image with Gradient Overlay */}
      <ImageBackground
        source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDyMjJmdyBV36-yOV009CXq9CqpgNdsS9LBUQdHUtMb66B-63hbr2-74-Ms2uCKGLs4qKPLlIxrGfK-IUF1WHK2eV6DiJhkX176XoXZfd4_fwVZl7P62TvXqaQfsrkyODKCazVEoWDhR3uNNB6iuZ1SaiNKzdqd6fkpVlTNoT7vEHJlI52wAyG1530X5cAJ4O-mlkLBIu6krbqkqR8gWdGCIvICffk_cJdojLseL0PGtYp52_Yot4y64FAJE58XisRjrmLxuCaZQGw' }}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        {/* Gradient Overlays */}
        <LinearGradient
          colors={['rgba(16, 34, 22, 0.3)', 'rgba(16, 34, 22, 1)']}
          style={styles.gradientOverlay}
        />
        <LinearGradient
          colors={['rgba(16, 34, 22, 0.8)', 'transparent']}
          style={styles.topGradient}
        />
      </ImageBackground>

      {/* Content */}
      <View style={styles.content}>
        {/* Logo */}
        <View style={styles.logoContainer}>
          <Image
            source={require('../../assets/fitcoach_logo.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
        </View>

        {/* Bottom Section */}
        <View style={styles.bottomSection}>
          {/* Headline */}
          <View style={styles.headlineContainer}>
            <Text style={styles.headline}>
              Tu entrenador{'\n'}
              <Text style={styles.headlineAccent}>personal con IA</Text>
            </Text>
            <Text style={styles.subtitle}>
              Entrena más inteligente con rutinas personalizadas de boxeo, running y gimnasio.
              Seguimiento GPS en tiempo real, asistente de voz y planes adaptados a tus objetivos.
            </Text>
          </View>

          {/* Feature Chips */}
          <View style={styles.chipsContainer}>
            <FeatureChip emoji="🥊" label="Boxeo & Funcional" />
            <FeatureChip emoji="🏃" label="Running GPS" />
            <FeatureChip icon="robot" label="IA Personalizada" />
            <FeatureChip emoji="🎯" label="Seguimiento" />
            <FeatureChip emoji="🎤" label="Asistente de Voz" />
          </View>

          {/* Spacer */}
          <View style={styles.spacer} />

          {/* Primary Button */}
          <View style={styles.buttonContainer}>
            <PrimaryButton
              onPress={() => router.push('/onboarding/auth')}
              icon="arrow-right"
            >
              COMENZAR
            </PrimaryButton>
          </View>

          {/* Secondary Action */}
          <Text style={styles.secondaryAction}>
            ¿Ya tienes cuenta?{' '}
            <Text
              style={styles.loginLink}
              onPress={() => router.push('/onboarding/auth?mode=login')}
            >
              Inicia sesión
            </Text>
          </Text>

          {/* Bottom spacing for iOS Home Indicator */}
          <View style={styles.bottomSpacer} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background.dark,
  },
  backgroundImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  gradientOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  topGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 128,
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 48,
    paddingBottom: 32,
  },
  logoContainer: {
    alignItems: 'center',
    paddingTop: 32,
  },
  logoImage: {
    width: 120,
    height: 120,
  },
  bottomSection: {
    alignItems: 'center',
    gap: 16,
  },
  headlineContainer: {
    alignItems: 'center',
  },
  headline: {
    fontSize: 40,
    fontFamily: 'Lexend_800ExtraBold',
    color: '#ffffff',
    textAlign: 'center',
    lineHeight: 48,
    letterSpacing: -0.5,
    textShadowColor: `${COLORS.primary.DEFAULT}4D`,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
    marginBottom: 12,
  },
  headlineAccent: {
    color: COLORS.primary.DEFAULT,
  },
  subtitle: {
    fontSize: 18,
    fontFamily: 'Lexend_300Light',
    color: '#d1d5db',
    textAlign: 'center',
    lineHeight: 28,
    maxWidth: 320,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
  },
  spacer: {
    height: 8,
  },
  buttonContainer: {
    width: '100%',
    maxWidth: 384,
  },
  secondaryAction: {
    fontSize: 14,
    fontFamily: 'Lexend_500Medium',
    color: '#9ca3af',
    textAlign: 'center',
  },
  loginLink: {
    color: '#ffffff',
    textDecorationLine: 'underline',
    textDecorationColor: COLORS.primary.DEFAULT,
    textDecorationStyle: 'solid',
  },
  bottomSpacer: {
    height: 80,
  },
});
