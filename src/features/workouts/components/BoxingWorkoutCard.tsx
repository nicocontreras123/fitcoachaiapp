import { View, ScrollView } from 'react-native';
import { Text, Surface, Chip, Divider } from 'react-native-paper';
import { BoxingWorkout } from '../types';
import { COLORS } from '@/constants/theme';

interface BoxingWorkoutCardProps {
  workout: BoxingWorkout;
}

export function BoxingWorkoutCard({ workout }: BoxingWorkoutCardProps) {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: COLORS.boxing.surface }} contentContainerStyle={{ padding: 16, paddingBottom: 80 }}>
      {/* Header */}
      <View style={{ marginBottom: 24 }}>
        <Text variant="headlineMedium" style={{ fontWeight: 'bold', marginBottom: 8, color: COLORS.boxing.secondary }}>
          {workout.title}
        </Text>
        <Text variant="bodyLarge" style={{ color: COLORS.gray[700], marginBottom: 16 }}>
          {workout.description}
        </Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Chip icon="clock-outline" style={{ backgroundColor: COLORS.white, borderColor: COLORS.boxing.primary }} textStyle={{ color: COLORS.boxing.primary }} mode="outlined">
            {workout.totalDuration} min
          </Chip>
          <Chip icon="lightning-bolt" style={{ backgroundColor: COLORS.boxing.secondary }} textStyle={{ color: COLORS.boxing.accent }}>
            {workout.difficulty}
          </Chip>
        </View>
      </View>

      <Divider style={{ marginBottom: 24 }} />

      {/* Warmup */}
      <Section title="🔥 Calentamiento" titleColor={COLORS.boxing.secondary}>
        {workout.warmup.map((exercise, index) => (
          <ExerciseItem
            key={index}
            name={exercise.name}
            duration={formatTime(exercise.duration)}
            description={exercise.description}
            technique={exercise.technique}
            color={COLORS.white}
            borderColor={COLORS.orange[200]}
            textColor={COLORS.boxing.secondary}
          />
        ))}
      </Section>

      {/* Rounds */}
      <Section title="🥊 Rounds" titleColor={COLORS.boxing.primary}>
        {workout.rounds.map(round => (
          <Surface
            key={round.roundNumber}
            style={{ marginBottom: 16, borderRadius: 12, backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.gray[200] }}
            elevation={2}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, borderBottomWidth: 1, borderBottomColor: COLORS.gray[100], backgroundColor: COLORS.gray[50], borderTopLeftRadius: 12, borderTopRightRadius: 12 }}>
              <Text variant="titleMedium" style={{ fontWeight: 'bold', color: COLORS.boxing.secondary }}>Round {round.roundNumber}</Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <Chip compact textStyle={{ fontSize: 10, height: 14, lineHeight: 14, color: COLORS.white }} style={{ height: 24, backgroundColor: COLORS.green[500] }}>
                  Work: {formatTime(round.workTime)}
                </Chip>
                <Chip compact textStyle={{ fontSize: 10, height: 14, lineHeight: 14, color: COLORS.white }} style={{ height: 24, backgroundColor: COLORS.boxing.primary }}>
                  Rest: {formatTime(round.restTime)}
                </Chip>
              </View>
            </View>

            <View style={{ padding: 12 }}>
              {round.exercises.map((exercise, index) => (
                <View key={index} style={{ marginBottom: 12 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                    <Text variant="titleSmall" style={{ fontWeight: '600', color: COLORS.gray[900] }}>{exercise.name}</Text>
                    <Text variant="labelMedium" style={{ color: COLORS.boxing.primary, fontWeight: 'bold' }}>{formatTime(exercise.duration)}</Text>
                  </View>
                  <Text variant="bodySmall" style={{ color: COLORS.gray[600] }}>{exercise.description}</Text>
                  {exercise.technique && (
                    <Text variant="bodySmall" style={{ color: COLORS.boxing.accent, marginTop: 4, fontStyle: 'italic', fontWeight: '500' }}>
                      💡 {exercise.technique}
                    </Text>
                  )}
                </View>
              ))}
            </View>
          </Surface>
        ))}
      </Section>

      {/* Cooldown */}
      <Section title="❄️ Enfriamiento" titleColor={COLORS.blue[700]}>
        {workout.cooldown.map((exercise, index) => (
          <ExerciseItem
            key={index}
            name={exercise.name}
            duration={formatTime(exercise.duration)}
            description={exercise.description}
            color={COLORS.blue[50]}
            borderColor={COLORS.blue[200]}
            textColor={COLORS.blue[700]}
          />
        ))}
      </Section>

      {/* Equipment */}
      {workout.equipment && workout.equipment.length > 0 && (
        <View style={{ marginBottom: 24 }}>
          <Text variant="titleLarge" style={{ fontWeight: 'bold', marginBottom: 12, color: COLORS.boxing.secondary }}>🎒 Equipamiento</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {workout.equipment.map((item, index) => (
              <Chip key={index} style={{ backgroundColor: COLORS.gray[100] }}>{item}</Chip>
            ))}
          </View>
        </View>
      )}

      {/* Tips */}
      {workout.tips && workout.tips.length > 0 && (
        <Surface style={{ padding: 16, backgroundColor: COLORS.gray[900], borderRadius: 12 }} elevation={0}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
            <Text style={{ fontSize: 20, marginRight: 8 }}>💡</Text>
            <Text variant="titleMedium" style={{ fontWeight: 'bold', color: COLORS.boxing.accent }}>Consejos de Coach</Text>
          </View>
          {workout.tips.map((tip, index) => (
            <View key={index} style={{ flexDirection: 'row', marginBottom: 4 }}>
              <Text style={{ marginRight: 8, color: COLORS.boxing.accent }}>•</Text>
              <Text variant="bodyMedium" style={{ color: COLORS.gray[100], flex: 1 }}>{tip}</Text>
            </View>
          ))}
        </Surface>
      )}
    </ScrollView>
  );
}

function Section({ title, children, titleColor }: { title: string; children: React.ReactNode; titleColor?: string }) {
  return (
    <View style={{ marginBottom: 24 }}>
      <Text variant="titleLarge" style={{ fontWeight: 'bold', marginBottom: 12, color: titleColor }}>{title}</Text>
      {children}
    </View>
  );
}

function ExerciseItem({ name, duration, description, technique, color, borderColor, textColor }: any) {
  return (
    <Surface style={{ backgroundColor: color, borderRadius: 12, padding: 16, marginBottom: 8, borderWidth: 1, borderColor }} elevation={0}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
        <Text variant="titleMedium" style={{ fontWeight: '600', flex: 1, marginRight: 8, color: textColor || COLORS.gray[900] }}>{name}</Text>
        <Text variant="labelLarge" style={{ fontWeight: 'bold', color: textColor || COLORS.gray[900] }}>{duration}</Text>
      </View>
      <Text variant="bodyMedium" style={{ color: COLORS.gray[700] }}>{description}</Text>
      {technique && (
        <Text variant="bodySmall" style={{ marginTop: 4, color: COLORS.primary[700], fontStyle: 'italic' }}>
          💡 {technique}
        </Text>
      )}
    </Surface>
  );
}
