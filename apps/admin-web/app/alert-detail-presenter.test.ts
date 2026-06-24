import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import type { FoundationGovernanceReadModel } from '@m5/sdk';
import { buildAdminAlertDetailViewModel, buildAdminAlertFallbackDetailViewModel } from './alerts/[id]/detail-presenter';
import type { FoundationAlertDrilldownResponse } from '@m5/types';

function extractText(node: React.ReactNode): string {
  if (typeof node === 'string' || typeof node === 'number') {
    return String(node);
  }

  if (Array.isArray(node)) {
    return node.map(extractText).join(' ');
  }

  if (React.isValidElement(node)) {
    return extractText(node.props.children);
  }

  return '';
}

test('admin alert detail presenter: builds alert record and detail sections from drilldown', () => {
  const drilldown = {
    code: 'runtime-callback-stalled',
    generatedAt: '2026-06-14T10:00:00.000Z',
    visibleInOverview: false,
    availableActions: ['ACK', 'MUTE', 'UNMUTE'],
    catalog: {
      code: 'runtime-callback-stalled',
      defaultSummary: 'Runtime callback 超时待升级',
      severityPolicy: 'callback 未在阈值内完成回写',
      sourceModules: ['runtime-governance'],
      drilldownEnabled: true,
      acknowledgementEnabled: true,
      drilldownPath: '/alerts/runtime-callback-stalled',
      ackPath: '/api/foundation/alerts/ack',
      mutePath: '/api/foundation/alerts/mute',
      unmutePath: '/api/foundation/alerts/unmute',
    },
    alert: {
      summary: 'fallback summary',
      triageSummary: 'fallback triage',
      code: 'runtime-callback-stalled',
      count: 1,
      severity: 'medium',
    },
    acknowledgement: {
      status: 'ACKED',
      note: null,
      actorId: 'platform-runtime',
      acknowledgedAt: '2026-06-14T10:05:00.000Z',
      mutedUntil: null,
      updatedAt: '2026-06-14T10:05:00.000Z',
    },
    history: [
      {
        action: 'MUTE',
        actorId: 'ops-oncall',
        createdAt: '2026-06-14T10:03:00.000Z',
        visibleInOverview: false,
        source: 'runtime',
        mutedUntil: '2026-06-14T12:03:00.000Z',
        note: '等待回调恢复',
      },
    ],
  } satisfies FoundationAlertDrilldownResponse;

  const viewModel = buildAdminAlertDetailViewModel(drilldown);

  assert.equal(viewModel.alert.id, 'runtime-callback-stalled');
  assert.equal(viewModel.alert.title, 'Runtime callback 超时待升级');
  assert.equal(viewModel.alert.description, 'callback 未在阈值内完成回写');
  assert.equal(viewModel.alert.source, 'runtime-governance');
  assert.equal(viewModel.alert.status, 'acknowledged');
  assert.equal(viewModel.alert.owner, 'platform-runtime');
  assert.equal(viewModel.subtitle, '告警编码：runtime-callback-stalled');
  assert.equal(viewModel.extraSections[0]?.title, '治理状态');
  assert.equal(viewModel.extraSections[1]?.title, '处置时间线');
  assert.match(extractText(viewModel.extraSections[0]?.content), /已从 overview 隐藏/);
  assert.match(extractText(viewModel.extraSections[0]?.content), /已确认/);
  assert.match(extractText(viewModel.extraSections[1]?.content), /等待回调恢复/);
});

