import React, { useState } from 'react';
import { View, TextInput, StyleSheet, TextInputProps, Pressable, Text } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '@/constants/theme';

interface LabeledInputProps extends TextInputProps {
    label: string;
    icon?: keyof typeof MaterialCommunityIcons.glyphMap;
    isPassword?: boolean;
    error?: string;
}

export const LabeledInput: React.FC<LabeledInputProps> = ({
    label,
    icon,
    isPassword = false,
    error,
    ...props
}) => {
    const [isFocused, setIsFocused] = useState(false);
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);

    return (
        <View style={styles.container}>
            {/* Label */}
            <Text style={styles.label}>{label}</Text>

            {/* Input Container */}
            <View style={styles.inputContainer}>
                {/* Icon */}
                {icon && (
                    <View style={styles.iconContainer}>
                        <MaterialCommunityIcons
                            name={icon}
                            size={20}
                            color={isFocused ? COLORS.primary.DEFAULT : '#6b7280'}
                        />
                    </View>
                )}

                {/* Input */}
                <TextInput
                    {...props}
                    style={[
                        styles.input,
                        icon && styles.inputWithIcon,
                        isPassword && styles.inputWithPassword,
                        isFocused && styles.inputFocused,
                        error && styles.inputError,
                        props.style,
                    ]}
                    placeholderTextColor="#4b5563"
                    onFocus={(e) => {
                        setIsFocused(true);
                        props.onFocus?.(e);
                    }}
                    onBlur={(e) => {
                        setIsFocused(false);
                        props.onBlur?.(e);
                    }}
                    secureTextEntry={isPassword && !isPasswordVisible}
                />

                {/* Password Toggle */}
                {isPassword && (
                    <Pressable
                        style={styles.passwordToggle}
                        onPress={() => setIsPasswordVisible(!isPasswordVisible)}
                    >
                        <MaterialCommunityIcons
                            name={isPasswordVisible ? 'eye' : 'eye-off'}
                            size={20}
                            color="#6b7280"
                        />
                    </Pressable>
                )}
            </View>

            {/* Error Message */}
            {error && <Text style={styles.errorText}>{error}</Text>}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: '100%',
    },
    label: {
        fontSize: 14,
        fontFamily: 'Lexend_500Medium',
        color: '#ffffff',
        marginBottom: 8,
    },
    inputContainer: {
        position: 'relative',
        width: '100%',
    },
    iconContainer: {
        position: 'absolute',
        left: 16,
        top: 0,
        bottom: 0,
        justifyContent: 'center',
        zIndex: 1,
    },
    input: {
        width: '100%',
        height: 56,
        paddingHorizontal: 16,
        backgroundColor: '#1a3a28', // Verde oscuro más claro que surface.input
        borderWidth: 0,
        borderRadius: 12,
        color: '#ffffff',
        fontSize: 14,
        fontFamily: 'Lexend_400Regular',
    },
    inputWithIcon: {
        paddingLeft: 48,
    },
    inputWithPassword: {
        paddingRight: 48,
    },
    inputFocused: {
        borderWidth: 1,
        borderColor: COLORS.primary.DEFAULT,
    },
    inputError: {
        borderColor: '#ef4444',
    },
    passwordToggle: {
        position: 'absolute',
        right: 16,
        top: 0,
        bottom: 0,
        justifyContent: 'center',
    },
    errorText: {
        fontSize: 12,
        fontFamily: 'Lexend_400Regular',
        color: '#ef4444',
        marginTop: 4,
    },
});
