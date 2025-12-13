import { View, ScrollView } from 'react-native';
import { Text, Surface, Chip, Divider } from 'react-native-paper';
import { RunningWorkout } from '../types';
import { COLORS } from '@/constants/theme';

interface RunningWorkoutCardProps {
  workout: RunningWorkout;
}

export function RunningWorkoutCard({ workout }: RunningWorkoutCardProps) {
  const getIntervalIcon = (type: string) => {
    switch (type) {
      case 'warm-up': return '🔥';
      case 'run': return '🏃';
      case 'sprint': return '⚡';
      case 'recovery': return '💨';
      case 'cool-down': return '❄️';
      default: return '📍';
    }
  };

  const getIntervalBorderColor = (type: string) => {
    switch (type) {
      case 'warm-up': return COLORS.orange[100]; // Fallback to 100 since 200 might be missing
      case 'run': return COLORS.blue[100];
      case 'sprint': return COLORS.red[100];
      case 'recovery': return COLORS.green[100];
      case 'cool-down': return COLORS.indigo[100];
      default: return COLORS.gray[200];
    }
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: COLORS.running.surface }} contentContainerStyle={{ padding: 16, paddingBottom: 80 }}>
      {/* Header */}
      <View style={{ marginBottom: 24 }}>
        <Text variant="headlineMedium" style={{ fontWeight: 'bold', marginBottom: 8, color: COLORS.running.secondary }}>{workout.title}</Text>
        <Text variant="bodyLarge" style={{ color: COLORS.gray[600], marginBottom: 16 }}>{workout.description}</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          <Chip icon="clock-outline" style={{ backgroundColor: COLORS.white, borderColor: COLORS.running.primary }} mode="outlined" textStyle={{ color: COLORS.running.primary }}>{workout.totalDuration} min</Chip>
          <Chip icon="lightning-bolt" style={{ backgroundColor: COLORS.running.secondary }} textStyle={{ color: COLORS.white }}>{workout.difficulty}</Chip>
          <Chip icon="map-marker-distance" style={{ backgroundColor: COLORS.running.accent }} textStyle={{ color: COLORS.white }}>{workout.totalDistance} km</Chip>
          <Chip icon="speedometer" style={{ backgroundColor: COLORS.purple[100] }}>Pace: {workout.targetPace}</Chip>
        </View>
      </View>

      <Divider style={{ marginBottom: 24 }} />

      {/* Intervals */}
      <View style={{ marginBottom: 24 }}>
        <Text variant="titleLarge" style={{ fontWeight: 'bold', marginBottom: 16, color: COLORS.running.secondary }}>📍 Intervalos</Text>
        {workout.intervals.map((interval, index) => (
          <Surface
            key={index}
            style={{
              backgroundColor: COLORS.white,
              borderRadius: 12,
              padding: 16,
              marginBottom: 12,
              borderWidth: 1,
              borderColor: getIntervalBorderColor(interval.type)
            }}
            elevation={0}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
              <Text style={{ fontSize: 24, marginRight: 12 }}>{getIntervalIcon(interval.type)}</Text>
              <View style={{ flex: 1 }}>
                <Text variant="titleMedium" style={{ fontWeight: 'bold', textTransform: 'capitalize', color: COLORS.gray[900] }}>
                  {interval.type.replace('-', ' ')}
                </Text>
                <Text variant="bodySmall" style={{ fontWeight: '600', color: COLORS.gray[500] }}>
                  {interval.pace}
                </Text>
              </View>
              <Chip compact style={{ backgroundColor: COLORS.gray[100] }}>{interval.duration} min</Chip>
            </View>
            <Text variant="bodyMedium" style={{ color: COLORS.gray[700] }}>{interval.description}</Text>
          </Surface>
        ))}
      </View>

      {/* Timeline visual */}
      <Surface style={{ padding: 16, borderRadius: 12, backgroundColor: COLORS.white, marginBottom: 24, borderWidth: 1, borderColor: COLORS.gray[200] }} elevation={1}>
        <Text variant="titleMedium" style={{ fontWeight: 'bold', marginBottom: 12, color: COLORS.running.secondary }}>⏱️ Línea de Tiempo</Text>
        <View style={{ flexDirection: 'row', height: 32, borderRadius: 16, overflow: 'hidden' }}>
          {workout.intervals.map((interval, index) => {
            const widthPercent = (interval.duration / workout.totalDuration) * 100;
            let bgColor = COLORS.gray[400];
            if (interval.type === 'warm-up') bgColor = COLORS.orange[500];
            else if (interval.type === 'sprint') bgColor = COLORS.red[500];
            else if (interval.type === 'recovery') bgColor = COLORS.green[500];
            else if (interval.type === 'cool-down') bgColor = COLORS.indigo[500];
            else bgColor = COLORS.blue[500];

            return (
              <View
                key={index}
                style={{ width: `${widthPercent}%`, backgroundColor: bgColor, justifyContent: 'center', alignItems: 'center', borderRightWidth: 1, borderRightColor: 'white' }}
              >
                {widthPercent > 10 && <Text style={{ color: 'white', fontSize: 10, fontWeight: 'bold' }}>{interval.duration}'</Text>}
              </View>
            );
          })}
        </View>
      </Surface>

      {/* Tips */}
      {workout.tips && workout.tips.length > 0 && (
        <Surface style={{ padding: 16, backgroundColor: COLORS.running.primary, borderRadius: 12 }} elevation={0}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
            <Text style={{ fontSize: 20, marginRight: 8 }}>💡</Text>
            <Text variant="titleMedium" style={{ fontWeight: 'bold', color: COLORS.white }}>Consejos</Text>
          </View>
          {workout.tips.map((tip, index) => (
            <View key={index} style={{ flexDirection: 'row', marginBottom: 4 }}>
              <Text style={{ marginRight: 8, color: COLORS.white }}>•</Text>
              <Text variant="bodyMedium" style={{ color: COLORS.white, flex: 1 }}>{tip}</Text>
            </View>
          ))}
        </Surface>
      )}
    </ScrollView>
  );
}
