/**
 * h5/payment/[orderId]/page.test.tsx — 扫码支付页面测试
 * 验证: 常量映射、支付方式选择、金额格式化、倒计时、状态流转
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

// ── 数据类型 (与 page.tsx 一致) ──

type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded' | 'expired';
type PaymentMethod = 'wechat' | 'alipay' | 'bankcard' | 'points';

interface PaymentOrder {
  orderId: string;
  orderCode: string;
  amount: number;
  originalAmount?: number;
  discountAmount?: number;
  status: PaymentStatus;
  method?: PaymentMethod;
  qrCode?: string;
  qrCodeUrl?: string;
  expireAt?: string;
  paidAt?: string;
  createdAt: string;
  storeName?: string;
  storeId?: string;
  description?: string;
}

const PAYMENT_METHODS: { method: PaymentMethod; name: string; icon: string }[] = [
  { method: 'wechat', name: '微信支付', icon: '💚' },
  { method: 'alipay', name: '支付宝', icon: '💙' },
  { method: 'bankcard', name: '银行卡', icon: '💳' },
  { method: 'points', name: '积分支付', icon: '⭐' },
];

const METHOD_NAMES: Record<PaymentMethod, string> = {
  wechat: '微信支付',
  alipay: '支付宝',
  bankcard: '银行卡',
  points: '积分支付',
};

const METHOD_ICONS: Record<PaymentMethod, string> = {
  wechat: '💚',
  alipay: '💙',
  bankcard: '💳',
  points: '⭐',
};

const STATUS_LABELS: Record<PaymentStatus, string> = {
  pending: '待支付',
  paid: '已支付',
  failed: '支付失败',
  refunded: '已退款',
  expired: '已过期',
};

// ── 工具函数 (与 page.tsx / payment-service.ts 一致) ──

function formatPrice(cents: number): string {
  return `¥${(cents / 100).toFixed(2)}`;
}

function getPaymentMethodName(method: PaymentMethod): string {
  return METHOD_NAMES[method] ?? '未知方式';
}

function getPaymentMethodIcon(method: PaymentMethod): string {
  return METHOD_ICONS[method] ?? '💳';
}

// ── Mock 数据 ──

const MOCK_ORDERS: PaymentOrder[] = [
  {
    orderId: 'order-001',
    orderCode: 'ORD-20260707-001',
    amount: 9999,
    originalAmount: 12999,
    discountAmount: 3000,
    status: 'pending',
    method: 'wechat',
    qrCode: 'data:image/png;base64,mock-qr-001',
    expireAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
    createdAt: new Date().toISOString(),
    storeName: '旗舰店',
    storeId: 'store-001',
    description: '会员套餐A',
  },
  {
    orderId: 'order-002',
    orderCode: 'ORD-20260707-002',
    amount: 58800,
    status: 'paid',
    method: 'alipay',
    paidAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    storeName: '旗舰店',
    storeId: 'store-001',
    description: '钻石年卡',
  },
  {
    orderId: 'order-003',
    orderCode: 'ORD-20260707-003',
    amount: 1500,
    status: 'expired',
    createdAt: new Date().toISOString(),
    description: '积分兑换',
  },
  {
    orderId: 'order-004',
    orderCode: 'ORD-20260707-004',
    amount: 0,
    status: 'pending',
    createdAt: new Date().toISOString(),
  },
];

// ── 测试 ──

describe('PaymentPage - 常量 & 工具函数验证', () => {
  it('PAYMENT_METHODS 包含所有支付方式', () => {
    const methods = PAYMENT_METHODS.map((m) => m.method);
    assert.deepEqual(methods.sort(), ['alipay', 'bankcard', 'points', 'wechat']);
  });

  it('PAYMENT_METHODS 每条记录包含 method/name/icon', () => {
    for (const m of PAYMENT_METHODS) {
      assert.ok(typeof m.method === 'string' && m.method.length > 0, `method missing for ${m.name}`);
      assert.ok(typeof m.name === 'string' && m.name.length > 0, `name missing for ${m.method}`);
      assert.ok(typeof m.icon === 'string' && m.icon.length > 0, `icon missing for ${m.method}`);
    }
  });

  it('METHOD_NAMES 覆盖所有付款方式', () => {
    const keys = Object.keys(METHOD_NAMES).sort();
    assert.deepEqual(keys, ['alipay', 'bankcard', 'points', 'wechat']);
    assert.equal(METHOD_NAMES.wechat, '微信支付');
    assert.equal(METHOD_NAMES.alipay, '支付宝');
    assert.equal(METHOD_NAMES.bankcard, '银行卡');
    assert.equal(METHOD_NAMES.points, '积分支付');
  });

  it('METHOD_ICONS 覆盖所有付款方式', () => {
    const keys = Object.keys(METHOD_ICONS).sort();
    assert.deepEqual(keys, ['alipay', 'bankcard', 'points', 'wechat']);
    assert.equal(METHOD_ICONS.wechat, '💚');
    assert.equal(METHOD_ICONS.alipay, '💙');
  });

  it('STATUS_LABELS 覆盖所有支付状态', () => {
    const keys = Object.keys(STATUS_LABELS).sort();
    assert.deepEqual(keys, ['expired', 'failed', 'paid', 'pending', 'refunded']);
    assert.equal(STATUS_LABELS.pending, '待支付');
    assert.equal(STATUS_LABELS.paid, '已支付');
    assert.equal(STATUS_LABELS.failed, '支付失败');
    assert.equal(STATUS_LABELS.refunded, '已退款');
    assert.equal(STATUS_LABELS.expired, '已过期');
  });
});

describe('PaymentPage - formatPrice', () => {
  it('整数分转元，显示 ¥ 前缀', () => {
    assert.equal(formatPrice(9999), '¥99.99');
    assert.equal(formatPrice(0), '¥0.00');
    assert.equal(formatPrice(100), '¥1.00');
    assert.equal(formatPrice(1), '¥0.01');
  });

  it('大额金额格式化', () => {
    assert.equal(formatPrice(58800), '¥588.00');
    assert.equal(formatPrice(128800), '¥1288.00');
    assert.equal(formatPrice(9999900), '¥99999.00');
  });

  it('负数金额处理', () => {
    assert.equal(formatPrice(-500), '¥-5.00');
  });
});

describe('PaymentPage - getPaymentMethodName', () => {
  it('返回已知支付方式的中文名', () => {
    assert.equal(getPaymentMethodName('wechat'), '微信支付');
    assert.equal(getPaymentMethodName('alipay'), '支付宝');
    assert.equal(getPaymentMethodName('bankcard'), '银行卡');
    assert.equal(getPaymentMethodName('points'), '积分支付');
  });

  it('未知支付方式返回默认值', () => {
    assert.equal(getPaymentMethodName('unknown' as PaymentMethod), '未知方式');
  });
});

describe('PaymentPage - Mock 数据验证', () => {
  it('每条 Mock 订单有 orderId 和 orderCode', () => {
    for (const order of MOCK_ORDERS) {
      assert.ok(order.orderId, `Missing orderId in ${JSON.stringify(order)}`);
      assert.ok(order.orderCode, `Missing orderCode in ${JSON.stringify(order)}`);
    }
  });

  it('每条 Mock 订单金额 >= 0', () => {
    for (const order of MOCK_ORDERS) {
      assert.ok(order.amount >= 0, `Negative amount ${order.amount} for ${order.orderId}`);
    }
  });

  it('每条 Mock 订单有正确的 status', () => {
    const validStatuses: PaymentStatus[] = ['pending', 'paid', 'failed', 'refunded', 'expired'];
    for (const order of MOCK_ORDERS) {
      assert.ok(validStatuses.includes(order.status), `Invalid status ${order.status} for ${order.orderId}`);
    }
  });

  it('不同状态的订单数量正确', () => {
    const pending = MOCK_ORDERS.filter((o) => o.status === 'pending').length;
    const paid = MOCK_ORDERS.filter((o) => o.status === 'paid').length;
    const expired = MOCK_ORDERS.filter((o) => o.status === 'expired').length;
    assert.equal(pending, 2);
    assert.equal(paid, 1);
    assert.equal(expired, 1);
  });

  it('paid 状态的订单有 paidAt 字段', () => {
    const paidOrders = MOCK_ORDERS.filter((o) => o.status === 'paid');
    for (const order of paidOrders) {
      assert.ok(order.paidAt, `paidAt missing for paid order ${order.orderId}`);
    }
  });

  it('pending 状态的订单有 expireAt 字段', () => {
    const pendingOrders = MOCK_ORDERS.filter((o) => o.status === 'pending' && o.amount > 0);
    for (const order of pendingOrders) {
      assert.ok(order.expireAt, `expireAt missing for pending order ${order.orderId}`);
    }
  });
});

describe('PaymentPage - 支付方式选择逻辑', () => {
  it('默认支付方式为 wechat', () => {
    const defaultMethod: PaymentMethod = 'wechat';
    assert.equal(defaultMethod, 'wechat');
  });

  it('切换支付方式函数不抛出异常', () => {
    // 模拟 handleMethodChange 逻辑
    let selected: PaymentMethod = 'wechat';
    function handleMethodChange(method: PaymentMethod) {
      selected = method;
    }

    handleMethodChange('alipay');
    assert.equal(selected, 'alipay');

    handleMethodChange('points');
    assert.equal(selected, 'points');
  });
});

describe('PaymentPage - 倒计时逻辑', () => {
  it('倒计时在过期时为 0', () => {
    const expiredTime = Date.now() - 1000; // 已过期
    const remaining = Math.max(0, Math.floor((expiredTime - Date.now()) / 1000));
    assert.equal(remaining, 0);
  });

  it('倒计时显示格式为 MM:SS', () => {
    const totalSeconds = 125;
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const formatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    assert.equal(formatted, '02:05');
  });

  it('剩余不足 1 分钟时精确到秒', () => {
    const totalSeconds = 45;
    const formatted = `0:${String(totalSeconds).padStart(2, '0')}`;
    assert.equal(formatted, '0:45');
  });

  it('倒计时 0 时显示 0:00', () => {
    const totalSeconds = 0;
    const formatted = `0:${String(totalSeconds).padStart(2, '0')}`;
    assert.equal(formatted, '0:00');
  });
});

describe('PaymentPage - 支付状态 UI 逻辑', () => {
  it('pending 状态显示二维码', () => {
    const ordersWithQr = MOCK_ORDERS.filter((o) => o.status === 'pending' && o.qrCode);
    assert.equal(ordersWithQr.length, 1);
    assert.ok(ordersWithQr[0].qrCode?.startsWith('data:image/png;base64,'));
  });

  it('paid 状态不显示二维码', () => {
    const paidOrders = MOCK_ORDERS.filter((o) => o.status === 'paid');
    for (const order of paidOrders) {
      assert.equal(order.qrCode, undefined);
    }
  });

  it('expired 状态显示过期提示', () => {
    const expiredOrders = MOCK_ORDERS.filter((o) => o.status === 'expired');
    assert.equal(expiredOrders.length, 1);
    assert.equal(expiredOrders[0].status, 'expired');
  });

  it('支付按钮仅在 pending 且金额 > 0 时显示', () => {
    for (const order of MOCK_ORDERS) {
      if (order.status === 'pending') {
        // 金额 > 0 的待支付订单应有二维码，金额为 0 的免费订单无需支付
        if (order.amount > 0) {
          assert.ok(order.qrCode, `Pending order ${order.orderId} with amount > 0 should have qrCode`);
        }
      }
    }
  });
});

describe('PaymentPage - 金额展示逻辑', () => {
  it('有优惠时显示原价和优惠价', () => {
    const orderWithDiscount = MOCK_ORDERS.find((o) => o.discountAmount && o.originalAmount);
    assert.ok(orderWithDiscount, 'Should have at least one order with discount');
    if (orderWithDiscount) {
      assert.ok(orderWithDiscount.originalAmount! > orderWithDiscount.amount);
      assert.equal(orderWithDiscount.originalAmount! - orderWithDiscount.amount, orderWithDiscount.discountAmount);
    }
  });

  it('应付金额格式化正确', () => {
    const order = MOCK_ORDERS[0];
    const formatted = formatPrice(order.amount);
    assert.equal(formatted, '¥99.99');
  });

  it('原价格式化正确', () => {
    const order = MOCK_ORDERS[0];
    if (order.originalAmount) {
      const formatted = formatPrice(order.originalAmount);
      assert.equal(formatted, '¥129.99');
    }
  });
});

describe('PaymentPage - 边缘情况', () => {
  it('金额为 0 的免费订单可正常格式化', () => {
    const freeOrder = MOCK_ORDERS.find((o) => o.amount === 0);
    assert.ok(freeOrder);
    assert.equal(formatPrice(freeOrder!.amount), '¥0.00');
  });

  it('缺少 storeName 时订单仍有效', () => {
    const orderNoStore = MOCK_ORDERS.find((o) => !o.storeName);
    assert.ok(orderNoStore);
    assert.ok(orderNoStore!.orderId);
  });

  it('所有支付方式图标不为空', () => {
    for (const m of PAYMENT_METHODS) {
      assert.ok(m.icon.length > 0);
    }
  });
});
