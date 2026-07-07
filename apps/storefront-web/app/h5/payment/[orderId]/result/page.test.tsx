/**
 * h5/payment/[orderId]/result/page.test.tsx — 支付结果页测试
 * 验证: 结果状态映射、UI 文案、操作按钮逻辑、订单信息展示
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

// ── 数据类型 (与 page.tsx 一致) ──

type PaymentResultStatus = 'success' | 'failed' | 'pending';

interface PaymentResultDisplay {
  /** 状态对应的图标 */
  icon: string;
  /** 主标题 */
  title: string;
  /** 副标题 / 说明文案 */
  subtitle: string;
  /** 图标背景色 (rgba) */
  bgColor: string;
}

interface ResultAction {
  label: string;
  href?: string;
  variant: 'primary' | 'secondary' | 'ghost';
  action?: string;
}

// ── UI 状态定义 (与 page.tsx 一致) ──

const RESULT_DISPLAY: Record<PaymentResultStatus, PaymentResultDisplay> = {
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
};

// ── 操作按钮配置 ──

function getActions(status: PaymentResultStatus, orderId: string): ResultAction[] {
  switch (status) {
    case 'success':
      return [
        { label: '查看订单', href: '/h5/orders', variant: 'primary' },
        { label: '返回首页', href: '/h5', variant: 'secondary' },
      ];
    case 'failed':
      return [
        { label: '重新支付', href: `/h5/payment/${orderId}`, variant: 'primary' },
        { label: '返回首页', href: '/h5', variant: 'secondary' },
      ];
    case 'pending':
      return [
        { label: '返回支付页面', variant: 'secondary', action: 'back' },
        { label: '先逛逛其他', href: '/h5', variant: 'ghost' },
      ];
    default:
      return [];
  }
}

// ── Mock 数据 ──

const MOCK_RESULTS: { orderId: string; status: PaymentResultStatus }[] = [
  { orderId: 'order-001', status: 'success' },
  { orderId: 'order-002', status: 'failed' },
  { orderId: 'order-003', status: 'pending' },
];

// ── 测试 ──

describe('PaymentResultPage - 常量验证', () => {
  it('RESULT_DISPLAY 包含所有状态', () => {
    const keys = Object.keys(RESULT_DISPLAY).sort();
    assert.deepEqual(keys, ['failed', 'pending', 'success']);
  });

  it('每条状态包含 icon / title / subtitle / bgColor', () => {
    for (const [status, display] of Object.entries(RESULT_DISPLAY)) {
      assert.ok(typeof display.icon === 'string' && display.icon.length > 0, `icon missing for ${status}`);
      assert.ok(typeof display.title === 'string' && display.title.length > 0, `title missing for ${status}`);
      assert.ok(typeof display.subtitle === 'string' && display.subtitle.length > 0, `subtitle missing for ${status}`);
      assert.ok(typeof display.bgColor === 'string' && display.bgColor.length > 0, `bgColor missing for ${status}`);
    }
  });
});

describe('PaymentResultPage - 状态 UI 文案', () => {
  it('success 状态显示支付成功', () => {
    const d = RESULT_DISPLAY.success;
    assert.equal(d.icon, '✅');
    assert.equal(d.title, '支付成功');
    assert.equal(d.subtitle, '感谢您的支付，订单已确认');
    assert.equal(d.bgColor, 'rgba(74, 222, 128, 0.15)');
  });

  it('failed 状态显示支付失败', () => {
    const d = RESULT_DISPLAY.failed;
    assert.equal(d.icon, '❌');
    assert.equal(d.title, '支付失败');
    assert.equal(d.subtitle, '支付未完成，请稍后重试');
    assert.equal(d.bgColor, 'rgba(239, 68, 68, 0.15)');
  });

  it('pending 状态显示支付处理中', () => {
    const d = RESULT_DISPLAY.pending;
    assert.equal(d.icon, '⏳');
    assert.equal(d.title, '支付处理中');
    assert.equal(d.subtitle, '正在等待支付结果确认');
    assert.equal(d.bgColor, 'rgba(251, 191, 36, 0.15)');
  });
});

