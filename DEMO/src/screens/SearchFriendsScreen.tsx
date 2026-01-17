import React, { useState } from 'react';
import { View, Text, TextInput, FlatList, StyleSheet, TouchableOpacity, Image, Alert } from 'react-native';
import { searchFriend, applyFriend, Friend } from '../api/friends';
// i18n support
import { t } from '../i18n/config';

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
            Alert.alert(t('common.error'), t('contacts.searchFriendFailed'));
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = async (userId: string) => {
        try {
            await applyFriend(userId);
            Alert.alert(t('common.saveSuccess'), t('contacts.searchSuccess'));
            // Disable the button locally for this user or update state
            // For simplicity, we just show success.
            // Ideally we should track which users we applied to in this session.
        } catch (error) {
            console.error(error);
            Alert.alert(t('common.error'), t('contacts.addFriendFailed'));
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
                <Text style={styles.addButtonText}>{t('contacts.addFriend')}</Text>
            </TouchableOpacity>
        </View>
    );

    return (
        <View style={styles.container}>
            <View style={styles.searchBar}>
                <TextInput
                    style={styles.input}
                    placeholder={t('contacts.searchByUser')}
                    value={keyword}
                    onChangeText={setKeyword}
                    returnKeyType="search"
                    onSubmitEditing={handleSearch}
                />
                <TouchableOpacity onPress={handleSearch} style={styles.searchButton}>
                    <Text style={styles.searchButtonText}>{t('common.search')}</Text>
                </TouchableOpacity>
            </View>
            <FlatList
                data={results}
                renderItem={renderItem}
                keyExtractor={(item) => item.user_id}
                ListEmptyComponent={!loading ? <Text style={styles.emptyText}>{t('contacts.noResults')}</Text> : null}
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
        minWidth: 0,
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
        minWidth: 0,
    },
    searchButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        overflow: 'hidden',
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
    nickname: {
        flex: 1,
        marginLeft: 15,
        fontSize: 16,
        color: '#333',
        minWidth: 0,
    },
    addButton: {
        paddingHorizontal: 15,
        paddingVertical: 8,
        backgroundColor: '#007AFF',
        borderRadius: 5,
        minWidth: 0,
    },
    addButtonText: {
        color: '#fff',
        fontSize: 14,
        overflow: 'hidden',
    },
    emptyText: {
        textAlign: 'center',
        marginTop: 20,
        color: '#999',
    },
});

export default SearchFriendsScreen;
