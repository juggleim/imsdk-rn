#import "JuggleIMManager.h"
#import <JuggleIM/JuggleIM.h>
#import <React/RCTEventEmitter.h>

/**
 * Juggle IM React Native iOS 模块
 */
@interface JuggleIMManager () <JConnectionDelegate>

@end

@implementation JuggleIMManager

RCT_EXPORT_MODULE(JuggleIM);

RCT_EXPORT_METHOD(setServerUrls:(NSArray *)urls) {
    [[JIM shared] setServerUrls:urls];
}

RCT_EXPORT_METHOD(initWithAppKey:(NSString *)appKey) {
    [[JIM shared] initWithAppKey:appKey];
    [JIM.shared setConsoleLogLevel:JLogLevelVerbose];
}

RCT_EXPORT_METHOD(connectWithToken:(NSString *)token) {
    [JIM.shared.connectionManager connectWithToken:token];
}

- (NSArray<NSString *> *)supportedEvents {
    return @[@"ConnectionStatusChanged", @"DbDidOpen", @"DbDidClose"];
}

/**
 * 添加连接状态监听器
 */
RCT_EXPORT_METHOD(addConnectionDelegate) {
    [JIM.shared.connectionManager addDelegate:self];
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
    NSLog(@"connectionStatusDidChange: %@, code: %ld, extra: %@", statusString, (long)code, extra);
    
    [self sendEventWithName:@"ConnectionStatusChanged" body:@{
        @"status": statusString,
        @"code": @(code),
        @"extra": extra ?: @""
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

@end