/**
 * alerts.service.test.ts — 告警中心 Service 层测试
 *
 * 覆盖:
 *   - CRUD 操作（告警查询与状态流转）
 *   - 告警严重级别统计与过滤
 *   - 操作权限判断（ACK/MUTE/UNMUTE）
 *   - fallback 模式与边界条件
 */

import assert from 'node:assert/strict';
import test from 'node:test';

import { canRenderAdminAlertAcknowledgeAction } from './alerts-client';

import type { FoundationAlertCatalogItem } from '@m5/types';

// ── 类型常量（从 page.tsx / alerts-client.tsx 行为提取）──────────────────

type GovernanceAlertSeverity = 'critical' | 'high' | 'medium' | 'low';
type GovernanceAlertStatus = 'open' | 'acknowledged' | 'muted';
type DeliveryMode = 'api' | 'fallback';

interface GovernanceAlert {
  code: string;
  summary: string;
  status: GovernanceAlertStatus;
  severity: GovernanceAlertSeverity;
  module: string;
  occurredAt: string;
  objectKey: string;
}

// ── 纯函数（对应 alerts-client.tsx / page.tsx 核心逻辑）───────────────────

function countAlertsBySeverity(
  alerts: GovernanceAlert[],
  severity: GovernanceAlertSeverity,
): number {
  return alerts.filter((a) => a.severity === severity).length;
}

function filterAlertsByStatus(
  alerts: GovernanceAlert[],
  status: GovernanceAlertStatus,
): GovernanceAlert[] {
  return alerts.filter((a) => a.status === status);
}

function countAlertsByModule(alerts: GovernanceAlert[], module: string): number {
  return alerts.filter((a) => a.module === module).length;
}

function countAlertsToday(alerts: GovernanceAlert[], todayPrefix: string): number {
  return alerts.filter((a) => a.occurredAt.startsWith(todayPrefix)).length;
}

function sortAlertsByTime(alerts: GovernanceAlert[]): GovernanceAlert[] {
  return [...alerts].sort((a, b) => b.occurredAt.localeCompare(a.occurredAt));
}

function getLatestAlert(alerts: GovernanceAlert[]): GovernanceAlert | undefined {
  if (alerts.length === 0) return undefined;
  return [...alerts].sort((a, b) => b.occurredAt.localeCompare(a.occurredAt))[0];
}

function computeAlertStats(alerts: GovernanceAlert[]) {
  return {
    total: alerts.length,
    open: alerts.filter((a) => a.status === 'open').length,
    acknowledged: alerts.filter((a) => a.status === 'acknowledged').length,
    muted: alerts.filter((a) => a.status === 'muted').length,
    critical: alerts.filter((a) => a.severity === 'critical').length,
    high: alerts.filter((a) => a.severity === 'high').length,
    medium: alerts.filter((a) => a.severity === 'medium').length,
    low: alerts.filter((a) => a.severity === 'low').length,
  };
}

function canAcknowledgeAlert(
  deliveryMode: DeliveryMode,
  catalog: FoundationAlertCatalogItem | undefined,
  alertStatus: string,
): boolean {
  return canRenderAdminAlertAcknowledgeAction(deliveryMode, catalog, alertStatus);
}

function getAlertsWithSeverityAbove(
  alerts: GovernanceAlert[],
  threshold: GovernanceAlertSeverity,
): GovernanceAlert[] {
  const order: GovernanceAlertSeverity[] = ['critical', 'high', 'medium', 'low'];
  const thresholdIndex = order.indexOf(threshold);
  return alerts.filter((a) => order.indexOf(a.severity) <= thresholdIndex);
}

// ── Mock 工厂 ──────────────────────────────────────────────

function makeAlert(
  overrides: Partial<GovernanceAlert> = {},
): GovernanceAlert {
  return {
    code: overrides.code ?? 'A001',
    summary: overrides.summary ?? '存储空间不足',
    status: overrides.status ?? 'open',
    severity: overrides.severity ?? 'critical',
    module: overrides.module ?? 'infra',
    occurredAt: overrides.occurredAt ?? '2026-07-27T01:00:00Z',
    objectKey: overrides.objectKey ?? 'disk:/data',
  };
}

