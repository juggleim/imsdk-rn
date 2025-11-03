import { NativeModules, Platform, NativeEventEmitter } from 'react-native';

const { JuggleIM } = NativeModules;
const juggleIMEmitter = new NativeEventEmitter(JuggleIM);

/**
 * Juggle IM React Native SDK
 * @class JuggleIM
 */
class JIMClient {
  /**
   * 设置服务器地址列表
   * @param {string[]} urls - 服务器地址列表
   * @returns {void}
   */
  static setServerUrls(urls) {
    if (Platform.OS === 'android') {
      JuggleIM.setServerUrls(urls);
    } else if (Platform.OS === 'ios') {
      JuggleIM.setServerUrls(urls);
    }
  }

  /**
   * 初始化SDK
   * @param {string} appKey - 应用唯一标识
   * @returns {void}
   */
  static init(appKey) {
    if (Platform.OS === 'android') {
      JuggleIM.init(appKey);
    } else if (Platform.OS === 'ios') {
      JuggleIM.initWithAppKey(appKey);
    }
  }

  /**
   * 连接到服务器
   * @param {string} token - 用户token
   * @returns {void}
   */
  static connect(token) {
    if (Platform.OS === 'android') {
      JuggleIM.connect(token);
    } else if (Platform.OS === 'ios') {
      JuggleIM.connectWithToken(token);
    }
  }

  /**
   * 添加连接状态监听器
   * @param {string} key - 监听器标识
   * @param {function} listener - 监听器回调函数
   * @returns {function} 返回取消监听的函数
   */
  static addConnectionStatusListener(key, listener) {
    if (Platform.OS === 'android') {
      JuggleIM.addConnectionStatusListener(key);
    } else if (Platform.OS === 'ios') {
      JuggleIM.addConnectionDelegate();
    }
    
    // 监听原生事件
    const subscription = juggleIMEmitter.addListener('ConnectionStatusChanged', (event) => {
      if (Platform.OS === 'android') {
        if (event.key === key) {
          listener(event.status, event.code, event.extra);
        }
      } else if (Platform.OS === 'ios') {
        listener(event.status, event.code, event.extra);
      }
    });
    
    const dbOpenSubscription = juggleIMEmitter.addListener('DbDidOpen', (event) => {
      if (event.key === key) {
        listener('dbOpen', 0, '');
      }
    });
    
    const dbCloseSubscription = juggleIMEmitter.addListener('DbDidClose', (event) => {
      if (event.key === key) {
        listener('dbClose', 0, '');
      }
    });
    
    // 返回取消监听的函数
    return () => {
      subscription.remove();
      dbOpenSubscription.remove();
      dbCloseSubscription.remove();
    };
  }
}

export default JIMClient;