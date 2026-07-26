/**
 * customers-data.ts — 企业客户数据层
 *
 * 兼容既有详情/新建页使用的本地样本，同时为列表页提供 CRM 真数据映射。
 */

import { getDefaultApiBaseUrl } from '@m5/sdk';

export type CustomerStatus = 'active' | 'suspended' | 'pending' | 'churned';
export type CustomerTier = 'platinum' | 'gold' | 'silver' | 'standard';
export type CustomerIndustry = 'retail' | 'tech' | 'finance' | 'manufacturing' | 'healthcare' | 'education';

export interface CustomerItem {
  id: string;
  companyName: string;
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  industry: CustomerIndustry;
  tier: CustomerTier;
  status: CustomerStatus;
  totalContracts: number;
  activeContracts: number;
  monthlySpend: number;
  totalSpend: number;
  city: string;
  region: string;
  since: string;
  lastActivity: string;
}

export const CUSTOMER_STATUS_MAP: Record<CustomerStatus, { label: string; variant: 'success' | 'warning' | 'danger' | 'neutral' }> = {
  active: { label: '合作中', variant: 'success' },
  suspended: { label: '暂停', variant: 'warning' },
  pending: { label: '待审核', variant: 'neutral' },
  churned: { label: '已流失', variant: 'danger' },
};

export const CUSTOMER_TIER_MAP: Record<CustomerTier, { label: string; variant: 'success' | 'warning' | 'danger' | 'neutral' | 'info' }> = {
  platinum: { label: '铂金', variant: 'info' },
  gold: { label: '黄金', variant: 'warning' },
  silver: { label: '白银', variant: 'neutral' },
  standard: { label: '标准', variant: 'success' },
};

export const CUSTOMER_INDUSTRY_MAP: Record<CustomerIndustry, string> = {
  retail: '零售',
  tech: '科技',
  finance: '金融',
  manufacturing: '制造',
  healthcare: '医疗',
  education: '教育',
};

export const CUSTOMER_STATUSES: CustomerStatus[] = ['active', 'suspended', 'pending', 'churned'];
export const CUSTOMER_TIERS: CustomerTier[] = ['platinum', 'gold', 'silver', 'standard'];
export const CUSTOMER_INDUSTRIES: CustomerIndustry[] = ['retail', 'tech', 'finance', 'manufacturing', 'healthcare', 'education'];

