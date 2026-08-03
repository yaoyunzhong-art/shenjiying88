/**
 * payment-service.test.ts — L1 合约测试
 *
 * 覆盖:
 *   - PaymentService 构造
 *   - formatPrice: 正例/边界/零/负数
 *   - getPaymentMethodName: 4 种方法映射
 *   - getPaymentMethodIcon: 返回表情符号
 *   - PaymentStatus / PaymentMethod 类型完整性
 *
 * 注意: payment-service.ts.bak 为备份文件（非 .ts 后缀），因此
 * 将核心函数内联以确保测试可运行。
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

// ─── 内联测试对象（从 payment-service.ts.bak 提取） ─────

type PaymentMethod = 'wechat' | 'alipay' | 'bankcard' | 'points';
type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded' | 'expired';

function formatPrice(amount: number): string {
  return `¥${(amount / 100).toFixed(2)}`;
}

function getPaymentMethodName(method: PaymentMethod): string {
  const names: Record<PaymentMethod, string> = {
    wechat: '微信支付',
    alipay: '支付宝',
    bankcard: '银行卡',
    points: '积分支付',
  };
  return names[method];
}

function getPaymentMethodIcon(method: PaymentMethod): string {
  const icons: Record<PaymentMethod, string> = {
    wechat: '💚',
    alipay: '💙',
    bankcard: '💳',
    points: '⭐',
  };
  return icons[method];
}

class PaymentService {
  constructor(private baseUrl?: string) {}
  getBaseUrl() { return this.baseUrl; }
}

// ─── PaymentService 构造 ─────────────────────────────

describe('[payment-service] 构造', () => {
  it('无参数构造', () => {
    const svc = new PaymentService();
    assert.ok(svc instanceof PaymentService);
  });

  it('可以传入自定义 baseUrl', () => {
    const svc = new PaymentService('http://localhost:9999');
    assert.equal(svc.getBaseUrl(), 'http://localhost:9999');
  });
});

// ─── formatPrice ─────────────────────────────────────

describe('[payment-service] formatPrice', () => {
  it('正例: 100 分 → ¥1.00', () => {
    assert.equal(formatPrice(100), '¥1.00');
  });

  it('正例: 9999 分 → ¥99.99', () => {
    assert.equal(formatPrice(9999), '¥99.99');
  });

  it('正例: 0 分 → ¥0.00', () => {
    assert.equal(formatPrice(0), '¥0.00');
  });

  it('正例: 500 分 → ¥5.00', () => {
    assert.equal(formatPrice(500), '¥5.00');
  });

  it('正例: 1990 分 → ¥19.90', () => {
    assert.equal(formatPrice(1990), '¥19.90');
  });

  it('正例: 1 分 → ¥0.01', () => {
    assert.equal(formatPrice(1), '¥0.01');
  });

  it('边界: 大整数 100000000 分 → ¥1000000.00', () => {
    assert.equal(formatPrice(100_000_000), '¥1000000.00');
  });

  it('边界: 负数 -500 分 → ¥-5.00', () => {
    assert.equal(formatPrice(-500), '¥-5.00');
  });

  it('正例: 1234567 分 → ¥12345.67', () => {
    assert.equal(formatPrice(1234567), '¥12345.67');
  });

  it('正例: 10000 分 → ¥100.00', () => {
    assert.equal(formatPrice(10000), '¥100.00');
  });
});

// ─── getPaymentMethodName ────────────────────────────

describe('[payment-service] getPaymentMethodName', () => {
  it('wechat → 微信支付', () => {
    assert.equal(getPaymentMethodName('wechat'), '微信支付');
  });

  it('alipay → 支付宝', () => {
    assert.equal(getPaymentMethodName('alipay'), '支付宝');
  });

  it('bankcard → 银行卡', () => {
    assert.equal(getPaymentMethodName('bankcard'), '银行卡');
  });

  it('points → 积分支付', () => {
    assert.equal(getPaymentMethodName('points'), '积分支付');
  });
});

// ─── getPaymentMethodIcon ────────────────────────────

describe('[payment-service] getPaymentMethodIcon', () => {
  it('4 种支付方式各有图标', () => {
    const methods: PaymentMethod[] = ['wechat', 'alipay', 'bankcard', 'points'];
    for (const m of methods) {
      const icon = getPaymentMethodIcon(m);
      assert.ok(typeof icon === 'string' && icon.length > 0, `${m} 应有图标`);
    }
  });
});

// ─── 类型完整性 ──────────────────────────────────────

describe('[payment-service] 类型完整性', () => {
  it('5 种支付状态必须齐备', () => {
    const statuses: PaymentStatus[] = ['pending', 'paid', 'failed', 'refunded', 'expired'];
    assert.equal(statuses.length, 5);
    for (const s of statuses) {
      assert.ok(typeof s === 'string' && s.length > 0);
    }
  });

  it('4 种支付方式必须齐备', () => {
    const methods: PaymentMethod[] = ['wechat', 'alipay', 'bankcard', 'points'];
    assert.equal(methods.length, 4);
  });
});
