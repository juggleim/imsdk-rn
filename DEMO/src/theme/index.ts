import { Platform, StyleSheet, Dimensions } from 'react-native';

// 屏幕尺寸
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// 平台检测
const isAndroid = Platform.OS === 'android';
const isIOS = Platform.OS === 'ios';

// 基础尺寸单位（基于 iOS 设计稿，Android 进行适配）
const BASE_WIDTH = 375; // iPhone 设计基准
const scale = isAndroid ? SCREEN_WIDTH / BASE_WIDTH : 1;

// 尺寸适配函数
const moderateScale = (size: number): number => {
  return isAndroid ? size * scale : size;
};

// 颜色配置
export const Colors = {
  primary: '#007AFF',
  background: '#FFFFFF',
  border: '#F0F0F0',
  borderLight: 'rgba(0, 0, 0, 0.05)',
  inputBackground: '#F2F2F2',
  text: {
    primary: '#333333',
    secondary: '#666666',
    tertiary: '#999999',
    white: '#FFFFFF',
  },
  badge: '#FF3B30',
  mention: '#FF3B30',
  overlay: 'rgba(0, 0, 0, 0.5)',
  accent: '#FA9D3B',
  warning: '#FF9500',
};

// 字体配置
export const Typography = {
  // 标题字体
  largeTitle: {
    fontSize: moderateScale(28),
    fontWeight: '600' as const,
    color: Colors.text.primary,
  },
  title: {
    fontSize: moderateScale(20),
    fontWeight: '600' as const,
    color: Colors.text.primary,
  },
  // 会话列表相关
  conversationName: {
    fontSize: moderateScale(16),
    fontWeight: '600' as const,
    color: Colors.text.primary,
    // Android 需要 lineHeight 来确保垂直居中
    lineHeight: moderateScale(22),
  },
  conversationTime: {
    fontSize: moderateScale(12),
    color: Colors.text.tertiary,
    lineHeight: moderateScale(16),
  },
  conversationMessage: {
    fontSize: moderateScale(14),
    color: Colors.text.secondary,
    lineHeight: moderateScale(20),
  },
  badge: {
    fontSize: moderateScale(12),
    fontWeight: 'bold' as const,
    color: Colors.text.white,
  },
  // 按钮字体
  button: {
    fontSize: moderateScale(16),
    fontWeight: '600' as const,
    color: Colors.text.white,
  },
  // 输入框字体
  input: {
    fontSize: moderateScale(16),
    color: Colors.text.primary,
    lineHeight: moderateScale(22),
  },
};

// 间距配置
export const Spacing = {
  xs: moderateScale(4),
  sm: moderateScale(8),
  md: moderateScale(12),
  lg: moderateScale(16),
  xl: moderateScale(20),
  xxl: moderateScale(24),
};

// 尺寸配置
export const Sizes = {
  avatar: {
    small: moderateScale(32),
    medium: moderateScale(50),
    large: moderateScale(64),
  },
  icon: {
    small: moderateScale(16),
    medium: moderateScale(24),
    large: moderateScale(32),
  },
  badge: {
    width: moderateScale(20),
    height: moderateScale(20),
    borderRadius: moderateScale(10),
  },
  image: {
    preview: {
      width: moderateScale(300),
      height: moderateScale(600),
    },
  },
};

// 阴影配置（iOS 使用 shadow，Android 使用 elevation）
export const Shadows = {
  sm: isAndroid
    ? { elevation: 2 }
    : {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
      },
  md: isAndroid
    ? { elevation: 4 }
    : {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
  lg: isAndroid
    ? { elevation: 8 }
    : {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
      },
};

// 通用样式
export const CommonStyles = StyleSheet.create({
  // 文本相关
  textWithEllipsis: {
    overflow: 'hidden' as const,
    // Android 需要 numberOfLines
  },
  singleLine: {
    numberOfLines: 1,
  },
  twoLines: {
    numberOfLines: 2,
  },
  // 容器相关
  flexContainer: {
    flex: 1,
    minWidth: 0,
  },
  row: {
    flexDirection: 'row',
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  spaceBetween: {
    justifyContent: 'space-between',
  },
  // 按钮相关
  button: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: moderateScale(8),
    backgroundColor: Colors.primary,
    ...Shadows.sm,
  },
});

// 导出工具函数
export const ThemeUtils = {
  isAndroid,
  isIOS,
  SCREEN_WIDTH,
  SCREEN_HEIGHT,
  moderateScale,
};
