import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * 🐜 自动: [shared] [D-controller spec 补全]
 *
 * SharedController 综合测试:
 * - 路由元数据验证（路径/HTTP方法）
 * - 全路由覆盖: health / audit / audit/all / audit/:id / validate-tenant / version
 * - 8 角色视角场景: 👔店长 🛒前台 👥HR 🔧安监 🎮导玩员 🎯运行专员 🤝团建 📢营销
 * - 正例 / 反例 / 边界条件
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import { SharedController } from './shared.controller'
import { AuditService } from './audit.service'
import type { AuditAction } from './audit.service'

// ── 角色定义 ──
const R = {
  StoreManager: '👔店长',
  FrontDesk: '🛒前台',
  HR: '👥HR',
  Security: '🔧安监',
  Guide: '🎮导玩员',
  Operations: '🎯运行专员',
  Teambuilding: '🤝团建',
  Marketing: '📢营销',
} as const

// ── 测试夹具 ──
function createCtx() {
  const auditService = new AuditService()
  const controller = new SharedController(auditService)
  return { auditService, controller }
}

// ── 辅助: 快速写入审计日志 ──
async function seedAudit(
  svc: AuditService,
  entries: Array<{ actor: string; tenantId: string; resource: string; action?: AuditAction; metadata?: Record<string, unknown> }>,
) {
  for (const e of entries) {
    await svc.logCrossTenantAttempt(e)
  }
}

// ===================================================================
// 1. 路由元数据验证
// ===================================================================
describe('SharedController — 路由元数据', () => {
  it('Controller path metadata = "shared"', () => {
    const path = Reflect.getMetadata('path', SharedController)
    assert.equal(path, 'shared')
  })

  it('GET /shared/health — method GET, path "health"', () => {
    const method = Reflect.getMetadata('method', SharedController.prototype.getHealth)
    const path = Reflect.getMetadata('path', SharedController.prototype.getHealth)
    assert.equal(method, 0, 'should be GET')
    assert.equal(path, 'health')
  })

  it('GET /shared/audit — method GET, path "audit"', () => {
    const method = Reflect.getMetadata('method', SharedController.prototype.getAuditLog)
    const path = Reflect.getMetadata('path', SharedController.prototype.getAuditLog)
    assert.equal(method, 0)
    assert.equal(path, 'audit')
  })

  it('GET /shared/audit/all — method GET, path "audit/all"', () => {
    const method = Reflect.getMetadata('method', SharedController.prototype.getAllAuditLog)
    const path = Reflect.getMetadata('path', SharedController.prototype.getAllAuditLog)
    assert.equal(method, 0)
    assert.equal(path, 'audit/all')
  })

  it('GET /shared/audit/:id — method GET, path "audit/:id"', () => {
    const method = Reflect.getMetadata('method', SharedController.prototype.getAuditEntry)
    const path = Reflect.getMetadata('path', SharedController.prototype.getAuditEntry)
    assert.equal(method, 0)
    assert.equal(path, 'audit/:id')
  })

  it('POST /shared/validate-tenant — method POST, path "validate-tenant"', () => {
    const method = Reflect.getMetadata('method', SharedController.prototype.validateTenant)
    const path = Reflect.getMetadata('path', SharedController.prototype.validateTenant)
    assert.equal(method, 1, 'should be POST')
    assert.equal(path, 'validate-tenant')
  })

  it('GET /shared/version — method GET, path "version"', () => {
    const method = Reflect.getMetadata('method', SharedController.prototype.getVersion)
    const path = Reflect.getMetadata('path', SharedController.prototype.getVersion)
    assert.equal(method, 0)
    assert.equal(path, 'version')
  })

  it('所有路由都有 HttpCode 装饰器（默认 200）', () => {
    const httpCodes = [
      Reflect.getMetadata('__httpCode__', SharedController.prototype.getHealth),
      Reflect.getMetadata('__httpCode__', SharedController.prototype.validateTenant),
    ]
    assert.equal(httpCodes[0], 200)
    assert.equal(httpCodes[1], 200)
  })
})

