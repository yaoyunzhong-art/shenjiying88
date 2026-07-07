import { describe, it, expect, beforeEach } from 'vitest'
/**
 * 🐜 自动: [ai-push] [C] 角色测试
 *
 * 8 角色视角的 ai-push 模块测试：
 * 👔店长 🛒前台 👥HR 🔧安监 🎮导玩员 🎯运行专员 🤝团建  📢营销
 *
 * 每个角色至少 2 个测试用例（正常流程 + 权限边界）
 */

import { PushTaskService } from './ai-push-task.service'
import { MemberSegmentationService, OptimalTimingService, ABTestService } from './ai-push.service'

// ── 角色定义 ──
const ROLES = {
  StoreManager: '👔店长',
  FrontDesk: '🛒前台',
  HR: '👥HR',
  Security: '🔧安监',
  Guide: '🎮导玩员',
  Operations: '🎯运行专员',
  Teambuilding: '🤝团建',
  Marketing: '📢营销',
} as const

// ── 测试数据工厂 ──
const dayMs = 86400000

function setupServices() {
  return {
    pushTaskService: new PushTaskService(),
    memberSegmentService: new MemberSegmentationService(),
    optimalTimingService: new OptimalTimingService(),
    abTestService: new ABTestService(),
  }
}

function createTestBehavior(memberId: string, overrides: Record<string, unknown> = {}) {
  const now = Date.now()
  return {
    memberId,
    lastActiveAt: now - 10 * dayMs,
    purchaseCount: 0,
    totalSpent: 0,
    avgOrderValue: 0,
    sessionCount: 0,
    lastPurchaseAt: now - 10 * dayMs,
    churnDays: 10,
    ...overrides,
  } as any
}

function createDefaultTask(taskSvc: PushTaskService, overrides: Record<string, unknown> = {}) {
  return taskSvc.createTask({
    title: '限时优惠通知',
    content: '今日限时优惠已开启，快来参与吧',
    channel: 'push',
    targetMemberIds: [],
    scheduledAt: Date.now(),
    ...overrides,
  } as any)
}

// ══════════════════════════════════════════════════════════════════════════════
// 👔 店长视角 - 店长关注推送任务整体状态、统计数据、分群画像概览
// ══════════════════════════════════════════════════════════════════════════════

describe('👔店长视角 - ai-push 模块', () => {
  let svc: ReturnType<typeof setupServices>

  beforeEach(() => {
    svc = setupServices()
  })

  it('[店长-1] 正常流程: 店长可以创建推送任务并查看创建的推送任务列表', () => {
    createDefaultTask(svc.pushTaskService, { title: '开业庆典通知' })
    createDefaultTask(svc.pushTaskService, { title: '会员日优惠' })

    const tasks = svc.pushTaskService.getTasks({ page: 0, pageSize: 20 })
    expect(tasks).toHaveLength(2)
    const titles = tasks.map(t => t.title)
    expect(titles).toContain('开业庆典通知')
    expect(titles).toContain('会员日优惠')
    tasks.forEach(t => expect(t.id).toMatch(/^task-/))
  })

  it('[店长-2] 边界: 店长查询空列表应返回空数组而非抛异常', () => {
    const tasks = svc.pushTaskService.getTasks({ page: 0, pageSize: 20 })
    expect(tasks).toEqual([])
  })

  it('[店长-3] 正常流程: 店长可以按渠道筛选推送任务', () => {
    createDefaultTask(svc.pushTaskService, { title: 'App推送', channel: 'app' })
    createDefaultTask(svc.pushTaskService, { title: '短信通知', channel: 'sms' })
    createDefaultTask(svc.pushTaskService, { title: 'Push通知', channel: 'push' })

    const appTasks = svc.pushTaskService.getTasks({ channel: 'app', page: 0, pageSize: 20 })
    expect(appTasks).toHaveLength(1)
    expect(appTasks[0].title).toBe('App推送')

    const smsTasks = svc.pushTaskService.getTasks({ channel: 'sms', page: 0, pageSize: 20 })
    expect(smsTasks).toHaveLength(1)
    expect(smsTasks[0].title).toBe('短信通知')
  })

  it('[店长-4] 正常流程: 店长可以获取推送统计概览', () => {
    const task = createDefaultTask(svc.pushTaskService)
    svc.pushTaskService.sendPush(task.id, ['m1', 'm2', 'm3'])

    const stats = svc.pushTaskService.getStats()
    expect(stats.totalTasks).toBe(1)
    expect(stats.totalRecords).toBe(3)
    expect(stats.sentCount).toBe(3)
    expect(stats.deliveryRate).toBe(0)
    expect(stats.clickRate).toBe(0)
  })
})

