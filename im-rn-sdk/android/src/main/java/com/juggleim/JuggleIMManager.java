package com.juggleim;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.WritableNativeMap;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableNativeArray;
import com.facebook.react.modules.core.DeviceEventManagerModule;
import com.juggle.im.JIMConst;
import com.juggle.im.interfaces.IConnectionManager;
import com.juggle.im.interfaces.IMessageManager;
import com.juggle.im.interfaces.IConversationManager;
import com.juggle.im.model.Message;
import com.juggle.im.model.Conversation;
import com.juggle.im.model.ConversationInfo;
import com.juggle.im.model.MessageReaction;
import com.juggle.im.model.UserInfo;
import com.juggle.im.model.GroupMessageReadInfo;
import com.juggle.im.model.MessageContent;
import com.juggle.im.model.messages.*;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import javax.annotation.Nonnull;

/**
 * Juggle IM React Native Android 模块
 */
public class JuggleIMManager extends ReactContextBaseJavaModule {
    private static final String MODULE_NAME = "JuggleIM";
    private Map<String, IConnectionManager.IConnectionStatusListener> connectionListeners = new HashMap<>();
    private Map<String, IMessageManager.IMessageListener> messageListeners = new HashMap<>();
    private Map<String, IMessageManager.IMessageReadReceiptListener> readReceiptListeners = new HashMap<>();
    private Map<String, IMessageManager.IMessageDestroyListener> destroyListeners = new HashMap<>();
    private Map<String, IConversationManager.IConversationListener> conversationListeners = new HashMap<>();

    public JuggleIMManager(@Nonnull ReactApplicationContext reactContext) {
        super(reactContext);
    }

    @Nonnull
    @Override
    public String getName() {
        return MODULE_NAME;
    }

    /**
     * 设置服务器地址列表
     * @param urls 服务器地址列表
     */
    @ReactMethod
    public void setServerUrls(ReadableArray urls) {
        List<String> serverList = new ArrayList<>();
        for (int i = 0; i < urls.size(); i++) {
            serverList.add(urls.getString(i));
        }
        com.juggle.im.JIM.getInstance().setServerUrls(serverList);
    }

    /**
     * 初始化SDK
     * @param appKey 应用唯一标识
     */
    @ReactMethod
    public void init(String appKey) {
        com.juggle.im.JIM.getInstance().init(getCurrentActivity(), appKey);
    }
    
    /**
     * 连接到服务器
     * @param token 用户token
     */
    @ReactMethod
    public void connect(String token) {
        com.juggle.im.JIM.getInstance().getConnectionManager().connect(token);
    }
    
    /**
     * 添加连接状态监听器
     * @param key 监听器标识
     */
    @ReactMethod
    public void addConnectionStatusListener(String key) {
        IConnectionManager.IConnectionStatusListener listener = new IConnectionManager.IConnectionStatusListener() {
            @Override
            public void onStatusChange(JIMConst.ConnectionStatus status, int code, String extra) {
                WritableMap params = new WritableNativeMap();
                params.putString("key", key);
                params.putString("status", getStatusString(status));
                params.putInt("code", code);
                params.putString("extra", extra != null ? extra : "");
                
                sendEvent("ConnectionStatusChanged", params);
            }
            
            @Override
            public void onDbOpen() {
                WritableMap params = new WritableNativeMap();
                params.putString("key", key);
                sendEvent("DbDidOpen", params);
            }
            
            @Override
            public void onDbClose() {
                WritableMap params = new WritableNativeMap();
                params.putString("key", key);
                sendEvent("DbDidClose", params);
            }
        };
        
        listeners.put(key, listener);
        com.juggle.im.JIM.getInstance().getConnectionManager().addConnectionStatusListener(key, listener);
    }
    
    /**
     * 发送事件到React Native
     */
    private void sendEvent(String eventName, WritableMap params) {
        getReactApplicationContext()
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
            .emit(eventName, params);
    }
    
    /**
     * 将连接状态转换为字符串
     */
    private String getStatusString(JIMConst.ConnectionStatus status) {
        switch (status) {
            case CONNECTED:
                return "connected";
            case CONNECTING:
                return "connecting";
            case DISCONNECTED:
                return "disconnected";
            case FAILURE:
                return "failure";
            default:
                return "unknown";
        }
    }

