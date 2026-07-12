import { Logger } from '@nestjs/common'
import { Order, OrderItem } from '@m5/types'

/**
 * Phase-2 T106-2: 离线收银边缘计算
 *
 * P1-2 LYT Webhook 异步确认
 * P1-12 数据同步幂等性
 *
 * 职责：树哥B（优化+边界）
 */

/** 本地订单（离线场景，包含 items） */
export interface LocalOrder extends Partial<Order> {
  items?: OrderItem[]
}

/** 幂等性检查器 - 内存实现 */
export class IdempotencyChecker {
  private readonly cache = new Set<string>()
  private readonly results = new Map<string, unknown>()

  /**
   * 检查是否已处理过该幂等键
   * @returns true 表示已处理（直接返回缓存结果）
   */
  check(idempotencyKey: string): boolean {
    return this.cache.has(idempotencyKey)
  }

  /**
   * 标记已处理并缓存结果
   */
  mark(idempotencyKey: string, result: unknown): void {
    this.cache.add(idempotencyKey)
    this.results.set(idempotencyKey, result)
  }

  /**
   * 获取已缓存的结果
   */
  get(idempotencyKey: string): unknown | null {
    if (!this.cache.has(idempotencyKey)) {
      return null
    }
    return this.results.get(idempotencyKey) ?? null
  }

  /** 清空缓存（测试用） */
  clear(): void {
    this.cache.clear()
    this.results.clear()
  }
}

/** 冲突报告 */
export interface ConflictReport {
  field: string
  localValue: unknown
  serverValue: unknown
}

/** 订单冲突检测与解决器 */
export class ConflictResolver {
  /**
   * 检测本地订单与服务器订单的冲突
   * @returns null 表示无冲突，否则返回冲突字段列表
   */
  detectConflict(localOrder: LocalOrder, serverOrder: LocalOrder): ConflictReport[] | null {
    const conflicts: ConflictReport[] = []

    // 检测金额冲突
    if (localOrder.totalCents !== undefined && serverOrder.totalCents !== undefined) {
      if (localOrder.totalCents !== serverOrder.totalCents) {
        conflicts.push({
          field: 'totalCents',
          localValue: localOrder.totalCents,
          serverValue: serverOrder.totalCents
        })
      }
    }

    // 检测状态冲突
    if (localOrder.status !== undefined && serverOrder.status !== undefined) {
      if (localOrder.status !== serverOrder.status) {
        conflicts.push({
          field: 'status',
          localValue: localOrder.status,
          serverValue: serverOrder.status
        })
      }
    }

    // 检测商品数量冲突
    if (localOrder.items !== undefined && serverOrder.items !== undefined) {
      const localItemCount = localOrder.items.length
      const serverItemCount = serverOrder.items.length
      if (localItemCount !== serverItemCount) {
        conflicts.push({
          field: 'items',
          localValue: localItemCount,
          serverValue: serverItemCount
        })
      }
    }

    return conflicts.length > 0 ? conflicts : null
  }

  /**
   * 按时间戳选择 - 谁更新用谁（较新时间戳胜出）
   */
  resolveByTimestamp(localOrder: LocalOrder, serverOrder: LocalOrder): LocalOrder {
    const localTime = localOrder.updatedAt ? new Date(localOrder.updatedAt).getTime() : 0
    const serverTime = serverOrder.updatedAt ? new Date(serverOrder.updatedAt).getTime() : 0

    if (localTime >= serverTime) {
      return localOrder
    }
    return serverOrder
  }

  /**
   * 按金额选择 - 金额大优先（用于退款等场景）
   */
  resolveByAmount(localOrder: LocalOrder, serverOrder: LocalOrder): LocalOrder {
    const localAmount = localOrder.totalCents ?? 0
    const serverAmount = serverOrder.totalCents ?? 0

    if (localAmount >= serverAmount) {
      return localOrder
    }
    return serverOrder
  }

  /**
   * 合并订单 - 取并集，保留所有非空字段
   */
  mergeOrders(localOrder: LocalOrder, serverOrder: LocalOrder): LocalOrder {
    const merged: LocalOrder = {}

    // 基础字段
    if (localOrder.id) merged.id = localOrder.id
    else if (serverOrder.id) merged.id = serverOrder.id

    if (localOrder.tenantId) merged.tenantId = localOrder.tenantId
    else if (serverOrder.tenantId) merged.tenantId = serverOrder.tenantId

    if (localOrder.memberId !== undefined) merged.memberId = localOrder.memberId
    else if (serverOrder.memberId !== undefined) merged.memberId = serverOrder.memberId

    if (localOrder.status) merged.status = localOrder.status
    else if (serverOrder.status) merged.status = serverOrder.status

    // 金额字段取最大值
    merged.subtotalCents = Math.max(
      localOrder.subtotalCents ?? 0,
      serverOrder.subtotalCents ?? 0
    )
    merged.discountCents = Math.max(
      localOrder.discountCents ?? 0,
      serverOrder.discountCents ?? 0
    )
    merged.totalCents = Math.max(
      localOrder.totalCents ?? 0,
      serverOrder.totalCents ?? 0
    )

    // 支付信息
    if (localOrder.paymentMethod) merged.paymentMethod = localOrder.paymentMethod
    else if (serverOrder.paymentMethod) merged.paymentMethod = serverOrder.paymentMethod

    if (localOrder.paidAt) merged.paidAt = localOrder.paidAt
    else if (serverOrder.paidAt) merged.paidAt = serverOrder.paidAt

    // 审计字段取最新
    if (localOrder.createdAt && serverOrder.createdAt) {
      merged.createdAt = localOrder.createdAt > serverOrder.createdAt
        ? localOrder.createdAt
        : serverOrder.createdAt
    } else {
      merged.createdAt = localOrder.createdAt ?? serverOrder.createdAt
    }

    if (localOrder.updatedAt && serverOrder.updatedAt) {
      merged.updatedAt = localOrder.updatedAt > serverOrder.updatedAt
        ? localOrder.updatedAt
        : serverOrder.updatedAt
    } else {
      merged.updatedAt = localOrder.updatedAt ?? serverOrder.updatedAt
    }

    // 合并 items（去重）
    const itemMap = new Map<string, OrderItem>()
    if (serverOrder.items) {
      for (const item of serverOrder.items) {
        itemMap.set(item.id, item)
      }
    }
    if (localOrder.items) {
      for (const item of localOrder.items) {
        itemMap.set(item.id, item)
      }
    }
    merged.items = Array.from(itemMap.values())

    // metadata 合并
    merged.metadata = {
      ...serverOrder.metadata,
      ...localOrder.metadata
    }

    return merged
  }
}

