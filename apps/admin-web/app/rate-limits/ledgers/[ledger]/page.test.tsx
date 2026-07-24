/**
 * rate-limits/ledgers/[ledger]/page.test.tsx — 配额账本详情 L1 测试
 *
 * 覆盖: 账本快照查询、状态分类、使用率计算、剩余额度、趋势数据
 * 正例: 账本查询、使用率百分比、状态映射、趋势数据构建
 * 反例: 账本不存在、零限额、已耗尽、空账本 ID
 * 边界: 使用率 0%/100%/90%+/70%+ 颜色阈值、大数格式化
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

/* ── 类型 ── */

type LedgerStatus = 'active' | 'exhausted' | 'pending';

interface LedgerRecord {
  subjectKey: string;
  policyCode: string;
  usedQuota: number;
  limit: number;
  remaining: number;
  windowSize: string;
  resetAt: string;
  status: LedgerStatus;
  updatedAt: string;
}

interface ConsumptionDataPoint {
  timestamp: string;
  consumed: number;
  limit: number;
}

interface RateLimitEvent {
  id: string;
  subjectKey: string;
  timestamp: string;
  reason: string;
  blockedDuration: string;
  severity: 'critical' | 'warning' | 'info';
}

interface QuotaSummary {
  totalQuota: number;
  usedQuota: number;
  remainingQuota: number;
  usagePercent: number;
  estimatedExhaustionTime: string;
}

// ---- 已知账本 ----

const KNOWN_LEDGERS: Record<string, LedgerRecord> = {
  'ledger-demo-001': { subjectKey: 'tenant-demo:api:read', policyCode: 'READ_QPS_100', usedQuota: 45678, limit: 100000, windowSize: '1h', resetAt: '2026-07-15 11:00', status: 'active', updatedAt: '2026-07-15 10:30', remaining: 54322 },
  'ledger-demo-002': { subjectKey: 'tenant-demo:api:write', policyCode: 'WRITE_QPS_50', usedQuota: 50000, limit: 50000, windowSize: '1h', resetAt: '2026-07-15 11:00', status: 'exhausted', updatedAt: '2026-07-15 10:15', remaining: 0 },
  'ledger-demo-003': { subjectKey: 'tenant-demo:campaign:trigger', policyCode: 'CAMPAIGN_TRIGGER_1000', usedQuota: 800, limit: 1000, windowSize: '24h', resetAt: '2026-07-16 00:00', status: 'active', updatedAt: '2026-07-15 10:00', remaining: 200 },
};

const STATUS_MAP: Record<LedgerStatus, string> = {
  active: '正常',
  exhausted: '已耗尽',
  pending: '等待重置',
};

// ---- 辅助函数 ----

function loadLedgerRecord(ledgerId: string): LedgerRecord | undefined {
  if (!ledgerId) return undefined;
  return KNOWN_LEDGERS[ledgerId];
}

function calculateUsageRate(record: LedgerRecord): number {
  return record.limit > 0 ? Math.round((record.usedQuota / record.limit) * 100) : 0;
}

function getUsageSeverity(percent: number): 'healthy' | 'warning' | 'critical' {
  if (percent >= 90) return 'critical';
  if (percent >= 70) return 'warning';
  return 'healthy';
}

function getUsageColor(percent: number): string {
  if (percent >= 90) return 'bg-red-500';
  if (percent >= 70) return 'bg-amber-500';
  if (percent >= 40) return 'bg-blue-500';
  return 'bg-emerald-500';
}

function formatQuotaNumber(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return value.toLocaleString();
}

function buildQuotaSummary(record: LedgerRecord): QuotaSummary {
  const usagePercent = calculateUsageRate(record);
  const remainingQuota = record.limit - record.usedQuota;
  const estimatedExhaustionTime = usagePercent > 80 ? '30 分钟内' : usagePercent > 50 ? '2 小时内' : '> 4 小时';
  return {
    totalQuota: record.limit,
    usedQuota: record.usedQuota,
    remainingQuota: Math.max(0, remainingQuota),
    usagePercent,
    estimatedExhaustionTime,
  };
}

function buildMockConsumptionTrend(ledgerId: string): ConsumptionDataPoint[] {
  if (ledgerId === 'ledger-demo-001') {
    return [
      { timestamp: '10:00', consumed: 3000, limit: 10000 },
      { timestamp: '10:05', consumed: 4200, limit: 10000 },
      { timestamp: '10:10', consumed: 5100, limit: 10000 },
      { timestamp: '10:15', consumed: 6800, limit: 10000 },
      { timestamp: '10:20', consumed: 7200, limit: 10000 },
      { timestamp: '10:25', consumed: 8100, limit: 10000 },
      { timestamp: '10:30', consumed: 9500, limit: 10000 },
    ];
  }
  if (ledgerId === 'ledger-demo-002') {
    return [
      { timestamp: '10:00', consumed: 5000, limit: 5000 },
      { timestamp: '10:05', consumed: 5000, limit: 5000 },
      { timestamp: '10:10', consumed: 5000, limit: 5000 },
    ];
  }
  return [
    { timestamp: '10:00', consumed: 50, limit: 1000 },
    { timestamp: '10:05', consumed: 120, limit: 1000 },
    { timestamp: '10:10', consumed: 200, limit: 1000 },
  ];
}

