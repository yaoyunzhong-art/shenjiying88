/**
 * 🐜 自动: [foundation] [D] controller spec 补全
 *
 * FoundationController 综合测试：
 * - 正例：正常路由/委托/响应
 * - 反例：缺失参数、不存在的 code/module/consumer
 * - 边界：undefined tenantContext、空响应、租户隔离
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import test, { describe } from 'node:test'
import { FoundationController } from './foundation.controller'
import { FoundationService } from './foundation.service'
import type { RequestTenantContext } from '../tenant/tenant.types'
import type { CurrentActorValue } from './identity-access/identity-access.decorator'

/* eslint-disable @typescript-eslint/no-extraneous-class */

// ── Mock —─

class MockFoundationService {
  calls: Record<string, unknown[]> = {}
  _track(method: string, args: unknown[]) {
    this.calls[method] = this.calls[method] || []
    this.calls[method].push(args)
  }

  getBlueprint() {
    this._track('getBlueprint', [])
    return {
      generatedAt: '2026-06-24T09:00:00.000Z',
      modules: [
        { key: 'identity-access', name: '身份与访问', version: '1.0.0', status: 'healthy' },
        { key: 'market', name: '市场管理', version: '1.0.0', status: 'healthy' },
      ],
      capabilities: ['tenant-management', 'brand-matrix'],
      governance: { baselineVersion: '1.0', securityLevel: 'high' },
    }
  }

  getModuleCatalog() {
    this._track('getModuleCatalog', [])
    return [
      { key: 'member', name: '会员管理', status: 'healthy', version: '1.0' },
      { key: 'market', name: '市场管理', status: 'warning', version: '1.1' },
      { key: 'tournament', name: '赛事管理', status: 'healthy', version: '2.0' },
    ]
  }

  getOperationsOverview(_tenantContext?: RequestTenantContext) {
    this._track('getOperationsOverview', [_tenantContext])
    return {
      generatedAt: '2026-06-24T09:00:00.000Z',
      tenantId: _tenantContext?.tenantId ?? 'no-tenant',
      totalModules: 8,
      healthyCount: 6,
      warningCount: 1,
      criticalCount: 0,
      pendingApprovals: 3,
      activeRuntimeGovernanceBacklog: 0,
    }
  }

  getOperationsAlerts(_tenantContext?: RequestTenantContext) {
    this._track('getOperationsAlerts', [_tenantContext])
    const base = {
      generatedAt: '2026-06-24T09:00:00.000Z',
      tenantId: _tenantContext?.tenantId ?? 'no-tenant',
      criticalAlerts: 1,
      warningAlerts: 2,
      infoAlerts: 1,
      alerts: [
        { code: 'approvals-pending', severity: 'warning', count: 3 },
        { code: 'high-risk-audits', severity: 'critical', count: 1 },
      ],
    }
    if (_tenantContext?.tenantId === 't-foundation-b') {
      return { ...base, alerts: [{ code: 'none', severity: 'info', count: 0 }], criticalAlerts: 0 }
    }
    return base
  }

  getOperationsAlertsCatalog(_tenantContext?: RequestTenantContext) {
    this._track('getOperationsAlertsCatalog', [_tenantContext])
    return {
      generatedAt: '2026-06-24T09:00:00.000Z',
      catalog: [
        { code: 'approvals-pending', name: '待审批', severity: 'warning' },
        { code: 'high-risk-audits', name: '高风险审计', severity: 'critical' },
        { code: 'blocked-rate-limit-ledgers', name: '限流账本阻塞', severity: 'critical' },
      ],
    }
  }

  getOperationsAlertDrilldown(code: string, _tenantContext?: RequestTenantContext) {
    this._track('getOperationsAlertDrilldown', [code, _tenantContext])
    if (code === 'non-existent-code') {
      return {
        generatedAt: '2026-06-24T09:00:00.000Z',
        code,
        message: `No drilldown data available for alert code: ${code}`,
        availableAlertCodes: [
          'approvals-pending', 'approval-execution-failures', 'high-risk-audits',
          'blocked-rate-limit-ledgers', 'secret-rotation-attention',
          'observability-degradation', 'recovery-drill-attention',
          'runtime-governance-backlog', 'runtime-callback-stalled',
        ],
      }
    }
    return {
      generatedAt: '2026-06-24T09:00:00.000Z',
      code,
      tenantId: _tenantContext?.tenantId ?? null,
      summary: `Drilldown for ${code}`,
      details: { affectedItems: 3, lastEvent: '2026-06-24T08:00:00.000Z' },
    }
  }

