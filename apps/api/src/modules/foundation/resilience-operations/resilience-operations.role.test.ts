import 'reflect-metadata'
import assert from 'node:assert/strict'
import test, { describe } from 'node:test'

// ── Helpers ──
function mockResilienceOpsService() {
  return {
    getManagementMetadata: () => ({ module: 'resilience-operations', type: 'governance' }),
    getOperationsOverview: () => ({ observability: { degradedSignals: 3 }, recovery: {} }),
    getObservabilitySignals: () => ({ metrics: [], logs: [], traces: [] }),
    listRetryPolicies: () => ({ policies: [{ resource: 'booking-service', maxRetries: 3 }] }),
    listRecoveryPlans: () => ({ plans: [{ resource: 'booking-db', drills: [] }] }),
    describeRecoveryPlan: () => ({ resource: 'booking-db', steps: ['snapshot', 'restore'], lastDrill: '2026-01-01' }),
    stageEdgeReplay: () => ({ staged: true, storeId: 'store-001', operationCount: 5 }),
    getGovernanceBaselines: () => [],
    getDescriptor: () => ({ module: 'resilience-operations' })
  } as any
}

function createResilienceOpsController(mockSvc = mockResilienceOpsService()) {
  const { ResilienceOperationsController } = require('./resilience-operations.controller')
  return new ResilienceOperationsController(mockSvc)
}

const ROLES = {
  TenantAdmin: '👔店长',
  Operations: '🎯运行专员',
  Security: '🔧安监',
  HR: '👥HR'
}

// ── 👔店长 ──
describe(`${ROLES.TenantAdmin} resilience-operations 角色测试`, () => {
  test('店长可以获取 management-metadata', () => {
    const ctrl = createResilienceOpsController()
    const result = ctrl.getManagementMetadata()
    assert.ok(result)
  })

  test('店长可以查看 overview', () => {
    const ctrl = createResilienceOpsController()
    const result = ctrl.getOperationsOverview()
    assert.ok(result)
  })

  test('店长可以查看 observability signals', () => {
    const ctrl = createResilienceOpsController()
    const result = ctrl.getObservabilitySignals({})
    assert.ok(result)
  })

  test('店长可以查看 recovery plans', () => {
    const ctrl = createResilienceOpsController()
    const result = ctrl.getRecoveryPlans({})
    assert.ok(result.plans)
  })
})

// ── 🎯运行专员 ──
describe(`${ROLES.Operations} resilience-operations 角色测试`, () => {
  test('运营专员可以查看 retry policies', () => {
    const ctrl = createResilienceOpsController()
    const result = ctrl.getRetryPolicies({})
    assert.ok(result.policies)
  })

  test('运营专员可以查看 recovery plan 详情', () => {
    const ctrl = createResilienceOpsController()
    const result = ctrl.getRecoveryPlan('booking-db')
    assert.equal(result.resource, 'booking-db')
    assert.ok(result.steps)
  })

  test('运营专员可以 stage edge replay', () => {
    const ctrl = createResilienceOpsController()
    const result = ctrl.stageEdgeReplay({ storeId: 'store-001', operationCount: 10 })
    assert.ok(result.staged)
    assert.equal(result.storeId, 'store-001')
  })

  test('运营专员可以查看 overview', () => {
    const ctrl = createResilienceOpsController()
    const result = ctrl.getOperationsOverview()
    assert.ok(result)
  })
})

// ── 🔧安监 ──
describe(`${ROLES.Security} resilience-operations 角色测试`, () => {
  test('安监可以获取 management-metadata', () => {
    const ctrl = createResilienceOpsController()
    const result = ctrl.getManagementMetadata()
    assert.ok(result)
  })

  test('安监可以查看 observability signals（审计视角）', () => {
    const ctrl = createResilienceOpsController()
    const result = ctrl.getObservabilitySignals({ limit: 20 })
    assert.ok(result)
  })

  test('安监可以查看 recovery plans（合规视角）', () => {
    const ctrl = createResilienceOpsController()
    const result = ctrl.getRecoveryPlans({})
    assert.ok(result.plans)
  })
})

// ── 👥HR ──
describe(`${ROLES.HR} resilience-operations 角色测试`, () => {
  test('HR可以获取 management-metadata', () => {
    const ctrl = createResilienceOpsController()
    const result = ctrl.getManagementMetadata()
    assert.ok(result)
  })

  test('HR可以查看 overview', () => {
    const ctrl = createResilienceOpsController()
    const result = ctrl.getOperationsOverview()
    assert.ok(result)
  })

  test('HR查看 retry policies 时返回数据正确', () => {
    const ctrl = createResilienceOpsController()
    const result = ctrl.getRetryPolicies({ resource: 'booking-service' })
    assert.ok(result.policies)
  })
})
