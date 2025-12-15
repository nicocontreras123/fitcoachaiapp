import React, { useMemo } from 'react';
import { View, ScrollView, StyleSheet, Text, Pressable, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useUserStore } from '@/features/profile/store/userStore';
import { useWorkoutStore } from '@/features/workouts/store/useWorkoutStore';
import { COLORS } from '@/constants/theme';

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

export default function DashboardScreen() {
  const router = useRouter();
  const { userData } = useUserStore();
  const { currentWeeklyRoutine, setCurrentWorkout, loadWeeklyRoutine } = useWorkoutStore();

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



  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.avatarContainer}>
            <Image
              source={{ uri: 'https://via.placeholder.com/40' }}
              style={styles.avatar}
            />
            <View style={styles.statusDot} />
          </View>
          <View>
            <Text style={styles.greeting}>Buenos días,</Text>
            <Text style={styles.userName}>{userData?.name || 'Usuario'}</Text>
          </View>
        </View>
        <View style={styles.streakBadge}>
          <MaterialCommunityIcons name="fire" size={20} color="#ff6b35" />
          <Text style={styles.streakText}>
            {(userData as any)?.trainingDaysPerWeek || 3} Días
          </Text>
        </View>
      </View>

      {/* Main Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Activity Chart */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Tu actividad</Text>
            <Text style={styles.seeMore}>Ver más</Text>
          </View>

          <View style={styles.chartCard}>
            <View style={styles.chartGlow} />
            <View style={styles.chartHeader}>
              <View>
                <Text style={styles.chartLabel}>Objetivo diario</Text>
                <View style={styles.chartStats}>
                  <Text style={styles.chartPercentage}>85%</Text>
                  <View style={styles.chartBadge}>
                    <Text style={styles.chartBadgeText}>+12% vs ayer</Text>
                  </View>
                </View>
              </View>
              <View style={styles.chartIcon}>
                <MaterialCommunityIcons name="chart-bar" size={24} color={COLORS.primary.DEFAULT} />
              </View>
            </View>

            {/* Placeholder for chart */}
            <View style={styles.chartPlaceholder}>
              <Text style={styles.chartPlaceholderText}>Gráfico de actividad</Text>
            </View>

            <View style={styles.chartDays}>
              {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((day, index) => (
                <Text key={index} style={[styles.dayLabel, index === 4 && styles.dayLabelActive]}>
                  {day}
                </Text>
              ))}
            </View>
          </View>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#ff6b3520' }]}>
              <MaterialCommunityIcons name="fire" size={18} color="#ff6b35" />
            </View>
            <Text style={styles.statLabel}>Calorías</Text>
            <Text style={styles.statValue}>450</Text>
            <Text style={styles.statUnit}>kcal</Text>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#3b82f620' }]}>
              <MaterialCommunityIcons name="clock-outline" size={18} color="#3b82f6" />
            </View>
            <Text style={styles.statLabel}>Tiempo</Text>
            <Text style={styles.statValue}>45</Text>
            <Text style={styles.statUnit}>min</Text>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#a855f720' }]}>
              <MaterialCommunityIcons name="map-marker" size={18} color="#a855f7" />
            </View>
            <Text style={styles.statLabel}>Distancia</Text>
            <Text style={styles.statValue}>5.2</Text>
            <Text style={styles.statUnit}>km</Text>
          </View>
        </View>

        {/* Today's Workout */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
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
                  <Text style={styles.workoutTypeText}>FUERZA</Text>
                </View>
                <View style={styles.workoutLevelBadge}>
                  <MaterialCommunityIcons name="dumbbell" size={14} color="#fff" />
                  <Text style={styles.workoutLevelText}>Intermedio</Text>
                </View>
              </View>

              <View style={styles.workoutInfo}>
                <Text style={styles.workoutTitle}>
                  {nextWorkout?.workout?.title || 'Sin rutina disponible'}
                </Text>
                <Text style={styles.workoutDescription}>
                  {nextWorkout?.workout?.description || 'Genera tu primera rutina'}
                </Text>
              </View>

              <View style={styles.workoutMeta}>
                <View style={styles.workoutMetaItem}>
                  <MaterialCommunityIcons name="timer-outline" size={18} color={COLORS.primary.DEFAULT} />
                  <Text style={styles.workoutMetaText}>45 min</Text>
                </View>
                <View style={styles.workoutMetaItem}>
                  <MaterialCommunityIcons name="lightning-bolt" size={18} color={COLORS.primary.DEFAULT} />
                  <Text style={styles.workoutMetaText}>320 kcal</Text>
                </View>
              </View>
            </View>
          </Pressable>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Acceso Rápido</Text>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.quickActions}>
            <Pressable style={styles.quickActionCard} onPress={() => router.push('/(tabs)/tracking')}>
              <View style={[styles.quickActionIcon, { backgroundColor: '#13ec5b20' }]}>
                <MaterialCommunityIcons name="run" size={24} color={COLORS.primary.DEFAULT} />
              </View>
              <Text style={styles.quickActionTitle}>Running GPS</Text>
              <Text style={styles.quickActionSubtitle}>Libre</Text>
            </Pressable>

            <Pressable style={styles.quickActionCard}>
              <View style={[styles.quickActionIcon, { backgroundColor: '#3b82f620' }]}>
                <MaterialCommunityIcons name="yoga" size={24} color="#3b82f6" />
              </View>
              <Text style={styles.quickActionTitle}>Estiramiento</Text>
              <Text style={styles.quickActionSubtitle}>10 min</Text>
            </Pressable>

            <Pressable style={styles.quickActionCard}>
              <View style={[styles.quickActionIcon, { backgroundColor: '#ef444420' }]}>
                <MaterialCommunityIcons name="timer-off-outline" size={24} color="#ef4444" />
              </View>
              <Text style={styles.quickActionTitle}>HIIT Express</Text>
              <Text style={styles.quickActionSubtitle}>15 min</Text>
            </Pressable>
          </ScrollView>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Floating Action Button */}
      <View style={styles.fabContainer}>
        <Pressable
          style={[styles.fab, !nextWorkout && styles.fabDisabled]}
          onPress={handleStartWorkout}
          disabled={!nextWorkout}
        >
          <MaterialCommunityIcons name="play" size={24} color={COLORS.background.dark} />
          <Text style={styles.fabText}>Empezar Rutina</Text>
        </Pressable>
      </View>
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
  quickActions: {
    marginTop: 12,
  },
  quickActionCard: {
    width: 144,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#182e21',
    borderWidth: 1,
    borderColor: '#23482f',
    gap: 12,
    marginRight: 16,
  },
  quickActionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickActionTitle: {
    fontSize: 14,
    fontFamily: 'Lexend_700Bold',
    color: '#fff',
  },
  quickActionSubtitle: {
    fontSize: 12,
    fontFamily: 'Lexend_400Regular',
    color: '#92c9a4',
  },
  fabContainer: {
    position: 'absolute',
    bottom: 100,
    left: 16,
    right: 16,
    zIndex: 20,
  },
  fab: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary.DEFAULT,
    height: 56,
    borderRadius: 12,
    shadowColor: COLORS.primary.DEFAULT,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 8,
    gap: 8,
  },
  fabText: {
    fontSize: 16,
    fontFamily: 'Lexend_700Bold',
    color: COLORS.background.dark,
  },
  fabDisabled: {
    backgroundColor: '#92c9a4',
    opacity: 0.5,
  },
});
