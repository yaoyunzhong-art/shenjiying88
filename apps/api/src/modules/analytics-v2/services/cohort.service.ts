import { Injectable } from '@nestjs/common'
import { CohortAnalyzer } from '../cohort-analyzer'
import { EventCollector } from '../event-collector'
import { CDCStream } from '../cdc-stream'
import { CohortAdapter } from '../datasources/cohort.adapter'
import { EventAdapter } from '../datasources/event.adapter'
import type {
  TenantId,
  CohortPeriod,
  CohortGroup,
  CohortMatrix
} from '../analytics-v2.entity'

/**
 * Phase-43 T173: CohortService (同期群业务层)
 *
 * DR-43-C: Cohort 按周/月 + D0/D1/D7/D30/D60/D90 留存曲线
 *
 * 业务职责:
 *  - 会员注册时构建 cohort
 *  - 实时滚动 cohort 更新 (从 CDC 增量)
 *  - 周期矩阵生成
 *  - 留存率统计
 */
@Injectable()
export class CohortService {
  constructor(
    private readonly cohortAnalyzer: CohortAnalyzer,
    private readonly cohortAdapter: CohortAdapter,
    private readonly eventCollector: EventCollector,
    private readonly cdcStream: CDCStream,
    private readonly eventAdapter: EventAdapter
  ) {}

  /**
   * 注册会员 → 自动建 cohort
   */
  registerMember(input: {
    tenantId: TenantId
    period: CohortPeriod
    memberId: string
    registrationDate: Date
  }): { cohort: CohortGroup; cdcApplied: boolean } {
    const periodKey = this.cohortAnalyzer.periodKey(input.registrationDate, input.period)

    // 查现有 cohort
    let cohort = this.cohortAdapter.queryByPeriodKey(input.tenantId, input.period, periodKey)
    if (!cohort) {
      // 新建
      cohort = this.cohortAnalyzer.buildCohort(
        input.tenantId,
        input.period,
        input.registrationDate,
        [input.memberId],
        Date.now()
      )
    } else {
      // 更新: 加 member 到 cohort + 重算 retention
      const updatedMembers = [...new Set([...this.getCohortMembers(input.tenantId, cohort), input.memberId])]
      const rebuilt = this.cohortAnalyzer.buildCohort(
        input.tenantId,
        input.period,
        input.registrationDate,
        updatedMembers,
        Date.now()
      )
      // 保留 ID
      rebuilt.id = cohort.id
      this.cohortAdapter.save(rebuilt)
      cohort = rebuilt
    }

    // 通过 CDC 触发下游订阅
    const cdcEvent = this.cdcStream.create({
      tenantId: input.tenantId,
      tableName: 'cohorts',
      recordId: cohort.id,
      eventType: 'UPDATED',
      after: cohort as unknown as Record<string, unknown>,
      eventId: `cdc-cohort-${cohort.id}-${Date.now()}`
    })
    this.cdcStream.apply(cdcEvent)

    return { cohort, cdcApplied: true }
  }

  /**
   * 会员行为 → 更新留存
   */
  trackMemberActivity(input: {
    tenantId: TenantId
    memberId: string
    activityType: 'PAGEVIEW' | 'CLICK' | 'CONVERSION' | 'PURCHASE' | 'CUSTOM'
    properties?: Record<string, any>
  }): { eventCollected: boolean; cohortUpdated: boolean } {
    const eventResult = this.eventCollector.collect({
      tenantId: input.tenantId,
      eventId: `evt-${input.memberId}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      type: input.activityType,
      who: input.memberId,
      what: input.activityType,
      memberId: input.memberId,
      properties: input.properties
    })

    if (!eventResult.accepted) return { eventCollected: false, cohortUpdated: false }

    // 找到该 member 所属 cohort → 通过 CDC 触发更新
    const cohorts = this.cohortAdapter.queryByTenant(input.tenantId)
    let updated = false
    for (const c of cohorts) {
      const members = this.getCohortMembers(input.tenantId, c)
      if (members.includes(input.memberId)) {
        const cdcEvent = this.cdcStream.create({
          tenantId: input.tenantId,
          tableName: 'cohorts',
          recordId: c.id,
          eventType: 'UPDATED',
          before: c as unknown as Record<string, unknown>,
          after: { ...c, lastActivity: new Date().toISOString() } as Record<string, unknown>,
          eventId: `cdc-cohort-activity-${c.id}-${input.memberId}-${Date.now()}`
        })
        this.cdcStream.apply(cdcEvent)
        updated = true
      }
    }

    return { eventCollected: true, cohortUpdated: updated }
  }

  /**
   * 重建 cohort 矩阵 (管理员触发)
   */
  rebuildMatrix(tenantId: TenantId, period: CohortPeriod, periods: number = 12): CohortMatrix {
    return this.cohortAnalyzer.buildMatrix(tenantId, period, periods)
  }

  /**
   * 查询租户所有 cohort
   */
  listCohorts(tenantId: TenantId, period?: CohortPeriod): CohortGroup[] {
    if (period) return this.cohortAdapter.queryByPeriod(tenantId, period)
    return this.cohortAdapter.queryByTenant(tenantId)
  }

  /**
   * 查询单 cohort
   */
  getCohort(tenantId: TenantId, cohortId: string): CohortGroup | null {
    return this.cohortAdapter.query(tenantId, cohortId)
  }

  /**
   * 平均留存率 (业务封装)
   */
  getAvgRetention(tenantId: TenantId, period: CohortPeriod): { d1: number; d7: number; d30: number; cohortCount: number } {
    const avg = this.cohortAnalyzer.getAvgRetention(tenantId, period)
    const count = this.cohortAdapter.queryByPeriod(tenantId, period).length
    return { ...avg, cohortCount: count }
  }

  /**
   * Cohort 可靠性分析
   */
  getReliabilityReport(tenantId: TenantId, period: CohortPeriod): {
    total: number
    reliable: number
    unreliable: number
    unreliableCohorts: Array<{ id: string; periodKey: string; size: number }>
  } {
    const cohorts = this.cohortAdapter.queryByPeriod(tenantId, period)
    const reliable = cohorts.filter(c => this.cohortAnalyzer.isReliable(c))
    const unreliable = cohorts.filter(c => !this.cohortAnalyzer.isReliable(c))
    return {
      total: cohorts.length,
      reliable: reliable.length,
      unreliable: unreliable.length,
      unreliableCohorts: unreliable.map(c => ({
        id: c.id,
        periodKey: c.periodKey,
        size: c.cohortSize
      }))
    }
  }

  /**
   * 内部: 获取 cohort 内的 member 列表
   * (实际生产应从 member_event 反查, 这里用 eventAdapter 模拟)
   */
  private getCohortMembers(_tenantId: TenantId, _cohort: CohortGroup): string[] {
    // 通过 cohortSize 反查事件 (简化): 我们没有存 member→cohort 映射
    // 这里通过查询带 properties.cohortId = cohort.id 的事件
    const allEvents = this.eventAdapter.queryByTenant(_tenantId)
    const memberSet = new Set<string>()
    for (const e of allEvents) {
      if (e.memberId && e.properties?.cohortId === _cohort.id) {
        memberSet.add(e.memberId)
      }
    }
    // 默认至少有 cohortSize 数量 (反查不到则假定已知 size)
    return Array.from(memberSet)
  }
}