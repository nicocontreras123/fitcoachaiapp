import React from 'react';
import { Modal, View, StyleSheet, Pressable, ScrollView } from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { MusicApp, getMusicAppConfig } from '@/services/musicAppService';

interface MusicAppSelectorModalProps {
    visible: boolean;
    onClose: () => void;
    onSelect: (app: MusicApp | null) => void;
    availableApps: MusicApp[];
    selectedApp: MusicApp | null | undefined;
}

export function MusicAppSelectorModal({
    visible,
    onClose,
    onSelect,
    availableApps,
    selectedApp,
}: MusicAppSelectorModalProps) {
    const handleSelect = (app: MusicApp | null) => {
        onSelect(app);
        onClose();
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <Pressable style={styles.overlay} onPress={onClose}>
                <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
                    <View style={styles.header}>
                        <Text style={styles.title}>Seleccionar App de Música</Text>
                        <Pressable onPress={onClose} style={styles.closeButton}>
                            <MaterialCommunityIcons name="close" size={24} color="#9ca3af" />
                        </Pressable>
                    </View>

                    <ScrollView style={styles.optionsList}>
                        {/* None option */}
                        <Pressable
                            style={[
                                styles.option,
                                !selectedApp && styles.optionSelected,
                            ]}
                            onPress={() => handleSelect(null)}
                        >
                            <View style={styles.optionLeft}>
                                <View style={[styles.optionIcon, { backgroundColor: '#1a1a1a' }]}>
                                    <MaterialCommunityIcons name="close" size={24} color="#9ca3af" />
                                </View>
                                <Text style={styles.optionText}>Ninguna</Text>
                            </View>
                            {!selectedApp && (
                                <MaterialCommunityIcons name="check" size={24} color="#13ec5b" />
                            )}
                        </Pressable>

                        {/* Available apps */}
                        {availableApps.map((app) => {
                            const config = getMusicAppConfig(app);
                            const isSelected = selectedApp === app;

                            return (
                                <Pressable
                                    key={app}
                                    style={[
                                        styles.option,
                                        isSelected && styles.optionSelected,
                                    ]}
                                    onPress={() => handleSelect(app)}
                                >
                                    <View style={styles.optionLeft}>
                                        <View
                                            style={[
                                                styles.optionIcon,
                                                { backgroundColor: config?.color },
                                            ]}
                                        >
                                            <MaterialCommunityIcons
                                                name={config?.icon as any}
                                                size={24}
                                                color="#fff"
                                            />
                                        </View>
                                        <Text style={styles.optionText}>{config?.name}</Text>
                                    </View>
                                    {isSelected && (
                                        <MaterialCommunityIcons name="check" size={24} color="#13ec5b" />
                                    )}
                                </Pressable>
                            );
                        })}
                    </ScrollView>
                </Pressable>
            </Pressable>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContent: {
        backgroundColor: '#152e1e',
        borderRadius: 20,
        width: '100%',
        maxWidth: 400,
        maxHeight: '80%',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    },
    title: {
        fontSize: 18,
        fontWeight: '700',
        color: '#fff',
    },
    closeButton: {
        padding: 4,
    },
    optionsList: {
        padding: 12,
    },
    option: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderRadius: 12,
        marginBottom: 8,
        backgroundColor: '#1a1a1a',
    },
    optionSelected: {
        backgroundColor: 'rgba(19, 236, 91, 0.1)',
        borderWidth: 1,
        borderColor: '#13ec5b',
    },
    optionLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    optionIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    optionText: {
        fontSize: 16,
        fontWeight: '500',
        color: '#fff',
    },
});
