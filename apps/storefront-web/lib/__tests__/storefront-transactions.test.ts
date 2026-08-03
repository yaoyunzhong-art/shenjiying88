/**
 * storefront-transactions.test.ts — L1 合约测试
 *
 * 覆盖纯函数（不涉及 fetch 调用）:
 *   - formatCurrency: 正例/边界
 *   - buildStorefrontMemberId: 手机号转为 memberId
 *   - mapCheckoutMethodToChannel: Checkout → 渠道名
 *   - mapCheckoutMethodToH5Method: Checkout → H5 支付方法
 *   - mapChannelToH5Method: 后端渠道 → H5 支付方法
 *   - getPaymentMethodLabel: 渠道名 → 中文标签
 *   - getRuntimePaymentStatus: 根据聚合数据推导状态
 *   - mapAggregateToResultStatus: 聚合 → 结果状态
 *   - getPaymentResultActions: 结果状态 → 操作按钮
 *   - DEFAULT_STOREFRONT_SCOPE / RESULT_DISPLAY 常量
 *   - STOREFRONT_SCOPE_STORAGE_KEYS 常量
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  formatCurrency,
  buildStorefrontMemberId,
  mapCheckoutMethodToChannel,
  mapCheckoutMethodToH5Method,
  mapChannelToH5Method,
  getPaymentMethodLabel,
  getRuntimePaymentStatus,
  mapAggregateToResultStatus,
  getPaymentResultActions,
  DEFAULT_STOREFRONT_SCOPE,
  RESULT_DISPLAY,
  STOREFRONT_SCOPE_STORAGE_KEYS,
} from '../storefront-transactions.ts';
import type { StorefrontTransactionAggregate, H5PaymentMethod, RuntimePaymentStatus, PaymentResultStatus } from '../storefront-transactions.ts';

// ─── formatCurrency ────────────────────────────────

describe('[storefront-transactions] formatCurrency', () => {
  it('CNY 加上 ¥ 前缀', () => {
    assert.equal(formatCurrency(99.99, 'CNY'), '¥99.99');
  });

  it('USD 加上 USD 前缀', () => {
    assert.equal(formatCurrency(9.99, 'USD'), 'USD 9.99');
  });

  it('默认货币为 CNY', () => {
    assert.equal(formatCurrency(100), '¥100.00');
  });

  it('0 元输出 ¥0.00', () => {
    assert.equal(formatCurrency(0), '¥0.00');
  });

  it('边界: 大金额 999999.99', () => {
    assert.equal(formatCurrency(999999.99), '¥999999.99');
  });

  it('边界: 负数金额 -50.00', () => {
    assert.equal(formatCurrency(-50.00), '¥-50.00');
  });
});

// ─── buildStorefrontMemberId ───────────────────────

describe('[storefront-transactions] buildStorefrontMemberId', () => {
  it('正常手机号转 memberId', () => {
    assert.equal(buildStorefrontMemberId('13800138000'), 'sf-member-13800138000');
  });

  it('手机号含特殊字符自动过滤', () => {
    assert.equal(buildStorefrontMemberId('+86 138-0013-8000'), 'sf-member-8613800138000');
  });

  it('无效手机号仍生成 guest 前缀', () => {
    assert.equal(buildStorefrontMemberId(''), 'sf-member-guest');
  });

  it('纯数字字符串', () => {
    assert.equal(buildStorefrontMemberId('12345'), 'sf-member-12345');
  });
});

// ─── mapCheckoutMethodToChannel ────────────────────

describe('[storefront-transactions] mapCheckoutMethodToChannel', () => {
  it('wechat → WECHAT_PAY', () => {
    assert.equal(mapCheckoutMethodToChannel('wechat'), 'WECHAT_PAY');
  });

  it('alipay → ALIPAY', () => {
    assert.equal(mapCheckoutMethodToChannel('alipay'), 'ALIPAY');
  });

  it('cash → CASH', () => {
    assert.equal(mapCheckoutMethodToChannel('cash'), 'CASH');
  });

  it('member_card → MEMBER_CARD', () => {
    assert.equal(mapCheckoutMethodToChannel('member_card'), 'MEMBER_CARD');
  });
});

// ─── mapCheckoutMethodToH5Method ───────────────────

describe('[storefront-transactions] mapCheckoutMethodToH5Method', () => {
  it('wechat → wechat', () => {
    assert.equal(mapCheckoutMethodToH5Method('wechat'), 'wechat');
  });

  it('alipay → alipay', () => {
    assert.equal(mapCheckoutMethodToH5Method('alipay'), 'alipay');
  });

  it('member_card → member_card', () => {
    assert.equal(mapCheckoutMethodToH5Method('member_card'), 'member_card');
  });
});

// ─── mapChannelToH5Method ──────────────────────────

describe('[storefront-transactions] mapChannelToH5Method', () => {
  it('WECHAT_PAY → wechat', () => {
    assert.equal(mapChannelToH5Method('WECHAT_PAY'), 'wechat');
  });

  it('ALIPAY → alipay', () => {
    assert.equal(mapChannelToH5Method('ALIPAY'), 'alipay');
  });

  it('CASH → cash', () => {
    assert.equal(mapChannelToH5Method('CASH'), 'cash');
  });

  it('MEMBER_CARD → member_card', () => {
    assert.equal(mapChannelToH5Method('MEMBER_CARD'), 'member_card');
  });

  it('未定义或空值返回默认 wechat', () => {
    assert.equal(mapChannelToH5Method(), 'wechat');
    assert.equal(mapChannelToH5Method(''), 'wechat');
  });

  it('未知渠道名返回默认 wechat', () => {
    assert.equal(mapChannelToH5Method('BITCOIN'), 'wechat');
  });
});

// ─── getPaymentMethodLabel ─────────────────────────

describe('[storefront-transactions] getPaymentMethodLabel', () => {
  it('WECHAT_PAY → 微信支付', () => {
    assert.equal(getPaymentMethodLabel('WECHAT_PAY'), '微信支付');
  });

  it('wechat → 微信支付', () => {
    assert.equal(getPaymentMethodLabel('wechat'), '微信支付');
  });

  it('ALIPAY → 支付宝', () => {
    assert.equal(getPaymentMethodLabel('ALIPAY'), '支付宝');
  });

  it('CASH → 现金', () => {
    assert.equal(getPaymentMethodLabel('CASH'), '现金');
  });

  it('MEMBER_CARD → 会员卡支付', () => {
    assert.equal(getPaymentMethodLabel('member_card'), '会员卡支付');
  });

  it('空值返回 待确认', () => {
    assert.equal(getPaymentMethodLabel(), '待确认');
  });

  it('未知枚举返回原值', () => {
    assert.equal(getPaymentMethodLabel('UNKNOWN'), 'UNKNOWN');
  });
});

// ─── getRuntimePaymentStatus ───────────────────────

describe('[storefront-transactions] getRuntimePaymentStatus', () => {
  const baseAggregate = (overrides: Partial<StorefrontTransactionAggregate> = {}): StorefrontTransactionAggregate => ({
    order: { orderId: 'ord-001', orderNo: 'ORD-001', totalAmount: 1000, currency: 'CNY', status: 'PENDING', items: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    payment: undefined,
    refunds: [],
    storeInfo: { storeId: 'store-001', name: '门店' },
    ...overrides,
  } as unknown as StorefrontTransactionAggregate);

  it('有已完成退款 → refunded', () => {
    const agg = baseAggregate({
      refunds: [{ refundId: 'ref-001', status: 'COMPLETED' }] as any,
    });
    assert.equal(getRuntimePaymentStatus(agg), 'refunded');
  });

  it('退款状态非 COMPLETED 不算 refunded', () => {
    const agg = baseAggregate({
      refunds: [{ refundId: 'ref-001', status: 'REQUESTED' }] as any,
    });
    // 没有 completed 退款，状态由 payment/order 决定
    const status = getRuntimePaymentStatus(agg);
    assert.notEqual(status, 'refunded');
  });

  it('payment SUCCEEDED → paid', () => {
    const agg = baseAggregate({
      payment: { status: 'SUCCEEDED' } as any,
      refunds: [] as any,
    });
    assert.equal(getRuntimePaymentStatus(agg), 'paid');
  });

  it('order status PAID → paid', () => {
    const agg = baseAggregate({
      order: { status: 'PAID' } as any,
      refunds: [] as any,
    });
    assert.equal(getRuntimePaymentStatus(agg), 'paid');
  });

  it('payment FAILED → failed', () => {
    const agg = baseAggregate({
      payment: { status: 'FAILED' } as any,
      refunds: [] as any,
    });
    assert.equal(getRuntimePaymentStatus(agg), 'failed');
  });

  it('超时订单 → expired', () => {
    const old = new Date(Date.now() - 20 * 60 * 1000).toISOString();
    const agg = baseAggregate({
      order: { status: 'PENDING', createdAt: old } as any,
      refunds: [] as any,
    });
    assert.equal(getRuntimePaymentStatus(agg, Date.now()), 'expired');
  });

  it('CLOSED 状态 → expired', () => {
    const agg = baseAggregate({
      order: { status: 'CLOSED', closeReason: 'PAYMENT_TIMEOUT' } as any,
      refunds: [] as any,
    });
    assert.equal(getRuntimePaymentStatus(agg), 'expired');
  });

  it('默认 → pending', () => {
    const agg = baseAggregate({ refunds: [] as any });
    assert.equal(getRuntimePaymentStatus(agg), 'pending');
  });
});

// ─── mapAggregateToResultStatus ────────────────────

describe('[storefront-transactions] mapAggregateToResultStatus', () => {
  const baseAggregate = (overrides: Partial<StorefrontTransactionAggregate> = {}): StorefrontTransactionAggregate => ({
    order: { orderId: 'ord-001', status: 'PENDING', totalAmount: 1000, currency: 'CNY', items: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    ...overrides,
  } as unknown as StorefrontTransactionAggregate);

  it('paid → success', () => {
    const agg = baseAggregate({ payment: { status: 'SUCCEEDED' } as any, refunds: [] as any });
    assert.equal(mapAggregateToResultStatus(agg), 'success');
  });

  it('refunded → success', () => {
    const agg = baseAggregate({ refunds: [{ refundId: 'r1', status: 'COMPLETED' }] as any });
    assert.equal(mapAggregateToResultStatus(agg), 'success');
  });

  it('failed → failed', () => {
    const agg = baseAggregate({ payment: { status: 'FAILED' } as any, refunds: [] as any });
    assert.equal(mapAggregateToResultStatus(agg), 'failed');
  });

  it('expired → failed', () => {
    const old = new Date(Date.now() - 20 * 60 * 1000).toISOString();
    const agg = baseAggregate({ order: { status: 'PENDING', createdAt: old } as any, refunds: [] as any });
    assert.equal(mapAggregateToResultStatus(agg, Date.now()), 'failed');
  });

  it('pending → pending', () => {
    const agg = baseAggregate({ refunds: [] as any });
    assert.equal(mapAggregateToResultStatus(agg), 'pending');
  });
});

// ─── getPaymentResultActions ───────────────────────

describe('[storefront-transactions] getPaymentResultActions', () => {
  it('success: 返回 2 个操作', () => {
    const actions = getPaymentResultActions('success', 'ord-001');
    assert.equal(actions.length, 2);
    assert.equal(actions[0].label, '查看订单');
    assert.ok(actions[0].href?.includes('orders'));
    assert.equal(actions[1].label, '返回首页');
  });

  it('failed: 包含 重新支付 操作', () => {
    const actions = getPaymentResultActions('failed', 'ord-001');
    assert.equal(actions.length, 2);
    assert.equal(actions[0].label, '重新支付');
    assert.ok(actions[0].href?.includes('ord-001'));
  });

  it('pending: 包含 action: back', () => {
    const actions = getPaymentResultActions('pending', 'ord-001');
    assert.equal(actions.length, 2);
    assert.equal(actions[0].action, 'back');
    assert.equal(actions[0].variant, 'secondary');
  });
});

// ─── 常量 ──────────────────────────────────────────

describe('[storefront-transactions] 常量', () => {
  it('DEFAULT_STOREFRONT_SCOPE 包含完整的 4 字段', () => {
    assert.equal(DEFAULT_STOREFRONT_SCOPE.marketCode, 'cn-mainland');
    assert.equal(DEFAULT_STOREFRONT_SCOPE.tenantId, 'demo-tenant');
    assert.equal(DEFAULT_STOREFRONT_SCOPE.brandId, 'demo-brand');
    assert.equal(DEFAULT_STOREFRONT_SCOPE.storeId, 'store-001');
  });

  it('STOREFRONT_SCOPE_STORAGE_KEYS 包含 4 个 key', () => {
    const keys = Object.values(STOREFRONT_SCOPE_STORAGE_KEYS);
    assert.equal(keys.length, 4);
    assert.ok(keys.every((k) => typeof k === 'string' && k.startsWith('storefront.')));
  });

  it('RESULT_DISPLAY 包含 3 种结果状态', () => {
    const statuses: PaymentResultStatus[] = ['success', 'failed', 'pending'];
    for (const s of statuses) {
      const display = RESULT_DISPLAY[s];
      assert.ok(typeof display.icon === 'string', `${s}.icon 应为字符串`);
      assert.ok(typeof display.title === 'string' && display.title.length > 0, `${s}.title 必填`);
      assert.ok(typeof display.subtitle === 'string' && display.subtitle.length > 0, `${s}.subtitle 必填`);
      assert.ok(typeof display.bgColor === 'string' && display.bgColor.length > 0, `${s}.bgColor 必填`);
    }
  });

  it('RESULT_DISPLAY success 的 icon 应是 ✅', () => {
    assert.equal(RESULT_DISPLAY.success.icon, '✅');
  });

  it('RESULT_DISPLAY failed 的 icon 应是 ❌', () => {
    assert.equal(RESULT_DISPLAY.failed.icon, '❌');
  });
});
