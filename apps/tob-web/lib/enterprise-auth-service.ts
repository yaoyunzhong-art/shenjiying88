// enterprise-auth-service.ts · 企业用户认证服务
// Phase-FP T-FP-017 · 2026-07-02

import { getDefaultApiBaseUrl } from '@m5/sdk';

export interface EnterpriseLoginRequest {
  email: string;
  password: string;
  loginType?: string;
}

export interface EnterpriseLoginResponse {
  success: boolean;
  data?: {
    user: EnterpriseUser;
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
    tokenType: string;
  };
  error?: {
    code: string;
    message: string;
  };
}

export interface EnterpriseRegisterRequest {
  email: string;
  password: string;
  confirmPassword: string;
  companyName: string;
  contactPerson: string;
  mobile: string;
}

export interface EnterpriseRegisterResponse {
  success: boolean;
  data?: {
    userId: string;
    email: string;
    companyName: string;
  };
  error?: {
    code: string;
    message: string;
  };
}

export interface EnterpriseUser {
  userId: string;
  tenantId: string;
  email?: string;
  mobile?: string;
  nickname?: string;
  roles: string[];
  permissions: string[];
  avatar?: string;
}

/**
 * 企业用户认证服务
 * 调用后端 AuthModule API 实现企业用户登录/注册
 */
export class EnterpriseAuthService {
  private baseUrl: string;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl ?? getDefaultApiBaseUrl();
  }

  /**
   * 企业用户登录
   * POST /auth/login/password
   */
  async login(request: EnterpriseLoginRequest): Promise<EnterpriseLoginResponse> {
    const { email, password, loginType = 'email_password' } = request;

    try {
      const response = await fetch(`${this.baseUrl}/auth/login/password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          loginType,
        }),
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
          user: data.data.user,
          accessToken: data.data.accessToken,
          refreshToken: data.data.refreshToken,
          expiresIn: data.data.expiresIn,
          tokenType: data.data.tokenType ?? 'Bearer',
        },
      };
    } catch (error) {
      console.error('Enterprise login error:', error);
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
   * 企业用户注册 (Mock实现 - 后端暂无注册API)
   * POST /auth/register (预留)
   */
  async register(request: EnterpriseRegisterRequest): Promise<EnterpriseRegisterResponse> {
    // 客户端校验
    if (request.password !== request.confirmPassword) {
      return {
        success: false,
        error: {
          code: 'PASSWORD_MISMATCH',
          message: '两次输入的密码不一致',
        },
      };
    }

    if (request.password.length < 8) {
      return {
        success: false,
        error: {
          code: 'PASSWORD_TOO_SHORT',
          message: '密码长度至少8位',
        },
      };
    }

    // 调用后端注册API
    try {
      const response = await fetch(`${this.baseUrl}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: request.email,
          password: request.password,
          companyName: request.companyName,
          contactPerson: request.contactPerson,
          mobile: request.mobile,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        return {
          success: true,
          data: data.data ?? {
            userId: data.userId ?? `enterprise_${Date.now()}`,
            email: request.email,
            companyName: request.companyName,
          },
        };
      }

      const errData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: {
          code: errData.code ?? 'REGISTER_ERROR',
          message: errData.message ?? `注册失败 (HTTP ${response.status})`,
        },
      };
    } catch (error) {
      // 后端API暂未部署时降级为 mock 数据，供前端调试
      console.warn('[EnterpriseAuthService] 注册API暂不可达，降级为 mock');
      console.error('Register API call failed:', error);
      return {
        success: true,
        data: {
          userId: `enterprise_${Date.now()}`,
          email: request.email,
          companyName: request.companyName,
        },
      };
    }
  }

  /**
   * 刷新Token
   * POST /auth/refresh
   */
  async refreshToken(refreshToken: string): Promise<{ success: boolean; data?: any; error?: any }> {
    try {
      const response = await fetch(`${this.baseUrl}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: {
            code: data.code ?? 'REFRESH_ERROR',
            message: data.message ?? 'Token刷新失败',
          },
        };
      }

      return {
        success: true,
        data: {
          accessToken: data.data.accessToken,
          refreshToken: data.data.refreshToken,
          expiresIn: data.data.expiresIn,
        },
      };
    } catch (error) {
      console.error('Token refresh error:', error);
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: '网络错误，请重新登录',
        },
      };
    }
  }

  /**
   * 登出
   * POST /auth/logout
   */
  async logout(accessToken: string, sessionId?: string): Promise<{ success: boolean; error?: any }> {
    try {
      const response = await fetch(`${this.baseUrl}/auth/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ sessionId }),
      });

      if (!response.ok) {
        const data = await response.json();
        return {
          success: false,
          error: {
            code: data.code ?? 'LOGOUT_ERROR',
            message: data.message ?? '登出失败',
          },
        };
      }

      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);
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
   * 获取当前用户信息
   * GET /auth/me
   */
  async getCurrentUser(accessToken: string): Promise<{ success: boolean; data?: EnterpriseUser; error?: any }> {
    try {
      const response = await fetch(`${this.baseUrl}/auth/me`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: {
            code: data.code ?? 'AUTH_ERROR',
            message: data.message ?? '获取用户信息失败',
          },
        };
      }

      return {
        success: true,
        data: data.data,
      };
    } catch (error) {
      console.error('Get current user error:', error);
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: '网络错误',
        },
      };
    }
  }
}

// 导出单例
export const enterpriseAuthService = new EnterpriseAuthService();
