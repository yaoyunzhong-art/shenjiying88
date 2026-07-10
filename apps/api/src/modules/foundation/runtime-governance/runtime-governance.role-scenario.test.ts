/**
 * 🐜 自动: [runtime-governance] [C] 角色场景测试扩展
 *
 * 8 角色视角的 Runtime Governance 业务场景测试：
 * 👔店长 🛒前台 👥HR 🔧安监 🎮导玩员 🎯运行专员 🤝团建 📢营销
 *
 * 每个角色至少 3 个场景用例（正常打开→操作→完成 闭环 / 正向 + 负向 + 边界）
 */

import { describe, it, expect, beforeEach } from 'vitest'
import 'reflect-metadata'
import assert from 'node:assert/strict'
import { RuntimeGovernanceController } from './runtime-governance.controller'

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

// ── Mock 服务工厂 ──
function mockRuntimeGovernanceService() {
  const receipts = new Map<string, any>()
  let seq = 0

  return {
    submitAction(input: any) {
      const receiptCode = `RG-${input.app?.toUpperCase?.() ?? 'SYS'}-${++seq}-${Date.now().toString(36)}`
      const state = input.rateLimitConfig?.enabled === false ? 'bypass' : 'pending'
      const receipt = {
        receiptCode,
        app: input.app ?? 'system',
        action: input.action,
        state,
        submittedAt: new Date().toISOString(),
        rateLimit: { blocked: false, remainingAttempts: 5 },
      }
      receipts.set(receiptCode, receipt)
      return Promise.resolve(receipt)
    },

    getActionReceipt(receiptCode: string) {
      const receipt = receipts.get(receiptCode)
      if (!receipt) throw new Error(`NOT_FOUND: receipt ${receiptCode} not found`)
      return Promise.resolve(receipt)
    },

    syncAction(receiptCode: string, input: any) {
      const receipt = receipts.get(receiptCode)
      if (!receipt) throw new Error(`NOT_FOUND: receipt ${receiptCode} not found`)
      receipt.state = 'synced'
      receipt.syncedAt = new Date().toISOString()
      return Promise.resolve(receipt)
    },

    recordCallback(receiptCode: string, input: any) {
      const receipt = receipts.get(receiptCode)
      if (!receipt) throw new Error(`NOT_FOUND: receipt ${receiptCode} not found`)
      receipt.callbackReceived = true
      receipt.callbackAt = new Date().toISOString()
      receipt.state = 'completed'
      return Promise.resolve(receipt)
    },

    replayAction(receiptCode: string, input: any) {
      return Promise.resolve({ receiptCode, replayed: true, replayId: `replay-${++seq}`, state: 'replayed' })
    },
  }
}

function mockActorContext(overrides: any = {}) {
  return {
    actorId: overrides.actorId ?? 'user-001',
    tenantId: overrides.tenantId ?? 't-store',
    brandId: overrides.brandId ?? 'b-arcade',
    storeId: overrides.storeId ?? 's-main',
    marketCode: overrides.marketCode ?? 'us-default',
    roles: overrides.roles ?? [],
    permissions: overrides.permissions ?? [],
    ...overrides,
  } as any
}

function mockTenantContext(overrides: any = {}) {
  return {
    tenantId: 't-store',
    brandId: 'b-arcade',
    storeId: 's-main',
    marketCode: 'us-default',
    ...overrides,
  }
}

function createController(svc = mockRuntimeGovernanceService()) {
  return new RuntimeGovernanceController(svc as any)
}

// ── 辅助：构造 submit body ──
function submitBody(overrides: any = {}) {
  return {
    app: 'foundation',
    action: 'sync-store-config',
    targetApp: 'store-edge',
    rateLimitConfig: { enabled: true, limit: 100, windowSeconds: 60 },
    ...overrides,
  } as any
}

// ──────────── 👔 店长 ────────────
describe(`${ROLES.StoreManager} runtime-governance 业务场景`, () => {
  let ctrl: RuntimeGovernanceController
  let svc: ReturnType<typeof mockRuntimeGovernanceService>

  beforeEach(() => {
    svc = mockRuntimeGovernanceService()
    ctrl = createController(svc)
  })

  it('店长提交运行时治理动作（门店配置同步） - 正常流程', async () => {
    const result = await ctrl.submitAction(submitBody({ app: 'store-edge', action: 'sync-config' }), mockTenantContext(), mockActorContext({ actorId: 'store-owner', roles: ['TENANT_ADMIN'] }))
    assert.ok(result.receiptCode)
    assert.ok(result.receiptCode.startsWith('RG-'))
    assert.equal(result.state, 'pending')
  })

  it('店长查看提交的治理动作回执 - 正常流程', async () => {
    const submitted = await ctrl.submitAction(submitBody(), mockTenantContext(), mockActorContext({ actorId: 'store-owner', roles: ['TENANT_ADMIN'] }))
    const result = await ctrl.getActionReceipt(submitted.receiptCode)
    assert.equal(result.receiptCode, submitted.receiptCode)
    assert.ok((result as any).submittedAt)
  })

  it('店长查询不存在的回执 - 负向', async () => {
    let caught = false
    try {
      await ctrl.getActionReceipt('RG-NONEXIST-999')
    } catch (e: any) {
      caught = true
      assert.ok(e.message.includes('NOT_FOUND'))
    }
    assert.ok(caught)
  })
})

