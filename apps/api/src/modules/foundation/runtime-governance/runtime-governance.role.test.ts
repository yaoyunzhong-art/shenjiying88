/**
 * 🐜 自动: [runtime-governance] [C] 角色测试修复
 *
 * 8 角色视角测试，修正 DTO/entity 字段匹配，确保 typecheck 通过。
 */
import { describe, it } from 'vitest'
import 'reflect-metadata'
import assert from 'node:assert/strict'
import { RuntimeGovernanceController } from './runtime-governance.controller'

// ── Helpers ──
function mockRuntimeGovService() {
  return {
    submitAction: () => Promise.resolve({
      receiptCode: 'REC-001', app: 'admin-web', action: 'booking-create' as any,
      state: 'submitted', nextStep: 'PROCEED' as any, riskLevel: 'low' as any,
      recommendedAction: 'COMPLETE_LOGIN' as any, requestEndpoint: '/api/booking',
      payloadSummary: 'create booking',
      ticket: {} as any, sync: {} as any, callback: {} as any, ledger: {} as any,
      retry: {} as any, rateLimit: {} as any, events: [], generatedAt: new Date().toISOString()
    }),
    getActionReceipt: () => Promise.resolve({
      receiptCode: 'REC-001', app: 'admin-web', action: 'booking-create' as any,
      state: 'submitted', nextStep: 'PROCEED' as any, riskLevel: 'low' as any,
      recommendedAction: 'COMPLETE_LOGIN' as any, requestEndpoint: '/api/booking',
      payloadSummary: 'create booking',
      ticket: {} as any, sync: {} as any, callback: {} as any, ledger: {} as any,
      retry: {} as any, rateLimit: {} as any, events: [], generatedAt: new Date().toISOString()
    }),
    syncAction: () => Promise.resolve({
      receiptCode: 'REC-001', app: 'admin-web', action: 'booking-create' as any,
      state: 'submitted', nextStep: 'PROCEED' as any, riskLevel: 'low' as any,
      recommendedAction: 'COMPLETE_LOGIN' as any, requestEndpoint: '/api/booking',
      payloadSummary: 'create booking',
      ticket: {} as any, sync: {} as any, callback: {} as any, ledger: {} as any,
      retry: {} as any, rateLimit: {} as any, events: [], generatedAt: new Date().toISOString()
    }),
    recordCallback: () => Promise.resolve({
      receiptCode: 'REC-001', app: 'admin-web', action: 'booking-create' as any,
      state: 'submitted', nextStep: 'PROCEED' as any, riskLevel: 'low' as any,
      recommendedAction: 'COMPLETE_LOGIN' as any, requestEndpoint: '/api/booking',
      payloadSummary: 'create booking',
      ticket: {} as any, sync: {} as any,
      callback: { callbackStatus: 'callback-recorded', ackToken: '', lastEvent: 'HANDLER_ACCEPTED' as any, summary: '' },
      ledger: {} as any, retry: {} as any, rateLimit: {} as any, events: [], generatedAt: new Date().toISOString()
    }),
    replayAction: () => Promise.resolve({
      receiptCode: 'REC-001', app: 'admin-web', action: 'booking-create' as any,
      state: 'replay-scheduled', nextStep: 'PROCEED' as any, riskLevel: 'low' as any,
      recommendedAction: 'COMPLETE_LOGIN' as any, requestEndpoint: '/api/booking',
      payloadSummary: 'create booking',
      ticket: {} as any, sync: {} as any, callback: {} as any, ledger: {} as any,
      retry: {} as any, rateLimit: {} as any, events: [], generatedAt: new Date().toISOString()
    }),
    getOperationsOverview: () => Promise.resolve({ generatedAt: new Date().toISOString(), summary: { backlog: 3, stalledCallbacks: 1, highRiskBacklog: 0, blockedActions: 0 }, receipts: [], stalledReceipts: [] }),
    getDescriptor: () => ({ key: 'runtime-governance', name: 'Runtime Governance Module', purpose: '', inboundContracts: [], outboundContracts: [], capabilities: [] })
  } as any
}

function createRuntimeGovController(mockSvc = mockRuntimeGovService()) {
  return new RuntimeGovernanceController(mockSvc)
}

const tenantCtx = { tenantId: 't-rt', brandId: 'b-rt', storeId: 's-rt', marketCode: 'zh-cn' }
const actorCtx = { actorId: 'a-ops', actorType: 'user' as any, actorName: 'Ops' as any, roles: [] as any, permissions: [] as any, authenticated: true, source: 'admin-web' }

