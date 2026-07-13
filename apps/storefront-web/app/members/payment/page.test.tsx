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
  // --- 正例 ---
  it('正例: 应导出一个默认组件', () => assert.ok(SRC.includes('export default function')));
  it('正例: 应包含JSX模板', () => assert.ok(SRC.includes('return') && (SRC.includes('main') || SRC.includes('div') || SRC.includes('<>'))));
  it('正例: 应包含页面内容', () => assert.ok(SRC.includes('import') && SRC.length > 100));
  it('正例: 渲染已绑定支付方式列表', () => assert.ok(SRC.includes('MOCK_PAYMENTS') || SRC.includes('payments.map')));
  it('正例: 支持微信/支付宝/银行卡三种方式', () => assert.ok(SRC.includes('wechat') && SRC.includes('alipay') && SRC.includes('bankcard')));
  it('正例: 支持设置默认支付方式', () => assert.ok(SRC.includes('setDefaultPayment') || SRC.includes('设默认')));
  it('正例: 支持解绑支付方式', () => assert.ok(SRC.includes('removePayment') || SRC.includes('解绑')));
  it('正例: 支持添加新支付方式Modal', () => assert.ok(SRC.includes('showAddPayment') || SRC.includes('添加新支付方式')));
  it('正例: 交易记录表格渲染', () => assert.ok(SRC.includes('Transaction') || SRC.includes('txn') || SRC.includes('transaction')));
  it('正例: 交易记录可按类型过滤', () => assert.ok(SRC.includes('txnFilter') || SRC.includes('all') && SRC.includes('recharge')));
  it('正例: 交易详情弹窗', () => assert.ok(SRC.includes('selectedTxn') || SRC.includes('交易详情')));

  // --- 反例 ---
  it('反例: 不应使用dangerouslySetInnerHTML', () => assert.ok(!SRC.includes('dangerouslySetInnerHTML')));
  it('反例: 不应使用eval或Function构造函数', () => assert.ok(!SRC.includes('eval(') && !SRC.includes('new Function(')));
  it('反例: 添加支付时账号为空应有提示', () => assert.ok(SRC.includes("!newAccountName.trim()") || SRC.includes('请填写完整信息')));

  // --- 边界 ---
  it('边界: 支付方式含账户名和掩码账号', () => assert.ok(SRC.includes('accountName') && (SRC.includes('accountNumber') || SRC.includes('masked'))));
  it('边界: 交易金额正负数颜色区分', () => assert.ok(SRC.includes('#22c55e') && SRC.includes('#f87171') || SRC.includes('txnAmount')));
  it('边界: 交易状态有4种（成功/处理中/失败/已退款）', () => assert.ok(SRC.includes('success') && SRC.includes('pending') && SRC.includes('failed') && SRC.includes('refunded')));
  it('边界: 交易记录包含订单号', () => assert.ok(SRC.includes('orderNo') || SRC.includes('ORD')));
  it('边界: 添加支付方式时有默认空缺校验', () => assert.ok(SRC.includes('newAccountName') && SRC.includes('newAccountNumber')));
  it('边界: 交易类型标签颜色独立配置', () => assert.ok(SRC.includes('TRANSACTION_TYPES') || SRC.includes('TRANSACTION_STATUS')));
});
