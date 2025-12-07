import { fetchData } from './client';

export interface UserSettings {
    language: string;
    friend_verify_type: number;
    grp_verify_type: number;
    undisturb: string;
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

export async function getUserInfo(user_id: string): Promise<UserInfo> {
    return fetchData<UserInfo>({
        url: '/jim/users/info',
        method: 'GET',
        params: {
            user_id
        }
    });
}
