import { Injectable } from '@nestjs/common'
import { CohortAdapter } from './datasources/cohort.adapter'
import { EventAdapter } from './datasources/event.adapter'
import type { TenantId, CohortGroup, CohortPeriod, CohortMatrix } from './analytics-v2.entity'

/**
 * Phase-43 T173: CohortAnalyzer (同期群分析)
 *
 * DR-43-C: Cohort 按周 (默认) + 月维度 + 12 期回看
 *
 * 反模式 v4 cohort-bias-pattern:
 *  - 时间窗偏差: cohort 起始日固定 (周一/月初)
 *  - 样本不足: cohort_size < 10 低可信度
 *  - 同期混淆: 不同 periodKey 隔离
 *  - 退出偏差: 需 90d 观察期
 *  - 跨期对比: cohort_size 归一化
 */
const RETENTION_DAYS = [0, 1, 7, 30, 60, 90]
const DEFAULT_PERIODS = 12

@Injectable()
export class CohortAnalyzer {
  constructor(
    private readonly cohortAdapter: CohortAdapter,
    private readonly eventAdapter: EventAdapter
  ) {}

  /**
   * 生成 cohort 起始 key (按周/按月)
   */
  periodKey(date: Date, period: CohortPeriod): string {
    if (period === 'MONTHLY') {
      const y = date.getUTCFullYear()
      const m = String(date.getUTCMonth() + 1).padStart(2, '0')
      return `${y}-${m}`
    }
    // WEEKLY: ISO 周编号
    const tmp = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
    const dayNum = (tmp.getUTCDay() + 6) % 7
    tmp.setUTCDate(tmp.getUTCDate() - dayNum + 3)
    const firstThursday = new Date(Date.UTC(tmp.getUTCFullYear(), 0, 4))
    const week = 1 + Math.round(((tmp.getTime() - firstThursday.getTime()) / 86400000 - 3 + ((firstThursday.getUTCDay() + 6) % 7)) / 7)
    return `${tmp.getUTCFullYear()}-W${String(week).padStart(2, '0')}`
  }

  /**
   * 构建 cohort (基于事件 + 注册时间)
   */
  buildCohort(tenantId: TenantId, period: CohortPeriod, registrationDate: Date, members: string[], now: number = Date.now()): CohortGroup {
    const periodKey = this.periodKey(registrationDate, period)
    const retention: number[] = []

    // 算 D0/D1/D7/D30/D60/D90 留存
    for (const day of RETENTION_DAYS) {
      const dayStart = new Date(registrationDate).getTime() + day * 24 * 60 * 60 * 1000
      const dayEnd = dayStart + 24 * 60 * 60 * 1000
      if (dayEnd > now) {
        retention.push(-1)  // 未到
        continue
      }
      let activeCount = 0
      for (const memberId of members) {
        const events = this.eventAdapter.queryByMember(tenantId, memberId)
        const hasEvent = events.some(e => {
          const t = new Date(e.timestamp).getTime()
          return t >= dayStart && t < dayEnd
        })
        if (hasEvent) activeCount++
      }
      retention.push(members.length > 0 ? Number((activeCount / members.length).toFixed(4)) : 0)
    }

    const cohort: CohortGroup = {
      id: `cohort-${tenantId}-${period}-${periodKey}`,
      tenantId,
      period,
      periodKey,
      cohortSize: members.length,
      retention,
      startDate: registrationDate.toISOString(),
      endDate: now > registrationDate.getTime() + 365 * 24 * 60 * 60 * 1000
        ? new Date(registrationDate.getTime() + 365 * 24 * 60 * 60 * 1000).toISOString()
        : new Date(now).toISOString()
    }
    return this.cohortAdapter.save(cohort)
  }

  /**
   * 构建租户级 cohort 矩阵 (按周期回看 N 期)
   */
  buildMatrix(tenantId: TenantId, period: CohortPeriod, periods: number = DEFAULT_PERIODS): CohortMatrix {
    const cohorts = this.cohortAdapter.queryByPeriod(tenantId, period)
      .slice(-periods)
    return {
      tenantId,
      period,
      cohorts,
      matrix: cohorts.map(c => ({
        cohort: c.periodKey,
        size: c.cohortSize,
        retention: c.retention
      }))
    }
  }

  /**
   * 反模式: 样本可信度
   */
  isReliable(cohort: CohortGroup): boolean {
    return cohort.cohortSize >= 10
  }

  /**
   * 留存率统计
   */
  getAvgRetention(tenantId: TenantId, period: CohortPeriod): { d1: number; d7: number; d30: number } {
    const cohorts = this.cohortAdapter.queryByPeriod(tenantId, period)
    if (cohorts.length === 0) return { d1: 0, d7: 0, d30: 0 }
    let sumD1 = 0, sumD7 = 0, sumD30 = 0, nD1 = 0, nD7 = 0, nD30 = 0
    for (const c of cohorts) {
      if (c.retention[1] >= 0) { sumD1 += c.retention[1]; nD1++ }
      if (c.retention[2] >= 0) { sumD7 += c.retention[2]; nD7++ }
      if (c.retention[3] >= 0) { sumD30 += c.retention[3]; nD30++ }
    }
    return {
      d1: nD1 > 0 ? Number((sumD1 / nD1).toFixed(4)) : 0,
      d7: nD7 > 0 ? Number((sumD7 / nD7).toFixed(4)) : 0,
      d30: nD30 > 0 ? Number((sumD30 / nD30).toFixed(4)) : 0
    }
  }
}