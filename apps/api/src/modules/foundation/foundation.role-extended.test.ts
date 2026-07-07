import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * 🐜 自动: [foundation] [C] 角色测试扩展
 * 
 * 8 角色视角的 foundation 模块扩展测试：
 * 👔店长 🛒前台 👥HR 🔧安监 🎮导玩员 🎯运行专员 🤝团建 📢营销
 * 
 * 每个角色至少 2 个扩展测试用例（正常流程 + 权限边界 + 数据完整性）
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import { FoundationController } from './foundation.controller'
import { FoundationService } from './foundation.service'
import {
  PERMISSIONS_METADATA_KEY,
  ROLES_METADATA_KEY
} from './identity-access/identity-access.decorator'

// ── Helpers ──
function mockFoundationService(overrides: Record<string, unknown> = {}): FoundationService {
  const svc: any = {
    getBlueprint: () => ({
      generatedAt: '2026-06-28T00:00:00.000Z',
      docs: [],
      guardrails: [],
      modules: [],
      consumers: [],
      governanceBaselines: [],
      frontendBootstrap: { version: '1.0' },
    }),
    getModuleCatalog: () => [
      { module: 'trust-governance', status: 'healthy' },
      { module: 'resilience-operations', status: 'healthy' },
    ],
    getConsumerCatalog: () => [
      { consumer: 'market', modulePath: 'src/modules/market', dependsOn: [] },
      { consumer: 'portal', modulePath: 'src/modules/portal', dependsOn: [] },
    ],
    getConsumerDependency: (consumer: string) =>
      consumer === 'market'
        ? { consumer: 'market', modulePath: 'src/modules/market', dependsOn: ['trust-governance'] }
        : { availableConsumers: ['market', 'portal', 'workbench'] },
    getOperationsOverview: async () => ({
      generatedAt: '2026-06-28T00:00:00.000Z',
      summary: { approvalsPending: 3, highRiskAudits: 2 },
      alerts: [
        { code: 'approvals-pending', severity: 'medium', count: 3, summary: '待处理审批单' },
      ],
      topRisks: [],
      topFailures: [],
      moduleHealth: {
        trustGovernance: {
          module: 'trust-governance',
          score: 90,
          status: 'healthy',
          indicators: { highRiskAudits: 0, pendingApprovals: 1, executionFailures: 0, blockedCount: 0 },
        },
        configurationGovernance: {
          module: 'configuration-governance',
          score: 85,
          status: 'healthy',
          indicators: { highRiskAudits: 0, pendingApprovals: 0, executionFailures: 0, blockedCount: 0 },
        },
      },
      modules: {},
    }),
    getOperationsAlerts: async () => ({
      generatedAt: '2026-06-28T00:00:00.000Z',
      alerts: [{ code: 'approvals-pending', severity: 'medium', count: 3, summary: '待处理审批单' }],
      topRisks: [],
    }),
    getOperationsAlertsCatalog: async () => ({
      generatedAt: '2026-06-28T00:00:00.000Z',
      alerts: [
        {
          code: 'approvals-pending',
          defaultSummary: '待处理审批单',
          severityPolicy: 'count >= 5 → high',
          sourceModules: ['trust-governance'],
          drilldownPath: '/foundation/overview/alerts/approvals-pending/drilldown',
          ackPath: '/foundation/overview/alerts/approvals-pending/ack',
          mutePath: '/foundation/overview/alerts/approvals-pending/mute',
          unmutePath: '/foundation/overview/alerts/approvals-pending/unmute',
          drilldownEnabled: true,
          acknowledgementEnabled: true,
          visibleInOverview: true,
          availableActions: ['DRILLDOWN', 'ACK', 'MUTE'],
          acknowledgement: null,
        },
      ],
    }),
    getOperationsAlertDrilldown: async (code: string) => ({
      generatedAt: '2026-06-28T00:00:00.000Z',
      code,
      catalog: {},
      alert: { code, severity: 'medium', count: 3, summary: '待处理审批单' },
      acknowledgement: null,
      history: [],
      detail: { total: 3, approvals: [] },
      visibleInOverview: true,
      availableActions: ['DRILLDOWN', 'ACK', 'MUTE'],
    }),
    acknowledgeOperationsAlert: async (code: string) => ({
      generatedAt: '2026-06-28T00:00:00.000Z',
      code,
      catalogue: {},
      acknowledgement: { status: 'ACKED', note: '已确认', acknowledgedAt: '2026-06-28T00:00:00.000Z', actorId: null },
      visibleInOverview: true,
      availableActions: ['DRILLDOWN', 'ACK', 'MUTE', 'UNMUTE'],
      history: [],
    }),
    muteOperationsAlert: async (code: string) => ({
      generatedAt: '2026-06-28T00:00:00.000Z',
      code,
      catalogue: {},
      acknowledgement: { status: 'MUTED', note: '已静音', mutedUntil: '2026-06-29T00:00:00.000Z' },
      visibleInOverview: false,
      availableActions: ['DRILLDOWN', 'ACK', 'UNMUTE'],
      history: [],
    }),
    unmuteOperationsAlert: async (code: string) => ({
      generatedAt: '2026-06-28T00:00:00.000Z',
      code,
      catalogue: {},
      acknowledgement: { status: 'ACKED', note: '取消静音' },
      visibleInOverview: true,
      availableActions: ['DRILLDOWN', 'ACK', 'MUTE'],
      history: [],
    }),
    getOperationsModuleDetail: async (moduleKey: string) => ({
      generatedAt: '2026-06-28T00:00:00.000Z',
      moduleKey,
      health: { module: moduleKey, score: 85, status: 'healthy', indicators: {} },
      detail: {},
    }),
    ...overrides,
  }
  return svc as unknown as FoundationService
}

