/**
 * gadgets/page.test.ts — 设备（外设/小商品）管理页 L1 源码冒烟测试
 * 覆盖: 设备类型 / 设备状态 / 库存 / 搜索过滤 / 分类 / 统计
 * 角色视角: 👔店长 / 🎮导玩员 / 🔧安监 / 📢营销 / 🎯运行专员
 * 正例(16) + 反例(10) + 边界(9) = 35 tests
 */

import assert from 'node:assert/strict';
import { test } from 'node:test';

// ── 类型（mirror page.tsx 预期结构） ──

export type GadgetCategory = 'arcade' | 'ticket' | 'prize' | 'accessory' | 'voucher';
export type GadgetStatus = 'available' | 'in_use' | 'maintenance' | 'retired';
export type GadgetCondition = 'new' | 'good' | 'fair' | 'poor';

export interface Gadget {
  id: string;
  name: string;
  category: GadgetCategory;
  status: GadgetStatus;
  condition: GadgetCondition;
  price: number;
  stock: number;
  usageCount: number;
  lastMaintenance: string | null;
  storeName: string;
  description: string;
}

// ── 常量映射 ──

export const GADGET_CATEGORIES: GadgetCategory[] = ['arcade', 'ticket', 'prize', 'accessory', 'voucher'];
export const GADGET_STATUSES: GadgetStatus[] = ['available', 'in_use', 'maintenance', 'retired'];
export const GADGET_CONDITIONS: GadgetCondition[] = ['new', 'good', 'fair', 'poor'];

export const CATEGORY_LABELS: Record<GadgetCategory, string> = {
  arcade: '电玩设备',
  ticket: '彩票机',
  prize: '奖品',
  accessory: '配件',
  voucher: '代金券',
};

export const STATUS_LABELS: Record<GadgetStatus, string> = {
  available: '可用的',
  in_use: '使用中',
  maintenance: '维修中',
  retired: '已报废',
};

export const CONDITION_LABELS: Record<GadgetCondition, string> = {
  new: '全新',
  good: '良好',
  fair: '一般',
  poor: '较差',
};

const GADGET_NAMES = [
  '抓娃娃机', '投篮机', '打地鼠机', '赛车模拟器', '跳舞机',
  '扭蛋机', '兑币机', '拍立得机', '射击游戏机', 'VR体验设备',
];

const STORE_NAMES = ['旗舰店', '南山分店', '福田分店', '宝安店', '龙华店'];

// ── 工厂函数 ──

export function generateMockGadgets(count: number): Gadget[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `gadget-${String(i + 1).padStart(4, '0')}`,
    name: GADGET_NAMES[i % GADGET_NAMES.length]!,
    category: GADGET_CATEGORIES[i % GADGET_CATEGORIES.length]!,
    status: GADGET_STATUSES[i % GADGET_STATUSES.length]!,
    condition: GADGET_CONDITIONS[i % GADGET_CONDITIONS.length]!,
    price: Math.round((Math.random() * 50000 + 500) * 100) / 100,
    stock: Math.floor(Math.random() * 50),
    usageCount: Math.floor(Math.random() * 10000),
    lastMaintenance: i % 3 === 0
      ? new Date(Date.now() - Math.floor(Math.random() * 90) * 86400000).toISOString()
      : null,
    storeName: STORE_NAMES[i % STORE_NAMES.length]!,
    description: `设备 #${i + 1} 描述说明`,
  }));
}

export function filterGadgets(
  items: Gadget[],
  categoryFilter: GadgetCategory | 'all',
  statusFilter: GadgetStatus | 'all',
  searchQuery: string,
): Gadget[] {
  let result = items;
  if (categoryFilter !== 'all') {
    result = result.filter(g => g.category === categoryFilter);
  }
  if (statusFilter !== 'all') {
    result = result.filter(g => g.status === statusFilter);
  }
  if (searchQuery.trim()) {
    const q = searchQuery.trim().toLowerCase();
    result = result.filter(g =>
      g.name.toLowerCase().includes(q) ||
      g.storeName.toLowerCase().includes(q) ||
      g.description.toLowerCase().includes(q),
    );
  }
  return result;
}

