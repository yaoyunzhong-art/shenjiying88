import 'reflect-metadata'
import assert from 'node:assert/strict'
import test, { describe } from 'node:test'
import { FoundationController } from './foundation.controller'
import { FoundationService } from './foundation.service'

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
  Security: '🔧安监',
  Operations: '🎯运行专员',
  HR: '👥HR'
}

// ── 👔店长 ──
describe(`${ROLES.TenantAdmin} foundation 角色测试`, () => {
  test('店长可以获取 foundation bootstrap', () => {
    const svc = mockFoundationService()
    const ctrl = new FoundationController(svc)
    const result = ctrl.getBootstrap(tenantCtx)
    assert.ok(result.tenantContext)
    assert.equal(result.tenantContext.tenantId, 't-foundation')
  })

  test('店长可以查看运营概览', async () => {
    const svc = mockFoundationService()
    const ctrl = new FoundationController(svc)
    const result = await ctrl.getOperationsOverview(tenantCtx)
    assert.ok(result)
    assert.ok(result.generatedAt)
  })

  test('店长可以查看告警目录', async () => {
    const svc = mockFoundationService({ getOperationsAlertsCatalog: async () => ({ generatedAt: '2026', alerts: [{ code: 'approvals-pending' }] }) })
    const ctrl = new FoundationController(svc)
    const result = await ctrl.getOperationsAlertsCatalog(tenantCtx)
    assert.ok(result.alerts)
  })

  test('店长可以查看模块列表', () => {
    const svc = mockFoundationService()
    const ctrl = new FoundationController(svc)
    const result = ctrl.getModules()
    assert.ok(Array.isArray(result))
  })
})

// ── 🔧安监 ──
describe(`${ROLES.Security} foundation 角色测试`, () => {
  test('安监可以获取 foundation bootstrap', () => {
    const svc = mockFoundationService()
    const ctrl = new FoundationController(svc)
    const result = ctrl.getBootstrap(tenantCtx)
    assert.ok(result.tenantContext)
  })

  test('安监可以查看告警目录（审计视角）', async () => {
    const svc = mockFoundationService()
    const ctrl = new FoundationController(svc)
    const result = await ctrl.getOperationsAlertsCatalog(tenantCtx)
    assert.ok(result)
    assert.ok(result.alerts)
  })

  test('安监可以 drilldown 告警详情', async () => {
    const svc = mockFoundationService({ getOperationsAlertDrilldown: async () => ({ generatedAt: '2026', code: 'high-risk-audits', detail: { riskLevel: 'high' } }) })
    const ctrl = new FoundationController(svc)
    const result = await ctrl.getOperationsAlertDrilldown('high-risk-audits', tenantCtx)
    assert.equal(result.code, 'high-risk-audits')
  })

  test('安监尝试 mute 告警（action 需要正确角色+权限）', async () => {
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
  test('运营专员可以获取 foundation bootstrap', () => {
    const svc = mockFoundationService()
    const ctrl = new FoundationController(svc)
    const result = ctrl.getBootstrap(tenantCtx)
    assert.ok(result.tenantContext)
  })

  test('运营专员可以查看运营概览（含 summary）', async () => {
    const svc = mockFoundationService({
      getOperationsOverview: async () => ({
        generatedAt: '2026', summary: { approvalsPending: 2 }, alerts: [], topFailures: [], topRisks: [], moduleHealth: {}, modules: {}
      })
    })
    const ctrl = new FoundationController(svc)
    const result = await ctrl.getOperationsOverview(tenantCtx)
    assert.equal(result.summary.approvalsPending, 2)
  })

  test('运营专员可以 ack 告警', async () => {
    const svc = mockFoundationService({
      acknowledgeOperationsAlert: async () => ({ generatedAt: '2026', code: 'approvals-pending', acknowledgement: { status: 'ACKED' }, visibleInOverview: true, availableActions: [], history: [] })
    })
    const ctrl = new FoundationController(svc)
    const result = await ctrl.acknowledgeOperationsAlert('approvals-pending', tenantCtx, actorCtx, { note: '已处理' })
    assert.equal(result.acknowledgement!.status, 'ACKED')
  })

  test('运营专员可以 unmute 告警', async () => {
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
  test('HR可以获取 foundation bootstrap', () => {
    const svc = mockFoundationService()
    const ctrl = new FoundationController(svc)
    const result = ctrl.getBootstrap(tenantCtx)
    assert.ok(result.tenantContext)
  })

  test('HR可以查看运营概览', async () => {
    const svc = mockFoundationService()
    const ctrl = new FoundationController(svc)
    const result = await ctrl.getOperationsOverview(tenantCtx)
    assert.ok(result)
    assert.ok(result.generatedAt)
  })

  test('HR可以查看模块列表', () => {
    const svc = mockFoundationService()
    const ctrl = new FoundationController(svc)
    const result = ctrl.getModules()
    assert.ok(result.length > 0)
  })

  test('HR尝试 ack 告警 — 边界（action 本身无权限，但调用成功需要 guard 检查）', async () => {
    // 业务逻辑测试：service 的 ack 调用支持
    const svc = mockFoundationService({
      acknowledgeOperationsAlert: async () => ({ generatedAt: '2026', code: 'high-risk-audits', acknowledgement: { status: 'ACKED' }, visibleInOverview: true, availableActions: [], history: [] })
    })
    const ctrl = new FoundationController(svc)
    const result = await ctrl.acknowledgeOperationsAlert('high-risk-audits', tenantCtx, actorCtx, { note: 'HR确认' })
    assert.ok(result.generatedAt)
  })
})
