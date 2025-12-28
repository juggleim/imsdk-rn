//
//  JModelFactory.m
//  juggle_im
//
//  Created by Fei Li on 2025/5/22.
//

#import "JModelFactory.h"

@implementation JModelFactory

#pragma mark - model2Dic
+ (NSDictionary *)conversationToDic:(JConversation *)conversation {
  NSMutableDictionary *dic = [NSMutableDictionary dictionary];
  [dic setObject:@(conversation.conversationType) forKey:@"conversationType"];
  [dic setObject:conversation.conversationId forKey:@"conversationId"];
  return [dic copy];
}

+ (NSDictionary *)conversationMentionMessageToDic:
    (JConversationMentionMessage *)message {
  NSMutableDictionary *dic = [NSMutableDictionary dictionary];
  if (message.senderId) {
    [dic setObject:message.senderId forKey:@"senderId"];
  }
  if (message.msgId) {
    [dic setObject:message.msgId forKey:@"msgId"];
  }
  [dic setObject:@(message.msgTime) forKey:@"msgTime"];
  [dic setObject:@(message.type) forKey:@"type"];
  return [dic copy];
}

+ (NSDictionary *)conversationMentionInfoToDic:
    (JConversationMentionInfo *)info {
  NSMutableDictionary *dic = [NSMutableDictionary dictionary];
  NSMutableArray *list = [NSMutableArray array];
  for (JConversationMentionMessage *message in info.mentionMsgList) {
    [list addObject:[self conversationMentionMessageToDic:message]];
  }
  [dic setObject:list forKey:@"mentionMsgList"];
  return [dic copy];
}

+ (NSDictionary *)conversationInfoToDic:(JConversationInfo *)conversationInfo {
  NSMutableDictionary *dic = [NSMutableDictionary dictionary];
  if (!conversationInfo) {
    return dic;
  }
  [dic setObject:[self conversationToDic:conversationInfo.conversation]
          forKey:@"conversation"];
  [self extendDic:dic forConversationInfo:conversationInfo];
  [dic setObject:@(conversationInfo.unreadCount) forKey:@"unreadCount"];
  [dic setObject:@(conversationInfo.hasUnread) forKey:@"hasUnread"];
  [dic setObject:@(conversationInfo.sortTime) forKey:@"sortTime"];
  if (conversationInfo.lastMessage) {
    [dic setObject:[self messageToDic:conversationInfo.lastMessage]
            forKey:@"lastMessage"];
  }
  [dic setObject:@(conversationInfo.isTop) forKey:@"isTop"];
  [dic setObject:@(conversationInfo.topTime) forKey:@"topTime"];
  [dic setObject:@(conversationInfo.mute) forKey:@"mute"];
  if (conversationInfo.draft) {
    [dic setObject:conversationInfo.draft forKey:@"draft"];
  }
  [dic
      setObject:[self conversationMentionInfoToDic:conversationInfo.mentionInfo]
         forKey:@"mentionInfo"];
  return [dic copy];
}

