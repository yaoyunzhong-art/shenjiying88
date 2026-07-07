/**
 * 生物识别认证服务
 * Biometric Authentication Service
 */

import * as LocalAuthentication from 'expo-local-authentication';

export type BiometricType = 'fingerprint' | 'facial' | 'iris' | 'none';

export interface BiometricResult {
  success: boolean;
  error?: string;
}

export interface BiometricCapabilities {
  hasHardware: boolean;
  isEnrolled: boolean;
  biometricType: BiometricType;
}

class BiometricService {
  // 检查生物识别能力
  async checkCapabilities(): Promise<BiometricCapabilities> {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();
    
    const supportedTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();
    
    let biometricType: BiometricType = 'none';
    if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
      biometricType = 'facial';
    } else if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
      biometricType = 'fingerprint';
    } else if (supportedTypes.includes(LocalAuthentication.AuthenticationType.IRIS)) {
      biometricType = 'iris';
    }

    return {
      hasHardware,
      isEnrolled,
      biometricType,
    };
  }

  // 获取生物识别类型名称
  getBiometricTypeName(type: BiometricType): string {
    switch (type) {
      case 'facial':
        return '面容 ID';
      case 'fingerprint':
        return '指纹识别';
      case 'iris':
        return '虹膜识别';
      default:
        return '未启用';
    }
  }

  // 执行生物识别认证
  async authenticate(options: {
    promptMessage?: string;
    cancelLabel?: string;
    fallbackLabel?: string;
    disableDeviceFallback?: boolean;
  } = {}): Promise<BiometricResult> {
    const {
      promptMessage = '验证身份',
      cancelLabel = '取消',
      fallbackLabel = '使用密码',
      disableDeviceFallback = true,
    } = options;

    try {
      const capabilities = await this.checkCapabilities();
      
      if (!capabilities.hasHardware) {
        return {
          success: false,
          error: '此设备不支持生物识别',
        };
      }

      if (!capabilities.isEnrolled) {
        return {
          success: false,
          error: '未设置生物识别，请先在设备中启用',
        };
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage,
        cancelLabel,
        fallbackLabel,
        disableDeviceFallback,
      });

      if (result.success) {
        return { success: true };
      }

      switch (result.error) {
        case 'user_cancel':
          return { success: false, error: '用户取消' };
        case 'user_fallback':
          return { success: false, error: '用户选择密码' };
        case 'system_cancel':
          return { success: false, error: '系统取消' };
        case 'lockout':
          return { success: false, error: '生物识别已锁定，请使用密码' };
        case 'lockout_permanent':
          return { success: false, error: '生物识别已永久禁用' };
        case 'not_enrolled':
          return { success: false, error: '未设置生物识别' };
        default:
          return { success: false, error: result.error || '认证失败' };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '认证出错',
      };
    }
  }

  // 快速验证（无提示）
  async quickVerify(): Promise<BiometricResult> {
    return this.authenticate({
      promptMessage: '快速验证',
      cancelLabel: '取消',
      disableDeviceFallback: true,
    });
  }

  // 支付验证（高安全）
  async paymentVerify(amount: number): Promise<BiometricResult> {
    return this.authenticate({
      promptMessage: `确认支付 ¥${amount.toFixed(2)}`,
      cancelLabel: '取消',
      fallbackLabel: '使用其他方式',
      disableDeviceFallback: false,
    });
  }
}

export const biometricService = new BiometricService();
