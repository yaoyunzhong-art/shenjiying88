import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  DEFAULT_STOREFRONT_SCOPE,
  formatCurrency,
  getPaymentMethodLabel,
  getRuntimePaymentStatus,
  mapAggregateToPaymentView,
  mapChannelToH5Method,
  mapCheckoutMethodToChannel,
  mapCheckoutMethodToH5Method,
  type StorefrontTransactionAggregate,
} from '../../../../lib/storefront-transactions';

const BASE_CREATED_AT = new Date(Date.now() - 5 * 60 * 1000).toISOString();
const BASE_UPDATED_AT = BASE_CREATED_AT;
const DERIVED_EXPIRE_AT = new Date(new Date(BASE_CREATED_AT).getTime() + 15 * 60 * 1000).toISOString();

function createAggregate(overrides: Partial<StorefrontTransactionAggregate> = {}): StorefrontTransactionAggregate {
  return {
    order: {
      orderId: 'order-001',
      orderNo: 'ORD20260720001',
      memberId: 'sf-member-13800138000',
      currency: 'CNY',
      totalAmount: 99.9,
      status: 'PENDING_PAYMENT',
      createdAt: BASE_CREATED_AT,
      updatedAt: BASE_UPDATED_AT,
      items: [
        { skuId: 'sku-001', title: '基础护肤套装', quantity: 1, price: 99.9 },
      ],
    },
    payment: {
      paymentId: 'payment-001',
      orderId: 'order-001',
      channel: 'WECHAT_PAY',
      amount: 99.9,
      status: 'PENDING',
      createdAt: BASE_CREATED_AT,
      updatedAt: BASE_UPDATED_AT,
    },
    memberNickname: '张三',
    refunds: [],
    ...overrides,
  };
}

describe('PaymentPage helper - 金额与渠道映射', () => {
  it('formatCurrency 使用元口径，不再按分缩放', () => {
    assert.equal(formatCurrency(99.9), '¥99.90');
    assert.equal(formatCurrency(0), '¥0.00');
    assert.equal(formatCurrency(1288), '¥1288.00');
  });

  it('checkout 支付方式映射到交易主链渠道', () => {
    assert.equal(mapCheckoutMethodToChannel('wechat'), 'WECHAT_PAY');
    assert.equal(mapCheckoutMethodToChannel('alipay'), 'ALIPAY');
    assert.equal(mapCheckoutMethodToChannel('cash'), 'CASH');
    assert.equal(mapCheckoutMethodToChannel('member_card'), 'MEMBER_CARD');
  });

  it('checkout 支付方式映射到 h5 支付方式', () => {
    assert.equal(mapCheckoutMethodToH5Method('wechat'), 'wechat');
    assert.equal(mapCheckoutMethodToH5Method('alipay'), 'alipay');
    assert.equal(mapCheckoutMethodToH5Method('cash'), 'cash');
    assert.equal(mapCheckoutMethodToH5Method('member_card'), 'member_card');
  });

  it('真实渠道可回映射到 h5 展示方式', () => {
    assert.equal(mapChannelToH5Method('WECHAT_PAY'), 'wechat');
    assert.equal(mapChannelToH5Method('ALIPAY'), 'alipay');
    assert.equal(mapChannelToH5Method('MEMBER_CARD'), 'member_card');
    assert.equal(mapChannelToH5Method('CASH'), 'cash');
  });
});

describe('PaymentPage helper - 状态识别', () => {
  it('待支付订单识别为 pending', () => {
    const aggregate = createAggregate();
    assert.equal(getRuntimePaymentStatus(aggregate, Date.now()), 'pending');
  });

  it('支付成功订单识别为 paid', () => {
    const aggregate = createAggregate({
      order: { ...createAggregate().order, status: 'PAID', paidAt: '2026-07-20T10:05:00.000Z' },
      payment: { ...createAggregate().payment!, status: 'SUCCEEDED', completedAt: '2026-07-20T10:05:00.000Z' },
    });
    assert.equal(getRuntimePaymentStatus(aggregate), 'paid');
  });

  it('支付失败订单识别为 failed', () => {
    const aggregate = createAggregate({
      order: { ...createAggregate().order, status: 'PAYMENT_FAILED' },
      payment: { ...createAggregate().payment!, status: 'FAILED' },
    });
    assert.equal(getRuntimePaymentStatus(aggregate), 'failed');
  });

  it('超时关闭订单识别为 expired', () => {
    const aggregate = createAggregate({
      order: {
        ...createAggregate().order,
        status: 'CLOSED',
        closeReason: 'PAYMENT_TIMEOUT',
        createdAt: '2026-07-20T09:00:00.000Z',
      },
    });
    assert.equal(getRuntimePaymentStatus(aggregate, new Date('2026-07-20T10:00:01.000Z').getTime()), 'expired');
  });

  it('已完成退款优先识别为 refunded', () => {
    const aggregate = createAggregate({
      refunds: [
        {
          refundId: 'refund-001',
          orderId: 'order-001',
          paymentId: 'payment-001',
          memberId: 'sf-member-13800138000',
          refundAmount: 99.9,
          reason: '用户申请',
          status: 'COMPLETED',
          requestedAt: '2026-07-20T10:10:00.000Z',
          completedAt: '2026-07-20T10:12:00.000Z',
        },
      ],
    });
    assert.equal(getRuntimePaymentStatus(aggregate), 'refunded');
  });
});

