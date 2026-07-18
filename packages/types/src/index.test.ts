import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildFoundationAlertTimelineEmptyState,
  buildFoundationAlertLinkedFocusContext,
  buildFoundationAlertLinkedFocusSearchParams,
  buildFoundationAlertPanelDerivedState,
  buildFoundationAlertRecentOperationFilterState,
  buildFoundationAlertPanelReadState,
  buildFoundationAlertOptimisticReadState,
  buildFoundationAlertQuickSwitchItems,
  buildFoundationAlertTimelineFilterReadState,
  buildFoundationAlertTimelineFilterQueryPreview,
  buildFoundationAlertTimelineFilterSearchParams,
  buildFoundationAlertTimelineFilterStateFromQuery,
  buildFoundationAlertTimelineShortcutPresets,
  buildConfigurationOperationDetailHref,
  readConfigurationOperationDetailParam,
  buildConfigurationSecretDetailHref,
  readConfigurationSecretDetailParam,
  buildConfigurationCertificateDetailHref,
  readConfigurationCertificateDetailParam,
  buildConfigurationFeatureFlagDetailHref,
  readConfigurationFeatureFlagDetailParam,
  buildConfigurationConfigEntryDetailHref,
  readConfigurationConfigEntryDetailParam,
  buildIdentityAccessRoleDetailHref,
  readIdentityAccessRoleDetailParam,
  buildIdentityAccessPermissionDetailHref,
  readIdentityAccessPermissionDetailParam,
  buildIdentityAccessSessionDetailHref,
  readIdentityAccessSessionDetailParam,
  buildResilienceSignalDetailHref,
  readResilienceSignalDetailParam,
  buildResilienceRetryPolicyDetailHref,
  readResilienceRetryPolicyDetailParam,
  buildResilienceRecoveryPlanDetailHref,
  readResilienceRecoveryPlanDetailParam,
  buildRateLimitsPolicyDetailHref,
  readRateLimitsPolicyDetailParam,
  buildRateLimitsLedgerDetailHref,
  readRateLimitsLedgerDetailParam,
  buildConfigurationHref,
  buildResilienceHref,
  buildRateLimitsHref,
  buildIdentityAccessHref,
  buildIntegrationOrchestrationHref,
  buildFoundationWorkspaceHref,
  buildAuditTrailHref,
  buildAuditTrailRecordDetailHref,
  buildDomainGovernanceDisplayModel,
  buildDomainGovernanceHref,
  buildDomainGovernanceWorkspaceHref,
  formatDomainGovernanceFocusScopeLabel,
  formatDomainGovernanceLastEvaluatedSummary,
  formatDomainGovernanceRecommendationSummary,
  formatDomainGovernanceCountsSummary,
  formatDomainGovernanceFocusScopeSummary,
  formatDomainGovernanceSourceSummary,
  getDomainGovernanceAttentionLabel,
  readAuditTrailRecordDetailParam,
  normalizeFoundationAlertTimelineFilterState,
  buildRuntimeGovernanceCallbackStallDetail,
  buildRuntimeGovernanceReplayEndpoint,
  createRuntimeGovernanceReplayPolicy,
  defaultRoleWorkbenchContractMap,
  defaultRoleWorkbenchContracts,
  evaluateRuntimeGovernanceCallbackStall,
  advanceRuntimeGovernanceReplayPolicy,
  adminRuntimeActionKeys,
  adminWorkbenchConsumerDescriptor,
  adminRuntimeActionPresetContractMap,
  adminRuntimeActionPresetContracts,
  filterFoundationAlertTimelineBySource,
  filterFoundationAlertTimelineByOwner,
  filterFoundationAlertTimeline,
  findLatestFoundationAlertTimelineEntry,
  foundationAlertCatalogFallback,
  foundationBootstrapCapabilityRules,
  foundationBootstrapContract,
  foundationSupportedClients,
  getFoundationAlertLytConnectionGovernanceRiskDetail,
  getFoundationAlertRuntimeCallbackStalledDetail,
  getFoundationAppBootstrapWiring,
  isFoundationAlertLytConnectionGovernanceRiskDetail,
  isFoundationAlertRuntimeCallbackStalledDetail,
  isFoundationAlertTimelineFilterStateEqual,
  listFoundationAlertTimelineActiveFilters,
  summarizeFoundationAlertTimelineFilters,
  summarizeFoundationAlertTimelineMetrics,
  summarizeFoundationAlertTimelineDigest,
  summarizeFoundationAlertTimelineSources,
  summarizeFoundationAlertOwners,
  selectDomainGovernanceFocusScope,
  resolveFoundationAlertFocusCode,
  resolveFoundationAlertSelectedCode,
  runtimeGovernanceActionKeys,
  runtimeGovernanceApiActionKeys,
  runtimeGovernanceCallbackEvents,
  runtimeGovernanceCallbackReceiptStatuses,
  runtimeGovernanceCallbackStallEscalationActions,
  runtimeGovernanceCallbackStatuses,
  runtimeGovernanceCallbackTimeoutThresholds,
  runtimeGovernanceClientApps,
  runtimeGovernanceNextSteps,
  runtimeGovernanceRecommendedActions,
  runtimeGovernanceReplayEscalationActions,
  runtimeGovernanceReplaySources,
  runtimeGovernanceRiskLevels,
  type FoundationAlertDrilldownResponse,
  type FoundationAlertMutationResponse,
  type FoundationAlertOwnerFilter,
  type FoundationAlertTimelineFilter,
  type FoundationAlertTimelineSourceFilter,
  type FoundationAlertTimelineEntry,
  type RuntimeGovernanceReceipt
} from './index';

test('types: foundation bootstrap contract remains the shared source of truth', () => {
  assert.equal(foundationBootstrapContract.bootstrapEndpoint, '/api/v1/foundation/bootstrap');
  assert.equal(foundationBootstrapContract.version, '2026-06-task4');
  assert.deepEqual(
    foundationBootstrapContract.deliveredCapabilities.map((capability) => capability.capability),
    ['tenant-scope', 'market-profile', 'portal-shell', 'feature-flags', 'masking-policy', 'risk-challenge']
  );
  assert.deepEqual(foundationBootstrapContract.deliveredCapabilities, foundationBootstrapCapabilityRules);
});

test('types: app bootstrap wirings stay aligned with documented consumers', () => {
  assert.deepEqual(foundationSupportedClients, ['PC', 'PAD', 'H5', 'MINIAPP', 'APP']);

  const adminBootstrap = getFoundationAppBootstrapWiring('admin-web');
  const miniappBootstrap = getFoundationAppBootstrapWiring('miniapp');
  const nativeAppBootstrap = getFoundationAppBootstrapWiring('app');

  assert.equal(adminBootstrap.bootstrapFile, 'apps/admin-web/app/bootstrap.ts');
  assert.equal(adminBootstrap.tenantScope.mismatchStrategy, 'FAIL_CLOSED');
  assert.deepEqual(adminBootstrap.cacheableCapabilities, ['portal-shell', 'feature-flags']);

  assert.equal(miniappBootstrap.bootstrapFile, 'apps/miniapp/src/market-bootstrap.ts');
  assert.equal(miniappBootstrap.featureFlags.fallbackStrategy, 'READONLY_LAST_KNOWN');
  assert.equal(miniappBootstrap.riskChallenge.enforcement, 'STEP_UP');

  assert.equal(nativeAppBootstrap.bootstrapFile, 'apps/app/market-bootstrap.ts');
  assert.equal(nativeAppBootstrap.featureFlags.fallbackStrategy, 'READONLY_LAST_KNOWN');
  assert.equal(nativeAppBootstrap.riskChallenge.enforcement, 'STEP_UP');
});

test('types: default workbench registry stays shared across api and admin fallback', () => {
  assert.equal(defaultRoleWorkbenchContracts.length, 10);
  assert.equal(defaultRoleWorkbenchContractMap.super_admin?.title, '总部总控台');
  assert.equal(defaultRoleWorkbenchContractMap.cashier?.channel, 'PAD');
  // The 4 newly added roles must all be present in the shared registry.
  for (const role of ['OPERATIONS', 'FINANCE', 'WAREHOUSE', 'COACH']) {
    assert.ok(
      defaultRoleWorkbenchContractMap[role.toLowerCase()],
      `${role} should be present in defaultRoleWorkbenchContractMap`
    );
  }

  const tenantAdmin = defaultRoleWorkbenchContracts.find(
    (item: (typeof defaultRoleWorkbenchContracts)[number]) => item.role === 'TENANT_ADMIN'
  );

  assert.deepEqual(
    tenantAdmin?.navItems.map((item: (typeof tenantAdmin.navItems)[number]) => item.key),
    // 'audit' deliberately excluded — 安监 (SuperAdmin) only.
    // See workbench.role-access.test.ts permission-boundary test.
    ['brands', 'channels', 'foundation', 'identity-access', 'configuration', 'resilience', 'rate-limits', 'integration-orchestration', 'tob', 'regional']
  );
});

test('types: 4 newly added role workbenches have sensible defaults', () => {
  // OPERATIONS: PC, 7 nav items covering runtime + governance surfaces
  const operations = defaultRoleWorkbenchContractMap.operations;
  assert.ok(operations);
  assert.equal(operations.channel, 'PC');
  assert.ok(operations.navItems.length >= 5, 'OPERATIONS should have >= 5 navItems');

  // FINANCE: PC, nav items all href start with /
  const finance = defaultRoleWorkbenchContractMap.finance;
  assert.ok(finance);
  assert.equal(finance.channel, 'PC');
  for (const item of finance.navItems) {
    assert.ok(item.href.startsWith('/'), `FINANCE navItem ${item.key} href should start with /`);
  }

  // WAREHOUSE: PC, marketCodes include both cn-mainland and us-default
  const warehouse = defaultRoleWorkbenchContractMap.warehouse;
  assert.ok(warehouse);
  assert.equal(warehouse.channel, 'PC');
  assert.ok(warehouse.marketCodes.includes('cn-mainland'));
  assert.ok(warehouse.marketCodes.includes('us-default'));

  // COACH: PAD, the only PAD role besides GUIDE / CASHIER
  const coach = defaultRoleWorkbenchContractMap.coach;
  assert.ok(coach);
  assert.equal(coach.channel, 'PAD');
});

