import { View, StyleSheet, Alert } from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { Text, Button, TextInput, useTheme } from 'react-native-paper';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useAuth } from '@/contexts/AuthContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Logo } from '@/components/common/Logo';
import { api } from '@/services/api';

export default function AuthScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { signInWithGoogle, signInWithEmail, signUpWithEmail } = useAuth();

  const [isLogin, setIsLogin] = useState(true);
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
        console.log('✅ Login exitoso');

        try {
          // Consultar estado del usuario
          const user: any = await api.getCurrentUser();
          console.log('User data:', user);

          // Verificar si faltan datos
          // (Ajusta estas condiciones según lo que tu backend considere perfil incompleto)
          if (!user || !user.height || !user.weight || !user.fitness_level || !user.goal) {
            // Usuario incompleto -> Completar perfil (ir a información personal)
            router.replace('/onboarding/personal-info');
          } else {
            // Usuario con datos completos -> Ir a la app
            router.replace('/(tabs)');
          }
        } catch (fetchError) {
          console.error('Error obteniendo datos del usuario:', fetchError);
          // Si falla al obtener usuario, ir al inicio del onboarding de datos
          router.replace('/onboarding/personal-info');
        }

      } else {
        await signUpWithEmail(email, password);
        console.log('✅ Registro exitoso - navegando al onboarding');

        // Navegar directamente al onboarding después del registro
        router.replace('/onboarding/personal-info');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Algo salió mal');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setLoading(true);
    try {
      await signInWithGoogle();
      console.log('✅ Google Sign In exitoso');

      // Verificar si el usuario necesita completar el onboarding
      try {
        const user: any = await api.getCurrentUser();

        if (!user || !user.height || !user.weight || !user.fitness_level || !user.goal) {
          router.replace('/onboarding/personal-info');
        } else {
          router.replace('/(tabs)');
        }
      } catch (fetchError) {
        console.error('Error obteniendo datos del usuario:', fetchError);
        router.replace('/onboarding/personal-info');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Algo salió mal con Google');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.content}>
        <Animated.View entering={FadeInDown.delay(100).duration(800)} style={{ alignItems: 'center' }}>
          <Logo size="large" style={{ marginBottom: 24 }} />
          <Text
            variant="displaySmall"
            style={{
              color: theme.colors.primary,
              marginBottom: 8,
              letterSpacing: -1,
            }}
          >
            {isLogin ? 'Bienvenido' : 'Crear Cuenta'}
          </Text>
          <Text
            variant="titleMedium"
            style={{
              color: theme.colors.secondary,
              marginBottom: 40,
              textAlign: 'center',
            }}
          >
            {isLogin
              ? 'Inicia sesión para continuar'
              : 'Regístrate para comenzar tu entrenamiento'}
          </Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(300).duration(800)} style={{ gap: 16 }}>
          <TextInput
            label="Email"
            value={email}
            onChangeText={setEmail}
            mode="outlined"
            keyboardType="email-address"
            autoCapitalize="none"
            disabled={loading}
          />
          <TextInput
            label="Contraseña"
            value={password}
            onChangeText={setPassword}
            mode="outlined"
            secureTextEntry
            autoCapitalize="none"
            disabled={loading}
          />

          <Button
            mode="contained"
            onPress={handleEmailAuth}
            loading={loading}
            disabled={loading}
            contentStyle={{ height: 56 }}
            labelStyle={{ fontSize: 16, fontWeight: '600' }}
            style={{ borderRadius: 28, marginTop: 8 }}
          >
            {isLogin ? 'Iniciar Sesión' : 'Registrarse'}
          </Button>

          <View style={styles.divider}>
            <View style={[styles.dividerLine, { backgroundColor: theme.colors.outlineVariant }]} />
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, paddingHorizontal: 16 }}>
              o continúa con
            </Text>
            <View style={[styles.dividerLine, { backgroundColor: theme.colors.outlineVariant }]} />
          </View>

          <Button
            mode="outlined"
            onPress={handleGoogleAuth}
            loading={loading}
            disabled={loading}
            contentStyle={{ height: 56 }}
            labelStyle={{ fontSize: 16, fontWeight: '600' }}
            style={{ borderRadius: 28 }}
            icon="google"
          >
            Google
          </Button>

          <Button
            mode="text"
            onPress={() => setIsLogin(!isLogin)}
            disabled={loading}
            style={{ marginTop: 16 }}
          >
            {isLogin
              ? '¿No tienes cuenta? Regístrate'
              : '¿Ya tienes cuenta? Inicia sesión'}
          </Button>
        </Animated.View>
      </View>

      <Animated.View entering={FadeInUp.delay(600).springify()} style={styles.footer}>
        <Button
          mode="text"
          onPress={() => router.back()}
          disabled={loading}
        >
          Volver
        </Button>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  footer: {
    paddingHorizontal: 32,
    paddingBottom: 40,
  },
});