// ===================================================================
// 2. GET /shared/health — 健康检查
// ===================================================================
describe('GET /shared/health', () => {
  it('正例: 返回健康状态含所有字段', () => {
    const { controller } = createCtx()
    const h = controller.getHealth()
    assert.equal(h.status, 'healthy')
    assert.equal(h.version, '1.0.0')
    assert.equal(typeof h.uptimeMs, 'number')
    assert.equal(typeof h.auditLogCount, 'number')
    assert.ok(h.uptimeMs >= 0)
  })

  it('正例: auditLogCount 随日志增长而增加', async () => {
    const { auditService, controller } = createCtx()
    assert.equal(controller.getHealth().auditLogCount, 0)
    await auditService.logCrossTenantAttempt({ actor: 'u1', tenantId: 't1', resource: 'r1' })
    assert.equal(controller.getHealth().auditLogCount, 1)
    await auditService.logCrossTenantAttempt({ actor: 'u2', tenantId: 't2', resource: 'r2' })
    assert.equal(controller.getHealth().auditLogCount, 2)
  })

  it('正例: uptimeMs 随时间单调递增', async () => {
    const { controller } = createCtx()
    const t1 = controller.getHealth().uptimeMs
    await new Promise((r) => setTimeout(r, 5))
    const t2 = controller.getHealth().uptimeMs
    assert.ok(t2 >= t1, `uptime should increase: ${t2} >= ${t1}`)
  })

  it('👔店长视角: 多门店运营后查看健康总览', async () => {
    const { auditService, controller } = createCtx()
    await seedAudit(auditService, [
      { actor: 'manager-zhang', tenantId: 'store-001', resource: 'pos:register-1' },
      { actor: 'manager-li', tenantId: 'store-002', resource: 'pos:register-2' },
      { actor: 'manager-wang', tenantId: 'store-003', resource: 'pos:register-3' },
    ])
    const h = controller.getHealth()
    assert.equal(h.auditLogCount, 3)
    assert.equal(h.status, 'healthy')
  })
})

// ===================================================================
// 3. GET /shared/audit — 查询审计日志
// ===================================================================
describe('GET /shared/audit', () => {
  it('正例: 按 tenantId 查询返回匹配日志', async () => {
    const { auditService, controller } = createCtx()
    await seedAudit(auditService, [
      { actor: 'u1', tenantId: 't-001', resource: 'cfg:pos' },
      { actor: 'u2', tenantId: 't-001', resource: 'cfg:inventory' },
      { actor: 'u3', tenantId: 't-002', resource: 'cfg:hr' },
    ])
    const r = await controller.getAuditLog({ tenantId: 't-001', limit: 10, action: undefined, since: undefined })
    assert.equal(r.total, 2)
    assert.equal(r.entries.length, 2)
  })

  it('正例: 按 action 过滤', async () => {
    const { auditService, controller } = createCtx()
    await seedAudit(auditService, [
      { actor: 'u1', tenantId: 't-001', resource: 'r1', action: 'cross_tenant_access_attempt' },
      { actor: 'u2', tenantId: 't-001', resource: 'r2', action: 'rls_policy_violation' },
    ])
    const r = await controller.getAuditLog({ tenantId: 't-001', limit: 10, action: 'rls_policy_violation', since: undefined })
    assert.equal(r.entries.length, 1)
    assert.equal(r.entries[0].action, 'rls_policy_violation')
  })

  it('正例: limit 参数截断结果', async () => {
    const { auditService, controller } = createCtx()
    await seedAudit(auditService, Array.from({ length: 10 }, (_, i) => ({
      actor: `u${i}`, tenantId: 't-001', resource: `r${i}`,
    })))
    const r = await controller.getAuditLog({ tenantId: 't-001', limit: 3, action: undefined, since: undefined })
    assert.equal(r.entries.length, 3)
    assert.equal(r.total, 10)
  })

  it('反例: 不存在租户返回空数组', async () => {
    const { controller } = createCtx()
    const r = await controller.getAuditLog({ tenantId: 'non-existent', limit: 10, action: undefined, since: undefined })
    assert.equal(r.total, 0)
    assert.deepEqual(r.entries, [])
  })

  it('反例: 不匹配的 action 返回空', async () => {
    const { auditService, controller } = createCtx()
    await auditService.logCrossTenantAttempt({ actor: 'u1', tenantId: 't-001', resource: 'r1', action: 'config_read' })
    const r = await controller.getAuditLog({ tenantId: 't-001', limit: 10, action: 'invalid_action' as any, since: undefined })
    assert.equal(r.entries.length, 0)
  })

  it('边界: since 过滤最近日期', async () => {
    const { auditService, controller } = createCtx()
    await auditService.logCrossTenantAttempt({ actor: 'u1', tenantId: 't-001', resource: 'r1' })
    const past = new Date('2020-01-01').toISOString()
    const r = await controller.getAuditLog({ tenantId: 't-001', since: past, limit: 10, action: undefined })
    assert.equal(r.total, 1)
  })

  it('边界: since 未来时间返回空', async () => {
    const { auditService, controller } = createCtx()
    await auditService.logCrossTenantAttempt({ actor: 'u1', tenantId: 't-001', resource: 'r1' })
    const future = new Date('2099-01-01').toISOString()
    const r = await controller.getAuditLog({ tenantId: 't-001', since: future, limit: 10, action: undefined })
    assert.equal(r.total, 0)
  })

  it('🔧安监视角: 检测 RLS 违规日志并过滤', async () => {
    const { auditService, controller } = createCtx()
    await seedAudit(auditService, [
      { actor: 'user-a', tenantId: 'store-001', resource: 'rls:policy', action: 'rls_policy_violation' },
      { actor: 'user-b', tenantId: 'store-001', resource: 'cfg:normal', action: 'config_read' },
    ])
    const r = await controller.getAuditLog({ tenantId: 'store-001', limit: 10, action: 'rls_policy_violation', since: undefined })
    assert.equal(r.entries.length, 1)
    assert.equal(r.entries[0].action, 'rls_policy_violation')
  })

  it('🎮导玩员视角: 查询本门店游戏会话日志', async () => {
    const { auditService, controller } = createCtx()
    await seedAudit(auditService, [
      { actor: 'guide-zhao', tenantId: 'arcade-01', resource: 'session:game-42', action: 'session_read', metadata: { game: '投篮机' } },
    ])
    const r = await controller.getAuditLog({ tenantId: 'arcade-01', limit: 10, action: 'session_read', since: undefined })
    assert.equal(r.entries.length, 1)
    assert.equal(r.entries[0].metadata?.game, '投篮机')
  })
})