describe('PaymentPage helper - 视图模型', () => {
  it('pending 订单默认不再前端生成伪二维码，但仍保留有效期', () => {
    const view = mapAggregateToPaymentView(createAggregate(), 'alipay');
    assert.equal(view.orderId, 'order-001');
    assert.equal(view.orderCode, 'ORD20260720001');
    assert.equal(view.amount, 99.9);
    assert.equal(view.status, 'pending');
    assert.equal(view.method, 'alipay');
    assert.equal(view.qrCode, undefined);
    assert.equal(view.expireAt, DERIVED_EXPIRE_AT);
    assert.equal(view.storeId, DEFAULT_STOREFRONT_SCOPE.storeId);
  });

  it('后端已提供 expiresAt 时应优先使用后端有效期', () => {
    const aggregate = createAggregate({
      payment: {
        ...createAggregate().payment!,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
      },
    });

    const view = mapAggregateToPaymentView(aggregate, 'wechat');
    assert.equal(view.expireAt, aggregate.payment!.expiresAt);
  });

  it('后端提供非法 expiresAt 时应回退到 createdAt 推导有效期', () => {
    const aggregate = createAggregate({
      payment: {
        ...createAggregate().payment!,
        expiresAt: 'not-a-valid-time',
      },
    });

    const view = mapAggregateToPaymentView(aggregate, 'wechat');
    assert.equal(view.expireAt, DERIVED_EXPIRE_AT);
  });

  it('后端已提供二维码字段时应直接透传展示', () => {
    const aggregate = createAggregate({
      payment: {
        ...createAggregate().payment!,
        qrCodeUrl: 'https://pay.example.com/qrcode/order-001.png',
      },
    });

    const view = mapAggregateToPaymentView(aggregate, 'wechat');
    assert.equal(view.qrCode, 'https://pay.example.com/qrcode/order-001.png');
    assert.equal(view.status, 'pending');
  });

  it('后端未提供 qrCodeUrl 时应回退到 paymentUrl', () => {
    const aggregate = createAggregate({
      payment: {
        ...createAggregate().payment!,
        paymentUrl: 'https://pay.example.com/pay/order-001',
      },
    });

    const view = mapAggregateToPaymentView(aggregate, 'wechat');
    assert.equal(view.qrCode, 'https://pay.example.com/pay/order-001');
  });

  it('createdAt 非法时不应生成无效 expireAt，状态也不应误判为 expired', () => {
    const aggregate = createAggregate({
      order: {
        ...createAggregate().order,
        createdAt: 'invalid-created-at',
      },
      payment: {
        ...createAggregate().payment!,
        createdAt: 'invalid-created-at',
      },
    });

    const view = mapAggregateToPaymentView(aggregate, 'wechat');
    assert.equal(view.expireAt, undefined);
    assert.equal(getRuntimePaymentStatus(aggregate, new Date('2026-07-20T12:00:00.000Z').getTime()), 'pending');
  });

  it('paid 订单不再携带二维码', () => {
    const aggregate = createAggregate({
      order: { ...createAggregate().order, status: 'PAID', paidAt: '2026-07-20T10:05:00.000Z' },
      payment: { ...createAggregate().payment!, status: 'SUCCEEDED', completedAt: '2026-07-20T10:05:00.000Z' },
    });
    const view = mapAggregateToPaymentView(aggregate);
    assert.equal(view.status, 'paid');
    assert.equal(view.qrCode, undefined);
    assert.equal(view.paidAt, '2026-07-20T10:05:00.000Z');
  });

  it('支付方式标签兼容真实渠道和 h5 方式', () => {
    assert.equal(getPaymentMethodLabel('WECHAT_PAY'), '微信支付');
    assert.equal(getPaymentMethodLabel('member_card'), '会员卡支付');
    assert.equal(getPaymentMethodLabel(undefined), '待确认');
  });
});
