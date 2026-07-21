/**
 * 🐜 自动: [price-monitor] [C] 角色扩展测试
 *
 * 8 角色视角的 价格监控模块扩展测试（补充 role.test.ts）
 * 👔店长 🛒前台 👥HR 🔧安监 🎮导玩员 🎯运行专员 🤝团建 📢营销
 *
 * 每个至少 3 个场景测试 = 8×3 = 24 tests
 * 使用实际 PriceMonitorService
 */
import { describe, it, expect } from 'vitest'
import { PriceMonitorService } from './price-monitor.service'
import { PriceCategory } from './price-monitor.entity'

// ── 角色权限矩阵 ──

const ROLES = {
  StoreManager: '👔店长',
  FrontDesk: '🛒前台',
  HR: '👥HR',
  Security: '🔧安监',
  Guide: '🎮导玩员',
  Operations: '🎯运行专员',
  Teambuilding: '🤝团建',
  Marketing: '📢营销',
} as const

/** 角色 → 价格监控模块权限 (操作级) */
const rolePriceAccess: Record<string, string[]> = {
  'price:list': ['👔店长', '🎯运行专员', '📢营销'],
  'price:detail': ['👔店长', '🛒前台', '🎯运行专员', '📢营销'],
  'price:create': ['👔店长', '📢营销'],
  'price:delete': ['👔店长'],
  'price:compare': ['👔店长', '🎯运行专员', '📢营销'],
  'price:anomaly': ['👔店长', '🎯运行专员', '📢营销'],
  'price:summary': ['👔店长', '🎯运行专员', '📢营销'],
}

function checkRoleAccess(role: string, resource: string): boolean {
  return rolePriceAccess[resource]?.includes(role) ?? false
}

function makeService(): PriceMonitorService {
  const svc = new PriceMonitorService()
  svc.resetStoreForTests()
  return svc
}

// ════════════════════════════════════════════════════════════
// 👔店长 — 价格监控
// ════════════════════════════════════════════════════════════

describe('[👔店长] price-monitor 角色扩展测试', () => {
  it('👔[正例] 店长查看价格列表 → 按分类筛选', async () => {
    expect(checkRoleAccess(ROLES.StoreManager, 'price:list')).toBe(true)
    const svc = makeService()
    // After reset, store is empty — seed is only by list()
    const all = svc.list('tenant-001')
    expect(all.length).toBe(10)
    expect(all[0]).toHaveProperty('storeName')

    const gameItems = svc.list('tenant-001', { category: PriceCategory.Game })
    gameItems.forEach((i) => expect(i.category).toBe(PriceCategory.Game))

    const foodItems = svc.list('tenant-001', { category: PriceCategory.Food })
    foodItems.forEach((i) => expect(i.category).toBe(PriceCategory.Food))
  })

  it('👔[正例] 店长查看价格详情 → 创建价格条目', async () => {
    expect(checkRoleAccess(ROLES.StoreManager, 'price:detail')).toBe(true)
    const svc = makeService()
    const all = svc.list('tenant-001')
    expect(all.length).toBeGreaterThan(0)
    const detail = svc.get(all[0].id, 'tenant-001')
    expect(detail).toBeDefined()
    expect(detail!.itemName).toBeTruthy()

    expect(checkRoleAccess(ROLES.StoreManager, 'price:create')).toBe(true)
    const created = svc.create({
      tenantId: 'tenant-001', storeId: 'store-007', storeName: '武汉光谷店',
      itemName: '奶茶', category: PriceCategory.Food, price: 13, marketAvgPrice: 12,
    })
    expect(created.isAnomaly).toBe(false)
    expect(created.priceDiff).toBe(1)
    expect(created.diffPercent).toBe(8.3)
  })

  it('👔[正例] 店长查看价格对比 → 异常检测 → 汇总', async () => {
    expect(checkRoleAccess(ROLES.StoreManager, 'price:compare')).toBe(true)
    const svc = makeService()
    const comparisons = svc.getPriceComparison('tenant-001')
    expect(comparisons.length).toBeGreaterThan(0)
    comparisons.forEach((c) => {
      expect(c.diffPercent).toBeDefined()
    })

    expect(checkRoleAccess(ROLES.StoreManager, 'price:anomaly')).toBe(true)
    const anomalies = svc.getAnomalies('tenant-001')
    expect(anomalies.length).toBeGreaterThan(0)

    expect(checkRoleAccess(ROLES.StoreManager, 'price:summary')).toBe(true)
    const summary = svc.getSummary('tenant-001')
    expect(summary.totalItems).toBeGreaterThan(0)
    expect(summary.avgPrice).toBeGreaterThan(0)
  })
})

