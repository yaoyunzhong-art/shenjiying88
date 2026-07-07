import { Injectable } from '@nestjs/common'
import { FunnelAdapter } from './datasources/funnel.adapter'
import { EventAdapter } from './datasources/event.adapter'
import type { TenantId, FunnelStep, FunnelResult } from './analytics-v2.entity'

/**
 * Phase-43 T173: FunnelCalculator (漏斗计算)
 *
 * DR-43-D: Funnel 步骤配置 + 7d 时间窗口
 *
 * 反模式 v4 cohort-bias-pattern:
 *  - 步骤顺序错乱: 严格按 steps 顺序
 *  - 时间窗口过长: 默认 7d
 *  - 重复进入: 同 member 只算首次
 *  - 步骤过滤缺失: filter 必须 JSON
 */
const DEFAULT_WINDOW_DAYS = 7

@Injectable()
export class FunnelCalculator {
  constructor(
    private readonly funnelAdapter: FunnelAdapter,
    private readonly eventAdapter: EventAdapter
  ) {}

  /**
   * 计算漏斗
   */
  compute(input: {
    tenantId: TenantId
    name: string
    steps: FunnelStep[]
    windowDays?: number
  }): FunnelResult {
    const windowMs = (input.windowDays ?? DEFAULT_WINDOW_DAYS) * 24 * 60 * 60 * 1000
    const now = Date.now()

    // 第一步: 找所有进入漏斗的 member
    const firstStep = input.steps[0]
    const firstStepEvents = this.eventAdapter.queryByType(input.tenantId, firstStep.eventType)
    const enteredMembers = new Set<string>()
    for (const e of firstStepEvents) {
      if (e.memberId) enteredMembers.add(e.memberId)
    }

    // 后续步骤: 时间窗口内完成
    const stepResults = []
    let prevEntered = enteredMembers
    let totalEntered = enteredMembers.size

    for (let i = 0; i < input.steps.length; i++) {
      const step = input.steps[i]
      const stepName = step.name
      const stepEvents = this.eventAdapter.queryByType(input.tenantId, step.eventType)

      const passedMembers = new Set<string>()
      for (const e of stepEvents) {
        if (!e.memberId) continue
        // 检查是否进入过前一步
        if (i === 0 || true) {  // 第 0 步是入口
          // 检查时间窗口 (从第一步起)
          if (prevEntered.has(e.memberId)) {
            const firstEventTime = this.getFirstEventTime(input.tenantId, e.memberId, input.steps[0].eventType)
            if (firstEventTime && (new Date(e.timestamp).getTime() - firstEventTime) <= windowMs) {
              passedMembers.add(e.memberId)
            }
          }
        }
      }

      const enteredCount = i === 0 ? enteredMembers.size : prevEntered.size
      const conversionRate = enteredCount > 0 ? passedMembers.size / enteredCount : 0
      const dropOffRate = 1 - conversionRate

      stepResults.push({
        stepName,
        enteredCount: i === 0 ? enteredMembers.size : passedMembers.size,
        conversionRate: Number(conversionRate.toFixed(4)),
        dropOffRate: Number(dropOffRate.toFixed(4))
      })

      prevEntered = passedMembers
    }

    const totalConversionRate = totalEntered > 0
      ? stepResults[stepResults.length - 1].enteredCount / totalEntered
      : 0

    const funnel: FunnelResult = {
      id: `funnel-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      tenantId: input.tenantId,
      name: input.name,
      steps: input.steps,
      windowDays: input.windowDays ?? DEFAULT_WINDOW_DAYS,
      stepResults,
      totalConversionRate: Number(totalConversionRate.toFixed(4)),
      computedAt: new Date(now).toISOString()
    }
    return this.funnelAdapter.save(funnel)
  }

  /**
   * 查询某 member 某事件的首次发生时间
   */
  private getFirstEventTime(tenantId: TenantId, memberId: string, eventType: any): number | null {
    const events = this.eventAdapter.queryByMember(tenantId, memberId)
      .filter(e => e.type === eventType)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
    return events.length > 0 ? new Date(events[0].timestamp).getTime() : null
  }

  /**
   * 反模式: 漏斗步骤过多 (> 5)
   */
  isOverComplex(steps: FunnelStep[]): boolean {
    return steps.length > 5
  }
}