/**
 * customers-data.ts — admin-web 客户管理 mock 数据
 *
 * 门店视角客户管理：会员/散客区分、消费行为、画像标签
 */

export type CustomerStatus = 'active' | 'inactive' | 'blocked' | 'churned'
export type CustomerSource = 'walkin' | 'referral' | 'social' | 'online' | 'partner'
export type CustomerGender = 'male' | 'female' | 'unknown'
export type MemberLevel = 'none' | 'bronze' | 'silver' | 'gold' | 'diamond'

export interface CustomerRecord {
  id: string
  name: string
  phone: string
  gender: CustomerGender
  memberLevel: MemberLevel
  status: CustomerStatus
  source: CustomerSource
  totalVisits: number
  totalSpent: number
  lastVisit: string
  registeredAt: string
  birthDate: string
  age: number
  city: string
  tags: string[]
  remark: string
}

export interface CustomerStats {
  total: number
  active: number
  totalSpent: number
  diamond: number
}

export interface CustomersPageSnapshot {
  deliveryMode: 'api' | 'fallback'
  sourceLabel: 'customers-api-live' | 'customers-local-snapshot'
  generatedAt: string
  controlPlaneSource: string
  businessDataSource: string
  refreshPath: string
  note: string
  error?: string
  customers: CustomerRecord[]
  stats: CustomerStats
}

export type StatusBadgeVariant = 'success' | 'warning' | 'danger' | 'neutral'
export type MemberLevelBadgeVariant = 'neutral' | 'default' | 'success' | 'info'

export const CUSTOMER_STATUS_MAP: Record<CustomerStatus, { label: string; variant: StatusBadgeVariant }> = {
  active: { label: '活跃', variant: 'success' },
  inactive: { label: '沉默', variant: 'warning' },
  blocked: { label: '冻结', variant: 'danger' },
  churned: { label: '流失', variant: 'neutral' },
}

export const CUSTOMER_SOURCE_MAP: Record<CustomerSource, string> = {
  walkin: '自然到店',
  referral: '朋友推荐',
  social: '社交平台',
  online: '线上渠道',
  partner: '异业合作',
}

export const MEMBER_LEVEL_MAP: Record<MemberLevel, { label: string; variant: MemberLevelBadgeVariant }> = {
  none: { label: '非会员', variant: 'neutral' },
  bronze: { label: '青铜会员', variant: 'default' },
  silver: { label: '白银会员', variant: 'neutral' },
  gold: { label: '黄金会员', variant: 'success' },
  diamond: { label: '钻石会员', variant: 'info' },
}

export const GENDER_LABEL: Record<CustomerGender, string> = {
  male: '男',
  female: '女',
  unknown: '未知',
}

export const CUSTOMER_STATUSES: CustomerStatus[] = ['active', 'inactive', 'blocked', 'churned']
export const CUSTOMER_SOURCES: CustomerSource[] = ['walkin', 'referral', 'social', 'online', 'partner']
export const MEMBER_LEVELS: MemberLevel[] = ['none', 'bronze', 'silver', 'gold', 'diamond']

