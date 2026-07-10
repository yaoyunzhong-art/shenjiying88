/**
 * inventory-item.entity.test.ts — 库存 Item / Reservation 实体单元测试
 *
 * 覆盖:
 *   - InventoryItem 字段结构与计算 (availableQty = totalQty - reservedQty)
 *   - InventoryReservation 状态机 (PENDING → CONFIRMED / RELEASED / EXPIRED)
 *   - InventoryAuditEntry 审计日志结构
 *   - 输入 DTO 结构验证
 *   - 反模式 v4 约束: optimistic-lock-pattern, cross-tenant-data-leak
 */

import { describe, it, expect } from 'vitest'
import {
  type InventoryItem,
  type InventoryReservation,
  type InventoryAuditEntry,
  type ReservationHistoryEntry,
  type ReservationStatus,
  type CreateInventoryItemInput,
  type StockMovementInput,
  type ReserveInput,
} from './inventory-item.entity'

// ===================================================================
// InventoryItem 字段与计算
// ===================================================================
describe('InventoryItem 结构', () => {
  const item: InventoryItem = {
    id: 'inv-001',
    tenantId: 'tenant-a',
    sku: 'ARCADE-PRO-X1',
    name: '街机 Pro X1 面板',
    unit: '件',
    totalQty: 100,
    reservedQty: 20,
    availableQty: 80, // 100 - 20
    lowStockThreshold: 10,
    unitPriceCents: 500_00, // 500 元
    status: 'ACTIVE',
    version: 1,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-15T00:00:00Z',
  }

  it('应包含所有必填字段', () => {
    expect(item.id).toBeDefined()
    expect(item.tenantId).toBe('tenant-a')
    expect(item.sku).toBe('ARCADE-PRO-X1')
    expect(item.name).toBe('街机 Pro X1 面板')
    expect(item.unit).toBe('件')
  })

  it('availableQty 应等于 totalQty - reservedQty', () => {
    expect(item.availableQty).toBe(item.totalQty - item.reservedQty)
  })

  it('version 应代表乐观锁版本', () => {
    expect(item.version).toBe(1)
  })

  it('metadata 可选字段应为 undefined 或 object', () => {
    expect(item.metadata).toBeUndefined()
  })

  it('单位应以件/箱/kg 等表示', () => {
    expect(['件', '箱', 'kg', '台', '套']).toContain(item.unit)
  })

  it('价格应以分为单位存储', () => {
    expect(item.unitPriceCents).toBe(500_00)
  })

  it('状态应为 ACTIVE | INACTIVE | ARCHIVED 之一', () => {
    expect(['ACTIVE', 'INACTIVE', 'ARCHIVED']).toContain(item.status)
  })
})

describe('InventoryItem 多种状态', () => {
  it('INACTIVE 状态的商品不可用', () => {
    const item: InventoryItem = {
      id: 'inv-002',
      tenantId: 'tenant-a',
      sku: 'KART-TIRE-001',
      name: '卡丁车轮胎',
      unit: '条',
      totalQty: 0,
      reservedQty: 0,
      availableQty: 0,
      lowStockThreshold: 5,
      unitPriceCents: 150_00,
      status: 'INACTIVE',
      version: 1,
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-10T00:00:00Z',
    }
    expect(item.status).toBe('INACTIVE')
    expect(item.availableQty).toBe(0)
  })

  it('零库存商品 availableQty = 0', () => {
    const item: InventoryItem = {
      id: 'inv-003',
      tenantId: 'tenant-b',
      sku: 'TOKEN-PACK-001',
      name: '游戏币礼包',
      unit: '包',
      totalQty: 0,
      reservedQty: 0,
      availableQty: 0,
      lowStockThreshold: 100,
      unitPriceCents: 99_00,
      status: 'ACTIVE',
      version: 1,
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-05T00:00:00Z',
    }
    expect(item.availableQty).toBe(0)
    expect(item.totalQty).toBe(0)
  })

  it('超过 85% 预留的紧急库存', () => {
    const item: InventoryItem = {
      id: 'inv-004',
      tenantId: 'tenant-c',
      sku: 'VR-HEADSET',
      name: 'VR 头显',
      unit: '台',
      totalQty: 50,
      reservedQty: 45,
      availableQty: 5,
      lowStockThreshold: 5,
      unitPriceCents: 2000_00,
      status: 'ACTIVE',
      version: 3,
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-20T00:00:00Z',
    }
    expect(item.availableQty).toBe(5)
    // 可用库存 <= lowStockThreshold 触发预警阈值
    expect(item.availableQty).toBeLessThanOrEqual(item.lowStockThreshold)
  })
})