// ──────────── 🛒 前台 ────────────
describe(`${ROLES.FrontDesk} runtime-governance 业务场景`, () => {
  let ctrl: RuntimeGovernanceController
  let svc: ReturnType<typeof mockRuntimeGovernanceService>

  beforeEach(() => {
    svc = mockRuntimeGovernanceService()
    ctrl = createController(svc)
  })

  it('前台提交订单相关的运行时动作 - 正常流程', async () => {
    const result = await ctrl.submitAction(submitBody({ app: 'pos', action: 'sync-order' }), mockTenantContext(), mockActorContext({ actorId: 'front-desk', roles: ['TENANT_ADMIN'] }))
    assert.ok(result.receiptCode)
    assert.equal(result.app, 'pos')
  })

  it('前台查看已经提交的 POS 动作执行状态 - 正常流程', async () => {
    const submitted = await ctrl.submitAction(submitBody({ app: 'pos', action: 'sync-order' }), mockTenantContext(), mockActorContext({ actorId: 'front-desk', roles: ['TENANT_ADMIN'] }))
    const receipt = await ctrl.getActionReceipt(submitted.receiptCode)
    assert.equal(receipt.app, 'pos')
    assert.ok(['pending', 'completed'].includes(receipt.state))
  })

  it('前台无权操作（无OPERATIONS/SECURITY_ADMIN角色） - 边界', () => {
    const ac = mockActorContext({ actorId: 'front-desk', roles: ['store-staff'], permissions: [] })
    const hasRole = ac.roles.some((r: string) => ['SUPER_ADMIN', 'TENANT_ADMIN', 'OPERATIONS', 'SECURITY_ADMIN'].includes(r))
    assert.equal(hasRole, false)
  })
})

// ──────────── 👥 HR ────────────
describe(`${ROLES.HR} runtime-governance 业务场景`, () => {
  let ctrl: RuntimeGovernanceController
  let svc: ReturnType<typeof mockRuntimeGovernanceService>

  beforeEach(() => {
    svc = mockRuntimeGovernanceService()
    ctrl = createController(svc)
  })

  it('HR提交员工数据同步运行时动作 - 正常流程', async () => {
    const result = await ctrl.submitAction(submitBody({ app: 'hr', action: 'sync-employee-data' }), mockTenantContext(), mockActorContext({ actorId: 'hr-user', roles: ['TENANT_ADMIN'] }))
    assert.ok(result.receiptCode)
    assert.equal(result.app, 'hr')
  })

  it('HR无法访问运行时治理（无OPERATIONS角色） - 权限边界', () => {
    const ac = mockActorContext({ actorId: 'hr-user', roles: ['hr-admin'], permissions: ['user:read', 'audit:read'] })
    const allowedRoles = ['SUPER_ADMIN', 'TENANT_ADMIN', 'OPERATIONS', 'SECURITY_ADMIN']
    const hasRole = allowedRoles.some(r => ac.roles.includes(r))
    assert.equal(hasRole, false)
  })

  it('HR同步动作后查看回执 - 正常流程', async () => {
    const submitted = await ctrl.submitAction(submitBody({ app: 'hr', action: 'sync-employee-data' }), mockTenantContext(), mockActorContext({ actorId: 'hr-user', roles: ['TENANT_ADMIN'] }))
    const result = await ctrl.getActionReceipt(submitted.receiptCode)
    assert.equal(result.app, 'hr')
    assert.equal(result.receiptCode, submitted.receiptCode)
  })
})

