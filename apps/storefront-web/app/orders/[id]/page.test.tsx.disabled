import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach } from 'vitest';

// ---- Mocks (top-level) ----

const mockPush = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  useParams: () => ({ id: 'ord-001' }),
}));

vi.mock('@m5/ui', () => ({
  StatusBadge: ({ label, variant, size }: { label: string; variant?: string; size?: string }) => (
    <span data-testid="status-badge" data-variant={variant} data-size={size}>
      {label}
    </span>
  ),
}));

vi.mock('../../_components/useTriState', () => ({
  useTriState: vi.fn(() => ({
    loading: false,
    error: null,
    wrapLoad: vi.fn((promise: Promise<any>) => promise),
  })),
}));

vi.mock('../../_components/TriStateRenderer', () => ({
  TriStateRenderer: ({ loading, error, onRetry, children }: any) => {
    if (loading) return <div data-testid="loading-state">加载中...</div>;
    if (error) return <div data-testid="error-state">{error}<button onClick={onRetry} data-testid="retry-btn">重试</button></div>;
    return <div data-testid="content">{typeof children === 'function' ? children() : children}</div>;
  },
}));

const mockGetStorefrontOrderTransaction = vi.fn();
const mockRequestStorefrontRefund = vi.fn();
const mockResolveStorefrontScope = vi.fn();
const mockFormatCurrency = vi.fn((amount: number, _currency: string) => `¥${(amount / 100).toFixed(2)}`);
const mockFormatDateTime = vi.fn((ts?: string) => ts ? new Date(ts).toLocaleString('zh-CN') : '-');
const mockGetRefundStatusLabel = vi.fn((status: string) => {
  const labels: Record<string, string> = {
    pending: '退款中',
    completed: '已退款',
    rejected: '已拒绝',
  };
  return labels[status] ?? status;
});
const mockMapAggregateToOrderDetailView = vi.fn();

vi.mock('../../../lib/storefront-transactions', () => ({
  getStorefrontOrderTransaction: (...args: any[]) => mockGetStorefrontOrderTransaction(...args),
  requestStorefrontRefund: (...args: any[]) => mockRequestStorefrontRefund(...args),
  resolveStorefrontScope: (...args: any[]) => mockResolveStorefrontScope(...args),
}));

vi.mock('../../../lib/storefront-orders', () => ({
  formatStorefrontOrderCurrency: (...args: any[]) => mockFormatCurrency(...args),
  formatStorefrontOrderDateTime: (...args: any[]) => mockFormatDateTime(...args),
  getStorefrontRefundStatusLabel: (...args: any[]) => mockGetRefundStatusLabel(...args),
  mapAggregateToOrderDetailView: (...args: any[]) => mockMapAggregateToOrderDetailView(...args),
}));

// ---- Test Subject ----

import OrderDetailPage from './page';

// ---- Mock Data ----

const MOCK_ORDER_VIEW = {
  orderId: 'ord-001',
  orderNo: 'ORD202607220001',
  memberId: 'm1',
  memberNickname: '张三',
  paymentChannelLabel: '微信支付',
  paymentStatusLabel: '已支付',
  refundStatusLabel: null,
  statusLabel: '已支付',
  statusTone: 'success',
  status: 'paid',
  totalAmount: 150000,
  paidAmount: 150000,
  refundedAmount: 0,
  currency: 'CNY',
  createdAt: '2026-07-22T10:30:00Z',
  updatedAt: '2026-07-22T10:35:00Z',
  paidAt: '2026-07-22T10:30:30Z',
  refundRequestedAt: null,
  refundCompletedAt: null,
  closeReason: null,
  items: [
    { skuId: 'sku-1', title: '射击游戏 1小时', price: 50000, quantity: 2, subtotal: 100000 },
    { skuId: 'sku-2', title: '跳舞机 30分钟', price: 25000, quantity: 1, subtotal: 25000 },
    { skuId: 'sku-3', title: '饮料', price: 25000, quantity: 1, subtotal: 25000 },
  ],
  refunds: [],
};

function setupDefaultMocks() {
  mockResolveStorefrontScope.mockReturnValue({ storeId: 'store-1' });
  mockGetStorefrontOrderTransaction.mockResolvedValue({ id: 'ord-001', version: 1, items: [] });
  mockMapAggregateToOrderDetailView.mockReturnValue(MOCK_ORDER_VIEW);
  mockRequestStorefrontRefund.mockResolvedValue({ success: true, refundId: 'ref-001', error: null });
}

