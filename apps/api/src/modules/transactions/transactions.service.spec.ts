/**
 * transactions.service.spec.ts
 * 纯函数式内联测试 — 不 import 生产代码
 * 覆盖: 退款时限计算、风险分级、SLA 分派、老化桶、待办队列排序
 */

import { describe, it, expect } from 'vitest'

/* ============================================================
 * 1. 枚举 + 类型定义
 * ============================================================ */

export enum RefundStatus {
  Pending = 'PENDING',
  Completed = 'COMPLETED',
  Rejected = 'REJECTED',
}

export enum RefundAgingBucket {
  Under1Hour = 'UNDER_1H',
  Hour1To4 = 'H1_TO_H4',
  Hour4To24 = 'H4_TO_H24',
  Over24Hours = 'GTE_24H',
}

export enum RefundRiskLevel {
  Low = 'LOW',
  Medium = 'MEDIUM',
  High = 'HIGH',
}

export enum RefundEscalationLevel {
  None = 'NONE',
  TeamLead = 'TEAM_LEAD',
  OpsManager = 'OPS_MANAGER',
  Finance = 'FINANCE',
}

export enum RefundDispatchReason {
  PendingWithinSla = 'PENDING_WITHIN_SLA',
  ApproachingSlaBreach = 'APPROACHING_SLA_BREACH',
  SlaBreachedOrMediumRisk = 'SLA_BREACHED_OR_MEDIUM_RISK',
  HighAmountOrLongOverdue = 'HIGH_AMOUNT_OR_LONG_OVERDUE',
}

export interface RefundRecord {
  refundId: string
  orderId: string
  memberId: string
  refundAmount: number
  operator?: string
  status: RefundStatus
  requestedAt: string
  reviewedAt?: string
  reviewedBy?: string
  assignedOwner?: string
  assignedTo?: string
  assignedAt?: string
}

export interface SlaThresholds {
  teamLeadMinutes: number
  opsManagerMinutes: number
  financeMinutes: number
}

/* ============================================================
 * 2. Mock 数据工厂
 * ============================================================ */

function makeRefund(overrides: Partial<RefundRecord> = {}): RefundRecord {
  return {
    refundId: `refund-${Math.random().toString(36).slice(2, 8)}`,
    orderId: 'order-001',
    memberId: 'member-001',
    refundAmount: 100,
    operator: 'cashier-1',
    status: RefundStatus.Pending,
    requestedAt: new Date().toISOString(),
    ...overrides,
  }
}

/* ============================================================
 * 3. 内联业务逻辑纯函数
 * ============================================================ */

/** 退款等待分钟数 */
function getRefundWaitingMinutes(requestedAt: string, asOfTime: string): number {
  const requestedMs = new Date(requestedAt).getTime()
  const asOfMs = new Date(asOfTime).getTime()
  if (Number.isNaN(requestedMs) || Number.isNaN(asOfMs) || asOfMs <= requestedMs) return 0
  return Math.floor((asOfMs - requestedMs) / 60000)
}

/** 老化桶分类 */
function getRefundAgingBucket(waitingMinutes: number): RefundAgingBucket {
  if (waitingMinutes < 60) return RefundAgingBucket.Under1Hour
  if (waitingMinutes < 240) return RefundAgingBucket.Hour1To4
  if (waitingMinutes < 1440) return RefundAgingBucket.Hour4To24
  return RefundAgingBucket.Over24Hours
}

/** 风险等级 */
function getRefundRiskLevel(refund: RefundRecord, waitingMinutes: number): RefundRiskLevel {
  if (waitingMinutes >= 1440 || refund.refundAmount >= 100) return RefundRiskLevel.High
  if (waitingMinutes >= 240 || refund.refundAmount >= 50) return RefundRiskLevel.Medium
  return RefundRiskLevel.Low
}

/** SLA 阈值规范化 */
function getSlaThresholds(custom?: Partial<SlaThresholds>): SlaThresholds {
  const teamLead = custom?.teamLeadMinutes && custom.teamLeadMinutes > 0 ? custom.teamLeadMinutes : 60
  const opsManager = custom?.opsManagerMinutes && custom.opsManagerMinutes > 0
    ? Math.max(custom.opsManagerMinutes, teamLead)
    : Math.max(240, teamLead)
  const finance = custom?.financeMinutes && custom.financeMinutes > 0
    ? Math.max(custom.financeMinutes, opsManager, teamLead)
    : Math.max(1440, opsManager, teamLead)
  return { teamLeadMinutes: teamLead, opsManagerMinutes: opsManager, financeMinutes: finance }
}

