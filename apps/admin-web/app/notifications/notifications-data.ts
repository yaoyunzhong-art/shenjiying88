import { apiFetchJson } from '../api/_client'

const DEFAULT_API_ORIGIN = 'http://localhost:3001'

export type NotifType = 'announcement' | 'marketing' | 'alert' | 'activity'
export type RecipientScope = 'all' | 'specific_store' | 'specific_role'
export type NotifDeliveryStatus = 'sent' | 'pending' | 'sending'

export interface Notification {
  id: string
  title: string
  content: string
  type: NotifType
  recipientScope: RecipientScope
  recipientLabel: string
  status: NotifDeliveryStatus
  sentAt: string
  successRate: number
}

export interface NotificationsSnapshotDelivery {
  deliveryMode: 'api' | 'fallback'
  notifications: Notification[]
  generatedAt: string
  error?: string
}

export const NT_LABEL: Record<NotifType, string> = {
  announcement: '系统公告',
  marketing: '营销推送',
  alert: '告警通知',
  activity: '活动提醒',
}

export const NT_VARIANT: Record<NotifType, 'success' | 'warning' | 'danger' | 'info'> = {
  announcement: 'success',
  marketing: 'warning',
  alert: 'danger',
  activity: 'info',
}

export const RS_LABEL: Record<RecipientScope, string> = {
  all: '全部门店',
  specific_store: '指定门店',
  specific_role: '指定角色',
}

export const DS_LABEL: Record<NotifDeliveryStatus, string> = {
  sent: '已发送',
  pending: '待发送',
  sending: '发送中',
}

export const DS_VARIANT: Record<NotifDeliveryStatus, 'success' | 'warning' | 'info'> = {
  sent: 'success',
  pending: 'warning',
  sending: 'info',
}

export const defaultNotifications: Notification[] = [
  {
    id: 'N001',
    title: '系统升级通知 2026-07',
    content: '系统将于2026年7月25日凌晨02:00-06:00进行例行升级维护，届时部分功能将暂停使用。',
    type: 'announcement',
    recipientScope: 'all',
    recipientLabel: '全部门店',
    status: 'sent',
    sentAt: '2026-07-18 10:00:00',
    successRate: 100,
  },
  {
    id: 'N002',
    title: '暑期会员营销活动',
    content: '暑期大促活动即将上线，请各门店提前准备宣传物料，活动时间7月20日-8月20日。',
    type: 'marketing',
    recipientScope: 'all',
    recipientLabel: '全部门店',
    status: 'sent',
    sentAt: '2026-07-17 14:30:00',
    successRate: 98.5,
  },
  {
    id: 'N003',
    title: '门店设备温度异常告警',
    content: 'A区3号游戏机温度超过安全阈值（85°C），请立即安排维护人员检查。',
    type: 'alert',
    recipientScope: 'specific_role',
    recipientLabel: '设备管理员',
    status: 'sending',
    sentAt: '2026-07-18 20:15:00',
    successRate: 72.3,
  },
  {
    id: 'N004',
    title: '新游戏上线体验活动',
    content: '《极速赛车》新版本将于7月22日上线，诚邀各门店组织客户体验。',
    type: 'activity',
    recipientScope: 'specific_store',
    recipientLabel: '旗舰店·A/B/C区',
    status: 'sent',
    sentAt: '2026-07-16 09:00:00',
    successRate: 100,
  },
  {
    id: 'N005',
    title: '月度消防安全培训通知',
    content: '7月25日下午14:00将举行月度消防安全线上培训，请各门店安全员准时参加。',
    type: 'announcement',
    recipientScope: 'specific_role',
    recipientLabel: '安全员',
    status: 'pending',
    sentAt: '',
    successRate: 0,
  },
  {
    id: 'N006',
    title: '积分兑换促销活动',
    content: '会员积分双倍兑换活动即将开始，请各门店在收银台放置活动展架。',
    type: 'marketing',
    recipientScope: 'all',
    recipientLabel: '全部门店',
    status: 'pending',
    sentAt: '',
    successRate: 0,
  },
  {
    id: 'N007',
    title: '库存预警：热门配件缺货',
    content: '手柄充电底座库存不足（仅剩5件），建议立即补货以避免断货。',
    type: 'alert',
    recipientScope: 'specific_store',
    recipientLabel: 'A区门店',
    status: 'sent',
    sentAt: '2026-07-18 08:45:00',
    successRate: 95,
  },
]

function ensureTrailingSlash(value: string): string {
  return value.endsWith('/') ? value : `${value}/`
}

function resolveNotificationsApiBaseUrl(): string {
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

function mapApiNotification(record: Partial<Notification>, index: number): Notification {
  return {
    id: record.id ?? `notification-${index + 1}`,
    title: record.title ?? `通知 ${index + 1}`,
    content: record.content ?? '',
    type: record.type ?? 'announcement',
    recipientScope: record.recipientScope ?? 'all',
    recipientLabel:
      record.recipientLabel ??
      RS_LABEL[record.recipientScope ?? 'all'],
    status: record.status ?? 'pending',
    sentAt: record.sentAt ?? '',
    successRate: Number(record.successRate ?? 0),
  }
}

async function fetchNotifications(): Promise<Notification[]> {
  const upstreamUrl = new URL('notifications', resolveNotificationsApiBaseUrl()).toString()
  const data = await apiFetchJson<{ items?: Partial<Notification>[]; notifications?: Partial<Notification>[] } | Partial<Notification>[]>(upstreamUrl)
  const items = Array.isArray(data) ? data : data.notifications ?? data.items ?? []
  return items.map(mapApiNotification)
}

function getLatestNotificationTimestamp(items: Notification[]): string {
  const timestamps = items
    .map((item) => item.sentAt)
    .filter(Boolean)
    .sort()
  return timestamps.at(-1) ?? new Date().toISOString()
}

export function formatDate(value: string): string {
  if (!value) return '—'
  return value
}

export function countByStatus(
  items: Notification[],
  status: NotifDeliveryStatus
): number {
  return items.filter((item) => item.status === status).length
}

export function calcSuccessRate(items: Notification[]): number {
  const sentItems = items.filter((item) => item.status === 'sent' && item.successRate > 0)
  if (sentItems.length === 0) return 0
  const total = sentItems.reduce((sum, item) => sum + item.successRate, 0)
  return Math.round(total / sentItems.length)
}

export function countSnapshotMonth(items: Notification[], generatedAt: string): number {
  const monthKey = (generatedAt || getLatestNotificationTimestamp(items)).slice(0, 7)
  return items.filter((item) => item.sentAt.startsWith(monthKey)).length
}

export async function loadNotificationsSnapshot(): Promise<NotificationsSnapshotDelivery> {
  try {
    const notifications = await fetchNotifications()
    if (notifications.length > 0) {
      return {
        deliveryMode: 'api',
        notifications,
        generatedAt: new Date().toISOString(),
      }
    }
  } catch {
    // fall through to fallback snapshot
  }

  return {
    deliveryMode: 'fallback',
    notifications: defaultNotifications,
    generatedAt: getLatestNotificationTimestamp(defaultNotifications),
    error: '通知实时接口不可达，已切换到 fallback 样本数据。',
  }
}
