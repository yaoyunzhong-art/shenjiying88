import { Injectable } from '@nestjs/common'
import type {
  TenantId,
  TouchPoint,
  AttributionResult,
  CampaignROI
} from './marketing.entity'

/**
 * Phase-42 T172: AttributionEngine (归因模型)
 *
 * DR-42-E: V1 = last non-direct · V2 = 40/40/20 (first/last/middle)
 *
 * 反模式 v4 coupon-abuse-pattern:
 *  - 归因劫持: 用户主动 direct 触发不归因
 *  - 渠道套利: 同一渠道重复触点合并
 *  - 时间窗口: 7 天归因窗口
 */

const ATTRIBUTION_WINDOW_DAYS = 7
const ATTRIBUTION_WINDOW_MS = ATTRIBUTION_WINDOW_DAYS * 24 * 60 * 60 * 1000

@Injectable()
export class AttributionEngine {
  private touchpoints = new Map<string, TouchPoint>()

  seedTouchPoints(points: TouchPoint[]): void {
    for (const p of points) {
      this.touchpoints.set(p.id, { ...p })
    }
  }

  recordTouchPoint(point: TouchPoint): TouchPoint {
    const tp: TouchPoint = {
      ...point,
      id: point.id || `tp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    }
    this.touchpoints.set(tp.id, tp)
    return tp
  }

  queryByMember(memberId: string): TouchPoint[] {
    return Array.from(this.touchpoints.values())
      .filter(t => t.memberId === memberId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
  }

  /**
   * V1: Last non-direct touch 归因
   * 找到转化前最近的非 direct/organic 触点
   */
  attributeLastNonDirect(memberId: string, conversionId: string, revenueCents: number): AttributionResult {
    const allPoints = this.queryByMember(memberId)
    const conversion = this.touchpoints.get(conversionId)
    if (!conversion) {
      return { memberId, conversionId, revenueCents, touchPoints: allPoints }
    }
    const conversionTime = new Date(conversion.timestamp).getTime()
    const windowStart = conversionTime - ATTRIBUTION_WINDOW_MS

    // 在归因窗口内、转化前、非 direct/organic 的触点
    const eligible = allPoints
      .filter(p => {
        const t = new Date(p.timestamp).getTime()
        return t >= windowStart && t <= conversionTime && p.channel !== 'DIRECT' && p.channel !== 'ORGANIC'
      })
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

    const lastNonDirect = eligible[0]
    return {
      memberId,
      conversionId,
      revenueCents,
      lastNonDirectTouch: lastNonDirect,
      attributedCampaignId: lastNonDirect?.campaignId,
      attributedChannel: lastNonDirect?.channel,
      touchPoints: allPoints
    }
  }

  /**
   * V2: 多触点归因 (40% first + 40% last + 20% middle 平均)
   */
  attributeMultiTouch(memberId: string, conversionId: string, revenueCents: number): AttributionResult {
    const v1 = this.attributeLastNonDirect(memberId, conversionId, revenueCents)
    const conversion = this.touchpoints.get(conversionId)
    if (!conversion) return v1

    const conversionTime = new Date(conversion.timestamp).getTime()
    const windowStart = conversionTime - ATTRIBUTION_WINDOW_MS

    const eligible = this.queryByMember(memberId)
      .filter(p => {
        const t = new Date(p.timestamp).getTime()
        return t >= windowStart && t <= conversionTime && p.channel !== 'DIRECT' && p.channel !== 'ORGANIC'
      })
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())

    if (eligible.length === 0) {
      return v1
    }
    if (eligible.length === 1) {
      return { ...v1, attributionWeights: { [eligible[0].campaignId || 'unknown']: 1 } }
    }

    const weights: Record<string, number> = {}
    const first = eligible[0]
    const last = eligible[eligible.length - 1]
    const middle = eligible.slice(1, -1)

    weights[first.campaignId || 'first'] = 0.4
    weights[last.campaignId || 'last'] = 0.4
    if (middle.length > 0) {
      const middleShare = 0.2 / middle.length
      for (const m of middle) {
        weights[m.campaignId || `mid-${m.id}`] = (weights[m.campaignId || `mid-${m.id}`] || 0) + middleShare
      }
    }

    return { ...v1, attributionWeights: weights }
  }

  /**
   * 7 天归因窗口
   */
  static get WINDOW_DAYS(): number {
    return ATTRIBUTION_WINDOW_DAYS
  }

  reset(): void {
    this.touchpoints.clear()
  }
}