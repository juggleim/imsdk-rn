#import "JuggleIMCallModule.h"
#import "../JModelFactory.h"
#import "view/ZegoSurfaceView.h"
#import <JuggleIM/JuggleIM.h>
#import <React/RCTEventEmitter.h>

@interface JuggleIMCallModule () <JCallReceiveDelegate,
                                  JConversationCallDelegate>

@property(nonatomic, strong)
    NSMutableDictionary<NSString *, id<JCallReceiveDelegate>> *receiveListeners;
@property(nonatomic, strong)
    NSMutableDictionary<NSString *, id<JConversationCallDelegate>>
        *conversationCallListeners;
@property(nonatomic, strong) NSMutableDictionary<
    NSString *, NSMutableDictionary<NSString *, id<JCallSessionDelegate>> *>
    *sessionListeners;

@end

#pragma mark - JCallSessionDelegateWrapper (declaration)

@interface JCallSessionDelegateWrapper : NSObject <JCallSessionDelegate>

@property(nonatomic, copy) NSString *callId;
@property(nonatomic, copy) NSString *key;
@property(nonatomic, weak) JuggleIMCallModule *module;

- (instancetype)initWithCallId:(NSString *)callId
                           key:(NSString *)key
                        module:(JuggleIMCallModule *)module;

@end

@implementation JuggleIMCallModule

RCT_EXPORT_MODULE(JuggleIMCallModule);

- (instancetype)init {
  if (self = [super init]) {
    _receiveListeners = [NSMutableDictionary dictionary];
    _conversationCallListeners = [NSMutableDictionary dictionary];
    _sessionListeners = [NSMutableDictionary dictionary];
  }
  return self;
}

+ (BOOL)requiresMainQueueSetup {
  return YES;
}

- (NSArray<NSString *> *)supportedEvents {
  return @[
    @"CallManager_onCallReceive", @"CallManager_onCallInfoUpdate",
    @"CallSession_onCallConnect", @"CallSession_onCallFinish",
    @"CallSession_onErrorOccur", @"CallSession_onUsersInvite",
    @"CallSession_onUsersConnect", @"CallSession_onUsersLeave",
    @"CallSession_onUserCameraEnable", @"CallSession_onUserMicrophoneEnable",
    @"CallSession_onSoundLevelUpdate", @"CallSession_onVideoFirstFrameRender"
  ];
}

- (id<JCallProtocol>)getCallManager {
  return JIM.shared.callManager;
}

#pragma mark - Engine Initialization

RCT_EXPORT_METHOD(initZegoEngine : (int)appId) {
  // TODO: Verify iOS native method signature - may need appSign parameter
  // Android: initZegoEngine(appId, context)
  // iOS: initZegoEngineWith:appId appSign:appSign
  // Need to check if iOS requires appSign or if it's optional
  [[self getCallManager] initZegoEngineWith:appId appSign:@""];
}

RCT_EXPORT_METHOD(initLiveKitEngine) {
  [[self getCallManager] initLiveKitEngine];
}

RCT_EXPORT_METHOD(initAgoraEngine : (NSString *)appId) {
  [[self getCallManager] initAgoraEngineWith:appId];
}

#pragma mark - Call Management

RCT_EXPORT_METHOD(startSingleCall : (NSString *)userId mediaType : (
    int)mediaType extra : (NSString *)extra resolver : (RCTPromiseResolveBlock)
                      resolve rejecter : (RCTPromiseRejectBlock)reject) {
  @try {
    id<JCallSession> session =
        [[self getCallManager] startSingleCall:userId
                                     mediaType:(JCallMediaType)mediaType
                                         extra:extra
                                      delegate:nil];
    NSDictionary *sessionDic = [JModelFactory callSessionToDic:session];
    resolve(sessionDic);
  } @catch (NSException *exception) {
    reject(@"START_CALL_ERROR", exception.reason, nil);
  }
}

