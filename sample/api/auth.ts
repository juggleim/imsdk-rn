import { APPKEY, APP_SERVER_URL } from './config';
import * as RNFS from 'react-native-fs';

const TOKEN_FILE_PATH = `${RNFS.DocumentDirectoryPath}/auth_token.json`;

export interface LoginRequest {
    account: string;
    password: string;
}

interface ApiResponse<T = any> {
    code: number;
    msg: string;
    data: T;
}

export interface LoginData {
    authorization: string;
    avatar: string;
    im_token: string;
    nickname: string;
    status: number;
    user_id: string;
}

const baseURL = APP_SERVER_URL;

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
            'appkey': APPKEY
        }
    };

    let url = `${baseURL}${data.url}`;

    if (method === 'GET' && data.params) {
        const query = new URLSearchParams(data.params).toString();
        url += '?' + query;
    } else if (method !== 'GET' && data.data) {
        options.body = JSON.stringify(data.data);
    }

    try {
        console.log('req', url, options);
        const res = await fetch(url, options);
        const json: ApiResponse<T> = await res.json();
        console.log('xxx', json)
        if (json.code !== 0) {
            throw new Error(json.msg || '接口返回错误');
        }

        return json.data;
    } catch (error) {
        console.error('fetchDataOnly error', error);
        throw error;
    }
}

function buildOptions(data: any, url: string, method?: 'GET' | 'POST') {
    const options: any = {
        method: method || 'POST',
        url,
    };
    if (options.method === 'GET') {
        options.params = data;
    } else {
        options.data = data;
    }
    return options;
}

export async function login(account: string, password: string): Promise<LoginData> {
    const data: LoginRequest = {
        account: account,
        password: password
    }
    const options = buildOptions(data, '/jim/login', 'POST');
    return fetchData<LoginData>(options);
}

export async function saveToken(data: LoginData): Promise<void> {
    try {
        await RNFS.writeFile(TOKEN_FILE_PATH, JSON.stringify(data), 'utf8');
    } catch (error) {
        console.error('Failed to save token', error);
    }
}

export async function getToken(): Promise<LoginData | null> {
    try {
        const exists = await RNFS.exists(TOKEN_FILE_PATH);
        if (!exists) return null;

        const content = await RNFS.readFile(TOKEN_FILE_PATH, 'utf8');
        return JSON.parse(content);
    } catch (error) {
        console.error('Failed to read token', error);
        return null;
    }
}