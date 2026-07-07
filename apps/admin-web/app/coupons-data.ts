/**
 * coupons-data.ts — Coupons mock data for admin-web coupon management pages
 */

export type CouponStatus = 'active' | 'paused' | 'expired' | 'draft' | 'exhausted';
export type CouponType = 'percentage' | 'fixed' | 'shipping' | 'threshold';
export type CouponScope = 'all' | 'category' | 'product' | 'store' | 'member_tier';

export interface CouponItem {
  id: string;
  code: string;
  name: string;
  type: CouponType;
  discountValue: number;
  /** 满减门槛（0 表示无门槛） */
  threshold: number;
  scope: CouponScope;
  scopeLabel: string;
  totalQuota: number;
  remainingQuota: number;
  usageLimit: number;
  usedCount: number;
  status: CouponStatus;
  startAt: string;
  endAt: string;
  createdBy: string;
  updatedAt: string;
}

export const COUPON_STATUS_MAP: Record<CouponStatus, { label: string; variant: 'success' | 'warning' | 'danger' | 'neutral' }> = {
  active: { label: '进行中', variant: 'success' },
  paused: { label: '已暂停', variant: 'warning' },
  expired: { label: '已过期', variant: 'danger' },
  draft: { label: '草稿', variant: 'neutral' },
  exhausted: { label: '已领完', variant: 'danger' },
};

export const COUPON_TYPE_MAP: Record<CouponType, { label: string; suffix: string }> = {
  percentage: { label: '折扣券', suffix: '%' },
  fixed: { label: '代金券', suffix: '元' },
  shipping: { label: '包邮券', suffix: '' },
  threshold: { label: '满减券', suffix: '元' },
};

export const COUPON_SCOPE_MAP: Record<CouponScope, string> = {
  all: '全场通用',
  category: '指定品类',
  product: '指定商品',
  store: '指定门店',
  member_tier: '指定会员等级',
};

export const COUPON_STATUSES: CouponStatus[] = ['active', 'paused', 'expired', 'draft', 'exhausted'];
export const COUPON_TYPES: CouponType[] = ['percentage', 'fixed', 'shipping', 'threshold'];
export const COUPON_SCOPES: CouponScope[] = ['all', 'category', 'product', 'store', 'member_tier'];

export const MOCK_COUPONS: CouponItem[] = [
  {
    id: 'c-001',
    code: 'SUMMER2026',
    name: '夏日冰爽特惠',
    type: 'percentage',
    discountValue: 15,
    threshold: 0,
    scope: 'all',
    scopeLabel: '全场通用',
    totalQuota: 10000,
    remainingQuota: 4321,
    usageLimit: 1,
    usedCount: 5679,
    status: 'active',
    startAt: '2026-06-01',
    endAt: '2026-08-31',
    createdBy: '运营部-张三',
    updatedAt: '2026-06-25',
  },
  {
    id: 'c-002',
    code: 'VIP50',
    name: 'VIP会员满50减10',
    type: 'threshold',
    discountValue: 10,
    threshold: 50,
    scope: 'member_tier',
    scopeLabel: '金卡及以上',
    totalQuota: 5000,
    remainingQuota: 2840,
    usageLimit: 1,
    usedCount: 2160,
    status: 'active',
    startAt: '2026-05-01',
    endAt: '2026-12-31',
    createdBy: '会员部-李四',
    updatedAt: '2026-06-24',
  },
  {
    id: 'c-003',
    code: 'NEW20',
    name: '新客专享20元',
    type: 'fixed',
    discountValue: 20,
    threshold: 0,
    scope: 'all',
    scopeLabel: '全场通用（仅限新客）',
    totalQuota: 3000,
    remainingQuota: 0,
    usageLimit: 1,
    usedCount: 3000,
    status: 'exhausted',
    startAt: '2026-01-01',
    endAt: '2026-06-30',
    createdBy: '运营部-王五',
    updatedAt: '2026-06-15',
  },
  {
    id: 'c-004',
    code: 'FREEBJ',
    name: '北京门店包邮券',
    type: 'shipping',
    discountValue: 0,
    threshold: 99,
    scope: 'store',
    scopeLabel: '北京区域门店',
    totalQuota: 2000,
    remainingQuota: 876,
    usageLimit: 3,
    usedCount: 1124,
    status: 'active',
    startAt: '2026-04-01',
    endAt: '2026-07-31',
    createdBy: '市场部-赵六',
    updatedAt: '2026-06-23',
  },
  {
    id: 'c-005',
    code: 'MILKTEA7',
    name: '奶茶品类7折',
    type: 'percentage',
    discountValue: 30,
    threshold: 0,
    scope: 'category',
    scopeLabel: '饮料-奶茶类',
    totalQuota: 8000,
    remainingQuota: 5632,
    usageLimit: 2,
    usedCount: 2368,
    status: 'active',
    startAt: '2026-06-15',
    endAt: '2026-09-15',
    createdBy: '品类部-孙七',
    updatedAt: '2026-06-22',
  },
  {
    id: 'c-006',
    code: 'SPRING2026',
    name: '春季焕新促',
    type: 'threshold',
    discountValue: 30,
    threshold: 200,
    scope: 'all',
    scopeLabel: '全场通用',
    totalQuota: 5000,
    remainingQuota: 0,
    usageLimit: 1,
    usedCount: 5000,
    status: 'expired',
    startAt: '2026-03-01',
    endAt: '2026-05-31',
    createdBy: '运营部-张三',
    updatedAt: '2026-06-01',
  },
  {
    id: 'c-007',
    code: 'PROMO0826',
    name: '八月限时特惠（审核中）',
    type: 'percentage',
    discountValue: 20,
    threshold: 0,
    scope: 'all',
    scopeLabel: '全场通用',
    totalQuota: 15000,
    remainingQuota: 15000,
    usageLimit: 5,
    usedCount: 0,
    status: 'draft',
    startAt: '2026-08-01',
    endAt: '2026-08-15',
    createdBy: '运营部-张三',
    updatedAt: '2026-06-26',
  },
  {
    id: 'c-008',
    code: 'APPLIANCE100',
    name: '电器满1000减100',
    type: 'threshold',
    discountValue: 100,
    threshold: 1000,
    scope: 'category',
    scopeLabel: '电子电器类',
    totalQuota: 2000,
    remainingQuota: 1204,
    usageLimit: 1,
    usedCount: 796,
    status: 'paused',
    startAt: '2026-05-10',
    endAt: '2026-08-10',
    createdBy: '品类部-周八',
    updatedAt: '2026-06-20',
  },
  {
    id: 'c-009',
    code: 'BIRTHDAY',
    name: '会员生日礼包券',
    type: 'fixed',
    discountValue: 50,
    threshold: 200,
    scope: 'member_tier',
    scopeLabel: '全部会员等级',
    totalQuota: 99999,
    remainingQuota: 88123,
    usageLimit: 1,
    usedCount: 11876,
    status: 'active',
    startAt: '2026-01-01',
    endAt: '2026-12-31',
    createdBy: '会员部-李四',
    updatedAt: '2026-06-26',
  },
  {
    id: 'c-010',
    code: 'WEEKEND20',
    name: '周末狂欢满80减15',
    type: 'threshold',
    discountValue: 15,
    threshold: 80,
    scope: 'all',
    scopeLabel: '全场通用',
    totalQuota: 20000,
    remainingQuota: 14239,
    usageLimit: 2,
    usedCount: 5761,
    status: 'active',
    startAt: '2026-05-01',
    endAt: '2026-07-31',
    createdBy: '运营部-张三',
    updatedAt: '2026-06-25',
  },
];
