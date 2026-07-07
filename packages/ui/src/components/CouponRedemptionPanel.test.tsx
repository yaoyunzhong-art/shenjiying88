/**
 * CouponRedemptionPanel 优惠券兑换面板测试
 *
 * 覆盖: 基础渲染、兑换汇总、优惠券列表、空/加载/错误状态、表单输入与提交、兑换结果
 */

import React from 'react';

const assert = require('node:assert/strict');
const { describe, test } = require('node:test');

const PROJECT_ROOT = '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88';
const { renderToStaticMarkup } = require(
  PROJECT_ROOT + '/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/server.node.js'
);
const { CouponRedemptionPanel } = require('./CouponRedemptionPanel');
const { StatusBadge } = require('./StatusBadge');
const { QuickStats } = require('./QuickStats');

// ==================== 测试数据 ====================

const MOCK_COUPONS = [
  {
    code: 'DISC2024',
    type: 'discount' as const,
    name: '全场8折券',
    value: '8折',
    threshold: '满100元可用',
    status: 'active' as const,
    issuedAt: '2026-06-01',
    expiresAt: '2026-07-01',
  },
  {
    code: 'CASH050',
    type: 'cash_voucher' as const,
    name: '50元代金券',
    value: '¥50',
    threshold: '满200元可用',
    status: 'active' as const,
    issuedAt: '2026-06-10',
    expiresAt: '2026-07-10',
  },
  {
    code: 'FREE001',
    type: 'product_free' as const,
    name: '免费饮品券',
    value: '免费咖啡1杯',
    status: 'used' as const,
    issuedAt: '2026-06-15',
    expiresAt: '2026-06-30',
  },
];

const MOCK_SUMMARY = {
  todayCount: 12,
  todayDiscountTotal: 386.50,
  availableCount: 5,
  expiringSoonCount: 1,
};

const MOCK_SUCCESS_RESULT = {
  success: true,
  coupon: MOCK_COUPONS[1],
  discountAmount: 50,
  finalAmount: 150,
  processedAt: '2026-06-28T18:00:00',
};

const MOCK_FAIL_RESULT = {
  success: false,
  errorMessage: '优惠券已过期',
  processedAt: '2026-06-28T18:00:00',
};

// ==================== 测试工具 ====================

function getByTestId(html: string, id: string): string | null {
  const match = html.match(new RegExp(`data-testid="${id}"[^>]*>(.*?)</`, 's'));
  return match ? match[1].trim() : null;
}

function containsText(html: string, text: string): boolean {
  const stripped = html.replace(/<[^>]*>/g, '');
  return stripped.includes(text);
}

// ==================== 测试套件 ====================

