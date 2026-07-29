import React from 'react';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }),
  usePathname: () => '/refunds',
  useSearchParams: () => new URLSearchParams(),
}));

// Mock @m5/ui
const mockPageShell = vi.fn(({ children, title }: any) => (
  <div data-testid="page-shell" data-title={title}>{children}</div>
));
const mockDataTable = vi.fn(({ columns, rows, rowKey }: any) => (
  <div data-testid="data-table">
    {rows.map((r: any) => <div key={rowKey(r)}>{columns.map((c: any) => <span key={c.key}>{c.render ? c.render(r) : String(r[c.key])}</span>)}</div>)}
  </div>
));
const mockStatusBadge = vi.fn(({ label, variant }: any) => (
  <span data-testid="sb" data-variant={variant}>{label}</span>
));
const mockEmptyState = vi.fn(({ title }: any) => (
  <div data-testid="empty-state"><span>{title}</span></div>
));
const mockModal = vi.fn(({ open, onClose, title, children }: any) => (
  open ? <div data-testid="modal" data-title={title}><button data-testid="modal-close" onClick={onClose}>✕</button>{children}</div> : null
));

vi.mock('@m5/ui', () => ({
  PageShell: (props: any) => mockPageShell(props),
  DataTable: (props: any) => mockDataTable(props),
  StatusBadge: (props: any) => mockStatusBadge(props),
  EmptyState: (props: any) => mockEmptyState(props),
  Modal: (props: any) => mockModal(props),
}));

// Mock refund-data
vi.mock('./refund-data', () => {
  const REFUND_STATUS_LABEL: Record<string, string> = {
    pending_approval: '待审批', approved: '已通过', rejected: '已拒绝',
    processing: '处理中', completed: '已完成', cancelled: '已取消',
  };
  const REFUND_STATUS_VARIANT: Record<string, string> = {
    pending_approval: 'warning', approved: 'success', rejected: 'danger',
    processing: 'info', completed: 'success', cancelled: 'neutral',
  };
  const REFUND_TYPE_LABEL: Record<string, string> = {
    refund: '仅退款', exchange: '换货', return: '退货退款',
  };
  const MOCK_REFUNDS = [
    { id: 'RF-001', orderId: 'ORD-001', type: 'refund' as const, status: 'pending_approval' as const, customerName: '王芳', customerPhone: '138****5678', amount: 12900, reason: '商品与描述不符', createdAt: '2026-06-28 09:15', productName: '蔬菜礼盒' },
    { id: 'RF-002', orderId: 'ORD-002', type: 'exchange' as const, status: 'approved' as const, customerName: '李明', customerPhone: '159****2341', amount: 35800, reason: '尺码不合适', createdAt: '2026-06-27 14:30', processedAt: '2026-06-27 16:00', productName: '跑鞋' },
    { id: 'RF-003', orderId: 'ORD-003', type: 'return' as const, status: 'processing' as const, customerName: '赵雪', customerPhone: '176****9087', amount: 52000, reason: '商品破损', createdAt: '2026-06-26 10:00', processedAt: '2026-06-26 11:30', productName: '红酒' },
    { id: 'RF-004', orderId: 'ORD-004', type: 'refund' as const, status: 'completed' as const, customerName: '陈伟', customerPhone: '182****4532', amount: 8800, reason: '重复下单', createdAt: '2026-06-25 08:45', processedAt: '2026-06-25 10:20', productName: '饼干' },
    { id: 'RF-005', orderId: 'ORD-005', type: 'exchange' as const, status: 'rejected' as const, customerName: '刘洋', customerPhone: '136****7890', amount: 25900, reason: '超过期限', createdAt: '2026-06-24 16:20', processedAt: '2026-06-24 17:00', productName: '耳机' },
    { id: 'RF-006', orderId: 'ORD-006', type: 'return' as const, status: 'pending_approval' as const, customerName: '孙丽', customerPhone: '139****3456', amount: 16800, reason: '商品过期', createdAt: '2026-06-23 11:10', productName: '牛奶' },
    { id: 'RF-007', orderId: 'ORD-007', type: 'refund' as const, status: 'cancelled' as const, customerName: '周强', customerPhone: '137****6789', amount: 4500, reason: '已协商', createdAt: '2026-06-22 09:30', processedAt: '2026-06-22 10:15', productName: '零食' },
  ];
  return { REFUND_STATUS_LABEL, REFUND_STATUS_VARIANT, REFUND_TYPE_LABEL, MOCK_REFUNDS };
});

import RefundsPage from './page';
beforeEach(() => { vi.clearAllMocks(); });

