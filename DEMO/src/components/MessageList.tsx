import React, { useRef, useImperativeHandle, forwardRef, useEffect, useState } from 'react';
import { View, StyleSheet, ActivityIndicator, Text } from 'react-native';
import { FlashList, ListRenderItem } from '@shopify/flash-list';
import { Message } from 'juggleim-rnsdk';

interface MessageListProps {
    messages: Message[];
    renderItem: ListRenderItem<Message>;
    onLoadPrev?: () => Promise<void>;
    onLoadNext?: () => Promise<void>;
    hasPrev?: boolean;
    hasNext?: boolean;
    refreshing?: boolean; // Not used in typical inverted chat for history
    loadingPrev?: boolean; // For top loading (history) - shown in footer
    loadingNext?: boolean; // For bottom loading (newer) - usually handled manually or by scroll to index 0
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
        onLoadNext,
        hasPrev,
        hasNext,
        loadingPrev,
        loadingNext,
    } = props;

    const listRef = useRef<FlashList<Message>>(null);

    useImperativeHandle(ref, () => ({
        scrollToBottom: (animated = true) => {
            listRef.current?.scrollToEnd({ animated });
        },
        scrollToIndex: (index: number, animated = true) => {
            listRef.current?.scrollToIndex({ index, animated });
        },
    }));

    // Auto-scroll logic removed for inverted=true as it defaults to bottom (index 0)

    // Handlers for Scroll
    // We want standard list: Top (Index 0) -> Bottom (Index N)
    // Pull Down -> Load Prev (History)
    // Pull Up / End Reached -> Load Next (Newer)

    return (
        <View style={styles.container}>
            <FlashList
                ref={listRef}
                data={messages}
                renderItem={renderItem}
                estimatedItemSize={80}
                keyExtractor={(item) => item.clientMsgNo.toString()}

                // Render order: Inverted (Bottom is Index 0)
                // We will pass data as [Newest, ..., Oldest]
                // So Index 0 (Bottom) = Newest. visual: Top(Old) -> Bottom(New)
                inverted={true}

                drawDistance={500}

                // In Inverted mode:
                // "End" is the visual TOP. So onEndReached loads HISTORY (Prev).
                onEndReached={() => {
                    if (hasPrev && onLoadPrev) {
                        onLoadPrev();
                    }
                }}
                onEndReachedThreshold={0.1}

                // Visual Top (Physical Footer) -> Loading History
                ListFooterComponent={
                    loadingPrev ? (
                        <View style={styles.footerLoader}>
                            <ActivityIndicator size="small" />
                        </View>
                    ) : null
                }
            />
        </View>
    );
});

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    footerLoader: {
        paddingVertical: 20,
        alignItems: 'center',
    },
});

export default MessageList;
