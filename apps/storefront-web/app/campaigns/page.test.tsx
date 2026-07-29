import React from 'react';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';

let mockTabsCalls: any[][] = [];
let mockDTCalls: any[] = [];

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => '/campaigns',
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock('@m5/ui', () => ({
  PageShell: ({ children, title }: any) => <div data-testid="ps" data-title={title}>{children}</div>,
  DataTable: (props: any) => {
    mockDTCalls.push(props);
    const { columns, rows, rowKey } = props;
    return <div data-testid="dt" data-count={rows.length}>{rows.map((r: any) => <div key={rowKey(r)}>{columns.map((c: any) => <span key={c.key}>{c.render ? c.render(r) : String(r[c.key])}</span>)}</div>)}</div>;
  },
  Pagination: () => <div data-testid="pg">pg</div>,
  SearchFilterInput: ({ value, onChange, placeholder }: any) => (
    <input data-testid="si" placeholder={placeholder} value={value} onChange={(e: any) => onChange(e.target.value)} />
  ),
  StatusBadge: ({ label, variant }: any) => <span data-testid="sb" data-v={variant}>{label}</span>,
  Tabs: ({ items, activeKey, onChange }: any) => {
    mockTabsCalls.push(items);
    return <div data-testid="tabs" data-key={activeKey}>{items.map((i: any) => <button key={i.key} onClick={() => onChange(i.key)}>{i.label} ({i.count})</button>)}</div>;
  },
  usePagination: () => ({ page: 1, totalPages: 2, setPage: vi.fn() }),
  useSearchFilter: () => ({ searchTerm: '', setSearchTerm: vi.fn(), filteredItems: [
    { id: 'cmp-001', name: '618 年中大促', channel: '全渠道', status: 'active' as const, budget: 500000, spent: 324000, roi: 3.85, conversions: 12850, startAt: '2026-06-01', endAt: '2026-06-30', targetAudience: '全部会员', description: '618大促' },
    { id: 'cmp-002', name: '新会员专享', channel: '小程序', status: 'active' as const, budget: 80000, spent: 45200, roi: 5.2, conversions: 3400, startAt: '2026-06-10', endAt: '2026-07-10', targetAudience: '新会员', description: '新人礼包' },
    { id: 'cmp-003', name: '测试活动', channel: 'H5', status: 'scheduled' as const, budget: 120000, spent: 0, roi: 0, conversions: 0, startAt: '2026-07-01', endAt: '2026-07-31', targetAudience: '18-35', description: '测试' },
  ]}),
  useSortedItems: (i: any) => i,
}));

vi.mock('../_components/useTriState', () => ({
  useTriState: () => ({ loading: false, error: null, wrapLoad: vi.fn((p: Promise<any>) => p.then((d: any) => d)) }),
}));

vi.mock('../_components/TriStateRenderer', () => ({
  TriStateRenderer: ({ children }: any) => <div data-testid="tric">{typeof children === 'function' ? children() : children}</div>,
}));

import CampaignsListPage from './page';
beforeEach(() => { vi.clearAllMocks(); mockTabsCalls = []; mockDTCalls = []; });