    /**
     * 添加消息监听器
     * @param key 监听器标识
     */
    @ReactMethod
    public void addMessageListener(String key) {
        IMessageManager.IMessageListener listener = new IMessageManager.IMessageListener() {
            @Override
            public void onMessageReceive(Message message) {
                WritableMap params = new WritableNativeMap();
                params.putString("key", key);
                params.putMap("message", convertMessageToMap(message));
                sendEvent("MessageReceived", params);
            }

            @Override
            public void onMessageRecall(Message message) {
                WritableMap params = new WritableNativeMap();
                params.putString("key", key);
                params.putMap("message", convertMessageToMap(message));
                sendEvent("MessageRecalled", params);
            }

            @Override
            public void onMessageUpdate(Message message) {
                WritableMap params = new WritableNativeMap();
                params.putString("key", key);
                params.putMap("message", convertMessageToMap(message));
                sendEvent("MessageUpdated", params);
            }

            @Override
            public void onMessageDelete(Conversation conversation, List<Long> clientMsgNos) {
                WritableMap params = new WritableNativeMap();
                params.putString("key", key);
                params.putMap("conversation", convertConversationToMap(conversation));
                WritableArray msgNos = new WritableNativeArray();
                for (Long msgNo : clientMsgNos) {
                    msgNos.pushDouble(msgNo.doubleValue());
                }
                params.putArray("clientMsgNos", msgNos);
                sendEvent("MessageDeleted", params);
            }

            @Override
            public void onMessageClear(Conversation conversation, long timestamp, String senderId) {
                WritableMap params = new WritableNativeMap();
                params.putString("key", key);
                params.putMap("conversation", convertConversationToMap(conversation));
                params.putDouble("timestamp", timestamp);
                params.putString("senderId", senderId != null ? senderId : "");
                sendEvent("MessageCleared", params);
            }

            @Override
            public void onMessageReactionAdd(Conversation conversation, MessageReaction reaction) {
                WritableMap params = new WritableNativeMap();
                params.putString("key", key);
                params.putMap("conversation", convertConversationToMap(conversation));
                params.putMap("reaction", convertReactionToMap(reaction));
                sendEvent("MessageReactionAdded", params);
            }

            @Override
            public void onMessageReactionRemove(Conversation conversation, MessageReaction reaction) {
                WritableMap params = new WritableNativeMap();
                params.putString("key", key);
                params.putMap("conversation", convertConversationToMap(conversation));
                params.putMap("reaction", convertReactionToMap(reaction));
                sendEvent("MessageReactionRemoved", params);
            }

            @Override
            public void onMessageSetTop(Message message, UserInfo operator, boolean isTop) {
                WritableMap params = new WritableNativeMap();
                params.putString("key", key);
                params.putMap("message", convertMessageToMap(message));
                params.putMap("operator", convertUserInfoToMap(operator));
                params.putBoolean("isTop", isTop);
                sendEvent("MessageSetTop", params);
            }
        };
        
        messageListeners.put(key, listener);
        com.juggle.im.JIM.getInstance().getMessageManager().addListener(key, listener);
    }

    /**
     * 添加消息阅读状态监听器
     * @param key 监听器标识
     */
    @ReactMethod
    public void addMessageReadReceiptListener(String key) {
        IMessageManager.IMessageReadReceiptListener listener = new IMessageManager.IMessageReadReceiptListener() {
            @Override
            public void onMessagesRead(Conversation conversation, List<String> messageIds) {
                WritableMap params = new WritableNativeMap();
                params.putString("key", key);
                params.putMap("conversation", convertConversationToMap(conversation));
                WritableArray msgIds = new WritableNativeArray();
                for (String msgId : messageIds) {
                    msgIds.pushString(msgId);
                }
                params.putArray("messageIds", msgIds);
                sendEvent("MessagesRead", params);
            }

            @Override
            public void onGroupMessagesRead(Conversation conversation, Map<String, GroupMessageReadInfo> messages) {
                WritableMap params = new WritableNativeMap();
                params.putString("key", key);
                params.putMap("conversation", convertConversationToMap(conversation));
                WritableMap messagesMap = new WritableNativeMap();
                for (Map.Entry<String, GroupMessageReadInfo> entry : messages.entrySet()) {
                    messagesMap.putMap(entry.getKey(), convertGroupMessageReadInfoToMap(entry.getValue()));
                }
                params.putMap("messages", messagesMap);
                sendEvent("GroupMessagesRead", params);
            }
        };
        
        readReceiptListeners.put(key, listener);
        com.juggle.im.JIM.getInstance().getMessageManager().addReadReceiptListener(key, listener);
    }

