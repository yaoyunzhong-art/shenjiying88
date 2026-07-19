/**
 * 书架页面 Bookshelf — storefront-web 知识库
 * 角色视角: 👔顾客 · 👤前台
 * 功能: 文章列表、分类筛选、搜索、热门推荐
 */

import { Suspense } from 'react';
import { LoadingSkeleton, PageShell, ErrorBoundary } from '@m5/ui';
import BookshelfClient from './bookshelf-client';

/** 文章分类 */
export type ArticleCategory =
  | 'game-guide'
  | 'device-tutorial'
  | 'promotion'
  | 'faq'
  | 'policy'
  | 'news'
  | 'other';

/** 文章状态 */
export type ArticleStatus = 'published' | 'draft' | 'archived';

/** 单篇文章快照 */
export interface ArticleSnapshot {
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

/** 书架数据快照 */
export interface BookshelfSnapshot {
  articles: ArticleSnapshot[];
  categories: ArticleCategory[];
  totalArticles: number;
  totalViews: number;
  hotTags: string[];
  recommendedArticles: ArticleSnapshot[];
}

/** 分类标签映射 */
export const CATEGORY_LABELS: Record<ArticleCategory, string> = {
  'game-guide': '游玩攻略',
  'device-tutorial': '设备教程',
  promotion: '优惠活动',
  faq: '常见问题',
  policy: '门店政策',
  news: '门店动态',
  other: '其他',
};

/** 状态标签映射 */
export const STATUS_LABELS: Record<ArticleStatus, string> = {
  published: '已发布',
  draft: '草稿',
  archived: '已归档',
};

/** 默认书架数据（fallback） */
export function getDefaultBookshelfSnapshot(): BookshelfSnapshot {
  return {
    categories: ['game-guide', 'device-tutorial', 'promotion', 'faq', 'policy', 'news'],
    hotTags: ['新手入门', 'VR 体验', '会员福利', '周末活动', '门店公告'],
    totalArticles: 48,
    totalViews: 28500,
    recommendedArticles: [
      {
        id: 'rec-1',
        title: 'VR 游戏新手入门指南',
        category: 'game-guide',
        summary: '第一次玩 VR 不知道从哪开始？这篇指南带你快速上手。',
        author: '小爽',
        status: 'published',
        viewCount: 3200,
        likeCount: 186,
        publishedAt: '2026-07-10',
        updatedAt: '2026-07-10',
        tags: ['新手入门', 'VR 体验'],
      },
      {
        id: 'rec-2',
        title: '暑期特惠活动',
        category: 'promotion',
        summary: '暑期特惠季，全场 8 折起，新用户额外赠送 2 次体验。',
        author: '市场部',
        status: 'published',
        viewCount: 5600,
        likeCount: 420,
        publishedAt: '2026-07-01',
        updatedAt: '2026-07-05',
        tags: ['会员福利', '暑期活动'],
      },
      {
        id: 'rec-3',
        title: '如何正确佩戴 VR 头显',
        category: 'device-tutorial',
        summary: '正确的佩戴方式可以提升沉浸感并减少晕动症。',
        author: '技术部',
        status: 'published',
        viewCount: 1800,
        likeCount: 95,
        publishedAt: '2026-06-20',
        updatedAt: '2026-06-20',
        tags: ['VR 体验', '设备指南'],
      },
    ],
    articles: [
      {
        id: 'a1',
        title: 'VR 游戏新手入门指南',
        category: 'game-guide',
        summary: '第一次玩 VR 不知道从哪开始？这篇指南带你快速上手。',
        author: '小爽',
        status: 'published',
        viewCount: 3200,
        likeCount: 186,
        publishedAt: '2026-07-10',
        updatedAt: '2026-07-10',
        tags: ['新手入门', 'VR 体验'],
      },
      {
        id: 'a2',
        title: '暑期特惠活动',
        category: 'promotion',
        summary: '暑期特惠季，全场 8 折起，新用户额外赠送 2 次体验。',
        author: '市场部',
        status: 'published',
        viewCount: 5600,
        likeCount: 420,
        publishedAt: '2026-07-01',
        updatedAt: '2026-07-05',
        tags: ['会员福利', '暑期活动'],
      },
      {
        id: 'a3',
        title: '如何正确佩戴 VR 头显',
        category: 'device-tutorial',
        summary: '正确的佩戴方式可以提升沉浸感并减少晕动症。',
        author: '技术部',
        status: 'published',
        viewCount: 1800,
        likeCount: 95,
        publishedAt: '2026-06-20',
        updatedAt: '2026-06-20',
        tags: ['VR 体验', '设备指南'],
      },
      {
        id: 'a4',
        title: '会员积分怎么用？',
        category: 'faq',
        summary: '会员积分兑换规则与常见问题汇总。',
        author: '客服部',
        status: 'published',
        viewCount: 4500,
        likeCount: 310,
        publishedAt: '2026-06-15',
        updatedAt: '2026-06-18',
        tags: ['会员福利'],
      },
      {
        id: 'a5',
        title: '门店营业时间调整通知',
        category: 'policy',
        summary: '自 7 月起，门店营业时间调整为 10:00-22:00。',
        author: '行政部',
        status: 'published',
        viewCount: 8900,
        likeCount: 67,
        publishedAt: '2026-06-28',
        updatedAt: '2026-06-28',
        tags: ['门店公告'],
      },
      {
        id: 'a6',
        title: '周末亲子活动预告',
        category: 'news',
        summary: '本周末将举办亲子 VR 竞赛活动，欢迎报名参加。',
        author: '市场部',
        status: 'published',
        viewCount: 1200,
        likeCount: 88,
        publishedAt: '2026-07-12',
        updatedAt: '2026-07-12',
        tags: ['周末活动', '亲子'],
      },
      {
        id: 'a7',
        title: 'Draft: 秋季活动策划方案',
        category: 'other',
        summary: '秋季活动初步方案（内部讨论中）',
        author: '市场部',
        status: 'draft',
        viewCount: 0,
        likeCount: 0,
        publishedAt: '',
        updatedAt: '2026-07-08',
        tags: [],
      },
      {
        id: 'a8',
        title: '旧版会员政策（已归档）',
        category: 'policy',
        summary: '2025 版会员政策，仅作历史参考。',
        author: '行政部',
        status: 'archived',
        viewCount: 300,
        likeCount: 12,
        publishedAt: '2025-06-01',
        updatedAt: '2026-01-01',
        tags: ['会员福利'],
      },
    ],
  };
}

/** 按分类筛选文章 */
export function filterByCategory(
  articles: ArticleSnapshot[],
  category: ArticleCategory | 'ALL',
): ArticleSnapshot[] {
  return category === 'ALL' ? articles : articles.filter((a) => a.category === category);
}

/** 按搜索词匹配文章（标题/摘要/作者/标签） */
export function searchArticles(
  articles: ArticleSnapshot[],
  term: string,
): ArticleSnapshot[] {
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

/** 按状态过滤文章 */
export function filterByStatus(
  articles: ArticleSnapshot[],
  status: ArticleStatus | 'ALL',
): ArticleSnapshot[] {
  return status === 'ALL' ? articles : articles.filter((a) => a.status === status);
}

/** 统计 */
export function computeArticleStats(articles: ArticleSnapshot[]) {
  const published = articles.filter((a) => a.status === 'published').length;
  const categories = new Set(articles.map((a) => a.category)).size;
  const totalViews = articles.reduce((s, a) => s + a.viewCount, 0);
  const totalLikes = articles.reduce((s, a) => s + a.likeCount, 0);
  return { total: articles.length, published, categories, totalViews, totalLikes };
}

/** 分页 */
export function paginateArticles<T>(items: T[], page: number, pageSize: number): T[] {
  if (page < 1 || pageSize < 1) return [];
  return items.slice((page - 1) * pageSize, page * pageSize);
}

/** 排序 */
export function sortArticles(
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

/** 异步加载数据 */
async function loadBookshelfSnapshot(): Promise<BookshelfSnapshot> {
  return getDefaultBookshelfSnapshot();
}

export default async function BookshelfPage() {
  const data = await loadBookshelfSnapshot();

  return (
    <ErrorBoundary>
      <main style={{ maxWidth: 1200, margin: '0 auto', padding: 32 }}>
        <PageShell title="📚 书架" subtitle="游玩攻略·设备教程·优惠活动·常见问题">
          <Suspense fallback={<LoadingSkeleton variant="card" rows={8} label="加载书架..." />}>
            <BookshelfClient data={data} />
          </Suspense>
        </PageShell>
      </main>
    </ErrorBoundary>
  );
}

export const dynamic = 'force-dynamic';
export const revalidate = 0;
