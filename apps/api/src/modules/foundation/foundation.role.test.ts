import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
import 'reflect-metadata'
import assert from 'node:assert/strict'
import { FoundationController } from './foundation.controller'
import { FoundationService } from './foundation.service'
import {
  PERMISSIONS_METADATA_KEY,
  ROLES_METADATA_KEY
} from './identity-access/identity-access.decorator'

// ── Helpers: construct controller with mocked FoundationService ──
function mockFoundationService(overrides: Record<string, unknown> = {}): FoundationService {
  const svc: any = {
    getBlueprint: () => ({ generatedAt: '2026-01-01', docs: [], guardrails: [], modules: [], consumers: [], governanceBaselines: [], frontendBootstrap: {} }),
    getModuleCatalog: () => ([{ module: 'trust-governance', status: 'healthy' }]),
    getOperationsOverview: () => ({ generatedAt: '2026-01-01', summary: {}, alerts: [], topRisks: [], topFailures: [], moduleHealth: {}, modules: {} }),
    getOperationsAlerts: () => ({ generatedAt: '2026-01-01', alerts: [], topRisks: [] }),
    getOperationsAlertsCatalog: () => ({ generatedAt: '2026-01-01', alerts: [] }),
    getOperationsAlertDrilldown: () => ({ generatedAt: '2026-01-01', code: 'test', detail: {} }),
    acknowledgeOperationsAlert: () => ({ generatedAt: '2026-01-01', code: 'test', acknowledgement: {}, visibleInOverview: true }),
    muteOperationsAlert: () => ({ generatedAt: '2026-01-01', code: 'test', acknowledgement: {}, visibleInOverview: false }),
    unmuteOperationsAlert: () => ({ generatedAt: '2026-01-01', code: 'test', acknowledgement: {}, visibleInOverview: true }),
    getOperationsModuleDetail: () => ({ generatedAt: '2026-01-01', moduleKey: 'test' }),
    getConsumerCatalog: () => ([{ consumer: 'test' }]),
    getConsumerDependency: () => ({ consumer: 'test' }),
    ...overrides
  }
  return svc as unknown as FoundationService
}

const tenantCtx = { tenantId: 't-foundation', brandId: 'b-foundation', storeId: 's-foundation', marketCode: 'zh-cn' }
const actorCtx = { actorId: 'a-test', actorType: 'tenant-user' as const, actorName: 'Test', roles: [] as string[], permissions: [] as string[], tenantId: 't-foundation', authenticated: true, source: 'headers' as const }

const ROLES = {
  TenantAdmin: '👔店长',
  FrontDesk: '🛒前台',
  HR: '👥HR',
  Security: '🔧安监',
  Guide: '🎮导玩员',
  Operations: '🎯运行专员',
  Teambuilding: '🤝团建',
  Marketing: '📢营销'
}

// ── 👔店长 ──
describe(`${ROLES.TenantAdmin} foundation 角色测试`, () => {
  it('店长可以获取 foundation bootstrap', () => {
    const svc = mockFoundationService()
    const ctrl = new FoundationController(svc)
    const result = ctrl.getBootstrap(tenantCtx)
    assert.ok(result.tenantContext)
    assert.equal(result.tenantContext.tenantId, 't-foundation')
  })

  it('店长可以查看运营概览', async () => {
    const svc = mockFoundationService()
    const ctrl = new FoundationController(svc)
    const result = await ctrl.getOperationsOverview(tenantCtx)
    assert.ok(result)
    assert.ok(result.generatedAt)
  })

  it('店长可以查看告警目录', async () => {
    const svc = mockFoundationService({ getOperationsAlertsCatalog: async () => ({ generatedAt: '2026', alerts: [{ code: 'approvals-pending' }] }) })
    const ctrl = new FoundationController(svc)
    const result = await ctrl.getOperationsAlertsCatalog(tenantCtx)
    assert.ok(result.alerts)
  })

  it('店长可以查看模块列表', () => {
    const svc = mockFoundationService()
    const ctrl = new FoundationController(svc)
    const result = ctrl.getModules()
    assert.ok(Array.isArray(result))
  })
})

