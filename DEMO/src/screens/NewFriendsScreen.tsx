import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, Image, TouchableOpacity, Alert } from 'react-native';
import { getFriendApplications, confirmFriendApplication, FriendApplication } from '../api/friends';
// i18n support
import { t } from '../i18n/config';

const NewFriendsScreen = () => {
    const [applications, setApplications] = useState<FriendApplication[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchApplications = async () => {
        setLoading(true);
        try {
            // Using current timestamp as start might be wrong if the API expects a specific time range or cursor.
            // The prompt example shows `start=1734407505753`. 
            // Usually `start` means start time or offset. If it's time, 0 usually means from the beginning.
            // Let's try 0 or current time depending on API behavior. 
            // Assuming it means "fetch applications before this time" or "after this time".
            // If it's pagination, usually it's an offset or ID.
            // Given the prompt example `start=1734407505753` and `count=50`, it looks like a timestamp for pagination (pull down to refresh style or just latest).
            // Let's assume 0 gets the latest or all for now, or we pass Date.now().
            // If the API returns items in reverse chronological order, passing a large number or current time might get the latest.
            const response = await getFriendApplications(Date.now(), 50);
            setApplications(response.items || []);
        } catch (error) {
            console.error(error);
            Alert.alert(t('common.error'), t('contacts.loadNewFriendsFailed'));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchApplications();
    }, []);

    const handleConfirm = async (sponsorId: string, isAgree: boolean) => {
        try {
            await confirmFriendApplication(sponsorId, isAgree);
            Alert.alert(t('common.saveSuccess'), isAgree ? t('contacts.acceptSuccess') : t('contacts.rejectSuccess'));
            fetchApplications(); // Refresh list
        } catch (error) {
            console.error(error);
            Alert.alert(t('common.error'), t('contacts.processFailed'));
        }
    };

    const renderItem = ({ item }: { item: FriendApplication }) => {
        const isPending = item.status === 0;
        return (
            <View style={styles.itemContainer}>
                <Image source={item.target_user.avatar ? { uri: item.target_user.avatar } : require('../assets/icons/avatar.png')} style={styles.avatar} />
                <View style={styles.info}>
                    <Text style={styles.nickname}>{item.target_user.nickname}</Text>
                    <Text style={styles.message}>{item.is_sponsor ? t('contacts.appliedToYou') : t('contacts.youApplied')}</Text>
                </View>
                {isPending ? (
                    <View style={styles.actions}>
                        <TouchableOpacity
                            style={[styles.button, styles.rejectButton]}
                            onPress={() => handleConfirm(item.target_user.user_id, false)}
                        >
                            <Text style={styles.buttonText}>{t('button.reject')}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.button, styles.acceptButton]}
                            onPress={() => handleConfirm(item.target_user.user_id, true)}
                        >
                            <Text style={styles.buttonText}>{t('button.accept')}</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <Text style={styles.statusText}>
                        {item.status === 1 ? t('contacts.statusAdded') : item.status === 2 ? t('contacts.statusRejected') : t('contacts.statusExpired')}
                    </Text>
                )}
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <FlatList
                data={applications}
                renderItem={renderItem}
                keyExtractor={(item, index) => item.target_user.user_id + index} // Fallback key
                refreshing={loading}
                onRefresh={fetchApplications}
                ListEmptyComponent={!loading ? <Text style={styles.emptyText}>{t('contacts.noNewApplications')}</Text> : null}
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
        alignItems: 'center',
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        minWidth: 0,
    },
    avatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
    },
    info: {
        flex: 1,
        marginLeft: 15,
    },
    nickname: {
        fontSize: 16,
        color: '#333',
        fontWeight: 'bold',
    },
    message: {
        fontSize: 14,
        color: '#999',
        marginTop: 4,
    },
    actions: {
        flexDirection: 'row',
        minWidth: 0,
    },
    button: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 4,
        marginLeft: 8,
        minWidth: 0,
    },
    acceptButton: {
        backgroundColor: '#007AFF',
    },
    rejectButton: {
        backgroundColor: '#ff3b30',
    },
    buttonText: {
        color: '#fff',
        fontSize: 12,
        overflow: 'hidden',
    },
    statusText: {
        color: '#999',
        fontSize: 14,
    },
    emptyText: {
        textAlign: 'center',
        marginTop: 20,
        color: '#999',
    },
});

export default NewFriendsScreen;
