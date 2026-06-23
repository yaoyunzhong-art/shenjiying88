import 'reflect-metadata'
import assert from 'node:assert/strict'
import test from 'node:test'
import { TrustGovernanceController } from './trust-governance.controller'

test('trust-governance controller path metadata is set', () => {
  const path = Reflect.getMetadata('path', TrustGovernanceController)
  assert.equal(path, 'foundation/trust-governance')
})

// ── management-metadata ──
test('trust-governance controller management-metadata route has GET metadata', () => {
  const method = Reflect.getMetadata('method', TrustGovernanceController.prototype.getManagementMetadata)
  const path = Reflect.getMetadata('path', TrustGovernanceController.prototype.getManagementMetadata)
  assert.equal(method, 0)
  assert.equal(path, 'management-metadata')
})

test('trust-governance getManagementMetadata delegates to service', () => {
  const mockResult = { module: 'trust-governance', entrypoints: ['getManagementMetadata'] }
  const service = { getManagementMetadata: () => mockResult } as never
  const controller = new TrustGovernanceController(service)
  assert.deepStrictEqual(controller.getManagementMetadata(), mockResult)
})

// ── overview ──
test('trust-governance controller overview route has GET metadata', () => {
  const method = Reflect.getMetadata('method', TrustGovernanceController.prototype.getOperationsOverview)
  const path = Reflect.getMetadata('path', TrustGovernanceController.prototype.getOperationsOverview)
  assert.equal(method, 0)
  assert.equal(path, 'overview')
})

test('trust-governance getOperationsOverview delegates to service', async () => {
  const mock = { total: 100 }
  const service = { getOperationsOverview: () => Promise.resolve(mock) } as never
  const controller = new TrustGovernanceController(service)
  assert.deepStrictEqual(await controller.getOperationsOverview(), mock)
})

// ── approvals ──
test('trust-governance controller approvals route has GET metadata', () => {
  const method = Reflect.getMetadata('method', TrustGovernanceController.prototype.getApprovals)
  const path = Reflect.getMetadata('path', TrustGovernanceController.prototype.getApprovals)
  assert.equal(method, 0)
  assert.equal(path, 'approvals')
})

test('trust-governance getApprovals delegates to service', async () => {
  const mock = { items: [], total: 0 }
  const service = { listGovernanceApprovals: (_q: unknown) => Promise.resolve(mock) } as never
  const controller = new TrustGovernanceController(service)
  const query = { tenantId: 't1', page: 1 }
  assert.deepStrictEqual(await controller.getApprovals(query), mock)
})

// ── approvals/summary ──
test('trust-governance controller approvals/summary route has GET metadata', () => {
  const method = Reflect.getMetadata('method', TrustGovernanceController.prototype.getApprovalSummary)
  const path = Reflect.getMetadata('path', TrustGovernanceController.prototype.getApprovalSummary)
  assert.equal(method, 0)
  assert.equal(path, 'approvals/summary')
})

test('trust-governance getApprovalSummary delegates to service', async () => {
  const mock = { pending: 3, approved: 5 }
  const service = { summarizeGovernanceApprovals: (_q: unknown) => Promise.resolve(mock) } as never
  const controller = new TrustGovernanceController(service)
  assert.deepStrictEqual(await controller.getApprovalSummary({}), mock)
})

// ── approvals/:approvalTicket ──
test('trust-governance controller approvals/:approvalTicket route has GET metadata', () => {
  const method = Reflect.getMetadata('method', TrustGovernanceController.prototype.getApprovalDetail)
  const path = Reflect.getMetadata('path', TrustGovernanceController.prototype.getApprovalDetail)
  assert.equal(method, 0)
  assert.equal(path, 'approvals/:approvalTicket')
})

test('trust-governance getApprovalDetail delegates to service', async () => {
  const mock = { ticket: 'AP-1', status: 'PENDING' }
  const service = { getGovernanceApprovalDetail: (t: string) => Promise.resolve(mock) } as never
  const controller = new TrustGovernanceController(service)
  assert.deepStrictEqual(await controller.getApprovalDetail('AP-1'), mock)
})

