import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * 🦞 龙虾哥测试第二段 — Canary 灰度发布扩展角色测试
 * 👔店长 · 🛒前台 · 👥HR · 🔧安监 · 🎮导玩员 · 🎯运行专员 · 🤝团建 · 📢营销
 * 8角色视角·灰度发布高级场景
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import { CanaryService } from './canary.service'

const ROLES = {
  TenantAdmin: '👔店长',
  Reception: '🛒前台',
  HR: '👥HR',
  Safety: '🔧安监',
  Guide: '🎮导玩员',
  Ops: '🎯运行专员',
  Teambuilding: '🤝团建',
  Marketing: '📢营销',
}

function makeSvc(): CanaryService {
  const svc = new CanaryService()
  // Clear seed data for independent tests
  ;(svc as any).experiments.clear()
  ;(svc as any).audits.length = 0
  ;(svc as any).healthSnapshots.length = 0
  return svc
}

/** 创建草稿实验 helper */
function createDraft(svc: CanaryService, overrides: Record<string, any> = {}): string {
  const exp = svc.createExperiment({
    name: overrides.name ?? '测试实验',
    description: overrides.description ?? '默认描述',
    flagKey: overrides.flagKey ?? 'test.feature',
    strategy: overrides.strategy ?? 'percentage',
    strategyConfig: overrides.strategyConfig ?? { type: 'percentage', includeAll: true },
    initialPercentage: overrides.initialPercentage ?? 10,
    targetPercentage: overrides.targetPercentage ?? 100,
    createdBy: overrides.createdBy ?? 'admin',
  })
  return exp.id
}

/** 创建并激活实验 helper */
function createActive(svc: CanaryService, overrides: Record<string, any> = {}): string {
  const id = createDraft(svc, overrides)
  svc.activate(id, overrides.operator ?? 'admin')
  return id
}

// ════════════ 👔店长 ════════════
describe(`${ROLES.TenantAdmin} 灰度发布扩展测试`, () => {
  it('店长可对实验进行百分比晋级操作', () => {
    const svc = makeSvc()
    const id = createActive(svc, { name: '分期晋级', flagKey: 'feature.staged_rollout', initialPercentage: 10, targetPercentage: 100 })
    svc.promote(id, 50, '店长-张三')
    const exp = svc.getExperiment(id)
    assert.ok(exp)
    assert.equal(exp!.currentPercentage, 50)
    assert.equal(exp!.status, 'active')
  })

  it('店长晋级超出目标百分比时报错', () => {
    const svc = makeSvc()
    const id = createActive(svc, { name: '超限实验', flagKey: 'feature.overflow', initialPercentage: 50, targetPercentage: 80 })
    assert.throws(() => svc.promote(id, 90, '店长-张三'), { name: 'BadRequestException' })
  })

  it('店长可查看所有已创建的灰度实验列表', () => {
    const svc = makeSvc()
    createDraft(svc, { name: 'A', flagKey: 'flag.a' })
    createActive(svc, { name: 'B', flagKey: 'flag.b' })
    const list = svc.listExperiments()
    assert.equal(list.length, 2)
  })
})

// ════════════ 🛒前台 ════════════
describe(`${ROLES.Reception} 灰度发布扩展测试`, () => {
  it('前台可基于 storeId 评估灰度覆盖率', () => {
    const svc = makeSvc()
    createActive(svc, {
      name: '门店结算', flagKey: 'checkout.new', strategy: 'store',
      strategyConfig: { type: 'store', storeIds: ['store-001', 'store-002'] },
    })
    const r1 = svc.evaluate({ flagKey: 'checkout.new', tenantId: 't1', storeId: 'store-001' })
    assert.equal(r1.enabled, true)
    assert.equal(r1.matchedStrategy, 'store')

    const r2 = svc.evaluate({ flagKey: 'checkout.new', tenantId: 't1', storeId: 'store-999' })
    assert.equal(r2.enabled, false)
  })

  it('前台多个灰度实验按优先级匹配', () => {
    const svc = makeSvc()
    createActive(svc, { name: '低优先级', flagKey: 'feature.priority', strategy: 'tag', strategyConfig: { type: 'tag', tags: ['vip'] } })
    createActive(svc, { name: '高优先级', flagKey: 'feature.priority', strategy: 'tenant', strategyConfig: { type: 'tenant', tenantIds: ['t1'] } })
    const r = svc.evaluate({ flagKey: 'feature.priority', tenantId: 't1', tags: ['vip'] })
    // First registered experiment wins
    assert.equal(r.matchedStrategy, 'tag')
  })
})

