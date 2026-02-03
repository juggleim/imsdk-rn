#import "JuggleIMManager.h"
#import <JuggleIM/JuggleIM.h>
#import <React/RCTEventEmitter.h>

/**
 * Juggle IM React Native iOS 模块
 */
@interface JuggleIMManager () <JConnectionDelegate, JMessageDelegate,
                               JMessageReadReceiptDelegate,
                               JMessageDestroyDelegate, JConversationDelegate,
                               JStreamMessageDelegate>

// 自定义消息类型注册表
@property(nonatomic, strong) NSMutableDictionary *customMessageTypes;

@end

@implementation JuggleIMManager

- (instancetype)init {
  if (self = [super init]) {
    _customMessageTypes = [NSMutableDictionary dictionary];
  }
  return self;
}

RCT_EXPORT_MODULE(JuggleIM);

RCT_EXPORT_METHOD(setServerUrls : (NSArray *)urls) {
  [[JIM shared] setServerUrls:urls];
}

RCT_EXPORT_METHOD(initWithAppKey : (NSString *)appKey) {
  [[JIM shared] initWithAppKey:appKey];
  [JIM.shared setConsoleLogLevel:JLogLevelVerbose];
}

/**
 * 注册自定义消息类型
 */
RCT_EXPORT_METHOD(registerCustomMessageType : (NSString *)contentType) {
  if ([contentType hasPrefix:@"jg:"]) {
    NSLog(@"contentType 不能以 'jg:' 开头");
    return;
  }
  self.customMessageTypes[contentType] = contentType;
  NSLog(@"注册自定义消息类型: %@", contentType);
}

RCT_EXPORT_METHOD(connectWithToken : (NSString *)token) {
  [JIM.shared.connectionManager connectWithToken:token];
}

RCT_EXPORT_METHOD(disconnect : (BOOL)pushable) {
  [JIM.shared.connectionManager disconnect:pushable];
}

