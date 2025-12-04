,
# Juggle IM React Native SDK

React Native wrapper for Juggle IM SDK，提供即时通讯功能的React Native封装。

## 安装

```bash
npm install im-rn-sdk --legacy-peer-deps
```

## 初始化

在使用Juggle IM SDK之前，需要先进行初始化设置：

```javascript
import JuggleIM from 'im-rn-sdk';

// 设置服务器地址
JuggleIM.setServerUrls(['your_server_url']);

// 初始化SDK
JuggleIM.init('your_app_key');

// 连接服务器
JuggleIM.connect('your_token');
```

## 监听器

### 连接状态监听

```javascript
const unsubscribe = JuggleIM.addConnectionStatusListener('listener_key', (status, code, extra) => {
  console.log('Connection status:', status);
});

// 取消监听
// unsubscribe();
```

### 消息监听

```javascript
const unsubscribe = JuggleIM.addMessageListener('listener_key', {
  onMessageReceive: (message) => {
    console.log('Received message:', message);
  },
  onMessageRecall: (message) => {
    console.log('Message recalled:', message);
  },
  onMessageUpdate: (message) => {
    console.log('Message updated:', message);
  },
  onMessageDelete: (conversation, clientMsgNos) => {
    console.log('Messages deleted:', conversation, clientMsgNos);
  },
  onMessageClear: (conversation, timestamp, senderId) => {
    console.log('Messages cleared:', conversation, timestamp, senderId);
  },
  onMessageReactionAdd: (conversation, reaction) => {
    console.log('Message reaction added:', conversation, reaction);
  },
  onMessageReactionRemove: (conversation, reaction) => {
    console.log('Message reaction removed:', conversation, reaction);
  },
  onMessageSetTop: (message, operator, isTop) => {
    console.log('Message set top:', message, operator, isTop);
  }
});

// 取消监听
// unsubscribe();
```

### 消息阅读状态监听

```javascript
const unsubscribe = JuggleIM.addMessageReadReceiptListener('read_listener_key', {
  onMessagesRead: (conversation, messageIds) => {
    console.log('Messages read:', conversation, messageIds);
  },
  onGroupMessagesRead: (conversation, messages) => {
    console.log('Group messages read info updated:', conversation, messages);
  }
});

// 取消监听
// unsubscribe();
```

### 消息销毁监听

```javascript
const unsubscribe = JuggleIM.addMessageDestroyListener('destroy_listener_key', {
  onMessageDestroyTimeUpdate: (messageId, conversation, destroyTime) => {
    console.log('Message destroy time updated:', messageId, conversation, destroyTime);
  }
});

// 取消监听
// unsubscribe();
```

### 会话监听

```javascript
const unsubscribe = JuggleIM.addConversationListener('listener_key', {
  onConversationInfoAdd: (conversations) => {
    console.log('New conversations:', conversations);
  },
  onConversationInfoUpdate: (conversations) => {
    console.log('Updated conversations:', conversations);
  },
  onConversationInfoDelete: (conversations) => {
    console.log('Deleted conversations:', conversations);
  },
  onTotalUnreadMessageCountUpdate: (count) => {
    console.log('Total unread count updated:', count);
  }
});

// 取消监听
// unsubscribe();
```

## 会话操作

### 获取会话列表

```javascript
// 获取会话信息列表
const conversations = await JuggleIM.getConversationInfoList({
  count: 20,
  timestamp: Date.now(),
  direction: 1 // 0-更新的消息, 1-更早的消息
});
```

### 获取单个会话

```javascript
const conversationInfo = await JuggleIM.getConversationInfo({
  conversationType: 1, // ConversationType.PRIVATE
  conversationId: 'user123'
});
```

### 创建会话

```javascript
const conversationInfo = await JuggleIM.createConversationInfo({
  conversationType: 1,
  conversationId: 'user123'
});
```

### 删除会话

