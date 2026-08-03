/**
 * member/activities/mock-data.ts
 * 会员活动历史快照加载器与 fallback 样本
 */

export type ActivityEventType = 'POINTS_CHANGE' | 'LEVEL_UP' | 'COUPON_ISSUE' | 'PROFILE_UPDATE'
export type ActivityStatus = 'SUCCESS' | 'PENDING' | 'FAILED'
export type ActivityChannel = 'POS' | 'MINI_PROGRAM' | 'ADMIN'

export interface ActivityItem {
  id: string
  memberName: string
  memberPhone: string
  eventType: ActivityEventType
  status: ActivityStatus
  channel: ActivityChannel
  description: string
  operator: string
  occurredAt: string
}

export interface MemberActivitiesSnapshotDelivery {
  deliveryMode: 'api' | 'fallback'
  activities: ActivityItem[]
  generatedAt: string
  error?: string
}

const EVENT_TYPE_MAP: Record<ActivityEventType, string> = {
  POINTS_CHANGE: '积分变动',
  LEVEL_UP: '等级变更',
  COUPON_ISSUE: '优惠券发放',
  PROFILE_UPDATE: '资料修改',
}

const STATUS_MAP: Record<ActivityStatus, string> = {
  SUCCESS: '成功',
  PENDING: '处理中',
  FAILED: '失败',
}

const CHANNEL_MAP: Record<ActivityChannel, string> = {
  POS: 'POS 收银',
  MINI_PROGRAM: '小程序',
  ADMIN: '后台管理',
}

export function getEventTypeLabel(type: ActivityEventType): string {
  return EVENT_TYPE_MAP[type] ?? type
}

export function getStatusLabel(status: ActivityStatus): string {
  return STATUS_MAP[status] ?? status
}

export function getChannelLabel(channel: ActivityChannel): string {
  return CHANNEL_MAP[channel] ?? channel
}

export const MOCK_ACTIVITIES: ActivityItem[] = [
  { id: 'ACT-0001', memberName: '张三', memberPhone: '138****1234', eventType: 'POINTS_CHANGE', status: 'SUCCESS', channel: 'POS', description: '张三 消费返还 120 积分', operator: '系统自动', occurredAt: '2026-07-18T10:15:00.000Z' },
  { id: 'ACT-0002', memberName: '李四', memberPhone: '139****5678', eventType: 'LEVEL_UP', status: 'SUCCESS', channel: 'ADMIN', description: '李四 从白银升级为黄金', operator: '会员运营-小刘', occurredAt: '2026-07-18T12:20:00.000Z' },
  { id: 'ACT-0003', memberName: '王五', memberPhone: '137****9012', eventType: 'COUPON_ISSUE', status: 'PENDING', channel: 'MINI_PROGRAM', description: '向 王五 发放「20 元满减券」', operator: '营销引擎', occurredAt: '2026-07-17T09:10:00.000Z' },
  { id: 'ACT-0004', memberName: '赵六', memberPhone: '136****3456', eventType: 'PROFILE_UPDATE', status: 'SUCCESS', channel: 'MINI_PROGRAM', description: '赵六 更新了 手机号', operator: '会员本人', occurredAt: '2026-07-17T16:45:00.000Z' },
  { id: 'ACT-0005', memberName: '钱七', memberPhone: '135****7890', eventType: 'POINTS_CHANGE', status: 'FAILED', channel: 'ADMIN', description: '钱七 扣减积分失败，原因: 余额不足', operator: '客服-小王', occurredAt: '2026-07-16T08:32:00.000Z' },
  { id: 'ACT-0006', memberName: '孙八', memberPhone: '134****2345', eventType: 'COUPON_ISSUE', status: 'SUCCESS', channel: 'POS', description: '向 孙八 发放「生日礼券」', operator: '收银员-阿林', occurredAt: '2026-07-15T20:10:00.000Z' },
  { id: 'ACT-0007', memberName: '周九', memberPhone: '133****6789', eventType: 'LEVEL_UP', status: 'PENDING', channel: 'ADMIN', description: '周九 等待等级复核', operator: '会员运营-小刘', occurredAt: '2026-07-15T11:40:00.000Z' },
  { id: 'ACT-0008', memberName: '吴十', memberPhone: '132****0123', eventType: 'PROFILE_UPDATE', status: 'FAILED', channel: 'MINI_PROGRAM', description: '吴十 修改生日失败，字段校验未通过', operator: '会员本人', occurredAt: '2026-07-14T14:18:00.000Z' },
  { id: 'ACT-0009', memberName: '张三', memberPhone: '138****1234', eventType: 'COUPON_ISSUE', status: 'SUCCESS', channel: 'ADMIN', description: '向 张三 补发「复购激励券」', operator: '营销经理-小邱', occurredAt: '2026-07-13T09:00:00.000Z' },
  { id: 'ACT-0010', memberName: '李四', memberPhone: '139****5678', eventType: 'POINTS_CHANGE', status: 'SUCCESS', channel: 'POS', description: '李四 参加活动获得 300 积分', operator: '系统自动', occurredAt: '2026-07-12T13:36:00.000Z' },
  { id: 'ACT-0011', memberName: '王五', memberPhone: '137****9012', eventType: 'PROFILE_UPDATE', status: 'SUCCESS', channel: 'ADMIN', description: '王五 更新了 联系地址', operator: '客服-小王', occurredAt: '2026-07-11T17:22:00.000Z' },
  { id: 'ACT-0012', memberName: '赵六', memberPhone: '136****3456', eventType: 'LEVEL_UP', status: 'SUCCESS', channel: 'MINI_PROGRAM', description: '赵六 从黄金升级为铂金', operator: '会员成长引擎', occurredAt: '2026-07-10T07:55:00.000Z' },
]