test('admin alert detail presenter: appends lyt governance sections for lyt drilldown', () => {
  const drilldown = {
    code: 'lyt-connection-governance-risk',
    generatedAt: '2026-06-14T10:00:00.000Z',
    visibleInOverview: true,
    availableActions: ['DRILLDOWN', 'ACK'],
    catalog: {
      code: 'lyt-connection-governance-risk',
      defaultSummary: '存在 LYT 门店连接治理风险',
      severityPolicy: '存在 high severity LYT 治理告警时为 high，否则为 medium',
      sourceModules: ['integration-orchestration'],
      drilldownEnabled: true,
      acknowledgementEnabled: true,
      drilldownPath: '/alerts/lyt-connection-governance-risk',
      ackPath: '/api/foundation/alerts/ack',
      mutePath: '/api/foundation/alerts/mute',
      unmutePath: '/api/foundation/alerts/unmute',
    },
    alert: {
      summary: '存在 LYT 门店连接治理风险',
      triageSummary: '影响门店需补齐接入治理',
      code: 'lyt-connection-governance-risk',
      count: 3,
      severity: 'high',
    },
    acknowledgement: null,
    history: [],
    detail: {
      total: 3,
      scope: {
        tenantId: 'tenant-demo',
        brandId: 'brand-demo',
      },
      alerts: [
        {
          severity: 'high',
          code: 'pending-configuration-stores',
          count: 2,
          summary: '存在仍未完成真实连接配置的门店，相关能力将持续被阻塞',
          affectedStoreIds: ['store-001', 'store-002'],
          affectedCapabilities: ['member', 'payment'],
          recommendedNextActions: ['优先补齐 endpoint、credential 与 vendorStoreId'],
        },
      ],
      topAlertCodes: ['pending-configuration-stores'],
      affectedStoreIds: ['store-001', 'store-002'],
      affectedCapabilities: ['member', 'payment'],
      recommendedNextActions: ['优先补齐 endpoint、credential 与 vendorStoreId'],
    },
  } satisfies FoundationAlertDrilldownResponse;

  const viewModel = buildAdminAlertDetailViewModel(drilldown);
  assert.equal(viewModel.alert.id, 'lyt-connection-governance-risk');
  assert.equal(viewModel.extraSections[2]?.title, '连接治理范围');
  assert.equal(viewModel.extraSections[3]?.title, '影响概览');
  assert.equal(viewModel.extraSections[4]?.title, '风险分组');
  assert.match(extractText(viewModel.extraSections[3]?.content), /store-001/);
  assert.match(extractText(viewModel.extraSections[3]?.content), /优先补齐 endpoint、credential 与 vendorStoreId/);
  assert.match(extractText(viewModel.extraSections[4]?.content), /pending-configuration-stores/);
});

test('admin alert detail presenter: builds fallback detail from governance snapshot when drilldown is unavailable', () => {
  const governance = {
    deliveryMode: 'fallback',
    generatedAt: '2026-06-13T00:00:00.000Z',
    alerts: [
      {
        code: 'approvals-pending',
        defaultSummary: '存在待处理审批单',
        severityPolicy: '待处理审批单数量 >= 5 时为 high，否则为 medium',
        sourceModules: ['trust-governance', 'configuration-governance'],
        drilldownEnabled: true,
        acknowledgementEnabled: true,
        drilldownPath: '/foundation/overview/alerts/approvals-pending/drilldown',
        ackPath: '/foundation/overview/alerts/approvals-pending/ack',
        mutePath: '/foundation/overview/alerts/approvals-pending/mute',
        unmutePath: '/foundation/overview/alerts/approvals-pending/unmute',
        availableActions: ['DRILLDOWN', 'ACK', 'MUTE'],
        triageState: 'needs-triage',
        triageSummary: '待处理，尚无最近运维动作',
      },
    ],
    summary: {
      approvalsPending: 4,
      approvalsWithFailures: 1,
      highRiskAudits: 0,
      blockedLedgers: 0,
      rotationDueSecrets: 0,
      expiredSecrets: 0,
      expiringCertificates: 0,
      expiredCertificates: 0,
      degradedSignals: 0,
      attentionRecoveryPlans: 0,
      staleDrills: 0,
      runtimeGovernanceBacklog: 0,
      stalledRuntimeCallbacks: 0,
      highRiskRuntimeBacklog: 0,
      runtimeBlockedActions: 0,
    },
    overviewAlerts: [
      {
        severity: 'high',
        code: 'approvals-pending',
        count: 4,
        summary: '存在待处理审批',
        triageState: 'needs-triage',
        triageSummary: '待处理，尚无最近运维动作',
        recentOperation: null,
      },
    ],
    topRisks: [],
  } satisfies FoundationGovernanceReadModel & { deliveryMode: 'fallback' };

  const viewModel = buildAdminAlertFallbackDetailViewModel(governance, 'approvals-pending');

  assert.ok(viewModel);
  assert.equal(viewModel.alert.id, 'approvals-pending');
  assert.equal(viewModel.alert.title, '存在待处理审批单');
  assert.equal(viewModel.alert.severity, 'high');
  assert.equal(viewModel.subtitle, '告警编码：approvals-pending · drilldown 降级为治理快照');
  assert.equal(viewModel.extraSections[0]?.title, '降级详情');
  assert.equal(viewModel.extraSections[1]?.title, '治理状态');
  assert.match(extractText(viewModel.extraSections[0]?.content), /drilldown 暂不可用/);
  assert.match(extractText(viewModel.extraSections[0]?.content), /fallback 快照/);
  assert.match(extractText(viewModel.extraSections[0]?.content), /只读 fallback/);
  assert.match(extractText(viewModel.extraSections[1]?.content), /当前 drilldown 未返回可执行动作/);
});

