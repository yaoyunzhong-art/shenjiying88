'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import type {
  FoundationAlertRuntimeCallbackStalledDetail,
  FoundationAlertTimelineDigest as SharedTimelineDigest,
  FoundationAlertTimelineEntry as SharedTimelineEntry,
  FoundationAlertTimelineMetrics as SharedTimelineMetrics,
} from '@m5/types';

export interface FoundationAlertPanelReadoutPalette {
  surface?: string;
  border?: string;
  text?: string;
  muted?: string;
  accent?: string;
  row?: string;
  rowAlt?: string;
  sectionBackground?: string;
  sectionBorder?: string;
  accentText?: string;
  feedbackBackground?: string;
  feedbackText?: string;
  chipBorder?: string;
  chipBackground?: string;
  chipText?: string;
  selectedButtonBorder?: string;
  selectedButtonBackground?: string;
  filterActiveBorder?: string;
  filterActiveBackground?: string;
  shortcutActiveBorder?: string;
  shortcutActiveBackground?: string;
}

const defaultPalette: FoundationAlertPanelReadoutPalette = {
  surface: '#1e293b',
  border: '#334155',
  text: '#f1f5f9',
  muted: '#94a3b8',
  accent: '#38bdf8',
  row: 'rgba(148,163,184,0.06)',
  rowAlt: 'rgba(148,163,184,0.12)',
};

function resolvePalette(palette: FoundationAlertPanelReadoutPalette = defaultPalette) {
  const accent = palette.accent ?? palette.accentText ?? defaultPalette.accent!;
  const border = palette.border ?? palette.sectionBorder ?? defaultPalette.border!;
  const text = palette.text ?? defaultPalette.text!;
  const muted = palette.muted ?? defaultPalette.muted!;
  const row = palette.row ?? defaultPalette.row!;
  const rowAlt = palette.rowAlt ?? defaultPalette.rowAlt!;

  return {
    surface: palette.surface ?? palette.sectionBackground ?? defaultPalette.surface!,
    border,
    text,
    muted,
    accent,
    row,
    rowAlt,
    feedbackBackground: palette.feedbackBackground ?? row,
    feedbackText: palette.feedbackText ?? muted,
    chipBorder: palette.chipBorder ?? `${accent}33`,
    chipBackground: palette.chipBackground ?? `${accent}1a`,
    chipText: palette.chipText ?? accent,
    selectedButtonBorder: palette.selectedButtonBorder ?? accent,
    selectedButtonBackground: palette.selectedButtonBackground ?? `${accent}20`,
    filterActiveBorder: palette.filterActiveBorder ?? accent,
    filterActiveBackground: palette.filterActiveBackground ?? `${accent}20`,
    shortcutActiveBorder: palette.shortcutActiveBorder ?? accent,
    shortcutActiveBackground: palette.shortcutActiveBackground ?? `${accent}20`,
  };
}

