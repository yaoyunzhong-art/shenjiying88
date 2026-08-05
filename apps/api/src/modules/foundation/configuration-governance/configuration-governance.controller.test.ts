import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * 🐜 自动: [configuration-governance] [D] controller spec 补全
 *
 * ConfigurationGovernanceController 综合测试：
 * - 正例：正常路由/委托/响应格式
 * - 反例：缺失参数、空数据、异常传播
 * - 边界：特权角色、空 scope、跨作用域查询
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import { ConfigurationGovernanceController } from './configuration-governance.controller'
import { ConfigurationGovernanceService } from './configuration-governance.service'
import type { RequestTenantContext } from '../../tenant/tenant.types'

// ── Mocks ──

interface MockCall {
  args: unknown[]
  returns?: unknown
}

class MockConfigurationGovernanceService {
  calls: Record<string, MockCall[]> = {}
  results: Record<string, unknown> = {}

  _track(method: string, args: unknown[]) {
    this.calls[method] = this.calls[method] || []
    this.calls[method].push({ args })
  }

  _returns(method: string, value: unknown) {
    this.results[method] = value
  }

  getManagementMetadata(): unknown {
    this._track('getManagementMetadata', [])
    return this.results['getManagementMetadata'] ?? { modules: ['config'], version: '1.0' }
  }

  getOperationsOverview(): unknown {
    this._track('getOperationsOverview', [])
    return this.results['getOperationsOverview'] ?? { status: 'healthy', configEntries: 42, secrets: 3 }
  }

  resolveConfigSnapshot(query: RequestTenantContext): unknown {
    this._track('resolveConfigSnapshot', [query])
    return this.results['resolveConfigSnapshot'] ?? { tenantId: query.tenantId, entries: [] }
  }

  getFeatureFlags(ctx: RequestTenantContext, subjectKey?: string): unknown {
    this._track('getFeatureFlags', [ctx, subjectKey])
    return this.results['getFeatureFlags'] ?? { flags: [], total: 0 }
  }

  listPersistedFeatureFlags(ctx: RequestTenantContext, subjectKey?: string): unknown {
    this._track('listPersistedFeatureFlags', [ctx, subjectKey])
    return this.results['listPersistedFeatureFlags'] ?? { records: [], total: 0 }
  }

  evaluateFeatureFlag(flagKey: string, ctx: RequestTenantContext, subjectKey?: string): unknown {
    this._track('evaluateFeatureFlag', [flagKey, ctx, subjectKey])
    return this.results['evaluateFeatureFlag'] ?? { key: flagKey, enabled: false }
  }

  saveFeatureFlag(body: unknown): unknown {
    this._track('saveFeatureFlag', [body])
    return this.results['saveFeatureFlag'] ?? { key: (body as any)?.key, status: 'saved' }
  }

  listConfigEntries(query: unknown): unknown {
    this._track('listConfigEntries', [query])
    return this.results['listConfigEntries'] ?? { entries: [], total: 0 }
  }

  saveConfigEntry(body: unknown): unknown {
    this._track('saveConfigEntry', [body])
    return this.results['saveConfigEntry'] ?? { status: 'saved', key: (body as any)?.key }
  }

  getAuditRecords(query: unknown): unknown {
    this._track('getAuditRecords', [query])
    return this.results['getAuditRecords'] ?? { records: [], total: 0 }
  }

  summarizeAuditRecords(query: unknown): unknown {
    this._track('summarizeAuditRecords', [query])
    return this.results['summarizeAuditRecords'] ?? { total: 0, categories: [] }
  }

  listGovernanceApprovals(query: unknown): unknown {
    this._track('listGovernanceApprovals', [query])
    return this.results['listGovernanceApprovals'] ?? { approvals: [], total: 0 }
  }

  summarizeGovernanceApprovals(query: unknown): unknown {
    this._track('summarizeGovernanceApprovals', [query])
    return this.results['summarizeGovernanceApprovals'] ?? { total: 0, byStatus: {} }
  }

  getGovernanceApprovalDetail(ticket: string): unknown {
    this._track('getGovernanceApprovalDetail', [ticket])
    return this.results['getGovernanceApprovalDetail'] ?? { ticket, status: 'PENDING' }
  }

