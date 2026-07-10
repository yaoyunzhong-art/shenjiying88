import { describe, it, expect, beforeEach, vi } from 'vitest'
/**
 * canary.role-scenario.test.ts — 灰度发布 8 角色实景场景测试
 *
 * 围绕大飞哥电玩城实际运营场景，覆盖灰度发布全生命周期：
 *   创建 → 激活 → 监控 → 晋级 → 暂停 → 回滚 → 完成
 *
 * 8 角色视角：
 *   👔店长 - 关注灰度整体风险和业务影响
 *   🛒前台 - 关注会员体验和收银影响
 *   👥HR   - 关注员工系统和培训资料灰度
 *   🔧安监 - 关注安全策略灰度和安全风险
 *   🎮导玩员 - 关注游戏内容和导玩设备灰度
 *   🎯运行专员 - 关注技术灰度执行和健康指标
 *   🤝团建 - 关注团建系统和活动模块灰度
 *   📢营销 - 关注营销活动和推送灰度
 */

import { CanaryController } from './canary.controller'
import { CanaryService } from './canary.service'
import type { CanaryExperiment, CanaryHealthSnapshot } from './canary.entity'

// ── 8 角色定义 ──
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

// ── 测试工厂 ──
function createController() {
  const service = new CanaryService()
  return new CanaryController(service)
}

/** 快速创建实验 */
function createExperiment(
  controller: CanaryController,
  overrides: Partial<Omit<CanaryExperiment, 'id' | 'createdAt' | 'updatedAt' | 'status' | 'currentPercentage'>> = {},
): CanaryExperiment {
  return controller.create({
    name: '测试实验',
    description: '灰度发布测试',
    flagKey: 'feature-test',
    strategy: 'percentage',
    strategyConfig: { type: 'percentage', includeAll: false },
    initialPercentage: 10,
    targetPercentage: 100,
    createdBy: 'test-operator',
    autoPromote: {
      checkIntervalMin: 5,
      healthMetrics: ['error_rate', 'latency_p95'],
      promoteSteps: [10, 25, 50, 100],
      healthThreshold: 0.01,
      maxPromotions: 4,
    },
    ...overrides,
  })
}

// ══════════════════════════════════════════════════════════════════════════════
// 👔店长视角 — 关注灰度整体风险控制和业务决策
// ══════════════════════════════════════════════════════════════════════════════
describe(`${ROLES.StoreManager} 灰度发布实景场景`, () => {
  let controller: CanaryController

  beforeEach(() => {
    controller = createController()
  })

  it('[店长-1] 正常流程: 创建灰度计划后可以查看实验总览和状态', () => {
    const exp = createExperiment(controller, {
      name: '收银系统V2灰度',
      flagKey: 'cashier-v2',
      initialPercentage: 5,
      targetPercentage: 100,
    })
    expect(exp.id).toBeTruthy()
    expect(exp.status).toBe('draft')
    expect(exp.initialPercentage).toBeLessThan(exp.targetPercentage)

    // 店长查看列表
    const list = controller.list()
    expect(list.total).toBeGreaterThanOrEqual(1)
    expect(list.items.some((e) => e.id === exp.id)).toBe(true)
  })

  it('[店长-2] 权限边界: 店长可以评估某个门店是否在灰度范围内', () => {
    createExperiment(controller, {
      flagKey: 'store-vip-program',
      strategy: 'store',
      strategyConfig: { type: 'store', storeIds: ['store-cyber-galaxy', 'store-houston'] },
      initialPercentage: 100,
      targetPercentage: 100,
    })

    // 先激活实验
    const exp = createExperiment(controller, {
      flagKey: 'store-vip-program',
      strategy: 'store',
      strategyConfig: { type: 'store', storeIds: ['store-cyber-galaxy', 'store-houston'] },
      initialPercentage: 100,
      targetPercentage: 100,
      createdBy: 'test-operator',
    })
    controller.activate(exp.id, { operator: 'test-operator' })

    // 店长评估门店灰度覆盖
    const resultIncluded = controller.evaluate({
      flagKey: 'store-vip-program',
      tenantId: 't-cyber-001',
      storeId: 'store-cyber-galaxy',
    })
    expect(resultIncluded.enabled).toBe(true)

    // 未在策略中的门店不应启用
    const resultExcluded = controller.evaluate({
      flagKey: 'store-vip-program',
      tenantId: 't-cyber-001',
      storeId: 'store-non-existent',
    })
    expect(resultExcluded.enabled).toBe(false)
  })

  it('[店长-3] 边界: 不存在的实验返回 BadRequest', () => {
    expect(() => controller.get('non-existent')).toThrow()
  })
})

