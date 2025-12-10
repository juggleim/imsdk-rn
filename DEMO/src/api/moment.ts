import { fetchData } from './client';

// Types & Interfaces
export interface MomentMedia {
    type: 'image' | 'video';
    url: string;
    snapshot_url: string;
    height: number;
    width: number;
    duration?: number; // for videos
}

export interface MomentContent {
    text: string;
    medias: MomentMedia[];
}

export interface UserInfo {
    user_id: string;
    nickname: string;
    avatar: string;
    user_type?: number;
}

export interface Reaction {
    value: string;
    timestamp: number;
    user_info: UserInfo;
}

export interface Comment {
    comment_id: string;
    moment_id: string;
    parent_comment_id?: string;
    content: {
        text: string;
    };
    parent_user_info?: UserInfo;
    user_info: UserInfo;
    comment_time: number;
}

export interface MomentItem {
    moment_id: string;
    content: MomentContent;
    user_info: UserInfo;
    reactions: Reaction[];
    top_comments: Comment[];
    moment_time: number;
}

export interface MomentListResponse {
    items: MomentItem[];
    is_finished: boolean;
}

export interface AddCommentResponse {
    comment_id: string;
    comment_time: number;
    user_info: UserInfo;
}

// API Functions

/**
 * Get moment list
 * @param limit - Number of moments to fetch
 * @param start - Timestamp to start from
 */
export async function getMomentList(
    limit: number = 20,
    start: number = Date.now()
): Promise<MomentListResponse> {
    return fetchData<MomentListResponse>({
        url: '/momentgateway/moments/list',
        method: 'GET',
        params: {
            limit: limit.toString(),
            start: start.toString(),
        },
    });
}

/**
 * Delete moments
 * @param momentIds - Array of moment IDs to delete
 */
export async function deleteMoment(momentIds: string[]): Promise<void> {
    return fetchData<void>({
        url: '/momentgateway/moments/del',
        method: 'POST',
        data: {
            moment_ids: momentIds,
        },
    });
}

/**
 * Add a comment to a moment
 * @param momentId - Moment ID
 * @param content - Comment text content
 * @param parentCommentId - Optional parent comment ID for replies
 */
export async function addComment(
    momentId: string,
    content: string,
    parentCommentId?: string
): Promise<AddCommentResponse> {
    return fetchData<AddCommentResponse>({
        url: '/momentgateway/moments/comments/add',
        method: 'POST',
        data: {
            moment_id: momentId,
            parent_comment_id: parentCommentId,
            content: {
                text: content,
            },
        },
    });
}

/**
 * Delete comments
 * @param momentId - Moment ID
 * @param commentIds - Array of comment IDs to delete
 */
export async function deleteComment(
    momentId: string,
    commentIds: string[]
): Promise<void> {
    return fetchData<void>({
        url: '/momentgateway/moments/comments/del',
        method: 'POST',
        data: {
            moment_id: momentId,
            comment_ids: commentIds,
        },
    });
}

/**
 * Add a reaction (like) to a moment
 * @param momentId - Moment ID
 * @param reaction - Reaction object with key and value
 */
export async function addReaction(
    momentId: string,
    reaction: { key: string; value: string }
): Promise<void> {
    return fetchData<void>({
        url: '/momentgateway/moments/reactions/add',
        method: 'POST',
        data: {
            moment_id: momentId,
            reaction,
        },
    });
}

/**
 * Delete a reaction (unlike) from a moment
 * @param momentId - Moment ID
 * @param reactionKey - Reaction key to delete
 */
export async function deleteReaction(
    momentId: string,
    reactionKey: string
): Promise<void> {
    return fetchData<void>({
        url: '/momentgateway/moments/reactions/del',
        method: 'POST',
        data: {
            moment_id: momentId,
            reaction: {
                key: reactionKey,
            },
        },
    });
}
