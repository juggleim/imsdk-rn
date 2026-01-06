import React from 'react';
import { Text, StyleSheet, Image, TouchableOpacity, Platform } from 'react-native';
import { useSound } from 'react-native-nitro-sound';

interface VoiceMessageBubbleProps {
    voiceUrl: string;
    duration: number;
    timestamp: number;
    isOutgoing: boolean;
    isPlaying: boolean;
    onPress: () => void;
    progress?: number;
}

const VoiceMessageBubble: React.FC<VoiceMessageBubbleProps> = ({
    voiceUrl,
    duration,
    timestamp,
    isOutgoing,
    isPlaying,
    onPress,
    progress,
}) => {
    const sound: any = useSound(voiceUrl as any);
    // console.log('VoiceMessageBubble: voiceUrl', voiceUrl, sound);

    const onVoicePress = () => {
        if (sound && voiceUrl && !sound.state.isPlaying) {
            console.log('onVoicePress VoiceMessageBubble: playing sound', sound);
            sound.startPlayer(voiceUrl);
        }
    }

    return (
        <TouchableOpacity
            style={styles.voiceContainer}
            onPress={onVoicePress}
            activeOpacity={0.7}
        >
            <Image
                source={require('../assets/icons/microphone.png')}
                style={[
                    styles.voiceIcon,
                    isOutgoing
                        ? styles.outgoingVoiceIcon
                        : styles.incomingVoiceIcon,
                    isPlaying && styles.voiceIconPlaying,
                ]}
            />
            <Text
                style={[
                    styles.text,
                    isOutgoing ? styles.outgoingText : styles.incomingText,
                ]}>
                {progress && progress > 0 && progress < 100 ? `${Math.round(progress)}%` : `${duration}s`}
            </Text>
            <Text
                style={[
                    styles.timestamp,
                    isOutgoing
                        ? styles.outgoingTimestamp
                        : styles.incomingTimestamp,
                ]}>
                {new Date(timestamp).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                })}
            </Text>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    voiceContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        minWidth: 200,
        height: 36,
    },
    voiceIcon: {
        width: 20,
        height: 20,
        marginRight: 8,
    },
    voiceIconPlaying: {
        opacity: 0.6,
    },
    outgoingVoiceIcon: {
        tintColor: '#fff',
    },
    incomingVoiceIcon: {
        tintColor: '#141414',
    },
    text: {
        fontSize: Platform.OS === 'android' ? 15 : 16,
        lineHeight: Platform.OS === 'android' ? 20 : 22,
        flexShrink: 1,
    },
    outgoingText: {
        color: '#fff',
    },
    incomingText: {
        color: '#141414',
    },
    timestamp: {
        fontSize: Platform.OS === 'android' ? 9 : 10,
        marginLeft: 4,
        alignSelf: 'flex-end',
        flexShrink: 0,
    },
    outgoingTimestamp: {
        color: 'rgba(255,255,255,0.7)',
    },
    incomingTimestamp: {
        color: 'rgba(0,0,0,0.4)',
    },
});

export default VoiceMessageBubble;
