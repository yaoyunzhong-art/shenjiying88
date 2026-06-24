// ---- 租户管理数据类型与 Mock 数据 ----

export interface TenantItem {
  id: string;
  code: string;
  name: string;
  marketCode: string;
  status: 'active' | 'inactive' | 'pending' | 'suspended';
  storeCount: number;
  brandCount: number;
  adminCount: number;
  lastDeployed: string;
  plan: 'enterprise' | 'professional' | 'starter';
  billingMode: 'monthly' | 'yearly';
}

export interface TenantDetail extends TenantItem {
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  registeredAt: string;
  timezone: string;
  description: string;
}

export type TenantStatus = TenantItem['status'];
export type TenantPlan = TenantItem['plan'];
export type TenantBillingMode = TenantItem['billingMode'];

export const TENANT_STATUS_MAP: Record<TenantStatus, { label: string; variant: 'success' | 'warning' | 'danger' | 'neutral' }> = {
  active: { label: '运营中', variant: 'success' },
  inactive: { label: '已停用', variant: 'neutral' },
  pending: { label: '待激活', variant: 'warning' },
  suspended: { label: '已暂停', variant: 'danger' },
};

export const TENANT_PLAN_MAP: Record<TenantPlan, { label: string; variant: 'success' | 'neutral' | 'warning' }> = {
  enterprise: { label: '企业版', variant: 'success' },
  professional: { label: '专业版', variant: 'neutral' },
  starter: { label: '入门版', variant: 'warning' },
};

export const TENANT_BILLING_MAP: Record<TenantBillingMode, string> = {
  monthly: '月付',
  yearly: '年付',
};

export const MOCK_TENANTS: TenantItem[] = [
  { id: 't1', code: 'TNT-001', name: '华润万象生活', marketCode: 'cn-mainland', status: 'active', storeCount: 5, brandCount: 3, adminCount: 12, lastDeployed: '2026-06-12 14:30', plan: 'enterprise', billingMode: 'yearly' },
  { id: 't2', code: 'TNT-002', name: '龙湖集团', marketCode: 'cn-mainland', status: 'active', storeCount: 4, brandCount: 2, adminCount: 8, lastDeployed: '2026-06-12 10:15', plan: 'enterprise', billingMode: 'yearly' },
  { id: 't3', code: 'TNT-003', name: '大悦城控股', marketCode: 'cn-mainland', status: 'active', storeCount: 3, brandCount: 2, adminCount: 6, lastDeployed: '2026-06-11 09:00', plan: 'professional', billingMode: 'monthly' },
  { id: 't4', code: 'TNT-004', name: '太古地产', marketCode: 'cn-mainland', status: 'pending', storeCount: 1, brandCount: 1, adminCount: 3, lastDeployed: '2026-06-11 15:20', plan: 'starter', billingMode: 'monthly' },
  { id: 't5', code: 'TNT-005', name: '恒隆地产', marketCode: 'cn-mainland', status: 'suspended', storeCount: 2, brandCount: 1, adminCount: 4, lastDeployed: '2026-06-10 11:00', plan: 'professional', billingMode: 'yearly' },
  { id: 't6', code: 'TNT-006', name: 'Westfield Corp', marketCode: 'us-default', status: 'active', storeCount: 6, brandCount: 4, adminCount: 15, lastDeployed: '2026-06-12 08:30', plan: 'enterprise', billingMode: 'yearly' },
  { id: 't7', code: 'TNT-007', name: 'Simon Property Group', marketCode: 'us-default', status: 'active', storeCount: 4, brandCount: 3, adminCount: 10, lastDeployed: '2026-06-12 12:00', plan: 'enterprise', billingMode: 'monthly' },
  { id: 't8', code: 'TNT-008', name: 'Hammerson Plc', marketCode: 'uk-default', status: 'pending', storeCount: 1, brandCount: 1, adminCount: 2, lastDeployed: '2026-06-11 14:00', plan: 'starter', billingMode: 'monthly' },
  { id: 't9', code: 'TNT-009', name: '万达集团', marketCode: 'cn-mainland', status: 'active', storeCount: 8, brandCount: 5, adminCount: 18, lastDeployed: '2026-06-12 16:45', plan: 'enterprise', billingMode: 'yearly' },
  { id: 't10', code: 'TNT-010', name: '新鸿基地产', marketCode: 'cn-mainland', status: 'active', storeCount: 3, brandCount: 2, adminCount: 7, lastDeployed: '2026-06-12 13:45', plan: 'professional', billingMode: 'yearly' },
  { id: 't11', code: 'TNT-011', name: '万科印力', marketCode: 'cn-mainland', status: 'active', storeCount: 5, brandCount: 3, adminCount: 9, lastDeployed: '2026-06-12 09:30', plan: 'professional', billingMode: 'monthly' },
  { id: 't12', code: 'TNT-012', name: '新城控股', marketCode: 'cn-mainland', status: 'pending', storeCount: 2, brandCount: 1, adminCount: 3, lastDeployed: '2026-06-11 14:00', plan: 'starter', billingMode: 'monthly' },
  { id: 't13', code: 'TNT-013', name: 'Brookfield Properties', marketCode: 'us-default', status: 'active', storeCount: 3, brandCount: 2, adminCount: 8, lastDeployed: '2026-06-12 07:00', plan: 'professional', billingMode: 'yearly' },
  { id: 't14', code: 'TNT-014', name: 'Landsec Group', marketCode: 'uk-default', status: 'inactive', storeCount: 1, brandCount: 1, adminCount: 2, lastDeployed: '2026-06-09 18:00', plan: 'starter', billingMode: 'monthly' },
  { id: 't15', code: 'TNT-015', name: '银泰商业', marketCode: 'cn-mainland', status: 'active', storeCount: 4, brandCount: 3, adminCount: 8, lastDeployed: '2026-06-12 11:30', plan: 'enterprise', billingMode: 'yearly' },
];

