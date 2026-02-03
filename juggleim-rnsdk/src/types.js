
/**
 * 会话类型
 */
export const ConversationType = {
    PRIVATE: 1,
    GROUP: 2,
    CHATROOM: 3,
    SYSTEM: 4,
};

/**
 * 消息内容基类
 */
export class MessageContent {
    constructor() {
        this.contentType = "";
        this.flag = MessageFlag.IS_COUNTABLE | MessageFlag.IS_SAVE
    }
}
/**
 * 消息标志枚举
 * 支持使用或（|）操作组合多个标志
 * 
 * 如果使用自定义消息，不设置flag，默认都是 计数+存储
 */
export const MessageFlag = {
    NONE: 0,
    IS_CMD: 1, // 命令式消息：保证到达率，但不存储不计数
    IS_COUNTABLE: 2, // 计数消息：页面会显示未读数
    IS_STATUS: 4, // 状态消息：不保证到达率，例如输入状态
    IS_SAVE: 8, // 存储型消息
    IS_MODIFIED: 16, // 编辑型消息
    IS_MERGED: 32, // 合并消息
    IS_MUTE: 64, //静默消息：不通知/不推送
    IS_BROADCAST: 128, //广播消息：可以对多会话/多人发消息，但不会改变会话的sortTime
}
/**
 * 自定义消息内容
 */
export class CustomMessageContent extends MessageContent {
    constructor(contentType) {
        super();
        this.contentType = contentType;
    }
}

/**
 * 文本消息内容
 */
export class TextMessageContent extends MessageContent {
    constructor(content) {
        super();
        this.contentType = "jg:text";
        this.content = content;
    }
}

/**
 * 撤回消息内容
 */
export class RecallInfoMessageContent extends MessageContent {
    constructor() {
        super();
        this.contentType = "jg:recallinfo";
    }
}

/**
 * 合并消息内容
 */
export class MergeMessageContent extends MessageContent {
    constructor(
        title,
        conversation,
        messageIdList,
        previewList
    ) {
        super();
        this.contentType = "jg:merge";
        this.title = title;
        this.conversation = conversation;
        this.messageIdList = messageIdList;
        this.previewList = previewList;
    }
}

/**
 * 合并消息预览单元
 */
export class MergeMessagePreviewUnit {
    constructor(previewContent, sender) {
        this.previewContent = previewContent;
        this.sender = sender;
    }
}

/**
 * 图片消息内容
 */
export class ImageMessageContent extends MessageContent {
    constructor(localPath, width, height) {
        super();
        this.contentType = "jg:img";
        this.localPath = localPath;
        this.width = width;
        this.height = height;
    }
}

/**
 * 文件消息内容
 */
export class FileMessageContent extends MessageContent {
    constructor(localPath, name, size) {
        super();
        this.contentType = "jg:file";
        this.localPath = localPath;
        this.name = name;
        this.size = size;
    }
}

/**
 * 语音消息内容
 */
export class VoiceMessageContent extends MessageContent {
    constructor(localPath, duration) {
        super();
        this.contentType = "jg:voice";
        this.localPath = localPath;
        this.duration = duration;
    }
}

/**
 * 流式文本消息内容
 */
export class StreamTextMessageContent extends MessageContent {
    constructor(content = "", isFinished = false) {
        super();
        this.contentType = "jg:streamtext";
        this.content = content;
        this.isFinished = isFinished;
    }
}
