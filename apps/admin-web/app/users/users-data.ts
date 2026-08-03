const DEFAULT_API_ORIGIN = 'http://localhost:3001'

export type UserRole =
  | 'super_admin'
  | 'store_manager'
  | 'staff'
  | 'finance'
  | 'marketing'
  | 'ops'
export type UserStatus = 'active' | 'inactive' | 'suspended'

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  permissions: string[]
  status: UserStatus
  store: string
  lastLogin: string
  createdAt: string
  phone: string
  loginCount: number
}

export interface UsersSnapshotDelivery {
  deliveryMode: 'api' | 'fallback'
  users: User[]
  generatedAt: string
  error?: string
}

export const ROLE_LABELS: Record<UserRole, string> = {
  super_admin: '超级管理员',
  store_manager: '店长',
  staff: '员工',
  finance: '财务',
  marketing: '营销',
  ops: '运维',
}

export const STATUS_MAP: Record<
  UserStatus,
  { label: string; variant: 'success' | 'error' | 'warning' }
> = {
  active: { label: '正常', variant: 'success' },
  inactive: { label: '已停用', variant: 'error' },
  suspended: { label: '已冻结', variant: 'warning' },
}

export const ALL_ROLES: UserRole[] = [
  'super_admin',
  'store_manager',
  'staff',
  'finance',
  'marketing',
  'ops',
]

export const MOCK_USERS: User[] = [
  { id: 'U001', name: '张明', email: 'zhangming@sportsant.net', role: 'super_admin', permissions: ['*', 'identity-access:write', 'user:write'], status: 'active', store: '总部', lastLogin: '2026-07-20 08:30', createdAt: '2024-01-01', phone: '13800001111', loginCount: 1286 },
  { id: 'U002', name: '李芳', email: 'lifang@store-a.com', role: 'store_manager', permissions: ['store:read', 'staff:read', 'staff:write'], status: 'active', store: '朝阳店', lastLogin: '2026-07-19 09:15', createdAt: '2024-03-15', phone: '13800002222', loginCount: 856 },
  { id: 'U003', name: '王伟', email: 'wangwei@store-a.com', role: 'staff', permissions: ['store:read', 'schedule:read'], status: 'active', store: '朝阳店', lastLogin: '2026-07-19 18:45', createdAt: '2024-06-01', phone: '13800003333', loginCount: 523 },
  { id: 'U004', name: '赵敏', email: 'zhaomin@finance.com', role: 'finance', permissions: ['finance:read', 'finance:export'], status: 'active', store: '总部', lastLogin: '2026-07-20 10:00', createdAt: '2024-05-20', phone: '13800004444', loginCount: 412 },
  { id: 'U005', name: '孙磊', email: 'sunlei@market.com', role: 'marketing', permissions: ['campaign:read', 'campaign:write'], status: 'active', store: '总部', lastLogin: '2026-07-19 16:20', createdAt: '2024-07-01', phone: '13800005555', loginCount: 367 },
  { id: 'U006', name: '周婷', email: 'zhouting@store-a.com', role: 'staff', permissions: ['store:read'], status: 'inactive', store: '朝阳店', lastLogin: '2026-06-30 12:00', createdAt: '2025-01-10', phone: '13800006666', loginCount: 189 },
  { id: 'U007', name: '吴强', email: 'wuqiang@ops.com', role: 'ops', permissions: ['monitor:read', 'alert:write'], status: 'active', store: '总部', lastLogin: '2026-07-20 07:50', createdAt: '2024-09-01', phone: '13800007777', loginCount: 634 },
  { id: 'U008', name: '郑浩', email: 'zhenghao@store-b.com', role: 'store_manager', permissions: ['store:read', 'staff:read'], status: 'suspended', store: '海淀店', lastLogin: '2026-07-10 14:30', createdAt: '2024-11-01', phone: '13800008888', loginCount: 278 },
  { id: 'U009', name: '陈雪', email: 'chenxue@store-b.com', role: 'staff', permissions: ['store:read', 'schedule:read'], status: 'active', store: '海淀店', lastLogin: '2026-07-19 14:10', createdAt: '2025-03-01', phone: '13800009999', loginCount: 145 },
  { id: 'U010', name: '刘洋', email: 'liuyang@store-c.com', role: 'staff', permissions: ['store:read', 'inventory:read'], status: 'active', store: '西单店', lastLogin: '2026-07-18 20:00', createdAt: '2025-02-15', phone: '13800001010', loginCount: 210 },
  { id: 'U011', name: '杨华', email: 'yanghua@store-c.com', role: 'staff', permissions: ['store:read'], status: 'active', store: '西单店', lastLogin: '2026-07-17 12:30', createdAt: '2025-04-01', phone: '13800001111', loginCount: 98 },
  { id: 'U012', name: '马鹏', email: 'mapeng@store-d.com', role: 'store_manager', permissions: ['store:read', 'staff:read', 'inventory:read'], status: 'active', store: '望京店', lastLogin: '2026-07-18 09:00', createdAt: '2025-03-15', phone: '13800001212', loginCount: 312 },
]

