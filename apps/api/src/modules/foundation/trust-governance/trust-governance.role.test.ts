import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
import 'reflect-metadata'
import assert from 'node:assert/strict'
import { TrustGovernanceController } from './trust-governance.controller'

// ── Helpers ──
function mockTrustGovService() {
  return {
    getManagementMetadata: () => ({ module: 'trust-governance', type: 'governance' }),
    getOperationsOverview: async () => ({ approvals: {}, audits: {}, rateLimit: {} }),
    listGovernanceApprovals: async () => ({ approvals: [{ ticket: 'AP-001', status: 'PENDING' }] }),
    summarizeGovernanceApprovals: async () => ({ byStatus: { PENDING: 2 }, total: 10 }),
    getGovernanceApprovalDetail: async () => ({ ticket: 'AP-001', status: 'PENDING', details: { requestedBy: 'user-1' } }),
    getGovernanceApprovalTimeline: async () => ({ timeline: [{ action: 'CREATE', timestamp: '2026-01-01' }] }),
    approveGovernanceApproval: async () => ({ ticket: 'AP-001', status: 'APPROVED' }),
    rejectGovernanceApproval: async () => ({ ticket: 'AP-001', status: 'REJECTED' }),
    cancelGovernanceApproval: async () => ({ ticket: 'AP-001', status: 'CANCELLED' }),
    resubmitGovernanceApproval: async () => ({ ticket: 'AP-001', status: 'PENDING' }),
    getAuditRecords: async () => ({ records: [{ eventType: 'login' }], total: 50 }),
    summarizeAuditRecords: async () => ({ byRiskLevel: { high: 2 }, total: 50 }),
    recordAudit: async () => ({ recorded: true, eventType: 'login' }),
    evaluateRateLimit: async () => ({ allowed: true, remaining: 99 }),
    listRateLimitPolicies: async () => ({ policies: [{ scope: 'api', maxRequests: 100 }] }),
    upsertRateLimitPolicy: async () => ({ policy: { scope: 'api' }, status: 'updated' }),
    listQuotaLedgers: async () => ({ ledgers: [{ scopeId: 'tenant-1', used: 50, limit: 100 }] }),
    resetQuotaLedgers: async () => ({ reset: [{ scopeId: 'tenant-1', status: 'reset' }] }),
    maskPii: () => ({ masked: true, payload: '****' }),
    reviewAiInvocation: () => ({ allowed: true, riskLevel: 'low' }),
    getGovernanceBaselines: () => [],
    getDescriptor: () => ({ module: 'trust-governance' })
  } as any
}

function createTrustGovController(mockSvc = mockTrustGovService()) {
  return new TrustGovernanceController(mockSvc)
}

const ROLES = {
  Security: '🔧安监',
  TenantAdmin: '👔店长',
  Operations: '🎯运行专员',
  Marketing: '📢营销'
}

// ── 🔧安监 ──
describe(`${ROLES.Security} trust-governance 角色测试`, () => {
  it('安监可以查看审批列表', async () => {
    const ctrl = createTrustGovController()
    const result = await ctrl.getApprovals({})
    assert.ok(result.approvals)
  })

  it('安监可以 approve 审批', async () => {
    const ctrl = createTrustGovController()
    const result = await ctrl.approveApproval('AP-001', { decidedBy: 'sec-admin', note: '安全审核通过' })
    assert.equal(result.status, 'APPROVED')
  })

  it('安监可以 reject 审批', async () => {
    const ctrl = createTrustGovController()
    const result = await ctrl.rejectApproval('AP-002', { decidedBy: 'sec-admin', note: '安全不合规' })
    assert.equal(result.status, 'REJECTED')
  })

  it('安监可以查看审计记录', async () => {
    const ctrl = createTrustGovController()
    const result = await ctrl.getAudit({ limit: 20 })
    assert.ok(result.records)
    assert.equal(result.total, 50)
  })

  it('安监可以查看 rate-limit policies', async () => {
    const ctrl = createTrustGovController()
    const result = await ctrl.getRateLimitPolicies({})
    assert.ok(result.policies)
  })

  it('安监可以 reset quota ledgers', async () => {
    const ctrl = createTrustGovController()
    const result = await ctrl.resetQuotaLedgers({ scopeIds: ['tenant-1'], resetBy: 'sec-admin' })
    assert.ok(result.reset)
  })
})

