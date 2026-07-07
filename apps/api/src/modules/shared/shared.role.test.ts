import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * 🐜 自动: [shared] [C] 角色测试
 *
 * 8 角色视角的 shared 模块测试：
 * 👔店长 🛒前台 👥HR 🔧安监 🎮导玩员 🎯运行专员 🤝团建 📢营销
 *
 * 每个角色至少 2 个测试用例（正常流程 + 权限边界）
 */

import assert from 'node:assert/strict'
import { SharedController } from './shared.controller'
import { AuditService } from './audit.service'
import type { AuditAction } from './shared.entity'

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

// ── 测试工厂 ──
function createContext() {
  const auditService = new AuditService()
  const controller = new SharedController(auditService)
  return { auditService, controller }
}

// ── 👔店长（StoreManager）视角 ──
// 店长关注系统整体健康状态、各门店审计日志总览、版本信息
describe(`${ROLES.StoreManager} shared 角色测试`, () => {
  it('店长查看共享模块健康状态 === status=healthy', () => {
    const { controller } = createContext()
    const health = controller.getHealth()
    assert.equal(health.status, 'healthy')
    assert.equal(health.version, '1.0.0')
    assert.ok(health.uptimeMs >= 0, 'uptimeMs should be >= 0')
    assert.equal(typeof health.uptimeMs, 'number')
    assert.equal(typeof health.auditLogCount, 'number')
  })

  it('店长在多门店审计后查看健康状态反映最新日志数', async () => {
    const { auditService, controller } = createContext()
    // 模拟多家门店的审计操作
    await auditService.logCrossTenantAttempt({
      actor: 'store-a',
      tenantId: 'store-001',
      resource: 'cfg:pos-1',
      metadata: { store_name: '旗舰店' },
    })
    await auditService.logCrossTenantAttempt({
      actor: 'store-b',
      tenantId: 'store-002',
      resource: 'cfg:pos-2',
      metadata: { store_name: '连锁店' },
    })
    await auditService.logCrossTenantAttempt({
      actor: 'store-c',
      tenantId: 'store-003',
      resource: 'cfg:pos-3',
      metadata: { store_name: '加盟店' },
    })

    const health = controller.getHealth()
    assert.equal(health.auditLogCount, 3)
  })

  it('店长获取版本信息确认服务已启动', () => {
    const { controller } = createContext()
    const ver = controller.getVersion()
    assert.equal(ver.version, '1.0.0')
    assert.ok(new Date(ver.startedAt).getTime() > 0, 'startedAt must be a valid date')
  })

  it('店长按门店 ID 查询审计日志——正常流程', async () => {
    const { auditService, controller } = createContext()
    await auditService.logCrossTenantAttempt({
      actor: 'manager-zhang',
      tenantId: 'store-001',
      resource: 'config:register-1',
      metadata: { change: 'price_update' },
    })
    const result = await controller.getAuditLog({
      tenantId: 'store-001',
      limit: 10,
      action: undefined,
      since: undefined,
    })
    assert.equal(result.total, 1)
    assert.equal(result.entries[0].actor, 'manager-zhang')
  })
})

// ── 🛒前台（FrontDesk）视角 ──
// 前台关注收银相关的审计日志记录、租户校验是否影响正常收银
describe(`${ROLES.FrontDesk} shared 角色测试`, () => {
  it('前台收银操作触发审计日志写入', async () => {
    const { auditService, controller } = createContext()
    await auditService.logCrossTenantAttempt({
      actor: 'cashier-li',
      tenantId: 'store-001',
      resource: 'transaction:order-12345',
      action: 'cross_tenant_access_attempt',
    })

    const result = await controller.getAuditLog({
      tenantId: 'store-001',
      limit: 10,
      action: undefined,
      since: undefined,
    })
    assert.equal(result.total, 1)
    assert.equal(result.entries[0].actor, 'cashier-li')
  })

  it('前台收费操作传入有效的 tenantId 通过校验', () => {
    const { controller } = createContext()
    const result = controller.validateTenant({ tenantId: 'store-001' })
    assert.equal(result.valid, true)
    assert.equal(result.tenantId, 'store-001')
  })

  it('前台误传空 tenantId 应返回 invalid', () => {
    const { controller } = createContext()
    const result = controller.validateTenant({ tenantId: '' })
    assert.equal(result.valid, false)
    assert.ok(result.error)
  })

  it('前台刷卡频繁——批量审计日志按 limit 截断', async () => {
    const { auditService, controller } = createContext()
    for (let i = 0; i < 20; i++) {
      await auditService.logCrossTenantAttempt({
        actor: `cashier-${i}`,
        tenantId: 'store-001',
        resource: `transaction:order-${i}`,
      })
    }
    const result = await controller.getAuditLog({
      tenantId: 'store-001',
      limit: 5,
      action: undefined,
      since: undefined,
    })
    assert.equal(result.entries.length, 5)
    assert.equal(result.total, 20)
  })
})

