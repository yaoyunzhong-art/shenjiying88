import { describe, it, expect, beforeEach } from 'vitest'
import { AiPushController } from './ai-push.controller'
import { PushTaskService } from './ai-push-task.service'
import { MemberSegmentationService, OptimalTimingService, ABTestService } from './ai-push.service'

/**
 * 🐜 [ai-push] 角色扩展测试
 * 覆盖边界条件和异常场景
 * 👔店长 🛒前台 👥HR 🔧安监 🎮导玩员 🎯运行专员 🤝团建 📢营销
 */

const ROLES = {
  StoreManager: '👔店长',
  FrontDesk: '🛒前台',
  HR: '👥HR',
  Safety: '🔧安监',
  Guide: '🎮导玩员',
  Ops: '🎯运行专员',
  Teambuilding: '🤝团建',
  Marketing: '📢营销',
}

function setup() {
  const pushTaskService = new PushTaskService()
  const memberSegmentService = new MemberSegmentationService()
  const optimalTimingService = new OptimalTimingService()
  const abTestService = new ABTestService()
  const controller = new AiPushController(
    pushTaskService, memberSegmentService, optimalTimingService, abTestService,
  )
  return { pushTaskService, memberSegmentService, optimalTimingService, abTestService, controller }
}

const dayMs = 86400000

describe(`${ROLES.StoreManager} ai-push 扩展测试`, () => {
  let svc: ReturnType<typeof setup>>
  beforeEach(() => { svc = setup() })

  it('店长创建推送任务后获取统计', () => {
    svc.pushTaskService.createTask({ title: '通知', content: '内容', channel: 'push', targetMemberIds: ['u1'], scheduledAt: Date.now() })
    const stats = svc.pushTaskService.getStats(Date.now() - 86400000, Date.now() + 86400000)
    expect(stats.totalTasks).toBe(1)
  })

  it('店长按状态过滤空结果集合', () => {
    const tasks = svc.pushTaskService.getTasks({ status: 'sent' as any, page: 0, pageSize: 10 })
    expect(tasks).toEqual([])
  })
})

describe(`${ROLES.FrontDesk} ai-push 扩展测试`, () => {
  let svc: ReturnType<typeof setup>>
  beforeEach(() => { svc = setup() })

  it('前台创建定时推送任务状态为 pending', () => {
    const future = Date.now() + 86400000
    const t = svc.pushTaskService.createTask({ title: '明天活动', content: '提醒', channel: 'sms', targetMemberIds: [], scheduledAt: future })
    expect(t.status).toBe('pending')
    expect(t.sentAt).toBeUndefined()
  })
})

describe(`${ROLES.HR} ai-push 扩展测试`, () => {
  let svc: ReturnType<typeof setup>>
  beforeEach(() => { svc = setup() })

  it('HR 分群识别流失会员', () => {
    const now = Date.now()
    svc.memberSegmentService.upsertBehavior({ memberId: 'm-churn', lastActiveAt: now - 180 * dayMs, purchaseCount: 1, totalSpent: 100, avgOrderValue: 100, sessionCount: 1, lastPurchaseAt: now - 180 * dayMs, churnDays: 180 })
    const seg = svc.memberSegmentService.segmentByBehavior(['m-churn'])
    expect(seg.get('m-churn')).toBe('churned')
  })

  it('HR 查询不存在的会员分群返回 churned', () => {
    const seg = svc.memberSegmentService.segmentByBehavior(['no-such'])
    expect(seg.get('no-such')).toBe('churned')
  })

  it('HR 计算 RFM 时无数据会员返回最低分', () => {
    const rfm = svc.memberSegmentService.computeRFM('unknown')
    expect(rfm.recencyScore).toBeGreaterThanOrEqual(1)
    expect(rfm.totalScore).toBeGreaterThanOrEqual(3)
  })
})

describe(`${ROLES.Safety} ai-push 扩展测试`, () => {
  let svc: ReturnType<typeof setup>>
  beforeEach(() => { svc = setup() })

  it('安监查询分群画像获取准确信息', () => {
    const p = svc.memberSegmentService.getSegmentProfile('value', 'high')
    expect(p.segmentType).toBe('value')
    expect(p.tags).toContain('VIP权益')
    expect(p.avgMetrics.totalSpent).toBeGreaterThan(0)
  })

  it('安监查询未知分群返回默认值', () => {
    const p = svc.memberSegmentService.getSegmentProfile('unknown', 'x')
    expect(p.description).toBe('未知分群')
    expect(p.tags).toEqual([])
  })
})

describe(`${ROLES.Guide} ai-push 扩展测试`, () => {
  let svc: ReturnType<typeof setup>>
  beforeEach(() => { svc = setup() })

  it('导玩员获取所有渠道最优时段', () => {
    const ws = svc.optimalTimingService.getGlobalOptimalWindows()
    expect(ws.length).toBeGreaterThanOrEqual(3)
    const channels = [...new Set(ws.map(w => w.channel))]
    expect(channels).toContain('push')
    expect(channels).toContain('sms')
  })

  it('导玩员创建 A/B 实验获取实验结果统计', () => {
    svc.abTestService.createExperiment({ id: 'exp-g', name: 'guide-test', variants: [{ name: 'A', weight: 1, config: {} }] })
    const result = svc.abTestService.getExperimentResult('exp-g')
    expect(result).toBeDefined()
    expect(result!.variants).toHaveLength(1)
    expect(result!.variants[0].conversionRate).toBe(0)
  })
})

describe(`${ROLES.Ops} ai-push 扩展测试`, () => {
  let svc: ReturnType<typeof setup>>
  beforeEach(() => { svc = setup() })

  it('运行专员按生命周期分群', () => {
    const now = Date.now()
    svc.memberSegmentService.upsertBehavior({ memberId: 'm-mat', lastActiveAt: now - 30 * dayMs, purchaseCount: 15, totalSpent: 10000, avgOrderValue: 666, sessionCount: 30, lastPurchaseAt: now - 30 * dayMs, churnDays: 30 })
    const lc = svc.memberSegmentService.segmentByLifecycle(['m-mat'])
    expect(lc.get('m-mat')).toBe('mature')
  })
})

describe(`${ROLES.Teambuilding} ai-push 扩展测试`, () => {
  let svc: ReturnType<typeof setup>>
  beforeEach(() => { svc = setup() })

  it('团建专员预测推送时间获取完整窗口信息', () => {
    const p = svc.optimalTimingService.predictBestTime('mem-team', 'push')
    expect(p.timestamp).toBeGreaterThan(Date.now())
    expect(p.window.startHour).toBeGreaterThanOrEqual(0)
    expect(p.window.endHour).toBeLessThanOrEqual(23)
  })
})

describe(`${ROLES.Marketing} ai-push 扩展测试`, () => {
  let svc: ReturnType<typeof setup>>
  beforeEach(() => { svc = setup() })

  it('营销专员 A/B 实验分配幂等性验证', () => {
    svc.abTestService.createExperiment({ id: 'exp-mkt2', name: 'mkt-test', variants: [{ name: 'V1', weight: 0.5, config: {} }, { name: 'V2', weight: 0.5, config: {} }] })
    const a1 = svc.abTestService.assignVariant('u-mkt', 'exp-mkt2')
    const a2 = svc.abTestService.assignVariant('u-mkt', 'exp-mkt2')
    expect(a1!.variantName).toBe(a2!.variantName)
  })

  it('营销专员获取不存在的实验结果为 undefined', () => {
    const r = svc.abTestService.getExperimentResult('no-such')
    expect(r).toBeUndefined()
  })
})
