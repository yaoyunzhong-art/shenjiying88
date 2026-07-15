/**
 * operations/sla/page.test.ts — SLA 监控看板测试
 *
 * L1 JMeter 风格: 正例 + 反例 + 边界
 * 覆盖:
 * - SLA 达成率卡片 / 响应时间趋势 / 服务可用性 / 告警列表 / 筛选 / 空状态 / 错误状态
 * - 类型定义完整性
 * - View model 工具函数
 * - ≥12 个测试
 */
import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';

import type {
  SLAOverallRate,
  ServiceAvailability,
  ResponseTimeTrendPoint,
  AlertRecord,
  AutoHealStats,
  SLADashboardSnapshot,
  SLAQuantile,
  ServiceStatus,
  AlertLevel,
  AlertStatus,
} from '../../sla-types';
import {
  SLA_QUANTILE_LABEL,
  SERVICE_STATUS_LABEL,
  SERVICE_STATUS_COLOR,
  ALERT_LEVEL_LABEL,
  ALERT_LEVEL_COLOR,
  ALERT_STATUS_LABEL,
  ALERT_STATUS_COLOR,
} from '../../sla-types';
import {
  loadSLADashboard,
  summarizeServiceStatuses,
  filterAlerts,
  computeOverallCompliance,
  isPineappleCompliant,
  getActiveAlertCount,
  getCriticalAlertCount,
  formatMs,
  formatPercent,
} from '../../sla-view-model';

// ── 抽样数据 ───────────────────────────────────────────────────────────────────

const SAMPLE_OVERALL: SLAOverallRate = {
  p999: 99.92,
  p995: 99.68,
  p99: 99.35,
  averageResponseTimeMs: 62,
  medianResponseTimeMs: 35,
  p99ResponseTimeMs: 280,
  totalRequests24h: 128_560,
  breachedRequests24h: 835,
};

const SAMPLE_SERVICES: ServiceAvailability[] = [
  { serviceId: 'api-gw', serviceName: 'API 网关', status: 'green', uptimePercent: 99.97, p99LatencyMs: 120, avgLatencyMs: 45 },
  { serviceId: 'order-svc', serviceName: '订单服务', status: 'green', uptimePercent: 99.95, p99LatencyMs: 85, avgLatencyMs: 32 },
  { serviceId: 'member-svc', serviceName: '会员服务', status: 'yellow', uptimePercent: 99.82, lastDowntimeAt: '2026-07-15T14:30:00.000Z', lastDowntimeDurationMinutes: 8, p99LatencyMs: 320, avgLatencyMs: 110 },
  { serviceId: 'inventory-svc', serviceName: '库存服务', status: 'red', uptimePercent: 98.50, lastDowntimeAt: '2026-07-15T10:15:00.000Z', lastDowntimeDurationMinutes: 45, p99LatencyMs: 890, avgLatencyMs: 230 },
  { serviceId: 'device-svc', serviceName: '设备服务', status: 'green', uptimePercent: 99.91, p99LatencyMs: 95, avgLatencyMs: 28 },
  { serviceId: 'data-sync', serviceName: '数据同步', status: 'yellow', uptimePercent: 99.75, lastDowntimeAt: '2026-07-15T08:00:00.000Z', lastDowntimeDurationMinutes: 15, p99LatencyMs: 450, avgLatencyMs: 180 },
];

const SAMPLE_ALERTS: AlertRecord[] = [
  { id: 'a1', occurredAt: '2026-07-15T10:15:00.000Z', source: 'inventory-svc', level: 'critical', message: '响应超时', status: 'firing' },
  { id: 'a2', occurredAt: '2026-07-15T08:00:00.000Z', source: 'data-sync', level: 'warning', message: '同步延时', status: 'acknowledged' },
  { id: 'a3', occurredAt: '2026-07-14T22:00:00.000Z', source: 'api-gw', level: 'info', message: '流量突增', status: 'resolved', resolvedAt: '2026-07-14T22:15:00.000Z' },
  { id: 'a4', occurredAt: '2026-07-14T18:45:00.000Z', source: 'payment-svc', level: 'critical', message: '错误率 >5%', status: 'resolved', resolvedAt: '2026-07-14T19:10:00.000Z' },
  { id: 'a5', occurredAt: '2026-07-14T12:00:00.000Z', source: 'device-svc', level: 'warning', message: '心跳超时', status: 'acknowledged' },
];

