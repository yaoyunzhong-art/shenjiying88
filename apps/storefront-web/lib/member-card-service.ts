// member-card-service.ts · 会员卡/优惠券服务
// Phase-FP T-FP-029 · 2026-07-03

import { getDefaultApiBaseUrl } from '@m5/sdk';

export interface MemberCard {
  id: string;
  memberId: string;
  cardNumber: string;
  tier: MemberTier;
  tierName: string;
  tierColor: string;
  points: number;
  pointsToNextTier: number;
  nextTierName: string;
  issuedAt: string;
  expiresAt: string;
  status: 'active' | 'frozen' | 'cancelled';
  benefits: string[];
}

export interface MemberCoupon {
  id: string;
  couponId: string;
  name: string;
  type: CouponType;
  typeName: string;
  value: string;
  minAmount: string;
  validFrom: string;
  validTo: string;
  status: 'unused' | 'used' | 'expired';
  storeName: string;
}

export type MemberTier = 'diamond' | 'gold' | 'silver' | 'bronze' | 'basic';
export type CouponType = 'discount' | 'cash' | 'free_shipping' | 'voucher';

export interface MemberCardResponse {
  success: boolean;
  data?: MemberCard;
  error?: {
    code: string;
    message: string;
  };
}

export interface MemberCouponResponse {
  success: boolean;
  data?: {
    coupons: MemberCoupon[];
    total: number;
    unusedCount: number;
    usedCount: number;
    expiredCount: number;
  };
  error?: {
    code: string;
    message: string;
  };
}

const TIER_CONFIG: Record<MemberTier, { name: string; color: string; minPoints: number }> = {
  diamond: { name: '钻石会员', color: '#a78bfa', minPoints: 50000 },
  gold: { name: '黄金会员', color: '#fbbf24', minPoints: 20000 },
  silver: { name: '银卡会员', color: '#94a3b8', minPoints: 5000 },
  bronze: { name: '铜卡会员', color: '#d97706', minPoints: 1000 },
  basic: { name: '普通会员', color: '#64748b', minPoints: 0 },
};

const COUPON_TYPE_CONFIG: Record<CouponType, string> = {
  discount: '打折券',
  cash: '代金券',
  free_shipping: '免运费券',
  voucher: '礼品券',
};

/**
 * 会员卡服务
 * 获取会员卡信息和优惠券列表
 */
