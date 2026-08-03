export interface TenantDetail {
  id: string
  code: string
  name: string
  marketCode: string
  status: 'active' | 'inactive' | 'pending' | 'suspended'
  storeCount: number
  brandCount: number
  adminCount: number
  lastDeployed: string
  plan: 'enterprise' | 'professional' | 'starter'
  billingMode: 'monthly' | 'yearly'
  contactName: string
  contactEmail: string
  contactPhone: string
  registeredAt: string
  timezone: string
  description: string
}

export interface EditFormData {
  name: string
  contactName: string
  contactPhone: string
  contactEmail: string
  description: string
}

export interface EditFormErrors {
  name?: string
  contactName?: string
  contactPhone?: string
  contactEmail?: string
  description?: string
}

export type StatusVariant = 'success' | 'neutral' | 'warning' | 'danger'

export const STATUS_MAP: Record<TenantDetail['status'], { label: string; variant: StatusVariant }> = {
  active: { label: '运营中', variant: 'success' },
  inactive: { label: '已停用', variant: 'neutral' },
  pending: { label: '待激活', variant: 'warning' },
  suspended: { label: '已暂停', variant: 'danger' },
}

export const PLAN_MAP: Record<TenantDetail['plan'], { label: string; variant: StatusVariant }> = {
  enterprise: { label: '企业版', variant: 'success' },
  professional: { label: '专业版', variant: 'neutral' },
  starter: { label: '入门版', variant: 'warning' },
}

export const BILLING_MAP: Record<TenantDetail['billingMode'], string> = {
  monthly: '月付',
  yearly: '年付',
}

const TENANT_LOOKUP: Record<string, TenantDetail> = {
  t1: {
    id: 't1',
    code: 'TNT-001',
    name: '华润万象生活',
    marketCode: 'cn-mainland',
    status: 'active',
    storeCount: 5,
    brandCount: 3,
    adminCount: 12,
    lastDeployed: '2026-06-12 14:30',
    plan: 'enterprise',
    billingMode: 'yearly',
    contactName: '张华润',
    contactEmail: 'zhanghr@cr-mixc.com',
    contactPhone: '+86-10-8888-1111',
    registeredAt: '2024-01-15',
    timezone: 'Asia/Shanghai',
    description: '华润万象生活是中国领先的物业管理及商业运营服务提供商，已在全国多个核心城市部署 M5 体系。',
  },
  t2: {
    id: 't2',
    code: 'TNT-002',
    name: '龙湖集团',
    marketCode: 'cn-mainland',
    status: 'active',
    storeCount: 4,
    brandCount: 2,
    adminCount: 8,
    lastDeployed: '2026-06-12 10:15',
    plan: 'enterprise',
    billingMode: 'yearly',
    contactName: '李龙湖',
    contactEmail: 'lilh@longfor.com',
    contactPhone: '+86-23-6666-2222',
    registeredAt: '2024-03-20',
    timezone: 'Asia/Shanghai',
    description: '龙湖集团以商业运营为核心，在全国布局多个天街系商业综合体。',
  },
  t3: {
    id: 't3',
    code: 'TNT-003',
    name: '大悦城控股',
    marketCode: 'cn-mainland',
    status: 'active',
    storeCount: 3,
    brandCount: 2,
    adminCount: 6,
    lastDeployed: '2026-06-11 09:00',
    plan: 'professional',
    billingMode: 'monthly',
    contactName: '王悦城',
    contactEmail: 'wangyc@joycity.com',
    contactPhone: '+86-10-5555-3333',
    registeredAt: '2024-06-01',
    timezone: 'Asia/Shanghai',
    description: '大悦城控股专注于年轻消费群体，打造潮流生活方式的商业地产品牌。',
  },
  t5: {
    id: 't5',
    code: 'TNT-005',
    name: '恒隆地产',
    marketCode: 'cn-mainland',
    status: 'suspended',
    storeCount: 2,
    brandCount: 1,
    adminCount: 4,
    lastDeployed: '2026-06-10 11:00',
    plan: 'professional',
    billingMode: 'yearly',
    contactName: '陈恒隆',
    contactEmail: 'chenchl@hanglung.com',
    contactPhone: '+86-21-4444-5555',
    registeredAt: '2024-07-15',
    timezone: 'Asia/Shanghai',
    description: '恒隆地产专注于高端商业地产，因系统升级暂时暂停运营。',
  },
  t6: {
    id: 't6',
    code: 'TNT-006',
    name: 'Westfield Corp',
    marketCode: 'us-default',
    status: 'active',
    storeCount: 6,
    brandCount: 4,
    adminCount: 15,
    lastDeployed: '2026-06-12 08:30',
    plan: 'enterprise',
    billingMode: 'yearly',
    contactName: 'John Westfield',
    contactEmail: 'john.westfield@westfield.com',
    contactPhone: '+1-310-555-0100',
    registeredAt: '2024-02-01',
    timezone: 'America/Los_Angeles',
    description: 'Westfield is a global leader in retail real estate with flagship shopping centers across the US.',
  },
  t9: {
    id: 't9',
    code: 'TNT-009',
    name: '万达集团',
    marketCode: 'cn-mainland',
    status: 'active',
    storeCount: 8,
    brandCount: 5,
    adminCount: 18,
    lastDeployed: '2026-06-12 16:45',
    plan: 'enterprise',
    billingMode: 'yearly',
    contactName: '王万达',
    contactEmail: 'wangwd@wanda.com',
    contactPhone: '+86-10-9999-8888',
    registeredAt: '2023-11-01',
    timezone: 'Asia/Shanghai',
    description: '万达集团是中国最大的商业地产运营商，万达广场覆盖全国所有省份。',
  },
}

export interface TenantDetailSnapshot {
  deliveryMode: 'mock'
  sourceLabel: 'tenant-detail-mock'
  id: string
  generatedAt: string
  controlPlaneSource: string
  businessDataSource: string
  refreshPath: string
  note: string
  tenant: TenantDetail
}

export function getTenantById(id: string): TenantDetail {
  return TENANT_LOOKUP[id] ?? TENANT_LOOKUP.t1
}

export function validateForm(data: EditFormData): EditFormErrors {
  const errors: EditFormErrors = {}
  if (!data.name.trim()) errors.name = '租户名称不能为空'
  if (!data.contactName.trim()) errors.contactName = '联系人不能为空'
  if (!data.contactPhone.trim()) errors.contactPhone = '联系电话不能为空'
  if (data.contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.contactEmail)) {
    errors.contactEmail = '邮箱格式不正确'
  }
  return errors
}

export async function submitTenantEdit(form: EditFormData): Promise<{ success: boolean }> {
  void form
  await new Promise((resolve) => setTimeout(resolve, 800))
  return { success: true }
}

export async function loadTenantDetailSnapshot(id: string): Promise<TenantDetailSnapshot> {
  const tenant = getTenantById(id)
  return {
    deliveryMode: 'mock',
    sourceLabel: 'tenant-detail-mock',
    id,
    generatedAt: new Date().toISOString(),
    controlPlaneSource: 'loadTenantDetailSnapshot -> getTenantById()',
    businessDataSource: 'tenant detail local samples',
    refreshPath: `TenantDetailPage -> loadTenantDetailSnapshot(${id})`,
    note: `当前租户详情沿用本地样本快照，套餐为 ${PLAN_MAP[tenant.plan].label}，状态为 ${STATUS_MAP[tenant.status].label}。`,
    tenant,
  }
}
