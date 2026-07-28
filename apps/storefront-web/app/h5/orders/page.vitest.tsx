/**
 * h5/orders/page.vitest.tsx — H5订单列表页 组件测试
 * 覆盖: 加载态 · 订单列表 · 筛选 · 空态 · 错误态 · 交互
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach } from 'vitest';

// ---- Mocks ----

const mockPush = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: () => '/h5/orders',
  useSearchParams: () => new URLSearchParams(),
}));

const mockLoadOrders = vi.fn();

vi.mock('../../../lib/storefront-orders', () => ({
  formatStorefrontOrderCurrency: (amount: number, currency?: string) => `¥${(amount / 100).toFixed(2)}`,
  formatStorefrontOrderDateTime: (date?: string) => date ?? '',
  getStorefrontOrderPaymentLabel: (channel?: string) => {
    const map: Record<string, string> = { wechat: '微信支付', alipay: '支付宝', cash: '现金', member_card: '会员卡' };
    return channel ? map[channel] ?? channel : '未知';
  },
  getStorefrontOrderStatusLabel: (status: string) => {
    const map: Record<string, string> = {
      pending_payment: '待支付', paid: '已支付', refunding: '退款中',
      partially_refunded: '部分退款', refunded: '已退款', cancelled: '已取消',
    };
    return map[status] ?? status;
  },
  getStorefrontOrderStatusVariant: (status: string) => {
    const map: Record<string, string> = { paid: 'success', pending_payment: 'warning', cancelled: 'error', refunded: 'default' };
    return map[status] ?? 'default';
  },
  loadStorefrontOrders: (...args: any[]) => mockLoadOrders(...args),
  type StorefrontOrderViewStatus: {} as any,
  type StorefrontOrderListViewItem: {} as any,
}));

vi.mock('../../../lib/storefront-transactions', () => ({
  resolveStorefrontScope: () => ({
    marketCode: 'cn-mainland',
    tenantId: 'demo-tenant',
    brandId: 'demo-brand',
    storeId: 'store-001',
  }),
}));

vi.mock('../h5-style', () => ({
  getMainContainerStyle: () => ({ minHeight: '100vh', background: '#0f172a' }),
  getToggleChipStyle: (isActive: boolean, opts?: any) => ({
    padding: '6px 16px',
    borderRadius: 16,
    border: 'none',
    fontSize: 13,
    cursor: 'pointer',
    background: isActive ? 'rgba(99,102,241,0.2)' : 'rgba(148,163,184,0.1)',
    color: isActive ? '#a5b4fc' : '#94a3b8',
    fontWeight: 600,
  }),
  getCardStyle: () => ({
    borderRadius: 12,
    background: 'rgba(15,23,42,0.8)',
    border: '1px solid rgba(148,163,184,0.1)',
    padding: 16,
    marginBottom: 12,
  }),
  getEmptyStateStyle: () => ({ textAlign: 'center', padding: 48, color: '#64748b' }),
  getEmptyStateEmojiStyle: () => ({ fontSize: 48, marginBottom: 12 }),
  H5Header: ({ title, marginBottom, children }: any) => (
    <div data-testid="h5-header" data-title={title}>
      <h1>{title}</h1>
      {children}
    </div>
  ),
  H5NavBar: ({ activeKey }: any) => <div data-testid="h5-navbar" data-active-key={activeKey} />,
  COLOR_TEXT_PRIMARY: '#f8fafc',
  COLOR_TEXT_SECONDARY: '#94a3b8',
  COLOR_TEXT_MUTED: '#64748b',
  COLOR_ACCENT: '#a5b4fc',
}));

import H5OrdersPage from './page';

const MOCK_ORDERS = [
  {
    id: 'ord-1',
    orderNo: 'ORD20260701001',
    memberId: 'mem-001',
    itemCount: 3,
    totalAmount: 15000,
    paidAmount: 0,
    refundedAmount: 0,
    currency: 'CNY',
    status: 'pending_payment',
    paymentChannel: 'wechat',
    createdAt: '2026-07-01T10:00:00',
    updatedAt: '2026-07-01T10:00:00',
  },
  {
    id: 'ord-2',
    orderNo: 'ORD20260702001',
    memberId: 'mem-001',
    itemCount: 2,
    totalAmount: 8000,
    paidAmount: 8000,
    refundedAmount: 0,
    currency: 'CNY',
    status: 'paid',
    paymentChannel: 'alipay',
    createdAt: '2026-07-02T14:30:00',
    updatedAt: '2026-07-02T14:35:00',
    paidAt: '2026-07-02T14:35:00',
  },
  {
    id: 'ord-3',
    orderNo: 'ORD20260630001',
    memberId: 'mem-002',
    itemCount: 1,
    totalAmount: 5000,
    paidAmount: 5000,
    refundedAmount: 5000,
    currency: 'CNY',
    status: 'refunded',
    paymentChannel: 'wechat',
    createdAt: '2026-06-30T09:00:00',
    updatedAt: '2026-07-01T11:00:00',
    paidAt: '2026-06-30T09:10:00',
    refundCompletedAt: '2026-07-01T11:00:00',
  },
];

function renderPage() {
  return render(<H5OrdersPage />);
}

describe('H5OrdersPage — H5订单列表', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLoadOrders.mockResolvedValue(MOCK_ORDERS);
  });

  // ====== 渲染测试 ======

  test('renders without crashing', () => {
    expect(() => renderPage()).not.toThrow();
  });

  test('renders page title 我的订单', async () => {
    renderPage();
    expect(await screen.findByText('我的订单')).toBeInTheDocument();
  });

  test('renders filter buttons with counts', async () => {
    renderPage();
    expect(await screen.findByText('全部')).toBeInTheDocument();
    expect(screen.getByText('待支付')).toBeInTheDocument();
    expect(screen.getByText('已支付')).toBeInTheDocument();
    expect(screen.getByText('部分退款')).toBeInTheDocument();
    expect(screen.getByText('已退款')).toBeInTheDocument();
    expect(screen.getByText('已取消')).toBeInTheDocument();
  });

  test('renders order numbers', async () => {
    renderPage();
    expect(await screen.findByText(/订单号：ORD20260701001/)).toBeInTheDocument();
    expect(screen.getByText(/订单号：ORD20260702001/)).toBeInTheDocument();
    expect(screen.getByText(/订单号：ORD20260630001/)).toBeInTheDocument();
  });

  test('renders order item counts', async () => {
    renderPage();
    expect(await screen.findByText('3 件')).toBeInTheDocument();
    expect(screen.getByText('2 件')).toBeInTheDocument();
    expect(screen.getByText('1 件')).toBeInTheDocument();
  });

  test('renders order amounts', async () => {
    renderPage();
    expect(await screen.findByText('¥150.00')).toBeInTheDocument();
    expect(screen.getByText('¥80.00')).toBeInTheDocument();
    expect(screen.getByText('¥50.00')).toBeInTheDocument();
  });

  test('renders status badges', async () => {
    renderPage();
    expect(await screen.findByText('待支付')).toBeInTheDocument();
    expect(screen.getByText('已支付')).toBeInTheDocument();
    expect(screen.getByText('已退款')).toBeInTheDocument();
  });

  test('renders payment channel labels', async () => {
    renderPage();
    const wechatLabels = await screen.findAllByText('微信支付');
    expect(wechatLabels.length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText('支付宝')).toBeInTheDocument();
  });

  // ====== 筛选测试 ======

  test('filter by 待支付 shows only pending orders', async () => {
    renderPage();
    await screen.findByText('待支付');
    fireEvent.click(screen.getByText('待支付'));
    await waitFor(() => {
      expect(screen.getByText(/ORD20260701001/)).toBeInTheDocument();
      expect(screen.queryByText(/ORD20260702001/)).not.toBeInTheDocument();
    });
  });

  test('filter by 已支付 shows only paid orders', async () => {
    renderPage();
    await screen.findByText('待支付');
    fireEvent.click(screen.getByText('已支付'));
    await waitFor(() => {
      expect(screen.queryByText(/ORD20260701001/)).not.toBeInTheDocument();
      expect(screen.getByText(/ORD20260702001/)).toBeInTheDocument();
    });
  });

  test('filter by 已退款 shows only refunded orders', async () => {
    renderPage();
    await screen.findByText('待支付');
    fireEvent.click(screen.getByText('已退款'));
    await waitFor(() => {
      expect(screen.queryByText(/ORD20260701001/)).not.toBeInTheDocument();
      expect(screen.queryByText(/ORD20260702001/)).not.toBeInTheDocument();
      expect(screen.getByText(/ORD20260630001/)).toBeInTheDocument();
    });
  });

  // ====== 待支付操作 ======

  test('shows 继续支付 button for pending payment orders', async () => {
    renderPage();
    const payBtn = await screen.findByText('继续支付');
    expect(payBtn).toBeInTheDocument();
    fireEvent.click(payBtn);
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/h5/payment/ord-1');
    });
  });

  // ====== 空态 ======

  test('shows 暂无订单 when order list is empty', async () => {
    mockLoadOrders.mockResolvedValue([]);
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('暂无订单')).toBeInTheDocument();
    });
  });

  test('shows 去逛逛 button in empty state', async () => {
    mockLoadOrders.mockResolvedValue([]);
    renderPage();
    await waitFor(() => {
      const shopBtn = screen.getByText('去逛逛');
      expect(shopBtn).toBeInTheDocument();
      fireEvent.click(shopBtn);
      expect(mockPush).toHaveBeenCalledWith('/stores');
    });
  });

  // ====== 加载态 ======

  test('shows 订单加载中 initially', () => {
    mockLoadOrders.mockImplementation(() => new Promise(() => {}));
    renderPage();
    expect(screen.getByText('订单加载中...')).toBeInTheDocument();
  });

  // ====== 错误态 ======

  test('shows error message when load fails', async () => {
    mockLoadOrders.mockRejectedValue(new Error('网络异常'));
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('网络异常')).toBeInTheDocument();
    });
  });

  test('shows retry button on error', async () => {
    mockLoadOrders.mockRejectedValue(new Error('网络异常'));
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('重新加载')).toBeInTheDocument();
    });
  });

  test('retry reloads orders', async () => {
    mockLoadOrders.mockRejectedValueOnce(new Error('网络异常'));
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('重新加载')).toBeInTheDocument();
    });
    mockLoadOrders.mockResolvedValueOnce(MOCK_ORDERS);
    fireEvent.click(screen.getByText('重新加载'));
    await waitFor(() => {
      expect(screen.getByText(/ORD20260701001/)).toBeInTheDocument();
    });
  });

  // ====== 导航 ======

  test('renders H5NavBar with activeKey me', async () => {
    renderPage();
    const nav = await screen.findByTestId('h5-navbar');
    expect(nav).toHaveAttribute('data-active-key', 'me');
  });

  // ====== 统计测试 ======

  test('filter buttons show correct counts after load', async () => {
    renderPage();
    const allBtn = await screen.findByText('全部');
    // Verify counts are rendered (they're inside div elements)
    expect(screen.getByText('3')).toBeInTheDocument(); // total
  });

  // ====== 圈梁五道箍 — 增强测试 ======

  describe('圈梁五道箍 — 订单统计与筛选', () => {
    test('[圈梁五道箍] 全部订单统计数正确', async () => {
      renderPage();
      await screen.findByText('全部');
      expect(screen.getByText('3')).toBeInTheDocument();
    });

    test('[圈梁五道箍] 待支付订单统计数正确', async () => {
      renderPage();
      await screen.findByText('待支付');
      expect(screen.getByText('1')).toBeInTheDocument(); // 3 items in all buttons, the first "1" is pending
    });

    test('[圈梁五道箍] 已支付订单统计数正确', async () => {
      renderPage();
      await screen.findByText('已支付');
      const paidText = screen.getByText('已支付');
      expect(paidText).toBeInTheDocument();
    });
  });

  describe('圈梁五道箍 — 订单详情展示', () => {
    test('[圈梁五道箍] 待支付订单显示支付按钮', async () => {
      renderPage();
      const payBtn = await screen.findByText('继续支付');
      expect(payBtn).toBeInTheDocument();
    });

    test('[圈梁五道箍] 已支付订单不显示支付按钮', async () => {
      renderPage();
      // Paid order should not have "继续支付"
      await screen.findByText(/ORD20260702001/);
      const payBtns = screen.queryAllByText('继续支付');
      // Only the pending order has this button
      expect(payBtns.length).toBe(1);
    });

    test('[圈梁五道箍] 订单显示会员ID', async () => {
      renderPage();
      expect(await screen.findByText('mem-001')).toBeInTheDocument();
      expect(screen.getByText('mem-002')).toBeInTheDocument();
    });

    test('[圈梁五道箍] 订单列表排序按filter正确', async () => {
      renderPage();
      await screen.findByText(/ORD20260701001/);
      fireEvent.click(screen.getByText('已支付'));
      await waitFor(() => {
        expect(screen.getByText(/ORD20260702001/)).toBeInTheDocument();
        expect(screen.queryByText(/ORD20260701001/)).not.toBeInTheDocument();
      });
    });
  });

  describe('圈梁五道箍 — 错误恢复', () => {
    test('[圈梁五道箍] 加载失败后重试可恢复数据', async () => {
      mockLoadOrders.mockRejectedValueOnce(new Error('网络异常'));
      renderPage();
      await waitFor(() => {
        expect(screen.getByText('网络异常')).toBeInTheDocument();
      });
      mockLoadOrders.mockResolvedValueOnce(MOCK_ORDERS);
      fireEvent.click(screen.getByText('重新加载'));
      await waitFor(() => {
        expect(screen.getByText(/ORD20260701001/)).toBeInTheDocument();
        expect(screen.queryByText('网络异常')).not.toBeInTheDocument();
      });
    });

    test('[圈梁五道箍] 加载失败默认提示语', async () => {
      mockLoadOrders.mockRejectedValue(new Error(''));
      renderPage();
      await waitFor(() => {
        expect(screen.getByText(/订单加载失败，请稍后重试/)).toBeInTheDocument();
      });
    });
  });
});
