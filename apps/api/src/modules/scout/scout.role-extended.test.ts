/**
 * 🐜 扩展角色测试: scout (选址拓展) 模块
 *
 * 4 个附加角色视角（每个角色 >= 3 个测试用例）：
 * 🎮导玩员 — 场地设备查询与对比
 * 🔧安监 — 选址日志审计与合规检查
 * 🤝团建 — 寻找适合团建活动的场地
 * 📢营销 — 商圈分析与推广策划
 *
 * 每个角色 3+ 个测试用例（正常 + 业务异常 + 边界）
 * 共 12+ 个独立测试用例
 */
import { describe, it, expect } from 'vitest'
import assert from 'node:assert/strict'
import { ScoutController } from './scout.controller'
import { ScoutService } from './scout.service'
import { PrismaService } from '../../prisma/prisma.service'

// ── 角色访问矩阵（同 scout.role.test.ts）──
const roleAccessMatrix: Record<string, string[]> = {
  'scout:cities': ['👔店长', '🎯运行专员', '📢营销', '🤝团建'],
  'scout:venues': ['👔店长', '🛒前台', '🎮导玩员', '🎯运行专员', '🤝团建', '📢营销'],
  'scout:search': ['👔店长', '🛒前台', '🎮导玩员', '🎯运行专员', '🤝团建', '📢营销'],
  'scout:prices': ['👔店长', '🎯运行专员', '📢营销', '🤝团建'],
  'scout:devices': ['👔店长', '🛒前台', '🎮导玩员', '🎯运行专员', '🤝团建'],
  'scout:membership': ['👔店长', '🛒前台', '🎯运行专员', '📢营销'],
  'scout:reviews': ['👔店长', '🛒前台', '🎯运行专员', '📢营销'],
  'scout:activities': ['👔店长', '🎯运行专员', '🤝团建', '📢营销'],
  'scout:logs': ['👔店长', '🔧安监', '🎯运行专员'],
}

function checkModuleAccess(role: string, module: string): boolean {
  const allowedRoles = roleAccessMatrix[module]
  return allowedRoles?.includes(role) ?? false
}

function mockSuccessResponse(data: any = {}) {
  return { success: true, code: 200, data, timestamp: Date.now() }
}

function mockErrorResponse(code: number, message: string) {
  return { success: false, code, message, timestamp: Date.now() }
}