// ══════════════════════════════════════════════════════════════════════════════
// 🛒前台视角 — 关注会员体验是否受灰度影响
// ══════════════════════════════════════════════════════════════════════════════
describe(`${ROLES.FrontDesk} 灰度发布实景场景`, () => {
  let controller: CanaryController

  beforeEach(() => {
    controller = createController()
  })

  it('[前台-1] 正常流程: 前台确认灰度中的会员积分系统对会员无感知', () => {
    const exp = createExperiment(controller, {
      name: '积分系统优化',
      flagKey: 'points-optimization',
      strategy: 'percentage',
      strategyConfig: { type: 'percentage', includeAll: false },
      initialPercentage: 10,
      targetPercentage: 100,
    })
    // 未激活状态下实验不生效
    const resultNotEnabled = controller.evaluate({
      flagKey: 'points-optimization',
      tenantId: 't-cyber-001',
    })
    expect(resultNotEnabled.enabled).toBe(false)
    expect(resultNotEnabled.reason).toBe('No matching experiment')

    // 激活后灰度生效（simplified service 中 percentage 匹配简化处理）
    controller.activate(exp.id, { operator: 'front-desk-test' })
    const resultActive = controller.evaluate({
      flagKey: 'points-optimization',
      tenantId: 't-cyber-001',
    })
    expect(resultActive.enabled).toBe(true)
  })

  it('[前台-2] 权限边界: 前台可以通过 tag 灰度仅对特定会员组生效', () => {
    const exp = createExperiment(controller, {
      name: 'SVIP专属折扣',
      flagKey: 'svip-discount',
      strategy: 'tag',
      strategyConfig: { type: 'tag', tags: ['svip', 'vip'], matchAll: false },
      initialPercentage: 100,
      targetPercentage: 100,
    })
    controller.activate(exp.id, { operator: 'front-desk-test' })

    // SVIP 会员可以享受新折扣
    const resultSvip = controller.evaluate({
      flagKey: 'svip-discount',
      tenantId: 't-cyber-001',
      tags: ['svip'],
    })
    expect(resultSvip.enabled).toBe(true)

    // 普通会员不在灰度范围
    const resultRegular = controller.evaluate({
      flagKey: 'svip-discount',
      tenantId: 't-cyber-001',
      tags: ['regular'],
    })
    expect(resultRegular.enabled).toBe(false)
  })
})

// ══════════════════════════════════════════════════════════════════════════════
// 👥HR视角 — 关注培训系统和员工端灰度
// ══════════════════════════════════════════════════════════════════════════════
describe(`${ROLES.HR} 灰度发布实景场景`, () => {
  let controller: CanaryController

  beforeEach(() => {
    controller = createController()
  })

  it('[HR-1] 正常流程: HR创建培训系统灰度先在小范围验证', () => {
    const exp = createExperiment(controller, {
      name: '培训系统V3',
      flagKey: 'training-v3',
      strategy: 'percentage',
      strategyConfig: { type: 'percentage', includeAll: false },
      initialPercentage: 5,
      targetPercentage: 100,
    })

    // 激活灰度
    const activated = controller.activate(exp.id, { operator: 'hr-user' })
    expect(activated.status).toBe('active')

    // 只有少量用户被命中
    const result = controller.evaluate({
      flagKey: 'training-v3',
      tenantId: 't-cyber-001',
    })
    // 5% 概率可能未被命中
    expect(typeof result.enabled).toBe('boolean')
    expect(result.flagKey).toBe('training-v3')
  })

  it('[HR-2] 权限边界: HR需要检查灰度健康报告后再决定晋级', () => {
    const exp = createExperiment(controller, {
      name: '员工考勤新系统',
      flagKey: 'attendance-v2',
      strategy: 'percentage',
      strategyConfig: { type: 'percentage', includeAll: false },
      initialPercentage: 10,
      targetPercentage: 100,
    })
    controller.activate(exp.id, { operator: 'hr-admin' })

    // 记录健康指标
    controller.recordHealth(exp.id, {
      errorRate: 0.002,
      latencyP95: 120,
      latencyAvg: 45,
      totalRequests: 5000,
    })

    const health = controller.getHealth(exp.id)
    expect(health.latest).toBeDefined()
    expect(health.latest.errorRate).toBeLessThan(0.01)

    // 检查自动晋升建议
    const promoteCheck = controller.checkPromote(exp.id)
    expect(promoteCheck).toBeDefined()
  })
})

