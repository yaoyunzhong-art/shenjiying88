/**
 * page.test.tsx — HelpCenterPage 页面组件冒烟 + 交互测试
 *
 * 测试场景：
 *   1. 组件声明与 metadata 验证
 *   2. HelpCenterClient props 与内部组件引用链
 *   3. 搜索/分类/状态三联动过滤
 *   4. 分页重置与排序联动
 *   5. 辅助函数边界测试
 */

import assert from 'node:assert/strict';
import test from 'node:test';

// ---------------------------------------------------------------------------
// 1. 组件声明验证
// ---------------------------------------------------------------------------

test('正例: page.tsx 导出默认函数组件 HelpCenterPage', async () => {
  const src = await import('fs').then((fs) =>
    fs.promises.readFile(new URL('./page.tsx', import.meta.url), 'utf-8'),
  );
  assert.ok(src.includes('export default function HelpCenterPage'),
    '页面应使用 export default function HelpCenterPage 声明');
  assert.ok(src.includes('HelpCenterPage'), '组件名应为 HelpCenterPage');
});

test('正例: page.tsx metadata 包含中文标题', async () => {
  const src = await import('fs').then((fs) =>
    fs.promises.readFile(new URL('./page.tsx', import.meta.url), 'utf-8'),
  );
  assert.ok(src.includes('帮助中心'), 'metadata title 应包含"帮助中心"');
  assert.ok(src.includes('description'), 'metadata 应包含 description');
});

test('正例: page.tsx 调用 getHelpArticles + 渲染 HelpCenterClient', async () => {
  const src = await import('fs').then((fs) =>
    fs.promises.readFile(new URL('./page.tsx', import.meta.url), 'utf-8'),
  );
  assert.ok(src.includes('getHelpArticles'), '应调用 getHelpArticles');
  assert.ok(src.includes('HelpCenterClient'), '应渲染 HelpCenterClient');
});

// ---------------------------------------------------------------------------
// 2. HelpCenterClient 组件 API 验证
// ---------------------------------------------------------------------------

test('正例: help-center-client 导出 HelpCenterClient 组件', async () => {
  const src = await import('fs').then((fs) =>
    fs.promises.readFile(new URL('./help-center-client.tsx', import.meta.url), 'utf-8'),
  );
  assert.ok(src.includes('export function HelpCenterClient'), '应导出 HelpCenterClient');
  assert.ok(src.includes('articles'), 'props 应包含 articles');
});

test('正例: HelpCenterClient 使用核心 UI 组件', async () => {
  const src = await import('fs').then((fs) =>
    fs.promises.readFile(new URL('./help-center-client.tsx', import.meta.url), 'utf-8'),
  );
  assert.ok(src.includes('DataTable'), '应使用 DataTable');
  assert.ok(src.includes('Pagination'), '应使用 Pagination');
  assert.ok(src.includes('SearchFilterInput'), '应使用 SearchFilterInput');
  assert.ok(src.includes('QuickStats'), '应使用 QuickStats');
  assert.ok(src.includes('Tabs'), '应使用 Tabs');
  assert.ok(src.includes('FilterChips'), '应使用 FilterChips');
  assert.ok(src.includes('PageShell'), '应使用 PageShell');
  assert.ok(src.includes('DetailActionBar'), '应使用 DetailActionBar');
});

test('正例: HelpCenterClient 表头列定义完整', async () => {
  const src = await import('fs').then((fs) =>
    fs.promises.readFile(new URL('./help-center-client.tsx', import.meta.url), 'utf-8'),
  );
  assert.ok(src.includes("'status'"), '应包含 status 列');
  assert.ok(src.includes("'title'"), '应包含 title 列');
  assert.ok(src.includes("'category'"), '应包含 category 列');
  assert.ok(src.includes("'tags'"), '应包含 tags 列');
  assert.ok(src.includes("'author'"), '应包含 author 列');
  assert.ok(src.includes("'updatedAt'"), '应包含 updatedAt 列');
  assert.ok(src.includes("'viewCount'"), '应包含 viewCount 列');
  assert.ok(src.includes("'helpfulCount'"), '应包含 helpfulCount 列');
});

