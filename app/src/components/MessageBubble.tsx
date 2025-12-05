import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import {
  Message,
  TextMessageContent,
  ImageMessageContent,
  VoiceMessageContent,
  FileMessageContent,
} from 'juggleim-rnsdk';

interface MessageBubbleProps {
  message: Message;
  isOutgoing: boolean;
  onLongPress?: () => void;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isOutgoing,
  onLongPress,
}) => {
  const renderContent = () => {
    const { contentType } = message.content;

    switch (contentType) {
      case 'jg:text':
        return (
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
            </Text>
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
        const uri =
          imgContent.thumbnailLocalPath ||
          imgContent.localPath ||
          imgContent.thumbnailUrl ||
          imgContent.url;

        const originalWidth = imgContent.width || 0;
        const originalHeight = imgContent.height || 0;

        const maxWidth = 200;
        const maxHeight = 300;

        let width = originalWidth;
        let height = originalHeight;

        if (width > 0 && height > 0) {
          const aspectRatio = width / height;
          if (width > maxWidth || height > maxHeight) {
            if (width / maxWidth > height / maxHeight) {
              width = maxWidth;
              height = width / aspectRatio;
            } else {
              height = maxHeight;
              width = height * aspectRatio;
            }
          }
        } else {
          width = 150;
          height = 200;
        }

        return (
          <View style={{ width: width + 52, height }}>
            <Image
              source={{ uri }}
              style={{ width, height, borderRadius: 8 }}
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
      default:
        return (
          <Text style={styles.text}>
            [Unsupported Message Type: {contentType}]
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
      <TouchableOpacity
        onLongPress={onLongPress}
        activeOpacity={0.6}
        style={[
          styles.bubble,
          isOutgoing ? styles.outgoingBubble : styles.incomingBubble,
        ]}>
        {renderContent()}
      </TouchableOpacity>
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
});

export default MessageBubble;
