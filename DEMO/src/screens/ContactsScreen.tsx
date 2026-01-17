import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, Alert, RefreshControl } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { getFriendList, Friend } from '../api/friends';
import { Colors, Spacing, Sizes, ThemeUtils, Typography } from '../theme';
// i18n support
import { t } from '../i18n/config';

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
                <View style={[styles.iconPlaceholder, styles.searchIcon]}>
                    <Text style={styles.iconText}>🔍</Text>
                </View>
                <Text style={styles.headerText}>{t('contacts.searchFriends')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
                style={styles.headerItem}
                onPress={() => navigation.navigate('NewFriends')}
            >
                <View style={[styles.iconPlaceholder, styles.addFriendIcon]}>
                    <Text style={styles.iconText}>+</Text>
                </View>
                <Text style={styles.headerText}>{t('contacts.newFriends')}</Text>
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
                        tintColor={Colors.text.tertiary}
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
        backgroundColor: Colors.background,
    },
    headerItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: Spacing.md,
        paddingHorizontal: Spacing.xl,
        backgroundColor: Colors.background,
    },
    iconPlaceholder: {
        width: ThemeUtils.moderateScale(40),
        height: ThemeUtils.moderateScale(40),
        borderRadius: ThemeUtils.moderateScale(5),
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: Spacing.md,
    },
    searchIcon: {
        backgroundColor: Colors.primary,
    },
    addFriendIcon: {
        backgroundColor: Colors.accent,
    },
    iconText: {
        color: Colors.text.white,
        fontSize: ThemeUtils.moderateScale(20),
        fontWeight: 'bold',
    },
    headerText: {
        fontSize: Typography.conversationName.fontSize,
        color: Colors.text.primary,
        flex: 1,
        overflow: 'hidden',
        numberOfLines: 1,
    },
    divider: {
        height: ThemeUtils.moderateScale(10),
        backgroundColor: Colors.border,
    },
    itemContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: Spacing.md,
        paddingHorizontal: Spacing.xl,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: Colors.border,
    },
    avatar: {
        width: ThemeUtils.moderateScale(40),
        height: ThemeUtils.moderateScale(40),
        borderRadius: ThemeUtils.moderateScale(20),
    },
    nickname: {
        marginLeft: Spacing.md,
        fontSize: Typography.conversationName.fontSize,
        color: Colors.text.primary,
        flex: 1,
        overflow: 'hidden',
        numberOfLines: 1,
    },
});

export default ContactsScreen;