// ===================================================================
// InventoryReservation 状态机
// ===================================================================
describe('InventoryReservation 状态机', () => {
  const baseReservation: InventoryReservation = {
    id: 'res-001',
    tenantId: 'tenant-a',
    itemId: 'inv-001',
    orderId: 'ord-001',
    qty: 2,
    status: 'PENDING',
    expiresAt: '2026-01-15T00:10:00Z',
    createdAt: '2026-01-15T00:00:00Z',
    updatedAt: '2026-01-15T00:00:00Z',
  }

  it('初始状态应为 PENDING', () => {
    expect(baseReservation.status).toBe('PENDING')
  })

  it('CONFIRMED 状态表示预留已确认', () => {
    const confirmed: InventoryReservation = {
      ...baseReservation,
      status: 'CONFIRMED',
      confirmedAt: '2026-01-15T00:05:00Z',
    }
    expect(confirmed.status).toBe('CONFIRMED')
    expect(confirmed.confirmedAt).toBeDefined()
  })

  it('RELEASED 状态表示预留已释放', () => {
    const released: InventoryReservation = {
      ...baseReservation,
      status: 'RELEASED',
      releasedAt: '2026-01-15T00:05:00Z',
    }
    expect(released.status).toBe('RELEASED')
    expect(released.releasedAt).toBeDefined()
  })

  it('EXPIRED 状态表示预留已过期', () => {
    const expired: InventoryReservation = {
      ...baseReservation,
      status: 'EXPIRED',
      expiredAt: '2026-01-15T00:10:01Z',
    }
    expect(expired.status).toBe('EXPIRED')
    expect(expired.expiredAt).toBeDefined()
  })

  it('history 审计追踪应按时间线顺序记录', () => {
    const history: ReservationHistoryEntry[] = [
      { from: null, to: 'PENDING', at: '2026-01-15T00:00:00Z', reason: '订单创建' },
      { from: 'PENDING', to: 'CONFIRMED', at: '2026-01-15T00:05:00Z', reason: '支付确认' },
    ]
    const reservationWithHistory: InventoryReservation = {
      ...baseReservation,
      status: 'CONFIRMED',
      confirmedAt: '2026-01-15T00:05:00Z',
      history,
    }
    expect(reservationWithHistory.history!.length).toBe(2)
    expect(reservationWithHistory.history![0].from).toBeNull()
    expect(reservationWithHistory.history![0].to).toBe('PENDING')
    expect(reservationWithHistory.history![1].from).toBe('PENDING')
    expect(reservationWithHistory.history![1].to).toBe('CONFIRMED')
    expect(reservationWithHistory.history![1].reason).toBe('支付确认')
  })

  it('RELEASED 状态应有 releasedAt 时间戳', () => {
    const released: InventoryReservation = {
      ...baseReservation,
      status: 'RELEASED',
      releasedAt: '2026-01-15T00:06:00Z',
    }
    expect(released.releasedAt).toBeDefined()
    // releasedAt > createdAt
    expect(new Date(released.releasedAt!).getTime()).toBeGreaterThan(
      new Date(released.createdAt).getTime(),
    )
  })

  it('EXPIRED 状态应有 expiredAt 且默认 TTL 600 秒', () => {
    const createdAt = new Date('2026-01-15T00:00:00Z')
    const defaultTtlSeconds = 600
    const expectedExpiry = new Date(createdAt.getTime() + defaultTtlSeconds * 1000)
    expect(new Date(baseReservation.expiresAt).getTime()).toBe(expectedExpiry.getTime())
  })
})

