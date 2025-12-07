import { NativeModules, Platform, NativeEventEmitter } from "react-native";

const { JuggleIM: JMI } = NativeModules;

// NativeEventEmitter requires a non-null native module. If the native
// module is not linked (JMI is undefined), create a safe fallback that
// implements `addListener` and returns a subscription with `remove()` so
// JS code can call it without crashing during development or in environments
// where the native module isn't available.
const juggleIMEmitter = JMI
  ? new NativeEventEmitter(JMI)
  : {
    addListener: () => ({ remove: () => { } }),
    removeAllListeners: () => { },
  };

/**
 * Juggle IM React Native SDK
 * @class JuggleIM
 */
class JuggleIM {
  /**
   * 设置服务器地址列表
   * @param {string[]} urls - 服务器地址列表
   * @returns {void}
   */
  static setServerUrls(urls) {
    JMI.setServerUrls(urls);
  }

  /**
   * 初始化SDK
   * @param {string} appKey - 应用唯一标识
   * @returns {void}
   */
  static init(appKey) {
    if (Platform.OS === "android") {
      JMI.init(appKey);
    } else if (Platform.OS === "ios") {
      JMI.initWithAppKey(appKey);
    }
  }

  /**
   * 连接到服务器
   * @param {string} token - 用户token
   * @returns {void}
   */
  static connect(token) {
    if (Platform.OS === "android") {
      JMI.connect(token);
    } else if (Platform.OS === "ios") {
      JMI.connectWithToken(token);
    }
  }

  /**
   *  断开连接
   * @param {boolean} pushable - 是否继续接收推送
   * @returns {void}
   */
  static disconnect(pushable) {
    JMI.disconnect(pushable);
  }

  /**
   * 添加连接状态监听器
   * @param {string} key - 监听器标识
   * @param {function} listener - 监听器回调函数
   * @returns {function} 返回取消监听的函数
   */
  static addConnectionStatusListener(key, listener) {
    if (Platform.OS === "android") {
      JMI.addConnectionStatusListener(key);
    } else if (Platform.OS === "ios") {
      JMI.addConnectionDelegate();
    }

    // 监听原生事件
    const subscription = juggleIMEmitter.addListener(
      "ConnectionStatusChanged",
      (event) => {
        if (Platform.OS === "android") {
          if (event.key === key) {
            listener(event.status, event.code, event.extra);
          }
        } else if (Platform.OS === "ios") {
          listener(event.status, event.code, event.extra);
        }
      }
    );

    const dbOpenSubscription = juggleIMEmitter.addListener(
      "DbDidOpen",
      (event) => {
        if (event.key === key) {
          listener("dbOpen", 0, "");
        }
      }
    );

    const dbCloseSubscription = juggleIMEmitter.addListener(
      "DbDidClose",
      (event) => {
        if (event.key === key) {
          listener("dbClose", 0, "");
        }
      }
    );

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
    if (Platform.OS === "android") {
      JMI.addMessageListener(key);
    } else if (Platform.OS === "ios") {
      JMI.addMessageDelegate();
    }

    const subscriptions = [];

    // 消息接收监听
    if (listener.onMessageReceive) {
      const subscription = juggleIMEmitter.addListener(
        "MessageReceived",
        (event) => {
          if (Platform.OS === "android" && event.key !== key) return;
          listener.onMessageReceive(event.message);
        }
      );
      subscriptions.push(subscription);
    }

    // 消息撤回监听
    if (listener.onMessageRecall) {
      const subscription = juggleIMEmitter.addListener(
        "MessageRecalled",
        (event) => {
          if (Platform.OS === "android" && event.key !== key) return;
          listener.onMessageRecall(event.message);
        }
      );
      subscriptions.push(subscription);
    }

    // 消息修改监听
    if (listener.onMessageUpdate) {
      const subscription = juggleIMEmitter.addListener(
        "MessageUpdated",
        (event) => {
          if (Platform.OS === "android" && event.key !== key) return;
          listener.onMessageUpdate(event.message);
        }
      );
      subscriptions.push(subscription);
    }

    // 消息删除监听
    if (listener.onMessageDelete) {
      const subscription = juggleIMEmitter.addListener(
        "MessageDeleted",
        (event) => {
          if (Platform.OS === "android" && event.key !== key) return;
          listener.onMessageDelete(event.conversation, event.clientMsgNos);
        }
      );
      subscriptions.push(subscription);
    }

    // 消息清除监听
    if (listener.onMessageClear) {
      const subscription = juggleIMEmitter.addListener(
        "MessageCleared",
        (event) => {
          if (Platform.OS === "android" && event.key !== key) return;
          listener.onMessageClear(
            event.conversation,
            event.timestamp,
            event.senderId
          );
        }
      );
      subscriptions.push(subscription);
    }

    // 消息回应添加监听
    if (listener.onMessageReactionAdd) {
      const subscription = juggleIMEmitter.addListener(
        "MessageReactionAdded",
        (event) => {
          if (Platform.OS === "android" && event.key !== key) return;
          listener.onMessageReactionAdd(event.conversation, event.reaction);
        }
      );
      subscriptions.push(subscription);
    }

    // 消息回应删除监听
    if (listener.onMessageReactionRemove) {
      const subscription = juggleIMEmitter.addListener(
        "MessageReactionRemoved",
        (event) => {
          if (Platform.OS === "android" && event.key !== key) return;
          listener.onMessageReactionRemove(event.conversation, event.reaction);
        }
      );
      subscriptions.push(subscription);
    }

    // 消息置顶监听
    if (listener.onMessageSetTop) {
      const subscription = juggleIMEmitter.addListener(
        "MessageSetTop",
        (event) => {
          if (Platform.OS === "android" && event.key !== key) return;
          listener.onMessageSetTop(event.message, event.operator, event.isTop);
        }
      );
      subscriptions.push(subscription);
    }

    // 返回取消监听的函数
    return () => {
      subscriptions.forEach((subscription) => subscription.remove());
    };
  }