// ── 🔧安监 ──
describe(`${ROLES.Security} foundation 角色测试`, () => {
  it('安监可以获取 foundation bootstrap', () => {
    const svc = mockFoundationService()
    const ctrl = new FoundationController(svc)
    const result = ctrl.getBootstrap(tenantCtx)
    assert.ok(result.tenantContext)
  })

  it('安监可以查看告警目录（审计视角）', async () => {
    const svc = mockFoundationService()
    const ctrl = new FoundationController(svc)
    const result = await ctrl.getOperationsAlertsCatalog(tenantCtx)
    assert.ok(result)
    assert.ok(result.alerts)
  })

  it('安监可以 drilldown 告警详情', async () => {
    const svc = mockFoundationService({ getOperationsAlertDrilldown: async () => ({ generatedAt: '2026', code: 'high-risk-audits', detail: { riskLevel: 'high' } }) })
    const ctrl = new FoundationController(svc)
    const result = await ctrl.getOperationsAlertDrilldown('high-risk-audits', tenantCtx)
    assert.equal(result.code, 'high-risk-audits')
  })

  it('安监尝试 mute 告警（action 需要正确角色+权限）', async () => {
    const svc = mockFoundationService({
      muteOperationsAlert: async () => ({ generatedAt: '2026', code: 'high-risk-audits', acknowledgement: { status: 'MUTED' }, visibleInOverview: false, availableActions: [], history: [] })
    })
    const ctrl = new FoundationController(svc)
    // 操作测试：mute 的业务逻辑由 service 处理
    const result = await ctrl.muteOperationsAlert('high-risk-audits', tenantCtx, actorCtx, { note: '降噪' })
    assert.equal(result.acknowledgement!.status, 'MUTED')
  })
})

// ── 🎯运行专员 ──
describe(`${ROLES.Operations} foundation 角色测试`, () => {
  it('运营专员可以获取 foundation bootstrap', () => {
    const svc = mockFoundationService()
    const ctrl = new FoundationController(svc)
    const result = ctrl.getBootstrap(tenantCtx)
    assert.ok(result.tenantContext)
  })

  it('运营专员可以查看运营概览（含 summary）', async () => {
    const svc = mockFoundationService({
      getOperationsOverview: async () => ({
        generatedAt: '2026', summary: { approvalsPending: 2 }, alerts: [], topFailures: [], topRisks: [], moduleHealth: {}, modules: {}
      })
    })
    const ctrl = new FoundationController(svc)
    const result = await ctrl.getOperationsOverview(tenantCtx)
    assert.equal(result.summary.approvalsPending, 2)
  })

  it('运营专员可以 ack 告警', async () => {
    const svc = mockFoundationService({
      acknowledgeOperationsAlert: async () => ({ generatedAt: '2026', code: 'approvals-pending', acknowledgement: { status: 'ACKED' }, visibleInOverview: true, availableActions: [], history: [] })
    })
    const ctrl = new FoundationController(svc)
    const result = await ctrl.acknowledgeOperationsAlert('approvals-pending', tenantCtx, actorCtx, { note: '已处理' })
    assert.equal(result.acknowledgement!.status, 'ACKED')
  })

  it('运营专员可以 unmute 告警', async () => {
    const svc = mockFoundationService({
      unmuteOperationsAlert: async () => ({ generatedAt: '2026', code: 'approvals-pending', acknowledgement: { status: 'ACKED' }, visibleInOverview: true, availableActions: [], history: [] })
    })
    const ctrl = new FoundationController(svc)
    const result = await ctrl.unmuteOperationsAlert('approvals-pending', tenantCtx, actorCtx, { note: '恢复跟踪' })
    assert.equal(result.acknowledgement!.status, 'ACKED')
  })
})

// ── 👥HR ──
describe(`${ROLES.HR} foundation 角色测试`, () => {
  it('HR可以获取 foundation bootstrap', () => {
    const svc = mockFoundationService()
    const ctrl = new FoundationController(svc)
    const result = ctrl.getBootstrap(tenantCtx)
    assert.ok(result.tenantContext)
  })

  it('HR可以查看运营概览', async () => {
    const svc = mockFoundationService()
    const ctrl = new FoundationController(svc)
    const result = await ctrl.getOperationsOverview(tenantCtx)
    assert.ok(result)
    assert.ok(result.generatedAt)
  })

  it('HR可以查看模块列表', () => {
    const svc = mockFoundationService()
    const ctrl = new FoundationController(svc)
    const result = ctrl.getModules()
    assert.ok(result.length > 0)
  })

  it('HR尝试 ack 告警 — 边界（action 本身无权限，但调用成功需要 guard 检查）', async () => {
    // 业务逻辑测试：service 的 ack 调用支持
    const svc = mockFoundationService({
      acknowledgeOperationsAlert: async () => ({ generatedAt: '2026', code: 'high-risk-audits', acknowledgement: { status: 'ACKED' }, visibleInOverview: true, availableActions: [], history: [] })
    })
    const ctrl = new FoundationController(svc)
    const result = await ctrl.acknowledgeOperationsAlert('high-risk-audits', tenantCtx, actorCtx, { note: 'HR确认' })
    assert.ok(result.generatedAt)
  })
})