RCT_EXPORT_METHOD(
    startMultiCall : (NSArray<NSString *> *)userIdList mediaType : (int)
        mediaType extra : (NSString *)extra conversationMap : (NSDictionary *)
            conversationMap resolver : (RCTPromiseResolveBlock)
                resolve rejecter : (RCTPromiseRejectBlock)reject) {
  @try {
    JConversation *conversation = nil;
    if (conversationMap) {
      conversation = [JModelFactory conversationFromDic:conversationMap];
    }

    id<JCallSession> session =
        [[self getCallManager] startMultiCall:userIdList
                                    mediaType:(JCallMediaType)mediaType
                                 conversation:conversation
                                        extra:extra
                                     delegate:nil];
    NSDictionary *sessionDic = [JModelFactory callSessionToDic:session];
    resolve(sessionDic);
  } @catch (NSException *exception) {
    reject(@"START_MULTI_CALL_ERROR", exception.reason, nil);
  }
}

RCT_EXPORT_METHOD(joinCall : (NSString *)callId resolver : (
    RCTPromiseResolveBlock)resolve rejecter : (RCTPromiseRejectBlock)reject) {
  @try {
    id<JCallSession> session = [[self getCallManager] joinCall:callId
                                                      delegate:nil];
    NSDictionary *sessionDic = [JModelFactory callSessionToDic:session];
    resolve(sessionDic);
  } @catch (NSException *exception) {
    reject(@"JOIN_CALL_ERROR", exception.reason, nil);
  }
}

RCT_EXPORT_METHOD(getCallSession : (NSString *)callId resolver : (
    RCTPromiseResolveBlock)resolve rejecter : (RCTPromiseRejectBlock)reject) {
  id<JCallSession> session = [[self getCallManager] getCallSession:callId];
  if (session) {
    NSDictionary *sessionDic = [JModelFactory callSessionToDic:session];
    resolve(sessionDic);
  } else {
    resolve([NSNull null]);
  }
}

#pragma mark - Listeners

RCT_EXPORT_METHOD(addReceiveListener : (NSString *)key) {
  __weak typeof(self) weakSelf = self;

  // Create a delegate wrapper that forwards to this module
  id<JCallReceiveDelegate> listener =
      (id<JCallReceiveDelegate>)^(id<JCallSession> callSession) {
        [weakSelf handleCallReceive:callSession forKey:key];
      };

  self.receiveListeners[key] = listener;
  [[self getCallManager] addReceiveDelegate:self];
}

RCT_EXPORT_METHOD(removeReceiveListener : (NSString *)key) {
  [self.receiveListeners removeObjectForKey:key];
  if (self.receiveListeners.count == 0) {
    // TODO: iOS SDK may not have removeReceiveDelegate method
    // Need to verify and potentially keep delegate registered
  }
}

RCT_EXPORT_METHOD(addConversationCallListener : (NSString *)key) {
  __weak typeof(self) weakSelf = self;

  id<JConversationCallDelegate> listener = (id<JConversationCallDelegate>)^(
      JCallInfo *callInfo, JConversation *conversation, BOOL isFinished) {
    [weakSelf handleCallInfoUpdate:callInfo
                      conversation:conversation
                        isFinished:isFinished
                            forKey:key];
  };

  self.conversationCallListeners[key] = listener;
  [[self getCallManager] addConversationCallDelegate:self];
}

RCT_EXPORT_METHOD(removeConversationCallListener : (NSString *)key) {
  [self.conversationCallListeners removeObjectForKey:key];
  if (self.conversationCallListeners.count == 0) {
    // TODO: iOS SDK may not have removeConversationCallDelegate method
  }
}

#pragma mark - Session Control Methods

RCT_EXPORT_METHOD(accept : (NSString *)callId) {
  id<JCallSession> session = [[self getCallManager] getCallSession:callId];
  if (session) {
    [session accept];
  }
}

