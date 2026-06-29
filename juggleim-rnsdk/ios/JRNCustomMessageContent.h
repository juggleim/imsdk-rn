//
//  JRNCustomMessageContent.h
//  juggleim-rnsdk
//
//  RN 自定义消息的通用承载类。
//
//  原生 JuggleIM SDK 要求自定义消息类型必须通过 messageManager 的
//  registerContentType: 注册，否则 SDK 无法解析该类型——表现为会话列表的
//  lastMessage 变成空壳（messageId/contentType 为空，content.contentType
//  回退成 "jg:unknown"）。详见 JMessageProtocol.h 与 JMessageContent.h
//  (conversationDigest 注释：会话列表中显示的消息摘要)。
//
//  RN 层只持有类型字符串、没有逐类型的 ObjC 类，因此用本类做透传：
//  decode: 仅保存原始字节，encode 原样返回，由 RN 层自行解析 JSON。
//  每个 contentType 在运行时动态生成一个子类（仅重写 +contentType）。
//

#import <JuggleIM/JuggleIM.h>

NS_ASSUME_NONNULL_BEGIN

@interface JRNCustomMessageContent : JMessageContent

/// 原始消息内容字节（即业务 JSON），由 SDK decode: 填入、encode 原样取出。
@property (nonatomic, strong, nullable) NSData *rawData;

/// 为指定 contentType 动态创建并返回可注册的子类（幂等，可重复调用）。
+ (Class)registerableClassForContentType:(NSString *)contentType;

@end

NS_ASSUME_NONNULL_END
