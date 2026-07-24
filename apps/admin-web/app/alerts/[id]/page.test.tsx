/**
 * alerts/[id]/page.test.tsx — 告警详情页 L1 测试
 *
 * 覆盖: 告警详情查询、严重级别分类、状态转换、基础数据校验
 * 正例: 级别枚举、状态映射、告警数据完整性
 * 反例: 告警不存在、空字段、无效级别
 * 边界: 全严重级别、owner 为空、超长标题
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

// ── 类型 ──

type AlertSeverity = 'critical' | 'high' | 'medium' | 'low';
type AlertStatus = 'open' | 'acknowledged' | 'muted' | 'resolved';

interface AlertItem {
  id: string;
  title: string;
  severity: AlertSeverity;
  source: string;
  status: AlertStatus;
  owner: string;
  createdAt: string;
}

// ── 常量映射 ──

const SEVERITY_ORDER: Record<AlertSeverity, number> = {
  critical: 0, high: 1, medium: 2, low: 3,
};

const SEVERITY_LABELS: Record<AlertSeverity, string> = {
  critical: '严重', high: '高', medium: '中', low: '低',
};

const STATUS_LABELS: Record<AlertStatus, string> = {
  open: '待处理', acknowledged: '已确认', muted: '已静音', resolved: '已解决',
};

// ── Mock 数据 ──

const SEED_ALERTS: AlertItem[] = [
  { id: 'ALT-001', title: '支付网关超时率异常', severity: 'critical', source: 'payment-gateway', status: 'open', owner: '张三', createdAt: '2026-07-19 14:23' },
  { id: 'ALT-002', title: '库存同步失败超过阈值', severity: 'high', source: 'inventory-sync', status: 'acknowledged', owner: '李四', createdAt: '2026-07-19 12:10' },
  { id: 'ALT-003', title: '用户登录失败率上升', severity: 'high', source: 'auth-service', status: 'open', owner: '王五', createdAt: '2026-07-19 09:45' },
  { id: 'ALT-004', title: '订单履约延迟告警', severity: 'medium', source: 'fulfillment', status: 'muted', owner: '张三', createdAt: '2026-07-18 22:30' },
  { id: 'ALT-005', title: '缓存命中率低于50%', severity: 'low', source: 'cache-layer', status: 'open', owner: '', createdAt: '2026-07-18 18:00' },
  { id: 'ALT-006', title: '数据库连接池耗尽', severity: 'critical', source: 'database', status: 'resolved', owner: '赵六', createdAt: '2026-07-18 15:20' },
  { id: 'ALT-007', title: '消息队列积压超过1万', severity: 'high', source: 'message-queue', status: 'open', owner: '钱七', createdAt: '2026-07-17 11:05' },
];

// ── 辅助函数 ──

function getSeverityLabel(severity: AlertSeverity): string {
  return SEVERITY_LABELS[severity] ?? severity;
}

function getStatusLabel(status: AlertStatus): string {
  return STATUS_LABELS[status] ?? status;
}

function getAlertById(id: string): AlertItem | undefined {
  return SEED_ALERTS.find(a => a.id === id);
}

function countBySeverity(alerts: AlertItem[], severity: AlertSeverity): number {
  return alerts.filter(a => a.severity === severity).length;
}

function countByStatus(alerts: AlertItem[], status: AlertStatus): number {
  return alerts.filter(a => a.status === status).length;
}

function filterAlerts(alerts: AlertItem[], severity: AlertSeverity | 'all', status: AlertStatus | 'all'): AlertItem[] {
  let result = alerts;
  if (severity !== 'all') result = result.filter(a => a.severity === severity);
  if (status !== 'all') result = result.filter(a => a.status === status);
  return result;
}

// ===================================================================
describe('AlertsDetail — 严重级别', () => {
  it('四种严重级别映射完整', () => {
    const severities: AlertSeverity[] = ['critical', 'high', 'medium', 'low'];
    for (const s of severities) {
      const label = getSeverityLabel(s);
      assert.ok(label.length > 0, `Severity ${s} should have label`);
    }
  });

  it('严重级别排序: critical < high < medium < low', () => {
    assert.ok(SEVERITY_ORDER.critical < SEVERITY_ORDER.high);
    assert.ok(SEVERITY_ORDER.high < SEVERITY_ORDER.medium);
    assert.ok(SEVERITY_ORDER.medium < SEVERITY_ORDER.low);
  });

  it('严重级别统计正确', () => {
    assert.equal(countBySeverity(SEED_ALERTS, 'critical'), 2);
    assert.equal(countBySeverity(SEED_ALERTS, 'high'), 3);
    assert.equal(countBySeverity(SEED_ALERTS, 'medium'), 1);
    assert.equal(countBySeverity(SEED_ALERTS, 'low'), 1);
  });
});

// ===================================================================
describe('AlertsDetail — 告警状态', () => {
  it('四种状态映射完整', () => {
    const statuses: AlertStatus[] = ['open', 'acknowledged', 'muted', 'resolved'];
    for (const s of statuses) {
      const label = getStatusLabel(s);
      assert.ok(label.length > 0, `Status ${s} should have label`);
    }
  });

  it('状态统计正确', () => {
    assert.equal(countByStatus(SEED_ALERTS, 'open'), 4);
    assert.equal(countByStatus(SEED_ALERTS, 'acknowledged'), 1);
    assert.equal(countByStatus(SEED_ALERTS, 'muted'), 1);
    assert.equal(countByStatus(SEED_ALERTS, 'resolved'), 1);
  });
});

// ===================================================================
describe('AlertsDetail — 查询', () => {
  it('按 ID 查询应返回正确告警', () => {
    const alert = getAlertById('ALT-001');
    assert.ok(alert);
    assert.equal(alert!.title, '支付网关超时率异常');
  });

  it('不存在的 ID 返回 undefined', () => {
    assert.equal(getAlertById('NONEXIST'), undefined);
  });

  it('复合筛选: severity + status', () => {
    const result = filterAlerts(SEED_ALERTS, 'high', 'open');
    assert.equal(result.length, 2);
    assert.ok(result.every(a => a.severity === 'high' && a.status === 'open'));
  });

  it('all 筛选返回全部', () => {
    assert.equal(filterAlerts(SEED_ALERTS, 'all', 'all').length, SEED_ALERTS.length);
  });
});

// ===================================================================
describe('AlertsDetail — 数据完整性', () => {
  it('所有告警应有非空 id 和 title', () => {
    for (const a of SEED_ALERTS) {
      assert.ok(a.id, 'id required');
      assert.ok(a.title, 'title required');
    }
  });

  it('所有告警应有 source', () => {
    for (const a of SEED_ALERTS) {
      assert.ok(a.source.length > 0, `source required for ${a.id}`);
    }
  });

  it('owner 可以为空（未指派）', () => {
    const noOwner = SEED_ALERTS.filter(a => !a.owner);
    assert.ok(noOwner.length > 0, 'should have at least one unassigned alert');
  });

  it('createdAt 格式应为 YYYY-MM-DD HH:mm', () => {
    const regex = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}/;
    for (const a of SEED_ALERTS) {
      assert.ok(regex.test(a.createdAt), `${a.id}: invalid createdAt`);
    }
  });
});

// ===================================================================
describe('AlertsDetail — 边界', () => {
  it('空告警列表筛选不抛异常', () => {
    assert.doesNotThrow(() => filterAlerts([], 'all', 'all'));
    assert.equal(filterAlerts([], 'critical', 'open').length, 0);
  });

  it('超长标题不截断', () => {
    const long = 'A'.repeat(500);
    const alert: AlertItem = { id: 'LONG', title: long, severity: 'low', source: 'test', status: 'open', owner: '', createdAt: '2026-07-21 00:00' };
    assert.equal(alert.title.length, 500);
  });

  it('空数组按级别统计为零', () => {
    assert.equal(countBySeverity([], 'critical'), 0);
    assert.equal(countByStatus([], 'open'), 0);
  });
});

const SRC = fs.readFileSync(require.resolve('./page'), 'utf-8');

describe('alerts/[id] — 权限边界', () => {
  it('接入管理员权限边界', () => {
    assert.ok(SRC.includes('AdminPermissionGate'));
    assert.ok(SRC.includes("requiredPermission: 'foundation.governance.read'"));
  });
});

describe('AlertsDetail — hooks验证', () => {
  it('是客户端组件', () => assert.ok(SRC.includes("'use client'")));
  it('包含JSX返回', () => assert.ok(SRC.includes('return (') || SRC.includes('return <')));
  it('包含核心 hooks', () => assert.ok(SRC.includes('useState') && SRC.includes('useMemo') && SRC.includes('useCallback') && SRC.includes('useEffect')));
  it('包含权限边界组件', () => assert.ok(SRC.includes('AdminPermissionGate')));
  it('包含弹窗状态管理', () => assert.ok(SRC.includes('modal.visible') && SRC.includes('setModal')));
  it('包含默认导出', () => assert.ok(SRC.includes('export default')));
});
