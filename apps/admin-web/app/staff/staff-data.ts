import {
  MOCK_STAFF as FALLBACK_STAFF,
  STAFF_ROLE_MAP,
  STAFF_STATUS_MAP,
  computeStaffStats,
  type StaffItem,
  type StaffRole,
  type StaffStatus,
} from '../staff-data'

const DEFAULT_API_ORIGIN = 'http://localhost:3001'

export type { StaffItem, StaffRole, StaffStatus } from '../staff-data'
export { STAFF_ROLE_MAP, STAFF_STATUS_MAP }
export const MOCK_STAFF = FALLBACK_STAFF

export interface StaffSnapshotDelivery {
  deliveryMode: 'api' | 'fallback'
  staff: StaffItem[]
  stats: ReturnType<typeof computeStaffStats>
  generatedAt: string
  error?: string
}

function ensureTrailingSlash(value: string): string {
  return value.endsWith('/') ? value : `${value}/`
}

function resolveStaffApiBaseUrl(): string {
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

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {}
}

function asString(value: unknown, fallback = ''): string {
  return typeof value === 'string' && value.trim().length > 0 ? value : fallback
}

function normalizeStaffStatus(value: string): StaffStatus {
  switch (value) {
    case 'active':
      return 'active'
    case 'probation':
      return 'probation'
    case 'resigned':
      return 'resigned'
    case 'on_leave':
      return 'on_leave'
    default:
      return 'active'
  }
}

function inferStaffRole(position: string, department: string): StaffRole {
  const lower = `${position} ${department}`.toLowerCase()
  if (lower.includes('店长') || lower.includes('manager')) return 'store_manager'
  if (lower.includes('前台') || lower.includes('front')) return 'front_desk'
  if (lower.includes('仓') || lower.includes('warehouse')) return 'warehouse'
  if (lower.includes('财务') || lower.includes('finance')) return 'finance'
  if (lower.includes('市场') || lower.includes('marketing')) return 'marketing'
  if (lower.includes('保洁') || lower.includes('clean')) return 'cleaner'
  if (lower.includes('运营') || lower.includes('operation')) return 'operations'
  return 'sales_clerk'
}

function normalizeStaffItem(item: unknown, index: number): StaffItem {
  const record = asRecord(item)
  const department = asString(record.department, '总部')
  const position = asString(record.position, '员工')
  return {
    id: asString(record.id, `staff-${index + 1}`),
    code: asString(record.id, `EMP-${String(index + 1).padStart(3, '0')}`),
    name: asString(record.name, `员工 ${index + 1}`),
    role: inferStaffRole(position, department),
    storeName: asString(record.storeName ?? record.department, department),
    marketCode: asString(record.marketCode, 'cn-mainland'),
    status: normalizeStaffStatus(asString(record.status, 'active')),
    phone: asString(record.phone, '—'),
    email: asString(record.email, '—'),
    hiredAt: asString(record.joinDate, '—'),
    lastActiveAt: asString(record.updatedAt ?? record.joinDate, '—'),
    performanceScore: 80,
  }
}

function getLatestStaffTimestamp(items: StaffItem[]): string {
  return items.map((item) => item.lastActiveAt).sort().at(-1) ?? '—'
}

async function fetchStaffFromApi(): Promise<StaffItem[]> {
  const upstreamUrl = new URL('hr/employees', resolveStaffApiBaseUrl()).toString()
  const response = await fetch(upstreamUrl, {
    method: 'GET',
    cache: 'no-store',
  })
  if (!response.ok) {
    throw new Error(`staff upstream failed: ${response.status}`)
  }
  const payload = unwrapApiPayload<unknown[]>(await response.json())
  return Array.isArray(payload) ? payload.map(normalizeStaffItem) : []
}

export async function loadStaffSnapshot(): Promise<StaffSnapshotDelivery> {
  try {
    const staff = await fetchStaffFromApi()
    return {
      deliveryMode: 'api',
      staff,
      stats: computeStaffStats(staff),
      generatedAt: new Date().toISOString(),
    }
  } catch {
    return {
      deliveryMode: 'fallback',
      staff: MOCK_STAFF,
      stats: computeStaffStats(MOCK_STAFF),
      generatedAt: getLatestStaffTimestamp(MOCK_STAFF),
      error: '员工实时接口不可达，已切换到 fallback 样本数据。',
    }
  }
}
