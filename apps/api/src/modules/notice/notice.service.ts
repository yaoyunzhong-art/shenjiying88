// notice.service.ts · 公告通知服务
// Phase V23 · 2026-07-21

import { Injectable, NotFoundException } from '@nestjs/common'
import {
  NoticePriority,
  NoticeScope,
  NoticeStatus,
  toNotice,
  toPublishedNotice,
  toArchivedNotice,
  type Notice,
} from './notice.entity'

/**
 * 内存存储（测试 / MVP 阶段使用）
 */
const noticeStore = new Map<string, Notice>()

export function resetNoticeServiceTestState(): void {
  noticeStore.clear()
}

@Injectable()
export class NoticeService {
  // ── CUD ──

  create(input: {
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
    const notice = toNotice(input)
    noticeStore.set(notice.id, notice)
    return notice
  }

  update(
    id: string,
    patch: Partial<{
      title: string
      content: string
      scope: NoticeScope
      priority: NoticePriority
      summary: string
      coverUrl: string
      scheduledAt: string
      expireAt: string
      stickyOrder: number
      tags: string[]
    }>,
  ): Notice {
    const existing = noticeStore.get(id)
    if (!existing) {
      throw new NotFoundException(`Notice ${id} not found`)
    }
    // 已删除不可更新
    if (existing.status === NoticeStatus.Deleted) {
      throw new NotFoundException(`Notice ${id} has been deleted`)
    }
    const updated: Notice = {
      ...existing,
      ...patch,
      updatedAt: new Date().toISOString(),
    }
    noticeStore.set(id, updated)
    return updated
  }

  delete(id: string): { id: string; code: string } {
    const existing = noticeStore.get(id)
    if (!existing) {
      throw new NotFoundException(`Notice ${id} not found`)
    }
    const updated: Notice = {
      ...existing,
      status: NoticeStatus.Deleted,
      updatedAt: new Date().toISOString(),
    }
    noticeStore.set(id, updated)
    return { id, code: existing.code }
  }

  // ── Publish / Archive ──

  publish(id: string): Notice {
    const existing = noticeStore.get(id)
    if (!existing) {
      throw new NotFoundException(`Notice ${id} not found`)
    }
    if (existing.status !== NoticeStatus.Draft) {
      throw new Error(`Cannot publish notice in status ${existing.status}`)
    }
    const published = toPublishedNotice(existing)
    noticeStore.set(id, published)
    return published
  }

  archive(id: string): Notice {
    const existing = noticeStore.get(id)
    if (!existing) {
      throw new NotFoundException(`Notice ${id} not found`)
    }
    if (existing.status !== NoticeStatus.Published) {
      throw new Error(`Cannot archive notice in status ${existing.status}`)
    }
    const archived = toArchivedNotice(existing)
    noticeStore.set(id, archived)
    return archived
  }

  // ── Mark as read ──

  markRead(id: string, userId: string): Notice {
    const existing = noticeStore.get(id)
    if (!existing) {
      throw new NotFoundException(`Notice ${id} not found`)
    }
    if (existing.readBy.includes(userId)) {
      // 重复点击不重复计数
      return existing
    }
    const updated: Notice = {
      ...existing,
      readBy: [...existing.readBy, userId],
      readCount: existing.readCount + 1,
      updatedAt: new Date().toISOString(),
    }
    noticeStore.set(id, updated)
    return updated
  }

  // ── Query ──

  getById(id: string): Notice | undefined {
    return noticeStore.get(id)
  }

  getByCode(code: string): Notice | undefined {
    for (const n of noticeStore.values()) {
      if (n.code === code) return n
    }
    return undefined
  }

  list(filters?: {
    scope?: NoticeScope
    status?: string
    priority?: string
    authorId?: string
    keyword?: string
    page?: number
    pageSize?: number
  }): { items: Notice[]; total: number } {
    let results = Array.from(noticeStore.values())

    // 默认排除已删除
    results = results.filter((n) => n.status !== NoticeStatus.Deleted)

    if (filters?.scope) {
      results = results.filter((n) => n.scope === filters.scope)
    }
    if (filters?.status) {
      results = results.filter((n) => n.status === filters.status)
    }
    if (filters?.priority) {
      results = results.filter((n) => n.priority === filters.priority)
    }
    if (filters?.authorId) {
      results = results.filter((n) => n.authorId === filters.authorId)
    }
    if (filters?.keyword) {
      const kw = filters.keyword.toLowerCase()
      results = results.filter(
        (n) =>
          n.title.toLowerCase().includes(kw) ||
          (n.summary && n.summary.toLowerCase().includes(kw)),
      )
    }

    // 排序：置顶优先，然后按创建时间倒序
    results.sort((a, b) => {
      if (a.stickyOrder !== b.stickyOrder) {
        return b.stickyOrder - a.stickyOrder
      }
      return b.createdAt.localeCompare(a.createdAt)
    })

    const total = results.length
    const page = filters?.page ?? 1
    const pageSize = filters?.pageSize ?? 20
    const start = (page - 1) * pageSize
    const items = results.slice(start, start + pageSize)

    return { items, total }
  }

  /**
   * 公告列表（已内置排序：置顶 + 创建时间倒序）
   */
  listPublished(filters?: {
    scope?: NoticeScope
    priority?: string
    page?: number
    pageSize?: number
  }): { items: Notice[]; total: number } {
    return this.list({
      ...filters,
      status: NoticeStatus.Published,
    })
  }
}
