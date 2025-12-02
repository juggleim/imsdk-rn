import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Conversation, UserInfo } from 'im-rn-sdk';

interface MessageHeaderProps {
    conversation: Conversation;
    title: string;
    subtitle?: string;
    onBack?: () => void;
}

const MessageHeader: React.FC<MessageHeaderProps> = ({ conversation, title, subtitle, onBack }) => {
    const navigation = useNavigation();

    const handleBack = () => {
        if (onBack) {
            onBack();
        } else {
            navigation.goBack();
        }
    };

    return (
        <View style={styles.container}>
            <TouchableOpacity onPress={handleBack} style={styles.backButton}>
                <Image
                    source={require('../assets/icons/back.png')}
                    style={styles.backIcon}
                    resizeMode="contain"
                />
            </TouchableOpacity>

            <View style={styles.titleContainer}>
                <Text style={styles.title} numberOfLines={1}>{title}</Text>
                {subtitle && <Text style={styles.subtitle} numberOfLines={1}>{subtitle}</Text>}
            </View>

            <View style={styles.rightContainer}>
                {/* Placeholder for future actions like Info or Call */}
                <TouchableOpacity style={styles.actionButton}>
                    {/* <Image source={require('../assets/icons/info.png')} style={styles.actionIcon} /> */}
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 10,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.05)',
        height: 56,
    },
    backButton: {
        padding: 4,
        marginRight: 8,
    },
    backIcon: {
        width: 24,
        height: 24,
        tintColor: '#3399ff',
    },
    titleContainer: {
        flex: 1,
        justifyContent: 'center',
    },
    title: {
        fontSize: 18,
        fontWeight: '600',
        color: '#141414',
    },
    subtitle: {
        fontSize: 12,
        color: 'rgba(0,0,0,0.5)',
        marginTop: 2,
    },
    rightContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    actionButton: {
        padding: 8,
    },
    actionIcon: {
        width: 24,
        height: 24,
        tintColor: '#3399ff',
    },
});

export default MessageHeader;
