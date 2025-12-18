import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  SafeAreaView,
  ActivityIndicator,
  Text,
  RefreshControl,
  ActionSheetIOS,
  Clipboard,
  Alert,
  Platform,
  Image,
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
  MessageMentionInfo,
  UserInfo,
} from 'juggleim-rnsdk';
import { useNavigation, useRoute } from '@react-navigation/native';
import { getToken, USER_ID_KEY } from '../utils/auth';
import MessageHeader from '../components/MessageHeader';
import MessageComposer, { MessageComposerRef, MentionInfo } from '../components/MessageComposer';
import MessageBubble from '../components/MessageBubble';
import GridMenu from '../components/GridMenu';




import VoiceRecorder from '../components/VoiceRecorder';
import MemberSelectionSheet from '../components/MemberSelectionSheet';
import CardMessageBubble from '../components/CardMessageBubble';

import UserInfoManager from '../manager/UserInfoManager';
import { GroupMember } from '../api/groups';
import { TextCardMessage } from '../messages/TextCardMessage';
import { BusinessCardMessage } from '../messages/BusinessCardMessage';
import AsyncStorage from '@react-native-async-storage/async-storage';

const MessageItem = ({
  item,
  currentUserId,
  onLongPress,
}: {
  item: Message;
  currentUserId: string;
  onLongPress: (message: Message, event?: any) => void;
}) => {
  const isOutgoing = item.direction === 1;
  const [avatar, setAvatar] = useState<string | undefined>(undefined);
  const [name, setName] = useState<string>(item.senderUserId || '');

  // Check if this is a system message
  const isSystemMessage = item.content.contentType === 'jgd:grpntf' || item.content.contentType === 'jgd:friendntf';

  useEffect(() => {
    let isMounted = true;
    const loadUserInfo = async () => {
      if (item.senderUserId) {
        const user = await UserInfoManager.getUserInfo(item.senderUserId);
        if (isMounted && user) {
          setAvatar(user.avatar);
          setName(user.nickname || user.user_id);
        }
      }
    };

    if (item.senderUserId) {
      const user = UserInfoManager.getUserInfoSync(item.senderUserId);
      if (user) {
        setAvatar(user.avatar);
        setName(user.nickname || user.user_id);
      } else {
        loadUserInfo();
      }
    }

    return () => {
      isMounted = false;
    };
  }, [item.senderUserId]);


  // Render system messages centered without avatars
  if (isSystemMessage) {
    return (
      <View style={styles.systemMessageRow}>
        <MessageBubble
          message={item}
          isOutgoing={isOutgoing}
          onLongPress={(anchor) => onLongPress(item, anchor)}
        />
      </View>
    );
  }

  return (
    <View
      style={[
        styles.messageRow,
        isOutgoing ? styles.outgoingRow : styles.incomingRow,
      ]}>
      {!isOutgoing && (
        <View style={styles.avatarContainer}>
          {avatar ? (
            <Image source={{ uri: avatar }} style={styles.avatarImage} />
          ) : (
            <Text style={styles.avatarText}>
              {name.substring(0, 1).toUpperCase() || '?'}
            </Text>
          )}
        </View>
      )}

      <MessageBubble
        message={item}
        isOutgoing={isOutgoing}
        onLongPress={(anchor) => onLongPress(item, anchor)}
      />

      {isOutgoing && (
        <View style={styles.avatarContainer}>
          {/* For current user we might also want to show avatar, but usually it's from profile. 
               For consistency let's try to load it too or just keep it simple. 
               The prompt asked to cache user info and use it. 
               Let's use the same logic for current user if available, or fallback to simple.
           */}
          <Text style={styles.avatarText}>
            {currentUserId?.substring(0, 1).toUpperCase() || 'Me'}
          </Text>
        </View>
      )}
    </View>
  );
};

