/**
 * stock.service.boost.test.ts - StockService 增强测试 (B路)
 *
 * 由于 StockService 使用 TypeORM Repository + DataSource，
 * 这里 mock 所有依赖：
 *
 * 覆盖：createItem（校验 name/sku/storeId 为空、price<=0）、
 * updateItem（正常更新、空name、不存在）、findItem（正常/不存在）、
 * listItems（按门店查询）、adjustStock（IN/OUT/ADJUSTMENT/库存不足/操作冲突）、
 * getTransactions、getLowStockItems
 *
 * 总计: 15+ test cases
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { StockService } from './stock.service'
import { StockItem, StockItemStatus } from './stock-item.entity'
import { StockTransaction, StockTransactionType } from './stock-transaction.entity'
import { NotFoundException, BadRequestException } from '@nestjs/common'
import { LessThanOrEqual } from 'typeorm'

// ─── Mock Repository ──────────────────────────────

function createMockRepo<T extends Record<string, any>>(initialData: T[] = []) {
  const store = new Map<string, T>()
  for (const item of initialData) {
    store.set((item as any).id, item)
  }

  return {
    // TypeORM Repository methods used by StockService
    create: vi.fn((dto: Partial<T>): any => {
      const now = new Date()
      return {
        ...dto,
        id: `mock-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        createdAt: now,
        updatedAt: now,
      } as any
    }),
    save: vi.fn((entity: any): any => {
      store.set(entity.id, entity)
      return entity
    }),
    findOne: vi.fn(({ where }: any) => {
      for (const item of store.values()) {
        if (Object.entries(where).every(([k, v]) => (item as any)[k] === v)) {
          return item
        }
      }
      return null
    }),
    find: vi.fn(({ where, order }: any) => {
      let results = Array.from(store.values())
      if (where) {
        for (const [k, v] of Object.entries(where)) {
          if (v !== null && v !== undefined && typeof v === 'object' && !Array.isArray(v)) {
            // Handle TypeORM FindOperator (e.g. LessThanOrEqual)
            // This mock checks for common operator shapes
            if ('_value' in v && v._value !== undefined) {
              results = results.filter((item: any) => item[k] <= v._value)
            }
          } else {
            results = results.filter((item: any) => item[k] === v)
          }
        }
      }
      if (order) {
        const [field, dir] = Object.entries(order)[0]
        results.sort((a: any, b: any) => {
          const cmp = String(a[field]).localeCompare(String(b[field]))
          return dir === 'DESC' ? -cmp : cmp
        })
      }
      return results
    }),
    update: vi.fn((criteria: any, updates: any) => {
      const id = typeof criteria === 'string' ? criteria : criteria.id
      const item = store.get(id)
      if (item) {
        const matches = Object.entries(
          typeof criteria === 'string' ? {} : criteria,
        ).every(([k, v]) => (item as any)[k] === v)
        if (matches) {
          Object.assign(item, updates)
          return { affected: 1, generatedMaps: [] }
        }
      }
      return { affected: 0, generatedMaps: [] }
    }),
    // expose for tests
    _store: store,
    _clear: () => store.clear(),
  }
}

function createMockTransactionRepo() {
  const txns: any[] = []
  return {
    create: vi.fn((dto: any) => dto),
    save: vi.fn((entity: any) => {
      txns.push(entity)
      return entity
    }),
    find: vi.fn(({ where, order }: any) => {
      let results = [...txns]
      if (where) {
        for (const [k, v] of Object.entries(where)) {
          results = results.filter((t: any) => t[k] === v)
        }
      }
      if (order) {
        const [field, dir] = Object.entries(order)[0]
        results.sort((a: any, b: any) => {
          const cmp = String(a[field]).localeCompare(String(b[field]))
          return dir === 'DESC' ? -cmp : cmp
        })
      }
      return results
    }),
    _clear: () => txns.length = 0,
  }
}

function createMockDataSource(mockItemRepo: ReturnType<typeof createMockRepo<StockItem>>) {
  return {
    transaction: vi.fn(async (fn: (manager: any) => any) => {
      const manager = {
        getRepository: vi.fn((entity: any) => {
          if (entity === StockItem) return mockItemRepo
          if (entity === StockTransaction) return mockTransactionRepo
          return {}
        }),
      }
      return fn(manager)
    }),
  }
}

// Shared mock repos
let mockItemRepo: ReturnType<typeof createMockRepo<StockItem>>
let mockTransactionRepo: ReturnType<typeof createMockTransactionRepo>
let mockDataSource: ReturnType<typeof createMockDataSource>

function createService(): StockService {
  // Reset
  mockItemRepo = createMockRepo<StockItem>()
  mockTransactionRepo = createMockTransactionRepo()
  mockDataSource = createMockDataSource(mockItemRepo)

  return new StockService(
    mockItemRepo as any,
    mockTransactionRepo as any,
    mockDataSource as any,
  )
}

// ─── Helper ───────────────────────────────────────

function makeItemData(overrides?: Partial<StockItem>): Partial<StockItem> {
  return {
    name: overrides?.name ?? '测试商品',
    sku: overrides?.sku ?? 'TEST-SKU-001',
    storeId: overrides?.storeId ?? 'store-001',
    category: overrides?.category ?? '饮品',
    quantity: overrides?.quantity ?? 100,
    price: overrides?.price ?? 15.5,
    status: overrides?.status ?? StockItemStatus.ACTIVE,
    ...overrides,
  }
}

/** 在 mock item repo 中预置一条数据 */
function seedItem(data: Partial<StockItem> = {}): StockItem {
  const now = new Date()
  const item: StockItem = {
    id: `seed-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    name: '种子商品',
    sku: 'SEED-SKU',
    storeId: 'store-001',
    category: '食品',
    quantity: 50,
    price: 10,
    status: StockItemStatus.ACTIVE,
    createdAt: now,
    updatedAt: now,
    ...data,
  } as StockItem
  mockItemRepo._store.set(item.id, item)
  return item
}

describe('StockService Boost Tests', () => {
  let svc: StockService

  beforeEach(() => {
    svc = createService()
  })

  // ─── 1. createItem ───────────────────────────────

  describe('createItem - 创建库存项', () => {
    it('正常创建成功，返回完整库存项', async () => {
      const item = await svc.createItem(makeItemData())
      expect(item.id).toBeTruthy()
      expect(item.name).toBe('测试商品')
      expect(item.sku).toBe('TEST-SKU-001')
      expect(item.storeId).toBe('store-001')
      expect(item.price).toBe(15.5)
      expect(item.quantity).toBe(100)
      expect(item.status).toBe(StockItemStatus.ACTIVE)
    })

    it('name 为空时抛 BadRequest', async () => {
      await expect(svc.createItem(makeItemData({ name: '' }))).rejects.toThrow(BadRequestException)
      await expect(svc.createItem(makeItemData({ name: '   ' }))).rejects.toThrow(BadRequestException)
      await expect(svc.createItem(makeItemData({ name: undefined as any }))).rejects.toThrow(BadRequestException)
    })

    it('sku 为空时抛 BadRequest', async () => {
      await expect(svc.createItem(makeItemData({ sku: '' }))).rejects.toThrow(BadRequestException)
      await expect(svc.createItem(makeItemData({ sku: undefined as any }))).rejects.toThrow(BadRequestException)
    })

    it('storeId 为空时抛 BadRequest', async () => {
      await expect(svc.createItem(makeItemData({ storeId: '' }))).rejects.toThrow(BadRequestException)
      await expect(svc.createItem(makeItemData({ storeId: undefined as any }))).rejects.toThrow(BadRequestException)
    })

    it('price <= 0 时抛 BadRequest', async () => {
      await expect(svc.createItem(makeItemData({ price: 0 }))).rejects.toThrow(BadRequestException)
      await expect(svc.createItem(makeItemData({ price: -1 }))).rejects.toThrow(BadRequestException)
    })

    it('name/sku/storeId 自动 trim', async () => {
      const item = await svc.createItem(makeItemData({
        name: '  带空格商品  ',
        sku: '  SKU-TRIM  ',
        storeId: '  store-002  ',
      }))
      expect(item.name).toBe('带空格商品')
      expect(item.sku).toBe('SKU-TRIM')
      expect(item.storeId).toBe('store-002')
    })

    it('未传入 quantity 默认 0', async () => {
      const item = await svc.createItem(makeItemData({ quantity: undefined as any }))
      expect(item.quantity).toBe(0)
    })
  })

  // ─── 2. updateItem ───────────────────────────────

  describe('updateItem - 更新库存项', () => {
    it('正常更新字段', async () => {
      const seed = seedItem()
      const updated = await svc.updateItem(seed.id, { name: '新名称', price: 25 })
      expect(updated.name).toBe('新名称')
      expect(updated.price).toBe(25)
    })

    it('更新 name 为空字符串抛 BadRequest', async () => {
      const seed = seedItem()
      await expect(svc.updateItem(seed.id, { name: '' })).rejects.toThrow(BadRequestException)
      await expect(svc.updateItem(seed.id, { name: '   ' })).rejects.toThrow(BadRequestException)
    })

    it('更新不存在的 id 抛 NotFoundException', async () => {
      await expect(svc.updateItem('non-existent', { name: '新名称' })).rejects.toThrow(NotFoundException)
    })

    it('更新 sku 为空字符串抛 BadRequest', async () => {
      const seed = seedItem()
      await expect(svc.updateItem(seed.id, { sku: '' })).rejects.toThrow(BadRequestException)
    })

    it('更新 price <= 0 抛 BadRequest', async () => {
      const seed = seedItem()
      await expect(svc.updateItem(seed.id, { price: -5 })).rejects.toThrow(BadRequestException)
      await expect(svc.updateItem(seed.id, { price: 0 })).rejects.toThrow(BadRequestException)
    })

    it('更新 status 为 DISCONTINUED', async () => {
      const seed = seedItem()
      const updated = await svc.updateItem(seed.id, { status: StockItemStatus.DISCONTINUED })
      expect(updated.status).toBe(StockItemStatus.DISCONTINUED)
    })
  })

  // ─── 3. findItem ───────────────────────────────

  describe('findItem - 查找库存项', () => {
    it('正常找到存在的库存项', async () => {
      const seed = seedItem({ name: '查找测试' })
      const found = await svc.findItem(seed.id)
      expect(found.id).toBe(seed.id)
      expect(found.name).toBe('查找测试')
    })

    it('不存在的 id 抛 NotFoundException', async () => {
      await expect(svc.findItem('non-existent')).rejects.toThrow(NotFoundException)
    })
  })

  // ─── 4. listItems ───────────────────────────────

  describe('listItems - 列表查询', () => {
    it('按门店查询返回该门店所有商品', async () => {
      seedItem({ storeId: 'store-A', name: 'A店商品' })
      seedItem({ storeId: 'store-B', name: 'B店商品' })
      const items = await svc.listItems('store-A')
      expect(items.every(i => i.storeId === 'store-A')).toBe(true)
      expect(items.length).toBeGreaterThanOrEqual(1)
    })

    it('按门店 + 品类筛选', async () => {
      seedItem({ storeId: 'store-A', category: '饮品', name: '可乐' })
      seedItem({ storeId: 'store-A', category: '食品', name: '饼干' })
      const result = await svc.listItems('store-A', '饮品')
      expect(result.every(i => i.category === '饮品')).toBe(true)
    })

    it('不存在的门店返回空数组', async () => {
      const result = await svc.listItems('non-existent-store')
      expect(result).toEqual([])
    })
  })

  // ─── 5. adjustStock ─────────────────────────────

  describe('adjustStock - 出入库操作', () => {
    it('入库 IN 增加库存', async () => {
      const seed = seedItem({ quantity: 50 })
      const updated = await svc.adjustStock(seed.id, 30, StockTransactionType.IN, '补货', 'user-001')
      expect(updated.quantity).toBe(80)
    })

    it('出库 OUT 减少库存', async () => {
      const seed = seedItem({ quantity: 50 })
      const updated = await svc.adjustStock(seed.id, -20, StockTransactionType.OUT, '销售出库', 'user-001')
      expect(updated.quantity).toBe(30)
    })

    it('ADJUSTMENT 正向调整', async () => {
      const seed = seedItem({ quantity: 10 })
      const updated = await svc.adjustStock(seed.id, 5, StockTransactionType.ADJUSTMENT, '盘盈调整', 'user-001')
      expect(updated.quantity).toBe(15)
    })

    it('ADJUSTMENT 负向调整', async () => {
      const seed = seedItem({ quantity: 10 })
      const updated = await svc.adjustStock(seed.id, -3, StockTransactionType.ADJUSTMENT, '盘亏调整', 'user-001')
      expect(updated.quantity).toBe(7)
    })

    it('出库库存不足抛 BadRequest', async () => {
      const seed = seedItem({ quantity: 5 })
      await expect(
        svc.adjustStock(seed.id, -10, StockTransactionType.OUT, '出库', 'user-001'),
      ).rejects.toThrow(BadRequestException)
    })

    it('入库使用负数抛 BadRequest', async () => {
      const seed = seedItem()
      await expect(
        svc.adjustStock(seed.id, -10, StockTransactionType.IN, '入库', 'user-001'),
      ).rejects.toThrow(BadRequestException)
    })

    it('出库使用正数抛 BadRequest', async () => {
      const seed = seedItem()
      await expect(
        svc.adjustStock(seed.id, 10, StockTransactionType.OUT, '出库', 'user-001'),
      ).rejects.toThrow(BadRequestException)
    })

    it('数量为 0 抛 BadRequest', async () => {
      const seed = seedItem()
      await expect(
        svc.adjustStock(seed.id, 0, StockTransactionType.IN, '零操作', 'user-001'),
      ).rejects.toThrow(BadRequestException)
    })

    it('不存在的商品抛 NotFoundException', async () => {
      await expect(
        svc.adjustStock('non-existent', 10, StockTransactionType.IN, '补货', 'user-001'),
      ).rejects.toThrow(NotFoundException)
    })

    it('空 reason 抛 BadRequest', async () => {
      const seed = seedItem()
      await expect(
        svc.adjustStock(seed.id, 10, StockTransactionType.IN, '', 'user-001'),
      ).rejects.toThrow(BadRequestException)
    })

    it('空 operatorId 抛 BadRequest', async () => {
      const seed = seedItem()
      await expect(
        svc.adjustStock(seed.id, 10, StockTransactionType.IN, '补货', ''),
      ).rejects.toThrow(BadRequestException)
    })
  })

  // ─── 6. getTransactions ─────────────────────────

  describe('getTransactions - 交易记录', () => {
    it('不存在的商品抛 NotFoundException', async () => {
      await expect(svc.getTransactions('non-existent')).rejects.toThrow(NotFoundException)
    })

    it('存在的商品返回空列表（无交易）', async () => {
      const seed = seedItem()
      const txns = await svc.getTransactions(seed.id)
      expect(txns).toEqual([])
    })
  })

  // ─── 7. getLowStockItems ─────────────────────

  describe('getLowStockItems - 库存告警', () => {
    it('空 storeId 抛 BadRequest', async () => {
      await expect(svc.getLowStockItems('', 10)).rejects.toThrow(BadRequestException)
    })

    it('负阈值抛 BadRequest', async () => {
      await expect(svc.getLowStockItems('store-001', -1)).rejects.toThrow(BadRequestException)
    })

    it('返回库存低于阈值的活跃商品', async () => {
      seedItem({ storeId: 'store-A', quantity: 3, name: '低库存商品' })
      seedItem({ storeId: 'store-A', quantity: 15, name: '充足商品' })
      seedItem({ storeId: 'store-A', quantity: 5, name: '刚好阈值商品' })
      const lowStock = await svc.getLowStockItems('store-A', 5)
      expect(lowStock.every(i => i.quantity <= 5)).toBe(true)
      expect(lowStock.some(i => i.name === '低库存商品')).toBe(true)
      // 刚好阈值的也算
      expect(lowStock.some(i => i.name === '刚好阈值商品')).toBe(true)
    })
  })
})
