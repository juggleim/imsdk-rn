#import "ZegoSurfaceView.h"

@implementation ZegoSurfaceView

- (instancetype)initWithFrame:(CGRect)frame {
  if (self = [super initWithFrame:frame]) {
    // videoView will be created lazily in layoutSubviews when bounds are
    // available
  }
  return self;
}

- (instancetype)init {
  if (self = [super init]) {
    // videoView will be created lazily in layoutSubviews when bounds are
    // available
  }
  return self;
}

- (void)setupVideoView {
  NSLog(@"[ZegoSurfaceView] setupVideoView with bounds: %@",
        NSStringFromCGRect(self.bounds));
  // Create a container view for video rendering
  _videoView = [[UIView alloc] initWithFrame:self.bounds];
  _videoView.autoresizingMask =
      UIViewAutoresizingFlexibleWidth | UIViewAutoresizingFlexibleHeight;
  _videoView.backgroundColor = [UIColor blackColor];
  [self addSubview:_videoView];
}

- (void)layoutSubviews {
  [super layoutSubviews];

  // Lazy initialization of videoView when bounds are available
  if (!_videoView && !CGRectIsEmpty(self.bounds)) {
    [self setupVideoView];
  }

  if (_videoView) {
    _videoView.frame = self.bounds;
  }
}

@end
