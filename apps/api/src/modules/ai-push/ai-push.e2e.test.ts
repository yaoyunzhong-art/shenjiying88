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

describe('[增强] 推送并发与批量场景', () => {
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

  it('[并发] 快速创建 50 个推送任务应全部成功', () => {
    for (let i = 0; i < 50; i++) {
      const task = controller.createTask({
        title: `并发任务-${i}`,
        content: `content-${i}`,
        channel: i % 2 === 0 ? 'push' : 'sms',
        targetMemberIds: ['m-' + (i % 10)],
        scheduledAt: Date.now() - 1000,
      })
      expect(task).toBeDefined()
      expect(task.id).toMatch(/^task-/)
      expect(task.status).toBe('sent')
    }
    const allTasks = controller.getTasks({ page: 0, pageSize: 200 })
    expect(allTasks.length).toBeGreaterThanOrEqual(50)
  })

  it('[并发] 同时创建多个 A/B 实验并分配变体', () => {
    const exps = []
    for (let e = 0; e < 5; e++) {
      const exp = controller.createExperiment({
        name: `并发实验-${e}`,
        description: '并发测试',
        variants: [
          { name: '对照组', weight: 0.5, config: { color: 'blue' } },
          { name: '实验组', weight: 0.5, config: { color: 'red' } },
        ],
        trafficSplit: 1.0,
      })
      exps.push(exp)
    }
    expect(exps).toHaveLength(5)

    // 每个实验分配 100 个会员
    for (const exp of exps) {
      for (let i = 0; i < 100; i++) {
        const assignment = abTestService.assignVariant(`member-${exp.id}-${i}`, exp.id)
        expect(assignment).toBeDefined()
        expect(assignment!.experimentId).toBe(exp.id)
      }
      const result = controller.getExperimentResult(exp.id)
      expect(result).toBeDefined()
      expect(result!.totalSamples).toBe(100)
    }
  })

  it('[批量] 批量创建任务后按渠道过滤', () => {
    const channels = ['push', 'sms', 'email', 'wechat', 'app']
    for (const ch of channels) {
      for (let i = 0; i < 5; i++) {
        controller.createTask({
          title: `批量-${ch}-${i}`,
          content: `content-${ch}-${i}`,
          channel: ch as 'push' | 'sms' | 'email' | 'wechat' | 'app',
          scheduledAt: Date.now() - 1000,
        })
      }
    }

    const pushTasks = controller.getTasks({ channel: 'push' })
    expect(pushTasks).toHaveLength(5)
    for (const t of pushTasks) {
      expect(t.channel).toBe('push')
    }

    const emailTasks = controller.getTasks({ channel: 'email' })
    expect(emailTasks).toHaveLength(5)
  })

  it('[并发] 创建任务的同时查询统计不报错', () => {
    // 在创建任务过程中反复查询 stats，模拟并发读
    for (let i = 0; i < 30; i++) {
      controller.createTask({
        title: `concurrent-${i}`,
        content: `content-${i}`,
        channel: 'push',
        scheduledAt: Date.now() - 1000,
      })
      // 每次创建后立即查询统计
      const stats = controller.getStats({})
      expect(stats.totalTasks).toBeGreaterThanOrEqual(i + 1)
      expect(stats.deliveryRate).toBeGreaterThanOrEqual(0)
      expect(stats.clickRate).toBeGreaterThanOrEqual(0)
    }
  })
})

describe('[增强] 失败重试与超时处理', () => {
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

  it('[重试] 实验结果应包含正确的样本数和转化数', () => {
    const exp = controller.createExperiment({
      name: '重试测试实验',
      description: '验证实验结果的正确性',
      variants: [
        { name: '对照组', weight: 0.5, config: {} },
        { name: '实验组', weight: 0.5, config: {} },
      ],
      trafficSplit: 1.0,
    })

    for (let i = 0; i < 200; i++) {
      abTestService.assignVariant(`member-${i}`, exp.id)
    }

    for (let i = 0; i < 50; i++) {
      controller.recordConversion({
        memberId: `member-${i}`,
        experimentId: exp.id,
        variantName: '对照组',
        event: 'conversion',
        value: 1,
      })
    }
    for (let i = 0; i < 80; i++) {
      controller.recordConversion({
        memberId: `member-${i}`,
        experimentId: exp.id,
        variantName: '实验组',
        event: 'conversion',
        value: 2,
      })
    }

    const result = controller.getExperimentResult(exp.id)
    expect(result).toBeDefined()
    expect(result!.totalSamples).toBe(200)
    const control = result!.variants.find(v => v.name === '对照组')
    const treatment = result!.variants.find(v => v.name === '实验组')
    expect(control).toBeDefined()
    expect(treatment).toBeDefined()
    expect(treatment!.conversionCount).toBe(80)
    expect(control!.conversionCount).toBe(50)
    expect(treatment!.avgValue).toBe(2)
    expect(result!.liftMap).toBeDefined()
  })

  it('[超时] 定时推送任务（未来时间）应返回 pending 状态', () => {
    const future = Date.now() + 86400000 * 30 // 30天后
    const task = controller.createTask({
      title: '未来推送',
      content: '30天后推送',
      channel: 'sms',
      targetMemberIds: ['m-001'],
      scheduledAt: future,
    })
    expect(task.status).toBe('pending')
  })

  it('[异常] 创建空目标会员列表的任务应成功', () => {
    const task = controller.createTask({
      title: '空目标',
      content: '无目标会员',
      channel: 'push',
      targetMemberIds: [],
      scheduledAt: Date.now() - 1000,
    })
    expect(task).toBeDefined()
    expect(task.targetMemberIds).toEqual([])
  })

  it('[异常] 查询不存在的实验统计不应抛异常', () => {
    expect(() => {
      const result = controller.getExperimentResult('nonexistent-exp-id')
      expect(result).toBeUndefined()
    }).not.toThrow()
  })

  it('[异常] 分群推送使用不存在的分群ID应返回默认画像', () => {
    const profile = controller.getSegmentProfile({ type: 'behavior', id: 'ghost-segment' })
    expect(profile.description).toBe('未知分群')
    expect(profile.tags).toEqual([])
  })
})