// ══════════════════════════════════════════════════════════════════════════════
// 🛒 前台视角 - 前台关心推送任务创建、触达率确认
// ══════════════════════════════════════════════════════════════════════════════

describe('🛒前台视角 - ai-push 模块', () => {
  let svc: ReturnType<typeof setupServices>

  beforeEach(() => {
    svc = setupServices()
  })

  it('[前台-1] 正常流程: 前台可以创建推送任务并立即发送', () => {
    const task = createDefaultTask(svc.pushTaskService, {
      title: '今日活动提醒',
      content: '下午三点有抽奖活动',
      channel: 'push',
      targetMemberIds: ['u001', 'u002', 'u003'],
    })

    expect(task.status).toBe('sent') // scheduledAt <= now 标记已发送
    expect(task.targetMemberIds).toHaveLength(3)
    expect(task.sentAt).toBeDefined()
  })

  it('[前台-2] 边界: 前台创建未来时间的推送任务状态应为 pending', () => {
    const futureTime = Date.now() + 24 * 60 * 60 * 1000
    const task = createDefaultTask(svc.pushTaskService, {
      title: '明日活动提醒',
      scheduledAt: futureTime,
    })

    expect(task.status).toBe('pending')
    expect(task.sentAt).toBeUndefined()
  })

  it('[前台-3] 正常流程: 前台可以发送推送并生成记录', () => {
    const task = createDefaultTask(svc.pushTaskService, {
      scheduledAt: Date.now() + 24 * 60 * 60 * 1000, // 未来任务，先 pending
    })
    expect(task.status).toBe('pending')

    svc.pushTaskService.sendPush(task.id, ['u001', 'u002'])
    const stats = svc.pushTaskService.getStats()
    expect(stats.totalRecords).toBe(2)
  })
})

// ══════════════════════════════════════════════════════════════════════════════
// 👥HR 视角 - HR 关注分群推送的精准性、会员行为分群
// ══════════════════════════════════════════════════════════════════════════════

describe('👥HR视角 - ai-push 模块', () => {
  let svc: ReturnType<typeof setupServices>

  beforeEach(() => {
    svc = setupServices()
  })

  it('[HR-1] 正常流程: HR 可以通过行为分群识别高活跃会员', () => {
    const now = Date.now()
    svc.memberSegmentService.upsertBehavior(createTestBehavior('mem-active', {
      lastActiveAt: now - 5 * dayMs,
      purchaseCount: 10,
      totalSpent: 5000,
      lastPurchaseAt: now - 2 * dayMs,
    }))

    const result = svc.memberSegmentService.segmentByBehavior(['mem-active'])
    expect(result.get('mem-active')).toBe('active')
  })

  it('[HR-2] 边界: HR 查询沉默会员应被正确分类', () => {
    const now = Date.now()
    svc.memberSegmentService.upsertBehavior(createTestBehavior('mem-sleep', {
      lastActiveAt: now - 60 * dayMs,
      purchaseCount: 1,
      totalSpent: 100,
      lastPurchaseAt: now - 60 * dayMs,
    }))

    const result = svc.memberSegmentService.segmentByBehavior(['mem-sleep'])
    expect(result.get('mem-sleep')).toBe('sleeping')
  })

  it('[HR-3] 正常流程: HR 可以计算 RFM 评分来识别高价值会员', () => {
    const now = Date.now()
    svc.memberSegmentService.upsertBehavior(createTestBehavior('mem-vip', {
      lastActiveAt: now - 7 * dayMs,
      purchaseCount: 15,
      totalSpent: 10000,
      lastPurchaseAt: now - 7 * dayMs,
    }))

    const rfm = svc.memberSegmentService.computeRFM('mem-vip')
    // recency: 7天 => recencyScore = 6 - ceil(7/30) = 6-1 = 5
    // frequency: 15 => frequencyScore = ceil(15/3) = 5
    // monetary: 10000 => monetaryScore = ceil(10000/500) = 5
    expect(rfm.recencyScore).toBe(5)
    expect(rfm.frequencyScore).toBe(5)
    expect(rfm.monetaryScore).toBe(5)
    expect(rfm.totalScore).toBe(15)
  })

  it('[HR-4] 正常流程: HR 可以分生命周期查看会员分布', () => {
    const now = Date.now()
    svc.memberSegmentService.upsertBehavior(createTestBehavior('mem-new', {
      lastActiveAt: now - 3 * dayMs,
      purchaseCount: 0,
      lastPurchaseAt: now - 3 * dayMs,
    }))
    svc.memberSegmentService.upsertBehavior(createTestBehavior('mem-growth', {
      lastActiveAt: now - 10 * dayMs,
      purchaseCount: 6,
      totalSpent: 2000,
      lastPurchaseAt: now - 10 * dayMs,
    }))

    const lifecycle = svc.memberSegmentService.segmentByLifecycle(['mem-new', 'mem-growth'])
    expect(lifecycle.get('mem-new')).toBe('newborn')
    expect(lifecycle.get('mem-growth')).toBe('growth')
  })
})

