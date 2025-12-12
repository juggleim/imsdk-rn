#import "GenericCustomMessage.h"

@implementation GenericCustomMessage

+ (NSString *)contentType {
  return @"jgrn:custom";
}

- (NSData *)encode {
  return self.data;
}

- (void)decode:(NSData *)data {
  self.data = data;
}

- (void)setData:(NSData *)data {
  _data = data;
}

- (NSData *)getData {
  return _data;
}

- (NSString *)conversationDigest {
  return @"[自定义消息]";
}

@end