export const TENANT_LIST_SEARCH_FIELDS: (keyof TenantItem)[] = ['code', 'name', 'marketCode'];

export const TENANT_LIST_COLUMN_KEYS = [
  'code', 'name', 'plan', 'marketCode', 'status',
  'storeCount', 'brandCount', 'adminCount', 'billingMode', 'lastDeployed',
] as const;

export const TENANT_LIST_PRESET = {
  defaultPageSize: 10,
  pageSizeOptions: [5, 10, 15, 20] as const,
  searchFields: TENANT_LIST_SEARCH_FIELDS,
  statuses: ['active', 'pending', 'inactive', 'suspended'] as const,
  plans: ['enterprise', 'professional', 'starter'] as const,
  billingModes: ['monthly', 'yearly'] as const,
  markets: ['cn-mainland', 'us-default', 'uk-default'] as const,
};

export const MOCK_TENANT_DETAILS: Record<string, TenantDetail> = {
  t1: { id: 't1', code: 'TNT-001', name: '华润万象生活', marketCode: 'cn-mainland', status: 'active', storeCount: 5, brandCount: 3, adminCount: 12, lastDeployed: '2026-06-12 14:30', plan: 'enterprise', billingMode: 'yearly', contactName: '张华润', contactEmail: 'zhanghr@cr-mixc.com', contactPhone: '+86-10-8888-1111', registeredAt: '2024-01-15', timezone: 'Asia/Shanghai', description: '华润万象生活是中国领先的物业管理及商业运营服务提供商，已在全国多个核心城市部署 M5 体系。' },
  t2: { id: 't2', code: 'TNT-002', name: '龙湖集团', marketCode: 'cn-mainland', status: 'active', storeCount: 4, brandCount: 2, adminCount: 8, lastDeployed: '2026-06-12 10:15', plan: 'enterprise', billingMode: 'yearly', contactName: '李龙湖', contactEmail: 'lilh@longfor.com', contactPhone: '+86-23-6666-2222', registeredAt: '2024-03-20', timezone: 'Asia/Shanghai', description: '龙湖集团以商业运营为核心，在全国布局多个天街系商业综合体。' },
  t3: { id: 't3', code: 'TNT-003', name: '大悦城控股', marketCode: 'cn-mainland', status: 'active', storeCount: 3, brandCount: 2, adminCount: 6, lastDeployed: '2026-06-11 09:00', plan: 'professional', billingMode: 'monthly', contactName: '王悦城', contactEmail: 'wangyc@joycity.com', contactPhone: '+86-10-5555-3333', registeredAt: '2024-06-01', timezone: 'Asia/Shanghai', description: '大悦城控股专注于年轻消费群体，打造潮流生活方式的商业地产品牌。' },
  t6: { id: 't6', code: 'TNT-006', name: 'Westfield Corp', marketCode: 'us-default', status: 'active', storeCount: 6, brandCount: 4, adminCount: 15, lastDeployed: '2026-06-12 08:30', plan: 'enterprise', billingMode: 'yearly', contactName: 'John Westfield', contactEmail: 'john.westfield@westfield.com', contactPhone: '+1-310-555-0100', registeredAt: '2024-02-01', timezone: 'America/Los_Angeles', description: 'Westfield is a global leader in retail real estate with flagship shopping centers across the US.' },
  t9: { id: 't9', code: 'TNT-009', name: '万达集团', marketCode: 'cn-mainland', status: 'active', storeCount: 8, brandCount: 5, adminCount: 18, lastDeployed: '2026-06-12 16:45', plan: 'enterprise', billingMode: 'yearly', contactName: '王万达', contactEmail: 'wangwd@wanda.com', contactPhone: '+86-10-9999-8888', registeredAt: '2023-11-01', timezone: 'Asia/Shanghai', description: '万达集团是中国最大的商业地产运营商，万达广场覆盖全国所有省份。' },
  t5: { id: 't5', code: 'TNT-005', name: '恒隆地产', marketCode: 'cn-mainland', status: 'suspended', storeCount: 2, brandCount: 1, adminCount: 4, lastDeployed: '2026-06-10 11:00', plan: 'professional', billingMode: 'yearly', contactName: '陈恒隆', contactEmail: 'chenchl@hanglung.com', contactPhone: '+86-21-4444-5555', registeredAt: '2024-07-15', timezone: 'Asia/Shanghai', description: '恒隆地产专注于高端商业地产，因系统升级暂时暂停运营。' },
};

export const TENANT_DETAIL_LABELS = {
  overviewTitle: '租户信息',
  code: '租户编码',
  name: '租户名称',
  marketCode: '所属市场',
  status: '运营状态',
  plan: '套餐',
  billingMode: '计费方式',
  timezone: '时区',
  contactName: '联系人',
  contactEmail: '联系邮箱',
  contactPhone: '联系电话',
  storeCount: '关联门店数',
  brandCount: '关联品牌数',
  adminCount: '管理员数',
  registeredAt: '注册时间',
  lastDeployed: '最后部署',
  description: '描述',
  editTitle: '编辑租户信息',
  saveButton: '保存修改',
  cancelButton: '取消',
  notFound: (id: string) => `租户 ${id} 不存在`,
  backToList: '返回租户列表',
} as const;

export function getTenantById(id: string): TenantDetail | undefined {
  return MOCK_TENANT_DETAILS[id];
}

export function computeTenantStats(tenants: TenantItem[]) {
  return {
    total: tenants.length,
    active: tenants.filter((t) => t.status === 'active').length,
    enterprise: tenants.filter((t) => t.plan === 'enterprise').length,
    markets: [...new Set(tenants.map((t) => t.marketCode))].length,
  };
}
