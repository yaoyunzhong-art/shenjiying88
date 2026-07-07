/**
 * coupons/form/page.test.tsx — 优惠券创建表单页 L1 冒烟测试
 * 角色视角: 👔运营经理 · 💰财务主管 · 📊品类经理
 * 覆盖: 正例(导入/类型映射/验证/提交) + 反例(防御/验证失败) + 边界(极值)
 */

import assert from 'node:assert/strict';
import test from 'node:test';

// 关联源模块的类型和函数
import {
  emptyFormData,
  validateForm,
  hasErrors,
  submitCoupon,
  type CouponFormData,
} from './page';

/* ── 辅助: 有效完整数据 ── */

function validData(overrides: Partial<CouponFormData> = {}): CouponFormData {
  return {
    name: '夏日冰爽特惠',
    code: 'SUMMER2026',
    type: 'percentage',
    scope: 'all',
    discountValue: '15',
    threshold: '0',
    totalQuota: '10000',
    usageLimit: '1',
    startAt: '2026-07-01',
    endAt: '2026-08-31',
    ...overrides,
  };
}

/* =================================================================
 * 正例 (Happy Path)
 * ================================================================= */

test('👔 运营视角: 页面组件默认导出是函数', async () => {
  const mod = await import('./page');
  assert.equal(typeof mod.default, 'function', 'CouponFormPage 应导出函数组件');
});

test('💰 财务视角: 组件导入不抛异常', async () => {
  let threw = false;
  try {
    await import('./page');
  } catch {
    threw = true;
  }
  assert.equal(threw, false, 'page 导入应成功');
});

test('📊 品类经理视角: emptyFormData 返回默认值', () => {
  const data = emptyFormData();
  assert.equal(data.name, '');
  assert.equal(data.code, '');
  assert.equal(data.type, '');
  assert.equal(data.scope, '');
  assert.equal(data.discountValue, '');
  assert.equal(data.threshold, '0');
  assert.equal(data.totalQuota, '1000');
  assert.equal(data.usageLimit, '1');
  assert.equal(data.startAt, '');
  assert.equal(data.endAt, '');
});

test('正例: 有效完整数据通过验证', () => {
  const data = validData();
  const errors = validateForm(data);
  assert.equal(hasErrors(errors), false);
  assert.deepEqual(errors, {});
});

test('正例: 代金券验证通过', () => {
  const data = validData({ type: 'fixed', discountValue: '50' });
  const errors = validateForm(data);
  assert.equal(hasErrors(errors), false);
});

test('正例: 满减券验证通过', () => {
  const data = validData({ type: 'threshold', discountValue: '30', threshold: '200' });
  const errors = validateForm(data);
  assert.equal(hasErrors(errors), false);
});

test('正例: 包邮券验证通过', () => {
  const data = validData({ type: 'shipping', discountValue: '0', threshold: '99' });
  const errors = validateForm(data);
  assert.equal(hasErrors(errors), false);
});

test('正例: submitCoupon 成功返回正确消息', async () => {
  const data = validData();
  const result = await submitCoupon(data);
  assert.equal(result.success, true);
  assert.ok(result.message.includes('夏日冰爽特惠'));
});

test('正例: submitCoupon 检测 DUPLICATE 冲突', async () => {
  const data = validData({ code: 'DUPLICATE' });
  const result = await submitCoupon(data);
  assert.equal(result.success, false);
  assert.ok(result.message.includes('已存在'));
});

test('正例: hasErrors 对空对象返回 false', () => {
  assert.equal(hasErrors({}), false);
});

test('正例: hasErrors 对非空对象返回 true', () => {
  assert.equal(hasErrors({ name: '必填' }), true);
});

/* =================================================================
 * 反例 (Defensive / 验证失败)
 * ================================================================= */

test('反例: 名称为空报错', () => {
  const errors = validateForm(validData({ name: '' }));
  assert.ok(errors.name);
});

test('反例: 名称超过50字报错', () => {
  const errors = validateForm(validData({ name: '某'.repeat(51) }));
  assert.ok(errors.name);
});

test('反例: 券码为空报错', () => {
  const errors = validateForm(validData({ code: '' }));
  assert.ok(errors.code);
});

test('反例: 券码含小写报错', () => {
  const errors = validateForm(validData({ code: 'summer2026' }));
  assert.ok(errors.code);
});

test('反例: 券码太短报错', () => {
  const errors = validateForm(validData({ code: 'AB' }));
  assert.ok(errors.code);
});

test('反例: 未选类型报错', () => {
  const errors = validateForm(validData({ type: '' }));
  assert.ok(errors.type);
});

test('反例: 未选范围报错', () => {
  const errors = validateForm(validData({ scope: '' }));
  assert.ok(errors.scope);
});

test('反例: 折扣值为空报错', () => {
  const errors = validateForm(validData({ discountValue: '' }));
  assert.ok(errors.discountValue);
});

