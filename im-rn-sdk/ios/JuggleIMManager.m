#import "JuggleIMManager.h"
#import <JuggleIM/JuggleIM.h>
#import <React/RCTEventEmitter.h>

/**
 * Juggle IM React Native iOS 模块
 */
@interface JuggleIMManager () <JConnectionDelegate, JMessageDelegate,
                               JMessageReadReceiptDelegate,
                               JMessageDestroyDelegate, JConversationDelegate>

@end

@implementation JuggleIMManager

RCT_EXPORT_MODULE(JuggleIM);

RCT_EXPORT_METHOD(setServerUrls : (NSArray *)urls) {
  [[JIM shared] setServerUrls:urls];
}

RCT_EXPORT_METHOD(initWithAppKey : (NSString *)appKey) {
  [[JIM shared] initWithAppKey:appKey];
  [JIM.shared setConsoleLogLevel:JLogLevelVerbose];
}

RCT_EXPORT_METHOD(connectWithToken : (NSString *)token) {
  [JIM.shared.connectionManager connectWithToken:token];
}

- (NSArray<NSString *> *)supportedEvents {
  return @[
    @"ConnectionStatusChanged", @"DbDidOpen", @"DbDidClose", @"MessageReceived",
    @"MessageRecalled", @"MessageUpdated", @"MessageDeleted", @"MessageCleared",
    @"MessageReactionAdded", @"MessageReactionRemoved", @"MessageSetTop",
    @"MessagesRead", @"GroupMessagesRead", @"MessageDestroyTimeUpdated",
    @"ConversationInfoAdded", @"ConversationInfoUpdated",
    @"ConversationInfoDeleted", @"TotalUnreadMessageCountUpdated"
  ];
}

/**
 * 添加连接状态监听器
 */
RCT_EXPORT_METHOD(addConnectionDelegate) {
  [JIM.shared.connectionManager addDelegate:self];
}

/**
 * 添加消息监听器
 */
RCT_EXPORT_METHOD(addMessageDelegate) {
  [JIM.shared.messageManager addDelegate:self];
}

/**
 * 添加消息阅读状态监听器
 */
RCT_EXPORT_METHOD(addMessageReadReceiptDelegate) {
  [JIM.shared.messageManager addReadReceiptDelegate:self];
}

/**
 * 添加消息销毁监听器
 */
RCT_EXPORT_METHOD(addMessageDestroyDelegate) {
  [JIM.shared.messageManager addDestroyDelegate:self];
}

/**
 * 添加会话监听器
 */
RCT_EXPORT_METHOD(addConversationDelegate) {
  [JIM.shared.conversationManager addDelegate:self];
}

#pragma mark - JConnectionDelegate

/**
 * 数据库打开的回调
 */
- (void)dbDidOpen {
  [self sendEventWithName:@"DbDidOpen" body:@{}];
}

/**
 * 数据库关闭的回调
 */
- (void)dbDidClose {
  [self sendEventWithName:@"DbDidClose" body:@{}];
}

/**
 * 连接状态变化的回调
 */
- (void)connectionStatusDidChange:(JConnectionStatus)status
                        errorCode:(JErrorCode)code
                            extra:(NSString *)extra {
  NSString *statusString = [self getStatusString:status];
  NSLog(@"connectionStatusDidChange: %@, code: %ld, extra: %@", statusString,
        (long)code, extra);

  [self sendEventWithName:@"ConnectionStatusChanged"
                     body:@{
                       @"status" : statusString,
                       @"code" : @(code),
                       @"extra" : extra ?: @""
                     }];
}

/**
 * 将连接状态转换为字符串
 */
- (NSString *)getStatusString:(JConnectionStatus)status {
  switch (status) {
  case JConnectionStatusConnected:
    return @"connected";
  case JConnectionStatusConnecting:
    return @"connecting";
  case JConnectionStatusDisconnected:
    return @"disconnected";
  case JConnectionStatusFailure:
    return @"failure";
  default:
    return @"unknown";
  }
}

#pragma mark - JMessageDelegate

/**
 * 接收消息的回调
 */
