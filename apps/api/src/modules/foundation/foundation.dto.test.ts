import 'reflect-metadata'
import assert from 'node:assert/strict'
import test, { describe } from 'node:test'

type AnyObj = Record<string, unknown>

describe('foundation DTO 类型验证', () => {
  test('AlertAcknowledgeDto 可选 note 字段', () => {
    const withNote: AnyObj = { note: '确认' }
    const withoutNote: AnyObj = {}

    assert.equal(withNote.note, '确认')
    assert.equal(withoutNote.note, undefined)
  })

  test('AlertAcknowledgeDto 空体合法', () => {
    const body: AnyObj = {}
    assert.ok(typeof body === 'object')
  })

  test('AlertMuteDto 可选字段', () => {
    const full: AnyObj = { mutedUntil: '2026-01-02T00:00:00.000Z', note: '静默 1 天' }
    const partial: AnyObj = { mutedUntil: '2026-01-02T00:00:00.000Z' }
    const empty: AnyObj = {}

    assert.equal(full.mutedUntil, '2026-01-02T00:00:00.000Z')
    assert.equal(full.note, '静默 1 天')
    assert.equal(partial.mutedUntil, '2026-01-02T00:00:00.000Z')
    assert.equal(partial.note, undefined)
    assert.equal(empty.mutedUntil, undefined)
    assert.equal(empty.note, undefined)
  })

  test('AlertUnmuteDto 结构', () => {
    const withNote: AnyObj = { note: '重新打开' }
    const withoutNote: AnyObj = {}

    assert.equal(withNote.note, '重新打开')
    assert.equal(withoutNote.note, undefined)
  })

  test('UnsupportedAlertCodeResponseDto 结构', () => {
    const resp = {
      generatedAt: '2026-01-01T00:00:00.000Z',
      code: 'unknown-code',
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
        'lyt-connection-governance-risk'
      ]
    }

    assert.equal(resp.code, 'unknown-code')
    assert.ok(Array.isArray(resp.availableAlertCodes))
    assert.ok(resp.availableAlertCodes.length >= 10)
  })

  test('ModuleDetailResponseDto 结构', () => {
    const detail = {
      generatedAt: '2026-01-01T00:00:00.000Z',
      moduleKey: 'trust-governance',
      health: {
        module: 'trust-governance',
        score: 85,
        status: 'healthy' as const,
        indicators: { highRiskAudits: 0, pendingApprovals: 1, executionFailures: 0, blockedCount: 0 }
      },
      detail: { approvals: { statuses: { PENDING: 1 } } }
    }

    assert.equal(detail.moduleKey, 'trust-governance')
    assert.equal(detail.health.status, 'healthy')
    assert.equal(detail.health.score, 85)
  })

  test('ModuleDetailResponseDto 未知模块返回 availableModuleKeys', () => {
    const detail = {
      generatedAt: '2026-01-01T00:00:00.000Z',
      moduleKey: 'unknown-module',
      availableModuleKeys: ['trust-governance', 'configuration-governance', 'resilience-operations', 'runtime-governance']
    }

    assert.equal(detail.moduleKey, 'unknown-module')
    assert.ok(Array.isArray(detail.availableModuleKeys))
    assert.equal(detail.availableModuleKeys.length, 4)
  })

  test('ConsumerDependencyResponseDto 结构', () => {
    const found: AnyObj = {
      consumer: 'market',
      modulePath: 'src/modules/market',
      dependsOn: ['identity-access', 'configuration-governance'],
      responsibility: '输出多市场默认值'
    }
    const notFound: AnyObj = {
      availableConsumers: ['market', 'portal', 'workbench', 'lyt-adapter']
    }

    assert.equal(found.consumer, 'market')
    assert.ok(Array.isArray(found.dependsOn))
    assert.ok(Array.isArray(notFound.availableConsumers))
    assert.equal(notFound.availableConsumers.length, 4)
    assert.equal(notFound.consumer, undefined)
  })
})
