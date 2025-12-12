import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Message, TextMessageContent, ImageMessageContent, FileMessageContent, VoiceMessageContent } from 'juggleim-rnsdk';

interface QuoteReplyBarProps {
    message: Message;
    senderName: string;
    onClose: () => void;
}

const QuoteReplyBar: React.FC<QuoteReplyBarProps> = ({ message, senderName, onClose }) => {
    const getMessagePreview = (): string => {
        const contentType = message.content.contentType;

        if (contentType === 'jg:text') {
            const textContent = message.content as TextMessageContent;
            return textContent.content;
        } else if (contentType === 'jg:img') {
            return '[图片]';
        } else if (contentType === 'jg:file') {
            return '[文件]';
        } else if (contentType === 'jg:video') {
            return '[视频]';
        } else if (contentType === 'jg:voice') {
            return '[语音]';
        } else {
            return '[消息]';
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.content}>
                <Image
                    source={require('../assets/icons/reply.png')}
                    style={styles.icon}
                />
                <View style={styles.textContainer}>
                    <Text style={styles.title} numberOfLines={1}>
                        {senderName}
                    </Text>
                    <Text style={styles.preview} numberOfLines={1}>
                        {getMessagePreview()}
                    </Text>
                </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Text style={styles.closeIcon}>×</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F5F5F5',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
    },
    content: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
    },
    icon: {
        width: 20,
        height: 20,
        marginRight: 8,
        tintColor: '#666',
    },
    textContainer: {
        flex: 1,
    },
    title: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        marginBottom: 2,
    },
    preview: {
        fontSize: 13,
        color: '#666',
    },
    closeButton: {
        padding: 4,
        marginLeft: 8,
    },
    closeIcon: {
        fontSize: 24,
        color: '#999',
        lineHeight: 24,
    },
});

export default QuoteReplyBar;
