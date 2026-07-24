import { randomUUID } from 'node:crypto'
import { Inject, Injectable, Optional } from '@nestjs/common'
import {
  CACHE_SERVICE,
  type CacheService
} from '../../infrastructure/cache/cache.module'
import {
  QueueChannel,
  QueueEntity,
  QueueSource,
  QueueStatus,
  QueueType,
  QUEUE_STATUS_TRANSITIONS
} from './queue.entity'

const queueStore = new Map<string, QueueEntity>()

// Per-tenant per-type queue number counter
const queueNumberCounters = new Map<string, number>()

// Per-tenant-per-resource load factor (multiplier for estimated wait time)
// loadFactor: >1 means slower than baseline, <1 means faster than baseline
const loadFactorStore = new Map<string, number>()

/** Default minutes per person/group for wait estimation */
const DEFAULT_BASE_WAIT_MIN = 5

/** Default load factor (1.0 = normal) */
const DEFAULT_LOAD_FACTOR = 1.0

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
  /** WP-12A: 排队来源 */
  source?: QueueSource
  /** WP-12A: 排队渠道 */
  channel?: QueueChannel
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
  /** WP-12A: 排队来源 */
  source?: QueueSource
  /** WP-12A: 排队渠道 */
  channel?: QueueChannel
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

    // Calculate estimated wait with dynamic load factor
    const aheadCount = this.countAhead(input.tenantId, input.type)
    const loadFactor = this.getLoadFactor(input.tenantId, input.resourceId)
    const estimatedWaitMin = Math.round(aheadCount * DEFAULT_BASE_WAIT_MIN * loadFactor)

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
      source?: QueueSource
      channel?: QueueChannel
    }
  ): QueueEntity[] {
    return Array.from(queueStore.values())
      .filter((q) => q.tenantId === tenantId)
      .filter((q) => (filter?.type ? q.type === filter.type : true))
      .filter((q) => (filter?.status ? q.status === filter.status : true))
      .filter((q) => (filter?.resourceId ? q.resourceId === filter.resourceId : true))
      .filter((q) => (filter?.userId ? q.userId === filter.userId : true))
      .filter((q) => (filter?.queueNumber ? q.queueNumber === filter.queueNumber : true))
      .filter((q) => (filter?.source ? q.source === filter.source : true))
      .filter((q) => (filter?.channel ? q.channel === filter.channel : true))
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
      source?: QueueSource
      channel?: QueueChannel
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
      queueNumber: filter?.queueNumber,
      source: filter?.source,
      channel: filter?.channel
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
    const loadFactor = this.getLoadFactor(tenantId, resourceId)
    return {
      position: idx + 1,
      estimatedWaitMinutes: Math.round((idx + 1) * DEFAULT_BASE_WAIT_MIN * loadFactor),
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

  private countAhead(tenantId: string, type: QueueType, resourceId?: string): number {
    return Array.from(queueStore.values()).filter(
      (q) =>
        q.tenantId === tenantId &&
        q.type === type &&
        (q.status === QueueStatus.Waiting || q.status === QueueStatus.Called) &&
        (resourceId ? q.resourceId === resourceId : true)
    ).length
  }

  // Testing helper
  // ── 负载因子管理 ─────────────────────────────────────────────────

  /**
   * BS-0275: 获取当前负载因子
   * loadFactor key = `{tenantId}:{resourceId}` (resourceId 可选)
   * 默认 1.0
   */
  getLoadFactor(tenantId: string, resourceId?: string): number {
    // 优先查询 resource 级别的负载因子
    if (resourceId) {
      const resourceKey = `${tenantId}:${resourceId}`
      const resourceFactor = loadFactorStore.get(resourceKey)
      if (resourceFactor !== undefined) return resourceFactor
    }
    // 回退到 tenant 级别的负载因子
    const tenantKey = tenantId
    return loadFactorStore.get(tenantKey) ?? DEFAULT_LOAD_FACTOR
  }

  /**
   * BS-0275: 设置负载因子（动态调整等待时间）
   * - loadFactor > 1: 慢于基线（繁忙时段）
   * - loadFactor < 1: 快于基线（空闲时段）
   * - loadFactor = 1: 基线速度
   * 范围: 0.5 ~ 3.0
   */
  setLoadFactor(tenantId: string, loadFactor: number, resourceId?: string): void {
    const clamped = Math.max(0.5, Math.min(3.0, loadFactor))
    const key = resourceId ? `${tenantId}:${resourceId}` : tenantId
    loadFactorStore.set(key, Math.round(clamped * 10) / 10)
  }

  /**
   * BS-0275: 动态计算预计等待时间
   * 根据当前排队人数 × 负载因子 × 基线时间
   */
  calculateDynamicWait(
    tenantId: string,
    resourceId?: string,
    type?: QueueType
  ): { aheadCount: number; loadFactor: number; estimatedWaitMin: number } {
    const effectiveType = type ?? QueueType.Waiting
    const aheadCount = this.countAhead(tenantId, effectiveType, resourceId)
    const loadFactor = this.getLoadFactor(tenantId, resourceId)
    const estimatedWaitMin = Math.round(aheadCount * DEFAULT_BASE_WAIT_MIN * loadFactor)
    return { aheadCount, loadFactor, estimatedWaitMin }
  }

  // ════════════════════════════════════════════════════════════════
  // WP-12A: 双模排队 + 渠道同步
  // ════════════════════════════════════════════════════════════════

  /**
   * 按来源获取队列（线上 vs 现场）
   */
  getQueueBySource(
    tenantId: string,
    source: QueueSource,
    resourceId?: string
  ): QueueEntity[] {
    return Array.from(queueStore.values())
      .filter((q) => q.tenantId === tenantId)
      .filter((q) => q.source === source)
      .filter((q) => (resourceId ? q.resourceId === resourceId : true))
      .filter((q) =>
        q.status === QueueStatus.Waiting ||
        q.status === QueueStatus.Called ||
        q.status === QueueStatus.Serving
      )
      .sort((a, b) => {
        if (a.priority !== b.priority) return b.priority - a.priority
        return a.queueNumber.localeCompare(b.queueNumber)
      })
  }

  /**
   * 按渠道获取队列（微信/App/终端/Kiosk）
   */
  getQueueByChannel(
    tenantId: string,
    channel: QueueChannel,
    resourceId?: string
  ): QueueEntity[] {
    return Array.from(queueStore.values())
      .filter((q) => q.tenantId === tenantId)
      .filter((q) => q.channel === channel)
      .filter((q) => (resourceId ? q.resourceId === resourceId : true))
      .filter((q) => q.status === QueueStatus.Waiting)
      .sort((a, b) => {
        if (a.priority !== b.priority) return b.priority - a.priority
        return a.queueNumber.localeCompare(b.queueNumber)
      })
  }

  /**
   * WP-12A: 带 source/channel 的排队统计分析
   * 返回各来源/渠道的排队统计数据
   */
  getDualModeStats(tenantId: string, resourceId?: string): {
    online: { waiting: number; called: number; serving: number }
    onsite: { waiting: number; called: number; serving: number }
    byChannel: Record<string, { waiting: number }>
    total: number
  } {
    const active = Array.from(queueStore.values())
      .filter((q) => q.tenantId === tenantId)
      .filter((q) => (resourceId ? q.resourceId === resourceId : true))

    const countStatus = (
      arr: QueueEntity[],
      ...statuses: QueueStatus[]
    ): number => arr.filter((q) => statuses.includes(q.status)).length

    const online = active.filter((q) => q.source === QueueSource.Online)
    const onsite = active.filter((q) => q.source === QueueSource.Onsite)

    // Group by channel
    const byChannel: Record<string, { waiting: number }> = {}
    for (const ch of Object.values(QueueChannel)) {
      const chanEntries = active.filter((q) => q.channel === ch)
      byChannel[ch] = { waiting: countStatus(chanEntries, QueueStatus.Waiting) }
    }

    return {
      online: {
        waiting: countStatus(online, QueueStatus.Waiting),
        called: countStatus(online, QueueStatus.Called),
        serving: countStatus(online, QueueStatus.Serving)
      },
      onsite: {
        waiting: countStatus(onsite, QueueStatus.Waiting),
        called: countStatus(onsite, QueueStatus.Called),
        serving: countStatus(onsite, QueueStatus.Serving)
      },
      byChannel,
      total: active.filter((q) =>
        [QueueStatus.Waiting, QueueStatus.Called, QueueStatus.Serving].includes(q.status)
      ).length
    }
  }

  /**
   * WP-12A: 队列状态同步
   * 某个渠道（如微信）查询时可获得全渠道排队状态
   */
  getSyncStatus(
    memberId: string,
    tenantId: string
  ): {
    entries: QueueEntity[]
    hasActiveQueue: boolean
    activeEntry: QueueEntity | null
  } {
    const entries = Array.from(queueStore.values())
      .filter((q) => q.tenantId === tenantId && q.userId === memberId)
      .filter((q) =>
        q.status === QueueStatus.Waiting ||
        q.status === QueueStatus.Called ||
        q.status === QueueStatus.Serving
      )
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())

    const activeEntry = entries[0] ?? null
    return {
      entries,
      hasActiveQueue: entries.length > 0,
      activeEntry
    }
  }

  /**
   * WP-12A: 为特定渠道创建排队
   */
  joinByChannel(
    input: JoinQueueInput & { channel: QueueChannel }
  ): QueueEntity {
    return this.create({
      tenantId: input.tenantId,
      type: input.queueType,
      userId: input.memberId,
      userName: input.memberName ?? input.memberId,
      partySize: 1,
      resourceId: input.resourceId,
      resourceName: input.resourceName,
      priority: input.priority,
      remark: input.remark,
      source: input.channel === QueueChannel.WeChat || input.channel === QueueChannel.App
        ? QueueSource.Online
        : QueueSource.Onsite,
      channel: input.channel
    })
  }

  /**
   * WP-12A: 转换排队入口（例如线上转现场）
   */
  transferEntry(
    entryId: string,
    tenantId: string,
    targetSource: QueueSource
  ): QueueEntity {
    const entry = this.assertOwned(entryId, tenantId)
    if (entry.source === targetSource) {
      throw new Error(`Entry ${entryId} is already ${targetSource}`)
    }
    entry.source = targetSource
    entry.channel = targetSource === QueueSource.Onsite
      ? QueueChannel.Terminal
      : QueueChannel.WeChat
    entry.updatedAt = new Date()
    queueStore.set(entryId, entry)
    return entry
  }

  /**
   * WP-12A: 等待时间预测（按渠道差异化）
   * 线上排队等待时间 = 基础时间 × 线上排队人数 × 负载因子
   * 现场排队等待时间 = 基础时间 × 现场排队人数 × 负载因子
   */
  getEstimatedWaitBySource(
    tenantId: string,
    resourceId?: string
  ): {
    onlineAhead: number
    onsiteAhead: number
    onlineWaitMin: number
    onsiteWaitMin: number
    totalWaitMin: number
  } {
    const onlineAhead = this.getQueueBySource(tenantId, QueueSource.Online, resourceId).length
    const onsiteAhead = this.getQueueBySource(tenantId, QueueSource.Onsite, resourceId).length
    const loadFactor = this.getLoadFactor(tenantId, resourceId)

    return {
      onlineAhead,
      onsiteAhead,
      onlineWaitMin: Math.round(onlineAhead * DEFAULT_BASE_WAIT_MIN * loadFactor),
      onsiteWaitMin: Math.round(onsiteAhead * DEFAULT_BASE_WAIT_MIN * loadFactor),
      totalWaitMin: Math.round((onlineAhead + onsiteAhead) * DEFAULT_BASE_WAIT_MIN * loadFactor)
    }
  }

  // ── BS-0295: 系统容量检测 ────────────────────────────────

  /**
   * BS-0295: 获取系统容量/负载状态
   * 排队取号时检测系统负载，超过阈值返回系统繁忙状态
   * 状态端点: GET /queue/capacity
   */
  getCapacityStatus(tenantId: string): {
    loadFactor: number
    waitingCount: number
    capacityThreshold: number
    isBusy: boolean
    message: string
  } {
    const loadFactor = this.getLoadFactor(tenantId)
    const waitingEntries = Array.from(queueStore.values()).filter(
      (q) => q.tenantId === tenantId && q.status === QueueStatus.Waiting
    )
    const waitingCount = waitingEntries.length

    // 负载阈值: loadFactor >= 2.0 或等待人数 >= 15 视为繁忙
    const capacityThreshold = 2.0
    const waitingThreshold = 15
    const isBusy = loadFactor >= capacityThreshold || waitingCount >= waitingThreshold

    return {
      loadFactor,
      waitingCount,
      capacityThreshold,
      isBusy,
      message: isBusy
        ? '系统繁忙，当前排队人数较多，预计等待时间较长'
        : '系统运行正常'
    }
  }

  // Testing helper
  resetQueueStoresForTests(): void {
    queueStore.clear()
    queueNumberCounters.clear()
    loadFactorStore.clear()
  }
}
