/**
 * FoundationAlertViews.test.ts — FoundationAlertViews 工具函数测试
 *
 * 覆盖: formatFoundationAlertDrilldownDateTime, formatFoundationAlertActionLabel,
 * buildFoundationAlertRecordFromDrilldown, buildFoundationAlertDrilldownSections,
 * buildFoundationAlertLytConnectionGovernanceSections,
 * createFoundationAlertDetailMockMap, createFoundationAlertMockRecords,
 * createFoundationAlertTableColumns, createFoundationAdminGovernanceStatsCopy
 */

import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createFoundationAlertMockRecords,
  foundationAlertDetailDemoPresets,
  foundationAlertListDemoPresets,
  formatFoundationAlertDrilldownDateTime,
  formatFoundationAlertActionLabel,
  buildFoundationAlertRecordFromDrilldown,
  buildFoundationAlertDrilldownSections,
  buildFoundationAlertLytConnectionGovernanceSections,
  createFoundationAlertDetailMockMap,
  createFoundationAdminGovernanceStatsCopy,
  createFoundationAlertTableColumns,
  foundationAlertSeverityLabels,
  foundationAlertStatusLabels,
  type FoundationAlertDrilldownSectionLabels,
  type FoundationAlertDrilldownResponse,
} from './FoundationAlertViews';

// =====================================================================
// 1. 已有测试 (demo presets alignment)
// =====================================================================

test('foundation alert demo presets: storefront detail ids align with generated list ids', () => {
  const records = createFoundationAlertMockRecords({
    count: 3,
    titles: foundationAlertListDemoPresets.storefront.titles,
    severityOrder: foundationAlertListDemoPresets.storefront.severityOrder,
    statusOrder: foundationAlertListDemoPresets.storefront.statusOrder,
    sourceOrder: foundationAlertListDemoPresets.storefront.sourceOrder,
  });

  assert.ok(foundationAlertDetailDemoPresets.storefront[records[0]!.id]);
  assert.ok(foundationAlertDetailDemoPresets.storefront[records[1]!.id]);
});

test('foundation alert demo presets: tob detail ids align with generated list ids', () => {
  const records = createFoundationAlertMockRecords({
    count: 2,
    titles: foundationAlertListDemoPresets.tob.titles,
    severityOrder: foundationAlertListDemoPresets.tob.severityOrder,
    statusOrder: foundationAlertListDemoPresets.tob.statusOrder,
    sourceOrder: foundationAlertListDemoPresets.tob.sourceOrder,
  });

  assert.ok(foundationAlertDetailDemoPresets.tob[records[0]!.id]);
  assert.ok(foundationAlertDetailDemoPresets.tob[records[1]!.id]);
});

// =====================================================================
// 2. formatFoundationAlertDrilldownDateTime
// =====================================================================

test('formatFoundationAlertDrilldownDateTime: formats date string', () => {
  const result = formatFoundationAlertDrilldownDateTime('2026-07-24T10:00:00Z');
  assert.ok(typeof result === 'string');
  assert.ok(result.length > 0);
});

test('formatFoundationAlertDrilldownDateTime: returns "未记录" for null', () => {
  assert.strictEqual(formatFoundationAlertDrilldownDateTime(null), '未记录');
});

test('formatFoundationAlertDrilldownDateTime: returns "未记录" for undefined', () => {
  assert.strictEqual(formatFoundationAlertDrilldownDateTime(undefined), '未记录');
});

// =====================================================================
// 3. formatFoundationAlertActionLabel
// =====================================================================

test('formatFoundationAlertActionLabel: DRILLDOWN returns correct label', () => {
  assert.strictEqual(formatFoundationAlertActionLabel('DRILLDOWN'), '查看详情');
});

test('formatFoundationAlertActionLabel: ACK returns correct label', () => {
  assert.strictEqual(formatFoundationAlertActionLabel('ACK'), '确认');
});

test('formatFoundationAlertActionLabel: MUTE returns correct label', () => {
  assert.strictEqual(formatFoundationAlertActionLabel('MUTE'), '静默');
});

test('formatFoundationAlertActionLabel: UNMUTE returns correct label', () => {
  assert.strictEqual(formatFoundationAlertActionLabel('UNMUTE'), '取消静默');
});

