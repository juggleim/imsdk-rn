
package com.juggleim.call.view;

import android.content.Context;
import android.view.SurfaceView;
import android.widget.FrameLayout;

import androidx.annotation.NonNull;

public class ZegoSurfaceView extends FrameLayout {

    private SurfaceView surfaceView;

    public ZegoSurfaceView(@NonNull Context context) {
        super(context);
        surfaceView = new SurfaceView(context);
        addView(surfaceView);
    }

    public SurfaceView getView() {
        return surfaceView;
    }

    public void setZOrderMediaOverlay(boolean isMediaOverlay) {
        removeView(surfaceView);
        surfaceView.setZOrderMediaOverlay(isMediaOverlay);
        addView(surfaceView);
    }

    public void setZOrderOnTop(boolean onTop) {
        removeView(surfaceView);
        surfaceView.setZOrderOnTop(onTop);
        addView(surfaceView);
    }

    @Override
    protected void onMeasure(int widthMeasureSpec, int heightMeasureSpec) {
        int width = MeasureSpec.getSize(widthMeasureSpec);
        int height = MeasureSpec.getSize(heightMeasureSpec);
        surfaceView.layout(0, 0, width, height);
        super.onMeasure(widthMeasureSpec, heightMeasureSpec);
    }
}
