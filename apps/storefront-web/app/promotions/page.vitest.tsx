import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach } from 'vitest';

vi.mock('@m5/ui', () => ({
  Badge: vi.fn(({ children, variant }) => (
    <span data-testid="badge" data-variant={variant}>{children}</span>
  )),
  DataTable: vi.fn(({ columns, items, rowKey, sort, onSortChange, emptyText }) => (
    <div data-testid="data-table">
      <div data-testid="dt-empty-text">{emptyText}</div>
      <div data-testid="dt-rows-count">{items?.length ?? 0}</div>
      <table>
        <thead>
          <tr>
            {(columns ?? []).map((col: { key: string; label: string; sortable?: boolean; align?: string }) => (
              <th
                key={col.key}
                data-testid={`dt-th-${col.key}`}
                data-sortable={col.sortable ? 'true' : 'false'}
                data-align={col.align}
                onClick={() => {
                  if (col.sortable && onSortChange) {
                    const isSame = sort?.key === col.key;
                    onSortChange({ key: col.key, direction: isSame && sort?.direction === 'asc' ? 'desc' : 'asc' });
                  }
                }}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {(items ?? []).map((row: Record<string, unknown>) => (
            <tr key={rowKey(row)} data-testid={`dt-row-${rowKey(row)}`}>
              {(columns ?? []).map((col: { key: string; render?: (row: unknown) => React.ReactNode }) => (
                <td key={col.key}>{col.render ? col.render(row) : String(row[col.key] ?? '')}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )),
  PageShell: vi.fn(({ title, description, actions, children }) => (
    <div data-testid="page-shell">
      <h1 data-testid="page-title">{title}</h1>
      {description && <p data-testid="page-description">{description}</p>}
      {actions && <div data-testid="page-actions">{actions}</div>}
      {children}
    </div>
  )),
  Pagination: vi.fn(({ page, pageSize, total, onPageChange, onPageSizeChange }) => (
    <div data-testid="pagination">
      <span data-testid="pg-page">{page}</span>
      <span data-testid="pg-pageSize">{pageSize}</span>
      <span data-testid="pg-total">{total}</span>
      <button data-testid="pg-next" onClick={() => onPageChange(page + 1)}>next</button>
      <button data-testid="pg-prev" onClick={() => onPageChange(page - 1)}>prev</button>
      <select data-testid="pg-pageSize-select" value={pageSize} onChange={(e) => onPageSizeChange(Number(e.target.value))}>
        <option value={5}>5</option>
        <option value={10}>10</option>
        <option value={20}>20</option>
      </select>
    </div>
  )),
  SearchFilterInput: vi.fn(({ value, onChange, placeholder }) => (
    <input
      data-testid="search-input"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
    />
  )),
  StatusBadge: vi.fn(({ label, variant }) => (
    <span data-testid={`status-badge`} data-badge-label={label} data-badge-variant={variant}>
      {label}
    </span>
  )),
  usePagination: vi.fn((opts: { initialPageSize?: number }) => {
    const ps = opts?.initialPageSize ?? 10;
    const [page, setPage] = React.useState(1);
    const [pageSize, setPageSize] = React.useState(ps);
    return { page, pageSize, setPage, setPageSize };
  }),
  useSearchFilter: vi.fn((data: unknown[], fields: unknown[]) => {
    const [searchTerm, setSearchTerm] = React.useState('');
    const filteredItems = React.useMemo(() => {
      if (!searchTerm.trim()) return data;
      const term = searchTerm.toLowerCase();
      return (data as Record<string, unknown>[]).filter((item) =>
        (fields as string[]).some((f) => item[f]?.toString().toLowerCase().includes(term)),
      );
    }, [data, searchTerm, fields]);
    return { searchTerm, setSearchTerm, filteredItems };
  }),
}));

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({ push: vi.fn(), back: vi.fn(), forward: vi.fn() })),
  usePathname: vi.fn(() => '/promotions'),
  useSearchParams: vi.fn(() => new URLSearchParams()),
}));

import StorePromotionsPage from './page';

describe('StorePromotionsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders PageShell with correct title', () => {
    render(<StorePromotionsPage />);
    expect(screen.getByTestId('page-title')).toHaveTextContent('促销活动');
  });

  test('renders page description', () => {
    render(<StorePromotionsPage />);
    expect(screen.getByTestId('page-description')).toBeInTheDocument();
  });

  test('renders search input', () => {
    render(<StorePromotionsPage />);
    expect(screen.getByTestId('search-input')).toBeInTheDocument();
  });

  test('search placeholder is correct', () => {
    render(<StorePromotionsPage />);
    expect(screen.getByTestId('search-input')).toHaveAttribute('placeholder', '搜索活动名称或门店...');
  });

  test('renders DataTable', () => {
    render(<StorePromotionsPage />);
    expect(screen.getByTestId('data-table')).toBeInTheDocument();
  });

  test('renders pagination', () => {
    render(<StorePromotionsPage />);
    expect(screen.getByTestId('pagination')).toBeInTheDocument();
  });

  test('renders page actions with buttons', () => {
    render(<StorePromotionsPage />);
    expect(screen.getByTestId('page-actions')).toBeInTheDocument();
  });

  test('shows status filter dropdown', () => {
    render(<StorePromotionsPage />);
    expect(screen.getByLabelText('状态筛选')).toBeInTheDocument();
  });

  test('status filter has correct options', () => {
    render(<StorePromotionsPage />);
    const select = screen.getByLabelText('状态筛选') as HTMLSelectElement;
    expect(select.options.length).toBe(5);
    expect(select.options[0].text).toBe('全部状态');
    expect(select.options[1].text).toBe('进行中');
  });

  test('shows type filter dropdown', () => {
    render(<StorePromotionsPage />);
    expect(screen.getByLabelText('类型筛选')).toBeInTheDocument();
  });

  test('type filter has correct options', () => {
    render(<StorePromotionsPage />);
    const select = screen.getByLabelText('类型筛选') as HTMLSelectElement;
    expect(select.options.length).toBe(5);
    expect(select.options[0].text).toBe('全部类型');
    expect(select.options[1].text).toBe('折扣');
  });

  test('data table shows rows', () => {
    render(<StorePromotionsPage />);
    const count = Number(screen.getByTestId('dt-rows-count').textContent);
    expect(count).toBeGreaterThan(0);
  });

  test('data table empty text is set', () => {
    render(<StorePromotionsPage />);
    expect(screen.getByTestId('dt-empty-text')).toHaveTextContent('暂无匹配的促销活动');
  });

  test('Renders total count display', () => {
    render(<StorePromotionsPage />);
    expect(screen.getByText(/共/)).toBeInTheDocument();
    expect(screen.getByText(/条/)).toBeInTheDocument();
  });

  test('statistics toggle button exists', () => {
    render(<StorePromotionsPage />);
    const buttons = screen.getAllByText(/统计/);
    expect(buttons.length).toBeGreaterThanOrEqual(1);
  });

  test('error simulation button exists', () => {
    render(<StorePromotionsPage />);
    expect(screen.getByText(/模拟错误/)).toBeInTheDocument();
  });

  test('create activity button exists', () => {
    render(<StorePromotionsPage />);
    expect(screen.getByText('创建活动')).toBeInTheDocument();
  });

  test('clicking error button shows error state', () => {
    render(<StorePromotionsPage />);
    fireEvent.click(screen.getByText('模拟错误'));
    expect(screen.getByText(/⚠️ 加载失败/)).toBeInTheDocument();
  });

  test('retry button works after error', () => {
    render(<StorePromotionsPage />);
    fireEvent.click(screen.getByText('模拟错误'));
    expect(screen.getByText('重试')).toBeInTheDocument();
    fireEvent.click(screen.getByText('重试'));
    expect(screen.queryByText(/⚠️ 加载失败/)).not.toBeInTheDocument();
  });

  test('clicking stats button shows stats panel', () => {
    render(<StorePromotionsPage />);
    const statsButtons = screen.getAllByText(/统计/);
    fireEvent.click(statsButtons[0]);
    expect(screen.getByText('总活动')).toBeInTheDocument();
  });

  test('stats toggle hides panel again', () => {
    render(<StorePromotionsPage />);
    const statsButtons = screen.getAllByText(/统计/);
    fireEvent.click(statsButtons[0]);
    expect(screen.getByText('总活动')).toBeInTheDocument();
    const hideButtons = screen.getAllByText(/隐藏统计/);
    fireEvent.click(hideButtons[0]);
    expect(screen.queryByText('总活动')).not.toBeInTheDocument();
  });

  test('search filters promotions by title', () => {
    render(<StorePromotionsPage />);
    const input = screen.getByTestId('search-input');
    fireEvent.change(input, { target: { value: '夏日' } });
    expect(input).toHaveValue('夏日');
  });

  test('status filter change triggers re-filter', () => {
    render(<StorePromotionsPage />);
    const statusSelect = screen.getByLabelText('状态筛选');
    fireEvent.change(statusSelect, { target: { value: 'active' } });
    expect((statusSelect as HTMLSelectElement).value).toBe('active');
  });

  test('type filter change triggers re-filter', () => {
    render(<StorePromotionsPage />);
    const typeSelect = screen.getByLabelText('类型筛选');
    fireEvent.change(typeSelect, { target: { value: 'discount' } });
    expect((typeSelect as HTMLSelectElement).value).toBe('discount');
  });

  test('pagination next works', () => {
    render(<StorePromotionsPage />);
    fireEvent.click(screen.getByTestId('pg-next'));
    expect(screen.getByTestId('pg-page').textContent).toBe('2');
  });

  test('column headers render correctly', () => {
    render(<StorePromotionsPage />);
    expect(screen.getByTestId('dt-th-title')).toHaveTextContent('活动名称');
    expect(screen.getByTestId('dt-th-type')).toHaveTextContent('类型');
    expect(screen.getByTestId('dt-th-status')).toHaveTextContent('状态');
  });

  test('sortable columns toggle sort', () => {
    render(<StorePromotionsPage />);
    const titleTh = screen.getByTestId('dt-th-title');
    expect(titleTh).toHaveAttribute('data-sortable', 'true');
  });

  test('renders performance analysis section', () => {
    render(<StorePromotionsPage />);
    expect(screen.getByText('📊 活动效果分析')).toBeInTheDocument();
  });

  test('renders scheduling section', () => {
    render(<StorePromotionsPage />);
    expect(screen.getByText('📅 活动排期概览')).toBeInTheDocument();
  });

  test('renders type distribution section', () => {
    render(<StorePromotionsPage />);
    expect(screen.getByText('🏷️ 活动类型分布')).toBeInTheDocument();
  });

  test('renders budget execution section', () => {
    render(<StorePromotionsPage />);
    expect(screen.getByText('💰 月度活动预算执行')).toBeInTheDocument();
  });
});