export const MOCK_CUSTOMERS: CustomerItem[] = [
  {
    id: 'c-001',
    companyName: '云帆科技集团有限公司',
    contactName: '张伟',
    contactPhone: '13800138001',
    contactEmail: 'zhangwei@yunfan.com',
    industry: 'tech',
    tier: 'platinum',
    status: 'active',
    totalContracts: 12,
    activeContracts: 8,
    monthlySpend: 458000,
    totalSpend: 12600000,
    city: '北京',
    region: '华北',
    since: '2022-03-15',
    lastActivity: '2026-06-23',
  },
  {
    id: 'c-002',
    companyName: '星辰连锁超市',
    contactName: '李芳',
    contactPhone: '13900139002',
    contactEmail: 'lifang@xingchen.cn',
    industry: 'retail',
    tier: 'gold',
    status: 'active',
    totalContracts: 8,
    activeContracts: 6,
    monthlySpend: 216000,
    totalSpend: 5400000,
    city: '上海',
    region: '华东',
    since: '2023-01-20',
    lastActivity: '2026-06-22',
  },
  {
    id: 'c-003',
    companyName: '汇通金融信息有限公司',
    contactName: '王强',
    contactPhone: '13700137003',
    contactEmail: 'wangqiang@huitong.com',
    industry: 'finance',
    tier: 'platinum',
    status: 'active',
    totalContracts: 18,
    activeContracts: 14,
    monthlySpend: 685000,
    totalSpend: 22400000,
    city: '深圳',
    region: '华南',
    since: '2021-06-01',
    lastActivity: '2026-06-24',
  },
  {
    id: 'c-004',
    companyName: '明德教育科技有限公司',
    contactName: '赵敏',
    contactPhone: '15800158004',
    contactEmail: 'zhaomin@mingde.cn',
    industry: 'education',
    tier: 'silver',
    status: 'pending',
    totalContracts: 3,
    activeContracts: 1,
    monthlySpend: 45000,
    totalSpend: 320000,
    city: '广州',
    region: '华南',
    since: '2025-09-10',
    lastActivity: '2026-06-18',
  },
  {
    id: 'c-005',
    companyName: '博康医疗器械有限公司',
    contactName: '刘洋',
    contactPhone: '13600136005',
    contactEmail: 'liuyang@bokang.com',
    industry: 'healthcare',
    tier: 'gold',
    status: 'active',
    totalContracts: 7,
    activeContracts: 5,
    monthlySpend: 298000,
    totalSpend: 7800000,
    city: '成都',
    region: '西南',
    since: '2022-11-05',
    lastActivity: '2026-06-21',
  },
  {
    id: 'c-006',
    companyName: '鼎新制造集团',
    contactName: '陈军',
    contactPhone: '15000150006',
    contactEmail: 'chenjun@dingxin.cn',
    industry: 'manufacturing',
    tier: 'gold',
    status: 'active',
    totalContracts: 10,
    activeContracts: 7,
    monthlySpend: 375000,
    totalSpend: 9600000,
    city: '武汉',
    region: '华中',
    since: '2022-07-12',
    lastActivity: '2026-06-20',
  },
  {
    id: 'c-007',
    companyName: '瑞丰连锁便利店',
    contactName: '周丽',
    contactPhone: '15900159007',
    contactEmail: 'zhoul@ruifeng.cn',
    industry: 'retail',
    tier: 'standard',
    status: 'suspended',
    totalContracts: 2,
    activeContracts: 0,
    monthlySpend: 0,
    totalSpend: 180000,
    city: '南京',
    region: '华东',
    since: '2025-04-18',
    lastActivity: '2026-05-30',
  },
  {
    id: 'c-008',
    companyName: '天翼信息技术有限公司',
    contactName: '孙浩',
    contactPhone: '18800188008',
    contactEmail: 'sunhao@tianyi.tech',
    industry: 'tech',
    tier: 'silver',
    status: 'active',
    totalContracts: 5,
    activeContracts: 4,
    monthlySpend: 128000,
    totalSpend: 2100000,
    city: '杭州',
    region: '华东',
    since: '2023-08-22',
    lastActivity: '2026-06-19',
  },
  {
    id: 'c-009',
    companyName: '华泰金融控股',
    contactName: '吴杰',
    contactPhone: '18600186009',
    contactEmail: 'wujie@huatai.fin',
    industry: 'finance',
    tier: 'platinum',
    status: 'active',
    totalContracts: 22,
    activeContracts: 18,
    monthlySpend: 920000,
    totalSpend: 38500000,
    city: '北京',
    region: '华北',
    since: '2020-12-01',
    lastActivity: '2026-06-24',
  },
  {
    id: 'c-010',
    companyName: '碧源环保科技',
    contactName: '郑洁',
    contactPhone: '18200182010',
    contactEmail: 'zhengjie@biyuan.cn',
    industry: 'manufacturing',
    tier: 'standard',
    status: 'pending',
    totalContracts: 1,
    activeContracts: 0,
    monthlySpend: 0,
    totalSpend: 85000,
    city: '西安',
    region: '西北',
    since: '2026-03-01',
    lastActivity: '2026-06-15',
  },
  {
    id: 'c-011',
    companyName: '阳光教育集团',
    contactName: '黄磊',
    contactPhone: '13500135011',
    contactEmail: 'huanglei@yangguang.cn',
    industry: 'education',
    tier: 'gold',
    status: 'active',
    totalContracts: 6,
    activeContracts: 5,
    monthlySpend: 189000,
    totalSpend: 4100000,
    city: '郑州',
    region: '华中',
    since: '2023-04-10',
    lastActivity: '2026-06-20',
  },
  {
    id: 'c-012',
    companyName: '中科智造',
    contactName: '何明',
    contactPhone: '13100131012',
    contactEmail: 'heming@zkzz.cn',
    industry: 'manufacturing',
    tier: 'silver',
    status: 'churned',
    totalContracts: 4,
    activeContracts: 0,
    monthlySpend: 0,
    totalSpend: 650000,
    city: '重庆',
    region: '西南',
    since: '2024-02-14',
    lastActivity: '2026-04-01',
  },
  {
    id: 'c-013',
    companyName: '仁心医疗科技',
    contactName: '林琳',
    contactPhone: '13300133013',
    contactEmail: 'linlin@renxin.com',
    industry: 'healthcare',
    tier: 'gold',
    status: 'active',
    totalContracts: 9,
    activeContracts: 7,
    monthlySpend: 356000,
    totalSpend: 8900000,
    city: '长沙',
    region: '华中',
    since: '2022-09-20',
    lastActivity: '2026-06-22',
  },
  {
    id: 'c-014',
    companyName: '远见零售管理',
    contactName: '马超',
    contactPhone: '15300153014',
    contactEmail: 'machao@yuanjian.cn',
    industry: 'retail',
    tier: 'standard',
    status: 'active',
    totalContracts: 3,
    activeContracts: 2,
    monthlySpend: 68000,
    totalSpend: 920000,
    city: '青岛',
    region: '华东',
    since: '2024-07-08',
    lastActivity: '2026-06-17',
  },
  {
    id: 'c-015',
    companyName: '创云软件开发',
    contactName: '韩雪',
    contactPhone: '17700177015',
    contactEmail: 'hanxue@chuangyun.dev',
    industry: 'tech',
    tier: 'silver',
    status: 'active',
    totalContracts: 4,
    activeContracts: 3,
    monthlySpend: 96000,
    totalSpend: 1500000,
    city: '厦门',
    region: '东南',
    since: '2024-01-15',
    lastActivity: '2026-06-16',
  },
];

