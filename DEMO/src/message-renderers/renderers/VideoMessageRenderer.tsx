import React from 'react';
import { View, StyleSheet, Image, Text, Platform, Dimensions } from 'react-native';
import { Message } from 'juggleim-rnsdk';
import { BaseMessageRenderer } from '../BaseMessageRenderer';
import { MessageRendererProps, MessageRenderMode } from '../types';

interface VideoMessageContent {
  localPath?: string;
  url?: string;
  thumbnailUrl?: string;
  thumbnailLocalPath?: string;
  duration?: number;
  width?: number;
  height?: number;
}

export class VideoMessageRenderer extends BaseMessageRenderer {
  readonly contentType = 'jg:video';
  readonly renderMode = MessageRenderMode.BUBBLE;
  readonly priority = 22;

  renderContent: React.FC<MessageRendererProps> = ({ context }) => {
    const { message } = context;
    const videoContent = message.content as any as VideoMessageContent;

    let uri =
      videoContent.thumbnailLocalPath ||
      videoContent.thumbnailUrl ||
      videoContent.localPath ||
      videoContent.url;
    if (uri && !uri.startsWith('http')) {
      uri = Platform.OS === 'android' ? 'file://' + uri : uri;
    }

    const duration = videoContent.duration || 0;
    const minutes = Math.floor(duration / 60);
    const seconds = Math.floor(duration % 60);
    const durationText = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    
    // Adaptive Sizing
    const originalWidth = videoContent.width || 300;
    const originalHeight = videoContent.height || 300;
    const maxWidth = Dimensions.get('window').width * 0.55;
    const maxHeight = 300;
    
    const aspectRatio = originalWidth / originalHeight;
    let displayWidth, displayHeight;
    
    if (aspectRatio > 1) {
       displayWidth = Math.min(originalWidth, maxWidth);
       displayHeight = displayWidth / aspectRatio;
    } else {
       displayHeight = Math.min(originalHeight, maxHeight);
       displayWidth = displayHeight * aspectRatio;
    }
    displayWidth = Math.max(displayWidth, 120); // Min width

    return (
      <View style={[styles.videoContainer, { width: displayWidth, height: displayHeight }]}>
        <Image source={{ uri }} style={styles.thumbnail} resizeMode="cover" />
        <View style={styles.playButtonOverlay}>
          <View style={styles.playButton}>
            <View style={styles.playTriangle} />
          </View>
        </View>
        
        {/* Info Overlay: Duration + Timestamp */}
         <View style={styles.infoOverlay}>
            <Text style={styles.infoText}>{durationText}</Text>
            <Text style={[styles.infoText, { marginLeft: 8, opacity: 0.8 }]}>
                {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
            </Text>
         </View>
      </View>
    );
  };

  getBubbleStyle() {
    return {
      padding: 0,
      overflow: 'hidden' as const,
      backgroundColor: 'transparent',
    };
  }

  estimateHeight(message: Message): number {
    return 200;
  }
}

const styles = StyleSheet.create({
  videoContainer: {
    backgroundColor: '#000',
    borderRadius: 6,
    overflow: 'hidden',
    position: 'relative',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
    opacity: 0.9,
  },
  playButtonOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButton: {
    width: 44,
    height: 44,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.8)',
  },
  playTriangle: {
    width: 0,
    height: 0,
    borderTopWidth: 8,
    borderBottomWidth: 8,
    borderLeftWidth: 14,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    borderLeftColor: '#fff',
    marginLeft: 4,
  },
  infoOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    left: 0,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 6,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  infoText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '500',
  },
});
