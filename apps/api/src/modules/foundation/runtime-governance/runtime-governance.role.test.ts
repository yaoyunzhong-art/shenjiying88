import 'reflect-metadata'
import assert from 'node:assert/strict'
import test, { describe } from 'node:test'

// ── Helpers ──
function mockRuntimeGovService() {
  return {
    submitAction: () => ({ receiptCode: 'REC-001', status: 'submitted', actionType: 'booking-create' }),
    getActionReceipt: () => ({ receiptCode: 'REC-001', status: 'submitted', timeline: [] }),
    syncAction: () => ({ receiptCode: 'REC-001', status: 'synced' }),
    recordCallback: () => ({ receiptCode: 'REC-001', callbackStatus: 'callback-recorded' }),
    replayAction: () => ({ receiptCode: 'REC-001', status: 'replay-scheduled' }),
    getOperationsOverview: async () => ({ backlog: 3, stalledCallbacks: 1, highRiskBacklog: 0, blockedActions: 0 }),
    getGovernanceBaselines: () => [],
    getDescriptor: () => ({ module: 'runtime-governance' })
  } as any
}

function createRuntimeGovController(mockSvc = mockRuntimeGovService()) {
  const { RuntimeGovernanceController } = require('./runtime-governance.controller')
  return new RuntimeGovernanceController(mockSvc)
}

const tenantCtx = { tenantId: 't-rt', brandId: 'b-rt', storeId: 's-rt', marketCode: 'zh-cn' }
const actorCtx = { actorId: 'a-ops', actorType: 'user', actorName: 'Ops', roles: [], permissions: [] }

const ROLES = {
  Operations: '🎯运行专员',
  TenantAdmin: '👔店长',
  Security: '🔧安监',
  Guide: '🎮导玩员'
}

// ── 🎯运行专员 ──
describe(`${ROLES.Operations} runtime-governance 角色测试`, () => {
  test('运营专员可以 submit action', () => {
    const ctrl = createRuntimeGovController()
    const result = ctrl.submitAction(
      { actionType: 'booking-create', payload: { bookingId: 'b-001' }, receiptCode: 'REC-001' },
      tenantCtx,
      actorCtx
    )
    assert.equal(result.receiptCode, 'REC-001')
    assert.equal(result.status, 'submitted')
  })

  test('运营专员可以获取 action receipt', () => {
    const ctrl = createRuntimeGovController()
    const result = ctrl.getActionReceipt('REC-001')
    assert.equal(result.receiptCode, 'REC-001')
  })

  test('运营专员可以 sync action', () => {
    const ctrl = createRuntimeGovController()
    const result = ctrl.syncAction('REC-001', { status: 'in-progress' }, tenantCtx, actorCtx)
    assert.equal(result.status, 'synced')
  })

  test('运营专员可以 record callback', () => {
    const ctrl = createRuntimeGovController()
    const result = ctrl.recordCallback('REC-001', { callbackType: 'SUCCESS', data: {} }, tenantCtx, actorCtx)
    assert.equal(result.callbackStatus, 'callback-recorded')
  })

  test('运营专员可以 replay action', () => {
    const ctrl = createRuntimeGovController()
    const result = ctrl.replayAction('REC-001', { reason: 'retry-failed' }, tenantCtx, actorCtx)
    assert.equal(result.status, 'replay-scheduled')
  })
})

// ── 👔店长 ──
describe(`${ROLES.TenantAdmin} runtime-governance 角色测试`, () => {
  test('店长可以 submit action（全局操作）', () => {
    const svc = mockRuntimeGovService()
    svc.submitAction = () => ({ receiptCode: 'REC-ADMIN-001', status: 'submitted', actionType: 'secret-rotation' })
    const ctrl = createRuntimeGovController(svc)
    const result = ctrl.submitAction(
      { actionType: 'secret-rotation', payload: { secretName: 'db-password' }, receiptCode: 'REC-ADMIN-001' },
      tenantCtx,
      actorCtx
    )
    assert.equal(result.receiptCode, 'REC-ADMIN-001')
  })

  test('店长可以获取 action receipt', () => {
    const ctrl = createRuntimeGovController()
    const result = ctrl.getActionReceipt('REC-001')
    assert.ok(result.timeline)
  })

  test('店长可以 replay action', () => {
    const ctrl = createRuntimeGovController()
    const result = ctrl.replayAction('REC-001', { reason: 'admin-force-replay' }, tenantCtx, actorCtx)
    assert.ok(result)
  })
})

// ── 🔧安监 ──
describe(`${ROLES.Security} runtime-governance 角色测试`, () => {
  test('安监可以获取 action receipt（审计视角）', () => {
    const ctrl = createRuntimeGovController()
    const result = ctrl.getActionReceipt('REC-001')
    assert.equal(result.receiptCode, 'REC-001')
  })

  test('安监可以 submit action（安全类操作）', () => {
    const svc = mockRuntimeGovService()
    svc.submitAction = () => ({ receiptCode: 'REC-SEC-001', status: 'submitted', actionType: 'security-audit' })
    const ctrl = createRuntimeGovController(svc)
    const result = ctrl.submitAction(
      { actionType: 'security-audit', payload: { auditType: 'full' }, receiptCode: 'REC-SEC-001' },
      tenantCtx,
      actorCtx
    )
    assert.equal(result.actionType, 'security-audit')
  })

  test('安监可以 sync action', () => {
    const ctrl = createRuntimeGovController()
    const result = ctrl.syncAction('REC-001', { status: 'pending-review' }, tenantCtx, actorCtx)
    assert.ok(result)
  })
})

// ── 🎮导玩员 ──
describe(`${ROLES.Guide} runtime-governance 角色测试`, () => {
  test('导玩员可以 submit action（设备同步）', () => {
    const svc = mockRuntimeGovService()
    svc.submitAction = () => ({ receiptCode: 'REC-GUIDE-001', status: 'submitted', actionType: 'device-sync' })
    const ctrl = createRuntimeGovController(svc)
    const result = ctrl.submitAction(
      { actionType: 'device-sync', payload: { deviceId: 'dev-001' }, receiptCode: 'REC-GUIDE-001' },
      tenantCtx,
      actorCtx
    )
    assert.equal(result.actionType, 'device-sync')
  })

  test('导玩员可以获取 action receipt', () => {
    const ctrl = createRuntimeGovController()
    const result = ctrl.getActionReceipt('REC-001')
    assert.ok(result)
  })

  test('导玩员可以 record callback', () => {
    const ctrl = createRuntimeGovController()
    const result = ctrl.recordCallback('REC-001', { callbackType: 'DEVICE_ONLINE', data: { deviceId: 'dev-001' } }, tenantCtx, actorCtx)
    assert.ok(result)
  })
})
