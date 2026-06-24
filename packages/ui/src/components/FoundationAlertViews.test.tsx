import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import {
  foundationAlertSeverityLabels,
  foundationAlertStatusLabels,
  createFoundationAlertMockRecords,
  foundationAdminGovernanceSourceLabels,
  foundationAdminGovernanceSourceMap,
  mapFoundationGovernanceAlertsToRecords,
  createFoundationAdminGovernanceStatsCopy,
  FoundationAlertPresetDetailRoute,
  FoundationAlertAcknowledgeActionButton,
  FoundationAlertDemoListPage,
  FoundationAlertTableCard,
  FoundationAlertListPageSection,
  foundationAlertDetailDemoPresets,
  foundationAdminGovernanceListPreset,
} from './FoundationAlertViews';

function extractText(node: React.ReactNode): string {
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(extractText).join(' ');
  if (React.isValidElement(node)) return extractText(node.props.children);
  return '';
}

// ======= labels & constants =======
test('labels: foundationAlertSeverityLabels has all base severities', () => {
  assert.equal(foundationAlertSeverityLabels.info.variant, 'info');
  assert.equal(foundationAlertSeverityLabels.error.variant, 'error');
  assert.equal(foundationAlertSeverityLabels.success.label, 'Success');
});

test('labels: foundationAlertStatusLabels has open/acknowledged/resolved', () => {
  assert.equal(foundationAlertStatusLabels.open.variant, 'default');
  assert.equal(foundationAlertStatusLabels.resolved.label, 'Resolved');
});

test('labels: foundationAdminGovernanceSourceLabels maps 11 sources', () => {
  const keys = Object.keys(foundationAdminGovernanceSourceLabels);
  assert.ok(keys.length >= 11);
  assert.equal(foundationAdminGovernanceSourceLabels.approval, '审批');
  assert.equal(foundationAdminGovernanceSourceLabels.security, '安全');
  assert.equal(foundationAdminGovernanceSourceLabels.configuration, '配置');
});

test('labels: foundationAdminGovernanceSourceMap maps key modules', () => {
  assert.equal(foundationAdminGovernanceSourceMap['governance-approval'], 'approval');
  assert.equal(foundationAdminGovernanceSourceMap['runtime-governance'], 'runtime');
  assert.equal(foundationAdminGovernanceSourceMap['identity-access'], 'identity');
});

// ======= createFoundationAlertMockRecords =======
test('mock: createFoundationAlertMockRecords returns exact count', () => {
  const records = createFoundationAlertMockRecords({
    count: 7,
    titles: ['审批积压', '审计风险'],
    severityOrder: ['critical', 'warning'],
    statusOrder: ['open', 'acknowledged'],
    sourceOrder: ['approval'],
  });
  assert.equal(records.length, 7);
  assert.equal(records[0]!.severity, 'critical');
  assert.equal(records[1]!.title, '审计风险');
});

test('mock: createFoundationAlertMockRecords supports custom idPrefix', () => {
  const records = createFoundationAlertMockRecords({
    count: 2,
    idPrefix: 'alarm',
    titles: ['T'],
    severityOrder: ['info'],
    statusOrder: ['open'],
    sourceOrder: ['security'],
  });
  assert.equal(records[0]!.id, 'alarm-0001');
  assert.ok(new Date(records[0]!.createdAt).getTime() > 0);
});

test('mock: createFoundationAlertMockRecords resolved records have updatedAt', () => {
  const records = createFoundationAlertMockRecords({
    count: 5,
    titles: ['T'],
    severityOrder: ['error'],
    statusOrder: ['resolved'],
    sourceOrder: ['runtime'],
  });
  for (const r of records) {
    assert.ok(r.updatedAt);
  }
});