// ===================================================================
// 4. GET /shared/audit/all — 全部审计日志
// ===================================================================
describe('GET /shared/audit/all', () => {
  it('正例: 返回全部日志', async () => {
    const { auditService, controller } = createCtx()
    await seedAudit(auditService, [
      { actor: 'a', tenantId: 't1', resource: 'r1' },
      { actor: 'b', tenantId: 't2', resource: 'r2' },
      { actor: 'c', tenantId: 't1', resource: 'r3' },
    ])
    const r = await controller.getAllAuditLog()
    assert.equal(r.total, 3)
    assert.equal(r.entries.length, 3)
  })

  it('边界: 空日志列表返回 total=0', async () => {
    const { controller } = createCtx()
    const r = await controller.getAllAuditLog()
    assert.equal(r.total, 0)
    assert.deepEqual(r.entries, [])
  })

  it('🎯运行专员视角: 确认全部日志无遗漏', async () => {
    const { auditService, controller } = createCtx()
    const actions: AuditAction[] = ['cross_tenant_access_attempt', 'missing_tenant_id', 'config_write', 'evaluation_read']
    await seedAudit(auditService, actions.map((a, i) => ({
      actor: `system-${i}`, tenantId: 'ops', resource: `audit:${a}`, action: a,
    })))
    const r = await controller.getAllAuditLog()
    assert.equal(r.total, actions.length)
    assert.equal(r.entries[0].action, actions[0])
    assert.equal(r.entries[3].action, actions[3])
  })
})