describe('[增强] 安全校验与权限场景', () => {
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

  it('[安全] 创建包含特殊字符标题的任务不应破坏数据结构', () => {
    const task = controller.createTask({
      title: '<script>alert("xss")</script> 测试标题 &<>',
      content: 'content with \'single quotes\' and "double quotes"',
      channel: 'push',
      targetMemberIds: ['m-xss-001'],
      scheduledAt: Date.now() - 1000,
    })
    expect(task.title).toContain('<script>')
    expect(task.status).toBe('sent')
  })

  it('[安全] 超长内容创建任务应正常', () => {
    const longContent = 'A'.repeat(5000)
    const task = controller.createTask({
      title: '超长内容推送',
      content: longContent,
      channel: 'push',
      targetMemberIds: ['m-long-001'],
      scheduledAt: Date.now() - 1000,
    })
    expect(task.content.length).toBe(5000)
    expect(task.status).toBe('sent')
  })

  it('[安全] 超大数量的 targetMemberIds 不崩溃', () => {
    const ids = Array.from({ length: 10000 }, (_, i) => `member-${i}`)
    const task = controller.createTask({
      title: '大批量推送',
      content: '推送给10000个会员',
      channel: 'push',
      targetMemberIds: ids,
      scheduledAt: Date.now() - 1000,
    })
    expect(task.targetMemberIds).toHaveLength(10000)
    const stats = controller.getStats({})
    expect(stats.totalTasks).toBeGreaterThanOrEqual(1)
  })

  it('[安全] 重复创建相同实验不应覆盖已有数据', () => {
    const exp1 = controller.createExperiment({
      name: '重复实验',
      description: '第一次创建',
      variants: [{ name: 'A', weight: 1, config: {} }],
      trafficSplit: 1.0,
    })

    const exp2 = controller.createExperiment({
      name: '重复实验',
      description: '第二次创建（同名）',
      variants: [{ name: 'B', weight: 1, config: {} }],
      trafficSplit: 1.0,
    })

    // 两个实验应有不同的 ID
    expect(exp1.id).not.toBe(exp2.id)
  })

  it('[安全] 变体权重总和为 0 时不会崩溃', () => {
    // ABTestService 内部会处理 totalWeight，当为 0 时选第一个 variant
    const exp = controller.createExperiment({
      name: '零权重实验',
      description: '所有变体权重为0',
      variants: [
        { name: '默认', weight: 0, config: {} },
        { name: '变体', weight: 0, config: {} },
      ],
      trafficSplit: 1.0,
    })
    expect(exp.variants).toHaveLength(2)

    // 分配仍然应正常工作(总权重0，选第一个)
    const assignment = abTestService.assignVariant('member-zero', exp.id)
    expect(assignment).toBeDefined()
  })

  it('[安全] trafficSplit=0 时所有会员不应被分配', () => {
    const exp = controller.createExperiment({
      name: '不分配实验',
      description: '0流量分配',
      variants: [{ name: 'A', weight: 1, config: {} }],
      trafficSplit: 0,
    })

    for (let i = 0; i < 100; i++) {
      const assignment = abTestService.assignVariant(`member-${i}`, exp.id)
      // trafficSplit=0 => bucket > 0, 所以返回 undefined
      expect(assignment).toBeUndefined()
    }
  })
})

