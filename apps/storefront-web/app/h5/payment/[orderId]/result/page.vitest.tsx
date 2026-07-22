import React from 'react';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';

const mockGetOrderTransaction = vi.fn();
const mockResolveScope = vi.fn();
const mockHandleBack = vi.fn();

vi.mock('next/navigation', () => ({
  useParams: () => ({ orderId: 'order-result-001' }),
}));

vi.mock('next/link', () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

vi.mock('../../../../../components/h5-components', () => ({
  MobileLayout: ({ title, children }: { title?: string; children: React.ReactNode }) => (
    <div data-testid="mobile-layout" data-title={title}>
      {children}
    </div>
  ),
  H5Button: ({ children }: { children: React.ReactNode }) => <button>{children}</button>,
  useH5Back: () => mockHandleBack,
}));

vi.mock('../../../../_components/useTriState', () => ({
  useTriState: () => ({
    loading: false,
    error: null,
    wrapLoad: async (promise: Promise<any>) => promise,
  }),
}));

vi.mock('../../../../_components/TriStateRenderer', () => ({
  TriStateRenderer: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('../../../../../lib/storefront-transactions', () => ({
  RESULT_DISPLAY: {
    success: {
      icon: '✅',
      title: '支付成功',
      subtitle: '感谢您的支付，订单已确认',
      bgColor: 'rgba(74, 222, 128, 0.15)',
    },
    failed: {
      icon: '❌',
      title: '支付失败',
      subtitle: '支付未完成，请稍后重试',
      bgColor: 'rgba(239, 68, 68, 0.15)',
    },
    pending: {
      icon: '⏳',
      title: '支付处理中',
      subtitle: '正在等待支付结果确认',
      bgColor: 'rgba(251, 191, 36, 0.15)',
    },
  },
  formatCurrency: (amount: number, currency = 'CNY') => (currency === 'CNY' ? `¥${amount.toFixed(2)}` : `${currency} ${amount.toFixed(2)}`),
  getPaymentMethodLabel: (channel?: string) => (channel === 'WECHAT_PAY' ? '微信支付' : '待确认'),
  getPaymentResultActions: () => [
    { label: '查看订单', href: '/h5/orders', variant: 'primary' },
    { label: '返回首页', href: '/h5', variant: 'secondary' },
  ],
  getStorefrontOrderTransaction: (...args: any[]) => mockGetOrderTransaction(...args),
  mapAggregateToResultStatus: () => 'success',
  resolveStorefrontScope: (...args: any[]) => mockResolveScope(...args),
}));

import PaymentResultPage from './page';

describe('PaymentResultPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockResolveScope.mockReturnValue({
      tenantId: 'default',
      brandId: 'default-brand',
      storeId: 'default-store',
      marketCode: 'cn-mainland',
    });
    mockGetOrderTransaction.mockResolvedValue({
      order: {
        orderId: 'order-result-001',
        orderNo: 'ORD-RESULT-001',
        totalAmount: 88,
        currency: 'CNY',
        paidAt: '2026-07-23T00:10:00.000Z',
      },
      payment: {
        paymentId: 'payment-result-001',
        channel: 'WECHAT_PAY',
        amount: 88,
        completedAt: '2026-07-23T00:10:00.000Z',
      },
      refunds: [],
    });
  });

  test('成功态展示结果文案、订单信息与操作按钮', async () => {
    render(<PaymentResultPage />);

    await waitFor(() => {
      expect(screen.getByTestId('mobile-layout')).toHaveAttribute('data-title', '支付结果');
      expect(screen.getByText('支付成功')).toBeInTheDocument();
      expect(screen.getByText('感谢您的支付，订单已确认')).toBeInTheDocument();
      expect(screen.getByText('订单编号')).toBeInTheDocument();
      expect(screen.getByText('ORD-RESULT-001')).toBeInTheDocument();
      expect(screen.getByText('支付方式')).toBeInTheDocument();
      expect(screen.getByText('微信支付')).toBeInTheDocument();
      expect(screen.getByText('支付金额')).toBeInTheDocument();
      expect(screen.getByText('¥88.00')).toBeInTheDocument();
      expect(screen.getByRole('link', { name: '查看订单' })).toHaveAttribute('href', '/h5/orders');
      expect(screen.getByRole('link', { name: '返回首页' })).toHaveAttribute('href', '/h5');
    });
  });
});
