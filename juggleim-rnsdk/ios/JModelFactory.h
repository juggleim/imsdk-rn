//
//  JModelFactory.h
//  juggle_im
//
//  Created by Fei Li on 2025/5/22.
//

#import <Foundation/Foundation.h>
#import <JuggleIM/JuggleIM.h>

NS_ASSUME_NONNULL_BEGIN

@interface JModelFactory : NSObject

+ (NSDictionary *)conversationToDic:(JConversation *)conversation;
+ (NSDictionary *)conversationMentionMessageToDic:(JConversationMentionMessage *)message;
+ (NSDictionary *)conversationMentionInfoToDic:(JConversationMentionInfo *)info;
+ (NSDictionary *)conversationInfoToDic:(JConversationInfo *)conversationInfo;
+ (NSString *)messageContentToString:(JMessageContent *)content;
+ (NSDictionary *)groupMessageReadInfoToDic:(JGroupMessageReadInfo *)info;
+ (NSDictionary *)groupMessageMemberReadDetailToDic:(JGroupMessageMemberReadDetail *)detail;
+ (NSDictionary *)userInfoToDic:(JUserInfo *)info;
+ (NSDictionary *)groupInfoToDic:(JGroupInfo *)info;
+ (NSDictionary *)groupMemberToDic:(JGroupMember *)member;
+ (NSDictionary *)messageMentionInfoToDic:(JMessageMentionInfo *)info;
+ (NSDictionary *)messageToDic:(JMessage *)message;
+ (NSDictionary *)favoriteMessageToDic:(JFavoriteMessage *)message;
+ (NSDictionary *)messageReactionToDic:(JMessageReaction *)reaction;
+ (NSDictionary *)callMemberToDic:(JCallMember *)callMember;
+ (NSDictionary *)callSessionToDic:(id<JCallSession>)callSession;
+ (NSDictionary *)callInfoToDic:(JCallInfo *)callInfo;
+ (NSDictionary *)searchConversationResultToDic:(JSearchConversationsResult *)result;
+ (NSDictionary *)momentToDic:(JMoment *)moment;
+ (NSDictionary *)momentMediaToDic:(JMomentMedia *)media;
+ (NSDictionary *)momentReactionToDic:(JMomentReaction *)reaction;
+ (NSDictionary *)momentCommentToDic:(JMomentComment *)comment;

+ (JConversation *)conversationFromDic:(NSDictionary *)dic;
+ (JMessage *)messageFromDic:(NSDictionary *)dic;
+ (JMessageOptions *)sendMessageOptionFromDic:(NSDictionary *)dic;
+ (JGetMessageOptions *)getMessageOptionFromDic:(NSDictionary *)dic;
+ (JMomentMedia *)momentMediaFromDic:(NSDictionary *)dic;
+ (JGetMomentOption *)getMomentOptionFromDic:(NSDictionary *)dic;
+ (JGetMomentCommentOption *)getMomentCommentOptionFromDic:(NSDictionary *)dic;

+ (JMessageContent *)messageContentFromString:(NSString *)string
                                         type:(nonnull NSString *)contentType;
+ (JMediaMessageContent *)mediaMessageContentFromString:(NSString *)string
                                                type:(NSString *)contentType;

@end

NS_ASSUME_NONNULL_END