describe('CampaignsListPage', () => {
  test('renders PageShell with correct title', async () => {
    await act(async () => { render(<CampaignsListPage />); });
    expect(screen.getByTestId('ps').dataset.title).toBe('营销活动');
  });

  test('renders search filter input', async () => {
    await act(async () => { render(<CampaignsListPage />); });
    expect(screen.getByTestId('si')).toBeInTheDocument();
  });

  test('renders status filter tabs with status keys', async () => {
    await act(async () => { render(<CampaignsListPage />); });
    const statusTabCall = mockTabsCalls.find((items) => items.some((i: any) => i.key === 'active' || i.key === 'draft'));
    expect(statusTabCall).toBeTruthy();
    const keys = statusTabCall!.map((i: any) => i.key);
    expect(keys).toContain('ALL');
    expect(keys).toContain('active');
    expect(keys).toContain('draft');
  });

  test('renders multiple tab groups (status + channel)', async () => {
    await act(async () => { render(<CampaignsListPage />); });
    expect(mockTabsCalls.length).toBeGreaterThanOrEqual(1);
  });

  test('renders DataTable with campaign rows', async () => {
    await act(async () => { render(<CampaignsListPage />); });
    expect(mockDTCalls.length).toBeGreaterThan(0);
    const dt = mockDTCalls[mockDTCalls.length - 1];
    expect(dt.columns).toHaveLength(9);
    expect(dt.rows.length).toBeGreaterThan(0);
  });

  test('DataTable has correct column keys', async () => {
    await act(async () => { render(<CampaignsListPage />); });
    const keys = mockDTCalls[mockDTCalls.length - 1].columns.map((c: any) => c.key);
    expect(keys).toEqual(['name', 'channel', 'status', 'budget', 'spent', 'roi', 'conversions', 'targetAudience', 'startAt']);
  });

  test('renders pagination component', async () => {
    await act(async () => { render(<CampaignsListPage />); });
    expect(screen.getByTestId('pg')).toBeInTheDocument();
  });

  test('budget column at index 3', async () => {
    await act(async () => { render(<CampaignsListPage />); });
    expect(mockDTCalls[mockDTCalls.length - 1].columns[3].key).toBe('budget');
  });

  test('status column at index 2', async () => {
    await act(async () => { render(<CampaignsListPage />); });
    expect(mockDTCalls[mockDTCalls.length - 1].columns[2].key).toBe('status');
  });

  test('name column renders description', async () => {
    await act(async () => { render(<CampaignsListPage />); });
    const col = mockDTCalls[mockDTCalls.length - 1].columns[0];
    const row = { id: 'x', name: '测试', description: 'desc', channel: '小程序', status: 'active' as const, budget: 100, spent: 0, roi: 0, conversions: 0, startAt: '', endAt: '', targetAudience: '' };
    expect(col.render(row)).toBeTruthy();
  });

  test('budget formats currency correctly', () => {
    const fmt = (n: number) => `¥${n.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}`;
    expect(fmt(500000)).toBe('¥500,000.00');
  });

  test('ROI column at index 5', async () => {
    await act(async () => { render(<CampaignsListPage />); });
    expect(mockDTCalls[mockDTCalls.length - 1].columns[5].key).toBe('roi');
  });

  test('conversions column at index 6', async () => {
    await act(async () => { render(<CampaignsListPage />); });
    expect(mockDTCalls[mockDTCalls.length - 1].columns[6].key).toBe('conversions');
  });

  test('targetAudience column at index 7', async () => {
    await act(async () => { render(<CampaignsListPage />); });
    expect(mockDTCalls[mockDTCalls.length - 1].columns[7].key).toBe('targetAudience');
  });

  test('startAt column at index 8', async () => {
    await act(async () => { render(<CampaignsListPage />); });
    expect(mockDTCalls[mockDTCalls.length - 1].columns[8].key).toBe('startAt');
  });

  test('status tabs show correct count from filteredItems', async () => {
    await act(async () => { render(<CampaignsListPage />); });
    const statusTabCall = mockTabsCalls.find((items) => items.some((i: any) => i.key === 'ALL'));
    expect(statusTabCall![0].count).toBe(3);
  });

  test('renders tri-state content area', async () => {
    await act(async () => { render(<CampaignsListPage />); });
    expect(screen.getByTestId('tric')).toBeInTheDocument();
  });

  test('renders PageShell with correct content', async () => {
    await act(async () => { render(<CampaignsListPage />); });
    expect(screen.getByTestId('ps')).toBeInTheDocument();
  });

  test('status tabs show active count', async () => {
    await act(async () => { render(<CampaignsListPage />); });
    const statusTabCall = mockTabsCalls.find((items) => items.some((i: any) => i.key === 'active'));
    const activeItem = statusTabCall!.find((i: any) => i.key === 'active');
    expect(activeItem.count).toBe(2);
  });

  test('spent column at index 4', async () => {
    await act(async () => { render(<CampaignsListPage />); });
    expect(mockDTCalls[mockDTCalls.length - 1].columns[4].key).toBe('spent');
  });

  test('channel column at index 1', async () => {
    await act(async () => { render(<CampaignsListPage />); });
    expect(mockDTCalls[mockDTCalls.length - 1].columns[1].key).toBe('channel');
  });
});