export const MOCK_CUSTOMERS: CustomerRecord[] = [
  {
    id: 'c-001', name: '张明', phone: '138****0001', gender: 'male',
    memberLevel: 'gold', status: 'active', source: 'walkin',
    totalVisits: 42, totalSpent: 15800, lastVisit: '2026-07-18',
    registeredAt: '2024-03-10', birthDate: '1990-05-15', age: 36,
    city: '广州', tags: ['高消费', '常客'], remark: '周末常带家人来',
  },
  {
    id: 'c-002', name: '李芳', phone: '139****0002', gender: 'female',
    memberLevel: 'diamond', status: 'active', source: 'referral',
    totalVisits: 89, totalSpent: 52000, lastVisit: '2026-07-19',
    registeredAt: '2023-06-01', birthDate: '1988-11-22', age: 37,
    city: '深圳', tags: ['VIP', '高消费', '活跃'], remark: '每月到店8次以上',
  },
  {
    id: 'c-003', name: '王浩', phone: '137****0003', gender: 'male',
    memberLevel: 'silver', status: 'active', source: 'social',
    totalVisits: 15, totalSpent: 3800, lastVisit: '2026-07-10',
    registeredAt: '2025-02-14', birthDate: '1995-08-03', age: 30,
    city: '东莞', tags: ['新客'], remark: '',
  },
  {
    id: 'c-004', name: '陈雪', phone: '158****0004', gender: 'female',
    memberLevel: 'none', status: 'inactive', source: 'walkin',
    totalVisits: 3, totalSpent: 450, lastVisit: '2026-05-01',
    registeredAt: '2026-01-20', birthDate: '2000-02-28', age: 26,
    city: '广州', tags: [], remark: '近2月未到店',
  },
  {
    id: 'c-005', name: '赵刚', phone: '136****0005', gender: 'male',
    memberLevel: 'gold', status: 'blocked', source: 'online',
    totalVisits: 28, totalSpent: 9500, lastVisit: '2026-04-15',
    registeredAt: '2024-08-05', birthDate: '1992-12-10', age: 33,
    city: '佛山', tags: ['高消费'], remark: '涉嫌违规操作',
  },
  {
    id: 'c-006', name: '刘洋', phone: '150****0006', gender: 'female',
    memberLevel: 'bronze', status: 'active', source: 'referral',
    totalVisits: 8, totalSpent: 1200, lastVisit: '2026-07-16',
    registeredAt: '2025-11-03', birthDate: '1998-07-25', age: 27,
    city: '深圳', tags: ['新客'], remark: '',
  },
  {
    id: 'c-007', name: '周婷', phone: '159****0007', gender: 'female',
    memberLevel: 'silver', status: 'inactive', source: 'partner',
    totalVisits: 12, totalSpent: 3100, lastVisit: '2026-03-20',
    registeredAt: '2024-12-01', birthDate: '1993-09-14', age: 32,
    city: '广州', tags: ['沉睡'], remark: '超90天未到店',
  },
  {
    id: 'c-008', name: '孙磊', phone: '188****0008', gender: 'male',
    memberLevel: 'diamond', status: 'active', source: 'social',
    totalVisits: 65, totalSpent: 42000, lastVisit: '2026-07-19',
    registeredAt: '2023-10-15', birthDate: '1985-04-08', age: 41,
    city: '珠海', tags: ['VIP', '高消费', '活跃'], remark: '企业团购客户',
  },
  {
    id: 'c-009', name: '吴娟', phone: '186****0009', gender: 'female',
    memberLevel: 'none', status: 'churned', source: 'walkin',
    totalVisits: 2, totalSpent: 180, lastVisit: '2025-12-10',
    registeredAt: '2025-10-01', birthDate: '2001-06-30', age: 25,
    city: '惠州', tags: [], remark: '超过6个月未到店',
  },
  {
    id: 'c-010', name: '郑强', phone: '182****0010', gender: 'male',
    memberLevel: 'gold', status: 'active', source: 'online',
    totalVisits: 35, totalSpent: 12800, lastVisit: '2026-07-17',
    registeredAt: '2024-05-20', birthDate: '1991-01-18', age: 35,
    city: '广州', tags: ['高消费', '常客'], remark: '娃娃机爱好者',
  },
  {
    id: 'c-011', name: '黄丽', phone: '135****0011', gender: 'female',
    memberLevel: 'silver', status: 'active', source: 'referral',
    totalVisits: 22, totalSpent: 5600, lastVisit: '2026-07-14',
    registeredAt: '2024-09-10', birthDate: '1996-03-21', age: 30,
    city: '深圳', tags: ['活跃'], remark: '',
  },
  {
    id: 'c-012', name: '何文', phone: '131****0012', gender: 'male',
    memberLevel: 'bronze', status: 'churned', source: 'walkin',
    totalVisits: 5, totalSpent: 680, lastVisit: '2025-10-05',
    registeredAt: '2025-05-15', birthDate: '1994-10-12', age: 31,
    city: '佛山', tags: [], remark: '已流失',
  },
]

interface CrmCustomerRecord {
  id?: string
  name?: string
  email?: string
  phone?: string
  status?: 'active' | 'inactive' | 'churned' | 'lead'
  engagementScore?: number
  totalSpentCents?: number
  visitCount?: number
  lastVisitAt?: string
  tags?: string[]
  createdAt?: string
  updatedAt?: string
}

interface CrmCustomersResponse {
  customers?: CrmCustomerRecord[]
  total?: number
}

interface CrmStatsResponse {
  totalCustomers?: number
  activeCustomers?: number
  totalSpent?: number
}

const DEFAULT_API_ORIGIN = 'http://localhost:3001'

function ensureTrailingSlash(value: string): string {
  return value.endsWith('/') ? value : `${value}/`
}

