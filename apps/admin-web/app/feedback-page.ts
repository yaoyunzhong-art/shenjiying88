/**
 * feedback-page.ts — Customer feedback list page: data, filtering, tab filtering, stats logic
 */

import {
  MOCK_FEEDBACKS,
  FEEDBACK_STATUSES,
  FEEDBACK_TYPES,
  computeFeedbackStats,
  type FeedbackItem,
  type FeedbackStatus,
  type FeedbackType,
} from './feedback-data';

// ---- Tab 配置 ----

export type FeedbackTab = FeedbackStatus | 'all';

export const FEEDBACK_TABS: { key: FeedbackTab; label: string }[] = [
  { key: 'pending', label: '待处理' },
  { key: 'processing', label: '处理中' },
  { key: 'resolved', label: '已处理' },
  { key: 'all', label: '全部' },
];

// ---- 核心逻辑函数 ----

/**
 * 根据 Tab 筛选反馈列表
 */
export function filterByTab(
  items: FeedbackItem[],
  tab: FeedbackTab,
): FeedbackItem[] {
  if (tab === 'all') return [...items];
  return items.filter((f) => f.status === tab);
}

/**
 * 根据关键词搜索（客户名/门店/内容）
 */
export function searchFeedback(
  items: FeedbackItem[],
  keyword: string,
): FeedbackItem[] {
  if (!keyword.trim()) return items;
  const lower = keyword.toLowerCase();
  return items.filter(
    (f) =>
      f.customerName.toLowerCase().includes(lower) ||
      f.storeName.toLowerCase().includes(lower) ||
      f.content.toLowerCase().includes(lower),
  );
}

/**
 * 根据反馈类型筛选
 */
export function filterByType(
  items: FeedbackItem[],
  type: FeedbackType | 'all',
): FeedbackItem[] {
  if (type === 'all') return items;
  return items.filter((f) => f.type === type);
}

/**
 * 执行完整过滤链
 */
export function fullFilterChain(
  items: FeedbackItem[],
  tab: FeedbackTab,
  keyword: string,
  type: FeedbackType | 'all',
): FeedbackItem[] {
  let result = filterByTab(items, tab);
  result = searchFeedback(result, keyword);
  result = filterByType(result, type);
  return result;
}

// ---- 默认导出：供页面渲染使用的完整数据包装 ----

export interface FeedbackPageData {
  items: FeedbackItem[];
  tab: FeedbackTab;
  keyword: string;
  typeFilter: FeedbackType | 'all';
  filtered: FeedbackItem[];
  stats: ReturnType<typeof computeFeedbackStats>;
  totalFiltered: number;
}

export function buildFeedbackPageData(
  items: FeedbackItem[] = MOCK_FEEDBACKS,
  tab: FeedbackTab = 'all',
  keyword: string = '',
  typeFilter: FeedbackType | 'all' = 'all',
): FeedbackPageData {
  const stats = computeFeedbackStats(items);
  const filtered = fullFilterChain(items, tab, keyword, typeFilter);
  return {
    items,
    tab,
    keyword,
    typeFilter,
    filtered,
    stats,
    totalFiltered: filtered.length,
  };
}
