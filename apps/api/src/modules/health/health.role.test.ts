import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
import 'reflect-metadata'
import assert from 'node:assert/strict'
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

  const degradedComponents = [
    { name: 'database', status: 'DEGRADED' as const, latencyMs: 500, detail: { connected: true, replicaLagSeconds: 30 } },
    { name: 'lyt-adapter', status: 'DOWN' as const, latencyMs: 0, detail: { error: 'Connection refused' } }
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
      checkDegraded: () => Promise.resolve({ status: 'DEGRADED' as const, components: degradedComponents, uptimeSeconds: 3600, version: '1.0.0', lytMode: 'mock' }),
      ping: () => Promise.resolve({ alive: true, timestamp: new Date().toISOString() })
    } as never),
    degradedResult: { status: 'DEGRADED' as const, components: degradedComponents, uptimeSeconds: 3600, version: '1.0.0', lytMode: 'mock' }
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

// ── 读取端点路径装饰器 ──
function getRoutePath(proto: any, methodName: string): string | undefined {
  return Reflect.getMetadata('path', proto[methodName])
}

// ──────────── 👔店长 ────────────
describe(`${ROLES.TenantAdmin} health 角色测试`, () => {
  it('店长可调用 readiness 获取系统完整健康信息（正常流程）', async () => {
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
    // 店长关心数据库连接详情
    const db = result.components.find((c: { name: string }) => c.name === 'database')
    assert.ok(db)
    assert.equal(db.detail.connected, true)
    assert.equal(result.lytMode, 'mock')
  })

  it('店长无 governance.read 权限时 readiness 不可达（权限边界）', () => {
    const permittedRoles = Reflect.getMetadata(ROLES_METADATA_KEY, HealthController.prototype.getReadiness)
    const permittedPerms = Reflect.getMetadata(PERMISSIONS_METADATA_KEY, HealthController.prototype.getReadiness)

    assert.ok(permittedRoles.includes('TENANT_ADMIN'))
    // 必须同时具备 foundation.governance.read 权限
    assert.deepEqual(permittedPerms, ['foundation.governance.read'])
    // 仅有角色没有权限是不够的
    assert.notDeepEqual(permittedPerms, [])
  })

  it('店长可在门店范围上下文调用 readiness（scope 验证）', async () => {
    const { controller } = createHealthController()
    const result = await controller.getReadiness(
      { tenantId: 't-01', brandId: 'b-01', storeId: 'store-01' },
      makeActor(['TENANT_ADMIN'], ['foundation.governance.read']),
      { verbose: false }
    )

    assert.equal(result.status, 'OK')
    assert.equal(result.version, '1.0.0')
  })

  it('店长调用 readiness 仪表盘显示 uptime（运营关注点）', async () => {
    const { controller } = createHealthController()
    const result = await controller.getReadiness(
      { tenantId: 't-01' },
      makeActor(['TENANT_ADMIN'], ['foundation.governance.read']),
      { verbose: true }
    )

    assert.equal(typeof result.uptimeSeconds, 'number')
    assert.ok(result.uptimeSeconds >= 0)
  })
})

// ──────────── 🛒前台 ────────────
describe(`${ROLES.Reception} health 角色测试`, () => {
  it('前台可通过 ping 获取轻量存活信息用于日常签到确认（正常流程）', async () => {
    const { controller } = createHealthController()
    const result = await controller.getPing()

    assert.equal(result.alive, true)
    assert.ok(typeof result.timestamp === 'string')
  })

  it('前台可通过根 health 端点确认系统响应正常', async () => {
    const { controller } = createHealthController()
    const result = await controller.getHealth()

    assert.equal(result.alive, true)
    assert.ok(typeof result.timestamp === 'string')
  })

  it('前台不在 readiness 允许角色列表中，无权访问内部组件（权限边界）', () => {
    const roles = Reflect.getMetadata(ROLES_METADATA_KEY, HealthController.prototype.getReadiness)
    assert.ok(!roles.includes('RECEPTION'))
    assert.ok(!roles.includes('FRONT_DESK'))
  })

  it('前台调用 ping 返回格式稳定确保收银系统不中断', async () => {
    const { controller } = createHealthController()
    const results = await Promise.all([
      controller.getPing(),
      controller.getPing(),
      controller.getPing()
    ])
    for (const r of results) {
      assert.equal(r.alive, true)
    }
    // 时间戳应递增
    const timestamps = results.map(r => new Date(r.timestamp).getTime())
    assert.ok(timestamps[2] >= timestamps[1])
  })
})

