
import { NativeModules, NativeEventEmitter, findNodeHandle, Component } from 'react-native';
import { CallStatus, CallMediaType, CallFinishReason, CallErrorCode } from './CallConst';
import { CallMember } from './CallMember';

const { JuggleIMCallModule } = NativeModules;
const eventEmitter = new NativeEventEmitter(JuggleIMCallModule);

export interface CallVideoDenoiseParams {
    // Add properties as needed
}

export interface CallSessionListener {
    onCallConnect?(): void;
    onCallFinish?(finishReason: CallFinishReason): void;
    onErrorOccur?(errorCode: CallErrorCode): void;
    onUsersInvite?(inviterId: string, userIdList: string[]): void;
    onUsersConnect?(userIdList: string[]): void;
    onUsersLeave?(userIdList: string[]): void;
    onUserCameraEnable?(userId: string, enable: boolean): void;
    onUserMicrophoneEnable?(userId: string, enable: boolean): void;
    onSoundLevelUpdate?(soundLevels: { [userId: string]: number }): void;
    onVideoFirstFrameRender?(userId: string): void;
}

export class CallSession {
    callId: string;
    isMultiCall: boolean;
    mediaType: CallMediaType;
    callStatus: CallStatus;
    startTime: number;
    connectTime: number;
    finishTime: number;
    owner: string;
    inviter: string;
    finishReason: CallFinishReason;
    members: CallMember[];
    currentMember: CallMember;
    extra: string;

    constructor(props: any) {
        this.callId = props.callId;
        this.isMultiCall = props.isMultiCall;
        this.mediaType = props.mediaType;
        this.callStatus = props.callStatus;
        this.startTime = props.startTime;
        this.connectTime = props.connectTime;
        this.finishTime = props.finishTime;
        this.owner = props.owner;
        this.inviter = props.inviter;
        this.finishReason = props.finishReason;
        this.members = props.members;
        this.currentMember = props.currentMember;
        this.extra = props.extra;
    }

    addListener(listener: CallSessionListener): () => void {
        const key = `CallSession_${this.callId}_${Date.now()}`;
        JuggleIMCallModule.addSessionListener(this.callId, key);

        // Using a simpler event listening approach might be needed if multiple listeners are attached.
        // Ideally we filter events by callId
        const subscriptions = [
            eventEmitter.addListener('CallSession_onCallConnect', (event) => {
                if (event.callId === this.callId && listener.onCallConnect) listener.onCallConnect();
            }),
            eventEmitter.addListener('CallSession_onCallFinish', (event) => {
                if (event.callId === this.callId && listener.onCallFinish) listener.onCallFinish(event.finishReason);
            }),
            eventEmitter.addListener('CallSession_onErrorOccur', (event) => {
                if (event.callId === this.callId && listener.onErrorOccur) listener.onErrorOccur(event.errorCode);
            }),
            eventEmitter.addListener('CallSession_onUsersInvite', (event) => {
                if (event.callId === this.callId && listener.onUsersInvite) listener.onUsersInvite(event.inviterId, event.userIdList);
            }),
            eventEmitter.addListener('CallSession_onUsersConnect', (event) => {
                if (event.callId === this.callId && listener.onUsersConnect) listener.onUsersConnect(event.userIdList);
            }),
            eventEmitter.addListener('CallSession_onUsersLeave', (event) => {
                if (event.callId === this.callId && listener.onUsersLeave) listener.onUsersLeave(event.userIdList);
            }),
            eventEmitter.addListener('CallSession_onUserCameraEnable', (event) => {
                if (event.callId === this.callId && listener.onUserCameraEnable) listener.onUserCameraEnable(event.userId, event.enable);
            }),
            eventEmitter.addListener('CallSession_onUserMicrophoneEnable', (event) => {
                if (event.callId === this.callId && listener.onUserMicrophoneEnable) listener.onUserMicrophoneEnable(event.userId, event.enable);
            }),
            eventEmitter.addListener('CallSession_onSoundLevelUpdate', (event) => {
                if (event.callId === this.callId && listener.onSoundLevelUpdate) listener.onSoundLevelUpdate(event.soundLevels);
            }),
            eventEmitter.addListener('CallSession_onVideoFirstFrameRender', (event) => {
                if (event.callId === this.callId && listener.onVideoFirstFrameRender) listener.onVideoFirstFrameRender(event.userId);
            }),
        ];

        return () => {
            subscriptions.forEach(sub => sub.remove());
            JuggleIMCallModule.removeSessionListener(this.callId, key);
        };
    }

    accept() {
        JuggleIMCallModule.accept(this.callId);
    }

    hangup() {
        JuggleIMCallModule.hangup(this.callId);
    }

    enableCamera(enable: boolean) {
        JuggleIMCallModule.enableCamera(this.callId, enable);
    }

    muteMicrophone(mute: boolean) {
        JuggleIMCallModule.muteMicrophone(this.callId, mute);
    }

    muteSpeaker(mute: boolean) {
        JuggleIMCallModule.muteSpeaker(this.callId, mute);
    }

    setSpeakerEnable(enable: boolean) {
        JuggleIMCallModule.setSpeakerEnable(this.callId, enable);
    }

    useFrontCamera(enable: boolean) {
        JuggleIMCallModule.useFrontCamera(this.callId, enable);
    }

    inviteUsers(userIdList: string[]) {
        JuggleIMCallModule.inviteUsers(this.callId, userIdList);
    }

    enableAEC(enable: boolean) {
        JuggleIMCallModule.enableAEC(this.callId, enable);
    }

    setVideoDenoiseParams(params: CallVideoDenoiseParams) {
        JuggleIMCallModule.setVideoDenoiseParams(this.callId, params);
    }

    setVideoView(userId: string, view: Component | null) {
        const viewId = findNodeHandle(view);
        JuggleIMCallModule.setVideoView(this.callId, userId, viewId);
    }

    startPreview(view: Component | null) {
        const viewId = findNodeHandle(view);
        JuggleIMCallModule.startPreview(this.callId, viewId);
    }
}
