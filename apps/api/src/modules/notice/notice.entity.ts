// notice.entity.ts · 公告通知实体
// Phase V23 · 2026-07-21

/**
 * 公告范围 —— 系统级 / 租户级 / 品牌级 / 门店级
 */
export enum NoticeScope {
  System = 'SYSTEM',
  Tenant = 'TENANT',
  Brand = 'BRAND',
  Store = 'STORE',
}

/**
 * 公告优先级 —— 用于前端醒目显示
 */
export enum NoticePriority {
  Low = 'LOW',
  Normal = 'NORMAL',
  High = 'HIGH',
  Urgent = 'URGENT',
}

/**
 * 公告状态 —— 草稿/已发布/已下架/已删除
 */
export enum NoticeStatus {
  Draft = 'DRAFT',
  Published = 'PUBLISHED',
  Archived = 'ARCHIVED',
  Deleted = 'DELETED',
}

/**
 * 公告实体
 */
export interface Notice {
  id: string
  /** 公告编码（全局唯一，如 NOT-20260721-001） */
  code: string
  /** 标题 */
  title: string
  /** 正文内容（支持 markdown 格式） */
  content: string
  /** 摘要 / 简短描述 */
  summary?: string
  /** 封面图 URL 或附件列表 */
  coverUrl?: string
  /** 范围 */
  scope: NoticeScope
  /** 优先级 */
  priority: NoticePriority
  /** 状态 */
  status: NoticeStatus
  /** 发布人 */
  authorId: string
  authorName: string
  /** 租户隔离 */
  tenantId?: string
  brandId?: string
  storeId?: string
  /** 定时发布（为空立即发布） */
  scheduledAt?: string
  /** 实际发布时间 */
  publishedAt?: string
  /** 下架时间（为空不过期） */
  expireAt?: string
  /** 归档时间 */
  archivedAt?: string
  /** 置顶排序（数字越大越靠前） */
  stickyOrder: number
  /** 已读用户数组 */
  readBy: string[]
  /** 已读用户数 */
  readCount: number
  /** 标签 */
  tags: string[]
  /** 创建时间 */
  createdAt: string
  /** 更新时间 */
  updatedAt: string
}

// ── Entity factories ──

let codeCounter = 0
let idCounter = 0

/**
 * 生成公告编码
 * NOT-YYYYMMDD-NNN
 */
export function generateNoticeCode(): string {
  const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  const seq = String(++codeCounter).padStart(3, '0')
  return `NOT-${datePart}-${seq}`
}

export function toNotice(input: {
  title: string
  content: string
  scope: NoticeScope
  priority?: NoticePriority
  authorId: string
  authorName: string
  summary?: string
  coverUrl?: string
  tenantId?: string
  brandId?: string
  storeId?: string
  scheduledAt?: string
  expireAt?: string
  stickyOrder?: number
  tags?: string[]
}): Notice {
  const now = new Date().toISOString()
  return {
    id: `notice-${Date.now()}-${++idCounter}`,
    code: generateNoticeCode(),
    title: input.title,
    content: input.content,
    summary: input.summary,
    coverUrl: input.coverUrl,
    scope: input.scope,
    priority: input.priority ?? NoticePriority.Normal,
    status: NoticeStatus.Draft,
    authorId: input.authorId,
    authorName: input.authorName,
    tenantId: input.tenantId,
    brandId: input.brandId,
    storeId: input.storeId,
    scheduledAt: input.scheduledAt,
    expireAt: input.expireAt,
    stickyOrder: input.stickyOrder ?? 0,
    readBy: [],
    readCount: 0,
    tags: input.tags ?? [],
    createdAt: now,
    updatedAt: now,
  }
}

/**
 * 模拟发布 —— 将 Draft 转为 Published，记录发布时间
 */
export function toPublishedNotice(notice: Notice): Notice {
  const now = new Date().toISOString()
  return {
    ...notice,
    status: NoticeStatus.Published,
    publishedAt: now,
    updatedAt: now,
  }
}

/**
 * 模拟归档 —— 将 Published 转为 Archived
 */
export function toArchivedNotice(notice: Notice): Notice {
  const now = new Date().toISOString()
  return {
    ...notice,
    status: NoticeStatus.Archived,
    archivedAt: now,
    updatedAt: now,
  }
}
