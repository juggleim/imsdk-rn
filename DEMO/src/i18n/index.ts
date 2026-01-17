import { getLocales } from 'react-native-localize';
import { Platform } from 'react-native';

// 支持的语言类型
export type SupportedLanguage = 'zh' | 'en';

// 可用语言列表
export const AVAILABLE_LANGUAGES = [
  {
    code: 'zh',
    name: '中文',
    nativeName: '简体中文',
  },
  {
    code: 'en',
    name: 'English',
    nativeName: 'English',
  },
];

// 获取系统语言
export const getSystemLanguage = (): SupportedLanguage => {
  const locales = getLocales();
  const systemLanguage = locales[0]?.languageCode || 'en';

  // 检查是否支持系统语言
  const supportedCodes = AVAILABLE_LANGUAGES.map(lang => lang.code);
  if (supportedCodes.includes(systemLanguage as SupportedLanguage)) {
    return systemLanguage as SupportedLanguage;
  }

  // 默认返回中文
  return 'zh';
};

// 语言显示名称映射
export const LANGUAGE_NAMES: Record<SupportedLanguage, string> = {
  zh: '简体中文',
  en: 'English',
};
