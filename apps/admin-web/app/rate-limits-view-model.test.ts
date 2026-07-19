import assert from 'node:assert/strict'
import test, { describe } from 'node:test'
import {
  type QuotaLedgerRecord,
  type RateLimitPolicyRecord,
  buildRateLimitsHref
} from '@m5/types'
import {
  RATE_LIMIT_ALGORITHM_LABEL,
  RATE_LIMIT_PERIOD_LABEL,
  RATE_LIMIT_SCOPE_LABEL,
  isLedgerBlocked,
  isPolicyActive,
  ledgerConsumptionRatio,
  loadRateLimitWorkspace,
  summarizeLedger,
  summarizePolicy
} from './rate-limits-view-model'

const SAMPLE_POLICY: RateLimitPolicyRecord = {
  id: 'policy-1',
  code: 'foundation.api.tenant',
  scopeType: 'TENANT',
  tenantId: 'tenant-demo',
  brandId: null,
  storeId: null,
  integrationAppId: null,
  period: 'MINUTE',
  limit: 600,
  burstLimit: 800,
  dimensionKeys: ['scopeKey'],
  algorithm: 'FIXED_WINDOW',
  metadata: { team: 'platform' },
  updatedAt: '2026-06-14T08:00:00.000Z'
}

const SAMPLE_LEDGER_BLOCKED: QuotaLedgerRecord = {
  id: 'ledger-1',
  subjectKey: 'tenant-demo',
  period: 'MINUTE',
  consumed: 600,
  remaining: 0,
  resetAt: '2026-06-14T08:01:00.000Z',
  metadata: { blockedUntil: '2099-01-01T00:00:00.000Z' },
  updatedAt: '2026-06-14T08:00:00.000Z',
  policy: { id: 'policy-1', code: SAMPLE_POLICY.code, limit: SAMPLE_POLICY.limit, period: SAMPLE_POLICY.period }
}

const SAMPLE_LEDGER_WARNING: QuotaLedgerRecord = {
  ...SAMPLE_LEDGER_BLOCKED,
  id: 'ledger-2',
  consumed: 520,
  remaining: 80,
  metadata: { team: 'platform' },
  resetAt: '2026-06-14T08:01:00.000Z',
  updatedAt: '2026-06-14T08:00:00.000Z'
}

const SAMPLE_LEDGER_HEALTHY: QuotaLedgerRecord = {
  ...SAMPLE_LEDGER_BLOCKED,
  id: 'ledger-3',
  consumed: 100,
  remaining: 500,
  metadata: { team: 'platform' },
  resetAt: '2026-06-14T08:01:00.000Z',
  updatedAt: '2026-06-14T08:00:00.000Z'
}

