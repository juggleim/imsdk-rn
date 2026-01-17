import React from 'react';
import { View, Text, StyleSheet, Image, Platform } from 'react-native';
import { Message } from 'juggleim-rnsdk';
import { BaseMessageRenderer } from '../BaseMessageRenderer';
import { MessageRendererProps, MessageRenderMode } from '../types';

interface MergeMessageContent {
  title?: string;
  conversation?: any;
  messageIdList?: string[];
  previewList?: MergeMessagePreviewUnit[];
}

interface MergeMessagePreviewUnit {
  content?: string;
}

export class MergeMessageRenderer extends BaseMessageRenderer {
  readonly contentType = 'jg:merge';
  readonly renderMode = MessageRenderMode.BUBBLE;
  readonly priority = 40;

  renderContent: React.FC<MessageRendererProps> = ({ context }) => {
    const { message } = context;
    const mergeContent = message.content as any as MergeMessageContent;

    const title = mergeContent.title || '聊天记录';
    const previews = mergeContent.previewList || [];
    const previewTexts = previews.slice(0, 3).map((p) => p.content || '').filter(Boolean);

    return (
      <View style={styles.mergeContainer}>
        <View style={styles.header}>
            <Text style={styles.title} numberOfLines={1}>{title}</Text>
        </View>
        <View style={styles.body}>
          {previewTexts.map((text, index) => (
            <Text
              key={index}
              style={styles.previewText}
              numberOfLines={1}>
              {text}
            </Text>
          ))}
          {previewTexts.length === 0 && (
            <Text style={styles.previewText}>[聊天记录]</Text>
          )}
        </View>
        <View style={styles.footer}>
          <Text style={styles.footerText}>聊天记录</Text>
          <Text style={styles.timestamp}>
             {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
          </Text>
        </View>
      </View>
    );
  };

  // Override to white bubble consistently
  getBubbleStyle() {
      return {
          backgroundColor: '#fff',
          padding: 0,
          borderRadius: 6,
          borderWidth: 1,
          borderColor: 'rgba(0,0,0,0.05)',
          overflow: 'hidden' as const,
      }
  }

  estimateHeight(message: Message): number {
    return 130;
  }
}

const styles = StyleSheet.create({
  mergeContainer: {
    width: 250,
  },
  header: {
      paddingHorizontal: 16,
      paddingTop: 12,
      paddingBottom: 8,
  },
  title: {
      fontSize: 16,
      color: '#000',
      fontWeight: '500',
      overflow: 'hidden',
  },
  body: {
      paddingHorizontal: 16,
      paddingBottom: 12,
  },
  previewText: {
      fontSize: 13,
      color: '#888',
      marginBottom: 4,
      lineHeight: 18,
      overflow: 'hidden',
  },
  footer: {
      borderTopWidth: 1,
      borderTopColor: '#f0f0f0',
      paddingHorizontal: 16,
      paddingVertical: 10,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
  },
  footerText: {
      fontSize: 12,
      color: '#999',
  },
  timestamp: {
      fontSize: 10, 
      color: '#ccc',
  }
});