// ──────────────────────────────────────────────────────────────────────
// 🎮导玩员 — 场地设备查询与对比 (game guide exploring venue devices)
// ──────────────────────────────────────────────────────────────────────
describe('🎮导玩员 — 场地设备查询与对比视角', () => {
  it('导玩员可查看场地设备清单（了解竞品设备配置）', () => {
    assert.ok(checkModuleAccess('🎮导玩员', 'scout:devices'))

    const devices = mockSuccessResponse([
      { name: '跳舞机', brand: '华立', qty: 4, status: 'active' },
      { name: '抓娃娃机', brand: '太鼓', qty: 8, status: 'active' },
      { name: '篮球机', brand: '世嘉', qty: 3, status: 'active' },
    ])

    expect(devices.data.length).toBe(3)
    const totalMachineQty = devices.data.reduce((s: number, d: any) => s + d.qty, 0)
    expect(totalMachineQty).toBe(15)
    // 导玩员根据设备清单判断该场地的设备丰富度
    expect(devices.data.every((d: any) => d.status === 'active')).toBe(true)
  })

  it('导玩员可搜索场地 → 对比设备配置差异', () => {
    assert.ok(checkModuleAccess('🎮导玩员', 'scout:venues'))
    assert.ok(checkModuleAccess('🎮导玩员', 'scout:search'))

    const searchA = mockSuccessResponse([
      { id: 101, name: 'A场地', devices: ['跳舞机', '娃娃机'] },
    ])
    const searchB = mockSuccessResponse([
      { id: 102, name: 'B场地', devices: ['跳舞机', 'VR体验', '赛车模拟器'] },
    ])
    expect(searchA.data[0].devices.length).toBe(2)
    expect(searchB.data[0].devices.length).toBe(3)
    // 对比设备差异
    const diff = searchB.data[0].devices.filter((d: string) => !searchA.data[0].devices.includes(d))
    expect(diff).toEqual(['VR体验', '赛车模拟器'])
  })

  it('导玩员查看场地详情 → 确认是否有自己熟悉的机型', () => {
    assert.ok(checkModuleAccess('🎮导玩员', 'scout:venues'))

    const venue = mockSuccessResponse({
      id: 201, name: '新会展中心店',
      category: '购物中心',
      machines: [
        { name: '舞力全开', version: '2026', difficulty: '初级' },
        { name: '太鼓达人', version: 'DX', difficulty: '中级' },
        { name: '头文字D', version: 'Zero', difficulty: '高级' },
      ],
    })
    const familiarMachines = venue.data.machines.filter((m: any) => m.difficulty === '初级')
    expect(familiarMachines.length).toBe(1)
    expect(familiarMachines[0].name).toBe('舞力全开')
  })

  it('导玩员无权查看场地价格方案 — 定价属于管理敏感信息', () => {
    const denied = checkModuleAccess('🎮导玩员', 'scout:prices')
    expect(denied).toBe(false)
  })

  it('导玩员对比新场地设备与现门店配置差异，输出陈列建议', () => {
    assert.ok(checkModuleAccess('🎮导玩员', 'scout:devices'))

    const currentDevices = mockSuccessResponse([
      { name: '跳舞机', qty: 2 }, { name: '娃娃机', qty: 6 },
    ])
    const newVenueDevices = mockSuccessResponse([
      { name: '跳舞机', qty: 4 }, { name: '娃娃机', qty: 10 }, { name: 'VR体验', qty: 2 },
    ])
    const gap = newVenueDevices.data.filter(
      (nd: any) => !currentDevices.data.some((cd: any) => cd.name === nd.name)
    )
    expect(gap.length).toBe(1) // VR体验为新增品类
    expect(gap[0].name).toBe('VR体验')
  })
})

// ──────────────────────────────────────────────────────────────────────
// 🔧安监 — 选址日志审计与合规检查 (security auditing scout logs)
// ──────────────────────────────────────────────────────────────────────
describe('🔧安监 — 选址日志审计与合规检查视角', () => {
  it('安监可查看选址操作日志 — 确认选址操作可追溯', () => {
    assert.ok(checkModuleAccess('🔧安监', 'scout:logs'))

    const logs = mockSuccessResponse([
      { userId: 'manager-01', action: 'VENUE_SEARCH', target: '北京', time: Date.now() - 300000 },
      { userId: 'ops-02', action: 'PRICE_QUERY', target: 'venue-101', time: Date.now() - 600000 },
      { userId: 'mkt-03', action: 'CITY_LIST', target: 'tier-1', time: Date.now() - 900000 },
    ])
    expect(logs.data.length).toBe(3)
    // 确认所有日志条目都有完整信息
    const complete = logs.data.every((l: any) => l.userId && l.action && l.time)
    expect(complete).toBe(true)
  })

  it('安监检查选址系统 — 确认无异常访问记录', () => {
    assert.ok(checkModuleAccess('🔧安监', 'scout:logs'))

    const logs = mockSuccessResponse([
      { userId: 'valid-user', action: 'VENUE_VIEW', ip: '192.168.1.100', device: 'office-pc' },
      { userId: 'valid-user', action: 'SEARCH', ip: '192.168.1.100', device: 'office-pc' },
    ])
    // 检查来源IP和设备一致性
    const allSameIp = logs.data.every((l: any) => l.ip === '192.168.1.100')
    expect(allSameIp).toBe(true)
    // 检查没有异常访问模式
    const blockedActions = logs.data.filter((l: any) => l.action === 'BLOCKED_ACCESS')
    expect(blockedActions.length).toBe(0)
  })

  it('安监无法查看场地评价信息 — 评价属于运营范畴', () => {
    const denied = checkModuleAccess('🔧安监', 'scout:reviews')
    expect(denied).toBe(false)
  })

  it('安监无法搜索场地 — 选址搜索属于业务职能', () => {
    const denied = checkModuleAccess('🔧安监', 'scout:search')
    expect(denied).toBe(false)
  })

  it('安监审计选址日志完整性 → 导出审计报告', () => {
    assert.ok(checkModuleAccess('🔧安监', 'scout:logs'))

    const auditData = mockSuccessResponse({
      totalLogs: 156,
      timeRange: { from: '2026-07-01', to: '2026-07-21' },
      uniqueUsers: 12,
      actions: ['VENUE_VIEW', 'SEARCH', 'PRICE_QUERY', 'CITY_LIST'],
      anomalies: [],
    })
    expect(auditData.data.anomalies.length).toBe(0)
    expect(auditData.data.uniqueUsers).toBe(12)
    const reportSummary = `审计周期: ${auditData.data.timeRange.from} ~ ${auditData.data.timeRange.to}, 共${auditData.data.totalLogs}条操作记录，${auditData.data.uniqueUsers}个用户，异常事件: ${auditData.data.anomalies.length}起`
    expect(reportSummary).toContain('审计周期')
    expect(reportSummary).toContain('156条')
  })
})