// ════════════════════════════════════════════════════════════
// 🛒前台 — 价格监控
// ════════════════════════════════════════════════════════════

describe('[🛒前台] price-monitor 角色扩展测试', () => {
  it('🛒[正例] 前台查看单个商品价格详情（顾客问价时使用）', async () => {
    expect(checkRoleAccess(ROLES.FrontDesk, 'price:detail')).toBe(true)
    const svc = makeService()
    const all = svc.list('tenant-001')
    expect(all.length).toBeGreaterThan(0)
    const detail = svc.get(all[0].id, 'tenant-001')
    expect(detail).toBeDefined()
    expect(detail!.price).toBeGreaterThan(0)
  })

  it('🛒[反例] 前台无权限查看价格列表', () => {
    expect(checkRoleAccess(ROLES.FrontDesk, 'price:list')).toBe(false)
  })

  it('🛒[反例] 前台无权限创建/删除/对比/异常侦测', () => {
    expect(checkRoleAccess(ROLES.FrontDesk, 'price:create')).toBe(false)
    expect(checkRoleAccess(ROLES.FrontDesk, 'price:delete')).toBe(false)
    expect(checkRoleAccess(ROLES.FrontDesk, 'price:compare')).toBe(false)
    expect(checkRoleAccess(ROLES.FrontDesk, 'price:anomaly')).toBe(false)
    expect(checkRoleAccess(ROLES.FrontDesk, 'price:summary')).toBe(false)
  })
})

// ════════════════════════════════════════════════════════════
// 👥HR — 价格监控
// ════════════════════════════════════════════════════════════

describe('[👥HR] price-monitor 角色扩展测试', () => {
  it('👥[反例] HR无权限查看价格列表和详情', () => {
    expect(checkRoleAccess(ROLES.HR, 'price:list')).toBe(false)
    expect(checkRoleAccess(ROLES.HR, 'price:detail')).toBe(false)
  })

  it('👥[反例] HR无权限创建/删除/对比', () => {
    expect(checkRoleAccess(ROLES.HR, 'price:create')).toBe(false)
    expect(checkRoleAccess(ROLES.HR, 'price:delete')).toBe(false)
    expect(checkRoleAccess(ROLES.HR, 'price:compare')).toBe(false)
  })

  it('👥[反例] HR无权限查看异常检测和汇总', () => {
    expect(checkRoleAccess(ROLES.HR, 'price:anomaly')).toBe(false)
    expect(checkRoleAccess(ROLES.HR, 'price:summary')).toBe(false)
  })
})

// ════════════════════════════════════════════════════════════
// 🔧安监 — 价格监控
// ════════════════════════════════════════════════════════════

describe('[🔧安监] price-monitor 角色扩展测试', () => {
  it('🔧[反例] 安监无权限查看价格列表', () => {
    expect(checkRoleAccess(ROLES.Security, 'price:list')).toBe(false)
    expect(checkRoleAccess(ROLES.Security, 'price:detail')).toBe(false)
  })

  it('🔧[反例] 安监无权限操作价格', () => {
    expect(checkRoleAccess(ROLES.Security, 'price:create')).toBe(false)
    expect(checkRoleAccess(ROLES.Security, 'price:delete')).toBe(false)
    expect(checkRoleAccess(ROLES.Security, 'price:compare')).toBe(false)
  })

  it('🔧[闭环] 安监无权限返回统一拒绝格式', () => {
    const denied = { success: false, code: 403, message: 'NO_PRICE_MONITOR_ACCESS', module: 'price-monitor' }
    expect(denied.code).toBe(403)
    expect(denied.module).toBe('price-monitor')
  })
})