export function sortGadgets(
  items: Gadget[],
  key: keyof Gadget | null,
  desc: boolean,
): Gadget[] {
  if (!key) return [...items];
  return [...items].sort((a, b) => {
    const aVal = String(a[key] ?? '');
    const bVal = String(b[key] ?? '');
    const cmp = aVal.localeCompare(bVal, 'zh-CN', { numeric: true });
    return desc ? -cmp : cmp;
  });
}

export function paginateGadgets<T>(items: T[], page: number, pageSize: number): T[] {
  const totalPages = Math.max(1, Math.ceil(items.length / Math.max(1, pageSize)));
  const safePage = Math.max(1, Math.min(page, totalPages));
  return items.slice((safePage - 1) * pageSize, safePage * pageSize);
}

export interface GadgetStats {
  total: number;
  available: number;
  inUse: number;
  maintenance: number;
  retired: number;
  totalValue: number;
  newCount: number;
  poorCondition: number;
  byCategory: Record<string, number>;
}

export function computeGadgetStats(items: Gadget[]): GadgetStats {
  let available = 0, inUse = 0, maintenance = 0, retired = 0;
  let newCount = 0, poorCondition = 0;
  let totalValue = 0;
  const byCategory: Record<string, number> = {};
  for (const g of items) {
    if (g.status === 'available') available++;
    else if (g.status === 'in_use') inUse++;
    else if (g.status === 'maintenance') maintenance++;
    else if (g.status === 'retired') retired++;
    if (g.condition === 'new') newCount++;
    if (g.condition === 'poor') poorCondition++;
    totalValue += g.price * g.stock;
    byCategory[g.category] = (byCategory[g.category] || 0) + 1;
  }
  return { total: items.length, available, inUse, maintenance, retired, totalValue, newCount, poorCondition, byCategory };
}

export function validateGadget(g: Gadget): string[] {
  const errors: string[] = [];
  if (!g.id) errors.push('id 为空');
  if (!g.name) errors.push('name 为空');
  if (!GADGET_CATEGORIES.includes(g.category)) errors.push(`category ${g.category} 无效`);
  if (!GADGET_STATUSES.includes(g.status)) errors.push(`status ${g.status} 无效`);
  if (!GADGET_CONDITIONS.includes(g.condition)) errors.push(`condition ${g.condition} 无效`);
  if (typeof g.price !== 'number' || g.price < 0) errors.push(`price ${g.price} 无效`);
  if (!Number.isInteger(g.stock) || g.stock < 0) errors.push(`stock ${g.stock} 无效`);
  if (!Number.isInteger(g.usageCount) || g.usageCount < 0) errors.push(`usageCount ${g.usageCount} 无效`);
  return errors;
}

export function computeTotalAssetValue(items: Gadget[]): number {
  return items.reduce((sum, g) => sum + g.price * g.stock, 0);
}

export function getMaintenanceRate(items: Gadget[]): number {
  if (items.length === 0) return 0;
  const inMaintenance = items.filter(g => g.status === 'maintenance').length;
  return Math.round((inMaintenance / items.length) * 10000) / 100;
}

// ════════════════════════════════════════════════════════
// 正例 (16+)
// ════════════════════════════════════════════════════════

test('🎮 导玩员: CATEGORY_LABELS 覆盖全部 5 种设备分类', () => {
  for (const c of GADGET_CATEGORIES) {
    assert.ok(CATEGORY_LABELS[c], `分类 ${c} 应有中文标签`);
  }
});

test('🎮 导玩员: STATUS_LABELS 覆盖全部 4 种设备状态', () => {
  for (const s of GADGET_STATUSES) {
    assert.ok(STATUS_LABELS[s], `状态 ${s} 应有中文标签`);
  }
});

test('🎮 导玩员: CONDITION_LABELS 覆盖全部 4 种品相', () => {
  for (const c of GADGET_CONDITIONS) {
    assert.ok(CONDITION_LABELS[c], `品相 ${c} 应有中文标签`);
  }
});

test('🎮 导玩员: generateMockGadgets 生成指定数量', () => {
  const data = generateMockGadgets(40);
  assert.equal(data.length, 40);
});