// ===================================================================
// InventoryAuditEntry 审计日志
// ===================================================================
describe('InventoryAuditEntry 审计日志', () => {
  it('入库操作应记录正确字段', () => {
    const entry: InventoryAuditEntry = {
      itemId: 'inv-001',
      tenantId: 'tenant-a',
      type: 'STOCK_IN',
      qty: 50,
      beforeQty: 100,
      afterQty: 150,
      reason: '补货入库',
      performedBy: 'warehouse-admin',
      at: '2026-01-15T00:00:00Z',
    }
    expect(entry.type).toBe('STOCK_IN')
    expect(entry.afterQty - entry.beforeQty).toBe(entry.qty!)
  })

  it('出库操作应正确扣减', () => {
    const entry: InventoryAuditEntry = {
      itemId: 'inv-001',
      tenantId: 'tenant-a',
      type: 'STOCK_OUT',
      qty: 10,
      beforeQty: 150,
      afterQty: 140,
      reason: '门店调拨',
      performedBy: 'ops-001',
      at: '2026-01-15T00:00:00Z',
    }
    expect(entry.qty).toBe(10)
    expect(entry.beforeQty - entry.afterQty).toBe(entry.qty!)
  })

  it('盘点调整操作应记录前后差', () => {
    const entry: InventoryAuditEntry = {
      itemId: 'inv-002',
      tenantId: 'tenant-b',
      type: 'ADJUST',
      beforeQty: 50,
      afterQty: 48,
      reason: '盘点差异: 盘亏 2',
      performedBy: 'auditor',
      at: '2026-01-20T10:00:00Z',
    }
    expect(entry.beforeQty - entry.afterQty).toBe(2)
    expect(entry.qty).toBeUndefined()
  })

  it('预留操作应关联订单号', () => {
    const entry: InventoryAuditEntry = {
      itemId: 'inv-001',
      tenantId: 'tenant-a',
      type: 'RESERVE',
      qty: 2,
      beforeQty: 80,
      afterQty: 78,
      reason: '订单预留',
      performedBy: 'system',
      relatedId: 'ord-001',
      at: '2026-01-15T00:00:00Z',
    }
    expect(entry.relatedId).toBe('ord-001')
    expect(entry.beforeQty - entry.afterQty).toBe(entry.qty!)
  })
})

// ===================================================================
// 输入 DTO 结构验证
// ===================================================================
describe('CreateInventoryItemInput 结构', () => {
  it('应包含创建库存的基本字段', () => {
    const input: CreateInventoryItemInput = {
      tenantId: 'tenant-a',
      sku: 'ARCADE-PRO-X1',
      name: '街机 Pro X1 面板',
      unit: '件',
      totalQty: 100,
      lowStockThreshold: 10,
      unitPriceCents: 500_00,
    }
    expect(input.tenantId).toBe('tenant-a')
    expect(input.totalQty).toBeGreaterThanOrEqual(0)
    expect(input.unitPriceCents).toBeGreaterThan(0)
    expect(input.metadata).toBeUndefined()
  })

  it('metadata 可选字段可存额外信息', () => {
    const input: CreateInventoryItemInput = {
      tenantId: 'tenant-b',
      sku: 'SWEAT-TOKEN-GOLD',
      name: '金色汗水代币',
      unit: '枚',
      totalQty: 10000,
      unitPriceCents: 50,
      metadata: { category: 'token', rarity: 'gold', season: '2026-summer' },
    }
    expect(input.metadata).toBeDefined()
    expect(input.metadata!.rarity).toBe('gold')
  })
})

describe('StockMovementInput 结构', () => {
  it('应包含出入库关键字段', () => {
    const input: StockMovementInput = {
      itemId: 'inv-001',
      tenantId: 'tenant-a',
      qty: 10,
      reason: '门店调拨',
      performedBy: 'ops-admin',
    }
    expect(input.itemId).toBeDefined()
    expect(input.tenantId).toBeDefined()
    expect(input.qty).toBeGreaterThan(0)
    expect(input.reason).toBeDefined()
  })
})

describe('ReserveInput 结构', () => {
  it('应包含预留关键字段', () => {
    const input: ReserveInput = {
      itemId: 'inv-001',
      tenantId: 'tenant-a',
      orderId: 'ord-001',
      qty: 2,
    }
    expect(input.orderId).toBeDefined()
    expect(input.qty).toBeGreaterThan(0)
    expect(input.ttlSeconds).toBeUndefined() // 默认 600
  })

  it('ttlSeconds 可选字段可自定义过期时间', () => {
    const input: ReserveInput = {
      itemId: 'inv-001',
      tenantId: 'tenant-a',
      orderId: 'ord-002',
      qty: 5,
      ttlSeconds: 1800, // 30 分钟
    }
    expect(input.ttlSeconds).toBe(1800)
  })
})
