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

export interface SVIPSubscription {
  subscriptionId: string;
  userId: string;
  planId: string;
  /** 租户 ID（RLS 多租户隔离字段） */
  tenantId: string;
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
  tenantId: string;
  type: SVIPBenefitType;
  usedAt?: Date;
  expiresAt?: Date;
}
