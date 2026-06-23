'use client';

import { useCallback, useMemo, useState, useTransition } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { createWebFoundationAlertPanelClientAccess } from '@m5/sdk';
import {
  FoundationAlertPanelOwnerSummaryReadout,
  FoundationAlertPanelSelectedAlertReadout,
  FoundationAlertPanelSummaryDigestReadout,
  FoundationAlertPanelSourceSummaryReadout,
  FoundationAlertPanelTimelineReadout,
  createFoundationAlertNextNavigationBindings,
  createFoundationAlertPanelActionButtonStyle,
  createFoundationAlertPanelFeedbackStyle,
  createFoundationAlertPanelFilterButtonStyle,
  createFoundationAlertPanelFilterChipStyle,
  createFoundationAlertPanelSectionStyle,
  createFoundationAlertPanelSelectionButtonStyle,
  createFoundationAlertPanelSummaryCardStyle,
  createFoundationAlertPanelShortcutCardStyle,
  useFoundationAlertFocusSync,
  useFoundationAlertDrilldownQuery,
  useFoundationAlertGovernanceState,
  useFoundationAlertMutationController,
  useFoundationAlertTimelineQueryState,
  useFoundationAlertViewLinkController
} from '@m5/ui';
import {
  buildFoundationAlertOptimisticReadState,
  buildFoundationAlertPanelDerivedState,
  buildFoundationAlertQuickSwitchItems,
  buildFoundationAlertTimelineFilterReadState,
  filterFoundationAlertTimeline,
  isFoundationAlertTimelineFilterStateEqual,
  summarizeFoundationAlertTimelineFilters,
  type FoundationAlertMutationResponse,
  type FoundationAlertTimelineFilterState
} from '@m5/types';
import { loadStorefrontGovernanceReadModel, type StorefrontGovernanceReadModel } from '../market-bootstrap';

const panelPalette = {
  sectionBackground: 'rgba(15, 23, 42, 0.48)',
  sectionBorder: 'rgba(96, 165, 250, 0.16)',
  accentText: '#93c5fd',
  detailCardBorder: 'rgba(96, 165, 250, 0.12)',
  timelineCardBorder: 'rgba(96, 165, 250, 0.14)',
  summaryCardBorder: 'rgba(96, 165, 250, 0.12)',
  selectedQuickBorder: '#93c5fd',
  selectedQuickBackground: 'rgba(30, 64, 175, 0.22)',
  selectedButtonBorder: '#93c5fd',
  selectedButtonBackground: 'rgba(30, 64, 175, 0.22)',
  filterActiveBorder: '#93c5fd',
  filterActiveBackground: 'rgba(30, 64, 175, 0.22)',
  feedbackBackground: 'rgba(30, 64, 175, 0.18)',
  feedbackText: '#dbeafe',
  chipBorder: 'rgba(147, 197, 253, 0.24)',
  chipBackground: 'rgba(30, 64, 175, 0.2)',
  chipText: '#dbeafe',
  shortcutActiveBorder: 'rgba(147, 197, 253, 0.72)',
  shortcutActiveBackground: 'rgba(30, 64, 175, 0.2)'
} as const;

interface StorefrontGovernanceActionPanelProps {
  marketCode: string;
  tenantCode: string;
  brandCode: string;
  storeCode: string;
  initialGovernance: StorefrontGovernanceReadModel;
  focusAlertCode?: string;
  focusContext?: string;
  timelineQueryKey?: string;
  ownerQueryKey?: string;
  sourceQueryKey?: string;
  onFocusChange?: (code: string, context: string) => void;
}