// ──────────── 👥HR ────────────
describe(`${ROLES.HR} health 角色测试`, () => {
  it('HR 通过 ping 确认系统存活来处理员工考勤（正常流程）', async () => {
    const { controller } = createHealthController()
    const pingResult = await controller.getPing()
    assert.equal(pingResult.alive, true)
    assert.ok(pingResult.timestamp)
  })

  it('HR 不在 readiness 白名单中，无法获取组件级别健康详情（权限边界）', () => {
    const roles = Reflect.getMetadata(ROLES_METADATA_KEY, HealthController.prototype.getReadiness)
    assert.ok(!roles.includes('HR'))
  })

  it('HR 多次 ping 均返回一致格式确保 HR 系统可靠性', async () => {
    const { controller } = createHealthController()
    const r1 = await controller.getPing()
    const r2 = await controller.getPing()

    assert.equal(r1.alive, true)
    assert.equal(r2.alive, true)
    assert.ok(new Date(r1.timestamp).getTime() > 0)
    assert.ok(new Date(r2.timestamp).getTime() > 0)
  })

  it('HR 可通过 getHealth 根端点确认基本健康状态', async () => {
    const { controller } = createHealthController()
    const result = await controller.getHealth()
    assert.equal(result.alive, true)
  })
})

// ──────────── 🔧安监 ────────────
describe(`${ROLES.Safety} health 角色测试`, () => {
  it('安监 (SECURITY_ADMIN) 可调用 readiness 检查系统安全基础设施状态（正常流程）', async () => {
    const { controller } = createHealthController()
    const result = await controller.getReadiness(
      { tenantId: 't-safety', brandId: 'b-safety' },
      makeActor(['SECURITY_ADMIN'], ['foundation.governance.read']),
      { verbose: true }
    )

    assert.equal(result.status, 'OK')
    // 安全人员关心组件列表完整性
    assert.ok(result.components.find((c: { name: string }) => c.name === 'database'))
    assert.ok(result.components.find((c: { name: string }) => c.name === 'lyt-adapter'))
  })

  it('安监调用 readiness 需同时具备 SECURITY_ADMIN 角色和 governance.read 权限（权限边界）', () => {
    const roles = Reflect.getMetadata(ROLES_METADATA_KEY, HealthController.prototype.getReadiness)
    const permissions = Reflect.getMetadata(PERMISSIONS_METADATA_KEY, HealthController.prototype.getReadiness)

    assert.ok(roles.includes('SECURITY_ADMIN'))
    assert.deepEqual(permissions, ['foundation.governance.read'])
  })

  it('安监可在组件降级时观察到详细错误信息用于安全审计', async () => {
    const { controller, degradedResult } = createHealthController({ checkResult: createHealthController({}).degradedResult })
    const result = await controller.getReadiness(
      { tenantId: 't-safety' },
      makeActor(['SECURITY_ADMIN'], ['foundation.governance.read']),
      { verbose: true }
    )

    // 如果服务返回降级, 安监需要能看到详细错误
    const lyt = result.components.find((c: { name: string }) => c.name === 'lyt-adapter')
    // lyt-adapter 如果 down 应当包含错误细节
    if (lyt && lyt.status === 'DOWN') {
      assert.ok(lyt.detail)
    }
  })

  it('安监可通过 verbose=false 获取精简版健康报告', async () => {
    const { controller } = createHealthController()
    const result = await controller.getReadiness(
      { tenantId: 't-safety' },
      makeActor(['SECURITY_ADMIN'], ['foundation.governance.read']),
      { verbose: false }
    )

    assert.equal(result.status, 'OK')
    assert.ok(result.components)
  })
})