  /**
   * 添加消息阅读状态监听器
   * @param {string} key - 监听器标识
   * @param {object} listener - 监听器回调函数对象
   * @returns {function} 返回取消监听的函数
   */
  static addMessageReadReceiptListener(key, listener) {
    if (Platform.OS === "android") {
      JMI.addMessageReadReceiptListener(key);
    } else if (Platform.OS === "ios") {
      JMI.addMessageReadReceiptDelegate();
    }

    const subscriptions = [];

    // 单聊消息阅读监听
    if (listener.onMessagesRead) {
      const subscription = juggleIMEmitter.addListener(
        "MessagesRead",
        (event) => {
          if (Platform.OS === "android" && event.key !== key) return;
          listener.onMessagesRead(event.conversation, event.messageIds);
        }
      );
      subscriptions.push(subscription);
    }

    // 群消息阅读监听
    if (listener.onGroupMessagesRead) {
      const subscription = juggleIMEmitter.addListener(
        "GroupMessagesRead",
        (event) => {
          if (Platform.OS === "android" && event.key !== key) return;
          listener.onGroupMessagesRead(event.conversation, event.messages);
        }
      );
      subscriptions.push(subscription);
    }

    // 返回取消监听的函数
    return () => {
      subscriptions.forEach((subscription) => subscription.remove());
    };
  }

  /**
   * 添加消息销毁监听器
   * @param {string} key - 监听器标识
   * @param {object} listener - 监听器回调函数对象
   * @returns {function} 返回取消监听的函数
   */
  static addMessageDestroyListener(key, listener) {
    if (Platform.OS === "android") {
      JMI.addMessageDestroyListener(key);
    } else if (Platform.OS === "ios") {
      JMI.addMessageDestroyDelegate();
    }

    const subscriptions = [];

    // 消息销毁时间更新监听
    if (listener.onMessageDestroyTimeUpdate) {
      const subscription = juggleIMEmitter.addListener(
        "MessageDestroyTimeUpdated",
        (event) => {
          if (Platform.OS === "android" && event.key !== key) return;
          listener.onMessageDestroyTimeUpdate(
            event.messageId,
            event.conversation,
            event.destroyTime
          );
        }
      );
      subscriptions.push(subscription);
    }

    // 返回取消监听的函数
    return () => {
      subscriptions.forEach((subscription) => subscription.remove());
    };
  }

