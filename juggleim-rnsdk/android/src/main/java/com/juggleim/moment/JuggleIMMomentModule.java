package com.juggleim.moment;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableMap;
import com.juggle.im.JIM;
import com.juggle.im.JIMConst;
import com.juggle.im.interfaces.IMessageManager;
import com.juggle.im.interfaces.IMomentManager;
import com.juggle.im.model.GetMomentCommentOption;
import com.juggle.im.model.GetMomentOption;
import com.juggle.im.model.Moment;
import com.juggle.im.model.MomentComment;
import com.juggle.im.model.MomentMedia;
import com.juggle.im.model.MomentMedia.MomentMediaType;
import com.juggle.im.model.MomentReaction;
import com.juggle.im.model.UserInfo;

import java.util.ArrayList;
import java.util.List;

import javax.annotation.Nonnull;

public class JuggleIMMomentModule extends ReactContextBaseJavaModule {
    private static final String MODULE_NAME = "JuggleIMMomentModule";

    public JuggleIMMomentModule(ReactApplicationContext reactContext) {
        super(reactContext);
    }

    @Nonnull
    @Override
    public String getName() {
        return MODULE_NAME;
    }

    private IMomentManager getMomentManager() {
        return JIM.getInstance().getMomentManager();
    }

    @ReactMethod
    public void addMoment(String content, ReadableArray mediaList, Promise promise) {
        List<MomentMedia> list = new ArrayList<>();
        if (mediaList != null) {
            for (int i = 0; i < mediaList.size(); i++) {
                list.add(convertReadableMapToMomentMedia(mediaList.getMap(i)));
            }
        }
        getMomentManager().addMoment(content, list, new JIMConst.IResultCallback<Moment>() {
            @Override
            public void onSuccess(Moment moment) {
                promise.resolve(convertMomentToWritableMap(moment));
            }

            @Override
            public void onError(int errorCode) {
                reject(promise, errorCode);
            }
        });
    }

    @ReactMethod
    public void removeMoment(String momentId, Promise promise) {
        getMomentManager().removeMoment(momentId, new IMessageManager.ISimpleCallback() {
            @Override
            public void onSuccess() {
                promise.resolve(null);
            }

            @Override
            public void onError(int errorCode) {
                reject(promise, errorCode);
            }
        });
    }

    @ReactMethod
    public void getCachedMomentList(ReadableMap optionMap, Promise promise) {
        GetMomentOption option = convertReadableMapToGetMomentOption(optionMap);
        List<Moment> list = getMomentManager().getCachedMomentList(option);
        WritableArray array = Arguments.createArray();
        if (list != null) {
            for (Moment moment : list) {
                array.pushMap(convertMomentToWritableMap(moment));
            }
        }
        promise.resolve(array);
    }

    @ReactMethod
    public void getMomentList(ReadableMap optionMap, Promise promise) {
        GetMomentOption option = convertReadableMapToGetMomentOption(optionMap);
        getMomentManager().getMomentList(option, new JIMConst.IResultListCallback<Moment>() {
            @Override
            public void onSuccess(List<Moment> moments, boolean isFinish) {
                WritableMap result = Arguments.createMap();
                WritableArray array = Arguments.createArray();
                for (Moment moment : moments) {
                    array.pushMap(convertMomentToWritableMap(moment));
                }
                result.putArray("list", array);
                result.putBoolean("isFinished", isFinish);
                promise.resolve(result);
            }

            @Override
            public void onError(int errorCode) {
                reject(promise, errorCode);
            }
        });
    }

    @ReactMethod
    public void getMoment(String momentId, Promise promise) {
        getMomentManager().getMoment(momentId, new JIMConst.IResultCallback<Moment>() {
            @Override
            public void onSuccess(Moment moment) {
                promise.resolve(convertMomentToWritableMap(moment));
            }

            @Override
            public void onError(int errorCode) {
                reject(promise, errorCode);
            }
        });
    }

    @ReactMethod
    public void addComment(String momentId, String parentCommentId, String content, Promise promise) {
        getMomentManager().addComment(momentId, parentCommentId, content,
                new JIMConst.IResultCallback<MomentComment>() {
                    @Override
                    public void onSuccess(MomentComment comment) {
                        promise.resolve(convertMomentCommentToWritableMap(comment));
                    }

                    @Override
                    public void onError(int errorCode) {
                        reject(promise, errorCode);
                    }
                });
    }