+ (NSString *)messageContentToString:(JMessageContent *)content {
  NSData *data;
  if ([content isKindOfClass:[JImageMessage class]]) {
    JImageMessage *image = (JImageMessage *)content;
    NSDictionary *dic = @{
      @"url" : image.url ?: @"",
      @"thumbnail" : image.thumbnailUrl ?: @"",
      @"local" : image.localPath ?: @"",
      @"width" : @(image.width),
      @"height" : @(image.height),
      @"size" : @(image.size),
      @"extra" : image.extra ?: @"",
      @"thumbnailLocalPath" : image.thumbnailLocalPath ?: @""
    };
    data = [NSJSONSerialization dataWithJSONObject:dic
                                           options:kNilOptions
                                             error:nil];
  } else if ([content isKindOfClass:[JVoiceMessage class]]) {
    JVoiceMessage *voice = (JVoiceMessage *)content;
    NSDictionary *dic = @{
      @"url" : voice.url ?: @"",
      @"local" : voice.localPath ?: @"",
      @"duration" : @(voice.duration),
      @"extra" : voice.extra ?: @""
    };
    data = [NSJSONSerialization dataWithJSONObject:dic
                                           options:kNilOptions
                                             error:nil];
  } else if ([content isKindOfClass:[JVideoMessage class]]) {
    JVideoMessage *video = (JVideoMessage *)content;
    NSDictionary *dic = @{
      @"url" : video.url ?: @"",
      @"local" : video.localPath ?: @"",
      @"poster" : video.snapshotUrl ?: @"",
      @"height" : @(video.height),
      @"width" : @(video.width),
      @"size" : @(video.size),
      @"duration" : @(video.duration),
      @"extra" : video.extra ?: @"",
      @"snapshotLocalPath" : video.snapshotLocalPath ?: @""
    };
    data = [NSJSONSerialization dataWithJSONObject:dic
                                           options:kNilOptions
                                             error:nil];
  } else if ([content isKindOfClass:[JFileMessage class]]) {
    JFileMessage *file = (JFileMessage *)content;
    NSDictionary *dic = @{
      @"url" : file.url ?: @"",
      @"local" : file.localPath ?: @"",
      @"name" : file.name ?: @"",
      @"size" : @(file.size),
      @"type" : file.type ?: @"",
      @"extra" : file.extra ?: @""
    };
    data = [NSJSONSerialization dataWithJSONObject:dic
                                           options:kNilOptions
                                             error:nil];
  } else {
    data = [content encode];
  }
  if (!data) {
    return nil;
  }
  return [[NSString alloc] initWithData:data encoding:NSUTF8StringEncoding];
}

+ (NSDictionary *)groupMessageReadInfoToDic:(JGroupMessageReadInfo *)info {
  NSMutableDictionary *dic = [NSMutableDictionary dictionary];
  [dic setObject:@(info.readCount) forKey:@"readCount"];
  [dic setObject:@(info.memberCount) forKey:@"memberCount"];
  return [dic copy];
}

+ (NSDictionary *)groupMessageMemberReadDetailToDic:
    (JGroupMessageMemberReadDetail *)detail {
  NSMutableDictionary *dic = [NSMutableDictionary dictionary];
  if (!detail) {
    return [dic copy];
  }
  [dic setObject:[self userInfoToDic:detail.userInfo] forKey:@"userInfo"];
  [dic setObject:@(detail.readTime) forKey:@"readTime"];
  return [dic copy];
}

+ (NSDictionary *)userInfoToDic:(JUserInfo *)info {
  NSMutableDictionary *dic = [NSMutableDictionary dictionary];
  if (info.userId) {
    [dic setObject:info.userId forKey:@"userId"];
  }
  // Map iOS userName to JS 'nickname' field
  if (info.userName) {
    [dic setObject:info.userName forKey:@"nickname"];
  }
  // Map iOS portrait to JS 'avatar' field
  if (info.portrait) {
    [dic setObject:info.portrait forKey:@"avatar"];
  }
  if (info.extraDic) {
    [dic setObject:info.extraDic forKey:@"extraMap"];
  }
  [dic setObject:@(info.type) forKey:@"type"];
  return [dic copy];
}

+ (NSDictionary *)groupInfoToDic:(JGroupInfo *)info {
  NSMutableDictionary *dic = [NSMutableDictionary dictionary];
  if (info.groupId) {
    [dic setObject:info.groupId forKey:@"groupId"];
  }
  if (info.groupName) {
    [dic setObject:info.groupName forKey:@"groupName"];
  }
  if (info.portrait) {
    [dic setObject:info.portrait forKey:@"portrait"];
  }
  if (info.extraDic) {
    [dic setObject:info.extraDic forKey:@"extraMap"];
  }
  return [dic copy];
}

