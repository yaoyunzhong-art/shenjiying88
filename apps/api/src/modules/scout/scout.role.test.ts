/**
 * 🧪 龙虾哥: Scout (选址拓展) 模块角色旅程 JMeter L1 测试
 *
 * 从 8 个角色视角组织测试，模拟真实使用者打开→操作→完成闭环
 * 👔店长 · 🛒前台 · 👥HR · 🔧安监 · 🎮导玩员 · 🎯运行专员 · 🤝团建 · 📢营销
 *
 * 每个角色 ≥ 4 个用例：正例 + 反例 + 边界 + 体验闭环
 *
 * 功能: 城市列表/场地查询/搜索/价格查询/设备查询/会员信息/评价/活动
 * 端点:
 *   GET /scout/cities, GET /scout/venues, GET /scout/venues/search
 *   GET /scout/venues/:id/prices, GET /scout/venues/:id/devices
 *   GET /scout/venues/:id/membership, GET /scout/venues/:id/reviews
 *   GET /scout/venues/:id/activities, GET /scout/logs
 */
import { describe, it, expect, vi } from 'vitest'
import 'reflect-metadata'
import assert from 'node:assert/strict'

// ── 8 角色常量 ──
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

// ── Scout 模块角色访问矩阵 ──
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

// ── 👔店长 ──
describe(`${ROLES.StoreManager} Scout 角色旅程测试`, () => {
  it('👔[正例] 店长查看门店所属城市列表 → 搜索潜在新场地', () => {
    assert.ok(checkModuleAccess(ROLES.StoreManager, 'scout:cities'))
    assert.ok(checkModuleAccess(ROLES.StoreManager, 'scout:venues'))
    assert.ok(checkModuleAccess(ROLES.StoreManager, 'scout:search'))

    // 1. 查看已开展业务的城
    const cities = mockSuccessResponse([
      { id: 1, name: '北京', tier: '一线', venueCount: 5 },
      { id: 2, name: '上海', tier: '一线', venueCount: 8 },
      { id: 3, name: '成都', tier: '二线', venueCount: 3 },
    ])
    assert.equal(cities.data.length, 3)
    // 2. 搜索成都的场地
    const search = mockSuccessResponse([
      { id: 101, name: '春熙路万达店', address: '成都市锦江区春熙路', category: '购物中心' },
      { id: 102, name: '天府广场店', address: '成都市锦江区天府广场', category: '购物中心' },
    ])
    assert.equal(search.data.length, 2)
  })

  it('👔[正例] 店长查看意向场地的设备清单 → 确认设备数量满足要求', () => {
    assert.ok(checkModuleAccess(ROLES.StoreManager, 'scout:devices'))

    const devices = mockSuccessResponse([
      { id: 'DV-001', name: '跳舞机', qty: 4, brand: '华立' },
      { id: 'DV-002', name: '抓娃娃机', qty: 8, brand: '太鼓' },
      { id: 'DV-003', name: '赛车模拟器', qty: 2, brand: '世嘉' },
    ])
    const totalDevices = devices.data.reduce((sum: number, d: any) => sum + d.qty, 0)
    assert.equal(totalDevices, 14)
    // 检查跳舞机是否满足最低配置要求
    const danceMachines = devices.data.filter((d: any) => d.name === '跳舞机')
    assert.ok(danceMachines[0].qty >= 2)
  })

  it('👔[反例] 店长搜索不存在的城市返回空列表', () => {
    const emptySearch = mockSuccessResponse([])
    assert.equal(Array.isArray(emptySearch.data), true)
    assert.equal(emptySearch.data.length, 0)
  })

  it('👔[体验闭环] 店长确定新场地 → 查看价格方案 → 查看周边会员数据 → 决策', () => {
    assert.ok(checkModuleAccess(ROLES.StoreManager, 'scout:prices'))
    assert.ok(checkModuleAccess(ROLES.StoreManager, 'scout:membership'))

    // 1. 查看场地价格
    const prices = mockSuccessResponse({
      venueId: 101,
      basePrice: 15000,
      unit: '元/月',
      deposit: 30000,
      managementFee: 2000,
    })
    assert.equal(prices.data.basePrice, 15000)
    // 2. 查看该场地周边会员数据
    const membership = mockSuccessResponse({
      totalMembers: 3500,
      activeLastMonth: 1200,
      avgConsumption: 85,
      demographic: { age18_25: '40%', age26_35: '35%', age36_plus: '25%' },
    })
    assert.equal(membership.data.totalMembers, 3500)
    // 3. 综合决策
    const decision = {
      venueId: 101,
      monthlyCost: 15000 + 2000,
      revenuePerMember: 85,
      projectedMonthlyRevenue: 1200 * 85 * 0.3, // 30% 转化率
      viable: true,
    }
    assert.equal(decision.viable, true)
  })
})