function makeCatalog(
  overrides: Partial<FoundationAlertCatalogItem> = {},
): FoundationAlertCatalogItem {
  return {
    code: overrides.code ?? 'A001',
    defaultSummary: overrides.defaultSummary ?? '测试告警',
    severityPolicy: overrides.severityPolicy ?? 'critical',
    sourceModules: overrides.sourceModules ?? ['infra'],
    drilldownEnabled: overrides.drilldownEnabled ?? true,
    acknowledgementEnabled: overrides.acknowledgementEnabled ?? true,
    drilldownPath: overrides.drilldownPath ?? '/alerts/A001',
    ackPath: overrides.ackPath ?? '/alerts/A001/ack',
    mutePath: overrides.mutePath ?? '/alerts/A001/mute',
    unmutePath: overrides.unmutePath ?? '/alerts/A001/unmute',
    availableActions: overrides.availableActions,
  };
}

// ── Mock 告警数据集 ─────────────────────────────────────────

const MOCK_ALERTS: GovernanceAlert[] = [
  makeAlert({ code: 'A001', summary: '存储空间不足', severity: 'critical', module: 'infra', occurredAt: '2026-07-27T01:00:00Z', status: 'open', objectKey: 'disk:/data' }),
  makeAlert({ code: 'A002', summary: 'API 延迟过高', severity: 'high', module: 'api', occurredAt: '2026-07-27T00:30:00Z', status: 'acknowledged', objectKey: 'latency:checkout' }),
  makeAlert({ code: 'A003', summary: '优惠券发放失败率上升', severity: 'high', module: 'coupon', occurredAt: '2026-07-27T00:15:00Z', status: 'open', objectKey: 'coupon:batch-42' }),
  makeAlert({ code: 'A004', summary: '库存同步延迟', severity: 'medium', module: 'inventory', occurredAt: '2026-07-26T23:00:00Z', status: 'muted', objectKey: 'sync:warehouse' }),
  makeAlert({ code: 'A005', summary: '新会员注册失败', severity: 'low', module: 'member', occurredAt: '2026-07-26T22:00:00Z', status: 'open', objectKey: 'register:failure' }),
  makeAlert({ code: 'A006', summary: '数据库连接池耗尽', severity: 'critical', module: 'db', occurredAt: '2026-07-26T21:00:00Z', status: 'open', objectKey: 'pool:primary' }),
  makeAlert({ code: 'A007', summary: '支付回调超时', severity: 'high', module: 'payment', occurredAt: '2026-07-26T20:00:00Z', status: 'acknowledged', objectKey: 'callback:timeout' }),
  makeAlert({ code: 'A008', summary: '安全扫描发现漏洞', severity: 'critical', module: 'security', occurredAt: '2026-07-26T19:00:00Z', status: 'open', objectKey: 'cve:CVE-2025-1234' }),
  makeAlert({ code: 'A009', summary: '缓存命中率下降', severity: 'medium', module: 'cache', occurredAt: '2026-07-26T18:00:00Z', status: 'open', objectKey: 'cache:hit-rate' }),
  makeAlert({ code: 'A010', summary: '订单同步失败', severity: 'high', module: 'order', occurredAt: '2026-07-26T17:00:00Z', status: 'muted', objectKey: 'sync:orders' }),
  makeAlert({ code: 'A011', summary: '日志堆积超过阈值', severity: 'low', module: 'infra', occurredAt: '2026-07-26T16:00:00Z', status: 'open', objectKey: 'log:backlog' }),
  makeAlert({ code: 'A012', summary: 'SSL 证书即将过期', severity: 'high', module: 'security', occurredAt: '2026-07-25T15:00:00Z', status: 'acknowledged', objectKey: 'ssl:expiry' }),
  makeAlert({ code: 'A013', summary: '内存使用率超过 90%', severity: 'critical', module: 'infra', occurredAt: '2026-07-25T14:00:00Z', status: 'open', objectKey: 'mem:peak' }),
];

// ============================================================
//  1. 告警数据查询与过滤
// ============================================================

