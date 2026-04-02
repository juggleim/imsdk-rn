package com.juggleim.push;

import android.content.Intent;

import androidx.annotation.Nullable;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;

import java.util.Map;

import cn.jpush.android.api.JPushInterface;

/**
 * Android 推送原生模块
 */
public class JuggleIMPushModule extends ReactContextBaseJavaModule {
    private static final String MODULE_NAME = "JuggleIMPushModule";

    public JuggleIMPushModule(ReactApplicationContext reactContext) {
        super(reactContext);
        JuggleIMPushEventStore.attachReactContext(reactContext);
    }

    @Override
    public String getName() {
        return MODULE_NAME;
    }

    /**
     * 初始化极光推送
     * @param promise Promise
     */
    @ReactMethod
    public void initJGPush(Promise promise) {
        try {
            JPushInterface.init(getReactApplicationContext());
            promise.resolve(null);
        } catch (Throwable throwable) {
            promise.reject("INIT_JG_PUSH_ERROR", throwable);
        }
    }

    /**
     * 获取 registrationId
     * @param promise Promise
     */
    @ReactMethod
    public void getRegistrationId(Promise promise) {
        try {
            promise.resolve(JPushInterface.getRegistrationID(getReactApplicationContext()));
        } catch (Throwable throwable) {
            promise.reject("GET_REGISTRATION_ID_ERROR", throwable);
        }
    }

    /**
     * 获取最近一次启动通知参数
     * @param promise Promise
     */
    @ReactMethod
    public void getLaunchNotification(Promise promise) {
        Map<String, String> extras = JuggleIMPushEventStore.consumeLaunchNotification();
        if (extras == null) {
            promise.resolve(null);
            return;
        }
        promise.resolve(Arguments.makeNativeMap(extras));
    }

    @ReactMethod
    public void addListener(String eventName) {
        // Required for RN built-in Event Emitter Calls.
    }

    @ReactMethod
    public void removeListeners(Integer count) {
        // Required for RN built-in Event Emitter Calls.
    }

    /**
     * 处理宿主 Activity 启动 Intent
     * @param intent 启动 Intent
     */
    public static void handleIntent(@Nullable Intent intent) {
        Map<String, String> extras = JuggleIMPushIntentParser.fromIntent(intent);
        if (extras != null) {
            JuggleIMPushEventStore.onNotificationClick(extras);
        }
    }
}
