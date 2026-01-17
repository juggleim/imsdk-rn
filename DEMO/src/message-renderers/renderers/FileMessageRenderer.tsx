import React from 'react';
import { View, Text, StyleSheet, Image, Platform, Dimensions } from 'react-native';
import { Message, FileMessageContent } from 'juggleim-rnsdk';
import { BaseMessageRenderer } from '../BaseMessageRenderer';
import { MessageRendererProps, MessageRenderMode } from '../types';

export class FileMessageRenderer extends BaseMessageRenderer {
  readonly contentType = 'jg:file';
  readonly renderMode = MessageRenderMode.BUBBLE;
  readonly priority = 30;

  renderContent: React.FC<MessageRendererProps> = ({ context }) => {
    const { message, isOutgoing } = context;
    const fileContent = message.content as FileMessageContent;

    const formatFileSize = (bytes: number) => {
      if (bytes < 1024) return bytes + ' B';
      if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
      return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };

    return (
      <View style={styles.fileContainer}>
        <View style={styles.contentRow}>
            <View style={styles.infoCol}>
                <Text style={styles.fileName} numberOfLines={2}>
                    {fileContent.name}
                </Text>
                <Text style={styles.fileSize}>
                    {formatFileSize(fileContent.size)}
                </Text>
            </View>
            <Image
            source={require('../../assets/icons/file.png')}
            style={styles.fileIcon}
            />
        </View>
        
        <View style={styles.footer}>
             <Text style={styles.timestamp}>
                {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
             </Text>
        </View>
      </View>
    );
  };
    
    // Override bubble style for files to always be white
    getBubbleStyle() {
        return {
            backgroundColor: '#ffffff',
            borderWidth: 1,
            borderColor: 'rgba(0,0,0,0.05)',
            padding: 12,
            borderRadius: 8,
        }
    }

  estimateHeight(message: Message): number {
    return 90;
  }
}

const styles = StyleSheet.create({
  fileContainer: {
    width: 240,
  },
  contentRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
  },
  infoCol: {
      flex: 1,
      marginRight: 12,
      minWidth: 0,
  },
  fileName: {
    fontSize: 15,
    fontWeight: '500',
    color: '#333',
    lineHeight: 20,
    marginBottom: 4,
    overflow: 'hidden',
    ellipsizeMode: 'tail',
  },
  fileSize: {
      fontSize: 12,
      color: '#999',
  },
  fileIcon: {
    width: 48,
    height: 48,
    tintColor: '#555', // Or specific file type color
  },
  footer: {
      marginTop: 8,
      flexDirection: 'row',
      justifyContent: 'flex-end',
      borderTopWidth: 1,
      borderTopColor: '#f5f5f5',
      paddingTop: 4,
  },
  timestamp: {
      fontSize: 10,
      color: '#ccc',
  }
});