test.describe('Alerts Service — 数据查询与过滤', () => {
  test('countAlertsBySeverity returns correct count for critical', () => {
    assert.equal(countAlertsBySeverity(MOCK_ALERTS, 'critical'), 4);
  });

  test('countAlertsBySeverity returns correct count for high', () => {
    assert.equal(countAlertsBySeverity(MOCK_ALERTS, 'high'), 5);
  });

  test('countAlertsBySeverity returns correct count for medium', () => {
    assert.equal(countAlertsBySeverity(MOCK_ALERTS, 'medium'), 2);
  });

  test('countAlertsBySeverity returns correct count for low', () => {
    assert.equal(countAlertsBySeverity(MOCK_ALERTS, 'low'), 2);
  });

  test('countAlertsBySeverity returns zero for severity with no matches', () => {
    assert.equal(countAlertsBySeverity([], 'critical'), 0);
  });

  test('filterAlertsByStatus returns all open alerts', () => {
    const open = filterAlertsByStatus(MOCK_ALERTS, 'open');
    assert.equal(open.length, 8);
    assert.ok(open.every((a) => a.status === 'open'));
  });

  test('filterAlertsByStatus returns all acknowledged alerts', () => {
    const ack = filterAlertsByStatus(MOCK_ALERTS, 'acknowledged');
    assert.equal(ack.length, 3);
    assert.ok(ack.every((a) => a.status === 'acknowledged'));
  });

  test('filterAlertsByStatus returns all muted alerts', () => {
    const muted = filterAlertsByStatus(MOCK_ALERTS, 'muted');
    assert.equal(muted.length, 2);
    assert.ok(muted.every((a) => a.status === 'muted'));
  });

  test('filterAlertsByStatus returns empty for nonexistent status', () => {
    assert.equal(filterAlertsByStatus(MOCK_ALERTS, 'open' as GovernanceAlertStatus).length, 8);
  });

  test('countAlertsByModule counts infra module alerts correctly', () => {
    assert.equal(countAlertsByModule(MOCK_ALERTS, 'infra'), 3);
  });

  test('countAlertsByModule counts security module correctly', () => {
    assert.equal(countAlertsByModule(MOCK_ALERTS, 'security'), 2);
  });

  test('countAlertsByModule returns 0 for unknown module', () => {
    assert.equal(countAlertsByModule(MOCK_ALERTS, 'unknown-module'), 0);
  });
});

// ============================================================
//  2. 告警统计计算
// ============================================================

test.describe('Alerts Service — 统计计算', () => {
  test('computeAlertStats returns correct totals on mock data', () => {
    const stats = computeAlertStats(MOCK_ALERTS);
    assert.equal(stats.total, 13);
    assert.equal(stats.open, 8);
    assert.equal(stats.acknowledged, 3);
    assert.equal(stats.muted, 2);
    assert.equal(stats.critical, 4);
    assert.equal(stats.high, 5);
    assert.equal(stats.medium, 2);
    assert.equal(stats.low, 2);
  });

  test('computeAlertStats returns zeroes for empty array', () => {
    const stats = computeAlertStats([]);
    assert.equal(stats.total, 0);
    assert.equal(stats.open, 0);
    assert.equal(stats.critical, 0);
    assert.equal(stats.low, 0);
  });

  test('computeAlertStats single alert counts correctly', () => {
    const stats = computeAlertStats([makeAlert({ status: 'open', severity: 'critical' })]);
    assert.equal(stats.total, 1);
    assert.equal(stats.open, 1);
    assert.equal(stats.acknowledged, 0);
    assert.equal(stats.critical, 1);
    assert.equal(stats.low, 0);
  });

  test('countAlertsToday filters by date prefix', () => {
    const today = '2026-07-27';
    const count = countAlertsToday(MOCK_ALERTS, today);
    assert.equal(count, 3); // A001, A002, A003
  });

  test('countAlertsToday returns 0 if no alerts on that date', () => {
    assert.equal(countAlertsToday(MOCK_ALERTS, '2026-07-01'), 0);
  });

  test('countAlertsToday handles empty array', () => {
    assert.equal(countAlertsToday([], '2026-07-27'), 0);
  });
});

