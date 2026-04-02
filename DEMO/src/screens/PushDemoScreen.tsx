import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { JuggleIMPush } from 'juggleim-rnsdk';
import { buildPushNavigationTarget } from '../utils/pushNavigation';

type PushExtras = Record<string, string>;

type PayloadSource = 'launch' | 'event' | 'mock' | 'none';

const MOCK_EXTRAS: PushExtras = {
  page: 'MessageList',
  targetId: 'user_1001',
  conversationType: '1',
  title: '测试跳转',
};

const PushDemoScreen = () => {
  const navigation = useNavigation<any>();
  const [initialized, setInitialized] = useState(false);
  const [registrationId, setRegistrationId] = useState('');
  const [source, setSource] = useState<PayloadSource>('none');
  const [extras, setExtras] = useState<PushExtras | null>(null);

  useEffect(() => {
    let active = true;
    let removeListener = () => {};

    const setup = async () => {
      try {
        const launchExtras = await JuggleIMPush.getLaunchNotification();
        if (active && launchExtras) {
          setSource('launch');
          setExtras(launchExtras);
        }
      } catch (error) {
        console.warn('读取启动通知失败', error);
      }

      try {
        removeListener = JuggleIMPush.addNotificationClickListener((eventExtras) => {
          setSource('event');
          setExtras(eventExtras);
        });
      } catch (error) {
        console.warn('注册推送点击监听失败', error);
      }
    };

    setup();

    return () => {
      active = false;
      removeListener();
    };
  }, []);

  const payloadText = useMemo(() => {
    if (!extras) {
      return '暂无 payload';
    }
    return JSON.stringify(extras, null, 2);
  }, [extras]);

  /**
   * 初始化推送
   */
  const handleInit = async () => {
    try {
      await JuggleIMPush.initJGPush();
      setInitialized(true);
      Alert.alert('提示', '初始化成功');
    } catch (error) {
      console.error('初始化推送失败', error);
      Alert.alert('提示', '初始化失败');
    }
  };

  /**
   * 获取 registrationId
   */
  const handleGetRegistrationId = async () => {
    try {
      const id = await JuggleIMPush.getRegistrationId();
      setRegistrationId(id || '');
    } catch (error) {
      console.error('获取 registrationId 失败', error);
      Alert.alert('提示', '获取 registrationId 失败');
    }
  };

  /**
   * 模拟一条推送 payload
   */
  const handleMockPayload = () => {
    setSource('mock');
    setExtras(MOCK_EXTRAS);
  };

  /**
   * 根据当前 payload 执行跳转
   */
  const handleNavigate = () => {
    if (!extras) {
      Alert.alert('提示', '暂无可用 payload');
      return;
    }
    const target = buildPushNavigationTarget(extras);
    if (!target) {
      Alert.alert('提示', '当前 payload 不支持自动跳转');
      return;
    }
    navigation.navigate(target.routeName, target.params);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Push Demo</Text>

      <TouchableOpacity style={styles.button} onPress={handleInit}>
        <Text style={styles.buttonText}>初始化推送</Text>
      </TouchableOpacity>
      <Text style={styles.value}>初始化状态：{initialized ? '已完成' : '未初始化'}</Text>

      <TouchableOpacity style={styles.button} onPress={handleGetRegistrationId}>
        <Text style={styles.buttonText}>获取 registrationId</Text>
      </TouchableOpacity>
      <Text style={styles.value}>{registrationId || '暂无 registrationId'}</Text>

      <TouchableOpacity style={styles.button} onPress={handleMockPayload}>
        <Text style={styles.buttonText}>模拟 payload</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.button} onPress={handleNavigate}>
        <Text style={styles.buttonText}>按当前 payload 跳转</Text>
      </TouchableOpacity>

      <View style={styles.payloadBox}>
        <Text style={styles.label}>来源：{source}</Text>
        <Text style={styles.payload}>{payloadText}</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#111827',
  },
  button: {
    backgroundColor: '#2563EB',
    borderRadius: 8,
    padding: 12,
  },
  buttonText: {
    color: '#FFFFFF',
    textAlign: 'center',
    fontSize: 16,
  },
  value: {
    color: '#111827',
    fontSize: 14,
  },
  payloadBox: {
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 12,
  },
  label: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 8,
  },
  payload: {
    fontSize: 12,
    color: '#111827',
  },
});

export default PushDemoScreen;
