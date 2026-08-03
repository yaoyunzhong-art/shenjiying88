import 'reflect-metadata'
import { describe, it } from 'vitest'
import assert from 'node:assert/strict'
import { AiMarketingController } from './ai-marketing.controller'

describe('AiMarketingController metadata', () => {
  it('controller should keep ai-marketing path', () => {
    assert.equal(Reflect.getMetadata('path', AiMarketingController), 'ai-marketing')
  })

  it('routes should keep REST metadata', () => {
    const cases = [
      [AiMarketingController.prototype.calculateROI, 1, 'roi/calculate'],
      [AiMarketingController.prototype.compareROI, 1, 'roi/compare'],
      [AiMarketingController.prototype.projectROI, 1, 'roi/project'],
      [AiMarketingController.prototype.getBudgetAllocation, 1, 'roi/budget-allocation'],
      [AiMarketingController.prototype.generateCopy, 1, 'copy/generate'],
      [AiMarketingController.prototype.batchGenerateCopy, 1, 'copy/generate-batch'],
      [AiMarketingController.prototype.optimizeHeadline, 1, 'copy/optimize-headline'],
      [AiMarketingController.prototype.localizeCopy, 1, 'copy/localize'],
      [AiMarketingController.prototype.generateABTest, 1, 'copy/ab-test'],
      [AiMarketingController.prototype.suggestCampaign, 1, 'campaign/suggest'],
      [AiMarketingController.prototype.planTimeline, 1, 'campaign/timeline'],
      [AiMarketingController.prototype.estimateReach, 1, 'campaign/reach-estimate'],
      [AiMarketingController.prototype.analyzeMarketing, 1, 'analyze'],
      [AiMarketingController.prototype.attributionAnalysis, 1, 'analytics/attribution'],
      [AiMarketingController.prototype.funnelAnalysis, 1, 'analytics/funnel'],
      [AiMarketingController.prototype.simulateBudget, 1, 'analytics/budget-simulation'],
      [AiMarketingController.prototype.cohortAnalysis, 0, 'analytics/cohort'],
      [AiMarketingController.prototype.competitiveAnalysis, 0, 'analytics/competitive'],
      [AiMarketingController.prototype.seasonalTrends, 0, 'analytics/seasonal-trends'],
      [AiMarketingController.prototype.getSuggestions, 0, 'analytics/suggestions'],
      [AiMarketingController.prototype.getCampaignPerformance, 0, 'optimizer/performance/:campaignId'],
      [AiMarketingController.prototype.optimizeBid, 1, 'optimizer/bid'],
      [AiMarketingController.prototype.recommendAudience, 0, 'optimizer/audience-segments/:campaignId'],
      [AiMarketingController.prototype.getCreativePerformance, 1, 'optimizer/creative-performance'],
      [AiMarketingController.prototype.getFrequencyCap, 0, 'optimizer/frequency-cap/:campaignId'],
      [AiMarketingController.prototype.analyzeBudgetPacing, 1, 'optimizer/budget-pacing'],
      [AiMarketingController.prototype.optimizeCPA, 1, 'optimizer/cpa'],
      [AiMarketingController.prototype.getChannelFrequency, 1, 'optimizer/channel-frequency'],
      [AiMarketingController.prototype.getModuleStats, 0, 'stats'],
    ] as const

    for (const [handler, method, path] of cases) {
      assert.equal(Reflect.getMetadata('method', handler), method)
      assert.equal(Reflect.getMetadata('path', handler), path)
    }
  })
})
