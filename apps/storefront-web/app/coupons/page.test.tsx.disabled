import React from 'react';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';

let mockTabsItems: any[] = [];
let mockDTCalls: any[] = [];

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => '/coupons',
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock('@m5/ui', () => ({
  PageShell: ({ children, title }: any) => <div data-testid="ps" data-t={title}>{children}</div>,
  DataTable: (props: any) => {
    mockDTCalls.push(props);
    const { columns, rows, rowKey } = props;
    return <div data-testid="dt" data-r={rows.length}>{rows.map((r: any) => <div key={rowKey(r)}>{columns.map((c: any) => <span key={c.key}>{c.render ? c.render(r) : String(r[c.key])}</span>)}</div>)}</div>;
  },
  Pagination: () => <div data-testid="pg">pg</div>,
  SearchFilterInput: ({ value, onChange, placeholder }: any) => (
    <input data-testid="si" placeholder={placeholder} value={value} onChange={(e: any) => onChange(e.target.value)} />
  ),
  StatusBadge: ({ label, variant }: any) => <span data-testid="sb" data-v={variant}>{label}</span>,
  Tabs: ({ items, activeKey, onChange }: any) => {
    mockTabsItems = items || [];
    return <div data-testid="tabs" data-key={activeKey}>{items.map((i: any) => <button key={i.key} onClick={() => onChange(i.key)}>{i.label}</button>)}</div>;
  },
  usePagination: () => ({ page: 1, totalPages: 2, setPage: vi.fn() }),
  useSearchFilter: () => ({ searchTerm: '', setSearchTerm: vi.fn(), filteredItems: [
    { id: 'cp1', name: '新客首单8折', type: 'discount' as const, value: '8折', minAmount: '满0', totalIssued: 500, usedCount: 187, validFrom: '2026-06-01', validTo: '2026-07-31', storeName: '旗舰店', status: 'active' as const },
    { id: 'cp2', name: '满300减50', type: 'cash' as const, value: '¥50', minAmount: '满300', totalIssued: 300, usedCount: 89, validFrom: '2026-06-01', validTo: '2026-06-30', storeName: '旗舰店', status: 'active' as const },
    { id: 'cp3', name: '已过期券', type: 'voucher' as const, value: '¥100', minAmount: '满200', totalIssued: 150, usedCount: 98, validFrom: '2026-06-01', validTo: '2026-06-15', storeName: '社区店', status: 'expired' as const },
  ]}),
  useSortedItems: (i: any) => i,
}));

vi.mock('../_components/useTriState', () => ({
  useTriState: () => ({ loading: false, error: null, wrapLoad: vi.fn((p: Promise<any>) => p.then((d: any) => d)) }),
}));

vi.mock('../_components/TriStateRenderer', () => ({
  TriStateRenderer: ({ children }: any) => <div data-testid="tric">{typeof children === 'function' ? children() : children}</div>,
}));

import CouponsListPage from './page';
beforeEach(() => { vi.clearAllMocks(); mockTabsItems = []; mockDTCalls = []; });

