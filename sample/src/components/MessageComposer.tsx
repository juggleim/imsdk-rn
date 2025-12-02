import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet, Image, Platform, KeyboardAvoidingView } from 'react-native';

interface MessageComposerProps {
    onSend: (text: string) => void;
    onAttachmentPress?: () => void;
    onCameraPress?: () => void;
    onVoicePress?: () => void;
}

const MessageComposer: React.FC<MessageComposerProps> = ({ onSend, onAttachmentPress, onCameraPress, onVoicePress }) => {
    const [text, setText] = useState('');

    const handleSend = () => {
        if (text.trim()) {
            onSend(text);
            setText('');
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
            style={styles.container}
        >
            <View style={styles.composer}>
                <TouchableOpacity onPress={onAttachmentPress} style={styles.iconButton}>
                    <Image source={require('../assets/icons/circle_add.png')} style={styles.icon} />
                </TouchableOpacity>

                <View style={styles.inputContainer}>
                    <TextInput
                        style={styles.input}
                        value={text}
                        onChangeText={setText}
                        placeholder="Type a message..."
                        placeholderTextColor="#999"
                        multiline
                    />
                </View>

                {text.trim().length > 0 ? (
                    <TouchableOpacity onPress={handleSend} style={styles.sendButton}>
                        <Image source={require('../assets/icons/send_message.png')} style={styles.sendIcon} />
                    </TouchableOpacity>
                ) : (
                    <>
                        <TouchableOpacity onPress={onCameraPress} style={styles.iconButton}>
                            <Image source={require('../assets/icons/image.png')} style={styles.icon} />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={onVoicePress} style={styles.iconButton}>
                            <Image source={require('../assets/icons/microphone.png')} style={styles.icon} />
                        </TouchableOpacity>
                    </>
                )}
            </View>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#fff',
    },
    composer: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        padding: 10,
        borderTopWidth: 1,
        borderTopColor: 'rgba(0,0,0,0.05)',
        backgroundColor: '#fff',
    },
    iconButton: {
        padding: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    icon: {
        width: 24,
        height: 24,
        tintColor: '#3399ff',
    },
    inputContainer: {
        flex: 1,
        backgroundColor: '#f2f2f2',
        borderRadius: 20,
        paddingHorizontal: 12,
        marginHorizontal: 8,
        minHeight: 40,
        justifyContent: 'center',
        marginBottom: 4,
    },
    input: {
        fontSize: 16,
        color: '#141414',
        maxHeight: 100,
        paddingVertical: 8,
    },
    sendButton: {
        padding: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    sendIcon: {
        width: 24,
        height: 24,
        tintColor: '#3399ff',
    },
});

export default MessageComposer;
