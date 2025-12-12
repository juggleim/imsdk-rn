#import <JuggleIM/JuggleIM.h>

/**
 * 通用自定义消息类
 * 用于承载 RN 层自定义消息的 JSON 数据
 */
@interface GenericCustomMessage : JMessageContent

/**
 * 消息数据
 */
@property(nonatomic, strong) NSData *data;

/**
 * 设置消息数据
 */
- (void)setData:(NSData *)data;

/**
 * 获取消息数据
 */
- (NSData *)getData;

@end
