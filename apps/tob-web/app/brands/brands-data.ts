/**
 * brands-data.ts — 品牌管理数据层 (ToB)
 * 角色视角: 👔 租户管理员 / 🏢 品牌经理
 */
export type BrandStatus = 'active' | 'pending_review' | 'suspended' | 'archived';
export type BrandCategory = 'retail' | 'food' | 'fashion' | 'tech' | 'service' | 'other';

export interface BrandItem {
  id: string;
  brandName: string;
  tenantCode: string;
  status: BrandStatus;
  category: BrandCategory;
  registeredAt: string;
  contactEmail: string;
  contactPhone: string;
  storeCount: number;
  marketCodes: string[];
  annualRevenue: number;
  employeeCount: number;
}

export const BRAND_STATUSES: BrandStatus[] = ['active', 'pending_review', 'suspended', 'archived'];
export const BRAND_CATEGORIES: BrandCategory[] = ['retail', 'food', 'fashion', 'tech', 'service', 'other'];

export const BRAND_STATUS_MAP: Record<BrandStatus, { label: string; variant: 'success' | 'warning' | 'danger' | 'neutral' }> = {
  active: { label: '已开通', variant: 'success' },
  pending_review: { label: '审核中', variant: 'warning' },
  suspended: { label: '已暂停', variant: 'danger' },
  archived: { label: '已归档', variant: 'neutral' },
};

export const BRAND_CATEGORY_MAP: Record<BrandCategory, { label: string }> = {
  retail: { label: '零售' },
  food: { label: '餐饮' },
  fashion: { label: '时尚' },
  tech: { label: '科技' },
  service: { label: '服务' },
  other: { label: '其他' },
};

export const MOCK_BRANDS: BrandItem[] = [
  { id: 'br-001', brandName: '健康烘焙坊', tenantCode: 'demo-tenant', status: 'active', category: 'food', registeredAt: '2025-01-15', contactEmail: 'hr@healthybakery.com', contactPhone: '138****1234', storeCount: 12, marketCodes: ['cn-mainland', 'sea-sg'], annualRevenue: 8500000, employeeCount: 45 },
  { id: 'br-002', brandName: '智能科技', tenantCode: 'demo-tenant', status: 'active', category: 'tech', registeredAt: '2025-03-10', contactEmail: 'admin@smarttech.com', contactPhone: '139****5678', storeCount: 8, marketCodes: ['cn-mainland', 'us-default'], annualRevenue: 12000000, employeeCount: 62 },
  { id: 'br-003', brandName: '风尚衣品', tenantCode: 'demo-tenant', status: 'pending_review', category: 'fashion', registeredAt: '2026-05-20', contactEmail: 'info@fashionwind.com', contactPhone: '150****1111', storeCount: 3, marketCodes: ['cn-mainland'], annualRevenue: 1200000, employeeCount: 15 },
  { id: 'br-004', brandName: '绿居家', tenantCode: 'other-tenant', status: 'suspended', category: 'retail', registeredAt: '2024-08-01', contactEmail: 'support@greenhome.com', contactPhone: '137****2222', storeCount: 5, marketCodes: ['cn-mainland'], annualRevenue: 3000000, employeeCount: 20 },
  { id: 'br-005', brandName: '清泉饮品', tenantCode: 'demo-tenant', status: 'active', category: 'food', registeredAt: '2025-06-15', contactEmail: 'hello@clearspring.com', contactPhone: '155****3333', storeCount: 20, marketCodes: ['cn-mainland', 'sea-sg', 'jp-tokyo'], annualRevenue: 25000000, employeeCount: 120 },
  { id: 'br-006', brandName: '收纳达人', tenantCode: 'other-tenant', status: 'archived', category: 'other', registeredAt: '2023-11-30', contactEmail: 'bye@storagepro.com', contactPhone: '133****4444', storeCount: 0, marketCodes: [], annualRevenue: 0, employeeCount: 0 },
  { id: 'br-007', brandName: '运动生活', tenantCode: 'demo-tenant', status: 'active', category: 'retail', registeredAt: '2025-09-01', contactEmail: 'info@sportslife.com', contactPhone: '186****5555', storeCount: 15, marketCodes: ['cn-mainland', 'us-default', 'eu-de'], annualRevenue: 18000000, employeeCount: 88 },
  { id: 'br-008', brandName: '声学科技', tenantCode: 'other-tenant', status: 'pending_review', category: 'tech', registeredAt: '2026-06-01', contactEmail: 'apply@acoustic.com', contactPhone: '189****6666', storeCount: 0, marketCodes: [], annualRevenue: 0, employeeCount: 3 },
];

export function formatRevenue(n: number): string {
  if (n >= 1_000_000) return `¥${(n / 10_000).toFixed(1)}万`;
  if (n >= 1_000) return `¥${(n / 1000).toFixed(1)}K`;
  return `¥${n}`;
}
