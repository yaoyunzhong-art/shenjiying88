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

  it('createDocument', () => {
    const obs = ctrl.createDocument({ collection: 'c', content: 'x' })
    expect(obs).toBeDefined()
  })
  it('listDocuments', () => {
    const obs = ctrl.listDocuments('c')
    expect(obs).toBeDefined()
  })
  it('generateProductScript', () => {
    const obs = ctrl.generateProductScript({ productId: 'prod-001', tone: 'friendly' })
    expect(obs).toBeDefined()
  })
  it('generateObjectionScript', () => {
    const obs = ctrl.generateObjectionScript({ productId: 'prod-001', objectionType: 'price' })
    expect(obs).toBeDefined()
  })
  it('generateFollowUp', () => {
    const obs = ctrl.generateFollowUp({ customerId: 'cust-001' })
    expect(obs).toBeDefined()
  })
})

import { AiForecastController } from '../ai-forecast/ai-forecast.controller'
import { DemandForecastService, InventoryOptimizer, TransferRecommendationService } from '../ai-forecast/ai-forecast.service'

describe('AiForecastController Final', () => {
  const forecastService = new DemandForecastService()
  const inventoryOpt = new InventoryOptimizer(forecastService)
  const ctrl = new AiForecastController(forecastService, inventoryOpt, new TransferRecommendationService(inventoryOpt))

  it('forecastSales', () => {
    const r = ctrl.forecastSales({ productId: 'p1', daysAhead: 7 })
    expect(r.predictedSales).toBeGreaterThanOrEqual(0)
  })
  it('suggestReorder', () => {
    const r = ctrl.suggestReorder({ productId: 'p1' })
    expect(r.productId).toBe('p1')
  })
})