- (void)messageDidReceive:(JMessage *)message {
  [self sendEventWithName:@"MessageReceived"
                     body:@{
                       @"message" : [self convertMessageToDictionary:message]
                     }];
}

/**
 * 消息撤回的回调
 */
- (void)messageDidRecall:(JMessage *)message {
  [self sendEventWithName:@"MessageRecalled"
                     body:@{
                       @"message" : [self convertMessageToDictionary:message]
                     }];
}

/**
 * 消息修改的回调
 */
- (void)messageDidUpdate:(JMessage *)message {
  [self sendEventWithName:@"MessageUpdated"
                     body:@{
                       @"message" : [self convertMessageToDictionary:message]
                     }];
}

/**
 * 消息删除的回调
 */
- (void)messageDidDelete:(JConversation *)conversation
            clientMsgNos:(NSArray<NSNumber *> *)clientMsgNos {
  [self sendEventWithName:@"MessageDeleted"
                     body:@{
                       @"conversation" :
                           [self convertConversationToDictionary:conversation],
                       @"clientMsgNos" : clientMsgNos
                     }];
}

/**
 * 消息清除回调
 */
- (void)messageDidClear:(JConversation *)conversation
              timestamp:(long long)timestamp
               senderId:(NSString *)senderId {
  [self sendEventWithName:@"MessageCleared"
                     body:@{
                       @"conversation" :
                           [self convertConversationToDictionary:conversation],
                       @"timestamp" : @(timestamp),
                       @"senderId" : senderId ?: @""
                     }];
}

/**
 * 新增消息回应的回调
 */
- (void)messageReactionDidAdd:(JMessageReaction *)reaction
               inConversation:(JConversation *)conversation {
  [self sendEventWithName:@"MessageReactionAdded"
                     body:@{
                       @"conversation" :
                           [self convertConversationToDictionary:conversation],
                       @"reaction" : [self convertReactionToDictionary:reaction]
                     }];
}

/**
 * 删除消息回应的回调
 */
- (void)messageReactionDidRemove:(JMessageReaction *)reaction
                  inConversation:(JConversation *)conversation {
  [self sendEventWithName:@"MessageReactionRemoved"
                     body:@{
                       @"conversation" :
                           [self convertConversationToDictionary:conversation],
                       @"reaction" : [self convertReactionToDictionary:reaction]
                     }];
}

/**
 * 消息置顶的回调
 */
- (void)messageDidSetTop:(BOOL)isTop
                 message:(JMessage *)message
                    user:(JUserInfo *)userInfo {
  [self
      sendEventWithName:@"MessageSetTop"
                   body:@{
                     @"message" : [self convertMessageToDictionary:message],
                     @"operator" : [self convertUserInfoToDictionary:userInfo],
                     @"isTop" : @(isTop)
                   }];
}

#pragma mark - JMessageReadReceiptDelegate

/**
 * 单聊消息阅读回调
 */
- (void)messagesDidRead:(NSArray<NSString *> *)messageIds
         inConversation:(JConversation *)conversation {
  [self sendEventWithName:@"MessagesRead"
                     body:@{
                       @"conversation" :
                           [self convertConversationToDictionary:conversation],
                       @"messageIds" : messageIds
                     }];
}

/**
 * 群消息阅读回调
 */
- (void)groupMessagesDidRead:
            (NSDictionary<NSString *, JGroupMessageReadInfo *> *)msgs
              inConversation:(JConversation *)conversation {
  NSMutableDictionary *messages = [NSMutableDictionary dictionary];
  for (NSString *key in msgs.allKeys) {
    messages[key] = [self convertGroupMessageReadInfoToDictionary:msgs[key]];
  }

  [self sendEventWithName:@"GroupMessagesRead"
                     body:@{
                       @"conversation" :
                           [self convertConversationToDictionary:conversation],
                       @"messages" : messages
                     }];
}

#pragma mark - JMessageDestroyDelegate

/**
 * 消息销毁时间更新回调
 */
