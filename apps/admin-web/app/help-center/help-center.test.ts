/**
 * help-center.test.ts — 帮助中心 L1 冒烟测试
 * 正例 + 反例 + 边界
 *
 * 角色视角: 👔平台管理员 · 📚知识库 · 🤝技术支持
 */

import assert from 'node:assert/strict';
import test from 'node:test';

// ---------------------------------------------------------------------------
// 1. 组件和数据导出验证
// ---------------------------------------------------------------------------

test('正例: 默认从 page.tsx 导出一个函数组件 HelpCenterPage (源码声明检查)', async () => {
  const src = await import('fs').then((fs) =>
    fs.promises.readFile(new URL('./page.tsx', import.meta.url), 'utf-8'),
  );
  assert.ok(src.includes('export default function HelpCenterPage'),
    '页面应使用 export default function HelpCenterPage 声明');
  assert.ok(src.includes('HelpCenterPage'), '组件名应为 HelpCenterPage');
});

test('正例: help-center-data 导出所有核心类型和函数', async () => {
  const mod = await import('./help-center-data');
  assert.ok(typeof mod.getHelpArticles === 'function', '应导出 getHelpArticles');
  assert.ok(typeof mod.getHelpFaqs === 'function', '应导出 getHelpFaqs');
  assert.ok(typeof mod.getCategoryName === 'function', '应导出 getCategoryName');
  assert.ok(typeof mod.filterArticlesByCategory === 'function', '应导出 filterArticlesByCategory');
  assert.ok(typeof mod.filterArticlesByStatus === 'function', '应导出 filterArticlesByStatus');
  assert.ok(typeof mod.searchArticles === 'function', '应导出 searchArticles');
  assert.ok(typeof mod.computeArticleStats === 'function', '应导出 computeArticleStats');
  assert.ok(typeof mod.getPopularFaqs === 'function', '应导出 getPopularFaqs');
  assert.ok(typeof mod.getFaqsByCategory === 'function', '应导出 getFaqsByCategory');
  assert.ok(Array.isArray(mod.HELP_CATEGORIES), '应导出 HELP_CATEGORIES 数组');
});

// ---------------------------------------------------------------------------
// 2. 数据完整性验证
// ---------------------------------------------------------------------------

test('正例: getHelpArticles 返回 18 篇文章', async () => {
  const { getHelpArticles } = await import('./help-center-data');
  const articles = getHelpArticles();
  assert.strictEqual(articles.length, 18, '应包含 18 篇帮助文档');
});

test('正例: 每篇文章包含所有必填字段', async () => {
  const { getHelpArticles } = await import('./help-center-data');
  const requiredFields: (keyof import('./help-center-data').HelpArticle)[] = [
    'id', 'title', 'content', 'category', 'tags', 'status', 'author',
    'createdAt', 'updatedAt', 'viewCount', 'helpfulCount',
  ];
  const articles = getHelpArticles();
  for (const article of articles) {
    for (const field of requiredFields) {
      assert.notEqual(article[field], undefined, `文章 ${article.id} 缺少字段: ${field}`);
    }
  }
});

test('正例: HELP_CATEGORIES 包含 9 个分类', async () => {
  const { HELP_CATEGORIES, getHelpArticles } = await import('./help-center-data');
  assert.strictEqual(HELP_CATEGORIES.length, 9, '应包含 9 个分类');

  // 验证每个分类 ID 都被文章使用
  const articles = getHelpArticles();
  const usedCategories = new Set(articles.map((a) => a.category));
  for (const cat of HELP_CATEGORIES) {
    assert.ok(usedCategories.has(cat.id), `分类 ${cat.id} 没有被任何文章引用`);
  }
});

test('正例: getHelpFaqs 返回 10 条常见问题', async () => {
  const { getHelpFaqs } = await import('./help-center-data');
  const faqs = getHelpFaqs();
  assert.strictEqual(faqs.length, 10, '应包含 10 条 FAQ');
});

test('正例: 每条 FAQ 包含所有必填字段', async () => {
  const { getHelpFaqs } = await import('./help-center-data');
  const requiredFields: (keyof import('./help-center-data').HelpFaqItem)[] = [
    'id', 'question', 'answer', 'category', 'order', 'isPopular',
  ];
  const faqs = getHelpFaqs();
  for (const faq of faqs) {
    for (const field of requiredFields) {
      assert.notEqual(faq[field], undefined, `FAQ ${faq.id} 缺少字段: ${field}`);
    }
  }
});

