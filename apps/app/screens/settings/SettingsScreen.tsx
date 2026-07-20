import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Switch,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { buildDomainGovernanceDisplayModel } from '@m5/types';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { useAppContext } from '../../context/AppContext';
import type { SettingsStackParamList } from '../../navigation/AppNavigator';

type SettingsNavProp = NativeStackNavigationProp<SettingsStackParamList>;

export function SettingsScreen() {
  const navigation = useNavigation<SettingsNavProp>();
  const { state, dispatch, logout } = useAppContext();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [offlineMode, setOfflineMode] = React.useState(state.isOfflineMode);
  const [pushNotifications, setPushNotifications] = React.useState(state.pushNotificationsEnabled);
  const [biometric, setBiometric] = React.useState(state.biometricEnabled);
  const domainGovernanceDisplayModel = buildDomainGovernanceDisplayModel(
    state.bootstrap.domainSource,
    state.bootstrap.domainGovernance,
    state.bootstrap.domainGovernanceWorkspaceHref,
  );
  const domainGovernanceSubtitle = [
    domainGovernanceDisplayModel.summaryText,
    domainGovernanceDisplayModel.title,
  ]
    .filter(Boolean)
    .join(' / ');

  const handleOfflineModeChange = (value: boolean) => {
    setOfflineMode(value);
    dispatch({ type: 'SET_OFFLINE_MODE', payload: value });
  };

  const handlePushChange = (value: boolean) => {
    setPushNotifications(value);
    dispatch({ type: 'SET_PUSH_NOTIFICATIONS', payload: value });
  };

  const handleBiometricChange = (value: boolean) => {
    setBiometric(value);
    dispatch({ type: 'SET_BIOMETRIC', payload: value });
  };

  const handleBiometricPress = () => {
    navigation.navigate('BiometricSettings');
  };

  const handleNotificationPress = () => {
    navigation.navigate('NotificationSettings');
  };

  const handleLanguagePress = () => {
    navigation.navigate('LanguageSettings');
  };

  const handleDomainGovernancePress = () => {
    Alert.alert(domainGovernanceDisplayModel.eyebrow, domainGovernanceDisplayModel.workspaceHref);
  };

  const handleClearCache = () => {
    Alert.alert(
      '提示',
      '确定要清除缓存吗？',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '确定',
          onPress: () => {
            Alert.alert('提示', '缓存已清除');
          },
        },
      ]
    );
  };

  const handleCheckUpdate = () => {
    Alert.alert('提示', '当前已是最新版本');
  };

  const handleAbout = () => {
    Alert.alert(
      '关于',
      '神机营 APP\n版本: 1.0.0\n构建: 2026.07.04'
    );
  };

  const handleLogout = () => {
    Alert.alert('提示', '确定要退出登录吗？', [
      { text: '取消', style: 'cancel' },
      {
        text: '确定',
        style: 'destructive',
        onPress: () => {
          logout();
          Alert.alert('提示', '已退出登录');
        },
      },
    ]);
  };

  const renderSettingItem = (
    icon: string,
    title: string,
    subtitle?: string,
    rightElement?: React.ReactNode,
    onPress?: () => void
  ) => (
    <TouchableOpacity
      style={styles.settingItem}
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <View style={styles.settingLeft}>
        <Text style={styles.settingIcon}>{icon}</Text>
        <View style={styles.settingText}>
          <Text style={styles.settingTitle}>{title}</Text>
          {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
        </View>
      </View>
      {rightElement}
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.permissionText}>加载中...</Text>
      </View>
    );
  }
  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.permissionText}>数据获取失败: {error}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>网络与同步</Text>
        <Card style={styles.settingsCard}>
          {renderSettingItem(
            '📡',
            '离线模式',
            '在无网络环境下继续使用部分功能',
            <Switch
              value={offlineMode}
              onValueChange={handleOfflineModeChange}
              trackColor={{ false: '#E0E0E0', true: '#34C759' }}
            />
          )}
        </Card>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>通知与安全</Text>
        <Card style={styles.settingsCard}>
          {renderSettingItem(
            '🔔',
            '推送通知',
            '接收订单、优惠等通知',
            <Switch
              value={pushNotifications}
              onValueChange={handlePushChange}
              trackColor={{ false: '#E0E0E0', true: '#34C759' }}
            />
          )}
          <View style={styles.divider} />
          {renderSettingItem(
            '🔐',
            '生物识别',
            '使用 Face ID 或指纹解锁',
            <Text style={styles.settingArrow}>›</Text>,
            handleBiometricPress
          )}
          <View style={styles.divider} />
          {renderSettingItem(
            '🔔',
            '通知设置',
            '管理推送通知偏好',
            <Text style={styles.settingArrow}>›</Text>,
            handleNotificationPress
          )}
          <View style={styles.divider} />
          {renderSettingItem(
            '🌐',
            '语言',
            '简体中文',
            <Text style={styles.settingArrow}>›</Text>,
            handleLanguagePress
          )}
          <View style={styles.divider} />
          {renderSettingItem(
            '🌍',
            domainGovernanceDisplayModel.eyebrow,
            domainGovernanceSubtitle,
            <Text style={styles.settingArrow}>›</Text>,
            handleDomainGovernancePress
          )}
        </Card>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>通用设置</Text>
        <Card style={styles.settingsCard}>
          {renderSettingItem(
            '🛠️',
            '工具注册管理',
            'AI 工具注册与运行状态',
            <Text style={styles.settingArrow}>›</Text>,
            () => navigation.navigate('ToolRegistry', undefined)
          )}
          <View style={styles.divider} />
          {renderSettingItem(
            '🗑️',
            '清除缓存',
            '释放存储空间',
            <Text style={styles.settingArrow}>›</Text>,
            handleClearCache
          )}
          <View style={styles.divider} />
          {renderSettingItem(
            '🔄',
            '检查更新',
            '当前版本 1.0.0',
            <Text style={styles.settingArrow}>›</Text>,
            handleCheckUpdate
          )}
          <View style={styles.divider} />
          {renderSettingItem(
            'ℹ️',
            '关于',
            '应用信息与版本',
            <Text style={styles.settingArrow}>›</Text>,
            handleAbout
          )}
        </Card>
      </View>

      <View style={styles.section}>
        <Card style={styles.settingsCard}>
          {renderSettingItem(
            '📜',
            '用户协议',
            undefined,
            <Text style={styles.settingArrow}>›</Text>,
            () => Alert.alert('提示', '用户协议')
          )}
          <View style={styles.divider} />
          {renderSettingItem(
            '🔒',
            '隐私政策',
            undefined,
            <Text style={styles.settingArrow}>›</Text>,
            () => Alert.alert('提示', '隐私政策')
          )}
        </Card>
      </View>

      <View style={styles.section}>
        <Button
          title="退出登录"
          onPress={handleLogout}
          variant="outline"
          style={styles.logoutButton}
          textStyle={styles.logoutButtonText}
        />
      </View>

      <View style={styles.bottomPadding} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#999999',
    marginBottom: 8,
    marginLeft: 4,
    textTransform: 'uppercase',
  },
  settingsCard: {
    padding: 0,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  settingText: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 15,
    color: '#333333',
  },
  settingSubtitle: {
    fontSize: 12,
    color: '#999999',
    marginTop: 2,
  },
  settingArrow: {
    fontSize: 20,
    color: '#CCCCCC',
  },
  divider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginLeft: 48,
  },
  logoutButton: {
    borderColor: '#FF3B30',
  },
  logoutButtonText: {
    color: '#FF3B30',
  },
  bottomPadding: {
    height: 100,
  },
  permissionText: {
    color: '#333333',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 100,
  },
});
