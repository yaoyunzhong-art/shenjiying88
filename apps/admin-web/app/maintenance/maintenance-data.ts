const DEFAULT_API_ORIGIN = 'http://localhost:3001'

export type MaintenanceTaskType =
  | 'routine_inspection'
  | 'repair'
  | 'preventive_maintenance'
  | 'emergency_repair'
  | 'cleaning'

export type MaintenanceTaskPriority = 'low' | 'medium' | 'high' | 'critical'
export type MaintenanceTaskStatus = 'pending' | 'assigned' | 'in_progress' | 'completed' | 'cancelled'

export interface MaintenanceTask {
  id: string
  storeId: string
  storeName: string
  equipmentName: string
  equipmentId?: string
  taskType: MaintenanceTaskType
  priority: MaintenanceTaskPriority
  status: MaintenanceTaskStatus
  description: string
  assigneeId?: string
  assigneeName?: string
  scheduledAt?: string
  startedAt?: string
  completedAt?: string
  completionNote?: string
  reportedByName?: string
  createdAt: string
  updatedAt: string
}

export interface MaintenanceStatsSnapshot {
  total: number
  pending: number
  inProgress: number
  completed: number
  critical: number
}

export interface MaintenanceSnapshotDelivery {
  deliveryMode: 'api' | 'fallback'
  tasks: MaintenanceTask[]
  stats: MaintenanceStatsSnapshot
  generatedAt: string
  error?: string
}

export const MAINTENANCE_TYPE_MAP: Record<MaintenanceTaskType, string> = {
  routine_inspection: '巡检',
  repair: '维修',
  preventive_maintenance: '预防保养',
  emergency_repair: '紧急抢修',
  cleaning: '保洁',
}

export const MAINTENANCE_PRIORITY_MAP: Record<MaintenanceTaskPriority, { label: string; tone: string }> = {
  low: { label: '低', tone: 'bg-slate-100 text-slate-600' },
  medium: { label: '中', tone: 'bg-blue-100 text-blue-700' },
  high: { label: '高', tone: 'bg-amber-100 text-amber-700' },
  critical: { label: '紧急', tone: 'bg-red-100 text-red-700' },
}

export const MAINTENANCE_STATUS_MAP: Record<MaintenanceTaskStatus, { label: string; tone: string }> = {
  pending: { label: '待处理', tone: 'bg-slate-100 text-slate-600' },
  assigned: { label: '已指派', tone: 'bg-blue-100 text-blue-700' },
  in_progress: { label: '进行中', tone: 'bg-amber-100 text-amber-700' },
  completed: { label: '已完成', tone: 'bg-emerald-100 text-emerald-700' },
  cancelled: { label: '已取消', tone: 'bg-rose-100 text-rose-700' },
}

export const defaultTasks: MaintenanceTask[] = [
  {
    id: 'mt-001',
    storeId: 'beijing-chaoyang',
    storeName: '北京朝阳店',
    equipmentName: '2 号空调',
    equipmentId: 'ac-002',
    taskType: 'repair',
    priority: 'high',
    status: 'in_progress',
    description: '2 号机组不制冷，需补冷媒并排查压缩机。',
    assigneeId: 'tech-zhang',
    assigneeName: '张师傅',
    scheduledAt: '2026-07-19T09:00:00.000Z',
    startedAt: '2026-07-19T09:30:00.000Z',
    reportedByName: '值班经理',
    createdAt: '2026-07-18T08:00:00.000Z',
    updatedAt: '2026-07-19T09:30:00.000Z',
  },
  {
    id: 'mt-002',
    storeId: 'shanghai-nanjing',
    storeName: '上海南京路店',
    equipmentName: '全店公共区域',
    taskType: 'cleaning',
    priority: 'medium',
    status: 'assigned',
    description: '月度深度保洁，含玻璃、地毯和设备表面清洁。',
    assigneeId: 'clean-team-01',
    assigneeName: '保洁组',
    scheduledAt: '2026-07-20T06:00:00.000Z',
    reportedByName: '门店主管',
    createdAt: '2026-07-17T12:00:00.000Z',
    updatedAt: '2026-07-18T10:15:00.000Z',
  },
  {
    id: 'mt-003',
    storeId: 'guangzhou-tianhe',
    storeName: '广州天河店',
    equipmentName: '消防设施',
    taskType: 'routine_inspection',
    priority: 'critical',
    status: 'pending',
    description: '月度消防安全巡检，需核验灭火器和应急灯状态。',
    reportedByName: '安全员',
    createdAt: '2026-07-18T06:00:00.000Z',
    updatedAt: '2026-07-18T06:00:00.000Z',
  },
  {
    id: 'mt-004',
    storeId: 'shenzhen-nanshan',
    storeName: '深圳南山店',
    equipmentName: '入口闸机',
    equipmentId: 'gate-001',
    taskType: 'emergency_repair',
    priority: 'high',
    status: 'completed',
    description: '入口闸机刷卡失败，已安排更换读卡模块。',
    assigneeId: 'device-team-01',
    assigneeName: '设备组',
    completedAt: '2026-07-17T16:00:00.000Z',
    completionNote: '已更换读卡器并完成通行测试。',
    reportedByName: '前台值守',
    createdAt: '2026-07-14T10:00:00.000Z',
    updatedAt: '2026-07-17T16:00:00.000Z',
  },
  {
    id: 'mt-005',
    storeId: 'chengdu-chunxi',
    storeName: '成都春熙路店',
    equipmentName: '收银工作站',
    equipmentId: 'pos-009',
    taskType: 'preventive_maintenance',
    priority: 'low',
    status: 'pending',
    description: '升级最新版收银客户端并校验小票打印链路。',
    reportedByName: '区域运维',
    createdAt: '2026-07-16T11:00:00.000Z',
    updatedAt: '2026-07-16T11:00:00.000Z',
  },
]

