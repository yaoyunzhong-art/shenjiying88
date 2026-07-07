/**
 * 积分模块实体定义
 *
 * 包含积分核心实体、风控实体
 *
 * 树哥后台自动执行：积分原子操作与风控判定
 */

import { PointsAtomicService } from './points-atomic.service'
import { PointsRiskService, InflationMonitor, CircuitBreaker, ExpirationNotifier } from './points-risk.service'

// ============================================================================
// 核心积分实体
// ============================================================================

/** 积分流水记录 */
export interface PointsRecord {
  id: string
  memberId: string
  /** 变动类型：award(奖励) / redeem(兑换) / transfer_in(转入) / transfer_out(转出) / expire(过期) / adjust(调整) */
  type: 'award' | 'redeem' | 'transfer_in' | 'transfer_out' | 'expire' | 'adjust'
  /** 变动数量（正数增加，负数减少） */
  delta: number
  /** 变动后余额 */
  balanceAfter: number
  /** 变动原因 */
  reason: string
  /** 关联订单号（可选） */
  orderId?: string
  /** 关联事务ID（保证幂等） */
  transactionId: string
  /** 发生时间 */
  createdAt: string
}

/** 积分账户 */
export interface PointsAccount {
  memberId: string
  /** 当前可用积分 */
  balance: number
  /** 累计获得积分 */
  totalEarned: number
  /** 累计消耗积分 */
  totalSpent: number
  /** 即将过期积分 */
  expiringPoints: number
  /** 最近过期日期 */
  nextExpireDate?: string
  /** 账户状态：active / frozen / closed */
  status: 'active' | 'frozen' | 'closed'
  /** 创建时间 */
  createdAt: string
  /** 最后更新时间 */
  updatedAt: string
}

/** 积分兑换规则 */
export interface PointsRedemptionRule {
  id: string
  name: string
  /** 所需积分 */
  pointsRequired: number
  /** 兑换类型：cash(现金券) / item(商品) / coupon(优惠券) */
  rewardType: 'cash' | 'item' | 'coupon'
  /** 兑换价值（单位：分） */
  rewardValue: number
  /** 每日限兑次数 */
  dailyLimit: number
  /** 每人限兑次数（0=不限） */
  perMemberLimit: number
  /** 是否启用 */
  enabled: boolean
  /** 开始时间 */
  startAt?: string
  /** 结束时间 */
  endAt?: string
}

/** 积分发放规则 */
export interface PointsIssuanceRule {
  id: string
  name: string
  /** 触发条件类型：signin(签到) / purchase(消费) / referral(推荐) / activity(活动) / manual(手动) */
  trigger: 'signin' | 'purchase' | 'referral' | 'activity' | 'manual'
  /** 发放积分数量 */
  pointsAmount: number
  /** 发放比率（按消费金额比例，如0.01表示1%） */
  rate?: number
  /** 单次发放上限 */
  singleMax?: number
  /** 每日发放上限 */
  dailyMax?: number
  /** 每月发放上限 */
  monthlyMax?: number
  /** 是否启用 */
  enabled: boolean
}

/** 积分交易请求 */
export interface PointsTransactionRequest {
  memberId: string
  /** 变动数量（正数增加，负数减少） */
  delta: number
  reason: string
  orderId?: string
  transactionId: string
}

/** 积分转账请求 */
export interface PointsTransferRequest {
  fromMemberId: string
  toMemberId: string
  amount: number
  reason: string
  transactionId: string
}

/** 批量发放请求 */
export interface PointsBatchAwardRequest {
  memberIds: string[]
  pointsEach: number
  reason: string
  transactionId: string
}

// ============================================================================
// 风控相关实体
// ============================================================================

/** 风控告警记录 */
export interface RiskAlertRecord {
  id: string
  type: 'inflation' | 'circuit_breaker' | 'expiration'
  /** 告警级别：info / warning / critical */
  level: 'info' | 'warning' | 'critical'
  message: string
  threshold: number
  actual: number
  resolved: boolean
  createdAt: string
  resolvedAt?: string
}

/** 积分过期提醒记录 */
export interface PointsExpiryReminder {
  memberId: string
  points: number
  expireAt: string
  remindedAt: string[]
  reminderCount: number
}

/** 积分风控总览 */
export interface PointsRiskOverview {
  inflationIndex: number
  inflating: boolean
  circuitStatuses: Array<{
    endpoint: string
    state: 'closed' | 'open' | 'half-open'
    failures: number
    remainingMs: number | null
  }>
  activeReminders: number
  recentAlerts: RiskAlertRecord[]
}

// ============================================================================
// 输出实体
// ============================================================================

/** 积分操作结果 */
export interface PointsOperationResult {
  success: boolean
  data?: {
    newBalance?: number
    fromNewBalance?: number
    toNewBalance?: number
    alreadyProcessed?: boolean
    awardedCount?: number
  }
  error?: string
}

/** 积分账户概览 */
export interface PointsAccountOverview {
  account: PointsAccount
  recentRecords: PointsRecord[]
  riskStatus: Pick<PointsRiskOverview, 'inflationIndex' | 'inflating'>
}

/** 积分统计分析 */
export interface PointsStatistics {
  totalMembers: number
  totalIssued: number
  totalRedeemed: number
  activeAccounts: number
  averageBalance: number
  issuanceTrend: Array<{ date: string; amount: number }>
  redemptionTrend: Array<{ date: string; amount: number }>
}
