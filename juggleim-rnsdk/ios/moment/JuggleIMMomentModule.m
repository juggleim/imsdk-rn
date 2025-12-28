#import "JuggleIMMomentModule.h"
#import "../JModelFactory.h"
#import <JuggleIM/JuggleIM.h>

@implementation JuggleIMMomentModule

RCT_EXPORT_MODULE()

- (id<JMomentProtocol>)getMomentManager {
  return [JIM.shared momentManager];
}

RCT_EXPORT_METHOD(addMoment : (NSString *)content mediaList : (NSArray *)
                      mediaList resolver : (RCTPromiseResolveBlock)
                          resolve rejecter : (RCTPromiseRejectBlock)reject) {
  NSMutableArray *mediaArray = [NSMutableArray array];
  if (mediaList) {
    for (NSDictionary *dic in mediaList) {
      JMomentMedia *media = [JModelFactory momentMediaFromDic:dic];
      if (media) {
        [mediaArray addObject:media];
      }
    }
  }

  [[self getMomentManager]
      addMoment:content
      mediaList:mediaArray
       complete:^(JErrorCode errorCode, JMoment *_Nullable moment) {
         if (errorCode == JErrorCodeNone) {
           resolve([JModelFactory momentToDic:moment]);
         } else {
           reject([NSString stringWithFormat:@"%ld", (long)errorCode],
                  @"addMoment failed", nil);
         }
       }];
}

RCT_EXPORT_METHOD(removeMoment : (NSString *)momentId resolver : (
    RCTPromiseResolveBlock)resolve rejecter : (RCTPromiseRejectBlock)reject) {
  [[self getMomentManager]
      removeMoment:momentId
          complete:^(JErrorCode errorCode) {
            if (errorCode == JErrorCodeNone) {
              resolve(nil);
            } else {
              reject([NSString stringWithFormat:@"%ld", (long)errorCode],
                     @"removeMoment failed", nil);
            }
          }];
}

RCT_EXPORT_METHOD(getCachedMomentList : (NSDictionary *)optionMap resolver : (
    RCTPromiseResolveBlock)resolve rejecter : (RCTPromiseRejectBlock)reject) {
  JGetMomentOption *option = [JModelFactory getMomentOptionFromDic:optionMap];
  NSArray *list = [[self getMomentManager] getCachedMomentList:option];
  NSMutableArray *array = [NSMutableArray array];
  for (JMoment *moment in list) {
    [array addObject:[JModelFactory momentToDic:moment]];
  }
  resolve(array);
}

RCT_EXPORT_METHOD(getMomentList : (NSDictionary *)optionMap resolver : (
    RCTPromiseResolveBlock)resolve rejecter : (RCTPromiseRejectBlock)reject) {
  JGetMomentOption *option = [JModelFactory getMomentOptionFromDic:optionMap];
  [[self getMomentManager]
      getMomentList:option
           complete:^(JErrorCode errorCode,
                      NSArray<JMoment *> *_Nullable momentList, BOOL isFinish) {
             if (errorCode == JErrorCodeNone) {
               NSMutableArray *array = [NSMutableArray array];
               for (JMoment *moment in momentList) {
                 [array addObject:[JModelFactory momentToDic:moment]];
               }
               resolve(@{@"list" : array, @"isFinished" : @(isFinish)});
             } else {
               reject([NSString stringWithFormat:@"%ld", (long)errorCode],
                      @"getMomentList failed", nil);
             }
           }];
}

RCT_EXPORT_METHOD(getMoment : (NSString *)momentId resolver : (
    RCTPromiseResolveBlock)resolve rejecter : (RCTPromiseRejectBlock)reject) {
  [[self getMomentManager]
      getMoment:momentId
       complete:^(JErrorCode errorCode, JMoment *_Nullable moment) {
         if (errorCode == JErrorCodeNone) {
           resolve([JModelFactory momentToDic:moment]);
         } else {
           reject([NSString stringWithFormat:@"%ld", (long)errorCode],
                  @"getMoment failed", nil);
         }
       }];
}