// ── 👔店长 ──
describe(`${ROLES.TenantAdmin} trust-governance 角色测试`, () => {
  it('店长可以查看 management-metadata', () => {
    const ctrl = createTrustGovController()
    const result = ctrl.getManagementMetadata()
    assert.ok(result)
  })

  it('店长可以查看审批摘要', async () => {
    const ctrl = createTrustGovController()
    const result = await ctrl.getApprovalSummary({})
    assert.ok(result.byStatus)
  })

  it('店长可以查看审批详情', async () => {
    const ctrl = createTrustGovController()
    const result = await ctrl.getApprovalDetail('AP-001')
    assert.equal(result.ticket, 'AP-001')
  })

  it('店长可以查看审计摘要', async () => {
    const ctrl = createTrustGovController()
    const result = await ctrl.getAuditSummary({ limit: 10 })
    assert.ok(result.byRiskLevel)
  })

  it('店长可以写 rate-limit policies', async () => {
    const ctrl = createTrustGovController()
    const result = await ctrl.saveRateLimitPolicy({ scope: 'api', maxRequests: 200 })
    assert.ok(result.policy)
  })
})

// ── 🎯运行专员 ──
describe(`${ROLES.Operations} trust-governance 角色测试`, () => {
  it('运营专员可以查看 overview', async () => {
    const ctrl = createTrustGovController()
    const result = await ctrl.getOperationsOverview()
    assert.ok(result)
  })

  it('运营专员可以查看审批 timeline', async () => {
    const ctrl = createTrustGovController()
    const result = await ctrl.getApprovalTimeline('AP-001', { limit: 10 })
    assert.ok(result.timeline)
  })

  it('运营专员可以 cancel 审批', async () => {
    const ctrl = createTrustGovController()
    const result = await ctrl.cancelApproval('AP-003', { cancelledBy: 'ops-user', reason: '不再需要' })
    assert.equal(result.status, 'CANCELLED')
  })

  it('运营专员可以 resubmit 审批', async () => {
    const ctrl = createTrustGovController()
    const result = await ctrl.resubmitApproval('AP-004', { resubmittedBy: 'ops-user', reason: '补充材料后重新提交' })
    assert.ok(result)
  })
})

// ── 📢营销 ──
describe(`${ROLES.Marketing} trust-governance 角色测试`, () => {
  it('营销可以进行 AI review', () => {
    const ctrl = createTrustGovController()
    const result = ctrl.reviewAi({ modelCode: 'gpt-4', tenantId: 't-marketing', purpose: '文案生成', prompt: '生成营销文案', estimatedTokens: 500 })
    assert.ok(result.allowed)
    assert.equal(result.riskLevel, 'low')
  })

  it('营销可以进行 PII mask', () => {
    const ctrl = createTrustGovController()
    const result = ctrl.maskPii({ payload: '用户手机号 13800138000', fields: ['phone'] })
    assert.ok(result.masked)
  })

  it('营销可以 check rate limit', async () => {
    const ctrl = createTrustGovController()
    const result = await ctrl.checkRateLimit({ scope: 'marketing-api', actorId: 'user-marketing' })
    assert.ok(result.allowed)
    assert.equal(result.remaining, 99)
  })

  it('营销可以 record audit（记录操作日志）', async () => {
    const ctrl = createTrustGovController()
    const result = await ctrl.recordAudit({ eventType: 'campaign-create', details: { campaignId: 'c-001' }, tenantId: 't-marketing', actorId: 'user-marketing', source: 'admin-web', riskLevel: 'low' })
    assert.ok(result.recorded)
  })
})