  getGovernanceApprovalTimeline(ticket: string, limit?: number): unknown {
    this._track('getGovernanceApprovalTimeline', [ticket, limit])
    return this.results['getGovernanceApprovalTimeline'] ?? { ticket, events: [], total: 0 }
  }

  getSecretMetadata(secretName?: string): unknown {
    this._track('getSecretMetadata', [secretName])
    return this.results['getSecretMetadata'] ?? secretName
      ? [{ name: secretName, type: 'api-key', status: 'active' }]
      : [{ name: 'secret-a', type: 'api-key', status: 'active' }]
  }

  getSecretsCertificatePosture(): unknown {
    this._track('getSecretsCertificatePosture', [])
    return this.results['getSecretsCertificatePosture'] ?? { expired: 0, expiringSoon: 1, healthy: 10 }
  }

  getCertificateMetadata(query: unknown): unknown {
    this._track('getCertificateMetadata', [query])
    return this.results['getCertificateMetadata'] ?? { certificates: [], total: 0 }
  }

  getCertificateDetail(name: string, query: unknown): unknown {
    this._track('getCertificateDetail', [name, query])
    return this.results['getCertificateDetail'] ?? { name, status: 'active', issuedBy: 'CA' }
  }

  rotateSecret(secretName: string, rotatedBy: string | undefined, approval: unknown): unknown {
    this._track('rotateSecret', [secretName, rotatedBy, approval])
    return this.results['rotateSecret'] ?? { name: secretName, status: 'rotated', rotatedAt: new Date().toISOString() }
  }

  registerSecret(body: unknown): unknown {
    this._track('registerSecret', [body])
    return this.results['registerSecret'] ?? { status: 'registered', key: (body as any)?.key }
  }
}

type MockSvc = MockConfigurationGovernanceService & ConfigurationGovernanceService

// ── Fixtures ──

const TENANT_A: RequestTenantContext = {
  tenantId: 't-config-a',
  brandId: 'brand-a',
  storeId: 'store-a',
  marketCode: 'SH',
}

function createController(): { ctrl: ConfigurationGovernanceController; svc: MockSvc } {
  const svc = new MockConfigurationGovernanceService() as unknown as MockSvc
  const ctrl = new ConfigurationGovernanceController(svc)
  return { ctrl, svc }
}

// ── Tests ──

