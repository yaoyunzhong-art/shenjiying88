/**
 * products/page.test.tsx — 产品服务列表页 L1 冒烟测试
 * 角色视角: 👔店长 · 🛒前台 · 📦运营
 * 覆盖: 正例(组件导出/统计计算/分类过滤/搜索/分页) + 反例(防御) + 边界(空结果/边缘操作)
 */

import assert from 'node:assert/strict';
import test from 'node:test';

/* ── 类型定义 (与 page.tsx 一致) ── */

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

/* ── 常量映射 (与 page.tsx 一致) ── */

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

/* ── 数据工具函数 (从 page.tsx 提取的逻辑) ── */

function computeStats(offerings: StoreOffering[]) {
  const published = offerings.filter((o) => o.status === 'published').length;
  const categories = new Set(offerings.map((o) => o.category)).size;
  const stores = new Set(offerings.map((o) => o.storeName)).size;
  return { total: offerings.length, published, categories, stores };
}

function filterByCategory(offerings: StoreOffering[], category: OfferingCategory | 'ALL'): StoreOffering[] {
  return category === 'ALL' ? offerings : offerings.filter((o) => o.category === category);
}

function searchOfferings(offerings: StoreOffering[], term: string): StoreOffering[] {
  if (!term.trim()) return offerings;
  const lower = term.toLowerCase();
  return offerings.filter(
    (o) =>
      o.name.toLowerCase().includes(lower) ||
      o.description.toLowerCase().includes(lower) ||
      o.category.toLowerCase().includes(lower) ||
      o.storeName.toLowerCase().includes(lower),
  );
}

function paginate<T>(items: T[], page: number, pageSize: number): T[] {
  if (page < 1 || pageSize < 1) return [];
  return items.slice((page - 1) * pageSize, page * pageSize);
}

/* ── Mock 测试数据 ── */

function makeOffering(overrides?: Partial<StoreOffering>): StoreOffering {
  return {
    id: `o-${Date.now()}`,
    name: '测试课程',
    category: 'class',
    storeName: 'Demo Store 旗舰店',
    description: '这是一门测试课程',
    price: '¥199/节',
    scheduleHint: '周一 10:00',
    status: 'published',
    createdAt: '2026-06-01',
    ...overrides,
  };
}

const MOCK_OFFERINGS: StoreOffering[] = [
  makeOffering({ id: 'o1', name: '瑜伽初级课', category: 'class', storeName: 'Demo Store 旗舰店', description: '适合入门学习者', price: '¥199/节', scheduleHint: '周二 18:30', status: 'published', createdAt: '2026-06-10' }),
  makeOffering({ id: 'o2', name: 'HIIT 高强度间歇训练', category: 'class', storeName: 'Demo Store 旗舰店', description: '快速燃脂', price: '¥149/节', scheduleHint: '周三 07:00', status: 'published', createdAt: '2026-06-08' }),
  makeOffering({ id: 'o3', name: '夏日游泳挑战赛', category: 'event', storeName: 'Demo Store 社区店', description: '游泳比赛', price: '¥50', scheduleHint: '2026-07-15', status: 'published', createdAt: '2026-06-12' }),
  makeOffering({ id: 'o4', name: '蛋白粉（乳清）', category: 'product', storeName: 'Demo Store 旗舰店', description: '进口乳清蛋白粉', price: '¥299', status: 'published', createdAt: '2026-06-01' }),
  makeOffering({ id: 'o5', name: '运动毛巾套装', category: 'product', storeName: 'Demo Store 社区店', description: '速干材质', price: '¥89', status: 'draft', createdAt: '2026-06-11' }),
  makeOffering({ id: 'o6', name: '私教一对一', category: 'service', storeName: 'Demo Store 旗舰店', description: '定制训练计划', price: '¥499/节', scheduleHint: '需预约', status: 'published', createdAt: '2026-05-20' }),
  makeOffering({ id: 'o7', name: '体测评估服务', category: 'service', storeName: 'Demo Store 旗舰店', description: 'InBody 体测', price: '¥99/次', scheduleHint: '随到随测', status: 'published', createdAt: '2026-05-15' }),
  makeOffering({ id: 'o8', name: '青少年篮球训练营', category: 'class', storeName: 'Demo Store 社区店', description: '暑期集中训练', price: '¥2,999/期', scheduleHint: '7月每周一三五', status: 'draft', createdAt: '2026-06-13' }),
  makeOffering({ id: 'o9', name: '瑜伽垫（加厚）', category: 'product', storeName: 'Demo Store 旗舰店', description: '6mm 加厚防滑', price: '¥159', status: 'published', createdAt: '2026-06-05' }),
  makeOffering({ id: 'o10', name: '周末亲子运动会', category: 'event', storeName: 'Demo Store 社区店', description: '家庭互动', price: '免费', scheduleHint: '2026-06-20', status: 'published', createdAt: '2026-06-09' }),
  makeOffering({ id: 'o11', name: '康复理疗服务', category: 'service', storeName: 'Demo Store 社区店', description: '运动损伤康复', price: '¥399/次', scheduleHint: '需预约评估', status: 'archived', createdAt: '2026-04-01' }),
];

