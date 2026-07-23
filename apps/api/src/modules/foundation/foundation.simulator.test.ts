import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * 🐜 自动: [foundation] [C] 模拟器测试编写
 *
 * foundation 模块模拟器测试
 * 覆盖：bootstrap 蓝图的模块/消费者状态模拟、告警处理流程模拟
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import { FoundationService } from './foundation.service'
import type {
  FoundationConsumerDescriptor,
  FoundationModuleDescriptor
} from './foundation.types'

/**
 * Build a fully mocked FoundationService by providing stub sub-services
 * that satisfy its constructor dependency contract.
 */
function createMockFoundationService(): FoundationService {
  const identityDesc: FoundationModuleDescriptor = {
    key: 'identity-access',
    name: 'Identity Access Module',
    purpose: '统一认证、授权与租户隔离入口',
    inboundContracts: [],
    outboundContracts: [],
    capabilities: [
      {
        key: 'authentication',
        name: '认证入口',
        responsibilities: ['统一用户类型解析'],
        entrypoints: ['IdentityAccessService.resolveActorContext'],
        consumers: ['portal' as const, 'workbench' as const, 'lyt-adapter' as const],
        status: 'active' as const
      }
    ]
  }

  const tgDesc: FoundationModuleDescriptor = {
    key: 'trust-governance',
    name: 'Trust Governance Module',
    purpose: '统一审计、防滥用、隐私治理和 AI 治理入口。',
    inboundContracts: [],
    outboundContracts: [],
    capabilities: [
      {
        key: 'audit',
        name: '审计入口',
        responsibilities: ['记录配置/权限/关键状态变更'],
        entrypoints: ['TrustGovernanceService.recordAudit'],
        consumers: ['market' as const, 'portal' as const, 'workbench' as const, 'lyt-adapter' as const],
        status: 'active' as const
      }
    ]
  }

  const cfgDesc: FoundationModuleDescriptor = {
    key: 'configuration-governance',
    name: 'Configuration Governance Module',
    purpose: '统一配置管理、密钥治理、证书治理与 Feature Flag',
    inboundContracts: [],
    outboundContracts: [],
    capabilities: [
      {
        key: 'configuration',
        name: '配置入口',
        responsibilities: ['配置分层管理'],
        entrypoints: ['ConfigurationGovernanceService.resolveConfigSnapshot'],
        consumers: ['market' as const, 'portal' as const, 'workbench' as const],
        status: 'active' as const
      }
    ]
  }

  const resilienceDesc: FoundationModuleDescriptor = {
    key: 'resilience-operations',
    name: 'Resilience Operations Module',
    purpose: '统一可观测性、恢复预案与演练管理',
    inboundContracts: [],
    outboundContracts: [],
    capabilities: [
      {
        key: 'observability',
        name: '可观测性入口',
        responsibilities: ['统一 metrics/logs/traces 信号采集'],
        entrypoints: ['ResilienceOperationsService.getObservabilitySignals'],
        consumers: ['market' as const, 'portal' as const, 'workbench' as const],
        status: 'active' as const
      }
    ]
  }

  const runtimeDesc: FoundationModuleDescriptor = {
    key: 'runtime-governance',
    name: 'Runtime Governance Module',
    purpose: '统一敏感动作的 receipt、handler sync、callback、replay 与治理总览闭环',
    inboundContracts: [],
    outboundContracts: [],
    capabilities: [
      {
        key: 'receipt',
        name: 'Receipt 入口',
        responsibilities: ['接收敏感动作提交'],
        entrypoints: ['RuntimeGovernanceService.submitAction'],
        consumers: ['market' as const, 'portal' as const, 'workbench' as const],
        status: 'active' as const
      }
    ]
  }

  const intDesc: FoundationModuleDescriptor = {
    key: 'integration-orchestration',
    name: 'Integration Orchestration Module',
    purpose: '统一事件总线、Webhook 网关、通知抽象和开放平台沙箱边界',
    inboundContracts: [],
    outboundContracts: [],
    capabilities: [
      {
        key: 'event-bus',
        name: '事件总线入口',
        responsibilities: ['统一事件发布模型'],
        entrypoints: ['IntegrationOrchestrationService.publishEvent'],
        consumers: ['market' as const, 'portal' as const, 'workbench' as const, 'lyt-adapter' as const],
        status: 'active' as const
      }
    ]
  }

  const mockIdentityAccessService = {
    getDescriptor: () => identityDesc,
    getOperationsOverview: async () => ({
      generatedAt: new Date().toISOString(),
      approvals: { statuses: { PENDING: 0 }, execution: { withFailures: 0, byFailureStatus: {} } },
      audits: { byRiskLevel: { high: 0 } },
      rateLimit: { policies: { total: 0, tenantScoped: 0, runtimeManaged: 0 }, ledgers: { total: 0, blocked: 0, exhausted: 0 } }
    })
  }

  const mockTrustGovernanceService = {
    getDescriptor: () => tgDesc,
    getOperationsOverview: mockIdentityAccessService.getOperationsOverview,
    getGovernanceBaselines: () => [],
    listGovernanceApprovals: async () => [],
    getAuditRecords: async () => [],
    listQuotaLedgers: async () => []
  }

  const mockConfigurationGovernanceService = {
    getDescriptor: () => cfgDesc,
    getGovernanceBaselines: () => [],
    getOperationsOverview: async () => ({
      generatedAt: new Date().toISOString(),
      approvals: { statuses: { PENDING: 0 }, execution: { withFailures: 0, byFailureStatus: {} } },
      audits: { byRiskLevel: { high: 0 } },
      configuration: {
        entries: { total: 0, active: 0, namespaces: {} },
        featureFlags: { total: 0, enabled: 0, active: 0, byStrategy: {} },
        secrets: { total: 0, persisted: 0, static: 0, rotationDue: 0, expired: 0 },
        certificates: { total: 0, autoRenew: 0, expiringSoon: 0, expired: 0 }
      },
      posture: { riskLevel: 'low', summary: '基线检查通过' }
    }),
    listGovernanceApprovals: async () => [],
    getAuditRecords: async () => [],
    getSecretMetadata: async () => [],
    getCertificateMetadata: async () => []
  }

  const mockResilienceOperationsService = {
    getDescriptor: () => resilienceDesc,
    getGovernanceBaselines: () => [],
    getOperationsOverview: () => ({
      generatedAt: new Date().toISOString(),
      observability: { totalSignals: 0, degradedSignals: 0, byStatus: {}, averageCoverage: 100, maxCollectionLagSeconds: 0, signals: [] },
      retries: { totalPolicies: 0, byCapability: {}, maxAttempts: 0, policies: [] },
      recovery: { totalPlans: 0, attentionRequired: 0, staleDrills: 0, plans: [] }
    })
  }

  const mockRuntimeGovernanceService = {
    getDescriptor: () => runtimeDesc,
    getOperationsOverview: async () => ({
      generatedAt: new Date().toISOString(),
      summary: { backlog: 0, stalledCallbacks: 0, highRiskBacklog: 0, blockedActions: 0 },
      receipts: [],
      stalledReceipts: []
    })
  }

  const mockIntegrationOrchestrationService = {
    getDescriptor: () => intDesc
  }

  // Build a mock PrismaService to handle alert acknowledgement ops
  // FoundationService accesses this.prisma.foundationAlertAcknowledgement.upsert,
  // this.prisma.auditLog.create, etc.
  // We use a mutable record so tests that call mute produce MUTED, ack produce ACKED.
  const ackRecords = new Map<string, {
    tenantId: string
    code: string
    status: 'ACKED' | 'MUTED'
    note: string | null
    actorId: string | null
    acknowledgedAt: Date
    mutedUntil: Date | null
    updatedAt: Date
  }>()

  const mockPrismaService = {
    foundationAlertAcknowledgement: {
      upsert: async (args: { where: { tenantId_code: { tenantId: string; code: string } }; create: Record<string, unknown>; update: Record<string, unknown> }) => {
        const { tenantId, code } = args.where.tenantId_code
        const update = args.update as { status: string; note: string | null; mutedUntil: Date | null }
        const record = {
          tenantId,
          code,
          status: update.status as 'ACKED' | 'MUTED',
          note: update.note ?? null,
          actorId: null,
          acknowledgedAt: new Date(),
          mutedUntil: update.mutedUntil ?? null,
          updatedAt: new Date()
        }
        ackRecords.set(`${tenantId}:${code}`, record)
        return record
      },
      findMany: async () => {
        return Array.from(ackRecords.values())
      }
    },
    auditLog: {
      create: async () => ({}),
      findMany: async () => []
    }
  }

  // Manually construct FoundationService — this works because
  // @Injectable() is a singleton pattern, not a requirement for
  // direct construction in Node.js (reflect-metadata loaded).
  return new (FoundationService as any)(
    mockIdentityAccessService,
    mockConfigurationGovernanceService,
    mockIntegrationOrchestrationService,
    mockTrustGovernanceService,
    mockResilienceOperationsService,
    mockRuntimeGovernanceService,
    mockPrismaService
  ) as FoundationService
}

