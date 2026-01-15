import React from 'react';
import { StyleSheet, ViewStyle } from 'react-native';
import { Message } from 'juggleim-rnsdk';
import { MessageRendererProps, MessageRenderMode, IMessageRenderer } from './types';

/**
 * 消息渲染器抽象基类
 * 提供通用实现，子类只需实现具体逻辑
 */
export abstract class BaseMessageRenderer implements IMessageRenderer {
  abstract readonly contentType: string;
  readonly renderMode: MessageRenderMode = MessageRenderMode.BUBBLE;
  readonly priority: number = 100;
  readonly showAvatar: boolean = true;
  readonly showTimestamp: boolean = true;

  /**
   * 子类实现：渲染消息内容
   */
  abstract renderContent: React.FC<MessageRendererProps>;

  /**
   * 默认渲染方法（包装内容）
   */
  render: React.FC<MessageRendererProps> = (props) => {
    return <>{this.renderContent(props)}</>;
  };

  /**
   * 默认气泡样式（可被覆盖）
   */
  getBubbleStyle?(context: MessageRenderContext): ViewStyle {
    return {};
  }

  /**
   * 默认容器样式（可被覆盖）
   */
  getContainerStyle?(context: MessageRenderContext): ViewStyle {
    return {};
  }

  /**
   * 默认高度估算
   */
  estimateHeight?(message: Message): number {
    return 70;
  }

  /**
   * 默认支持检查
   */
  canRender?(message: Message): boolean {
    return message.content.contentType === this.contentType;
  }
}