// ── approvals/:approvalTicket/timeline ──
test('trust-governance controller approvals/:approvalTicket/timeline route has GET metadata', () => {
  const method = Reflect.getMetadata('method', TrustGovernanceController.prototype.getApprovalTimeline)
  const path = Reflect.getMetadata('path', TrustGovernanceController.prototype.getApprovalTimeline)
  assert.equal(method, 0)
  assert.equal(path, 'approvals/:approvalTicket/timeline')
})

test('trust-governance getApprovalTimeline delegates to service', async () => {
  const mock = [{ event: 'SUBMITTED', at: '2025-01-01' }]
  const service = {
    getGovernanceApprovalTimeline: (t: string, limit: number) => Promise.resolve(mock)
  } as never
  const controller = new TrustGovernanceController(service)
  const query = { page: 1, size: 10, limit: 5 }
  assert.deepStrictEqual(await controller.getApprovalTimeline('AP-1', query), mock)
})

// ── approvals/:approvalTicket/approve (POST) ──
test('trust-governance controller approve route has POST metadata', () => {
  const method = Reflect.getMetadata('method', TrustGovernanceController.prototype.approveApproval)
  const path = Reflect.getMetadata('path', TrustGovernanceController.prototype.approveApproval)
  assert.equal(method, 1)
  assert.equal(path, 'approvals/:approvalTicket/approve')
})

test('trust-governance approveApproval delegates to service', async () => {
  const mock = { ticket: 'AP-1', status: 'APPROVED' }
  const service = {
    approveGovernanceApproval: (t: string, b: unknown) => Promise.resolve(mock)
  } as never
  const controller = new TrustGovernanceController(service)
  const body = { comment: 'LGTM' }
  assert.deepStrictEqual(await controller.approveApproval('AP-1', body as any), mock)
})

// ── approvals/:approvalTicket/reject (POST) ──
test('trust-governance controller reject route has POST metadata', () => {
  const method = Reflect.getMetadata('method', TrustGovernanceController.prototype.rejectApproval)
  const path = Reflect.getMetadata('path', TrustGovernanceController.prototype.rejectApproval)
  assert.equal(method, 1)
  assert.equal(path, 'approvals/:approvalTicket/reject')
})

test('trust-governance rejectApproval delegates to service', async () => {
  const mock = { ticket: 'AP-1', status: 'REJECTED' }
  const service = {
    rejectGovernanceApproval: (t: string, b: unknown) => Promise.resolve(mock)
  } as never
  const controller = new TrustGovernanceController(service)
  assert.deepStrictEqual(await controller.rejectApproval('AP-1', { reason: 'Not now' } as any), mock)
})

// ── approvals/:approvalTicket/cancel (POST) ──
test('trust-governance controller cancel route has POST metadata', () => {
  const method = Reflect.getMetadata('method', TrustGovernanceController.prototype.cancelApproval)
  const path = Reflect.getMetadata('path', TrustGovernanceController.prototype.cancelApproval)
  assert.equal(method, 1)
  assert.equal(path, 'approvals/:approvalTicket/cancel')
})

test('trust-governance cancelApproval delegates to service', async () => {
  const mock = { ticket: 'AP-1', status: 'CANCELLED' }
  const service = {
    cancelGovernanceApproval: (t: string, b: unknown) => Promise.resolve(mock)
  } as never
  const controller = new TrustGovernanceController(service)
  assert.deepStrictEqual(await controller.cancelApproval('AP-1', { reason: 'Obsolete' } as any), mock)
})

// ── approvals/:approvalTicket/resubmit (POST) ──
test('trust-governance controller resubmit route has POST metadata', () => {
  const method = Reflect.getMetadata('method', TrustGovernanceController.prototype.resubmitApproval)
  const path = Reflect.getMetadata('path', TrustGovernanceController.prototype.resubmitApproval)
  assert.equal(method, 1)
  assert.equal(path, 'approvals/:approvalTicket/resubmit')
})

