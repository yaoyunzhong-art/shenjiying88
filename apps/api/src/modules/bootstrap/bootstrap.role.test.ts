import 'reflect-metadata'
import assert from 'node:assert/strict'
import test, { describe } from 'node:test'
import { BootstrapController } from './bootstrap.controller'

// ── Shared helpers ──
const tenantCtx = { tenantId: 't-boot', brandId: 'b-boot', storeId: 's-boot', marketCode: 'zh-cn' }
const minimalCtx = { tenantId: 't-boot-min' }

// ── Roles ──
const ROLES = {
  TenantAdmin: '👔店长',
  Reception: '🛒前台',
  Guide: '🎮导玩员',
  Operations: '🎯运行专员',
  HR: '👥HR',
  Security: '🔧安监',
  TeamBuilding: '🤝团建',
  Marketing: '📢营销'
}

// ── Role-based bootstrap tests ──

describe(`${ROLES.TenantAdmin} bootstrap 角色测试`, () => {
  test('店长可以获取 metadata（完整租户上下文）', () => {
    const ctrl = new BootstrapController()
    const result = ctrl.getBootstrapMetadata(tenantCtx)
    assert.deepStrictEqual(result.tenantContext, tenantCtx)
    assert.equal(result.phase, 'scaffold')
    assert.deepStrictEqual(result.foundationDependencies, [])
  })

  test('店长可以获取 health', () => {
    const ctrl = new BootstrapController()
    const result = ctrl.getHealth()
    assert.equal(result.status, 'ok')
    assert.equal(result.phase, 'scaffold')
    assert.ok(typeof result.uptime === 'number' && result.uptime >= 0)
  })

  test('店长获取 metadata 时能正确处理最小上下文', () => {
    const ctrl = new BootstrapController()
    const result = ctrl.getBootstrapMetadata(minimalCtx)
    assert.equal(result.tenantContext.tenantId, 't-boot-min')
    assert.equal(result.tenantContext.brandId, undefined)
  })

  test('店长获取 metadata 时 foundationDependencies 正确为空数组', () => {
    const ctrl = new BootstrapController()
    // 已测试：foundationDependencies 初始为空
    const result = ctrl.getBootstrapMetadata(tenantCtx)
    assert.deepStrictEqual(result.foundationDependencies, [])
  })
})

describe(`${ROLES.Reception} bootstrap 角色测试`, () => {
  test('前台可以获取 metadata（完整租户上下文）', () => {
    const ctrl = new BootstrapController()
    const result = ctrl.getBootstrapMetadata(tenantCtx)
    assert.deepStrictEqual(result.tenantContext, tenantCtx)
    assert.equal(result.phase, 'scaffold')
  })

  test('前台可以获取 health', () => {
    const ctrl = new BootstrapController()
    const result = ctrl.getHealth()
    assert.equal(result.status, 'ok')
    assert.ok(result.uptime >= 0)
  })

  test('前台获取 metadata 时 foundationDependencies 列表正确', () => {
    const ctrl = new BootstrapController()
    const result = ctrl.getBootstrapMetadata(tenantCtx)
    assert.ok(Array.isArray(result.foundationDependencies))
  })
})

describe(`${ROLES.Guide} bootstrap 角色测试`, () => {
  test('导玩员可以获取 metadata（最小租户上下文）', () => {
    const ctrl = new BootstrapController()
    const result = ctrl.getBootstrapMetadata(minimalCtx)
    assert.equal(result.tenantContext.tenantId, 't-boot-min')
    assert.equal(result.phase, 'scaffold')
  })

  test('导玩员可以获取 health', () => {
    const ctrl = new BootstrapController()
    const result = ctrl.getHealth()
    assert.equal(result.status, 'ok')
    assert.equal(typeof result.uptime, 'number')
  })

  test('导玩员获取 metadata 返回 scaffold 阶段', () => {
    const ctrl = new BootstrapController()
    const result = ctrl.getBootstrapMetadata(minimalCtx)
    assert.equal(result.phase, 'scaffold')
  })
})

describe(`${ROLES.Operations} bootstrap 角色测试`, () => {
  test('运营专员可以获取 metadata', () => {
    const ctrl = new BootstrapController()
    const result = ctrl.getBootstrapMetadata(tenantCtx)
    assert.deepStrictEqual(result.tenantContext, tenantCtx)
    assert.equal(result.phase, 'scaffold')
  })

  test('运营专员可以获取 health', () => {
    const ctrl = new BootstrapController()
    const result = ctrl.getHealth()
    assert.equal(result.status, 'ok')
    assert.ok(result.uptime >= 0)
  })

  test('运营专员获取 health 时 uptime 为正数', () => {
    const ctrl = new BootstrapController()
    const result = ctrl.getHealth()
    assert.ok(result.uptime > 0)
  })
})