export function GovernanceActionPanel({
  marketCode,
  tenantCode,
  brandCode,
  storeCode,
  initialGovernance,
  focusAlertCode,
  focusContext,
  timelineQueryKey = 'alertAction',
  ownerQueryKey = 'alertOwner',
  sourceQueryKey,
  onFocusChange
}: StorefrontGovernanceActionPanelProps) {
  const router = useRouter();
  const navigationBindings = createFoundationAlertNextNavigationBindings({
    router,
    pathname: usePathname(),
    searchParams: useSearchParams(),
    replace: (href: string) => router.replace(href, { scroll: false }),
  });
  const [isPending, startTransition] = useTransition();
  const [mutation, setMutation] = useState<FoundationAlertMutationResponse | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [filterState, setFilterState] = useState<FoundationAlertTimelineFilterState>({
    action: 'ALL',
    owner: 'ALL',
    source: 'ALL'
  });
  const timelineFilter = filterState.action;
  const ownerFilter = filterState.owner;
  const sourceFilter = filterState.source;
  const loadGovernance = useCallback(
    () => loadStorefrontGovernanceReadModel(marketCode, tenantCode, brandCode, storeCode),
    [brandCode, marketCode, storeCode, tenantCode]
  );
  const { governance, refreshGovernance, selectedAlertCode, setSelectedAlertCode } = useFoundationAlertGovernanceState({
    initialGovernance,
    focusAlertCode,
    loadGovernance
  });

  const panelAccess = useMemo(
    () =>
      createWebFoundationAlertPanelClientAccess({
        app: 'storefront-web',
        tenantId: tenantCode,
        brandId: brandCode,
        storeId: storeCode,
        marketCode
      }),
    [brandCode, marketCode, storeCode, tenantCode]
  );
  const loadDrilldown = useCallback(
    (code: string) => panelAccess.loadDrilldown?.(code),
    [panelAccess]
  );
  const drilldown = useFoundationAlertDrilldownQuery({
    selectedAlertCode,
    loadDrilldown,
    setActionError
  });

  const derivedPanelState = useMemo(
    () =>
      buildFoundationAlertPanelDerivedState({
        alerts: governance.alerts,
        selectedAlertCode,
        drilldown,
        mutation,
        filters: filterState
      }),
    [drilldown, filterState, governance.alerts, mutation, selectedAlertCode]
  );
  const {
    actionFilteredTimeline,
    activeMutation,
    currentNote,
    currentOwner,
    filteredTimeline,
    latestMatchedTimeline,
    ownerSummary,
    recentTimeline,
    runtimeCallbackDrilldown,
    selectedAlert,
    sourceSummary,
    timelineDigest,
    timelineMetrics
  } = derivedPanelState;
  const filterReadState = useMemo(
    () =>
      buildFoundationAlertTimelineFilterReadState({
        action: timelineFilter,
        source: sourceFilter,
        owner: ownerFilter,
        history: recentTimeline
      }),
    [ownerFilter, recentTimeline, sourceFilter, timelineFilter]
  );
  const { activeFilterChips, filterEmptyState, filterSummary, hasActiveFilters, shortcutPresets } = filterReadState;
  const quickSwitchAlerts = useMemo(
    () => buildFoundationAlertQuickSwitchItems(governance.topRisks ?? [], governance.alerts),
    [governance.alerts, governance.topRisks]
  );
  const { pendingMutationAction, runMutation } = useFoundationAlertMutationController({
    selectedAlertCode: selectedAlert?.code,
    setActionError,
    applyMutation: () => setMutation(null),
    refreshGovernance,
    refreshView: () =>
      startTransition(() => {
        router.refresh();
      }),
    executeMutation: (action, code) => panelAccess.executeMutation?.(action, code)
  });
  const optimisticReadState = useMemo(
    () =>
      buildFoundationAlertOptimisticReadState({
        pendingMutationAction,
        visibleInOverview: selectedAlert?.visibleInOverview
      }),
    [pendingMutationAction, selectedAlert?.visibleInOverview]
  );
  const optimisticOverviewVisibility = optimisticReadState.overviewVisibility;
  const optimisticFeedback = optimisticReadState.feedback;
  const { applyShortcut, clearAllFilters, clearFilter, filterDeepLinkPreview, handleOwnerFilterChange, handleSourceFilterChange, handleTimelineFilterChange } =
    useFoundationAlertTimelineQueryState({
      searchParams: navigationBindings.searchParams,
      pathname: navigationBindings.pathname,
      replace: navigationBindings.replace,
      timelineQueryKey,
      ownerQueryKey,
      sourceQueryKey,
      filterState,
      setFilterState,
      availableOwners: ownerSummary.map((item) => item.actorId),
      availableSources: sourceSummary.map((item) => item.source)
    });
  const { copiedViewMessage, copyCurrentViewLink } = useFoundationAlertViewLinkController();

  useFoundationAlertFocusSync({
    selectedAlertCode: selectedAlert?.code,
    focusAlertCode,
    focusContext,
    onFocusChange
  });

  function handleSelectedAlertChange(code: string) {
    setSelectedAlertCode(code);
  }

  const availableActions = new Set(selectedAlert?.availableActions ?? []);

  return (
    <section style={createFoundationAlertPanelSectionStyle(panelPalette)}>
      <div style={{ fontSize: 14, fontWeight: 700, color: panelPalette.accentText }}>治理告警操作面板</div>
      <div style={{ marginTop: 8, color: '#cbd5e1' }}>
        当前生成时间：{governance.generatedAt} / 交付模式：{governance.deliveryMode}
      </div>
      {focusContext ? (
        <div style={{ marginTop: 8, color: panelPalette.accentText }}>
          当前联动：{focusContext}
          {selectedAlert?.code ? ` -> ${selectedAlert.code}` : ''}
        </div>
      ) : null}
      <div style={{ marginTop: 12, color: panelPalette.accentText, fontSize: 13 }}>Top risk 快捷切换</div>
      <div style={{ marginTop: 8, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        {quickSwitchAlerts.map((item) => (
          <button
            key={`${item.code}-quick-switch`}
            type="button"
            onClick={() => handleSelectedAlertChange(item.code)}
            style={createFoundationAlertPanelSelectionButtonStyle(panelPalette, item.code === selectedAlert?.code, 'quick')}
          >
            {item.code}
          </button>
        ))}
      </div>
      <div style={{ marginTop: 14, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        {governance.alerts.slice(0, 6).map((item) => (
          <button
            key={item.code}
            type="button"
            onClick={() => handleSelectedAlertChange(item.code)}
            style={createFoundationAlertPanelSelectionButtonStyle(panelPalette, item.code === selectedAlert?.code, 'default')}
          >
            {item.code}
          </button>
        ))}
      </div>
      <div style={{ marginTop: 14, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={() => void refreshGovernance()}
          disabled={isPending || pendingMutationAction !== null}
          style={createFoundationAlertPanelActionButtonStyle('#0f172a')}
        >
          刷新 triage
        </button>
        <button
          type="button"
          onClick={() => void runMutation('ACK')}
          disabled={isPending || pendingMutationAction !== null || !availableActions.has('ACK')}
          style={createFoundationAlertPanelActionButtonStyle('#1d4ed8')}
        >
          Ack
        </button>
        <button
          type="button"
          onClick={() => void runMutation('MUTE')}
          disabled={isPending || pendingMutationAction !== null || !availableActions.has('MUTE')}
          style={createFoundationAlertPanelActionButtonStyle('#7c3aed')}
        >
          Mute
        </button>
        <button
          type="button"
          onClick={() => void runMutation('UNMUTE')}
          disabled={isPending || pendingMutationAction !== null || !availableActions.has('UNMUTE')}
          style={createFoundationAlertPanelActionButtonStyle('#0f766e')}
        >
          取消静默
        </button>
      </div>
      {optimisticFeedback ? (
        <div style={createFoundationAlertPanelFeedbackStyle(panelPalette)}>
          <div style={{ fontWeight: 700 }}>{optimisticFeedback.title}</div>
          <div style={{ marginTop: 6 }}>{optimisticFeedback.description}</div>
        </div>
      ) : null}
      <div style={{ marginTop: 12, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        {(['ALL', 'ACK', 'MUTE', 'UNMUTE'] as const).map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => handleTimelineFilterChange(item)}
            style={createFoundationAlertPanelFilterButtonStyle(panelPalette, timelineFilter === item)}
          >
            {item} ({filterFoundationAlertTimeline(recentTimeline, item).length})
          </button>
        ))}
      </div>
      <div style={{ marginTop: 12, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={() => handleSourceFilterChange('ALL')}
          style={createFoundationAlertPanelFilterButtonStyle(panelPalette, sourceFilter === 'ALL')}
        >
          全部来源 ({actionFilteredTimeline.length})
        </button>
        {sourceSummary.map((item) => (
          <button
            key={`${item.source}-filter`}
            type="button"
            onClick={() => handleSourceFilterChange(item.source)}
            style={createFoundationAlertPanelFilterButtonStyle(panelPalette, sourceFilter === item.source)}
          >
            {item.source} ({item.count})
          </button>
        ))}
      </div>
      <div style={{ marginTop: 12, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={() => handleOwnerFilterChange('ALL')}
          style={createFoundationAlertPanelFilterButtonStyle(panelPalette, ownerFilter === 'ALL')}
        >
          全部责任人 ({actionFilteredTimeline.length})
        </button>
        {ownerSummary.map((item) => (
          <button
            key={`${item.actorId}-filter`}
            type="button"
            onClick={() => handleOwnerFilterChange(item.actorId)}
            style={createFoundationAlertPanelFilterButtonStyle(panelPalette, ownerFilter === item.actorId)}
          >
            {item.actorId} ({item.count})
          </button>
        ))}
      </div>
      <div style={{ marginTop: 10, color: panelPalette.accentText, fontSize: 12 }}>
        筛选 deep link：{filterDeepLinkPreview}
      </div>
      <div style={{ marginTop: 10, display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        <button type="button" onClick={() => void copyCurrentViewLink()} style={createFoundationAlertPanelActionButtonStyle('#0f172a')}>
          复制当前视图链接
        </button>
        <button
          type="button"
          onClick={clearAllFilters}
          disabled={!hasActiveFilters}
          style={createFoundationAlertPanelActionButtonStyle('#1e293b')}
        >
          清空全部筛选
        </button>
        <div style={{ color: '#cbd5e1', fontSize: 12 }}>
          当前视图：{selectedAlert?.code ?? 'none'} / {filterSummary}
        </div>
        {copiedViewMessage ? <div style={{ color: panelPalette.accentText, fontSize: 12 }}>{copiedViewMessage}</div> : null}
      </div>
      {activeFilterChips.length > 0 ? (
        <div style={{ marginTop: 10, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {activeFilterChips.map((item) => (
            <button
              key={`${item.kind}-${item.value}`}
              type="button"
              onClick={() => clearFilter(item.kind)}
              style={createFoundationAlertPanelFilterChipStyle(panelPalette)}
            >
              {item.label} x
            </button>
          ))}
        </div>
      ) : null}
      {shortcutPresets.length > 0 ? (
        <div style={{ marginTop: 12 }}>
          <div style={{ color: panelPalette.accentText, fontSize: 13 }}>快捷排查方案</div>
          <div style={{ marginTop: 10, display: 'grid', gap: 10, gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
            {shortcutPresets.map((item) => {
              const active = isFoundationAlertTimelineFilterStateEqual(filterState, item.filters);
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => applyShortcut(item.filters)}
                  style={createFoundationAlertPanelShortcutCardStyle(
                    panelPalette,
                    createFoundationAlertPanelSummaryCardStyle(panelPalette),
                    active
                  )}
                >
                  <div style={{ fontWeight: 700 }}>{item.label}</div>
                  <div style={{ marginTop: 6, color: '#cbd5e1' }}>{item.helper}</div>
                  <div style={{ marginTop: 6, color: panelPalette.accentText }}>
                    {summarizeFoundationAlertTimelineFilters(item.filters)}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
      {selectedAlert ? (
        <FoundationAlertPanelSelectedAlertReadout
          palette={panelPalette}
          selectedAlert={selectedAlert}
          currentOwner={currentOwner}
          optimisticOverviewVisibility={optimisticOverviewVisibility}
          drilldown={drilldown}
          currentNote={currentNote}
          recentTimeline={recentTimeline}
          runtimeCallbackDrilldown={runtimeCallbackDrilldown}
        />
      ) : null}
      <FoundationAlertPanelSourceSummaryReadout palette={panelPalette} items={sourceSummary} />
      <FoundationAlertPanelOwnerSummaryReadout palette={panelPalette} items={ownerSummary} />
      <FoundationAlertPanelSummaryDigestReadout
        palette={panelPalette}
        filterSummary={filterSummary}
        filterDeepLinkPreview={filterDeepLinkPreview}
        activeFilterCount={activeFilterChips.length}
        filterState={filterState}
        timelineMetrics={timelineMetrics}
        latestMatchedTimeline={latestMatchedTimeline}
        defaultLatestSource={recentTimeline[0]?.source}
        timelineDigest={timelineDigest}
        sourceSummary={sourceSummary}
      />
      <FoundationAlertPanelTimelineReadout
        palette={panelPalette}
        recentTimeline={recentTimeline}
        filteredTimeline={filteredTimeline}
        filterEmptyState={filterEmptyState}
      />
      {activeMutation ? (
        <div style={{ marginTop: 12, color: '#cbd5e1' }}>
          最近 mutation：{activeMutation.acknowledgement?.status ?? 'UNKNOWN'} / history {activeMutation.history?.length ?? 0}
        </div>
      ) : null}
      {actionError ? <div style={{ marginTop: 12, color: '#fca5a5' }}>{actionError}</div> : null}
    </section>
  );
}
