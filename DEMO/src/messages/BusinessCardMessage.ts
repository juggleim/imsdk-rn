/**
 * BusinessCardMessage - 名片自定义消息
 * 用于发送好友名片
 */

import { CustomMessageContent, MessageFlag } from "juggleim-rnsdk";

export class BusinessCardMessage extends CustomMessageContent {
    userId: string = '';
    nickname: string = '';
    avatar: string = '';
    flag?: number;

    constructor(userId?: string, nickname?: string, avatar?: string, flag?: number) {
        super('demo:businesscard');
        this.userId = userId || '';
        this.nickname = nickname || '';
        this.avatar = avatar || '';
        // 默认设置 flag 为 IS_SAVE | IS_COUNTABLE (保存并计数)
        this.flag = flag ?? (MessageFlag.IS_SAVE | MessageFlag.IS_COUNTABLE);
    }
}
