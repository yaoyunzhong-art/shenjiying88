export type SVIPStatus = 'active' | 'expired' | 'cancelled';

export type SVIPBenefitType = 'points_multiplier' | 'free_delivery' | 'exclusive_discount';

export interface SVIPPlan {
  planId: string;
  name: string;
  price: number;
  durationDays: number;
  benefits: string[];
  createdAt: Date;
}

// ── BS-0286: SVIP续费阶梯优惠 ──

/** 续费阶梯优惠配置 */
export interface RenewalTierDiscount {
  /** 续费年限 */
  years: number
  /** 折扣率 (0~1) */
  discount: number
  /** 折后总价 */
  totalPrice: number
  /** 月均价格 */
  monthlyPrice: number
}

/** 续费计算结果 */
export interface RenewalDiscountResult {
  /** 原价（单年 * 续费年数） */
  originalTotal: number
  /** 折后总价 */
  discountedTotal: number
  /** 节省金额 */
  savedAmount: number
  /** 折扣率 */
  discount: number
  /** 续费年限 */
  years: number
  /** 各档位信息（用于预览） */
  allTiers: RenewalTierDiscount[]
}

export interface SVIPSubscription {
  subscriptionId: string;
  userId: string;
  planId: string;
  /** 租户 ID（RLS 多租户隔离字段） */
  tenantId?: string;
  status: SVIPStatus;
  startAt: Date;
  expireAt: Date;
  autoRenew: boolean;
  createdAt: Date;
}

export interface SVIPBenefit {
  benefitId: string;
  subscriptionId: string;
  /** 租户 ID（RLS 多租户隔离字段） */
  tenantId?: string;
  type: SVIPBenefitType;
  usedAt?: Date;
  expiresAt?: Date;
}