const SAMPLE_TREND: ResponseTimeTrendPoint[] = [
  { timestamp: '2026-07-15T00:00:00.000Z', avgMs: 55, medianMs: 30, p99Ms: 210 },
  { timestamp: '2026-07-15T01:00:00.000Z', avgMs: 48, medianMs: 28, p99Ms: 190 },
  { timestamp: '2026-07-15T02:00:00.000Z', avgMs: 72, medianMs: 42, p99Ms: 350 },
];

const SAMPLE_AUTO_HEAL: AutoHealStats = {
  totalIncidents: 42,
  autoHealed: 34,
  manualIntervention: 8,
  averageHealTimeSeconds: 73,
  healRatePercent: 80.95,
};

// ── 正例 ──────────────────────────────────────────────────────────────────────

describe('sla-page: 正例 (positive cases)', () => {
  describe('SLA 达成率卡片', () => {
    it('loadSLADashboard 应返回快照含三个分位的达成率', () => {
      const snap = loadSLADashboard();
      assert.ok(snap.overallRate.p999 > 0);
      assert.ok(snap.overallRate.p995 > 0);
      assert.ok(snap.overallRate.p99 > 0);
      assert.strictEqual(snap.deliveryMode, 'fallback');
    });

    it('computeOverallCompliance 应计算三均值', () => {
      const avg = computeOverallCompliance(SAMPLE_OVERALL);
      const expected = (99.92 + 99.68 + 99.35) / 3;
      assert.strictEqual(avg, expected);
    });
  });

  describe('响应时间趋势', () => {
    it('趋势数据应有 25 个点 (24h + 当前)', () => {
      const snap = loadSLADashboard();
      assert.ok(snap.responseTimeTrend.length >= 24);
      assert.ok(snap.responseTimeTrend.length <= 26);
    });

    it('每个趋势点应包含 avg/median/p99', () => {
      const point = SAMPLE_TREND[0];
      assert.ok(point);
      assert.ok(point.avgMs > 0);
      assert.ok(point.medianMs > 0);
      assert.ok(point.p99Ms > 0);
      assert.ok(point.p99Ms >= point.avgMs);
    });
  });

  describe('服务可用性', () => {
    it('summarizeServiceStatuses 应正确分组统计', () => {
      const summary = summarizeServiceStatuses(SAMPLE_SERVICES);
      assert.strictEqual(summary.green, 3);  // api-gw, order-svc, device-svc
      assert.strictEqual(summary.yellow, 2); // member-svc, data-sync
      assert.strictEqual(summary.red, 1);    // inventory-svc
    });

    it('各服务应有 uptimePercent 且值合法', () => {
      for (const svc of SAMPLE_SERVICES) {
        assert.ok(svc.uptimePercent >= 0 && svc.uptimePercent <= 100);
      }
    });
  });

  describe('告警列表', () => {
    it('getActiveAlertCount 应统计 firing + acknowledged', () => {
      const count = getActiveAlertCount(SAMPLE_ALERTS);
      // a1=firing, a2=acknowledged, a5=acknowledged → 3
      assert.strictEqual(count, 3);
    });

    it('getCriticalAlertCount 应统计未解决的 critical', () => {
      const count = getCriticalAlertCount(SAMPLE_ALERTS);
      // a1=critical+firing → 1, a4=critical+resolved → 0
      assert.strictEqual(count, 1);
    });

    it('filterAlerts 应按级别过滤', () => {
      const criticalAlerts = filterAlerts(SAMPLE_ALERTS, 'critical');
      assert.strictEqual(criticalAlerts.length, 2);
      assert.ok(criticalAlerts.every((a) => a.level === 'critical'));
    });

    it('filterAlerts 应按状态过滤', () => {
      const resolved = filterAlerts(SAMPLE_ALERTS, undefined, 'resolved');
      assert.strictEqual(resolved.length, 2);
      assert.ok(resolved.every((a) => a.status === 'resolved'));
    });
  });

  describe('自动修复统计', () => {
    it('healRatePercent 应与 autoHealed / totalIncidents * 100 近似', () => {
      const expected = (SAMPLE_AUTO_HEAL.autoHealed / SAMPLE_AUTO_HEAL.totalIncidents) * 100;
      assert.ok(Math.abs(SAMPLE_AUTO_HEAL.healRatePercent - expected) < 0.01);
    });
  });

  describe('格式化工具', () => {
    it('formatMs 应正确显示毫秒', () => {
      assert.strictEqual(formatMs(500), '500ms');
      assert.strictEqual(formatMs(1000), '1.0s');
      assert.strictEqual(formatMs(0), '0ms');
    });

    it('formatPercent 应正确显示百分数', () => {
      assert.strictEqual(formatPercent(99.1234), '99.12%');
      assert.strictEqual(formatPercent(100), '100.00%');
      assert.strictEqual(formatPercent(0), '0.00%');
    });
  });

  describe('类型标签映射', () => {
    it('SLA_QUANTILE_LABEL 应覆盖所有分位', () => {
      assert.strictEqual(SLA_QUANTILE_LABEL.p999, '99.9%');
      assert.strictEqual(SLA_QUANTILE_LABEL.p995, '99.5%');
      assert.strictEqual(SLA_QUANTILE_LABEL.p99, '99.0%');
    });

    it('SERVICE_STATUS_LABEL/COLOR 应覆盖所有状态', () => {
      assert.strictEqual(SERVICE_STATUS_LABEL.green, '正常');
      assert.strictEqual(SERVICE_STATUS_LABEL.yellow, '告警');
      assert.strictEqual(SERVICE_STATUS_LABEL.red, '故障');
      assert.ok(SERVICE_STATUS_COLOR.green);
      assert.ok(SERVICE_STATUS_COLOR.yellow);
      assert.ok(SERVICE_STATUS_COLOR.red);
    });
  });
});

