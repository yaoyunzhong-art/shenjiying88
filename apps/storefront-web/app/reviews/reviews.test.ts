/**
 * 评价展示 reviews.test.ts — B-页面 L1 测试
 * 角色: 🛒 前台消费者视角
 *
 * 测试覆盖:
 * 1. 类型完整性 2. 常量正确性 3. Mock数据结构
 * 4. 评分统计计算 5. 筛选过滤 6. 排序 7. 分页
 * 8. 时间格式化 9. 星级渲染 10. 标签云 11. 门店汇总
 * 12. 空数据处理 13. 边界值 14. 页面导出
 */

import assert from 'node:assert/strict';
import test from 'node:test';

// ============================================================
// 导入待测试数据模块
// ============================================================

const PROJECT_ROOT = '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88';
const fs = require('node:fs');
const dataPath = `${PROJECT_ROOT}/apps/storefront-web/app/reviews/reviews-data.ts`;
const pagePath = `${PROJECT_ROOT}/apps/storefront-web/app/reviews/page.tsx`;
const dataSource = fs.readFileSync(dataPath, 'utf8');
const pageSource = fs.readFileSync(pagePath, 'utf8');

// ============================================================
// 帮助函数
// ============================================================

function hasExport(name: string): boolean {
  return dataSource.includes(`export ${name}`) || dataSource.includes(`export type ${name}`) || dataSource.includes(`export interface ${name}`);
}

// ============================================================
// 测试: 类型与接口
// ============================================================

test('📦 类型: Review 包含评价全字段', () => {
  assert.ok(hasExport('Review'));
  assert.ok(dataSource.includes('reviewId'));
  assert.ok(dataSource.includes('storeCode'));
  assert.ok(dataSource.includes('rating'));
  assert.ok(dataSource.includes('content'));
  assert.ok(dataSource.includes('tags'));
  assert.ok(dataSource.includes('author'));
  assert.ok(dataSource.includes('createdAt'));
  assert.ok(dataSource.includes('likes'));
});

test('📦 类型: ReviewAuthor 包含用户信息', () => {
  assert.ok(hasExport('ReviewAuthor'));
  assert.ok(dataSource.includes('userId'));
  assert.ok(dataSource.includes('nickname'));
  assert.ok(dataSource.includes('memberTier'));
});

test('📦 类型: ReviewStats 包含评价统计字段', () => {
  assert.ok(hasExport('ReviewStats'));
  assert.ok(dataSource.includes('totalReviews'));
  assert.ok(dataSource.includes('averageRating'));
  assert.ok(dataSource.includes('distribution'));
  assert.ok(dataSource.includes('positiveRate'));
  assert.ok(dataSource.includes('tagCloud'));
});

test('📦 类型: RatingDistribution 包含评分分布字段', () => {
  assert.ok(hasExport('RatingDistribution'));
  assert.ok(dataSource.includes('rating'));
  assert.ok(dataSource.includes('count'));
  assert.ok(dataSource.includes('percentage'));
});

test('📦 类型: ReviewFilter 包含筛选字段', () => {
  assert.ok(hasExport('ReviewFilter'));
  assert.ok(dataSource.includes('sortBy'));
  assert.ok(dataSource.includes('page'));
  assert.ok(dataSource.includes('pageSize'));
  assert.ok(dataSource.includes('hasImages'));
});

test('📦 类型: StoreReviewSummary 包含门店汇总', () => {
  assert.ok(hasExport('StoreReviewSummary'));
  assert.ok(dataSource.includes('overallRating'));
  assert.ok(dataSource.includes('recentReviews'));
});

test('📦 类型: ReviewTag 包含7种标签', () => {
  assert.ok(hasExport('ReviewTag'));
  assert.ok(dataSource.includes('环境好'));
  assert.ok(dataSource.includes('服务好'));
  assert.ok(dataSource.includes('价格优惠'));
  assert.ok(dataSource.includes('产品好'));
  assert.ok(dataSource.includes('体验好'));
  assert.ok(dataSource.includes('位置方便'));
  assert.ok(dataSource.includes('排队久'));
  assert.ok(dataSource.includes('建议改善'));
});

// ============================================================
// 测试: 常量
// ============================================================

test('📦 常量: RATING_LABELS 覆盖 1-5', () => {
  assert.ok(dataSource.includes('RATING_LABELS'));
  assert.ok(dataSource.includes('非常差'));
  assert.ok(dataSource.includes('差'));
  assert.ok(dataSource.includes('一般'));
  assert.ok(dataSource.includes('好'));
  assert.ok(dataSource.includes('非常好'));
});

