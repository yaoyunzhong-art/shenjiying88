/**
 * Products List Page — storefront-web
 * Tests: product list logic, search, filter, pagination, sorting, stats computation
 */

import assert from 'node:assert/strict';
import test from 'node:test';

// ── 数据类型 (与 page.tsx 一致) ──

type OfferingCategory = 'class' | 'event' | 'product' | 'service';
type OfferingStatus = 'published' | 'draft' | 'archived';

interface StoreOffering {
  id: string;
  name: string;
  category: OfferingCategory;
  storeName: string;
  description: string;
  price?: string;
  scheduleHint?: string;
  status: OfferingStatus;
  createdAt: string;
}

const CATEGORY_LABELS: Record<OfferingCategory, string> = {
  class: '课程',
  event: '活动',
  product: '商品',
  service: '服务',
};

const STATUS_LABELS: Record<OfferingStatus, string> = {
  published: '已发布',
  draft: '草稿',
  archived: '已归档',
};

const STATUS_VARIANTS: Record<OfferingStatus, 'success' | 'warning' | 'neutral'> = {
  published: 'success',
  draft: 'warning',
  archived: 'neutral',
};

// ── Mock 数据 (与 page.tsx 一致) ──

const MOCK_OFFERINGS: StoreOffering[] = [
  { id: 'o1', name: '瑜伽初级课', category: 'class', storeName: 'Demo Store 旗舰店', description: '适合入门学习者，每周二四开课', price: '¥199/节', scheduleHint: '周二 18:30 / 周四 19:00', status: 'published', createdAt: '2026-06-10' },
  { id: 'o2', name: 'HIIT 高强度间歇训练', category: 'class', storeName: 'Demo Store 旗舰店', description: '快速燃脂，适合有一定基础的学员', price: '¥149/节', scheduleHint: '周三 07:00', status: 'published', createdAt: '2026-06-08' },
  { id: 'o3', name: '夏日游泳挑战赛', category: 'event', storeName: 'Demo Store 社区店', description: '门店内部游泳比赛，设有成人组和少年组', price: '¥50 报名费', scheduleHint: '2026-07-15 09:00', status: 'published', createdAt: '2026-06-12' },
  { id: 'o4', name: '蛋白粉（乳清）', category: 'product', storeName: 'Demo Store 旗舰店', description: '进口乳清蛋白粉，巧克力/香草口味可选', price: '¥299', status: 'published', createdAt: '2026-06-01' },
  { id: 'o5', name: '运动毛巾套装', category: 'product', storeName: 'Demo Store 社区店', description: '速干材质，门店 logo 定制款', price: '¥89', status: 'draft', createdAt: '2026-06-11' },
  { id: 'o6', name: '私教一对一', category: 'service', storeName: 'Demo Store 旗舰店', description: '定制训练计划，营养指导，进度跟踪', price: '¥499/节', scheduleHint: '需预约', status: 'published', createdAt: '2026-05-20' },
  { id: 'o7', name: '体测评估服务', category: 'service', storeName: 'Demo Store 旗舰店', description: 'InBody 体测 + 专业解读报告', price: '¥99/次', scheduleHint: '随到随测', status: 'published', createdAt: '2026-05-15' },
  { id: 'o8', name: '青少年篮球训练营', category: 'class', storeName: 'Demo Store 社区店', description: '暑期集中训练，8-16岁', price: '¥2,999/期', scheduleHint: '7月每周一三五 14:00', status: 'draft', createdAt: '2026-06-13' },
  { id: 'o9', name: '瑜伽垫（加厚）', category: 'product', storeName: 'Demo Store 旗舰店', description: '6mm 加厚防滑瑜伽垫', price: '¥159', status: 'published', createdAt: '2026-06-05' },
  { id: 'o10', name: '周末亲子运动会', category: 'event', storeName: 'Demo Store 社区店', description: '家庭互动运动会，含亲子项目', price: '免费', scheduleHint: '2026-06-20 10:00', status: 'published', createdAt: '2026-06-09' },
  { id: 'o11', name: '普拉提中级课', category: 'class', storeName: 'Demo Store 旗舰店', description: '核心力量训练，要求有基础', price: '¥229/节', scheduleHint: '周一 10:00 / 周五 18:30', status: 'published', createdAt: '2026-06-07' },
  { id: 'o12', name: '康复理疗服务', category: 'service', storeName: 'Demo Store 社区店', description: '针对运动损伤的康复理疗方案', price: '¥399/次', scheduleHint: '需预约评估', status: 'archived', createdAt: '2026-04-01' },
  { id: 'o13', name: '运动背包（防水）', category: 'product', storeName: 'Demo Store 旗舰店', description: '30L 大容量防水运动背包', price: '¥249', status: 'published', createdAt: '2026-06-03' },
  { id: 'o14', name: '减脂训练营', category: 'class', storeName: 'Demo Store 社区店', description: '4周系统减脂，含饮食计划', price: '¥3,999/期', scheduleHint: '待定', status: 'draft', createdAt: '2026-06-14' },
  { id: 'o15', name: '游泳季卡', category: 'service', storeName: 'Demo Store 旗舰店', description: '三个月不限次游泳', price: '¥1,999', scheduleHint: '开馆时间内', status: 'published', createdAt: '2026-06-01' },
];

