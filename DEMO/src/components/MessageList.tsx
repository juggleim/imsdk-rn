import React, { useRef, useImperativeHandle, forwardRef, useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, ActivityIndicator, Text, InteractionManager, NativeSyntheticEvent, NativeScrollEvent } from 'react-native';
import { FlashList, ListRenderItem } from '@shopify/flash-list';
import { Message } from 'juggleim-rnsdk';

interface MessageListProps {
    messages: Message[];
    renderItem: ListRenderItem<Message>;
    onLoadPrev?: () => Promise<void>;
    onLoadNext?: () => Promise<void>;
    hasPrev?: boolean;
    hasNext?: boolean;
    loadingPrev?: boolean; // For top loading (history) - shown in footer
    loadingNext?: boolean; // For bottom loading (newer) - usually handled manually or by scroll to index 0
    enableEndReached?: boolean;
}

export interface MessageListRef {
    scrollToBottom: (animated?: boolean) => void;
    scrollToIndex: (index: number, animated?: boolean) => void;
}

const MessageList = forwardRef<MessageListRef, MessageListProps>((props, ref) => {
    const {
        messages,
        renderItem,
        onLoadPrev,
        hasPrev,
        loadingPrev,
        loadingNext,
    } = props;

    const listRef = useRef<FlashList<Message>>(null);
    const memoizedRenderItem = useCallback(renderItem, [renderItem]);

    return (
        <View style={styles.container}>
            <FlashList
                ref={listRef}
                data={messages}
                renderItem={memoizedRenderItem}
                keyExtractor={(item) => item.messageId || item.clientMsgNo.toString()}
                estimatedItemSize={70}
                maintainVisibleContentPosition={{
                    autoscrollToBottomThreshold: 0.1,
                    startRenderingFromBottom: true,
                    minIndexForVisible: 0,
                }}

                onStartReached={() => {
                    console.log('onStartReached triggered: ', loadingPrev, hasPrev);
                    if (!loadingPrev && hasPrev && onLoadPrev) {
                        onLoadPrev();
                    }
                }}
                onStartReachedThreshold={0.6}
                ListHeaderComponent={
                    <View style={{ height: 40, justifyContent: 'center' }}>
                        {loadingPrev && <ActivityIndicator size="small" color="#999" />}
                    </View>
                }
                ListFooterComponent={
                    <View style={{ height: 40, justifyContent: 'center' }}>
                        {loadingNext && <ActivityIndicator size="small" color="#999" />}
                    </View>
                }
            />
        </View>
    );
});

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
        overflow: 'hidden',
    },
    footerLoader: {
        paddingVertical: 20,
        alignItems: 'center',
    },
});

export default MessageList;
