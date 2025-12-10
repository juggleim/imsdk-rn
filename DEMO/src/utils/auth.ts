import AsyncStorage from '@react-native-async-storage/async-storage';

export const TOKEN_KEY = 'im_token';
export const USER_ID_KEY = 'user_id';
export const USER_ACCOUNT_KEY = 'user_account';
export const USER_NAME_KEY = 'user_name';
export const USER_AVATAR_KEY = 'user_avatar';

export const saveToken = async (token: string, account: string) => {
  try {
    await AsyncStorage.setItem(TOKEN_KEY, token);
    await AsyncStorage.setItem(USER_ACCOUNT_KEY, account);
  } catch (e) {
    console.error('Failed to save token', e);
  }
};

export const saveUserInfo = async (userName: string, userAvatar: string, userId: string) => {
  try {
    await AsyncStorage.setItem(USER_NAME_KEY, userName);
    await AsyncStorage.setItem(USER_AVATAR_KEY, userAvatar);
    await AsyncStorage.setItem(USER_ID_KEY, userId);
  } catch (e) {
    console.error('Failed to save user info', e);
  }
};

export const getToken = async () => {
  try {
    const token = await AsyncStorage.getItem(TOKEN_KEY);
    const account = await AsyncStorage.getItem(USER_ACCOUNT_KEY);
    if (token && account) {
      return { token, account };
    }
    return null;
  } catch (e) {
    console.error('Failed to get token', e);
    return null;
  }
};

export const clearToken = async () => {
  try {
    await AsyncStorage.removeItem(TOKEN_KEY);
    await AsyncStorage.removeItem(USER_ID_KEY);
  } catch (e) {
    console.error('Failed to clear token', e);
  }
};