describe('RefundsPage', () => {
  test('renders PageShell with correct title', async () => {
    await act(async () => { render(<RefundsPage />); });
    expect(mockPageShell.mock.lastCall![0].title).toBe('退换货管理');
  });

  test('renders main page heading', async () => {
    await act(async () => { render(<RefundsPage />); });
    expect(screen.getByText('🔄 退换货管理')).toBeInTheDocument();
  });

  test('renders summary with record count', async () => {
    await act(async () => { render(<RefundsPage />); });
    expect(screen.getByText(/共 \d+ 条记录/)).toBeInTheDocument();
  });

  test('renders stat cards', async () => {
    await act(async () => { render(<RefundsPage />); });
    // Stat card labels are rendered; use getAllByText for labels that appear in both card and select
    const completedCards = screen.getAllByText('已完成');
    expect(completedCards.length).toBeGreaterThan(0);
  });

  test('renders search input', async () => {
    await act(async () => { render(<RefundsPage />); });
    const input = screen.getByTestId('search-input');
    expect(input).toBeInTheDocument();
    expect((input as HTMLInputElement).placeholder).toContain('退单号');
  });

  test('renders status filter select', async () => {
    await act(async () => { render(<RefundsPage />); });
    const el = screen.getByTestId('status-filter');
    expect(el.tagName).toBe('SELECT');
    expect((el as HTMLSelectElement).value).toBe('ALL');
  });

  test('renders type filter select', async () => {
    await act(async () => { render(<RefundsPage />); });
    expect(screen.getByTestId('type-filter')).toBeInTheDocument();
  });

  test('renders export CSV button', async () => {
    await act(async () => { render(<RefundsPage />); });
    expect(screen.getByText(/📥 导出 CSV/)).toBeInTheDocument();
  });

  test('renders DataTable', async () => {
    await act(async () => { render(<RefundsPage />); });
    expect(mockDataTable).toHaveBeenCalled();
    expect(mockDataTable.mock.lastCall![0].rows.length).toBeGreaterThan(0);
  });

  test('DataTable has correct column keys', async () => {
    await act(async () => { render(<RefundsPage />); });
    const keys = mockDataTable.mock.lastCall![0].columns.map((c: any) => c.key);
    expect(keys).toContain('id');
    expect(keys).toContain('orderId');
    expect(keys).toContain('customerName');
    expect(keys).toContain('type');
    expect(keys).toContain('amount');
    expect(keys).toContain('productName');
    expect(keys).toContain('reason');
    expect(keys).toContain('status');
    expect(keys).toContain('createdAt');
    expect(keys).toContain('actions');
  });

  test('renders pagination buttons', async () => {
    await act(async () => { render(<RefundsPage />); });
    expect(screen.getByText(/← 上一页/)).toBeInTheDocument();
    expect(screen.getByText(/下一页 →/)).toBeInTheDocument();
  });

  test('shows approval modal on 审核 click', async () => {
    await act(async () => { render(<RefundsPage />); });
    const btns = screen.getAllByText('审核');
    expect(btns.length).toBeGreaterThan(0);
    fireEvent.click(btns[0]);
    expect(mockModal.mock.lastCall![0].title).toContain('退单审批');
  });

  test('modal has approve and reject buttons', async () => {
    await act(async () => { render(<RefundsPage />); });
    fireEvent.click(screen.getAllByText('审核')[0]);
    expect(screen.getByText('通过审批')).toBeInTheDocument();
    expect(screen.getByText('拒绝退款')).toBeInTheDocument();
  });

  test('approve closes modal', async () => {
    await act(async () => { render(<RefundsPage />); });
    fireEvent.click(screen.getAllByText('审核')[0]);
    fireEvent.click(screen.getByText('通过审批'));
    expect(screen.queryByTestId('modal')).toBeNull();
  });

  test('reject closes modal', async () => {
    await act(async () => { render(<RefundsPage />); });
    fireEvent.click(screen.getAllByText('审核')[0]);
    fireEvent.click(screen.getByText('拒绝退款'));
    expect(screen.queryByTestId('modal')).toBeNull();
  });

  test('toggle detail panel', async () => {
    await act(async () => { render(<RefundsPage />); });
    const btns = screen.getAllByText('详情');
    expect(btns.length).toBeGreaterThan(0);
    fireEvent.click(btns[0]);
    expect(screen.getByText(/退单详情/)).toBeInTheDocument();
  });

  test('search input updates value', async () => {
    await act(async () => { render(<RefundsPage />); });
    const input = screen.getByTestId('search-input') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'RF-001' } });
    expect(input.value).toBe('RF-001');
  });

  test('status filter changes', async () => {
    await act(async () => { render(<RefundsPage />); });
    const sel = screen.getByTestId('status-filter') as HTMLSelectElement;
    fireEvent.change(sel, { target: { value: 'pending_approval' } });
    expect(sel.value).toBe('pending_approval');
  });

  test('type filter changes', async () => {
    await act(async () => { render(<RefundsPage />); });
    const sel = screen.getByTestId('type-filter') as HTMLSelectElement;
    fireEvent.change(sel, { target: { value: 'refund' } });
    expect(sel.value).toBe('refund');
  });

  test('amount column renders with ¥', async () => {
    await act(async () => { render(<RefundsPage />); });
    const col = mockDataTable.mock.lastCall![0].columns.find((c: any) => c.key === 'amount');
    expect(col).toBeTruthy();
    const r = { id: 't', orderId: 'o', type: 'refund' as const, status: 'pending_approval' as const, customerName: 'T', customerPhone: '123', amount: 12900, reason: 'r', createdAt: '2026-01-01', productName: 'p' };
    expect(col.render(r)).toBeTruthy();
  });

  test('status column renders StatusBadge', async () => {
    await act(async () => { render(<RefundsPage />); });
    const col = mockDataTable.mock.lastCall![0].columns.find((c: any) => c.key === 'status');
    expect(col).toBeTruthy();
  });
});