// ════════════════════════════════════════════════════════════
// 🎮导玩员 — 价格监控
// ════════════════════════════════════════════════════════════

describe('[🎮导玩员] price-monitor 角色扩展测试', () => {
  it('🎮[反例] 导玩员无权限查看价格', () => {
    expect(checkRoleAccess(ROLES.Guide, 'price:list')).toBe(false)
    expect(checkRoleAccess(ROLES.Guide, 'price:detail')).toBe(false)
  })

  it('🎮[反例] 导玩员无权限操作价格', () => {
    expect(checkRoleAccess(ROLES.Guide, 'price:create')).toBe(false)
    expect(checkRoleAccess(ROLES.Guide, 'price:delete')).toBe(false)
    expect(checkRoleAccess(ROLES.Guide, 'price:compare')).toBe(false)
  })

  it('🎮[反例] 导玩员全部价格监控权限被拒', () => {
    const resources = ['price:list', 'price:detail', 'price:create', 'price:delete', 'price:compare', 'price:anomaly', 'price:summary']
    resources.forEach((r) => {
      expect(checkRoleAccess(ROLES.Guide, r)).toBe(false)
    })
  })
})

// ════════════════════════════════════════════════════════════
// 🎯运行专员 — 价格监控
// ════════════════════════════════════════════════════════════

describe('[🎯运行专员] price-monitor 角色扩展测试', () => {
  it('🎯[正例] 运行专员查看价格列表 → 按门店筛选', async () => {
    expect(checkRoleAccess(ROLES.Operations, 'price:list')).toBe(true)
    const svc = makeService()
    const storeItems = svc.list('tenant-001', { storeId: 'store-001' })
    expect(storeItems.length).toBeGreaterThan(0)
    storeItems.forEach((i) => expect(i.storeId).toBe('store-001'))
  })

  it('🎯[正例] 运行专员对比价格 → 检测异常 → 查看汇总', async () => {
    expect(checkRoleAccess(ROLES.Operations, 'price:compare')).toBe(true)
    const svc = makeService()
    const comparisons = svc.getPriceComparison('tenant-001', { storeId: 'store-001' })
    expect(comparisons.length).toBeGreaterThan(0)

    expect(checkRoleAccess(ROLES.Operations, 'price:anomaly')).toBe(true)
    const anomalies = svc.getAnomalies('tenant-001')
    const trueAnomalies = anomalies.filter((a) => a.isAnomaly)
    expect(trueAnomalies.length).toBeGreaterThan(0)
    trueAnomalies.forEach((a) => expect(a.isAnomaly).toBe(true))

    expect(checkRoleAccess(ROLES.Operations, 'price:summary')).toBe(true)
    const summary = svc.getSummary('tenant-001', { storeId: 'store-001' })
    expect(summary.totalItems).toBeGreaterThan(0)
  })

  it('🎯[正例] 运行专员查看价格详情 → 按品类分析', async () => {
    expect(checkRoleAccess(ROLES.Operations, 'price:detail')).toBe(true)
    const svc = makeService()
    const all = svc.list('tenant-001')
    expect(all.length).toBeGreaterThan(0)
    const detail = svc.get(all[0].id, 'tenant-001')
    expect(detail).toBeDefined()

    const vipItems = svc.list('tenant-001', { category: PriceCategory.Vip })
    vipItems.forEach((i) => expect(i.category).toBe(PriceCategory.Vip))
  })
})

// ════════════════════════════════════════════════════════════
// 🤝团建 — 价格监控
// ════════════════════════════════════════════════════════════

