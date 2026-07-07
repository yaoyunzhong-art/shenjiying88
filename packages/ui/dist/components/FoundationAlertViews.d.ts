import React from 'react';
import { type FoundationAlertCatalogItem, type FoundationAlertDrilldownResponse, type FoundationOperationsAlert } from '@m5/types';
import { type DataTableColumn } from './DataTable';
import { type DataTableSortConfig } from './LinkedOverviewStubs';
export interface FoundationAlertRecord {
    id: string;
    title: string;
    severity: string;
    source: string;
    status: string;
    createdAt: string;
    description?: string;
    owner?: string;
    updatedAt?: string;
}
interface FoundationAlertDetailSection {
    title: string;
    content: React.ReactNode;
}
export interface FoundationAlertDetailLabels {
    overviewTitle?: string;
    detailsTitle?: string;
    severity?: string;
    status?: string;
    source?: string;
    owner?: string;
    description?: string;
    createdAt?: string;
    updatedAt?: string;
    unassignedOwner?: string;
    noDescription?: string;
}
type SeverityVariant = 'info' | 'warning' | 'error' | 'success';
type StatusVariant = 'default' | 'warning' | 'success';
export interface FoundationAlertSeverityMeta {
    label: string;
    variant: SeverityVariant;
}
export interface FoundationAlertStatusMeta {
    label: string;
    variant: StatusVariant;
}
export declare const foundationAlertSeverityLabels: Record<string, FoundationAlertSeverityMeta>;
export declare const foundationAlertStatusLabels: Record<string, FoundationAlertStatusMeta>;
export interface CreateFoundationAlertMockRecordsOptions {
    count?: number;
    idPrefix?: string;
    titles: readonly string[];
    severityOrder: readonly string[];
    statusOrder: readonly string[];
    sourceOrder: readonly string[];
    createdAtStepMs?: number;
    acknowledgedAtStepMs?: number;
    resolvedAtStepMs?: number;
}
interface FoundationAlertDemoListPageProps {
    title: string;
    description?: string;
    preset: FoundationAlertListPreset;
    count?: number;
    detailHrefBase?: string;
    recordOptions?: Partial<Omit<CreateFoundationAlertMockRecordsOptions, 'count' | 'titles' | 'severityOrder' | 'statusOrder' | 'sourceOrder'>>;
    mapRecords?: (records: FoundationAlertRecord[]) => FoundationAlertRecord[];
    acknowledgeOptions?: UseFoundationAlertDemoAcknowledgeOptions;
}
export declare function createFoundationAlertMockRecords({ count, idPrefix, titles, severityOrder, statusOrder, sourceOrder, createdAtStepMs, acknowledgedAtStepMs, resolvedAtStepMs, }: CreateFoundationAlertMockRecordsOptions): FoundationAlertRecord[];
export declare function FoundationAlertDemoListPage({ title, description, preset, count, detailHrefBase, recordOptions, mapRecords, acknowledgeOptions, }: FoundationAlertDemoListPageProps): React.JSX.Element;
export declare function createFoundationAlertDetailMockMap(alerts: FoundationAlertRecord[]): Record<string, FoundationAlertRecord>;
export declare const foundationAlertDetailDemoPresets: {
    admin: Record<string, FoundationAlertRecord>;
    storefront: Record<string, FoundationAlertRecord>;
    tob: Record<string, FoundationAlertRecord>;
};
export interface FoundationAlertListPreset {
    titles: readonly string[];
    severityOrder: readonly string[];
    statusOrder: readonly string[];
    sourceOrder: readonly string[];
    searchFields?: Array<keyof FoundationAlertRecord | string>;
    severityMetaByCode?: Record<string, FoundationAlertSeverityMeta>;
    statusMetaByCode?: Record<string, FoundationAlertStatusMeta>;
    sourceLabels?: Record<string, string>;
    labels?: FoundationAlertListLabels;
    statsCopy?: FoundationAlertListStatsCopy;
    emptyTitle?: string;
    emptyDescription?: string;
    columnLabels?: FoundationAlertTableColumnLabels;
    showSourceFilter?: boolean;
    defaultPageSize?: number;
    pageSizeOptions?: number[];
    includeColumns?: FoundationAlertTableColumnKey[];
    omitColumns?: FoundationAlertTableColumnKey[];
    detailLabels?: FoundationAlertDetailLabels;
}
interface FoundationGovernanceAlertReadModelLike {
    generatedAt: string;
    alerts: FoundationAlertCatalogItem[];
    overviewAlerts: Array<Pick<FoundationOperationsAlert, 'code' | 'severity'>>;
}
interface MapFoundationGovernanceAlertsToRecordsOptions {
    sourceMap?: Record<string, string>;
    sourceFallback?: string;
    defaultSeverity?: string;
    mutedStatus?: string;
}
export declare const foundationAdminGovernanceSourceLabels: {
    approval: string;
    audit: string;
    security: string;
    runtime: string;
    recovery: string;
    observability: string;
    resilience: string;
    identity: string;
    integration: string;
    trust: string;
    configuration: string;
};
export declare const foundationAdminGovernanceSourceMap: {
    'governance-approval': string;
    'trust-governance': string;
    'resilience-operations': string;
    'identity-access': string;
    'configuration-governance': string;
    'integration-orchestration': string;
    'runtime-governance': string;
};
export declare function mapFoundationGovernanceAlertsToRecords(governance: FoundationGovernanceAlertReadModelLike, options?: MapFoundationGovernanceAlertsToRecordsOptions): FoundationAlertRecord[];
export declare const foundationAlertListDemoPresets: {
    admin: {
        titles: string[];
        severityOrder: string[];
        statusOrder: string[];
        sourceOrder: string[];
        searchFields: string[];
        severityMetaByCode: {
            critical: {
                label: string;
                variant: "error";
            };
            error: {
                label: string;
                variant: "error";
            };
            warning: {
                label: string;
                variant: "warning";
            };
            info: {
                label: string;
                variant: "info";
            };
        };
        statusMetaByCode: {
            open: {
                label: string;
                variant: "default";
            };
            acknowledged: {
                label: string;
                variant: "warning";
            };
            resolved: {
                label: string;
                variant: "success";
            };
        };
        sourceLabels: {
            approval: string;
            audit: string;
            security: string;
            runtime: string;
            recovery: string;
            observability: string;
        };
        labels: {
            all: string;
            searchPlaceholder: string;
            statusSectionTitle: string;
            sourceSectionTitle: string;
            tableTitle: (matched: number) => string;
        };
        statsCopy: {
            totalLabel: string;
            totalHint: (matched: number) => string;
            openLabel: string;
            openHint: string;
            criticalLabel: string;
            criticalHint: string;
            sourceLabel: string;
            sourceHint: string;
        };
        emptyTitle: string;
        emptyDescription: string;
        columnLabels: {
            severity: string;
            title: string;
            source: string;
            status: string;
            createdAt: string;
            actions: string;
        };
        showSourceFilter: true;
        defaultPageSize: number;
        pageSizeOptions: number[];
        detailLabels: {
            overviewTitle: string;
            detailsTitle: string;
            severity: string;
            status: string;
            source: string;
            owner: string;
            description: string;
            createdAt: string;
            updatedAt: string;
            unassignedOwner: string;
            noDescription: string;
        };
    };
    storefront: {
        titles: string[];
        severityOrder: string[];
        statusOrder: string[];
        sourceOrder: string[];
        searchFields: string[];
        severityMetaByCode: {
            error: {
                label: string;
                variant: "error";
            };
            warning: {
                label: string;
                variant: "warning";
            };
            info: {
                label: string;
                variant: "info";
            };
        };
        statusMetaByCode: {
            open: {
                label: string;
                variant: "default";
            };
            acknowledged: {
                label: string;
                variant: "warning";
            };
            resolved: {
                label: string;
                variant: "success";
            };
        };
        sourceLabels: {
            monitoring: string;
            logging: string;
            tracing: string;
            security: string;
            infrastructure: string;
        };
        labels: {
            all: string;
            searchPlaceholder: string;
            statusSectionTitle: string;
            tableTitle: (matched: number) => string;
        };
        statsCopy: {
            totalLabel: string;
            totalHint: (matched: number) => string;
            openLabel: string;
            openHint: string;
            criticalLabel: string;
            criticalHint: string;
            sourceLabel: string;
            sourceHint: string;
        };
        emptyTitle: string;
        emptyDescription: string;
        columnLabels: {
            severity: string;
            title: string;
            source: string;
            status: string;
            createdAt: string;
            actions: string;
        };
        showSourceFilter: false;
        defaultPageSize: number;
        pageSizeOptions: number[];
        includeColumns: ("title" | "status" | "severity" | "createdAt")[];
        detailLabels: {
            overviewTitle: string;
            detailsTitle: string;
            severity: string;
            status: string;
            source: string;
            owner: string;
            description: string;
            createdAt: string;
            updatedAt: string;
            unassignedOwner: string;
            noDescription: string;
        };
    };
    tob: {
        titles: string[];
        severityOrder: string[];
        statusOrder: string[];
        sourceOrder: string[];
        searchFields: string[];
        severityMetaByCode: {
            critical: {
                label: string;
                variant: "error";
            };
            error: {
                label: string;
                variant: "error";
            };
            warning: {
                label: string;
                variant: "warning";
            };
            info: {
                label: string;
                variant: "info";
            };
        };
        statusMetaByCode: {
            open: {
                label: string;
                variant: "default";
            };
            acknowledged: {
                label: string;
                variant: "warning";
            };
            resolved: {
                label: string;
                variant: "success";
            };
        };
        sourceLabels: {
            monitoring: string;
            logging: string;
            tracing: string;
            security: string;
            infrastructure: string;
        };
        labels: {
            all: string;
            searchPlaceholder: string;
            statusSectionTitle: string;
            sourceSectionTitle: string;
            tableTitle: (matched: number) => string;
        };
        statsCopy: {
            totalLabel: string;
            totalHint: (matched: number) => string;
            openLabel: string;
            openHint: string;
            criticalLabel: string;
            criticalHint: string;
            sourceLabel: string;
            sourceHint: string;
        };
        emptyTitle: string;
        emptyDescription: string;
        columnLabels: {
            severity: string;
            title: string;
            source: string;
            status: string;
            createdAt: string;
        };
        showSourceFilter: true;
        defaultPageSize: number;
        pageSizeOptions: number[];
        detailLabels: {
            overviewTitle: string;
            detailsTitle: string;
            severity: string;
            status: string;
            source: string;
            owner: string;
            description: string;
            createdAt: string;
            updatedAt: string;
            unassignedOwner: string;
            noDescription: string;
        };
    };
};
export declare function createFoundationAdminGovernanceStatsCopy(deliveryMode: 'api' | 'fallback'): FoundationAlertListStatsCopy;
export declare const foundationAdminGovernanceListPreset: FoundationAlertListPreset;
interface FoundationAlertTableColumnLabels {
    severity?: string;
    title?: string;
    source?: string;
    status?: string;
    createdAt?: string;
    actions?: string;
}
type FoundationAlertTableColumnKey = 'severity' | 'title' | 'source' | 'status' | 'createdAt' | 'actions';
interface CreateFoundationAlertTableColumnsOptions {
    detailHrefBase?: string;
    renderAction?: (alert: FoundationAlertRecord) => React.ReactNode;
    severityMetaByCode?: Record<string, FoundationAlertSeverityMeta>;
    statusMetaByCode?: Record<string, FoundationAlertStatusMeta>;
    sourceLabels?: Record<string, string>;
    columnLabels?: FoundationAlertTableColumnLabels;
    includeColumns?: FoundationAlertTableColumnKey[];
    omitColumns?: FoundationAlertTableColumnKey[];
}
interface FoundationAlertTableCardProps {
    alerts: FoundationAlertRecord[];
    detailHrefBase?: string;
    loading?: boolean;
    title?: React.ReactNode;
    sort?: DataTableSortConfig | null;
    onSortChange?: React.Dispatch<React.SetStateAction<DataTableSortConfig | null>>;
    striped?: boolean;
    compact?: boolean;
    renderAction?: (alert: FoundationAlertRecord) => React.ReactNode;
    emptyTitle?: string;
    emptyDescription?: string;
    severityMetaByCode?: Record<string, FoundationAlertSeverityMeta>;
    statusMetaByCode?: Record<string, FoundationAlertStatusMeta>;
    sourceLabels?: Record<string, string>;
    columnLabels?: FoundationAlertTableColumnLabels;
    includeColumns?: FoundationAlertTableColumnKey[];
    omitColumns?: FoundationAlertTableColumnKey[];
    pagination?: {
        page: number;
        totalPages: number;
        total: number;
        onPageChange: (page: number) => void;
    };
}
export declare function FoundationAlertTableCard({ alerts, detailHrefBase, loading, title, sort, onSortChange, striped, compact, renderAction, emptyTitle, emptyDescription, severityMetaByCode, statusMetaByCode, sourceLabels, columnLabels, includeColumns, omitColumns, pagination, }: FoundationAlertTableCardProps): React.JSX.Element;
export declare function createFoundationAlertTableColumns({ detailHrefBase, renderAction, severityMetaByCode, statusMetaByCode, sourceLabels, columnLabels, includeColumns, omitColumns, }?: CreateFoundationAlertTableColumnsOptions): DataTableColumn<FoundationAlertRecord>[];
interface FoundationAlertDetailViewProps {
    alert?: FoundationAlertRecord | null;
    preset?: FoundationAlertListPreset;
    backHref?: string;
    backLabel?: string;
    notFoundTitle?: string;
    notFoundMessage?: string;
    subtitle?: string;
    extraSections?: FoundationAlertDetailSection[];
    severityMetaByCode?: Record<string, FoundationAlertSeverityMeta>;
    statusMetaByCode?: Record<string, FoundationAlertStatusMeta>;
    sourceLabels?: Record<string, string>;
    detailLabels?: FoundationAlertDetailLabels;
    formatDateTime?: (value: string) => string;
}
interface FoundationAlertPresetDetailRouteProps {
    alertId: string;
    alerts: Record<string, FoundationAlertRecord>;
    preset?: FoundationAlertListPreset;
    backHref?: string;
    backLabel?: string;
    notFoundTitle?: string;
    notFoundMessage?: string | ((alertId: string) => string);
    severityMetaByCode?: Record<string, FoundationAlertSeverityMeta>;
    statusMetaByCode?: Record<string, FoundationAlertStatusMeta>;
    sourceLabels?: Record<string, string>;
    detailLabels?: FoundationAlertDetailLabels;
    formatDateTime?: (value: string) => string;
}
interface FoundationAlertOverviewReadoutProps {
    alert: FoundationAlertRecord;
    detailLabels?: FoundationAlertDetailLabels;
    severityMetaByCode?: Record<string, FoundationAlertSeverityMeta>;
    statusMetaByCode?: Record<string, FoundationAlertStatusMeta>;
    sourceLabels?: Record<string, string>;
}
interface FoundationAlertDetailsReadoutProps {
    alert: FoundationAlertRecord;
    detailLabels?: FoundationAlertDetailLabels;
    formatDateTime?: (value: string) => string;
}
export interface FoundationAlertDrilldownSectionLabels {
    governanceTitle?: string;
    timelineTitle?: string;
    overviewVisibility?: string;
    overviewVisible?: string;
    overviewHidden?: string;
    acknowledgementStatus?: string;
    acknowledgementPending?: string;
    acknowledgementAcked?: string;
    acknowledgementMuted?: string;
    recentActor?: string;
    recentUpdatedAt?: string;
    availableActions?: string;
    noAvailableActions?: string;
    actionDrilldown?: string;
    actionAcknowledge?: string;
    actionMute?: string;
    actionUnmute?: string;
    systemActor?: string;
    timelineNoHistory?: string;
    actor?: string;
    source?: string;
    mutedUntil?: string;
    note?: string;
    noNote?: string;
    noTimestamp?: string;
}
interface BuildFoundationAlertDrilldownSectionsOptions {
    labels?: FoundationAlertDrilldownSectionLabels;
    formatDateTime?: (value?: string | null) => string;
}
export declare function formatFoundationAlertDrilldownDateTime(value?: string | null): string;
export declare function formatFoundationAlertActionLabel(action: string, labels?: FoundationAlertDrilldownSectionLabels): string;
export declare function buildFoundationAlertRecordFromDrilldown(drilldown: FoundationAlertDrilldownResponse): FoundationAlertRecord;
export declare function buildFoundationAlertDrilldownSections(drilldown: FoundationAlertDrilldownResponse, options?: BuildFoundationAlertDrilldownSectionsOptions): FoundationAlertDetailSection[];
export declare function buildFoundationAlertLytConnectionGovernanceSections(drilldown: FoundationAlertDrilldownResponse): FoundationAlertDetailSection[];
export declare function FoundationAlertOverviewReadout({ alert, detailLabels, severityMetaByCode, statusMetaByCode, sourceLabels, }: FoundationAlertOverviewReadoutProps): React.JSX.Element;
export declare function FoundationAlertDetailsReadout({ alert, detailLabels, formatDateTime, }: FoundationAlertDetailsReadoutProps): React.JSX.Element;
export declare function FoundationAlertDetailView({ alert, preset, backHref, backLabel, notFoundTitle, notFoundMessage, subtitle, extraSections, severityMetaByCode, statusMetaByCode, sourceLabels, detailLabels, formatDateTime, }: FoundationAlertDetailViewProps): React.JSX.Element;
export declare function FoundationAlertPresetDetailRoute({ alertId, alerts, preset, backHref, backLabel, notFoundTitle, notFoundMessage, severityMetaByCode, statusMetaByCode, sourceLabels, detailLabels, formatDateTime, }: FoundationAlertPresetDetailRouteProps): React.JSX.Element;
export interface FoundationAlertListFeedback {
    type: 'error' | 'success';
    message: string;
}
interface FoundationAlertDemoAcknowledgeCopy {
    actionLabel?: string;
    successMessage?: (alertId: string) => string;
    errorMessage?: (alertId: string) => string;
}
interface UseFoundationAlertDemoAcknowledgeOptions {
    delayMs?: number;
    copy?: FoundationAlertDemoAcknowledgeCopy;
}
interface FoundationAlertAcknowledgeActionButtonProps {
    alert: FoundationAlertRecord;
    loading?: boolean;
    onAcknowledge: (alertId: string) => Promise<void> | void;
    label?: string;
}
export declare function useFoundationAlertDemoAcknowledge({ delayMs, copy, }?: UseFoundationAlertDemoAcknowledgeOptions): {
    loading: boolean;
    feedback: FoundationAlertListFeedback | null;
    acknowledge: (alertId: string) => Promise<void>;
    dismissFeedback: () => void;
    actionLabel: string;
};
export declare function FoundationAlertAcknowledgeActionButton({ alert, loading, onAcknowledge, label, }: FoundationAlertAcknowledgeActionButtonProps): React.JSX.Element | null;
interface FoundationAlertListStatsCopy {
    totalLabel?: string;
    totalHint?: (matched: number) => string;
    openLabel?: string;
    openHint?: string;
    criticalLabel?: string;
    criticalHint?: string;
    sourceLabel?: string;
    sourceHint?: string;
}
interface FoundationAlertListLabels {
    all?: string;
    searchPlaceholder?: string;
    statusSectionTitle?: string;
    sourceSectionTitle?: string;
    tableTitle?: (matched: number) => React.ReactNode;
}
interface FoundationAlertListPageSectionProps {
    title: string;
    description?: string;
    alerts: FoundationAlertRecord[];
    preset?: FoundationAlertListPreset;
    detailHrefBase?: string;
    searchFields?: Array<keyof FoundationAlertRecord | string>;
    severityOrder?: string[];
    statusOrder?: string[];
    sourceOrder?: string[];
    severityMetaByCode?: Record<string, FoundationAlertSeverityMeta>;
    statusMetaByCode?: Record<string, FoundationAlertStatusMeta>;
    sourceLabels?: Record<string, string>;
    labels?: FoundationAlertListLabels;
    statsCopy?: FoundationAlertListStatsCopy;
    showSourceFilter?: boolean;
    renderAction?: (alert: FoundationAlertRecord) => React.ReactNode;
    feedback?: FoundationAlertListFeedback | null;
    onDismissFeedback?: () => void;
    emptyTitle?: string;
    emptyDescription?: string;
    defaultPageSize?: number;
    pageSizeOptions?: number[];
    columnLabels?: FoundationAlertTableColumnLabels;
    includeColumns?: FoundationAlertTableColumnKey[];
    omitColumns?: FoundationAlertTableColumnKey[];
}
export declare function FoundationAlertListPageSection({ title, description, alerts, preset, detailHrefBase, searchFields, severityOrder, statusOrder, sourceOrder, severityMetaByCode, statusMetaByCode, sourceLabels, labels, statsCopy, showSourceFilter, renderAction, feedback, onDismissFeedback, emptyTitle, emptyDescription, defaultPageSize, pageSizeOptions, columnLabels, includeColumns, omitColumns, }: FoundationAlertListPageSectionProps): React.JSX.Element;
export {};
