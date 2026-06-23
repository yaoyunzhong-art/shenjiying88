'use client';

import React, { useCallback, useMemo, useRef, useState } from 'react';

// ── Types ───────────────────────────────────────────────────────────────────

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
  page: number; // 0-based
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

  // Selection
  /** Enable row selection via checkboxes. */
  selectable?: boolean;
  /** Controlled selected row keys. */
  selectedKeys?: string[];
  /** Called when selection changes. */
  onSelectionChange?: (keys: string[]) => void;

  // Sorting
  /** Controlled sort state. */
  sort?: TableSortState | null;
  /** Called when sort column or direction changes. */
  onSortChange?: (sort: TableSortState | null) => void;

  // Pagination (controlled)
  pagination?: TablePaginationState;
  onPaginationChange?: (page: number) => void;

  // Visual
  striped?: boolean;
  compact?: boolean;
  bordered?: boolean;
  hoverable?: boolean;

  // States
  loading?: boolean;
  emptyText?: string;

  // Callbacks
  onRowClick?: (row: T) => void;

  // Toolbar
  title?: React.ReactNode;
  toolbar?: React.ReactNode;
}

// ── Helpers ─────────────────────────────────────────────────────────────────

const SORT_ARROW: Record<string, string> = {
  asc: ' ▲',
  desc: ' ▼',
};

const SELECT_ALL_KEY = '__table_select_all__';

// ── Component ───────────────────────────────────────────────────────────────