test('types: every role workbench has unique role key in the contract map', () => {
  // Both the array and the map should agree on the set of roles.
  const arrayRoles = new Set(defaultRoleWorkbenchContracts.map((w) => w.role));
  const mapRoles = new Set(Object.keys(defaultRoleWorkbenchContractMap));
  for (const role of arrayRoles) {
    assert.ok(mapRoles.has(role.toLowerCase()), `Map should contain ${role.toLowerCase()}`);
  }
  assert.equal(arrayRoles.size, 10, 'Should have exactly 10 unique role contracts');
});

test('types: foundation alert catalog fallback includes resilience governance codes', () => {
  assert.equal(foundationAlertCatalogFallback.some((item) => item.code === 'observability-degradation'), true);
  assert.equal(foundationAlertCatalogFallback.some((item) => item.code === 'recovery-drill-attention'), true);
  assert.equal(foundationAlertCatalogFallback.some((item) => item.code === 'lyt-connection-governance-risk'), true);
  assert.equal(foundationAlertCatalogFallback[0]?.recentOperation ?? null, null);
  assert.equal(foundationAlertCatalogFallback[0]?.triageState ?? null, null);
});

test('types: foundation alert drilldown and mutation responses stay shared', () => {
  const history: FoundationAlertTimelineEntry[] = [
    {
      action: 'ACK',
      note: 'handled',
      actorId: 'ops-user',
      mutedUntil: null,
      visibleInOverview: true,
      createdAt: '2026-06-13T00:05:00.000Z',
      source: 'foundation-alerts'
    },
    {
      action: 'MUTE',
      note: 'mute for drill',
      actorId: 'ops-user',
      mutedUntil: '2026-06-14T00:00:00.000Z',
      visibleInOverview: false,
      createdAt: '2026-06-13T00:10:00.000Z',
      source: 'foundation-alerts'
    }
  ];
  const drilldown: FoundationAlertDrilldownResponse = {
    generatedAt: '2026-06-13T00:00:00.000Z',
    code: 'observability-degradation',
    catalog: foundationAlertCatalogFallback.find((item) => item.code === 'observability-degradation') ?? null,
    alert: {
      severity: 'high',
      code: 'observability-degradation',
      count: 3,
      summary: '存在异常的 metrics/logs/traces 信号',
      acknowledgement: null
    },
    acknowledgement: null,
    visibleInOverview: true,
    availableActions: ['DRILLDOWN', 'ACK', 'MUTE'],
    history,
    detail: {
      total: 3,
      signals: ['metrics', 'logs', 'traces']
    }
  };
  const mutation: FoundationAlertMutationResponse = {
    generatedAt: '2026-06-13T00:05:00.000Z',
    code: 'observability-degradation',
    catalog: foundationAlertCatalogFallback.find((item) => item.code === 'observability-degradation') ?? null,
    acknowledgement: {
      status: 'ACKED',
      note: 'handled',
      actorId: 'ops-user',
      acknowledgedAt: '2026-06-13T00:05:00.000Z',
      mutedUntil: null,
      updatedAt: '2026-06-13T00:05:00.000Z'
    },
    visibleInOverview: true,
    availableActions: ['DRILLDOWN', 'ACK', 'MUTE'],
    history
  };

  assert.equal(drilldown.alert?.code, 'observability-degradation');
  assert.equal(drilldown.catalog?.acknowledgementEnabled, true);
  assert.equal(drilldown.availableActions?.includes('MUTE'), true);
  assert.equal(drilldown.history?.length, 2);
  assert.equal((drilldown.detail?.total as number) > 0, true);
  assert.equal(mutation.acknowledgement?.status, 'ACKED');
  assert.equal(mutation.catalog?.drilldownEnabled, true);
  assert.equal(mutation.history?.[1]?.action, 'MUTE');
});

test('types: runtime callback stalled drilldown helper narrows structured detail safely', () => {
  const drilldown: FoundationAlertDrilldownResponse = {
    generatedAt: '2026-06-13T00:00:00.000Z',
    code: 'runtime-callback-stalled',
    detail: {
      total: 2,
      timeoutThresholds: {
        low: 900000,
        medium: 600000,
        high: 300000
      },
      escalationSummary: {
        waitCallback: 0,
        scheduleReplay: 1,
        openManualReview: 1
      },
      receipts: [
        {
          receiptCode: 'receipt-001',
          app: 'miniapp',
          action: 'booking-submit',
          riskLevel: 'high',
          handlerName: 'miniapp-booking-submit-handler',
          callbackStatus: 'awaiting-callback',
          replayable: true,
          scopeKey: 'runtime:tenant:tenant-demo',
          latestEventType: 'runtime-governance.handler.sync.requested',
          stalled: true,
          timeoutMs: 300000,
          elapsedMs: 360000,
          exceededMs: 60000,
          escalationAction: 'SCHEDULE_REPLAY',
          summary: 'callback 超时未回写，建议进入 replay 补偿。'
        }
      ]
    }
  };

  assert.equal(isFoundationAlertRuntimeCallbackStalledDetail(drilldown.code, drilldown.detail), true);

  if (!isFoundationAlertRuntimeCallbackStalledDetail(drilldown.code, drilldown.detail)) {
    assert.fail('expected runtime-callback-stalled detail to narrow successfully');
  }

  assert.equal(drilldown.detail.receipts[0]?.escalationAction, 'SCHEDULE_REPLAY');
  assert.equal(drilldown.detail.timeoutThresholds.high, 300000);
  assert.equal(
    getFoundationAlertRuntimeCallbackStalledDetail(drilldown, 'runtime-callback-stalled')?.receipts[0]?.receiptCode,
    'receipt-001'
  );
  assert.equal(
    getFoundationAlertRuntimeCallbackStalledDetail(
      {
        code: drilldown.code,
        detail: drilldown.detail
      },
      'observability-degradation'
    ),
    null
  );
  assert.equal(
    isFoundationAlertRuntimeCallbackStalledDetail('observability-degradation', {
      total: 2,
      receipts: []
    }),
    false
  );
});

test('types: lyt governance drilldown helper narrows structured detail safely', () => {
  const drilldown: FoundationAlertDrilldownResponse = {
    generatedAt: '2026-06-13T00:00:00.000Z',
    code: 'lyt-connection-governance-risk',
    detail: {
      total: 3,
      scope: {
        tenantId: 'tenant-demo',
        brandId: 'brand-demo'
      },
      alerts: [
        {
          severity: 'high',
          code: 'pending-configuration-stores',
          count: 2,
          summary: '存在仍未完成真实连接配置的门店，相关能力将持续被阻塞',
          affectedStoreIds: ['store-001', 'store-002'],
          affectedCapabilities: ['member', 'payment'],
          recommendedNextActions: ['优先补齐 endpoint、credential 与 vendorStoreId']
        }
      ],
      topAlertCodes: ['pending-configuration-stores'],
      affectedStoreIds: ['store-001', 'store-002'],
      affectedCapabilities: ['member', 'payment'],
      recommendedNextActions: ['优先补齐 endpoint、credential 与 vendorStoreId']
    }
  };

  assert.equal(isFoundationAlertLytConnectionGovernanceRiskDetail(drilldown.code, drilldown.detail), true);

  if (!isFoundationAlertLytConnectionGovernanceRiskDetail(drilldown.code, drilldown.detail)) {
    assert.fail('expected lyt-connection-governance-risk detail to narrow successfully');
  }

  assert.equal(drilldown.detail.alerts[0]?.code, 'pending-configuration-stores');
  assert.equal(drilldown.detail.scope.tenantId, 'tenant-demo');
  assert.equal(
    getFoundationAlertLytConnectionGovernanceRiskDetail(drilldown, 'lyt-connection-governance-risk')?.affectedStoreIds[1],
    'store-002'
  );
  assert.equal(
    getFoundationAlertLytConnectionGovernanceRiskDetail(
      {
        code: drilldown.code,
        detail: drilldown.detail
      },
      'observability-degradation'
    ),
    null
  );
});

