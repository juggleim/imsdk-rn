import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Image } from 'react-native';
import JuggleIM from 'im-rn-sdk';
import { useNavigation } from '@react-navigation/native';

const ConversationListScreen = () => {
  const [conversations, setConversations] = useState<any[]>([]);
  const navigation = useNavigation<any>();

  useEffect(() => {
    loadConversations();
    const removeListener = JuggleIM.addConversationListener('ConversationListScreen', {
      onConversationInfoAdd: (conversations) => {
      },
      onConversationInfoUpdate: (conversations) => {
      },
      onConversationInfoDelete: (conversations) => {
      },
      onTotalUnreadMessageCountUpdate: (count) => {
        // Update badge if needed
      }
    });

    return () => {
      removeListener();
    };
  }, []);

  const loadConversations = async () => {
    try {
      // Assuming count, timestamp, direction
      const list = await JuggleIM.getConversationInfoList({
        count: 20,
        timestamp: -1,
        direction: 0,
      });
      console.log('会话列表:', list);
      setConversations(list || []);
    } catch (e) {
      console.error('Failed to load conversations', e);
    }
  };

  const renderItem = ({ item }: { item: any }) => {
    // item is ConversationInfo
    // We need to extract name, last message, timestamp, unread count
    // For now, let's assume item structure based on SDK usually
    // item.conversation.conversationId
    // item.conversation.conversationType
    // item.lastMessage
    // item.unreadCount

    // We need to resolve user name from ID if it's private chat.
    // For this sample, we'll just show ID.

    const conversationId = item.conversation?.conversationId || 'Unknown';
    const lastMsgContent = item.lastMessage?.content?.content || '[Message]';
    const time = new Date(item.lastMessage?.timestamp || Date.now()).toLocaleTimeString();

    return (
      <TouchableOpacity style={styles.itemContainer} onPress={() => {
        navigation.navigate('MessageList', { conversation: item.conversation });
      }}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{conversationId.substring(0, 1).toUpperCase()}</Text>
        </View>
        <View style={styles.contentContainer}>
          <View style={styles.topRow}>
            <Text style={styles.name}>{conversationId}</Text>
            <Text style={styles.time}>{time}</Text>
          </View>
          <View style={styles.bottomRow}>
            <Text style={styles.message} numberOfLines={1}>{lastMsgContent}</Text>
            {item.unreadCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{item.unreadCount}</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={conversations}
        renderItem={renderItem}
        keyExtractor={(item) => item.conversation?.conversationId || Math.random().toString()}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No conversations yet</Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  itemContainer: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    alignItems: 'center',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  contentContainer: {
    flex: 1,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  time: {
    fontSize: 12,
    color: '#999',
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  message: {
    fontSize: 14,
    color: '#666',
    flex: 1,
    marginRight: 8,
  },
  badge: {
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 100,
  },
  emptyText: {
    color: '#999',
    fontSize: 16,
  },
});

export default ConversationListScreen;