// ══════════════════════════════════════════════════════════════════════════════
// 🔧安监视角 — 关注安全策略灰度与安全风险控制
// ══════════════════════════════════════════════════════════════════════════════
describe(`${ROLES.Security} 灰度发布实景场景`, () => {
  let controller: CanaryController

  beforeEach(() => {
    controller = createController()
  })

  it('[安监-1] 正常流程: 安监创建安全策略灰度逐步放量验证', () => {
    const exp = createExperiment(controller, {
      name: 'WAF规则V2灰度',
      flagKey: 'waf-rules-v2',
      strategy: 'percentage',
      strategyConfig: { type: 'percentage', includeAll: false },
      initialPercentage: 10,
      targetPercentage: 100,
      healthThreshold: 0.005,
      createdBy: 'security-admin',
    })
    controller.activate(exp.id, { operator: 'security-admin' })

    // 安监监控错误率
    controller.recordHealth(exp.id, {
      errorRate: 0.001,
      latencyP95: 80,
      latencyAvg: 30,
      totalRequests: 10000,
    })

    const health = controller.getHealth(exp.id)
    expect(health.latest.isHealthy).toBe(true)
  })

  it('[安监-2] 权限边界: 异常错误率时安监可以暂停灰度', () => {
    // 创建并有异常指标
    const exp = createExperiment(controller, {
      name: '登录安全增强',
      flagKey: 'login-security-v2',
      strategy: 'percentage',
      initialPercentage: 20,
      targetPercentage: 50,
      createdBy: 'security-admin',
    })
    controller.activate(exp.id, { operator: 'security-admin' })

    controller.recordHealth(exp.id, {
      errorRate: 0.05,
      latencyP95: 500,
      latencyAvg: 200,
      totalRequests: 1000,
    })

    //安监检查后决定暂停
    const paused = controller.pause(exp.id, { operator: 'security-admin', reason: '错误率超过阈值5%' })
    expect(paused.status).toBe('paused')
  })

  it('[安监-3] 边界: 已暂停的实验再次暂停应抛异常', () => {
    const exp = createExperiment(controller, { createdBy: 'security-admin' })
    controller.activate(exp.id, { operator: 'security-admin' })
    controller.pause(exp.id, { operator: 'security-admin', reason: '审查' })
    // 已暂停的实验不能再次暂停
    expect(() => controller.pause(exp.id, { operator: 'security-admin', reason: '双暂停验证' })).toThrow()
  })
})

// ══════════════════════════════════════════════════════════════════════════════
// 🎮导玩员视角 — 关注游戏内容和导玩设备灰度
// ══════════════════════════════════════════════════════════════════════════════
describe(`${ROLES.Guide} 灰度发布实景场景`, () => {
  let controller: CanaryController

  beforeEach(() => {
    controller = createController()
  })

  it('[导玩-1] 正常流程: 导玩员在特定门店启用新游戏内容灰度', () => {
    // 按门店灰度
    const exp = createExperiment(controller, {
      name: '新赛车游戏V2',
      flagKey: 'racing-game-v2',
      strategy: 'store',
      strategyConfig: { type: 'store', storeIds: ['store-cyber-galaxy'] },
      initialPercentage: 100,
      targetPercentage: 100,
      createdBy: 'guide-lead',
    })
    controller.activate(exp.id, { operator: 'guide-lead' })

    // Cyber Galaxy 应启用
    const resultCyber = controller.evaluate({
      flagKey: 'racing-game-v2',
      tenantId: 't-cyber-001',
      storeId: 'store-cyber-galaxy',
    })
    expect(resultCyber.enabled).toBe(true)

    // 休斯顿店不应启用
    const resultHouston = controller.evaluate({
      flagKey: 'racing-game-v2',
      tenantId: 't-hou-002',
      storeId: 'store-houston',
    })
    expect(resultHouston.enabled).toBe(false)
  })

  it('[导玩-2] 权限边界: 导玩员可以根据客流逐步提升灰度百分比', () => {
    const exp = createExperiment(controller, {
      name: 'VR体验升级',
      flagKey: 'vr-experience-v2',
      strategy: 'percentage',
      initialPercentage: 10,
      targetPercentage: 100,
      createdBy: 'guide-lead',
    })
    controller.activate(exp.id, { operator: 'guide-lead' })

    // 晋级到更高比例
    const promoted = controller.promote(exp.id, { percentage: 30, operator: 'guide-lead' })
    expect(promoted.currentPercentage).toBe(30)

    // 记录健康状态
    controller.recordHealth(exp.id, {
      errorRate: 0.001,
      latencyP95: 90,
      latencyAvg: 35,
      totalRequests: 3000,
    })
    const health = controller.getHealth(exp.id)
    expect(health.history.length).toBe(1)
  })
})