RCT_EXPORT_METHOD(hangup : (NSString *)callId) {
  id<JCallSession> session = [[self getCallManager] getCallSession:callId];
  if (session) {
    [session hangup];
  }
}

RCT_EXPORT_METHOD(enableCamera : (NSString *)callId enable : (BOOL)enable) {
  id<JCallSession> session = [[self getCallManager] getCallSession:callId];
  if (session) {
    [session enableCamera:enable];
  }
}

RCT_EXPORT_METHOD(muteMicrophone : (NSString *)callId mute : (BOOL)mute) {
  id<JCallSession> session = [[self getCallManager] getCallSession:callId];
  if (session) {
    [session muteMicrophone:mute];
  }
}

RCT_EXPORT_METHOD(muteSpeaker : (NSString *)callId mute : (BOOL)mute) {
  id<JCallSession> session = [[self getCallManager] getCallSession:callId];
  if (session) {
    [session muteSpeaker:mute];
  }
}

RCT_EXPORT_METHOD(setSpeakerEnable : (NSString *)callId enable : (BOOL)enable) {
  id<JCallSession> session = [[self getCallManager] getCallSession:callId];
  if (session) {
    [session setSpeakerEnable:enable];
  }
}

RCT_EXPORT_METHOD(useFrontCamera : (NSString *)callId enable : (BOOL)enable) {
  id<JCallSession> session = [[self getCallManager] getCallSession:callId];
  if (session) {
    [session useFrontCamera:enable];
  }
}

RCT_EXPORT_METHOD(inviteUsers : (NSString *)
                      callId userIdList : (NSArray<NSString *> *)userIdList) {
  id<JCallSession> session = [[self getCallManager] getCallSession:callId];
  if (session) {
    [session inviteUsers:userIdList];
  }
}

RCT_EXPORT_METHOD(enableAEC : (NSString *)callId enable : (BOOL)enable) {
  id<JCallSession> session = [[self getCallManager] getCallSession:callId];
  if (session) {
    [session enableAEC:enable];
  }
}

RCT_EXPORT_METHOD(setVideoDenoiseParams : (NSString *)
                      callId params : (NSDictionary *)params) {
  id<JCallSession> session = [[self getCallManager] getCallSession:callId];
  if (session) {
    // TODO: Convert params dictionary to JCallVideoDenoiseParams
    // Need to check JCallVideoDenoiseParams structure
    JCallVideoDenoiseParams *denoiseParams =
        [[JCallVideoDenoiseParams alloc] init];
    [session setVideoDenoiseParams:denoiseParams];
  }
}

RCT_EXPORT_METHOD(setVideoView : (NSString *)callId userId : (NSString *)
                      userId viewTag : (nonnull NSNumber *)viewTag resolver : (
                          RCTPromiseResolveBlock)
                          resolve rejecter : (RCTPromiseRejectBlock)reject) {
  id<JCallSession> session = [[self getCallManager] getCallSession:callId];
  if (!session) {
    reject(@"NoSession", @"Call session not found", nil);
    return;
  }

  NSNumber *tag = viewTag;
  [self.bridge.uiManager
      addUIBlock:^(RCTUIManager *uiManager,
                   NSDictionary<NSNumber *, UIView *> *viewRegistry) {
        UIView *view = viewRegistry[tag];
        UIView *targetView = view;
        if ([view isKindOfClass:[ZegoSurfaceView class]]) {
          ZegoSurfaceView *zView = (ZegoSurfaceView *)view;
          if (zView.videoView) {
            targetView = zView.videoView;
          }
        }
        NSLog(@"[JuggleIMCallModule] setVideoView callId=%@ viewTag=%@ view=%@ "
              @"targetView=%@",
              callId, tag, view, targetView);
        if (targetView) {
          [session setVideoView:targetView forUserId:userId];
          resolve(nil);
        } else {
          NSString *msg = [NSString
              stringWithFormat:@"setVideoView View not found for tag %@", tag];
          reject(@"ViewNotFound", msg, nil);
        }
      }];
}