const DEFAULT_API_ORIGIN = 'http://localhost:3001'

function ensureTrailingSlash(value: string): string {
  return value.endsWith('/') ? value : `${value}/`
}

function resolveMemberActivitiesApiBaseUrl(): string {
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

async function fetchMemberActivities(): Promise<ActivityItem[]> {
  const upstreamUrl = new URL(
    'members/activities',
    resolveMemberActivitiesApiBaseUrl(),
  ).toString()
  const response = await fetch(upstreamUrl, {
    method: 'GET',
    cache: 'no-store',
  })
  if (!response.ok) {
    throw new Error(`member activities upstream failed: ${response.status}`)
  }
  const payload = await response.json()
  const data = unwrapApiPayload<{ activities: ActivityItem[] }>(payload)
  return data.activities
}

function getLatestOccurredAt(items: ActivityItem[]): string {
  if (items.length === 0) return '—'
  return items.reduce(
    (latest, item) => (item.occurredAt > latest ? item.occurredAt : latest),
    items[0]!.occurredAt,
  )
}

export async function loadMemberActivitiesSnapshot(): Promise<MemberActivitiesSnapshotDelivery> {
  try {
    const activities = await fetchMemberActivities()
    return {
      deliveryMode: 'api',
      activities,
      generatedAt: new Date().toISOString(),
    }
  } catch {
    return {
      deliveryMode: 'fallback',
      activities: MOCK_ACTIVITIES,
      generatedAt: getLatestOccurredAt(MOCK_ACTIVITIES),
      error: '会员活动实时接口不可达，已切换到 fallback 样本数据。',
    }
  }
}

export function getActivityStats(items: ActivityItem[]) {
  const total = items.length
  const success = items.filter((item) => item.status === 'SUCCESS').length
  const pending = items.filter((item) => item.status === 'PENDING').length
  const failed = items.filter((item) => item.status === 'FAILED').length
  const uniqueMembers = new Set(items.map((item) => item.memberPhone)).size
  return { total, success, pending, failed, uniqueMembers }
}

export function getUniqueChannels(items: ActivityItem[]): ActivityChannel[] {
  return Array.from(new Set(items.map((item) => item.channel))).sort() as ActivityChannel[]
}

export function getUniqueEventTypes(items: ActivityItem[]): ActivityEventType[] {
  return Array.from(new Set(items.map((item) => item.eventType))).sort()
}
