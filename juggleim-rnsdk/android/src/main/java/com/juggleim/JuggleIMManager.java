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
import com.juggle.im.model.MergeMessagePreviewUnit;
import com.juggle.im.model.PushData;
import com.juggle.im.model.MessageOptions;
import com.juggle.im.JIM;
import com.juggle.im.internal.logger.JLogConfig;
import com.juggle.im.internal.logger.JLogLevel;
import com.juggle.im.model.MessageContent.*;
import com.juggle.im.model.GroupInfo;
import com.juggle.im.model.GroupMember;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.nio.charset.StandardCharsets;

import org.json.JSONObject;
import org.json.JSONArray;
import org.json.JSONException;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;

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

    // 自定义消息类型注册表
    private Map<String, String> customMessageTypes = new HashMap<>();

    public JuggleIMManager(@Nonnull ReactApplicationContext reactContext) {
        super(reactContext);
    }

    @Nonnull
    @Override
    public String getName() {
        return MODULE_NAME;
    }

    // 添加这两个方法以解决React Native的警告
    @ReactMethod
    public void addListener(String eventName) {
        // Keep: Required for RN built in Event Emitter Calls.
    }

    @ReactMethod
    public void removeListeners(Integer count) {
        // Keep: Required for RN built in Event Emitter Calls.
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
        JIM.InitConfig.Builder builder = new JIM.InitConfig.Builder();
        JLogConfig.Builder logBuilder = new JLogConfig.Builder(getReactApplicationContext());
        logBuilder.setLogConsoleLevel(JLogLevel.JLogLevelVerbose);
        builder.setJLogConfig(new JLogConfig(logBuilder));
        JIM.getInstance().init(getCurrentActivity(), appKey, builder.build());
    }

    /**
     * 注册自定义消息类型
     *
     * @param contentType 消息类型标识符
     */
    @ReactMethod
    public void registerCustomMessageType(String contentType) {
        if (contentType == null || contentType.isEmpty() || contentType.startsWith("jg:")) {
            Log.e("JuggleIM", "contentType 不能以 'jg:' 开头");
            return;
        }
        customMessageTypes.put(contentType, contentType);
        Log.d("JuggleIM", "注册自定义消息类型: " + contentType);
    }

    /**
     * 连接到服务器
     *
     * @param token 用户token
     */
    @ReactMethod
    public void connect(String token) {
        JIM.getInstance().getConnectionManager().connect(token);
    }

    /**
     * // true 表示断开连接后还继续接收推送
     * // false 表示断开连接之后不再接收推送
     * 
     * @param pushable
     */
    @ReactMethod
    public void disconnect(boolean pushable) {
        JIM.getInstance().getConnectionManager().disconnect(pushable);
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

            @Override
            public void onMessageSetTop(Message message, UserInfo userInfo, boolean b) {
                WritableMap params = new WritableNativeMap();
                params.putString("key", key);
                params.putMap("message", convertMessageToMap(message));
                params.putMap("operator", convertUserInfoToMap(userInfo));
                params.putBoolean("isTop", b);
                sendEvent("MessageSetTop", params);
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
     * 消息销毁相关监听
     */
    @ReactMethod
    public void addMessageDestroyListener(String key) {
        JIM.getInstance().getMessageManager().addDestroyListener(key, new IMessageManager.IMessageDestroyListener() {
            /**
             * 消息销毁时间更新回调（一般发生在阅后即焚之类的场景）
             * 
             * @param messageId    消息 id
             * @param conversation 所在会话
             * @param destroyTime  更新后的销毁时间
             */
            @Override
            public void onMessageDestroyTimeUpdate(String messageId, Conversation conversation, long destroyTime) {
                WritableMap params = new WritableNativeMap();
                params.putString("key", key);
                params.putString("messageId", messageId);
                params.putMap("conversation", convertConversationToMap(conversation));
                params.putDouble("destroyTime", destroyTime);
                sendEvent("MessageDestroyTimeUpdated", params);
            }
        });
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
        WritableMap contentMap = convertMessageContentToMap(message.getContent());
        contentMap.putString("contentType", message.getContentType());
        map.putMap("content", contentMap);

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
        map.putBoolean("isEdit", message.isEdit());
        map.putBoolean("isDeleted", message.isDelete());

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
        byte[] bytes = content.encode();
        String str = new String(bytes, StandardCharsets.UTF_8);
        Log.d("JuggleIM", "convertMessageContentToMap: " + str);
        WritableMap map = RNTypeConverter.stringToWritableMap(str);
        if (content instanceof ImageMessage) {
            ImageMessage img = (ImageMessage) content;
            map.putString("localPath", img.getLocalPath());
            map.putString("thumbnailLocalPath", img.getThumbnailLocalPath());
            map.putString("thumbnailUrl", img.getThumbnailUrl());
        }
        return map;
    }

    private MessageContent convertMapToMessageContent(ReadableMap map) {
        String contentType = map.getString("contentType");
        switch (contentType) {
            case "jg:text":
                TextMessage text = new TextMessage(map.getString("content"));
                return text;
            case "jg:img":
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
            case "jg:merge":
                String title = map.getString("title");
                Conversation conversation = convertMapToConversation(map.getMap("conversation"));
                ReadableArray messageIdArray = map.getArray("messageIdList");
                List<String> messageIdList = new ArrayList<>();
                if (messageIdArray != null) {
                    for (int i = 0; i < messageIdArray.size(); i++) {
                        messageIdList.add(messageIdArray.getString(i));
                    }
                }

                ReadableArray previewArray = map.getArray("previewList");
                List<MergeMessagePreviewUnit> previewList = new ArrayList<>();
                if (previewArray != null) {
                    for (int i = 0; i < previewArray.size(); i++) {
                        previewList.add(convertMapToMergeMessagePreviewUnit(previewArray.getMap(i)));
                    }
                }
                MergeMessage merge = new MergeMessage(title, conversation, messageIdList, previewList);
                if (map.hasKey("containerMsgId")) {
                    merge.setContainerMsgId(map.getString("containerMsgId"));
                }
                if (map.hasKey("extra")) {
                    merge.setExtra(map.getString("extra"));
                }
                return merge;
            default:
                // 检查是否是自定义消息
                if (customMessageTypes.containsKey(contentType)) {
                    UnknownMessage msg = createUnknownMessage(map);
                    msg.setMessageType(contentType);
                    return msg;
                }
                Log.e("JuggleIM", "contentType: " + contentType);
                return RNTypeConverter.fromReadableMap(map, MessageContent.class);
        }
    }

    /**
     * 创建自定义消息对象
     */
    private UnknownMessage createUnknownMessage(ReadableMap map) {
        try {
            JSONObject jsonObject = convertReadableMapToJSON(map);
            String jsonStr = jsonObject.toString();
            UnknownMessage customMsg = new UnknownMessage();
            customMsg.setFlags(MessageFlag.IS_SAVE.getValue() | MessageFlag.IS_COUNTABLE.getValue());
            customMsg.setContent(jsonStr);
            return customMsg;
        } catch (JSONException e) {
            Log.e("JuggleIM", "创建自定义消息失败: " + e.getMessage());
            return null;
        }
    }

    /**
     * 将 ReadableMap 转换为 JSONObject
     */
    private JSONObject convertReadableMapToJSON(ReadableMap map) throws JSONException {
        JSONObject jsonObject = new JSONObject();
        ReadableMapKeySetIterator iterator = map.keySetIterator();

        while (iterator.hasNextKey()) {
            String key = iterator.nextKey();
            switch (map.getType(key)) {
                case Null:
                    jsonObject.put(key, JSONObject.NULL);
                    break;
                case Boolean:
                    jsonObject.put(key, map.getBoolean(key));
                    break;
                case Number:
                    jsonObject.put(key, map.getDouble(key));
                    break;
                case String:
                    jsonObject.put(key, map.getString(key));
                    break;
                case Map:
                    jsonObject.put(key, convertReadableMapToJSON(map.getMap(key)));
                    break;
                case Array:
                    jsonObject.put(key, convertReadableArrayToJSONArray(map.getArray(key)));
                    break;
            }
        }

        return jsonObject;
    }

    /**
     * 将 ReadableArray 转换为 JSONArray
     */
    private JSONArray convertReadableArrayToJSONArray(ReadableArray array) throws JSONException {
        JSONArray jsonArray = new JSONArray();

        for (int i = 0; i < array.size(); i++) {
            switch (array.getType(i)) {
                case Null:
                    jsonArray.put(JSONObject.NULL);
                    break;
                case Boolean:
                    jsonArray.put(array.getBoolean(i));
                    break;
                case Number:
                    jsonArray.put(array.getDouble(i));
                    break;
                case String:
                    jsonArray.put(array.getString(i));
                    break;
                case Map:
                    jsonArray.put(convertReadableMapToJSON(array.getMap(i)));
                    break;
                case Array:
                    jsonArray.put(convertReadableArrayToJSONArray(array.getArray(i)));
                    break;
            }
        }

        return jsonArray;
    }

    /**
     * 将 JSONObject 转换为 WritableMap
     */
    private WritableMap convertJSONToWritableMap(JSONObject jsonObject) throws JSONException {
        WritableMap map = new WritableNativeMap();

        Iterator<String> iterator = jsonObject.keys();
        while (iterator.hasNext()) {
            String key = iterator.next();
            Object value = jsonObject.get(key);
            if (value instanceof JSONObject) {
                map.putMap(key, convertJSONToWritableMap((JSONObject) value));
            } else if (value instanceof JSONArray) {
                map.putArray(key, convertJSONArrayToWritableArray((JSONArray) value));
            } else if (value instanceof Boolean) {
                map.putBoolean(key, (Boolean) value);
            } else if (value instanceof Integer) {
                map.putInt(key, (Integer) value);
            } else if (value instanceof Double) {
                map.putDouble(key, (Double) value);
            } else if (value instanceof String) {
                map.putString(key, (String) value);
            } else if (value == JSONObject.NULL) {
                map.putNull(key);
            }
        }

        return map;
    }

    /**
     * 将 JSONArray 转换为 WritableArray
     */
    private WritableArray convertJSONArrayToWritableArray(JSONArray jsonArray) throws JSONException {
        WritableArray array = new WritableNativeArray();

        for (int i = 0; i < jsonArray.length(); i++) {
            Object value = jsonArray.get(i);

            if (value instanceof JSONObject) {
                array.pushMap(convertJSONToWritableMap((JSONObject) value));
            } else if (value instanceof JSONArray) {
                array.pushArray(convertJSONArrayToWritableArray((JSONArray) value));
            } else if (value instanceof Boolean) {
                array.pushBoolean((Boolean) value);
            } else if (value instanceof Integer) {
                array.pushInt((Integer) value);
            } else if (value instanceof Double) {
                array.pushDouble((Double) value);
            } else if (value instanceof String) {
                array.pushString((String) value);
            } else if (value == JSONObject.NULL) {
                array.pushNull();
            }
        }

        return array;
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
        if (userInfo.getExtra() != null) {
            WritableMap extra = new WritableNativeMap();
            for (Map.Entry<String, String> entry : userInfo.getExtra().entrySet()) {
                extra.putString(entry.getKey(), entry.getValue());
            }
            map.putMap("extra", extra);
        }
        map.putDouble("updatedTime", userInfo.getUpdatedTime());

        return map;
    }

    /**
     * 将群组信息转换为Map
     */
    private WritableMap convertGroupInfoToMap(GroupInfo groupInfo) {
        WritableMap map = new WritableNativeMap();
        map.putString("groupId", groupInfo.getGroupId());
        map.putString("groupName", groupInfo.getGroupName());
        map.putString("portrait", groupInfo.getPortrait());
        if (groupInfo.getExtra() != null) {
            WritableMap extra = new WritableNativeMap();
            for (Map.Entry<String, String> entry : groupInfo.getExtra().entrySet()) {
                extra.putString(entry.getKey(), entry.getValue());
            }
            map.putMap("extra", extra);
        }
        map.putDouble("updatedTime", groupInfo.getUpdatedTime());
        return map;
    }

    /**
     * 将群成员信息转换为Map
     */
    private WritableMap convertGroupMemberToMap(GroupMember groupMember) {
        WritableMap map = new WritableNativeMap();
        map.putString("groupId", groupMember.getGroupId());
        map.putString("userId", groupMember.getUserId());
        map.putString("groupDisplayName", groupMember.getGroupDisplayName());
        if (groupMember.getExtra() != null) {
            WritableMap extra = new WritableNativeMap();
            for (Map.Entry<String, String> entry : groupMember.getExtra().entrySet()) {
                extra.putString(entry.getKey(), entry.getValue());
            }
            map.putMap("extra", extra);
        }
        map.putDouble("updatedTime", groupMember.getUpdatedTime());
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

    // conversation

    /**
     * 获取会话信息列表
     */
    @ReactMethod
    public void getConversationInfoList(int count, double ts, int pullDirection, Promise promise) {
        try {
            JIMConst.PullDirection direction = pullDirection == 0 ? JIMConst.PullDirection.NEWER
                    : JIMConst.PullDirection.OLDER;

            List<ConversationInfo> conversationInfos = com.juggle.im.JIM.getInstance().getConversationManager()
                    .getConversationInfoList(count, (long) ts, direction);
            Log.d("JuggleIM", "conversationInfos: " + conversationInfos.size());
            WritableArray result = new WritableNativeArray();
            for (ConversationInfo info : conversationInfos) {
                result.pushMap(convertConversationInfoToMap(info));
            }
            promise.resolve(result);
        } catch (Exception e) {
            e.printStackTrace();
            promise.reject(e);
        }
    }

    /**
     * 获取会话信息列表
     */
    @ReactMethod
    public void getTopConversationInfoList(int count, double ts, int pullDirection, Promise promise) {
        try {
            JIMConst.PullDirection direction = pullDirection == 0 ? JIMConst.PullDirection.NEWER
                    : JIMConst.PullDirection.OLDER;

            List<ConversationInfo> conversationInfos = com.juggle.im.JIM.getInstance().getConversationManager()
                    .getTopConversationInfoList(count, (long) ts, direction);
            Log.d("JuggleIM", "top conversationInfos: " + conversationInfos.size());
            WritableArray result = new WritableNativeArray();
            for (ConversationInfo info : conversationInfos) {
                result.pushMap(convertConversationInfoToMap(info));
            }
            promise.resolve(result);
        } catch (Exception e) {
            e.printStackTrace();
            promise.reject(e);
        }
    }

    /**
     * 获取用户信息
     */
    @ReactMethod
    public void getUserInfo(String userId, Promise promise) {
        UserInfo userInfo = JIM.getInstance().getUserInfoManager().getUserInfo(userId);
        if (userInfo != null) {
            promise.resolve(convertUserInfoToMap(userInfo));
        } else {
            promise.resolve(null);
        }
    }

    /**
     * 获取群组信息
     */
    @ReactMethod
    public void getGroupInfo(String groupId, Promise promise) {
        GroupInfo groupInfo = JIM.getInstance().getUserInfoManager().getGroupInfo(groupId);
        if (groupInfo != null) {
            promise.resolve(convertGroupInfoToMap(groupInfo));
        } else {
            promise.resolve(null);
        }
    }

    /**
     * 获取群成员信息
     */
    @ReactMethod
    public void getGroupMember(String groupId, String userId, Promise promise) {
        GroupMember groupMember = JIM.getInstance().getUserInfoManager().getGroupMember(groupId, userId);
        if (groupMember != null) {
            promise.resolve(convertGroupMemberToMap(groupMember));
        } else {
            promise.resolve(null);
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
     * 上传图片
     */
    @ReactMethod
    public void uploadImage(String localPath, Promise promise) {
        try {
            String path = localPath;
            if (path.startsWith("file://")) {
                path = path.substring(7);
            }
            JIM.getInstance().getMessageManager().uploadImage(localPath, new JIMConst.IResultCallback<String>() {
                @Override
                public void onSuccess(String s) {
                    promise.resolve(s);
                }

                @Override
                public void onError(int i) {
                    promise.reject(String.valueOf(i), "Upload failed with code: " + i);
                }
            });
        } catch (Exception e) {
            e.printStackTrace();
            promise.reject("-1", e.getMessage());
        }
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
        if (info == null) {
            return null;
        }
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
        if (mentionInfo == null) {
            return null;
        }
        WritableMap map = new WritableNativeMap();
        WritableArray userMap = new WritableNativeArray();
        map.putInt("type", mentionInfo.getType().getValue());
        if (mentionInfo.getTargetUsers() != null) {
            for (UserInfo userInfo : mentionInfo.getTargetUsers()) {
                userMap.pushMap(convertUserInfoToMap(userInfo));
            }
            map.putArray("targetUsers", userMap);
        }
        return map;
    }

    /**
     * 发送消息
     */
    @ReactMethod
    public void sendMessage(ReadableMap messageMap, String messageId, Promise promise) {
        Message message = convertMapToMessage(messageMap);
        Log.d("JuggleIM", "sendMessage: " + messageId);
        PushData pushData = convertMapToPushData(messageMap);

        MessageOptions options = new MessageOptions();
        options.setPushData(pushData);
        options.setMentionInfo(message.getMentionInfo());
        if (messageMap.hasKey("referredMessageId")) {
            options.setReferredMessageId(messageMap.getString("referredMessageId"));
        }

        Message sendMsg = JIM.getInstance().getMessageManager().sendMessage(
                message.getContent(),
                message.getConversation(),
                options,
                new IMessageManager.ISendMessageCallback() {
                    @Override
                    public void onSuccess(Message sentMessage) {
                        WritableMap result = convertMessageToMap(sentMessage);
                        WritableMap event = new WritableNativeMap();
                        event.putString("messageId", messageId);
                        event.putMap("message", result);
                        sendEvent("onMessageSent", event);
                    }

                    @Override
                    public void onError(Message message, int errorCode) {
                        WritableMap errorResult = convertMessageToMap(message);
                        WritableMap event = new WritableNativeMap();
                        event.putString("messageId", messageId);
                        event.putMap("message", errorResult);
                        event.putInt("errorCode", errorCode);
                        sendEvent("onMessageSentError", event);
                    }
                });
        WritableMap result = convertMessageToMap(sendMsg);
        result.putString("messageId", messageId);
        promise.resolve(result);
    }

    /**
     * 根据clientMsgNo列表删除消息
     */
    @ReactMethod
    public void deleteMessagesByClientMsgNoList(ReadableMap conversationMap, ReadableArray clientMsgNos,
            Promise promise) {
        Conversation conversation = convertMapToConversation(conversationMap);
        List<Long> msgNoList = new ArrayList<>();
        for (int i = 0; i < clientMsgNos.size(); i++) {
            msgNoList.add((long) clientMsgNos.getDouble(i));
        }

        JIM.getInstance().getMessageManager()
                .deleteMessagesByClientMsgNoList(conversation, msgNoList, new IMessageManager.ISimpleCallback() {
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

            JIMConst.PullDirection pullDirection = direction == 0 ? JIMConst.PullDirection.NEWER
                    : JIMConst.PullDirection.OLDER;
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
                    });
        } catch (Exception e) {
            promise.reject("GET_MESSAGES_ERROR", e.getMessage());
        }
    }

    /**
     * 撤回消息
     */
    @ReactMethod
    public void recallMessage(String messageId, ReadableMap extras, Promise promise) {
        try {
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
                    });
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
                    });
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
                    });
        } catch (Exception e) {
            promise.reject("REMOVE_REACTION_ERROR", e.getMessage());
        }
    }

    /**
     * 发送图片消息
     */
    @ReactMethod
    public void sendImageMessage(ReadableMap messageMap, String messageId, Promise promise) {
        try {
            Conversation conversation = convertMapToConversation(messageMap);
            ImageMessage imageMessage = new ImageMessage();

            ReadableMap contentMap = messageMap.getMap("content");
            if (contentMap.hasKey("localPath")) {
                String path = FileUtils.convertContentUriToFile(getReactApplicationContext(),
                        contentMap.getString("localPath"));
                imageMessage.setLocalPath(path);
            }
            if (contentMap.hasKey("thumbnailLocalPath")) {
                String path = FileUtils.convertContentUriToFile(getReactApplicationContext(),
                        contentMap.getString("localPath"));
                imageMessage.setThumbnailLocalPath(path);
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

            MessageOptions options = new MessageOptions();
            PushData pushData = convertMapToPushData(messageMap);
            if (pushData != null) {
                options.setPushData(pushData);
            }
            ReadableMap mentionInfoMap = messageMap.getMap("mentionInfo");
            if (mentionInfoMap != null) {
                MessageMentionInfo mentionInfo = convertMapToMentionInfo(mentionInfoMap);
                options.setMentionInfo(mentionInfo);
            }
            if (messageMap.hasKey("referredMessageId")) {
                options.setReferredMessageId(messageMap.getString("referredMessageId"));
            }

            Message message = JIM.getInstance().getMessageManager().sendMediaMessage(
                    imageMessage,
                    conversation,
                    options,
                    new IMessageManager.ISendMediaMessageCallback() {
                        @Override
                        public void onProgress(int progress, Message message) {
                            WritableMap params = new WritableNativeMap();
                            params.putString("messageId", messageId);
                            params.putInt("progress", progress);
                            params.putMap("message", convertMessageToMap(message));
                            Log.d("JuggleIM", "onMediaMessageProgress: " + progress);
                            sendEvent("onMediaMessageProgress", params);
                        }

                        @Override
                        public void onSuccess(Message message) {
                            WritableMap params = new WritableNativeMap();
                            params.putString("messageId", messageId);
                            params.putMap("message", convertMessageToMap(message));
                            sendEvent("onMediaMessageSent", params);
                        }

                        @Override
                        public void onError(Message message, int errorCode) {
                            WritableMap params = new WritableNativeMap();
                            params.putString("messageId", messageId);
                            params.putMap("message", convertMessageToMap(message));
                            params.putInt("errorCode", errorCode);
                            sendEvent("onMediaMessageSentError", params);
                        }

                        @Override
                        public void onCancel(Message message) {
                            WritableMap params = new WritableNativeMap();
                            params.putString("messageId", messageId);
                            params.putMap("message", convertMessageToMap(message));
                            sendEvent("onMediaMessageCancelled", params);
                        }
                    });

            WritableMap result = convertMessageToMap(message);
            result.putString("messageId", messageId);
            promise.resolve(result);
        } catch (Exception e) {
            promise.reject("SEND_IMAGE_MESSAGE_ERROR", e.getMessage());
        }
    }

    /**
     * 发送文件消息
     */
    @ReactMethod
    public void sendFileMessage(ReadableMap messageMap, String messageId, Promise promise) {
        try {
            Conversation conversation = convertMapToConversation(messageMap);
            FileMessage fileMessage = new FileMessage();

            ReadableMap contentMap = messageMap.getMap("content");
            if (contentMap.hasKey("localPath")) {
                String path = FileUtils.convertContentUriToFile(getReactApplicationContext(),
                        contentMap.getString("localPath"));
                fileMessage.setLocalPath(path);
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
            MessageOptions options = new MessageOptions();
            PushData pushData = convertMapToPushData(messageMap);
            if (pushData != null) {
                options.setPushData(pushData);
            }
            ReadableMap mentionInfoMap = messageMap.getMap("mentionInfo");
            if (mentionInfoMap != null) {
                MessageMentionInfo mentionInfo = convertMapToMentionInfo(mentionInfoMap);
                options.setMentionInfo(mentionInfo);
            }
            if (messageMap.hasKey("referredMessageId")) {
                options.setReferredMessageId(messageMap.getString("referredMessageId"));
            }

            Message message = JIM.getInstance().getMessageManager().sendMediaMessage(
                    fileMessage,
                    conversation,
                    options,
                    new IMessageManager.ISendMediaMessageCallback() {
                        @Override
                        public void onProgress(int progress, Message message) {
                            WritableMap params = new WritableNativeMap();
                            params.putString("messageId", messageId);
                            params.putInt("progress", progress);
                            params.putMap("message", convertMessageToMap(message));
                            sendEvent("onMediaMessageProgress", params);
                        }

                        @Override
                        public void onSuccess(Message message) {
                            WritableMap params = new WritableNativeMap();
                            params.putString("messageId", messageId);
                            params.putMap("message", convertMessageToMap(message));
                            sendEvent("onMediaMessageSent", params);
                        }

                        @Override
                        public void onError(Message message, int errorCode) {
                            WritableMap params = new WritableNativeMap();
                            params.putString("messageId", messageId);
                            params.putMap("message", convertMessageToMap(message));
                            params.putInt("errorCode", errorCode);
                            sendEvent("onMediaMessageSentError", params);
                        }

                        @Override
                        public void onCancel(Message message) {
                            WritableMap params = new WritableNativeMap();
                            params.putString("messageId", messageId);
                            params.putMap("message", convertMessageToMap(message));
                            sendEvent("onMediaMessageCancelled", params);
                        }
                    });

            WritableMap result = convertMessageToMap(message);
            result.putString("messageId", messageId);
            promise.resolve(result);
        } catch (Exception e) {
            promise.reject("SEND_FILE_MESSAGE_ERROR", e.getMessage());
        }
    }

    /**
     * 发送语音消息
     */
    @ReactMethod
    public void sendVoiceMessage(ReadableMap messageMap, String messageId, Promise promise) {
        try {
            Conversation conversation = convertMapToConversation(messageMap);
            VoiceMessage voiceMessage = new VoiceMessage();

            ReadableMap contentMap = messageMap.getMap("content");
            if (contentMap.hasKey("localPath")) {
                String path = FileUtils.convertContentUriToFile(getReactApplicationContext(),
                        contentMap.getString("localPath"));
                voiceMessage.setLocalPath(path.replace("file://", ""));
            }
            if (contentMap.hasKey("url")) {
                voiceMessage.setUrl(contentMap.getString("url"));
            }
            if (contentMap.hasKey("duration")) {
                voiceMessage.setDuration(contentMap.getInt("duration"));
            }
            MessageOptions options = new MessageOptions();
            PushData pushData = convertMapToPushData(messageMap);
            if (pushData != null) {
                options.setPushData(pushData);
            }
            ReadableMap mentionInfoMap = messageMap.getMap("mentionInfo");
            if (mentionInfoMap != null) {
                MessageMentionInfo mentionInfo = convertMapToMentionInfo(mentionInfoMap);
                options.setMentionInfo(mentionInfo);
            }
            if (messageMap.hasKey("referredMessageId")) {
                options.setReferredMessageId(messageMap.getString("referredMessageId"));
            }
            Message message = JIM.getInstance().getMessageManager().sendMediaMessage(
                    voiceMessage,
                    conversation,
                    options,
                    new IMessageManager.ISendMediaMessageCallback() {
                        @Override
                        public void onProgress(int progress, Message message) {
                            WritableMap params = new WritableNativeMap();
                            params.putString("messageId", messageId);
                            params.putInt("progress", progress);
                            params.putMap("message", convertMessageToMap(message));
                            Log.d("JuggleIM", "onMediaMessageProgress: " + progress);
                            sendEvent("onMediaMessageProgress", params);
                        }

                        @Override
                        public void onSuccess(Message message) {
                            WritableMap result = convertMessageToMap(message);
                            result.putString("messageId", messageId);
                            Log.d("JuggleIM", "onMediaMessageSent");
                            sendEvent("onMediaMessageSent", result);
                        }

                        @Override
                        public void onError(Message message, int errorCode) {
                            WritableMap params = new WritableNativeMap();
                            params.putString("messageId", messageId);
                            params.putMap("message", convertMessageToMap(message));
                            params.putInt("errorCode", errorCode);
                            sendEvent("onMediaMessageSentError", params);
                        }

                        @Override
                        public void onCancel(Message message) {
                            WritableMap result = convertMessageToMap(message);
                            result.putString("messageId", messageId);
                            sendEvent("onMediaMessageCancelled", result);
                        }
                    });

            WritableMap result = convertMessageToMap(message);
            result.putString("messageId", messageId);
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

        if (messageMap.hasKey("mentionInfo")) {
            ReadableMap mentionInfoMap = messageMap.getMap("mentionInfo");
            MessageMentionInfo mentionInfo = convertMapToMentionInfo(mentionInfoMap);
            message.setMentionInfo(mentionInfo);
        }

        return message;
    }

    private PushData convertMapToPushData(ReadableMap map) {
        if (!map.hasKey("pushData")) {
            return null;
        }
        ReadableMap pushDataMap = map.getMap("pushData");
        PushData pushData = new PushData();
        if (pushDataMap.hasKey("content")) {
            pushData.setContent(pushDataMap.getString("content"));
        }
        if (pushDataMap.hasKey("extra")) {
            pushData.setExtra(pushDataMap.getString("extra"));
        }
        return pushData;
    }

    private MessageMentionInfo convertMapToMentionInfo(ReadableMap mentionInfoMap) {
        MessageMentionInfo mentionInfo = new MessageMentionInfo();
        if (mentionInfoMap.hasKey("type")) {
            MessageMentionInfo.MentionType type = MessageMentionInfo.MentionType
                    .setValue(mentionInfoMap.getInt("type"));
            mentionInfo.setType(type);
        }
        if (mentionInfoMap.hasKey("targetUsers")) {
            ReadableArray targetUsers = mentionInfoMap.getArray("targetUsers");
            List<UserInfo> targetUsersList = new ArrayList<>();
            for (int i = 0; i < targetUsers.size(); i++) {
                ReadableMap userMap = targetUsers.getMap(i);
                UserInfo userInfo = convertMapToUserInfo(userMap);
                targetUsersList.add(userInfo);
            }
            mentionInfo.setTargetUsers(targetUsersList);
        }
        return mentionInfo;
    }

    private UserInfo convertMapToUserInfo(ReadableMap userMap) {
        UserInfo userInfo = new UserInfo();
        if (userMap.hasKey("userId")) {
            userInfo.setUserId(userMap.getString("userId"));
        }
        if (userMap.hasKey("nickname")) {
            userInfo.setUserName(userMap.getString("nickname"));
        }
        if (userMap.hasKey("avatar")) {
            userInfo.setPortrait(userMap.getString("avatar"));
        }
        if (userMap.hasKey("extra")) {
            Map<String, String> extra = new HashMap<>();
            ReadableMap extraMap = userMap.getMap("extra");
            ReadableMapKeySetIterator iterator = extraMap.keySetIterator();
            while (iterator.hasNextKey()) {
                String key = iterator.nextKey();
                extra.put(key, extraMap.getString(key));
            }
            userInfo.setExtra(extra);
        }
        return userInfo;
    }

    private MergeMessagePreviewUnit convertMapToMergeMessagePreviewUnit(ReadableMap map) {
        String previewContent = "";
        if (map.hasKey("previewContent")) {
            previewContent = map.getString("previewContent");
        }
        UserInfo sender = new UserInfo();
        if (map.hasKey("sender")) {
            sender = convertMapToUserInfo(map.getMap("sender"));
        }
        MergeMessagePreviewUnit unit = new MergeMessagePreviewUnit();
        unit.setPreviewContent(previewContent);
        unit.setSender(sender);
        return unit;
    }

    /**
     * 发送消息已读回执
     * 
     * @param conversationMap 会话对象
     * @param messageIds      消息ID列表
     * @param promise         Promise对象
     */
    @ReactMethod
    public void sendReadReceipt(ReadableMap conversationMap, ReadableArray messageIds, Promise promise) {
        try {
            Conversation conversation = convertMapToConversation(conversationMap);
            List<String> msgIdList = new ArrayList<>();
            for (int i = 0; i < messageIds.size(); i++) {
                msgIdList.add(messageIds.getString(i));
            }

            JIM.getInstance().getMessageManager().sendReadReceipt(conversation, msgIdList,
                    new IMessageManager.ISendReadReceiptCallback() {
                        @Override
                        public void onSuccess() {
                            promise.resolve(true);
                        }

                        @Override
                        public void onError(int errorCode) {
                            promise.reject("error", "Error code: " + errorCode);
                        }
                    });
        } catch (Exception e) {
            e.printStackTrace();
            promise.reject(e);
        }
    }

    /**
     * 更新消息
     * 
     * @param messageId       消息ID
     * @param contentMap      新的消息内容
     * @param conversationMap 会话对象
     * @param promise         Promise对象
     */
    @ReactMethod
    public void updateMessage(String messageId, ReadableMap contentMap, ReadableMap conversationMap, Promise promise) {
        try {
            MessageContent content = convertMapToMessageContent(contentMap);
            Conversation conversation = convertMapToConversation(conversationMap);

            JIM.getInstance().getMessageManager().updateMessage(messageId, content, conversation,
                    new IMessageManager.IMessageCallback() {
                        @Override
                        public void onSuccess(Message message) {
                            promise.resolve(convertMessageToMap(message));
                        }

                        @Override
                        public void onError(int errorCode) {
                            promise.reject("error", "Error code: " + errorCode);
                        }
                    });
        } catch (Exception e) {
            e.printStackTrace();
            promise.reject(e);
        }
    }

    /**
     * 设置消息置顶
     * 
     * @param messageId       消息ID
     * @param conversationMap 会话对象
     * @param isTop           是否置顶
     * @param promise         Promise对象
     */
    @ReactMethod
    public void setMessageTop(String messageId, ReadableMap conversationMap, boolean isTop, Promise promise) {
        try {
            Conversation conversation = convertMapToConversation(conversationMap);

            JIM.getInstance().getMessageManager().setTop(messageId, conversation, isTop,
                    new IMessageManager.ISimpleCallback() {
                        @Override
                        public void onSuccess() {
                            promise.resolve(true);
                        }

                        @Override
                        public void onError(int errorCode) {
                            promise.reject("error", "Error code: " + errorCode);
                        }
                    });
        } catch (Exception e) {
            e.printStackTrace();
            promise.reject(e);
        }
    }

    /**
     * 获取合并消息列表
     * 
     * @param messageId 合并消息ID
     * @param promise   Promise对象
     */
    @ReactMethod
    public void getMergedMessageList(String messageId, Promise promise) {
        JIM.getInstance().getMessageManager().getMergedMessageList(messageId,
                new IMessageManager.IGetMessagesCallback() {
                    @Override
                    public void onSuccess(List<Message> list) {
                        WritableArray array = new WritableNativeArray();
                        for (Message msg : list) {
                            array.pushMap(convertMessageToMap(msg));
                        }
                        promise.resolve(array);
                    }

                    @Override
                    public void onError(int i) {
                        promise.reject(String.valueOf(i), "getMergedMessageList failed");
                    }
                });
    }

    /**
     * 从服务端获取用户信息
     * 
     * @param userId 用户ID
     */
    @ReactMethod
    public void fetchUserInfo(String userId, Promise promise) {
        JIM.getInstance().getUserInfoManager().fetchUserInfo(userId, new JIMConst.IResultCallback<UserInfo>() {
            @Override
            public void onSuccess(UserInfo userInfo) {
                if (userInfo != null) {
                    promise.resolve(convertUserInfoToMap(userInfo));
                } else {
                    promise.resolve(null);
                }
            }

            @Override
            public void onError(int i) {
                promise.reject(String.valueOf(i), "fetchUserInfo failed");
            }
        });
    }

    /**
     * 从服务端获取群组信息
     * 
     * @param groupId 群组ID
     */
    @ReactMethod
    public void fetchGroupInfo(String groupId, Promise promise) {
        JIM.getInstance().getUserInfoManager().fetchGroupInfo(groupId, new JIMConst.IResultCallback<GroupInfo>() {
            @Override
            public void onSuccess(GroupInfo groupInfo) {
                if (groupInfo != null) {
                    promise.resolve(convertGroupInfoToMap(groupInfo));
                } else {
                    promise.resolve(null);
                }
            }

            @Override
            public void onError(int i) {
                promise.reject(String.valueOf(i), "fetchGroupInfo failed");
            }
        });
    }

    /**
     * 批量获取用户信息
     * 
     * @param userIdList 用户ID列表
     */
    @ReactMethod
    public void getUserInfoList(ReadableArray userIdList, Promise promise) {
        List<String> ids = new ArrayList<>();
        for (int i = 0; i < userIdList.size(); i++) {
            ids.add(userIdList.getString(i));
        }
        List<UserInfo> users = JIM.getInstance().getUserInfoManager().getUserInfoList(ids);
        WritableArray array = new WritableNativeArray();
        for (UserInfo user : users) {
            array.pushMap(convertUserInfoToMap(user));
        }
        promise.resolve(array);
    }

    /**
     * 批量获取群组信息
     * 
     * @param groupIdList 群组ID列表
     */
    @ReactMethod
    public void getGroupInfoList(ReadableArray groupIdList, Promise promise) {
        List<String> ids = new ArrayList<>();
        for (int i = 0; i < groupIdList.size(); i++) {
            ids.add(groupIdList.getString(i));
        }
        List<GroupInfo> groups = JIM.getInstance().getUserInfoManager().getGroupInfoList(ids);
        WritableArray array = new WritableNativeArray();
        for (GroupInfo group : groups) {
            array.pushMap(convertGroupInfoToMap(group));
        }
        promise.resolve(array);
    }
}