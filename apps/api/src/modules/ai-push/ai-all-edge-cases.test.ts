/**
 * ai-all-edge-cases.test.ts — 全部模块边界条件测试
 */
import { describe, it, expect } from 'vitest'
import { MemberSegmentationService, OptimalTimingService, ABTestService } from './ai-push.service'

describe('MemberSegmentationService Edge Cases', () => {
  const s = new MemberSegmentationService()

  it('空列表应返回空 Map', () => {
    const r = s.segmentByBehavior([])
    expect(r.size).toBe(0)
  })

  it('无数据会员应标记为 churned', () => {
    const r = s.segmentByBehavior(['ghost'])
    expect(r.get('ghost')).toBe('churned')
  })

  it('segmentByValue 极端值处理', () => {
    s.upsertBehavior({ memberId: 'rich', lastActiveAt: Date.now(), purchaseCount: 999, totalSpent: 999999, avgOrderValue: 10000, sessionCount: 500, lastPurchaseAt: Date.now(), churnDays: 0 })
    const r = s.segmentByValue(['rich'])
    expect(r.get('rich')).toBe('high')
  })
})

describe('OptimalTimingService Edge Cases', () => {
  const s = new OptimalTimingService()

  it('未知渠道应返回默认窗口', () => {
    const r = s.predictBestTime('m1', 'unknown-channel')
    expect(r.timestamp).toBeGreaterThan(0)
  })
})

describe('ABTestService Edge Cases', () => {
  const s = new ABTestService()

  it('空实验返回 undefined', () => {
    expect(s.getExperiment('nonexistent')).toBeUndefined()
    expect(s.getExperimentResult('nonexistent')).toBeUndefined()
  })

  it('单一变体实验', () => {
    s.createExperiment({ id: 'e1', name: 'test', variants: [{ name: 'A', weight: 100, config: {} }] })
    const a = s.assignVariant('m1', 'e1')
    expect(a!.variantName).toBe('A')
  })
})

describe('CDP & Memory', () => {
  it('AiDiagnosisService.resetStores clears data', () => {
    const { AiDiagnosisService } = require('./ai-diagnosis.service')
    AiDiagnosisService.resetStores()
    const service = new AiDiagnosisService.AiDiagnosisService()
    const { total } = service.listDiagnoses()
    expect(total).toBe(0)
  })

  it('PushTaskService.createTask generates unique IDs', () => {
    const { PushTaskService } = require('./ai-push-task-expanded.service')
    const s = new PushTaskService()
    const t1 = s.createTask({ title: 'A', content: 'B', channel: 'push' as any })
    const t2 = s.createTask({ title: 'A', content: 'B', channel: 'push' as any })
    expect(t1.id).not.toBe(t2.id)
  })
})

describe('Validate Data Types', () => {
  it('All service modules export valid constructors', () => {
    const modules = [
      './ai-push.service', './ai-push-task-expanded.service', './ai-push-analytics.service',
      './ai-diagnosis.service', './ai-diagnosis-advanced.service',
      './ai-insight.service', './ai-insight-advanced.service',
      './ai-forecast.service', './ai-forecast-insight.service',
      './ai-model-config.service', './ai-model-config-advanced.service',
      './ai-cs-advanced.service', './ai-sales-insight.service',
      './ai-review-advanced.service', './ai-rag-advanced.service',
      './ai-marketing-analytics.service', './ai-marketing-campaign-optimizer.service',
    ]
    for (const mod of modules) {
      const loaded = require(mod)
      const classes = Object.values(loaded).filter(v => typeof v === 'function')
      expect(classes.length).toBeGreaterThan(0)
    }
  })
})
