import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Modal,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    TouchableWithoutFeedback,
    Keyboard,
} from 'react-native';

interface CardMessageInputProps {
    visible: boolean;
    onClose: () => void;
    onSend: (title: string, description: string, url: string) => void;
}

const CardMessageInput: React.FC<CardMessageInputProps> = ({
    visible,
    onClose,
    onSend,
}) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [url, setUrl] = useState('');

    const handleSend = () => {
        if (title.trim()) {
            onSend(title.trim(), description.trim(), url.trim());
            // 清空输入
            setTitle('');
            setDescription('');
            setUrl('');
            onClose();
        }
    };

    const handleClose = () => {
        setTitle('');
        setDescription('');
        setUrl('');
        onClose();
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={handleClose}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.container}>
                <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                    <View style={styles.overlay}>
                        <TouchableWithoutFeedback>
                            <View style={styles.modalContent}>
                                <View style={styles.header}>
                                    <TouchableOpacity onPress={handleClose}>
                                        <Text style={styles.cancelButton}>取消</Text>
                                    </TouchableOpacity>
                                    <Text style={styles.title}>发送卡片消息</Text>
                                    <TouchableOpacity
                                        onPress={handleSend}
                                        disabled={!title.trim()}>
                                        <Text
                                            style={[
                                                styles.sendButton,
                                                !title.trim() && styles.sendButtonDisabled,
                                            ]}>
                                            发送
                                        </Text>
                                    </TouchableOpacity>
                                </View>

                                <ScrollView
                                    style={styles.formContainer}
                                    keyboardShouldPersistTaps="handled">
                                    <View style={styles.inputGroup}>
                                        <Text style={styles.label}>
                                            标题 <Text style={styles.required}>*</Text>
                                        </Text>
                                        <TextInput
                                            style={styles.input}
                                            value={title}
                                            onChangeText={setTitle}
                                            placeholder="请输入卡片标题"
                                            placeholderTextColor="#999"
                                            maxLength={50}
                                        />
                                        <Text style={styles.charCount}>{title.length}/50</Text>
                                    </View>

                                    <View style={styles.inputGroup}>
                                        <Text style={styles.label}>描述</Text>
                                        <TextInput
                                            style={[styles.input, styles.textArea]}
                                            value={description}
                                            onChangeText={setDescription}
                                            placeholder="请输入卡片描述"
                                            placeholderTextColor="#999"
                                            multiline
                                            numberOfLines={4}
                                            maxLength={200}
                                        />
                                        <Text style={styles.charCount}>{description.length}/200</Text>
                                    </View>

                                    <View style={styles.inputGroup}>
                                        <Text style={styles.label}>链接</Text>
                                        <TextInput
                                            style={styles.input}
                                            value={url}
                                            onChangeText={setUrl}
                                            placeholder="https://example.com"
                                            placeholderTextColor="#999"
                                            keyboardType="url"
                                            autoCapitalize="none"
                                            autoCorrect={false}
                                        />
                                    </View>

                                    <View style={styles.previewContainer}>
                                        <Text style={styles.previewLabel}>预览</Text>
                                        <View style={styles.previewCard}>
                                            <Text style={styles.previewTitle}>
                                                {title || '卡片标题'}
                                            </Text>
                                            {description ? (
                                                <Text style={styles.previewDescription}>
                                                    {description}
                                                </Text>
                                            ) : null}
                                            {url ? (
                                                <Text style={styles.previewUrl} numberOfLines={1}>
                                                    {url}
                                                </Text>
                                            ) : null}
                                        </View>
                                    </View>
                                </ScrollView>
                            </View>
                        </TouchableWithoutFeedback>
                    </View>
                </TouchableWithoutFeedback>
            </KeyboardAvoidingView>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        padding: 20,
    },
    modalContent: {
        backgroundColor: '#fff',
        borderRadius: 16,
        maxHeight: '80%',
        overflow: 'hidden',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
        minWidth: 0,
    },
    title: {
        fontSize: 17,
        fontWeight: '600',
        color: '#141414',
    },
    cancelButton: {
        fontSize: 16,
        color: '#8E8E93',
        overflow: 'hidden',
    },
    sendButton: {
        fontSize: 16,
        color: '#007AFF',
        fontWeight: '600',
        overflow: 'hidden',
    },
    sendButtonDisabled: {
        color: '#C7C7CC',
    },
    formContainer: {
        padding: 16,
    },
    inputGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: '500',
        color: '#141414',
        marginBottom: 8,
    },
    required: {
        color: '#FF3B30',
    },
    input: {
        borderWidth: 1,
        borderColor: '#E5E5EA',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        color: '#141414',
        backgroundColor: '#F9F9F9',
    },
    textArea: {
        height: 100,
        textAlignVertical: 'top',
    },
    charCount: {
        fontSize: 12,
        color: '#8E8E93',
        textAlign: 'right',
        marginTop: 4,
    },
    previewContainer: {
        marginTop: 10,
    },
    previewLabel: {
        fontSize: 14,
        fontWeight: '500',
        color: '#141414',
        marginBottom: 8,
    },
    previewCard: {
        backgroundColor: '#F0F8FF',
        borderRadius: 12,
        padding: 16,
        borderLeftWidth: 4,
        borderLeftColor: '#007AFF',
        minWidth: 0,
    },
    previewTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#141414',
        marginBottom: 6,
        overflow: 'hidden',
    },
    previewDescription: {
        fontSize: 14,
        color: '#666',
        lineHeight: 20,
        marginBottom: 8,
        overflow: 'hidden',
    },
    previewUrl: {
        fontSize: 13,
        color: '#007AFF',
        overflow: 'hidden',
    },
});

export default CardMessageInput;