function ensureTrailingSlash(value: string): string {
  return value.endsWith('/') ? value : `${value}/`
}

function resolveUsersApiBaseUrl(): string {
  const configured =
    process.env.M5_API_BASE_URL ??
    process.env.NEXT_PUBLIC_M5_API_BASE_URL ??
    process.env.NEXT_PUBLIC_API_URL ??
    DEFAULT_API_ORIGIN

  const normalized = configured.trim()
  if (!normalized.length) {
    return `${DEFAULT_API_ORIGIN}/api/v1/`
  }
  if (normalized.endsWith('/api/v1') || normalized.endsWith('/api/v1/')) {
    return ensureTrailingSlash(normalized)
  }
  if (normalized.endsWith('/api') || normalized.endsWith('/api/')) {
    return ensureTrailingSlash(`${normalized.replace(/\/$/, '')}/v1`)
  }
  return ensureTrailingSlash(`${normalized.replace(/\/$/, '')}/api/v1`)
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

function mapApiUser(record: Partial<User>, index: number): User {
  return {
    id: record.id ?? `U${String(index + 1).padStart(3, '0')}`,
    name: record.name ?? `用户 ${index + 1}`,
    email: record.email ?? `user${index + 1}@example.com`,
    role: record.role ?? 'staff',
    permissions: record.permissions ?? ['store:read'],
    status: record.status ?? 'active',
    store: record.store ?? '总部',
    lastLogin: record.lastLogin ?? '',
    createdAt: record.createdAt ?? '',
    phone: record.phone ?? '',
    loginCount: Number(record.loginCount ?? 0),
  }
}

async function fetchUsers(): Promise<User[]> {
  const upstreamUrl = new URL('identity-access/users', resolveUsersApiBaseUrl()).toString()
  const response = await fetch(upstreamUrl, {
    method: 'GET',
    cache: 'no-store',
  })
  if (!response.ok) {
    throw new Error(`users upstream failed: ${response.status}`)
  }
  const payload = await response.json()
  const data = unwrapApiPayload<{ items?: Partial<User>[]; users?: Partial<User>[] } | Partial<User>[]>(payload)
  const items = Array.isArray(data) ? data : data.users ?? data.items ?? []
  return items.map(mapApiUser)
}

function getLatestUserTimestamp(users: User[]): string {
  const latest = users
    .map((user) => user.lastLogin || user.createdAt)
    .filter(Boolean)
    .sort()
  return latest.at(-1) ?? new Date().toISOString()
}

export function computeUserStats(users: User[]) {
  return {
    total: users.length,
    active: users.filter((user) => user.status === 'active').length,
    inactiveCount: users.filter((user) => user.status === 'inactive').length,
    suspended: users.filter((user) => user.status === 'suspended').length,
  }
}

export function buildRoleCounts(users: User[]) {
  return ALL_ROLES.map((role) => ({
    role,
    label: ROLE_LABELS[role],
    count: users.filter((user) => user.role === role).length,
  }))
}

export function buildStoreCounts(users: User[]) {
  return [...new Set(users.map((user) => user.store))].map((store) => ({
    store,
    count: users.filter((user) => user.store === store).length,
  }))
}

export function computeActivityInsights(users: User[]) {
  return {
    todayLogin: users.filter((user) => user.lastLogin.startsWith('2026-07-20')).length,
    inactiveWithinSevenDays: users.filter((user) => user.lastLogin < '2026-07-13').length,
  }
}

export function matchesUserSearch(user: User, searchTerm: string): boolean {
  if (!searchTerm) return true
  return `${user.name} ${user.email} ${user.store} ${user.permissions.join(' ')}`
    .toLowerCase()
    .includes(searchTerm.toLowerCase())
}

export async function loadUsersSnapshot(): Promise<UsersSnapshotDelivery> {
  try {
    const users = await fetchUsers()
    if (users.length > 0) {
      return {
        deliveryMode: 'api',
        users,
        generatedAt: new Date().toISOString(),
      }
    }
  } catch {
    // fall through to fallback snapshot
  }

  return {
    deliveryMode: 'fallback',
    users: MOCK_USERS,
    generatedAt: getLatestUserTimestamp(MOCK_USERS),
    error: '用户名册实时接口不可达，已切换到 fallback 样本数据。',
  }
}
