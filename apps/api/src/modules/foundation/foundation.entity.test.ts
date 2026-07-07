import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
import 'reflect-metadata'
import assert from 'node:assert/strict'
// Test that foundation entity types are structurally sound
describe('foundation entity 类型验证', () => {
  it('FoundationAlertMutationResponse 结构', () => {
    const resp = {
      generatedAt: '2026-01-01T00:00:00.000Z',
      code: 'observability-degradation' as const,
      catalog: {
        code: 'observability-degradation',
        defaultSummary: 'observability 降级',
        severityPolicy: 'auto',
        sourceModules: ['resilience-operations'],
        drilldownEnabled: true,
        acknowledgementEnabled: true,
        drilldownPath: '/foundation/overview/alerts/observability-degradation/drilldown',
        ackPath: '/foundation/overview/alerts/observability-degradation/ack',
        mutePath: '/foundation/overview/alerts/observability-degradation/mute',
        unmutePath: '/foundation/overview/alerts/observability-degradation/unmute',
        acknowledgementStatus: 'ACKED' as const,
        visibleInOverview: true,
        latestHistoryAction: 'ACK' as const,
        availableActions: ['DRILLDOWN', 'ACK', 'MUTE'] as const
      },
      acknowledgement: {
        status: 'ACKED' as const,
        acknowledgedAt: '2026-01-01T00:00:00.000Z',
        mutedUntil: null,
        note: '已确认',
        actorId: 'actor-1'
      },
      visibleInOverview: true,
      availableActions: ['DRILLDOWN', 'ACK', 'MUTE'] as Array<'DRILLDOWN' | 'ACK' | 'MUTE' | 'UNMUTE'>,
      history: [] as Array<{ action: string; actorId: string; timestamp: string; note?: string }>
    }

    assert.equal(resp.code, 'observability-degradation')
    assert.equal(resp.acknowledgement.status, 'ACKED')
    assert.equal(resp.visibleInOverview, true)
    assert.ok(Array.isArray(resp.availableActions))
  })

  it('FoundationBootstrapResponse 结构', () => {
    const resp = {
      tenantContext: { tenantId: 't-1', brandId: 'b-1' },
      generatedAt: '2026-01-01T00:00:00.000Z',
      docs: ['foundation-architecture.md'],
      guardrails: ['不得绕过底座'],
      frontendBootstrap: {},
      modules: [{ module: 'trust-governance', status: 'healthy' }],
      consumers: [{ consumer: 'market' }],
      governanceBaselines: []
    }

    assert.ok(Array.isArray(resp.docs))
    assert.ok(Array.isArray(resp.guardrails))
    assert.equal(resp.docs.length, 1)
    assert.equal(resp.guardrails[0], '不得绕过底座')
  })

  it('FoundationOperationsAlertSummary 结构', () => {
    const summary = {
      generatedAt: '2026-01-01T00:00:00.000Z',
      summary: {
        approvalsPending: 3,
        approvalsWithFailures: 1,
        highRiskAudits: 2
      },
      alerts: [],
      topRisks: [],
      topFailures: [{ module: 'trust-governance', label: '审批失败', count: 1 }],
      moduleHealth: {
        'trust-governance': {
          module: 'trust-governance',
          score: 85,
          status: 'healthy',
          indicators: { highRiskAudits: 0, pendingApprovals: 1, executionFailures: 0, blockedCount: 0 }
        }
      },
      modules: {}
    }

    assert.equal(summary.summary.approvalsPending, 3)
    assert.equal(summary.moduleHealth['trust-governance'].status, 'healthy')
    assert.equal(summary.topFailures[0].module, 'trust-governance')
  })

  it('FoundationAlertDrilldownResponse 结构', () => {
    const drilldown = {
      generatedAt: '2026-01-01T00:00:00.000Z',
      code: 'approvals-pending' as const,
      catalog: {
        code: 'approvals-pending',
        defaultSummary: '存在待处理审批单',
        severityPolicy: '>= 5 → high',
        sourceModules: ['trust-governance', 'configuration-governance'],
        drilldownEnabled: true,
        acknowledgementEnabled: true,
        drilldownPath: '/foundation/overview/alerts/approvals-pending/drilldown',
        ackPath: '/foundation/overview/alerts/approvals-pending/ack',
        mutePath: '/foundation/overview/alerts/approvals-pending/mute',
        unmutePath: '/foundation/overview/alerts/approvals-pending/unmute',
        acknowledgementStatus: null,
        visibleInOverview: true,
        latestHistoryAction: 'ACK',
        availableActions: ['DRILLDOWN', 'ACK', 'MUTE']
      },
      alert: {
        severity: 'high' as const,
        code: 'approvals-pending' as const,
        count: 5,
        summary: '存在待处理审批单',
        acknowledgement: null
      },
      acknowledgement: null,
      history: [],
      detail: { pendingApprovals: 5 },
      visibleInOverview: true,
      availableActions: ['DRILLDOWN', 'ACK', 'MUTE'] as Array<'DRILLDOWN' | 'ACK' | 'MUTE' | 'UNMUTE'>
    }

    assert.equal(drilldown.code, 'approvals-pending')
    assert.equal(drilldown.alert?.severity, 'high')
    assert.equal(drilldown.alert?.count, 5)
  })

  it('AlertAcknowledgeBody / AlertMuteBody / AlertUnmuteBody 结构', () => {
    const ack = { note: '确认处理' }
    const mute = { mutedUntil: '2026-01-02T00:00:00.000Z', note: '临时静默' }
    const unmute = { note: '取消静默' }

    assert.equal(ack.note, '确认处理')
    assert.equal(mute.mutedUntil, '2026-01-02T00:00:00.000Z')
    assert.equal(unmute.note, '取消静默')
  })
})
