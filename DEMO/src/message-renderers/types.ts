import { Message } from 'juggleim-rnsdk';
import { ViewStyle, TextStyle } from 'react-native';

/**
 * 消息渲染模式
 */
export enum MessageRenderMode {
  /** 标准气泡模式 */
  BUBBLE = 'bubble',
  /** 系统消息模式（居中灰条） */
  SYSTEM = 'system',
  /** 全宽模式（无气泡背景） */
  FULL_WIDTH = 'full_width',
  /** 自定义模式（完全自定义渲染） */
  CUSTOM = 'custom',
}

/**
 * 消息渲染上下文
 */
export interface MessageRenderContext {
  /** 消息对象 */
  message: Message;
  /** 是否为发送方消息 */
  isOutgoing: boolean;
  /** 当前用户ID */
  currentUserId?: string;
  /** 消息发送状态（用于上传进度等） */
  messageStatus?: MessageStatus;
  /** 长按回调 */
  onLongPress?: (anchor: MessageAnchor) => void;
  /** 自定义数据 */
  extra?: Record<string, any>;
}

/**
 * 消息状态
 */
export interface MessageStatus {
  progress: number;
  error: boolean;
}

/**
 * 消息锚点位置（用于菜单定位）
 */
export interface MessageAnchor {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * 消息渲染器Props
 */
export interface MessageRendererProps {
  context: MessageRenderContext;
}

/**
 * 消息渲染器接口
 */
export interface IMessageRenderer {
  /**
   * 消息类型标识（如 'jg:text', 'demo:textcard'）
   */
  readonly contentType: string;

  /**
   * 渲染模式
   */
  readonly renderMode: MessageRenderMode;

  /**
   * 渲染优先级（数值越小优先级越高，默认100）
   */
  readonly priority?: number;

  /**
   * 是否支持此消息（可用于动态判断）
   */
  canRender?(message: Message): boolean;

  /**
   * 渲染消息内容
   */
  render: React.FC<MessageRendererProps>;

  /**
   * 获取气泡样式（可选，覆盖默认样式）
   */
  getBubbleStyle?: (context: MessageRenderContext) => ViewStyle;

  /**
   * 获取容器样式（可选）
   */
  getContainerStyle?: (context: MessageRenderContext) => ViewStyle;

  /**
   * 预估内容高度（用于性能优化）
   */
  estimateHeight?: (message: Message) => number;

  /**
   * 是否显示头像（默认true）
   */
  showAvatar?: boolean;

  /**
   * 是否显示时间��（默认true）
   */
  showTimestamp?: boolean;
}

/**
 * 渲染器注册配置
 */
export interface RendererRegistration {
  renderer: IMessageRenderer;
  /** 是否覆盖已存在的渲染器 */
  override?: boolean;
}

/**
 * 渲染器查找结果
 */
export interface RendererLookupResult {
  renderer: IMessageRenderer | null;
  contentType: string;
  isExactMatch: boolean;
}
