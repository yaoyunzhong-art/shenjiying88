import React from 'react';
import { type DataTableColumn } from './DataTable';
import { type DataTableSortConfig } from './LinkedOverviewStubs';
export interface RuntimeOperationRecord {
    id: string;
    type: string;
    targetId: string;
    status: string;
    createdAt: string;
    finishedAt?: string;
}
export interface RuntimeOperationReceiptRecord {
    code: string;
    message: string;
    status: string;
    timestamp: string;
}
export declare const runtimeOperationStatusVariants: Record<string, 'default' | 'warning' | 'success' | 'error'>;
export declare const runtimeOperationStatusLabels: Record<string, string>;
export interface CreateRuntimeOperationMockRecordsOptions {
    count?: number;
    idPrefix?: string;
    typeOrder: readonly string[];
    statusOrder: readonly string[];
    targetPrefix?: string;
    targetModulo?: number;
    createdAtStepMs?: number;
    finishedAtStepMs?: number;
}
export declare function createRuntimeOperationMockRecords({ count, idPrefix, typeOrder, statusOrder, targetPrefix, targetModulo, createdAtStepMs, finishedAtStepMs, }: CreateRuntimeOperationMockRecordsOptions): RuntimeOperationRecord[];
export interface RuntimeOperationDetailMockEntry {
    operation: RuntimeOperationRecord;
    receipts?: RuntimeOperationReceiptRecord[];
}
export declare function createRuntimeOperationDetailMockMap(entries: RuntimeOperationDetailMockEntry[]): Record<string, {
    op: RuntimeOperationRecord;
    receipts: RuntimeOperationReceiptRecord[];
}>;
export declare const runtimeOperationDetailDemoPresets: {
    storefront: Record<string, {
        op: RuntimeOperationRecord;
        receipts: RuntimeOperationReceiptRecord[];
    }>;
    tob: Record<string, {
        op: RuntimeOperationRecord;
        receipts: RuntimeOperationReceiptRecord[];
    }>;
    admin: Record<string, {
        op: RuntimeOperationRecord;
        receipts: RuntimeOperationReceiptRecord[];
    }>;
};
export interface RuntimeOperationListPreset {
    typeOrder: readonly string[];
    statusOrder: readonly string[];
    searchFields?: Array<keyof RuntimeOperationRecord | string>;
    typeLabels?: Record<string, string>;
    statusLabels?: Record<string, string>;
    labels?: RuntimeOperationListLabels;
    statsCopy?: RuntimeOperationListStatsCopy;
    emptyTitle?: string;
    emptyDescription?: string;
    columnLabels?: RuntimeOperationTableColumnLabels;
    includeColumns?: RuntimeOperationTableColumnKey[];
    omitColumns?: RuntimeOperationTableColumnKey[];
    defaultPageSize?: number;
    pageSizeOptions?: number[];
    detailLabels?: RuntimeOperationDetailLabels;
}
interface RuntimeOperationDemoListPageProps {
    title: string;
    description?: string;
    preset: RuntimeOperationListPreset;
    count?: number;
    detailHrefBase?: string;
    recordOptions?: Omit<CreateRuntimeOperationMockRecordsOptions, 'typeOrder' | 'statusOrder' | 'count'>;
    mapRecords?: (records: RuntimeOperationRecord[]) => RuntimeOperationRecord[];
}
export declare const runtimeOperationListDemoPresets: {
    storefront: {
        typeOrder: string[];
        statusOrder: string[];
        searchFields: string[];
        typeLabels: {
            deploy: string;
            rollback: string;
            scale: string;
            restart: string;
            'config-update': string;
        };
        statusLabels: {
            pending: string;
            running: string;
            completed: string;
            failed: string;
        };
        labels: {
            all: string;
            searchPlaceholder: string;
            statusSectionTitle: string;
            typeSectionTitle: string;
            tableTitle: (matched: number) => string;
        };
        statsCopy: {
            totalLabel: string;
            totalHint: (matched: number) => string;
            runningLabel: string;
            runningHint: string;
            failedLabel: string;
            failedHint: string;
            typeLabel: string;
            typeHint: string;
        };
        emptyTitle: string;
        emptyDescription: string;
        columnLabels: {
            id: string;
            type: string;
            targetId: string;
            status: string;
            createdAt: string;
            finishedAt: string;
        };
        includeColumns: ("type" | "status" | "createdAt" | "id")[];
        defaultPageSize: number;
        pageSizeOptions: number[];
        detailLabels: {
            titlePrefix: string;
            overviewTitle: string;
            timelineTitle: string;
            receiptsTitle: string;
            id: string;
            type: string;
            status: string;
            target: string;
            createdAt: string;
            finishedAt: string;
            inProgress: string;
            noReceipts: string;
            receiptOk: string;
            receiptError: string;
        };
    };
    tob: {
        typeOrder: string[];
        statusOrder: string[];
        searchFields: string[];
        typeLabels: {
            deploy: string;
            rollback: string;
            scale: string;
            restart: string;
            'config-update': string;
        };
        statusLabels: {
            pending: string;
            running: string;
            completed: string;
            failed: string;
        };
        labels: {
            all: string;
            searchPlaceholder: string;
            statusSectionTitle: string;
            typeSectionTitle: string;
            tableTitle: (matched: number) => string;
        };
        statsCopy: {
            totalLabel: string;
            totalHint: (matched: number) => string;
            runningLabel: string;
            runningHint: string;
            failedLabel: string;
            failedHint: string;
            typeLabel: string;
            typeHint: string;
        };
        emptyTitle: string;
        emptyDescription: string;
        columnLabels: {
            id: string;
            type: string;
            targetId: string;
            status: string;
            createdAt: string;
            finishedAt: string;
        };
        detailLabels: {
            titlePrefix: string;
            overviewTitle: string;
            timelineTitle: string;
            receiptsTitle: string;
            id: string;
            type: string;
            status: string;
            target: string;
            createdAt: string;
            finishedAt: string;
            inProgress: string;
            noReceipts: string;
            receiptOk: string;
            receiptError: string;
        };
    };
    admin: {
        typeOrder: string[];
        statusOrder: string[];
        searchFields: string[];
        typeLabels: {
            'runtime-replay': string;
            'secret-rotation': string;
            'approval-execution': string;
            deploy: string;
            rollback: string;
        };
        statusLabels: {
            pending: string;
            running: string;
            completed: string;
            failed: string;
        };
        labels: {
            all: string;
            searchPlaceholder: string;
            statusSectionTitle: string;
            typeSectionTitle: string;
            tableTitle: (matched: number) => string;
        };
        statsCopy: {
            totalLabel: string;
            totalHint: (matched: number) => string;
            runningLabel: string;
            runningHint: string;
            failedLabel: string;
            failedHint: string;
            typeLabel: string;
            typeHint: string;
        };
        emptyTitle: string;
        emptyDescription: string;
        columnLabels: {
            id: string;
            type: string;
            targetId: string;
            status: string;
            createdAt: string;
            finishedAt: string;
        };
        includeColumns: ("type" | "status" | "createdAt" | "id" | "targetId")[];
        defaultPageSize: number;
        pageSizeOptions: number[];
        detailLabels: {
            titlePrefix: string;
            overviewTitle: string;
            timelineTitle: string;
            receiptsTitle: string;
            id: string;
            type: string;
            status: string;
            target: string;
            createdAt: string;
            finishedAt: string;
            inProgress: string;
            noReceipts: string;
            receiptOk: string;
            receiptError: string;
        };
    };
};
export declare function RuntimeOperationDemoListPage({ title, description, preset, count, detailHrefBase, recordOptions, mapRecords, }: RuntimeOperationDemoListPageProps): React.JSX.Element;
interface RuntimeOperationTableColumnLabels {
    id?: string;
    type?: string;
    targetId?: string;
    status?: string;
    createdAt?: string;
    finishedAt?: string;
}
type RuntimeOperationTableColumnKey = 'id' | 'type' | 'targetId' | 'status' | 'createdAt' | 'finishedAt';
interface CreateRuntimeOperationTableColumnsOptions {
    detailHrefBase?: string;
    detailHrefBuilder?: (operation: RuntimeOperationRecord) => string | undefined;
    typeLabels?: Record<string, string>;
    statusLabels?: Record<string, string>;
    statusVariants?: Record<string, 'default' | 'warning' | 'success' | 'error'>;
    columnLabels?: RuntimeOperationTableColumnLabels;
    includeColumns?: RuntimeOperationTableColumnKey[];
    omitColumns?: RuntimeOperationTableColumnKey[];
}
interface RuntimeOperationsTableCardProps {
    operations: RuntimeOperationRecord[];
    detailHrefBase?: string;
    detailHrefBuilder?: (operation: RuntimeOperationRecord) => string | undefined;
    title?: React.ReactNode;
    sort?: DataTableSortConfig | null;
    onSortChange?: React.Dispatch<React.SetStateAction<DataTableSortConfig | null>>;
    striped?: boolean;
    compact?: boolean;
    emptyTitle?: string;
    emptyDescription?: string;
    typeLabels?: Record<string, string>;
    statusLabels?: Record<string, string>;
    statusVariants?: Record<string, 'default' | 'warning' | 'success' | 'error'>;
    columnLabels?: RuntimeOperationTableColumnLabels;
    includeColumns?: RuntimeOperationTableColumnKey[];
    omitColumns?: RuntimeOperationTableColumnKey[];
    pagination?: {
        page: number;
        totalPages: number;
        total: number;
        onPageChange: (page: number) => void;
    };
}
export declare function RuntimeOperationsTableCard({ operations, detailHrefBase, detailHrefBuilder, title, sort, onSortChange, striped, compact, emptyTitle, emptyDescription, typeLabels, statusLabels, statusVariants, columnLabels, includeColumns, omitColumns, pagination, }: RuntimeOperationsTableCardProps): React.JSX.Element;
interface RuntimeOperationDetailViewProps {
    operation?: RuntimeOperationRecord | null;
    receipts?: RuntimeOperationReceiptRecord[];
    preset?: RuntimeOperationListPreset;
    backHref?: string;
    backLabel?: string;
    notFoundTitle?: string;
    notFoundMessage?: string;
    typeLabels?: Record<string, string>;
    statusLabels?: Record<string, string>;
    formatDateTime?: (value: string) => string;
}
interface RuntimeOperationPresetDetailRouteProps {
    operationId: string;
    operations: Record<string, {
        op: RuntimeOperationRecord;
        receipts: RuntimeOperationReceiptRecord[];
    }>;
    preset?: RuntimeOperationListPreset;
    backHref?: string;
    backLabel?: string;
    notFoundTitle?: string;
    notFoundMessage?: string | ((operationId: string) => string);
    typeLabels?: Record<string, string>;
    statusLabels?: Record<string, string>;
    formatDateTime?: (value: string) => string;
}
export interface RuntimeOperationDetailLabels {
    titlePrefix?: string;
    overviewTitle?: string;
    timelineTitle?: string;
    receiptsTitle?: string;
    id?: string;
    type?: string;
    status?: string;
    target?: string;
    createdAt?: string;
    finishedAt?: string;
    inProgress?: string;
    noReceipts?: string;
    receiptOk?: string;
    receiptError?: string;
}
interface RuntimeOperationReceiptListReadoutProps {
    receipts?: RuntimeOperationReceiptRecord[];
    detailLabels?: RuntimeOperationDetailLabels;
    formatDateTime?: (value: string) => string;
}
interface RuntimeOperationOverviewReadoutProps {
    operation: RuntimeOperationRecord;
    detailLabels?: RuntimeOperationDetailLabels;
    typeLabels?: Record<string, string>;
    statusLabels?: Record<string, string>;
}
interface RuntimeOperationTimelineReadoutProps {
    operation: RuntimeOperationRecord;
    detailLabels?: RuntimeOperationDetailLabels;
    formatDateTime?: (value: string) => string;
}
interface RuntimeOperationTypeReadoutProps {
    type: string;
    typeLabels?: Record<string, string>;
}
interface RuntimeOperationIdReadoutProps {
    id: string;
    href?: string;
}
interface RuntimeOperationTargetReadoutProps {
    targetId: string;
}
interface RuntimeOperationStatusReadoutProps {
    status: string;
    statusLabels?: Record<string, string>;
    statusVariants?: Record<string, 'default' | 'warning' | 'success' | 'error'>;
    size?: 'sm' | 'md';
}
interface RuntimeOperationDateTimeReadoutProps {
    value?: string;
    fallback?: React.ReactNode;
    color?: string;
    fontSize?: number;
    formatDateTime?: (value: string) => string;
}
export declare function RuntimeOperationTypeReadout({ type, typeLabels }: RuntimeOperationTypeReadoutProps): React.JSX.Element;
export declare function RuntimeOperationIdReadout({ id, href }: RuntimeOperationIdReadoutProps): React.JSX.Element;
export declare function RuntimeOperationTargetReadout({ targetId }: RuntimeOperationTargetReadoutProps): React.JSX.Element;
export declare function RuntimeOperationStatusReadout({ status, statusLabels, statusVariants, size, }: RuntimeOperationStatusReadoutProps): React.JSX.Element;
export declare function RuntimeOperationDateTimeReadout({ value, fallback, color, fontSize, formatDateTime, }: RuntimeOperationDateTimeReadoutProps): React.JSX.Element;
export declare function createRuntimeOperationTableColumns({ detailHrefBase, detailHrefBuilder, typeLabels, statusLabels, statusVariants, columnLabels, includeColumns, omitColumns, }?: CreateRuntimeOperationTableColumnsOptions): DataTableColumn<RuntimeOperationRecord>[];
export declare function RuntimeOperationReceiptListReadout({ receipts, detailLabels, formatDateTime, }: RuntimeOperationReceiptListReadoutProps): React.JSX.Element;
export declare function RuntimeOperationOverviewReadout({ operation, detailLabels, typeLabels, statusLabels, }: RuntimeOperationOverviewReadoutProps): React.JSX.Element;
export declare function RuntimeOperationTimelineReadout({ operation, detailLabels, formatDateTime, }: RuntimeOperationTimelineReadoutProps): React.JSX.Element;
export declare function RuntimeOperationDetailView({ operation, receipts, preset, backHref, backLabel, notFoundTitle, notFoundMessage, typeLabels, statusLabels, formatDateTime, }: RuntimeOperationDetailViewProps): React.JSX.Element;
export declare function RuntimeOperationPresetDetailRoute({ operationId, operations, preset, backHref, backLabel, notFoundTitle, notFoundMessage, typeLabels, statusLabels, formatDateTime, }: RuntimeOperationPresetDetailRouteProps): React.JSX.Element;
interface RuntimeOperationListStatsCopy {
    totalLabel?: string;
    totalHint?: (matched: number) => string;
    runningLabel?: string;
    runningHint?: string;
    failedLabel?: string;
    failedHint?: string;
    typeLabel?: string;
    typeHint?: string;
}
interface RuntimeOperationListLabels {
    all?: string;
    searchPlaceholder?: string;
    statusSectionTitle?: string;
    typeSectionTitle?: string;
    tableTitle?: (matched: number) => React.ReactNode;
}
interface RuntimeOperationsListPageSectionProps {
    title: string;
    description?: string;
    operations: RuntimeOperationRecord[];
    preset?: RuntimeOperationListPreset;
    detailHrefBase?: string;
    detailHrefBuilder?: (operation: RuntimeOperationRecord) => string | undefined;
    searchFields?: Array<keyof RuntimeOperationRecord | string>;
    statusOrder?: string[];
    typeOrder?: string[];
    typeLabels?: Record<string, string>;
    statusLabels?: Record<string, string>;
    statusVariants?: Record<string, 'default' | 'warning' | 'success' | 'error'>;
    labels?: RuntimeOperationListLabels;
    statsCopy?: RuntimeOperationListStatsCopy;
    emptyTitle?: string;
    emptyDescription?: string;
    defaultPageSize?: number;
    pageSizeOptions?: number[];
    columnLabels?: RuntimeOperationTableColumnLabels;
    includeColumns?: RuntimeOperationTableColumnKey[];
    omitColumns?: RuntimeOperationTableColumnKey[];
}
export declare function RuntimeOperationsListPageSection({ title, description, operations, preset, detailHrefBase, detailHrefBuilder, searchFields, statusOrder, typeOrder, typeLabels, statusLabels, statusVariants, labels, statsCopy, emptyTitle, emptyDescription, defaultPageSize, pageSizeOptions, columnLabels, includeColumns, omitColumns, }: RuntimeOperationsListPageSectionProps): React.JSX.Element;
export {};
