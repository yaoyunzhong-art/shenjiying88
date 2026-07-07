import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
import assert from 'node:assert/strict'
import { InventoryItemService } from './inventory-item.service'
import { InventoryReservationCron } from './inventory.cron'

/**
 * Phase-37 T167: InventoryService + Cron 单元测试
 *
 * 覆盖 (≥ 14 断言):
 *  - AC-2: CRUD (create/getById/list/update/softDelete) 5 断言
 *  - AC-3: 出入库 (stockIn/stockOut/adjust) 3 断言
 *  - AC-4: Reservation (reserve/confirm/release/scanExpired) 4 断言
 *  - AC-5: 库存不足抛 ConflictException 1 断言
 *  - AC-6: 乐观锁 version 冲突 1 断言
 *  - AC-7: 跨租户防御 1 断言
 *  - AC-8: Cron 重入锁 + 过期清理 2 断言
 */

describe('InventoryService', () => {
  let svc: InventoryItemService

  beforeEach(() => {
    svc = new InventoryItemService()
  })

  // ============================================================
  // AC-2: CRUD
  // ============================================================

  it('CRUD-1: create 设置初始值 + availableQty=totalQty', () => {
    const item = svc.create({
      tenantId: 't1',
      sku: 'SKU-001',
      name: 'Apple iPhone 15',
      totalQty: 100,
      unitPriceCents: 999900
    })
    assert.equal(item.totalQty, 100)
    assert.equal(item.availableQty, 100)
    assert.equal(item.reservedQty, 0)
    assert.equal(item.version, 1)
    assert.equal(item.status, 'ACTIVE')
  })

  it('CRUD-2: getById 强制 tenantId (跨租户返回 null)', () => {
    const item = svc.create({ tenantId: 't1', sku: 'S1', name: 'X', totalQty: 10, unitPriceCents: 100 })
    assert.ok(svc.getById(item.id, 't1'))
    assert.equal(svc.getById(item.id, 't2'), null)  // 跨租户
    assert.equal(svc.getById('not-exist', 't1'), null)
  })

  it('CRUD-3: list 按 tenantId 过滤 + lowStockOnly', () => {
    svc.create({ tenantId: 't1', sku: 'S1', name: 'X', totalQty: 100, unitPriceCents: 100, lowStockThreshold: 50 })
    svc.create({ tenantId: 't1', sku: 'S2', name: 'Y', totalQty: 5, unitPriceCents: 100, lowStockThreshold: 10 })
    svc.create({ tenantId: 't2', sku: 'S3', name: 'Z', totalQty: 200, unitPriceCents: 100 })

    const t1All = svc.list({ tenantId: 't1' })
    assert.equal(t1All.total, 2)
    const t1Low = svc.list({ tenantId: 't1', lowStockOnly: true })
    assert.equal(t1Low.total, 1)
    assert.equal(t1Low.items[0].sku, 'S2')
  })

  it('CRUD-4: update 乐观锁 version 冲突抛 ConflictException', () => {
    const item = svc.create({ tenantId: 't1', sku: 'S1', name: 'X', totalQty: 10, unitPriceCents: 100 })
    assert.throws(
      () => svc.update(item.id, 't1', 999, { name: 'Updated' }),
      /version mismatch/
    )
    // 正确 version 更新
    const updated = svc.update(item.id, 't1', 1, { name: 'Updated' })
    assert.equal(updated.name, 'Updated')
    assert.equal(updated.version, 2)
  })

  it('CRUD-5: softDelete 设置 status=ARCHIVED + version++', () => {
    const item = svc.create({ tenantId: 't1', sku: 'S1', name: 'X', totalQty: 10, unitPriceCents: 100 })
    svc.softDelete(item.id, 't1')
    const after = svc.getById(item.id, 't1')!
    assert.equal(after.status, 'ARCHIVED')
    assert.equal(after.version, 2)
  })

  // ============================================================
  // AC-3: 出入库
  // ============================================================

  it('STOCK-1: stockIn 增加 totalQty/availableQty', () => {
    const item = svc.create({ tenantId: 't1', sku: 'S1', name: 'X', totalQty: 100, unitPriceCents: 100 })
    const after = svc.stockIn({ itemId: item.id, tenantId: 't1', qty: 50, reason: 'restock', performedBy: 'admin' })
    assert.equal(after.totalQty, 150)
    assert.equal(after.availableQty, 150)
  })

  it('STOCK-2: stockOut 减少 totalQty/availableQty + 防御', () => {
    const item = svc.create({ tenantId: 't1', sku: 'S1', name: 'X', totalQty: 100, unitPriceCents: 100 })
    svc.stockOut({ itemId: item.id, tenantId: 't1', qty: 30, reason: 'manual out', performedBy: 'admin' })
    const after = svc.getById(item.id, 't1')!
    assert.equal(after.totalQty, 70)
    assert.equal(after.availableQty, 70)

    // 防御: 库存不足抛 ConflictException
    assert.throws(
      () => svc.stockOut({ itemId: item.id, tenantId: 't1', qty: 100, reason: 'overdraw', performedBy: 'admin' }),
      /available qty 70 < requested 100/
    )
  })

  it('STOCK-3: adjust 强制设 newTotalQty + 校验 reservedQty', () => {
    const item = svc.create({ tenantId: 't1', sku: 'S1', name: 'X', totalQty: 100, unitPriceCents: 100 })
    const after = svc.adjust({ itemId: item.id, tenantId: 't1', qty: 0, newTotalQty: 80, reason: 'inventory count', performedBy: 'admin' })
    assert.equal(after.totalQty, 80)
    assert.equal(after.availableQty, 80)

    // 预留后, adjust 到 < reservedQty 应抛错
    svc.reserve({ itemId: item.id, tenantId: 't1', orderId: 'ord-1', qty: 30 })
    assert.throws(
      () => svc.adjust({ itemId: item.id, tenantId: 't1', qty: 0, newTotalQty: 20, reason: 'bad adjust', performedBy: 'admin' }),
      /new total 20 < reserved 30/
    )
  })

  // ============================================================
  // AC-4: Reservation
  // ============================================================

  it('RES-1: reserve 扣 availableQty + 加 reservedQty', () => {
    const item = svc.create({ tenantId: 't1', sku: 'S1', name: 'X', totalQty: 100, unitPriceCents: 100 })
    const r = svc.reserve({ itemId: item.id, tenantId: 't1', orderId: 'ord-1', qty: 30 })
    assert.equal(r.status, 'PENDING')
    assert.equal(r.qty, 30)
    const after = svc.getById(item.id, 't1')!
    assert.equal(after.availableQty, 70)
    assert.equal(after.reservedQty, 30)
  })

  it('RES-2: confirmReservation 物理扣减 + reservedQty 清零', () => {
    const item = svc.create({ tenantId: 't1', sku: 'S1', name: 'X', totalQty: 100, unitPriceCents: 100 })
    const r = svc.reserve({ itemId: item.id, tenantId: 't1', orderId: 'ord-1', qty: 30 })
    svc.confirmReservation(r.id, 't1')
    const after = svc.getById(item.id, 't1')!
    assert.equal(after.totalQty, 70)  // 物理扣减
    assert.equal(after.reservedQty, 0)
    assert.equal(after.availableQty, 70)

    // 二次 confirm 应抛错
    assert.throws(() => svc.confirmReservation(r.id, 't1'), /status is CONFIRMED/)
  })

  it('RES-3: releaseReservation 回滚 availableQty + status=RELEASED', () => {
    const item = svc.create({ tenantId: 't1', sku: 'S1', name: 'X', totalQty: 100, unitPriceCents: 100 })
    const r = svc.reserve({ itemId: item.id, tenantId: 't1', orderId: 'ord-1', qty: 30 })
    svc.releaseReservation(r.id, 't1', 'order cancelled', 'order-service')
    const after = svc.getById(item.id, 't1')!
    assert.equal(after.availableQty, 100)  // 回滚
    assert.equal(after.reservedQty, 0)

    // 二次 release 幂等
    svc.releaseReservation(r.id, 't1', 'cancelled twice', 'order-service')
    assert.equal(svc.getById(item.id, 't1')!.availableQty, 100)
  })

  it('RES-4: scanExpiredReservations 检测 expiresAt < now', () => {
    const item = svc.create({ tenantId: 't1', sku: 'S1', name: 'X', totalQty: 100, unitPriceCents: 100 })
    const r = svc.reserve({ itemId: item.id, tenantId: 't1', orderId: 'ord-1', qty: 30, ttlSeconds: 1 })

    // 等 1.1s 让 reservation 过期
    const expired = svc.scanExpiredReservations(new Date(Date.now() + 2000))
    assert.ok(expired.length >= 1)
    assert.equal(expired[0].id, r.id)
  })

  // ============================================================
  // AC-5: 库存不足防御
  // ============================================================

  it('DEF-1: reserve 时 availableQty < qty 抛 ConflictException', () => {
    const item = svc.create({ tenantId: 't1', sku: 'S1', name: 'X', totalQty: 10, unitPriceCents: 100 })
    assert.throws(
      () => svc.reserve({ itemId: item.id, tenantId: 't1', orderId: 'ord-1', qty: 100 }),
      /available 10 < requested 100/
    )
  })

  // ============================================================
  // AC-6: 乐观锁
  // ============================================================

  it('LOCK-1: update version 不匹配抛 ConflictException', () => {
    const item = svc.create({ tenantId: 't1', sku: 'S1', name: 'X', totalQty: 10, unitPriceCents: 100 })
    svc.update(item.id, 't1', 1, { name: 'v1' })
    // 用旧 version 再更新应抛错
    assert.throws(
      () => svc.update(item.id, 't1', 1, { name: 'v2-old-version' }),
      /version mismatch/
    )
    // 用新 version 正常
    const ok = svc.update(item.id, 't1', 2, { name: 'v2' })
    assert.equal(ok.name, 'v2')
    assert.equal(ok.version, 3)
  })

  // ============================================================
  // AC-7: 跨租户防御
  // ============================================================

  it('CROSS-1: 跨租户 reserve / confirm / release 均返回 null', () => {
    const item = svc.create({ tenantId: 't1', sku: 'S1', name: 'X', totalQty: 100, unitPriceCents: 100 })
    const r = svc.reserve({ itemId: item.id, tenantId: 't1', orderId: 'ord-1', qty: 30 })
    // 跨租户操作
    assert.equal(svc.getReservationById(r.id, 't2'), null)
    assert.throws(() => svc.confirmReservation(r.id, 't2'), /RES-/)
    assert.throws(() => svc.releaseReservation(r.id, 't2'), /RES-/)
  })

  // ============================================================
  // AC-8: Cron
  // ============================================================

  it('CRON-1: InventoryReservationCron.sweep 释放过期 reservation', async () => {
    const item = svc.create({ tenantId: 't1', sku: 'S1', name: 'X', totalQty: 100, unitPriceCents: 100 })
    svc.reserve({ itemId: item.id, tenantId: 't1', orderId: 'ord-1', qty: 30, ttlSeconds: 1 })
    const cron = new InventoryReservationCron(svc)

    // 等 1.1s 让 reservation 过期
    await new Promise((resolve) => setTimeout(resolve, 1100))
    const result = await cron.sweep()
    assert.ok(result.scanned >= 1)
    assert.ok(result.released >= 1)

    const after = svc.getById(item.id, 't1')!
    assert.equal(after.availableQty, 100)  // 回滚
    assert.equal(after.reservedQty, 0)
  })

  it('CRON-2: 重入锁 scanInProgress 防御', async () => {
    const item = svc.create({ tenantId: 't1', sku: 'S1', name: 'X', totalQty: 100, unitPriceCents: 100 })
    svc.reserve({ itemId: item.id, tenantId: 't1', orderId: 'ord-1', qty: 30, ttlSeconds: 1 })
    const cron = new InventoryReservationCron(svc)

    // 第一轮 sweep 不 await, 触发第二轮
    const first = cron.sweep()
    const second = await cron.sweep()
    assert.equal(second.scanned, 0)  // 重入锁返回 0
    await first
  })

  // ============================================================
  // 附加防御
  // ============================================================

  it('IDEM: 同 orderId 重复 reserve 幂等', () => {
    const item = svc.create({ tenantId: 't1', sku: 'S1', name: 'X', totalQty: 100, unitPriceCents: 100 })
    const r1 = svc.reserve({ itemId: item.id, tenantId: 't1', orderId: 'ord-1', qty: 30 })
    const r2 = svc.reserve({ itemId: item.id, tenantId: 't1', orderId: 'ord-1', qty: 30 })
    assert.equal(r1.id, r2.id)
    // 不应重复扣
    assert.equal(svc.getById(item.id, 't1')!.availableQty, 70)
  })

  it('SKU-UNIQUENESS: 同租户 SKU 重复创建抛 ConflictException', () => {
    svc.create({ tenantId: 't1', sku: 'SKU-001', name: 'X', totalQty: 10, unitPriceCents: 100 })
    assert.throws(
      () => svc.create({ tenantId: 't1', sku: 'SKU-001', name: 'Y', totalQty: 5, unitPriceCents: 200 }),
      /SKU SKU-001 already exists in tenant t1/
    )
    // 不同租户相同 SKU 允许
    const ok = svc.create({ tenantId: 't2', sku: 'SKU-001', name: 'Y', totalQty: 5, unitPriceCents: 200 })
    assert.ok(ok)
  })
})