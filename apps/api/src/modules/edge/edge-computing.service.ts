import { randomUUID } from 'node:crypto'
import { Injectable } from '@nestjs/common'

export enum TicketStatus {
  Waiting = 'WAITING',
  Called = 'CALLED',
  Cancelled = 'CANCELLED',
  Completed = 'COMPLETED'
}

export interface Ticket {
  ticketId: string
  storeId: string
  ticketNumber: number
  status: TicketStatus
  issuedAt: string
  calledAt?: string
  completedAt?: string
  customerId?: string
  priority: number
}

export interface QueuePosition {
  ticketId: string
  position: number
  estimatedWaitMinutes: number
  totalWaiting: number
}

export interface CallNextResult {
  calledTicket: Ticket | null
  queueAfterCall: number
  previousTicketId: string | null
}

export interface SyncResult {
  storeId: string
  syncedAt: string
  ticketCount: number
  success: boolean
}

export interface TimeSyncResult {
  serverTime: number
  offset: number
  roundTripDelay: number
  synced: boolean
}

export interface ClockToleranceResult {
  withinTolerance: boolean
  deviationMs: number
  serverTime: number
}

/**
 * 离线取号服务 - 边缘计算
 * 支持在离线状态下发放排队号码，并在恢复网络后同步到服务器
 */
@Injectable()
export class OfflineTicketService {
  private readonly tickets = new Map<string, Ticket>()
  private readonly storeQueues = new Map<string, Set<string>>()
  private ticketCounters = new Map<string, number>()

  /**
   * 离线发放排队号码
   * @param storeId 门店ID
   * @param customerId 客户ID（可选）
   * @param priority 优先级（数值越大优先级越高，默认0）
   */
  issueTicket(
    storeId: string,
    customerId?: string,
    priority: number = 0
  ): Ticket {
    const ticketNumber = this.getNextTicketNumber(storeId)
    const ticketId = `TK-${storeId}-${ticketNumber}-${randomUUID().substring(0, 8)}`

    const ticket: Ticket = {
      ticketId,
      storeId,
      ticketNumber,
      status: TicketStatus.Waiting,
      issuedAt: new Date().toISOString(),
      customerId,
      priority
    }

    this.tickets.set(ticketId, ticket)
    this.addToStoreQueue(storeId, ticketId)

    return ticket
  }

  /**
   * 获取排队位置
   * @param ticketId 号码ID
   */
  getQueuePosition(ticketId: string): QueuePosition | null {
    const ticket = this.tickets.get(ticketId)
    if (!ticket) {
      return null
    }

    if (ticket.status !== TicketStatus.Waiting) {
      return {
        ticketId,
        position: -1,
        estimatedWaitMinutes: 0,
        totalWaiting: this.getWaitingCount(ticket.storeId)
      }
    }

    const position = this.calculatePosition(ticket.storeId, ticketId)
    const totalWaiting = this.getWaitingCount(ticket.storeId)
    const avgServiceTimeMinutes = 5
    const estimatedWaitMinutes = Math.max(0, (position - 1) * avgServiceTimeMinutes)

    return {
      ticketId,
      position,
      estimatedWaitMinutes,
      totalWaiting
    }
  }

  /**
   * 叫号（呼叫下一位）
   * @param storeId 门店ID
   */
  callNext(storeId: string): CallNextResult {
    const queue = this.storeQueues.get(storeId)
    if (!queue || queue.size === 0) {
      return {
        calledTicket: null,
        queueAfterCall: 0,
        previousTicketId: null
      }
    }

    const waitingTickets = this.getWaitingTickets(storeId)
    if (waitingTickets.length === 0) {
      return {
        calledTicket: null,
        queueAfterCall: 0,
        previousTicketId: null
      }
    }

    const highestPriority = waitingTickets.reduce(
      (max, t) => (t.priority > max.priority ? t : max),
      waitingTickets[0]
    )

    const sortedTickets = [...waitingTickets].sort((a, b) => {
      if (b.priority !== a.priority) {
        return b.priority - a.priority
      }
      return a.ticketNumber - b.ticketNumber
    })

    const nextTicket = sortedTickets[0]
    const previousTicketId = nextTicket.ticketId

    nextTicket.status = TicketStatus.Called
    nextTicket.calledAt = new Date().toISOString()

    this.tickets.set(nextTicket.ticketId, nextTicket)

    const remainingWaiting = this.getWaitingCount(storeId)

    return {
      calledTicket: nextTicket,
      queueAfterCall: remainingWaiting,
      previousTicketId
    }
  }