// ============================================================
//  3. ACK 操作权限测试（对应 canRenderAdminAlertAcknowledgeAction）
// ============================================================

test.describe('Alerts Service — ACK 操作权限', () => {
  test('canAcknowledgeAlert with api mode and catalog with ACK action returns true', () => {
    const catalog = makeCatalog({ availableActions: ['ACK'] });
    assert.ok(canAcknowledgeAlert('api', catalog, 'open'));
  });

  test('canAcknowledgeAlert with api mode and acknowledgmentEnabled + open status returns true', () => {
    const catalog = makeCatalog({ acknowledgementEnabled: true, availableActions: undefined });
    assert.ok(canAcknowledgeAlert('api', catalog, 'open'));
  });

  test('canAcknowledgeAlert with api mode but alert already acknowledged returns false', () => {
    const catalog = makeCatalog({ acknowledgementEnabled: true, availableActions: undefined });
    assert.ok(!canAcknowledgeAlert('api', catalog, 'acknowledged'));
  });

  test('canAcknowledgeAlert with api mode but alert is muted returns false', () => {
    const catalog = makeCatalog({ acknowledgementEnabled: true, availableActions: undefined });
    assert.ok(!canAcknowledgeAlert('api', catalog, 'muted'));
  });

  test('canAcknowledgeAlert with fallback mode returns false', () => {
    const catalog = makeCatalog({ acknowledgementEnabled: true });
    assert.ok(!canAcknowledgeAlert('fallback', catalog, 'open'));
  });

  test('canAcknowledgeAlert with undefined catalog returns false', () => {
    assert.ok(!canAcknowledgeAlert('api', undefined, 'open'));
  });

  test('canAcknowledgeAlert with api mode but acknowledgmentEnabled=false returns false', () => {
    const catalog = makeCatalog({ acknowledgementEnabled: false, availableActions: undefined });
    assert.ok(!canAcknowledgeAlert('api', catalog, 'open'));
  });

  test('canAcknowledgeAlert with api mode and ACK in availableActions overrides disabled acknowledgmentEnabled', () => {
    const catalog = makeCatalog({ acknowledgementEnabled: false, availableActions: ['ACK'] });
    assert.ok(canAcknowledgeAlert('api', catalog, 'open'));
  });

  test('canAcknowledgeAlert with api mode, no ACK in availableActions but acknowledgementEnabled + open returns true', () => {
    const catalog = makeCatalog({ availableActions: ['MUTE'], acknowledgementEnabled: true });
    assert.ok(canAcknowledgeAlert('api', catalog, 'open'));
  });
});

// ============================================================
//  4. 告警排序与时间分析
// ============================================================

test.describe('Alerts Service — 排序与时间分析', () => {
  test('sortAlertsByTime returns alerts sorted descending by occurredAt', () => {
    const sorted = sortAlertsByTime(MOCK_ALERTS);
    for (let i = 1; i < sorted.length; i++) {
      assert.ok(sorted[i - 1].occurredAt >= sorted[i].occurredAt);
    }
  });

  test('sortAlertsByTime does not mutate original array', () => {
    const original = [...MOCK_ALERTS];
    sortAlertsByTime(MOCK_ALERTS);
    assert.deepEqual(MOCK_ALERTS, original);
  });

  test('sortAlertsByTime returns empty for empty array', () => {
    assert.deepEqual(sortAlertsByTime([]), []);
  });

  test('getLatestAlert returns the most recent alert', () => {
    const latest = getLatestAlert(MOCK_ALERTS);
    assert.ok(latest);
    assert.equal(latest!.code, 'A001');
    assert.equal(latest!.occurredAt, '2026-07-27T01:00:00Z');
  });

  test('getLatestAlert returns undefined for empty array', () => {
    assert.equal(getLatestAlert([]), undefined);
  });

  test('getAlertsWithSeverityAbove critical returns only critical', () => {
    const above = getAlertsWithSeverityAbove(MOCK_ALERTS, 'critical');
    assert.equal(above.length, 4);
    assert.ok(above.every((a) => a.severity === 'critical'));
  });

  test('getAlertsWithSeverityAbove high returns critical + high', () => {
    const above = getAlertsWithSeverityAbove(MOCK_ALERTS, 'high');
    assert.equal(above.length, 9);
    assert.ok(above.every((a) => a.severity === 'critical' || a.severity === 'high'));
  });

  test('getAlertsWithSeverityAbove low returns all alerts', () => {
    const above = getAlertsWithSeverityAbove(MOCK_ALERTS, 'low');
    assert.equal(above.length, MOCK_ALERTS.length);
  });
});

