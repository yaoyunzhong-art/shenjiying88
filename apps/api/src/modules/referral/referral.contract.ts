/**
 * 🐜 自动: [referral] [A] contract 补全
 *
 * Referral 模块：跨模块合约类型
 * 定义 referral 模块对外暴露的稳定合约接口，
 * 供其他模块（campaign, loyalty, member, marketing-metrics 等）消费。
 */
import type {
  ReferralCode,
  ReferralRecord,
  ReferralReward,
  ReferralMetrics,
  GenerateCodeInput,
  TrackClickInput,
  TrackSignupInput,
  ReferralLevel,
} from './referral.entity';

/**
 * 推荐码合约（跨模块安全子集）
 */
export interface ReferralCodeContract {
  codeId: string;
  shortCode: string;
  parentUserId: string;
  tenantId: string;
  qrCodeUrl?: string;
  landingUrl: string;
  createdAt: string;
  expiresAt?: string;
  totalClicks: number;
  totalSignups: number;
}

/**
 * 推荐记录合约（跨模块安全子集）
 */
export interface ReferralRecordContract {
  recordId: string;
  parentUserId: string;
  childUserId: string;
  tenantId: string;
  level: ReferralLevel;
  ancestorChain: string[];
  source: ReferralRecord['source'];
  clickedAt: string;
  signedUpAt?: string;
  firstOrderAt?: string;
  tracked: boolean;
}

/**
 * 推荐奖励合约（跨模块安全子集）
 */
export interface ReferralRewardContract {
  rewardId: string;
  recordId: string;
  recipientUserId: string;
  level: ReferralLevel;
  rewardType: ReferralReward['rewardType'];
  rewardValue: number;
  couponPlanId?: string;
  status: ReferralReward['status'];
  triggeredAt: string;
  issuedAt?: string;
}

/**
 * 推荐指标合约（跨模块安全子集）
 */
export interface ReferralMetricsContract {
  totalCodes: number;
  totalClicks: number;
  totalSignups: number;
  trackRate: number;
  conversionRate: number;
  totalRewardsIssued: number;
  totalRewardsValue: number;
}

/**
 * 生成推荐码输入合约（跨模块安全子集）
 */
export interface GenerateCodeInputContract {
  parentUserId: string;
  tenantId: string;
  baseUrl?: string;
  expiresInDays?: number;
}

/**
 * 点击追踪输入合约（跨模块安全子集）
 */
export interface TrackClickInputContract {
  shortCode: string;
  childUserId?: string;
  source: ReferralRecord['source'];
}

/**
 * 注册补登输入合约（跨模块安全子集）
 */
export interface TrackSignupInputContract {
  shortCode: string;
  childUserId: string;
  signupAt?: string;
}

// ─── Contract 映射器 ─────────────────────────────────

/** 实体 -> 合约映射 */
export function toReferralCodeContract(entity: ReferralCode): ReferralCodeContract {
  return {
    codeId: entity.codeId,
    shortCode: entity.shortCode,
    parentUserId: entity.parentUserId,
    tenantId: entity.tenantId,
    qrCodeUrl: entity.qrCodeUrl,
    landingUrl: entity.landingUrl,
    createdAt: entity.createdAt,
    expiresAt: entity.expiresAt,
    totalClicks: entity.totalClicks,
    totalSignups: entity.totalSignups,
  };
}

/** 实体 -> 合约映射 */
export function toReferralRecordContract(entity: ReferralRecord): ReferralRecordContract {
  return {
    recordId: entity.recordId,
    parentUserId: entity.parentUserId,
    childUserId: entity.childUserId,
    tenantId: entity.tenantId,
    level: entity.level,
    ancestorChain: [...entity.ancestorChain],
    source: entity.source,
    clickedAt: entity.clickedAt,
    signedUpAt: entity.signedUpAt,
    firstOrderAt: entity.firstOrderAt,
    tracked: entity.tracked,
  };
}

/** 实体 -> 合约映射 */
export function toReferralRewardContract(entity: ReferralReward): ReferralRewardContract {
  return {
    rewardId: entity.rewardId,
    recordId: entity.recordId,
    recipientUserId: entity.recipientUserId,
    level: entity.level,
    rewardType: entity.rewardType,
    rewardValue: entity.rewardValue,
    couponPlanId: entity.couponPlanId,
    status: entity.status,
    triggeredAt: entity.triggeredAt,
    issuedAt: entity.issuedAt,
  };
}

/** 实体 -> 合约映射 */
export function toReferralMetricsContract(entity: ReferralMetrics): ReferralMetricsContract {
  return {
    totalCodes: entity.totalCodes,
    totalClicks: entity.totalClicks,
    totalSignups: entity.totalSignups,
    trackRate: entity.trackRate,
    conversionRate: entity.conversionRate,
    totalRewardsIssued: entity.totalRewardsIssued,
    totalRewardsValue: entity.totalRewardsValue,
  };
}

/** 批量映射 */
export function toReferralCodeContracts(entities: ReferralCode[]): ReferralCodeContract[] {
  return entities.map(toReferralCodeContract);
}

/** 批量映射 */
export function toReferralRecordContracts(entities: ReferralRecord[]): ReferralRecordContract[] {
  return entities.map(toReferralRecordContract);
}

/** 批量映射 */
export function toReferralRewardContracts(entities: ReferralReward[]): ReferralRewardContract[] {
  return entities.map(toReferralRewardContract);
}