// ===================================================================
// 5. GET /shared/audit/:id — 单条日志查询
// ===================================================================
describe('GET /shared/audit/:id', () => {
  it('正例: 按 ID 查找到已存在的条目', async () => {
    const { auditService, controller } = createCtx()
    await auditService.logCrossTenantAttempt({ actor: 'u1', tenantId: 't1', resource: 'r1' })
    const r = await controller.getAuditEntry('1')
    assert.equal(r.found, true)
    assert.equal(r.entry?.id, 1)
    assert.equal(r.entry?.actor, 'u1')
  })

  it('反例: ID 不存在返回 not found', async () => {
    const { controller } = createCtx()
    const r = await controller.getAuditEntry('9999')
    assert.equal(r.found, false)
    assert.ok(r.message?.includes('not found'))
  })

  it('边界: 负数 ID 返回 not found', async () => {
    const { auditService, controller } = createCtx()
    await auditService.logCrossTenantAttempt({ actor: 'u1', tenantId: 't1', resource: 'r1' })
    const r = await controller.getAuditEntry('-1')
    assert.equal(r.found, false)
  })

  it('边界: 空字符串 ID', async () => {
    const { controller } = createCtx()
    const r = await controller.getAuditEntry('')
    assert.equal(r.found, false)
  })

  it('边界: 超大 ID', async () => {
    const { controller } = createCtx()
    const r = await controller.getAuditEntry('999999999999')
    assert.equal(r.found, false)
  })

  it('🔧安监视角: 查询可疑审计条目', async () => {
    const { auditService, controller } = createCtx()
    await auditService.logCrossTenantAttempt({
      actor: 'suspicious-user', tenantId: 'store-sz', resource: 'agent:admin',
      action: 'rls_policy_violation', metadata: { blocked: true },
    })
    const r = await controller.getAuditEntry('1')
    assert.equal(r.found, true)
    assert.equal(r.entry?.actor, 'suspicious-user')
    assert.equal(r.entry?.metadata?.blocked, true)
  })
})

// ===================================================================
// 6. POST /shared/validate-tenant — 租户校验
// ===================================================================
describe('POST /shared/validate-tenant', () => {
  it('正例: 标准 tenantId 通过校验', () => {
    const { controller } = createCtx()
    const r = controller.validateTenant({ tenantId: 'tenant-abc-123' })
    assert.equal(r.valid, true)
    assert.equal(r.tenantId, 'tenant-abc-123')
  })

  it('正例: 单字符 tenantId 通过', () => {
    const { controller } = createCtx()
    const r = controller.validateTenant({ tenantId: 'a' })
    assert.equal(r.valid, true)
  })

  it('正例: 数字 tenantId 通过', () => {
    const { controller } = createCtx()
    const r = controller.validateTenant({ tenantId: '12345' })
    assert.equal(r.valid, true)
  })

  it('正例: 带连字符和下划线的 tenantId 通过', () => {
    const { controller } = createCtx()
    const r = controller.validateTenant({ tenantId: 'store_001-abc' })
    assert.equal(r.valid, true)
  })

  it('反例: 空字符串返回 invalid', () => {
    const { controller } = createCtx()
    const r = controller.validateTenant({ tenantId: '' })
    assert.equal(r.valid, false)
    assert.ok(r.error)
  })

  it('反例: 空白字符串返回 invalid', () => {
    const { controller } = createCtx()
    const r = controller.validateTenant({ tenantId: '   ' })
    assert.equal(r.valid, false)
  })

  it('🛒前台视角: 正常收银租户校验通过', () => {
    const { controller } = createCtx()
    const r = controller.validateTenant({ tenantId: 'store-pos-01' })
    assert.equal(r.valid, true)
  })

  it('🛒前台视角: 误传空值被拦截', () => {
    const { controller } = createCtx()
    const r = controller.validateTenant({ tenantId: '' })
    assert.equal(r.valid, false)
    assert.ok(r.error)
  })

  it('📢营销视角: 活动配置写入前校验门店租户', () => {
    const { controller } = createCtx()
    const valid = controller.validateTenant({ tenantId: 'mkt-campaign-east' })
    assert.equal(valid.valid, true)
    const invalid = controller.validateTenant({ tenantId: '' })
    assert.equal(invalid.valid, false)
  })
})

// ===================================================================
// 7. GET /shared/version — 版本信息
// ===================================================================
describe('GET /shared/version', () => {
  it('正例: 返回版本和启动时间', () => {
    const { controller } = createCtx()
    const r = controller.getVersion()
    assert.equal(r.version, '1.0.0')
    assert.equal(typeof r.startedAt, 'string')
    assert.ok(new Date(r.startedAt).getTime() > 0, 'startedAt should be valid date')
  })

  it('👔店长视角: 确认服务已启动', () => {
    const { controller } = createCtx()
    const r = controller.getVersion()
    assert.equal(r.version, '1.0.0')
    const ts = new Date(r.startedAt).getTime()
    assert.ok(Date.now() - ts < 10000, 'startedAt should be recent')
  })
})