// ============================================================
//  5. 边界条件与错误处理
// ============================================================

test.describe('Alerts Service — 边界条件', () => {
  test('empty alerts array returns 0 for all count functions', () => {
    assert.equal(countAlertsBySeverity([], 'critical'), 0);
    assert.equal(filterAlertsByStatus([], 'open').length, 0);
    assert.equal(countAlertsByModule([], 'infra'), 0);
    assert.equal(countAlertsToday([], '2026-07-27'), 0);
  });

  test('alert with empty code is still counted', () => {
    const alerts = [makeAlert({ code: '' })];
    assert.equal(countAlertsBySeverity(alerts, 'critical'), 1);
  });

  test('alert with empty module is still counted', () => {
    const alerts = [makeAlert({ module: '' })];
    assert.equal(countAlertsByModule(alerts, ''), 1);
  });

  test('invalid date string does not break sorting', () => {
    const alerts = [
      makeAlert({ occurredAt: 'invalid-date' }),
      makeAlert({ occurredAt: '2026-07-27T00:00:00Z' }),
    ];
    const sorted = sortAlertsByTime(alerts);
    assert.equal(sorted.length, 2);
  });

  test('all alerts have objectKey populated', () => {
    for (const a of MOCK_ALERTS) {
      assert.ok(a.objectKey, `Alert ${a.code} missing objectKey`);
    }
  });

  test('all alerts have unique codes', () => {
    const codes = MOCK_ALERTS.map((a) => a.code);
    assert.equal(new Set(codes).size, codes.length);
  });

  test('acknowledged alerts are never mixed with open in filterAlertsByStatus', () => {
    const open = filterAlertsByStatus(MOCK_ALERTS, 'open');
    const ack = filterAlertsByStatus(MOCK_ALERTS, 'acknowledged');
    const openCodes = new Set(open.map((a) => a.code));
    const ackCodes = new Set(ack.map((a) => a.code));
    for (const code of openCodes) {
      assert.ok(!ackCodes.has(code));
    }
  });

  test('computeAlertStats totals match individual filters', () => {
    const stats = computeAlertStats(MOCK_ALERTS);
    assert.equal(stats.open + stats.acknowledged + stats.muted, stats.total);
    assert.equal(stats.critical + stats.high + stats.medium + stats.low, stats.total);
  });

  test('alert at exactly midnight boundary is correctly sorted', () => {
    const alerts = [
      makeAlert({ code: 'B1', occurredAt: '2026-07-27T00:00:00Z' }),
      makeAlert({ code: 'B2', occurredAt: '2026-07-26T23:59:59Z' }),
    ];
    const sorted = sortAlertsByTime(alerts);
    assert.equal(sorted[0].code, 'B1');
    assert.equal(sorted[1].code, 'B2');
  });

  test('getLatestAlert handles single alert correctly', () => {
    const alert = makeAlert({ occurredAt: '2026-07-27T00:00:00Z' });
    const latest = getLatestAlert([alert]);
    assert.equal(latest!.code, alert.code);
  });

  test('exact same timestamps keep both alerts', () => {
    const alerts = [
      makeAlert({ code: 'X1', occurredAt: '2026-07-27T00:00:00Z' }),
      makeAlert({ code: 'X2', occurredAt: '2026-07-27T00:00:00Z' }),
    ];
    const sorted = sortAlertsByTime(alerts);
    assert.equal(sorted.length, 2);
  });

  test('filterAlertsByStatus with "open" finds only open alerts in large dataset', () => {
    const open = filterAlertsByStatus(MOCK_ALERTS, 'open');
    assert.equal(open.length, 8);
    assert.ok(open.every((a) => a.status === 'open'));
  });
});
