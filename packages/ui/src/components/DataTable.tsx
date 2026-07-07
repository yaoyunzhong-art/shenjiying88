'use client';

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
  /** @deprecated Use `rows` instead */
  data?: T[];
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

export function DataTable<T>({
  columns,
  rows,
  data,
  items,
  rowKey,
  loading = false,
  emptyText = 'No data',
  onRowClick,
  title,
  striped = false,
  compact = false,
}: DataTableProps<T>) {
  const resolvedRows = rows ?? data ?? items ?? [];

  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8', fontSize: 14 }}>
        Loading...
      </div>
    );
  }

  if (resolvedRows.length === 0) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: '#64748b', fontSize: 14 }}>
        {emptyText}
      </div>
    );
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      {title ? (
        <div style={{ padding: '0 0 12px', color: '#e2e8f0', fontWeight: 600, fontSize: 14 }}>{title}</div>
      ) : null}
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
        <thead>
          <tr
            style={{
              borderBottom: '1px solid rgba(148,163,184,0.12)',
            }}
          >
            {columns.map((col) => (
              <th
                key={col.key}
                style={{
                  padding: '10px 16px',
                  textAlign: col.align ?? 'left',
                  color: '#94a3b8',
                  fontWeight: 600,
                  fontSize: 12,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  width: col.width,
                  whiteSpace: 'nowrap',
                }}
              >
                {col.header ?? col.title ?? col.key}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {resolvedRows.map((row, idx) => (
            <tr
              key={rowKey(row)}
              onClick={() => onRowClick?.(row)}
              style={{
                borderBottom: '1px solid rgba(148,163,184,0.06)',
                cursor: onRowClick ? 'pointer' : undefined,
                transition: 'background 0.15s',
                background: striped && idx % 2 === 1 ? 'rgba(148,163,184,0.02)' : undefined,
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background = 'rgba(148,163,184,0.04)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background = '';
              }}
            >
              {columns.map((col) => (
                <td
                  key={col.key}
                  style={{
                    padding: '10px 16px',
                    ...(compact ? { paddingTop: 8, paddingBottom: 8 } : {}),
                    textAlign: col.align ?? 'left',
                    color: '#e2e8f0',
                  }}
                >
                  {col.render
                    ? col.render(row, idx)
                    : col.dataKey
                      ? String(row[col.dataKey] ?? '')
                      : null}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