describe('CouponRedemptionPanel 🎟️ 优惠券兑换面板', () => {
  // ------- 1. 基础渲染 -------
  test('1. 渲染面板根元素 + QuickStats 汇总', () => {
    const html = renderToStaticMarkup(
      React.createElement(CouponRedemptionPanel, {
        coupons: MOCK_COUPONS,
        summary: MOCK_SUMMARY,
        orderAmount: 200,
      })
    );
    assert.ok(html.includes('data-testid="coupon-redemption-panel"'), '面板根元素缺失');
    assert.ok(containsText(html, '今日兑换'), '汇总: 今日兑换');
    assert.ok(containsText(html, '可用券'), '汇总: 可用券');
    assert.ok(containsText(html, '订单金额'), '汇总: 订单金额');
    assert.ok(containsText(html, '12'), '今日兑换次数');
    assert.ok(containsText(html, '5'), '可用券数');
    assert.ok(containsText(html, '¥200.00'), '订单金额格式化');
  });

  // ------- 2. 优惠券列表渲染 -------
  test('2. 渲染优惠券列表 - 每个券含完整信息', () => {
    const html = renderToStaticMarkup(
      React.createElement(CouponRedemptionPanel, {
        coupons: MOCK_COUPONS,
        summary: MOCK_SUMMARY,
        orderAmount: 200,
      })
    );
    assert.ok(html.includes('DISC2024'), '券码 DISC2024');
    assert.ok(html.includes('CASH050'), '券码 CASH050');
    assert.ok(html.includes('FREE001'), '券码 FREE001');
    assert.ok(containsText(html, '全场8折券'), '券名称');
    assert.ok(containsText(html, '50元代金券'), '券名称');
    assert.ok(containsText(html, '满100元可用'), '门槛描述');
    assert.ok(containsText(html, '满200元可用'), '门槛描述');
    assert.ok(containsText(html, '8折'), '折扣价值');
    assert.ok(containsText(html, '¥50'), '代金券价值');
  });

  // ------- 3. 优惠券状态显示 -------
  test('3. 状态标签渲染 - 可用/已使用', () => {
    const html = renderToStaticMarkup(
      React.createElement(CouponRedemptionPanel, {
        coupons: MOCK_COUPONS,
        summary: MOCK_SUMMARY,
        orderAmount: 200,
      })
    );
    // active 券显示 "可用", used 券显示 "已使用"
    assert.ok(containsText(html, '可用'), 'active 状态显示 "可用"');
    assert.ok(containsText(html, '已使用'), 'used 状态显示 "已使用"');
  });

  // ------- 4. 空状态 -------
  test('4. 无优惠券时显示空状态提示', () => {
    const html = renderToStaticMarkup(
      React.createElement(CouponRedemptionPanel, {
        coupons: [],
        summary: { todayCount: 0, todayDiscountTotal: 0, availableCount: 0, expiringSoonCount: 0 },
        orderAmount: 0,
      })
    );
    assert.ok(html.includes('暂无优惠券'), '空状态提示');
    assert.ok(html.includes('data-testid="coupon-empty"'));
  });

  // ------- 5. 加载状态 -------
  test('5. 加载状态显示 loading 提示', () => {
    const html = renderToStaticMarkup(
      React.createElement(CouponRedemptionPanel, {
        coupons: [],
        summary: MOCK_SUMMARY,
        orderAmount: 200,
        loading: true,
      })
    );
    assert.ok(html.includes('加载中...'), '加载提示');
    assert.ok(html.includes('data-testid="coupon-loading"'));
    // 兑换按钮应 disabled
    assert.ok(html.includes('disabled'), '加载时按钮不可用');
  });

  // ------- 6. 错误状态 -------
  test('6. 错误状态显示错误信息 + 重试按钮', () => {
    const html = renderToStaticMarkup(
      React.createElement(CouponRedemptionPanel, {
        coupons: [],
        summary: MOCK_SUMMARY,
        orderAmount: 200,
        error: '网络连接失败',
        onRetry: () => {},
      })
    );
    assert.ok(html.includes('data-testid="redemption-error"'), '错误区域');
    assert.ok(containsText(html, '网络连接失败'), '错误文本');
    assert.ok(html.includes('data-testid="retry-btn"'), '重试按钮');
  });

  // ------- 7. 输入框与表单渲染 -------
  test('7. 渲染兑换码输入框 + 兑换按钮', () => {
    const html = renderToStaticMarkup(
      React.createElement(CouponRedemptionPanel, {
        coupons: MOCK_COUPONS,
        summary: MOCK_SUMMARY,
        orderAmount: 200,
        inputValue: 'MYCODE',
      })
    );
    assert.ok(html.includes('data-testid="coupon-code-input"'), '输入框');
    assert.ok(html.includes('data-testid="redeem-btn"'), '兑换按钮');
    assert.ok(html.includes('data-testid="redemption-form"'), '表单');
    // input 的 value 和 placeholder 以 attribute 形式存在
    assert.ok(html.includes('value="MYCODE"') || html.includes("value='MYCODE'"), '输入值');
    assert.ok(html.includes('placeholder="输入优惠券码"') || html.includes("placeholder='输入优惠券码'"), 'placeholder');
    // 兑换按钮文本在按钮内部
    assert.ok(containsText(html, '兑换'), '兑换按钮文字');
  });

  // ------- 8. 兑换成功结果 -------
  test('8. 兑换成功结果渲染', () => {
    const html = renderToStaticMarkup(
      React.createElement(CouponRedemptionPanel, {
        coupons: MOCK_COUPONS,
        summary: MOCK_SUMMARY,
        orderAmount: 200,
        lastResult: MOCK_SUCCESS_RESULT,
      })
    );
    assert.ok(html.includes('data-testid="redemption-result"'), '结果区域');
    assert.ok(containsText(html, '兑换成功'), '成功文本');
    assert.ok(containsText(html, '¥50'), '优惠金额');
    assert.ok(containsText(html, '¥150.00'), '实付金额');
  });

  // ------- 9. 兑换失败结果 -------
  test('9. 兑换失败结果渲染', () => {
    const html = renderToStaticMarkup(
      React.createElement(CouponRedemptionPanel, {
        coupons: MOCK_COUPONS,
        summary: MOCK_SUMMARY,
        orderAmount: 200,
        lastResult: MOCK_FAIL_RESULT,
      })
    );
    assert.ok(html.includes('data-testid="redemption-result"'), '结果区域');
    assert.ok(containsText(html, '兑换失败'), '失败文本');
    assert.ok(containsText(html, '优惠券已过期'), '失败原因');
  });

  // ------- 10. 自定义文案 -------
  test('10. 自定义 placeholder / 按钮文字生效', () => {
    const html = renderToStaticMarkup(
      React.createElement(CouponRedemptionPanel, {
        coupons: [],
        summary: MOCK_SUMMARY,
        orderAmount: 100,
        inputPlaceholder: '请输入券码',
        redeemButtonText: '立即兑换',
      })
    );
    assert.ok(html.includes('placeholder="请输入券码"') || html.includes("placeholder='请输入券码'"), '自定义 placeholder');
    assert.ok(containsText(html, '立即兑换'), '自定义按钮文字');
  });
});
