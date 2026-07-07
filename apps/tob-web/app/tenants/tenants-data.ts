// tenants-data.ts · 租户管理Mock数据
// Phase-FP T-FP-023 · 2026-07-02

export type TenantStatus = 'active' | 'suspended' | 'trial' | 'expired';

export interface Tenant {
  id: string;
  tenantCode: string;
  tenantName: string;
  contactPerson: string;
  contactEmail: string;
  contactPhone: string;
  region: string;
  city: string;
  brandCount: number;
  storeCount: number;
  memberCount: number;
  status: TenantStatus;
  createdAt: string;
  expiredAt?: string;
  plan: 'basic' | 'professional' | 'enterprise';
}

export const TENANT_STATUS_MAP: Record<TenantStatus, { label: string; variant: 'success' | 'warning' | 'error' | 'neutral' }> = {
  active: { label: '已开通', variant: 'success' },
  suspended: { label: '已停用', variant: 'error' },
  trial: { label: '试用中', variant: 'warning' },
  expired: { label: '已过期', variant: 'neutral' },
};

export const TENANT_STATUSES: TenantStatus[] = ['active', 'suspended', 'trial', 'expired'];

export const PLAN_LABELS: Record<Tenant['plan'], string> = {
  basic: '基础版',
  professional: '专业版',
  enterprise: '企业版',
};

export const PLAN_COLORS: Record<Tenant['plan'], string> = {
  basic: '#94a3b8',
  professional: '#60a5fa',
  enterprise: '#a78bfa',
};

export function formatNumber(num: number): string {
  if (num >= 10000) {
    return `${(num / 10000).toFixed(1)}万`;
  }
  return num.toLocaleString('zh-CN');
}

export const MOCK_TENANTS: Tenant[] = [
  {
    id: 't-001',
    tenantCode: 'TENANT-SZ-001',
    tenantName: '深圳华强科技集团',
    contactPerson: '张明辉',
    contactEmail: 'zhangmh@hqtech.com',
    contactPhone: '13800138001',
    region: '华南',
    city: '深圳',
    brandCount: 3,
    storeCount: 28,
    memberCount: 15800,
    status: 'active',
    createdAt: '2024-01-15',
    plan: 'enterprise',
  },
  {
    id: 't-002',
    tenantCode: 'TENANT-GZ-001',
    tenantName: '广州天河商业集团',
    contactPerson: '李美华',
    contactEmail: 'limh@tianhebiz.com',
    contactPhone: '13900139001',
    region: '华南',
    city: '广州',
    brandCount: 2,
    storeCount: 15,
    memberCount: 8200,
    status: 'active',
    createdAt: '2024-03-20',
    plan: 'professional',
  },
  {
    id: 't-003',
    tenantCode: 'TENANT-SH-001',
    tenantName: '上海浦东实业集团',
    contactPerson: '王建国',
    contactEmail: 'wangjg@pdgroup.com',
    contactPhone: '13700137001',
    region: '华东',
    city: '上海',
    brandCount: 4,
    storeCount: 42,
    memberCount: 25600,
    status: 'active',
    createdAt: '2023-11-10',
    plan: 'enterprise',
  },
  {
    id: 't-004',
    tenantCode: 'TENANT-BJ-001',
    tenantName: '北京朝阳贸易公司',
    contactPerson: '刘晓东',
    contactEmail: 'liuxd@cytrade.com',
    contactPhone: '13600136001',
    region: '华北',
    city: '北京',
    brandCount: 1,
    storeCount: 8,
    memberCount: 3200,
    status: 'trial',
    createdAt: '2026-06-01',
    expiredAt: '2026-07-01',
    plan: 'professional',
  },
  {
    id: 't-005',
    tenantCode: 'TENANT-CD-001',
    tenantName: '成都春熙路商业集团',
    contactPerson: '陈志强',
    contactEmail: 'chenzq@cxlbiz.com',
    contactPhone: '13500135001',
    region: '西南',
    city: '成都',
    brandCount: 2,
    storeCount: 18,
    memberCount: 9600,
    status: 'active',
    createdAt: '2024-05-15',
    plan: 'professional',
  },
  {
    id: 't-006',
    tenantCode: 'TENANT-HZ-001',
    tenantName: '杭州西湖科技集团',
    contactPerson: '周婷',
    contactEmail: 'zhout@xhkj.com',
    contactPhone: '13400134001',
    region: '华东',
    city: '杭州',
    brandCount: 1,
    storeCount: 6,
    memberCount: 2100,
    status: 'expired',
    createdAt: '2024-02-28',
    expiredAt: '2026-02-28',
    plan: 'basic',
  },
  {
    id: 't-007',
    tenantCode: 'TENANT-SZ-002',
    tenantName: '深圳南山创新科技',
    contactPerson: '吴海',
    contactEmail: 'wuh@nankj.com',
    contactPhone: '13300133001',
    region: '华南',
    city: '深圳',
    brandCount: 1,
    storeCount: 3,
    memberCount: 850,
    status: 'suspended',
    createdAt: '2024-08-01',
    plan: 'basic',
  },
  {
    id: 't-008',
    tenantCode: 'TENANT-NJ-001',
    tenantName: '南京鼓楼商贸集团',
    contactPerson: '孙丽华',
    contactEmail: 'sunlh@glmall.com',
    contactPhone: '13200132001',
    region: '华东',
    city: '南京',
    brandCount: 2,
    storeCount: 12,
    memberCount: 5800,
    status: 'active',
    createdAt: '2024-04-22',
    plan: 'professional',
  },
];