  acknowledgeOperationsAlert(
    code: string,
    _tenantContext?: RequestTenantContext,
    _actorContext?: CurrentActorValue,
    note?: string
  ) {
    this._track('acknowledgeOperationsAlert', [code, _tenantContext, _actorContext, note])
    if (code === 'unknown-code') {
      return {
        generatedAt: '2026-06-24T09:00:00.000Z',
        message: `Alert code '${code}' is not recognized by the system. No action taken.`,
        availableAlertCodes: [
          'approvals-pending', 'approval-execution-failures', 'high-risk-audits',
          'blocked-rate-limit-ledgers', 'secret-rotation-attention',
          'observability-degradation', 'recovery-drill-attention',
          'runtime-governance-backlog', 'runtime-callback-stalled',
        ],
      }
    }
    return {
      generatedAt: '2026-06-24T09:00:00.000Z',
      code,
      acknowledged: true,
      actorId: _actorContext?.actorId ?? 'unknown',
      note: note ?? undefined,
    }
  }

  muteOperationsAlert(
    code: string,
    _tenantContext?: RequestTenantContext,
    _actorContext?: CurrentActorValue,
    options?: { mutedUntil?: string; note?: string }
  ) {
    this._track('muteOperationsAlert', [code, _tenantContext, _actorContext, options])
    return {
      generatedAt: '2026-06-24T09:00:00.000Z',
      code,
      muted: true,
      mutedUntil: options?.mutedUntil ?? null,
      note: options?.note ?? undefined,
    }
  }

  unmuteOperationsAlert(
    code: string,
    _tenantContext?: RequestTenantContext,
    _actorContext?: CurrentActorValue,
    note?: string
  ) {
    this._track('unmuteOperationsAlert', [code, _tenantContext, _actorContext, note])
    return {
      generatedAt: '2026-06-24T09:00:00.000Z',
      code,
      unmuted: true,
      note: note ?? undefined,
    }
  }

  getOperationsModuleDetail(moduleKey: string, _tenantContext?: RequestTenantContext) {
    this._track('getOperationsModuleDetail', [moduleKey, _tenantContext])
    if (moduleKey === 'non-existent-module') {
      return {
        generatedAt: '2026-06-24T09:00:00.000Z',
        moduleKey,
        message: 'Module not found',
        availableModuleKeys: ['identity-access', 'market', 'tournament', 'member', 'cashier'],
      }
    }
    return {
      generatedAt: '2026-06-24T09:00:00.000Z',
      moduleKey,
      health: { module: moduleKey, score: 95, status: 'healthy', indicators: { uptime: 99.9, latency: '45ms' } },
      detail: { description: `${moduleKey} module` },
    }
  }

  getConsumerCatalog() {
    this._track('getConsumerCatalog', [])
    return [
      { consumer: 'market', modulePath: 'market/market.consumer', dependsOn: ['member'], responsibility: '市场营销' },
      { consumer: 'tournament', modulePath: 'tournament/tournament.consumer', dependsOn: ['member', 'market'], responsibility: '赛事管理' },
    ]
  }

  getConsumerDependency(consumer: string) {
    this._track('getConsumerDependency', [consumer])
    if (consumer === 'non-existent-consumer') {
      return {
        message: `Consumer '${consumer}' not found`,
        availableConsumers: ['market', 'tournament'],
      }
    }
    return {
      consumer,
      modulePath: `${consumer}/${consumer}.consumer`,
      dependsOn: ['member'],
      responsibility: `${consumer} module`,
      handoffContracts: [`${consumer}.handoff`],
      recommendedSequence: ['member', consumer],
      governanceTouchpoints: [`${consumer}.evaluate`],
      highRiskEntrypoints: [`${consumer}.execute`],
      availableConsumers: undefined,
    }
  }
}

/* eslint-enable @typescript-eslint/no-extraneous-class */

type MockSvc = MockFoundationService & FoundationService

// ── Fixtures ──

const TENANT_A: RequestTenantContext = {
  tenantId: 't-foundation-a',
  brandId: 'brand-a',
  storeId: 'store-a',
  marketCode: 'SH',
}

const TENANT_B: RequestTenantContext = {
  tenantId: 't-foundation-b',
  brandId: 'brand-b',
  storeId: 'store-b',
  marketCode: 'BJ',
}

const ACTOR: CurrentActorValue = {
  actorId: 'admin-001',
  actorType: 'SYSTEM',
  roles: ['SUPER_ADMIN'],
}

function createController(): { ctrl: FoundationController; svc: MockSvc } {
  const svc = new MockFoundationService() as unknown as MockSvc
  const ctrl = new FoundationController(svc)
  return { ctrl, svc }
}