test('🎮 导玩员: 生成 100 条无错误', () => {
  const data = generateMockGadgets(100);
  assert.equal(data.length, 100);
  data.forEach(g => assert.equal(validateGadget(g).length, 0));
});

test('🎮 导玩员: 每条记录 id 唯一且格式正确', () => {
  const data = generateMockGadgets(50);
  const ids = data.map(d => d.id);
  assert.equal(new Set(ids).size, ids.length);
  data.forEach(d => assert.match(d.id, /^gadget-\d{4}$/));
});

test('🎮 导玩员: 5 种分类全部出现', () => {
  const data = generateMockGadgets(40);
  const cats = new Set(data.map(d => d.category));
  GADGET_CATEGORIES.forEach(c => assert.ok(cats.has(c)));
});

test('🎮 导玩员: 4 种状态全部出现', () => {
  const data = generateMockGadgets(40);
  const statuses = new Set(data.map(d => d.status));
  GADGET_STATUSES.forEach(s => assert.ok(statuses.has(s)));
});

test('🎮 导玩员: 4 种品相全部出现', () => {
  const data = generateMockGadgets(40);
  const conds = new Set(data.map(d => d.condition));
  GADGET_CONDITIONS.forEach(c => assert.ok(conds.has(c)));
});

test('🎮 导玩员: filterGadgets 全部不过滤', () => {
  const data = generateMockGadgets(40);
  assert.equal(filterGadgets(data, 'all', 'all', '').length, 40);
});

test('🎮 导玩员: filterGadgets 按分类过滤', () => {
  const data = generateMockGadgets(40);
  const arcade = filterGadgets(data, 'arcade', 'all', '');
  arcade.forEach(g => assert.equal(g.category, 'arcade'));
  assert.ok(arcade.length > 0);
});

test('🎮 导玩员: filterGadgets 按名称搜索', () => {
  const data = generateMockGadgets(10);
  const result = filterGadgets(data, 'all', 'all', '抓娃娃');
  result.forEach(g => assert.ok(g.name.includes('抓娃娃')));
});

test('🎮 导玩员: computeGadgetStats 返回完整统计数据', () => {
  const data = generateMockGadgets(40);
  const stats = computeGadgetStats(data);
  assert.equal(stats.total, 40);
  assert.equal(stats.available + stats.inUse + stats.maintenance + stats.retired, 40);
  assert.ok(stats.totalValue > 0);
});

test('🎮 导玩员: computeTotalAssetValue 计算正确', () => {
  const data = generateMockGadgets(10);
  const expected = data.reduce((s, g) => s + g.price * g.stock, 0);
  assert.equal(computeTotalAssetValue(data), expected);
});

test('🎮 导玩员: getMaintenanceRate 百分比计算', () => {
  const data = generateMockGadgets(40);
  const rate = getMaintenanceRate(data);
  assert.ok(rate >= 0 && rate <= 100);
});

test('🎮 导玩员: sortGadgets 按 price 降序', () => {
  const data = generateMockGadgets(40);
  const sorted = sortGadgets(data, 'price', true);
  for (let i = 1; i < sorted.length; i++) {
    assert.ok(sorted[i - 1]!.price >= sorted[i]!.price, `idx ${i} price desc fail`);
  }
});

// ════════════════════════════════════════════════════════
// 反例 (10+)
// ════════════════════════════════════════════════════════

test('🔧 安监: 无效分类过滤返回空', () => {
  const data = generateMockGadgets(40);
  const result = filterGadgets(data, 'unknown' as GadgetCategory, 'all', '');
  assert.equal(result.length, 0);
});

test('🔧 安监: 搜索不存在的关键词返回空', () => {
  const data = generateMockGadgets(40);
  const result = filterGadgets(data, 'all', 'all', '不存在关键词xxxxx');
  assert.equal(result.length, 0);
});

test('🔧 安监: 空数据过滤不抛异常', () => {
  assert.equal(filterGadgets([], 'all', 'all', '').length, 0);
  assert.equal(filterGadgets([], 'arcade', 'available', 'test').length, 0);
});

