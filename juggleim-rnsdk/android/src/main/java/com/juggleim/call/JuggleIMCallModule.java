
package com.juggleim.call;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.modules.core.DeviceEventManagerModule;
import com.juggle.im.JIM;
import com.juggle.im.call.CallConst;
import com.juggle.im.call.ICallManager;
import com.juggle.im.call.ICallSession;
import com.juggle.im.call.internal.CallManager;
import com.juggle.im.call.model.CallInfo;
import com.juggle.im.call.model.CallMember;
import com.juggle.im.call.model.CallVideoDenoiseParams;
import com.juggle.im.model.Conversation;
import com.juggle.im.model.UserInfo;
import com.juggleim.RNTypeConverter;
import com.facebook.react.bridge.UIManager;
import com.facebook.react.uimanager.UIManagerHelper;
import com.facebook.react.uimanager.common.ViewUtil;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import android.util.Log;

public class JuggleIMCallModule extends ReactContextBaseJavaModule {
    private static final String MODULE_NAME = "JuggleIMCallModule";
    private final ReactApplicationContext mReactContext;
    private final Map<String, ICallManager.ICallReceiveListener> mReceiveListeners = new HashMap<>();
    private final Map<String, ICallManager.IConversationCallListener> mConversationCallListeners = new HashMap<>();
    private final Map<String, ICallSession.ICallSessionListener> mSessionListeners = new HashMap<>();
    // Store session listeners by callId + key
    private final Map<String, Map<String, ICallSession.ICallSessionListener>> mCallSessionListeners = new HashMap<>();

    public JuggleIMCallModule(ReactApplicationContext reactContext) {
        super(reactContext);
        mReactContext = reactContext;
    }

    @Override
    public String getName() {
        return MODULE_NAME;
    }

    @ReactMethod
    public void addListener(String eventName) {
        // Required for RN built-in Event Emitter Calls.
    }

    @ReactMethod
    public void removeListeners(Integer count) {
        // Required for RN built-in Event Emitter Calls.
    }

    private ICallManager getCallManager() {
        return JIM.getInstance().getCallManager();
    }

    @ReactMethod
    public void initZegoEngine(int appId) {
        getCallManager().initZegoEngine(appId, mReactContext);
    }

    @ReactMethod
    public void initLiveKitEngine() {
        getCallManager().initLiveKitEngine(mReactContext);
    }

    @ReactMethod
    public void initAgoraEngine(String appId) {
        getCallManager().initAgoraEngine(appId, mReactContext);
    }

    @ReactMethod
    public void startSingleCall(String userId, int mediaType, String extra, Promise promise) {
        try {
            ICallSession session = getCallManager().startSingleCall(userId, CallConst.CallMediaType.setValue(mediaType),
                    extra, null);
            promise.resolve(convertCallSessionToMap(session));
        } catch (Exception e) {
            promise.reject(e);
        }
    }

    @ReactMethod
    public void startMultiCall(ReadableArray userIdList, int mediaType, String extra, ReadableMap conversationMap,
            Promise promise) {
        try {
            List<String> userIds = new ArrayList<>();
            for (int i = 0; i < userIdList.size(); i++) {
                userIds.add(userIdList.getString(i));
            }
            Conversation conversation = null;
            if (conversationMap != null) {
                conversation = RNTypeConverter.fromReadableMap(conversationMap, Conversation.class);
            }
            ICallSession session = getCallManager().startMultiCall(userIds, CallConst.CallMediaType.setValue(mediaType),
                    conversation, extra, null);
            promise.resolve(convertCallSessionToMap(session));
        } catch (Exception e) {
            promise.reject(e);
        }
    }

    @ReactMethod
    public void joinCall(String callId, Promise promise) {
        try {
            ICallSession session = getCallManager().joinCall(callId, null);
            promise.resolve(convertCallSessionToMap(session));
        } catch (Exception e) {
            promise.reject(e);
        }
    }

    @ReactMethod
    public void getCallSession(String callId, Promise promise) {
        ICallSession session = getCallManager().getCallSession(callId);
        if (session != null) {
            promise.resolve(convertCallSessionToMap(session));
        } else {
            promise.resolve(null);
        }
    }

