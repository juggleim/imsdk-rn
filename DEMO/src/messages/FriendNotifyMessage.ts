/**
 * FriendNotifyMessage - 好友通知自定义消息
 * 用于好友操作通知（添加好友、通过好友请求等）
 */

import { CustomMessageContent } from "juggleim-rnsdk";

export class FriendNotifyMessage extends CustomMessageContent {
    type: number = 0; // 0: 添加, 1: 通过

    constructor(type?: number) {
        super('jgd:friendntf');
        if (type !== undefined) {
            this.type = type;
        }
    }
}
