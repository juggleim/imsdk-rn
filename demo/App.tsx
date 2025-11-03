/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React, {useEffect, useState} from 'react';
import type {PropsWithChildren} from 'react';
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
} from 'react-native';

import {
  Colors,
  DebugInstructions,
  Header,
  LearnMoreLinks,
  ReloadInstructions,
} from 'react-native/Libraries/NewAppScreen';

// 导入JuggleIM SDK
import JuggleIM from 'im-rn-sdk';

type SectionProps = PropsWithChildren<{
  title: string;
}>;

function Section({children, title}: SectionProps): JSX.Element {
  const isDarkMode = useColorScheme() === 'dark';
  return (
    <View style={styles.sectionContainer}>
      <Text
        style={[
          styles.sectionDescription,
          {
            color: isDarkMode ? Colors.light : Colors.dark,
          },
        ]}>
        {children}
      </Text>
    </View>
  );
}

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
  const token = 'ChBud202ZnhxdDJhZWViaGI3GiCuH1rw5sUNbzaUd35z0NugduYHIY2J3Fr6kXLVxvxx-g==';

  // 添加状态到历史记录
  const addStatusToHistory = (status: string) => {
    const timestamp = new Date().toLocaleTimeString();
    const statusWithTime = `[${timestamp}] ${status}`;
    setStatusHistory(prev => [statusWithTime, ...prev].slice(0, 10)); // 保留最近10条记录
  };

  // 初始化SDK
  useEffect(() => {
    try {
      // 设置服务器地址
      JuggleIM.setServerUrls([imServer]);
      addStatusToHistory('服务器地址设置完成');
      
      // 初始化SDK
      JuggleIM.init(appKey);
      setIsInitialized(true);
      addStatusToHistory('SDK初始化完成');
      
      // 添加连接状态监听器
      const unsubscribe = JuggleIM.addConnectionStatusListener('demo', (status, code, extra) => {
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
        addStatusToHistory(`状态变化: ${statusText}${extra ? ` - ${extra}` : ''}`);
      });
      
      return () => {
        unsubscribe();
      };
    } catch (error) {
      console.error('SDK初始化失败:', error);
      addStatusToHistory(`初始化失败: ${error}`);
      Alert.alert('错误', 'SDK初始化失败');
    }
  }, []);

  // 连接到服务器
  const handleConnect = () => {
    if (!isInitialized) {
      Alert.alert('错误', 'SDK未初始化');
      return;
    }
    
    try {
      JuggleIM.connect(token);
      addStatusToHistory('开始连接服务器');
    } catch (error) {
      console.error('连接失败:', error);
      addStatusToHistory(`连接失败: ${error}`);
      Alert.alert('错误', '连接失败');
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
          
          <Section title="JuggleIM SDK 测试">
            <View style={styles.testContainer}>
              <Text style={styles.statusText}>初始化状态: {isInitialized ? '已初始化' : '未初始化'}</Text>
              <Text style={styles.statusText}>连接状态: {connectionStatus}</Text>
              
              <TouchableOpacity 
                style={[styles.connectButton, !isInitialized && styles.disabledButton]} 
                onPress={handleConnect}
                disabled={!isInitialized}>
                <Text style={styles.buttonText}>连接服务器</Text>
              </TouchableOpacity>
              
              <Text style={styles.configTitle}>配置信息:</Text>
              <Text style={styles.configText}>服务器: {imServer}</Text>
              <Text style={styles.configText}>AppKey: {appKey}</Text>
              <Text style={styles.configText}>Token: {token.substring(0, 20)}...</Text>
            </View>
          </Section>
          
          {/* 状态历史记录 */}
          <Section title="状态历史">
            <View style={styles.historyContainer}>
              {statusHistory.length === 0 ? (
                <Text style={styles.historyText}>暂无状态记录</Text>
              ) : (
                statusHistory.map((status, index) => (
                  <Text key={index} style={styles.historyText}>{status}</Text>
                ))
              )}
            </View>
          </Section>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  sectionContainer: {
    marginTop: 32,
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
