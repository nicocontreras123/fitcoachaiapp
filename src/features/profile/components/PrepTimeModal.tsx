import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, Modal, TouchableOpacity, Text, Pressable, FlatList, NativeSyntheticEvent, NativeScrollEvent } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';

interface PrepTimeModalProps {
    visible: boolean;
    onClose: () => void;
    onSave: (minutes: number, seconds: number) => void;
    initialMinutes: number;
    initialSeconds: number;
}

const ITEM_HEIGHT = 50;
const VISIBLE_ITEMS = 3;

interface WheelPickerProps {
    value: number;
    max: number;
    onChange: (val: number) => void;
    label: string;
}

const WheelPicker = ({ value, max, onChange, label }: WheelPickerProps) => {
    const flatListRef = useRef<FlatList>(null);
    const data = Array.from({ length: max + 1 }, (_, i) => i);

    useEffect(() => {
        if (flatListRef.current && value >= 0) {
            // Small timeout to ensure layout is ready or modal animation finished
            setTimeout(() => {
                flatListRef.current?.scrollToOffset({
                    offset: value * ITEM_HEIGHT,
                    animated: false,
                });
            }, 100);
        }
    }, [value]); // Re-run when value changes to ensure scroll sync

    const onScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
        const y = event.nativeEvent.contentOffset.y;
        const index = Math.round(y / ITEM_HEIGHT);
        const clampedIndex = Math.max(0, Math.min(index, max));
        if (clampedIndex !== value) {
            onChange(clampedIndex);
        }
    };

    return (
        <View style={styles.column}>
            <View style={styles.wheelContainer}>
                <View style={styles.selectionOverlay} pointerEvents="none" />
                <FlatList
                    ref={flatListRef}
                    data={data}
                    keyExtractor={(item) => item.toString()}
                    showsVerticalScrollIndicator={false}
                    snapToInterval={ITEM_HEIGHT}
                    decelerationRate="fast"
                    onMomentumScrollEnd={onScrollEnd}
                    initialNumToRender={15}
                    getItemLayout={(_, index) => ({
                        length: ITEM_HEIGHT,
                        offset: ITEM_HEIGHT * index,
                        index,
                    })}
                    contentContainerStyle={{
                        paddingVertical: ITEM_HEIGHT * Math.floor(VISIBLE_ITEMS / 2),
                    }}
                    renderItem={({ item }) => {
                        const isSelected = item === value;
                        return (
                            <View style={[styles.wheelItem, { height: ITEM_HEIGHT }]}>
                                <Text style={[styles.wheelText, isSelected && styles.wheelTextSelected]}>
                                    {item.toString().padStart(2, '0')}
                                </Text>
                            </View>
                        );
                    }}
                />
            </View>
            <Text style={styles.unitLabel}>{label}</Text>
        </View>
    );
};

export function PrepTimeModal({ visible, onClose, onSave, initialMinutes, initialSeconds }: PrepTimeModalProps) {
    const [minutes, setMinutes] = useState(initialMinutes);
    const [seconds, setSeconds] = useState(initialSeconds);

    // Sync state when opening
    React.useEffect(() => {
        if (visible) {
            setMinutes(initialMinutes);
            setSeconds(initialSeconds);
        }
    }, [visible, initialMinutes, initialSeconds]);

    const handleSave = () => {
        onSave(minutes, seconds);
        onClose();
    };

    return (
        <Modal
            animationType="fade"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
        >
            <View style={styles.centeredView}>
                {/* Backdrop */}
                <Pressable style={styles.backdrop} onPress={onClose} />

                <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />

                {/* Modal Content */}
                <View style={styles.modalView}>
                    <TouchableOpacity
                        style={styles.closeButton}
                        onPress={onClose}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                        <MaterialCommunityIcons name="close" size={24} color="#9ca3af" />
                    </TouchableOpacity>

                    <Text style={styles.modalTitle}>Tiempo de Preparación</Text>

                    {/* Time Picker Controls */}
                    <View style={styles.pickerContainer}>
                        {/* Key prop forces re-render/scroll-to-position when visibility changes */}
                        <WheelPicker
                            key={`min-${visible}`}
                            value={minutes}
                            max={59}
                            onChange={setMinutes}
                            label="MIN"
                        />

                        {/* Separator */}
                        <View style={styles.separatorContainer}>
                            <Text style={styles.separator}>:</Text>
                        </View>

                        {/* Seconds Column */}
                        <WheelPicker
                            key={`sec-${visible}`}
                            value={seconds}
                            max={59}
                            onChange={setSeconds}
                            label="SEG"
                        />
                    </View>

                    {/* Action Buttons */}
                    <View style={styles.buttonContainer}>
                        <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
                            <Text style={styles.cancelButtonText}>Cancelar</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                            <Text style={styles.saveButtonText}>Guardar</Text>
                        </TouchableOpacity>
                    </View>

                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    centeredView: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.6)',
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
    },
    modalView: {
        width: '90%',
        maxWidth: 340,
        backgroundColor: '#152e1e', // Surface Dark
        borderRadius: 24,
        padding: 24,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.25,
        shadowRadius: 16,
        elevation: 5,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    closeButton: {
        position: 'absolute',
        right: 16,
        top: 16,
        zIndex: 1,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '700',
        marginBottom: 32,
        color: '#fff',
        marginTop: 8,
    },
    pickerContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 20, // gap is supported in RN 0.71+
        marginBottom: 32,
        alignItems: 'center',
        height: 150, // Fixed height for wheel container
    },
    column: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    wheelContainer: {
        height: ITEM_HEIGHT * VISIBLE_ITEMS,
        width: 70,
        overflow: 'hidden',
        position: 'relative',
        backgroundColor: '#0c1a11',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    wheelItem: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    wheelText: {
        fontSize: 24,
        color: '#6b7280', // dim text
        fontWeight: '500',
    },
    wheelTextSelected: {
        fontSize: 28,
        color: '#fff',
        fontWeight: '700',
    },
    selectionOverlay: {
        position: 'absolute',
        top: ITEM_HEIGHT, // Middle position
        left: 0,
        right: 0,
        height: ITEM_HEIGHT,
        backgroundColor: 'rgba(19, 236, 91, 0.1)', // Subtle highlight
        borderColor: 'rgba(19, 236, 91, 0.3)',
        borderTopWidth: 1,
        borderBottomWidth: 1,
        zIndex: 10,
    },
    unitLabel: {
        fontSize: 10,
        fontWeight: '700',
        color: '#9ca3af',
        letterSpacing: 1,
        marginTop: 8,
    },
    separatorContainer: {
        height: '100%',
        justifyContent: 'center',
        paddingBottom: 20,
    },
    separator: {
        fontSize: 32,
        color: 'rgba(255,255,255,0.2)',
        fontWeight: '700',
    },
    buttonContainer: {
        flexDirection: 'row',
        gap: 12,
        width: '100%',
    },
    cancelButton: {
        flex: 1,
        paddingVertical: 14,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 12,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    cancelButtonText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 14,
    },
    saveButton: {
        flex: 1,
        paddingVertical: 14,
        backgroundColor: '#13ec5b', // Primary
        borderRadius: 12,
        alignItems: 'center',
    },
    saveButtonText: {
        color: '#000',
        fontWeight: '800',
        fontSize: 14,
    },
});