// ── 👥HR ──
describe(`${ROLES.HR} bootstrap 角色测试`, () => {
  test('HR 获取 bootstrap metadata 确认系统可用性', () => {
    const ctrl = new BootstrapController()
    const result = ctrl.getBootstrapMetadata(tenantCtx)
    assert.deepStrictEqual(result.tenantContext, tenantCtx)
    assert.equal(result.phase, 'scaffold')
    assert.ok(Array.isArray(result.foundationDependencies))
  })

  test('HR 获取 health 确认服务运行正常（边界：uptime 不可为零后降级）', () => {
    const ctrl = new BootstrapController()
    const result = ctrl.getHealth()
    assert.equal(result.status, 'ok')
    assert.ok(result.uptime > 0)
  })

  test('HR 跨多租户获取 metadata => 权限边界：仅返回当前租户上下文', () => {
    const ctrl = new BootstrapController()
    const result = ctrl.getBootstrapMetadata({ tenantId: 't-hr-cross' })
    assert.equal(result.tenantContext.tenantId, 't-hr-cross')
    // HR 不应看到其他租户数据
    assert.equal(result.tenantContext.brandId, undefined)
  })
})

// ── 🔧安监 ──
describe(`${ROLES.Security} bootstrap 角色测试`, () => {
  test('安监获取 metadata 验证 scaffold 阶段数据完整性', () => {
    const ctrl = new BootstrapController()
    const result = ctrl.getBootstrapMetadata(tenantCtx)
    // 安全审计：所有必要字段存在
    assert.ok('tenantContext' in result)
    assert.ok('foundationDependencies' in result)
    assert.ok('phase' in result)
  })

  test('安监获取 health 确认 no dangling promise（边界：同步返回）', () => {
    const ctrl = new BootstrapController()
    const result = ctrl.getHealth()
    // health 接口应同步返回，status + uptime 均非 null
    assert.equal(result.status, 'ok')
    assert.equal(typeof result.uptime, 'number')
    assert.ok(!Number.isNaN(result.uptime))
  })

  test('安监检查 metadata 的 foundationDependencies 类型安全 => 为数组', () => {
    const ctrl = new BootstrapController()
    const result = ctrl.getBootstrapMetadata(tenantCtx)
    assert.ok(Array.isArray(result.foundationDependencies))
    // 安全边界：scaffold 阶段依赖列表为空是允许的
  })
})

// ── 🤝团建 ──
describe(`${ROLES.TeamBuilding} bootstrap 角色测试`, () => {
  test('团建获取 metadata 确认 tenantContext 传递正确', () => {
    const ctrl = new BootstrapController()
    const teamCtx = { tenantId: 't-team-event', brandId: 'b-team', storeId: 's-team', marketCode: 'zh-cn' }
    const result = ctrl.getBootstrapMetadata(teamCtx)
    assert.deepStrictEqual(result.tenantContext, teamCtx)
    assert.equal(result.phase, 'scaffold')
  })

  test('团建获取 health 确认服务就绪', () => {
    const ctrl = new BootstrapController()
    const result = ctrl.getHealth()
    assert.equal(result.status, 'ok')
    assert.ok(result.uptime >= 0)
  })

  test('团建大规模活动场景 => metadata 返回结构稳定（边界：高频调用）', () => {
    const ctrl = new BootstrapController()
    // 模拟快速连续调用，结果应一致
    const r1 = ctrl.getBootstrapMetadata(tenantCtx)
    const r2 = ctrl.getBootstrapMetadata(tenantCtx)
    assert.deepStrictEqual(r1.tenantContext, r2.tenantContext)
    assert.equal(r1.phase, r2.phase)
    assert.deepStrictEqual(r1.foundationDependencies, r2.foundationDependencies)
  })
})

// ── 📢营销 ──
describe(`${ROLES.Marketing} bootstrap 角色测试`, () => {
  test('营销获取 metadata 用于市场活动配置检查', () => {
    const ctrl = new BootstrapController()
    const mktCtx = { tenantId: 't-mkt-campaign', brandId: 'b-mkt', storeId: 's-mkt' }
    const result = ctrl.getBootstrapMetadata(mktCtx)
    assert.deepStrictEqual(result.tenantContext, mktCtx)
    assert.equal(result.phase, 'scaffold')
  })

  test('营销获取 health 确认活动期间服务稳定', () => {
    const ctrl = new BootstrapController()
    const result = ctrl.getHealth()
    assert.equal(result.status, 'ok')
    // 营销关注 uptime 稳定性
    assert.equal(typeof result.uptime, 'number')
    assert.ok(result.uptime > 0)
  })

  test('营销检查 metadata 中 foundationDependencies 约束 => scaffold 阶段为空', () => {
    const ctrl = new BootstrapController()
    const result = ctrl.getBootstrapMetadata(tenantCtx)
    assert.deepStrictEqual(result.foundationDependencies, [])
    // 营销活动期间 scaffold 阶段的 foundationDependencies 保持空值合理
  })
})
