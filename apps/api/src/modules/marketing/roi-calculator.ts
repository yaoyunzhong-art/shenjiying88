import { Injectable } from '@nestjs/common'
import type { CampaignROI, TouchPoint, TenantId } from './marketing.entity'

/**
 * Phase-42 T172: ROICalculator
 *
 * ROI = (revenue - cost) / cost
 * CTR = clicked / sent
 * Conversion Rate = converted / clicked
 * CPA = cost / converted
 */
@Injectable()
export class ROICalculator {
  /**
   * 计算单 campaign ROI
   */
  compute(input: {
    campaignId: string
    campaignName: string
    sent: number
    clicked: number
    converted: number
    revenueCents: number
    costCents: number
    periodDays: number
  }): CampaignROI {
    const ctr = input.sent > 0 ? input.clicked / input.sent : 0
    const conversionRate = input.clicked > 0 ? input.converted / input.clicked : 0
    const roi = input.costCents > 0
      ? (input.revenueCents - input.costCents) / input.costCents
      : 0
    const cpaCents = input.converted > 0
      ? Math.round(input.costCents / input.converted)
      : 0
    return {
      campaignId: input.campaignId,
      campaignName: input.campaignName,
      sent: input.sent,
      clicked: input.clicked,
      converted: input.converted,
      revenueCents: input.revenueCents,
      costCents: input.costCents,
      roi: Number(roi.toFixed(4)),
      conversionRate: Number(conversionRate.toFixed(4)),
      ctr: Number(ctr.toFixed(4)),
      cpaCents,
      periodDays: input.periodDays
    }
  }

  /**
   * 从 TouchPoint 列表汇总
   */
  fromTouchPoints(campaignId: string, campaignName: string, touchPoints: TouchPoint[], costCents: number, periodDays: number): CampaignROI {
    let sent = 0, clicked = 0, converted = 0, revenueCents = 0
    for (const tp of touchPoints) {
      if (tp.event === 'IMPRESSION') sent++
      else if (tp.event === 'CLICK') clicked++
      else if (tp.event === 'CONVERSION') {
        converted++
        revenueCents += tp.revenueCents || 0
      }
    }
    return this.compute({ campaignId, campaignName, sent, clicked, converted, revenueCents, costCents, periodDays })
  }
}