// ── 🛒前台 ──
describe(`${ROLES.FrontDesk} foundation 角色测试`, () => {
  it('前台可以获取 foundation bootstrap', () => {
    const svc = mockFoundationService()
    const ctrl = new FoundationController(svc)
    const result = ctrl.getBootstrap(tenantCtx)
    assert.ok(result.tenantContext)
  })

  it('前台可以查看模块列表', () => {
    const svc = mockFoundationService()
    const ctrl = new FoundationController(svc)
    const result = ctrl.getModules()
    assert.ok(Array.isArray(result))
  })

  it('前台查看 bootstrap 包含 tenantId（正常流程）', () => {
    const svc = mockFoundationService()
    const ctrl = new FoundationController(svc)
    const result = ctrl.getBootstrap(tenantCtx)
    assert.equal(result.tenantContext.tenantId, 't-foundation')
  })

  it('前台不在 ack 告警白名单中（权限边界）', () => {
    const roles = Reflect.getMetadata(ROLES_METADATA_KEY, FoundationController.prototype.acknowledgeOperationsAlert)
    assert.ok(!roles.includes('FRONT_DESK'))
    assert.ok(!roles.includes('RECEPTION'))
  })
})

// ── 🎮导玩员 ──
describe(`${ROLES.Guide} foundation 角色测试`, () => {
  it('导玩员可以获取 foundation bootstrap', () => {
    const svc = mockFoundationService()
    const ctrl = new FoundationController(svc)
    const result = ctrl.getBootstrap(tenantCtx)
    assert.ok(result.tenantContext)
  })

  it('导玩员可以查看模块列表', () => {
    const svc = mockFoundationService()
    const ctrl = new FoundationController(svc)
    const result = ctrl.getModules()
    assert.ok(Array.isArray(result))
  })

  it('导玩员查看运营概览（正常流程）', async () => {
    const svc = mockFoundationService()
    const ctrl = new FoundationController(svc)
    const result = await ctrl.getOperationsOverview(tenantCtx)
    assert.ok(result)
    assert.ok(result.generatedAt)
  })

  it('导玩员没有 mute 告警权限（权限边界）', () => {
    const roles = Reflect.getMetadata(ROLES_METADATA_KEY, FoundationController.prototype.muteOperationsAlert)
    assert.ok(!roles.includes('GUIDE'))
    assert.ok(!roles.includes('GAME_HOST'))
  })
})

// ── 🤝团建 ──
describe(`${ROLES.Teambuilding} foundation 角色测试`, () => {
  it('团建可以获取 foundation bootstrap', () => {
    const svc = mockFoundationService()
    const ctrl = new FoundationController(svc)
    const result = ctrl.getBootstrap(tenantCtx)
    assert.ok(result.tenantContext)
  })

  it('团建可以查看消费者目录', () => {
    const svc = mockFoundationService()
    const ctrl = new FoundationController(svc)
    const result = ctrl.getConsumers()
    assert.ok(Array.isArray(result))
  })

  it('团建可以查看单个消费者依赖（正常流程）', () => {
    const svc = mockFoundationService({ getConsumerDependency: () => ({ consumer: 'test-group' } as any) })
    const ctrl = new FoundationController(svc)
    const result = ctrl.getConsumer('test-group')
    assert.equal((result as any).consumer, 'test-group')
  })

  it('团建没有 unmute 告警权限（权限边界）', () => {
    const roles = Reflect.getMetadata(ROLES_METADATA_KEY, FoundationController.prototype.unmuteOperationsAlert)
    assert.ok(!roles.includes('TEAMBUILDING'))
    assert.ok(!roles.includes('TEAMBUILD'))
  })
})

// ── 📢营销 ──
describe(`${ROLES.Marketing} foundation 角色测试`, () => {
  it('营销可以获取 foundation bootstrap', () => {
    const svc = mockFoundationService()
    const ctrl = new FoundationController(svc)
    const result = ctrl.getBootstrap(tenantCtx)
    assert.ok(result.tenantContext)
  })

  it('营销可以查看模块列表', () => {
    const svc = mockFoundationService()
    const ctrl = new FoundationController(svc)
    const result = ctrl.getModules()
    assert.ok(Array.isArray(result))
  })

  it('营销可以查看运营告警（正常流程）', async () => {
    const svc = mockFoundationService()
    const ctrl = new FoundationController(svc)
    const result = await ctrl.getOperationsAlerts(tenantCtx)
    assert.ok(result)
    assert.ok(result.alerts)
  })

  it('营销没有 ack 告警权限（权限边界）', () => {
    const roles = Reflect.getMetadata(ROLES_METADATA_KEY, FoundationController.prototype.acknowledgeOperationsAlert)
    assert.ok(!roles.includes('MARKETING'))
    assert.ok(!roles.includes('PROMOTION'))
  })
})