// ══════════════════════════════════════════════════════════════════════════════
// 🔧安监视角 - 安监关心推送内容安全性、异常行为检测
// ══════════════════════════════════════════════════════════════════════════════

describe('🔧安监视角 - ai-push 模块', () => {
  let svc: ReturnType<typeof setupServices>

  beforeEach(() => {
    svc = setupServices()
  })

  it('[安监-1] 正常流程: 安监可以查询推送历史中的失败记录', () => {
    createDefaultTask(svc.pushTaskService, { title: '消息推送' })
    const stats = svc.pushTaskService.getStats()
    expect(stats.failedCount).toBe(0)
    expect(stats.failedCount).toBeGreaterThanOrEqual(0)
  })

  it('[安监-2] 边界: 安监查询不存在的推送任务应返回 undefined 而非抛异常', () => {
    const task = svc.pushTaskService.getTask('nonexistent-task')
    expect(task).toBeUndefined()
  })

  it('[安监-3] 正常流程: 安监可以通过分群画像快速了解各分群特征', () => {
    const profile = svc.memberSegmentService.getSegmentProfile('behavior', 'churned')
    expect(profile.segmentType).toBe('behavior')
    expect(profile.tags).toContain('流失召回')
    expect(profile.description).toContain('流失')
  })
})

// ══════════════════════════════════════════════════════════════════════════════
// 🎮导玩员视角 - 导玩员关心推送时机优化、A/B 实验变体分配
// ══════════════════════════════════════════════════════════════════════════════

describe('🎮导玩员视角 - ai-push 模块', () => {
  let svc: ReturnType<typeof setupServices>

  beforeEach(() => {
    svc = setupServices()
  })

  it('[导玩员-1] 正常流程: 导玩员可以获取全局最优推送时段', () => {
    const windows = svc.optimalTimingService.getGlobalOptimalWindows()
    expect(windows.length).toBeGreaterThan(0)
    // 按分数降序排列
    for (let i = 1; i < windows.length; i++) {
      expect(windows[i - 1].score).toBeGreaterThanOrEqual(windows[i].score)
    }
  })

  it('[导玩员-2] 边界: 导玩员查询不存在的会员预测时间不抛异常', () => {
    const prediction = svc.optimalTimingService.predictBestTime('new-member', 'push')
    expect(prediction.timestamp).toBeGreaterThan(0)
    expect(prediction.score).toBeGreaterThan(0)
    expect(prediction.window).toBeDefined()
  })

  it('[导玩员-3] 正常流程: 导玩员可以创建实验并验证 A/B 分配幂等性', () => {
    const exp = svc.abTestService.createExperiment({
      id: 'exp-guide-001',
      name: '推送文案测试',
      variants: [
        { name: 'A-简洁版', weight: 0.5, config: { style: 'short' } },
        { name: 'B-详细版', weight: 0.5, config: { style: 'long' } },
      ],
    })
    expect(exp.variants).toHaveLength(2)

    // 幂等性: 同一会员多次分配应得到相同变体
    const assign1 = svc.abTestService.assignVariant('mem-guide-001', 'exp-guide-001')
    const assign2 = svc.abTestService.assignVariant('mem-guide-001', 'exp-guide-001')
    expect(assign1).toBeDefined()
    expect(assign2).toBeDefined()
    expect(assign1!.variantName).toBe(assign2!.variantName)
  })
})

