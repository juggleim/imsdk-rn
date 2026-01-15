import React, { useState, useEffect } from 'react';
import { View, Image, StyleSheet, ActivityIndicator, Text, Dimensions, Platform, TouchableOpacity, Modal, SafeAreaView } from 'react-native';
import { Message, ImageMessageContent } from 'juggleim-rnsdk';
import { BaseMessageRenderer } from '../BaseMessageRenderer';
import { MessageRendererProps, MessageRenderMode } from '../types';

/**
 * 图片消息渲染器
 */
export class ImageMessageRenderer extends BaseMessageRenderer {
  readonly contentType = 'jg:img';
  readonly renderMode = MessageRenderMode.BUBBLE;
  readonly priority = 20;

  renderContent: React.FC<MessageRendererProps> = ({ context }) => {
    const { message, messageStatus } = context;
    const imgContent = message.content as ImageMessageContent;

    // Stable URI generation
    let uri = imgContent.localPath || imgContent.url || '';
    
    // Debug log
    // console.log('ImageMessageRenderer URI:', uri, 'localPath:', imgContent.localPath, 'url:', imgContent.url);

    if (uri && !uri.startsWith('http') && !uri.startsWith('file://')) {
      uri = Platform.OS === 'android' ? 'file://' + uri : uri;
    }
    
    // State for loading, error, and preview
    const [isLoading, setIsLoading] = useState(true);
    const [hasError, setHasError] = useState(false);
    const [isPreviewVisible, setIsPreviewVisible] = useState(false);

    // Reset state when URI changes
    useEffect(() => {
        setIsLoading(true);
        setHasError(false);
    }, [uri]);

    const originalWidth = imgContent.width || 200;
    const originalHeight = imgContent.height || 200;
    
    // Max constraints
    const maxWidth = Dimensions.get('window').width * 0.55;
    const maxHeight = 300;
    const minSize = 100;

    let displayWidth = originalWidth;
    let displayHeight = originalHeight;

    // Aspect Ratio Logic
    const aspectRatio = originalWidth / originalHeight;

    if (aspectRatio > 1) {
        // Wide image
        displayWidth = Math.min(originalWidth, maxWidth);
        displayHeight = displayWidth / aspectRatio;
    } else {
        // Tall image
        displayHeight = Math.min(originalHeight, maxHeight);
        displayWidth = displayHeight * aspectRatio;
    }
    
    // Ensure minimums
    if (displayWidth < minSize) {
        displayWidth = minSize;
        displayHeight = displayWidth / aspectRatio;
    }
    if (displayHeight < minSize) {
        displayHeight = minSize;
        displayWidth = displayHeight * aspectRatio;
    }

    return (
      <>
        <TouchableOpacity 
          activeOpacity={0.9} 
          onPress={() => setIsPreviewVisible(true)}
          style={[styles.imageContainer, { width: displayWidth, height: displayHeight }]}
        >
          
          {/* Placeholder / Error View */}
          {(isLoading || hasError || !uri) && (
              <View style={[styles.placeholder, { width: displayWidth, height: displayHeight }]}>
                   <Image 
                      source={require('../../assets/icons/image.png')} 
                      style={styles.placeholderIcon}
                   />
              </View>
          )}

          {uri ? (
              <Image
              source={{ uri }}
              style={[
                  styles.image, 
                  { width: displayWidth, height: displayHeight },
                  (isLoading || hasError) ? styles.hiddenImage : null
              ]}
              resizeMode="cover"
              onLoadStart={() => setIsLoading(true)}
              onLoadEnd={() => setIsLoading(false)}
              onError={(e) => {
                  console.log('Image Load Error', e.nativeEvent.error, uri);
                  setIsLoading(false);
                  setHasError(true);
              }}
              />
          ) : null}
          
          {/* Timestamp Overlay */}
          <View style={styles.timestampOverlay}>
               <Text style={styles.timestampText}>
                  {new Date(message.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: false
                  })}
               </Text>
          </View>

          {messageStatus && messageStatus.progress > 0 && messageStatus.progress < 100 && (
            <View style={styles.progressOverlay}>
              <View style={styles.progressContainer}>
                <ActivityIndicator size="small" color="#fff" />
                <Text style={styles.progressText}>{Math.round(messageStatus.progress)}%</Text>
              </View>
            </View>
          )}
        </TouchableOpacity>

        {/* Full Screen Preview Modal */}
        <Modal
          visible={isPreviewVisible}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setIsPreviewVisible(false)}
        >
          <View style={styles.modalContainer}>
             <TouchableOpacity 
                style={styles.modalBackground} 
                activeOpacity={1} 
                onPress={() => setIsPreviewVisible(false)}
             >
                <SafeAreaView style={styles.safeArea}>
                    <Image
                        source={{ uri }}
                        style={styles.previewImage}
                        resizeMode="contain"
                    />
                     <TouchableOpacity 
                        style={styles.closeButton}
                        onPress={() => setIsPreviewVisible(false)}
                     >
                        <Text style={styles.closeButtonText}>✕</Text>
                     </TouchableOpacity>
                </SafeAreaView>
             </TouchableOpacity>
          </View>
        </Modal>
      </>
    );
  };

  getBubbleStyle() {
    return {
      padding: 0,
      overflow: 'hidden' as const,
      backgroundColor: '#f0f0f0', // Default bubble bg for images
    };
  }

  estimateHeight(message: Message): number {
    return 200; 
  }
}

const styles = StyleSheet.create({
  imageContainer: {
    backgroundColor: '#e0e0e0', // Placeholder gray
    borderRadius: 6,
    overflow: 'hidden',
    position: 'relative',
  },
  image: {
      position: 'absolute',
      top: 0,
      left: 0,
  },
  hiddenImage: {
      opacity: 0,
  },
  placeholder: {
      backgroundColor: '#e6e6e6',
      justifyContent: 'center',
      alignItems: 'center',
      position: 'absolute',
      top: 0,
      left: 0,
      zIndex: 1,
  },
  placeholderIcon: {
      width: 40,
      height: 40,
      tintColor: '#bfbfbf',
      opacity: 0.5,
  },
  progressOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  progressContainer: {
    alignItems: 'center',
  },
  progressText: {
    color: '#fff',
    fontSize: 12,
    marginTop: 4,
  },
  timestampOverlay: {
      position: 'absolute',
      bottom: 4,
      right: 6,
      backgroundColor: 'rgba(0,0,0,0.3)',
      paddingHorizontal: 4,
      paddingVertical: 1,
      borderRadius: 4,
      zIndex: 3,
  },
  timestampText: {
      color: 'rgba(255,255,255,0.9)',
      fontSize: 10,
      fontWeight: '500',
  },
  // Modal Styles
  modalContainer: {
      flex: 1,
      backgroundColor: 'black',
  },
  modalBackground: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
  },
  safeArea: {
      flex: 1,
      width: '100%',
      justifyContent: 'center',
  },
  previewImage: {
      width: '100%',
      height: '100%',
  },
  closeButton: {
      position: 'absolute',
      top: 50,
      right: 20,
      width: 40,
      height: 40,
      backgroundColor: 'rgba(0,0,0,0.5)',
      borderRadius: 20,
      justifyContent: 'center',
      alignItems: 'center',
  },
  closeButtonText: {
      color: 'white',
      fontSize: 20,
      fontWeight: 'bold',
  }
});