- (void)messageDestroyTimeDidUpdate:(NSString *)messageId
                     inConversation:(JConversation *)conversation
                        destroyTime:(long long)destroyTime {
  [self sendEventWithName:@"MessageDestroyTimeUpdated"
                     body:@{
                       @"messageId" : messageId,
                       @"conversation" :
                           [self convertConversationToDictionary:conversation],
                       @"destroyTime" : @(destroyTime)
                     }];
}

#pragma mark - JConversationDelegate

/**
 * 会话新增回调
 */
- (void)conversationInfoDidAdd:
    (NSArray<JConversationInfo *> *)conversationInfoList {
  NSMutableArray *conversations = [NSMutableArray array];
  for (JConversationInfo *info in conversationInfoList) {
    [conversations addObject:[self convertConversationInfoToDictionary:info]];
  }

  [self sendEventWithName:@"ConversationInfoAdded"
                     body:@{@"conversations" : conversations}];
}

/**
 * 会话变更回调
 */
- (void)conversationInfoDidUpdate:
    (NSArray<JConversationInfo *> *)conversationInfoList {
  NSMutableArray *conversations = [NSMutableArray array];
  for (JConversationInfo *info in conversationInfoList) {
    [conversations addObject:[self convertConversationInfoToDictionary:info]];
  }

  [self sendEventWithName:@"ConversationInfoUpdated"
                     body:@{@"conversations" : conversations}];
}

/**
 * 会话删除回调
 */
- (void)conversationInfoDidDelete:
    (NSArray<JConversationInfo *> *)conversationInfoList {
  NSMutableArray *conversations = [NSMutableArray array];
  for (JConversationInfo *info in conversationInfoList) {
    [conversations addObject:[self convertConversationInfoToDictionary:info]];
  }

  [self sendEventWithName:@"ConversationInfoDeleted"
                     body:@{@"conversations" : conversations}];
}

/**
 * 总的未读数变化回调
 */
- (void)totalUnreadMessageCountDidUpdate:(int)count {
  [self sendEventWithName:@"TotalUnreadMessageCountUpdated"
                     body:@{@"count" : @(count)}];
}

#pragma mark - Helper Methods

/**
 * 将消息对象转换为字典
 */
- (NSDictionary *)convertMessageToDictionary:(JMessage *)message {
  NSMutableDictionary *dict = [NSMutableDictionary dictionary];
  dict[@"messageId"] = message.messageId ?: @"";
  dict[@"conversation"] = message.conversation ?: @"";
  dict[@"clientMsgNo"] = @(message.clientMsgNo);
  dict[@"timestamp"] = @(message.timestamp);
  dict[@"senderUserId"] = message.senderUserId ?: @"";
  dict[@"conversation"] =
      [self convertConversationToDictionary:message.conversation];
  dict[@"content"] = [self convertMessageContentToDictionary:message.content];
  return dict;
}

/**
 * 将会话对象转换为字典
 */
- (NSDictionary *)convertConversationToDictionary:
    (JConversation *)conversation {
  return @{
    @"conversationType" : @(conversation.conversationType),
    @"conversationId" : conversation.conversationId ?: @""
  };
}

/**
 * 将消息内容转换为字典
 */
- (NSDictionary *)convertMessageContentToDictionary:(JMessageContent *)content {
  NSMutableDictionary *dict = [NSMutableDictionary dictionary];
  dict[@"contentType"] = [[content class] contentType] ?: @"";

  if ([content isKindOfClass:[JTextMessage class]]) {
    JTextMessage *textMsg = (JTextMessage *)content;
    dict[@"content"] = textMsg.content ?: @"";
    dict[@"extra"] = textMsg.extra ?: @"";
  } else if ([content isKindOfClass:[JImageMessage class]]) {
    JImageMessage *imgMsg = (JImageMessage *)content;
    dict[@"url"] = imgMsg.url ?: @"";
    dict[@"localPath"] = imgMsg.localPath ?: @"";
    dict[@"thumbnailUrl"] = imgMsg.thumbnailUrl ?: @"";
    dict[@"thumbnailLocalPath"] = imgMsg.thumbnailLocalPath ?: @"";
    dict[@"extra"] = imgMsg.extra ?: @"";
    dict[@"width"] = @(imgMsg.width);
    dict[@"height"] = @(imgMsg.height);
  } else if ([content isKindOfClass:[JFileMessage class]]) {
    JFileMessage *fileMsg = (JFileMessage *)content;
    dict[@"url"] = fileMsg.url ?: @"";
    dict[@"name"] = fileMsg.name ?: @"";
    dict[@"size"] = @(fileMsg.size);
    dict[@"extra"] = fileMsg.extra ?: @"";
  } else if ([content isKindOfClass:[JVoiceMessage class]]) {
    JVoiceMessage *voiceMsg = (JVoiceMessage *)content;
    dict[@"url"] = voiceMsg.url ?: @"";
    dict[@"duration"] = @(voiceMsg.duration);
    dict[@"extra"] = voiceMsg.extra ?: @"";
  }

  return dict;
}