RCT_EXPORT_METHOD(addComment : (NSString *)momentId parentCommentId : (
    NSString *)parentCommentId content : (NSString *)
                      content resolver : (RCTPromiseResolveBlock)
                          resolve rejecter : (RCTPromiseRejectBlock)reject) {
  [[self getMomentManager]
           addComment:momentId
      parentCommentId:parentCommentId
              content:content
             complete:^(JErrorCode errorCode,
                        JMomentComment *_Nullable comment) {
               if (errorCode == JErrorCodeNone) {
                 resolve([JModelFactory momentCommentToDic:comment]);
               } else {
                 reject([NSString stringWithFormat:@"%ld", (long)errorCode],
                        @"addComment failed", nil);
               }
             }];
}

RCT_EXPORT_METHOD(removeComment : (NSString *)momentId commentId : (NSString *)
                      commentId resolver : (RCTPromiseResolveBlock)
                          resolve rejecter : (RCTPromiseRejectBlock)reject) {
  [[self getMomentManager]
      removeComment:commentId
           momentId:momentId
           complete:^(JErrorCode errorCode) {
             if (errorCode == JErrorCodeNone) {
               resolve(nil);
             } else {
               reject([NSString stringWithFormat:@"%ld", (long)errorCode],
                      @"removeComment failed", nil);
             }
           }];
}

RCT_EXPORT_METHOD(getCommentList : (NSDictionary *)optionMap resolver : (
    RCTPromiseResolveBlock)resolve rejecter : (RCTPromiseRejectBlock)reject) {
  JGetMomentCommentOption *option =
      [JModelFactory getMomentCommentOptionFromDic:optionMap];
  [[self getMomentManager]
      getCommentList:option
            complete:^(JErrorCode errorCode,
                       NSArray<JMomentComment *> *_Nullable commentList,
                       BOOL isFinish) {
              if (errorCode == JErrorCodeNone) {
                NSMutableArray *array = [NSMutableArray array];
                for (JMomentComment *comment in commentList) {
                  [array addObject:[JModelFactory momentCommentToDic:comment]];
                }
                resolve(@{@"list" : array, @"isFinished" : @(isFinish)});
              } else {
                reject([NSString stringWithFormat:@"%ld", (long)errorCode],
                       @"getCommentList failed", nil);
              }
            }];
}

RCT_EXPORT_METHOD(addReaction : (NSString *)momentId key : (NSString *)
                      key resolver : (RCTPromiseResolveBlock)
                          resolve rejecter : (RCTPromiseRejectBlock)reject) {
  [[self getMomentManager]
      addReaction:momentId
              key:key
         complete:^(JErrorCode errorCode) {
           if (errorCode == JErrorCodeNone) {
             resolve(nil);
           } else {
             reject([NSString stringWithFormat:@"%ld", (long)errorCode],
                    @"addReaction failed", nil);
           }
         }];
}

RCT_EXPORT_METHOD(removeReaction : (NSString *)momentId key : (NSString *)
                      key resolver : (RCTPromiseResolveBlock)
                          resolve rejecter : (RCTPromiseRejectBlock)reject) {
  [[self getMomentManager]
      removeReaction:momentId
                 key:key
            complete:^(JErrorCode errorCode) {
              if (errorCode == JErrorCodeNone) {
                resolve(nil);
              } else {
                reject([NSString stringWithFormat:@"%ld", (long)errorCode],
                       @"removeReaction failed", nil);
              }
            }];
}

RCT_EXPORT_METHOD(getReactionList : (NSString *)momentId resolver : (
    RCTPromiseResolveBlock)resolve rejecter : (RCTPromiseRejectBlock)reject) {
  [[self getMomentManager]
      getReactionList:momentId
             complete:^(JErrorCode errorCode,
                        NSArray<JMomentReaction *> *_Nullable reactionList) {
               if (errorCode == JErrorCodeNone) {
                 NSMutableArray *array = [NSMutableArray array];
                 for (JMomentReaction *reaction in reactionList) {
                   [array
                       addObject:[JModelFactory momentReactionToDic:reaction]];
                 }
                 resolve(array);
               } else {
                 reject([NSString stringWithFormat:@"%ld", (long)errorCode],
                        @"getReactionList failed", nil);
               }
             }];
}

@end
