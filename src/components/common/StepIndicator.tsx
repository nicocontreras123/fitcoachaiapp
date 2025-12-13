import { View, Text } from 'react-native';

interface StepIndicatorProps {
  currentStep: number;
  totalSteps: number;
}

export function StepIndicator({ currentStep, totalSteps }: StepIndicatorProps) {
  return (
    <View className="mb-8">
      <View className="flex-row items-center justify-between mb-2">
        {Array.from({ length: totalSteps }).map((_, index) => (
          <View key={index} className="flex-1 mx-1">
            <View
              className={`h-2 rounded-full ${
                index <= currentStep ? 'bg-primary-600' : 'bg-gray-200'
              }`}
            />
          </View>
        ))}
      </View>
      <Text className="text-center text-sm text-gray-600">
        Paso {currentStep + 1} de {totalSteps}
      </Text>
    </View>
  );
}