// ======= mapFoundationGovernanceAlertsToRecords =======
test('map: mapFoundationGovernanceAlertsToRecords maps OPEN/ACKED/MUTED statuses', () => {
  const governance = {
    generatedAt: '2026-06-23T00:00:00.000Z',
    alerts: [
      {
        code: 'open-alert',
        defaultSummary: 'Open Alert',
        severityPolicy: 'open policy',
        sourceModules: ['governance-approval'],
        acknowledgement: null,
        recentOperation: null,
        drilldownEnabled: true,
        acknowledgementEnabled: true,
        drilldownPath: '/',
        ackPath: '/api/ack',
        mutePath: '/api/mute',
        unmutePath: '/api/unmute',
      },
      {
        code: 'acked-alert',
        defaultSummary: 'Acked Alert',
        severityPolicy: 'acked policy',
        sourceModules: ['trust-governance'],
        acknowledgement: {
          status: 'ACKED' as const,
          note: null,
          actorId: 'admin',
          acknowledgedAt: '2026-06-23T01:00:00.000Z',
          mutedUntil: null,
          updatedAt: '2026-06-23T01:00:00.000Z',
        },
        recentOperation: null,
        drilldownEnabled: true,
        acknowledgementEnabled: true,
        drilldownPath: '/',
        ackPath: '/api/ack',
        mutePath: '/api/mute',
        unmutePath: '/api/unmute',
      },
      {
        code: 'muted-alert',
        defaultSummary: 'Muted Alert',
        severityPolicy: 'muted policy',
        sourceModules: ['configuration-governance'],
        acknowledgement: {
          status: 'MUTED' as const,
          note: null,
          actorId: 'ops',
          acknowledgedAt: null,
          mutedUntil: '2026-06-24T00:00:00.000Z',
          updatedAt: '2026-06-23T10:00:00.000Z',
        },
        recentOperation: null,
        drilldownEnabled: true,
        acknowledgementEnabled: true,
        drilldownPath: '/',
        ackPath: '/api/ack',
        mutePath: '/api/mute',
        unmutePath: '/api/unmute',
      },
    ],
    overviewAlerts: [
      { code: 'open-alert', severity: 'critical' },
      { code: 'acked-alert', severity: 'high' },
    ],
  };

  const records = mapFoundationGovernanceAlertsToRecords(governance as any);
  assert.equal(records.length, 3);
  assert.equal(records[0]!.status, 'open');
  assert.equal(records[0]!.severity, 'critical');
  assert.equal(records[0]!.source, 'approval');
  assert.equal(records[1]!.status, 'acknowledged');
  assert.equal(records[1]!.owner, 'admin');
  assert.equal(records[2]!.status, 'muted');
  assert.equal(records[2]!.source, 'configuration');
});

test('map: mapFoundationGovernanceAlertsToRecords falls back for unmapped source', () => {
  const governance = {
    generatedAt: '2026-06-23T00:00:00.000Z',
    alerts: [{
      code: 'unknown',
      defaultSummary: 'Unknown',
      severityPolicy: '?',
      sourceModules: ['completely-new'],
      acknowledgement: null,
      recentOperation: null,
      drilldownEnabled: false,
      acknowledgementEnabled: false,
      drilldownPath: '',
      ackPath: '',
      mutePath: '',
      unmutePath: '',
    }],
    overviewAlerts: [],
  };
  const records = mapFoundationGovernanceAlertsToRecords(governance as any);
  assert.equal(records[0]!.source, 'completely-new');
  assert.equal(records[0]!.severity, 'low');
});

test('map: mapFoundationGovernanceAlertsToRecords uses recentOperation actor for owner', () => {
  const governance = {
    generatedAt: '2026-06-23T00:00:00.000Z',
    alerts: [{
      code: 'op-alert',
      defaultSummary: 'Op Alert',
      severityPolicy: 'policy',
      sourceModules: ['runtime-governance'],
      acknowledgement: null,
      recentOperation: {
        code: 'OP1',
        actorId: 'runtime-bot',
        status: 'success',
        createdAt: '2026-06-23T00:01:00.000Z',
      },
      drilldownEnabled: true,
      acknowledgementEnabled: true,
      drilldownPath: '/',
      ackPath: '/api/ack',
      mutePath: '/api/mute',
      unmutePath: '/api/unmute',
    }],
    overviewAlerts: [],
  };
  const records = mapFoundationGovernanceAlertsToRecords(governance as any);
  assert.equal(records[0]!.owner, 'runtime-bot');
  assert.equal(records[0]!.status, 'open');
});

// ======= createFoundationAdminGovernanceStatsCopy =======
test('statsCopy: api mode returns Chinese labels', () => {
  const copy = createFoundationAdminGovernanceStatsCopy('api');
  assert.equal(copy.totalLabel, '告警总数');
  assert.equal(copy.openLabel, '待处理');
  assert.equal(copy.criticalLabel, '高优先级');
});