  /**
   * 添加会话监听器
   * @param {string} key - 监听器标识
   * @param {object} listener - 监听器回调函数对象
   * @returns {function} 返回取消监听的函数
   */
  static addConversationListener(key, listener) {
    if (Platform.OS === "android") {
      JMI.addConversationListener(key);
    } else if (Platform.OS === "ios") {
      JMI.addConversationDelegate();
    }

    const subscriptions = [];

    // 会话新增监听
    if (listener.onConversationInfoAdd) {
      const subscription = juggleIMEmitter.addListener(
        "ConversationInfoAdded",
        (event) => {
          if (Platform.OS === "android" && event.key !== key) return;
          listener.onConversationInfoAdd(event.conversations);
        }
      );
      subscriptions.push(subscription);
    }

    // 会话更新监听
    if (listener.onConversationInfoUpdate) {
      const subscription = juggleIMEmitter.addListener(
        "ConversationInfoUpdated",
        (event) => {
          if (Platform.OS === "android" && event.key !== key) return;
          listener.onConversationInfoUpdate(event.conversations);
        }
      );
      subscriptions.push(subscription);
    }

    // 会话删除监听
    if (listener.onConversationInfoDelete) {
      const subscription = juggleIMEmitter.addListener(
        "ConversationInfoDeleted",
        (event) => {
          if (Platform.OS === "android" && event.key !== key) return;
          listener.onConversationInfoDelete(event.conversations);
        }
      );
      subscriptions.push(subscription);
    }

    // 总未读数更新监听
    if (listener.onTotalUnreadMessageCountUpdate) {
      const subscription = juggleIMEmitter.addListener(
        "TotalUnreadMessageCountUpdated",
        (event) => {
          if (Platform.OS === "android" && event.key !== key) return;
          listener.onTotalUnreadMessageCountUpdate(event.count);
        }
      );
      subscriptions.push(subscription);
    }

    // 返回取消监听的函数
    return () => {
      subscriptions.forEach((subscription) => subscription.remove());
    };
  }

  /**
   * 获取会话信息列表
   * @param {object} option - 获取选项
   * @returns {Promise<ConversationInfo[]>} 会话信息列表
   */
  static getConversationInfoList(option) {
    console.log("getConversationInfoList called with option:", option);
    return JMI.getConversationInfoList(
      option.count,
      option.timestamp,
      option.direction
    );
  }

  /**
   * 获取单个会话信息
   * @param {object} conversation - 会话对象
   * @returns {Promise<object>} 会话信息
   */
  static getConversationInfo(conversation) {
    return JMI.getConversationInfo(conversation);
  }

  /**
   * 创建会话信息
   * @param {object} conversation - 会话对象
   * @returns {Promise<object>} 创建的会话信息
   */
  static createConversationInfo(conversation) {
    return JMI.createConversationInfo(conversation);
  }

  /**
   * 删除会话信息
   * @param {object} conversation - 会话对象
   * @returns {Promise<boolean>} 删除结果
   */
  static async deleteConversationInfo(conversation, callback) {
    try {
      const result = await JMI.deleteConversationInfo(conversation);
      if (callback && callback.onSuccess) {
        callback.onSuccess();
      }
      return result;
    } catch (error) {
      if (callback && callback.onError) {
        callback.onError(error.code || -1);
      }
    }
  }

  /**
   * 设置会话免打扰状态
   * @param {object} conversation - 会话对象
   * @param {boolean} isMute - 是否免打扰
   * @returns {Promise<boolean>} 设置结果
   */
  static async setMute(conversation, isMute, callback) {
    try {
      const result = await JMI.setMute(conversation, isMute);
      if (callback && callback.onSuccess) {
        callback.onSuccess();
      }
      return result;
    } catch (error) {
      if (callback && callback.onError) {
        callback.onError(error.code || -1);
      }
    }
  }

  /**
   * 设置会话置顶状态
   * @param {object} conversation - 会话对象
   * @param {boolean} isTop - 是否置顶
   * @returns {Promise<boolean>} 设置结果
   */
  static async setTop(conversation, isTop, callback) {
    try {
      const result = await JMI.setTop(conversation, isTop);
      if (callback && callback.onSuccess) {
        callback.onSuccess();
      }
      return result;
    } catch (error) {
      if (callback && callback.onError) {
        callback.onError(error.code || -1);
      }
    }
  }

  /**
   * 清除会话未读数
   * @param {object} conversation - 会话对象
   * @returns {Promise<boolean>} 清除结果
   */
  static clearUnreadCount(conversation) {
    if (Platform.OS === "android") {
      return JMI.clearUnreadCount(conversation);
    } else if (Platform.OS === "ios") {
      return JMI.clearUnreadCount(conversation);
    }
  }

