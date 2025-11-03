declare module 'im-rn-sdk' {
  /**
   * 连接状态类型
   */
  export type ConnectionStatus = 'connected' | 'connecting' | 'disconnected' | 'failure' | 'dbOpen' | 'dbClose';
  
  /**
   * 会话类型
   */
  export enum ConversationType {
    PRIVATE = 1,
    GROUP = 2,
    CHATROOM = 3,
    SYSTEM = 4
  }

  /**
   * 会话对象
   */
  export interface Conversation {
    conversationType: ConversationType;
    conversationId: string;
  }

  /**
   * 消息内容基类
   */
  export interface MessageContent {
    contentType: string;
  }

  /**
   * 文本消息内容
   */
  export interface TextMessageContent extends MessageContent {
    content: string;
  }

  /**
   * 图片消息内容
   */
  export interface ImageMessageContent extends MessageContent {
    url: string;
    name: string;
    width: number;
    height: number;
  }

  /**
   * 文件消息内容
   */
  export interface FileMessageContent extends MessageContent {
    url: string;
    name: string;
    size: number;
  }

  /**
   * 语音消息内容
   */
  export interface VoiceMessageContent extends MessageContent {
    url: string;
    duration: number;
  }

  /**
   * 消息对象
   */
  export interface Message {
    messageId: string;
    clientMsgNo: number;
    timestamp: number;
    senderId: string;
    conversation: Conversation;
    content: MessageContent;
  }

  /**
   * 用户信息
   */
  export interface UserInfo {
    userId: string;
    nickname: string;
    avatar: string;
  }


  export interface MessageReactionItem {
    reactionId: string;
    userInfoList: UserInfo[];
  }

  /**
   * 消息回应
   */
  export interface MessageReaction {
    messageId: string;
    reactionType: string;
    userId: string;
    timestamp: number;
  }

  /**
   * 群消息阅读信息
   */
  export interface GroupMessageReadInfo {
    readCount: number;
    memberCount: number;
  }

  /**
   * 会话信息
   */
  export interface ConversationMentionInfo {
    mentionMsgList: MentionMsg[];
  }

  export interface MentionMsg {
    senderId: string;
    msgId: string;
    msgTime: number;
    type: number; // MentionType枚举值
  }

  export interface ConversationInfo {
    conversation: Conversation;
    unreadMessageCount: number;
    isTop: boolean;
    isMute: boolean;
    lastMessage?: Message;
    topTime: number;
    sortTime: number;
    hasUnread: boolean;
    draft: string;
    mentionInfo?: ConversationMentionInfo;
  }


  /**
   * 拉取方向枚举
   */
  export enum PullDirection {
    OLDER = 0,
    NEWER = 1
  }

  /**
   * 获取会话选项
   */
  export interface GetConversationOptions {
    conversationTypes?: number[];
    count: number;
    timestamp: number;
    direction: PullDirection;
  }

  /**
   * 简单回调接口
   */
  export interface SimpleCallback {
    onSuccess: () => void;
    onError: (errorCode: number) => void;
  }

  /**
   * 创建会话回调接口
   */
  export interface CreateConversationCallback {
    onSuccess: (conversationInfo: ConversationInfo) => void;
    onError: (errorCode: number) => void;
  }

    /**
   * 获取会话信息列表回调接口
   */
    export interface GetConversationInfoListCallback {
      onSuccess: (conversationInfoList: ConversationInfo[]) => void;
      onError: (errorCode: number) => void;
    }
  
    /**
     * 获取会话信息回调接口
     */
    export interface GetConversationInfoCallback {
      onSuccess: (conversationInfo: ConversationInfo | null) => void;
      onError: (errorCode: number) => void;
    }
  
    /**
     * 获取未读数回调接口
     */
    export interface GetUnreadCountCallback {
      onSuccess: (count: number) => void;
      onError: (errorCode: number) => void;
    }
  
    /**
     * 获取草稿回调接口
     */
    export interface GetDraftCallback {
      onSuccess: (draft: string) => void;
      onError: (errorCode: number) => void;
    }
  
    /**
     * 会话标签选项
     */
    export interface ConversationTagOptions {
      tagId: string;
      conversations: Conversation[];
    }


  /**
   * 连接状态监听器回调函数
   */
  export type ConnectionStatusListener = (status: ConnectionStatus, code: number, extra: string) => void;
  
  /**
   * 消息监听器回调函数
   */
  export interface MessageListener {
    onMessageReceive?: (message: Message) => void;
    onMessageRecall?: (message: Message) => void;
    onMessageUpdate?: (message: Message) => void;
    onMessageDelete?: (conversation: Conversation, clientMsgNos: number[]) => void;
    onMessageClear?: (conversation: Conversation, timestamp: number, senderId: string) => void;
    onMessageReactionAdd?: (conversation: Conversation, reaction: MessageReaction) => void;
    onMessageReactionRemove?: (conversation: Conversation, reaction: MessageReaction) => void;
    onMessageSetTop?: (message: Message, operator: UserInfo, isTop: boolean) => void;
  }

  /**
   * 消息阅读状态监听器回调函数
   */
  export interface MessageReadReceiptListener {
    onMessagesRead?: (conversation: Conversation, messageIds: string[]) => void;
    onGroupMessagesRead?: (conversation: Conversation, messages: { [messageId: string]: GroupMessageReadInfo }) => void;
  }

  /**
   * 消息销毁监听器回调函数
   */
  export interface MessageDestroyListener {
    onMessageDestroyTimeUpdate?: (messageId: string, conversation: Conversation, destroyTime: number) => void;
  }

  /**
   * 会话监听器回调函数
   */
  export interface ConversationListener {
    onConversationInfoAdd?: (conversations: ConversationInfo[]) => void;
    onConversationInfoUpdate?: (conversations: ConversationInfo[]) => void;
    onConversationInfoDelete?: (conversations: ConversationInfo[]) => void;
    onTotalUnreadMessageCountUpdate?: (count: number) => void;
  }
  
  /**
   * Juggle IM React Native SDK
   */
  export default class JuggleIM {
    /**
     * 设置服务器地址列表
     * @param urls 服务器地址列表
     */
    static setServerUrls(urls: string[]): void;

    /**
     * 初始化SDK
     * @param appKey 应用唯一标识
     */
    static init(appKey: string): void;
    
    /**
     * 连接到服务器
     * @param token 用户token
     */
    static connect(token: string): void;
    
    /**
     * 添加连接状态监听器
     * @param key 监听器标识
     * @param listener 监听器回调函数
     * @returns 返回取消监听的函数
     */
    static addConnectionStatusListener(key: string, listener: ConnectionStatusListener): () => void;

    /**
     * 添加消息监听器
     * @param key 监听器标识
     * @param listener 监听器回调函数
     * @returns 返回取消监听的函数
     */
    static addMessageListener(key: string, listener: MessageListener): () => void;

    /**
     * 添加消息阅读状态监听器
     * @param key 监听器标识
     * @param listener 监听器回调函数
     * @returns 返回取消监听的函数
     */
    static addMessageReadReceiptListener(key: string, listener: MessageReadReceiptListener): () => void;

    /**
     * 添加消息销毁监听器
     * @param key 监听器标识
     * @param listener 监听器回调函数
     * @returns 返回取消监听的函数
     */
    static addMessageDestroyListener(key: string, listener: MessageDestroyListener): () => void;

    /**
     * 添加会话监听器
     * @param key 监听器标识
     * @param listener 监听器回调函数
     * @returns 返回取消监听的函数
     */
    static addConversationListener(key: string, listener: ConversationListener): () => void;

       /**
     * 获取会话信息列表
     * @param options 获取选项
     * @param callback 回调函数
     */
       static getConversationInfoList(options: GetConversationOptions, callback: GetConversationInfoListCallback): void;

       /**
        * 获取单个会话信息
        * @param conversation 会话对象
        * @param callback 回调函数
        */
       static getConversationInfo(conversation: Conversation, callback: GetConversationInfoCallback): void;
   
       /**
        * 创建会话信息
        * @param conversation 会话对象
        * @param callback 回调函数
        */
       static createConversationInfo(conversation: Conversation, callback: CreateConversationCallback): void;
   
       /**
        * 删除会话信息
        * @param conversation 会话对象
        * @param callback 回调函数
        */
       static deleteConversationInfo(conversation: Conversation, callback: SimpleCallback): void;
   
       /**
        * 设置会话免打扰状态
        * @param conversation 会话对象
        * @param isMute 是否免打扰
        * @param callback 回调函数
        */
       static setMute(conversation: Conversation, isMute: boolean, callback: SimpleCallback): void;
   
       /**
        * 设置会话置顶状态
        * @param conversation 会话对象
        * @param isTop 是否置顶
        * @param callback 回调函数
        */
       static setTop(conversation: Conversation, isTop: boolean, callback: SimpleCallback): void;
   
       /**
        * 清除会话未读数
        * @param conversation 会话对象
        * @param callback 回调函数
        */
       static clearUnreadCount(conversation: Conversation, callback: SimpleCallback): void;
   
       /**
        * 清除总未读数
        * @param callback 回调函数
        */
       static clearTotalUnreadCount(callback: SimpleCallback): void;
   
       /**
        * 获取总未读数
        * @param callback 回调函数
        */
       static getTotalUnreadCount(callback: GetUnreadCountCallback): void;
   
       /**
        * 设置会话草稿
        * @param conversation 会话对象
        * @param draft 草稿内容
        * @param callback 回调函数
        */
       static setDraft(conversation: Conversation, draft: string, callback: SimpleCallback): void;
   
       /**
        * 清除会话草稿
        * @param conversation 会话对象
        * @param callback 回调函数
        */
       static clearDraft(conversation: Conversation, callback: SimpleCallback): void;
   
       /**
        * 设置会话未读状态
        * @param conversation 会话对象
        * @param isUnread 是否未读
        * @param callback 回调函数
        */
       static setUnread(conversation: Conversation, isUnread: boolean, callback: SimpleCallback): void;
   
       /**
        * 获取置顶会话信息列表
        * @param conversationTypes 会话类型列表
        * @param callback 回调函数
        */
       static getTopConversationInfoList(conversationTypes: number[], callback: GetConversationInfoListCallback): void;
   
       /**
        * 获取指定类型的未读数
        * @param conversationTypes 会话类型列表
        * @param callback 回调函数
        */
       static getUnreadCountWithTypes(conversationTypes: number[], callback: GetUnreadCountCallback): void;
   
       /**
        * 将会话添加到标签
        * @param options 标签选项
        * @param callback 回调函数
        */
       static addConversationsToTag(options: ConversationTagOptions, callback: SimpleCallback): void;
   
       /**
        * 从标签中移除会话
        * @param options 标签选项
        * @param callback 回调函数
        */
       static removeConversationsFromTag(options: ConversationTagOptions, callback: SimpleCallback): void;
   
  }

    
}