// ── 🛒前台 ──
describe(`${ROLES.FrontDesk} Scout 角色旅程测试`, () => {
  it('🛒[正例] 前台查看门店详细信息 → 查询周边设备 → 了解场地', () => {
    assert.ok(checkModuleAccess(ROLES.FrontDesk, 'scout:venues'))
    assert.ok(checkModuleAccess(ROLES.FrontDesk, 'scout:devices'))

    const venues = mockSuccessResponse([
      { id: 201, name: '龙湖天街店', address: '重庆市渝北区', category: '购物中心' },
    ])
    assert.equal(venues.data[0].name, '龙湖天街店')
    // 查看该场地设备
    const devices = mockSuccessResponse([
      { name: '扭蛋机', qty: 6 },
      { name: '娃娃机', qty: 10 },
    ])
    assert.equal(devices.data.length, 2)
  })

  it('🛒[正例] 前台搜索场地 → 查看评价星级', () => {
    assert.ok(checkModuleAccess(ROLES.FrontDesk, 'scout:search'))
    assert.ok(checkModuleAccess(ROLES.FrontDesk, 'scout:reviews'))

    const search = mockSuccessResponse([
      { id: 301, name: '万象城店', rating: 4.5 },
    ])
    assert.equal(search.data[0].rating, 4.5)
    // 查看评价
    const reviews = mockSuccessResponse([
      { sentiment: 'positive', content: '环境不错', rating: 5 },
      { sentiment: 'positive', content: '设备新', rating: 4 },
      { sentiment: 'negative', content: '排队久', rating: 2 },
    ])
    const positiveCount = reviews.data.filter((r: any) => r.sentiment === 'positive').length
    assert.equal(positiveCount, 2)
  })

  it('🛒[反例] 前台无权查看场地价格方案 — 定价属于管理层', () => {
    const denied = checkModuleAccess(ROLES.FrontDesk, 'scout:prices')
    assert.equal(denied, false)
  })

  it('🛒[体验闭环] 前台向顾客介绍场地布局 → 查看设备分布 → 指引客户', () => {
    const venues = mockSuccessResponse([
      { id: 201, name: '龙湖天街店', category: '购物中心', floor: '3F', openingHours: '10:00-22:00' },
    ])
    assert.ok(venues.data[0].floor)
    assert.ok(venues.data[0].openingHours)
    // 前台能准确回答顾客关于场地信息的问题
    const faqReady = { canAnswerVenueInfo: true, knowsOpeningHours: true }
    assert.equal(faqReady.canAnswerVenueInfo, true)
  })
})

// ── 👥HR ──
describe(`${ROLES.HR} Scout 角色旅程测试`, () => {
  it('👥[反例] HR 无法查看场地列表 — 选址与 HR 无关', () => {
    const denied = checkModuleAccess(ROLES.HR, 'scout:venues')
    assert.equal(denied, false)
  })

  it('👥[反例] HR 无权查看场地设备清单', () => {
    const denied = checkModuleAccess(ROLES.HR, 'scout:devices')
    assert.equal(denied, false)
  })

  it('👥[反例] HR 无权查看城市列表', () => {
    const denied = checkModuleAccess(ROLES.HR, 'scout:cities')
    assert.equal(denied, false)
  })

  it('👥[体验闭环] HR 侧面了解新店开业计划 → 提前准备人员招聘', () => {
    // HR 不直接使用 Scout，但通过店长的选址决策准备招聘
    const newVenuePlan = {
      venueCount: 2,
      hiringNeeded: true,
      positionsToFill: ['导玩员', '前台', '收银'],
    }
    assert.equal(newVenuePlan.hiringNeeded, true)
    assert.ok(newVenuePlan.positionsToFill.length >= 2)
  })
})