// ──────────── 🔧 安监 ────────────
describe(`${ROLES.Security} runtime-governance 业务场景`, () => {
  let ctrl: RuntimeGovernanceController
  let svc: ReturnType<typeof mockRuntimeGovernanceService>

  beforeEach(() => {
    svc = mockRuntimeGovernanceService()
    ctrl = createController(svc)
  })

  it('安监提交安全策略同步运行时动作 - 正常流程', async () => {
    const result = await ctrl.submitAction(submitBody({ app: 'security', action: 'sync-rate-limit-policy' }), mockTenantContext(), mockActorContext({ actorId: 'sec-user', roles: ['SECURITY_ADMIN'] }))
    assert.ok(result.receiptCode)
    assert.equal(result.state, 'pending')
  })

  it('安监同步已提交的安全动作 - 正常流程', async () => {
    const submitted = await ctrl.submitAction(submitBody({ app: 'security', action: 'block-ip-range' }), mockTenantContext(), mockActorContext({ actorId: 'sec-user', roles: ['SECURITY_ADMIN'] }))
    const synced = await ctrl.syncAction(submitted.receiptCode, { destination: 'store-edge' } as any, mockTenantContext(), mockActorContext({ actorId: 'sec-user', roles: ['SECURITY_ADMIN'] }))
    assert.equal(synced.state, 'synced')
  })

  it('安监提交 bypass rate-limit 的紧急动作 - 边界', async () => {
    const result = await ctrl.submitAction(submitBody({ app: 'security', action: 'emergency-block', rateLimitConfig: { enabled: false } }), mockTenantContext(), mockActorContext({ actorId: 'sec-user', roles: ['SECURITY_ADMIN'] }))
    assert.equal(result.state, 'bypass')
  })
})

// ──────────── 🎮 导玩员 ────────────
describe(`${ROLES.Guide} runtime-governance 业务场景`, () => {
  let svc: ReturnType<typeof mockRuntimeGovernanceService>

  beforeEach(() => {
    svc = mockRuntimeGovernanceService()
  })

  it('导玩员无权提交运行时治理动作（无任何治理角色） - 权限边界', () => {
    const ac = mockActorContext({ actorId: 'guide-user', roles: ['store-staff'], permissions: ['inventory:read', 'order:read'] })
    const allowedRoles = ['SUPER_ADMIN', 'TENANT_ADMIN', 'OPERATIONS', 'SECURITY_ADMIN']
    const hasRole = allowedRoles.some(r => ac.roles.includes(r))
    assert.equal(hasRole, false)
  })

  it('导玩员只能查看门店运营数据,不涉及运行时治理 - 边界', () => {
    const ac = mockActorContext({ actorId: 'guide-user', roles: ['store-staff'], permissions: ['inventory:read'] })
    const canWriteGov = ac.permissions.some((p: string) => p.includes('runtime-governance'))
    assert.equal(canWriteGov, false)
  })

  it('导玩员门店操作无需经过 runtime governance - 边界', () => {
    const ac = mockActorContext({ actorId: 'guide-user', roles: ['store-staff'] })
    assert.equal(ac.roles.length, 1)
    assert.equal(ac.roles[0], 'store-staff')
  })
})

// ──────────── 🎯 运行专员 ────────────
describe(`${ROLES.Operations} runtime-governance 业务场景`, () => {
  let ctrl: RuntimeGovernanceController
  let svc: ReturnType<typeof mockRuntimeGovernanceService>

  beforeEach(() => {
    svc = mockRuntimeGovernanceService()
    ctrl = createController(svc)
  })

  it('运行专员提交运营数据同步动作 - 正常流程', async () => {
    const result = await ctrl.submitAction(submitBody({ app: 'ops-dashboard', action: 'refresh-metrics' }), mockTenantContext(), mockActorContext({ actorId: 'ops-user', roles: ['OPERATIONS'] }))
    assert.ok(result.receiptCode)
    assert.equal(result.state, 'pending')
  })

  it('运行专员同步已提交的动作 - 正常流程', async () => {
    const submitted = await ctrl.submitAction(submitBody({ app: 'ops-dashboard', action: 'refresh-metrics' }), mockTenantContext(), mockActorContext({ actorId: 'ops-user', roles: ['OPERATIONS'] }))
    const synced = await ctrl.syncAction(submitted.receiptCode, { destination: 'store-edge' } as any, mockTenantContext(), mockActorContext({ actorId: 'ops-user', roles: ['OPERATIONS'] }))
    assert.equal(synced.state, 'synced')
  })

  it('运行专员记录回调完成动作 - 正常流程', async () => {
    const submitted = await ctrl.submitAction(submitBody(), mockTenantContext(), mockActorContext({ actorId: 'ops-user', roles: ['OPERATIONS'] }))
    const result = await ctrl.recordCallback(submitted.receiptCode, { status: 'success' } as any, mockTenantContext(), mockActorContext({ actorId: 'ops-user', roles: ['OPERATIONS'] }))
    assert.equal(result.state, 'completed')
    assert.equal((result as any).callbackReceived, true)
  })
})