test('trust-governance resubmitApproval delegates to service', async () => {
  const mock = { ticket: 'AP-1', status: 'PENDING' }
  const service = {
    resubmitGovernanceApproval: (t: string, b: unknown) => Promise.resolve(mock)
  } as never
  const controller = new TrustGovernanceController(service)
  assert.deepStrictEqual(await controller.resubmitApproval('AP-1', { reason: 'Retry' } as any), mock)
})

// ── audit ──
test('trust-governance controller audit route has GET metadata', () => {
  const method = Reflect.getMetadata('method', TrustGovernanceController.prototype.getAudit)
  const path = Reflect.getMetadata('path', TrustGovernanceController.prototype.getAudit)
  assert.equal(method, 0)
  assert.equal(path, 'audit')
})

test('trust-governance getAudit delegates to service', async () => {
  const mock = { items: [], total: 0 }
  const service = { getAuditRecords: (q: unknown) => Promise.resolve(mock) } as never
  const controller = new TrustGovernanceController(service)
  assert.deepStrictEqual(await controller.getAudit({}), mock)
})

// ── audit/summary ──
test('trust-governance controller audit/summary route has GET metadata', () => {
  const method = Reflect.getMetadata('method', TrustGovernanceController.prototype.getAuditSummary)
  const path = Reflect.getMetadata('path', TrustGovernanceController.prototype.getAuditSummary)
  assert.equal(method, 0)
  assert.equal(path, 'audit/summary')
})

test('trust-governance getAuditSummary delegates to service', async () => {
  const mock = { total: 42 }
  const service = { summarizeAuditRecords: (q: unknown) => Promise.resolve(mock) } as never
  const controller = new TrustGovernanceController(service)
  assert.deepStrictEqual(await controller.getAuditSummary({}), mock)
})

// ── audit POST ──
test('trust-governance controller recordAudit route has POST metadata', () => {
  const method = Reflect.getMetadata('method', TrustGovernanceController.prototype.recordAudit)
  const path = Reflect.getMetadata('path', TrustGovernanceController.prototype.recordAudit)
  assert.equal(method, 1)
  assert.equal(path, 'audit')
})

test('trust-governance recordAudit delegates to service', async () => {
  const mock = { id: 'audit-1' }
  const service = {
    recordAudit: (ev: string, details: unknown, opts: unknown) => Promise.resolve(mock)
  } as never
  const controller = new TrustGovernanceController(service)
  const body = {
    eventType: 'LOGIN',
    details: { ip: '1.2.3.4' },
    tenantId: 't1',
    actorId: 'u1',
    source: 'web',
    riskLevel: 'LOW'
  }
  assert.deepStrictEqual(await controller.recordAudit(body as any), mock)
})

// ── rate-limit/check (POST) ──
test('trust-governance controller rate-limit/check route has POST metadata', () => {
  const method = Reflect.getMetadata('method', TrustGovernanceController.prototype.checkRateLimit)
  const path = Reflect.getMetadata('path', TrustGovernanceController.prototype.checkRateLimit)
  assert.equal(method, 1)
  assert.equal(path, 'rate-limit/check')
})

test('trust-governance checkRateLimit delegates to service', async () => {
  const mock = { allowed: true }
  const service = { evaluateRateLimit: (b: unknown) => Promise.resolve(mock) } as never
  const controller = new TrustGovernanceController(service)
  assert.deepStrictEqual(await controller.checkRateLimit({} as any), mock)
})

// ── rate-limit/policies GET ──
test('trust-governance controller rate-limit/policies route has GET metadata', () => {
  const method = Reflect.getMetadata('method', TrustGovernanceController.prototype.getRateLimitPolicies)
  const path = Reflect.getMetadata('path', TrustGovernanceController.prototype.getRateLimitPolicies)
  assert.equal(method, 0)
  assert.equal(path, 'rate-limit/policies')
})

test('trust-governance getRateLimitPolicies delegates to service', async () => {
  const mock = { items: [] }
  const service = { listRateLimitPolicies: (q: unknown) => Promise.resolve(mock) } as never
  const controller = new TrustGovernanceController(service)
  assert.deepStrictEqual(await controller.getRateLimitPolicies({}), mock)
})