  /**
   * 清除总未读数
   * @returns {Promise<boolean>} 清除结果
   */
  static clearTotalUnreadCount() {
    return JMI.clearTotalUnreadCount();
  }

  /**
   * 获取总未读数
   * @returns {Promise<number>} 总未读数
   */
  static getTotalUnreadCount() {
    return JMI.getTotalUnreadCount();
  }

  /**
   * 设置会话草稿
   * @param {object} conversation - 会话对象
   * @param {string} draft - 草稿内容
   * @returns {Promise<boolean>} 设置结果
   */
  static setDraft(conversation, draft) {
    return JMI.setDraft(conversation, draft);
  }

  /**
   * 清除会话草稿
   * @param {object} conversation - 会话对象
   * @returns {Promise<boolean>} 清除结果
   */
  static clearDraft(conversation) {
    return JMI.clearDraft(conversation);
  }

  /**
   * 标记会话未读
   * @param {object} conversation - 会话对象
   * @returns {Promise<boolean>} 标记结果
   */
  static setUnread(conversation) {
    return JMI.setUnread(conversation);
  }

  /**
   * 获取置顶会话列表
   * @param {number} count - 获取数量
   * @param {number} timestamp - 时间戳
   * @param {number} direction - 拉取方向
   * @returns {Promise<Array>} 置顶会话列表
   */
  static getTopConversationInfoList(count = 20, timestamp = 0, direction = 0) {
    return JMI.getTopConversationInfoList(count, timestamp, direction);
  }

  /**
   * 获取指定类型未读数
   * @param {Array<number>} conversationTypes - 会话类型数组
   * @returns {Promise<number>} 未读数
   */
  static getUnreadCountWithTypes(conversationTypes) {
    return JMI.getUnreadCountWithTypes(conversationTypes);
  }

  /**
   * 向标签添加会话
   * @param {Array} conversations - 会话数组
   * @param {string} tagId - 标签ID
   * @returns {Promise<boolean>} 添加结果
   */
  static addConversationsToTag(conversations, tagId) {
    return JMI.addConversationsToTag(conversations, tagId);
  }

  /**
   * 从标签移除会话
   * @param {Array} conversations - 会话数组
   * @param {string} tagId - 标签ID
   * @returns {Promise<boolean>} 移除结果
   */
  static removeConversationsFromTag(conversations, tagId) {
    return JMI.removeConversationsFromTag(conversations, tagId);
  }

  //message

  /**
   * 发送消息
   * @param {SendMessageObject} message
   * @param {import("juggleim-rnsdk").SendMessageCallback} callback - 回调对象
   * @returns {import("juggleim-rnsdk").Message} - 消息对象
   */
  static async sendMessage(
    message,
    callback = {}
  ) {
    console.log("sendMessage message:", message);

    // 生成唯一标识符以避免回调冲突
    const messageId = Math.random().toString(36).substr(2, 9) + Date.now();

    const successListener = juggleIMEmitter.addListener(
      "onMessageSent",
      (event) => {
        if (event.messageId === messageId) {
          callback.onSuccess?.(event.message);
          successListener.remove();
          errorListener.remove();
        }
      }
    );

    const errorListener = juggleIMEmitter.addListener(
      "onMessageSentError",
      (event) => {
        if (event.messageId === messageId) {
          callback.onError?.(event.message, event.errorCode || -1);
          successListener.remove();
          errorListener.remove();
        }
      }
    );

    try {
      const localMsg = await JMI.sendMessage(message, messageId);
      return localMsg;
    } catch (error) {
      callback.onError?.(null, -1);
      successListener.remove();
      errorListener.remove();
      console.error("sendMessage error:", error);
    }
  }

