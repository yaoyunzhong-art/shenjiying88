const DEFAULT_API_ORIGIN = 'http://localhost:3001'
const DEFAULT_TENANT_ID = 'tenant-p30'

export type SchedulingStatus = 'scheduled' | 'assigned' | 'checked_in'

export interface CleanScheduleItem {
  id: string
  storeId: string
  assigneeId: string
  assigneeName: string
  shiftName: string
  shiftTime: string
  scheduledDate: string
  areaCode?: string
  areaName?: string
  status: SchedulingStatus
  checkInAt?: string
  createdAt: string
  updatedAt: string
}

export interface SchedulingStatsSnapshot {
  total: number
  scheduled: number
  assigned: number
  checkedIn: number
  coverageRate: number
}

export interface SchedulingSnapshotDelivery {
  deliveryMode: 'api' | 'fallback'
  storeId: string
  schedules: CleanScheduleItem[]
  stats: SchedulingStatsSnapshot
  generatedAt: string
  error?: string
}

export const SCHEDULING_STATUS_MAP: Record<SchedulingStatus, { label: string; color: string }> = {
  scheduled: { label: '待签到', color: 'default' },
  assigned: { label: '已分区', color: 'processing' },
  checked_in: { label: '已签到', color: 'success' },
}

export const SHIFT_TIME_MAP: Record<string, string> = {
  早班: '08:00-14:00',
  中班: '14:00-20:00',
  晚班: '15:00-22:00',
}

export function buildFallbackSchedules(storeId: string): CleanScheduleItem[] {
  return [
    {
      id: `${storeId}-schedule-001`,
      storeId,
      assigneeId: 'cleaner-001',
      assigneeName: '张三',
      shiftName: '早班',
      shiftTime: '08:00-14:00',
      scheduledDate: '2026-07-26',
      areaCode: 'lobby',
      areaName: '大厅',
      status: 'assigned',
      createdAt: '2026-07-25T22:00:00.000Z',
      updatedAt: '2026-07-26T07:30:00.000Z',
    },
    {
      id: `${storeId}-schedule-002`,
      storeId,
      assigneeId: 'cleaner-002',
      assigneeName: '李四',
      shiftName: '中班',
      shiftTime: '14:00-20:00',
      scheduledDate: '2026-07-26',
      areaCode: 'restroom',
      areaName: '洗手间',
      status: 'scheduled',
      createdAt: '2026-07-25T22:00:00.000Z',
      updatedAt: '2026-07-26T08:00:00.000Z',
    },
    {
      id: `${storeId}-schedule-003`,
      storeId,
      assigneeId: 'cleaner-003',
      assigneeName: '王五',
      shiftName: '晚班',
      shiftTime: '15:00-22:00',
      scheduledDate: '2026-07-26',
      areaCode: 'arcade-a',
      areaName: 'A 区机台',
      status: 'checked_in',
      checkInAt: '2026-07-26T15:05:00.000Z',
      createdAt: '2026-07-25T22:00:00.000Z',
      updatedAt: '2026-07-26T15:05:00.000Z',
    },
  ]
}

export function computeSchedulingStats(schedules: CleanScheduleItem[]): SchedulingStatsSnapshot {
  const total = schedules.length
  const scheduled = schedules.filter((item) => item.status === 'scheduled').length
  const assigned = schedules.filter((item) => item.status === 'assigned').length
  const checkedIn = schedules.filter((item) => item.status === 'checked_in').length

  return {
    total,
    scheduled,
    assigned,
    checkedIn,
    coverageRate: total ? Math.round(((assigned + checkedIn) / total) * 100) : 0,
  }
}

function ensureTrailingSlash(value: string): string {
  return value.endsWith('/') ? value : `${value}/`
}

function resolveLogisticsApiBaseUrl(): string {
  const configured =
    process.env.LOGISTICS_API_BASE ??
    process.env.M5_API_BASE_URL ??
    process.env.NEXT_PUBLIC_M5_API_BASE_URL ??
    process.env.NEXT_PUBLIC_API_URL ??
    DEFAULT_API_ORIGIN

  const normalized = configured.trim()
  return normalized.length ? normalized.replace(/\/$/, '') : DEFAULT_API_ORIGIN
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

function normalizeSchedulingStatus(value: string): SchedulingStatus {
  switch (value) {
    case 'scheduled':
    case 'assigned':
    case 'checked_in':
      return value
    default:
      return 'scheduled'
  }
}

function normalizeScheduleItem(item: unknown, index: number): CleanScheduleItem {
  const record = asRecord(item)
  const checkIn = asRecord(record.checkIn)
  const shiftName = asString(record.shiftName, '早班')

  return {
    id: asString(record.id, `schedule-${index + 1}`),
    storeId: asString(record.storeId, 'unknown-store'),
    assigneeId: asString(record.assigneeId, `cleaner-${index + 1}`),
    assigneeName: asString(record.assigneeName, `排班人员 ${index + 1}`),
    shiftName,
    shiftTime: asString(record.shiftTime, SHIFT_TIME_MAP[shiftName] ?? '08:00-14:00'),
    scheduledDate: asString(record.scheduledDate, new Date().toISOString().slice(0, 10)),
    areaCode: asString(record.areaCode) || undefined,
    areaName: asString(record.areaName) || undefined,
    status: normalizeSchedulingStatus(asString(record.status, 'scheduled')),
    checkInAt: asString(checkIn.checkedInAt ?? record.checkInAt) || undefined,
    createdAt: asString(record.createdAt, new Date().toISOString()),
    updatedAt: asString(record.updatedAt, asString(record.createdAt, new Date().toISOString())),
  }
}

function getLatestSchedulingTimestamp(schedules: CleanScheduleItem[]): string {
  return schedules.map((item) => item.updatedAt).sort().at(-1) ?? new Date().toISOString()
}

async function fetchSchedulesFromApi(storeId: string): Promise<CleanScheduleItem[]> {
  const upstreamUrl = new URL('logistics/clean-schedules', ensureTrailingSlash(resolveLogisticsApiBaseUrl()))

  const response = await fetch(upstreamUrl, {
    method: 'GET',
    cache: 'no-store',
    headers: {
      'x-tenant-id': DEFAULT_TENANT_ID,
    },
  })

  if (!response.ok) {
    throw new Error(`clean schedules upstream failed: ${response.status}`)
  }

  const payload = unwrapApiPayload<unknown[]>(await response.json())
  return Array.isArray(payload)
    ? payload.map(normalizeScheduleItem).filter((item) => item.storeId === storeId)
    : []
}

export async function loadSchedulingSnapshot(storeId: string): Promise<SchedulingSnapshotDelivery> {
  try {
    const schedules = await fetchSchedulesFromApi(storeId)
    return {
      deliveryMode: 'api',
      storeId,
      schedules,
      stats: computeSchedulingStats(schedules),
      generatedAt: getLatestSchedulingTimestamp(schedules),
    }
  } catch {
    const fallbackSchedules = buildFallbackSchedules(storeId)
    return {
      deliveryMode: 'fallback',
      storeId,
      schedules: fallbackSchedules,
      stats: computeSchedulingStats(fallbackSchedules),
      generatedAt: getLatestSchedulingTimestamp(fallbackSchedules),
      error: '门店排班实时接口不可达，已切换到 fallback 样本数据。',
    }
  }
}
