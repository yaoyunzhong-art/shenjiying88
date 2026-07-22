import React from 'react';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';

const mockPush = vi.fn();
const mockHandleBack = vi.fn();
const mockGetOrderTransaction = vi.fn();
const mockResolveScope = vi.fn();
const mockMapAggregateToPaymentView = vi.fn();
const mockMapChannelToH5Method = vi.fn();

vi.mock('next/navigation', () => ({
  useParams: () => ({ orderId: 'order-h5-pending-001' }),
  useRouter: () => ({ push: mockPush }),
}));

vi.mock('@m5/ui', () => ({
  QRCodeDisplay: ({ value }: { value: string }) => <div data-testid="qr-code">{value}</div>,
}));

vi.mock('../../../../components/h5-components', () => ({
  MobileLayout: ({ title, children }: { title?: string; children: React.ReactNode }) => (
    <div data-testid="mobile-layout" data-title={title}>
      {children}
    </div>
  ),
  H5Card: ({ children }: { children: React.ReactNode }) => <div data-testid="h5-card">{children}</div>,
  H5Button: ({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) => (
    <button onClick={onClick}>{children}</button>
  ),
  useH5Back: () => mockHandleBack,
}));

vi.mock('../../../../lib/storefront-transactions', () => ({
  formatCurrency: (amount: number, currency = 'CNY') => (currency === 'CNY' ? `¥${amount.toFixed(2)}` : `${currency} ${amount.toFixed(2)}`),
  getPaymentMethodLabel: (method?: string) => (method === 'wechat' || method === 'WECHAT_PAY' ? '微信支付' : '待确认'),
  getStorefrontOrderTransaction: (...args: any[]) => mockGetOrderTransaction(...args),
  mapAggregateToPaymentView: (...args: any[]) => mockMapAggregateToPaymentView(...args),
  mapChannelToH5Method: (...args: any[]) => mockMapChannelToH5Method(...args),
  resolveStorefrontScope: (...args: any[]) => mockResolveScope(...args),
}));

import PaymentPage from './page';

describe('H5 PaymentPage', () => {
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
        orderId: 'order-h5-pending-001',
        orderNo: 'ORD-H5-001',
        currency: 'CNY',
      },
      payment: {
        paymentId: 'payment-h5-001',
        channel: 'WECHAT_PAY',
      },
      refunds: [],
    });
    mockMapChannelToH5Method.mockReturnValue('wechat');
    mockMapAggregateToPaymentView.mockReturnValue({
      orderId: 'order-h5-pending-001',
      orderCode: 'ORD-H5-001',
      amount: 66,
      status: 'pending',
      method: 'wechat',
      qrCode: undefined,
      expireAt: undefined,
      createdAt: '2026-07-23T00:00:00.000Z',
      storeId: 'default-store',
    });
  });

  test('pending 无二维码时展示真实支付渠道提示而非伪二维码', async () => {
    render(<PaymentPage />);

    await waitFor(() => {
      expect(screen.getByTestId('mobile-layout')).toHaveAttribute('data-title', '订单支付');
    });

    await waitFor(() => {
      expect(screen.getByText('当前支付状态')).toBeInTheDocument();
      expect(screen.getByText('支付方式：微信支付')).toBeInTheDocument();
      expect(screen.getByText('支付单号：payment-h5-001')).toBeInTheDocument();
      expect(screen.getByText('当前页面不再前端伪造二维码，请在真实支付渠道完成支付后刷新状态。')).toBeInTheDocument();
    });

    expect(screen.queryByTestId('qr-code')).not.toBeInTheDocument();
    expect(mockGetOrderTransaction).toHaveBeenCalledWith(
      'order-h5-pending-001',
      expect.objectContaining({
        tenantId: 'default',
        brandId: 'default-brand',
        storeId: 'default-store',
        marketCode: 'cn-mainland',
      }),
    );
  });
});