describe('rate-limits-view-model', () => {
  // ── 正例: buildRateLimitsHref ──

  test('buildRateLimitsHref omits empty query', () => {
    assert.equal(buildRateLimitsHref(), '/rate-limits')
  })

  test('buildRateLimitsHref encodes all provided params', () => {
    assert.equal(
      buildRateLimitsHref({ tenantId: 't1', policyCode: 'p', subjectKey: 's', status: 'healthy' }),
      '/rate-limits?tenantId=t1&policyCode=p&subjectKey=s&status=healthy'
    )
  })

  test('buildRateLimitsHref includes only tenantId', () => {
    assert.equal(
      buildRateLimitsHref({ tenantId: 't1' }),
      '/rate-limits?tenantId=t1'
    )
  })

  // ── 正例: label maps ──

  test('RATE_LIMIT_PERIOD_LABEL covers all periods', () => {
    assert.equal(RATE_LIMIT_PERIOD_LABEL.MINUTE, '分钟')
    assert.equal(RATE_LIMIT_PERIOD_LABEL.HOUR, '小时')
    assert.equal(RATE_LIMIT_PERIOD_LABEL.DAY, '天')
  })

  test('RATE_LIMIT_SCOPE_LABEL covers all scopes', () => {
    assert.equal(RATE_LIMIT_SCOPE_LABEL.STORE, '门店')
    assert.equal(RATE_LIMIT_SCOPE_LABEL.BRAND, '品牌')
    assert.equal(RATE_LIMIT_SCOPE_LABEL.TENANT, '租户')
    assert.equal(RATE_LIMIT_SCOPE_LABEL.PLATFORM, '平台')
  })

  test('RATE_LIMIT_ALGORITHM_LABEL covers all algorithms', () => {
    assert.equal(RATE_LIMIT_ALGORITHM_LABEL.TOKEN_BUCKET, '令牌桶')
    assert.equal(RATE_LIMIT_ALGORITHM_LABEL.FIXED_WINDOW, '固定窗口')
    assert.equal(RATE_LIMIT_ALGORITHM_LABEL.SLIDING_WINDOW, '滑动窗口')
  })

  // ── 正例/反例: isPolicyActive ──

  test('isPolicyActive reflects limit > 0', () => {
    assert.equal(isPolicyActive({ ...SAMPLE_POLICY, limit: 0 }), false)
    assert.equal(isPolicyActive(SAMPLE_POLICY), true)
  })

  test('isPolicyActive handles negative limit', () => {
    assert.equal(isPolicyActive({ ...SAMPLE_POLICY, limit: -1 }), false)
  })

  // ── 正例/反例: isLedgerBlocked ──

  test('isLedgerBlocked parses metadata.blockedUntil', () => {
    const now = Date.parse('2026-06-14T08:00:00.000Z')
    assert.equal(isLedgerBlocked(SAMPLE_LEDGER_BLOCKED, now), true)
    assert.equal(isLedgerBlocked(SAMPLE_LEDGER_WARNING, now), false)
    assert.equal(isLedgerBlocked(SAMPLE_LEDGER_HEALTHY, now), false)
  })

  test('isLedgerBlocked handles ledger without metadata', () => {
    const noMeta: QuotaLedgerRecord = { ...SAMPLE_LEDGER_HEALTHY, metadata: undefined }
    assert.equal(isLedgerBlocked(noMeta, Date.now()), false)
  })

  test('isLedgerBlocked handles expired blockedUntil', () => {
    const expired: QuotaLedgerRecord = {
      ...SAMPLE_LEDGER_BLOCKED,
      metadata: { blockedUntil: '2020-01-01T00:00:00.000Z' }
    }
    assert.equal(isLedgerBlocked(expired, Date.parse('2026-06-14T08:00:00.000Z')), false)
  })

  // ── 正例/反例: ledgerConsumptionRatio ──

  test('ledgerConsumptionRatio respects limit boundary', () => {
    assert.equal(ledgerConsumptionRatio(SAMPLE_LEDGER_BLOCKED), 1)
    assert.ok(ledgerConsumptionRatio(SAMPLE_LEDGER_WARNING) > 0.85)
    assert.ok(ledgerConsumptionRatio(SAMPLE_LEDGER_HEALTHY) < 0.2)
  })

  test('ledgerConsumptionRatio handles zero limit', () => {
    const zeroLimit: QuotaLedgerRecord = {
      ...SAMPLE_LEDGER_HEALTHY,
      policy: { ...SAMPLE_LEDGER_HEALTHY.policy, limit: 0 }
    }
    assert.equal(ledgerConsumptionRatio(zeroLimit), 0)
  })

  test('ledgerConsumptionRatio caps at 1', () => {
    const overLimit: QuotaLedgerRecord = {
      ...SAMPLE_LEDGER_BLOCKED,
      consumed: 1200,
      policy: { ...SAMPLE_LEDGER_BLOCKED.policy, limit: 600 }
    }
    assert.equal(ledgerConsumptionRatio(overLimit), 1)
  })

  // ── 正例: summarize helpers ──

  test('summarizePolicy includes code, scope, tenant, algorithm', () => {
    const summary = summarizePolicy(SAMPLE_POLICY)
    assert.ok(summary.includes('foundation.api.tenant'))
    assert.ok(summary.includes('租户'))
    assert.ok(summary.includes('分钟'))
    assert.ok(summary.includes('固定窗口'))
  })

  test('summarizePolicy handles store scope without tenant', () => {
    const storePolicy: RateLimitPolicyRecord = {
      ...SAMPLE_POLICY,
      code: 'store.api.limit',
      scopeType: 'STORE',
      tenantId: null,
      algorithm: 'TOKEN_BUCKET',
      period: 'HOUR'
    }
    const summary = summarizePolicy(storePolicy)
    assert.ok(summary.includes('门店'))
    assert.ok(summary.includes('小时'))
    assert.ok(summary.includes('令牌桶'))
    assert.ok(!summary.includes('租户'))
  })

  test('summarizeLedger includes code, subjectKey, consumption', () => {
    const ledgerSummary = summarizeLedger(SAMPLE_LEDGER_BLOCKED)
    assert.ok(ledgerSummary.includes('foundation.api.tenant'))
    assert.ok(ledgerSummary.includes('已封禁'))
    assert.ok(ledgerSummary.includes('600'))
  })

  test('summarizeLedger for healthy ledger without blocked banner', () => {
    const summary = summarizeLedger(SAMPLE_LEDGER_HEALTHY)
    assert.ok(summary.includes('foundation.api.tenant'))
    assert.ok(summary.includes('100'))
    assert.ok(!summary.includes('已封禁'))
  })

  // ── 正例/反例: loadRateLimitWorkspace ──

  test('loadRateLimitWorkspace returns fallback when fetch fails', async () => {
    const originalFetch = globalThis.fetch
    globalThis.fetch = (async () => new Response('boom', { status: 500 })) as typeof fetch
    try {
      const snapshot = await loadRateLimitWorkspace({ tenantId: 'tenant-demo' })
      assert.equal(snapshot.deliveryMode, 'fallback')
      assert.equal(snapshot.workspace.totals.policies, 0)
      assert.equal(snapshot.workspace.totals.ledgers, 0)
    } finally {
      globalThis.fetch = originalFetch
    }
  })

  test('loadRateLimitWorkspace returns API delivery when SDK returns workspace', async () => {
    const originalFetch = globalThis.fetch
    globalThis.fetch = (async (input: RequestInfo | URL) => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url
      if (url.includes('/rate-limit/policies')) {
        return new Response(JSON.stringify({ code: 'OK', message: '', data: [SAMPLE_POLICY] }), {
          status: 200,
          headers: { 'content-type': 'application/json' }
        })
      }
      if (url.includes('/rate-limit/ledgers')) {
        return new Response(JSON.stringify({ code: 'OK', message: '', data: [SAMPLE_LEDGER_BLOCKED, SAMPLE_LEDGER_WARNING, SAMPLE_LEDGER_HEALTHY] }), {
          status: 200,
          headers: { 'content-type': 'application/json' }
        })
      }
      return new Response('not-found', { status: 404 })
    }) as typeof fetch
    try {
      const snapshot = await loadRateLimitWorkspace({ tenantId: 'tenant-demo' })
      assert.equal(snapshot.deliveryMode, 'api')
      assert.equal(snapshot.workspace.totals.policies, 1)
      assert.equal(snapshot.workspace.totals.ledgers, 3)
      assert.equal(snapshot.workspace.policies[0]?.code, 'foundation.api.tenant')
      assert.equal(snapshot.workspace.byPeriod.MINUTE, 1)
    } finally {
      globalThis.fetch = originalFetch
    }
  })

  test('loadRateLimitWorkspace returns fallback when only one endpoint fails', async () => {
    const originalFetch = globalThis.fetch
    globalThis.fetch = (async (input: RequestInfo | URL) => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url
      if (url.includes('/rate-limit/policies')) {
        return new Response(JSON.stringify({ code: 'OK', message: '', data: [SAMPLE_POLICY] }), {
          status: 200,
          headers: { 'content-type': 'application/json' }
        })
      }
      return new Response('Server Error', { status: 500 })
    }) as typeof fetch
    try {
      const snapshot = await loadRateLimitWorkspace({ tenantId: 'tenant-demo' })
      assert.equal(snapshot.deliveryMode, 'fallback')
    } finally {
      globalThis.fetch = originalFetch
    }
  })
})
