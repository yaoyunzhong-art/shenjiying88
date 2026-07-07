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

export const MOCK_PLANS: SVIPPlan[] = [
  {
    planId: 'svip-monthly',
    name: '月卡',
    price: 30,
    durationDays: 90,
    benefits: ['积分翻倍', '免费配送', '专属折扣'],
    createdAt: new Date(),
  },
  {
    planId: 'svip-quarterly',
    name: '季卡',
    price: 80,
    durationDays: 270,
    benefits: ['积分翻倍', '免费配送', '专属折扣', '优先客服'],
    createdAt: new Date(),
  },
  {
    planId: 'svip-yearly',
    name: '年卡',
    price: 280,
    durationDays: 1080,
    benefits: ['积分翻倍', '免费配送', '专属折扣', '优先客服', '专属礼包'],
    createdAt: new Date(),
  },
];

export const MOCK_SUBSCRIPTION: SVIPSubscription = {
  subscriptionId: 'sub-demo-001',
  userId: 'demo-user',
  planId: 'svip-monthly',
  status: 'active',
  startAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
  expireAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
  autoRenew: true,
  createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
};

export const MOCK_BENEFITS: SVIPBenefit[] = [
  {
    benefitId: 'ben-001',
    subscriptionId: 'sub-demo-001',
    type: 'points_multiplier',
    expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
  },
  {
    benefitId: 'ben-002',
    subscriptionId: 'sub-demo-001',
    type: 'free_delivery',
    expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
  },
  {
    benefitId: 'ben-003',
    subscriptionId: 'sub-demo-001',
    type: 'exclusive_discount',
    usedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
  },
  {
    benefitId: 'ben-004',
    subscriptionId: 'sub-demo-001',
    type: 'points_multiplier',
    expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
  },
  {
    benefitId: 'ben-005',
    subscriptionId: 'sub-demo-001',
    type: 'free_delivery',
    expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
  },
];

export function formatExpireDate(date: Date): string {
  return date.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' });
}

export function getBenefitLabel(type: SVIPBenefitType): string {
  const labels: Record<SVIPBenefitType, string> = {
    points_multiplier: '积分翻倍',
    free_delivery: '免费配送',
    exclusive_discount: '专属折扣',
  };
  return labels[type] || type;
}
