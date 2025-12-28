import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, Alert, RefreshControl } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { getFriendList, Friend } from '../api/friends';

const ContactsScreen = () => {
    const navigation = useNavigation<any>();
    const [friends, setFriends] = useState<Friend[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchFriends = async () => {
        setLoading(true);
        try {
            const response = await getFriendList();
            setFriends(response.items || []);
        } catch (error) {
            console.error(error);
            // Alert.alert('Error', 'Failed to load friends');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFriends();
    }, []);

    const renderHeader = () => (
        <View>
            <TouchableOpacity
                style={styles.headerItem}
                onPress={() => navigation.navigate('SearchFriends')}
            >
                <View style={[styles.iconPlaceholder, { backgroundColor: '#007AFF' }]}>
                    <Text style={styles.iconText}>🔍</Text>
                </View>
                <Text style={styles.headerText}>Search Friends</Text>
            </TouchableOpacity>
            <TouchableOpacity
                style={styles.headerItem}
                onPress={() => navigation.navigate('NewFriends')}
            >
                <View style={[styles.iconPlaceholder, { backgroundColor: '#FA9D3B' }]}>
                    <Text style={styles.iconText}>+</Text>
                </View>
                <Text style={styles.headerText}>New Friends</Text>
            </TouchableOpacity>
            <View style={styles.divider} />
        </View>
    );

    const renderItem = ({ item }: { item: Friend }) => (
        <View style={styles.itemContainer}>
            <Image source={item.avatar ? { uri: item.avatar } : require('../assets/icons/avatar.png')} style={styles.avatar} />
            <Text style={styles.nickname}>{item.nickname}</Text>
        </View>
    );

    return (
        <View style={styles.container}>
            <FlatList
                data={friends}
                renderItem={renderItem}
                keyExtractor={(item) => item.user_id}
                ListHeaderComponent={renderHeader}
                refreshControl={
                    <RefreshControl
                        refreshing={loading}
                        onRefresh={fetchFriends}
                        tintColor="#999"
                    />
                }
                automaticallyAdjustContentInsets={false}
                contentInsetAdjustmentBehavior="never"
                contentContainerStyle={{ paddingTop: 0 }}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    headerItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
        backgroundColor: '#fff',
    },
    iconPlaceholder: {
        width: 40,
        height: 40,
        borderRadius: 5,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    iconText: {
        color: '#fff',
        fontSize: 20,
        fontWeight: 'bold',
    },
    headerText: {
        fontSize: 16,
        color: '#333',
    },
    divider: {
        height: 10,
        backgroundColor: '#f0f0f0',
    },
    itemContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
    },
    nickname: {
        marginLeft: 15,
        fontSize: 16,
        color: '#333',
    },
});

export default ContactsScreen;
