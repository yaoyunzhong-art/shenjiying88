/**
 * 🐜 自动: [ai-push] [D] e2e 补全
 *
 * 端到端流程测试：
 *   创建推送任务 → 分群推送 → A/B 实验创建 → 记录转化 → 查看实验结果 → 统计
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { AiPushController } from './ai-push.controller'
import { PushTaskService } from './ai-push-task.service'
import { MemberSegmentationService, OptimalTimingService, ABTestService } from './ai-push.service'
import type { PushTask } from './ai-push.entity'

describe('ai-push e2e', () => {
  let controller: AiPushController
  let pushTaskService: PushTaskService
  let abTestService: ABTestService

  beforeEach(() => {
    pushTaskService = new PushTaskService()
    abTestService = new ABTestService()
    controller = new AiPushController(
      pushTaskService,
      new MemberSegmentationService(),
      new OptimalTimingService(),
      abTestService,
    )
  })

  it('完整推送流程: 创建任务 → 触发推送 → 获取统计', () => {
    // 1. 创建推送任务
    const task: PushTask = controller.createTask({
      title: '双11大促通知',
      content: '全场5折起，点击抢购！',
      channel: 'push',
      targetMemberIds: ['m-001', 'm-002', 'm-003'],
      scheduledAt: Date.now() - 1000, // immediate
    })
    expect(task.status).toBe('sent')
    expect(task.id).toMatch(/^task-/)

    // 2. 查看任务列表
    const tasks = controller.getTasks({})
    expect(tasks).toHaveLength(1)
    expect(tasks[0].title).toBe('双11大促通知')

    // 3. 获取统计（此时还未生成记录）
    const stats = controller.getStats({})
    expect(stats.totalTasks).toBe(1)

    // 4. 创建第二个任务（定时任务）
    const future = Date.now() + 86400000
    const futureTask = controller.createTask({
      title: '明日推送',
      content: '明日活动提醒',
      channel: 'sms',
      targetMemberIds: ['m-004'],
      scheduledAt: future,
    })
    expect(futureTask.status).toBe('pending')

    // 5. 按状态筛选
    const sentTasks = controller.getTasks({ status: 'sent' })
    expect(sentTasks).toHaveLength(1)

    const pendingTasks = controller.getTasks({ status: 'pending' })
    expect(pendingTasks).toHaveLength(1)
  })

  it('完整实验流程: 创建实验 → 分配变体 → 记录转化 → 查看结果', () => {
    // 1. 创建 A/B 实验
    const experiment = controller.createExperiment({
      name: '推送文案风格测试',
      description: '比较正式版和口语化版推送文案的转化率',
      variants: [
        { name: '正式版', weight: 0.5, config: { tone: 'formal', emoji: false } },
        { name: '口语版', weight: 0.5, config: { tone: 'casual', emoji: true } },
      ],
      trafficSplit: 1.0,
    })
    expect(experiment.name).toBe('推送文案风格测试')
    expect(experiment.variants).toHaveLength(2)

    // 2. 模拟一批会员分配变体
    for (let i = 0; i < 200; i++) {
      const assignment = abTestService.assignVariant(`member-${i}`, experiment.id)
      // 部分会员可能不进组 (trafficSplit=1, 所以都进)
      expect(assignment).toBeDefined()
      if (assignment) {
        expect(['正式版', '口语版']).toContain(assignment.variantName)
      }
    }

    // 3. 记录几条转化为"口语版"
    for (let i = 0; i < 30; i++) {
      controller.recordConversion({
        memberId: `member-${i}`,
        experimentId: experiment.id,
        variantName: '口语版',
        event: 'conversion',
        value: 1,
      })
    }

    // 4. 记录几条转化为"正式版"
    for (let i = 100; i < 120; i++) {
      controller.recordConversion({
        memberId: `member-${i}`,
        experimentId: experiment.id,
        variantName: '正式版',
        event: 'conversion',
        value: 1,
      })
    }

    // 5. 查看实验结果
    const result = controller.getExperimentResult(experiment.id)
    expect(result).toBeDefined()
    expect(result!.experimentName).toBe('推送文案风格测试')
    expect(result!.variants).toHaveLength(2)
    // 总样本应接近 200（因为所有 member 都被分配了）
    expect(result!.totalSamples).toBeGreaterThanOrEqual(190)
    // 正式版样本数
    const formalVariant = result!.variants.find(v => v.name === '正式版')
    expect(formalVariant).toBeDefined()
    expect(formalVariant!.sampleCount).toBeGreaterThan(0)
  })

  it('完整分群画像流程: 查询分群画像 → 获取最优时段', () => {
    // 1. 查询行为分群画像
    const profile = controller.getSegmentProfile({ type: 'behavior', id: 'active' })
    expect(profile.segmentType).toBe('behavior')
    expect(profile.tags).toContain('复购')

    // 2. 获取最优推送时段
    const windows = controller.getOptimalTiming('push')
    expect(windows.length).toBeGreaterThan(0)
    expect(windows[0].channel).toBe('push')
    expect(windows[0].score).toBeGreaterThan(0)
  })

  it('异常流程: 分群推送不存在段位应返回默认画像', () => {
    const profile = controller.getSegmentProfile({ type: 'behavior', id: 'nonexistent' })
    expect(profile.segmentType).toBe('behavior')
    expect(profile.description).toBe('未知分群')
  })

  it('异常流程: 不存在的实验查询应返回 undefined', () => {
    const result = controller.getExperimentResult('exp-not-exist')
    expect(result).toBeUndefined()
  })

  it('边界: 超大 pageSize 应返回正确数量', () => {
    // 创建 150 个任务
    for (let i = 0; i < 150; i++) {
      controller.createTask({
        title: `task-${i}`,
        content: `content-${i}`,
        channel: 'push',
      })
    }

    const result = controller.getTasks({ page: 0, pageSize: 100 })
    expect(result).toHaveLength(100) // 受 pageSize 限制

    const page2 = controller.getTasks({ page: 1, pageSize: 100 })
    expect(page2).toHaveLength(50) // 剩余
  })
})
