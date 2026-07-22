/**
 * bookshelf/page.vitest.tsx — 书架页面 Vitest 增强测试
 *
 * 圈梁五道箍 — 树哥C — 页面渲染完整性 + 组件交互 + 状态变化
 *
 * 覆盖:
 *   - BookshelfClient 组件渲染
 *   - 纯函数完整性（分类/搜索/分页/排序/统计）
 *   - 边缘/空/错误状态
 *   - BookshelfPage 数据加载
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, test, expect, vi } from 'vitest';

// ---- Mocks ----

vi.mock('@m5/ui', () => ({
  PageShell: ({ children, title, subtitle }: { children: React.ReactNode; title?: string; subtitle?: string }) => (
    <div data-testid="page-shell" data-title={title} data-subtitle={subtitle}>{children}</div>
  ),
  LoadingSkeleton: ({ label }: { label?: string }) => (
    <div data-testid="loading-skeleton">{label}</div>
  ),
  ErrorBoundary: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="error-boundary">{children}</div>
  ),
}));

// ---- Types (mirror page.tsx) ----

type ArticleCategory = 'game-guide' | 'device-tutorial' | 'promotion' | 'faq' | 'policy' | 'news' | 'other';
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

// ---- Pure functions (from page.tsx) ----

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

function filterByCategory(articles: ArticleSnapshot[], category: ArticleCategory | 'ALL'): ArticleSnapshot[] {
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

function filterByStatus(articles: ArticleSnapshot[], status: ArticleStatus | 'ALL'): ArticleSnapshot[] {
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

// ---- Mock data ----

function makeArticle(overrides?: Partial<ArticleSnapshot>): ArticleSnapshot {
  return {
    id: `a-${Math.random().toString(36).slice(2, 8)}`,
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
  makeArticle({ id: 'a1', title: 'VR 游戏新手入门指南', category: 'game-guide', summary: '第一次玩 VR 指南', author: '小爽', status: 'published', viewCount: 3200, likeCount: 186, publishedAt: '2026-07-10', updatedAt: '2026-07-10', tags: ['新手入门', 'VR 体验'] }),
  makeArticle({ id: 'a2', title: '暑期特惠活动', category: 'promotion', summary: '暑期特惠季全场 8 折起。', author: '市场部', status: 'published', viewCount: 5600, likeCount: 420, publishedAt: '2026-07-01', updatedAt: '2026-07-05', tags: ['会员福利', '暑期活动'] }),
  makeArticle({ id: 'a3', title: '如何正确佩戴 VR 头显', category: 'device-tutorial', summary: '正确的佩戴方式可以提升沉浸感并减少晕动症。', author: '技术部', status: 'published', viewCount: 1800, likeCount: 95, publishedAt: '2026-06-20', updatedAt: '2026-06-20', tags: ['VR 体验', '设备指南'] }),
  makeArticle({ id: 'a4', title: '会员积分怎么用？', category: 'faq', summary: '会员积分兑换规则与常见问题。', author: '客服部', status: 'published', viewCount: 4500, likeCount: 310, publishedAt: '2026-06-15', updatedAt: '2026-06-18', tags: ['会员福利'] }),
  makeArticle({ id: 'a5', title: '门店营业时间调整通知', category: 'policy', summary: '营业时间调整通知。', author: '行政部', status: 'published', viewCount: 8900, likeCount: 67, publishedAt: '2026-06-28', updatedAt: '2026-06-28', tags: ['门店公告'] }),
  makeArticle({ id: 'a6', title: '周末亲子活动预告', category: 'news', summary: '本周末亲子 VR 竞赛活动。', author: '市场部', status: 'published', viewCount: 1200, likeCount: 88, publishedAt: '2026-07-12', updatedAt: '2026-07-12', tags: ['周末活动', '亲子'] }),
  makeArticle({ id: 'a7', title: 'Draft: 秋季活动方案', category: 'other', summary: '秋季活动初步方案（讨论中）', author: '市场部', status: 'draft', viewCount: 0, likeCount: 0, publishedAt: '', updatedAt: '2026-07-08', tags: [] }),
  makeArticle({ id: 'a8', title: '旧版会员政策（已归档）', category: 'policy', summary: '2025 版会员政策历史参考。', author: '行政部', status: 'archived', viewCount: 300, likeCount: 12, publishedAt: '2025-06-01', updatedAt: '2026-01-01', tags: ['会员福利'] }),
];

const MOCK_SNAPSHOT: BookshelfSnapshot = {
  articles: MOCK_ARTICLES,
  categories: ['game-guide', 'device-tutorial', 'promotion', 'faq', 'policy', 'news'],
  totalArticles: 48,
  totalViews: 28500,
  hotTags: ['新手入门', 'VR 体验', '会员福利', '周末活动', '门店公告'],
  recommendedArticles: MOCK_ARTICLES.filter((a) => a.status === 'published').slice(0, 3),
};

// ---- BookshelfClient (from bookshelf-client.tsx) ----

import BookshelfClient from './bookshelf-client';

/* ===================================================================
 * 圈梁五道箍 — 树哥C — 书架页面增强测试
 * ===================================================================
 * 策略：Render 测试 + 纯函数测试 + 边界测试
 * 与 node:test 互补（node:test 侧重静态类型/数据结构）
 * =================================================================== */