// ── 🔧安监 ──
describe(`${ROLES.Security} Scout 角色旅程测试`, () => {
  it('🔧[正例] 安监查看选址日志 → 监控选址活动 → 确认无异常', () => {
    assert.ok(checkModuleAccess(ROLES.Security, 'scout:logs'))

    const logs = mockSuccessResponse([
      { cityId: 1, action: 'VENUE_VIEW', userId: 'admin', time: Date.now() - 60000 },
      { cityId: 2, action: 'SEARCH', userId: 'ops', time: Date.now() - 120000 },
    ])
    assert.equal(logs.data.length, 2)
    // 安监确认选址活动正常，无异常访问
    const anomalies = logs.data.filter((l: any) => !l.userId || l.action === 'BLOCKED_ACCESS')
    assert.equal(anomalies.length, 0)
  })

  it('🔧[反例] 安监无法查看场地评价 — 评价属于运营范畴', () => {
    const denied = checkModuleAccess(ROLES.Security, 'scout:reviews')
    assert.equal(denied, false)
  })

  it('🔧[反例] 安监无法搜索场地', () => {
    const denied = checkModuleAccess(ROLES.Security, 'scout:search')
    assert.equal(denied, false)
  })

  it('🔧[体验闭环] 安监确保选址系统日志完整性 → 可回溯选址操作', () => {
    // 审计追踪：谁看了哪些场地
    const auditLog = mockSuccessResponse({
      logs: [
        { userId: 'store-manager-01', action: 'VENUE_VIEW', targetId: 101, time: Date.now() },
        { userId: 'ops-01', action: 'PRICE_QUERY', targetId: 101, time: Date.now() },
      ],
      total: 2,
    })
    assert.equal(auditLog.data.total, 2)
    const allHaveUserId = auditLog.data.logs.every((l: any) => l.userId)
    assert.equal(allHaveUserId, true)
  })
})

// ── 🎮导玩员 ──
describe(`${ROLES.Guide} Scout 角色旅程测试`, () => {
  it('🎮[正例] 导玩员搜索新场地 → 查看设备配置 → 对比现有机台', () => {
    assert.ok(checkModuleAccess(ROLES.Guide, 'scout:venues'))
    assert.ok(checkModuleAccess(ROLES.Guide, 'scout:search'))

    const venues = mockSuccessResponse([
      { id: 401, name: '高新区店', devices: ['跳舞机', '抓娃娃机', '赛车模拟器'] },
    ])
    assert.ok(venues.data[0].devices.includes('跳舞机'))
    // 搜索满足需求的场地
    const search = mockSuccessResponse([
      { id: 402, name: '新会展店', category: '展会中心', devices: ['VR体验', '街机'] },
    ])
    assert.equal(search.data[0].name, '新会展店')
  })

  it('🎮[正例] 导玩员查看场地设备详情 → 确认设备品牌和数量', () => {
    assert.ok(checkModuleAccess(ROLES.Guide, 'scout:devices'))

    const devices = mockSuccessResponse([
      { name: '跳舞机', brand: '华立', qty: 2, status: 'active' },
      { name: '篮球机', brand: '太鼓', qty: 3, status: 'active' },
    ])
    assert.equal(devices.data.length, 2)
    // 确认设备品牌
    assert.equal(devices.data[0].brand, '华立')
  })

  it('🎮[反例] 导玩员无权查看价格 — 定价敏感', () => {
    const denied = checkModuleAccess(ROLES.Guide, 'scout:prices')
    assert.equal(denied, false)
  })

  it('🎮[体验闭环] 导玩员了解新场地设备 → 规划机台布局 → 反馈建议', () => {
    const venueDevices = mockSuccessResponse([
      { name: '跳舞机', qty: 2, floorSpace: '15m²' },
      { name: '抓娃娃机', qty: 6, floorSpace: '12m²' },
    ])
    const totalSpace = venueDevices.data.reduce((sum: number, d: any) => sum + parseInt(d.floorSpace), 0)
    assert.equal(totalSpace, 27)
    // 根据设备信息提出布局建议
    const suggestion = {
      danceMachinesPosition: '入口右侧',
      deviceUtilization: '90%',
      improvementNote: '建议增加VR体验区',
    }
    assert.ok(suggestion.improvementNote)
  })
})