  /**
   * 发送图片消息
   * @param {Object} message - 图片消息内容
   * @param {Object} callback - 回调对象
   * @returns {Promise<Message>} - 消息对象
   */
  static async sendImageMessage(
    message,
    callback = {}
  ) {
    console.log("sendImageMessage message...:", message);

    // 生成唯一标识符以避免回调冲突
    const messageId = Math.random().toString(36).substr(2, 9) + Date.now();

    const progressListener = juggleIMEmitter.addListener(
      "onMediaMessageProgress",
      (event) => {
        console.log("onMediaMessageSent msg:", event);
        if (event.messageId === messageId) {
          callback.onProgress?.(event.progress, event.message);
        }
      }
    );

    const successListener = juggleIMEmitter.addListener(
      "onMediaMessageSent",
      (event) => {
        console.log("onMediaMessageSent msg:", event);
        if (event.messageId === messageId) {
          callback.onSuccess?.(event.message);
          progressListener.remove();
          successListener.remove();
          errorListener.remove();
          cancelListener.remove();
        }
      }
    );

    const errorListener = juggleIMEmitter.addListener(
      "onMediaMessageSentError",
      (event) => {
        if (event.messageId === messageId) {
          callback.onError?.(event.message, event.errorCode || -1);
          progressListener.remove();
          successListener.remove();
          errorListener.remove();
          cancelListener.remove();
        }
      }
    );

    const cancelListener = juggleIMEmitter.addListener(
      "onMediaMessageCancelled",
      (event) => {
        if (event.messageId === messageId) {
          callback.onCancel?.(event.message);
          progressListener.remove();
          successListener.remove();
          errorListener.remove();
          cancelListener.remove();
        }
      }
    );

    try {
      const localMsg = await JMI.sendImageMessage(message, messageId);
      return localMsg;
    } catch (error) {
      progressListener.remove();
      successListener.remove();
      errorListener.remove();
      cancelListener.remove();
      console.error("sendImageMessage error:", error);
      throw error;
    }
  }

  /**
   * 发送文件消息
   * @param {Object} message - 文件消息内容
   * @param {Object} callback - 回调对象
   * @returns {Promise<Message>} - 消息对象
   */
  static async sendFileMessage(
    message,
    callback = {}
  ) {
    // 生成唯一标识符以避免回调冲突
    const messageId = Math.random().toString(36).substr(2, 9) + Date.now();

    // 添加监听器
    const progressListener = juggleIMEmitter.addListener(
      "onMediaMessageProgress",
      (event) => {
        if (event.messageId === messageId) {
          callback.onProgress?.(event.progress, event.message);
        }
      }
    );

    const successListener = juggleIMEmitter.addListener(
      "onMediaMessageSent",
      (event) => {
        if (event.messageId === messageId) {
          callback.onSuccess?.(event.message);
          progressListener.remove();
          successListener.remove();
          errorListener.remove();
          cancelListener.remove();
        }
      }
    );

    const errorListener = juggleIMEmitter.addListener(
      "onMediaMessageSentError",
      (event) => {
        if (event.messageId === messageId) {
          callback.onError?.(event.message, event.errorCode || -1);
          progressListener.remove();
          successListener.remove();
          errorListener.remove();
          cancelListener.remove();
        }
      }
    );

    const cancelListener = juggleIMEmitter.addListener(
      "onMediaMessageCancelled",
      (event) => {
        if (event.messageId === messageId) {
          callback.onCancel?.(event.message);
          progressListener.remove();
          successListener.remove();
          errorListener.remove();
          cancelListener.remove();
        }
      }
    );

    try {
      console.log("sendFileMessage message...:", message);
      const localMsg = await JMI.sendFileMessage(message, messageId);
      console.log("sendFileMessage localMsg:", localMsg);
      return localMsg;
    } catch (error) {
      progressListener.remove();
      successListener.remove();
      errorListener.remove();
      cancelListener.remove();
      console.error("sendFileMessage error:", error);
      throw error;
    }
  }

  /**
   * 发送语音消息
   * @param {Object} message - 语音消息内容
   * @param {Object} callback - 回调对象
   * @returns {Promise<Message>} - 消息对象
   */
  static async sendVoiceMessage(
    message,
    callback = {}
  ) {
    // 生成唯一标识符以避免回调冲突
    const messageId = Math.random().toString(36).substr(2, 9) + Date.now();

    // 添加监听器
    const progressListener = juggleIMEmitter.addListener(
      "onMediaMessageProgress",
      (event) => {
        if (event.messageId === messageId) {
          callback.onProgress?.(event.progress, event.message);
        }
      }
    );

    const successListener = juggleIMEmitter.addListener(
      "onMediaMessageSent",
      (event) => {
        if (event.messageId === messageId) {
          callback.onSuccess?.(event.message);
          progressListener.remove();
          successListener.remove();
          errorListener.remove();
          cancelListener.remove();
        }
      }
    );

    const errorListener = juggleIMEmitter.addListener(
      "onMediaMessageSentError",
      (event) => {
        if (event.messageId === messageId) {
          callback.onError?.(event.message, event.errorCode || -1);
          progressListener.remove();
          successListener.remove();
          errorListener.remove();
          cancelListener.remove();
        }
      }
    );

    const cancelListener = juggleIMEmitter.addListener(
      "onMediaMessageCancelled",
      (event) => {
        if (event.messageId === messageId) {
          callback.onCancel?.(event.message);
          progressListener.remove();
          successListener.remove();
          errorListener.remove();
          cancelListener.remove();
        }
      }
    );

    try {
      console.log("sendVoiceMessage message...:", message);
      const localMsg = await JMI.sendVoiceMessage(message, messageId);
      console.log("sendVoiceMessage localMsg:", localMsg);
      return localMsg;
    } catch (error) {
      progressListener.remove();
      successListener.remove();
      errorListener.remove();
      cancelListener.remove();
      console.error("sendVoiceMessage error:", error);
      throw error;
    }
  }

