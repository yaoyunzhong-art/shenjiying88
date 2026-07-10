/**
 * 🐜 自动: [inventory-item] [A] inventory-item.service.test.ts
 *
 * Phase-37 T167: InventoryItemService 集成测试 + 状态机验证
 *
 * 覆盖:
 *  - CRUD 完整生命周期 (create → get → update → softDelete)
 *  - 出入库状态机 (stockIn → stockOut → adjust)
 *  - Reservation 状态机 (reserve → confirm / release / expire)
 *  - 乐观锁冲突
 *  - 跨租户隔离
 *  - 幂等 reserve
 */

import { describe, it, expect, beforeEach } from 'vitest'
import assert from 'node:assert/strict'
import { InventoryItemService } from './inventory-item.service'

function createService(): InventoryItemService {
  return new InventoryItemService()
}

describe('InventoryItemService — 集成测试', () => {
  let svc: InventoryItemService

  beforeEach(() => {
    svc = createService()
  })

  // ═══════════════════════════════════════════════════════════════
  // 完整 CRUD 生命周期
  // ═══════════════════════════════════════════════════════════════
  describe('CRUD 生命周期', () => {
    it('create → getById → update → softDelete', () => {
      const created = svc.create({ tenantId: 't1', sku: 'CRUD1', name: 'CRUD测试', totalQty: 100, unitPriceCents: 5000 })
      assert.equal(created.version, 1)

      const found = svc.getById(created.id, 't1')
      assert.ok(found !== null)
      assert.equal(found.id, created.id)

      const updated = svc.update(created.id, 't1', 1, { name: '已更新', unitPriceCents: 6000 })
      assert.equal(updated.name, '已更新')
      assert.equal(updated.unitPriceCents, 6000)
      assert.equal(updated.version, 2)

      const deleted = svc.softDelete(created.id, 't1')
      assert.equal(deleted.status, 'ARCHIVED')
      assert.equal(deleted.version, 3)
    })
  })

  // ═══════════════════════════════════════════════════════════════
  // 出入库状态机
  // ═══════════════════════════════════════════════════════════════
  describe('出入库状态机', () => {
    it('入库 → 出库 → 调整', () => {
      const item = svc.create({ tenantId: 't1', sku: 'STK1', name: '库存测试', totalQty: 50, unitPriceCents: 1000 })
      assert.equal(item.availableQty, 50)

      const stocked = svc.stockIn({ itemId: item.id, tenantId: 't1', qty: 20, reason: '补货' })
      assert.equal(stocked.totalQty, 70)
      assert.equal(stocked.availableQty, 70)

      const outed = svc.stockOut({ itemId: item.id, tenantId: 't1', qty: 10, reason: '销售' })
      assert.equal(outed.totalQty, 60)
      assert.equal(outed.availableQty, 60)

      const adjusted = svc.adjust({ itemId: item.id, tenantId: 't1', qty: 5, newTotalQty: 100, reason: '盘点' })
      assert.equal(adjusted.totalQty, 100)
      assert.equal(adjusted.availableQty, 100)
    })

    it('出库超库存抛异常', () => {
      const item = svc.create({ tenantId: 't1', sku: 'STK2', name: '超卖测试', totalQty: 5, unitPriceCents: 100 })
      assert.throws(() => svc.stockOut({ itemId: item.id, tenantId: 't1', qty: 10, reason: '超卖' }), /available qty/)
    })

    it('入库负数抛异常', () => {
      const item = svc.create({ tenantId: 't1', sku: 'STK3', name: '负入库测试', totalQty: 10, unitPriceCents: 100 })
      assert.throws(() => svc.stockIn({ itemId: item.id, tenantId: 't1', qty: -5 }), /qty must be > 0/)
    })
  })

  // ═══════════════════════════════════════════════════════════════
  // Reservation 状态机
  // ═══════════════════════════════════════════════════════════════
  describe('Reservation 状态机', () => {
    it('reserve → confirm 完整流程', () => {
      const item = svc.create({ tenantId: 't1', sku: 'RSM1', name: '预留完整流', totalQty: 10, unitPriceCents: 100 })
      const r = svc.reserve({ itemId: item.id, tenantId: 't1', orderId: 'ORD-RSM1', qty: 4 })
      assert.equal(r.status, 'PENDING')

      const afterConfirm = svc.confirmReservation(r.id, 't1')
      assert.equal(afterConfirm.totalQty, 6)
      assert.equal(afterConfirm.reservedQty, 0)
      assert.equal(afterConfirm.availableQty, 6)
    })

    it('reserve → release 释放流程', () => {
      const item = svc.create({ tenantId: 't1', sku: 'RSM2', name: '预留释放', totalQty: 10, unitPriceCents: 100 })
      const r = svc.reserve({ itemId: item.id, tenantId: 't1', orderId: 'ORD-RSM2', qty: 4 })

      const afterRelease = svc.releaseReservation(r.id, 't1', '取消订单')
      assert.equal(afterRelease.reservedQty, 0)
      assert.equal(afterRelease.availableQty, 10)
    })

    it('reserve → expire 过期流程', () => {
      const item = svc.create({ tenantId: 't1', sku: 'RSM3', name: '预留过期', totalQty: 10, unitPriceCents: 100 })
      svc.reserve({ itemId: item.id, tenantId: 't1', orderId: 'ORD-RSM3', qty: 4, ttlSeconds: 0 })

      const expired = svc.scanExpiredReservations(new Date('2099-06-01'))
      assert.equal(expired.length, 1)
      assert.equal(expired[0].status, 'EXPIRED')

      const itemAfter = svc.getById(item.id, 't1')!
      assert.equal(itemAfter.reservedQty, 0)
      assert.equal(itemAfter.availableQty, 10)
    })

    it('幂等 reserve: 同 orderId 返回相同 reservation', () => {
      const item = svc.create({ tenantId: 't1', sku: 'RSM4', name: '幂等预留', totalQty: 10, unitPriceCents: 100 })
      const r1 = svc.reserve({ itemId: item.id, tenantId: 't1', orderId: 'ORD-IDEM', qty: 3 })
      const r2 = svc.reserve({ itemId: item.id, tenantId: 't1', orderId: 'ORD-IDEM', qty: 3 })
      assert.equal(r1.id, r2.id)
      // availableQty 只被扣一次
      const itemAfter = svc.getById(item.id, 't1')!
      assert.equal(itemAfter.availableQty, 7)
    })

    it('reserve → confirm 后再 confirm 抛异常', () => {
      const item = svc.create({ tenantId: 't1', sku: 'RSM5', name: '重复确认', totalQty: 10, unitPriceCents: 100 })
      const r = svc.reserve({ itemId: item.id, tenantId: 't1', orderId: 'ORD-RSM5', qty: 4 })
      svc.confirmReservation(r.id, 't1')
      assert.throws(() => svc.confirmReservation(r.id, 't1'), /cannot confirm/)
    })

    it('预留总量不超过可用库存', () => {
      const item = svc.create({ tenantId: 't1', sku: 'RSM6', name: '超预留', totalQty: 10, unitPriceCents: 100 })
      svc.reserve({ itemId: item.id, tenantId: 't1', orderId: 'ORD-A', qty: 4 })
      svc.reserve({ itemId: item.id, tenantId: 't1', orderId: 'ORD-B', qty: 3 })
      // 第 3 次超过可用量
      assert.throws(() => svc.reserve({ itemId: item.id, tenantId: 't1', orderId: 'ORD-C', qty: 5 }), /available/)
    })
  })

  // ═══════════════════════════════════════════════════════════════
  // 乐观锁冲突
  // ═══════════════════════════════════════════════════════════════
  describe('乐观锁冲突', () => {
    it('update 使用过期 version 抛 ConflictException', () => {
      const item = svc.create({ tenantId: 't1', sku: 'LOCK1', name: '乐观锁', totalQty: 10, unitPriceCents: 100 })
      svc.update(item.id, 't1', 1, { name: 'v2' })
      assert.throws(() => svc.update(item.id, 't1', 1, { name: '旧version' }), /version mismatch/)
    })

    it('多并发 update 模拟', () => {
      const item = svc.create({ tenantId: 't1', sku: 'CONC1', name: '并发', totalQty: 10, unitPriceCents: 100 })
      // A 拿到 version=1
      // B 也拿到 version=1
      svc.update(item.id, 't1', 1, { name: 'A更新' })
      // B 用旧的 version=1 更新 => 冲突
      assert.throws(() => svc.update(item.id, 't1', 1, { name: 'B更新' }), /version mismatch/)
    })
  })

  // ═══════════════════════════════════════════════════════════════
  // 跨租户隔离
  // ═══════════════════════════════════════════════════════════════
  describe('跨租户隔离', () => {
    it('t1 创建的商品对 t2 不可见', () => {
      svc.create({ tenantId: 't1', sku: 'TEN1', name: 't1商品', totalQty: 10, unitPriceCents: 100 })
      const r = svc.list({ tenantId: 't2' })
      assert.equal(r.total, 0)
    })

    it('t2 不能操作 t1 的商品', () => {
      const item = svc.create({ tenantId: 't1', sku: 'TEN2', name: 't1商品', totalQty: 10, unitPriceCents: 100 })
      assert.equal(svc.getById(item.id, 't2'), null)
      assert.throws(() => svc.update(item.id, 't2', 1, { name: '跨租户' }), /not found/)
      assert.throws(() => svc.stockIn({ itemId: item.id, tenantId: 't2', qty: 5 }), /not found/)
      assert.throws(() => svc.stockOut({ itemId: item.id, tenantId: 't2', qty: 5 }), /not found/)
      assert.throws(() => svc.adjust({ itemId: item.id, tenantId: 't2', qty: 5, newTotalQty: 20 }), /not found/)
      assert.throws(() => svc.softDelete(item.id, 't2'), /not found/)
    })
  })

  // ═══════════════════════════════════════════════════════════════
  // 审计日志验证
  // ═══════════════════════════════════════════════════════════════
  describe('审计日志', () => {
    it('创建、入库、出库、调整均产生审计', () => {
      const item = svc.create({ tenantId: 't1', sku: 'AUDIT1', name: '审计测试', totalQty: 100, unitPriceCents: 1000 })
      svc.stockIn({ itemId: item.id, tenantId: 't1', qty: 20, reason: '补货' })
      svc.stockOut({ itemId: item.id, tenantId: 't1', qty: 10, reason: '销售' })
      svc.adjust({ itemId: item.id, tenantId: 't1', qty: 5, newTotalQty: 200, reason: '盘点' })

      const logs = svc.getAuditLog(item.id, 't1')
      assert.equal(logs.length, 4)
      const types = logs.map(l => l.type)
      assert.deepEqual(types, ['CREATE', 'STOCK_IN', 'STOCK_OUT', 'ADJUST'])
    })

    it('预留操作产生审计', () => {
      const item = svc.create({ tenantId: 't1', sku: 'AUDIT2', name: '预留审计', totalQty: 10, unitPriceCents: 100 })
      svc.reserve({ itemId: item.id, tenantId: 't1', orderId: 'ORD-AUDIT', qty: 3 })
      const r = svc.getReservationById('', 't1') // will return null, use reserve directly
      // 直接验证 reservation 是否有 history
      const res = svc.reserve({ itemId: item.id, tenantId: 't1', orderId: 'ORD-AUDIT2', qty: 3 })
      assert.ok(res.history)
      assert.equal(res.history!.length, 1)
      assert.equal(res.history![0].to, 'PENDING')
    })
  })

  // ═══════════════════════════════════════════════════════════════
  // 边界: 批量/多预留场景
  // ═══════════════════════════════════════════════════════════════
  describe('多预留场景', () => {
    it('多个 PENDING 预留累加 reservedQty', () => {
      const item = svc.create({ tenantId: 't1', sku: 'MULTI1', name: '多预留', totalQty: 20, unitPriceCents: 100 })
      svc.reserve({ itemId: item.id, tenantId: 't1', orderId: 'ORD-M1', qty: 5 })
      svc.reserve({ itemId: item.id, tenantId: 't1', orderId: 'ORD-M2', qty: 3 })
      svc.reserve({ itemId: item.id, tenantId: 't1', orderId: 'ORD-M3', qty: 7 })
      const itemAfter = svc.getById(item.id, 't1')!
      assert.equal(itemAfter.reservedQty, 15)
      assert.equal(itemAfter.availableQty, 5)
    })

    it('confirm 一个 pending 后 reservedQty 正确更新', () => {
      const item = svc.create({ tenantId: 't1', sku: 'MULTI2', name: '多预留2', totalQty: 20, unitPriceCents: 100 })
      const r1 = svc.reserve({ itemId: item.id, tenantId: 't1', orderId: 'ORD-MA', qty: 5 })
      svc.reserve({ itemId: item.id, tenantId: 't1', orderId: 'ORD-MB', qty: 3 })
      const afterConfirm = svc.confirmReservation(r1.id, 't1')
      // reservedQty 只剩 3 (ORD-MB 的), totalQty 扣了 5
      assert.equal(afterConfirm.reservedQty, 3)
      assert.equal(afterConfirm.totalQty, 15)
      assert.equal(afterConfirm.availableQty, 12)
    })
  })

  // ═══════════════════════════════════════════════════════════════
  // 跨租户 list 隔离
  // ═══════════════════════════════════════════════════════════════
  describe('跨租户 list', () => {
    it('多个租户数据列表隔离', () => {
      svc.create({ tenantId: 't1', sku: 'A', name: 't1-A', totalQty: 10, unitPriceCents: 100 })
      svc.create({ tenantId: 't1', sku: 'B', name: 't1-B', totalQty: 20, unitPriceCents: 200 })
      svc.create({ tenantId: 't2', sku: 'C', name: 't2-C', totalQty: 30, unitPriceCents: 300 })
      svc.create({ tenantId: 't3', sku: 'D', name: 't3-D', totalQty: 40, unitPriceCents: 400 })

      assert.equal(svc.list({ tenantId: 't1' }).total, 2)
      assert.equal(svc.list({ tenantId: 't2' }).total, 1)
      assert.equal(svc.list({ tenantId: 't3' }).total, 1)
      assert.equal(svc.list({ tenantId: 't4' }).total, 0)
    })
  })
})