+ (NSDictionary *)groupMemberToDic:(JGroupMember *)member {
  NSMutableDictionary *dic = [NSMutableDictionary dictionary];
  if (member.groupId) {
    [dic setObject:member.groupId forKey:@"groupId"];
  }
  if (member.userId) {
    [dic setObject:member.userId forKey:@"userId"];
  }
  if (member.groupDisplayName) {
    [dic setObject:member.groupDisplayName forKey:@"groupDisplayName"];
  }
  if (member.extraDic) {
    [dic setObject:member.extraDic forKey:@"extraMap"];
  }
  return [dic copy];
}

+ (NSDictionary *)messageMentionInfoToDic:(JMessageMentionInfo *)info {
  NSMutableDictionary *dic = [NSMutableDictionary dictionary];
  [dic setObject:@(info.type) forKey:@"type"];
  if (info.targetUsers) {
    NSMutableArray *a = [NSMutableArray array];
    for (JUserInfo *userInfo in info.targetUsers) {
      NSDictionary *userDic = [self userInfoToDic:userInfo];
      [a addObject:userDic];
    }
    [dic setObject:a forKey:@"targetUsers"];
  }
  return [dic copy];
}

+ (NSMutableDictionary *)messageToDic:(JMessage *)message {
  NSMutableDictionary *dic = [NSMutableDictionary dictionary];
  [dic setObject:[self conversationToDic:message.conversation]
          forKey:@"conversation"];
  if (message.contentType) {
    [dic setObject:message.contentType forKey:@"contentType"];
  }
  [dic setObject:@(message.clientMsgNo) forKey:@"clientMsgNo"];
  if (message.messageId) {
    [dic setObject:message.messageId forKey:@"messageId"];
  }
  [dic setObject:@(message.direction) forKey:@"direction"];
  [dic setObject:@(message.messageState) forKey:@"messageState"];
  [dic setObject:@(message.hasRead) forKey:@"hasRead"];
  [dic setObject:@(message.timestamp) forKey:@"timestamp"];
  if (message.senderUserId) {
    [dic setObject:message.senderUserId forKey:@"senderUserId"];
    [self extendDic:dic forMessage:message];
  }
  NSString *contentString = [self messageContentToString:message.content];
  if (contentString) {
    [dic setObject:contentString forKey:@"content"];
  }
  if (message.groupReadInfo) {
    [dic setObject:[self groupMessageReadInfoToDic:message.groupReadInfo]
            forKey:@"groupReadInfo"];
  }
  if (message.mentionInfo) {
    [dic setObject:[self messageMentionInfoToDic:message.mentionInfo]
            forKey:@"mentionInfo"];
  }
  if (message.referredMsg) {
    [dic setObject:[self messageToDic:message.referredMsg]
            forKey:@"referredMsg"];
  }
  if (message.localAttribute) {
    [dic setObject:message.localAttribute forKey:@"localAttribute"];
  }
  [dic setObject:@(message.isEdit) forKey:@"isEdit"];
  [dic setObject:@(message.destroyTime) forKey:@"destroyTime"];
  [dic setObject:@(message.lifeTimeAfterRead) forKey:@"lifeTimeAfterRead"];
  return dic;
}

+ (NSDictionary *)favoriteMessageToDic:(JFavoriteMessage *)message {
  NSMutableDictionary *dic = [NSMutableDictionary dictionary];
  [dic setObject:@(message.createdTime) forKey:@"createdTime"];
  [dic setObject:[self messageToDic:message.message] forKey:@"message"];
  return [dic copy];
}

+ (NSDictionary *)messageReactionItemToDic:(JMessageReactionItem *)item {
  NSMutableDictionary *dic = [NSMutableDictionary dictionary];
  [dic setObject:item.reactionId forKey:@"reactionId"];
  NSMutableArray *userDicArray = [NSMutableArray array];
  for (JUserInfo *userInfo in item.userInfoList) {
    NSDictionary *userInfoDic = [JModelFactory userInfoToDic:userInfo];
    [userDicArray addObject:userInfoDic];
  }
  [dic setObject:userDicArray forKey:@"userInfoList"];
  return [dic copy];
}

