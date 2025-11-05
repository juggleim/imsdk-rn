,
# Juggle IM React Native SDK

React Native wrapper for Juggle IM SDK，提供即时通讯功能的React Native封装。

## 安装

```bash
npm install im-rn-sdk --registry=https://repo.juggle.im/repository/npm-hosted/ --legacy-peer-deps
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
}, (message, errorCode) => {
  if (errorCode) {
    console.log('Send failed with error:', errorCode);
  } else {
    console.log('Message sent successfully:', message);
  }
});
```

### 获取历史消息

```javascript
const messageResponse = await JuggleIM.getMessageList({
  conversationType: 1,
  conversationId: 'user123'
}, 1, { // 1表示从startTime往前的消息
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
- 文本消息 (TextMessageContent)
- 图片消息 (ImageMessageContent)
- 文件消息 (FileMessageContent)
- 语音消息 (VoiceMessageContent)