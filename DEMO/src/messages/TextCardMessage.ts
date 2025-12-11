/**
 * TextCardMessage - 文本卡片自定义消息
 * 用于发送包含标题、描述和链接的卡片消息
 */

import { CustomMessageContent } from "juggleim-rnsdk";

export class TextCardMessage extends CustomMessageContent {
    title: string = '';
    description: string = '';
    url: string = '';

    constructor(title?: string, description?: string, url?: string) {
        super('demo:textcard');
        this.title = title || '';
        this.description = description || '';
        this.url = url || '';
    }
}