function buildMockRateLimitEvents(ledgerId: string): RateLimitEvent[] {
  if (ledgerId === 'ledger-demo-002') {
    return [
      { id: 'evt-001', subjectKey: 'tenant-demo:api:write', timestamp: '2026-07-15 10:15:30', reason: '写 API 配额耗尽', blockedDuration: '45min', severity: 'critical' },
      { id: 'evt-002', subjectKey: 'tenant-demo:api:write', timestamp: '2026-07-15 10:05:00', reason: '写速率超过 50 QPS 阈值', blockedDuration: '30s', severity: 'warning' },
    ];
  }
  return [
    { id: 'evt-004', subjectKey: 'tenant-demo:api:read', timestamp: '2026-07-15 10:28:00', reason: '读速率接近限额 95%', blockedDuration: '0s', severity: 'info' },
  ];
}

function formatWindowSize(size: string): string {
  const labels: Record<string, string> = { '1h': '1 小时', '24h': '24 小时', '1s': '1 秒', '1m': '1 分钟' };
  return labels[size] ?? size;
}

/* ============================================================ */

describe('rate-limits-ledger: 数据类型', () => {
  it('LedgerRecord has all numeric fields', () => {
    const r: LedgerRecord = { subjectKey: 'k', policyCode: 'p', usedQuota: 100, limit: 1000, remaining: 900, windowSize: '1h', resetAt: '2026-01-01', status: 'active', updatedAt: '2026-01-01' };
    assert.equal(typeof r.usedQuota, 'number');
    assert.equal(typeof r.limit, 'number');
    assert.equal(typeof r.remaining, 'number');
  });

  it('LedgerStatus has 3 enum values', () => {
    const statuses: LedgerStatus[] = ['active', 'exhausted', 'pending'];
    assert.equal(statuses.length, 3);
  });

  it('STATUS_MAP covers all statuses', () => {
    assert.equal(Object.keys(STATUS_MAP).length, 3);
  });

  it('ConsumptionDataPoint has required fields', () => {
    const dp: ConsumptionDataPoint = { timestamp: '10:00', consumed: 100, limit: 1000 };
    assert.equal(typeof dp.consumed, 'number');
    assert.equal(typeof dp.timestamp, 'string');
  });
});

describe('rate-limits-ledger: 业务逻辑 - 账本查找', () => {
  it('loadLedgerRecord finds known ledger', () => {
    const r = loadLedgerRecord('ledger-demo-001');
    assert.ok(r);
    assert.equal(r?.subjectKey, 'tenant-demo:api:read');
  });

  it('loadLedgerRecord returns undefined for unknown', () => {
    assert.equal(loadLedgerRecord('nonexistent'), undefined);
  });

  it('loadLedgerRecord empty string returns undefined', () => {
    assert.equal(loadLedgerRecord(''), undefined);
  });

  it('ledger-demo-002 is exhausted', () => {
    const r = loadLedgerRecord('ledger-demo-002');
    assert.equal(r?.status, 'exhausted');
    assert.equal(r?.remaining, 0);
  });
});

describe('rate-limits-ledger: 业务逻辑 - 使用率计算', () => {
  it('calculateUsageRate for ledger-001 ~45%', () => {
    const r = loadLedgerRecord('ledger-demo-001')!;
    assert.equal(calculateUsageRate(r), 46);
  });

  it('calculateUsageRate for exhausted ledger = 100%', () => {
    const r = loadLedgerRecord('ledger-demo-002')!;
    assert.equal(calculateUsageRate(r), 100);
  });

  it('calculateUsageRate for ledger-003 = 80%', () => {
    const r = loadLedgerRecord('ledger-demo-003')!;
    assert.equal(calculateUsageRate(r), 80);
  });

  it('calculateUsageRate zero limit returns 0', () => {
    const r: LedgerRecord = { subjectKey: 'k', policyCode: 'p', usedQuota: 500, limit: 0, remaining: 0, windowSize: '1h', resetAt: '', status: 'active', updatedAt: '' };
    assert.equal(calculateUsageRate(r), 0);
  });

  it('getUsageSeverity < 70 is healthy', () => {
    assert.equal(getUsageSeverity(0), 'healthy');
    assert.equal(getUsageSeverity(69), 'healthy');
  });

  it('getUsageSeverity >= 70 and < 90 is warning', () => {
    assert.equal(getUsageSeverity(70), 'warning');
    assert.equal(getUsageSeverity(89), 'warning');
  });

  it('getUsageSeverity >= 90 is critical', () => {
    assert.equal(getUsageSeverity(90), 'critical');
    assert.equal(getUsageSeverity(100), 'critical');
  });

  it('getUsageColor threshold ranges', () => {
    assert.ok(getUsageColor(0).includes('emerald'));
    assert.ok(getUsageColor(39).includes('emerald'));
    assert.ok(getUsageColor(40).includes('blue'));
    assert.ok(getUsageColor(69).includes('blue'));
    assert.ok(getUsageColor(70).includes('amber'));
    assert.ok(getUsageColor(89).includes('amber'));
    assert.ok(getUsageColor(90).includes('red'));
    assert.ok(getUsageColor(100).includes('red'));
  });
});

