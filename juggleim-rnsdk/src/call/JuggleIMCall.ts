
import { NativeModules, NativeEventEmitter } from 'react-native';
import { CallSession } from './CallSession';
import { CallMediaType } from './CallConst';
import { CallInfo } from './CallInfo';
import { Conversation } from '../types';

const { JuggleIMCallModule } = NativeModules;
const eventEmitter = new NativeEventEmitter(JuggleIMCallModule);

export interface CallReceiveListener {
    /**
     * 收到通话请求的回调
     * @param callSession 通话会话对象
     */
    onCallReceive(callSession: CallSession): void;
}

export interface ConversationCallListener {
    /**
     * 会话中通话信息更新的回调
     * @param callInfo 通话信息
     * @param conversation 所属会话
     * @param isFinished 通话是否已结束
     */
    onCallInfoUpdate(callInfo: CallInfo, conversation: Conversation, isFinished: boolean): void;
}

export default class JuggleIMCall {
    /**
     * 初始化 Zego 引擎
     * @param appId Zego App ID
     */
    static initZegoEngine(appId: number): void {
        JuggleIMCallModule.initZegoEngine(appId);
    }

    /**
     * 初始化 LiveKit 引擎
     */
    static initLiveKitEngine(): void {
        JuggleIMCallModule.initLiveKitEngine();
    }

    /**
     * 初始化 Agora 引擎
     * @param appId Agora App ID
     */
    static initAgoraEngine(appId: string): void {
        JuggleIMCallModule.initAgoraEngine(appId);
    }

    /**
     * 发起单人通话
     * @param userId 对方用户 ID
     * @param mediaType 通话媒体类型 (音频/视频)
     * @param extra 扩展信息
     * @returns Promise<CallSession> 通话会话对象
     */
    static startSingleCall(userId: string, mediaType: CallMediaType, extra?: string): Promise<CallSession> {
        return JuggleIMCallModule.startSingleCall(userId, mediaType, extra || "")
            .then((session: any) => new CallSession(session));
    }

    /**
     * 发起群组/多人通话
     * @param userIdList 参与者用户 ID 列表
     * @param mediaType 通话媒体类型 (音频/视频)
     * @param extra 扩展信息
     * @param conversation 关联的会话信息 (可选)
     * @returns Promise<CallSession> 通话会话对象
     */
    static startMultiCall(userIdList: string[], mediaType: CallMediaType, extra?: string, conversation?: Conversation): Promise<CallSession> {
        return JuggleIMCallModule.startMultiCall(userIdList, mediaType, extra || "", conversation)
            .then((session: any) => new CallSession(session));
    }

    /**
     * 加入通话
     * @param callId 通话 ID
     * @returns Promise<CallSession> 通话会话对象
     */
    static joinCall(callId: string): Promise<CallSession> {
        return JuggleIMCallModule.joinCall(callId)
            .then((session: any) => new CallSession(session));
    }

    /**
     * 获取通话会话实例
     * @param callId 通话 ID
     * @returns Promise<CallSession | null> 通话会话对象，如果不存在则返回 null
     */
    static getCallSession(callId: string): Promise<CallSession | null> {
        return JuggleIMCallModule.getCallSession(callId)
            .then((session: any) => session ? new CallSession(session) : null);
    }

    /**
     * 添加收到通话请求的监听器
     * 在全局或者应用首页添加，用于处理收到的通话请求
     * @param listener 监听器回调
     * @returns 取消监听的函数
     */
    static addReceiveListener(listener: CallReceiveListener): () => void {
        const key = `CallManager_Receive_${Date.now()}`;
        JuggleIMCallModule.addReceiveListener(key);
        const sub = eventEmitter.addListener('CallManager_onCallReceive', (event) => {
            if (event.key === key) {
                listener.onCallReceive(new CallSession(event.callSession));
            }
        });
        return () => {
            sub.remove();
            JuggleIMCallModule.removeReceiveListener(key);
        };
    }

    /**
     * 添加会话通话信息监听器
     * @param listener 监听器回调
     * @returns 取消监听的函数
     */
    static addConversationCallListener(listener: ConversationCallListener): () => void {
        const key = `CallManager_Conversation_${Date.now()}`;
        JuggleIMCallModule.addConversationCallListener(key);
        const sub = eventEmitter.addListener('CallManager_onCallInfoUpdate', (event) => {
            if (event.key === key) {
                listener.onCallInfoUpdate(event.callInfo, event.conversation, event.isFinished);
            }
        });
        return () => {
            sub.remove();
            JuggleIMCallModule.removeConversationCallListener(key);
        };
    }
}
