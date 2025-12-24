#import "ZegoSurfaceView.h"

@implementation ZegoSurfaceView

- (instancetype)initWithFrame:(CGRect)frame {
  if (self = [super initWithFrame:frame]) {
    [self setupVideoView];
  }
  return self;
}

- (instancetype)init {
  if (self = [super init]) {
    [self setupVideoView];
  }
  return self;
}

- (void)setupVideoView {
  // Create a container view for video rendering
  _videoView = [[UIView alloc] initWithFrame:self.bounds];
  _videoView.autoresizingMask =
      UIViewAutoresizingFlexibleWidth | UIViewAutoresizingFlexibleHeight;
  _videoView.backgroundColor = [UIColor blackColor];
  [self addSubview:_videoView];
}

- (void)layoutSubviews {
  [super layoutSubviews];
  _videoView.frame = self.bounds;
}

@end
