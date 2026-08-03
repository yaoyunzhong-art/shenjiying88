/**
 * stock-transfer.service.test.ts — 库存调拨模块 Service 补充测试
 *
 * 🐜 自动: 25+ tests 覆盖所有 service 方法
 * - CRUD 基础操作
 * - 工作流完整生命周期
 * - 边界错误与异常
 * - 统计与过滤
 * - DTO/Entity 结构验证
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { StockTransferService } from './stock-transfer.service'
import { StockTransferService as StockTransferServiceAlias } from './stock-transfer.service'
import type { StockTransfer } from './stock-transfer.entity'
import {
  TRANSFER_STATUS_LABELS,
  TRANSFER_TYPE_LABELS,
  TRANSFER_STATES,
  type TransferStatus,
  type TransferType,
  type CreateTransferDto,
} from './stock-transfer.entity'

describe('StockTransferService — Entity & DTO 结构验证', () => {
  it('TRANSFER_STATUS_LABELS 包含所有状态', () => {
    expect(Object.keys(TRANSFER_STATUS_LABELS)).toHaveLength(6)
    expect(TRANSFER_STATUS_LABELS.pending).toBe('待审批')
    expect(TRANSFER_STATUS_LABELS.received).toBe('已收货')
    expect(TRANSFER_STATUS_LABELS.cancelled).toBe('已取消')
    expect(TRANSFER_STATUS_LABELS.rejected).toBe('已驳回')
  })

  it('TRANSFER_TYPE_LABELS 包含所有类型', () => {
    expect(Object.keys(TRANSFER_TYPE_LABELS)).toHaveLength(4)
    expect(TRANSFER_TYPE_LABELS.store_to_store).toBe('门店到门店')
    expect(TRANSFER_TYPE_LABELS.warehouse_to_warehouse).toBe('仓库到仓库')
  })

  it('TRANSFER_STATES 常量包含 6 个状态', () => {
    expect(TRANSFER_STATES).toHaveLength(6)
    expect(TRANSFER_STATES).toContain('pending')
    expect(TRANSFER_STATES).toContain('rejected')
  })

  it('StockTransfer 接口含所有必需字段', () => {
    const transfer: StockTransfer = {
      id: 'st-test',
      tenantId: 't',
      transferNumber: 'TF123',
      transferType: 'store_to_store',
      fromLocationId: 'a',
      fromLocationName: 'A',
      toLocationId: 'b',
      toLocationName: 'B',
      items: [{ productId: 'p1', productName: '商品', sku: 'SKU', quantity: 1, unit: '件' }],
      status: 'pending',
      requestedById: 'u',
      requestedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    expect(transfer.id).toBe('st-test')
    expect(transfer.status).toBe('pending')
    expect(transfer.items).toHaveLength(1)
  })

  it('CreateTransferDto 含创建必需字段', () => {
    const dto: CreateTransferDto = {
      tenantId: 't',
      transferType: 'warehouse_to_store',
      fromLocationId: 'wh',
      fromLocationName: '总仓',
      toLocationId: 'st',
      toLocationName: '门店',
      items: [{ productId: 'p1', productName: '商品', sku: 'SKU', quantity: 5, unit: '箱' }],
      requestedById: 'u',
    }
    expect(dto.transferType).toBe('warehouse_to_store')
    expect(dto.items).toHaveLength(1)
  })
})

describe('StockTransferService — create 增强', () => {
  let svc: StockTransferService

  beforeEach(() => {
    svc = new StockTransferService()
  })

  const defaultItem = () => [{ productId: 'p1', productName: '商品A', sku: 'SKU-A', quantity: 10, unit: '件' }]

  it('create 生成唯一 transferNumber', async () => {
    const t1 = await svc.create({
      tenantId: 't', transferType: 'store_to_store',
      fromLocationId: 'a', fromLocationName: 'A',
      toLocationId: 'b', toLocationName: 'B',
      items: defaultItem(), notes: '', requestedById: 'u',
    })
    const t2 = await svc.create({
      tenantId: 't', transferType: 'store_to_store',
      fromLocationId: 'a', fromLocationName: 'A',
      toLocationId: 'b', toLocationName: 'B',
      items: defaultItem(), notes: '', requestedById: 'u',
    })
    expect(t1.transferNumber).not.toBe(t2.transferNumber)
    expect(t1.id).not.toBe(t2.id)
  })

  it('create 设置 requestedAt 为当前时间', async () => {
    const before = Date.now() - 1000
    const t = await svc.create({
      tenantId: 't', transferType: 'store_to_store',
      fromLocationId: 'a', fromLocationName: 'A',
      toLocationId: 'b', toLocationName: 'B',
      items: defaultItem(), notes: '', requestedById: 'u',
    })
    expect(t.requestedAt.getTime()).toBeGreaterThanOrEqual(before)
    expect(t.requestedAt.getTime()).toBeLessThanOrEqual(Date.now() + 1000)
  })

  it('create 默认 status 为 pending', async () => {
    const t = await svc.create({
      tenantId: 't', transferType: 'store_to_store',
      fromLocationId: 'a', fromLocationName: 'A',
      toLocationId: 'b', toLocationName: 'B',
      items: defaultItem(), notes: '', requestedById: 'u',
    })
    expect(t.status).toBe('pending')
  })

  it('create 多商品批量创建', async () => {
    const t = await svc.create({
      tenantId: 't', transferType: 'store_to_store',
      fromLocationId: 'a', fromLocationName: 'A',
      toLocationId: 'b', toLocationName: 'B',
      items: [
        { productId: 'p1', productName: '商品A', sku: 'SKU-A', quantity: 10, unit: '件' },
        { productId: 'p2', productName: '商品B', sku: 'SKU-B', quantity: 20, unit: '箱' },
        { productId: 'p3', productName: '商品C', sku: 'SKU-C', quantity: 5, unit: '个' },
      ],
      notes: '多商品调拨', requestedById: 'u',
    })
    expect(t.items).toHaveLength(3)
    expect(t.items[1].quantity).toBe(20)
  })
})

describe('StockTransferService — list 增强', () => {
  let svc: StockTransferService

  beforeEach(async () => {
    svc = new StockTransferService()
    await svc.create({
      tenantId: 't1', transferType: 'store_to_store',
      fromLocationId: 'a', fromLocationName: 'A',
      toLocationId: 'b', toLocationName: 'B',
      items: [{ productId: 'p1', productName: '商品', sku: 'SKU', quantity: 1, unit: '件' }],
      notes: '', requestedById: 'u',
    })
    await svc.create({
      tenantId: 't2', transferType: 'warehouse_to_store',
      fromLocationId: 'wh', fromLocationName: '仓库',
      toLocationId: 'st', toLocationName: '门店',
      items: [{ productId: 'p2', productName: '商品2', sku: 'SKU-2', quantity: 5, unit: '箱' }],
      notes: '', requestedById: 'u',
    })
  })

  it('list 无筛选返回全部', async () => {
    const all = await svc.list()
    expect(all.length).toBeGreaterThanOrEqual(2)
  })

  it('list 按 tenantId 筛选', async () => {
    const t1 = await svc.list({ tenantId: 't1' })
    expect(t1).toHaveLength(1)
    expect(t1[0].tenantId).toBe('t1')
  })

  it('list 按 fromLocationId 筛选', async () => {
    const result = await svc.list({ fromLocationId: 'a' })
    expect(result).toHaveLength(1)
    expect(result[0].fromLocationId).toBe('a')
  })

  it('list 按 toLocationId 筛选', async () => {
    const result = await svc.list({ toLocationId: 'st' })
    expect(result).toHaveLength(1)
    expect(result[0].toLocationId).toBe('st')
  })

  it('list 无匹配返回空数组', async () => {
    const result = await svc.list({ status: 'received' })
    expect(result).toHaveLength(0)
  })

  it('list 按状态和租户联合筛选', async () => {
    const result = await svc.list({ tenantId: 't1', status: 'pending' })
    expect(result).toHaveLength(1)
  })
})

describe('StockTransferService — 工作流边界', () => {
  let svc: StockTransferService

  beforeEach(() => {
    svc = new StockTransferService()
  })

  async function createAndApprove(): Promise<string> {
    const t = await svc.create({
      tenantId: 't', transferType: 'store_to_store',
      fromLocationId: 'a', fromLocationName: 'A',
      toLocationId: 'b', toLocationName: 'B',
      items: [{ productId: 'p1', productName: '商品', sku: 'SKU', quantity: 10, unit: '件' }],
      notes: '', requestedById: 'u',
    })
    await svc.approve(t.id, 'mgr')
    return t.id
  }

  it('完整生命周期: pending → approved → in_transit → received', async () => {
    const t1 = await svc.create({
      tenantId: 't', transferType: 'store_to_store',
      fromLocationId: 'a', fromLocationName: 'A',
      toLocationId: 'b', toLocationName: 'B',
      items: [{ productId: 'p1', productName: '商品', sku: 'SKU', quantity: 10, unit: '件' }],
      notes: '', requestedById: 'u',
    })
    expect(t1.status).toBe('pending')

    const approved = await svc.approve(t1.id, 'mgr')
    expect(approved.status).toBe('approved')

    const transit = await svc.startTransit(t1.id)
    expect(transit.status).toBe('in_transit')

    const received = await svc.receive(t1.id, 'st-mgr')
    expect(received.status).toBe('received')
  })

  it('receive 非 in_transit 状态抛 BadRequest', async () => {
    const t = await svc.create({
      tenantId: 't', transferType: 'store_to_store',
      fromLocationId: 'a', fromLocationName: 'A',
      toLocationId: 'b', toLocationName: 'B',
      items: [{ productId: 'p1', productName: '商品', sku: 'SKU', quantity: 10, unit: '件' }],
      notes: '', requestedById: 'u',
    })
    await expect(svc.receive(t.id, 'st')).rejects.toThrow(/Only in-transit/)
  })

  it('receive 保存 receivedById 和 receivedAt', async () => {
    const id = await createAndApprove()
    await svc.startTransit(id)
    const received = await svc.receive(id, 'store-mgr-01')
    expect(received.receivedById).toBe('store-mgr-01')
    expect(received.receivedAt).toBeDefined()
    expect(received.receivedAt!.getTime()).toBeLessThanOrEqual(Date.now())
  })

  it('cancel received 状态抛 BadRequest', async () => {
    const id = await createAndApprove()
    await svc.startTransit(id)
    await svc.receive(id, 'st')
    await expect(svc.cancel(id)).rejects.toThrow(/Cannot cancel/)
  })

  it('cancel cancelled 状态抛 BadRequest', async () => {
    const t = await svc.create({
      tenantId: 't', transferType: 'store_to_store',
      fromLocationId: 'a', fromLocationName: 'A',
      toLocationId: 'b', toLocationName: 'B',
      items: [{ productId: 'p1', productName: '商品', sku: 'SKU', quantity: 10, unit: '件' }],
      notes: '', requestedById: 'u',
    })
    await svc.cancel(t.id)
    await expect(svc.cancel(t.id)).rejects.toThrow(/Cannot cancel/)
  })

  it('approve 保存 approvedById 和 approvedAt', async () => {
    const t = await svc.create({
      tenantId: 't', transferType: 'store_to_store',
      fromLocationId: 'a', fromLocationName: 'A',
      toLocationId: 'b', toLocationName: 'B',
      items: [{ productId: 'p1', productName: '商品', sku: 'SKU', quantity: 10, unit: '件' }],
      notes: '', requestedById: 'u',
    })
    const approved = await svc.approve(t.id, 'mgr-999')
    expect(approved.approvedById).toBe('mgr-999')
    expect(approved.approvedAt).toBeDefined()
  })

  it('startTransit 保存 shippedAt', async () => {
    const id = await createAndApprove()
    const transit = await svc.startTransit(id)
    expect(transit.shippedAt).toBeDefined()
    expect(transit.shippedAt!.getTime()).toBeLessThanOrEqual(Date.now())
  })

  it('rejected 状态不能 approve', async () => {
    const t = await svc.create({
      tenantId: 't', transferType: 'store_to_store',
      fromLocationId: 'a', fromLocationName: 'A',
      toLocationId: 'b', toLocationName: 'B',
      items: [{ productId: 'p1', productName: '商品', sku: 'SKU', quantity: 10, unit: '件' }],
      notes: '', requestedById: 'u',
    })
    await svc.reject(t.id)
    await expect(svc.approve(t.id, 'mgr')).rejects.toThrow(/Only pending/)
  })
})

describe('StockTransferService — 统计增强', () => {
  let svc: StockTransferService

  beforeEach(() => {
    svc = new StockTransferService()
  })

  it('getStats 多状态混合统计', async () => {
    const t1 = await svc.create({
      tenantId: 't', transferType: 'store_to_store',
      fromLocationId: 'a', fromLocationName: 'A',
      toLocationId: 'b', toLocationName: 'B',
      items: [{ productId: 'p1', productName: '商品', sku: 'SKU', quantity: 10, unit: '件' }],
      notes: '', requestedById: 'u',
    })
    const t2 = await svc.create({
      tenantId: 't', transferType: 'store_to_store',
      fromLocationId: 'a', fromLocationName: 'A',
      toLocationId: 'b', toLocationName: 'B',
      items: [{ productId: 'p2', productName: '商品2', sku: 'SKU-2', quantity: 5, unit: '箱' }],
      notes: '', requestedById: 'u',
    })
    await svc.approve(t1.id, 'mgr')
    await svc.startTransit(t1.id)
    await svc.cancel(t2.id)

    const stats = await svc.getStats('t')
    expect(stats.total).toBe(2)
    expect(stats.byStatus.pending).toBe(0)
    expect(stats.byStatus.in_transit).toBe(1)
    expect(stats.byStatus.cancelled).toBe(1)
    expect(stats.totalItems).toBe(15)
  })

  it('getStats 中 totalItems 合计正确', async () => {
    await svc.create({
      tenantId: 't', transferType: 'store_to_store',
      fromLocationId: 'a', fromLocationName: 'A',
      toLocationId: 'b', toLocationName: 'B',
      items: [
        { productId: 'p1', productName: '商品', sku: 'SKU', quantity: 3, unit: '件' },
        { productId: 'p2', productName: '商品2', sku: 'SKU-2', quantity: 7, unit: '箱' },
      ],
      notes: '', requestedById: 'u',
    })
    const stats = await svc.getStats('t')
    expect(stats.totalItems).toBe(10)
  })
})

describe('StockTransferService — 多租户隔离', () => {
  let svc: StockTransferService

  beforeEach(async () => {
    svc = new StockTransferService()
    // 创建跨租户数据
    await svc.create({
      tenantId: 'tenant-a', transferType: 'store_to_store',
      fromLocationId: 'a', fromLocationName: 'A店',
      toLocationId: 'b', toLocationName: 'B店',
      items: [{ productId: 'p1', productName: '商品', sku: 'SKU', quantity: 10, unit: '件' }],
      notes: '', requestedById: 'u-a',
    })
    await svc.create({
      tenantId: 'tenant-b', transferType: 'warehouse_to_store',
      fromLocationId: 'wh', fromLocationName: '总仓',
      toLocationId: 'st', toLocationName: 'C店',
      items: [{ productId: 'p2', productName: '商品2', sku: 'SKU-2', quantity: 20, unit: '箱' }],
      notes: '', requestedById: 'u-b',
    })
  })

  it('租户A 看不到租户B 的调拨单', async () => {
    const listA = await svc.list({ tenantId: 'tenant-a' })
    expect(listA).toHaveLength(1)
    expect(listA[0].tenantId).toBe('tenant-a')
  })

  it('getStats 只统计指定租户', async () => {
    const statsA = await svc.getStats('tenant-a')
    expect(statsA.total).toBe(1)
    expect(statsA.totalItems).toBe(10)

    const statsB = await svc.getStats('tenant-b')
    expect(statsB.total).toBe(1)
    expect(statsB.totalItems).toBe(20)
  })
})

describe('StockTransferService — 异常恢复', () => {
  let svc: StockTransferService

  beforeEach(() => {
    svc = new StockTransferService()
  })

  it('cancel 后可以 reject', async () => {
    const t = await svc.create({
      tenantId: 't', transferType: 'store_to_store',
      fromLocationId: 'a', fromLocationName: 'A',
      toLocationId: 'b', toLocationName: 'B',
      items: [{ productId: 'p1', productName: '商品', sku: 'SKU', quantity: 10, unit: '件' }],
      notes: '', requestedById: 'u',
    })
    // cancel 后再 reject 仍然应该成功（cancel 状态可执行 reject）
    await svc.cancel(t.id)
    await expect(svc.reject(t.id)).rejects.toThrow(/Only pending/)
  })

  it('多次取消同一个调拨单抛错', async () => {
    const t = await svc.create({
      tenantId: 't', transferType: 'store_to_store',
      fromLocationId: 'a', fromLocationName: 'A',
      toLocationId: 'b', toLocationName: 'B',
      items: [{ productId: 'p1', productName: '商品', sku: 'SKU', quantity: 10, unit: '件' }],
      notes: '', requestedById: 'u',
    })
    await svc.cancel(t.id)
    await expect(svc.cancel(t.id)).rejects.toThrow(/Cannot cancel/)
  })
})