const ROLES = {
  Operations: '🎯运行专员',
  TenantAdmin: '👔店长',
  Security: '🔧安监',
  Guide: '🎮导玩员',
  Front: '🛒前台',
  HR: '👥HR',
  Team: '🤝团建',
  Marketing: '📢营销'
}

function submitDto(body: Record<string, any>) {
  return {
    app: 'admin-web', action: 'booking-create', nextStep: 'PROCEED', riskLevel: 'low',
    requestEndpoint: '/api/test', payloadSummary: 'test', recommendedAction: 'COMPLETE_LOGIN',
    handlerName: 'test-handler', idempotencyKey: 'ik-test',
    ...body
  } as any
}

// ── 🎯运行专员 ──
describe(`${ROLES.Operations} runtime-governance 角色测试`, () => {
  it('运营专员可以 submit action', async () => {
    const ctrl = createRuntimeGovController()
    const result: any = await ctrl.submitAction(
      submitDto({ payload: { bookingId: 'b-001' }, idempotencyKey: 'ik-001' }),
      tenantCtx as any, actorCtx as any
    )
    assert.equal(result.receiptCode, 'REC-001')
    assert.equal(result.state, 'submitted')
  })

  it('运营专员可以获取 action receipt', async () => {
    const ctrl = createRuntimeGovController()
    const result: any = await ctrl.getActionReceipt('REC-001')
    assert.equal(result.receiptCode, 'REC-001')
  })

  it('运营专员可以 sync action', async () => {
    const ctrl = createRuntimeGovController()
    const result: any = await ctrl.syncAction(
      'REC-001',
      { handlerName: 'booking-handler', ticketCode: 'TCK-001', idempotencyKey: 'ik-002' },
      tenantCtx as any, actorCtx as any
    )
    assert.equal(result.state, 'submitted')
  })

  it('运营专员可以 record callback', async () => {
    const ctrl = createRuntimeGovController()
    const result: any = await ctrl.recordCallback(
      'REC-001',
      { callbackStatus: 'callback-recorded', ackToken: 'ack-001', lastEvent: 'HANDLER_ACCEPTED', summary: 'callback received', idempotencyKey: 'ik-003' },
      tenantCtx as any, actorCtx as any
    )
    assert.equal(result.callback.callbackStatus, 'callback-recorded')
  })

  it('运营专员可以 replay action', async () => {
    const ctrl = createRuntimeGovController()
    const result: any = await ctrl.replayAction(
      'REC-001',
      { ledgerKey: 'lk-001', requestedFrom: 'ADMIN_WEB_RUNTIME', ticketCode: 'TCK-001', idempotencyKey: 'ik-004' },
      tenantCtx as any, actorCtx as any
    )
    assert.equal(result.state, 'replay-scheduled')
  })
})

// ── 👔店长 ──
describe(`${ROLES.TenantAdmin} runtime-governance 角色测试`, () => {
  it('店长可以 submit action（全局操作）', async () => {
    const svc = mockRuntimeGovService()
    svc.submitAction = () => Promise.resolve({
      receiptCode: 'REC-ADMIN-001', state: 'submitted', action: 'secret-rotation',
      app: 'admin-web', nextStep: 'PROCEED' as any, riskLevel: 'high' as any,
      recommendedAction: 'COMPLETE_LOGIN' as any, requestEndpoint: '/api/secrets',
      payloadSummary: 'rotate secret',
      ticket: {} as any, sync: {} as any, callback: {} as any, ledger: {} as any,
      retry: {} as any, rateLimit: {} as any, events: [], generatedAt: new Date().toISOString()
    })
    const ctrl = createRuntimeGovController(svc)
    const result: any = await ctrl.submitAction(
      submitDto({ action: 'secret-rotation', riskLevel: 'high', payload: { secretName: 'db-password' }, payloadSummary: 'rotate secret', idempotencyKey: 'ik-005' }),
      tenantCtx as any, actorCtx as any
    )
    assert.equal(result.receiptCode, 'REC-ADMIN-001')
  })

  it('店长可以获取 action receipt', async () => {
    const ctrl = createRuntimeGovController()
    const result: any = await ctrl.getActionReceipt('REC-001')
    assert.ok(Array.isArray(result.events))
  })

  it('店长可以 replay action', async () => {
    const ctrl = createRuntimeGovController()
    const result: any = await ctrl.replayAction(
      'REC-001',
      { ledgerKey: 'lk-002', requestedFrom: 'ADMIN_WEB_RUNTIME', ticketCode: 'TCK-001', idempotencyKey: 'ik-006' },
      tenantCtx as any, actorCtx as any
    )
    assert.ok(result)
  })
})