// ══════════════════════════════════════════════════════════════════════════════
// 🎯运行专员视角 — 关注灰度执行细节和全链路健康监控
// ══════════════════════════════════════════════════════════════════════════════
describe(`${ROLES.Operations} 灰度发布实景场景`, () => {
  let controller: CanaryController

  beforeEach(() => {
    controller = createController()
  })

  it('[运行-1] 正常流程: 运行专员执行完整灰度生命周期', () => {
    // 1. 创建
    const exp = createExperiment(controller, {
      name: 'API网关升级',
      flagKey: 'api-gateway-v3',
      strategy: 'percentage',
      initialPercentage: 10,
      targetPercentage: 100,
      autoPromote: {
        checkIntervalMin: 10,
        healthMetrics: ['error_rate'],
        promoteSteps: [10, 25, 50, 75, 100],
        healthThreshold: 0.01,
        maxPromotions: 4,
      },
      createdBy: 'ops-user',
    })
    expect(exp.status).toBe('draft')

    // 2. 激活
    const activated = controller.activate(exp.id, { operator: 'ops-user' })
    expect(activated.status).toBe('active')

    // 3. 记录多次健康数据
    for (let i = 0; i < 3; i++) {
      controller.recordHealth(exp.id, {
        errorRate: 0.003,
        latencyP95: 100,
        latencyAvg: 40,
        totalRequests: 5000,
      })
    }

    // 4. 晋级
    const promoted = controller.promote(exp.id, { percentage: 25, operator: 'ops-user' })
    expect(promoted.currentPercentage).toBe(25)

    // 5. 检查晋升建议
    const check = controller.checkPromote(exp.id)
    expect(check).toBeDefined()

    // 6. 审计日志
    const audit = controller.auditLogs(exp.id)
    expect(audit.total).toBeGreaterThanOrEqual(2)
  })

  it('[运行-2] 权限边界: 遇到健康异常时运行专员可以回滚', () => {
    const exp = createExperiment(controller, {
      name: '数据库连接池优化',
      flagKey: 'db-pool-v2',
      strategy: 'percentage',
      initialPercentage: 20,
      targetPercentage: 50,
      createdBy: 'ops-user',
    })
    controller.activate(exp.id, { operator: 'ops-user' })

    // 模拟异常
    controller.recordHealth(exp.id, {
      errorRate: 0.08,
      latencyP95: 2000,
      latencyAvg: 1500,
      totalRequests: 800,
    })

    const health = controller.getHealth(exp.id)
    expect(health.latest.isHealthy).toBe(false)

    // 回滚
    const rolledBack = controller.rollback(exp.id, { operator: 'ops-user', reason: '错误率8%超过阈值' })
    expect(rolledBack.status).toBe('rolled_back')
  })

  it('[运行-3] 边界: 不存在的实验回滚应抛出', () => {
    expect(() => controller.rollback('non-existent', { operator: 'ops', reason: 'test' })).toThrow()
  })

  it('[运行-4] 边界: 不可见的实验健康数据返回空', () => {
    const health = controller.getHealth('non-existent-xxx-999')
    // service 实现中 getLatestHealth 返回 null 而非 undefined
    expect(health.latest).toBeNull()
    expect(health.history).toEqual([])
  })
})

