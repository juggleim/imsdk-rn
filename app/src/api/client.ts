import { APP_KEY, APP_SERVER_URL } from './config';
import AsyncStorage from '@react-native-async-storage/async-storage';

const baseURL = APP_SERVER_URL;

export interface ApiResponse<T = any> {
    code: number;
    msg: string;
    data: T;
}

export async function getToken(): Promise<string | null> {
    return await AsyncStorage.getItem('im_token');
}

export async function fetchData<T = any>(data: {
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
        },
    };

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
        console.log('req', url, options);
        const res = await fetch(url, options);
        const json: ApiResponse<T> = await res.json();
        console.log('res', json);
        if (json.code !== 0) {
            throw new Error(json.msg || 'Request failed');
        }
        return json.data;
    } catch (error) {
        console.error('fetchData error', error);
        throw error;
    }
}
