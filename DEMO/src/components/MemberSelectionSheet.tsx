import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    Image,
    Modal,
    TouchableWithoutFeedback,
} from 'react-native';
import { GroupMember } from '../api/groups';

interface MemberSelectionSheetProps {
    visible: boolean;
    members: GroupMember[];
    onClose: () => void;
    onSelectMember: (member: GroupMember | 'all') => void;
}

const MemberSelectionSheet: React.FC<MemberSelectionSheetProps> = ({
    visible,
    members,
    onClose,
    onSelectMember,
}) => {
    const handleSelectAll = () => {
        onSelectMember('all');
        onClose();
    };

    const handleSelectMember = (member: GroupMember) => {
        onSelectMember(member);
        onClose();
    };

    const renderMemberItem = ({ item }: { item: GroupMember }) => (
        <TouchableOpacity
            style={styles.memberItem}
            onPress={() => handleSelectMember(item)}>
            <View style={styles.avatarContainer}>
                {item.avatar ? (
                    <Image source={{ uri: item.avatar }} style={styles.avatar} />
                ) : (
                    <Text style={styles.avatarText}>
                        {item.nickname?.substring(0, 1).toUpperCase() || '?'}
                    </Text>
                )}
            </View>
            <View style={styles.memberInfo}>
                <Text style={styles.memberName}>{item.nickname || item.user_id}</Text>
                <Text style={styles.memberId}>{item.user_id}</Text>
            </View>
        </TouchableOpacity>
    );

    const renderHeader = () => (
        <View>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>选择提醒的人</Text>
                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                    <Text style={styles.closeButtonText}>×</Text>
                </TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.atAllItem} onPress={handleSelectAll}>
                <View style={[styles.avatarContainer, styles.atAllAvatar]}>
                    <Text style={styles.avatarText}>@</Text>
                </View>
                <View style={styles.memberInfo}>
                    <Text style={styles.memberName}>所有人</Text>
                    <Text style={styles.memberId}>提醒群内所有成员</Text>
                </View>
            </TouchableOpacity>
            <View style={styles.divider} />
        </View>
    );

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={onClose}>
            <TouchableWithoutFeedback onPress={onClose}>
                <View style={styles.overlay}>
                    <TouchableWithoutFeedback>
                        <View style={styles.container}>
                            <View style={styles.handleBar} />
                            <FlatList
                                data={members}
                                keyExtractor={(item: GroupMember) => item.user_id}
                                renderItem={renderMemberItem}
                                ListHeaderComponent={renderHeader}
                                contentContainerStyle={styles.contentContainer}
                                showsVerticalScrollIndicator={false}
                            />
                        </View>
                    </TouchableWithoutFeedback>
                </View>
            </TouchableWithoutFeedback>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    container: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        maxHeight: '75%',
    },
    handleBar: {
        width: 40,
        height: 4,
        backgroundColor: '#ccc',
        borderRadius: 2,
        alignSelf: 'center',
        marginTop: 8,
        marginBottom: 8,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    headerTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#141414',
    },
    closeButton: {
        width: 30,
        height: 30,
        justifyContent: 'center',
        alignItems: 'center',
    },
    closeButtonText: {
        fontSize: 28,
        color: '#999',
        lineHeight: 28,
    },
    contentContainer: {
        paddingBottom: 20,
    },
    atAllItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 20,
        backgroundColor: '#f8f9fa',
    },
    atAllAvatar: {
        backgroundColor: '#ff9500',
    },
    divider: {
        height: 8,
        backgroundColor: '#f5f5f5',
    },
    memberItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 20,
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
    memberInfo: {
        flex: 1,
    },
    memberName: {
        fontSize: 16,
        color: '#141414',
        marginBottom: 2,
    },
    memberId: {
        fontSize: 12,
        color: '#999',
    },
});

export default MemberSelectionSheet;