+ (NSDictionary *)messageReactionToDic:(JMessageReaction *)reaction {
  NSMutableDictionary *dic = [NSMutableDictionary dictionary];
  [dic setObject:reaction.messageId forKey:@"messageId"];
  NSMutableArray *itemDicArray = [NSMutableArray array];
  for (JMessageReactionItem *item in reaction.itemList) {
    NSDictionary *itemDic = [self messageReactionItemToDic:item];
    [itemDicArray addObject:itemDic];
  }
  [dic setObject:itemDicArray forKey:@"itemList"];
  return [dic copy];
}

+ (NSDictionary *)callMemberToDic:(JCallMember *)callMember {
  NSMutableDictionary *dic = [NSMutableDictionary dictionary];
  if (callMember.userInfo) {
    [dic setObject:[JModelFactory userInfoToDic:callMember.userInfo]
            forKey:@"userInfo"];
  }
  [dic setObject:@(callMember.callStatus) forKey:@"callStatus"];
  [dic setObject:@(callMember.startTime) forKey:@"startTime"];
  [dic setObject:@(callMember.connectTime) forKey:@"connectTime"];
  [dic setObject:@(callMember.finishTime) forKey:@"finishTime"];
  if (callMember.inviter) {
    [dic setObject:[JModelFactory userInfoToDic:callMember.inviter]
            forKey:@"inviter"];
  }

  return [dic copy];
}

+ (NSDictionary *)callSessionToDic:(id<JCallSession>)callSession {
  NSMutableDictionary *dic = [NSMutableDictionary dictionary];
  if (callSession.callId) {
    [dic setObject:callSession.callId forKey:@"callId"];
  }
  [dic setObject:@(callSession.isMultiCall) forKey:@"isMultiCall"];
  [dic setObject:@(callSession.mediaType) forKey:@"mediaType"];
  [dic setObject:@(callSession.callStatus) forKey:@"callStatus"];
  [dic setObject:@(callSession.startTime) forKey:@"startTime"];
  [dic setObject:@(callSession.connectTime) forKey:@"connectTime"];
  [dic setObject:@(callSession.finishTime) forKey:@"finishTime"];
  if (callSession.owner) {
    [dic setObject:callSession.owner forKey:@"owner"];
  }
  // Map iOS inviterId to JS 'inviter' field
  if (callSession.inviterId) {
    [dic setObject:callSession.inviterId forKey:@"inviter"];
  }
  if (callSession.extra) {
    [dic setObject:callSession.extra forKey:@"extra"];
  }
  [dic setObject:@(callSession.finishReason) forKey:@"finishReason"];
  NSMutableArray *memberDicArray = [NSMutableArray array];
  for (JCallMember *member in callSession.members) {
    NSDictionary *memberDic = [self callMemberToDic:member];
    [memberDicArray addObject:memberDic];
  }
  [dic setObject:memberDicArray forKey:@"members"];

  // Add currentMember field
  if (callSession.currentCallMember) {
    [dic setObject:[self callMemberToDic:callSession.currentCallMember]
            forKey:@"currentMember"];
  }

  return [dic copy];
}

+ (NSDictionary *)callInfoToDic:(JCallInfo *)callInfo {
  NSMutableDictionary *dic = [NSMutableDictionary dictionary];
  if (callInfo.callId) {
    [dic setObject:callInfo.callId forKey:@"callId"];
  }
  [dic setObject:@(callInfo.isMultiCall) forKey:@"isMultiCall"];
  [dic setObject:@(callInfo.mediaType) forKey:@"mediaType"];
  if (callInfo.owner) {
    [dic setObject:[self userInfoToDic:callInfo.owner] forKey:@"owner"];
  }
  if (callInfo.extra) {
    [dic setObject:callInfo.extra forKey:@"extra"];
  }
  NSMutableArray *memberDicArray = [NSMutableArray array];
  for (JCallMember *member in callInfo.members) {
    NSDictionary *memberDic = [self callMemberToDic:member];
    [memberDicArray addObject:memberDic];
  }
  [dic setObject:memberDicArray forKey:@"members"];

  return [dic copy];
}