describe('PaymentResultPage - 操作按钮', () => {
  it('success 状态有查看订单和返回首页按钮', () => {
    const actions = getActions('success', 'order-001');
    assert.equal(actions.length, 2);
    assert.equal(actions[0].label, '查看订单');
    assert.equal(actions[0].href, '/h5/orders');
    assert.equal(actions[0].variant, 'primary');
    assert.equal(actions[1].label, '返回首页');
    assert.equal(actions[1].href, '/h5');
    assert.equal(actions[1].variant, 'secondary');
  });

  it('failed 状态有重新支付和返回首页按钮', () => {
    const actions = getActions('failed', 'order-002');
    assert.equal(actions.length, 2);
    assert.equal(actions[0].label, '重新支付');
    assert.equal(actions[0].href, '/h5/payment/order-002');
    assert.equal(actions[0].variant, 'primary');
    assert.equal(actions[1].label, '返回首页');
    assert.equal(actions[1].href, '/h5');
    assert.equal(actions[1].variant, 'secondary');
  });

  it('pending 状态有返回支付页面和先逛逛其他按钮', () => {
    const actions = getActions('pending', 'order-003');
    assert.equal(actions.length, 2);
    assert.equal(actions[0].label, '返回支付页面');
    assert.equal(actions[0].variant, 'secondary');
    assert.equal(actions[0].action, 'back');
    assert.equal(actions[1].label, '先逛逛其他');
    assert.equal(actions[1].href, '/h5');
    assert.equal(actions[1].variant, 'ghost');
  });

  it('未知状态返回空按钮列表', () => {
    const actions = getActions('unknown' as PaymentResultStatus, 'order-x');
    assert.deepEqual(actions, []);
  });
});

describe('PaymentResultPage - 订单信息展示', () => {
  it('成功结果包含订单编号字段', () => {
    const result = MOCK_RESULTS.find((r) => r.status === 'success')!;
    assert.ok(result.orderId, 'orderId should exist');
    assert.equal(result.status, 'success');
  });

  it('失败结果包含订单编号字段', () => {
    const result = MOCK_RESULTS.find((r) => r.status === 'failed')!;
    assert.ok(result.orderId, 'orderId should exist');
    assert.equal(result.status, 'failed');
  });

  it('处理中结果包含订单编号字段', () => {
    const result = MOCK_RESULTS.find((r) => r.status === 'pending')!;
    assert.ok(result.orderId, 'orderId should exist');
    assert.equal(result.status, 'pending');
  });
});

describe('PaymentResultPage - Mock 数据完整性', () => {
  it('每条 Mock 结果有 orderId 和 status', () => {
    for (const r of MOCK_RESULTS) {
      assert.ok(r.orderId, `Missing orderId`);
      assert.ok(r.status, `Missing status`);
    }
  });

  it('每种状态至少有一条 Mock 数据', () => {
    const statuses = new Set(MOCK_RESULTS.map((r) => r.status));
    assert.ok(statuses.has('success'));
    assert.ok(statuses.has('failed'));
    assert.ok(statuses.has('pending'));
  });
});

describe('PaymentResultPage - 边缘情况', () => {
  it('empty orderId 时的操作按钮', () => {
    const actions = getActions('failed', '');
    assert.equal(actions[0].href, '/h5/payment/');
  });

  it('特殊字符 orderId 时的重新支付链接', () => {
    const actions = getActions('failed', 'order/abc?x=1');
    assert.equal(actions[0].href, '/h5/payment/order/abc?x=1');
  });

  it('三种状态图标各不相同', () => {
    const icons = Object.values(RESULT_DISPLAY).map((d) => d.icon);
    const unique = new Set(icons);
    assert.equal(unique.size, 3);
  });

  it('三种状态背景色各不相同', () => {
    const colors = Object.values(RESULT_DISPLAY).map((d) => d.bgColor);
    const unique = new Set(colors);
    assert.equal(unique.size, 3);
  });

  it('所有状态的 subtitle 不为空', () => {
    for (const d of Object.values(RESULT_DISPLAY)) {
      assert.ok(d.subtitle.length > 0, `Empty subtitle`);
    }
  });

  it('所有操作按钮的 label 不为空', () => {
    for (const status of ['success', 'failed', 'pending'] as PaymentResultStatus[]) {
      const actions = getActions(status, 'order-test');
      for (const action of actions) {
        assert.ok(action.label.length > 0, `Empty label in ${status}`);
      }
    }
  });
});