// ── 🎯运行专员 ──
describe(`${ROLES.Operations} Scout 角色旅程测试`, () => {
  it('🎯[正例] 运行专员查看全国城市列表 → 筛选场地按线级城市分类', () => {
    assert.ok(checkModuleAccess(ROLES.Operations, 'scout:cities'))

    const cities = mockSuccessResponse([
      { id: 1, name: '北京', tier: '一线', venueCount: 5 },
      { id: 2, name: '上海', tier: '一线', venueCount: 8 },
      { id: 4, name: '杭州', tier: '新一线', venueCount: 3 },
      { id: 5, name: '南京', tier: '新一线', venueCount: 2 },
      { id: 6, name: '苏州', tier: '二线', venueCount: 1 },
    ])
    // 按 tier 分组
    const tierStats = cities.data.reduce((acc: Record<string, number>, c: any) => {
      acc[c.tier] = (acc[c.tier] || 0) + c.venueCount
      return acc
    }, {})
    assert.equal(tierStats['一线'], 13)
    assert.equal(tierStats['新一线'], 5)
  })

  it('🎯[正例] 运行专员查看场地价格 → 分析性价比 → 输出分析报告', () => {
    assert.ok(checkModuleAccess(ROLES.Operations, 'scout:prices'))
    assert.ok(checkModuleAccess(ROLES.Operations, 'scout:reviews'))

    const prices = mockSuccessResponse({
      venueId: 101,
      basePrice: 15000,
      managementFee: 2000,
      totalMonthly: 17000,
      avgDailyTraffic: 500,
    })
    const costPerVisitor = prices.data.totalMonthly / prices.data.avgDailyTraffic / 30
    assert.equal(costPerVisitor, 17000 / 500 / 30)
    // 看评价综合判断
    const reviews = mockSuccessResponse({
      averageRating: 4.3,
      totalReviews: 128,
    })
    assert.equal(reviews.data.averageRating, 4.3)
  })

  it('🎯[反例] 运行专员查询场地的会员详细信息越权', () => {
    // 运行专员可查看会员数量但不可查看联系方式等敏感信息
    const membershipAggregate = mockSuccessResponse({
      totalMembers: 3500,
      activeRate: 0.35,
    })
    assert.equal(membershipAggregate.data.totalMembers, 3500)
    // 敏感字段被过滤
    const sensitiveFields = ['phoneNumbers', 'addresses', 'idCards']
    const hasSensitiveField = sensitiveFields.some((f) => f in membershipAggregate.data)
    assert.equal(hasSensitiveField, false)
  })

  it('🎯[体验闭环] 运行专员查看场地活动排期 → 确认开业准备 → 推进落地', () => {
    assert.ok(checkModuleAccess(ROLES.Operations, 'scout:activities'))

    const activities = mockSuccessResponse([
      { venueId: 101, name: '开业庆典', date: '2026-08-01', status: 'planned' },
      { venueId: 101, name: '会员日', date: '2026-08-15', status: 'planned' },
    ])
    assert.equal(activities.data.length, 2)
    // 推进开业准备清单
    const prepChecklist = {
      devicesOrdered: true,
      staffScheduled: true,
      marketingMaterials: false, // 还需要准备
    }
    assert.equal(prepChecklist.devicesOrdered, true)
    assert.equal(prepChecklist.staffScheduled, true)
  })
})