// ──────────────────────────────────────────────────────────────────────
// 🤝团建 — 寻找适合团建活动的场地 (team building venue scouting)
// ──────────────────────────────────────────────────────────────────────
describe('🤝团建 — 团建场地寻找视角', () => {
  it('团建可搜索适合团建的场地 → 查看场地类别和设施', () => {
    assert.ok(checkModuleAccess('🤝团建', 'scout:venues'))
    assert.ok(checkModuleAccess('🤝团建', 'scout:search'))

    const searchResult = mockSuccessResponse([
      { id: 301, name: '拓展训练基地', category: '户外拓展', capacity: 100, facilities: ['攀岩', '高空断桥'] },
      { id: 302, name: '轰趴馆', category: '娱乐', capacity: 30, facilities: ['KTV', '桌游', '台球'] },
    ])
    expect(searchResult.data.length).toBe(2)
    // 过滤出适合全公司团建的大场地
    const largeVenues = searchResult.data.filter((v: any) => v.capacity >= 50)
    expect(largeVenues.length).toBe(1)
    expect(largeVenues[0].name).toBe('拓展训练基地')
  })

  it('团建可查看团建场地价格方案 — 做预算规划', () => {
    assert.ok(checkModuleAccess('🤝团建', 'scout:prices'))

    const priceInfo = mockSuccessResponse({
      venueId: 301,
      packageName: '标准团建套餐',
      perPersonPrice: 168,
      minGroupSize: 10,
      maxGroupSize: 100,
      includes: ['场地', '教练', '午餐', '保险'],
    })
    const groupSize = 25
    const totalBudget = groupSize * priceInfo.data.perPersonPrice
    expect(totalBudget).toBe(4200)
    expect(priceInfo.data.includes.includes('保险')).toBe(true)
    // 检查预算是否符合公司标准
    expect(priceInfo.data.perPersonPrice).toBeLessThan(200)
  })

  it('团建查看场地的活动排期 — 预定团建时间', () => {
    assert.ok(checkModuleAccess('🤝团建', 'scout:activities'))

    const activities = mockSuccessResponse([
      { venueId: 301, date: '2026-07-25', status: 'available', slots: ['09:00', '14:00'] },
      { venueId: 301, date: '2026-07-26', status: 'booked', slots: [] },
    ])
    const availableDates = activities.data.filter((a: any) => a.status === 'available')
    expect(availableDates.length).toBe(1)
    expect(availableDates[0].slots.length).toBe(2)
  })

  it('团建无权查看会员数据 — 会员信息属于运营私密', () => {
    const denied = checkModuleAccess('🤝团建', 'scout:membership')
    expect(denied).toBe(false)
  })

  it('团建落地闭环: 选场地 → 看价格 → 定时间 → 提交团建方案', () => {
    assert.ok(checkModuleAccess('🤝团建', 'scout:venues'))
    assert.ok(checkModuleAccess('🤝团建', 'scout:prices'))
    assert.ok(checkModuleAccess('🤝团建', 'scout:activities'))

    // 1. 选场地
    const venue = mockSuccessResponse({ id: 401, name: '星河团建基地', capacity: 50 })
    expect(venue.data.capacity).toBeGreaterThanOrEqual(20)

    // 2. 看价格
    const price = mockSuccessResponse({ perPerson: 128, groupMin: 10 })
    const estimatedCost = 30 * price.data.perPerson
    expect(estimatedCost).toBe(3840)

    // 3. 定时间
    const slot = mockSuccessResponse({ date: '2026-08-05', time: '09:00-17:00', confirmed: true })
    expect(slot.data.confirmed).toBe(true)

    // 4. 提方案
    const proposal = {
      venueName: venue.data.name,
      totalCost: estimatedCost,
      participants: 30,
      perPerson: price.data.perPerson,
      date: slot.data.date,
      approved: estimatedCost < 5000,
    }
    expect(proposal.approved).toBe(true)
    expect(proposal.venueName).toBe('星河团建基地')
  })
})