// ===================================================================
// 8. 👥HR视角 — 综合场景
// ===================================================================
describe(`${R.HR} 综合场景`, () => {
  it('HR 查看员工跨租户访问记录 + action 过滤', async () => {
    const { auditService, controller } = createCtx()
    await seedAudit(auditService, [
      { actor: 'hr-wang', tenantId: 'hr-tenant', resource: 'employee:u42', action: 'cross_tenant_access_attempt', metadata: { reason: 'transfer' } },
      { actor: 'sys', tenantId: 'hr-tenant', resource: 'config:settings', action: 'config_write' },
    ])
    const r = await controller.getAuditLog({ tenantId: 'hr-tenant', limit: 10, action: 'cross_tenant_access_attempt', since: undefined })
    assert.equal(r.entries.length, 1)
    assert.equal(r.entries[0].metadata?.reason, 'transfer')
  })

  it('HR 查询不存在的租户——空结果', async () => {
    const { controller } = createCtx()
    const r = await controller.getAuditLog({ tenantId: 'hr-nonexistent', limit: 10, action: undefined, since: undefined })
    assert.equal(r.total, 0)
  })
})

// ===================================================================
// 9. 🤝团建视角 — 综合场景
// ===================================================================
describe(`${R.Teambuilding} 综合场景`, () => {
  it('团建负责人跨门店访问资源日志', async () => {
    const { auditService, controller } = createCtx()
    await seedAudit(auditService, [
      { actor: 'team-builder', tenantId: 'store-main', resource: 'equipment:VR', action: 'cross_tenant_access_attempt', metadata: { target: 'store-branch', purpose: 'activity' } },
    ])
    const r = await controller.getAuditLog({ tenantId: 'store-main', limit: 10, action: undefined, since: undefined })
    assert.equal(r.total, 1)
    assert.equal(r.entries[0].metadata?.purpose, 'activity')
  })

  it('团建查看多家门店共享资源审计', async () => {
    const { auditService, controller } = createCtx()
    await seedAudit(auditService, [
      { actor: 'coordinator', tenantId: 'store-main', resource: 'resource:party-room', action: 'config_read' },
      { actor: 'coordinator', tenantId: 'store-branch', resource: 'resource:party-room', action: 'config_read' },
    ])
    const r1 = await controller.getAuditLog({ tenantId: 'store-main', limit: 10, action: undefined, since: undefined })
    const r2 = await controller.getAuditLog({ tenantId: 'store-branch', limit: 10, action: undefined, since: undefined })
    assert.equal(r1.total, 1)
    assert.equal(r2.total, 1)
  })
})

// ===================================================================
// 10. 极端/边界场景
// ===================================================================
describe('极端/边界场景', () => {
  it('大量审计日志下的 limit 截断', async () => {
    const { auditService, controller } = createCtx()
    await seedAudit(auditService, Array.from({ length: 100 }, (_, i) => ({
      actor: `bulk-${i}`, tenantId: 't-bulk', resource: `r-${i}`,
    })))
    const r = await controller.getAuditLog({ tenantId: 't-bulk', limit: 5, action: undefined, since: undefined })
    assert.equal(r.entries.length, 5)
    assert.equal(r.total, 100)
  })

  it('跨多租户的日志隔离——租户A看不到租户B的日志', async () => {
    const { auditService, controller } = createCtx()
    await seedAudit(auditService, [
      { actor: 'staff-a', tenantId: 'tenant-a', resource: 'cfg:a' },
      { actor: 'staff-b', tenantId: 'tenant-b', resource: 'cfg:b' },
    ])
    const rA = await controller.getAuditLog({ tenantId: 'tenant-a', limit: 10, action: undefined, since: undefined })
    const rB = await controller.getAuditLog({ tenantId: 'tenant-b', limit: 10, action: undefined, since: undefined })
    assert.equal(rA.total, 1)
    assert.equal(rB.total, 1)
    assert.equal(rA.entries[0].resource, 'cfg:a')
    assert.equal(rB.entries[0].resource, 'cfg:b')
  })

  it('健康检查在审计日志增长时的count正确性', async () => {
    const { auditService, controller } = createCtx()
    for (let i = 0; i < 5; i++) {
      await auditService.logCrossTenantAttempt({ actor: `u${i}`, tenantId: 't', resource: `r${i}` })
    }
    const h = controller.getHealth()
    assert.equal(h.auditLogCount, 5)
  })
})
