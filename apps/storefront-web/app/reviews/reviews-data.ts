/**
 * 评价展示 — reviews-data.ts
 * B-页面: 面向C端用户的门店/产品评价展示
 *
 * 功能: 展示门店和产品的用户评价，按评分/时间排序，统计评分分布
 * 角色: 🛒 前台消费者视角 — 浏览评价、查看评分趋势
 *
 * 数据模型: Review (单条评价)、ReviewStats (评分统计)、
 *           ReviewFilter (筛选条件)、StoreReviewSummary (门店评价汇总)
 */

// ============================================================
// 类型定义
// ============================================================

/** 评价标签 */
export type ReviewTag = '环境好' | '服务好' | '价格优惠' | '产品好' | '体验好' | '位置方便' | '排队久' | '建议改善';

/** 评分等级 1-5 */
export type Rating = 1 | 2 | 3 | 4 | 5;

/** 评价状态 */
export type ReviewStatus = 'published' | 'hidden' | 'pending';

/** 评价者信息 */
export interface ReviewAuthor {
  /** 用户ID */
  userId: string;
  /** 用户昵称 */
  nickname: string;
  /** 头像URL */
  avatar?: string;
  /** 会员等级 */
  memberTier?: string;
}

/** 单条评价 */
export interface Review {
  /** 评价ID */
  reviewId: string;
  /** 门店Code */
  storeCode: string;
  /** 门店名称 */
  storeName: string;
  /** 评分 */
  rating: Rating;
  /** 评价内容 */
  content: string;
  /** 评价标签 */
  tags: ReviewTag[];
  /** 评价者 */
  author: ReviewAuthor;
  /** 评价时间 ISO */
  createdAt: string;
  /** 评价状态 */
  status: ReviewStatus;
  /** 图片URL列表 */
  images: string[];
  /** 点赞数 */
  likes: number;
  /** 回复内容 */
  reply?: string;
  /** 回复时间 */
  repliedAt?: string;
  /** 关联产品名称 */
  productName?: string;
}

/** 评分分布 */
export interface RatingDistribution {
  /** 评分 1-5 */
  rating: Rating;
  /** 该评分数量 */
  count: number;
  /** 占比（百分比） */
  percentage: number;
}

/** 评价统计 */
export interface ReviewStats {
  /** 总评价数 */
  totalReviews: number;
  /** 平均评分 */
  averageRating: number;
  /** 各评分分布 */
  distribution: RatingDistribution[];
  /** 好评率（评分≥4的占比） */
  positiveRate: number;
  /** 标签云 */
  tagCloud: { tag: ReviewTag; count: number }[];
}

/** 筛选条件 */
export interface ReviewFilter {
  /** 评分筛选 */
  rating?: Rating;
  /** 是否只显示有图 */
  hasImages?: boolean;
  /** 排序方式 */
  sortBy: 'latest' | 'highest' | 'lowest';
  /** 页码 */
  page: number;
  /** 每页条数 */
  pageSize: number;
}

/** 门店评价汇总 */
export interface StoreReviewSummary {
  /** 门店Code */
  storeCode: string;
  /** 门店名称 */
  storeName: string;
  /** 整体评分 */
  overallRating: number;
  /** 总评价数 */
  totalReviews: number;
  /** 评分统计 */
  stats: ReviewStats;
  /** 最新N条评价 */
  recentReviews: Review[];
}

// ============================================================
// 常量
// ============================================================

/** 评分等级中文标签 */
export const RATING_LABELS: Record<Rating, string> = {
  1: '非常差',
  2: '差',
  3: '一般',
  4: '好',
  5: '非常好',
};

/** 评分等级简要标签 */
export const RATING_SHORT_LABELS: Record<Rating, string> = {
  1: '很差',
  2: '较差',
  3: '一般',
  4: '满意',
  5: '非常满意',
};

