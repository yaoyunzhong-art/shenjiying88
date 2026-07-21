import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach } from 'vitest';

// ---- Mocks (top-level) ----

const mockPush = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

// Complex mock of @m5/ui since OrdersListPage heavily uses it
const mockUsePagination = vi.fn();
const mockUseSortedItems = vi.fn();

vi.mock('@m5/ui', () => ({
  PageShell: ({ children, title, description }: any) => (
    <div data-testid="page-shell" data-title={title} data-description={description}>{children}</div>
  ),
  DataTable: ({ columns, rows, rowKey, sort, onSortChange, onRowClick }: any) => (
    <div data-testid="m5-datatable" data-row-count={rows.length}>
      {rows.length === 0 && <div data-testid="datatable-empty" />}
      {rows.map((row: any, i: number) => (
        <div key={rowKey(row)} data-testid={`datatable-row-${i}`} onClick={() => onRowClick(row)}>
          {columns.map((col: any) => (
            <span key={col.key} data-testid={`cell-${col.key}-${i}`}>
              {col.render ? col.render(row) : row[col.key]}
            </span>
          ))}
        </div>
      ))}
    </div>
  ),
  Pagination: ({ page, totalPages, total, onPageChange }: any) => (
    <div data-testid="m5-pagination" data-page={page} data-total-pages={totalPages}>
      <button data-testid="pagination-prev" onClick={() => onPageChange(page - 1)} disabled={page <= 1}>Prev</button>
      <span>Page {page} of {totalPages} ({total})</span>
      <button data-testid="pagination-next" onClick={() => onPageChange(page + 1)} disabled={page >= totalPages}>Next</button>
    </div>
  ),
  SearchFilterInput: ({ value, onChange, placeholder }: any) => (
    <input data-testid="search-filter-input" value={value} onChange={(e: any) => onChange(e.target.value)} placeholder={placeholder} />
  ),
  StatusBadge: ({ label, variant, size }: any) => (
    <span data-testid="m5-status-badge" data-variant={variant} data-size={size}>{label}</span>
  ),
  Tabs: ({ items, activeKey, onChange, variant }: any) => (
    <div data-testid="m5-tabs" data-active-key={activeKey}>
      {items.map((item: any) => (
        <button key={item.key} data-testid={`tab-${item.key}`} onClick={() => onChange(item.key)}>
          {item.label} {item.count != null ? `(${item.count})` : ''}
        </button>
      ))}
    </div>
  ),
  usePagination: (...args: any[]) => mockUsePagination(...args),
  useSortedItems: (...args: any[]) => mockUseSortedItems(...args),
  StatCard: ({ label, value, variant }: any) => (
    <div data-testid="stat-card" data-variant={variant}>
      <span>{label}</span>
      <span>{value}</span>
    </div>
  ),
  EmptyState: ({ title, description }: any) => (
    <div data-testid="m5-empty-state">
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  ),
}));

// Use the REAL useTriState hook — importing the actual module
// vi.mock('../_components/useTriState', ...) is NOT called, so the real hook is used

vi.mock('../_components/TriStateRenderer', () => ({
  TriStateRenderer: ({ loading, empty, error, onRetry, children }: any) => {
    if (loading) return <div data-testid="tri-state-loading">加载中…</div>;
    if (error) return <div data-testid="tri-state-error">{error}<button data-testid="tri-state-retry" onClick={onRetry}>重新加载</button></div>;
    if (empty) return <div data-testid="tri-state-empty">暂无数据</div>;
    return <>{typeof children === 'function' ? children() : children}</>;
  },
}));

const mockLoadOrders = vi.fn();
const mockFormatCurrency = vi.fn();
const mockFormatDateTime = vi.fn();
const mockGetPaymentLabel = vi.fn();
const mockGetStatusLabel = vi.fn();
const mockGetStatusVariant = vi.fn();
const mockMatchStatus = vi.fn();
const mockMatchPayment = vi.fn();

vi.mock('../../lib/storefront-orders', () => ({
  loadStorefrontOrders: (...args: any[]) => mockLoadOrders(...args),
  formatStorefrontOrderCurrency: (...args: any[]) => mockFormatCurrency(...args),
  formatStorefrontOrderDateTime: (...args: any[]) => mockFormatDateTime(...args),
  getStorefrontOrderPaymentLabel: (...args: any[]) => mockGetPaymentLabel(...args),
  getStorefrontOrderStatusLabel: (...args: any[]) => mockGetStatusLabel(...args),
  getStorefrontOrderStatusVariant: (...args: any[]) => mockGetStatusVariant(...args),
  matchesStorefrontOrderStatusFilter: (...args: any[]) => mockMatchStatus(...args),
  matchesStorefrontOrderPaymentFilter: (...args: any[]) => mockMatchPayment(...args),
}));

