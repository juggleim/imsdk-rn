import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { BusinessCardMessage } from '../messages/BusinessCardMessage';

interface BusinessCardBubbleProps {
    message: BusinessCardMessage;
    isOutgoing: boolean;
}

const BusinessCardBubble: React.FC<BusinessCardBubbleProps> = ({
    message,
    isOutgoing,
}) => {
    return (
        <View style={[
            styles.container,
            isOutgoing ? styles.outgoingContainer : styles.incomingContainer
        ]}>
            <View style={styles.card}>
                <View style={styles.avatarContainer}>
                    {message.avatar ? (
                        <Image source={{ uri: message.avatar }} style={styles.avatar} />
                    ) : (
                        <Text style={styles.avatarText}>
                            {message.nickname?.substring(0, 1).toUpperCase() || '?'}
                        </Text>
                    )}
                </View>
                <View style={styles.info}>
                    <Text style={styles.nickname}>{message.nickname || '未知用户'}</Text>
                    <Text style={styles.userId}>ID: {message.userId}</Text>
                </View>
            </View>
            <View style={styles.footer}>
                <Text style={styles.footerText}>个人名片</Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        maxWidth: 260,
        borderRadius: 8,
        overflow: 'hidden',
        backgroundColor: 'transparent', // 使用透明背景，继承外层气泡颜色
    },
    outgoingContainer: {
        // 移除独立背景色，使用外层气泡的蓝色
    },
    incomingContainer: {
        // 移除独立背景色，使用外层气泡的白色
    },
    card: {
        flexDirection: 'row',
        padding: 12,
        alignItems: 'center',
    },
    avatarContainer: {
        width: 48,
        height: 48,
        borderRadius: 8,
        backgroundColor: '#ccc',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
        overflow: 'hidden',
    },
    avatar: {
        width: 48,
        height: 48,
    },
    avatarText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    info: {
        flex: 1,
    },
    nickname: {
        fontSize: 16,
        fontWeight: '600',
        color: '#141414',
        marginBottom: 4,
    },
    userId: {
        fontSize: 13,
        color: '#666',
    },
    footer: {
        borderTopWidth: 1,
        borderTopColor: 'rgba(0,0,0,0.05)',
        paddingVertical: 8,
        paddingHorizontal: 12,
        alignItems: 'center',
    },
    footerText: {
        fontSize: 12,
        color: '#999',
    },
});

export default BusinessCardBubble;
