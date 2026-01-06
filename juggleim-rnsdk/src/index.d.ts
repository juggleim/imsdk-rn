
export * from './types';
export * from './call';
export * from './moment/index';
export * from './moment/types';


import {
  ConnectionStatusListener,
  MessageListener,
  MessageReadReceiptListener,
  MessageDestroyListener,
  ConversationListener,
  GetConversationOptions,
  ConversationInfo,
  Conversation,
  SimpleCallback,
  ConversationTagOptions,
  SendMessageObject,
  SendMessageCallback,
  Message,
  MessageContent,
  MergeMessageContent,
  SendMediaMessageCallback,
  VoiceMessageContent,
  CustomMessageConstructor,
  UpdateMessageCallback,
  GetMessageOptions,
  MessageResponse,
  GroupInfo,
  GroupMember,
  UserInfo
} from './types';

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
   * 注册自定义消息类型
   * @param contentType 消息类型标识符(不能以 "jg:" 开头)
   * @param messageClass 自定义消息类的构造函数
   * @example
   * ```typescript
   * class CustomMessage implements CustomMessageContent {
   *   contentType = 'my:custom';
   *   value: string = '';
   * }
   * 
   * JuggleIM.registerCustomMessageType('my:custom', CustomMessage);
   * ```
   */
  static registerCustomMessageType(
    contentType: string,
    messageClass: CustomMessageConstructor
  ): void;

  /**
   * 连接到服务器
   * @param token 用户token
   */
  static connect(token: string): void;

  /**
   * 断开连接
   * @param pushable 是否继续接收推送
   */
  static disconnect(pushable: boolean): void;

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
   * 上传图片
   * @param localPath 图片本地路径
   * @returns {Promise<string>} 图片URL
   */
  static uploadImage(localPath: string): Promise<string>;

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
   *  contentType: 'jg:voice',
   *  localPath: '/path/to/voice',
   *  duration: 10, // 语音时长，单位秒
   * };
   * const message = {
   *   conversationType: 1,
   *   conversationId: 'user123',
   *   content: voiceContent,
   * };
   * @param {SendMessageObject} message
   * @param {SendMediaMessageCallback} [callback] 发送消息回调函数
   * @returns {Promise<Message>} 发送的消息对象
   */
  static sendVoiceMessage(
    message: SendMessageObject,
    callback?: SendMediaMessageCallback
  ): Promise<Message>;

  /**
   * 获取历史消息
   * @param {Conversation} conversation 会话
   * @param {number} direction 拉取方向，0 比startTime更新的消息，1 比startTime更旧的消息
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

  /**
   * 发送消息已读回执
   * @param conversation 会话对象
   * @param messageIds 消息ID列表
   * @returns {Promise<Boolean>} 是否发送成功
   */
  static sendReadReceipt(
    conversation: Conversation,
    messageIds: string[],
  ): Promise<Boolean>;

  /**
   * 获取用户信息
   * @param userId 用户ID
   * @returns {Promise<UserInfo | null>} 用户信息
   */
  static getUserInfo(userId: string): Promise<UserInfo | null>;

  /**
   * 获取群组信息
   * @param groupId 群组ID
   * @returns {Promise<GroupInfo | null>} 群组信息
   */
  static getGroupInfo(groupId: string): Promise<GroupInfo | null>;

  /**
   * 获取群成员信息
   * @param groupId 群组ID
   * @param userId 用户ID
   * @returns {Promise<GroupMember | null>} 群成员信息
   */
  static getGroupMember(groupId: string, userId: string): Promise<GroupMember | null>;

  /**
   * 更新消息
   * @param messageId 消息ID
   * @param content 新的消息内容
   * @param conversation 会话对象
   * @param callback 回调函数
   * @returns {Promise<Message>} 更新后的消息对象
   */
  static updateMessage(
    messageId: string,
    content: MessageContent,
    conversation: Conversation,
    callback?: UpdateMessageCallback
  ): Promise<Message>;

  /**
   * 设置消息置顶
   * @param messageId 消息ID
   * @param conversation 会话对象
   * @param isTop 是否置顶
   * @param callback 回调函数
   * @returns {Promise<Boolean>} 是否设置成功
   */
  static setMessageTop(
    messageId: string,
    conversation: Conversation,
    isTop: boolean,
  ): Promise<Boolean>;
  /**
   * 获取合并消息列表
   * @param messageId 合并消息ID
   * @returns {Promise<Message[]>} 消息列表
   */
  static getMergedMessageList(messageId: string): Promise<Message[]>;

  /**
   * 从服务端获取用户信息同时更新本地缓存为最新数据
   * 注意：可以在进入会话页面/个人详情页面时使用此接口
   * @param userId 用户ID
   * @returns {Promise<UserInfo | null>} 用户信息
   */
  static fetchUserInfo(userId: string): Promise<UserInfo | null>;

  /**
   * 从服务端获取群组信息同时更新本地缓存为最新数据
   * 注意：可以在进入群组页面时使用此接口
   * @param groupId 群组ID
   * @returns {Promise<GroupInfo | null>} 群组信息
   */
  static fetchGroupInfo(groupId: string): Promise<GroupInfo | null>;

  /**
   * 批量获取用户信息
   * @param userIdList 用户ID列表
   * @returns {Promise<UserInfo[]>} 用户信息列表
   */
  static getUserInfoList(userIdList: string[]): Promise<UserInfo[]>;

  /**
   * 批量获取群组信息
   * @param groupIdList 群组ID列表
   * @returns {Promise<GroupInfo[]>} 群组信息列表
   */
  static getGroupInfoList(groupIdList: string[]): Promise<GroupInfo[]>;
}


export * from './call';
