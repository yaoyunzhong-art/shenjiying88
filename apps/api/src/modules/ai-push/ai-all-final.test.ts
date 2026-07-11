/**
 * ai-all-final.test.ts — 最终补充测试
 */
import { describe, it, expect } from 'vitest'
import { AiPushController } from './ai-push.controller'
import { PushTaskService } from './ai-push-task.service'
import { MemberSegmentationService, OptimalTimingService, ABTestService } from './ai-push.service'

describe('AiPushController Final', () => {
  const ctrl = () => new AiPushController(new PushTaskService(), new MemberSegmentationService(), new OptimalTimingService(), new ABTestService())

  it('createTask', () => expect(ctrl().createTask({ title: 'T', content: 'C', channel: 'push' as any }).id).toBeTruthy())
  it('getTasks', () => {
    const c = ctrl()
    c.createTask({ title: 'T', content: 'C', channel: 'push' as any })
    expect(c.getTasks({}).length).toBe(1)
  })
  it('getStats', () => expect(ctrl().getStats({})).toBeDefined())
  it('createExperiment', () => {
    const r = ctrl().createExperiment({ name: 'E', variants: [{ name: 'A', weight: 100, config: {} }] })
    expect(r.id).toBeTruthy()
  })
  it('getOptimalTiming', () => expect(ctrl().getOptimalTiming('push').length).toBeGreaterThan(0))
})

import { AiRagController } from '../ai-rag/ai-rag.controller'
import { KnowledgeBaseManager, RAGPipeline, SalesScriptGenerator } from '../ai-rag/ai-rag.service'

describe('AiRagController Final', () => {
  const kb = new KnowledgeBaseManager()
  const pipeline = new RAGPipeline(kb)
  const script = new SalesScriptGenerator()
  const ctrl = new AiRagController(kb, pipeline, script)

  it('addDocument', () => expect(ctrl.addDocument({ collection: 'c', content: 'x' }).id).toBeTruthy())
  it('listDocuments', () => {
    ctrl.addDocument({ collection: 'c', content: 'x' })
    expect(ctrl.listDocuments('c').length).toBe(1)
  })
  it('generateProductScript', () => expect(ctrl.generateProductScript({ productId: 'prod-001', tone: 'friendly' })).toBeTruthy())
  it('generateObjectionScript', () => expect(ctrl.generateObjectionScript({ productId: 'prod-001', objectionType: 'price' })).toBeTruthy())
  it('generateFollowUpScript', () => expect(ctrl.generateFollowUpScript({ customerId: 'cust-001' })).toBeTruthy())
})

import { AiForecastController } from '../ai-forecast/ai-forecast.controller'
import { DemandForecastService, InventoryOptimizer, TransferRecommendationService } from '../ai-forecast/ai-forecast.service'

describe('AiForecastController Final', () => {
  const ctrl = new AiForecastController(new DemandForecastService(), new InventoryOptimizer(), new TransferRecommendationService())

  it('forecast', () => {
    const r = ctrl.forecast({ sku: 'p1', days: 7 })
    expect(r.predictions).toHaveLength(7)
  })
  it('suggestReorder', () => {
    const r = ctrl.suggestReorder({ sku: 'p1', currentStock: 50, leadTimeDays: 7 })
    expect(r.sku).toBe('p1')
  })
})