  /**
   * 取消号码
   * @param ticketId 号码ID
   */
  cancelTicket(ticketId: string): boolean {
    const ticket = this.tickets.get(ticketId)
    if (!ticket) {
      return false
    }

    if (ticket.status === TicketStatus.Completed) {
      return false
    }

    ticket.status = TicketStatus.Cancelled
    this.tickets.set(ticketId, ticket)
    this.removeFromStoreQueue(ticket.storeId, ticketId)

    return true
  }

  /**
   * 同步队列到服务器
   * @param storeId 门店ID
   */
  syncQueueToServer(storeId: string): SyncResult {
    const tickets = Array.from(this.tickets.values()).filter(
      (t) => t.storeId === storeId && t.status === TicketStatus.Waiting
    )

    return {
      storeId,
      syncedAt: new Date().toISOString(),
      ticketCount: tickets.length,
      success: true
    }
  }

  /**
   * 获取门店所有等待中的号码
   */
  getWaitingTickets(storeId: string): Ticket[] {
    return Array.from(this.tickets.values()).filter(
      (t) => t.storeId === storeId && t.status === TicketStatus.Waiting
    )
  }

  /**
   * 完成服务
   */
  completeTicket(ticketId: string): boolean {
    const ticket = this.tickets.get(ticketId)
    if (!ticket) {
      return false
    }

    ticket.status = TicketStatus.Completed
    ticket.completedAt = new Date().toISOString()
    this.tickets.set(ticketId, ticket)
    this.removeFromStoreQueue(ticket.storeId, ticketId)

    return true
  }

  /**
   * 获取号码详情
   */
  getTicket(ticketId: string): Ticket | null {
    return this.tickets.get(ticketId) ?? null
  }

  /**
   * 清除门店队列（用于测试）
   */
  clearStoreQueue(storeId: string): void {
    const queue = this.storeQueues.get(storeId)
    if (queue) {
      for (const ticketId of queue) {
        this.tickets.delete(ticketId)
      }
      this.storeQueues.delete(storeId)
    }
    this.ticketCounters.delete(storeId)
  }

  private getNextTicketNumber(storeId: string): number {
    const current = this.ticketCounters.get(storeId) ?? 0
    const next = current + 1
    this.ticketCounters.set(storeId, next)
    return next
  }

  private addToStoreQueue(storeId: string, ticketId: string): void {
    if (!this.storeQueues.has(storeId)) {
      this.storeQueues.set(storeId, new Set())
    }
    this.storeQueues.get(storeId)!.add(ticketId)
  }

  private removeFromStoreQueue(storeId: string, ticketId: string): void {
    const queue = this.storeQueues.get(storeId)
    if (queue) {
      queue.delete(ticketId)
    }
  }

  private getWaitingCount(storeId: string): number {
    return this.getWaitingTickets(storeId).length
  }

  private calculatePosition(storeId: string, ticketId: string): number {
    const waitingTickets = this.getWaitingTickets(storeId)

    const sortedTickets = [...waitingTickets].sort((a, b) => {
      if (b.priority !== a.priority) {
        return b.priority - a.priority
      }
      return a.ticketNumber - b.ticketNumber
    })

    const index = sortedTickets.findIndex((t) => t.ticketId === ticketId)
    return index === -1 ? -1 : index + 1
  }
}

/**
 * 时间同步服务 - 边缘计算
 * 用于在分布式边缘节点间保持时间一致性
 */
@Injectable()
export class TimeSyncService {
  private lastSyncTime = 0
  private clockOffset = 0
  private syncHistory: Array<{ offset: number; timestamp: number }> = []

