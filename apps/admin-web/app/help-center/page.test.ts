/**
 * apps/admin-web/app/help-center/page.test.ts — 帮助中心数据层测试
 * 覆盖正例/反例/边界，不导入 React 组件
 */

import assert from 'node:assert/strict';
import test from 'node:test';

// ── 类型常量和枚举验证 ────────────────────────────────────

const CATEGORY_IDS = [
  'getting-started',
  'account-management',
  'market-operations',
  'brand-management',
  'store-operations',
  'finance-settlement',
  'security-compliance',
  'api-integration',
  'troubleshooting',
] as const;

const ARTICLE_STATUSES = ['published', 'draft'] as const;

// ── 数据层导入 ────────────────────────────────────────────

test('[help-center] 正例: 数据模块导出全部核心 API', async () => {
  const mod = await import('./help-center-data');
  assert.equal(typeof mod.getHelpArticles, 'function');
  assert.equal(typeof mod.getHelpFaqs, 'function');
  assert.equal(typeof mod.HELP_CATEGORIES, 'object');
  assert.equal(typeof mod.getCategoryName, 'function');
  assert.equal(typeof mod.filterArticlesByCategory, 'function');
  assert.equal(typeof mod.filterArticlesByStatus, 'function');
  assert.equal(typeof mod.searchArticles, 'function');
  assert.equal(typeof mod.getFaqsByCategory, 'function');
  assert.equal(typeof mod.getPopularFaqs, 'function');
  assert.equal(typeof mod.computeArticleStats, 'function');
});

// ── HELP_CATEGORIES 正例验证 ───────────────────────────────

test('[help-center] 正例: HELP_CATEGORIES 数组长度为 9', async () => {
  const { HELP_CATEGORIES } = await import('./help-center-data');
  assert.equal(HELP_CATEGORIES.length, 9);
});

test('[help-center] 正例: HELP_CATEGORIES 每项包含必填字段', async () => {
  const { HELP_CATEGORIES } = await import('./help-center-data');
  const required = ['id', 'name', 'icon', 'description', 'articleCount', 'order'];
  for (const cat of HELP_CATEGORIES) {
    for (const f of required) {
      assert.notEqual(cat[f as keyof typeof cat], undefined, `分类 ${cat.id} 缺少 ${f}`);
    }
  }
});

test('[help-center] 正例: HELP_CATEGORIES id 均在 CATEGORY_IDS 枚举中', async () => {
  const { HELP_CATEGORIES } = await import('./help-center-data');
  for (const cat of HELP_CATEGORIES) {
    assert.ok((CATEGORY_IDS as readonly string[]).includes(cat.id), `未知分类 ${cat.id}`);
  }
});

test('[help-center] 正例: HELP_CATEGORIES order 为 1-9 不重复', async () => {
  const { HELP_CATEGORIES } = await import('./help-center-data');
  const orders = HELP_CATEGORIES.map((c) => c.order).sort((a, b) => a - b);
  assert.deepEqual(orders, [1, 2, 3, 4, 5, 6, 7, 8, 9]);
});

// ── getHelpArticles 正例验证 ───────────────────────────────

test('[help-center] 正例: getHelpArticles 返回 18 篇文章', async () => {
  const { getHelpArticles } = await import('./help-center-data');
  assert.equal(getHelpArticles().length, 18);
});

test('[help-center] 正例: 每篇文章 id 唯一', async () => {
  const { getHelpArticles } = await import('./help-center-data');
  const articles = getHelpArticles();
  const ids = articles.map((a) => a.id);
  assert.equal(new Set(ids).size, ids.length);
});

test('[help-center] 正例: 每篇文章 category 为有效值', async () => {
  const { getHelpArticles } = await import('./help-center-data');
  const validCategories = new Set(CATEGORY_IDS);
  for (const a of getHelpArticles()) {
    assert.ok(validCategories.has(a.category as any), `文章 ${a.id} category=${a.category} 无效`);
  }
});