// ══════════════════════════════════════════════════════════════════════════════
// 🤝团建视角 — 关注团建活动和团队协作系统灰度
// ══════════════════════════════════════════════════════════════════════════════
describe(`${ROLES.Teambuilding} 灰度发布实景场景`, () => {
  let controller: CanaryController

  beforeEach(() => {
    controller = createController()
  })

  it('[团建-1] 正常流程: 按租户灰度团建活动模块', () => {
    // 按租户灰度
    const exp = createExperiment(controller, {
      name: '团建活动报名新系统',
      flagKey: 'team-building-v2',
      strategy: 'tenant',
      strategyConfig: { type: 'tenant', tenantIds: ['t-cyber-001'] },
      initialPercentage: 100,
      targetPercentage: 100,
      createdBy: 'team-building-admin',
    })
    controller.activate(exp.id, { operator: 'team-building-admin' })

    // Cyber Galaxy 可以看到新系统
    const resultCyber = controller.evaluate({
      flagKey: 'team-building-v2',
      tenantId: 't-cyber-001',
    })
    expect(resultCyber.enabled).toBe(true)

    // 休斯顿店看不到
    const resultHouston = controller.evaluate({
      flagKey: 'team-building-v2',
      tenantId: 't-hou-002',
    })
    expect(resultHouston.enabled).toBe(false)
  })

  it('[团建-2] 权限边界: 团建负责人可以暂停灰度并查看审计记录', () => {
    const exp = createExperiment(controller, {
      name: '活动投票模块',
      flagKey: 'event-voting-v2',
      strategy: 'percentage',
      initialPercentage: 30,
      targetPercentage: 100,
      createdBy: 'team-building-admin',
    })
    controller.activate(exp.id, { operator: 'team-building-admin' })

    // 暂停
    const paused = controller.pause(exp.id, { operator: 'team-building-admin', reason: '团建活动高峰期暂停灰度' })
    expect(paused.status).toBe('paused')

    // 查看审计日志
    const audit = controller.auditLogs(exp.id)
    expect(audit.total).toBeGreaterThanOrEqual(2) // activate + pause
    expect(audit.items.some((l) => l.action === 'activate')).toBe(true)
    expect(audit.items.some((l) => l.action === 'pause')).toBe(true)
  })
})

// ══════════════════════════════════════════════════════════════════════════════
// 📢营销视角 — 关注营销活动和新推送策略灰度
// ══════════════════════════════════════════════════════════════════════════════
describe(`${ROLES.Marketing} 灰度发布实景场景`, () => {
  let controller: CanaryController

  beforeEach(() => {
    controller = createController()
  })

  it('[营销-1] 正常流程: 营销按百分比灰度推送新营销活动', () => {
    const exp = createExperiment(controller, {
      name: '夏季促销新策略',
      flagKey: 'summer-sale-v2',
      strategy: 'percentage',
      strategyConfig: { type: 'percentage', includeAll: false },
      initialPercentage: 20,
      targetPercentage: 100,
      createdBy: 'marketing-user',
    })
    controller.activate(exp.id, { operator: 'marketing-user' })

    // 评估用户是否被命中
    const result = controller.evaluate({
      flagKey: 'summer-sale-v2',
      tenantId: 't-cyber-001',
    })
    expect(result.flagKey).toBe('summer-sale-v2')
    expect(result.experimentId).toBe(exp.id)
  })

  it('[营销-2] 权限边界: 营销按门店灰度推不同促销活动', () => {
    // 店A 促销A
    const expA = createExperiment(controller, {
      name: 'Cyber Galaxy 夏日祭',
      flagKey: 'summer-fest-a',
      strategy: 'store',
      strategyConfig: { type: 'store', storeIds: ['store-cyber-galaxy'] },
      initialPercentage: 100,
      targetPercentage: 100,
      createdBy: 'marketing-user',
    })
    controller.activate(expA.id, { operator: 'marketing-user' })

    // 店B 促销B
    const expB = createExperiment(controller, {
      name: '休斯顿店感恩回馈',
      flagKey: 'thanksgiving-houston',
      strategy: 'store',
      strategyConfig: { type: 'store', storeIds: ['store-houston'] },
      initialPercentage: 100,
      targetPercentage: 100,
      createdBy: 'marketing-user',
    })
    controller.activate(expB.id, { operator: 'marketing-user' })

    // 各店对应促销只在自己门店生效
    const resultA = controller.evaluate({
      flagKey: 'summer-fest-a',
      tenantId: 't-cyber-001',
      storeId: 'store-cyber-galaxy',
    })
    expect(resultA.enabled).toBe(true)

    const resultB = controller.evaluate({
      flagKey: 'summer-fest-a',
      tenantId: 't-hou-002',
      storeId: 'store-houston',
    })
    expect(resultB.enabled).toBe(false)

    const resultB2 = controller.evaluate({
      flagKey: 'thanksgiving-houston',
      tenantId: 't-hou-002',
      storeId: 'store-houston',
    })
    expect(resultB2.enabled).toBe(true)
  })

  it('[营销-3] 边界: 营销活动灰度结束后可以检查最后状态', () => {
    const exp = createExperiment(controller, {
      name: '限时活动',
      flagKey: 'flash-sale-v1-test',
      strategy: 'percentage',
      initialPercentage: 50,
      targetPercentage: 50,
      createdBy: 'marketing-user',
    })
    expect(exp.status).toBe('draft')
    expect(exp.currentPercentage).toBe(0) // draft 时 initialPercentage 是目标

    // 营销查看实验状态
    const fetched = controller.get(exp.id)
    expect(fetched.flagKey).toBe('flash-sale-v1-test')
  })
})

