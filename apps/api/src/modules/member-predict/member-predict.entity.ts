/**
 * 会员流失预测 实体定义
 *
 * 基于会员活跃度和消费行为，预测流失风险
 */

/** 风险等级 */
export enum RiskLevel {
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low'
}

/** 预测时间范围 */
export enum PredictHorizon {
  DAY_7 = 7,
  DAY_14 = 14,
  DAY_30 = 30
}

/** 会员预测结果 */
export interface MemberPrediction {
  memberId: string
  memberName: string
  memberLevel: string
  riskScore: number
  riskLevel: RiskLevel
  churnProbability: number
  predictedChurnDate: string
  /** 租户 ID（RLS 多租户隔离字段） */
  tenantId?: string
  mainReason: string
  suggestedAction: string
  lastActiveDate: string
  storeId: string
}
