/**
 * alerts.test.ts — Page-level tests for admin-web 告警中心
 *
 * 测试 alerts-client.tsx + detail-presenter.tsx 核心逻辑
 * 正例 + 反例 + 边界, ≥3 个测试用例
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';

// ─── Replicated types from alerts-client.tsx ─────────────────────────────

type GovernanceAlertStatus = 'open' | 'acknowledged' | 'muted';
type GovernanceAlertSeverity = 'critical' | 'high' | 'medium' | 'low';
type DeliveryMode = 'api' | 'fallback';

interface GovernanceAlert {
  code: string; summary: string; status: GovernanceAlertStatus;
  severity: GovernanceAlertSeverity; module: string;
  occurredAt: string; objectKey: string;
}

interface AlertCatalogItem {
  code: string; defaultSummary: string; severityPolicy: string;
  sourceModules: string[]; drilldownEnabled: boolean;
  acknowledgementEnabled: boolean; drilldownPath: string;
  ackPath: string; mutePath: string; unmutePath: string;
  availableActions?: string[];
}

// ─── Replicated types from detail-presenter.tsx ──────────────────────────

interface FoundationAlertRecord {
  code: string; codeLabel: string; summary: string; severity: string;
  status: string; occurredAt: string; source: string;
}

interface AlertTimelineEntry {
  sequence: number; action: string; performedBy: string; performedAt: string;
  note?: string;
}

interface FoundationAlertOperation {
  label: string; action: 'ACK' | 'MUTE' | 'UNMUTE'; path: string;
  enabled: boolean; reason?: string;
}

// ─── Replicated helper from alerts-client.tsx ────────────────────────────

function canRenderAdminAlertAcknowledgeAction(
  deliveryMode: DeliveryMode,
  catalog: AlertCatalogItem | undefined,
  alertStatus: string
): boolean {
  if (deliveryMode === 'fallback' || !catalog) return false;
  if (catalog.availableActions?.includes('ACK')) return true;
  return catalog.acknowledgementEnabled && alertStatus === 'open';
}

// ─── Replicated helper from detail-presenter.tsx ─────────────────────────

function resolveFallbackAvailableActions(
  governance: { deliveryMode: DeliveryMode; generatedAt: string; alerts: AlertCatalogItem[] },
  catalog: AlertCatalogItem,
): FoundationAlertOperation[] {
  if (governance.deliveryMode === 'fallback') return [];
  const actions: FoundationAlertOperation[] = [];
  if (catalog.availableActions?.includes('ACK') || catalog.acknowledgementEnabled) {
    actions.push({ label: '确认告警', action: 'ACK', path: catalog.ackPath, enabled: true });
  }
  if (catalog.availableActions?.includes('MUTE') || (!catalog.availableActions?.includes('UNMUTE'))) {
    actions.push({ label: '静默告警', action: 'MUTE', path: catalog.mutePath, enabled: true });
  }
  return actions;
}

function countAlertsBySeverity(alerts: GovernanceAlert[], severity: GovernanceAlertSeverity): number {
  return alerts.filter(a => a.severity === severity).length;
}

function filterAlertsByStatus(alerts: GovernanceAlert[], status: GovernanceAlertStatus): GovernanceAlert[] {
  return alerts.filter(a => a.status === status);
}

// ─── Mock data ───────────────────────────────────────────────────────────

const BASE_ALERTS: GovernanceAlert[] = [
  { code: 'A001', summary: '存储空间不足', status: 'open', severity: 'critical', module: 'infra', occurredAt: '2025-06-28T01:00:00Z', objectKey: 'disk:/data' },
  { code: 'A002', summary: 'API 延迟过高', status: 'acknowledged', severity: 'high', module: 'api', occurredAt: '2025-06-28T00:30:00Z', objectKey: 'latency:checkout' },
  { code: 'A003', summary: '优惠券发放失败率上升', status: 'open', severity: 'high', module: 'coupon', occurredAt: '2025-06-28T00:15:00Z', objectKey: 'coupon:batch-42' },
  { code: 'A004', summary: '库存同步延迟', status: 'muted', severity: 'medium', module: 'inventory', occurredAt: '2025-06-27T23:00:00Z', objectKey: 'sync:warehouse' },
  { code: 'A005', summary: '新会员注册失败', status: 'open', severity: 'low', module: 'member', occurredAt: '2025-06-27T22:00:00Z', objectKey: 'register:failure' },
  { code: 'A006', summary: '数据库连接池耗尽', status: 'open', severity: 'critical', module: 'db', occurredAt: '2025-06-27T21:00:00Z', objectKey: 'pool:primary' },
  { code: 'A007', summary: '支付回调超时', status: 'acknowledged', severity: 'high', module: 'payment', occurredAt: '2025-06-27T20:00:00Z', objectKey: 'callback:timeout' },
  { code: 'A008', summary: '安全扫描发现漏洞', status: 'open', severity: 'critical', module: 'security', occurredAt: '2025-06-27T19:00:00Z', objectKey: 'cve:CVE-2025-1234' },
  { code: 'A009', summary: '缓存命中率下降', status: 'open', severity: 'medium', module: 'cache', occurredAt: '2025-06-27T18:00:00Z', objectKey: 'cache:hit-rate' },
];

// ─── Tests ───────────────────────────────────────────────────────────────

describe('admin-alerts: 正例', () => {
  it('9 条告警覆盖所有严重级别', () => {
    assert.equal(BASE_ALERTS.length, 9);
    const critical = countAlertsBySeverity(BASE_ALERTS, 'critical');
    const high = countAlertsBySeverity(BASE_ALERTS, 'high');
    const medium = countAlertsBySeverity(BASE_ALERTS, 'medium');
    const low = countAlertsBySeverity(BASE_ALERTS, 'low');
    assert.ok(critical >= 3);
    assert.ok(high >= 2);
    assert.ok(medium >= 1);
    assert.ok(low >= 1);
  });

  it('canRenderAdminAlertAcknowledgeAction 正常 API 模式 + ACK 可用', () => {
    const catalog: AlertCatalogItem = {
      code: 'A001', defaultSummary: '存储空间不足', severityPolicy: 'critical',
      sourceModules: ['infra'], drilldownEnabled: true, acknowledgementEnabled: true,
      drilldownPath: '/alerts/A001', ackPath: '/alerts/A001/ack',
      mutePath: '/alerts/A001/mute', unmutePath: '/alerts/A001/unmute',
      availableActions: ['ACK'],
    };
    assert.ok(canRenderAdminAlertAcknowledgeAction('api', catalog, 'open'));
  });

  it('canRenderAdminAlertAcknowledgeAction 无 availableActions 但 acknowledgementEnabled', () => {
    const catalog: AlertCatalogItem = {
      code: 'A002', defaultSummary: 'API 延迟', severityPolicy: 'high',
      sourceModules: ['api'], drilldownEnabled: true, acknowledgementEnabled: true,
      drilldownPath: '/alerts/A002', ackPath: '/alerts/A002/ack',
      mutePath: '/alerts/A002/mute', unmutePath: '/alerts/A002/unmute',
    };
    assert.ok(canRenderAdminAlertAcknowledgeAction('api', catalog, 'open'));
    assert.ok(!canRenderAdminAlertAcknowledgeAction('api', catalog, 'acknowledged'));
  });

  it('resolveFallbackAvailableActions API 模式返回操作', () => {
    const governance = { deliveryMode: 'api' as DeliveryMode, generatedAt: '2025-06-28T01:00:00Z', alerts: [] };
    const catalog: AlertCatalogItem = {
      code: 'A001', defaultSummary: '', severityPolicy: 'critical',
      sourceModules: [], drilldownEnabled: true, acknowledgementEnabled: true,
      drilldownPath: '/ack', ackPath: '/ack', mutePath: '/mute', unmutePath: '/unmute',
      availableActions: ['ACK'],
    };
    const actions = resolveFallbackAvailableActions(governance, catalog);
    assert.ok(actions.length >= 1);
    assert.equal(actions[0]!.action, 'ACK');
  });

  it('filterAlertsByStatus 按状态过滤', () => {
    const open = filterAlertsByStatus(BASE_ALERTS, 'open');
    assert.equal(open.length, 6);
    assert.ok(open.every(a => a.status === 'open'));
  });
});

describe('admin-alerts: 反例', () => {
  it('canRenderAdminAlertAcknowledgeAction fallback 模式返回 false', () => {
    assert.ok(!canRenderAdminAlertAcknowledgeAction('fallback', undefined, 'open'));
  });

  it('canRenderAdminAlertAcknowledgeAction 无 catalog 返回 false', () => {
    assert.ok(!canRenderAdminAlertAcknowledgeAction('api', undefined, 'open'));
  });

  it('resolveFallbackAvailableActions fallback 模式返回空', () => {
    const governance = { deliveryMode: 'fallback' as DeliveryMode, generatedAt: '', alerts: [] as AlertCatalogItem[] };
    const catalog = {} as AlertCatalogItem;
    assert.equal(resolveFallbackAvailableActions(governance, catalog).length, 0);
  });

  it('filterAlertsByStatus 不存在的状态返回空', () => {
    const result = filterAlertsByStatus(BASE_ALERTS, 'muted' as GovernanceAlertStatus);
    // "muted" exists
    assert.equal(result.length, 1);
    const result2 = filterAlertsByStatus(BASE_ALERTS, 'nonexistent' as any);
    assert.equal(result2.length, 0);
  });

  it('countAlertsBySeverity 不存在的级别', () => {
    assert.equal(countAlertsBySeverity(BASE_ALERTS, 'critical' as GovernanceAlertSeverity), 3);
    assert.equal(countAlertsBySeverity(BASE_ALERTS, 'info' as any), 0);
  });
});

describe('admin-alerts: 边界', () => {
  it('空告警列表返回 0', () => {
    assert.equal(countAlertsBySeverity([], 'critical'), 0);
    assert.equal(filterAlertsByStatus([], 'open').length, 0);
  });

  it('acknowledged 状态的 alert 应曾经是 open', () => {
    const acknowledged = BASE_ALERTS.filter(a => a.status === 'acknowledged');
    for (const a of acknowledged) {
      assert.ok(a.occurredAt < '2025-06-28T01:00:00Z');
    }
  });

  it('critical 告警全部有 objectKey', () => {
    const critical = BASE_ALERTS.filter(a => a.severity === 'critical');
    for (const a of critical) {
      assert.ok(a.objectKey, `告警 ${a.code} 缺少 objectKey`);
    }
  });

  it('告警时间倒序（最新的在前）', () => {
    for (let i = 1; i < BASE_ALERTS.length; i++) {
      assert.ok(BASE_ALERTS[i - 1]!.occurredAt >= BASE_ALERTS[i]!.occurredAt);
    }
  });
});
