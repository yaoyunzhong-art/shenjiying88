/**
 * 🐜 自动: [inventory-item] [A] inventory-item.service.spec.ts
 *
 * Phase-37 T167: InventoryItemService 纯函数式单元测试
 *
 * 覆盖:
 *   create     — 正例(创建成功)/反例(重复SKU/负数Qty)
 *   getById    — 正例(获取)/边界(不存在/跨租户)
 *   list       — 正例(多过滤条件)/边界(空/分页)
 *   update     — 正例(乐观锁)/反例(版本冲突/跨租户)
 *   softDelete — 正例(归档)/边界(不存在)
 *   stockIn    — 正例/反例(负数Qty)
 *   stockOut   — 正例/反例(库存不足)
 *   adjust     — 正例(含预留)/反例(newTotalQty < reservedQty)
 *   reserve    — 正例(含TTL)/幂等(同orderId)/反例(qty<=0/库存不足)
 *   confirmReservation   — 正例/反例(非PENDING状态)
 *   releaseReservation   — 正例/幂等(二次release)
 *   scanExpiredReservations — 正例(过期释放)/边界(无过期)
 *   getLowStock  — 正例(低于阈值)/边界(无)
 *   getAuditLog  — 正例(含多操作)/边界(不存在)
 *
 * 总计: ≥ 18 项测试
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { InventoryItemService, type CreateInventoryItemInput, type ReserveInput } from './inventory-item.service'

describe('InventoryItemService', () => {
  let svc: InventoryItemService

  beforeEach(() => {
    svc = new InventoryItemService()
  })

  // ═══════════════════════════════════════════════════════════════
  // create
  // ═══════════════════════════════════════════════════════════════
  describe('create', () => {
    const defaultInput: CreateInventoryItemInput = {
      tenantId: 't1',
      sku: 'S001',
      name: '测试商品',
      totalQty: 50,
      unitPriceCents: 2000,
    }

    it('正例: 创建成功返回 InventoryItem', () => {
      const item = svc.create(defaultInput)
      expect(item.sku).toBe('S001')
      expect(item.totalQty).toBe(50)
      expect(item.availableQty).toBe(50)
      expect(item.reservedQty).toBe(0)
      expect(item.status).toBe('ACTIVE')
      expect(item.version).toBe(1)
      expect(item.id).toMatch(/^inv-/)
    })

    it('正例: 自定义 unit / lowStockThreshold', () => {
      const item = svc.create({ ...defaultInput, unit: '箱', lowStockThreshold: 10 })
      expect(item.unit).toBe('箱')
      expect(item.lowStockThreshold).toBe(10)
    })

    it('反例: totalQty < 0 抛 BadRequestException', () => {
      expect(() => svc.create({ ...defaultInput, totalQty: -1 })).toThrow(/totalQty must be >= 0/)
    })

    it('反例: 重复 SKU 抛 ConflictException', () => {
      svc.create(defaultInput)
      expect(() => svc.create(defaultInput)).toThrow(/SKU S001 already exists/)
    })

    it('边界: 同 SKU 不同租户可创建', () => {
      svc.create(defaultInput)
      const item2 = svc.create({ ...defaultInput, tenantId: 't2' })
      expect(item2.id).not.toBeNull()
    })
  })

  // ═══════════════════════════════════════════════════════════════
  // getById
  // ═══════════════════════════════════════════════════════════════
  describe('getById', () => {
    it('正例: 获取已创建 item', () => {
      const item = svc.create({ tenantId: 't1', sku: 'G1', name: 'g', totalQty: 10, unitPriceCents: 100 })
      const found = svc.getById(item.id, 't1')
      expect(found).not.toBeNull()
      expect(found!.id).toBe(item.id)
    })

    it('边界: 不存在返回 null', () => {
      expect(svc.getById('inv-nonexistent', 't1')).toBeNull()
    })

    it('边界: 跨租户返回 null', () => {
      const item = svc.create({ tenantId: 't1', sku: 'G2', name: 'g2', totalQty: 10, unitPriceCents: 100 })
      expect(svc.getById(item.id, 't2')).toBeNull()
    })
  })

  // ═══════════════════════════════════════════════════════════════
  // list
  // ═══════════════════════════════════════════════════════════════
  describe('list', () => {
    beforeEach(() => {
      svc.create({ tenantId: 't1', sku: 'A', name: 'A', totalQty: 10, unitPriceCents: 100 })
      svc.create({ tenantId: 't1', sku: 'B', name: 'B', totalQty: 20, unitPriceCents: 200 })
      svc.create({ tenantId: 't2', sku: 'C', name: 'C', totalQty: 30, unitPriceCents: 300 })
    })

    it('正例: 按 tenantId 过滤', () => {
      const r = svc.list({ tenantId: 't1' })
      expect(r.total).toBe(2)
      expect(r.items).toHaveLength(2)
    })

    it('边界: 空租户返回 0', () => {
      const r = svc.list({ tenantId: 't-empty' })
      expect(r.total).toBe(0)
      expect(r.items).toEqual([])
    })

    it('正例: 分页', () => {
      const r = svc.list({ tenantId: 't1', limit: 1, offset: 0 })
      expect(r.items).toHaveLength(1)
      expect(r.total).toBe(2)
    })

    it('正例: SKU 模糊搜索', () => {
      const r = svc.list({ tenantId: 't1', sku: 'A' })
      expect(r.total).toBe(1)
      expect(r.items[0].sku).toBe('A')
    })
  })

  // ═══════════════════════════════════════════════════════════════
  // update
  // ═══════════════════════════════════════════════════════════════
  describe('update', () => {
    it('正例: 更新名称+乐观锁递增', () => {
      const item = svc.create({ tenantId: 't1', sku: 'U1', name: '旧名', totalQty: 10, unitPriceCents: 100 })
      const updated = svc.update(item.id, 't1', 1, { name: '新名' })
      expect(updated.name).toBe('新名')
      expect(updated.version).toBe(2)
    })

    it('反例: version 不匹配抛 ConflictException', () => {
      const item = svc.create({ tenantId: 't1', sku: 'U2', name: '旧名', totalQty: 10, unitPriceCents: 100 })
      svc.update(item.id, 't1', 1, { name: 'v2' })
      expect(() => svc.update(item.id, 't1', 1, { name: '冲突' })).toThrow(/version mismatch/)
    })

    it('边界: 不存在抛 NotFoundException', () => {
      expect(() => svc.update('inv-x', 't1', 1, { name: 'x' })).toThrow(/not found/)
    })

    it('边界: 跨租户抛 NotFoundException', () => {
      const item = svc.create({ tenantId: 't1', sku: 'U3', name: '旧名', totalQty: 10, unitPriceCents: 100 })
      expect(() => svc.update(item.id, 't2', 1, { name: 'x' })).toThrow(/not found/)
    })
  })

  // ═══════════════════════════════════════════════════════════════
  // softDelete
  // ═══════════════════════════════════════════════════════════════
  describe('softDelete', () => {
    it('正例: 归档后 status = ARCHIVED', () => {
      const item = svc.create({ tenantId: 't1', sku: 'SD1', name: 'sd', totalQty: 10, unitPriceCents: 100 })
      const deleted = svc.softDelete(item.id, 't1')
      expect(deleted.status).toBe('ARCHIVED')
      expect(deleted.version).toBe(2)
    })

    it('边界: 不存在抛 NotFoundException', () => {
      expect(() => svc.softDelete('inv-x', 't1')).toThrow(/not found/)
    })
  })

  // ═══════════════════════════════════════════════════════════════
  // stockIn
  // ═══════════════════════════════════════════════════════════════
  describe('stockIn', () => {
    it('正例: 入库增加 totalQty 和 availableQty', () => {
      const item = svc.create({ tenantId: 't1', sku: 'SI1', name: 'si', totalQty: 10, unitPriceCents: 100 })
      const after = svc.stockIn({ itemId: item.id, tenantId: 't1', qty: 5, reason: '补货' })
      expect(after.totalQty).toBe(15)
      expect(after.availableQty).toBe(15)
    })

    it('反例: qty <= 0 抛 BadRequestException', () => {
      const item = svc.create({ tenantId: 't1', sku: 'SI2', name: 'si2', totalQty: 10, unitPriceCents: 100 })
      expect(() => svc.stockIn({ itemId: item.id, tenantId: 't1', qty: -5 })).toThrow(/qty must be > 0/)
    })
  })

  // ═══════════════════════════════════════════════════════════════
  // stockOut
  // ═══════════════════════════════════════════════════════════════
  describe('stockOut', () => {
    it('正例: 出库减少 totalQty 和 availableQty', () => {
      const item = svc.create({ tenantId: 't1', sku: 'SO1', name: 'so', totalQty: 20, unitPriceCents: 100 })
      const after = svc.stockOut({ itemId: item.id, tenantId: 't1', qty: 5, reason: '销售' })
      expect(after.totalQty).toBe(15)
      expect(after.availableQty).toBe(15)
    })

    it('反例: 库存不足抛 ConflictException', () => {
      const item = svc.create({ tenantId: 't1', sku: 'SO2', name: 'so2', totalQty: 5, unitPriceCents: 100 })
      expect(() => svc.stockOut({ itemId: item.id, tenantId: 't1', qty: 10 })).toThrow(/available qty/)
    })
  })

  // ═══════════════════════════════════════════════════════════════
  // adjust
  // ═══════════════════════════════════════════════════════════════
  describe('adjust', () => {
    it('正例: 调整 totalQty 到新值', () => {
      const item = svc.create({ tenantId: 't1', sku: 'ADJ1', name: 'adj', totalQty: 10, unitPriceCents: 100 })
      const after = svc.adjust({ itemId: item.id, tenantId: 't1', qty: 5, newTotalQty: 30, reason: '盘点' })
      expect(after.totalQty).toBe(30)
      expect(after.availableQty).toBe(30)
    })

    it('正例: 含预留时 adjust 保留 reservedQty', () => {
      const item = svc.create({ tenantId: 't1', sku: 'ADJ2', name: 'adj2', totalQty: 20, unitPriceCents: 100 })
      svc.reserve({ itemId: item.id, tenantId: 't1', orderId: 'O-ADJ2', qty: 5 })
      const after = svc.adjust({ itemId: item.id, tenantId: 't1', qty: 5, newTotalQty: 30, reason: '含预留' })
      expect(after.totalQty).toBe(30)
      expect(after.availableQty).toBe(25) // 30 - 5
    })

    it('反例: newTotalQty < reservedQty 抛 ConflictException', () => {
      const item = svc.create({ tenantId: 't1', sku: 'ADJ3', name: 'adj3', totalQty: 20, unitPriceCents: 100 })
      svc.reserve({ itemId: item.id, tenantId: 't1', orderId: 'O-ADJ3', qty: 10 })
      expect(() => svc.adjust({ itemId: item.id, tenantId: 't1', qty: 5, newTotalQty: 5, reason: '低于预留' })).toThrow(/new total .+ < reserved/)
    })

    it('反例: newTotalQty < 0 抛 BadRequestException', () => {
      const item = svc.create({ tenantId: 't1', sku: 'ADJ4', name: 'adj4', totalQty: 10, unitPriceCents: 100 })
      expect(() => svc.adjust({ itemId: item.id, tenantId: 't1', qty: 5, newTotalQty: -1 })).toThrow(/newTotalQty must be >= 0/)
    })
  })

  // ═══════════════════════════════════════════════════════════════
  // reserve
  // ═══════════════════════════════════════════════════════════════
  describe('reserve', () => {
    it('正例: 预留成功后 status = PENDING', () => {
      const item = svc.create({ tenantId: 't1', sku: 'RES1', name: 'res', totalQty: 10, unitPriceCents: 100 })
      const r = svc.reserve({ itemId: item.id, tenantId: 't1', orderId: 'ORD-1', qty: 3 })
      expect(r.status).toBe('PENDING')
      expect(r.qty).toBe(3)
      expect(r.orderId).toBe('ORD-1')
    })

    it('正例: 预留后 availableQty 减少', () => {
      const item = svc.create({ tenantId: 't1', sku: 'RES2', name: 'res2', totalQty: 10, unitPriceCents: 100 })
      svc.reserve({ itemId: item.id, tenantId: 't1', orderId: 'ORD-2', qty: 3 })
      const itemAfter = svc.getById(item.id, 't1')!
      expect(itemAfter.availableQty).toBe(7)
      expect(itemAfter.reservedQty).toBe(3)
    })

    it('幂等: 同 tenant+orderId 返回相同 reservation', () => {
      const item = svc.create({ tenantId: 't1', sku: 'RES3', name: 'res3', totalQty: 10, unitPriceCents: 100 })
      const r1 = svc.reserve({ itemId: item.id, tenantId: 't1', orderId: 'ORD-IDEM', qty: 3 })
      const r2 = svc.reserve({ itemId: item.id, tenantId: 't1', orderId: 'ORD-IDEM', qty: 3 })
      expect(r1.id).toBe(r2.id)
    })

    it('反例: qty <= 0 抛 BadRequestException', () => {
      const item = svc.create({ tenantId: 't1', sku: 'RES4', name: 'res4', totalQty: 10, unitPriceCents: 100 })
      expect(() => svc.reserve({ itemId: item.id, tenantId: 't1', orderId: 'ORD-0', qty: 0 })).toThrow(/qty must be > 0/)
    })

    it('反例: 可用库存不足抛 ConflictException', () => {
      const item = svc.create({ tenantId: 't1', sku: 'RES5', name: 'res5', totalQty: 5, unitPriceCents: 100 })
      expect(() => svc.reserve({ itemId: item.id, tenantId: 't1', orderId: 'ORD-OVER', qty: 10 })).toThrow(/available/)
    })
  })

  // ═══════════════════════════════════════════════════════════════
  // confirmReservation
  // ═══════════════════════════════════════════════════════════════
  describe('confirmReservation', () => {
    it('正例: CONFIRMED 后 item totalQty 减少', () => {
      const item = svc.create({ tenantId: 't1', sku: 'CF1', name: 'cf', totalQty: 10, unitPriceCents: 100 })
      const r = svc.reserve({ itemId: item.id, tenantId: 't1', orderId: 'ORD-CF', qty: 3 })
      const after = svc.confirmReservation(r.id, 't1')
      expect(after.totalQty).toBe(7)
      expect(after.reservedQty).toBe(0)
      expect(after.availableQty).toBe(7)
    })

    it('反例: 非 PENDING 状态抛 ConflictException', () => {
      const item = svc.create({ tenantId: 't1', sku: 'CF2', name: 'cf2', totalQty: 10, unitPriceCents: 100 })
      const r = svc.reserve({ itemId: item.id, tenantId: 't1', orderId: 'ORD-CF2', qty: 3 })
      svc.confirmReservation(r.id, 't1')
      expect(() => svc.confirmReservation(r.id, 't1')).toThrow(/cannot confirm/)
    })
  })

  // ═══════════════════════════════════════════════════════════════
  // releaseReservation
  // ═══════════════════════════════════════════════════════════════
  describe('releaseReservation', () => {
    it('正例: RELEASED 后 reservedQty 归零', () => {
      const item = svc.create({ tenantId: 't1', sku: 'RL1', name: 'rl', totalQty: 10, unitPriceCents: 100 })
      const r = svc.reserve({ itemId: item.id, tenantId: 't1', orderId: 'ORD-RL', qty: 3 })
      const after = svc.releaseReservation(r.id, 't1', '取消订单')
      expect(after.reservedQty).toBe(0)
      expect(after.availableQty).toBe(10)
    })

    it('幂等: 二次 RELEASED 不抛异常', () => {
      const item = svc.create({ tenantId: 't1', sku: 'RL2', name: 'rl2', totalQty: 10, unitPriceCents: 100 })
      const r = svc.reserve({ itemId: item.id, tenantId: 't1', orderId: 'ORD-RL2', qty: 3 })
      svc.releaseReservation(r.id, 't1')
      expect(() => svc.releaseReservation(r.id, 't1')).not.toThrow()
    })
  })

  // ═══════════════════════════════════════════════════════════════
  // scanExpiredReservations
  // ═══════════════════════════════════════════════════════════════
  describe('scanExpiredReservations', () => {
    it('正例: TTL=0 在 future 扫过期', () => {
      const item = svc.create({ tenantId: 't1', sku: 'EXP1', name: 'exp', totalQty: 10, unitPriceCents: 100 })
      svc.reserve({ itemId: item.id, tenantId: 't1', orderId: 'ORD-EXP', qty: 3, ttlSeconds: 0 })
      const expired = svc.scanExpiredReservations(new Date('2099-01-01'))
      expect(expired).toHaveLength(1)
      expect(expired[0].status).toBe('EXPIRED')
    })

    it('边界: 无过期返回空数组', () => {
      const item = svc.create({ tenantId: 't1', sku: 'EXP2', name: 'exp2', totalQty: 10, unitPriceCents: 100 })
      svc.reserve({ itemId: item.id, tenantId: 't1', orderId: 'ORD-EXP2', qty: 3, ttlSeconds: 600 })
      const expired = svc.scanExpiredReservations(new Date('2020-01-01'))
      expect(expired).toHaveLength(0)
    })

    it('正例: 过期释放后 availableQty 恢复', () => {
      const item = svc.create({ tenantId: 't1', sku: 'EXP3', name: 'exp3', totalQty: 10, unitPriceCents: 100 })
      svc.reserve({ itemId: item.id, tenantId: 't1', orderId: 'ORD-EXP3', qty: 5, ttlSeconds: 0 })
      const expired = svc.scanExpiredReservations(new Date('2099-01-01'))
      expect(expired).toHaveLength(1)
      const itemAfter = svc.getById(item.id, 't1')!
      expect(itemAfter.reservedQty).toBe(0)
      expect(itemAfter.availableQty).toBe(10)
    })
  })

  // ═══════════════════════════════════════════════════════════════
  // getLowStock
  // ═══════════════════════════════════════════════════════════════
  describe('getLowStock', () => {
    it('正例: 返回低于阈值商品', () => {
      svc.create({ tenantId: 't1', sku: 'LS1', name: '低库存', totalQty: 3, unitPriceCents: 100, lowStockThreshold: 5 })
      svc.create({ tenantId: 't1', sku: 'LS2', name: '正常', totalQty: 100, unitPriceCents: 100, lowStockThreshold: 5 })
      const low = svc.getLowStock('t1')
      expect(low).toHaveLength(1)
      expect(low[0].sku).toBe('LS1')
    })

    it('边界: 有预留时可用量低于阈值也算低库存', () => {
      svc.create({ tenantId: 't1', sku: 'LS3', name: '预留低', totalQty: 10, unitPriceCents: 100, lowStockThreshold: 5 })
      const item = svc.getById('', 't1') || svc.list({ tenantId: 't1' }).items[0]
      // 预留 6 件，available=4 < 5
      svc.reserve({ itemId: item.id, tenantId: 't1', orderId: 'ORD-LS', qty: 6 })
      const low = svc.getLowStock('t1')
      expect(low.some(i => i.sku === 'LS3')).toBe(true)
    })

    it('边界: 无低库存返回空', () => {
      svc.create({ tenantId: 't1', sku: 'NLS', name: '不缺', totalQty: 100, unitPriceCents: 100, lowStockThreshold: 5 })
      expect(svc.getLowStock('t1')).toHaveLength(0)
    })
  })

  // ═══════════════════════════════════════════════════════════════
  // getAuditLog
  // ═══════════════════════════════════════════════════════════════
  describe('getAuditLog', () => {
    it('正例: 创建后有 CREATE 审计记录', () => {
      const item = svc.create({ tenantId: 't1', sku: 'AUD1', name: 'aud', totalQty: 10, unitPriceCents: 100 })
      const logs = svc.getAuditLog(item.id, 't1')
      expect(logs.length).toBeGreaterThanOrEqual(1)
      expect(logs[0].type).toBe('CREATE')
    })

    it('正例: 多操作产生多条审计', () => {
      const item = svc.create({ tenantId: 't1', sku: 'AUD2', name: 'aud2', totalQty: 10, unitPriceCents: 100 })
      svc.stockIn({ itemId: item.id, tenantId: 't1', qty: 5 })
      svc.stockOut({ itemId: item.id, tenantId: 't1', qty: 3 })
      const logs = svc.getAuditLog(item.id, 't1')
      expect(logs.length).toBeGreaterThanOrEqual(3)
      const types = logs.map(l => l.type)
      expect(types).toContain('STOCK_IN')
      expect(types).toContain('STOCK_OUT')
    })

    it('边界: 不存在的 itemId 返回空', () => {
      expect(svc.getAuditLog('inv-nonexistent', 't1')).toEqual([])
    })
  })

  // ═══════════════════════════════════════════════════════════════
  // reset
  // ═══════════════════════════════════════════════════════════════
  describe('reset', () => {
    it('正例: 重置后所有数据清空', () => {
      svc.create({ tenantId: 't1', sku: 'RST1', name: 'rst', totalQty: 10, unitPriceCents: 100 })
      svc.reset()
      const r = svc.list({ tenantId: 't1' })
      expect(r.total).toBe(0)
    })
  })
})
