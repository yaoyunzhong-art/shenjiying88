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
  status: SVIPStatus;
  startAt: Date;
  expireAt: Date;
  autoRenew: boolean;
  createdAt: Date;
}

export interface SVIPBenefit {
  benefitId: string;
  subscriptionId: string;
  type: SVIPBenefitType;
  usedAt?: Date;
  expiresAt?: Date;
}
