import assert from 'node:assert/strict'
import test, { describe } from 'node:test'
import {
  AuditRiskLevel,
  AiReviewVerdict,
  type RateLimitDecision,
  type RateLimitState,
  type RateLimitPolicyRecord,
  type QuotaLedgerRecord,
  type AuditRecord,
  type AiReviewResult,
  type GovernanceOperationResult,
  type AuditSummary,
  type GovernanceOverview
} from './trust-governance.entity'

describe('trust-governance entity - AuditRiskLevel', () => {
  test('Low 等于 "low"', () => {
    assert.equal(AuditRiskLevel.Low, 'low')
  })

  test('Medium 等于 "medium"', () => {
    assert.equal(AuditRiskLevel.Medium, 'medium')
  })

  test('High 等于 "high"', () => {
    assert.equal(AuditRiskLevel.High, 'high')
  })
})

describe('trust-governance entity - AiReviewVerdict', () => {
  test('Approved 等于 "approved"', () => {
    assert.equal(AiReviewVerdict.Approved, 'approved')
  })

  test('ApprovedWithGuardrails 等于 "approved-with-guardrails"', () => {
    assert.equal(AiReviewVerdict.ApprovedWithGuardrails, 'approved-with-guardrails')
  })

  test('ManualReview 等于 "manual-review"', () => {
    assert.equal(AiReviewVerdict.ManualReview, 'manual-review')
  })
})

describe('trust-governance entity - RateLimitDecision type', () => {
  test('符合 RateLimitDecision 结构', () => {
    const decision: RateLimitDecision = {
      allowed: true,
      scopeKey: 'tenant-demo:user-1',
      limit: 100,
      remaining: 99,
      retryAfterSeconds: 0,
      state: {
        count: 1,
        remaining: 99,
        resetAt: '2026-06-14T12:00:00.000Z',
        blockedUntil: null,
        lastSeenAt: '2026-06-14T11:00:00.000Z'
      }
    }
    assert.ok(decision.allowed)
    assert.equal(decision.scopeKey, 'tenant-demo:user-1')
    assert.equal(decision.limit, 100)
    assert.equal(decision.remaining, 99)
    assert.equal(decision.retryAfterSeconds, 0)
  })

  test('RateLimitDecision - 封禁场景', () => {
    const state: RateLimitState = {
      count: 101,
      remaining: 0,
      resetAt: '2026-06-14T12:00:00.000Z',
      blockedUntil: '2026-06-14T11:30:00.000Z',
      lastSeenAt: '2026-06-14T11:03:00.000Z'
    }
    const decision: RateLimitDecision = {
      allowed: false,
      scopeKey: 'abuser-ip',
      limit: 100,
      remaining: 0,
      retryAfterSeconds: 300,
      state
    }
    assert.equal(decision.allowed, false)
    assert.equal(decision.remaining, 0)
    assert.ok(decision.retryAfterSeconds > 0)
    assert.ok(typeof decision.state.blockedUntil === 'string')
  })
})

describe('trust-governance entity - RateLimitPolicyRecord type', () => {
  test('符合 RateLimitPolicyRecord 结构', () => {
    const policy: RateLimitPolicyRecord = {
      id: 'policy-001',
      code: 'api-default',
      scopeType: 'TENANT' as any,
      tenantId: 'tenant-demo',
      brandId: null,
      storeId: null,
      integrationAppId: null,
      period: 'MINUTE' as any,
      limit: 60,
      burstLimit: 120,
      dimensionKeys: ['scopeKey'],
      algorithm: 'FIXED_WINDOW',
      metadata: { runtimeManaged: true },
      updatedAt: '2026-06-14T10:00:00.000Z'
    }
    assert.equal(policy.id, 'policy-001')
    assert.equal(policy.code, 'api-default')
    assert.equal(policy.limit, 60)
    assert.equal(policy.burstLimit, 120)
    assert.equal(policy.algorithm, 'FIXED_WINDOW')
    assert.deepEqual(policy.dimensionKeys, ['scopeKey'])
  })

  test('RateLimitPolicyRecord - 品牌级别策略', () => {
    const policy: RateLimitPolicyRecord = {
      id: 'policy-002',
      code: 'brand-premium-api',
      scopeType: 'BRAND' as any,
      tenantId: 'tenant-premium',
      brandId: 'brand-a',
      storeId: null,
      integrationAppId: null,
      period: 'HOUR' as any,
      limit: 1000,
      burstLimit: 2000,
      dimensionKeys: ['scopeKey', 'deviceId'],
      algorithm: 'TOKEN_BUCKET',
      metadata: {},
      updatedAt: '2026-06-14T09:00:00.000Z'
    }
    assert.equal(policy.scopeType, 'BRAND' as any)
    assert.equal(policy.brandId, 'brand-a')
    assert.equal(policy.algorithm, 'TOKEN_BUCKET')
    assert.equal(policy.dimensionKeys.length, 2)
  })
})

