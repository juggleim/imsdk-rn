import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
    View,
    FlatList,
    StyleSheet,
    SafeAreaView,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    Alert,
    Text,
    ActionSheetIOS,
    Clipboard,
} from 'react-native';
import JuggleIM, { Conversation, Message, MessageContent, TextMessageContent, ImageMessageContent, VoiceMessageContent } from 'im-rn-sdk';
import { useNavigation, useRoute } from '@react-navigation/native';
import { getToken } from '../utils/auth';
import MessageHeader from '../components/MessageHeader';
import MessageComposer from '../components/MessageComposer';
import MessageBubble from '../components/MessageBubble';

const MessageListScreen = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const { conversation } = route.params as { conversation: Conversation };

    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [currentUserId, setCurrentUserId] = useState<string>('');

    useEffect(() => {
        const fetchUserId = async () => {
            const session = await getToken();
            if (session) {
                setCurrentUserId(session.userId);
            }
        };
        fetchUserId();

        // Clear unread count on entry
        JuggleIM.clearUnreadCount(conversation);

        loadMessages();
        const unsubscribe = JuggleIM.addMessageListener('MessageListScreen', {
            onMessageReceive: (message: Message) => {
                if (message.conversation.conversationId === conversation.conversationId) {
                    setMessages((prev) => [message, ...prev]);
                    // Mark as read when received in active chat
                    JuggleIM.clearUnreadCount(conversation);
                }
            },
            onMessageRecall: (message: Message) => {
                if (message.conversation.conversationId === conversation.conversationId) {
                    setMessages((prev) => prev.map(m => m.messageId === message.messageId ? message : m));
                }
            }
        });
        return () => {
            unsubscribe();
        };
    }, [conversation.conversationId]);

    const loadMessages = async () => {
        setIsLoading(true);
        try {
            const result = await JuggleIM.getMessageList(conversation, 0, { count: 20 });
            if (result && result.messages) {
                setMessages(result.messages.reverse());
            }
        } catch (error) {
            console.error('Failed to load messages:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSendText = async (text: string) => {
        const textContent: TextMessageContent = {
            contentType: 'jg:text',
            content: text,
        };

        const messageToSend = {
            conversationType: conversation.conversationType,
            conversationId: conversation.conversationId,
            content: textContent,
        };

        try {
            const sentMessage = await JuggleIM.sendMessage(messageToSend);
            setMessages((prev) => [sentMessage, ...prev]);
        } catch (error) {
            console.error('Failed to send message:', error);
            Alert.alert('Error', 'Failed to send message');
        }
    };

    const handleAttachmentPress = () => {
        Alert.alert('Attachment', 'Feature coming soon: Pick file/location');
    };

    const handleCameraPress = async () => {
        Alert.alert('Camera', 'Sending mock image...', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Send Mock Image',
                onPress: async () => {
                    const imageContent: ImageMessageContent = {
                        contentType: 'jg:img',
                        localPath: 'https://via.placeholder.com/300',
                        width: 300,
                        height: 300,
                    };
                    const messageToSend = {
                        conversationType: conversation.conversationType,
                        conversationId: conversation.conversationId,
                        content: imageContent,
                    };
                    try {
                        const sentMessage = await JuggleIM.sendImageMessage(messageToSend);
                        setMessages((prev) => [sentMessage, ...prev]);
                    } catch (error) {
                        console.error('Failed to send image:', error);
                    }
                }
            }
        ]);
    };

    const handleVoicePress = async () => {
        Alert.alert('Voice', 'Sending mock voice message...', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Send Mock Voice',
                onPress: async () => {
                    const voiceContent: VoiceMessageContent = {
                        contentType: 'jg:voice',
                        localPath: 'mock_path.aac',
                        duration: 5,
                    };
                    try {
                        const sentMessage = await JuggleIM.sendVoiceMessage(
                            conversation.conversationType,
                            conversation.conversationId,
                            voiceContent
                        );
                        setMessages((prev) => [sentMessage, ...prev]);
                    } catch (error) {
                        console.error('Failed to send voice:', error);
                    }
                }
            }
        ]);
    };

    const handleMessageLongPress = (message: Message) => {
        const options = ['Copy', 'Delete', 'Cancel'];
        const isOutgoing = message.direction === 1;
        if (isOutgoing) {
            options.splice(1, 0, 'Recall');
        }
        const cancelButtonIndex = options.indexOf('Cancel');
        const destructiveButtonIndex = options.indexOf('Delete');

        if (Platform.OS === 'ios') {
            ActionSheetIOS.showActionSheetWithOptions(
                {
                    options,
                    cancelButtonIndex,
                    destructiveButtonIndex,
                },
                (buttonIndex) => {
                    handleActionSheet(buttonIndex, options, message);
                }
            );
        } else {
            // Android fallback
            Alert.alert(
                'Message Options',
                undefined,
                options.map((opt, index) => ({
                    text: opt,
                    onPress: () => handleActionSheet(index, options, message),
                    style: opt === 'Cancel' ? 'cancel' : 'default'
                }))
            );
        }
    };

    const handleActionSheet = (buttonIndex: number, options: string[], message: Message) => {
        const action = options[buttonIndex];
        switch (action) {
            case 'Copy':
                if (message.content.contentType === 'jg:text') {
                    Clipboard.setString((message.content as TextMessageContent).content);
                }
                break;
            case 'Delete':
                // Local delete
                setMessages(prev => prev.filter(m => m.messageId !== message.messageId));
                break;
            case 'Recall':
                JuggleIM.recallMessage([message.messageId])
                    .then(() => {
                        // Update UI to show recalled state or remove
                        setMessages(prev => prev.filter(m => m.messageId !== message.messageId));
                    })
                    .catch(e => Alert.alert('Error', 'Failed to recall message'));
                break;
        }
    };

    const renderMessageItem = ({ item }: { item: Message }) => {
        const isOutgoing = item.direction === 1;

        return (
            <View style={[styles.messageRow, isOutgoing ? styles.outgoingRow : styles.incomingRow]}>
                {!isOutgoing && (
                    <View style={styles.avatarContainer}>
                        <Text style={styles.avatarText}>{item.senderUserId?.substring(0, 1).toUpperCase() || '?'}</Text>
                    </View>
                )}

                <MessageBubble
                    message={item}
                    isOutgoing={isOutgoing}
                    onLongPress={() => handleMessageLongPress(item)}
                />

                {isOutgoing && (
                    <View style={styles.avatarContainer}>
                        <Text style={styles.avatarText}>{currentUserId?.substring(0, 1).toUpperCase() || 'Me'}</Text>
                    </View>
                )}
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <MessageHeader
                conversation={conversation}
                title={conversation.conversationId}
                subtitle={conversation.conversationType === 1 ? 'Private Chat' : 'Group Chat'}
            />

            <FlatList
                data={messages}
                renderItem={renderMessageItem}
                keyExtractor={(item) => item.messageId || item.clientMsgNo.toString()}
                inverted
                contentContainerStyle={styles.listContent}
                ListFooterComponent={isLoading ? <ActivityIndicator style={{ marginVertical: 10 }} /> : null}
            />

            <MessageComposer
                onSend={handleSendText}
                onAttachmentPress={handleAttachmentPress}
                onCameraPress={handleCameraPress}
                onVoicePress={handleVoicePress}
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    listContent: {
        paddingVertical: 16,
        paddingHorizontal: 16,
    },
    messageRow: {
        flexDirection: 'row',
        marginBottom: 16,
        alignItems: 'flex-end',
    },
    outgoingRow: {
        justifyContent: 'flex-end',
    },
    incomingRow: {
        justifyContent: 'flex-start',
    },
    avatarContainer: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#ccc',
        justifyContent: 'center',
        alignItems: 'center',
        marginHorizontal: 8,
        marginBottom: 4,
    },
    avatarText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: 'bold',
    },
});

export default MessageListScreen;