test('statsCopy: fallback mode returns Chinese labels', () => {
  const copy = createFoundationAdminGovernanceStatsCopy('fallback');
  assert.equal(copy.totalLabel, '告警总数');
  assert.equal(copy.openLabel, '待处理');
  assert.equal(copy.criticalLabel, '高优先级');
});

// ======= FoundationAlertPresetDetailRoute =======
test('route: FoundationAlertPresetDetailRoute delegates to matching alert', () => {
  const element = FoundationAlertPresetDetailRoute({
    alertId: 'alert-0001',
    alerts: {
      'alert-0001': {
        id: 'alert-0001', title: 'Test', severity: 'warning',
        source: 'runtime', status: 'open', createdAt: '',
      },
    },
  });
  assert.equal((element.props as any).alert?.title, 'Test');
});

test('route: FoundationAlertPresetDetailRoute renders valid element for missing id', () => {
  const element = FoundationAlertPresetDetailRoute({
    alertId: 'missing', alerts: {}, notFoundTitle: '404',
  });
  // returns FoundationAlertDetailView with notFound props, which internally renders DetailShell
  assert.ok(React.isValidElement(element));
  // verify props are forwarded correctly
  assert.equal((element.props as any).notFoundTitle, '404');
});

test('route: FoundationAlertPresetDetailRoute calls function notFoundMessage and forwards result', () => {
  let calledWith = '';
  const element = FoundationAlertPresetDetailRoute({
    alertId: 'missing',
    alerts: {},
    notFoundMessage: (id: string) => { calledWith = id; return 'No alert: ' + id; },
  });
  assert.ok(React.isValidElement(element));
  // The function notFoundMessage is invoked during render with alertId
  assert.equal(calledWith, 'missing');
  // The result string is forwarded to FoundationAlertDetailView as notFoundMessage prop
  assert.equal((element.props as any).notFoundMessage, 'No alert: missing');
});

// ======= FoundationAlertAcknowledgeActionButton =======
test('ackBtn: returns null for resolved alert', () => {
  const result = FoundationAlertAcknowledgeActionButton({
    alert: { id: 'r1', title: 'T', severity: 'info', source: 'x', status: 'resolved', createdAt: '' },
    onAcknowledge: () => {},
  });
  assert.equal(result, null);
});

test('ackBtn: renders button for open alert', () => {
  const result = FoundationAlertAcknowledgeActionButton({
    alert: { id: 'o1', title: 'T', severity: 'error', source: 'x', status: 'open', createdAt: '' },
    onAcknowledge: () => {},
    label: '确认',
  });
  assert.ok(React.isValidElement(result));
  assert.equal(extractText(result), '确认');
});

test('ackBtn: disabled when loading', () => {
  const result = FoundationAlertAcknowledgeActionButton({
    alert: { id: 'o1', title: 'T', severity: 'error', source: 'x', status: 'open', createdAt: '' },
    onAcknowledge: () => {},
    loading: true,
  });
  assert.equal((result as any).props.disabled, true);
});

test('ackBtn: renders for acknowledged alert', () => {
  const result = FoundationAlertAcknowledgeActionButton({
    alert: { id: 'a1', title: 'T', severity: 'warning', source: 'x', status: 'acknowledged', createdAt: '' },
    onAcknowledge: () => {},
  });
  assert.ok(React.isValidElement(result));
});

// ======= function component exports =======
test('exports: FoundationAlertDemoListPage is a function', () => {
  assert.equal(typeof FoundationAlertDemoListPage, 'function');
});

test('exports: FoundationAlertTableCard is a function', () => {
  assert.equal(typeof FoundationAlertTableCard, 'function');
});

test('exports: FoundationAlertListPageSection is a function', () => {
  assert.equal(typeof FoundationAlertListPageSection, 'function');
});

// ======= demo presets =======
test('presets: foundationAlertDetailDemoPresets has admin and storefront', () => {
  assert.ok(foundationAlertDetailDemoPresets.admin);
  assert.ok(foundationAlertDetailDemoPresets.storefront);
  assert.ok(typeof foundationAlertDetailDemoPresets.admin === 'object');
});

test('presets: foundationAdminGovernanceListPreset is configured', () => {
  assert.ok(foundationAdminGovernanceListPreset.titles.length > 0);
  assert.ok(foundationAdminGovernanceListPreset.searchFields!.length >= 3);
  assert.equal(foundationAdminGovernanceListPreset.defaultPageSize, 10);
});
