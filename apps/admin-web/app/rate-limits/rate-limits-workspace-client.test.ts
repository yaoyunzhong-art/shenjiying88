import assert from 'node:assert/strict';
import test from 'node:test';
import {
  type QuotaLedgerRecord,
  type RateLimitPolicyRecord,
  type RateLimitWorkspace,
} from '@m5/types';
import {
  isLedgerBlocked,
  isPolicyActive,
  ledgerConsumptionRatio,
  summarizeLedger,
  summarizePolicy,
} from '../rate-limits-view-model';

/**
 * 该测试验证 rate-limits-workspace-client 组件中使用的 filter/group 逻辑，
 * 确保视图模型函数在目录层面 work。
 */

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
  updatedAt: '2026-06-14T08:00:00.000Z',
};

const SAMPLE_POLICY_INACTIVE: RateLimitPolicyRecord = {
  ...SAMPLE_POLICY,
  id: 'policy-2',
  code: 'foundation.api.disabled',
  limit: 0,
};

const SAMPLE_LEDGER_BLOCKED: QuotaLedgerRecord = {
  id: 'ledger-1',
  subjectKey: 'tenant-demo',
  period: 'MINUTE',
  consumed: 600,
  remaining: 0,
  resetAt: '2026-06-14T08:01:00.000Z',
  metadata: { blockedUntil: '2099-01-01T00:00:00.000Z' },
  updatedAt: '2026-06-14T08:00:00.000Z',
  policy: { id: 'policy-1', code: SAMPLE_POLICY.code, limit: SAMPLE_POLICY.limit, period: SAMPLE_POLICY.period },
};

const SAMPLE_LEDGER_WARNING: QuotaLedgerRecord = {
  ...SAMPLE_LEDGER_BLOCKED,
  id: 'ledger-2',
  consumed: 520,
  remaining: 80,
  metadata: {},
  resetAt: '2026-06-14T08:01:00.000Z',
};

const SAMPLE_LEDGER_HEALTHY: QuotaLedgerRecord = {
  ...SAMPLE_LEDGER_BLOCKED,
  id: 'ledger-3',
  consumed: 100,
  remaining: 500,
  metadata: {},
  resetAt: '2026-06-14T08:01:00.000Z',
};

test('rate-limits-workspace-client: isPolicyActive correctly classifies active vs inactive policies', () => {
  assert.equal(isPolicyActive(SAMPLE_POLICY), true, 'limit>0 should be active');
  assert.equal(isPolicyActive(SAMPLE_POLICY_INACTIVE), false, 'limit=0 should be inactive');
});

test('rate-limits-workspace-client: isLedgerBlocked checks metadata.blockedUntil', () => {
  const now = Date.parse('2026-06-14T08:00:00.000Z');
  assert.equal(isLedgerBlocked(SAMPLE_LEDGER_BLOCKED, now), true, 'blockedUntil in the far future is blocked');
  assert.equal(isLedgerBlocked(SAMPLE_LEDGER_WARNING, now), false, 'no blockedUntil is not blocked');
  assert.equal(isLedgerBlocked(SAMPLE_LEDGER_HEALTHY, now), false, 'healthy ledger is not blocked');

  // Edge: blockedUntil in the past
  const pastBlocked: QuotaLedgerRecord = {
    ...SAMPLE_LEDGER_BLOCKED,
    metadata: { blockedUntil: '2026-01-01T00:00:00.000Z' },
  };
  assert.equal(isLedgerBlocked(pastBlocked, now), false, 'past blockedUntil should not be blocked');
});

test('rate-limits-workspace-client: ledgerConsumptionRatio returns correct ratios', () => {
  assert.equal(ledgerConsumptionRatio(SAMPLE_LEDGER_BLOCKED), 1, 'blocked ledger has full consumption');
  assert.ok(
    ledgerConsumptionRatio(SAMPLE_LEDGER_WARNING) > 0.85,
    'warning ledger consumption > 85%',
  );
  assert.ok(
    ledgerConsumptionRatio(SAMPLE_LEDGER_HEALTHY) < 0.2,
    'healthy ledger consumption < 20%',
  );

  // Edge: ledger with zero limit
  const zeroLimitLedger: QuotaLedgerRecord = {
    ...SAMPLE_LEDGER_HEALTHY,
    policy: { id: 'policy-0', code: 'zero', limit: 0, period: 'MINUTE' },
  };
  assert.equal(
    ledgerConsumptionRatio(zeroLimitLedger),
    0,
    'ledger with zero limit should return 0',
  );
});

test('rate-limits-workspace-client: summarizePolicy returns formatted description', () => {
  const summary = summarizePolicy(SAMPLE_POLICY);
  assert.ok(summary.includes('foundation.api.tenant'), 'summary should contain policy code');
  assert.ok(summary.includes('固定窗口'), 'summary should contain algorithm label (Chinese)');
});

test('rate-limits-workspace-client: summarizeLedger returns formatted description with lock info', () => {
  const blockedSummary = summarizeLedger(SAMPLE_LEDGER_BLOCKED);
  assert.ok(blockedSummary.includes('已封禁'), 'blocked ledger summary should indicate blocked');

  const healthySummary = summarizeLedger(SAMPLE_LEDGER_HEALTHY);
  assert.ok(healthySummary.includes('foundation.api.tenant'), 'healthy ledger summary should contain policy code');
});

test('rate-limits-workspace-client: policy active/inactive counts match workspace grouping logic', () => {
  // Mirrors the grouping logic inside rate-limits-workspace-client
  const policies = [SAMPLE_POLICY, SAMPLE_POLICY_INACTIVE];
  const active = policies.filter(isPolicyActive).length;
  const inactive = policies.filter((p) => !isPolicyActive(p)).length;
  assert.equal(active, 1, 'one active policy');
  assert.equal(inactive, 1, 'one inactive policy');
  assert.equal(active + inactive, policies.length, 'all policies accounted for');
});

test('rate-limits-workspace-client: ledger status counts match component grouping logic', () => {
  // Mirrors the STATUS_FILTER ledger grouping logic inside rate-limits-workspace-client
  const now = Date.now();
  const ledgers = [SAMPLE_LEDGER_BLOCKED, SAMPLE_LEDGER_WARNING, SAMPLE_LEDGER_HEALTHY];
  const blocked = ledgers.filter((l) => isLedgerBlocked(l, now)).length;
  const total = ledgers.length;
  const remaining = total - blocked;
  assert.equal(blocked, 1, 'one blocked ledger');
  assert.equal(remaining, 2, 'two non-blocked ledgers');
});