+ (NSDictionary *)searchConversationResultToDic:
    (JSearchConversationsResult *)result {
  NSMutableDictionary *d = [NSMutableDictionary dictionary];
  [d setObject:[self conversationInfoToDic:result.conversationInfo]
        forKey:@"conversationInfo"];
  [d setObject:@(result.matchedCount) forKey:@"matchedCount"];

  return [d copy];
}

+ (NSDictionary *)momentMediaToDic:(JMomentMedia *)media {
  if (!media)
    return @{};
  return @{
    @"url" : media.url ?: @"",
    @"type" : @(media.type),
    @"snapshotUrl" : media.snapshotUrl ?: @"",
    @"height" : @(media.height),
    @"width" : @(media.width),
    @"duration" : @(media.duration)
  };
}

+ (NSDictionary *)momentReactionToDic:(JMomentReaction *)reaction {
  if (!reaction)
    return @{};
  NSMutableArray *userDicArray = [NSMutableArray array];
  for (JUserInfo *user in reaction.userArray ?: @[]) {
    [userDicArray addObject:[self userInfoToDic:user]];
  }
  return @{@"key" : reaction.key ?: @"", @"userList" : userDicArray};
}

+ (NSDictionary *)momentCommentToDic:(JMomentComment *)comment {
  if (!comment)
    return @{};
  return @{
    @"commentId" : comment.commentId ?: @"",
    @"momentId" : comment.momentId ?: @"",
    @"parentCommentId" : comment.parentCommentId ?: @"",
    @"content" : comment.content ?: @"",
    @"userInfo" : [self userInfoToDic:comment.userInfo],
    @"parentUserInfo" : [self userInfoToDic:comment.parentUserInfo],
    @"commentTime" : @(comment.createTime)
  };
}

+ (NSDictionary *)momentToDic:(JMoment *)moment {
  if (!moment)
    return @{};
  NSMutableDictionary *resultDic = [NSMutableDictionary dictionary];
  NSString *momentId = moment.momentId ?: @"";
  resultDic[@"momentId"] = momentId;
  NSString *contentText = moment.content ?: @"";
  resultDic[@"content"] = contentText ?: @"";
  resultDic[@"createTime"] = @(moment.createTime);
  if (moment.userInfo && [moment.userInfo isKindOfClass:[JUserInfo class]]) {
    resultDic[@"userInfo"] = [self userInfoToDic:moment.userInfo];
  }
  NSArray *mediaArray = moment.mediaArray ?: @[];
  NSMutableArray *mediasDicArray =
      [NSMutableArray arrayWithCapacity:mediaArray.count];
  for (JMomentMedia *media in mediaArray) {
    if (media && [media isKindOfClass:[JMomentMedia class]]) {
      [mediasDicArray addObject:[self momentMediaToDic:media]];
    }
  }
  resultDic[@"mediaList"] = mediasDicArray;

  NSArray *reactionArray = moment.reactionArray ?: @[];
  NSMutableArray *reactionsDicArray =
      [NSMutableArray arrayWithCapacity:reactionArray.count];
  for (JMomentReaction *reaction in reactionArray) {
    if (reaction && [reaction isKindOfClass:[JMomentReaction class]]) {
      [reactionsDicArray addObject:[self momentReactionToDic:reaction]];
    }
  }
  resultDic[@"reactions"] = reactionsDicArray;

  NSArray *commentArray = moment.commentArray ?: @[];
  NSMutableArray *commentsDicArray =
      [NSMutableArray arrayWithCapacity:commentArray.count];
  for (JMomentComment *comment in commentArray) {
    if (comment && [comment isKindOfClass:[JMomentComment class]]) {
      [commentsDicArray addObject:[self momentCommentToDic:comment]];
    }
  }
  resultDic[@"commentList"] = commentsDicArray;

  return [resultDic copy];
}

#pragma mark - dic2Model
+ (JConversation *)conversationFromDic:(NSDictionary *)dic {
  JConversation *c = [JConversation new];
  c.conversationType = [dic[@"conversationType"] intValue];
  c.conversationId = dic[@"conversationId"];
  return c;
}

