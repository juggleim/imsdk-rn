import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    FlatList,
    ActivityIndicator,
    Image,
} from 'react-native';
import Modal from 'react-native-modal';
import { Friend, getFriendList } from '../api/friends';

interface FriendSelectionSheetProps {
    visible: boolean;
    onClose: () => void;
    onSelectFriend: (friend: Friend) => void;
}

const FriendSelectionSheet: React.FC<FriendSelectionSheetProps> = ({
    visible,
    onClose,
    onSelectFriend,
}) => {
    const [friends, setFriends] = useState<Friend[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (visible) {
            loadFriends();
        }
    }, [visible]);

    const loadFriends = async () => {
        setLoading(true);
        try {
            const result = await getFriendList(1, 100);
            if (result && result.items) {
                setFriends(result.items);
            }
        } catch (error) {
            console.error('Failed to load friends:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSelectFriend = (friend: Friend) => {
        onSelectFriend(friend);
        onClose();
    };

    const renderFriendItem = ({ item }: { item: Friend }) => (
        <TouchableOpacity
            style={styles.friendItem}
            onPress={() => handleSelectFriend(item)}
            activeOpacity={0.7}>
            <View style={styles.avatarContainer}>
                {item.avatar ? (
                    <Image source={{ uri: item.avatar }} style={styles.avatar} />
                ) : (
                    <Text style={styles.avatarText}>
                        {item.nickname?.substring(0, 1).toUpperCase() || '?'}
                    </Text>
                )}
            </View>
            <View style={styles.friendInfo}>
                <Text style={styles.friendName}>{item.nickname || item.user_id}</Text>
                <Text style={styles.friendId}>ID: {item.user_id}</Text>
            </View>
        </TouchableOpacity>
    );

    return (
        <Modal
            isVisible={visible}
            onBackdropPress={onClose}
            onSwipeComplete={onClose}
            swipeDirection="down"
            style={styles.modal}
            propagateSwipe>
            <View style={styles.container}>
                <View style={styles.header}>
                    <View style={styles.handleBar} />
                    <Text style={styles.title}>选择好友</Text>
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
                        contentContainerStyle={styles.listContent}
                        showsVerticalScrollIndicator={false}
                    />
                )}
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modal: {
        justifyContent: 'flex-end',
        margin: 0,
    },
    container: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        maxHeight: '80%',
        paddingBottom: 34,
    },
    header: {
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.05)',
    },
    handleBar: {
        width: 36,
        height: 4,
        backgroundColor: '#D1D1D6',
        borderRadius: 2,
        marginBottom: 8,
    },
    title: {
        fontSize: 16,
        fontWeight: '600',
        color: '#141414',
    },
    loadingContainer: {
        padding: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    listContent: {
        paddingHorizontal: 16,
        paddingVertical: 8,
    },
    friendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.05)',
    },
    avatarContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#ccc',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
        overflow: 'hidden',
    },
    avatar: {
        width: 48,
        height: 48,
    },
    avatarText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    friendInfo: {
        flex: 1,
    },
    friendName: {
        fontSize: 16,
        fontWeight: '500',
        color: '#141414',
        marginBottom: 4,
    },
    friendId: {
        fontSize: 13,
        color: '#999',
    },
});

export default FriendSelectionSheet;
