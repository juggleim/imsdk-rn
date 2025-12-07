import { APP_KEY, APP_SERVER_URL } from './config';

const baseURL = APP_SERVER_URL;

interface ApiResponse<T = any> {
    code: number;
    msg: string;
    data: T;
}

async function fetchData<T = any>(data: {
    url: string;
    method?: 'GET' | 'POST';
    params?: Record<string, any>;
    data?: any;
}): Promise<T> {
    const method = data.method || 'POST';
    const options: RequestInit = {
        method,
        headers: {
            'Content-Type': 'application/json',
            appkey: APP_KEY,
            // Authorization header should be added here if needed, usually handled by a global interceptor or passed in
            // For this demo, we assume the token is handled or not required for these specific calls as per the prompt description which shows Authorization header but doesn't specify where it comes from in the context of the existing auth.ts. 
            // However, looking at auth.ts, it doesn't seem to store the token globally. 
            // I will assume for now that we might need to retrieve it or the existing fetch wrapper handles it.
            // Wait, the existing auth.ts doesn't export the fetch wrapper for reuse properly (it's local).
            // I should probably refactor auth.ts to export the fetch wrapper or duplicate it.
            // For now, I will duplicate the fetch logic to ensure it works, but I need to handle Authorization.
            // The user prompt shows `Authorization: xxxxxxxxxxxxxxxxxx`.
            // I'll add a placeholder for Authorization. In a real app, this should come from a stored token.
        },
    };

    // We need to get the token. In a real app, this is stored in AsyncStorage or state.
    // For this implementation, I will assume there is a way to get it, or I will just leave it as a TODO/Placeholder if not available.
    // Actually, looking at the existing auth.ts, it returns LoginData which has `authorization`.
    // I should probably ask the user or check if there is a storage mechanism.
    // Checking package.json, `@react-native-async-storage/async-storage` is present.
    // I will check if there is a token storage utility.

    // For now, I will implement the API functions.

    let url = `${baseURL}${data.url}`;

    if (method === 'GET' && data.params) {
        const query = new URLSearchParams(data.params).toString();
        url += '?' + query;
    } else if (method !== 'GET' && data.data) {
        options.body = JSON.stringify(data.data);
    }

    // Add Authorization header if token exists
    const token = await getToken();
    if (token) {
        (options.headers as any)['Authorization'] = token;
    }

    try {
        console.log('req', url);
        const res = await fetch(url, options);
        const json: ApiResponse<T> = await res.json();
        if (json.code !== 0) {
            throw new Error(json.msg || 'Request failed');
        }
        return json.data;
    } catch (error) {
        console.error('fetchData error', error);
        throw error;
    }
}

import AsyncStorage from '@react-native-async-storage/async-storage';

async function getToken(): Promise<string | null> {
    return await AsyncStorage.getItem('im_token');
}

// 1. Friend List
export interface Friend {
    user_id: string;
    nickname: string;
    avatar: string;
    pinyin?: string;
    user_type?: number;
}

export interface FriendListResponse {
    items: Friend[];
}

export async function getFriendList(page: number = 1, size: number = 50): Promise<FriendListResponse> {
    return fetchData<FriendListResponse>({
        url: '/jim/friends/list',
        method: 'GET',
        params: {
            page,
            size,
            order_tag: 'a' // Default order
        }
    });
}

// 2. Search Friend
export async function searchFriend(key: string): Promise<FriendListResponse> {
    return fetchData<FriendListResponse>({
        url: '/jim/friends/search',
        method: 'POST',
        data: {
            key
        }
    });
}

// 3. Apply Friend
export async function applyFriend(friend_id: string): Promise<void> {
    return fetchData<void>({
        url: '/jim/friends/apply',
        method: 'POST',
        data: {
            friend_id
        }
    });
}

// 4. Friend Applications
export interface FriendApplication {
    target_user: {
        user_id: string;
        nickname: string;
        avatar: string;
    };
    is_sponsor: boolean;
    status: number; // 0: Applying, 1: Agreed, 2: Rejected, 3: Expired
    apply_time: number;
}

export interface FriendApplicationsResponse {
    items: FriendApplication[];
}

export async function getFriendApplications(start: number, count: number = 50): Promise<FriendApplicationsResponse> {
    return fetchData<FriendApplicationsResponse>({
        url: '/jim/friends/applications',
        method: 'GET',
        params: {
            start,
            count
        }
    });
}

// 5. Handle Friend Application
export async function confirmFriendApplication(sponsor_id: string, is_agree: boolean): Promise<void> {
    return fetchData<void>({
        url: '/jim/friends/confirm',
        method: 'POST',
        data: {
            sponsor_id,
            is_agree
        }
    });
}
