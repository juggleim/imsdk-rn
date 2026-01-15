import React, { useRef, useEffect } from 'react';
import { Text, StyleSheet, Image, TouchableOpacity, Platform, View, Dimensions } from 'react-native';
import { useSound } from 'react-native-nitro-sound';
import { Message, VoiceMessageContent } from 'juggleim-rnsdk';
import { BaseMessageRenderer } from '../BaseMessageRenderer';
import { MessageRendererProps, MessageRenderMode } from '../types';

let currentPlayingVoiceId: string | null = null;
let currentSound: any = null;

export class VoiceMessageRenderer extends BaseMessageRenderer {
  readonly contentType = 'jg:voice';
  readonly renderMode = MessageRenderMode.BUBBLE;
  readonly priority = 25;

  renderContent: React.FC<MessageRendererProps> = ({ context }) => {
    const { message, isOutgoing, messageStatus } = context;
    const voiceContent = message.content as VoiceMessageContent;
    const voiceUrl = voiceContent.url || voiceContent.localPath;
    const isPlaying = currentPlayingVoiceId === message.messageId;

    const duration = voiceContent.duration || 1;
    
    // Dynamic width calculation
    const minWidth = 70;
    const maxWidth = 220;
    const calculatedWidth = Math.min(maxWidth, minWidth + (duration / 60) * (maxWidth - minWidth));

    const sound: any = useSound(voiceUrl as any);

    useEffect(() => {
      return () => {
        if (currentPlayingVoiceId === message.messageId) {
          currentPlayingVoiceId = null;
          currentSound = null;
        }
      };
    }, [message.messageId]);

    const onVoicePress = () => {
      if (!voiceUrl) {
        return;
      }
      if (currentPlayingVoiceId === message.messageId && currentSound?.state?.isPlaying) {
        currentSound.stopPlayer();
        currentPlayingVoiceId = null;
        currentSound = null;
        return;
      }
      if (currentSound?.state?.isPlaying) {
        currentSound.stopPlayer();
      }
      if (sound && !sound.state.isPlaying) {
        currentPlayingVoiceId = message.messageId;
        currentSound = sound;
        sound.startPlayer(voiceUrl);
      }
    };

    return (
      <TouchableOpacity 
        style={[styles.voiceContainer, { width: calculatedWidth }]} 
        onPress={onVoicePress} 
        activeOpacity={0.7}
      >
        <View style={[styles.innerContent, isOutgoing ? styles.rowReverse : styles.row]}>
            <Image
              source={require('../../assets/icons/microphone.png')}
              style={[
                  styles.voiceIcon, 
                  isOutgoing ? styles.outgoingVoiceIcon : styles.incomingVoiceIcon, 
                  isPlaying && styles.voiceIconPlaying,
                  { transform: [{ rotate: isOutgoing ? '180deg' : '0deg' }] } // Optional: rotate icon for outgoing
              ]}
            />
            <Text style={[styles.durationText, isOutgoing ? styles.outgoingText : styles.incomingText]}>
              {duration}''
            </Text>
        </View>

         {/* Timestamp in corner */}
         <View style={styles.timestampContainer}>
             <Text style={[styles.timestamp, isOutgoing ? styles.outgoingTimestamp : styles.incomingTimestamp]}>
                {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
             </Text>
         </View>
      </TouchableOpacity>
    );
  };

  estimateHeight(message: Message): number {
    return 44;
  }
}

const styles = StyleSheet.create({
  voiceContainer: {
    minHeight: 24,
    justifyContent: 'center',
  },
  innerContent: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
  },
  row: {
      flexDirection: 'row',
  },
  rowReverse: {
      flexDirection: 'row-reverse',
  },
  voiceIcon: {
    width: 20,
    height: 20,
    marginHorizontal: 4,
  },
  voiceIconPlaying: {
    opacity: 0.5,
  },
  outgoingVoiceIcon: {
    tintColor: '#000',
  },
  incomingVoiceIcon: {
    tintColor: '#000',
  },
  durationText: {
    fontSize: 16,
    marginHorizontal: 4,
  },
  outgoingText: {
    color: '#000',
  },
  incomingText: {
    color: '#000',
  },
  timestampContainer: {
     position: 'absolute',
     bottom: -8,
     right: 0,
     display: 'none', // Hide for now in voice as it clutters, or show small
  },
  timestamp: {
      fontSize: 10,
  },
  outgoingTimestamp: {
    color: 'rgba(0,0,0,0.3)',
  },
  incomingTimestamp: {
    color: 'rgba(0,0,0,0.3)',
  },
});