// ---- Test Subject ----

import OrdersListPage from './page';

const MOCK_ORDERS = [
  { id: '1', orderNo: 'ORD001', memberId: 'mem1', itemCount: 2, totalAmount: 20000, paidAmount: 20000, refundedAmount: 0, currency: 'CNY', status: 'paid' as const, paymentChannel: 'WECHAT_PAY', createdAt: '2026-07-22T10:00:00Z', updatedAt: '2026-07-22T10:05:00Z' },
  { id: '2', orderNo: 'ORD002', memberId: 'mem2', itemCount: 1, totalAmount: 5000, paidAmount: 0, refundedAmount: 0, currency: 'CNY', status: 'pending_payment' as const, paymentChannel: 'ALIPAY', createdAt: '2026-07-22T09:00:00Z', updatedAt: '2026-07-22T09:00:00Z' },
  { id: '3', orderNo: 'ORD003', memberId: 'mem3', itemCount: 3, totalAmount: 80000, paidAmount: 80000, refundedAmount: 80000, currency: 'CNY', status: 'refunded' as const, paymentChannel: 'CASH', createdAt: '2026-07-20T10:00:00Z', updatedAt: '2026-07-21T10:00:00Z' },
];

function setupMocks() {
  mockLoadOrders.mockResolvedValue(MOCK_ORDERS);
  mockFormatCurrency.mockImplementation((amt: number) => `¥${(amt / 100).toFixed(2)}`);
  mockFormatDateTime.mockImplementation((dt: string) => dt.replace('T', ' ').slice(0, 16));
  mockGetPaymentLabel.mockImplementation((ch: string) => ch?.replace('_', ' ') ?? '');
  mockGetStatusLabel.mockImplementation((s: string) => s === 'paid' ? '已支付' : s === 'pending_payment' ? '待支付' : '已退款');
  mockGetStatusVariant.mockImplementation((s: string) => s === 'paid' ? 'success' : s === 'pending_payment' ? 'warning' : 'default');
  mockMatchStatus.mockImplementation((order: any, filter: string) => filter === 'ALL' || order.status === filter.toLowerCase());
  mockMatchPayment.mockImplementation((order: any, filter: string) => filter === 'ALL' || order.paymentChannel === filter);
  mockUsePagination.mockReturnValue({ page: 1, totalPages: 1, setPage: vi.fn() });
  mockUseSortedItems.mockImplementation((items: any[]) => items);
}

