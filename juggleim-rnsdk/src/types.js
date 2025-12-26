
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
    }
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
