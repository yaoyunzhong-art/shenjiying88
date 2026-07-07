import { randomUUID } from 'node:crypto'
import { Injectable } from '@nestjs/common'
import type { CashierOrder, CashierPayment } from './cashier.entity'

export enum RefundStatus {
  Pending = 'PENDING',
  Processing = 'PROCESSING',
  Completed = 'COMPLETED',
  Failed = 'FAILED'
}

export interface RefundRecord {
  refundId: string
  transactionId: string
  amount: number
  reason?: string
  status: RefundStatus
  orderId: string
  createdAt: string
  completedAt?: string
  failureReason?: string
}

export interface OfflineOrder {
  orderId: string
  memberId: string
  items: Array<{ skuId: string; quantity: number; price: number }>
  totalAmount: number
  currency: string
  channel: string
  queuedAt: string
  synced: boolean
}

export type ChannelType = 'POS' | 'Web' | 'Mobile' | 'MiniApp'

export interface ChannelRouteResult {
  channel: ChannelType
  success: boolean
  syncedAt?: string
  error?: string
}

export interface LytPointsReversal {
  reversalId: string
  orderId: string
  memberId: string
  points: number
  reversedAt: string
}

@Injectable()
export class OfflineQueueManager {
  private readonly queue = new Map<string, OfflineOrder>()

  enqueueOfflineOrder(order: OfflineOrder): { enqueued: boolean; queueSize: number } {
    if (this.queue.has(order.orderId)) {
      return { enqueued: false, queueSize: this.queue.size }
    }
    this.queue.set(order.orderId, { ...order, queuedAt: new Date().toISOString(), synced: false })
    return { enqueued: true, queueSize: this.queue.size }
  }

  async flushQueue(
    submitFn: (orders: OfflineOrder[]) => Promise<{ success: string[]; failed: string[] }>
  ): Promise<{ success: string[]; failed: string[]; flushedCount: number }> {
    const orders = Array.from(this.queue.values()).filter((o) => !o.synced)
    if (orders.length === 0) {
      return { success: [], failed: [], flushedCount: 0 }
    }

    const result = await submitFn(orders)
    result.success.forEach((orderId) => {
      const order = this.queue.get(orderId)
      if (order) {
        order.synced = true
      }
    })

    return { ...result, flushedCount: orders.length }
  }

  getQueueSize(): number {
    return this.queue.size
  }

  getUnsyncedCount(): number {
    return Array.from(this.queue.values()).filter((o) => !o.synced).length
  }

  clearQueue(): { clearedCount: number } {
    const clearedCount = this.queue.size
    this.queue.clear()
    return { clearedCount }
  }

  getQueuedOrders(): OfflineOrder[] {
    return Array.from(this.queue.values())
  }

  getUnsyncedOrders(): OfflineOrder[] {
    return Array.from(this.queue.values()).filter((o) => !o.synced)
  }

  markSynced(orderId: string): boolean {
    const order = this.queue.get(orderId)
    if (!order) return false
    order.synced = true
    return true
  }

  removeOrder(orderId: string): boolean {
    return this.queue.delete(orderId)
  }
}

@Injectable()
export class RefundProcessor {
  private readonly refunds = new Map<string, RefundRecord>()
  private readonly pointsReversals = new Map<string, LytPointsReversal>()

  async processRefund(
    transactionId: string,
    amount: number,
    reason?: string,
    orderId?: string
  ): Promise<RefundRecord> {
    const existingRefund = Array.from(this.refunds.values()).find(
      (r) => r.transactionId === transactionId && r.status === RefundStatus.Completed
    )
    if (existingRefund) {
      throw new Error(`Transaction ${transactionId} has already been refunded`)
    }

    const pendingRefund = Array.from(this.refunds.values()).find(
      (r) => r.transactionId === transactionId && r.status === RefundStatus.Pending
    )
    if (pendingRefund) {
      pendingRefund.status = RefundStatus.Processing
      pendingRefund.createdAt = new Date().toISOString()
      this.refunds.set(pendingRefund.refundId, pendingRefund)
      return pendingRefund
    }

    const refundId = `refund-${randomUUID()}`
    const refund: RefundRecord = {
      refundId,
      transactionId,
      amount,
      reason,
      orderId: orderId ?? transactionId,
      status: RefundStatus.Processing,
      createdAt: new Date().toISOString()
    }
    this.refunds.set(refundId, refund)

    try {
      await this.simulateRefundProcessing(refund)
      refund.status = RefundStatus.Completed
      refund.completedAt = new Date().toISOString()
    } catch {
      refund.status = RefundStatus.Failed
      refund.failureReason = 'Refund processing failed'
    }
    this.refunds.set(refundId, refund)

    return refund
  }

