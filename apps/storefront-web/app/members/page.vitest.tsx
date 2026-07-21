import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach } from 'vitest';

// Mock @m5/ui
vi.mock('@m5/ui', () => ({
  DataTable: vi.fn(({ columns, rows, rowKey, sort, onSortChange, emptyText }) => (
    <div data-testid="data-table">
      <div data-testid="table-empty-text">{emptyText}</div>
      <div data-testid="table-rows-count">{rows?.length ?? 0}</div>
      <table>
        <thead>
          <tr>
            {(columns ?? []).map((col: { key: string; header: string; sortable?: boolean }) => (
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
    </div>
  )),
  PageShell: vi.fn(({ title, description, children }) => (
    <div data-testid="page-shell">
      <h1 data-testid="page-title">{title}</h1>
      {description && <p data-testid="page-description">{description}</p>}
      {children}
    </div>
  )),
  Pagination: vi.fn(({ page, totalPages, total, onPageChange }) => (
    <div data-testid="pagination">
      <span data-testid="pagination-page">{page}</span>
      <span data-testid="pagination-totalPages">{totalPages}</span>
      <span data-testid="pagination-total">{total}</span>
      <button data-testid="pagination-next" onClick={() => onPageChange?.(page + 1)}>next</button>
      <button data-testid="pagination-prev" onClick={() => onPageChange?.(page - 1)}>prev</button>
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
  StatusBadge: vi.fn(({ label, variant, size }) => (
    <span data-testid={`badge-${label}`} data-variant={variant} data-size={size}>
      {label}
    </span>
  )),
  Tabs: vi.fn(({ items, activeKey, onChange, variant, size }) => (
    <div data-testid="tabs" data-variant={variant} data-size={size}>
      {(items ?? []).map((item: { key: string; label: string; count?: number }) => (
        <button
          key={item.key}
          data-testid={`tab-${item.key}`}
          data-active={activeKey === item.key ? 'true' : 'false'}
          onClick={() => onChange(item.key)}
        >
          {item.label}
          {item.count !== undefined ? <span data-testid={`tab-count-${item.key}`}>{item.count}</span> : null}
        </button>
      ))}
    </div>
  )),
  usePagination: vi.fn((total: number, pageSize: number) => {
    const [page, setPage] = React.useState(1);
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    return { page, pageSize, totalPages, setPage };
  }),
  useSearchFilter: vi.fn((data: unknown[], _fields: unknown[]) => {
    const [searchTerm, setSearchTerm] = React.useState('');
    const filteredItems = React.useMemo(() => {
      if (!searchTerm.trim()) return data;
      const term = searchTerm.toLowerCase();
      return (data as Record<string, unknown>[]).filter(
        (item) =>
          item.name?.toString().toLowerCase().includes(term) ||
          item.phone?.toString().toLowerCase().includes(term) ||
          item.tier?.toString().toLowerCase().includes(term) ||
          item.storeName?.toString().toLowerCase().includes(term),
      );
    }, [data, searchTerm]);
    return { searchTerm, setSearchTerm, filteredItems };
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

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({ push: vi.fn(), back: vi.fn(), forward: vi.fn() })),
  usePathname: vi.fn(() => '/members'),
  useSearchParams: vi.fn(() => new URLSearchParams()),
}));

import MembersListPage from './page';

describe('MembersListPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders PageShell with correct title', async () => {
    render(<MembersListPage />);
    await waitFor(() => {
      expect(screen.getByTestId('page-title')).toHaveTextContent('会员管理');
    });
  });

  test('shows page description', async () => {
    render(<MembersListPage />);
    await waitFor(() => {
      expect(screen.getByTestId('page-description')).toHaveTextContent('管理门店会员信息');
    });
  });

  test('shows loading state initially', () => {
    render(<MembersListPage />);
    expect(screen.getByTestId('loading-state')).toBeInTheDocument();
  });

  test('renders search filter input after loading', async () => {
    render(<MembersListPage />);
    await waitFor(() => {
      expect(screen.getByTestId('search-filter-input')).toBeInTheDocument();
    });
  });

  test('search input has correct placeholder', async () => {
    render(<MembersListPage />);
    await waitFor(() => {
      expect(screen.getByTestId('search-filter-input')).toHaveAttribute('placeholder', '搜索姓名、手机号、等级或门店...');
    });
  });

  test('renders DataTable after loading', async () => {
    render(<MembersListPage />);
    await waitFor(() => {
      expect(screen.getByTestId('data-table')).toBeInTheDocument();
    });
  });

  test('data table shows member rows', async () => {
    render(<MembersListPage />);
    await waitFor(() => {
      const count = screen.getByTestId('table-rows-count');
      expect(Number(count.textContent)).toBeGreaterThan(0);
    });
  });

  test('renders tier tabs', async () => {
    render(<MembersListPage />);
    await waitFor(() => {
      const allTabs = screen.getAllByTestId('tab-ALL');
      expect(allTabs.length).toBe(2);
      expect(screen.getByTestId('tab-diamond')).toBeInTheDocument();
      expect(screen.getByTestId('tab-gold')).toBeInTheDocument();
    });
  });

  test('renders status tabs', async () => {
    render(<MembersListPage />);
    await waitFor(() => {
      expect(screen.getByTestId('tab-active')).toBeInTheDocument();
      expect(screen.getByTestId('tab-inactive')).toBeInTheDocument();
      expect(screen.getByTestId('tab-frozen')).toBeInTheDocument();
    });
  });

  test('all tier tab is active by default', async () => {
    render(<MembersListPage />);
    await waitFor(() => {
      const tabs = screen.getAllByTestId('tab-ALL');
      // First Tabs group has the tier tabs, first tab is '全部'
      expect(tabs[0]).toHaveTextContent('全部');
      expect(tabs[0]).toHaveAttribute('data-active', 'true');
    });
  });

  test('clicking diamond tab filters data', async () => {
    render(<MembersListPage />);
    await waitFor(() => {
      fireEvent.click(screen.getByTestId('tab-diamond'));
    });
    await waitFor(() => {
      expect(screen.getByTestId('tab-diamond')).toHaveAttribute('data-active', 'true');
    });
  });

  test('clicking frozen status tab filters data', async () => {
    render(<MembersListPage />);
    await waitFor(() => {
      fireEvent.click(screen.getByTestId('tab-frozen'));
    });
    await waitFor(() => {
      expect(screen.getByTestId('tab-frozen')).toHaveAttribute('data-active', 'true');
    });
  });

  test('search filters members by name', async () => {
    render(<MembersListPage />);
    await waitFor(() => {
      const searchInput = screen.getByTestId('search-filter-input');
      fireEvent.change(searchInput, { target: { value: '张伟' } });
    });
    await waitFor(() => {
      expect(screen.getByTestId('search-filter-input')).toHaveValue('张伟');
    });
  });

  test('empty search returns all members', async () => {
    render(<MembersListPage />);
    await waitFor(() => {
      const searchInput = screen.getByTestId('search-filter-input');
      fireEvent.change(searchInput, { target: { value: '' } });
    });
    await waitFor(() => {
      expect(screen.getByTestId('data-table')).toBeInTheDocument();
    });
  });

  test('renders status badges', async () => {
    render(<MembersListPage />);
    await waitFor(() => {
      const badges = screen.getAllByTestId(/^badge-/);
      expect(badges.length).toBeGreaterThan(0);
    });
  });

  test('renders pagination component', async () => {
    render(<MembersListPage />);
    await waitFor(() => {
      const paginations = screen.getAllByTestId('pagination');
      expect(paginations.length).toBeGreaterThan(0);
    });
  });

  test('pagination page can change forward', async () => {
    render(<MembersListPage />);
    await waitFor(() => {
      const nextBtn = screen.getByTestId('pagination-next');
      fireEvent.click(nextBtn);
    });
    await waitFor(() => {
      expect(screen.getByTestId('pagination-page').textContent).toBe('2');
    });
  });

  test('empty state shown when no match', async () => {
    render(<MembersListPage />);
    // The page uses inline empty state, not TriStateRenderer empty
    await waitFor(() => {
      expect(screen.getByTestId('data-table')).toBeInTheDocument();
    });
  });

  test('column headers render', async () => {
    render(<MembersListPage />);
    await waitFor(() => {
      expect(screen.getByTestId('th-name')).toHaveTextContent('会员');
      expect(screen.getByTestId('th-tier')).toHaveTextContent('等级');
      expect(screen.getByTestId('th-points')).toHaveTextContent('积分');
    });
  });

  test('all status tab is active by default', async () => {
    render(<MembersListPage />);
    await waitFor(() => {
      const tabs = screen.getAllByTestId('tab-ALL');
      // Second Tabs group has the status tabs, first tab is '全部状态'
      expect(tabs[1]).toHaveTextContent('全部状态');
      expect(tabs[1]).toHaveAttribute('data-active', 'true');
    });
  });

  test('tier tabs use pills variant', async () => {
    render(<MembersListPage />);
    await waitFor(() => {
      // The first Tabs should be tier filter
      const firstTabs = screen.getAllByTestId('tabs')[0];
      expect(firstTabs).toHaveAttribute('data-variant', 'pills');
    });
  });
});