test('[help-center] 正例: 每篇文章 status 为有效值', async () => {
  const { getHelpArticles } = await import('./help-center-data');
  const valid = new Set(ARTICLE_STATUSES);
  for (const a of getHelpArticles()) {
    assert.ok(valid.has(a.status as any), `文章 ${a.id} status=${a.status} 无效`);
  }
});

// ── getHelpFaqs 正例验证 ───────────────────────────────────

test('[help-center] 正例: getHelpFaqs 返回 10 条 FAQ', async () => {
  const { getHelpFaqs } = await import('./help-center-data');
  assert.equal(getHelpFaqs().length, 10);
});

test('[help-center] 正例: FAQ 每项包含必填字段', async () => {
  const { getHelpFaqs } = await import('./help-center-data');
  const required = ['id', 'question', 'answer', 'category', 'order', 'isPopular'];
  for (const f of getHelpFaqs()) {
    for (const field of required) {
      assert.notEqual(f[field as keyof typeof f], undefined, `FAQ ${f.id} 缺少 ${field}`);
    }
  }
});

test('[help-center] 正例: FAQ id 唯一', async () => {
  const { getHelpFaqs } = await import('./help-center-data');
  const ids = getHelpFaqs().map((f) => f.id);
  assert.equal(new Set(ids).size, ids.length);
});

// ── 辅助函数测试 ──────────────────────────────────────────

test('[help-center] 正例: getCategoryName 返回正确中文名', async () => {
  const { getCategoryName } = await import('./help-center-data');
  assert.equal(getCategoryName('getting-started'), '快速入门');
  assert.equal(getCategoryName('api-integration'), 'API 集成');
  assert.equal(getCategoryName('troubleshooting'), '故障排查');
});

test('[help-center] 正例: filterArticlesByCategory 按分类筛选正确', async () => {
  const { getHelpArticles, filterArticlesByCategory } = await import('./help-center-data');
  const articles = getHelpArticles();
  const result = filterArticlesByCategory(articles, 'getting-started');
  assert.ok(result.length > 0);
  assert.ok(result.every((a) => a.category === 'getting-started'));
});

test('[help-center] 正例: filterArticlesByStatus 精确筛选', async () => {
  const { getHelpArticles, filterArticlesByStatus } = await import('./help-center-data');
  const articles = getHelpArticles();
  const drafts = filterArticlesByStatus(articles, 'draft');
  assert.ok(drafts.every((a) => a.status === 'draft'));
});

test('[help-center] 正例: searchArticles 多字段命中', async () => {
  const { getHelpArticles, searchArticles } = await import('./help-center-data');
  const result = searchArticles(getHelpArticles(), 'API');
  assert.ok(result.length >= 2, '搜索 API 应至少命中 2 篇');
});

test('[help-center] 正例: computeArticleStats 返回完整统计', async () => {
  const { getHelpArticles, computeArticleStats } = await import('./help-center-data');
  const stats = computeArticleStats(getHelpArticles());
  assert.ok(stats.total > 0);
  assert.ok(stats.published > 0);
  assert.ok(stats.totalViews > 0);
  assert.ok(stats.totalHelpful > 0);
});

test('[help-center] 正例: getPopularFaqs 仅返回 isPopular=true', async () => {
  const { getHelpFaqs, getPopularFaqs } = await import('./help-center-data');
  const popular = getPopularFaqs(getHelpFaqs());
  assert.ok(popular.length > 0);
  assert.ok(popular.every((f) => f.isPopular));
});

// ── 边界测试 ──────────────────────────────────────────────

test('[help-center] 边界: searchArticles 空字符串返回全部', async () => {
  const { getHelpArticles, searchArticles } = await import('./help-center-data');
  const all = getHelpArticles();
  assert.equal(searchArticles(all, '').length, all.length);
  assert.equal(searchArticles(all, '   ').length, all.length);
});