// ── 反例 ──────────────────────────────────────────────────────────────────────

describe('sla-page: 反例 (negative cases)', () => {
  it('空服务数组应返回零计数', () => {
    const summary = summarizeServiceStatuses([]);
    assert.deepStrictEqual(summary, { green: 0, yellow: 0, red: 0 });
  });

  it('空告警数组应返回零活跃告警', () => {
    assert.strictEqual(getActiveAlertCount([]), 0);
    assert.strictEqual(getCriticalAlertCount([]), 0);
  });

  it('filterAlerts 空数组应返回空', () => {
    assert.strictEqual(filterAlerts([], 'critical').length, 0);
    assert.strictEqual(filterAlerts([], undefined, 'firing').length, 0);
  });

  it('isPineappleCompliant 平均响应 > 30ms 应返回 false', () => {
    assert.strictEqual(isPineappleCompliant(SAMPLE_OVERALL), false);
  });
});

// ── 边界 ──────────────────────────────────────────────────────────────────────

describe('sla-page: 边界 (boundary cases)', () => {
  it('SLA 达成率 100% 时应为达标', () => {
    const perfect: SLAOverallRate = {
      ...SAMPLE_OVERALL,
      p999: 100,
      p995: 100,
      p99: 100,
    };
    assert.strictEqual(computeOverallCompliance(perfect), 100);
  });

  it('SLA 达成率 0% 时仍应正常计算', () => {
    const zero: SLAOverallRate = {
      ...SAMPLE_OVERALL,
      p999: 0,
      p995: 0,
      p99: 0,
    };
    assert.strictEqual(computeOverallCompliance(zero), 0);
  });

  it('formatMs 应处理极大值', () => {
    assert.strictEqual(formatMs(999999), '1000.0s');
  });

  it('formatPercent 应处理极值', () => {
    assert.strictEqual(formatPercent(0.001, 3), '0.001%');
    assert.strictEqual(formatPercent(99.9999, 1), '100.0%');
  });

  it('服务宕机未定义时容错', () => {
    const svc: ServiceAvailability = {
      serviceId: 'test',
      serviceName: '测试',
      status: 'green',
      uptimePercent: 100,
      p99LatencyMs: 0,
      avgLatencyMs: 0,
    };
    assert.strictEqual(svc.lastDowntimeAt, undefined);
    assert.strictEqual(svc.lastDowntimeDurationMinutes, undefined);
  });
});
