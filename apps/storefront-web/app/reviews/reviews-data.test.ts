/**
 * reviews-data.test.ts — 评价展示数据层测试
 * B-页面: 面向C端用户的评价浏览
 * 覆盖: 类型常量、Mock数据完整性、评分统计、过滤/排序/分页、格式化函数
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

// ── 类型定义 ──

type ReviewTag = '环境好' | '服务好' | '价格优惠' | '产品好' | '体验好' | '位置方便' | '排队久' | '建议改善';
type Rating = 1 | 2 | 3 | 4 | 5;
type ReviewStatus = 'published' | 'hidden' | 'pending';

interface ReviewAuthor {
  userId: string;
  nickname: string;
  avatar?: string;
  memberTier?: string;
}

interface Review {
  reviewId: string;
  storeCode: string;
  storeName: string;
  rating: Rating;
  content: string;
  tags: ReviewTag[];
  author: ReviewAuthor;
  createdAt: string;
  status: ReviewStatus;
  images: string[];
  likes: number;
  reply?: string;
  repliedAt?: string;
  productName?: string;
}

interface RatingDistribution {
  rating: Rating;
  count: number;
  percentage: number;
}

interface ReviewStats {
  totalReviews: number;
  averageRating: number;
  distribution: RatingDistribution[];
  positiveRate: number;
  tagCloud: { tag: ReviewTag; count: number }[];
}

interface ReviewFilter {
  rating?: Rating;
  hasImages?: boolean;
  sortBy: 'latest' | 'highest' | 'lowest';
  page: number;
  pageSize: number;
}

// ── 常量 ──

const RATING_LABELS: Record<Rating, string> = { 1: '非常差', 2: '差', 3: '一般', 4: '好', 5: '非常好' };
const RATING_SHORT_LABELS: Record<Rating, string> = { 1: '很差', 2: '较差', 3: '一般', 4: '满意', 5: '非常满意' };
const SORT_LABELS: Record<string, string> = { latest: '最新', highest: '评分最高', lowest: '评分最低' };
const DEFAULT_PAGE_SIZE = 10;

const mockAuthors: ReviewAuthor[] = [
  { userId: 'u001', nickname: '健身达人小明', memberTier: 'GOLD' },
  { userId: 'u002', nickname: '跑步爱好者', memberTier: 'PLATINUM' },
  { userId: 'u003', nickname: '运动老李', memberTier: 'SILVER' },
  { userId: 'u004', nickname: '瑜伽女孩', memberTier: 'DIAMOND' },
  { userId: 'u005', nickname: '骑行小王', memberTier: 'GOLD' },
  { userId: 'u006', nickname: '游泳爱好者', memberTier: 'SILVER' },
  { userId: 'u007', nickname: '健身新手小白', memberTier: 'BRONZE' },
  { userId: 'u008', nickname: '运动达人张', memberTier: 'GOLD' },
];

const MOCK_REVIEWS: Review[] = [
  { reviewId: 'rev-001', storeCode: 'store-001', storeName: '旗舰店（国贸）', rating: 5, content: '环境非常好，器材种类齐全，教练很专业。', tags: ['环境好', '服务好', '产品好'], author: mockAuthors[0]!, createdAt: '2026-07-05T14:30:00Z', status: 'published', images: [], likes: 28, reply: '感谢您的支持！', repliedAt: '2026-07-06T09:00:00Z' },
  { reviewId: 'rev-002', storeCode: 'store-001', storeName: '旗舰店（国贸）', rating: 4, content: '位置很好找，地铁直达。', tags: ['环境好', '位置方便'], author: mockAuthors[1]!, createdAt: '2026-07-03T10:15:00Z', status: 'published', images: ['/img.jpg'], likes: 15 },
  { reviewId: 'rev-003', storeCode: 'store-001', storeName: '旗舰店（国贸）', rating: 3, content: '价格有点贵，设施还不错。', tags: ['环境好', '建议改善'], author: mockAuthors[2]!, createdAt: '2026-06-28T16:00:00Z', status: 'published', images: [], likes: 7, reply: '感谢建议', repliedAt: '2026-06-29T10:00:00Z' },
  { reviewId: 'rev-004', storeCode: 'store-002', storeName: '社区店（望京）', rating: 5, content: '家附近新开的店，环境干净整洁。', tags: ['环境好', '产品好', '体验好'], author: mockAuthors[3]!, createdAt: '2026-07-04T09:00:00Z', status: 'published', images: ['/img1.jpg', '/img2.jpg'], likes: 42 },
  { reviewId: 'rev-005', storeCode: 'store-002', storeName: '社区店（望京）', rating: 4, content: '工作人员很热情，服务周到。', tags: ['服务好', '价格优惠'], author: mockAuthors[4]!, createdAt: '2026-07-02T11:30:00Z', status: 'published', images: [], likes: 19, reply: '谢谢认可！', repliedAt: '2026-07-03T08:00:00Z' },
  { reviewId: 'rev-006', storeCode: 'store-002', storeName: '社区店（望京）', rating: 2, content: '周末人太多了，排队等了很久。', tags: ['排队久', '建议改善'], author: mockAuthors[5]!, createdAt: '2026-06-30T15:45:00Z', status: 'published', images: [], likes: 5 },
  { reviewId: 'rev-007', storeCode: 'store-003', storeName: '卫星店（中关村）', rating: 5, content: '非常适合上班族，就在写字楼下。', tags: ['体验好', '位置方便', '服务好'], author: mockAuthors[6]!, createdAt: '2026-07-06T12:00:00Z', status: 'published', images: [], likes: 33 },
  { reviewId: 'rev-008', storeCode: 'store-003', storeName: '卫星店（中关村）', rating: 4, content: '私教课程不错，教练很耐心。', tags: ['服务好', '产品好', '建议改善'], author: mockAuthors[7]!, createdAt: '2026-07-01T08:30:00Z', status: 'published', images: ['/img.jpg'], likes: 21, reply: '感谢反馈！', repliedAt: '2026-07-02T14:00:00Z' },
  { reviewId: 'rev-009', storeCode: 'store-004', storeName: '新店（通州万达）', rating: 4, content: '新开的店，设施都非常新。', tags: ['环境好', '价格优惠'], author: mockAuthors[2]!, createdAt: '2026-07-05T18:00:00Z', status: 'published', images: ['/img.jpg'], likes: 16 },
  { reviewId: 'rev-010', storeCode: 'store-004', storeName: '新店（通州万达）', rating: 3, content: '开业期间人特别多。', tags: ['排队久'], author: mockAuthors[4]!, createdAt: '2026-06-29T14:20:00Z', status: 'published', images: [], likes: 8 },
  { reviewId: 'rev-011', storeCode: 'store-001', storeName: '旗舰店（国贸）', rating: 1, content: '预约的私教课程临时被取消。', tags: ['服务好', '建议改善'], author: mockAuthors[5]!, createdAt: '2026-06-25T09:00:00Z', status: 'published', images: [], likes: 12, reply: '非常抱歉！', repliedAt: '2026-06-25T16:00:00Z' },
  { reviewId: 'rev-012', storeCode: 'store-001', storeName: '旗舰店（国贸）', rating: 5, content: '买了季卡，性价比很高。', tags: ['服务好', '价格优惠', '体验好'], author: mockAuthors[1]!, createdAt: '2026-06-22T20:00:00Z', status: 'published', images: [], likes: 45 },
];

// ── 辅助函数 ──

function computeRatingDistribution(reviews: Review[]): RatingDistribution[] {
  const counts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  const total = reviews.length;
  for (const r of reviews) counts[r.rating] = (counts[r.rating] ?? 0) + 1;
  return ([1, 2, 3, 4, 5] as Rating[]).map((rating) => ({
    rating,
    count: counts[rating] ?? 0,
    percentage: total > 0 ? Math.round(((counts[rating] ?? 0) / total) * 100) : 0,
  }));
}

function computeAverageRating(reviews: Review[]): number {
  if (reviews.length === 0) return 0;
  const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
  return Math.round((sum / reviews.length) * 10) / 10;
}

function computePositiveRate(reviews: Review[]): number {
  if (reviews.length === 0) return 0;
  const positive = reviews.filter((r) => r.rating >= 4).length;
  return Math.round((positive / reviews.length) * 100);
}

function computeTagCloud(reviews: Review[]): { tag: ReviewTag; count: number }[] {
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

function computeReviewStats(reviews: Review[]): ReviewStats {
  return {
    totalReviews: reviews.length,
    averageRating: computeAverageRating(reviews),
    distribution: computeRatingDistribution(reviews),
    positiveRate: computePositiveRate(reviews),
    tagCloud: computeTagCloud(reviews),
  };
}

function filterByStore(reviews: Review[], storeCode: string): Review[] {
  return reviews.filter((r) => r.storeCode === storeCode);
}

function filterByRating(reviews: Review[], rating: Rating): Review[] {
  return reviews.filter((r) => r.rating === rating);
}

function filterWithImages(reviews: Review[]): Review[] {
  return reviews.filter((r) => r.images.length > 0);
}

function sortReviews(reviews: Review[], sortBy: 'latest' | 'highest' | 'lowest'): Review[] {
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

function paginateReviews<T>(items: T[], page: number, pageSize: number): T[] {
  const start = (page - 1) * pageSize;
  return items.slice(start, start + pageSize);
}

function renderStars(rating: Rating): string {
  return '★'.repeat(rating) + '☆'.repeat(5 - rating);
}

function formatReviewTime(isoString: string): string {
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

// ============================================================
// 测试用例
// ============================================================

describe('ReviewsData - 常量验证', () => {
  it('RATING_LABELS 包含1-5分', () => {
    for (let i = 1; i <= 5; i++) {
      assert.ok(typeof RATING_LABELS[i as Rating] === 'string');
    }
  });

  it('SORT_LABELS 包含三种排序', () => {
    assert.ok(SORT_LABELS.latest);
    assert.ok(SORT_LABELS.highest);
    assert.ok(SORT_LABELS.lowest);
  });

  it('DEFAULT_PAGE_SIZE 为10', () => {
    assert.equal(DEFAULT_PAGE_SIZE, 10);
  });
});

describe('ReviewsData - Mock数据完整性', () => {
  it('MOCK_REVIEWS 有12条评价', () => {
    assert.equal(MOCK_REVIEWS.length, 12);
  });

  it('所有评价有必填字段', () => {
    for (const r of MOCK_REVIEWS) {
      assert.ok(r.reviewId, '缺少 reviewId');
      assert.ok(r.storeCode, '缺少 storeCode');
      assert.ok(r.rating >= 1 && r.rating <= 5, `rating 超出范围: ${r.rating}`);
      assert.ok(r.content.length > 0, '缺少 content');
      assert.ok(r.author.nickname, '缺少 nickname');
      assert.ok(['published', 'hidden', 'pending'].includes(r.status));
    }
  });

  it('评价 reviewerId 唯一', () => {
    const ids = MOCK_REVIEWS.map((r) => r.reviewId);
    assert.equal(new Set(ids).size, ids.length);
  });

  it('覆盖全部5种评分', () => {
    const ratings = new Set(MOCK_REVIEWS.map((r) => r.rating));
    for (let i = 1; i <= 5; i++) {
      assert.ok(ratings.has(i as Rating), `缺少 ${i} 分评价`);
    }
  });

  it('评价覆盖4个门店', () => {
    const stores = new Set(MOCK_REVIEWS.map((r) => r.storeCode));
    assert.equal(stores.size, 4);
  });

  it('部分评价有商家回复', () => {
    const hasReply = MOCK_REVIEWS.filter((r) => r.reply);
    assert.ok(hasReply.length >= 3);
  });
});

describe('ReviewsData - computeAverageRating()', () => {
  it('计算12条评价的平均分', () => {
    const avg = computeAverageRating(MOCK_REVIEWS);
    assert.equal(avg, 3.8); // (5+4+3+5+4+2+5+4+4+3+1+5) / 12 = 45/12 = 3.75 -> 3.8
  });

  it('空数组返回0', () => {
    assert.equal(computeAverageRating([]), 0);
  });

  it('单条评价返回该评分', () => {
    assert.equal(computeAverageRating([MOCK_REVIEWS[0]!]), 5);
  });

  it('全1分返回1', () => {
    const allOnes = MOCK_REVIEWS.map((r) => ({ ...r, rating: 1 as Rating }));
    assert.equal(computeAverageRating(allOnes), 1);
  });
});

describe('ReviewsData - computeRatingDistribution()', () => {
  it('分布总和等于总评价数', () => {
    const dist = computeRatingDistribution(MOCK_REVIEWS);
    const total = dist.reduce((s, d) => s + d.count, 0);
    assert.equal(total, MOCK_REVIEWS.length);
  });

  it('分布包含5个评分', () => {
    const dist = computeRatingDistribution(MOCK_REVIEWS);
    assert.equal(dist.length, 5);
  });

  it('比例总和为100%', () => {
    const dist = computeRatingDistribution(MOCK_REVIEWS);
    const totalPct = dist.reduce((s, d) => s + d.percentage, 0);
    // 可能有取整误差，允许100±1
    assert.ok(totalPct >= 99 && totalPct <= 101, `percentage sum: ${totalPct}`);
  });

  it('空数组全为0', () => {
    const dist = computeRatingDistribution([]);
    assert.ok(dist.every((d) => d.count === 0 && d.percentage === 0));
  });
});

describe('ReviewsData - computePositiveRate()', () => {
  it('12条评价中评分≥4的有8条', () => {
    // rating>=4: rev-001(5),002(4),004(5),005(4),007(5),008(4),009(4),012(5) = 8条
    assert.equal(computePositiveRate(MOCK_REVIEWS), 67); // 8/12=66.67 -> 67
  });

  it('空数组返回0', () => {
    assert.equal(computePositiveRate([]), 0);
  });
});

describe('ReviewsData - computeReviewStats()', () => {
  it('返回完整统计对象', () => {
    const stats = computeReviewStats(MOCK_REVIEWS);
    assert.equal(stats.totalReviews, 12);
    assert.ok(stats.averageRating > 0);
    assert.equal(stats.distribution.length, 5);
    assert.ok(stats.positiveRate > 0);
    assert.ok(stats.tagCloud.length > 0);
  });
});

describe('ReviewsData - filterByStore()', () => {
  it('筛选出门店对应评价', () => {
    const store001 = filterByStore(MOCK_REVIEWS, 'store-001');
    assert.equal(store001.length, 5); // rev-001,002,003,011,012
    assert.ok(store001.every((r) => r.storeCode === 'store-001'));
  });

  it('无评价门店返回空数组', () => {
    assert.equal(filterByStore(MOCK_REVIEWS, 'store-999').length, 0);
  });
});

describe('ReviewsData - filterByRating()', () => {
  it('筛选5分评价', () => {
    const fiveStar = filterByRating(MOCK_REVIEWS, 5);
    assert.equal(fiveStar.length, 4); // rev-001,004,007,012
    assert.ok(fiveStar.every((r) => r.rating === 5));
  });

  it('筛选1分评价', () => {
    const oneStar = filterByRating(MOCK_REVIEWS, 1);
    assert.equal(oneStar.length, 1);
  });
});

describe('ReviewsData - filterWithImages()', () => {
  it('筛选出有图的评价', () => {
    const withImages = filterWithImages(MOCK_REVIEWS);
    assert.equal(withImages.length, 4); // rev-002,004,008,009
    assert.ok(withImages.every((r) => r.images.length > 0));
  });
});

describe('ReviewsData - sortReviews()', () => {
  it('最新排序按时间降序', () => {
    const sorted = sortReviews(MOCK_REVIEWS, 'latest');
    for (let i = 1; i < sorted.length; i++) {
      assert.ok(new Date(sorted[i]!.createdAt).getTime() <= new Date(sorted[i - 1]!.createdAt).getTime());
    }
  });

  it('最高评分排序', () => {
    const sorted = sortReviews(MOCK_REVIEWS, 'highest');
    for (let i = 1; i < sorted.length; i++) {
      assert.ok(sorted[i]!.rating <= sorted[i - 1]!.rating);
    }
  });

  it('最低评分排序', () => {
    const sorted = sortReviews(MOCK_REVIEWS, 'lowest');
    for (let i = 1; i < sorted.length; i++) {
      assert.ok(sorted[i]!.rating >= sorted[i - 1]!.rating);
    }
  });
});

describe('ReviewsData - paginateReviews()', () => {
  it('第1页返回前pageSize条', () => {
    const p1 = paginateReviews(MOCK_REVIEWS, 1, 5);
    assert.equal(p1.length, 5);
    assert.equal(p1[0]?.reviewId, MOCK_REVIEWS[0]?.reviewId);
  });

  it('第2页返回第6-10条', () => {
    const p2 = paginateReviews(MOCK_REVIEWS, 2, 5);
    assert.equal(p2.length, 5);
    assert.equal(p2[0]?.reviewId, MOCK_REVIEWS[5]?.reviewId);
  });

  it('最后一页返回剩余', () => {
    const p3 = paginateReviews(MOCK_REVIEWS, 3, 5);
    assert.equal(p3.length, 2); // 12条，第3页剩2条
  });

  it('超出范围的页码返回空', () => {
    assert.equal(paginateReviews(MOCK_REVIEWS, 100, 10).length, 0);
  });
});

describe('ReviewsData - renderStars()', () => {
  it('5分返回5颗实星', () => {
    assert.equal(renderStars(5), '★★★★★');
  });

  it('3分返回3实2空', () => {
    assert.equal(renderStars(3), '★★★☆☆');
  });

  it('1分返回1实4空', () => {
    assert.equal(renderStars(1), '★☆☆☆☆');
  });

  it('长度为5', () => {
    for (let i = 1; i <= 5; i++) {
      assert.equal(renderStars(i as Rating).length, 5);
    }
  });
});

describe('ReviewsData - formatReviewTime()', () => {
  it('无效日期原样返回', () => {
    assert.equal(formatReviewTime(''), '');
    assert.equal(formatReviewTime('xyz'), 'xyz');
  });

  it('过去较久的时间返回"X月X日"格式', () => {
    // 30天前应该返回月日格式
    const past = new Date(Date.now() - 30 * 86400 * 1000);
    const result = formatReviewTime(past.toISOString());
    assert.ok(result.includes('月'), `结果为: ${result}`);
    assert.ok(result.includes('日'), `结果为: ${result}`);
  });

  it('稍早时间返回"X分钟前"', () => {
    const d = new Date(Date.now() - 5 * 60 * 1000); // 5分钟前
    const result = formatReviewTime(d.toISOString());
    assert.equal(result, '5分钟前');
  });

  it('几小时前返回"X小时前"', () => {
    const d = new Date(Date.now() - 3 * 3600 * 1000); // 3小时前
    const result = formatReviewTime(d.toISOString());
    assert.equal(result, '3小时前');
  });
});
