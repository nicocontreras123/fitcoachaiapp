import React, { useState } from 'react';
import { View, TextInput, StyleSheet, TextInputProps, Pressable } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '@/constants/theme';

interface PrimaryInputProps extends TextInputProps {
    icon?: keyof typeof MaterialCommunityIcons.glyphMap;
    isPassword?: boolean;
}

export const PrimaryInput: React.FC<PrimaryInputProps> = ({
    icon,
    isPassword = false,
    ...props
}) => {
    const [isFocused, setIsFocused] = useState(false);
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);

    return (
        <View style={styles.container}>
            {/* Icon */}
            {icon && (
                <View style={styles.iconContainer}>
                    <MaterialCommunityIcons
                        name={icon}
                        size={20}
                        color={isFocused ? COLORS.primary.DEFAULT : '#9ca3af'}
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
                    props.style,
                ]}
                placeholderTextColor="#6b7280"
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
                        color="#9ca3af"
                    />
                </Pressable>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'relative',
        width: '100%',
    },
    iconContainer: {
        position: 'absolute',
        left: 12,
        top: 0,
        bottom: 0,
        justifyContent: 'center',
        zIndex: 1,
    },
    input: {
        width: '100%',
        height: 56,
        paddingHorizontal: 12,
        backgroundColor: COLORS.surface.input,
        borderWidth: 1,
        borderColor: COLORS.surface.dark,
        borderRadius: 12,
        color: '#ffffff',
        fontSize: 14,
        fontWeight: '500',
    },
    inputWithIcon: {
        paddingLeft: 40,
    },
    inputWithPassword: {
        paddingRight: 40,
    },
    inputFocused: {
        borderColor: COLORS.primary.DEFAULT,
        borderWidth: 1,
    },
    passwordToggle: {
        position: 'absolute',
        right: 12,
        top: 0,
        bottom: 0,
        justifyContent: 'center',
    },
});
