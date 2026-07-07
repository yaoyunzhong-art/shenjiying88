import React from 'react';
import type { FoundationAlertRuntimeCallbackStalledDetail, FoundationAlertTimelineDigest as SharedTimelineDigest, FoundationAlertTimelineEntry as SharedTimelineEntry, FoundationAlertTimelineMetrics as SharedTimelineMetrics } from '@m5/types';
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
export declare function createFoundationAlertPanelSectionStyle(palette?: FoundationAlertPanelReadoutPalette): React.CSSProperties;
export declare function createFoundationAlertPanelSelectionButtonStyle(palette?: FoundationAlertPanelReadoutPalette, selected?: boolean, _variant?: 'quick' | 'default'): React.CSSProperties;
export declare function createFoundationAlertPanelActionButtonStyle(bg: string): React.CSSProperties;
export declare function createFoundationAlertPanelFeedbackStyle(palette?: FoundationAlertPanelReadoutPalette): React.CSSProperties;
export declare function createFoundationAlertPanelFilterButtonStyle(palette?: FoundationAlertPanelReadoutPalette, selected?: boolean): React.CSSProperties;
export declare function createFoundationAlertPanelFilterChipStyle(palette?: FoundationAlertPanelReadoutPalette): React.CSSProperties;
export declare function createFoundationAlertPanelSummaryCardStyle(palette?: FoundationAlertPanelReadoutPalette): React.CSSProperties;
export declare function createFoundationAlertPanelShortcutCardStyle(palette: FoundationAlertPanelReadoutPalette | undefined, baseStyle: React.CSSProperties, active?: boolean): React.CSSProperties;
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
export declare function FoundationAlertPanelSelectedAlertReadout({ palette, selectedAlert, currentOwner, optimisticOverviewVisibility, currentNote, recentTimeline, runtimeCallbackDrilldown, }: FoundationAlertPanelSelectedAlertReadoutProps): React.JSX.Element;
interface FoundationAlertPanelSourceSummaryReadoutProps {
    palette?: FoundationAlertPanelReadoutPalette;
    items?: FoundationAlertSourceSummaryItem[];
}
export declare function FoundationAlertPanelSourceSummaryReadout({ palette, items, }: FoundationAlertPanelSourceSummaryReadoutProps): React.JSX.Element;
interface FoundationAlertPanelOwnerSummaryReadoutProps {
    palette?: FoundationAlertPanelReadoutPalette;
    items?: FoundationAlertOwnerSummaryItem[];
}
export declare function FoundationAlertPanelOwnerSummaryReadout({ palette, items, }: FoundationAlertPanelOwnerSummaryReadoutProps): React.JSX.Element;
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
export declare function FoundationAlertPanelSummaryDigestReadout({ palette, filterSummary, filterDeepLinkPreview, activeFilterCount, timelineMetrics, latestMatchedTimeline, defaultLatestSource, timelineDigest, }: FoundationAlertPanelSummaryDigestReadoutProps): React.JSX.Element;
interface FoundationAlertPanelTimelineReadoutProps {
    palette?: FoundationAlertPanelReadoutPalette;
    recentTimeline?: Array<FoundationAlertTimelineItem | SharedTimelineEntry>;
    filteredTimeline?: Array<FoundationAlertTimelineItem | SharedTimelineEntry>;
    filterEmptyState?: boolean | string;
}
export declare function FoundationAlertPanelTimelineReadout({ palette, recentTimeline, filteredTimeline, filterEmptyState, }: FoundationAlertPanelTimelineReadoutProps): React.JSX.Element;
export interface FoundationAlertGovernance<TAlert extends {
    code: string;
} = FoundationAlertGovernanceAlert, TTopRisk extends {
    code: string;
} = TAlert> {
    alerts: TAlert[];
    topRisks?: TTopRisk[];
    generatedAt?: string;
    deliveryMode?: string;
}
interface UseFoundationAlertGovernanceStateOptions<TGovernance extends FoundationAlertGovernance<{
    code: string;
}, {
    code: string;
}>> {
    initialGovernance?: TGovernance;
    focusAlertCode?: string;
    loadGovernance?: () => Promise<TGovernance>;
}
interface UseFoundationAlertGovernanceStateReturn<TGovernance extends FoundationAlertGovernance<{
    code: string;
}, {
    code: string;
}>> {
    governance: TGovernance;
    refreshGovernance: () => Promise<void>;
    selectedAlertCode: string | undefined;
    setSelectedAlertCode: React.Dispatch<React.SetStateAction<string | undefined>>;
}
export declare function useFoundationAlertGovernanceState<TGovernance extends FoundationAlertGovernance<{
    code: string;
}, {
    code: string;
}>>({ initialGovernance, focusAlertCode, loadGovernance, }: UseFoundationAlertGovernanceStateOptions<TGovernance>): UseFoundationAlertGovernanceStateReturn<TGovernance>;
interface UseFoundationAlertDrilldownQueryOptions<TData> {
    selectedAlertCode?: string;
    loadDrilldown?: (code: string) => Promise<TData>;
    setActionError?: (error: string | null) => void;
}
export declare function useFoundationAlertDrilldownQuery<TData = unknown>({ selectedAlertCode, loadDrilldown, setActionError, }: UseFoundationAlertDrilldownQueryOptions<TData>): TData | null;
export type FoundationAlertMutationAction = 'ACK' | 'MUTE' | 'UNMUTE';
export interface FoundationAlertMutation {
    acknowledgement?: {
        status?: string;
    };
    history?: Array<{
        action: string;
        timestamp: string;
    }>;
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
export declare function useFoundationAlertMutationController({ selectedAlertCode, setActionError, applyMutation, refreshGovernance, refreshView, executeMutation, }: UseFoundationAlertMutationControllerOptions): UseFoundationAlertMutationControllerReturn;
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
    activeFilterChips: Array<{
        kind: keyof FoundationAlertFilterState;
        label: string;
        value: string;
    }>;
    filterEmptyState: boolean;
    filterSummary: FoundationAlertFilterSummaryItem[];
    hasActiveFilters: boolean;
    shortcutPresets: FilterShortcut[];
}
export declare function useFoundationAlertTimelineQueryState<TFilterState extends FoundationAlertFilterState>({ pathname, timelineQueryKey, ownerQueryKey, sourceQueryKey, filterState, setFilterState, }: UseFoundationAlertTimelineQueryStateOptions<TFilterState>): UseFoundationAlertTimelineQueryStateReturn;
interface UseFoundationAlertViewLinkControllerReturn {
    copiedViewMessage: string | null;
    copyCurrentViewLink: () => Promise<void>;
}
export declare function useFoundationAlertViewLinkController(): UseFoundationAlertViewLinkControllerReturn;
interface UseFoundationAlertFocusSyncOptions {
    selectedAlertCode?: string;
    focusAlertCode?: string;
    focusContext?: string;
    onFocusChange?: (code: string, context: string) => void;
}
export declare function useFoundationAlertFocusSync({ selectedAlertCode, focusAlertCode, focusContext, onFocusChange, }: UseFoundationAlertFocusSyncOptions): void;
export {};
