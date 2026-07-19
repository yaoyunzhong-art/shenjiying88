/**
 * bookshelf/page.test.tsx — 书架（知识库）页面测试
 *
 * ⚡ 覆盖: 正例 + 反例 + 边界
 * 策略: 纯静态类型/数据结构分析，URL-pattern responseRegistry
 * 禁止: as any / describe.skip / it.only
 *
 * 功能覆盖:
 *  - 类型定义（ArticleCategory / ArticleStatus / ArticleSnapshot / BookshelfSnapshot）
 *  - 数据结构校验（分类/标签/文章数/阅读量）
 *  - 分类标签映射（CATEGORY_LABELS / STATUS_LABELS）
 *  - 分类筛选（filterByCategory）
 *  - 搜索（searchArticles）
 *  - 状态过滤（filterByStatus）
 *  - 统计（computeArticleStats）
 *  - 分页（paginateArticles）
 *  - 排序（sortArticles）
 *  - 默认快照数据完整性
 *  - 导出（dynamic / revalidate）
 *  - 空数组边界
 *  - 特殊字符边界
 */

import assert from 'node:assert/strict';
import test from 'node:test';

/* ── 类型定义 (与 page.tsx 一致) ── */

type ArticleCategory =
  | 'game-guide'
  | 'device-tutorial'
  | 'promotion'
  | 'faq'
  | 'policy'
  | 'news'
  | 'other';

type ArticleStatus = 'published' | 'draft' | 'archived';

interface ArticleSnapshot {
  id: string;
  title: string;
  category: ArticleCategory;
  summary: string;
  author: string;
  coverUrl?: string;
  status: ArticleStatus;
  viewCount: number;
  likeCount: number;
  publishedAt: string;
  updatedAt: string;
  tags: string[];
}

interface BookshelfSnapshot {
  articles: ArticleSnapshot[];
  categories: ArticleCategory[];
  totalArticles: number;
  totalViews: number;
  hotTags: string[];
  recommendedArticles: ArticleSnapshot[];
}

/* ── 常量映射 (与 page.tsx 一致) ── */

const CATEGORY_LABELS: Record<ArticleCategory, string> = {
  'game-guide': '游玩攻略',
  'device-tutorial': '设备教程',
  promotion: '优惠活动',
  faq: '常见问题',
  policy: '门店政策',
  news: '门店动态',
  other: '其他',
};

const STATUS_LABELS: Record<ArticleStatus, string> = {
  published: '已发布',
  draft: '草稿',
  archived: '已归档',
};

const ALL_CATEGORIES: ArticleCategory[] = [
  'game-guide',
  'device-tutorial',
  'promotion',
  'faq',
  'policy',
  'news',
  'other',
];

const ALL_STATUSES: ArticleStatus[] = ['published', 'draft', 'archived'];

/* ── 数据工具函数 (从 page.tsx 提取的逻辑) ── */

function filterByCategory(
  articles: ArticleSnapshot[],
  category: ArticleCategory | 'ALL',
): ArticleSnapshot[] {
  return category === 'ALL' ? articles : articles.filter((a) => a.category === category);
}

function searchArticles(articles: ArticleSnapshot[], term: string): ArticleSnapshot[] {
  if (!term.trim()) return articles;
  const lower = term.toLowerCase();
  return articles.filter(
    (a) =>
      a.title.toLowerCase().includes(lower) ||
      a.summary.toLowerCase().includes(lower) ||
      a.author.toLowerCase().includes(lower) ||
      a.tags.some((t) => t.toLowerCase().includes(lower)),
  );
}

function filterByStatus(
  articles: ArticleSnapshot[],
  status: ArticleStatus | 'ALL',
): ArticleSnapshot[] {
  return status === 'ALL' ? articles : articles.filter((a) => a.status === status);
}

function computeArticleStats(articles: ArticleSnapshot[]) {
  const published = articles.filter((a) => a.status === 'published').length;
  const categories = new Set(articles.map((a) => a.category)).size;
  const totalViews = articles.reduce((s, a) => s + a.viewCount, 0);
  const totalLikes = articles.reduce((s, a) => s + a.likeCount, 0);
  return { total: articles.length, published, categories, totalViews, totalLikes };
}

function paginateArticles<T>(items: T[], page: number, pageSize: number): T[] {
  if (page < 1 || pageSize < 1) return [];
  return items.slice((page - 1) * pageSize, page * pageSize);
}

