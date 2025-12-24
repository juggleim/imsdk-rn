#import "ZegoSurfaceViewManager.h"
#import "ZegoSurfaceView.h"

@implementation ZegoSurfaceViewManager

RCT_EXPORT_MODULE(ZegoSurfaceView)

- (UIView *)view {
  return [[ZegoSurfaceView alloc] init];
}

@end
