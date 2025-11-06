/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React, {useEffect, useState, useRef} from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  useColorScheme,
  View,
  TouchableOpacity,
  Alert,
  Modal,
  FlatList,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';

import {Colors} from 'react-native/Libraries/NewAppScreen';
import JuggleIM, {
  ConversationInfo,
  TextMessageContent,
  Message,
  Conversation,
  ConversationType,
  ImageMessageContent,
} from 'im-rn-sdk';
import DocumentPicker from 'react-native-document-picker';
import {launchImageLibrary, launchCamera} from 'react-native-image-picker';

// 定义会话列表项组件的属性
interface ConversationListItemProps {
  item: ConversationInfo;
  onPress: () => void;
}

// 会话列表项组件
const ConversationListItem: React.FC<ConversationListItemProps> = ({
  item,
  onPress,
}) => {
  // 格式化时间显示
  const formatTime = (timestamp: number) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return `${date.getHours().toString().padStart(2, '0')}:${date
      .getMinutes()
      .toString()
      .padStart(2, '0')}`;
  };

  // 获取最后一条消息的内容
  const getLastMessageContent = () => {
    if (item.draft) {
      return `[草稿] ${item.draft}`;
    }

    if (item.lastMessage) {
      const {content} = item.lastMessage;
      switch (content.contentType) {
        case 'jg:text':
          return (content as TextMessageContent).content;
        case 'jg:img':
          return '[图片]';
        case 'jg:voice':
          return '[语音]';
        case 'jg:file':
          return '[文件]';
        default:
          return '未知消息类型';
      }
    }

    return '';
  };

  // 生成默认头像颜色
  const getDefaultAvatarColor = (id: string) => {
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
      hash = id.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = Math.abs(hash % 360);
    return `hsl(${hue}, 70%, 50%)`;
  };

  // 获取会话名称
  const getConversationName = () => {
    // 在实际应用中，这里应该从用户信息或者群组信息中获取
    // 此处简化处理，根据会话ID生成名称
    return `${item.conversation.conversationId}`;
  };

  return (
    <TouchableOpacity style={styles.conversationItem} onPress={onPress}>
      <View
        style={[
          styles.avatar,
          {
            backgroundColor: getDefaultAvatarColor(
              item.conversation.conversationId,
            ),
          },
        ]}>
        <Text style={styles.avatarText}>
          {getConversationName().substring(0, 2)}
        </Text>
      </View>
      <View style={styles.conversationInfo}>
        <View style={styles.conversationHeader}>
          <Text style={styles.conversationName} numberOfLines={1}>
            {getConversationName()}
          </Text>
          <Text style={styles.messageTime}>
            {formatTime(item.sortTime || item.topTime)}
          </Text>
        </View>
        <View style={styles.messageInfo}>
          <Text style={styles.lastMessage} numberOfLines={1}>
            {getLastMessageContent()}
          </Text>
          {item.unreadMessageCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadCount}>
                {item.unreadMessageCount > 99 ? '99+' : item.unreadMessageCount}
              </Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

// 消息项组件属性
interface MessageItemProps {
  item: Message;
  currentUserId: string;
}

// 消息项组件
const MessageItem: React.FC<MessageItemProps> = ({item, currentUserId}) => {
  const isSentByMe = item.direction === 1;

  // 格式化消息时间
  const formatMessageTime = (timestamp: number) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return `${date.getHours().toString().padStart(2, '0')}:${date
      .getMinutes()
      .toString()
      .padStart(2, '0')}`;
  };

  // 获取消息内容
  const getMessageContent = () => {
    switch (item.content.contentType) {
      case 'jg:text':
        return (item.content as TextMessageContent).content;
      case 'jg:img':
        const imageMsg = (item.content as ImageMessageContent).url;
        return '[图片]' + imageMsg;
      case 'jg:voice':
        return '[语音]';
      case 'jg:file':
        return '[文件]';
      default:
        return '[未知消息类型]' + item.content.contentType;
    }
  };

  // 生成默认头像颜色
  const getDefaultAvatarColor = (item: Message) => {
    // console.log('item', item);
    const id = item.senderUserId;
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
      hash = id.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = Math.abs(hash % 360);
    return `hsl(${hue}, 70%, 50%)`;
  };

  return (
    <View
      style={[
        styles.messageContainer,
        isSentByMe
          ? styles.sentMessageContainer
          : styles.receivedMessageContainer,
      ]}>
      {!isSentByMe && (
        <View
          style={[
            styles.avatar,
            {backgroundColor: getDefaultAvatarColor(item)},
          ]}>
          <Text style={styles.avatarText}>
            {item.senderUserId.substring(0, 2)}
          </Text>
        </View>
      )}

      <View style={styles.messageContentContainer}>
        <View
          style={[
            styles.messageBubble,
            isSentByMe
              ? styles.sentMessageBubble
              : styles.receivedMessageBubble,
          ]}>
          <Text
            style={[
              styles.messageText,
              isSentByMe ? styles.sentMessageText : styles.receivedMessageText,
            ]}>
            {getMessageContent()}
          </Text>
        </View>
        <Text style={styles.messageTimeText}>
          {formatMessageTime(item.timestamp)}
        </Text>
      </View>

      {isSentByMe && (
        <View
          style={[
            styles.avatar,
            {backgroundColor: getDefaultAvatarColor(item)},
          ]}>
          <Text style={styles.avatarText}>
            {item.senderUserId.substring(0, 2)}
          </Text>
        </View>
      )}
    </View>
  );
};