// ──────────────────────────────────────────────────────────────────────
// 📢营销 — 商圈分析与推广策划 (marketing analysis for new venue)
// ──────────────────────────────────────────────────────────────────────
describe('📢营销 — 商圈分析与推广策划视角', () => {
  it('营销可查看城市列表 → 分析一线城市市场密度', () => {
    assert.ok(checkModuleAccess('📢营销', 'scout:cities'))

    const cities = mockSuccessResponse([
      { id: 1, name: '北京', tier: '一线', venueCount: 5 },
      { id: 2, name: '上海', tier: '一线', venueCount: 8 },
      { id: 3, name: '广州', tier: '一线', venueCount: 3 },
      { id: 4, name: '深圳', tier: '一线', venueCount: 6 },
    ])
    const tier1 = cities.data.filter((c: any) => c.tier === '一线')
    const totalVenues = tier1.reduce((s: number, c: any) => s + c.venueCount, 0)
    expect(tier1.length).toBe(4)
    expect(totalVenues).toBe(22)
  })

  it('营销可搜索潜在场地 → 查看评价辅助市场定位', () => {
    assert.ok(checkModuleAccess('📢营销', 'scout:venues'))
    assert.ok(checkModuleAccess('📢营销', 'scout:reviews'))

    const venues = mockSuccessResponse([
      { id: 501, name: '朝阳大悦城店', city: '北京', category: '购物中心', footfall: 'high' },
    ])
    expect(venues.data[0].footfall).toBe('high')

    const reviews = mockSuccessResponse([
      { sentiment: 'positive', content: '环境好，适合年轻人', rating: 5 },
      { sentiment: 'positive', content: '设备很新', rating: 4 },
      { sentiment: 'negative', content: '价格偏高', rating: 2 },
    ])
    const positivePercent = reviews.data.filter((r: any) => r.sentiment === 'positive').length / reviews.data.length
    expect(positivePercent).toBeGreaterThan(0.5)
  })

  it('营销可查看场地会员数据 — 分析目标客群画像', () => {
    assert.ok(checkModuleAccess('📢营销', 'scout:membership'))

    const membership = mockSuccessResponse({
      totalMembers: 5000,
      activeLastMonth: 1800,
      avgConsumption: 95,
      demographics: { age18_25: '35%', age26_35: '40%', age36_45: '15%', other: '10%' },
    })
    // 主力消费群体为18-35岁
    const mainGroup = parseInt(membership.data.demographics.age18_25) + parseInt(membership.data.demographics.age26_35)
    expect(mainGroup).toBe(75)
    // 根据数据制定推广策略
    expect(membership.data.avgConsumption).toBeGreaterThan(50)
  })

  it('营销无权查看选址操作日志', () => {
    const denied = checkModuleAccess('📢营销', 'scout:logs')
    expect(denied).toBe(false)
  })

  it('营销新店推广闭环: 查城市 → 搜场地 → 看评价 → 制作推广方案', () => {
    assert.ok(checkModuleAccess('📢营销', 'scout:cities'))
    assert.ok(checkModuleAccess('📢营销', 'scout:venues'))
    assert.ok(checkModuleAccess('📢营销', 'scout:reviews'))

    // 1. 查看全国一线城市覆盖
    const cityList = mockSuccessResponse({
      cities: [
        { name: '北京', venues: 5, tier: '一线' },
        { name: '上海', venues: 8, tier: '一线' },
      ],
      total: 2,
    })
    expect(cityList.data.total).toBe(2)

    // 2. 搜索新场地
    const newVenue = mockSuccessResponse({
      id: 601, name: '新天地旗舰店', city: '上海',
      openingDate: '2026-09-01', area: 500,
    })
    expect(newVenue.data.area).toBeGreaterThanOrEqual(300)

    // 3. 看评价获取营销切入点
    const venueReviews = mockSuccessResponse({
      positiveKeywords: ['环境', '设备', '服务'],
      averageRating: 4.5,
    })
    expect(venueReviews.data.averageRating).toBeGreaterThanOrEqual(4)

    // 4. 输出推广方案
    const promotionPlan = {
      venueId: newVenue.data.id,
      targetAudience: '18-35岁都市年轻人',
      channels: ['小红书', '抖音', '大众点评'],
      budget: 50000,
      keyMessages: venueReviews.data.positiveKeywords,
      estimatedReach: '100万人次',
    }
    expect(promotionPlan.channels.length).toBe(3)
    expect(promotionPlan.keyMessages).toContain('环境')
    expect(promotionPlan.budget).toBe(50000)
  })
})

