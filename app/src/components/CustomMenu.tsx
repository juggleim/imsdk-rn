import React, { useState } from 'react';
import {
    Modal,
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Dimensions,
    TouchableWithoutFeedback,
    Platform
} from 'react-native';

interface MenuOption {
    label: string;
    onPress: () => void;
    destructive?: boolean;
}

interface CustomMenuProps {
    visible: boolean;
    onClose: () => void;
    options: MenuOption[];
    position?: { x: number; y: number };
}

const CustomMenu: React.FC<CustomMenuProps> = ({ visible, onClose, options, position }) => {
    const screenHeight = Dimensions.get('window').height;
    const screenWidth = Dimensions.get('window').width;

    // Calculate menu position
    const menuHeight = options.length * 50 + 20;
    const menuWidth = 200;

    let top = position?.y || screenHeight / 2;
    let left = position?.x || screenWidth / 2 - menuWidth / 2;

    // Adjust if menu goes off screen
    if (top + menuHeight > screenHeight) {
        top = screenHeight - menuHeight - 20;
    }
    if (left + menuWidth > screenWidth) {
        left = screenWidth - menuWidth - 20;
    }

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <TouchableWithoutFeedback onPress={onClose}>
                <View style={styles.overlay}>
                    <TouchableWithoutFeedback>
                        <View style={[styles.menu, { top, left }]}>
                            {options.map((option, index) => (
                                <TouchableOpacity
                                    key={index}
                                    style={[
                                        styles.menuItem,
                                        index === options.length - 1 && styles.lastMenuItem
                                    ]}
                                    onPress={() => {
                                        option.onPress();
                                        onClose();
                                    }}
                                >
                                    <Text
                                        style={[
                                            styles.menuText,
                                            option.destructive && styles.destructiveText
                                        ]}
                                    >
                                        {option.label}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </TouchableWithoutFeedback>
                </View>
            </TouchableWithoutFeedback>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
    },
    menu: {
        position: 'absolute',
        backgroundColor: '#fff',
        borderRadius: 12,
        paddingVertical: 8,
        minWidth: 180,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.25,
                shadowRadius: 8,
            },
            android: {
                elevation: 8,
            },
        }),
    },
    menuItem: {
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: '#e0e0e0',
    },
    lastMenuItem: {
        borderBottomWidth: 0,
    },
    menuText: {
        fontSize: 16,
        color: '#333',
        textAlign: 'center',
    },
    destructiveText: {
        color: '#FF3B30',
    },
});

export default CustomMenu;