test('types: foundation alert panel read state helper keeps recent mutation and fallback metadata stable', () => {
  const state = buildFoundationAlertPanelReadState({
    selectedAlert: {
      code: 'runtime-callback-stalled',
      acknowledgement: {
        status: 'ACKED',
        note: 'ack note',
        actorId: 'ack-user',
        acknowledgedAt: '2026-06-13T00:00:00.000Z',
        mutedUntil: null,
        updatedAt: '2026-06-13T00:00:00.000Z'
      },
      recentOperation: {
        action: 'MUTE',
        note: 'recent note',
        actorId: 'ops-latest',
        mutedUntil: '2026-06-14T00:00:00.000Z',
        visibleInOverview: false,
        createdAt: '2026-06-13T00:10:00.000Z',
        source: 'triage'
      }
    },
    drilldown: {
      history: [
        {
          action: 'ACK',
          note: 'drilldown note',
          actorId: 'ops-drilldown',
          mutedUntil: null,
          visibleInOverview: true,
          createdAt: '2026-06-13T00:20:00.000Z',
          source: 'detail'
        }
      ],
      acknowledgement: {
        status: 'ACKED',
        note: 'drilldown ack note',
        actorId: 'ops-drilldown-ack',
        acknowledgedAt: '2026-06-13T00:19:00.000Z',
        mutedUntil: null,
        updatedAt: '2026-06-13T00:19:00.000Z'
      }
    },
    mutation: {
      generatedAt: '2026-06-13T00:21:00.000Z',
      code: 'runtime-callback-stalled',
      history: [
        {
          action: 'UNMUTE',
          note: 'mutation note',
          actorId: 'ops-mutation',
          mutedUntil: null,
          visibleInOverview: true,
          createdAt: '2026-06-13T00:21:00.000Z',
          source: 'mutation'
        }
      ]
    }
  });

  assert.equal(state.activeMutation?.code, 'runtime-callback-stalled');
  assert.equal(state.recentTimeline[0]?.action, 'UNMUTE');
  assert.equal(state.currentOwner, 'ops-mutation');
  assert.equal(state.currentNote, 'mutation note');

  const fallbackState = buildFoundationAlertPanelReadState({
    selectedAlert: {
      code: 'runtime-callback-stalled',
      acknowledgement: null,
      recentOperation: null
    },
    drilldown: null,
    mutation: {
      generatedAt: '2026-06-13T00:21:00.000Z',
      code: 'observability-degradation',
      history: []
    }
  });

  assert.equal(fallbackState.activeMutation, null);
  assert.deepEqual(fallbackState.recentTimeline, []);
  assert.equal(fallbackState.currentOwner, '系统');
  assert.equal(fallbackState.currentNote, '暂无备注');
});

test('types: foundation alert quick switch and optimistic helpers keep panel-derived state stable', () => {
  const quickSwitchItems = buildFoundationAlertQuickSwitchItems(
    [{ code: 'runtime-callback-stalled' }, { code: 'observability-degradation' }],
    [{ code: 'observability-degradation' }, { code: 'runtime-governance-backlog' }],
    5
  );

  assert.deepEqual(
    quickSwitchItems.map((item) => item.code),
    ['runtime-callback-stalled', 'observability-degradation', 'runtime-governance-backlog']
  );

  const mutedState = buildFoundationAlertOptimisticReadState({
    pendingMutationAction: 'MUTE',
    visibleInOverview: true
  });
  assert.equal(mutedState.overviewVisibility, 'hidden (optimistic)');
  assert.equal(mutedState.feedback?.title, 'MUTE 正在提交');

  const unmutedState = buildFoundationAlertOptimisticReadState({
    pendingMutationAction: 'UNMUTE',
    visibleInOverview: false
  });
  assert.equal(unmutedState.overviewVisibility, 'visible (optimistic)');
  assert.match(unmutedState.feedback?.description ?? '', /重新回到 overview/);

  const settledState = buildFoundationAlertOptimisticReadState({
    pendingMutationAction: null,
    visibleInOverview: false
  });
  assert.equal(settledState.overviewVisibility, 'hidden');
  assert.equal(settledState.feedback, null);
});

test('types: foundation alert timeline filter read state helper keeps derived panel filters stable', () => {
  const state = buildFoundationAlertTimelineFilterReadState({
    action: 'MUTE',
    source: 'foundation-alerts',
    owner: 'ops-a',
    history: [
      {
        action: 'MUTE',
        note: 'mute for drill',
        actorId: 'ops-a',
        mutedUntil: '2026-06-14T00:00:00.000Z',
        visibleInOverview: false,
        createdAt: '2026-06-13T00:20:00.000Z',
        source: 'foundation-alerts'
      },
      {
        action: 'ACK',
        note: 'handled',
        actorId: 'ops-b',
        mutedUntil: null,
        visibleInOverview: true,
        createdAt: '2026-06-13T00:10:00.000Z',
        source: 'triage'
      }
    ]
  });

  assert.deepEqual(state.filterState, {
    action: 'MUTE',
    source: 'foundation-alerts',
    owner: 'ops-a'
  });
  assert.equal(state.hasActiveFilters, true);
  assert.equal(state.activeFilterChips.length, 3);
  assert.match(state.filterSummary, /动作 MUTE/);
  assert.match(state.filterEmptyState, /清除/);
  assert.equal(state.shortcutPresets.length > 0, true);

  const defaultState = buildFoundationAlertTimelineFilterReadState({
    action: 'ALL',
    source: 'ALL',
    owner: 'ALL',
    history: []
  });

  assert.equal(defaultState.hasActiveFilters, false);
  assert.deepEqual(defaultState.activeFilterChips, []);
  assert.equal(defaultState.filterSummary, '全部 timeline');
  assert.equal(defaultState.shortcutPresets.length, 0);
});

test('types: foundation alert panel derived state keeps selected alert and timeline digest aligned', () => {
  const state = buildFoundationAlertPanelDerivedState({
    alerts: [
      {
        code: 'runtime-callback-stalled',
        defaultSummary: 'callback stalled',
        severityPolicy: 'high-risk runtime callback',
        sourceModules: ['runtime-governance'],
        drilldownEnabled: true,
        acknowledgementEnabled: true,
        drilldownPath: '/foundation/overview/alerts/runtime-callback-stalled/drilldown',
        ackPath: '/foundation/overview/alerts/runtime-callback-stalled/ack',
        mutePath: '/foundation/overview/alerts/runtime-callback-stalled/mute',
        unmutePath: '/foundation/overview/alerts/runtime-callback-stalled/unmute',
        recentOperation: {
          action: 'ACK',
          note: 'latest ack',
          actorId: 'ops-a',
          mutedUntil: null,
          visibleInOverview: true,
          createdAt: '2026-06-13T00:12:00.000Z',
          source: 'triage'
        },
        acknowledgement: {
          status: 'ACKED',
          note: 'ack fallback',
          actorId: 'ops-fallback',
          acknowledgedAt: '2026-06-13T00:11:00.000Z',
          mutedUntil: null,
          updatedAt: '2026-06-13T00:11:00.000Z'
        }
      },
      {
        code: 'observability-degradation',
        defaultSummary: 'observability degraded',
        severityPolicy: 'degraded-observability',
        sourceModules: ['resilience-operations'],
        drilldownEnabled: true,
        acknowledgementEnabled: true,
        drilldownPath: '/foundation/overview/alerts/observability-degradation/drilldown',
        ackPath: '/foundation/overview/alerts/observability-degradation/ack',
        mutePath: '/foundation/overview/alerts/observability-degradation/mute',
        unmutePath: '/foundation/overview/alerts/observability-degradation/unmute'
      }
    ],
    selectedAlertCode: 'runtime-callback-stalled',
    drilldown: {
      generatedAt: '2026-06-13T00:20:00.000Z',
      code: 'runtime-callback-stalled',
      acknowledgement: {
        status: 'ACKED',
        note: 'drilldown ack',
        actorId: 'ops-d',
        acknowledgedAt: '2026-06-13T00:13:00.000Z',
        mutedUntil: null,
        updatedAt: '2026-06-13T00:13:00.000Z'
      },
      history: [
        {
          action: 'MUTE',
          note: 'muted in triage',
          actorId: 'ops-b',
          mutedUntil: '2026-06-14T00:00:00.000Z',
          visibleInOverview: false,
          createdAt: '2026-06-13T00:20:00.000Z',
          source: 'triage'
        },
        {
          action: 'ACK',
          note: 'earlier ack',
          actorId: 'ops-a',
          mutedUntil: null,
          visibleInOverview: true,
          createdAt: '2026-06-13T00:10:00.000Z',
          source: 'foundation-alerts'
        }
      ],
      detail: {
        total: 1,
        timeoutThresholds: {
          low: 60_000,
          medium: 300_000,
          high: 900_000
        },
        escalationSummary: {
          waitCallback: 0,
          scheduleReplay: 1,
          openManualReview: 0
        },
        receipts: []
      }
    },
    mutation: {
      generatedAt: '2026-06-13T00:21:00.000Z',
      code: 'runtime-callback-stalled',
      history: [
        {
          action: 'UNMUTE',
          note: 'restored',
          actorId: 'ops-c',
          mutedUntil: null,
          visibleInOverview: true,
          createdAt: '2026-06-13T00:21:00.000Z',
          source: 'ops-console'
        },
        {
          action: 'MUTE',
          note: 'muted in triage',
          actorId: 'ops-b',
          mutedUntil: '2026-06-14T00:00:00.000Z',
          visibleInOverview: false,
          createdAt: '2026-06-13T00:20:00.000Z',
          source: 'triage'
        }
      ]
    },
    filters: {
      action: 'UNMUTE',
      source: 'ops-console',
      owner: 'ops-c'
    }
  });

  assert.equal(state.selectedAlert?.code, 'runtime-callback-stalled');
  assert.equal(state.activeMutation?.code, 'runtime-callback-stalled');
  assert.equal(state.currentOwner, 'ops-c');
  assert.equal(state.currentNote, 'restored');
  assert.equal(state.runtimeCallbackDrilldown?.total, 1);
  assert.equal(state.sourceSummary.length, 1);
  assert.equal(state.sourceSummary[0]?.source, 'ops-console');
  assert.equal(state.ownerSummary.length, 1);
  assert.equal(state.ownerSummary[0]?.actorId, 'ops-c');
  assert.equal(state.filteredTimeline.length, 1);
  assert.equal(state.latestMatchedTimeline?.actorId, 'ops-c');
  assert.equal(state.timelineMetrics.total, 1);
  assert.equal(state.timelineDigest.latestSource, 'ops-console');
  assert.equal(
    resolveFoundationAlertSelectedCode(
      [{ code: 'observability-degradation' }, { code: 'runtime-callback-stalled' }],
      {
        preferredCode: 'missing-code',
        currentCode: 'runtime-callback-stalled'
      }
    ),
    'runtime-callback-stalled'
  );
  assert.equal(resolveFoundationAlertSelectedCode([{ code: 'observability-degradation' }], { preferredCode: 'missing-code' }), 'observability-degradation');
});

