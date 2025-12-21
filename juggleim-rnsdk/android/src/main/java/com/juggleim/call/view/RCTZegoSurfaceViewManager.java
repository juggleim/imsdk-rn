
package com.juggleim.call.view;

import com.facebook.react.uimanager.SimpleViewManager;
import com.facebook.react.uimanager.ThemedReactContext;
import com.facebook.react.uimanager.annotations.ReactProp;

import androidx.annotation.NonNull;

public class RCTZegoSurfaceViewManager extends SimpleViewManager<ZegoSurfaceView> {
    @NonNull
    @Override
    public String getName() {
        return "RCTZegoSurfaceView";
    }

    @NonNull
    @Override
    protected ZegoSurfaceView createViewInstance(@NonNull ThemedReactContext reactContext) {
        return new ZegoSurfaceView(reactContext);
    }

    @ReactProp(name = "zOrderMediaOverlay")
    public void setZOrderMediaOverlay(ZegoSurfaceView view, boolean isMediaOverlay) {
        view.setZOrderMediaOverlay(isMediaOverlay);
    }

    @ReactProp(name = "zOrderOnTop")
    public void setZOrderOnTop(ZegoSurfaceView view, boolean onTop) {
        view.setZOrderOnTop(onTop);
    }
}