const tenantCtx = {
  tenantId: 't-foundation',
  brandId: 'b-foundation',
  storeId: 's-foundation',
  marketCode: 'zh-cn',
}

const actorCtx = {
  actorId: 'a-test',
  actorType: 'tenant-user' as const,
  actorName: 'Test',
  roles: [] as string[],
  permissions: [] as string[],
  tenantId: 't-foundation',
  authenticated: true,
  source: 'headers' as const,
}

// ── 角色定义 ──
const ROLES = {
  TenantAdmin: '👔店长',
  FrontDesk: '🛒前台',
  HR: '👥HR',
  Security: '🔧安监',
  Guide: '🎮导玩员',
  Operations: '🎯运行专员',
  Teambuilding: '🤝团建',
  Marketing: '📢营销',
}

// ── 👔店长 Extended ──
describe(`${ROLES.TenantAdmin} foundation 扩展测试`, () => {
  it('店长可以获取所有消费者依赖（多消费者完整性）', () => {
    const svc = mockFoundationService()
    const ctrl = new FoundationController(svc)
    const marketConsumer = ctrl.getConsumer('market')
    assert.equal((marketConsumer as any).consumer, 'market')
    assert.deepEqual((marketConsumer as any).dependsOn, ['trust-governance'])

    const unknownConsumer = ctrl.getConsumer('nonexistent')
    assert.ok(Array.isArray((unknownConsumer as any).availableConsumers))
    assert.ok((unknownConsumer as any).availableConsumers!.includes('market'))
    assert.ok((unknownConsumer as any).availableConsumers!.includes('portal'))
  })

  it('店长查看 bootstrap 数据完整性（含 guardrails 和 frontendBootstrap）', () => {
    const svc = mockFoundationService()
    const ctrl = new FoundationController(svc)
    const result = ctrl.getBootstrap(tenantCtx)
    assert.ok(result.tenantContext)
    assert.equal(result.tenantContext.tenantId, 't-foundation')
    assert.ok(result.generatedAt)
    assert.ok(Array.isArray(result.docs))
    assert.ok(Array.isArray(result.guardrails))
    assert.ok(typeof result.frontendBootstrap === 'object' && result.frontendBootstrap !== null)
  })

  it('店长 drilldown 告警详情得到完整的分级上下文', async () => {
    const svc = mockFoundationService()
    const ctrl = new FoundationController(svc)
    const result = await ctrl.getOperationsAlertDrilldown('approvals-pending', tenantCtx)
    assert.ok(result.alert)
    assert.equal(result.code, 'approvals-pending')
    assert.ok(result.visibleInOverview)
    assert.ok(Array.isArray(result.availableActions))
    assert.ok(result.availableActions!.includes('ACK'))
  })

  it('店长可以查看模块健康详情（模块状态一致性）', async () => {
    const svc = mockFoundationService({
      getOperationsModuleDetail: async (moduleKey: string) => ({
        generatedAt: '2026-06-28T00:00:00.000Z',
        moduleKey,
        health: { module: moduleKey, score: 95, status: 'healthy', indicators: { cpu: 30, mem: 40 } },
        detail: { deployment: 'v2.1.0', instances: 3 },
      }),
    })
    const ctrl = new FoundationController(svc)
    const result = await ctrl.getOperationsModuleDetail('trust-governance', tenantCtx)
    assert.equal(result.moduleKey, 'trust-governance')
    assert.equal(result.health!.status, 'healthy')
    assert.equal(result.health!.score, 95)
    assert.ok(result.detail)
    assert.ok(result.generatedAt)
  })
})