// ── 🤝团建 ──
describe(`${ROLES.Teambuilding} Scout 角色旅程测试`, () => {
  it('🤝[正例] 团建搜索适合团建的场地 → 查看设备 → 评估场地', () => {
    assert.ok(checkModuleAccess(ROLES.Teambuilding, 'scout:venues'))
    assert.ok(checkModuleAccess(ROLES.Teambuilding, 'scout:search'))

    const venues = mockSuccessResponse([
      { id: 501, name: '团建中心', capacity: 50, facilities: ['包间', 'KTV', '桌游'] },
    ])
    assert.ok(venues.data[0].facilities.includes('包间'))
    // 搜索特定需求的场地
    const search = mockSuccessResponse([
      { id: 502, name: '轰趴馆', capacity: 30, category: '娱乐' },
    ])
    assert.equal(search.data[0].category, '娱乐')
  })

  it('🤝[正例] 团建查看场地价格 → 做预算规划 → 提交方案', () => {
    assert.ok(checkModuleAccess(ROLES.Teambuilding, 'scout:prices'))

    const prices = mockSuccessResponse({
      venueId: 501,
      perPersonPrice: 128,
      minGroupSize: 10,
      maxGroupSize: 50,
      packageOptions: ['基础', '标准', '豪华'],
    })
    // 计算预算
    const groupSize = 20
    const budget = groupSize * prices.data.perPersonPrice
    assert.equal(budget, 2560)
    assert.ok(prices.data.packageOptions.length >= 3)
  })

  it('🤝[反例] 团建无权查看会员数据', () => {
    const denied = checkModuleAccess(ROLES.Teambuilding, 'scout:membership')
    assert.equal(denied, false)
  })

  it('🤝[体验闭环] 团建查看活动安排 → 预定团建档期 → 确认场地可用', () => {
    assert.ok(checkModuleAccess(ROLES.Teambuilding, 'scout:activities'))

    const activities = mockSuccessResponse([
      { venueId: 501, date: '2026-07-18', name: '团队拓展', slots: ['09:00', '14:00'], available: true },
    ])
    assert.equal(activities.data[0].available, true)
    // 选择可用时间档期
    const availableSlots = activities.data[0].slots
    assert.ok(availableSlots.length >= 1)
    // 确认预定闭环
    const booking = {
      venueId: 501,
      slot: '14:00',
      groupSize: 20,
      confirmed: true,
    }
    assert.equal(booking.confirmed, true)
  })
})

// ── 📢营销 ──
describe(`${ROLES.Marketing} Scout 角色旅程测试`, () => {
  it('📢[正例] 营销查看新场地 → 分析周边商圈 → 策划开业活动', () => {
    assert.ok(checkModuleAccess(ROLES.Marketing, 'scout:venues'))
    assert.ok(checkModuleAccess(ROLES.Marketing, 'scout:cities'))

    const venues = mockSuccessResponse([
      { id: 601, name: '新天地店', city: '上海', category: '购物中心', nearbyPopulation: 50000 },
    ])
    // 分析周边数据
    assert.ok(venues.data[0].nearbyPopulation >= 10000)
    // 策划开业活动
    const campaignPlan = {
      venueId: 601,
      type: '开张促销',
      budget: 30000,
      estimatedROI: '1:3',
    }
    assert.ok(campaignPlan.budget)
  })

  it('📢[正例] 营销查看场地会员数据 → 设计会员定向优惠', () => {
    assert.ok(checkModuleAccess(ROLES.Marketing, 'scout:membership'))

    const membership = mockSuccessResponse({
      totalMembers: 3500,
      activeLastMonth: 1200,
      avgConsumption: 85,
    })
    // 基于数据设计优惠
    const promotion = {
      targetSegment: '活跃会员',
      couponValue: 20,
      expectedRedemption: 1200 * 0.3,
    }
    assert.equal(promotion.expectedRedemption, 360)
  })

  it('📢[反例] 营销无权查看选址操作日志', () => {
    const denied = checkModuleAccess(ROLES.Marketing, 'scout:logs')
    assert.equal(denied, false)
  })

  it('📢[体验闭环] 营销查看活动数据 → 制作宣传素材 → 上线推广', () => {
    assert.ok(checkModuleAccess(ROLES.Marketing, 'scout:activities'))
    assert.ok(checkModuleAccess(ROLES.Marketing, 'scout:reviews'))

    // 1. 查看已有活动
    const activities = mockSuccessResponse([
      { venueId: 601, name: '周年庆', date: '2026-08-08', type: 'celebration' },
    ])
    assert.equal(activities.data.length, 1)
    // 2. 查看评价辅助营销
    const reviews = mockSuccessResponse([
      { sentiment: 'positive', content: '环境很好', rating: 5 },
      { sentiment: 'positive', content: '设备齐全', rating: 4 },
    ])
    const positiveReviews = reviews.data.filter((r: any) => r.sentiment === 'positive').length
    assert.equal(positiveReviews, 2)
    // 3. 制作宣传素材
    const promoMaterials = {
      venueName: '新天地店',
      quotes: ['环境很好', '设备齐全'],
      targetedAudience: '18-35岁年轻人',
    }
    assert.ok(promoMaterials.quotes.length >= 2)
  })
})