function sortArticles(
  articles: ArticleSnapshot[],
  by: 'viewCount' | 'publishedAt' | 'updatedAt' | 'title',
  order: 'asc' | 'desc' = 'desc',
): ArticleSnapshot[] {
  const sorted = [...articles].sort((a, b) => {
    let cmp = 0;
    if (by === 'viewCount') {
      cmp = a.viewCount - b.viewCount;
    } else if (by === 'title') {
      cmp = a.title.localeCompare(b.title);
    } else {
      cmp = a[by].localeCompare(b[by]);
    }
    return order === 'desc' ? -cmp : cmp;
  });
  return sorted;
}

/* ── Mock 测试数据 (与 page.tsx getDefaultBookshelfSnapshot() 同步) ── */

function makeArticle(overrides?: Partial<ArticleSnapshot>): ArticleSnapshot {
  return {
    id: `a-${Date.now()}`,
    title: '测试文章',
    category: 'game-guide',
    summary: '这是一篇测试文章',
    author: '测试作者',
    status: 'published',
    viewCount: 100,
    likeCount: 10,
    publishedAt: '2026-07-01',
    updatedAt: '2026-07-01',
    tags: ['测试'],
    ...overrides,
  };
}

const MOCK_ARTICLES: ArticleSnapshot[] = [
  makeArticle({ id: 'a1', title: 'VR 游戏新手入门指南', category: 'game-guide', summary: '第一次玩 VR 不知道从哪开始？这篇指南带你快速上手。', author: '小爽', status: 'published', viewCount: 3200, likeCount: 186, publishedAt: '2026-07-10', updatedAt: '2026-07-10', tags: ['新手入门', 'VR 体验'] }),
  makeArticle({ id: 'a2', title: '暑期特惠活动', category: 'promotion', summary: '暑期特惠季，全场 8 折起。', author: '市场部', status: 'published', viewCount: 5600, likeCount: 420, publishedAt: '2026-07-01', updatedAt: '2026-07-05', tags: ['会员福利', '暑期活动'] }),
  makeArticle({ id: 'a3', title: '如何正确佩戴 VR 头显', category: 'device-tutorial', summary: '正确的佩戴方式可以提升沉浸感。', author: '技术部', status: 'published', viewCount: 1800, likeCount: 95, publishedAt: '2026-06-20', updatedAt: '2026-06-20', tags: ['VR 体验', '设备指南'] }),
  makeArticle({ id: 'a4', title: '会员积分怎么用？', category: 'faq', summary: '会员积分兑换规则与常见问题汇总。', author: '客服部', status: 'published', viewCount: 4500, likeCount: 310, publishedAt: '2026-06-15', updatedAt: '2026-06-18', tags: ['会员福利'] }),
  makeArticle({ id: 'a5', title: '门店营业时间调整通知', category: 'policy', summary: '营业时间调整通知。', author: '行政部', status: 'published', viewCount: 8900, likeCount: 67, publishedAt: '2026-06-28', updatedAt: '2026-06-28', tags: ['门店公告'] }),
  makeArticle({ id: 'a6', title: '周末亲子活动预告', category: 'news', summary: '本周末亲子 VR 竞赛活动。', author: '市场部', status: 'published', viewCount: 1200, likeCount: 88, publishedAt: '2026-07-12', updatedAt: '2026-07-12', tags: ['周末活动', '亲子'] }),
  makeArticle({ id: 'a7', title: 'Draft: 秋季活动方案', category: 'other', summary: '秋季活动初步方案（讨论中）', author: '市场部', status: 'draft', viewCount: 0, likeCount: 0, publishedAt: '', updatedAt: '2026-07-08', tags: [] }),
  makeArticle({ id: 'a8', title: '旧版会员政策（已归档）', category: 'policy', summary: '2025 版会员政策历史参考。', author: '行政部', status: 'archived', viewCount: 300, likeCount: 12, publishedAt: '2025-06-01', updatedAt: '2026-01-01', tags: ['会员福利'] }),
];

/* ── 默认快照 (全量数据) ── */