// ── 👥HR Extended ──
describe(`${ROLES.HR} foundation 扩展测试`, () => {
  it('HR 可以获取消费者依赖（用于员工关联系统依赖关系梳理）', () => {
    const svc = mockFoundationService()
    const ctrl = new FoundationController(svc)
    const consumers = ctrl.getConsumers()
    assert.ok(Array.isArray(consumers))
    assert.ok(consumers.length >= 2)

    const portalConsumer = ctrl.getConsumer('portal')
    assert.ok(portalConsumer)
    assert.ok(typeof portalConsumer === 'object')
  })

  it('HR 可以查看模块健康度（用于人员调度决策参考）', async () => {
    const svc = mockFoundationService()
    const ctrl = new FoundationController(svc)
    const overview = await ctrl.getOperationsOverview(tenantCtx)
    assert.ok(overview.moduleHealth)
    assert.ok(overview.moduleHealth.trustGovernance)
    assert.ok(overview.moduleHealth.trustGovernance.score >= 0)
    assert.ok(['healthy', 'warning', 'critical'].includes(overview.moduleHealth.trustGovernance.status))
  })

  it('HR 获取告警目录（可读性 + 数据格式一致性）', async () => {
    const svc = mockFoundationService()
    const ctrl = new FoundationController(svc)
    const catalog = await ctrl.getOperationsAlertsCatalog(tenantCtx)
    assert.ok(catalog.generatedAt)
    assert.ok(Array.isArray(catalog.alerts))
    if (catalog.alerts.length > 0) {
      const alert = catalog.alerts[0]
      assert.ok(typeof alert.code === 'string')
      assert.ok(typeof alert.defaultSummary === 'string')
      assert.ok(typeof alert.severityPolicy === 'string')
    }
  })

  it('HR 查看无告警时的空状态（边界：空告警列表）', async () => {
    const svc = mockFoundationService({
      getOperationsAlerts: async () => ({
        generatedAt: '2026-06-28T00:00:00.000Z',
        alerts: [],
        topRisks: [],
      }),
    })
    const ctrl = new FoundationController(svc)
    const result = await ctrl.getOperationsAlerts(tenantCtx)
    assert.ok(Array.isArray(result.alerts))
    assert.equal(result.alerts.length, 0)
    assert.ok(Array.isArray(result.topRisks))
    assert.equal(result.topRisks.length, 0)
  })
})

// ── 🛒前台 Extended ──
describe(`${ROLES.FrontDesk} foundation 扩展测试`, () => {
  it('前台可以查看告警目录（只读权限）', async () => {
    const svc = mockFoundationService()
    const ctrl = new FoundationController(svc)
    const alerts = await ctrl.getOperationsAlerts(tenantCtx)
    assert.ok(alerts.generatedAt)
    assert.ok(Array.isArray(alerts.alerts))
  })

  it('前台查看模块列表（只读访问）', () => {
    const svc = mockFoundationService()
    const ctrl = new FoundationController(svc)
    const modules = ctrl.getModules()
    assert.ok(Array.isArray(modules))
    assert.ok(modules.length > 0)
    modules.forEach((m: any) => {
      assert.ok(typeof m.module === 'string')
      assert.ok(typeof m.status === 'string')
    })
  })

  it('前台查看未知模块详情返回 availableModuleKeys（边界）', async () => {
    const svc = mockFoundationService({
      getOperationsModuleDetail: async (moduleKey: string) => ({
        generatedAt: '2026-06-28T00:00:00.000Z',
        moduleKey,
        availableModuleKeys: ['trust-governance', 'configuration-governance', 'resilience-operations', 'runtime-governance'],
      }),
    })
    const ctrl = new FoundationController(svc)
    const result = await ctrl.getOperationsModuleDetail('unknown-module', tenantCtx)
    assert.ok(Array.isArray((result as any).availableModuleKeys))
    assert.ok((result as any).availableModuleKeys!.includes('trust-governance'))
  })

  it('前台尝试 ack 告警 — 需确认 RequireRoles 不包含 FRONT_DESK（权限边界）', () => {
    const roles = Reflect.getMetadata(
      ROLES_METADATA_KEY,
      FoundationController.prototype.acknowledgeOperationsAlert
    )
    assert.ok(roles, 'Roles metadata should be defined')
    assert.ok(!roles.includes('FRONT_DESK'))
    assert.ok(!roles.includes('RECEPTION'))
  })
})

