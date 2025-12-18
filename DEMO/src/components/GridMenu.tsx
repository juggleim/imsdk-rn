import React from 'react';
import {
    Modal,
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Dimensions,
    TouchableWithoutFeedback,
    Image,
} from 'react-native';

export interface GridMenuOption {
    label: string;
    onPress: () => void;
    icon: any;
}

export interface GridMenuAnchor {
    x: number;
    y: number;
    width: number;
    height: number;
}

interface GridMenuProps {
    visible: boolean;
    onClose: () => void;
    options: GridMenuOption[];
    anchor?: GridMenuAnchor;
}

const GridMenu: React.FC<GridMenuProps> = ({ visible, onClose, options, anchor }) => {
    const screenHeight = Dimensions.get('window').height;
    const screenWidth = Dimensions.get('window').width;

    // Layout constants
    const itemWidth = 60; // Approximate width of each item
    const itemsPerRow = Math.min(options.length, 5); // Max 5 items per row, or less if few options.
    // However, user asked for max 4 per row. Let's stick to 4 as base, but if 5 fits comfortably we could do 5.
    // The image shows 5 items per row. The user prompt text says "一行最多4个" (max 4 per row).
    // I will respect the user prompt: MAX 4 PER ROW.
    const maxItemsPerRow = 4;

    // Calculate menu dimensions
    const rowCount = Math.ceil(options.length / maxItemsPerRow);
    const validItemsPerRow = Math.min(options.length, maxItemsPerRow);

    // Width: (item width * count) + (padding horizontal * 2)
    // Actually simplicity: set a fixed width based on items.
    // Let's use flexWrap.
    const menuWidth = Math.min(screenWidth - 40, validItemsPerRow * 70 + 20); // 70px per item slot approx

    // Approximate height calculation: 
    // icon (24) + text (20) + padding vertical (15*2 = 30) -> ~74px per row
    // + padding container (10*2 = 20)
    const menuHeight = rowCount * 74 + 20;

    // Triangle constants - Removed per user request
    const gap = -25;

    let top = 0;
    let left = 0;
    let showBelow = false;
    // let triangleLeft = 0;

    if (anchor) {
        // Position logic
        if (anchor.y - menuHeight - gap > 40) { // Check if space above
            top = anchor.y - menuHeight - gap;
            showBelow = false;
        } else {
            top = anchor.y + anchor.height + 5;
            showBelow = true;
        }

        left = anchor.x + anchor.width / 2 - menuWidth / 2;
        // triangleLeft = menuWidth / 2 - 8;

        if (left < 10) {
            // const diff = 10 - left;
            left = 10;
            // triangleLeft -= diff;
        } else if (left + menuWidth > screenWidth - 10) {
            // const diff = (left + menuWidth) - (screenWidth - 10);
            left = screenWidth - 10 - menuWidth;
            // triangleLeft += diff;
        }

        // triangleLeft = Math.max(10, Math.min(triangleLeft, menuWidth - 26)); 
    } else {
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
                            {/* Menu Content */}
                            <View style={[styles.menu]}>
                                <View style={styles.gridContainer}>
                                    {options.map((option, index) => (
                                        <TouchableOpacity
                                            key={index}
                                            style={[styles.menuItem, { width: `${100 / validItemsPerRow}%` }]}
                                            onPress={() => {
                                                option.onPress();
                                                onClose();
                                            }}
                                        >
                                            <Image
                                                source={option.icon}
                                                style={styles.menuIcon}
                                            />
                                            <Text style={styles.menuText}>
                                                {option.label}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
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
    },

    menu: {
        backgroundColor: '#4c4c4c',
        borderRadius: 8,
        paddingVertical: 10,
        paddingHorizontal: 5,
        width: '100%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 5,
    },
    gridContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    menuItem: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 8,
    },
    menuIcon: {
        width: 24,
        height: 24,
        tintColor: '#fff',
        marginBottom: 4,
    },
    menuText: {
        color: '#fff',
        fontSize: 12,
        textAlign: 'center',
    },
});

export default GridMenu;
