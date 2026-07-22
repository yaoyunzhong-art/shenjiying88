import React from 'react';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';

const mockPush = vi.fn();
const mockLoadOrders = vi.fn();
const mockResolveScope = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

vi.mock('../h5-style', () => ({
  getMainContainerStyle: () => ({}),
  getCardStyle: () => ({}),
  getToggleChipStyle: () => ({}),
  getEmptyStateStyle: () => ({}),
  getEmptyStateEmojiStyle: () => ({}),
  H5Header: ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div>
      <h1>{title}</h1>
      {children}
    </div>
  ),
  H5NavBar: ({ activeKey }: { activeKey: string }) => <div data-testid="h5-nav">{activeKey}</div>,
  COLOR_TEXT_PRIMARY: '#fff',
  COLOR_TEXT_SECONDARY: '#94a3b8',
  COLOR_TEXT_MUTED: '#64748b',
  COLOR_ACCENT: '#667eea',
}));

vi.mock('../../../lib/storefront-transactions', () => ({
  resolveStorefrontScope: (...args: any[]) => mockResolveScope(...args),
}));

vi.mock('../../../lib/storefront-orders', () => ({
  formatStorefrontOrderCurrency: (amount: number, currency = 'CNY') => (currency === 'CNY' ? `¥${amount.toFixed(2)}` : `${currency} ${amount.toFixed(2)}`),
  formatStorefrontOrderDateTime: (value?: string) => value ?? '-',
  getStorefrontOrderPaymentLabel: (channel?: string) => (channel === 'WECHAT_PAY' ? '微信支付' : channel ?? '-'),
  getStorefrontOrderStatusLabel: (status: string) => ({
    pending_payment: '待支付',
    paid: '已支付',
    partially_refunded: '部分退款',
    refunded: '已退款',
    cancelled: '已取消',
  }[status] ?? status),
  getStorefrontOrderStatusVariant: (status: string) => ({
    pending_payment: 'warning',
    paid: 'success',
    partially_refunded: 'warning',
    refunded: 'error',
    cancelled: 'default',
  }[status] ?? 'default'),
  loadStorefrontOrders: (...args: any[]) => mockLoadOrders(...args),
}));

import H5OrdersPage from './page';

describe('H5OrdersPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockResolveScope.mockReturnValue({
      tenantId: 'default',
      brandId: 'default-brand',
      storeId: 'default-store',
      marketCode: 'cn-mainland',
    });
    mockLoadOrders.mockResolvedValue([
      {
        id: 'order-paid-001',
        orderNo: 'ORD-H5-PAID-001',
        memberId: 'mem-001',
        itemCount: 1,
        totalAmount: 88,
        paidAmount: 88,
        refundedAmount: 0,
        currency: 'CNY',
        status: 'paid',
        paymentChannel: 'WECHAT_PAY',
        paymentStatus: 'SUCCEEDED',
        createdAt: '2026-07-23T00:00:00.000Z',
        paidAt: '2026-07-23T00:10:00.000Z',
      },
    ]);
  });

  test('展示我的订单、已支付统计与真实已支付订单卡片', async () => {
    render(<H5OrdersPage />);

    await waitFor(() => {
      expect(screen.getByText('我的订单')).toBeInTheDocument();
      expect(screen.getByText((content) => content.includes('ORD-H5-PAID-001'))).toBeInTheDocument();
      expect(screen.getByText((content) => content.includes('订单号：') && content.includes('ORD-H5-PAID-001'))).toBeInTheDocument();
      expect(screen.getAllByText('已支付').length).toBeGreaterThan(0);
      expect(screen.getByText('支付方式')).toBeInTheDocument();
      expect(screen.getByText('微信支付')).toBeInTheDocument();
      expect(screen.getByText('¥88.00')).toBeInTheDocument();
    });

    expect(mockLoadOrders).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId: 'default',
        brandId: 'default-brand',
        storeId: 'default-store',
        marketCode: 'cn-mainland',
      }),
    );
  });
});