// ── Tests ──

describe('FoundationController', () => {
  // ── Route metadata ──

  describe('route metadata (NestJS @Controller/@Get/@Post decorators)', () => {
    test('controller should be mounted at /foundation', () => {
      const path = Reflect.getMetadata('path', FoundationController)
      assert.equal(path, 'foundation')
    })

    test('getBootstrap → GET /bootstrap', () => {
      const method = Reflect.getMetadata('method', FoundationController.prototype.getBootstrap)
      const path = Reflect.getMetadata('path', FoundationController.prototype.getBootstrap)
      assert.equal(method, 0) // GET
      assert.equal(path, 'bootstrap')
    })

    test('getModules → GET /modules', () => {
      const method = Reflect.getMetadata('method', FoundationController.prototype.getModules)
      const path = Reflect.getMetadata('path', FoundationController.prototype.getModules)
      assert.equal(method, 0)
      assert.equal(path, 'modules')
    })

    test('getOperationsOverview → GET /overview', () => {
      const method = Reflect.getMetadata('method', FoundationController.prototype.getOperationsOverview)
      const path = Reflect.getMetadata('path', FoundationController.prototype.getOperationsOverview)
      assert.equal(method, 0)
      assert.equal(path, 'overview')
    })

    test('getOperationsAlerts → GET /overview/alerts', () => {
      const method = Reflect.getMetadata('method', FoundationController.prototype.getOperationsAlerts)
      const path = Reflect.getMetadata('path', FoundationController.prototype.getOperationsAlerts)
      assert.equal(method, 0)
      assert.equal(path, 'overview/alerts')
    })

    test('getOperationsAlertsCatalog → GET /overview/alerts/catalog', () => {
      const method = Reflect.getMetadata('method', FoundationController.prototype.getOperationsAlertsCatalog)
      const path = Reflect.getMetadata('path', FoundationController.prototype.getOperationsAlertsCatalog)
      assert.equal(method, 0)
      assert.equal(path, 'overview/alerts/catalog')
    })

    test('getOperationsAlertDrilldown → GET /overview/alerts/:code/drilldown', () => {
      const method = Reflect.getMetadata('method', FoundationController.prototype.getOperationsAlertDrilldown)
      const path = Reflect.getMetadata('path', FoundationController.prototype.getOperationsAlertDrilldown)
      assert.equal(method, 0)
      assert.equal(path, 'overview/alerts/:code/drilldown')
    })

    test('acknowledgeOperationsAlert → POST /overview/alerts/:code/ack', () => {
      const method = Reflect.getMetadata('method', FoundationController.prototype.acknowledgeOperationsAlert)
      const path = Reflect.getMetadata('path', FoundationController.prototype.acknowledgeOperationsAlert)
      assert.equal(method, 1) // POST
      assert.equal(path, 'overview/alerts/:code/ack')
    })

    test('muteOperationsAlert → POST /overview/alerts/:code/mute', () => {
      const method = Reflect.getMetadata('method', FoundationController.prototype.muteOperationsAlert)
      const path = Reflect.getMetadata('path', FoundationController.prototype.muteOperationsAlert)
      assert.equal(method, 1)
      assert.equal(path, 'overview/alerts/:code/mute')
    })

    test('unmuteOperationsAlert → POST /overview/alerts/:code/unmute', () => {
      const method = Reflect.getMetadata('method', FoundationController.prototype.unmuteOperationsAlert)
      const path = Reflect.getMetadata('path', FoundationController.prototype.unmuteOperationsAlert)
      assert.equal(method, 1)
      assert.equal(path, 'overview/alerts/:code/unmute')
    })

    test('getOperationsModuleDetail → GET /overview/modules/:moduleKey', () => {
      const method = Reflect.getMetadata('method', FoundationController.prototype.getOperationsModuleDetail)
      const path = Reflect.getMetadata('path', FoundationController.prototype.getOperationsModuleDetail)
      assert.equal(method, 0)
      assert.equal(path, 'overview/modules/:moduleKey')
    })

    test('getConsumers → GET /consumers', () => {
      const method = Reflect.getMetadata('method', FoundationController.prototype.getConsumers)
      const path = Reflect.getMetadata('path', FoundationController.prototype.getConsumers)
      assert.equal(method, 0)
      assert.equal(path, 'consumers')
    })

    test('getConsumer → GET /consumers/:consumer', () => {
      const method = Reflect.getMetadata('method', FoundationController.prototype.getConsumer)
      const path = Reflect.getMetadata('path', FoundationController.prototype.getConsumer)
      assert.equal(method, 0)
      assert.equal(path, 'consumers/:consumer')
    })
  })

  // ── Bootstrap ──

  describe('GET /foundation/bootstrap', () => {
    test('正例: should return bootstrap with tenant context and blueprint merged', () => {
      const { ctrl, svc } = createController()
      const result = ctrl.getBootstrap(TENANT_A) as any
      assert.equal(result.tenantContext?.tenantId, 't-foundation-a')
      assert.equal(result.generatedAt, '2026-06-24T09:00:00.000Z')
      assert.ok(Array.isArray(result.modules))
      assert.ok(Array.isArray(result.capabilities))
      assert.ok(svc.calls['getBlueprint']?.length === 1)
    })
  })

  // ── Modules ──

  describe('GET /foundation/modules', () => {
    test('正例: should return module catalog', () => {
      const { ctrl, svc } = createController()
      const result = ctrl.getModules() as any[]
      assert.equal(result.length, 3)
      assert.equal(result[0].key, 'member')
      assert.equal(result[1].status, 'warning')
      assert.ok(svc.calls['getModuleCatalog']?.length === 1)
    })
  })

  // ── Overview ──

  describe('GET /foundation/overview', () => {
    test('正例: should return overview for a tenant', async () => {
      const { ctrl, svc } = createController()
      const result = await ctrl.getOperationsOverview(TENANT_A) as any
      assert.equal(result.tenantId, 't-foundation-a')
      assert.equal(result.totalModules, 8)
      assert.equal(result.criticalCount, 0)
      assert.ok(svc.calls['getOperationsOverview']?.length === 1)
    })

    test('边界: should return overview with undefined tenant context', async () => {
      const { ctrl, svc } = createController()
      const result = await ctrl.getOperationsOverview(undefined) as any
      assert.equal(result.tenantId, 'no-tenant')
      assert.ok(svc.calls['getOperationsOverview']?.[0]?.[0] === undefined)
    })
  })

  // ── Alerts ──

  describe('GET /foundation/overview/alerts', () => {
    test('正例: should return alerts for tenant A', async () => {
      const { ctrl } = createController()
      const result = await ctrl.getOperationsAlerts(TENANT_A) as any
      assert.equal(result.criticalAlerts, 1)
      assert.equal(result.warningAlerts, 2)
      assert.equal(result.alerts.length, 2)
    })

    test('租户隔离: should isolate alerts between tenants', async () => {
      const { ctrl } = createController()
      const a = await ctrl.getOperationsAlerts(TENANT_A) as any
      const b = await ctrl.getOperationsAlerts(TENANT_B) as any
      assert.equal(a.alerts.length, 2)
      assert.equal(b.alerts.length, 1)
      assert.equal(a.tenantId, 't-foundation-a')
      assert.equal(b.tenantId, 't-foundation-b')
    })
  })

  describe('GET /foundation/overview/alerts/catalog', () => {
    test('正例: should return alert catalog', async () => {
      const { ctrl, svc } = createController()
      const result = await ctrl.getOperationsAlertsCatalog(TENANT_A) as any
      assert.ok(Array.isArray(result.catalog))
      assert.equal(result.catalog.length, 3)
      assert.equal(result.catalog[0].code, 'approvals-pending')
      assert.ok(svc.calls['getOperationsAlertsCatalog']?.length === 1)
    })
  })

  describe('GET /foundation/overview/alerts/:code/drilldown', () => {
    test('正例: should return drilldown for known alert code', async () => {
      const { ctrl } = createController()
      const result = await ctrl.getOperationsAlertDrilldown('approvals-pending', TENANT_A) as any
      assert.equal(result.code, 'approvals-pending')
      assert.equal(result.tenantId, 't-foundation-a')
      assert.ok(result.details?.affectedItems >= 0)
    })

    test('反例: should return fallback for unknown alert code', async () => {
      const { ctrl } = createController()
      const result = await ctrl.getOperationsAlertDrilldown('non-existent-code', TENANT_A) as any
      assert.ok(result.message?.includes('No drilldown data available'))
      assert.ok(Array.isArray(result.availableAlertCodes))
    })
  })

  // ── Alert mutations ──

  describe('POST /foundation/overview/alerts/:code/ack', () => {
    test('正例: should acknowledge with note', async () => {
      const { ctrl, svc } = createController()
      const result = await ctrl.acknowledgeOperationsAlert('approvals-pending', TENANT_A, ACTOR, { note: '已确认处理' }) as any
      assert.equal(result.acknowledged, true)
      assert.equal(result.code, 'approvals-pending')
      assert.equal(result.note, '已确认处理')
      assert.ok(svc.calls['acknowledgeOperationsAlert']?.length === 1)
    })

    test('边界: should acknowledge without note', async () => {
      const { ctrl } = createController()
      const result = await ctrl.acknowledgeOperationsAlert('high-risk-audits', TENANT_A, ACTOR, {}) as any
      assert.equal(result.acknowledged, true)
    })

    test('反例: should handle unknown alert code gracefully', async () => {
      const { ctrl } = createController()
      const result = await ctrl.acknowledgeOperationsAlert('unknown-code', TENANT_A, ACTOR, { note: 'test' }) as any
      assert.ok(result.message?.includes("not recognized"))
      assert.ok(Array.isArray(result.availableAlertCodes))
    })
  })

  describe('POST /foundation/overview/alerts/:code/mute', () => {
    test('正例: should mute with mutedUntil', async () => {
      const { ctrl } = createController()
      const until = new Date(Date.now() + 86400000).toISOString()
      const result = await ctrl.muteOperationsAlert('approvals-pending', TENANT_A, ACTOR, { mutedUntil: until, note: '静默1天' }) as any
      assert.equal(result.muted, true)
      assert.equal(result.mutedUntil, until)
    })

    test('边界: should mute with only note', async () => {
      const { ctrl } = createController()
      const result = await ctrl.muteOperationsAlert('secret-rotation-attention', TENANT_A, ACTOR, { note: 'muted' }) as any
      assert.equal(result.muted, true)
    })
  })

  describe('POST /foundation/overview/alerts/:code/unmute', () => {
    test('正例: should unmute a previously muted alert', async () => {
      const { ctrl } = createController()
      await ctrl.muteOperationsAlert('approvals-pending', TENANT_A, ACTOR, { note: 'mute' })
      const result = await ctrl.unmuteOperationsAlert('approvals-pending', TENANT_A, ACTOR, { note: '已恢复' }) as any
      assert.equal(result.unmuted, true)
      assert.equal(result.note, '已恢复')
    })

    test('边界: should unmute with empty options', async () => {
      const { ctrl } = createController()
      const result = await ctrl.unmuteOperationsAlert('high-risk-audits', TENANT_A, ACTOR, {}) as any
      assert.equal(result.unmuted, true)
    })
  })

  // ── Module detail ──

  describe('GET /foundation/overview/modules/:moduleKey', () => {
    test('正例: should return module detail', async () => {
      const { ctrl, svc } = createController()
      const result = await ctrl.getOperationsModuleDetail('identity-access', TENANT_A) as any
      assert.equal(result.moduleKey, 'identity-access')
      assert.equal(result.health?.status, 'healthy')
      assert.equal(result.health?.score, 95)
      assert.ok(svc.calls['getOperationsModuleDetail']?.length === 1)
    })

    test('反例: should return fallback for unknown module key', async () => {
      const { ctrl } = createController()
      const result = await ctrl.getOperationsModuleDetail('non-existent-module', TENANT_A) as any
      assert.equal(result.moduleKey, 'non-existent-module')
      assert.equal(result.message, 'Module not found')
    })

    test('边界: should work without tenant context', async () => {
      const { ctrl } = createController()
      const result = await ctrl.getOperationsModuleDetail('market', undefined) as any
      assert.equal(result.moduleKey, 'market')
    })
  })

  // ── Consumers ──

  describe('GET /foundation/consumers', () => {
    test('正例: should return consumer catalog', () => {
      const { ctrl, svc } = createController()
      const result = ctrl.getConsumers() as any[]
      assert.equal(result.length, 2)
      assert.equal(result[0].consumer, 'market')
      assert.ok(svc.calls['getConsumerCatalog']?.length === 1)
    })
  })

  describe('GET /foundation/consumers/:consumer', () => {
    test('正例: should return consumer dependency', () => {
      const { ctrl, svc } = createController()
      const result = ctrl.getConsumer('market') as any
      assert.equal(result.consumer, 'market')
      assert.ok(Array.isArray(result.dependsOn))
      assert.ok(Array.isArray(result.handoffContracts))
      assert.ok(svc.calls['getConsumerDependency']?.length === 1)
    })

    test('反例: should return fallback for unknown consumer', () => {
      const { ctrl } = createController()
      const result = ctrl.getConsumer('non-existent-consumer') as any
      assert.ok(result.message?.includes('not found'))
      assert.ok(Array.isArray(result.availableConsumers))
    })
  })
})