describe('trust-governance entity - QuotaLedgerRecord type', () => {
  test('符合 QuotaLedgerRecord 结构', () => {
    const ledger: QuotaLedgerRecord = {
      id: 'ledger-001',
      subjectKey: 'tenant-demo',
      period: 'MINUTE' as any,
      consumed: 42,
      remaining: 18,
      resetAt: '2026-06-14T11:01:00.000Z',
      policy: {
        id: 'policy-001',
        code: 'api-default',
        limit: 60,
        period: 'MINUTE' as any
      },
      metadata: { windowSeconds: 60 },
      updatedAt: '2026-06-14T11:00:30.000Z'
    }
    assert.equal(ledger.id, 'ledger-001')
    assert.equal(ledger.subjectKey, 'tenant-demo')
    assert.equal(ledger.consumed, 42)
    assert.equal(ledger.remaining, 18)
    assert.equal(ledger.policy.code, 'api-default')
    assert.equal(ledger.policy.limit, 60)
  })

  test('QuotaLedgerRecord - 配额耗尽', () => {
    const ledger: QuotaLedgerRecord = {
      id: 'ledger-exhausted',
      subjectKey: 'heavy-user',
      period: 'DAY' as any,
      consumed: 1000,
      remaining: 0,
      resetAt: '2026-06-15T00:00:00.000Z',
      policy: {
        id: 'policy-003',
        code: 'daily-limit',
        limit: 1000,
        period: 'DAY' as any
      },
      metadata: { blockedUntil: '2026-06-15T00:00:00.000Z' },
      updatedAt: '2026-06-14T10:00:00.000Z'
    }
    assert.equal(ledger.consumed, ledger.policy.limit)
    assert.equal(ledger.remaining, 0)
  })
})

describe('trust-governance entity - AuditRecord type', () => {
  test('符合 AuditRecord 结构', () => {
    const record: AuditRecord = {
      auditId: 'audit-001',
      eventType: 'foundation.approval.approved',
      tenantId: 'tenant-demo',
      actorId: 'user-admin-1',
      source: 'trust-governance',
      riskLevel: AuditRiskLevel.Medium,
      occurredAt: '2026-06-14T10:00:00.000Z',
      details: {
        approvalTicket: 'APR-ORDERCR-ABC12345',
        operation: 'quota-ledger.reset',
        resourceType: 'quota-ledger',
        resourceKey: 'api-default::'
      }
    }
    assert.equal(record.auditId, 'audit-001')
    assert.equal(record.eventType, 'foundation.approval.approved')
    assert.equal(record.riskLevel, 'medium')
    assert.equal(record.actorId, 'user-admin-1')
    assert.ok(record.details.approvalTicket)
  })

  test('AuditRecord - 高风险审计', () => {
    const record: AuditRecord = {
      auditId: 'audit-high-001',
      eventType: 'foundation.approval.execution-failed',
      tenantId: 'tenant-demo',
      actorId: 'system-auto',
      source: 'trust-governance',
      riskLevel: AuditRiskLevel.High,
      occurredAt: '2026-06-14T10:05:00.000Z',
      details: {
        failureStatus: 'reset-bulk-failed',
        failureReason: 'Database connection timeout'
      }
    }
    assert.equal(record.riskLevel, AuditRiskLevel.High)
    assert.equal(record.details.failureStatus, 'reset-bulk-failed')
  })
})