const MOCK_SNAPSHOT: BookshelfSnapshot = {
  articles: MOCK_ARTICLES,
  categories: ['game-guide', 'device-tutorial', 'promotion', 'faq', 'policy', 'news'],
  totalArticles: 48,
  totalViews: 28500,
  hotTags: ['新手入门', 'VR 体验', '会员福利', '周末活动', '门店公告'],
  recommendedArticles: [
    makeArticle({ id: 'rec-1', title: 'VR 游戏新手入门指南', category: 'game-guide', summary: '第一次玩 VR 不知道从哪开始？', author: '小爽', status: 'published', viewCount: 3200, likeCount: 186, publishedAt: '2026-07-10', updatedAt: '2026-07-10', tags: ['新手入门', 'VR 体验'] }),
    makeArticle({ id: 'rec-2', title: '暑期特惠活动', category: 'promotion', summary: '暑期特惠季全场 8 折起。', author: '市场部', status: 'published', viewCount: 5600, likeCount: 420, publishedAt: '2026-07-01', updatedAt: '2026-07-05', tags: ['会员福利', '暑期活动'] }),
    makeArticle({ id: 'rec-3', title: '如何正确佩戴 VR 头显', category: 'device-tutorial', summary: '正确佩戴方式减少晕动症。', author: '技术部', status: 'published', viewCount: 1800, likeCount: 95, publishedAt: '2026-06-20', updatedAt: '2026-06-20', tags: ['VR 体验', '设备指南'] }),
  ],
};

/* =================================================================
 * 正例 (Happy Path)
 * ================================================================= */

test('👤 页面组件默认导出是函数', async () => {
  const mod = await import('./page');
  assert.equal(typeof mod.default, 'function', 'BookshelfPage 应导出函数组件');
});

test('👤 页面组件导入不抛异常', async () => {
  let threw = false;
  try {
    await import('./page');
  } catch {
    threw = true;
  }
  assert.equal(threw, false, 'page 导入应成功');
});

test('📊 书架快照数据结构完整', () => {
  const keys = Object.keys(MOCK_SNAPSHOT).sort();
  assert.deepStrictEqual(keys, ['articles', 'categories', 'hotTags', 'recommendedArticles', 'totalArticles', 'totalViews']);
});

test('📊 默认快照 totalArticles = 48, totalViews = 28500', () => {
  assert.strictEqual(MOCK_SNAPSHOT.totalArticles, 48);
  assert.strictEqual(MOCK_SNAPSHOT.totalViews, 28500);
});

test('📊 分类列表包含 6 个分类', () => {
  assert.strictEqual(MOCK_SNAPSHOT.categories.length, 6);
  assert.ok(MOCK_SNAPSHOT.categories.includes('game-guide'));
  assert.ok(MOCK_SNAPSHOT.categories.includes('device-tutorial'));
  assert.ok(MOCK_SNAPSHOT.categories.includes('promotion'));
  assert.ok(MOCK_SNAPSHOT.categories.includes('faq'));
  assert.ok(MOCK_SNAPSHOT.categories.includes('policy'));
  assert.ok(MOCK_SNAPSHOT.categories.includes('news'));
});

test('📊 热门标签列表包含 5 个标签', () => {
  assert.strictEqual(MOCK_SNAPSHOT.hotTags.length, 5);
  assert.deepStrictEqual(MOCK_SNAPSHOT.hotTags, ['新手入门', 'VR 体验', '会员福利', '周末活动', '门店公告']);
});

test('🏷️ 分类标签映射完整 — 7 个分类均有中文标签', () => {
  for (const cat of ALL_CATEGORIES) {
    assert.ok(CATEGORY_LABELS[cat].length > 0, `${cat} 应有中文标签`);
  }
  assert.strictEqual(Object.keys(CATEGORY_LABELS).length, 7);
  assert.strictEqual(CATEGORY_LABELS['game-guide'], '游玩攻略');
  assert.strictEqual(CATEGORY_LABELS['device-tutorial'], '设备教程');
  assert.strictEqual(CATEGORY_LABELS.promotion, '优惠活动');
  assert.strictEqual(CATEGORY_LABELS.faq, '常见问题');
  assert.strictEqual(CATEGORY_LABELS.policy, '门店政策');
  assert.strictEqual(CATEGORY_LABELS.news, '门店动态');
  assert.strictEqual(CATEGORY_LABELS.other, '其他');
});

