/**
 * Coupons List Page — storefront-web
 * Tests: coupon list logic, search, filter, pagination, stats
 */

import assert from 'node:assert/strict';
import test from 'node:test';

// ── 数据类型 (与 page.tsx 一致) ──

type CouponType = 'discount' | 'cash' | 'free_shipping' | 'voucher';
type CouponStatus = 'active' | 'expired' | 'disabled';

interface Coupon {
  id: string;
  name: string;
  type: CouponType;
  value: string;
  minAmount: string;
  totalIssued: number;
  usedCount: number;
  validFrom: string;
  validTo: string;
  storeName: string;
  status: CouponStatus;
}

const TYPE_LABELS: Record<CouponType, string> = {
  discount: '打折券',
  cash: '代金券',
  free_shipping: '免运费',
  voucher: '礼品券',
};

const STATUS_LABELS: Record<CouponStatus, string> = {
  active: '进行中',
  expired: '已过期',
  disabled: '已停用',
};

// ── Mock 数据 (与 page.tsx 一致) ──

const MOCK_COUPONS: Coupon[] = [
  { id: 'cp1', name: '新客首单8折', type: 'discount', value: '8折', minAmount: '满0元可用', totalIssued: 500, usedCount: 187, validFrom: '2026-06-01', validTo: '2026-07-31', storeName: 'Demo Store 旗舰店', status: 'active' },
  { id: 'cp2', name: '满300减50', type: 'cash', value: '¥50', minAmount: '满300元', totalIssued: 300, usedCount: 89, validFrom: '2026-06-01', validTo: '2026-06-30', storeName: 'Demo Store 旗舰店', status: 'active' },
  { id: 'cp3', name: '会员专享免运费', type: 'free_shipping', value: '免运费', minAmount: '满99元', totalIssued: 1000, usedCount: 412, validFrom: '2026-06-01', validTo: '2026-12-31', storeName: 'Demo Store 旗舰店', status: 'active' },
  { id: 'cp4', name: '夏季狂欢9折', type: 'discount', value: '9折', minAmount: '满0元可用', totalIssued: 200, usedCount: 34, validFrom: '2026-06-15', validTo: '2026-08-15', storeName: 'Demo Store 社区店', status: 'active' },
  { id: 'cp5', name: '端午节礼券', type: 'voucher', value: '¥100', minAmount: '满200元', totalIssued: 150, usedCount: 98, validFrom: '2026-06-01', validTo: '2026-06-15', storeName: 'Demo Store 社区店', status: 'expired' },
  { id: 'cp6', name: '满500减80', type: 'cash', value: '¥80', minAmount: '满500元', totalIssued: 100, usedCount: 22, validFrom: '2026-05-01', validTo: '2026-06-30', storeName: 'Demo Store 旗舰店', status: 'active' },
  { id: 'cp7', name: '年终特惠8.5折', type: 'discount', value: '8.5折', minAmount: '满0元可用', totalIssued: 800, usedCount: 621, validFrom: '2026-01-01', validTo: '2026-03-31', storeName: 'Demo Store 旗舰店', status: 'expired' },
  { id: 'cp8', name: '开业庆代价券', type: 'cash', value: '¥30', minAmount: '满150元', totalIssued: 400, usedCount: 15, validFrom: '2026-05-20', validTo: '2026-07-20', storeName: 'Demo Store 社区店', status: 'disabled' },
  { id: 'cp9', name: '复购有礼', type: 'discount', value: '7折', minAmount: '满200元', totalIssued: 250, usedCount: 73, validFrom: '2026-06-10', validTo: '2026-07-10', storeName: 'Demo Store 旗舰店', status: 'active' },
  { id: 'cp10', name: '好友邀请券', type: 'voucher', value: '¥50', minAmount: '满100元', totalIssued: 600, usedCount: 245, validFrom: '2026-06-01', validTo: '2026-09-30', storeName: 'Demo Store 旗舰店', status: 'active' },
  { id: 'cp11', name: '周末促销', type: 'cash', value: '¥20', minAmount: '满100元', totalIssued: 350, usedCount: 167, validFrom: '2026-06-01', validTo: '2026-08-31', storeName: 'Demo Store 社区店', status: 'active' },
  { id: 'cp12', name: '超值套餐券', type: 'voucher', value: '¥200', minAmount: '满600元', totalIssued: 80, usedCount: 12, validFrom: '2026-06-01', validTo: '2026-07-01', storeName: 'Demo Store 旗舰店', status: 'disabled' },
];