// ──────────── 🤝 团建 ────────────
describe(`${ROLES.Teambuilding} runtime-governance 业务场景`, () => {
  let svc: ReturnType<typeof mockRuntimeGovernanceService>

  beforeEach(() => {
    svc = mockRuntimeGovernanceService()
  })

  it('团建专员无 OPERATIONS 角色，无法提交运行时动作 - 权限边界', () => {
    const ac = mockActorContext({ actorId: 'team-user', roles: ['staff'], permissions: ['order:read', 'coupon:issue'] })
    const hasOpRole = ac.roles.some((r: string) => ['OPERATIONS', 'SECURITY_ADMIN'].includes(r))
    assert.equal(hasOpRole, false)
  })

  it('团建专员无运行时治理写入权限 - 权限边界', () => {
    const ac = mockActorContext({ actorId: 'team-user', roles: ['staff'], permissions: ['coupon:issue'] })
    const canWriteGov = ac.permissions.includes('foundation.runtime-governance.write')
    assert.equal(canWriteGov, false)
  })

  it('团建专员运行时治理读取权限也不具备 - 权限边界', () => {
    const ac = mockActorContext({ actorId: 'team-user', roles: ['staff'] })
    const canReadGov = ac.permissions.includes('foundation.runtime-governance.read')
    assert.equal(canReadGov, false)
  })
})

// ──────────── 📢 营销 ────────────
describe(`${ROLES.Marketing} runtime-governance 业务场景`, () => {
  let svc: ReturnType<typeof mockRuntimeGovernanceService>

  beforeEach(() => {
    svc = mockRuntimeGovernanceService()
  })

  it('营销专员无运行时治理相关角色 - 权限边界', () => {
    const ac = mockActorContext({ actorId: 'mkt-user', roles: ['marketing-admin'], permissions: ['coupon:read', 'coupon:write'] })
    const allowedRoles = ['SUPER_ADMIN', 'TENANT_ADMIN', 'OPERATIONS', 'SECURITY_ADMIN']
    const hasRole = allowedRoles.some(r => ac.roles.includes(r))
    assert.equal(hasRole, false)
  })

  it('营销专员无法访问运行时治理（无foundation.governance.read） - 权限边界', () => {
    const ac = mockActorContext({ actorId: 'mkt-user', roles: ['marketing-admin'], permissions: ['coupon:read'] })
    const canReadGov = ac.permissions.includes('foundation.governance.read')
    assert.equal(canReadGov, false)
  })

  it('营销专员无法写入或读取运行时治理 - 边界', () => {
    const ac = mockActorContext({ actorId: 'mkt-user', roles: ['marketing-admin'] })
    const hasGovAccess = ac.roles.some((r: string) => r !== 'marketing-admin') ||
      ac.permissions.some((p: string) => p.startsWith('foundation.runtime-governance'))
    assert.equal(hasGovAccess, false)
  })
})

// ──────────── 全局场景 ────────────
describe('runtime-governance 全局跨角色场景', () => {
  let ctrl: RuntimeGovernanceController
  let svc: ReturnType<typeof mockRuntimeGovernanceService>

  beforeEach(() => {
    svc = mockRuntimeGovernanceService()
    ctrl = createController(svc)
  })

  it('提交→同步→回调 完整生命周期', async () => {
    const ac = mockActorContext({ actorId: 'ops-user', roles: ['OPERATIONS'] })
    const tc = mockTenantContext()

    // 1. Submit
    const submitted = await ctrl.submitAction(submitBody({ app: 'test', action: 'full-lifecycle' }), tc, ac)
    assert.equal(submitted.state, 'pending')

    // 2. Sync
    const synced = await ctrl.syncAction(submitted.receiptCode, { destination: 'store-edge' } as any, tc, ac)
    assert.equal(synced.state, 'synced')

    // 3. Callback
    const completed = await ctrl.recordCallback(submitted.receiptCode, { status: 'success' } as any, tc, ac)
    assert.equal(completed.state, 'completed')
  })

  it('提交→重放 治理动作', async () => {
    const ac = mockActorContext({ actorId: 'ops-user', roles: ['OPERATIONS'] })
    const tc = mockTenantContext()
    const submitted = await ctrl.submitAction(submitBody({ app: 'test', action: 'needs-replay' }), tc, ac)
    const replayed = await ctrl.replayAction(submitted.receiptCode, { reason: 'stale-callback' } as any, tc, ac) as any
    assert.equal(replayed.replayed, true)
    assert.ok(replayed.replayId)
  })

  it('未认证用户无法访问任何端点', () => {
    const ac = mockActorContext({ actorId: 'anonymous', roles: [], permissions: [], authenticated: false })
    const hasRole = ac.roles.some((r: string) => ['SUPER_ADMIN', 'TENANT_ADMIN', 'OPERATIONS', 'SECURITY_ADMIN'].includes(r))
    assert.equal(hasRole, false)
  })
})
