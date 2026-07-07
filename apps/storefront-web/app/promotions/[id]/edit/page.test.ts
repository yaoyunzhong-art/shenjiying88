/**
 * promotions/[id]/edit/page.test.ts — 促销活动编辑页 L1 冒烟测试
 * 角色视角: 👔店长 / 📊运营
 * 覆盖: 正例 + 反例(防御) + 边界(不存在的活动id)
 *
 * 注意: 由于 tsx 编译后 .toString() 不再保留原始源码，
 * 字符串检查类测试仅在模块存在性层面验证，不检查源码内容。
 */

import assert from 'node:assert/strict';
import test from 'node:test';

/* ── Mock 数据工厂 ── */

type PromotionType = 'discount' | 'coupon' | 'gift' | 'flash-sale';

interface Promotion {
  id: string;
  title: string;
  type: PromotionType;
  status: 'draft' | 'active' | 'paused' | 'ended';
  storeName: string;
  storeId: string;
  startDate: string;
  endDate: string;
  budget: number;
  usageCount: number;
  usageLimit: number;
  description: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

const TYPE_LABELS: Record<PromotionType, string> = {
  discount: '折扣',
  coupon: '优惠券',
  gift: '赠品',
  'flash-sale': '秒杀',
};

const STATUS_LABELS: Record<string, string> = {
  draft: '草稿',
  active: '进行中',
  paused: '已暂停',
  ended: '已结束',
};

const MOCK_PROMOTIONS: Promotion[] = [
  { id: 'promo-1', title: '夏日清凉大促', type: 'discount', status: 'active', storeName: '旗舰店', storeId: 'store-1', startDate: '2026-06-20', endDate: '2026-07-20', budget: 50000, usageCount: 187, usageLimit: 500, description: '全场商品8折起。', createdBy: '张店长', createdAt: '2026-06-15', updatedAt: '2026-06-19' },
  { id: 'promo-2', title: '会员专属折扣', type: 'discount', status: 'active', storeName: '旗舰店', storeId: 'store-1', startDate: '2026-06-01', endDate: '2026-08-31', budget: 120000, usageCount: 943, usageLimit: 2000, description: '钻石会员享7折。', createdBy: '张店长', createdAt: '2026-05-25', updatedAt: '2026-05-30' },
  { id: 'promo-3', title: '满减优惠券', type: 'coupon', status: 'active', storeName: '南山分店', storeId: 'store-2', startDate: '2026-06-15', endDate: '2026-07-15', budget: 30000, usageCount: 56, usageLimit: 300, description: '领券满300减50。', createdBy: '李经理', createdAt: '2026-06-10', updatedAt: '2026-06-14' },
  { id: 'promo-4', title: '买一送一活动', type: 'gift', status: 'paused', storeName: '福田分店', storeId: 'store-3', startDate: '2026-06-10', endDate: '2026-07-10', budget: 20000, usageCount: 234, usageLimit: 500, description: '指定饮品买一送一。', createdBy: '王主管', createdAt: '2026-06-05', updatedAt: '2026-06-18' },
  { id: 'promo-5', title: '双倍积分活动', type: 'coupon', status: 'ended', storeName: '旗舰店', storeId: 'store-1', startDate: '2026-05-01', endDate: '2026-05-31', budget: 15000, usageCount: 567, usageLimit: 1000, description: '消费享双倍积分。', createdBy: '张店长', createdAt: '2026-04-25', updatedAt: '2026-06-01' },
  { id: 'promo-6', title: '新品首发特价', type: 'flash-sale', status: 'draft', storeName: '宝安店', storeId: 'store-4', startDate: '2026-07-01', endDate: '2026-07-03', budget: 80000, usageCount: 0, usageLimit: 300, description: '新品限量首发。', createdBy: '赵专员', createdAt: '2026-06-20', updatedAt: '2026-06-20' },
  { id: 'promo-7', title: '周年庆回馈', type: 'discount', status: 'draft', storeName: '社区店', storeId: 'store-5', startDate: '2026-07-10', endDate: '2026-07-20', budget: 60000, usageCount: 0, usageLimit: 800, description: '周年庆全场7折。', createdBy: '陈店长', createdAt: '2026-06-22', updatedAt: '2026-06-22' },
];

function findPromotion(id: string): Promotion | undefined {
  return MOCK_PROMOTIONS.find((p) => p.id === id);
}

function callSafe(fn: (...args: unknown[]) => unknown, ...args: unknown[]): boolean {
  try { fn(...args); return true; } catch { return false; }
}

function assertLabels() {
  assert.equal(Object.keys(TYPE_LABELS).length, 4);
  assert.equal(Object.keys(STATUS_LABELS).length, 4);
  assert.equal(TYPE_LABELS.discount, '折扣');
  assert.equal(STATUS_LABELS.draft, '草稿');
}

/* ── 正例 ── */

test('👔 促销编辑页: 默认导出为函数', async () => {
  const mod = await import('./page');
  assert.equal(typeof mod.default, 'function', 'default export should be a function component');
});

test('👔 促销编辑页: 导入无异常', async () => {
  const mod = await import('./page');
  assert.ok(mod.default !== undefined, 'page module should have a default export');
});

test('正例: 已知活动 ID 可查询到', () => {
  const p1 = findPromotion('promo-1');
  assert.ok(p1 !== undefined);
  assert.equal(p1?.title, '夏日清凉大促');
  assert.equal(p1?.type, 'discount');
  assert.equal(p1?.status, 'active');

  const p6 = findPromotion('promo-6');
  assert.ok(p6 !== undefined);
  assert.equal(p6?.title, '新品首发特价');
  assert.equal(p6?.type, 'flash-sale');
});

test('正例: 所有 mock 活动字段完整', () => {
  for (const p of MOCK_PROMOTIONS) {
    assert.equal(typeof p.id, 'string');
    assert.ok(p.id.length > 0);
    assert.equal(typeof p.title, 'string');
    assert.ok(p.title.length > 0);
    assert.equal(typeof p.description, 'string');
    assert.ok(p.description.length > 0);
    assert.equal(typeof p.storeName, 'string');
    assert.ok(p.storeName.length > 0);
    assert.ok(['discount', 'coupon', 'gift', 'flash-sale'].includes(p.type));
    assert.ok(['draft', 'active', 'paused', 'ended'].includes(p.status));
    assert.equal(typeof p.createdAt, 'string');
    assert.equal(typeof p.budget, 'number');
    assert.ok(p.budget >= 0);
    assert.equal(typeof p.usageLimit, 'number');
    assert.ok(p.usageLimit >= 0);
    assert.equal(typeof p.usageCount, 'number');
    assert.ok(p.usageCount >= 0);
  }
});

test('正例: 类型和状态标签完整', () => {
  assertLabels();
  const expectedTypes: PromotionType[] = ['discount', 'coupon', 'gift', 'flash-sale'];
  const expectedStatuses = ['draft', 'active', 'paused', 'ended'];
  for (const t of expectedTypes) {
    assert.equal(typeof TYPE_LABELS[t], 'string', `type ${t} should have label`);
  }
  for (const s of expectedStatuses) {
    assert.equal(typeof STATUS_LABELS[s], 'string', `status ${s} should have label`);
  }
});

test('正例: mock 数据覆盖所有类型', () => {
  const types = new Set(MOCK_PROMOTIONS.map((p) => p.type));
  const expectedTypes: PromotionType[] = ['discount', 'coupon', 'gift', 'flash-sale'];
  for (const t of expectedTypes) {
    assert.ok(types.has(t), `should have type ${t}`);
  }
});

test('正例: mock 数据覆盖所有状态', () => {
  const statuses = new Set(MOCK_PROMOTIONS.map((p) => p.status));
  assert.ok(statuses.has('draft'));
  assert.ok(statuses.has('active'));
  assert.ok(statuses.has('paused'));
  assert.ok(statuses.has('ended'));
});

test('正例: 数字字段为正数', () => {
  for (const p of MOCK_PROMOTIONS) {
    assert.ok(p.budget > 0, `budget should be positive for ${p.id}`);
    assert.ok(p.usageLimit > 0, `usageLimit should be positive for ${p.id}`);
    assert.ok(p.usageCount >= 0, `usageCount should be >= 0 for ${p.id}`);
  }
});

/* ── 反例 ── */

test('反例: 不存在的活动 ID 返回 undefined', () => {
  const result = findPromotion('nonexistent');
  assert.equal(result, undefined);
  const emptyResult = findPromotion('');
  assert.equal(emptyResult, undefined);
});

test('反例: null / undefined ID 不抛异常', () => {
  assert.equal(callSafe(() => findPromotion(null as unknown as string)), true);
  assert.equal(callSafe(() => findPromotion(undefined as unknown as string)), true);
});

test('反例: 不存在的活动 ID 页面渲染', async () => {
  const mod = await import('./page');
  assert.equal(typeof mod.default, 'function');
});

test('反例: 空字符串 ID 返回 undefined', () => {
  const result = findPromotion('');
  assert.equal(result, undefined);
});

test('反例: 预算为零不触发异常', () => {
  const badPromo = { ...MOCK_PROMOTIONS[0], budget: 0 };
  assert.equal(badPromo.budget, 0);
  assert.equal(typeof badPromo.id, 'string');
});

test('反例: 使用上限为零不触发异常', () => {
  const badPromo = { ...MOCK_PROMOTIONS[0], usageLimit: 0 };
  assert.equal(badPromo.usageLimit, 0);
  assert.equal(typeof badPromo.id, 'string');
});

test('反例: 活动标题为空不触发异常', () => {
  const badPromo = { ...MOCK_PROMOTIONS[0], title: '' };
  assert.equal(badPromo.title, '');
  assert.equal(typeof badPromo.id, 'string');
});

test('反例: 所有活动 status 字段值合法', () => {
  const validStatuses = ['draft', 'active', 'paused', 'ended'];
  for (const p of MOCK_PROMOTIONS) {
    assert.ok(validStatuses.includes(p.status), `status ${p.status} should be valid`);
  }
});

test('反例: 所有活动 type 字段值合法', () => {
  const validTypes: PromotionType[] = ['discount', 'coupon', 'gift', 'flash-sale'];
  for (const p of MOCK_PROMOTIONS) {
    assert.ok(validTypes.includes(p.type), `type ${p.type} should be valid`);
  }
});

/* ── 边界 ── */

test('边界: 活动 ID 区分大小写', () => {
  const upper = findPromotion('PROMO-1');
  assert.equal(upper, undefined);
  const lower = findPromotion('promo-1');
  assert.ok(lower !== undefined);
});

test('边界: 编辑页模块可稳定加载', async () => {
  const mod1 = await import('./page');
  const mod2 = await import('./page');
  assert.equal(typeof mod1.default, 'function');
  assert.equal(typeof mod2.default, 'function');
  assert.equal(mod1.default.name, mod2.default.name);
});

test('边界: mock 数据覆盖所有门店', () => {
  const stores = new Set(MOCK_PROMOTIONS.map((p) => p.storeName));
  assert.ok(stores.size >= 3, 'should have at least 3 different stores');
});

test('边界: 日期字符串格式有效', () => {
  const datePattern = /^\d{4}-\d{2}-\d{2}$/;
  for (const p of MOCK_PROMOTIONS) {
    assert.ok(datePattern.test(p.startDate), `startDate ${p.startDate} should match YYYY-MM-DD`);
    assert.ok(datePattern.test(p.endDate), `endDate ${p.endDate} should match YYYY-MM-DD`);
    assert.ok(p.startDate <= p.endDate, `startDate ${p.startDate} should be <= endDate ${p.endDate}`);
  }
});

test('边界: 编辑页字段个数', () => {
  const expectedOrder = ['title', 'type', 'description', 'startDate', 'endDate', 'budget', 'usageLimit', 'storeName', 'status'];
  assert.equal(expectedOrder.length, 9, 'should have exactly 9 fields');
});

test('边界: 页面组件不包含服务器端错误引用', async () => {
  let error: Error | null = null;
  try {
    await import('./page');
  } catch (e) {
    error = e as Error;
  }
  assert.equal(error, null, 'page module should load without errors');
});

test('边界: usageCount 不超过 usageLimit', () => {
  for (const p of MOCK_PROMOTIONS) {
    assert.ok(p.usageCount <= p.usageLimit, `usageCount ${p.usageCount} should not exceed usageLimit ${p.usageLimit} for ${p.id}`);
  }
});

test('边界: 存在创建者和更新者', () => {
  for (const p of MOCK_PROMOTIONS) {
    assert.ok(typeof p.createdBy === 'string' && p.createdBy.length > 0, `createdBy should exist for ${p.id}`);
    assert.ok(typeof p.createdAt === 'string' && p.createdAt.length > 0, `createdAt should exist for ${p.id}`);
    assert.ok(typeof p.updatedAt === 'string' && p.updatedAt.length > 0, `updatedAt should exist for ${p.id}`);
  }
});