/**
 * 将消息回应转换为字典
 */
- (NSDictionary *)convertReactionToDictionary:(JMessageReaction *)reaction {
  NSMutableArray *itemArray = [NSMutableArray array];

  for (JMessageReactionItem *item in reaction.itemList) {
    NSMutableArray *userArray = [NSMutableArray array];

    for (JUserInfo *user in item.userInfoList) {
      NSDictionary *userDict = [self convertUserInfoToDictionary:user];
      if (userDict) {
        [userArray addObject:userDict];
      }
    }

    NSDictionary *itemDict =
        @{@"reactionId" : item.reactionId ?: @"", @"userInfoList" : userArray};

    [itemArray addObject:itemDict];
  }

  NSDictionary *reactionDict =
      @{@"messageId" : reaction.messageId ?: @"", @"itemList" : itemArray};

  return reactionDict;
}

/**
 * 将用户信息转换为字典
 */
- (NSDictionary *)convertUserInfoToDictionary:(JUserInfo *)userInfo {
  return @{
    @"userId" : userInfo.userId ?: @"",
    @"userName" : userInfo.userName ?: @"",
    @"avatar" : userInfo.portrait ?: @""
  };
}

/**
 * 将群消息阅读信息转换为字典
 */
- (NSDictionary *)convertGroupMessageReadInfoToDictionary:
    (JGroupMessageReadInfo *)info {
  return
      @{@"readCount" : @(info.readCount), @"memberCount" : @(info.memberCount)};
}

/**
 * 将会话信息转换为字典
 */
- (NSDictionary *)convertConversationInfoToDictionary:(JConversationInfo *)info {
  NSMutableDictionary *dict = [NSMutableDictionary dictionary];
  dict[@"conversation"] = [self convertConversationToDictionary:info.conversation];
  dict[@"unreadMessageCount"] = @(info.unreadCount); // 统一字段名
  dict[@"topTime"] = @(info.topTime);
  dict[@"sortTime"] = @(info.sortTime);
  dict[@"isTop"] = @(info.isTop);
  dict[@"isMute"] = @(info.mute);
  dict[@"hasUnread"] = @(info.hasUnread);
  dict[@"draft"] = info.draft ?: @"";
  if (info.lastMessage) {
    dict[@"lastMessage"] = [self convertMessageToDictionary:info.lastMessage];
  }
  if (info.mentionInfo) { // 新增
    dict[@"mentionInfo"] = [self convertConversationMentionInfoToDictionary:info.mentionInfo];
  }
  return dict;
}

// 新增转换方法
- (NSDictionary *)convertConversationMentionInfoToDictionary:(JConversationMentionInfo *)mentionInfo {
  NSMutableDictionary *dict = [NSMutableDictionary dictionary];
  if (mentionInfo.mentionMsgList) {
    NSMutableArray *mentionMsgArray = [NSMutableArray array];
    for (JConversationMentionMessage *mentionMsg in mentionInfo.mentionMsgList) {
      NSDictionary *msgDict = @{
        @"senderId": mentionMsg.senderId ?: @"",
        @"msgId": mentionMsg.msgId ?: @"",
        @"msgTime": @(mentionMsg.msgTime),
        @"type": @(mentionMsg.type)
      };
      [mentionMsgArray addObject:msgDict];
    }
    dict[@"mentionMsgList"] = mentionMsgArray;
  }
  return dict;
}

@end