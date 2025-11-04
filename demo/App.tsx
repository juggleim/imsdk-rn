/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React, {useEffect, useState} from 'react';
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
  Button,
} from 'react-native';

import {Colors} from 'react-native/Libraries/NewAppScreen';
import JuggleIM, {
  ConversationInfo,
  PullDirection,
  TextMessageContent,
} from 'im-rn-sdk';

function App(): JSX.Element {
  const isDarkMode = useColorScheme() === 'dark';
  const [connectionStatus, setConnectionStatus] = useState('未连接');
  const [isInitialized, setIsInitialized] = useState(false);
  const [statusHistory, setStatusHistory] = useState<string[]>([]);

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
        },
        onMessageUpdate: (message: any) => {
          console.log('消息更新:', message);
          addStatusToHistory(`消息更新: ${JSON.stringify(message)}`);
        },
        onMessageDelete: (conv, messageIds) => {
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
          console.log('会话更新:', conversations);
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
      JuggleIM.connect(token1);
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

  const sendMsg = (txt: string) => {
    try {
      const content: TextMessageContent = {
        content: txt,
        contentType: 'jg:text',
      };
      JuggleIM.sendMessage(
        {
          conversationType: 1,
          conversationId: 'FnjQBq8bL-h',
          content: content,
        },
        (error, message) => {
          if (error) {
            console.error('发送消息出错:', error);
          } else {
            console.log('消息发送成功:', message);
          }
        },
      );
    } catch (error) {
      console.error('发送消息失败:', error);
      Alert.alert('错误', '发送消息失败');
    }
  };

  const getConversationList = () => {
    try {
      JuggleIM.getConversationInfoList({
        count: 20,
        timestamp: -1,
        direction: 0,
      }).then(conversations => {
        console.log('会话列表:', conversations);
      });
    } catch (error) {
      console.error('获取会话列表失败:', error);
      Alert.alert('错误', '获取会话列表失败');
    }
  };

  const getMessageList = () => {
    try {
      JuggleIM.getMessageList(
        {
          conversationType: 1,
          conversationId: 'FnjQBq8bL-h',
        },
        1,
        {
          count: 20,
          startTime: -1,
        },
      ).then(messages => {
        console.log('消息列表:', messages);
      });
    } catch (error) {
      console.error('获取消息列表失败:', error);
      Alert.alert('错误', '获取消息列表失败');
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
          <View style={styles.historyContainer}>
            {statusHistory.length === 0 ? (
              <Text style={styles.historyText}>暂无状态记录</Text>
            ) : (
              statusHistory.map((status, index) => (
                <Text key={index} style={styles.historyText}>
                  {status}
                </Text>
              ))
            )}
          </View>

          <TouchableOpacity
            style={[
              styles.connectButton,
              !isInitialized && styles.disabledButton,
            ]}
            onPress={sendMsg.bind(this, '你好，JuggleIM！')}
            disabled={!isInitialized}>
            <Text style={styles.buttonText}>发消息</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.connectButton,
              !isInitialized && styles.disabledButton,
            ]}
            onPress={getConversationList.bind(this)}
            disabled={!isInitialized}>
            <Text style={styles.buttonText}>会话列表</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.connectButton,
              !isInitialized && styles.disabledButton,
            ]}
            onPress={getMessageList.bind(this)}
            disabled={!isInitialized}>
            <Text style={styles.buttonText}>消息列表</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
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
});

export default App;
