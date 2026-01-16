import React, { useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { Message } from 'juggleim-rnsdk';
import { MessageRenderContext, MessageRenderMode } from './types';
import { messageRendererRegistry } from './MessageRendererRegistry';

interface MessageBubbleContainerProps {
  message: Message;
  isOutgoing: boolean;
  currentUserId?: string;
  messageStatus?: { progress: number; error: boolean };
  onLongPress?: (anchor: { x: number; y: number; width: number; height: number }) => void;
  onResend?: () => void;
  /** 自定义渲染器（可选，用于临时覆盖） */
  overrideRenderer?: React.FC;
}

/**
 * 消息气泡容器组件
 *
 * 职责：
 * 1. 查找合适的渲染器
 * 2. 提供统一的气泡包装
 * 3. 管理头像、时间戳等通用UI元素
 * 4. 处理长按、错误状态等交互
 */
const MessageBubbleContainer: React.FC<MessageBubbleContainerProps> = ({
  message,
  isOutgoing,
  currentUserId,
  messageStatus,
  onLongPress,
  onResend,
  overrideRenderer,
}) => {
  const bubbleRef = useRef<View>(null);

  // 查找渲染器
  const lookupResult = messageRendererRegistry.findBestRenderer(message);
  const renderer = lookupResult.renderer;

  const handleLongPress = () => {
    if (onLongPress && bubbleRef.current) {
      bubbleRef.current.measureInWindow((x, y, width, height) => {
        onLongPress({ x, y, width, height });
      });
    }
  };

  // 构建渲染上下文
  const context: MessageRenderContext = {
    message,
    isOutgoing,
    currentUserId,
    messageStatus,
    onLongPress: handleLongPress,
  };

  // 如果没有找到渲染器，显示未知消息
  if (!renderer) {
    return (
      <View style={[styles.container, isOutgoing ? styles.outgoingContainer : styles.incomingContainer]}>
        {!isOutgoing && (
           <View style={styles.avatarContainer}>
             <Text style={styles.avatarText}>?</Text>
           </View>
        )}
        <View ref={bubbleRef} collapsable={false}>
          <TouchableOpacity
            onLongPress={handleLongPress}
            activeOpacity={0.6}
            style={[styles.bubble, isOutgoing ? styles.outgoingBubble : styles.incomingBubble]}>
            <Text style={styles.unsupportedText}>[Unsupported: {message.content.contentType}]</Text>
          </TouchableOpacity>
        </View>
        {isOutgoing && (
           <View style={styles.avatarContainer}>
             <Text style={styles.avatarText}>Me</Text>
           </View>
        )}
      </View>
    );
  }

  // 获取渲染器样式
  const bubbleStyle = renderer.getBubbleStyle?.(context) || {};
  const containerStyle = renderer.getContainerStyle?.(context) || {};

  // 根据渲染模式决定是否使用气泡包装
  const shouldWrapInBubble = renderer.renderMode === MessageRenderMode.BUBBLE;
  const isSystemMessage = renderer.renderMode === MessageRenderMode.SYSTEM;

  // 渲染器组件
  const RendererComponent = renderer.render;

  // 头像信息
  const name = message.senderUserName || message.senderUserId || '';
  const avatar = message.senderUserAvatar || '';

  // 系统消息直接居中显示，无头像
  if (isSystemMessage) {
    return (
      <View style={styles.systemMessageRow}>
        <RendererComponent context={context} />
      </View>
    );
  }

  // 普通消息行
  return (
    <View
      style={[
        styles.container,
        isOutgoing ? styles.outgoingContainer : styles.incomingContainer,
        containerStyle,
      ]}>
      {/* 错误指示器 (仅发送方显示在左侧) */}
      {isOutgoing && message.messageState === 3 && (
        <TouchableOpacity onPress={onResend} style={styles.errorIndicatorContainer}>
          <View style={styles.errorDot} />
          <View style={styles.errorDotPulse} />
        </TouchableOpacity>
      )}

      {/* 接收方头像 */}
      {!isOutgoing && renderer.showAvatar !== false && (
        <View style={styles.avatarContainer}>
          {avatar ? (
            <Image source={{ uri: avatar }} style={styles.avatarImage} />
          ) : (
            <Text style={styles.avatarText}>{name.substring(0, 1).toUpperCase() || '?'}</Text>
          )}
        </View>
      )}

      {/* 消息气泡 */}
      <View ref={bubbleRef} collapsable={false} style={styles.bubbleWrapper}>
        {/* 昵称 (仅群聊且接收方显示) */}
        {!isOutgoing && message.conversation.conversationType === 2 && (
             <Text style={styles.senderName}>{name}</Text>
        )}

        <TouchableOpacity
          onLongPress={handleLongPress}
          activeOpacity={0.8}
          style={
            shouldWrapInBubble
              ? [styles.bubble, isOutgoing ? styles.outgoingBubble : styles.incomingBubble, bubbleStyle]
              : undefined
          }>
          <RendererComponent context={context} />
        </TouchableOpacity>
      </View>

      {/* 发送方头像 */}
      {isOutgoing && renderer.showAvatar !== false && (
        <View style={styles.avatarContainer}>
          {avatar ? (
            <Image source={{ uri: avatar }} style={styles.avatarImage} />
          ) : (
            <Text style={styles.avatarText}>{currentUserId?.substring(0, 1).toUpperCase() || 'Me'}</Text>
          )}
        </View>
      )}
      
       {/* 错误指示器 (接收方显示在右侧 - 理论上接收方不会有error，但保持对称逻辑) */}
       {!isOutgoing && messageStatus?.error && (
        <View style={styles.errorIndicatorContainer}>
           {/* ... */}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginBottom: 16,
    paddingHorizontal: 12,
    alignItems: 'flex-start', // 顶部对齐
  },
  outgoingContainer: {
    justifyContent: 'flex-end',
  },
  incomingContainer: {
    justifyContent: 'flex-start',
  },
  systemMessageRow: {
    flexDirection: 'row',
    marginBottom: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarContainer: {
    width: 44,
    height: 44,
    borderRadius: 6, // Square with rounded corners
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: 44,
    height: 44,
  },
  avatarText: {
    color: '#999',
    fontSize: 16,
    fontWeight: 'bold',
  },
  bubbleWrapper: {
     flexDirection: 'column',
     alignItems: 'flex-start',
     marginHorizontal: 10,
     maxWidth: '75%',
  },
  senderName: {
     fontSize: 11,
     color: '#999',
     marginBottom: 4,
     marginLeft: 0,
  },
  bubble: {
    padding: 10,
    borderRadius: 6,
    minWidth: 40,
  },
  outgoingBubble: {
    backgroundColor: '#6db3ffff', // WeChat Green
    alignSelf: 'flex-end',
  },
  incomingBubble: {
    backgroundColor: '#fff',
    alignSelf: 'flex-start',
    borderWidth: 0, // No border for cleaner look
  },
  unsupportedText: {
    fontSize: 14,
    color: '#999',
  },
  errorIndicatorContainer: {
    width: 20,
    height: 20,
    alignSelf: 'center',
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#ff4444',
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorDotPulse: {
     display: 'none',
  },
});

export { MessageBubbleContainer };
