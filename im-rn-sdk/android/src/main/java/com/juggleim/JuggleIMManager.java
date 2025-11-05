package com.juggleim;

import android.util.Log;

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.ReadableMapKeySetIterator;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.WritableNativeMap;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableNativeArray;
import com.facebook.react.modules.core.DeviceEventManagerModule;
import com.juggle.im.JIMConst;
import com.juggle.im.interfaces.IConnectionManager;
import com.juggle.im.interfaces.IMessageManager;
import com.juggle.im.interfaces.IConversationManager;
import com.juggle.im.model.ConversationMentionInfo;
import com.juggle.im.model.GetMessageOptions;
import com.juggle.im.model.Message;
import com.juggle.im.model.Conversation;
import com.juggle.im.model.ConversationInfo;
import com.juggle.im.model.MessageMentionInfo;
import com.juggle.im.model.MessageReaction;
import com.juggle.im.model.MessageReactionItem;
import com.juggle.im.model.UserInfo;
import com.juggle.im.model.GroupMessageReadInfo;
import com.juggle.im.model.MessageContent;
import com.juggle.im.model.messages.*;
import com.juggle.im.JIM;

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
     *
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
     *
     * @param appKey 应用唯一标识
     */
    @ReactMethod
    public void init(String appKey) {
        com.juggle.im.JIM.getInstance().init(getCurrentActivity(), appKey);
    }

    /**
     * 连接到服务器
     *
     * @param token 用户token
     */
    @ReactMethod
    public void connect(String token) {
        com.juggle.im.JIM.getInstance().getConnectionManager().connect(token);
    }

    /**
     * 添加连接状态监听器
     *
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
     *
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

        };

        messageListeners.put(key, listener);
        com.juggle.im.JIM.getInstance().getMessageManager().addListener(key, listener);
    }

    /**
     * 添加消息阅读状态监听器
     *
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
     * 添加会话监听器
     *
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
        map.putString("senderUserId", message.getSenderUserId());
        map.putMap("conversation", convertConversationToMap(message.getConversation()));
        map.putMap("content", convertMessageContentToMap(message.getContent()));

        // 添加消息方向
        if (message.getDirection() != null) {
            map.putInt("direction", message.getDirection().getValue());
        }

        // 添加消息状态
        if (message.getState() != null) {
            map.putInt("state", message.getState().getValue());
        }

        // 添加是否已读
        map.putBoolean("hasRead", message.isHasRead());

        // 添加群消息阅读信息
        if (message.getGroupMessageReadInfo() != null) {
            map.putMap("groupMessageReadInfo", convertGroupMessageReadInfoToMap(message.getGroupMessageReadInfo()));
        }

        // 添加引用消息
        if (message.getReferredMessage() != null) {
            map.putMap("referredMessage", convertMessageToMap(message.getReferredMessage()));
        }

        // 添加@消息信息
        if (message.getMentionInfo() != null) {
            map.putMap("mentionInfo", convertMentionInfoToMap(message.getMentionInfo()));
        }

        // 添加本地属性
        map.putString("localAttribute", message.getLocalAttribute());

        // 添加是否删除
        map.putBoolean("isDelete", message.isDelete());

        // 添加是否编辑
        map.putBoolean("isEdit", message.isEdit());

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
        Log.d("convertMessageContentToMap", "contentType: " + content.getContentType());
        if (content.getContentType().equals("jg:text")) {
            map.putString("content", ((TextMessage) content).getContent());
        } else if (content.getContentType().equals("jg:image")) {
            ImageMessage img = (ImageMessage) content;
            map.putString("url", img.getUrl());
            map.putString("localPath", img.getLocalPath());
            map.putString("thumbnailLocalPath", img.getThumbnailLocalPath());
            map.putString("thumbnailUrl", img.getThumbnailUrl());
            map.putInt("width", img.getWidth());
            map.putInt("height", img.getHeight());
        } else if (content.getContentType().equals("jg:file")) {
            FileMessage file = (FileMessage) content;
            map.putString("url", file.getUrl());
            map.putString("type", file.getType());
            map.putString("name", file.getName());
            map.putDouble("size", file.getSize());
        } else if (content.getContentType().equals("jg:voice")) {
            VoiceMessage voice = (VoiceMessage) content;
            map.putString("url", voice.getUrl());
            map.putString("localPath", voice.getLocalPath());
            map.putInt("duration", voice.getDuration());
        }

        return map;
    }

    private MessageContent convertMapToMessageContent(ReadableMap map) {
        String contentType = map.getString("contentType");
        switch (contentType) {
            case "jg:text":
                TextMessage text = new TextMessage(map.getString("content"));
                return text;
            case "jg:image":
                ImageMessage img = new ImageMessage();
                img.setUrl(map.getString("url"));
                img.setLocalPath(map.getString("localPath"));
                img.setThumbnailLocalPath(map.getString("thumbnailLocalPath"));
                img.setThumbnailUrl(map.getString("thumbnailUrl"));
                img.setWidth(map.getInt("width"));
                img.setHeight(map.getInt("height"));
                return img;
            case "jg:file":
                FileMessage file = new FileMessage();
                file.setUrl(map.getString("url"));
                file.setType(map.getString("type"));
                file.setName(map.getString("name"));
                file.setSize(map.getInt("size"));
                return file;
            case "jg:voice":
                VoiceMessage voice = new VoiceMessage();
                voice.setUrl(map.getString("url"));
                voice.setLocalPath(map.getString("localPath"));
                voice.setDuration(map.getInt("duration"));
                return voice;
            default:
                return null;
        }
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
                us.pushMap(convertUserInfoToMap(user));
            }
            mi.putArray("userInfoList", us);
            itemList.pushMap(mi);
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
        map.putString("nickname", userInfo.getUserName());
        map.putString("avatar", userInfo.getPortrait());
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
    public void getConversationInfoList(int count, double ts, int pullDirection, Promise promise) {
        try {
            JIMConst.PullDirection direction = pullDirection == 0 ?
                    JIMConst.PullDirection.NEWER : JIMConst.PullDirection.OLDER;

            List<ConversationInfo> conversationInfos = com.juggle.im.JIM.getInstance().getConversationManager().getConversationInfoList(count, (long)ts, direction);
            Log.d("getConversationInfoList", "conversationInfos: " + conversationInfos.size());
            // WritableArray result = new WritableNativeArray();
            // for (ConversationInfo info : conversationInfos) {
            //     result.pushMap(convertConversationInfoToMap(info));
            // }
            promise.resolve(RNTypeConverter.toWritableMap(conversationInfos));
        } catch (Exception e) {
            e.printStackTrace();
            promise.reject(e);
        }
    }

    /**
     * 获取单个会话信息
     */
    @ReactMethod
    public void getConversationInfo(ReadableMap conversationMap, Promise promise) {
        Conversation conversation = convertMapToConversation(conversationMap);
        ConversationInfo conversationInfo = com.juggle.im.JIM.getInstance().getConversationManager()
                .getConversationInfo(conversation);
        promise.resolve(convertConversationInfoToMap(conversationInfo));
    }

    /**
     * 创建会话信息
     */
    @ReactMethod
    public void createConversationInfo(ReadableMap conversationInfoMap, Promise promise) {
        Conversation conversationInfo = convertMapToConversation(conversationInfoMap);

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
                .deleteConversationInfo(conversation, new IConversationManager.ISimpleCallback() {
                    @Override
                    public void onSuccess() {
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
                .setMute(conversation, isMute, new IConversationManager.ISimpleCallback() {
                    @Override
                    public void onSuccess() {
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
                .clearUnreadCount(conversation, new IConversationManager.ISimpleCallback() {
                    @Override
                    public void onSuccess() {
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
                .setDraft(conversation, draft);
        promise.resolve(true);
    }

    /**
     * 获取总未读数
     */
    @ReactMethod
    public void getTotalUnreadCount(Promise promise) {
        int c = com.juggle.im.JIM.getInstance().getConversationManager()
                .getTotalUnreadCount();
        promise.resolve(c);
    }

    /**
     * 设置会话置顶状态
     */
    @ReactMethod
    public void setTop(ReadableMap conversationMap, boolean isTop, Promise promise) {
        Conversation conversation = convertMapToConversation(conversationMap);
        com.juggle.im.JIM.getInstance().getConversationManager()
                .setTop(conversation, isTop, new IConversationManager.ISimpleCallback() {
                    @Override
                    public void onSuccess() {
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
        Conversation.ConversationType type = Conversation.ConversationType.values()[map.getInt("conversationType")];
        Conversation conversation = new Conversation(type, map.getString("conversationId"));
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
        map.putInt("unreadCount", info.getUnreadCount());
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
            map.putMap("mentionInfo", convertConversationMentionInfoToMap(info.getMentionInfo()));
        }

        return map;
    }

    /**
     * 将 MentionInfo 转换为 WritableMap
     */
    private WritableMap convertMentionInfoToMap(MessageMentionInfo mentionInfo) {
        WritableMap map = new WritableNativeMap();
        WritableArray userMap = new WritableNativeArray();
        map.putInt("type", mentionInfo.getType().getValue());
        for (UserInfo userInfo : mentionInfo.getTargetUsers()) {
            userMap.pushMap(convertUserInfoToMap(userInfo));
        }
        map.putArray("targetUsers", userMap);
        return map;
    }

    /**
     * 发送消息
     */
    @ReactMethod
    public void sendMessage(ReadableMap messageMap, Promise promise) {
        try {
            // Message message = convertMapToMessage(messageMap);
            Message message = RNTypeConverter.fromReadableMap(messageMap, Message.class);
            Log.d("sendMessage", message);
            Message sendMsg = JIM.getInstance().getMessageManager().sendMessage(
                    message.getContent(),
                    message.getConversation(),
                    new IMessageManager.ISendMessageCallback() {
                        @Override
                        public void onSuccess(Message sentMessage) {
                            WritableMap result = convertMessageToMap(sentMessage);
                            sendEvent("onMessageSent", result);
                        }

                        @Override
                        public void onError(Message message, int errorCode) {
                            WritableMap error = convertMessageToMap(message);
                            error.putInt("errorCode", errorCode);
                            sendEvent("onMessageSentError", error);
                        }
                    }
            );
            WritableMap result = RNTypeConverter.toWritableMap(sendMsg); // = convertMessageToMap(sendMsg);
            promise.resolve(result);
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
                getOptions.setStartTime((long) options.getDouble("startTime"));
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
                            result.putArray("messages", RNTypeConverter.toWritableMap(messages));
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
            Map<String, String> extrasMap = new HashMap<>();
            if (extras != null) {
                ReadableMapKeySetIterator it = extras.keySetIterator();
                extrasMap = new HashMap<>();
                while (it.hasNextKey()) {
                    extrasMap.put(it.nextKey(), extras.getString(it.nextKey()));
                }
            }
            JIM.getInstance().getMessageManager().recallMessage(
                    messageId,
                    extrasMap,
                    new IMessageManager.IRecallMessageCallback() {
                        @Override
                        public void onSuccess(Message m) {
                            promise.resolve(true);
                        }

                        @Override
                        public void onError(int errorCode) {
                            promise.reject("RECALL_MESSAGE_ERROR", errorCode + "");
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
                        public void onError(int errorCode) {
                            promise.reject("ADD_REACTION_ERROR", errorCode + "");
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
                        public void onError(int errorCode) {
                            promise.reject("REMOVE_REACTION_ERROR", errorCode + "");
                        }
                    }
            );
        } catch (Exception e) {
            promise.reject("REMOVE_REACTION_ERROR", e.getMessage());
        }
    }

    /**
     * 发送图片消息
     */
    @ReactMethod
    public void sendImageMessage(ReadableMap messageMap, Promise promise) {
        try {
            Conversation conversation = convertMapToConversation(messageMap);
            ImageMessage imageMessage = new ImageMessage();
            
            ReadableMap contentMap = messageMap.getMap("content");
            if (contentMap.hasKey("localPath")) {
                imageMessage.setLocalPath(contentMap.getString("localPath"));
            }
            if (contentMap.hasKey("thumbnailLocalPath")) {
                imageMessage.setThumbnailLocalPath(contentMap.getString("thumbnailLocalPath"));
            }
            if (contentMap.hasKey("url")) {
                imageMessage.setUrl(contentMap.getString("url"));
            }
            if (contentMap.hasKey("thumbnailUrl")) {
                imageMessage.setThumbnailUrl(contentMap.getString("thumbnailUrl"));
            }
            if (contentMap.hasKey("width")) {
                imageMessage.setWidth(contentMap.getInt("width"));
            }
            if (contentMap.hasKey("height")) {
                imageMessage.setHeight(contentMap.getInt("height"));
            }
            
            Message message = JIM.getInstance().getMessageManager().sendMediaMessage(
                    imageMessage,
                    conversation,
                    new IMessageManager.ISendMediaMessageCallback() {
                        @Override
                        public void onProgress(int progress, Message message) {
                            WritableMap params = new WritableNativeMap();
                            params.putInt("progress", progress);
                            params.putMap("message", convertMessageToMap(message));
                            sendEvent("onMediaMessageProgress", params);
                        }

                        @Override
                        public void onSuccess(Message message) {
                            WritableMap result = convertMessageToMap(message);
                            sendEvent("onMediaMessageSent", result);
                        }

                        @Override
                        public void onError(Message message, int errorCode) {
                            WritableMap params = new WritableNativeMap();
                            params.putMap("message", convertMessageToMap(message));
                            params.putInt("errorCode", errorCode);
                            sendEvent("onMediaMessageSentError", params);
                        }

                        @Override
                        public void onCancel(Message message) {
                            WritableMap result = convertMessageToMap(message);
                            sendEvent("onMediaMessageCancelled", result);
                        }
                    }
            );
            
            WritableMap result = convertMessageToMap(message);
            promise.resolve(result);
        } catch (Exception e) {
            promise.reject("SEND_IMAGE_MESSAGE_ERROR", e.getMessage());
        }
    }

    /**
     * 发送文件消息
     */
    @ReactMethod
    public void sendFileMessage(ReadableMap messageMap, Promise promise) {
        try {
            Conversation conversation = convertMapToConversation(messageMap);
            FileMessage fileMessage = new FileMessage();
            
            ReadableMap contentMap = messageMap.getMap("content");
            if (contentMap.hasKey("localPath")) {
                fileMessage.setLocalPath(contentMap.getString("localPath"));
            }
            if (contentMap.hasKey("url")) {
                fileMessage.setUrl(contentMap.getString("url"));
            }
            if (contentMap.hasKey("name")) {
                fileMessage.setName(contentMap.getString("name"));
            }
            if (contentMap.hasKey("size")) {
                fileMessage.setSize((long) contentMap.getDouble("size"));
            }
            if (contentMap.hasKey("type")) {
                fileMessage.setType(contentMap.getString("type"));
            }
            
            Message message = JIM.getInstance().getMessageManager().sendMediaMessage(
                    fileMessage,
                    conversation,
                    new IMessageManager.ISendMediaMessageCallback() {
                        @Override
                        public void onProgress(int progress, Message message) {
                            WritableMap params = new WritableNativeMap();
                            params.putInt("progress", progress);
                            params.putMap("message", convertMessageToMap(message));
                            sendEvent("onMediaMessageProgress", params);
                        }

                        @Override
                        public void onSuccess(Message message) {
                            WritableMap result = convertMessageToMap(message);
                            sendEvent("onMediaMessageSent", result);
                        }

                        @Override
                        public void onError(Message message, int errorCode) {
                            WritableMap params = new WritableNativeMap();
                            params.putMap("message", convertMessageToMap(message));
                            params.putInt("errorCode", errorCode);
                            sendEvent("onMediaMessageSentError", params);
                        }

                        @Override
                        public void onCancel(Message message) {
                            WritableMap result = convertMessageToMap(message);
                            sendEvent("onMediaMessageCancelled", result);
                        }
                    }
            );
            
            WritableMap result = convertMessageToMap(message);
            promise.resolve(result);
        } catch (Exception e) {
            promise.reject("SEND_FILE_MESSAGE_ERROR", e.getMessage());
        }
    }

    /**
     * 发送语音消息
     */
    @ReactMethod
    public void sendVoiceMessage(ReadableMap messageMap, Promise promise) {
        try {
            Conversation conversation = convertMapToConversation(messageMap);
            VoiceMessage voiceMessage = new VoiceMessage();
            
            ReadableMap contentMap = messageMap.getMap("content");
            if (contentMap.hasKey("localPath")) {
                voiceMessage.setLocalPath(contentMap.getString("localPath"));
            }
            if (contentMap.hasKey("url")) {
                voiceMessage.setUrl(contentMap.getString("url"));
            }
            if (contentMap.hasKey("duration")) {
                voiceMessage.setDuration(contentMap.getInt("duration"));
            }
            
            Message message = JIM.getInstance().getMessageManager().sendMediaMessage(
                    voiceMessage,
                    conversation,
                    new IMessageManager.ISendMediaMessageCallback() {
                        @Override
                        public void onProgress(int progress, Message message) {
                            WritableMap params = new WritableNativeMap();
                            params.putInt("progress", progress);
                            params.putMap("message", convertMessageToMap(message));
                            sendEvent("onMediaMessageProgress", params);
                        }

                        @Override
                        public void onSuccess(Message message) {
                            WritableMap result = convertMessageToMap(message);
                            sendEvent("onMediaMessageSent", result);
                        }

                        @Override
                        public void onError(Message message, int errorCode) {
                            WritableMap params = new WritableNativeMap();
                            params.putMap("message", convertMessageToMap(message));
                            params.putInt("errorCode", errorCode);
                            sendEvent("onMediaMessageSentError", params);
                        }

                        @Override
                        public void onCancel(Message message) {
                            WritableMap result = convertMessageToMap(message);
                            sendEvent("onMediaMessageCancelled", result);
                        }
                    }
            );
            
            WritableMap result = convertMessageToMap(message);
            promise.resolve(result);
        } catch (Exception e) {
            promise.reject("SEND_VOICE_MESSAGE_ERROR", e.getMessage());
        }
    }

    private Message convertMapToMessage(ReadableMap messageMap) {
        Message message = new Message();
        Conversation conversation = convertMapToConversation(messageMap);
        message.setConversation(conversation);
        if (messageMap.hasKey("messageId")) {
            message.setMessageId(messageMap.getString("messageId"));
        }

        if (messageMap.hasKey("clientMsgNo")) {
            message.setClientMsgNo((long) messageMap.getDouble("clientMsgNo"));
        }

        if (messageMap.hasKey("timestamp")) {
            message.setTimestamp((long) messageMap.getDouble("timestamp"));
        }

        if (messageMap.hasKey("senderUserId")) {
            message.setSenderUserId(messageMap.getString("senderUserId"));
        }
        // 设置消息内容
        if (messageMap.hasKey("content")) {
            ReadableMap contentMap = messageMap.getMap("content");
            MessageContent content = convertMapToMessageContent(contentMap);
            message.setContent(content);
        }

        // 设置消息方向
        if (messageMap.hasKey("direction")) {
            Message.MessageDirection direction = Message.MessageDirection.setValue(messageMap.getInt("direction"));
            message.setDirection(direction);
        }

        // 设置消息状态
        if (messageMap.hasKey("state")) {
            Message.MessageState state = Message.MessageState.setValue(messageMap.getInt("state"));
            message.setState(state);
        }

        // 设置是否已读
        if (messageMap.hasKey("hasRead")) {
            message.setHasRead(messageMap.getBoolean("hasRead"));
        }

        // 设置本地属性
        if (messageMap.hasKey("localAttribute")) {
            message.setLocalAttribute(messageMap.getString("localAttribute"));
        }

        // 设置是否删除
        if (messageMap.hasKey("isDelete")) {
            message.setDelete(messageMap.getBoolean("isDelete"));
        }

        // 设置是否编辑
        if (messageMap.hasKey("isEdit")) {
            message.setEdit(messageMap.getBoolean("isEdit"));
        }
        return message;
    }
}