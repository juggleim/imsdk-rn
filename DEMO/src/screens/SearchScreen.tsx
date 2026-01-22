import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
  ActivityIndicator,
  Alert,
  Keyboard,
  Platform,
} from 'react-native';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import JuggleIM, { Message, ConversationInfo, SearchConversationsResult } from 'juggleim-rnsdk';
import { Colors, Typography, Sizes, Spacing, ThemeUtils } from '../theme';
import { formatConversationTime } from '../utils/timeFormat';
// i18n support
import { t } from '../i18n/config';

interface SearchResult {
  type: 'message' | 'conversation';
  data: Message | SearchConversationsResult;
}

const SearchScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { conversation } = route.params || {};

  const [searchText, setSearchText] = useState('');
  const [activeTab, setActiveTab] = useState<'messages' | 'conversations'>('messages');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  useFocusEffect(
    useCallback(() => {
      // Auto focus search bar when screen is focused
      return () => {
        Keyboard.dismiss();
      };
    }, [])
  );

  const performSearch = async (text: string) => {
    if (!text || text.trim().length === 0) {
      setResults([]);
      setHasSearched(false);
      return;
    }

    setLoading(true);
    setHasSearched(true);

    try {
      const searchResults: SearchResult[] = [];

      // Search messages (if in conversation context or if messages tab is active)
      if (activeTab === 'messages') {
        {
          // Search within specific conversation
          const messages = await JuggleIM.searchMessage({
            conversation: conversation,
            searchContent: text,
            count: 50,
            timestamp: 0,
            direction: 1,
          });

          messages.forEach(msg => {
            searchResults.push({ type: 'message', data: msg });
          });
        }
      }

      // Search conversations
      if (activeTab === 'conversations') {
        const convResults = await JuggleIM.searchConversationsWithMessageContent({
          searchContent: text,
          conversationTypes: [1, 2],
        });

        convResults.forEach(result => {
          searchResults.push({ type: 'conversation', data: result });
        });
      }

      setResults(searchResults);
    } catch (error) {
      console.error('Search error:', error);
      Alert.alert(t('common.error'), 'Search failed');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Remove automatic search on text change
    if (searchText.trim().length === 0) {
      setResults([]);
      setHasSearched(false);
    }
  }, [searchText, activeTab]);

  const handleSearchPress = () => {
    Keyboard.dismiss();
    performSearch(searchText);
  };

  const handleMessagePress = (message: Message) => {
    Keyboard.dismiss();
    navigation.navigate('MessageList', {
      conversation: message.conversation,
      title: message.senderUserName || 'Unknown',
      highlightMessageId: message.messageId,
    });
  };

  const handleConversationPress = (result: SearchConversationsResult) => {
    Keyboard.dismiss();
    navigation.navigate('MessageList', {
      conversation: result.conversationInfo.conversation,
      title: result.conversationInfo.name || result.conversationInfo.conversation.conversationId,
    });
  };

  const renderMessageItem = ({ item }: { item: SearchResult }) => {
    if (item.type === 'message') {
      const message = item.data as Message;
      const senderName = message.senderUserName || 'Unknown';
      const time = formatConversationTime(message.timestamp);

      // Get message content preview
      let contentPreview = '';
      const contentType = message.content?.contentType;
      if (contentType === 'jg:text') {
        contentPreview = (message.content as any).content || '';
      } else if (contentType === 'jg:img') {
        contentPreview = '[Image]';
      } else if (contentType === 'jg:file') {
        contentPreview = '[File]';
      } else if (contentType === 'jg:voice') {
        contentPreview = '[Voice]';
      } else {
        contentPreview = '[Message]';
      }

      return (
        <TouchableOpacity
          style={styles.resultItem}
          onPress={() => handleMessagePress(message)}
        >
          <View style={styles.messageItemContainer}>
            <View style={styles.messageIcon}>
              <Text style={styles.messageIconText}>💬</Text>
            </View>
            <View style={styles.messageContent}>
              <View style={styles.messageHeader}>
                <Text style={styles.senderName}>{senderName}</Text>
                <Text style={styles.messageTime}>{time}</Text>
              </View>
              <Text style={styles.messagePreview} numberOfLines={2}>
                {contentPreview}
              </Text>
            </View>
          </View>
        </TouchableOpacity>
      );
    }
    return null;
  };

  const renderConversationItem = ({ item }: { item: SearchResult }) => {
    if (item.type === 'conversation') {
      const result = item.data as SearchConversationsResult;
      const { conversationInfo, matchedCount } = result;
      const name = conversationInfo.name || conversationInfo.conversation.conversationId;
      const avatar = conversationInfo.avatar || '';
      const time = conversationInfo.lastMessage
        ? formatConversationTime(conversationInfo.lastMessage.timestamp)
        : '';

      let lastMessageContent = '';
      if (conversationInfo.lastMessage) {
        const contentType = conversationInfo.lastMessage.content?.contentType;
        if (contentType === 'jg:text') {
          lastMessageContent = (conversationInfo.lastMessage.content as any).content || '';
        } else if (contentType === 'jg:img') {
          lastMessageContent = '[Image]';
        } else if (contentType === 'jg:file') {
          lastMessageContent = '[File]';
        } else {
          lastMessageContent = '[Message]';
        }
      }

      return (
        <TouchableOpacity
          style={styles.resultItem}
          onPress={() => handleConversationPress(result)}
        >
          <View style={styles.conversationItem}>
            <View style={styles.avatar}>
              {avatar ? (
                <Image source={{ uri: avatar }} style={styles.avatarImage} />
              ) : (
                <Text style={styles.avatarText}>
                  {name.substring(0, 1).toUpperCase()}
                </Text>
              )}
            </View>
            <View style={styles.conversationContent}>
              <View style={styles.conversationHeader}>
                <Text style={styles.conversationName} numberOfLines={1}>
                  {name}
                </Text>
                <Text style={styles.conversationTime}>{time}</Text>
              </View>
              <Text style={styles.conversationPreview} numberOfLines={1}>
                {lastMessageContent}
              </Text>
              <View style={styles.matchCountContainer}>
                <Text style={styles.matchCountText}>
                  {matchedCount} message{matchedCount > 1 ? 's' : ''} found
                </Text>
              </View>
            </View>
          </View>
        </TouchableOpacity>
      );
    }
    return null;
  };

  const renderTabs = () => {
    if (conversation) {
      // In conversation context, only show messages tab
      return null;
    }
    return (
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'messages' && styles.tabActive]}
          onPress={() => setActiveTab('messages')}
        >
          <Text style={[styles.tabText, activeTab === 'messages' && styles.tabTextActive]}>
            Messages
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'conversations' && styles.tabActive]}
          onPress={() => setActiveTab('conversations')}
        >
          <Text style={[styles.tabText, activeTab === 'conversations' && styles.tabTextActive]}>
            Conversations
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderEmptyState = () => {
    if (loading) {
      return (
        <View style={styles.emptyState}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.emptyText}>Searching...</Text>
        </View>
      );
    }

    if (!hasSearched) {
      return (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>🔍</Text>
          <Text style={styles.emptyText}>
            {conversation ? 'Search messages in this conversation' : 'Search for messages and conversations'}
          </Text>
          <Text style={styles.emptySubText}>Type above and press Search</Text>
        </View>
      );
    }

    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyIcon}>📭</Text>
        <Text style={styles.emptyText}>No results found</Text>
        <Text style={styles.emptySubText}>Try different keywords</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.searchBar}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Image
            source={require('../assets/icons/back.png')}
            style={styles.backIcon}
            resizeMode="contain"
          />
        </TouchableOpacity>
        <View style={styles.searchInputContainer}>
          <Image
            source={require('../assets/icons/search.png')}
            style={styles.searchIcon}
            resizeMode="contain"
          />
          <TextInput
            style={styles.searchInput}
            placeholder={conversation ? 'Search messages' : 'Search'}
            placeholderTextColor={Colors.text.tertiary}
            value={searchText}
            onChangeText={setSearchText}
            onSubmitEditing={handleSearchPress}
            returnKeyType="search"
            autoFocus
            autoCorrect={false}
          />
          {searchText.length > 0 && (
            <TouchableOpacity
              style={styles.clearButton}
              onPress={() => setSearchText('')}
            >
              <Image
                source={require('../assets/icons/close.png')}
                style={styles.clearIcon}
                resizeMode="contain"
              />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {renderTabs()}

      {results.length > 0 ? (
        <FlatList
          style={styles.resultsList}
          data={results}
          keyExtractor={(item, index) => `${item.type}-${index}`}
          renderItem={
            activeTab === 'conversations'
              ? renderConversationItem
              : renderMessageItem
          }
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          keyboardShouldPersistTaps="handled"
        />
      ) : (
        renderEmptyState()
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.sm,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    padding: Spacing.sm,
    marginRight: Spacing.xs,
  },
  backIcon: {
    width: 24,
    height: 24,
    tintColor: Colors.text.primary,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: ThemeUtils.moderateScale(8),
    paddingHorizontal: Spacing.sm,
    height: ThemeUtils.moderateScale(36),
  },
  searchIcon: {
    width: 16,
    height: 16,
    tintColor: Colors.text.tertiary,
    marginRight: Spacing.xs,
  },
  searchInput: {
    flex: 1,
    fontSize: ThemeUtils.moderateScale(16),
    color: Colors.text.primary,
    padding: 0,
  },
  clearButton: {
    padding: Spacing.xs,
    marginLeft: Spacing.xs,
  },
  clearIcon: {
    width: 16,
    height: 16,
    tintColor: Colors.text.tertiary,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  tab: {
    flex: 1,
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: Colors.primary,
  },
  tabText: {
    fontSize: ThemeUtils.moderateScale(14),
    color: Colors.text.secondary,
  },
  tabTextActive: {
    color: Colors.primary,
    fontWeight: '600',
  },
  resultsList: {
    flex: 1,
    backgroundColor: '#fff',
  },
  resultItem: {
    backgroundColor: '#fff',
    padding: Spacing.md,
  },
  messageItemContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  messageIcon: {
    width: ThemeUtils.moderateScale(40),
    height: ThemeUtils.moderateScale(40),
    borderRadius: ThemeUtils.moderateScale(20),
    backgroundColor: Colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  messageIconText: {
    fontSize: ThemeUtils.moderateScale(18),
  },
  messageContent: {
    flex: 1,
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  senderName: {
    fontSize: ThemeUtils.moderateScale(15),
    fontWeight: '600',
    color: Colors.text.primary,
  },
  messageTime: {
    fontSize: ThemeUtils.moderateScale(12),
    color: Colors.text.tertiary,
  },
  messagePreview: {
    fontSize: ThemeUtils.moderateScale(14),
    color: Colors.text.secondary,
    lineHeight: ThemeUtils.moderateScale(20),
  },
  conversationItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: Sizes.avatar.medium,
    height: Sizes.avatar.medium,
    borderRadius: Sizes.avatar.medium / 2,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  avatarImage: {
    width: Sizes.avatar.medium,
    height: Sizes.avatar.medium,
    borderRadius: Sizes.avatar.medium / 2,
  },
  avatarText: {
    color: Colors.text.white,
    fontSize: ThemeUtils.moderateScale(20),
    fontWeight: 'bold',
  },
  conversationContent: {
    flex: 1,
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  conversationName: {
    flex: 1,
    fontSize: ThemeUtils.moderateScale(15),
    fontWeight: '600',
    color: Colors.text.primary,
  },
  conversationTime: {
    fontSize: ThemeUtils.moderateScale(12),
    color: Colors.text.tertiary,
    marginLeft: Spacing.sm,
  },
  conversationPreview: {
    fontSize: ThemeUtils.moderateScale(14),
    color: Colors.text.secondary,
    marginBottom: Spacing.xs,
  },
  matchCountContainer: {
    alignSelf: 'flex-start',
  },
  matchCountText: {
    fontSize: ThemeUtils.moderateScale(12),
    color: Colors.primary,
    fontWeight: '500',
  },
  separator: {
    height: 1,
    backgroundColor: Colors.border,
    marginLeft: Sizes.avatar.medium + Spacing.md + Spacing.md,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  emptyIcon: {
    fontSize: ThemeUtils.moderateScale(48),
    marginBottom: Spacing.md,
  },
  emptyText: {
    fontSize: ThemeUtils.moderateScale(16),
    color: Colors.text.secondary,
    marginBottom: Spacing.xs,
  },
  emptySubText: {
    fontSize: ThemeUtils.moderateScale(14),
    color: Colors.text.tertiary,
  },
});

export default SearchScreen;