// ── 👥HR（HR）视角 ──
// HR 关心员工跨租户访问记录、人员操作审计、PII 相关审计
describe(`${ROLES.HR} shared 角色测试`, () => {
  it('HR 查询某门店员工跨租户访问记录', async () => {
    const { auditService, controller } = createContext()
    await auditService.logCrossTenantAttempt({
      actor: 'hr-wang',
      tenantId: 'hr-tenant',
      resource: 'employee-records:user-42',
      action: 'cross_tenant_access_attempt',
      metadata: { targetTenant: 'store-001', reason: 'employee_transfer' },
    })
    const result = await controller.getAuditLog({
      tenantId: 'hr-tenant',
      limit: 10,
      action: undefined,
      since: undefined,
    })
    assert.equal(result.total, 1)
    assert.equal(result.entries[0].metadata?.reason, 'employee_transfer')
  })

  it('HR 查询员工权限变更审计日志——支持 action 过滤', async () => {
    const { auditService, controller } = createContext()
    await auditService.logCrossTenantAttempt({
      actor: 'admin',
      tenantId: 'hr-tenant',
      resource: 'role:guide',
      action: 'rls_policy_violation',
    })
    await auditService.logCrossTenantAttempt({
      actor: 'admin',
      tenantId: 'hr-tenant',
      resource: 'config:hr-settings',
      action: 'config_write',
    })
    const result = await controller.getAuditLog({
      tenantId: 'hr-tenant',
      limit: 10,
      action: 'rls_policy_violation',
      since: undefined,
    })
    assert.equal(result.entries.length, 1)
    assert.equal(result.entries[0].action, 'rls_policy_violation')
  })

  it('HR 查询不存在的租户审计记录——边界空结果', async () => {
    const { controller } = createContext()
    const result = await controller.getAuditLog({
      tenantId: 'hr-nonexistent',
      limit: 10,
      action: undefined,
      since: undefined,
    })
    assert.equal(result.total, 0)
    assert.deepEqual(result.entries, [])
  })
})

// ── 🔧安监（Security）视角 ──
// 安监负责安全审计、租户隔离验证、RLS 策略违规监控
describe(`${ROLES.Security} shared 角色测试`, () => {
  it('安监检测 RLS 策略违反——写入审计日志', async () => {
    const { auditService, controller } = createContext()
    await auditService.logCrossTenantAttempt({
      actor: 'suspicious-user',
      tenantId: 'store-001',
      resource: 'rls:policy-config',
      action: 'rls_policy_violation',
      metadata: { attemptedTenant: 'store-002', blocked: true },
    })
    const result = await controller.getAuditLog({
      tenantId: 'store-001',
      limit: 10,
      action: 'rls_policy_violation',
      since: undefined,
    })
    assert.equal(result.entries.length, 1)
    assert.equal(result.entries[0].metadata?.blocked, true)
  })

  it('安监白名单——无效的 tenantId 被正确拦截', () => {
    const { controller } = createContext()
    const result1 = controller.validateTenant({ tenantId: '' })
    assert.equal(result1.valid, false)
    const result2 = controller.validateTenant({ tenantId: '   ' })
    assert.equal(result2.valid, false)
    const result3 = controller.validateTenant({ tenantId: '合法-tenant' })
    assert.equal(result3.valid, true)
  })

  it('安监按 ID 查询可疑审计条目', async () => {
    const { auditService, controller } = createContext()
    await auditService.logCrossTenantAttempt({
      actor: 'hacker-007',
      tenantId: 'store-001',
      resource: 'agent:super-admin',
      action: 'cross_tenant_access_attempt',
    })
    const result = await controller.getAuditEntry('1')
    assert.equal(result.found, true)
    assert.equal(result.entry?.actor, 'hacker-007')
  })

  it('安监查询不存在审计条目——返回 not found', async () => {
    const { controller } = createContext()
    const result = await controller.getAuditEntry('99999')
    assert.equal(result.found, false)
    assert.ok(result.message?.includes('not found'))
  })

  it('安监查看全部审计日志——确认无遗漏', async () => {
    const { auditService, controller } = createContext()
    await auditService.logCrossTenantAttempt({
      actor: 'user-a',
      tenantId: 'store-001',
      resource: 'cfg:x',
      action: 'rls_policy_violation',
    })
    await auditService.logCrossTenantAttempt({
      actor: 'user-b',
      tenantId: 'store-002',
      resource: 'cfg:y',
      action: 'missing_tenant_id',
    })
    const result = await controller.getAllAuditLog()
    assert.equal(result.total, 2)
    assert.equal(result.entries.length, 2)
  })
})