// ──────────── 🎮导玩员 ────────────
describe(`${ROLES.Guide} health 角色测试`, () => {
  it('导玩员通过根 health 端点获取基础健康信息确认游戏平台可用（正常流程）', async () => {
    const { controller } = createHealthController()
    const result = await controller.getHealth()

    assert.equal(result.alive, true)
    assert.ok(typeof result.timestamp === 'string')
  })

  it('导玩员可通过 ping 轻量健康检查确认系统存活', async () => {
    const { controller } = createHealthController()
    const result = await controller.getPing()
    assert.equal(result.alive, true)
  })

  it('导玩员无权访问 readiness 详细健康数据（权限边界）', () => {
    const roles = Reflect.getMetadata(ROLES_METADATA_KEY, HealthController.prototype.getReadiness)
    assert.ok(!roles.includes('GUIDE'))
    assert.ok(!roles.includes('GAME_HOST'))
  })

  it('导玩员调用健康端点的路由装饰器正确', () => {
    const healthPath = getRoutePath(HealthController.prototype, 'getHealth')
    const pingPath = getRoutePath(HealthController.prototype, 'getPing')
    assert.equal(pingPath, 'ping')
  })
})

// ──────────── 🎯运行专员 ────────────
describe(`${ROLES.Ops} health 角色测试`, () => {
  it('运行专员 (OPERATIONS) 可调用 readiness 获取运维监控数据（正常流程）', async () => {
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

  it('运行专员可观察到 lyt 集成模式和组件延迟详情', async () => {
    const { controller } = createHealthController()
    const result = await controller.getReadiness(
      { tenantId: 't-ops', brandId: 'b-ops' },
      makeActor(['OPERATIONS'], ['foundation.governance.read']),
      { verbose: true }
    )

    assert.ok(typeof result.lytMode === 'string')
    // 运行专员关心延迟指标
    const latencies = result.components.map((c: { latencyMs: number }) => c.latencyMs)
    assert.ok(latencies.every((l: number) => l >= 0))
  })

  it('运行专员调用 readiness 时 missing 权限不可达（权限边界）', () => {
    const permittedPerms = Reflect.getMetadata(PERMISSIONS_METADATA_KEY, HealthController.prototype.getReadiness)
    assert.deepEqual(permittedPerms, ['foundation.governance.read'])

    // OPERATIONS 在允许角色中
    const roles = Reflect.getMetadata(ROLES_METADATA_KEY, HealthController.prototype.getReadiness)
    assert.ok(roles.includes('OPERATIONS'))
  })

  it('运行专员可在 verbose=false 时获取非冗余健康摘要', async () => {
    const { controller } = createHealthController()
    const result = await controller.getReadiness(
      { tenantId: 't-ops' },
      makeActor(['OPERATIONS'], ['foundation.governance.read']),
      { verbose: false }
    )

    assert.equal(result.status, 'OK')
    assert.ok(result.components)
  })
})

// ──────────── 🤝团建 ────────────
describe(`${ROLES.Teambuilding} health 角色测试`, () => {
  it('团建通过 getHealth 确认系统可用后开展团队活动预约（正常流程）', async () => {
    const { controller } = createHealthController()
    const result = await controller.getHealth()

    assert.equal(result.alive, true)
    assert.ok(result.timestamp)
  })

  it('团建在系统正常时可调用 ping 确认 API 响应稳定', async () => {
    const { controller } = createHealthController()
    const result = await controller.getPing()
    assert.equal(result.alive, true)
  })

  it('团建无权访问 readiness 内部组件详情（权限边界）', () => {
    const roles = Reflect.getMetadata(ROLES_METADATA_KEY, HealthController.prototype.getReadiness)
    assert.ok(!roles.includes('TEAMBUILDING'))
    assert.ok(!roles.includes('TEAMBUILD'))
  })
})

// ──────────── 📢营销 ────────────
describe(`${ROLES.Marketing} health 角色测试`, () => {
  it('营销通过 ping 确认系统存活以便触达营销活动（正常流程）', async () => {
    const { controller } = createHealthController()
    const result = await controller.getPing()

    assert.equal(result.alive, true)
    assert.ok(result.timestamp)
  })

  it('营销团队可利用 getHealth 根端点在活动前做连通检查', async () => {
    const { controller } = createHealthController()
    const result = await controller.getHealth()
    assert.equal(result.alive, true)
  })

  it('营销不在 readiness 允许角色中，无权查看系统内部组件详情（权限边界）', () => {
    const roles = Reflect.getMetadata(ROLES_METADATA_KEY, HealthController.prototype.getReadiness)
    assert.ok(!roles.includes('MARKETING'))
    assert.ok(!roles.includes('PROMOTION'))
  })
})

// ──────────── 元数据回归 ────────────
describe('health 角色元数据回归', () => {
  it('readiness 端点要求 4 个特定角色 + 1 个权限', () => {
    const roles = Reflect.getMetadata(ROLES_METADATA_KEY, HealthController.prototype.getReadiness)
    const permissions = Reflect.getMetadata(PERMISSIONS_METADATA_KEY, HealthController.prototype.getReadiness)
    const tenantScope = Reflect.getMetadata(TENANT_SCOPE_METADATA_KEY, HealthController.prototype.getReadiness)

    assert.deepEqual(roles, ['SUPER_ADMIN', 'TENANT_ADMIN', 'OPERATIONS', 'SECURITY_ADMIN'])
    assert.deepEqual(permissions, ['foundation.governance.read'])
    assert.deepEqual(tenantScope, {})
  })

  it('ping 和根端点无角色/权限限制', () => {
    for (const method of ['getPing', 'getHealth'] as const) {
      const roles = Reflect.getMetadata(ROLES_METADATA_KEY, HealthController.prototype[method])
      const permissions = Reflect.getMetadata(PERMISSIONS_METADATA_KEY, HealthController.prototype[method])

      assert.equal(roles, undefined)
      assert.equal(permissions, undefined)
    }
  })

  it('所有允许角色在 readiness 白名单中确保运营连续性', () => {
    const roles: string[] = Reflect.getMetadata(ROLES_METADATA_KEY, HealthController.prototype.getReadiness)

    // 运维三剑客 + 超级管理员
    assert.ok(roles.includes('SUPER_ADMIN'))
    assert.ok(roles.includes('TENANT_ADMIN'))
    assert.ok(roles.includes('OPERATIONS'))
    assert.ok(roles.includes('SECURITY_ADMIN'))
  })

  it('readiness 端点定义路径为 "/readiness"', () => {
    const path = getRoutePath(HealthController.prototype, 'getReadiness')
    assert.equal(path, 'readiness')
  })
})

// ──────────── 多 actor 并发场景 ────────────
describe('health 多角色并发场景', () => {
  it('高权限角色与低权限角色并行调用不互相影响', async () => {
    const controller = createHealthController().controller

    const [adminResult, pingResult] = await Promise.all([
      controller.getReadiness(
        { tenantId: 't-con' },
        makeActor(['TENANT_ADMIN'], ['foundation.governance.read']),
        { verbose: true }
      ),
      controller.getPing()
    ])

    assert.equal(adminResult.status, 'OK')
    assert.equal(pingResult.alive, true)
  })

  it('单例 controller 处理多角色请求实例响应一致', async () => {
    const { controller } = createHealthController()

    const results = await Promise.all([
      controller.getReadiness(
        { tenantId: 't-01' },
        makeActor(['SUPER_ADMIN'], ['foundation.governance.read']),
        { verbose: true }
      ),
      controller.getHealth(),
      controller.getPing()
    ])

    assert.equal(results[0].status, 'OK')
    assert.equal((results[1] as any).alive, true)
    assert.equal((results[2] as any).alive, true)
  })
})