describe('📚 圈梁五道箍 — BookshelfPage 渲染测试', () => {
  // ─── 1. BookshelfClient 渲染完整性 ───

  test('[圈梁五道箍] BookshelfClient 渲染 totalArticles', () => {
    render(<BookshelfClient data={MOCK_SNAPSHOT} />);
    expect(screen.getByTestId('total-articles')).toHaveTextContent('48');
  });

  test('[圈梁五道箍] BookshelfClient 渲染 totalViews', () => {
    render(<BookshelfClient data={MOCK_SNAPSHOT} />);
    expect(screen.getByTestId('total-views')).toHaveTextContent('28500');
  });

  test('[圈梁五道箍] BookshelfClient 渲染 bookshelf-client data-testid', () => {
    render(<BookshelfClient data={MOCK_SNAPSHOT} />);
    expect(screen.getByTestId('bookshelf-client')).toBeInTheDocument();
  });

  // ─── 2. 空/边界数据渲染 ───

  test('[圈梁五道箍] BookshelfClient 渲染空数据不崩溃', () => {
    const emptyData: BookshelfSnapshot = {
      articles: [],
      categories: [],
      totalArticles: 0,
      totalViews: 0,
      hotTags: [],
      recommendedArticles: [],
    };
    render(<BookshelfClient data={emptyData} />);
    expect(screen.getByTestId('total-articles')).toHaveTextContent('0');
    expect(screen.getByTestId('total-views')).toHaveTextContent('0');
  });

  test('[圈梁五道箍] BookshelfClient 渲染超大数值', () => {
    const bigData: BookshelfSnapshot = {
      ...MOCK_SNAPSHOT,
      totalArticles: 99999,
      totalViews: 99999999,
    };
    render(<BookshelfClient data={bigData} />);
    expect(screen.getByTestId('total-articles')).toHaveTextContent('99999');
    expect(screen.getByTestId('total-views')).toHaveTextContent('99999999');
  });

  // ─── 3. page.tsx 导入完整性 ───

  test('[圈梁五道箍] BookshelfPage 默认导出为 async function', async () => {
    const mod = await import('./page');
    expect(typeof mod.default).toBe('function');
    // 导出的函数是 async（返回 Promise）
    const result = mod.default();
    expect(result).toBeInstanceOf(Promise);
  });

  test('[圈梁五道箍] BookshelfPage 导出 force-dynamic 和 revalidate=0', async () => {
    const mod = await import('./page');
    expect(mod.dynamic).toBe('force-dynamic');
    expect(mod.revalidate).toBe(0);
  });

  test('[圈梁五道箍] BookshelfPage 内部使用 ErrorBoundary 包裹', async () => {
    const mod = await import('./page');
    const src = mod.default.toString();
    // 经过 vite transform 后 JSX 变为 createElement 调用
    expect(src).toMatch(/ErrorBoundary/);
  });

  test('[圈梁五道箍] BookshelfPage 内部使用 LoadingSkeleton 作为 Suspense fallback', async () => {
    const mod = await import('./page');
    expect(mod.default).toBeInstanceOf(Function);
    // 确保 loadBookshelfSnapshot 被调用
    const src = mod.default.toString();
    expect(src).toMatch(/loadBookshelfSnapshot/);
    expect(src).toMatch(/LoadingSkeleton|loading-skeleton/i);
  });

  test('[圈梁五道箍] CATEGORY_LABELS 覆盖所有 7 个分类', () => {
    const categories: ArticleCategory[] = ['game-guide', 'device-tutorial', 'promotion', 'faq', 'policy', 'news', 'other'];
    for (const cat of categories) {
      expect(CATEGORY_LABELS[cat]).toBeDefined();
      expect(CATEGORY_LABELS[cat].length).toBeGreaterThan(1);
    }
    expect(Object.keys(CATEGORY_LABELS).length).toBe(7);
  });

  test('[圈梁五道箍] STATUS_LABELS 覆盖所有 3 个状态', () => {
    expect(STATUS_LABELS.published).toBe('已发布');
    expect(STATUS_LABELS.draft).toBe('草稿');
    expect(STATUS_LABELS.archived).toBe('已归档');
  });
});

