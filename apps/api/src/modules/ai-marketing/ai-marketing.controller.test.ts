import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * ai-marketing Controller 单元测试
 * AiMarketingController 单元测试：正例 + 反例 + 边界
 */
import 'reflect-metadata'
import assert from 'node:assert/strict'
import { AiMarketingController } from './ai-marketing.controller'
import { CampaignTypeEnum, ChannelEnum } from './ai-marketing.dto'
import {
  MarketingROIService,
  CopywritingAssistant,
  CampaignPlanner,
  AIMarketingCMOService,
} from './ai-marketing-cmo.service'
import { MarketingAnalyticsService } from './ai-marketing-analytics.service'
import { CampaignOptimizerService } from './ai-marketing-campaign-optimizer.service'

function createController(): AiMarketingController {
  const roiService = new MarketingROIService()
  const copywritingService = new CopywritingAssistant()
  const campaignPlanner = new CampaignPlanner()
  const analyticsService = new MarketingAnalyticsService()
  const optimizerService = new CampaignOptimizerService()
  const cmoService = new AIMarketingCMOService(roiService, copywritingService, campaignPlanner)
  return new AiMarketingController(roiService, copywritingService, campaignPlanner, cmoService, analyticsService, optimizerService)
}

// ─── ROI ───────────────────────────────────────────────────────

describe('AiMarketingController: ROI endpoints', () => {
  it('POST /ai-marketing/roi/calculate returns ROI for valid campaign', () => {
    const ctrl = createController()
    const result = ctrl.calculateROI({ campaignId: 'camp-001' })
    assert.ok(result.success)
    assert.equal(result.data!.campaignId, 'camp-001')
    assert.ok(result.data!.roiPercent > 0)
  })

  it('POST /ai-marketing/roi/calculate returns not found for invalid', () => {
    const ctrl = createController()
    const result = ctrl.calculateROI({ campaignId: 'non-existent' })
    assert.ok(!result.success)
    assert.ok(result.message!.includes('not found'))
  })

  it('POST /ai-marketing/roi/compare returns sorted results', () => {
    const ctrl = createController()
    const result = ctrl.compareROI({ campaignIds: ['camp-001', 'camp-002', 'camp-003'] })
    assert.ok(result.success)
    assert.equal(result.data.length, 3)
    // ROI descending
    for (let i = 1; i < result.data.length; i++) {
      assert.ok(result.data[i - 1].roi >= result.data[i].roi)
    }
  })

  it('POST /ai-marketing/roi/compare with empty returns empty', () => {
    const ctrl = createController()
    const result = ctrl.compareROI({ campaignIds: [] })
    assert.ok(result.success)
    assert.equal(result.data.length, 0)
  })

  it('POST /ai-marketing/roi/project returns expected range', () => {
    const ctrl = createController()
    const result = ctrl.projectROI({ type: CampaignTypeEnum.PERFORMANCE, budget: 50000 })
    assert.ok(result.success)
    assert.ok(result.data.minROI <= result.data.expectedROI)
    assert.ok(result.data.expectedROI <= result.data.maxROI)
  })

  it('POST /ai-marketing/roi/budget-allocation returns allocation', () => {
    const ctrl = createController()
    const result = ctrl.getBudgetAllocation({ campaignType: CampaignTypeEnum.KOL, totalBudget: 100000 })
    assert.ok(result.success)
    assert.ok(result.data.length > 0)
    const totalPct = result.data.reduce((s: number, a: any) => s + a.percent, 0)
    assert.ok(Math.round(totalPct) === 100)
  })
})

// ─── Copywriting ───────────────────────────────────────────────

describe('AiMarketingController: Copy endpoints', () => {
  it('POST /ai-marketing/copy/generate returns generated copy', () => {
    const ctrl = createController()
    const result = ctrl.generateCopy({ product: '夏季新品', goal: 'conversion', audience: '年轻人' })
    assert.ok(result.success)
    assert.ok(result.data.headline)
    assert.ok(result.data.body)
    assert.ok(result.data.cta)
  })

  it('POST /ai-marketing/copy/optimize-headline returns optimized', () => {
    const ctrl = createController()
    const result = ctrl.optimizeHeadline({ headline: '新品上市' })
    assert.ok(result.success)
    assert.equal(result.data.original, '新品上市')
    assert.ok(result.data.optimized)
  })

  it('POST /ai-marketing/copy/localize changes CTA per locale', () => {
    const ctrl = createController()
    const result = ctrl.localizeCopy({ headline: 'H', body: 'B', cta: '购买', taglines: ['T'], locale: 'en-US' })
    assert.ok(result.success)
    assert.equal(result.data.cta, 'Buy Now')
  })

  it('POST /ai-marketing/copy/ab-test returns variants', () => {
    const ctrl = createController()
    const result = ctrl.generateABTest({ brief: { product: 'P', goal: 'conversion', audience: 'A' }, count: 3 })
    assert.ok(result.success)
    assert.equal(result.data.variants.length, 3)
  })

  it('POST /ai-marketing/copy/generate-batch returns batch results', () => {
    const ctrl = createController()
    const result = ctrl.batchGenerateCopy({
      items: [
        { product: 'P1', goal: 'conversion', audience: 'A1' },
        { product: 'P2', goal: 'awareness', audience: 'A2' },
      ],
    })
    assert.ok(result.success)
    assert.equal(result.data.totalGenerated, 2)
  })
})

// ─── Campaign Planning ─────────────────────────────────────────

describe('AiMarketingController: Campaign planning endpoints', () => {
  it('POST /ai-marketing/campaign/suggest returns suggestions', () => {
    const ctrl = createController()
    const result = ctrl.suggestCampaign({ goal: 'awareness', budget: 100000, audience: '白领' })
    assert.ok(result.success)
    assert.ok(result.data.length > 0)
  })

  it('POST /ai-marketing/campaign/timeline returns timeline', () => {
    const ctrl = createController()
    const result = ctrl.planTimeline({ goal: 'brand' })
    assert.ok(result.success)
    assert.equal(result.data.length, 3)
  })

  it('POST /ai-marketing/campaign/reach-estimate returns estimate', () => {
    const ctrl = createController()
    const result = ctrl.estimateReach({ audience: 50000, channel: ChannelEnum.WECHAT })
    assert.ok(result.success)
    assert.equal(result.data.channel, 'wechat')
    assert.ok(result.data.cost > 0)
  })
})

// ─── Analysis & Stats ──────────────────────────────────────────

describe('AiMarketingController: Analysis & Stats endpoints', () => {
  it('POST /ai-marketing/analyze returns ROI-only analysis', () => {
    const ctrl = createController()
    const result = ctrl.analyzeMarketing({ campaignId: 'camp-001', includeROI: true, includeTimeline: false, includeReach: false })
    assert.ok(result.success)
    assert.ok(result.data.roi)
    assert.equal(result.data.timeline, undefined)
  })

  it('POST /ai-marketing/analyze full analysis includes all', () => {
    const ctrl = createController()
    const result = ctrl.analyzeMarketing({ campaignId: 'camp-001', includeROI: true, includeTimeline: true, includeReach: true })
    assert.ok(result.success)
    assert.ok(result.data.roi)
    assert.ok(result.data.timeline)
    assert.ok(result.data.reach)
  })

  it('GET /ai-marketing/stats returns module stats', () => {
    const ctrl = createController()
    const result = ctrl.getModuleStats()
    assert.ok(result.success)
    assert.equal(result.data.totalCampaigns, 5)
    assert.ok(result.data.averageROI !== undefined)
  })
})