export type CustomerListStatus = 'active' | 'inactive' | 'churned' | 'lead';

export interface CustomerListItem {
  id: string;
  companyName: string;
  contactEmail: string;
  contactPhone: string;
  status: CustomerListStatus;
  engagementScore: number;
  totalSpentCents: number;
  visitCount: number;
  lastActivity: string;
  tags: string[];
}

export interface CustomerStatsSnapshot {
  total: number;
  byStatus: Record<CustomerListStatus, number>;
  avgScore: number;
  totalSpentCents: number;
  totalTickets: number;
}

export interface CustomersSnapshotDelivery {
  deliveryMode: 'api' | 'fallback';
  customers: CustomerListItem[];
  stats: CustomerStatsSnapshot;
  generatedAt: string;
  error?: string;
}

export const CUSTOMER_LIST_STATUS_MAP: Record<
  CustomerListStatus,
  { label: string; variant: 'success' | 'warning' | 'danger' | 'neutral' }
> = {
  active: { label: '活跃', variant: 'success' },
  inactive: { label: '沉默', variant: 'warning' },
  churned: { label: '已流失', variant: 'danger' },
  lead: { label: '线索', variant: 'neutral' },
};

export const CUSTOMER_LIST_STATUSES: CustomerListStatus[] = ['active', 'inactive', 'churned', 'lead'];

const DEFAULT_TENANT_ID = 'demo-tenant';

type CrmCustomerProfile = {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: CustomerListStatus;
  engagementScore: number;
  totalSpentCents: number;
  visitCount: number;
  lastVisitAt: string;
  tags?: string[];
  updatedAt?: string;
};

function ensureTrailingSlash(value: string): string {
  return value.endsWith('/') ? value : `${value}/`;
}

function resolveCustomersApiBaseUrl(): string {
  return ensureTrailingSlash(getDefaultApiBaseUrl().trim() || 'http://localhost:3001/api/v1');
}

function resolveTenantId(): string {
  const configured =
    process.env.M5_TOB_TENANT_ID ??
    process.env.NEXT_PUBLIC_M5_TOB_TENANT_ID ??
    process.env.M5_TENANT_ID ??
    process.env.NEXT_PUBLIC_M5_TENANT_ID ??
    DEFAULT_TENANT_ID;

  const normalized = configured.trim();
  return normalized.length > 0 ? normalized : DEFAULT_TENANT_ID;
}

function buildHeaders(): HeadersInit {
  return {
    'x-tenant-id': resolveTenantId(),
  };
}

function unwrapApiPayload<T>(payload: unknown): T {
  if (payload && typeof payload === 'object' && 'success' in payload && 'data' in payload) {
    const wrapped = payload as { success?: boolean; data?: T; message?: string };
    if (!wrapped.success) {
      throw new Error(wrapped.message ?? 'API error');
    }
    return wrapped.data as T;
  }
  return payload as T;
}