    @ReactMethod
    public void addReceiveListener(String key) {
        ICallManager.ICallReceiveListener listener = new ICallManager.ICallReceiveListener() {
            @Override
            public void onCallReceive(ICallSession callSession) {
                WritableMap params = Arguments.createMap();
                params.putString("key", key);
                params.putMap("callSession", convertCallSessionToMap(callSession));
                sendEvent("CallManager_onCallReceive", params);
            }
        };
        mReceiveListeners.put(key, listener);
        getCallManager().addReceiveListener(key, listener);
    }

    @ReactMethod
    public void removeReceiveListener(String key) {
        ICallManager.ICallReceiveListener listener = mReceiveListeners.remove(key);
        if (listener != null) {
            getCallManager().removeReceiveListener(key);
        }
    }

    @ReactMethod
    public void addConversationCallListener(String key) {
        ICallManager.IConversationCallListener listener = new ICallManager.IConversationCallListener() {
            @Override
            public void onCallInfoUpdate(CallInfo callInfo, Conversation conversation, boolean isFinished) {
                WritableMap params = Arguments.createMap();
                params.putString("key", key);
                params.putMap("callInfo", convertCallInfoToMap(callInfo));
                // params.putMap("conversation", RNTypeConverter.toWritableMap(conversation));
                // // Use RNTypeConverter for Conversation
                // Since I can't access RNTypeConverter.toWritableMap easily if it's protected
                // or I need to handle Enums manually for Conversation if needed.
                // Assuming RNTypeConverter works fine for POJO Conversation.
                // But RNTypeConverter.toWritableMap(obj) is public.
                params.putMap("conversation", RNTypeConverter.toWritableMap(conversation));
                params.putBoolean("isFinished", isFinished);
                sendEvent("CallManager_onCallInfoUpdate", params);
            }
        };
        mConversationCallListeners.put(key, listener);
        getCallManager().addConversationCallListener(key, listener);
    }

    @ReactMethod
    public void removeConversationCallListener(String key) {
        ICallManager.IConversationCallListener listener = mConversationCallListeners.remove(key);
        if (listener != null) {
            getCallManager().removeConversationCallListener(key);
        }
    }

    // Session Methods

    @ReactMethod
    public void accept(String callId) {
        ICallSession session = getCallManager().getCallSession(callId);
        if (session != null)
            session.accept();
    }

    @ReactMethod
    public void hangup(String callId) {
        ICallSession session = getCallManager().getCallSession(callId);
        if (session != null)
            session.hangup();
    }

    @ReactMethod
    public void enableCamera(String callId, boolean enable) {
        ICallSession session = getCallManager().getCallSession(callId);
        if (session != null)
            session.enableCamera(enable);
    }

    @ReactMethod
    public void muteMicrophone(String callId, boolean mute) {
        ICallSession session = getCallManager().getCallSession(callId);
        if (session != null)
            session.muteMicrophone(mute);
    }

    @ReactMethod
    public void muteSpeaker(String callId, boolean mute) {
        ICallSession session = getCallManager().getCallSession(callId);
        if (session != null)
            session.muteSpeaker(mute);
    }

    @ReactMethod
    public void setSpeakerEnable(String callId, boolean enable) {
        ICallSession session = getCallManager().getCallSession(callId);
        if (session != null)
            session.setSpeakerEnable(enable);
    }

    @ReactMethod
    public void useFrontCamera(String callId, boolean enable) {
        ICallSession session = getCallManager().getCallSession(callId);
        if (session != null)
            session.useFrontCamera(enable);
    }

    @ReactMethod
    public void inviteUsers(String callId, ReadableArray userIdList) {
        ICallSession session = getCallManager().getCallSession(callId);
        if (session != null) {
            List<String> list = new ArrayList<>();
            for (int i = 0; i < userIdList.size(); i++) {
                list.add(userIdList.getString(i));
            }
            session.inviteUsers(list);
        }
    }

    @ReactMethod
    public void enableAEC(String callId, boolean enable) {
        ICallSession session = getCallManager().getCallSession(callId);
        if (session != null)
            session.enableAEC(enable);
    }

    @ReactMethod
    public void setVideoDenoiseParams(String callId, ReadableMap params) {
        ICallSession session = getCallManager().getCallSession(callId);
        if (session != null) {
            CallVideoDenoiseParams p = new CallVideoDenoiseParams();
            // TODO: Populate 'p' from 'params'
            session.setVideoDenoiseParams(p);
        }
    }