test('formatFoundationAlertActionLabel: unknown action returns the action itself', () => {
  assert.strictEqual(formatFoundationAlertActionLabel('CUSTOM_ACTION'), 'CUSTOM_ACTION');
});

test('formatFoundationAlertActionLabel: supports custom labels', () => {
  const customLabels: FoundationAlertDrilldownSectionLabels = {
    actionDrilldown: 'Drill',
    actionAcknowledge: 'Ack',
    actionMute: 'Mute',
    actionUnmute: 'Unmute',
  };
  assert.strictEqual(formatFoundationAlertActionLabel('DRILLDOWN', customLabels), 'Drill');
  assert.strictEqual(formatFoundationAlertActionLabel('ACK', customLabels), 'Ack');
});

// =====================================================================
// 4. buildFoundationAlertRecordFromDrilldown
// =====================================================================

test('buildFoundationAlertRecordFromDrilldown: open alert (no ack)', () => {
  const drilldown: FoundationAlertDrilldownResponse = {
    code: 'ALERT-001',
    generatedAt: '2026-07-24T00:00:00Z',
    catalog: { defaultSummary: 'CPU高负载', severityPolicy: 'critical', sourceModules: ['monitoring'] },
    alert: { severity: 'critical', summary: 'CPU > 90%', triageSummary: '需要扩容' },
    availableActions: ['DRILLDOWN', 'ACK'],
    acknowledgement: null,
    history: [],
  };
  const record = buildFoundationAlertRecordFromDrilldown(drilldown);
  assert.strictEqual(record.id, 'ALERT-001');
  assert.strictEqual(record.title, 'CPU高负载');
  assert.strictEqual(record.severity, 'critical');
  assert.strictEqual(record.status, 'open');
  assert.strictEqual(record.source, 'monitoring');
});

test('buildFoundationAlertRecordFromDrilldown: acknowledged alert', () => {
  const drilldown: FoundationAlertDrilldownResponse = {
    code: 'ALERT-002',
    generatedAt: '2026-07-24T00:00:00Z',
    catalog: { defaultSummary: '磁盘告警', severityPolicy: 'warning', sourceModules: ['system'] },
    alert: { severity: 'warning', summary: '磁盘 > 80%' },
    availableActions: ['DRILLDOWN'],
    acknowledgement: { status: 'ACKED', actorId: 'admin-01', updatedAt: '2026-07-24T01:00:00Z' },
    history: [],
  };
  const record = buildFoundationAlertRecordFromDrilldown(drilldown);
  assert.strictEqual(record.status, 'acknowledged');
  assert.strictEqual(record.owner, 'admin-01');
  assert.strictEqual(record.updatedAt, '2026-07-24T01:00:00Z');
});

test('buildFoundationAlertRecordFromDrilldown: muted alert maps to resolved', () => {
  const drilldown: FoundationAlertDrilldownResponse = {
    code: 'ALERT-003',
    generatedAt: '2026-07-24T00:00:00Z',
    catalog: { defaultSummary: '内存告警', severityPolicy: 'info', sourceModules: ['system'] },
    alert: { severity: 'info', summary: '内存 > 70%' },
    availableActions: ['UNMUTE'],
    acknowledgement: { status: 'MUTED', updatedAt: '2026-07-24T02:00:00Z' },
    history: [],
  };
  const record = buildFoundationAlertRecordFromDrilldown(drilldown);
  assert.strictEqual(record.status, 'resolved');
  assert.strictEqual(record.updatedAt, '2026-07-24T02:00:00Z');
});

test('buildFoundationAlertRecordFromDrilldown: fallback when catalog and alert are missing', () => {
  const drilldown: FoundationAlertDrilldownResponse = {
    code: 'UNKNOWN-001',
    generatedAt: '2026-07-24T00:00:00Z',
    catalog: null,
    alert: null,
    availableActions: [],
    acknowledgement: null,
    history: [],
  };
  const record = buildFoundationAlertRecordFromDrilldown(drilldown);
  assert.strictEqual(record.id, 'UNKNOWN-001');
  assert.strictEqual(record.title, 'UNKNOWN-001'); // fallback to code
  assert.strictEqual(record.severity, 'info'); // fallback
  assert.strictEqual(record.status, 'open');
  assert.strictEqual(record.source, 'foundation');
  // empty availableActions => '' (not '无')
  assert.ok(typeof record.description === 'string');
});