// ════════════ 👥HR ════════════
describe(`${ROLES.HR} 灰度发布扩展测试`, () => {
  it('HR 可查看灰度实验操作审计日志完整链路', () => {
    const svc = makeSvc()
    const id = createDraft(svc, { name: 'HR门禁', flagKey: 'hr.access', createdBy: 'hr-小王' })
    svc.activate(id, 'hr-小王')
    svc.pause(id, 'hr-小王', '午间维护')
    svc.activate(id, 'hr-主管')
    const logs = svc.listAuditLogs(id)
    assert.equal(logs.length, 4)
    assert.equal(logs[0].action, 'create')
    assert.equal(logs[1].action, 'activate')
    assert.equal(logs[2].action, 'pause')
    assert.equal(logs[3].action, 'activate')
  })

  it('HR 审计日志记录操作前后的状态转换', () => {
    const svc = makeSvc()
    const id = createDraft(svc, { name: 'HR排班', flagKey: 'hr.schedule', createdBy: 'hr-小李' })
    svc.activate(id, 'hr-小李')
    svc.rollback(id, 'hr-主管', '发现错误配置')
    const logs = svc.listAuditLogs(id)
    const rollbackLog = logs.find(l => l.action === 'rollback')
    assert.ok(rollbackLog)
    assert.equal(rollbackLog!.fromStatus, 'active')
    assert.equal(rollbackLog!.toStatus, 'rolled_back')
    assert.equal(rollbackLog!.operator, 'hr-主管')
    assert.equal(rollbackLog!.reason, '发现错误配置')
  })
})

// ════════════ 🔧安监 ════════════
describe(`${ROLES.Safety} 灰度发布扩展测试`, () => {
  it('安监手动配置健康阈值和错误记录', () => {
    const svc = makeSvc()
    const id = createActive(svc, { name: '安监-监控', flagKey: 'safety.monitor', healthThreshold: 0.02 })
    svc.recordHealth({ experimentId: id, errorRate: 0.05, latencyP95: 800, latencyAvg: 200, totalRequests: 5000, isHealthy: false })
    const health = svc.getLatestHealth(id)
    assert.ok(health)
    assert.equal(health!.errorRate, 0.05)
  })

  it('安监可强制执行回滚并验证最终状态', () => {
    const svc = makeSvc()
    const id = createActive(svc, { name: '安监-回滚', flagKey: 'safety.rollback_test' })
    const exp = svc.rollback(id, '安监-老赵', '安全漏洞报告')
    assert.ok(exp)
    assert.equal(exp!.status, 'rolled_back')
    assert.equal(exp!.currentPercentage, 0)

    const logs = svc.listAuditLogs(id)
    const rb = logs.find(l => l.action === 'rollback')
    assert.ok(rb)
    assert.equal(rb!.fromPercentage, 10)
    assert.equal(rb!.toPercentage, 0)
  })

  it('安监对不存在的实验回滚返回 null', () => {
    const svc = makeSvc()
    const result = svc.rollback('nonexistent', '安监', '测试')
    assert.equal(result, null)
  })
})

// ════════════ 🎮导玩员 ════════════
describe(`${ROLES.Guide} 灰度发布扩展测试`, () => {
  it('导玩员可评估 tag 匹配灰度实验', () => {
    const svc = makeSvc()
    createActive(svc, {
      name: '导玩-推荐', flagKey: 'guide.recommend',
      strategy: 'tag', strategyConfig: { type: 'tag', tags: ['premium', 'arcade'], matchAll: true },
    })
    const r = svc.evaluate({ flagKey: 'guide.recommend', tenantId: 't1', tags: ['premium', 'arcade'] })
    assert.equal(r.enabled, true)
  })

  it('导玩员评估时缺失标签导致不匹配', () => {
    const svc = makeSvc()
    createActive(svc, {
      name: '导玩-推荐', flagKey: 'guide.recommend',
      strategy: 'tag', strategyConfig: { type: 'tag', tags: ['premium', 'arcade'], matchAll: true },
    })
    const r = svc.evaluate({ flagKey: 'guide.recommend', tenantId: 't1', tags: ['premium'] })
    assert.equal(r.enabled, false)
    assert.ok(r.reason.includes('No matching'))
  })
})