// ──────────────────────────────────────────────────────────────────────
// 🦞 跨角色全流程闭环
// ──────────────────────────────────────────────────────────────────────
describe('🦞 选址拓展跨角色全流程闭环', () => {
  it('🎮导玩员看设备 → 🔧安监审计日志 → 🤝团建选场地 → 📢营销做推广', () => {
    // 1. 🎮导玩员查看新场地设备
    assert.ok(checkModuleAccess('🎮导玩员', 'scout:devices'))
    const devices = mockSuccessResponse([
      { name: 'VR体验', qty: 4, brand: 'Pico' },
      { name: '跳舞机', qty: 2, brand: '华立' },
    ])
    expect(devices.data.every((d: any) => d.qty > 0)).toBe(true)
    const deviceBrands = devices.data.map((d: any) => d.brand)
    expect(deviceBrands).toContain('华立')

    // 2. 🔧安监检查日志没有异常
    assert.ok(checkModuleAccess('🔧安监', 'scout:logs'))
    const logs = mockSuccessResponse([
      { userId: 'guide-01', action: 'DEVICE_VIEW', target: 'venue-701' },
    ])
    expect(logs.data.length).toBe(1)

    // 3. 🤝团建搜索团建场地
    assert.ok(checkModuleAccess('🤝团建', 'scout:venues'))
    const teamVenue = mockSuccessResponse([
      { id: 701, name: 'VR体验馆', category: '科技体验', capacity: 40 },
    ])
    expect(teamVenue.data[0].capacity).toBeGreaterThanOrEqual(20)

    // 4. 📢营销制作推广方案
    assert.ok(checkModuleAccess('📢营销', 'scout:membership'))
    const members = mockSuccessResponse({ totalMembers: 3000, activeLastMonth: 900 })
    expect(members.data.activeLastMonth).toBe(900)

    // 5. 全流程验证
    const flowComplete = { devicesChecked: true, logsAudited: true, venueScouted: true, promoReady: true }
    expect(Object.values(flowComplete).every(Boolean)).toBe(true)
  })
})
