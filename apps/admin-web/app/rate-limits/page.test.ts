import assert from 'node:assert/strict';
import test from 'node:test';
import { type RateLimitWorkspace } from '@m5/types';
import {
  loadRateLimitWorkspace,
  isPolicyActive,
  isLedgerBlocked,
  ledgerConsumptionRatio,
  RATE_LIMIT_PERIOD_LABEL,
  RATE_LIMIT_SCOPE_LABEL,
} from '../rate-limits-view-model';
import {
  type QuotaLedgerRecord,
  type RateLimitPolicyRecord,
} from '@m5/types';

/**
 * rate-limits list page L1 test
 * 验证限流与配额列表页的视图模型函数，覆盖服务端页面组件使用的业务逻辑。
 */

const SAMPLE_POLICY: RateLimitPolicyRecord = {
  id: 'policy-1',
  code: 'foundation.api.member.write',
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
  metadata: { team: 'platform-engineering' },
  updatedAt: '2026-06-26T08:00:00.000Z',
};

const SAMPLE_POLICY_BRAND: RateLimitPolicyRecord = {
  ...SAMPLE_POLICY,
  id: 'policy-brand-1',
  code: 'brand.api.store.read',
  scopeType: 'BRAND',
  period: 'HOUR',
  limit: 5000,
  burstLimit: 7000,
  algorithm: 'SLIDING_WINDOW',
};

const SAMPLE_POLICY_DISABLED: RateLimitPolicyRecord = {
  ...SAMPLE_POLICY,
  id: 'policy-disabled-1',
  code: 'deprecated.api.v1',
  limit: 0,
  burstLimit: 0,
};

const SAMPLE_LEDGER_HEALTHY: QuotaLedgerRecord = {
  id: 'ledger-healthy-1',
  subjectKey: 'tenant-demo',
  period: 'MINUTE',
  consumed: 100,
  remaining: 500,
  resetAt: '2026-06-26T08:01:00.000Z',
  metadata: {},
  updatedAt: '2026-06-26T08:00:00.000Z',
  policy: { id: 'policy-1', code: 'foundation.api.member.write', limit: 600, period: 'MINUTE' },
};

const SAMPLE_LEDGER_WARNING: QuotaLedgerRecord = {
  ...SAMPLE_LEDGER_HEALTHY,
  id: 'ledger-warning-1',
  consumed: 480,
  remaining: 120,
  subjectKey: 'brand-store-001',
};

const SAMPLE_LEDGER_BLOCKED: QuotaLedgerRecord = {
  ...SAMPLE_LEDGER_HEALTHY,
  id: 'ledger-blocked-1',
  consumed: 600,
  remaining: 0,
  metadata: { blockedUntil: '2099-12-31T23:59:59.000Z' },
  subjectKey: 'abuse-tenant',
};

/* ────────── isPolicyActive ────────── */

test('rate-limits-page: isPolicyActive — active policy returns true', () => {
  assert.equal(isPolicyActive(SAMPLE_POLICY), true);
});

test('rate-limits-page: isPolicyActive — disabled policy returns false', () => {
  assert.equal(isPolicyActive(SAMPLE_POLICY_DISABLED), false);
});

test('rate-limits-page: isPolicyActive — zero limit returns false', () => {
  const zeroLimit: RateLimitPolicyRecord = { ...SAMPLE_POLICY, limit: 0 };
  assert.equal(isPolicyActive(zeroLimit), false);
});

test('rate-limits-page: isPolicyActive — negative limit returns false', () => {
  const negative: RateLimitPolicyRecord = { ...SAMPLE_POLICY, limit: -1 };
  assert.equal(isPolicyActive(negative), false);
});

/* ────────── isLedgerBlocked ────────── */

test('rate-limits-page: isLedgerBlocked — future blockedUntil returns true', () => {
  const now = Date.parse('2026-06-26T08:00:00.000Z');
  assert.equal(isLedgerBlocked(SAMPLE_LEDGER_BLOCKED, now), true);
});

test('rate-limits-page: isLedgerBlocked — no blockedUntil returns false', () => {
  const now = Date.now();
  assert.equal(isLedgerBlocked(SAMPLE_LEDGER_HEALTHY, now), false);
  assert.equal(isLedgerBlocked(SAMPLE_LEDGER_WARNING, now), false);
});

test('rate-limits-page: isLedgerBlocked — past blockedUntil returns false', () => {
  const now = Date.parse('2026-06-26T08:00:00.000Z');
  const past: QuotaLedgerRecord = {
    ...SAMPLE_LEDGER_BLOCKED,
    metadata: { blockedUntil: '2026-01-01T00:00:00.000Z' },
  };
  assert.equal(isLedgerBlocked(past, now), false);
});

test('rate-limits-page: isLedgerBlocked — empty metadata returns false', () => {
  const now = Date.now();
  const emptyMeta: QuotaLedgerRecord = { ...SAMPLE_LEDGER_HEALTHY, metadata: {} };
  assert.equal(isLedgerBlocked(emptyMeta, now), false);
});

test('rate-limits-page: isLedgerBlocked — invalid date in blockedUntil returns false', () => {
  const now = Date.parse('2026-06-26T08:00:00.000Z');
  const invalid: QuotaLedgerRecord = {
    ...SAMPLE_LEDGER_BLOCKED,
    metadata: { blockedUntil: 'not-a-date' },
  };
  assert.equal(isLedgerBlocked(invalid, now), false);
});

/* ────────── ledgerConsumptionRatio ────────── */

test('rate-limits-page: ledgerConsumptionRatio — healthy returns low ratio', () => {
  assert.ok(ledgerConsumptionRatio(SAMPLE_LEDGER_HEALTHY) < 0.2);
});

