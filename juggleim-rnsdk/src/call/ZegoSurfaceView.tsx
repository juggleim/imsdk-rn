
import React from 'react';
import {
    requireNativeComponent,
    ViewProps,
    Platform,
    View
} from 'react-native';


export interface SurfaceViewProps extends ViewProps {
    zOrderMediaOverlay?: boolean;
    zOrderOnTop?: boolean;
}

const ZegoSurfaceViewManager = Platform.select<React.ComponentType<SurfaceViewProps>>({
    ios: View as React.ComponentType<SurfaceViewProps>,  // UIView
    android: requireNativeComponent<SurfaceViewProps>('RCTZegoSurfaceView'),  // * android.view.SurfaceView
})!;


export const ZegoSurfaceView: React.FC<SurfaceViewProps> = (props) => {
    return <ZegoSurfaceViewManager {...props} />;
};
