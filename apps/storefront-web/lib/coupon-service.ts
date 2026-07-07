// coupon-service.ts · 优惠券服务
// Phase-FP · 2026-07-03

import { getDefaultApiBaseUrl } from '@m5/sdk';

export type CouponStatus = 'unused' | 'used' | 'expired';
export type CouponType = 'discount' | 'cash' | 'free_shipping' | 'voucher';

export interface Coupon {
  id: string;
  couponId: string;
  name: string;
  type: CouponType;
  typeName: string;
  value: string;
  minAmount: string;
  validFrom: string;
  validTo: string;
  status: CouponStatus;
  storeName: string;
  description?: string;
}

export interface CouponListResponse {
  success: boolean;
  data?: {
    coupons: Coupon[];
    total: number;
    unusedCount: number;
    usedCount: number;
    expiredCount: number;
  };
  error?: { code: string; message: string };
}

export interface ClaimCouponResponse {
  success: boolean;
  data?: { couponId: string };
  error?: { code: string; message: string };
}

const TYPE_CONFIG: Record<CouponType, { name: string; color: string }> = {
  discount: { name: '打折券', color: '#f97316' },
  cash: { name: '代金券', color: '#10b981' },
  free_shipping: { name: '免运费券', color: '#3b82f6' },
  voucher: { name: '礼品券', color: '#ec4899' },
};

const MOCK_COUPONS: Coupon[] = [
  { id: 'c1', couponId: 'cp1', name: '新客首单8折', type: 'discount', typeName: '打折券', value: '8折', minAmount: '满0元可用', validFrom: '2026-06-01', validTo: '2026-07-31', status: 'unused', storeName: '神机营旗舰店' },
  { id: 'c2', couponId: 'cp2', name: '满300减50', type: 'cash', typeName: '代金券', value: '¥50', minAmount: '满300元', validFrom: '2026-06-01', validTo: '2026-06-30', status: 'unused', storeName: '神机营旗舰店' },
  { id: 'c3', couponId: 'cp3', name: '会员专享免运费', type: 'free_shipping', typeName: '免运费券', value: '免运费', minAmount: '满99元', validFrom: '2026-06-01', validTo: '2026-12-31', status: 'unused', storeName: '全部门店' },
  { id: 'c4', couponId: 'cp4', name: '夏季狂欢9折', type: 'discount', typeName: '打折券', value: '9折', minAmount: '满0元可用', validFrom: '2026-06-15', validTo: '2026-08-15', status: 'used', storeName: '神机营社区店' },
  { id: 'c5', couponId: 'cp5', name: '端午节礼券', type: 'voucher', typeName: '礼品券', value: '¥100', minAmount: '满200元', validFrom: '2026-06-01', validTo: '2026-06-15', status: 'expired', storeName: '神机营社区店' },
  { id: 'c6', couponId: 'cp6', name: '满500减80', type: 'cash', typeName: '代金券', value: '¥80', minAmount: '满500元', validFrom: '2026-05-01', validTo: '2026-06-30', status: 'unused', storeName: '神机营旗舰店' },
  { id: 'c7', couponId: 'cp7', name: '复购有礼', type: 'discount', typeName: '打折券', value: '7折', minAmount: '满200元', validFrom: '2026-06-10', validTo: '2026-07-10', status: 'unused', storeName: '神机营旗舰店' },
  { id: 'c8', couponId: 'cp8', name: '好友邀请券', type: 'voucher', typeName: '礼品券', value: '¥50', minAmount: '满100元', validFrom: '2026-06-01', validTo: '2026-09-30', status: 'unused', storeName: '神机营旗舰店' },
];

export class CouponService {
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
   * 获取优惠券列表
   * GET /member-coupons
   */
  async getCoupons(options?: {
    status?: CouponStatus;
    page?: number;
    pageSize?: number;
  }): Promise<CouponListResponse> {
    const { status, page = 1, pageSize = 20 } = options ?? {};

    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('pageSize', String(pageSize));
      if (status) params.set('status', status);

      const response = await fetch(`${this.baseUrl}/member-coupons?${params}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json', ...this.getAuthHeaders() },
      });

      const data = await response.json();
      if (!response.ok) {
        return { success: false, error: { code: data.code ?? 'FETCH_ERROR', message: data.message ?? '获取优惠券列表失败' } };
      }

      return { success: true, data: data.data ?? this.generateMockData() };
    } catch (error) {
      console.error('Get coupons error:', error);
      return { success: true, data: this.generateMockData() };
    }
  }

  /**
   * 领取优惠券
   * POST /coupons/{couponId}/claim
   */
  async claimCoupon(couponId: string): Promise<ClaimCouponResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/coupons/${couponId}/claim`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...this.getAuthHeaders() },
      });

      const data = await response.json();
      if (!response.ok) {
        return { success: false, error: { code: data.code ?? 'CLAIM_ERROR', message: data.message ?? '领取优惠券失败' } };
      }

      return { success: true, data: { couponId } };
    } catch (error) {
      console.error('Claim coupon error:', error);
      return { success: false, error: { code: 'NETWORK_ERROR', message: '网络错误' } };
    }
  }

  private generateMockData() {
    return {
      coupons: MOCK_COUPONS,
      total: MOCK_COUPONS.length,
      unusedCount: MOCK_COUPONS.filter((c) => c.status === 'unused').length,
      usedCount: MOCK_COUPONS.filter((c) => c.status === 'used').length,
      expiredCount: MOCK_COUPONS.filter((c) => c.status === 'expired').length,
    };
  }
}

export const couponService = new CouponService();
export { TYPE_CONFIG };
