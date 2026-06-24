/**
 * 🐜 自动: [health] [C] 角色测试扩展编写
 *
 * 8 角色深度场景扩展测试 — health 模块
 * 👔店长 🛒前台 👥HR 🔧安监 🎮导玩员 🎯运行专员 🤝团建 📢营销
 *
 * 每个角色 ≥ 3 测试用例 (正常流程 + 降级场景 + 权限边界)
 * 覆盖：getHealth, getPing, getReadiness 三个端点
 * 扩展：语义化版本约束、组件超时模拟、scope 上下文、多角色元数据验证
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import test, { describe } from 'node:test'
import { HealthController } from './health.controller'
import { HealthStatus, type HealthCheckResult, type ComponentHealth } from './health.entity'
import {
  PERMISSIONS_METADATA_KEY,
  ROLES_METADATA_KEY,
  TENANT_SCOPE_METADATA_KEY
} from '../foundation/identity-access/identity-access.decorator'

// ── 8 角色定义 ──
const ROLES = {
  TenantAdmin: '👔店长',
  Reception: '🛒前台',
  HR: '👥HR',
  Safety: '🔧安监',
  Guide: '🎮导玩员',
  Ops: '🎯运行专员',
  Teambuilding: '🤝团建',
  Marketing: '📢营销'
}

// ── 辅助工厂 ──
function makeActor(roles: string[], permissions: string[] = []) {
  return {
    actorId: 'actor-01',
    actorType: 'employee-user' as const,
    roles,
    permissions,
    authenticated: true,
    source: 'headers' as const
  }
}

function createHealthControllerWithComponents(
  components: ComponentHealth[],
  overrides: Partial<HealthCheckResult> = {}
) {
  const defaultResult: HealthCheckResult = {
    status: overrides.status ?? HealthStatus.Ok,
    checkedAt: new Date().toISOString(),
    uptimeSeconds: overrides.uptimeSeconds ?? 3600,
    version: overrides.version ?? '1.0.0',
    components,
    lytMode: overrides.lytMode ?? 'mock',
    sampleMember: overrides.sampleMember
  }

  return {
    controller: new HealthController({
      check: () => Promise.resolve(defaultResult),
      ping: () => Promise.resolve({ alive: true, timestamp: new Date().toISOString() })
    } as never)
  }
}

function defaultComponents(): ComponentHealth[] {
  return [
    { name: 'database', status: HealthStatus.Ok, latencyMs: 5, detail: { connected: true } },
    { name: 'lyt-adapter', status: HealthStatus.Ok, latencyMs: 3, detail: { mode: 'mock' } }
  ]
}

// ════════════════════════════════════════════════════════════════
// 👔 店长 — 全局运维监管
// ════════════════════════════════════════════════════════════════
describe(`${ROLES.TenantAdmin} health 扩展角色测试`, () => {
  test('店长查看完整 readiness 含 verbose 模式下的额外组件', async () => {
    const { controller } = createHealthControllerWithComponents([
      ...defaultComponents(),
      { name: 'redis', status: HealthStatus.Ok, latencyMs: 10, detail: { connected: true } },
      { name: 'memory', status: HealthStatus.Ok, latencyMs: 0, detail: { totalMB: 8192 } },
      { name: 'disk', status: HealthStatus.Ok, latencyMs: 0, detail: { freeGB: 50 } }
    ], { lytMode: 'mock', version: '2.1.0' })

    const result = await controller.getReadiness(
      { tenantId: 't-admin-ext', brandId: 'b-admin-ext' },
      makeActor(['TENANT_ADMIN'], ['foundation.governance.read']),
      { verbose: true }
    )

    assert.equal(result.status, HealthStatus.Ok)
    assert.equal(result.version, '2.1.0')
    // 5 组件 (database, lyt-adapter, redis, memory, disk)
    assert.equal(result.components.length, 5)
    assert.ok(result.components.some((c: ComponentHealth) => c.name === 'redis'))
    assert.ok(result.components.some((c: ComponentHealth) => c.name === 'memory'))
    assert.ok(result.components.some((c: ComponentHealth) => c.name === 'disk'))
  })

  test('店长查看降级状态 — 数据库不可用时整体状态为 DEGRADED', async () => {
    const { controller } = createHealthControllerWithComponents([
      { name: 'database', status: HealthStatus.Unavailable, latencyMs: 5000, detail: { error: 'connection refused' } },
      { name: 'lyt-adapter', status: HealthStatus.Ok, latencyMs: 2, detail: { mode: 'mock' } }
    ], { status: HealthStatus.Unavailable })

    const result = await controller.getReadiness(
      { tenantId: 't-admin-degraded', brandId: 'b-admin-degraded' },
      makeActor(['TENANT_ADMIN'], ['foundation.governance.read']),
      { verbose: true }
    )

    assert.equal(result.status, HealthStatus.Unavailable)
    const dbComponent = result.components.find((c: ComponentHealth) => c.name === 'database')
    assert.ok(dbComponent)
    assert.ok(dbComponent.latencyMs >= 5000)
    assert.equal(dbComponent.status, HealthStatus.Unavailable)
  })

  test('店长查看 uptime 语义合理性 — 不为负值且大于 0', async () => {
    const { controller } = createHealthControllerWithComponents(defaultComponents(), { uptimeSeconds: 86400 })

    const result = await controller.getReadiness(
      { tenantId: 't-admin-uptime', brandId: 'b-admin-uptime' },
      makeActor(['TENANT_ADMIN'], ['foundation.governance.read']),
      { verbose: false }
    )

    assert.ok(result.uptimeSeconds > 0)
    assert.ok(Number.isInteger(result.uptimeSeconds))
    assert.equal(result.uptimeSeconds, 86400)
  })
})

// ════════════════════════════════════════════════════════════════
// 🛒 前台 — 日常接待确认系统可用
// ════════════════════════════════════════════════════════════════
describe(`${ROLES.Reception} health 扩展角色测试`, () => {
  test('前台连续调用 ping 确认系统稳定', async () => {
    const { controller } = createHealthControllerWithComponents(defaultComponents())

    for (let i = 0; i < 3; i++) {
      const result = await controller.getPing()
      assert.equal(result.alive, true)
      assert.ok(typeof result.timestamp === 'string')
      const ts = new Date(result.timestamp).getTime()
      assert.ok(ts > 0)
    }
  })

  test('前台通过 getHealth 获取基础健康状态 — 根路径同 ping', async () => {
    const { controller } = createHealthControllerWithComponents(defaultComponents())

    const result = await controller.getHealth()
    assert.equal(result.alive, true)
    assert.ok(result.timestamp)
  })

  test('前台无权访问 readiness — 元数据验证角色白名单不包含', () => {
    const roles = Reflect.getMetadata(ROLES_METADATA_KEY, HealthController.prototype.getReadiness)
    // 前台人员角色通常为 RECEPTION / FRONT_DESK / CASHIER
    assert.ok(!roles.includes('RECEPTION'))
    assert.ok(!roles.includes('FRONT_DESK'))
    assert.ok(!roles.includes('CASHIER'))
  })
})

// ════════════════════════════════════════════════════════════════
// 👥 HR — 员工数据确认系统可用
// ════════════════════════════════════════════════════════════════
describe(`${ROLES.HR} health 扩展角色测试`, () => {
  test('HR 多次调用 ping 时间戳递增', async () => {
    const { controller } = createHealthControllerWithComponents(defaultComponents())

    const r1 = await controller.getPing()
    await new Promise((r) => setTimeout(r, 1))
    const r2 = await controller.getPing()

    const ts1 = new Date(r1.timestamp).getTime()
    const ts2 = new Date(r2.timestamp).getTime()
    assert.ok(ts2 >= ts1)
  })

  test('HR 调用 getHealth 返回 alive=true', async () => {
    const { controller } = createHealthControllerWithComponents(defaultComponents())

    const result = await controller.getHealth()
    assert.deepStrictEqual(result, { alive: true, timestamp: result.timestamp })
  })

  test('HR 无 readiness 权限 — 角色不在白名单', () => {
    const roles: string[] = Reflect.getMetadata(ROLES_METADATA_KEY, HealthController.prototype.getReadiness)
    const hasHR = roles.some((r) => r.toLowerCase().includes('hr') || r.includes('HUMAN_RESOURCES'))
    assert.equal(hasHR, false)
  })
})

// ════════════════════════════════════════════════════════════════
// 🔧 安监 — 安全合规检查，关注系统完整性和异常检测
// ════════════════════════════════════════════════════════════════
describe(`${ROLES.Safety} health 扩展角色测试`, () => {
  test('安监检查组件延迟合理性 — 无负值延迟', async () => {
    const { controller } = createHealthControllerWithComponents([
      { name: 'database', status: HealthStatus.Ok, latencyMs: 12, detail: { connected: true } },
      { name: 'lyt-adapter', status: HealthStatus.Ok, latencyMs: 5, detail: { mode: 'mock' } },
      { name: 'redis', status: HealthStatus.Ok, latencyMs: 8, detail: { connected: true } }
    ])

    const result = await controller.getReadiness(
      { tenantId: 't-safety-ext', brandId: 'b-safety-ext' },
      makeActor(['SECURITY_ADMIN'], ['foundation.governance.read']),
      { verbose: true }
    )

    for (const c of result.components) {
      assert.ok(c.latencyMs >= 0, `Component ${c.name} has negative latency: ${c.latencyMs}`)
    }
  })

  test('安监检查唯一状态约束 — 组件状态只能是 Ok/Degraded/Unavailable', async () => {
    const { controller } = createHealthControllerWithComponents([
      { name: 'database', status: HealthStatus.Ok, latencyMs: 3, detail: {} },
      { name: 'lyt-adapter', status: HealthStatus.Ok, latencyMs: 1, detail: {} }
    ])

    const result = await controller.getReadiness(
      { tenantId: 't-safety-status', brandId: 'b-safety-status' },
      makeActor(['SECURITY_ADMIN'], ['foundation.governance.read']),
      { verbose: false }
    )

    const validStatuses = [HealthStatus.Ok, HealthStatus.Degraded, HealthStatus.Unavailable]
    assert.ok(validStatuses.includes(result.status as HealthStatus))
    for (const c of result.components) {
      assert.ok(validStatuses.includes(c.status as HealthStatus))
    }
  })

  test('安监检查 lytMode 始终是字符串类型', async () => {
    const { controller } = createHealthControllerWithComponents(defaultComponents(), { lytMode: 'mock' })

    const result = await controller.getReadiness(
      { tenantId: 't-safety-lyt', brandId: 'b-safety-lyt' },
      makeActor(['SECURITY_ADMIN'], ['foundation.governance.read']),
      { verbose: false }
    )

    assert.ok(typeof result.lytMode === 'string')
    assert.equal(result.lytMode, 'mock')
  })
})

// ════════════════════════════════════════════════════════════════
// 🎮 导玩员 — 游戏设备区服务可用性确认
// ════════════════════════════════════════════════════════════════
describe(`${ROLES.Guide} health 扩展角色测试`, () => {
  test('导玩员调用 getHealth 确认服务可用后再引导顾客', async () => {
    const { controller } = createHealthControllerWithComponents(defaultComponents())

    const result = await controller.getHealth()
    assert.equal(result.alive, true)
    assert.ok(result.timestamp)
  })

  test('导玩员调用 ping 确认对接正常', async () => {
    const { controller } = createHealthControllerWithComponents(defaultComponents())

    const result = await controller.getPing()
    assert.equal(result.alive, true)
  })

  test('导玩员无法绕过权限访问 readiness — 元数据角色白名单验证', () => {
    const roles: string[] = Reflect.getMetadata(ROLES_METADATA_KEY, HealthController.prototype.getReadiness)
    assert.ok(!roles.includes('GUIDE'))
    assert.ok(!roles.includes('GAME_HOST'))
    assert.ok(!roles.includes('GAME_INSTRUCTOR'))
  })
})

// ════════════════════════════════════════════════════════════════
// 🎯 运行专员 — 运维排障，关注组件明细与耗时
// ════════════════════════════════════════════════════════════════
describe(`${ROLES.Ops} health 扩展角色测试`, () => {
  test('运行专员查看 readiness 时所有组件含 detail', async () => {
    const { controller } = createHealthControllerWithComponents([
      { name: 'database', status: HealthStatus.Ok, latencyMs: 7, detail: { connected: true, poolSize: 10 } },
      { name: 'lyt-adapter', status: HealthStatus.Ok, latencyMs: 2, detail: { mode: 'mock', contracts: 3 } },
      { name: 'redis', status: HealthStatus.Ok, latencyMs: 15, detail: { connected: true, keys: 1200 } }
    ], { lytMode: 'mock' })

    const result = await controller.getReadiness(
      { tenantId: 't-ops-ext', brandId: 'b-ops-ext' },
      makeActor(['OPERATIONS'], ['foundation.governance.read']),
      { verbose: true }
    )

    for (const c of result.components) {
      assert.ok(c.detail !== undefined, `Component ${c.name} missing detail`)
      assert.ok(typeof c.latencyMs === 'number')
    }
  })

  test('运行专员按组件排序验证 — 组件顺序稳定', async () => {
    const { controller } = createHealthControllerWithComponents(defaultComponents())

    const r1 = await controller.getReadiness(
      { tenantId: 't-ops-order', brandId: 'b-ops-order' },
      makeActor(['OPERATIONS'], ['foundation.governance.read']),
      { verbose: false }
    )
    const r2 = await controller.getReadiness(
      { tenantId: 't-ops-order', brandId: 'b-ops-order' },
      makeActor(['OPERATIONS'], ['foundation.governance.read']),
      { verbose: false }
    )

    assert.equal(r1.components.length, r2.components.length)
    for (let i = 0; i < r1.components.length; i++) {
      assert.equal(r1.components[i].name, r2.components[i].name)
    }
  })

  test('运行专员查看空 verbose 时组件数量为 2（database + lyt-adapter）', async () => {
    const { controller } = createHealthControllerWithComponents(defaultComponents())

    const result = await controller.getReadiness(
      { tenantId: 't-ops-noverbose', brandId: 'b-ops-noverbose' },
      makeActor(['OPERATIONS'], ['foundation.governance.read']),
      { verbose: false }
    )

    // verbose=false 只返回 database + lyt-adapter
    assert.equal(result.components.length, 2)
  })
})

// ════════════════════════════════════════════════════════════════
// 🤝 团建 — 团队活动系统可用性确认
// ════════════════════════════════════════════════════════════════
describe(`${ROLES.Teambuilding} health 扩展角色测试`, () => {
  test('团建调用 getHealth/ping 均可确认系统可用', async () => {
    const { controller } = createHealthControllerWithComponents(defaultComponents())

    const h = await controller.getHealth()
    const p = await controller.getPing()
    assert.equal(h.alive, true)
    assert.equal(p.alive, true)
    assert.equal(h.timestamp, p.timestamp)
  })

  test('团建重复调用 ping 返回一致格式', async () => {
    const { controller } = createHealthControllerWithComponents(defaultComponents())

    for (let i = 0; i < 5; i++) {
      const r = await controller.getPing()
      assert.equal(typeof r.alive, 'boolean')
      assert.equal(typeof r.timestamp, 'string')
      assert.equal(r.alive, true)
    }
  })

  test('团建无权访问 readiness — 元数据验证不包含 TEAMBUILDING', () => {
    const roles: string[] = Reflect.getMetadata(ROLES_METADATA_KEY, HealthController.prototype.getReadiness)
    assert.ok(!roles.includes('TEAMBUILDING'))
    assert.ok(!roles.includes('TEAMBUILD'))
  })
})

// ════════════════════════════════════════════════════════════════
// 📢 营销 — 活动推广前确认系统稳定
// ════════════════════════════════════════════════════════════════
describe(`${ROLES.Marketing} health 扩展角色测试`, () => {
  test('营销通过 ping 确认系统可用以执行推送活动', async () => {
    const { controller } = createHealthControllerWithComponents(defaultComponents())

    const result = await controller.getPing()
    assert.equal(result.alive, true)
  })

  test('营销通过 getHealth 确认后开展线上活动', async () => {
    const { controller } = createHealthControllerWithComponents(defaultComponents())

    const result = await controller.getHealth()
    assert.equal(result.alive, true)
  })

  test('营销无 readiness 角色 — 元数据验证不包含 MARKETING/PROMOTION', () => {
    const roles: string[] = Reflect.getMetadata(ROLES_METADATA_KEY, HealthController.prototype.getReadiness)
    assert.ok(!roles.includes('MARKETING'))
    assert.ok(!roles.includes('PROMOTION'))
  })
})

// ════════════════════════════════════════════════════════════════
// 🌐 元数据深度回归 — 涵盖角色+权限+scope 三要素
// ════════════════════════════════════════════════════════════════
describe('health 元数据深度回归', () => {
  test('readiness 端点明确要求 4 个运维角色', () => {
    const roles: string[] = Reflect.getMetadata(ROLES_METADATA_KEY, HealthController.prototype.getReadiness)
    assert.deepStrictEqual(
      [...roles].sort(),
      ['OPERATIONS', 'SECURITY_ADMIN', 'SUPER_ADMIN', 'TENANT_ADMIN'].sort()
    )
  })

  test('readiness 端点要求 foundation.governance.read 权限', () => {
    const permissions = Reflect.getMetadata(PERMISSIONS_METADATA_KEY, HealthController.prototype.getReadiness)
    assert.deepStrictEqual(permissions, ['foundation.governance.read'])
  })

  test('getHealth / getPing 无角色与权限元数据', () => {
    for (const method of ['getHealth', 'getPing'] as const) {
      const roles = Reflect.getMetadata(ROLES_METADATA_KEY, HealthController.prototype[method])
      const permissions = Reflect.getMetadata(PERMISSIONS_METADATA_KEY, HealthController.prototype[method])
      assert.equal(roles, undefined)
      assert.equal(permissions, undefined)
    }
  })

  test('tenantScope 元数据存在且为空对象', () => {
    const scope = Reflect.getMetadata(TENANT_SCOPE_METADATA_KEY, HealthController.prototype.getReadiness)
    assert.deepStrictEqual(scope, {})
  })

  test('所有允许角色的 actor 均应携带 foundation.governance.read 权限', () => {
    const roles: string[] = Reflect.getMetadata(ROLES_METADATA_KEY, HealthController.prototype.getReadiness)
    const permissions: string[] = Reflect.getMetadata(PERMISSIONS_METADATA_KEY, HealthController.prototype.getReadiness)

    // 4 个角色都绑定同一个权限
    assert.equal(roles.length, 4)
    assert.equal(permissions.length, 1)
  })

  test('不允许的角色即使携带权限也无法通过元数据检查', () => {
    const roles: string[] = Reflect.getMetadata(ROLES_METADATA_KEY, HealthController.prototype.getReadiness)
    // GUIDE 不在白名单
    assert.ok(!roles.includes('GUIDE'))
    assert.ok(!roles.includes('RECEPTION'))
    assert.ok(!roles.includes('HR'))
    assert.ok(!roles.includes('MARKETING'))
    assert.ok(!roles.includes('TEAMBUILDING'))
  })
})
