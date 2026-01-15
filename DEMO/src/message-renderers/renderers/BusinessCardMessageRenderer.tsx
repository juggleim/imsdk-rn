import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { Message } from 'juggleim-rnsdk';
import { BaseMessageRenderer } from '../BaseMessageRenderer';
import { MessageRendererProps, MessageRenderMode } from '../types';

interface BusinessCardContent {
  userId: string;
  nickname: string;
  avatar: string;
}

/**
 * 名片消息渲染器
 *
 * 自定��消息类型：demo:businesscard
 */
export class BusinessCardMessageRenderer extends BaseMessageRenderer {
  readonly contentType = 'demo:businesscard';
  readonly renderMode = MessageRenderMode.BUBBLE;
  readonly priority = 55;

  renderContent: React.FC<MessageRendererProps> = ({ context }) => {
    const { message } = context;
    const content = message.content as any as BusinessCardContent;

    return (
      <View style={styles.card}>
        <View style={styles.avatarContainer}>
          {content.avatar ? (
            <Image source={{ uri: content.avatar }} style={styles.avatar} />
          ) : (
            <Text style={styles.avatarText}>{content.nickname?.substring(0, 1).toUpperCase() || '?'}</Text>
          )}
        </View>
        <View style={styles.info}>
          <Text style={styles.nickname}>{content.nickname || '未知用户'}</Text>
          <Text style={styles.userId}>ID: {content.userId}</Text>
        </View>
      </View>
    );
  };

  estimateHeight(message: Message): number {
    return 80;
  }
}

const styles = StyleSheet.create({
  card: {
    width: 200,
    flexDirection: 'row',
    padding: 8,
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 4,
  },
  avatarContainer: {
    width: 40,
    height: 40,
    borderRadius: 4,
    backgroundColor: 'rgba(0,0,0,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    overflow: 'hidden',
  },
  avatar: {
    width: 40,
    height: 40,
  },
  avatarText: {
    color: '#666',
    fontSize: 16,
    fontWeight: 'bold',
  },
  info: {
    flex: 1,
    minWidth: 0,
  },
  nickname: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000',
    marginBottom: 2,
  },
  userId: {
    fontSize: 12,
    color: 'rgba(0, 0, 0, 0.5)',
  },
});
