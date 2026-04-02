package com.juggleim.push;

import android.content.Context;

import androidx.annotation.Nullable;

import java.util.Map;

import cn.jpush.android.api.NotificationMessage;
import cn.jpush.android.service.JPushMessageService;

/**
 * 极光推送消息服务
 */
public class JGPushMessageService extends JPushMessageService {
    @Override
    public void onNotifyMessageOpened(Context context, NotificationMessage message) {
        Map<String, String> extras = fromNotificationMessage(message);
        if (extras != null) {
            JuggleIMPushEventStore.onNotificationClick(extras);
        }
    }

    /**
     * 从极光通知消息中提取 extras
     * @param message 通知消息
     * @return 推送参数
     */
    @Nullable
    private Map<String, String> fromNotificationMessage(@Nullable NotificationMessage message) {
        if (message == null) {
            return null;
        }
        Map<String, String> extras = JuggleIMPushIntentParser.fromBundle(message.notificationExtras);
        if (extras == null) {
            return null;
        }
        if (message.notificationTitle != null) {
            extras.put("notificationTitle", message.notificationTitle);
        }
        if (message.notificationContent != null) {
            extras.put("notificationContent", message.notificationContent);
        }
        extras.put("messageId", String.valueOf(message.msgId));
        return extras;
    }
}