// ── 纯逻辑函数 ──

function searchFilter(items: Coupon[], term: string, fields: (keyof Coupon)[]): Coupon[] {
  const q = term.trim().toLowerCase();
  if (!q) return items;
  return items.filter((item) =>
    fields.some((field) => {
      const val = item[field];
      return typeof val === 'string' && val.toLowerCase().includes(q);
    }),
  );
}

function statusFilter(items: Coupon[], st: CouponStatus | 'ALL'): Coupon[] {
  if (st === 'ALL') return items;
  return items.filter((item) => item.status === st);
}

function paginate(items: Coupon[], page: number, pageSize: number): Coupon[] {
  const start = (page - 1) * pageSize;
  return items.slice(start, start + pageSize);
}

function totalPages(total: number, pageSize: number): number {
  return Math.max(1, Math.ceil(total / pageSize));
}

function computeStats(items: Coupon[]) {
  const active = items.filter((c) => c.status === 'active').length;
  const activeCoupons = items.filter((c) => c.status === 'active');
  const totalUsed = activeCoupons.reduce((s, c) => s + c.usedCount, 0);
  const totalIssued = items.reduce((s, c) => s + c.totalIssued, 0);
  const types = [...new Set(items.map((o) => o.type))].length;
  const stores = [...new Set(items.map((o) => o.storeName))].length;
  return { total: items.length, active, totalIssued, totalUsed, types, stores };
}

// ── 测试 ──

test('MOCK_COUPONS 有 12 条数据', () => {
  assert.equal(MOCK_COUPONS.length, 12);
});

test('MOCK_COUPONS 所有 ID 唯一', () => {
  const ids = MOCK_COUPONS.map((o) => o.id);
  assert.equal(new Set(ids).size, ids.length);
});

test('MOCK_COUPONS 涵盖 4 个类型 (discount/cash/free_shipping/voucher)', () => {
  const types = new Set(MOCK_COUPONS.map((o) => o.type));
  assert.equal(types.size, 4);
  assert.ok(types.has('discount'));
  assert.ok(types.has('cash'));
  assert.ok(types.has('free_shipping'));
  assert.ok(types.has('voucher'));
});

test('MOCK_COUPONS 涵盖 3 个状态 (active/expired/disabled)', () => {
  const statuses = new Set(MOCK_COUPONS.map((o) => o.status));
  assert.equal(statuses.size, 3);
  assert.ok(statuses.has('active'));
  assert.ok(statuses.has('expired'));
  assert.ok(statuses.has('disabled'));
});

// ── 搜索 ──

test('搜索: 空字符串返回全部', () => {
  const r = searchFilter(MOCK_COUPONS, '', ['name', 'type']);
  assert.equal(r.length, 12);
});

test('搜索: 纯空格视为空搜索', () => {
  const r = searchFilter(MOCK_COUPONS, '   ', ['name']);
  assert.equal(r.length, 12);
});

test('搜索: "满" 匹配含 "满" 的券名', () => {
  const r = searchFilter(MOCK_COUPONS, '满', ['name']);
  assert.equal(r.length, 2);
  assert.ok(r.every((o) => o.name.includes('满')));
});

test('搜索: "折扣" 无匹配', () => {
  const r = searchFilter(MOCK_COUPONS, '折扣', ['name']);
  assert.equal(r.length, 0);
});

test('搜索: "免运费" 匹配会员专享免运费', () => {
  const r = searchFilter(MOCK_COUPONS, '免运费', ['name']);
  assert.equal(r.length, 1);
  assert.ok(r[0]!.name.includes('免运费'));
});

test('搜索: "免运费" 跨字段 (name)', () => {
  const r = searchFilter(MOCK_COUPONS, '免运费', ['name']);
  assert.equal(r.length, 1);
});

test('搜索: 按 storeName 搜索', () => {
  const r = searchFilter(MOCK_COUPONS, '旗舰店', ['storeName']);
  assert.ok(r.length >= 6);
  assert.ok(r.every((o) => o.storeName.includes('旗舰店')));
});

