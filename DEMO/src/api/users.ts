import { fetchData } from './client';

export interface UndisturbRule {
    start: string;
    end: string;
}

export interface UndisturbSettings {
    switch: boolean;
    timezone: string;
    rules: UndisturbRule[];
}

export interface UserSettings {
    language: string;
    friend_verify_type: number;
    grp_verify_type: number;
    undisturb: UndisturbSettings;
}

export interface UserInfo {
    user_id: string;
    nickname: string;
    avatar: string;
    phone: string;
    status: number;
    is_friend: boolean;
    settings: UserSettings;
}

export interface UpdateUserInfoParams {
    user_id: string;
    nickname?: string;
    avatar?: string;
}

export async function getUserInfo(user_id: string): Promise<UserInfo> {
    return fetchData<UserInfo>({
        url: '/jim/users/info',
        method: 'GET',
        params: {
            user_id
        }
    });
}

export async function updateUserInfo(params: UpdateUserInfoParams): Promise<void> {
    return fetchData<void>({
        url: '/jim/users/update',
        method: 'POST',
        data: params
    });
}

export async function updateUserSettings(settings: UserSettings): Promise<void> {
    return fetchData<void>({
        url: '/jim/users/updsettings',
        method: 'POST',
        data: settings
    });
}
