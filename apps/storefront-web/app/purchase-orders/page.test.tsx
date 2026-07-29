/**
 * purchase-orders/page.vitest.tsx — 采购单列表页 L2 组件测试
 * 角色: 👔店长 / 💳采购
 * 覆盖: 渲染 · 统计卡片 · 搜索过滤 · 分页 · 表格 · 空态 · 状态标签
 *
 * 注意: vi.mock factory 是提升的(hoisted), 不能引用顶层变量, 数据必须内联在 factory 内。
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach } from 'vitest';

// ── Mock next/link ──

vi.mock('next/link', () => ({
  default: ({ children, href, ...rest }: any) => React.createElement('a', { href, ...rest }, children),
}));

// ── Mock @m5/ui ──

vi.mock('@m5/ui', () => ({
  DataTable: ({ columns, rows, rowKey, ...rest }: any) => (
    <div data-testid="data-table">
      {rows?.length === 0 ? (
        <div data-testid="empty-table">No Data</div>
      ) : (
        rows?.map((row: any) => (
          <div key={rowKey(row)} data-testid="table-row">
            {columns?.map((col: any) => (
              <span key={col.key} data-testid={`cell-${col.key}`}>
                {col.render ? col.render(row) : row[col.dataKey]}
              </span>
            ))}
          </div>
        ))
      )}
    </div>
  ),
  PageShell: ({ children, title, actions }: any) => (
    <div data-testid="page-shell" data-title={title}>
      {actions && <div data-testid="page-actions">{actions}</div>}
      {children}
    </div>
  ),
  Pagination: ({ page, totalPages, total, onPageChange }: any) => (
    <div data-testid="pagination" data-page={page} data-total-pages={totalPages} data-total={total}>
      <button data-testid="pag-prev" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>←</button>
      <span data-testid="pag-info">{page}/{totalPages}</span>
      <button data-testid="pag-next" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>→</button>
    </div>
  ),
  usePagination: (total: number, pageSize: number) => ({
    page: 1,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
    setPage: vi.fn(),
  }),
  SearchFilterInput: ({ value, onChange, placeholder }: any) => (
    <input data-testid="search-input" value={value || ''} onChange={(e: any) => onChange(e.target.value)} placeholder={placeholder} />
  ),
  useSearchFilter: (items: any[], fields: any[]) => {
    const [search, setSearch] = React.useState('');
    const filtered = search
      ? items.filter((item: any) =>
          fields.some((f: any) => String(item[f] || '').toLowerCase().includes(search.toLowerCase()))
        )
      : items;
    return { searchTerm: search, setSearchTerm: setSearch, filteredItems: filtered };
  },
  StatusBadge: ({ label, variant, size }: any) => (
    <span data-testid="status-badge" data-badge-variant={variant} data-size={size}>{label}</span>
  ),
  Button: ({ children, onClick, variant, ...rest }: any) => (
    <button data-testid={`btn-${variant || 'default'}`} onClick={onClick} {...rest}>{children}</button>
  ),
  EmptyState: ({ title, description }: any) => (
    <div data-testid="empty-state">
      <div data-testid="empty-title">{title}</div>
      <div data-testid="empty-desc">{description}</div>
    </div>
  ),
}));

// ── Test Subject ──

import PurchaseOrdersListPage from './page';

describe('PurchaseOrdersListPage — 采购单列表页', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ====== 正例: 渲染 ======

  test('renders without crashing', () => {
    expect(() => render(<PurchaseOrdersListPage />)).not.toThrow();
  });

  test('renders PageShell with title 采购单', async () => {
    render(<PurchaseOrdersListPage />);
    await waitFor(() => {
      expect(screen.getByTestId('page-shell')).toHaveAttribute('data-title', '采购单');
    });
  });

  test('renders 新建采购单 button', async () => {
    render(<PurchaseOrdersListPage />);
    await waitFor(() => {
      const actions = screen.getByTestId('page-actions');
      expect(actions.textContent).toContain('+ 新建采购单');
    });
  });

  test('new purchase order link has correct href', async () => {
    render(<PurchaseOrdersListPage />);
    await waitFor(() => {
      const link = screen.getByText('+ 新建采购单');
      expect(link.closest('a')).toHaveAttribute('href', '/purchase-orders/new');
    });
  });

  // ====== 统计卡片 ======

  test('renders stat cards', async () => {
    render(<PurchaseOrdersListPage />);
    await waitFor(() => {
      expect(screen.getByText('总采购单')).toBeInTheDocument();
      expect(screen.getByText('已收货')).toBeInTheDocument();
      expect(screen.getByText('总金额')).toBeInTheDocument();
    });
  });

  test('stat cards show correct values', async () => {
    render(<PurchaseOrdersListPage />);
    await waitFor(() => {
      expect(screen.getByText('8')).toBeInTheDocument(); // total
      expect(screen.getByText('2')).toBeInTheDocument(); // received
      expect(screen.getByText('¥11.7万')).toBeInTheDocument(); // total amount
    });
  });

  // ====== 搜索过滤 ======

  test('renders search input with correct placeholder', async () => {
    render(<PurchaseOrdersListPage />);
    await waitFor(() => {
      expect(screen.getByTestId('search-input')).toHaveAttribute('placeholder', '搜索采购单号、供应商、联系人...');
    });
  });

  test('search input filters by order number', async () => {
    render(<PurchaseOrdersListPage />);
    await waitFor(() => {
      expect(screen.getByText('PO-20260601-001')).toBeInTheDocument();
    });
    const searchInput = screen.getByTestId('search-input');
    fireEvent.change(searchInput, { target: { value: 'PO-20260605' } });
    await waitFor(() => {
      expect(screen.getByText('PO-20260605-002')).toBeInTheDocument();
      expect(screen.queryByText('PO-20260601-001')).not.toBeInTheDocument();
    });
  });

  test('search input filters by supplier name', async () => {
    render(<PurchaseOrdersListPage />);
    await waitFor(() => {
      expect(screen.getByText('广州美妆供应链有限公司')).toBeInTheDocument();
    });
    const searchInput = screen.getByTestId('search-input');
    fireEvent.change(searchInput, { target: { value: '上海' } });
    await waitFor(() => {
      expect(screen.getByText('上海日化贸易有限公司')).toBeInTheDocument();
      expect(screen.queryByText('广州美妆供应链有限公司')).not.toBeInTheDocument();
    });
  });

  test('clearing search restores all items', async () => {
    render(<PurchaseOrdersListPage />);
    await waitFor(() => {
      expect(screen.getByText('PO-20260601-001')).toBeInTheDocument();
      expect(screen.getByText('PO-20260622-008')).toBeInTheDocument();
    });
    const searchInput = screen.getByTestId('search-input');
    fireEvent.change(searchInput, { target: { value: 'PO-20260601' } });
    await waitFor(() => {
      expect(screen.getByText('PO-20260601-001')).toBeInTheDocument();
      expect(screen.queryByText('PO-20260622-008')).not.toBeInTheDocument();
    });
    fireEvent.change(searchInput, { target: { value: '' } });
    await waitFor(() => {
      expect(screen.getByText('PO-20260601-001')).toBeInTheDocument();
      expect(screen.getByText('PO-20260622-008')).toBeInTheDocument();
    });
  });

  // ====== 表格渲染 ======

  test('renders DataTable', async () => {
    render(<PurchaseOrdersListPage />);
    await waitFor(() => {
      expect(screen.getByTestId('data-table')).toBeInTheDocument();
    });
  });

  test('renders order numbers as links', async () => {
    render(<PurchaseOrdersListPage />);
    await waitFor(() => {
      expect(screen.getByText('PO-20260601-001')).toBeInTheDocument();
      expect(screen.getByText('PO-20260601-001').closest('a')).toHaveAttribute('href', '/purchase-orders/1');
    });
  });

  test('renders supplier names', async () => {
    render(<PurchaseOrdersListPage />);
    await waitFor(() => {
      expect(screen.getByText('广州美妆供应链有限公司')).toBeInTheDocument();
      expect(screen.getByText('上海日化贸易有限公司')).toBeInTheDocument();
    });
  });

  test('renders amounts with ¥ formatting', async () => {
    render(<PurchaseOrdersListPage />);
    await waitFor(() => {
      expect(screen.getByText('¥28,600')).toBeInTheDocument();
      expect(screen.getByText('¥15,800')).toBeInTheDocument();
    });
  });

  test('renders order dates', async () => {
    render(<PurchaseOrdersListPage />);
    await waitFor(() => {
      expect(screen.getByText('2026-06-01')).toBeInTheDocument();
      expect(screen.getByText('2026-06-22')).toBeInTheDocument();
    });
  });

  test('renders status badges with Chinese labels', async () => {
    render(<PurchaseOrdersListPage />);
    await waitFor(() => {
      const badges = screen.getAllByTestId('status-badge');
      const badgeTexts = badges.map(b => b.textContent);
      expect(badgeTexts).toContain('已收货');
      expect(badgeTexts).toContain('已发货');
      expect(badgeTexts).toContain('已取消');
      expect(badgeTexts).toContain('已确认');
      expect(badgeTexts).toContain('已提交');
      expect(badgeTexts).toContain('草稿');
    });
  });

  // ====== 分页 ======

  test('renders pagination', async () => {
    render(<PurchaseOrdersListPage />);
    await waitFor(() => {
      expect(screen.getByTestId('pagination')).toBeInTheDocument();
    });
  });

  test('pagination shows correct total (8 items, 10 per page = 1 page)', async () => {
    render(<PurchaseOrdersListPage />);
    await waitFor(() => {
      const pagInfo = screen.getByTestId('pag-info');
      expect(pagInfo.textContent).toBe('1/1');
    });
  });

  test('pagination shows total count', async () => {
    render(<PurchaseOrdersListPage />);
    await waitFor(() => {
      expect(screen.getByTestId('pagination')).toHaveAttribute('data-total', '8');
    });
  });

  // ====== 空态 ======

  test('empty state is not shown when there are results', async () => {
    render(<PurchaseOrdersListPage />);
    await waitFor(() => {
      expect(screen.queryByTestId('empty-state')).not.toBeInTheDocument();
    });
  });

  test('empty state shows when no items match filtered search', async () => {
    render(<PurchaseOrdersListPage />);
    await waitFor(() => {
      expect(screen.getByTestId('data-table')).toBeInTheDocument();
    });
    const searchInput = screen.getByTestId('search-input');
    fireEvent.change(searchInput, { target: { value: 'ZZZ-NO-MATCH-999' } });
    await waitFor(() => {
      expect(screen.getByTestId('empty-state')).toBeInTheDocument();
      expect(screen.getByText('暂无采购单')).toBeInTheDocument();
    });
  });

  // ====== 边界 ======

  test('order number link includes id in path', async () => {
    render(<PurchaseOrdersListPage />);
    await waitFor(() => {
      const link = screen.getByText('PO-20260601-001').closest('a');
      expect(link).toHaveAttribute('href', '/purchase-orders/1');
    });
  });

  test('expected delivery dates are rendered', async () => {
    render(<PurchaseOrdersListPage />);
    await waitFor(() => {
      expect(screen.getByText('2026-06-10')).toBeInTheDocument();
      expect(screen.getByText('2026-07-02')).toBeInTheDocument();
    });
  });
});