test('types: foundation alert timeline query/normalization helpers keep sync rules stable', () => {
  assert.deepEqual(
    buildFoundationAlertTimelineFilterStateFromQuery({
      action: 'MUTE',
      source: 'foundation-alerts',
      owner: 'ops-a'
    }),
    {
      action: 'MUTE',
      source: 'foundation-alerts',
      owner: 'ops-a'
    }
  );

  assert.deepEqual(
    buildFoundationAlertTimelineFilterStateFromQuery({
      action: 'INVALID',
      source: null,
      owner: ''
    }),
    {
      action: 'ALL',
      source: 'ALL',
      owner: 'ALL'
    }
  );

  assert.deepEqual(
    normalizeFoundationAlertTimelineFilterState(
      {
        action: 'ACK',
        source: 'stale-source',
        owner: 'stale-owner'
      },
      {
        availableOwners: ['ops-a', 'ops-b'],
        availableSources: ['foundation-alerts', 'triage']
      }
    ),
    {
      action: 'ACK',
      source: 'ALL',
      owner: 'ALL'
    }
  );

  assert.deepEqual(
    normalizeFoundationAlertTimelineFilterState(
      {
        action: 'UNMUTE',
        source: 'triage',
        owner: 'ops-b'
      },
      {
        availableOwners: ['ops-a', 'ops-b'],
        availableSources: ['foundation-alerts', 'triage']
      }
    ),
    {
      action: 'UNMUTE',
      source: 'triage',
      owner: 'ops-b'
    }
  );

  const nextParams = buildFoundationAlertTimelineFilterSearchParams({
    search: 'focus=runtime-callback-stalled&timeline=ACK&legacy=1',
    queryKeys: {
      action: 'timeline',
      source: 'source',
      owner: 'owner'
    },
    filters: {
      action: 'MUTE',
      source: 'triage',
      owner: 'ops-a'
    }
  });

  assert.equal(nextParams.get('focus'), 'runtime-callback-stalled');
  assert.equal(nextParams.get('legacy'), '1');
  assert.equal(nextParams.get('timeline'), 'MUTE');
  assert.equal(nextParams.get('source'), 'triage');
  assert.equal(nextParams.get('owner'), 'ops-a');
  assert.equal(
    buildFoundationAlertTimelineFilterQueryPreview(
      {
        action: 'timeline',
        source: 'source',
        owner: 'owner'
      },
      {
        action: 'ALL',
        source: 'ALL',
        owner: 'ALL'
      }
    ),
    '(default)'
  );
  assert.equal(
    resolveFoundationAlertFocusCode('observability-degradation', [
      [{ code: 'runtime-callback-stalled' }],
      [{ code: 'observability-degradation' }]
    ]),
    'observability-degradation'
  );
  assert.equal(resolveFoundationAlertFocusCode('missing-code', [[{ code: 'runtime-callback-stalled' }]]), null);
  assert.equal(
    buildFoundationAlertLinkedFocusContext('概览卡 / 高风险审计', {
      action: 'ACK',
      source: 'triage',
      owner: 'ops-a'
    }),
    '概览卡 / 高风险审计 / 动作 ACK / 来源 triage / 责任人 ops-a'
  );

  const focusParams = buildFoundationAlertLinkedFocusSearchParams({
    search: 'legacy=1&alertAction=ACK',
    queryKeys: {
      focus: 'alert',
      timeline: {
        action: 'alertAction',
        source: 'alertActionSource',
        owner: 'alertOwner'
      }
    },
    focusCode: 'runtime-callback-stalled',
    filters: {
      action: 'MUTE',
      source: 'triage',
      owner: 'ops-a'
    }
  });

  assert.equal(focusParams.get('legacy'), '1');
  assert.equal(focusParams.get('alert'), 'runtime-callback-stalled');
  assert.equal(focusParams.get('alertAction'), 'MUTE');
  assert.equal(focusParams.get('alertActionSource'), 'triage');
  assert.equal(focusParams.get('alertOwner'), 'ops-a');
});

test('types: foundation alert timeline helpers filter actions and summarize owners', () => {
  const history: FoundationAlertTimelineEntry[] = [
    {
      action: 'MUTE',
      note: 'mute for drill',
      actorId: 'ops-a',
      mutedUntil: '2026-06-14T00:00:00.000Z',
      visibleInOverview: false,
      createdAt: '2026-06-13T00:20:00.000Z',
      source: 'foundation-alerts'
    },
    {
      action: 'ACK',
      note: 'handled',
      actorId: 'ops-b',
      mutedUntil: null,
      visibleInOverview: true,
      createdAt: '2026-06-13T00:10:00.000Z',
      source: null
    },
    {
      action: 'UNMUTE',
      note: 'restore',
      actorId: 'ops-a',
      mutedUntil: null,
      visibleInOverview: true,
      createdAt: '2026-06-13T00:30:00.000Z',
      source: 'foundation-alerts'
    }
  ];

  const muteOnly = filterFoundationAlertTimeline(history, 'MUTE');
  const allActions = filterFoundationAlertTimeline(history, 'ALL' satisfies FoundationAlertTimelineFilter);
  const ownerOnly = filterFoundationAlertTimelineByOwner(history, 'ops-a' satisfies FoundationAlertOwnerFilter);
  const sourceOnly = filterFoundationAlertTimelineBySource(history, 'foundation-alerts' satisfies FoundationAlertTimelineSourceFilter);
  const owners = summarizeFoundationAlertOwners(history);
  const sources = summarizeFoundationAlertTimelineSources(history);
  const latest = findLatestFoundationAlertTimelineEntry(history);
  const metrics = summarizeFoundationAlertTimelineMetrics(ownerOnly);
  const digest = summarizeFoundationAlertTimelineDigest(history);
  const shortcuts = buildFoundationAlertTimelineShortcutPresets(history);

  assert.equal(muteOnly.length, 1);
  assert.equal(muteOnly[0]?.action, 'MUTE');
  assert.equal(allActions.length, 3);
  assert.equal(ownerOnly.length, 2);
  assert.equal(sourceOnly.length, 2);
  assert.equal(ownerOnly[1]?.action, 'UNMUTE');
  assert.equal(summarizeFoundationAlertOwners([]).length, 0);
  assert.equal(owners[0]?.actorId, 'ops-a');
  assert.equal(owners[0]?.count, 2);
  assert.equal(owners[0]?.lastAction, 'UNMUTE');
  assert.equal(owners[1]?.actorId, 'ops-b');
  assert.equal(latest?.createdAt, '2026-06-13T00:30:00.000Z');
  assert.equal(metrics.total, 2);
  assert.equal(metrics.visibleInOverview, 1);
  assert.equal(metrics.hiddenFromOverview, 1);
  assert.equal(metrics.latestMatchedAt, '2026-06-13T00:30:00.000Z');
  assert.equal(sources[0]?.source, 'foundation-alerts');
  assert.equal(sources[0]?.count, 2);
  assert.equal(sources[1]?.source, 'unknown');
  assert.equal(sources[1]?.count, 1);
  assert.equal(digest.actions.find((item) => item.action === 'ACK')?.count, 1);
  assert.equal(digest.actions.find((item) => item.action === 'MUTE')?.count, 1);
  assert.equal(digest.actions.find((item) => item.action === 'UNMUTE')?.count, 1);
  assert.equal(digest.uniqueOwnerCount, 2);
  assert.equal(digest.latestActorId, 'ops-a');
  assert.equal(digest.dominantAction, 'UNMUTE');
  assert.equal(digest.latestVisibleAction, 'UNMUTE');
  assert.equal(digest.latestHiddenAction, 'MUTE');
  assert.equal(digest.dominantSource, 'foundation-alerts');
  assert.equal(digest.latestSource, 'foundation-alerts');
  assert.equal(digest.latestVisibleSource, 'foundation-alerts');
  assert.equal(digest.latestHiddenSource, 'foundation-alerts');
  assert.deepEqual(listFoundationAlertTimelineActiveFilters({ action: 'ACK', source: 'foundation-alerts', owner: 'ops-a' }), [
    { kind: 'action', label: '动作 ACK', value: 'ACK' },
    { kind: 'source', label: '来源 foundation-alerts', value: 'foundation-alerts' },
    { kind: 'owner', label: '责任人 ops-a', value: 'ops-a' }
  ]);
  assert.equal(
    summarizeFoundationAlertTimelineFilters({ action: 'ACK', source: 'foundation-alerts', owner: 'ops-a' }),
    '动作 ACK / 来源 foundation-alerts / 责任人 ops-a'
  );
  assert.equal(summarizeFoundationAlertTimelineFilters({ action: 'ALL', source: 'ALL', owner: 'ALL' }), '全部 timeline');
  assert.equal(
    buildFoundationAlertTimelineEmptyState({ action: 'ACK', source: 'ALL', owner: 'ops-a' }),
    '当前筛选下没有匹配的 timeline 动作。可清除 动作 ACK / 责任人 ops-a 后继续排查。'
  );
  assert.equal(
    buildFoundationAlertTimelineEmptyState({ action: 'ALL', source: 'ALL', owner: 'ALL' }),
    '当前筛选下没有匹配的 timeline 动作。可切换动作、来源或责任人继续排查。'
  );
  assert.equal(
    isFoundationAlertTimelineFilterStateEqual(
      { action: 'ACK', source: 'foundation-alerts', owner: 'ops-a' },
      { action: 'ACK', source: 'foundation-alerts', owner: 'ops-a' }
    ),
    true
  );
  assert.equal(
    isFoundationAlertTimelineFilterStateEqual(
      { action: 'ACK', source: 'foundation-alerts', owner: 'ops-a' },
      { action: 'MUTE', source: 'foundation-alerts', owner: 'ops-a' }
    ),
    false
  );
  assert.deepEqual(
    shortcuts.map((item) => item.label),
    ['最近责任人 ops-a', '最近来源 foundation-alerts', '主动作 UNMUTE', '最近隐藏流转', '最近恢复流转']
  );
  assert.deepEqual(shortcuts[0]?.filters, { action: 'ALL', source: 'ALL', owner: 'ops-a' });
  assert.equal(shortcuts[3]?.filters.action, 'MUTE');
  assert.equal(shortcuts[3]?.filters.source, 'foundation-alerts');
  assert.equal(shortcuts[4]?.filters.action, 'UNMUTE');
  assert.equal(shortcuts[4]?.filters.source, 'foundation-alerts');
  assert.deepEqual(buildFoundationAlertRecentOperationFilterState(history[0]), {
    action: 'MUTE',
    source: 'foundation-alerts',
    owner: 'ops-a'
  });
  assert.deepEqual(buildFoundationAlertRecentOperationFilterState(history[1]), {
    action: 'ACK',
    source: 'ALL',
    owner: 'ops-b'
  });
  assert.deepEqual(buildFoundationAlertRecentOperationFilterState(null), {
    action: 'ALL',
    source: 'ALL',
    owner: 'ALL'
  });
});

