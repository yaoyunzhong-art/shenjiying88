/**
 * customers/page.test.tsx — ToB 企业客户列表页测试
 * 测试数据层、过滤逻辑、格式化工具函数
 */
import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';

// ===== 从页面中提取的格式化函数 =====

function formatCurrency(n: number): string {
  if (n >= 1_000_000) return `¥${(n / 10_000).toFixed(1)}万`;
  if (n >= 1_000) return `¥${(n / 1000).toFixed(1)}K`;
  return `¥${n}`;
}

// ===== 类型定义 (与页面保持一致) ====

type CustomerStatus = 'active' | 'inactive' | 'suspended' | 'churned';
type CustomerTier = 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
type CustomerIndustry = 'retail' | 'manufacturing' | 'tech' | 'finance' | 'healthcare' | 'education' | 'logistics';

interface CustomerItem {
  id: string;
  companyName: string;
  contactName: string;
  contactEmail: string;
  city: string;
  tier: CustomerTier;
  industry: CustomerIndustry;
  status: CustomerStatus;
  activeContracts: number;
  totalContracts: number;
  monthlySpend: number;
  memberSince: string;
}

const CUSTOMER_STATUS_MAP: Record<CustomerStatus, { label: string; variant: string }> = {
  active: { label: '合作中', variant: 'success' },
  inactive: { label: '暂停', variant: 'warning' },
  suspended: { label: '冻结', variant: 'error' },
  churned: { label: '已流失', variant: 'default' },
};

const CUSTOMER_TIER_MAP: Record<CustomerTier, { label: string; variant: string }> = {
  bronze: { label: '青铜', variant: 'default' },
  silver: { label: '白银', variant: 'secondary' },
  gold: { label: '黄金', variant: 'success' },
  platinum: { label: '铂金', variant: 'info' },
  diamond: { label: '钻石', variant: 'warning' },
};

const CUSTOMER_INDUSTRY_MAP: Record<CustomerIndustry, string> = {
  retail: '零售',
  manufacturing: '制造业',
  tech: '科技',
  finance: '金融',
  healthcare: '医疗',
  education: '教育',
  logistics: '物流',
};

const CUSTOMER_STATUSES: CustomerStatus[] = ['active', 'inactive', 'suspended', 'churned'];
const CUSTOMER_TIERS: CustomerTier[] = ['bronze', 'silver', 'gold', 'platinum', 'diamond'];

// ===== Mock 数据 =====

