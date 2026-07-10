import { randomUUID } from 'node:crypto'
import { Inject, Injectable, Optional } from '@nestjs/common'
import {
  CACHE_SERVICE,
  type CacheService
} from '../../infrastructure/cache/cache.module'
import {
  QueueEntity,
  QueueStatus,
  QueueType,
  QUEUE_STATUS_TRANSITIONS
} from './queue.entity'

const queueStore = new Map<string, QueueEntity>()

// Per-tenant per-type queue number counter
const queueNumberCounters = new Map<string, number>()

export interface CreateQueueInput {
  tenantId: string
  type: QueueType
  userId: string
  userName: string
  phone?: string
  partySize: number
  resourceId?: string
  resourceName?: string
  priority?: number
  remark?: string
}

/**
 * Controller-facing wrapper input. The HTTP layer (QueueController.joinQueue)
 * passes a tenantContext + lightweight fields; the service translates it
 * to a CreateQueueInput internally.
 */
export interface JoinQueueInput {
  tenantId: string
  queueType: QueueType
  memberId: string
  memberName?: string
  resourceId?: string
  resourceName?: string
  priority?: number
  remark?: string
}

export interface QueuePosition {
  position: number
  estimatedWaitMinutes: number
  entry: QueueEntity | null
}

export interface QueueStats {
  total: number
  waitingCount: number
  calledCount: number
  servingCount: number
  completedCount: number
  cancelledCount: number
  noShowCount: number
  avgWaitMin: number
}

export interface PaginatedResult<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

@Injectable()
export class QueueService {
  // ── CRUD ───────────────────────────────────────────────────────────

  create(input: CreateQueueInput): QueueEntity {
    const now = new Date()

    // Generate queue number: per-tenant per-type counter
    const counterKey = `${input.tenantId}:${input.type}`
    const currentNumber = (queueNumberCounters.get(counterKey) ?? 0) + 1
    queueNumberCounters.set(counterKey, currentNumber)

    // Format: A001, A002, ... (A=booking, B=waiting, C=service)
    const prefixMap: Record<QueueType, string> = {
      [QueueType.Booking]: 'A',
      [QueueType.Waiting]: 'B',
      [QueueType.Service]: 'C'
    }
    const prefix = prefixMap[input.type]
    const queueNumber = `${prefix}${String(currentNumber).padStart(3, '0')}`

    // Calculate estimated wait
    const aheadCount = this.countAhead(input.tenantId, input.type)
    const estimatedWaitMin = aheadCount * 5 // 5 min per person/group default

    const entry = new QueueEntity()
    entry.id = `queue-${randomUUID()}`
    entry.tenantId = input.tenantId
    entry.type = input.type
    entry.queueNumber = queueNumber
    entry.userId = input.userId
    entry.userName = input.userName
    entry.phone = input.phone
    entry.partySize = input.partySize
    entry.resourceId = input.resourceId
    entry.resourceName = input.resourceName
    entry.status = QueueStatus.Waiting
    entry.priority = input.priority ?? 0
    entry.estimatedWaitMin = estimatedWaitMin
    entry.remark = input.remark
    entry.createdAt = now
    entry.updatedAt = now

    queueStore.set(entry.id, entry)
    return entry
  }

  /**
   * 用户取号 —— 自动生成排队号
   */
  takeNumber(input: CreateQueueInput): QueueEntity {
    return this.create(input)
  }

  findAll(
    tenantId: string,
    filter?: {
      type?: QueueType
      status?: QueueStatus
      resourceId?: string
      userId?: string
      queueNumber?: string
    }
  ): QueueEntity[] {
    return Array.from(queueStore.values())
      .filter((q) => q.tenantId === tenantId)
      .filter((q) => (filter?.type ? q.type === filter.type : true))
      .filter((q) => (filter?.status ? q.status === filter.status : true))
      .filter((q) => (filter?.resourceId ? q.resourceId === filter.resourceId : true))
      .filter((q) => (filter?.userId ? q.userId === filter.userId : true))
      .filter((q) => (filter?.queueNumber ? q.queueNumber === filter.queueNumber : true))
      .sort((a, b) => a.queueNumber.localeCompare(b.queueNumber))
  }

