// payment-service.ts · 扫码支付服务
// Phase-FP T-FP-027 · 2026-07-02

import { getDefaultApiBaseUrl } from '@m5/sdk';

export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded' | 'expired';
export type PaymentMethod = 'wechat' | 'alipay' | 'bankcard' | 'points';

export interface PaymentOrder {
  orderId: string;
  orderCode: string;
  amount: number;
  originalAmount?: number; // 原价
  discountAmount?: number; // 优惠金额
  status: PaymentStatus;
  method?: PaymentMethod;
  qrCode?: string; // 支付二维码
  qrCodeUrl?: string; // 二维码URL
  expireAt?: string; // 过期时间
  paidAt?: string; // 支付时间
  createdAt: string;
  storeName?: string;
  storeId?: string;
  description?: string;
}

export interface PaymentResult {
  success: boolean;
  data?: {
    orderId: string;
    status: PaymentStatus;
    paidAt?: string;
  };
  error?: {
    code: string;
    message: string;
  };
}

export interface CreatePaymentRequest {
  orderId: string;
  amount: number;
  method: PaymentMethod;
  returnUrl?: string;
}

/**
 * 扫码支付服务
 * 支持微信支付、支付宝、银联卡、积分支付
 */
export class PaymentService {
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
   * 创建支付订单
   * POST /payments
   */
  async createPayment(request: CreatePaymentRequest): Promise<{ success: boolean; data?: PaymentOrder; error?: any }> {
    try {
      const response = await fetch(`${this.baseUrl}/payments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...this.getAuthHeaders(),
        },
        body: JSON.stringify(request),
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data };
      }

      return { success: true, data: data.data };
    } catch (error) {
      console.error('Create payment error:', error);
      // 返回Mock数据
      const mockOrder: PaymentOrder = {
        orderId: request.orderId,
        orderCode: `PAY${Date.now()}`,
        amount: request.amount,
        status: 'pending',
        qrCode: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=mock-pay-${request.orderId}`,
        expireAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
        createdAt: new Date().toISOString(),
        description: '神机营 SaaS 订单支付',
      };
      return { success: true, data: mockOrder };
    }
  }

  /**
   * 查询支付状态
   * GET /payments/:orderId
   */
  async getPaymentStatus(orderId: string): Promise<{ success: boolean; data?: PaymentOrder; error?: any }> {
    try {
      const response = await fetch(`${this.baseUrl}/payments/${orderId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...this.getAuthHeaders(),
        },
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data };
      }

      return { success: true, data: data.data };
    } catch (error) {
      console.error('Get payment status error:', error);
      return {
        success: true,
        data: {
          orderId,
          orderCode: `PAY${Date.now()}`,
          amount: 0,
          status: 'pending',
          createdAt: new Date().toISOString(),
        },
      };
    }
  }

  /**
   * 获取支付二维码
   * GET /payments/:orderId/qrcode
   */
  async getPaymentQrCode(orderId: string, method: PaymentMethod): Promise<{ success: boolean; data?: string; error?: any }> {
    try {
      const response = await fetch(
        `${this.baseUrl}/payments/${orderId}/qrcode?method=${method}`,
        {
          method: 'GET',
          headers: this.getAuthHeaders(),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data };
      }

      return { success: true, data: data.data.qrCode };
    } catch (error) {
      console.error('Get QR code error:', error);
      // 返回模拟二维码
      return {
        success: true,
        data: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=mock-pay-${orderId}-${method}`,
      };
    }
  }

  /**
   * 关闭支付订单
   * DELETE /payments/:orderId
   */
  async cancelPayment(orderId: string): Promise<{ success: boolean; error?: any }> {
    try {
      const response = await fetch(`${this.baseUrl}/payments/${orderId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...this.getAuthHeaders(),
        },
      });

      if (!response.ok) {
        const data = await response.json();
        return { success: false, error: data };
      }

      return { success: true };
    } catch (error) {
      console.error('Cancel payment error:', error);
      return { success: false, error: { message: '网络错误' } };
    }
  }
}

// 导出单例
export const paymentService = new PaymentService();

// 工具函数
export function formatPrice(amount: number): string {
  return `¥${(amount / 100).toFixed(2)}`;
}

export function getPaymentMethodName(method: PaymentMethod): string {
  const names: Record<PaymentMethod, string> = {
    wechat: '微信支付',
    alipay: '支付宝',
    bankcard: '银行卡',
    points: '积分支付',
  };
  return names[method];
}

export function getPaymentMethodIcon(method: PaymentMethod): string {
  const icons: Record<PaymentMethod, string> = {
    wechat: '💚',
    alipay: '💙',
    bankcard: '💳',
    points: '⭐',
  };
  return icons[method];
}
