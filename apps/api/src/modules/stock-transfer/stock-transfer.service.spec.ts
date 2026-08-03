/**
 * stock-transfer.service.spec.ts — 库存调拨模块 Service 单元测试
 *
 * 覆盖: CRUD / 工作流 (approve→transit→receive) / 取消/驳回 / 统计 / 边界异常
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { StockTransferService } from './stock-transfer.service'

describe('StockTransferService — CRUD', () => {
  let svc: StockTransferService

  beforeEach(() => {
    svc = new StockTransferService()
  })

  it('create 创建调拨单成功', async () => {
    const transfer = await svc.create({
      tenantId: 'tenant-001',
      transferType: 'store_to_store',
      fromLocationId: 'store-001',
      fromLocationName: '深圳店',
      toLocationId: 'store-002',
      toLocationName: '北京店',
      items: [{ productId: 'p1', productName: '商品A', sku: 'SKU-A', quantity: 10, unit: '件' }],
      notes: '紧急调货',
      requestedById: 'user-001',
    })
    expect(transfer.id).toMatch(/^st-/)
    expect(transfer.status).toBe('pending')
    expect(transfer.transferNumber).toMatch(/^TF/)
    expect(transfer.items).toHaveLength(1)
  })

  it('create 空商品列表抛 BadRequestException', async () => {
    await expect(svc.create({
      tenantId: 't', transferType: 'store_to_store',
      fromLocationId: 'a', fromLocationName: 'A',
      toLocationId: 'b', toLocationName: 'B',
      items: [], notes: '', requestedById: 'u',
    })).rejects.toThrow(/at least one item/)
  })

  it('getById 获取调拨单', async () => {
    const created = await svc.create({
      tenantId: 't', transferType: 'warehouse_to_store',
      fromLocationId: 'wh-1', fromLocationName: '总仓',
      toLocationId: 'st-1', toLocationName: '门店1',
      items: [{ productId: 'p1', productName: '商品', sku: 'SKU', quantity: 5, unit: '箱' }],
      notes: '', requestedById: 'u',
    })
    const found = await svc.getById(created.id)
    expect(found.id).toBe(created.id)
  })

  it('getById 不存在的调拨单抛 NotFoundException', async () => {
    await expect(svc.getById('nonexistent')).rejects.toThrow(/not found/)
  })

  it('list 支持按状态筛选', async () => {
    await svc.create({
      tenantId: 't', transferType: 'store_to_store',
      fromLocationId: 'a', fromLocationName: 'A',
      toLocationId: 'b', toLocationName: 'B',
      items: [{ productId: 'p1', productName: '商品', sku: 'SKU', quantity: 1, unit: '件' }],
      notes: '', requestedById: 'u',
    })
    const pending = await svc.list({ status: 'pending' })
    expect(pending.length).toBeGreaterThan(0)
  })

  it('list 多条件联合筛选', async () => {
    await svc.create({
      tenantId: 't1', transferType: 'store_to_store',
      fromLocationId: 'a', fromLocationName: 'A',
      toLocationId: 'b', toLocationName: 'B',
      items: [{ productId: 'p1', productName: '商品', sku: 'SKU', quantity: 1, unit: '件' }],
      notes: '', requestedById: 'u',
    })
    const result = await svc.list({ tenantId: 't1', status: 'pending' })
    expect(result.length).toBeGreaterThan(0)
  })
})

describe('StockTransferService — 工作流', () => {
  let svc: StockTransferService

  beforeEach(() => {
    svc = new StockTransferService()
  })

  async function createPendingTransfer(): Promise<string> {
    const t = await svc.create({
      tenantId: 't', transferType: 'warehouse_to_store',
      fromLocationId: 'wh', fromLocationName: '仓库',
      toLocationId: 'st', toLocationName: '门店',
      items: [{ productId: 'p1', productName: '商品', sku: 'SKU', quantity: 10, unit: '件' }],
      notes: '', requestedById: 'u',
    })
    return t.id
  }

  it('approve 审批通过', async () => {
    const id = await createPendingTransfer()
    const approved = await svc.approve(id, 'mgr-001')
    expect(approved.status).toBe('approved')
    expect(approved.approvedById).toBe('mgr-001')
    expect(approved.approvedAt).toBeDefined()
  })

  it('approve 非 pending 状态抛错', async () => {
    const id = await createPendingTransfer()
    await svc.approve(id, 'mgr')
    await expect(svc.approve(id, 'mgr2')).rejects.toThrow(/Only pending/)
  })

  it('startTransit 开始运输', async () => {
    const id = await createPendingTransfer()
    await svc.approve(id, 'mgr')
    const transit = await svc.startTransit(id)
    expect(transit.status).toBe('in_transit')
    expect(transit.shippedAt).toBeDefined()
  })

  it('startTransit 非 approved 状态抛错', async () => {
    const id = await createPendingTransfer()
    await expect(svc.startTransit(id)).rejects.toThrow(/Only approved/)
  })

  it('receive 收货完成', async () => {
    const id = await createPendingTransfer()
    await svc.approve(id, 'mgr')
    await svc.startTransit(id)
    const received = await svc.receive(id, 'st-mgr')
    expect(received.status).toBe('received')
    expect(received.receivedById).toBe('st-mgr')
  })

  it('cancel 取消调拨', async () => {
    const id = await createPendingTransfer()
    const cancelled = await svc.cancel(id)
    expect(cancelled.status).toBe('cancelled')
    expect(cancelled.cancelledAt).toBeDefined()
  })

  it('cancel 已收货的调拨抛错', async () => {
    const id = await createPendingTransfer()
    await svc.approve(id, 'mgr')
    await svc.startTransit(id)
    await svc.receive(id, 'st')
    await expect(svc.cancel(id)).rejects.toThrow(/Cannot cancel/)
  })

  it('reject 驳回', async () => {
    const id = await createPendingTransfer()
    const rejected = await svc.reject(id)
    expect(rejected.status).toBe('rejected')
  })

  it('reject 非 pending 状态抛错', async () => {
    const id = await createPendingTransfer()
    await svc.approve(id, 'mgr')
    await expect(svc.reject(id)).rejects.toThrow(/Only pending/)
  })
})

describe('StockTransferService — 统计', () => {
  let svc: StockTransferService

  beforeEach(() => {
    svc = new StockTransferService()
  })

  it('getStats 返回正确的统计数据', async () => {
    await svc.create({
      tenantId: 't', transferType: 'store_to_store',
      fromLocationId: 'a', fromLocationName: 'A',
      toLocationId: 'b', toLocationName: 'B',
      items: [{ productId: 'p1', productName: '商品', sku: 'SKU', quantity: 10, unit: '件' }],
      notes: '', requestedById: 'u',
    })
    const stats = await svc.getStats('t')
    expect(stats.total).toBeGreaterThan(0)
    expect(stats.byStatus.pending).toBeGreaterThan(0)
    expect(stats.totalItems).toBeGreaterThan(0)
  })

  it('getStats 空租户返回零值', async () => {
    const stats = await svc.getStats('nonexistent')
    expect(stats.total).toBe(0)
    expect(stats.totalItems).toBe(0)
  })
})
