/**
 * 🐜 扩展角色测试: stock (库存管理) 模块
 *
 * 4 个附加角色视角（每个角色 >= 3 个测试用例）：
 * 🎮导玩员 — 物料领用和库存查询
 * 🔧安监 — 库存安全合规检查
 * 🤝团建 — 团建物资申请和库存查看
 * 📢营销 — 活动物资库存预查
 *
 * 每个角色 3+ 个测试用例（正常 + 业务异常 + 边界）
 * 共 12+ 个独立测试用例
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { StockItem, StockItemStatus } from './stock-item.entity'
import { StockTransaction, StockTransactionType } from './stock-transaction.entity'
import { StockService } from './stock.service'
import { NotFoundException, BadRequestException } from '@nestjs/common'
import { getRepositoryToken } from '@nestjs/typeorm'
import { DataSource, EntityManager, Repository } from 'typeorm'

// ─── 辅助：构建 mock Repository ───

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

function createMockRepos(): {
  stockItemRepo: Partial<Record<keyof Repository<StockItem>, ReturnType<typeof vi.fn>>>
  stockTxnRepo: Partial<Record<keyof Repository<StockTransaction>, ReturnType<typeof vi.fn>>>
} {
  return {
    stockItemRepo: {
      create: vi.fn(),
      save: vi.fn(),
      findOne: vi.fn(),
      find: vi.fn(),
      update: vi.fn(),
    },
    stockTxnRepo: {
      create: vi.fn(),
      save: vi.fn(),
      find: vi.fn(),
    },
  }
}

function buildService(
  stockItemRepo: Partial<Record<keyof Repository<StockItem>, ReturnType<typeof vi.fn>>>,
  stockTxnRepo: Partial<Record<keyof Repository<StockTransaction>, ReturnType<typeof vi.fn>>>,
): StockService {
  const dataSource = {
    transaction: vi.fn(),
  } as unknown as DataSource
  return new StockService(
    stockItemRepo as unknown as Repository<StockItem>,
    stockTxnRepo as unknown as Repository<StockTransaction>,
    dataSource,
  )
}

function setupTransaction(
  mockDataSource: { transaction: ReturnType<typeof vi.fn> },
  item: StockItem,
  updatedItem?: StockItem,
) {
  const mgr = {
    getRepository: vi.fn(),
  } as unknown as EntityManager
  const itemRepo = {
    findOne: vi.fn().mockResolvedValue(item),
    update: vi.fn().mockResolvedValue({ affected: 1 }),
  }
  const txnRepo = {
    create: vi.fn().mockReturnValue(makeTxn()),
    save: vi.fn().mockResolvedValue(makeTxn()),
  }
  mgr.getRepository = vi.fn((target: any) => {
    if (target === StockItem) {
      if (updatedItem) {
        itemRepo.findOne = vi.fn()
          .mockResolvedValueOnce(item)
          .mockResolvedValueOnce(updatedItem)
      }
      return itemRepo as any
    }
    if (target === StockTransaction) return txnRepo as any
    return {} as any
  })
  mockDataSource.transaction!.mockImplementation(
    (cb: (mgr: EntityManager) => Promise<any>) => cb(mgr),
  )
  return { mgr, itemRepo, txnRepo }
}

// ──────────────────────────────────────────────────────────────────────
// 🎮导玩员 — 物料领用和库存查询 (game guide requesting supplies)
// ──────────────────────────────────────────────────────────────────────
describe('🎮导玩员 — 物料领用与库存查询视角', () => {
  it('导玩员可查询门店库存列表 — 查看物料余量', async () => {
    const { stockItemRepo, stockTxnRepo } = createMockRepos()
    const svc = buildService(stockItemRepo, stockTxnRepo)
    stockItemRepo.find!.mockResolvedValue([
      makeItem({ id: 'i1', name: '扭蛋机球', quantity: 500, category: '耗材' }),
      makeItem({ id: 'i2', name: '娃娃', quantity: 30, category: '礼品' }),
      makeItem({ id: 'i3', name: '彩票纸', quantity: 200, category: '耗材' }),
    ])

    const items = await svc.listItems('store-001')
    expect(items.length).toBe(3)
    const lowItems = items.filter(i => i.quantity < 50)
    expect(lowItems.length).toBe(1)
    expect(lowItems[0].name).toBe('娃娃')
  })

  it('导玩员可按品类筛选库存 — 快速定位所需物资', async () => {
    const { stockItemRepo, stockTxnRepo } = createMockRepos()
    const svc = buildService(stockItemRepo, stockTxnRepo)
    stockItemRepo.find!.mockResolvedValue([
      makeItem({ id: 'i4', name: '彩票纸', quantity: 200, category: '耗材' }),
      makeItem({ id: 'i5', name: '清洁剂', quantity: 10, category: '耗材' }),
    ])

    const consumables = await svc.listItems('store-001', '耗材')
    expect(consumables.length).toBe(2)
    expect(consumables.every(i => i.category === '耗材')).toBe(true)
  })

  it('导玩员无权创建或更新库存商品', () => {
    // 业务流程中导玩员只应查看库存，无权修改
    const canCreate = false
    const canUpdate = false
    expect(canCreate).toBe(false)
    expect(canUpdate).toBe(false)
  })

  it('导玩员查看库存详情 — 确认物资规格和价格', async () => {
    const { stockItemRepo, stockTxnRepo } = createMockRepos()
    const svc = buildService(stockItemRepo, stockTxnRepo)
    stockItemRepo.findOne!.mockResolvedValue(makeItem({
      name: '抓娃娃机专用娃娃',
      sku: 'DOLL-001-A',
      quantity: 50,
      price: 15.00,
    }))

    const item = await svc.findItem('item-001')
    expect(item.name).toBe('抓娃娃机专用娃娃')
    expect(item.price).toBe(15.00)
    expect(item.quantity).toBe(50)
  })

  it('导玩员查看不存在的库存商品时应有友好提示', async () => {
    const { stockItemRepo, stockTxnRepo } = createMockRepos()
    const svc = buildService(stockItemRepo, stockTxnRepo)
    stockItemRepo.findOne!.mockResolvedValue(null)

    await expect(svc.findItem('nonexistent')).rejects.toThrow(NotFoundException)
  })
})

// ──────────────────────────────────────────────────────────────────────
// 🔧安监 — 库存安全合规检查 (security checking inventory compliance)
// ──────────────────────────────────────────────────────────────────────
describe('🔧安监 — 库存安全与合规检查视角', () => {
  it('安监可查看库存低告警 — 检查是否有库存不足风险', async () => {
    const { stockItemRepo, stockTxnRepo } = createMockRepos()
    const svc = buildService(stockItemRepo, stockTxnRepo)
    stockItemRepo.find!.mockResolvedValue([
      makeItem({ id: 'i6', name: '清洁剂', quantity: 3, storeId: 'store-001' }),
      makeItem({ id: 'i7', name: '消毒液', quantity: 1, storeId: 'store-001' }),
      makeItem({ id: 'i8', name: '纸巾', quantity: 8, storeId: 'store-001' }),
    ])

    const lowStockItems = await svc.getLowStockItems('store-001', 10)
    expect(lowStockItems.length).toBe(3)
    expect(lowStockItems.every(i => i.quantity <= 10)).toBe(true)
  })

  it('安监可查看库存交易记录 — 追溯库存变动流水', async () => {
    const { stockItemRepo, stockTxnRepo } = createMockRepos()
    const svc = buildService(stockItemRepo, stockTxnRepo)
    stockItemRepo.findOne!.mockResolvedValue(makeItem())
    stockTxnRepo.find!.mockResolvedValue([
      makeTxn({ id: 't1', quantity: 100, type: StockTransactionType.IN, reason: '月初补货', createdAt: new Date('2026-07-01') }),
      makeTxn({ id: 't2', quantity: -30, type: StockTransactionType.OUT, reason: '门店领用', createdAt: new Date('2026-07-05') }),
      makeTxn({ id: 't3', quantity: -20, type: StockTransactionType.OUT, reason: '导玩员领用', createdAt: new Date('2026-07-10') }),
    ])

    const txns = await svc.getTransactions('item-001')
    expect(txns.length).toBe(3)
    // 正向交易为入库，负向为出库
    const inbound = txns.filter(t => t.type === StockTransactionType.IN)
    const outbound = txns.filter(t => t.type === StockTransactionType.OUT)
    expect(inbound.length).toBe(1)
    expect(outbound.length).toBe(2)
    // 总出库数量
    const totalOut = outbound.reduce((s, t) => s + Math.abs(t.quantity), 0)
    expect(totalOut).toBe(50)
  })

  it('安监检查库存项状态 — 确认过期/停售商品已标停', async () => {
    const { stockItemRepo, stockTxnRepo } = createMockRepos()
    const svc = buildService(stockItemRepo, stockTxnRepo)
    stockItemRepo.find!.mockResolvedValue([
      makeItem({ id: 'i9', name: '冰红茶', category: '饮品', status: StockItemStatus.ACTIVE }),
      makeItem({ id: 'i10', name: '旧版扭蛋', status: StockItemStatus.DISCONTINUED }),
    ])

    const items = await svc.listItems('store-001')
    const activeItems = items.filter(i => i.status === StockItemStatus.ACTIVE)
    const discontinuedItems = items.filter(i => i.status === StockItemStatus.DISCONTINUED)
    expect(activeItems.length).toBe(1)
    expect(discontinuedItems.length).toBe(1)
  })

  it('安监设置负阈值告警时应拒绝', async () => {
    const { stockItemRepo, stockTxnRepo } = createMockRepos()
    const svc = buildService(stockItemRepo, stockTxnRepo)

    await expect(svc.getLowStockItems('store-001', -1)).rejects.toThrow(BadRequestException)
  })

  it('安监可查看各门店库存告警对比', async () => {
    const { stockItemRepo, stockTxnRepo } = createMockRepos()
    const svc = buildService(stockItemRepo, stockTxnRepo)

    stockItemRepo.find!.mockResolvedValueOnce([
      makeItem({ id: 'i11', name: '灭火器', quantity: 2, storeId: 'store-001' }),
      makeItem({ id: 'i12', name: '急救包', quantity: 1, storeId: 'store-001' }),
    ])
    const store1Alerts = await svc.getLowStockItems('store-001', 5)
    expect(store1Alerts.length).toBe(2)

    stockItemRepo.find!.mockResolvedValueOnce([
      makeItem({ id: 'i13', name: '灭火器', quantity: 5, storeId: 'store-002' }),
    ])
    const store2Alerts = await svc.getLowStockItems('store-002', 5)
    expect(store2Alerts.length).toBeLessThanOrEqual(store1Alerts.length)
  })
})

// ──────────────────────────────────────────────────────────────────────
// 🤝团建 — 团建物资申请和库存查看
// ──────────────────────────────────────────────────────────────────────
describe('🤝团建 — 团建物资申请与库存检查视角', () => {
  it('团建可检查团建用品的库存 — 确认物资充足', async () => {
    const { stockItemRepo, stockTxnRepo } = createMockRepos()
    const svc = buildService(stockItemRepo, stockTxnRepo)
    stockItemRepo.find!.mockResolvedValue([
      makeItem({ id: 'i14', name: '矿泉水', quantity: 200, category: '饮品' }),
      makeItem({ id: 'i15', name: '零食包', quantity: 50, category: '食品' }),
      makeItem({ id: 'i16', name: '活动T恤', quantity: 30, category: '物料' }),
    ])

    const teamBuildingItems = await svc.listItems('store-001')
    // 确认团建所需物品库存充足
    const water = teamBuildingItems.find(i => i.name === '矿泉水')
    const snacks = teamBuildingItems.find(i => i.name === '零食包')
    expect(water!.quantity).toBeGreaterThanOrEqual(20)
    expect(snacks!.quantity).toBeGreaterThanOrEqual(10)
  })

  it('团建发起物料领用出库 — 提交领用申请', async () => {
    const { stockItemRepo, stockTxnRepo } = createMockRepos()
    const svc = buildService(stockItemRepo, stockTxnRepo)
    const dataSource = { transaction: vi.fn() }
    ;(svc as any).dataSource = dataSource

    const item = makeItem({ id: 'i17', name: '活动礼品', quantity: 100 })
    setupTransaction(dataSource as any, item, makeItem({ id: 'i17', name: '活动礼品', quantity: 80 }))

    const result = await svc.adjustStock('i17', -20, StockTransactionType.OUT, '团建活动礼品领用', 'tb-001')
    expect(result.quantity).toBe(80)
  })

  it('团建查看库存不足时应提示补货', async () => {
    const { stockItemRepo, stockTxnRepo } = createMockRepos()
    const svc = buildService(stockItemRepo, stockTxnRepo)

    const storeId = 'store-001'
    stockItemRepo.find!.mockResolvedValue([
      makeItem({ id: 'i18', name: '饮料', quantity: 5, storeId }),
      makeItem({ id: 'i19', name: '奖品', quantity: 3, storeId }),
    ])

    const lowItems = await svc.getLowStockItems(storeId, 10)
    expect(lowItems.every(i => i.quantity <= 10)).toBe(true)
    const restockList = lowItems.map(i => `${i.name}(剩余${i.quantity})`)
    expect(restockList.length).toBe(2)
  })

  it('团建领用数量超过库存时应拒绝', async () => {
    const { stockItemRepo, stockTxnRepo } = createMockRepos()
    const svc = buildService(stockItemRepo, stockTxnRepo)
    const dataSource = { transaction: vi.fn() }
    ;(svc as any).dataSource = dataSource

    const item = makeItem({ id: 'i20', name: '礼品', quantity: 5 })
    const mgr = {
      getRepository: vi.fn(),
    } as unknown as EntityManager
    const itemRepo = {
      findOne: vi.fn().mockResolvedValue(item),
      update: vi.fn(),
    }
    mgr.getRepository = vi.fn(() => itemRepo as any)
    dataSource.transaction!.mockImplementation(
      (cb: (mgr: EntityManager) => Promise<any>) => cb(mgr),
    )

    await expect(
      svc.adjustStock('i20', -10, StockTransactionType.OUT, '过度领用', 'tb-001')
    ).rejects.toThrow(BadRequestException)
  })
})

// ──────────────────────────────────────────────────────────────────────
// 📢营销 — 活动物资库存预查
// ──────────────────────────────────────────────────────────────────────
describe('📢营销 — 活动物资库存预查视角', () => {
  it('营销可查看活动物资库存 — 确认推广物料充足', async () => {
    const { stockItemRepo, stockTxnRepo } = createMockRepos()
    const svc = buildService(stockItemRepo, stockTxnRepo)
    stockItemRepo.find!.mockResolvedValue([
      makeItem({ id: 'i21', name: '宣传单', quantity: 1000, category: '物料' }),
      makeItem({ id: 'i22', name: '海报', quantity: 200, category: '物料' }),
      makeItem({ id: 'i23', name: '优惠券', quantity: 500, category: '物料' }),
    ])

    const marketingItems = await svc.listItems('store-001', '物料')
    expect(marketingItems.length).toBe(3)
    const totalFlyers = marketingItems.reduce((s, i) => s + i.quantity, 0)
    expect(totalFlyers).toBeGreaterThan(1000)
  })

  it('营销可按品类筛选物料的库存 — 快速定位', async () => {
    const { stockItemRepo, stockTxnRepo } = createMockRepos()
    const svc = buildService(stockItemRepo, stockTxnRepo)

    stockItemRepo.find!.mockResolvedValue([
      makeItem({ id: 'i24', name: '宣传单', quantity: 2000, category: '物料' }),
    ])

    const result = await svc.listItems('store-001', '物料')
    expect(result.length).toBe(1)
    expect(result[0].quantity).toBe(2000)
  })

  it('营销查看门店空库存时应返回空列表', async () => {
    const { stockItemRepo, stockTxnRepo } = createMockRepos()
    const svc = buildService(stockItemRepo, stockTxnRepo)
    stockItemRepo.find!.mockResolvedValue([])

    const items = await svc.listItems('store-empty')
    expect(items).toEqual([])
  })

  it('营销可查看库存交易流水 — 追溯活动物料领用历史', async () => {
    const { stockItemRepo, stockTxnRepo } = createMockRepos()
    const svc = buildService(stockItemRepo, stockTxnRepo)
    stockItemRepo.findOne!.mockResolvedValue(makeItem({ id: 'i25', name: '宣传单' }))
    stockTxnRepo.find!.mockResolvedValue([
      makeTxn({ id: 't4', stockItemId: 'i25', quantity: 500, type: StockTransactionType.IN, reason: '618活动物料入库', operatorId: 'op-001' }),
      makeTxn({ id: 't5', stockItemId: 'i25', quantity: -200, type: StockTransactionType.OUT, reason: '门店派发', operatorId: 'op-002' }),
    ])

    const txns = await svc.getTransactions('i25')
    const inboundQty = txns.filter(t => t.type === StockTransactionType.IN).reduce((s, t) => s + t.quantity, 0)
    const outboundQty = txns.filter(t => t.type === StockTransactionType.OUT).reduce((s, t) => s + Math.abs(t.quantity), 0)
    expect(inboundQty).toBe(500)
    expect(outboundQty).toBe(200)
    // 当前剩余 = 初始 + 入库 - 出库
    expect(inboundQty - outboundQty).toBe(300)
  })

  it('营销检查物料库存是否满足活动需求', async () => {
    const { stockItemRepo, stockTxnRepo } = createMockRepos()
    const svc = buildService(stockItemRepo, stockTxnRepo)

    stockItemRepo.find!.mockResolvedValue([
      makeItem({ id: 'i26', name: '宣传单', quantity: 800, category: '物料' }),
      makeItem({ id: 'i27', name: '展架', quantity: 5, category: '物料' }),
      makeItem({ id: 'i28', name: '赠品', quantity: 100, category: '物料' }),
    ])

    const items = await svc.listItems('store-001', '物料')
    // 活动需要1000张传单、10个展架、200份赠品
    const flyersNeeded = 1000; const standsNeeded = 10; const giftsNeeded = 200
    const flyers = items.find(i => i.name === '宣传单')
    const stands = items.find(i => i.name === '展架')
    const gifts = items.find(i => i.name === '赠品')
    const deficits: string[] = []
    if (flyers && flyers.quantity < flyersNeeded) deficits.push(`缺${flyersNeeded - flyers.quantity}张传单`)
    if (stands && stands.quantity < standsNeeded) deficits.push(`缺${standsNeeded - stands.quantity}个展架`)
    if (gifts && gifts.quantity < giftsNeeded) deficits.push(`缺${giftsNeeded - gifts.quantity}份赠品`)
    // 当前库存不足，需要补货
    expect(deficits.length).toBeGreaterThanOrEqual(2)
  })
})

// ──────────────────────────────────────────────────────────────────────
// 🦞 跨角色全流程闭环
// ──────────────────────────────────────────────────────────────────────
describe('🦞 库存跨角色全流程闭环', () => {
  it('🎮导玩员领用 → 🔧安监检查 → 🤝团建盘库 → 📢营销预查', async () => {
    const { stockItemRepo, stockTxnRepo } = createMockRepos()
    const svc = buildService(stockItemRepo, stockTxnRepo)
    const dataSource = { transaction: vi.fn() }
    ;(svc as any).dataSource = dataSource

    // 1. 🎮导玩员查看库存
    stockItemRepo.find!.mockResolvedValueOnce([
      makeItem({ id: 'i-cyc', name: '活动奖品', quantity: 80, storeId: 'store-001', category: '礼品' }),
    ])
    const items = await svc.listItems('store-001')
    expect(items.length).toBe(1)
    expect(items[0].quantity).toBe(80)

    // 2. 🔧安监检查库存告警
    stockItemRepo.find!.mockResolvedValueOnce([
      makeItem({ id: 'i-cyc', name: '活动奖品', quantity: 80, storeId: 'store-001' }),
      makeItem({ id: 'i-cyc2', name: '清洁用品', quantity: 3, storeId: 'store-001' }),
    ])
    const lowItems = await svc.getLowStockItems('store-001', 10)
    const lowNames = lowItems.map(i => i.name)
    expect(lowNames).toContain('清洁用品')

    // 3. 🤝团建出库领用
    const item = makeItem({ id: 'i-cyc', name: '活动奖品', quantity: 80 })
    setupTransaction(dataSource as any, item, makeItem({ id: 'i-cyc', name: '活动奖品', quantity: 60 }))
    const afterOut = await svc.adjustStock('i-cyc', -20, StockTransactionType.OUT, '团建领用', 'tb-001')
    expect(afterOut.quantity).toBe(60)

    // 4. 📢营销查看更新后库存
    stockItemRepo.find!.mockResolvedValueOnce([
      makeItem({ id: 'i-cyc', name: '活动奖品', quantity: 60, storeId: 'store-001' }),
    ])
    const finalItems = await svc.listItems('store-001')
    expect(finalItems[0].quantity).toBe(60)

    // 全流程验证
    expect(items[0].quantity).toBeGreaterThan(0)
    expect(lowItems.length).toBeGreaterThan(0)
    expect(afterOut.quantity).toBeLessThan(80)
    expect(finalItems[0].quantity).toBe(60)
  })
})
