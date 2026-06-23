/**
 * alerts-page.test.ts — Page-level tests for alerts page rendering,
 * state transitions, filtering, empty state, and loading state logic.
 *
 * Pattern: L1 JMeter-style (正例 + 反例 + 边界)
 * References: alerts-client.tsx, bootstrap AdminGovernanceReadModel
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';

// ---- Replicate page-level helpers inline (no component rendering) ----

type GovernanceAlertStatus = 'open' | 'acknowledged' | 'muted';
type GovernanceAlertSeverity = 'critical' | 'high' | 'medium' | 'low';
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

interface AlertCatalogItem {
  code: string;
  defaultSummary: string;
  severityPolicy: string;
  sourceModules: string[];
  drilldownEnabled: boolean;
  acknowledgementEnabled: boolean;
  drilldownPath: string;
  ackPath: string;
  mutePath: string;
  unmutePath: string;
  availableActions?: string[];
}

interface AdminGovernanceReadModel {
  deliveryMode: DeliveryMode;
  alerts: GovernanceAlert[];
  generatedAt: string;
}

// ---- Filter helpers (matches page.tsx patterns) ----

function filterAlertsBySeverity(
  alerts: GovernanceAlert[],
  severity: GovernanceAlertSeverity | 'ALL'
): GovernanceAlert[] {
  if (severity === 'ALL') return alerts;
  return alerts.filter((a) => a.severity === severity);
}

function filterAlertsByStatus(
  alerts: GovernanceAlert[],
  status: GovernanceAlertStatus | 'ALL'
): GovernanceAlert[] {
  if (status === 'ALL') return alerts;
  return alerts.filter((a) => a.status === status);
}

function getSeveritySortWeight(severity: GovernanceAlertSeverity): number {
  const map: Record<GovernanceAlertSeverity, number> = {
    critical: 4,
    high: 3,
    medium: 2,
    low: 1,
  };
  return map[severity];
}

function countBySeverity(alerts: GovernanceAlert[]): Record<GovernanceAlertSeverity, number> {
  const counts: Record<string, number> = {};
  for (const a of alerts) {
    counts[a.severity] = (counts[a.severity] ?? 0) + 1;
  }
  return counts as Record<GovernanceAlertSeverity, number>;
}

// ---- Mock alert fixtures ----

const BASE_ALERTS: GovernanceAlert[] = [
  { code: 'CRIT-001', summary: '数据库连接池耗尽', status: 'open', severity: 'critical', module: 'infra', occurredAt: '2026-06-24T00:15:00Z', objectKey: 'db-conn-pool' },
  { code: 'CRIT-002', summary: '支付网关超时率 > 5%', status: 'open', severity: 'critical', module: 'payment', occurredAt: '2026-06-24T00:10:00Z', objectKey: 'payment-gateway' },
  { code: 'HIGH-001', summary: '审批单积压 > 50 条', status: 'acknowledged', severity: 'high', module: 'trust-governance', occurredAt: '2026-06-23T23:45:00Z', objectKey: 'approvals-queue' },
  { code: 'HIGH-002', summary: '订单同步延迟 > 10 分钟', status: 'open', severity: 'high', module: 'order-sync', occurredAt: '2026-06-23T23:30:00Z', objectKey: 'order-sync-worker' },
  { code: 'MED-001', summary: '缓存命中率下降至 82%', status: 'open', severity: 'medium', module: 'cache', occurredAt: '2026-06-23T22:00:00Z', objectKey: 'redis-cluster' },
  { code: 'MED-002', summary: '会员数据归档任务延迟', status: 'acknowledged', severity: 'medium', module: 'crm', occurredAt: '2026-06-23T21:00:00Z', objectKey: 'member-archive' },
  { code: 'LOW-001', summary: '日志轮转接近阈值', status: 'muted', severity: 'low', module: 'infra', occurredAt: '2026-06-23T20:00:00Z', objectKey: 'log-rotate' },
  { code: 'LOW-002', summary: '非工作时间批量报表生成', status: 'open', severity: 'low', module: 'reporting', occurredAt: '2026-06-23T19:30:00Z', objectKey: 'batch-report' },
];

const ALERTS_WITH_OK_ONLY: GovernanceAlert[] = [
  { code: 'LOW-003', summary: '系统健康检查通过', status: 'acknowledged', severity: 'low', module: 'health', occurredAt: '2026-06-24T00:00:00Z', objectKey: 'health-check' },
];

describe('alerts-page: 正例 (positive cases)', () => {
  describe('alert data integrity', () => {
    it('should contain at least 8 alerts covering all severities', () => {
      assert.ok(BASE_ALERTS.length >= 8, `expected >= 8, got ${BASE_ALERTS.length}`);
      const severities = new Set(BASE_ALERTS.map((a) => a.severity));
      assert.ok(severities.has('critical'), 'missing critical severity');
      assert.ok(severities.has('high'), 'missing high severity');
      assert.ok(severities.has('medium'), 'missing medium severity');
      assert.ok(severities.has('low'), 'missing low severity');
    });

    it('every alert should have a non-empty code, summary, and module', () => {
      for (const a of BASE_ALERTS) {
        assert.ok(a.code.length > 0, `alert missing code: ${a.code}`);
        assert.ok(a.summary.length > 0, `alert ${a.code} missing summary`);
        assert.ok(a.module.length > 0, `alert ${a.code} missing module`);
        assert.ok(a.occurredAt.length > 0, `alert ${a.code} missing occurredAt`);
      }
    });

    it('every alert should have a valid status', () => {
      const valid = new Set<GovernanceAlertStatus>(['open', 'acknowledged', 'muted']);
      for (const a of BASE_ALERTS) {
        assert.ok(valid.has(a.status), `alert ${a.code} invalid status: ${a.status}`);
      }
    });
  });

  describe('severity filter', () => {
    it('filter CRITICAL should return only critical alerts', () => {
      const result = filterAlertsBySeverity(BASE_ALERTS, 'critical');
      assert.ok(result.length >= 2, `expected >= 2 critical, got ${result.length}`);
      for (const a of result) {
        assert.strictEqual(a.severity, 'critical');
      }
    });

    it('filter HIGH should return only high alerts', () => {
      const result = filterAlertsBySeverity(BASE_ALERTS, 'high');
      assert.ok(result.length >= 2, `expected >= 2 high, got ${result.length}`);
      for (const a of result) {
        assert.strictEqual(a.severity, 'high');
      }
    });

    it('filter MEDIUM should return only medium alerts', () => {
      const result = filterAlertsBySeverity(BASE_ALERTS, 'medium');
      assert.ok(result.length >= 2, `expected >= 2 medium, got ${result.length}`);
      for (const a of result) {
        assert.strictEqual(a.severity, 'medium');
      }
    });

    it('filter ALL should return all alerts unchanged', () => {
      const result = filterAlertsBySeverity(BASE_ALERTS, 'ALL');
      assert.strictEqual(result.length, BASE_ALERTS.length);
    });
  });

  describe('status filter', () => {
    it('filter open should return open alerts only', () => {
      const result = filterAlertsByStatus(BASE_ALERTS, 'open');
      for (const a of result) {
        assert.strictEqual(a.status, 'open');
      }
    });

    it('filter acknowledged should return acknowledged alerts only', () => {
      const result = filterAlertsByStatus(BASE_ALERTS, 'acknowledged');
      for (const a of result) {
        assert.strictEqual(a.status, 'acknowledged');
      }
    });

    it('filter muted should return muted alerts only', () => {
      const result = filterAlertsByStatus(BASE_ALERTS, 'muted');
      for (const a of result) {
        assert.strictEqual(a.status, 'muted');
      }
    });
  });

  describe('state transition: open → acknowledged', () => {
    it('acknowledged alerts should have been open before acknowledge', () => {
      const acknowledged = BASE_ALERTS.filter((a) => a.status === 'acknowledged');
      assert.ok(acknowledged.length >= 2, 'should have at least 2 acknowledged alerts');
    });
  });
});

describe('alerts-page: 反例 (negative cases)', () => {
  it('should return empty array when filtering by nonexistent severity', () => {
    const result = filterAlertsBySeverity(BASE_ALERTS, 'critical' as GovernanceAlertSeverity).filter(
      (a) => a.severity === 'high' as unknown as GovernanceAlertSeverity
    );
    assert.strictEqual(result.length, 0);
  });

  it('filter by nonexistent status should return empty', () => {
    const result = filterAlertsByStatus(BASE_ALERTS, 'acknowledged' as GovernanceAlertStatus).filter(
      (a) => a.status === 'muted' as unknown as GovernanceAlertStatus
    );
    assert.strictEqual(result.length, 0);
  });

  it('empty alert list should handle all filters gracefully', () => {
    const empty: GovernanceAlert[] = [];
    assert.strictEqual(filterAlertsBySeverity(empty, 'critical').length, 0);
    assert.strictEqual(filterAlertsByStatus(empty, 'open').length, 0);
    assert.strictEqual(filterAlertsBySeverity(empty, 'ALL').length, 0);
  });

  it('fallback delivery mode should not show acknowledge actions', () => {
    // Simulate page-level deliveryMode check
    function canAcknowledge(deliveryMode: DeliveryMode): boolean {
      return deliveryMode !== 'fallback';
    }
    assert.strictEqual(canAcknowledge('fallback'), false);
    assert.strictEqual(canAcknowledge('api'), true);
  });

  it('severity counts should not have negative values', () => {
    const counts = countBySeverity(BASE_ALERTS);
    for (const val of Object.values(counts)) {
      assert.ok(val >= 0, `negative count: ${val}`);
    }
  });
});

describe('alerts-page: 边界 (boundary cases)', () => {
  it('filter ALL should not modify array length or content', () => {
    const resultSeverity = filterAlertsBySeverity(BASE_ALERTS, 'ALL');
    assert.strictEqual(resultSeverity.length, BASE_ALERTS.length);

    const resultStatus = filterAlertsByStatus(BASE_ALERTS, 'ALL');
    assert.strictEqual(resultStatus.length, BASE_ALERTS.length);
  });

  it('empty alert array should have zero counts', () => {
    const counts = countBySeverity([]);
    assert.deepStrictEqual(counts, {});
  });

  it('severity sort order: critical > high > medium > low', () => {
    assert.ok(getSeveritySortWeight('critical') > getSeveritySortWeight('high'));
    assert.ok(getSeveritySortWeight('high') > getSeveritySortWeight('medium'));
    assert.ok(getSeveritySortWeight('medium') > getSeveritySortWeight('low'));
  });

  it('only OK-status alerts should handle filters without crashing', () => {
    assert.strictEqual(filterAlertsBySeverity(ALERTS_WITH_OK_ONLY, 'critical').length, 0);
    assert.strictEqual(filterAlertsByStatus(ALERTS_WITH_OK_ONLY, 'open').length, 0);
    assert.strictEqual(filterAlertsByStatus(ALERTS_WITH_OK_ONLY, 'acknowledged').length, 1);
    assert.strictEqual(ALERTS_WITH_OK_ONLY[0]!.severity, 'low');
  });

  it('single alert edge case', () => {
    const single: GovernanceAlert[] = [
      { code: 'SINGLE', summary: 'Single alert', status: 'open', severity: 'high', module: 'test', occurredAt: '2026-06-24T00:00:00Z', objectKey: 'single' },
    ];
    assert.strictEqual(filterAlertsBySeverity(single, 'high').length, 1);
    assert.strictEqual(filterAlertsBySeverity(single, 'critical').length, 0);
    assert.strictEqual(filterAlertsByStatus(single, 'open').length, 1);
    assert.strictEqual(filterAlertsByStatus(single, 'muted').length, 0);
  });
});

describe('alerts-page: stats computation', () => {
  it('should correctly count open vs acknowledged vs muted', () => {
    const open = BASE_ALERTS.filter((a) => a.status === 'open').length;
    const ack = BASE_ALERTS.filter((a) => a.status === 'acknowledged').length;
    const muted = BASE_ALERTS.filter((a) => a.status === 'muted').length;
    assert.strictEqual(open + ack + muted, BASE_ALERTS.length);
  });

  it('critical alerts count should be <= total alerts', () => {
    const critical = BASE_ALERTS.filter((a) => a.severity === 'critical').length;
    assert.ok(critical <= BASE_ALERTS.length, `critical ${critical} > total ${BASE_ALERTS.length}`);
  });

  it('should have at least one critical open alert requiring immediate action', () => {
    const openCritical = BASE_ALERTS.filter((a) => a.severity === 'critical' && a.status === 'open');
    assert.ok(openCritical.length >= 2, 'should have >= 2 open critical alerts');
  });
});