function resolveCustomersApiBaseUrl(): string {
  const configured =
    process.env.M5_API_BASE_URL ??
    process.env.NEXT_PUBLIC_M5_API_BASE_URL ??
    process.env.NEXT_PUBLIC_API_URL ??
    DEFAULT_API_ORIGIN

  const normalized = configured.trim()
  if (!normalized.length) {
    return `${DEFAULT_API_ORIGIN}/api/`
  }
  if (normalized.endsWith('/api') || normalized.endsWith('/api/')) {
    return ensureTrailingSlash(normalized)
  }
  if (normalized.endsWith('/api/v1') || normalized.endsWith('/api/v1/')) {
    return ensureTrailingSlash(normalized.replace(/\/v1\/?$/, '/'))
  }
  return ensureTrailingSlash(`${normalized.replace(/\/$/, '')}/api`)
}

function unwrapApiPayload<T>(payload: unknown): T {
  if (payload && typeof payload === 'object' && 'success' in payload && 'data' in payload) {
    const wrapped = payload as { success?: boolean; data?: T; message?: string }
    if (!wrapped.success) {
      throw new Error(wrapped.message ?? 'API error')
    }
    return wrapped.data as T
  }
  return payload as T
}

async function fetchCustomersPart<T>(path: string): Promise<T> {
  const upstreamUrl = new URL(path, resolveCustomersApiBaseUrl()).toString()
  const response = await fetch(upstreamUrl, {
    method: 'GET',
    cache: 'no-store',
  })
  if (!response.ok) {
    throw new Error(`customers upstream failed: ${response.status}`)
  }
  const payload = await response.json()
  return unwrapApiPayload<T>(payload)
}

function normalizeDate(value: string | undefined, fallback: string): string {
  if (typeof value !== 'string' || !value.trim()) {
    return fallback
  }
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    return value
  }
  return parsed.toISOString().slice(0, 10)
}

function inferMemberLevel(score: number, totalSpent: number, fallback?: CustomerRecord): MemberLevel {
  if (fallback) {
    return fallback.memberLevel
  }
  if (score >= 90 || totalSpent >= 40_000) return 'diamond'
  if (score >= 75 || totalSpent >= 12_000) return 'gold'
  if (score >= 45 || totalSpent >= 4_000) return 'silver'
  if (score >= 20 || totalSpent >= 800) return 'bronze'
  return 'none'
}

function mapCrmStatus(status: CrmCustomerRecord['status'], fallback?: CustomerRecord): CustomerStatus {
  switch (status) {
    case 'active':
      return 'active'
    case 'inactive':
      return 'inactive'
    case 'churned':
      return 'churned'
    case 'lead':
      return 'inactive'
    default:
      return fallback?.status ?? 'inactive'
  }
}

function inferCustomerSource(record: CrmCustomerRecord, fallback?: CustomerRecord): CustomerSource {
  if (fallback) {
    return fallback.source
  }
  const tags = new Set((record.tags ?? []).map((tag) => tag.toLowerCase()))
  if (tags.has('vip') || tags.has('企业团购客户')) return 'partner'
  if (tags.has('潜在客户')) return 'online'
  if (tags.has('高消费') || tags.has('活跃')) return 'referral'
  return 'walkin'
}

function findFallbackCustomer(record: CrmCustomerRecord): CustomerRecord | undefined {
  const normalizedPhone = record.phone?.replace(/\D/g, '').slice(-4)
  return MOCK_CUSTOMERS.find((customer) => {
    if (record.name && customer.name === record.name) {
      return true
    }
    if (!normalizedPhone) {
      return false
    }
    return customer.phone.replace(/\D/g, '').slice(-4) === normalizedPhone
  })
}

function mapCrmCustomer(record: CrmCustomerRecord, index: number): CustomerRecord {
  const fallback = findFallbackCustomer(record)
  const totalSpent = Math.round((record.totalSpentCents ?? 0) / 100)
  const registeredAt = normalizeDate(record.createdAt, fallback?.registeredAt ?? '—')
  const lastVisit = normalizeDate(
    record.lastVisitAt || record.updatedAt,
    fallback?.lastVisit ?? registeredAt
  )
  const age = fallback?.age ?? 0
  const birthDate = fallback?.birthDate ?? '—'

  return {
    id: record.id ?? fallback?.id ?? `c-api-${String(index + 1).padStart(3, '0')}`,
    name: record.name ?? fallback?.name ?? `客户 ${index + 1}`,
    phone: record.phone ?? fallback?.phone ?? '—',
    gender: fallback?.gender ?? 'unknown',
    memberLevel: inferMemberLevel(record.engagementScore ?? 0, totalSpent, fallback),
    status: mapCrmStatus(record.status, fallback),
    source: inferCustomerSource(record, fallback),
    totalVisits: Number(record.visitCount ?? fallback?.totalVisits ?? 0),
    totalSpent: totalSpent > 0 ? totalSpent : fallback?.totalSpent ?? 0,
    lastVisit,
    registeredAt,
    birthDate,
    age,
    city: fallback?.city ?? '—',
    tags: record.tags && record.tags.length > 0 ? record.tags : fallback?.tags ?? [],
    remark:
      fallback?.remark ??
      (record.status === 'lead'
        ? '真实 CRM 客户线索，客户画像字段仍由 fallback 样本补全。'
        : ''),
  }
}

