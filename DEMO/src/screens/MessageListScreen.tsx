import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  Text,
  Clipboard,
  Alert,
  Image,
} from 'react-native';
// InteractionManager removed; auto-scrolling handled inside MessageList
import JuggleIM, {
  Message,
  TextMessageContent,
  ImageMessageContent,
  VoiceMessageContent,
  FileMessageContent,
  SendMessageObject,
  MessageMentionInfo,
  UserInfo,
  JuggleIMCall,
  CallMediaType,
} from 'juggleim-rnsdk';
import { useNavigation, useRoute } from '@react-navigation/native';
import { USER_ID_KEY } from '../utils/auth';
import MessageHeader from '../components/MessageHeader';
import MessageComposer, { MessageComposerRef, MentionInfo } from '../components/MessageComposer';
import MessageBubble from '../components/MessageBubble';
import GridMenu from '../components/GridMenu';
import VoiceRecorder from '../components/VoiceRecorder';
import MemberSelectionSheet from '../components/MemberSelectionSheet';
import UserInfoManager from '../manager/UserInfoManager';
import { GroupMember } from '../api/groups';
import { TextCardMessage } from '../messages/TextCardMessage';
import { BusinessCardMessage } from '../messages/BusinessCardMessage';
import AsyncStorage from '@react-native-async-storage/async-storage';
import MessageList, { MessageListRef } from '../components/MessageList';

const DEFAULT_MESSAGE_COUNT = 30;

