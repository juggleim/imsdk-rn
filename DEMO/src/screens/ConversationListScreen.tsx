import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  RefreshControl,
  Platform,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import JuggleIM, { ConversationInfo, ConversationType, JuggleIMCall } from 'juggleim-rnsdk';
import { useNavigation } from '@react-navigation/native';
import CustomMenu from '../components/CustomMenu';
import { Colors, Typography, Sizes, Spacing, ThemeUtils } from '../theme';
// i18n support
import { t } from '../i18n/config';
// time format utility
import { formatConversationTime } from '../utils/timeFormat';

const ConversationItem = React.memo(({
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
  const time = formatConversationTime(item.lastMessage?.timestamp || Date.now());
  const name = item.name || "";
  const avatar = item.avatar || ""
  const itemRef = useRef<View>(null);

  // Get display content based on message type
  const getMessageDisplay = () => {
    const contentType = item.lastMessage?.content?.contentType;
    const content = (item.lastMessage?.content as any)?.content;

    let c = ''
    switch (contentType) {
      case 'jg:text':
        c = content;
        break;
      case 'jg:img':
        c = '[Image]';
        break;
      case 'jg:file':
        c = '[File]';
        break;
      case 'jg:video':
        c = '[Video]';
        break;
      case 'jg:voice':
        c = '[Voice]';
        break;
      case 'jg:callfinishntf': {
        const callContent = item.lastMessage?.content as any;
        const media_type = callContent?.media_type;
        c = media_type === 1 ? '[视频通话]' : '[语音通话]';
        break;
      }
      case 'jgd:grpntf':
        return '[群通知]';
      case 'jgd:friendntf':
        return '[好友通知]';
      case 'demo:businesscard':
        c = '[BusinessCard]';
        break;
      case 'demo:textcard':
        c = '[TextCard]';
        break;
      default:
        c = '[Message]';
        break;
    }

    // For group messages (type 2), show sender name
    if (item.conversation.conversationType === 2 && item.lastMessage?.senderUserName) {
      return `${item.lastMessage.senderUserName}: ${c}`;
    }
    return c;
  }

  const lastMsgContent = getMessageDisplay();
  const hasMention = item.mentionInfo && item.mentionInfo.mentionMsgList && item.mentionInfo.mentionMsgList.length > 0;

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
                <Text style={styles.badgeText}>
                  {item.unreadCount > 99 ? '99+' : item.unreadCount}
                </Text>
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
});

const ConversationListScreen = () => {
  const [conversations, setConversations] = useState<ConversationInfo[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState<{ x: number; y: number; width: number; height: number } | undefined>(undefined);
  const [selectedConversation, setSelectedConversation] = useState<ConversationInfo | null>(null);
  const navigation = useNavigation<any>();
  const flashListRef = useRef<FlashList<ConversationInfo>>(null);

  const sortConversations = (list: ConversationInfo[]) => {
    return list.sort((a, b) => {
      if (a.isTop !== b.isTop) {
        return a.isTop ? -1 : 1;
      }
      if (a.isTop) {
        return b.sortTime - a.sortTime;
      }
      return b.sortTime - a.sortTime;
    });
  };

  const handleLongPress = useCallback((item: ConversationInfo, anchor: { x: number; y: number; width: number; height: number }) => {
    setSelectedConversation(item);
    setMenuAnchor(anchor);
    setMenuVisible(true);
  }, []);

  const getMenuOptions = () => {
    if (!selectedConversation) return [];

    return [
      {
        label: selectedConversation.isTop ? t('conversationInfo.unpin') : t('conversationInfo.pinned'),
        onPress: () => {
          JuggleIM.setTop(selectedConversation.conversation, !selectedConversation.isTop);
          setMenuVisible(false);
        },
        icon: require('../assets/icons/top.png'),
      },
      {
        label: selectedConversation.isMute ? t('conversationInfo.unmute') : t('conversationInfo.mute'),
        onPress: () => {
          JuggleIM.setMute(selectedConversation.conversation, !selectedConversation.isMute);
          setMenuVisible(false);
        },
        icon: require('../assets/icons/mute.png'),
      },
      {
        label: t('conversationInfo.delete'),
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
                c => c.conversation.conversationId === updatedConv.conversation.conversationId
              );
              if (index !== -1) {
                const oldConv = updated[index];

                // Merge old and new data to preserve fields that SDK doesn't return
                const mergedConv: ConversationInfo = {
                  ...oldConv,              // Keep all old fields first
                  ...updatedConv,          // Override with new fields
                  // Special handling for lastMessage - preserve nested data
                  lastMessage: updatedConv.lastMessage
                    ? {
                        ...(oldConv.lastMessage || {} as any),
                        ...updatedConv.lastMessage,
                      }
                    : oldConv.lastMessage,
                };

                updated[index] = mergedConv;
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
                    c.conversation.conversationId
                ),
            ),
          );
        },
        onTotalUnreadMessageCountUpdate: count => {
          // Unread count is now managed by UnreadCountContext
          console.log('Total unread count updated:', count);
        },
      },
    );
    const connectionListener = JuggleIM.addConnectionStatusListener(
      'connectionStatusListener',
      (status, code, extra) => {
        console.log('Connection status:', status, code, extra);
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
      // removeListener();
      // removeCallListener();
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
      //只保留私聊和群组
      const filteredList = list.filter(c => c.conversation.conversationType === 1 || c.conversation.conversationType === 2);
      setConversations(sortConversations(filteredList));
    } catch (e) {
      console.error('Failed to load conversations', e);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadConversations();
    setRefreshing(false);
  };

  const renderItem = useCallback(({ item }: { item: ConversationInfo }) => {
    return (
      <ConversationItem
        item={item}
        onPress={() => {
          navigation.navigate('MessageList', { conversation: item.conversation, title: item.name, unreadCount: item.unreadCount });
        }}
        onLongPress={handleLongPress}
      />
    );
  }, [navigation, handleLongPress]);

  return (
    <View style={styles.container}>
      <FlashList
        ref={flashListRef}
        data={conversations}
        renderItem={renderItem}
        estimatedItemSize={ThemeUtils.moderateScale(82)}
        keyExtractor={item =>
          item.conversation.conversationId
        }
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>{t('conversationList.noConversations')}</Text>
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
    backgroundColor: Colors.background,
  },
  itemContainer: {
    flexDirection: 'row',
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    alignItems: 'center',
    // Android 需要 minHeight 确保 item 高度一致
    minHeight: ThemeUtils.moderateScale(82),
  },
  avatar: {
    width: Sizes.avatar.medium,
    height: Sizes.avatar.medium,
    borderRadius: Sizes.avatar.medium / 2,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.lg,
    overflow: 'hidden',
  },
  avatarImage: {
    width: Sizes.avatar.medium,
    height: Sizes.avatar.medium,
  },
  avatarText: {
    color: Colors.text.white,
    fontSize: ThemeUtils.moderateScale(20),
    fontWeight: 'bold',
  },
  contentContainer: {
    flex: 1,
    // Android 需要确保有宽度
    minWidth: 0,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center', // 确保垂直对齐
    marginBottom: ThemeUtils.moderateScale(4),
  },
  name: {
    ...Typography.conversationName,
    flex: 1, // 关键：允许名字占据剩余空间
    // Android 需要这些属性来正确显示省略号
    overflow: 'hidden',
    numberOfLines: 1,
  },
  time: {
    ...Typography.conversationTime,
    // Android 确保时间不被压缩
    marginLeft: Spacing.sm,
  },
  timeContainer: {
    alignItems: 'flex-end',
    // 确保时间容器有最小宽度
    minWidth: ThemeUtils.moderateScale(60),
  },
  muteIcon: {
    width: Sizes.icon.small,
    height: Sizes.icon.small,
    marginTop: ThemeUtils.moderateScale(6),
    tintColor: Colors.text.tertiary,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  message: {
    ...Typography.conversationMessage,
    flex: 1,
    marginRight: Spacing.sm,
    // Android 需要这些属性
    overflow: 'hidden',
    numberOfLines: 1,
  },
  mentionIndicator: {
    color: Colors.mention,
    fontWeight: '600',
  },
  badge: {
    backgroundColor: Colors.badge,
    borderRadius: Sizes.badge.borderRadius,
    height: Sizes.badge.height,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: ThemeUtils.moderateScale(6),
    minWidth: ThemeUtils.moderateScale(20),
  },
  badgeText: {
    ...Typography.badge,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: ThemeUtils.moderateScale(100),
  },
  emptyText: {
    color: Colors.text.tertiary,
    fontSize: ThemeUtils.moderateScale(16),
  },
});

export default ConversationListScreen;
