
import { NativeModules, NativeEventEmitter } from 'react-native';
import { CallSession } from './CallSession';
import { CallMediaType } from './CallConst';
import { CallInfo } from './CallInfo';
import { Conversation } from '../types';

const { JuggleIMCallModule } = NativeModules;
const eventEmitter = new NativeEventEmitter(JuggleIMCallModule);

export interface CallReceiveListener {
    onCallReceive(callSession: CallSession): void;
}

export interface ConversationCallListener {
    onCallInfoUpdate(callInfo: CallInfo, conversation: Conversation, isFinished: boolean): void;
}

export default class JuggleIMCall {
    static initZegoEngine(appId: number): void {
        JuggleIMCallModule.initZegoEngine(appId);
    }

    static initLiveKitEngine(): void {
        JuggleIMCallModule.initLiveKitEngine();
    }

    static initAgoraEngine(appId: string): void {
        JuggleIMCallModule.initAgoraEngine(appId);
    }

    static startSingleCall(userId: string, mediaType: CallMediaType, extra?: string): Promise<CallSession> {
        return JuggleIMCallModule.startSingleCall(userId, mediaType, extra || "")
            .then((session: any) => new CallSession(session));
    }

    static startMultiCall(userIdList: string[], mediaType: CallMediaType, extra?: string, conversation?: Conversation): Promise<CallSession> {
        return JuggleIMCallModule.startMultiCall(userIdList, mediaType, extra || "", conversation)
            .then((session: any) => new CallSession(session));
    }

    static joinCall(callId: string): Promise<CallSession> {
        return JuggleIMCallModule.joinCall(callId)
            .then((session: any) => new CallSession(session));
    }

    static getCallSession(callId: string): Promise<CallSession | null> {
        return JuggleIMCallModule.getCallSession(callId)
            .then((session: any) => session ? new CallSession(session) : null);
    }

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
