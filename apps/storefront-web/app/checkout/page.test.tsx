/**
 * CheckoutPage 结算页测试
 *
 * 覆盖:
 * 1. 基础渲染 — 标题、描述、表单字段区域标题
 * 2. 购物车商品列表渲染 — 名称、数量、单价
 * 3. 价格计算 — 商品数量、小计、合计、配送费
 * 4. 表单属性 — placeholder、maxLength、必填星号
 * 5. 服务条款复选框
 * 6. 提交按钮
 */

import React from 'react';

const assert = require('node:assert/strict');
const { describe, test } = require('node:test');

const PROJECT_ROOT = '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88';
const { renderToStaticMarkup } = require(
  PROJECT_ROOT + '/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/server.node.js'
);
const CheckoutPage = require('./page').default;

// ==================== 辅助函数 ====================

function render(ui: React.ReactElement): string {
  return renderToStaticMarkup(ui);
}

function hasText(html: string, text: string): boolean {
  return html.includes(text);
}

// ==================== 测试用例 ====================

describe('CheckoutPage 结算页', () => {
  // ---- 1. 基础渲染 ----
  describe('基础渲染 (Basic Rendering)', () => {
    test('应渲染页面标题和描述', () => {
      const html = render(React.createElement(CheckoutPage));
      assert.ok(hasText(html, '结算'), '应显示页面标题');
      assert.ok(hasText(html, '确认商品信息并提交订单'), '应显示页面描述');
    });

    test('应包含 data-testid 属性', () => {
      const html = render(React.createElement(CheckoutPage));
      assert.ok(hasText(html, 'data-testid="checkout-form-section"'), '应包含表单区域 testid');
      assert.ok(hasText(html, 'data-testid="checkout-summary-section"'), '应包含摘要区域 testid');
    });

    test('应渲染所有必填表单字段和分区标题', () => {
      const html = render(React.createElement(CheckoutPage));
      // 分区
      assert.ok(hasText(html, '收件信息'), '应渲染收件信息区域');
      assert.ok(hasText(html, '配送'), '应渲染配送区域');
      assert.ok(hasText(html, '订单摘要'), '应渲染订单摘要区域');
      // 字段标签
      assert.ok(hasText(html, '收件人姓名'), '应渲染收件人姓名字段');
      assert.ok(hasText(html, '手机号'), '应渲染手机号字段');
      assert.ok(hasText(html, '邮箱'), '应渲染邮箱字段');
      assert.ok(hasText(html, '收货地址'), '应渲染收货地址字段');
      assert.ok(hasText(html, '所在城市'), '应渲染所在城市字段');
      assert.ok(hasText(html, '配送方式'), '应渲染配送方式字段');
      assert.ok(hasText(html, '支付方式'), '应渲染支付方式字段');
      assert.ok(hasText(html, '备注'), '应渲染备注字段');
    });
  });

  // ---- 2. 购物车商品 ----
  describe('购物车商品 (Cart Items)', () => {
    test('应渲染默认购物车商品名称和数量', () => {
      const html = render(React.createElement(CheckoutPage));
      assert.ok(hasText(html, '基础护肤套装'), '应显示基础护肤套装');
      assert.ok(hasText(html, '深层清洁面膜'), '应显示深层清洁面膜');
      assert.ok(hasText(html, '防晒霜 SPF50+'), '应显示防晒霜');
      // 商品数量
      assert.ok(hasText(html, 'x1'), '防晒霜数量应为1');
      assert.ok(hasText(html, 'x2'), '面膜数量应为2');
    });

    test('商品价格应正确显示', () => {
      const html = render(React.createElement(CheckoutPage));
      // 299*1 + 89*2 = 178 + 139*1
      assert.ok(hasText(html, '¥299.00'), '护肤套装价格');
      assert.ok(hasText(html, '¥178.00'), '面膜2片价格');
      assert.ok(hasText(html, '¥139.00'), '防晒霜价格');
    });
  });

  // ---- 3. 价格计算 ----
  describe('价格计算 (Price Calculation)', () => {
    test('应正确显示商品数量和商品小计', () => {
      const html = render(React.createElement(CheckoutPage));
      assert.ok(hasText(html, '4 件'), '商品数量应为4件');
      assert.ok(hasText(html, '商品小计'), '应显示商品小计行');
    });

    test('合计金额应正确: 299+89*2+139 = 616', () => {
      const html = render(React.createElement(CheckoutPage));
      assert.ok(hasText(html, '¥616.00'), '合计应显示 ¥616.00');
    });

    test('满 199 应显示免运费', () => {
      const html = render(React.createElement(CheckoutPage));
      assert.ok(hasText(html, '免运费'), '满199免运费');
    });
  });

  // ---- 4. 提交按钮 ----
  describe('提交按钮 (Submit Button)', () => {
    test('应显示提交按钮并包含合计金额', () => {
      const html = render(React.createElement(CheckoutPage));
      assert.ok(hasText(html, '提交订单'), '应显示提交按钮');
      assert.ok(hasText(html, '¥616.00'), '按钮上应显示金额');
    });

    test('应显示服务条款复选框', () => {
      const html = render(React.createElement(CheckoutPage));
      assert.ok(hasText(html, '我已阅读并同意服务条款和隐私政策'), '应渲染同意条款');
    });
  });

  // ---- 5. 表单属性 ----
  describe('表单属性 (Form Attributes)', () => {
    test('输入框应有 placeholder', () => {
      const html = render(React.createElement(CheckoutPage));
      assert.ok(hasText(html, '请输入收件人姓名'), '姓名输入框应有 placeholder');
      assert.ok(hasText(html, '请输入手机号'), '手机号输入框应有 placeholder');
      assert.ok(hasText(html, '请输入详细地址'), '地址输入框应有 placeholder');
      assert.ok(hasText(html, '请输入城市名'), '城市输入框应有 placeholder');
    });

    test('备注文本域应有 maxLength', () => {
      const html = render(React.createElement(CheckoutPage));
      assert.ok(hasText(html, '订单备注...'), '备注应有 placeholder');
      assert.ok(hasText(html, 'maxlength="200"') || hasText(html, 'maxLength="200"'), '备注应限制200字');
    });

    test('必填字段应有红色星号标记', () => {
      const html = render(React.createElement(CheckoutPage));
      assert.ok(hasText(html, '#ef4444'), '必填字段应有红色星号样式');
    });
  });
});