  /**
   * 发送合并消息（构建 MergeMessage 并发送）
   * @param {MergedMessageContent} mergedMessage - 要合并转发的消息 ID 列表
   * @param {Conversation} conversation - 目标会话（同时作为 MergeMessage 中的 conversation 字段）
   * @param {SendMessageCallback} callback - 回调对象，包含 onSuccess/onError
   */
  static async sendMergeMessage(mergedMessage, conversation, callback = {}) {
    const messageObj = {
      conversationType: conversation && conversation.conversationType,
      conversationId: conversation && conversation.conversationId,
      content: mergedMessage,
    };

    return this.sendMessage(messageObj, callback);
  }

  /**
   * 获取历史消息
   * @param {Object} conversation - 会话对象
   * @param {number} direction - 拉取方向
   * @param {Object} options - 获取选项
   */
  static getMessageList(conversation, direction, options) {
    return JMI.getMessages(conversation, direction, options);
  }

  /**
   * 撤回消息
   * @param {String} messageId - 消息ID
   * @param {Object} extras - kv 扩展信息
   */
  static recallMessage(messageId, extras = {}) {
    return JMI.recallMessage(messageId, extras);
  }

  /**
   * 根据clientMsgNo列表删除消息
   * @param {object} conversation - 会话对象
   * @param {number[]} clientMsgNos - clientMsgNo列表
   * @returns {Promise<boolean>} 删除结果
   */
  static deleteMessagesByClientMsgNoList(conversation, clientMsgNos) {
    const nums = (clientMsgNos || [])
      .map(n => Number(n))
      .filter(n => !isNaN(n));
    return JMI.deleteMessagesByClientMsgNoList(conversation, nums);
  }

  /**
   * 添加消息反应
   * @param {Object} message - 消息对象
   * @param {string} reactionId - 反应ID
   */
  static addMessageReaction(message, reactionId) {
    JMI.addMessageReaction(message, reactionId);
  }

  /**
   * 移除消息反应
   * @param {Object} message - 消息对象
   * @param {string} reactionId - 反应ID
   */
  static removeMessageReaction(message, reactionId) {
    JMI.removeMessageReaction(message, reactionId, callback);
  }

  /**
   * 发送消息已读回执
   * @param {object} conversation - 会话对象
   * @param {string[]} messageIds - 消息ID列表
   * @param {object} callback - 回调对象
   * @returns {Promise<boolean>} 发送结果
   */
  static async sendReadReceipt(conversation, messageIds, callback) {
    try {
      const result = await JMI.sendReadReceipt(conversation, messageIds);
      if (callback && callback.onSuccess) {
        callback.onSuccess();
      }
      return result;
    } catch (error) {
      if (callback && callback.onError) {
        callback.onError(error.code || -1);
      }
      throw error;
    }
  }

  /**
   * 设置消息置顶
   * @param {string} messageId - 消息ID
   * @param {object} conversation - 会话对象
   * @param {boolean} isTop - 是否置顶
   * @param {object} callback - 回调对象
   * @returns {Promise<boolean>} 设置结果
   */
  static async setMessageTop(messageId, conversation, isTop, callback) {
    try {
      const result = await JMI.setMessageTop(messageId, conversation, isTop);
      if (callback && callback.onSuccess) {
        callback.onSuccess();
      }
      return result;
    } catch (error) {
      if (callback && callback.onError) {
        callback.onError(error.code || -1);
      }
      throw error;
    }
  }
}

export default JuggleIM;