// ---------------------------------------------------------------------------
// 3. 辅助函数功能验证
// ---------------------------------------------------------------------------

test('正例: getCategoryName 返回正确的中文名称', async () => {
  const { getCategoryName } = await import('./help-center-data');
  assert.strictEqual(getCategoryName('getting-started'), '快速入门');
  assert.strictEqual(getCategoryName('api-integration'), 'API 集成');
  assert.strictEqual(getCategoryName('troubleshooting'), '故障排查');
});

test('正例: filterArticlesByCategory 正确筛选', async () => {
  const { getHelpArticles, filterArticlesByCategory } = await import('./help-center-data');
  const articles = getHelpArticles();
  const gettingStarted = filterArticlesByCategory(articles, 'getting-started');
  assert.strictEqual(gettingStarted.length, 2, '快速入门分类应有 2 篇文章');
  assert.ok(gettingStarted.every((a) => a.category === 'getting-started'));

  const all = filterArticlesByCategory(articles, 'ALL');
  assert.strictEqual(all.length, 18, 'ALL 应返回全部文章');
});

test('正例: filterArticlesByStatus 正确筛选', async () => {
  const { getHelpArticles, filterArticlesByStatus } = await import('./help-center-data');
  const articles = getHelpArticles();
  const published = filterArticlesByStatus(articles, 'published');
  assert.strictEqual(published.length, 16, '应有 16 篇已发布文章');
  assert.ok(published.every((a) => a.status === 'published'));

  const drafts = filterArticlesByStatus(articles, 'draft');
  assert.strictEqual(drafts.length, 2, '应有 2 篇草稿');
  assert.ok(drafts.every((a) => a.status === 'draft'));

  const all = filterArticlesByStatus(articles, 'ALL');
  assert.strictEqual(all.length, 18, 'ALL 应返回全部文章');
});

test('正例: searchArticles 按标题搜索', async () => {
  const { getHelpArticles, searchArticles } = await import('./help-center-data');
  const articles = getHelpArticles();
  const result = searchArticles(articles, 'API');
  assert.ok(result.length > 0, '搜索 "API" 应返回结果');
  assert.ok(result.some((a) => a.title.includes('API')), '搜索结果应包含标题含 API 的文章');
});

test('正例: searchArticles 按作者搜索', async () => {
  const { getHelpArticles, searchArticles } = await import('./help-center-data');
  const articles = getHelpArticles();
  const result = searchArticles(articles, '安全团队');
  assert.ok(result.length > 0, '搜索 "安全团队" 应返回结果');
  assert.ok(result.every((a) => a.author === '安全团队'), '搜索结果作者都应匹配');
});

test('正例: searchArticles 按标签搜索', async () => {
  const { getHelpArticles, searchArticles } = await import('./help-center-data');
  const articles = getHelpArticles();
  const result = searchArticles(articles, 'PAD');
  assert.ok(result.length > 0, '搜索 "PAD" 应返回结果');
  assert.ok(result.some((a) => a.tags.includes('PAD')), '搜索结果应包含标签含 PAD 的文章');
});

test('边界: searchArticles 空查询返回全部', async () => {
  const { getHelpArticles, searchArticles } = await import('./help-center-data');
  const articles = getHelpArticles();
  const result = searchArticles(articles, '');
  assert.strictEqual(result.length, articles.length, '空搜索应返回全部');
  const result2 = searchArticles(articles, '   ');
  assert.strictEqual(result2.length, articles.length, '空白搜索应返回全部');
});

test('反例: searchArticles 无匹配返回空数组', async () => {
  const { getHelpArticles, searchArticles } = await import('./help-center-data');
  const articles = getHelpArticles();
  const result = searchArticles(articles, 'zzZZnonexistent___xyz');
  assert.strictEqual(result.length, 0, '无匹配搜索应返回空数组');
});

test('正例: computeArticleStats 正确计算统计', async () => {
  const { getHelpArticles, computeArticleStats } = await import('./help-center-data');
  const articles = getHelpArticles();
  const stats = computeArticleStats(articles);
  assert.strictEqual(stats.total, 18, '总数应为 18');
  assert.strictEqual(stats.published, 16, '已发布应为 16');
  assert.strictEqual(stats.draft, 2, '草稿应为 2');
  assert.ok(stats.totalViews > 0, '总浏览量应大于 0');
  assert.ok(stats.totalHelpful > 0, '有帮助数应大于 0');
  assert.ok(stats.helpfulRate === undefined || typeof stats.helpfulRate === 'number', '可选字段 helpfulRate');
});

