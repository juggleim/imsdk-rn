import React, { useState } from 'react';
import { View, Text, TextInput, FlatList, StyleSheet, TouchableOpacity, Image, Alert } from 'react-native';
import { searchFriend, applyFriend, Friend } from '../api/friends';

const SearchFriendsScreen = () => {
    const [keyword, setKeyword] = useState('');
    const [results, setResults] = useState<Friend[]>([]);
    const [loading, setLoading] = useState(false);

    const handleSearch = async () => {
        if (!keyword.trim()) return;
        setLoading(true);
        try {
            const response = await searchFriend(keyword);
            setResults(response.items || []);
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Failed to search friends');
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = async (userId: string) => {
        try {
            await applyFriend(userId);
            Alert.alert('Success', 'Friend request sent');
            // Disable the button locally for this user or update state
            // For simplicity, we just show success. 
            // Ideally we should track which users we applied to in this session.
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Failed to send friend request');
        }
    };

    const renderItem = ({ item }: { item: Friend }) => (
        <View style={styles.itemContainer}>
            <Image source={item.avatar ? { uri: item.avatar } : require('../assets/icons/avatar.png')} style={styles.avatar} />
            <Text style={styles.nickname}>{item.nickname}</Text>
            <TouchableOpacity
                style={styles.addButton}
                onPress={() => handleAdd(item.user_id)}
            >
                <Text style={styles.addButtonText}>Add</Text>
            </TouchableOpacity>
        </View>
    );

    return (
        <View style={styles.container}>
            <View style={styles.searchBar}>
                <TextInput
                    style={styles.input}
                    placeholder="Search by username/id"
                    value={keyword}
                    onChangeText={setKeyword}
                    returnKeyType="search"
                    onSubmitEditing={handleSearch}
                />
                <TouchableOpacity onPress={handleSearch} style={styles.searchButton}>
                    <Text style={styles.searchButtonText}>Search</Text>
                </TouchableOpacity>
            </View>
            <FlatList
                data={results}
                renderItem={renderItem}
                keyExtractor={(item) => item.user_id}
                ListEmptyComponent={!loading ? <Text style={styles.emptyText}>No results</Text> : null}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    searchBar: {
        flexDirection: 'row',
        padding: 10,
        backgroundColor: '#f0f0f0',
        alignItems: 'center',
    },
    input: {
        flex: 1,
        backgroundColor: '#fff',
        borderRadius: 5,
        paddingHorizontal: 10,
        height: 40,
    },
    searchButton: {
        marginLeft: 10,
        paddingHorizontal: 15,
        paddingVertical: 10,
        backgroundColor: '#007AFF',
        borderRadius: 5,
    },
    searchButtonText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    itemContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    avatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
    },
    nickname: {
        flex: 1,
        marginLeft: 15,
        fontSize: 16,
        color: '#333',
    },
    addButton: {
        paddingHorizontal: 15,
        paddingVertical: 8,
        backgroundColor: '#007AFF',
        borderRadius: 5,
    },
    addButtonText: {
        color: '#fff',
        fontSize: 14,
    },
    emptyText: {
        textAlign: 'center',
        marginTop: 20,
        color: '#999',
    },
});

export default SearchFriendsScreen;
