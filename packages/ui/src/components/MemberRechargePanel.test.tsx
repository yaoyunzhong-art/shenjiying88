import React from 'react';

const assert = require('node:assert/strict');
const { describe, test } = require('node:test');
const { renderToStaticMarkup } = require('react-dom/server');
import { MemberRechargePanel } from './MemberRechargePanel';

const mockPlans = [
  { id: 'plan-1', name: '50元', amount: 5000, bonus: 0 },
  { id: 'plan-2', name: '100元', amount: 10000, bonus: 500 },
  { id: 'plan-3', name: '200元', amount: 20000, bonus: 2000, recommended: true, bonusPoints: 100 },
  { id: 'plan-4', name: '500元', amount: 50000, bonus: 8000, expiryDays: 365 },
];

const mockRecords = [
  { id: 'r1', memberName: '张三', memberPhone: '13800138000', amount: 10000, bonus: 500, paymentMethod: 'wechat' as const, createdAt: '2026-06-28 14:30', operator: '李四', status: 'success' as const },
  { id: 'r2', memberName: '张三', memberPhone: '13800138000', amount: 5000, bonus: 0, paymentMethod: 'alipay' as const, createdAt: '2026-06-27 10:00', operator: '李四', status: 'success' as const },
];

function render(props: Record<string, unknown>) {
  return renderToStaticMarkup(React.createElement(MemberRechargePanel, props));
}

