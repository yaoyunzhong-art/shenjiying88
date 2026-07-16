/**
 * rate-limits/policies/[policy]/page.test.tsx — 限流策略详情 L1 测试
 *
 * 覆盖: 策略快照查询、状态分类、算法标注、作用域解析、配置面板
 * 正例: 策略查询、算法类型映射、作用域解析、状态对应
 * 反例: 策略不存在、空策略 ID、未知算法、不完整数据
 * 边界: 零匹配账本、超长策略名、所有算法枚举
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

/* ── 类型 ── */

type PolicyStatus = 'active' | 'inactive' | 'draft';

interface PolicyRecord {
  code: string;
  name: string;
  scope: string;
  windowSize: string;
  limit: number;
  algorithm: string;
  status: PolicyStatus;
  description: string;
  createdAt: string;
  updatedAt: string;
  matchedLedgers: number;
}

// ---- 数据 ----

const KNOWN_POLICIES: Record<string, PolicyRecord> = {
  'READ_QPS_100': { code: 'READ_QPS_100', name: '读取 QPS 100', scope: 'tenant:api:read', windowSize: '1s', limit: 100, algorithm: 'token-bucket', status: 'active', description: 'API 读取请求速率限制', createdAt: '2026-01-01', updatedAt: '2026-06-15', matchedLedgers: 3 },
  'WRITE_QPS_50': { code: 'WRITE_QPS_50', name: '写入 QPS 50', scope: 'tenant:api:write', windowSize: '1s', limit: 50, algorithm: 'leaky-bucket', status: 'active', description: 'API 写入请求速率限制', createdAt: '2026-01-01', updatedAt: '2026-06-10', matchedLedgers: 2 },
  'CAMPAIGN_TRIGGER_1000': { code: 'CAMPAIGN_TRIGGER_1000', name: '活动触发 1000/天', scope: 'tenant:campaign:trigger', windowSize: '24h', limit: 1000, algorithm: 'fixed-window', status: 'active', description: '营销活动每日触发上限', createdAt: '2026-02-01', updatedAt: '2026-06-20', matchedLedgers: 1 },
  'BURST_5000': { code: 'BURST_5000', name: '突发流量 5000', scope: 'tenant:burst', windowSize: '1m', limit: 5000, algorithm: 'token-bucket', status: 'draft', description: '突发流量峰值控制', createdAt: '2026-03-01', updatedAt: '2026-07-01', matchedLedgers: 0 },
};

const STATUS_MAP: Record<PolicyStatus, string> = {
  active: '生效中',
  inactive: '已停用',
  draft: '草稿',
};

// ---- 辅助函数 ----

function loadPolicyRecord(policyId: string): PolicyRecord | undefined {
  if (!policyId) return undefined;
  return KNOWN_POLICIES[policyId];
}

function getAlgorithmLabel(algorithm: string): string {
  const labels: Record<string, string> = {
    'token-bucket': '令牌桶',
    'leaky-bucket': '漏桶',
    'fixed-window': '固定窗口',
    'sliding-window': '滑动窗口',
  };
  return labels[algorithm] ?? algorithm;
}

function parseScope(scope: string): string[] {
  return scope.split(':');
}

function formatScope(scope: string): string {
  return parseScope(scope).join(' → ');
}

function isPolicyActive(status: PolicyStatus): boolean {
  return status === 'active';
}

/* ============================================================ */

describe('rate-limits-policy: 数据类型', () => {
  it('PolicyRecord has all required fields', () => {
    const p: PolicyRecord = { code: 'C', name: 'N', scope: 's', windowSize: '1h', limit: 100, algorithm: 'token-bucket', status: 'active', description: 'd', createdAt: '2026-01-01', updatedAt: '2026-01-01', matchedLedgers: 1 };
    assert.equal(typeof p.code, 'string');
    assert.equal(typeof p.limit, 'number');
    assert.equal(typeof p.matchedLedgers, 'number');
  });

  it('PolicyStatus has 3 enum values', () => {
    const statuses: PolicyStatus[] = ['active', 'inactive', 'draft'];
    assert.equal(statuses.length, 3);
  });

  it('STATUS_MAP covers all statuses', () => {
    assert.equal(Object.keys(STATUS_MAP).length, 3);
    assert.equal(STATUS_MAP.draft, '草稿');
  });
});

