import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Platform, Alert } from 'react-native';
import {
  Message,
  TextMessageContent,
  ImageMessageContent,
  VoiceMessageContent,
  FileMessageContent,
} from 'juggleim-rnsdk';
import CardMessageBubble from './CardMessageBubble';
import BusinessCardBubble from './BusinessCardBubble';
import VoiceMessageBubble from './VoiceMessageBubble';
import { BusinessCardMessage } from '../messages/BusinessCardMessage';

interface MessageBubbleProps {
  message: Message;
  isOutgoing: boolean;
  onLongPress?: (anchor: { x: number; y: number; width: number; height: number }) => void;
}

// 显示为灰条消息的白名单列表
const HuiTiaoMessageTypes = [
  'jgd:grpntf', 'jgd:friendntf'
];

const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isOutgoing,
  onLongPress,
}) => {
  const bubbleRef = React.useRef<View>(null);
  const [currentPlayingVoice, setCurrentPlayingVoice] = useState<string | null>(null);

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

  const renderContent = () => {
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
        if (uri && !uri.startsWith('http')) {
          uri = Platform.OS === 'android' ? 'file://' + uri : uri;
        }

        const originalWidth = imgContent.width || 0;
        const originalHeight = imgContent.height || 0;
        const maxWidth = 250;
        const maxHeight = 300;
        const aspectRatio = originalWidth / originalHeight;
        let displayWidth = maxWidth;
        let displayHeight = maxHeight;

        if (originalWidth > maxWidth || originalHeight > maxHeight) {
          if (aspectRatio > maxWidth / maxHeight) {
            displayWidth = maxWidth;
            displayHeight = maxHeight;
          } else {
            displayHeight = maxHeight;
            displayWidth = maxHeight * aspectRatio;
          }
        }

        return (
          <View style={{ width: maxWidth, height: maxHeight, backgroundColor: '#eee', borderRadius: 8, overflow: 'hidden' }}>
            <Image
              source={{ uri }}
              style={{ width: displayWidth, height: displayHeight }}
              resizeMode="cover"
            />
          </View>
        );
      case 'jg:voice':
        const voiceContent = message.content as VoiceMessageContent;
        const voiceUrl = voiceContent.url || voiceContent.localPath;
        const isPlaying = currentPlayingVoice === message.messageId;
        console.log('MessageBubble: voiceUrl', message.messageId, isPlaying);
        const handleVoicePress = () => {
          if (!voiceUrl) {
            console.log('语音文件路径不存在', message);
            Alert.alert('错误', '语音文件路径不存在');
            return;
          }

          if (isPlaying) {
            // 停止播放
            setCurrentPlayingVoice(null);
          } else {
            // 开始播放
            setCurrentPlayingVoice(message.messageId);
          }
        };

        return (
          <VoiceMessageBubble
            voiceUrl={voiceUrl}
            duration={voiceContent.duration}
            timestamp={message.timestamp}
            isOutgoing={isOutgoing}
            isPlaying={isPlaying}
            onPress={handleVoicePress}
          />
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
          style={HuiTiaoMessageTypes.includes(message.content.contentType) ? styles.huitiaoBubble : [
            styles.bubble,
            isOutgoing ? styles.outgoingBubble : styles.incomingBubble,
            // 图片消息不需要padding，避免溢出
            message.content.contentType === 'jg:img' && styles.imageBubble,
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

  huitiaoBubble: {
    backgroundColor: '#e1dfdfff',
    flexDirection: 'column',
    borderRadius: 3,
    alignSelf: 'center',
  },

  bubble: {
    padding: 6,
    borderRadius: 8,
    flexDirection: 'column',
    alignSelf: 'flex-start',
    maxWidth: '80%',
    minWidth: 50,
  },
  imageBubble: {
    padding: 0,
    overflow: 'hidden',
  },
  outgoingBubble: {
    backgroundColor: '#3399ff',
    alignSelf: 'flex-end',
  },
  incomingBubble: {
    backgroundColor: '#fff',
    alignSelf: 'flex-start',
  },
  textRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    flexWrap: 'wrap', // 长文本自动换行
  },
  text: {
    fontSize: Platform.OS === 'android' ? 15 : 16,
    lineHeight: Platform.OS === 'android' ? 20 : 22,
    flexShrink: 1, // 允许文本收缩以适应容器
  },
  outgoingText: {
    color: '#fff',
  },
  incomingText: {
    color: '#141414',
  },
  timestamp: {
    fontSize: Platform.OS === 'android' ? 9 : 10,
    marginLeft: 4,
    alignSelf: 'flex-end',
    flexShrink: 0, // 时间戳不被压缩
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
  voiceIconPlaying: {
    opacity: 0.6,
  },
  outgoingVoiceIcon: {
    tintColor: '#fff',
  },
  incomingVoiceIcon: {
    tintColor: '#141414',
  },
  fileContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    minWidth: 150,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 6,
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
    fontSize: Platform.OS === 'android' ? 13 : 14,
    fontWeight: '500',
  },
  fileSize: {
    fontSize: Platform.OS === 'android' ? 10 : 11,
    marginTop: 2,
  },
  systemMessageContainer: {
    alignSelf: 'center',
    height: 16,
    backgroundColor: 'transparent',
  },
  systemMessageText: {
    fontSize: Platform.OS === 'android' ? 9 : 10,
    color: '#999',
    width: '90%',
    paddingHorizontal: 15,
    textAlign: 'center',
    lineHeight: Platform.OS === 'android' ? 16 : 18,
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
    fontSize: Platform.OS === 'android' ? 11 : 12,
    fontWeight: '600',
    marginBottom: 2,
  },
  quotedPreview: {
    fontSize: Platform.OS === 'android' ? 10 : 11,
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

