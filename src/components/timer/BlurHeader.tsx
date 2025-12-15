import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, IconButton } from 'react-native-paper';
import { BlurView } from 'expo-blur';

interface BlurHeaderProps {
    title?: string;
    subtitle?: string;
    onBack?: () => void;
    onSettings?: () => void;
    onMuteToggle?: () => void;
    isMuted?: boolean;
    topBadge?: React.ReactNode;
}

export const BlurHeader: React.FC<BlurHeaderProps> = ({
    title,
    subtitle,
    onBack,
    onSettings,
    onMuteToggle,
    isMuted = false,
    topBadge,
}) => {
    return (
        <View style={styles.container}>
            {topBadge && (
                <View style={styles.topBadge}>
                    {topBadge}
                </View>
            )}
            <BlurView intensity={20} tint="dark" style={styles.blurContainer}>
                <View style={styles.content}>
                    <IconButton
                        icon="arrow-left"
                        iconColor="#ffffff"
                        size={24}
                        onPress={onBack}
                        style={styles.iconButton}
                    />
                    <View style={[styles.centerContent, topBadge ? { marginTop: 24 } : null]}>
                        {subtitle && (
                            <Text style={styles.subtitle}>{subtitle}</Text>
                        )}
                        {title && (
                            <Text style={styles.title}>{title}</Text>
                        )}
                    </View>
                    <IconButton
                        icon={onMuteToggle ? (isMuted ? "volume-off" : "volume-high") : (onSettings ? "cog" : "volume-high")}
                        iconColor="#ffffff"
                        size={24}
                        onPress={onMuteToggle || onSettings}
                        style={styles.iconButton}
                    />
                </View>
            </BlurView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'relative',
    },
    topBadge: {
        position: 'absolute',
        top: 8,
        left: 0,
        right: 0,
        zIndex: 30,
        alignItems: 'center',
        pointerEvents: 'none',
    },
    blurContainer: {
        paddingTop: 16,
        paddingBottom: 8,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.05)',
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    iconButton: {
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        margin: 0,
    },
    centerContent: {
        flex: 1,
        alignItems: 'center',
    },
    subtitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#ec1313',
        textTransform: 'uppercase',
        letterSpacing: 2,
    },
    title: {
        fontSize: 16,
        fontWeight: '700',
        color: '#ffffff',
        letterSpacing: 0.5,
    },
});
