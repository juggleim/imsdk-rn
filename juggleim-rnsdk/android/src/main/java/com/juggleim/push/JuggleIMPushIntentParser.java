package com.juggleim.push;

import android.content.Intent;
import android.os.Bundle;

import androidx.annotation.Nullable;

import java.util.HashMap;
import java.util.Map;

/**
 * 推送参数解析工具
 */
public final class JuggleIMPushIntentParser {
    private JuggleIMPushIntentParser() {
    }

    /**
     * 从 Intent 中提取字符串参数
     * @param intent 启动 Intent
     * @return 推送附带参数
     */
    @Nullable
    public static Map<String, String> fromIntent(@Nullable Intent intent) {
        if (intent == null) {
            return null;
        }
        return fromBundle(intent.getExtras());
    }

    /**
     * 从 Bundle 中提取字符串参数
     * @param bundle 原始参数
     * @return 推送附带参数
     */
    @Nullable
    public static Map<String, String> fromBundle(@Nullable Bundle bundle) {
        if (bundle == null || bundle.isEmpty()) {
            return null;
        }
        Map<String, String> extras = new HashMap<>();
        for (String key : bundle.keySet()) {
            Object value = bundle.get(key);
            if (value != null) {
                extras.put(key, String.valueOf(value));
            }
        }
        return extras.isEmpty() ? null : extras;
    }
}
