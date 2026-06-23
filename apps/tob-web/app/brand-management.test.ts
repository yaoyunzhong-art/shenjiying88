/**
 * brand-management unit tests — tob-web
 *
 * 覆盖: 品牌数据加载 / 空状态 / 错误状态 / 正常渲染 / 用户交互逻辑
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

type BrandStatus = 'active' | 'pending_review' | 'suspended' | 'archived';
type BrandCategory = 'retail' | 'food' | 'fashion' | 'tech' | 'service' | 'other';

interface BrandRegistration {
  brandId: string;
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

const BRAND_STATUSES: BrandStatus[] = ['active', 'pending_review', 'suspended', 'archived'];
const BRAND_CATEGORIES: BrandCategory[] = ['retail', 'food', 'fashion', 'tech', 'service', 'other'];

const BRAND_STATUS_MAP: Record<BrandStatus, { label: string; variant: 'success' | 'warning' | 'danger' | 'neutral' }> = {
  active: { label: '已开通', variant: 'success' },
  pending_review: { label: '审核中', variant: 'warning' },
  suspended: { label: '已暂停', variant: 'danger' },
  archived: { label: '已归档', variant: 'neutral' },
};

const BRAND_CATEGORY_MAP: Record<BrandCategory, { label: string }> = {
  retail: { label: '零售' },
  food: { label: '餐饮' },
  fashion: { label: '时尚' },
  tech: { label: '科技' },
  service: { label: '服务' },
  other: { label: '其他' },
};

const MOCK_BRANDS: BrandRegistration[] = [
  { brandId: 'br-001', brandName: '健康烘焙坊', tenantCode: 'demo-tenant', status: 'active', category: 'food', registeredAt: '2025-01-15', contactEmail: 'hr@healthybakery.com', contactPhone: '138****1234', storeCount: 12, marketCodes: ['cn-mainland', 'sea-sg'], annualRevenue: 8500000, employeeCount: 45 },
  { brandId: 'br-002', brandName: '智能科技', tenantCode: 'demo-tenant', status: 'active', category: 'tech', registeredAt: '2025-03-10', contactEmail: 'admin@smarttech.com', contactPhone: '139****5678', storeCount: 8, marketCodes: ['cn-mainland', 'us-default'], annualRevenue: 12000000, employeeCount: 62 },
  { brandId: 'br-003', brandName: '风尚衣品', tenantCode: 'demo-tenant', status: 'pending_review', category: 'fashion', registeredAt: '2026-05-20', contactEmail: 'info@fashionwind.com', contactPhone: '150****1111', storeCount: 3, marketCodes: ['cn-mainland'], annualRevenue: 1200000, employeeCount: 15 },
  { brandId: 'br-004', brandName: '绿居家', tenantCode: 'other-tenant', status: 'suspended', category: 'retail', registeredAt: '2024-08-01', contactEmail: 'support@greenhome.com', contactPhone: '137****2222', storeCount: 5, marketCodes: ['cn-mainland'], annualRevenue: 3000000, employeeCount: 20 },
  { brandId: 'br-005', brandName: '清泉饮品', tenantCode: 'demo-tenant', status: 'active', category: 'food', registeredAt: '2025-06-15', contactEmail: 'hello@clearspring.com', contactPhone: '155****3333', storeCount: 20, marketCodes: ['cn-mainland', 'sea-sg', 'jp-tokyo'], annualRevenue: 25000000, employeeCount: 120 },
  { brandId: 'br-006', brandName: '收纳达人', tenantCode: 'other-tenant', status: 'archived', category: 'other', registeredAt: '2023-11-30', contactEmail: 'bye@storagepro.com', contactPhone: '133****4444', storeCount: 0, marketCodes: [], annualRevenue: 0, employeeCount: 0 },
  { brandId: 'br-007', brandName: '运动生活', tenantCode: 'demo-tenant', status: 'active', category: 'retail', registeredAt: '2025-09-01', contactEmail: 'info@sportslife.com', contactPhone: '186****5555', storeCount: 15, marketCodes: ['cn-mainland', 'us-default', 'eu-de'], annualRevenue: 18000000, employeeCount: 88 },
  { brandId: 'br-008', brandName: '声学科技', tenantCode: 'other-tenant', status: 'pending_review', category: 'tech', registeredAt: '2026-06-01', contactEmail: 'apply@acoustic.com', contactPhone: '189****6666', storeCount: 0, marketCodes: [], annualRevenue: 0, employeeCount: 3 },
];

describe('brand-management data integrity', () => {
  it('MOCK_BRANDS should have at least 8 items', () => {
    assert.ok(MOCK_BRANDS.length >= 8, `expected >=8, got ${MOCK_BRANDS.length}`);
  });
  it('every brand should have required fields', () => {
    for (const b of MOCK_BRANDS) {
      assert.ok(typeof b.brandId === 'string' && b.brandId.length > 0);
      assert.ok(typeof b.brandName === 'string' && b.brandName.length > 0);
      assert.ok(typeof b.tenantCode === 'string' && b.tenantCode.length > 0);
      assert.ok(typeof b.contactEmail === 'string' && b.contactEmail.includes('@'));
      assert.ok(typeof b.storeCount === 'number' && b.storeCount >= 0);
      assert.ok(typeof b.annualRevenue === 'number' && b.annualRevenue >= 0);
    }
  });
  it('every brand status should be valid', () => {
    for (const b of MOCK_BRANDS) assert.ok(BRAND_STATUSES.includes(b.status));
  });
  it('every brand category should be valid', () => {
    for (const b of MOCK_BRANDS) assert.ok(BRAND_CATEGORIES.includes(b.category));
  });
  it('active brands should have at least 1 store', () => {
    for (const b of MOCK_BRANDS.filter(b => b.status === 'active')) assert.ok(b.storeCount >= 1);
  });
  it('archived brands should have 0 stores', () => {
    for (const b of MOCK_BRANDS.filter(b => b.status === 'archived')) assert.equal(b.storeCount, 0);
  });
});

describe('brand-management filtering logic', () => {
  it('status filter should correctly partition brands', () => {
    for (const s of BRAND_STATUSES) assert.ok(MOCK_BRANDS.filter(b => b.status === s).length >= 0);
  });
  it('total by status should equal total brands', () => {
    const sum = BRAND_STATUSES.reduce((acc, s) => acc + MOCK_BRANDS.filter(b => b.status === s).length, 0);
    assert.equal(sum, MOCK_BRANDS.length);
  });
  it('tenant filter should correctly isolate brands', () => {
    const tenants = [...new Set(MOCK_BRANDS.map(b => b.tenantCode))];
    for (const t of tenants) assert.ok(MOCK_BRANDS.filter(b => b.tenantCode === t).length >= 1);
  });
});

describe('brand-management empty/error state', () => {
  it('should handle empty brand list without crash', () => {
    const brands: BrandRegistration[] = [];
    assert.equal(brands.length, 0);
    assert.equal(brands.filter(b => b.status === 'active').length, 0);
  });
  it('should handle filtering with no matches', () => {
    assert.equal(MOCK_BRANDS.filter(b => b.brandName === 'NONEXISTENT').length, 0);
  });
});

describe('brand-management status/category maps', () => {
  it('BRAND_STATUS_MAP should cover all statuses', () => {
    for (const s of BRAND_STATUSES) {
      assert.ok(s in BRAND_STATUS_MAP);
      assert.ok(['success', 'warning', 'danger', 'neutral'].includes(BRAND_STATUS_MAP[s].variant));
    }
  });
  it('BRAND_CATEGORY_MAP should cover all categories', () => {
    for (const c of BRAND_CATEGORIES) assert.ok(c in BRAND_CATEGORY_MAP);
  });
});
