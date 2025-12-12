/**
 * GroupNotifyMessage - 群通知自定义消息
 * 用于群组操作通知（添加成员、移除成员、重命名等）
 */

import { CustomMessageContent } from "juggleim-rnsdk";

export enum GroupNotifyType {
    OTHER = 0,
    ADD_MEMBER = 1,
    REMOVE_MEMBER = 2,
    RENAME = 3,
    CHANGE_OWNER = 4,
    JOIN = 5,
}

export interface UserInfo {
    user_id: string;
    nickname: string;
    avatar: string;
}

export class GroupNotifyMessage extends CustomMessageContent {
    type: GroupNotifyType = GroupNotifyType.OTHER;
    members: UserInfo[] = [];
    operator?: UserInfo;
    name: string = '';

    constructor() {
        super('jgd:grpntf');
    }

    /**
     * Get conversation digest for display in conversation list
     */
    conversationDigest(): string {
        return '[群通知]';
    }

    /**
     * Get human-readable description for display in message list
     */
    description(currentUserId?: string): string {
        const isSender = this.operator && currentUserId && this.operator.user_id === currentUserId;
        const sender = isSender ? '你' : (this.operator?.nickname || '');

        let userList = '';
        if (this.members.length > 0) {
            userList = this.members.map(m => m.nickname || m.user_id).join(', ');
        }

        let newOwner = '';
        let isOwner = false;
        if (this.type === GroupNotifyType.CHANGE_OWNER && this.members.length > 0) {
            const member = this.members[0];
            isOwner = currentUserId === member.user_id;
            newOwner = isOwner ? '你' : member.nickname;
        }

        switch (this.type) {
            case GroupNotifyType.ADD_MEMBER:
                return `${sender} 邀请 ${userList} 加入群聊`;
            case GroupNotifyType.REMOVE_MEMBER:
                return `${sender} 将 ${userList} 移除群聊`;
            case GroupNotifyType.RENAME:
                return `${sender} 修改群名称为 ${this.name}`;
            case GroupNotifyType.CHANGE_OWNER:
                return `${newOwner} 已成为新群主`;
            case GroupNotifyType.JOIN:
                return `${sender} 加入群聊`;
            default:
                return '';
        }
    }
}