test('🏷️ 状态标签映射完整', () => {
  for (const s of ALL_STATUSES) {
    assert.ok(STATUS_LABELS[s].length > 0, `${s} 应有中文标签`);
  }
  assert.strictEqual(Object.keys(STATUS_LABELS).length, 3);
  assert.strictEqual(STATUS_LABELS.published, '已发布');
  assert.strictEqual(STATUS_LABELS.draft, '草稿');
  assert.strictEqual(STATUS_LABELS.archived, '已归档');
});

test('📰 文章数据完整性 — 每条必填字段非空', () => {
  for (const article of MOCK_ARTICLES) {
    assert.ok(article.id, `文章 id 为空`);
    assert.ok(article.title, `文章 title 为空`);
    assert.ok(article.category, `文章 category 为空`);
    assert.ok(article.summary, `文章 summary 为空`);
    assert.ok(article.author, `文章 author 为空`);
    assert.ok(typeof article.viewCount === 'number' && article.viewCount >= 0, `文章 viewCount 无效`);
    assert.ok(typeof article.likeCount === 'number' && article.likeCount >= 0, `文章 likeCount 无效`);
    assert.ok(['published', 'draft', 'archived'].includes(article.status), `文章 status 值有效: ${article.status}`);
    assert.ok(Array.isArray(article.tags), `文章 tags 应为数组`);
  }
});

test('📰 mock 文章共 8 条，覆盖全部状态', () => {
  assert.strictEqual(MOCK_ARTICLES.length, 8);
  const statuses = new Set(MOCK_ARTICLES.map((a) => a.status));
  assert.ok(statuses.has('published'));
  assert.ok(statuses.has('draft'));
  assert.ok(statuses.has('archived'));
});

test('📰 mock 文章覆盖全部 7 个分类', () => {
  const catSet = new Set(MOCK_ARTICLES.map((a) => a.category));
  assert.ok(catSet.has('game-guide'));
  assert.ok(catSet.has('device-tutorial'));
  assert.ok(catSet.has('promotion'));
  assert.ok(catSet.has('faq'));
  assert.ok(catSet.has('policy'));
  assert.ok(catSet.has('news'));
  assert.ok(catSet.has('other'));
});

test('📰 推荐文章 3 篇，均为已发布状态', () => {
  assert.strictEqual(MOCK_SNAPSHOT.recommendedArticles.length, 3);
  for (const article of MOCK_SNAPSHOT.recommendedArticles) {
    assert.strictEqual(article.status, 'published');
  }
});

test('🔎 分类筛选 — 筛选游戏攻略返回 1 篇', () => {
  const result = filterByCategory(MOCK_ARTICLES, 'game-guide');
  assert.strictEqual(result.length, 1);
  assert.ok(result.every((a) => a.category === 'game-guide'));
  assert.strictEqual(result[0].id, 'a1');
});

test('🔎 分类筛选 — 筛选门店政策返回 2 篇', () => {
  const result = filterByCategory(MOCK_ARTICLES, 'policy');
  assert.strictEqual(result.length, 2);
  assert.ok(result.every((a) => a.category === 'policy'));
});

test('🔎 分类筛选 — 全量（ALL）返回所有', () => {
  const result = filterByCategory(MOCK_ARTICLES, 'ALL');
  assert.strictEqual(result.length, MOCK_ARTICLES.length);
});

test('🔎 搜索 — 按标题/摘要搜索命中（VR）', () => {
  const result = searchArticles(MOCK_ARTICLES, 'VR');
  // a1 title, a3 title, a6 summary 均包含 VR
  assert.strictEqual(result.length, 3);
  assert.ok(result.some((a) => a.id === 'a1'));
  assert.ok(result.some((a) => a.id === 'a3'));
  assert.ok(result.some((a) => a.id === 'a6'));
});

test('🔎 搜索 — 按作者搜索命中（小爽）', () => {
  const result = searchArticles(MOCK_ARTICLES, '小爽');
  assert.strictEqual(result.length, 1);
  assert.strictEqual(result[0].id, 'a1');
});

test('🔎 搜索 — 按标签搜索命中（会员福利）', () => {
  const result = searchArticles(MOCK_ARTICLES, '会员福利');
  // a2, a4, a8 的 tags 包含 会员福利
  assert.strictEqual(result.length, 3);
  assert.ok(result.some((a) => a.id === 'a2'));
  assert.ok(result.some((a) => a.id === 'a4'));
  assert.ok(result.some((a) => a.id === 'a8'));
});