  findPaginated(
    tenantId: string,
    filter?: {
      type?: QueueType
      status?: QueueStatus
      resourceId?: string
      userId?: string
      queueNumber?: string
      page?: number
      pageSize?: number
      sortBy?: string
      sortOrder?: 'asc' | 'desc'
    }
  ): PaginatedResult<QueueEntity> {
    const page = filter?.page ?? 1
    const pageSize = filter?.pageSize ?? 20

    const items = this.findAll(tenantId, {
      type: filter?.type,
      status: filter?.status,
      resourceId: filter?.resourceId,
      userId: filter?.userId,
      queueNumber: filter?.queueNumber
    })

    // Sort
    if (filter?.sortBy) {
      const order = filter.sortOrder === 'desc' ? -1 : 1
      items.sort((a: any, b: any) => {
        const aVal = a[filter.sortBy!]
        const bVal = b[filter.sortBy!]
        if (aVal == null && bVal == null) return 0
        if (aVal == null) return -order
        if (bVal == null) return order
        if (typeof aVal === 'string') return aVal.localeCompare(bVal) * order
        return (aVal > bVal ? 1 : -1) * order
      })
    } else {
      // Default: waiting first, then called, then serving, then others
      const statusOrder: Record<string, number> = {
        [QueueStatus.Waiting]: 0,
        [QueueStatus.Called]: 1,
        [QueueStatus.Serving]: 2,
        [QueueStatus.Completed]: 3,
        [QueueStatus.Cancelled]: 4,
        [QueueStatus.NoShow]: 5
      }
      items.sort((a, b) => {
        const sDiff = (statusOrder[a.status] ?? 9) - (statusOrder[b.status] ?? 9)
        if (sDiff !== 0) return sDiff
        return a.queueNumber.localeCompare(b.queueNumber)
      })
    }

    const total = items.length
    const totalPages = Math.ceil(total / pageSize)
    const start = (page - 1) * pageSize
    const pagedItems = items.slice(start, start + pageSize)

    return { items: pagedItems, total, page, pageSize, totalPages }
  }

  findOne(id: string, tenantId: string): QueueEntity | undefined {
    const entry = queueStore.get(id)
    if (!entry || entry.tenantId !== tenantId) return undefined
    return entry
  }

  update(
    id: string,
    tenantId: string,
    data: {
      partySize?: number
      phone?: string
      resourceName?: string
      remark?: string
    }
  ): QueueEntity {
    const entry = this.assertOwned(id, tenantId)
    if (data.partySize !== undefined) entry.partySize = data.partySize
    if (data.phone !== undefined) entry.phone = data.phone
    if (data.resourceName !== undefined) entry.resourceName = data.resourceName
    if (data.remark !== undefined) entry.remark = data.remark
    entry.updatedAt = new Date()
    queueStore.set(id, entry)
    return entry
  }

  cancel(id: string, tenantId: string): QueueEntity {
    const entry = this.assertOwned(id, tenantId)
    this.assertStatusTransition(entry.status, QueueStatus.Cancelled)
    entry.status = QueueStatus.Cancelled
    entry.updatedAt = new Date()
    queueStore.set(id, entry)
    return entry
  }

  // ── Controller-facing wrappers ─────────────────────────────────────

  /**
   * Controller wrapper: HTTP POST /queue/join
   * Translates JoinQueueInput → internal CreateQueueInput
   * Auto-derives partySize=1 (single-member join) since memberId is the join unit
   */
  joinQueue(input: JoinQueueInput): QueueEntity {
    return this.create({
      tenantId: input.tenantId,
      type: input.queueType,
      userId: input.memberId,
      userName: input.memberName ?? input.memberId,
      partySize: 1,
      resourceId: input.resourceId,
      resourceName: input.resourceName,
      priority: input.priority,
      remark: input.remark
    })
  }

  /**
   * Controller wrapper: HTTP POST /queue/:entryId/leave
   * Alias for cancel() — uses Cancelled transition (Waiting→Cancelled)
   */
  leaveQueue(entryId: string, tenantId: string): QueueEntity {
    return this.cancel(entryId, tenantId)
  }

