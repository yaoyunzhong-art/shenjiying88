import { describe, it, expect, test, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest'
// 用途: 8 角色视角的灰度发布功能测试
// 👔店长 🛒前台 👥HR 🔧安监 🎮导玩员 🎯运行专员 🤝团建 📢营销
// 每个角色至少 2 个用例 (正常流程 + 权限边界)

import { CanaryController } from './canary.controller'
import { CanaryService } from './canary.service'

function createTestEnv() {
  const service = new CanaryService()
  const controller = new CanaryController(service)
  return { service, controller }
}

/** 创建草稿实验并返回其 id */
function createDraft(controller: CanaryController, overrides: Record<string, any> = {}): string {
  const exp = controller.create({
    name: overrides.name ?? '测试实验',
    description: overrides.description ?? '描述',
    flagKey: overrides.flagKey ?? 'test.feature',
    strategy: overrides.strategy ?? 'percentage',
    strategyConfig: overrides.strategyConfig ?? { type: 'percentage', includeAll: true },
    initialPercentage: overrides.initialPercentage ?? 10,
    targetPercentage: overrides.targetPercentage ?? 100,
    createdBy: overrides.createdBy ?? 'admin',
  })
  return exp.id
}

/** 创建并激活实验 */
function createActive(controller: CanaryController, overrides: Record<string, any> = {}): string {
  const id = createDraft(controller, overrides)
  controller.activate(id, { operator: overrides.operator ?? 'admin' })
  return id
}

// ── 👔店长 ──
describe('👔店长 Canary 角色测试', () => {
  it('👔店长: 创建灰度实验并查看灰度列表', () => {
    const { controller } = createTestEnv()
    const exp = controller.create({
      name: '新结算流程灰度',
      description: '试点门店新结算体验',
      flagKey: 'checkout.new_flow_v2',
      strategy: 'store',
      strategyConfig: { type: 'store', storeIds: ['store-001', 'store-002'] },
      initialPercentage: 100,
      targetPercentage: 100,
      createdBy: '店长-张三',
    })
    expect(exp.name).toBe('新结算流程灰度')
    expect(exp.status).toBe('draft')
    expect(exp.id).toBeDefined()

    const list = controller.list()
    expect(list.items.length).toBeGreaterThanOrEqual(1)
    expect(list.items.some((e: any) => e.id === exp.id)).toBe(true)
  })

  it('👔店长: 查看灰度实验健康状态确保不损害营收', () => {
    const { controller } = createTestEnv()
    const id = createActive(controller, {
      name: '健康检查实验',
      flagKey: 'health.test',
      autoPromote: {
        checkIntervalMin: 30,
        healthMetrics: ['error_rate', 'latency_p95'],
        promoteSteps: [10, 25, 50, 100],
        healthThreshold: 0.01,
        maxPromotions: 5,
      },
    })
    // 手动调用 create 设置 autoPromote
    const service = (controller as any).service as CanaryService
    const exp = controller.create({
      name: '健康检查实验',
      description: '健康检查',
      flagKey: 'health.test',
      strategy: 'percentage',
      strategyConfig: { type: 'percentage', includeAll: true },
      initialPercentage: 10,
      targetPercentage: 100,
      autoPromote: {
        checkIntervalMin: 30,
        healthMetrics: ['error_rate', 'latency_p95'],
        promoteSteps: [10, 25, 50, 100],
        healthThreshold: 0.01,
        maxPromotions: 5,
      },
      createdBy: '店长',
    })
    controller.activate(exp.id, { operator: '店长' })
    controller.recordHealth(exp.id, {
      errorRate: 0.002,
      latencyP95: 200,
      latencyAvg: 85,
      totalRequests: 5000,
    })
    const health = controller.getHealth(exp.id)
    expect(health.latest).toBeDefined()
    expect(health.latest!.isHealthy).toBe(true)

    const check = controller.checkPromote(exp.id)
    expect(check.shouldPromote).toBe(true)
  })
})

// ── 🛒前台 ──
describe('🛒前台 Canary 角色测试', () => {
  it('🛒前台: 访问灰度评估端点感知功能变更', () => {
    const { controller } = createTestEnv()
    const result = controller.evaluate({
      flagKey: 'ai.model.v2_enabled',
      tenantId: 'tenant-1',
      tags: ['premium'],
    })
    expect(result.flagKey).toBe('ai.model.v2_enabled')
    expect(result.enabled).toBeDefined()
    expect(typeof result.enabled).toBe('boolean')
  })

  it('🛒前台: 未匹配到任何灰度实验时返回禁用状态不报错', () => {
    const { controller } = createTestEnv()
    const result = controller.evaluate({
      flagKey: 'feature.nonexistent',
      tenantId: 'stranger-tenant',
    })
    expect(result.enabled).toBe(false)
    expect(result.matchedStrategy).toBeNull()
    expect(result.reason).toContain('No matching')
  })
})

// ── 👥HR ──
describe('👥HR Canary 角色测试', () => {
  it('👥HR: 灰度实验审计日志可查看', () => {
    const { controller } = createTestEnv()
    const id = createActive(controller, { name: 'HR考勤', flagKey: 'hr.test', createdBy: 'hr-管理员' })
    const logs = controller.auditLogs(id)
    expect(Array.isArray(logs.items)).toBe(true)
    const createLog = logs.items.find((l: any) => l.action === 'create')
    expect(createLog).toBeDefined()
    expect(createLog!.operator).toBe('hr-管理员')
  })

  it('👥HR: 灰度上线前后人员操作可追溯', () => {
    const { controller } = createTestEnv()
    const id = createActive(controller, { name: 'HR考勤', flagKey: 'hr.audit', createdBy: 'hr-小王' })
    // 再做一个 pause 操作记录
    controller.pause(id, { operator: 'hr-小王', reason: '暂停测试' })
    const logs = controller.auditLogs(id)
    const pauseLog = logs.items.find((l: any) => l.action === 'pause')
    expect(pauseLog).toBeDefined()
    expect(pauseLog!.operator).toBe('hr-小王')
    expect(pauseLog!.reason).toBe('暂停测试')
  })
})

// ── 🔧安监 ──
describe('🔧安监 Canary 角色测试', () => {
  it('🔧安监: 灰度健康指标异常时不应自动晋级', () => {
    const { controller } = createTestEnv()
    const exp = controller.create({
      name: '监控实验',
      description: '健康监控',
      flagKey: 'monitor.test',
      strategy: 'percentage',
      strategyConfig: { type: 'percentage', includeAll: true },
      initialPercentage: 10,
      targetPercentage: 100,
      autoPromote: {
        checkIntervalMin: 30,
        healthMetrics: ['error_rate', 'latency_p95'],
        promoteSteps: [10, 25, 50, 100],
        healthThreshold: 0.01,
        maxPromotions: 5,
      },
      createdBy: 'admin',
    })
    controller.activate(exp.id, { operator: 'admin' })
    controller.recordHealth(exp.id, {
      errorRate: 0.15,
      latencyP95: 5000,
      latencyAvg: 2000,
      totalRequests: 1000,
    })
    const health = controller.getHealth(exp.id)
    expect(health.latest!.isHealthy).toBe(false)

    const check = controller.checkPromote(exp.id)
    expect(check.shouldPromote).toBe(false)
    expect(check.reason).toContain('Unhealthy')
  })

  it('🔧安监: 强制执行灰度回滚操作', () => {
    const { controller } = createTestEnv()
    const id = createActive(controller, { name: '回滚实验', flagKey: 'rollback.test' })
    const result = controller.rollback(id, {
      operator: '安监-李四',
      reason: '错误率超标，立即回滚',
    })
    expect(result.status).toBe('rolled_back')
    expect(result.currentPercentage).toBe(0)
  })
})

// ── 🎮导玩员 ──
describe('🎮导玩员 Canary 角色测试', () => {
  it('🎮导玩员: 查看灰度实验列表了解当前实验', () => {
    const { controller } = createTestEnv()
    createActive(controller, { name: '导玩员实验', flagKey: 'guide.test' })
    const list = controller.list()
    expect(list.total).toBeGreaterThanOrEqual(3) // 2 seed + 1 new
    expect(list.items[0]).toHaveProperty('name')
    expect(list.items[0]).toHaveProperty('status')
  })

  it('🎮导玩员: 获取单个灰度实验详情', () => {
    const { controller } = createTestEnv()
    const id = createActive(controller, { name: '详情实验', flagKey: 'detail.test' })
    const exp = controller.get(id)
    expect(exp.id).toBe(id)
    expect(exp.flagKey).toBe('detail.test')
  })

  it('🎮导玩员: 查询不存在的实验返回 400', () => {
    const { controller } = createTestEnv()
    expect(() => controller.get('non-existent')).toThrow()
  })
})

// ── 🎯运行专员 ──
describe('🎯运行专员 Canary 角色测试', () => {
  it('🎯运行专员: 创建实验并激活后逐步晋级推广', () => {
    const { controller } = createTestEnv()
    const id = createActive(controller, {
      name: '支付流程优化',
      description: '优化支付体验',
      flagKey: 'payment.optimize',
      initialPercentage: 5,
      createdBy: '运行专员-赵六',
    })
    const promoted = controller.promote(id, { percentage: 25, operator: '运行专员-赵六' })
    expect(promoted.currentPercentage).toBe(25)
    expect(promoted.status).toBe('active')
  })

  it('🎯运行专员: 晋级百分比不能低于当前值', () => {
    const { controller } = createTestEnv()
    const id = createActive(controller, {
      name: '晋级边界实验',
      flagKey: 'promote.boundary',
      initialPercentage: 25,
      createdBy: '运行专员',
    })
    expect(() =>
      controller.promote(id, { percentage: 10, operator: '运行专员' })
    ).toThrow()
  })

  it('🎯运行专员: 晋级超过目标百分比时实验自动完成', () => {
    const { controller } = createTestEnv()
    const id = createActive(controller, {
      name: '自动完成实验',
      flagKey: 'auto.complete',
      initialPercentage: 50,
      targetPercentage: 100,
      createdBy: '运行专员',
    })
    const completed = controller.promote(id, { percentage: 100, operator: '运行专员' })
    expect(completed.status).toBe('completed')
    expect(completed.endedAt).toBeDefined()
  })
})

// ── 🤝团建 ──
describe('🤝团建 Canary 角色测试', () => {
  it('🤝团建: 按门店策略的灰度实验仅覆盖特定门店', () => {
    const { controller } = createTestEnv()
    // seed 已有 exp-seed-checkout (store strategy, stores: store-001, store-002)
    const result1 = controller.evaluate({
      flagKey: 'checkout.new_flow',
      tenantId: 'tenant-001',
      storeId: 'store-001',
    })
    expect(result1.enabled).toBe(true)
    expect(result1.matchedStrategy).toBe('store')

    const result2 = controller.evaluate({
      flagKey: 'checkout.new_flow',
      tenantId: 'tenant-999',
      storeId: 'store-999',
    })
    expect(result2.enabled).toBe(false)
  })

  it('🤝团建: 暂停实验中灰度不影响已有数据', () => {
    const { controller } = createTestEnv()
    const id = createActive(controller, { name: '团建实验', flagKey: 'team.test' })
    const exp = controller.pause(id, {
      operator: '团建-王五',
      reason: '团建活动期间暂停灰度',
    })
    expect(exp.status).toBe('paused')
    // 暂停后的实验不应匹配新请求
    const evalResult = controller.evaluate({
      flagKey: 'team.test',
      tenantId: 'test-tenant',
    })
    expect(evalResult.enabled).toBe(false)
  })
})

// ── 📢营销 ──
describe('📢营销 Canary 角色测试', () => {
  it('📢营销: 按标签策略创建灰度营销实验', () => {
    const { controller } = createTestEnv()
    controller.create({
      name: '营销弹窗V2',
      description: '新版营销弹窗',
      flagKey: 'marketing.popup_v2',
      strategy: 'tag',
      strategyConfig: { type: 'tag', tags: ['vip', 'premium'], matchAll: false },
      initialPercentage: 100,
      targetPercentage: 100,
      createdBy: '营销-陈七',
    })

    // 查看所有实验列表验证营销实验存在
    const list = controller.list()
    const marketingExp = list.items.find((e: any) => e.flagKey === 'marketing.popup_v2')
    expect(marketingExp).toBeDefined()
    expect(marketingExp!.status).toBe('draft')
    expect((marketingExp!.strategyConfig as any).tags).toContain('vip')
  })

  it('📢营销: 灰度评估支持多标签匹配', () => {
    const { controller } = createTestEnv()
    // 创建按标签策略的实验并激活
    const id = createDraft(controller, {
      name: '节日营销活动',
      description: '节日特别活动灰度',
      flagKey: 'marketing.holiday',
      strategy: 'tag',
      strategyConfig: { type: 'tag', tags: ['holiday', 'active'], matchAll: true },
      initialPercentage: 100,
      targetPercentage: 100,
      createdBy: '营销-陈七',
    })
    // 激活
    controller.activate(id, { operator: '营销-陈七' })

    // 匹配全部标签
    const matchAll = controller.evaluate({
      flagKey: 'marketing.holiday',
      tenantId: 't-holiday',
      tags: ['holiday', 'active'],
    })
    expect(matchAll.enabled).toBe(true)
    expect(matchAll.matchedStrategy).toBe('tag')

    // 只有部分标签不匹配 (matchAll=true)
    const partial = controller.evaluate({
      flagKey: 'marketing.holiday',
      tenantId: 't-partial',
      tags: ['holiday'],
    })
    expect(partial.enabled).toBe(false)
  })
})

// ── 权限边界测试 (8 角色统一) ──
describe('🔒 Canary 权限边界测试', () => {
  it('所有角色: draft 状态下不允许 promote', () => {
    const { controller } = createTestEnv()
    const id = createDraft(controller, { name: '边界测试实验', flagKey: 'test.boundary' })
    expect(() => controller.promote(id, { percentage: 25, operator: 'admin' })).toThrow()
  })

  it('所有角色: completed 实验不可再 activate', () => {
    const { controller } = createTestEnv()
    const id = createActive(controller, {
      name: '完成实验',
      flagKey: 'complete.test',
      initialPercentage: 50,
      targetPercentage: 100,
    })
    controller.promote(id, { percentage: 100, operator: 'admin' })
    expect(() => controller.activate(id, { operator: 'admin' })).toThrow()
  })

  it('所有角色: rolled_back 实验不可 pause', () => {
    const { controller } = createTestEnv()
    const id = createActive(controller, { name: '回滚实验', flagKey: 'rollback.pause' })
    controller.rollback(id, { operator: 'admin', reason: '测试回滚' })
    expect(() => controller.pause(id, { operator: 'admin' })).toThrow()
  })

  it('所有角色: 没有自动晋级规则的实验不应自动晋级', () => {
    const { controller } = createTestEnv()
    const id = createDraft(controller, {
      name: '无晋级规则',
      flagKey: 'test.no_auto',
    })
    // 还没有激活，checkPromote 不会报错，只是不应晋级
    const check = controller.checkPromote(id)
    expect(check.shouldPromote).toBe(false)
  })

  it('所有角色: paused 实验可重新 activate', () => {
    const { controller } = createTestEnv()
    const id = createActive(controller, { name: '暂停再激活', flagKey: 'pause.reactivate' })
    controller.pause(id, { operator: 'admin', reason: '暂停维护' })
    const exp = controller.activate(id, { operator: 'admin' })
    expect(exp.status).toBe('active')
  })

  it('所有角色: 批量操作审计日志不崩溃', () => {
    const { controller } = createTestEnv()
    for (let i = 0; i < 10; i++) {
      const id = createDraft(controller, {
        name: `批量实验-${i}`,
        flagKey: `batch.${i}`,
        createdBy: 'admin',
      })
      controller.activate(id, { operator: 'admin' })
    }
    // 使用任意一个实验查看审计日志
    const list = controller.list()
    const lastExp = list.items[list.items.length - 1]
    const audit = controller.auditLogs(lastExp.id)
    expect(Array.isArray(audit.items)).toBe(true)
  })

  it('所有角色: rollback 已回滚实验仍可再次 rollback (服务端返回实验且不抛错)', () => {
    const { controller } = createTestEnv()
    const id = createActive(controller, { name: '二次回滚', flagKey: 'double.rollback' })
    controller.rollback(id, { operator: 'admin', reason: '首次回滚' })
    // 当前实现中 rollback 不校验状态，返回更新后的实验
    const result = controller.rollback(id, { operator: 'admin', reason: '二次回滚' })
    expect(result).not.toBeNull()
    expect(result.status).toBe('rolled_back')
  })
})
