import React from 'react';
import { Text, StyleSheet, View, Image, Platform } from 'react-native';
import { Message, TextMessageContent } from 'juggleim-rnsdk';
import { BaseMessageRenderer } from '../BaseMessageRenderer';
import { MessageRendererProps, MessageRenderMode } from '../types';

/**
 * 文本消息渲染器
 */
export class TextMessageRenderer extends BaseMessageRenderer {
  readonly contentType = 'jg:text';
  readonly renderMode = MessageRenderMode.BUBBLE;
  readonly priority = 10;

  renderContent: React.FC<MessageRendererProps> = ({ context }) => {
    const { message, isOutgoing } = context;
    const textContent = message.content as TextMessageContent;

    return (
      <View style={styles.container}>
        {/* 引用消息 */}
        {message.referredMessage && this.renderQuotedMessage(message.referredMessage, isOutgoing)}

        {/* 文本内容 */}
        <Text
          style={[styles.text, isOutgoing ? styles.outgoingText : styles.incomingText]}
          selectable={true}>
          {textContent.content}
        </Text>
        
        {/* 时间戳 - 放在右下角，但不占用文本流的空间(如果可能)，或者作为流的一部分 */}
        {/* 微信风格通常是文本在左，时间在文本结尾的右下方。如果文本很短，时间在同一行；如果文本长，时间在下一行右侧 */}
        <View style={styles.footerContainer}>
             <Text
              style={[
                styles.timestamp,
                isOutgoing ? styles.outgoingTimestamp : styles.incomingTimestamp,
              ]}>
              {message.isEdit ? '已编辑 ' : ''}
              {new Date(message.timestamp).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
              })}
            </Text>
        </View>
      </View>
    );
  };

  private renderQuotedMessage(quotedMsg: Message, isOutgoing: boolean) {
    const getPreview = (msg: Message): string => {
      const type = msg.content.contentType;
      if (type === 'jg:text') return (msg.content as TextMessageContent).content;
      if (type === 'jg:img') return '[图片]';
      if (type === 'jg:file') return '[文件]';
      if (type === 'jg:voice') return '[语音]';
      if (type === 'jg:video') return '[视频]';
      return '[消息]';
    };

    return (
      <View style={styles.quotedContainer}>
          <View style={styles.quotedLine} />
          <View style={styles.quotedContent}>
            <Text
              style={styles.quotedSender}
              numberOfLines={1}>
              {quotedMsg.senderUserName || quotedMsg.senderUserId}:
            </Text>
            <Text
              style={styles.quotedPreview}
              numberOfLines={2}>
              {getPreview(quotedMsg)}
            </Text>
          </View>
      </View>
    );
  }

  estimateHeight(message: Message): number {
    return 60; // Dynamic, but base 60
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
    marginBottom: 4, // Space for timestamp
  },
  outgoingText: {
    color: '#000', // WeChat black on green
  },
  incomingText: {
    color: '#000', // WeChat black on white
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
  quotedContainer: {
    marginBottom: 8,
    flexDirection: 'row',
  },
  quotedLine: {
      width: 2,
      backgroundColor: 'rgba(0,0,0,0.2)',
      marginRight: 6,
      borderRadius: 1,
  },
  quotedContent: {
      flex: 1,
      minWidth: 0,
  },
  quotedSender: {
    fontSize: 12,
    color: 'rgba(0,0,0,0.5)',
    fontWeight: '500',
    marginBottom: 2,
    overflow: 'hidden',
  },
  quotedPreview: {
    fontSize: 12,
    color: 'rgba(0,0,0,0.45)',
    overflow: 'hidden',
    ellipsizeMode: 'tail',
  },
});
