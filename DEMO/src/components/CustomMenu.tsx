import React, { useState } from 'react';
import {
    Modal,
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Dimensions,
    TouchableWithoutFeedback,
    Platform,
    Image,
} from 'react-native';

interface MenuOption {
    label: string;
    onPress: () => void;
    destructive?: boolean;
    icon?: any;
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
                        <View style={[styles.menuContainer, { top, left }]}>
                            <View style={styles.triangle} />
                            <View style={styles.menu}>
                                {options.map((option, index) => (
                                    <React.Fragment key={index}>
                                        <TouchableOpacity
                                            style={styles.menuItem}
                                            onPress={() => {
                                                option.onPress();
                                                onClose();
                                            }}
                                        >
                                            {option.icon && (
                                                <Image
                                                    source={option.icon}
                                                    style={styles.menuIcon}
                                                />
                                            )}
                                            <Text
                                                style={[
                                                    styles.menuText,
                                                    option.destructive && styles.destructiveText
                                                ]}
                                            >
                                                {option.label}
                                            </Text>
                                        </TouchableOpacity>
                                        {index < options.length - 1 && (
                                            <View style={styles.divider} />
                                        )}
                                    </React.Fragment>
                                ))}
                            </View>
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
        backgroundColor: 'transparent',
    },
    menuContainer: {
        position: 'absolute',
        alignItems: 'center',
    },
    triangle: {
        width: 0,
        height: 0,
        backgroundColor: 'transparent',
        borderStyle: 'solid',
        borderLeftWidth: 8,
        borderRightWidth: 8,
        borderBottomWidth: 8,
        borderLeftColor: 'transparent',
        borderRightColor: 'transparent',
        borderBottomColor: '#4a4a4a',
    },
    menu: {
        backgroundColor: '#4a4a4a',
        borderRadius: 8,
        paddingVertical: 8,
        minWidth: 160,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 5,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 16,
    },
    menuIcon: {
        width: 24,
        height: 24,
        tintColor: '#fff',
        marginRight: 12,
    },
    menuText: {
        color: '#fff',
        fontSize: 16,
    },
    destructiveText: {
        color: '#FF6B6B',
    },
    divider: {
        height: 0.5,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        marginHorizontal: 16,
    },
});

export default CustomMenu;
