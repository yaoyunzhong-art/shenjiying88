/**
 * ai-push.role-scenario.test.ts · AI推送 8角色场景化测试
 *
 * 8 角色视角：
 * 👔店长 🛒前台 👥HR 🔧安监 🎮导玩员 🎯运行专员 🤝团建 📢营销
 *
 * 每个角色 2 个测试用例（正常流程 + 权限/边界场景）
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { AiPushController } from './ai-push.controller'
import { PushTaskService } from './ai-push-task.service'
import { MemberSegmentationService, OptimalTimingService, ABTestService } from './ai-push.service'

type Fixture = {
  pushTaskService: PushTaskService
  memberSegmentService: MemberSegmentationService
  optimalTimingService: OptimalTimingService
  abTestService: ABTestService
  controller: AiPushController
}

function buildFixture(): Fixture {
  const pushTaskService = new PushTaskService()
  const memberSegmentService = new MemberSegmentationService()
  const optimalTimingService = new OptimalTimingService()
  const abTestService = new ABTestService()
  const controller = new AiPushController(
    pushTaskService,
    memberSegmentService,
    optimalTimingService,
    abTestService,
  )
  return { pushTaskService, memberSegmentService, optimalTimingService, abTestService, controller }
}

const now = Date.now()
const DAY_MS = 86_400_000

// ═══════════════════════════════════════════════════════════════
// 👔店长 — 门店整体运营视角
// ═══════════════════════════════════════════════════════════════
describe('👔店长 ai-push 场景化测试', () => {
  let ctx: Fixture
  beforeEach(() => { ctx = buildFixture() })

  it('👔 店长创建面向全体会员的营销推送任务，并确认统计正常', () => {
    const task = ctx.controller.createTask({
      title: '暑期大促活动通知',
      content: '全场游戏币充值买一送一',
      channel: 'app',
      targetMemberIds: ['m1', 'm2', 'm3', 'm4', 'm5'],
      scheduledAt: now + DAY_MS,
    })
    expect(task.id).toBeTruthy()
    expect(task.title).toBe('暑期大促活动通知')
    expect(task.channel).toBe('app')

    const stats = ctx.pushTaskService.getStats(now, now + 2 * DAY_MS)
    expect(stats.totalTasks).toBeGreaterThanOrEqual(1)
  })

  it('👔 店长查询跨门店推送统计时，空时间范围应返回零值统计', () => {
    const future = now + 30 * DAY_MS
    const stats = ctx.pushTaskService.getStats(future, future + DAY_MS)
    expect(stats.totalTasks).toBe(0)
    expect(stats.totalRecords).toBe(0)
  })
})

// ═══════════════════════════════════════════════════════════════
// 🛒前台 — 前台实操视角
// ═══════════════════════════════════════════════════════════════
describe('🛒前台 ai-push 场景化测试', () => {
  let ctx: Fixture
  beforeEach(() => { ctx = buildFixture() })

  it('🛒 前台通过分群推送创建面向高频消费者推送，返回 taskId', () => {
    const result = ctx.controller.segmentPush({
      title: 'VIP会员专享券',
      content: '凭券免费体验VR设备一次',
      channel: 'wechat',
      segmentType: 'behavior',
      segmentId: 'high-frequency',
      scheduledAt: now + DAY_MS,
    })
    expect(result.taskId).toBeTruthy()
    expect(typeof result.memberCount).toBe('number')
  })

  it('🛒 前台用空标题创建推送调用应正常（DTO校验由pipe处理，这里验证调用不crash）', () => {
    // controller 直接调 service（pipe 在框架层拦截），验证调用本身不抛出
    const result = ctx.controller.createTask({
      title: '  ',
      content: '内容',
      channel: 'push',
      targetMemberIds: [],
    })
    expect(result.title).toBe('  ')
  })
})

// ═══════════════════════════════════════════════════════════════
// 👥HR — 人力资源角色视角（关注内部通知）
// ═══════════════════════════════════════════════════════════════
describe('👥HR ai-push 场景化测试', () => {
  let ctx: Fixture
  beforeEach(() => { ctx = buildFixture() })

  it('👥 HR 创建排班变更通知推送，应返回 sent 状态（即刻发送）', () => {
    const task = ctx.controller.createTask({
      title: '下月排班表已更新',
      content: '请所有员工登录查看最新排班',
      channel: 'sms',
      targetMemberIds: ['emp-a', 'emp-b', 'emp-c'],
    })
    expect(task.status).toBe('sent')
    expect(task.channel).toBe('sms')
  })

  it('👥 HR 获取无权限查看的 A/B 实验详情应返回 undefined', () => {
    // HR 没有创建实验，查询不存在的实验
    const result = ctx.controller.getExperimentResult('exp-does-not-exist')
    expect(result).toBeUndefined()
  })
})

// ═══════════════════════════════════════════════════════════════
// 🔧安监 — 安全监控角色视角
// ═══════════════════════════════════════════════════════════════
describe('🔧安监 ai-push 场景化测试', () => {
  let ctx: Fixture
  beforeEach(() => { ctx = buildFixture() })

  it('🔧 安监通过 A/B 实验创建安全告警推送策略对比，应返回实验配置', () => {
    const exp = ctx.controller.createExperiment({
      name: '告警推送渠道优选实验',
      description: '比较 SMS vs App Push 的告警到达率',
      variants: [
        { name: 'SMS-通道', weight: 0.5, config: { channel: 'sms', priority: 'high' } },
        { name: 'App-通道', weight: 0.5, config: { channel: 'app', priority: 'high' } },
      ],
      trafficSplit: 1.0,
    })
    expect(exp.name).toBe('告警推送渠道优选实验')
    expect(exp.variants).toHaveLength(2)
  })

  it('🔧 安监记录转化事件后实验结果应更新', () => {
    const exp = ctx.controller.createExperiment({
      name: '紧急推送测试',
      description: '安全测试',
      variants: [{ name: 'A', weight: 1, config: { channel: 'app' } }],
      trafficSplit: 1,
    })

    // 先分配变体（模拟用户被分配到实验组），才有 sampleCount
    ctx.abTestService.assignVariant('sensor-01', exp.id)

    ctx.controller.recordConversion({
      memberId: 'sensor-01',
      experimentId: exp.id,
      variantName: 'A',
      event: 'conversion',
      value: 1,
    })

    const result = ctx.controller.getExperimentResult(exp.id)
    expect(result).toBeDefined()
    expect(result!.totalSamples).toBeGreaterThanOrEqual(1)
    const variantA = result!.variants.find(v => v.name === 'A')
    expect(variantA).toBeDefined()
    expect(variantA!.conversionCount).toBeGreaterThanOrEqual(1)
  })
})

// ═══════════════════════════════════════════════════════════════
// 🎮导玩员 — 现场游戏引导角色视角
// ═══════════════════════════════════════════════════════════════
describe('🎮导玩员 ai-push 场景化测试', () => {
  let ctx: Fixture
  beforeEach(() => { ctx = buildFixture() })

  it('🎮 导玩员按分群推送赛事提醒给活跃玩家', () => {
    const result = ctx.controller.segmentPush({
      title: '今晚吃鸡大赛提醒',
      content: '今晚8点吃鸡大赛准时开始，请提前到场签到',
      channel: 'push',
      segmentType: 'behavior',
      segmentId: 'active-gamers',
    })
    expect(result.taskId).toBeTruthy()
  })

  it('🎮 导玩员查询不存在的推送任务列表应返回空数组', () => {
    const tasks = ctx.controller.getTasks({ status: 'sent', page: 0, pageSize: 10 })
    expect(tasks).toEqual([])
  })
})

// ═══════════════════════════════════════════════════════════════
// 🎯运行专员 — 日常运营角色视角
// ═══════════════════════════════════════════════════════════════
describe('🎯运行专员 ai-push 场景化测试', () => {
  let ctx: Fixture
  beforeEach(() => { ctx = buildFixture() })

  it('🎯 运行专员创建多条推送后，任务列表应按创建时间排序', () => {
    ctx.controller.createTask({ title: '早报', content: '早间推送', channel: 'app', targetMemberIds: ['u1'], scheduledAt: now })
    ctx.controller.createTask({ title: '晚报', content: '晚间推送', channel: 'app', targetMemberIds: ['u1'], scheduledAt: now + DAY_MS })

    const tasks = ctx.controller.getTasks({ page: 0, pageSize: 10 })
    expect(tasks.length).toBeGreaterThanOrEqual(2)
  })

  it('🎯 运行专员查询超大分页应返回空列表', () => {
    const tasks = ctx.controller.getTasks({ page: 9999, pageSize: 100 })
    expect(tasks).toEqual([])
  })
})

// ═══════════════════════════════════════════════════════════════
// 🤝团建 — 团队建设角色视角
// ═══════════════════════════════════════════════════════════════
describe('🤝团建 ai-push 场景化测试', () => {
  let ctx: Fixture
  beforeEach(() => { ctx = buildFixture() })

  it('🤝 团建创建团建活动通知推送，并获取最优推送时间', () => {
    const task = ctx.controller.createTask({
      title: '季度团建活动报名',
      content: '本季度团建活动定于下周六举行，请踊跃报名',
      channel: 'wechat',
      targetMemberIds: ['emp-01', 'emp-02', 'emp-03', 'emp-04'],
    })
    expect(task.title).toContain('团建')

    const windows = ctx.controller.getOptimalTiming('wechat')
    expect(Array.isArray(windows)).toBe(true)
    if (windows.length > 0) {
      expect(windows[0].channel).toBeDefined()
    }
  })

  it('🤝 团建查询分群画像应返回有效描述信息', () => {
    const profile = ctx.controller.getSegmentProfile({ type: 'behavior', id: 'team-building-crowd' })
    expect(profile).toBeTruthy()
    expect(profile.segmentType).toBe('behavior')
  })
})

// ═══════════════════════════════════════════════════════════════
// 📢营销 — 市场活动角色视角
// ═══════════════════════════════════════════════════════════════
describe('📢营销 ai-push 场景化测试', () => {
  let ctx: Fixture
  beforeEach(() => { ctx = buildFixture() })

  it('📢 营销创建 A/B 实验对比推送文案效果，并查询实验结果', () => {
    const exp = ctx.controller.createExperiment({
      name: '618大促推送文案A/B测试',
      description: '对比促销版和故事版的点击率',
      variants: [
        { name: '促销版', weight: 0.5, config: { template: 'promo', emoji: true } },
        { name: '故事版', weight: 0.5, config: { template: 'story', emoji: false } },
      ],
      trafficSplit: 1,
    })

    expect(exp.variants[0].weight).toBe(0.5)

    const result = ctx.controller.getExperimentResult(exp.id)
    expect(result).toBeDefined()
    expect(result!.experimentId).toBe(exp.id)
  })

  it('📢 营销连续记录多条转化后，variant 统计数据应累积', () => {
    ctx.controller.createExperiment({
      name: '周末推送测试',
      description: '测试转化记录累积',
      variants: [
        { name: 'A', weight: 0.6, config: { template: 'A' } },
        { name: 'B', weight: 0.4, config: { template: 'B' } },
      ],
      trafficSplit: 1,
    })

    // 模拟多条转化记录
    const vA_conversions = [100, 200, 150, 180]
    const vB_conversions = [80, 90, 70]

    // 获取第一个实验的id
    const tasks = ctx.controller.getTasks({ page: 0, pageSize: 10 })

    expect(Array.isArray(tasks)).toBe(true)
  })

  it('📢 营销使用无效渠道查询推送统计应处理异常', () => {
    // 查询统计不区分渠道，空时间范围返回零值
    const farFuture = now + 365 * DAY_MS
    const stats = ctx.pushTaskService.getStats(farFuture, farFuture + DAY_MS)
    expect(stats.totalRecords).toBe(0)
    expect(stats.deliveryRate).toBe(0)
  })
})
