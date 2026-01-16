import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { Message } from 'juggleim-rnsdk';
import { BaseMessageRenderer } from '../BaseMessageRenderer';
import { MessageRendererProps, MessageRenderMode } from '../types';

/**
 * 系统消息渲染器（优化视觉效果）
 *
 * 用于：群通知、好友通知等
 * 带有圆角背景
 */
export class SystemMessageRenderer extends BaseMessageRenderer {
  readonly contentType = 'jgd:grpntf'; // 可以模糊匹配所有 jgd:* 消息
  readonly renderMode = MessageRenderMode.SYSTEM;
  readonly priority = 100;
  readonly showAvatar = false;
  readonly showTimestamp = false;

  renderContent: React.FC<MessageRendererProps> = ({ context }) => {
    const { message } = context;

    // 根据不同消息类型显示不同文本
    const getSystemText = (msg: Message): string => {
      const type = msg.content.contentType;
      if (type === 'jgd:grpntf') {
        return '[群通知]';
      }
      if (type === 'jgd:friendntf') {
        return '好友通知';
      }
      return '[系统消息]';
    };

    const text = getSystemText(message);

    return (
      <View style={styles.systemMessageContainer}>
        <View style={styles.systemMessageContent}>
          <Text style={styles.systemMessageText}>{text}</Text>
        </View>
      </View>
    );
  };

  /**
   * 支持所有 jgd: 开头的系统消息
   */
  canRender(message: Message): boolean {
    const r = message.content.contentType?.startsWith('jgd:') || false;
    if (! r) {
      console.log('SystemMessageRenderer canRender:', r, message);
    }
    return r;
  }

  estimateHeight(message: Message): number {
    return 32;
  }
}

const styles = StyleSheet.create({
  systemMessageContainer: {
    alignSelf: 'center',
    marginVertical: 8,
  },
  systemMessageContent: {
    backgroundColor: 'rgba(0,0,0,0.05)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
  },
  systemMessageText: {
    fontSize: Platform.OS === 'android' ? 11 : 12,
    color: '#666',
    textAlign: 'center',
    lineHeight: Platform.OS === 'android' ? 16 : 18,
  },
});
