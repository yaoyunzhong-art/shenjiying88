import React from 'react';
export interface TableColumn<T = Record<string, unknown>> {
    /** Unique key for the column. */
    key: string;
    /** Header text; falls back to `title` then to `key`. */
    header?: string;
    /** Legacy alias for header. */
    title?: string;
    /** CSS width e.g. "120px" or "20%". */
    width?: string;
    /** Text alignment. */
    align?: 'left' | 'center' | 'right';
    /** If true the column is sortable. */
    sortable?: boolean;
    /** Custom render function receiving the full row. */
    render?: (row: T, rowIndex: number) => React.ReactNode;
}
export interface TableSortState {
    key: string;
    direction: 'asc' | 'desc';
}
export interface TablePaginationState {
    page: number;
    pageSize: number;
    total: number;
}
export interface TableProps<T = Record<string, unknown>> {
    /** Column definitions. */
    columns: TableColumn<T>[];
    /** Data rows. */
    rows: T[];
    /** Function returning a stable, unique key for each row. */
    rowKey: (row: T) => string;
    /** Enable row selection via checkboxes. */
    selectable?: boolean;
    /** Controlled selected row keys. */
    selectedKeys?: string[];
    /** Called when selection changes. */
    onSelectionChange?: (keys: string[]) => void;
    /** Controlled sort state. */
    sort?: TableSortState | null;
    /** Called when sort column or direction changes. */
    onSortChange?: (sort: TableSortState | null) => void;
    pagination?: TablePaginationState;
    onPaginationChange?: (page: number) => void;
    striped?: boolean;
    compact?: boolean;
    bordered?: boolean;
    hoverable?: boolean;
    loading?: boolean;
    emptyText?: string;
    onRowClick?: (row: T) => void;
    title?: React.ReactNode;
    toolbar?: React.ReactNode;
}
export declare function Table<T extends Record<string, unknown>>({ columns, rows, rowKey, selectable, selectedKeys, onSelectionChange, sort, onSortChange, pagination, onPaginationChange, striped, compact, bordered, hoverable, loading, emptyText, onRowClick, title, toolbar, }: TableProps<T>): React.JSX.Element;