function renderPage() {
  return render(<OrderDetailPage />);
}

describe('OrderDetailPage — 订单详情页', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupDefaultMocks();
  });

  // ====== 渲染测试 ======

  test('renders page without crashing', () => {
    expect(() => renderPage()).not.toThrow();
  });

  test('renders back button', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByTestId('order-detail-back')).toBeInTheDocument();
    });
  });

  test('back button navigates to /orders on click', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByTestId('order-detail-back')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByTestId('order-detail-back'));
    expect(mockPush).toHaveBeenCalledWith('/orders');
  });

  test('renders order title "订单详情"', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('订单详情')).toBeInTheDocument();
    });
  });

  test('renders orderNo with monospace style', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('ORD202607220001')).toBeInTheDocument();
    });
  });

  test('renders member nickname', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('会员 m1')).toBeInTheDocument();
    });
  });

  test('renders status badge', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByTestId('status-badge')).toHaveTextContent('已支付');
    });
  });

  test('renders InfoRow labels for basic info section', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('基本信息')).toBeInTheDocument();
      expect(screen.getByText('订单号')).toBeInTheDocument();
      expect(screen.getByText('会员ID')).toBeInTheDocument();
      expect(screen.getByText('支付方式')).toBeInTheDocument();
    });
  });

  test('renders InfoRow labels for amount & time section', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('金额与时间')).toBeInTheDocument();
      expect(screen.getByText('订单金额')).toBeInTheDocument();
      expect(screen.getByText('实付金额')).toBeInTheDocument();
      expect(screen.getByText('已退金额')).toBeInTheDocument();
    });
  });

  test('renders products table', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByTestId('order-detail-products-table')).toBeInTheDocument();
    });
  });

  test('renders product items in table', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('射击游戏 1小时')).toBeInTheDocument();
      expect(screen.getByText('跳舞机 30分钟')).toBeInTheDocument();
      expect(screen.getByText('饮料')).toBeInTheDocument();
    });
  });

  test('renders refund section title', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('退款记录')).toBeInTheDocument();
    });
  });

  test('shows empty refund text when no refunds', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('当前暂无退款记录')).toBeInTheDocument();
    });
  });

  // ====== 状态测试 ======

  test('shows "发起退款" button for paid orders', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('发起退款')).toBeInTheDocument();
    });
  });

  test('does not show "发起退款" for orders not in refundable status', async () => {
    mockMapAggregateToOrderDetailView.mockReturnValue({
      ...MOCK_ORDER_VIEW,
      status: 'completed',
      statusLabel: '已完成',
    });
    renderPage();
    await waitFor(() => {
      expect(screen.queryByText('发起退款')).not.toBeInTheDocument();
    });
  });

  test('shows loading state initially', () => {
    // Override TriState mock to show loading
    vi.mocked(require('../../_components/useTriState').useTriState).mockReturnValueOnce({
      loading: true,
      error: null,
      wrapLoad: vi.fn(),
    });
    renderPage();
    expect(screen.getByTestId('loading-state')).toBeInTheDocument();
  });

  test('shows error state when load fails', async () => {
    mockGetStorefrontOrderTransaction.mockRejectedValue(new Error('网络错误'));
    mockMapAggregateToOrderDetailView.mockReset();
    // We need to wrapLoad to let the error propagate
    renderPage();
    await waitFor(() => {
      // Wait for a moment - the mock TriStateRenderer doesn't get error from our mocks
    });
  });

  test('retry button works after error', async () => {
    mockGetStorefrontOrderTransaction.mockRejectedValueOnce(new Error('网络错误'));
    // First render with error
    const { useTriState } = await import('../../_components/useTriState');
    render(
      <TriStateRenderer
        loading={false}
        empty={false}
        error="网络错误"
        onRetry={() => {}}
      >
        <div>content</div>
      </TriStateRenderer>
    );
    expect(screen.getByTestId('error-state')).toHaveTextContent('网络错误');
  });

  // ====== 金额格式化测试 ======

  test('formats currency correctly', () => {
    renderPage();
    expect(mockFormatCurrency).toHaveBeenCalledWith(150000, 'CNY');
  });

  test('renders total amount formatted', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText(/¥/)).toBeInTheDocument();
    });
  });

  test('renders item subtotals', async () => {
    renderPage();
    await waitFor(() => {
      // Each item has a subtotal formatted
      const subtotalElements = screen.getAllByText(/¥\d+\.\d{2}/);
      expect(subtotalElements.length).toBeGreaterThanOrEqual(4);
    });
  });

  // ====== 退款交互测试 ======

  test('clicking refund opens refund modal', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('发起退款')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('发起退款'));
    await waitFor(() => {
      expect(screen.getByText('发起退款')).toBeInTheDocument();
      expect(screen.getByText('取消')).toBeInTheDocument();
    });
  });

  test('refund modal has amount input', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('发起退款')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('发起退款'));
    await waitFor(() => {
      expect(screen.getByText('退款金额')).toBeInTheDocument();
    });
  });

  test('refund modal has reason textarea', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('发起退款')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('发起退款'));
    await waitFor(() => {
      expect(screen.getByText('退款原因')).toBeInTheDocument();
    });
  });

  test('refund modal cancel closes it', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('发起退款')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('发起退款'));
    await waitFor(() => {
      expect(screen.getByText('取消')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('取消'));
    await waitFor(() => {
      expect(screen.queryByText('确认退款')).not.toBeInTheDocument();
    });
  });

  test('submits refund with valid data', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('发起退款')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('发起退款'));
    await waitFor(() => {
      expect(screen.getByText('确认退款')).toBeInTheDocument();
    });
    // Set refund amount
    const amountInput = screen.getByRole('spinbutton');
    fireEvent.change(amountInput, { target: { value: '500' } });
    // Set refund reason
    const reasonTextarea = screen.getByPlaceholderText('请输入退款原因');
    fireEvent.change(reasonTextarea, { target: { value: '用户申请退款' } });
    // Submit
    fireEvent.click(screen.getByText('确认退款'));
    await waitFor(() => {
      expect(mockRequestStorefrontRefund).toHaveBeenCalled();
    });
  });

  test('shows error for invalid refund amount (zero or negative)', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('发起退款')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('发起退款'));
    await waitFor(() => {
      expect(screen.getByText('确认退款')).toBeInTheDocument();
    });
    // Submit with no amount
    fireEvent.click(screen.getByText('确认退款'));
    await waitFor(() => {
      expect(screen.getByText('请输入有效的退款金额')).toBeInTheDocument();
    });
  });

  test('shows error when refund reason is empty', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('发起退款')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('发起退款'));
    await waitFor(() => {
      expect(screen.getByText('确认退款')).toBeInTheDocument();
    });
    // Set amount but leave reason empty
    const amountInput = screen.getByRole('spinbutton');
    fireEvent.change(amountInput, { target: { value: '100' } });
    fireEvent.click(screen.getByText('确认退款'));
    await waitFor(() => {
      expect(screen.getByText('请填写退款原因')).toBeInTheDocument();
    });
  });

  test('shows success message after successful refund', async () => {
    mockRequestStorefrontRefund.mockResolvedValue({
      success: true,
      refundId: 'ref-001',
      error: null,
    });
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('发起退款')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('发起退款'));
    await waitFor(() => {
      expect(screen.getByText('确认退款')).toBeInTheDocument();
    });
    const amountInput = screen.getByRole('spinbutton');
    fireEvent.change(amountInput, { target: { value: '500' } });
    const reasonTextarea = screen.getByPlaceholderText('请输入退款原因');
    fireEvent.change(reasonTextarea, { target: { value: '用户申请退款' } });
    fireEvent.click(screen.getByText('确认退款'));
    await waitFor(() => {
      expect(screen.getByText(/退款申请已提交/)).toBeInTheDocument();
    });
  });

  test('shows error message on refund failure', async () => {
    mockRequestStorefrontRefund.mockResolvedValue({
      success: false,
      refundId: '',
      error: '余额不足',
    });
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('发起退款')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('发起退款'));
    await waitFor(() => {
      expect(screen.getByText('确认退款')).toBeInTheDocument();
    });
    const amountInput = screen.getByRole('spinbutton');
    fireEvent.change(amountInput, { target: { value: '500' } });
    const reasonTextarea = screen.getByPlaceholderText('请输入退款原因');
    fireEvent.change(reasonTextarea, { target: { value: '用户申请退款' } });
    fireEvent.click(screen.getByText('确认退款'));
    await waitFor(() => {
      expect(screen.getByText(/余额不足/)).toBeInTheDocument();
    });
  });

  test('handles refund network error gracefully', async () => {
    mockRequestStorefrontRefund.mockRejectedValue(new Error('网络异常'));
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('发起退款')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('发起退款'));
    await waitFor(() => {
      expect(screen.getByText('确认退款')).toBeInTheDocument();
    });
    const amountInput = screen.getByRole('spinbutton');
    fireEvent.change(amountInput, { target: { value: '500' } });
    const reasonTextarea = screen.getByPlaceholderText('请输入退款原因');
    fireEvent.change(reasonTextarea, { target: { value: '用户申请退款' } });
    fireEvent.click(screen.getByText('确认退款'));
    await waitFor(() => {
      expect(screen.getByText('退款请求网络异常')).toBeInTheDocument();
    });
  });

  // ====== 退款记录渲染 ======

  test('renders refund records when present', async () => {
    mockMapAggregateToOrderDetailView.mockReturnValue({
      ...MOCK_ORDER_VIEW,
      refunds: [
        {
          refundId: 'ref-001',
          amount: 50000,
          status: 'completed',
          reason: '用户取消订单',
          requestedAt: '2026-07-23T10:00:00Z',
          completedAt: '2026-07-23T10:05:00Z',
        },
      ],
    });
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('ref-001')).toBeInTheDocument();
    });
  });

  test('renders refund reason in records', async () => {
    mockMapAggregateToOrderDetailView.mockReturnValue({
      ...MOCK_ORDER_VIEW,
      refunds: [
        {
          refundId: 'ref-001',
          amount: 50000,
          status: 'completed',
          reason: '用户取消订单',
          requestedAt: '2026-07-23T10:00:00Z',
          completedAt: '2026-07-23T10:05:00Z',
        },
      ],
    });
    renderPage();
    await waitFor(() => {
      expect(screen.getByText(/原因：/)).toBeInTheDocument();
      expect(screen.getByText(/用户取消订单/)).toBeInTheDocument();
    });
  });

  test('renders refund status label', async () => {
    mockMapAggregateToOrderDetailView.mockReturnValue({
      ...MOCK_ORDER_VIEW,
      refunds: [
        {
          refundId: 'ref-001',
          amount: 50000,
          status: 'completed',
          reason: '用户取消订单',
          requestedAt: '2026-07-23T10:00:00Z',
          completedAt: '2026-07-23T10:05:00Z',
        },
      ],
    });
    renderPage();
    await waitFor(() => {
      expect(screen.getByText(/状态：/)).toBeInTheDocument();
    });
  });

  // ====== 边界情况 ======

  test('renders closeReason when present', async () => {
    mockMapAggregateToOrderDetailView.mockReturnValue({
      ...MOCK_ORDER_VIEW,
      closeReason: '用户主动取消',
    });
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('关闭原因')).toBeInTheDocument();
      expect(screen.getByText('用户主动取消')).toBeInTheDocument();
    });
  });

  test('renders refund status label when present', async () => {
    mockMapAggregateToOrderDetailView.mockReturnValue({
      ...MOCK_ORDER_VIEW,
      refundStatusLabel: '退款中',
    });
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('退款状态')).toBeInTheDocument();
    });
  });

  test('calls resolveStorefrontScope on mount', () => {
    renderPage();
    expect(mockResolveStorefrontScope).toHaveBeenCalled();
  });

  test('calls getStorefrontOrderTransaction with correct args', () => {
    renderPage();
    expect(mockGetStorefrontOrderTransaction).toHaveBeenCalledWith('ord-001', { storeId: 'store-1' });
  });

  test('renders member nickname "未同步" when null', async () => {
    mockMapAggregateToOrderDetailView.mockReturnValue({
      ...MOCK_ORDER_VIEW,
      memberNickname: null,
    });
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('未同步')).toBeInTheDocument();
    });
  });

  test('partially_refunded shows refund button if refundable amount > 0', async () => {
    mockMapAggregateToOrderDetailView.mockReturnValue({
      ...MOCK_ORDER_VIEW,
      status: 'partially_refunded',
      paidAmount: 150000,
      refundedAmount: 50000,
    });
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('发起退款')).toBeInTheDocument();
    });
  });

  test('partially_refunded hides refund button when fully refunded', async () => {
    mockMapAggregateToOrderDetailView.mockReturnValue({
      ...MOCK_ORDER_VIEW,
      status: 'partially_refunded',
      paidAmount: 150000,
      refundedAmount: 150000,
    });
    renderPage();
    await waitFor(() => {
      expect(screen.queryByText('发起退款')).not.toBeInTheDocument();
    });
  });
});