  private readonly DEFAULT_TOLERANCE_MS = 500
  private readonly MAX_SYNC_HISTORY = 10

  /**
   * 获取服务器当前时间戳
   */
  getServerTime(): number {
    return Date.now()
  }

  /**
   * 计算客户端与服务器时钟偏移
   * 使用简单的时间戳比对计算偏移量
   */
  calculateClockDrift(clientTime: number, serverTime: number): number {
    const drift = serverTime - clientTime
    return drift
  }

  /**
   * 同步客户端时钟
   * @param clientTime 客户端时间戳
   * @returns 同步结果包含服务器时间、偏移量和往返延迟
   */
  syncClock(clientTime: number): TimeSyncResult {
    const t1 = Date.now()
    const serverTime = this.getServerTime()
    const t2 = Date.now()

    const roundTripDelay = t2 - t1
    const estimatedServerTime = serverTime + roundTripDelay / 2

    this.clockOffset = estimatedServerTime - clientTime
    this.lastSyncTime = serverTime

    this.addToSyncHistory(this.clockOffset)

    return {
      serverTime: estimatedServerTime,
      offset: this.clockOffset,
      roundTripDelay,
      synced: true
    }
  }

  /**
   * 检查时间是否在容差范围内
   * @param serverTime 服务器时间戳
   * @param toleranceMs 容差毫秒数（默认500ms）
   */
  isWithinTolerance(serverTime: number, toleranceMs: number = this.DEFAULT_TOLERANCE_MS): ClockToleranceResult {
    const currentServerTime = this.getServerTime()
    const deviationMs = Math.abs(currentServerTime - serverTime)
    const withinTolerance = deviationMs <= toleranceMs

    return {
      withinTolerance,
      deviationMs,
      serverTime: currentServerTime
    }
  }

  /**
   * 验证时间戳是否有效（在合理范围内）
   * @param timestamp 要验证的时间戳
   * @param maxAgeMs 最大允许的年龄（毫秒）
   */
  isTimestampValid(timestamp: number, maxAgeMs: number = 60000): boolean {
    const now = this.getServerTime()
    const age = Math.abs(now - timestamp)
    return age <= maxAgeMs
  }

  /**
   * 获取当前的时钟偏移量
   */
  getClockOffset(): number {
    return this.clockOffset
  }

  /**
   * 获取上次同步时间
   */
  getLastSyncTime(): number {
    return this.lastSyncTime
  }

  /**
   * 校准时间（使用多个样本计算更精确的偏移）
   */
  calibrateWithSamples(samples: Array<{ clientTime: number; serverTime: number }>): number {
    if (samples.length === 0) {
      return this.clockOffset
    }

    const offsets = samples.map(
      (s) => s.serverTime - s.clientTime
    )

    const medianOffset = this.calculateMedian(offsets)
    this.clockOffset = medianOffset
    this.addToSyncHistory(medianOffset)

    return medianOffset
  }

  /**
   * 获取同步历史
   */
  getSyncHistory(): Array<{ offset: number; timestamp: number }> {
    return [...this.syncHistory]
  }

  /**
   * 重置同步状态
   */
  reset(): void {
    this.clockOffset = 0
    this.lastSyncTime = 0
    this.syncHistory = []
  }

  /**
   * 根据偏移量调整时间戳
   */
  adjustTimestamp(timestamp: number): number {
    return timestamp + this.clockOffset
  }

  private addToSyncHistory(offset: number): void {
    this.syncHistory.push({
      offset,
      timestamp: Date.now()
    })

    if (this.syncHistory.length > this.MAX_SYNC_HISTORY) {
      this.syncHistory.shift()
    }
  }

  private calculateMedian(values: number[]): number {
    if (values.length === 0) return 0

    const sorted = [...values].sort((a, b) => a - b)
    const mid = Math.floor(sorted.length / 2)

    if (sorted.length % 2 === 0) {
      return (sorted[mid - 1] + sorted[mid]) / 2
    }

    return sorted[mid]
  }
}
