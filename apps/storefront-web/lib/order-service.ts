// order-service.ts · 订单服务
// Phase-FP · 2026-07-03

import { getDefaultApiBaseUrl } from '@m5/sdk';

export type OrderStatus = 'pending' | 'paid' | 'completed' | 'cancelled' | 'refunded';

export interface OrderItem {
  name: string;
  quantity: number;
  price: number;
}

export interface Order {
  id: string;
  orderNo: string;
  storeName: string;
  totalAmount: number;
  status: OrderStatus;
  itemCount: number;
  createdAt: string;
  items: OrderItem[];
  paidAt?: string;
  completedAt?: string;
}

export interface OrderListResponse {
  success: boolean;
  data?: {
    orders: Order[];
    total: number;
    pendingCount: number;
  };
  error?: { code: string; message: string };
}

export interface OrderDetailResponse {
  success: boolean;
  data?: Order;
  error?: { code: string; message: string };
}

const STATUS_CONFIG: Record<OrderStatus, { label: string; color: string; bg: string }> = {
  pending: { label: '待支付', color: '#f59e0b', bg: '#f59e0b20' },
  paid: { label: '已支付', color: '#10b981', bg: '#10b98120' },
  completed: { label: '已完成', color: '#3b82f6', bg: '#3b82f620' },
  cancelled: { label: '已取消', color: '#64748b', bg: '#64748b20' },
  refunded: { label: '已退款', color: '#ef4444', bg: '#ef444420' },
};

export class OrderService {
  private baseUrl: string;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl ?? getDefaultApiBaseUrl();
  }

  private getAuthHeaders(): HeadersInit {
    if (typeof window === 'undefined') return {};
    const token = localStorage.getItem('member_access_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  /**
   * 获取订单列表
   * GET /orders
   */
  async getOrders(options?: {
    status?: OrderStatus;
    page?: number;
    pageSize?: number;
  }): Promise<OrderListResponse> {
    const { status, page = 1, pageSize = 20 } = options ?? {};

    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('pageSize', String(pageSize));
      if (status) params.set('status', status);

      const response = await fetch(`${this.baseUrl}/orders?${params}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json', ...this.getAuthHeaders() },
      });

      const data = await response.json();
      if (!response.ok) {
        return { success: false, error: { code: data.code ?? 'FETCH_ERROR', message: data.message ?? '获取订单列表失败' } };
      }

      if (!data?.data || !Array.isArray(data.data.orders)) {
        return { success: false, error: { code: 'INVALID_RESPONSE', message: '订单列表响应格式不合法' } };
      }

      return { success: true, data: data.data };
    } catch (error) {
      console.error('Get orders error:', error);
      return { success: false, error: { code: 'NETWORK_ERROR', message: '网络错误' } };
    }
  }

  /**
   * 获取订单详情
   * GET /orders/{orderId}
   */
  async getOrderDetail(orderId: string): Promise<OrderDetailResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/orders/${orderId}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json', ...this.getAuthHeaders() },
      });

      const data = await response.json();
      if (!response.ok) {
        return { success: false, error: { code: data.code ?? 'FETCH_ERROR', message: data.message ?? '获取订单详情失败' } };
      }

      if (!data?.data) {
        return { success: false, error: { code: 'INVALID_RESPONSE', message: '订单详情响应格式不合法' } };
      }

      return { success: true, data: data.data };
    } catch (error) {
      console.error('Get order detail error:', error);
      return { success: false, error: { code: 'NETWORK_ERROR', message: '网络错误' } };
    }
  }

  /**
   * 取消订单
   * POST /orders/{orderId}/cancel
   */
  async cancelOrder(orderId: string): Promise<{ success: boolean; error?: { code: string; message: string } }> {
    try {
      const response = await fetch(`${this.baseUrl}/orders/${orderId}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...this.getAuthHeaders() },
      });

      const data = await response.json();
      if (!response.ok) {
        return { success: false, error: { code: data.code ?? 'CANCEL_ERROR', message: data.message ?? '取消订单失败' } };
      }

      return { success: true };
    } catch (error) {
      console.error('Cancel order error:', error);
      return { success: false, error: { code: 'NETWORK_ERROR', message: '网络错误' } };
    }
  }

}

export const orderService = new OrderService();
export { STATUS_CONFIG };