// ── 搜索/过滤/分页 纯逻辑 ──

function searchFilter(items: StoreOffering[], term: string, fields: (keyof StoreOffering)[]): StoreOffering[] {
  const q = term.trim().toLowerCase();
  if (!q) return items;
  return items.filter((item) =>
    fields.some((field) => {
      const val = item[field];
      return typeof val === 'string' && val.toLowerCase().includes(q);
    }),
  );
}

function categoryFilter(items: StoreOffering[], cat: OfferingCategory | 'ALL'): StoreOffering[] {
  if (cat === 'ALL') return items;
  return items.filter((item) => item.category === cat);
}

function paginate(items: StoreOffering[], page: number, pageSize: number): StoreOffering[] {
  const start = (page - 1) * pageSize;
  return items.slice(start, start + pageSize);
}

function totalPages(total: number, pageSize: number): number {
  return Math.max(1, Math.ceil(total / pageSize));
}

function computeStats(items: StoreOffering[]) {
  const published = items.filter((o) => o.status === 'published').length;
  const categories = [...new Set(items.map((o) => o.category))].length;
  const stores = [...new Set(items.map((o) => o.storeName))].length;
  return { total: items.length, published, categories, stores };
}

// ── 测试 ──

test('MOCK_OFFERINGS 有 15 条数据', () => {
  assert.equal(MOCK_OFFERINGS.length, 15);
});

test('MOCK_OFFERINGS 所有 ID 唯一', () => {
  const ids = MOCK_OFFERINGS.map((o) => o.id);
  assert.equal(new Set(ids).size, ids.length);
});

test('MOCK_OFFERINGS 涵盖 4 个分类 (class/event/product/service)', () => {
  const cats = new Set(MOCK_OFFERINGS.map((o) => o.category));
  assert.equal(cats.size, 4);
  assert.ok(cats.has('class'));
  assert.ok(cats.has('event'));
  assert.ok(cats.has('product'));
  assert.ok(cats.has('service'));
});

test('MOCK_OFFERINGS 涵盖 3 个状态 (published/draft/archived)', () => {
  const statuses = new Set(MOCK_OFFERINGS.map((o) => o.status));
  assert.equal(statuses.size, 3);
  assert.ok(statuses.has('published'));
  assert.ok(statuses.has('draft'));
  assert.ok(statuses.has('archived'));
});

// ── 搜索 ──

test('搜索: 空字符串返回全部', () => {
  const r = searchFilter(MOCK_OFFERINGS, '', ['name', 'description']);
  assert.equal(r.length, 15);
});

test('搜索: 纯空格视为空搜索', () => {
  const r = searchFilter(MOCK_OFFERINGS, '   ', ['name']);
  assert.equal(r.length, 15);
});

test('搜索: "瑜伽" 匹配 name 中含瑜伽的产品', () => {
  const r = searchFilter(MOCK_OFFERINGS, '瑜伽', ['name']);
  assert.ok(r.length >= 2);
  assert.ok(r.every((o) => o.name.includes('瑜伽')));
});