RCT_EXPORT_METHOD(startPreview : (NSString *)callId viewTag : (
    nonnull NSNumber *)viewTag resolver : (RCTPromiseResolveBlock)
                      resolve rejecter : (RCTPromiseRejectBlock)reject) {
  dispatch_async(dispatch_get_main_queue(), ^{
    id<JCallSession> session = [[self getCallManager] getCallSession:callId];
    if (!session)
      return;

    UIView *view = [self.bridge.uiManager viewForReactTag:viewTag];
    UIView *targetView = view;
    if ([view isKindOfClass:[ZegoSurfaceView class]]) {
      ZegoSurfaceView *zView = (ZegoSurfaceView *)view;
      if (zView.videoView) {
        targetView = zView.videoView;
      }
    }
    if (targetView) {
      [session startPreview:targetView];
      resolve(nil);
    } else {
      reject(@"View not found", @"View not found", nil);
    }
  });
}

#pragma mark - Session Listeners

RCT_EXPORT_METHOD(addSessionListener : (NSString *)callId key : (NSString *)
                      key) {
  id<JCallSession> session = [[self getCallManager] getCallSession:callId];
  if (!session) {
    NSLog(@"[JuggleIMCallModule] addSessionListener: session is null for "
          @"callId=%@",
          callId);
    return;
  }

  // Create delegate wrapper
  JCallSessionDelegateWrapper *listener =
      [[JCallSessionDelegateWrapper alloc] initWithCallId:callId
                                                      key:key
                                                   module:self];

  // Store listener in nested dictionary structure
  if (!self.sessionListeners[callId]) {
    self.sessionListeners[callId] = [NSMutableDictionary dictionary];
  }
  self.sessionListeners[callId][key] = listener;
    [session addDelegate:listener];
}

RCT_EXPORT_METHOD(removeSessionListener : (NSString *)callId key : (NSString *)
                      key) {
  id<JCallSession> session = [[self getCallManager] getCallSession:callId];
  if (session && self.sessionListeners[callId]) {
    [self.sessionListeners[callId] removeObjectForKey:key];
  }
}

#pragma mark - JCallReceiveDelegate

- (void)callDidReceive:(id<JCallSession>)callSession {
  for (NSString *key in self.receiveListeners) {
    [self handleCallReceive:callSession forKey:key];
  }
}

- (void)handleCallReceive:(id<JCallSession>)callSession forKey:(NSString *)key {
  NSDictionary *sessionDic = [JModelFactory callSessionToDic:callSession];
  [self sendEventWithName:@"CallManager_onCallReceive"
                     body:@{@"key" : key, @"callSession" : sessionDic}];
}

#pragma mark - JConversationCallDelegate

- (void)callInfoDidUpdate:(JCallInfo *)callInfo
           inConversation:(JConversation *)conversation
               isFinished:(BOOL)isFinished {
  for (NSString *key in self.conversationCallListeners) {
    [self handleCallInfoUpdate:callInfo
                  conversation:conversation
                    isFinished:isFinished
                        forKey:key];
  }
}

- (void)handleCallInfoUpdate:(JCallInfo *)callInfo
                conversation:(JConversation *)conversation
                  isFinished:(BOOL)isFinished
                      forKey:(NSString *)key {
  NSDictionary *callInfoDic = [JModelFactory callInfoToDic:callInfo];
  NSDictionary *conversationDic =
      [JModelFactory conversationToDic:conversation];

  [self sendEventWithName:@"CallManager_onCallInfoUpdate"
                     body:@{
                       @"key" : key,
                       @"callInfo" : callInfoDic,
                       @"conversation" : conversationDic,
                       @"isFinished" : @(isFinished)
                     }];
}

@end

#pragma mark - JCallSessionDelegateWrapper

@implementation JCallSessionDelegateWrapper