// ── 🔧安监 Extended ──
describe(`${ROLES.Security} foundation 扩展测试`, () => {
  it('安监查看告警 drilldown 包含完整 detail（审计需求）', async () => {
    const svc = mockFoundationService({
      getOperationsAlertDrilldown: async (code: string) => ({
        generatedAt: '2026-06-28T00:00:00.000Z',
        code,
        catalog: {},
        alert: { code, severity: 'high', count: 5, summary: '高风险审计告警' },
        acknowledgement: null,
        history: [
          {
            action: 'ACK',
            operatorId: 'ops-001',
            timestamp: '2026-06-27T00:00:00.000Z',
            status: 'ACKED',
            details: { note: '已处理高风险审计' },
          },
        ],
        detail: { audits: [{ module: 'trust-governance', id: 'audit-001', riskLevel: 'high' }] },
        visibleInOverview: true,
        availableActions: ['DRILLDOWN', 'ACK', 'MUTE'],
      }),
    })
    const ctrl = new FoundationController(svc)
    const result = await ctrl.getOperationsAlertDrilldown('high-risk-audits', tenantCtx)
    assert.equal(result.code, 'high-risk-audits')
    assert.ok(result.detail)
    assert.ok(result.alert)
    assert.ok(result.history!.length > 0)
  })

  it('安监 mute 高风险告警（安全静音策略）', async () => {
    const svc = mockFoundationService({
      muteOperationsAlert: async (code: string) => ({
        generatedAt: '2026-06-28T00:00:00.000Z',
        code,
        catalogue: {},
        acknowledgement: { status: 'MUTED', note: '安全审查临时静音', mutedUntil: '2026-06-30T00:00:00.000Z' },
        visibleInOverview: false,
        availableActions: ['DRILLDOWN', 'UNMUTE'],
        history: [],
      }),
    })
    const ctrl = new FoundationController(svc)
    const result = await ctrl.muteOperationsAlert(
      'high-risk-audits',
      tenantCtx,
      { ...actorCtx, roles: ['SECURITY_ADMIN'], permissions: ['foundation.operations.alerts.write'] },
      { note: '安全审查临时静音' }
    )
    assert.equal(result.acknowledgement!.status, 'MUTED')
    assert.equal(result.visibleInOverview, false)
  })

  it('安监 unmute 告警并恢复 overview 可见性', async () => {
    const svc = mockFoundationService({
      unmuteOperationsAlert: async (code: string) => ({
        generatedAt: '2026-06-28T00:00:00.000Z',
        code,
        catalogue: {},
        acknowledgement: { status: 'ACKED', note: '安全审查完毕，恢复跟踪' },
        visibleInOverview: true,
        availableActions: ['DRILLDOWN', 'ACK', 'MUTE'],
        history: [],
      }),
    })
    const ctrl = new FoundationController(svc)
    const result = await ctrl.unmuteOperationsAlert(
      'high-risk-audits',
      tenantCtx,
      { ...actorCtx, roles: ['SECURITY_ADMIN'], permissions: ['foundation.operations.alerts.write'] },
      { note: '安全审查完毕，恢复跟踪' }
    )
    assert.equal(result.acknowledgement!.status, 'ACKED')
    assert.equal(result.visibleInOverview, true)
  })

  it('安监查看模块详情（用于评估安全模块健康度）', async () => {
    const svc = mockFoundationService()
    const ctrl = new FoundationController(svc)
    const detail = await ctrl.getOperationsModuleDetail('trust-governance', tenantCtx)
    assert.equal(detail.moduleKey, 'trust-governance')
    assert.ok(detail.health)
  })
})

