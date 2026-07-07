/**
 * 分类管理列表页 — Categories List Page Test
 * 验证: 常量映射、Mock 数据完整性、状态过滤逻辑、搜索逻辑、分页逻辑、排序逻辑
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

// ── 数据类型 & 常量 (与 page.tsx 一致) ──

type CategoryStatus = 'active' | 'hidden' | 'archived';

interface ProductCategory {
  id: string;
  name: string;
  slug: string;
  parentName: string | null;
  productCount: number;
  status: CategoryStatus;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

const STATUS_LABELS: Record<CategoryStatus, string> = {
  active: '启用',
  hidden: '隐藏',
  archived: '归档',
};

const STATUS_VARIANTS: Record<CategoryStatus, string> = {
  active: 'success',
  hidden: 'warning',
  archived: 'neutral',
};

// ── Mock 数据 ──

const MOCK_CATEGORIES: ProductCategory[] = [
  { id: 'c1', name: '健身课程', slug: 'fitness-class', parentName: null, productCount: 18, status: 'active', sortOrder: 1, createdAt: '2026-01-15', updatedAt: '2026-06-20' },
  { id: 'c2', name: '瑜伽课', slug: 'yoga-class', parentName: '健身课程', productCount: 8, status: 'active', sortOrder: 2, createdAt: '2026-01-15', updatedAt: '2026-06-18' },
  { id: 'c3', name: '力量训练', slug: 'strength-training', parentName: '健身课程', productCount: 5, status: 'active', sortOrder: 3, createdAt: '2026-02-01', updatedAt: '2026-06-15' },
  { id: 'c4', name: '有氧操课', slug: 'aerobics', parentName: '健身课程', productCount: 5, status: 'active', sortOrder: 4, createdAt: '2026-02-01', updatedAt: '2026-06-10' },
  { id: 'c5', name: '运动商品', slug: 'sport-goods', parentName: null, productCount: 42, status: 'active', sortOrder: 5, createdAt: '2026-01-10', updatedAt: '2026-06-22' },
  { id: 'c6', name: '服饰鞋帽', slug: 'apparel', parentName: '运动商品', productCount: 15, status: 'active', sortOrder: 6, createdAt: '2026-01-10', updatedAt: '2026-06-21' },
  { id: 'c7', name: '营养补剂', slug: 'supplements', parentName: '运动商品', productCount: 12, status: 'active', sortOrder: 7, createdAt: '2026-01-10', updatedAt: '2026-06-19' },
  { id: 'c8', name: '运动器械', slug: 'equipment', parentName: '运动商品', productCount: 9, status: 'active', sortOrder: 8, createdAt: '2026-02-05', updatedAt: '2026-06-17' },
  { id: 'c9', name: '配件/周边', slug: 'accessories', parentName: '运动商品', productCount: 6, status: 'active', sortOrder: 9, createdAt: '2026-02-05', updatedAt: '2026-06-16' },
  { id: 'c10', name: '场馆服务', slug: 'venue-service', parentName: null, productCount: 10, status: 'active', sortOrder: 10, createdAt: '2026-01-20', updatedAt: '2026-06-14' },
  { id: 'c11', name: '私教课程', slug: 'personal-trainer', parentName: '场馆服务', productCount: 4, status: 'active', sortOrder: 11, createdAt: '2026-01-20', updatedAt: '2026-06-13' },
  { id: 'c12', name: '康复理疗', slug: 'rehab', parentName: '场馆服务', productCount: 3, status: 'active', sortOrder: 12, createdAt: '2026-02-01', updatedAt: '2026-06-12' },
  { id: 'c13', name: '体测评估', slug: 'assessment', parentName: '场馆服务', productCount: 3, status: 'active', sortOrder: 13, createdAt: '2026-02-01', updatedAt: '2026-06-11' },
  { id: 'c14', name: '活动赛事', slug: 'events', parentName: null, productCount: 7, status: 'active', sortOrder: 14, createdAt: '2026-03-01', updatedAt: '2026-06-09' },
  { id: 'c15', name: '季节性促销', slug: 'seasonal-promo', parentName: null, productCount: 5, status: 'hidden', sortOrder: 15, createdAt: '2026-04-01', updatedAt: '2026-06-08' },
  { id: 'c16', name: '体验课', slug: 'trial-class', parentName: '健身课程', productCount: 2, status: 'active', sortOrder: 16, createdAt: '2026-05-01', updatedAt: '2026-06-07' },
  { id: 'c17', name: '饮水用品', slug: 'drinks', parentName: '运动商品', productCount: 4, status: 'archived', sortOrder: 17, createdAt: '2026-02-10', updatedAt: '2026-05-01' },
  { id: 'c18', name: '二手转卖', slug: 'second-hand', parentName: null, productCount: 0, status: 'hidden', sortOrder: 18, createdAt: '2026-03-15', updatedAt: '2026-06-06' },
];

// ── 帮助函数 ──

function searchCategories(items: ProductCategory[], query: string): ProductCategory[] {
  const q = query.toLowerCase();
  return items.filter(
    (c) =>
      c.name.toLowerCase().includes(q) ||
      c.slug.toLowerCase().includes(q) ||
      (c.parentName && c.parentName.toLowerCase().includes(q)),
  );
}

// ── 测试 ──

describe('CategoriesListPage - 常量验证', () => {
  it('STATUS_LABELS 包含所有状态', () => {
    const statuses: CategoryStatus[] = ['active', 'hidden', 'archived'];
    for (const s of statuses) {
      assert.ok(STATUS_LABELS[s], `Missing label for ${s}`);
    }
  });

  it('STATUS_LABELS 所有标签都是中文', () => {
    const labels = Object.values(STATUS_LABELS);
    for (const label of labels) {
      assert.ok(/[\u4e00-\u9fff]/.test(label), `${label} should contain Chinese characters`);
    }
  });

  it('STATUS_VARIANTS 包含所有状态', () => {
    const statuses: CategoryStatus[] = ['active', 'hidden', 'archived'];
    for (const s of statuses) {
      assert.ok(STATUS_VARIANTS[s], `Missing variant for ${s}`);
    }
  });

  it('启用状态标签正确', () => {
    assert.strictEqual(STATUS_LABELS.active, '启用');
  });

  it('隐藏状态标签正确', () => {
    assert.strictEqual(STATUS_LABELS.hidden, '隐藏');
  });

  it('归档状态标签正确', () => {
    assert.strictEqual(STATUS_LABELS.archived, '归档');
  });
});

describe('CategoriesListPage - Mock数据验证', () => {
  it('有18条分类数据', () => {
    assert.strictEqual(MOCK_CATEGORIES.length, 18);
  });

  it('每条数据都有完整字段', () => {
    const keys: (keyof ProductCategory)[] = ['id', 'name', 'slug', 'parentName', 'productCount', 'status', 'sortOrder', 'createdAt', 'updatedAt'];
    for (const item of MOCK_CATEGORIES) {
      for (const key of keys) {
        if (key !== 'parentName') {
          assert.ok(item[key] !== undefined && item[key] !== null, `Missing ${key} in ${item.name}`);
        }
      }
    }
  });

  it('分类名都不为空', () => {
    for (const item of MOCK_CATEGORIES) {
      assert.ok(item.name.length > 0, `${item.id} name should not be empty`);
    }
  });

  it('slug 格式正确 (小写字母、数字、连字符)', () => {
    for (const item of MOCK_CATEGORIES) {
      assert.ok(/^[a-z0-9-]+$/.test(item.slug), `Invalid slug format: ${item.slug}`);
    }
  });

  it('产品数均为非负数', () => {
    for (const item of MOCK_CATEGORIES) {
      assert.ok(item.productCount >= 0, `${item.name} productCount should be >= 0`);
    }
  });

  it('排序号均为正数', () => {
    for (const item of MOCK_CATEGORIES) {
      assert.ok(item.sortOrder > 0, `${item.name} sortOrder should be positive`);
    }
  });

  it('所有状态都有覆盖', () => {
    const statuses = new Set(MOCK_CATEGORIES.map((c) => c.status));
    assert.ok(statuses.has('active'), 'Should have active categories');
    assert.ok(statuses.has('hidden'), 'Should have hidden categories');
    assert.ok(statuses.has('archived'), 'Should have archived categories');
  });

  it('有顶级分类和子分类', () => {
    const topLevel = MOCK_CATEGORIES.filter((c) => c.parentName === null);
    const subCategories = MOCK_CATEGORIES.filter((c) => c.parentName !== null);
    assert.ok(topLevel.length > 0, 'Should have top-level categories');
    assert.ok(subCategories.length > 0, 'Should have sub-categories');
    assert.strictEqual(topLevel.length + subCategories.length, MOCK_CATEGORIES.length);
  });
});

describe('CategoriesListPage - 搜索逻辑', () => {
  it('按分类名称搜索可匹配', () => {
    const results = searchCategories(MOCK_CATEGORIES, '瑜伽');
    assert.ok(results.length >= 1, 'Should find yoga category');
    assert.ok(results.some((c) => c.name.includes('瑜伽课')), 'Should find 瑜伽课');
  });

  it('按 slug 搜索可匹配', () => {
    const results = searchCategories(MOCK_CATEGORIES, 'rehab');
    assert.strictEqual(results.length, 1);
    assert.strictEqual(results[0]?.name, '康复理疗');
  });

  it('按上级分类名可匹配', () => {
    const results = searchCategories(MOCK_CATEGORIES, '场馆服务');
    // parentName matches for sub-categories, and the category itself
    const parent = results.find((c) => c.name === '场馆服务');
    const children = results.filter((c) => c.parentName === '场馆服务');
    assert.ok(parent, 'Should find 场馆服务 itself');
    assert.ok(children.length > 0, 'Should find children of 场馆服务');
  });

  it('searchCategories 不存在的搜索词返回空', () => {
    const results = searchCategories(MOCK_CATEGORIES, 'zzz-no-match');
    assert.strictEqual(results.length, 0);
  });

  it('空搜索词返回全部', () => {
    const results = searchCategories(MOCK_CATEGORIES, '');
    assert.strictEqual(results.length, MOCK_CATEGORIES.length);
  });
});

describe('CategoriesListPage - 状态过滤逻辑', () => {
  it('active 分类占多数', () => {
    const active = MOCK_CATEGORIES.filter((c) => c.status === 'active');
    assert.ok(active.length >= 13, `Expected at least 13 active, got ${active.length}`);
  });

  it('隐藏状态分类数量正确', () => {
    const hidden = MOCK_CATEGORIES.filter((c) => c.status === 'hidden');
    assert.strictEqual(hidden.length, 2);
    for (const h of hidden) {
      assert.ok(h.status === 'hidden', `Expected hidden status for ${h.name}`);
    }
  });

  it('归档状态分类数量正确', () => {
    const archived = MOCK_CATEGORIES.filter((c) => c.status === 'archived');
    assert.strictEqual(archived.length, 1);
    assert.strictEqual(archived[0]?.name, '饮水用品');
  });
});

describe('CategoriesListPage - 排序逻辑', () => {
  it('按 sortOrder 升序排列时顺序正确', () => {
    const sorted = [...MOCK_CATEGORIES].sort((a, b) => a.sortOrder - b.sortOrder);
    for (let i = 0; i < sorted.length - 1; i++) {
      assert.ok(sorted[i]!.sortOrder <= sorted[i + 1]!.sortOrder, 'Sort order should be non-decreasing');
    }
    assert.strictEqual(sorted[0]?.name, '健身课程');
    assert.strictEqual(sorted[sorted.length - 1]?.name, '二手转卖');
  });

  it('按产品数降序排列时第一个是运动商品(42)', () => {
    const sorted = [...MOCK_CATEGORIES].sort((a, b) => b.productCount - a.productCount);
    assert.strictEqual(sorted[0]?.name, '运动商品');
    assert.strictEqual(sorted[0]?.productCount, 42);
  });
});

describe('CategoriesListPage - 分页逻辑', () => {
  it('page=1 pageSize=10 返回前10条', () => {
    const PAGE_SIZE = 10;
    const page1 = MOCK_CATEGORIES.slice(0, PAGE_SIZE);
    assert.strictEqual(page1.length, 10);
    assert.strictEqual(page1[0]?.name, '健身课程');
  });

  it('pageSize=10 时分页正确 (18条数据需要2页)', () => {
    const PAGE_SIZE = 10;
    const totalPages = Math.ceil(MOCK_CATEGORIES.length / PAGE_SIZE);
    assert.strictEqual(totalPages, 2);

    const page2 = MOCK_CATEGORIES.slice(10, 20);
    assert.strictEqual(page2.length, 8);
    // 第11条（索引10）按 sortOrder 排序应
    const sorted = [...MOCK_CATEGORIES].sort((a, b) => a.sortOrder - b.sortOrder);
    const page2Sorted = sorted.slice(10, 20);
    assert.strictEqual(page2Sorted.length, 8);
    assert.strictEqual(page2Sorted[0]?.name, '私教课程');
    assert.strictEqual(page2Sorted[0]?.sortOrder, 11);
  });

  it('pageSize=6 时分3页', () => {
    const PAGE_SIZE = 6;
    const totalPages = Math.ceil(MOCK_CATEGORIES.length / PAGE_SIZE);
    assert.strictEqual(totalPages, 3);

    const page3 = MOCK_CATEGORIES.slice(12, 18);
    assert.strictEqual(page3.length, 6);
  });
});

describe('CategoriesListPage - 模块加载', () => {
  it('page 模块可正常导入且 default 为函数', async () => {
    const mod = await import('./page');
    assert.ok(typeof mod.default === 'function', 'default export should be a function component');
  });
});