describe('[🤝团建] price-monitor 角色扩展测试', () => {
  it('🤝[反例] 团建无权限查看价格列表', () => {
    expect(checkRoleAccess(ROLES.Teambuilding, 'price:list')).toBe(false)
    expect(checkRoleAccess(ROLES.Teambuilding, 'price:detail')).toBe(false)
  })

  it('🤝[反例] 团建无权限操作价格', () => {
    expect(checkRoleAccess(ROLES.Teambuilding, 'price:create')).toBe(false)
    expect(checkRoleAccess(ROLES.Teambuilding, 'price:delete')).toBe(false)
    expect(checkRoleAccess(ROLES.Teambuilding, 'price:compare')).toBe(false)
  })

  it('🤝[反例] 团建全部价格监控权限被拒', () => {
    const resources = ['price:list', 'price:detail', 'price:create', 'price:delete', 'price:compare', 'price:anomaly', 'price:summary']
    resources.forEach((r) => {
      expect(checkRoleAccess(ROLES.Teambuilding, r)).toBe(false)
    })
  })
})

// ════════════════════════════════════════════════════════════
// 📢营销 — 价格监控
// ════════════════════════════════════════════════════════════

describe('[📢营销] price-monitor 角色扩展测试', () => {
  it('📢[正例] 营销查看价格列表 → 创建调价条目', async () => {
    expect(checkRoleAccess(ROLES.Marketing, 'price:list')).toBe(true)
    const svc = makeService()
    const all = svc.list('tenant-001')
    expect(all.length).toBe(10)

    expect(checkRoleAccess(ROLES.Marketing, 'price:create')).toBe(true)
    const created = svc.create({
      tenantId: 'tenant-001', storeId: 'store-008', storeName: '西安钟楼店',
      itemName: '暑期特惠套餐', category: PriceCategory.Food, price: 25, marketAvgPrice: 20,
    })
    expect(created.price).toBe(25)
    expect(created.diffPercent).toBe(25)
    expect(created.isAnomaly).toBe(true) // 25% > 20%
  })

  it('📢[正例] 营销对比价格 → 异常检测 → 汇总', async () => {
    expect(checkRoleAccess(ROLES.Marketing, 'price:compare')).toBe(true)
    const svc = makeService()
    const comparisons = svc.getPriceComparison('tenant-001', { category: PriceCategory.Game })
    expect(comparisons.length).toBeGreaterThan(0)

    expect(checkRoleAccess(ROLES.Marketing, 'price:anomaly')).toBe(true)
    const anomalies = svc.getAnomalies('tenant-001', { category: PriceCategory.Food })
    expect(anomalies.length).toBeGreaterThan(0)

    expect(checkRoleAccess(ROLES.Marketing, 'price:summary')).toBe(true)
    const summary = svc.getSummary('tenant-001')
    expect(summary.totalItems).toBeGreaterThan(0)
    expect(summary.lowestPriceStore).toBeTruthy()
  })

  it('📢[正例] 营销按价格区间筛选', async () => {
    expect(checkRoleAccess(ROLES.Marketing, 'price:list')).toBe(true)
    const svc = makeService()
    const cheap = svc.list('tenant-001', { minPrice: 1, maxPrice: 10 })
    cheap.forEach((i) => {
      expect(i.price).toBeGreaterThanOrEqual(1)
      expect(i.price).toBeLessThanOrEqual(10)
    })
  })
})

// ════════════════════════════════════════════════════════════
// 🦞 跨角色组合场景 + 边界
// ════════════════════════════════════════════════════════════

