'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';

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

const VIEW_MODE_ICONS: Record<string, string> = {
  table: '☰',
  grid: '⊞',
  card: '▣',
};

export function ListToolbar({
  searchPlaceholder = '搜索...',
  searchValue: controlledSearchValue,
  onSearchChange,
  onSearch,
  searchDebounceMs = 300,
  sortOptions,
  activeSortKey,
  onSortChange,
  sortDirection = 'asc',
  onSortDirectionChange,
  filterOptions,
  onFilterToggle,
  onClearFilters,
  viewModes,
  activeViewMode = 'table',
  onViewModeChange,
  batchActions,
  selectedCount = 0,
  onBatchAction,
  createLabel,
  onCreate,
  totalCount,
  totalLabel = '条记录',
  children,
  disabled = false,
  'data-testid': testId,
}: ListToolbarProps) {
  const [internalSearchValue, setInternalSearchValue] = useState(controlledSearchValue ?? '');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const searchValue = controlledSearchValue !== undefined ? controlledSearchValue : internalSearchValue;

  useEffect(() => {
    if (controlledSearchValue !== undefined) {
      setInternalSearchValue(controlledSearchValue);
    }
  }, [controlledSearchValue]);

  const handleSearchInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      if (controlledSearchValue === undefined) {
        setInternalSearchValue(value);
      }
      onSearchChange?.(value);

      // Debounced search
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        onSearch?.(value);
      }, searchDebounceMs);
    },
    [controlledSearchValue, onSearchChange, onSearch, searchDebounceMs]
  );

  const handleSearchKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        onSearch?.(searchValue);
      }
    },
    [onSearch, searchValue]
  );

  const handleClearSearch = useCallback(() => {
    if (controlledSearchValue === undefined) {
      setInternalSearchValue('');
    }
    onSearchChange?.('');
    onSearch?.('');
  }, [controlledSearchValue, onSearchChange, onSearch]);

  const activeFilterCount = filterOptions?.filter((f) => f.active).length ?? 0;

  return (
    <div
      data-testid={testId}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        padding: '12px 0',
        opacity: disabled ? 0.5 : 1,
        pointerEvents: disabled ? 'none' : 'auto',
      }}
    >
      {/* Batch actions bar */}
      {selectedCount > 0 && batchActions && batchActions.length > 0 && (
        <div
          data-testid="list-toolbar-batch-bar"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 10,
            padding: '10px 14px',
            borderRadius: 10,
            border: '1px solid rgba(96, 165, 250, 0.3)',
            background: 'rgba(59, 130, 246, 0.12)',
            flexWrap: 'wrap',
          }}
        >
          <span style={{ fontSize: 13, fontWeight: 600, color: '#93c5fd' }}>
            已选择 {selectedCount} 项
          </span>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {batchActions.map((action) => (
              <button
                key={action.key}
                type="button"
                data-testid={`batch-action-${action.key}`}
                disabled={action.disabled}
                onClick={() => onBatchAction?.(action.key)}
                style={{
                  padding: '6px 12px',
                  fontSize: 12,
                  fontWeight: 600,
                  borderRadius: 8,
                  border: action.variant === 'danger'
                    ? '1px solid rgba(248, 113, 113, 0.3)'
                    : action.variant === 'primary'
                      ? '1px solid rgba(96, 165, 250, 0.4)'
                      : '1px solid rgba(148, 163, 184, 0.2)',
                  background: action.variant === 'danger'
                    ? 'rgba(248, 113, 113, 0.12)'
                    : action.variant === 'primary'
                      ? 'rgba(59, 130, 246, 0.18)'
                      : 'rgba(148, 163, 184, 0.08)',
                  color: action.variant === 'danger'
                    ? '#fca5a5'
                    : action.variant === 'primary'
                      ? '#93c5fd'
                      : '#cbd5e1',
                  cursor: action.disabled ? 'not-allowed' : 'pointer',
                  opacity: action.disabled ? 0.5 : 1,
                }}
              >
                {action.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main toolbar row */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          flexWrap: 'wrap',
        }}
      >
        {/* Search input */}
        <div
          data-testid="list-toolbar-search"
          style={{
            position: 'relative',
            flex: '1 1 240px',
            minWidth: 160,
            maxWidth: 400,
          }}
        >
          <span
            style={{
              position: 'absolute',
              left: 10,
              top: '50%',
              transform: 'translateY(-50%)',
              fontSize: 14,
              color: '#64748b',
              pointerEvents: 'none',
            }}
          >
            🔍
          </span>
          <input
            type="text"
            data-testid="list-toolbar-search-input"
            value={searchValue}
            onChange={handleSearchInputChange}
            onKeyDown={handleSearchKeyDown}
            placeholder={searchPlaceholder}
            disabled={disabled}
            style={{
              width: '100%',
              padding: '8px 32px 8px 32px',
              fontSize: 13,
              borderRadius: 8,
              border: '1px solid rgba(148, 163, 184, 0.2)',
              background: 'rgba(15, 23, 42, 0.5)',
              color: '#e2e8f0',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
          {searchValue && (
            <button
              type="button"
              data-testid="list-toolbar-search-clear"
              onClick={handleClearSearch}
              style={{
                position: 'absolute',
                right: 8,
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                color: '#94a3b8',
                cursor: 'pointer',
                fontSize: 14,
                padding: 0,
                lineHeight: 1,
              }}
              aria-label="清除搜索"
            >
              ✕
            </button>
          )}
        </div>

        {/* Sort select */}
        {sortOptions && sortOptions.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <select
              data-testid="list-toolbar-sort-select"
              value={activeSortKey ?? ''}
              onChange={(e) => onSortChange?.(e.target.value)}
              disabled={disabled}
              style={{
                padding: '8px 10px',
                fontSize: 13,
                borderRadius: 8,
                border: '1px solid rgba(148, 163, 184, 0.2)',
                background: 'rgba(15, 23, 42, 0.5)',
                color: '#e2e8f0',
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              {sortOptions.map((opt) => (
                <option key={opt.key} value={opt.key}>
                  {opt.label}
                </option>
              ))}
            </select>
            {activeSortKey && onSortDirectionChange && (
              <button
                type="button"
                data-testid="list-toolbar-sort-direction"
                onClick={() =>
                  onSortDirectionChange(sortDirection === 'asc' ? 'desc' : 'asc')
                }
                disabled={disabled}
                title={sortDirection === 'asc' ? '升序' : '降序'}
                style={{
                  padding: '6px 8px',
                  fontSize: 14,
                  borderRadius: 8,
                  border: '1px solid rgba(148, 163, 184, 0.2)',
                  background: 'rgba(15, 23, 42, 0.4)',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  lineHeight: 1,
                }}
              >
                {sortDirection === 'asc' ? '↑' : '↓'}
              </button>
            )}
          </div>
        )}

        {/* Filter chips inline */}
        {filterOptions && filterOptions.length > 0 && (
          <div
            data-testid="list-toolbar-filters"
            style={{ display: 'flex', gap: 4, flexWrap: 'wrap', alignItems: 'center' }}
          >
            {filterOptions.map((filter) => (
              <button
                key={filter.key}
                type="button"
                data-testid={`filter-chip-${filter.key}`}
                onClick={() => onFilterToggle?.(filter.key)}
                disabled={disabled}
                style={{
                  padding: '6px 12px',
                  fontSize: 12,
                  fontWeight: 500,
                  borderRadius: 8,
                  border: filter.active
                    ? '1px solid rgba(96, 165, 250, 0.4)'
                    : '1px solid rgba(148, 163, 184, 0.15)',
                  background: filter.active
                    ? 'rgba(59, 130, 246, 0.18)'
                    : 'rgba(148, 163, 184, 0.06)',
                  color: filter.active ? '#93c5fd' : '#94a3b8',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                {filter.label}
              </button>
            ))}
            {activeFilterCount > 0 && onClearFilters && (
              <button
                type="button"
                data-testid="list-toolbar-clear-filters"
                onClick={onClearFilters}
                disabled={disabled}
                style={{
                  padding: '6px 10px',
                  fontSize: 12,
                  fontWeight: 500,
                  borderRadius: 8,
                  border: '1px solid rgba(248, 113, 113, 0.2)',
                  background: 'transparent',
                  color: '#fca5a5',
                  cursor: 'pointer',
                }}
              >
                清除 ({activeFilterCount})
              </button>
            )}
          </div>
        )}

        {/* View mode toggle */}
        {viewModes && viewModes.length > 0 && (
          <div
            data-testid="list-toolbar-view-modes"
            style={{
              display: 'flex',
              gap: 2,
              borderRadius: 8,
              border: '1px solid rgba(148, 163, 184, 0.15)',
              overflow: 'hidden',
              marginLeft: 'auto',
            }}
          >
            {viewModes.map((mode) => (
              <button
                key={mode.key}
                type="button"
                data-testid={`view-mode-${mode.key}`}
                onClick={() => onViewModeChange?.(mode.key)}
                disabled={disabled}
                title={mode.label}
                style={{
                  padding: '6px 10px',
                  fontSize: 14,
                  border: 'none',
                  background:
                    activeViewMode === mode.key
                      ? 'rgba(59, 130, 246, 0.18)'
                      : 'transparent',
                  color:
                    activeViewMode === mode.key ? '#93c5fd' : '#64748b',
                  cursor: 'pointer',
                  lineHeight: 1,
                }}
              >
                {mode.icon ?? VIEW_MODE_ICONS[mode.key] ?? mode.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Bottom row: create button + total count + children */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 10,
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          {createLabel && onCreate && (
            <button
              type="button"
              data-testid="list-toolbar-create"
              onClick={onCreate}
              disabled={disabled}
              style={{
                padding: '8px 16px',
                fontSize: 13,
                fontWeight: 600,
                borderRadius: 8,
                border: '1px solid rgba(59, 130, 246, 0.4)',
                background: 'rgba(59, 130, 246, 0.2)',
                color: '#93c5fd',
                cursor: 'pointer',
              }}
            >
              + {createLabel}
            </button>
          )}
          {totalCount !== undefined && (
            <span
              data-testid="list-toolbar-total"
              style={{ fontSize: 12, color: '#64748b' }}
            >
              共 {totalCount} {totalLabel}
            </span>
          )}
        </div>
        {children && (
          <div data-testid="list-toolbar-children">{children}</div>
        )}
      </div>
    </div>
  );
}

export default ListToolbar;
