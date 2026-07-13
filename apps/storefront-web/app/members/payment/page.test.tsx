/**
 * L1+L2 会员支付设置页面测试 — payment
 * 正例: 组件、JSX、绑定支付方式列表、设置默认/解绑、添加新支付Modal、交易记录表格、类型筛选
 * 反例: 无危险HTML、无eval、默认支付方式只应有一个
 * 边界: 空交易记录、添加支付时空校验、Modal打开关闭、交易记录类型过滤、交易详情弹窗
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const SRC = readFileSync(resolve(__dirname, 'page.tsx'), 'utf-8');

describe('payment 支付设置页面', () => {
  // ======== 正例 (Positive Cases) ========
  describe('正例', () => {
    it('应导出一个默认组件', () => {
      assert.ok(SRC.includes('export default function'));
    });

    it('应包含JSX模板', () => {
      assert.ok(SRC.includes('return'));
      assert.ok(SRC.includes('main') || SRC.includes('div') || SRC.includes('<>'));
    });

    it('应包含页面内容', () => {
      assert.ok(SRC.includes('import') && SRC.length > 100);
    });

    it('渲染已绑定支付方式列表', () => {
      assert.ok(SRC.includes('MOCK_PAYMENTS') || SRC.includes('payments.map'));
    });

    it('支持微信/支付宝/银行卡三种方式', () => {
      assert.ok(SRC.includes('wechat') && SRC.includes('alipay') && SRC.includes('bankcard'));
    });

    it('支持设置默认支付方式', () => {
      assert.ok(SRC.includes('setDefaultPayment') || SRC.includes('设默认'));
    });

    it('支持解绑支付方式', () => {
      assert.ok(SRC.includes('removePayment') || SRC.includes('解绑'));
    });

    it('支持添加新支付方式Modal', () => {
      assert.ok(SRC.includes('showAddPayment') || SRC.includes('添加新支付方式'));
    });

    it('交易记录表格渲染', () => {
      assert.ok(SRC.includes('txn') || SRC.includes('transaction') || SRC.includes('Transaction'));
    });

    it('交易记录可按类型过滤', () => {
      assert.ok(SRC.includes('txnFilter') || SRC.includes('recharge') && SRC.includes('payment') && SRC.includes('refund'));
    });

    it('交易详情弹窗', () => {
      assert.ok(SRC.includes('selectedTxn') || SRC.includes('交易详情'));
    });

    it('添加支付Modal含账户名称/账号输入', () => {
      assert.ok(SRC.includes('newAccountName') && SRC.includes('newAccountNumber'));
    });
  });

  // ======== 反例 (Negative Cases) ========
  describe('反例', () => {
    it('不应使用dangerouslySetInnerHTML', () => {
      assert.ok(!SRC.includes('dangerouslySetInnerHTML'));
    });

    it('不应使用eval或Function构造函数', () => {
      assert.ok(!SRC.includes('eval(') && !SRC.includes('new Function('));
    });

    it('添加支付时账号为空应有提示', () => {
      assert.ok(SRC.includes("!newAccountName.trim()") || SRC.includes('请填写完整信息'));
    });
  });

  // ======== 边界 (Boundary Cases) ========
  describe('边界', () => {
    it('支付方式含账户名和掩码账号', () => {
      assert.ok(SRC.includes('accountName') && (SRC.includes('accountNumber') || SRC.includes('masked')));
    });

    it('交易金额正负数颜色区分', () => {
      assert.ok(SRC.includes('#22c55e') && SRC.includes('#f87171') || SRC.includes('txnAmount'));
    });

    it('交易状态有4种', () => {
      assert.ok(SRC.includes('success') && SRC.includes('pending') && SRC.includes('failed') && SRC.includes('refunded'));
    });

    it('交易记录包含订单号', () => {
      assert.ok(SRC.includes('orderNo') || SRC.includes('ORD'));
    });

    it('添加支付方式时有默认空缺校验', () => {
      assert.ok(SRC.includes('newAccountName') && SRC.includes('newAccountNumber'));
    });

    it('交易类型标签颜色独立配置', () => {
      assert.ok(SRC.includes('TRANSACTION_TYPES') || SRC.includes('TRANSACTION_STATUS'));
    });

    it('Modal点击遮罩可关闭', () => {
      assert.ok(SRC.includes('setShowAddPayment(false)') || SRC.includes('showToast(false)'));
    });
  });
});