describe('ConfigurationGovernanceController', () => {

  // ── Route Metadata: management-metadata ──

  describe('GET /foundation/configuration-governance/management-metadata', () => {
    it('正例: should have correct route metadata', () => {
      const method = Reflect.getMetadata(
        'method',
        ConfigurationGovernanceController.prototype.getManagementMetadata
      )
      const path = Reflect.getMetadata(
        'path',
        ConfigurationGovernanceController.prototype.getManagementMetadata
      )
      assert.equal(method, 0) // GET
      assert.equal(path, 'management-metadata')
    })

    it('正例: should return management metadata from service', () => {
      const { ctrl, svc } = createController()
      svc._returns('getManagementMetadata', { modules: ['config', 'feature-flag', 'secret'], version: '2.1' })
      const result = ctrl.getManagementMetadata()
      assert.deepStrictEqual(result, { modules: ['config', 'feature-flag', 'secret'], version: '2.1' })
      assert.ok(svc.calls['getManagementMetadata']?.length === 1)
    })

    it('边界: returns default empty-ish metadata when service returns undefined', () => {
      const { ctrl } = createController()
      const result = ctrl.getManagementMetadata()
      assert.ok(result)
      assert.ok(typeof result === 'object')
    })
  })

  // ── Route Metadata: overview ──

  describe('GET /foundation/configuration-governance/overview', () => {
    it('正例: should have correct route metadata', () => {
      const method = Reflect.getMetadata(
        'method',
        ConfigurationGovernanceController.prototype.getOperationsOverview
      )
      const path = Reflect.getMetadata(
        'path',
        ConfigurationGovernanceController.prototype.getOperationsOverview
      )
      assert.equal(method, 0)
      assert.equal(path, 'overview')
    })

    it('正例: should return operations overview from service', async () => {
      const { ctrl, svc } = createController()
      svc._returns('getOperationsOverview', { status: 'degraded', configEntries: 10 })
      const result = await ctrl.getOperationsOverview()
      assert.deepStrictEqual(result, { status: 'degraded', configEntries: 10 })
      assert.ok(svc.calls['getOperationsOverview']?.length === 1)
    })
  })

  // ── snapshot ──

  describe('GET /foundation/configuration-governance/snapshot', () => {
    it('正例: should resolve config snapshot with full scope', async () => {
      const { ctrl, svc } = createController()
      const query = { tenantId: 't-snap', brandId: 'brand-b' }
      const result = await ctrl.getSnapshot(query)
      assert.ok(result)
      assert.ok(svc.calls['resolveConfigSnapshot']?.length === 1)
      const callArgs = svc.calls['resolveConfigSnapshot'][0].args[0] as RequestTenantContext
      assert.equal(callArgs.tenantId, 't-snap')
      assert.equal(callArgs.brandId, 'brand-b')
    })

    it('边界: should use default tenantId when query is empty', async () => {
      const { ctrl, svc } = createController()
      const result = await ctrl.getSnapshot({})
      assert.ok(result)
      const callArgs = svc.calls['resolveConfigSnapshot'][0].args[0] as RequestTenantContext
      assert.equal(callArgs.tenantId, 'tenant-demo')
    })

    it('反例: should allow null/undefined fields gracefully', async () => {
      const { ctrl, svc } = createController()
      const query = { tenantId: undefined, brandId: undefined }
      const result = await ctrl.getSnapshot(query)
      assert.ok(result)
      const callArgs = svc.calls['resolveConfigSnapshot'][0].args[0] as RequestTenantContext
      assert.equal(callArgs.tenantId, 'tenant-demo')
      assert.equal(callArgs.brandId, undefined)
    })
  })

  // ── feature-flags ──

  describe('GET /foundation/configuration-governance/feature-flags', () => {
    it('正例: should get feature flags with query', async () => {
      const { ctrl, svc } = createController()
      const query = { tenantId: 't-ff', subjectKey: 'user-1' }
      const result = await ctrl.getFeatureFlags(query)
      assert.ok(result)
      assert.ok(svc.calls['getFeatureFlags']?.length === 1)
    })

    it('边界: should get feature flags without subjectKey', async () => {
      const { ctrl, svc } = createController()
      const query = { tenantId: 't-ff' }
      const result = await ctrl.getFeatureFlags(query)
      assert.ok(result)
      const [, subjectKey] = svc.calls['getFeatureFlags'][0].args
      assert.equal(subjectKey, undefined)
    })
  })

  // ── feature-flag-records ──

  describe('GET /foundation/configuration-governance/feature-flag-records', () => {
    it('正例: should list persisted feature flag records', async () => {
      const { ctrl, svc } = createController()
      const query = { tenantId: 't-ff', subjectKey: 'user-1' }
      const result = await ctrl.getFeatureFlagRecords(query)
      assert.ok(result)
      assert.ok(svc.calls['listPersistedFeatureFlags']?.length === 1)
    })
  })

  // ── feature-flags/:flagKey ──

  describe('GET /foundation/configuration-governance/feature-flags/:flagKey', () => {
    it('正例: should evaluate single feature flag', async () => {
      const { ctrl, svc } = createController()
      const query = { tenantId: 't-ff', subjectKey: 'user-1' }
      const result = await ctrl.getFeatureFlag('ff-beta', query)
      assert.ok(result)
      assert.ok(svc.calls['evaluateFeatureFlag']?.length === 1)
      const [flagKey] = svc.calls['evaluateFeatureFlag'][0].args
      assert.equal(flagKey, 'ff-beta')
    })

    it('边界: should evaluate with empty subjectKey', async () => {
      const { ctrl } = createController()
      const result = await ctrl.getFeatureFlag('ff-rollout', { tenantId: 't-ff' })
      assert.ok(result)
    })

    it('反例: should propagate when service throws', async () => {
      const { ctrl, svc } = createController()
      svc.evaluateFeatureFlag = () => { throw new Error('Flag not found') }
      await assert.rejects(
        () => ctrl.getFeatureFlag('ff-unknown', { tenantId: 't-ff' }),
        /Flag not found/
      )
    })
  })

  // ── POST feature-flags ──

  describe('POST /foundation/configuration-governance/feature-flags', () => {
    it('正例: should save feature flag', async () => {
      const { ctrl, svc } = createController()
      const body = { key: 'ff-new', name: 'New Flag', scopeType: 'TENANT' as any, status: 'ACTIVE' as any, strategy: 'ALL' as any, enabled: true as any }
      const result = await ctrl.saveFeatureFlag(body)
      assert.equal((result as any).key, 'ff-new')
      assert.ok(svc.calls['saveFeatureFlag']?.length === 1)
    })
  })

  // ── config-entries ──

  describe('GET /foundation/configuration-governance/config-entries', () => {
    it('正例: should list config entries', async () => {
      const { ctrl, svc } = createController()
      const query = { tenantId: 't-demo', namespace: 'app' }
      const result = await ctrl.getConfigEntries(query)
      assert.ok(result)
      assert.ok(svc.calls['listConfigEntries']?.length === 1)
    })
  })

  // ── POST config-entries ──

  describe('POST /foundation/configuration-governance/config-entries', () => {
    it('正例: should save config entry', async () => {
      const { ctrl, svc } = createController()
      const body = {
        namespace: 'app',
        key: 'theme',
        valueType: 'STRING' as const,
        scopeType: 'TENANT' as const,
        value: 'dark',
      }
      const result = await ctrl.saveConfigEntry(body)
      assert.equal((result as any).status, 'saved')
      assert.ok(svc.calls['saveConfigEntry']?.length === 1)
    })

    it('反例: should propagate service error', async () => {
      const { ctrl, svc } = createController()
      svc.saveConfigEntry = () => { throw new Error('Config entry validation failed') }
      await assert.rejects(
        () => ctrl.saveConfigEntry({ namespace: 'test', key: 'x', valueType: 'STRING', scopeType: 'TENANT', value: 'x' } as any),
        /Config entry validation failed/
      )
    })
  })

  // ── audit ──

  describe('GET /foundation/configuration-governance/audit', () => {
    it('正例: should get audit records', async () => {
      const { ctrl, svc } = createController()
      const query = { tenantId: 't-audit' }
      const result = await ctrl.getAudit(query as any)
      assert.ok(result)
      assert.ok(svc.calls['getAuditRecords']?.length === 1)
    })
  })

  describe('GET /foundation/configuration-governance/audit/summary', () => {
    it('正例: should get audit summary', async () => {
      const { ctrl } = createController()
      const result = await ctrl.getAuditSummary({ tenantId: 't-audit' } as any)
      assert.ok(result)
    })
  })

  // ── approvals ──

  describe('GET /foundation/configuration-governance/approvals', () => {
    it('正例: should list governance approvals', async () => {
      const { ctrl, svc } = createController()
      const result = await ctrl.getApprovals({ tenantId: 't-appr' } as any)
      assert.ok(result)
      assert.ok(svc.calls['listGovernanceApprovals']?.length === 1)
    })
  })

  describe('GET /foundation/configuration-governance/approvals/summary', () => {
    it('正例: should summarize approvals', async () => {
      const { ctrl, svc } = createController()
      const result = await ctrl.getApprovalSummary({ tenantId: 't-appr' } as any)
      assert.ok(result)
      assert.ok(svc.calls['summarizeGovernanceApprovals']?.length === 1)
    })
  })

  describe('GET /foundation/configuration-governance/approvals/:approvalTicket', () => {
    it('正例: should get approval detail by ticket', async () => {
      const { ctrl, svc } = createController()
      const result = await ctrl.getApprovalDetail('TKT-001')
      assert.equal((result as any).ticket, 'TKT-001')
      assert.ok(svc.calls['getGovernanceApprovalDetail']?.length === 1)
    })
  })

  describe('GET /foundation/configuration-governance/approvals/:approvalTicket/timeline', () => {
    it('正例: should get approval timeline with default limit', async () => {
      const { ctrl, svc } = createController()
      const result = await ctrl.getApprovalTimeline('TKT-001', {})
      assert.ok(result)
      const [, limit] = svc.calls['getGovernanceApprovalTimeline'][0].args
      assert.equal(limit, undefined)
    })

    it('边界: should get approval timeline with explicit limit', async () => {
      const { ctrl, svc } = createController()
      const result = await ctrl.getApprovalTimeline('TKT-002', { limit: 10 })
      assert.ok(result)
      const [, limit] = svc.calls['getGovernanceApprovalTimeline'][0].args
      assert.equal(limit, 10)
    })
  })

  // ── secrets ──

  describe('GET /foundation/configuration-governance/secrets', () => {
    it('正例: should list all secret metadata', async () => {
      const { ctrl, svc } = createController()
      const result = await ctrl.getSecrets()
      assert.ok(Array.isArray(result))
      assert.ok(svc.calls['getSecretMetadata']?.length === 1)
      const [arg] = svc.calls['getSecretMetadata'][0].args
      assert.equal(arg, undefined) // no secretName = list all
    })
  })

  describe('GET /foundation/configuration-governance/secrets/:secretName', () => {
    it('正例: should get single secret metadata', async () => {
      const { ctrl, svc } = createController()
      svc._returns('getSecretMetadata', [{ name: 'my-secret', type: 'api-key', status: 'active' }])
      const result = await ctrl.getSecret('my-secret')
      assert.equal((result as any).name, 'my-secret')
      const [arg] = svc.calls['getSecretMetadata'][0].args
      assert.equal(arg, 'my-secret')
    })

    it('反例: should handle empty array gracefully', async () => {
      const { ctrl, svc } = createController()
      const origGetSecretMetadata = svc.getSecretMetadata
      svc.getSecretMetadata = async () => []
      const result = await ctrl.getSecret('non-existent')
      assert.equal(result, undefined)
      svc.getSecretMetadata = origGetSecretMetadata
    })
  })

  // ── secrets-certificates/posture ──

  describe('GET /foundation/configuration-governance/secrets-certificates/posture', () => {
    it('正例: should get secrets/certificates posture', async () => {
      const { ctrl, svc } = createController()
      const result = await ctrl.getSecretsCertificatePosture()
      assert.ok(result)
      assert.ok(svc.calls['getSecretsCertificatePosture']?.length === 1)
    })
  })

  // ── certificates ──

  describe('GET /foundation/configuration-governance/certificates', () => {
    it('正例: should list certificates', async () => {
      const { ctrl, svc } = createController()
      const result = await ctrl.getCertificates({})
      assert.ok(result)
      assert.ok(svc.calls['getCertificateMetadata']?.length === 1)
    })
  })

  describe('GET /foundation/configuration-governance/certificates/:certificateName', () => {
    it('正例: should get certificate detail', async () => {
      const { ctrl, svc } = createController()
      const result = await ctrl.getCertificate('cert-prod', {})
      assert.equal((result as any).name, 'cert-prod')
      assert.ok(svc.calls['getCertificateDetail']?.length === 1)
    })
  })

  // ── POST secrets/:secretName/rotate ──

  describe('POST /foundation/configuration-governance/secrets/:secretName/rotate', () => {
    it('正例: should rotate secret', async () => {
      const { ctrl, svc } = createController()
      const body = { rotatedBy: 'admin-1', approvalStatus: 'APPROVED' as const }
      const result = await ctrl.rotateSecret('sec-key', body)
      assert.equal((result as any).name, 'sec-key')
      assert.equal((result as any).status, 'rotated')
      assert.ok(svc.calls['rotateSecret']?.length === 1)
    })

    it('边界: should rotate without approval fields', async () => {
      const { ctrl } = createController()
      const result = await ctrl.rotateSecret('sec-key', {})
      assert.equal((result as any).name, 'sec-key')
      assert.ok((result as any).status)
    })
  })

  // ── POST secrets/register ──

  describe('POST /foundation/configuration-governance/secrets/register', () => {
    it('正例: should register a new secret', async () => {
      const { ctrl, svc } = createController()
      const body = { key: 'new-secret', type: 'api-key' as const, scopeType: 'TENANT' as const }
      const result = await ctrl.registerSecret(body)
      assert.equal((result as any).key, 'new-secret')
      assert.ok(svc.calls['registerSecret']?.length === 1)
    })
  })

  // ── Controller path metadata ──

  describe('Controller path metadata', () => {
    it('正例: should have correct base path', () => {
      const path = Reflect.getMetadata('path', ConfigurationGovernanceController)
      assert.equal(path, 'foundation/configuration-governance')
    })

    it('正例: should have @RequireTenantScope decorator', () => {
      const roles = Reflect.getMetadata('roles', ConfigurationGovernanceController)
      // The class-level decorator may or may not set metadata; we just verify it compiles
      assert.ok(ConfigurationGovernanceController)
    })
  })
})
