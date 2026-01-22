
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
 * 消息标志枚举
 * 支持使用或（|）操作组合多个标志
 * 
 * 如果使用自定义消息，不设置flag，默认都是 计数+存储
 */
export enum MessageFlag {
    NONE = 0,
    IS_CMD = 1, // 命令式消息：保证到达率，但不存储不计数
    IS_COUNTABLE = 2, // 计数消息：页面会显示未读数
    IS_STATUS = 4, // 状态消息：不保证到达率，例如输入状态
    IS_SAVE = 8, // 存储型消息
    IS_MODIFIED = 16, // 编辑型消息
    IS_MERGED = 32, // 合并消息
    IS_MUTE = 64, //静默消息：不通知/不推送
    IS_BROADCAST = 128, //广播消息：可以对多会话/多人发消息，但不会改变会话的sortTime
}

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
 * 
 */
export abstract class MessageContent {
    contentType: string;
    flag?: number;
}

/**
 * 自定义消息内容
 */
export class CustomMessageContent extends MessageContent {
    constructor(contentType: string);
}

/**
 * 自定义消息类构造函数类型
 */
export type CustomMessageConstructor = new () => MessageContent;

/**
 * 文本消息内容
 */
export class TextMessageContent extends MessageContent {
    contentType: string;
    content: string;
    constructor(content: string);
}

/**
 * 撤回消息内容: 'jg:recallinfo';
 * 最佳实践：设置【撤回监听】，根据onMessageRecall中消息的 senderUserId
 * 判断是否自己，然后显示【撤回了一条消息】/【xxx撤回了一条消息】
 * 
 * @property {string} contentType - 消息内容类型
 * @property {string} content - 消息内容
 */
export class RecallInfoMessageContent extends MessageContent {
    contentType: string;
}

/**
 * 合并消息内容:jg:merge
 * @property {string} title - 合并消息标题
 * @property {Conversation} conversation - 会话对象
 * @property {string[]} messageIdList - 消息ID列表
 * @property {MergeMessagePreviewUnit[]} previewList - 预览列表
 */
export class MergeMessageContent extends MessageContent {
    contentType: string;

    constructor(
        title?: string,
        conversation?: Conversation,
        messageIdList?: string[],
        previewList?: MergeMessagePreviewUnit[]
    );

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
 * @property {string} previewContent - 预览内容
 * @property {UserInfo} sender - 发送者
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

    contentType: string;
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

    contentType: string;
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

    contentType: string;
}

/**
 * 通话结束通知消息内容: jg:callfinishntf
 * @property {number} reason - 结束原因
 * @property {number} duration - 通话时长，单位秒
 * @property {number} mediaType - 媒体类型: 0-语音, 1-视频
 */
