/**
 * 🐜 自动: [trust-governance] [C] 角色测试修复
 *
 * 8 角色视角测试，修正 DTO 字段匹配，确保 typecheck 通过。
 */
import { describe, it } from 'vitest'
import 'reflect-metadata'
import assert from 'node:assert/strict'
import { TrustGovernanceController } from './trust-governance.controller'

// ── Helpers ──
function mockTrustGovService() {
  return {
    getManagementMetadata: () => ({ module: 'trust-governance', type: 'governance' }),
    getOperationsOverview: () => Promise.resolve({ approvals: {}, audits: {}, rateLimit: {} }),
    listGovernanceApprovals: () => Promise.resolve({ approvals: [{ ticket: 'AP-001', status: 'PENDING' }] }),
    summarizeGovernanceApprovals: () => Promise.resolve({ byStatus: { PENDING: 2 }, total: 10 }),
    getGovernanceApprovalDetail: () => Promise.resolve({ ticket: 'AP-001', status: 'PENDING', details: { requestedBy: 'user-1' } }),
    getGovernanceApprovalTimeline: () => Promise.resolve({ timeline: [{ action: 'CREATE', timestamp: '2026-01-01' }] }),
    approveGovernanceApproval: () => Promise.resolve({ ticket: 'AP-001', status: 'APPROVED' }),
    rejectGovernanceApproval: () => Promise.resolve({ ticket: 'AP-001', status: 'REJECTED' }),
    cancelGovernanceApproval: () => Promise.resolve({ ticket: 'AP-001', status: 'CANCELLED' }),
    resubmitGovernanceApproval: () => Promise.resolve({ ticket: 'AP-001', status: 'PENDING' }),
    getAuditRecords: () => Promise.resolve({ records: [{ eventType: 'login' }], total: 50 }),
    summarizeAuditRecords: () => Promise.resolve({ byRiskLevel: { high: 2 }, total: 50 }),
    recordAudit: () => Promise.resolve({ recorded: true, eventType: 'login' }),
    evaluateRateLimit: () => Promise.resolve({ allowed: true, remaining: 99 }),
    listRateLimitPolicies: () => Promise.resolve({ policies: [{ code: 'api-policy', limit: 100 }] }),
    upsertRateLimitPolicy: () => Promise.resolve({ policy: { code: 'api-policy' }, status: 'updated' }),
    listQuotaLedgers: () => Promise.resolve({ ledgers: [{ subjectKey: 'tenant-1', used: 50, limit: 100 }] }),
    resetQuotaLedgers: () => Promise.resolve({ reset: [{ subjectKey: 'tenant-1', status: 'reset' }] }),
    maskPii: () => ({ masked: true, payload: '****' }),
    reviewAiInvocation: () => ({ allowed: true, riskLevel: 'low' }),
    getGovernanceBaselines: () => [],
    getDescriptor: () => ({ key: 'trust-governance', name: 'Trust Governance Module', purpose: '', inboundContracts: [], outboundContracts: [], capabilities: [] })
  } as any
}

function createTrustGovController(mockSvc = mockTrustGovService()) {
  return new TrustGovernanceController(mockSvc)
}

const ROLES = {
  Security: '🔧安监',
  TenantAdmin: '👔店长',
  Operations: '🎯运行专员',
  Marketing: '📢营销',
  Front: '🛒前台',
  HR: '👥HR',
  Guide: '🎮导玩员',
  Team: '🤝团建'
}