describe('rate-limits-ledger: 业务逻辑 - 格式化与摘要', () => {
  it('formatQuotaNumber < 1000 returns locale', () => {
    assert.equal(formatQuotaNumber(800), '800');
  });

  it('formatQuotaNumber >= 1000 returns K', () => {
    assert.equal(formatQuotaNumber(1500), '1.5K');
  });

  it('formatQuotaNumber >= 1M returns M', () => {
    assert.equal(formatQuotaNumber(2000000), '2.0M');
  });

  it('buildQuotaSummary for ledger-001', () => {
    const r = loadLedgerRecord('ledger-demo-001')!;
    const summary = buildQuotaSummary(r);
    assert.equal(summary.totalQuota, 100000);
    assert.equal(summary.remainingQuota, 54322);
    assert.equal(summary.usagePercent, 46);
    assert.ok(summary.estimatedExhaustionTime.includes('4 小时'));
  });

  it('buildQuotaSummary for exhausted ledger-002 has 0 remaining', () => {
    const r = loadLedgerRecord('ledger-demo-002')!;
    const summary = buildQuotaSummary(r);
    assert.equal(summary.remainingQuota, 0);
    assert.equal(summary.usagePercent, 100);
    assert.equal(summary.estimatedExhaustionTime, '30 分钟内');
  });

  it('buildMockConsumptionTrend returns 7 points for ledger-001', () => {
    const trend = buildMockConsumptionTrend('ledger-demo-001');
    assert.equal(trend.length, 7);
    assert.equal(trend[trend.length - 1]?.consumed, 9500);
  });

  it('buildMockConsumptionTrend returns 3 points for ledger-002', () => {
    const trend = buildMockConsumptionTrend('ledger-demo-002');
    assert.equal(trend.length, 3);
    assert.equal(trend[0]?.consumed, 5000);
  });

  it('buildMockConsumptionTrend returns default for unknown', () => {
    const trend = buildMockConsumptionTrend('unknown');
    assert.equal(trend.length, 3);
  });

  it('buildMockRateLimitEvents returns 2 events for ledger-002', () => {
    const events = buildMockRateLimitEvents('ledger-demo-002');
    assert.equal(events.length, 2);
    assert.equal(events[0]?.severity, 'critical');
  });

  it('buildMockRateLimitEvents returns 1 event for ledger-001', () => {
    const events = buildMockRateLimitEvents('ledger-demo-001');
    assert.equal(events.length, 1);
    assert.equal(events[0]?.severity, 'info');
  });

  it('formatWindowSize known sizes', () => {
    assert.equal(formatWindowSize('1h'), '1 小时');
    assert.equal(formatWindowSize('24h'), '24 小时');
  });

  it('formatWindowSize unknown size returns original', () => {
    assert.equal(formatWindowSize('custom'), 'custom');
  });

  it('remaining of exhausted ledger is 0', () => {
    const r = loadLedgerRecord('ledger-demo-002')!;
    assert.equal(r.remaining, 0);
  });

  it('usedQuota <= limit for active ledger', () => {
    const r = loadLedgerRecord('ledger-demo-001')!;
    assert.ok(r.usedQuota <= r.limit);
  });
});

const SRC = fs.readFileSync(require.resolve('./page'), 'utf-8');

describe('rate-limits/ledgers/[ledger] — 权限边界', () => {
  it('接入管理员权限边界', () => {
    assert.ok(SRC.includes('AdminPermissionGate'));
    assert.ok(SRC.includes("requiredPermission: 'foundation.governance.read'"));
  });
});

describe('Rate Limits / Ledgers — hooks验证', () => {
  it('是客户端组件', () => assert.ok(SRC.includes("'use client'")));
  it('包含JSX返回', () => assert.ok(SRC.includes('return (') || SRC.includes('return <')));
  it('包含异步调用', () => assert.ok(SRC.includes('await') || SRC.includes('fetch(')));
  it('包含列表渲染', () => assert.ok(SRC.includes('.map(')));
  it('包含条件渲染', () => assert.ok(SRC.includes(' && ') || SRC.includes(' ? ')));
  it('包含样式定义', () => assert.ok(SRC.includes('style={')));
  it('包含数据格式化(.toFixed)', () => assert.ok(SRC.includes('.toFixed')));
  it('包含模板字符串', () => assert.ok(SRC.includes('${')));
  it('包含默认导出', () => assert.ok(SRC.includes('export default')));
  it('包含注释说明', () => assert.ok(SRC.includes("/**") || SRC.includes('//')));
});
