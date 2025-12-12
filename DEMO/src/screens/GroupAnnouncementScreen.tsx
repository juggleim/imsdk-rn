import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    Alert,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { setGroupAnnouncement } from '../api/groups';

const GroupAnnouncementScreen = () => {
    const route = useRoute<any>();
    const navigation = useNavigation<any>();
    const { groupId, currentAnnouncement, onUpdate } = route.params;

    const [announcement, setAnnouncement] = useState(currentAnnouncement || '');
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async () => {
        if (isSaving) return;

        setIsSaving(true);
        try {
            await setGroupAnnouncement(groupId, announcement);
            Alert.alert('成功', '群公告已更新');
            if (onUpdate) {
                onUpdate(announcement);
            }
            navigation.goBack();
        } catch (error) {
            console.error('Failed to set announcement:', error);
            Alert.alert('错误', '更新群公告失败');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Text style={styles.cancelButton}>取消</Text>
                </TouchableOpacity>
                <Text style={styles.title}>群公告</Text>
                <TouchableOpacity onPress={handleSave} disabled={isSaving}>
                    <Text style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}>
                        {isSaving ? '保存中...' : '保存'}
                    </Text>
                </TouchableOpacity>
            </View>

            <View style={styles.content}>
                <TextInput
                    style={styles.input}
                    value={announcement}
                    onChangeText={setAnnouncement}
                    placeholder="请输入群公告内容..."
                    placeholderTextColor="#C7C7CC"
                    multiline
                    textAlignVertical="top"
                    autoFocus
                />
                <Text style={styles.hint}>群公告将对所有群成员可见</Text>
            </View>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F2F2F7',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E5EA',
    },
    cancelButton: {
        fontSize: 16,
        color: '#007AFF',
    },
    title: {
        fontSize: 17,
        fontWeight: '600',
        color: '#000000',
    },
    saveButton: {
        fontSize: 16,
        color: '#007AFF',
        fontWeight: '600',
    },
    saveButtonDisabled: {
        color: '#C7C7CC',
    },
    content: {
        flex: 1,
        padding: 16,
    },
    input: {
        backgroundColor: '#FFFFFF',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        color: '#000000',
        minHeight: 200,
        borderWidth: 1,
        borderColor: '#E5E5EA',
    },
    hint: {
        fontSize: 12,
        color: '#8E8E93',
        marginTop: 8,
    },
});

export default GroupAnnouncementScreen;