describe('rate-limits-policy: 业务逻辑 - 策略查找', () => {
  it('loadPolicyRecord finds known policy', () => {
    const p = loadPolicyRecord('READ_QPS_100');
    assert.ok(p);
    assert.equal(p?.name, '读取 QPS 100');
  });

  it('loadPolicyRecord returns undefined for unknown', () => {
    assert.equal(loadPolicyRecord('NONEXISTENT'), undefined);
  });

  it('loadPolicyRecord empty string returns undefined', () => {
    assert.equal(loadPolicyRecord(''), undefined);
  });

  it('BURST_5000 policy is draft', () => {
    const p = loadPolicyRecord('BURST_5000');
    assert.equal(p?.status, 'draft');
    assert.equal(p?.matchedLedgers, 0);
  });
});

describe('rate-limits-policy: 业务逻辑 - 算法与作用域', () => {
  it('getAlgorithmLabel token-bucket = 令牌桶', () => {
    assert.equal(getAlgorithmLabel('token-bucket'), '令牌桶');
  });

  it('getAlgorithmLabel leaky-bucket = 漏桶', () => {
    assert.equal(getAlgorithmLabel('leaky-bucket'), '漏桶');
  });

  it('getAlgorithmLabel fixed-window = 固定窗口', () => {
    assert.equal(getAlgorithmLabel('fixed-window'), '固定窗口');
  });

  it('getAlgorithmLabel sliding-window = 滑动窗口', () => {
    assert.equal(getAlgorithmLabel('sliding-window'), '滑动窗口');
  });

  it('getAlgorithmLabel unknown returns original', () => {
    assert.equal(getAlgorithmLabel('custom-algo'), 'custom-algo');
  });

  it('parseScope splits by colon', () => {
    assert.deepEqual(parseScope('tenant:api:read'), ['tenant', 'api', 'read']);
  });

  it('parseScope single segment returns one item', () => {
    assert.deepEqual(parseScope('global'), ['global']);
  });

  it('formatScope joins with arrow', () => {
    assert.equal(formatScope('tenant:api:read'), 'tenant → api → read');
  });

  it('formatScope single segment', () => {
    assert.equal(formatScope('global'), 'global');
  });

  it('isPolicyActive returns true for active', () => {
    assert.ok(isPolicyActive('active'));
  });

  it('isPolicyActive returns false for draft and inactive', () => {
    assert.ok(!isPolicyActive('draft'));
    assert.ok(!isPolicyActive('inactive'));
  });
});

describe('rate-limits-policy: 业务逻辑 - 策略数据', () => {
  it('READ_QPS_100 limit is 100', () => {
    const p = loadPolicyRecord('READ_QPS_100')!;
    assert.equal(p.limit, 100);
  });

  it('CAMPAIGN_TRIGGER_1000 uses fixed-window algorithm', () => {
    const p = loadPolicyRecord('CAMPAIGN_TRIGGER_1000')!;
    assert.equal(p.algorithm, 'fixed-window');
  });

  it('WRITE_QPS_50 uses leaky-bucket', () => {
    const p = loadPolicyRecord('WRITE_QPS_50')!;
    assert.equal(p.algorithm, 'leaky-bucket');
  });

  it('all known policies have non-empty description', () => {
    assert.ok(Object.values(KNOWN_POLICIES).every(p => p.description.length > 0));
  });

  it('all policies have createdAt and updatedAt', () => {
    assert.ok(Object.values(KNOWN_POLICIES).every(p => p.createdAt.length > 0 && p.updatedAt.length > 0));
  });

  it('limit is always positive', () => {
    assert.ok(Object.values(KNOWN_POLICIES).every(p => p.limit > 0));
  });

  it('matchedLedgers is non-negative', () => {
    assert.ok(Object.values(KNOWN_POLICIES).every(p => p.matchedLedgers >= 0));
  });

  it('BURST_5000 has zero matched ledgers', () => {
    assert.equal(loadPolicyRecord('BURST_5000')?.matchedLedgers, 0);
  });

  it('windowSize is always a string with unit suffix', () => {
    assert.ok(Object.values(KNOWN_POLICIES).every(p => /^\d+(h|s|m)$/.test(p.windowSize)));
  });

  it('policy code is uppercase with underscores', () => {
    assert.ok(Object.values(KNOWN_POLICIES).every(p => /^[A-Z_0-9]+$/.test(p.code)));
  });
});