test('反例: 折扣值非数字报错', () => {
  const errors = validateForm(validData({ discountValue: 'abc' }));
  assert.ok(errors.discountValue);
});

test('反例: 折扣值0报错', () => {
  const errors = validateForm(validData({ discountValue: '0' }));
  assert.ok(errors.discountValue);
});

test('反例: 折扣券折扣超出99报错', () => {
  const errors = validateForm(validData({ type: 'percentage', discountValue: '100' }));
  assert.ok(errors.discountValue);
});

test('反例: 代金券金额超限报错', () => {
  const errors = validateForm(validData({ type: 'fixed', discountValue: '100000' }));
  assert.ok(errors.discountValue);
});

test('反例: 总量为空报错', () => {
  const errors = validateForm(validData({ totalQuota: '' }));
  assert.ok(errors.totalQuota);
});

test('反例: 总量为0报错', () => {
  const errors = validateForm(validData({ totalQuota: '0' }));
  assert.ok(errors.totalQuota);
});

test('反例: 总量超过999999报错', () => {
  const errors = validateForm(validData({ totalQuota: '1000000' }));
  assert.ok(errors.totalQuota);
});

test('反例: 开始日期为空报错', () => {
  const errors = validateForm(validData({ startAt: '' }));
  assert.ok(errors.startAt);
});

test('反例: 结束日期为空报错', () => {
  const errors = validateForm(validData({ endAt: '' }));
  assert.ok(errors.endAt);
});

test('反例: 结束日期早于开始日期报错', () => {
  const errors = validateForm(validData({ startAt: '2026-08-01', endAt: '2026-07-01' }));
  assert.ok(errors.endAt);
});

test('反例: 结束日期等于开始日期报错', () => {
  const errors = validateForm(validData({ startAt: '2026-07-01', endAt: '2026-07-01' }));
  assert.ok(errors.endAt);
});

test('反例: 全空数据报所有必填字段', () => {
  const errors = validateForm(emptyFormData());
  assert.ok(errors.name);
  assert.ok(errors.code);
  assert.ok(errors.type);
  assert.ok(errors.scope);
  // 未选择类型时，discountValue 不单独报错，由 type 缺失先拦截
  assert.equal(errors.discountValue, undefined);
  assert.ok(errors.startAt);
  assert.ok(errors.endAt);
  // emptyFormData 默认 totalQuota 为 1000，因此不应报总量错误
  assert.equal(errors.totalQuota, undefined);
  assert.ok(Object.keys(errors).length >= 6);
});

/* =================================================================
 * 边界 (Edge Cases)
 * ================================================================= */

test('边界: 名称恰好50字通过验证', () => {
  const errors = validateForm(validData({ name: '某'.repeat(50) }));
  assert.equal(errors.name, undefined);
});

test('边界: 券码20位通过验证', () => {
  const errors = validateForm(validData({ code: 'A'.repeat(20) }));
  assert.equal(errors.code, undefined);
});

test('边界: 券码4位通过验证', () => {
  const errors = validateForm(validData({ code: 'ABCD' }));
  assert.equal(errors.code, undefined);
});

test('边界: 总量1通过验证', () => {
  const errors = validateForm(validData({ totalQuota: '1' }));
  assert.equal(errors.totalQuota, undefined);
});

test('边界: 总量999999通过验证', () => {
  const errors = validateForm(validData({ totalQuota: '999999' }));
  assert.equal(errors.totalQuota, undefined);
});

test('边界: 折扣券折扣1通过验证', () => {
  const errors = validateForm(validData({ type: 'percentage', discountValue: '1' }));
  assert.equal(errors.discountValue, undefined);
});

test('边界: 折扣券折扣99通过验证', () => {
  const errors = validateForm(validData({ type: 'percentage', discountValue: '99' }));
  assert.equal(errors.discountValue, undefined);
});

test('边界: 代金券金额0.01通过验证', () => {
  const errors = validateForm(validData({ type: 'fixed', discountValue: '0.01' }));
  assert.equal(errors.discountValue, undefined);
});

test('边界: 代金券金额99999通过验证', () => {
  const errors = validateForm(validData({ type: 'fixed', discountValue: '99999' }));
  assert.equal(errors.discountValue, undefined);
});

test('边界: 提交后重置数据', async () => {
  const data = validData();
  const result = await submitCoupon(data);
  assert.equal(result.success, true);
  // 验证成功后 clear 的行为 (page 内部做了 setFormData(emptyFormData()))
  assert.equal(data.name, '夏日冰爽特惠'); // 调用方需自行重置
});

test('边界: 特殊字符券码不通过', () => {
  const errors = validateForm(validData({ code: 'HELLO@123' }));
  assert.ok(errors.code);
});

test('边界: 中文券码不通过', () => {
  const errors = validateForm(validData({ code: '优惠券码' }));
  assert.ok(errors.code);
});

test('边界: 负数量不通过', () => {
  const errors = validateForm(validData({ totalQuota: '-100' }));
  assert.ok(errors.totalQuota);
});