    /**
     * 添加消息销毁监听器
     * @param key 监听器标识
     */
    @ReactMethod
    public void addMessageDestroyListener(String key) {
        IMessageManager.IMessageDestroyListener listener = new IMessageManager.IMessageDestroyListener() {
            @Override
            public void onMessageDestroyTimeUpdate(String messageId, Conversation conversation, long destroyTime) {
                WritableMap params = new WritableNativeMap();
                params.putString("key", key);
                params.putString("messageId", messageId);
                params.putMap("conversation", convertConversationToMap(conversation));
                params.putDouble("destroyTime", destroyTime);
                sendEvent("MessageDestroyTimeUpdated", params);
            }
        };
        
        destroyListeners.put(key, listener);
        com.juggle.im.JIM.getInstance().getMessageManager().addDestroyListener(key, listener);
    }

    /**
     * 添加会话监听器
     * @param key 监听器标识
     */
    @ReactMethod
    public void addConversationListener(String key) {
        IConversationManager.IConversationListener listener = new IConversationManager.IConversationListener() {
            @Override
            public void onConversationInfoAdd(List<ConversationInfo> conversationInfoList) {
                WritableMap params = new WritableNativeMap();
                params.putString("key", key);
                WritableArray conversations = new WritableNativeArray();
                for (ConversationInfo info : conversationInfoList) {
                    conversations.pushMap(convertConversationInfoToMap(info));
                }
                params.putArray("conversations", conversations);
                sendEvent("ConversationInfoAdded", params);
            }

            @Override
            public void onConversationInfoUpdate(List<ConversationInfo> conversationInfoList) {
                WritableMap params = new WritableNativeMap();
                params.putString("key", key);
                WritableArray conversations = new WritableNativeArray();
                for (ConversationInfo info : conversationInfoList) {
                    conversations.pushMap(convertConversationInfoToMap(info));
                }
                params.putArray("conversations", conversations);
                sendEvent("ConversationInfoUpdated", params);
            }

            @Override
            public void onConversationInfoDelete(List<ConversationInfo> conversationInfoList) {
                WritableMap params = new WritableNativeMap();
                params.putString("key", key);
                WritableArray conversations = new WritableNativeArray();
                for (ConversationInfo info : conversationInfoList) {
                    conversations.pushMap(convertConversationInfoToMap(info));
                }
                params.putArray("conversations", conversations);
                sendEvent("ConversationInfoDeleted", params);
            }

            @Override
            public void onTotalUnreadMessageCountUpdate(int count) {
                WritableMap params = new WritableNativeMap();
                params.putString("key", key);
                params.putInt("count", count);
                sendEvent("TotalUnreadMessageCountUpdated", params);
            }
        };
        
        conversationListeners.put(key, listener);
        com.juggle.im.JIM.getInstance().getConversationManager().addListener(key, listener);
    }

    /**
     * 将消息对象转换为Map
     */
    private WritableMap convertMessageToMap(Message message) {
        WritableMap map = new WritableNativeMap();
        map.putString("messageId", message.getMessageId());
        map.putDouble("clientMsgNo", message.getClientMsgNo());
        map.putDouble("timestamp", message.getTimestamp());
        map.putString("senderId", message.getSenderId());
        map.putMap("conversation", convertConversationToMap(message.getConversation()));
        map.putMap("content", convertMessageContentToMap(message.getContent()));
        return map;
    }

    /**
     * 将会话对象转换为Map
     */
    private WritableMap convertConversationToMap(Conversation conversation) {
        WritableMap map = new WritableNativeMap();
        map.putInt("conversationType", conversation.getConversationType().getValue());
        map.putString("conversationId", conversation.getConversationId());
        return map;
    }

