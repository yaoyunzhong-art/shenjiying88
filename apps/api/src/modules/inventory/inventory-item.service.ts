import { Injectable, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common'
import { randomUUID } from 'node:crypto'
import type {
  InventoryItem,
  InventoryReservation,
  InventoryAuditEntry
} from './inventory-item.entity'

/**
 * Phase-37 T167: 库存 SKU 维度管理 (InventoryItem + Reservation)
 *
 * 反模式库 v4 命中:
 *  - optimistic-lock-pattern: version 字段 (DR-36 决策 3)
 *  - cross-tenant-data-leak: 强制 tenantId
 *  - async-try-catch: 异常隔离
 *
 * 核心机制:
 *  - 库存一致性: availableQty = totalQty - reservedQty (实时)
 *  - Reservation: PENDING→CONFIRMED/RELEASED/EXPIRED
 *  - 乐观锁: version++, 冲突抛 ConflictException
 *  - 跨租户防御: 所有操作校验 tenantId
 *  - 幂等 reserve: 同 (tenant, order) 已有 PENDING 直接返回
 *  - 审计: auditLogs[itemId] = [AuditEntry...]
 */

export interface CreateInventoryItemInput {
  tenantId: string
  sku: string
  name: string
  unit?: string
  totalQty: number
  lowStockThreshold?: number
  unitPriceCents: number
  metadata?: Record<string, any>
}

export interface ListInventoryItemFilter {
  tenantId: string
  status?: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED'
  lowStockOnly?: boolean
  sku?: string
  limit?: number
  offset?: number
}

export interface UpdateInventoryItemInput {
  name?: string
  unit?: string
  lowStockThreshold?: number
  unitPriceCents?: number
  status?: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED'
  metadata?: Record<string, any>
}

export interface StockOpInput {
  itemId: string
  tenantId: string
  qty: number
  reason?: string
  performedBy?: string
}

export interface AdjustInput {
  itemId: string
  tenantId: string
  qty: number  // 参考, 真正生效是 newTotalQty
  newTotalQty: number
  reason?: string
  performedBy?: string
}

export interface ReserveInput {
  itemId: string
  tenantId: string
  orderId: string
  qty: number
  ttlSeconds?: number
}

@Injectable()
export class InventoryItemService {
  private items = new Map<string, InventoryItem>()
  private reservations = new Map<string, InventoryReservation>()
  private skuIndex = new Map<string, string>()  // `${tenantId}:${sku}` → itemId
  private auditLogs = new Map<string, InventoryAuditEntry[]>()
  /** orderId 索引: 幂等 reserve */
  private orderIndex = new Map<string, string>()  // `${tenantId}:${orderId}` → reservationId

  // ============================================================
  // CRUD
  // ============================================================

  create(input: CreateInventoryItemInput): InventoryItem {
    if (input.totalQty < 0) {
      throw new BadRequestException(`totalQty must be >= 0, got ${input.totalQty}`)
    }
    const indexKey = `${input.tenantId}:${input.sku}`
    if (this.skuIndex.has(indexKey)) {
      throw new ConflictException(`SKU ${input.sku} already exists in tenant ${input.tenantId}`)
    }
    const now = new Date().toISOString()
    const item: InventoryItem = {
      id: `inv-${randomUUID()}`,
      tenantId: input.tenantId,
      sku: input.sku,
      name: input.name,
      unit: input.unit ?? '件',
      totalQty: input.totalQty,
      reservedQty: 0,
      availableQty: input.totalQty,
      lowStockThreshold: input.lowStockThreshold ?? 0,
      unitPriceCents: input.unitPriceCents,
      status: 'ACTIVE',
      version: 1,
      metadata: input.metadata,
      createdAt: now,
      updatedAt: now
    }
    this.items.set(item.id, item)
    this.skuIndex.set(indexKey, item.id)
    this.writeAudit(item.id, input.tenantId, 'CREATE', 0, input.totalQty, 'system', 'item created')
    return { ...item }
  }

  getById(id: string, tenantId: string): InventoryItem | null {
    const item = this.items.get(id)
    if (!item || item.tenantId !== tenantId) return null
    return { ...item }
  }

  list(filter: ListInventoryItemFilter): { items: InventoryItem[]; total: number } {
    let all = Array.from(this.items.values()).filter(i => i.tenantId === filter.tenantId)
    if (filter.status) all = all.filter(i => i.status === filter.status)
    if (filter.sku) all = all.filter(i => i.sku.includes(filter.sku!))
    if (filter.lowStockOnly) {
      all = all.filter(i => i.availableQty <= i.lowStockThreshold)
    }
    all.sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    const total = all.length
    const offset = filter.offset ?? 0
    const limit = filter.limit ?? 50
    return { items: all.slice(offset, offset + limit).map(i => ({ ...i })), total }
  }

  update(id: string, tenantId: string, version: number, patch: UpdateInventoryItemInput): InventoryItem {
    const item = this.items.get(id)
    if (!item || item.tenantId !== tenantId) {
      throw new NotFoundException(`item ${id} not found`)
    }
    if (item.version !== version) {
      throw new ConflictException(`version mismatch: expected ${item.version}, got ${version}`)
    }
    if (patch.name !== undefined) item.name = patch.name
    if (patch.unit !== undefined) item.unit = patch.unit
    if (patch.lowStockThreshold !== undefined) item.lowStockThreshold = patch.lowStockThreshold
    if (patch.unitPriceCents !== undefined) item.unitPriceCents = patch.unitPriceCents
    if (patch.status !== undefined) item.status = patch.status
    if (patch.metadata !== undefined) item.metadata = patch.metadata
    item.version++
    item.updatedAt = new Date().toISOString()
    return { ...item }
  }

  softDelete(id: string, tenantId: string): InventoryItem {
    const item = this.items.get(id)
    if (!item || item.tenantId !== tenantId) {
      throw new NotFoundException(`item ${id} not found`)
    }
    item.status = 'ARCHIVED'
    item.version++
    item.updatedAt = new Date().toISOString()
    this.writeAudit(item.id, tenantId, 'SOFT_DELETE', item.totalQty, item.totalQty, 'system', 'soft deleted')
    return { ...item }
  }

  // ============================================================
  // 出入库
  // ============================================================

  stockIn(input: StockOpInput): InventoryItem {
    if (input.qty <= 0) {
      throw new BadRequestException(`qty must be > 0, got ${input.qty}`)
    }
    const item = this.items.get(input.itemId)
    if (!item || item.tenantId !== input.tenantId) {
      throw new NotFoundException(`item ${input.itemId} not found`)
    }
    const before = item.totalQty
    item.totalQty += input.qty
    item.availableQty = item.totalQty - item.reservedQty
    item.version++
    item.updatedAt = new Date().toISOString()
    this.writeAudit(item.id, input.tenantId, 'STOCK_IN', before, item.totalQty, 'system', input.reason)
    return { ...item }
  }

  stockOut(input: StockOpInput): InventoryItem {
    if (input.qty <= 0) {
      throw new BadRequestException(`qty must be > 0, got ${input.qty}`)
    }
    const item = this.items.get(input.itemId)
    if (!item || item.tenantId !== input.tenantId) {
      throw new NotFoundException(`item ${input.itemId} not found`)
    }
    if (item.availableQty < input.qty) {
      throw new ConflictException(`available qty ${item.availableQty} < requested ${input.qty}`)
    }
    const before = item.totalQty
    item.totalQty -= input.qty
    item.availableQty = item.totalQty - item.reservedQty
    item.version++
    item.updatedAt = new Date().toISOString()
    this.writeAudit(item.id, input.tenantId, 'STOCK_OUT', before, item.totalQty, 'system', input.reason)
    return { ...item }
  }

  adjust(input: AdjustInput): InventoryItem {
    if (input.newTotalQty < 0) {
      throw new BadRequestException(`newTotalQty must be >= 0, got ${input.newTotalQty}`)
    }
    const item = this.items.get(input.itemId)
    if (!item || item.tenantId !== input.tenantId) {
      throw new NotFoundException(`item ${input.itemId} not found`)
    }
    if (input.newTotalQty < item.reservedQty) {
      throw new ConflictException(`new total ${input.newTotalQty} < reserved ${item.reservedQty}`)
    }
    const before = item.totalQty
    item.totalQty = input.newTotalQty
    item.availableQty = item.totalQty - item.reservedQty
    item.version++
    item.updatedAt = new Date().toISOString()
    this.writeAudit(item.id, input.tenantId, 'ADJUST', before, item.totalQty, 'system', input.reason)
    return { ...item }
  }

  // ============================================================
  // Reservation 机制
  // ============================================================

  reserve(input: ReserveInput): InventoryReservation {
    if (input.qty <= 0) {
      throw new BadRequestException(`qty must be > 0, got ${input.qty}`)
    }
    const item = this.items.get(input.itemId)
    if (!item || item.tenantId !== input.tenantId) {
      throw new NotFoundException(`item ${input.itemId} not found`)
    }
    // 幂等: 同 (tenant, order) 已有 PENDING reservation 直接返回
    const orderKey = `${input.tenantId}:${input.orderId}`
    const existingId = this.orderIndex.get(orderKey)
    if (existingId) {
      const existing = this.reservations.get(existingId)!
      if (existing.tenantId === input.tenantId && existing.status === 'PENDING') {
        return { ...existing }
      }
    }
    if (item.availableQty < input.qty) {
      throw new ConflictException(`available ${item.availableQty} < requested ${input.qty}`)
    }
    const now = new Date()
    const ttl = input.ttlSeconds ?? 600
    const reservation: InventoryReservation = {
      id: `res-${randomUUID()}`,
      tenantId: input.tenantId,
      itemId: input.itemId,
      orderId: input.orderId,
      qty: input.qty,
      status: 'PENDING',
      expiresAt: new Date(now.getTime() + ttl * 1000).toISOString(),
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      history: [{
        at: now.toISOString(),
        from: null,
        to: 'PENDING',
        reason: `reserve ${input.qty} for order ${input.orderId}`,
        actor: 'system'
      }]
    }
    this.reservations.set(reservation.id, reservation)
    this.orderIndex.set(orderKey, reservation.id)
    item.reservedQty += input.qty
    item.availableQty = item.totalQty - item.reservedQty
    item.version++
    item.updatedAt = now.toISOString()
    return { ...reservation }
  }

  confirmReservation(id: string, tenantId: string): InventoryItem {
    const r = this.reservations.get(id)
    if (!r || r.tenantId !== tenantId) {
      throw new NotFoundException(`RES-${id} not found`)
    }
    if (r.status !== 'PENDING') {
      throw new ConflictException(`reservation ${id} status is ${r.status}, cannot confirm`)
    }
    const item = this.items.get(r.itemId)!
    if (item.availableQty < r.qty) {
      throw new ConflictException(`available ${item.availableQty} < reservation qty ${r.qty}`)
    }
    const now = new Date().toISOString()
    r.status = 'CONFIRMED'
    r.confirmedAt = now
    r.updatedAt = now
    r.history = [...(r.history ?? []), { at: now, from: 'PENDING', to: 'CONFIRMED', reason: 'confirmed', actor: 'system' }]
    const beforeTotal = item.totalQty
    item.totalQty -= r.qty
    item.reservedQty -= r.qty
    item.availableQty = item.totalQty - item.reservedQty
    item.version++
    item.updatedAt = now
    this.writeAudit(item.id, tenantId, 'CONFIRM_RESERVATION', beforeTotal, item.totalQty, 'system', `reservation ${id} confirmed`)
    return { ...item }
  }

  releaseReservation(id: string, tenantId: string, reason?: string, releasedBy?: string): InventoryItem {
    const r = this.reservations.get(id)
    if (!r || r.tenantId !== tenantId) {
      throw new NotFoundException(`RES-${id} not found`)
    }
    if (r.status !== 'PENDING') {
      // 幂等: 二次 release 直接返回当前 item
      const item = this.items.get(r.itemId)
      return item ? { ...item } : (() => { throw new NotFoundException(`item ${r.itemId} not found`) })()
    }
    const item = this.items.get(r.itemId)!
    const now = new Date().toISOString()
    r.status = 'RELEASED'
    r.releasedAt = now
    r.updatedAt = now
    r.history = [...(r.history ?? []), { at: now, from: 'PENDING', to: 'RELEASED', reason: reason ?? 'released', actor: releasedBy ?? 'system' }]
    item.reservedQty -= r.qty
    item.availableQty = item.totalQty - item.reservedQty
    item.version++
    item.updatedAt = now
    this.writeAudit(item.id, tenantId, 'RELEASE_RESERVATION', item.totalQty, item.totalQty, releasedBy ?? 'system', reason ?? 'released')
    return { ...item }
  }

  scanExpiredReservations(now: Date = new Date()): InventoryReservation[] {
    const expired: InventoryReservation[] = []
    const nowIso = now.toISOString()
    for (const r of this.reservations.values()) {
      if (r.status === 'PENDING' && r.expiresAt < nowIso) {
        // 标记 EXPIRED + 自动 release
        r.status = 'EXPIRED'
        r.expiredAt = nowIso
        r.updatedAt = nowIso
        r.history = [...(r.history ?? []), { from: 'PENDING', to: 'EXPIRED', at: nowIso, reason: 'expired by cron' }]
        const item = this.items.get(r.itemId)
        if (item && item.tenantId === r.tenantId) {
          item.reservedQty -= r.qty
          item.availableQty = item.totalQty - item.reservedQty
          item.version++
          item.updatedAt = nowIso
        }
        expired.push({ ...r })
      }
    }
    return expired
  }

  getReservationById(id: string, tenantId: string): InventoryReservation | null {
    const r = this.reservations.get(id)
    if (!r || r.tenantId !== tenantId) return null
    return { ...r }
  }

  // ============================================================
  // 低库存 + 审计
  // ============================================================

  getLowStock(tenantId: string): InventoryItem[] {
    return Array.from(this.items.values())
      .filter(i => i.tenantId === tenantId && i.status === 'ACTIVE' && i.availableQty <= i.lowStockThreshold)
      .map(i => ({ ...i }))
  }

  getAuditLog(itemId: string, tenantId: string): InventoryAuditEntry[] {
    const item = this.items.get(itemId)
    if (!item || item.tenantId !== tenantId) return []
    return [...(this.auditLogs.get(itemId) ?? [])]
  }

  // ============================================================
  // 内部辅助
  // ============================================================

  private writeAudit(
    itemId: string,
    tenantId: string,
    type: InventoryAuditEntry['type'],
    beforeQty: number,
    afterQty: number,
    performedBy: string,
    reason?: string
  ): void {
    const entry: InventoryAuditEntry = {
      itemId,
      tenantId,
      type,
      beforeQty,
      afterQty,
      performedBy,
      reason: reason ?? '',
      at: new Date().toISOString()
    }
    const log = this.auditLogs.get(itemId) ?? []
    log.push(entry)
    this.auditLogs.set(itemId, log)
  }

  /** 测试/重置 */
  reset(): void {
    this.items.clear()
    this.reservations.clear()
    this.skuIndex.clear()
    this.auditLogs.clear()
    this.orderIndex.clear()
  }
}
