
import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    Image,
    SafeAreaView,
    Alert
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import UserInfoManager from '../manager/UserInfoManager';
import { GroupMember } from '../api/groups';
import { JuggleIMCall, CallMediaType } from 'juggleim-rnsdk';
import { USER_ID_KEY } from '../utils/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CallSelectMemberScreen = () => {
    const route = useRoute<any>();
    const navigation = useNavigation<any>();
    const { conversationId } = route.params;
    const [members, setMembers] = useState<GroupMember[]>([]);
    const [selectedMembers, setSelectedMembers] = useState<Set<string>>(new Set());
    const [currentUserId, setCurrentUserId] = useState<string>('');

    useEffect(() => {
        const fetchUserId = async () => {
            const userId = await AsyncStorage.getItem(USER_ID_KEY);
            if (userId) {
                setCurrentUserId(userId);
            }
        };
        fetchUserId();

        const loadMembers = async () => {
            const groupInfo = await UserInfoManager.getGroupInfo(conversationId);
            if (groupInfo && groupInfo.members) {
                setMembers(groupInfo.members);
            }
        };
        loadMembers();
    }, [conversationId]);

    const toggleSelection = (userId: string) => {
        if (userId === currentUserId) return;
        const newSelection = new Set(selectedMembers);
        if (newSelection.has(userId)) {
            newSelection.delete(userId);
        } else {
            newSelection.add(userId);
        }
        setSelectedMembers(newSelection);
    };

    const handleStartCall = () => {
        if (selectedMembers.size === 0) {
            Alert.alert('提示', '请至少选择一个成员');
            return;
        }
        const userIds = Array.from(selectedMembers);
        JuggleIMCall.startMultiCall(userIds, CallMediaType.VIDEO)
            .then(session => {
                navigation.replace('VideoCall', { callId: session.callId, isIncoming: false });
            })
            .catch(e => {
                console.error('Start multi call failed', e);
                Alert.alert('Error', 'Start call failed');
            });
    };

    const renderItem = ({ item }: { item: GroupMember }) => {
        const isSelected = selectedMembers.has(item.user_id);
        const isSelf = item.user_id === currentUserId;

        return (
            <TouchableOpacity
                style={styles.memberItem}
                onPress={() => toggleSelection(item.user_id)}
                disabled={isSelf}
            >
                <View style={[styles.checkbox, isSelected && styles.checkboxSelected, isSelf && styles.checkboxDisabled]}>
                    {isSelected && <Text style={styles.checkmark}>✓</Text>}
                </View>
                <View style={styles.avatarContainer}>
                    {item.avatar ? (
                        <Image source={{ uri: item.avatar }} style={styles.avatar} />
                    ) : (
                        <Text style={styles.avatarText}>
                            {item.nickname?.substring(0, 1).toUpperCase() || '?'}
                        </Text>
                    )}
                </View>
                <Text style={styles.memberName}>{item.nickname || item.user_id}</Text>
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Text style={styles.backText}>取消</Text>
                </TouchableOpacity>
                <Text style={styles.title}>选择成员</Text>
                <View style={{ width: 40 }} />
            </View>
            <FlatList
                data={members}
                keyExtractor={item => item.user_id}
                renderItem={renderItem}
                contentContainerStyle={styles.listContent}
            />
            <View style={styles.footer}>
                <TouchableOpacity
                    style={[styles.startButton, selectedMembers.size === 0 && styles.startButtonDisabled]}
                    onPress={handleStartCall}
                    disabled={selectedMembers.size === 0}
                >
                    <Text style={styles.startButtonText}>开始通话 ({selectedMembers.size})</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    backButton: {
        padding: 8,
    },
    backText: {
        fontSize: 16,
        color: '#333',
    },
    title: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
    },
    listContent: {
        paddingVertical: 10,
    },
    memberItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 12,
    },
    checkbox: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#ccc',
        marginRight: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    checkboxSelected: {
        backgroundColor: '#3399ff',
        borderColor: '#3399ff',
    },
    checkboxDisabled: {
        backgroundColor: '#f0f0f0',
        borderColor: '#f0f0f0',
    },
    checkmark: {
        color: '#fff',
        fontSize: 14,
    },
    avatarContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#3399ff',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
        overflow: 'hidden',
    },
    avatar: {
        width: 40,
        height: 40,
    },
    avatarText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    memberName: {
        fontSize: 16,
        color: '#333',
    },
    footer: {
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
    },
    startButton: {
        backgroundColor: '#00c853', // WeChat green
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    startButtonDisabled: {
        backgroundColor: '#a5d6a7',
    },
    startButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
        overflow: 'hidden',
    },
});

export default CallSelectMemberScreen;