test('[help-center] 边界: searchArticles 无匹配返回空数组', async () => {
  const { getHelpArticles, searchArticles } = await import('./help-center-data');
  assert.equal(searchArticles(getHelpArticles(), 'ZZZZ_NONEXISTENT_999').length, 0);
});

test('[help-center] 边界: filterArticlesByCategory 未知分类返回空数组', async () => {
  const { getHelpArticles, filterArticlesByCategory } = await import('./help-center-data');
  const result = filterArticlesByCategory(getHelpArticles(), 'unknown-cat' as any);
  assert.equal(result.length, 0);
});

test('[help-center] 边界: filterArticlesByStatus 未知状态', async () => {
  const { getHelpArticles, filterArticlesByStatus } = await import('./help-center-data');
  const result = filterArticlesByStatus(getHelpArticles(), 'archived' as any);
  assert.equal(result.length, 0);
});

test('[help-center] 边界: getCategoryName 未知 ID 返回原始值', async () => {
  const { getCategoryName } = await import('./help-center-data');
  assert.equal(getCategoryName('nonexistent' as any), 'nonexistent');
});

test('[help-center] 边界: getFaqsByCategory ALL 返回全部', async () => {
  const { getHelpFaqs, getFaqsByCategory } = await import('./help-center-data');
  const all = getHelpFaqs();
  assert.equal(getFaqsByCategory(all, 'ALL').length, all.length);
});

test('[help-center] 边界: computeArticleStats draft=0 如果无草稿', async () => {
  const { computeArticleStats } = await import('./help-center-data');
  const stats = computeArticleStats([]);
  assert.equal(stats.total, 0);
  assert.equal(stats.published, 0);
  assert.equal(stats.draft, 0);
  assert.equal(stats.totalViews, 0);
  assert.equal(stats.totalHelpful, 0);
});

test('[help-center] 边界: 浏览量字段为非负整数', async () => {
  const { getHelpArticles } = await import('./help-center-data');
  for (const a of getHelpArticles()) {
    assert.ok(Number.isInteger(a.viewCount) && a.viewCount >= 0, `文章 ${a.id} viewCount 不合法`);
    assert.ok(Number.isInteger(a.helpfulCount) && a.helpfulCount >= 0, `文章 ${a.id} helpfulCount 不合法`);
  }
});

// ── 反例测试 ──────────────────────────────────────────────

test('[help-center] 反例: 不存在 null 或 undefined 的 id', async () => {
  const { getHelpArticles, getHelpFaqs } = await import('./help-center-data');
  for (const a of getHelpArticles()) {
    assert.notEqual(a.id, null);
    assert.notEqual(a.id, undefined);
  }
  for (const f of getHelpFaqs()) {
    assert.notEqual(f.id, null);
    assert.notEqual(f.id, undefined);
  }
});

test('[help-center] 反例: status 不为 "published" 则是 "draft"', async () => {
  const { getHelpArticles } = await import('./help-center-data');
  for (const a of getHelpArticles()) {
    if (a.status !== 'published') {
      assert.equal(a.status, 'draft');
    }
  }
});

test('[help-center] 反例: isPopular 只为 boolean', async () => {
  const { getHelpFaqs } = await import('./help-center-data');
  for (const f of getHelpFaqs()) {
    assert.equal(typeof f.isPopular, 'boolean');
  }
});

test('[help-center] 反例: tags 不为空数组', async () => {
  const { getHelpArticles } = await import('./help-center-data');
  for (const a of getHelpArticles()) {
    assert.ok(Array.isArray(a.tags));
    assert.ok(a.tags.length > 0, `文章 ${a.id} tags 为空`);
  }
});

test('[help-center] 反例: order 为 1-10 的正整数', async () => {
  const { getHelpFaqs } = await import('./help-center-data');
  for (const f of getHelpFaqs()) {
    assert.ok(Number.isInteger(f.order) && f.order >= 1 && f.order <= 10, `FAQ ${f.id} order 不合法`);
  }
});
