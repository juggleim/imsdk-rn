import { getSystemLanguage } from './index';
import { zh, en } from './translations';
import { AsyncStorage } from '@react-native-async-storage';
import { BehaviorSubject } from 'rxjs';
import { SupportedLanguage } from './index';

// 当前语言状态
const currentLanguage$ = new BehaviorSubject<SupportedLanguage>(getSystemLanguage());

// 语言存储key
const LANGUAGE_STORAGE_KEY = '@app_current_language';

// 初始化语言
export const initLanguage = async (): Promise<void> => {
  try {
    // 先尝试从存储中获取语言设置
    const savedLanguage = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (savedLanguage && (savedLanguage === 'zh' || savedLanguage === 'en')) {
      currentLanguage$.next(savedLanguage);
      return;
    }

    // 没有保存的语言，使用系统语言
    const systemLanguage = getSystemLanguage();
    currentLanguage$.next(systemLanguage);
    await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, systemLanguage);
  } catch (error) {
    console.error('Failed to initialize language:', error);
  }
};

// 获取当前语言
export const getCurrentLanguage = (): SupportedLanguage => {
  return currentLanguage$.value;
};

// 订阅语言变化
export const subscribeToLanguage = (callback: (language: SupportedLanguage) => void) => {
  return currentLanguage$.subscribe(callback);
};

// 切换语言
export const changeLanguage = async (language: SupportedLanguage): Promise<void> => {
  try {
    currentLanguage$.next(language);
    await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  } catch (error) {
    console.error('Failed to change language:', error);
  }
};

// 根据当前语言获取翻译
export const t = (scope: string, key?: string): string => {
  const language = getCurrentLanguage();
  const translations = language === 'zh' ? zh : en;

  let lookupKey = scope;
  if (key) {
    lookupKey = `${scope}.${key}`;
  }

  const keys = lookupKey.split('.');
  let current: any = translations;
  for (const k of keys) {
    if (current && typeof current === 'object' && k in current) {
      current = current[k];
    } else {
      return lookupKey; // 如果找不到，返回 key 本身
    }
  }

  return typeof current === 'string' ? current : lookupKey;
};

// 导出当前语言以便组件使用
export { zh, en } from './translations';
