//
//  JRNCustomMessageContent.m
//  juggleim-rnsdk
//

#import "JRNCustomMessageContent.h"
#import <objc/runtime.h>

@implementation JRNCustomMessageContent

// 基类占位，实际类型由动态子类重写返回。
+ (NSString *)contentType {
  return @"jg:rn:custom";
}

- (NSData *)encode {
  return self.rawData ?: [NSData data];
}

- (void)decode:(NSData *)data {
  self.rawData = data;
}

// 会话摘要由 RN 层渲染，这里返回空串即可，
// 关键是「能被解析」从而让会话列表 lastMessage 正常填充。
- (NSString *)conversationDigest {
  return @"";
}

+ (Class)registerableClassForContentType:(NSString *)contentType {
  if (contentType.length == 0) {
    return [JRNCustomMessageContent class];
  }

  // 类名需为合法标识符（去掉冒号等非字母数字字符）；
  // 注意 +contentType 仍返回原始字符串（含冒号），SDK 据此做类型映射。
  NSMutableString *safe = [NSMutableString stringWithString:@"JRNCustom_"];
  for (NSUInteger i = 0; i < contentType.length; i++) {
    unichar c = [contentType characterAtIndex:i];
    BOOL isAlnum = (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z') ||
                   (c >= '0' && c <= '9');
    [safe appendString:isAlnum ? [NSString stringWithFormat:@"%C", c] : @"_"];
  }
  const char *className = safe.UTF8String;

  Class existing = objc_getClass(className);
  if (existing) {
    return existing;
  }

  Class cls = objc_allocateClassPair([JRNCustomMessageContent class], className, 0);
  if (!cls) {
    // 并发/重名兜底
    return objc_getClass(className) ?: [JRNCustomMessageContent class];
  }

  // 在元类上重写 + (NSString *)contentType，返回原始 contentType。
  NSString *typeCopy = [contentType copy];
  IMP ctImp = imp_implementationWithBlock(^NSString *(id _self) {
    return typeCopy;
  });
  Class meta = object_getClass(cls);
  class_addMethod(meta, @selector(contentType), ctImp, "@@:");

  objc_registerClassPair(cls);
  return cls;
}

@end
