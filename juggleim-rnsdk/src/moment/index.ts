
import { NativeModules, Platform } from 'react-native';
import { Moment, MomentComment, MomentReaction, GetMomentOption, GetMomentCommentOption } from './types';
import { SimpleCallback, UserInfo } from '../types';

const { JuggleIMMomentModule } = NativeModules;

export class JuggleIMMoment {
    /**
     * 发布朋友圈
     */
    static addMoment(content: string, mediaList: any[]): Promise<Moment> {
        return JuggleIMMomentModule.addMoment(content, mediaList);
    }

    /**
     * 删除朋友圈
     */
    static removeMoment(momentId: string): Promise<void> {
        return JuggleIMMomentModule.removeMoment(momentId);
    }

    /**
     * 获取缓存的朋友圈列表
     */
    static getCachedMomentList(option: GetMomentOption): Promise<Moment[]> {
        return JuggleIMMomentModule.getCachedMomentList(option);
    }

    /**
     * 获取朋友圈列表
     */
    static getMomentList(option: GetMomentOption): Promise<{ list: Moment[], isFinished: boolean }> {
        return JuggleIMMomentModule.getMomentList(option);
    }

    /**
     * 获取朋友圈详情
     */
    static getMoment(momentId: string): Promise<Moment> {
        return JuggleIMMomentModule.getMoment(momentId);
    }

    /**
     * 发布评论
     */
    static addComment(momentId: string, parentCommentId: string, content: string): Promise<MomentComment> {
        return JuggleIMMomentModule.addComment(momentId, parentCommentId, content);
    }

    /**
     * 删除评论
     */
    static removeComment(momentId: string, commentId: string): Promise<void> {
        return JuggleIMMomentModule.removeComment(momentId, commentId);
    }

    /**
     * 获取评论列表
     */
    static getCommentList(option: GetMomentCommentOption): Promise<{ list: MomentComment[], isFinished: boolean }> {
        return JuggleIMMomentModule.getCommentList(option);
    }

    /**
     * 添加点赞
     */
    static addReaction(momentId: string, key: string): Promise<void> {
        return JuggleIMMomentModule.addReaction(momentId, key);
    }

    /**
     * 取消点赞
     */
    static removeReaction(momentId: string, key: string): Promise<void> {
        return JuggleIMMomentModule.removeReaction(momentId, key);
    }

    /**
     * 获取点赞列表
     */
    static getReactionList(momentId: string): Promise<MomentReaction[]> {
        return JuggleIMMomentModule.getReactionList(momentId);
    }
}
