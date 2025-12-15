import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '@/constants/theme';

interface FeatureChipProps {
    emoji?: string;
    icon?: keyof typeof MaterialCommunityIcons.glyphMap;
    label: string;
    style?: ViewStyle;
    textStyle?: TextStyle;
}

export const FeatureChip: React.FC<FeatureChipProps> = ({
    emoji,
    icon,
    label,
    style,
    textStyle,
}) => {
    return (
        <View style={[styles.chip, style]}>
            {emoji && <Text style={styles.emoji}>{emoji}</Text>}
            {icon && (
                <MaterialCommunityIcons
                    name={icon}
                    size={18}
                    color={COLORS.primary.DEFAULT}
                />
            )}
            <Text style={[styles.label, textStyle]}>{label}</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    chip: {
        height: 40,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingLeft: 16,
        paddingRight: 20,
        borderRadius: 9999,
        borderWidth: 1,
        borderColor: `${COLORS.primary.DEFAULT}33`, // 20% opacity
        backgroundColor: `${COLORS.primary.DEFAULT}1A`, // 10% opacity
        gap: 8,
    },
    emoji: {
        fontSize: 18,
    },
    label: {
        fontSize: 14,
        fontWeight: '500',
        color: COLORS.primary.DEFAULT,
        letterSpacing: 0.2,
    },
});