function toSentenceCase(value: string) {
  return value
    .split(/[-_]/g)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function formatDateTime(value?: string | null) {
  return value ? new Date(value).toLocaleString() : null;
}

function summarizeTimelineDigest(digest?: string | SharedTimelineDigest | null) {
  if (!digest) {
    return null;
  }

  if (typeof digest === 'string') {
    return digest;
  }

  const parts = [
    digest.dominantAction ? `dominant ${digest.dominantAction}` : null,
    digest.latestActorId ? `latest actor ${digest.latestActorId}` : null,
    digest.dominantSource ? `source ${digest.dominantSource}` : null,
    digest.latestSource ? `latest ${digest.latestSource}` : null,
  ].filter(Boolean);

  return parts.length ? parts.join(' / ') : null;
}

function summarizeRuntimeCallbackDrilldown(detail?: FoundationAlertRuntimeCallbackStalledDetail | unknown | null) {
  if (!detail || typeof detail !== 'object') {
    return null;
  }

  const record = detail as Record<string, unknown>;
  return typeof record.total === 'number' ? `Callback stalled: ${record.total}` : null;
}

export function createFoundationAlertPanelSectionStyle(
  palette: FoundationAlertPanelReadoutPalette = defaultPalette
): React.CSSProperties {
  const resolved = resolvePalette(palette);
  return {
    background: resolved.surface,
    border: `1px solid ${resolved.border}`,
    borderRadius: 12,
    padding: 20,
    color: resolved.text,
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  };
}

export function createFoundationAlertPanelSelectionButtonStyle(
  palette: FoundationAlertPanelReadoutPalette = defaultPalette,
  selected = false,
  _variant: 'quick' | 'default' = 'default'
): React.CSSProperties {
  const resolved = resolvePalette(palette);
  return {
    padding: '6px 14px',
    borderRadius: 8,
    fontSize: 13,
    fontWeight: selected ? 600 : 400,
    border: `1px solid ${selected ? resolved.selectedButtonBorder : resolved.border}`,
    background: selected ? resolved.selectedButtonBackground : 'transparent',
    color: selected ? resolved.accent : resolved.text,
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  };
}

export function createFoundationAlertPanelActionButtonStyle(bg: string): React.CSSProperties {
  return {
    padding: '6px 14px',
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 500,
    border: 'none',
    background: bg,
    color: '#ffffff',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    transition: 'opacity 0.15s ease',
  };
}

export function createFoundationAlertPanelFeedbackStyle(
  palette: FoundationAlertPanelReadoutPalette = defaultPalette
): React.CSSProperties {
  const resolved = resolvePalette(palette);
  return {
    padding: '10px 14px',
    borderRadius: 8,
    fontSize: 13,
    background: resolved.feedbackBackground,
    border: `1px solid ${resolved.border}`,
    color: resolved.feedbackText,
  };
}

export function createFoundationAlertPanelFilterButtonStyle(
  palette: FoundationAlertPanelReadoutPalette = defaultPalette,
  selected = false
): React.CSSProperties {
  const resolved = resolvePalette(palette);
  return {
    padding: '4px 10px',
    borderRadius: 6,
    fontSize: 12,
    fontWeight: selected ? 600 : 400,
    border: `1px solid ${selected ? resolved.filterActiveBorder : resolved.border}`,
    background: selected ? resolved.filterActiveBackground : 'transparent',
    color: selected ? resolved.accent : resolved.muted,
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  };
}

export function createFoundationAlertPanelFilterChipStyle(
  palette: FoundationAlertPanelReadoutPalette = defaultPalette
): React.CSSProperties {
  const resolved = resolvePalette(palette);
  return {
    padding: '2px 8px',
    borderRadius: 4,
    fontSize: 12,
    background: resolved.chipBackground,
    border: `1px solid ${resolved.chipBorder}`,
    color: resolved.chipText,
    whiteSpace: 'nowrap',
  };
}

export function createFoundationAlertPanelSummaryCardStyle(
  palette: FoundationAlertPanelReadoutPalette = defaultPalette
): React.CSSProperties {
  const resolved = resolvePalette(palette);
  return {
    padding: '10px 14px',
    borderRadius: 8,
    fontSize: 13,
    background: resolved.row,
    border: `1px solid ${resolved.border}`,
    color: resolved.text,
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  };
}

export function createFoundationAlertPanelShortcutCardStyle(
  palette: FoundationAlertPanelReadoutPalette = defaultPalette,
  baseStyle: React.CSSProperties,
  active = false
): React.CSSProperties {
  const resolved = resolvePalette(palette);
  return {
    ...baseStyle,
    borderColor: active ? resolved.shortcutActiveBorder : baseStyle.borderColor,
    background: active ? resolved.shortcutActiveBackground : baseStyle.background,
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  };
}

export interface FoundationAlertGovernanceAlert {
  code: string;
  title?: string;
  defaultSummary?: string;
  severity?: string;
  severityPolicy?: string;
  source?: string;
  sourceModules?: string[];
  status?: string;
  createdAt?: string;
  updatedAt?: string;
  visibleInOverview?: boolean;
  availableActions?: string[];
}

export interface FoundationAlertTimelineItem {
  id?: string;
  source?: string | null;
  status?: string;
  severity?: string;
  timestamp?: string;
  createdAt?: string;
  message?: string;
  note?: string | null;
  actorId?: string | null;
  action?: string;
  visibleInOverview?: boolean;
}

export interface FoundationAlertSourceSummaryItem {
  source: string;
  count: number;
  latestTimestamp?: string | null;
}

export interface FoundationAlertOwnerSummaryItem {
  actorId: string;
  count: number;
  latestTimestamp?: string | null;
}

export interface FoundationAlertFilterSummaryItem {
  label: string;
  value: string;
  count: number;
}

export interface FoundationAlertTimelineMetrics {
  total: number;
  filtered?: number;
  visibleInOverview?: number;
  hiddenFromOverview?: number;
  latestTimestamp?: string | null;
  latestMatchedAt?: string | null;
}

export interface FoundationAlertFilterState {
  action?: string;
  severity?: string;
  status?: string;
  source?: string;
  owner?: string;
}

function getAlertTitle(alert: FoundationAlertGovernanceAlert) {
  return alert.title ?? alert.defaultSummary ?? alert.code;
}

function getAlertSource(alert: FoundationAlertGovernanceAlert) {
  return alert.source ?? alert.sourceModules?.join(', ') ?? null;
}

function getTimelineItems(items?: Array<FoundationAlertTimelineItem | SharedTimelineEntry> | null): FoundationAlertTimelineItem[] {
  return (items ?? []).map((item, index) => {
    const entry = item as FoundationAlertTimelineItem & SharedTimelineEntry;
    return {
      id: entry.id ?? `${entry.action ?? 'timeline'}-${index}`,
      source: entry.source ?? null,
      status: entry.status,
      severity: entry.severity,
      timestamp: entry.timestamp ?? entry.createdAt,
      createdAt: entry.createdAt ?? entry.timestamp,
      message: entry.message ?? entry.note ?? undefined,
      note: entry.note ?? null,
      actorId: entry.actorId ?? null,
      action: entry.action,
      visibleInOverview: entry.visibleInOverview,
    };
  });
}

interface FoundationAlertPanelSelectedAlertReadoutProps {
  palette?: FoundationAlertPanelReadoutPalette;
  selectedAlert: FoundationAlertGovernanceAlert;
  currentOwner?: string;
  optimisticOverviewVisibility?: boolean | string;
  drilldown?: unknown;
  currentNote?: string | null;
  recentTimeline?: Array<FoundationAlertTimelineItem | SharedTimelineEntry>;
  runtimeCallbackDrilldown?: FoundationAlertRuntimeCallbackStalledDetail | unknown | null;
}

export function FoundationAlertPanelSelectedAlertReadout({
  palette = defaultPalette,
  selectedAlert,
  currentOwner,
  optimisticOverviewVisibility,
  currentNote,
  recentTimeline,
  runtimeCallbackDrilldown,
}: FoundationAlertPanelSelectedAlertReadoutProps) {
  const resolved = resolvePalette(palette);
  const visibility =
    typeof optimisticOverviewVisibility === 'string'
      ? optimisticOverviewVisibility
      : optimisticOverviewVisibility === true
        ? 'visible'
        : optimisticOverviewVisibility === false
          ? 'hidden'
          : null;
  const source = getAlertSource(selectedAlert);
  const timeline = getTimelineItems(recentTimeline);
  const runtimeSummary = summarizeRuntimeCallbackDrilldown(runtimeCallbackDrilldown);

  return (
    <div
      data-testid="foundation-alert-panel-selected-alert-readout"
      style={{
        padding: '12px 16px',
        borderRadius: 8,
        background: `${resolved.accent}12`,
        border: `1px solid ${resolved.accent}33`,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}
    >
      <div style={{ fontSize: 15, fontWeight: 600, color: resolved.accent }}>{getAlertTitle(selectedAlert)}</div>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', fontSize: 12, color: resolved.muted }}>
        <span>Code: {selectedAlert.code}</span>
        {selectedAlert.severity ? <span>Severity: {selectedAlert.severity}</span> : null}
        {source ? <span>Source: {source}</span> : null}
        {currentOwner ? <span>Owner: {currentOwner}</span> : null}
        {visibility ? <span>Overview: {visibility}</span> : null}
      </div>
      {currentNote ? <div style={{ fontSize: 12, color: resolved.muted, fontStyle: 'italic' }}>{currentNote}</div> : null}
      {runtimeSummary ? <div style={{ fontSize: 12, color: resolved.muted }}>{runtimeSummary}</div> : null}
      {timeline.length ? <div style={{ fontSize: 12, color: resolved.muted }}>Recent events: {timeline.length}</div> : null}
    </div>
  );
}

interface FoundationAlertPanelSourceSummaryReadoutProps {
  palette?: FoundationAlertPanelReadoutPalette;
  items?: FoundationAlertSourceSummaryItem[];
}

export function FoundationAlertPanelSourceSummaryReadout({
  palette = defaultPalette,
  items = [],
}: FoundationAlertPanelSourceSummaryReadoutProps) {
  const resolved = resolvePalette(palette);

  return (
    <div data-testid="foundation-alert-panel-source-summary-readout" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: resolved.text }}>Source Summary</div>
      {items.length === 0 ? (
        <div style={{ fontSize: 12, color: resolved.muted }}>No source data</div>
      ) : (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {items.map((item) => (
            <div
              key={item.source}
              style={{
                padding: '6px 12px',
                borderRadius: 6,
                background: resolved.row,
                border: `1px solid ${resolved.border}`,
                fontSize: 12,
                color: resolved.text,
              }}
            >
              {item.source}: <strong>{item.count}</strong>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

interface FoundationAlertPanelOwnerSummaryReadoutProps {
  palette?: FoundationAlertPanelReadoutPalette;
  items?: FoundationAlertOwnerSummaryItem[];
}

export function FoundationAlertPanelOwnerSummaryReadout({
  palette = defaultPalette,
  items = [],
}: FoundationAlertPanelOwnerSummaryReadoutProps) {
  const resolved = resolvePalette(palette);

  return (
    <div data-testid="foundation-alert-panel-owner-summary-readout" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: resolved.text }}>Owner Summary</div>
      {items.length === 0 ? (
        <div style={{ fontSize: 12, color: resolved.muted }}>No owner data</div>
      ) : (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {items.map((item) => (
            <div
              key={item.actorId}
              style={{
                padding: '6px 12px',
                borderRadius: 6,
                background: resolved.row,
                border: `1px solid ${resolved.border}`,
                fontSize: 12,
                color: resolved.text,
              }}
            >
              {item.actorId}: <strong>{item.count}</strong>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

interface FoundationAlertPanelSummaryDigestReadoutProps {
  palette?: FoundationAlertPanelReadoutPalette;
  filterSummary?: FoundationAlertFilterSummaryItem[] | string;
  filterDeepLinkPreview?: string | null;
  activeFilterCount?: number;
  filterState?: FoundationAlertFilterState;
  timelineMetrics?: FoundationAlertTimelineMetrics | SharedTimelineMetrics;
  latestMatchedTimeline?: FoundationAlertTimelineItem | SharedTimelineEntry | null;
  defaultLatestSource?: string | null;
  timelineDigest?: string | SharedTimelineDigest | null;
  sourceSummary?: FoundationAlertSourceSummaryItem[];
}

export function FoundationAlertPanelSummaryDigestReadout({
  palette = defaultPalette,
  filterSummary,
  filterDeepLinkPreview,
  activeFilterCount,
  timelineMetrics,
  latestMatchedTimeline,
  defaultLatestSource,
  timelineDigest,
}: FoundationAlertPanelSummaryDigestReadoutProps) {
  const resolved = resolvePalette(palette);
  const metrics = timelineMetrics as FoundationAlertTimelineMetrics | undefined;
  const filteredCount = metrics?.filtered ?? metrics?.total;
  const latestTimeline = latestMatchedTimeline
    ? getTimelineItems([latestMatchedTimeline as FoundationAlertTimelineItem | SharedTimelineEntry])[0]
    : null;
  const digestSummary = summarizeTimelineDigest(timelineDigest);
  const latestAt = formatDateTime(metrics?.latestTimestamp ?? metrics?.latestMatchedAt ?? latestTimeline?.timestamp ?? null);
  const filterGroupCount = Array.isArray(filterSummary) ? filterSummary.length : filterSummary ? 1 : 0;

  return (
    <div
      data-testid="foundation-alert-panel-summary-digest-readout"
      style={{
        padding: '12px 16px',
        borderRadius: 8,
        background: resolved.row,
        border: `1px solid ${resolved.border}`,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}
    >
      <div style={{ fontSize: 13, fontWeight: 600, color: resolved.text }}>Summary Digest</div>
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: 12, color: resolved.muted }}>
        {activeFilterCount !== undefined ? (
          <span>
            Active filters: <strong style={{ color: resolved.accent }}>{activeFilterCount}</strong>
          </span>
        ) : null}
        {metrics ? (
          <span>
            Timeline: <strong style={{ color: resolved.text }}>{filteredCount}</strong> / {metrics.total}
          </span>
        ) : null}
        {defaultLatestSource ? <span>Latest source: {defaultLatestSource}</span> : null}
        {filterSummary ? <span>Filter groups: {filterGroupCount}</span> : null}
        {latestAt ? <span>Latest event: {latestAt}</span> : null}
      </div>
      {filterDeepLinkPreview ? <div style={{ fontSize: 12, color: resolved.muted }}>Deep link: {filterDeepLinkPreview}</div> : null}
      {digestSummary ? <div style={{ fontSize: 12, color: resolved.muted, fontStyle: 'italic' }}>{digestSummary}</div> : null}
    </div>
  );
}

interface FoundationAlertPanelTimelineReadoutProps {
  palette?: FoundationAlertPanelReadoutPalette;
  recentTimeline?: Array<FoundationAlertTimelineItem | SharedTimelineEntry>;
  filteredTimeline?: Array<FoundationAlertTimelineItem | SharedTimelineEntry>;
  filterEmptyState?: boolean | string;
}

export function FoundationAlertPanelTimelineReadout({
  palette = defaultPalette,
  recentTimeline = [],
  filteredTimeline,
  filterEmptyState = false,
}: FoundationAlertPanelTimelineReadoutProps) {
  const resolved = resolvePalette(palette);
  const displayItems = getTimelineItems(filteredTimeline ?? recentTimeline);
  const emptyMessage =
    typeof filterEmptyState === 'string'
      ? filterEmptyState
      : filterEmptyState
        ? 'No timeline events match current filters'
        : 'No timeline events';

  return (
    <div data-testid="foundation-alert-panel-timeline-readout" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: resolved.text }}>Timeline ({displayItems.length} items)</div>
      {displayItems.length === 0 ? (
        <div style={{ fontSize: 12, color: resolved.muted, padding: '8px 0' }}>{emptyMessage}</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {displayItems.slice(0, 10).map((item, index) => (
            <div
              key={item.id ?? index}
              style={{
                padding: '6px 10px',
                borderRadius: 6,
                background: index % 2 === 0 ? resolved.row : resolved.rowAlt,
                fontSize: 12,
                color: resolved.text,
                display: 'flex',
                gap: 12,
                alignItems: 'center',
              }}
            >
              {item.source ? <span style={{ color: resolved.accent, minWidth: 80 }}>{item.source}</span> : null}
              <span style={{ flex: 1 }}>{item.message ?? item.note ?? item.action ?? '-'}</span>
              {item.timestamp ? (
                <span style={{ color: resolved.muted, fontSize: 11 }}>{new Date(item.timestamp).toLocaleTimeString()}</span>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export interface FoundationAlertGovernance<
  TAlert extends { code: string } = FoundationAlertGovernanceAlert,
  TTopRisk extends { code: string } = TAlert
> {
  alerts: TAlert[];
  topRisks?: TTopRisk[];
  generatedAt?: string;
  deliveryMode?: string;
}

interface UseFoundationAlertGovernanceStateOptions<
  TGovernance extends FoundationAlertGovernance<{ code: string }, { code: string }>
> {
  initialGovernance?: TGovernance;
  focusAlertCode?: string;
  loadGovernance?: () => Promise<TGovernance>;
}

interface UseFoundationAlertGovernanceStateReturn<
  TGovernance extends FoundationAlertGovernance<{ code: string }, { code: string }>
> {
  governance: TGovernance;
  refreshGovernance: () => Promise<void>;
  selectedAlertCode: string | undefined;
  setSelectedAlertCode: React.Dispatch<React.SetStateAction<string | undefined>>;
}

export function useFoundationAlertGovernanceState<
  TGovernance extends FoundationAlertGovernance<{ code: string }, { code: string }>
>({
  initialGovernance,
  focusAlertCode,
  loadGovernance,
}: UseFoundationAlertGovernanceStateOptions<TGovernance>): UseFoundationAlertGovernanceStateReturn<TGovernance> {
  const [governance, setGovernance] = useState<TGovernance>(
    (initialGovernance ?? { alerts: [], topRisks: [] }) as TGovernance
  );
  const [selectedAlertCode, setSelectedAlertCode] = useState<string | undefined>(focusAlertCode);

  const refreshGovernance = useCallback(async () => {
    if (!loadGovernance) {
      return;
    }

    try {
      const fresh = await loadGovernance();
      setGovernance(fresh);
    } catch {
      // best-effort refresh
    }
  }, [loadGovernance]);

  return { governance, refreshGovernance, selectedAlertCode, setSelectedAlertCode };
}

interface UseFoundationAlertDrilldownQueryOptions<TData> {
  selectedAlertCode?: string;
  loadDrilldown?: (code: string) => Promise<TData>;
  setActionError?: (error: string | null) => void;
}

export function useFoundationAlertDrilldownQuery<TData = unknown>({
  selectedAlertCode,
  loadDrilldown,
  setActionError,
}: UseFoundationAlertDrilldownQueryOptions<TData>): TData | null {
  const [drilldown, setDrilldown] = useState<TData | null>(null);

  useEffect(() => {
    if (!selectedAlertCode || !loadDrilldown) {
      return;
    }

    let cancelled = false;

    loadDrilldown(selectedAlertCode)
      .then((data) => {
        if (!cancelled) {
          setDrilldown(data);
        }
      })
      .catch((err: Error) => {
        if (!cancelled) {
          setActionError?.(err.message);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [selectedAlertCode, loadDrilldown, setActionError]);

  return drilldown;
}

export type FoundationAlertMutationAction = 'ACK' | 'MUTE' | 'UNMUTE';

export interface FoundationAlertMutation {
  acknowledgement?: { status?: string };
  history?: Array<{ action: string; timestamp: string }>;
}

interface UseFoundationAlertMutationControllerOptions {
  selectedAlertCode?: string;
  setActionError?: (error: string | null) => void;
  applyMutation: (mutation: unknown | null) => void;
  refreshGovernance?: () => Promise<void>;
  refreshView?: () => void;
  executeMutation?: (action: FoundationAlertMutationAction, code: string) => Promise<unknown>;
}

interface UseFoundationAlertMutationControllerReturn {
  pendingMutationAction: FoundationAlertMutationAction | null;
  runMutation: (action: FoundationAlertMutationAction, code?: string) => Promise<void>;
}

export function useFoundationAlertMutationController({
  selectedAlertCode,
  setActionError,
  applyMutation,
  refreshGovernance,
  refreshView,
  executeMutation,
}: UseFoundationAlertMutationControllerOptions): UseFoundationAlertMutationControllerReturn {
  const [pendingMutationAction, setPendingMutationAction] = useState<FoundationAlertMutationAction | null>(null);

  const runMutation = useCallback(
    async (action: FoundationAlertMutationAction, code?: string) => {
      const resolvedCode = code ?? selectedAlertCode;
      if (!resolvedCode) {
        setActionError?.('请先选择要操作的告警');
        return;
      }

      setPendingMutationAction(action);
      try {
        if (executeMutation) {
          await executeMutation(action, resolvedCode);
        }
        applyMutation(null);
        await refreshGovernance?.();
        refreshView?.();
      } catch (err) {
        setActionError?.((err as Error)?.message ?? String(err));
      } finally {
        setPendingMutationAction(null);
      }
    },
    [applyMutation, executeMutation, refreshGovernance, refreshView, selectedAlertCode, setActionError]
  );

  return { pendingMutationAction, runMutation };
}

interface UseFoundationAlertTimelineQueryStateOptions<TFilterState extends FoundationAlertFilterState> {
  searchParams?: URLSearchParams;
  pathname?: string;
  replace?: (href: string) => void;
  timelineQueryKey?: string;
  ownerQueryKey?: string;
  sourceQueryKey?: string;
  filterState: TFilterState;
  setFilterState: React.Dispatch<React.SetStateAction<TFilterState>>;
  availableOwners?: string[];
  availableSources?: string[];
}

export interface FilterShortcut {
  key: string;
  label: string;
  helper: string;
  filters: FoundationAlertFilterState;
}

interface UseFoundationAlertTimelineQueryStateReturn {
  applyShortcut: (filters: FoundationAlertFilterState) => void;
  clearAllFilters: () => void;
  clearFilter: (key: keyof FoundationAlertFilterState) => void;
  filterDeepLinkPreview: string | null;
  handleOwnerFilterChange: (owner: string) => void;
  handleSourceFilterChange: (source: string) => void;
  handleTimelineFilterChange: (filter: string) => void;
  activeFilterChips: Array<{ kind: keyof FoundationAlertFilterState; label: string; value: string }>;
  filterEmptyState: boolean;
  filterSummary: FoundationAlertFilterSummaryItem[];
  hasActiveFilters: boolean;
  shortcutPresets: FilterShortcut[];
}

function withAllValue<TFilterState extends FoundationAlertFilterState>(
  current: TFilterState,
  key: keyof TFilterState,
  value: string
) {
  return {
    ...current,
    [key]: value,
  } as TFilterState;
}

export function useFoundationAlertTimelineQueryState<TFilterState extends FoundationAlertFilterState>({
  pathname,
  timelineQueryKey = 'action',
  ownerQueryKey = 'owner',
  sourceQueryKey = 'source',
  filterState,
  setFilterState,
}: UseFoundationAlertTimelineQueryStateOptions<TFilterState>): UseFoundationAlertTimelineQueryStateReturn {
  const activeFilterChips = useMemo(
    () =>
      Object.entries(filterState)
        .filter(([, value]) => value && value !== 'ALL')
        .map(([kind, value]) => ({
          kind: kind as keyof FoundationAlertFilterState,
          label: toSentenceCase(kind),
          value: String(value),
        })),
    [filterState]
  );

  const hasActiveFilters = activeFilterChips.length > 0;
  const filterEmptyState = hasActiveFilters;
  const filterSummary = activeFilterChips.map((chip) => ({
    label: chip.label,
    value: chip.value,
    count: 0,
  }));
  const shortcutPresets: FilterShortcut[] = [];

  const applyShortcut = useCallback(
    (filters: FoundationAlertFilterState) => setFilterState(filters as TFilterState),
    [setFilterState]
  );
  const clearAllFilters = useCallback(
    () =>
      setFilterState((current) => {
        const next = { ...current };
        for (const key of Object.keys(next) as Array<keyof TFilterState>) {
          next[key] = 'ALL' as TFilterState[keyof TFilterState];
        }
        return next;
      }),
    [setFilterState]
  );
  const clearFilter = useCallback(
    (key: keyof FoundationAlertFilterState) =>
      setFilterState((current) => withAllValue(current, key as keyof TFilterState, 'ALL')),
    [setFilterState]
  );
  const handleOwnerFilterChange = useCallback(
    (owner: string) => setFilterState((current) => withAllValue(current, 'owner' as keyof TFilterState, owner)),
    [setFilterState]
  );
  const handleSourceFilterChange = useCallback(
    (source: string) => setFilterState((current) => withAllValue(current, 'source' as keyof TFilterState, source)),
    [setFilterState]
  );
  const handleTimelineFilterChange = useCallback(
    (filter: string) => setFilterState((current) => withAllValue(current, 'action' as keyof TFilterState, filter)),
    [setFilterState]
  );

  const filterDeepLinkPreview = useMemo(() => {
    const params = new URLSearchParams();
    if (filterState.action && filterState.action !== 'ALL') {
      params.set(timelineQueryKey, filterState.action);
    }
    if (filterState.owner && filterState.owner !== 'ALL') {
      params.set(ownerQueryKey, filterState.owner);
    }
    if (filterState.source && filterState.source !== 'ALL') {
      params.set(sourceQueryKey, filterState.source);
    }
    const query = params.toString();
    return query ? `${pathname ?? ''}?${query}` : pathname ?? null;
  }, [filterState.action, filterState.owner, filterState.source, ownerQueryKey, pathname, sourceQueryKey, timelineQueryKey]);

  return {
    applyShortcut,
    clearAllFilters,
    clearFilter,
    filterDeepLinkPreview,
    handleOwnerFilterChange,
    handleSourceFilterChange,
    handleTimelineFilterChange,
    activeFilterChips,
    filterEmptyState,
    filterSummary,
    hasActiveFilters,
    shortcutPresets,
  };
}

interface UseFoundationAlertViewLinkControllerReturn {
  copiedViewMessage: string | null;
  copyCurrentViewLink: () => Promise<void>;
}

export function useFoundationAlertViewLinkController(): UseFoundationAlertViewLinkControllerReturn {
  const [copiedViewMessage, setCopiedViewMessage] = useState<string | null>(null);

  const copyCurrentViewLink = useCallback(async () => {
    try {
      const url = typeof window !== 'undefined' ? window.location.href : '';
      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
      }
      setCopiedViewMessage('View link copied');
      setTimeout(() => setCopiedViewMessage(null), 2000);
    } catch {
      setCopiedViewMessage('Failed to copy');
      setTimeout(() => setCopiedViewMessage(null), 2000);
    }
  }, []);

  return { copiedViewMessage, copyCurrentViewLink };
}

interface UseFoundationAlertFocusSyncOptions {
  selectedAlertCode?: string;
  focusAlertCode?: string;
  focusContext?: string;
  onFocusChange?: (code: string, context: string) => void;
}

export function useFoundationAlertFocusSync({
  selectedAlertCode,
  focusAlertCode,
  focusContext,
  onFocusChange,
}: UseFoundationAlertFocusSyncOptions): void {
  useEffect(() => {
    if (selectedAlertCode && selectedAlertCode !== focusAlertCode) {
      onFocusChange?.(selectedAlertCode, focusContext ?? '');
    }
  }, [focusAlertCode, focusContext, onFocusChange, selectedAlertCode]);
}