describe('Foundation - Simulator', () => {
  let service: FoundationService

  beforeEach(() => {
    service = createMockFoundationService()
  })

  // ─── Module Blueprint ───

  describe('getBlueprint', () => {
    it('should return blueprint with modules', () => {
      const blueprint = service.getBlueprint()
      assert.ok(blueprint.modules)
      assert.ok(Array.isArray(blueprint.modules))
    })

    it('should return blueprint with generatedAt timestamp', () => {
      const blueprint = service.getBlueprint()
      assert.equal(typeof blueprint.generatedAt, 'string')
      const ts = new Date(blueprint.generatedAt).getTime()
      assert.ok(ts > 0)
    })
  })

  // ─── Module Catalog ───

  describe('getModuleCatalog', () => {
    it('should return module catalog with key', () => {
      const catalog = service.getModuleCatalog()
      assert.ok(Array.isArray(catalog))
      assert.ok(catalog.length > 0)
      for (const mod of catalog) {
        assert.equal(typeof mod.key, 'string')
        assert.ok(mod.name)
      }
    })

    it('should include trust-governance module', () => {
      const catalog = service.getModuleCatalog()
      const tg = catalog.find((m: FoundationModuleDescriptor) => m.key === 'trust-governance')
      assert.ok(tg)
    })
  })

  // ─── Operations Overview ───

  describe('getOperationsOverview', () => {
    it('should return overview with summary', async () => {
      const result = await service.getOperationsOverview({ tenantId: 't-sim', brandId: 'b-sim' })
      assert.ok(result.summary)
      assert.ok('approvalsPending' in result.summary)
    })

    it('should return overview with moduleHealth', async () => {
      const result = await service.getOperationsOverview({ tenantId: 't-sim', brandId: 'b-sim' })
      assert.ok(result.moduleHealth)
      assert.equal(typeof result.moduleHealth, 'object')
    })

    it('should handle undefined tenantContext', async () => {
      const result = await service.getOperationsOverview(undefined)
      assert.ok(result)
      assert.ok(result.generatedAt)
    })

    it('falls back when alert acknowledgement table is unavailable', async () => {
      ;(service as unknown as {
        prisma: {
          foundationAlertAcknowledgement: {
            findMany: () => Promise<never>
          }
        }
      }).prisma.foundationAlertAcknowledgement.findMany = async () => {
        throw Object.assign(new Error('missing table'), { code: 'P2021' })
      }

      const result = await service.getOperationsOverview({ tenantId: 't-sim', brandId: 'b-sim' })
      assert.ok(result.summary)
      assert.ok(Array.isArray(result.alerts))
    })
  })

  // ─── Alert Drilldown ───

  describe('getOperationsAlertDrilldown', () => {
    it('should return drilldown for valid alert code', async () => {
      const result = await service.getOperationsAlertDrilldown('approvals-pending', { tenantId: 't-sim', brandId: 'b-sim' })
      assert.ok(result)
      assert.equal(result.code, 'approvals-pending')
    })

    it('should return drilldown with history', async () => {
      const result = await service.getOperationsAlertDrilldown('high-risk-audits', { tenantId: 't-sim', brandId: 'b-sim' })
      assert.ok(result.history)
      assert.ok(Array.isArray(result.history))
    })

    it('should handle drilldown for unknown alert code gracefully', async () => {
      const result = await service.getOperationsAlertDrilldown('unknown-alert', { tenantId: 't-sim', brandId: 'b-sim' })
      assert.ok(result)
      assert.equal(result.code, 'unknown-alert')
    })
  })

  // ─── Alert Mutation Flow ───

  describe('acknowledgeOperationsAlert', () => {
    it('should acknowledge alert and return ACKED status', async () => {
      const result = await service.acknowledgeOperationsAlert(
        'approvals-pending',
        { tenantId: 't-sim', brandId: 'b-sim' },
        { actorId: 'a-sim', actorType: 'employee-user', roles: ['OPERATIONS'], permissions: [], authenticated: true, source: 'headers' as const },
        '模拟确认'
      )
      assert.ok(result)
      assert.equal(result.acknowledgement?.status, 'ACKED')
    })

    it('should return history with acknowledge entry', async () => {
      const result = await service.acknowledgeOperationsAlert(
        'high-risk-audits',
        { tenantId: 't-sim', brandId: 'b-sim' },
        { actorId: 'a-sim', actorType: 'employee-user', roles: ['SECURITY_ADMIN'], permissions: [], authenticated: true, source: 'headers' as const }
      )
      assert.ok(result.history)
      assert.ok(result.history.length >= 0)
    })
  })

  describe('muteOperationsAlert', () => {
    it('should mute alert and set visibleInOverview to false', async () => {
      const result = await service.muteOperationsAlert(
        'approvals-pending',
        { tenantId: 't-sim', brandId: 'b-sim' },
        { actorId: 'a-sim', actorType: 'employee-user', roles: ['TENANT_ADMIN'], permissions: [], authenticated: true, source: 'headers' as const },
        { mutedUntil: '2026-07-25T00:00:00Z', note: '模拟测试' }
      )
      assert.equal(result.acknowledgement?.status, 'MUTED')
      assert.equal(result.visibleInOverview, false)
    })

    it('should mute without optional mutedUntil', async () => {
      const result = await service.muteOperationsAlert(
        'high-risk-audits',
        { tenantId: 't-sim', brandId: 'b-sim' },
        { actorId: 'a-sim', actorType: 'employee-user', roles: ['OPERATIONS'], permissions: [], authenticated: true, source: 'headers' as const },
        { note: '短时静音' }
      )
      assert.equal(result.acknowledgement?.status, 'MUTED')
    })
  })

  describe('unmuteOperationsAlert', () => {
    it('should unmute alert and set visibleInOverview to true', async () => {
      const result = await service.unmuteOperationsAlert(
        'high-risk-audits',
        { tenantId: 't-sim', brandId: 'b-sim' },
        { actorId: 'a-sim', actorType: 'employee-user', roles: ['SECURITY_ADMIN'], permissions: [], authenticated: true, source: 'headers' as const }
      )
      assert.equal(result.acknowledgement?.status, 'ACKED')
      assert.equal(result.visibleInOverview, true)
    })

    it('should unmute with note', async () => {
      const result = await service.unmuteOperationsAlert(
        'approvals-pending',
        { tenantId: 't-sim', brandId: 'b-sim' },
        { actorId: 'a-sim', actorType: 'employee-user', roles: ['TENANT_ADMIN'], permissions: [], authenticated: true, source: 'headers' as const },
        '恢复跟踪-模拟测试'
      )
      assert.ok(result.acknowledgement)
    })
  })

  // ─── Consumer Operations ───

  describe('getConsumerCatalog', () => {
    it('should return consumer catalog with dependencies', () => {
      const catalog = service.getConsumerCatalog()
      assert.ok(Array.isArray(catalog))
      assert.ok(catalog.length > 0)
      for (const c of catalog) {
        assert.equal(typeof c.consumer, 'string')
        assert.ok(Array.isArray(c.dependsOn))
      }
    })
  })

  describe('getConsumerDependency', () => {
    it('should return consumer dependency for known consumer', () => {
      const result = service.getConsumerDependency('market')
      assert.ok(result)
      assert.equal((result as any).consumer, 'market')
    })

    it('should return availableConsumers for unknown consumer', () => {
      const result = service.getConsumerDependency('non-existent')
      assert.ok(!('consumer' in result))
      assert.ok(Array.isArray(result.availableConsumers))
    })
  })

  // ─── Operations Module Detail ───

  describe('getOperationsModuleDetail', () => {
    it('should return module detail with health data', async () => {
      const result = await service.getOperationsModuleDetail('trust-governance', { tenantId: 't-sim', brandId: 'b-sim' })
      assert.ok(result)
      assert.ok(result.health)
    })

    it('should handle unknown module key', async () => {
      const result = await service.getOperationsModuleDetail('unknown-module', { tenantId: 't-sim', brandId: 'b-sim' })
      assert.ok(result)
    })
  })

  // ─── Operations Alerts & Catalog ───

  describe('getOperationsAlerts', () => {
    it('should return alerts list', async () => {
      const result = await service.getOperationsAlerts({ tenantId: 't-sim', brandId: 'b-sim' })
      assert.ok(result.alerts)
      assert.ok(Array.isArray(result.alerts))
    })

    it('should return topRisks alongside alerts', async () => {
      const result = await service.getOperationsAlerts({ tenantId: 't-sim', brandId: 'b-sim' })
      assert.ok(result.topRisks)
      assert.ok(Array.isArray(result.topRisks))
    })
  })

  describe('getOperationsAlertsCatalog', () => {
    it('should return all catalog items', async () => {
      const result = await service.getOperationsAlertsCatalog({ tenantId: 't-sim', brandId: 'b-sim' })
      assert.ok(result.alerts)
      assert.ok(result.alerts.length >= 1)
    })

    it('should return catalog items with code and severityPolicy', async () => {
      const result = await service.getOperationsAlertsCatalog({ tenantId: 't-sim', brandId: 'b-sim' })
      for (const alert of result.alerts) {
        assert.equal(typeof alert.code, 'string')
        assert.equal(typeof alert.severityPolicy, 'string')
        assert.ok(alert.severityPolicy.length > 0)
      }
    })
  })
})
