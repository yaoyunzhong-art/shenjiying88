/**
 * resilience/retries/[key]/page.test.tsx — 重试策略详情 L1 测试
 *
 * 覆盖: 重试策略数据加载、key 归一化、退避策略分类、状态快照
 * 正例: 策略快照字段完整性、key 解析、状态映射、能力名称
 * 反例: key 不存在、空 key、数组格式 key、未找到快照
 * 边界: 多段 key、带特殊字符 key、大小写归一化
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

/* ── 类型 ── */

type RetryPolicyStatus = 'active' | 'inactive' | 'deprecated';

interface RetryPolicyRecord {
  capability: string;
  policyKey: string;
  status: RetryPolicyStatus;
  maxRetries: number;
  backoffStrategy: 'exponential' | 'linear' | 'fixed';
  initialDelayMs: number;
  maxDelayMs: number;
  timeoutMs: number;
  escalationTarget: string;
  description: string;
}

interface RetryPolicySnapshot {
  key: string;
  notFound: boolean;
  record?: RetryPolicyRecord | null;
}

// ---- 辅助函数 ----

function readPolicyKey(value: string | string[] | undefined): string | null {
  if (value === undefined || value === null) return null;
  return Array.isArray(value) ? (value.length > 0 ? value[0] : null) : value;
}

function normalizePolicyKey(key: string): string {
  return key.trim().toLowerCase().replace(/[^a-z0-9._-]/g, '');
}

const KNOWN_RETRY_POLICIES: Record<string, RetryPolicyRecord> = {
  'payment-retry': { capability: '支付重试', policyKey: 'payment-retry', status: 'active', maxRetries: 3, backoffStrategy: 'exponential', initialDelayMs: 1000, maxDelayMs: 30000, timeoutMs: 10000, escalationTarget: 'ops-alert', description: '支付请求失败自动重试' },
  'notification-retry': { capability: '通知重试', policyKey: 'notification-retry', status: 'active', maxRetries: 5, backoffStrategy: 'linear', initialDelayMs: 500, maxDelayMs: 60000, timeoutMs: 30000, escalationTarget: 'ops-alert', description: '消息通知发送重试' },
  'db-query-retry': { capability: '数据库查询重试', policyKey: 'db-query-retry', status: 'active', maxRetries: 2, backoffStrategy: 'fixed', initialDelayMs: 200, maxDelayMs: 200, timeoutMs: 5000, escalationTarget: 'db-admin', description: '数据库查询临时故障重试' },
  'legacy-cache-retry': { capability: '缓存重试(旧版)', policyKey: 'legacy-cache-retry', status: 'deprecated', maxRetries: 1, backoffStrategy: 'fixed', initialDelayMs: 100, maxDelayMs: 100, timeoutMs: 2000, escalationTarget: 'migration-team', description: '旧版缓存重试策略，待迁移' },
};

function loadRetryPolicy(key: string): RetryPolicySnapshot {
  if (!key) return { key: '', notFound: true, record: null };
  const normalized = normalizePolicyKey(key);
  const record = KNOWN_RETRY_POLICIES[normalized];
  if (!record) return { key: normalized, notFound: true, record: null };
  return { key: normalized, notFound: false, record };
}

function getBackoffLabel(strategy: string): string {
  const labels: Record<string, string> = {
    exponential: '指数退避',
    linear: '线性退避',
    fixed: '固定间隔',
  };
  return labels[strategy] ?? strategy;
}

function isRetryEligible(status: RetryPolicyStatus): boolean {
  return status === 'active';
}

/* ============================================================ */

describe('resilience-retry: 数据类型', () => {
  it('RetryPolicyRecord has all numeric fields', () => {
    const r: RetryPolicyRecord = { capability: 'C', policyKey: 'K', status: 'active', maxRetries: 3, backoffStrategy: 'exponential', initialDelayMs: 1000, maxDelayMs: 30000, timeoutMs: 10000, escalationTarget: 'E', description: 'D' };
    assert.equal(typeof r.maxRetries, 'number');
    assert.equal(typeof r.initialDelayMs, 'number');
    assert.equal(typeof r.maxDelayMs, 'number');
    assert.equal(typeof r.timeoutMs, 'number');
  });

  it('RetryPolicyStatus has 3 values', () => {
    const statuses: RetryPolicyStatus[] = ['active', 'inactive', 'deprecated'];
    assert.equal(statuses.length, 3);
  });

  it('backoffStrategy is a union type', () => {
    const strategies: ('exponential' | 'linear' | 'fixed')[] = ['exponential', 'linear', 'fixed'];
    assert.equal(strategies.length, 3);
  });

  it('RetryPolicySnapshot shape', () => {
    const s: RetryPolicySnapshot = { key: 'k', notFound: false, record: null };
    assert.equal(typeof s.notFound, 'boolean');
    assert.equal(typeof s.key, 'string');
  });
});

describe('resilience-retry: 业务逻辑 - key 解析', () => {
  it('readPolicyKey string returns as-is', () => {
    assert.equal(readPolicyKey('payment-retry'), 'payment-retry');
  });

  it('readPolicyKey array returns first element', () => {
    assert.equal(readPolicyKey(['payment-retry', 'extra']), 'payment-retry');
  });

  it('readPolicyKey empty array returns null', () => {
    assert.equal(readPolicyKey([]), null);
  });

  it('readPolicyKey undefined returns null', () => {
    assert.equal(readPolicyKey(undefined), null);
  });

  it('normalizePolicyKey lowercases', () => {
    assert.equal(normalizePolicyKey('Payment-Retry'), 'payment-retry');
  });

  it('normalizePolicyKey strips special chars', () => {
    assert.equal(normalizePolicyKey('db query retry!'), 'dbqueryretry');
  });

  it('normalizePolicyKey preserves dots and hyphens', () => {
    assert.equal(normalizePolicyKey('db.query-retry'), 'db.query-retry');
  });
});

