/**
 * BusinessCardMessage - 名片自定义消息
 * 用于发送好友名片
 */

import { CustomMessageContent } from "juggleim-rnsdk";

export class BusinessCardMessage extends CustomMessageContent {
    userId: string = '';
    nickname: string = '';
    avatar: string = '';

    constructor(userId?: string, nickname?: string, avatar?: string) {
        super('demo:businesscard');
        this.userId = userId || '';
        this.nickname = nickname || '';
        this.avatar = avatar || '';
    }
}