    @ReactMethod
    public void setVideoView(String callId, String userId, int viewTag) {
        mReactContext.runOnUiQueueThread(() -> {
            ICallSession session = getCallManager().getCallSession(callId);
            if (session == null)
                return;

            try {
                int uiManagerType = ViewUtil.getUIManagerType(viewTag);
                UIManager uiManager = UIManagerHelper.getUIManager(mReactContext, uiManagerType);
                android.view.View view = uiManager.resolveView(viewTag);
                session.setVideoView(userId, ((com.juggleim.call.view.ZegoSurfaceView) view).getView());
            } catch (Exception e) {
                e.printStackTrace();
            }
        });
    }

    @ReactMethod
    public void startPreview(String callId, int viewTag) {
        mReactContext.runOnUiQueueThread(() -> {
            ICallSession session = getCallManager().getCallSession(callId);
            if (session == null)
                return;

            try {
                int uiManagerType = ViewUtil.getUIManagerType(viewTag);
                UIManager uiManager = UIManagerHelper.getUIManager(mReactContext, uiManagerType);
                android.view.View view = uiManager.resolveView(viewTag);
                Log.d("JuggleIMCall",
                        "viewTag: " + viewTag + ", uiManagerType: " + uiManagerType + ", uiManager: " + uiManager
                                + ", view: " + view);
                if (view == null) {
                    return;
                }
                session.startPreview(((com.juggleim.call.view.ZegoSurfaceView) view).getView());
            } catch (Exception e) {
                e.printStackTrace();
            }
        });
    }

    @ReactMethod
    public void addSessionListener(String callId, String key) {
        ICallSession session = getCallManager().getCallSession(callId);
        if (session == null)
            return;

        ICallSession.ICallSessionListener listener = new ICallSession.ICallSessionListener() {
            @Override
            public void onCallConnect() {
                WritableMap params = Arguments.createMap();
                params.putString("callId", callId);
                sendEvent("CallSession_onCallConnect", params);
            }

            @Override
            public void onCallFinish(CallConst.CallFinishReason finishReason) {
                WritableMap params = Arguments.createMap();
                params.putString("callId", callId);
                params.putInt("finishReason", finishReason.getValue());
                sendEvent("CallSession_onCallFinish", params);
            }

            @Override
            public void onErrorOccur(CallConst.CallErrorCode errorCode) {
                WritableMap params = Arguments.createMap();
                params.putString("callId", callId);
                params.putInt("errorCode", errorCode.getValue());
                sendEvent("CallSession_onErrorOccur", params);
            }

            @Override
            public void onUsersInvite(String inviterId, List<String> userIdList) {
                WritableMap params = Arguments.createMap();
                params.putString("callId", callId);
                params.putString("inviterId", inviterId);
                params.putArray("userIdList", convertListToWritableArray(userIdList));
                sendEvent("CallSession_onUsersInvite", params);
            }

            @Override
            public void onUsersConnect(List<String> userIdList) {
                WritableMap params = Arguments.createMap();
                params.putString("callId", callId);
                params.putArray("userIdList", convertListToWritableArray(userIdList));
                sendEvent("CallSession_onUsersConnect", params);
            }

            @Override
            public void onUsersLeave(List<String> userIdList) {
                WritableMap params = Arguments.createMap();
                params.putString("callId", callId);
                params.putArray("userIdList", convertListToWritableArray(userIdList));
                sendEvent("CallSession_onUsersLeave", params);
            }

            @Override
            public void onUserCameraEnable(String userId, boolean enable) {
                WritableMap params = Arguments.createMap();
                params.putString("callId", callId);
                params.putString("userId", userId);
                params.putBoolean("enable", enable);
                sendEvent("CallSession_onUserCameraEnable", params);
            }

            @Override
            public void onUserMicrophoneEnable(String userId, boolean enable) {
                WritableMap params = Arguments.createMap();
                params.putString("callId", callId);
                params.putString("userId", userId);
                params.putBoolean("enable", enable);
                sendEvent("CallSession_onUserMicrophoneEnable", params);
            }

            @Override
            public void onSoundLevelUpdate(HashMap<String, Float> soundLevels) {
                WritableMap params = Arguments.createMap();
                params.putString("callId", callId);
                WritableMap levels = Arguments.createMap();
                for (Map.Entry<String, Float> entry : soundLevels.entrySet()) {
                    levels.putDouble(entry.getKey(), entry.getValue().doubleValue());
                }
                params.putMap("soundLevels", levels);
                sendEvent("CallSession_onSoundLevelUpdate", params);
            }

            @Override
            public void onVideoFirstFrameRender(String userId) {
                WritableMap params = Arguments.createMap();
                params.putString("callId", callId);
                params.putString("userId", userId);
                sendEvent("CallSession_onVideoFirstFrameRender", params);
            }
        };

        // Store listener
        if (!mCallSessionListeners.containsKey(callId)) {
            mCallSessionListeners.put(callId, new HashMap<>());
        }
        mCallSessionListeners.get(callId).put(key, listener);

        session.addListener(key, listener);
    }

