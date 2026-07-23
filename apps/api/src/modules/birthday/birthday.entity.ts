// birthday.entity.ts · WP-15 生日趴引擎
// BS-0199~BS-0206

/**
 * 生日方案等级
 */
export enum BirthdayTier {
  Standard = 'STANDARD',
  Premium = 'PREMIUM',
  VIP = 'VIP',
}

/**
 * 奖励类型
 */
export type RewardType = 'coupon' | 'gift' | 'discount';

/**
 * 生日方案状态
 */
export type BirthdayPlanStatus = 'pending' | 'active' | 'completed' | 'cancelled';

/**
 * 生日方案 — 为单会员在某个生日周期内创建的营销方案
 */
export interface BirthdayPlan {
  id: string;
  memberId: string;
  /** 会员生日日期（MM-DD，不含年） */
  birthday: string;
  /** 方案执行日（具体哪一天执行推送） */
  planDate: string;
  /** 提前天数（生日前N天） */
  advanceDays: number;
  tier: BirthdayTier;
  rewardType: RewardType;
  /** 优惠券/礼品/折扣的具体数值 */
  rewardValue: number;
  status: BirthdayPlanStatus;
  /** 近30天标记 */
  isUpcoming: boolean;
  /** 是否允许带好友 */
  allowFriends: boolean;
  /** 好友优惠折扣（0~1） */
  friendDiscount?: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * 生日奖励发放记录
 */
export interface BirthdayReward {
  id: string;
  planId: string;
  type: RewardType;
  value: number;
  sentAt?: Date;
  claimedAt?: Date;
  createdAt: Date;
}

/**
 * 生日消费追踪 — 传播裂变与复购数据
 */
export interface BirthdayTracking {
  id: string;
  planId: string;
  /** 到店庆生是否带好友 */
  friendInvited: number;
  /** 本次生日总消费额 */
  totalSpend: number;
  /** 生日后N天再次到店（复购间隔天数） */
  returnVisitDays: number;
  createdAt: Date;
}

/**
 * 生日趴看板聚合数据
 */
export interface BirthdayDashboard {
  /** 当月生日客户数 */
  monthlyBirthdays: number;
  /** 进行中方案数 */
  activePlans: number;
  /** 转化率（领取奖励/发送奖励） */
  conversionRate: number;
  /** 平均消费 */
  avgSpend: number;
  /** 复购率 */
  returnRate: number;
  /** 统计月份 YYYY-MM */
  month: string;
  updatedAt: Date;
}
