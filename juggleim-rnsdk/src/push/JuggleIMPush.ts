import { NativeEventEmitter, NativeModules, Platform } from 'react-native';
import type { NotificationClickListener, PushExtras } from './types';

const { JuggleIMPushModule } = NativeModules;
const eventEmitter = JuggleIMPushModule
  ? new NativeEventEmitter(JuggleIMPushModule)
  : null;

/**
 * 校验当前平台是否为 Android
 */
function ensureAndroid(): void {
  if (Platform.OS !== 'android') {
    throw new Error('JuggleIMPush 仅支持 Android 平台');
  }
}

export default class JuggleIMPush {
  /**
   * 初始化极光推送
   */
  static async initJGPush(): Promise<void> {
    ensureAndroid();
    await JuggleIMPushModule.initJGPush();
  }

  /**
   * 获取 registrationId
   */
  static async getRegistrationId(): Promise<string> {
    ensureAndroid();
    return JuggleIMPushModule.getRegistrationId();
  }

  /**
   * 获取启动时通知点击的原始参数
   */
  static async getLaunchNotification(): Promise<PushExtras | null> {
    ensureAndroid();
    return JuggleIMPushModule.getLaunchNotification();
  }

  /**
   * 监听通知点击事件
   * @param listener 通知点击回调
   * @returns 取消监听函数
   */
  static addNotificationClickListener(listener: NotificationClickListener): () => void {
    ensureAndroid();
    const subscription = eventEmitter?.addListener(
      'JuggleIMPush_onNotificationClick',
      (event: { extras: PushExtras }) => listener(event.extras)
    );
    return () => subscription?.remove();
  }
}