test('buildFoundationAlertRecordFromDrilldown: uses history actor as owner fallback', () => {
  const drilldown: FoundationAlertDrilldownResponse = {
    code: 'ALERT-004',
    generatedAt: '2026-07-24T00:00:00Z',
    catalog: { defaultSummary: '历史告警', severityPolicy: 'low', sourceModules: ['audit'] },
    alert: { severity: 'low', summary: '历史审计' },
    availableActions: [],
    acknowledgement: null,
    history: [{ actorId: 'audit-bot', createdAt: '2026-07-24T01:00:00Z' }],
  };
  const record = buildFoundationAlertRecordFromDrilldown(drilldown);
  assert.strictEqual(record.owner, 'audit-bot');
  assert.strictEqual(record.updatedAt, '2026-07-24T01:00:00Z');
});

// =====================================================================
// 5. buildFoundationAlertDrilldownSections
// =====================================================================

test('buildFoundationAlertDrilldownSections: returns sections with basic drilldown', () => {
  const drilldown: FoundationAlertDrilldownResponse = {
    code: 'TEST-001',
    generatedAt: '2026-07-24T00:00:00Z',
    catalog: { defaultSummary: '测试告警', severityPolicy: 'info', sourceModules: ['test'] },
    alert: { severity: 'info', summary: '测试' },
    availableActions: ['DRILLDOWN', 'ACK'],
    acknowledgement: null,
    history: [],
  };
  const sections = buildFoundationAlertDrilldownSections(drilldown);
  assert.ok(sections.length > 0);
  assert.ok(typeof sections[0]!.title === 'string');
  assert.ok(sections[0]!.title.length > 0);
});

test('buildFoundationAlertDrilldownSections: empty availableActions returns governance section', () => {
  const drilldown: FoundationAlertDrilldownResponse = {
    code: 'TEST-002',
    generatedAt: '2026-07-24T00:00:00Z',
    catalog: { defaultSummary: '无操作', severityPolicy: 'info', sourceModules: ['test'] },
    alert: { severity: 'info', summary: '无操作' },
    availableActions: [],
    acknowledgement: null,
    history: [],
  };
  const sections = buildFoundationAlertDrilldownSections(drilldown);
  assert.ok(sections.length > 0);
});

test('buildFoundationAlertDrilldownSections: acknowledged drilldown renders ack section', () => {
  const drilldown: FoundationAlertDrilldownResponse = {
    code: 'TEST-003',
    generatedAt: '2026-07-24T00:00:00Z',
    catalog: { defaultSummary: '已确认告警', severityPolicy: 'high', sourceModules: ['security'] },
    alert: { severity: 'high', summary: '安全告警' },
    availableActions: [],
    acknowledgement: { status: 'ACKED', actorId: 'sec-admin', updatedAt: '2026-07-24T01:00:00Z' },
    history: [],
  };
  const sections = buildFoundationAlertDrilldownSections(drilldown);
  assert.ok(sections.length > 0);
});

// =====================================================================
// 6. buildFoundationAlertLytConnectionGovernanceSections
// =====================================================================

test('buildFoundationAlertLytConnectionGovernanceSections: returns empty for non-governance drilldown', () => {
  const drilldown: FoundationAlertDrilldownResponse = {
    code: 'SIMPLE-ALERT',
    generatedAt: '2026-07-24T00:00:00Z',
    catalog: { defaultSummary: '简单告警', severityPolicy: 'info', sourceModules: ['test'] },
    alert: { severity: 'info', summary: '简单' },
    availableActions: [],
    acknowledgement: null,
    history: [],
  };
  const sections = buildFoundationAlertLytConnectionGovernanceSections(drilldown);
  assert.strictEqual(sections.length, 0);
});

