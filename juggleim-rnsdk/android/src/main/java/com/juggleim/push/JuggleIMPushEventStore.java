package com.juggleim.push;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.modules.core.DeviceEventManagerModule;

import java.util.Map;
import java.util.TreeMap;

/**
 * 推送点击事件缓存器
 */
public final class JuggleIMPushEventStore {
    private static final String EVENT_NAME = "JuggleIMPush_onNotificationClick";
    private static Map<String, String> latestLaunchNotification;
    private static String latestFingerprint;
    private static long latestEventAt;
    private static ReactApplicationContext reactContext;

    private JuggleIMPushEventStore() {
    }

    /**
     * 绑定 React 上下文
     * @param context RN 上下文
     */
    public static synchronized void attachReactContext(ReactApplicationContext context) {
        reactContext = context;
    }

    /**
     * 缓存并分发通知点击事件
     * @param extras 原始推送参数
     */
    public static synchronized void onNotificationClick(Map<String, String> extras) {
        if (extras == null || extras.isEmpty()) {
            return;
        }
        String fingerprint = buildFingerprint(extras);
        long now = System.currentTimeMillis();
        if (fingerprint.equals(latestFingerprint) && now - latestEventAt < 1500L) {
            return;
        }
        latestFingerprint = fingerprint;
        latestEventAt = now;
        latestLaunchNotification = extras;
        emit(extras);
    }

    /**
     * 获取并清空最近一次启动通知
     * @return 最近一次推送参数
     */
    public static synchronized Map<String, String> consumeLaunchNotification() {
        Map<String, String> result = latestLaunchNotification;
        latestLaunchNotification = null;
        return result;
    }

    /**
     * 派发推送点击事件
     * @param extras 原始推送参数
     */
    private static void emit(Map<String, String> extras) {
        if (reactContext == null || !reactContext.hasActiveReactInstance()) {
            return;
        }
        WritableMap params = Arguments.createMap();
        WritableMap extrasMap = Arguments.createMap();
        for (Map.Entry<String, String> entry : extras.entrySet()) {
            extrasMap.putString(entry.getKey(), entry.getValue());
        }
        params.putMap("extras", extrasMap);
        reactContext
                .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                .emit(EVENT_NAME, params);
    }

    /**
     * 生成 payload 指纹
     * @param extras 原始推送参数
     * @return 指纹字符串
     */
    private static String buildFingerprint(Map<String, String> extras) {
        StringBuilder builder = new StringBuilder();
        for (Map.Entry<String, String> entry : new TreeMap<>(extras).entrySet()) {
            builder.append(entry.getKey()).append('=').append(entry.getValue()).append('&');
        }
        return builder.toString();
    }
}