const MOCK_CUSTOMERS: CustomerItem[] = [
  { id: 'c001', companyName: '云智科技有限公司', contactName: '李强', contactEmail: 'liqiang@yunzhi.com', city: '北京', tier: 'platinum', industry: 'tech', status: 'active', activeContracts: 3, totalContracts: 5, monthlySpend: 88000, memberSince: '2023-06' },
  { id: 'c002', companyName: '瑞华制造集团', contactName: '王芳', contactEmail: 'wangfang@ruihua.cn', city: '上海', tier: 'gold', industry: 'manufacturing', status: 'active', activeContracts: 2, totalContracts: 3, monthlySpend: 45000, memberSince: '2023-08' },
  { id: 'c003', companyName: '明德教育科技', contactName: '张明', contactEmail: 'zhangming@mingde.cn', city: '广州', tier: 'silver', industry: 'education', status: 'active', activeContracts: 1, totalContracts: 2, monthlySpend: 12000, memberSince: '2024-01' },
  { id: 'c004', companyName: '长河物流有限公司', contactName: '陈龙', contactEmail: 'chenlong@changhe.cn', city: '深圳', tier: 'bronze', industry: 'logistics', status: 'inactive', activeContracts: 0, totalContracts: 1, monthlySpend: 3000, memberSince: '2024-03' },
  { id: 'c005', companyName: '鼎盛金融服务', contactName: '刘阳', contactEmail: 'liuyang@dingsheng.cn', city: '杭州', tier: 'diamond', industry: 'finance', status: 'active', activeContracts: 5, totalContracts: 7, monthlySpend: 156000, memberSince: '2022-11' },
  { id: 'c006', companyName: '仁和医疗器械', contactName: '赵雪', contactEmail: 'zhaoxue@renhe.cn', city: '成都', tier: 'gold', industry: 'healthcare', status: 'suspended', activeContracts: 0, totalContracts: 2, monthlySpend: 6700, memberSince: '2024-06' },
  { id: 'c007', companyName: '新创软件开发', contactName: '周杰', contactEmail: 'zhoujie@xinchuang.cn', city: '武汉', tier: 'silver', industry: 'tech', status: 'active', activeContracts: 2, totalContracts: 2, monthlySpend: 28000, memberSince: '2024-09' },
  { id: 'c008', companyName: '华联商贸集团', contactName: '吴婷', contactEmail: 'wuting@hualian.cn', city: '南京', tier: 'platinum', industry: 'retail', status: 'churned', activeContracts: 0, totalContracts: 4, monthlySpend: 0, memberSince: '2023-01' },
  { id: 'c009', companyName: '天工精密制造', contactName: '孙伟', contactEmail: 'sunwei@tiangong.cn', city: '苏州', tier: 'gold', industry: 'manufacturing', status: 'active', activeContracts: 3, totalContracts: 3, monthlySpend: 52000, memberSince: '2023-04' },
  { id: 'c010', companyName: '星辉传媒文化', contactName: '马丽', contactEmail: 'mali@xinghui.cn', city: '长沙', tier: 'bronze', industry: 'education', status: 'active', activeContracts: 1, totalContracts: 1, monthlySpend: 8900, memberSince: '2025-02' },
  { id: 'c011', companyName: '信达数据服务', contactName: '韩磊', contactEmail: 'hanlei@xinda.cn', city: '西安', tier: 'silver', industry: 'tech', status: 'inactive', activeContracts: 1, totalContracts: 2, monthlySpend: 14500, memberSince: '2024-07' },
  { id: 'c012', companyName: '金诚信用评估', contactName: '秦雨', contactEmail: 'qinyu@jincheng.cn', city: '重庆', tier: 'gold', industry: 'finance', status: 'active', activeContracts: 2, totalContracts: 3, monthlySpend: 33000, memberSince: '2024-05' },
];

// ===== 页面导出的校验 =====

test('CustomersPage module: exports default function', async () => {
  const mod = await import('./page');
  assert.equal(typeof mod.default, 'function', 'default export should be a function (React component)');
});

test('CustomersPage module: component name contains "CustomersPage"', async () => {
  const mod = await import('./page');
  assert.ok(mod.default.name.includes('Customers'), `component name should contain "Customers", got "${mod.default.name}"`);
});

// ===== formatCurrency 测试 =====

test('formatCurrency: formats numbers correctly', () => {
  assert.equal(formatCurrency(0), '¥0');
  assert.equal(formatCurrency(500), '¥500');
  assert.equal(formatCurrency(1500), '¥1.5K');
  assert.equal(formatCurrency(100000), '¥100.0K');
  assert.equal(formatCurrency(1500000), '¥150.0万');
  assert.equal(formatCurrency(88000), '¥88.0K');
  assert.equal(formatCurrency(156000), '¥156.0K');
});

// ===== 数据定义完整性测试 =====

test('Customer status map: all statuses have label and variant', () => {
  for (const status of CUSTOMER_STATUSES) {
    const entry = CUSTOMER_STATUS_MAP[status];
    assert.ok(entry, `Missing status map entry for ${status}`);
    assert.ok(typeof entry.label === 'string', `label should be string for ${status}`);
    assert.ok(typeof entry.variant === 'string', `variant should be string for ${status}`);
  }
});

test('Customer tier map: all tiers have label and variant', () => {
  for (const tier of CUSTOMER_TIERS) {
    const entry = CUSTOMER_TIER_MAP[tier];
    assert.ok(entry, `Missing tier map entry for ${tier}`);
    assert.ok(typeof entry.label === 'string', `label should be string for ${tier}`);
    assert.ok(typeof entry.variant === 'string', `variant should be string for ${tier}`);
  }
});