```javascript
const result = await JuggleIM.deleteConversationInfo({
  conversationType: 1,
  conversationId: 'user123'
}, {
  onSuccess: () => {
    console.log('Conversation deleted successfully');
  },
  onError: (errorCode) => {
    console.log('Failed to delete conversation, error code:', errorCode);
  }
});
```

### 会话免打扰设置

```javascript
const result = await JuggleIM.setMute({
  conversationType: 1,
  conversationId: 'user123'
}, true); // true为开启免打扰
```

### 会话置顶设置

```javascript
const result = await JuggleIM.setTop({
  conversationType: 1,
  conversationId: 'user123'
}, true); // true为置顶会话
```

### 设置会话未读状态

```javascript
const result = await JuggleIM.setUnread({
  conversationType: 1,
  conversationId: 'user123'
}, true); // true为标记为未读
```

### 未读数操作

```javascript
// 清除会话未读数
const result = await JuggleIM.clearUnreadCount({
  conversationType: 1,
  conversationId: 'user123'
});

// 清除总未读数
const totalResult = await JuggleIM.clearTotalUnreadCount();

// 获取总未读数
const totalCount = await JuggleIM.getTotalUnreadCount();

// 获取指定类型的未读数
const typeUnreadCount = await JuggleIM.getUnreadCountWithTypes([1, 2]); // PRIVATE 和 GROUP 会话的未读数
```

### 草稿操作

```javascript
// 设置会话草稿
const setResult = await JuggleIM.setDraft({
  conversationType: 1,
  conversationId: 'user123'
}, 'Hello, this is a draft');

// 清除会话草稿
const clearResult = await JuggleIM.clearDraft({
  conversationType: 1,
  conversationId: 'user123'
});
```

### 会话标签操作

```javascript
// 将会话添加到标签
const addResult = await JuggleIM.addConversationsToTag({
  tagId: 'tag123',
  conversations: [
    {
      conversationType: 1,
      conversationId: 'user123'
    },
    {
      conversationType: 2,
      conversationId: 'group456'
    }
  ]
});

// 从标签中移除会话
const removeResult = await JuggleIM.removeConversationsFromTag({
  tagId: 'tag123',
  conversations: [
    {
      conversationType: 1,
      conversationId: 'user123'
    }
  ]
});
```

### 获取置顶会话列表

```javascript
const topConversations = await JuggleIM.getTopConversationInfoList(
  20,         // 获取数量
  Date.now(), // 时间戳
  1           // 拉取方向: 0-更新的消息, 1-更早的消息
);
```

## 消息操作

### 发送消息

```javascript
const message = await JuggleIM.sendMessage({
  conversationType: 1,
  conversationId: 'user123',
  content: {
    contentType: 'text',
    content: 'Hello World!'
  } as TextMessageContent
}, {
  onSuccess: (message) => {
    console.log('Message sent successfully:', message);
  },
  onError: (message, errorCode) => {
    console.log('Send failed with error:', errorCode);
  }
});
```

### 发送图片消息

```javascript
const imageMessage = await JuggleIM.sendImageMessage({
  conversationType: 1,
  conversationId: 'user123',
  content: {
    contentType: 'jg:img',
    localPath: '/path/to/image.jpg',
    width: 800,
    height: 600
  } as ImageMessageContent
}, {
  onProgress: (progress, message) => {
    console.log('Upload progress:', progress);
  },
  onSuccess: (message) => {
    console.log('Image sent successfully:', message);
  },
  onError: (message, errorCode) => {
    console.log('Send image failed with error:', errorCode);
  }
});
```

### 发送文件消息

```javascript
const fileMessage = await JuggleIM.sendFileMessage({
  conversationType: 1,
  conversationId: 'user123',
  content: {
    contentType: 'jg:file',
    localPath: '/path/to/document.pdf',
    name: 'document.pdf',
    size: 102400
  } as FileMessageContent
}, {
  onProgress: (progress, message) => {
    console.log('Upload progress:', progress);
  },
  onSuccess: (message) => {
    console.log('File sent successfully:', message);
  },
  onError: (message, errorCode) => {
    console.log('Send file failed with error:', errorCode);
  }
});
```

