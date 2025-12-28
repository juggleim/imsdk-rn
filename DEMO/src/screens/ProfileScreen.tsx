import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  Image,
  Switch,
  Modal,
  TextInput,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { clearToken } from '../utils/auth';
import JuggleIM from 'juggleim-rnsdk';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { launchImageLibrary } from 'react-native-image-picker';
import { getUserInfo, updateUserInfo, updateUserSettings, UserInfo, UserSettings } from '../api/users';

const ProfileScreen = () => {
  const navigation = useNavigation<any>();
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [nicknameModalVisible, setNicknameModalVisible] = useState(false);
  const [newNickname, setNewNickname] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const userId = await AsyncStorage.getItem('user_id');
      if (userId) {
        setLoading(true);
        const info = await getUserInfo(userId);
        console.log('User info:', info);
        setUserInfo(info);
      }
    } catch (e) {
      console.error('Failed to load user info', e);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      JuggleIM.disconnect(false);
      await clearToken();
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
    } catch (e) {
      console.error('Logout failed', e);
      Alert.alert('Error', 'Logout failed');
    }
  };

  const handleUpdateAvatar = async () => {
    const result = await launchImageLibrary({
      mediaType: 'photo',
      selectionLimit: 1,
    });

    if (result.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      const localPath = Platform.OS === 'android' ? asset.uri?.replace('file://', '') : asset.uri;

      if (localPath) {
        setUploading(true);
        try {
          const remoteUrl = await JuggleIM.uploadImage(localPath);
          await updateUserInfo({
            user_id: userInfo!.user_id,
            avatar: remoteUrl,
            nickname: userInfo!.nickname,
          });
          setUserInfo(prev => prev ? { ...prev, avatar: remoteUrl } : null);
          Alert.alert('Success', 'Avatar updated');
        } catch (e) {
          console.error('Avatar update failed', e);
          Alert.alert('Error', 'Failed to update avatar');
        } finally {
          setUploading(false);
        }
      }
    }
  };

  const handleUpdateNickname = async () => {
    if (!newNickname.trim()) return;
    try {
      await updateUserInfo({
        user_id: userInfo!.user_id,
        nickname: newNickname,
        avatar: userInfo!.avatar,
      });
      setUserInfo(prev => prev ? { ...prev, nickname: newNickname } : null);
      setNicknameModalVisible(false);
    } catch (e) {
      console.error('Nickname update failed', e);
      Alert.alert('Error', 'Failed to update nickname');
    }
  };

  const handleUpdateSetting = async (key: keyof UserSettings | 'undisturb.switch', value: any) => {
    if (!userInfo) return;

    let newSettings = { ...userInfo.settings };

    if (key === 'undisturb.switch') {
      newSettings.undisturb = {
        ...newSettings.undisturb,
        switch: value,
      };
    } else {
      newSettings = {
        ...newSettings,
        [key]: value
      };
    }

    // Optimistic update
    setUserInfo(prev => prev ? { ...prev, settings: newSettings } : null);

    try {
      await updateUserSettings(newSettings);
    } catch (e) {
      console.error('Settings update failed', e);
      Alert.alert('Error', 'Failed to update settings');
      // Revert on failure
      loadData();
    }
  };

  const showSelectionActionSheet = (title: string, options: { label: string; value: any }[], onSelect: (val: any) => void) => {
    const buttons: any[] = options.map(opt => ({
      text: opt.label,
      onPress: () => onSelect(opt.value)
    }));
    buttons.push({ text: 'Cancel', onPress: () => { }, style: 'cancel' });
    Alert.alert(title, undefined, buttons);
  };

  const renderSettingItem = (label: string, value: string, onPress: () => void) => (
    <TouchableOpacity style={styles.settingItem} onPress={onPress}>
      <Text style={styles.settingLabel}>{label}</Text>
      <View style={styles.settingValueContainer}>
        <Text style={styles.settingValue}>{value}</Text>
        <Image
          source={require('../assets/icons/rightArrowIcon.png')}
          style={styles.rightArrow}
        />
      </View>
    </TouchableOpacity>
  );

  const getVerifyText = (type: number) => {
    switch (type) {
      case 0: return 'Allowed';
      case 1: return 'Need Verify';
      case 2: return 'Denied';
      default: return 'Unknown';
    }
  };

  if (loading && !userInfo) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Profile Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleUpdateAvatar} disabled={uploading}>
            <View style={styles.avatarContainer}>
              {userInfo?.avatar ? (
                <Image source={{ uri: userInfo.avatar }} style={styles.avatar} />
              ) : (
                <Image source={require('../assets/icons/default_avatar.png')} style={styles.avatar} />
              )}
              {uploading && (
                <View style={styles.avatarOverlay}>
                  <ActivityIndicator color="#fff" />
                </View>
              )}
              {!uploading && (
                <View style={styles.editIconContainer}>
                  <Image source={require('../assets/icons/camera.png')} style={styles.cameraIcon} />
                </View>
              )}
            </View>
          </TouchableOpacity>
          <View style={styles.infoContainer}>
            <TouchableOpacity
              style={styles.nameContainer}
              onPress={() => {
                setNewNickname(userInfo?.nickname || '');
                setNicknameModalVisible(true);
              }}
            >
              <Text style={styles.name}>{userInfo?.nickname || 'Unknown'}</Text>
              <Image source={require('../assets/icons/edit.png')} style={styles.editIcon} />
            </TouchableOpacity>
            <Text style={styles.userId}>ID: {userInfo?.user_id}</Text>
          </View>
        </View>

        {/* Global Undisturb */}
        {userInfo?.settings && (
          <View style={styles.section}>
            <View style={styles.settingItem}>
              <Text style={styles.settingLabel}>Do Not Disturb</Text>
              <Switch
                value={userInfo.settings.undisturb?.switch}
                onValueChange={(val) => handleUpdateSetting('undisturb.switch', val)}
              />
            </View>
          </View>
        )}

        {/* Settings Section */}
        {userInfo?.settings && (
          <View style={styles.section}>
            {renderSettingItem('Language', userInfo.settings.language, () => {
              showSelectionActionSheet('Language', [
                { label: 'English', value: 'en_US' },
                { label: 'Chinese', value: 'zh_CN' }
              ], (val) => handleUpdateSetting('language', val));
            })}

            {renderSettingItem('Friend Verify', getVerifyText(userInfo.settings.friend_verify_type), () => {
              showSelectionActionSheet('Friend Verify', [
                { label: 'Allowed', value: 0 },
                { label: 'Need Verify', value: 1 },
                { label: 'Denied', value: 2 },
              ], (val) => handleUpdateSetting('friend_verify_type', val));
            })}

            {renderSettingItem('Group Verify', getVerifyText(userInfo.settings.grp_verify_type), () => {
              showSelectionActionSheet('Group Verify', [
                { label: 'Allowed', value: 0 },
                { label: 'Need Verify', value: 1 },
                { label: 'Denied', value: 2 },
              ], (val) => handleUpdateSetting('grp_verify_type', val));
            })}
          </View>
        )}

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Edit Nickname Modal */}
      <Modal
        visible={nicknameModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setNicknameModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Nickname</Text>
            <TextInput
              style={styles.input}
              value={newNickname}
              onChangeText={setNewNickname}
              placeholder="Enter new nickname"
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.modalButton} onPress={() => setNicknameModalVisible(false)}>
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, styles.saveButton]} onPress={handleUpdateNickname}>
                <Text style={[styles.modalButtonText, styles.saveButtonText]}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f2f2f7',
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    marginTop: 20,
    marginBottom: 20,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 8,
  },
  avatarPlaceholder: {
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  infoContainer: {
    marginLeft: 16,
    flex: 1,
  },
  name: {
    fontSize: 22,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  userId: {
    fontSize: 14,
    color: '#888',
  },
  section: {
    backgroundColor: '#fff',
    marginBottom: 20,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: '#c6c6c8',
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#c6c6c8',
    backgroundColor: '#fff',
  },
  settingLabel: {
    fontSize: 17,
    color: '#000',
  },
  settingValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingValue: {
    fontSize: 17,
    color: '#888',
    marginRight: 8,
  },
  arrow: {
    fontSize: 17,
    color: '#c7c7cc',
  },
  logoutButton: {
    backgroundColor: '#fff',
    padding: 16,
    alignItems: 'center',
    marginTop: 20,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: '#c6c6c8',
  },
  logoutText: {
    color: '#FF3B30',
    fontSize: 17,
    fontWeight: '600',
  },
  avatarContainer: {
    position: 'relative',
  },
  avatarOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  editIconContainer: {
    position: 'absolute',
    right: -6,
    bottom: -6,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 4,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.20,
    shadowRadius: 1.41,
    elevation: 2,
  },
  cameraIcon: {
    width: 16,
    height: 16,
    tintColor: '#555',
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  editIcon: {
    width: 16,
    height: 16,
    marginLeft: 8,
    tintColor: '#888',
  },
  rightArrow: {
    width: 16,
    height: 16,
    tintColor: '#c7c7cc',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    width: '80%',
    borderRadius: 14,
    padding: 20,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#e5e5e5',
    borderRadius: 8,
    padding: 10,
    marginBottom: 20,
    fontSize: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    padding: 12,
    alignItems: 'center',
  },
  saveButton: {
    borderLeftWidth: 1,
    borderLeftColor: '#e5e5e5',
  },
  modalButtonText: {
    fontSize: 17,
    color: '#007AFF',
  },
  saveButtonText: {
    fontWeight: '600',
  },
});

export default ProfileScreen;