  private async simulateRefundProcessing(refund: RefundRecord): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 10))
    if (refund.amount <= 0) {
      throw new Error('Invalid refund amount')
    }
  }

  async queryRefundStatus(refundId: string): Promise<RefundRecord | null> {
    return this.refunds.get(refundId) ?? null
  }

  async reverseLytPoints(orderId: string, memberId: string, points: number): Promise<LytPointsReversal> {
    const existingReversal = Array.from(this.pointsReversals.values()).find(
      (r) => r.orderId === orderId && r.memberId === memberId
    )
    if (existingReversal) {
      throw new Error(`Points for order ${orderId} member ${memberId} already reversed`)
    }

    const reversalId = `reversal-${randomUUID()}`
    const reversal: LytPointsReversal = {
      reversalId,
      orderId,
      memberId,
      points,
      reversedAt: new Date().toISOString()
    }
    this.pointsReversals.set(reversalId, reversal)
    return reversal
  }

  getRefundByTransaction(transactionId: string): RefundRecord | null {
    return (
      Array.from(this.refunds.values()).find((r) => r.transactionId === transactionId) ?? null
    )
  }

  getReversalsByMember(memberId: string): LytPointsReversal[] {
    return Array.from(this.pointsReversals.values()).filter((r) => r.memberId === memberId)
  }

  clearRefunds(): void {
    this.refunds.clear()
    this.pointsReversals.clear()
  }
}

@Injectable()
export class MultiChannelRouter {
  private readonly channelRoutes = new Map<string, ChannelType>()
  private readonly syncRecords = new Map<string, ChannelRouteResult>()

  routeToChannel(order: OfflineOrder): ChannelRouteResult {
    const channel = this.resolveChannel(order)
    this.channelRoutes.set(order.orderId, channel)
    return { channel, success: true, syncedAt: new Date().toISOString() }
  }

  private resolveChannel(order: OfflineOrder): ChannelType {
    const channel = order.channel?.toUpperCase()
    if (channel === 'POS' || channel === 'POS-ORDER') return 'POS'
    if (channel === 'WEB' || channel === 'WEB-ORDER') return 'Web'
    if (channel === 'MOBILE' || channel === 'APP') return 'Mobile'
    if (channel === 'MINIAPP' || channel === 'MINI-PROGRAM') return 'MiniApp'
    return 'Web'
  }

  async syncToChannel(
    order: OfflineOrder,
    channel: ChannelType
  ): Promise<ChannelRouteResult> {
    const supportedChannels: ChannelType[] = ['POS', 'Web', 'Mobile', 'MiniApp']
    if (!supportedChannels.includes(channel)) {
      const result: ChannelRouteResult = {
        channel,
        success: false,
        error: `Unsupported channel: ${channel}`
      }
      this.syncRecords.set(`${order.orderId}-${channel}`, result)
      return result
    }

    try {
      await this.performChannelSync(order, channel)
      const result: ChannelRouteResult = {
        channel,
        success: true,
        syncedAt: new Date().toISOString()
      }
      this.syncRecords.set(`${order.orderId}-${channel}`, result)
      return result
    } catch (error) {
      const result: ChannelRouteResult = {
        channel,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown sync error'
      }
      this.syncRecords.set(`${order.orderId}-${channel}`, result)
      return result
    }
  }

  private async performChannelSync(order: OfflineOrder, channel: ChannelType): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 5))
    if (!order.items || order.items.length === 0) {
      throw new Error('Order has no items')
    }
    if (order.totalAmount <= 0) {
      throw new Error('Invalid order amount')
    }
  }

  getChannelRoute(orderId: string): ChannelType | null {
    return this.channelRoutes.get(orderId) ?? null
  }

  getSyncRecord(orderId: string, channel: ChannelType): ChannelRouteResult | null {
    return this.syncRecords.get(`${orderId}-${channel}`) ?? null
  }

  getAllSyncRecords(orderId: string): ChannelRouteResult[] {
    return Array.from(this.syncRecords.entries())
      .filter(([key]) => key.startsWith(orderId))
      .map(([, value]) => value)
  }

  clearRecords(): void {
    this.channelRoutes.clear()
    this.syncRecords.clear()
  }
}