// ════════════ 🎯运行专员 ════════════
describe(`${ROLES.Ops} 灰度发布扩展测试`, () => {
  it('运行专员根据 tenantId hash 评估百分比实验', () => {
    const svc = makeSvc()
    createActive(svc, {
      name: 'Ops-性能优化', flagKey: 'ops.optimize',
      strategy: 'percentage', strategyConfig: { type: 'percentage', includeAll: true },
    })
    const r = svc.evaluate({ flagKey: 'ops.optimize', tenantId: 't1' })
    assert.equal(r.enabled, true)
    assert.equal(r.matchedStrategy, 'percentage')
  })

  it('运行专员可查看健康历史数据', () => {
    const svc = makeSvc()
    const id = createActive(svc, { name: 'Ops-健康', flagKey: 'ops.health_exp' })
    for (let i = 0; i < 5; i++) {
      svc.recordHealth({ experimentId: id, errorRate: 0.003, latencyP95: 150, latencyAvg: 60, totalRequests: 3000, isHealthy: true })
    }
    const history = svc.listHealth(id)
    assert.equal(history.length, 5)
  })

  it('运行专员取回健康快照限制条数', () => {
    const svc = makeSvc()
    const id = createActive(svc, { name: 'Ops-限数', flagKey: 'ops.limit_health' })
    for (let i = 0; i < 10; i++) {
      svc.recordHealth({ experimentId: id, errorRate: 0.001, latencyP95: 100, latencyAvg: 50, totalRequests: 1000, isHealthy: true })
    }
    const limited = svc.listHealth(id, 3)
    assert.equal(limited.length, 3)
  })
})

// ════════════ 🤝团建 ════════════
describe(`${ROLES.Teambuilding} 灰度发布扩展测试`, () => {
  it('团建活动可使用灰度进行小范围试运行', () => {
    const svc = makeSvc()
    const id = createActive(svc, {
      name: '团建-新活动', flagKey: 'team.activity_v2',
      strategy: 'percentage', strategyConfig: { type: 'percentage', includeAll: true },
      initialPercentage: 5, targetPercentage: 50,
    })
    const exp = svc.getExperiment(id)
    assert.ok(exp)
    assert.equal(exp!.currentPercentage, 5)
    assert.equal(exp!.status, 'active')
  })

  it('团建可暂停灰度实验待下一轮调整', () => {
    const svc = makeSvc()
    const id = createActive(svc, { name: '团建-暂停', flagKey: 'team.pause_test' })
    const paused = svc.pause(id, '团建-组织者', '待下周活动确认')
    assert.ok(paused)
    assert.equal(paused!.status, 'paused')

    const logs = svc.listAuditLogs(id)
    const pauseLog = logs.find(l => l.action === 'pause')
    assert.ok(pauseLog)
    assert.equal(pauseLog!.reason, '待下周活动确认')
  })
})

// ════════════ 📢营销 ════════════
describe(`${ROLES.Marketing} 灰度发布扩展测试`, () => {
  it('营销可创建多渠道灰度促销活动', () => {
    const svc = makeSvc()
    const id = createActive(svc, {
      name: '营销-双11促销', flagKey: 'marketing.double11',
      strategy: 'tag', strategyConfig: { type: 'tag', tags: ['promotion', 'double11'] },
      initialPercentage: 20, targetPercentage: 100,
    })
    const r = svc.evaluate({ flagKey: 'marketing.double11', tenantId: 't1', tags: ['promotion', 'double11'] })
    assert.equal(r.enabled, true)
    assert.equal(r.percentage, 20)
  })

  it('营销中仅含部分标签但实验要求 matchAll 时不匹配', () => {
    const svc = makeSvc()
    createActive(svc, {
      name: '营销-全标签', flagKey: 'marketing.all_tags',
      strategy: 'tag', strategyConfig: { type: 'tag', tags: ['a', 'b', 'c'], matchAll: true },
    })
    const r = svc.evaluate({ flagKey: 'marketing.all_tags', tenantId: 't1', tags: ['a', 'b'] })
    assert.equal(r.enabled, false)
  })

  it('营销促销完成后不可再激活', () => {
    const svc = makeSvc()
    const id = createDraft(svc, { name: '营销-已完成', flagKey: 'marketing.completed', initialPercentage: 100, targetPercentage: 100 })
    svc.activate(id, 'marketing')
    svc.promote(id, 100, 'marketing') // this should set status to completed
    const exp = svc.getExperiment(id)
    assert.equal(exp!.status, 'completed')
    assert.throws(() => svc.activate(id, 'marketing'), { name: 'BadRequestException' })
  })
})