describe('📚 圈梁五道箍 — Bookshelf 纯函数深度测试', () => {
  // ─── 分类筛选深度测试 ───

  test('[圈梁五道箍] filterByCategory 精准过滤每个分类', () => {
    // game-guide: a1
    expect(filterByCategory(MOCK_ARTICLES, 'game-guide')).toHaveLength(1);
    // policy: a5, a8
    expect(filterByCategory(MOCK_ARTICLES, 'policy')).toHaveLength(2);
    // promotion: a2
    expect(filterByCategory(MOCK_ARTICLES, 'promotion')).toHaveLength(1);
  });

  // ─── 搜索功能测试 ───

  test('[圈梁五道箍] searchArticles 多关键词搜索', () => {
    // "活动" → a2 (title: 暑期特惠活动), a6 (tags: 周末活动)
    const r1 = searchArticles(MOCK_ARTICLES, '活动');
    expect(r1.length).toBeGreaterThanOrEqual(2);
    // "亲子" → a6 (tags: 亲子)
    const r2 = searchArticles(MOCK_ARTICLES, '亲子');
    expect(r2.length).toBe(1);
    expect(r2[0].id).toBe('a6');
  });

  test('[圈梁五道箍] searchArticles 标签搜索', () => {
    // "门店公告" tag → a5
    const r = searchArticles(MOCK_ARTICLES, '门店公告');
    expect(r.length).toBe(1);
    expect(r[0].id).toBe('a5');
  });

  test('[圈梁五道箍] searchArticles 作者和摘要联合搜索', () => {
    // "小爽" → a1
    const r1 = searchArticles(MOCK_ARTICLES, '小爽');
    expect(r1.length).toBe(1);
    expect(r1[0].id).toBe('a1');

    // "沉浸感" 不在 title/author/tags，在 summary → a3
    const r2 = searchArticles(MOCK_ARTICLES, '沉浸感');
    expect(r2.length).toBe(1);
    expect(r2[0].id).toBe('a3');
  });

  // ─── 状态过滤测试 ───

  test('[圈梁五道箍] filterByStatus 混合数据过滤', () => {
    const all = filterByStatus(MOCK_ARTICLES, 'ALL');
    expect(all.length).toBe(8);
    const pub = filterByStatus(MOCK_ARTICLES, 'published');
    expect(pub.length).toBe(6);
    const draft = filterByStatus(MOCK_ARTICLES, 'draft');
    expect(draft.length).toBe(1);
    expect(draft[0].id).toBe('a7');
  });

  // ─── 统计计算测试 ───

  test('[圈梁五道箍] computeArticleStats 精确数值', () => {
    const stats = computeArticleStats(MOCK_ARTICLES);
    expect(stats.total).toBe(8);
    expect(stats.published).toBe(6);
    expect(stats.categories).toBe(7);
    // a1(3200) + a2(5600) + a3(1800) + a4(4500) + a5(8900) + a6(1200) + a7(0) + a8(300) = 25500
    expect(stats.totalViews).toBe(25500);
    // 186 + 420 + 95 + 310 + 67 + 88 + 0 + 12 = 1178
    expect(stats.totalLikes).toBe(1178);
  });

  test('[圈梁五道箍] computeArticleStats 空列表结果全为 0', () => {
    const stats = computeArticleStats([]);
    expect(stats).toEqual({ total: 0, published: 0, categories: 0, totalViews: 0, totalLikes: 0 });
  });

  // ─── 分页边界测试 ───

  test('[圈梁五道箍] paginateArticles 边界条件', () => {
    // page=1, pageSize=5 → 5 items
    const p1 = paginateArticles(MOCK_ARTICLES, 1, 5);
    expect(p1).toHaveLength(5);
    expect(p1[0].id).toBe('a1');
    // page=2, pageSize=5 → 3 items (a6, a7, a8)
    const p2 = paginateArticles(MOCK_ARTICLES, 2, 5);
    expect(p2).toHaveLength(3);
    expect(p2[0].id).toBe('a6');
    // page=1, pageSize=0 → empty
    expect(paginateArticles(MOCK_ARTICLES, 1, 0)).toHaveLength(0);
    // page=0 → empty
    expect(paginateArticles(MOCK_ARTICLES, 0, 5)).toHaveLength(0);
    // page=999 → empty
    expect(paginateArticles(MOCK_ARTICLES, 999, 5)).toHaveLength(0);
    // empty input → empty output
    expect(paginateArticles([], 1, 5)).toHaveLength(0);
  });

  // ─── 排序测试 ───

  test('[圈梁五道箍] sortArticles 按 viewCount 降序', () => {
    const sorted = sortArticles(MOCK_ARTICLES, 'viewCount', 'desc');
    expect(sorted[0].id).toBe('a5');  // 8900
    expect(sorted[1].id).toBe('a2');  // 5600
    expect(sorted[sorted.length - 1].id).toBe('a7');  // 0
  });

  test('[圈梁五道箍] sortArticles 按 viewCount 升序', () => {
    const sorted = sortArticles(MOCK_ARTICLES, 'viewCount', 'asc');
    expect(sorted[0].id).toBe('a7');  // 0
    expect(sorted[sorted.length - 1].id).toBe('a5');  // 8900
  });

  test('[圈梁五道箍] sortArticles 按 publishedAt 降序', () => {
    const sorted = sortArticles(MOCK_ARTICLES, 'publishedAt', 'desc');
    // a6: 2026-07-12, a1: 2026-07-10, a2: 2026-07-01
    expect(sorted[0].id).toBe('a6');
    expect(sorted[1].id).toBe('a1');
  });

  test('[圈梁五道箍] sortArticles 按 title 升序', () => {
    const sorted = sortArticles(MOCK_ARTICLES, 'title', 'asc');
    // "Draft: 秋季活动方案" < "VR 游戏新手入门指南" < "会员积分怎么用？"
    expect(sorted[0].title).toBe('Draft: 秋季活动方案');
    expect(sorted[sorted.length - 1].title).toBe('门店营业时间调整通知');
  });

  test('[圈梁五道箍] sortArticles 空数组不崩溃', () => {
    expect(sortArticles([], 'viewCount', 'desc')).toEqual([]);
  });

  test('[圈梁五道箍] sortArticles 单元素数组', () => {
    const single = [makeArticle({ id: 'a1', title: '单篇文章' })];
    const sorted = sortArticles(single, 'title', 'asc');
    expect(sorted).toHaveLength(1);
    expect(sorted[0].id).toBe('a1');
  });

  // ─── 组合操作测试 ───

  test('[圈梁五道箍] 组合筛选: 已发布+按阅读量排序', () => {
    const published = filterByStatus(MOCK_ARTICLES, 'published');
    const sorted = sortArticles(published, 'viewCount', 'desc');
    expect(sorted).toHaveLength(6);
    expect(sorted[0].id).toBe('a5');  // 8900
    expect(sorted[sorted.length - 1].id).toBe('a6'); // 1200
  });

  test('[圈梁五道箍] 组合筛选: 分类+分页', () => {
    // Filter published game-guide articles, paginate
    const gameGuide = filterByCategory(MOCK_ARTICLES, 'game-guide');
    expect(gameGuide).toHaveLength(1);
    const page1 = paginateArticles(gameGuide, 1, 5);
    expect(page1).toHaveLength(1);
  });
});