    @ReactMethod
    public void removeComment(String momentId, String commentId, Promise promise) {
        getMomentManager().removeComment(momentId, commentId, new IMessageManager.ISimpleCallback() {
            @Override
            public void onSuccess() {
                promise.resolve(null);
            }

            @Override
            public void onError(int errorCode) {
                reject(promise, errorCode);
            }
        });
    }

    @ReactMethod
    public void getCommentList(ReadableMap optionMap, Promise promise) {
        GetMomentCommentOption option = convertReadableMapToGetMomentCommentOption(optionMap);
        getMomentManager().getCommentList(option, new JIMConst.IResultListCallback<MomentComment>() {
            @Override
            public void onSuccess(List<MomentComment> comments, boolean isFinish) {
                WritableMap result = Arguments.createMap();
                WritableArray array = Arguments.createArray();
                for (MomentComment comment : comments) {
                    array.pushMap(convertMomentCommentToWritableMap(comment));
                }
                result.putArray("list", array);
                result.putBoolean("isFinished", isFinish);
                promise.resolve(result);
            }

            @Override
            public void onError(int errorCode) {
                reject(promise, errorCode);
            }
        });
    }

    @ReactMethod
    public void addReaction(String momentId, String key, Promise promise) {
        getMomentManager().addReaction(momentId, key, new IMessageManager.ISimpleCallback() {
            @Override
            public void onSuccess() {
                promise.resolve(null);
            }

            @Override
            public void onError(int errorCode) {
                reject(promise, errorCode);
            }
        });
    }

    @ReactMethod
    public void removeReaction(String momentId, String key, Promise promise) {
        getMomentManager().removeReaction(momentId, key, new IMessageManager.ISimpleCallback() {
            @Override
            public void onSuccess() {
                promise.resolve(null);
            }

            @Override
            public void onError(int errorCode) {
                reject(promise, errorCode);
            }
        });
    }

    @ReactMethod
    public void getReactionList(String momentId, Promise promise) {
        getMomentManager().getReactionList(momentId, new JIMConst.IResultListCallback<MomentReaction>() {
            @Override
            public void onSuccess(List<MomentReaction> reactions, boolean isFinish) {
                WritableArray array = Arguments.createArray();
                for (MomentReaction reaction : reactions) {
                    array.pushMap(convertMomentReactionToWritableMap(reaction));
                }
                promise.resolve(array);
            }

            @Override
            public void onError(int errorCode) {
                reject(promise, errorCode);
            }
        });
    }

    // Helper methods

    private void reject(Promise promise, int errorCode) {
        WritableMap map = Arguments.createMap();
        map.putInt("code", errorCode);
        promise.reject(String.valueOf(errorCode), map);
    }

    private MomentMedia convertReadableMapToMomentMedia(ReadableMap map) {
        MomentMedia media = new MomentMedia();
        String typeStr = map.getString("type");
        if ("image".equals(typeStr)) {
            media.setType(MomentMediaType.IMAGE);
        } else if ("video".equals(typeStr)) {
            media.setType(MomentMediaType.VIDEO);
        }
        if (map.hasKey("url"))
            media.setUrl(map.getString("url"));
        if (map.hasKey("snapshotUrl"))
            media.setSnapshotUrl(map.getString("snapshotUrl"));
        if (map.hasKey("width"))
            media.setWidth(map.getInt("width"));
        if (map.hasKey("height"))
            media.setHeight(map.getInt("height"));
        if (map.hasKey("duration"))
            media.setDuration(map.getInt("duration"));
        return media;
    }

    private GetMomentOption convertReadableMapToGetMomentOption(ReadableMap map) {
        GetMomentOption option = new GetMomentOption();
        if (map.hasKey("count"))
            option.setCount(map.getInt("count"));
        if (map.hasKey("timestamp"))
            // option.setTimestamp((long) map.getDouble("timestamp"));
            option.setStartTime((long) map.getDouble("timestamp"));
        if (map.hasKey("direction")) {
            int dir = map.getInt("direction");
            option.setDirection(dir == 0 ? JIMConst.PullDirection.NEWER : JIMConst.PullDirection.OLDER);
        }
        return option;
    }

