/**
 * 生物识别设置屏幕
 * Biometric Settings Screen
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { biometricService, type BiometricType } from '../../services/BiometricAuth';

export function BiometricSettingsScreen() {
  const [biometricType, setBiometricType] = useState<BiometricType>('none');
  const [isEnabled, setIsEnabled] = useState(false);
  const [isAvailable, setIsAvailable] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkBiometricStatus();
  }, []);

  const checkBiometricStatus = async () => {
    setIsLoading(true);
    const capabilities = await biometricService.checkCapabilities();
    setBiometricType(capabilities.biometricType);
    setIsAvailable(capabilities.hasHardware && capabilities.isEnrolled);
    setIsEnabled(capabilities.hasHardware && capabilities.isEnrolled);
    setIsLoading(false);
  };

  const handleToggle = async (value: boolean) => {
    if (value) {
      const result = await biometricService.authenticate({
        promptMessage: '验证身份以启用生物识别',
      });
      if (result.success) {
        setIsEnabled(true);
        Alert.alert('成功', `${biometricService.getBiometricTypeName(biometricType)} 已启用`);
      } else if (result.error !== '用户取消') {
        Alert.alert('启用失败', result.error);
      }
    } else {
      setIsEnabled(false);
    }
  };

  const handleTestAuth = async () => {
    const result = await biometricService.quickVerify();
    if (result.success) {
      Alert.alert('验证成功', '身份验证通过');
    } else {
      Alert.alert('验证失败', result.error || '请重试');
    }
  };

  const getBiometricIcon = (): string => {
    switch (biometricType) {
      case 'facial':
        return '👤';
      case 'fingerprint':
        return '👆';
      case 'iris':
        return '👁️';
      default:
        return '🔐';
    }
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>检查生物识别状态...</Text>
        </View>
      </View>
    );
  }

  if (!isAvailable) {
    return (
      <View style={styles.container}>
        <View style={styles.unavailableContainer}>
          <Text style={styles.unavailableIcon}>🔐</Text>
          <Text style={styles.unavailableTitle}>生物识别不可用</Text>
          <Text style={styles.unavailableText}>
            此设备不支持生物识别功能，或未在系统设置中启用。
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>生物识别</Text>
        <Text style={styles.headerSubtitle}>安全认证设置</Text>
      </View>

      {/* Status Card */}
      <View style={styles.statusCard}>
        <View style={styles.statusIconContainer}>
          <Text style={styles.statusIcon}>{getBiometricIcon()}</Text>
        </View>
        <View style={styles.statusInfo}>
          <Text style={styles.statusTitle}>
            {biometricService.getBiometricTypeName(biometricType)}
          </Text>
          <Text style={styles.statusDesc}>
            {isEnabled ? '已启用' : '未启用'}
          </Text>
        </View>
        <Switch
          value={isEnabled}
          onValueChange={handleToggle}
          trackColor={{ false: '#E0E0E0', true: '#81C784' }}
          thumbColor={isEnabled ? '#4CAF50' : '#BDBDBD'}
        />
      </View>

      {/* Info Section */}
      <View style={styles.infoSection}>
        <Text style={styles.infoTitle}>什么是生物识别？</Text>
        <Text style={styles.infoText}>
          生物识别是一种使用您的身体特征（指纹或面容）来验证身份的技术。
          相比传统密码更安全、更便捷。
        </Text>
      </View>

      {/* Usage Scenarios */}
      <View style={styles.scenariosSection}>
        <Text style={styles.scenariosTitle}>使用场景</Text>
        {[
          { icon: '💰', title: '支付验证', desc: '大额支付时快速验证身份' },
          { icon: '🔐', title: '登录验证', desc: '免密码登录APP' },
          { icon: '📋', title: '敏感操作', desc: '查看敏感信息时验证' },
        ].map((scenario, index) => (
          <View key={index} style={styles.scenarioItem}>
            <Text style={styles.scenarioIcon}>{scenario.icon}</Text>
            <View style={styles.scenarioInfo}>
              <Text style={styles.scenarioTitle}>{scenario.title}</Text>
              <Text style={styles.scenarioDesc}>{scenario.desc}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* Test Button */}
      <TouchableOpacity style={styles.testButton} onPress={handleTestAuth}>
        <Text style={styles.testButtonText}>测试生物识别</Text>
      </TouchableOpacity>

      {/* Security Note */}
      <View style={styles.securityNote}>
        <Text style={styles.securityIcon}>🔒</Text>
        <Text style={styles.securityText}>
          您的生物识别数据仅存储在本地设备，不会被上传或共享
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#64748B',
  },
  unavailableContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  unavailableIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  unavailableTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 8,
  },
  unavailableText: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 22,
  },
  header: {
    backgroundColor: '#1E40AF',
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
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
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
  statusIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  statusIcon: {
    fontSize: 28,
  },
  statusInfo: {
    flex: 1,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
  },
  statusDesc: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 2,
  },
  infoSection: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 22,
  },
  scenariosSection: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  scenariosTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 12,
  },
  scenarioItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 12,
    marginBottom: 8,
  },
  scenarioIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  scenarioInfo: {
    flex: 1,
  },
  scenarioTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1E293B',
  },
  scenarioDesc: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  testButton: {
    backgroundColor: '#1E40AF',
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  testButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  securityNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    marginTop: 8,
  },
  securityIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  securityText: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
  },
});