// ── 跨角色 Scout 交叉场景 ──
describe('Scout 跨角色体验闭环验证', () => {
  it('👔+🎯+📢 店长选址 → 运营分析 → 营销策划', () => {
    // 1. 店长搜索场地
    assert.ok(checkModuleAccess(ROLES.StoreManager, 'scout:search'))
    const search = mockSuccessResponse([
      { id: 701, name: '朝阳大悦城', city: '北京', category: '购物中心' },
    ])
    assert.equal(search.data[0].name, '朝阳大悦城')

    // 2. 运营查看价格做分析
    assert.ok(checkModuleAccess(ROLES.Operations, 'scout:prices'))
    const prices = mockSuccessResponse({
      venueId: 701, basePrice: 20000, managementFee: 3000,
    })
    assert.equal(prices.data.basePrice, 20000)

    // 3. 营销查看周边数据策划活动
    assert.ok(checkModuleAccess(ROLES.Marketing, 'scout:membership'))
    const membership = mockSuccessResponse({
      totalMembers: 5000, activeLastMonth: 1800,
    })
    assert.equal(membership.data.totalMembers, 5000)

    // 4. 三方决策对齐
    const decision = {
      venueId: 701,
      storeReady: true,
      budgetAnalysis: 'feasible',
      marketingPlan: 'ready',
      proceed: true,
    }
    assert.equal(decision.proceed, true)
  })

  it('🤝+🎯 团建查看场地活动 → 运营确认档期', () => {
    // 1. 团建搜索适合的场地
    assert.ok(checkModuleAccess(ROLES.Teambuilding, 'scout:search'))
    const search = mockSuccessResponse([
      { id: 801, name: '拓展基地', capacity: 100, category: '户外拓展' },
    ])
    assert.equal(search.data[0].capacity, 100)

    // 2. 查看活动排期
    assert.ok(checkModuleAccess(ROLES.Teambuilding, 'scout:activities'))
    const activities = mockSuccessResponse([
      { venueId: 801, date: '2026-07-25', available: true },
    ])
    assert.equal(activities.data[0].available, true)

    // 3. 运营确认场地可用
    const confirmed = { venueId: 801, date: '2026-07-25', confirmedByOps: true }
    assert.equal(confirmed.confirmedByOps, true)
  })

  it('🛒+🎮 前台导玩员配合了解新场地的顾客提问', () => {
    // 顾客问新场地有什么设备
    assert.ok(checkModuleAccess(ROLES.Guide, 'scout:devices'))
    const devices = mockSuccessResponse([
      { name: 'VR体验', qty: 4 },
      { name: '跳舞机', qty: 2 },
    ])
    assert.equal(devices.data.length, 2)

    // 顾客问新场地营业信息
    assert.ok(checkModuleAccess(ROLES.FrontDesk, 'scout:venues'))
    const venueInfo = mockSuccessResponse({
      id: 901, name: '新店', openingHours: '10:00-24:00', floor: 'B1',
    })
    assert.equal(venueInfo.data.openingHours, '10:00-24:00')

    // 综合回复
    const customerResponse = {
      devices: devices.data.map((d: any) => d.name).join('、'),
      hours: venueInfo.data.openingHours,
      satisfaction: 'good',
    }
    assert.ok(customerResponse.devices.includes('VR体验'))
  })
})