    /**
     * 将消息内容转换为Map
     */
    private WritableMap convertMessageContentToMap(MessageContent content) {
        WritableMap map = new WritableNativeMap();
        map.putString("contentType", content.getContentType());
        
        if (content instanceof TextMessage) {
            map.putString("content", ((TextMessage) content).getContent());
        } else if (content instanceof ImageMessage) {
            ImageMessage img = (ImageMessage) content;
            map.putString("url", img.getUrl());
            map.putString("name", img.getName());
            map.putInt("width", img.getWidth());
            map.putInt("height", img.getHeight());
        } else if (content instanceof FileMessage) {
            FileMessage file = (FileMessage) content;
            map.putString("url", file.getUrl());
            map.putString("name", file.getName());
            map.putDouble("size", file.getSize());
        } else if (content instanceof VoiceMessage) {
            VoiceMessage voice = (VoiceMessage) content;
            map.putString("url", voice.getUrl());
            map.putInt("duration", voice.getDuration());
        }
        
        return map;
    }

    /**
     * 将消息回应转换为Map
     */
    private WritableMap convertReactionToMap(MessageReaction reaction) {
        WritableMap map = new WritableNativeMap();
        map.putString("messageId", reaction.getMessageId());
        WritableArray itemList = new WritableNativeArray();
        for (MessageReactionItem item : reaction.getItemList()) {
          WritableMap mi = new WritableNativeMap();
          mi.putString("reactionId", item.getReactionId());
          WritableArray us = new WritableNativeArray();
          for (UserInfo user : item.getUserInfoList()) {
            us.putArray(convertUserInfoToMap(user));
          }
          mi.putArray("userInfoList", us);

          itemList.putArray(mi);
        }
        map.putArray("itemList", itemList);
        return map;
    }

    /**
     * 将用户信息转换为Map
     */
    private WritableMap convertUserInfoToMap(UserInfo userInfo) {
        WritableMap map = new WritableNativeMap();
        map.putString("userId", userInfo.getUserId());
        map.putString("nickname", userInfo.getNickname());
        map.putString("avatar", userInfo.getAvatar());
        return map;
    }

    /**
     * 将群消息阅读信息转换为Map
     */
    private WritableMap convertGroupMessageReadInfoToMap(GroupMessageReadInfo info) {
        WritableMap map = new WritableNativeMap();
        map.putInt("readCount", info.getReadCount());
        map.putInt("memberCount", info.getMemberCount());
        return map;
    }

    /**
     * 将会话信息转换为Map
     */
    private WritableMap convertConversationInfoToMap(ConversationInfo info) {
        WritableMap map = new WritableNativeMap();
        map.putMap("conversation", convertConversationToMap(info.getConversation()));
        map.putInt("unreadMessageCount", info.getUnreadCount()); // 修正方法名
        map.putLong("topTime", info.getTopTime()); // 新增
        map.putLong("sortTime", info.getSortTime()); // 新增
        map.putBoolean("isTop", info.isTop());
        map.putBoolean("isMute", info.isMute());
        map.putBoolean("hasUnread", info.hasUnread()); // 新增
        map.putString("draft", info.getDraft()); // 新增
        if (info.getLastMessage() != null) {
            map.putMap("lastMessage", convertMessageToMap(info.getLastMessage()));
        }
        if (info.getMentionInfo() != null) { // 新增
            map.putMap("mentionInfo", convertConversationMentionInfoToMap(info.getMentionInfo()));
        }
        return map;
    }

    // 新增转换方法
    private WritableMap convertConversationMentionInfoToMap(ConversationMentionInfo mentionInfo) {
        WritableMap map = new WritableNativeMap();
        if (mentionInfo.getMentionMsgList() != null) {
            WritableArray mentionMsgArray = new WritableNativeArray();
            for (ConversationMentionInfo.MentionMsg mentionMsg : mentionInfo.getMentionMsgList()) {
                WritableMap msgMap = new WritableNativeMap();
                msgMap.putString("senderId", mentionMsg.getSenderId());
                msgMap.putString("msgId", mentionMsg.getMsgId());
                msgMap.putDouble("msgTime", mentionMsg.getMsgTime());
                msgMap.putInt("type", mentionMsg.getType().getValue());
                mentionMsgArray.pushMap(msgMap);
            }
            map.putArray("mentionMsgList", mentionMsgArray);
        }
        return map;
    }
}