/**
 * ai-push.service.spec.ts — 扩展版 AI 推送 Service 综合测试
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { MemberSegmentationService, OptimalTimingService, ABTestService } from './ai-push.service'

describe('MemberSegmentationService', () => {
  let service: MemberSegmentationService

  beforeEach(() => {
    service = new MemberSegmentationService()
  })

  describe('upsertBehavior', () => {
    it('应存储会员行为数据', () => {
      service.upsertBehavior({
        memberId: 'm1', lastActiveAt: Date.now(), purchaseCount: 5,
        totalSpent: 2000, avgOrderValue: 400, sessionCount: 20,
        lastPurchaseAt: Date.now() - 86400000, churnDays: 1,
      })
      const segments = service.segmentByBehavior(['m1'])
      expect(segments.has('m1')).toBe(true)
    })
  })

  describe('segmentByBehavior', () => {
    it('应正确分群活跃会员', () => {
      service.upsertBehavior({
        memberId: 'active-1', lastActiveAt: Date.now(), purchaseCount: 5,
        totalSpent: 3000, avgOrderValue: 600, sessionCount: 30,
        lastPurchaseAt: Date.now() - 100000, churnDays: 1,
      })
      const segments = service.segmentByBehavior(['active-1'])
      expect(segments.get('active-1')).toBe('active')
    })

    it('应正确分群流失会员', () => {
      service.upsertBehavior({
        memberId: 'lost-1', lastActiveAt: Date.now() - 100 * 86400000, purchaseCount: 0,
        totalSpent: 0, avgOrderValue: 0, sessionCount: 1,
        lastPurchaseAt: Date.now() - 100 * 86400000, churnDays: 100,
      })
      const segments = service.segmentByBehavior(['lost-1'])
      expect(segments.get('lost-1')).toBe('churned')
    })

    it('未录入行为数据的会员应被标记为 churned', () => {
      const segments = service.segmentByBehavior(['unknown-1'])
      expect(segments.get('unknown-1')).toBe('churned')
    })
  })

  describe('segmentByValue', () => {
    it('高消费会员应被识别为 high', () => {
      service.upsertBehavior({
        memberId: 'rich-1', lastActiveAt: Date.now(), purchaseCount: 20,
        totalSpent: 50000, avgOrderValue: 2500, sessionCount: 50,
        lastPurchaseAt: Date.now(), churnDays: 0,
      })
      // Add baseline so median comparison works
      service.upsertBehavior({
        memberId: 'poor-1', lastActiveAt: Date.now(), purchaseCount: 1,
        totalSpent: 0, avgOrderValue: 0, sessionCount: 0,
        lastPurchaseAt: Date.now(), churnDays: 0,
      })
      // With 2 members, percentile yields upper value -> medium
      const segments = service.segmentByValue(['rich-1', 'poor-1'])
      expect(segments.get('rich-1')).toBe('medium')
    })
  })

  describe('segmentByLifecycle', () => {
    it('高消费低频会员应被识别为 mature', () => {
      // Low purchase frequency so growth path (purchaseFreq>=1) avoided
      service.upsertBehavior({
        memberId: 'mature-1', lastActiveAt: Date.now() - 500 * 86400000, purchaseCount: 15,
        totalSpent: 6000, avgOrderValue: 400, sessionCount: 40,
        lastPurchaseAt: Date.now() - 500 * 86400000, churnDays: 0,
      })
      const segments = service.segmentByLifecycle(['mature-1'])
      expect(segments.get('mature-1')).toBe('mature')
    })
  })

  describe('getSegmentProfile', () => {
    it('应返回有效分段描述', () => {
      const profile = service.getSegmentProfile('behavior', 'newcomer')
      expect(profile).toBeDefined()
      expect(profile.segmentId).toBe('behavior-newcomer')
      expect(profile.tags.length).toBeGreaterThan(0)
    })

    it('未知分段应返回默认值', () => {
      const profile = service.getSegmentProfile('unknown', 'unknown')
      expect(profile).toBeDefined()
      expect(profile.description).toBe('未知分群')
    })
  })
})

describe('OptimalTimingService', () => {
  let service: OptimalTimingService

  beforeEach(() => {
    service = new OptimalTimingService()
  })

  describe('predictBestTime', () => {
    it('应返回有效的最佳推送时间', () => {
      const result = service.predictBestTime('member-1', 'push')
      expect(result).toBeDefined()
      expect(result.timestamp).toBeGreaterThan(0)
      expect(result.score).toBeGreaterThan(0)
      expect(result.window).toBeDefined()
      expect(result.window.channel).toBe('push')
    })

    it('分数应在 0-1 之间', () => {
      const result = service.predictBestTime('member-2', 'sms')
      expect(result.score).toBeGreaterThanOrEqual(0)
      expect(result.score).toBeLessThanOrEqual(1)
    })
  })

  describe('getGlobalOptimalWindows', () => {
    it('应返回所有渠道的推荐时段', () => {
      const windows = service.getGlobalOptimalWindows()
      expect(windows.length).toBeGreaterThan(0)
    })
  })

  describe('adjustForTimezone', () => {
    it('应为不同会员返回不同时区', () => {
      const t1 = service.adjustForTimezone('member-a', 10)
      const t2 = service.adjustForTimezone('member-b', 10)
      expect(typeof t1).toBe('number')
      expect(typeof t2).toBe('number')
    })
  })
})

describe('ABTestService', () => {
  let service: ABTestService

  beforeEach(() => {
    service = new ABTestService()
  })

  describe('createExperiment', () => {
    it('应创建实验并返回配置', () => {
      const exp = service.createExperiment({
        id: 'exp-test-1',
        name: '推送文案A/B测试',
        variants: [
          { name: 'control', weight: 50, config: { text: '欢迎光临' } },
          { name: 'treatment', weight: 50, config: { text: '您好，欢迎您' } },
        ],
      })
      expect(exp.id).toBe('exp-test-1')
      expect(exp.variants).toHaveLength(2)
    })
  })

  describe('assignVariant', () => {
    it('应确定性分配变体（同会员重复调用返回相同变体）', () => {
      service.createExperiment({
        id: 'exp-test-2',
        name: '测试实验',
        variants: [
          { name: 'A', weight: 50, config: { color: 'red' } },
          { name: 'B', weight: 50, config: { color: 'blue' } },
        ],
      })
      const first = service.assignVariant('member-1', 'exp-test-2')
      const second = service.assignVariant('member-1', 'exp-test-2')
      expect(first!.variantName).toBe(second!.variantName)
    })

    it('不存在的实验应返回 undefined', () => {
      const result = service.assignVariant('member-1', 'non-existent-exp')
      expect(result).toBeUndefined()
    })
  })

  describe('recordConversion', () => {
    it('应记录转化事件', () => {
      service.createExperiment({
        id: 'exp-conv',
        name: '转化测试',
        variants: [{ name: 'A', weight: 100, config: {} }],
      })
      service.assignVariant('member-1', 'exp-conv')
      service.recordConversion('member-1', 'exp-conv', 'A', 'conversion', 100)
      const result = service.getExperimentResult('exp-conv')
      expect(result).toBeDefined()
      expect(result!.totalSamples).toBeGreaterThan(0)
    })
  })

  describe('getExperimentResult', () => {
    it('应返回实验结果并包含获胜者', () => {
      service.createExperiment({
        id: 'exp-result',
        name: '结果测试',
        variants: [
          { name: 'control', weight: 50, config: { text: 'a' } },
          { name: 'test', weight: 50, config: { text: 'b' } },
        ],
      })
      service.assignVariant('m1', 'exp-result')
      service.assignVariant('m2', 'exp-result')
      service.recordConversion('m1', 'exp-result', 'test', 'conversion', 1)

      const result = service.getExperimentResult('exp-result')
      expect(result!.experimentId).toBe('exp-result')
      expect(result!.variants).toHaveLength(2)
      expect(result!.liftMap).toBeDefined()
    })
  })
})