- (instancetype)initWithCallId:(NSString *)callId
                           key:(NSString *)key
                        module:(JuggleIMCallModule *)module {
  if (self = [super init]) {
    _callId = callId;
    _key = key;
    _module = module;
  }
  return self;
}

- (void)callDidConnect {
  NSLog(@"CallSession_onCallConnect callId=%@", self.callId);
  [self.module sendEventWithName:@"CallSession_onCallConnect"
                            body:@{@"callId" : self.callId}];
}

- (void)callDidFinish:(JCallFinishReason)finishReason {
  NSLog(@"CallSession_onCallFinish callId=%@ finishReason=%ld", self.callId,
        finishReason);
  [self.module sendEventWithName:@"CallSession_onCallFinish"
                            body:@{
                              @"callId" : self.callId,
                              @"finishReason" : @(finishReason)
                            }];
}

- (void)usersDidInvite:(NSArray<NSString *> *)userIdList
             inviterId:(NSString *)inviterId {
  NSLog(@"CallSession_onUsersInvite callId=%@ inviterId=%@ userIdList=%@",
        self.callId, inviterId, userIdList);
  [self.module sendEventWithName:@"CallSession_onUsersInvite"
                            body:@{
                              @"callId" : self.callId,
                              @"inviterId" : inviterId,
                              @"userIdList" : userIdList
                            }];
}

- (void)usersDidConnect:(NSArray<NSString *> *)userIdList {
  NSLog(@"CallSession_onUsersConnect callId=%@ userIdList=%@", self.callId,
        userIdList);
  [self.module
      sendEventWithName:@"CallSession_onUsersConnect"
                   body:@{@"callId" : self.callId, @"userIdList" : userIdList}];
}

- (void)usersDidLeave:(NSArray<NSString *> *)userIdList {
  [self.module
      sendEventWithName:@"CallSession_onUsersLeave"
                   body:@{@"callId" : self.callId, @"userIdList" : userIdList}];
}

- (void)userCamaraDidChange:(BOOL)enable userId:(NSString *)userId {
  NSLog(@"CallSession_onUserCameraEnable callId=%@ userId=%@ enable=%d",
        self.callId, userId, enable);
  [self.module sendEventWithName:@"CallSession_onUserCameraEnable"
                            body:@{
                              @"callId" : self.callId,
                              @"userId" : userId,
                              @"enable" : @(enable)
                            }];
}

- (void)userMicrophoneDidChange:(BOOL)enable userId:(NSString *)userId {
  NSLog(@"CallSession_onUserMicrophoneEnable callId=%@ userId=%@ enable=%d",
        self.callId, userId, enable);
  [self.module sendEventWithName:@"CallSession_onUserMicrophoneEnable"
                            body:@{
                              @"callId" : self.callId,
                              @"userId" : userId,
                              @"enable" : @(enable)
                            }];
}

- (void)soundLevelDidUpdate:
    (NSDictionary<NSString *, NSNumber *> *)soundLevels {
  NSLog(@"CallSession_onSoundLevelUpdate callId=%@ soundLevels=%@", self.callId,
        soundLevels);
  [self.module sendEventWithName:@"CallSession_onSoundLevelUpdate"
                            body:@{
                              @"callId" : self.callId,
                              @"soundLevels" : soundLevels
                            }];
}

- (void)videoFirstFrameDidRender:(NSString *)userId {
  NSLog(@"CallSession_onVideoFirstFrameRender callId=%@ userId=%@", self.callId,
        userId);
  [self.module
      sendEventWithName:@"CallSession_onVideoFirstFrameRender"
                   body:@{@"callId" : self.callId, @"userId" : userId}];
}

- (void)errorDidOccur:(JCallErrorCode)errorCode {
  NSLog(@"CallSession_onErrorOccur callId=%@ errorCode=%ld", self.callId,
        errorCode);
  [self.module sendEventWithName:@"CallSession_onErrorOccur"
                            body:@{
                              @"callId" : self.callId,
                              @"errorCode" : @(errorCode)
                            }];
}

@end