test('搜索: "训练" 匹配多个产品', () => {
  const r = searchFilter(MOCK_OFFERINGS, '训练', ['name', 'description']);
  assert.ok(r.length >= 3);
  assert.ok(r.some((o) => o.name.includes('训练')));
});

test('搜索: "蛋白粉" 仅匹配 1 个产品', () => {
  const r = searchFilter(MOCK_OFFERINGS, '蛋白粉', ['name']);
  assert.equal(r.length, 1);
  assert.equal(r[0]!.name, '蛋白粉（乳清）');
});

test('搜索: 不存在的词返回空', () => {
  const r = searchFilter(MOCK_OFFERINGS, 'zzzzznotexist', ['name', 'description']);
  assert.equal(r.length, 0);
});

test('搜索: 跨字段匹配 (name + description)', () => {
  const r = searchFilter(MOCK_OFFERINGS, '游泳', ['name', 'description']);
  assert.ok(r.length >= 2);
});

test('搜索: 按 storeName 搜索', () => {
  const r = searchFilter(MOCK_OFFERINGS, '旗舰店', ['storeName']);
  assert.ok(r.length >= 5);
  assert.ok(r.every((o) => o.storeName.includes('旗舰店')));
});

test('搜索: 按 category 搜索', () => {
  const r = searchFilter(MOCK_OFFERINGS, 'event', ['category']);
  assert.ok(r.length >= 1);
  assert.ok(r.every((o) => o.category === 'event'));
});

test('搜索: 大小写不敏感', () => {
  const r = searchFilter(MOCK_OFFERINGS, 'HIIT', ['name']);
  assert.equal(r.length, 1);
  assert.equal(r[0]!.id, 'o2');
});

// ── 分类过滤 ──

test('分类过滤: ALL 返回全部', () => {
  const r = categoryFilter(MOCK_OFFERINGS, 'ALL');
  assert.equal(r.length, 15);
});

test('分类过滤: class 仅返回课程', () => {
  const r = categoryFilter(MOCK_OFFERINGS, 'class');
  assert.ok(r.length >= 4);
  assert.ok(r.every((o) => o.category === 'class'));
});

test('分类过滤: event 仅返回活动', () => {
  const r = categoryFilter(MOCK_OFFERINGS, 'event');
  assert.equal(r.length, 2);
  assert.ok(r.every((o) => o.category === 'event'));
});

test('分类过滤: product 仅返回商品', () => {
  const r = categoryFilter(MOCK_OFFERINGS, 'product');
  assert.equal(r.length, 4);
  assert.ok(r.every((o) => o.category === 'product'));
});

test('分类过滤: service 仅返回服务', () => {
  const r = categoryFilter(MOCK_OFFERINGS, 'service');
  assert.equal(r.length, 4);
  assert.ok(r.every((o) => o.category === 'service'));
});

// ── 组合过滤 (搜索 + 分类) ──

test('组合: 搜索 "训练" + 分类 class, 仅课程含训练词', () => {
  const searched = searchFilter(MOCK_OFFERINGS, '训练', ['name', 'description']);
  const filtered = categoryFilter(searched, 'class');
  assert.ok(filtered.length >= 1);
  assert.ok(filtered.every((o) => o.category === 'class'));
  assert.ok(filtered.every((o) => o.name.includes('训练') || o.description.includes('训练')));
});

test('组合: 搜索不存在的词 → 空数组 → 分类过滤仍为空', () => {
  const searched = searchFilter(MOCK_OFFERINGS, 'xyz', ['name']);
  const filtered = categoryFilter(searched, 'class');
  assert.equal(filtered.length, 0);
});

// ── 分页 ──

test('分页: pageSize=5, 3 页', () => {
  assert.equal(totalPages(15, 5), 3);
});

test('分页: pageSize=10, 2 页', () => {
  assert.equal(totalPages(15, 10), 2);
});

test('分页: pageSize=1, 15 页', () => {
  assert.equal(totalPages(15, 1), 15);
});

test('分页: pageSize 大于总数 → 1 页', () => {
  assert.equal(totalPages(15, 20), 1);
});

test('分页: 空数组 → 1 页 (最小)', () => {
  assert.equal(totalPages(0, 10), 1);
});

