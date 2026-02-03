import React from 'react';
import { Text, StyleSheet, View, ActivityIndicator } from 'react-native';
import { Message, StreamTextMessageContent } from 'juggleim-rnsdk';
import { BaseMessageRenderer } from '../BaseMessageRenderer';
import { MessageRendererProps, MessageRenderMode } from '../types';

/**
 * 流式文本消息渲染器
 * 用于显示AI助手的流式回复
 */
export class StreamTextMessageRenderer extends BaseMessageRenderer {
  readonly contentType = 'jg:streamtext';
  readonly renderMode = MessageRenderMode.BUBBLE;
  readonly priority = 10;

  renderContent: React.FC<MessageRendererProps> = ({ context }) => {
    const { message, isOutgoing } = context;
    const streamContent = message.content as StreamTextMessageContent;

    return (
      <View style={styles.container}>
        {/* 流式文本内容 */}
        <Text
          style={[styles.text, isOutgoing ? styles.outgoingText : styles.incomingText]}
          selectable={true}>
          {streamContent.content || ''}
        </Text>

        {/* 如果消息未完成，显示加载指示器 */}
        {!streamContent.isFinished && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={isOutgoing ? '#000' : '#95EC69'} />
            <Text style={styles.loadingText}>AI正在输入...</Text>
          </View>
        )}
        
        {/* 时间戳 */}
        {streamContent.isFinished && (
          <View style={styles.footerContainer}>
            <Text
              style={[
                styles.timestamp,
                isOutgoing ? styles.outgoingTimestamp : styles.incomingTimestamp,
              ]}>
              {new Date(message.timestamp).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
              })}
            </Text>
          </View>
        )}
      </View>
    );
  };

  estimateHeight(message: Message): number {
    return 80; // Dynamic, but base 80 for stream messages
  }
}

const styles = StyleSheet.create({
  container: {
    minWidth: 40,
  },
  text: {
    fontSize: 16,
    lineHeight: 24,
    color: '#000',
    marginBottom: 4,
  },
  outgoingText: {
    color: '#000',
  },
  incomingText: {
    color: '#000',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  loadingText: {
    fontSize: 12,
    color: 'rgba(0,0,0,0.4)',
    marginLeft: 8,
  },
  footerContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: -4,
  },
  timestamp: {
    fontSize: 11,
    marginTop: 2,
  },
  outgoingTimestamp: {
    color: 'rgba(0,0,0,0.4)',
  },
  incomingTimestamp: {
    color: 'rgba(0,0,0,0.3)',
  },
});
