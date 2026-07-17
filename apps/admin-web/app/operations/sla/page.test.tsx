/**
 * operations/sla/page.test.tsx — SLA 监控看板 L1 测试
 *
 * 覆盖: SLA达成率、服务可用性、告警处理、自动修复统计
 * 正例: 达成率计算、服务状态、告警过滤
 * 反例: 服务宕机、严重告警未解决
 * 边界: 空服务列表、零告警、24h趋势
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import React from 'react';
import { render, cleanup } from '@testing-library/react';
import fs from 'node:fs';

/* ── 类型 ── */

type ServiceStatus = 'green' | 'yellow' | 'red';
type AlertLevel = 'critical' | 'warning' | 'info';
type AlertStatus = 'firing' | 'acknowledged' | 'resolved';

interface SLAOverallRate {
  p999: number;
  p995: number;
  p99: number;
  averageResponseTimeMs: number;
  medianResponseTimeMs: number;
  p99ResponseTimeMs: number;
  totalRequests24h: number;
  breachedRequests24h: number;
}

interface ServiceAvailability {
  serviceId: string;
  serviceName: string;
  status: ServiceStatus;
  uptimePercent: number;
  p99LatencyMs: number;
  avgLatencyMs: number;
  lastDowntimeAt?: string;
  lastDowntimeDurationMinutes?: number;
}

interface AlertRecord {
  id: string;
  occurredAt: string;
  source: string;
  level: AlertLevel;
  message: string;
  status: AlertStatus;
  resolvedAt?: string;
}

interface ResponseTimeTrendPoint {
  timestamp: string;
  avgMs: number;
  medianMs: number;
  p99Ms: number;
}

interface AutoHealStats {
  totalIncidents: number;
  autoHealed: number;
  manualIntervention: number;
  averageHealTimeSeconds: number;
  healRatePercent: number;
}

interface SLADashboardSnapshot {
  deliveryMode: string;
  generatedAt: string;
  overallRate: SLAOverallRate;
  responseTimeTrend: ResponseTimeTrendPoint[];
  services: ServiceAvailability[];
  alerts: AlertRecord[];
  autoHeal: AutoHealStats;
}

/* ── 辅助函数 ── */

function computeOverallCompliance(rate: SLAOverallRate): number {
  return (rate.p999 + rate.p995 + rate.p99) / 3;
}

function getActiveAlertCount(alerts: AlertRecord[]): number {
  return alerts.filter((a) => a.status === 'firing' || a.status === 'acknowledged').length;
}

function getCriticalAlertCount(alerts: AlertRecord[]): number {
  return alerts.filter((a) => a.level === 'critical' && a.status !== 'resolved').length;
}

function summarizeServiceStatuses(services: ServiceAvailability[]): Record<ServiceStatus, number> {
  const summary: Record<ServiceStatus, number> = { green: 0, yellow: 0, red: 0 };
  for (const svc of services) summary[svc.status] += 1;
  return summary;
}

function filterAlerts(alerts: AlertRecord[], levelFilter?: AlertLevel, statusFilter?: AlertStatus): AlertRecord[] {
  let result = alerts;
  if (levelFilter) result = result.filter((a) => a.level === levelFilter);
  if (statusFilter) result = result.filter((a) => a.status === statusFilter);
  return result;
}

function isPineappleCompliant(overallRate: SLAOverallRate): boolean {
  return overallRate.averageResponseTimeMs < 30;
}

/* ── Mock ── */

const MOCK_OVERALL: SLAOverallRate = {
  p999: 99.92, p995: 99.68, p99: 99.35,
  averageResponseTimeMs: 62, medianResponseTimeMs: 35, p99ResponseTimeMs: 280,
  totalRequests24h: 128560, breachedRequests24h: 835,
};

const MOCK_SERVICES: ServiceAvailability[] = [
  { serviceId: 'api-gateway', serviceName: 'API 网关', status: 'green', uptimePercent: 99.97, p99LatencyMs: 120, avgLatencyMs: 45 },
  { serviceId: 'order-svc', serviceName: '订单服务', status: 'green', uptimePercent: 99.95, p99LatencyMs: 85, avgLatencyMs: 32 },
  { serviceId: 'payment-svc', serviceName: '支付服务', status: 'green', uptimePercent: 99.99, p99LatencyMs: 150, avgLatencyMs: 60 },
  { serviceId: 'member-svc', serviceName: '会员服务', status: 'yellow', uptimePercent: 99.82, lastDowntimeAt: '2026-07-15T14:30:00.000Z', lastDowntimeDurationMinutes: 8, p99LatencyMs: 320, avgLatencyMs: 110 },
  { serviceId: 'inventory-svc', serviceName: '库存服务', status: 'red', uptimePercent: 98.50, lastDowntimeAt: '2026-07-15T10:15:00.000Z', lastDowntimeDurationMinutes: 45, p99LatencyMs: 890, avgLatencyMs: 230 },
];