test('分页: 第 1 页返回前 10 条', () => {
  const r = paginate(MOCK_OFFERINGS, 1, 10);
  assert.equal(r.length, 10);
  assert.equal(r[0]!.id, 'o1');
  assert.equal(r[9]!.id, 'o10');
});

test('分页: 第 2 页返回后 5 条', () => {
  const r = paginate(MOCK_OFFERINGS, 2, 10);
  assert.equal(r.length, 5);
  assert.equal(r[0]!.id, 'o11');
});

test('分页: 超出范围返回空', () => {
  const r = paginate(MOCK_OFFERINGS, 99, 10);
  assert.equal(r.length, 0);
});

// ── 统计 ──

test('统计: total = 15', () => {
  const stats = computeStats(MOCK_OFFERINGS);
  assert.equal(stats.total, 15);
});

test('统计: published = 11', () => {
  const stats = computeStats(MOCK_OFFERINGS);
  assert.equal(stats.published, 11);
});

test('统计: categories = 4', () => {
  const stats = computeStats(MOCK_OFFERINGS);
  assert.equal(stats.categories, 4);
});

test('统计: stores ≥ 2', () => {
  const stats = computeStats(MOCK_OFFERINGS);
  assert.ok(stats.stores >= 2);
});

test('统计: 空数组返回 0', () => {
  const stats = computeStats([]);
  assert.equal(stats.total, 0);
  assert.equal(stats.published, 0);
  assert.equal(stats.categories, 0);
  assert.equal(stats.stores, 0);
});

// ── 映射常量 ──

test('CATEGORY_LABELS: 4 个分类都有中文标签', () => {
  assert.equal(Object.keys(CATEGORY_LABELS).length, 4);
  for (const cat of ['class', 'event', 'product', 'service'] as const) {
    assert.ok(typeof CATEGORY_LABELS[cat] === 'string');
    assert.ok(CATEGORY_LABELS[cat].length > 0);
  }
});

test('STATUS_LABELS: 3 个状态都有中文标签', () => {
  assert.equal(Object.keys(STATUS_LABELS).length, 3);
});

test('STATUS_VARIANTS: 3 个状态都有 variant', () => {
  assert.equal(Object.keys(STATUS_VARIANTS).length, 3);
  assert.equal(STATUS_VARIANTS.published, 'success');
  assert.equal(STATUS_VARIANTS.draft, 'warning');
  assert.equal(STATUS_VARIANTS.archived, 'neutral');
});

// ── 边缘情况 ──

test('边缘: 含 "/" 的 price 字段可被搜索', () => {
  const r = searchFilter(MOCK_OFFERINGS, '199/节', ['price']);
  assert.equal(r.length, 1);
  assert.equal(r[0]!.id, 'o1');
});

test('边缘: scheduleHint 可为 undefined', () => {
  const withoutSchedule = MOCK_OFFERINGS.filter((o) => o.scheduleHint === undefined);
  assert.ok(withoutSchedule.length >= 1);
});

test('边缘: 中文搜索 "一对一"', () => {
  const r = searchFilter(MOCK_OFFERINGS, '一对一', ['name']);
  assert.equal(r.length, 1);
  assert.equal(r[0]!.id, 'o6');
});

test('边缘: 多个字段中仅部分匹配', () => {
  const r = searchFilter(MOCK_OFFERINGS, '旗舰店', ['storeName']);
  // 社区店的产品不会被匹配
  assert.ok(r.every((o) => o.storeName === 'Demo Store 旗舰店'));
});

// ── 数据完整性 ──

test('数据完整性: 每个 offering 都有 id/name/category/storeName/status/createdAt', () => {
  for (const o of MOCK_OFFERINGS) {
    assert.ok(typeof o.id === 'string' && o.id.length > 0, `id required for ${o.name}`);
    assert.ok(typeof o.name === 'string' && o.name.length > 0, `name required for ${o.id}`);
    assert.ok(['class', 'event', 'product', 'service'].includes(o.category), `invalid category ${o.category}`);
    assert.ok(typeof o.storeName === 'string' && o.storeName.length > 0, `storeName required for ${o.id}`);
    assert.ok(['published', 'draft', 'archived'].includes(o.status), `invalid status ${o.status}`);
    assert.ok(typeof o.createdAt === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(o.createdAt), `invalid createdAt ${o.createdAt}`);
  }
});