// ── 🎮导玩员（Guide）视角 ──
// 导玩员关注游戏会话相关的审计日志、角色配置访问审计
describe(`${ROLES.Guide} shared 角色测试`, () => {
  it('导玩员查询本门店游戏会话审计日志', async () => {
    const { auditService, controller } = createContext()
    await auditService.logCrossTenantAttempt({
      actor: 'guide-zhao',
      tenantId: 'store-arcade',
      resource: 'session:game-42',
      action: 'session_read',
      metadata: { game: '投篮机', duration: 15 },
    })
    const result = await controller.getAuditLog({
      tenantId: 'store-arcade',
      limit: 10,
      action: 'session_read',
      since: undefined,
    })
    assert.equal(result.entries.length, 1)
    assert.equal(result.entries[0].metadata?.game, '投篮机')
  })

  it('导玩员误访问其他门店会话——触发跨租户审计', async () => {
    const { auditService, controller } = createContext()
    await auditService.logCrossTenantAttempt({
      actor: 'guide-zhao',
      tenantId: 'store-arcade',
      resource: 'session:game-99',
      action: 'cross_tenant_access_attempt',
      metadata: { actualTenant: 'store-bowling', reason: 'unauthorized_read' },
    })
    const result = await controller.getAuditLog({
      tenantId: 'store-arcade',
      limit: 10,
      action: undefined,
      since: undefined,
    })
    assert.equal(result.total, 1)
    assert.equal(result.entries[0].actor, 'guide-zhao')
  })
})

// ── 🎯运行专员（Operations）视角 ──
// 运行专员监控系统运维审计、全量日志查询、健康状态持续检查
describe(`${ROLES.Operations} shared 角色测试`, () => {
  it('运行专员查询全量审计日志确认系统运行正常', async () => {
    const { auditService, controller } = createContext()
    const actions: AuditAction[] = [
      'cross_tenant_access_attempt',
      'missing_tenant_id',
      'invalid_tenant',
      'rls_policy_violation',
      'config_read',
      'config_write',
    ]
    for (let i = 0; i < actions.length; i++) {
      await auditService.logCrossTenantAttempt({
        actor: `system-${i}`,
        tenantId: 'ops-tenant',
        resource: `audit:${actions[i]}`,
        action: actions[i],
      })
    }
    const result = await controller.getAllAuditLog()
    assert.equal(result.total, 6)
    assert.equal(result.entries[0].actor, 'system-0')
    assert.equal(result.entries[5].actor, 'system-5')
  })

  it('运行专员通过健康状态确认审计日志增长趋势', async () => {
    const { auditService, controller } = createContext()
    // 初始状态
    const health1 = controller.getHealth()
    const initialCount = health1.auditLogCount

    for (let i = 0; i < 10; i++) {
      await auditService.logCrossTenantAttempt({
        actor: 'ops-bot',
        tenantId: 'ops-tenant',
        resource: `health-check:${i}`,
      })
    }
    const health2 = controller.getHealth()
    assert.equal(health2.auditLogCount, initialCount + 10)
    assert.equal(health2.status, 'healthy')
  })

  it('运行专员按时间范围过滤审计日志', async () => {
    const { auditService, controller } = createContext()
    await auditService.logCrossTenantAttempt({
      actor: 'deploy-bot',
      tenantId: 'ops-tenant',
      resource: 'deploy:v2.1.0',
    })
    const pastDate = new Date('2024-01-01').toISOString()
    const result = await controller.getAuditLog({
      tenantId: 'ops-tenant',
      since: pastDate,
      limit: 10,
      action: undefined,
    })
    assert.equal(result.total, 1)
  })
})

