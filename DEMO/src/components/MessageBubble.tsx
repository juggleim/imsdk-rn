import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Platform } from 'react-native';
import {
  Message,
  TextMessageContent,
  ImageMessageContent,
  VoiceMessageContent,
  FileMessageContent,
} from 'juggleim-rnsdk';
import CardMessageBubble from './CardMessageBubble';
import BusinessCardBubble from './BusinessCardBubble';
import { BusinessCardMessage } from '../messages/BusinessCardMessage';
import { GroupNotifyMessage } from '../messages/GroupNotifyMessage';
import { FriendNotifyMessage } from '../messages/FriendNotifyMessage';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { USER_ID_KEY } from '../utils/auth';
import UserInfoManager from '../manager/UserInfoManager';

interface MessageBubbleProps {
  message: Message;
  isOutgoing: boolean;
  onLongPress?: (anchor: { x: number; y: number; width: number; height: number }) => void;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isOutgoing,
  onLongPress,
}) => {
  const bubbleRef = React.useRef<View>(null);

  const handleLongPress = () => {
    if (onLongPress && bubbleRef.current) {
      // Measure the position relative to the window
      bubbleRef.current.measureInWindow((x, y, width, height) => {
        onLongPress({ x, y, width, height });
      });
    }
  };

  const getQuotedMessagePreview = (quotedMsg: Message): string => {
    const contentType = quotedMsg.content.contentType;
    if (contentType === 'jg:text') {
      return (quotedMsg.content as TextMessageContent).content;
    } else if (contentType === 'jg:img') {
      return '[图片]';
    } else if (contentType === 'jg:file') {
      return '[文件]';
    } else if (contentType === 'jg:video') {
      return '[视频]';
    } else if (contentType === 'jg:voice') {
      return '[语音]';
    } else {
      return '[消息]';
    }
  };

  const renderQuotedMessage = (quotedMsg: Message) => {
    return (
      <View style={styles.quotedContainer}>
        <View style={styles.quotedContent}>
          <Image
            source={require('../assets/icons/reply.png')}
            style={[
              styles.quotedIcon,
              isOutgoing ? styles.outgoingQuotedIcon : styles.incomingQuotedIcon,
            ]}
          />
          <View style={styles.quotedTextContainer}>
            <Text
              style={[
                styles.quotedSender,
                isOutgoing ? styles.outgoingText : styles.incomingText,
              ]}
              numberOfLines={1}>
              {quotedMsg.senderUserId}
            </Text>
            <Text
              style={[
                styles.quotedPreview,
                isOutgoing ? styles.outgoingTimestamp : styles.incomingTimestamp,
              ]}
              numberOfLines={1}>
              {getQuotedMessagePreview(quotedMsg)}
            </Text>
          </View>
        </View>
        <View style={[
          styles.quotedDivider,
          isOutgoing ? styles.outgoingDivider : styles.incomingDivider,
        ]} />
      </View>
    );
  };

  const renderContent = async () => {
    const { contentType } = message.content;
    switch (contentType) {
      case 'jg:text':
        return (
          <View>
            {message.referredMessage && renderQuotedMessage(message.referredMessage)}
            <View style={styles.textRow}>
              <Text
                style={[
                  styles.text,
                  isOutgoing ? styles.outgoingText : styles.incomingText,
                ]}>
                {(message.content as TextMessageContent).content}
              </Text>
              <Text
                style={[
                  styles.timestamp,
                  isOutgoing
                    ? styles.outgoingTimestamp
                    : styles.incomingTimestamp,
                ]}>
                {new Date(message.timestamp).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
                {message.isEdit && ' 已编辑'}
              </Text>
            </View>
          </View>
        );
      case 'jg:callfinishntf':
        return (
          <View style={styles.textRow}>
            <Text
              style={[
                styles.text,
                isOutgoing ? styles.outgoingText : styles.incomingText,
              ]}>
              {"通话结束"}
            </Text>
            <Text
              style={[
                styles.timestamp,
                isOutgoing
                  ? styles.outgoingTimestamp
                  : styles.incomingTimestamp,
              ]}>
              {new Date(message.timestamp).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
          </View>
        );
      case 'jg:img':
        const imgContent = message.content as ImageMessageContent;
        let uri = (imgContent.thumbnailUrl || imgContent.thumbnailLocalPath) || (imgContent.url || imgContent.localPath);
        if (!uri.startsWith('http')) {
          uri = Platform.OS === 'android' ? 'file://' + uri : uri;
        }

        const originalWidth = imgContent.width || 0;
        const originalHeight = imgContent.height || 0;

        const maxWidth = 200;
        const maxHeight = 300;

        let width = originalWidth;
        let height = originalHeight;
        let w = width, h = height;

        if (width > 0 && height > 0) {
          const aspectRatio = width / height;
          if (width > maxWidth || height > maxHeight) {
            if (width / maxWidth > height / maxHeight) {
              width = maxWidth;
              height = width / aspectRatio;
              w = width + width * 0.6
            } else {
              height = maxHeight;
              width = height * aspectRatio;
              w = width + width * 0.6
            }
          }
        } else {
          width = maxWidth;
          height = maxHeight;
        }
        return (
          <View style={{ width: w, height }}>
            <Image
              source={{ uri }}
              style={{ width: width, height, borderRadius: 8 }}
              resizeMode="cover"
            />
          </View>
        );
      case 'jg:voice':
        const voiceContent = message.content as VoiceMessageContent;
        return (
          <View style={styles.voiceContainer}>
            <Image
              source={require('../assets/icons/microphone.png')}
              style={[
                styles.voiceIcon,
                isOutgoing
                  ? styles.outgoingVoiceIcon
                  : styles.incomingVoiceIcon,
              ]}
            />
            <Text
              style={[
                styles.text,
                isOutgoing ? styles.outgoingText : styles.incomingText,
              ]}>
              {voiceContent.duration}s
            </Text>
            <Text
              style={[
                styles.timestamp,
                isOutgoing
                  ? styles.outgoingTimestamp
                  : styles.incomingTimestamp,
              ]}>
              {new Date(message.timestamp).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
          </View>
        );
      case 'jg:file':
        const fileContent = message.content as FileMessageContent;
        const formatFileSize = (bytes: number) => {
          if (bytes < 1024) return bytes + ' B';
          if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
          return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
        };
        return (
          <View style={styles.fileContainer}>
            <Image
              source={require('../assets/icons/file.png')}
              style={[
                styles.fileIcon,
                isOutgoing
                  ? styles.outgoingVoiceIcon
                  : styles.incomingVoiceIcon,
              ]}
            />
            <View style={styles.fileInfo}>
              <Text
                style={[
                  styles.fileName,
                  isOutgoing ? styles.outgoingText : styles.incomingText,
                ]}
                numberOfLines={1}>
                {fileContent.name}
              </Text>
              <Text
                style={[
                  styles.fileSize,
                  isOutgoing
                    ? styles.outgoingTimestamp
                    : styles.incomingTimestamp,
                ]}>
                {formatFileSize(fileContent.size)}
              </Text>
            </View>
          </View>
        );
      case 'demo:textcard':
        return (
          <View style={{ maxWidth: '100%', width: 260 }}>
            <CardMessageBubble message={message} isSender={isOutgoing} />
          </View>
        );
      case 'demo:businesscard':
        return (
          <View style={{ maxWidth: '100%', width: 260 }}>
            <BusinessCardBubble message={message.content as any as BusinessCardMessage} isOutgoing={isOutgoing} />
          </View>
        );
      case 'jgd:grpntf':
        return (
          <View style={styles.systemMessageContainer}>
            <Text style={styles.systemMessageText}>
              {'[群通知]'}
            </Text>
          </View>
        );
      case 'jgd:friendntf':
        // const friendNotifyMsg = message.content as FriendNotifyMessage;
        // const userInfo = await UserInfoManager.getUserInfo(message.senderUserId);
        // console.log('friendNotifyMsg', friendNotifyMsg, userInfo);
        return (
          <View style={styles.systemMessageContainer}>
            <Text style={styles.systemMessageText}>
              {'好友通知'}
            </Text>
          </View>
        );
      default:
        return (
          <Text style={styles.text}>
            [Unsupported Message: {contentType}]
          </Text>
        );
    }
  };

  return (
    <View
      style={[
        styles.container,
        isOutgoing ? styles.outgoingContainer : styles.incomingContainer,
      ]}>
      <View ref={bubbleRef} collapsable={false}>
        <TouchableOpacity
          onLongPress={handleLongPress}
          activeOpacity={0.6}
          style={[
            styles.bubble,
            isOutgoing ? styles.outgoingBubble : styles.incomingBubble,
          ]}>
          {renderContent()}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginBottom: 2,
  },
  outgoingContainer: {
    justifyContent: 'flex-end',
  },
  incomingContainer: {
    justifyContent: 'flex-start',
  },
  bubble: {
    padding: 6,
    borderRadius: 8,
    flexDirection: 'column',
    alignSelf: 'flex-start',
    maxWidth: '80%',
    minWidth: 50,
  },
  outgoingBubble: {
    backgroundColor: '#3399ff',
    alignSelf: 'flex-end',
  },
  incomingBubble: {
    backgroundColor: '#f2f2f2',
    alignSelf: 'flex-start',
  },
  textRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    flexWrap: 'wrap', // 长文本自动换行
  },
  text: {
    fontSize: 16,
    lineHeight: 22,
    flexShrink: 0, // 不被压缩
  },
  outgoingText: {
    color: '#fff',
  },
  incomingText: {
    color: '#141414',
  },
  timestamp: {
    fontSize: 10,
    marginLeft: 4,
    minWidth: 50,
    alignSelf: 'flex-end',
  },
  outgoingTimestamp: {
    color: 'rgba(255,255,255,0.7)',
  },
  incomingTimestamp: {
    color: 'rgba(0,0,0,0.4)',
  },
  voiceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 60,
  },
  voiceIcon: {
    width: 20,
    height: 20,
    marginRight: 8,
  },
  outgoingVoiceIcon: {
    tintColor: '#fff',
  },
  incomingVoiceIcon: {
    tintColor: '#141414',
  },
  fileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 150,
    maxWidth: 250,
  },
  fileIcon: {
    width: 40,
    height: 40,
    marginRight: 8,
  },
  fileInfo: {
    flex: 1,
  },
  fileName: {
    fontSize: 14,
    fontWeight: '500',
  },
  fileSize: {
    fontSize: 11,
    marginTop: 2,
  },
  systemMessageContainer: {
    alignSelf: 'center',
    height: 16,
    backgroundColor: 'transparent',
  },
  systemMessageText: {
    fontSize: 10,
    color: '#999',
    width: '90%',
    height: 18,
    paddingHorizontal: 15,
    textAlign: 'center',
  },
  quotedContainer: {
    marginBottom: 6,
  },
  quotedContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  quotedIcon: {
    width: 16,
    height: 16,
    marginRight: 6,
  },
  outgoingQuotedIcon: {
    tintColor: 'rgba(255,255,255,0.7)',
  },
  incomingQuotedIcon: {
    tintColor: 'rgba(0,0,0,0.5)',
  },
  quotedTextContainer: {
    flex: 1,
  },
  quotedSender: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 2,
  },
  quotedPreview: {
    fontSize: 11,
  },
  quotedDivider: {
    height: 1,
    marginBottom: 6,
  },
  outgoingDivider: {
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  incomingDivider: {
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
});

export default MessageBubble;

