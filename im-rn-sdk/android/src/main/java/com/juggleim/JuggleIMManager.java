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

    //conversation
   /**
     * 获取会话信息列表
     */
    @ReactMethod
    public void getConversationInfoList(int count, String pullDirection, Promise promise) {
        JIMConst.PullDirection direction = "up".equals(pullDirection) ? 
            JIMConst.PullDirection.UP : JIMConst.PullDirection.DOWN;
        
        com.juggle.im.JIM.getInstance().getConversationManager()
            .getConversationInfoList(count, direction, new IConversationManager.ISimpleCallback<List<ConversationInfo>>() {
                @Override
                public void onSuccess(List<ConversationInfo> conversationInfos) {
                    WritableArray result = new WritableNativeArray();
                    for (ConversationInfo info : conversationInfos) {
                        result.pushMap(convertConversationInfoToMap(info));
                    }
                    promise.resolve(result);
                }

                @Override
                public void onError(int errorCode) {
                    promise.reject("error", "Error code: " + errorCode);
                }
            });
    }

    /**
     * 获取单个会话信息
     */
    @ReactMethod
    public void getConversationInfo(ReadableMap conversationMap, Promise promise) {
        Conversation conversation = convertMapToConversation(conversationMap);
        
        com.juggle.im.JIM.getInstance().getConversationManager()
            .getConversationInfo(conversation, new IConversationManager.ISimpleCallback<ConversationInfo>() {
                @Override
                public void onSuccess(ConversationInfo conversationInfo) {
                    promise.resolve(convertConversationInfoToMap(conversationInfo));
                }

                @Override
                public void onError(int errorCode) {
                    promise.reject("error", "Error code: " + errorCode);
                }
            });
    }

    /**
     * 创建会话信息
     */
    @ReactMethod
    public void createConversationInfo(ReadableMap conversationInfoMap, Promise promise) {
        ConversationInfo conversationInfo = convertMapToConversationInfo(conversationInfoMap);
        
        com.juggle.im.JIM.getInstance().getConversationManager()
            .createConversationInfo(conversationInfo, new IConversationManager.ICreateConversationInfoCallback() {
                @Override
                public void onSuccess(ConversationInfo info) {
                    promise.resolve(convertConversationInfoToMap(info));
                }

                @Override
                public void onError(int errorCode) {
                    promise.reject("error", "Error code: " + errorCode);
                }
            });
    }

    /**
     * 删除会话信息
     */
    @ReactMethod
    public void deleteConversationInfo(ReadableMap conversationMap, Promise promise) {
        Conversation conversation = convertMapToConversation(conversationMap);
        
        com.juggle.im.JIM.getInstance().getConversationManager()
            .deleteConversationInfo(conversation, new IConversationManager.ISimpleCallback<Void>() {
                @Override
                public void onSuccess(Void aVoid) {
                    promise.resolve(true);
                }

                @Override
                public void onError(int errorCode) {
                    promise.reject("error", "Error code: " + errorCode);
                }
            });
    }

    /**
     * 设置会话免打扰状态
     */
    @ReactMethod
    public void setMute(ReadableMap conversationMap, boolean isMute, Promise promise) {
        Conversation conversation = convertMapToConversation(conversationMap);
        
        com.juggle.im.JIM.getInstance().getConversationManager()
            .setMute(conversation, isMute, new IConversationManager.ISimpleCallback<Void>() {
                @Override
                public void onSuccess(Void aVoid) {
                    promise.resolve(true);
                }

                @Override
                public void onError(int errorCode) {
                    promise.reject("error", "Error code: " + errorCode);
                }
            });
    }

    /**
     * 清除会话未读数
     */
    @ReactMethod
    public void clearUnreadCount(ReadableMap conversationMap, Promise promise) {
        Conversation conversation = convertMapToConversation(conversationMap);
        
        com.juggle.im.JIM.getInstance().getConversationManager()
            .clearUnreadCount(conversation, new IConversationManager.ISimpleCallback<Void>() {
                @Override
                public void onSuccess(Void aVoid) {
                    promise.resolve(true);
                }

                @Override
                public void onError(int errorCode) {
                    promise.reject("error", "Error code: " + errorCode);
                }
            });
    }

    /**
     * 设置会话草稿
     */
    @ReactMethod
    public void setDraft(ReadableMap conversationMap, String draft, Promise promise) {
        Conversation conversation = convertMapToConversation(conversationMap);
        
        com.juggle.im.JIM.getInstance().getConversationManager()
            .setDraft(conversation, draft, new IConversationManager.ISimpleCallback<Void>() {
                @Override
                public void onSuccess(Void aVoid) {
                    promise.resolve(true);
                }

                @Override
                public void onError(int errorCode) {
                    promise.reject("error", "Error code: " + errorCode);
                }
            });
    }

    /**
     * 获取总未读数
     */
    @ReactMethod
    public void getTotalUnreadCount(Promise promise) {
        com.juggle.im.JIM.getInstance().getConversationManager()
            .getTotalUnreadCount(new IConversationManager.ISimpleCallback<Integer>() {
                @Override
                public void onSuccess(Integer count) {
                    promise.resolve(count);
                }

                @Override
                public void onError(int errorCode) {
                    promise.reject("error", "Error code: " + errorCode);
                }
            });
    }

    /**
     * 设置会话置顶状态
     */
    @ReactMethod
    public void setTop(ReadableMap conversationMap, boolean isTop, Promise promise) {
        Conversation conversation = convertMapToConversation(conversationMap);
        
        com.juggle.im.JIM.getInstance().getConversationManager()
            .setTop(conversation, isTop, new IConversationManager.ISimpleCallback<Void>() {
                @Override
                public void onSuccess(Void aVoid) {
                    promise.resolve(true);
                }

                @Override
                public void onError(int errorCode) {
                    promise.reject("error", "Error code: " + errorCode);
                }
            });
    }

    /**
     * 将 ReadableMap 转换为 Conversation 对象
     */
    private Conversation convertMapToConversation(ReadableMap map) {
        Conversation conversation = new Conversation();
        conversation.setConversationId(map.getString("conversationId"));
        conversation.setConversationType(JIMConst.ConversationType.setValue(map.getInt("conversationType")));
        return conversation;
    }

    /**
     * 将 ReadableMap 转换为 ConversationInfo 对象
     */
    private ConversationInfo convertMapToConversationInfo(ReadableMap map) {
        ConversationInfo info = new ConversationInfo();
        info.setConversation(convertMapToConversation(map.getMap("conversation")));
        info.setUnreadCount(map.getInt("unreadMessageCount"));
        info.setTop(map.getBoolean("isTop"));
        info.setMute(map.getBoolean("isMute"));
        info.setDraft(map.getString("draft"));
        return info;
    }

    /**
     * 将 ConversationInfo 转换为 WritableMap
     */
    private WritableMap convertConversationInfoToMap(ConversationInfo info) {
        WritableMap map = new WritableNativeMap();
        map.putMap("conversation", convertConversationToMap(info.getConversation()));
        map.putInt("unreadMessageCount", info.getUnreadCount());
        map.putBoolean("isTop", info.isTop());
        map.putBoolean("isMute", info.isMute());
        map.putBoolean("hasUnread", info.hasUnread());
        map.putString("draft", info.getDraft() != null ? info.getDraft() : "");
        map.putDouble("topTime", info.getTopTime());
        map.putDouble("sortTime", info.getSortTime());
        
        if (info.getLastMessage() != null) {
            map.putMap("lastMessage", convertMessageToMap(info.getLastMessage()));
        }
        
        if (info.getMentionInfo() != null) {
            map.putMap("mentionInfo", convertMentionInfoToMap(info.getMentionInfo()));
        }
        
        return map;
    }

    /**
     * 将 MentionInfo 转换为 WritableMap
     */
    private WritableMap convertMentionInfoToMap(com.juggle.im.model.ConversationMentionInfo mentionInfo) {
        WritableMap map = new WritableNativeMap();
        if (mentionInfo.getMentionMsgList() != null) {
            WritableArray mentionMsgArray = new WritableNativeArray();
            for (com.juggle.im.model.MentionMsg mentionMsg : mentionInfo.getMentionMsgList()) {
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

    /**
     * 发送消息
     */
    @ReactMethod
    public void sendMessage(ReadableMap messageMap, ReadableMap callbacks, Promise promise) {
        try {
            // 构建消息对象
            Message message = convertMapToMessage(messageMap);
            
            // 发送消息
            JIM.getInstance().getMessageManager().sendMessage(
                message.getContent(),
                message.getConversation(),
                new IMessageManager.ISendMessageCallback() {
                    @Override
                    public void onSuccess(Message sentMessage) {
                        WritableMap result = new WritableNativeMap();
                        result.putString("messageId", sentMessage.getMessageId());
                        result.putDouble("sentTime", sentMessage.getTimestamp());
                        promise.resolve(result);
                    }
                    
                    @Override
                    public void onError(JErrorCode errorCode, Message message) {
                        WritableMap error = new WritableNativeMap();
                        if (message != null) {
                            error.putString("tid", String.valueOf(message.getClientMsgNo()));
                        }
                        error.putString("msg", errorCode.toString());
                        promise.reject("SEND_MESSAGE_ERROR", error.toString());
                    }
                }
            );
        } catch (Exception e) {
            promise.reject("SEND_MESSAGE_ERROR", e.getMessage());
        }
    }

    /**
     * 获取历史消息
     */
    @ReactMethod
    public void getMessages(ReadableMap conversationMap, int direction, ReadableMap options, Promise promise) {
        try {
            Conversation conversation = convertMapToConversation(conversationMap);
            GetMessageOptions getOptions = new GetMessageOptions();
            
            if (options.hasKey("count")) {
                getOptions.setCount(options.getInt("count"));
            }
            if (options.hasKey("startTime")) {
                getOptions.setStartTime((long)options.getDouble("startTime"));
            }
            
            JIMConst.PullDirection pullDirection = direction == 0 ? 
                JIMConst.PullDirection.OLDER : JIMConst.PullDirection.NEWER;
                
            JIM.getInstance().getMessageManager().getMessages(
                conversation,
                pullDirection,
                getOptions,
                new IMessageManager.IGetMessagesCallbackV3() {
                    @Override
                    public void onGetMessages(List<Message> messages, long timestamp, boolean hasMore, int code) {
                        WritableMap result = new WritableNativeMap();
                        WritableArray messageArray = new WritableNativeArray();
                        
                        for (Message msg : messages) {
                            messageArray.pushMap(convertMessageToMap(msg));
                        }
                        
                        result.putArray("messages", messageArray);
                        result.putDouble("timestamp", timestamp);
                        result.putBoolean("hasMore", hasMore);
                        result.putInt("code", code);
                        
                        promise.resolve(result);
                    }
                }
            );
        } catch (Exception e) {
            promise.reject("GET_MESSAGES_ERROR", e.getMessage());
        }
    }

    /**
     * 撤回消息
     */
    @ReactMethod
    public void recallMessage(ReadableMap messageMap, ReadableMap extras, Promise promise) {
        try {
            String messageId = messageMap.getString("messageId");
            Map<String, Object> extrasMap = extras != null ? extras.toHashMap() : new HashMap<>();
            
            JIM.getInstance().getMessageManager().recallMessage(
                messageId,
                extrasMap,
                new IMessageManager.ISimpleCallback() {
                    @Override
                    public void onSuccess() {
                        promise.resolve(true);
                    }
                    
                    @Override
                    public void onError(JErrorCode errorCode) {
                        promise.reject("RECALL_MESSAGE_ERROR", errorCode.toString());
                    }
                }
            );
        } catch (Exception e) {
            promise.reject("RECALL_MESSAGE_ERROR", e.getMessage());
        }
    }

    /**
     * 添加消息反应
     */
    @ReactMethod
    public void addMessageReaction(ReadableMap messageMap, String reactionId, Promise promise) {
        try {
            String messageId = messageMap.getString("messageId");
            Conversation conversation = convertMapToConversation(messageMap);
            
            JIM.getInstance().getMessageManager().addMessageReaction(
                messageId,
                conversation,
                reactionId,
                new IMessageManager.ISimpleCallback() {
                    @Override
                    public void onSuccess() {
                        promise.resolve(true);
                    }
                    
                    @Override
                    public void onError(JErrorCode errorCode) {
                        promise.reject("ADD_REACTION_ERROR", errorCode.toString());
                    }
                }
            );
        } catch (Exception e) {
            promise.reject("ADD_REACTION_ERROR", e.getMessage());
        }
    }

    /**
     * 移除消息反应
     */
    @ReactMethod
    public void removeMessageReaction(ReadableMap messageMap, String reactionId, Promise promise) {
        try {
            String messageId = messageMap.getString("messageId");
            Conversation conversation = convertMapToConversation(messageMap);
            
            JIM.getInstance().getMessageManager().removeMessageReaction(
                messageId,
                conversation,
                reactionId,
                new IMessageManager.ISimpleCallback() {
                    @Override
                    public void onSuccess() {
                        promise.resolve(true);
                    }
                    
                    @Override
                    public void onError(JErrorCode errorCode) {
                        promise.reject("REMOVE_REACTION_ERROR", errorCode.toString());
                    }
                }
            );
        } catch (Exception e) {
            promise.reject("REMOVE_REACTION_ERROR", e.getMessage());
        }
    }

    /**
     * 添加收藏消息
     */
    @ReactMethod
    public void addFavoriteMessages(ReadableArray messagesArray, Promise promise) {
        try {
            List<String> messageIdList = new ArrayList<>();
            for (int i = 0; i < messagesArray.size(); i++) {
                ReadableMap messageMap = messagesArray.getMap(i);
                messageIdList.add(messageMap.getString("messageId"));
            }
            
            JIM.getInstance().getMessageManager().addFavoriteMessages(
                messageIdList,
                new IMessageManager.ISimpleCallback() {
                    @Override
                    public void onSuccess() {
                        promise.resolve(true);
                    }
                    
                    @Override
                    public void onError(JErrorCode errorCode) {
                        promise.reject("ADD_FAVORITE_ERROR", errorCode.toString());
                    }
                }
            );
        } catch (Exception e) {
            promise.reject("ADD_FAVORITE_ERROR", e.getMessage());
        }
    }

    /**
     * 移除收藏消息
     */
    @ReactMethod
    public void removeFavoriteMessages(ReadableArray messagesArray, Promise promise) {
        try {
            List<String> messageIdList = new ArrayList<>();
            for (int i = 0; i < messagesArray.size(); i++) {
                ReadableMap messageMap = messagesArray.getMap(i);
                messageIdList.add(messageMap.getString("messageId"));
            }
            
            JIM.getInstance().getMessageManager().removeFavoriteMessages(
                messageIdList,
                new IMessageManager.ISimpleCallback() {
                    @Override
                    public void onSuccess() {
                        promise.resolve(true);
                    }
                    
                    @Override
                    public void onError(JErrorCode errorCode) {
                        promise.reject("REMOVE_FAVORITE_ERROR", errorCode.toString());
                    }
                }
            );
        } catch (Exception e) {
            promise.reject("REMOVE_FAVORITE_ERROR", e.getMessage());
        }
    }

    // 辅助方法：将 ReadableMap 转换为 Message 对象
    private Message convertMapToMessage(ReadableMap messageMap) {
        // 实现消息对象转换逻辑
        // 根据 messageMap 中的数据构建相应的 MessageContent 和 Conversation
        return new Message(); // 简化示例
    }

    // 辅助方法：将 Message 对象转换为 WritableMap
    private WritableMap convertMessageToMap(Message message) {
        WritableMap map = new WritableNativeMap();
        map.putString("messageId", message.getMessageId());
        map.putDouble("timestamp", message.getTimestamp());
        map.putString("senderId", message.getSenderId());
        // 添加更多字段转换
        return map;
    }
}