+ (JMessage *)messageFromDic:(NSDictionary *)dic {
  JMessage *message = [JMessage new];
  message.conversation = [self conversationFromDic:dic[@"conversation"]];
  message.contentType = dic[@"contentType"];
  message.clientMsgNo = [dic[@"clientMsgNo"] longLongValue];
  message.messageId = dic[@"messageId"];
  message.direction = [dic[@"direction"] intValue];
  message.messageState = [dic[@"messageState"] intValue];
  message.hasRead = [dic[@"hasRead"] boolValue];
  message.timestamp = [dic[@"timestamp"] longLongValue];
  message.senderUserId = dic[@"senderUserId"];
  message.content =
      [JModelFactory messageContentFromString:dic[@"content"]
                                         type:message.contentType];
  if (dic[@"mentionInfo"]) {
    message.mentionInfo = [self messageMentionInfoFromDic:dic[@"mentionInfo"]];
  }
  if (dic[@"referredMsg"]) {
    message.referredMsg = [self messageFromDic:dic[@"referredMsg"]];
  }
  message.localAttribute = dic[@"localAttribute"];
  message.isEdit = [dic[@"isEdit"] boolValue];
  message.destroyTime = [dic[@"destroyTime"] longLongValue];
  message.lifeTimeAfterRead = [dic[@"lifeTimeAfterRead"] longLongValue];
  return message;
}

+ (JMessageOptions *)sendMessageOptionFromDic:(NSDictionary *)dic {
  if (!dic) {
    return nil;
  }
  JMessageOptions *option = [JMessageOptions new];
  if (dic[@"mentionInfo"]) {
    option.mentionInfo = [self messageMentionInfoFromDic:dic[@"mentionInfo"]];
  }
  option.referredMsgId = dic[@"referredMsgId"];
  if (dic[@"pushData"]) {
    option.pushData = [self pushDataFromDic:dic[@"pushData"]];
  }
  option.lifeTime = [dic[@"lifeTime"] longLongValue];
  option.lifeTimeAfterRead = [dic[@"lifeTimeAfterRead"] longLongValue];
  return option;
}

+ (JGetMessageOptions *)getMessageOptionFromDic:(NSDictionary *)dic {
  if (!dic) {
    return nil;
  }
  JGetMessageOptions *option = [JGetMessageOptions new];
  option.startTime = [dic[@"startTime"] longLongValue];
  option.count = [dic[@"count"] intValue];
  if (dic[@"contentTypes"]) {
    NSMutableArray *types = [NSMutableArray array];
    for (NSString *type in dic[@"contentTypes"]) {
      [types addObject:type];
    }
    option.contentTypes = types;
  }
  return option;
}

+ (JMomentMedia *)momentMediaFromDic:(NSDictionary *)dictionary {
  if (!dictionary) {
    return nil;
  }
  JMomentMedia *media = [[JMomentMedia alloc] init];

  media.url = dictionary[@"url"];
  media.snapshotUrl = dictionary[@"snapshotUrl"];
  media.type = [dictionary[@"type"] intValue];
  media.height = [dictionary[@"height"] intValue];
  media.width = [dictionary[@"width"] intValue];
  media.duration = [dictionary[@"duration"] intValue];

  return media;
}

+ (JGetMomentOption *)getMomentOptionFromDic:(NSDictionary *)dic {
  if (!dic || ![dic isKindOfClass:[NSDictionary class]]) {
    JGetMomentOption *defaultOption = [[JGetMomentOption alloc] init];
    defaultOption.startTime = 0;
    defaultOption.count = 10;
    defaultOption.direction = 0;
    return defaultOption;
  }

  JGetMomentOption *option = [[JGetMomentOption alloc] init];
  id startTimeValue = dic[@"startTime"];
  if ([startTimeValue isKindOfClass:[NSNumber class]]) {
    option.startTime = [startTimeValue longLongValue];
  } else {
    option.startTime = 0;
  }

  id countValue = dic[@"count"];
  if ([countValue isKindOfClass:[NSNumber class]]) {
    int count = [countValue intValue];
    option.count = count;
  } else {
    option.count = 10;
  }

  id directionValue = dic[@"direction"];
  if ([directionValue isKindOfClass:[NSNumber class]]) {
    NSInteger direction = [directionValue integerValue];
    option.direction = (JPullDirection)direction;
  } else {
    option.direction = 0;
  }

  return option;
}

