import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    TextInput,
    Alert,
    ActivityIndicator,
    SafeAreaView,
    Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { getFriendList, Friend } from '../api/friends';
import { createGroup } from '../api/groups';
// i18n support
import { t } from '../i18n/config';

interface FriendItemProps {
    friend: Friend;
    isSelected: boolean;
    onToggle: (userId: string) => void;
}

const FriendItem: React.FC<FriendItemProps> = ({ friend, isSelected, onToggle }) => {
    return (
        <TouchableOpacity
            style={styles.friendItem}
            onPress={() => onToggle(friend.user_id)}>
            <View style={styles.checkbox}>
                {isSelected && <View style={styles.checkboxInner} />}
            </View>
            <View style={styles.avatar}>
                {friend.avatar ? (
                    <Image source={{ uri: friend.avatar }} style={styles.avatarImage} />
                ) : (
                    <Text style={styles.avatarText}>
                        {friend.nickname.substring(0, 1).toUpperCase()}
                    </Text>
                )}
            </View>
            <Text style={styles.friendName}>{friend.nickname || friend.user_id}</Text>
        </TouchableOpacity>
    );
};

const CreateGroupScreen = () => {
    const navigation = useNavigation<any>();
    const [friends, setFriends] = useState<Friend[]>([]);
    const [selectedFriends, setSelectedFriends] = useState<Set<string>>(new Set());
    const [groupName, setGroupName] = useState('');
    const [loading, setLoading] = useState(false);
    const [creating, setCreating] = useState(false);

    useEffect(() => {
        loadFriends();
    }, []);

    const loadFriends = async () => {
        setLoading(true);
        try {
            const response = await getFriendList(1, 100);
            if (response && response.items) {
                setFriends(response.items);
            }
        } catch (error) {
            console.error('Failed to load friends:', error);
            Alert.alert('错误', '加载好友列表失败');
        } finally {
            setLoading(false);
        }
    };

    const toggleFriend = (userId: string) => {
        const newSelected = new Set(selectedFriends);
        if (newSelected.has(userId)) {
            newSelected.delete(userId);
        } else {
            newSelected.add(userId);
        }
        setSelectedFriends(newSelected);
    };

    const handleCreateGroup = async () => {
        if (selectedFriends.size === 0) {
            Alert.alert(t('common.error'), t('group.selectAtLeastOne'));
            return;
        }

        if (!groupName.trim()) {
            Alert.alert(t('common.error'), t('group.enterGroupName'));
            return;
        }

        setCreating(true);
        try {
            const memberIds = Array.from(selectedFriends);
            const response = await createGroup({
                group_name: groupName.trim(),
                member_ids: memberIds,
                // group_portrait can be added here if image picker is implemented
            });

            Alert.alert(t('common.saveSuccess'), t('group.createSuccess'), [
                {
                    text: t('common.confirm'),
                    onPress: () => navigation.goBack(),
                },
            ]);
        } catch (error) {
            console.error('Failed to create group:', error);
            Alert.alert(t('common.error'), t('group.createFailed'));
        } finally {
            setCreating(false);
        }
    };

    const renderFriendItem = ({ item }: { item: Friend }) => (
        <FriendItem
            friend={item}
            isSelected={selectedFriends.has(item.user_id)}
            onToggle={toggleFriend}
        />
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TextInput
                    style={styles.input}
                    placeholder={t('group.enterGroupName')}
                    value={groupName}
                    onChangeText={setGroupName}
                    maxLength={20}
                />
                <Text style={styles.selectedCount}>
                    {t('group.selectedCount')} {selectedFriends.size}
                </Text>
            </View>

            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#007AFF" />
                </View>
            ) : (
                <FlatList
                    data={friends}
                    renderItem={renderFriendItem}
                    keyExtractor={item => item.user_id}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyText}>{t('contacts.noContacts')}</Text>
                        </View>
                    }
                />
            )}

            <TouchableOpacity
                style={[
                    styles.createButton,
                    (selectedFriends.size === 0 || !groupName.trim() || creating) &&
                    styles.createButtonDisabled,
                ]}
                onPress={handleCreateGroup}
                disabled={selectedFriends.size === 0 || !groupName.trim() || creating}>
                {creating ? (
                    <ActivityIndicator color="#fff" />
                ) : (
                    <Text style={styles.createButtonText}>{t('group.create')}</Text>
                )}
            </TouchableOpacity>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    header: {
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
        minWidth: 0,
    },
    input: {
        height: 44,
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        paddingHorizontal: 12,
        fontSize: 16,
        marginBottom: 8,
    },
    selectedCount: {
        fontSize: 14,
        color: '#666',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    friendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
        minWidth: 0,
    },
    checkbox: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#007AFF',
        marginRight: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    checkboxInner: {
        width: 14,
        height: 14,
        borderRadius: 7,
        backgroundColor: '#007AFF',
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#007AFF',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
        overflow: 'hidden',
    },
    avatarImage: {
        width: 40,
        height: 40,
    },
    avatarText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    friendName: {
        fontSize: 16,
        color: '#333',
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
    createButton: {
        backgroundColor: '#007AFF',
        height: 50,
        justifyContent: 'center',
        alignItems: 'center',
        margin: 16,
        borderRadius: 8,
    },
    createButtonDisabled: {
        backgroundColor: '#ccc',
    },
    createButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
        overflow: 'hidden',
    },
});

export default CreateGroupScreen;