- (NSArray<NSString *> *)supportedEvents {
  return @[
    @"ConnectionStatusChanged",
    @"DbDidOpen",
    @"DbDidClose",
    @"MessageReceived",
    @"MessageRecalled",
    @"MessageUpdated",
    @"MessageDeleted",
    @"MessageCleared",
    @"MessageReactionAdded",
    @"MessageReactionRemoved",
    @"MessageSetTop",
    @"MessagesRead",
    @"GroupMessagesRead",
    @"MessageDestroyTimeUpdated",
    @"ConversationInfoAdded",
    @"ConversationInfoUpdated",
    @"ConversationInfoDeleted",
    @"TotalUnreadMessageCountUpdated",
    @"onMessageSent",
    @"onMessageSentError",
    @"onMediaMessageProgress",
    @"onMediaMessageSent",
    @"onMediaMessageSentError",
    @"onMediaMessageCancelled",
    @"StreamTextMessageAppend",
    @"StreamTextMessageComplete"
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
 * 添加流式消息监听器
 */
RCT_EXPORT_METHOD(addStreamMessageDelegate) {
  [JIM.shared.messageManager addStreamMessageDelegate:self];
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

#pragma mark - JStreamMessageDelegate

/**
 * 流式消息分片追加的回调
 */
- (void)streamTextMessageDidAppend:(NSString *)messageId
                           content:(NSString *)content {
  [self sendEventWithName:@"StreamTextMessageAppend"
                     body:@{
                       @"messageId" : messageId,
                       @"content" : content
                     }];
}

/**
 * 流式消息完成的回调
 */
- (void)streamTextMessageDidComplete:(JMessage *)message {
  [self sendEventWithName:@"StreamTextMessageComplete"
                     body:@{
                       @"message" : [self convertMessageToDictionary:message]
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
  dict[@"clientMsgNo"] =
      [NSString stringWithFormat:@"%lld", message.clientMsgNo];
  dict[@"timestamp"] = @(message.timestamp);
  dict[@"senderUserId"] = message.senderUserId ?: @"";
  dict[@"conversation"] =
      [self convertConversationToDictionary:message.conversation];
  NSDictionary *contentDic =
      [self convertMessageContentToDictionary:message.content
                                         type:message.contentType];
  dict[@"content"] = contentDic;
  dict[@"direction"] = @(message.direction);
  dict[@"messageState"] = @(message.messageState);
  dict[@"contentType"] = message.contentType;

  // 添加是否已读
  dict[@"hasRead"] = @(message.hasRead);
  dict[@"isEdit"] = @(message.isEdit);
  dict[@"isDeleted"] = @(message.isDeleted);

  // 添加群消息阅读信息
  if (message.groupReadInfo) {
    dict[@"groupMessageReadInfo"] =
        [self convertGroupMessageReadInfoToDictionary:message.groupReadInfo];
  }

  // 添加引用消息
  if (message.referredMsg) {
    dict[@"referredMessage"] =
        [self convertMessageToDictionary:message.referredMsg];
  }

  // 添加@消息信息
  if (message.mentionInfo) {
    dict[@"mentionInfo"] =
        [self convertMentionInfoToDictionary:message.mentionInfo];
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
- (NSDictionary *)convertMessageContentToDictionary:(JMessageContent *)content
                                               type:(NSString *)contentType {
  NSMutableDictionary *dict = [NSMutableDictionary dictionary];
  NSString *ct = [[content class] contentType];
  dict[@"contentType"] = ct ?: @"";

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
  } else if ([content isKindOfClass:[JStreamTextMessage class]]) {
    JStreamTextMessage *streamMsg = (JStreamTextMessage *)content;
    dict[@"content"] = streamMsg.content ?: @"";
    dict[@"isFinished"] = @(streamMsg.isFinished);
  } else if ([content isKindOfClass:[JMergeMessage class]]) {
    JMergeMessage *mergeMsg = (JMergeMessage *)content;
    dict[@"title"] = mergeMsg.title ?: @"";
    dict[@"conversation"] = mergeMsg.conversation;
    dict[@"messageIdList"] = mergeMsg.messageIdList;
    dict[@"previewList"] = mergeMsg.previewList;
    dict[@"containerMsgId"] = mergeMsg.containerMsgId;
    dict[@"extra"] = mergeMsg.extra ?: @"";
  } else if ([contentType isEqualToString:@"jg:callfinishntf"]) {
    JCallFinishNotifyMessage *callFinishMsg = (JCallFinishNotifyMessage *)content;
    dict[@"reason"] = @(callFinishMsg.finishType);
    dict[@"duration"] = @(callFinishMsg.duration);
    dict[@"media_type"] = @(callFinishMsg.mediaType);
  } else if (self.customMessageTypes[contentType]) {
    // 处理自定义消息:解析 JSON 数据
    JUnknownMessage *customMsg = (JUnknownMessage *)content;
    NSData *data = [customMsg encode];
    if (data) {
      NSError *error = nil;
      NSDictionary *jsonDict = [NSJSONSerialization JSONObjectWithData:data
                                                               options:0
                                                                 error:&error];
      if (!error && jsonDict) {
        dict = [jsonDict mutableCopy];
      } else {
        NSLog(@"解析自定义消息失败: %@", error.localizedDescription);
      }
    }
  } else {
    NSLog(@"Unknown contentType: %@", contentType);
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
    @"nickname" : userInfo.userName ?: @"",
    @"avatar" : userInfo.portrait ?: @"",
    @"extra" : userInfo.extraDic ?: @{},
    @"type" : @(userInfo.type),
    @"updatedTime" : @(userInfo.updatedTime)
  };
}

/**
 * 将群组信息转换为字典
 */
- (NSDictionary *)convertGroupInfoToDictionary:(JGroupInfo *)groupInfo {
  return @{
    @"groupId" : groupInfo.groupId ?: @"",
    @"groupName" : groupInfo.groupName ?: @"",
    @"portrait" : groupInfo.portrait ?: @"",
    @"extra" : groupInfo.extraDic ?: @{},
    @"updatedTime" : @(groupInfo.updatedTime)
  };
}

/**
 * 将群成员信息转换为字典
 */
- (NSDictionary *)convertGroupMemberToDictionary:(JGroupMember *)groupMember {
  return @{
    @"groupId" : groupMember.groupId ?: @"",
    @"userId" : groupMember.userId ?: @"",
    @"groupDisplayName" : groupMember.groupDisplayName ?: @"",
    @"extra" : groupMember.extraDic ?: @{},
    @"updatedTime" : @(groupMember.updatedTime)
  };
}

/**
 * 将@消息信息转换为字典
 */
- (NSDictionary *)convertMentionInfoToDictionary:
    (JMessageMentionInfo *)mentionInfo {
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
- (NSDictionary *)convertConversationInfoToDictionary:
    (JConversationInfo *)info {
  NSMutableDictionary *dict = [NSMutableDictionary dictionary];
  dict[@"conversation"] =
      [self convertConversationToDictionary:info.conversation];
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
    dict[@"mentionInfo"] =
        [self convertConversationMentionInfoToDictionary:info.mentionInfo];
  }
  return dict;
}

- (NSDictionary *)convertConversationMentionInfoToDictionary:
    (JConversationMentionInfo *)mentionInfo {
  NSMutableDictionary *dict = [NSMutableDictionary dictionary];
  if (mentionInfo.mentionMsgList) {
    NSMutableArray *mentionMsgArray = [NSMutableArray array];
    for (JConversationMentionMessage *mentionMsg in mentionInfo
             .mentionMsgList) {
      NSDictionary *msgDict = @{
        @"senderId" : mentionMsg.senderId ?: @"",
        @"msgId" : mentionMsg.msgId ?: @"",
        @"msgTime" : @(mentionMsg.msgTime),
        @"type" : @(mentionMsg.type)
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
RCT_EXPORT_METHOD(getConversationInfoList : (int)count timestamp : (double)
                      timestamp pullDirection : (int)pullDirection resolver : (
                          RCTPromiseResolveBlock)
                          resolve rejecter : (RCTPromiseRejectBlock)reject) {
  JPullDirection direction =
      0 == pullDirection ? JPullDirectionNewer : JPullDirectionOlder;

  NSArray<JConversationInfo *> *conversationInfos =
      [JIM.shared.conversationManager getConversationInfoListByCount:count
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
RCT_EXPORT_METHOD(getConversationInfo : (NSDictionary *)
                      conversationMap resolver : (RCTPromiseResolveBlock)
                          resolve rejecter : (RCTPromiseRejectBlock)reject) {
  JConversation *conversation =
      [self convertDictionaryToConversation:conversationMap];

  JConversationInfo *info =
      [JIM.shared.conversationManager getConversationInfo:conversation];

  if (info) {
    resolve([self convertConversationInfoToDictionary:info]);
  } else {
    resolve([NSNull null]);
  }
}

RCT_EXPORT_METHOD(getUserInfo : (NSString *)userId resolver : (
    RCTPromiseResolveBlock)resolve rejecter : (RCTPromiseRejectBlock)reject) {
  JUserInfo *userInfo = [JIM.shared.userInfoManager getUserInfo:userId];
  if (userInfo) {
    resolve([self convertUserInfoToDictionary:userInfo]);
  } else {
    resolve([NSNull null]);
  }
}

RCT_EXPORT_METHOD(getGroupInfo : (NSString *)groupId resolver : (
    RCTPromiseResolveBlock)resolve rejecter : (RCTPromiseRejectBlock)reject) {
  JGroupInfo *groupInfo = [JIM.shared.userInfoManager getGroupInfo:groupId];
  if (groupInfo) {
    resolve([self convertGroupInfoToDictionary:groupInfo]);
  } else {
    resolve([NSNull null]);
  }
}

RCT_EXPORT_METHOD(getGroupMember : (NSString *)groupId userId : (NSString *)
                      userId resolver : (RCTPromiseResolveBlock)
                          resolve rejecter : (RCTPromiseRejectBlock)reject) {
  JGroupMember *groupMember =
      [JIM.shared.userInfoManager getGroupMember:groupId userId:userId];
  if (groupMember) {
    resolve([self convertGroupMemberToDictionary:groupMember]);
  } else {
    resolve([NSNull null]);
  }
}

/**
 * 上传图片
 */
RCT_EXPORT_METHOD(uploadImage : (NSString *)localPath resolver : (
    RCTPromiseResolveBlock)resolve rejecter : (RCTPromiseRejectBlock)reject) {
  NSString *path = localPath;
  if ([path hasPrefix:@"file://"]) {
    path = [path substringFromIndex:7];
  }

  UIImage *image = [UIImage imageWithContentsOfFile:path];
  if (!image) {
    reject(@"-1", @"Image decode failed", nil);
    return;
  }

  [JIM.shared.messageManager uploadImage:image
      success:^(NSString *url) {
        resolve(url);
      }
      error:^(JErrorCode code) {
        reject([NSString stringWithFormat:@"%ld", (long)code], @"Upload failed",
               nil);
      }];
}

/**
 * 创建会话信息
 */
RCT_EXPORT_METHOD(createConversationInfo : (NSDictionary *)
                      conversationMap resolver : (RCTPromiseResolveBlock)
                          resolve rejecter : (RCTPromiseRejectBlock)reject) {
  JConversation *conversation =
      [self convertDictionaryToConversation:conversationMap];

  [JIM.shared.conversationManager createConversationInfo:conversation
      success:^(JConversationInfo *info) {
        resolve([self convertConversationInfoToDictionary:info]);
      }
      error:^(JErrorCode code) {
        reject(@"error",
               [NSString stringWithFormat:@"Error code: %ld", (long)code], nil);
      }];
}

/**
 * 删除会话信息
 */
RCT_EXPORT_METHOD(deleteConversationInfo : (NSDictionary *)
                      conversationMap resolver : (RCTPromiseResolveBlock)
                          resolve rejecter : (RCTPromiseRejectBlock)reject) {
  JConversation *conversation =
      [self convertDictionaryToConversation:conversationMap];

  [JIM.shared.conversationManager deleteConversationInfoBy:conversation
      success:^{
        resolve(@YES);
      }
      error:^(JErrorCode code) {
        reject(@"error",
               [NSString stringWithFormat:@"Error code: %ld", (long)code], nil);
      }];
}

/**
 * 设置会话免打扰状态
 */
RCT_EXPORT_METHOD(setMute : (NSDictionary *)conversationMap isMute : (BOOL)
                      isMute resolver : (RCTPromiseResolveBlock)
                          resolve rejecter : (RCTPromiseRejectBlock)reject) {
  JConversation *conversation =
      [self convertDictionaryToConversation:conversationMap];

  [JIM.shared.conversationManager setMute:isMute
      conversation:conversation
      success:^{
        resolve(@YES);
      }
      error:^(JErrorCode code) {
        reject(@"error",
               [NSString stringWithFormat:@"Error code: %ld", (long)code], nil);
      }];
}

/**
 * 设置会话置顶状态
 */
RCT_EXPORT_METHOD(setTop : (NSDictionary *)conversationMap isTop : (BOOL)
                      isTop resolver : (RCTPromiseResolveBlock)
                          resolve rejecter : (RCTPromiseRejectBlock)reject) {
  JConversation *conversation =
      [self convertDictionaryToConversation:conversationMap];

  [JIM.shared.conversationManager setTop:isTop
      conversation:conversation
      success:^{
        resolve(@YES);
      }
      error:^(JErrorCode code) {
        reject(@"error",
               [NSString stringWithFormat:@"Error code: %ld", (long)code], nil);
      }];
}

/**
 * 清除会话未读数
 */
RCT_EXPORT_METHOD(clearUnreadCount : (NSDictionary *)
                      conversationMap resolver : (RCTPromiseResolveBlock)
                          resolve rejecter : (RCTPromiseRejectBlock)reject) {
  JConversation *conversation =
      [self convertDictionaryToConversation:conversationMap];

  [JIM.shared.conversationManager clearUnreadCountByConversation:conversation
      success:^{
        resolve(@YES);
      }
      error:^(JErrorCode code) {
        reject(@"error",
               [NSString stringWithFormat:@"Error code: %ld", (long)code], nil);
      }];
}

/**
 * 清除总未读数
 */
RCT_EXPORT_METHOD(clearTotalUnreadCount : (RCTPromiseResolveBlock)
                      resolve rejecter : (RCTPromiseRejectBlock)reject) {
  [JIM.shared.conversationManager
      clearTotalUnreadCount:^{
        resolve(@YES);
      }
      error:^(JErrorCode code) {
        reject(@"error",
               [NSString stringWithFormat:@"Error code: %ld", (long)code], nil);
      }];
}

/**
 * 获取总未读数
 */
RCT_EXPORT_METHOD(getTotalUnreadCount : (RCTPromiseResolveBlock)
                      resolve rejecter : (RCTPromiseRejectBlock)reject) {
  int count = [JIM.shared.conversationManager getTotalUnreadCount];
  resolve(@(count));
}

/**
 * 设置会话草稿
 */
RCT_EXPORT_METHOD(setDraft : (NSDictionary *)conversationMap draft : (
    NSString *)draft resolver : (RCTPromiseResolveBlock)
                      resolve rejecter : (RCTPromiseRejectBlock)reject) {
  JConversation *conversation =
      [self convertDictionaryToConversation:conversationMap];

  [JIM.shared.conversationManager setDraft:draft inConversation:conversation];
  resolve(@YES);
}

/**
 * 清除会话草稿
 */
RCT_EXPORT_METHOD(clearDraft : (NSDictionary *)conversationMap resolver : (
    RCTPromiseResolveBlock)resolve rejecter : (RCTPromiseRejectBlock)reject) {
  JConversation *conversation =
      [self convertDictionaryToConversation:conversationMap];

  [JIM.shared.conversationManager clearDraftInConversation:conversation];
  resolve(@YES);
}

/**
 * 标记会话未读
 */
RCT_EXPORT_METHOD(setUnread : (NSDictionary *)conversationMap resolver : (
    RCTPromiseResolveBlock)resolve rejecter : (RCTPromiseRejectBlock)reject) {
  JConversation *conversation =
      [self convertDictionaryToConversation:conversationMap];

  [JIM.shared.conversationManager setUnread:conversation
      success:^{
        resolve(@YES);
      }
      error:^(JErrorCode code) {
        reject(@"error",
               [NSString stringWithFormat:@"Error code: %ld", (long)code], nil);
      }];
}

/**
 * 获取置顶会话列表
 */
RCT_EXPORT_METHOD(getTopConversationInfoList : (int)count timestamp : (double)
                      timestamp pullDirection : (int)pullDirection resolver : (
                          RCTPromiseResolveBlock)
                          resolve rejecter : (RCTPromiseRejectBlock)reject) {
  JPullDirection direction =
      pullDirection == 0 ? JPullDirectionNewer : JPullDirectionOlder;

  NSArray<JConversationInfo *> *conversationInfos =
      [JIM.shared.conversationManager
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
RCT_EXPORT_METHOD(getUnreadCountWithTypes : (NSArray<NSNumber *> *)
                      conversationTypes resolver : (RCTPromiseResolveBlock)
                          resolve rejecter : (RCTPromiseRejectBlock)reject) {
  int count = [JIM.shared.conversationManager
      getUnreadCountWithTypes:conversationTypes];
  resolve(@(count));
}

#pragma mark - Conversation Tag Methods

/**
 * 向标签添加会话
 */
RCT_EXPORT_METHOD(addConversationsToTag : (NSArray *)conversationMaps tagId : (
    NSString *)tagId resolver : (RCTPromiseResolveBlock)
                      resolve rejecter : (RCTPromiseRejectBlock)reject) {
  NSMutableArray<JConversation *> *conversations = [NSMutableArray array];
  for (NSDictionary *conversationMap in conversationMaps) {
    [conversations
        addObject:[self convertDictionaryToConversation:conversationMap]];
  }

  [JIM.shared.conversationManager addConversationList:conversations
      toTag:tagId
      success:^{
        resolve(@YES);
      }
      error:^(JErrorCode code) {
        reject(@"error",
               [NSString stringWithFormat:@"Error code: %ld", (long)code], nil);
      }];
}

/**
 * 从标签移除会话
 */
RCT_EXPORT_METHOD(removeConversationsFromTag : (NSArray *)
                      conversationMaps tagId : (NSString *)tagId resolver : (
                          RCTPromiseResolveBlock)
                          resolve rejecter : (RCTPromiseRejectBlock)reject) {
  NSMutableArray<JConversation *> *conversations = [NSMutableArray array];
  for (NSDictionary *conversationMap in conversationMaps) {
    [conversations
        addObject:[self convertDictionaryToConversation:conversationMap]];
  }

  [JIM.shared.conversationManager removeConversationList:conversations
      fromTag:tagId
      success:^{
        resolve(@YES);
      }
      error:^(JErrorCode code) {
        reject(@"error",
               [NSString stringWithFormat:@"Error code: %ld", (long)code], nil);
      }];
}

#pragma mark - Helper Methods

/**
 * 将字典转换为会话对象
 */
- (JConversation *)convertDictionaryToConversation:(NSDictionary *)dict {
  if (dict[@"conversation"]) {
    NSDictionary* conversationDict = dict[@"conversation"];
    JConversationType type =
        (JConversationType)[conversationDict[@"conversationType"] intValue];
    NSString *conversationId = conversationDict[@"conversationId"];
    return [[JConversation alloc] initWithConversationType:type
                                          conversationId:conversationId];
  } else {
    JConversationType type =
        (JConversationType)[dict[@"conversationType"] intValue];
    NSString *conversationId = dict[@"conversationId"];
    return [[JConversation alloc] initWithConversationType:type
                                          conversationId:conversationId];
  }
}

/**
 * 发送消息
 */
RCT_EXPORT_METHOD(sendMessage : (NSDictionary *)messageDict messageId : (
    NSString *)messageId resolver : (RCTPromiseResolveBlock)
                      resolve rejecter : (RCTPromiseRejectBlock)reject) {
  @try {
    JMessage *msg = [self convertDictToMessage:messageDict];
    if (!msg.content) {
      reject(@"SEND_MESSAGE_ERROR", @"无效的消息内容", nil);
      return;
    }

    JMessageOptions *options = [self getOptionsFromDictionary:messageDict];
    // 发送消息
    JMessage *message = [JIM.shared.messageManager sendMessage:msg.content
        messageOption:options
        inConversation:msg.conversation
        success:^(JMessage *message) {
          [self sendEventWithName:@"onMessageSent"
                             body:@{
                               @"messageId" : messageId,
                               @"message" :
                                   [self convertMessageToDictionary:message]
                             }];
        }
        error:^(JErrorCode errorCode, JMessage *message) {
          [self sendEventWithName:@"onMessageSentError"
                             body:@{
                               @"messageId" : messageId,
                               @"message" :
                                   [self convertMessageToDictionary:message],
                               @"errorCode" : @(errorCode)
                             }];
        }];
    NSMutableDictionary *result = [self convertMessageToDictionary:message];
    result[@"messageId"] = messageId;
    resolve(result);
  } @catch (NSException *exception) {
    reject(@"SEND_MESSAGE_ERROR", exception.reason, nil);
  }
}

/**
 * 保存消息到本地数据库
 */
RCT_EXPORT_METHOD(saveMessage : (NSDictionary *)messageDict resolver : (RCTPromiseResolveBlock)
                      resolve rejecter : (RCTPromiseRejectBlock)reject) {
  @try {
    // 获取会话
    NSDictionary *conversationDict = messageDict[@"conversation"];
    if (!conversationDict) {
      reject(@"SAVE_MESSAGE_ERROR", @"Conversation is required", nil);
      return;
    }
    JConversation *conversation = [self convertDictionaryToConversation:conversationDict];

    // 获取消息内容
    NSDictionary *contentDict = messageDict[@"content"];
    if (!contentDict) {
      reject(@"SAVE_MESSAGE_ERROR", @"Message content is required", nil);
      return;
    }
    JMessageContent *content = [self convertDictToMessageContent:contentDict];

    // 获取消息方向，默认为1（发送）
    NSInteger direction = 1; // Default: sent
    if (messageDict[@"direction"]) {
      direction = [messageDict[@"direction"] integerValue];
    }

    // 构建MessageOptions（可选）
    JMessageOptions *options = nil;
    if (messageDict[@"options"]) {
      NSDictionary *optionsDict = messageDict[@"options"];
      if (optionsDict) {
        options = [[JMessageOptions alloc] init];
        if (optionsDict[@"mentionInfo"]) {
          options.mentionInfo = [self convertDictToMessageMentionInfo:optionsDict[@"mentionInfo"]];
        }
        if (optionsDict[@"referredMessageId"]) {
          options.referredMsgId = optionsDict[@"referredMessageId"];
        }
        if (optionsDict[@"pushData"]) {
          options.pushData = [self convertDictToPushData:optionsDict[@"pushData"]];
        }
      }
    }

    // 调用原生SDK保存消息
    JMessage *savedMessage;
    if (options) {
      savedMessage = [JIM.shared.messageManager saveMessage:content
                                               messageOption:options
                                              inConversation:conversation
                                                   direction:(JMessageDirection)direction];
    } else {
      savedMessage = [JIM.shared.messageManager saveMessage:content
                                              inConversation:conversation
                                                   direction:(JMessageDirection)direction];
    }

    NSMutableDictionary *result = [self convertMessageToDictionary:savedMessage];
    resolve(result);
  } @catch (NSException *exception) {
    reject(@"SAVE_MESSAGE_ERROR", exception.reason, nil);
  }
}

/**
 * 搜索会话中的消息
 */
RCT_EXPORT_METHOD(searchMessage : (NSDictionary *)optionsDict resolver : (RCTPromiseResolveBlock)
                      resolve rejecter : (RCTPromiseRejectBlock)reject) {
  @try {
    NSDictionary *conversationDict = optionsDict[@"conversation"];
    if (!conversationDict) {
      reject(@"SEARCH_MESSAGE_ERROR", @"Conversation is required", nil);
      return;
    }
    JConversation *conversation = [self convertDictionaryToConversation:conversationDict];

    NSString *searchContent = optionsDict[@"searchContent"];
    if (!searchContent) {
      reject(@"SEARCH_MESSAGE_ERROR", @"Search content is required", nil);
      return;
    }

    int count = 20;
    if (optionsDict[@"count"]) {
      count = [optionsDict[@"count"] intValue];
    }

    long long time = 0;
    if (optionsDict[@"timestamp"]) {
      time = [optionsDict[@"timestamp"] longLongValue];
    }

    int directionInt = 1;
    if (optionsDict[@"direction"]) {
      directionInt = [optionsDict[@"direction"] intValue];
    }
    JPullDirection direction = (directionInt == 0) ? JPullDirectionNewer : JPullDirectionOlder;

    NSArray *contentTypes = nil;
    if (optionsDict[@"contentTypes"]) {
      contentTypes = optionsDict[@"contentTypes"];
    }

    NSArray *messages = [JIM.shared.messageManager searchMessagesWithContent:searchContent
                                                           inConversation:conversation
                                                                   count:count
                                                                    time:time
                                                               direction:direction
                                                            contentTypes:contentTypes];

    NSMutableArray *result = [NSMutableArray array];
    for (JMessage *message in messages) {
      [result addObject:[self convertMessageToDictionary:message]];
    }
    resolve(result);
  } @catch (NSException *exception) {
    reject(@"SEARCH_MESSAGE_ERROR", exception.reason, nil);
  }
}

/**
 * 根据消息内容搜索会话
 */
RCT_EXPORT_METHOD(searchConversationsWithMessageContent : (NSDictionary *)optionsDict resolver : (RCTPromiseResolveBlock)
                      resolve rejecter : (RCTPromiseRejectBlock)reject) {
  @try {
    NSString *searchContent = optionsDict[@"searchContent"];
    if (!searchContent) {
      reject(@"SEARCH_CONVERSATIONS_ERROR", @"Search content is required", nil);
      return;
    }

    JQueryMessageOptions *options = [[JQueryMessageOptions alloc] init];
    options.searchContent = searchContent;

    if (optionsDict[@"senderUserIds"]) {
      options.senderUserIds = optionsDict[@"senderUserIds"];
    }

    if (optionsDict[@"contentTypes"]) {
      options.contentTypes = optionsDict[@"contentTypes"];
    }

    if (optionsDict[@"conversations"]) {
      NSArray *conversationsArray = optionsDict[@"conversations"];
      NSMutableArray *conversations = [NSMutableArray array];
      for (NSDictionary *conversationDict in conversationsArray) {
        JConversation *conversation = [self convertDictionaryToConversation:conversationDict];
        [conversations addObject:conversation];
      }
      options.conversations = conversations;
    }

    if (optionsDict[@"states"]) {
      options.states = optionsDict[@"states"];
    }

    if (optionsDict[@"conversationTypes"]) {
      options.conversationTypes = optionsDict[@"conversationTypes"];
    }

    [JIM.shared.messageManager searchConversationsWithMessageContent:options
                                                           complete:^(NSArray<JSearchConversationsResult *> *resultList) {
      NSMutableArray *result = [NSMutableArray array];
      for (JSearchConversationsResult *searchResult in resultList) {
        NSMutableDictionary *resultMap = [NSMutableDictionary dictionary];
        resultMap[@"matchedCount"] = @(searchResult.matchedCount);
        resultMap[@"conversationInfo"] = [self convertConversationInfoToDictionary:searchResult.conversationInfo];
        [result addObject:resultMap];
      }
      resolve(result);
    }];
  } @catch (NSException *exception) {
    reject(@"SEARCH_CONVERSATIONS_ERROR", exception.reason, nil);
  }
}

/**
 * 发送图片消息
 */
RCT_EXPORT_METHOD(sendImageMessage : (NSDictionary *)messageDict messageId : (
    NSString *)messageId resolver : (RCTPromiseResolveBlock)
                      resolve rejecter : (RCTPromiseRejectBlock)reject) {
  @try {
    JConversation *conversation =
        [self convertDictionaryToConversation:messageDict];
    JImageMessage *imageMessage = [[JImageMessage alloc] init];

    NSDictionary *contentDict = messageDict[@"content"];
    if (contentDict[@"localPath"]) {
      imageMessage.localPath = contentDict[@"localPath"];
    }
    if (contentDict[@"thumbnailLocalPath"]) {
      imageMessage.thumbnailLocalPath = contentDict[@"thumbnailLocalPath"];
    }
    if (contentDict[@"url"]) {
      imageMessage.url = contentDict[@"url"];
    }
    if (contentDict[@"thumbnailUrl"]) {
      imageMessage.thumbnailUrl = contentDict[@"thumbnailUrl"];
    }
    if (contentDict[@"width"]) {
      imageMessage.width = [contentDict[@"width"] integerValue];
    }
    if (contentDict[@"height"]) {
      imageMessage.height = [contentDict[@"height"] integerValue];
    }

    JMessageOptions *options = [self getOptionsFromDictionary:messageDict];
    JMessage *message = [JIM.shared.messageManager sendMediaMessage:imageMessage
        messageOption:options
        inConversation:conversation
        progress:^(int progress, JMessage *_Nonnull message) {
          NSMutableDictionary *params = [NSMutableDictionary dictionary];
          params[@"messageId"] = messageId;
          params[@"progress"] = @(progress);
          params[@"message"] = [self convertMessageToDictionary:message];
          [self sendEventWithName:@"onMediaMessageProgress" body:params];
        }
        success:^(JMessage *_Nonnull message) {
          NSMutableDictionary *params = [NSMutableDictionary dictionary];
          params[@"messageId"] = messageId;
          params[@"message"] = [self convertMessageToDictionary:message];
          [self sendEventWithName:@"onMediaMessageSent" body:params];
        }
        error:^(JErrorCode errorCode, JMessage *_Nonnull message) {
          NSMutableDictionary *params = [NSMutableDictionary dictionary];
          params[@"messageId"] = messageId;
          params[@"message"] = [self convertMessageToDictionary:message];
          params[@"errorCode"] = @(errorCode);
          [self sendEventWithName:@"onMediaMessageSentError" body:params];
        }
        cancel:^(JMessage *_Nonnull message) {
          NSMutableDictionary *params = [NSMutableDictionary dictionary];
          params[@"messageId"] = messageId;
          params[@"message"] = [self convertMessageToDictionary:message];
          [self sendEventWithName:@"onMediaMessageCancelled" body:params];
        }];

    NSMutableDictionary *result = [self convertMessageToDictionary:message];
    result[@"messageId"] = messageId;
    resolve(result);
  } @catch (NSException *exception) {
    reject(@"SEND_IMAGE_MESSAGE_ERROR", exception.reason, nil);
  }
}

/**
 * 发送文件消息
 */
RCT_EXPORT_METHOD(sendFileMessage : (NSDictionary *)messageDict messageId : (
    NSString *)messageId resolver : (RCTPromiseResolveBlock)
                      resolve rejecter : (RCTPromiseRejectBlock)reject) {
  @try {
    JConversation *conversation =
        [self convertDictionaryToConversation:messageDict];
    JFileMessage *fileMessage = [[JFileMessage alloc] init];

    NSDictionary *contentDict = messageDict[@"content"];
    if (contentDict[@"localPath"]) {
      fileMessage.localPath = contentDict[@"localPath"];
    }
    if (contentDict[@"url"]) {
      fileMessage.url = contentDict[@"url"];
    }
    if (contentDict[@"name"]) {
      fileMessage.name = contentDict[@"name"];
    }
    if (contentDict[@"size"]) {
      fileMessage.size = [contentDict[@"size"] longLongValue];
    }
    if (contentDict[@"type"]) {
      fileMessage.type = contentDict[@"type"];
    }

    JMessageOptions *options = [self getOptionsFromDictionary:messageDict];
    JMessage *message = [JIM.shared.messageManager sendMediaMessage:fileMessage
        messageOption:options
        inConversation:conversation
        progress:^(int progress, JMessage *_Nonnull message) {
          NSMutableDictionary *params = [NSMutableDictionary dictionary];
          params[@"messageId"] = messageId;
          params[@"progress"] = @(progress);
          params[@"message"] = [self convertMessageToDictionary:message];
          [self sendEventWithName:@"onMediaMessageProgress" body:params];
        }
        success:^(JMessage *_Nonnull message) {
          NSMutableDictionary *params = [NSMutableDictionary dictionary];
          params[@"messageId"] = messageId;
          params[@"message"] = [self convertMessageToDictionary:message];
          [self sendEventWithName:@"onMediaMessageSent" body:params];
        }
        error:^(JErrorCode errorCode, JMessage *_Nonnull message) {
          NSMutableDictionary *params = [NSMutableDictionary dictionary];
          params[@"messageId"] = messageId;
          params[@"message"] = [self convertMessageToDictionary:message];
          params[@"errorCode"] = @(errorCode);
          [self sendEventWithName:@"onMediaMessageSentError" body:params];
        }
        cancel:^(JMessage *_Nonnull message) {
          NSMutableDictionary *params = [NSMutableDictionary dictionary];
          params[@"messageId"] = messageId;
          params[@"message"] = [self convertMessageToDictionary:message];
          [self sendEventWithName:@"onMediaMessageCancelled" body:params];
        }];

    NSMutableDictionary *result = [self convertMessageToDictionary:message];
    result[@"messageId"] = messageId;
    resolve(result);
  } @catch (NSException *exception) {
    reject(@"SEND_FILE_MESSAGE_ERROR", exception.reason, nil);
  }
}

/**
 * 发送语音消息
 */
RCT_EXPORT_METHOD(sendVoiceMessage : (NSDictionary *)messageDict messageId : (
    NSString *)messageId resolver : (RCTPromiseResolveBlock)
                      resolve rejecter : (RCTPromiseRejectBlock)reject) {
  @try {
    JConversation *conversation =
        [self convertDictionaryToConversation:messageDict];
    JVoiceMessage *voiceMessage = [[JVoiceMessage alloc] init];

    NSDictionary *contentDict = messageDict[@"content"];
    if (contentDict[@"localPath"]) {
      voiceMessage.localPath = contentDict[@"localPath"];
    }
    if (contentDict[@"url"]) {
      voiceMessage.url = contentDict[@"url"];
    }
    if (contentDict[@"duration"]) {
      voiceMessage.duration = [contentDict[@"duration"] integerValue];
    }

    JMessageOptions *options = [self getOptionsFromDictionary:messageDict];
    JMessage *message = [JIM.shared.messageManager sendMediaMessage:voiceMessage
        messageOption:options
        inConversation:conversation
        progress:^(int progress, JMessage *_Nonnull message) {
          NSMutableDictionary *params = [NSMutableDictionary dictionary];
          params[@"messageId"] = messageId;
          params[@"progress"] = @(progress);
          params[@"message"] = [self convertMessageToDictionary:message];
          [self sendEventWithName:@"onMediaMessageProgress" body:params];
        }
        success:^(JMessage *_Nonnull message) {
          NSMutableDictionary *params = [NSMutableDictionary dictionary];
          params[@"messageId"] = messageId;
          params[@"message"] = [self convertMessageToDictionary:message];
          [self sendEventWithName:@"onMediaMessageSent" body:params];
        }
        error:^(JErrorCode errorCode, JMessage *_Nonnull message) {
          NSMutableDictionary *params = [NSMutableDictionary dictionary];
          params[@"messageId"] = messageId;
          params[@"message"] = [self convertMessageToDictionary:message];
          params[@"errorCode"] = @(errorCode);
          [self sendEventWithName:@"onMediaMessageSentError" body:params];
        }
        cancel:^(JMessage *_Nonnull message) {
          NSMutableDictionary *params = [NSMutableDictionary dictionary];
          params[@"messageId"] = messageId;
          params[@"message"] = [self convertMessageToDictionary:message];
          [self sendEventWithName:@"onMediaMessageCancelled" body:params];
        }];

    NSMutableDictionary *result = [self convertMessageToDictionary:message];
    result[@"messageId"] = messageId;
    resolve(result);
  } @catch (NSException *exception) {
    reject(@"SEND_VOICE_MESSAGE_ERROR", exception.reason, nil);
  }
}

/**
 * 获取历史消息
 */
RCT_EXPORT_METHOD(getMessages : (NSDictionary *)conversationDict direction : (
    int)direction options : (NSDictionary *)
                      options resolver : (RCTPromiseResolveBlock)
                          resolve rejecter : (RCTPromiseRejectBlock)reject) {
  @try {
    JConversation *conversation =
        [self convertDictionaryToConversation:conversationDict];
    JGetMessageOptions *getOptions = [[JGetMessageOptions alloc] init];

    if (options[@"count"]) {
      getOptions.count = [options[@"count"] integerValue];
    }
    if (options[@"startTime"]) {
      getOptions.startTime = [options[@"startTime"] longLongValue];
    }

    JPullDirection pullDirection =
        direction == 0 ? JPullDirectionNewer : JPullDirectionOlder;
    NSLog(@"getMessages start");
    [JIM.shared.messageManager
        getMessages:conversation
          direction:pullDirection
             option:getOptions
           complete:^(NSArray<JMessage *> *messages, long long timestamp,
                      BOOL hasMore, JErrorCode code) {
             NSMutableArray *messageArray = [NSMutableArray array];
             for (JMessage *msg in messages) {
               [messageArray addObject:[self convertMessageToDictionary:msg]];
             }
             NSLog(@"getMessages complete: %lu messages, timestamp: %lld, "
                   @"hasMore: %d, code: %ld",
                   (unsigned long)messages.count, timestamp, hasMore,
                   (long)code);
             NSDictionary *result = @{
               @"messages" : messageArray,
               @"timestamp" : @(timestamp),
               @"hasMore" : @(hasMore),
               @"code" : @(code)
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
RCT_EXPORT_METHOD(recallMessage : (NSString *)messageId extras : (
    NSDictionary *)extras resolver : (RCTPromiseResolveBlock)
                      resolve rejecter : (RCTPromiseRejectBlock)reject) {
  @try {
    NSDictionary *extrasDict = extras ?: @{};

    [JIM.shared.messageManager recallMessage:messageId
        extras:extrasDict
        success:^(JMessage *message) {
          resolve(@YES);
        }
        error:^(JErrorCode errorCode) {
          reject(
              @"RECALL_MESSAGE_ERROR",
              [NSString stringWithFormat:@"Error code: %ld", (long)errorCode],
              nil);
        }];
  } @catch (NSException *exception) {
    reject(@"RECALL_MESSAGE_ERROR", exception.reason, nil);
  }
}

/**
 * 根据clientMsgNo列表删除消息
 */
RCT_EXPORT_METHOD(deleteMessagesByClientMsgNoList : (
    NSDictionary *)conversationMap clientMsgNos : (NSArray<NSNumber *> *)
                      clientMsgNos resolver : (RCTPromiseResolveBlock)
                          resolve rejecter : (RCTPromiseRejectBlock)reject) {
  @try {
    JConversation *conversation =
        [self convertDictionaryToConversation:conversationMap];

    [JIM.shared.messageManager deleteMessagesByClientMsgNoList:clientMsgNos
        conversation:conversation
        success:^{
          resolve(@YES);
        }
        error:^(JErrorCode errorCode) {
          reject(
              @"DELETE_MESSAGES_ERROR",
              [NSString stringWithFormat:@"Error code: %ld", (long)errorCode],
              nil);
        }];
  } @catch (NSException *exception) {
    reject(@"DELETE_MESSAGES_ERROR", exception.reason, nil);
  }
}

/**
 * 添加消息反应
 */
RCT_EXPORT_METHOD(
    addMessageReaction : (NSDictionary *)messageDict reactionId : (NSString *)
        reactionId resolver : (RCTPromiseResolveBlock)
            resolve rejecter : (RCTPromiseRejectBlock)reject) {
  @try {
    NSString *messageId = messageDict[@"messageId"];
    JConversation *conversation =
        [self convertDictionaryToConversation:messageDict];

    [JIM.shared.messageManager addMessageReaction:messageId
        conversation:conversation
        reactionId:reactionId
        success:^{
          resolve(@YES);
        }
        error:^(JErrorCode errorCode) {
          reject(
              @"ADD_REACTION_ERROR",
              [NSString stringWithFormat:@"Error code: %ld", (long)errorCode],
              nil);
        }];
  } @catch (NSException *exception) {
    reject(@"ADD_REACTION_ERROR", exception.reason, nil);
  }
}

/**
 * 移除消息反应
 */
RCT_EXPORT_METHOD(removeMessageReaction : (
    NSDictionary *)messageDict reactionId : (NSString *)
                      reactionId resolver : (RCTPromiseResolveBlock)
                          resolve rejecter : (RCTPromiseRejectBlock)reject) {
  @try {
    NSString *messageId = messageDict[@"messageId"];
    JConversation *conversation =
        [self convertDictionaryToConversation:messageDict];

    [JIM.shared.messageManager removeMessageReaction:messageId
        conversation:conversation
        reactionId:reactionId
        success:^{
          resolve(@YES);
        }
        error:^(JErrorCode errorCode) {
          reject(@"REMOVE_REACTION_ERROR", @"移除反应失败",
                 [NSError errorWithDomain:@"JuggleIM"
                                     code:errorCode
                                 userInfo:nil]);
        }];
  } @catch (NSException *exception) {
    reject(@"REMOVE_REACTION_ERROR", exception.reason, nil);
  }
}

// 辅助方法：将字典转换为消息内容
- (JMessageContent *)convertDictToMessageContent:(NSDictionary *)messageDict {
  NSString *contentType = messageDict[@"contentType"];

  if ([contentType isEqualToString:@"jg:text"]) {
    JTextMessage *text =
        [[JTextMessage alloc] initWithContent:messageDict[@"content"] ?: @""];
    return text;
  } else if ([contentType isEqualToString:@"jg:img"]) {
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
  } else if ([contentType isEqualToString:@"jg:streamtext"]) {
    JStreamTextMessage *streamText = [[JStreamTextMessage alloc] init];
    streamText.content = messageDict[@"content"] ?: @"";
    streamText.isFinished = [messageDict[@"isFinished"] boolValue];
    return streamText;
  } else if ([contentType isEqualToString:@"jg:merge"]) {
    NSString *title = messageDict[@"title"];
    JConversation *conversation =
        [self convertDictionaryToConversation:messageDict[@"conversation"]];
    NSArray *messageIdList = messageDict[@"messageIdList"];
    NSArray *previewListDict = messageDict[@"previewList"];
    NSMutableArray *previewList = [NSMutableArray array];
    for (NSDictionary *previewDict in previewListDict) {
      [previewList addObject:[self convertDictionaryToPreviewUnit:previewDict]];
    }

    JMergeMessage *merge = [[JMergeMessage alloc] initWithTitle:title
                                                   conversation:conversation
                                                  MessageIdList:messageIdList
                                                    previewList:previewList];
    if (messageDict[@"containerMsgId"]) {
      merge.containerMsgId = messageDict[@"containerMsgId"];
    }
    if (messageDict[@"extra"]) {
      merge.extra = messageDict[@"extra"];
    }
    return merge;
  } else if (self.customMessageTypes[contentType]) {
    NSString *contenType = messageDict[@"contentType"];
    NSError *error = nil;
    JUnknownMessage *unknown = [JUnknownMessage new];

    // 从 messageDict 中读取 flag，如果没有设置则使用默认值
    int flag = JMessageFlagIsSave | JMessageFlagIsCountable;
    if (messageDict[@"flag"] && [messageDict[@"flag"] isKindOfClass:[NSNumber class]]) {
      flag = [messageDict[@"flag"] intValue];
    }
    unknown.flags = flag;

    NSData *jsonData = [NSJSONSerialization dataWithJSONObject:messageDict
                                                       options:0
                                                         error:&error];
    NSString *jsonString = [[NSString alloc] initWithData:jsonData
                                                 encoding:NSUTF8StringEncoding];
    unknown.content = jsonString;
    unknown.messageType = contenType;
    return unknown;
  }

  return nil;
}

/**
 * 重发消息
 */
RCT_EXPORT_METHOD(resendMessage : (NSDictionary *)messageDict messageId : (
    NSString *)messageId resolver : (RCTPromiseResolveBlock)
                      resolve rejecter : (RCTPromiseRejectBlock)reject) {
  @try {
    JMessage *message = [self convertDictToMessage:messageDict];
    JMessage *sendMsg = [JIM.shared.messageManager resend:message
        success:^(JMessage *message) {
          NSMutableDictionary *params = [NSMutableDictionary dictionary];
          params[@"messageId"] = messageId;
          params[@"message"] = [self convertMessageToDictionary:message];
          [self sendEventWithName:@"onMessageSent" body:params];
        }
        error:^(JErrorCode errorCode, JMessage *message) {
          NSMutableDictionary *params = [NSMutableDictionary dictionary];
          params[@"messageId"] = messageId;
          params[@"message"] = [self convertMessageToDictionary:message];
          params[@"errorCode"] = @(errorCode);
          [self sendEventWithName:@"onMessageSentError" body:params];
        }];
    NSMutableDictionary *result = [self convertMessageToDictionary:sendMsg];
    result[@"messageId"] = messageId;
    resolve(result);
  } @catch (NSException *exception) {
    reject(@"RESEND_MESSAGE_ERROR", exception.reason, nil);
  }
}

/**
 * 重发媒体消息
 */
RCT_EXPORT_METHOD(resendMediaMessage : (NSDictionary *)messageDict messageId : (
    NSString *)messageId resolver : (RCTPromiseResolveBlock)
                      resolve rejecter : (RCTPromiseRejectBlock)reject) {
  @try {
    JMessage *message = [self convertDictToMessage:messageDict];
    JMessage *sendMsg = [JIM.shared.messageManager resendMediaMessage:message
        progress:^(int progress, JMessage *message) {
          NSMutableDictionary *params = [NSMutableDictionary dictionary];
          params[@"messageId"] = messageId;
          params[@"progress"] = @(progress);
          params[@"message"] = [self convertMessageToDictionary:message];
          [self sendEventWithName:@"onMediaMessageProgress" body:params];
        }
        success:^(JMessage *message) {
          NSMutableDictionary *params = [NSMutableDictionary dictionary];
          params[@"messageId"] = messageId;
          params[@"message"] = [self convertMessageToDictionary:message];
          [self sendEventWithName:@"onMediaMessageSent" body:params];
        }
        error:^(JErrorCode errorCode, JMessage *message) {
          NSMutableDictionary *params = [NSMutableDictionary dictionary];
          params[@"messageId"] = messageId;
          params[@"message"] = [self convertMessageToDictionary:message];
          params[@"errorCode"] = @(errorCode);
          [self sendEventWithName:@"onMediaMessageSentError" body:params];
        }
        cancel:^(JMessage *message) {
          NSMutableDictionary *params = [NSMutableDictionary dictionary];
          params[@"messageId"] = messageId;
          params[@"message"] = [self convertMessageToDictionary:message];
          [self sendEventWithName:@"onMediaMessageCancelled" body:params];
    }];
    NSMutableDictionary *result = [self convertMessageToDictionary:sendMsg];
    result[@"messageId"] = messageId;
    resolve(result);
  } @catch (NSException *exception) {
    reject(@"RESEND_MEDIA_MESSAGE_ERROR", exception.reason, nil);
  }
}

/**
 * 发送媒体消息
 */
RCT_EXPORT_METHOD(sendMediaMessage : (NSDictionary *)messageDict resolver : (
    RCTPromiseResolveBlock)resolve rejecter : (RCTPromiseRejectBlock)reject) {
  @try {
    NSString *messageId = [NSString stringWithFormat:@"%f%d", [[NSDate date] timeIntervalSince1970], arc4random() % 10000];
    if (messageDict[@"messageId"]) {
        messageId = messageDict[@"messageId"];
    }

    JMessageContent *content = [self convertDictToMessageContent:messageDict[@"content"]];
    if (!content) {
        reject(@"SEND_MEDIA_MESSAGE_ERROR", @"Invalid message content", nil);
        return;
    }
    
    if (![content isKindOfClass:[JMediaMessageContent class]]) {
        reject(@"SEND_MEDIA_MESSAGE_ERROR", @"Content must be MediaMessageContent", nil);
        return;
    }

    JConversation *conversation =
        [self convertDictionaryToConversation:messageDict];
        
    JMessage *message = [JIM.shared.messageManager sendMediaMessage:(JMediaMessageContent *)content
        inConversation:conversation
        progress:^(int progress, JMessage *message) {
          NSMutableDictionary *params = [NSMutableDictionary dictionary];
          params[@"messageId"] = messageId;
          params[@"progress"] = @(progress);
          params[@"message"] = [self convertMessageToDictionary:message];
          [self sendEventWithName:@"onMediaMessageProgress" body:params];
        }
        success:^(JMessage *message) {
          NSMutableDictionary *params = [NSMutableDictionary dictionary];
          params[@"messageId"] = messageId;
          params[@"message"] = [self convertMessageToDictionary:message];
          [self sendEventWithName:@"onMediaMessageSent" body:params];
        }
        error:^(JErrorCode errorCode, JMessage *message) {
          NSMutableDictionary *params = [NSMutableDictionary dictionary];
          params[@"messageId"] = messageId;
          params[@"message"] = [self convertMessageToDictionary:message];
          params[@"errorCode"] = @(errorCode);
          [self sendEventWithName:@"onMediaMessageSentError" body:params];
        }
        cancel:^(JMessage *message) {
          NSMutableDictionary *params = [NSMutableDictionary dictionary];
          params[@"messageId"] = messageId;
          params[@"message"] = [self convertMessageToDictionary:message];
          [self sendEventWithName:@"onMediaMessageCancelled" body:params];
        }];

    NSMutableDictionary *result = [self convertMessageToDictionary:message];
    result[@"messageId"] = messageId;
    resolve(result);
  } @catch (NSException *exception) {
    reject(@"SEND_MEDIA_MESSAGE_ERROR", exception.reason, nil);
  }
}

- (JMessage *)convertDictToMessage:(NSDictionary *)messageDict {
  if (![messageDict isKindOfClass:[NSDictionary class]]) {
    return nil;
  }

  JMessage *message = [[JMessage alloc] init];

  // 1. Conversation
  JConversation *conversation =
      [self convertDictionaryToConversation:messageDict];
  message.conversation = conversation;

  // 2. messageId
  if (messageDict[@"messageId"]) {
    message.messageId = messageDict[@"messageId"];
  }

  // 3. clientMsgNo
  if (messageDict[@"clientMsgNo"]) {
    message.clientMsgNo = [messageDict[@"clientMsgNo"] longLongValue];
  }

  // 4. timestamp
  if (messageDict[@"timestamp"]) {
    message.timestamp = [messageDict[@"timestamp"] longLongValue];
  }

  // 5. senderUserId
  if (messageDict[@"senderUserId"]) {
    message.senderUserId = messageDict[@"senderUserId"];
  }

  // 6. content
  NSDictionary *contentDict = messageDict[@"content"];
  if ([contentDict isKindOfClass:[NSDictionary class]]) {
    JMessageContent *content = [self convertDictToMessageContent:contentDict];
    message.content = content;
    message.contentType = contentDict[@"contentType"];
  }

  // 7. direction
  if (messageDict[@"direction"]) {
    NSInteger directionValue = [messageDict[@"direction"] integerValue];
    message.direction = directionValue;
  }

  // 8. state
  if (messageDict[@"state"]) {
    NSInteger stateValue = [messageDict[@"state"] integerValue];
    message.messageState = stateValue;
  }

  // 9. hasRead
  if (messageDict[@"hasRead"]) {
    message.hasRead = [messageDict[@"hasRead"] boolValue];
  }

  // 10. localAttribute
  if (messageDict[@"localAttribute"]) {
    message.localAttribute = messageDict[@"localAttribute"];
  }

  // 11. isDelete
  if (messageDict[@"isDelete"]) {
    message.isDeleted = [messageDict[@"isDelete"] boolValue];
  }

  // 12. isEdit
  if (messageDict[@"isEdit"]) {
    message.isEdit = [messageDict[@"isEdit"] boolValue];
  }

  if (messageDict[@"mentionInfo"]) {
    NSDictionary *mentionInfoDict = messageDict[@"mentionInfo"];
    if ([mentionInfoDict isKindOfClass:[NSDictionary class]]) {
      JMessageMentionInfo *mentionInfo =
          [self convertDictToMessageMentionInfo:mentionInfoDict];
      message.mentionInfo = mentionInfo;
    }
  }

  return message;
}

- (JMessageMentionInfo *)convertDictToMessageMentionInfo:(NSDictionary *)dict {
  JMessageMentionInfo *mentionInfo = [[JMessageMentionInfo alloc] init];
  if (dict[@"type"]) {
    mentionInfo.type = [dict[@"type"] intValue];
  }
  if (dict[@"targetUsers"]) {
    NSDictionary *mentionedUsers = dict[@"targetUsers"];
    // convert dict userinfo
    NSMutableArray *userArray = [NSMutableArray array];
    for (NSDictionary *userDict in mentionedUsers) {
      if ([userDict isKindOfClass:[NSDictionary class]] &&
          userDict[@"userId"]) {
        JUserInfo *userInfo = [self convertDictionaryToJUserInfo:userDict];
        [userArray addObject:userInfo];
      }
    }
    mentionInfo.targetUsers = userArray;
  }

  return mentionInfo;
}

- (JUserInfo *)convertDictionaryToJUserInfo:(NSDictionary *)dict {
  JUserInfo *userInfo = [[JUserInfo alloc] init];
  if (dict[@"userId"]) {
    userInfo.userId = dict[@"userId"];
  }
  if (dict[@"nickname"]) {
    userInfo.userName = dict[@"nickname"];
  }
  if (dict[@"avatar"]) {
    userInfo.portrait = dict[@"avatar"];
  }
  if (dict[@"extra"]) {
    userInfo.extraDic = dict[@"extra"];
  }
  return userInfo;
}

- (JMergeMessagePreviewUnit *)convertDictionaryToPreviewUnit:
    (NSDictionary *)dict {
  JMergeMessagePreviewUnit *unit = [[JMergeMessagePreviewUnit alloc] init];
  if (dict[@"previewContent"]) {
    unit.previewContent = dict[@"previewContent"];
  }
  if (dict[@"sender"]) {
    unit.sender = [self convertDictionaryToJUserInfo:dict[@"sender"]];
  }
  return unit;
}

/**
 * 发送消息已读回执
 */
RCT_EXPORT_METHOD(
    sendReadReceipt : (NSDictionary *)conversationMap messageIds : (NSArray *)
        messageIds resolver : (RCTPromiseResolveBlock)
            resolve rejecter : (RCTPromiseRejectBlock)reject) {
  JConversation *conversation =
      [self convertDictionaryToConversation:conversationMap];

  [JIM.shared.messageManager sendReadReceipt:messageIds
      inConversation:conversation
      success:^{
        resolve(@YES);
      }
      error:^(JErrorCode code) {
        reject(@"error",
               [NSString stringWithFormat:@"Error code: %ld", (long)code], nil);
      }];
}

/**
 * 更新消息
 */
RCT_EXPORT_METHOD(updateMessage : (NSString *)messageId content : (
    NSDictionary *)contentMap conversation : (NSDictionary *)
                      conversationMap resolver : (RCTPromiseResolveBlock)
                          resolve rejecter : (RCTPromiseRejectBlock)reject) {
  @try {
    JMessageContent *content = [self convertDictToMessageContent:contentMap];
    JConversation *conversation =
        [self convertDictionaryToConversation:conversationMap];

    [JIM.shared.messageManager updateMessage:content
        messageId:messageId
        inConversation:conversation
        success:^(JMessage *message) {
          resolve([self convertMessageToDictionary:message]);
        }
        error:^(JErrorCode code) {
          reject(@"error",
                 [NSString stringWithFormat:@"Error code: %ld", (long)code],
                 nil);
        }];
  } @catch (NSException *exception) {
    reject(@"UPDATE_MESSAGE_ERROR", exception.reason, nil);
  }
}

/**
 * 设置消息置顶
 */
RCT_EXPORT_METHOD(
    setMessageTop : (NSString *)messageId conversation : (NSDictionary *)
        conversationMap isTop : (BOOL)isTop resolver : (RCTPromiseResolveBlock)
            resolve rejecter : (RCTPromiseRejectBlock)reject) {
  JConversation *conversation =
      [self convertDictionaryToConversation:conversationMap];

  [JIM.shared.messageManager setTop:isTop
      messageId:messageId
      conversation:conversation
      success:^{
        resolve(@YES);
      }
      error:^(JErrorCode code) {
        reject(@"error",
               [NSString stringWithFormat:@"Error code: %ld", (long)code], nil);
      }];
}

- (JMessageOptions *)getOptionsFromDictionary:(NSDictionary *)dict {
  JMessageOptions *options = [[JMessageOptions alloc] init];
  if (dict[@"mentionInfo"]) {
    options.mentionInfo =
        [self convertDictToMessageMentionInfo:dict[@"mentionInfo"]];
  }
  if (dict[@"referredMessageId"]) {
    options.referredMsgId = dict[@"referredMessageId"];
  }
  if (dict[@"pushData"]) {
    options.pushData = [self convertDictToPushData:dict[@"pushData"]];
  }
  if (dict[@"lifeTime"]) {
    options.lifeTime = [dict[@"lifeTime"] longLongValue];
  }
  if (dict[@"lifeTimeAfterRead"]) {
    options.lifeTimeAfterRead = [dict[@"lifeTimeAfterRead"] longLongValue];
  }
  return options;
}

- (JPushData *)convertDictToPushData:(NSDictionary *)dict {
  JPushData *pushData = [[JPushData alloc] init];
  if (dict[@"content"]) {
    pushData.content = dict[@"content"];
  }
  if (dict[@"extra"]) {
    pushData.extra = dict[@"extra"];
  }
  return pushData;
}

/**
 * 获取合并消息列表
 */
RCT_EXPORT_METHOD(getMergedMessageList : (NSString *)messageId resolver : (
    RCTPromiseResolveBlock)resolve rejecter : (RCTPromiseRejectBlock)reject) {
  [[JIM shared].messageManager getMergedMessageList:messageId
      success:^(NSArray<JMessage *> *mergedMessages) {
        NSMutableArray *array = [NSMutableArray new];
        for (JMessage *msg in mergedMessages) {
          [array addObject:[self convertMessageToDictionary:msg]];
        }
        resolve(array);
      }
      error:^(JErrorCode code) {
        reject([NSString stringWithFormat:@"%ld", (long)code],
               @"getMergedMessageList failed", nil);
      }];
}

/**
 * 从服务端获取用户信息
 */
RCT_EXPORT_METHOD(fetchUserInfo : (NSString *)userId resolver : (
    RCTPromiseResolveBlock)resolve rejecter : (RCTPromiseRejectBlock)reject) {
  [[JIM shared].userInfoManager fetchUserInfo:userId
      success:^(JUserInfo *userInfo) {
        if (userInfo) {
          resolve([self convertUserInfoToDictionary:userInfo]);
        } else {
          resolve([NSNull null]);
        }
      }
      error:^(JErrorCode code) {
        reject([NSString stringWithFormat:@"%ld", (long)code],
               @"fetchUserInfo failed", nil);
      }];
}

/**
 * 从服务端获取群组信息
 */
RCT_EXPORT_METHOD(fetchGroupInfo : (NSString *)groupId resolver : (
    RCTPromiseResolveBlock)resolve rejecter : (RCTPromiseRejectBlock)reject) {
  [[JIM shared].userInfoManager fetchGroupInfo:groupId
      success:^(JGroupInfo *groupInfo) {
        if (groupInfo) {
          resolve([self convertGroupInfoToDictionary:groupInfo]);
        } else {
          resolve([NSNull null]);
        }
      }
      error:^(JErrorCode code) {
        reject([NSString stringWithFormat:@"%ld", (long)code],
               @"fetchGroupInfo failed", nil);
      }];
}

/**
 * 批量获取用户信息
 */
RCT_EXPORT_METHOD(getUserInfoList : (NSArray *)userIdList resolver : (
    RCTPromiseResolveBlock)resolve rejecter : (RCTPromiseRejectBlock)reject) {
  NSArray<JUserInfo *> *users =
      [[JIM shared].userInfoManager getUserInfoList:userIdList];
  NSMutableArray *array = [NSMutableArray new];
  for (JUserInfo *user in users) {
    [array addObject:[self convertUserInfoToDictionary:user]];
  }
  resolve(array);
}

/**
 * 批量获取群组信息
 */
RCT_EXPORT_METHOD(getGroupInfoList : (NSArray *)groupIdList resolver : (
    RCTPromiseResolveBlock)resolve rejecter : (RCTPromiseRejectBlock)reject) {
  NSArray<JGroupInfo *> *groups =
      [[JIM shared].userInfoManager getGroupInfoList:groupIdList];
  NSMutableArray *array = [NSMutableArray new];
  for (JGroupInfo *group in groups) {
    [array addObject:[self convertGroupInfoToDictionary:group]];
  }
  resolve(array);
}

@end