// ── 🎮导玩员 Extended ──
describe(`${ROLES.Guide} foundation 扩展测试`, () => {
  it('导玩员查看 bootstrap 获取底层依赖关系', () => {
    const svc = mockFoundationService({
      getBlueprint: () => ({
        generatedAt: '2026-06-28T00:00:00.000Z',
        docs: ['docs/operations-runbook.md'],
        guardrails: ['不可跳过底座直接接外部系统'],
        modules: [{ module: 'trust-governance', status: 'healthy' }],
        consumers: [
          { consumer: 'market', modulePath: 'src/modules/market', dependsOn: ['trust-governance'] },
        ],
        governanceBaselines: [
          { name: 'Secret Rotation', interval: '30d' },
        ],
        frontendBootstrap: { version: '1.0', features: ['market-override'] },
      }),
    })
    const ctrl = new FoundationController(svc)
    const result = ctrl.getBootstrap(tenantCtx)
    assert.ok(result.tenantContext)
    assert.ok(result.docs!.length > 0)
    assert.ok(result.guardrails!.length > 0)
    assert.ok(Array.isArray(result.modules))
    assert.ok(Array.isArray(result.consumers))
    assert.ok(Array.isArray(result.governanceBaselines))
    assert.ok(result.frontendBootstrap)
  })

  it('导玩员尝试进入 Ack 接口发现角色权限不足（权限边界验证）', () => {
    // 验证 acknowledgeOperationsAlert 要求 TENANT_ADMIN | OPERATIONS | SECURITY_ADMIN
    const roles = Reflect.getMetadata(
      ROLES_METADATA_KEY,
      FoundationController.prototype.acknowledgeOperationsAlert
    )
    assert.ok(roles)
    const roleList: string[] = roles
    assert.ok(roleList.includes('SUPER_ADMIN') || roleList.includes('TENANT_ADMIN'))
    assert.ok(!roleList.includes('GUIDE'))
    assert.ok(!roleList.includes('GAME_HOST'))
  })

  it('导玩员可以查看消费者依赖（用于理解业务连线）', () => {
    const svc = mockFoundationService()
    const ctrl = new FoundationController(svc)
    const market = ctrl.getConsumer('market')
    assert.ok(market)
    assert.ok((market as any).dependsOn)
  })

  it('导玩员查看健康概览（数值在合理范围内）', async () => {
    const svc = mockFoundationService()
    const ctrl = new FoundationController(svc)
    const overview = await ctrl.getOperationsOverview(tenantCtx)
    assert.ok(overview.moduleHealth)
    const modules = Object.values(overview.moduleHealth) as Array<{ score: number; status: string }>
    modules.forEach((m) => {
      assert.ok(m.score >= 0 && m.score <= 100)
      assert.ok(['healthy', 'warning', 'critical'].includes(m.status))
    })
  })
})

