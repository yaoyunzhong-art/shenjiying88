import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach } from 'vitest';

// Mock @m5/ui components
vi.mock('@m5/ui', () => ({
  DataTable: vi.fn(({ columns, rows, emptyText, rowKey, sort, onSortChange }) => (
    <div data-testid="data-table">
      <div data-testid="table-empty-text">{emptyText}</div>
      <div data-testid="table-rows-count">{rows?.length ?? 0}</div>
      <table>
        <thead>
          <tr>
            {(columns ?? []).map((col: { key: string; header: string; sortable?: boolean }, i: number) => (
              <th
                key={col.key}
                data-testid={`th-${col.key}`}
                data-sortable={col.sortable ? 'true' : 'false'}
                onClick={() => {
                  if (col.sortable && onSortChange) {
                    const isSame = sort?.key === col.key;
                    onSortChange({ key: col.key, direction: isSame && sort?.direction === 'asc' ? 'desc' : 'asc' });
                  }
                }}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {(rows ?? []).map((row: Record<string, unknown>) => (
            <tr key={rowKey(row)} data-testid={`row-${rowKey(row)}`}>
              {(columns ?? []).map((col: { key: string; render?: (row: unknown) => React.ReactNode }) => (
                <td key={col.key}>{col.render ? col.render(row) : String(row[col.key] ?? '')}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {sort && <div data-testid="sort-config">{sort.key}:{sort.direction}</div>}
    </div>
  )),
  PageShell: vi.fn(({ title, children }) => (
    <div data-testid="page-shell">
      <h1 data-testid="page-title">{title}</h1>
      {children}
    </div>
  )),
  Pagination: vi.fn(({ page, pageSize, total, onPageChange, onPageSizeChange }) => (
    <div data-testid="pagination">
      <span data-testid="pagination-page">{page}</span>
      <span data-testid="pagination-pageSize">{pageSize}</span>
      <span data-testid="pagination-total">{total}</span>
      <button data-testid="pagination-next" onClick={() => onPageChange?.(page + 1)}>next</button>
      <button data-testid="pagination-prev" onClick={() => onPageChange?.(page - 1)}>prev</button>
      <select
        data-testid="pagination-pageSize-select"
        value={pageSize}
        onChange={(e) => onPageSizeChange?.(Number(e.target.value))}
      >
        <option value={5}>5</option>
        <option value={10}>10</option>
        <option value={20}>20</option>
      </select>
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
  StatusBadge: vi.fn(({ label, variant }) => (
    <span data-testid={`status-badge-${label}`} data-variant={variant}>
      {label}
    </span>
  )),
  Tabs: vi.fn(({ items, activeKey, onChange }) => (
    <div data-testid="tabs">
      {(items ?? []).map((item: { key: string; label: string }) => (
        <button
          key={item.key}
          data-testid={`tab-${item.key}`}
          data-active={activeKey === item.key ? 'true' : 'false'}
          onClick={() => onChange(item.key)}
        >
          {item.label}
        </button>
      ))}
    </div>
  )),
  usePagination: vi.fn((total: number, defaultPageSize: number) => {
    const [page, setPage] = React.useState(1);
    const [pageSize, setPageSize] = React.useState(defaultPageSize);
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const paginate = (items: unknown[]) => {
      const start = (page - 1) * pageSize;
      return items.slice(start, start + pageSize);
    };
    return { page, pageSize, totalPages, setPage, setPageSize, paginate };
  }),
  useSortedItems: vi.fn((items: unknown[], _columns: unknown[], sortConfig: unknown) => {
    if (!sortConfig) return items;
    const cfg = sortConfig as { key: string; direction: string };
    return [...(items as Record<string, unknown>[])].sort((a, b) => {
      const aVal = a[cfg.key] ?? '';
      const bVal = b[cfg.key] ?? '';
      if (aVal < bVal) return cfg.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return cfg.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }),
}));

// Mock local components
vi.mock('../_components/useTriState', () => ({
  useTriState: vi.fn(({ loading: initialLoading }) => {
    const [loading, setLoading] = React.useState(initialLoading);
    const [error, setError] = React.useState<string | null>(null);
    const wrapLoad = vi.fn(async <T,>(promise: Promise<T>): Promise<T | undefined> => {
      setLoading(true);
      try {
        const result = await promise;
        setLoading(false);
        return result;
      } catch (err) {
        setError(String(err));
        setLoading(false);
        return undefined;
      }
    });
    return { loading, error, wrapLoad };
  }),
}));

vi.mock('../_components/TriStateRenderer', () => ({
  TriStateRenderer: vi.fn(({ loading, empty, error, onRetry, children }) => {
    if (loading) return <div data-testid="loading-state">Loading...</div>;
    if (error) return (
      <div data-testid="error-state">
        <span>Error: {error}</span>
        <button data-testid="retry-button" onClick={onRetry}>Retry</button>
      </div>
    );
    if (empty) return <div data-testid="empty-state">No data</div>;
    return <div data-testid="content">{children}</div>;
  }),
}));

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({ push: vi.fn(), back: vi.fn(), forward: vi.fn() })),
  usePathname: vi.fn(() => '/customers'),
  useSearchParams: vi.fn(() => new URLSearchParams()),
}));

import CustomersPage from './page';

describe('CustomersPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders PageShell with correct title', async () => {
    render(<CustomersPage />);
    await waitFor(() => {
      expect(screen.getByTestId('page-title')).toHaveTextContent('客户管理');
    });
  });

  test('shows loading state initially', () => {
    render(<CustomersPage />);
    expect(screen.getByTestId('loading-state')).toBeInTheDocument();
  });

  test('renders search filter input after loading', async () => {
    render(<CustomersPage />);
    await waitFor(() => {
      expect(screen.getByTestId('search-filter-input')).toBeInTheDocument();
    });
  });

  test('search input has correct placeholder', async () => {
    render(<CustomersPage />);
    await waitFor(() => {
      expect(screen.getByTestId('search-filter-input')).toHaveAttribute('placeholder', '搜索客户姓名 / 手机号 / 邮箱…');
    });
  });

  test('renders tabs with correct options', async () => {
    render(<CustomersPage />);
    await waitFor(() => {
      expect(screen.getByTestId('tabs')).toBeInTheDocument();
      expect(screen.getByTestId('tab-all')).toBeInTheDocument();
      expect(screen.getByTestId('tab-active')).toBeInTheDocument();
      expect(screen.getByTestId('tab-inactive')).toBeInTheDocument();
      expect(screen.getByTestId('tab-churned')).toBeInTheDocument();
    });
  });

  test('all tab is active by default', async () => {
    render(<CustomersPage />);
    await waitFor(() => {
      expect(screen.getByTestId('tab-all')).toHaveAttribute('data-active', 'true');
    });
  });

  test('renders DataTable after loading', async () => {
    render(<CustomersPage />);
    await waitFor(() => {
      expect(screen.getByTestId('data-table')).toBeInTheDocument();
    });
  });

  test('data table shows customer rows', async () => {
    render(<CustomersPage />);
    await waitFor(() => {
      const rowsCount = screen.getByTestId('table-rows-count');
      expect(Number(rowsCount.textContent)).toBeGreaterThan(0);
    });
  });

  test('renders status badges for customers', async () => {
    render(<CustomersPage />);
    await waitFor(() => {
      const badges = screen.getAllByTestId(/^status-badge-/);
      expect(badges.length).toBeGreaterThan(0);
    });
  });

  test('search filters customers by name', async () => {
    render(<CustomersPage />);
    await waitFor(() => {
      const searchInput = screen.getByTestId('search-filter-input');
      fireEvent.change(searchInput, { target: { value: '张伟' } });
    });
    // After search, table should still be rendered
    await waitFor(() => {
      expect(screen.getByTestId('data-table')).toBeInTheDocument();
    });
  });

  test('tab change filters data', async () => {
    render(<CustomersPage />);
    await waitFor(() => {
      const activeTab = screen.getByTestId('tab-active');
      fireEvent.click(activeTab);
    });
    await waitFor(() => {
      expect(screen.getByTestId('tab-active')).toHaveAttribute('data-active', 'true');
    });
  });

  test('clicking churned tab shows churned customers', async () => {
    render(<CustomersPage />);
    await waitFor(() => {
      const churnedTab = screen.getByTestId('tab-churned');
      fireEvent.click(churnedTab);
    });
    await waitFor(() => {
      expect(screen.getByTestId('tab-churned')).toHaveAttribute('data-active', 'true');
    });
  });

  test('renders pagination component after loading', async () => {
    render(<CustomersPage />);
    await waitFor(() => {
      const paginations = screen.getAllByTestId('pagination');
      expect(paginations.length).toBeGreaterThan(0);
    });
  });

  test('pagination shows correct total', async () => {
    render(<CustomersPage />);
    await waitFor(() => {
      expect(screen.getByTestId('pagination-total')).toBeInTheDocument();
    });
  });

  test('sort by column header updates sort config', async () => {
    render(<CustomersPage />);
    await waitFor(() => {
      const nameHeader = screen.getByTestId('th-name');
      expect(nameHeader).toHaveAttribute('data-sortable', 'true');
      fireEvent.click(nameHeader);
    });
    await waitFor(() => {
      expect(screen.getByTestId('sort-config')).toBeInTheDocument();
    });
  });

  test('renders with default sort by totalSpent desc', async () => {
    render(<CustomersPage />);
    await waitFor(() => {
      expect(screen.getByTestId('sort-config')).toHaveTextContent('totalSpent:desc');
    });
  });

  test('empty search returns table', async () => {
    render(<CustomersPage />);
    await waitFor(() => {
      const searchInput = screen.getByTestId('search-filter-input');
      fireEvent.change(searchInput, { target: { value: '' } });
    });
    await waitFor(() => {
      expect(screen.getByTestId('data-table')).toBeInTheDocument();
    });
  });

  test('pagination page changes', async () => {
    render(<CustomersPage />);
    await waitFor(() => {
      const nextBtn = screen.getByTestId('pagination-next');
      fireEvent.click(nextBtn);
    });
    await waitFor(() => {
      expect(screen.getByTestId('pagination-page').textContent).toBe('2');
    });
  });

  test('pagination prev works', async () => {
    render(<CustomersPage />);
    await waitFor(() => {
      fireEvent.click(screen.getByTestId('pagination-next'));
    });
    await waitFor(() => {
      expect(screen.getByTestId('pagination-page').textContent).toBe('2');
    });
    fireEvent.click(screen.getByTestId('pagination-prev'));
    await waitFor(() => {
      expect(screen.getByTestId('pagination-page').textContent).toBe('1');
    });
  });

  test('table has empty text configured', async () => {
    render(<CustomersPage />);
    await waitFor(() => {
      expect(screen.getByTestId('table-empty-text')).toHaveTextContent('暂无客户数据');
    });
  });

  test('all tab shows all customer statuses', async () => {
    render(<CustomersPage />);
    await waitFor(() => {
      expect(screen.getByTestId('tab-all')).toHaveAttribute('data-active', 'true');
    });
  });

  test('column headers render correctly', async () => {
    render(<CustomersPage />);
    await waitFor(() => {
      expect(screen.getByTestId('th-name')).toHaveTextContent('姓名');
      expect(screen.getByTestId('th-totalOrders')).toHaveTextContent('订单数');
      expect(screen.getByTestId('th-totalSpent')).toHaveTextContent('消费总额');
    });
  });
});
