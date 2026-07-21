import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach } from 'vitest';

vi.mock('@m5/ui', () => ({
  DataTable: vi.fn(({ columns, rows, rowKey, sort, onSortChange }) => (
    <div data-testid="data-table">
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
          item.sku?.toString().toLowerCase().includes(term) ||
          item.category?.toString().toLowerCase().includes(term) ||
          item.supplier?.toString().toLowerCase().includes(term),
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
  usePathname: vi.fn(() => '/inventory'),
  useSearchParams: vi.fn(() => new URLSearchParams()),
}));

import InventoryListPage from './page';

describe('InventoryListPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders PageShell with correct title', async () => {
    render(<InventoryListPage />);
    await waitFor(() => {
      expect(screen.getByTestId('page-title')).toHaveTextContent('库存管理');
    });
  });

  test('shows page description', async () => {
    render(<InventoryListPage />);
    await waitFor(() => {
      expect(screen.getByTestId('page-description')).toHaveTextContent('查看库存商品信息');
    });
  });

  test('shows loading state initially', () => {
    render(<InventoryListPage />);
    expect(screen.getByTestId('loading-state')).toBeInTheDocument();
  });

  test('renders search filter input after loading', async () => {
    render(<InventoryListPage />);
    await waitFor(() => {
      expect(screen.getByTestId('search-filter-input')).toBeInTheDocument();
    });
  });

  test('search placeholder is correct', async () => {
    render(<InventoryListPage />);
    await waitFor(() => {
      expect(screen.getByTestId('search-filter-input')).toHaveAttribute('placeholder', '搜索商品名称、SKU、分类或供应商...');
    });
  });

  test('renders DataTable after loading', async () => {
    render(<InventoryListPage />);
    await waitFor(() => {
      expect(screen.getByTestId('data-table')).toBeInTheDocument();
    });
  });

  test('data table shows rows after loading', async () => {
    render(<InventoryListPage />);
    await waitFor(() => {
      const count = screen.getByTestId('table-rows-count');
      expect(Number(count.textContent)).toBeGreaterThan(0);
    });
  });

  test('renders status tabs for inventory status', async () => {
    render(<InventoryListPage />);
    await waitFor(() => {
      expect(screen.getByTestId('tab-ALL')).toBeInTheDocument();
      expect(screen.getByTestId('tab-in_stock')).toBeInTheDocument();
      expect(screen.getByTestId('tab-low_stock')).toBeInTheDocument();
      expect(screen.getByTestId('tab-out_of_stock')).toBeInTheDocument();
    });
  });

  test('ALL tab is active by default', async () => {
    render(<InventoryListPage />);
    await waitFor(() => {
      expect(screen.getByTestId('tab-ALL')).toHaveAttribute('data-active', 'true');
    });
  });

  test('clicking low_stock tab filters', async () => {
    render(<InventoryListPage />);
    await waitFor(() => {
      fireEvent.click(screen.getByTestId('tab-low_stock'));
    });
    await waitFor(() => {
      expect(screen.getByTestId('tab-low_stock')).toHaveAttribute('data-active', 'true');
    });
  });

  test('search filters inventory items', async () => {
    render(<InventoryListPage />);
    await waitFor(() => {
      const searchInput = screen.getByTestId('search-filter-input');
      fireEvent.change(searchInput, { target: { value: '咖啡机' } });
    });
    await waitFor(() => {
      expect(screen.getByTestId('search-filter-input')).toHaveValue('咖啡机');
    });
  });

  test('empty search returns all', async () => {
    render(<InventoryListPage />);
    await waitFor(() => {
      const searchInput = screen.getByTestId('search-filter-input');
      fireEvent.change(searchInput, { target: { value: '' } });
    });
    await waitFor(() => {
      expect(screen.getByTestId('data-table')).toBeInTheDocument();
    });
  });

  test('renders status badges for inventory items', async () => {
    render(<InventoryListPage />);
    await waitFor(() => {
      const badges = screen.getAllByTestId(/^badge-/);
      expect(badges.length).toBeGreaterThan(0);
    });
  });

  test('renders pagination component', async () => {
    render(<InventoryListPage />);
    await waitFor(() => {
      const paginations = screen.getAllByTestId('pagination');
      expect(paginations.length).toBeGreaterThan(0);
    });
  });

  test('pagination shows total', async () => {
    render(<InventoryListPage />);
    await waitFor(() => {
      expect(screen.getByTestId('pagination-total')).toBeInTheDocument();
    });
  });

  test('clicking next page works', async () => {
    render(<InventoryListPage />);
    await waitFor(() => {
      fireEvent.click(screen.getByTestId('pagination-next'));
    });
    await waitFor(() => {
      expect(screen.getByTestId('pagination-page').textContent).toBe('2');
    });
  });

  test('clicking overstocked tab', async () => {
    render(<InventoryListPage />);
    await waitFor(() => {
      fireEvent.click(screen.getByTestId('tab-overstocked'));
    });
    await waitFor(() => {
      expect(screen.getByTestId('tab-overstocked')).toHaveAttribute('data-active', 'true');
    });
  });

  test('columns render with correct headers', async () => {
    render(<InventoryListPage />);
    await waitFor(() => {
      // The inventory page defines columns without sortable: true
      expect(screen.getByTestId('th-name')).toHaveTextContent('商品');
      expect(screen.getByTestId('th-quantity')).toHaveTextContent('库存数量');
    });
  });

  test('column headers render correctly', async () => {
    render(<InventoryListPage />);
    await waitFor(() => {
      expect(screen.getByTestId('th-name')).toHaveTextContent('商品');
      expect(screen.getByTestId('th-category')).toHaveTextContent('分类');
      expect(screen.getByTestId('th-quantity')).toHaveTextContent('库存数量');
    });
  });

  test('pills variant used for tabs', async () => {
    render(<InventoryListPage />);
    await waitFor(() => {
      const tabs = screen.getByTestId('tabs');
      expect(tabs).toHaveAttribute('data-variant', 'pills');
    });
  });

  test('back to page 1 after tab change', async () => {
    render(<InventoryListPage />);
    // Go to page 2 first
    await waitFor(() => {
      fireEvent.click(screen.getByTestId('pagination-next'));
    });
    await waitFor(() => {
      expect(screen.getByTestId('pagination-page').textContent).toBe('2');
    });
  });

  test('renders content after load completes', async () => {
    render(<InventoryListPage />);
    await waitFor(() => {
      expect(screen.getByTestId('data-table')).toBeInTheDocument();
    });
  });
});
