import { describe, it, expect, beforeEach, vi } from 'vitest'
import { Test, TestingModule } from '@nestjs/testing'
import { getRepositoryToken } from '@nestjs/typeorm'
import { DataSource, Repository, EntityManager } from 'typeorm'
import { NotFoundException, BadRequestException } from '@nestjs/common'
import { StockService } from './stock.service'
import { StockItem, StockItemStatus } from './stock-item.entity'
import { StockTransaction, StockTransactionType } from './stock-transaction.entity'

// ─── 辅助：构建 mock QueryRunner / Manager ───

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mockManager() {
  return {
    getRepository: vi.fn(),
    findOne: vi.fn(),
    create: vi.fn(),
    save: vi.fn(),
    update: vi.fn(),
    find: vi.fn(),
  } as unknown as EntityManager
}

function makeQueryRunner(manager: EntityManager) {
  return {
    connect: vi.fn(),
    startTransaction: vi.fn(),
    commitTransaction: vi.fn(),
    rollbackTransaction: vi.fn(),
    release: vi.fn(),
    manager,
  }
}

describe('StockService', () => {
  let service: StockService
  let mockStockItemRepo: Partial<Record<keyof Repository<StockItem>, ReturnType<typeof vi.fn>>>
  let mockStockTxnRepo: Partial<Record<keyof Repository<StockTransaction>, ReturnType<typeof vi.fn>>>
  let mockDataSource: Partial<Record<keyof DataSource, ReturnType<typeof vi.fn>>>

  /** 辅助：构建一个完整的 StockItem 对象引用 */
  function makeItem(overrides: Partial<StockItem> = {}): StockItem {
    const item = new StockItem()
    Object.assign(item, {
      id: 'item-001',
      name: '可乐 330ml',
      sku: 'COLA-330ML',
      category: '饮品',
      quantity: 100,
      price: 3.50,
      status: StockItemStatus.ACTIVE,
      storeId: 'store-001',
      createdAt: new Date('2026-01-01'),
      updatedAt: new Date('2026-01-01'),
      ...overrides,
    })
    return item
  }

  /** 辅助：构建一个完整的 StockTransaction 对象 */
  function makeTxn(overrides: Partial<StockTransaction> = {}): StockTransaction {
    const txn = new StockTransaction()
    Object.assign(txn, {
      id: 'txn-001',
      stockItemId: 'item-001',
      type: StockTransactionType.IN,
      quantity: 50,
      reason: '补货入库',
      operatorId: 'op-001',
      storeId: 'store-001',
      createdAt: new Date('2026-01-01'),
      ...overrides,
    })
    return txn
  }

  beforeEach(async () => {
    // 初始化所有 mock 函数
    mockStockItemRepo = {
      create: vi.fn(),
      save: vi.fn(),
      findOne: vi.fn(),
      find: vi.fn(),
      update: vi.fn(),
    }
    mockStockTxnRepo = {
      create: vi.fn(),
      save: vi.fn(),
      find: vi.fn(),
    }
    mockDataSource = {
      transaction: vi.fn(),
    }

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StockService,
        { provide: getRepositoryToken(StockItem), useValue: mockStockItemRepo },
        { provide: getRepositoryToken(StockTransaction), useValue: mockStockTxnRepo },
        { provide: DataSource, useValue: mockDataSource },
      ],
    }).compile()

    service = module.get<StockService>(StockService)
  })

  // ───────────────────────────────────────────────
  // createItem
  // ───────────────────────────────────────────────

  describe('createItem', () => {
    it('should create a valid stock item successfully', async () => {
      const dto = {
        name: '可乐 330ml',
        sku: 'COLA-330ML',
        storeId: 'store-001',
        price: 3.50,
        quantity: 100,
      }
      const saved = makeItem(dto)
      mockStockItemRepo.create!.mockReturnValue(saved)
      mockStockItemRepo.save!.mockResolvedValue(saved)

      const result = await service.createItem(dto)
      expect(result.id).toBe('item-001')
      expect(result.name).toBe('可乐 330ml')
      expect(result.price).toBe(3.50)
      expect(result.status).toBe(StockItemStatus.ACTIVE)
    })

    it('should trim name and sku', async () => {
      const dto = {
        name: '  雪碧  ',
        sku: '  SPRITE  ',
        storeId: 'store-001',
      }
      const saved = makeItem({ name: '雪碧', sku: 'SPRITE' })
      mockStockItemRepo.create!.mockReturnValue(saved)
      mockStockItemRepo.save!.mockResolvedValue(saved)

      const result = await service.createItem(dto)
      expect(result.name).toBe('雪碧')
      expect(result.sku).toBe('SPRITE')
    })

    it('should throw BadRequestException when name is empty', async () => {
      await expect(service.createItem({ name: '', sku: 'S1', storeId: 's1' }))
        .rejects.toThrow(BadRequestException)
      await expect(service.createItem({ name: '   ', sku: 'S1', storeId: 's1' }))
        .rejects.toThrow(BadRequestException)
    })

    it('should throw BadRequestException when sku is empty', async () => {
      await expect(service.createItem({ name: 'N', sku: '', storeId: 's1' }))
        .rejects.toThrow(BadRequestException)
    })

    it('should throw BadRequestException when storeId is empty', async () => {
      await expect(service.createItem({ name: 'N', sku: 'S1', storeId: '' }))
        .rejects.toThrow(BadRequestException)
    })

    it('should throw BadRequestException when price <= 0', async () => {
      await expect(service.createItem({ name: 'N', sku: 'S1', storeId: 's1', price: -1 }))
        .rejects.toThrow(BadRequestException)
      await expect(service.createItem({ name: 'N', sku: 'S1', storeId: 's1', price: 0 }))
        .rejects.toThrow(BadRequestException)
    })

    it('should default quantity to 0 when not provided', async () => {
      mockStockItemRepo.create!.mockReturnValue(makeItem({ quantity: 0 }))
      mockStockItemRepo.save!.mockResolvedValue(makeItem({ quantity: 0 }))

      const result = await service.createItem({ name: 'N', sku: 'S1', storeId: 's1' })
      expect(result.quantity).toBe(0)
    })
  })

  // ───────────────────────────────────────────────
  // updateItem
  // ───────────────────────────────────────────────

  describe('updateItem', () => {
    it('should update fields successfully', async () => {
      const item = makeItem()
      mockStockItemRepo.findOne!.mockResolvedValue(item)
      mockStockItemRepo.save!.mockResolvedValue({ ...item, name: '雪碧', price: 5 })

      const result = await service.updateItem('item-001', { name: '雪碧', price: 5 })
      expect(result.name).toBe('雪碧')
      expect(result.price).toBe(5)
    })

    it('should throw NotFoundException when item does not exist', async () => {
      mockStockItemRepo.findOne!.mockResolvedValue(null)
      await expect(service.updateItem('nonexistent', { name: 'N' }))
        .rejects.toThrow(NotFoundException)
    })

    it('should throw BadRequestException when name is set to empty', async () => {
      mockStockItemRepo.findOne!.mockResolvedValue(makeItem())
      await expect(service.updateItem('item-001', { name: '' }))
        .rejects.toThrow(BadRequestException)
    })

    it('should throw BadRequestException when sku is set to empty', async () => {
      mockStockItemRepo.findOne!.mockResolvedValue(makeItem())
      await expect(service.updateItem('item-001', { sku: '' }))
        .rejects.toThrow(BadRequestException)
    })

    it('should throw BadRequestException when price is set to <= 0', async () => {
      mockStockItemRepo.findOne!.mockResolvedValue(makeItem())
      await expect(service.updateItem('item-001', { price: -5 }))
        .rejects.toThrow(BadRequestException)
    })

    it('should allow category to be cleared to null', async () => {
      const item = makeItem({ category: '饮品' })
      mockStockItemRepo.findOne!.mockResolvedValue(item)
      const updated = { ...item, category: null }
      mockStockItemRepo.save!.mockResolvedValue(updated)

      const result = await service.updateItem('item-001', { category: '' })
      expect(result.category).toBeNull()
    })

    it('should allow updating status', async () => {
      const item = makeItem()
      mockStockItemRepo.findOne!.mockResolvedValue(item)
      const updated = { ...item, status: StockItemStatus.DISCONTINUED }
      mockStockItemRepo.save!.mockResolvedValue(updated)

      const result = await service.updateItem('item-001', { status: StockItemStatus.DISCONTINUED })
      expect(result.status).toBe(StockItemStatus.DISCONTINUED)
    })
  })

  // ───────────────────────────────────────────────
  // findItem
  // ───────────────────────────────────────────────

  describe('findItem', () => {
    it('should return item when found', async () => {
      const item = makeItem()
      mockStockItemRepo.findOne!.mockResolvedValue(item)

      const result = await service.findItem('item-001')
      expect(result.id).toBe('item-001')
      expect(result.name).toBe('可乐 330ml')
    })

    it('should throw NotFoundException when item not found', async () => {
      mockStockItemRepo.findOne!.mockResolvedValue(null)
      await expect(service.findItem('nonexistent'))
        .rejects.toThrow(NotFoundException)
    })
  })

  // ───────────────────────────────────────────────
  // listItems
  // ───────────────────────────────────────────────

  describe('listItems', () => {
    it('should list items for a store without category filter', async () => {
      const items = [makeItem({ id: 'i1' }), makeItem({ id: 'i2' })]
      mockStockItemRepo.find!.mockResolvedValue(items)

      const result = await service.listItems('store-001')
      expect(result).toHaveLength(2)
      expect(mockStockItemRepo.find).toHaveBeenCalledWith(
        expect.objectContaining({ where: { storeId: 'store-001' } }),
      )
    })

    it('should filter by category when provided', async () => {
      mockStockItemRepo.find!.mockResolvedValue([makeItem()])

      await service.listItems('store-001', '饮品')
      expect(mockStockItemRepo.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { storeId: 'store-001', category: '饮品' },
        }),
      )
    })

    it('should return empty array when no items match', async () => {
      mockStockItemRepo.find!.mockResolvedValue([])
      const result = await service.listItems('store-empty')
      expect(result).toEqual([])
    })
  })

  // ───────────────────────────────────────────────
  // adjustStock
  // ───────────────────────────────────────────────

  describe('adjustStock', () => {
    function setupTransaction(item: StockItem) {
      const mgr = mockManager()
      const qr = makeQueryRunner(mgr)
      // itemRepo mock inside transaction
      const itemRepo = {
        findOne: vi.fn().mockResolvedValue(item),
        update: vi.fn().mockResolvedValue({ affected: 1 }),
      }
      const txnRepo = {
        create: vi.fn().mockReturnValue(makeTxn()),
        save: vi.fn().mockResolvedValue(makeTxn()),
      }
      mgr.getRepository = vi.fn((target: any) => {
        if (target === StockItem) return itemRepo as any
        if (target === StockTransaction) return txnRepo as any
        return {} as any
      })
      mockDataSource.transaction!.mockImplementation(
        (cb: (mgr: EntityManager) => Promise<any>) => cb(mgr),
      )
      return { mgr, itemRepo, txnRepo }
    }

    it('should successfully process IN transaction', async () => {
      const item = makeItem({ quantity: 100 })
      const { itemRepo, txnRepo } = setupTransaction(item)
      // After transaction, return updated item
      const updatedItem = makeItem({ quantity: 150 })
      itemRepo.findOne = vi.fn()
        .mockResolvedValueOnce(item)  // first fetch
        .mockResolvedValueOnce(updatedItem)  // post-update fetch

      const result = await service.adjustStock(
        'item-001', 50, StockTransactionType.IN, '补货', 'op-001',
      )
      expect(result.quantity).toBe(150)
      expect(itemRepo.update).toHaveBeenCalledWith(
        { id: 'item-001', quantity: 100 },
        { quantity: 150 },
      )
      expect(txnRepo.create).toHaveBeenCalled()
    })

    it('should successfully process OUT transaction', async () => {
      const item = makeItem({ quantity: 100 })
      const { itemRepo, txnRepo } = setupTransaction(item)
      const updatedItem = makeItem({ quantity: 70 })
      itemRepo.findOne = vi.fn()
        .mockResolvedValueOnce(item)
        .mockResolvedValueOnce(updatedItem)

      const result = await service.adjustStock(
        'item-001', -30, StockTransactionType.OUT, '销售出库', 'op-001',
      )
      expect(result.quantity).toBe(70)
      expect(txnRepo.create).toHaveBeenCalled()
    })

    it('should throw BadRequestException when quantity is 0', async () => {
      await expect(service.adjustStock(
        'item-001', 0, StockTransactionType.IN, 'noop', 'op-001',
      )).rejects.toThrow(BadRequestException)
    })

    it('should throw BadRequestException when IN has negative quantity', async () => {
      await expect(service.adjustStock(
        'item-001', -10, StockTransactionType.IN, 'wrong', 'op-001',
      )).rejects.toThrow(BadRequestException)
    })

    it('should throw BadRequestException when OUT has positive quantity', async () => {
      await expect(service.adjustStock(
        'item-001', 10, StockTransactionType.OUT, 'wrong', 'op-001',
      )).rejects.toThrow(BadRequestException)
    })

    it('should throw BadRequestException when reason is empty', async () => {
      await expect(service.adjustStock(
        'item-001', 10, StockTransactionType.IN, '', 'op-001',
      )).rejects.toThrow(BadRequestException)
    })

    it('should throw BadRequestException when operatorId is empty', async () => {
      await expect(service.adjustStock(
        'item-001', 10, StockTransactionType.IN, 'reason', '',
      )).rejects.toThrow(BadRequestException)
    })

    it('should throw NotFoundException when item does not exist (inside txn)', async () => {
      const mgr = mockManager()
      const itemRepo = { findOne: vi.fn().mockResolvedValue(null) }
      mgr.getRepository = vi.fn(() => itemRepo as any)
      mockDataSource.transaction!.mockImplementation(
        (cb: (mgr: EntityManager) => Promise<any>) => cb(mgr),
      )

      await expect(service.adjustStock(
        'nonexistent', 10, StockTransactionType.IN, 'reason', 'op-001',
      )).rejects.toThrow(NotFoundException)
    })

    it('should throw BadRequestException when out causes negative stock', async () => {
      const item = makeItem({ quantity: 5 })
      const mgr = mockManager()
      const itemRepo = {
        findOne: vi.fn().mockResolvedValue(item),
        update: vi.fn(),
      }
      mgr.getRepository = vi.fn(() => itemRepo as any)
      mockDataSource.transaction!.mockImplementation(
        (cb: (mgr: EntityManager) => Promise<any>) => cb(mgr),
      )

      await expect(service.adjustStock(
        'item-001', -10, StockTransactionType.OUT, '过量出库', 'op-001',
      )).rejects.toThrow(BadRequestException)
    })

    it('should throw BadRequestException on optimistic lock conflict', async () => {
      const item = makeItem({ quantity: 100 })
      const mgr = mockManager()
      const itemRepo = {
        findOne: vi.fn().mockResolvedValue(item),
        update: vi.fn().mockResolvedValue({ affected: 0 }),
      }
      mgr.getRepository = vi.fn(() => itemRepo as any)
      mockDataSource.transaction!.mockImplementation(
        (cb: (mgr: EntityManager) => Promise<any>) => cb(mgr),
      )

      await expect(service.adjustStock(
        'item-001', 10, StockTransactionType.IN, '并发冲突', 'op-001',
      )).rejects.toThrow(BadRequestException)
    })
  })

  // ───────────────────────────────────────────────
  // getTransactions
  // ───────────────────────────────────────────────

  describe('getTransactions', () => {
    it('should return transactions for existing item', async () => {
      mockStockItemRepo.findOne!.mockResolvedValue(makeItem())
      const txns = [makeTxn(), makeTxn({ id: 'txn-002', quantity: 30 })]
      mockStockTxnRepo.find!.mockResolvedValue(txns)

      const result = await service.getTransactions('item-001')
      expect(result).toHaveLength(2)
    })

    it('should throw NotFoundException when item does not exist', async () => {
      mockStockItemRepo.findOne!.mockResolvedValue(null)
      await expect(service.getTransactions('nonexistent'))
        .rejects.toThrow(NotFoundException)
    })

    it('should return empty array when item has no transactions', async () => {
      mockStockItemRepo.findOne!.mockResolvedValue(makeItem())
      mockStockTxnRepo.find!.mockResolvedValue([])

      const result = await service.getTransactions('item-001')
      expect(result).toEqual([])
    })
  })

  // ───────────────────────────────────────────────
  // getLowStockItems
  // ───────────────────────────────────────────────

  describe('getLowStockItems', () => {
    it('should return items with quantity <= threshold', async () => {
      const items = [makeItem({ id: 'i1', quantity: 3 }), makeItem({ id: 'i2', quantity: 5 })]
      mockStockItemRepo.find!.mockResolvedValue(items)

      const result = await service.getLowStockItems('store-001', 10)
      expect(result).toHaveLength(2)
    })

    it('should throw BadRequestException when storeId is empty', async () => {
      await expect(service.getLowStockItems('', 10))
        .rejects.toThrow(BadRequestException)
    })

    it('should throw BadRequestException when threshold is negative', async () => {
      await expect(service.getLowStockItems('store-001', -1))
        .rejects.toThrow(BadRequestException)
    })

    it('should return empty array when no items are low', async () => {
      mockStockItemRepo.find!.mockResolvedValue([])

      const result = await service.getLowStockItems('store-001', 5)
      expect(result).toEqual([])
    })
  })
})
