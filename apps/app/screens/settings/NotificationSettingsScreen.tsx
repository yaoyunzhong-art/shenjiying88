/**
 * 推送通知设置屏幕
 * Push Notification Settings Screen
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { pushNotificationService, type NotificationType } from '../../services/PushNotification';

interface NotificationSetting {
  id: NotificationType;
  title: string;
  description: string;
  enabled: boolean;
  icon: string;
}

export function NotificationSettingsScreen() {
  const [settings, setSettings] = useState<NotificationSetting[]>([
    { id: 'order_created', title: '新订单提醒', description: '当有新订单时接收通知', enabled: true, icon: '📋' },
    { id: 'order_paid', title: '支付成功', description: '订单支付成功后接收通知', enabled: true, icon: '✅' },
    { id: 'order_refunded', title: '退款通知', description: '订单退款时接收通知', enabled: true, icon: '↩️' },
    { id: 'coupon_expiring', title: '优惠券过期', description: '优惠券即将过期前提醒', enabled: true, icon: '🎫' },
    { id: 'member_upgrade', title: '会员升级', description: '会员等级升级时通知', enabled: false, icon: '🎉' },
    { id: 'device_alert', title: '设备告警', description: '设备异常时紧急通知', enabled: true, icon: '🚨' },
    { id: 'handoff_reminder', title: '交接班提醒', description: '交接班时间提醒', enabled: true, icon: '🔄' },
    { id: 'shift_reminder', title: '排班提醒', description: '排班时间提前提醒', enabled: false, icon: '📅' },
  ]);
  const [pushToken, setPushToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadPushToken();
  }, []);

  const loadPushToken = async () => {
    setIsLoading(true);
    const token = await pushNotificationService.getPushToken();
    setPushToken(token);
    setIsLoading(false);
  };

  const handleToggle = async (id: NotificationType, enabled: boolean) => {
    setSettings((prev) =>
      prev.map((setting) =>
        setting.id === id ? { ...setting, enabled } : setting
      )
    );
  };

  const handleTestNotification = async (type: NotificationType) => {
    const setting = settings.find((s) => s.id === type);
    if (!setting) return;

    let result;
    switch (type) {
      case 'order_created':
        result = await pushNotificationService.notifyOrderCreated('TEST-001', 'TEST-ORDER-001');
        break;
      case 'order_paid':
        result = await pushNotificationService.notifyOrderPaid('TEST-001', 'TEST-ORDER-001', 99.99);
        break;
      case 'order_refunded':
        result = await pushNotificationService.notifyOrderRefunded('TEST-001', 'TEST-ORDER-001', 50.00);
        break;
      case 'coupon_expiring':
        result = await pushNotificationService.notifyCouponExpiring('新人专享券', 3);
        break;
      case 'member_upgrade':
        result = await pushNotificationService.notifyMemberUpgrade('黄金会员');
        break;
      case 'device_alert':
        result = await pushNotificationService.notifyDeviceAlert('POS-01', '打印故障');
        break;
      case 'handoff_reminder':
        result = await pushNotificationService.notifyHandoffReminder('城西银泰店', '18:00');
        break;
      case 'shift_reminder':
        result = await pushNotificationService.notifyShiftReminder('城西银泰店', '09:00-18:00');
        break;
    }

    if (result) {
      Alert.alert('发送成功', `测试通知 "${setting.title}" 已发送`);
    } else {
      Alert.alert('发送失败', '请检查通知权限是否开启');
    }
  };

  const handleTestAll = async () => {
    Alert.alert(
      '测试通知',
      '将依次发送所有类型的测试通知',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '发送',
          onPress: async () => {
            for (const setting of settings) {
              if (setting.enabled) {
                await handleTestNotification(setting.id);
                await new Promise((resolve) => setTimeout(resolve, 500));
              }
            }
          },
        },
      ]
    );
  };

  const handleClearBadge = async () => {
    await pushNotificationService.clearBadge();
    Alert.alert('已清除', '通知徽章已清除');
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>通知设置</Text>
        <Text style={styles.headerSubtitle}>管理推送通知偏好</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Push Token Info */}
        <View style={styles.tokenCard}>
          <View style={styles.tokenHeader}>
            <Text style={styles.tokenIcon}>🔔</Text>
            <View style={styles.tokenInfo}>
              <Text style={styles.tokenTitle}>推送通知</Text>
              <Text style={styles.tokenStatus}>
                {pushToken ? '已启用' : '未启用'}
              </Text>
            </View>
          </View>
          {pushToken && (
            <Text style={styles.tokenText} numberOfLines={2}>
              Token: {pushToken.substring(0, 40)}...
            </Text>
          )}
          {!pushToken && (
            <TouchableOpacity style={styles.enableButton} onPress={loadPushToken}>
              <Text style={styles.enableButtonText}>
                {isLoading ? '加载中...' : '启用推送通知'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Notification Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>通知类型</Text>
          {settings.map((setting) => (
            <View key={setting.id} style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <View style={styles.settingHeader}>
                  <Text style={styles.settingIcon}>{setting.icon}</Text>
                  <Text style={styles.settingTitle}>{setting.title}</Text>
                </View>
                <Text style={styles.settingDesc}>{setting.description}</Text>
              </View>
              <View style={styles.settingActions}>
                <Switch
                  value={setting.enabled}
                  onValueChange={(value) => handleToggle(setting.id, value)}
                  trackColor={{ false: '#E0E0E0', true: '#81C784' }}
                  thumbColor={setting.enabled ? '#4CAF50' : '#BDBDBD'}
                />
                <TouchableOpacity
                  style={styles.testButton}
                  onPress={() => handleTestNotification(setting.id)}
                >
                  <Text style={styles.testButtonText}>测试</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>快捷操作</Text>
          <View style={styles.actionGrid}>
            <TouchableOpacity style={styles.actionButton} onPress={handleTestAll}>
              <Text style={styles.actionIcon}>📤</Text>
              <Text style={styles.actionText}>测试全部</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={handleClearBadge}>
              <Text style={styles.actionIcon}>🔢</Text>
              <Text style={styles.actionText}>清除徽标</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={loadPushToken}>
              <Text style={styles.actionIcon}>🔄</Text>
              <Text style={styles.actionText}>刷新Token</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Info */}
        <View style={styles.infoSection}>
          <Text style={styles.infoIcon}>ℹ️</Text>
          <Text style={styles.infoText}>
            通知权限可在手机设置中随时修改。关闭通知不会影响应用的核心功能。
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    backgroundColor: '#0066FF',
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
    color: '#93C5FD',
    marginTop: 4,
  },
  content: {
    flex: 1,
  },
  tokenCard: {
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
  tokenHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tokenIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  tokenInfo: {
    flex: 1,
  },
  tokenTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
  },
  tokenStatus: {
    fontSize: 14,
    color: '#10B981',
    marginTop: 2,
  },
  tokenText: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 12,
    fontFamily: 'monospace',
  },
  enableButton: {
    backgroundColor: '#0066FF',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  enableButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  section: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 12,
  },
  settingItem: {
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 12,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingInfo: {
    flex: 1,
  },
  settingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  settingTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1E293B',
  },
  settingDesc: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
    marginLeft: 26,
  },
  settingActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  testButton: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  testButtonText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  actionGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  actionIcon: {
    fontSize: 24,
    marginBottom: 6,
  },
  actionText: {
    fontSize: 12,
    color: '#64748B',
  },
  infoSection: {
    flexDirection: 'row',
    backgroundColor: '#EEF2FF',
    marginHorizontal: 16,
    marginBottom: 20,
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