test('🔧 安监: 空数据排序返回空', () => {
  assert.equal(sortGadgets([], 'price', false).length, 0);
  assert.equal(sortGadgets([], null, false).length, 0);
});

test('🔧 安监: 空数据分页返回空', () => {
  assert.equal(paginateGadgets([], 1, 10).length, 0);
});

test('🔧 安监: validateGadget 检测无效 price', () => {
  const g = generateMockGadgets(1)[0]!;
  const bad = { ...g, price: -100 };
  const errors = validateGadget(bad);
  assert.ok(errors.some(e => e.includes('price') && e.includes('无效')));
});

test('🔧 安监: validateGadget 检测无效 stock', () => {
  const g = generateMockGadgets(1)[0]!;
  const bad = { ...g, stock: -5 };
  const errors = validateGadget(bad);
  assert.ok(errors.some(e => e.includes('stock') && e.includes('无效')));
});

test('🔧 安监: validateGadget 检测空字段', () => {
  const g = generateMockGadgets(1)[0]!;
  const bad = { ...g, id: '', name: '' };
  const errors = validateGadget(bad);
  assert.ok(errors.some(e => e.includes('id 为空')));
  assert.ok(errors.some(e => e.includes('name 为空')));
});

test('🔧 安监: 空数据 getMaintenanceRate 返回 0', () => {
  assert.equal(getMaintenanceRate([]), 0);
});

test('🔧 安监: 极端搜索词不报错', () => {
  const data = generateMockGadgets(10);
  const result = filterGadgets(data, 'all', 'all', 'a'.repeat(500));
  assert.ok(Array.isArray(result));
});

// ════════════════════════════════════════════════════════
// 边界 (9+)
// ════════════════════════════════════════════════════════

test('🎯 运行专员: 生成 0 条设备返回空数组', () => {
  assert.equal(generateMockGadgets(0).length, 0);
});

test('🎯 运行专员: 生成 1 条正常工作', () => {
  const data = generateMockGadgets(1);
  assert.equal(data.length, 1);
  assert.equal(validateGadget(data[0]!).length, 0);
});

test('🎯 运行专员: 生成 200 条 id 唯一', () => {
  const data = generateMockGadgets(200);
  assert.equal(data.length, 200);
  assert.equal(new Set(data.map(d => d.id)).size, 200);
});

test('🎯 运行专员: paginateGadgets 越界页码归正', () => {
  const data = generateMockGadgets(25);
  const page999 = paginateGadgets(data, 999, 10);
  assert.equal(page999.length, 5); // last page has 5 items
});

test('🎯 运行专员: paginateGadgets 负数页码归正', () => {
  const data = generateMockGadgets(10);
  const neg = paginateGadgets(data, -5, 10);
  assert.equal(neg.length, 10);
});

test('🎯 运行专员: computeGadgetStats 空数组', () => {
  const stats = computeGadgetStats([]);
  assert.equal(stats.total, 0);
  assert.equal(stats.available, 0);
  assert.equal(stats.inUse, 0);
  assert.equal(stats.maintenance, 0);
  assert.equal(stats.retired, 0);
  assert.equal(stats.totalValue, 0);
  assert.deepEqual(stats.byCategory, {});
});

test('🎯 运行专员: stock 为 0 的设备总价值为 0', () => {
  const g = generateMockGadgets(1)[0]!;
  const zeroStock = { ...g, stock: 0 };
  assert.equal(computeTotalAssetValue([zeroStock]), 0);
});

test('🎯 运行专员: lastMaintenance 可为 null', () => {
  const data = generateMockGadgets(40);
  const nullMaintenance = data.filter(g => g.lastMaintenance === null);
  assert.ok(nullMaintenance.length > 0, '应有 null 维修记录的设备');
});

test('🎯 运行专员: price 精度不超过 2 位小数', () => {
  const data = generateMockGadgets(50);
  data.forEach(g => {
    const parts = g.price.toString().split('.');
    if (parts.length === 2) {
      assert.ok(parts[1]!.length <= 2, `price ${g.price} has >2 decimals`);
    }
  });
});
