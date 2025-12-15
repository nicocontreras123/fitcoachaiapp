import React from 'react';
import { Pressable, StyleSheet, View, Text } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '@/constants/theme';

interface LevelCardProps {
    title: string;
    subtitle: string;
    description: string;
    icon: keyof typeof MaterialCommunityIcons.glyphMap;
    isSelected: boolean;
    onPress: () => void;
}

export const LevelCard: React.FC<LevelCardProps> = ({
    title,
    subtitle,
    description,
    icon,
    isSelected,
    onPress,
}) => {
    return (
        <Pressable
            onPress={onPress}
            style={[
                styles.card,
                isSelected && styles.cardSelected,
            ]}
        >
            <View style={styles.header}>
                <View style={styles.leftContent}>
                    {/* Icon */}
                    <View style={[styles.iconContainer, isSelected && styles.iconContainerSelected]}>
                        <MaterialCommunityIcons
                            name={icon}
                            size={28}
                            color={isSelected ? COLORS.primary.DEFAULT : '#d1d5db'}
                        />
                    </View>

                    {/* Text */}
                    <View style={styles.textContainer}>
                        <Text style={styles.title}>{title}</Text>
                        <Text style={[styles.subtitle, isSelected && styles.subtitleSelected]}>
                            {subtitle}
                        </Text>
                    </View>
                </View>

                {/* Radio Indicator */}
                <View style={[styles.radio, isSelected && styles.radioSelected]}>
                    {isSelected && (
                        <MaterialCommunityIcons name="check" size={18} color={COLORS.background.dark} />
                    )}
                </View>
            </View>

            {/* Description */}
            <Text style={[styles.description, isSelected && styles.descriptionSelected]}>
                {description}
            </Text>
        </Pressable>
    );
};

const styles = StyleSheet.create({
    card: {
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
        backgroundColor: '#16291e',
        padding: 20,
        gap: 12,
    },
    cardSelected: {
        borderWidth: 2,
        borderColor: COLORS.primary.DEFAULT,
        backgroundColor: '#1a2e22',
        shadowColor: COLORS.primary.DEFAULT,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 24,
        elevation: 8,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    leftContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
        flex: 1,
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 12,
        backgroundColor: '#23482f',
        justifyContent: 'center',
        alignItems: 'center',
    },
    iconContainerSelected: {
        backgroundColor: `${COLORS.primary.DEFAULT}33`,
    },
    textContainer: {
        flex: 1,
    },
    title: {
        fontSize: 18,
        fontFamily: 'Lexend_700Bold',
        color: '#ffffff',
        marginBottom: 2,
    },
    subtitle: {
        fontSize: 14,
        fontFamily: 'Lexend_500Medium',
        color: '#9ca3af',
    },
    subtitleSelected: {
        color: COLORS.primary.DEFAULT,
    },
    radio: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#326744',
        backgroundColor: 'transparent',
        justifyContent: 'center',
        alignItems: 'center',
    },
    radioSelected: {
        borderColor: COLORS.primary.DEFAULT,
        backgroundColor: COLORS.primary.DEFAULT,
    },
    description: {
        fontSize: 14,
        fontFamily: 'Lexend_300Light',
        color: '#9ca3af',
        lineHeight: 22,
        paddingLeft: 64,
    },
    descriptionSelected: {
        color: '#d1d5db',
    },
});