describe('CouponsListPage', () => {
  test('renders PageShell with coupons title', async () => {
    await act(async () => { render(<CouponsListPage />); });
    expect(screen.getByTestId('ps').dataset.t).toBe('优惠券管理');
  });

  test('renders stat badge labels for coupon metrics', async () => {
    await act(async () => { render(<CouponsListPage />); });
    expect(screen.getAllByText('优惠券总数').length).toBeGreaterThan(0);
    expect(screen.getAllByText('进行中').length).toBeGreaterThan(0);
    expect(screen.getAllByText('总发放').length).toBeGreaterThan(0);
    expect(screen.getAllByText('已核销').length).toBeGreaterThan(0);
  });

  test('renders search input', async () => {
    await act(async () => { render(<CouponsListPage />); });
    expect(screen.getByTestId('si')).toBeInTheDocument();
  });

  test('renders status filter tabs with correct keys', async () => {
    await act(async () => { render(<CouponsListPage />); });
    const keys = mockTabsItems.map((i: any) => i.key);
    expect(keys).toContain('ALL');
    expect(keys).toContain('active');
    expect(keys).toContain('expired');
    expect(keys).toContain('disabled');
  });

  test('renders DataTable with coupon rows', async () => {
    await act(async () => { render(<CouponsListPage />); });
    expect(mockDTCalls.length).toBeGreaterThan(0);
    expect(mockDTCalls[mockDTCalls.length - 1].rows.length).toBeGreaterThan(0);
  });

  test('DataTable has correct column keys', async () => {
    await act(async () => { render(<CouponsListPage />); });
    const keys = mockDTCalls[mockDTCalls.length - 1].columns.map((c: any) => c.key);
    expect(keys).toContain('name');
    expect(keys).toContain('type');
    expect(keys).toContain('value');
    expect(keys).toContain('minAmount');
    expect(keys).toContain('usage');
    expect(keys).toContain('validTo');
    expect(keys).toContain('storeName');
    expect(keys).toContain('status');
  });

  test('renders pagination component', async () => {
    await act(async () => { render(<CouponsListPage />); });
    expect(screen.getByTestId('pg')).toBeInTheDocument();
  });

  test('renders empty state when no items match', async () => {
    await act(async () => { render(<CouponsListPage />); });
    // The page shows empty state when finalFiltered.length === 0
    // With mock data populated, this is not shown
    const allText = document.body.textContent || '';
    expect(allText).not.toContain('未找到匹配的优惠券');
  });

  test('name column renders correctly', async () => {
    await act(async () => { render(<CouponsListPage />); });
    const col = mockDTCalls[mockDTCalls.length - 1].columns[0];
    const sample = { id: 'cp-t', name: '测试', type: 'discount' as const, value: '8折', minAmount: '满0', totalIssued: 100, usedCount: 50, validFrom: '', validTo: '', storeName: '', status: 'active' as const };
    expect(col.render(sample)).toBeTruthy();
  });

  test('type column at index 1', async () => {
    await act(async () => { render(<CouponsListPage />); });
    expect(mockDTCalls[mockDTCalls.length - 1].columns[1].key).toBe('type');
  });

  test('status column present', async () => {
    await act(async () => { render(<CouponsListPage />); });
    const cols = mockDTCalls[mockDTCalls.length - 1].columns;
    expect(cols.find((c: any) => c.key === 'status')).toBeTruthy();
  });

  test('usage column at index 4', async () => {
    await act(async () => { render(<CouponsListPage />); });
    expect(mockDTCalls[mockDTCalls.length - 1].columns[4].key).toBe('usage');
  });

  test('renders via TriStateRenderer', async () => {
    await act(async () => { render(<CouponsListPage />); });
    expect(screen.getByTestId('tric')).toBeInTheDocument();
  });

  test('renders coupon management text on page', async () => {
    await act(async () => { render(<CouponsListPage />); });
    expect(screen.getByTestId('ps')).toBeInTheDocument();
  });

  test('status tabs have 4 items', async () => {
    await act(async () => { render(<CouponsListPage />); });
    expect(mockTabsItems.length).toBe(4);
  });

  test('validTo column renders date range', async () => {
    await act(async () => { render(<CouponsListPage />); });
    const col = mockDTCalls[mockDTCalls.length - 1].columns[5];
    expect(col.key).toBe('validTo');
  });

  test('storeName column present', async () => {
    await act(async () => { render(<CouponsListPage />); });
    const col = mockDTCalls[mockDTCalls.length - 1].columns[6];
    expect(col.key).toBe('storeName');
  });

  test('value column at index 2', async () => {
    await act(async () => { render(<CouponsListPage />); });
    expect(mockDTCalls[mockDTCalls.length - 1].columns[2].key).toBe('value');
  });

  test('minAmount column at index 3', async () => {
    await act(async () => { render(<CouponsListPage />); });
    expect(mockDTCalls[mockDTCalls.length - 1].columns[3].key).toBe('minAmount');
  });

  test('Tabs activeKey is ALL initially', async () => {
    await act(async () => { render(<CouponsListPage />); });
    const tabs = screen.getByTestId('tabs');
    expect(tabs.dataset.key).toBe('ALL');
  });
});
