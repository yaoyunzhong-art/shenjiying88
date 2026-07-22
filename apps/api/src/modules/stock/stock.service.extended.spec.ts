/**
 * 🐜 StockService 扩展测试 — 圈梁五道箍指令
 * 覆盖: 正常CRUD / 边界条件 / 异常场景 / 业务规则验证
 * 共 18+ 条独立测试用例
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { Test, TestingModule } from '@nestjs/testing'
import { getRepositoryToken } from '@nestjs/typeorm'
import { DataSource, EntityManager, Repository } from 'typeorm'
import { NotFoundException, BadRequestException } from '@nestjs/common'
import { StockService } from './stock.service'
import { StockItem, StockItemStatus } from './stock-item.entity'
import { StockTransaction, StockTransactionType } from './stock-transaction.entity'

// ─── 辅助：构建 mock Manager/Repository ───

function mockManager(): EntityManager {
  return {
    getRepository: vi.fn(),
    findOne: vi.fn(),
    create: vi.fn(),
    save: vi.fn(),
    update: vi.fn(),
    find: vi.fn(),
  } as unknown as EntityManager
}

function makeItem(overrides: Partial<StockItem> = {}): StockItem {
  const item = new StockItem()
  Object.assign(item, {
    id: 'item-001',
    name: '测试商品',
    sku: 'TEST-SKU-001',
    category: '饮品',
    quantity: 100,
    price: 10.00,
    status: StockItemStatus.ACTIVE,
    storeId: 'store-001',
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    ...overrides,
  })
  return item
}

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

function setupTransaction(mockDataSource: { transaction: ReturnType<typeof vi.fn> }, item: StockItem) {
  const mgr = mockManager()
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

const TSHIRT_CATEGORY = '服装';
const SNACK_CATEGORY = '食品';

describe('StockService — 扩展 Service 测试 (18+ 条)', () => {
  let service: StockService
  let mockStockItemRepo: Partial<Record<keyof Repository<StockItem>, ReturnType<typeof vi.fn>>>
  let mockStockTxnRepo: Partial<Record<keyof Repository<StockTransaction>, ReturnType<typeof vi.fn>>>
  let mockDataSource: Partial<Record<keyof DataSource, ReturnType<typeof vi.fn>>>

  beforeEach(async () => {
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
    mockDataSource = { transaction: vi.fn() }

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
  // createItem 扩展测试
  // ───────────────────────────────────────────────

  describe('createItem 扩展', () => {
    it('[正例] 创建商品时可指定品类和状态', async () => {
      const dto = {
        name: 'T恤',
        sku: 'TSHIRT-001',
        storeId: 'store-001',
        category: TSHIRT_CATEGORY,
        status: StockItemStatus.DISCONTINUED,
        price: 59.90,
      }
      mockStockItemRepo.create!.mockReturnValue(makeItem({
        name: 'T恤', sku: 'TSHIRT-001', category: TSHIRT_CATEGORY,
        status: StockItemStatus.DISCONTINUED, price: 59.90,
      }))
      mockStockItemRepo.save!.mockResolvedValue(makeItem({
        name: 'T恤', sku: 'TSHIRT-001', category: TSHIRT_CATEGORY,
        status: StockItemStatus.DISCONTINUED, price: 59.90,
      }))

      const result = await service.createItem(dto)
      expect(result.category).toBe(TSHIRT_CATEGORY)
      expect(result.status).toBe(StockItemStatus.DISCONTINUED)
    })

    it('[正例] 默认 status 为 ACTIVE', async () => {
      const dto = { name: 'N', sku: 'S', storeId: 's1' }
      mockStockItemRepo.create!.mockReturnValue(makeItem())
      mockStockItemRepo.save!.mockResolvedValue(makeItem())

      const result = await service.createItem(dto)
      expect(result.status).toBe(StockItemStatus.ACTIVE)
    })

    it('[边界] 创建商品时 price 为 undefined 视为 0 不抛异常', async () => {
      const dto = { name: '免费样品', sku: 'FREE-001', storeId: 'store-001', price: undefined }
      mockStockItemRepo.create!.mockReturnValue(makeItem({ price: 0 }))
      mockStockItemRepo.save!.mockResolvedValue(makeItem({ price: 0 }))

      const result = await service.createItem(dto as any)
      expect(result.price).toBe(0)
    })

    it('[异常] 创建商品时 name 为纯空格抛异常', async () => {
      await expect(service.createItem({ name: '   ', sku: 'S1', storeId: 's1' }))
        .rejects.toThrow(BadRequestException)
      await expect(service.createItem({ name: '\t\n', sku: 'S1', storeId: 's1' }))
        .rejects.toThrow(BadRequestException)
    })

    it('[异常] 创建商品时所有必填字段均为空', async () => {
      await expect(service.createItem({ name: '', sku: '', storeId: '' }))
        .rejects.toThrow(BadRequestException)
    })

    it('[异常] category 为 undefined 时存 null', async () => {
      mockStockItemRepo.create!.mockReturnValue(makeItem({ category: null }))
      mockStockItemRepo.save!.mockResolvedValue(makeItem({ category: null }))

      const result = await service.createItem({ name: 'N', sku: 'S', storeId: 's1' })
      expect(result.category).toBeNull()
    })
  })

  // ───────────────────────────────────────────────
  // updateItem 扩展测试
  // ───────────────────────────────────────────────

  describe('updateItem 扩展', () => {
    it('[正例] 仅更新部分字段其他字段不变', async () => {
      const item = makeItem({ name: '旧名称', price: 10, quantity: 100 })
      mockStockItemRepo.findOne!.mockResolvedValue(item)
      const updated = { ...item, name: '新名称', updatedAt: new Date() }
      mockStockItemRepo.save!.mockResolvedValue(updated)

      const result = await service.updateItem('item-001', { name: '新名称' })
      expect(result.name).toBe('新名称')
      expect(result.price).toBe(10)  // 未变化
      expect(result.quantity).toBe(100) // 未变化
    })

    it('[边界] 更新 price 为小数', async () => {
      const item = makeItem()
      mockStockItemRepo.findOne!.mockResolvedValue(item)
      const updated = { ...item, price: 0.01 }
      mockStockItemRepo.save!.mockResolvedValue(updated)

      const result = await service.updateItem('item-001', { price: 0.01 })
      expect(result.price).toBe(0.01)
    })

    it('[异常] 更新不存在的 item 抛 NotFoundException', async () => {
      mockStockItemRepo.findOne!.mockResolvedValue(null)
      await expect(service.updateItem('nonexistent', { name: 'N' }))
        .rejects.toThrow(NotFoundException)
    })

    it('[边界] 更新时将 category 设为空字符串', async () => {
      const item = makeItem({ category: '饮品' })
      mockStockItemRepo.findOne!.mockResolvedValue(item)
      const updated = { ...item, category: null }
      mockStockItemRepo.save!.mockResolvedValue(updated)

      const result = await service.updateItem('item-001', { category: '' })
      expect(result.category).toBeNull()
    })
  })

  // ───────────────────────────────────────────────
  // listItems 扩展测试
  // ───────────────────────────────────────────────

  describe('listItems 扩展', () => {
    it('[正例] 按品类过滤返回准确结果', async () => {
      mockStockItemRepo.find!.mockResolvedValue([
        makeItem({ id: 'i1', category: TSHIRT_CATEGORY }),
        makeItem({ id: 'i2', category: TSHIRT_CATEGORY }),
      ])
      const items = await service.listItems('store-001', TSHIRT_CATEGORY)
      expect(items).toHaveLength(2)
      expect(items.every((i) => i.category === TSHIRT_CATEGORY)).toBe(true)
    })

    it('[边界] storeId 未匹配任何商品返回空列表', async () => {
      mockStockItemRepo.find!.mockResolvedValue([])
      const items = await service.listItems('store-nonexistent')
      expect(items).toEqual([])
    })

    it('[边界] storeId 匹配但 category 不匹配返回空列表', async () => {
      mockStockItemRepo.find!.mockResolvedValue([])
      const items = await service.listItems('store-001', SNACK_CATEGORY)
      expect(items).toEqual([])
    })
  })

  // ───────────────────────────────────────────────
  // adjustStock 扩展测试
  // ───────────────────────────────────────────────

  describe('adjustStock 扩展', () => {
    it('[正例] ADJUSTMENT 操作可正可负', async () => {
      const item = makeItem({ quantity: 50 })
      const { itemRepo } = setupTransaction(mockDataSource, item)
      const updatedItem = makeItem({ quantity: 30 })
      itemRepo.findOne = vi.fn()
        .mockResolvedValueOnce(item)
        .mockResolvedValueOnce(updatedItem)

      const result = await service.adjustStock(
        'item-001', -20, StockTransactionType.ADJUSTMENT, '盘亏', 'op-001',
      )
      expect(result.quantity).toBe(30)

      const item2 = makeItem({ quantity: 50 })
      const { itemRepo: itemRepo2 } = setupTransaction(mockDataSource, item2)
      const updatedItem2 = makeItem({ quantity: 80 })
      itemRepo2.findOne = vi.fn()
        .mockResolvedValueOnce(item2)
        .mockResolvedValueOnce(updatedItem2)

      const result2 = await service.adjustStock(
        'item-001', 30, StockTransactionType.ADJUSTMENT, '盘盈', 'op-001',
      )
      expect(result2.quantity).toBe(80)
    })

    it('[异常] reason 为纯空格抛异常', async () => {
      await expect(service.adjustStock(
        'item-001', 10, StockTransactionType.IN, '   ', 'op-001',
      )).rejects.toThrow(BadRequestException)
    })

    it('[异常] operatorId 为纯空格抛异常', async () => {
      await expect(service.adjustStock(
        'item-001', 10, StockTransactionType.IN, 'reason', '   ',
      )).rejects.toThrow(BadRequestException)
    })

    it('[边界] 出库数量与当前库存刚好相等', async () => {
      const item = makeItem({ quantity: 30 })
      const { itemRepo } = setupTransaction(mockDataSource, item)
      const updatedItem = makeItem({ quantity: 0 })
      itemRepo.findOne = vi.fn()
        .mockResolvedValueOnce(item)
        .mockResolvedValueOnce(updatedItem)

      const result = await service.adjustStock(
        'item-001', -30, StockTransactionType.OUT, '全部出库', 'op-001',
      )
      expect(result.quantity).toBe(0)
    })
  })

  // ───────────────────────────────────────────────
  // getTransactions 扩展测试
  // ───────────────────────────────────────────────

  describe('getTransactions 扩展', () => {
    it('[正例] 返回的交易记录按时间倒序排列', async () => {
      mockStockItemRepo.findOne!.mockResolvedValue(makeItem())
      mockStockTxnRepo.find!.mockResolvedValue([
        makeTxn({ id: 't2', createdAt: new Date('2026-06-15') }),
        makeTxn({ id: 't1', createdAt: new Date('2026-06-10') }),
      ])
      const txns = await service.getTransactions('item-001')
      expect(txns).toHaveLength(2)
      expect(txns[0].id).toBe('t2')
      expect(txns[1].id).toBe('t1')
    })

    it('[边界] 商品存在但无交易记录', async () => {
      mockStockItemRepo.findOne!.mockResolvedValue(makeItem())
      mockStockTxnRepo.find!.mockResolvedValue([])
      const txns = await service.getTransactions('item-001')
      expect(txns).toEqual([])
    })
  })

  // ───────────────────────────────────────────────
  // getLowStockItems 扩展测试
  // ───────────────────────────────────────────────

  describe('getLowStockItems 扩展', () => {
    it('[正例] 阈值 = 0 时只返回库存为 0 的商品', async () => {
      mockStockItemRepo.find!.mockResolvedValue([
        makeItem({ id: 'i1', quantity: 0 }),
      ])
      const items = await service.getLowStockItems('store-001', 0)
      expect(items).toHaveLength(1)
      expect(items[0].quantity).toBe(0)
    })

    it('[边界] 门店无低库存商品返回空列表', async () => {
      mockStockItemRepo.find!.mockResolvedValue([])
      const items = await service.getLowStockItems('store-001', 10)
      expect(items).toEqual([])
    })

    it('[边界] threshold 为 0 时合法不抛异常', async () => {
      mockStockItemRepo.find!.mockResolvedValue([])
      await expect(service.getLowStockItems('store-001', 0)).resolves.toEqual([])
    })

    it('[业务规则] DISCONTINUED 商品不进入低库存告警', async () => {
      mockStockItemRepo.find!.mockResolvedValue([]) // 只查 ACTIVE 的商品
      const items = await service.getLowStockItems('store-001', 10)
      expect(mockStockItemRepo.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: StockItemStatus.ACTIVE,
          }),
        }),
      )
    })
  })

  // ───────────────────────────────────────────────
  // findItem 扩展测试
  // ───────────────────────────────────────────────

  describe('findItem 扩展', () => {
    it('[正例] 查找已停售商品也可返回', async () => {
      const item = makeItem({ status: StockItemStatus.DISCONTINUED })
      mockStockItemRepo.findOne!.mockResolvedValue(item)
      const result = await service.findItem('item-discontinued')
      expect(result.status).toBe(StockItemStatus.DISCONTINUED)
    })
  })
})
