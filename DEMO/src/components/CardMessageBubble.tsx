import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Linking,
} from 'react-native';

interface CardMessageBubbleProps {
    message: any;
    isSender: boolean;
}

const CardMessageBubble: React.FC<CardMessageBubbleProps> = ({
    message,
    isSender,
}) => {
    const { title, description, url } = message.content;

    const handleUrlPress = () => {
        if (url && url.trim()) {
            Linking.openURL(url).catch(err =>
                console.error('Failed to open URL:', err)
            );
        }
    };

    return (
        <View
            style={[
                styles.container,
                isSender ? styles.senderContainer : styles.receiverContainer,
            ]}>
            <View
                style={[
                    styles.card,
                    isSender ? styles.senderCard : styles.receiverCard,
                ]}>
                <View style={styles.cardHeader}>
                    <Text style={isSender ? styles.sendCardType : styles.receiverCardType}>卡片消息</Text>
                </View>

                <Text
                    style={[
                        styles.title,
                        isSender ? styles.senderTitle : styles.receiverTitle,
                    ]}>
                    {title}
                </Text>

                {description ? (
                    <Text
                        style={[
                            styles.description,
                            isSender ? styles.senderDescription : styles.receiverDescription,
                        ]}>
                        {description}
                    </Text>
                ) : null}

                {url ? (
                    <TouchableOpacity
                        onPress={handleUrlPress}
                        style={styles.urlContainer}
                        activeOpacity={0.7}>
                        <Text
                            style={[
                                styles.url,
                                isSender ? styles.senderUrl : styles.receiverUrl,
                            ]}
                            numberOfLines={1}>
                            🔗 {url}
                        </Text>
                    </TouchableOpacity>
                ) : null}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginVertical: 4,
        paddingHorizontal: 12,
    },
    senderContainer: {
        alignItems: 'flex-end',
    },
    receiverContainer: {
        alignItems: 'flex-start',
    },
    card: {
        width: '80%',
        minWidth: 200,
        borderRadius: 12,
        padding: 5,
    },
    senderCard: {
        borderBottomRightRadius: 4,
    },
    receiverCard: {
        borderBottomLeftRadius: 4,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
        paddingBottom: 8,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.2)',
    },
    sendCardType: {
        fontSize: 12,
        color: '#fff',
        fontWeight: '500',
    },
    receiverCardType: {
        fontSize: 12,
        color: '#141414',
        fontWeight: '500',
    },
    title: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 6,
    },
    senderTitle: {
        color: '#fff',
    },
    receiverTitle: {
        color: '#141414',
    },
    description: {
        fontSize: 14,
        lineHeight: 20,
        marginBottom: 8,
    },
    senderDescription: {
        color: 'rgba(255, 255, 255, 0.9)',
    },
    receiverDescription: {
        color: '#666',
    },
    urlContainer: {
        marginTop: 4,
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255, 255, 255, 0.2)',
    },
    url: {
        fontSize: 13,
    },
    senderUrl: {
        color: 'rgba(255, 255, 255, 0.95)',
        textDecorationLine: 'underline',
    },
    receiverUrl: {
        color: '#007AFF',
        textDecorationLine: 'underline',
    },
});

export default CardMessageBubble;
