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

  /**
   * 添加消息监听器
   * @param {string} key - 监听器标识
   * @param {object} listener - 监听器回调函数对象
   * @returns {function} 返回取消监听的函数
   */
  static addMessageListener(key, listener) {
    if (Platform.OS === 'android') {
      JuggleIM.addMessageListener(key);
    } else if (Platform.OS === 'ios') {
      JuggleIM.addMessageDelegate();
    }
    
    const subscriptions = [];
    
    // 消息接收监听
    if (listener.onMessageReceive) {
      const subscription = juggleIMEmitter.addListener('MessageReceived', (event) => {
        if (Platform.OS === 'android' && event.key !== key) return;
        listener.onMessageReceive(event.message);
      });
      subscriptions.push(subscription);
    }
    
    // 消息撤回监听
    if (listener.onMessageRecall) {
      const subscription = juggleIMEmitter.addListener('MessageRecalled', (event) => {
        if (Platform.OS === 'android' && event.key !== key) return;
        listener.onMessageRecall(event.message);
      });
      subscriptions.push(subscription);
    }
    
    // 消息修改监听
    if (listener.onMessageUpdate) {
      const subscription = juggleIMEmitter.addListener('MessageUpdated', (event) => {
        if (Platform.OS === 'android' && event.key !== key) return;
        listener.onMessageUpdate(event.message);
      });
      subscriptions.push(subscription);
    }
    
    // 消息删除监听
    if (listener.onMessageDelete) {
      const subscription = juggleIMEmitter.addListener('MessageDeleted', (event) => {
        if (Platform.OS === 'android' && event.key !== key) return;
        listener.onMessageDelete(event.conversation, event.clientMsgNos);
      });
      subscriptions.push(subscription);
    }
    
    // 消息清除监听
    if (listener.onMessageClear) {
      const subscription = juggleIMEmitter.addListener('MessageCleared', (event) => {
        if (Platform.OS === 'android' && event.key !== key) return;
        listener.onMessageClear(event.conversation, event.timestamp, event.senderId);
      });
      subscriptions.push(subscription);
    }
    
    // 消息回应添加监听
    if (listener.onMessageReactionAdd) {
      const subscription = juggleIMEmitter.addListener('MessageReactionAdded', (event) => {
        if (Platform.OS === 'android' && event.key !== key) return;
        listener.onMessageReactionAdd(event.conversation, event.reaction);
      });
      subscriptions.push(subscription);
    }
    
    // 消息回应删除监听
    if (listener.onMessageReactionRemove) {
      const subscription = juggleIMEmitter.addListener('MessageReactionRemoved', (event) => {
        if (Platform.OS === 'android' && event.key !== key) return;
        listener.onMessageReactionRemove(event.conversation, event.reaction);
      });
      subscriptions.push(subscription);
    }
    
    // 消息置顶监听
    if (listener.onMessageSetTop) {
      const subscription = juggleIMEmitter.addListener('MessageSetTop', (event) => {
        if (Platform.OS === 'android' && event.key !== key) return;
        listener.onMessageSetTop(event.message, event.operator, event.isTop);
      });
      subscriptions.push(subscription);
    }
    
    // 返回取消监听的函数
    return () => {
      subscriptions.forEach(subscription => subscription.remove());
    };
  }

  /**
   * 添加消息阅读状态监听器
   * @param {string} key - 监听器标识
   * @param {object} listener - 监听器回调函数对象
   * @returns {function} 返回取消监听的函数
   */
  static addMessageReadReceiptListener(key, listener) {
    if (Platform.OS === 'android') {
      JuggleIM.addMessageReadReceiptListener(key);
    } else if (Platform.OS === 'ios') {
      JuggleIM.addMessageReadReceiptDelegate();
    }
    
    const subscriptions = [];
    
    // 单聊消息阅读监听
    if (listener.onMessagesRead) {
      const subscription = juggleIMEmitter.addListener('MessagesRead', (event) => {
        if (Platform.OS === 'android' && event.key !== key) return;
        listener.onMessagesRead(event.conversation, event.messageIds);
      });
      subscriptions.push(subscription);
    }
    
    // 群消息阅读监听
    if (listener.onGroupMessagesRead) {
      const subscription = juggleIMEmitter.addListener('GroupMessagesRead', (event) => {
        if (Platform.OS === 'android' && event.key !== key) return;
        listener.onGroupMessagesRead(event.conversation, event.messages);
      });
      subscriptions.push(subscription);
    }
    
    // 返回取消监听的函数
    return () => {
      subscriptions.forEach(subscription => subscription.remove());
    };
  }

  /**
   * 添加消息销毁监听器
   * @param {string} key - 监听器标识
   * @param {object} listener - 监听器回调函数对象
   * @returns {function} 返回取消监听的函数
   */
  static addMessageDestroyListener(key, listener) {
    if (Platform.OS === 'android') {
      JuggleIM.addMessageDestroyListener(key);
    } else if (Platform.OS === 'ios') {
      JuggleIM.addMessageDestroyDelegate();
    }
    
    const subscriptions = [];
    
    // 消息销毁时间更新监听
    if (listener.onMessageDestroyTimeUpdate) {
      const subscription = juggleIMEmitter.addListener('MessageDestroyTimeUpdated', (event) => {
        if (Platform.OS === 'android' && event.key !== key) return;
        listener.onMessageDestroyTimeUpdate(event.messageId, event.conversation, event.destroyTime);
      });
      subscriptions.push(subscription);
    }
    
    // 返回取消监听的函数
    return () => {
      subscriptions.forEach(subscription => subscription.remove());
    };
  }

  /**
   * 添加会话监听器
   * @param {string} key - 监听器标识
   * @param {object} listener - 监听器回调函数对象
   * @returns {function} 返回取消监听的函数
   */
  static addConversationListener(key, listener) {
    if (Platform.OS === 'android') {
      JuggleIM.addConversationListener(key);
    } else if (Platform.OS === 'ios') {
      JuggleIM.addConversationDelegate();
    }
    
    const subscriptions = [];
    
    // 会话新增监听
    if (listener.onConversationInfoAdd) {
      const subscription = juggleIMEmitter.addListener('ConversationInfoAdded', (event) => {
        if (Platform.OS === 'android' && event.key !== key) return;
        listener.onConversationInfoAdd(event.conversations);
      });
      subscriptions.push(subscription);
    }
    
    // 会话更新监听
    if (listener.onConversationInfoUpdate) {
      const subscription = juggleIMEmitter.addListener('ConversationInfoUpdated', (event) => {
        if (Platform.OS === 'android' && event.key !== key) return;
        listener.onConversationInfoUpdate(event.conversations);
      });
      subscriptions.push(subscription);
    }
    
    // 会话删除监听
    if (listener.onConversationInfoDelete) {
      const subscription = juggleIMEmitter.addListener('ConversationInfoDeleted', (event) => {
        if (Platform.OS === 'android' && event.key !== key) return;
        listener.onConversationInfoDelete(event.conversations);
      });
      subscriptions.push(subscription);
    }
    
    // 总未读数更新监听
    if (listener.onTotalUnreadMessageCountUpdate) {
      const subscription = juggleIMEmitter.addListener('TotalUnreadMessageCountUpdated', (event) => {
        if (Platform.OS === 'android' && event.key !== key) return;
        listener.onTotalUnreadMessageCountUpdate(event.count);
      });
      subscriptions.push(subscription);
    }
    
    // 返回取消监听的函数
    return () => {
      subscriptions.forEach(subscription => subscription.remove());
    };
  }
}

export default JIMClient;