import React from 'react';
import { TouchableOpacity, Image, StyleSheet, Alert, Platform, ActionSheetIOS } from 'react-native';
import { useNavigation } from '@react-navigation/native';

interface AddButtonProps {
    onAddFriend: () => void;
    onCreateGroup: () => void;
}

const AddButton: React.FC<AddButtonProps> = ({ onAddFriend, onCreateGroup }) => {
    const handlePress = () => {
        if (Platform.OS === 'ios') {
            ActionSheetIOS.showActionSheetWithOptions(
                {
                    options: ['取消', '添加好友', '创建群组'],
                    cancelButtonIndex: 0,
                },
                buttonIndex => {
                    if (buttonIndex === 1) {
                        onAddFriend();
                    } else if (buttonIndex === 2) {
                        onCreateGroup();
                    }
                }
            );
        } else {
            Alert.alert(
                '选择操作',
                '',
                [
                    { text: '添加好友', onPress: onAddFriend },
                    { text: '创建群组', onPress: onCreateGroup },
                    { text: '取消', style: 'cancel' },
                ],
                { cancelable: true }
            );
        }
    };

    return (
        <TouchableOpacity onPress={handlePress} style={styles.button}>
            <Image
                source={require('../assets/icons/add.png')}
                style={styles.icon}
            />
        </TouchableOpacity>
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
});

export default AddButton;