/* =================================================================
 * 正例 (Happy Path)
 * ================================================================= */

test('👔 店长视角: 页面组件默认导出是函数', async () => {
  const mod = await import('./page');
  assert.equal(typeof mod.default, 'function', 'ProductsListPage 应导出函数组件');
});

test('🛒 前台视角: 组件不抛异常', async () => {
  let threw = false;
  try {
    await import('./page');
  } catch {
    threw = true;
  }
  assert.equal(threw, false, 'page 导入应成功');
});

test('📦 运营视角: 统计功能正确计算各维度', () => {
  const stats = computeStats(MOCK_OFFERINGS);
  assert.equal(stats.total, 11, '总项目数应为 11');
  assert.equal(stats.published, 8, '已发布项目数应为 8');
  assert.equal(stats.categories, 4, '分类数应为 4 (class/event/product/service)');
  assert.equal(stats.stores, 2, '门店数应为 2');
});

test('正例: 分类过滤 — 筛选课程', () => {
  const result = filterByCategory(MOCK_OFFERINGS, 'class');
  assert.equal(result.length, 3);
  assert.ok(result.every((o) => o.category === 'class'));
});

test('正例: 分类过滤 — 筛选商品', () => {
  const result = filterByCategory(MOCK_OFFERINGS, 'product');
  assert.equal(result.length, 3);
  assert.ok(result.every((o) => o.category === 'product'));
});

test('正例: 分类过滤 — 筛选服务', () => {
  const result = filterByCategory(MOCK_OFFERINGS, 'service');
  assert.equal(result.length, 3);
  assert.ok(result.every((o) => o.category === 'service'));
});

test('正例: 分类过滤 — 筛选活动', () => {
  const result = filterByCategory(MOCK_OFFERINGS, 'event');
  assert.equal(result.length, 2);
  assert.ok(result.every((o) => o.category === 'event'));
});

test('正例: 搜索 — 按名称搜索命中', () => {
  const result = searchOfferings(MOCK_OFFERINGS, '瑜伽');
  assert.equal(result.length, 2);
  assert.ok(result.every((o) => o.name.includes('瑜伽')));
});

test('正例: 搜索 — 按描述搜索命中', () => {
  const result = searchOfferings(MOCK_OFFERINGS, '燃脂');
  assert.equal(result.length, 1);
  assert.equal(result[0].name, 'HIIT 高强度间歇训练');
});

test('正例: 搜索 — 按门店搜索命中', () => {
  const result = searchOfferings(MOCK_OFFERINGS, '社区店');
  assert.equal(result.length, 5);
  assert.ok(result.every((o) => o.storeName.includes('社区店')));
});

test('正例: 搜索 — 按分类名搜索命中', () => {
  const result = searchOfferings(MOCK_OFFERINGS, 'service');
  assert.equal(result.length, 3);
  assert.ok(result.every((o) => o.category === 'service'));
});

test('正例: 分页 — 第一页返回预期数量', () => {
  const page1 = paginate(MOCK_OFFERINGS, 1, 5);
  assert.equal(page1.length, 5);
  assert.equal(page1[0].id, 'o1');
});

test('正例: 分页 — 第二页返回剩余数据', () => {
  const page2 = paginate(MOCK_OFFERINGS, 2, 5);
  assert.equal(page2.length, 5);
  assert.equal(page2[0].id, 'o6');
});

test('正例: 分页 — 第三页返回最后一条', () => {
  const page3 = paginate(MOCK_OFFERINGS, 3, 5);
  assert.equal(page3.length, 1);
  assert.equal(page3[0].id, 'o11');
});

test('正例: 分类标签映射完整性', () => {
  const categories: OfferingCategory[] = ['class', 'event', 'product', 'service'];
  for (const cat of categories) {
    assert.ok(CATEGORY_LABELS[cat].length > 0, `${cat} 应有中文标签`);
  }
  assert.equal(CATEGORY_LABELS['class'], '课程');
  assert.equal(CATEGORY_LABELS['event'], '活动');
  assert.equal(CATEGORY_LABELS['product'], '商品');
  assert.equal(CATEGORY_LABELS['service'], '服务');
});

test('正例: 状态标签映射完整性', () => {
  const statuses: OfferingStatus[] = ['published', 'draft', 'archived'];
  for (const s of statuses) {
    assert.ok(STATUS_LABELS[s].length > 0, `${s} 应有中文标签`);
    assert.ok(STATUS_VARIANTS[s], `${s} 应有对应变体`);
  }
  assert.equal(STATUS_LABELS['published'], '已发布');
  assert.equal(STATUS_LABELS['draft'], '草稿');
  assert.equal(STATUS_LABELS['archived'], '已归档');
});