    private GetMomentCommentOption convertReadableMapToGetMomentCommentOption(ReadableMap map) {
        GetMomentCommentOption option = new GetMomentCommentOption();
        if (map.hasKey("momentId"))
            option.setMomentId(map.getString("momentId"));
        if (map.hasKey("count"))
            option.setCount(map.getInt("count"));
        if (map.hasKey("timestamp"))
            // option.setTimestamp((long) map.getDouble("timestamp"));
            option.setStartTime((long) map.getDouble("timestamp"));
        if (map.hasKey("direction")) {
            int dir = map.getInt("direction");
            option.setDirection(dir == 0 ? JIMConst.PullDirection.NEWER : JIMConst.PullDirection.OLDER);
        }
        return option;
    }

    private WritableMap convertMomentToWritableMap(Moment moment) {
        WritableMap map = Arguments.createMap();
        map.putString("momentId", moment.getMomentId());
        map.putString("content", moment.getContent());
        map.putMap("userInfo", convertUserInfoToWritableMap(moment.getUserInfo()));
        map.putDouble("createTime", moment.getCreateTime());

        WritableArray mediaList = Arguments.createArray();
        if (moment.getMediaList() != null) {
            for (MomentMedia media : moment.getMediaList()) {
                mediaList.pushMap(convertMomentMediaToWritableMap(media));
            }
        }
        map.putArray("mediaList", mediaList);

        WritableArray commentList = Arguments.createArray();
        if (moment.getCommentList() != null) {
            for (MomentComment comment : moment.getCommentList()) {
                commentList.pushMap(convertMomentCommentToWritableMap(comment));
            }
        }
        map.putArray("commentList", commentList);

        WritableArray reactionList = Arguments.createArray();
        if (moment.getReactionList() != null) {
            for (MomentReaction reaction : moment.getReactionList()) {
                reactionList.pushMap(convertMomentReactionToWritableMap(reaction));
            }
        }
        map.putArray("reactionList", reactionList);

        return map;
    }

    private WritableMap convertMomentMediaToWritableMap(MomentMedia media) {
        WritableMap map = Arguments.createMap();
        map.putString("type", media.getType() == MomentMediaType.IMAGE ? "image" : "video");
        map.putString("url", media.getUrl());
        map.putString("snapshotUrl", media.getSnapshotUrl());
        map.putInt("width", media.getWidth());
        map.putInt("height", media.getHeight());
        map.putInt("duration", media.getDuration());
        return map;
    }

    private WritableMap convertMomentCommentToWritableMap(MomentComment comment) {
        WritableMap map = Arguments.createMap();
        map.putString("commentId", comment.getCommentId());
        map.putString("momentId", comment.getMomentId());
        map.putString("parentCommentId", comment.getParentCommentId());
        map.putString("content", comment.getContent());
        map.putMap("userInfo", convertUserInfoToWritableMap(comment.getUserInfo()));
        if (comment.getParentUserInfo() != null) {
            map.putMap("parentUserInfo", convertUserInfoToWritableMap(comment.getParentUserInfo()));
        }
        map.putDouble("createTime", comment.getCreateTime());
        return map;
    }

    private WritableMap convertMomentReactionToWritableMap(MomentReaction reaction) {
        WritableMap map = Arguments.createMap();
        map.putString("key", reaction.getKey());
        WritableArray userList = Arguments.createArray();
        if (reaction.getUserList() != null) {
            for (UserInfo userInfo : reaction.getUserList()) {
                userList.pushMap(convertUserInfoToWritableMap(userInfo));
            }
        }
        map.putArray("userList", userList);
        return map;
    }

    private WritableMap convertUserInfoToWritableMap(UserInfo userInfo) {
        WritableMap map = Arguments.createMap();
        map.putString("userId", userInfo.getUserId());
        map.putString("nickname", userInfo.getUserName());
        map.putString("avatar", userInfo.getPortrait());
        // Add other fields if necessary
        return map;
    }
}
