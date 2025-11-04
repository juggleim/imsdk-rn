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
  dict[@"clientMsgNo"] = [NSString stringWithFormat:@"%lld", message.clientMsgNo];
  dict[@"timestamp"] = @(message.timestamp);
  dict[@"senderUserId"] = message.senderUserId ?: @"";
  dict[@"conversation"] =
      [self convertConversationToDictionary:message.conversation];
  dict[@"content"] = [self convertMessageContentToDictionary:message.content];
  dict[@"direction"] = @(message.direction);
    dict[@"messageState"] = @(message.messageState);

  // 添加是否已读
  dict[@"hasRead"] = @(message.hasRead);
  
  // 添加群消息阅读信息
  if (message.groupReadInfo) {
      dict[@"groupMessageReadInfo"] = [self convertGroupMessageReadInfoToDictionary:message.groupReadInfo];
  }
  
  // 添加引用消息
  if (message.referredMsg) {
      dict[@"referredMessage"] = [self convertMessageToDictionary:message.referredMsg];
  }
  
  // 添加@消息信息
  if (message.mentionInfo) {
      dict[@"mentionInfo"] = [self convertMentionInfoToDictionary:message.mentionInfo];
  }
  
  // 添加本地属性
  dict[@"localAttribute"] = message.localAttribute ?: @"";
  
  // 添加是否删除
  dict[@"isDelete"] = @(message.isDeleted);
  
  // 添加是否编辑
  dict[@"isEdit"] = @(message.isEdit);

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
    dict[@"type"] = fileMsg.type ?: @"";
    dict[@"extra"] = fileMsg.extra ?: @"";
  } else if ([content isKindOfClass:[JVoiceMessage class]]) {
    JVoiceMessage *voiceMsg = (JVoiceMessage *)content;
    dict[@"url"] = voiceMsg.url ?: @"";
    dict[@"localPath"] = voiceMsg.localPath ?: @"";
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
 * 将@消息信息转换为字典
 */
- (NSDictionary *)convertMentionInfoToDictionary:(JMessageMentionInfo *)mentionInfo {
    NSMutableDictionary *map = [NSMutableDictionary dictionary];
    map[@"type"] = @(mentionInfo.type);
    
    NSMutableArray *userArray = [NSMutableArray array];
    for (JUserInfo *userInfo in mentionInfo.targetUsers) {
        [userArray addObject:[self convertUserInfoToDictionary:userInfo]];
    }
    map[@"targetUsers"] = userArray;
    
    return map;
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
  dict[@"unreadCount"] = @(info.unreadCount); 
  dict[@"topTime"] = @(info.topTime);
  dict[@"sortTime"] = @(info.sortTime);
  dict[@"isTop"] = @(info.isTop);
  dict[@"isMute"] = @(info.mute);
  dict[@"hasUnread"] = @(info.hasUnread);
  dict[@"draft"] = info.draft ?: @"";
  if (info.lastMessage) {
    dict[@"lastMessage"] = [self convertMessageToDictionary:info.lastMessage];
  }
  if (info.mentionInfo) { 
    dict[@"mentionInfo"] = [self convertConversationMentionInfoToDictionary:info.mentionInfo];
  }
  return dict;
}

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


#pragma mark - Conversation Methods

/**
 * 获取会话列表
 */
RCT_EXPORT_METHOD(getConversationInfoList:(int)count 
                                timestamp:(double)timestamp
                                pullDirection:(int)pullDirection 
                                resolver:(RCTPromiseResolveBlock)resolve 
                                rejecter:(RCTPromiseRejectBlock)reject) {
  JPullDirection direction = 0 == pullDirection ? JPullDirectionNewer : JPullDirectionOlder;
  
  NSArray<JConversationInfo *> *conversationInfos = [JIM.shared.conversationManager 
                                                    getConversationInfoListByCount:count 
                                                    timestamp:timestamp 
                                                    direction:direction];
  
  NSMutableArray *result = [NSMutableArray array];
  for (JConversationInfo *info in conversationInfos) {
    [result addObject:[self convertConversationInfoToDictionary:info]];
  }
  
  resolve(result);
}

/**
 * 获取单个会话信息
 */
RCT_EXPORT_METHOD(getConversationInfo:(NSDictionary *)conversationMap 
                            resolver:(RCTPromiseResolveBlock)resolve 
                            rejecter:(RCTPromiseRejectBlock)reject) {
  JConversation *conversation = [self convertDictionaryToConversation:conversationMap];
  
  JConversationInfo *info = [JIM.shared.conversationManager getConversationInfo:conversation];
  
  if (info) {
    resolve([self convertConversationInfoToDictionary:info]);
  } else {
    resolve([NSNull null]);
  }
}

/**
 * 创建会话信息
 */
RCT_EXPORT_METHOD(createConversationInfo:(NSDictionary *)conversationMap 
                                resolver:(RCTPromiseResolveBlock)resolve 
                                rejecter:(RCTPromiseRejectBlock)reject) {
  JConversation *conversation = [self convertDictionaryToConversation:conversationMap];
  
  [JIM.shared.conversationManager createConversationInfo:conversation 
                                                  success:^(JConversationInfo *info) {
    resolve([self convertConversationInfoToDictionary:info]);
  } error:^(JErrorCode code) {
    reject(@"error", [NSString stringWithFormat:@"Error code: %ld", (long)code], nil);
  }];
}

/**
 * 删除会话信息
 */
RCT_EXPORT_METHOD(deleteConversationInfo:(NSDictionary *)conversationMap 
                                resolver:(RCTPromiseResolveBlock)resolve 
                                rejecter:(RCTPromiseRejectBlock)reject) {
  JConversation *conversation = [self convertDictionaryToConversation:conversationMap];
  
  [JIM.shared.conversationManager deleteConversationInfoBy:conversation 
                                                    success:^{
    resolve(@YES);
  } error:^(JErrorCode code) {
    reject(@"error", [NSString stringWithFormat:@"Error code: %ld", (long)code], nil);
  }];
}

/**
 * 设置会话免打扰状态
 */
RCT_EXPORT_METHOD(setMute:(NSDictionary *)conversationMap 
                   isMute:(BOOL)isMute 
                 resolver:(RCTPromiseResolveBlock)resolve 
                 rejecter:(RCTPromiseRejectBlock)reject) {
  JConversation *conversation = [self convertDictionaryToConversation:conversationMap];
  
  [JIM.shared.conversationManager setMute:isMute 
                              conversation:conversation 
                                   success:^{
    resolve(@YES);
  } error:^(JErrorCode code) {
    reject(@"error", [NSString stringWithFormat:@"Error code: %ld", (long)code], nil);
  }];
}

/**
 * 设置会话置顶状态
 */
RCT_EXPORT_METHOD(setTop:(NSDictionary *)conversationMap 
                   isTop:(BOOL)isTop 
                resolver:(RCTPromiseResolveBlock)resolve 
                rejecter:(RCTPromiseRejectBlock)reject) {
  JConversation *conversation = [self convertDictionaryToConversation:conversationMap];
  
  [JIM.shared.conversationManager setTop:isTop 
                             conversation:conversation 
                                  success:^{
    resolve(@YES);
  } error:^(JErrorCode code) {
    reject(@"error", [NSString stringWithFormat:@"Error code: %ld", (long)code], nil);
  }];
}

/**
 * 清除会话未读数
 */
RCT_EXPORT_METHOD(clearUnreadCount:(NSDictionary *)conversationMap 
                          resolver:(RCTPromiseResolveBlock)resolve 
                          rejecter:(RCTPromiseRejectBlock)reject) {
  JConversation *conversation = [self convertDictionaryToConversation:conversationMap];
  
  [JIM.shared.conversationManager clearUnreadCountByConversation:conversation 
                                                          success:^{
    resolve(@YES);
  } error:^(JErrorCode code) {
    reject(@"error", [NSString stringWithFormat:@"Error code: %ld", (long)code], nil);
  }];
}

/**
 * 清除总未读数
 */
RCT_EXPORT_METHOD(clearTotalUnreadCount:(RCTPromiseResolveBlock)resolve 
                               rejecter:(RCTPromiseRejectBlock)reject) {
  [JIM.shared.conversationManager clearTotalUnreadCount:^{
    resolve(@YES);
  } error:^(JErrorCode code) {
    reject(@"error", [NSString stringWithFormat:@"Error code: %ld", (long)code], nil);
  }];
}

/**
 * 获取总未读数
 */
RCT_EXPORT_METHOD(getTotalUnreadCount:(RCTPromiseResolveBlock)resolve 
                             rejecter:(RCTPromiseRejectBlock)reject) {
  int count = [JIM.shared.conversationManager getTotalUnreadCount];
  resolve(@(count));
}

/**
 * 设置会话草稿
 */
RCT_EXPORT_METHOD(setDraft:(NSDictionary *)conversationMap 
                     draft:(NSString *)draft 
                  resolver:(RCTPromiseResolveBlock)resolve 
                  rejecter:(RCTPromiseRejectBlock)reject) {
  JConversation *conversation = [self convertDictionaryToConversation:conversationMap];
  
  [JIM.shared.conversationManager setDraft:draft inConversation:conversation];
  resolve(@YES);
}

/**
 * 清除会话草稿
 */
RCT_EXPORT_METHOD(clearDraft:(NSDictionary *)conversationMap 
                     resolver:(RCTPromiseResolveBlock)resolve 
                     rejecter:(RCTPromiseRejectBlock)reject) {
  JConversation *conversation = [self convertDictionaryToConversation:conversationMap];
  
  [JIM.shared.conversationManager clearDraftInConversation:conversation];
  resolve(@YES);
}

/**
 * 标记会话未读
 */
RCT_EXPORT_METHOD(setUnread:(NSDictionary *)conversationMap 
                    resolver:(RCTPromiseResolveBlock)resolve 
                    rejecter:(RCTPromiseRejectBlock)reject) {
  JConversation *conversation = [self convertDictionaryToConversation:conversationMap];
  
  [JIM.shared.conversationManager setUnread:conversation 
                                     success:^{
    resolve(@YES);
  } error:^(JErrorCode code) {
    reject(@"error", [NSString stringWithFormat:@"Error code: %ld", (long)code], nil);
  }];
}

/**
 * 获取置顶会话列表
 */
RCT_EXPORT_METHOD(getTopConversationInfoList:(int)count 
                                   timestamp:(long long)timestamp 
                               pullDirection:(NSString *)pullDirection 
                                    resolver:(RCTPromiseResolveBlock)resolve 
                                    rejecter:(RCTPromiseRejectBlock)reject) {
  JPullDirection direction = [@"up" isEqualToString:pullDirection] ? JPullDirectionNewer : JPullDirectionOlder;
  
  NSArray<JConversationInfo *> *conversationInfos = [JIM.shared.conversationManager 
                                                    getTopConversationInfoListByCount:count 
                                                    timestamp:timestamp 
                                                    direction:direction];
  
  NSMutableArray *result = [NSMutableArray array];
  for (JConversationInfo *info in conversationInfos) {
    [result addObject:[self convertConversationInfoToDictionary:info]];
  }
  
  resolve(result);
}

/**
 * 获取指定类型未读数
 */
RCT_EXPORT_METHOD(getUnreadCountWithTypes:(NSArray<NSNumber *> *)conversationTypes 
                                 resolver:(RCTPromiseResolveBlock)resolve 
                                 rejecter:(RCTPromiseRejectBlock)reject) {
  int count = [JIM.shared.conversationManager getUnreadCountWithTypes:conversationTypes];
  resolve(@(count));
}

#pragma mark - Conversation Tag Methods

/**
 * 向标签添加会话
 */
RCT_EXPORT_METHOD(addConversationsToTag:(NSArray *)conversationMaps 
                                  tagId:(NSString *)tagId 
                               resolver:(RCTPromiseResolveBlock)resolve 
                               rejecter:(RCTPromiseRejectBlock)reject) {
  NSMutableArray<JConversation *> *conversations = [NSMutableArray array];
  for (NSDictionary *conversationMap in conversationMaps) {
    [conversations addObject:[self convertDictionaryToConversation:conversationMap]];
  }
  
  [JIM.shared.conversationManager addConversationList:conversations 
                                                toTag:tagId 
                                              success:^{
    resolve(@YES);
  } error:^(JErrorCode code) {
    reject(@"error", [NSString stringWithFormat:@"Error code: %ld", (long)code], nil);
  }];
}

/**
 * 从标签移除会话
 */
RCT_EXPORT_METHOD(removeConversationsFromTag:(NSArray *)conversationMaps 
                                       tagId:(NSString *)tagId 
                                    resolver:(RCTPromiseResolveBlock)resolve 
                                    rejecter:(RCTPromiseRejectBlock)reject) {
  NSMutableArray<JConversation *> *conversations = [NSMutableArray array];
  for (NSDictionary *conversationMap in conversationMaps) {
    [conversations addObject:[self convertDictionaryToConversation:conversationMap]];
  }
  
  [JIM.shared.conversationManager removeConversationList:conversations 
                                                  fromTag:tagId 
                                                  success:^{
    resolve(@YES);
  } error:^(JErrorCode code) {
    reject(@"error", [NSString stringWithFormat:@"Error code: %ld", (long)code], nil);
  }];
}

#pragma mark - Helper Methods

/**
 * 将字典转换为会话对象
 */
- (JConversation *)convertDictionaryToConversation:(NSDictionary *)dict {
  JConversationType type = (JConversationType)[dict[@"conversationType"] intValue];
  NSString *conversationId = dict[@"conversationId"];
  return [[JConversation alloc] initWithConversationType:type conversationId:conversationId];
}

/**
 * 发送消息
 */
RCT_EXPORT_METHOD(sendMessage:(NSDictionary *)messageDict
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
    @try {
        // 构建消息内容和会话对象
        JMessageContent *content = [self convertDictToMessageContent:[messageDict objectForKey:@"content"]];
        JConversation *conversation = [self convertDictionaryToConversation:messageDict];
        
        if (!content) {
            reject(@"SEND_MESSAGE_ERROR", @"无效的消息内容", nil);
            return;
        }
        
        // 发送消息
        JMessage *message = [JIM.shared.messageManager sendMessage:content
                                                    inConversation:conversation
                                                           success:^(JMessage *sentMessage) {
            NSDictionary *result = [self convertMessageToDictionary:sentMessage];
            resolve(result);
        } error:^(JErrorCode errorCode, JMessage *message) {
            NSMutableDictionary *error = [NSMutableDictionary dictionary];
            if (message) {
                error[@"tid"] = @(message.clientMsgNo).stringValue;
            }
            error[@"errorCode"] = @(errorCode);
            reject(@"SEND_MESSAGE_ERROR", @"发送消息失败", [NSError errorWithDomain:@"JuggleIM" code:errorCode userInfo:error]);
        }];
    } @catch (NSException *exception) {
        reject(@"SEND_MESSAGE_ERROR", exception.reason, nil);
    }
}

/**
 * 获取历史消息
 */
RCT_EXPORT_METHOD(getMessages:(NSDictionary *)conversationDict
                  direction:(int)direction
                  options:(NSDictionary *)options
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
    @try {
        JConversation *conversation = [self convertDictionaryToConversation:conversationDict];
        JGetMessageOptions *getOptions = [[JGetMessageOptions alloc] init];
        
        if (options[@"count"]) {
            getOptions.count = [options[@"count"] integerValue];
        }
        if (options[@"startTime"]) {
            getOptions.startTime = [options[@"startTime"] longLongValue];
        }
        
        JPullDirection pullDirection = direction == 0 ? JPullDirectionOlder : JPullDirectionNewer;
        
        [JIM.shared.messageManager getMessages:conversation
                                     direction:pullDirection
                                        option:getOptions
                                      complete:^(NSArray<JMessage *> *messages, long long timestamp, BOOL hasMore, JErrorCode code) {
            NSMutableArray *messageArray = [NSMutableArray array];
            for (JMessage *msg in messages) {
                [messageArray addObject:[self convertMessageToDictionary:msg]];
            }
            NSLog(@"getMessages complete: %lu messages, timestamp: %lld, hasMore: %d, code: %ld",
                  (unsigned long)messages.count, timestamp, hasMore, (long)code);
            NSDictionary *result = @{
                @"messages": messageArray,
                @"timestamp": @(timestamp),
                @"hasMore": @(hasMore),
                @"code": @(code)
            };
            
            resolve(result);
        }];
    } @catch (NSException *exception) {
        reject(@"GET_MESSAGES_ERROR", exception.reason, nil);
    }
}

/**
 * 撤回消息
 */
RCT_EXPORT_METHOD(recallMessage:(NSDictionary *)messageDict
                  extras:(NSDictionary *)extras
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
    @try {
        NSString *messageId = messageDict[@"messageId"];
        NSDictionary *extrasDict = extras ?: @{};
        
        [JIM.shared.messageManager recallMessage:messageId
                                           extras:extrasDict
                                          success:^(JMessage *message){
            resolve(@YES);
        } error:^(JErrorCode errorCode) {
            reject(@"RECALL_MESSAGE_ERROR", @"撤回消息失败", [NSError errorWithDomain:@"JuggleIM" code:errorCode userInfo:nil]);
        }];
    } @catch (NSException *exception) {
        reject(@"RECALL_MESSAGE_ERROR", exception.reason, nil);
    }
}

/**
 * 添加消息反应
 */
RCT_EXPORT_METHOD(addMessageReaction:(NSDictionary *)messageDict
                  reactionId:(NSString *)reactionId
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
    @try {
        NSString *messageId = messageDict[@"messageId"];
        JConversation *conversation = [self convertDictionaryToConversation:messageDict];
        
        [JIM.shared.messageManager addMessageReaction:messageId
                                         conversation:conversation
                                            reactionId:reactionId
                                               success:^{
            resolve(@YES);
        } error:^(JErrorCode errorCode) {
            reject(@"ADD_REACTION_ERROR", @"添加反应失败", [NSError errorWithDomain:@"JuggleIM" code:errorCode userInfo:nil]);
        }];
    } @catch (NSException *exception) {
        reject(@"ADD_REACTION_ERROR", exception.reason, nil);
    }
}

/**
 * 移除消息反应
 */
RCT_EXPORT_METHOD(removeMessageReaction:(NSDictionary *)messageDict
                  reactionId:(NSString *)reactionId
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
    @try {
        NSString *messageId = messageDict[@"messageId"];
        JConversation *conversation = [self convertDictionaryToConversation:messageDict];
        
        [JIM.shared.messageManager removeMessageReaction:messageId
                                            conversation:conversation
                                              reactionId:reactionId
                                                 success:^{
            resolve(@YES);
        } error:^(JErrorCode errorCode) {
            reject(@"REMOVE_REACTION_ERROR", @"移除反应失败", [NSError errorWithDomain:@"JuggleIM" code:errorCode userInfo:nil]);
        }];
    } @catch (NSException *exception) {
        reject(@"REMOVE_REACTION_ERROR", exception.reason, nil);
    }
}

// 辅助方法：将字典转换为消息内容
- (JMessageContent *)convertDictToMessageContent:(NSDictionary *)messageDict {
    NSString *contentType = messageDict[@"contentType"];
    
    if ([contentType isEqualToString:@"jg:text"]) {
        JTextMessage *text = [[JTextMessage alloc] initWithContent:messageDict[@"content"] ?: @""];
        return text;
    } else if ([contentType isEqualToString:@"jg:image"]) {
        JImageMessage *img = [[JImageMessage alloc] init];
        img.url = messageDict[@"url"];
        img.localPath = messageDict[@"localPath"];
        img.thumbnailLocalPath = messageDict[@"thumbnailLocalPath"];
        img.thumbnailUrl = messageDict[@"thumbnailUrl"];
        img.width = [messageDict[@"width"] integerValue];
        img.height = [messageDict[@"height"] integerValue];
        return img;
    } else if ([contentType isEqualToString:@"jg:file"]) {
        JFileMessage *file = [[JFileMessage alloc] init];
        file.url = messageDict[@"url"];
        file.type = messageDict[@"type"];
        file.name = messageDict[@"name"];
        file.size = [messageDict[@"size"] longLongValue];
        return file;
    } else if ([contentType isEqualToString:@"jg:voice"]) {
        JVoiceMessage *voice = [[JVoiceMessage alloc] init];
        voice.url = messageDict[@"url"];
        voice.localPath = messageDict[@"localPath"];
        voice.duration = [messageDict[@"duration"] integerValue];
        return voice;
    }
    
    return nil;
}
@end
