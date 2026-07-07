import React from 'react';
import type { DataTableSortConfig } from './LinkedOverviewStubs';
export interface DataTableColumn<T> {
    key: string;
    header?: string;
    title?: string;
    width?: string;
    align?: 'left' | 'center' | 'right';
    dataKey?: keyof T;
    sortable?: boolean;
    sortValue?: (row: T) => React.ReactNode;
    render?: (row: T, index: number) => React.ReactNode;
}
interface DataTableProps<T> {
    columns: DataTableColumn<T>[];
    rows?: T[];
    items?: T[];
    rowKey: (row: T) => string;
    loading?: boolean;
    emptyText?: string;
    onRowClick?: (row: T) => void;
    title?: React.ReactNode;
    sort?: DataTableSortConfig | null;
    onSortChange?: React.Dispatch<React.SetStateAction<DataTableSortConfig | null>>;
    striped?: boolean;
    compact?: boolean;
}
export declare function DataTable<T>({ columns, rows, items, rowKey, loading, emptyText, onRowClick, title, striped, compact, }: DataTableProps<T>): React.JSX.Element;
export {};