test('types: runtime governance receipt keeps a single shared execution shape', () => {
  const receipt: RuntimeGovernanceReceipt = {
    receiptCode: 'MINIAPP-BOOKING-SUBMIT-PROCEED',
    app: 'miniapp',
    action: 'booking-submit',
    state: 'submitted',
    nextStep: 'PROCEED',
    riskLevel: 'medium',
    recommendedAction: 'FOLLOW_SUBMIT_CALLBACK',
    requestEndpoint: '/api/v1/storefront/bookings',
    payloadSummary: '{"bookingSlot":"2026-06-12T10:00:00+08:00"}',
    ticket: {
      ticketCode: 'MINIAPP-BOOKING-SUBMIT-PROCEED-HANDLER',
      ticketType: 'HANDLER_CALLBACK',
      status: 'ready-for-handler',
      summary: '预约提交已具备 handler sync 前提。'
    },
    sync: {
      handlerName: 'miniapp-booking-submit-handler',
      syncMode: 'callback-followup',
      syncEndpoint: '/api/v1/foundation/runtime-governance/actions/MINIAPP-BOOKING-SUBMIT-PROCEED/sync',
      callbackEndpoint: '/api/v1/foundation/runtime-governance/actions/MINIAPP-BOOKING-SUBMIT-PROCEED/callback',
      idempotencyKey: 'miniapp-sync:MINIAPP-BOOKING-SUBMIT-PROCEED',
      ready: true,
      summary: 'handler 已可同步服务端状态。'
    },
    callback: {
      callbackStatus: 'awaiting-callback',
      ackToken: 'MINIAPP-BOOKING-SUBMIT-PROCEED-ACK',
      lastEvent: 'HANDLER_ACCEPTED',
      summary: '等待服务端 callback 回写。'
    },
    ledger: {
      ledgerKey: 'runtime-ledger:MINIAPP-BOOKING-SUBMIT-PROCEED',
      replayEndpoint: '/api/v1/foundation/runtime-governance/actions/MINIAPP-BOOKING-SUBMIT-PROCEED/replay',
      replayable: true,
      summary: '可进入统一 replay 队列。'
    },
    retry: {
      replayEndpoint: '/api/v1/foundation/runtime-governance/actions/MINIAPP-BOOKING-SUBMIT-PROCEED/replay',
      retryable: true,
      maxAttempts: 3,
      currentAttempt: 1,
      nextBackoffMs: 2000,
      escalationAction: 'WAIT_CALLBACK',
      summary: '优先等待 callback 再决定是否重试。'
    },
    rateLimit: {
      allowed: true,
      limit: 12,
      remaining: 11,
      retryAfterSeconds: 0,
      scopeKey: 'miniapp:booking-submit:tenant-demo'
    },
    events: [
      {
        eventType: 'runtime-governance.action.submitted',
        status: 'accepted',
        idempotencyKey: 'miniapp-sync:MINIAPP-BOOKING-SUBMIT-PROCEED',
        occurredAt: '2026-06-12T00:00:00.000Z',
        summary: '初始提交已受理。'
      }
    ],
    generatedAt: '2026-06-12T00:00:00.000Z'
  };

  assert.equal(receipt.sync.ready, true);
  assert.equal(receipt.callback.callbackStatus, 'awaiting-callback');
  assert.equal(receipt.ledger.replayable, true);
  assert.equal(receipt.events[0]?.eventType, 'runtime-governance.action.submitted');
});

test('types: runtime governance constants stay as the single shared enum source', () => {
  assert.deepEqual(runtimeGovernanceClientApps, ['admin-web', 'tob-web', 'storefront-web', 'miniapp', 'app', 'lyt']);
  assert.equal(runtimeGovernanceActionKeys.includes('webhook-callback'), true);
  assert.deepEqual(runtimeGovernanceApiActionKeys, [
    'approval-execution',
    'secret-rotation',
    'runtime-replay',
    'member-login',
    'coupon-claim',
    'booking-submit',
    'device-bind',
    'payment-submit'
  ]);
  assert.deepEqual(runtimeGovernanceNextSteps, ['PROCEED', 'LOGIN', 'CHALLENGE', 'REFRESH']);
  assert.deepEqual(runtimeGovernanceRiskLevels, ['low', 'medium', 'high']);
  assert.deepEqual(runtimeGovernanceRecommendedActions, [
    'REFRESH_BOOTSTRAP',
    'COMPLETE_LOGIN',
    'COMPLETE_CHALLENGE',
    'FOLLOW_SUBMIT_CALLBACK'
  ]);
  assert.deepEqual(runtimeGovernanceCallbackStatuses, ['callback-blocked', 'callback-recorded']);
  assert.deepEqual(runtimeGovernanceCallbackReceiptStatuses, [
    'callback-blocked',
    'awaiting-callback',
    'callback-recorded'
  ]);
  assert.deepEqual(runtimeGovernanceCallbackEvents, [
    'PREREQUISITE_PENDING',
    'CHALLENGE_PENDING',
    'HANDLER_ACCEPTED',
    'HANDLER_COMPLETED'
  ]);
  assert.deepEqual(runtimeGovernanceCallbackTimeoutThresholds, {
    low: 900000,
    medium: 600000,
    high: 300000
  });
  assert.deepEqual(runtimeGovernanceCallbackStallEscalationActions, [
    'WAIT_CALLBACK',
    'SCHEDULE_REPLAY',
    'OPEN_MANUAL_REVIEW'
  ]);
  assert.deepEqual(runtimeGovernanceReplaySources, [
    'ADMIN_WEB_RUNTIME',
    'TOB_WEB_RUNTIME',
    'STOREFRONT_WEB_RUNTIME',
    'MINIAPP_RUNTIME',
    'APP_RUNTIME'
  ]);
  assert.deepEqual(runtimeGovernanceReplayEscalationActions, [
    'REFRESH_TICKET',
    'WAIT_CALLBACK',
    'OPEN_MANUAL_REVIEW'
  ]);
  assert.deepEqual(adminRuntimeActionKeys, ['approval-execution', 'secret-rotation', 'runtime-replay']);
  assert.equal(adminRuntimeActionPresetContractMap['approval-execution'].handlerName, 'admin-approval-execution-handler');
  assert.equal(adminRuntimeActionPresetContractMap['secret-rotation'].payload.targetScope, 'tenant');
  assert.equal(adminRuntimeActionPresetContracts[0]?.replaySource, 'ADMIN_WEB_RUNTIME');
  assert.deepEqual(adminWorkbenchConsumerDescriptor.highRiskEntrypoints, [...adminRuntimeActionKeys]);
  assert.equal(
    adminWorkbenchConsumerDescriptor.actionGovernanceExamples.find((item) => item.action === 'approval-execution')?.requestEndpoint,
    adminRuntimeActionPresetContractMap['approval-execution'].requestEndpoint
  );
  assert.equal(
    adminWorkbenchConsumerDescriptor.runtimeHandoffExamples.find((item) => item.action === 'runtime-replay')?.handlerName,
    adminRuntimeActionPresetContractMap['runtime-replay'].handlerName
  );
});

test('types: runtime governance replay helpers keep shared retry policy progression stable', () => {
  const submitted = createRuntimeGovernanceReplayPolicy('receipt-submitted', 'submitted');
  const challenged = createRuntimeGovernanceReplayPolicy('receipt-challenge', 'challenge-issued');
  const blocked = createRuntimeGovernanceReplayPolicy('receipt-blocked', 'blocked');
  const progressed = advanceRuntimeGovernanceReplayPolicy({
    currentAttempt: submitted.currentAttempt,
    maxAttempts: submitted.maxAttempts,
    nextBackoffMs: submitted.nextBackoffMs
  });

  assert.equal(buildRuntimeGovernanceReplayEndpoint('receipt-submitted'), '/api/v1/foundation/runtime-governance/actions/receipt-submitted/replay');
  assert.deepEqual(
    {
      retryable: submitted.retryable,
      maxAttempts: submitted.maxAttempts,
      currentAttempt: submitted.currentAttempt,
      nextBackoffMs: submitted.nextBackoffMs,
      escalationAction: submitted.escalationAction
    },
    {
      retryable: true,
      maxAttempts: 3,
      currentAttempt: 0,
      nextBackoffMs: 2000,
      escalationAction: 'WAIT_CALLBACK'
    }
  );
  assert.equal(challenged.escalationAction, 'REFRESH_TICKET');
  assert.equal(challenged.maxAttempts, 2);
  assert.equal(blocked.retryable, false);
  assert.equal(blocked.escalationAction, 'OPEN_MANUAL_REVIEW');
  assert.deepEqual(progressed, {
    currentAttempt: 1,
    retryable: true,
    nextBackoffMs: 4000,
    escalationAction: 'WAIT_CALLBACK'
  });
});

