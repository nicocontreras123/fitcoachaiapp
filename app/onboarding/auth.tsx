import { View, StyleSheet, Alert, ImageBackground, ScrollView, Pressable, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { Text } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/services/api';
import { COLORS } from '@/constants/theme';
import { PrimaryButton, SecondaryButton, PrimaryInput } from '@/components/common';

export default function AuthScreen() {
  const router = useRouter();
  const { signInWithGoogle, signInWithEmail, signUpWithEmail, isGoogleAuthAvailable } = useAuth();

  const [isLogin, setIsLogin] = useState(false); // Default to Sign Up
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleEmailAuth = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Por favor completa todos los campos');
      return;
    }


    setLoading(true);
    try {
      if (isLogin) {

        await signInWithEmail(email, password);


        try {
          const user: any = await api.getCurrentUser();

          // Verificar si completó el onboarding
          if (user && user.hasCompletedOnboarding) {

            router.replace('/(tabs)');
          } else {

            router.replace('/onboarding/personal-info');
          }
        } catch (fetchError) {
          console.error('❌ Error obteniendo datos del usuario:', fetchError);
          router.replace('/onboarding/personal-info');
        }

      } else {

        await signUpWithEmail(email, password);

        await router.replace('/onboarding/personal-info');
      }
    } catch (error: any) {
      console.error('❌ Error en autenticación:', error.message);
      Alert.alert('Error', error.message || 'Algo salió mal');
    } finally {
      setLoading(false);

    }
  };

  const handleGoogleAuth = async () => {

    setLoading(true);
    try {
      await signInWithGoogle();


      try {
        const user: any = await api.getCurrentUser();

        // Verificar si completó el onboarding
        if (user && user.hasCompletedOnboarding) {

          router.replace('/(tabs)');
        } else {

          router.replace('/onboarding/personal-info');
        }
      } catch (fetchError) {
        console.error('❌ Error obteniendo datos del usuario:', fetchError);
        router.replace('/onboarding/personal-info');
      }
    } catch (error: any) {
      console.error('❌ Error con Google:', error.message);
      Alert.alert('Error', error.message || 'Algo salió mal con Google');
    } finally {
      setLoading(false);

    }
  };

  return (
    <View style={styles.container}>
      {/* Header Image with Logo */}
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

        {/* Logo Badge */}
        <View style={styles.logoBadge}>
          <MaterialCommunityIcons name="lightning-bolt" size={28} color={COLORS.primary.DEFAULT} />
        </View>
      </View>

      {/* KeyboardAvoidingView wrapping ScrollView */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          bounces={false}
        >
          {/* Headline */}
          <View style={styles.headlineContainer}>
            <Text style={styles.headline}>Potencia tu Entrenamiento</Text>
            <Text style={styles.subtitle}>
              Registra entrenamientos, corre con GPS y alcanza tus metas.
            </Text>
          </View>

          {/* Segmented Control */}
          <View style={styles.segmentedControl}>
            <Pressable
              style={[styles.segment, !isLogin && styles.segmentActive]}
              onPress={() => setIsLogin(false)}
            >
              <Text style={[styles.segmentText, !isLogin && styles.segmentTextActive]}>
                Registrarse
              </Text>
            </Pressable>
            <Pressable
              style={[styles.segment, isLogin && styles.segmentActive]}
              onPress={() => setIsLogin(true)}
            >
              <Text style={[styles.segmentText, isLogin && styles.segmentTextActive]}>
                Iniciar Sesión
              </Text>
            </Pressable>
          </View>

          {/* Form */}
          <View style={styles.form}>
            {/* Email */}
            <PrimaryInput
              icon="email"
              placeholder="Correo electrónico"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            {/* Password */}
            <PrimaryInput
              icon="lock"
              placeholder="Contraseña"
              value={password}
              onChangeText={setPassword}
              isPassword
              autoCapitalize="none"
            />

            {/* Main Action Button */}
            {loading ? (
              <View style={styles.loadingButton}>
                <ActivityIndicator size="small" color={COLORS.background.dark} />
                <Text style={styles.loadingButtonText}>
                  {isLogin ? 'Iniciando sesión...' : 'Creando cuenta...'}
                </Text>
              </View>
            ) : (
              <PrimaryButton
                onPress={handleEmailAuth}
                icon="arrow-right"
                disabled={loading}
              >
                {isLogin ? 'INICIAR SESIÓN' : 'CREAR CUENTA'}
              </PrimaryButton>
            )}
          </View>

          {/* Divider - Only show if Google Auth is available */}
          {isGoogleAuthAvailable && (
            <>
              <View style={styles.dividerContainer}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>O CONTINÚA CON</Text>
                <View style={styles.dividerLine} />
              </View>

              {/* Google Button */}
              <SecondaryButton
                onPress={handleGoogleAuth}
                googleIcon
                disabled={loading}
              >
                Google
              </SecondaryButton>
            </>
          )}

          {/* Bottom spacer */}
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
  logoBadge: {
    position: 'absolute',
    top: 48,
    alignSelf: 'center',
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: `${COLORS.primary.DEFAULT}33`,
    borderWidth: 1,
    borderColor: `${COLORS.primary.DEFAULT}4D`,
    justifyContent: 'center',
    alignItems: 'center',
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
    marginBottom: 24,
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
  },
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface.dark,
    borderRadius: 12,
    padding: 4,
    height: 48,
    marginBottom: 24,
  },
  segment: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  segmentActive: {
    backgroundColor: COLORS.primary.DEFAULT,
  },
  segmentText: {
    fontSize: 14,
    fontFamily: 'Lexend_500Medium',
    color: '#9ca3af',
  },
  segmentTextActive: {
    color: '#000000',
  },
  form: {
    gap: 16,
    marginBottom: 24,
  },
  loadingButton: {
    height: 56,
    borderRadius: 12,
    backgroundColor: COLORS.primary.DEFAULT,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    shadowColor: COLORS.primary.DEFAULT,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 8,
  },
  loadingButtonText: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
    color: COLORS.background.dark,
    textTransform: 'uppercase',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.surface.dark,
  },
  dividerText: {
    fontSize: 12,
    fontFamily: 'Lexend_500Medium',
    color: '#6b7280',
    marginHorizontal: 12,
  },
  bottomSpacer: {
    height: 24,
  },
});