const MessageListScreen = () => {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { conversation, title, unreadCount } = route.params;
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  // loading older messages (when scrolling to top)
  const [loadingMore, setLoadingMore] = useState(false);
  // refreshing to fetch newer messages (pull-to-refresh at bottom when inverted)
  const [refreshingNew, setRefreshingNew] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [menuVisible, setMenuVisible] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState<{ x: number; y: number; width: number; height: number } | undefined>(undefined);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [voiceRecorderVisible, setVoiceRecorderVisible] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [groupMembers, setGroupMembers] = useState<GroupMember[]>([]);
  const flatListRef = useRef<FlatList<Message> | null>(null);
  const didInitialScroll = useRef(false);
  const [memberSheetVisible, setMemberSheetVisible] = useState(false);
  const messageComposerRef = useRef<MessageComposerRef>(null);
  const [quotedMessage, setQuotedMessage] = useState<Message | null>(null);
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);

  useEffect(() => {
    const fetchUserId = async () => {
      const userId = await AsyncStorage.getItem(USER_ID_KEY);
      if (userId) {
        setCurrentUserId(userId);
      }
    };
    fetchUserId();

    // Load group members if this is a group conversation
    const loadGroupMembers = async () => {
      if (conversation.conversationType === 2) { // GROUP
        const groupInfo = await UserInfoManager.getGroupInfo(conversation.conversationId);
        if (groupInfo && groupInfo.members) {
          setGroupMembers(groupInfo.members);
        }
      }
    };
    loadGroupMembers();

    // Clear unread count on entry
    if (unreadCount > 0) {
      JuggleIM.clearUnreadCount(conversation);
    }

    loadMessages();
    const msgUpdateListener = JuggleIM.addMessageListener('MessageListScreen', {
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
      onMessageUpdate: (message: Message) => {
        if (
          message.conversation.conversationId === conversation.conversationId
        ) {
          setMessages(prev =>
            prev.map(m => m.messageId === message.messageId ? message : m),
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

    const msgDestoryLisener = JuggleIM.addMessageDestroyListener('MessageListScreen', {
      onMessageDestroyTimeUpdate: (messageId, conversation, destroyTiem) => {
        console.log('onMessageDestroyTimeUpdate', messageId, conversation, destroyTiem);
      }
    })
    return () => {
      msgUpdateListener();
      msgDestoryLisener();
    };
  }, [conversation]);

  const loadMessages = async () => {
    setIsLoading(true);
    setHasMore(true);
    try {
      const result = await JuggleIM.getMessageList(conversation, 0, {
        count: 20,
      });
      // console.log('Loaded messages:', result.code, result.messages);
      if (result && result.code === 0 && result.messages) {
        // Ensure messages are ordered newest -> oldest for inverted list
        const sorted = result.messages
          .slice()
          .sort((a, b) => b.timestamp - a.timestamp);
        setMessages(sorted);
        if (result.messages.length < 20) {
          setHasMore(false);
        } else {
          setHasMore(true);
        }

        // Send read receipt for loaded messages if there are any
        if (sorted.length > 0) {
          const messageIds = sorted
            .map(msg => msg.messageId)
            .filter(id => id && id.length > 0);

          if (messageIds.length > 0 && unreadCount > 0) {
            JuggleIM.sendReadReceipt(conversation, messageIds).then(() => {
              console.log('Read receipt sent for', messageIds);
            }).catch(error => {
              console.error('Failed to send read receipt:', error);
            });
          }
        }
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error('Failed to load messages:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadMoreMessages = async () => {
    if (messages.length === 0) {
      console.log('No messages to load more');
      return;
    }
    if (loadingMore || !hasMore || isLoading) {
      return;
    }
    setLoadingMore(true);
    try {
      let startTime = 0;
      if (messages.length > 0) {
        const oldestMessage = messages[messages.length - 1];
        startTime = Math.max(0, oldestMessage.timestamp - 1);
      }
      console.log('Requesting messages older than', startTime);
      const result = await JuggleIM.getMessageList(conversation, 0, {
        count: 20,
        startTime,
      });
      if (result && result.messages && result.messages.length > 0) {
        // Append older messages to the end (since we keep newest->oldest)
        const combined = [...messages, ...result.messages];
        const map = new Map<number, Message>();
        combined.forEach(m => {
          map.set(m.clientMsgNo, m);
        });
        // Ensure newest->oldest order
        const merged = Array.from(map.values()).sort(
          (a, b) => b.timestamp - a.timestamp,
        );
        setMessages(merged);
        if (result.messages.length < 20) {
          setHasMore(false);
        }
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error('Failed to load more messages:', error);
    } finally {
      setLoadingMore(false);
    }
  };

  const loadNewMessages = async () => {
    console.log('Loading new messages', messages.length);
    if (messages.length === 0) {
      return;
    }
    if (refreshingNew || isLoading) {
      return;
    }
    setRefreshingNew(true);
    try {
      // messages[0] is newest
      const newest = messages[0];
      const startTime = newest ? newest.timestamp + 1 : 0;
      const result = await JuggleIM.getMessageList(conversation, 0, {
        count: 20,
        startTime,
      });
      console.log('Loaded new messages:', result);
      if (result && result.messages && result.messages.length > 0) {
        const combined = [...result.messages, ...messages];
        const map = new Map<number, Message>();
        combined.forEach(m => map.set(m.clientMsgNo, m));
        const merged = Array.from(map.values()).sort(
          (a, b) => b.timestamp - a.timestamp,
        );
        setMessages(merged);
      }
    } catch (e) {
      console.error('Failed to load new messages:', e);
    } finally {
      setRefreshingNew(false);
    }
  };

  const handleSendText = async (text: string, mentions: MentionInfo[]) => {
    // Check if we're editing a message
    if (editingMessage) {
      const textContent: TextMessageContent = {
        contentType: 'jg:text',
        content: text,
      };

      try {
        const updatedMessage = await JuggleIM.updateMessage(
          editingMessage.messageId,
          textContent,
          conversation,
        );
        setMessages(prev =>
          prev.map(m => m.messageId === editingMessage.messageId ? updatedMessage : m),
        );
        setEditingMessage(null);
        messageComposerRef.current?.setEditingMessage(null);
      } catch (error) {
        console.error('Failed to update message:', error);
        Alert.alert('Error', 'Failed to update message');
      }
      return;
    }

    const textContent: TextMessageContent = {
      contentType: 'jg:text',
      content: text,
    };

    // Build mention info if there are mentions
    let mentionInfo: MessageMentionInfo | undefined;
    if (mentions.length > 0) {
      const hasAtAll = mentions.some(m => m.userId === 'all');
      const targetUsers: UserInfo[] = mentions
        .filter(m => m.userId !== 'all')
        .map(m => ({
          userId: m.userId,
          nickname: m.nickname,
          avatar: '',
        }));

      // Determine mention type
      let mentionType = 0; // DEFAULT
      if (hasAtAll && targetUsers.length > 0) {
        mentionType = 3; // ALL_AND_SOMEONE
      } else if (hasAtAll) {
        mentionType = 1; // ALL
      } else if (targetUsers.length > 0) {
        mentionType = 2; // SOMEONE
      }

      mentionInfo = {
        type: mentionType,
        targetUsers,
      };
    }

    const messageToSend: SendMessageObject = {
      conversationType: conversation.conversationType,
      conversationId: conversation.conversationId,
      content: textContent,
      mentionInfo,
      referredMessageId: quotedMessage?.messageId,
    };

    JuggleIM.sendMessage(messageToSend, {
      onSuccess: (message: Message) => {
        console.log('Message sent successfully', message);
        setMessages(prev => [message, ...prev]);
      },
      onError: (message: Message, errorCode: number) => {
        console.error('Failed to send message:', errorCode);
      },
    });
    if (quotedMessage) {
      setQuotedMessage(null);
      messageComposerRef.current?.setQuotedMessage(null, '');
    }
  };

  const handleAtPress = () => {
    setMemberSheetVisible(true);
  };

  const handleMemberSelect = (member: GroupMember | 'all') => {
    if (member === 'all') {
      messageComposerRef.current?.addMention('all', '所有人');
    } else {
      messageComposerRef.current?.addMention(member.user_id, member.nickname || member.user_id);
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
            height: 600,
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

  const handleMessageLongPress = (message: Message, anchor?: { x: number; y: number; width: number; height: number }) => {
    setSelectedMessage(message);
    if (anchor) {
      setMenuAnchor(anchor);
    }
    setMenuVisible(true);
  };

  const getMenuOptions = () => {
    if (!selectedMessage) {
      return [];
    }

    const options = [];
    const isOutgoing = selectedMessage.direction === 1;
    const isTextMessage = selectedMessage.content.contentType === 'jg:text';

    // Copy
    if (isTextMessage) {
      options.push({
        label: '复制',
        onPress: () => {
          Clipboard.setString(
            (selectedMessage.content as TextMessageContent).content,
          );
          setMenuVisible(false);
        },
        icon: require('../assets/icons/copy.png'),
      });
    }

    // Forward (placeholder)
    options.push({
      label: '转发',
      onPress: () => {
        setMenuVisible(false);
        Alert.alert('转发', '功能即将推出');
      },
      icon: require('../assets/icons/send_message.png'),
    });

    // Delete
    options.push({
      label: '删除',
      onPress: () => {
        setMenuVisible(false);
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
      icon: require('../assets/icons/delete_light.png'),
    });

    // Quote
    options.push({
      label: '引用',
      onPress: async () => {
        const composerRef = messageComposerRef.current;
        const messageToQuote = selectedMessage;

        setMenuVisible(false);

        let senderName = messageToQuote.senderUserId;
        const userInfo = await UserInfoManager.getUserInfo(messageToQuote.senderUserId);
        if (userInfo) {
          senderName = userInfo.nickname || userInfo.user_id;
        }

        if (composerRef) {
          setQuotedMessage(messageToQuote);
          composerRef.setQuotedMessage(messageToQuote, senderName);
        }
      },
      icon: require('../assets/icons/refer.png'),
    });

    // Translate
    if (isTextMessage) {
      options.push({
        label: '翻译',
        onPress: () => {
          setMenuVisible(false);
          Alert.alert('翻译', '翻译功能即将推出');
        },
        icon: require('../assets/icons/translate.png'),
      });
    }

    // Recall
    if (isOutgoing) {
      options.push({
        label: '撤回',
        onPress: () => {
          setMenuVisible(false);
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
        icon: require('../assets/icons/recall.png'),
      });
    }

    // Edit 
    if (isOutgoing && isTextMessage) {
      options.push({
        label: '编辑',
        onPress: () => {
          setMenuVisible(false);
          setEditingMessage(selectedMessage);
          messageComposerRef.current?.setEditingMessage(selectedMessage);
        },
        icon: require('../assets/icons/edit.png'),
      });
    }

    return options;
  };

  const renderMessageItem = ({ item }: { item: Message }) => {
    return (
      <MessageItem
        item={item}
        currentUserId={currentUserId}
        onLongPress={handleMessageLongPress}
      />
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
      width: 300,
      height: 600,
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

  const handleSendVoice = async (file: { uri: string; duration: number }) => {
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

  const handleSendCard = async (title: string, description: string, url: string) => {
    const cardMsg = new TextCardMessage(title, description, url);
    const messageToSend: SendMessageObject = {
      conversationType: conversation.conversationType,
      conversationId: conversation.conversationId,
      content: cardMsg as any,
    };

    try {
      JuggleIM.sendMessage(messageToSend, {
        onSuccess: (message: Message) => {
          console.log('Message sent successfully', message);
          setMessages(prev => [message, ...prev]);
        },
        onError: (message: Message, errorCode: number) => {
          console.error('Failed to send message:', errorCode);
        },
      });
    } catch (error) {
      console.error('Failed to send card message:', error);
      Alert.alert('Error', 'Failed to send card message');
    }
  };

  const handleSendBusinessCard = async (userId: string, nickname: string, avatar: string) => {
    const businessCardMsg = new BusinessCardMessage(userId, nickname, avatar);
    const messageToSend: SendMessageObject = {
      conversationType: conversation.conversationType,
      conversationId: conversation.conversationId,
      content: businessCardMsg as any,
    };

    try {
      JuggleIM.sendMessage(messageToSend, {
        onSuccess: (message: Message) => {
          console.log('Message sent successfully', message);
          setMessages(prev => [message, ...prev]);
        },
        onError: (message: Message, errorCode: number) => {
          console.error('Failed to send message:', errorCode);
        },
      });
    } catch (error) {
      console.error('Failed to send business card message:', error);
      Alert.alert('Error', 'Failed to send business card message');
    }
  };

  // Auto-scroll to newest (index 0) after initial load
  useEffect(() => {
    if (!isLoading && messages.length > 0 && !didInitialScroll.current) {
      didInitialScroll.current = true;
      setTimeout(() => {
        flatListRef.current?.scrollToIndex({ index: 0, animated: false });
      }, 50);
    }
  }, [isLoading, messages]);

  return (
    <SafeAreaView style={styles.container}>
      <MessageHeader
        conversation={conversation}
        title={title || conversation.conversationId}
        subtitle={
          conversation.conversationType === 1 ? 'Private Chat' : 'Group Chat'
        }
        onBack={() => navigation.goBack()}
        onInfoPress={() => navigation.navigate('ConversationInfo', { conversation, title })}
      />

      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessageItem}
        keyExtractor={item => item.clientMsgNo?.toString()}
        inverted={true}
        contentContainerStyle={styles.listContent}
        // Pull-to-refresh (fetch newer messages). For inverted list this appears at the bottom.
        refreshControl={
          <RefreshControl
            refreshing={refreshingNew}
            onRefresh={loadNewMessages}
          />
        }
        // When user scrolls to the top (older messages), load more
        onEndReached={loadMoreMessages}
        onEndReachedThreshold={0.5}
        scrollEventThrottle={16}
        keyboardShouldPersistTaps={Platform.OS === 'ios' ? 'handled' : 'always'}
        // Inverted List: ListFooterComponent is at the TOP (visually). Use this for "Loading History" spinner.
        ListFooterComponent={
          loadingMore ? (
            <ActivityIndicator style={styles.spinner} />
          ) : null
        }
        // Inverted List: ListHeaderComponent is at the BOTTOM (visually).
        ListHeaderComponent={null}
      />

      <MessageComposer
        ref={messageComposerRef}
        conversationType={conversation.conversationType}
        conversationId={conversation.conversationId}
        onSend={handleSendText}
        onSendImage={handleSendImage}
        onSendFile={handleSendFile}
        onSendCard={handleSendCard}
        onSendBusinessCard={handleSendBusinessCard}
        onVoicePress={() => setVoiceRecorderVisible(true)}
        onAtPress={handleAtPress}
      />

      <GridMenu
        visible={menuVisible}
        onClose={() => setMenuVisible(false)}
        options={getMenuOptions()}
        anchor={menuAnchor}
      />

      <VoiceRecorder
        visible={voiceRecorderVisible}
        onClose={() => setVoiceRecorderVisible(false)}
        onSend={handleSendVoice}
      />

      <MemberSelectionSheet
        visible={memberSheetVisible}
        members={groupMembers}
        onClose={() => setMemberSheetVisible(false)}
        onSelectMember={handleMemberSelect}
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
  systemMessageRow: {
    flexDirection: 'row',
    marginBottom: 16,
    justifyContent: 'center',
    alignItems: 'center',
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
    overflow: 'hidden',
  },
  avatarImage: {
    width: 32,
    height: 32,
  },
  avatarText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  spinner: {
    marginVertical: 10,
  },
});

export default MessageListScreen;
