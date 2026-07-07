import React from 'react';
import { type DataTableColumn } from './DataTable';
import type { DataTableSortConfig } from './LinkedOverviewStubs';
interface PaginatedDataTableCardProps<T> {
    title?: React.ReactNode;
    columns: DataTableColumn<T>[];
    rows: T[];
    rowKey: (row: T) => string;
    loading?: boolean;
    sort?: DataTableSortConfig | null;
    onSortChange?: React.Dispatch<React.SetStateAction<DataTableSortConfig | null>>;
    striped?: boolean;
    compact?: boolean;
    emptyTitle: string;
    emptyDescription: string;
    pagination?: {
        page: number;
        totalPages: number;
        total: number;
        onPageChange: (page: number) => void;
    };
}
export declare function PaginatedDataTableCard<T>({ title, columns, rows, rowKey, loading, sort, onSortChange, striped, compact, emptyTitle, emptyDescription, pagination, }: PaginatedDataTableCardProps<T>): React.JSX.Element;
export {};
