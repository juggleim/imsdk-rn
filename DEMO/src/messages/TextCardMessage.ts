/**
 * TextCardMessage - 文本卡片自定义消息
 * 用于发送包含标题、描述和链接的卡片消息
 */

import { CustomMessageContent, MessageFlag } from "juggleim-rnsdk";

export class TextCardMessage extends CustomMessageContent {
    title: string = '';
    description: string = '';
    url: string = '';
    flag?: number;

    constructor(title?: string, description?: string, url?: string, flag?: number) {
        super('demo:textcard');
        this.title = title || '';
        this.description = description || '';
        this.url = url || '';
        // 默认设置 flag 为 IS_SAVE | IS_COUNTABLE | IS_MUTE (保存、计数、静默)
        this.flag = flag ?? (MessageFlag.IS_SAVE | MessageFlag.IS_COUNTABLE | MessageFlag.IS_MUTE);
    }
}
