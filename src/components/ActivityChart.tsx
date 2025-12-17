import React, { useMemo } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface ActivityChartProps {
  weeklyData: Array<{ day: string, count: number, duration: number }>;
  isLoading?: boolean;
}

export const ActivityChart: React.FC<ActivityChartProps> = ({ weeklyData, isLoading }) => {
  // Transformar weeklyData a últimos 7 días
  const daysData = useMemo(() => {
    const days = [];
    const dayLabels = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];

    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dayKey = date.toISOString().split('T')[0];
      const dayOfWeek = date.getDay();

      const dayData = weeklyData.find(w => w.day === dayKey);
      const count = dayData?.count || 0;

      days.push({
        label: dayLabels[dayOfWeek],
        count,
        hasWorkout: count > 0,
      });
    }

    return days;
  }, [weeklyData]);

  // Calcular si hay racha (días consecutivos con workout)
  const hasStreak = useMemo(() => {
    let consecutive = 0;
    for (let i = daysData.length - 1; i >= 0; i--) {
      if (daysData[i].hasWorkout) {
        consecutive++;
      } else if (consecutive > 0) {
        break;
      }
    }
    return consecutive >= 2;
  }, [daysData]);

  return (
    <View style={styles.container}>
      <View style={styles.daysContainer}>
        {daysData.map((day, index) => (
          <View key={index} style={styles.dayColumn}>
            {/* Círculo con número */}
            <View style={[
              styles.circle,
              day.hasWorkout ? styles.circleActive : styles.circleInactive
            ]}>
              {day.hasWorkout && hasStreak && index >= daysData.length - 3 && (
                <MaterialCommunityIcons
                  name="fire"
                  size={10}
                  color="#ff6b35"
                  style={styles.fireIcon}
                />
              )}
              <Text style={[
                styles.circleNumber,
                day.hasWorkout ? styles.circleNumberActive : styles.circleNumberInactive
              ]}>
                {day.count}
              </Text>
            </View>

            {/* Label del día */}
            <Text style={[
              styles.dayLabel,
              day.hasWorkout && styles.dayLabelActive
            ]}>
              {day.label}
            </Text>
          </View>
        ))}
      </View>

      {hasStreak && (
        <View style={styles.streakBadge}>
          <MaterialCommunityIcons name="fire" size={14} color="#ff6b35" />
          <Text style={styles.streakText}>
            ¡Racha activa!
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 16,
    marginBottom: 8,
  },
  daysContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  dayColumn: {
    alignItems: 'center',
    gap: 8,
  },
  circle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    position: 'relative',
  },
  circleActive: {
    backgroundColor: '#13ec5b',
    borderColor: '#13ec5b',
  },
  circleInactive: {
    backgroundColor: 'transparent',
    borderColor: '#2d4a37',
  },
  fireIcon: {
    position: 'absolute',
    top: -2,
    right: -2,
  },
  circleNumber: {
    fontSize: 16,
    fontFamily: 'Lexend_700Bold',
  },
  circleNumberActive: {
    color: '#102216',
  },
  circleNumberInactive: {
    color: '#4a5f52',
  },
  dayLabel: {
    fontSize: 11,
    fontFamily: 'Lexend_600SemiBold',
    color: '#4a5f52',
    textTransform: 'uppercase',
  },
  dayLabelActive: {
    color: '#13ec5b',
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 12,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#ff6b3520',
    borderRadius: 12,
    alignSelf: 'center',
  },
  streakText: {
    fontSize: 12,
    fontFamily: 'Lexend_600SemiBold',
    color: '#ff6b35',
  },
});