// ══════════════════════════════════════════════════════════════════════════════
// 🎯运行专员视角 - 运行专员关注推送统计、A/B 实验结果、价值分群
// ══════════════════════════════════════════════════════════════════════════════

describe('🎯运行专员视角 - ai-push 模块', () => {
  let svc: ReturnType<typeof setupServices>

  beforeEach(() => {
    svc = setupServices()
  })

  it('[运行专员-1] 正常流程: 运行专员可以获取推送统计并查看发送/送达/点击率', () => {
    const task = createDefaultTask(svc.pushTaskService)
    svc.pushTaskService.sendPush(task.id, ['m1', 'm2', 'm3', 'm4', 'm5'])

    const stats = svc.pushTaskService.getStats()
    expect(stats.totalTasks).toBe(1)
    expect(stats.totalRecords).toBe(5)
    expect(stats.sentCount).toBe(5)
    expect(stats.deliveredCount).toBe(0) // 只发送未送达
  })

  it('[运行专员-2] 正常流程: 运行专员可以获取 A/B 实验结果并查看提升率', () => {
    svc.abTestService.createExperiment({
      id: 'exp-ops-001',
      name: '推送时间实验',
      variants: [
        { name: '上午组', weight: 0.5, config: { hour: 10 } },
        { name: '晚上组', weight: 0.5, config: { hour: 20 } },
      ],
    })

    // 分配一批会员到各变体
    for (let i = 0; i < 50; i++) {
      svc.abTestService.assignVariant(`mem-ops-${i}`, 'exp-ops-001')
    }
    // 在晚上组记录一些转化
    for (let i = 0; i < 5; i++) {
      svc.abTestService.recordConversion(`mem-ops-${i}`, 'exp-ops-001', '晚上组', 'conversion')
    }

    const result = svc.abTestService.getExperimentResult('exp-ops-001')
    expect(result).toBeDefined()
    expect(result!.variants).toHaveLength(2)
    expect(result!.liftMap).toBeDefined()
    expect(typeof result!.liftMap['晚上组']).toBe('number')
  })

  it('[运行专员-3] 边界: 运行专员查询不存在的实验应返回 undefined', () => {
    const result = svc.abTestService.getExperimentResult('exp-nonexistent')
    expect(result).toBeUndefined()
  })

  it('[运行专员-4] 正常流程: 运行专员可以按价值分群筛选会员', () => {
    const now = Date.now()
    svc.memberSegmentService.upsertBehavior(createTestBehavior('mem-mid', {
      lastActiveAt: now - 5 * dayMs,
      purchaseCount: 20,
      totalSpent: 25000,
      lastPurchaseAt: now - 5 * dayMs,
    }))
    svc.memberSegmentService.upsertBehavior(createTestBehavior('mem-low', {
      lastActiveAt: now - 30 * dayMs,
      purchaseCount: 1,
      totalSpent: 50,
      lastPurchaseAt: now - 30 * dayMs,
    }))
    // Also add a high-value member to make median calculation predictable
    svc.memberSegmentService.upsertBehavior(createTestBehavior('mem-high', {
      lastActiveAt: now - 2 * dayMs,
      purchaseCount: 50,
      totalSpent: 100000,
      lastPurchaseAt: now - 2 * dayMs,
    }))

    const valueResult = svc.memberSegmentService.segmentByValue(['mem-mid', 'mem-low', 'mem-high'])
    // high: 100000 >= sorted median (25000)*2 = 50000 → 'high'
    expect(valueResult.get('mem-high')).toBe('high')
    // mid: 25000 >= 25000 (median) → 'medium'
    expect(valueResult.get('mem-mid')).toBe('medium')
    // low: 50 > 0 → 'low'
    expect(valueResult.get('mem-low')).toBe('low')
  })
})

// ══════════════════════════════════════════════════════════════════════════════
// 🤝团建视角 - 团建专员关心分群推送触达准确率、推送内容个性化
// ══════════════════════════════════════════════════════════════════════════════

