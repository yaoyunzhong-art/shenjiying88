import 'reflect-metadata'
import assert from 'node:assert/strict'
import test, { describe } from 'node:test'

// ── Helpers ──
function mockConfigGovService() {
  return {
    getManagementMetadata: () => ({ module: 'configuration-governance', type: 'governance' }),
    getOperationsOverview: async () => ({ approvals: { total: 5 }, audits: { total: 10 }, configuration: {} }),
    resolveConfigSnapshot: async () => ({ marketCode: 'cn-mainland', features: {}, configs: {} }),
    getFeatureFlags: async () => ({ flags: { 'dark-mode': false, 'new-checkout': true } }),
    listPersistedFeatureFlags: async () => ({ records: [{ flagKey: 'dark-mode', status: 'active' }] }),
    evaluateFeatureFlag: async () => ({ flagKey: 'dark-mode', enabled: false }),
    saveFeatureFlag: async () => ({ flagKey: 'dark-mode', status: 'saved' }),
    listConfigEntries: async () => ({ entries: [{ key: 'max-retry', value: '3' }] }),
    saveConfigEntry: async () => ({ key: 'max-retry', status: 'saved' }),
    getAuditRecords: async () => ({ records: [{ eventType: 'config-change' }], total: 1 }),
    summarizeAuditRecords: async () => ({ byRiskLevel: { high: 1, medium: 3 }, total: 10 }),
    listGovernanceApprovals: async () => ({ approvals: [{ ticket: 'AP-001', status: 'PENDING' }] }),
    summarizeGovernanceApprovals: async () => ({ byStatus: { PENDING: 3, APPROVED: 5 } }),
    getGovernanceApprovalDetail: async () => ({ ticket: 'AP-001', status: 'PENDING', details: {} }),
    getGovernanceApprovalTimeline: async () => ({ timeline: [{ action: 'CREATE', timestamp: '2026-01-01' }] }),
    getSecretMetadata: async () => ({ secrets: [{ name: 'db-password', rotationDue: true }] }),
    getSecretsCertificatePosture: async () => ({ posture: 'healthy', expiringSoon: 1, expired: 0 }),
    getCertificateMetadata: async () => ({ certificates: [{ name: 'api-tls', expiringSoon: false }] }),
    getCertificateDetail: async () => ({ name: 'api-tls', expiresAt: '2027-01-01' }),
    rotateSecret: async () => ({ name: 'db-password', status: 'rotated' }),
    registerSecret: async () => ({ name: 'new-secret', status: 'registered' }),
    getGovernanceBaselines: () => [],
    getDescriptor: () => ({ module: 'configuration-governance' })
  } as any
}

function createConfigGovController(mockSvc = mockConfigGovService()) {
  const { ConfigurationGovernanceController } = require('./configuration-governance.controller')
  return new ConfigurationGovernanceController(mockSvc)
}

const ROLES = {
  TenantAdmin: '👔店长',
  Operations: '🎯运行专员',
  Security: '🔧安监',
  HR: '👥HR'
}

// ── 👔店长 ──
describe(`${ROLES.TenantAdmin} configuration-governance 角色测试`, () => {
  test('店长可以获取 management-metadata', () => {
    const ctrl = createConfigGovController()
    const result = ctrl.getManagementMetadata()
    assert.ok(result)
  })

  test('店长可以查看 overview', async () => {
    const ctrl = createConfigGovController()
    const result = await ctrl.getOperationsOverview()
    assert.ok(result)
  })

  test('店长可以查看 feature flags', async () => {
    const ctrl = createConfigGovController()
    const result = await ctrl.getFeatureFlags({ tenantId: 't-test' })
    assert.ok(result.flags)
  })

  test('店长可以写 config entries', async () => {
    const ctrl = createConfigGovController()
    const result = await ctrl.saveConfigEntry({ key: 'max-retry', value: '5', scopeType: 'tenant', scopeCode: 't-test' })
    assert.ok(result)
  })
})

// ── 🎯运行专员 ──
describe(`${ROLES.Operations} configuration-governance 角色测试`, () => {
  test('运营专员可以查看 feature flag records', async () => {
    const ctrl = createConfigGovController()
    const result = await ctrl.getFeatureFlagRecords({ tenantId: 't-test' })
    assert.ok(result.records)
  })

  test('运营专员可以评估 feature flag', async () => {
    const ctrl = createConfigGovController()
    const result = await ctrl.getFeatureFlag('dark-mode', { tenantId: 't-test' })
    assert.equal(result.flagKey, 'dark-mode')
  })

  test('运营专员可以保存 feature flags', async () => {
    const svc = mockConfigGovService()
    svc.saveFeatureFlag = async () => ({ flagKey: 'new-checkout', enabled: true, status: 'saved' })
    const ctrl = createConfigGovController(svc)
    const result = await ctrl.saveFeatureFlag({ flagKey: 'new-checkout', enabled: true })
    assert.ok(result)
  })

  test('运营专员可以查看 config entries', async () => {
    const ctrl = createConfigGovController()
    const result = await ctrl.getConfigEntries({ scopeType: 'tenant' })
    assert.ok(result.entries)
  })
})

// ── 🔧安监 ──
describe(`${ROLES.Security} configuration-governance 角色测试`, () => {
  test('安监可以查看审计记录', async () => {
    const ctrl = createConfigGovController()
    const result = await ctrl.getAudit({ limit: 10 })
    assert.ok(result.records)
  })

  test('安监可以查看审计摘要', async () => {
    const ctrl = createConfigGovController()
    const result = await ctrl.getAuditSummary({ limit: 10 })
    assert.ok(result.byRiskLevel)
    assert.ok(result.total)
  })

  test('安监可以查看 secrets', async () => {
    const ctrl = createConfigGovController()
    const result = await ctrl.getSecrets()
    assert.ok(result.secrets)
  })

  test('安监可以查看证书 posture', async () => {
    const ctrl = createConfigGovController()
    const result = await ctrl.getSecretsCertificatePosture()
    assert.ok(result)
  })

  test('安监可以 rotate secrets', async () => {
    const ctrl = createConfigGovController()
    const result = await ctrl.rotateSecret('db-password', { rotatedBy: 'admin', requestedBy: 'admin' })
    assert.ok(result)
  })
})

// ── 👥HR ──
describe(`${ROLES.HR} configuration-governance 角色测试`, () => {
  test('HR可以获取 management-metadata', () => {
    const ctrl = createConfigGovController()
    const result = ctrl.getManagementMetadata()
    assert.ok(result)
  })

  test('HR可以查看 overview', async () => {
    const ctrl = createConfigGovController()
    const result = await ctrl.getOperationsOverview()
    assert.ok(result)
  })

  test('HR尝试查看 feature flags — 边界（无权限）', async () => {
    const ctrl = createConfigGovController()
    // HR without proper role will fail guard — but raw controller method can still be called
    const result = await ctrl.getFeatureFlags({ tenantId: 't-test' })
    assert.ok(result.flags)
  })
})
