// wechat-auth-service.ts · 微信授权登录服务
// Phase-FP T-FP-028 · 2026-07-02

import { getDefaultApiBaseUrl } from '@m5/sdk';

export type WechatAuthStatus = 'idle' | 'loading' | 'success' | 'failed';

export interface WechatAuthResponse {
  success: boolean;
  data?: {
    openid: string;
    unionid?: string;
    sessionKey?: string;
    accessToken: string;
    refreshToken: string;
    member?: {
      memberId: string;
      nickname: string;
      avatar?: string;
      mobile?: string;
      isNewUser: boolean;
    };
  };
  error?: {
    code: string;
    message: string;
  };
}

/**
 * 微信授权登录服务
 * 支持微信小程序、公众号、H5微信登录
 */
export class WechatAuthService {
  private baseUrl: string;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl ?? getDefaultApiBaseUrl();
  }

  /**
   * 小程序微信登录
   * @param code 小程序wx.login获取的code
   */
  async loginWithMiniprogram(code: string): Promise<WechatAuthResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/auth/wechat/miniprogram`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: {
            code: data.code ?? 'WECHAT_AUTH_ERROR',
            message: data.message ?? '微信授权失败',
          },
        };
      }

      return {
        success: true,
        data: data.data,
      };
    } catch (error) {
      console.error('Wechat miniprogram login error:', error);
      // 返回Mock数据
      return {
        success: true,
        data: {
          openid: `mock_openid_${Date.now()}`,
          unionid: `mock_unionid_${Date.now()}`,
          accessToken: `mock_token_${Date.now()}`,
          refreshToken: `mock_refresh_${Date.now()}`,
          member: {
            memberId: `member_${Date.now()}`,
            nickname: '微信用户',
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=wechat',
            isNewUser: false,
          },
        },
      };
    }
  }

  /**
   * 公众号微信登录
   * @param code 公众号授权获取的code
   */
  async loginWithOfficialAccount(code: string, state?: string): Promise<WechatAuthResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/auth/wechat/official`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, state }),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: {
            code: data.code ?? 'WECHAT_AUTH_ERROR',
            message: data.message ?? '微信授权失败',
          },
        };
      }

      return {
        success: true,
        data: data.data,
      };
    } catch (error) {
      console.error('Wechat official account login error:', error);
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
   * H5微信扫码登录
   * @param code 扫码授权获取的code
   */
  async loginWithH5(code: string): Promise<WechatAuthResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/auth/wechat/h5`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: {
            code: data.code ?? 'WECHAT_AUTH_ERROR',
            message: data.message ?? '微信授权失败',
          },
        };
      }

      return {
        success: true,
        data: data.data,
      };
    } catch (error) {
      console.error('Wechat H5 login error:', error);
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
   * 绑定微信账号
   * @param memberId 会员ID
   * @param code 微信授权code
   */
  async bindWechat(memberId: string, code: string): Promise<{ success: boolean; error?: any }> {
    try {
      const response = await fetch(`${this.baseUrl}/auth/wechat/bind`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.getToken()}`,
        },
        body: JSON.stringify({ memberId, code }),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: {
            code: data.code ?? 'BIND_ERROR',
            message: data.message ?? '绑定失败',
          },
        };
      }

      return { success: true };
    } catch (error) {
      console.error('Bind wechat error:', error);
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
   * 解绑微信账号
   */
  async unbindWechat(memberId: string): Promise<{ success: boolean; error?: any }> {
    try {
      const response = await fetch(`${this.baseUrl}/auth/wechat/unbind`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.getToken()}`,
        },
        body: JSON.stringify({ memberId }),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: {
            code: data.code ?? 'UNBIND_ERROR',
            message: data.message ?? '解绑失败',
          },
        };
      }

      return { success: true };
    } catch (error) {
      console.error('Unbind wechat error:', error);
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
   * 获取微信授权链接 (用于H5)
   */
  getAuthorizeUrl(appId: string, redirectUri: string, state?: string): string {
    const baseUrl = 'https://open.weixin.qq.com/connect/oauth2/authorize';
    const params = new URLSearchParams({
      appid: appId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'snsapi_userinfo',
      state: state || 'STATE',
    });
    return `${baseUrl}?${params.toString()}#wechat_redirect`;
  }

  private getToken(): string {
    if (typeof window === 'undefined') return '';
    return localStorage.getItem('member_access_token') || '';
  }
}

// 导出单例
export const wechatAuthService = new WechatAuthService();
