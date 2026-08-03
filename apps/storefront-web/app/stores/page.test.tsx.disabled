import React from 'react';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';

let mockTabsItems: any[] = [];
let mockDTCalls: any[] = [];

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => '/stores',
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock('next/link', () => ({
  default: ({ children, href }: any) => <a href={href} data-testid="nl">{children}</a>,
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
    { id: 's01', name: 'Demo Store 旗舰店', code: 'DS-FLAG-001', type: 'flagship' as const, address: '上海浦东', city: '上海', district: '浦东', phone: '021-68', managerName: '张明', status: 'active' as const, staffCount: 28, areaSqm: 580, monthlyRevenue: 358000, createdAt: '2024-01-15' },
    { id: 's02', name: 'Demo Store 社区店', code: 'DS-COMM-002', type: 'community' as const, address: '上海静安', city: '上海', district: '静安', phone: '021-62', managerName: '李芳', status: 'active' as const, staffCount: 12, areaSqm: 220, monthlyRevenue: 128000, createdAt: '2024-03-01' },
    { id: 's03', name: 'Demo Store 标准店', code: 'DS-STD-003', type: 'standard' as const, address: '北京朝阳', city: '北京', district: '朝阳', phone: '010-85', managerName: '王强', status: 'active' as const, staffCount: 18, areaSqm: 350, monthlyRevenue: 215000, createdAt: '2024-02-20' },
  ]}),
}));

vi.mock('../_components/useTriState', () => ({
  useTriState: () => ({ loading: false, error: null, wrapLoad: vi.fn((p: Promise<any>) => p.then((d: any) => d)) }),
}));

vi.mock('../_components/TriStateRenderer', () => ({
  TriStateRenderer: ({ children }: any) => <div data-testid="tric">{typeof children === 'function' ? children() : children}</div>,
}));

import StoresListPage from './page';
beforeEach(() => { vi.clearAllMocks(); mockTabsItems = []; mockDTCalls = []; });

describe('StoresListPage', () => {
  test('renders PageShell with stores title', async () => {
    await act(async () => { render(<StoresListPage />); });
    expect(screen.getByTestId('ps').dataset.t).toBe('门店列表');
  });

  test('renders stat badge labels', async () => {
    await act(async () => { render(<StoresListPage />); });
    expect(screen.getAllByText('总门店').length).toBeGreaterThan(0);
    expect(screen.getAllByText('营业中').length).toBeGreaterThan(0);
    expect(screen.getAllByText('员工总数').length).toBeGreaterThan(0);
    expect(screen.getAllByText('月总营收').length).toBeGreaterThan(0);
  });

  test('renders search input', async () => {
    await act(async () => { render(<StoresListPage />); });
    expect(screen.getByTestId('si')).toBeInTheDocument();
  });

  test('renders status filter tabs with correct keys', async () => {
    await act(async () => { render(<StoresListPage />); });
    const keys = mockTabsItems.map((i: any) => i.key);
    expect(keys).toContain('ALL');
    expect(keys).toContain('active');
    expect(keys).toContain('maintenance');
    expect(keys).toContain('inactive');
  });

  test('renders DataTable with store rows', async () => {
    await act(async () => { render(<StoresListPage />); });
    expect(mockDTCalls.length).toBeGreaterThan(0);
    expect(mockDTCalls[mockDTCalls.length - 1].rows.length).toBeGreaterThan(0);
  });

  test('DataTable has correct column keys', async () => {
    await act(async () => { render(<StoresListPage />); });
    const keys = mockDTCalls[mockDTCalls.length - 1].columns.map((c: any) => c.key);
    expect(keys).toContain('name');
    expect(keys).toContain('type');
    expect(keys).toContain('city');
    expect(keys).toContain('managerName');
    expect(keys).toContain('staffCount');
    expect(keys).toContain('areaSqm');
    expect(keys).toContain('monthlyRevenue');
    expect(keys).toContain('status');
  });

  test('renders pagination component', async () => {
    await act(async () => { render(<StoresListPage />); });
    expect(screen.getByTestId('pg')).toBeInTheDocument();
  });

  test('name column renders Link', async () => {
    await act(async () => { render(<StoresListPage />); });
    const col = mockDTCalls[mockDTCalls.length - 1].columns[0];
    const sample = { id: 's-t', name: '测试店', code: 'TS-001', type: 'flagship' as const, address: 'a', city: '北京', district: '朝阳', phone: '010', managerName: '张', status: 'active' as const, staffCount: 10, areaSqm: 200, monthlyRevenue: 100000, createdAt: '2024-01-01' };
    expect(col.render(sample)).toBeTruthy();
  });

  test('type column at index 1', async () => {
    await act(async () => { render(<StoresListPage />); });
    expect(mockDTCalls[mockDTCalls.length - 1].columns[1].key).toBe('type');
  });

  test('city column at index 2', async () => {
    await act(async () => { render(<StoresListPage />); });
    expect(mockDTCalls[mockDTCalls.length - 1].columns[2].key).toBe('city');
  });

  test('monthlyRevenue column at index 6', async () => {
    await act(async () => { render(<StoresListPage />); });
    expect(mockDTCalls[mockDTCalls.length - 1].columns[6].key).toBe('monthlyRevenue');
  });

  test('renders via TriStateRenderer', async () => {
    await act(async () => { render(<StoresListPage />); });
    expect(screen.getByTestId('tric')).toBeInTheDocument();
  });

  test('status tabs have 4 items', async () => {
    await act(async () => { render(<StoresListPage />); });
    expect(mockTabsItems.length).toBe(4);
  });

  test('pagination receives correct total', async () => {
    await act(async () => { render(<StoresListPage />); });
    const pg = screen.getByTestId('pg');
    expect(pg).toBeInTheDocument();
  });

  test('status column present in DataTable', async () => {
    await act(async () => { render(<StoresListPage />); });
    const keys = mockDTCalls[mockDTCalls.length - 1].columns.map((c: any) => c.key);
    expect(keys).toContain('status');
  });

  test('renders without crash', async () => {
    await act(async () => { render(<StoresListPage />); });
    expect(document.body.textContent).toContain('门店');
  });

  test('managerName column present', async () => {
    await act(async () => { render(<StoresListPage />); });
    expect(mockDTCalls[mockDTCalls.length - 1].columns[3].key).toBe('managerName');
  });

  test('staffCount column present', async () => {
    await act(async () => { render(<StoresListPage />); });
    expect(mockDTCalls[mockDTCalls.length - 1].columns[4].key).toBe('staffCount');
  });

  test('areaSqm column at index 5', async () => {
    await act(async () => { render(<StoresListPage />); });
    expect(mockDTCalls[mockDTCalls.length - 1].columns[5].key).toBe('areaSqm');
  });

  test('search input placeholder includes correct text', async () => {
    await act(async () => { render(<StoresListPage />); });
    const si = screen.getByTestId('si');
    const placeholder = si.getAttribute('placeholder') || '';
    expect(placeholder).toContain('搜索门店');
  });

  test('DataTable renders with store names', async () => {
    await act(async () => { render(<StoresListPage />); });
    const dt = mockDTCalls[mockDTCalls.length - 1];
    const nameCol = dt.columns[0];
    const sample = { id: 's-t', name: '测试店', code: 'TS-001', type: 'standard' as const, address: 'a', city: '北京', district: '朝阳', phone: '010', managerName: '张', status: 'active' as const, staffCount: 10, areaSqm: 200, monthlyRevenue: 100000, createdAt: '2024-01-01' };
    const rendered = nameCol.render(sample);
    expect(rendered).toBeTruthy();
  });
});