// ── 🤝团建（Teambuilding）视角 ──
// 团建负责人关注跨团队/跨门店访问记录、共享资源审计
describe(`${ROLES.Teambuilding} shared 角色测试`, () => {
  it('团建负责人申请跨门店访问资源——写入审计', async () => {
    const { auditService, controller } = createContext()
    await auditService.logCrossTenantAttempt({
      actor: 'team-builder-chen',
      tenantId: 'store-main',
      resource: 'equipment:VR-booth',
      action: 'cross_tenant_access_attempt',
      metadata: { targetStore: 'store-branch', purpose: 'teambuilding_activity' },
    })
    const result = await controller.getAuditLog({
      tenantId: 'store-main',
      limit: 10,
      action: undefined,
      since: undefined,
    })
    assert.equal(result.total, 1)
    assert.equal(result.entries[0].metadata?.purpose, 'teambuilding_activity')
  })

  it('团建负责人查看多家门店共享资源的审计历史', async () => {
    const { auditService, controller } = createContext()
    await auditService.logCrossTenantAttempt({
      actor: 'coordinator',
      tenantId: 'store-main',
      resource: 'resource:party-room',
      action: 'config_read',
    })
    await auditService.logCrossTenantAttempt({
      actor: 'coordinator',
      tenantId: 'store-branch',
      resource: 'resource:party-room',
      action: 'config_read',
    })
    const result1 = await controller.getAuditLog({
      tenantId: 'store-main',
      limit: 10,
      action: undefined,
      since: undefined,
    })
    assert.equal(result1.total, 1)
    const result2 = await controller.getAuditLog({
      tenantId: 'store-branch',
      limit: 10,
      action: undefined,
      since: undefined,
    })
    assert.equal(result2.total, 1)
  })
})

// ── 📢营销（Marketing）视角 ──
// 营销人员关注活动配置审计、营销策略变更记录、跨门店活动推广访问
describe(`${ROLES.Marketing} shared 角色测试`, () => {
  it('营销查看活动配置变更审计日志', async () => {
    const { auditService, controller } = createContext()
    await auditService.logCrossTenantAttempt({
      actor: 'marketer-liu',
      tenantId: 'mkt-tenant',
      resource: 'campaign:summer-sale',
      action: 'config_write',
      metadata: { change: 'discount_30_to_50_percent', approved_by: 'manager' },
    })
    const result = await controller.getAuditLog({
      tenantId: 'mkt-tenant',
      limit: 10,
      action: 'config_write',
      since: undefined,
    })
    assert.equal(result.entries.length, 1)
    assert.equal(result.entries[0].metadata?.change, 'discount_30_to_50_percent')
  })

  it('营销推广活动——多门店配置同步触发审计', async () => {
    const { auditService, controller } = createContext()
    const stores = ['store-east', 'store-west', 'store-south']
    for (const store of stores) {
      await auditService.logCrossTenantAttempt({
        actor: 'campaign-bot',
        tenantId: store,
        resource: 'campaign:double-11',
        action: 'config_write',
        metadata: { campaign: '双十一大促', discount: '20%' },
      })
    }
    for (const store of stores) {
      const result = await controller.getAuditLog({
        tenantId: store,
        limit: 10,
        action: undefined,
        since: undefined,
      })
      assert.equal(result.total, 1)
      assert.equal(result.entries[0].metadata?.campaign, '双十一大促')
    }
  })

  it('营销校验租户 ID——确保活动配置写入正确门店', () => {
    const { controller } = createContext()
    const valid = controller.validateTenant({ tenantId: 'mkt-campaign-east' })
    assert.equal(valid.valid, true)
    const invalid = controller.validateTenant({ tenantId: '' })
    assert.equal(invalid.valid, false)
  })

  it('营销查询活动审计但门店不存在——边界空结果', async () => {
    const { controller } = createContext()
    const result = await controller.getAuditLog({
      tenantId: 'mkt-nonexistent-store',
      limit: 10,
      action: undefined,
      since: undefined,
    })
    assert.equal(result.total, 0)
    assert.deepEqual(result.entries, [])
  })
})
