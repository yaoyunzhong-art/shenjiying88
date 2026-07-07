import assert from 'node:assert/strict';
import test from 'node:test';
import { type RateLimitPolicyRecord } from '@m5/types';
import {
  loadRateLimitsPolicyDetail,
  type RateLimitsPolicyDetail,
} from '../../../rate-limits-detail-view-model';
import {
  isPolicyActive,
  summarizePolicy,
  RATE_LIMIT_ALGORITHM_LABEL,
  RATE_LIMIT_PERIOD_LABEL,
  RATE_LIMIT_SCOPE_LABEL,
} from '../../../rate-limits-view-model';

/**
 * rate-limits policy detail page L1 test
 * 验证限流策略详情页的核心逻辑：参数解析、策略状态判定、摘要文案。
 */

/* ─── 辅助函数 (对应 page.tsx 中的 readPolicyId) ─── */

function readPolicyId(value: string | string[] | undefined): string | null {
  if (!value) return null;
  const raw = Array.isArray(value) ? value[0] : value;
  return typeof raw === 'string' && raw.length > 0 ? raw : null;
}

/* ─── 测试样本 ─── */

const HEALTHY_POLICY: RateLimitPolicyRecord = {
  id: 'policy-healthy',
  code: 'foundation.api.tenant',
  scopeType: 'TENANT',
  period: 'MINUTE',
  limit: 600,
  burstLimit: 1000,
  algorithm: 'FIXED_WINDOW',
  tenantId: 'tenant-demo',
  dimensionKeys: ['userId', 'ip'],
  updatedAt: '2026-06-27T12:00:00Z',
};

const ZERO_LIMIT_POLICY: RateLimitPolicyRecord = {
  id: 'policy-disabled',
  code: 'legacy.endpoint',
  scopeType: 'PLATFORM',
  period: 'HOUR',
  limit: 0,
  tenantId: null,
  dimensionKeys: [],
  updatedAt: '2026-06-27T12:00:00Z',
};

const NO_ALGORITHM_POLICY: RateLimitPolicyRecord = {
  id: 'policy-legacy',
  code: 'old.api.v1',
  scopeType: 'STORE',
  period: 'DAY',
  limit: 10000,
  algorithm: undefined,
  tenantId: null,
  storeId: 'store-001',
  brandId: 'brand-foo',
  dimensionKeys: [],
  updatedAt: '2026-06-27T12:00:00Z',
};

/* ─── 1. readPolicyId 参数解析 ─── */

test('rate-limits-policy-detail-page: readPolicyId — single string returns as-is', () => {
  assert.equal(readPolicyId('policy-abc'), 'policy-abc');
});

test('rate-limits-policy-detail-page: readPolicyId — array takes first element', () => {
  assert.equal(readPolicyId(['policy-first', 'policy-second']), 'policy-first');
});

test('rate-limits-policy-detail-page: readPolicyId — undefined returns null', () => {
  assert.equal(readPolicyId(undefined), null);
});

test('rate-limits-policy-detail-page: readPolicyId — empty array returns null', () => {
  assert.equal(readPolicyId([]), null);
});

test('rate-limits-policy-detail-page: readPolicyId — empty string returns null', () => {
  assert.equal(readPolicyId(''), null);
});

/* ─── 2. isPolicyActive 策略状态判定 ─── */

test('rate-limits-policy-detail-page: isPolicyActive — positive limit returns true', () => {
  assert.equal(isPolicyActive(HEALTHY_POLICY), true);
});

test('rate-limits-policy-detail-page: isPolicyActive — zero limit returns false', () => {
  assert.equal(isPolicyActive(ZERO_LIMIT_POLICY), false);
});

test('rate-limits-policy-detail-page: isPolicyActive — undefined limit returns false', () => {
  assert.equal(isPolicyActive({ ...HEALTHY_POLICY, limit: undefined as unknown as number }), false);
});

test('rate-limits-policy-detail-page: isPolicyActive — null limit returns false', () => {
  assert.equal(isPolicyActive({ ...HEALTHY_POLICY, limit: null as unknown as number }), false);
});

/* ─── 3. isPolicyActive — 边界值 ─── */

test('rate-limits-policy-detail-page: isPolicyActive — limit 1 returns true', () => {
  assert.equal(isPolicyActive({ ...HEALTHY_POLICY, limit: 1 }), true);
});

test('rate-limits-policy-detail-page: isPolicyActive — limit negative returns false', () => {
  assert.equal(isPolicyActive({ ...HEALTHY_POLICY, limit: -1 }), false);
});

/* ─── 4. summarizePolicy 摘要文案 ─── */