  /**
   * Controller wrapper: HTTP POST /queue/:entryId/complete
   * Alias for complete() (HTTP route 'complete' collides with NestJS reserved path semantics)
   */
  completeService(entryId: string, tenantId: string): QueueEntity {
    return this.complete(entryId, tenantId)
  }

  /**
   * Controller wrapper: HTTP GET /queue/status/:resourceId
   * Returns QueueStats scoped to a single resource (resourceId required)
   */
  getQueueStatus(resourceId: string, tenantId: string): QueueStats {
    return this.getQueueStats(tenantId, resourceId)
  }

  /**
   * Controller wrapper: HTTP GET /queue/position
   * Returns the member's position in the waiting list for the resource.
   * - position = -1 means not in queue or invalid input
   * - estimatedWaitMinutes is position × 5 (matches create() heuristic)
   */
  getMyPosition(memberId: string, resourceId: string, tenantId: string): QueuePosition {
    if (!memberId || !resourceId) {
      return { position: -1, estimatedWaitMinutes: 0, entry: null }
    }

    const waiting = this.getWaitingList(tenantId, resourceId)
    const idx = waiting.findIndex((q) => q.userId === memberId)
    if (idx === -1) {
      return { position: -1, estimatedWaitMinutes: 0, entry: null }
    }
    return {
      position: idx + 1,
      estimatedWaitMinutes: (idx + 1) * 5,
      entry: waiting[idx]
    }
  }

  // ── 叫号 ───────────────────────────────────────────────────────────

  /**
   * Controller wrapper: HTTP POST /queue/call-next
   * Calls the next waiting entry for a resource. Signature is
   * (resourceId, tenantId) — matches QueueController.callNext.
   */
  callNext(resourceId: string, tenantId: string): QueueEntity | null {
    const waitingEntries = Array.from(queueStore.values())
      .filter((q) => q.tenantId === tenantId)
      .filter((q) => q.status === QueueStatus.Waiting)
      .filter((q) => (resourceId ? q.resourceId === resourceId : true))
      .sort((a, b) => {
        // Higher priority first
        if (a.priority !== b.priority) return b.priority - a.priority
        // Then by queueNumber
        return a.queueNumber.localeCompare(b.queueNumber)
      })

    const next = waitingEntries[0] ?? null
    if (next) {
      next.status = QueueStatus.Called
      next.calledAt = new Date()
      next.updatedAt = new Date()

      // Calculate actual wait time from createdAt to now
      next.actualWaitMin = Math.round(
        (next.calledAt.getTime() - next.createdAt.getTime()) / 60000
      )

      queueStore.set(next.id, next)
    }
    return next
  }

  /**
   * Tenant-scoped call-next (preserved for back-compat).
   * Older entry-point style — picks next across all resources for tenant.
   */
  callNextByTenant(tenantId: string, resourceId?: string, type?: QueueType): QueueEntity | null {
    return this.callNext(resourceId ?? '', tenantId) ?? null
  }

  // ── 开始服务 ───────────────────────────────────────────────────────

  /**
   * 开始服务 called→serving
   */
  startService(id: string, tenantId: string): QueueEntity {
    const entry = this.assertOwned(id, tenantId)
    this.assertStatusTransition(entry.status, QueueStatus.Serving)
    entry.status = QueueStatus.Serving
    entry.servedAt = new Date()
    entry.updatedAt = new Date()
    queueStore.set(id, entry)
    return entry
  }

  // ── 完成服务 ───────────────────────────────────────────────────────

  /**
   * 完成 serving→completed
   */
  complete(id: string, tenantId: string): QueueEntity {
    const entry = this.assertOwned(id, tenantId)
    this.assertStatusTransition(entry.status, QueueStatus.Completed)
    entry.status = QueueStatus.Completed
    entry.completedAt = new Date()
    entry.updatedAt = new Date()
    queueStore.set(id, entry)
    return entry
  }

  // ── 过号 ───────────────────────────────────────────────────────────

  /**
   * 过号 called→no_show
   */
  markNoShow(id: string, tenantId: string): QueueEntity {
    const entry = this.assertOwned(id, tenantId)
    this.assertStatusTransition(entry.status, QueueStatus.NoShow)
    entry.status = QueueStatus.NoShow
    entry.updatedAt = new Date()
    queueStore.set(id, entry)
    return entry
  }