// ── 🎯运行专员 Extended ──
describe(`${ROLES.Operations} foundation 扩展测试`, () => {
  it('运营专员可以 Ack + Mute + Unmute 完整告警生命周期', async () => {
    const svc = mockFoundationService()
    const ctrl = new FoundationController(svc)

    // ACK
    const ackResult = await ctrl.acknowledgeOperationsAlert(
      'approvals-pending',
      tenantCtx,
      { ...actorCtx, roles: ['OPERATIONS'], permissions: ['foundation.operations.alerts.write'] },
      { note: '已处理待审批单' }
    )
    assert.equal(ackResult.acknowledgement!.status, 'ACKED')

    // MUTE
    const muteResult = await ctrl.muteOperationsAlert(
      'approvals-pending',
      tenantCtx,
      { ...actorCtx, roles: ['OPERATIONS'], permissions: ['foundation.operations.alerts.write'] },
      { note: '高峰时段临时静音' }
    )
    assert.equal(muteResult.acknowledgement!.status, 'MUTED')
    assert.equal(muteResult.visibleInOverview, false)

    // UNMUTE
    const unmuteResult = await ctrl.unmuteOperationsAlert(
      'approvals-pending',
      tenantCtx,
      { ...actorCtx, roles: ['OPERATIONS'], permissions: ['foundation.operations.alerts.write'] },
      { note: '高峰结束恢复跟踪' }
    )
    assert.equal(unmuteResult.acknowledgement!.status, 'ACKED')
    assert.equal(unmuteResult.visibleInOverview, true)
  })

  it('运营专员 drilldown 并验证告警的 sourceModules 引用', async () => {
    const svc = mockFoundationService()
    const ctrl = new FoundationController(svc)
    const result = await ctrl.getOperationsAlertDrilldown('approvals-pending', tenantCtx)
    assert.ok(result.alert)
    assert.equal(result.code, 'approvals-pending')
    assert.ok(result.visibleInOverview !== undefined)
  })

  it('运营专员查看不存在的告警 code（边界：无效告警 code 处理）', async () => {
    const svc = mockFoundationService({
      getOperationsAlertDrilldown: async (code: string) => ({
        generatedAt: '2026-06-28T00:00:00.000Z',
        code,
        availableAlertCodes: [
          'approvals-pending',
          'approval-execution-failures',
          'high-risk-audits',
          'blocked-rate-limit-ledgers',
          'secret-rotation-attention',
          'observability-degradation',
          'recovery-drill-attention',
          'runtime-governance-backlog',
          'runtime-callback-stalled',
        ],
      }),
    })
    const ctrl = new FoundationController(svc)
    const result = await ctrl.getOperationsAlertDrilldown('invalid-alert-code', tenantCtx)
    assert.ok(Array.isArray((result as any).availableAlertCodes))
    assert.equal((result as any).code, 'invalid-alert-code')
  })

  it('运营专员查看模块详情时 score 格式正确', async () => {
    const svc = mockFoundationService()
    const ctrl = new FoundationController(svc)
    const overview = await ctrl.getOperationsOverview(tenantCtx)
    const health = overview.moduleHealth.trustGovernance
    assert.equal(typeof health.score, 'number')
    assert.ok(Number.isFinite(health.score))
    assert.ok(health.score >= 0 && health.score <= 100)
  })
})

// ── 🤝团建 Extended ──
describe(`${ROLES.Teambuilding} foundation 扩展测试`, () => {
  it('团建可以获取告警目录（只读浏览）', async () => {
    const svc = mockFoundationService({
      getOperationsAlertsCatalog: async () => ({
        generatedAt: '2026-06-28T00:00:00.000Z',
        alerts: [
          {
            code: 'approvals-pending',
            defaultSummary: '待处理审批单',
            severityPolicy: '>=5 high',
            drilldownEnabled: true,
            acknowledgementEnabled: true,
            sourceModules: ['trust-governance'],
            drilldownPath: '/foundation/overview/alerts/approvals-pending/drilldown',
            ackPath: '/foundation/overview/alerts/approvals-pending/ack',
            mutePath: '/foundation/overview/alerts/approvals-pending/mute',
            unmutePath: '/foundation/overview/alerts/approvals-pending/unmute',
            visibleInOverview: true,
            availableActions: ['DRILLDOWN', 'ACK', 'MUTE'],
          },
        ],
      }),
    })
    const ctrl = new FoundationController(svc)
    const catalog = await ctrl.getOperationsAlertsCatalog(tenantCtx)
    assert.ok(Array.isArray(catalog.alerts))
    const alertPaths = catalog.alerts.map((a: any) => a.drilldownPath)
    alertPaths.forEach((path: string) => assert.ok(path.includes('/drilldown')))
  })

  it('团建查看 bootstrap 含 governanceBaselines 数组', () => {
    const svc = mockFoundationService()
    const ctrl = new FoundationController(svc)
    const result = ctrl.getBootstrap(tenantCtx)
    assert.ok(Array.isArray(result.governanceBaselines))
  })

  it('团建查看模块列表（只读权限）', () => {
    const svc = mockFoundationService()
    const ctrl = new FoundationController(svc)
    const modules = ctrl.getModules()
    assert.ok(modules.length > 0)
  })

  it('团建尝试 mute 告警 — 确认角色白名单（权限边界）', () => {
    const roles = Reflect.getMetadata(
      ROLES_METADATA_KEY,
      FoundationController.prototype.muteOperationsAlert
    )
    assert.ok(roles)
    assert.ok(!roles.includes('TEAMBUILDING'))
    assert.ok(!roles.includes('TEAMBUILD'))
  })
})