describe('🤝团建视角 - ai-push 模块', () => {
  let svc: ReturnType<typeof setupServices>

  beforeEach(() => {
    svc = setupServices()
  })

  it('[团建-1] 正常流程: 团建专员可以创建面向活跃会员的分群推送', () => {
    createDefaultTask(svc.pushTaskService, {
      title: '团建活动报名通知',
      content: '本周六的团建活动开始报名啦',
      channel: 'push',
      targetMemberIds: ['mem-team-001', 'mem-team-002', 'mem-team-003'],
    })

    const tasks = svc.pushTaskService.getTasks({ page: 0, pageSize: 20 })
    expect(tasks).toHaveLength(1)
    expect(tasks[0].title).toContain('团建')
  })

  it('[团建-2] 边界: 团建专员创建空目标会员的推送不应报错', () => {
    const task = createDefaultTask(svc.pushTaskService, {
      title: '全员通知',
      content: '下周团建安排已发布',
      targetMemberIds: [],
    })
    expect(task.targetMemberIds).toEqual([])
    expect(task.status).toBeDefined()
  })

  it('[团建-3] 正常流程: 团建专员可以查看分群画像来了解团队特征', () => {
    const profile = svc.memberSegmentService.getSegmentProfile('behavior', 'active')
    expect(profile.segmentType).toBe('behavior')
    expect(profile.description).toContain('高频')
    expect(profile.avgMetrics.purchaseCount).toBeGreaterThan(0)
  })
})

// ══════════════════════════════════════════════════════════════════════════════
// 📢营销视角 - 营销专员关注 A/B 实验、转化追踪、分群精准度
// ══════════════════════════════════════════════════════════════════════════════

describe('📢营销视角 - ai-push 模块', () => {
  let svc: ReturnType<typeof setupServices>

  beforeEach(() => {
    svc = setupServices()
  })

  it('[营销-1] 正常流程: 营销专员可以创建 A/B 实验并记录转化事件', () => {
    svc.abTestService.createExperiment({
      id: 'exp-mkt-001',
      name: '促销文案效果测试',
      variants: [
        { name: '满减版', weight: 0.5, config: { type: 'discount' } },
        { name: '赠品版', weight: 0.5, config: { type: 'gift' } },
      ],
    })

    // 分配会员
    for (let i = 0; i < 30; i++) {
      svc.abTestService.assignVariant(`mem-mkt-${i}`, 'exp-mkt-001')
    }
    // 记录满减版转化
    for (let i = 0; i < 8; i++) {
      svc.abTestService.recordConversion(`mem-mkt-${i}`, 'exp-mkt-001', '满减版', 'conversion', 100)
    }
    // 记录赠品版转化
    for (let i = 10; i < 16; i++) {
      svc.abTestService.recordConversion(`mem-mkt-${i}`, 'exp-mkt-001', '赠品版', 'conversion', 80)
    }

    const result = svc.abTestService.getExperimentResult('exp-mkt-001')
    expect(result).toBeDefined()
    expect(result!.experimentName).toBe('促销文案效果测试')
    // 满减版 8 次转化 vs 赠品版 6 次转化
    const variantA = result!.variants.find(v => v.name === '满减版')
    const variantB = result!.variants.find(v => v.name === '赠品版')
    expect(variantA).toBeDefined()
    expect(variantB).toBeDefined()
    expect(variantA!.conversionCount).toBe(8)
    expect(variantB!.conversionCount).toBe(6)
  })

  it('[营销-2] 边界: 营销专员查询无数据的实验结果应有 0 转化', () => {
    svc.abTestService.createExperiment({
      id: 'exp-mkt-002',
      name: '无数据实验',
      variants: [
        { name: '组A', weight: 1, config: {} },
      ],
    })
    const result = svc.abTestService.getExperimentResult('exp-mkt-002')
    expect(result).toBeDefined()
    expect(result!.variants[0].conversionCount).toBe(0)
    expect(result!.variants[0].conversionRate).toBe(0)
  })

  it('[营销-3] 正常流程: 营销专员可以获取最优推送时段规划营销时间', () => {
    const windows = svc.optimalTimingService.getGlobalOptimalWindows()
    const pushWindows = windows.filter(w => w.channel === 'push')
    expect(pushWindows.length).toBeGreaterThan(0)
    // 最优时段分数应该高
    expect(pushWindows[0].score).toBeGreaterThan(0.5)
  })

  it('[营销-4] 正常流程: 营销专员可以为会员设置偏好时段', () => {
    svc.optimalTimingService.setMemberPreferredHours('mem-mkt-vip', [20, 21, 22])
    const prediction = svc.optimalTimingService.predictBestTime('mem-mkt-vip', 'push')
    // 会员偏好晚间时段，最优窗口加分
    expect(prediction.score).toBeGreaterThanOrEqual(0.8)
    expect(prediction.window).toBeDefined()
  })
})