test('admin alert detail presenter: returns null when fallback alertId is not in catalog', () => {
  const governance = {
    deliveryMode: 'fallback',
    generatedAt: '2026-06-13T00:00:00.000Z',
    alerts: [
      {
        code: 'approvals-pending',
        defaultSummary: '存在待处理审批单',
        severityPolicy: '待处理审批单数量 >= 5 时为 high',
        sourceModules: ['trust-governance'],
        drilldownEnabled: true,
        acknowledgementEnabled: true,
        drilldownPath: '/foundation/overview/alerts/approvals-pending/drilldown',
        ackPath: '/foundation/overview/alerts/approvals-pending/ack',
        mutePath: '/foundation/overview/alerts/approvals-pending/mute',
        unmutePath: '/foundation/overview/alerts/approvals-pending/unmute',
        availableActions: ['DRILLDOWN', 'ACK', 'MUTE'],
        triageState: 'needs-triage',
        triageSummary: '待处理',
      },
    ],
    summary: {
      approvalsPending: 0,
      approvalsWithFailures: 0,
      highRiskAudits: 0,
      blockedLedgers: 0,
      rotationDueSecrets: 0,
      expiredSecrets: 0,
      expiringCertificates: 0,
      expiredCertificates: 0,
      degradedSignals: 0,
      attentionRecoveryPlans: 0,
      staleDrills: 0,
      runtimeGovernanceBacklog: 0,
      stalledRuntimeCallbacks: 0,
      highRiskRuntimeBacklog: 0,
      runtimeBlockedActions: 0,
    },
    overviewAlerts: [],
    topRisks: [],
  } satisfies FoundationGovernanceReadModel & { deliveryMode: 'fallback' };

  // Unknown alert id → null
  const viewModel = buildAdminAlertFallbackDetailViewModel(governance, 'unknown-alert-code');
  assert.equal(viewModel, null);
});

test('admin alert detail presenter: MUTED catalogue maps to muted alert status with UNMUTE available', () => {
  // When the catalogue has acknowledgement.status === 'MUTED' with mutedUntil,
  // the fallback view model should reflect the muted state in the alert
  // record and show "已静默" in the status section.
  const governance = {
    deliveryMode: 'api',
    generatedAt: '2026-06-14T10:00:00.000Z',
    alerts: [
      {
        code: 'approvals-pending',
        defaultSummary: '存在待处理审批单',
        severityPolicy: '待处理审批单数量 >= 5 时为 high',
        sourceModules: ['trust-governance'],
        drilldownEnabled: true,
        acknowledgementEnabled: true,
        drilldownPath: '/foundation/overview/alerts/approvals-pending/drilldown',
        ackPath: '/foundation/overview/alerts/approvals-pending/ack',
        mutePath: '/foundation/overview/alerts/approvals-pending/mute',
        unmutePath: '/foundation/overview/alerts/approvals-pending/unmute',
        // availableActions is intentionally undefined here to exercise the
        // resolveFallbackAvailableActions fall-through logic.
        triageState: 'muted',
        triageSummary: '已静默等待恢复',
        acknowledgement: {
          status: 'MUTED',
          note: '等待回调恢复',
          actorId: 'ops-oncall',
          acknowledgedAt: '2026-06-14T10:03:00.000Z',
          mutedUntil: '2026-06-14T12:03:00.000Z',
          updatedAt: '2026-06-14T10:03:00.000Z',
        },
      },
    ],
    summary: {
      approvalsPending: 0,
      approvalsWithFailures: 0,
      highRiskAudits: 0,
      blockedLedgers: 0,
      rotationDueSecrets: 0,
      expiredSecrets: 0,
      expiringCertificates: 0,
      expiredCertificates: 0,
      degradedSignals: 0,
      attentionRecoveryPlans: 0,
      staleDrills: 0,
      runtimeGovernanceBacklog: 0,
      stalledRuntimeCallbacks: 0,
      highRiskRuntimeBacklog: 0,
      runtimeBlockedActions: 0,
    },
    overviewAlerts: [
      {
        severity: 'medium',
        code: 'approvals-pending',
        count: 4,
        summary: '存在待处理审批',
        triageState: 'muted',
        triageSummary: '已静默等待恢复',
        recentOperation: null,
      },
    ],
    topRisks: [],
  } satisfies FoundationGovernanceReadModel & { deliveryMode: 'api' };

  const viewModel = buildAdminAlertFallbackDetailViewModel(governance, 'approvals-pending');

  assert.ok(viewModel);
  // MUTED acknowledgement → muted status
  assert.equal(viewModel.alert.status, 'muted');
  // Muted record preserves the actor who muted it as owner
  assert.equal(viewModel.alert.owner, 'ops-oncall');
  // Muted catalogue's acknowledgement is propagated into the timeline
  // history so the governance status section can render "已静默".
  assert.equal(viewModel.extraSections[1]?.title, '治理状态');
  assert.match(extractText(viewModel.extraSections[1]?.content), /ops-oncall/);
});
