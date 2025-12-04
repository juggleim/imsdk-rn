declare module "juggleim-rnsdk" {
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
   * @property {string} contentType - 消息内容类型
   *           枚举：jg:text, jg:img, jg:file, jg:voice
   */
  export interface MessageContent {
    contentType: string;
  }

  /**
   * 消息内容基类
   * @property {string} contentType - 消息内容类型
   *           枚举：jg:text, jg:img, jg:file, jg:voice
   */
  export abstract class MessageContent {
    abstract contentType: string;
  }
  
  /**
   * 文本消息内容
   */
  export class TextMessageContent extends MessageContent {
    contentType = 'jg:text';
    content: string;
    constructor(content: string) {
      super();
      this.content = content;
    }
  }

  /**
   * 撤回消息内容
   */
  export class RecallInfoMessageContent extends MessageContent {
    contentType = 'jg:recallinfo';
  }

  /**
   * 合并消息内容
   */
  export class MergeMessageContent extends MessageContent {
    contentType = 'jg:merge';

    constructor(
      title?: string,
      conversation?: Conversation,
      messageIdList?: string[],
      previewList?: MergeMessagePreviewUnit[]
    );

    // 对应 Java 字段
    title?: string;
    containerMsgId?: string;
    conversation?: Conversation;
    messageIdList?: string[];
    previewList?: MergeMessagePreviewUnit[];
    extra?: string;

    conversationDigest?(): string;
    getTitle?(): string | undefined;
    getContainerMsgId?(): string | undefined;
    setContainerMsgId?(containerMsgId: string): void;
    getConversation?(): Conversation | undefined;
    setConversation?(conversation: Conversation): void;
    getMessageIdList?(): string[] | undefined;
    getPreviewList?(): MergeMessagePreviewUnit[] | undefined;
    getExtra?(): string | undefined;
    setExtra?(extra: string): void;
  }

  /**
   * 合并消息预览单元
   */
  export class MergeMessagePreviewUnit {
    constructor(previewContent?: string, sender?: UserInfo);

    previewContent?: string;
    sender?: UserInfo;

    getPreviewContent?(): string | undefined;
    setPreviewContent?(previewContent: string): void;
    getSender?(): UserInfo | undefined;
    setSender?(sender: UserInfo): void;
  }


  /**
   * 图片消息内容
   * @property {string} localPath - 图片本地路径：支持 /
   * @property {string} [thumbnailLocalPath] - 缩略图本地路径：支持 /
   * @property {string} [url] - 图片远程URL
   * @property {string} [thumbnailUrl] - 缩略图远程URL
   * @property {number} width - 图片宽度
   * @property {number} height - 图片高度
   */
  export class ImageMessageContent extends MessageContent {
    localPath: string;
    thumbnailLocalPath?: string;
    url?: string;
    thumbnailUrl?: string;
    width: number;
    height: number;

    contentType = 'jg:img';
  }

  /**
   * 文件消息内容
   * @property {string} localPath - 文件本地路径：支持 /
   * @property {string} [url] - 文件远程URL
   * @property {string} name - 文件名称
   * @property {number} size - 文件大小，单位字节
   * @property {string} [type] - 文件类型（MIME类型）
   */
  export class FileMessageContent extends MessageContent {
    localPath: string;
    url?: string;
    name: string;
    size: number;
    type?: string;

    contentType = 'jg:file';
  }

  /**
   * 语音消息内容
   * @property {string} localPath - 语音本地路径：支持 /
   * @property {string} [url] - 语音远程URL
   * @property {number} duration - 语音时长，单位秒
   */
  export class VoiceMessageContent extends MessageContent {
    localPath: string;
    url?: string;
    duration: number;

    contentType = 'jg:voice';
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
    mentionInfo: MessageMentionInfo;
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

  export interface MessageMentionInfo {
    /**
     *   DEFAULT(0),
     *   ALL(1),
     *   SOMEONE(2),
     *   ALL_AND_SOMEONE(3);
     */
    type: number;
    targetUsers: UserInfo[];
  }

  export interface MentionMsg {
    senderId: string;
    msgId: string;
    msgTime: number;
    /**
     *   DEFAULT(0),
     *   ALL(1),
     *   SOMEONE(2),
     *   ALL_AND_SOMEONE(3);
     */
    type: number;
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
   * 分页获取会话选项
   * @property {number} count - 获取数量
   * @property {number} timestamp - 上一页最后一条数据的时间戳
   * @property {number} direction - 拉取方向: 0-更新的消息, 1-更早的消息
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
    onSuccess?: (message: Message) => void;
    onError?: (message: Message, errorCode: number) => void;
  }

  // 获取消息相关接口
  export interface GetMessageOptions {
    count?: number;
    startTime?: number;
  }
  export interface SendMessageObject {
    conversationType: number;
    conversationId: string;
    content: MessageContent;
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
   * 发送媒体消息回调接口
   */
  export interface SendMediaMessageCallback {
    onProgress?: (progress: number, message: Message) => void;
    onSuccess?: (message: Message) => void;
    onError?: (message: Message, errorCode: number) => void;
    onCancel?: (message: Message) => void;
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
    ): Promise<ConversationInfo[]>;

    /**
     * 获取单个会话信息
     * @param {Conversation} conversation 会话对象
     * @returns {Promise<ConversationInfo | null>} 会话信息对象
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
      conversation: Conversation
    ): Promise<ConversationInfo>;

    /**
     * 删除会话信息
     * @param conversation 会话对象
     * @param callback 回调函数
     */
    static deleteConversationInfo(
      conversation: Conversation,
      callback: SimpleCallback
    ): Promise<Boolean>;

    /**
     * 设置会话免打扰状态
     * @param conversation 会话对象
     * @param isMute 是否免打扰
     * @param callback 回调函数
     */
    static setMute(
      conversation: Conversation,
      isMute: boolean
    ): Promise<Boolean>;

    /**
     * 设置会话置顶状态
     * @param conversation 会话对象
     * @param isTop 是否置顶
     * @param callback 回调函数
     */
    static setTop(conversation: Conversation, isTop: boolean): Promise<Boolean>;

    /**
     * 清除会话未读数
     * @param conversation 会话对象
     * @param callback 回调函数
     */
    static clearUnreadCount(conversation: Conversation): Promise<Boolean>;

    /**
     * 清除总未读数
     * @param callback 回调函数
     */
    static clearTotalUnreadCount(): Promise<Boolean>;

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
      draft: string
    ): Promise<Boolean>;

    /**
     * 清除会话草稿
     * @param conversation 会话对象
     * @param callback 回调函数
     */
    static clearDraft(conversation: Conversation): Promise<Boolean>;

    /**
     * 设置会话未读状态
     * @param conversation 会话对象
     * @param isUnread 是否未读
     * @param callback 回调函数
     */
    static setUnread(
      conversation: Conversation,
      isUnread: boolean
    ): Promise<Boolean>;

    /**
     * 获取置顶会话信息列表
     * @param count 获取数量
     * @param timestamp 上一页最后一条数据的时间戳
     * @param direction 拉取方向: 0-更新的消息, 1-更早的消息
     * @returns {Promise<ConversationInfo[]>} 会话信息列表
     */
    static getTopConversationInfoList(
      count: number,
      timestamp: number,
      direction: number
    ): Promise<ConversationInfo[]>;

    /**
     * 获取指定类型的未读数
     * @param conversationTypes 会话类型数组
     * @returns {Promise<number>} 未读数
     */
    static getUnreadCountWithTypes(
      conversationTypes: number[]
    ): Promise<number>;

    /**
     * 将会话添加到标签
     * @param options 标签选项
     */
    static addConversationsToTag(
      options: ConversationTagOptions
    ): Promise<Boolean>;

    /**
     * 从标签中移除会话
     * @param options 标签选项
     */
    static removeConversationsFromTag(
      options: ConversationTagOptions
    ): Promise<Boolean>;

    /**
     * 发送消息
     * @param {SendMessageObject} message  发送消息对象
     * @param {SendMessageCallback} [callback] 发送消息回调函数
     * @returns {Promise<Message>} 发送的消息对象
     */
    static sendMessage(
      message: SendMessageObject,
      callback?: SendMessageCallback
    ): Promise<Message>;


    /**
     * 发送合并消息
     * @param {string} title 合并消息的标题
     * @param {string[]} messageIds 要合并的消息ID列表
     * @param {Conversation} conversation 目标会话对象
     * @param {SendMessageCallback} [callback] 发送消息回调函数
     * @returns {Promise<Message>} 发送的消息对象
     */
    static sendMergeMessage(
      message: MergeMessageContent,
      conversation: Conversation,
      callback?: SendMessageCallback
    ): Promise<Message>;

    /**
     * 发送图片消息
     * 示例
     * ```javascript
     * const imageContent = {
     *  contentType: 'image',
     *  localPath: '/path/to/image',
     *  width: 800,
     *  height: 600,
     * };
     * @param {SendMessageObject} message
     * @param {SendMediaMessageCallback} [callback] 发送消息回调函数
     * @returns {Promise<Message>} 发送的消息对象
     */
    static sendImageMessage(
      message: SendMessageObject,
      callback?: SendMediaMessageCallback
    ): Promise<Message>;
    /**
     * 发送文件消息
     * 示例：
     * ```javascript
     * const fileContent = {
     *  contentType: 'file',
     *  localPath: '/path/to/file',
     *  name: 'filename.ext',
     *  size: 123456,
     * };
     * @param {SendMessageObject} message
     * @param {SendMediaMessageCallback} [callback] 发送消息回调函数
     * @returns {Promise<Message>} 发送的消息对象
     */
    static sendFileMessage(
      message: SendMessageObject,
      callback?: SendMediaMessageCallback
    ): Promise<Message>;

    /**
     * 发送语音消息
     * 示例
     * ```javascript
     * const voiceContent = {
     *  contentType: 'voice',
     *  localPath: '/path/to/voice',
     *  duration: 10, // 语音时长，单位秒
     * };
     * @param {number} conversationType 会话类型
     * @param {string} conversationId 会话ID
     * @param {VoiceMessageContent} content 语音消息内容
     * @param {SendMediaMessageCallback} [callback] 发送消息回调函数
     * @returns {Promise<Message>} 发送的消息对象
     */
    static sendVoiceMessage(
      conversationType: number,
      conversationId: string,
      content: VoiceMessageContent,
      callback?: SendMediaMessageCallback
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
     * @param messageId 消息ID列表
     * @param extras 扩展字段
     * @returns {Promise<Boolean>} 是否撤回成功
     */
    static recallMessage(
      messageId: string,
      extras?: { [key: string]: any }
    ): Promise<Boolean>;

    /**
     * 根据clientMsgNo列表删除消息
     * @param conversation 会话
     * @param clientMsgNos clientMsgNo列表
     */
    static deleteMessagesByClientMsgNoList(conversation: Conversation, clientMsgNos: number[]): Promise<boolean>;

    /**
     * 添加消息反应
     * @param messageId 消息ID
     * @param reactionId 反应ID
     * @returns {Promise<Boolean>} 是否添加成功
     */
    static addMessageReaction(
      messageId: string,
      reactionId: string
    ): Promise<Boolean>;

    /**
     * 移除消息反应
     * @param messageId 消息ID
     * @param reactionId 反应ID
     * @returns {Promise<Boolean>} 是否移除成功
     */
    static removeMessageReaction(
      messageId: string,
      reactionId: string
    ): Promise<Boolean>;
  }
}
