# iOS Call Module - File Summary

## Created Files

### Bridge Module
- `ios/call/JuggleIMCallModule.h` - Main bridge module header
- `ios/call/JuggleIMCallModule.m` - Main bridge module implementation (450+ lines)

### View Components
- `ios/call/view/ZegoSurfaceView.h` - Video surface view header
- `ios/call/view/ZegoSurfaceView.m` - Video surface view implementation
- `ios/call/view/ZegoSurfaceViewManager.h` - View manager header
- `ios/call/view/ZegoSurfaceViewManager.m` - View manager implementation

## Modified Files

### Field Mapping Fixes
- `ios/JModelFactory.m`
  - Line 330: `inviterId` → `inviter`
  - Line 343: Added `currentMember` field
  - Line 163: `userName` → `nickname`
  - Line 167: `portrait` → `avatar`

## Directory Structure
```
ios/
├── call/
│   ├── JuggleIMCallModule.h
│   ├── JuggleIMCallModule.m
│   └── view/
│       ├── ZegoSurfaceView.h
│       ├── ZegoSurfaceView.m
│       ├── ZegoSurfaceViewManager.h
│       └── ZegoSurfaceViewManager.m
├── JModelFactory.h (existing, no changes)
└── JModelFactory.m (modified)
```

## TODO Items

See `walkthrough.md` for detailed TODO items that need verification:
1. Zego engine initialization appSign parameter
2. Remove delegate methods availability
3. Video denoise parameters conversion

## Next Steps

1. Verify TODO items against iOS SDK
2. Register modules in Xcode project/podspec
3. Test compilation
4. Test runtime functionality