// ---------------------------------------------------------------------------
// 4. 边界条件验证
// ---------------------------------------------------------------------------

test('边界: getPopularFaqs 返回 6 条热门 FAQ', async () => {
  const { getHelpFaqs, getPopularFaqs } = await import('./help-center-data');
  const faqs = getHelpFaqs();
  const popular = getPopularFaqs(faqs);
  assert.strictEqual(popular.length, 6, '应有 6 条热门 FAQ');
  assert.ok(popular.every((f) => f.isPopular), '热门 FAQ 的 isPopular 应为 true');
  // 验证排序
  for (let i = 1; i < popular.length; i++) {
    assert.ok(popular[i - 1].order <= popular[i].order, '热门 FAQ 应按 order 升序排列');
  }
});

test('边界: getFaqsByCategory 正确筛选', async () => {
  const { getHelpFaqs, getFaqsByCategory } = await import('./help-center-data');
  const faqs = getHelpFaqs();
  const storeFaqs = getFaqsByCategory(faqs, 'store-operations');
  assert.ok(storeFaqs.length > 0, '门店运营应有 FAQ');
  assert.ok(storeFaqs.every((f) => f.category === 'store-operations'));

  const all = getFaqsByCategory(faqs, 'ALL');
  assert.strictEqual(all.length, faqs.length, 'ALL 应返回全部');
});

test('边界: 浏览量字段应为非负整数', async () => {
  const { getHelpArticles } = await import('./help-center-data');
  const articles = getHelpArticles();
  for (const article of articles) {
    assert.ok(Number.isInteger(article.viewCount), `文章 ${article.id} viewCount 应为整数`);
    assert.ok(article.viewCount >= 0, `文章 ${article.id} viewCount 应 >= 0`);
    assert.ok(Number.isInteger(article.helpfulCount), `文章 ${article.id} helpfulCount 应为整数`);
    assert.ok(article.helpfulCount >= 0, `文章 ${article.id} helpfulCount 应 >= 0`);
  }
});

test('边界: 客户端组件使用 DataTable / Pagination 等 UI 组件', async () => {
  const src = await import('fs').then((fs) =>
    fs.promises.readFile(new URL('./help-center-client.tsx', import.meta.url), 'utf-8'),
  );
  assert.ok(src.includes('DataTable'), '应使用 DataTable 组件');
  assert.ok(src.includes('Pagination'), '应使用 Pagination 组件');
  assert.ok(src.includes('SearchFilterInput'), '应使用搜索组件');
  assert.ok(src.includes('QuickStats'), '应使用统计卡片组件');
  assert.ok(src.includes('FilterChips'), '应使用筛选条件组件');
  assert.ok(src.includes('useDetailActions'), '应使用 useDetailActions hook');
});

test('边界: 客户端组件支持分页和排序', async () => {
  const src = await import('fs').then((fs) =>
    fs.promises.readFile(new URL('./help-center-client.tsx', import.meta.url), 'utf-8'),
  );
  assert.ok(src.includes('sortConfig'), '应支持排序配置');
  assert.ok(src.includes('useSortedItems'), '应使用 useSortedItems hook');
  assert.ok(src.includes('pageSizeOptions'), '应配置分页大小选项');
  assert.ok(src.includes('usePagination'), '应使用 usePagination hook');
});

test('边界: 客户端组件支持分类筛选和状态筛选', async () => {
  const src = await import('fs').then((fs) =>
    fs.promises.readFile(new URL('./help-center-client.tsx', import.meta.url), 'utf-8'),
  );
  assert.ok(src.includes('categoryFilter'), '应有分类筛选');
  assert.ok(src.includes('statusFilter'), '应有状态筛选');
});

// ---------------------------------------------------------------------------
// 5. 反例验证
// ---------------------------------------------------------------------------

test('反例: 数据集不应包含未定义或 null 的分类', async () => {
  const { getHelpArticles, HELP_CATEGORIES } = await import('./help-center-data');
  const validCategoryIds = new Set(HELP_CATEGORIES.map((c) => c.id));
  const articles = getHelpArticles();
  for (const article of articles) {
    assert.ok(validCategoryIds.has(article.category), `文章 ${article.id} 使用了未知分类: ${article.category}`);
  }
});

test('反例: 数据集不应出现非法的文章状态', async () => {
  const { getHelpArticles } = await import('./help-center-data');
  const articles = getHelpArticles();
  for (const article of articles) {
    assert.ok(
      article.status === 'published' || article.status === 'draft',
      `文章 ${article.id} 状态非法: ${article.status}`
    );
  }
});
