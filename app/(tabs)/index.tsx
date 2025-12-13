import React from 'react';
import { View, ScrollView, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useWorkoutStore } from '@/features/workouts/store/useWorkoutStore';
import { useUserStore } from '@/features/profile/store/userStore';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Text, Surface, TouchableRipple, useTheme, Button } from 'react-native-paper';

import { supabase } from '@/services/supabase';

export default function Dashboard() {
  const router = useRouter();
  const { currentWeeklyRoutine } = useWorkoutStore();
  const { clearUserData } = useUserStore();
  const theme = useTheme();

  const handleTestSupabase = async () => {
    try {
      const { data, error } = await supabase.auth.getSession();
      if (error) throw error;
      Alert.alert("Conexión Exitosa", "Supabase está conectado correctamente. Sesión: " + (data.session ? "Activa" : "Inactiva"));
    } catch (e: any) {
      Alert.alert("Error de Conexión", e.message);
    }
  };

  const handleTestLogin = async () => {
    try {
      const email = `test_${Math.floor(Math.random() * 1000)}@fitcoach.com`;
      const password = 'password123';

      // Try sign up first
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        // If user likely exists (or different error), try sign in
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        if (signInError) throw signInError;
        Alert.alert("Login Exitoso", `Sesión iniciada con ${signInData.user?.email}`);
        return;
      }

      Alert.alert("Registro Exitoso", `Usuario de prueba creado: ${data.user?.email}`);

    } catch (e: any) {
      Alert.alert("Error Login", e.message);
    }
  };

  const handleReset = () => {
    Alert.alert(
      "Reiniciar App",
      "¿Estás seguro? Se borrarán tus datos y volverás al inicio.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Reiniciar",
          style: "destructive",
          onPress: async () => {
            await clearUserData();
            router.replace('/');
          }
        }
      ]
    );
  };

  // Mock stats
  const weeklyKm = 12.5;
  const weeklyRounds = 45;

  // Today's workout logic (simplified)
  const today = new Date().toLocaleDateString('es-CL', { weekday: 'long' });
  const todayRoutine = currentWeeklyRoutine?.days?.[today.toLowerCase()]?.workout;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text variant="titleMedium" style={{ color: theme.colors.onSurfaceVariant }}>Bienvenido,</Text>
            <Text variant="headlineMedium" style={{ fontWeight: 'bold', color: theme.colors.onBackground }}>Atleta FitCoach</Text>
          </View>
          <Surface style={[styles.bellButton, { backgroundColor: theme.colors.surfaceVariant }]} elevation={0}>
            <MaterialCommunityIcons name="bell-outline" size={24} color={theme.colors.onSurfaceVariant} />
          </Surface>
        </View>

        {/* Workout of the Day */}
        <Surface style={styles.workoutCard} elevation={2}>
          <TouchableRipple
            onPress={() => router.push('/(tabs)/tracking')}
            style={styles.touchable}
          >
            <>
              <View style={[styles.workoutHeader, { backgroundColor: theme.colors.primary }]}>
                <View style={styles.workoutInfo}>
                  <View>
                    <Text style={{ color: theme.colors.onPrimary, fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 4 }}>Entrenamiento de Hoy</Text>
                    <Text variant="headlineSmall" style={{ color: theme.colors.onPrimary, fontWeight: 'bold', marginBottom: 8 }}>
                      {todayRoutine?.title || 'Boxeo Técnico'}
                    </Text>
                    <View style={styles.metaRow}>
                      <MaterialCommunityIcons name="clock-outline" size={20} color={theme.colors.onPrimary} />
                      <Text style={{ color: theme.colors.onPrimary, fontWeight: '600', marginLeft: 4 }}>{todayRoutine?.totalDuration || 45} min</Text>
                    </View>
                  </View>
                  <MaterialCommunityIcons name="lightning-bolt" size={48} color="rgba(255,255,255,0.4)" />
                </View>
              </View>
              <View style={[styles.workoutFooter, { backgroundColor: theme.colors.primaryContainer }]}>
                <Text style={{ color: theme.colors.onPrimaryContainer, fontWeight: 'bold' }}>Comenzar ahora</Text>
                <MaterialCommunityIcons name="arrow-right" size={24} color={theme.colors.onPrimaryContainer} />
              </View>
            </>
          </TouchableRipple>
        </Surface>

        {/* Stats Grid */}
        <Text variant="titleLarge" style={{ fontWeight: 'bold', marginBottom: 16, color: theme.colors.onBackground }}>Progreso Semanal</Text>
        <View style={styles.statsGrid}>
          <Surface style={[styles.statCard, { backgroundColor: theme.colors.surface }]} elevation={1}>
            <MaterialCommunityIcons name="shoe-print" size={24} color="#4ade80" style={{ marginBottom: 8 }} />
            <Text variant="headlineMedium" style={{ fontWeight: 'bold', color: theme.colors.onSurface }}>{weeklyKm}</Text>
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>Km Corridos</Text>
          </Surface>
          <Surface style={[styles.statCard, { backgroundColor: theme.colors.surface }]} elevation={1}>
            <MaterialCommunityIcons name="boxing-glove" size={24} color="#f87171" style={{ marginBottom: 8 }} />
            <Text variant="headlineMedium" style={{ fontWeight: 'bold', color: theme.colors.onSurface }}>{weeklyRounds}</Text>
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>Rounds</Text>
          </Surface>
        </View>

        {/* Weekly Activity Chart (Mock Visual) */}
        <Surface style={[styles.chartCard, { backgroundColor: theme.colors.surface }]} elevation={1}>
          <Text variant="titleMedium" style={{ fontWeight: 'bold', marginBottom: 16, color: theme.colors.onSurface }}>Actividad</Text>
          <View style={styles.chartContainer}>
            {[40, 60, 30, 80, 50, 90, 20].map((h, i) => (
              <View key={i} style={styles.barContainer}>
                <View style={[styles.bar, { height: `${h}%`, backgroundColor: theme.colors.primary }]} />
                <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant, marginTop: 4 }}>
                  {['L', 'M', 'M', 'J', 'V', 'S', 'D'][i]}
                </Text>
              </View>
            ))}
          </View>
        </Surface>

        {/* Reset Button */}
        <Button
          mode="outlined"
          onPress={handleReset}
          textColor={theme.colors.error}
          style={{ marginBottom: 16, borderColor: theme.colors.error }}
        >
          Reiniciar App (Data de prueba)
        </Button>

        {/* Supabase Test Button */}
        <Button
          mode="contained"
          onPress={handleTestSupabase}
          style={{ marginBottom: 16, backgroundColor: '#3b82f6' }}
        >
          Probar Conexión Supabase
        </Button>

        <Button
          mode="contained"
          onPress={handleTestLogin}
          style={{ marginBottom: 32, backgroundColor: '#10b981' }}
        >
          Login de Prueba (Test User)
        </Button>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  bellButton: {
    padding: 8,
    borderRadius: 20,
  },
  workoutCard: {
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: 32,
  },
  touchable: {
    width: '100%',
  },
  workoutHeader: {
    padding: 24,
  },
  workoutInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  workoutFooter: {
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
  },
  chartCard: {
    padding: 24,
    borderRadius: 24,
    marginBottom: 32,
  },
  chartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    height: 128,
    alignItems: 'flex-end',
  },
  barContainer: {
    alignItems: 'center',
    height: '100%',
    justifyContent: 'flex-end',
  },
  bar: {
    width: 8,
    borderRadius: 4,
  },
});