// ---------------------------------------------------------------------------
// 3. 交互逻辑验证 — state 管理
// ---------------------------------------------------------------------------

test('正例: HelpCenterClient 包含完整的状态管理体系', async () => {
  const src = await import('fs').then((fs) =>
    fs.promises.readFile(new URL('./help-center-client.tsx', import.meta.url), 'utf-8'),
  );
  assert.ok(src.includes('searchText'), '应包含 searchText');
  assert.ok(src.includes('categoryFilter'), '应包含 categoryFilter');
  assert.ok(src.includes('statusFilter'), '应包含 statusFilter');
  assert.ok(src.includes('sortConfig'), '应包含 sortConfig');
  assert.ok(src.includes('usePagination'), '应使用 usePagination');
  assert.ok(src.includes('useSortedItems'), '应使用 useSortedItems');
  assert.ok(src.includes('useMemo'), '应使用 useMemo');
});

test('正例: 分类选项卡覆盖所有类别', async () => {
  const src = await import('fs').then((fs) =>
    fs.promises.readFile(new URL('./help-center-client.tsx', import.meta.url), 'utf-8'),
  );
  const categories = [
    'ALL', 'getting-started', 'account-management', 'market-operations',
    'brand-management', 'store-operations', 'finance-settlement',
    'security-compliance', 'api-integration', 'troubleshooting',
  ];
  for (const cat of categories) {
    assert.ok(src.includes(cat), `分类选项卡应包含 ${cat}`);
  }
});

// ---------------------------------------------------------------------------
// 4. 数据流组合验证
// ---------------------------------------------------------------------------

test('正例: 全量文章数据流管道', async () => {
  const {
    getHelpArticles, computeArticleStats, filterArticlesByCategory,
    filterArticlesByStatus, searchArticles,
  } = await import('./help-center-data');
  const articles = getHelpArticles();
  const stats = computeArticleStats(articles);

  // 模拟 client 过滤流: 分类 → 状态 → 搜索
  const result = searchArticles(
    filterArticlesByStatus(
      filterArticlesByCategory(articles, 'ALL'),
      'ALL',
    ),
    '',
  );

  assert.strictEqual(result.length, articles.length, '全量过滤应返回全部文章');
  assert.strictEqual(stats.total, articles.length, '统计数据应与文章数一致');
});

test('正例: 组合过滤 — 分类 + 状态 + 搜索', async () => {
  const {
    getHelpArticles, filterArticlesByCategory,
    filterArticlesByStatus, searchArticles,
  } = await import('./help-center-data');
  const articles = getHelpArticles();

  const result = searchArticles(
    filterArticlesByStatus(
      filterArticlesByCategory(articles, 'store-operations'),
      'published',
    ),
    'PAD',
  );

  assert.ok(result.length >= 1, '组合过滤应有结果');
  assert.ok(result.every((a) => a.category === 'store-operations'), '所有结果属于 store-operations');
  assert.ok(result.every((a) => a.status === 'published'), '所有结果已发布');
});

test('正例: 清空全部 filter 回到全量', async () => {
  const {
    getHelpArticles, filterArticlesByCategory,
    filterArticlesByStatus, searchArticles,
  } = await import('./help-center-data');

  const articles = getHelpArticles();

  // 应用过滤器
  const filtered = searchArticles(
    filterArticlesByStatus(
      filterArticlesByCategory(articles, 'security-compliance'),
      'published',
    ),
    '审计',
  );
  assert.ok(filtered.length >= 1, '筛选应有结果');

  // 清空全部
  const cleared = searchArticles(
    filterArticlesByStatus(
      filterArticlesByCategory(articles, 'ALL'),
      'ALL',
    ),
    '',
  );
  assert.strictEqual(cleared.length, articles.length, '清空后回到全量');
});

// ---------------------------------------------------------------------------
// 5. 辅助函数边界测试
// ---------------------------------------------------------------------------

