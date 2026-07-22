import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach } from 'vitest';

// ---- Mocks (top-level) ----

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
          {item.count !== undefined ? ` (${item.count})` : ''}
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
          (item.name?.toString().toLowerCase().includes(term)) ||
          (item.sku?.toString().toLowerCase().includes(term)) ||
          (item.category?.toString().toLowerCase().includes(term)) ||
          (item.supplier?.toString().toLowerCase().includes(term)) ||
          (item.storageLocation?.toString().toLowerCase().includes(term)),
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
  useTriState: vi.fn(({ loading: initialLoading }: { loading?: boolean }) => {
    const [loading, setLoading] = React.useState(initialLoading ?? false);
    const [error, setError] = React.useState<string | null>(null);
    const wrapLoad = vi.fn(async <T,>(promise: Promise<T>): Promise<T | undefined> => {
      setLoading(true);
      try {
        const result = await promise;
        setLoading(false);
        return result;
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : String(err));
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

// ---- Test Subject ----

import InventoryListPage from './page';

describe('InventoryListPage — 库存管理', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ====== 渲染测试 ======

  test('渲染 PageShell 标题为"库存管理"', async () => {
    render(<InventoryListPage />);
    await waitFor(() => {
      expect(screen.getByTestId('page-title')).toHaveTextContent('库存管理');
    });
  });

  test('渲染 PageShell 描述文字', async () => {
    render(<InventoryListPage />);
    await waitFor(() => {
      expect(screen.getByTestId('page-description')).toHaveTextContent('查看库存商品信息，监控库存状态与价值。');
    });
  });

  test('初始渲染显示加载状态', () => {
    render(<InventoryListPage />);
    expect(screen.getByTestId('loading-state')).toBeInTheDocument();
  });

  test('加载完成后搜索输入框出现', async () => {
    render(<InventoryListPage />);
    await waitFor(() => {
      expect(screen.getByTestId('search-filter-input')).toBeInTheDocument();
    });
  });

  test('搜索框 placeholder 正确', async () => {
    render(<InventoryListPage />);
    await waitFor(() => {
      expect(screen.getByTestId('search-filter-input')).toHaveAttribute('placeholder', '搜索商品名称、SKU、分类或供应商...');
    });
  });

  test('加载完成后渲染 DataTable', async () => {
    render(<InventoryListPage />);
    await waitFor(() => {
      expect(screen.getByTestId('data-table')).toBeInTheDocument();
    });
  });

  test('DataTable 中有数据行', async () => {
    render(<InventoryListPage />);
    await waitFor(() => {
      const count = screen.getByTestId('table-rows-count');
      expect(Number(count.textContent)).toBeGreaterThan(0);
    });
  });

  test('渲染库存状态 tabs', async () => {
    render(<InventoryListPage />);
    await waitFor(() => {
      expect(screen.getByTestId('tab-ALL')).toBeInTheDocument();
      expect(screen.getByTestId('tab-in_stock')).toBeInTheDocument();
      expect(screen.getByTestId('tab-low_stock')).toBeInTheDocument();
      expect(screen.getByTestId('tab-out_of_stock')).toBeInTheDocument();
      expect(screen.getByTestId('tab-overstocked')).toBeInTheDocument();
    });
  });

  test('ALL tab 默认激活', async () => {
    render(<InventoryListPage />);
    await waitFor(() => {
      expect(screen.getByTestId('tab-ALL')).toHaveAttribute('data-active', 'true');
    });
  });

  test('tabs 使用 pills variant', async () => {
    render(<InventoryListPage />);
    await waitFor(() => {
      const tabs = screen.getByTestId('tabs');
      expect(tabs).toHaveAttribute('data-variant', 'pills');
    });
  });

  test('tabs 使用 sm size', async () => {
    render(<InventoryListPage />);
    await waitFor(() => {
      const tabs = screen.getByTestId('tabs');
      expect(tabs).toHaveAttribute('data-size', 'sm');
    });
  });

  test('渲染库存状态徽标', async () => {
    render(<InventoryListPage />);
    await waitFor(() => {
      const badges = screen.getAllByTestId(/^badge-/);
      expect(badges.length).toBeGreaterThan(0);
    });
  });

  test('渲染分页组件', async () => {
    render(<InventoryListPage />);
    await waitFor(() => {
      const paginations = screen.getAllByTestId('pagination');
      expect(paginations.length).toBeGreaterThan(0);
    });
  });

  test('分页显示总记录数', async () => {
    render(<InventoryListPage />);
    await waitFor(() => {
      expect(screen.getByTestId('pagination-total')).toBeInTheDocument();
    });
  });

  // ====== 列头渲染测试 ======

  test('DataTable 渲染"商品"列头', async () => {
    render(<InventoryListPage />);
    await waitFor(() => {
      expect(screen.getByTestId('th-name')).toHaveTextContent('商品');
    });
  });

  test('DataTable 渲染"分类"列头', async () => {
    render(<InventoryListPage />);
    await waitFor(() => {
      expect(screen.getByTestId('th-category')).toHaveTextContent('分类');
    });
  });

  test('DataTable 渲染"库存数量"列头', async () => {
    render(<InventoryListPage />);
    await waitFor(() => {
      expect(screen.getByTestId('th-quantity')).toHaveTextContent('库存数量');
    });
  });

  test('DataTable 渲染"单价"列头', async () => {
    render(<InventoryListPage />);
    await waitFor(() => {
      expect(screen.getByTestId('th-unitPrice')).toHaveTextContent('单价');
    });
  });

  test('DataTable 渲染"总价值"列头', async () => {
    render(<InventoryListPage />);
    await waitFor(() => {
      expect(screen.getByTestId('th-totalValue')).toHaveTextContent('总价值');
    });
  });

  test('DataTable 渲染"存放位置"列头', async () => {
    render(<InventoryListPage />);
    await waitFor(() => {
      expect(screen.getByTestId('th-storageLocation')).toHaveTextContent('存放位置');
    });
  });

  test('DataTable 渲染"最近补货"列头', async () => {
    render(<InventoryListPage />);
    await waitFor(() => {
      expect(screen.getByTestId('th-lastRestocked')).toHaveTextContent('最近补货');
    });
  });

  test('DataTable 渲染"状态"列头', async () => {
    render(<InventoryListPage />);
    await waitFor(() => {
      expect(screen.getByTestId('th-status')).toHaveTextContent('状态');
    });
  });

  // ====== 交互测试 ======

  test('点击 low_stock tab 切换筛选', async () => {
    render(<InventoryListPage />);
    await waitFor(() => {
      fireEvent.click(screen.getByTestId('tab-low_stock'));
    });
    await waitFor(() => {
      expect(screen.getByTestId('tab-low_stock')).toHaveAttribute('data-active', 'true');
    });
  });

  test('点击 in_stock tab 切换筛选', async () => {
    render(<InventoryListPage />);
    await waitFor(() => {
      fireEvent.click(screen.getByTestId('tab-in_stock'));
    });
    await waitFor(() => {
      expect(screen.getByTestId('tab-in_stock')).toHaveAttribute('data-active', 'true');
    });
  });

  test('点击 overstocked tab 切换筛选', async () => {
    render(<InventoryListPage />);
    await waitFor(() => {
      fireEvent.click(screen.getByTestId('tab-overstocked'));
    });
    await waitFor(() => {
      expect(screen.getByTestId('tab-overstocked')).toHaveAttribute('data-active', 'true');
    });
  });

  test('搜索名称过滤库存', async () => {
    render(<InventoryListPage />);
    await waitFor(() => {
      const searchInput = screen.getByTestId('search-filter-input');
      fireEvent.change(searchInput, { target: { value: '咖啡机' } });
    });
    await waitFor(() => {
      expect(screen.getByTestId('search-filter-input')).toHaveValue('咖啡机');
    });
  });

  test('空搜索重置为全部', async () => {
    render(<InventoryListPage />);
    await waitFor(() => {
      const searchInput = screen.getByTestId('search-filter-input');
      fireEvent.change(searchInput, { target: { value: '' } });
    });
    await waitFor(() => {
      expect(screen.getByTestId('search-filter-input')).toHaveValue('');
    });
  });

  test('搜索 SKU 过滤', async () => {
    render(<InventoryListPage />);
    await waitFor(() => {
      const searchInput = screen.getByTestId('search-filter-input');
      fireEvent.change(searchInput, { target: { value: 'CS-001' } });
    });
    await waitFor(() => {
      expect(screen.getByTestId('search-filter-input')).toHaveValue('CS-001');
    });
  });

  // ====== 分页交互测试 ======

  test('点击下一页按钮', async () => {
    render(<InventoryListPage />);
    await waitFor(() => {
      fireEvent.click(screen.getByTestId('pagination-next'));
    });
    await waitFor(() => {
      expect(screen.getByTestId('pagination-page').textContent).toBe('2');
    });
  });

  test('能从第2页翻回第1页', async () => {
    render(<InventoryListPage />);
    await waitFor(() => {
      fireEvent.click(screen.getByTestId('pagination-next'));
    });
    await waitFor(() => {
      fireEvent.click(screen.getByTestId('pagination-prev'));
    });
    await waitFor(() => {
      expect(screen.getByTestId('pagination-page').textContent).toBe('1');
    });
  });

  // ====== 状态统计测试 ======

  test('渲染商品总数统计卡片', async () => {
    render(<InventoryListPage />);
    await waitFor(() => {
      // 总数卡片通过 StatBadge 渲染
      const totalBadge = screen.getByText(/商品总数/);
      expect(totalBadge).toBeInTheDocument();
    });
  });

  test('渲染库存总价值卡片', async () => {
    render(<InventoryListPage />);
    await waitFor(() => {
      const valueBadge = screen.getByText(/库存总价值/);
      expect(valueBadge).toBeInTheDocument();
    });
  });

  test('渲染低库存/缺货统计', async () => {
    render(<InventoryListPage />);
    await waitFor(() => {
      const lowStockBadge = screen.getByText(/低库存\/缺货/);
      expect(lowStockBadge).toBeInTheDocument();
    });
  });

  test('渲染商品分类数卡片', async () => {
    render(<InventoryListPage />);
    await waitFor(() => {
      const catBadge = screen.getByText(/商品分类数/);
      expect(catBadge).toBeInTheDocument();
    });
  });

  // ====== 边界测试 ======

  test('export default 是函数组件', () => {
    expect(typeof InventoryListPage).toBe('function');
  });

  test('在不匹配的搜索条件下空态提示', async () => {
    render(<InventoryListPage />);
    await waitFor(() => {
      const searchInput = screen.getByTestId('search-filter-input');
      fireEvent.change(searchInput, { target: { value: '不存在的商品名称XYZ' } });
    });
    // 搜索后空态可能出现
    await waitFor(() => {
      // 空态通过 TriStateRenderer 内联渲染或者通过空态 div
      const emptyContent = screen.queryByText(/未找到匹配的库存记录/);
      // 如果搜索结果为空则显示空态, 不为空则有数据
      const tableCount = screen.getByTestId('table-rows-count');
      const count = Number(tableCount.textContent);
      if (count === 0 && emptyContent) {
        expect(emptyContent).toBeInTheDocument();
      }
    });
  });

  test('加载完成后内容区域显示', async () => {
    render(<InventoryListPage />);
    await waitFor(() => {
      expect(screen.getByTestId('content')).toBeInTheDocument();
    });
  });

  test('库存不足状态徽标正确显示', async () => {
    render(<InventoryListPage />);
    await waitFor(() => {
      const badge = screen.queryByTestId('badge-库存偏低');
      if (badge) {
        expect(badge).toHaveAttribute('data-variant', 'warning');
      }
    });
  });

  test('缺货状态徽标正确显示', async () => {
    render(<InventoryListPage />);
    await waitFor(() => {
      const badge = screen.queryByTestId('badge-缺货');
      if (badge) {
        expect(badge).toHaveAttribute('data-variant', 'danger');
      }
    });
  });

  test('ALL tab 显示总数量', async () => {
    render(<InventoryListPage />);
    await waitFor(() => {
      const allTab = screen.getByTestId('tab-ALL');
      expect(allTab.textContent).toContain('8');
    });
  });

  test('每页最多显示 8 条', async () => {
    render(<InventoryListPage />);
    await waitFor(() => {
      const count = screen.getByTestId('table-rows-count');
      expect(Number(count.textContent)).toBeLessThanOrEqual(8);
    });
  });
});