test('types: runtime governance callback stall helper keeps timeout escalation stable', () => {
  const waiting = evaluateRuntimeGovernanceCallbackStall(
    {
      riskLevel: 'high',
      callback: {
        callbackStatus: 'awaiting-callback',
        ackToken: 'ack-001',
        lastEvent: 'HANDLER_ACCEPTED',
        summary: 'waiting callback'
      },
      retry: {
        replayEndpoint: '/api/v1/foundation/runtime-governance/actions/receipt-001/replay',
        retryable: true,
        maxAttempts: 3,
        currentAttempt: 0,
        nextBackoffMs: 2000,
        escalationAction: 'WAIT_CALLBACK',
        summary: 'waiting'
      },
      events: [
        {
          eventType: 'runtime-governance.handler.sync.requested',
          status: 'accepted',
          idempotencyKey: 'sync-001',
          occurredAt: '2026-06-12T00:00:00.000Z',
          summary: 'handler sync accepted'
        }
      ]
    },
    { now: '2026-06-12T00:06:00.000Z' }
  );
  const settled = evaluateRuntimeGovernanceCallbackStall(
    {
      riskLevel: 'medium',
      callback: {
        callbackStatus: 'callback-recorded',
        ackToken: 'ack-002',
        lastEvent: 'HANDLER_COMPLETED',
        summary: 'callback recorded'
      },
      retry: {
        replayEndpoint: '/api/v1/foundation/runtime-governance/actions/receipt-002/replay',
        retryable: false,
        maxAttempts: 1,
        currentAttempt: 1,
        nextBackoffMs: 0,
        escalationAction: 'OPEN_MANUAL_REVIEW',
        summary: 'settled'
      },
      events: []
    },
    { now: '2026-06-12T00:06:00.000Z' }
  );

  assert.deepEqual(
    {
      stalled: waiting.stalled,
      timeoutMs: waiting.timeoutMs,
      exceededMs: waiting.exceededMs,
      escalationAction: waiting.escalationAction
    },
    {
      stalled: true,
      timeoutMs: 300000,
      exceededMs: 60000,
      escalationAction: 'SCHEDULE_REPLAY'
    }
  );
  assert.equal(settled.stalled, false);
  assert.equal(settled.escalationAction, 'WAIT_CALLBACK');
});

test('types: runtime governance callback stall detail helper keeps drilldown payload stable', () => {
  const detail = buildRuntimeGovernanceCallbackStallDetail(
    {
      receiptCode: 'receipt-001',
      app: 'miniapp',
      action: 'booking-submit',
      riskLevel: 'high',
      sync: {
        handlerName: 'miniapp-booking-submit-handler',
        syncMode: 'callback-followup',
        syncEndpoint: '/api/v1/storefront/handlers/miniapp-booking-submit-handler/sync',
        callbackEndpoint: '/api/v1/storefront/handlers/miniapp-booking-submit-handler/callbacks/MINIAPP-BOOKING-SUBMIT-PROCEED',
        idempotencyKey: 'sync:receipt-001',
        ready: true,
        summary: 'handler callback follow-up'
      },
      callback: {
        callbackStatus: 'awaiting-callback',
        ackToken: 'ack-001',
        lastEvent: 'HANDLER_ACCEPTED',
        summary: 'waiting callback'
      },
      ledger: {
        ledgerKey: 'runtime-ledger:receipt-001',
        replayEndpoint: '/api/v1/foundation/runtime-governance/actions/receipt-001/replay',
        replayable: true,
        summary: 'ledger ready for replay'
      },
      rateLimit: {
        allowed: true,
        limit: 10,
        remaining: 9,
        retryAfterSeconds: 0,
        scopeKey: 'miniapp:booking-submit:tenant-demo'
      },
      retry: {
        replayEndpoint: '/api/v1/foundation/runtime-governance/actions/receipt-001/replay',
        retryable: true,
        maxAttempts: 3,
        currentAttempt: 0,
        nextBackoffMs: 2000,
        escalationAction: 'WAIT_CALLBACK',
        summary: 'waiting'
      },
      events: [
        {
          eventType: 'runtime-governance.handler.sync.requested',
          status: 'accepted',
          idempotencyKey: 'sync-001',
          occurredAt: '2026-06-12T00:00:00.000Z',
          summary: 'handler sync accepted'
        }
      ]
    },
    { now: '2026-06-12T00:06:00.000Z' }
  );

  assert.deepEqual(
    {
      receiptCode: detail.receiptCode,
      handlerName: detail.handlerName,
      latestEventType: detail.latestEventType,
      escalationAction: detail.escalationAction,
      exceededMs: detail.exceededMs
    },
    {
      receiptCode: 'receipt-001',
      handlerName: 'miniapp-booking-submit-handler',
      latestEventType: 'runtime-governance.handler.sync.requested',
      escalationAction: 'SCHEDULE_REPLAY',
      exceededMs: 60000
    }
  );
});

test('types: configuration operation detail href encodes and decodes operations safely', () => {
  assert.equal(
    buildConfigurationOperationDetailHref('secret.register'),
    '/configuration/operations/secret.register'
  );
  assert.equal(
    buildConfigurationOperationDetailHref('config entry/write'),
    '/configuration/operations/config%20entry%2Fwrite'
  );

  assert.equal(readConfigurationOperationDetailParam('secret.register'), 'secret.register');
  assert.equal(
    readConfigurationOperationDetailParam(['secret.register', 'duplicate']),
    'secret.register'
  );
  assert.equal(
    readConfigurationOperationDetailParam('config%20entry%2Fwrite'),
    'config entry/write'
  );
  assert.equal(readConfigurationOperationDetailParam(undefined), null);
  assert.equal(readConfigurationOperationDetailParam([]), null);
});

test('types: configuration secret detail href encodes and decodes names safely', () => {
  assert.equal(
    buildConfigurationSecretDetailHref('payment.gateway-key'),
    '/configuration/secrets/payment.gateway-key'
  );
  assert.equal(
    buildConfigurationSecretDetailHref('vault/root token'),
    '/configuration/secrets/vault%2Froot%20token'
  );

  assert.equal(readConfigurationSecretDetailParam('payment.gateway-key'), 'payment.gateway-key');
  assert.equal(
    readConfigurationSecretDetailParam(['payment.gateway-key', 'extra']),
    'payment.gateway-key'
  );
  assert.equal(
    readConfigurationSecretDetailParam('vault%2Froot%20token'),
    'vault/root token'
  );
  assert.equal(readConfigurationSecretDetailParam(undefined), null);
  assert.equal(readConfigurationSecretDetailParam([]), null);
});

test('types: configuration certificate detail href encodes and decodes names safely', () => {
  assert.equal(
    buildConfigurationCertificateDetailHref('api.tls'),
    '/configuration/certificates/api.tls'
  );
  assert.equal(
    buildConfigurationCertificateDetailHref('cdn/edge cert'),
    '/configuration/certificates/cdn%2Fedge%20cert'
  );

  assert.equal(readConfigurationCertificateDetailParam('api.tls'), 'api.tls');
  assert.equal(
    readConfigurationCertificateDetailParam(['api.tls', 'extra']),
    'api.tls'
  );
  assert.equal(
    readConfigurationCertificateDetailParam('cdn%2Fedge%20cert'),
    'cdn/edge cert'
  );
  assert.equal(readConfigurationCertificateDetailParam(undefined), null);
  assert.equal(readConfigurationCertificateDetailParam([]), null);
});

test('types: configuration feature flag detail href encodes and decodes keys safely', () => {
  assert.equal(
    buildConfigurationFeatureFlagDetailHref('checkout.experimental'),
    '/configuration/flags/checkout.experimental'
  );
  assert.equal(
    buildConfigurationFeatureFlagDetailHref('checkout/experimental flag'),
    '/configuration/flags/checkout%2Fexperimental%20flag'
  );

  assert.equal(
    readConfigurationFeatureFlagDetailParam('checkout.experimental'),
    'checkout.experimental'
  );
  assert.equal(
    readConfigurationFeatureFlagDetailParam(['checkout.experimental', 'extra']),
    'checkout.experimental'
  );
  assert.equal(
    readConfigurationFeatureFlagDetailParam('checkout%2Fexperimental%20flag'),
    'checkout/experimental flag'
  );
  assert.equal(readConfigurationFeatureFlagDetailParam(undefined), null);
  assert.equal(readConfigurationFeatureFlagDetailParam([]), null);
});

test('types: configuration config entry detail href encodes and decodes ids safely', () => {
  assert.equal(
    buildConfigurationConfigEntryDetailHref('checkout.fee'),
    '/configuration/entries/checkout.fee'
  );
  assert.equal(
    buildConfigurationConfigEntryDetailHref('checkout/fee rules'),
    '/configuration/entries/checkout%2Ffee%20rules'
  );

  assert.equal(
    readConfigurationConfigEntryDetailParam('checkout.fee'),
    'checkout.fee'
  );
  assert.equal(
    readConfigurationConfigEntryDetailParam(['checkout.fee', 'extra']),
    'checkout.fee'
  );
  assert.equal(
    readConfigurationConfigEntryDetailParam('checkout%2Ffee%20rules'),
    'checkout/fee rules'
  );
  assert.equal(readConfigurationConfigEntryDetailParam(undefined), null);
  assert.equal(readConfigurationConfigEntryDetailParam([]), null);
});

