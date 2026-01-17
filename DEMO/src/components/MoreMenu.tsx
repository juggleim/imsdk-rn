import React, { useEffect, useRef } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Modal,
    Animated,
    Dimensions,
    TouchableWithoutFeedback,
} from 'react-native';

const { width } = Dimensions.get('window');

interface MenuOption {
    icon: string;
    label: string;
    onPress: () => void;
    color?: string;
}

interface MoreMenuProps {
    visible: boolean;
    onClose: () => void;
    onCamera: () => void;
    onImage: () => void;
    onFile: () => void;
    onCard: () => void;
    onBusinessCard: () => void;
}

const MoreMenu: React.FC<MoreMenuProps> = ({
    visible,
    onClose,
    onCamera,
    onImage,
    onFile,
    onCard,
    onBusinessCard,
}) => {
    const slideAnim = useRef(new Animated.Value(300)).current;
    const opacityAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (visible) {
            Animated.parallel([
                Animated.spring(slideAnim, {
                    toValue: 0,
                    tension: 65,
                    friction: 11,
                    useNativeDriver: true,
                }),
                Animated.timing(opacityAnim, {
                    toValue: 1,
                    duration: 200,
                    useNativeDriver: true,
                }),
            ]).start();
        } else {
            Animated.parallel([
                Animated.timing(slideAnim, {
                    toValue: 300,
                    duration: 200,
                    useNativeDriver: true,
                }),
                Animated.timing(opacityAnim, {
                    toValue: 0,
                    duration: 200,
                    useNativeDriver: true,
                }),
            ]).start();
        }
    }, [visible]);

    const menuOptions: MenuOption[] = [
        {
            icon: '📁',
            label: '文件',
            onPress: () => {
                onClose();
                setTimeout(onFile, 100);
            },
            color: '#007AFF',
        },
        {
            icon: '💬',
            label: '卡片消息',
            onPress: () => {
                onClose();
                setTimeout(onCard, 100);
            },
            color: '#5856D6',
        },
        {
            icon: '👤',
            label: '名片',
            onPress: () => {
                onClose();
                setTimeout(onBusinessCard, 100);
            },
            color: '#34C759',
        },
    ];

    return (
        <Modal
            visible={visible}
            transparent
            animationType="none"
            onRequestClose={onClose}>
            <TouchableWithoutFeedback onPress={onClose}>
                <Animated.View
                    style={[
                        styles.overlay,
                        {
                            opacity: opacityAnim,
                        },
                    ]}>
                    <TouchableWithoutFeedback>
                        <Animated.View
                            style={[
                                styles.menuContainer,
                                {
                                    transform: [{ translateY: slideAnim }],
                                },
                            ]}>
                            <View style={styles.menuHeader}>
                                <View style={styles.handleBar} />
                            </View>
                            <View style={styles.menuContent}>
                                {menuOptions.map((option, index) => (
                                    <TouchableOpacity
                                        key={index}
                                        style={styles.menuItem}
                                        onPress={option.onPress}
                                        activeOpacity={0.75}>
                                        <View
                                            style={[
                                                styles.iconContainer,
                                                { backgroundColor: option.color + '20' },
                                            ]}>
                                            <Text style={styles.icon}>{option.icon}</Text>
                                        </View>
                                        <Text style={styles.label}>{option.label}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </Animated.View>
                    </TouchableWithoutFeedback>
                </Animated.View>
            </TouchableWithoutFeedback>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
        minWidth: 0,
    },
    menuContainer: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingBottom: 34,
    },
    menuHeader: {
        alignItems: 'center',
        paddingVertical: 12,
    },
    handleBar: {
        width: 36,
        height: 4,
        backgroundColor: '#D1D1D6',
        borderRadius: 2,
    },
    menuContent: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingHorizontal: 20,
        paddingTop: 10,
    },
    menuItem: {
        width: (width - 60) / 3,
        alignItems: 'center',
        paddingVertical: 20,
    },
    iconContainer: {
        width: 64,
        height: 64,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    icon: {
        fontSize: 32,
    },
    label: {
        fontSize: 14,
        color: '#141414',
        fontWeight: '500',
        overflow: 'hidden',
    },
});

export default MoreMenu;