// ── rate-limit/policies POST ──
test('trust-governance controller saveRateLimitPolicy route has POST metadata', () => {
  const method = Reflect.getMetadata('method', TrustGovernanceController.prototype.saveRateLimitPolicy)
  const path = Reflect.getMetadata('path', TrustGovernanceController.prototype.saveRateLimitPolicy)
  assert.equal(method, 1)
  assert.equal(path, 'rate-limit/policies')
})

test('trust-governance saveRateLimitPolicy delegates to service', async () => {
  const mock = { policyKey: 'rl-1' }
  const service = { upsertRateLimitPolicy: (b: unknown) => Promise.resolve(mock) } as never
  const controller = new TrustGovernanceController(service)
  assert.deepStrictEqual(await controller.saveRateLimitPolicy({} as any), mock)
})

// ── rate-limit/ledgers GET ──
test('trust-governance controller rate-limit/ledgers route has GET metadata', () => {
  const method = Reflect.getMetadata('method', TrustGovernanceController.prototype.getQuotaLedgers)
  const path = Reflect.getMetadata('path', TrustGovernanceController.prototype.getQuotaLedgers)
  assert.equal(method, 0)
  assert.equal(path, 'rate-limit/ledgers')
})

test('trust-governance getQuotaLedgers delegates to service', async () => {
  const mock = { items: [] }
  const service = { listQuotaLedgers: (q: unknown) => Promise.resolve(mock) } as never
  const controller = new TrustGovernanceController(service)
  assert.deepStrictEqual(await controller.getQuotaLedgers({}), mock)
})

// ── rate-limit/ledgers/reset POST ──
test('trust-governance controller rate-limit/ledgers/reset route has POST metadata', () => {
  const method = Reflect.getMetadata('method', TrustGovernanceController.prototype.resetQuotaLedgers)
  const path = Reflect.getMetadata('path', TrustGovernanceController.prototype.resetQuotaLedgers)
  assert.equal(method, 1)
  assert.equal(path, 'rate-limit/ledgers/reset')
})

test('trust-governance resetQuotaLedgers delegates to service', async () => {
  const mock = { reset: 3 }
  const service = { resetQuotaLedgers: (b: unknown) => Promise.resolve(mock) } as never
  const controller = new TrustGovernanceController(service)
  assert.deepStrictEqual(await controller.resetQuotaLedgers({}), mock)
})

// ── privacy/mask POST ──
test('trust-governance controller privacy/mask route has POST metadata', () => {
  const method = Reflect.getMetadata('method', TrustGovernanceController.prototype.maskPii)
  const path = Reflect.getMetadata('path', TrustGovernanceController.prototype.maskPii)
  assert.equal(method, 1)
  assert.equal(path, 'privacy/mask')
})

test('trust-governance maskPii delegates to service', () => {
  const mock = { masked: '***' }
  const service = { maskPii: (p: unknown) => mock } as never
  const controller = new TrustGovernanceController(service)
  assert.deepStrictEqual(controller.maskPii({ payload: { ssn: '123-45-6789' } }), mock)
})

// ── ai/review POST ──
test('trust-governance controller ai/review route has POST metadata', () => {
  const method = Reflect.getMetadata('method', TrustGovernanceController.prototype.reviewAi)
  const path = Reflect.getMetadata('path', TrustGovernanceController.prototype.reviewAi)
  assert.equal(method, 1)
  assert.equal(path, 'ai/review')
})

test('trust-governance reviewAi delegates to service', () => {
  const mock = { allowed: true, riskScore: 0 }
  const service = {
    reviewAiInvocation: (model: string, opts: unknown) => mock
  } as never
  const controller = new TrustGovernanceController(service)
  const body = {
    modelCode: 'gpt-4',
    tenantId: 't1',
    purpose: 'chat',
    prompt: 'hello',
    estimatedTokens: 100
  }
  assert.deepStrictEqual(controller.reviewAi(body), mock)
})