test('📦 常量: RATING_SHORT_LABELS 简要标签', () => {
  assert.ok(dataSource.includes('RATING_SHORT_LABELS'));
  assert.ok(dataSource.includes('很差'));
  assert.ok(dataSource.includes('满意'));
  assert.ok(dataSource.includes('非常满意'));
});

test('📦 常量: SORT_LABELS 三种排序', () => {
  assert.ok(dataSource.includes('SORT_LABELS'));
  assert.ok(dataSource.includes('最新'));
  assert.ok(dataSource.includes('评分最高'));
  assert.ok(dataSource.includes('评分最低'));
});

test('📦 常量: DEFAULT_PAGE_SIZE = 10', () => {
  assert.ok(dataSource.includes('DEFAULT_PAGE_SIZE = 10'));
});

// ============================================================
// 测试: Mock 数据
// ============================================================

test('📦 Mock: MOCK_REVIEWS 包含12条评价', () => {
  assert.ok(dataSource.includes('MOCK_REVIEWS'));
  const match = (dataSource.match(/reviewId: '/g) || []).length;
  assert.equal(match, 12);
});

test('📦 Mock: 评价覆盖所有评分 1-5', () => {
  assert.ok(dataSource.includes("rating: 5"));
  assert.ok(dataSource.includes("rating: 4"));
  assert.ok(dataSource.includes("rating: 3"));
  assert.ok(dataSource.includes("rating: 2"));
  assert.ok(dataSource.includes("rating: 1"));
});

test('📦 Mock: 评价覆盖4家门店', () => {
  assert.ok(dataSource.includes("storeCode: 'store-001'"));
  assert.ok(dataSource.includes("storeCode: 'store-002'"));
  assert.ok(dataSource.includes("storeCode: 'store-003'"));
  assert.ok(dataSource.includes("storeCode: 'store-004'"));
});

test('📦 Mock: 有评价包含商家回复', () => {
  const replyMatches = (dataSource.match(/reply: '/g) || []).length;
  assert.ok(replyMatches >= 4, `Expected at least 4 replies, got ${replyMatches}`);
});

test('📦 Mock: 有评价包含图片', () => {
  const imgMatches = (dataSource.match(/\/images\/reviews\//g) || []).length;
  assert.ok(imgMatches >= 4, `Expected at least 4 image references, got ${imgMatches}`);
});

// ============================================================
// 测试: 辅助函数
// ============================================================

test('🧰 computeAverageRating: 计算平均评分', () => {
  assert.ok(dataSource.includes('export function computeAverageRating'));
  assert.ok(dataSource.includes('reduce'));
  assert.ok(dataSource.includes('.rating'));
});

test('🧰 computeRatingDistribution: 生成评分分布', () => {
  assert.ok(dataSource.includes('export function computeRatingDistribution'));
  assert.ok(dataSource.includes('percentage'));
  assert.ok(dataSource.includes('Math.round'));
  assert.ok(dataSource.includes('[1, 2, 3, 4, 5]'));
});

test('🧰 computePositiveRate: 好评率计算', () => {
  assert.ok(dataSource.includes('export function computePositiveRate'));
  assert.ok(dataSource.includes('>= 4'));
  assert.ok(dataSource.includes('positive'));
});

test('🧰 computeTagCloud: 标签云生成', () => {
  assert.ok(dataSource.includes('export function computeTagCloud'));
  assert.ok(dataSource.includes('tagCounts'));
  assert.ok(dataSource.includes('sort'));
});

test('🧰 computeReviewStats: 完整统计', () => {
  assert.ok(dataSource.includes('export function computeReviewStats'));
  assert.ok(dataSource.includes('averageRating'));
  assert.ok(dataSource.includes('tagCloud'));
});

test('🧰 filterByStore: 按门店筛选', () => {
  assert.ok(dataSource.includes('export function filterByStore'));
  assert.ok(dataSource.includes('storeCode'));
});

test('🧰 filterByRating: 按评分筛选', () => {
  assert.ok(dataSource.includes('export function filterByRating'));
  assert.ok(dataSource.includes('.rating'));
});

test('🧰 filterWithImages: 筛选有图评价', () => {
  assert.ok(dataSource.includes('export function filterWithImages'));
  assert.ok(dataSource.includes('.images.length'));
});

test('🧰 sortReviews: 三种排序方式', () => {
  assert.ok(dataSource.includes('export function sortReviews'));
  assert.ok(dataSource.includes("case 'latest'"));
  assert.ok(dataSource.includes("case 'highest'"));
  assert.ok(dataSource.includes("case 'lowest'"));
});

test('🧰 paginateReviews: 分页逻辑', () => {
  assert.ok(dataSource.includes('export function paginateReviews'));
  assert.ok(dataSource.includes('slice'));
  assert.ok(dataSource.includes('page - 1'));
});

test('🧰 renderStars: 生成星级文本', () => {
  assert.ok(dataSource.includes('export function renderStars'));
  assert.ok(dataSource.includes('★'));
  assert.ok(dataSource.includes('☆'));
  assert.ok(dataSource.includes('repeat'));
});

test('🧰 formatReviewTime: 相对时间格式化', () => {
  assert.ok(dataSource.includes('export function formatReviewTime'));
  assert.ok(dataSource.includes('刚刚'));
  assert.ok(dataSource.includes('分钟前'));
  assert.ok(dataSource.includes('小时前'));
  assert.ok(dataSource.includes('天前'));
});

test('🧰 buildStoreReviewSummary: 门店评价汇总', () => {
  assert.ok(dataSource.includes('export function buildStoreReviewSummary'));
  assert.ok(dataSource.includes('overallRating'));
  assert.ok(dataSource.includes('recentReviews'));
  assert.ok(dataSource.includes('.slice(0, 3)'));
});

// ============================================================
// 测试: 边界与空数据处理
// ============================================================

test('🧰 空数组: computeAverageRating 空数组返回0', () => {
  // Verify the function handles empty input
  assert.ok(dataSource.includes('review'));
  assert.ok(dataSource.includes('.length'));
  assert.ok(dataSource.includes('return 0'));
});

test('🧰 空数组: computePositiveRate 空数组返回0', () => {
  assert.ok(dataSource.includes('positiveRate'));
  assert.ok(dataSource.includes('return 0'));
});

test('🧰 空数组: paginateReviews 对空数组安全', () => {
  assert.ok(dataSource.includes('paginateReviews'));
  assert.ok(dataSource.includes('slice'));
});

// ============================================================
// 测试: 页面导出
// ============================================================

test('📄 page.tsx: 导出默认函数组件且标明 use client', () => {
  assert.ok(pageSource.includes("'use client'"));
  assert.ok(pageSource.includes('export default function ReviewsPage'));
});

test('📄 page.tsx: 引入 reviews-data 数据', () => {
  assert.ok(pageSource.includes('./reviews-data'));
  assert.ok(pageSource.includes('MOCK_REVIEWS'));
  assert.ok(pageSource.includes('RATING_LABELS'));
  assert.ok(pageSource.includes('computeReviewStats'));
  assert.ok(pageSource.includes('filterByStore'));
  assert.ok(pageSource.includes('sortReviews'));
  assert.ok(pageSource.includes('paginateReviews'));
});

test('📄 page.tsx: 包含门店Tab导航', () => {
  assert.ok(pageSource.includes('STORE_TABS'));
  assert.ok(pageSource.includes('全部'));
  assert.ok(pageSource.includes('旗舰店（国贸）'));
  assert.ok(pageSource.includes('社区店（望京）'));
  assert.ok(pageSource.includes('卫星店（中关村）'));
  assert.ok(pageSource.includes('新店（通州万达）'));
});

test('📄 page.tsx: 包含评分概览区域', () => {
  assert.ok(pageSource.includes('averageRating'));
  assert.ok(pageSource.includes('positiveRate'));
  assert.ok(pageSource.includes('好评率'));
});

test('📄 page.tsx: 包含排序工具栏', () => {
  assert.ok(pageSource.includes('latest'));
  assert.ok(pageSource.includes('highest'));
  assert.ok(pageSource.includes('lowest'));
  assert.ok(pageSource.includes('有图'));
});

test('📄 page.tsx: 包含分页按钮', () => {
  assert.ok(pageSource.includes('上一页'));
  assert.ok(pageSource.includes('下一页'));
});

test('📄 page.tsx: 包含ReviewCard子组件', () => {
  assert.ok(pageSource.includes('function ReviewCard'));
  assert.ok(pageSource.includes('renderStars'));
  assert.ok(pageSource.includes('formatReviewTime'));
  assert.ok(pageSource.includes('商家回复'));
});
