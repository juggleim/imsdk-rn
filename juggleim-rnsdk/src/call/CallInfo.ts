
import { UserInfo } from '../index';
import { CallMediaType } from './CallConst';
import { CallMember } from './CallMember';

export interface CallInfo {
    callId: string;
    isMultiCall: boolean;
    mediaType: CallMediaType;
    owner: UserInfo;
    members: CallMember[];
    extra: string;
}
