// referral.dto.ts · Phase-17 T8
// 创建: 2026-06-26 · Pulse-自动
// 状态: IMPLEMENTED · Referral DTO 定义

/**
 * 生成短码请求 DTO
 */
export class GenerateCodeDto {
  /** 父用户 ID (邀请人) */
  parentUserId!: string;
  /** 租户 ID */
  tenantId!: string;
  /** 基础 URL (生成落地页用) */
  baseUrl?: string;
  /** 过期天数 */
  expiresInDays?: number;
}

/**
 * 生成短码响应 DTO
 */
export class GenerateCodeResponseDto {
  codeId!: string;
  shortCode!: string;
  parentUserId!: string;
  tenantId!: string;
  qrCodeUrl?: string;
  landingUrl!: string;
  createdAt!: string;
  expiresAt?: string;
}

/**
 * 点击追踪请求 DTO
 */
export class TrackClickDto {
  shortCode!: string;
  childUserId?: string;
  source!: 'wechat' | 'mini-program' | 'link' | 'qrcode';
}

/**
 * 注册补登请求 DTO
 */
export class TrackSignupDto {
  shortCode!: string;
  childUserId!: string;
  signupAt?: string;
}

/**
 * 注册补登响应 DTO
 */
export class TrackSignupResponseDto {
  recordId!: string;
  parentUserId!: string;
  childUserId!: string;
  level!: number;
  ancestorChain!: string[];
  source!: string;
  tracked!: boolean;
}

/**
 * 奖励发放响应 DTO
 */
export class IssueRewardsResponseDto {
  rewards!: Array<{
    rewardId: string;
    recipientUserId: string;
    level: number;
    rewardType: string;
    rewardValue: number;
    status: string;
  }>;
}

/**
 * 指标查询响应 DTO
 */
export class ReferralMetricsResponseDto {
  totalCodes!: number;
  totalClicks!: number;
  totalSignups!: number;
  trackRate!: number;
  conversionRate!: number;
  totalRewardsIssued!: number;
  totalRewardsValue!: number;
}

/**
 * 裂变记录查询响应 DTO
 */
export class ReferralRecordResponseDto {
  records!: Array<{
    recordId: string;
    parentUserId: string;
    childUserId: string;
    level: number;
    source: string;
    signedUpAt?: string;
    tracked: boolean;
  }>;
}

/**
 * 奖励记录查询响应 DTO
 */
export class ReferralRewardsResponseDto {
  rewards!: Array<{
    rewardId: string;
    recipientUserId: string;
    level: number;
    rewardType: string;
    rewardValue: number;
    status: string;
    issuedAt?: string;
  }>;
}