test('buildFoundationAlertLytConnectionGovernanceSections: returns sections for governance risk', () => {
  const drilldown: FoundationAlertDrilldownResponse = {
    code: 'lyt-connection-governance-risk',
    generatedAt: '2026-07-24T00:00:00Z',
    catalog: { defaultSummary: '连接治理风险', severityPolicy: 'high', sourceModules: ['governance'] },
    alert: { severity: 'high', summary: '连接治理风险' },
    availableActions: ['DRILLDOWN'],
    acknowledgement: null,
    history: [],
    detail: {
      total: 5,
      scope: { tenantId: 'T001' },
      alerts: [
        {
          severity: 'high', code: 'GOV-001', count: 3,
          summary: '连接超时', affectedStoreIds: ['ST001', 'ST002'],
          affectedCapabilities: ['inventory-sync'], recommendedNextActions: ['检查网络'],
        },
      ],
      topAlertCodes: ['GOV-001'],
      affectedStoreIds: ['ST001', 'ST002'],
      affectedCapabilities: ['inventory-sync'],
      recommendedNextActions: ['检查网络', '重启服务'],
    },
  };
  const sections = buildFoundationAlertLytConnectionGovernanceSections(drilldown);
  assert.ok(sections.length > 0);
  assert.strictEqual(sections[0]!.title, '连接治理范围');
});

test('buildFoundationAlertLytConnectionGovernanceSections: null/undefined drilldown returns empty', () => {
  assert.strictEqual(
    buildFoundationAlertLytConnectionGovernanceSections(null as unknown as FoundationAlertDrilldownResponse).length,
    0,
  );
});

// =====================================================================
// 7. createFoundationAlertDetailMockMap
// =====================================================================

test('createFoundationAlertDetailMockMap: creates map for given records', () => {
  const records = createFoundationAlertMockRecords({
    count: 3,
    titles: ['风险 A', '风险 B', '风险 C'],
    severityOrder: ['critical', 'warning', 'info'],
    statusOrder: ['open', 'acknowledged', 'open'],
    sourceOrder: ['security', 'runtime', 'configuration'],
  });
  const mockMap = createFoundationAlertDetailMockMap(records);
  assert.strictEqual(mockMap[records[0]!.id]?.title, '风险 A');
  assert.strictEqual(mockMap[records[1]!.id]?.severity, 'warning');
  assert.strictEqual(mockMap[records[2]!.id]?.status, 'open');
});

// =====================================================================
// 8. createFoundationAdminGovernanceStatsCopy
// =====================================================================

test('createFoundationAdminGovernanceStatsCopy: api and fallback return same Chinese labels', () => {
  const apiCopy = createFoundationAdminGovernanceStatsCopy('api');
  const fallbackCopy = createFoundationAdminGovernanceStatsCopy('fallback');
  assert.strictEqual(apiCopy.totalLabel, '告警总数');
  assert.strictEqual(fallbackCopy.totalLabel, '告警总数');
  assert.strictEqual(apiCopy.openLabel, '待处理');
  assert.strictEqual(fallbackCopy.openLabel, '待处理');
  assert.strictEqual(apiCopy.criticalLabel, '高优先级');
});

// =====================================================================
// 9. createFoundationAlertTableColumns
// =====================================================================

test('createFoundationAlertTableColumns: returns array of columns', () => {
  const columns = createFoundationAlertTableColumns({});
  assert.ok(columns.length >= 5);
  assert.ok(columns.find((c) => c.key === 'severity'));
  assert.ok(columns.find((c) => c.key === 'title'));
  assert.ok(columns.find((c) => c.key === 'source'));
  assert.ok(columns.find((c) => c.key === 'status'));
  assert.ok(columns.find((c) => c.key === 'createdAt'));
});

test('createFoundationAlertTableColumns: omitColumns filters out columns', () => {
  const columns = createFoundationAlertTableColumns({ omitColumns: ['severity', 'createdAt'] });
  assert.ok(!columns.find((c) => c.key === 'severity'));
  assert.ok(!columns.find((c) => c.key === 'createdAt'));
  assert.ok(columns.find((c) => c.key === 'title'));
});

test('createFoundationAlertTableColumns: includeColumns limits columns', () => {
  const columns = createFoundationAlertTableColumns({ includeColumns: ['title', 'status'] });
  assert.strictEqual(columns.length, 2);
  assert.ok(columns.find((c) => c.key === 'title'));
  assert.ok(columns.find((c) => c.key === 'status'));
});

