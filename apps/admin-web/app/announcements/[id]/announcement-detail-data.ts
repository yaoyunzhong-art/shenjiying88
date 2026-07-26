import {
  CATEGORY_LABELS,
  PRIORITY_COLORS,
  PRIORITY_LABELS,
  STATUS_BADGE_VARIANT,
  STATUS_LABELS,
  defaultAnnouncements,
  type Announcement,
  type AnnouncementStatus,
} from '../announcements-data'

export {
  CATEGORY_LABELS,
  PRIORITY_COLORS,
  PRIORITY_LABELS,
  STATUS_BADGE_VARIANT,
  STATUS_LABELS,
}

export type { Announcement, AnnouncementStatus }

export interface AnnouncementDetailSnapshot {
  deliveryMode: 'snapshot'
  sourceLabel: 'local-announcement-detail-snapshot'
  requestedId: string
  announcement: Announcement | null
  generatedAt: string
  notFound: boolean
}

export const STATUS_FLOW_OPTIONS: ReadonlyArray<{
  from: AnnouncementStatus
  to: AnnouncementStatus
  label: string
}> = [
  { from: 'draft', to: 'published', label: '发布' },
  { from: 'published', to: 'archived', label: '归档' },
] as const

function readAnnouncementDetailParam(
  value: string | string[] | undefined,
): string {
  if (Array.isArray(value)) {
    return value[0] ?? ''
  }
  return value ?? ''
}

function getAnnouncementContent(record: Announcement): string {
  if (record.id === 'a1') {
    return [
      '各位同事：',
      '',
      '根据 IT 运维计划，核心数据库将于 2026-07-12 02:00-05:00 进行维护升级。',
      '维护期间 POS 收银、会员积分与在线订单处理会短时暂停。',
      '',
      '请各门店提前完成对账并在窗口结束后执行一次业务巡检。',
      '',
      '技术部',
    ].join('\n')
  }

  if (record.id === 'a5') {
    return [
      '盘点计划草案：',
      '',
      '拟定 7 月下旬对核心仓与重点门店执行季度库存盘点。',
      '目前仍处于草稿演练态，待审批后再形成正式公告。',
    ].join('\n')
  }

  return record.content
}

export function normalizeAnnouncementDetailParam(
  value: string | string[] | undefined,
): string {
  return readAnnouncementDetailParam(value)
}

export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '-'

  const parsed = new Date(dateStr)
  if (Number.isNaN(parsed.getTime())) {
    return dateStr
  }

  return `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, '0')}-${String(parsed.getDate()).padStart(2, '0')}`
}

export async function loadAnnouncementDetailSnapshot(
  rawId: string,
): Promise<AnnouncementDetailSnapshot> {
  const requestedId = normalizeAnnouncementDetailParam(rawId)
  const record = defaultAnnouncements.find((item) => item.id === requestedId)

  if (!record) {
    return {
      deliveryMode: 'snapshot',
      sourceLabel: 'local-announcement-detail-snapshot',
      requestedId,
      announcement: null,
      generatedAt: new Date().toISOString(),
      notFound: true,
    }
  }

  return {
    deliveryMode: 'snapshot',
    sourceLabel: 'local-announcement-detail-snapshot',
    requestedId,
    announcement: {
      ...record,
      content: getAnnouncementContent(record),
    },
    generatedAt: record.updatedAt,
    notFound: false,
  }
}
