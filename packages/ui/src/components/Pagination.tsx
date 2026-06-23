'use client';
import React, { useMemo } from 'react';

interface PaginationProps {
  page: number;
  total: number;
  onPageChange: (page: number) => void;
  totalPages?: number;
  pageSize?: number;
  onPageSizeChange?: (pageSize: number) => void;
  pageSizeOptions?: number[];
  size?: 'sm' | 'md';
}

interface LegacyPaginationOptions {
  initialPage?: number;
  initialPageSize?: number;
  pageSizeOptions?: number[];
}

export function usePagination(total: number, pageSize: number, initialPage?: number): {
  page: number;
  pageSize: number;
  totalPages: number;
  setPage: React.Dispatch<React.SetStateAction<number>>;
  setPageSize: React.Dispatch<React.SetStateAction<number>>;
  total: number;
  resetPage: () => void;
  paginate: <T>(items: T[]) => T[];
};
export function usePagination(options: LegacyPaginationOptions): {
  page: number;
  pageSize: number;
  totalPages: number;
  setPage: React.Dispatch<React.SetStateAction<number>>;
  setPageSize: React.Dispatch<React.SetStateAction<number>>;
  total: number;
  resetPage: () => void;
  paginate: <T>(items: T[]) => T[];
};
export function usePagination(
  totalOrOptions: number | LegacyPaginationOptions,
  pageSizeArg?: number,
  initialPageArg = 1
) {
  const isLegacyConfig = typeof totalOrOptions === 'object';
  const total = typeof totalOrOptions === 'number' ? totalOrOptions : 0;
  const initialPage = isLegacyConfig ? (totalOrOptions.initialPage ?? 1) : initialPageArg;
  const initialPageSize = isLegacyConfig ? (totalOrOptions.initialPageSize ?? 10) : (pageSizeArg ?? 10);
  const [page, setPage] = React.useState(initialPage);
  const [pageSize, setPageSize] = React.useState(initialPageSize);

  const totalPages = Math.max(1, Math.ceil(total / Math.max(pageSize, 1)));
  const resetPage = React.useCallback(() => setPage(1), []);
  const paginate = React.useCallback(
    <T,>(items: T[]) => items.slice((page - 1) * pageSize, page * pageSize),
    [page, pageSize]
  );

  return { page, pageSize, totalPages, setPage, setPageSize, total, resetPage, paginate };
}

export function Pagination({
  page,
  total,
  totalPages,
  onPageChange,
  pageSize,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 50],
  size = 'md',
}: PaginationProps) {
  const resolvedTotalPages =
    totalPages ?? Math.max(1, Math.ceil(total / Math.max(pageSize ?? pageSizeOptions[0] ?? 10, 1)));
  const pages = useMemo(() => {
    const result: (number | '...')[] = [];
    if (resolvedTotalPages <= 7) {
      for (let i = 1; i <= resolvedTotalPages; i++) result.push(i);
    } else {
      result.push(1);
      if (page > 3) result.push('...');
      for (let i = Math.max(2, page - 1); i <= Math.min(resolvedTotalPages - 1, page + 1); i++) {
        result.push(i);
      }
      if (page < resolvedTotalPages - 2) result.push('...');
      result.push(resolvedTotalPages);
    }
    return result;
  }, [page, resolvedTotalPages]);

  const btnBase: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: size === 'sm' ? 30 : 36,
    height: size === 'sm' ? 30 : 36,
    fontSize: size === 'sm' ? 12 : 13,
    fontWeight: 500,
    borderRadius: 8,
    border: '1px solid rgba(148,163,184,0.12)',
    background: 'transparent',
    color: '#94a3b8',
    cursor: 'pointer',
    transition: 'all 0.15s',
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 12,
        padding: '12px 0',
      }}
    >
      <span style={{ fontSize: 13, color: '#64748b' }}>
        Total {total} items
      </span>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        {pageSize && onPageSizeChange ? (
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            style={{
              borderRadius: 8,
              border: '1px solid rgba(148,163,184,0.12)',
              background: 'rgba(15,23,42,0.5)',
              color: '#cbd5e1',
              padding: '8px 10px',
              fontSize: size === 'sm' ? 12 : 13,
            }}
          >
            {pageSizeOptions.map((option) => (
              <option key={option} value={option}>
                {option} / page
              </option>
            ))}
          </select>
        ) : null}
        <div style={{ display: 'flex', gap: 4 }}>
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          style={{ ...btnBase, opacity: page <= 1 ? 0.4 : 1 }}
        >
          ‹
        </button>
        {pages.map((p, i) =>
          p === '...' ? (
            <span
              key={`dots-${i}`}
              style={{ display: 'inline-flex', alignItems: 'center', padding: '0 4px', color: '#64748b' }}
            >
              …
            </span>
          ) : (
            <button
              key={p}
              type="button"
              onClick={() => onPageChange(p)}
              style={{
                ...btnBase,
                background: p === page ? 'rgba(59,130,246,0.18)' : undefined,
                color: p === page ? '#93c5fd' : undefined,
                borderColor: p === page ? 'rgba(96,165,250,0.3)' : undefined,
              }}
            >
              {p}
            </button>
          )
        )}
        <button
          type="button"
          disabled={page >= resolvedTotalPages}
          onClick={() => onPageChange(page + 1)}
          style={{ ...btnBase, opacity: page >= resolvedTotalPages ? 0.4 : 1 }}
        >
          ›
        </button>
        </div>
      </div>
    </div>
  );
}
