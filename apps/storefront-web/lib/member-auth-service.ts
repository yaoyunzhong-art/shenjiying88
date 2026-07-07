// member-auth-service.ts · C端会员认证服务
// Phase-FP T-FP-020 · 2026-07-02

import { getDefaultApiBaseUrl } from '@m5/sdk';

export interface MemberLoginRequest {
  mobile: string;
  code: string;
}

export interface MemberLoginResponse {
  success: boolean;
  data?: {
    member: MemberInfo;
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  };
  error?: {
    code: string;
    message: string;
  };
}

export interface MemberInfo {
  memberId: string;
  nickname: string;
  mobile: string;
  tier: 'diamond' | 'gold' | 'silver' | 'bronze' | 'basic';
  points: number;
  storeName?: string;
}

/**
 * C端会员认证服务
 * 调用后端 AuthModule API 实现会员登录
 */
export class MemberAuthService {
  private baseUrl: string;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl ?? getDefaultApiBaseUrl();
  }

  private getAuthHeaders(): HeadersInit {
    if (typeof window === 'undefined') {
      return {};
    }
    const token = localStorage.getItem('member_access_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  /**
   * 会员登录 (手机号+短信验证码)
   * POST /auth/login/sms
   */
  async login(request: MemberLoginRequest): Promise<MemberLoginResponse> {
    const { mobile, code } = request;

    try {
      const response = await fetch(`${this.baseUrl}/auth/login/sms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ mobile, code }),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: {
            code: data.code ?? 'AUTH_ERROR',
            message: data.message ?? '登录失败',
          },
        };
      }

      return {
        success: true,
        data: {
          member: data.data.user,
          accessToken: data.data.accessToken,
          refreshToken: data.data.refreshToken,
          expiresIn: data.data.expiresIn,
        },
      };
    } catch (error) {
      console.error('Member login error:', error);
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: '网络错误，请稍后重试',
        },
      };
    }
  }

  /**
   * 发送短信验证码 (Mock)
   * 实际应调用短信服务API
   */
  async sendSmsCode(mobile: string): Promise<{ success: boolean; error?: any }> {
    // TODO: 调用后端短信API
    // 当前返回成功，用于开发测试
    return { success: true };
  }

  /**
   * 获取当前会员信息
   * GET /auth/me
   */
  async getCurrentMember(): Promise<{ success: boolean; data?: MemberInfo; error?: any }> {
    const token = localStorage.getItem('member_access_token');
    if (!token) {
      return {
        success: false,
        error: {
          code: 'NOT_LOGGED_IN',
          message: '请先登录',
        },
      };
    }

    try {
      const response = await fetch(`${this.baseUrl}/auth/me`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: {
            code: data.code ?? 'AUTH_ERROR',
            message: data.message ?? '获取会员信息失败',
          },
        };
      }

      return {
        success: true,
        data: data.data,
      };
    } catch (error) {
      console.error('Get current member error:', error);
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: '网络错误',
        },
      };
    }
  }

  /**
   * 登出
   */
  async logout(): Promise<void> {
    localStorage.removeItem('member_access_token');
    localStorage.removeItem('member_refresh_token');
    localStorage.removeItem('member_info');
  }
}

// 导出单例
export const memberAuthService = new MemberAuthService();