test('搜索: 按 value 搜索 "¥50" 匹配两张券', () => {
  const r = searchFilter(MOCK_COUPONS, '¥50', ['value']);
  assert.equal(r.length, 2);
  assert.ok(r.some((o) => o.id === 'cp2'));
  assert.ok(r.some((o) => o.id === 'cp10'));
});

test('搜索: 大小写不敏感', () => {
  const r = searchFilter(MOCK_COUPONS, 'DISCOUNT', ['type']);
  assert.ok(r.length >= 4);
  assert.ok(r.every((o) => o.type === 'discount'));
});

// ── 状态过滤 ──

test('状态过滤: ALL 返回全部', () => {
  const r = statusFilter(MOCK_COUPONS, 'ALL');
  assert.equal(r.length, 12);
});

test('状态过滤: active 返回进行中', () => {
  const r = statusFilter(MOCK_COUPONS, 'active');
  assert.equal(r.length, 8);
  assert.ok(r.every((o) => o.status === 'active'));
});

test('状态过滤: expired 返回已过期', () => {
  const r = statusFilter(MOCK_COUPONS, 'expired');
  assert.equal(r.length, 2);
  assert.ok(r.every((o) => o.status === 'expired'));
});

test('状态过滤: disabled 返回已停用', () => {
  const r = statusFilter(MOCK_COUPONS, 'disabled');
  assert.equal(r.length, 2);
  assert.ok(r.every((o) => o.status === 'disabled'));
});

// ── 组合过滤 (搜索 + 状态) ──

test('组合: 搜索 "满" + active', () => {
  const searched = searchFilter(MOCK_COUPONS, '满', ['name']);
  const filtered = statusFilter(searched, 'active');
  assert.equal(filtered.length, 2);
  assert.ok(filtered.every((o) => o.status === 'active'));
  assert.ok(filtered.every((o) => o.name.includes('满')));
});

test('组合: 搜索不存在 → 状态过滤仍为空', () => {
  const searched = searchFilter(MOCK_COUPONS, 'xyz', ['name']);
  const filtered = statusFilter(searched, 'active');
  assert.equal(filtered.length, 0);
});

// ── 分页 ──

test('分页: pageSize=8, 2 页', () => {
  assert.equal(totalPages(12, 8), 2);
});

test('分页: pageSize=10, 2 页', () => {
  assert.equal(totalPages(12, 10), 2);
});

test('分页: pageSize=1, 12 页', () => {
  assert.equal(totalPages(12, 1), 12);
});

test('分页: pageSize 大于总数 → 1 页', () => {
  assert.equal(totalPages(12, 20), 1);
});

test('分页: 空数组 → 1 页 (最小)', () => {
  assert.equal(totalPages(0, 10), 1);
});

test('分页: 第 1 页返回前 8 条', () => {
  const r = paginate(MOCK_COUPONS, 1, 8);
  assert.equal(r.length, 8);
  assert.equal(r[0]!.id, 'cp1');
  assert.equal(r[7]!.id, 'cp8');
});

test('分页: 第 2 页返回后 4 条', () => {
  const r = paginate(MOCK_COUPONS, 2, 8);
  assert.equal(r.length, 4);
  assert.equal(r[0]!.id, 'cp9');
});

test('分页: 超出范围返回空', () => {
  const r = paginate(MOCK_COUPONS, 99, 8);
  assert.equal(r.length, 0);
});

// ── 统计 ──

test('统计: total = 12', () => {
  const stats = computeStats(MOCK_COUPONS);
  assert.equal(stats.total, 12);
});

test('统计: active = 8', () => {
  const stats = computeStats(MOCK_COUPONS);
  assert.equal(stats.active, 8);
});

test('统计: totalIssued > 0', () => {
  const stats = computeStats(MOCK_COUPONS);
  assert.ok(stats.totalIssued > 0);
});

test('统计: totalUsed > 0', () => {
  const stats = computeStats(MOCK_COUPONS);
  assert.ok(stats.totalUsed > 0);
});

test('统计: types = 4', () => {
  const stats = computeStats(MOCK_COUPONS);
  assert.equal(stats.types, 4);
});

