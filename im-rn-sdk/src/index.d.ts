declare module "im-rn-sdk" {
  /**
   * 连接状态类型
   */
  export type ConnectionStatus =
    | "connected"
    | "connecting"
    | "disconnected"
    | "failure"
    | "dbOpen"
    | "dbClose";

  /**
   * 会话类型
   */
  export enum ConversationType {
    PRIVATE = 1,
    GROUP = 2,
    CHATROOM = 3,
    SYSTEM = 4,
  }

  /**
   * 会话对象
   * @property {number} conversationType - 会话类型 @ConversationType
   * @property {string} conversationId - 会话ID
   */
  export interface Conversation {
    conversationType: number;
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
   * @interface Message
   * @property {number} clientMsgNo - 客户端消息序号
   * @property {string} localAttribute - 本地属性
   * @property {number} messageState - 消息状态 : 0未知, 1-发送中, 2-已发送, 3-发送失败, 4-上传中
   * @property {boolean} isEdited - 是否已编辑
   * @property {number} direction - 消息方向: 1-发送, 2-接收
   * @property {boolean} isDelete - 是否已删除
   * @property {string} senderUserId - 发送者用户ID
   * @property {string} messageId - 消息ID
   * @property {boolean} hasRead - 是否已读
   * @property {number} timestamp - 消息时间戳
   * @property {Conversation} conversation - 会话对象
   * @property {MessageContent} content - 消息内容
   * @property {GroupMessageReadInfo} [groupMessageReadInfo] - 群消息阅读信息（可选）
   */
  export interface Message {
    clientMsgNo: number;
    localAttribute: string;
    messageState: number;
    isEdited: boolean;
    direction: number;
    isDelete: boolean;
    senderUserId: string;
    messageId: string;
    hasRead: boolean;
    timestamp: number;
    conversation: Conversation;
    content: MessageContent;
    groupMessageReadInfo?: GroupMessageReadInfo;
  }

  /**
   * 消息响应对象
   * @interface MessageResponse
   * @property {Message[]} messages - 消息列表
   * @property {number} timestamp - 时间戳
   * @property {boolean} hasMore - 是否有更多消息
   */
  export interface MessageResponse {
    messages: Message[];
    timestamp: number;
    hasMore: boolean;
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
   * 获取会话选项
   */
  export interface GetConversationOptions {
    count: number;
    timestamp: number;
    direction: number; //0-new, 1-old
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
    (conversationInfoList: ConversationInfo[]): void;
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

  export interface SendMessageResult {
    messageId: string;
    sentTime: number;
  }

  export interface SendMessageCallback {
    (message: Message, errorCode?: number): void;
  }

  // 获取消息相关接口
  export interface GetMessageOptions {
    count?: number;
    startTime?: number;
  }

  // 消息操作回调接口
  export interface MessageOperationCallback {
    (success: boolean, error?: string): void;
  }

  /**
   * 连接状态监听器回调函数
   */
  export type ConnectionStatusListener = (
    status: ConnectionStatus,
    code: number,
    extra: string
  ) => void;

  /**
   * 消息监听器回调函数
   */
  export interface MessageListener {
    onMessageReceive?: (message: Message) => void;
    onMessageRecall?: (message: Message) => void;
    onMessageUpdate?: (message: Message) => void;
    onMessageDelete?: (
      conversation: Conversation,
      clientMsgNos: number[]
    ) => void;
    onMessageClear?: (
      conversation: Conversation,
      timestamp: number,
      senderId: string
    ) => void;
    onMessageReactionAdd?: (
      conversation: Conversation,
      reaction: MessageReaction
    ) => void;
    onMessageReactionRemove?: (
      conversation: Conversation,
      reaction: MessageReaction
    ) => void;
    onMessageSetTop?: (
      message: Message,
      operator: UserInfo,
      isTop: boolean
    ) => void;
  }

  /**
   * 消息阅读状态监听器回调函数
   */
  export interface MessageReadReceiptListener {
    onMessagesRead?: (conversation: Conversation, messageIds: string[]) => void;
    onGroupMessagesRead?: (
      conversation: Conversation,
      messages: { [messageId: string]: GroupMessageReadInfo }
    ) => void;
  }

  /**
   * 消息销毁监听器回调函数
   */
  export interface MessageDestroyListener {
    onMessageDestroyTimeUpdate?: (
      messageId: string,
      conversation: Conversation,
      destroyTime: number
    ) => void;
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
    static addConnectionStatusListener(
      key: string,
      listener: ConnectionStatusListener
    ): () => void;

    /**
     * 添加消息监听器
     * @param key 监听器标识
     * @param listener 监听器回调函数
     * @returns 返回取消监听的函数
     */
    static addMessageListener(
      key: string,
      listener: MessageListener
    ): () => void;

    /**
     * 添加消息阅读状态监听器
     * @param key 监听器标识
     * @param listener 监听器回调函数
     * @returns 返回取消监听的函数
     */
    static addMessageReadReceiptListener(
      key: string,
      listener: MessageReadReceiptListener
    ): () => void;

    /**
     * 添加消息销毁监听器
     * @param key 监听器标识
     * @param listener 监听器回调函数
     * @returns 返回取消监听的函数
     */
    static addMessageDestroyListener(
      key: string,
      listener: MessageDestroyListener
    ): () => void;

    /**
     * 添加会话监听器
     * @param key 监听器标识
     * @param listener 监听器回调函数
     * @returns 返回取消监听的函数
     */
    static addConversationListener(
      key: string,
      listener: ConversationListener
    ): () => void;

    /**
     * 获取会话信息列表
     * @param options 获取选项
     * @returns {Promise<ConversationInfo[]>} 会话信息列表
     */
    static getConversationInfoList(
      options: GetConversationOptions
    ): Promise<ConversationInfo[] | null>;

    /**
     * 获取单个会话信息
     * @param conversation 会话对象
     * @param callback 回调函数
     */
    static getConversationInfo(
      conversation: Conversation
    ): Promise<ConversationInfo | null>;

    /**
     * 创建会话信息
     * @param conversation 会话对象
     * @param callback 回调函数
     */
    static createConversationInfo(
      conversation: Conversation,
      callback: CreateConversationCallback
    ): void;

    /**
     * 删除会话信息
     * @param conversation 会话对象
     * @param callback 回调函数
     */
    static deleteConversationInfo(
      conversation: Conversation,
      callback: SimpleCallback
    ): void;

    /**
     * 设置会话免打扰状态
     * @param conversation 会话对象
     * @param isMute 是否免打扰
     * @param callback 回调函数
     */
    static setMute(
      conversation: Conversation,
      isMute: boolean,
      callback: SimpleCallback
    ): void;

    /**
     * 设置会话置顶状态
     * @param conversation 会话对象
     * @param isTop 是否置顶
     * @param callback 回调函数
     */
    static setTop(
      conversation: Conversation,
      isTop: boolean,
      callback: SimpleCallback
    ): void;

    /**
     * 清除会话未读数
     * @param conversation 会话对象
     * @param callback 回调函数
     */
    static clearUnreadCount(
      conversation: Conversation,
      callback: SimpleCallback
    ): void;

    /**
     * 清除总未读数
     * @param callback 回调函数
     */
    static clearTotalUnreadCount(callback: SimpleCallback): void;

    /**
     * 获取总未读数
     * @param callback 回调函数
     */
    static getTotalUnreadCount(): Promise<number>;

    /**
     * 设置会话草稿
     * @param conversation 会话对象
     * @param draft 草稿内容
     * @param callback 回调函数
     */
    static setDraft(
      conversation: Conversation,
      draft: string,
      callback: SimpleCallback
    ): void;

    /**
     * 清除会话草稿
     * @param conversation 会话对象
     * @param callback 回调函数
     */
    static clearDraft(
      conversation: Conversation,
      callback: SimpleCallback
    ): void;

    /**
     * 设置会话未读状态
     * @param conversation 会话对象
     * @param isUnread 是否未读
     * @param callback 回调函数
     */
    static setUnread(
      conversation: Conversation,
      isUnread: boolean,
      callback: SimpleCallback
    ): void;

    /**
     * 获取置顶会话信息列表
     * @param conversationTypes 会话类型列表
     * @param callback 回调函数
     */
    static getTopConversationInfoList(
      conversationTypes: number[],
      callback: GetConversationInfoListCallback
    ): void;

    /**
     * 获取指定类型的未读数
     * @param conversationTypes 会话类型列表
     * @param callback 回调函数
     */
    static getUnreadCountWithTypes(
      conversationTypes: number[],
      callback: GetUnreadCountCallback
    ): void;

    /**
     * 将会话添加到标签
     * @param options 标签选项
     * @param callback 回调函数
     */
    static addConversationsToTag(
      options: ConversationTagOptions,
      callback: SimpleCallback
    ): void;

    /**
     * 从标签中移除会话
     * @param options 标签选项
     * @param callback 回调函数
     */
    static removeConversationsFromTag(
      options: ConversationTagOptions,
      callback: SimpleCallback
    ): void;

    /**
     * 发送消息
     * @param {object} message 消息对象
     * @param {number} message.conversationType 会话类型
     * @param {string} message.conversationId 会话ID
     * @param {MessageContent} message.content 消息内容
     * @param {Message} [message.referMsg] 引用消息
     * @param {object} [message.mentionInfo] 提及信息
     * @param {number} [message.mentionInfo.mentionType] 提及类型
     * @param {string[]} [message.mentionInfo.members] 提及成员列表
     * @param {number} [message.lifeTime] 消息生命周期，单位秒
     * @param {number} [message.lifeTimeAfterRead] 消息阅读后生命周期，单位秒
     * @param {SendMessageCallback} [callback] 发送消息回调函数
     * @returns {Message} 发送的消息对象
     */
    static async sendMessage(
      message: {
        conversationType: number;
        conversationId: string;
        content: MessageContent;
        referMsg?: Message;
        mentionInfo?: {
          mentionType?: number;
          members?: string[];
        };
        lifeTime?: number;
        lifeTimeAfterRead?: number;
      },
      callback?: SendMessageCallback
    ): Promise<Message>;

    /**
     * 获取历史消息
     * @param {Conversation} conversation 会话
     * @param {number} direction 拉取方向，0表示从startTime往后的消息，1表示从startTime往前的消息
     * @param {GetMessageOptions} options 获取消息选项
     * @returns {Promise<MessageResponse>} 消息响应对象，包含消息列表、时间戳和是否有更多消息
     */
    static getMessageList(
      conversation: Conversation,
      direction: number,
      options: GetMessageOptions
    ): Promise<MessageResponse>;

    /**
     * 撤回消息
     * @param message 消息对象
     */
    static recallMessage(
      message: {
        conversationType: number;
        conversationId: string;
        messageId: string;
        sentTime: number;
        exts?: { [key: string]: any };
      },
      extras?: { [key: string]: any },
      callback: MessageOperationCallback
    ): void;

    /**
     * 添加消息反应
     */
    static addMessageReaction(
      message: {
        conversationType: number;
        conversationId: string;
        messageId: string;
        reactionId: string;
      },
      reactionId: string,
      callback: MessageOperationCallback
    ): void;

    /**
     * 移除消息反应
     */
    static removeMessageReaction(
      message: {
        conversationType: number;
        conversationId: string;
        messageId: string;
        reactionId: string;
      },
      reactionId: string,
      callback: MessageOperationCallback
    ): void;

    /**
     * 添加收藏消息
     */
    static addFavoriteMessages(
      messages: Array<{
        conversationType: number;
        conversationId: string;
        senderId: string;
        messageId: string;
      }>,
      callback: MessageOperationCallback
    ): void;

    /**
     * 移除收藏消息
     */
    static removeFavorite(
      messages: Array<{
        conversationType: number;
        conversationId: string;
        senderId: string;
        messageId: string;
      }>,
      callback: MessageOperationCallback
    ): void;
  }
}
