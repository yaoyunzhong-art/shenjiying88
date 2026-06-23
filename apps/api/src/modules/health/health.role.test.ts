import 'reflect-metadata'
import assert from 'node:assert/strict'
import test, { describe } from 'node:test'
import { HealthController } from './health.controller'
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
function createHealthController(overrides: {
  checkResult?: Partial<import('./health.entity').HealthCheckResult>
} = {}) {
  const defaultComponents = [
    { name: 'database', status: 'OK' as const, latencyMs: 5, detail: { connected: true } },
    { name: 'lyt-adapter', status: 'OK' as const, latencyMs: 3, detail: { mode: 'mock' } }
  ]

  const result = overrides.checkResult ?? {
    status: 'OK' as const,
    components: defaultComponents,
    uptimeSeconds: 3600,
    version: '1.0.0',
    lytMode: 'mock'
  }

  return {
    controller: new HealthController({
      check: () => Promise.resolve(result),
      ping: () => Promise.resolve({ alive: true, timestamp: new Date().toISOString() })
    } as never)
  }
}

// ── 通用 actor 上下文辅助 ──
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

const baseReadinessArgs = [
  { tenantId: 't-health', brandId: 'b-health' },
  makeActor([], []),
  { verbose: true }
] as const

// ──────────── 👔店长 ────────────
describe(`${ROLES.TenantAdmin} health 角色测试`, () => {
  test('店长可调用 readiness 获取系统完整健康信息', async () => {
    const { controller } = createHealthController()
    const result = await controller.getReadiness(
      { tenantId: 't-01', brandId: 'b-01' },
      makeActor(['TENANT_ADMIN'], ['foundation.governance.read']),
      { verbose: true }
    )

    assert.equal(result.status, 'OK')
    assert.equal(result.version, '1.0.0')
    assert.ok(Array.isArray(result.components))
    assert.ok(result.components.length >= 2)
    assert.equal(result.lytMode, 'mock')
  })

  test('店长无 governance.read 权限时 readiness 元数据不匹配（权限边界）', () => {
    const permittedRoles = Reflect.getMetadata(ROLES_METADATA_KEY, HealthController.prototype.getReadiness)
    const permittedPerms = Reflect.getMetadata(PERMISSIONS_METADATA_KEY, HealthController.prototype.getReadiness)

    // 店长在允许角色中
    assert.ok(permittedRoles.includes('TENANT_ADMIN'))
    // 但必须同时具备 foundation.governance.read 权限
    assert.deepEqual(permittedPerms, ['foundation.governance.read'])
  })
})

// ──────────── 🛒前台 ────────────
describe(`${ROLES.Reception} health 角色测试`, () => {
  test('前台可通过 ping 获取轻量存活信息', async () => {
    const { controller } = createHealthController()
    const result = await controller.getPing()

    assert.equal(result.alive, true)
    assert.ok(typeof result.timestamp === 'string')
  })

  test('前台不在 readiness 允许角色列表中（权限边界）', () => {
    const roles = Reflect.getMetadata(ROLES_METADATA_KEY, HealthController.prototype.getReadiness)
    assert.ok(!roles.includes('RECEPTION'))
    assert.ok(!roles.includes('FRONT_DESK'))
  })
})

// ──────────── 👥HR ────────────
describe(`${ROLES.HR} health 角色测试`, () => {
  test('HR 不在 readiness 白名单中，仅能通过 ping 确认服务存活', async () => {
    const { controller } = createHealthController()

    const pingResult = await controller.getPing()
    assert.equal(pingResult.alive, true)
    assert.ok(pingResult.timestamp)

    // HR 不在 readiness 角色集合中
    const roles = Reflect.getMetadata(ROLES_METADATA_KEY, HealthController.prototype.getReadiness)
    assert.ok(!roles.includes('HR'))
  })

  test('HR 调用 ping 返回标准格式的时间戳', async () => {
    const { controller } = createHealthController()
    const r1 = await controller.getPing()
    const r2 = await controller.getPing()

    assert.equal(r1.alive, true)
    assert.equal(r2.alive, true)
    // 两次调用应有时间戳
    assert.ok(new Date(r1.timestamp).getTime() > 0)
    assert.ok(new Date(r2.timestamp).getTime() > 0)
  })
})

// ──────────── 🔧安监 ────────────
describe(`${ROLES.Safety} health 角色测试`, () => {
  test('安监 (SECURITY_ADMIN) 可调用 readiness 检查系统安全状态', async () => {
    const { controller } = createHealthController()
    const result = await controller.getReadiness(
      { tenantId: 't-safety', brandId: 'b-safety' },
      makeActor(['SECURITY_ADMIN'], ['foundation.governance.read']),
      { verbose: true }
    )

    assert.equal(result.status, 'OK')
    // 安全人员关心组件列表完整性
    assert.ok(result.components.find((c: { name: string }) => c.name === 'database') !== undefined)
    assert.ok(result.components.find((c: { name: string }) => c.name === 'lyt-adapter') !== undefined)
  })

  test('安监调用 readiness 需同时具备 SECURITY_ADMIN 角色和 governance.read 权限（双因素边界）', () => {
    const roles = Reflect.getMetadata(ROLES_METADATA_KEY, HealthController.prototype.getReadiness)
    const permissions = Reflect.getMetadata(PERMISSIONS_METADATA_KEY, HealthController.prototype.getReadiness)

    assert.ok(roles.includes('SECURITY_ADMIN'))
    assert.deepEqual(permissions, ['foundation.governance.read'])
  })
})