/** 排序方式中文 */
export const SORT_LABELS: Record<string, string> = {
  latest: '最新',
  highest: '评分最高',
  lowest: '评分最低',
};

/** 默认每页条数 */
export const DEFAULT_PAGE_SIZE = 10;

// ============================================================
// Mock 评价数据
// ============================================================

const mockAuthors: ReviewAuthor[] = [
  { userId: 'u001', nickname: '健身达人小明', avatar: '', memberTier: 'GOLD' },
  { userId: 'u002', nickname: '跑步爱好者', avatar: '', memberTier: 'PLATINUM' },
  { userId: 'u003', nickname: '运动老李', avatar: '', memberTier: 'SILVER' },
  { userId: 'u004', nickname: '瑜伽女孩', avatar: '', memberTier: 'DIAMOND' },
  { userId: 'u005', nickname: '骑行小王', avatar: '', memberTier: 'GOLD' },
  { userId: 'u006', nickname: '游泳爱好者', avatar: '', memberTier: 'SILVER' },
  { userId: 'u007', nickname: '健身新手小白', avatar: '', memberTier: 'BRONZE' },
  { userId: 'u008', nickname: '运动达人张', avatar: '', memberTier: 'GOLD' },
];

export const MOCK_REVIEWS: Review[] = [
  {
    reviewId: 'rev-001',
    storeCode: 'store-001',
    storeName: '旗舰店（国贸）',
    rating: 5,
    content: '环境非常好，器材种类齐全，教练很专业。已经在这里锻炼半年了，强烈推荐！',
    tags: ['环境好', '服务好', '产品好'],
    author: mockAuthors[0]!,
    createdAt: '2026-07-05T14:30:00Z',
    status: 'published',
    images: [],
    likes: 28,
    reply: '感谢您的支持！我们会继续保持优质服务！',
    repliedAt: '2026-07-06T09:00:00Z',
  },
  {
    reviewId: 'rev-002',
    storeCode: 'store-001',
    storeName: '旗舰店（国贸）',
    rating: 4,
    content: '位置很好找，地铁直达。设施维护得不错，就是高峰时段人有点多。',
    tags: ['环境好', '位置方便'],
    author: mockAuthors[1]!,
    createdAt: '2026-07-03T10:15:00Z',
    status: 'published',
    images: ['/images/reviews/rev-002-1.jpg'],
    likes: 15,
  },
  {
    reviewId: 'rev-003',
    storeCode: 'store-001',
    storeName: '旗舰店（国贸）',
    rating: 3,
    content: '价格有点贵，设施还不错。更衣室的储物柜不够用，希望能改进。',
    tags: ['环境好', '建议改善'],
    author: mockAuthors[2]!,
    createdAt: '2026-06-28T16:00:00Z',
    status: 'published',
    images: [],
    likes: 7,
    reply: '感谢您的建议，我们正在增加储物柜数量。',
    repliedAt: '2026-06-29T10:00:00Z',
  },
  {
    reviewId: 'rev-004',
    storeCode: 'store-002',
    storeName: '社区店（望京）',
    rating: 5,
    content: '家附近新开的店，环境干净整洁，课程种类丰富。特别喜欢他们的瑜伽课！',
    tags: ['环境好', '产品好', '体验好'],
    author: mockAuthors[3]!,
    createdAt: '2026-07-04T09:00:00Z',
    status: 'published',
    images: ['/images/reviews/rev-004-1.jpg', '/images/reviews/rev-004-2.jpg'],
    likes: 42,
  },
  {
    reviewId: 'rev-005',
    storeCode: 'store-002',
    storeName: '社区店（望京）',
    rating: 4,
    content: '工作人员很热情，服务周到。价格也合理，性价比不错。',
    tags: ['服务好', '价格优惠'],
    author: mockAuthors[4]!,
    createdAt: '2026-07-02T11:30:00Z',
    status: 'published',
    images: [],
    likes: 19,
    reply: '谢谢认可！我们会继续努力！',
    repliedAt: '2026-07-03T08:00:00Z',
  },
  {
    reviewId: 'rev-006',
    storeCode: 'store-002',
    storeName: '社区店（望京）',
    rating: 2,
    content: '周末人太多了，排队等了很久。更衣室卫生也需要改进。',
    tags: ['排队久', '建议改善'],
    author: mockAuthors[5]!,
    createdAt: '2026-06-30T15:45:00Z',
    status: 'published',
    images: [],
    likes: 5,
  },
  {
    reviewId: 'rev-007',
    storeCode: 'store-003',
    storeName: '卫星店（中关村）',
    rating: 5,
    content: '非常适合上班族，就在写字楼下。午休时间来锻炼很方便！',
    tags: ['体验好', '位置方便', '服务好'],
    author: mockAuthors[6]!,
    createdAt: '2026-07-06T12:00:00Z',
    status: 'published',
    images: [],
    likes: 33,
  },
  {
    reviewId: 'rev-008',
    storeCode: 'store-003',
    storeName: '卫星店（中关村）',
    rating: 4,
    content: '私教课程不错，教练很耐心。就是器械种类相对少了一些。',
    tags: ['服务好', '产品好', '建议改善'],
    author: mockAuthors[7]!,
    createdAt: '2026-07-01T08:30:00Z',
    status: 'published',
    images: ['/images/reviews/rev-008-1.jpg'],
    likes: 21,
    reply: '感谢反馈！我们正在扩充器械种类。',
    repliedAt: '2026-07-02T14:00:00Z',
  },
  {
    reviewId: 'rev-009',
    storeCode: 'store-004',
    storeName: '新店（通州万达）',
    rating: 4,
    content: '新开的店，设施都非常新。价格也比较优惠，开业活动很给力。',
    tags: ['环境好', '价格优惠'],
    author: mockAuthors[2]!,
    createdAt: '2026-07-05T18:00:00Z',
    status: 'published',
    images: ['/images/reviews/rev-009-1.jpg'],
    likes: 16,
  },
  {
    reviewId: 'rev-010',
    storeCode: 'store-004',
    storeName: '新店（通州万达）',
    rating: 3,
    content: '开业期间人特别多，体验稍微差了一点。等热度过了再来。',
    tags: ['排队久'],
    author: mockAuthors[4]!,
    createdAt: '2026-06-29T14:20:00Z',
    status: 'published',
    images: [],
    likes: 8,
  },
  {
    reviewId: 'rev-011',
    storeCode: 'store-001',
    storeName: '旗舰店（国贸）',
    rating: 1,
    content: '预约的私教课程临时被取消，非常失望。希望能改进管理。',
    tags: ['服务好', '建议改善'],
    author: mockAuthors[5]!,
    createdAt: '2026-06-25T09:00:00Z',
    status: 'published',
    images: [],
    likes: 12,
    reply: '非常抱歉给您带来不好的体验，我们会加强管理。',
    repliedAt: '2026-06-25T16:00:00Z',
  },
  {
    reviewId: 'rev-012',
    storeCode: 'store-001',
    storeName: '旗舰店（国贸）',
    rating: 5,
    content: '买了季卡，性价比很高。还经常组织会员活动，氛围很好！',
    tags: ['服务好', '价格优惠', '体验好'],
    author: mockAuthors[1]!,
    createdAt: '2026-06-22T20:00:00Z',
    status: 'published',
    images: [],
    likes: 45,
  },
];

