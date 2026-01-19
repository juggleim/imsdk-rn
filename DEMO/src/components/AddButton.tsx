import React, { useState, useRef } from 'react';
import {
    TouchableOpacity,
    Image,
    StyleSheet,
    View,
    Text,
    Modal,
    TouchableWithoutFeedback,
    UIManager,
    findNodeHandle,
    Platform,
} from 'react-native';

interface AddButtonProps {
    onAddFriend: () => void;
    onCreateGroup: () => void;
}

const AddButton: React.FC<AddButtonProps> = ({ onAddFriend, onCreateGroup }) => {
    const [menuVisible, setMenuVisible] = useState(false);
    const [buttonLayout, setButtonLayout] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
    const buttonRef = useRef<TouchableOpacity>(null);

    const handleAddFriend = () => {
        setMenuVisible(false);
        setTimeout(() => onAddFriend(), 100);
    };

    const handleCreateGroup = () => {
        setMenuVisible(false);
        setTimeout(() => onCreateGroup(), 100);
    };

    const measureButton = () => {
        const handle = findNodeHandle(buttonRef.current);
        if (handle) {
            UIManager.measureInWindow(handle, (x, y, width, height) => {
                setButtonLayout({ x, y, width, height });
            });
        }
    };

    return (
        <>
            <TouchableOpacity
                ref={buttonRef}
                onPress={() => {
                    measureButton();
                    setMenuVisible(true);
                }}
                style={styles.button}
            >
                <Image
                    source={require('../assets/icons/circle_add.png')}
                    style={styles.icon}
                />
            </TouchableOpacity>

            <Modal
                visible={menuVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setMenuVisible(false)}
            >
                <TouchableWithoutFeedback onPress={() => setMenuVisible(false)}>
                    <View style={styles.overlay}>
                        <View style={[
                            styles.menuContainer,
                            buttonLayout && {
                                top: buttonLayout.y + buttonLayout.height + 4, // +4 for spacing
                            }
                        ]}>
                            <View style={styles.triangle} />
                            <View style={styles.menu}>
                                <TouchableOpacity
                                    style={styles.menuItem}
                                    onPress={handleCreateGroup}
                                >
                                    <Image
                                        source={require('../assets/icons/chat.png')}
                                        style={styles.menuIcon}
                                    />
                                    <Text style={styles.menuText}>发起群聊</Text>
                                </TouchableOpacity>

                                <View style={styles.divider} />

                                <TouchableOpacity
                                    style={styles.menuItem}
                                    onPress={handleAddFriend}
                                >
                                    <Image
                                        source={require('../assets/icons/avatar.png')}
                                        style={styles.menuIcon}
                                    />
                                    <Text style={styles.menuText}>添加朋友</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>
        </>
    );
};

const styles = StyleSheet.create({
    button: {
        marginRight: 16,
        padding: 4,
    },
    icon: {
        width: 24,
        height: 24,
        tintColor: '#007AFF',
    },
    overlay: {
        flex: 1,
        backgroundColor: 'transparent',
        minWidth: 0,
    },
    menuContainer: {
        position: 'absolute',
        right: 5,
        alignItems: 'flex-end',
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
        marginRight: 20,
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
        overflow: 'hidden',
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
        overflow: 'hidden',
    },
    divider: {
        height: 0.5,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        marginHorizontal: 16,
    },
});

export default AddButton;
