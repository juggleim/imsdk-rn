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


  /**
   * 获取会话列表
   * @param {number} count - 获取数量
   * @param {string} pullDirection - 拉取方向 "up" 或 "down"
   * @returns {Promise<Array>} 会话信息列表
   */
  static getConversationInfoList(count = 20, pullDirection = 'down') {
    if (Platform.OS === 'android') {
      return JuggleIM.getConversationInfoList(count, pullDirection);
    } else if (Platform.OS === 'ios') {
      return JuggleIM.getConversationInfoList(count, pullDirection);
    }
  }

  /**
   * 获取单个会话信息
   * @param {object} conversation - 会话对象
   * @returns {Promise<object>} 会话信息
   */
  static getConversationInfo(conversation) {
    if (Platform.OS === 'android') {
      return JuggleIM.getConversationInfo(conversation);
    } else if (Platform.OS === 'ios') {
      return JuggleIM.getConversationInfo(conversation);
    }
  }

  /**
   * 创建会话信息
   * @param {object} conversation - 会话对象
   * @returns {Promise<object>} 创建的会话信息
   */
  static createConversationInfo(conversation) {
    if (Platform.OS === 'android') {
      return JuggleIM.createConversationInfo(conversation);
    } else if (Platform.OS === 'ios') {
      return JuggleIM.createConversationInfo(conversation);
    }
  }

  /**
   * 删除会话信息
   * @param {object} conversation - 会话对象
   * @returns {Promise<boolean>} 删除结果
   */
  static deleteConversationInfo(conversation) {
    if (Platform.OS === 'android') {
      return JuggleIM.deleteConversationInfo(conversation);
    } else if (Platform.OS === 'ios') {
      return JuggleIM.deleteConversationInfo(conversation);
    }
  }

  /**
   * 设置会话免打扰状态
   * @param {object} conversation - 会话对象
   * @param {boolean} isMute - 是否免打扰
   * @returns {Promise<boolean>} 设置结果
   */
  static setMute(conversation, isMute) {
    if (Platform.OS === 'android') {
      return JuggleIM.setMute(conversation, isMute);
    } else if (Platform.OS === 'ios') {
      return JuggleIM.setMute(conversation, isMute);
    }
  }

  /**
   * 设置会话置顶状态
   * @param {object} conversation - 会话对象
   * @param {boolean} isTop - 是否置顶
   * @returns {Promise<boolean>} 设置结果
   */
  static setTop(conversation, isTop) {
    if (Platform.OS === 'android') {
      return JuggleIM.setTop(conversation, isTop);
    } else if (Platform.OS === 'ios') {
      return JuggleIM.setTop(conversation, isTop);
    }
  }

  /**
   * 清除会话未读数
   * @param {object} conversation - 会话对象
   * @returns {Promise<boolean>} 清除结果
   */
  static clearUnreadCount(conversation) {
    if (Platform.OS === 'android') {
      return JuggleIM.clearUnreadCount(conversation);
    } else if (Platform.OS === 'ios') {
      return JuggleIM.clearUnreadCount(conversation);
    }
  }

  /**
   * 清除总未读数
   * @returns {Promise<boolean>} 清除结果
   */
  static clearTotalUnreadCount() {
    if (Platform.OS === 'android') {
      return JuggleIM.clearTotalUnreadCount();
    } else if (Platform.OS === 'ios') {
      return JuggleIM.clearTotalUnreadCount();
    }
  }

  /**
   * 获取总未读数
   * @returns {Promise<number>} 总未读数
   */
  static getTotalUnreadCount() {
    if (Platform.OS === 'android') {
      return JuggleIM.getTotalUnreadCount();
    } else if (Platform.OS === 'ios') {
      return JuggleIM.getTotalUnreadCount();
    }
  }

  /**
   * 设置会话草稿
   * @param {object} conversation - 会话对象
   * @param {string} draft - 草稿内容
   * @returns {Promise<boolean>} 设置结果
   */
  static setDraft(conversation, draft) {
    if (Platform.OS === 'android') {
      return JuggleIM.setDraft(conversation, draft);
    } else if (Platform.OS === 'ios') {
      return JuggleIM.setDraft(conversation, draft);
    }
  }

  /**
   * 清除会话草稿
   * @param {object} conversation - 会话对象
   * @returns {Promise<boolean>} 清除结果
   */
  static clearDraft(conversation) {
    if (Platform.OS === 'android') {
      return JuggleIM.clearDraft(conversation);
    } else if (Platform.OS === 'ios') {
      return JuggleIM.clearDraft(conversation);
    }
  }

  /**
   * 标记会话未读
   * @param {object} conversation - 会话对象
   * @returns {Promise<boolean>} 标记结果
   */
  static setUnread(conversation) {
    if (Platform.OS === 'android') {
      return JuggleIM.setUnread(conversation);
    } else if (Platform.OS === 'ios') {
      return JuggleIM.setUnread(conversation);
    }
  }

  /**
   * 获取置顶会话列表
   * @param {number} count - 获取数量
   * @param {number} timestamp - 时间戳
   * @param {string} pullDirection - 拉取方向
   * @returns {Promise<Array>} 置顶会话列表
   */
  static getTopConversationInfoList(count = 20, timestamp = 0, pullDirection = 'down') {
    if (Platform.OS === 'android') {
      return JuggleIM.getTopConversationInfoList(count, timestamp, pullDirection);
    } else if (Platform.OS === 'ios') {
      return JuggleIM.getTopConversationInfoList(count, timestamp, pullDirection);
    }
  }

  /**
   * 获取指定类型未读数
   * @param {Array<number>} conversationTypes - 会话类型数组
   * @returns {Promise<number>} 未读数
   */
  static getUnreadCountWithTypes(conversationTypes) {
    if (Platform.OS === 'android') {
      return JuggleIM.getUnreadCountWithTypes(conversationTypes);
    } else if (Platform.OS === 'ios') {
      return JuggleIM.getUnreadCountWithTypes(conversationTypes);
    }
  }

  /**
   * 向标签添加会话
   * @param {Array} conversations - 会话数组
   * @param {string} tagId - 标签ID
   * @returns {Promise<boolean>} 添加结果
   */
  static addConversationsToTag(conversations, tagId) {
    if (Platform.OS === 'android') {
      return JuggleIM.addConversationsToTag(conversations, tagId);
    } else if (Platform.OS === 'ios') {
      return JuggleIM.addConversationsToTag(conversations, tagId);
    }
  }

  /**
   * 从标签移除会话
   * @param {Array} conversations - 会话数组
   * @param {string} tagId - 标签ID
   * @returns {Promise<boolean>} 移除结果
   */
  static removeConversationsFromTag(conversations, tagId) {
    if (Platform.OS === 'android') {
      return JuggleIM.removeConversationsFromTag(conversations, tagId);
    } else if (Platform.OS === 'ios') {
      return JuggleIM.removeConversationsFromTag(conversations, tagId);
    }
  }

  //message 

  /**
   * 发送消息
   * @param {Object} message - 消息对象
   * @param {Object} callbacks - 回调对象
   * @returns {Promise} 返回消息发送结果
   */
  static sendMessage(message, callbacks = {}) {
    if (Platform.OS === 'android') {
      return JuggleIM.sendMessage(message, callbacks);
    } else if (Platform.OS === 'ios') {
      return JuggleIM.sendMessage(message, callbacks);
    }
  }

  /**
   * 获取历史消息
   * @param {Object} conversation - 会话对象
   * @param {number} direction - 拉取方向
   * @param {Object} options - 获取选项
   * @param {function} callback - 回调函数
   */
  static getMessages(conversation, direction, options, callback) {
    if (Platform.OS === 'android') {
      JuggleIM.getMessages(conversation, direction, options, callback);
    } else if (Platform.OS === 'ios') {
      JuggleIM.getMessages(conversation, direction, options, callback);
    }
  }

  /**
   * 撤回消息
   * @param {Object} message - 消息对象
   * @param {Object} extras - 扩展信息
   * @param {function} callback - 回调函数
   */
  static recallMessage(message, extras = {}, callback) {
    if (Platform.OS === 'android') {
      JuggleIM.recallMessage(message, extras, callback);
    } else if (Platform.OS === 'ios') {
      JuggleIM.recallMessage(message, extras, callback);
    }
  }

  /**
   * 添加消息反应
   * @param {Object} message - 消息对象
   * @param {string} reactionId - 反应ID
   * @param {function} callback - 回调函数
   */
  static addMessageReaction(message, reactionId, callback) {
    if (Platform.OS === 'android') {
      JuggleIM.addMessageReaction(message, reactionId, callback);
    } else if (Platform.OS === 'ios') {
      JuggleIM.addMessageReaction(message, reactionId, callback);
    }
  }

  /**
   * 移除消息反应
   * @param {Object} message - 消息对象
   * @param {string} reactionId - 反应ID
   * @param {function} callback - 回调函数
   */
  static removeMessageReaction(message, reactionId, callback) {
    if (Platform.OS === 'android') {
      JuggleIM.removeMessageReaction(message, reactionId, callback);
    } else if (Platform.OS === 'ios') {
      JuggleIM.removeMessageReaction(message, reactionId, callback);
    }
  }

  /**
   * 添加收藏消息
   * @param {Array} messages - 消息数组
   * @param {function} callback - 回调函数
   */
  static addFavoriteMessages(messages, callback) {
    if (Platform.OS === 'android') {
      JuggleIM.addFavoriteMessages(messages, callback);
    } else if (Platform.OS === 'ios') {
      JuggleIM.addFavoriteMessages(messages, callback);
    }
  }

  /**
   * 移除收藏消息
   * @param {Array} messages - 消息数组
   * @param {function} callback - 回调函数
   */
  static removeFavoriteMessages(messages, callback) {
    if (Platform.OS === 'android') {
      JuggleIM.removeFavoriteMessages(messages, callback);
    } else if (Platform.OS === 'ios') {
      JuggleIM.removeFavoriteMessages(messages, callback);
    }
  }

}

export default JIMClient;