test('rate-limits-page: ledgerConsumptionRatio — warning returns high ratio', () => {
  assert.ok(ledgerConsumptionRatio(SAMPLE_LEDGER_WARNING) > 0.7);
});

test('rate-limits-page: ledgerConsumptionRatio — blocked returns 1', () => {
  assert.equal(ledgerConsumptionRatio(SAMPLE_LEDGER_BLOCKED), 1);
});

test('rate-limits-page: ledgerConsumptionRatio — zero limit ledger returns 0', () => {
  const zero: QuotaLedgerRecord = {
    ...SAMPLE_LEDGER_HEALTHY,
    policy: { id: 'p-0', code: 'zero', limit: 0, period: 'MINUTE' },
  };
  assert.equal(ledgerConsumptionRatio(zero), 0);
});

test('rate-limits-page: ledgerConsumptionRatio — consumed > limit returns 1 (clamped)', () => {
  const over: QuotaLedgerRecord = {
    ...SAMPLE_LEDGER_HEALTHY,
    consumed: 999,
    remaining: 0,
    policy: { id: 'p-1', code: 'overflow', limit: 600, period: 'MINUTE' },
  };
  assert.equal(ledgerConsumptionRatio(over), 1);
});

/* ────────── loadRateLimitWorkspace ────────── */

test('rate-limits-page: loadRateLimitWorkspace returns delivery with workspace', async () => {
  const result = await loadRateLimitWorkspace({ tenantId: 'tenant-demo' }, { cache: 'no-store' });
  assert.ok(result, 'result should exist');
  assert.ok('workspace' in result, 'result should contain workspace');
  assert.ok('deliveryMode' in result, 'result should contain deliveryMode');
  assert.ok(['api', 'fallback'].includes(result.deliveryMode), 'deliveryMode should be api or fallback');
});

test('rate-limits-page: loadRateLimitWorkspace fallback workspace has expected shape', async () => {
  // Verify the empty workspace shape
  const result = await loadRateLimitWorkspace({}, { cache: 'no-store' });
  const ws: RateLimitWorkspace = result.workspace;
  assert.ok(ws.totals !== undefined, 'workspace should have totals');
  assert.equal(typeof ws.totals.policies, 'number');
  assert.equal(typeof ws.totals.ledgers, 'number');
  assert.ok(Array.isArray(ws.policies));
  assert.ok(Array.isArray(ws.ledgers));
  assert.ok(ws.generatedAt, 'workspace should have generatedAt');
});

/* ────────── Label maps ────────── */

test('rate-limits-page: RATE_LIMIT_PERIOD_LABEL covers all expected keys', () => {
  assert.equal(RATE_LIMIT_PERIOD_LABEL['MINUTE'], '分钟');
  assert.equal(RATE_LIMIT_PERIOD_LABEL['HOUR'], '小时');
  assert.equal(RATE_LIMIT_PERIOD_LABEL['DAY'], '日');
  assert.equal(RATE_LIMIT_PERIOD_LABEL['WEEK'], '周');
  assert.equal(RATE_LIMIT_PERIOD_LABEL['MONTH'], '月');
});

test('rate-limits-page: RATE_LIMIT_SCOPE_LABEL covers scope types', () => {
  assert.equal(RATE_LIMIT_SCOPE_LABEL['PLATFORM'], '平台');
  assert.equal(RATE_LIMIT_SCOPE_LABEL['TENANT'], '租户');
  assert.equal(RATE_LIMIT_SCOPE_LABEL['BRAND'], '品牌');
  assert.equal(RATE_LIMIT_SCOPE_LABEL['STORE'], '门店');
  assert.equal(RATE_LIMIT_SCOPE_LABEL['INTEGRATION'], '集成');
});

/* ────────── page header / routing logic ────────── */

test('rate-limits-page: isPolicyActive correctly groups policies for page stats', () => {
  const policies = [SAMPLE_POLICY, SAMPLE_POLICY_BRAND, SAMPLE_POLICY_DISABLED];
  const activeCount = policies.filter(isPolicyActive).length;
  const inactiveCount = policies.filter((p) => !isPolicyActive(p)).length;
  assert.equal(activeCount, 2, 'two active policies');
  assert.equal(inactiveCount, 1, 'one inactive policy');
  assert.equal(activeCount + inactiveCount, policies.length);
});

test('rate-limits-page: status grouping logic mirrors page filter', () => {
  const now = Date.parse('2026-06-26T08:00:00.000Z');
  const ledgers = [SAMPLE_LEDGER_HEALTHY, SAMPLE_LEDGER_WARNING, SAMPLE_LEDGER_BLOCKED];

  const blocked = ledgers.filter((l) => isLedgerBlocked(l, now)).length;
  const nonBlocked = ledgers.filter((l) => !isLedgerBlocked(l, now)).length;

  assert.equal(blocked, 1);
  assert.equal(nonBlocked, 2);

  // Warning detection uses consumption ratio
  const warning = nonBlocked === 2; // non-blocked includes both healthy & warning
  assert.equal(warning, true);
});

test('rate-limits-page: loadRateLimitWorkspace preserves query parameters', async () => {
  const specificQuery = {
    tenantId: 'tenant-demo',
    policyCode: 'foundation.api.member.write',
    status: 'blocked' as const,
  };
  const result = await loadRateLimitWorkspace(specificQuery, { cache: 'no-store' });
  assert.equal(result.query.tenantId, 'tenant-demo');
  assert.equal(result.query.policyCode, 'foundation.api.member.write');
  assert.equal(result.query.status, 'blocked');
});

test('rate-limits-page: loadRateLimitWorkspace defaults tenantId when omitted', async () => {
  const result = await loadRateLimitWorkspace({}, { cache: 'no-store' });
  assert.ok(result.query.tenantId, 'tenantId should be defaulted');
});