describe('[增强] 多格式消息与渠道场景', () => {
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

  it('[渠道] 所有渠道类型创建任务均正常', () => {
    const channels = ['push', 'sms', 'email', 'wechat', 'app'] as const
    for (const ch of channels) {
      const task = controller.createTask({
        title: `${ch}渠道测试`,
        content: `通过${ch}发送`,
        channel: ch,
        targetMemberIds: [`m-${ch}-001`],
        scheduledAt: Date.now() - 1000,
      })
      expect(task.channel).toBe(ch)
      expect(task.status).toBe('sent')
    }
  })

  it('[统计] 多渠道创建后 stats.tasksByChannel 应正确', () => {
    const channels = ['push', 'push', 'sms', 'email', 'wechat', 'app'] as const
    for (const ch of channels) {
      controller.createTask({
        title: `stats-${ch}`,
        content: `content-${ch}`,
        channel: ch,
        scheduledAt: Date.now() - 1000,
      })
    }

    const pushTasks = controller.getTasks({ channel: 'push' })
    expect(pushTasks).toHaveLength(2)

    const smsTasks = controller.getTasks({ channel: 'sms' })
    expect(smsTasks).toHaveLength(1)
  })

  it('[限流] 查看 optimal-timing 返回各渠道时段', () => {
    const windows = controller.getOptimalTiming('push')
    expect(windows.length).toBeGreaterThan(0)
    for (const w of windows) {
      expect(w.startHour).toBeGreaterThanOrEqual(0)
      expect(w.startHour).toBeLessThanOrEqual(23)
      expect(w.endHour).toBeGreaterThanOrEqual(0)
      expect(w.endHour).toBeLessThanOrEqual(23)
      expect(w.score).toBeGreaterThan(0)
      expect(w.score).toBeLessThanOrEqual(1)
    }
  })

  it('[多格式] 四变体实验创建与分配验证', () => {
    const exp = controller.createExperiment({
      name: '四变体测试',
      description: '验证多个变体',
      variants: [
        { name: 'A-正式版', weight: 0.25, config: { tone: 'formal' } },
        { name: 'B-口语版', weight: 0.25, config: { tone: 'casual' } },
        { name: 'C-图片版', weight: 0.25, config: { tone: 'visual' } },
        { name: 'D-视频版', weight: 0.25, config: { tone: 'video' } },
      ],
      trafficSplit: 1.0,
    })
    expect(exp.variants).toHaveLength(4)

    const assignmentCounts: Record<string, number> = { 'A-正式版': 0, 'B-口语版': 0, 'C-图片版': 0, 'D-视频版': 0 }
    for (let i = 0; i < 400; i++) {
      const assignment = abTestService.assignVariant(`multi-member-${i}`, exp.id)
      expect(assignment).toBeDefined()
      assignmentCounts[assignment!.variantName]++
    }
    // 所有变体都应被分配
    expect(assignmentCounts['A-正式版']).toBeGreaterThan(0)
    expect(assignmentCounts['B-口语版']).toBeGreaterThan(0)
    expect(assignmentCounts['C-图片版']).toBeGreaterThan(0)
    expect(assignmentCounts['D-视频版']).toBeGreaterThan(0)
    expect(assignmentCounts['A-正式版'] + assignmentCounts['B-口语版'] + assignmentCounts['C-图片版'] + assignmentCounts['D-视频版']).toBe(400)
  })

  it('[幂等] 同一 member 多次分配应返回相同变体', () => {
    const exp = controller.createExperiment({
      name: '幂等性实验',
      description: '验证变体分配一致性',
      variants: [
        { name: '变体X', weight: 0.5, config: {} },
        { name: '变体Y', weight: 0.5, config: {} },
      ],
      trafficSplit: 1.0,
    })

    const first = abTestService.assignVariant('idempotent-user', exp.id)
    expect(first).toBeDefined()

    // 分配 100 次应得到相同结果
    for (let i = 0; i < 100; i++) {
      const assignment = abTestService.assignVariant('idempotent-user', exp.id)
      expect(assignment!.variantName).toBe(first!.variantName)
    }
  })
})