describe('trust-governance entity - AiReviewResult type', () => {
  test('符合 AiReviewResult 结构 - approved', () => {
    const result: AiReviewResult = {
      modelCode: 'gpt-4',
      tenantId: 'tenant-demo',
      purpose: 'member-segmentation',
      verdict: AiReviewVerdict.Approved,
      riskScore: 10,
      maskedPrompt: '帮我分析会员数据',
      findings: [],
      budget: {
        monthlyBudgetTokens: 50000,
        remainingTokens: 45000
      },
      controls: ['prompt-template', 'cost-budget']
    }
    assert.equal(result.verdict, 'approved')
    assert.equal(result.riskScore, 10)
    assert.equal(result.findings.length, 0)
    assert.equal(result.budget.remainingTokens, 45000)
  })

  test('符合 AiReviewResult 结构 - manual-review', () => {
    const result: AiReviewResult = {
      modelCode: 'gpt-4',
      tenantId: 'tenant-demo',
      purpose: 'security-audit',
      verdict: AiReviewVerdict.ManualReview,
      riskScore: 85,
      maskedPrompt: '分析 密码 和 api_key 泄露风险',
      findings: ['提示词包含疑似敏感信息，建议先脱敏。', '提示词包含潜在越权或注入迹象。'],
      budget: {
        monthlyBudgetTokens: 20000,
        remainingTokens: 10000
      },
      controls: ['prompt-template', 'tool-permission', 'cost-budget', 'content-safety', 'human-fallback']
    }
    assert.equal(result.verdict, 'manual-review')
    assert.equal(result.riskScore, 85)
    assert.ok(result.findings.length >= 2)
    assert.equal(result.controls.length, 5)
  })
})

describe('trust-governance entity - GovernanceOperationResult type', () => {
  test('符合 GovernanceOperationResult 结构 - 成功', () => {
    const result: GovernanceOperationResult = {
      status: 'reset-single',
      count: 1,
      ledgers: []
    }
    assert.equal(result.status, 'reset-single')
    assert.equal(result.count, 1)
  })

  test('符合 GovernanceOperationResult 结构 - 审批拒绝', () => {
    const result: GovernanceOperationResult = {
      status: 'approval-rejected',
      count: 0,
      summary: 'Approval ticket was rejected by security admin'
    }
    assert.equal(result.status, 'approval-rejected')
    assert.equal(result.count, 0)
    assert.ok(result.summary)
  })
})

describe('trust-governance entity - AuditSummary type', () => {
  test('符合 AuditSummary 结构', () => {
    const summary: AuditSummary = {
      total: 150,
      byAction: {
        'foundation.approval.approved': 50,
        'foundation.approval.rejected': 30,
        'foundation.approval.cancelled': 20,
        'foundation.approval.executed': 30,
        'foundation.approval.execution-failed': 20
      },
      bySource: {
        'trust-governance': 100,
        'mobile-app': 50
      },
      byRiskLevel: {
        low: 60,
        medium: 70,
        high: 20
      }
    }
    assert.equal(summary.total, 150)
    assert.equal(summary.byRiskLevel.low, 60)
    assert.equal(summary.byRiskLevel.medium, 70)
    assert.equal(summary.byRiskLevel.high, 20)
    // 验证总数一致
    const riskTotal = summary.byRiskLevel.low + summary.byRiskLevel.medium + summary.byRiskLevel.high
    assert.equal(riskTotal, summary.total)
  })
})

describe('trust-governance entity - GovernanceOverview type', () => {
  test('符合 GovernanceOverview 结构', () => {
    const overview: GovernanceOverview = {
      generatedAt: '2026-06-14T11:00:00.000Z',
      approvals: {
        total: 50,
        statuses: { PENDING: 20, APPROVED: 15, REJECTED: 10, CANCELLED: 5 }
      },
      audits: {
        total: 100,
        byAction: { 'foundation.approval.approved': 40 },
        bySource: { 'trust-governance': 60 },
        byRiskLevel: { low: 40, medium: 50, high: 10 }
      },
      rateLimit: {
        policies: {
          total: 10,
          tenantScoped: 7,
          runtimeManaged: 3
        },
        ledgers: {
          total: 200,
          blocked: 5,
          exhausted: 15
        }
      }
    }
    assert.ok(typeof overview.generatedAt === 'string')
    assert.equal(overview.audits.total, 100)
    assert.equal(overview.rateLimit.policies.total, 10)
    assert.equal(overview.rateLimit.ledgers.blocked, 5)
    assert.equal(overview.rateLimit.ledgers.exhausted, 15)
  })
})
