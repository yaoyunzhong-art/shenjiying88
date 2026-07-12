// Cashier page L1 test
// 验证会员收银页面组件渲染与会员搜索逻辑

import assert from 'node:assert/strict';
import test from 'node:test';

import {
  searchMember,
  fetchConsumptionHistory,
} from './page';
import type { MemberProfile, ConsumptionRecord } from './page';

// ---- 类型验证 ----

test('CashierPage types — MemberProfile shape', () => {
  const profile: MemberProfile = {
    id: 'm001',
    phone: '13800138001',
    cardNo: 'VIP2024001',
    name: '张三',
    level: '黄金会员',
    balance: 5280.50,
    points: 3200,
  };

  assert.equal(profile.id, 'm001');
  assert.equal(typeof profile.balance, 'number');
  assert.equal(typeof profile.points, 'number');
});

test('CashierPage types — ConsumptionRecord shape', () => {
  const record: ConsumptionRecord = {
    id: 'c001',
    orderNo: 'ORD20260711001',
    time: '2026-07-11 20:15',
    amount: 128.00,
    type: 'sale',
    description: '洗剪吹套餐',
  };

  assert.equal(record.id, 'c001');
  assert.equal(record.type, 'sale');
  assert.equal(record.amount, 128.00);
});

// ---- searchMember 函数测试 ----

test('searchMember — 空查询返回 null', async () => {
  const result = await searchMember('');
  assert.equal(result, null);
});

test('searchMember — 空白字符查询返回 null', async () => {
  const result = await searchMember('   ');
  assert.equal(result, null);
});

test('searchMember — 按手机号搜索返回正确会员', async () => {
  const result = await searchMember('13800138001');
  assert.ok(result !== null);
  assert.equal(result!.name, '张三');
  assert.equal(result!.phone, '13800138001');
  assert.equal(result!.level, '黄金会员');
});

test('searchMember — 按会员卡号搜索返回正确会员', async () => {
  const result = await searchMember('VIP2024002');
  assert.ok(result !== null);
  assert.equal(result!.name, '李四');
  assert.equal(result!.cardNo, 'VIP2024002');
});

test('searchMember — 模糊查询支持', async () => {
  const byPhone = await searchMember('138');
  assert.ok(byPhone !== null);
  assert.ok(byPhone.phone.startsWith('138'));

  const byCard = await searchMember('vip2024');
  assert.ok(byCard !== null);
  assert.ok(byCard.cardNo.toLowerCase().includes('vip2024'));
});

test('searchMember — 不存在的会员返回 null', async () => {
  const result = await searchMember('13900000000');
  assert.equal(result, null);
});

// ---- fetchConsumptionHistory 函数测试 ----

test('fetchConsumptionHistory — 返回该会员的消费记录数组', async () => {
  const records = await fetchConsumptionHistory('m001');
  assert.ok(Array.isArray(records));
  assert.ok(records.length > 0);
  assert.equal(typeof records[0].id, 'string');
});

test('fetchConsumptionHistory — 每条记录包含必要字段', async () => {
  const records = await fetchConsumptionHistory('m001');
  for (const r of records) {
    assert.ok(r.id, '缺少 id');
    assert.ok(r.orderNo, '缺少 orderNo');
    assert.ok(r.time, '缺少 time');
    assert.equal(typeof r.amount, 'number');
    assert.ok(['sale', 'refund', 'topup'].includes(r.type), `无效类型: ${r.type}`);
    assert.ok(r.description, '缺少 description');
  }
});

test('fetchConsumptionHistory — 包含多种交易类型', async () => {
  const records = await fetchConsumptionHistory('m001');
  const types = new Set(records.map((r) => r.type));
  assert.ok(types.has('sale'), '缺少消费记录');
  assert.ok(types.has('topup'), '缺少充值记录');
  assert.ok(types.has('refund'), '缺少退款记录');
});

test('fetchConsumptionHistory — 金额均为正数', async () => {
  const records = await fetchConsumptionHistory('m001');
  for (const r of records) {
    assert.ok(r.amount > 0, `金额应为正数: ${r.amount}`);
  }
});

// ---- 边界用例 ----

test('searchMember — 大小写不敏感', async () => {
  const result = await searchMember('vip2024003');
  assert.ok(result !== null);
  assert.equal(result!.name, '王五');
});

test('searchMember — 手机号部分匹配', async () => {
  const result = await searchMember('8001');
  assert.ok(result !== null);
  // 手机号 13800138001 包含 8001
  assert.ok(result!.phone.includes('8001'));
});