test('rate-limits-policy-detail-page: summarizePolicy — full policy with all fields', () => {
  const summary = summarizePolicy(HEALTHY_POLICY);
  assert.ok(summary.includes('foundation.api.tenant'), '应包含 code');
  assert.ok(summary.includes(RATE_LIMIT_SCOPE_LABEL['TENANT']!), '应包含 scope 中文标签');
  assert.ok(summary.includes('tenant-demo'), '应包含租户 ID');
  assert.ok(summary.includes('600'), '应包含 limit');
  assert.ok(summary.includes(RATE_LIMIT_PERIOD_LABEL['MINUTE']!), '应包含 period 中文标签');
  assert.ok(summary.includes(RATE_LIMIT_ALGORITHM_LABEL['FIXED_WINDOW']!), '应包含算法中文标签');
});

test('rate-limits-policy-detail-page: summarizePolicy — no algorithm omits algorithm segment', () => {
  const summary = summarizePolicy(NO_ALGORITHM_POLICY);
  assert.ok(summary.includes('old.api.v1'), '应包含 code');
  assert.ok(summary.includes(RATE_LIMIT_SCOPE_LABEL['STORE']!), '应包含 scope');
  assert.ok(summary.includes('10000'), '应包含 limit');
  assert.ok(summary.includes(RATE_LIMIT_PERIOD_LABEL['DAY']!), '应包含 period');
  assert.ok(!summary.includes('算法'), '不应包含算法文本');
});

test('rate-limits-policy-detail-page: summarizePolicy — zero-limit policy falls back gracefully', () => {
  const summary = summarizePolicy(ZERO_LIMIT_POLICY);
  assert.ok(summary.includes('legacy.endpoint'), '应包含 code');
  assert.ok(!summary.includes('tenant-demo'), '不应包含未设置的 tenant');
});

test('rate-limits-policy-detail-page: summarizePolicy — store-scoped policy omits tenant segment', () => {
  const summary = summarizePolicy(NO_ALGORITHM_POLICY);
  assert.ok(!summary.includes('租户'), '门店策略不应含租户前缀');
});

test('rate-limits-policy-detail-page: summarizePolicy — label width bound: MAX key', () => {
  const longKeyPolicy: RateLimitPolicyRecord = {
    ...HEALTHY_POLICY,
    code: 'x'.repeat(120),
    dimensionKeys: [],
  };
  const summary = summarizePolicy(longKeyPolicy);
  assert.ok(summary.length < 500, '超长 code 不应导致摘要爆炸');
});

/* ─── 5. loadRateLimitsPolicyDetail view-model 调用边界 ─── */

test('rate-limits-policy-detail-page: loadRateLimitsPolicyDetail — null policyId returns notFound', async () => {
  const result = await loadRateLimitsPolicyDetail('', {}, { cache: 'no-store' });
  assert.equal(result.notFound, true, '空 policyId 应返回 notFound');
});

test('rate-limits-policy-detail-page: loadRateLimitsPolicyDetail — unknown policy returns notFound with id', async () => {
  const result = await loadRateLimitsPolicyDetail('nonexistent-policy-xyz', {}, { cache: 'no-store' });
  assert.equal(result.notFound, true, '无效 policyId 应返回 notFound');
  assert.equal(result.policyId, 'nonexistent-policy-xyz', 'policyId 应回显');
});

/* ─── 6. label constants completeness ─── */

test('rate-limits-policy-detail-page: RATE_LIMIT_ALGORITHM_LABEL — covers all known algorithms', () => {
  const known = ['FIXED_WINDOW', 'SLIDING_WINDOW', 'TOKEN_BUCKET'];
  for (const k of known) {
    assert.ok(RATE_LIMIT_ALGORITHM_LABEL[k], `缺少算法 ${k} 的标签`);
  }
});

test('rate-limits-policy-detail-page: RATE_LIMIT_PERIOD_LABEL — covers all known periods', () => {
  const known = ['MINUTE', 'HOUR', 'DAY', 'WEEK', 'MONTH'];
  for (const k of known) {
    assert.ok(RATE_LIMIT_PERIOD_LABEL[k], `缺少周期 ${k} 的标签`);
  }
});

test('rate-limits-policy-detail-page: RATE_LIMIT_SCOPE_LABEL — covers all known scopes', () => {
  const known = ['PLATFORM', 'TENANT', 'BRAND', 'STORE', 'INTEGRATION'];
  for (const k of known) {
    assert.ok(RATE_LIMIT_SCOPE_LABEL[k], `缺少作用域 ${k} 的标签`);
  }
});