// ── 🔧安监 ──
describe(`${ROLES.Security} trust-governance 角色测试`, () => {
  it('安监可以查看审批列表', async () => {
    const ctrl = createTrustGovController()
    const result: any = await ctrl.getApprovals({})
    assert.ok(result.approvals)
  })

  it('安监可以 approve 审批', async () => {
    const ctrl = createTrustGovController()
    const result: any = await ctrl.approveApproval('AP-001', { decidedBy: 'sec-admin', decisionNote: '安全审核通过' })
    assert.equal(result.status, 'APPROVED')
  })

  it('安监可以 reject 审批', async () => {
    const ctrl = createTrustGovController()
    const result: any = await ctrl.rejectApproval('AP-002', { decidedBy: 'sec-admin', decisionNote: '安全不合规' })
    assert.equal(result.status, 'REJECTED')
  })

  it('安监可以查看审计记录', async () => {
    const ctrl = createTrustGovController()
    const result: any = await ctrl.getAudit({ limit: 20 })
    assert.ok(result.records)
    assert.equal(result.total, 50)
  })

  it('安监可以查看 rate-limit policies', async () => {
    const ctrl = createTrustGovController()
    const result: any = await ctrl.getRateLimitPolicies({ code: 'api-policy' })
    assert.ok(result.policies)
  })

  it('安监可以 reset quota ledgers', async () => {
    const ctrl = createTrustGovController()
    const result: any = await ctrl.resetQuotaLedgers({ policyCode: 'tenant-policy', requestedBy: 'sec-admin', resetAllActive: true })
    assert.ok(result.reset)
  })
})

// ── 👔店长 ──
describe(`${ROLES.TenantAdmin} trust-governance 角色测试`, () => {
  it('店长可以查看 management-metadata', () => {
    const ctrl = createTrustGovController()
    const result: any = ctrl.getManagementMetadata()
    assert.ok(result)
  })

  it('店长可以查看审批摘要', async () => {
    const ctrl = createTrustGovController()
    const result: any = await ctrl.getApprovalSummary({})
    assert.ok(result.byStatus)
  })

  it('店长可以查看审批详情', async () => {
    const ctrl = createTrustGovController()
    const result: any = await ctrl.getApprovalDetail('AP-001')
    assert.equal(result.ticket, 'AP-001')
  })

  it('店长可以查看审计摘要', async () => {
    const ctrl = createTrustGovController()
    const result: any = await ctrl.getAuditSummary({ limit: 10 })
    assert.ok(result.byRiskLevel)
  })

  it('店长可以写 rate-limit policies', async () => {
    const ctrl = createTrustGovController()
    const result: any = await ctrl.saveRateLimitPolicy({
      code: 'api-policy',
      scopeType: 'TENANT',
      period: 'MINUTE',
      limit: 200,
      requestedBy: 'tenant-admin'
    })
    assert.ok(result.policy)
  })
})

// ── 🎯运行专员 ──
describe(`${ROLES.Operations} trust-governance 角色测试`, () => {
  it('运营专员可以查看 overview', async () => {
    const ctrl = createTrustGovController()
    const result: any = await ctrl.getOperationsOverview()
    assert.ok(result)
  })

  it('运营专员可以查看审批 timeline', async () => {
    const ctrl = createTrustGovController()
    const result: any = await ctrl.getApprovalTimeline('AP-001', { limit: 10 })
    assert.ok(result.timeline)
  })

  it('运营专员可以 cancel 审批', async () => {
    const ctrl = createTrustGovController()
    const result: any = await ctrl.cancelApproval('AP-003', { operatorId: 'ops-user', reason: '不再需要' })
    assert.equal(result.status, 'CANCELLED')
  })

  it('运营专员可以 resubmit 审批', async () => {
    const ctrl = createTrustGovController()
    const result: any = await ctrl.resubmitApproval('AP-004', { operatorId: 'ops-user', reason: '补充材料后重新提交' })
    assert.ok(result)
  })
})