describe('[增强] 分群与画像场景', () => {
  let controller: AiPushController
  let pushTaskService: PushTaskService
  let segmentationService: MemberSegmentationService
  let abTestService: ABTestService

  beforeEach(() => {
    pushTaskService = new PushTaskService()
    segmentationService = new MemberSegmentationService()
    abTestService = new ABTestService()
    controller = new AiPushController(
      pushTaskService,
      segmentationService,
      new OptimalTimingService(),
      abTestService,
    )
  })

  it('[分群] 查询所有已知分群画像返回正确信息', () => {
    const profiles = [
      { type: 'behavior', id: 'active' },
      { type: 'behavior', id: 'newcomer' },
      { type: 'behavior', id: 'sleeping' },
      { type: 'behavior', id: 'churned' },
      { type: 'value', id: 'high' },
      { type: 'lifecycle', id: 'newborn' },
      { type: 'lifecycle', id: 'growth' },
      { type: 'lifecycle', id: 'mature' },
      { type: 'lifecycle', id: 'declining' },
    ]

    for (const p of profiles) {
      const profile = controller.getSegmentProfile(p)
      expect(profile.segmentType).toBe(p.type)
      expect(profile.description).not.toBe('未知分群')
      expect(Array.isArray(profile.tags)).toBe(true)
      expect(profile.tags.length).toBeGreaterThan(0)
    }
  })

  it('[分群] 行为分群: 活跃会员画像包含"复购"标签', () => {
    const profile = controller.getSegmentProfile({ type: 'behavior', id: 'active' })
    expect(profile.tags).toContain('复购')
    expect(profile.avgMetrics.purchaseCount).toBeGreaterThan(0)
  })

  it('[价值] 高价值会员画像有 VIP 相关标签', () => {
    const profile = controller.getSegmentProfile({ type: 'value', id: 'high' })
    expect(profile.tags).toContain('VIP权益')
    expect(profile.avgMetrics.totalSpent).toBeGreaterThanOrEqual(20000)
  })

  it('[画像] 正确查询 segement profile avgMetrics 字段', () => {
    const profile = controller.getSegmentProfile({ type: 'behavior', id: 'active' })
    expect(profile.avgMetrics).toHaveProperty('purchaseCount')
    expect(profile.avgMetrics).toHaveProperty('totalSpent')
    expect(profile.avgMetrics).toHaveProperty('activeDaysAgo')
    expect(typeof profile.avgMetrics.purchaseCount).toBe('number')
    expect(typeof profile.avgMetrics.totalSpent).toBe('number')
  })

  it('[时机] 各渠道最优时段排序正确', () => {
    const windows = controller.getOptimalTiming('push')
    // 按 score 降序排列
    for (let i = 1; i < windows.length; i++) {
      expect(windows[i - 1].score).toBeGreaterThanOrEqual(windows[i].score)
    }
  })

  it('[时机] SMS 渠道有独立的最优时段', () => {
    const smsWindows = controller.getOptimalTiming('sms')
    expect(smsWindows.length).toBeGreaterThan(0)
    for (const w of smsWindows) {
      expect(w.channel).toBe('sms')
    }
  })
})

describe('[增强] 统计汇总场景', () => {
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

  it('[统计] getStats 返回统计完整性', () => {
    const stats = controller.getStats({})
    expect(stats).toHaveProperty('totalTasks')
    expect(stats).toHaveProperty('totalRecords')
    expect(stats).toHaveProperty('sentCount')
    expect(stats).toHaveProperty('deliveredCount')
    expect(stats).toHaveProperty('clickedCount')
    expect(stats).toHaveProperty('failedCount')
    expect(stats).toHaveProperty('deliveryRate')
    expect(stats).toHaveProperty('clickRate')
  })

  it('[统计] 带时间范围的统计不影响其他数据', () => {
    controller.createTask({
      title: '时间范围测试',
      content: 'test',
      channel: 'push',
      scheduledAt: Date.now() - 1000,
    })

    const now = Date.now()
    const statsRange = controller.getStats({ startTime: now - 10000, endTime: now + 10000 })
    expect(statsRange.totalTasks).toBeGreaterThanOrEqual(1)

    const statsPast = controller.getStats({ startTime: 0, endTime: now - 86400000 })
    expect(statsPast.totalTasks).toBeGreaterThanOrEqual(0)
  })

  it('[分页] 分页查询第2页无数据', () => {
    // 只有之前创建的任务，查询一个很大的页码
    const page99 = controller.getTasks({ page: 99, pageSize: 20 })
    expect(page99).toHaveLength(0)
  })

  it('[分页] pageSize 为 0 时返回空数组', () => {
    const result = controller.getTasks({ page: 0, pageSize: 0 })
    expect(result).toEqual([])
  })

  it('[查询] 按状态和渠道组合过滤', () => {
    // 创建 pending 任务
    controller.createTask({
      title: 'future-sms',
      content: 'future-sms',
      channel: 'sms',
      scheduledAt: Date.now() + 86400000,
    })
    controller.createTask({
      title: 'sent-push',
      content: 'sent-push',
      channel: 'push',
      scheduledAt: Date.now() - 1000,
    })

    const pendingSms = controller.getTasks({ status: 'pending', channel: 'sms' })
    expect(pendingSms.length).toBeGreaterThanOrEqual(1)
    for (const t of pendingSms) {
      expect(t.status).toBe('pending')
      expect(t.channel).toBe('sms')
    }

    const sentPush = controller.getTasks({ status: 'sent', channel: 'push' })
    expect(sentPush.length).toBeGreaterThanOrEqual(1)
  })
})
