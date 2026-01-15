import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { Message } from 'juggleim-rnsdk';
import { BaseMessageRenderer } from '../BaseMessageRenderer';
import { MessageRendererProps, MessageRenderMode } from '../types';

/**
 * 撤回消息渲染器
 */
export class RecallMessageRenderer extends BaseMessageRenderer {
  readonly contentType = 'jg:recallinfo';
  readonly renderMode = MessageRenderMode.SYSTEM;
  readonly priority = 90;
  readonly showAvatar = false;
  readonly showTimestamp = false;

  renderContent: React.FC<MessageRendererProps> = ({ context }) => {
    const { message, isOutgoing } = context;

    return (
      <View style={styles.systemMessageContainer}>
        <View style={styles.systemMessageContent}>
          <Text style={styles.systemMessageText}>
            {isOutgoing ? '你撤回了一条消息' : `${message.senderUserId} 撤回了一条消息`}
          </Text>
        </View>
      </View>
    );
  };

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