// ============================================================
// 辅助函数
// ============================================================

/** 计算评分分布 */
export function computeRatingDistribution(reviews: Review[]): RatingDistribution[] {
  const counts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  const total = reviews.length;

  for (const r of reviews) {
    counts[r.rating] = (counts[r.rating] ?? 0) + 1;
  }

  return ([1, 2, 3, 4, 5] as Rating[]).map((rating) => ({
    rating,
    count: counts[rating] ?? 0,
    percentage: total > 0 ? Math.round(((counts[rating] ?? 0) / total) * 100) : 0,
  }));
}

/** 计算总平均评分 */
export function computeAverageRating(reviews: Review[]): number {
  if (reviews.length === 0) return 0;
  const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
  return Math.round((sum / reviews.length) * 10) / 10;
}

/** 计算好评率（评分≥4的占比） */
export function computePositiveRate(reviews: Review[]): number {
  if (reviews.length === 0) return 0;
  const positive = reviews.filter((r) => r.rating >= 4).length;
  return Math.round((positive / reviews.length) * 100);
}

/** 生成标签云 */
export function computeTagCloud(reviews: Review[]): { tag: ReviewTag; count: number }[] {
  const tagCounts: Record<string, number> = {};
  for (const r of reviews) {
    for (const tag of r.tags) {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1;
    }
  }
  return Object.entries(tagCounts)
    .map(([tag, count]) => ({ tag: tag as ReviewTag, count }))
    .sort((a, b) => b.count - a.count);
}