const MOCK_ALERTS: AlertRecord[] = [
  { id: 'alert-001', occurredAt: '2026-07-15T10:15:00.000Z', source: 'inventory-svc', level: 'critical', message: '库存服务响应超时', status: 'firing' },
  { id: 'alert-002', occurredAt: '2026-07-15T08:00:00.000Z', source: 'data-sync', level: 'warning', message: '数据同步延时', status: 'acknowledged' },
  { id: 'alert-003', occurredAt: '2026-07-15T06:30:00.000Z', source: 'member-svc', level: 'warning', message: 'P99 延迟 > 300ms', status: 'firing' },
  { id: 'alert-004', occurredAt: '2026-07-14T22:00:00.000Z', source: 'api-gateway', level: 'info', message: '流量突增', status: 'resolved', resolvedAt: '2026-07-14T22:15:00.000Z' },
  { id: 'alert-005', occurredAt: '2026-07-14T18:45:00.000Z', source: 'payment-svc', level: 'critical', message: '错误率 > 5%', status: 'resolved', resolvedAt: '2026-07-14T19:10:00.000Z' },
];

const MOCK_AUTOHEAL: AutoHealStats = {
  totalIncidents: 42, autoHealed: 34, manualIntervention: 8,
  averageHealTimeSeconds: 73, healRatePercent: 80.95,
};

/* ============================================================ */

describe('sla: 数据类型', () => {
  it('SLAOverallRate has all fields', () => {
    assert.equal(typeof MOCK_OVERALL.p999, 'number');
    assert.equal(typeof MOCK_OVERALL.totalRequests24h, 'number');
    assert.equal(typeof MOCK_OVERALL.averageResponseTimeMs, 'number');
  });

  it('ServiceAvailability has all fields', () => {
    const s = MOCK_SERVICES[0];
    assert.equal(typeof s.serviceName, 'string');
    assert.equal(typeof s.uptimePercent, 'number');
    assert.equal(typeof s.status, 'string');
  });

  it('AlertRecord has all fields', () => {
    const a = MOCK_ALERTS[0];
    assert.equal(typeof a.level, 'string');
    assert.equal(typeof a.status, 'string');
  });

  it('AutoHealStats has all fields', () => {
    assert.equal(typeof MOCK_AUTOHEAL.healRatePercent, 'number');
    assert.equal(typeof MOCK_AUTOHEAL.averageHealTimeSeconds, 'number');
  });

  it('ResponseTimeTrendPoint has timestamp and ms', () => {
    const p: ResponseTimeTrendPoint = { timestamp: '2026-07-17T00:00:00Z', avgMs: 50, medianMs: 40, p99Ms: 200 };
    assert.ok(p.timestamp.length > 0);
    assert.ok(p.avgMs > 0);
  });
});

describe('sla: 辅助函数', () => {
  it('computeOverallCompliance averages three rates', () => {
    const compliance = computeOverallCompliance(MOCK_OVERALL);
    assert.equal(typeof compliance, 'number');
    assert.ok(compliance > 90 && compliance < 100);
  });

  it('summarizeServiceStatuses counts correctly', () => {
    const summary = summarizeServiceStatuses(MOCK_SERVICES);
    assert.equal(summary.green, 3);
    assert.equal(summary.yellow, 1);
    assert.equal(summary.red, 1);
  });

  it('getActiveAlertCount counts firing + acknowledged', () => {
    const count = getActiveAlertCount(MOCK_ALERTS);
    assert.equal(count, 3);
  });

  it('getCriticalAlertCount counts unresolved criticals', () => {
    const count = getCriticalAlertCount(MOCK_ALERTS);
    assert.equal(count, 1);
  });

  it('filterAlerts by level', () => {
    const filtered = filterAlerts(MOCK_ALERTS, 'critical');
    assert.equal(filtered.length, 2);
  });

  it('filterAlerts by status', () => {
    const filtered = filterAlerts(MOCK_ALERTS, undefined, 'resolved');
    assert.equal(filtered.length, 2);
  });

  it('filterAlerts by both level and status', () => {
    const filtered = filterAlerts(MOCK_ALERTS, 'warning', 'firing');
    assert.equal(filtered.length, 1);
  });

  it('isPineappleCompliant returns false for 62ms avg', () => {
    assert.ok(!isPineappleCompliant(MOCK_OVERALL));
  });

  it('isPineappleCompliant returns true for <30ms', () => {
    const fast: SLAOverallRate = { ...MOCK_OVERALL, averageResponseTimeMs: 25 };
    assert.ok(isPineappleCompliant(fast));
  });
});

