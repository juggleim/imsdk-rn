import React, { useState } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import {
  launchImageLibrary,
  launchCamera,
  MediaType,
} from 'react-native-image-picker';
// import DocumentPicker from 'react-native-document-picker';
import { check, request, PERMISSIONS, RESULTS } from 'react-native-permissions';

interface MessageComposerProps {
  onSend: (text: string) => void;
  onSendImage?: (file: { uri: string; type: string; name: string }) => void;
  onSendVoice?: (file: { uri: string; duration: number }) => void;
  onSendFile?: (file: {
    uri: string;
    type: string;
    name: string;
    size: number;
  }) => void;
  onAttachmentPress?: () => void;
  onCameraPress?: () => void;
  onVoicePress?: () => void;
}

const MessageComposer: React.FC<MessageComposerProps> = ({
  onSend,
  onSendImage,
  onSendVoice,
  onSendFile,
  onAttachmentPress,
  onCameraPress,
  onVoicePress,
}) => {
  const [text, setText] = useState('');

  const handleSend = () => {
    if (text.trim()) {
      onSend(text);
      setText('');
    }
  };

  const handleImageSelection = async () => {
    const result = await launchImageLibrary({
      mediaType: 'photo',
      selectionLimit: 1,
    });

    if (result.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      if (asset.uri && onSendImage) {
        onSendImage({
          uri: asset.uri,
          type: asset.type || 'image/jpeg',
          name: asset.fileName || 'image.jpg',
        });
      }
    }
  };

  const handleCamera = async () => {
    const result = await launchCamera({
      mediaType: 'photo',
      saveToPhotos: true,
    });

    if (result.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      if (asset.uri && onSendImage) {
        onSendImage({
          uri: asset.uri,
          type: asset.type || 'image/jpeg',
          name: asset.fileName || 'photo.jpg',
        });
      }
    }
  };

  const handleFileSelection = async () => {
    // try {
    //   const res = await DocumentPicker.pickSingle({
    //     type: [DocumentPicker.types.allFiles],
    //   });
    //   if (onSendFile) {
    //     onSendFile({
    //       uri: res.uri,
    //       type: res.type || 'application/octet-stream',
    //       name: res.name || 'file',
    //       size: res.size || 0,
    //     });
    //   }
    // } catch (err) {
    //   if (DocumentPicker.isCancel(err)) {
    //     // User cancelled the picker, exit any dialogs or menus and move on
    //   } else {
    //     throw err;
    //   }
    // }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      style={styles.container}>
      <View style={styles.composer}>
        <TouchableOpacity
          onPress={handleFileSelection}
          style={styles.iconButton}>
          <Image
            source={require('../assets/icons/attachment.png')}
            style={styles.icon}
          />
        </TouchableOpacity>

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={text}
            onChangeText={setText}
            placeholder="Type a message..."
            placeholderTextColor="#999"
            multiline
          />
        </View>

        {text.trim().length > 0 ? (
          <TouchableOpacity onPress={handleSend} style={styles.sendButton}>
            <Image
              source={require('../assets/icons/send_message.png')}
              style={styles.sendIcon}
            />
          </TouchableOpacity>
        ) : (
          <>
            <TouchableOpacity onPress={handleCamera} style={styles.iconButton}>
              <Image
                source={require('../assets/icons/camera.png')}
                style={[styles.icon, { tintColor: '#FF9500' }]}
              />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleImageSelection}
              style={styles.iconButton}>
              <Image
                source={require('../assets/icons/image.png')}
                style={styles.icon}
              />
            </TouchableOpacity>
            <TouchableOpacity onPress={onVoicePress} style={styles.iconButton}>
              <Image
                source={require('../assets/icons/microphone.png')}
                style={styles.icon}
              />
            </TouchableOpacity>
          </>
        )}
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
  },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
    backgroundColor: '#fff',
  },
  iconButton: {
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    width: 24,
    height: 24,
    tintColor: '#3399ff',
  },
  inputContainer: {
    flex: 1,
    backgroundColor: '#f2f2f2',
    borderRadius: 20,
    paddingHorizontal: 12,
    marginHorizontal: 8,
    minHeight: 40,
    justifyContent: 'center',
    marginBottom: 4,
  },
  input: {
    fontSize: 16,
    color: '#141414',
    maxHeight: 100,
    paddingVertical: 8,
  },
  sendButton: {
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendIcon: {
    width: 24,
    height: 24,
    tintColor: '#3399ff',
  },
});

export default MessageComposer;