+ (JGetMomentCommentOption *)getMomentCommentOptionFromDic:(NSDictionary *)dic {
  if (!dic || ![dic isKindOfClass:[NSDictionary class]]) {
    JGetMomentCommentOption *defaultOption =
        [[JGetMomentCommentOption alloc] init];
    defaultOption.momentId = @"";
    defaultOption.startTime = 0;
    defaultOption.count = 10;
    defaultOption.direction = 0;
    return defaultOption;
  }

  JGetMomentCommentOption *option = [[JGetMomentCommentOption alloc] init];
  option.momentId = dic[@"momentId"];

  id startTimeValue = dic[@"startTime"];
  if ([startTimeValue isKindOfClass:[NSNumber class]]) {
    option.startTime = [startTimeValue longLongValue];
  } else {
    option.startTime = 0;
  }

  id countValue = dic[@"count"];
  if ([countValue isKindOfClass:[NSNumber class]]) {
    option.count = [countValue intValue];
  } else {
    option.count = 10;
  }

  id directionValue = dic[@"direction"];
  if ([directionValue isKindOfClass:[NSNumber class]]) {
    NSInteger direction = [directionValue integerValue];
    option.direction = (JPullDirection)direction;
  } else {
    option.direction = 0;
  }

  return option;
}

+ (JMessageMentionInfo *)messageMentionInfoFromDic:(NSDictionary *)dic {
  JMessageMentionInfo *info = [JMessageMentionInfo new];
  info.type = [dic[@"type"] intValue];
  NSArray *targetUsersDic = dic[@"targetUsers"];
  if (targetUsersDic) {
    NSMutableArray *userList = [NSMutableArray array];
    for (NSDictionary *userDic in targetUsersDic) {
      JUserInfo *userInfo = [self userInfoFromDic:userDic];
      [userList addObject:userInfo];
    }
    info.targetUsers = userList;
  }
  return info;
}

+ (JUserInfo *)userInfoFromDic:(NSDictionary *)dic {
  JUserInfo *info = [JUserInfo new];
  info.userId = dic[@"userId"];
  info.userName = dic[@"userName"];
  info.portrait = dic[@"portrait"];
  info.extraDic = dic[@"extraMap"];
  info.type = [dic[@"type"] intValue];
  return info;
}

+ (JPushData *)pushDataFromDic:(NSDictionary *)dic {
  JPushData *data = [JPushData new];
  data.content = dic[@"content"];
  data.extra = dic[@"extra"];
  return data;
}

+ (JMessageContent *)messageContentFromString:(NSString *)string
                                         type:(nonnull NSString *)contentType {
  NSData *data = [string dataUsingEncoding:NSUTF8StringEncoding];
  JMessageContent *content;
  if ([contentType isEqualToString:@"jg:text"]) {
    content = [self textMessageFromData:data];
  } else if ([contentType isEqualToString:@"jg:file"]) {
    content = [self fileMessageFromData:data];
  } else if ([contentType isEqualToString:@"jg:img"]) {
    content = [self imageMessageFromData:data];
  } else if ([contentType isEqualToString:@"jg:recallinfo"]) {
    content = [self recallInfoMessageFromData:data];
  } else if ([contentType isEqualToString:@"jg:video"]) {
    content = [self videoMessageFromData:data];
  } else if ([contentType isEqualToString:@"jg:voice"]) {
    content = [self voiceMessageFromData:data];
  } else if ([contentType isEqualToString:@"jg:merge"]) {
    content = [self mergeMessageFromData:data];
  } else {
    content = [self unknownMessageFromString:string type:contentType];
  }
  return content;
}