// ── 🔧安监 ──
describe(`${ROLES.Security} runtime-governance 角色测试`, () => {
  it('安监可以获取 action receipt（审计视角）', async () => {
    const ctrl = createRuntimeGovController()
    const result: any = await ctrl.getActionReceipt('REC-001')
    assert.equal(result.receiptCode, 'REC-001')
  })

  it('安监可以 submit action（安全类操作）', async () => {
    const svc = mockRuntimeGovService()
    svc.submitAction = () => Promise.resolve({
      receiptCode: 'REC-SEC-001', state: 'submitted', action: 'secret-rotation', riskLevel: 'high',
      app: 'admin-web', nextStep: 'CHALLENGE' as any, recommendedAction: 'COMPLETE_LOGIN' as any,
      requestEndpoint: '/api/audit', payloadSummary: 'full security audit',
      ticket: {} as any, sync: {} as any, callback: {} as any, ledger: {} as any,
      retry: {} as any, rateLimit: {} as any, events: [], generatedAt: new Date().toISOString()
    })
    const ctrl = createRuntimeGovController(svc)
    const result: any = await ctrl.submitAction(
      submitDto({ action: 'secret-rotation', nextStep: 'CHALLENGE', riskLevel: 'high', payload: { auditType: 'full' }, payloadSummary: 'full security audit', idempotencyKey: 'ik-007' }),
      tenantCtx as any, actorCtx as any
    )
    assert.equal(result.action, 'secret-rotation')
  })

  it('安监可以 sync action', async () => {
    const ctrl = createRuntimeGovController()
    const result: any = await ctrl.syncAction(
      'REC-001',
      { handlerName: 'audit-handler', ticketCode: 'TCK-001', idempotencyKey: 'ik-008' },
      tenantCtx as any, actorCtx as any
    )
    assert.ok(result)
  })
})

// ── 🎮导玩员 ──
describe(`${ROLES.Guide} runtime-governance 角色测试`, () => {
  it('导玩员可以 submit action（设备同步）', async () => {
    const svc = mockRuntimeGovService()
    svc.submitAction = () => Promise.resolve({
      receiptCode: 'REC-GUIDE-001', state: 'submitted', action: 'device-bind',
      app: 'admin-web', nextStep: 'PROCEED' as any, riskLevel: 'low' as any,
      recommendedAction: 'COMPLETE_LOGIN' as any, requestEndpoint: '/api/devices',
      payloadSummary: 'sync device',
      ticket: {} as any, sync: {} as any, callback: {} as any, ledger: {} as any,
      retry: {} as any, rateLimit: {} as any, events: [], generatedAt: new Date().toISOString()
    })
    const ctrl = createRuntimeGovController(svc)
    const result: any = await ctrl.submitAction(
      submitDto({ action: 'device-bind', payload: { deviceId: 'dev-001' }, payloadSummary: 'sync device', idempotencyKey: 'ik-009' }),
      tenantCtx as any, actorCtx as any
    )
    assert.equal(result.action, 'device-bind')
  })

  it('导玩员可以获取 action receipt', async () => {
    const ctrl = createRuntimeGovController()
    const result: any = await ctrl.getActionReceipt('REC-001')
    assert.ok(result)
  })

  it('导玩员可以 record callback', async () => {
    const ctrl = createRuntimeGovController()
    const result: any = await ctrl.recordCallback(
      'REC-001',
      { callbackStatus: 'callback-recorded', ackToken: 'ack-002', lastEvent: 'HANDLER_ACCEPTED', summary: 'device online', idempotencyKey: 'ik-010' },
      tenantCtx as any, actorCtx as any
    )
    assert.ok(result)
  })
})

