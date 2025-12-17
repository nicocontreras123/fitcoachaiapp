import React, { useMemo, useState, useCallback } from 'react';
import { View, ScrollView, StyleSheet, Text, Pressable, Image, ActivityIndicator, RefreshControl } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useUserStore } from '@/features/profile/store/userStore';
import { useWorkoutStore } from '@/features/workouts/store/useWorkoutStore';
import { COLORS } from '@/constants/theme';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { ActivityChart } from '@/components/ActivityChart';
import AsyncStorage from '@react-native-async-storage/async-storage';

const DAY_MAP: Record<string, string> = {
  'monday': 'lunes',
  'tuesday': 'martes',
  'wednesday': 'miércoles',
  'thursday': 'jueves',
  'friday': 'viernes',
  'saturday': 'sábado',
  'sunday': 'domingo',
};

const REVERSE_DAY_MAP: Record<string, string> = {
  'lunes': 'monday',
  'martes': 'tuesday',
  'miércoles': 'wednesday',
  'jueves': 'thursday',
  'viernes': 'friday',
  'sábado': 'saturday',
  'domingo': 'sunday',
};

const WORKOUT_LABELS: Record<string, string> = {
  'boxing': 'BOXEO',
  'running': 'CARDIO',
  'gym': 'FUERZA',
  'recovery': 'RECUPERACIÓN',
};

