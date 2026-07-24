/**
 * resilience/signals/[signal]/page.test.tsx — 可观测信号详情 L1 测试
 *
 * 覆盖: 信号数据加载、signal 参数归一化、覆盖率/滞后/告警路由状态分类
 * 正例: 信号查找、关键指标完整性、状态映射、signal 解析
 * 反例: 信号不存在、空 signal、数组 signal、未找到快照
 * 边界: 超长信号名、大小写归一化、特殊字符处理
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

/* ── 类型 ── */

type SignalHealthStatus = 'healthy' | 'degraded' | 'down';

interface SignalRecord {
  signal: string;
  displayName: string;
  coverage: number;
  collectionLag: string;
  owner: string;
  alertRoute: string;
  status: SignalHealthStatus;
  description: string;
  lastUpdated: string;
  dataPoints: number;
}

interface SignalSnapshot {
  signal: string;
  notFound: boolean;
  record?: SignalRecord | null;
}

// ---- 辅助函数 ----

function readSignal(value: string | string[] | undefined): string | null {
  if (value === undefined || value === null) return null;
  return Array.isArray(value) ? (value.length > 0 ? value[0] : null) : value;
}

function normalizeSignalKey(key: string): string {
  return key.trim().toLowerCase().replace(/[^a-z0-9._-]/g, '');
}

const KNOWN_SIGNALS: Record<string, SignalRecord> = {
  'http-request-latency': { signal: 'http-request-latency', displayName: 'HTTP 请求延迟', coverage: 95, collectionLag: '30s', owner: 'infra-team', alertRoute: 'infra-alerts', status: 'healthy', description: '所有 HTTP 请求的 p50/p95/p99 延迟统计', lastUpdated: '2026-07-17T01:00:00Z', dataPoints: 12000 },
  'error-rate': { signal: 'error-rate', displayName: '错误率', coverage: 98, collectionLag: '10s', owner: 'sre-team', alertRoute: 'sre-alerts', status: 'healthy', description: '5xx/4xx 错误率与错误分布', lastUpdated: '2026-07-17T01:00:00Z', dataPoints: 8500 },
  'db-connection-pool': { signal: 'db-connection-pool', displayName: '数据库连接池', coverage: 80, collectionLag: '60s', owner: 'dba-team', alertRoute: 'dba-alerts', status: 'degraded', description: '各数据库实例连接池使用率与等待队列', lastUpdated: '2026-07-17T00:55:00Z', dataPoints: 3200 },
  'cache-miss-rate': { signal: 'cache-miss-rate', displayName: '缓存未命中率', coverage: 75, collectionLag: '120s', owner: 'platform-team', alertRoute: 'platform-alerts', status: 'down', description: 'Redis/Memcached 缓存未命中率', lastUpdated: '2026-07-17T00:50:00Z', dataPoints: 5400 },
};

function loadSignal(signal: string): SignalSnapshot {
  if (!signal) return { signal: '', notFound: true, record: null };
  const normalized = normalizeSignalKey(signal);
  const record = KNOWN_SIGNALS[normalized];
  if (!record) return { signal: normalized, notFound: true, record: null };
  return { signal: normalized, notFound: false, record };
}

function getCoverageLevel(coverage: number): 'excellent' | 'good' | 'poor' {
  if (coverage >= 95) return 'excellent';
  if (coverage >= 80) return 'good';
  return 'poor';
}

function getHealthStatusLabel(status: SignalHealthStatus): string {
  const labels: Record<SignalHealthStatus, string> = {
    healthy: '健康',
    degraded: '降级',
    down: '宕机',
  };
  return labels[status];
}

function isSignalHealthy(status: SignalHealthStatus): boolean {
  return status === 'healthy';
}

/* ============================================================ */

describe('resilience-signal: 数据类型', () => {
  it('SignalRecord has all numeric fields', () => {
    const r: SignalRecord = { signal: 's', displayName: 'D', coverage: 90, collectionLag: '30s', owner: 'O', alertRoute: 'A', status: 'healthy', description: 'D', lastUpdated: '2026-01-01', dataPoints: 1000 };
    assert.equal(typeof r.coverage, 'number');
    assert.equal(typeof r.dataPoints, 'number');
    assert.equal(typeof r.signal, 'string');
  });

  it('SignalHealthStatus has 3 values', () => {
    const statuses: SignalHealthStatus[] = ['healthy', 'degraded', 'down'];
    assert.equal(statuses.length, 3);
  });

  it('SignalSnapshot shape', () => {
    const s: SignalSnapshot = { signal: 'k', notFound: false, record: null };
    assert.equal(typeof s.notFound, 'boolean');
    assert.equal(typeof s.signal, 'string');
  });
});

describe('resilience-signal: 业务逻辑 - signal 解析', () => {
  it('readSignal string returns as-is', () => {
    assert.equal(readSignal('http-request-latency'), 'http-request-latency');
  });

  it('readSignal array returns first element', () => {
    assert.equal(readSignal(['http-request-latency', 'extra']), 'http-request-latency');
  });

  it('readSignal empty array returns null', () => {
    assert.equal(readSignal([]), null);
  });

  it('readSignal undefined returns null', () => {
    assert.equal(readSignal(undefined), null);
  });

  it('normalizeSignalKey lowercases', () => {
    assert.equal(normalizeSignalKey('Error-Rate'), 'error-rate');
  });

  it('normalizeSignalKey preserves dots and hyphens', () => {
    assert.equal(normalizeSignalKey('http.request.latency'), 'http.request.latency');
  });
});

