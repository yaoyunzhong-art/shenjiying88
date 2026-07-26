import 'reflect-metadata'
import { describe, it } from 'vitest'
import assert from 'node:assert/strict'
import { IntelligenceController } from './intelligence.controller'

describe('IntelligenceController metadata', () => {
  it('controller should keep intelligence path', () => {
    assert.equal(Reflect.getMetadata('path', IntelligenceController), 'intelligence')
  })

  it('routes should keep REST metadata', () => {
    const cases = [
      [IntelligenceController.prototype.feasibility, 1, 'feasibility'],
      [IntelligenceController.prototype.financePanorama, 1, 'finance-panorama'],
      [IntelligenceController.prototype.sitingAssessment, 0, 'siting-assessment'],
      [IntelligenceController.prototype.storePlanning, 1, 'store-planning'],
      [IntelligenceController.prototype.operations, 0, 'operations/:storeId'],
      [IntelligenceController.prototype.monitor, 0, 'monitor/:storeId'],
      [IntelligenceController.prototype.monitorSummary, 0, 'monitor/summary'],
      [IntelligenceController.prototype.triggerIncremental, 1, 'monitor/scan/incremental'],
      [IntelligenceController.prototype.triggerFull, 1, 'monitor/scan/full'],
      [IntelligenceController.prototype.operationsPlan, 1, 'operations-plan'],
      [IntelligenceController.prototype.syncKnowledge, 1, 'sync-knowledge'],
      [IntelligenceController.prototype.dataBaseSummary, 0, 'data-base/summary'],
      [IntelligenceController.prototype.deviceRecommendation, 1, 'device-recommendation'],
      [IntelligenceController.prototype.renovationPlan, 1, 'renovation-plan'],
      [IntelligenceController.prototype.pricingStrategy, 1, 'pricing-strategy'],
      [IntelligenceController.prototype.marketingCampaign, 1, 'marketing-campaign'],
    ] as const

    for (const [handler, method, path] of cases) {
      assert.equal(Reflect.getMetadata('method', handler), method)
      assert.equal(Reflect.getMetadata('path', handler), path)
    }
  })
})