function App(): JSX.Element {
  const isDarkMode = useColorScheme() === 'dark';
  const [connectionStatus, setConnectionStatus] = useState('未连接');
  const [isInitialized, setIsInitialized] = useState(false);
  const [statusHistory, setStatusHistory] = useState<string[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [conversationList, setConversationList] = useState<ConversationInfo[]>(
    [],
  );
  const [messageModalVisible, setMessageModalVisible] = useState(false);
  const [messageList, setMessageList] = useState<Message[]>([]);
  const [currentConversation, setCurrentConversation] = useState<Conversation>({
    conversationId: '',
    conversationType: 1,
  });
  const [inputText, setInputText] = useState('');
  const flatListRef = useRef<FlatList>(null);

  const backgroundStyle = {
    backgroundColor: isDarkMode ? Colors.darker : Colors.lighter,
  };

  // SDK配置
  const imServer = 'wss://ws.snailchat.im';
  const appKey = 'nwm6fxqt2aeebhb7';
  const token1 =
    'ChBud202ZnhxdDJhZWViaGI3GiCuH1rw5sUNbzaUd35z0NugduYHIY2J3Fr6kXLVxvxx-g==';
  const token2 =
    'ChBud202ZnhxdDJhZWViaGI3GiDAln9OPZcTPWPNIdLzIgze03JIhfPqLPmdqEspQEX6AQ==';

  const t =
    'ChBud202ZnhxdDJhZWViaGI3GiDu8SYFf8xLMI1XOdyDZ4QCz8xL2QZIvI-etmJ3nqiXVg==';

  // 添加状态到历史记录
  const addStatusToHistory = (status: string) => {
    const timestamp = new Date().toLocaleTimeString();
    const statusWithTime = `[${timestamp}] ${status}`;
    setStatusHistory(prev => [statusWithTime, ...prev].slice(0, 2));
  };

  // 初始化SDK
  useEffect(() => {
    try {
      // 设置服务器地址
      JuggleIM.setServerUrls([imServer]);
      JuggleIM.init(appKey);
      setIsInitialized(true);

      // 添加连接状态监听器
      const unsubscribe = JuggleIM.addConnectionStatusListener(
        'demo',
        (status, code, extra) => {
          console.log('连接状态变化:', status, code, extra);
          let statusText = '';
          switch (status) {
            case 'connected':
              statusText = '已连接';
              break;
            case 'connecting':
              statusText = '连接中';
              break;
            case 'disconnected':
              statusText = '已断开';
              break;
            case 'failure':
              statusText = `连接失败 (${code})`;
              break;
            case 'dbOpen':
              statusText = '数据库已打开';
              break;
            case 'dbClose':
              statusText = '数据库已关闭';
              break;
            default:
              statusText = `未知状态: ${status}`;
          }
          setConnectionStatus(statusText);
        },
      );

      JuggleIM.addMessageListener('demo', {
        onMessageReceive: (message: any) => {
          console.log('收到消息:', message);
          addStatusToHistory(`收到消息: ${JSON.stringify(message)}`);

          // 如果当前正在查看消息列表，且是当前会话的消息，则更新消息列表
          if (
            messageModalVisible &&
            currentConversation &&
            message.conversation.conversationType ===
              currentConversation.conversationType &&
            message.conversation.conversationId ===
              currentConversation.conversationId
          ) {
            setMessageList(prev => [...prev, message]);

            // 滚动到底部
            setTimeout(() => {
              flatListRef.current?.scrollToEnd({animated: true});
            }, 100);
          }
        },
        onMessageUpdate: (message: any) => {
          console.log('消息更新:', message);
          addStatusToHistory(`消息更新: ${JSON.stringify(message)}`);
        },
        onMessageDelete: (_conv, messageIds) => {
          console.log('消息删除:', messageIds);
          addStatusToHistory(`消息删除: ${messageIds.join(', ')}`);
        },
      });

      JuggleIM.addConversationListener('demo', {
        onConversationInfoAdd: (conversations: ConversationInfo[]) => {
          console.log('会话添加:', conversations);
          addStatusToHistory(`会话添加: ${JSON.stringify(conversations)}`);
        },
        onConversationInfoUpdate: (conversations: ConversationInfo[]) => {
          // console.log('会话更新:', conversations);
          addStatusToHistory(`会话更新: ${JSON.stringify(conversations)}`);
        },
        onConversationInfoDelete: (conversations: ConversationInfo[]) => {
          console.log('会话删除:', conversations);
          addStatusToHistory(`会话删除: ${conversations.join(', ')}`);
        },
        onTotalUnreadMessageCountUpdate: (totalUnreadCount: number) => {
          console.log('未读消息总数更新:', totalUnreadCount);
          addStatusToHistory(`未读消息总数更新: ${totalUnreadCount}`);
        },
      });

      return () => {
        unsubscribe();
      };
    } catch (error) {
      console.error('SDK初始化失败:', error);
      Alert.alert('错误', 'SDK初始化失败');
    }
  }, []);

  // 连接到服务器
  const handleConnect1 = () => {
    if (!isInitialized) {
      Alert.alert('错误', 'SDK未初始化');
      return;
    }

    try {
      JuggleIM.connect(t);
    } catch (error) {
      console.error('连接失败:', error);
      Alert.alert('错误', '连接失败');
    }
  };

  // 连接到服务器
  const handleConnect2 = () => {
    if (!isInitialized) {
      Alert.alert('错误', 'SDK未初始化');
      return;
    }

    try {
      JuggleIM.connect(token2);
    } catch (error) {
      console.error('连接失败:', error);
      Alert.alert('错误', '连接失败');
    }
  };

  const getConversationList = async () => {
    try {
      const conversations = await JuggleIM.getConversationInfoList({
        count: 20,
        timestamp: -1,
        direction: 0,
      });
      console.log('会话列表:', conversations);
      setConversationList(conversations);
      setModalVisible(true);
    } catch (error) {
      console.error('获取会话列表失败:', error);
      Alert.alert('错误', '获取会话列表失败');
    }
  };

  const getMessageList = async (conv: Conversation) => {
    try {
      const result = await JuggleIM.getMessageList(conv, 0, {
        count: 20,
        startTime: -1,
      });

      result.messages?.map(item => {
        console.log('消息列表项:', item.content);
      });
      const messages = result.messages || [];
      setMessageList(messages);
      setMessageModalVisible(true);
    } catch (error) {
      console.error('获取消息列表失败:', error);
      Alert.alert('错误', '获取消息列表失败');
    }
  };

  // 发送消息
  const handleSend = () => {
    if (!inputText.trim() || !currentConversation) return;

    try {
      const content: TextMessageContent = {
        content: inputText,
        contentType: 'jg:text',
      };

      JuggleIM.sendMessage(
        {
          conversationType: currentConversation.conversationType,
          conversationId: currentConversation.conversationId,
          content: content,
        },
        {
          onError: (message, errorCode) => {
            console.log('消息发送失败:', message, errorCode);
          },
          onSuccess: message => {
            console.log('消息发送成功:', message);
          },
        },
      )
        .then((msg: Message) => {
          console.log('发送的消息:', msg);
          // 正确更新消息列表并清空输入框
          setMessageList(prev => {
            const newList = [...prev, msg];
            return newList;
          });
          setInputText('');

          // 滚动到底部
          setTimeout(() => {
            flatListRef.current?.scrollToEnd({animated: true});
          }, 100);
        })
        .catch(error => {
          console.error('发送消息失败:', error);
          Alert.alert('错误', '发送消息失败');
          // 即使发送失败也要清空输入框
          setInputText('');
        });
    } catch (error) {
      console.error('发送消息失败:', error);
      Alert.alert('错误', '发送消息失败');
      // 即使发送失败也要清空输入框
      setInputText('');
    }
  };

  // 渲染会话列表项
  const renderConversationItem = ({item}: {item: ConversationInfo}) => (
    <ConversationListItem
      item={item}
      onPress={() => {
        const conv = item.conversation;
        // 修复：正确获取会话属性值，避免Getter/Setter显示问题
        const conversationData = {
          conversationId: conv.conversationId,
          conversationType: conv.conversationType,
        };
        console.log('点击了会话:', conversationData);
        setCurrentConversation(conversationData);
        // 先关闭会话列表Modal
        setModalVisible(false);
        // 延迟打开消息列表Modal，确保会话列表Modal已经关闭
        getMessageList(conversationData);
      }}
    />
  );

  // 渲染消息列表项
  const renderMessageItem = ({item}: {item: Message}) => (
    <MessageItem item={item} currentUserId="currentUser" />
  );

  // 从相册选择图片
  const selectFromGallery = async () => {
    try {
      const result = await DocumentPicker.pick({
        type: [DocumentPicker.types.images],
        presentationStyle: 'fullScreen',
      });
      console.log('选择的图片:', result);
      if (result && result.length > 0) {
        const file = result[0];
        // 发送图片消息
        const imageContent: any = {
          contentType: 'jg:img',
          localPath: file.uri,
          thumbnailLocalPath: file.uri,
          width: 660, // 在实际应用中可以从图片EXIF信息中获取
          height: 660, // 在实际应用中可以从图片EXIF信息中获取
        };
        console.log('图片消息内容:', imageContent);
        JuggleIM.sendImageMessage(
          {
            conversationType: currentConversation.conversationType,
            conversationId: currentConversation.conversationId,
            content: imageContent,
          },
          {
            onProgress: (progress: number, message: Message) => {
              console.log('progress', progress);
            },
            onError: (message, errorCode) => {
              console.log('图片消息发送失败:', message, errorCode);
            },
            onSuccess: message => {
              console.log('图片消息发送成功:', message);
            },
            onCancel: message => {
              console.log('图片消息发送取消:', message);
            },
          },
        )
          .then(message => {
            console.log('图片消息发送...:', message);
            setMessageList(prev => [...prev, message]);
          })
          .catch(error => {
            console.error('图片消息发送失败:', error);
            Alert.alert('错误', '图片消息发送失败');
          });
      }
    } catch (err) {
      if (DocumentPicker.isCancel(err)) {
        // 用户取消选择
        console.log('用户取消选择');
      } else {
        console.error('选择文件出错:', err);
        throw err;
      }
    }
  };

  // 使用相机拍照
  const selectFromCamera = async () => {
    try {
      const result = await DocumentPicker.pick({
        type: [DocumentPicker.types.images],
        presentationStyle: 'fullScreen',
      });

      if (result && result.length > 0) {
        const file = result[0];
        // 发送图片消息
        const imageContent: any = {
          contentType: 'jg:img',
          localPath: file.uri,
          thumbnailLocalPath: file.uri,
          width: 0, // 在实际应用中可以从图片EXIF信息中获取
          height: 0, // 在实际应用中可以从图片EXIF信息中获取
        };

        JuggleIM.sendImageMessage(
          {
            conversationType: currentConversation.conversationType,
            conversationId: currentConversation.conversationId,
            content: imageContent,
          },
          {
            onProgress: (progress: number, message: Message) => {
              console.log('progress', progress);
            },
            onError: message => {
              console.log('success', message);
            },
            onSuccess: message => {
              console.log('图片消息发送失败:', error);
            },
            onCancel: message => {
              console.log('complete');
            },
          },
        )
          .then(message => {
            console.log('图片消息发送成功:', message);
            setMessageList(prev => [...prev, message]);
          })
          .catch(error => {
            console.error('图片消息发送失败:', error);
            Alert.alert('错误', '图片消息发送失败');
          });
      }
    } catch (err) {
      if (DocumentPicker.isCancel(err)) {
        // 用户取消选择
        console.log('用户取消选择');
      } else {
        console.error('拍照出错:', err);
        Alert.alert('错误', '拍照出错');
      }
    }
  };

  // 从文件系统选择文件
  const selectFromFile = async () => {
    try {
      const result = await DocumentPicker.pick({
        type: [DocumentPicker.types.allFiles],
        presentationStyle: 'fullScreen',
      });

      if (result && result.length > 0) {
        const file = result[0];

        // 根据文件类型发送不同类型消息
        if (file.type?.startsWith('image/')) {
          // 发送图片消息
          const imageContent: any = {
            contentType: 'jg:img',
            localPath: file.uri,
            width: 0, // 在实际应用中可以从图片EXIF信息中获取
            height: 0, // 在实际应用中可以从图片EXIF信息中获取
          };

          JuggleIM.sendImageMessage(
            {
              conversationType: currentConversation.conversationType,
              conversationId: currentConversation.conversationId,
              content: imageContent,
            },
            {
              onProgress: (progress: number, message: Message) => {
                console.log('progress', progress);
              },
              onError: (message, errorCode) => {
                console.log('图片消息发送失败:', message, errorCode);
              },
              onSuccess: message => {
                console.log('图片消息发送成功:', message);
              },
              onCancel: message => {
                console.log('图片消息发送取消:', message);
              },
            },
          )
            .then(message => {
              console.log('图片消息发送成功:', message);
              setMessageList(prev => [...prev, message]);
            })
            .catch(error => {
              console.error('图片消息发送失败:', error);
              Alert.alert('错误', '图片消息发送失败');
            });
        } else {
          // 发送文件消息
          const fileContent: any = {
            contentType: 'jg:file',
            localPath: file.uri,
            name: file.name || 'file',
            size: file.size || 0,
            type: file.type,
          };

          JuggleIM.sendFileMessage(
            currentConversation.conversationType,
            currentConversation.conversationId,
            fileContent,
          )
            .then(message => {
              console.log('文件消息发送成功:', message);
              setMessageList(prev => [...prev, message]);
            })
            .catch(error => {
              console.error('文件消息发送失败:', error);
              Alert.alert('错误', '文件消息发送失败');
            });
        }
      }
    } catch (err) {
      if (DocumentPicker.isCancel(err)) {
        // 用户取消选择
        console.log('用户取消选择');
      } else {
        console.error('选择文件出错:', err);
        Alert.alert('错误', '选择文件出错');
      }
    }
  };

  return (
    <SafeAreaView style={backgroundStyle}>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={backgroundStyle.backgroundColor}
      />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        style={backgroundStyle}>
        <View
          style={{
            backgroundColor: isDarkMode ? Colors.black : Colors.white,
          }}>
          <View style={styles.testContainer}>
            <Text style={styles.statusText}>连接状态: {connectionStatus}</Text>
            <TouchableOpacity
              style={[
                styles.connectButton,
                !isInitialized && styles.disabledButton,
              ]}
              onPress={handleConnect1}
              disabled={!isInitialized}>
              <Text style={styles.buttonText}>用户1</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.connectButton,
                !isInitialized && styles.disabledButton,
              ]}
              onPress={handleConnect2}
              disabled={!isInitialized}>
              <Text style={styles.buttonText}>用户2</Text>
            </TouchableOpacity>
          </View>

          {/* 状态历史记录 */}
          {/* <View style={styles.historyContainer}>
            {statusHistory.length === 0 ? (
              <Text style={styles.historyText}>暂无状态记录</Text>
            ) : (
              statusHistory.map((status, index) => (
                <Text key={index} style={styles.historyText}>
                  {status}
                </Text>
              ))
            )}
          </View> */}

          {/* <TouchableOpacity
            style={[
              styles.connectButton,
              !isInitialized && styles.disabledButton,
            ]}
            onPress={sendMsg.bind(this, '你好，JuggleIM！')}
            disabled={!isInitialized}>
            <Text style={styles.buttonText}>发消息</Text>
          </TouchableOpacity> */}
          <TouchableOpacity
            style={[
              styles.connectButton,
              !isInitialized && styles.disabledButton,
            ]}
            onPress={getConversationList}
            disabled={!isInitialized}>
            <Text style={styles.buttonText}>会话列表</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.connectButton,
              !isInitialized && styles.disabledButton,
            ]}
            onPress={getMessageList.bind(this, {
              conversationType: 1,
              conversationId: 'FnjQBq8bL-h',
            })}
            disabled={!isInitialized}>
            <Text style={styles.buttonText}>消息列表</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* 会话列表模态框 */}
      <Modal
        animationType="slide"
        transparent={false}
        visible={modalVisible}
        onRequestClose={() => {
          setModalVisible(false);
        }}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setModalVisible(false)}>
              <Text style={styles.closeButtonText}>×</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>会话列表</Text>
            <View style={{width: 40}} />
          </View>

          {conversationList.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>暂无会话</Text>
            </View>
          ) : (
            <FlatList
              data={conversationList}
              renderItem={renderConversationItem}
              keyExtractor={(_item, index) => index.toString()}
              style={styles.conversationList}
            />
          )}
        </View>
      </Modal>

      {/* 消息列表模态框 */}
      <Modal
        animationType="slide"
        transparent={false}
        visible={messageModalVisible}
        onRequestClose={() => {
          setMessageModalVisible(false);
        }}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoidingView}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setMessageModalVisible(false)}>
                <Text style={styles.closeButtonText}>×</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>消息列表</Text>
              <View style={{width: 40}} />
            </View>

            <FlatList
              ref={flatListRef}
              data={messageList}
              renderItem={renderMessageItem}
              keyExtractor={(item, index) =>
                item.clientMsgNo + '' || index.toString()
              }
              style={styles.messageList}
              contentContainerStyle={styles.messageListContent}
              onContentSizeChange={() =>
                flatListRef.current?.scrollToEnd({animated: true})
              }
            />

            {/* 输入区域 */}
            <View style={styles.inputContainer}>
              <View style={styles.mediaButtonContainer}>
                <TouchableOpacity
                  style={styles.mediaButton}
                  onPress={selectFromGallery}>
                  <Text style={styles.mediaButtonText}>相册</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.mediaButton}
                  onPress={selectFromCamera}>
                  <Text style={styles.mediaButtonText}>相机</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.mediaButton}
                  onPress={selectFromFile}>
                  <Text style={styles.mediaButtonText}>文件</Text>
                </TouchableOpacity>
              </View>
              <TextInput
                style={styles.textInput}
                value={inputText}
                onChangeText={setInputText}
                placeholder="请输入消息..."
                multiline={true}
              />
              <TouchableOpacity
                style={[
                  styles.sendButton,
                  !inputText.trim() && styles.sendButtonDisabled,
                ]}
                onPress={handleSend}
                disabled={!inputText.trim()}>
                <Text style={styles.sendButtonText}>发送</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  sectionContainer: {
    width: '100%',
    paddingHorizontal: 24,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '600',
  },
  sectionDescription: {
    marginTop: 8,
    fontSize: 18,
    fontWeight: '400',
  },
  highlight: {
    fontWeight: '700',
  },
  testContainer: {
    padding: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    marginTop: 8,
  },
  statusText: {
    fontSize: 16,
    marginBottom: 8,
    color: '#333',
  },
  connectButton: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginVertical: 16,
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 4,
  },
  configTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
    color: '#333',
  },
  configText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  historyContainer: {
    padding: 16,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    marginTop: 8,
  },
  historyText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
    // fontFamily: 'monospace',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#f0f0f0',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginTop: 55,
    paddingBottom: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    zIndex: 1, // 确保header在最上层，避免被遮挡
  },
  closeButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 28,
    color: '#007AFF',
    fontWeight: '300',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  conversationList: {
    flex: 1,
    backgroundColor: '#fff',
  },
  conversationItem: {
    flexDirection: 'row',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    alignItems: 'center',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  conversationInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  conversationName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
    flex: 1,
    marginRight: 8,
  },
  messageTime: {
    fontSize: 12,
    color: '#999',
  },
  messageInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lastMessage: {
    fontSize: 14,
    color: '#666',
    flex: 1,
    marginRight: 8,
  },
  unreadBadge: {
    backgroundColor: '#ff3b30',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  unreadCount: {
    color: '#fff',
    fontSize: 12,
    paddingHorizontal: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
  },
  messageList: {
    flex: 1,
    backgroundColor: '#f0f0f0',
  },
  messageListContent: {
    paddingVertical: 10,
  },
  messageContainer: {
    flexDirection: 'row',
    marginVertical: 5,
    marginHorizontal: 10,
  },
  sentMessageContainer: {
    justifyContent: 'flex-end',
  },
  receivedMessageContainer: {
    justifyContent: 'flex-start',
  },
  messageContentContainer: {
    maxWidth: '80%',
    alignItems: 'flex-end',
  },
  messageBubble: {
    borderRadius: 15,
    padding: 10,
    marginVertical: 2,
  },
  sentMessageBubble: {
    backgroundColor: '#0084ff',
    alignSelf: 'flex-end',
  },
  receivedMessageBubble: {
    backgroundColor: '#ffffff',
    alignSelf: 'flex-start',
  },
  messageText: {
    fontSize: 16,
  },
  sentMessageText: {
    color: '#ffffff',
  },
  receivedMessageText: {
    color: '#000000',
  },
  messageTimeText: {
    fontSize: 12,
    color: '#999',
    marginHorizontal: 10,
    marginTop: 2,
  },
  inputContainer: {
    flexDirection: 'column',
    alignItems: 'stretch',
    padding: 10,
    marginBottom: 20,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  mediaButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 10,
  },
  mediaButton: {
    backgroundColor: '#f0f0f0',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 16,
  },
  mediaButtonText: {
    color: '#007AFF',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 18,
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginRight: 10,
    maxHeight: 100,
    fontSize: 16,
    marginBottom: 10,
  },
  sendButton: {
    backgroundColor: '#007AFF',
    borderRadius: 18,
    paddingHorizontal: 20,
    paddingVertical: 10,
    justifyContent: 'center',
    alignSelf: 'flex-end',
  },
  sendButtonDisabled: {
    backgroundColor: '#ccc',
  },
  sendButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default App;
