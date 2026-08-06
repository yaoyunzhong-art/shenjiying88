import { apiFetchJson } from '../api/_client'

const DEFAULT_API_ORIGIN = 'http://localhost:3001'

export type HrEmployeeStatus = 'active' | 'probation' | 'resigned'

export interface HrEmployee {
  id: string
  name: string
  department: string
  position: string
  status: HrEmployeeStatus
  phone: string
  email: string
  joinDate: string
  createdAt: string
  updatedAt: string
  emergencyContact?: string
  remark?: string
}

export interface HrStatsSnapshot {
  totalEmployees: number
  active: number
  probation: number
  resigned: number
  departmentCounts: Record<string, number>
}

export interface HrSnapshotDelivery {
  deliveryMode: 'api' | 'fallback'
  employees: HrEmployee[]
  stats: HrStatsSnapshot
  departments: string[]
  generatedAt: string
  error?: string
}

export const HR_STATUS_MAP: Record<HrEmployeeStatus, { label: string; tone: string }> = {
  active: { label: '在职', tone: 'text-emerald-600' },
  probation: { label: '试用', tone: 'text-amber-600' },
  resigned: { label: '离职', tone: 'text-slate-500' },
}

export const defaultEmployees: HrEmployee[] = [
  {
    id: 'E001',
    name: '张三',
    department: '技术部',
    position: '技术总监',
    status: 'active',
    phone: '13800138001',
    email: 'zhangsan@company.com',
    joinDate: '2022-03-01',
    createdAt: '2026-07-20T09:00:00.000Z',
    updatedAt: '2026-07-26T08:30:00.000Z',
    emergencyContact: '李四 13900139001',
  },
  {
    id: 'E002',
    name: '李四',
    department: '技术部',
    position: '高级工程师',
    status: 'active',
    phone: '13800138002',
    email: 'lisi@company.com',
    joinDate: '2023-06-15',
    createdAt: '2026-07-20T09:00:00.000Z',
    updatedAt: '2026-07-26T07:15:00.000Z',
  },
  {
    id: 'E003',
    name: '王五',
    department: '运营部',
    position: '运营总监',
    status: 'active',
    phone: '13800138003',
    email: 'wangwu@company.com',
    joinDate: '2023-01-10',
    createdAt: '2026-07-20T09:00:00.000Z',
    updatedAt: '2026-07-25T18:20:00.000Z',
  },
  {
    id: 'E004',
    name: '赵六',
    department: '市场部',
    position: '市场专员',
    status: 'probation',
    phone: '13800138004',
    email: 'zhaoliu@company.com',
    joinDate: '2026-05-01',
    createdAt: '2026-07-20T09:00:00.000Z',
    updatedAt: '2026-07-26T06:10:00.000Z',
  },
  {
    id: 'E005',
    name: '钱七',
    department: '门店管理',
    position: '区域店长',
    status: 'resigned',
    phone: '13800138005',
    email: 'qianqi@company.com',
    joinDate: '2021-09-01',
    createdAt: '2026-07-20T09:00:00.000Z',
    updatedAt: '2026-07-22T11:40:00.000Z',
    remark: '已完成离职交接',
  },
  {
    id: 'E006',
    name: '吴十',
    department: '人事部',
    position: 'HR经理',
    status: 'probation',
    phone: '13800138008',
    email: 'wushi@company.com',
    joinDate: '2026-04-15',
    createdAt: '2026-07-20T09:00:00.000Z',
    updatedAt: '2026-07-26T09:10:00.000Z',
  },
]

function buildDepartmentCounts(items: HrEmployee[]): Record<string, number> {
  return items.reduce<Record<string, number>>((accumulator, item) => {
    accumulator[item.department] = (accumulator[item.department] ?? 0) + 1
    return accumulator
  }, {})
}

export const defaultDepartments = Array.from(new Set(defaultEmployees.map((item) => item.department))).sort(
  (left, right) => left.localeCompare(right, 'zh-CN')
)

