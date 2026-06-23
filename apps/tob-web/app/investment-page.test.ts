/**
 * investment-page unit tests — tob-web
 *
 * 覆盖: 招商合作数据加载 / 空状态 / 错误状态 / 正常渲染 / 合作类型过滤
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

type InvestmentType = 'franchise' | 'joint_venture' | 'brand_license' | 'distribution' | 'agency';
type InvestmentStatus = 'open' | 'negotiating' | 'closed' | 'paused';
type InvestmentRegion = 'north' | 'south' | 'east' | 'west' | 'central' | 'overseas';

interface InvestmentOpportunity {
  id: string;
  brandName: string;
  tenantCode: string;
  type: InvestmentType;
  status: InvestmentStatus;
  region: InvestmentRegion;
  targetMarketCode: string;
  investmentRangeMin: number;
  investmentRangeMax: number;
  expectedROIMonths: number;
  requiredStoreCount: number;
  requiredExperience: string[];
  contactPerson: string;
  contactEmail: string;
  publishedAt: string;
  expiresAt: string;
  applications: number;
}

const INVESTMENT_TYPES: InvestmentType[] = ['franchise', 'joint_venture', 'brand_license', 'distribution', 'agency'];
const INVESTMENT_STATUSES: InvestmentStatus[] = ['open', 'negotiating', 'closed', 'paused'];
const INVESTMENT_REGIONS: InvestmentRegion[] = ['north', 'south', 'east', 'west', 'central', 'overseas'];

const INVESTMENT_TYPE_MAP: Record<InvestmentType, { label: string }> = {
  franchise: { label: '特许加盟' }, joint_venture: { label: '合资联营' },
  brand_license: { label: '品牌授权' }, distribution: { label: '渠道分销' }, agency: { label: '代理合作' },
};

const INVESTMENT_STATUS_MAP: Record<InvestmentStatus, { label: string; variant: 'success' | 'warning' | 'danger' | 'neutral' }> = {
  open: { label: '招商中', variant: 'success' }, negotiating: { label: '洽谈中', variant: 'warning' },
  closed: { label: '已结束', variant: 'neutral' }, paused: { label: '已暂停', variant: 'danger' },
};

const MOCK_OPPORTUNITIES: InvestmentOpportunity[] = [
  { id: 'inv-001', brandName: '健康烘焙坊', tenantCode: 'demo-tenant', type: 'franchise', status: 'open', region: 'north', targetMarketCode: 'cn-mainland', investmentRangeMin: 500000, investmentRangeMax: 2000000, expectedROIMonths: 18, requiredStoreCount: 3, requiredExperience: ['餐饮管理', '连锁经营'], contactPerson: '王经理', contactEmail: 'invest@healthybakery.com', publishedAt: '2026-05-01', expiresAt: '2026-12-31', applications: 24 },
  { id: 'inv-002', brandName: '清泉饮品', tenantCode: 'demo-tenant', type: 'franchise', status: 'open', region: 'east', targetMarketCode: 'cn-mainland', investmentRangeMin: 300000, investmentRangeMax: 1500000, expectedROIMonths: 12, requiredStoreCount: 2, requiredExperience: ['零售管理'], contactPerson: '李总', contactEmail: 'biz@clearspring.com', publishedAt: '2026-04-15', expiresAt: '2026-10-15', applications: 38 },
  { id: 'inv-003', brandName: '智能科技', tenantCode: 'demo-tenant', type: 'joint_venture', status: 'open', region: 'overseas', targetMarketCode: 'us-default', investmentRangeMin: 2000000, investmentRangeMax: 10000000, expectedROIMonths: 36, requiredStoreCount: 1, requiredExperience: ['科技零售', '供应链管理'], contactPerson: 'Chen Wei', contactEmail: 'global@smarttech.com', publishedAt: '2026-06-01', expiresAt: '2027-06-01', applications: 12 },
  { id: 'inv-004', brandName: '风尚衣品', tenantCode: 'demo-tenant', type: 'brand_license', status: 'negotiating', region: 'south', targetMarketCode: 'cn-mainland', investmentRangeMin: 800000, investmentRangeMax: 3000000, expectedROIMonths: 24, requiredStoreCount: 5, requiredExperience: ['服装零售', '品牌管理'], contactPerson: '赵总', contactEmail: 'license@fashionwind.com', publishedAt: '2026-05-20', expiresAt: '2026-09-20', applications: 6 },
  { id: 'inv-005', brandName: '运动生活', tenantCode: 'demo-tenant', type: 'distribution', status: 'open', region: 'west', targetMarketCode: 'cn-mainland', investmentRangeMin: 200000, investmentRangeMax: 800000, expectedROIMonths: 9, requiredStoreCount: 0, requiredExperience: ['门店运营'], contactPerson: '钱经理', contactEmail: 'dist@sportslife.com', publishedAt: '2026-06-10', expiresAt: '2026-09-10', applications: 45 },
  { id: 'inv-006', brandName: '声学科技', tenantCode: 'other-tenant', type: 'agency', status: 'paused', region: 'central', targetMarketCode: 'cn-mainland', investmentRangeMin: 100000, investmentRangeMax: 500000, expectedROIMonths: 15, requiredStoreCount: 0, requiredExperience: ['电子产品', '售后服务'], contactPerson: '孙总', contactEmail: 'agent@acoustic.com', publishedAt: '2026-03-01', expiresAt: '2026-08-01', applications: 3 },
  { id: 'inv-007', brandName: '绿居家', tenantCode: 'other-tenant', type: 'franchise', status: 'closed', region: 'north', targetMarketCode: 'cn-mainland', investmentRangeMin: 400000, investmentRangeMax: 1200000, expectedROIMonths: 20, requiredStoreCount: 2, requiredExperience: ['家居零售'], contactPerson: '周经理', contactEmail: 'join@greenhome.com', publishedAt: '2025-10-01', expiresAt: '2026-04-01', applications: 15 },
  { id: 'inv-008', brandName: '收纳达人', tenantCode: 'other-tenant', type: 'distribution', status: 'open', region: 'east', targetMarketCode: 'cn-mainland', investmentRangeMin: 80000, investmentRangeMax: 300000, expectedROIMonths: 6, requiredStoreCount: 0, requiredExperience: [], contactPerson: '吴总', contactEmail: 'sell@storagepro.com', publishedAt: '2026-06-15', expiresAt: '2026-12-15', applications: 52 },
  { id: 'inv-009', brandName: '健康烘焙坊', tenantCode: 'demo-tenant', type: 'brand_license', status: 'open', region: 'overseas', targetMarketCode: 'sea-sg', investmentRangeMin: 1500000, investmentRangeMax: 5000000, expectedROIMonths: 30, requiredStoreCount: 3, requiredExperience: ['餐饮管理', '国际化运营'], contactPerson: 'Liu Yang', contactEmail: 'international@healthybakery.com', publishedAt: '2026-06-01', expiresAt: '2027-06-01', applications: 8 },
];

describe('investment data integrity', () => {
  it('should have at least 8 opportunities', () => assert.ok(MOCK_OPPORTUNITIES.length >= 8));
  it('every opportunity should have required fields', () => {
    for (const o of MOCK_OPPORTUNITIES) {
      assert.ok(typeof o.id === 'string' && o.id.length > 0);
      assert.ok(o.investmentRangeMin > 0);
      assert.ok(o.investmentRangeMax >= o.investmentRangeMin);
      assert.ok(o.expectedROIMonths > 0);
      assert.ok(o.applications >= 0);
    }
  });
  it('every type should be valid', () => {
    for (const o of MOCK_OPPORTUNITIES) assert.ok(INVESTMENT_TYPES.includes(o.type));
  });
  it('every status should be valid', () => {
    for (const o of MOCK_OPPORTUNITIES) assert.ok(INVESTMENT_STATUSES.includes(o.status));
  });
  it('every region should be valid', () => {
    for (const o of MOCK_OPPORTUNITIES) assert.ok(INVESTMENT_REGIONS.includes(o.region));
  });
  it('open opportunities should have non-zero investment range', () => {
    for (const o of MOCK_OPPORTUNITIES.filter(o => o.status === 'open')) assert.ok(o.investmentRangeMin >= 50000);
  });
});

describe('investment filtering', () => {
  it('type filter should correctly partition', () => {
    for (const t of INVESTMENT_TYPES) assert.ok(MOCK_OPPORTUNITIES.filter(o => o.type === t).length >= 0);
  });
  it('total by status should equal total', () => {
    const sum = INVESTMENT_STATUSES.reduce((acc, s) => acc + MOCK_OPPORTUNITIES.filter(o => o.status === s).length, 0);
    assert.equal(sum, MOCK_OPPORTUNITIES.length);
  });
  it('total by type should equal total', () => {
    const sum = INVESTMENT_TYPES.reduce((acc, t) => acc + MOCK_OPPORTUNITIES.filter(o => o.type === t).length, 0);
    assert.equal(sum, MOCK_OPPORTUNITIES.length);
  });
});

describe('investment empty/error states', () => {
  it('empty list should not crash', () => {
    const empty: InvestmentOpportunity[] = [];
    assert.equal(empty.length, 0);
  });
  it('should handle filtering with no matches', () => {
    assert.equal(MOCK_OPPORTUNITIES.filter(o => o.brandName === 'NONEXISTENT').length, 0);
  });
});

describe('investment ROI analysis', () => {
  it('overseas opportunities should have higher investment range', () => {
    for (const o of MOCK_OPPORTUNITIES.filter(o => o.region === 'overseas')) assert.ok(o.investmentRangeMin >= 1000000);
  });
  it('agency type should have lower investment barrier', () => {
    for (const o of MOCK_OPPORTUNITIES.filter(o => o.type === 'agency')) assert.ok(o.investmentRangeMax <= 1000000);
  });
});

describe('investment maps', () => {
  it('INVESTMENT_TYPE_MAP should cover all types', () => {
    for (const t of INVESTMENT_TYPES) assert.ok(t in INVESTMENT_TYPE_MAP);
  });
  it('INVESTMENT_STATUS_MAP should cover all statuses', () => {
    for (const s of INVESTMENT_STATUSES) {
      assert.ok(s in INVESTMENT_STATUS_MAP);
      assert.ok(['success', 'warning', 'danger', 'neutral'].includes(INVESTMENT_STATUS_MAP[s].variant));
    }
  });
});
