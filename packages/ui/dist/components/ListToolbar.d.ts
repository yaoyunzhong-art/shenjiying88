import React from 'react';
export interface ListToolbarSortOption {
    key: string;
    label: string;
}
export interface ListToolbarFilterOption {
    key: string;
    label: string;
    active: boolean;
}
export interface ListToolbarViewMode {
    key: 'table' | 'grid' | 'card';
    label: string;
    icon?: string;
}
export interface ListToolbarBatchAction {
    key: string;
    label: string;
    disabled?: boolean;
    variant?: 'default' | 'danger' | 'primary';
}
export interface ListToolbarProps {
    /** Search input placeholder */
    searchPlaceholder?: string;
    /** Current search value (controlled) */
    searchValue?: string;
    /** Search change handler */
    onSearchChange?: (value: string) => void;
    /** Search submit handler (Enter press or button click) */
    onSearch?: (value: string) => void;
    /** Debounce delay in ms for search */
    searchDebounceMs?: number;
    /** Sort options */
    sortOptions?: ListToolbarSortOption[];
    /** Currently active sort key */
    activeSortKey?: string;
    /** Sort change handler */
    onSortChange?: (key: string) => void;
    /** Sort direction */
    sortDirection?: 'asc' | 'desc';
    /** Sort direction toggle handler */
    onSortDirectionChange?: (direction: 'asc' | 'desc') => void;
    /** Filter chips */
    filterOptions?: ListToolbarFilterOption[];
    /** Filter toggle handler */
    onFilterToggle?: (key: string) => void;
    /** Clear all filters */
    onClearFilters?: () => void;
    /** View modes available */
    viewModes?: ListToolbarViewMode[];
    /** Current view mode */
    activeViewMode?: 'table' | 'grid' | 'card';
    /** View mode change handler */
    onViewModeChange?: (mode: 'table' | 'grid' | 'card') => void;
    /** Batch actions (shows when selectedCount > 0) */
    batchActions?: ListToolbarBatchAction[];
    /** Number of selected items */
    selectedCount?: number;
    /** Batch action handler */
    onBatchAction?: (actionKey: string) => void;
    /** Create / add button */
    createLabel?: string;
    /** Create button handler */
    onCreate?: () => void;
    /** Total count display */
    totalCount?: number;
    /** Total count label */
    totalLabel?: string;
    /** Additional custom content slot */
    children?: React.ReactNode;
    /** Disabled state */
    disabled?: boolean;
    /** Test id */
    'data-testid'?: string;
}
export declare function ListToolbar({ searchPlaceholder, searchValue: controlledSearchValue, onSearchChange, onSearch, searchDebounceMs, sortOptions, activeSortKey, onSortChange, sortDirection, onSortDirectionChange, filterOptions, onFilterToggle, onClearFilters, viewModes, activeViewMode, onViewModeChange, batchActions, selectedCount, onBatchAction, createLabel, onCreate, totalCount, totalLabel, children, disabled, 'data-testid': testId, }: ListToolbarProps): React.JSX.Element;
export default ListToolbar;