  // ── 队列查询 ───────────────────────────────────────────────────────

  /**
   * 获取当前队列（waiting + called + serving）
   */
  getCurrentQueue(
    tenantId: string,
    resourceId?: string,
    type?: QueueType
  ): QueueEntity[] {
    return Array.from(queueStore.values())
      .filter((q) => q.tenantId === tenantId)
      .filter((q) =>
        q.status === QueueStatus.Waiting ||
        q.status === QueueStatus.Called ||
        q.status === QueueStatus.Serving
      )
      .filter((q) => (resourceId ? q.resourceId === resourceId : true))
      .filter((q) => (type ? q.type === type : true))
      .sort((a, b) => {
        const statusOrder: Record<string, number> = {
          [QueueStatus.Serving]: 0,
          [QueueStatus.Called]: 1,
          [QueueStatus.Waiting]: 2
        }
        return (statusOrder[a.status] ?? 9) - (statusOrder[b.status] ?? 9)
      })
  }

  /**
   * 获取等待列表
   */
  getWaitingList(
    tenantId: string,
    resourceId?: string,
    type?: QueueType
  ): QueueEntity[] {
    return Array.from(queueStore.values())
      .filter((q) => q.tenantId === tenantId)
      .filter((q) => q.status === QueueStatus.Waiting)
      .filter((q) => (resourceId ? q.resourceId === resourceId : true))
      .filter((q) => (type ? q.type === type : true))
      .sort((a, b) => {
        if (a.priority !== b.priority) return b.priority - a.priority
        return a.queueNumber.localeCompare(b.queueNumber)
      })
  }

  // ── 统计 ───────────────────────────────────────────────────────────

  /**
   * 获取队列统计（等待人数/平均等待时间等）
   */
  getQueueStats(
    tenantId: string,
    resourceId?: string,
    type?: QueueType
  ): QueueStats {
    const entries = Array.from(queueStore.values())
      .filter((q) => q.tenantId === tenantId)
      .filter((q) => (resourceId ? q.resourceId === resourceId : true))
      .filter((q) => (type ? q.type === type : true))

    const waiting = entries.filter((q) => q.status === QueueStatus.Waiting)
    const completed = entries.filter(
      (q) => q.status === QueueStatus.Completed && q.actualWaitMin != null
    )

    const avgWaitMin =
      completed.length > 0
        ? Math.round(
            completed.reduce((sum, q) => sum + (q.actualWaitMin ?? 0), 0) /
              completed.length
          )
        : 0

    return {
      total: entries.length,
      waitingCount: entries.filter((q) => q.status === QueueStatus.Waiting).length,
      calledCount: entries.filter((q) => q.status === QueueStatus.Called).length,
      servingCount: entries.filter((q) => q.status === QueueStatus.Serving).length,
      completedCount: entries.filter((q) => q.status === QueueStatus.Completed).length,
      cancelledCount: entries.filter((q) => q.status === QueueStatus.Cancelled).length,
      noShowCount: entries.filter((q) => q.status === QueueStatus.NoShow).length,
      avgWaitMin
    }
  }

  // ── Internals ──────────────────────────────────────────────────────

  private assertOwned(id: string, tenantId: string): QueueEntity {
    const entry = queueStore.get(id)
    if (!entry || entry.tenantId !== tenantId) {
      throw new Error(`Queue entry not found: ${id}`)
    }
    return entry
  }

  private assertStatusTransition(from: QueueStatus, to: QueueStatus): void {
    const allowed = QUEUE_STATUS_TRANSITIONS[from]
    if (!allowed.includes(to)) {
      throw new Error(`Invalid queue status transition: ${from} → ${to}`)
    }
  }

  private countAhead(tenantId: string, type: QueueType): number {
    return Array.from(queueStore.values()).filter(
      (q) =>
        q.tenantId === tenantId &&
        q.type === type &&
        (q.status === QueueStatus.Waiting || q.status === QueueStatus.Called)
    ).length
  }

  // Testing helper
  resetQueueStoresForTests(): void {
    queueStore.clear()
    queueNumberCounters.clear()
  }
}
