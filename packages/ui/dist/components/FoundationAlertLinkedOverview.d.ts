import React from 'react';
import { type FoundationAlertCode, type FoundationAlertTimelineEntry } from '@m5/types';
interface FoundationAlertAcknowledgementLike {
    actorId?: string | null;
}
interface FoundationAlertItemLike {
    code: FoundationAlertCode;
    triageSummary?: string;
    triageState?: string;
    recentOperation?: FoundationAlertTimelineEntry | null;
    defaultSummary?: string;
}
interface FoundationAlertTopRiskItemLike extends FoundationAlertItemLike {
    summary: string;
    count: number;
    acknowledgement?: FoundationAlertAcknowledgementLike | null;
}
interface FoundationAlertGovernanceReadModelLike {
    topRisks: FoundationAlertTopRiskItemLike[];
    overviewAlerts: FoundationAlertItemLike[];
    alerts: FoundationAlertItemLike[];
}
interface NavigationBindingsLike {
    searchParams: unknown;
    pathname: string;
    replace: (...args: unknown[]) => void;
}
export interface FoundationAlertLinkedOverviewCardDefinition {
    label: string;
    value: string;
    helper: string;
    preferredCodes: FoundationAlertCode[];
}
export interface FoundationAlertLinkedOverviewSummaryLike {
    approvalsPending: number;
    approvalsWithFailures: number;
    highRiskAudits: number;
    blockedLedgers: number;
    rotationDueSecrets: number;
    expiredSecrets: number;
    expiringCertificates: number;
    expiredCertificates: number;
    degradedSignals: number;
    attentionRecoveryPlans: number;
    staleDrills: number;
}
export type FoundationAlertLinkedOverviewStatsPreset = 'admin' | 'tob' | 'storefront';
export interface FoundationAlertLinkedOverviewPalette {
    accentText: string;
    focusBannerBackground: string;
    focusBannerBorder: string;
    actionButtonBorder: string;
    actionButtonBackground: string;
    actionButtonText: string;
    overviewActiveBorder: string;
    overviewActiveBackground: string;
    riskCardBorder: string;
    riskCardBackground: string;
    riskActiveBorder: string;
    riskActiveBackground: string;
    catalogActiveBorder: string;
    catalogActiveBackground: string;
}
interface SearchConfig {
    enabled?: boolean;
    placeholder?: string;
    statusColor?: string;
}
export interface FoundationAlertLinkedOverviewPanelRenderArgs {
    focusAlertCode: string;
    focusContext: string;
    timelineQueryKey: string;
    ownerQueryKey: string;
    onFocusChange: (code: string, context: string) => void;
}
export interface FoundationAlertLinkedOverviewSectionProps {
    governance: FoundationAlertGovernanceReadModelLike;
    navigationBindings: NavigationBindingsLike;
    palette: FoundationAlertLinkedOverviewPalette;
    overviewStats: FoundationAlertLinkedOverviewCardDefinition[];
    focusQueryKey?: string;
    title?: string;
    description?: string;
    sectionStyle?: React.CSSProperties;
    titleStyle?: React.CSSProperties;
    descriptionStyle?: React.CSSProperties;
    defaultFocusContextPrefix?: string;
    search?: SearchConfig;
    topRisksTitle?: string;
    catalogTitle?: string;
    topRisksEmptyText?: string;
    catalogEmptyText?: string;
    emptyShareStatus?: string;
    buildTopRiskMetaLines?: (item: FoundationAlertTopRiskItemLike) => string[];
    buildCatalogMetaLines?: (item: FoundationAlertItemLike) => string[];
    renderPanel: (args: FoundationAlertLinkedOverviewPanelRenderArgs) => React.ReactNode;
}
export interface FoundationAlertLinkedOverviewSurfaceProps extends Omit<FoundationAlertLinkedOverviewSectionProps, 'navigationBindings'> {
    router?: unknown;
    pathname?: string;
    searchParams?: unknown;
}
export declare function FoundationAlertLinkedOverviewSection({ governance, navigationBindings, palette, overviewStats, focusQueryKey, title, description, sectionStyle, titleStyle, descriptionStyle, defaultFocusContextPrefix, search, topRisksTitle, catalogTitle, topRisksEmptyText, catalogEmptyText, emptyShareStatus, buildTopRiskMetaLines, buildCatalogMetaLines, renderPanel, }: FoundationAlertLinkedOverviewSectionProps): React.JSX.Element;
export declare function FoundationAlertLinkedOverviewSurface({ router, pathname, searchParams, ...props }: FoundationAlertLinkedOverviewSurfaceProps): React.JSX.Element;
export declare function createFoundationAlertLinkedOverviewStats(preset: FoundationAlertLinkedOverviewStatsPreset, summary: FoundationAlertLinkedOverviewSummaryLike, topRiskCount?: number): FoundationAlertLinkedOverviewCardDefinition[];
export {};
