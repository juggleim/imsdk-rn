import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { Message } from 'juggleim-rnsdk';
import { BaseMessageRenderer } from '../BaseMessageRenderer';
import { MessageRendererProps, MessageRenderMode } from '../types';

interface TextCardContent {
  title: string;
  description: string;
  url: string;
}

/**
 * 文本卡片消息渲染器
 *
 * 自定义消息类型：demo:textcard
 */
export class TextCardMessageRenderer extends BaseMessageRenderer {
  readonly contentType = 'demo:textcard';
  readonly renderMode = MessageRenderMode.BUBBLE;
  readonly priority = 50;

  renderContent: React.FC<MessageRendererProps> = ({ context }) => {
    const { message, isOutgoing } = context;
    const content = message.content as any as TextCardContent;

    const handleUrlPress = () => {
      if (content.url?.trim()) {
        Linking.openURL(content.url).catch((err) => console.error('Failed to open URL:', err));
      }
    };

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={isOutgoing ? styles.sendCardType : styles.receiverCardType}>卡片消息</Text>
        </View>

        <Text style={[styles.title, isOutgoing ? styles.senderTitle : styles.receiverTitle]}>{content.title}</Text>

        {content.description ? (
          <Text
            style={[styles.description, isOutgoing ? styles.senderDescription : styles.receiverDescription]}>
            {content.description}
          </Text>
        ) : null}

        {content.url ? (
          <TouchableOpacity onPress={handleUrlPress} style={styles.urlContainer} activeOpacity={0.7}>
            <Text style={[styles.url, isOutgoing ? styles.senderUrl : styles.receiverUrl]} numberOfLines={1}>
              🔗 {content.url}
            </Text>
          </TouchableOpacity>
        ) : null}
      </View>
    );
  };

  estimateHeight(message: Message): number {
    return 150;
  }
}

const styles = StyleSheet.create({
  card: {
    width: 220,
    borderRadius: 4,
    padding: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  sendCardType: {
    fontSize: 11,
    color: 'rgba(0, 0, 0, 0.5)',
    fontWeight: '500',
  },
  receiverCardType: {
    fontSize: 11,
    color: 'rgba(0, 0, 0, 0.5)',
    fontWeight: '500',
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  senderTitle: {
    color: '#000',
  },
  receiverTitle: {
    color: '#000',
  },
  description: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 6,
  },
  senderDescription: {
    color: 'rgba(0, 0, 0, 0.7)',
  },
  receiverDescription: {
    color: 'rgba(0, 0, 0, 0.7)',
  },
  urlContainer: {
    marginTop: 2,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
  },
  url: {
    fontSize: 12,
  },
  senderUrl: {
    color: '#007AFF',
    textDecorationLine: 'underline',
  },
  receiverUrl: {
    color: '#007AFF',
    textDecorationLine: 'underline',
  },
});
