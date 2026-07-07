/**
 * coupons-page.ts — Coupons list page: data, filtering, searching, pagination logic
 *
 * 🐜 自动: [B-页面创建] [coupons-page 优惠券管理列表页]
 */

import {
  MOCK_COUPONS,
  COUPON_STATUS_MAP,
  COUPON_TYPE_MAP,
  COUPON_SCOPE_MAP,
  COUPON_STATUSES,
  COUPON_TYPES,
  type CouponItem,
  type CouponStatus,
  type CouponType,
} from './coupons-data';

// ---- 过滤器类型 ----

export interface CouponFilters {
  status: CouponStatus | 'all';
  type: CouponType | 'all';
  search: string;
}

export const DEFAULT_FILTERS: CouponFilters = {
  status: 'all',
  type: 'all',
  search: '',
};

// ---- 分页配置 ----

export const PAGE_SIZE_OPTIONS = [10, 20, 50] as const;
export const DEFAULT_PAGE_SIZE = 10;

export interface PaginationState {
  page: number;
  pageSize: number;
}

// ---- 核心逻辑函数 ----

/**
 * 根据过滤条件过滤优惠券列表
 */
export function filterCoupons(
  items: CouponItem[],
  filters: CouponFilters,
): CouponItem[] {
  return items.filter((item) => {
    // 状态过滤
    if (filters.status !== 'all' && item.status !== filters.status) {
      return false;
    }
    // 类型过滤
    if (filters.type !== 'all' && item.type !== filters.type) {
      return false;
    }
    // 搜索关键词（匹配名称 / 编码 / 创建人）
    if (filters.search) {
      const kw = filters.search.toLowerCase();
      const match =
        item.name.toLowerCase().includes(kw) ||
        item.code.toLowerCase().includes(kw) ||
        item.createdBy.toLowerCase().includes(kw);
      if (!match) return false;
    }
    return true;
  });
}

/**
 * 对过滤后的列表进行分页
 */
export function paginateCoupons(
  items: CouponItem[],
  pagination: PaginationState,
): { items: CouponItem[]; total: number; totalPages: number } {
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / pagination.pageSize));
  const clampedPage = Math.min(pagination.page, totalPages);
  const start = (clampedPage - 1) * pagination.pageSize;
  return {
    items: items.slice(start, start + pagination.pageSize),
    total,
    totalPages,
  };
}

// ---- 摘要统计 ----

export interface CouponSummary {
  total: number;
  activeCount: number;
  draftCount: number;
  exhaustedCount: number;
  expiredCount: number;
  pausedCount: number;
}

export function computeCouponSummary(items: CouponItem[]): CouponSummary {
  return {
    total: items.length,
    activeCount: items.filter((i) => i.status === 'active').length,
    draftCount: items.filter((i) => i.status === 'draft').length,
    exhaustedCount: items.filter((i) => i.status === 'exhausted').length,
    expiredCount: items.filter((i) => i.status === 'expired').length,
    pausedCount: items.filter((i) => i.status === 'paused').length,
  };
}

/**
 * 获取剩余容量占比（百分比）
 */
export function remainingPercent(item: CouponItem): number {
  if (item.totalQuota <= 0) return 0;
  return Math.round((item.remainingQuota / item.totalQuota) * 100);
}

/**
 * 格式化优惠券折扣展示
 */
export function formatDiscount(item: CouponItem): string {
  const suffix = COUPON_TYPE_MAP[item.type]?.suffix ?? '';
  if (item.type === 'shipping') return '包邮';
  return `${item.discountValue}${suffix}`;
}

/**
 * 格式化满减门槛展示
 */
export function formatThreshold(item: CouponItem): string {
  if (item.threshold <= 0) return '无门槛';
  return `满${item.threshold}元`;
}

// ---- 默认导出：供页面渲染使用的完整数据包装 ----

export interface CouponsPageData {
  coupons: CouponItem[];
  filters: CouponFilters;
  pagination: PaginationState;
  summary: CouponSummary;
  filtered: CouponItem[];
  paged: CouponItem[];
  totalPages: number;
  totalFiltered: number;
}

export function buildCouponsPageData(
  coupons: CouponItem[] = MOCK_COUPONS,
  filters: CouponFilters = DEFAULT_FILTERS,
  pagination: PaginationState = { page: 1, pageSize: DEFAULT_PAGE_SIZE },
): CouponsPageData {
  const filtered = filterCoupons(coupons, filters);
  const { items: paged, total: totalFiltered, totalPages } = paginateCoupons(filtered, pagination);
  const summary = computeCouponSummary(coupons);
  return {
    coupons,
    filters,
    pagination,
    summary,
    filtered,
    paged,
    totalPages,
    totalFiltered,
  };
}