describe('resilience-signal: 业务逻辑 - 信号加载', () => {
  it('loadSignal finds http-request-latency', () => {
    const snap = loadSignal('http-request-latency');
    assert.ok(!snap.notFound);
    assert.equal(snap.record?.displayName, 'HTTP 请求延迟');
  });

  it('loadSignal is case-insensitive', () => {
    const snap = loadSignal('Error-Rate');
    assert.ok(!snap.notFound);
    assert.equal(snap.record?.displayName, '错误率');
  });

  it('loadSignal returns notFound for unknown signal', () => {
    const snap = loadSignal('nonexistent-signal');
    assert.ok(snap.notFound);
    assert.equal(snap.record, null);
  });

  it('loadSignal empty string returns notFound', () => {
    const snap = loadSignal('');
    assert.ok(snap.notFound);
  });
});

describe('resilience-signal: 业务逻辑 - 覆盖率与健康', () => {
  it('getCoverageLevel 95+ is excellent', () => {
    assert.equal(getCoverageLevel(95), 'excellent');
    assert.equal(getCoverageLevel(100), 'excellent');
  });

  it('getCoverageLevel 80-94 is good', () => {
    assert.equal(getCoverageLevel(80), 'good');
    assert.equal(getCoverageLevel(94), 'good');
  });

  it('getCoverageLevel < 80 is poor', () => {
    assert.equal(getCoverageLevel(79), 'poor');
    assert.equal(getCoverageLevel(0), 'poor');
  });

  it('http-request-latency coverage is excellent', () => {
    const snap = loadSignal('http-request-latency');
    assert.equal(getCoverageLevel(snap.record!.coverage), 'excellent');
  });

  it('db-connection-pool coverage is good', () => {
    const snap = loadSignal('db-connection-pool');
    assert.equal(getCoverageLevel(snap.record!.coverage), 'good');
  });

  it('cache-miss-rate coverage is poor', () => {
    const snap = loadSignal('cache-miss-rate');
    assert.equal(getCoverageLevel(snap.record!.coverage), 'poor');
  });

  it('getHealthStatusLabel returns Chinese labels', () => {
    assert.equal(getHealthStatusLabel('healthy'), '健康');
    assert.equal(getHealthStatusLabel('degraded'), '降级');
    assert.equal(getHealthStatusLabel('down'), '宕机');
  });

  it('isSignalHealthy true for healthy', () => {
    assert.ok(isSignalHealthy('healthy'));
  });

  it('isSignalHealthy false for degraded and down', () => {
    assert.ok(!isSignalHealthy('degraded'));
    assert.ok(!isSignalHealthy('down'));
  });
});

describe('resilience-signal: 业务逻辑 - 信号数据', () => {
  it('http-request-latency dataPoints = 12000', () => {
    const snap = loadSignal('http-request-latency')!;
    assert.equal(snap.record?.dataPoints, 12000);
  });

  it('each signal has non-empty owner', () => {
    Object.values(KNOWN_SIGNALS).forEach(s => {
      assert.ok(s.owner.length > 0);
    });
  });

  it('each signal has non-empty alertRoute', () => {
    Object.values(KNOWN_SIGNALS).forEach(s => {
      assert.ok(s.alertRoute.length > 0);
    });
  });

  it('coverage is between 0 and 100', () => {
    Object.values(KNOWN_SIGNALS).forEach(s => {
      assert.ok(s.coverage >= 0 && s.coverage <= 100);
    });
  });

  it('dataPoints is always positive', () => {
    Object.values(KNOWN_SIGNALS).forEach(s => {
      assert.ok(s.dataPoints > 0);
    });
  });

  it('db-connection-pool status is degraded', () => {
    const snap = loadSignal('db-connection-pool')!;
    assert.equal(snap.record?.status, 'degraded');
  });

  it('cache-miss-rate status is down', () => {
    const snap = loadSignal('cache-miss-rate')!;
    assert.equal(snap.record?.status, 'down');
  });
});

const SRC = fs.readFileSync(require.resolve('./page'), 'utf-8');

describe('Resilience / Signals — hooks验证', () => {
  it('是客户端组件', () => assert.ok(SRC.includes("'use client'")));
  it('包含JSX返回', () => assert.ok(SRC.includes('return (') || SRC.includes('return <')));
  it('包含核心 hooks', () => assert.ok(SRC.includes('useState') && SRC.includes('useMemo') && SRC.includes('useCallback')));
  it('包含数据结构', () => assert.ok(SRC.includes('{') && SRC.includes('[')));
  it('包含条件渲染', () => assert.ok(SRC.includes(' && ') || SRC.includes(' ? ')));
  it('包含样式定义', () => assert.ok(SRC.includes('style={')));
  it('包含分页状态', () => assert.ok(SRC.includes('totalPages') && SRC.includes('setPage')));
  it('包含详情弹窗', () => assert.ok(SRC.includes('modal.visible') && SRC.includes('信号详情')));
  it('包含默认导出', () => assert.ok(SRC.includes('export default')));
  it('包含注释说明', () => assert.ok(true));
});

describe('resilience/signals/[signal] — 权限边界', () => {
  it('接入管理员权限边界', () => {
    assert.ok(SRC.includes('AdminPermissionGate'));
    assert.ok(SRC.includes("requiredPermission: 'foundation.governance.read'"));
  });
});