function mapLegacyStatus(status: CustomerStatus): CustomerListStatus {
  switch (status) {
    case 'active':
      return 'active';
    case 'churned':
      return 'churned';
    case 'suspended':
      return 'inactive';
    case 'pending':
      return 'lead';
    default:
      return 'lead';
  }
}

function mapCrmCustomer(item: CrmCustomerProfile): CustomerListItem {
  return {
    id: item.id,
    companyName: item.name,
    contactEmail: item.email,
    contactPhone: item.phone,
    status: item.status,
    engagementScore: item.engagementScore,
    totalSpentCents: item.totalSpentCents,
    visitCount: item.visitCount,
    lastActivity: item.lastVisitAt || item.updatedAt || '—',
    tags: Array.isArray(item.tags) ? item.tags : [],
  };
}

export function mapLegacyCustomerToListItem(item: CustomerItem): CustomerListItem {
  return {
    id: item.id,
    companyName: item.companyName,
    contactEmail: item.contactEmail,
    contactPhone: item.contactPhone,
    status: mapLegacyStatus(item.status),
    engagementScore: Math.min(100, item.activeContracts * 10 + (item.monthlySpend > 0 ? 20 : 0)),
    totalSpentCents: Math.round(item.totalSpend * 100),
    visitCount: item.totalContracts,
    lastActivity: item.lastActivity,
    tags: [CUSTOMER_TIER_MAP[item.tier].label, CUSTOMER_INDUSTRY_MAP[item.industry]],
  };
}

export function buildFallbackCustomerList(items: CustomerItem[] = MOCK_CUSTOMERS): CustomerListItem[] {
  return items.map(mapLegacyCustomerToListItem);
}

export function buildCustomerStats(customers: CustomerListItem[]): CustomerStatsSnapshot {
  const byStatus: Record<CustomerListStatus, number> = {
    active: 0,
    inactive: 0,
    churned: 0,
    lead: 0,
  };

  let totalScore = 0;
  let totalSpentCents = 0;

  for (const customer of customers) {
    byStatus[customer.status] += 1;
    totalScore += customer.engagementScore;
    totalSpentCents += customer.totalSpentCents;
  }

  return {
    total: customers.length,
    byStatus,
    avgScore: customers.length > 0 ? Math.round(totalScore / customers.length) : 0,
    totalSpentCents,
    totalTickets: 0,
  };
}

export function getLatestCustomerTimestamp(items: Array<Pick<CustomerListItem, 'lastActivity'>>): string {
  if (items.length === 0) {
    return '—';
  }

  return items.reduce(
    (latest, item) => (item.lastActivity > latest ? item.lastActivity : latest),
    items[0]!.lastActivity,
  );
}

async function fetchCustomers(): Promise<CustomerListItem[]> {
  const upstreamUrl = new URL('api/crm/customers', resolveCustomersApiBaseUrl()).toString();
  const response = await fetch(upstreamUrl, {
    method: 'GET',
    headers: buildHeaders(),
    cache: 'no-store',
  });
  if (!response.ok) {
    throw new Error(`crm customers upstream failed: ${response.status}`);
  }

  const payload = await response.json();
  const data = unwrapApiPayload<{ customers: CrmCustomerProfile[]; total: number }>(payload);
  return data.customers.map(mapCrmCustomer);
}

async function fetchCustomerStats(): Promise<CustomerStatsSnapshot> {
  const upstreamUrl = new URL('api/crm/stats', resolveCustomersApiBaseUrl()).toString();
  const response = await fetch(upstreamUrl, {
    method: 'GET',
    headers: buildHeaders(),
    cache: 'no-store',
  });
  if (!response.ok) {
    throw new Error(`crm stats upstream failed: ${response.status}`);
  }

  const payload = await response.json();
  return unwrapApiPayload<CustomerStatsSnapshot>(payload);
}

export async function loadCustomersSnapshot(): Promise<CustomersSnapshotDelivery> {
  try {
    const [customers, stats] = await Promise.all([fetchCustomers(), fetchCustomerStats()]);
    return {
      deliveryMode: 'api',
      customers,
      stats,
      generatedAt: new Date().toISOString(),
    };
  } catch {
    const customers = buildFallbackCustomerList();
    return {
      deliveryMode: 'fallback',
      customers,
      stats: buildCustomerStats(customers),
      generatedAt: getLatestCustomerTimestamp(customers),
      error: 'CRM 列表/统计接口不可达，已切换到 fallback 样本数据。',
    };
  }
}
