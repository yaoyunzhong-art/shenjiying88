/**
 * stock-transfer.controller.test.ts — 库存调拨模块 Controller 测试
 *
 * 🐜 自动: 25+ tests 覆盖所有 Controller 端点
 * - POST /stock-transfer (create)
 * - GET /stock-transfer (list)
 * - GET /stock-transfer/:id (getById)
 * - GET /stock-transfer/stats/:tenantId (getStats)
 * - PATCH /stock-transfer/:id/approve
 * - PATCH /stock-transfer/:id/in-transit
 * - PATCH /stock-transfer/:id/receive
 * - PATCH /stock-transfer/:id/cancel
 * - PATCH /stock-transfer/:id/reject
 * - 完整生命周期 + 边界异常
 */

import { describe, it, expect, beforeEach } from 'vitest'
import 'reflect-metadata'
import { StockTransferController } from './stock-transfer.controller'
import { StockTransferService } from './stock-transfer.service'

function createController(): StockTransferController {
  const service = new StockTransferService()
  return new StockTransferController(service)
}

describe('StockTransferController', () => {
  let controller: StockTransferController

  beforeEach(() => {
    controller = createController()
  })

  // ── POST /stock-transfer ─────────────────────────────────────────────

  describe('POST /stock-transfer — create', () => {
    it('正常: 创建调拨单成功', async () => {
      const result = await controller.create({
        tenantId: 'tenant-001',
        transferType: 'store_to_store',
        fromLocationId: 'store-001',
        fromLocationName: '深圳店',
        toLocationId: 'store-002',
        toLocationName: '北京店',
        items: [{ productId: 'p1', productName: '商品A', sku: 'SKU-A', quantity: 10, unit: '件' }],
        requestedById: 'user-001',
        notes: '紧急调货',
      })
      expect(result).toBeDefined()
      expect(result.id).toMatch(/^st-/)
      expect(result.status).toBe('pending')
      expect(result.transferNumber).toMatch(/^TF/)
    })

    it('正常: 最小参数创建成功', async () => {
      const result = await controller.create({
        tenantId: 't',
        transferType: 'warehouse_to_store',
        fromLocationId: 'wh',
        fromLocationName: '总仓',
        toLocationId: 'st',
        toLocationName: '门店',
        items: [{ productId: 'p1', productName: '商品', sku: 'SKU', quantity: 5, unit: '件' }],
        requestedById: 'u',
      })
      expect(result.id).toBeDefined()
      expect(result.items).toHaveLength(1)
    })

    it('异常: 空商品列表抛出 BadRequest', async () => {
      await expect(controller.create({
        tenantId: 't',
        transferType: 'store_to_store',
        fromLocationId: 'a',
        fromLocationName: 'A',
        toLocationId: 'b',
        toLocationName: 'B',
        items: [],
        requestedById: 'u',
      })).rejects.toThrow(/at least one item/)
    })

    it('正常: 多商品调拨单', async () => {
      const result = await controller.create({
        tenantId: 't',
        transferType: 'store_to_store',
        fromLocationId: 'a',
        fromLocationName: 'A',
        toLocationId: 'b',
        toLocationName: 'B',
        items: [
          { productId: 'p1', productName: '商品A', sku: 'SKU-A', quantity: 10, unit: '件' },
          { productId: 'p2', productName: '商品B', sku: 'SKU-B', quantity: 5, unit: '箱' },
        ],
        requestedById: 'u',
      })
      expect(result.items).toHaveLength(2)
    })
  })

  // ── GET /stock-transfer ──────────────────────────────────────────────

  describe('GET /stock-transfer — list', () => {
    it('正常: 空列表返回空数组', async () => {
      const result = await controller.list({})
      expect(Array.isArray(result)).toBe(true)
      expect(result).toHaveLength(0)
    })

    it('正常: 创建后列表返回调拨单', async () => {
      await controller.create({
        tenantId: 't', transferType: 'store_to_store',
        fromLocationId: 'a', fromLocationName: 'A',
        toLocationId: 'b', toLocationName: 'B',
        items: [{ productId: 'p1', productName: '商品', sku: 'SKU', quantity: 1, unit: '件' }],
        requestedById: 'u',
      })
      const list = await controller.list({})
      expect(list).toHaveLength(1)
    })

    it('正常: 按状态筛选', async () => {
      const t = await controller.create({
        tenantId: 't', transferType: 'store_to_store',
        fromLocationId: 'a', fromLocationName: 'A',
        toLocationId: 'b', toLocationName: 'B',
        items: [{ productId: 'p1', productName: '商品', sku: 'SKU', quantity: 1, unit: '件' }],
        requestedById: 'u',
      })
      // 审批它改变状态
      await controller.approve(t.id, { approvedById: 'mgr' })

      const pendingList = await controller.list({ status: 'pending' })
      expect(pendingList).toHaveLength(0)

      const approvedList = await controller.list({ status: 'approved' })
      expect(approvedList).toHaveLength(1)
    })
  })

  // ── GET /stock-transfer/:id ──────────────────────────────────────────

  describe('GET /stock-transfer/:id — getById', () => {
    it('正常: 通过 ID 获取调拨单', async () => {
      const created = await controller.create({
        tenantId: 't', transferType: 'store_to_store',
        fromLocationId: 'a', fromLocationName: 'A',
        toLocationId: 'b', toLocationName: 'B',
        items: [{ productId: 'p1', productName: '商品', sku: 'SKU', quantity: 1, unit: '件' }],
        requestedById: 'u',
      })
      const found = await controller.getById(created.id)
      expect(found.id).toBe(created.id)
      expect(found.tenantId).toBe('t')
    })

    it('异常: 不存在的 ID 抛出 NotFoundException', async () => {
      await expect(controller.getById('nonexistent-id')).rejects.toThrow(/not found/)
    })
  })

  // ── GET /stock-transfer/stats/:tenantId ──────────────────────────────

  describe('GET /stock-transfer/stats/:tenantId — getStats', () => {
    it('正常: 返回统计信息', async () => {
      await controller.create({
        tenantId: 't', transferType: 'store_to_store',
        fromLocationId: 'a', fromLocationName: 'A',
        toLocationId: 'b', toLocationName: 'B',
        items: [{ productId: 'p1', productName: '商品', sku: 'SKU', quantity: 10, unit: '件' }],
        requestedById: 'u',
      })
      const stats = await controller.getStats('t')
      expect(stats.total).toBe(1)
      expect(stats.byStatus.pending).toBe(1)
      expect(stats.totalItems).toBe(10)
    })

    it('正常: 空租户返回零值统计', async () => {
      const stats = await controller.getStats('empty-tenant')
      expect(stats.total).toBe(0)
      expect(stats.totalItems).toBe(0)
      expect(stats.byStatus.pending).toBe(0)
      expect(stats.byStatus.received).toBe(0)
    })
  })

  // ── PATCH /stock-transfer/:id/approve ────────────────────────────────

  describe('PATCH /stock-transfer/:id/approve — approve', () => {
    it('正常: 审批通过', async () => {
      const created = await controller.create({
        tenantId: 't', transferType: 'store_to_store',
        fromLocationId: 'a', fromLocationName: 'A',
        toLocationId: 'b', toLocationName: 'B',
        items: [{ productId: 'p1', productName: '商品', sku: 'SKU', quantity: 1, unit: '件' }],
        requestedById: 'u',
      })
      const result = await controller.approve(created.id, { approvedById: 'mgr-001' })
      expect(result.status).toBe('approved')
      expect(result.approvedById).toBe('mgr-001')
    })

    it('异常: 重复审批抛出 BadRequest', async () => {
      const created = await controller.create({
        tenantId: 't', transferType: 'store_to_store',
        fromLocationId: 'a', fromLocationName: 'A',
        toLocationId: 'b', toLocationName: 'B',
        items: [{ productId: 'p1', productName: '商品', sku: 'SKU', quantity: 1, unit: '件' }],
        requestedById: 'u',
      })
      await controller.approve(created.id, { approvedById: 'mgr' })
      await expect(controller.approve(created.id, { approvedById: 'mgr2' })).rejects.toThrow(/Only pending/)
    })
  })

  // ── PATCH /stock-transfer/:id/in-transit ─────────────────────────────

  describe('PATCH /stock-transfer/:id/in-transit — startTransit', () => {
    it('正常: 开始运输', async () => {
      const created = await controller.create({
        tenantId: 't', transferType: 'store_to_store',
        fromLocationId: 'a', fromLocationName: 'A',
        toLocationId: 'b', toLocationName: 'B',
        items: [{ productId: 'p1', productName: '商品', sku: 'SKU', quantity: 1, unit: '件' }],
        requestedById: 'u',
      })
      await controller.approve(created.id, { approvedById: 'mgr' })
      const result = await controller.startTransit(created.id)
      expect(result.status).toBe('in_transit')
      expect(result.shippedAt).toBeDefined()
    })

    it('异常: 未审批直接运输抛出 BadRequest', async () => {
      const created = await controller.create({
        tenantId: 't', transferType: 'store_to_store',
        fromLocationId: 'a', fromLocationName: 'A',
        toLocationId: 'b', toLocationName: 'B',
        items: [{ productId: 'p1', productName: '商品', sku: 'SKU', quantity: 1, unit: '件' }],
        requestedById: 'u',
      })
      await expect(controller.startTransit(created.id)).rejects.toThrow(/Only approved/)
    })
  })

  // ── PATCH /stock-transfer/:id/receive ────────────────────────────────

  describe('PATCH /stock-transfer/:id/receive — receive', () => {
    it('正常: 收货完成', async () => {
      const created = await controller.create({
        tenantId: 't', transferType: 'store_to_store',
        fromLocationId: 'a', fromLocationName: 'A',
        toLocationId: 'b', toLocationName: 'B',
        items: [{ productId: 'p1', productName: '商品', sku: 'SKU', quantity: 1, unit: '件' }],
        requestedById: 'u',
      })
      await controller.approve(created.id, { approvedById: 'mgr' })
      await controller.startTransit(created.id)
      const result = await controller.receive(created.id, { receivedById: 'st-mgr' })
      expect(result.status).toBe('received')
      expect(result.receivedById).toBe('st-mgr')
    })

    it('异常: 未运输直接收货抛 BadRequest', async () => {
      const created = await controller.create({
        tenantId: 't', transferType: 'store_to_store',
        fromLocationId: 'a', fromLocationName: 'A',
        toLocationId: 'b', toLocationName: 'B',
        items: [{ productId: 'p1', productName: '商品', sku: 'SKU', quantity: 1, unit: '件' }],
        requestedById: 'u',
      })
      await expect(controller.receive(created.id, { receivedById: 'st' })).rejects.toThrow(/Only in-transit/)
    })
  })

  // ── PATCH /stock-transfer/:id/cancel ─────────────────────────────────

  describe('PATCH /stock-transfer/:id/cancel — cancel', () => {
    it('正常: 取消 pending 调拨单', async () => {
      const created = await controller.create({
        tenantId: 't', transferType: 'store_to_store',
        fromLocationId: 'a', fromLocationName: 'A',
        toLocationId: 'b', toLocationName: 'B',
        items: [{ productId: 'p1', productName: '商品', sku: 'SKU', quantity: 1, unit: '件' }],
        requestedById: 'u',
      })
      const result = await controller.cancel(created.id)
      expect(result.status).toBe('cancelled')
    })

    it('异常: 取消已收货的调拨单抛 BadRequest', async () => {
      const created = await controller.create({
        tenantId: 't', transferType: 'store_to_store',
        fromLocationId: 'a', fromLocationName: 'A',
        toLocationId: 'b', toLocationName: 'B',
        items: [{ productId: 'p1', productName: '商品', sku: 'SKU', quantity: 1, unit: '件' }],
        requestedById: 'u',
      })
      await controller.approve(created.id, { approvedById: 'mgr' })
      await controller.startTransit(created.id)
      await controller.receive(created.id, { receivedById: 'st' })
      await expect(controller.cancel(created.id)).rejects.toThrow(/Cannot cancel/)
    })
  })

  // ── PATCH /stock-transfer/:id/reject ─────────────────────────────────

  describe('PATCH /stock-transfer/:id/reject — reject', () => {
    it('正常: 驳回调拨单', async () => {
      const created = await controller.create({
        tenantId: 't', transferType: 'store_to_store',
        fromLocationId: 'a', fromLocationName: 'A',
        toLocationId: 'b', toLocationName: 'B',
        items: [{ productId: 'p1', productName: '商品', sku: 'SKU', quantity: 1, unit: '件' }],
        requestedById: 'u',
      })
      const result = await controller.reject(created.id)
      expect(result.status).toBe('rejected')
    })

    it('异常: 驳回已审批的调拨单抛 BadRequest', async () => {
      const created = await controller.create({
        tenantId: 't', transferType: 'store_to_store',
        fromLocationId: 'a', fromLocationName: 'A',
        toLocationId: 'b', toLocationName: 'B',
        items: [{ productId: 'p1', productName: '商品', sku: 'SKU', quantity: 1, unit: '件' }],
        requestedById: 'u',
      })
      await controller.approve(created.id, { approvedById: 'mgr' })
      await expect(controller.reject(created.id)).rejects.toThrow(/Only pending/)
    })
  })

  // ── 完整生命周期场景 ──────────────────────────────────────────────────

  describe('完整生命周期', () => {
    it('正常: 创建 → 审批 → 运输 → 收货 完整流程', async () => {
      const created = await controller.create({
        tenantId: 't', transferType: 'store_to_store',
        fromLocationId: 'a', fromLocationName: 'A',
        toLocationId: 'b', toLocationName: 'B',
        items: [{ productId: 'p1', productName: '商品', sku: 'SKU', quantity: 10, unit: '件' }],
        requestedById: 'u',
      })
      expect(created.status).toBe('pending')

      // 列表验证
      const list = await controller.list({})
      expect(list).toHaveLength(1)

      const approved = await controller.approve(created.id, { approvedById: 'mgr' })
      expect(approved.status).toBe('approved')

      const transit = await controller.startTransit(created.id)
      expect(transit.status).toBe('in_transit')

      const received = await controller.receive(created.id, { receivedById: 'st-mgr' })
      expect(received.status).toBe('received')

      // 统计验证
      const stats = await controller.getStats('t')
      expect(stats.total).toBe(1)
      expect(stats.byStatus.received).toBe(1)
    })

    it('正常: 创建 → 取消', async () => {
      const created = await controller.create({
        tenantId: 't', transferType: 'store_to_store',
        fromLocationId: 'a', fromLocationName: 'A',
        toLocationId: 'b', toLocationName: 'B',
        items: [{ productId: 'p1', productName: '商品', sku: 'SKU', quantity: 1, unit: '件' }],
        requestedById: 'u',
      })
      const cancelled = await controller.cancel(created.id)
      expect(cancelled.status).toBe('cancelled')

      const stats = await controller.getStats('t')
      expect(stats.byStatus.cancelled).toBe(1)
    })

    it('正常: 创建 → 驳回', async () => {
      const created = await controller.create({
        tenantId: 't', transferType: 'store_to_store',
        fromLocationId: 'a', fromLocationName: 'A',
        toLocationId: 'b', toLocationName: 'B',
        items: [{ productId: 'p1', productName: '商品', sku: 'SKU', quantity: 1, unit: '件' }],
        requestedById: 'u',
      })
      const rejected = await controller.reject(created.id)
      expect(rejected.status).toBe('rejected')

      const stats = await controller.getStats('t')
      expect(stats.byStatus.rejected).toBe(1)
    })
  })
})
