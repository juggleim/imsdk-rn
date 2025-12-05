import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Image,
} from 'react-native';
import JuggleIM, { ConversationInfo } from 'juggleim-rnsdk';
import { useNavigation } from '@react-navigation/native';
import UserInfoManager from '../manager/UserInfoManager';

const ConversationItem = ({ item, onPress }: { item: ConversationInfo, onPress: (name: string) => void }) => {
  const conversationId = item.conversation.conversationId;
  const conversationType = item.conversation.conversationType;
  const lastMsgContent = (item.lastMessage?.content as any)?.content || '[Message]';
  const time = new Date(item.lastMessage?.timestamp || Date.now()).toLocaleTimeString();

  const [name, setName] = useState(conversationId);
  const [avatar, setAvatar] = useState<string | undefined>(undefined);

  useEffect(() => {
    let isMounted = true;
    const loadInfo = async () => {
      if (conversationType === 1) { // Private
        const user = await UserInfoManager.getUserInfo(conversationId);
        if (isMounted && user) {
          setName(user.nickname || user.user_id);
          setAvatar(user.avatar);
        }
      } else if (conversationType === 2) { // Group
        const group = await UserInfoManager.getGroupInfo(conversationId);
        if (isMounted && group) {
          setName(group.group_name || group.group_id);
          setAvatar(group.group_portrait);
        }
      }
    };

    // Try sync first to avoid flicker
    if (conversationType === 1) {
      const user = UserInfoManager.getUserInfoSync(conversationId);
      if (user) {
        setName(user.nickname || user.user_id);
        setAvatar(user.avatar);
      } else {
        loadInfo();
      }
    } else if (conversationType === 2) {
      const group = UserInfoManager.getGroupInfoSync(conversationId);
      if (group) {
        setName(group.group_name || group.group_id);
        setAvatar(group.group_portrait);
      } else {
        loadInfo();
      }
    } else {
      loadInfo();
    }

    return () => {
      isMounted = false;
    };
  }, [conversationId, conversationType]);

  return (
    <TouchableOpacity
      style={styles.itemContainer}
      onPress={() => onPress(name)}>
      <View style={styles.avatar}>
        {avatar ? (
          <Image source={{ uri: avatar }} style={styles.avatarImage} />
        ) : (
          <Text style={styles.avatarText}>
            {name.substring(0, 1).toUpperCase()}
          </Text>
        )}
      </View>
      <View style={styles.contentContainer}>
        <View style={styles.topRow}>
          <Text style={styles.name}>{name}</Text>
          <Text style={styles.time}>{time}</Text>
        </View>
        <View style={styles.bottomRow}>
          <Text style={styles.message} numberOfLines={1}>
            {lastMsgContent}
          </Text>
          {(item as any).unreadCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{(item as any).unreadCount}</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const ConversationListScreen = () => {
  const [conversations, setConversations] = useState<ConversationInfo[]>([]);
  const navigation = useNavigation<any>();

  useEffect(() => {
    loadConversations();
    const removeListener = JuggleIM.addConversationListener(
      'ConversationListScreen',
      {
        onConversationInfoAdd: newConversations => {
          setConversations(prev => [...newConversations, ...prev]);
        },
        onConversationInfoUpdate: updatedConversations => {
          setConversations(prev => {
            const updated = [...prev];
            updatedConversations.forEach(updatedConv => {
              const index = updated.findIndex(
                c =>
                  c.conversation.conversationId ===
                  updatedConv.conversation.conversationId &&
                  c.conversation.conversationType ===
                  updatedConv.conversation.conversationType,
              );
              if (index !== -1) {
                updated[index] = updatedConv;
              }
            });
            return updated;
          });
        },
        onConversationInfoDelete: deletedConversations => {
          setConversations(prev =>
            prev.filter(
              c =>
                !deletedConversations.some(
                  dc =>
                    dc.conversation.conversationId ===
                    c.conversation.conversationId &&
                    dc.conversation.conversationType ===
                    c.conversation.conversationType,
                ),
            ),
          );
        },
        onTotalUnreadMessageCountUpdate: count => {
          // Update badge if needed
          console.log('Total unread count:', count);
        },
      },
    );

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

  const renderItem = ({ item }: { item: ConversationInfo }) => {
    return (
      <ConversationItem
        item={item}
        onPress={(name) => {
          navigation.navigate('MessageList', { conversation: item.conversation, title: name });
        }}
      />
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={conversations}
        renderItem={renderItem}
        keyExtractor={item =>
          item.conversation?.conversationId || Math.random().toString()
        }
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
    overflow: 'hidden',
  },
  avatarImage: {
    width: 50,
    height: 50,
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
