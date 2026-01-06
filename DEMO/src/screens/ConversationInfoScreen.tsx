import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Image,
    Switch,
    Alert,
    ActionSheetIOS,
    Platform,
    Modal,
    TextInput,
    ActivityIndicator,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import JuggleIM, { Conversation } from 'juggleim-rnsdk';
import UserInfoManager from '../manager/UserInfoManager';
import { UserInfo } from '../api/users';
import { GroupInfo, GroupMember, getGroupAnnouncement, inviteGroupMembers, removeGroupMembers, updateGroupInfo } from '../api/groups';
import { launchImageLibrary } from 'react-native-image-picker';
import FriendSelectionSheet from '../components/FriendSelectionSheet';

const ConversationInfoScreen = () => {
    const route = useRoute<any>();
    const navigation = useNavigation<any>();
    const { conversation, title } = route.params;

    const [isPinned, setIsPinned] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
    const [groupInfo, setGroupInfo] = useState<GroupInfo | null>(null);
    const [announcement, setAnnouncement] = useState<string>('');
    const [inviteSheetVisible, setInviteSheetVisible] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [nameModalVisible, setNameModalVisible] = useState(false);
    const [editName, setEditName] = useState('');

    const isPrivateChat = conversation.conversationType === 1;
    const isGroupChat = conversation.conversationType === 2;

    useEffect(() => {
        loadConversationInfo(true);
        loadConversationSettings();
    }, [conversation]);

    const loadConversationInfo = async (forceUpdate: boolean = false) => {
        if (isPrivateChat) {
            const user = await UserInfoManager.getUserInfoForceSync(conversation.conversationId);
            setUserInfo(user);
            JuggleIM.fetchUserInfo(conversation.conversationId);
        } else if (isGroupChat) {
            let group = await UserInfoManager.getGroupInfoForceSync(conversation.conversationId)
            setGroupInfo(group);
            JuggleIM.fetchGroupInfo(conversation.conversationId);
            // Load announcement
            try {
                const announcementData = await getGroupAnnouncement(conversation.conversationId);
                if (announcementData && announcementData.content) {
                    setAnnouncement(announcementData.content);
                }
            } catch (error) {
                console.log('No announcement or failed to load:', error);
            }
        }
    };

    const loadConversationSettings = async () => {
        try {
            const convInfo = await JuggleIM.getConversationInfo(conversation);
            if (convInfo) {
                setIsPinned(convInfo.isTop || false);
                setIsMuted(convInfo.isMute || false);
            }
        } catch (error) {
            console.error('Failed to load conversation settings:', error);
        }
    };

    const handleUpdatePortrait = async () => {
        const result = await launchImageLibrary({
            mediaType: 'photo',
            selectionLimit: 1,
        });

        if (result.assets && result.assets.length > 0) {
            const asset = result.assets[0];
            const localPath = Platform.OS === 'android' ? asset.uri?.replace('file://', '') : asset.uri;

            if (localPath) {
                setUploading(true);
                try {
                    const remoteUrl = await JuggleIM.uploadImage(localPath);
                    setGroupInfo({
                        ...groupInfo,
                        group_portrait: remoteUrl,
                    });
                    await updateGroupInfo({
                        group_id: conversation.conversationId,
                        group_portrait: remoteUrl,
                        group_name: groupInfo?.group_name,
                    });
                    // Reload group info
                    loadConversationInfo(true);
                    Alert.alert('Success', 'Group portrait updated');
                } catch (e) {
                    console.error('Group portrait update failed', e);
                    Alert.alert('Error', 'Failed to update group portrait');
                } finally {
                    setUploading(false);
                }
            }
        }
    };

    const handleUpdateName = async () => {
        if (!editName.trim()) return;
        try {
            await updateGroupInfo({
                group_id: conversation.conversationId,
                group_name: editName,
            });
            // Reload group info
            loadConversationInfo(true);
            setNameModalVisible(false);
            Alert.alert('Success', 'Group name updated');
        } catch (e) {
            console.error('Group name update failed', e);
            Alert.alert('Error', 'Failed to update group name');
        }
    };


    const handlePinToggle = async (value: boolean) => {
        setIsPinned(value);
        try {
            await JuggleIM.setTop(conversation, value);
        } catch (error) {
            console.error('Failed to toggle pin:', error);
            setIsPinned(!value);
        }
    };

    const handleMuteToggle = async (value: boolean) => {
        setIsMuted(value);
        try {
            await JuggleIM.setMute(conversation, value);
        } catch (error) {
            console.error('Failed to toggle mute:', error);
            setIsMuted(!value);
        }
    };

    const handleInviteMembers = async (friend: any) => {
        try {
            await inviteGroupMembers(conversation.conversationId, [friend.user_id]);
            Alert.alert('Success', 'Member invited successfully');
            // Reload group info
            loadConversationInfo(true);
        } catch (error) {
            console.error('Failed to invite member:', error);
            Alert.alert('Error', 'Failed to invite member');
        }
    };

    const handleMemberLongPress = (member: GroupMember) => {
        // Only allow removal if user is owner or admin
        if (!groupInfo || groupInfo.my_role === 0) {
            return; // Regular members can't remove others
        }

        const options = ['Remove Member', 'Cancel'];
        const destructiveButtonIndex = 0;
        const cancelButtonIndex = 1;

        if (Platform.OS === 'ios') {
            ActionSheetIOS.showActionSheetWithOptions(
                {
                    options,
                    cancelButtonIndex,
                    destructiveButtonIndex,
                    title: `Remove ${member.nickname || member.user_id}?`,
                },
                async buttonIndex => {
                    if (buttonIndex === 0) {
                        await removeMember(member.user_id);
                    }
                },
            );
        } else {
            Alert.alert(
                'Remove Member',
                `Remove ${member.nickname || member.user_id}?`,
                [
                    {
                        text: 'Remove',
                        style: 'destructive',
                        onPress: () => removeMember(member.user_id),
                    },
                    { text: 'Cancel', style: 'cancel' },
                ],
            );
        }
    };

    const removeMember = async (userId: string) => {
        try {
            await removeGroupMembers(conversation.conversationId, [userId]);
            Alert.alert('Success', 'Member removed successfully');
            // Reload group info
            loadConversationInfo(true);
        } catch (error) {
            console.error('Failed to remove member:', error);
            Alert.alert('Error', 'Failed to remove member');
        }
    };

    const renderAvatar = (avatarUrl?: string, name?: string) => {
        if (avatarUrl) {
            return <Image source={{ uri: avatarUrl }} style={styles.largeAvatar} />;
        }
        return (
            <View style={[styles.largeAvatar, styles.avatarPlaceholder]}>
                <Text style={styles.avatarText}>
                    {name?.substring(0, 1).toUpperCase() || '?'}
                </Text>
            </View>
        );
    };

    const renderMemberAvatar = (avatarUrl?: string, name?: string) => {
        if (avatarUrl) {
            return <Image source={{ uri: avatarUrl }} style={styles.memberAvatar} />;
        }
        return (
            <View style={[styles.memberAvatar, styles.memberAvatarPlaceholder]}>
                <Text style={styles.memberAvatarText}>
                    {name?.substring(0, 1).toUpperCase() || '?'}
                </Text>
            </View>
        );
    };

    const getRoleBadge = (role: number) => {
        if (role === 1) return '群主';
        if (role === 2) return '管理员';
        return '';
    };

    return (
        <ScrollView style={styles.container}>
            {/* Header Section */}
            <View style={styles.headerSection}>
                {isPrivateChat && userInfo && (
                    <>
                        {renderAvatar(userInfo.avatar, userInfo.nickname)}
                        <Text style={styles.name}>{userInfo.nickname || userInfo.user_id}</Text>
                        <Text style={styles.userId}>ID: {userInfo.user_id}</Text>
                    </>
                )}
                {isGroupChat && groupInfo && (
                    <>
                        <TouchableOpacity onPress={handleUpdatePortrait} disabled={uploading}>
                            <View>
                                {renderAvatar(groupInfo.group_portrait, groupInfo.group_name)}
                                {uploading && (
                                    <View style={styles.avatarOverlay}>
                                        <ActivityIndicator color="#fff" />
                                    </View>
                                )}
                                {!uploading && (
                                    <View style={styles.editIconContainer}>
                                        <Image source={require('../assets/icons/camera.png')} style={styles.cameraIcon} />
                                    </View>
                                )}
                            </View>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.nameContainer}
                            onPress={() => {
                                setEditName(groupInfo.group_name || '');
                                setNameModalVisible(true);
                            }}>
                            <Text style={styles.name}>{groupInfo.group_name || groupInfo.group_id}</Text>
                            <Image source={require('../assets/icons/edit.png')} style={styles.editIcon} />
                        </TouchableOpacity>
                        <Text style={styles.userId}>群成员: {groupInfo.member_count}人</Text>
                    </>
                )}
            </View>

            {/* Settings Section */}
            <View style={styles.section}>
                <View style={styles.settingRow}>
                    <Text style={styles.settingLabel}>置顶聊天</Text>
                    <Switch
                        value={isPinned}
                        onValueChange={handlePinToggle}
                        trackColor={{ false: '#E5E5EA', true: '#34C759' }}
                        thumbColor="#FFFFFF"
                    />
                </View>
                <View style={styles.separator} />
                <View style={styles.settingRow}>
                    <Text style={styles.settingLabel}>消息免打扰</Text>
                    <Switch
                        value={isMuted}
                        onValueChange={handleMuteToggle}
                        trackColor={{ false: '#E5E5EA', true: '#34C759' }}
                        thumbColor="#FFFFFF"
                    />
                </View>
            </View>

            {/* Group Specific Sections */}
            {isGroupChat && groupInfo && (
                <>
                    {/* Group Members Section */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>群成员 ({groupInfo.member_count})</Text>
                        </View>
                        <View style={styles.membersGrid}>
                            {groupInfo.members.map((member, index) => (
                                <TouchableOpacity
                                    key={member.user_id}
                                    style={styles.memberItem}
                                    onLongPress={() => handleMemberLongPress(member)}>
                                    {renderMemberAvatar(member.avatar, member.nickname)}
                                    <Text style={styles.memberName} numberOfLines={1}>
                                        {member.nickname || member.user_id}
                                    </Text>
                                    {getRoleBadge(member.role) !== '' && (
                                        <Text style={styles.roleBadge}>{getRoleBadge(member.role)}</Text>
                                    )}
                                </TouchableOpacity>
                            ))}
                            {/* Add Member Button */}
                            <TouchableOpacity
                                style={styles.memberItem}
                                onPress={() => setInviteSheetVisible(true)}>
                                <View style={[styles.memberAvatar, styles.addMemberButton]}>
                                    <Image
                                        source={require('../assets/icons/circle_add.png')}
                                        style={styles.addIcon}
                                    />
                                </View>
                                <Text style={styles.memberName}>邀请</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Group Announcement Section */}
                    <View style={styles.section}>
                        <TouchableOpacity
                            style={styles.announcementRow}
                            onPress={() =>
                                navigation.navigate('GroupAnnouncement', {
                                    groupId: conversation.conversationId,
                                    currentAnnouncement: announcement,
                                    onUpdate: (newAnnouncement: string) => setAnnouncement(newAnnouncement),
                                })
                            }>
                            <Text style={styles.settingLabel}>群公告</Text>
                            <View style={styles.announcementRight}>
                                <Text style={styles.announcementPreview} numberOfLines={1}>
                                    {announcement || '未设置'}
                                </Text>
                                <Image
                                    source={require('../assets/icons/rightArrowIcon.png')}
                                    style={styles.arrowIcon}
                                />
                            </View>
                        </TouchableOpacity>
                    </View>
                </>
            )}

            <FriendSelectionSheet
                visible={inviteSheetVisible}
                onClose={() => setInviteSheetVisible(false)}
                onSelectFriend={handleInviteMembers}
            />

            <Modal
                visible={nameModalVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setNameModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Edit Group Name</Text>
                        <TextInput
                            style={styles.input}
                            value={editName}
                            onChangeText={setEditName}
                            placeholder="Enter new group name"
                        />
                        <View style={styles.modalButtons}>
                            <TouchableOpacity style={styles.modalButton} onPress={() => setNameModalVisible(false)}>
                                <Text style={styles.modalButtonText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.modalButton, styles.saveButton]} onPress={handleUpdateName}>
                                <Text style={[styles.modalButtonText, styles.saveButtonText]}>Save</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F2F2F7',
    },
    headerSection: {
        backgroundColor: '#FFFFFF',
        alignItems: 'center',
        paddingVertical: 32,
        marginBottom: 16,
    },
    largeAvatar: {
        width: 80,
        height: 80,
        borderRadius: 40,
        marginBottom: 12,
    },
    avatarPlaceholder: {
        backgroundColor: '#007AFF',
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        color: '#FFFFFF',
        fontSize: 32,
        fontWeight: 'bold',
    },
    name: {
        fontSize: 20,
        fontWeight: '600',
        color: '#000000',
        marginBottom: 4,
    },
    userId: {
        fontSize: 14,
        color: '#8E8E93',
    },
    section: {
        backgroundColor: '#FFFFFF',
        marginBottom: 16,
        paddingHorizontal: 16,
    },
    settingRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
    },
    settingLabel: {
        fontSize: 16,
        color: '#000000',
    },
    separator: {
        height: 1,
        backgroundColor: '#E5E5EA',
        marginLeft: 0,
    },
    sectionHeader: {
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E5EA',
    },
    sectionTitle: {
        fontSize: 14,
        color: '#8E8E93',
        fontWeight: '600',
    },
    membersGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingVertical: 12,
    },
    memberItem: {
        width: '20%',
        alignItems: 'center',
        marginBottom: 16,
    },
    memberAvatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        marginBottom: 4,
    },
    memberAvatarPlaceholder: {
        backgroundColor: '#007AFF',
        justifyContent: 'center',
        alignItems: 'center',
    },
    memberAvatarText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: 'bold',
    },
    memberName: {
        fontSize: 12,
        color: '#000000',
        textAlign: 'center',
        width: '100%',
    },
    roleBadge: {
        fontSize: 10,
        color: '#FF9500',
        marginTop: 2,
    },
    addMemberButton: {
        backgroundColor: '#F2F2F7',
        justifyContent: 'center',
        alignItems: 'center',
    },
    addIcon: {
        width: 24,
        height: 24,
        tintColor: '#8E8E93',
    },
    announcementRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
    },
    announcementRight: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        marginLeft: 16,
        justifyContent: 'flex-end',
    },
    announcementPreview: {
        fontSize: 14,
        color: '#8E8E93',
        marginRight: 8,
        maxWidth: 200,
    },
    arrowIcon: {
        width: 16,
        height: 16,
        tintColor: '#C7C7CC',
    },
    avatarOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 12, // match marginBottom of largeAvatar
        borderRadius: 40,
        backgroundColor: 'rgba(0,0,0,0.3)',
        justifyContent: 'center',
        alignItems: 'center',
        width: 80,
        height: 80,
    },
    editIconContainer: {
        position: 'absolute',
        right: -6,
        bottom: 6, // Adjusted for avatar margin
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 4,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.20,
        shadowRadius: 1.41,
        elevation: 2,
    },
    cameraIcon: {
        width: 16,
        height: 16,
        tintColor: '#555',
    },
    nameContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    editIcon: {
        width: 16,
        height: 16,
        marginLeft: 8,
        tintColor: '#888',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: '#fff',
        width: '80%',
        borderRadius: 14,
        padding: 20,
        alignItems: 'center',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 16,
    },
    input: {
        width: '100%',
        borderWidth: 1,
        borderColor: '#e5e5e5',
        borderRadius: 8,
        padding: 10,
        marginBottom: 20,
        fontSize: 16,
    },
    modalButtons: {
        flexDirection: 'row',
        width: '100%',
        justifyContent: 'space-between',
    },
    modalButton: {
        flex: 1,
        padding: 12,
        alignItems: 'center',
    },
    saveButton: {
        borderLeftWidth: 1,
        borderLeftColor: '#e5e5e5',
    },
    modalButtonText: {
        fontSize: 17,
        color: '#007AFF',
    },
    saveButtonText: {
        fontWeight: '600',
    },
});

export default ConversationInfoScreen;
