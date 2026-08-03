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

const HOURLY_POLICY: RateLimitPolicyRecord = {
  id: 'policy-2',
  code: 'order.api.brand',
  scopeType: 'BRAND',
  tenantId: 'tenant-demo',
  brandId: 'brand-demo',
  storeId: null,
  integrationAppId: null,
  period: 'HOUR',
  limit: 10000,
  burstLimit: 15000,
  dimensionKeys: ['brandKey'],
  algorithm: 'SLIDING_WINDOW',
  metadata: { team: 'order' },
  updatedAt: '2026-06-14T09:00:00.000Z'
}

const DAILY_POLICY: RateLimitPolicyRecord = {
  id: 'policy-3',
  code: 'pos.api.store',
  scopeType: 'STORE',
  tenantId: 'tenant-demo',
  brandId: 'brand-demo',
  storeId: 'store-001',
  integrationAppId: null,
  period: 'DAY',
  limit: 50000,
  burstLimit: 80000,
  dimensionKeys: ['storeKey'],
  algorithm: 'TOKEN_BUCKET',
  metadata: { team: 'pos' },
  updatedAt: '2026-06-14T10:00:00.000Z'
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

const ZERO_LIMIT_POLICY: RateLimitPolicyRecord = {
  id: 'policy-0',
  code: 'test.disabled',
  scopeType: 'PLATFORM',
  tenantId: 'tenant-demo',
  brandId: null,
  storeId: null,
  integrationAppId: null,
  period: 'MINUTE',
  limit: 0,
  burstLimit: 0,
  dimensionKeys: [],
  algorithm: 'FIXED_WINDOW',
  metadata: {},
  updatedAt: '2026-06-14T07:00:00.000Z'
}

describe('rate-limits-view-model', () => {
  test('buildRateLimitsHref omits empty query', () => {
    assert.equal(buildRateLimitsHref(), '/rate-limits')
  })

  test('buildRateLimitsHref encodes all provided params', () => {
    assert.equal(
      buildRateLimitsHref({ tenantId: 't1', policyCode: 'p', subjectKey: 's', status: 'healthy' }),
      '/rate-limits?tenantId=t1&policyCode=p&subjectKey=s&status=healthy'
    )
  })

  test('buildRateLimitsHref with only policyCode', () => {
    assert.equal(
      buildRateLimitsHref({ policyCode: 'foundation.api.tenant' }),
      '/rate-limits?policyCode=foundation.api.tenant'
    )
  })

  test('buildRateLimitsHref with only status', () => {
    assert.equal(
      buildRateLimitsHref({ status: 'blocked' }),
      '/rate-limits?status=blocked'
    )
  })

  test('label maps cover period/scope/algorithm', () => {
    assert.equal(RATE_LIMIT_PERIOD_LABEL.MINUTE, '分钟')
    assert.equal(RATE_LIMIT_PERIOD_LABEL.HOUR, '小时')
    assert.equal(RATE_LIMIT_PERIOD_LABEL.DAY, '日')
    assert.equal(RATE_LIMIT_PERIOD_LABEL.WEEK, '周')
    assert.equal(RATE_LIMIT_PERIOD_LABEL.MONTH, '月')
    assert.equal(RATE_LIMIT_SCOPE_LABEL.STORE, '门店')
    assert.equal(RATE_LIMIT_SCOPE_LABEL.PLATFORM, '平台')
    assert.equal(RATE_LIMIT_SCOPE_LABEL.TENANT, '租户')
    assert.equal(RATE_LIMIT_SCOPE_LABEL.BRAND, '品牌')
    assert.equal(RATE_LIMIT_SCOPE_LABEL.INTEGRATION, '集成')
    assert.equal(RATE_LIMIT_ALGORITHM_LABEL.TOKEN_BUCKET, '令牌桶')
  })

  test('RATE_LIMIT_ALGORITHM_LABEL covers all algorithms', () => {
    assert.equal(RATE_LIMIT_ALGORITHM_LABEL.FIXED_WINDOW, '固定窗口')
    assert.equal(RATE_LIMIT_ALGORITHM_LABEL.SLIDING_WINDOW, '滑动窗口')
    assert.equal(RATE_LIMIT_ALGORITHM_LABEL.TOKEN_BUCKET, '令牌桶')
  })

  test('isPolicyActive reflects limit > 0', () => {
    assert.equal(isPolicyActive({ ...SAMPLE_POLICY, limit: 0 }), false)
    assert.equal(isPolicyActive(SAMPLE_POLICY), true)
  })

  test('isPolicyActive handles zero limit policy', () => {
    assert.equal(isPolicyActive(ZERO_LIMIT_POLICY), false)
  })

  test('isPolicyActive handles policy with large limit', () => {
    const largePolicy = { ...SAMPLE_POLICY, limit: 999999 }
    assert.equal(isPolicyActive(largePolicy), true)
  })

  test('isLedgerBlocked parses metadata.blockedUntil', () => {
    const now = Date.parse('2026-06-14T08:00:00.000Z')
    assert.equal(isLedgerBlocked(SAMPLE_LEDGER_BLOCKED, now), true)
    assert.equal(isLedgerBlocked(SAMPLE_LEDGER_WARNING, now), false)
    assert.equal(isLedgerBlocked(SAMPLE_LEDGER_HEALTHY, now), false)
  })

  test('isLedgerBlocked handles missing metadata', () => {
    const noMeta: QuotaLedgerRecord = { ...SAMPLE_LEDGER_HEALTHY, metadata: undefined }
    assert.equal(isLedgerBlocked(noMeta), false)
  })

  test('isLedgerBlocked handles expired blockedUntil', () => {
    const expired = { ...SAMPLE_LEDGER_BLOCKED, metadata: { blockedUntil: '2020-01-01T00:00:00.000Z' } }
    assert.equal(isLedgerBlocked(expired), false)
  })

  test('isLedgerBlocked handles empty metadata', () => {
    const empty: QuotaLedgerRecord = { ...SAMPLE_LEDGER_HEALTHY, metadata: {} }
    assert.equal(isLedgerBlocked(empty), false)
  })

  test('ledgerConsumptionRatio respects limit boundary', () => {
    assert.equal(ledgerConsumptionRatio(SAMPLE_LEDGER_BLOCKED), 1)
    assert.ok(ledgerConsumptionRatio(SAMPLE_LEDGER_WARNING) > 0.85)
    assert.ok(ledgerConsumptionRatio(SAMPLE_LEDGER_HEALTHY) < 0.2)
  })

  test('ledgerConsumptionRatio returns 0 for zero limit', () => {
    const zeroLimit: QuotaLedgerRecord = {
      ...SAMPLE_LEDGER_HEALTHY,
      policy: { id: 'p-0', code: 'zero', limit: 0, period: 'MINUTE' },
      consumed: 100
    }
    assert.equal(ledgerConsumptionRatio(zeroLimit), 0)
  })

  test('ledgerConsumptionRatio returns 0 for null limit', () => {
    const nullLimit: QuotaLedgerRecord = {
      ...SAMPLE_LEDGER_HEALTHY,
      policy: { id: 'p-null', code: 'null-limit', limit: 0, period: 'MINUTE' },
      consumed: 50
    }
    assert.equal(ledgerConsumptionRatio(nullLimit), 0)
  })

  test('summarize helpers include code, scope, tenant, algorithm', () => {
    const summary = summarizePolicy(SAMPLE_POLICY)
    assert.ok(summary.includes('foundation.api.tenant'))
    assert.ok(summary.includes('租户'))
    assert.ok(summary.includes('分钟'))
    assert.ok(summary.includes('固定窗口'))
    const ledgerSummary = summarizeLedger(SAMPLE_LEDGER_BLOCKED)
    assert.ok(ledgerSummary.includes('foundation.api.tenant'))
    assert.ok(ledgerSummary.includes('已封禁'))
  })

  test('summarizePolicy for hourly brand policy', () => {
    const summary = summarizePolicy(HOURLY_POLICY)
    assert.ok(summary.includes('order.api.brand'))
    assert.ok(summary.includes('品牌'))
    assert.ok(summary.includes('小时'))
    assert.ok(summary.includes('滑动窗口'))
  })

  test('summarizePolicy for daily store token bucket', () => {
    const summary = summarizePolicy(DAILY_POLICY)
    assert.ok(summary.includes('pos.api.store'))
    assert.ok(summary.includes('门店'))
    assert.ok(summary.includes('日'))
    assert.ok(summary.includes('令牌桶'))
  })

  test('summarizePolicy for zero limit disabled policy', () => {
    const summary = summarizePolicy(ZERO_LIMIT_POLICY)
    assert.ok(summary.includes('test.disabled'))
    assert.ok(summary.includes('0 /'))
    assert.ok(summary.includes('固定窗口'))
  })

  test('summarizeLedger for warning ledger', () => {
    const summary = summarizeLedger(SAMPLE_LEDGER_WARNING)
    assert.ok(summary.includes('foundation.api.tenant'))
    assert.ok(summary.includes('520'))
    assert.ok(summary.includes('600'))
    assert.equal(summary.includes('已封禁'), false)
  })

  test('summarizeLedger for healthy ledger', () => {
    const summary = summarizeLedger(SAMPLE_LEDGER_HEALTHY)
    assert.ok(summary.includes('100'))
    assert.equal(summary.includes('已封禁'), false)
  })

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

  test('loadRateLimitWorkspace with multiple policies', async () => {
    const originalFetch = globalThis.fetch
    globalThis.fetch = (async (input: RequestInfo | URL) => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url
      if (url.includes('/rate-limit/policies')) {
        return new Response(JSON.stringify({ code: 'OK', message: '', data: [SAMPLE_POLICY, HOURLY_POLICY, DAILY_POLICY] }), {
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
      assert.equal(snapshot.workspace.totals.policies, 3)
      assert.equal(snapshot.workspace.policies.length, 3)
      assert.equal(snapshot.workspace.byPeriod.MINUTE, 1)
      assert.equal(snapshot.workspace.byPeriod.HOUR, 1)
      assert.equal(snapshot.workspace.byPeriod.DAY, 1)
    } finally {
      globalThis.fetch = originalFetch
    }
  })

  test('loadRateLimitWorkspace fallback when policies endpoint fails', async () => {
    const originalFetch = globalThis.fetch
    globalThis.fetch = (async () => { throw new Error('network error') }) as typeof fetch
    try {
      const snapshot = await loadRateLimitWorkspace({ tenantId: 'tenant-demo' })
      assert.equal(snapshot.deliveryMode, 'fallback')
      assert.equal(snapshot.workspace.totals.activePolicies, 0)
      assert.equal(snapshot.workspace.totals.blockedLedgers, 0)
    } finally {
      globalThis.fetch = originalFetch
    }
  })

  test('loadRateLimitWorkspace with empty ledgers', async () => {
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
        return new Response(JSON.stringify({ code: 'OK', message: '', data: [] }), {
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
      assert.equal(snapshot.workspace.totals.ledgers, 0)
    } finally {
      globalThis.fetch = originalFetch
    }
  })

  test('loadRateLimitWorkspace preserves query params', async () => {
    const originalFetch = globalThis.fetch
    globalThis.fetch = (async () => { throw new Error('error') }) as typeof fetch
    try {
      const snapshot = await loadRateLimitWorkspace({ tenantId: 'tenant-demo', policyCode: 'foundation.api.tenant', status: 'blocked' })
      assert.equal(snapshot.query.policyCode, 'foundation.api.tenant')
      assert.equal(snapshot.query.status, 'blocked')
    } finally {
      globalThis.fetch = originalFetch
    }
  })
})