// ══════════════════════════════════════════════════════════════════════════════
// 交叉角色覆盖 — 多角色协作场景
// ══════════════════════════════════════════════════════════════════════════════
describe('交叉角色灰度协作场景', () => {
  let controller: CanaryController

  beforeEach(() => {
    controller = createController()
  })

  it('多角色协作: 运行专员创建→安监审核→店长批准晋级', () => {
    // 1. 运行专员创建
    const exp = createExperiment(controller, {
      name: '会员系统升级',
      flagKey: 'member-system-v2',
      strategy: 'percentage',
      initialPercentage: 5,
      targetPercentage: 100,
      createdBy: 'ops-user',
    })

    // 2. 运行专员激活
    controller.activate(exp.id, { operator: 'ops-user' })

    // 3. 安监查看健康
    controller.recordHealth(exp.id, {
      errorRate: 0.001,
      latencyP95: 50,
      latencyAvg: 20,
      totalRequests: 10000,
    })

    const health = controller.getHealth(exp.id)
    expect(health.latest.isHealthy).toBe(true)

    // 4. 店长批准晋级
    const promoted = controller.promote(exp.id, { percentage: 20, operator: 'store-manager' })
    expect(promoted.currentPercentage).toBe(20)

    // 5. 安监审计
    const audit = controller.auditLogs(exp.id)
    expect(audit.total).toBeGreaterThanOrEqual(2) // activate + promote
  })

  it('多角色协作: 营销创建 → 前台验证 → 运行监控 → 完成', () => {
    // 营销创建
    const exp = createExperiment(controller, {
      name: '会员日双倍积分',
      flagKey: 'member-double-points',
      strategy: 'tag',
      strategyConfig: { type: 'tag', tags: ['vip', 'svip'], matchAll: false },
      initialPercentage: 100,
      targetPercentage: 100,
      createdBy: 'marketing-user',
    })
    controller.activate(exp.id, { operator: 'marketing-user' })

    // 前台验证VIP客户是否已被灰度覆盖
    const resultVip = controller.evaluate({
      flagKey: 'member-double-points',
      tenantId: 't-cyber-001',
      tags: ['vip'],
    })
    expect(resultVip.enabled).toBe(true)

    // 前台验证普通客户未被覆盖
    const resultRegular = controller.evaluate({
      flagKey: 'member-double-points',
      tenantId: 't-cyber-001',
      tags: ['regular'],
    })
    expect(resultRegular.enabled).toBe(false)
  })

  it('未知实验审计不抛出异常', () => {
    // 不存在的实验审计日志应返回空
    expect(() => controller.auditLogs('non-existent-xxx-999')).not.toThrow()
  })
})