describe('MemberRechargePanel', () => {
  test('renders member name and masked phone', () => {
    const html = render({
      memberName: '张三',
      memberPhone: '13800138000',
      currentBalance: 5000,
      plans: mockPlans,
    });
    assert.ok(html.includes('张三'));
    assert.ok(html.includes('138****8000'));
  });

  test('renders current balance', () => {
    const html = render({
      memberName: '张三',
      memberPhone: '13800138000',
      currentBalance: 5000,
      plans: mockPlans,
    });
    assert.ok(html.includes('¥50.00'));
  });

  test('renders member tier badge when provided', () => {
    const html = render({
      memberName: '张三',
      memberPhone: '13800138000',
      memberTier: '黄金会员',
      currentBalance: 5000,
      plans: mockPlans,
    });
    assert.ok(html.includes('黄金会员'));
  });

  test('renders all recharge plan amounts', () => {
    const html = render({
      memberName: '张三',
      memberPhone: '13800138000',
      currentBalance: 5000,
      plans: mockPlans,
    });
    assert.ok(html.includes('¥50.00'), 'should show ¥50.00');
    assert.ok(html.includes('¥100.00'), 'should show ¥100.00');
    assert.ok(html.includes('¥200.00'), 'should show ¥200.00');
    assert.ok(html.includes('¥500.00'), 'should show ¥500.00');
  });

  test('shows recommended badge', () => {
    const html = render({
      memberName: '张三',
      memberPhone: '13800138000',
      currentBalance: 5000,
      plans: mockPlans,
    });
    assert.ok(html.includes('推荐'));
  });

  test('shows bonus amounts', () => {
    const html = render({
      memberName: '张三',
      memberPhone: '13800138000',
      currentBalance: 5000,
      plans: mockPlans,
    });
    assert.ok(html.includes('+¥5.00'), 'should include +¥5.00');
    assert.ok(html.includes('+¥20.00'), 'should include +¥20.00');
    assert.ok(html.includes('+¥80.00'), 'should include +¥80.00');
  });

  test('shows bonus points when available', () => {
    const html = render({
      memberName: '张三',
      memberPhone: '13800138000',
      currentBalance: 5000,
      plans: mockPlans,
    });
    assert.ok(html.includes('赠 100 积分'));
  });

  test('shows expiry days', () => {
    const html = render({
      memberName: '张三',
      memberPhone: '13800138000',
      currentBalance: 5000,
      plans: mockPlans,
    });
    assert.ok(html.includes('365天有效'));
  });

  test('renders payment method labels', () => {
    const html = render({
      memberName: '张三',
      memberPhone: '13800138000',
      currentBalance: 5000,
      plans: mockPlans,
      paymentMethods: ['wechat', 'alipay', 'cash'],
    });
    assert.ok(html.includes('微信支付'));
    assert.ok(html.includes('支付宝'));
    assert.ok(html.includes('现金'));
  });

  test('renders custom amount input by default', () => {
    const html = render({
      memberName: '张三',
      memberPhone: '13800138000',
      currentBalance: 5000,
      plans: mockPlans,
    });
    assert.ok(html.includes('自定义充值金额'));
  });

  test('hides custom amount input when customAmount=false', () => {
    const html = render({
      memberName: '张三',
      memberPhone: '13800138000',
      currentBalance: 5000,
      plans: mockPlans,
      customAmount: false,
    });
    assert.ok(!html.includes('自定义充值金额'));
  });

  test('renders recent recharge records section', () => {
    const html = render({
      memberName: '张三',
      memberPhone: '13800138000',
      currentBalance: 5000,
      plans: mockPlans,
      recentRecords: mockRecords,
    });
    assert.ok(html.includes('最近充值记录'));
    assert.ok(html.includes('2026-06-28 14:30'));
    assert.ok(html.includes('2026-06-27 10:00'));
  });

  test('does not show records when recentRecords is empty array', () => {
    const html = render({
      memberName: '张三',
      memberPhone: '13800138000',
      currentBalance: 5000,
      plans: mockPlans,
      recentRecords: [],
    });
    assert.ok(!html.includes('最近充值记录'));
  });

  test('does not show records when recentRecords is undefined', () => {
    const html = render({
      memberName: '张三',
      memberPhone: '13800138000',
      currentBalance: 5000,
      plans: mockPlans,
    });
    assert.ok(!html.includes('最近充值记录'));
  });

  test('shows error when provided', () => {
    const html = render({
      memberName: '张三',
      memberPhone: '13800138000',
      currentBalance: 5000,
      plans: mockPlans,
      error: '系统异常',
    });
    assert.ok(html.includes('系统异常'));
    assert.ok(html.includes('role="alert"'));
  });

  test('shows success message when success=true', () => {
    const html = render({
      memberName: '张三',
      memberPhone: '13800138000',
      currentBalance: 5000,
      plans: mockPlans,
      success: true,
    });
    assert.ok(html.includes('充值成功'));
  });

  test('renders aria-label on region', () => {
    const html = render({
      memberName: '张三',
      memberPhone: '13800138000',
      currentBalance: 5000,
      plans: mockPlans,
    });
    assert.ok(html.includes('aria-label="会员充值"'));
  });

  test('renders radio groups', () => {
    const html = render({
      memberName: '张三',
      memberPhone: '13800138000',
      currentBalance: 5000,
      plans: mockPlans,
    });
    assert.ok(html.includes('role="radiogroup"'));
    assert.ok(html.includes('aria-label="充值方案"'));
    assert.ok(html.includes('aria-label="支付方式"'));
  });

  test('shows success status badges in records', () => {
    const html = render({
      memberName: '张三',
      memberPhone: '13800138000',
      currentBalance: 5000,
      plans: mockPlans,
      recentRecords: mockRecords,
    });
    const matches = html.match(/成功<\/span>/g);
    assert.equal(matches?.length, 2);
  });

  test('shows failed status badge', () => {
    const recordsWithFailed = [
      { id: 'r3', memberName: '张三', memberPhone: '13800138000', amount: 5000, bonus: 0, paymentMethod: 'alipay' as const, createdAt: '2026-06-26 09:00', operator: '王五', status: 'failed' as const },
    ];
    const html = render({
      memberName: '张三',
      memberPhone: '13800138000',
      currentBalance: 5000,
      plans: mockPlans,
      recentRecords: recordsWithFailed,
    });
    assert.ok(html.includes('失败'));
  });

  test('shows pending status badge', () => {
    const recordsWithPending = [
      { id: 'r4', memberName: '张三', memberPhone: '13800138000', amount: 5000, bonus: 0, paymentMethod: 'wechat' as const, createdAt: '2026-06-26 09:00', operator: '王五', status: 'pending' as const },
    ];
    const html = render({
      memberName: '张三',
      memberPhone: '13800138000',
      currentBalance: 5000,
      plans: mockPlans,
      recentRecords: recordsWithPending,
    });
    assert.ok(html.includes('处理中'));
  });

  test('confirm button is disabled when no plan selected and no custom amount', () => {
    const html = render({
      memberName: '张三',
      memberPhone: '13800138000',
      currentBalance: 5000,
      plans: mockPlans,
    });
    assert.ok(html.includes('disabled'), 'button should be disabled');
    assert.ok(html.includes('确认充值'), 'button text should show');
  });

  test('confirm button shows correct amount when plan selected', () => {
    const html = render({
      memberName: '张三',
      memberPhone: '13800138000',
      currentBalance: 5000,
      plans: mockPlans,
      selectedPlanId: 'plan-2',
    });
    assert.ok(html.includes('确认充值 ¥100.00'));
  });

  test('confirm button shows correct amount when custom amount set', () => {
    const html = render({
      memberName: '张三',
      memberPhone: '13800138000',
      currentBalance: 5000,
      plans: mockPlans,
      customAmountValue: '300',
    });
    assert.ok(html.includes('确认充值 ¥3,000.00') || html.includes('确认充值 ¥3,000') || html.includes('确认充值 ¥300'));
  });

  test('confirm button shows 充值中 when submitting', () => {
    const html = render({
      memberName: '张三',
      memberPhone: '13800138000',
      currentBalance: 5000,
      plans: mockPlans,
      submitting: true,
    });
    assert.ok(html.includes('充值中...'));
  });

  test('has selectedPlanId reflected in data-selected', () => {
    const html = render({
      memberName: '张三',
      memberPhone: '13800138000',
      currentBalance: 5000,
      plans: mockPlans,
      selectedPlanId: 'plan-1',
    });
    assert.ok(html.includes('data-selected'));
  });
});