export default function DashboardScreen() {
  const router = useRouter();
  const { userData } = useUserStore();
  const { currentWeeklyRoutine, setCurrentWorkout, loadWeeklyRoutine } = useWorkoutStore();

  // Dashboard stats hook
  const {
    todayWorkouts,
    todayDuration,
    todayCalories,
    todayDistance,
    dailyGoalPercentage,
    vsYesterday,
    currentStreak,
    weeklyData,
    isLoading: statsLoading,
    refresh: refreshStats,
  } = useDashboardStats();

  // Refresh state
  const [refreshing, setRefreshing] = useState(false);

  // Helpers
  const formatDuration = (seconds: number) => Math.floor(seconds / 60);
  const formatDistance = (meters: number) => (meters / 1000).toFixed(1);

  // Handle pull-to-refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refreshStats(), loadWeeklyRoutine()]);
    setRefreshing(false);
  };

  // Check for workout completion flag when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      const checkWorkoutCompletion = async () => {
        try {
          const workoutCompleted = await AsyncStorage.getItem('workout_just_completed');
          if (workoutCompleted === 'true') {
            console.log('🔄 Workout completed, refreshing dashboard stats...');
            // Clear the flag
            await AsyncStorage.removeItem('workout_just_completed');
            // Refresh stats
            await refreshStats();
          }
        } catch (error) {
          console.error('Error checking workout completion:', error);
        }
      };

      checkWorkoutCompletion();
    }, [refreshStats])
  );

  // Cargar rutina al montar el componente
  React.useEffect(() => {
    if (!currentWeeklyRoutine) {
      loadWeeklyRoutine();
    }
  }, []);

  // Find next available workout
  const nextWorkout = useMemo(() => {
    try {
      if (!currentWeeklyRoutine?.days) {
        return null;
      }

      const today = new Date().toLocaleDateString('es-CL', { weekday: 'long' }).toLowerCase();
      const daysOfWeek = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'];

      // Find today's index
      const todayIndex = daysOfWeek.indexOf(today);

      // Check from today onwards
      for (let i = 0; i < 7; i++) {
        const dayIndex = (todayIndex + i) % 7;
        const dayName = daysOfWeek[dayIndex];
        const dayData = currentWeeklyRoutine.days[dayName];

        if (dayData && !dayData.restDay && dayData.workout) {
          return {
            dayName,
            dayKey: REVERSE_DAY_MAP[dayName] || dayName,
            ...dayData,
          };
        }
      }

      return null;
    } catch (error) {
      console.error('[Dashboard] Error finding next workout:', error);
      return null;
    }
  }, [currentWeeklyRoutine]);

  const handleStartWorkout = () => {
    if (nextWorkout?.workout) {
      setCurrentWorkout(nextWorkout.workout);
      router.push('/(tabs)/tracking');
    }
  };

  const handleGoToRoutines = () => {
    router.push('/(tabs)/rutinas');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.avatarContainer}>
            {userData?.photoUrl ? (
              <Image
                source={{ uri: userData.photoUrl }}
                style={styles.avatar}
              />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <MaterialCommunityIcons name="account" size={24} color={COLORS.primary.DEFAULT} />
              </View>
            )}
            <View style={styles.statusDot} />
          </View>
          <View>
            <Text style={styles.greeting}>
              {(() => {
                const hour = new Date().getHours();
                if (hour >= 6 && hour < 12) return 'Buenos días,';
                if (hour >= 12 && hour < 20) return 'Buenas tardes,';
                return 'Buenas noches,';
              })()}
            </Text>
            <Text style={styles.userName}>{userData?.name || 'Usuario'}</Text>
          </View>
        </View>
        <View style={styles.streakBadge}>
          <MaterialCommunityIcons name="fire" size={20} color="#ff6b35" />
          <Text style={styles.streakText}>
            {statsLoading ? '...' : `${currentStreak} Días`}
          </Text>
        </View>
      </View>

      {/* Main Content */}
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={COLORS.primary.DEFAULT}
          />
        }
      >
        {/* Activity Chart */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Tu actividad</Text>
            {/* Opcion Ver mas eliminada */}
          </View>

          <View style={styles.chartCard}>
            <View style={styles.chartGlow} />
            <View style={styles.chartHeader}>
              <View>
                <Text style={styles.chartLabel}>Objetivo diario</Text>
                <View style={styles.chartStats}>
                  {statsLoading ? (
                    <ActivityIndicator size="small" color={COLORS.primary.DEFAULT} />
                  ) : (
                    <>
                      <Text style={styles.chartPercentage}>
                        {Math.round(dailyGoalPercentage)}%
                      </Text>
                      {vsYesterday.workouts !== 0 && (
                        <View style={styles.chartBadge}>
                          <Text style={styles.chartBadgeText}>
                            {vsYesterday.workouts > 0 ? '+' : ''}{vsYesterday.workouts}% vs ayer
                          </Text>
                        </View>
                      )}
                    </>
                  )}
                </View>
              </View>
              <View style={styles.chartIcon}>
                <MaterialCommunityIcons name="chart-bar" size={24} color={COLORS.primary.DEFAULT} />
              </View>
            </View>

            {/* Activity Chart */}
            {statsLoading ? (
              <View style={styles.chartPlaceholder}>
                <ActivityIndicator size="small" color={COLORS.primary.DEFAULT} />
              </View>
            ) : (
              <ActivityChart weeklyData={weeklyData} />
            )}

            {/* Labels manuales eliminados para evitar duplicidad y desalinear */}
          </View>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#ff6b3520' }]}>
              <MaterialCommunityIcons name="fire" size={18} color="#ff6b35" />
            </View>
            <Text style={styles.statLabel}>Calorías</Text>
            {statsLoading ? (
              <ActivityIndicator size="small" color="#ff6b35" />
            ) : (
              <>
                <Text style={styles.statValue}>{todayCalories}</Text>
                <Text style={styles.statUnit}>kcal</Text>
              </>
            )}
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#3b82f620' }]}>
              <MaterialCommunityIcons name="clock-outline" size={18} color="#3b82f6" />
            </View>
            <Text style={styles.statLabel}>Tiempo</Text>
            {statsLoading ? (
              <ActivityIndicator size="small" color="#3b82f6" />
            ) : (
              <>
                <Text style={styles.statValue}>{formatDuration(todayDuration)}</Text>
                <Text style={styles.statUnit}>min</Text>
              </>
            )}
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#a855f720' }]}>
              <MaterialCommunityIcons name="map-marker" size={18} color="#a855f7" />
            </View>
            <Text style={styles.statLabel}>Distancia</Text>
            {statsLoading ? (
              <ActivityIndicator size="small" color="#a855f7" />
            ) : (
              <>
                <Text style={styles.statValue}>
                  {todayDistance > 0 ? formatDistance(todayDistance) : '-'}
                </Text>
                <Text style={styles.statUnit}>km</Text>
              </>
            )}
          </View>
        </View>

        {/* Today's Workout */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { marginBottom: 24 }]}>
            {nextWorkout ? `Tu plan para ${nextWorkout.dayName}` : 'Tu plan para hoy'}
          </Text>

          <Pressable style={styles.workoutCard} onPress={handleStartWorkout}>
            <Image
              source={{ uri: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800' }}
              style={styles.workoutImage}
            />
            <LinearGradient
              colors={['transparent', 'rgba(16,34,22,0.8)', COLORS.background.dark]}
              style={styles.workoutGradient}
            />

            <View style={styles.workoutContent}>
              <View style={styles.workoutBadges}>
                <View style={styles.workoutTypeBadge}>
                  <Text style={styles.workoutTypeText}>
                    {(nextWorkout?.workout as any)?.type ? WORKOUT_LABELS[(nextWorkout?.workout as any).type] || 'FUERZA' : 'FUERZA'}
                  </Text>
                </View>
                <View style={styles.workoutLevelBadge}>
                  <MaterialCommunityIcons name="dumbbell" size={14} color="#fff" />
                  <Text style={styles.workoutLevelText}>
                    {nextWorkout?.workout?.difficulty === 'advanced' ? 'Avanzado' :
                      nextWorkout?.workout?.difficulty === 'beginner' ? 'Principiante' : 'Intermedio'}
                  </Text>
                </View>
              </View>

              <View style={styles.workoutInfo}>
                <Text style={styles.workoutTitle}>
                  {nextWorkout?.workout?.title || ((nextWorkout?.workout as any)?.type ? WORKOUT_LABELS[(nextWorkout?.workout as any).type] : 'Entrenamiento personalizado')}
                </Text>
                <Text style={styles.workoutDescription}>
                  {nextWorkout?.workout?.description || 'Genera tu primera rutina en la sección de Rutinas'}
                </Text>
              </View>

              <View style={styles.workoutMeta}>
                <View style={styles.workoutMetaItem}>
                  <MaterialCommunityIcons name="timer-outline" size={18} color={COLORS.primary.DEFAULT} />
                  <Text style={styles.workoutMetaText}>{nextWorkout?.workout?.totalDuration || 45} min</Text>
                </View>
                <View style={styles.workoutMetaItem}>
                  <MaterialCommunityIcons name="lightning-bolt" size={18} color={COLORS.primary.DEFAULT} />
                  <Text style={styles.workoutMetaText}>{Math.round((nextWorkout?.workout?.totalDuration || 45) * 8)} kcal</Text>
                </View>
              </View>
            </View>
          </Pressable>
        </View>

        {/* Quick Actions Hidden 
        <View style={styles.section}>
            ...
        </View>
        */}

        <View style={{ height: 24 }} />

        {/* Static Action Button Hidden
        <Pressable
          style={styles.staticFab}
          onPress={handleGoToRoutines}
        >
          <MaterialCommunityIcons name="calendar-check" size={24} color={COLORS.background.dark} />
          <Text style={styles.fabText}>Ir a Rutinas</Text>
        </Pressable>
        */}

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background.dark,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#23482f',
    backgroundColor: `${COLORS.background.dark}F2`,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: `${COLORS.primary.DEFAULT}80`,
  },
  avatarPlaceholder: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.primary.DEFAULT,
    borderWidth: 2,
    borderColor: COLORS.background.dark,
  },
  greeting: {
    fontSize: 12,
    fontFamily: 'Lexend_500Medium',
    color: '#92c9a4',
  },
  userName: {
    fontSize: 18,
    fontFamily: 'Lexend_700Bold',
    color: '#fff',
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#23482f80',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: `${COLORS.primary.DEFAULT}33`,
  },
  streakText: {
    fontSize: 14,
    fontFamily: 'Lexend_700Bold',
    color: COLORS.primary.DEFAULT,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  section: {
    marginTop: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 24,
    fontFamily: 'Lexend_700Bold',
    color: '#fff',
  },
  seeMore: {
    fontSize: 14,
    fontFamily: 'Lexend_600SemiBold',
    color: COLORS.primary.DEFAULT,
  },
  chartCard: {
    backgroundColor: '#182e21',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#23482f',
    position: 'relative',
    overflow: 'hidden',
  },
  chartGlow: {
    position: 'absolute',
    top: -40,
    right: -40,
    width: 128,
    height: 128,
    backgroundColor: `${COLORS.primary.DEFAULT}0D`,
    borderRadius: 64,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
    zIndex: 10,
  },
  chartLabel: {
    fontSize: 14,
    fontFamily: 'Lexend_500Medium',
    color: '#92c9a4',
    marginBottom: 4,
  },
  chartStats: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  chartPercentage: {
    fontSize: 36,
    fontFamily: 'Lexend_700Bold',
    color: '#fff',
  },
  chartBadge: {
    backgroundColor: `${COLORS.primary.DEFAULT}1A`,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  chartBadgeText: {
    fontSize: 12,
    fontFamily: 'Lexend_700Bold',
    color: COLORS.primary.DEFAULT,
  },
  chartIcon: {
    backgroundColor: '#23482f',
    padding: 8,
    borderRadius: 8,
  },
  chartPlaceholder: {
    height: 128,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  chartPlaceholderText: {
    fontSize: 14,
    fontFamily: 'Lexend_400Regular',
    color: '#92c9a4',
  },
  chartDays: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dayLabel: {
    fontSize: 12,
    fontFamily: 'Lexend_600SemiBold',
    color: '#92c9a4',
    textTransform: 'uppercase',
  },
  dayLabelActive: {
    color: '#fff',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#182e21',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#23482f',
    gap: 8,
  },
  statIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    fontFamily: 'Lexend_500Medium',
    color: '#92c9a4',
  },
  statValue: {
    fontSize: 18,
    fontFamily: 'Lexend_700Bold',
    color: '#fff',
  },
  statUnit: {
    fontSize: 12,
    fontFamily: 'Lexend_400Regular',
    color: '#92c9a4',
  },
  workoutCard: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#23482f',
    position: 'relative',
    height: 280,
  },
  workoutImage: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.4,
  },
  workoutGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  workoutContent: {
    flex: 1,
    padding: 20,
    justifyContent: 'space-between',
    zIndex: 10,
  },
  workoutBadges: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  workoutTypeBadge: {
    backgroundColor: COLORS.primary.DEFAULT,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  workoutTypeText: {
    fontSize: 12,
    fontFamily: 'Lexend_700Bold',
    color: COLORS.background.dark,
    letterSpacing: 1,
  },
  workoutLevelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.4)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  workoutLevelText: {
    fontSize: 12,
    fontFamily: 'Lexend_500Medium',
    color: '#fff',
  },
  workoutInfo: {
    gap: 4,
  },
  workoutTitle: {
    fontSize: 20,
    fontFamily: 'Lexend_700Bold',
    color: '#fff',
  },
  workoutDescription: {
    fontSize: 14,
    fontFamily: 'Lexend_400Regular',
    color: '#92c9a4',
    lineHeight: 20,
  },
  workoutMeta: {
    flexDirection: 'row',
    gap: 16,
  },
  workoutMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  workoutMetaText: {
    fontSize: 14,
    fontFamily: 'Lexend_500Medium',
    color: '#fff',
  },
  // quickActions y fabContainer eliminados/ocultos implicitamente o explicitamente

  staticFab: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary.DEFAULT,
    height: 56,
    borderRadius: 12,
    gap: 8,
    marginTop: 24,
    marginBottom: 8,
  },
  fabText: {
    fontSize: 16,
    fontFamily: 'Lexend_700Bold',
    color: COLORS.background.dark,
  },
});