    @ReactMethod
    public void removeSessionListener(String callId, String key) {
        ICallSession session = getCallManager().getCallSession(callId);
        if (session != null) {
            session.removeListener(key);
        }
        if (mCallSessionListeners.containsKey(callId)) {
            mCallSessionListeners.get(callId).remove(key);
        }
    }

    private void sendEvent(String eventName, WritableMap params) {
        mReactContext
                .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                .emit(eventName, params);
    }

    private WritableMap convertCallSessionToMap(ICallSession session) {
        WritableMap map = Arguments.createMap();
        map.putString("callId", session.getCallId());
        map.putBoolean("isMultiCall", session.isMultiCall());
        map.putInt("mediaType", session.getMediaType().getValue());
        map.putInt("callStatus", session.getCallStatus().getStatus());
        map.putDouble("startTime", session.getStartTime());
        map.putDouble("connectTime", session.getConnectTime());
        map.putDouble("finishTime", session.getFinishTime());
        map.putString("owner", session.getOwner());
        map.putString("inviter", session.getInviter());
        map.putInt("finishReason", session.getFinishReason() == null ? 0 : session.getFinishReason().getValue());
        map.putString("extra", session.getExtra());

        WritableArray members = Arguments.createArray();
        for (CallMember member : session.getMembers()) {
            members.pushMap(convertCallMemberToMap(member));
        }
        map.putArray("members", members);

        if (session.getCurrentCallMember() != null) {
            map.putMap("currentMember", convertCallMemberToMap(session.getCurrentCallMember()));
        }

        return map;
    }

    private WritableMap convertCallMemberToMap(CallMember member) {
        WritableMap map = Arguments.createMap();
        map.putMap("userInfo", convertUserInfoToMap(member.getUserInfo()));
        map.putInt("callStatus", member.getCallStatus().getStatus());
        map.putDouble("startTime", member.getStartTime());
        map.putDouble("connectTime", member.getConnectTime());
        map.putDouble("finishTime", member.getFinishTime());
        map.putMap("inviter", convertUserInfoToMap(member.getInviter()));
        return map;
    }

    private WritableMap convertUserInfoToMap(UserInfo userInfo) {
        if (userInfo == null)
            return null;
        WritableMap map = Arguments.createMap();
        map.putString("userId", userInfo.getUserId());
        map.putString("nickname", userInfo.getUserName());
        map.putString("avatar", userInfo.getPortrait());
        return map;
    }

    private WritableMap convertCallInfoToMap(CallInfo info) {
        WritableMap map = Arguments.createMap();
        map.putString("callId", info.getCallId());
        map.putBoolean("isMultiCall", info.isMultiCall());
        map.putInt("mediaType", info.getMediaType().getValue());
        map.putMap("owner", convertUserInfoToMap(info.getOwner()));
        map.putString("extra", info.getExtra());

        WritableArray members = Arguments.createArray();
        for (CallMember member : info.getMembers()) {
            members.pushMap(convertCallMemberToMap(member));
        }
        map.putArray("members", members);

        return map;
    }

    private WritableArray convertListToWritableArray(List<String> list) {
        WritableArray array = Arguments.createArray();
        if (list != null) {
            for (String item : list) {
                array.pushString(item);
            }
        }
        return array;
    }
}
