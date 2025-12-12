#import "GenericCustomMessage.h"

static NSString *jsType = @"jgrn:custom";

@implementation GenericCustomMessage

+ (void)setJsType:(NSString *)type {
  jsType = type;
}

+ (NSString *)contentType {
  return jsType;
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