export class CallFinishNotifyMessageContent extends MessageContent {
    contentType: string;
    reason?: number;
    duration?: number;
    mediaType?: number;
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
 * @property {string} senderUserName - 发送者用户昵称
 * @property {string} senderUserAvatar - 发送者用户头像
 * @property {object} senderUserExtra - 发送者用户扩展信息
 * @property {string} messageId - 消息ID
 * @property {boolean} hasRead - 是否已读
 * @property {number} timestamp - 消息时间戳
 * @property {Conversation} conversation - 会话对象
 * @property {MessageContent} content - 消息内容
 * @property {GroupMessageReadInfo} [groupMessageReadInfo] - 群消息阅读信息（可选）
 * @property {MessageMentionInfo} mentionInfo - 消息提及信息
 * @property {Message} [referredMessage] - 引用的消息
 */
export interface Message {
    clientMsgNo: number;
    localAttribute: string;
    messageState: number;
    isEdit: boolean;
    direction: number;
    isDelete: boolean;
    senderUserId: string;
    senderUserName?: string;
    senderUserAvatar?: string;
    senderUserExtra?: { [key: string]: string };
    messageId: string;
    hasRead: boolean;
    timestamp: number;
    conversation: Conversation;
    content: MessageContent;
    groupMessageReadInfo?: GroupMessageReadInfo;
    mentionInfo: MessageMentionInfo;
    referredMessage?: Message;
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
    code: number;
}

/**
 * 用户信息
 * @property {string} userId - 用户ID
 * @property {string} nickname - 昵称
 * @property {string} [userName] - 用户名
 * @property {string} avatar - 头像
 * @property {string} [portrait] - 头像 (同 avatar)
 * @property {string | object} [extra] - 扩展信息
 * @property {number} [updateTime] - 更新时间
 * @property {number} [type] - 用户类型
 */
export interface UserInfo {
    userId: string;
    nickname: string;
    userName?: string;
    avatar: string;
    portrait?: string;
    extra?: string | object;
    updateTime?: number;
    type?: number;
}

/**
 * 群组信息
 * @property {string} groupId - 群组ID
 * @property {string} groupName - 群组名称
 * @property {string} portrait - 群组头像
 * @property {object} [extra] - 扩展信息
 * @property {number} [updatedTime] - 更新时间
 */
export interface GroupInfo {
    groupId: string;
    groupName: string;
    portrait: string;
    extra?: { [key: string]: string };
    updatedTime?: number;
}

/**
 * 群成员信息
 * @property {string} groupId - 群组ID
 * @property {string} userId - 用户ID
 * @property {string} groupDisplayName - 群昵称
 * @property {object} [extra] - 扩展信息
 * @property {number} [updatedTime] - 更新时间
 */
export interface GroupMember {
    groupId: string;
    userId: string;
    groupDisplayName: string;
    extra?: { [key: string]: string };
    updatedTime?: number;
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

/**
 * 推送数据
 */
export interface PushData {
    content: string;
    extra: string;
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

/**
 * 会话信息
 * @property {Conversation} conversation - 会话
 * @property {number} unreadCount - 未读消息数
 * @property {boolean} isTop - 是否置顶
 * @property {boolean} isMute - 是否静音
 * @property {Message} [lastMessage] - 最后一条消息
 * @property {number} topTime - 置顶时间
 * @property {number} sortTime - 排序时间
 * @property {boolean} hasUnread - 是否有未读消息
 * @property {string} draft - 草稿
 * @property {ConversationMentionInfo} [mentionInfo] - 会话提及信息
 * @property {string} [name] - 会话名称
 * @property {string} [avatar] - 会话头像
 * @property {object} [extra] - 会话"头像/名称"扩展信息
 */
export interface ConversationInfo {
    conversation: Conversation;
    unreadCount: number;
    isTop: boolean;
    isMute: boolean;
    lastMessage?: Message;
    topTime: number;
    sortTime: number;
    hasUnread: boolean;
    draft: string;
    mentionInfo?: ConversationMentionInfo;
    name?: string;
    avatar?: string;
    extra?: {};
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

export interface UpdateMessageCallback {
    onSuccess?: (message: Message) => void;
    onError?: (errorCode: number) => void;
}

// 获取消息相关接口
export interface GetMessageOptions {
    count?: number;
    startTime?: number;
}

// 发送消息实体对象
export interface SendMessageObject {
    conversationType: number;
    conversationId: string;
    content: MessageContent;
    mentionInfo?: MessageMentionInfo;
    pushData?: PushData;
    // 引用消息ID
    referredMessageId?: string;
}

/**
 * 保存消息选项
 * @property {MessageMentionInfo} [mentionInfo] - 消息提及信息
 * @property {string} [referredMessageId] - 引用的消息ID
 * @property {PushData} [pushData] - 推送数据
 * @property {number} [lifeTime] - 消息生命周期（毫秒）
 * @property {number} [lifeTimeAfterRead] - 消息阅读后生命周期（毫秒）
 */
export interface SaveMessageOptions {
    mentionInfo?: MessageMentionInfo;
    referredMessageId?: string;
    pushData?: PushData;
    lifeTime?: number;
    lifeTimeAfterRead?: number;
}

/**
 * 保存消息实体对象
 * @property {Conversation} conversation - 会话对象
 * @property {MessageContent} content - 消息内容
 * @property {SaveMessageOptions} [options] - 消息扩展选项
 * @property {number} [direction] - 消息方向: 1-发送, 2-接收
 */
export interface SaveMessageObject {
    conversation: Conversation;
    content: MessageContent;
    options?: SaveMessageOptions;
    direction?: number;
}
/**
 * 连接状态监听器回调函数
 * @param {ConnectionStatus} status - 连接状态
 * @param {number} code - 状态码
 *        0: CONNECT_SUCCESS 链接成功
 *        11000: CONNECT_ERROR 默认错误
 *        11001: CONNECT_APPKEY_IS_REQUIRE 未传 Appkey
 *        11002: CONNECT_TOKEN_NOT_EXISTS 未传 Token
 *        11003: CONNECT_APPKEY_NOT_EXISTS Appkey 不存在
 *        11004: CONNECT_TOKEN_ILLEGAL Token 不合法
 *        11005: CONNECT_TOKEN_UNAUTHORIZED Token 未授权
 *        11006: CONNECT_TOKEN_EXPIRE Token 已过期
 *        11008: CONNECT_UNSUPPORT_PLATFORM 不支持的平台类型
 *        11009: CONNECT_APP_BLOCKED App已封禁
 *        11010: CONNECT_USER_BLOCKED 用户已封禁
 *        11011: CONNECT_USER_KICKED 被踢下线
 *        11012: CONNECT_USER_LOGOUT 注销下线
 * @param {string} extra - 扩展信息
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
