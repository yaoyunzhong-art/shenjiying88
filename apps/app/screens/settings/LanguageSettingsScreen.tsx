/**
 * 语言设置屏幕
 * Language Settings Screen
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { i18nService, SUPPORTED_LANGUAGES } from '../../services/I18n';

export function LanguageSettingsScreen() {
  const [currentLocale, setCurrentLocale] = useState(i18nService.getCurrentLocale());

  const handleLanguageSelect = (locale: string) => {
    Alert.alert(
      '切换语言',
      `确定要切换到 ${SUPPORTED_LANGUAGES.find((l) => l.code === locale)?.nativeName} 吗？`,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '确定',
          onPress: () => {
            i18nService.setLocale(locale);
            setCurrentLocale(locale);
            Alert.alert('成功', '语言已切换，部分页面需要重启应用生效');
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>语言设置</Text>
        <Text style={styles.headerSubtitle}>选择您的偏好语言</Text>
      </View>

      {/* Current Language */}
      <View style={styles.currentCard}>
        <Text style={styles.currentLabel}>当前语言</Text>
        <View style={styles.currentLanguage}>
          <Text style={styles.currentFlag}>
            {SUPPORTED_LANGUAGES.find((l) => l.code === currentLocale)?.flag}
          </Text>
          <View style={styles.currentInfo}>
            <Text style={styles.currentName}>
              {SUPPORTED_LANGUAGES.find((l) => l.code === currentLocale)?.name}
            </Text>
            <Text style={styles.currentNative}>
              {SUPPORTED_LANGUAGES.find((l) => l.code === currentLocale)?.nativeName}
            </Text>
          </View>
        </View>
      </View>

      {/* Language List */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>选择语言</Text>
        <ScrollView style={styles.languageList}>
          {SUPPORTED_LANGUAGES.map((language) => (
            <TouchableOpacity
              key={language.code}
              style={[
                styles.languageItem,
                currentLocale === language.code && styles.languageItemActive,
              ]}
              onPress={() => handleLanguageSelect(language.code)}
            >
              <View style={styles.languageInfo}>
                <Text style={styles.languageFlag}>{language.flag}</Text>
                <View style={styles.languageText}>
                  <Text style={styles.languageName}>{language.name}</Text>
                  <Text style={styles.languageNative}>{language.nativeName}</Text>
                </View>
              </View>
              {currentLocale === language.code && (
                <View style={styles.checkmark}>
                  <Text style={styles.checkmarkText}>✓</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Info */}
      <View style={styles.infoSection}>
        <Text style={styles.infoIcon}>ℹ️</Text>
        <Text style={styles.infoText}>
          切换语言后，应用内的大部分文字将立即更新。部分页面可能需要重启应用才能完全应用新语言设置。
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    backgroundColor: '#059669',
    padding: 20,
    paddingTop: 60,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6EE7B7',
    marginTop: 4,
  },
  currentCard: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  currentLabel: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 12,
  },
  currentLanguage: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  currentFlag: {
    fontSize: 40,
    marginRight: 16,
  },
  currentInfo: {
    flex: 1,
  },
  currentName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1E293B',
  },
  currentNative: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 2,
  },
  section: {
    marginHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 12,
  },
  languageList: {
    maxHeight: 300,
  },
  languageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  languageItemActive: {
    borderColor: '#059669',
    backgroundColor: '#D1FAE5',
  },
  languageInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  languageFlag: {
    fontSize: 32,
    marginRight: 14,
  },
  languageText: {},
  languageName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
  },
  languageNative: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  checkmark: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#059669',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmarkText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  infoSection: {
    flexDirection: 'row',
    backgroundColor: '#EEF2FF',
    marginHorizontal: 16,
    marginTop: 20,
    padding: 14,
    borderRadius: 12,
    alignItems: 'flex-start',
  },
  infoIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#64748B',
    lineHeight: 20,
  },
});
