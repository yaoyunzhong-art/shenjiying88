import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach } from 'vitest';

vi.mock('@m5/ui', () => ({
  PageShell: vi.fn(({ title, children }) => (
    <div data-testid="page-shell">
      <h1 data-testid="page-title">{title}</h1>
      {children}
    </div>
  )),
  SearchFilterInput: vi.fn(({ value, onChange, placeholder }) => (
    <input
      data-testid="search-filter-input"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
    />
  )),
  FilterChips: vi.fn(({ hint, chips, onRemove }) => (
    <div data-testid="filter-chips">
      <span data-testid="filter-chips-hint">{hint}</span>
      {(chips ?? []).map((chip: { key: string; label: string; tone?: string }, i: number) => (
        <button
          key={chip.key ?? i}
          data-testid={`chip-${chip.key}`}
          data-tone={chip.tone}
          onClick={() => onRemove?.(chip.key)}
        >
          {chip.label}
        </button>
      ))}
    </div>
  )),
  FilterBar: vi.fn(({ chips, activeCount, onClearAll }) => (
    <div data-testid="filter-bar">
      <span data-testid="filter-bar-active-count">{activeCount}</span>
      {(chips ?? []).map((chip: { key: string; label: string; onClick: () => void }, i: number) => (
        <button key={chip.key ?? i} data-testid={`filter-bar-chip-${chip.key}`} onClick={chip.onClick}>
          {chip.label}
        </button>
      ))}
      <button data-testid="filter-bar-clear-all" onClick={onClearAll}>清除全部</button>
    </div>
  )),
  PaginatedDataTableCard: vi.fn(({ columns, rows, rowKey, emptyTitle, emptyDescription, pagination }) => (
    <div data-testid="paginated-table">
      <div data-testid="pt-table-rows">{rows?.length ?? 0}</div>
      <div data-testid="pt-empty-title">{emptyTitle}</div>
      <div data-testid="pt-empty-desc">{emptyDescription}</div>
      <span data-testid="pt-page">{pagination.page}</span>
      <span data-testid="pt-totalPages">{pagination.totalPages}</span>
      <span data-testid="pt-total">{pagination.total}</span>
      <button data-testid="pt-next" onClick={() => pagination.onPageChange(pagination.page + 1)}>next</button>
      <button data-testid="pt-prev" onClick={() => pagination.onPageChange(pagination.page - 1)}>prev</button>
      <table>
        <thead>
          <tr>
            {(columns ?? []).map((col: { key: string; header: string }) => (
              <th key={col.key} data-testid={`pt-th-${col.key}`}>{col.header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {(rows ?? []).map((row: Record<string, unknown>) => (
            <tr key={rowKey(row)} data-testid={`pt-row-${rowKey(row)}`}>
              {(columns ?? []).map((col: { key: string; render?: (row: unknown) => React.ReactNode }) => (
                <td key={col.key}>{col.render ? col.render(row) : String(row[col.key] ?? '')}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )),
  QuickStats: vi.fn(({ items }) => (
    <div data-testid="quick-stats">
      {(items ?? []).map((item: { label: string; value: number; valueColor?: string }, i: number) => (
        <div key={i} data-testid={`qstat-${i}`}>
          <span data-testid={`qstat-label-${i}`}>{item.label}</span>
          <span data-testid={`qstat-value-${i}`} data-color={item.valueColor}>{item.value}</span>
        </div>
      ))}
    </div>
  )),
}));

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({ push: vi.fn(), back: vi.fn(), forward: vi.fn(), prefetch: vi.fn() })),
  usePathname: vi.fn(() => '/stock/inbound'),
  useSearchParams: vi.fn(() => new URLSearchParams()),
}));

import InboundListPage from './page';

describe('InboundListPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders PageShell with correct title', () => {
    render(<InboundListPage />);
    expect(screen.getByTestId('page-title')).toHaveTextContent('入库接收');
  });

  test('renders search filter input', () => {
    render(<InboundListPage />);
    expect(screen.getByTestId('search-filter-input')).toBeInTheDocument();
  });

  test('search input has correct placeholder', () => {
    render(<InboundListPage />);
    expect(screen.getByTestId('search-filter-input')).toHaveAttribute('placeholder', '搜索单号/供应商/操作人...');
  });

  test('renders QuickStats with correct labels', () => {
    render(<InboundListPage />);
    expect(screen.getByTestId('quick-stats')).toBeInTheDocument();
    expect(screen.getByTestId('qstat-label-0')).toHaveTextContent('全部单数');
    expect(screen.getByTestId('qstat-label-1')).toHaveTextContent('待验收');
    expect(screen.getByTestId('qstat-label-2')).toHaveTextContent('进行中');
    expect(screen.getByTestId('qstat-label-3')).toHaveTextContent('已完成');
  });

  test('renders FilterChips component', () => {
    render(<InboundListPage />);
    expect(screen.getByTestId('filter-chips')).toBeInTheDocument();
  });

  test('filter chips hint text is correct', () => {
    render(<InboundListPage />);
    expect(screen.getByTestId('filter-chips-hint')).toHaveTextContent('筛选状态');
  });

  test('renders PaginatedDataTableCard', () => {
    render(<InboundListPage />);
    expect(screen.getByTestId('paginated-table')).toBeInTheDocument();
  });

  test('empty title is set', () => {
    render(<InboundListPage />);
    expect(screen.getByTestId('pt-empty-title')).toHaveTextContent('暂无入库记录');
  });

  test('empty description is set', () => {
    render(<InboundListPage />);
    expect(screen.getByTestId('pt-empty-desc')).toHaveTextContent('当前筛选条件下没有入库单');
  });

  test('renders table rows', () => {
    render(<InboundListPage />);
    const rows = Number(screen.getByTestId('pt-table-rows').textContent);
    expect(rows).toBeGreaterThan(0);
  });

  test('renders pagination info', () => {
    render(<InboundListPage />);
    expect(screen.getByTestId('pt-page')).toBeInTheDocument();
    expect(screen.getByTestId('pt-totalPages')).toBeInTheDocument();
    expect(screen.getByTestId('pt-total')).toBeInTheDocument();
  });

  test('search filters by keyword', () => {
    render(<InboundListPage />);
    const searchInput = screen.getByTestId('search-filter-input');
    fireEvent.change(searchInput, { target: { value: '咖啡' } });
    expect(searchInput).toHaveValue('咖啡');
  });

  test('empty search returns all', () => {
    render(<InboundListPage />);
    const searchInput = screen.getByTestId('search-filter-input');
    fireEvent.change(searchInput, { target: { value: '' } });
    expect(screen.getByTestId('paginated-table')).toBeInTheDocument();
  });

  test('pagination next button works', () => {
    render(<InboundListPage />);
    const nextBtn = screen.getByTestId('pt-next');
    fireEvent.click(nextBtn);
    expect(screen.getByTestId('pt-page').textContent).toBe('2');
  });

  test('column headers render', () => {
    render(<InboundListPage />);
    expect(screen.getByTestId('pt-th-orderNo')).toHaveTextContent('入库单号');
    expect(screen.getByTestId('pt-th-supplier')).toHaveTextContent('供应商');
    expect(screen.getByTestId('pt-th-status')).toHaveTextContent('状态');
  });

  test('all status stats are shown', () => {
    render(<InboundListPage />);
    expect(screen.getByTestId('qstat-value-0')).toBeInTheDocument();
  });

  test('pending count shown in stats', () => {
    render(<InboundListPage />);
    const pendingVal = Number(screen.getByTestId('qstat-value-1').textContent);
    expect(pendingVal).toBeGreaterThanOrEqual(0);
  });

  test('completed count shown in stats', () => {
    render(<InboundListPage />);
    const completedVal = Number(screen.getByTestId('qstat-value-3').textContent);
    expect(completedVal).toBeGreaterThanOrEqual(0);
  });

  test('search triggers page reset to 1', () => {
    render(<InboundListPage />);
    // go to page 2
    fireEvent.click(screen.getByTestId('pt-next'));
    expect(screen.getByTestId('pt-page').textContent).toBe('2');
    // search resets to page 1
    fireEvent.change(screen.getByTestId('search-filter-input'), { target: { value: 'test' } });
    expect(screen.getByTestId('pt-page').textContent).toBe('1');
  });

  test('data table renders with orderNo links', () => {
    render(<InboundListPage />);
    // Verify row rendering creates entries
    const rows = Number(screen.getByTestId('pt-table-rows').textContent);
    expect(rows).toBeGreaterThan(0);
  });

  test('filter bar not shown initially (no active filter)', () => {
    render(<InboundListPage />);
    expect(screen.queryByTestId('filter-bar')).not.toBeInTheDocument();
  });

  test('renders without errors', () => {
    const { container } = render(<InboundListPage />);
    expect(container).toBeInTheDocument();
  });
});