export function Table<T extends Record<string, unknown>>({
  columns,
  rows,
  rowKey,

  selectable = false,
  selectedKeys,
  onSelectionChange,

  sort,
  onSortChange,

  pagination,
  onPaginationChange,

  striped = false,
  compact = false,
  bordered = false,
  hoverable = true,

  loading = false,
  emptyText = 'No data',

  onRowClick,

  title,
  toolbar,
}: TableProps<T>) {
  // Internal selection state when uncontrolled
  const [internalSelected, setInternalSelected] = useState<string[]>([]);
  const resolvedSelected = selectedKeys ?? internalSelected;

  const handleSelectAll = useCallback(
    (checked: boolean) => {
      const all = checked ? rows.map((r) => rowKey(r)) : [];
      if (!selectedKeys) setInternalSelected(all);
      onSelectionChange?.(all);
    },
    [rows, rowKey, selectedKeys, onSelectionChange],
  );

  const handleSelectOne = useCallback(
    (key: string, checked: boolean) => {
      const next = checked
        ? [...resolvedSelected, key]
        : resolvedSelected.filter((k) => k !== key);
      if (!selectedKeys) setInternalSelected(next);
      onSelectionChange?.(next);
    },
    [resolvedSelected, selectedKeys, onSelectionChange],
  );

  const allKeys = useMemo(() => rows.map((r) => rowKey(r)), [rows, rowKey]);
  const allSelected = allKeys.length > 0 && allKeys.every((k) => resolvedSelected.includes(k));
  const someSelected = resolvedSelected.length > 0 && !allSelected;

  const handleSortClick = useCallback(
    (col: TableColumn<T>) => {
      if (!col.sortable || !onSortChange) return;
      if (sort?.key === col.key) {
        if (sort.direction === 'asc') {
          onSortChange({ key: col.key, direction: 'desc' });
        } else {
          onSortChange(null);
        }
      } else {
        onSortChange({ key: col.key, direction: 'asc' });
      }
    },
    [sort, onSortChange],
  );

  const headerCellStyle = useMemo<React.CSSProperties>(
    () => ({
      padding: compact ? '8px 12px' : '10px 16px',
      textAlign: 'left' as const,
      color: '#94a3b8',
      fontWeight: 600,
      fontSize: 12,
      textTransform: 'uppercase' as const,
      letterSpacing: '0.05em',
      whiteSpace: 'nowrap' as const,
      borderBottom: bordered ? '1px solid rgba(148,163,184,0.18)' : '1px solid rgba(148,163,184,0.12)',
    }),
    [compact, bordered],
  );

  const cellStyle = useMemo<React.CSSProperties>(
    () => ({
      padding: compact ? '8px 12px' : '10px 16px',
      color: '#e2e8f0',
      borderBottom: bordered ? '1px solid rgba(148,163,184,0.08)' : '1px solid rgba(148,163,184,0.06)',
    }),
    [compact, bordered],
  );

  // ── Render ───────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8', fontSize: 14 }}>
        Loading...
      </div>
    );
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      {/* Header / Toolbar */}
      {title || toolbar ? (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 0 12px', gap: 12 }}>
          {title ? <div style={{ color: '#e2e8f0', fontWeight: 600, fontSize: 14 }}>{title}</div> : <div />}
          {toolbar ? <div style={{ display: 'flex', gap: 8 }}>{toolbar}</div> : null}
        </div>
      ) : null}

      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
        <thead>
          <tr>
            {selectable ? (
              <th style={{ ...headerCellStyle, width: 40, textAlign: 'center' }}>
                <input
                  type="checkbox"
                  checked={allSelected}
                  ref={(el) => {
                    if (el) el.indeterminate = someSelected;
                  }}
                  onChange={(e) => handleSelectAll((e.target as HTMLInputElement).checked)}
                  aria-label="Select all rows"
                />
              </th>
            ) : null}
            {columns.map((col) => {
              const isSortCol = sort?.key === col.key;
              const sortArrow = isSortCol ? SORT_ARROW[sort!.direction] : '';
              return (
                <th
                  key={col.key}
                  style={{
                    ...headerCellStyle,
                    textAlign: col.align ?? 'left',
                    width: col.width,
                    cursor: col.sortable && onSortChange ? 'pointer' : undefined,
                    userSelect: col.sortable && onSortChange ? 'none' : undefined,
                  }}
                  onClick={() => handleSortClick(col)}
                >
                  {col.header ?? col.title ?? col.key}
                  {col.sortable && onSortChange ? (
                    <span style={{ color: isSortCol ? '#38bdf8' : '#475569', marginLeft: 2 }}>
                      {sortArrow || ' ↕'}
                    </span>
                  ) : null}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length + (selectable ? 1 : 0)}
                style={{ padding: 40, textAlign: 'center', color: '#64748b', fontSize: 14 }}
              >
                {emptyText}
              </td>
            </tr>
          ) : (
            rows.map((row, idx) => {
              const key = rowKey(row);
              const isSelected = resolvedSelected.includes(key);
              return (
                <tr
                  key={key}
                  onClick={() => onRowClick?.(row)}
                  style={{
                    cursor: onRowClick ? 'pointer' : undefined,
                    background: isSelected
                      ? 'rgba(56,189,248,0.08)'
                      : striped && idx % 2 === 1
                        ? 'rgba(148,163,184,0.02)'
                        : undefined,
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={
                    hoverable
                      ? (e) => {
                          if (!isSelected) {
                            (e.currentTarget as HTMLElement).style.background = 'rgba(148,163,184,0.04)';
                          }
                        }
                      : undefined
                  }
                  onMouseLeave={
                    hoverable
                      ? (e) => {
                          if (!isSelected) {
                            (e.currentTarget as HTMLElement).style.background = '';
                          }
                        }
                      : undefined
                  }
                >
                  {selectable ? (
                    <td style={{ ...cellStyle, width: 40, textAlign: 'center' }}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => handleSelectOne(key, (e.target as HTMLInputElement).checked)}
                        aria-label={`Select row ${key}`}
                      />
                    </td>
                  ) : null}
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      style={{ ...cellStyle, textAlign: col.align ?? 'left' }}
                    >
                      {col.render ? col.render(row, idx) : String(row[col.key] ?? '')}
                    </td>
                  ))}
                </tr>
              );
            })
          )}
        </tbody>
      </table>

      {/* Pagination footer */}
      {pagination && onPaginationChange ? (
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '12px 0',
            color: '#94a3b8',
            fontSize: 13,
          }}
        >
          <span>
            {pagination.total > 0
              ? `Showing ${pagination.page * pagination.pageSize + 1}–${Math.min(
                  (pagination.page + 1) * pagination.pageSize,
                  pagination.total,
                )} of ${pagination.total}`
              : 'No results'}
          </span>
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              disabled={pagination.page <= 0}
              onClick={() => onPaginationChange(pagination.page - 1)}
              style={{
                padding: '4px 10px',
                border: '1px solid rgba(148,163,184,0.2)',
                borderRadius: 4,
                background: 'transparent',
                color: pagination.page <= 0 ? '#475569' : '#e2e8f0',
                cursor: pagination.page <= 0 ? 'not-allowed' : 'pointer',
                fontSize: 13,
              }}
            >
              ← Prev
            </button>
            <span style={{ padding: '4px 8px' }}>
              Page {pagination.page + 1} / {Math.max(1, Math.ceil(pagination.total / pagination.pageSize))}
            </span>
            <button
              disabled={(pagination.page + 1) * pagination.pageSize >= pagination.total}
              onClick={() => onPaginationChange(pagination.page + 1)}
              style={{
                padding: '4px 10px',
                border: '1px solid rgba(148,163,184,0.2)',
                borderRadius: 4,
                background: 'transparent',
                color:
                  (pagination.page + 1) * pagination.pageSize >= pagination.total ? '#475569' : '#e2e8f0',
                cursor:
                  (pagination.page + 1) * pagination.pageSize >= pagination.total
                    ? 'not-allowed'
                    : 'pointer',
                fontSize: 13,
              }}
            >
              Next →
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