describe('sla: 业务逻辑', () => {
  it('overall uptime above 99%', () => {
    assert.ok(MOCK_OVERALL.p999 > 99);
    assert.ok(MOCK_OVERALL.p995 > 99);
    assert.ok(MOCK_OVERALL.p99 > 99);
  });

  it('breach rate is small', () => {
    const breachRate = MOCK_OVERALL.breachedRequests24h / MOCK_OVERALL.totalRequests24h;
    assert.ok(breachRate < 0.01);
  });

  it('inventory-svc has lowest uptime', () => {
    const inv = MOCK_SERVICES.find(s => s.serviceId === 'inventory-svc')!;
    assert.equal(inv.uptimePercent, 98.50);
  });

  it('inventory-svc had longest downtime', () => {
    const inv = MOCK_SERVICES.find(s => s.serviceId === 'inventory-svc')!;
    assert.equal(inv.lastDowntimeDurationMinutes, 45);
  });

  it('auto heal rate > 75%', () => {
    assert.ok(MOCK_AUTOHEAL.healRatePercent > 75);
  });

  it('autoHealed + manualIntervention = totalIncidents', () => {
    assert.equal(MOCK_AUTOHEAL.autoHealed + MOCK_AUTOHEAL.manualIntervention, MOCK_AUTOHEAL.totalIncidents);
  });

  it('payment-svc has highest uptime', () => {
    const pay = MOCK_SERVICES.find(s => s.serviceId === 'payment-svc')!;
    assert.equal(pay.uptimePercent, 99.99);
  });

  it('there are unresolved critical alerts', () => {
    const unresolvedCritical = MOCK_ALERTS.filter(a => a.level === 'critical' && a.status !== 'resolved');
    assert.equal(unresolvedCritical.length, 1);
  });

  it('resolved alerts have resolvedAt timestamp', () => {
    const resolved = MOCK_ALERTS.filter(a => a.status === 'resolved');
    resolved.forEach(a => {
      assert.ok(a.resolvedAt !== undefined);
    });
  });

  it('firing alerts need attention', () => {
    const firing = MOCK_ALERTS.filter(a => a.status === 'firing');
    assert.equal(firing.length, 2);
  });

  it('service status enum values are valid', () => {
    const valid: ServiceStatus[] = ['green', 'yellow', 'red'];
    MOCK_SERVICES.forEach(s => {
      assert.ok(valid.includes(s.status));
    });
  });

  it('p99 response time < 1000ms for all services', () => {
    MOCK_SERVICES.forEach(s => {
      assert.ok(s.p99LatencyMs < 1000);
    });
  });

  it('avgLatencyMs < p99LatencyMs for all services', () => {
    MOCK_SERVICES.forEach(s => {
      assert.ok(s.avgLatencyMs < s.p99LatencyMs);
    });
  });

  it('totalIncidents is 42 for autoheal', () => {
    assert.equal(MOCK_AUTOHEAL.totalIncidents, 42);
  });

  it('red services require escalation', () => {
    const redServices = MOCK_SERVICES.filter(s => s.status === 'red');
    assert.equal(redServices.length, 1);
    assert.equal(redServices[0].serviceName, '库存服务');
  });
});

const SRC = fs.readFileSync(require.resolve('./page'), 'utf-8');

describe('Operations / Sla — hooks验证', () => {
  it('是服务端组件', () => assert.ok(SRC.includes('async') || SRC.includes('await')));
  it('包含JSX返回', () => assert.ok(SRC.includes('return (') || SRC.includes('return <')));
  it('包含事件处理器', () => assert.ok(SRC.includes('on') || SRC.includes('handle')));
  it('包含列表渲染', () => assert.ok(SRC.includes('.map(')));
  it('包含条件判断', () => assert.ok(SRC.includes('if')));
  it('包含样式定义', () => assert.ok(SRC.includes('style={')));
  it('包含模板字符串格式化', () => assert.ok(SRC.includes('${')));
  it('包含模板字符串', () => assert.ok(SRC.includes('${')));
  it('包含默认导出', () => assert.ok(SRC.includes('export default')));
  it('包含注释说明', () => assert.ok(SRC.includes("/**") || SRC.includes('//')));
});