+ (JMediaMessageContent *)mediaMessageContentFromString:(NSString *)string
                                                   type:(nonnull NSString *)
                                                            contentType {
  NSData *data = [string dataUsingEncoding:NSUTF8StringEncoding];
  JMediaMessageContent *content;
  if ([contentType isEqualToString:@"jg:img"]) {
    content = [JModelFactory imageMessageFromData:data];
  } else if ([contentType isEqualToString:@"jg:video"]) {
    content = [self videoMessageFromData:data];
  } else if ([contentType isEqualToString:@"jg:voice"]) {
    content = [self voiceMessageFromData:data];
  } else if ([contentType isEqualToString:@"jg:file"]) {
    content = [self fileMessageFromData:data];
  }
  return content;
}

+ (JTextMessage *)textMessageFromData:(NSData *)data {
  JTextMessage *text = [JTextMessage new];
  [text decode:data];
  return text;
}

+ (JImageMessage *)imageMessageFromData:(NSData *)data {
  JImageMessage *image = [JImageMessage new];
  [image decode:data];
  return image;
}

+ (JFileMessage *)fileMessageFromData:(NSData *)data {
  JFileMessage *file = [JFileMessage new];
  [file decode:data];
  return file;
}

+ (JRecallInfoMessage *)recallInfoMessageFromData:(NSData *)data {
  JRecallInfoMessage *recallInfo = [JRecallInfoMessage new];
  [recallInfo decode:data];
  return recallInfo;
}

+ (JVideoMessage *)videoMessageFromData:(NSData *)data {
  JVideoMessage *video = [JVideoMessage new];
  [video decode:data];
  return video;
}

+ (JVoiceMessage *)voiceMessageFromData:(NSData *)data {
  JVoiceMessage *voice = [JVoiceMessage new];
  [voice decode:data];
  return voice;
}

+ (JMergeMessage *)mergeMessageFromData:(NSData *)data {
  JMergeMessage *merge = [JMergeMessage new];
  [merge decode:data];
  return merge;
}

+ (JUnknownMessage *)unknownMessageFromString:(NSString *)string
                                         type:(NSString *)contentType {
  JUnknownMessage *unknown = [JUnknownMessage new];
  unknown.content = string;
  unknown.messageType = contentType;
  return unknown;
}

#pragma mark - extension
+ (void)extendDic:(NSMutableDictionary *)dic
    forConversationInfo:(JConversationInfo *)info {
  if (info.conversation.conversationType == JConversationTypePrivate) {
    JUserInfo *userInfo = [JIM.shared.userInfoManager
        getUserInfo:info.conversation.conversationId];
    if (userInfo.userName.length > 0) {
      [dic setObject:userInfo.userName forKey:@"name"];
    }
    if (userInfo.portrait.length > 0) {
      [dic setObject:userInfo.portrait forKey:@"portrait"];
    }
    if (userInfo.extraDic.count > 0) {
      [dic setObject:userInfo.extraDic forKey:@"extra"];
    }
  } else if (info.conversation.conversationType == JConversationTypeGroup) {
    JGroupInfo *groupInfo = [JIM.shared.userInfoManager
        getGroupInfo:info.conversation.conversationId];
    if (groupInfo.groupName.length > 0) {
      [dic setObject:groupInfo.groupName forKey:@"name"];
    }
    if (groupInfo.portrait.length > 0) {
      [dic setObject:groupInfo.portrait forKey:@"portrait"];
    }
    if (groupInfo.extraDic.count > 0) {
      [dic setObject:groupInfo.extraDic forKey:@"extra"];
    }
  }
}

+ (void)extendDic:(NSMutableDictionary *)dic forMessage:(JMessage *)message {
  JUserInfo *userInfo =
      [JIM.shared.userInfoManager getUserInfo:message.senderUserId];
  if (userInfo) {
    NSDictionary *userInfoDic = [JModelFactory userInfoToDic:userInfo];
    [dic setObject:userInfoDic forKey:@"sender"];
  }
}

@end