export const defaultStats: HrStatsSnapshot = {
  totalEmployees: defaultEmployees.length,
  active: defaultEmployees.filter((item) => item.status === 'active').length,
  probation: defaultEmployees.filter((item) => item.status === 'probation').length,
  resigned: defaultEmployees.filter((item) => item.status === 'resigned').length,
  departmentCounts: buildDepartmentCounts(defaultEmployees),
}

function ensureTrailingSlash(value: string): string {
  return value.endsWith('/') ? value : `${value}/`
}

function resolveHrApiBaseUrl(): string {
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

function normalizeEmployeeStatus(value: string): HrEmployeeStatus {
  switch (value) {
    case 'active':
      return 'active'
    case 'probation':
      return 'probation'
    case 'resigned':
      return 'resigned'
    default:
      return 'active'
  }
}

function normalizeEmployee(item: unknown, index: number): HrEmployee {
  const record = asRecord(item)
  const now = new Date().toISOString()
  return {
    id: asString(record.id, `E${String(index + 1).padStart(3, '0')}`),
    name: asString(record.name, `员工${index + 1}`),
    department: asString(record.department, '未分组部门'),
    position: asString(record.position, '员工'),
    status: normalizeEmployeeStatus(asString(record.status, 'active')),
    phone: asString(record.phone, '—'),
    email: asString(record.email, '—'),
    joinDate: asString(record.joinDate, '—'),
    createdAt: asString(record.createdAt, now),
    updatedAt: asString(record.updatedAt, now),
    emergencyContact: asString(record.emergencyContact),
    remark: asString(record.remark),
  }
}

function normalizeStats(stats: unknown, employees: HrEmployee[]): HrStatsSnapshot {
  const record = asRecord(stats)
  const departmentCounts = asRecord(record.departmentCounts)

  return {
    totalEmployees:
      typeof record.totalEmployees === 'number' ? record.totalEmployees : employees.length,
    active:
      typeof record.active === 'number'
        ? record.active
        : employees.filter((item) => item.status === 'active').length,
    probation:
      typeof record.probation === 'number'
        ? record.probation
        : employees.filter((item) => item.status === 'probation').length,
    resigned:
      typeof record.resigned === 'number'
        ? record.resigned
        : employees.filter((item) => item.status === 'resigned').length,
    departmentCounts:
      Object.keys(departmentCounts).length > 0
        ? Object.fromEntries(
            Object.entries(departmentCounts).map(([key, value]) => [
              key,
              typeof value === 'number' ? value : 0,
            ])
          )
        : buildDepartmentCounts(employees),
  }
}

function getLatestHrTimestamp(items: HrEmployee[]): string {
  return items.flatMap((item) => [item.updatedAt, item.createdAt, item.joinDate]).sort().at(-1) ?? '—'
}

async function fetchHrPart<T>(path: string): Promise<T> {
  const upstreamUrl = new URL(path, resolveHrApiBaseUrl()).toString()
  return apiFetchJson<T>(upstreamUrl)
}

export async function loadHrSnapshot(): Promise<HrSnapshotDelivery> {
  try {
    const [employeesPayload, statsPayload, departmentsPayload] = await Promise.all([
      fetchHrPart<unknown[]>('hr/employees'),
      fetchHrPart<HrStatsSnapshot>('hr/stats'),
      fetchHrPart<string[]>('hr/departments'),
    ])

    const employees = Array.isArray(employeesPayload)
      ? employeesPayload.map(normalizeEmployee)
      : []
    const stats = normalizeStats(statsPayload, employees)
    const departments = Array.isArray(departmentsPayload)
      ? departmentsPayload.filter((item): item is string => typeof item === 'string' && item.length > 0)
      : Object.keys(stats.departmentCounts)

    return {
      deliveryMode: 'api',
      employees,
      stats,
      departments,
      generatedAt: new Date().toISOString(),
    }
  } catch {
    return {
      deliveryMode: 'fallback',
      employees: defaultEmployees,
      stats: defaultStats,
      departments: defaultDepartments,
      generatedAt: getLatestHrTimestamp(defaultEmployees),
      error: 'HR 实时接口不可达，已切换到 fallback 样本数据。',
    }
  }
}