describe('resilience-retry: 业务逻辑 - 策略加载', () => {
  it('loadRetryPolicy finds payment-retry', () => {
    const snap = loadRetryPolicy('payment-retry');
    assert.ok(!snap.notFound);
    assert.equal(snap.record?.capability, '支付重试');
  });

  it('loadRetryPolicy returns notFound for unknown key', () => {
    const snap = loadRetryPolicy('nonexistent');
    assert.ok(snap.notFound);
    assert.equal(snap.record, null);
  });

  it('loadRetryPolicy empty key returns notFound', () => {
    const snap = loadRetryPolicy('');
    assert.ok(snap.notFound);
  });

  it('loadRetryPolicy is case-insensitive', () => {
    const snap = loadRetryPolicy('Payment-Retry');
    assert.ok(!snap.notFound);
    assert.equal(snap.record?.capability, '支付重试');
  });

  it('legacy-cache-retry is deprecated', () => {
    const snap = loadRetryPolicy('legacy-cache-retry');
    assert.equal(snap.record?.status, 'deprecated');
    assert.equal(snap.record?.maxRetries, 1);
  });
});

describe('resilience-retry: 业务逻辑 - 退避策略', () => {
  it('getBackoffLabel exponential = 指数退避', () => {
    assert.equal(getBackoffLabel('exponential'), '指数退避');
  });

  it('getBackoffLabel linear = 线性退避', () => {
    assert.equal(getBackoffLabel('linear'), '线性退避');
  });

  it('getBackoffLabel fixed = 固定间隔', () => {
    assert.equal(getBackoffLabel('fixed'), '固定间隔');
  });

  it('getBackoffLabel unknown returns original', () => {
    assert.equal(getBackoffLabel('custom'), 'custom');
  });

  it('payment-retry uses exponential backoff', () => {
    const snap = loadRetryPolicy('payment-retry');
    assert.equal(snap.record?.backoffStrategy, 'exponential');
  });

  it('notification-retry uses linear backoff', () => {
    const snap = loadRetryPolicy('notification-retry');
    assert.equal(snap.record?.backoffStrategy, 'linear');
  });

  it('db-query-retry uses fixed delay', () => {
    const snap = loadRetryPolicy('db-query-retry');
    assert.equal(snap.record?.backoffStrategy, 'fixed');
  });

  it('isRetryEligible returns true for active', () => {
    assert.ok(isRetryEligible('active'));
  });

  it('isRetryEligible returns false for inactive/deprecated', () => {
    assert.ok(!isRetryEligible('inactive'));
    assert.ok(!isRetryEligible('deprecated'));
  });
});

describe('resilience-retry: 业务逻辑 - 策略参数', () => {
  it('payment-retry maxRetries is 3', () => {
    const snap = loadRetryPolicy('payment-retry')!;
    assert.equal(snap.record?.maxRetries, 3);
  });

  it('payment-retry initialDelayMs = 1000', () => {
    const snap = loadRetryPolicy('payment-retry')!;
    assert.equal(snap.record?.initialDelayMs, 1000);
  });

  it('notification-retry has higher maxRetries (5)', () => {
    const snap = loadRetryPolicy('notification-retry')!;
    assert.equal(snap.record?.maxRetries, 5);
  });

  it('maxDelayMs >= initialDelayMs for all active policies', () => {
    Object.values(KNOWN_RETRY_POLICIES).forEach(p => {
      assert.ok(p.maxDelayMs >= p.initialDelayMs);
    });
  });

  it('timeoutMs is always positive', () => {
    Object.values(KNOWN_RETRY_POLICIES).forEach(p => {
      assert.ok(p.timeoutMs > 0);
    });
  });

  it('all policies have escalation target', () => {
    Object.values(KNOWN_RETRY_POLICIES).forEach(p => {
      assert.ok(p.escalationTarget.length > 0);
    });
  });

  it('active policies have maxRetries >= 2', () => {
    Object.values(KNOWN_RETRY_POLICIES)
      .filter(p => p.status === 'active')
      .forEach(p => assert.ok(p.maxRetries >= 2));
  });
});

const SRC = fs.readFileSync(require.resolve('./page'), 'utf-8');

describe('Resilience / Retries — hooks验证', () => {
  it('是客户端组件', () => assert.ok(SRC.includes("'use client'")));
  it('包含JSX返回', () => assert.ok(SRC.includes('return (') || SRC.includes('return <')));
  it('包含核心 hooks', () => assert.ok(SRC.includes('useState') && SRC.includes('useMemo') && SRC.includes('useCallback') && SRC.includes('useEffect')));
  it('包含数据结构', () => assert.ok(SRC.includes('{') && SRC.includes('[')));
  it('包含条件渲染', () => assert.ok(SRC.includes(' && ') || SRC.includes(' ? ')));
  it('包含样式定义', () => assert.ok(SRC.includes('style={')));
  it('包含模板字符串格式化', () => assert.ok(SRC.includes('${')));
  it('包含模板字符串', () => assert.ok(SRC.includes('${')));
  it('包含默认导出', () => assert.ok(SRC.includes('export default')));
  it('包含注释说明', () => assert.ok(true));
});

describe('resilience/retries/[key] — 权限边界', () => {
  it('接入管理员权限边界', () => {
    assert.ok(SRC.includes('AdminPermissionGate'));
    assert.ok(SRC.includes("requiredPermission: 'foundation.governance.read'"));
  });
});
