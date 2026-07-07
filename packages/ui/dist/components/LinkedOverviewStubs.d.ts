import React from 'react';
import { type FoundationAlertTimelineFilterState } from '@m5/types';
export declare function useSearchFilter<T>(items: T[], searchFields: Array<keyof T | string>): {
    searchTerm: string;
    setSearchTerm: React.Dispatch<React.SetStateAction<string>>;
    filteredItems: T[];
    matchedCount: number;
    totalCount: number;
};
export declare function useSearchFilter(initialValue?: string, debounceMs?: number): {
    value: string;
    debouncedValue: string;
    setValue: (value: string) => void;
};
export declare function SearchFilterInput(props: any): React.ReactElement;
export declare function FoundationAlertLinkedAlertGridReadout(props: any): React.DetailedReactHTMLElement<{
    style: {
        marginTop: number;
    };
}, HTMLElement>;
export declare function FoundationAlertLinkedFocusBarReadout(props: any): React.DetailedReactHTMLElement<{
    style: {
        borderRadius: number;
        padding: number;
        background: any;
        border: string;
    };
}, HTMLElement>;
export declare function FoundationAlertLinkedOverviewStatsReadout(props: any): React.DetailedReactHTMLElement<{
    style: {
        marginTop: number;
        display: "grid";
        gap: number;
        gridTemplateColumns: string;
    };
}, HTMLElement>;
export declare function createFoundationAlertNextNavigationBindings(opts: any): {
    router: any;
    pathname: any;
    searchParams: URLSearchParams;
    push: (...args: unknown[]) => any;
    replace: (...args: unknown[]) => any;
};
export declare function useFoundationAlertLinkedFocusQuery(opts: any): {
    activateFocus: (code: string, ctx: string, filters?: FoundationAlertTimelineFilterState) => void;
    clearLinkedTriage: () => void;
    copyFocusLink: () => Promise<void>;
    focusAlertCode: any;
    focusContext: any;
    handlePanelFocusChange: (code: string, ctx: string) => void;
    hasLinkedFilters: boolean;
    linkedFilterQueryPreview: string;
    linkedFilterSummary: string;
    shareStatus: string | undefined;
};
export declare function canReplayRuntimePanelAction(_receipt: any, _extraCheck?: (receipt: any) => boolean): boolean;
export declare function createRuntimeReceiptStatusCardProps(_opts: any): {
    receipt: any;
    summary: any;
    scopeLabel: any;
    metaLabel: any;
    eventCount: any;
};
export declare function createRuntimeOperationToolbarProps(_opts: any): {
    onSubmit: any;
    onQuery: any;
    onReplay: any;
    disableSubmit: any;
    disableQuery: any;
    disableReplay: any;
    canReplay: any;
    pendingOperation: any;
    receipt: any;
};
export declare function hasRuntimePanelReceiptCode(_receipt: any): boolean;
export declare function RuntimeOperationToolbar(props: any): React.DetailedReactHTMLElement<{
    'data-testid': string;
    style: {
        marginTop: number;
        display: "flex";
        gap: number;
        flexWrap: "wrap";
        alignItems: "center";
    };
}, HTMLElement>;
export declare function RuntimePanelFeedback(props: any): React.DetailedReactHTMLElement<{
    'data-testid': string;
    style: {
        marginTop: number;
        borderRadius: number;
        padding: number;
        background: string;
        border: string;
    };
}, HTMLElement>;
export declare function RuntimePanelFrame(props: any): React.DetailedReactHTMLElement<{
    'data-testid': string;
    style: {
        borderRadius: number;
        padding: number;
        background: string;
        border: string;
        color: "#f8fafc";
    };
}, HTMLElement>;
export declare function RuntimePanelGrid(_props: any): React.DetailedReactHTMLElement<{
    style: {
        display: "grid";
        gap: number;
        gridTemplateColumns: string;
        marginTop: number;
    };
}, HTMLElement>;
export declare function joinRuntimeScopeSummary(parts: string[], _opts?: any): string;
export declare function useRuntimePresetSelection<T>(presets?: readonly T[] | T[], defaultKey?: string): {
    selectedAction: string;
    setSelectedAction: React.Dispatch<React.SetStateAction<string>>;
    activePreset: any;
};
export declare function useRuntimePanelState<T = any>(defaultMessage?: string): {
    receipt: T | null;
    setReceipt: React.Dispatch<React.SetStateAction<T | null>>;
    pendingOperation: string | null;
    setPendingOperation: React.Dispatch<React.SetStateAction<string | null>>;
    actionError: string | null;
    setActionError: React.Dispatch<React.SetStateAction<string | null>>;
    message: string | null;
    setMessage: React.Dispatch<React.SetStateAction<string | null>>;
    runOperation: (operation: string, fn: () => Promise<any>) => Promise<void>;
};
export declare function RuntimePresetCard(props: any): React.DetailedReactHTMLElement<{
    'data-testid': string;
    style: {
        borderRadius: number;
        padding: number;
        background: string;
        border: string;
    };
}, HTMLElement>;
export declare function RuntimePresetSelector(props: any): React.DetailedReactHTMLElement<{
    'data-testid': string;
    style: {
        marginTop: number;
        display: "flex";
        gap: number;
        flexWrap: "wrap";
    };
}, HTMLElement>;
export declare function RuntimeReceiptStatusCard(props: any): React.DetailedReactHTMLElement<{
    'data-testid': string;
    style: {
        borderRadius: number;
        padding: number;
        background: string;
        border: string;
    };
}, HTMLElement>;
export declare function executeRuntimePanelOperation(_opts: any): Promise<any>;
export interface DataTableSortConfig {
    key: string;
    direction: 'asc' | 'desc';
}
export declare function useSortedItems<T>(items: T[] | undefined | null, _columns: any[], sortConfig: DataTableSortConfig | null): T[];
export interface PortalListItemView {
    id: string;
    label: string;
    subtitle?: string;
    status?: string;
    meta?: string;
}
interface PortalListProps {
    portals: PortalListItemView[];
    searchPlaceholder?: string;
    emptyTitle?: string;
    emptyDescription?: string;
}
export declare function PortalList({ portals, searchPlaceholder, emptyTitle, emptyDescription, }: PortalListProps): React.JSX.Element;
export declare function formatRuntimeCallbackStalledDuration(ms: number): string;
export declare function describeRuntimeCallbackStalledEscalation(action: string): string;
export declare function FoundationAlertRuntimeCallbackStalledReadout(_props: any): React.DetailedReactHTMLElement<React.HTMLAttributes<HTMLElement>, HTMLElement>;
export declare function summarizeRuntimePanelReceipt(receipt: any): string;
export declare function canReplayRuntimePanelReceipt(receipt: any): boolean;
export declare function getRuntimePanelTenantId(receipt: any): string;
export declare function createRuntimeReceiptStatusCard(_opts: any): React.FunctionComponentElement<any>;
export declare function RuntimeReceiptEvents(_props: any): React.DetailedReactHTMLElement<{
    style: {
        marginTop: number;
        display: "grid";
        gap: number;
    };
}, HTMLElement>;
export declare function refreshFoundationAlertSelection(_opts: any): string;
export {};