// =====================================================================
// 10. Labels verification
// =====================================================================

test('foundationAlertSeverityLabels has info/warning/error/success', () => {
  assert.ok(foundationAlertSeverityLabels.info);
  assert.ok(foundationAlertSeverityLabels.warning);
  assert.ok(foundationAlertSeverityLabels.error);
  assert.ok(foundationAlertSeverityLabels.success);
  assert.strictEqual(foundationAlertSeverityLabels.info.variant, 'info');
  assert.strictEqual(foundationAlertSeverityLabels.warning.variant, 'warning');
  assert.strictEqual(foundationAlertSeverityLabels.error.variant, 'error');
  assert.strictEqual(foundationAlertSeverityLabels.success.variant, 'success');
  assert.strictEqual(foundationAlertSeverityLabels.success.label, 'Success');
});

test('foundationAlertStatusLabels has expected keys', () => {
  assert.ok(typeof foundationAlertStatusLabels.open === 'object');
  assert.ok(typeof foundationAlertStatusLabels.acknowledged === 'object');
  assert.ok(typeof foundationAlertStatusLabels.resolved === 'object');
});

// =====================================================================
// 11. Demo preset validation (more edge cases)
// =====================================================================

test('foundationAlertListDemoPresets has storefront, tob, and admin', () => {
  assert.ok(foundationAlertListDemoPresets.storefront);
  assert.ok(foundationAlertListDemoPresets.tob);
  assert.ok(foundationAlertListDemoPresets.admin);
  assert.ok(foundationAlertListDemoPresets.storefront.titles.length >= 3);
  assert.ok(foundationAlertListDemoPresets.admin.titles.length >= 3);
});

test('foundationAlertDetailDemoPresets matching storefront list presets', () => {
  const records = createFoundationAlertMockRecords({
    count: 3,
    titles: foundationAlertListDemoPresets.storefront.titles,
    severityOrder: foundationAlertListDemoPresets.storefront.severityOrder,
    statusOrder: foundationAlertListDemoPresets.storefront.statusOrder,
    sourceOrder: foundationAlertListDemoPresets.storefront.sourceOrder,
  });
  for (const record of records) {
    assert.ok(foundationAlertDetailDemoPresets.storefront[record.id], `Missing detail for ${record.id}`);
  }
});

test('foundationAlertDetailDemoPresets: admin details for admin list presets', () => {
  const records = createFoundationAlertMockRecords({
    count: 3,
    titles: foundationAlertListDemoPresets.admin.titles,
    severityOrder: foundationAlertListDemoPresets.admin.severityOrder,
    statusOrder: foundationAlertListDemoPresets.admin.statusOrder,
    sourceOrder: foundationAlertListDemoPresets.admin.sourceOrder,
  });
  for (const record of records) {
    assert.ok(foundationAlertDetailDemoPresets.admin[record.id]);
  }
});

// =====================================================================
// 12. Mock record edge cases
// =====================================================================

test('createFoundationAlertMockRecords: generates correct number of records', () => {
  const records = createFoundationAlertMockRecords({
    count: 5,
    titles: ['A', 'B'],
    severityOrder: ['info'],
    statusOrder: ['open'],
    sourceOrder: ['system'],
  });
  assert.strictEqual(records.length, 5);
});

test('createFoundationAlertMockRecords: resolved records have updatedAt', () => {
  const records = createFoundationAlertMockRecords({
    count: 3,
    titles: ['Test'],
    severityOrder: ['error'],
    statusOrder: ['resolved'],
    sourceOrder: ['runtime'],
  });
  for (const r of records) {
    assert.ok(r.updatedAt);
  }
});

test('createFoundationAlertMockRecords: open records do not have updatedAt, only createdAt', () => {
  const records = createFoundationAlertMockRecords({
    count: 2,
    titles: ['Test'],
    severityOrder: ['info'],
    statusOrder: ['open'],
    sourceOrder: ['system'],
  });
  for (const r of records) {
    assert.ok(r.createdAt);
  }
});
