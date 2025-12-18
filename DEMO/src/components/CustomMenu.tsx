import React, { useState, useEffect } from 'react';
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

export interface MenuAnchor {
    x: number;
    y: number;
    width: number;
    height: number;
}

interface CustomMenuProps {
    visible: boolean;
    onClose: () => void;
    options: MenuOption[];
    anchor?: MenuAnchor;
}

const CustomMenu: React.FC<CustomMenuProps> = ({ visible, onClose, options, anchor }) => {
    const screenHeight = Dimensions.get('window').height;
    const screenWidth = Dimensions.get('window').width;

    // Calculate menu position
    const menuHeight = options.length * 52 + 16; // Approx height
    const menuWidth = 180;
    const triangleHeight = 8;
    const gap = -30; // Gap between anchor and menu

    let top = 0;
    let left = 0;
    let showBelow = false;
    let triangleLeft = 0;

    if (anchor) {
        // Try to position above first
        if (anchor.y - menuHeight - gap - triangleHeight > 40) { // 40 for status bar safety
            top = anchor.y - menuHeight - gap - triangleHeight;
            showBelow = false;
        } else {
            // Position below if not enough space above
            top = anchor.y + anchor.height + gap + triangleHeight;
            showBelow = true;
        }

        // Center horizontally relative to anchor
        left = anchor.x + anchor.width / 2 - menuWidth / 2;
        triangleLeft = menuWidth / 2 - 8; // Center triangle on menu by default

        // Adjust if menu goes off screen horizontally
        if (left < 10) {
            const diff = 10 - left;
            left = 10;
            triangleLeft -= diff; // Move triangle to stay pointed at anchor
        } else if (left + menuWidth > screenWidth - 10) {
            const diff = (left + menuWidth) - (screenWidth - 10);
            left = screenWidth - 10 - menuWidth;
            triangleLeft += diff;
        }
    } else {
        // Fallback to center if no anchor
        top = screenHeight / 2 - menuHeight / 2;
        left = screenWidth / 2 - menuWidth / 2;
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
                        <View style={[styles.menuContainer, { top, left, width: menuWidth }]}>
                            {!showBelow && (
                                <View style={[styles.menu, { marginBottom: 0 }]}>
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
                            )}

                            <View style={[
                                showBelow ? styles.triangleUp : styles.triangleDown,
                                { marginLeft: triangleLeft }
                            ]} />

                            {showBelow && (
                                <View style={[styles.menu, { marginTop: 0 }]}>
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
                            )}
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

    },
    triangleDown: {
        width: 0,
        height: 0,
        backgroundColor: 'transparent',
        borderStyle: 'solid',
        borderLeftWidth: 8,
        borderRightWidth: 8,
        borderTopWidth: 8,
        borderLeftColor: 'transparent',
        borderRightColor: 'transparent',
        borderTopColor: '#4c4c4c',
    },
    triangleUp: {
        width: 0,
        height: 0,
        backgroundColor: 'transparent',
        borderStyle: 'solid',
        borderLeftWidth: 8,
        borderRightWidth: 8,
        borderBottomWidth: 8,
        borderLeftColor: 'transparent',
        borderRightColor: 'transparent',
        borderBottomColor: '#4c4c4c',
    },
    menu: {
        backgroundColor: '#4c4c4c',
        borderRadius: 8,
        paddingVertical: 4,
        width: '100%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 5,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
    },
    menuIcon: {
        width: 20,
        height: 20,
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