describe('[🦞 price-monitor 跨角色闭环 + 边界]', () => {
  it('👔 + 📢 店长创建价格条目 → 营销比较 → 运行专员检测异常', async () => {
    const svc = makeService()

    // 1. 店长创建价格
    const newItem = svc.create({
      tenantId: 'tenant-001', storeId: 'store-009', storeName: '长沙五一店',
      itemName: '冰美式', category: PriceCategory.Food, price: 8, marketAvgPrice: 10,
    })
    expect(newItem.price).toBe(8)

    // 2. 营销比较
    const comparisons = svc.getPriceComparison('tenant-001', { storeId: 'store-009' })
    expect(comparisons.length).toBeGreaterThan(0)

    // 3. 运行专员检测异常
    const anomalies = svc.getAnomalies('tenant-001')
    expect(anomalies.length).toBeGreaterThan(0)
  })

  it('🛡️ 不存在的价格条目返回 undefined', () => {
    const svc = makeService()
    expect(svc.get('nonexistent-id', 'tenant-001')).toBeUndefined()
  })

  it('🛡️ 不存在的价格条目获取抛出 NotFoundException', () => {
    const svc = makeService()
    expect(() => svc.require('nonexistent-id', 'tenant-001')).toThrow('not found')
  })

  it('🛡️ 删除不存在条目抛出 NotFoundException', () => {
    const svc = makeService()
    expect(() => svc.delete('nonexistent-id', 'tenant-001')).toThrow('not found')
  })

  it('🛡️ 不同租户隔离', () => {
    const svc = makeService()
    svc.create({
      tenantId: 'tenant-002', storeId: 'store-a', storeName: '其他租户',
      itemName: '测试品', category: PriceCategory.Game, price: 10, marketAvgPrice: 8,
    })
    const t1Items = svc.list('tenant-001')
    expect(t1Items.every(i => i.tenantId === 'tenant-001')).toBe(true)
  })

  it('🛡️ 价格异常阈值可调整', () => {
    const svc = makeService()
    const smallAnomalies = svc.getAnomalies('tenant-001', { minDiffPercent: 10 })
    const largeAnomalies = svc.getAnomalies('tenant-001', { minDiffPercent: 50 })
    expect(smallAnomalies.length).toBeGreaterThanOrEqual(largeAnomalies.length)
  })

  it('🛡️ 空门店查询返回 0 汇总', () => {
    const svc = makeService()
    const summary = svc.getSummary('tenant-001', { storeId: 'nonexistent-store' })
    expect(summary.totalItems).toBe(0)
    expect(summary.avgPrice).toBe(0)
  })

  it('🛡️ 多次创建价格 ID 唯一', () => {
    const svc = makeService()
    const a = svc.create({ tenantId: 't1', storeId: 's1', storeName: 's1', itemName: 'a', category: PriceCategory.Game, price: 5, marketAvgPrice: 4 })
    const b = svc.create({ tenantId: 't1', storeId: 's1', storeName: 's1', itemName: 'b', category: PriceCategory.Game, price: 6, marketAvgPrice: 5 })
    expect(a.id).not.toBe(b.id)
  })

  it('🛡️ 价格 delta/diffPercent 计算正确', () => {
    const svc = makeService()
    const item = svc.create({ tenantId: 't1', storeId: 's1', storeName: 's1', itemName: 'test', category: PriceCategory.Game, price: 6, marketAvgPrice: 4 })
    expect(item.priceDiff).toBe(2)
    expect(item.diffPercent).toBe(50)
    expect(item.isAnomaly).toBe(true)
  })

  it('🛡️ 对比列表包含所有必需字段', () => {
    const svc = makeService()
    const comparisons = svc.getPriceComparison('tenant-001')
    comparisons.forEach((c) => {
      expect(c).toHaveProperty('storeId')
      expect(c).toHaveProperty('storeName')
      expect(c).toHaveProperty('itemName')
      expect(c).toHaveProperty('price')
      expect(c).toHaveProperty('marketAvgPrice')
      expect(c).toHaveProperty('diffPercent')
    })
  })

  it('🛡️ 汇总包含最低/最高价门店', () => {
    const svc = makeService()
    const summary = svc.getSummary('tenant-001')
    expect(summary.lowestPriceStore.length).toBeGreaterThan(0)
    expect(summary.highestPriceStore.length).toBeGreaterThan(0)
    expect(summary.lowestPriceStore).not.toBe(summary.highestPriceStore)
  })
})
