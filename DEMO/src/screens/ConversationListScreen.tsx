import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Image,
  RefreshControl,
} from 'react-native';
import JuggleIM, { ConversationInfo, JuggleIMCall } from 'juggleim-rnsdk';
import { useNavigation } from '@react-navigation/native';
import UserInfoManager from '../manager/UserInfoManager';
import CustomMenu from '../components/CustomMenu';

const ConversationItem = ({
  item,
  onPress,
  onLongPress,
}: {
  item: ConversationInfo;
  onPress: (name: string) => void;
  onLongPress: (item: ConversationInfo, anchor: { x: number; y: number; width: number; height: number }) => void;
}) => {
  const conversationId = item.conversation.conversationId;
  const conversationType = item.conversation.conversationType;
  const time = new Date(item.lastMessage?.timestamp || Date.now()).toLocaleTimeString();

  const [name, setName] = useState(conversationId);
  const [avatar, setAvatar] = useState<string | undefined>(undefined);
  const itemRef = useRef<View>(null);

  // Get display content based on message type
  const getMessageDisplay = () => {
    const contentType = item.lastMessage?.content?.contentType;
    const content = (item.lastMessage?.content as any)?.content;

    switch (contentType) {
      case 'jg:text':
        return content || '[Message]';
      case 'jg:img':
        return '[Image]';
      case 'jg:file':
        return '[File]';
      case 'jg:video':
        return '[Video]';
      case 'jg:voice':
        return '[Voice]';
      case 'jgd:grpntf':
        return '[群通知]';
      case 'jgd:friendntf':
        return '[好友通知]';
      case 'demo:businesscard':
        return '[BusinessCard]';
      case 'demo:textcard':
        return '[TextCard]';
      default:
        return '[Message]';
    }
  };

  const lastMsgContent = getMessageDisplay();
  const hasMention = item.mentionInfo && item.mentionInfo.mentionMsgList && item.mentionInfo.mentionMsgList.length > 0;

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

  const handleLongPress = () => {
    if (itemRef.current) {
      itemRef.current.measureInWindow((x, y, width, height) => {
        onLongPress(item, { x, y, width, height });
      });
    }
  };

  return (
    <View ref={itemRef} collapsable={false}>
      <TouchableOpacity
        style={[
          styles.itemContainer,
          item.isTop && { backgroundColor: '#f2f2f2' },
        ]}
        onPress={() => onPress(name)}
        onLongPress={handleLongPress}>
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
            <View style={styles.timeContainer}>
              <Text style={styles.time}>{time}</Text>
            </View>
          </View>
          <View style={styles.bottomRow}>
            <Text style={styles.message} numberOfLines={1}>
              {hasMention && <Text style={styles.mentionIndicator}>[You were mentioned] </Text>}
              {lastMsgContent}
            </Text>
            {!item.isMute && item.unreadCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{item.unreadCount}</Text>
              </View>
            )}
            {item.isMute && (
              <Image
                source={require('../assets/icons/mute.png')}
                style={styles.muteIcon}
              />
            )}
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );
};

const ConversationListScreen = () => {
  const [conversations, setConversations] = useState<ConversationInfo[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState<{ x: number; y: number; width: number; height: number } | undefined>(undefined);
  const [selectedConversation, setSelectedConversation] = useState<ConversationInfo | null>(null);
  const navigation = useNavigation<any>();

  const sortConversations = (list: ConversationInfo[]) => {
    return list.sort((a, b) => {
      if (a.isTop !== b.isTop) {
        return a.isTop ? -1 : 1;
      }
      if (a.isTop) {
        return b.topTime - a.topTime;
      }
      return b.sortTime - a.sortTime;
    });
  };

  const handleLongPress = (item: ConversationInfo, anchor: { x: number; y: number; width: number; height: number }) => {
    setSelectedConversation(item);
    setMenuAnchor(anchor);
    setMenuVisible(true);
  };

  const getMenuOptions = () => {
    if (!selectedConversation) return [];

    return [
      {
        label: selectedConversation.isTop ? '取消置顶' : '置顶',
        onPress: () => {
          JuggleIM.setTop(selectedConversation.conversation, !selectedConversation.isTop);
          setMenuVisible(false);
        },
        icon: require('../assets/icons/top.png'),
      },
      {
        label: selectedConversation.isMute ? '取消免打扰' : '免打扰',
        onPress: () => {
          JuggleIM.setMute(selectedConversation.conversation, !selectedConversation.isMute);
          setMenuVisible(false);
        },
        icon: require('../assets/icons/mute.png'),
      },
      {
        label: '删除会话',
        destructive: true,
        onPress: () => {
          setMenuVisible(false);
          JuggleIM.deleteConversationInfo(selectedConversation.conversation, {
            onSuccess: () => { },
            onError: () => { },
          });
        },
        icon: require('../assets/icons/delete_light.png'),
      }
    ];
  };

  useEffect(() => {
    const removeListener = JuggleIM.addConversationListener(
      'ConversationListScreen',
      {
        onConversationInfoAdd: newConversations => {
          setConversations(prev => sortConversations([...newConversations, ...prev]));
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
            return sortConversations(updated);
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
    const connectionListener = JuggleIM.addConnectionStatusListener(
      'connectionStatusListener',
      status => {
        console.log('Connection status:', status);
        loadConversations();
      },
    );

    const removeCallListener = JuggleIMCall.addReceiveListener({
      onCallReceive: (session) => {
        console.log('Incoming call received', session);
        navigation.navigate('VideoCall', { callId: session.callId, isIncoming: true });
      }
    });

    return () => {
      removeListener();
      removeCallListener();
      // connectionListener();
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
      if (list == null || list.length === 0) {
        return;
      }
      setConversations(sortConversations(list));
    } catch (e) {
      console.error('Failed to load conversations', e);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadConversations();
    setRefreshing(false);
  };

  const renderItem = ({ item }: { item: ConversationInfo }) => {
    return (
      <ConversationItem
        item={item}
        onPress={(name) => {
          navigation.navigate('MessageList', { conversation: item.conversation, title: name, unreadCount: item.unreadCount });
        }}
        onLongPress={handleLongPress}
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
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No conversations yet</Text>
          </View>
        }
      />
      <CustomMenu
        visible={menuVisible}
        onClose={() => setMenuVisible(false)}
        options={getMenuOptions()}
        anchor={menuAnchor}
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
  timeContainer: {
    alignItems: 'flex-end',
  },
  muteIcon: {
    width: 12,
    height: 12,
    marginTop: 6,
    tintColor: '#999',
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
  mentionIndicator: {
    color: '#FF3B30',
    fontWeight: '600',
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