const MessageItem = ({
  item,
  currentUserId,
  onLongPress,
  messageStatus,
}: {
  item: Message;
  currentUserId: string;
  onLongPress: (message: Message, event?: any) => void;
  messageStatus?: { progress: number; error: boolean };
}) => {
  const isOutgoing = item.direction === 1;
  const name = item.senderUserName || item.senderUserId || '';
  const avatar = item.senderUserAvatar || '';

  // Check if this is a system message
  const isSystemMessage = item.content.contentType === 'jgd:grpntf' || item.content.contentType === 'jgd:friendntf';

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
        messageStatus={messageStatus}
      />

      {isOutgoing && (
        <View style={styles.avatarContainer}>
          {
            avatar ? (
              <Image source={{ uri: avatar }} style={styles.avatarImage} />
            ) : (
              <Text style={styles.avatarText}>
                {currentUserId?.substring(0, 1).toUpperCase() || 'Me'}
              </Text>
            )
          }
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
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [loadingNewer, setLoadingNewer] = useState(false);
  const loadingInitial = useRef(false);
  const [hasPrev, setHasPrev] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [menuVisible, setMenuVisible] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState<{ x: number; y: number; width: number; height: number } | undefined>(undefined);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [voiceRecorderVisible, setVoiceRecorderVisible] = useState(false);
  const [groupMembers, setGroupMembers] = useState<GroupMember[]>([]);

  // Track message sending status: { messageId: { progress: number, error: boolean } }
  const [messageStatus, setMessageStatus] = useState<Map<number, { progress: number; error: boolean }>>(new Map());

  const listRef = useRef<MessageListRef>(null);
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
    JuggleIM.clearUnreadCount(conversation);

    loadInitialMessages();
    const msgUpdateListener = JuggleIM.addMessageListener('MessageListScreen', {
      onMessageReceive: (message: Message) => {
        if (
          message.conversation.conversationId === conversation.conversationId
          && message.conversation.conversationType === conversation.conversationType
        ) {
          setMessages(prev => [message, ...prev]);
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

  const loadInitialMessages = async () => {
    try {
      loadingInitial.current = true;
      const result = await JuggleIM.getMessageList(conversation, 1, {
        count: DEFAULT_MESSAGE_COUNT,
        startTime: 0,
      });
      if (result && result.messages) {
        // Sort Old -> New (Ascending) for normal list
        const sorted = result.messages.sort((a, b) => a.timestamp - b.timestamp);
        console.log('消息列表', result);
        console.log('loadInitialMessages', sorted.length, result.hasMore, "n:" + sorted[sorted.length - 1].timestamp, "o:" + sorted[0].timestamp);
        setMessages(sorted);
        setHasPrev(result.hasMore);
        requestAnimationFrame(() => {
          console.log('loadInitialMessages end');
          setTimeout(() => {
            loadingInitial.current = false;
          }, 300);
        });
      }
    } catch (error) {
      console.error('Failed to load initial messages:', error);
    }
  };

  const loadHistory = async () => {
    if (loadingHistory || !hasPrev || loadingInitial.current) return;
    setLoadingHistory(true);
    try {
      console.log('Loading history start: ', messages[0].timestamp);
      const result = await JuggleIM.getMessageList(conversation, 1, {
        count: DEFAULT_MESSAGE_COUNT,
        startTime: messages[0].timestamp - 1,
      });
      if (result && result.messages && result.messages.length > 0) {
        const oldMessages = result.messages.sort((a, b) => a.timestamp - b.timestamp);
        console.log('loadHistory sorted', oldMessages.length, result.hasMore, "n:" + oldMessages[oldMessages.length - 1].timestamp, "o:" + oldMessages[0].timestamp);
        setMessages(prev => [...oldMessages, ...prev]);
        setHasPrev(result.hasMore);
      } else {
        setHasPrev(false);
      }
      setLoadingHistory(false);
    } catch (error) {
      console.error('Failed to load history:', error);
    } finally {
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
        setMessages(prev => [...prev, message]);
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
            // 先发送消息并添加到列表
            const sentMessage = await JuggleIM.sendImageMessage(messageToSend, {
              onProgress: (progress: number, msg: Message) => {
                // 通过messageId更新已存在消息的进度
                setMessageStatus(prev => new Map(prev).set(msg.clientMsgNo, { progress, error: false }));
              },
              onSuccess: (msg: Message) => {
                // 发送成功,清除进度状态
                setMessageStatus(prev => {
                  const newMap = new Map(prev);
                  newMap.delete(msg.clientMsgNo);
                  return newMap;
                });
                // 更新消息列表中的消息状态
                setMessages(prev => prev.map(m => m.clientMsgNo === msg.clientMsgNo ? msg : m));
              },
              onError: (msg: Message, errorCode: number) => {
                console.error('Failed to send image:', errorCode);
                // 标记消息为错误状态
                setMessageStatus(prev => new Map(prev).set(msg.clientMsgNo, { progress: 0, error: true }));
                // 更新消息列表中的消息状态
                setMessages(prev => prev.map(m => m.clientMsgNo === msg.clientMsgNo ? msg : m));
              },
            });
            // 立即添加到消息列表
            setMessages(prev => [...prev, sentMessage]);
          } catch (error) {
            console.error('Failed to send image:', error);
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
    // console.log('renderMessageItem', item.messageId);
    const status = messageStatus.get(item.clientMsgNo);
    return (
      <MessageItem
        item={item}
        currentUserId={currentUserId}
        onLongPress={handleMessageLongPress}
        messageStatus={status}
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
      // 先发送消息并添加到列表
      const sentMessage = await JuggleIM.sendImageMessage(message, {
        onProgress: (progress: number, msg: Message) => {
          // 通过messageId更新已存在消息的进度
          setMessageStatus(prev => new Map(prev).set(msg.clientMsgNo, { progress, error: false }));
        },
        onSuccess: (msg: Message) => {
          // 发送成功,清除进度状态
          setMessageStatus(prev => {
            const newMap = new Map(prev);
            newMap.delete(msg.clientMsgNo);
            return newMap;
          });
          // 更新消息列表中的消息状态
          setMessages(prev => prev.map(m => m.clientMsgNo === msg.clientMsgNo ? msg : m));
        },
        onError: (msg: Message, errorCode: number) => {
          console.error('Failed to send image:', errorCode);
          // 标记消息为错误状态
          setMessageStatus(prev => new Map(prev).set(msg.clientMsgNo, { progress: 0, error: true }));
          // 更新消息列表中的消息状态
          setMessages(prev => prev.map(m => m.clientMsgNo === msg.clientMsgNo ? msg : m));
        },
      });
      // 立即添加到消息列表
      setMessages(prev => [...prev, sentMessage]);
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
      // 先发送消息并添加到列表
      const sentMessage = await JuggleIM.sendFileMessage(message, {
        onProgress: (progress: number, msg: Message) => {
          // 通过messageId更新已存在消息的进度
          setMessageStatus(prev => new Map(prev).set(msg.clientMsgNo, { progress, error: false }));
        },
        onSuccess: (msg: Message) => {
          // 发送成功,清除进度状态
          setMessageStatus(prev => {
            const newMap = new Map(prev);
            newMap.delete(msg.clientMsgNo);
            return newMap;
          });
          // 更新消息列表中的消息状态
          setMessages(prev => prev.map(m => m.clientMsgNo === msg.clientMsgNo ? msg : m));
        },
        onError: (msg: Message, errorCode: number) => {
          console.error('Failed to send file:', errorCode);
          // 标记消息为错误状态
          setMessageStatus(prev => new Map(prev).set(msg.clientMsgNo, { progress: 0, error: true }));
          // 更新消息列表中的消息状态
          setMessages(prev => prev.map(m => m.clientMsgNo === msg.clientMsgNo ? msg : m));
        },
      });
      // 立即添加到消息列表
      setMessages(prev => [...prev, sentMessage]);
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
    const message: SendMessageObject = {
      conversationType: conversation.conversationType,
      conversationId: conversation.conversationId,
      content: voiceContent,
    };

    try {
      // 先发送消息并添加到列表
      const sentMessage = await JuggleIM.sendVoiceMessage(message, {
        onProgress: (progress: number, msg: Message) => {
          // 通过messageId更新已存在消息的进度
          setMessageStatus(prev => new Map(prev).set(msg.clientMsgNo, { progress, error: false }));
        },
        onSuccess: (msg: Message) => {
          // 发送成功,清除进度状态
          setMessageStatus(prev => {
            const newMap = new Map(prev);
            newMap.delete(msg.clientMsgNo);
            return newMap;
          });
          // 更新消息列表中的消息状态
          setMessages(prev => prev.map(m => m.clientMsgNo === msg.clientMsgNo ? msg : m));
        },
        onError: (msg: Message, errorCode: number) => {
          console.error('Failed to send voice:', errorCode);
          // 标记消息为错误状态
          setMessageStatus(prev => new Map(prev).set(msg.clientMsgNo, { progress: 0, error: true }));
          // 更新消息列表中的消息状态
          setMessages(prev => prev.map(m => m.clientMsgNo === msg.clientMsgNo ? msg : m));
        },
      });
      // 立即添加到消息列表
      setMessages(prev => [...prev, sentMessage]);
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
          setMessages(prev => [...prev, message]);
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
          setMessages(prev => [...prev, message]);
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
        onVideoCallPress={() => {
          if (conversation.conversationType === 1) { // Single Chat
            JuggleIMCall.startSingleCall(conversation.conversationId, CallMediaType.VIDEO)
              .then(session => {
                navigation.navigate('VideoCall', { callId: session.callId, isIncoming: false });
              })
              .catch(e => {
                console.error('Start call failed', e);
                Alert.alert('Error', 'Start call failed');
              });
          } else { // Group Chat
            navigation.navigate('CallSelectMember', { conversationId: conversation.conversationId });
          }
        }}
      />

      <MessageList
        ref={listRef}
        messages={messages}
        renderItem={renderMessageItem}
        onLoadPrev={loadHistory}
        hasPrev={hasPrev}
        loadingPrev={loadingHistory} // Visual top loader (history)
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
    // backgroundColor: 'red',
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
