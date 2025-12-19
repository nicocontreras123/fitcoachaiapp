import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { View, StyleSheet, Animated, Text } from 'react-native';
import { useUserStore } from '@/features/profile/store/userStore';
import { useAuth } from '@/contexts/AuthContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '@/constants/theme';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';

export default function Index() {
  const router = useRouter();
  const { hasCompletedOnboarding, isLoading } = useUserStore();
  const { user, loading: authLoading } = useAuth();

  // Animations
  const [spinAnim] = useState(new Animated.Value(0));
  const [pulseAnim] = useState(new Animated.Value(1));
  const [fadeAnim] = useState(new Animated.Value(0));
  const [dot1Anim] = useState(new Animated.Value(0));
  const [dot2Anim] = useState(new Animated.Value(0));
  const [dot3Anim] = useState(new Animated.Value(0));

  // Hide native splash screen when this component mounts
  useEffect(() => {
    const hideSplash = async () => {
      try {
        await SplashScreen.hideAsync();
      } catch (e) {
        console.warn('Error hiding splash:', e);
      }
    };

    // Small delay to ensure smooth transition
    setTimeout(hideSplash, 100);
  }, []);

  useEffect(() => {
    // Fade in animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();

    // Spin animation
    Animated.loop(
      Animated.timing(spinAnim, {
        toValue: 1,
        duration: 1500,
        useNativeDriver: true,
      })
    ).start();

    // Pulse animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.15,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Dots animation - staggered
    Animated.loop(
      Animated.stagger(200, [
        Animated.sequence([
          Animated.timing(dot1Anim, { toValue: 1, duration: 400, useNativeDriver: true }),
          Animated.timing(dot1Anim, { toValue: 0.3, duration: 400, useNativeDriver: true }),
        ]),
        Animated.sequence([
          Animated.timing(dot2Anim, { toValue: 1, duration: 400, useNativeDriver: true }),
          Animated.timing(dot2Anim, { toValue: 0.3, duration: 400, useNativeDriver: true }),
        ]),
        Animated.sequence([
          Animated.timing(dot3Anim, { toValue: 1, duration: 400, useNativeDriver: true }),
          Animated.timing(dot3Anim, { toValue: 0.3, duration: 400, useNativeDriver: true }),
        ]),
      ])
    ).start();
  }, []);

  useEffect(() => {
    if (!isLoading && !authLoading) {
      if (!user) {
        router.replace('/onboarding/welcome');
      } else if (hasCompletedOnboarding) {
        try {
          router.replace('/(tabs)');
        } catch (error) {
          console.error('❌ Navigation error:', error);
        }
      } else {
        router.replace('/onboarding/personal-info');
      }
    }
  }, [hasCompletedOnboarding, isLoading, user, authLoading, router]);

  const spin = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Background glows */}
      <Animated.View style={[styles.glow, styles.glowTop, { opacity: pulseAnim }]} />
      <Animated.View style={[styles.glow, styles.glowBottom, { opacity: pulseAnim }]} />

      {/* Content */}
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        {/* Logo and spinner */}
        <View style={styles.logoContainer}>
          {/* Outer spinning ring */}
          <Animated.View
            style={[
              styles.spinningRing,
              { transform: [{ rotate: spin }] }
            ]}
          />

          {/* Middle ring */}
          <View style={styles.middleRing} />

          {/* Pulsing icon */}
          <Animated.View
            style={[
              styles.iconContainer,
              { transform: [{ scale: pulseAnim }] }
            ]}
          >
            <MaterialCommunityIcons
              name="dumbbell"
              size={72}
              color={COLORS.primary.DEFAULT}
            />
          </Animated.View>
        </View>

        {/* App name */}
        <Text style={styles.appName}>FitCoach AI</Text>

        {/* Loading text */}
        <Text style={styles.loadingText}>
          {isLoading || authLoading ? 'Iniciando aplicación...' : 'Cargando...'}
        </Text>

        {/* Loading dots animation */}
        <View style={styles.dotsContainer}>
          <Animated.View style={[styles.dot, { opacity: dot1Anim }]} />
          <Animated.View style={[styles.dot, { opacity: dot2Anim }]} />
          <Animated.View style={[styles.dot, { opacity: dot3Anim }]} />
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#102216',
    justifyContent: 'center',
    alignItems: 'center',
  },
  glow: {
    position: 'absolute',
    width: 350,
    height: 350,
    borderRadius: 175,
    backgroundColor: `${COLORS.primary.DEFAULT}20`,
  },
  glowTop: {
    top: '-10%',
    right: '-20%',
  },
  glowBottom: {
    bottom: '-10%',
    left: '-20%',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 200,
    height: 200,
    marginBottom: 32,
  },
  spinningRing: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 4,
    borderColor: 'transparent',
    borderTopColor: COLORS.primary.DEFAULT,
    borderRightColor: COLORS.primary.DEFAULT,
  },
  middleRing: {
    position: 'absolute',
    width: 170,
    height: 170,
    borderRadius: 85,
    borderWidth: 1,
    borderColor: `${COLORS.primary.DEFAULT}30`,
  },
  iconContainer: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#1a3324',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: `${COLORS.primary.DEFAULT}50`,
    shadowColor: COLORS.primary.DEFAULT,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 25,
    elevation: 15,
  },
  appName: {
    fontSize: 36,
    fontWeight: '800',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: 1,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.primary.DEFAULT,
    textAlign: 'center',
    marginBottom: 24,
    opacity: 0.9,
  },
  dotsContainer: {
    flexDirection: 'row',
    gap: 14,
    marginTop: 8,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.primary.DEFAULT,
    shadowColor: COLORS.primary.DEFAULT,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
  },
});