/** 升级级别 */
function getEscalationLevel(
  refund: RefundRecord,
  waitingMinutes: number,
  thresholds: SlaThresholds,
): RefundEscalationLevel {
  if (waitingMinutes >= thresholds.financeMinutes || refund.refundAmount >= 100) return RefundEscalationLevel.Finance
  if (waitingMinutes >= thresholds.opsManagerMinutes || refund.refundAmount >= 50) return RefundEscalationLevel.OpsManager
  if (waitingMinutes >= thresholds.teamLeadMinutes) return RefundEscalationLevel.TeamLead
  return RefundEscalationLevel.None
}

/** 分派配置 */
function getDispatchConfig(level: RefundEscalationLevel): { suggestedOwner: string; dispatchReason: RefundDispatchReason } {
  const map: Record<RefundEscalationLevel, { suggestedOwner: string; dispatchReason: RefundDispatchReason }> = {
    [RefundEscalationLevel.None]: { suggestedOwner: 'refund-ops-queue', dispatchReason: RefundDispatchReason.PendingWithinSla },
    [RefundEscalationLevel.TeamLead]: { suggestedOwner: 'refund-team-lead', dispatchReason: RefundDispatchReason.ApproachingSlaBreach },
    [RefundEscalationLevel.OpsManager]: { suggestedOwner: 'refund-ops-manager', dispatchReason: RefundDispatchReason.SlaBreachedOrMediumRisk },
    [RefundEscalationLevel.Finance]: { suggestedOwner: 'refund-finance-review', dispatchReason: RefundDispatchReason.HighAmountOrLongOverdue },
  }
  return map[level]
}

/** 构建分派条目 */
function buildDispatchItem(
  refund: RefundRecord,
  waitingMinutes: number,
  level: RefundEscalationLevel,
): { refundId: string; waitingMinutes: number; escalationLevel: RefundEscalationLevel; suggestedOwner: string; dispatchReason: RefundDispatchReason } {
  const config = getDispatchConfig(level)
  return {
    refundId: refund.refundId,
    waitingMinutes,
    escalationLevel: level,
    suggestedOwner: refund.assignedOwner ?? config.suggestedOwner,
    dispatchReason: config.dispatchReason,
  }
}

/** 待办队列排序（升级优先级 -> 等待时间降序 -> 请求时间升序） */
function sortPriorityQueue<T extends { escalationLevel: RefundEscalationLevel; waitingMinutes: number; requestedAt: string }>(items: T[]): T[] {
  const escalationPriority: Record<RefundEscalationLevel, number> = {
    [RefundEscalationLevel.Finance]: 4,
    [RefundEscalationLevel.OpsManager]: 3,
    [RefundEscalationLevel.TeamLead]: 2,
    [RefundEscalationLevel.None]: 1,
  }
  return [...items].sort((a, b) => {
    const pa = escalationPriority[a.escalationLevel]
    const pb = escalationPriority[b.escalationLevel]
    if (pb !== pa) return pb - pa
    if (b.waitingMinutes !== a.waitingMinutes) return b.waitingMinutes - a.waitingMinutes
    return a.requestedAt.localeCompare(b.requestedAt)
  })
}

/** 退款过滤函数 */
function matchesRefundQuery(refund: RefundRecord, query: {
  memberId?: string; orderId?: string; operator?: string; status?: string;
  requestedAfter?: string; requestedBefore?: string;
}): boolean {
  if (query.memberId && refund.memberId !== query.memberId) return false
  if (query.orderId && refund.orderId !== query.orderId) return false
  if (query.operator && refund.operator !== query.operator) return false
  if (query.status && refund.status !== query.status) return false
  if (query.requestedAfter && refund.requestedAt.localeCompare(query.requestedAfter) < 0) return false
  if (query.requestedBefore && refund.requestedAt.localeCompare(query.requestedBefore) > 0) return false
  return true
}

/** 已预留退款金额（排除已拒绝的） */
function getReservedRefundAmount(refunds: RefundRecord[]): number {
  return refunds.filter(r => r.status !== RefundStatus.Rejected).reduce((s, r) => s + r.refundAmount, 0)
}

/** 已完成退款金额 */
function getCompletedRefundAmount(refunds: RefundRecord[]): number {
  return refunds.filter(r => r.status === RefundStatus.Completed).reduce((s, r) => s + r.refundAmount, 0)
}