/** 同步状态 */
export type SyncStatus = 'PENDING' | 'SYNCING' | 'SUCCESS' | 'FAILED' | 'ROLLBACK'

/** 同步记录 */
interface SyncRecord {
  id: string
  order: Partial<Order>
  idempotencyKey: string
  status: SyncStatus
  retryCount: number
  result?: unknown
  error?: string
}

/** 边缘同步协调器 */
export class EdgeSyncCoordinator {
  private readonly logger = new Logger(EdgeSyncCoordinator.name)
  private readonly idempotencyChecker = new IdempotencyChecker()
  private readonly conflictResolver = new ConflictResolver()
  private readonly syncRecords = new Map<string, SyncRecord>()
  private readonly maxRetries = 3

  /**
   * 准备同步 - 生成幂等键
   */
  prepareSync(order: Partial<Order>): string {
    const idempotencyKey = `sync:${order.id}:${order.tenantId}:${Date.now()}`
    this.logger.debug(`Prepared sync for order ${order.id}, key=${idempotencyKey}`)
    return idempotencyKey
  }

  /**
   * 执行同步（含重试逻辑）
   * @param syncFn 实际同步函数
   */
  async executeSync(
    order: Partial<Order>,
    syncFn: (order: Partial<Order>) => Promise<Partial<Order>>
  ): Promise<{ success: boolean; result?: Partial<Order>; error?: string; idempotent?: boolean }> {
    // 使用order.id作为基础key保证幂等性（同一个order二次调用命中缓存）
    const syncId = `sync-${order.id}`

    // 检查幂等性
    const existingResult = this.idempotencyChecker.get(syncId)
    if (existingResult !== null) {
      this.logger.log(`Idempotent hit for sync ${syncId}`)
      return { success: true, result: existingResult as Partial<Order>, idempotent: true }
    }

    // 初始化同步记录
    const record: SyncRecord = {
      id: syncId,
      order,
      idempotencyKey: syncId,
      status: 'PENDING',
      retryCount: 0
    }
    this.syncRecords.set(syncId, record)

    // 执行同步（带重试）
    let lastError: string | undefined
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        record.status = 'SYNCING'
        this.logger.log(`Sync attempt ${attempt}/${this.maxRetries} for order ${order.id}`)

        const result = await syncFn(order)

        record.status = 'SUCCESS'
        record.result = result
        this.idempotencyChecker.mark(syncId, result)

        this.logger.log(`Sync succeeded for order ${order.id} on attempt ${attempt}`)
        return { success: true, result }
      } catch (error) {
        lastError = error instanceof Error ? error.message : String(error)
        record.retryCount = attempt
        this.logger.warn(`Sync attempt ${attempt} failed: ${lastError}`)

        if (attempt < this.maxRetries) {
          record.status = 'PENDING'
          // 指数退避
          await this.sleep(Math.pow(2, attempt) * 100)
        }
      }
    }

    record.status = 'FAILED'
    record.error = lastError
    this.logger.error(`Sync failed for order ${order.id} after ${this.maxRetries} attempts`)

    return { success: false, error: lastError }
  }

  /**
   * 回滚同步
   */
  async rollback(syncId: string): Promise<boolean> {
    const record = this.syncRecords.get(syncId)
    if (!record) {
      this.logger.warn(`Rollback requested but sync record ${syncId} not found`)
      return false
    }

    if (record.status === 'SUCCESS') {
      record.status = 'ROLLBACK'
      this.logger.log(`Rolling back sync ${syncId}`)
      // 实际回滚逻辑由调用方实现
      record.status = 'ROLLBACK'
      return true
    }

    this.logger.warn(`Cannot rollback sync ${syncId} with status ${record.status}`)
    return false
  }

  /**
   * 检测并解决冲突
   */
  resolveConflict(
    localOrder: Partial<Order>,
    serverOrder: Partial<Order>,
    strategy: 'timestamp' | 'amount' | 'merge' = 'timestamp'
  ): Partial<Order> {
    const conflicts = this.conflictResolver.detectConflict(localOrder, serverOrder)

    if (!conflicts) {
      return localOrder
    }

    this.logger.log(`Detected ${conflicts.length} conflicts for order ${localOrder.id}`)

    switch (strategy) {
      case 'timestamp':
        return this.conflictResolver.resolveByTimestamp(localOrder, serverOrder)
      case 'amount':
        return this.conflictResolver.resolveByAmount(localOrder, serverOrder)
      case 'merge':
        return this.conflictResolver.mergeOrders(localOrder, serverOrder)
    }
  }

  /** 获取同步记录 */
  getSyncRecord(syncId: string): SyncRecord | undefined {
    return this.syncRecords.get(syncId)
  }

  /** 测试辅助：重置状态 */
  _reset(): void {
    this.idempotencyChecker.clear()
    this.syncRecords.clear()
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}
