// notice.contract.ts · 公告通知安全合约
// Phase V23 · 2026-07-21

import type { Notice } from './notice.entity'

/**
 * API 对外暴露的安全合约（不暴露内部 id / readBy 等敏感字段）
 */
export interface NoticeContract {
  code: string
  title: string
  content: string
  summary?: string
  coverUrl?: string
  scope: string
  priority: string
  status: string
  authorId: string
  authorName: string
  tenantId?: string
  brandId?: string
  storeId?: string
  scheduledAt?: string
  publishedAt?: string
  expireAt?: string
  stickyOrder: number
  readCount: number
  read: boolean
  tags: string[]
  createdAt: string
  updatedAt: string
}

export function toNoticeContract(
  notice: Notice,
  currentUserId?: string,
): NoticeContract {
  return {
    code: notice.code,
    title: notice.title,
    content: notice.content,
    summary: notice.summary,
    coverUrl: notice.coverUrl,
    scope: notice.scope,
    priority: notice.priority,
    status: notice.status,
    authorId: notice.authorId,
    authorName: notice.authorName,
    tenantId: notice.tenantId,
    brandId: notice.brandId,
    storeId: notice.storeId,
    scheduledAt: notice.scheduledAt,
    publishedAt: notice.publishedAt,
    expireAt: notice.expireAt,
    stickyOrder: notice.stickyOrder,
    readCount: notice.readCount,
    read: currentUserId ? notice.readBy.includes(currentUserId) : false,
    tags: notice.tags,
    createdAt: notice.createdAt,
    updatedAt: notice.updatedAt,
  }
}

/**
 * 列表合约（摘要版，不含完整 content）
 */
export interface NoticeListItemContract {
  code: string
  title: string
  summary?: string
  coverUrl?: string
  scope: string
  priority: string
  status: string
  authorName: string
  publishedAt?: string
  expireAt?: string
  stickyOrder: number
  readCount: number
  read: boolean
  tags: string[]
  createdAt: string
}

export function toNoticeListItemContract(
  notice: Notice,
  currentUserId?: string,
): NoticeListItemContract {
  return {
    code: notice.code,
    title: notice.title,
    summary: notice.summary,
    coverUrl: notice.coverUrl,
    scope: notice.scope,
    priority: notice.priority,
    status: notice.status,
    authorName: notice.authorName,
    publishedAt: notice.publishedAt,
    expireAt: notice.expireAt,
    stickyOrder: notice.stickyOrder,
    readCount: notice.readCount,
    read: currentUserId ? notice.readBy.includes(currentUserId) : false,
    tags: notice.tags,
    createdAt: notice.createdAt,
  }
}
