import React from 'react';
import { View, StyleSheet, Text, TouchableOpacity, ScrollView, ActivityIndicator, Modal } from 'react-native';
import { AVAILABLE_LANGUAGES, LANGUAGE_NAMES, type SupportedLanguage } from '../i18n';
import { getCurrentLanguage, changeLanguage, initLanguage } from '../i18n/config';
import { useFocusEffect } from '@react-navigation/core';

interface LanguageSelectorProps {
  visible: boolean;
  onClose: () => void;
  onLanguageChanged: (language: SupportedLanguage) => void;
}

const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  visible,
  onClose,
  onLanguageChanged,
}) => {
  const [currentLanguage, setCurrentLanguage] = React.useState<SupportedLanguage>('zh');
  const [isLoading, setIsLoading] = React.useState(false);

  // 获取当前语言
  useFocusEffect(
    React.useCallback(() => {
      setCurrentLanguage(getCurrentLanguage());
    }, [visible])
  );

  const handleLanguageSelect = async (language: SupportedLanguage) => {
    setIsLoading(true);
    try {
      await changeLanguage(language);
      setCurrentLanguage(language);
      onLanguageChanged(language);
      onClose();
    } catch (error) {
      console.error('Failed to change language:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>{LANGUAGE_NAMES[currentLanguage]}</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
          </View>

          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#007AFF" />
              <Text style={styles.loadingText}>切换语言中...</Text>
            </View>
          ) : (
            <ScrollView showsVerticalScrollIndicator={false}>
              {AVAILABLE_LANGUAGES.map((language) => (
                <TouchableOpacity
                  key={language.code}
                  style={[
                    styles.languageItem,
                    currentLanguage === language.code && styles.languageItemActive,
                  ]}
                  onPress={() => handleLanguageSelect(language.code)}
                >
                  <Text
                    style={[
                      styles.languageName,
                      currentLanguage === language.code && styles.languageNameActive,
                    ]}
                  >
                    {language.nativeName}
                  </Text>
                  <Text style={styles.languageEnglishName}>
                    {language.name}
                  </Text>
                </TouchableOpacity>
              ))}
              <View style={styles.noticeContainer}>
                <Text style={styles.noticeText}>
                  {LANGUAGE_NAMES[currentLanguage]}将重启后生效
                </Text>
              </View>
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
    padding: 20,
  },
  container: {
    backgroundColor: '#fff',
    borderRadius: 16,
    maxHeight: '80%',
    width: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  closeButton: {
    fontSize: 20,
    color: '#007AFF',
    padding: 4,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  languageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  languageItemActive: {
    backgroundColor: '#F0F9FF',
  },
  languageName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
    flex: 1,
  },
  languageNameActive: {
    color: '#007AFF',
  },
  languageEnglishName: {
    fontSize: 14,
    color: '#666',
  },
  noticeContainer: {
    padding: 16,
    backgroundColor: '#FFF8E1',
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  noticeText: {
    fontSize: 14,
    color: '#007AFF',
    marginTop: 8,
  },
});

export default LanguageSelector;