test('types: identity access role detail href encodes and decodes roles safely', () => {
  assert.equal(
    buildIdentityAccessRoleDetailHref('admin'),
    '/identity-access/roles/admin'
  );
  assert.equal(
    buildIdentityAccessRoleDetailHref('store manager'),
    '/identity-access/roles/store%20manager'
  );

  assert.equal(
    readIdentityAccessRoleDetailParam('admin'),
    'admin'
  );
  assert.equal(
    readIdentityAccessRoleDetailParam(['admin', 'extra']),
    'admin'
  );
  assert.equal(
    readIdentityAccessRoleDetailParam('store%20manager'),
    'store manager'
  );
  assert.equal(readIdentityAccessRoleDetailParam(undefined), null);
  assert.equal(readIdentityAccessRoleDetailParam([]), null);
});

test('types: identity access permission detail href encodes and decodes permissions safely', () => {
  assert.equal(
    buildIdentityAccessPermissionDetailHref('order:read'),
    '/identity-access/permissions/order%3Aread'
  );
  assert.equal(
    buildIdentityAccessPermissionDetailHref('order write'),
    '/identity-access/permissions/order%20write'
  );

  assert.equal(
    readIdentityAccessPermissionDetailParam('order%3Aread'),
    'order:read'
  );
  assert.equal(
    readIdentityAccessPermissionDetailParam(['order%3Aread', 'extra']),
    'order:read'
  );
  assert.equal(
    readIdentityAccessPermissionDetailParam('order%20write'),
    'order write'
  );
  assert.equal(readIdentityAccessPermissionDetailParam(undefined), null);
  assert.equal(readIdentityAccessPermissionDetailParam([]), null);
});

test('types: identity access session detail href encodes and decodes sessions safely', () => {
  assert.equal(
    buildIdentityAccessSessionDetailHref('sess-123'),
    '/identity-access/sessions/sess-123'
  );
  assert.equal(
    buildIdentityAccessSessionDetailHref('sess 2025/06'),
    '/identity-access/sessions/sess%202025%2F06'
  );

  assert.equal(
    readIdentityAccessSessionDetailParam('sess-123'),
    'sess-123'
  );
  assert.equal(
    readIdentityAccessSessionDetailParam(['sess-123', 'extra']),
    'sess-123'
  );
  assert.equal(
    readIdentityAccessSessionDetailParam('sess%202025%2F06'),
    'sess 2025/06'
  );
  assert.equal(readIdentityAccessSessionDetailParam(undefined), null);
  assert.equal(readIdentityAccessSessionDetailParam([]), null);
});

test('types: resilience signal detail href encodes and decodes signals safely', () => {
  assert.equal(buildResilienceSignalDetailHref('metrics'), '/resilience/signals/metrics');
  assert.equal(
    buildResilienceSignalDetailHref('logs/main'),
    '/resilience/signals/logs%2Fmain'
  );

  assert.equal(readResilienceSignalDetailParam('metrics'), 'metrics');
  assert.equal(readResilienceSignalDetailParam(['metrics', 'extra']), 'metrics');
  assert.equal(readResilienceSignalDetailParam('logs%2Fmain'), 'logs/main');
  assert.equal(readResilienceSignalDetailParam(undefined), null);
  assert.equal(readResilienceSignalDetailParam([]), null);
});

test('types: resilience retry policy detail href encodes and decodes keys safely', () => {
  assert.equal(
    buildResilienceRetryPolicyDetailHref('edge-sync-retry'),
    '/resilience/retries/edge-sync-retry'
  );
  assert.equal(
    buildResilienceRetryPolicyDetailHref('lyt:order-retry'),
    '/resilience/retries/lyt%3Aorder-retry'
  );

  assert.equal(
    readResilienceRetryPolicyDetailParam('edge-sync-retry'),
    'edge-sync-retry'
  );
  assert.equal(
    readResilienceRetryPolicyDetailParam(['edge-sync-retry', 'extra']),
    'edge-sync-retry'
  );
  assert.equal(
    readResilienceRetryPolicyDetailParam('lyt%3Aorder-retry'),
    'lyt:order-retry'
  );
  assert.equal(readResilienceRetryPolicyDetailParam(undefined), null);
  assert.equal(readResilienceRetryPolicyDetailParam([]), null);
});

test('types: resilience recovery plan detail href encodes and decodes resources safely', () => {
  assert.equal(
    buildResilienceRecoveryPlanDetailHref('postgres-primary'),
    '/resilience/recovery/postgres-primary'
  );
  assert.equal(
    buildResilienceRecoveryPlanDetailHref('store/nyc/db'),
    '/resilience/recovery/store%2Fnyc%2Fdb'
  );

  assert.equal(
    readResilienceRecoveryPlanDetailParam('postgres-primary'),
    'postgres-primary'
  );
  assert.equal(
    readResilienceRecoveryPlanDetailParam(['postgres-primary', 'extra']),
    'postgres-primary'
  );
  assert.equal(
    readResilienceRecoveryPlanDetailParam('store%2Fnyc%2Fdb'),
    'store/nyc/db'
  );
  assert.equal(readResilienceRecoveryPlanDetailParam(undefined), null);
  assert.equal(readResilienceRecoveryPlanDetailParam([]), null);
});

test('types: rate-limits policy detail href encodes and decodes ids safely', () => {
  assert.equal(
    buildRateLimitsPolicyDetailHref('policy-1'),
    '/rate-limits/policies/policy-1'
  );
  assert.equal(
    buildRateLimitsPolicyDetailHref('policy/sub/1'),
    '/rate-limits/policies/policy%2Fsub%2F1'
  );

  assert.equal(readRateLimitsPolicyDetailParam('policy-1'), 'policy-1');
  assert.equal(readRateLimitsPolicyDetailParam(['policy-1', 'extra']), 'policy-1');
  assert.equal(readRateLimitsPolicyDetailParam('policy%2Fsub%2F1'), 'policy/sub/1');
  assert.equal(readRateLimitsPolicyDetailParam(undefined), null);
  assert.equal(readRateLimitsPolicyDetailParam([]), null);
});

test('types: rate-limits ledger detail href encodes and decodes ids safely', () => {
  assert.equal(
    buildRateLimitsLedgerDetailHref('ledger-1'),
    '/rate-limits/ledgers/ledger-1'
  );
  assert.equal(
    buildRateLimitsLedgerDetailHref('ledger/abc:001'),
    '/rate-limits/ledgers/ledger%2Fabc%3A001'
  );

  assert.equal(readRateLimitsLedgerDetailParam('ledger-1'), 'ledger-1');
  assert.equal(readRateLimitsLedgerDetailParam(['ledger-1', 'extra']), 'ledger-1');
  assert.equal(readRateLimitsLedgerDetailParam('ledger%2Fabc%3A001'), 'ledger/abc:001');
  assert.equal(readRateLimitsLedgerDetailParam(undefined), null);
  assert.equal(readRateLimitsLedgerDetailParam([]), null);
});

test('types: buildAuditTrailHref returns /audit-trail when query is empty', () => {
  assert.equal(buildAuditTrailHref(), '/audit-trail');
  assert.equal(buildAuditTrailHref({}), '/audit-trail');
});

test('types: buildAuditTrailHref filters out empty / non-finite / non-positive values', () => {
  assert.equal(
    buildAuditTrailHref({
      source: 'configuration',
      purpose: 'configuration-entry:c-1',
      action: '',
      riskLevel: 'low',
      actorId: '',
      tenantId: 'tenant-1',
      from: '',
      to: '',
      limit: 0
    }),
    '/audit-trail?source=configuration&purpose=configuration-entry%3Ac-1&riskLevel=low&tenantId=tenant-1'
  );
});

test('types: buildAuditTrailHref accepts positive number values', () => {
  assert.equal(
    buildAuditTrailHref({ source: 'foundation', purpose: 'foundation-module:m-1', limit: 50 }),
    '/audit-trail?source=foundation&purpose=foundation-module%3Am-1&limit=50'
  );
});

test('types: buildAuditTrailHref encodes special characters in the purpose query', () => {
  // URLSearchParams uses form encoding (space → "+") for query strings.
  assert.equal(
    buildAuditTrailHref({ source: 's', purpose: 's:sub/with space' }),
    '/audit-trail?source=s&purpose=s%3Asub%2Fwith+space'
  );
});

test('types: domain governance workspace href keeps shared query encoding stable', () => {
  assert.equal(buildDomainGovernanceHref(), '/saas/domains');
  assert.equal(
    buildDomainGovernanceHref({
      tenantId: 'tenant-1',
      brandId: '',
      storeId: 'store-1',
      scopeType: 'STORE',
    }),
    '/saas/domains?tenantId=tenant-1&storeId=store-1&scopeType=STORE'
  );
  assert.equal(
    buildDomainGovernanceHref({
      tenantId: 'tenant with space',
      brandId: 'brand/1',
      marketCode: 'cn-mainland',
    }),
    '/saas/domains?tenantId=tenant+with+space&brandId=brand%2F1&marketCode=cn-mainland'
  );
});

test('types: domain governance focus scope prefers missing primary over generic order', () => {
  assert.deepEqual(
    selectDomainGovernanceFocusScope({
      totalMissingPrimaryScopes: 1,
      totalActiveWithoutPrimaryDomains: 2,
      recommendedReadyScopes: 1,
      tenantMissingPrimaryScopes: 0,
      brandMissingPrimaryScopes: 1,
      storeMissingPrimaryScopes: 0,
      requiresAttention: true,
      lastEvaluatedAt: '2026-07-18T00:00:00.000Z',
      currentScopes: [
        {
          scopeType: 'BRAND',
          tenantId: 'tenant-1',
          brandId: 'brand-1',
          activeDomainCount: 2,
          missingPrimary: false,
        },
        {
          scopeType: 'STORE',
          tenantId: 'tenant-1',
          brandId: 'brand-1',
          storeId: 'store-1',
          activeDomainCount: 2,
          missingPrimary: true,
        },
      ],
    }),
    {
      scopeType: 'STORE',
      tenantId: 'tenant-1',
      brandId: 'brand-1',
      storeId: 'store-1',
      activeDomainCount: 2,
      missingPrimary: true,
    }
  );
});

