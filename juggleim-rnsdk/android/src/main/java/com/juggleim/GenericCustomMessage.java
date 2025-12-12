package com.juggleim;

import com.juggle.im.model.MessageContent;
import java.nio.charset.StandardCharsets;

/**
 * 通用自定义消息类
 * 用于承载 RN 层自定义消息的 JSON 数据
 */
public class GenericCustomMessage extends MessageContent {
    private String mContentType;
    private byte[] mData;

    private static String jsType = "jgrn:custom";
    
    public GenericCustomMessage() {
        this.mContentType = jsType;
    }

    public static void setJsType(String type) {
        jsType = type;
    }
    
    @Override
    public String getContentType() {
        return mContentType;
    }
    
    @Override
    public byte[] encode() {
        return mData;
    }
    
    @Override
    public void decode(byte[] data) {
        this.mData = data;
    }
    
    public void setData(byte[] data) {
        this.mData = data;
    }
    
    public byte[] getData() {
        return mData;
    }
    
    @Override
    public String conversationDigest() {
        // 返回默认摘要
        return "[自定义消息]";
    }
}