export function computeMaintenanceStats(tasks: MaintenanceTask[]): MaintenanceStatsSnapshot {
  return {
    total: tasks.length,
    pending: tasks.filter((task) => task.status === 'pending' || task.status === 'assigned').length,
    inProgress: tasks.filter((task) => task.status === 'in_progress').length,
    completed: tasks.filter((task) => task.status === 'completed' || task.status === 'cancelled').length,
    critical: tasks.filter((task) => task.priority === 'critical' && task.status !== 'completed').length,
  }
}

function ensureTrailingSlash(value: string): string {
  return value.endsWith('/') ? value : `${value}/`
}

function resolveMaintenanceApiBaseUrl(): string {
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

function normalizeTaskType(value: string): MaintenanceTaskType {
  switch (value) {
    case 'routine_inspection':
    case 'repair':
    case 'preventive_maintenance':
    case 'emergency_repair':
    case 'cleaning':
      return value
    default:
      return 'repair'
  }
}

function normalizeTaskPriority(value: string): MaintenanceTaskPriority {
  switch (value) {
    case 'low':
    case 'medium':
    case 'high':
    case 'critical':
      return value
    default:
      return 'medium'
  }
}

function normalizeTaskStatus(value: string): MaintenanceTaskStatus {
  switch (value) {
    case 'pending':
    case 'assigned':
    case 'in_progress':
    case 'completed':
    case 'cancelled':
      return value
    default:
      return 'pending'
  }
}

function normalizeMaintenanceTask(item: unknown, index: number): MaintenanceTask {
  const record = asRecord(item)
  const storeId = asString(record.storeId, `store-${index + 1}`)

  return {
    id: asString(record.id, `mt-${index + 1}`),
    storeId,
    storeName: asString(record.storeName, storeId),
    equipmentName: asString(record.equipmentName, '未命名设备'),
    equipmentId: asString(record.equipmentId) || undefined,
    taskType: normalizeTaskType(asString(record.taskType, 'repair')),
    priority: normalizeTaskPriority(asString(record.priority, 'medium')),
    status: normalizeTaskStatus(asString(record.status, 'pending')),
    description: asString(record.description, '暂无任务描述'),
    assigneeId: asString(record.assigneeId) || undefined,
    assigneeName: asString(record.assigneeName) || undefined,
    scheduledAt: asString(record.scheduledAt) || undefined,
    startedAt: asString(record.startedAt) || undefined,
    completedAt: asString(record.completedAt) || undefined,
    completionNote: asString(record.completionNote) || undefined,
    reportedByName: asString(record.reportedByName) || undefined,
    createdAt: asString(record.createdAt, new Date().toISOString()),
    updatedAt: asString(record.updatedAt, asString(record.createdAt, new Date().toISOString())),
  }
}

function getLatestMaintenanceTimestamp(tasks: MaintenanceTask[]): string {
  return tasks.map((task) => task.updatedAt).sort().at(-1) ?? new Date().toISOString()
}

async function fetchMaintenanceTasksFromApi(): Promise<MaintenanceTask[]> {
  const upstreamUrl = new URL(
    'logistics-management/maintenance-tasks',
    ensureTrailingSlash(resolveMaintenanceApiBaseUrl())
  ).toString()

  const response = await fetch(upstreamUrl, {
    method: 'GET',
    cache: 'no-store',
  })

  if (!response.ok) {
    throw new Error(`maintenance upstream failed: ${response.status}`)
  }

  const payload = unwrapApiPayload<unknown[]>(await response.json())
  return Array.isArray(payload) ? payload.map(normalizeMaintenanceTask) : []
}

export async function loadMaintenanceSnapshot(): Promise<MaintenanceSnapshotDelivery> {
  try {
    const tasks = await fetchMaintenanceTasksFromApi()
    return {
      deliveryMode: 'api',
      tasks,
      stats: computeMaintenanceStats(tasks),
      generatedAt: getLatestMaintenanceTimestamp(tasks),
    }
  } catch {
    return {
      deliveryMode: 'fallback',
      tasks: defaultTasks,
      stats: computeMaintenanceStats(defaultTasks),
      generatedAt: getLatestMaintenanceTimestamp(defaultTasks),
      error: '后勤维护实时接口不可达，已切换到 fallback 样本数据。',
    }
  }
}