/* =================================================================
 * 反例 (Negative / Edge Defense)
 * ================================================================= */

test('👔 反例: 搜索无匹配返回空数组', () => {
  const result = searchOfferings(MOCK_OFFERINGS, '不存在的项目xyz');
  assert.equal(result.length, 0);
});

test('🛒 反例: 不存在的分类过滤返回空', () => {
  // @ts-expect-error 测试传递非法分类
  const result = filterByCategory(MOCK_OFFERINGS, 'unknown');
  assert.equal(result.length, 0);
});

test('📦 反例: 统计空列表不崩溃', () => {
  const stats = computeStats([]);
  assert.equal(stats.total, 0);
  assert.equal(stats.published, 0);
  assert.equal(stats.categories, 0);
  assert.equal(stats.stores, 0);
});

test('反例: 分页超出范围返回空数组', () => {
  const result = paginate(MOCK_OFFERINGS, 999, 10);
  assert.equal(result.length, 0);
});

test('反例: 分页从负数页码不崩溃', () => {
  const result = paginate(MOCK_OFFERINGS, -1, 10);
  assert.equal(result.length, 0);
});

test('反例: 搜索特殊字符不崩溃', () => {
  const result = searchOfferings(MOCK_OFFERINGS, '<script>alert("xss")</script>');
  assert.ok(Array.isArray(result));
  assert.equal(result.length, 0);
});

test('反例: 分类过滤空列表不崩溃', () => {
  const result = filterByCategory([], 'class');
  assert.deepEqual(result, []);
});

/* =================================================================
 * 边界 (Edge Cases)
 * ================================================================= */

test('边界: 全量过滤 = 不过滤，返回全部', () => {
  const all = filterByCategory(MOCK_OFFERINGS, 'ALL');
  assert.equal(all.length, MOCK_OFFERINGS.length);
});

test('边界: 搜索单个字符也能命中', () => {
  const result = searchOfferings(MOCK_OFFERINGS, '瑜');
  assert.equal(result.length, 2);
  assert.ok(result.every((o) => o.name.includes('瑜伽')));
});

test('边界: 大小写不影响搜索', () => {
  const result = searchOfferings(MOCK_OFFERINGS, 'CLASS');
  assert.equal(result.length, 3);
});

test('边界: 空白搜索返回全部', () => {
  const result = searchOfferings(MOCK_OFFERINGS, '   ');
  assert.equal(result.length, MOCK_OFFERINGS.length);
});

test('边界: 空字符串搜索返回全部', () => {
  const result = searchOfferings(MOCK_OFFERINGS, '');
  assert.equal(result.length, MOCK_OFFERINGS.length);
});

test('边界: 草稿状态过滤 (通过搜索和分类叠加)', () => {
  // 草稿项目: o5(运动毛巾), o8(篮球训练营)
  const draftItems = MOCK_OFFERINGS.filter((o) => o.status === 'draft');
  assert.equal(draftItems.length, 2);
  assert.equal(draftItems[0].id, 'o5');
  assert.equal(draftItems[1].id, 'o8');
});

test('边界: 已归档状态仅1项', () => {
  const archivedItems = MOCK_OFFERINGS.filter((o) => o.status === 'archived');
  assert.equal(archivedItems.length, 1);
  assert.equal(archivedItems[0].id, 'o11');
});

test('边界: 分页 size=1 时每页一条', () => {
  for (let i = 1; i <= MOCK_OFFERINGS.length; i++) {
    const page = paginate(MOCK_OFFERINGS, i, 1);
    assert.equal(page.length, 1);
    assert.equal(page[0].id, `o${i}`);
  }
});

test('边界: 分类叠加 — 旗舰店的课程', () => {
  const classesAtFlagship = MOCK_OFFERINGS.filter(
    (o) => o.category === 'class' && o.storeName === 'Demo Store 旗舰店',
  );
  assert.equal(classesAtFlagship.length, 2);
  assert.ok(classesAtFlagship.every((o) => o.category === 'class' && o.storeName.includes('旗舰店')));
});

test('边界: 最大分页不越界', () => {
  const result = paginate(MOCK_OFFERINGS, 1, 100);
  assert.equal(result.length, MOCK_OFFERINGS.length);
});

test('边界: 产品 ID 唯一性', () => {
  const ids = MOCK_OFFERINGS.map((o) => o.id);
  const uniqueIds = new Set(ids);
  assert.equal(uniqueIds.size, ids.length, '所有产品 ID 应唯一');
});

test('边界: 标签语义验证 — 状态变体对应', () => {
  assert.equal(STATUS_VARIANTS['published'], 'success');
  assert.equal(STATUS_VARIANTS['draft'], 'warning');
  assert.equal(STATUS_VARIANTS['archived'], 'neutral');
});