// ──────────── 🎮导玩员 ────────────
describe(`${ROLES.Guide} health 角色测试`, () => {
  test('导玩员通过根 health 端点获取基础健康信息', async () => {
    const { controller } = createHealthController()
    const result = await controller.getHealth()

    assert.equal(result.alive, true)
    assert.ok(typeof result.timestamp === 'string')
  })

  test('导玩员无权访问 readiness 详细健康数据（只读边界）', () => {
    const roles = Reflect.getMetadata(ROLES_METADATA_KEY, HealthController.prototype.getReadiness)
    assert.ok(!roles.includes('GUIDE'))
    assert.ok(!roles.includes('GAME_HOST'))
  })
})

// ──────────── 🎯运行专员 ────────────
describe(`${ROLES.Ops} health 角色测试`, () => {
  test('运行专员 (OPERATIONS) 可调用 readiness 获取运维监控数据', async () => {
    const { controller } = createHealthController()
    const result = await controller.getReadiness(
      { tenantId: 't-ops', brandId: 'b-ops' },
      makeActor(['OPERATIONS'], ['foundation.governance.read']),
      { verbose: true }
    )

    assert.equal(result.status, 'OK')
    assert.ok(result.uptimeSeconds >= 0)
    assert.ok(result.components.every((c: { latencyMs: number }) => c.latencyMs >= 0))
  })

  test('运行专员调用 readiness 时可观察到 lyt 模式', async () => {
    const { controller } = createHealthController()
    const result = await controller.getReadiness(
      { tenantId: 't-ops', brandId: 'b-ops' },
      makeActor(['OPERATIONS'], ['foundation.governance.read']),
      { verbose: true }
    )

    // 运行专员关心 LYT 集成状态
    assert.ok(typeof result.lytMode === 'string')
  })
})

// ──────────── 🤝团建 ────────────
describe(`${ROLES.Teambuilding} health 角色测试`, () => {
  test('团建通过 getHealth 确认系统可用后开展活动', async () => {
    const { controller } = createHealthController()
    const result = await controller.getHealth()

    assert.equal(result.alive, true)
    assert.ok(result.timestamp)
  })

  test('团建无权访问 readiness 内部组件详情（隔离边界）', () => {
    const roles = Reflect.getMetadata(ROLES_METADATA_KEY, HealthController.prototype.getReadiness)
    assert.ok(!roles.includes('TEAMBUILDING'))
    assert.ok(!roles.includes('TEAMBUILD'))
  })
})

// ──────────── 📢营销 ────────────
describe(`${ROLES.Marketing} health 角色测试`, () => {
  test('营销通过 ping 确认系统存活以便触达活动', async () => {
    const { controller } = createHealthController()
    const result = await controller.getPing()

    assert.equal(result.alive, true)
    assert.ok(result.timestamp)
  })

  test('营销不在 readiness 允许角色中，无权查看系统内部组件（权限边界）', () => {
    const roles = Reflect.getMetadata(ROLES_METADATA_KEY, HealthController.prototype.getReadiness)
    assert.ok(!roles.includes('MARKETING'))
    assert.ok(!roles.includes('PROMOTION'))
  })
})

// ──────────── 元数据回归 ────────────
describe('health 角色元数据回归', () => {
  test('readiness 端点要求 4 个特定角色 + 1 个权限', () => {
    const roles = Reflect.getMetadata(ROLES_METADATA_KEY, HealthController.prototype.getReadiness)
    const permissions = Reflect.getMetadata(PERMISSIONS_METADATA_KEY, HealthController.prototype.getReadiness)
    const tenantScope = Reflect.getMetadata(TENANT_SCOPE_METADATA_KEY, HealthController.prototype.getReadiness)

    assert.deepEqual(roles, ['SUPER_ADMIN', 'TENANT_ADMIN', 'OPERATIONS', 'SECURITY_ADMIN'])
    assert.deepEqual(permissions, ['foundation.governance.read'])
    assert.deepEqual(tenantScope, {})
  })

  test('ping 和根端点无角色/权限限制', () => {
    for (const method of ['getPing', 'getHealth'] as const) {
      const roles = Reflect.getMetadata(ROLES_METADATA_KEY, HealthController.prototype[method])
      const permissions = Reflect.getMetadata(PERMISSIONS_METADATA_KEY, HealthController.prototype[method])

      assert.equal(roles, undefined)
      assert.equal(permissions, undefined)
    }
  })

  test('所有允许角色在 readiness 白名单中确保运营连续性', () => {
    const roles: string[] = Reflect.getMetadata(ROLES_METADATA_KEY, HealthController.prototype.getReadiness)

    // 运维三剑客 + 超级管理员
    assert.ok(roles.includes('SUPER_ADMIN'))
    assert.ok(roles.includes('TENANT_ADMIN'))
    assert.ok(roles.includes('OPERATIONS'))
    assert.ok(roles.includes('SECURITY_ADMIN'))
  })
})