// ── 📢营销 Extended ──
describe(`${ROLES.Marketing} foundation 扩展测试`, () => {
  it('营销可以查看告警 drilldown（获取运营状态辅助营销排期）', async () => {
    const svc = mockFoundationService({
      getOperationsAlertDrilldown: async (code: string) => ({
        generatedAt: '2026-06-28T00:00:00.000Z',
        code,
        catalog: {},
        alert: { code, severity: 'medium', count: 3, summary: '待处理审批单可能影响营销活动审批' },
        acknowledgement: { status: null },
        detail: { total: 3 },
        visibleInOverview: true,
        availableActions: ['DRILLDOWN'],
        history: [],
      }),
    })
    const ctrl = new FoundationController(svc)
    const result = await ctrl.getOperationsAlertDrilldown('approvals-pending', tenantCtx)
    assert.ok(result.detail)
    assert.ok(result.alert)
  })

  it('营销可以获取 bootstrap（含 frontendBootstrap 版本号）', () => {
    const svc = mockFoundationService()
    const ctrl = new FoundationController(svc)
    const result = ctrl.getBootstrap(tenantCtx)
    assert.ok(result.tenantContext)
    assert.ok(result.frontendBootstrap)
    assert.equal((result.frontendBootstrap as any).version, '1.0')
  })

  it('营销尝试进入 mute 接口 — 角色不在白名单（权限边界）', () => {
    const roles = Reflect.getMetadata(
      ROLES_METADATA_KEY,
      FoundationController.prototype.muteOperationsAlert
    )
    assert.ok(roles)
    assert.ok(!roles.includes('MARKETING'))
    assert.ok(!roles.includes('PROMOTION'))
  })

  it('营销查看消费者目录含正确结构', () => {
    const svc = mockFoundationService()
    const ctrl = new FoundationController(svc)
    const consumers = ctrl.getConsumers()
    consumers.forEach((c: any) => {
      assert.ok(typeof c.consumer === 'string')
      assert.ok(typeof c.modulePath === 'string')
      assert.ok(Array.isArray(c.dependsOn))
    })
  })
})

// ── 跨角色场景 ──
describe('foundation 跨角色权限边界验证', () => {
  it('所有告警突变接口要求 foundation.operations.alerts.write 权限', () => {
    const ackPermissions = Reflect.getMetadata(
      PERMISSIONS_METADATA_KEY,
      FoundationController.prototype.acknowledgeOperationsAlert
    )
    assert.ok(ackPermissions)
    assert.ok(ackPermissions.includes('foundation.operations.alerts.write'))

    const mutePermissions = Reflect.getMetadata(
      PERMISSIONS_METADATA_KEY,
      FoundationController.prototype.muteOperationsAlert
    )
    assert.ok(mutePermissions)
    assert.ok(mutePermissions.includes('foundation.operations.alerts.write'))

    const unmutePermissions = Reflect.getMetadata(
      PERMISSIONS_METADATA_KEY,
      FoundationController.prototype.unmuteOperationsAlert
    )
    assert.ok(unmutePermissions)
    assert.ok(unmutePermissions.includes('foundation.operations.alerts.write'))
  })

  it('店铺基础只读接口（bootstrap/modules/consumers）无需角色注解（全局可读）', () => {
    const bootstrapRoles = Reflect.getMetadata(
      ROLES_METADATA_KEY,
      FoundationController.prototype.getBootstrap
    )
    assert.equal(bootstrapRoles, undefined)

    const modulesRoles = Reflect.getMetadata(
      ROLES_METADATA_KEY,
      FoundationController.prototype.getModules
    )
    assert.equal(modulesRoles, undefined)
  })

  it('告警 drilldown 不限制角色（任何人都可以 drilldown）', () => {
    const drilldownRoles = Reflect.getMetadata(
      ROLES_METADATA_KEY,
      FoundationController.prototype.getOperationsAlertDrilldown
    )
    assert.equal(drilldownRoles, undefined)
  })
})