/** 计算评价统计 */
export function computeReviewStats(reviews: Review[]): ReviewStats {
  return {
    totalReviews: reviews.length,
    averageRating: computeAverageRating(reviews),
    distribution: computeRatingDistribution(reviews),
    positiveRate: computePositiveRate(reviews),
    tagCloud: computeTagCloud(reviews),
  };
}

/** 根据门店Code筛选评价 */
export function filterByStore(reviews: Review[], storeCode: string): Review[] {
  return reviews.filter((r) => r.storeCode === storeCode);
}

/** 根据评分筛选 */
export function filterByRating(reviews: Review[], rating: Rating): Review[] {
  return reviews.filter((r) => r.rating === rating);
}

/** 筛选有图的评价 */
export function filterWithImages(reviews: Review[]): Review[] {
  return reviews.filter((r) => r.images.length > 0);
}

/** 按排序方式排列 */
export function sortReviews(reviews: Review[], sortBy: 'latest' | 'highest' | 'lowest'): Review[] {
  const sorted = [...reviews];
  switch (sortBy) {
    case 'latest':
      sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      break;
    case 'highest':
      sorted.sort((a, b) => b.rating - a.rating);
      break;
    case 'lowest':
      sorted.sort((a, b) => a.rating - b.rating);
      break;
  }
  return sorted;
}

/** 分页 */
export function paginateReviews<T>(items: T[], page: number, pageSize: number): T[] {
  const start = (page - 1) * pageSize;
  return items.slice(start, start + pageSize);
}

/** 生成星级显示文本（如 ★★★★★） */
export function renderStars(rating: Rating): string {
  return '★'.repeat(rating) + '☆'.repeat(5 - rating);
}

/** 格式化评价时间，显示相对时间或绝对时间 */
export function formatReviewTime(isoString: string): string {
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return isoString;

  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHour = Math.floor(diffMs / 3600000);
  const diffDay = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return '刚刚';
  if (diffMin < 60) return `${diffMin}分钟前`;
  if (diffHour < 24) return `${diffHour}小时前`;
  if (diffDay < 7) return `${diffDay}天前`;

  const month = d.getMonth() + 1;
  const day = d.getDate();
  return `${month}月${day}日`;
}

/** 构建门店评价汇总 */
export function buildStoreReviewSummary(reviews: Review[], storeCode: string): StoreReviewSummary | null {
  const storeReviews = filterByStore(reviews, storeCode);
  if (storeReviews.length === 0) return null;

  const first = storeReviews[0]!;
  return {
    storeCode,
    storeName: first.storeName,
    overallRating: computeAverageRating(storeReviews),
    totalReviews: storeReviews.length,
    stats: computeReviewStats(storeReviews),
    recentReviews: sortReviews(storeReviews, 'latest').slice(0, 3),
  };
}