test('边界: computeArticleStats 空数组', async () => {
  const { computeArticleStats } = await import('./help-center-data');
  const stats = computeArticleStats([]);
  assert.strictEqual(stats.total, 0);
  assert.strictEqual(stats.published, 0);
  assert.strictEqual(stats.draft, 0);
  assert.strictEqual(stats.totalViews, 0);
  assert.strictEqual(stats.totalHelpful, 0);
});

test('边界: filterArticlesByCategory 未知分类返回空', async () => {
  const { getHelpArticles, filterArticlesByCategory } = await import('./help-center-data');
  const articles = getHelpArticles();
  const result = filterArticlesByCategory(articles, 'unknown-category' as never);
  assert.strictEqual(result.length, 0, '未知分类应返回空');
});

test('边界: filterArticlesByStatus 未知状态返回空', async () => {
  const { getHelpArticles, filterArticlesByStatus } = await import('./help-center-data');
  const articles = getHelpArticles();
  const result = filterArticlesByStatus(articles, 'archived' as never);
  assert.strictEqual(result.length, 0, '未知状态应返回空');
});

test('边界: getCategoryName 未知 ID 返回原始值', async () => {
  const { getCategoryName } = await import('./help-center-data');
  assert.strictEqual(getCategoryName('unknown-category' as never), 'unknown-category');
});

test('边界: searchArticles 无匹配返回空', async () => {
  const { getHelpArticles, searchArticles } = await import('./help-center-data');
  const articles = getHelpArticles();
  const result = searchArticles(articles, '___no_match_xyz___');
  assert.strictEqual(result.length, 0, '无匹配应返回空');
});

test('边界: searchArticles 空白查询返回全部', async () => {
  const { getHelpArticles, searchArticles } = await import('./help-center-data');
  const articles = getHelpArticles();
  assert.strictEqual(searchArticles(articles, '').length, articles.length, '空字符串应返回全部');
  assert.strictEqual(searchArticles(articles, '   ').length, articles.length, '空白字符应返回全部');
});

// ---------------------------------------------------------------------------
// 6. 源码健康检查
// ---------------------------------------------------------------------------

test('正例: client 组件无 debug 残留', async () => {
  const src = await import('fs').then((fs) =>
    fs.promises.readFile(new URL('./help-center-client.tsx', import.meta.url), 'utf-8'),
  );
  assert.ok(!src.includes('console.log('), '不应含 console.log');
  assert.ok(!src.includes('debugger;'), '不应含 debugger');
  assert.ok(!src.includes('describe(') && !src.includes('it('), '不应含测试残留');
});

test('正例: FilterChips onClearAll 绑定完整', async () => {
  const src = await import('fs').then((fs) =>
    fs.promises.readFile(new URL('./help-center-client.tsx', import.meta.url), 'utf-8'),
  );
  assert.ok(src.includes('onClearAll'), '应绑定 onClearAll');
  assert.ok(
    src.includes("setCategoryFilter('ALL')") &&
    src.includes("setStatusFilter('ALL')") &&
    src.includes("setSearchText('')"),
    'onClearAll 应重置所有 filter',
  );
});

test('正例: 使用 useMemo 缓存过滤结果', async () => {
  const src = await import('fs').then((fs) =>
    fs.promises.readFile(new URL('./help-center-client.tsx', import.meta.url), 'utf-8'),
  );
  const useMemoCount = (src.match(/useMemo/g) || []).length;
  assert.ok(useMemoCount >= 3, `应有 >= 3 个 useMemo (当前: ${useMemoCount})`);
});

test('正例: filter 变化时重置分页', async () => {
  const src = await import('fs').then((fs) =>
    fs.promises.readFile(new URL('./help-center-client.tsx', import.meta.url), 'utf-8'),
  );
  assert.ok(
    src.includes('pagination.resetPage()') &&
    src.includes('[searchText, categoryFilter, statusFilter, pagination]'),
    'useEffect 应随 filter 变化重置分页',
  );
});