export class MemberCardService {
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
   * 获取会员卡信息
   * GET /member-card/me
   */
  async getMemberCard(): Promise<MemberCardResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/member-card/me`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...this.getAuthHeaders(),
        },
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: {
            code: data.code ?? 'FETCH_ERROR',
            message: data.message ?? '获取会员卡信息失败',
          },
        };
      }

      return {
        success: true,
        data: data.data ?? this.generateMockCard(),
      };
    } catch (error) {
      console.error('Get member card error:', error);
      // 返回mock数据用于开发
      return {
        success: true,
        data: this.generateMockCard(),
      };
    }
  }

  /**
   * 获取会员优惠券列表
   * GET /member-coupons
   */
  async getMemberCoupons(options?: {
    status?: 'unused' | 'used' | 'expired';
    page?: number;
    pageSize?: number;
  }): Promise<MemberCouponResponse> {
    const { status, page = 1, pageSize = 20 } = options ?? {};

    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('pageSize', String(pageSize));
      if (status) params.set('status', status);

      const response = await fetch(`${this.baseUrl}/member-coupons?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...this.getAuthHeaders(),
        },
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: {
            code: data.code ?? 'FETCH_ERROR',
            message: data.message ?? '获取优惠券列表失败',
          },
        };
      }

      return {
        success: true,
        data: data.data ?? this.generateMockCoupons(),
      };
    } catch (error) {
      console.error('Get member coupons error:', error);
      // 返回mock数据用于开发
      return {
        success: true,
        data: this.generateMockCoupons(),
      };
    }
  }

  /**
   * 领取优惠券
   * POST /member-coupons/{couponId}/claim
   */
  async claimCoupon(couponId: string): Promise<{ success: boolean; error?: any }> {
    try {
      const response = await fetch(`${this.baseUrl}/member-coupons/${couponId}/claim`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...this.getAuthHeaders(),
        },
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: {
            code: data.code ?? 'CLAIM_ERROR',
            message: data.message ?? '领取优惠券失败',
          },
        };
      }

      return { success: true };
    } catch (error) {
      console.error('Claim coupon error:', error);
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
   * 使用优惠券
   * POST /member-coupons/{couponId}/use
   */
  async useCoupon(couponId: string, orderId: string): Promise<{ success: boolean; error?: any }> {
    try {
      const response = await fetch(`${this.baseUrl}/member-coupons/${couponId}/use`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...this.getAuthHeaders(),
        },
        body: JSON.stringify({ orderId }),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: {
            code: data.code ?? 'USE_ERROR',
            message: data.message ?? '使用优惠券失败',
          },
        };
      }

      return { success: true };
    } catch (error) {
      console.error('Use coupon error:', error);
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: '网络错误，请稍后重试',
        },
      };
    }
  }

  // ====== Mock 数据生成 ======

  private generateMockCard(): MemberCard {
    const points = 12800;
    const tier = this.calculateTier(points);
    const config = TIER_CONFIG[tier];
    const nextTier = this.getNextTier(tier);
    const nextConfig = nextTier ? TIER_CONFIG[nextTier] : null;

    return {
      id: 'card_001',
      memberId: 'member_001',
      cardNumber: `SJY${Date.now().toString(36).toUpperCase()}`,
      tier,
      tierName: config.name,
      tierColor: config.color,
      points,
      pointsToNextTier: nextConfig ? nextConfig.minPoints - points : 0,
      nextTierName: nextConfig?.name ?? '已满级',
      issuedAt: '2024-01-15',
      expiresAt: '2029-01-15',
      status: 'active',
      benefits: this.getTierBenefits(tier),
    };
  }

  private generateMockCoupons(): {
    coupons: MemberCoupon[];
    total: number;
    unusedCount: number;
    usedCount: number;
    expiredCount: number;
  } {
    const coupons: MemberCoupon[] = [
      {
        id: 'mc1',
        couponId: 'cp1',
        name: '新客首单8折',
        type: 'discount',
        typeName: '打折券',
        value: '8折',
        minAmount: '满0元可用',
        validFrom: '2026-06-01',
        validTo: '2026-07-31',
        status: 'unused',
        storeName: '神机营旗舰店',
      },
      {
        id: 'mc2',
        couponId: 'cp2',
        name: '满300减50',
        type: 'cash',
        typeName: '代金券',
        value: '¥50',
        minAmount: '满300元',
        validFrom: '2026-06-01',
        validTo: '2026-06-30',
        status: 'unused',
        storeName: '神机营旗舰店',
      },
      {
        id: 'mc3',
        couponId: 'cp3',
        name: '会员专享免运费',
        type: 'free_shipping',
        typeName: '免运费券',
        value: '免运费',
        minAmount: '满99元',
        validFrom: '2026-06-01',
        validTo: '2026-12-31',
        status: 'unused',
        storeName: '全部门店',
      },
      {
        id: 'mc4',
        couponId: 'cp4',
        name: '夏季狂欢9折',
        type: 'discount',
        typeName: '打折券',
        value: '9折',
        minAmount: '满0元可用',
        validFrom: '2026-06-15',
        validTo: '2026-08-15',
        status: 'used',
        storeName: '神机营社区店',
      },
      {
        id: 'mc5',
        couponId: 'cp5',
        name: '端午节礼券',
        type: 'voucher',
        typeName: '礼品券',
        value: '¥100',
        minAmount: '满200元',
        validFrom: '2026-06-01',
        validTo: '2026-06-15',
        status: 'expired',
        storeName: '神机营社区店',
      },
    ];

    return {
      coupons,
      total: coupons.length,
      unusedCount: coupons.filter((c) => c.status === 'unused').length,
      usedCount: coupons.filter((c) => c.status === 'used').length,
      expiredCount: coupons.filter((c) => c.status === 'expired').length,
    };
  }

  private calculateTier(points: number): MemberTier {
    if (points >= 50000) return 'diamond';
    if (points >= 20000) return 'gold';
    if (points >= 5000) return 'silver';
    if (points >= 1000) return 'bronze';
    return 'basic';
  }

  private getNextTier(current: MemberTier): MemberTier | null {
    const order: MemberTier[] = ['basic', 'bronze', 'silver', 'gold', 'diamond'];
    const idx = order.indexOf(current);
    return idx >= 0 && idx < order.length - 1 ? (order[idx + 1] ?? null) : null;
  }

  private getTierBenefits(tier: MemberTier): string[] {
    const benefits: Record<MemberTier, string[]> = {
      diamond: ['专属客服优先接待', '生日双倍积分', '全场9折优惠', '免费停车', '新品优先体验'],
      gold: ['生日双倍积分', '全场9.5折优惠', '每月专属优惠券', '优先预约'],
      silver: ['生日双倍积分', '每月专属优惠券', '优先预约'],
      bronze: ['每月专属优惠券'],
      basic: ['积分抵现'],
    };
    return benefits[tier];
  }
}

// 导出单例
export const memberCardService = new MemberCardService();

// 导出配置常量
export { TIER_CONFIG, COUPON_TYPE_CONFIG };
