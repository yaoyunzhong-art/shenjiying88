import React from 'react';
import { type DataTableSortConfig } from './LinkedOverviewStubs';
export declare const listPageStatCardStyle: React.CSSProperties;
export interface ListPageFacetConfig<T> {
    key: string;
    order?: readonly string[];
    enabled?: boolean;
    getValue: (item: T) => string;
}
export interface ListPageFacetState<T> {
    key: string;
    order: readonly string[];
    enabled: boolean;
    value: string;
    baseItems: T[];
    filteredItems: T[];
}
interface UseListPageSectionStateOptions<T> {
    items: T[];
    searchFields: Array<keyof T | string>;
    facets: ListPageFacetConfig<T>[];
    defaultPageSize?: number;
    pageSizeOptions?: number[];
}
export declare function useListPageSectionState<T>({ items, searchFields, facets, defaultPageSize, pageSizeOptions, }: UseListPageSectionStateOptions<T>): {
    searchTerm: string;
    setSearchTerm: React.Dispatch<React.SetStateAction<string>>;
    searchFilteredItems: T[];
    facets: ListPageFacetState<T>[];
    filteredItems: T[];
    sortConfig: DataTableSortConfig | null;
    setSortConfig: React.Dispatch<React.SetStateAction<DataTableSortConfig | null>>;
    sortedItems: T[];
    pagedItems: T[];
    pagination: {
        page: number;
        pageSize: number;
        totalPages: number;
        setPage: React.Dispatch<React.SetStateAction<number>>;
        setPageSize: React.Dispatch<React.SetStateAction<number>>;
        total: number;
        resetPage: () => void;
        paginate: <T_1>(items: T_1[]) => T_1[];
    };
    totalPages: number;
    setFacetValue: (key: string, value: string) => void;
};
export {};
