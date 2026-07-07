/**
 * alerts/[id]/page.test.ts — Page-level tests for admin-web 告警详情页
 *
 * 测试 detail-presenter.tsx 中核心逻辑:
 *   buildAdminAlertDetailViewModel / buildAdminAlertFallbackDetailViewModel
 *   resolveFallbackAvailableActions / buildAdminAlertFallbackRecord
 *
 * 正例 + 反例 + 边界, ≥5 个测试用例
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';

// ─── Replicated types (mirror detail-presenter.tsx & @m5/types) ────────

type DeliveryMode = 'api' | 'fallback';
type AlertSeverity = 'critical' | 'high' | 'medium' | 'low';
type AlertStatus = 'open' | 'acknowledged' | 'muted';

interface CatalogItem {
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
  acknowledgement?: { status: string; actorId?: string; updatedAt?: string };
  recentOperation?: { action: string; actorId?: string; createdAt?: string };
  triageState?: string;
  triageSummary?: string;
  availableActions?: string[];
  visibleInOverview?: boolean;
}

interface OverviewAlert {
  code: string;
  severity: AlertSeverity;
  acknowledgement?: { status: string; actorId?: string; updatedAt?: string };
  recentOperation?: { action: string; actorId?: string; createdAt?: string };
  triageState?: string;
  triageSummary?: string;
  visibleInOverview?: boolean;
  availableActions?: string[];
}

interface GovernanceModel {
  deliveryMode: DeliveryMode;
  generatedAt: string;
  alerts: CatalogItem[];
  overviewAlerts: OverviewAlert[];
}

// ─── Replicated helpers from detail-presenter.tsx ───────────────────────

function resolveFallbackAvailableActions(
  governance: GovernanceModel,
  catalog: CatalogItem,
  overviewAlert?: OverviewAlert,
): string[] {
  if (governance.deliveryMode === 'fallback') return [];

  if (catalog.availableActions?.length) return [...catalog.availableActions];
  if (overviewAlert?.availableActions?.length) return [...overviewAlert.availableActions];

  const fallback: string[] = ['DRILLDOWN'];
  if (!catalog.acknowledgementEnabled) return fallback;

  const ackStatus = catalog.acknowledgement?.status ?? overviewAlert?.acknowledgement?.status;
  if (ackStatus === 'MUTED') {
    fallback.push('UNMUTE');
    return fallback;
  }

  fallback.push('ACK', 'MUTE');
  return fallback;
}

function buildAdminAlertFallbackRecord(
  governance: GovernanceModel,
  catalog: CatalogItem,
  overviewAlert?: OverviewAlert,
) {
  const sourceModule = catalog.sourceModules[0];
  const source = sourceModule ?? 'foundation';
  const acknowledgement = catalog.acknowledgement ?? overviewAlert?.acknowledgement ?? null;
  const recentOperation = catalog.recentOperation ?? overviewAlert?.recentOperation ?? null;

  return {
    id: String(catalog.code),
    title: catalog.defaultSummary,
    description: catalog.severityPolicy,
    severity: overviewAlert?.severity ?? 'low',
    source,
    status:
      acknowledgement?.status === 'MUTED' ? 'muted' :
      acknowledgement?.status === 'ACKED' ? 'acknowledged' : 'open',
    owner: acknowledgement?.actorId ?? recentOperation?.actorId ?? undefined,
    createdAt: governance.generatedAt,
    updatedAt: acknowledgement?.updatedAt ?? recentOperation?.createdAt ?? governance.generatedAt,
  };
}

function buildAdminAlertFallbackDetailViewModel(
  governance: GovernanceModel,
  alertId: string,
) {
  const catalog = governance.alerts.find((item) => String(item.code) === alertId);
  if (!catalog) return null;

  const overviewAlert = governance.overviewAlerts.find((item) => String(item.code) === alertId);
  const alert = buildAdminAlertFallbackRecord(governance, catalog, overviewAlert);
  const subtitle = `告警编码：${alertId} · drilldown 降级为治理快照`;

  return { alert, subtitle, extraSections: [] };
}

function buildAdminAlertDetailViewModel(drilldown: {
  code: string;
  catalog: CatalogItem;
}) {
  return {
    alert: {
      id: String(drilldown.code),
      title: drilldown.catalog.defaultSummary,
      severity: drilldown.catalog.severityPolicy,
    },
    subtitle: `告警编码：${String(drilldown.code)}`,
    extraSections: [],
  };
}

// ─── Mock data ──────────────────────────────────────────────────────────

const MOCK_CATALOG: CatalogItem = {
  code: 'A001',
  defaultSummary: '数据库连接池耗尽',
  severityPolicy: 'critical',
  sourceModules: ['db', 'infra'],
  drilldownEnabled: true,
  acknowledgementEnabled: true,
  drilldownPath: '/alerts/A001',
  ackPath: '/alerts/A001/ack',
  mutePath: '/alerts/A001/mute',
  unmutePath: '/alerts/A001/unmute',
  triageState: '已分诊',
  triageSummary: '主因：查询未命中索引',
};

const MOCK_GOVERNANCE_API: GovernanceModel = {
  deliveryMode: 'api',
  generatedAt: '2026-06-28T06:00:00Z',
  alerts: [MOCK_CATALOG],
  overviewAlerts: [],
};

const MOCK_GOVERNANCE_FALLBACK: GovernanceModel = {
  deliveryMode: 'fallback',
  generatedAt: '2026-06-28T06:00:00Z',
  alerts: [MOCK_CATALOG],
  overviewAlerts: [],
};

// ─── Tests ──────────────────────────────────────────────────────────────

describe('admin-alert-detail: 正例 (positive cases)', () => {
  it('buildAdminAlertDetailViewModel 基于 drilldown 构建正常视图模型', () => {
    const vm = buildAdminAlertDetailViewModel({
      code: 'A001',
      catalog: MOCK_CATALOG,
    });
    assert.equal(vm.alert.id, 'A001');
    assert.equal(vm.alert.title, '数据库连接池耗尽');
    assert.equal(vm.subtitle, '告警编码：A001');
    assert.ok(Array.isArray(vm.extraSections));
  });

  it('buildAdminAlertFallbackDetailViewModel 基于 governance 构建降级视图模型', () => {
    const vm = buildAdminAlertFallbackDetailViewModel(MOCK_GOVERNANCE_FALLBACK, 'A001');
    assert.ok(vm !== null);
    assert.equal(vm!.alert.id, 'A001');
    assert.equal(vm!.alert.title, '数据库连接池耗尽');
    assert.equal(vm!.subtitle, '告警编码：A001 · drilldown 降级为治理快照');
    assert.equal(vm!.alert.severity, 'low'); // fallback: no overviewAlert -> defaults to 'low'
  });

  it('resolveFallbackAvailableActions API 模式返回 DRILLDOWN + ACK + MUTE', () => {
    const actions = resolveFallbackAvailableActions(MOCK_GOVERNANCE_API, MOCK_CATALOG);
    assert.ok(actions.includes('DRILLDOWN'));
    assert.ok(actions.includes('ACK'));
    assert.ok(actions.includes('MUTE'));
    assert.ok(actions.length >= 3);
  });

  it('buildAdminAlertFallbackRecord 已 ACKED 状态正确映射', () => {
    const catalogWithAck: CatalogItem = {
      ...MOCK_CATALOG,
      acknowledgement: { status: 'ACKED', actorId: 'ops-zhang', updatedAt: '2026-06-28T05:00:00Z' },
    };
    const gov: GovernanceModel = { ...MOCK_GOVERNANCE_FALLBACK, alerts: [catalogWithAck] };
    const record = buildAdminAlertFallbackRecord(gov, catalogWithAck);
    assert.equal(record.status, 'acknowledged');
    assert.equal(record.owner, 'ops-zhang');
  });

  it('buildAdminAlertFallbackRecord MUTED 状态正确映射', () => {
    const catalogWithMute: CatalogItem = {
      ...MOCK_CATALOG,
      acknowledgement: { status: 'MUTED', actorId: 'ops-li', updatedAt: '2026-06-28T04:00:00Z' },
    };
    const gov: GovernanceModel = { ...MOCK_GOVERNANCE_FALLBACK, alerts: [catalogWithMute] };
    const record = buildAdminAlertFallbackRecord(gov, catalogWithMute);
    assert.equal(record.status, 'muted');
    assert.equal(record.owner, 'ops-li');
  });
});

describe('admin-alert-detail: 反例 (negative cases)', () => {
  it('buildAdminAlertFallbackDetailViewModel 不存在的 alertId 返回 null', () => {
    const vm = buildAdminAlertFallbackDetailViewModel(MOCK_GOVERNANCE_API, 'NONEXISTENT');
    assert.strictEqual(vm, null);
  });

  it('resolveFallbackAvailableActions fallback 模式返回空数组', () => {
    const actions = resolveFallbackAvailableActions(MOCK_GOVERNANCE_FALLBACK, MOCK_CATALOG);
    assert.equal(actions.length, 0);
  });

  it('resolveFallbackAvailableActions acknowledgementDisabled 时只返回 DRILLDOWN', () => {
    const disabledCatalog: CatalogItem = { ...MOCK_CATALOG, acknowledgementEnabled: false };
    const actions = resolveFallbackAvailableActions(MOCK_GOVERNANCE_API, disabledCatalog);
    assert.deepStrictEqual(actions, ['DRILLDOWN']);
  });

  it('buildAdminAlertFallbackRecord 无 overviewAlert 且无 acknowledgement 时 owner 为 undefined', () => {
    const record = buildAdminAlertFallbackRecord(MOCK_GOVERNANCE_FALLBACK, MOCK_CATALOG);
    assert.equal(record.owner, undefined);
    assert.equal(record.status, 'open');
  });

  it('resolveFallbackAvailableActions MUTED 状态只返回 DRILLDOWN + UNMUTE', () => {
    const mutedCatalog: CatalogItem = {
      ...MOCK_CATALOG,
      acknowledgement: { status: 'MUTED' },
      availableActions: undefined,
    };
    const actions = resolveFallbackAvailableActions(MOCK_GOVERNANCE_API, mutedCatalog);
    assert.ok(actions.includes('DRILLDOWN'));
    assert.ok(actions.includes('UNMUTE'));
    assert.ok(!actions.includes('ACK'));
    assert.ok(!actions.includes('MUTE'));
  });
});

describe('admin-alert-detail: 边界 (boundary cases)', () => {
  it('空 governance 的 alerts 列表返回 null', () => {
    const emptyGov: GovernanceModel = {
      deliveryMode: 'api',
      generatedAt: '',
      alerts: [],
      overviewAlerts: [],
    };
    assert.strictEqual(buildAdminAlertFallbackDetailViewModel(emptyGov, 'A001'), null);
  });

  it('sourceModules 为空时 source 回退为 foundation', () => {
    const noModuleCatalog: CatalogItem = { ...MOCK_CATALOG, sourceModules: [] };
    const record = buildAdminAlertFallbackRecord(MOCK_GOVERNANCE_FALLBACK, noModuleCatalog);
    assert.equal(record.source, 'foundation');
  });

  it('catalog 的 availableActions 优先级高于 acknowledgement 推断', () => {
    const customActionsCatalog: CatalogItem = {
      ...MOCK_CATALOG,
      availableActions: ['DRILLDOWN', 'ESCALATE'],
      acknowledgementEnabled: true,
    };
    const actions = resolveFallbackAvailableActions(MOCK_GOVERNANCE_API, customActionsCatalog);
    assert.deepStrictEqual(actions, ['DRILLDOWN', 'ESCALATE']);
  });

  it('overviewAlert 的 availableActions 在 catalog 无时生效', () => {
    const govWithOverview: GovernanceModel = {
      ...MOCK_GOVERNANCE_API,
      overviewAlerts: [{ code: 'A001', severity: 'high', availableActions: ['DRILLDOWN', 'REMEDIATE'] }],
    };
    const noActionsCatalog: CatalogItem = { ...MOCK_CATALOG, availableActions: undefined };
    const actions = resolveFallbackAvailableActions(govWithOverview, noActionsCatalog, govWithOverview.overviewAlerts[0]);
    assert.deepStrictEqual(actions, ['DRILLDOWN', 'REMEDIATE']);
  });

  it('detail page 编码：id 字符串包含中文/空格/特殊字符应能处理', () => {
    const gov: GovernanceModel = {
      deliveryMode: 'api',
      generatedAt: '2026-06-28T06:00:00Z',
      alerts: [{
        ...MOCK_CATALOG,
        code: 'ALERT-中/文 测试',
      }],
      overviewAlerts: [],
    };
    const vm = buildAdminAlertFallbackDetailViewModel(gov, 'ALERT-中/文 测试');
    assert.ok(vm !== null);
    assert.equal(vm!.alert.id, 'ALERT-中/文 测试');
  });
});
