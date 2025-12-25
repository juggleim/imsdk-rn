import React, { useRef, useImperativeHandle, forwardRef, useEffect, useState } from 'react';
import { View, StyleSheet, ActivityIndicator, Text, InteractionManager } from 'react-native';
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
    const autoScrolledRef = useRef(false);

    useImperativeHandle(ref, () => ({
        scrollToBottom: (animated = true) => {
            console.log('scrollToBottom called');
            // In inverted mode the newest message is at index 0 (bottom visually).
            // Use scrollToIndex to reliably jump to the bottom/newest item.
            try {
                listRef.current?.scrollToIndex({ index: 0, animated });
            } catch (e) {
                // Fallback to scrollToEnd if scrollToIndex fails for some reason
                listRef.current?.scrollToEnd?.({ animated });
            }
        },
        scrollToIndex: (index: number, animated = true) => {
            console.log('scrollToIndex called:', index);
            listRef.current?.scrollToIndex({ index, animated });
        },
    }));

    // Auto-scroll to bottom on first load when messages exist. This avoids
    // the screen showing at the visual top on entry.
    useEffect(() => {
        if (!autoScrolledRef.current && messages && messages.length > 0) {
            InteractionManager.runAfterInteractions(() => {
                try {
                    listRef.current?.scrollToIndex({ index: 0, animated: false });
                } catch (e) {
                    listRef.current?.scrollToEnd?.({ animated: false });
                }
                autoScrolledRef.current = true;
            });
        }
    }, [messages]);

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
                // Helps keep scroll position stable when prepending history
                maintainVisibleContentPosition={{ minIndexForVisible: 1 }}
                initialNumToRender={20}
                drawDistance={500}

                // In Inverted mode:
                // "End" is the visual TOP. So onEndReached loads HISTORY (Prev).
                onEndReached={() => {
                    console.log('onEndReached triggered');
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
