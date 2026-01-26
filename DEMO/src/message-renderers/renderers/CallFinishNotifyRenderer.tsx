import React from 'react';
import { View, Text, StyleSheet, Image, Platform } from 'react-native';
import { Message } from 'juggleim-rnsdk';
import { BaseMessageRenderer } from '../BaseMessageRenderer';
import { MessageRendererProps, MessageRenderMode } from '../types';

interface CallFinishNotifyContent {
  reason?: number;
  duration?: number;
  media_type?: number;
}

/**
 * 通话结束通知渲染器
 */
export class CallFinishNotifyRenderer extends BaseMessageRenderer {
  readonly contentType = 'jg:callfinishntf';
  readonly renderMode = MessageRenderMode.BUBBLE;
  readonly priority = 35;

  renderContent: React.FC<MessageRendererProps> = ({ context }) => {
    const { message, isOutgoing } = context;
    const callContent = message.content as any as CallFinishNotifyContent;

    const duration = callContent.duration || 0;
    const minutes = Math.floor(duration / 60);
    const seconds = Math.floor(duration % 60);
    const durationText =
      duration > 0
        ? `${minutes > 0 ? `${minutes}分` : ''}${seconds}秒`
        : '通话未接通';

    const getCallTypeText = (media_type?: number): string => {
      return (media_type === 1 ? '视频通话' : '语音通话');
    };

    const getCallIcon = (media_type?: number): any => {
      return media_type === 1
        ? require('../../assets/icons/video_call.png')
        : require('../../assets/icons/call.png');
    };

    const callType = getCallTypeText(callContent.media_type);
    const callIcon = getCallIcon(callContent.media_type);

    return (
      <View style={styles.callContainer}>
        <View style={styles.callHeader}>
          <Image
            source={callIcon}
            style={[styles.callIcon, isOutgoing ? styles.outgoingIcon : styles.incomingIcon]}
          />
          <Text style={[styles.callType, isOutgoing ? styles.outgoingText : styles.incomingText]}>
            {callType}
          </Text>
        </View>
        <View style={styles.callBody}>
          <Text style={[styles.callDuration, isOutgoing ? styles.outgoingPreview : styles.incomingPreview]}>
            {durationText}
          </Text>
        </View>
        <Text
          style={[
            styles.callTimestamp,
            isOutgoing ? styles.outgoingTimestamp : styles.incomingTimestamp,
          ]}>
          {new Date(message.timestamp).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </Text>
      </View>
    );
  };

  estimateHeight(message: Message): number {
    return 70;
  }
}

const styles = StyleSheet.create({
  callContainer: {
    flexDirection: 'column',
    minWidth: 120,
    paddingVertical: 4,
  },
  callHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  callIcon: {
    width: 20,
    height: 20,
    marginRight: 6,
  },
  outgoingIcon: {
    tintColor: 'rgba(255,255,255,0.9)',
  },
  incomingIcon: {
    tintColor: '#666',
  },
  callType: {
    fontSize: 15,
    fontWeight: '600',
  },
  callBody: {
    marginBottom: 2,
  },
  callDuration: {
    fontSize: 13,
  },
  callTimestamp: {
    fontSize: Platform.OS === 'android' ? 10 : 11,
    marginTop: 2,
  },
  outgoingText: {
    color: '#fff',
  },
  incomingText: {
    color: '#141414',
  },
  outgoingPreview: {
    color: 'rgba(255,255,255,0.85)',
  },
  incomingPreview: {
    color: '#666',
  },
  outgoingTimestamp: {
    color: 'rgba(255,255,255,0.7)',
  },
  incomingTimestamp: {
    color: 'rgba(0,0,0,0.45)',
  },
});