/** 老化桶统计 */
function bucketAgingStats(
  pendingRefunds: RefundRecord[],
  asOfTime: string,
): Array<{ bucket: RefundAgingBucket; count: number; totalAmount: number }> {
  const buckets: RefundAgingBucket[] = [
    RefundAgingBucket.Under1Hour,
    RefundAgingBucket.Hour1To4,
    RefundAgingBucket.Hour4To24,
    RefundAgingBucket.Over24Hours,
  ]
  return buckets.map(bucket => {
    const entries = pendingRefunds.filter(r => getRefundAgingBucket(getRefundWaitingMinutes(r.requestedAt, asOfTime)) === bucket)
    return { bucket, count: entries.length, totalAmount: entries.reduce((s, r) => s + r.refundAmount, 0) }
  })
}

/* ============================================================
 * 4. 测试用例 (≥18)
 * ============================================================ */

describe('transactions — 纯函数业务逻辑', () => {

  /* ---------- 退款等待时间 ---------- */
  describe('getRefundWaitingMinutes', () => {
    it('同时间应返回 0', () => {
      const t = '2026-06-14T10:00:00.000Z'
      expect(getRefundWaitingMinutes(t, t)).toBe(0)
    })

    it('60 分钟后应返回 60', () => {
      expect(getRefundWaitingMinutes(
        '2026-06-14T10:00:00.000Z',
        '2026-06-14T11:00:00.000Z',
      )).toBe(60)
    })

    it('asOfTime 早于 requestedAt 应返回 0', () => {
      expect(getRefundWaitingMinutes(
        '2026-06-14T12:00:00.000Z',
        '2026-06-14T10:00:00.000Z',
      )).toBe(0)
    })

    it('无效日期字符串应返回 0', () => {
      expect(getRefundWaitingMinutes('invalid', '2026-06-14T10:00:00.000Z')).toBe(0)
    })
  })

  /* ---------- 老化桶 ---------- */
  describe('getRefundAgingBucket', () => {
    it('0 分钟 -> Under1Hour', () => {
      expect(getRefundAgingBucket(0)).toBe(RefundAgingBucket.Under1Hour)
    })

    it('59 分钟 -> Under1Hour', () => {
      expect(getRefundAgingBucket(59)).toBe(RefundAgingBucket.Under1Hour)
    })

    it('60 分钟 -> Hour1To4', () => {
      expect(getRefundAgingBucket(60)).toBe(RefundAgingBucket.Hour1To4)
    })

    it('239 分钟 -> Hour1To4', () => {
      expect(getRefundAgingBucket(239)).toBe(RefundAgingBucket.Hour1To4)
    })

    it('240 分钟 -> Hour4To24', () => {
      expect(getRefundAgingBucket(240)).toBe(RefundAgingBucket.Hour4To24)
    })

    it('1440 分钟 -> Over24Hours', () => {
      expect(getRefundAgingBucket(1440)).toBe(RefundAgingBucket.Over24Hours)
    })
  })

  /* ---------- 风险等级 ---------- */
  describe('getRefundRiskLevel', () => {
    it('<240 分钟 + <50 金额 -> Low', () => {
      expect(getRefundRiskLevel(makeRefund({ refundAmount: 30 }), 30)).toBe(RefundRiskLevel.Low)
    })

    it('≥240 分钟 -> Medium', () => {
      expect(getRefundRiskLevel(makeRefund({ refundAmount: 30 }), 240)).toBe(RefundRiskLevel.Medium)
    })

    it('≥50 金额 -> Medium', () => {
      expect(getRefundRiskLevel(makeRefund({ refundAmount: 50 }), 10)).toBe(RefundRiskLevel.Medium)
    })

    it('≥1440 分钟 -> High', () => {
      expect(getRefundRiskLevel(makeRefund({ refundAmount: 30 }), 1440)).toBe(RefundRiskLevel.High)
    })

    it('≥100 金额 -> High', () => {
      expect(getRefundRiskLevel(makeRefund({ refundAmount: 100 }), 10)).toBe(RefundRiskLevel.High)
    })
  })

  /* ---------- SLA 阈值 ---------- */
  describe('getSlaThresholds', () => {
    it('默认阈值: teamLead=60, opsManager=240, finance=1440', () => {
      const t = getSlaThresholds()
      expect(t.teamLeadMinutes).toBe(60)
      expect(t.opsManagerMinutes).toBe(240)
      expect(t.financeMinutes).toBe(1440)
    })

    it('opsManager 不可低于 teamLead', () => {
      const t = getSlaThresholds({ teamLeadMinutes: 120, opsManagerMinutes: 30 })
      expect(t.opsManagerMinutes).toBe(120)
    })

    it('finance 不可低于 opsManager 和 teamLead', () => {
      const t = getSlaThresholds({ teamLeadMinutes: 100, opsManagerMinutes: 200, financeMinutes: 50 })
      expect(t.financeMinutes).toBe(200)
    })

    it('负值/0 使用默认值', () => {
      const t = getSlaThresholds({ teamLeadMinutes: 0, opsManagerMinutes: -1, financeMinutes: 500 })
      expect(t.teamLeadMinutes).toBe(60)
      expect(t.opsManagerMinutes).toBe(240)
    })
  })

  /* ---------- 升级级别 ---------- */
  describe('getEscalationLevel', () => {
    const thresholds: SlaThresholds = { teamLeadMinutes: 60, opsManagerMinutes: 240, financeMinutes: 1440 }

    it('等待 <60 分钟 + 小额 -> None', () => {
      expect(getEscalationLevel(makeRefund({ refundAmount: 30 }), 30, thresholds)).toBe(RefundEscalationLevel.None)
    })

    it('≥60 分钟 -> TeamLead', () => {
      expect(getEscalationLevel(makeRefund({ refundAmount: 30 }), 60, thresholds)).toBe(RefundEscalationLevel.TeamLead)
    })

    it('≥240 分钟 -> OpsManager', () => {
      expect(getEscalationLevel(makeRefund({ refundAmount: 30 }), 240, thresholds)).toBe(RefundEscalationLevel.OpsManager)
    })

    it('≥50 金额 -> OpsManager', () => {
      expect(getEscalationLevel(makeRefund({ refundAmount: 50 }), 10, thresholds)).toBe(RefundEscalationLevel.OpsManager)
    })

    it('≥1440 分钟 -> Finance', () => {
      expect(getEscalationLevel(makeRefund({ refundAmount: 30 }), 1440, thresholds)).toBe(RefundEscalationLevel.Finance)
    })

    it('≥100 金额 -> Finance', () => {
      expect(getEscalationLevel(makeRefund({ refundAmount: 100 }), 10, thresholds)).toBe(RefundEscalationLevel.Finance)
    })
  })

  /* ---------- 分派配置文件 ---------- */
  describe('getDispatchConfig', () => {
    it('None -> refund-ops-queue + PendingWithinSla', () => {
      const c = getDispatchConfig(RefundEscalationLevel.None)
      expect(c.suggestedOwner).toBe('refund-ops-queue')
      expect(c.dispatchReason).toBe(RefundDispatchReason.PendingWithinSla)
    })

    it('TeamLead -> refund-team-lead + ApproachingSlaBreach', () => {
      const c = getDispatchConfig(RefundEscalationLevel.TeamLead)
      expect(c.suggestedOwner).toBe('refund-team-lead')
      expect(c.dispatchReason).toBe(RefundDispatchReason.ApproachingSlaBreach)
    })

    it('Finance -> refund-finance-review + HighAmountOrLongOverdue', () => {
      const c = getDispatchConfig(RefundEscalationLevel.Finance)
      expect(c.suggestedOwner).toBe('refund-finance-review')
      expect(c.dispatchReason).toBe(RefundDispatchReason.HighAmountOrLongOverdue)
    })
  })

  /* ---------- 待办队列排序 ---------- */
  describe('sortPriorityQueue', () => {
    it('Finance 优先于 None', () => {
      const items = [
        { escalationLevel: RefundEscalationLevel.None, waitingMinutes: 10, requestedAt: 'a' },
        { escalationLevel: RefundEscalationLevel.Finance, waitingMinutes: 5, requestedAt: 'b' },
      ]
      const sorted = sortPriorityQueue(items)
      expect(sorted[0].escalationLevel).toBe(RefundEscalationLevel.Finance)
    })

    it('同级别中等待时间更长的优先', () => {
      const items = [
        { escalationLevel: RefundEscalationLevel.None, waitingMinutes: 5, requestedAt: 'a' },
        { escalationLevel: RefundEscalationLevel.None, waitingMinutes: 30, requestedAt: 'b' },
      ]
      const sorted = sortPriorityQueue(items)
      expect(sorted[0].waitingMinutes).toBe(30)
    })

    it('同级别同等待时间，更早请求的优先', () => {
      const items = [
        { escalationLevel: RefundEscalationLevel.None, waitingMinutes: 10, requestedAt: '2026-06-14T12:00:00Z' },
        { escalationLevel: RefundEscalationLevel.None, waitingMinutes: 10, requestedAt: '2026-06-14T10:00:00Z' },
      ]
      const sorted = sortPriorityQueue(items)
      expect(sorted[0].requestedAt).toBe('2026-06-14T10:00:00Z')
    })
  })

  /* ---------- 退款过滤 ---------- */
  describe('matchesRefundQuery', () => {
    it('无查询条件应匹配所有', () => {
      expect(matchesRefundQuery(makeRefund(), {})).toBe(true)
    })

    it('按 memberId 过滤', () => {
      const r = makeRefund({ memberId: 'mem-1' })
      expect(matchesRefundQuery(r, { memberId: 'mem-1' })).toBe(true)
      expect(matchesRefundQuery(r, { memberId: 'mem-2' })).toBe(false)
    })

    it('按 requestedBefore/After 过滤', () => {
      const r = makeRefund({ requestedAt: '2026-06-14T12:00:00.000Z' })
      expect(matchesRefundQuery(r, { requestedAfter: '2026-06-14T11:00:00Z' })).toBe(true)
      expect(matchesRefundQuery(r, { requestedAfter: '2026-06-14T13:00:00Z' })).toBe(false)
      expect(matchesRefundQuery(r, { requestedBefore: '2026-06-14T13:00:00Z' })).toBe(true)
      expect(matchesRefundQuery(r, { requestedBefore: '2026-06-14T11:00:00Z' })).toBe(false)
    })

    it('按 status 过滤', () => {
      const r = makeRefund({ status: RefundStatus.Pending })
      expect(matchesRefundQuery(r, { status: RefundStatus.Pending })).toBe(true)
      expect(matchesRefundQuery(r, { status: RefundStatus.Completed })).toBe(false)
    })
  })

  /* ---------- 退款金额计算 ---------- */
  describe('getReservedRefundAmount', () => {
    it('排除已拒绝的退款', () => {
      const refunds = [
        makeRefund({ status: RefundStatus.Pending, refundAmount: 50 }),
        makeRefund({ status: RefundStatus.Rejected, refundAmount: 30 }),
        makeRefund({ status: RefundStatus.Pending, refundAmount: 20 }),
      ]
      expect(getReservedRefundAmount(refunds)).toBe(70)
    })

    it('空列表返回 0', () => {
      expect(getReservedRefundAmount([])).toBe(0)
    })
  })

  describe('getCompletedRefundAmount', () => {
    it('仅统计 Completed', () => {
      const refunds = [
        makeRefund({ status: RefundStatus.Completed, refundAmount: 100 }),
        makeRefund({ status: RefundStatus.Pending, refundAmount: 50 }),
        makeRefund({ status: RefundStatus.Completed, refundAmount: 30 }),
      ]
      expect(getCompletedRefundAmount(refunds)).toBe(130)
    })
  })

  /* ---------- 老化桶统计 ---------- */
  describe('bucketAgingStats', () => {
    it('4个桶各报告正确数量和金额', () => {
      const now = '2026-06-14T12:00:00.000Z'
      const pending = [
        makeRefund({ refundAmount: 10, requestedAt: '2026-06-14T11:59:00.000Z' }), // Under1Hour
        makeRefund({ refundAmount: 20, requestedAt: '2026-06-14T11:00:00.000Z' }), // Hour1To4
        makeRefund({ refundAmount: 30, requestedAt: '2026-06-14T08:00:00.000Z' }), // Hour4To24
        makeRefund({ refundAmount: 40, requestedAt: '2026-06-13T11:00:00.000Z' }), // Over24Hours
      ]
      const stats = bucketAgingStats(pending, now)
      const u1 = stats.find(s => s.bucket === RefundAgingBucket.Under1Hour)!
      expect(u1.count).toBe(1)
      expect(u1.totalAmount).toBe(10)
      const o24 = stats.find(s => s.bucket === RefundAgingBucket.Over24Hours)!
      expect(o24.count).toBe(1)
      expect(o24.totalAmount).toBe(40)
    })

    it('空列表每个桶 count=0', () => {
      const stats = bucketAgingStats([], '2026-06-14T12:00:00.000Z')
      stats.forEach(s => {
        expect(s.count).toBe(0)
        expect(s.totalAmount).toBe(0)
      })
    })
  })
})
