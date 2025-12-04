import React, {useState, useEffect} from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  SafeAreaView,
  ActivityIndicator,
  Text,
  ActionSheetIOS,
  Clipboard,
  Alert,
  Platform,
} from 'react-native';
import JuggleIM, {
  Conversation,
  Message,
  MessageContent,
  TextMessageContent,
  ImageMessageContent,
  VoiceMessageContent,
  FileMessageContent,
  SendMessageObject,
  MergeMessagePreviewUnit,
} from 'juggleim-rnsdk';
import {useNavigation, useRoute} from '@react-navigation/native';
import {getToken} from '../utils/auth';
import MessageHeader from '../components/MessageHeader';
import MessageComposer from '../components/MessageComposer';
import MessageBubble from '../components/MessageBubble';
import CustomMenu from '../components/CustomMenu';
import VoiceRecorder from '../components/VoiceRecorder';

const MessageListScreen = () => {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const {conversation} = route.params;

  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [menuVisible, setMenuVisible] = useState(false);
  const [menuPosition, setMenuPosition] = useState({x: 0, y: 0});
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [voiceRecorderVisible, setVoiceRecorderVisible] = useState(false);

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
    const listener = JuggleIM.addMessageListener('MessageListScreen', {
      onMessageReceive: (message: Message) => {
        if (
          message.conversation.conversationId === conversation.conversationId
        ) {
          setMessages(prev => [message, ...prev]);
          // Mark as read when received in active chat
          JuggleIM.clearUnreadCount(conversation);
        }
      },
      onMessageRecall: (message: Message) => {
        if (
          message.conversation.conversationId === conversation.conversationId
        ) {
          setMessages(prev =>
            prev.filter(m => m.messageId !== message.messageId),
          );
        }
      },
      onMessageDelete: (conv, clientMsgNos) => {
        if (conv.conversationId === conversation.conversationId) {
          setMessages(prev =>
            prev.filter(m => !clientMsgNos.includes(m.clientMsgNo)),
          );
        }
      },
    });
    return () => {
      listener();
    };
  }, [conversation]);

  const loadMessages = async () => {
    setIsLoading(true);
    try {
      const result = await JuggleIM.getMessageList(conversation, 0, {
        count: 20,
      });
      if (result && result.messages) {
        // Ensure messages are ordered from oldest -> newest for non-inverted list
        const sorted = result.messages.slice().sort((a, b) => a.timestamp - b.timestamp);
        setMessages(sorted);
      }
    } catch (error) {
      console.error('Failed to load messages:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadMoreMessages = async () => {
    if (messages.length === 0) return;
    setRefreshing(true);
    try {
      // messages state is ordered oldest->newest, so first element is the oldest
      const oldestMessage = messages[0];
      // Request messages older than the oldestMessage timestamp (exclusive)
      const startTime = Math.max(0, oldestMessage.timestamp);
      console.log('Requesting messages older than', startTime);
      const result = await JuggleIM.getMessageList(conversation, 0, {
        count: 20,
        startTime,
      });
      if (result && result.messages && result.messages.length > 0) {
        // Merge and dedupe by `clientMsgNo` to avoid duplicate keys
        const combined = [...result.messages, ...messages];
        const map = new Map<number, Message>();
        combined.forEach(m => {
          map.set(m.clientMsgNo, m);
        });
        const merged = Array.from(map.values()).slice().sort((a, b) => a.timestamp - b.timestamp);
        setMessages(merged);
      }
    } catch (error) {
      console.error('Failed to load more messages:', error);
    } finally {
      setRefreshing(false);
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
      setMessages(prev => [sentMessage, ...prev]);
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
      {text: 'Cancel', style: 'cancel'},
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
            setMessages(prev => [sentMessage, ...prev]);
          } catch (error) {
            console.error('Failed to send image:', error);
          }
        },
      },
    ]);
  };

  const handleVoicePress = async () => {
    Alert.alert('Voice', 'Sending mock voice message...', [
      {text: 'Cancel', style: 'cancel'},
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
              voiceContent,
            );
            setMessages(prev => [sentMessage, ...prev]);
          } catch (error) {
            console.error('Failed to send voice:', error);
          }
        },
      },
    ]);
  };

  const handleMessageLongPress = (message: Message, event?: any) => {
    setSelectedMessage(message);
    // Get touch position if available
    if (event?.nativeEvent) {
      setMenuPosition({
        x: event.nativeEvent.pageX,
        y: event.nativeEvent.pageY,
      });
    }
    setMenuVisible(true);
  };

  const getMenuOptions = () => {
    if (!selectedMessage) return [];

    const options = [];
    const isOutgoing = selectedMessage.direction === 1;

    // Copy option for text messages
    if (selectedMessage.content.contentType === 'jg:text') {
      options.push({
        label: 'Copy',
        onPress: () => {
          Clipboard.setString(
            (selectedMessage.content as TextMessageContent).content,
          );
        },
      });
    }

    // Recall option for outgoing messages
    if (isOutgoing) {
      options.push({
        label: 'Recall',
        onPress: () => {
          JuggleIM.recallMessage(selectedMessage.messageId)
            .then(() => {
              setMessages(prev =>
                prev.filter(m => m.messageId !== selectedMessage.messageId),
              );
            })
            .catch((e: any) => {
              console.error('Failed to recall message:', e);
              Alert.alert('Error', 'Failed to recall message');
            });
        },
      });
    }

    // Delete option
    options.push({
      label: 'Delete',
      destructive: true,
      onPress: () => {
        console.log('Deleting message:', selectedMessage, conversation);
        JuggleIM.deleteMessagesByClientMsgNoList(conversation, [
          selectedMessage.clientMsgNo,
        ])
          .then(() => {
            setMessages(prev =>
              prev.filter(m => m.messageId !== selectedMessage.messageId),
            );
          })
          .catch((e: any) => {
            console.error('Failed to delete message:', e);
            Alert.alert('Error', 'Failed to delete message');
          });
      },
    });

    return options;
  };

  const renderMessageItem = ({item}: {item: Message}) => {
    const isOutgoing = item.direction === 1;

    return (
      <View
        style={[
          styles.messageRow,
          isOutgoing ? styles.outgoingRow : styles.incomingRow,
        ]}>
        {!isOutgoing && (
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>
              {item.senderUserId?.substring(0, 1).toUpperCase() || '?'}
            </Text>
          </View>
        )}

        <MessageBubble
          message={item}
          isOutgoing={isOutgoing}
          onLongPress={() => handleMessageLongPress(item)}
        />

        {isOutgoing && (
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>
              {currentUserId?.substring(0, 1).toUpperCase() || 'Me'}
            </Text>
          </View>
        )}
      </View>
    );
  };

  const handleSendImage = async (file: {
    uri: string;
    type: string;
    name: string;
  }) => {
    const imageContent: ImageMessageContent = {
      contentType: 'jg:img',
      localPath: file.uri,
      width: 0, // SDK will handle this or we need to get it
      height: 0,
    };
    const message: SendMessageObject = {
      conversationType: conversation.conversationType,
      conversationId: conversation.conversationId,
      content: imageContent,
    };
    try {
      const sentMessage = await JuggleIM.sendImageMessage(message);
      setMessages(prev => [sentMessage, ...prev]);
    } catch (error) {
      console.error('Failed to send image:', error);
    }
  };

  const handleSendFile = async (file: {
    uri: string;
    type: string;
    name: string;
    size: number;
  }) => {
    const fileContent: FileMessageContent = {
      contentType: 'jg:file',
      localPath: file.uri,
      name: file.name,
      size: file.size,
      type: file.type,
    };
    const message: SendMessageObject = {
      conversationType: conversation.conversationType,
      conversationId: conversation.conversationId,
      content: fileContent,
    };
    try {
      const sentMessage = await JuggleIM.sendFileMessage(message);
      setMessages(prev => [sentMessage, ...prev]);
    } catch (error) {
      console.error('Failed to send file:', error);
    }
  };

  const handleSendVoice = async (file: {uri: string; duration: number}) => {
    const voiceContent: VoiceMessageContent = {
      contentType: 'jg:voice',
      localPath: file.uri,
      duration: file.duration,
    };
    try {
      const sentMessage = await JuggleIM.sendVoiceMessage(
        conversation.conversationType,
        conversation.conversationId,
        voiceContent,
      );
      setMessages(prev => [sentMessage, ...prev]);
    } catch (error) {
      console.error('Failed to send voice:', error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <MessageHeader
        conversation={conversation}
        title={conversation.conversationId}
        subtitle={
          conversation.conversationType === 1 ? 'Private Chat' : 'Group Chat'
        }
        onBack={() => navigation.goBack()}
      />

      <FlatList
        data={messages}
        renderItem={renderMessageItem}
        keyExtractor={item => item.clientMsgNo.toString()}
        inverted={false}
        contentContainerStyle={styles.listContent}
        onRefresh={loadMoreMessages}
        scrollEventThrottle={16}
        refreshing={refreshing}
        keyboardShouldPersistTaps={Platform.OS === 'ios' ? 'handled' : 'always'}
        ListFooterComponent={
          isLoading ? <ActivityIndicator style={{marginVertical: 10}} /> : null
        }
      />

      <MessageComposer
        onSend={handleSendText}
        onSendImage={handleSendImage}
        onSendFile={handleSendFile}
        onVoicePress={() => setVoiceRecorderVisible(true)}
      />

      <CustomMenu
        visible={menuVisible}
        onClose={() => setMenuVisible(false)}
        options={getMenuOptions()}
        position={menuPosition}
      />

      <VoiceRecorder
        visible={voiceRecorderVisible}
        onClose={() => setVoiceRecorderVisible(false)}
        onSend={handleSendVoice}
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