test('types: domain governance workspace href can be built directly from summary', () => {
  assert.equal(
    buildDomainGovernanceWorkspaceHref(
      {
        totalMissingPrimaryScopes: 0,
        totalActiveWithoutPrimaryDomains: 1,
        recommendedReadyScopes: 1,
        tenantMissingPrimaryScopes: 0,
        brandMissingPrimaryScopes: 1,
        storeMissingPrimaryScopes: 0,
        requiresAttention: true,
        lastEvaluatedAt: '2026-07-18T00:00:00.000Z',
        currentScopes: [
          {
            scopeType: 'BRAND',
            tenantId: 'tenant-1',
            brandId: 'brand-1',
            activeDomainCount: 2,
            missingPrimary: false,
          },
        ],
      },
      'cn-mainland'
    ),
    '/saas/domains?tenantId=tenant-1&brandId=brand-1&marketCode=cn-mainland&scopeType=BRAND'
  );
  assert.equal(
    buildDomainGovernanceWorkspaceHref(
      {
        totalMissingPrimaryScopes: 0,
        totalActiveWithoutPrimaryDomains: 0,
        recommendedReadyScopes: 0,
        tenantMissingPrimaryScopes: 0,
        brandMissingPrimaryScopes: 0,
        storeMissingPrimaryScopes: 0,
        requiresAttention: false,
        lastEvaluatedAt: '2026-07-18T00:00:00.000Z',
        currentScopes: [],
      },
      'us-default'
    ),
    '/saas/domains?marketCode=us-default'
  );
});

test('types: domain governance formatter helpers stay stable across consumers', () => {
  const summary = {
    totalMissingPrimaryScopes: 2,
    totalActiveWithoutPrimaryDomains: 3,
    recommendedReadyScopes: 1,
    tenantMissingPrimaryScopes: 0,
    brandMissingPrimaryScopes: 1,
    storeMissingPrimaryScopes: 1,
    requiresAttention: true,
    lastEvaluatedAt: '2026-07-18T00:00:00.000Z',
    currentScopes: [],
  };

  assert.equal(getDomainGovernanceAttentionLabel(summary), '待治理');
  assert.equal(formatDomainGovernanceCountsSummary(summary), '缺主 scope 2 / 活跃未设主域名 3');
  assert.equal(formatDomainGovernanceSourceSummary('custom', summary), '域名来源 custom / 可直接补选 1');
  assert.equal(
    getDomainGovernanceAttentionLabel({
      ...summary,
      requiresAttention: false,
      recommendedReadyScopes: 0,
    }),
    '已对齐',
  );
});

test('types: domain governance display model exposes richer section contract', () => {
  const summary = {
    totalMissingPrimaryScopes: 2,
    totalActiveWithoutPrimaryDomains: 3,
    recommendedReadyScopes: 1,
    tenantMissingPrimaryScopes: 0,
    brandMissingPrimaryScopes: 1,
    storeMissingPrimaryScopes: 1,
    requiresAttention: true,
    lastEvaluatedAt: '2026-07-18T00:00:00.000Z',
    currentScopes: [
      {
        scopeType: 'STORE',
        tenantId: 'tenant-demo',
        brandId: 'brand-demo',
        storeId: 'store-001',
        activeDomainCount: 2,
        missingPrimary: true,
        currentPrimaryDomain: null,
        recommendedDomain: 'store-001.brand-demo.tenant-demo.cn-mainland.local',
        recommendationReason: '优先选择 active_ssl',
      },
    ],
  };

  assert.equal(
    formatDomainGovernanceFocusScopeLabel(summary.currentScopes[0]),
    '焦点 scope STORE / tenant-demo / brand-demo / store-001',
  );
  assert.equal(
    formatDomainGovernanceFocusScopeSummary(summary.currentScopes[0]),
    '焦点 scope STORE / tenant-demo / brand-demo / store-001 / 激活域名 2 / 缺主域名',
  );
  assert.equal(
    formatDomainGovernanceRecommendationSummary(summary.currentScopes[0]),
    '推荐主域名：store-001.brand-demo.tenant-demo.cn-mainland.local / 原因 优先选择 active_ssl',
  );
  assert.equal(
    formatDomainGovernanceLastEvaluatedSummary(summary),
    '最近评估 2026-07-18T00:00:00.000Z',
  );

  assert.deepEqual(
    buildDomainGovernanceDisplayModel(
      'custom',
      summary,
      '/saas/domains?tenantId=tenant-demo&brandId=brand-demo&storeId=store-001&marketCode=cn-mainland&scopeType=STORE',
    ),
    {
      title: '域名治理工作台',
      subtitle: '统一域名缺口、推荐补选和治理入口展示',
      statusLabel: '待治理',
      countsSummary: '缺主 scope 2 / 活跃未设主域名 3',
      sourceSummary: '域名来源 custom / 可直接补选 1',
      statusSummary: '治理状态：待治理 / 可直接补选 1',
      compactSummary: '缺主 scope 2 / 域名来源 custom',
      workspaceSummary:
        '治理入口 /saas/domains?tenantId=tenant-demo&brandId=brand-demo&storeId=store-001&marketCode=cn-mainland&scopeType=STORE',
      workspaceHref:
        '/saas/domains?tenantId=tenant-demo&brandId=brand-demo&storeId=store-001&marketCode=cn-mainland&scopeType=STORE',
      ctaLabel: '打开域名治理工作台',
      focusScopeLabel: '焦点 scope STORE / tenant-demo / brand-demo / store-001',
      focusScopeSummary: '焦点 scope STORE / tenant-demo / brand-demo / store-001 / 激活域名 2 / 缺主域名',
      recommendationSummary: '推荐主域名：store-001.brand-demo.tenant-demo.cn-mainland.local / 原因 优先选择 active_ssl',
      lastEvaluatedSummary: '最近评估 2026-07-18T00:00:00.000Z',
      detailLines: [
        '焦点 scope STORE / tenant-demo / brand-demo / store-001 / 激活域名 2 / 缺主域名',
        '推荐主域名：store-001.brand-demo.tenant-demo.cn-mainland.local / 原因 优先选择 active_ssl',
        '最近评估 2026-07-18T00:00:00.000Z',
      ],
      requiresAttention: true,
    },
  );
});

test('types: buildAuditTrailRecordDetailHref encodes auditId safely', () => {
  assert.equal(buildAuditTrailRecordDetailHref('audit-1'), '/audit-trail/records/audit-1');
  assert.equal(
    buildAuditTrailRecordDetailHref('audit/with/slash'),
    '/audit-trail/records/audit%2Fwith%2Fslash'
  );
  assert.equal(buildAuditTrailRecordDetailHref(''), '/audit-trail/records/');
});

test('types: readAuditTrailRecordDetailParam decodes auditId and rejects empty input', () => {
  assert.equal(readAuditTrailRecordDetailParam('audit-1'), 'audit-1');
  assert.equal(
    readAuditTrailRecordDetailParam('audit%2Fwith%2Fslash'),
    'audit/with/slash'
  );
  assert.equal(readAuditTrailRecordDetailParam(undefined), null);
  assert.equal(readAuditTrailRecordDetailParam([]), null);
  assert.equal(readAuditTrailRecordDetailParam(['audit-1', 'extra']), 'audit-1');
});

test('types: workspace href builders strip empty string fields', () => {
  assert.equal(buildConfigurationHref(), '/configuration');
  assert.equal(
    buildConfigurationHref({ tenantId: 't-1', brandId: '', storeId: 's-1' }),
    '/configuration?tenantId=t-1&storeId=s-1'
  );

  assert.equal(buildResilienceHref(), '/resilience');
  assert.equal(
    buildResilienceHref({ capability: 'resilience-operations', resource: 'r-1' }),
    '/resilience?capability=resilience-operations&resource=r-1'
  );

  assert.equal(buildRateLimitsHref(), '/rate-limits');
  assert.equal(
    buildRateLimitsHref({ tenantId: 't-1', policyCode: 'p-1' }),
    '/rate-limits?tenantId=t-1&policyCode=p-1'
  );

  assert.equal(buildIdentityAccessHref(), '/identity-access');
  assert.equal(
    buildIdentityAccessHref({ tenantId: 't-1', brandId: 'b-1', storeId: 's-1', marketCode: 'cn' }),
    '/identity-access?tenantId=t-1&brandId=b-1&storeId=s-1&marketCode=cn'
  );

  assert.equal(buildIntegrationOrchestrationHref(), '/integration-orchestration');
  assert.equal(
    buildIntegrationOrchestrationHref({ source: 's-1' }),
    '/integration-orchestration?source=s-1'
  );

  assert.equal(buildFoundationWorkspaceHref(), '/foundation');
  assert.equal(
    buildFoundationWorkspaceHref({ moduleKey: 'configuration-governance', consumer: 'admin' }),
    '/foundation?moduleKey=configuration-governance&consumer=admin'
  );
});

test('types: workspace href builders encode special characters in query values', () => {
  assert.equal(
    buildConfigurationHref({ tenantId: 't with space', brandId: 'b/1' }),
    '/configuration?tenantId=t+with+space&brandId=b%2F1'
  );
  assert.equal(
    buildFoundationWorkspaceHref({ moduleKey: 'mod-1:sub' }),
    '/foundation?moduleKey=mod-1%3Asub'
  );
});
