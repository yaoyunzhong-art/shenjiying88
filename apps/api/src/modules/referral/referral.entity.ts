// referral.entity.ts · Phase-17 T8
// 创建: 2026-06-26 · Pulse-68 下午主任务
// 状态: IMPLEMENTED · Referral 数据模型
// 关联: tasks.md T8 · afternoon-dev-jobs.sh 14:30-16:00

/**
 * Referral 数据模型 (Phase-17 T8)
 *
 * 核心实体:
 * - ReferralCode: 分享短码 (parent user → child 关系)
 * - ReferralRecord: 三级裂变追踪记录
 * - ReferralReward: 奖励计算/发放记录
 */

export type ReferralLevel = 1 | 2 | 3;

export interface ReferralCode {
  codeId: string;
  shortCode: string;        // 6-8 位短码
  parentUserId: string;
  tenantId: string;
  qrCodeUrl?: string;       // 二维码 URL
  landingUrl: string;       // 落地页 URL
  createdAt: string;
  expiresAt?: string;
  totalClicks: number;
  totalSignups: number;
}

export interface ReferralRecord {
  recordId: string;
  parentUserId: string;     // 直接邀请人 (L1)
  childUserId: string;      // 被邀请人
  tenantId: string;
  level: ReferralLevel;
  /** 祖先链 (L1/L2/L3) */
  ancestorChain: string[];
  source: 'wechat' | 'mini-program' | 'link' | 'qrcode';
  clickedAt: string;
  signedUpAt?: string;
  firstOrderAt?: string;
  /** 追踪成功率 (90 天窗口) */
  tracked: boolean;
}

export interface ReferralReward {
  rewardId: string;
  recordId: string;
  recipientUserId: string;
  level: ReferralLevel;
  rewardType: 'points' | 'coupon';
  rewardValue: number;
  couponPlanId?: string;
  status: 'pending' | 'issued' | 'claimed' | 'expired';
  triggeredAt: string;
  issuedAt?: string;
}

export interface ReferralMetrics {
  totalCodes: number;
  totalClicks: number;
  totalSignups: number;
  trackRate: number;          // tracked signups / total clicks
  conversionRate: number;     // signups / clicks
  totalRewardsIssued: number;
  totalRewardsValue: number;
}

export interface GenerateCodeInput {
  parentUserId: string;
  tenantId: string;
  baseUrl?: string;
  expiresInDays?: number;
}

export interface TrackClickInput {
  shortCode: string;
  childUserId?: string;       // 注册后补登
  source: ReferralRecord['source'];
}

export interface TrackSignupInput {
  shortCode: string;
  childUserId: string;
  signupAt?: string;
}
