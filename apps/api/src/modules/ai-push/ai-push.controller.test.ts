import { describe, it, expect, beforeEach } from 'vitest'
import { AiPushController } from './ai-push.controller'
import { PushTaskService } from './ai-push-task.service'
import { MemberSegmentationService, OptimalTimingService, ABTestService } from './ai-push.service'

describe('AiPushController', () => {
  let controller: AiPushController
  let pushTaskService: PushTaskService
  let memberSegmentationService: MemberSegmentationService
  let optimalTimingService: OptimalTimingService
  let abTestService: ABTestService

  beforeEach(() => {
    pushTaskService = new PushTaskService()
    memberSegmentationService = new MemberSegmentationService()
    optimalTimingService = new OptimalTimingService()
    abTestService = new ABTestService()

    controller = new AiPushController(
      pushTaskService,
      memberSegmentationService,
      optimalTimingService,
      abTestService,
    )
  })

  describe('POST /ai-push/tasks', () => {
    it('应该创建推送任务并返回', () => {
      const result = controller.createTask({
        title: 'test',
        content: 'test content',
        channel: 'push',
      })

      expect(result.id).toMatch(/^task-/)
      expect(result.title).toBe('test')
      expect(result.content).toBe('test content')
      expect(result.channel).toBe('push')
    })
  })

  describe('GET /ai-push/tasks', () => {
    it('空时应该返回空数组', () => {
      const result = controller.getTasks({})
      expect(result).toEqual([])
    })

    it('应该返回所有创建的任务', () => {
      controller.createTask({ title: 't1', content: 'c1', channel: 'push' })
      controller.createTask({ title: 't2', content: 'c2', channel: 'sms' })

      const result = controller.getTasks({})
      expect(result).toHaveLength(2)
    })
  })

  describe('POST /ai-push/experiments', () => {
    it('应该创建实验并返回', () => {
      const result = controller.createExperiment({
        name: 'A/B 测试',
        variants: [
          { name: '对照组', weight: 0.5, config: { color: 'red' } },
          { name: '实验组', weight: 0.5, config: { color: 'blue' } },
        ],
      })

      expect(result.name).toBe('A/B 测试')
      expect(result.variants).toHaveLength(2)
    })
  })

  describe('POST /ai-push/conversion', () => {
    it('应该记录转化并返回成功', () => {
      const result = controller.recordConversion({
        memberId: 'm1',
        experimentId: 'exp-001',
        variantName: 'A',
        event: 'conversion',
      })

      expect(result.success).toBe(true)
    })
  })

  describe('GET /ai-push/optimal-timing', () => {
    it('应该返回全局最优时段', () => {
      const result = controller.getOptimalTiming('push')
      expect(result.length).toBeGreaterThan(0)
      expect(result[0]).toHaveProperty('startHour')
      expect(result[0]).toHaveProperty('score')
    })
  })

  describe('POST /ai-push/segment-profile', () => {
    it('应该返回分群画像', () => {
      const result = controller.getSegmentProfile({ type: 'behavior', id: 'active' })

      expect(result.segmentType).toBe('behavior')
      expect(result.tags).toBeInstanceOf(Array)
    })
  })

  describe('GET /ai-push/stats', () => {
    it('空时应该返回零统计', () => {
      const result = controller.getStats({})
      expect(result.totalTasks).toBe(0)
      expect(result.totalRecords).toBe(0)
      expect(result.deliveryRate).toBe(0)
    })
  })

  describe('GET /ai-push/experiments/result', () => {
    it('不存在的实验应返回 undefined', () => {
      const result = controller.getExperimentResult('non-existent')
      expect(result).toBeUndefined()
    })
  })
})