function getLatestCustomerTimestamp(items: CustomerRecord[]): string {
  const latest = items
    .flatMap((customer) => [customer.lastVisit, customer.registeredAt])
    .filter((value) => value && value !== '—')
    .sort()
  return latest.at(-1) ?? new Date().toISOString()
}

function buildFallbackCustomersSnapshot(error?: string): CustomersPageSnapshot {
  return {
    deliveryMode: 'fallback',
    sourceLabel: 'customers-local-snapshot',
    generatedAt: '2026-07-27T15:10:00Z',
    controlPlaneSource: 'loadCustomersSnapshot -> MOCK_CUSTOMERS fallback',
    businessDataSource: 'local customer workspace samples',
    refreshPath: 'CustomersPage -> loadCustomersSnapshot',
    note: '当前客户管理页展示的是本地样本快照，已显式暴露来源态与刷新路径，不可作为实时复签证据。',
    error,
    customers: MOCK_CUSTOMERS,
    stats: computeCustomerStats(MOCK_CUSTOMERS),
  }
}

export function formatCustomerCurrency(amount: number): string {
  if (amount >= 1_000_000) return `¥${(amount / 10_000).toFixed(1)}万`
  if (amount >= 1_000) return `¥${(amount / 1000).toFixed(1)}K`
  return `¥${amount}`
}

export function filterCustomers(
  items: CustomerRecord[],
  search: string,
  statusFilter: CustomerStatus | 'all',
  levelFilter: MemberLevel | 'all'
): CustomerRecord[] {
  let result = items

  if (search.trim()) {
    const lower = search.toLowerCase()
    const searchFields: Array<keyof CustomerRecord> = ['name', 'phone', 'city']
    result = result.filter((customer) =>
      searchFields.some((field) =>
        String(customer[field]).toLowerCase().includes(lower)
      )
    )
  }

  if (statusFilter !== 'all') {
    result = result.filter((customer) => customer.status === statusFilter)
  }

  if (levelFilter !== 'all') {
    result = result.filter((customer) => customer.memberLevel === levelFilter)
  }

  return result
}

export function computeCustomerStats(items: CustomerRecord[]): CustomerStats {
  return {
    total: items.length,
    active: items.filter((customer) => customer.status === 'active').length,
    totalSpent: items.reduce((sum, customer) => sum + customer.totalSpent, 0),
    diamond: items.filter((customer) => customer.memberLevel === 'diamond').length,
  }
}

export async function loadCustomersSnapshot(): Promise<CustomersPageSnapshot> {
  try {
    const [customersData, statsData] = await Promise.all([
      fetchCustomersPart<CrmCustomersResponse>('crm/customers'),
      fetchCustomersPart<CrmStatsResponse>('crm/stats').catch(() => null),
    ])

    const customers = (customersData.customers ?? []).map(mapCrmCustomer)
    if (customers.length > 0) {
      return {
        deliveryMode: 'api',
        sourceLabel: 'customers-api-live',
        generatedAt: getLatestCustomerTimestamp(customers),
        controlPlaneSource: 'loadCustomersSnapshot -> crm/customers + crm/stats',
        businessDataSource:
          'crm upstream API response with fallback-enriched customer profile fields',
        refreshPath: 'CustomersPage -> loadCustomersSnapshot',
        note:
          '当前客户管理页优先消费 CRM 实时快照；姓名/手机号/消费等主字段来自 API，画像补充字段不足时会保留 fallback 补洞。',
        customers,
        stats: {
          total: Number(statsData?.totalCustomers ?? customers.length),
          active: Number(
            statsData?.activeCustomers ??
              customers.filter((customer) => customer.status === 'active').length
          ),
          totalSpent: Number(
            typeof statsData?.totalSpent === 'number'
              ? Math.round(statsData.totalSpent / 100)
              : computeCustomerStats(customers).totalSpent
          ),
          diamond: customers.filter((customer) => customer.memberLevel === 'diamond').length,
        },
      }
    }
  } catch (error) {
    return buildFallbackCustomersSnapshot(
      error instanceof Error
        ? `${error.message}，已切换到 fallback 样本数据。`
        : 'customers 实时接口不可达，已切换到 fallback 样本数据。'
    )
  }

  return buildFallbackCustomersSnapshot(
    'customers 实时接口返回空列表，已切换到 fallback 样本数据。'
  )
}