// ── 📢营销 ──
describe(`${ROLES.Marketing} trust-governance 角色测试`, () => {
  it('营销可以进行 AI review', () => {
    const ctrl = createTrustGovController()
    const result: any = ctrl.reviewAi({ modelCode: 'gpt-4', tenantId: 't-marketing', purpose: '文案生成', prompt: '生成营销文案', estimatedTokens: 500 })
    assert.ok(result.allowed)
    assert.equal(result.riskLevel, 'low')
  })

  it('营销可以进行 PII mask', () => {
    const ctrl = createTrustGovController()
    const result: any = ctrl.maskPii({ payload: { phone: '13800138000' } })
    assert.ok(result.masked)
  })

  it('营销可以 check rate limit', async () => {
    const ctrl = createTrustGovController()
    const result: any = await ctrl.checkRateLimit({ scopeKey: 'marketing-api', limit: 100, windowSeconds: 60 })
    assert.ok(result.allowed)
    assert.equal(result.remaining, 99)
  })

  it('营销可以 record audit（记录操作日志）', async () => {
    const ctrl = createTrustGovController()
    const result: any = await ctrl.recordAudit({ eventType: 'campaign-create', details: { campaignId: 'c-001' }, tenantId: 't-marketing', actorId: 'user-marketing', source: 'admin-web', riskLevel: 'low' })
    assert.ok(result.recorded)
  })
})

// ── 🛒前台 ──
describe(`${ROLES.Front} trust-governance 角色测试`, () => {
  it('前台可以 record audit（记录操作日志）', async () => {
    const ctrl = createTrustGovController()
    const result: any = await ctrl.recordAudit({ eventType: 'order-refund', details: { orderId: 'ord-001' }, tenantId: 't-front', actorId: 'cashier-01', source: 'cashier', riskLevel: 'low' })
    assert.ok(result.recorded)
  })

  it('前台可以 check rate limit', async () => {
    const ctrl = createTrustGovController()
    const result: any = await ctrl.checkRateLimit({ scopeKey: 'cashier-api', limit: 30, windowSeconds: 60, blockSeconds: 120 })
    assert.ok(result.allowed)
  })
})

// ── 👥HR ──
describe(`${ROLES.HR} trust-governance 角色测试`, () => {
  it('HR 可以查看审计记录', async () => {
    const ctrl = createTrustGovController()
    const result: any = await ctrl.getAudit({ limit: 20, action: 'employee-data-change' })
    assert.ok(result.records)
  })

  it('HR 可以 record audit（员工数据变更日志）', async () => {
    const ctrl = createTrustGovController()
    const result: any = await ctrl.recordAudit({ eventType: 'employee-update', details: { employeeId: 'emp-001' }, tenantId: 't-hr', actorId: 'hr-01', source: 'workbench', riskLevel: 'medium' })
    assert.ok(result.recorded)
  })
})

// ── 🎮导玩员 ──
describe(`${ROLES.Guide} trust-governance 角色测试`, () => {
  it('导玩员可以 record audit（设备操作日志）', async () => {
    const ctrl = createTrustGovController()
    const result: any = await ctrl.recordAudit({ eventType: 'device-action', details: { deviceId: 'dev-001', action: 'start-game' }, tenantId: 't-guide', actorId: 'guide-01', source: 'iot-panel', riskLevel: 'low' })
    assert.ok(result.recorded)
  })

  it('导玩员可以 check rate limit（设备 API 调用限制检查）', async () => {
    const ctrl = createTrustGovController()
    const result: any = await ctrl.checkRateLimit({ scopeKey: 'device-api', limit: 60, windowSeconds: 60, blockSeconds: 300 })
    assert.ok(result.allowed)
  })
})

// ── 🤝团建 ──
describe(`${ROLES.Team} trust-governance 角色测试`, () => {
  it('团建可以 record audit（活动日志）', async () => {
    const ctrl = createTrustGovController()
    const result: any = await ctrl.recordAudit({ eventType: 'team-event-create', details: { eventId: 'evt-001', type: 'outdoor' }, tenantId: 't-team', actorId: 'team-lead', source: 'portal', riskLevel: 'low' })
    assert.ok(result.recorded)
  })

  it('团建可以使用 PII mask（参与者信息脱敏）', () => {
    const ctrl = createTrustGovController()
    const result: any = ctrl.maskPii({ payload: { name: '张三', phone: '13800138000' } })
    assert.ok(result.masked)
  })
})