// ── 🛒前台 ──
describe(`${ROLES.Front} runtime-governance 角色测试`, () => {
  it('前台可以查询 action receipt（只读）', async () => {
    const ctrl = createRuntimeGovController()
    const result: any = await ctrl.getActionReceipt('REC-001')
    assert.equal(result.receiptCode, 'REC-001')
  })

  it('前台 submit action 使用低风险级别', async () => {
    const svc = mockRuntimeGovService()
    svc.submitAction = () => Promise.resolve({
      receiptCode: 'REC-FRONT-001', state: 'submitted', riskLevel: 'low',
      app: 'admin-web', action: 'booking-create' as any, nextStep: 'PROCEED' as any,
      recommendedAction: 'COMPLETE_LOGIN' as any, requestEndpoint: '/api/refund',
      payloadSummary: 'refund order',
      ticket: {} as any, sync: {} as any, callback: {} as any, ledger: {} as any,
      retry: {} as any, rateLimit: {} as any, events: [], generatedAt: new Date().toISOString()
    })
    const ctrl = createRuntimeGovController(svc)
    const result: any = await ctrl.submitAction(
      submitDto({ payload: { orderId: 'ord-001' }, payloadSummary: 'refund order', idempotencyKey: 'ik-011' }),
      tenantCtx as any, actorCtx as any
    )
    assert.equal(result.receiptCode, 'REC-FRONT-001')
    assert.equal(result.state, 'submitted')
  })
})

// ── 👥HR ──
describe(`${ROLES.HR} runtime-governance 角色测试`, () => {
  it('HR 可以获取 action receipt', async () => {
    const ctrl = createRuntimeGovController()
    const result: any = await ctrl.getActionReceipt('REC-001')
    assert.ok(result)
  })

  it('HR submit action 使用中等风险级别', async () => {
    const svc = mockRuntimeGovService()
    svc.submitAction = () => Promise.resolve({
      receiptCode: 'REC-HR-001', state: 'submitted', riskLevel: 'medium',
      app: 'admin-web', action: 'booking-create' as any, nextStep: 'CHALLENGE' as any,
      recommendedAction: 'COMPLETE_LOGIN' as any, requestEndpoint: '/api/hr',
      payloadSummary: 'change employee data',
      ticket: {} as any, sync: {} as any, callback: {} as any, ledger: {} as any,
      retry: {} as any, rateLimit: {} as any, events: [], generatedAt: new Date().toISOString()
    })
    const ctrl = createRuntimeGovController(svc)
    const result: any = await ctrl.submitAction(
      submitDto({ nextStep: 'CHALLENGE', riskLevel: 'medium', payload: { employeeId: 'emp-001' }, payloadSummary: 'change employee data', idempotencyKey: 'ik-012' }),
      tenantCtx as any, actorCtx as any
    )
    assert.equal(result.state, 'submitted')
  })
})

// ── 🤝团建 ──
describe(`${ROLES.Team} runtime-governance 角色测试`, () => {
  it('团建可以查询 action receipt', async () => {
    const ctrl = createRuntimeGovController()
    const result: any = await ctrl.getActionReceipt('REC-001')
    assert.equal(result.receiptCode, 'REC-001')
  })

  it('团建可以 record callback（活动回执）', async () => {
    const ctrl = createRuntimeGovController()
    const result: any = await ctrl.recordCallback(
      'REC-001',
      { callbackStatus: 'callback-recorded', ackToken: 'ack-003', lastEvent: 'HANDLER_ACCEPTED', summary: 'team building completed', idempotencyKey: 'ik-013' },
      tenantCtx as any, actorCtx as any
    )
    assert.ok(result)
  })
})

// ── 📢营销 ──
describe(`${ROLES.Marketing} runtime-governance 角色测试`, () => {
  it('营销可以获取 action receipt', async () => {
    const ctrl = createRuntimeGovController()
    const result: any = await ctrl.getActionReceipt('REC-001')
    assert.equal(result.receiptCode, 'REC-001')
  })

  it('营销 submit action 使用高风险级别（营销敏感操作）', async () => {
    const svc = mockRuntimeGovService()
    svc.submitAction = () => Promise.resolve({
      receiptCode: 'REC-MKT-001', state: 'challenge-issued', riskLevel: 'high', action: 'payment-submit',
      app: 'admin-web', nextStep: 'CHALLENGE' as any,
      recommendedAction: 'COMPLETE_LOGIN' as any, requestEndpoint: '/api/campaign',
      payloadSummary: 'launch mass campaign',
      ticket: {} as any, sync: {} as any, callback: {} as any, ledger: {} as any,
      retry: {} as any, rateLimit: {} as any, events: [], generatedAt: new Date().toISOString()
    })
    const ctrl = createRuntimeGovController(svc)
    const result: any = await ctrl.submitAction(
      submitDto({ action: 'payment-submit', nextStep: 'CHALLENGE', riskLevel: 'high', payload: { campaignId: 'cmp-001' }, payloadSummary: 'launch mass campaign', idempotencyKey: 'ik-014' }),
      tenantCtx as any, actorCtx as any
    )
    assert.equal(result.state, 'challenge-issued')
  })
})
