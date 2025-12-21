
import { UserInfo } from '../index';
import { CallStatus } from './CallConst';

export interface CallMember {
    userInfo: UserInfo;
    callStatus: CallStatus;
    startTime: number;
    connectTime: number;
    finishTime: number;
    inviter: UserInfo;
}
