
import { UserInfo, SimpleCallback } from '../types';

export type MomentMediaType = 'image' | 'video';

export interface MomentMedia {
    type: MomentMediaType;
    url: string;
    snapshotUrl?: string; // For video thumbnail or image thumbnail
    height: number;
    width: number;
    duration?: number; // Only for video
}

export interface MomentComment {
    commentId: string;
    momentId: string;
    parentCommentId?: string;
    content: string;
    userInfo: UserInfo;
    parentUserInfo?: UserInfo;
    createTime: number;
}

export interface MomentReaction {
    key: string;
    userList: UserInfo[];
}

export interface Moment {
    momentId: string;
    content: string;
    mediaList: MomentMedia[];
    userInfo: UserInfo;
    commentList: MomentComment[];
    reactionList: MomentReaction[];
    createTime: number;
}

export interface GetMomentOption {
    count: number;
    timestamp: number; // 0 for initial
    direction: number; // 0 for new, 1 for old
}

export interface GetMomentCommentOption {
    momentId: string;
    count: number;
    timestamp: number;
    direction: number;
}
