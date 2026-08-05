/**
 * stock.service.spec.ts — 库存管理模块 Service 单元测试
 *
 * 覆盖: 创建/更新库存项、出入库事务、库存告警、参数校验
 * 注意: StockService 使用 TypeORM (Repository + DataSource)，测试中使用 mock
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { StockService } from './stock.service'
import { StockItemStatus } from './stock-item.entity'
import { StockTransactionType } from './stock-transaction.entity'
import { BadRequestException, NotFoundException } from '@nestjs/common'

function createMockRepo() {
  return {
    create: vi.fn((dto) => dto),
    save: vi.fn((entity) => ({ ...entity, id: 'mock-item-id', createdAt: new Date().toISOString() })),
    findOne: vi.fn(),
    find: vi.fn(),
    update: vi.fn(),
  }
}

function createMockDataSource() {
  return {
    transaction: vi.fn((fn: (manager: any) => Promise<any>) => {
      const manager = createMockManager()
      return fn(manager)
    }),
  }
}

function createMockManager() {
  return {
    getRepository: vi.fn(() => createMockRepoWithUpdate()),
    findOne: vi.fn(),
    update: vi.fn(),
    create: vi.fn((dto) => dto),
    save: vi.fn((entity) => entity),
  }
}

function createMockRepoWithUpdate() {
  return {
    findOne: vi.fn(),
    update: vi.fn().mockResolvedValue({ affected: 1 }),
    create: vi.fn((dto) => dto),
    save: vi.fn((entity) => entity),
  }
}

describe('StockService — createItem', () => {
  let svc: StockService
  let itemRepo: ReturnType<typeof createMockRepo>

  beforeEach(() => {
    itemRepo = createMockRepo()
    svc = new StockService(itemRepo as any, createMockRepo() as any, createMockDataSource() as any)
  })

  it('创建库存项成功', async () => {
    itemRepo.create.mockReturnValue({ id: 'new-item', name: '测试商品' })
    itemRepo.save.mockResolvedValue({ id: 'new-item', name: '测试商品', sku: 'SKU-TEST', storeId: 'S001', quantity: 0, status: StockItemStatus.ACTIVE })

    const item = await svc.createItem({
      name: '测试商品',
      sku: 'SKU-TEST',
      storeId: 'S001',
      category: '电子',
      quantity: 10,
      price: 99.99,
    })
    expect(item.name).toBe('测试商品')
    expect(item.sku).toBe('SKU-TEST')
  })

  it('空名称抛 BadRequestException', async () => {
    await expect(svc.createItem({ name: '', sku: 'SKU', storeId: 'S1' })).rejects.toThrow(BadRequestException)
  })

  it('空 SKU 抛 BadRequestException', async () => {
    await expect(svc.createItem({ name: '商品', sku: '', storeId: 'S1' })).rejects.toThrow(BadRequestException)
  })

  it('空 storeId 抛 BadRequestException', async () => {
    await expect(svc.createItem({ name: '商品', sku: 'SKU', storeId: '' })).rejects.toThrow(BadRequestException)
  })

  it('非正价格抛 BadRequestException', async () => {
    await expect(svc.createItem({ name: '商品', sku: 'SKU', storeId: 'S1', price: -1 })).rejects.toThrow(BadRequestException)
  })
})

describe('StockService — updateItem', () => {
  let svc: StockService
  let itemRepo: ReturnType<typeof createMockRepo>

  beforeEach(() => {
    itemRepo = createMockRepo()
    svc = new StockService(itemRepo as any, createMockRepo() as any, createMockDataSource() as any)
  })

  it('更新存在的库存项', async () => {
    itemRepo.findOne.mockResolvedValue({ id: 'item-1', name: '旧名', sku: 'SKU', storeId: 'S1', price: 10, status: StockItemStatus.ACTIVE })
    itemRepo.save.mockResolvedValue({ id: 'item-1', name: '新名', sku: 'SKU', storeId: 'S1', price: 15, status: StockItemStatus.ACTIVE })

    const updated = await svc.updateItem('item-1', { name: '新名', price: 15 })
    expect(updated.name).toBe('新名')
    expect(updated.price).toBe(15)
  })

  it('更新不存在的库存项抛 NotFoundException', async () => {
    itemRepo.findOne.mockResolvedValue(null)
    await expect(svc.updateItem('fake-id', { name: '新名' })).rejects.toThrow(NotFoundException)
  })

  it('更新为空名称抛 BadRequestException', async () => {
    itemRepo.findOne.mockResolvedValue({ id: 'item-1', name: '旧名', sku: 'SKU', storeId: 'S1' })
    await expect(svc.updateItem('item-1', { name: '' })).rejects.toThrow(BadRequestException)
  })
})

describe('StockService — findItem & listItems', () => {
  let svc: StockService
  let itemRepo: ReturnType<typeof createMockRepo>

  beforeEach(() => {
    itemRepo = createMockRepo()
    svc = new StockService(itemRepo as any, createMockRepo() as any, createMockDataSource() as any)
  })

  it('findItem 返回存在的库存项', async () => {
    itemRepo.findOne.mockResolvedValue({ id: 'item-1', name: '商品A', sku: 'SKU-A', storeId: 'S1' })
    const item = await svc.findItem('item-1')
    expect(item.name).toBe('商品A')
  })

  it('findItem 不存在的抛 NotFoundException', async () => {
    itemRepo.findOne.mockResolvedValue(null)
    await expect(svc.findItem('fake-id')).rejects.toThrow(NotFoundException)
  })

  it('listItems 按门店查询', async () => {
    itemRepo.find.mockResolvedValue([{ id: '1', storeId: 'S1' }])
    const items = await svc.listItems('S1')
    expect(items).toHaveLength(1)
  })

  it('listItems 按品类筛选', async () => {
    itemRepo.find.mockResolvedValue([{ id: '1', storeId: 'S1', category: '电子' }])
    const items = await svc.listItems('S1', '电子')
    expect(items).toHaveLength(1)
    expect(itemRepo.find).toHaveBeenCalledWith(expect.objectContaining({
      where: { storeId: 'S1', category: '电子' },
    }))
  })
})

describe('StockService — adjustStock 出入库', () => {
  let svc: StockService
  let itemRepo: ReturnType<typeof createMockRepo>
  let dataSource: ReturnType<typeof createMockDataSource>

  beforeEach(() => {
    itemRepo = createMockRepo()
    dataSource = createMockDataSource()
    svc = new StockService(itemRepo as any, createMockRepo() as any, dataSource as any)
  })

  it('入库操作成功', async () => {
    const manager = {
      getRepository: vi.fn(() => ({
        findOne: vi.fn().mockResolvedValue({ id: 'item-1', quantity: 10, storeId: 'S1' }),
        update: vi.fn().mockResolvedValue({ affected: 1 }),
      })),
    }
    dataSource.transaction.mockImplementation((fn: any) => fn(manager))

    const result = await svc.adjustStock('item-1', 5, StockTransactionType.IN, '采购入库', 'op-001')
    expect(result).toBeDefined()
  })

  it('出库操作成功', async () => {
    const manager = {
      getRepository: vi.fn(() => ({
        findOne: vi.fn().mockResolvedValue({ id: 'item-1', quantity: 10, storeId: 'S1' }),
        update: vi.fn().mockResolvedValue({ affected: 1 }),
      })),
    }
    dataSource.transaction.mockImplementation((fn: any) => fn(manager))

    const result = await svc.adjustStock('item-1', -3, StockTransactionType.OUT, '销售出库', 'op-001')
    expect(result).toBeDefined()
  })

  it('数量为 0 抛 BadRequestException', async () => {
    await expect(svc.adjustStock('item-1', 0, StockTransactionType.IN, '测试', 'op')).rejects.toThrow(BadRequestException)
  })

  it('入库使用负数抛 BadRequestException', async () => {
    await expect(svc.adjustStock('item-1', -5, StockTransactionType.IN, '测试', 'op')).rejects.toThrow(BadRequestException)
  })

  it('出库使用正数抛 BadRequestException', async () => {
    await expect(svc.adjustStock('item-1', 5, StockTransactionType.OUT, '测试', 'op')).rejects.toThrow(BadRequestException)
  })

  it('空原因抛 BadRequestException', async () => {
    await expect(svc.adjustStock('item-1', 5, StockTransactionType.IN, '', 'op')).rejects.toThrow(BadRequestException)
  })

  it('空操作人抛 BadRequestException', async () => {
    await expect(svc.adjustStock('item-1', 5, StockTransactionType.IN, '入库', '')).rejects.toThrow(BadRequestException)
  })
})

describe('StockService — 库存告警', () => {
  let svc: StockService
  let itemRepo: ReturnType<typeof createMockRepo>

  beforeEach(() => {
    itemRepo = createMockRepo()
    svc = new StockService(itemRepo as any, createMockRepo() as any, createMockDataSource() as any)
  })

  it('getLowStockItems 返回低于阈值的项', async () => {
    itemRepo.find.mockResolvedValue([
      { id: '1', name: '低库存商品', quantity: 3, storeId: 'S1', status: StockItemStatus.ACTIVE },
    ])
    const items = await svc.getLowStockItems('S1', 5)
    expect(items).toHaveLength(1)
    expect(items[0].quantity).toBe(3)
  })

  it('getLowStockItems 空门店抛 BadRequestException', async () => {
    await expect(svc.getLowStockItems('', 5)).rejects.toThrow(BadRequestException)
  })

  it('getLowStockItems 负数阈值抛 BadRequestException', async () => {
    await expect(svc.getLowStockItems('S1', -1)).rejects.toThrow(BadRequestException)
  })
})
