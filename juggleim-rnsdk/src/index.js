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
   * 注册自定义消息类型
   * @param {string} contentType - 消息类型标识符(不能以 "jg:" 开头)
   * @param {function} messageClass - 自定义消息类的构造函数
   * @returns {void}
   */
  static registerCustomMessageType(contentType, messageClass) {
    if (contentType.startsWith('jg:')) {
      throw new Error('contentType 不能以 "jg:" 开头');
    }

    // 通知原生层
    JMI.registerCustomMessageType(contentType);

    console.log(`已注册自定义消息类型: ${contentType}`);
  }

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
        async (event) => {
          const message = await this.buildMessageInfo(event.message);
          if (Platform.OS === "android" && event.key !== key) return;
          listener.onMessageReceive(message);
        }
      );
      subscriptions.push(subscription);
    }

    // 消息撤回监听
    if (listener.onMessageRecall) {
      const subscription = juggleIMEmitter.addListener(
        "MessageRecalled",
        async (event) => {
          if (Platform.OS === "android" && event.key !== key) return;
          const message = await this.buildMessageInfo(event.message);
          listener.onMessageRecall(message);
        }
      );
      subscriptions.push(subscription);
    }

    // 消息修改监听
    if (listener.onMessageUpdate) {
      const subscription = juggleIMEmitter.addListener(
        "MessageUpdated",
        async (event) => {
          if (Platform.OS === "android" && event.key !== key) return;
          const message = await this.buildMessageInfo(event.message);
          listener.onMessageUpdate(message);
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
          const convsList = this.buildConversationInfoList(event.conversations);
          console.log("ConversationInfoAdded", convsList);
          if (Platform.OS === "android" && event.key !== key) return;
          listener.onConversationInfoAdd(convsList);
        }
      );
      subscriptions.push(subscription);
    }

    // 会话更新监听
    if (listener.onConversationInfoUpdate) {
      const subscription = juggleIMEmitter.addListener(
        "ConversationInfoUpdated",
        (event) => {
          const convsList = this.buildConversationInfoList(event.conversations);
          console.log("ConversationInfoUpdated", convsList);
          if (Platform.OS === "android" && event.key !== key) return;
          listener.onConversationInfoUpdate(convsList);
        }
      );
      subscriptions.push(subscription);
    }

    // 会话删除监听
    if (listener.onConversationInfoDelete) {
      const subscription = juggleIMEmitter.addListener(
        "ConversationInfoDeleted",
        (event) => {
          const convsList = this.buildConversationInfoList(event.conversations);
          console.log("ConversationInfoDeleted", convsList);
          if (Platform.OS === "android" && event.key !== key) return;
          listener.onConversationInfoDelete(convsList);
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
    return new Promise((resolve, reject) => {
      JMI.getConversationInfoList(
        option.count,
        option.timestamp,
        option.direction
      ).then(convs => {
        convs?.forEach(async (conv) => {
          if (conv.conversation?.conversationType === 1) {
            const userInfo = await JMI.getUserInfo(conv.conversation?.conversationId);
            conv.name = userInfo?.nickname;
            conv.avatar = userInfo?.avatar;
            conv.extra = userInfo?.extra;
          } else if (conv.conversation?.conversationType === 2) {
            const groupInfo = await JMI.getGroupInfo(conv.conversation?.conversationId);
            conv.name = groupInfo?.groupName;
            conv.avatar = groupInfo?.portrait;
            conv.extra = groupInfo?.extra;
          }
          if (conv.lastMessage) {
            const userInfo = await JMI.getUserInfo(conv.lastMessage.senderUserId);
            conv.lastMessage.senderUserName = userInfo?.nickname;
            conv.lastMessage.senderUserAvatar = userInfo?.avatar;
            conv.lastMessage.senderUserExtra = userInfo?.extra;
          }
        });
        resolve(convs || []);
      }).catch(err => {
        console.error(err);
        reject(err);
      });
    });
  }

  static buildConversationInfoList(convs) {
    convs?.forEach(async (conv) => {
      if (conv.conversation?.conversationType === 1) {
        const userInfo = await JMI.getUserInfo(conv.conversation?.conversationId);
        conv.name = userInfo?.nickname;
        conv.avatar = userInfo?.avatar;
        conv.extra = userInfo?.extra;
      } else if (conv.conversation?.conversationType === 2) {
        const groupInfo = await JMI.getGroupInfo(conv.conversation?.conversationId);
        conv.name = groupInfo?.groupName;
        conv.avatar = groupInfo?.portrait;
        conv.extra = groupInfo?.extra;
      }
      if (conv.lastMessage) {
        const userInfo = await JMI.getUserInfo(conv.lastMessage.senderUserId);
        conv.lastMessage.senderUserName = userInfo?.nickname;
        conv.lastMessage.senderUserAvatar = userInfo?.avatar;
        conv.lastMessage.senderUserExtra = userInfo?.extra;
      }
    });
    return convs;
  }

  static async buildMessageInfo(message) {
    const userInfo = await JMI.getUserInfo(message.senderUserId);
    message.senderUserName = userInfo?.nickname;
    message.senderUserAvatar = userInfo?.avatar;
    message.senderUserExtra = userInfo?.extra;
    return message;
  }

  /**
   * 获取单个会话信息
   * @param {object} conversation - 会话对象
   * @returns {Promise<object>} 会话信息
   */
  static getConversationInfo(conversation) {
    return new Promise((resolve, reject) => {
      JMI.getConversationInfo(conversation).then(async conv => {
        if (conv) {
          if (conv.conversation?.conversationType === 1) {
            const userInfo = await JMI.getUserInfo(conv.conversation?.conversationId);
            conv.name = userInfo?.nickname;
            conv.avatar = userInfo?.avatar;
            conv.extra = userInfo?.extra;
          } else if (conv.conversation?.conversationType === 2) {
            const groupInfo = await JMI.getGroupInfo(conv.conversation?.conversationId);
            conv.name = groupInfo?.groupName;
            conv.avatar = groupInfo?.portrait;
            conv.extra = groupInfo?.extra;
          }
          if (conv.lastMessage) {
            const userInfo = await JMI.getUserInfo(conv.lastMessage.senderUserId);
            conv.lastMessage.senderUserName = userInfo?.nickname;
            conv.lastMessage.senderUserAvatar = userInfo?.avatar;
            conv.lastMessage.senderUserExtra = userInfo?.extra;
          }
        }
        resolve(conv);
      }).catch(err => {
        console.error(err);
        reject(err);
      });
    });
  }

  /**
   * 获取用户信息
   * @param {string} userId - 用户ID
   * @returns {Promise<UserInfo>} 用户信息
   */
  static getUserInfo(userId) {
    return JMI.getUserInfo(userId);
  }

  /**
   * 获取群组信息
   * @param {string} groupId - 群组ID
   * @returns {Promise<GroupInfo>} 群组信息
   */
  static getGroupInfo(groupId) {
    return JMI.getGroupInfo(groupId);
  }

  /**
   * 获取群成员信息
   * @param {string} groupId - 群组ID
   * @param {string} userId - 用户ID
   * @returns {Promise<GroupMember>} 群成员信息
   */
  static getGroupMember(groupId, userId) {
    return JMI.getGroupMember(groupId, userId);
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
  static async setTop(conversation, isTop) {
    return JMI.setTop(conversation, isTop);
  }

  /**
   * 清除会话未读数
   * @param {object} conversation - 会话对象
   * @returns {Promise<boolean>} 清除结果
   */
  static clearUnreadCount(conversation) {
    // 参数检查
    return new Promise((resolve, reject) => {
      if (!conversation || !conversation.conversationId || !conversation.conversationType) {
        reject('error', '会话参数错误');
        return;
      }
      if (Platform.OS === "android") {
        JMI.clearUnreadCount(conversation).then(resolve).catch(reject);
      } else if (Platform.OS === "ios") {
        JMI.clearUnreadCount(conversation).then(resolve).catch(reject);
      }
    });
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
    return new Promise((resolve, reject) => {
      JMI.getTopConversationInfoList(count, timestamp, direction).then(convs => {
        convs?.forEach(async (conv) => {
          if (conv.conversation?.conversationType === 1) {
            const userInfo = await JMI.getUserInfo(conv.conversation?.userId);
            conv.name = userInfo?.nickname;
            conv.avatar = userInfo?.avatar;
            conv.extra = userInfo?.extra;
          } else if (conv.conversation?.conversationType === 2) {
            const groupInfo = await JMI.getGroupInfo(conv.conversation?.groupId);
            conv.name = groupInfo?.groupName;
            conv.avatar = groupInfo?.portrait;
            conv.extra = groupInfo?.extra;
          }
          if (conv.lastMessage) {
            const userInfo = await JMI.getUserInfo(conv.lastMessage.senderUserId);
            conv.lastMessage.senderUserName = userInfo?.nickname;
            conv.lastMessage.senderUserAvatar = userInfo?.avatar;
            conv.lastMessage.senderUserExtra = userInfo?.extra;
          }
        });
        resolve(convs || []);
      }).catch(err => {
        console.error(err);
        reject(err);
      });
    });
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

  /**
   * 上传图片
   * @param {string} localPath - 图片本地路径
   * @returns {Promise<string>} 图片URL
   */
  static uploadImage(localPath) {
    return JMI.uploadImage(localPath);
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
      async (event) => {
        if (event.messageId === messageId) {
          const msgInfo = await this.buildMessageInfo(event.message);
          callback.onSuccess?.(msgInfo);
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
      return this.buildMessageInfo(localMsg)
    } catch (error) {
      callback.onError?.(JSON.stringify(error), -1);
      successListener.remove();
      errorListener.remove();
      console.error("sendMessage error:", error);
    }
  }

  /**
   * 保存消息到本地数据库
   * 场景：在客户端本地插入一条消息，消息不需要发送出去
   * @param {Object} message - 保存消息对象
   * @param {Object} message.conversation - 会话对象
   * @param {Object} message.content - 消息内容
   * @param {Object} [message.options] - 消息扩展选项
   * @param {number} [message.direction=1] - 消息方向: 1-发送, 2-接收
   * @returns {Promise<Message>} - 保存的消息对象
   * @example
   * ```javascript
   * const message = {
   *   conversation: {
   *     conversationType: 1,
   *     conversationId: 'user123'
   *   },
   *   content: new TextMessageContent('Hello'),
   *   options: {
   *     pushData: { content: 'New message', extra: '' }
   *   },
   *   direction: 1
   * };
   * const savedMessage = await JuggleIM.saveMessage(message);
   * ```
   */
  static async saveMessage(message) {
    console.log("saveMessage message:", message);

    try {
      const savedMsg = await JMI.saveMessage(message);
      return this.buildMessageInfo(savedMsg);
    } catch (error) {
      console.error("saveMessage error:", error);
      throw error;
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
      async (event) => {
        console.log("onMediaMessageSent msg:", event);
        if (event.messageId === messageId) {
          const msgInfo = await this.buildMessageInfo(event.message);
          callback.onSuccess?.(msgInfo);
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
      console.log("sendImageMessage localMsg:", localMsg);
      if (localMsg.content?.local) {
        localMsg.content.localPath = localMsg.content.local;
      }
      return this.buildMessageInfo(localMsg)
    } catch (error) {
      progressListener.remove();
      successListener.remove();
      errorListener.remove();
      cancelListener.remove();
      console.error("sendImageMessage error:", error);
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
      return this.buildMessageInfo(localMsg)
    } catch (error) {
      progressListener.remove();
      successListener.remove();
      errorListener.remove();
      cancelListener.remove();
      console.error("sendFileMessage error:", error);
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
      async (event) => {
        if (event.messageId === messageId) {
          console.log("onMediaMessageSent msg:", event);
          const msgInfo = await this.buildMessageInfo(event.message);
          callback.onSuccess?.(msgInfo);
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
      const localMsg = await JMI.sendVoiceMessage(message, messageId);
      return this.buildMessageInfo(localMsg)
    } catch (error) {
      progressListener.remove();
      successListener.remove();
      errorListener.remove();
      cancelListener.remove();
      console.error("sendVoiceMessage error:", error);
    }
  }

  /**
   * 发送合并消息（构建 MergeMessage 并发送）
   * @param {MergeMessageContent} mergedMessage - 要合并转发的消息 ID 列表
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
    return new Promise((resolve, reject) => {
      JMI.getMessages(conversation, direction, options).then(res => {
        const msgs = res?.messages;
        msgs?.forEach(async (msg) => {
          const userInfo = await JMI.getUserInfo(msg.senderUserId);
          msg.senderUserName = userInfo?.nickname;
          msg.senderUserAvatar = userInfo?.avatar;
          msg.senderUserExtra = userInfo?.extra;
        });
        resolve(res);
      }).catch(err => {
        console.error(err);
        reject(err);
      });
    });
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
   * @returns {Promise<boolean>} 发送结果
   */
  static sendReadReceipt(conversation, messageIds) {
    return JMI.sendReadReceipt(conversation, messageIds);
  }

  /**
   * 更新消息
   * @param {string} messageId - 消息ID
   * @param {MessageContent} content - 新的消息内容
   * @param {Conversation} conversation - 会话对象
   * @param {UpdateMessageCallback} callback - 回调对象
   * @returns {Promise<Message>} 更新后的消息对象
   */
  static async updateMessage(messageId, content, conversation, callback = {}) {
    try {
      const updatedMessage = await JMI.updateMessage(messageId, content, conversation);
      if (callback.onSuccess) {
        callback.onSuccess(updatedMessage);
      }
      return updatedMessage;
    } catch (error) {
      if (callback.onError) {
        callback.onError(error.code || -1);
      }
    }
  }

  /**
   * 设置消息置顶
   * @param {string} messageId - 消息ID
   * @param {object} conversation - 会话对象
   * @param {boolean} isTop - 是否置顶
   * @returns {Promise<boolean>} 设置结果
   */
  static setMessageTop(messageId, conversation, isTop) {
    return JMI.setMessageTop(messageId, conversation, isTop);
  }

  /**
   * 获取合并消息列表
   * @param {string} messageId - 合并消息ID
   * @returns {Promise<Message[]>} 消息列表
   */
  static getMergedMessageList(messageId) {
    return JMI.getMergedMessageList(messageId);
  }

  /**
   * 从服务端获取用户信息
   * @param {string} userId - 用户ID
   * @returns {Promise<UserInfo>} 用户信息
   */
  static fetchUserInfo(userId) {
    return JMI.fetchUserInfo(userId);
  }

  /**
   * 从服务端获取群组信息
   * @param {string} groupId - 群组ID
   * @returns {Promise<GroupInfo>} 群组信息
   */
  static fetchGroupInfo(groupId) {
    return JMI.fetchGroupInfo(groupId);
  }

  /**
   * 批量获取用户信息
   * @param {Array<string>} userIdList - 用户ID列表
   * @returns {Promise<UserInfo[]>} 用户信息列表
   */
  static getUserInfoList(userIdList) {
    return JMI.getUserInfoList(userIdList);
  }

  /**
   * 批量获取群组信息
   * @param {Array<string>} groupIdList - 群组ID列表
   * @returns {Promise<GroupInfo[]>} 群组信息列表
   */
  static getGroupInfoList(groupIdList) {
    return JMI.getGroupInfoList(groupIdList);
  }

  /**
   * 重发消息
   * @param {import("juggleim-rnsdk").Message} message
   * @param {import("juggleim-rnsdk").SendMessageCallback} callback - 回调对象
   * @returns {import("juggleim-rnsdk").Message} - 消息对象
   */
  static async resendMessage(
    message,
    callback = {}
  ) {
    console.log("resendMessage message:", message);

    // 生成唯一标识符以避免回调冲突
    const messageId = Math.random().toString(36).substr(2, 9) + Date.now();

    const successListener = juggleIMEmitter.addListener(
      "onMessageSent",
      async (event) => {
        if (event.messageId === messageId) {
          const msgInfo = await this.buildMessageInfo(event.message);
          callback.onSuccess?.(msgInfo);
          successListener.remove();
          errorListener.remove();
        }
      }
    );

    const errorListener = juggleIMEmitter.addListener(
      "onMessageSentError",
      async (event) => {
        if (event.messageId === messageId) {
          callback.onError?.(event.message, event.errorCode || -1);
          successListener.remove();
          errorListener.remove();
        }
      }
    );

    try {
      const localMsg = await JMI.resendMessage(message, messageId);
      const msgInfo = await this.buildMessageInfo(localMsg);
      console.log("resendMessage msgInfo:", msgInfo);
      return msgInfo;
    } catch (error) {
      callback.onError?.(JSON.stringify(error), -1);
      successListener.remove();
      errorListener.remove();
      console.error("resendMessage error:", error);
    }
  }

  /**
   * 重发媒体消息
   * @param {import("juggleim-rnsdk").Message} message
   * @param {import("juggleim-rnsdk").SendMediaMessageCallback} callback - 回调对象
   * @returns {import("juggleim-rnsdk").Message} - 消息对象
   */
  static async resendMediaMessage(
    message,
    callback = {}
  ) {
    console.log("resendMediaMessage message:", message);

    const messageId = Math.random().toString(36).substr(2, 9) + Date.now();

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
      async (event) => {
        if (event.messageId === messageId) {
          const msgInfo = await this.buildMessageInfo(event.message);
          callback.onSuccess?.(msgInfo);
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
      return await JMI.resendMediaMessage(message, messageId);
    } catch (error) {
      callback.onError?.(JSON.stringify(error), -1);
      progressListener.remove();
      successListener.remove();
      errorListener.remove();
      cancelListener.remove();
      console.error("resendMediaMessage error:", error);
    }
  }

  /**
   * 发送媒体消息
   * @param {import("juggleim-rnsdk").SendMessageObject} message - 消息内容
   * @param {import("juggleim-rnsdk").SendMediaMessageCallback} callback - 回调对象
   * @returns {Promise<import("juggleim-rnsdk").Message>} - 消息对象
   */
  static async sendMediaMessage(message, callback = {}) {
    const messageId = Math.random().toString(36).substr(2, 9) + Date.now();
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
          const msgInfo = this.buildMessageInfo(event.message);
          callback.onSuccess?.(msgInfo);
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
      var msg = null;
      if (Platform.OS === "android") {
        msg = await JMI.sendMediaMessage(message, messageId);
      } else {
        const messageWithId = { ...message, messageId };
        msg = await JMI.sendMediaMessage(messageWithId);
      }
      const msgInfo = await this.buildMessageInfo(msg);
      return msgInfo;
    } catch (error) {
      callback.onError?.(JSON.stringify(error), -1);
      progressListener.remove();
      successListener.remove();
      errorListener.remove();
      cancelListener.remove();
      console.error("sendMediaMessage error:", error);
    }
  }
}

export * from './types';
export * from './call';
export * from './moment/types';
import { JuggleIMMoment } from './moment/index';

export {
  JuggleIMMoment,
  JuggleIM
};
export default JuggleIM;