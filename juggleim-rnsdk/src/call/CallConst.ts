
export enum CallStatus {
    IDLE = 0,
    INCOMING = 1,
    OUTGOING = 2,
    CONNECTING = 3,
    CONNECTED = 4,
    JOIN = 5,
}

export enum CallMediaType {
    VOICE = 0,
    VIDEO = 1,
}

export enum CallFinishReason {
    UNKNOWN = 0,
    HANGUP = 1,
    DECLINE = 2,
    BUSY = 3,
    NO_RESPONSE = 4,
    CANCEL = 5,
    OTHER_SIDE_HANGUP = 6,
    OTHER_SIDE_DECLINE = 7,
    OTHER_SIDE_BUSY = 8,
    OTHER_SIDE_NO_RESPONSE = 9,
    OTHER_SIDE_CANCEL = 10,
    ROOM_DESTROY = 11,
    NETWORK_ERROR = 12,
    ACCEPT_ON_OTHER_CLIENT = 13,
    HANGUP_ON_OTHER_CLIENT = 14,
}

export enum CallErrorCode {
    SUCCESS = 0,
    CALL_EXIST = 1,
    CANT_ACCEPT_WHILE_NOT_INVITED = 2,
    ACCEPT_FAIL = 3,
    JOIN_MEDIA_ROOM_FAIL = 4,
    INVALID_PARAMETER = 5,
    INVITE_FAIL = 6,
    JOIN_ROOM_FAIL = 7,
}