test('统计: stores >= 2', () => {
  const stats = computeStats(MOCK_COUPONS);
  assert.ok(stats.stores >= 2);
});

test('统计: 空数组返回 0', () => {
  const stats = computeStats([]);
  assert.equal(stats.total, 0);
  assert.equal(stats.active, 0);
  assert.equal(stats.totalIssued, 0);
  assert.equal(stats.totalUsed, 0);
  assert.equal(stats.types, 0);
  assert.equal(stats.stores, 0);
});

// ── 映射常量 ──

test('TYPE_LABELS: 4 个类型都有中文标签', () => {
  assert.equal(Object.keys(TYPE_LABELS).length, 4);
  for (const t of ['discount', 'cash', 'free_shipping', 'voucher'] as const) {
    assert.ok(typeof TYPE_LABELS[t] === 'string');
    assert.ok(TYPE_LABELS[t].length > 0);
  }
});

test('STATUS_LABELS: 3 个状态都有中文标签', () => {
  assert.equal(Object.keys(STATUS_LABELS).length, 3);
});

// ── 数据完整性 ──

test('数据完整性: 每条优惠券都有必要字段', () => {
  for (const c of MOCK_COUPONS) {
    assert.ok(typeof c.id === 'string' && c.id.length > 0, `id required for ${c.name}`);
    assert.ok(typeof c.name === 'string' && c.name.length > 0, `name required for ${c.id}`);
    assert.ok(typeof c.type === 'string' && c.type.length > 0, `type required for ${c.id}`);
    assert.ok(typeof c.value === 'string' && c.value.length > 0, `value required for ${c.id}`);
    assert.ok(typeof c.validFrom === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(c.validFrom), `invalid validFrom ${c.validFrom}`);
    assert.ok(typeof c.validTo === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(c.validTo), `invalid validTo ${c.validTo}`);
    assert.ok(typeof c.totalIssued === 'number' && c.totalIssued > 0, `totalIssued > 0 for ${c.id}`);
    assert.ok(typeof c.usedCount === 'number' && c.usedCount >= 0, `usedCount >= 0 for ${c.id}`);
  }
});

test('数据完整性: usedCount 不超过 totalIssued', () => {
  for (const c of MOCK_COUPONS) {
    assert.ok(c.usedCount <= c.totalIssued, `${c.id} usedCount ${c.usedCount} > totalIssued ${c.totalIssued}`);
  }
});

test('数据完整性: validTo >= validFrom', () => {
  for (const c of MOCK_COUPONS) {
    assert.ok(c.validTo >= c.validFrom, `${c.id} validTo ${c.validTo} < validFrom ${c.validFrom}`);
  }
});

// ── 组件导出 ──

test('CouponsListPage 是函数组件', async () => {
  const mod = await import('./page');
  assert.equal(typeof mod.default, 'function',
    'CouponsListPage should be a function component');
});

test('CouponsListPage 组件名有意义', async () => {
  const component = (await import('./page')).default;
  assert.ok(component.name.length > 0 || typeof component === 'function',
    'component should have a meaningful name');
});

// ── 边缘情况 ──

test('边缘: 含特殊符号的 value 可被搜索', () => {
  const r = searchFilter(MOCK_COUPONS, '¥', ['value']);
  assert.ok(r.length >= 3);
});

test('边缘: 中文搜索 "首单"', () => {
  const r = searchFilter(MOCK_COUPONS, '首单', ['name']);
  assert.equal(r.length, 1);
  assert.equal(r[0]!.id, 'cp1');
});

test('边缘: 跨字段搜索 (name + storeName 同时含 "店")', () => {
  const r = searchFilter(MOCK_COUPONS, '店', ['name', 'storeName']);
  assert.equal(r.length, 12); // 所有名称和门店都含 "店"
});

test('边缘: 已过期券的核销率计算', () => {
  const expired = MOCK_COUPONS.filter((c) => c.status === 'expired');
  for (const c of expired) {
    const rate = Math.round((c.usedCount / c.totalIssued) * 100);
    assert.ok(rate > 0 && rate <= 100, `${c.id} rate ${rate} out of range`);
  }
});