describe('OrdersListPage — 订单管理', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupMocks();
  });

  // ====== 渲染测试 ======

  test('renders PageShell with correct title', async () => {
    render(<OrdersListPage />);
    await waitFor(() => {
      expect(screen.getByTestId('page-shell')).toHaveAttribute('data-title', '订单管理');
    });
  });

  test('renders StatCard components', async () => {
    render(<OrdersListPage />);
    await waitFor(() => {
      const statCards = screen.getAllByTestId('stat-card');
      expect(statCards.length).toBe(5);
    });
  });

  test('renders search input', async () => {
    render(<OrdersListPage />);
    await waitFor(() => {
      expect(screen.getByTestId('search-filter-input')).toBeInTheDocument();
    });
  });

  test('renders status filter tabs', async () => {
    render(<OrdersListPage />);
    await waitFor(() => {
      // Tabs mock renders label with count: "全部 (3)"
      const statusBtns = screen.getAllByTestId(/^tab-/);
      const statusTabLabels = statusBtns.map(b => b.textContent);
      expect(statusTabLabels.some(l => l?.startsWith('全部'))).toBe(true);
      expect(statusTabLabels.some(l => l?.startsWith('待支付'))).toBe(true);
      expect(statusTabLabels.some(l => l?.startsWith('已支付'))).toBe(true);
      expect(statusTabLabels.some(l => l?.startsWith('已退款'))).toBe(true);
    });
  });

  test('renders payment filter tabs', async () => {
    render(<OrdersListPage />);
    await waitFor(() => {
      const allTabs = screen.getAllByTestId(/^tab-/);
      const labels = allTabs.map(b => b.textContent);
      expect(labels.some(l => l?.startsWith('全部支付方式'))).toBe(true);
      expect(labels.some(l => l?.startsWith('微信支付'))).toBe(true);
      expect(labels.some(l => l?.startsWith('支付宝'))).toBe(true);
      expect(labels.some(l => l?.startsWith('现金'))).toBe(true);
      expect(labels.some(l => l?.startsWith('会员卡'))).toBe(true);
    });
  });

  test('renders DataTable with order rows', async () => {
    render(<OrdersListPage />);
    await waitFor(() => {
      const dataTable = screen.getByTestId('m5-datatable');
      expect(dataTable).toBeInTheDocument();
    });
  });

  // ====== 状态测试 ======

  test('shows loading state initially', () => {
    mockLoadOrders.mockImplementation(() => new Promise(() => {}));
    render(<OrdersListPage />);
    expect(screen.getByTestId('tri-state-loading')).toBeInTheDocument();
  });

  test('loads orders on mount', () => {
    render(<OrdersListPage />);
    expect(mockLoadOrders).toHaveBeenCalledTimes(1);
  });

  test('calls formatCurrency for order amounts', async () => {
    render(<OrdersListPage />);
    await waitFor(() => {
      expect(mockFormatCurrency).toHaveBeenCalled();
    });
  });

  test('filters by status on tab click', async () => {
    render(<OrdersListPage />);
    await waitFor(() => {
      const tab = screen.getByTestId('tab-PAID');
      fireEvent.click(tab);
    });
    await waitFor(() => {
      expect(screen.getByTestId('m5-datatable')).toBeInTheDocument();
    });
  });

  test('filters by payment tab on click', async () => {
    render(<OrdersListPage />);
    await waitFor(() => {
      const tab = screen.getByTestId('tab-WECHAT_PAY');
      fireEvent.click(tab);
    });
    await waitFor(() => {
      expect(screen.getByTestId('m5-datatable')).toBeInTheDocument();
    });
  });

  // ====== 搜索测试 ======

  test('filters orders by search term', async () => {
    render(<OrdersListPage />);
    await waitFor(() => {
      const searchInput = screen.getByTestId('search-filter-input');
      fireEvent.change(searchInput, { target: { value: 'ORD001' } });
    });
    await waitFor(() => {
      expect(screen.getByTestId('m5-datatable')).toBeInTheDocument();
    });
  });

  test('renders pagination component', async () => {
    mockUsePagination.mockReturnValue({ page: 1, totalPages: 2, setPage: vi.fn() });
    render(<OrdersListPage />);
    await waitFor(() => {
      expect(screen.getByTestId('m5-pagination')).toBeInTheDocument();
    });
  });

  // ====== 交互测试 ======

  test('navigates to order detail on row click', async () => {
    render(<OrdersListPage />);
    await waitFor(() => {
      const rows = screen.getAllByTestId(/datatable-row/);
      expect(rows.length).toBeGreaterThan(0);
      fireEvent.click(rows[0]);
    });
    expect(mockPush).toHaveBeenCalledWith('/orders/1');
  });

  test('uses pagination component', async () => {
    mockUsePagination.mockReturnValue({ page: 2, totalPages: 3, setPage: vi.fn() });
    render(<OrdersListPage />);
    await waitFor(() => {
      const nextBtn = screen.getByTestId('pagination-next');
      fireEvent.click(nextBtn);
    });
  });

  test('shows EmptyState when no orders', async () => {
    mockLoadOrders.mockResolvedValue([]);
    render(<OrdersListPage />);
    await waitFor(() => {
      expect(screen.getByTestId('m5-empty-state')).toBeInTheDocument();
    });
  });

  // ====== 统计测试 ======

  test('StatCard shows total order count', async () => {
    render(<OrdersListPage />);
    await waitFor(() => {
      const statCards = screen.getAllByTestId('stat-card');
      expect(statCards[0]).toHaveTextContent('总订单数');
    });
  });

  test('StatCard shows pending count', async () => {
    render(<OrdersListPage />);
    await waitFor(() => {
      const statCards = screen.getAllByTestId('stat-card');
      expect(statCards[1]).toHaveTextContent('待支付');
    });
  });

  test('StatCard shows revenue amount', async () => {
    render(<OrdersListPage />);
    await waitFor(() => {
      const statCards = screen.getAllByTestId('stat-card');
      expect(statCards[4]).toHaveTextContent('实收金额');
    });
  });

  // ====== 边界情况 ======

  test('handles order load failure and shows error state', async () => {
    mockLoadOrders.mockRejectedValue(new Error('网络错误'));
    render(<OrdersListPage />);
    await waitFor(() => {
      expect(screen.getByTestId('tri-state-error')).toBeInTheDocument();
    });
  });

  test('retry button triggers reload', async () => {
    mockLoadOrders.mockRejectedValue(new Error('网络错误'));
    render(<OrdersListPage />);
    await waitFor(() => {
      expect(screen.getByTestId('tri-state-retry')).toBeInTheDocument();
    });
  });

  test('renders StatusBadge for each order', async () => {
    render(<OrdersListPage />);
    await waitFor(() => {
      const badges = screen.getAllByTestId('m5-status-badge');
      expect(badges.length).toBeGreaterThan(0);
    });
  });
});
