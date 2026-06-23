'use client';

import React from 'react';
import { DataTable, type DataTableColumn } from './DataTable';
import { EmptyState } from './EmptyState';
import type { DataTableSortConfig } from './LinkedOverviewStubs';
import { LoadingSkeleton } from './LoadingSkeleton';
import { Pagination } from './Pagination';

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

export function PaginatedDataTableCard<T>({
  title,
  columns,
  rows,
  rowKey,
  loading = false,
  sort,
  onSortChange,
  striped = false,
  compact = false,
  emptyTitle,
  emptyDescription,
  pagination,
}: PaginatedDataTableCardProps<T>) {
  return (
    <div
      style={{
        background: 'rgba(15,23,42,0.5)',
        border: '1px solid rgba(148,163,184,0.12)',
        borderRadius: 12,
        overflow: 'hidden',
      }}
    >
      {loading ? (
        <LoadingSkeleton lines={2} rows={5} />
      ) : rows.length === 0 ? (
        <EmptyState title={emptyTitle} description={emptyDescription} />
      ) : (
        <>
          <DataTable
            title={title}
            columns={columns}
            rows={rows}
            rowKey={rowKey}
            sort={sort}
            onSortChange={onSortChange}
            striped={striped}
            compact={compact}
          />
          {pagination ? (
            <div style={{ padding: '0 16px' }}>
              <Pagination
                page={pagination.page}
                totalPages={pagination.totalPages}
                total={pagination.total}
                onPageChange={pagination.onPageChange}
              />
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
