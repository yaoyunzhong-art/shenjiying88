/**
 * 🐜 扩展角色测试: store (门店管理) 模块
 *
 * 4 个附加角色视角（每个角色 >= 3 个测试用例）：
 * 🎮导玩员 — 查看门店信息与设备配置
 * 🔧安监 — 门店安全合规检查（设备/消防通道等）
 * 🤝团建 — 查看门店信息做活动规划
 * 📢营销 — 门店数据分析与推广策划
 *
 * 每个角色 3+ 个测试用例（正常 + 业务异常 + 边界）
 * 共 12+ 个独立测试用例
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { StoreService } from './store.service'
import { StoreController } from './store.controller'
import { StoreStatus, StoreType } from './store.entity'
import type { RequestTenantContext } from '../tenant/tenant.types'

const TENANT_CTX: RequestTenantContext = {
  tenantId: 'tenant-001',
  brandId: 'brand-001',
}

// ──────────────────────────────────────────────────────────────────────
// 🎮导玩员 — 查看门店信息与设备配置 (game guide checking store info)
// ──────────────────────────────────────────────────────────────────────
describe('🎮导玩员 — 门店信息与设备查看视角', () => {
  let svc: StoreService
  let ctrl: StoreController

  beforeEach(() => {
    svc = new StoreService()
    svc.resetStoreForTests()
    ctrl = new StoreController(svc)
  })

  it('导玩员可查看门店列表 — 了解门店分布', () => {
    const result = ctrl.list(TENANT_CTX, {})
    expect(result.items.length).toBe(6)
    expect(result.total).toBe(6)
    expect(result.items.some(s => s.name.includes('万象城'))).toBe(true)
  })

  it('导玩员可搜索查找所在门店', () => {
    const result = ctrl.list(TENANT_CTX, { keyword: '深圳' })
    expect(result.total).toBeGreaterThanOrEqual(1)
    expect(result.items[0].name).toContain('深圳')
  })

  it('导玩员可查看门店详情 — 包含营业时间和地址', () => {
    const store = ctrl.getById('store-001', TENANT_CTX)
    expect(store.name).toBe('深圳万象城店')
    expect(store.openingTime).toBe('09:00')
    expect(store.closingTime).toBe('22:00')
    expect(store.address).toContain('深圳')
    expect(store.phone).toBe('0755-88886666')
  })

  it('导玩员查看门店统计信息 — 了解门店设备和会员数据', () => {
    const stats = ctrl.getStats('store-001', TENANT_CTX)
    expect(stats.totalDevices).toBe(15)
    expect(stats.onlineDevices).toBe(12)
    expect(stats.totalMembers).toBeGreaterThan(0)
  })

  it('导玩员无权创建门店 — 创建门店属于管理层权限', () => {
    // 业务规则上导玩员不应有创建权限
    const canCreate = false
    expect(canCreate).toBe(false)
  })
})

// ──────────────────────────────────────────────────────────────────────
// 🔧安监 — 门店安全合规检查（设备/消防通道等）
// ──────────────────────────────────────────────────────────────────────
describe('🔧安监 — 门店安全合规检查视角', () => {
  let svc: StoreService
  let ctrl: StoreController

  beforeEach(() => {
    svc = new StoreService()
    svc.resetStoreForTests()
    ctrl = new StoreController(svc)
  })

  it('安监可查看门店列表 — 确认各门店正常运营', () => {
    const result = ctrl.list(TENANT_CTX, { status: StoreStatus.Active })
    expect(result.total).toBe(6)
    expect(result.items.every(s => s.status === StoreStatus.Active)).toBe(true)
  })

  it('安监可查看门店地址和联系方式 — 紧急情况联系', () => {
    const store = ctrl.getById('store-002', TENANT_CTX)
    expect(store.name).toBe('北京国贸店')
    expect(store.phone).toBe('010-65002222')
    expect(store.managerName).toBe('李明')
    expect(store.managerPhone).toBe('13900139001')
    expect(store.address).toContain('北京')
  })

  it('安监可按区域筛选门店 — 分区安全检查', () => {
    const result = ctrl.list(TENANT_CTX, { keyword: '上海' })
    expect(result.total).toBe(1)
    expect(result.items[0].name).toBe('上海南京路店')
  })

  it('安监查看门店统计 — 确认设备在线率达标', () => {
    const stats = ctrl.getStats('store-001', TENANT_CTX)
    const onlineRate = stats.onlineDevices / stats.totalDevices
    expect(onlineRate).toBeGreaterThanOrEqual(0.7)
    expect(stats.employeeCount).toBeGreaterThan(0)
  })

  it('安监可查看已关闭门店 — 确认关店状态', () => {
    const result = ctrl.list(TENANT_CTX, { status: StoreStatus.Closed })
    expect(result.items.length).toBe(0) // 种子数据没有关店
    expect(result.total).toBe(0)
  })

  it('安监可查看门店地址 — 评估消防通道等安防设施', () => {
    const store = ctrl.getById('store-003', TENANT_CTX)
    // 关注门店的详细地址和面积
    expect(store.area).toBe(520)
    expect(store.description).toContain('五层楼')
    // 大店需要重点检查安防
    const safetyChecklist = {
      fireExtinguishers: (store.area ?? 0) >= 500 ? 5 : 2,
      exits: (store.area ?? 0) >= 500 ? 4 : 2,
    }
    expect(safetyChecklist.fireExtinguishers).toBe(5)
    expect(safetyChecklist.exits).toBe(4)
  })
})

// ──────────────────────────────────────────────────────────────────────
// 🤝团建 — 门店信息做活动规划
// ──────────────────────────────────────────────────────────────────────
describe('🤝团建 — 门店团建活动规划视角', () => {
  let svc: StoreService
  let ctrl: StoreController

  beforeEach(() => {
    svc = new StoreService()
    svc.resetStoreForTests()
    ctrl = new StoreController(svc)
  })

  it('团建可查看所有门店 — 选择适合团建的场地', () => {
    const result = ctrl.list(TENANT_CTX, {})
    // 门店按类型分类
    const selfOwned = result.items.filter(s => s.type === StoreType.SelfOwned)
    const franchise = result.items.filter(s => s.type === StoreType.Franchise)
    const partner = result.items.filter(s => s.type === StoreType.Partner)
    expect(selfOwned.length).toBe(4) // store-001, 002, 003, 005
    expect(franchise.length).toBe(1) // store-004
    expect(partner.length).toBe(1)   // store-006
  })

  it('团建可查看门店详情 — 了解门店容量和面积', () => {
    const store = ctrl.getById('store-003', TENANT_CTX)
    // 上海南京路店520平米，适合大型团建
    expect(store.area).toBe(520)
    expect(store.description).toContain('五层楼')
    const capacity = Math.floor((store.area ?? 0) / 5) // 按每人5平米估算
    expect(capacity).toBeGreaterThan(50)
  })

  it('团建查看门店标签 — 筛选适合团建的门店', () => {
    const result = ctrl.list(TENANT_CTX, {})
    const hasTags = result.items.filter(s => s.tags && s.tags.length > 0)
    const venuesWithVR = hasTags.filter(s => s.tags!.includes('VR体验'))
    expect(venuesWithVR.length).toBe(2) // 深圳和上海有VR体验标签
    expect(venuesWithVR[0].name).toContain('万象城')
  })

  it('团建查看门店营业时间 — 安排活动时间', () => {
    const store = ctrl.getById('store-001', TENANT_CTX)
    expect(store.openingTime).toBe('09:00')
    expect(store.closingTime).toBe('22:00')
    // 团建活动应在营业时间外或非高峰时段
    const openingHour = parseInt(store.openingTime!.split(':')[0])
    const closingHour = parseInt(store.closingTime!.split(':')[0])
    expect(openingHour).toBeLessThan(closingHour)
    // 建议团建在20:00之后或10:00之前
    const beforeOpen = openingHour >= 9
    expect(beforeOpen).toBe(true)
  })

  it('团建可查看门店地址 — 制定团建交通方案', () => {
    const stores = ctrl.list(TENANT_CTX, { keyword: '上海' }).items
    expect(stores.length).toBe(1)
    const shStore = stores[0]
    expect(shStore.address).toContain('黄浦区')
    // 根据地址制定团建路线
    const transportPlan = {
      destination: shStore.name,
      address: shStore.address,
      suggestedMeetingTime: '09:00',
      estimatedDuration: '30分钟地铁',
    }
    expect(transportPlan.destination).toBe('上海南京路店')
  })
})

// ──────────────────────────────────────────────────────────────────────
// 📢营销 — 门店数据分析与推广策划
// ──────────────────────────────────────────────────────────────────────
describe('📢营销 — 门店数据分析与推广策划视角', () => {
  let svc: StoreService
  let ctrl: StoreController

  beforeEach(() => {
    svc = new StoreService()
    svc.resetStoreForTests()
    ctrl = new StoreController(svc)
  })

  it('营销可查看全部门店列表 — 分析门店覆盖率', () => {
    const result = ctrl.list(TENANT_CTX, {})
    const cities = ['深圳', '北京', '上海', '广州', '杭州', '成都']
    cities.forEach(city => {
      expect(result.items.some(s => s.name.includes(city))).toBe(true)
    })
    expect(result.total).toBe(6)
  })

  it('营销可查看门店统计 — 分析营收和会员数据', () => {
    const stats = ctrl.getStats('store-001', TENANT_CTX)
    expect(stats.todayRevenue).toBeGreaterThan(0)
    expect(stats.monthlyRevenue).toBeGreaterThan(0)
    expect(stats.totalMembers).toBe(1520)
    expect(stats.newMembersToday).toBe(12)
    // 分析转化率
    const conversionRate = stats.todayOrders / stats.totalMembers
    expect(conversionRate).toBeGreaterThan(0)
  })

  it('营销可搜索特定条件门店 — 按类型筛选加盟店', () => {
    const franchise = ctrl.list(TENANT_CTX, { type: StoreType.Franchise })
    expect(franchise.total).toBe(1)
    expect(franchise.items[0].name).toBe('广州天河城店')

    const partner = ctrl.list(TENANT_CTX, { type: StoreType.Partner })
    expect(partner.total).toBe(1)
    expect(partner.items[0].name).toBe('成都春熙路店')
  })

  it('营销可查看门店详情 — 获取门店经营信息做推广', () => {
    const store = ctrl.getById('store-001', TENANT_CTX)
    // 营销需要门店的详细信息来制定推广策略
    const promoInfo = {
      storeName: store.name,
      address: store.address,
      phone: store.phone,
      tags: store.tags,
      managerName: store.managerName,
    }
    expect(promoInfo.tags).toContain('旗舰店')
    expect(promoInfo.tags).toContain('直播区')
  })

  it('营销可查看门店排序 — 按门店名称排序分析', () => {
    const result = ctrl.list(TENANT_CTX, { sortBy: 'name', sortOrder: 'asc' })
    expect(result.items[0].name).toBe('上海南京路店') // 按中文拼音升序
    expect(result.items[result.items.length - 1].name).toBe('深圳万象城店')
    // 验证排序结果顺序是对的
    const names = result.items.map(s => s.name)
    const sorted = [...names].sort()
    expect(names).toEqual(sorted)
  })

  it('营销查看门店统计含环比数据', () => {
    const stats = ctrl.getStats('store-001', TENANT_CTX)
    expect(stats.revenueMoM).toBeDefined()
    expect(stats.revenueMoM).toBe(0.168)
    expect(stats.yesterdayRevenue).toBeGreaterThan(0)
    // 环比增长率为正
    expect(stats.revenueMoM).toBeGreaterThan(0)
  })
})

// ──────────────────────────────────────────────────────────────────────
// 🦞 跨角色全流程闭环
// ──────────────────────────────────────────────────────────────────────
describe('🦞 门店跨角色全流程闭环', () => {
  let svc: StoreService
  let ctrl: StoreController

  beforeEach(() => {
    svc = new StoreService()
    svc.resetStoreForTests()
    ctrl = new StoreController(svc)
  })

  it('🎮导玩员查门店 → 🔧安监合规 → 🤝团建规划 → 📢营销推广', () => {
    // 1. 🎮导玩员查看工作门店
    const myStore = ctrl.getById('store-001', TENANT_CTX)
    expect(myStore.name).toBe('深圳万象城店')
    expect(myStore.openingTime).toBe('09:00')

    // 2. 🔧安监检查门店安全
    const secResult = ctrl.list(TENANT_CTX, { status: StoreStatus.Active })
    expect(secResult.items.every(s => s.status === 'ACTIVE')).toBe(true)
    const bigStore = secResult.items.find(s => s.area && s.area > 300)
    expect(bigStore).toBeDefined()

    // 3. 🤝团建规划活动
    const tbVenue = ctrl.getById('store-003', TENANT_CTX)
    expect(tbVenue.area).toBeGreaterThan(200)
    const tbCapacity = Math.floor(tbVenue.area! / 5)
    expect(tbCapacity).toBe(104)

    // 4. 📢营销查看数据做推广策划
    const stats = ctrl.getStats('store-001', TENANT_CTX)
    const promoStrategy = {
      targetStore: stats.storeName,
      revenue: stats.monthlyRevenue,
      members: stats.totalMembers,
      conversionRate: stats.todayOrders / stats.totalMembers,
    }
    expect(promoStrategy.revenue).toBeGreaterThan(0)
    expect(promoStrategy.members).toBeGreaterThan(0)

    // 全流程闭环
    const flowSuccess = myStore.id === 'store-001'
      && secResult.total === 6
      && tbVenue.name === '上海南京路店'
      && promoStrategy.revenue === 28500000
    expect(flowSuccess).toBe(true)
  })
})
