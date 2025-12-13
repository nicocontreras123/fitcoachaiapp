import { View, Text, TextInput, TextInputProps } from 'react-native';

interface InputProps extends TextInputProps {
  label: string;
  error?: string;
  helperText?: string;
}

export function Input({ label, error, helperText, ...props }: InputProps) {
  return (
    <View className="mb-4">
      <Text className="text-base font-semibold text-gray-700 mb-2">{label}</Text>
      <TextInput
        className={`bg-white border-2 ${
          error ? 'border-red-500' : 'border-gray-200'
        } rounded-xl px-4 py-3 text-base text-gray-900`}
        placeholderTextColor="#9ca3af"
        {...props}
      />
      {error && <Text className="text-red-500 text-sm mt-1">{error}</Text>}
      {helperText && !error && <Text className="text-gray-500 text-sm mt-1">{helperText}</Text>}
    </View>
  );
}