test('🔎 搜索 — 按描述搜索命中', () => {
  const result = searchArticles(MOCK_ARTICLES, '沉浸感');
  assert.strictEqual(result.length, 1);
  assert.strictEqual(result[0].id, 'a3');
});

test('🔎 搜索 — 无匹配返回空数组', () => {
  const result = searchArticles(MOCK_ARTICLES, '不存在的文章abc');
  assert.strictEqual(result.length, 0);
});

test('🔎 搜索 — 空白字符串返回全部', () => {
  assert.strictEqual(searchArticles(MOCK_ARTICLES, '').length, MOCK_ARTICLES.length);
  assert.strictEqual(searchArticles(MOCK_ARTICLES, '   ').length, MOCK_ARTICLES.length);
});

test('🔎 搜索 — 大小写不敏感', () => {
  const lower = searchArticles(MOCK_ARTICLES, 'vr');
  const upper = searchArticles(MOCK_ARTICLES, 'VR');
  assert.strictEqual(lower.length, upper.length);
  assert.strictEqual(lower.length, 3);
});

test('🔎 搜索 — 特殊字符不崩溃', () => {
  const result = searchArticles(MOCK_ARTICLES, '<script>alert("xss")</script>');
  assert.ok(Array.isArray(result));
  assert.strictEqual(result.length, 0);
});

test('🔎 搜索 — 单个字符也能命中', () => {
  const result = searchArticles(MOCK_ARTICLES, '暑');
  assert.strictEqual(result.length, 1);
  assert.strictEqual(result[0].id, 'a2');
});

test('🔎 状态过滤 — 已发布 6 篇', () => {
  const result = filterByStatus(MOCK_ARTICLES, 'published');
  assert.strictEqual(result.length, 6);
  assert.ok(result.every((a) => a.status === 'published'));
});

test('🔎 状态过滤 — 草稿 1 篇', () => {
  const result = filterByStatus(MOCK_ARTICLES, 'draft');
  assert.strictEqual(result.length, 1);
  assert.strictEqual(result[0].id, 'a7');
});

test('🔎 状态过滤 — 已归档 1 篇', () => {
  const result = filterByStatus(MOCK_ARTICLES, 'archived');
  assert.strictEqual(result.length, 1);
  assert.strictEqual(result[0].id, 'a8');
});

test('🔎 状态过滤 — 全量返回所有', () => {
  const result = filterByStatus(MOCK_ARTICLES, 'ALL');
  assert.strictEqual(result.length, MOCK_ARTICLES.length);
});

test('📊 统计 — 8 篇文章 / 6 篇已发布 / 7 个分类 / 总阅读量 25500', () => {
  const stats = computeArticleStats(MOCK_ARTICLES);
  assert.strictEqual(stats.total, 8);
  assert.strictEqual(stats.published, 6);
  assert.strictEqual(stats.categories, 7);
  assert.strictEqual(stats.totalViews, 25500);
});

test('📊 统计 — 总点赞 1178', () => {
  const stats = computeArticleStats(MOCK_ARTICLES);
  assert.strictEqual(stats.totalLikes, 1178);
});

test('📊 统计 — 空列表不崩溃', () => {
  const stats = computeArticleStats([]);
  assert.strictEqual(stats.total, 0);
  assert.strictEqual(stats.published, 0);
  assert.strictEqual(stats.categories, 0);
  assert.strictEqual(stats.totalViews, 0);
  assert.strictEqual(stats.totalLikes, 0);
});

test('📊 统计 — 分类筛选后统计正确', () => {
  const policyArticles = filterByCategory(MOCK_ARTICLES, 'policy');
  const stats = computeArticleStats(policyArticles);
  assert.strictEqual(stats.total, 2);
  assert.strictEqual(stats.published, 1); // a5 published, a8 archived
  assert.strictEqual(stats.categories, 1);
  assert.strictEqual(stats.totalViews, 9200); // a5: 8900, a8: 300
});

test('📃 分页 — 第一页 5 条，第一项为 a1', () => {
  const page1 = paginateArticles(MOCK_ARTICLES, 1, 5);
  assert.strictEqual(page1.length, 5);
  assert.strictEqual(page1[0].id, 'a1');
});

test('📃 分页 — 第二页 3 条，第一项为 a6', () => {
  const page2 = paginateArticles(MOCK_ARTICLES, 2, 5);
  assert.strictEqual(page2.length, 3);
  assert.strictEqual(page2[0].id, 'a6');
});