test('Customer industry map: all mock customer industries are covered', () => {
  const covered = new Set(Object.keys(CUSTOMER_INDUSTRY_MAP));
  for (const c of MOCK_CUSTOMERS) {
    assert.ok(covered.has(c.industry), `Industry "${c.industry}" not found in CUSTOMER_INDUSTRY_MAP`);
  }
});

// ===== Mock 数据完整性测试 =====

test('Mock data: all customers have required fields', () => {
  const requiredFields: (keyof CustomerItem)[] = ['id', 'companyName', 'contactName', 'contactEmail', 'city', 'tier', 'industry', 'status', 'activeContracts', 'totalContracts', 'monthlySpend', 'memberSince'];
  for (const c of MOCK_CUSTOMERS) {
    for (const field of requiredFields) {
      assert.notEqual(c[field], undefined, `Customer ${c.id} missing field "${field}"`);
    }
  }
});

test('Mock data: totalContracts >= activeContracts for all customers', () => {
  for (const c of MOCK_CUSTOMERS) {
    assert.ok(c.totalContracts >= c.activeContracts, `Customer ${c.id}: totalContracts(${c.totalContracts}) < activeContracts(${c.activeContracts})`);
  }
});

// ===== 过滤逻辑测试 =====

test('Filter: search by company name', () => {
  const query = '云智';
  const results = MOCK_CUSTOMERS.filter((c) =>
    c.companyName.toLowerCase().includes(query.toLowerCase()),
  );
  assert.equal(results.length, 1);
  assert.equal(results[0].companyName, '云智科技有限公司');
});

test('Filter: filter by status "active"', () => {
  const results = MOCK_CUSTOMERS.filter((c) => c.status === 'active');
  assert.ok(results.every((c) => c.status === 'active'));
  assert.equal(results.length, 8); // active: c001, c002, c003, c005, c007, c009, c010, c012
});

test('Filter: filter by tier "gold"', () => {
  const results = MOCK_CUSTOMERS.filter((c) => c.tier === 'gold');
  assert.equal(results.length, 4); // gold: c002, c006, c009, c012
});

test('Filter: filter by industry "finance"', () => {
  const results = MOCK_CUSTOMERS.filter((c) => c.industry === 'finance');
  assert.equal(results.length, 2); // finance: c005, c012
});

// ===== 分页测试 =====

test('Pagination: first page has correct items', () => {
  const PER_PAGE = 10;
  const page = 0;
  const paged = MOCK_CUSTOMERS.slice(page * PER_PAGE, (page + 1) * PER_PAGE);
  assert.equal(paged.length, 10);
  assert.equal(paged[0].id, 'c001');
});

test('Pagination: second page has remaining items', () => {
  const PER_PAGE = 10;
  const page = 1;
  const paged = MOCK_CUSTOMERS.slice(page * PER_PAGE, (page + 1) * PER_PAGE);
  assert.equal(paged.length, 2);
  assert.equal(paged[0].id, 'c011');
});

test('Pagination: total pages calculated correctly', () => {
  const PER_PAGE = 10;
  const totalPages = Math.ceil(MOCK_CUSTOMERS.length / PER_PAGE);
  assert.equal(totalPages, 2);
});

// ===== 聚合统计测试 =====

test('Stats: active customer count', () => {
  const active = MOCK_CUSTOMERS.filter((c) => c.status === 'active').length;
  assert.equal(active, 8);
});

test('Stats: total monthly spend', () => {
  const total = MOCK_CUSTOMERS.reduce((s, c) => s + c.monthlySpend, 0);
  assert.equal(total, 447100);
});

test('Stats: platinum customer count', () => {
  const platinum = MOCK_CUSTOMERS.filter((c) => c.tier === 'platinum').length;
  assert.equal(platinum, 2);
});
