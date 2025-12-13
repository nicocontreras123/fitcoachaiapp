import { Stack } from 'expo-router';

export default function OnboardingLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="welcome" />
      <Stack.Screen name="personal-info" />
      <Stack.Screen name="sport-selection" />
      <Stack.Screen name="level-selection" />
      <Stack.Screen name="goals" />
    </Stack>
  );
}