test('📃 分页 — 超出范围返回空数组', () => {
  assert.strictEqual(paginateArticles(MOCK_ARTICLES, 999, 10).length, 0);
  assert.strictEqual(paginateArticles(MOCK_ARTICLES, -1, 10).length, 0);
});

test('📃 分页 — pageSize=1，每页 1 条', () => {
  for (let i = 1; i <= MOCK_ARTICLES.length; i++) {
    const page = paginateArticles(MOCK_ARTICLES, i, 1);
    assert.strictEqual(page.length, 1);
  }
});

test('📃 分页 — pageSize 超大时返回全部', () => {
  const all = paginateArticles(MOCK_ARTICLES, 1, 100);
  assert.strictEqual(all.length, MOCK_ARTICLES.length);
});

test('📃 排序 — 按 viewCount 降序，a5(8900) 排第一', () => {
  const sorted = sortArticles(MOCK_ARTICLES, 'viewCount', 'desc');
  assert.strictEqual(sorted[0].id, 'a5');
  assert.strictEqual(sorted[1].id, 'a2');
});

test('📃 排序 — 按 viewCount 升序，a7(0) 排第一', () => {
  const sorted = sortArticles(MOCK_ARTICLES, 'viewCount', 'asc');
  assert.strictEqual(sorted[0].id, 'a7');
});

test('📃 排序 — 按 title 升序排列', () => {
  const sorted = sortArticles(MOCK_ARTICLES, 'title', 'asc');
  // Draft: 秋季活动方案 -> VR 游戏新手入门指南 -> 会员积分怎么用？-> 如何正确佩戴 VR 头显 -> 周末亲子活动预告 -> 暑期特惠活动 -> 旧版会员政策（已归档）-> 门店营业时间调整通知
  assert.strictEqual(sorted[0].title, 'Draft: 秋季活动方案');
  assert.strictEqual(sorted[sorted.length - 1].title, '门店营业时间调整通知');
});

test('📃 排序 — 按 publishedAt 降序（最近优先）', () => {
  const sorted = sortArticles(MOCK_ARTICLES, 'publishedAt', 'desc');
  // a6 (2026-07-12) 应排第一
  assert.strictEqual(sorted[0].id, 'a6');
});

test('📃 排序 — 空列表不崩溃', () => {
  const sorted = sortArticles([], 'viewCount', 'desc');
  assert.deepStrictEqual(sorted, []);
});

test('导出 — dynamic = "force-dynamic"', async () => {
  const mod = await import('./page');
  assert.strictEqual(mod.dynamic, 'force-dynamic');
});

test('导出 — revalidate = 0', async () => {
  const mod = await import('./page');
  assert.strictEqual(mod.revalidate, 0);
});

test('边界 — 文章 ID 唯一性', () => {
  const ids = MOCK_ARTICLES.map((a) => a.id);
  const uniqueIds = new Set(ids);
  assert.strictEqual(uniqueIds.size, ids.length, '所有文章 ID 应唯一');
});

test('边界 — 全部分类包含 7 个枚举值', () => {
  assert.strictEqual(ALL_CATEGORIES.length, 7);
});

test('边界 — 分类与标签映射数量一致', () => {
  const mappedCats = new Set(Object.keys(CATEGORY_LABELS));
  assert.strictEqual(mappedCats.size, ALL_CATEGORIES.length);
  for (const cat of ALL_CATEGORIES) {
    assert.ok(mappedCats.has(cat), `分类 ${cat} 应在映射表中`);
  }
});

test('边界 — 分类筛选空列表不崩溃', () => {
  const result = filterByCategory([], 'game-guide');
  assert.deepStrictEqual(result, []);
});

test('边界 — 状态过滤空列表不崩溃', () => {
  const result = filterByStatus([], 'published');
  assert.deepStrictEqual(result, []);
});

test('边界 — 搜索空列表不崩溃', () => {
  const result = searchArticles([], 'anything');
  assert.deepStrictEqual(result, []);
});

test('边界 — 文章的 coverUrl 为可选字段', () => {
  for (const article of MOCK_ARTICLES) {
    // coverUrl 应为 undefined 或 string
    if (article.coverUrl !== undefined) {
      assert.equal(typeof article.coverUrl, 'string');
    }
  }
});
