import { TouchableOpacity, Text, View } from 'react-native';

interface SelectCardProps {
  title: string;
  description: string;
  icon: string;
  isSelected: boolean;
  onPress: () => void;
}

export function SelectCard({ title, description, icon, isSelected, onPress }: SelectCardProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      className={`bg-white border-2 ${
        isSelected ? 'border-primary-600 bg-primary-50' : 'border-gray-200'
      } rounded-2xl p-6 mb-4`}
    >
      <View className="flex-row items-center mb-3">
        <Text className="text-4xl mr-3">{icon}</Text>
        <Text className="text-xl font-bold text-gray-900 flex-1">{title}</Text>
        {isSelected && <Text className="text-2xl">✓</Text>}
      </View>
      <Text className="text-gray-600">{description}</Text>
    </TouchableOpacity>
  );
}