### 发送语音消息

```javascript
const voiceMessage = await JuggleIM.sendVoiceMessage(1, 'user123', {
  contentType: 'jg:voice',
  localPath: '/path/to/audio.mp3',
  duration: 10
} as VoiceMessageContent, {
  onProgress: (progress, message) => {
    console.log('Upload progress:', progress);
  },
  onSuccess: (message) => {
    console.log('Voice sent successfully:', message);
  },
  onError: (message, errorCode) => {
    console.log('Send voice failed with error:', errorCode);
  }
});
```

### 获取历史消息

```javascript
const messageResponse = await JuggleIM.getMessageList({
  conversationType: 1,
  conversationId: 'user123'
}, 1, { // 方向: 1表示获取更早的消息(向前翻页), 0表示获取更新的消息(向后翻页)
  count: 20,
  startTime: Date.now()
});
```

### 撤回消息

```javascript
const result = await JuggleIM.recallMessage(['message_id_1', 'message_id_2'], {
  reason: 'sent by mistake'
});
```

### 消息反应

```javascript
// 添加消息反应
const addResult = await JuggleIM.addMessageReaction('message_id', 'thumbs_up');

// 移除消息反应
const removeResult = await JuggleIM.removeMessageReaction('message_id', 'thumbs_up');
```

## 类型定义

### 会话类型

```typescript
export enum ConversationType {
  PRIVATE = 1,
  GROUP = 2,
  CHATROOM = 3,
  SYSTEM = 4,
}
```

### 连接状态

```typescript
export type ConnectionStatus =
  | "connected"
  | "connecting"
  | "disconnected"
  | "failure"
  | "dbOpen"
  | "dbClose";
```

### 消息内容类型

支持多种消息内容类型：

#### 文本消息 (TextMessageContent)
``typescript
export interface TextMessageContent extends MessageContent {
  content: string;
}
```

#### 图片消息 (ImageMessageContent)
``typescript
export interface ImageMessageContent extends MessageContent {
  localPath: string;
  thumbnailLocalPath?: string;
  url?: string;
  thumbnailUrl?: string;
  width: number;
  height: number;
}
```

#### 文件消息 (FileMessageContent)
``typescript
export interface FileMessageContent extends MessageContent {
  localPath: string;
  url?: string;
  name: string;
  size: number;
  type?: string;
}
```

#### 语音消息 (VoiceMessageContent)
``typescript
export interface VoiceMessageContent extends MessageContent {
  localPath: string;
  url?: string;
  duration: number;
}
```

#### 消息对象 (Message)
```typescript
export interface Message {
  clientMsgNo: number;
  localAttribute: string;
  messageState: number;
  isEdited: boolean;
  direction: number;
  isDelete: boolean;
  senderUserId: string;
  messageId: string;
  hasRead: boolean;
  timestamp: number;
  conversation: Conversation;
  content: MessageContent;
  groupMessageReadInfo?: GroupMessageReadInfo;
  mentionInfo: MessageMentionInfo;
}
```

#### 会话对象 (Conversation)
```typescript
export interface Conversation {
  conversationType: number;
  conversationId: string;
}
```

#### 用户信息 (UserInfo)
```typescript
export interface UserInfo {
  userId: string;
  nickname: string;
  avatar: string;
}
```

#### 消息内容 (MessageContent)
```

```

#### 提及信息 (MessageMentionInfo)
```typescript
export interface MessageMentionInfo {
  /**
   *   DEFAULT(0),
   *   ALL(1),
   *   SOMEONE(2),
   *   ALL_AND_SOMEONE(3);
   */
  type: number;
  targetUsers: UserInfo[];
}
```

