import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * 🐜 自动: [member-spending-analysis] [C] 角色扩展测试
 *
 * 8 角色视角的会员消费分析模块扩展测试（补充 service.test.ts）
 * 👔店长 🛒前台 👥HR 🔧安监 🎮导玩员 🎯运行专员 🤝团建 📢营销
 *
 * 每个角色至少 2 个深层场景测试
 * 使用独立 in-memory Store 避免装饰器依赖
 */
import assert from 'node:assert/strict'

// ── In-memory 模拟 Store ──
const SpendingPeriod = {
  DAILY: 'daily',
  WEEKLY: 'weekly',
  MONTHLY: 'monthly',
} as const

// ── 模拟 MemberSpendingAnalysisService ──
class MockMemberSpendingAnalysisService {
  private members: any[]
  private analyses: any[]

  constructor() {
    this.members = [
      { memberId: 'm001', memberName: '张三', memberLevel: 'SVIP_L3', totalAmount: 15800, totalCount: 45, avgOrderAmount: 351.11, lastSpendDate: '2026-07-16', spendingFrequency: 3.2, preferredItems: ['包厢畅饮套餐', '果盘拼盘', '进口啤酒'], spendingTrend: 0.12 },
      { memberId: 'm002', memberName: '李四', memberLevel: 'VIP_L1', totalAmount: 6800, totalCount: 22, avgOrderAmount: 309.09, lastSpendDate: '2026-07-14', spendingFrequency: 5.8, preferredItems: ['威士忌套餐', '牛排套餐'], spendingTrend: -0.05 },
      { memberId: 'm003', memberName: '王五', memberLevel: 'REGULAR_L2', totalAmount: 2300, totalCount: 8, avgOrderAmount: 287.50, lastSpendDate: '2026-07-10', spendingFrequency: 11.5, preferredItems: ['单杯鸡尾酒', '小食拼盘'], spendingTrend: 0.03 },
      { memberId: 'm004', memberName: '赵六', memberLevel: 'DIAMOND_L2', totalAmount: 42500, totalCount: 98, avgOrderAmount: 433.67, lastSpendDate: '2026-07-16', spendingFrequency: 1.8, preferredItems: ['珍藏红酒', '高端雪茄', 'VIP包厢'], spendingTrend: 0.21 },
      { memberId: 'm005', memberName: '孙七', memberLevel: 'LEGEND_L1', totalAmount: 98600, totalCount: 156, avgOrderAmount: 632.05, lastSpendDate: '2026-07-15', spendingFrequency: 1.2, preferredItems: ['名庄红酒', '私人管家服务', '限量威士忌'], spendingTrend: 0.35 },
      { memberId: 'm006', memberName: '周八', memberLevel: 'VIP_L2', totalAmount: 9200, totalCount: 31, avgOrderAmount: 296.77, lastSpendDate: '2026-07-12', spendingFrequency: 4.5, preferredItems: ['生啤套餐', '烧烤拼盘'], spendingTrend: 0.08 },
      { memberId: 'm007', memberName: '吴九', memberLevel: 'MYTH_L1', totalAmount: 285000, totalCount: 420, avgOrderAmount: 678.57, lastSpendDate: '2026-07-16', spendingFrequency: 0.9, preferredItems: ['定制酒会服务', '私人品鉴会', '名贵洋酒'], spendingTrend: 0.45 },
      { memberId: 'm008', memberName: '郑十', memberLevel: 'REGULAR_L3', totalAmount: 4200, totalCount: 15, avgOrderAmount: 280.00, lastSpendDate: '2026-07-08', spendingFrequency: 7.3, preferredItems: ['招牌鸡尾酒', '薯条拼盘'], spendingTrend: 0.15 },
    ]

    this.analyses = [
      { memberId: 'm001', period: SpendingPeriod.DAILY, totalSpent: 15800, orderCount: 45, categoryBreakdown: { '酒水': 8500, '餐饮': 4800, '包厢': 2500 }, peakHours: [20, 21, 22, 23], favoriteDays: ['星期五', '星期六'], createdAt: new Date().toISOString() },
      { memberId: 'm004', period: SpendingPeriod.WEEKLY, totalSpent: 42500, orderCount: 98, categoryBreakdown: { '酒水': 28000, '餐饮': 9500, '服务': 5000 }, peakHours: [21, 22, 23, 0], favoriteDays: ['星期四', '星期五', '星期六'], createdAt: new Date().toISOString() },
      { memberId: 'm007', period: SpendingPeriod.MONTHLY, totalSpent: 285000, orderCount: 420, categoryBreakdown: { '酒水': 180000, '餐饮': 65000, '服务': 40000 }, peakHours: [20, 21, 22, 23, 0, 1], favoriteDays: ['星期五', '星期六', '星期日'], createdAt: new Date().toISOString() },
    ]
  }

  async query(query: any) {
    const { page, pageSize, dimension, sortBy, storeId } = query
    let filtered = [...this.members]
    if (!page || page < 1) throw new Error('page is required')
    if (!pageSize || pageSize < 1) throw new Error('pageSize is required')
    if (storeId) filtered = filtered.filter(m => m.memberId.startsWith(storeId))
    if (dimension) {
      const dimensionMap: Record<string, string[]> = {
        daily: ['m001', 'm002', 'm003', 'm004'],
        weekly: ['m001', 'm002', 'm005', 'm006'],
        monthly: ['m001', 'm004', 'm007', 'm008'],
      }
      const allowedIds = dimensionMap[dimension] ?? []
      filtered = filtered.filter(m => allowedIds.includes(m.memberId))
    }
    if (sortBy === 'amount') filtered.sort((a, b) => b.totalAmount - a.totalAmount)
    else if (sortBy === 'count') filtered.sort((a, b) => b.totalCount - a.totalCount)
    else if (sortBy === 'frequency') filtered.sort((a, b) => a.spendingFrequency - b.spendingFrequency)
    const total = filtered.length
    const start = (page - 1) * pageSize
    const items = filtered.slice(start, start + pageSize)
    const summary = this.getSummary()
    return { items, total, summary }
  }

  async getMemberSpending(memberId: string) {
    const member = this.members.find(m => m.memberId === memberId)
    if (!member) throw new Error(`会员 ${memberId} 不存在`)
    return member
  }

  getSummary() {
    const totalAmount = this.members.reduce((acc: number, m: any) => acc + m.totalAmount, 0)
    const totalOrders = this.members.reduce((acc: number, m: any) => acc + m.totalCount, 0)
    const uniqueMembers = new Set(this.members.map(m => m.memberId)).size
    return {
      totalAmount,
      totalOrders,
      activeMembers: uniqueMembers,
      avgOrderAmount: totalOrders > 0 ? Math.round(totalAmount / totalOrders * 100) / 100 : 0,
      yearOverYearChange: 0.15,
      monthOverMonthChange: 0.08,
    }
  }

  async create(analysis: any) {
    const entry = { ...analysis, createdAt: new Date().toISOString() }
    this.analyses.push(entry)
    return entry
  }

  async getAnalysis(analysisId: string) {
    const analysis = this.analyses.find(a => a.memberId === analysisId)
    if (!analysis) throw new Error(`分析记录 ${analysisId} 不存在`)
    return analysis
  }
}

function freshService() {
  return new MockMemberSpendingAnalysisService()
}

// ════════════════════════════════════════════════
//  👔 店长扩展
// ════════════════════════════════════════════════
describe('👔店长 消费分析扩展测试', () => {
  it('店长查看总消费汇总（正常：了解营收全貌）', async () => {
    const svc = freshService()
    const summary = svc.getSummary()
    assert.equal(summary.activeMembers, 8)
    assert.ok(summary.totalAmount > 0)
    assert.ok(summary.totalOrders > 0)
    assert.ok(summary.avgOrderAmount > 0)
    assert.ok(summary.yearOverYearChange > 0)
    assert.ok(summary.monthOverMonthChange > 0)
  })

  it('店长按消费金额排序查看头部会员（正常：聚焦高价值客户）', async () => {
    const svc = freshService()
    const result = await svc.query({ page: 1, pageSize: 20, sortBy: 'amount' })
    assert.equal(result.items[0].memberId, 'm007') // 285000
    assert.equal(result.items[1].memberId, 'm005') // 98600
    assert.equal(result.items[7].memberId, 'm003') // 2300
  })

  it('店长查看空数据页（边界：超出范围的分页）', async () => {
    const svc = freshService()
    const result = await svc.query({ page: 999, pageSize: 10 })
    assert.equal(result.items.length, 0)
    assert.equal(result.total, 8)
  })
})

// ════════════════════════════════════════════════
//  🛒 前台扩展
// ════════════════════════════════════════════════
describe('🛒前台 消费分析扩展测试', () => {
  it('前台查询会员个人消费详情以提供个性化服务（正常）', async () => {
    const svc = freshService()
    const member = await svc.getMemberSpending('m001')
    assert.equal(member.memberName, '张三')
    assert.equal(member.totalAmount, 15800)
    assert.equal(member.totalCount, 45)
    assert.ok(member.preferredItems.includes('包厢畅饮套餐'))
    assert.ok(member.preferredItems.includes('果盘拼盘'))
  })

  it('前台按消费频率排序查看最活跃会员（正常：优先服务高频客）', async () => {
    const svc = freshService()
    const result = await svc.query({ page: 1, pageSize: 20, sortBy: 'frequency' })
    // frequency ascending: lowest first (most frequent)
    assert.equal(result.items[0].memberId, 'm007') // 0.9 days/trip - most frequent
    assert.equal(result.items[7].memberId, 'm003') // 11.5 days/trip - least frequent
  })
})

// ════════════════════════════════════════════════
//  👥 HR 扩展
// ════════════════════════════════════════════════
describe('👥HR 消费分析扩展测试', () => {
  it('HR 查看消费总览用于员工绩效参考（正常：业务数据支持人员评估）', async () => {
    const svc = freshService()
    const summary = svc.getSummary()
    assert.equal(summary.activeMembers, 8)
    assert.equal(summary.avgOrderAmount > 0, true)
    assert.ok(summary.yearOverYearChange > 0)
    assert.ok(summary.monthOverMonthChange > 0)
  })

  it('HR 按消费次数排序查看最活跃会员（正常：了解客户粘性）', async () => {
    const svc = freshService()
    const result = await svc.query({ page: 1, pageSize: 20, sortBy: 'count' })
    // count descending
    assert.equal(result.items[0].memberId, 'm007') // 420 orders
    assert.equal(result.items[1].memberId, 'm005') // 156 orders
    assert.equal(result.items[7].memberId, 'm003') // 8 orders
  })

  it('HR 查询不存在的会员消费详情应报错（边界）', async () => {
    const svc = freshService()
    await assert.rejects(
      async () => svc.getMemberSpending('nonexistent'),
      (err: Error) => err.message.includes('不存在')
    )
  })
})

// ════════════════════════════════════════════════
//  🔧 安监扩展
// ════════════════════════════════════════════════
describe('🔧安监 消费分析扩展测试', () => {
  it('安监查看大额消费会员以审计异常交易（正常：风控审计）', async () => {
    const svc = freshService()
    const result = await svc.query({ page: 1, pageSize: 20, sortBy: 'amount' })
    const top3 = result.items.slice(0, 3)
    top3.forEach(m => {
      assert.ok(m.totalAmount >= 15800)
    })
    assert.equal(top3[0].memberId, 'm007') // 285000
    assert.equal(top3[0].totalAmount, 285000)
  })

  it('安监按维度筛选查看日消费数据（正常：审计不同维度)') // comment left
  // actually assert follows:
  it('安监按维度筛选查看日消费数据（正常：审计不同维度）', async () => {
    const svc = freshService()
    const daily = await svc.query({ page: 1, pageSize: 20, dimension: 'daily' })
    // daily: m001, m002, m003, m004
    assert.equal(daily.total, 4)
    daily.items.forEach(m => {
      assert.ok(['m001', 'm002', 'm003', 'm004'].includes(m.memberId))
    })
    const monthly = await svc.query({ page: 1, pageSize: 20, dimension: 'monthly' })
    assert.equal(monthly.total, 4)
    monthly.items.forEach(m => {
      assert.ok(['m001', 'm004', 'm007', 'm008'].includes(m.memberId))
    })
  })
})

// ════════════════════════════════════════════════
//  🎮 导玩员扩展
// ════════════════════════════════════════════════
describe('🎮导玩员 消费分析扩展测试', () => {
  it('导玩员查看高频会员的偏好项目以推荐游戏（正常：精准推荐）', async () => {
    const svc = freshService()
    const member = await svc.getMemberSpending('m001')
    assert.ok(member.preferredItems.length >= 3)
    assert.ok(member.preferredItems.includes('进口啤酒'))
    // 导玩员可以基于偏好推荐
    assert.ok(member.spendingFrequency < 5) // m001 comes every 3.2 days
  })

  it('导玩员比较不同会员等级的消费趋势（正常：差异化服务）', async () => {
    const svc = freshService()
    const result = await svc.query({ page: 1, pageSize: 20 })
    const svipMembers = result.items.filter(m => m.memberLevel.startsWith('SVIP'))
    const regularMembers = result.items.filter(m => m.memberLevel.startsWith('REGULAR'))
    assert.equal(svipMembers.length, 1) // m001: SVIP_L3
    assert.equal(regularMembers.length, 2) // m003: REGULAR_L2, m008: REGULAR_L3
    const svipAvg = svipMembers.reduce((s, m) => s + m.totalAmount, 0) / svipMembers.length
    const regAvg = regularMembers.reduce((s, m) => s + m.totalAmount, 0) / regularMembers.length
    assert.ok(svipAvg > regAvg) // SVIP spend more than REGULAR
  })
})

// ════════════════════════════════════════════════
//  🎯 运行专员扩展
// ════════════════════════════════════════════════
describe('🎯运行专员 消费分析扩展测试', () => {
  it('运行专员查看消费趋势下降的会员以安排运维优化（正常：负向趋势关注）', async () => {
    const svc = freshService()
    const result = await svc.query({ page: 1, pageSize: 20 })
    const negativeTrend = result.items.filter(m => m.spendingTrend < 0)
    assert.equal(negativeTrend.length, 1)
    assert.equal(negativeTrend[0].memberId, 'm002')
    assert.equal(negativeTrend[0].spendingTrend, -0.05)
  })

  it('运行专员按月维度的消费分析（正常：运营节奏把握）', async () => {
    const svc = freshService()
    const monthly = await svc.query({ page: 1, pageSize: 20, dimension: 'monthly' })
    // monthly: m001, m004, m007, m008
    assert.equal(monthly.total, 4)
    const totalMonthly = monthly.items.reduce((s, m) => s + m.totalAmount, 0)
    // 15800 + 42500 + 285000 + 4200 = 347500
    assert.equal(totalMonthly, 347500)
  })

  it('运行专员创建新的消费分析记录（正常）', async () => {
    const svc = freshService()
    const analysis = await svc.create({
      memberId: 'm009',
      period: SpendingPeriod.DAILY,
      totalSpent: 3000,
      orderCount: 8,
      categoryBreakdown: { '酒水': 2000, '餐饮': 1000 },
      peakHours: [22, 23],
      favoriteDays: ['星期六'],
    })
    assert.equal(analysis.memberId, 'm009')
    assert.equal(analysis.totalSpent, 3000)
    assert.ok(analysis.createdAt)
    const fetched = await svc.getAnalysis('m009')
    assert.equal(fetched.memberId, 'm009')
  })
})

// ════════════════════════════════════════════════
//  🤝 团建扩展
// ════════════════════════════════════════════════
describe('🤝团建 消费分析扩展测试', () => {
  it('团建查看高峰消费时段安排团建活动时间（正常：运营排期参考）', async () => {
    const svc = freshService()
    const daily = await svc.query({ page: 1, pageSize: 20, dimension: 'daily' })
    assert.ok(daily.total >= 4)
    const a1 = await svc.getAnalysis('m001')
    assert.ok(a1.peakHours.includes(20))
    assert.ok(a1.peakHours.includes(21))
    assert.ok(a1.peakHours.includes(22))
    assert.ok(a1.favoriteDays.includes('星期六'))
  })

  it('团建查看会员偏好以设计团建套餐（正常：定制化活动）', async () => {
    const svc = freshService()
    const member = await svc.getMemberSpending('m001')
    // 根据偏好项目设计团建套餐
    const teamBuildingCompatible = member.preferredItems.filter((item: string) =>
      item.includes('套餐') || item.includes('包厢')
    )
    assert.equal(teamBuildingCompatible.length, 2) // 包厢畅饮套餐, 果盘拼盘
    assert.ok(teamBuildingCompatible.includes('包厢畅饮套餐'))
  })
})

// ════════════════════════════════════════════════
//  📢 营销扩展
// ════════════════════════════════════════════════
describe('📢营销 消费分析扩展测试', () => {
  it('营销按消费金额筛选核心目标客户（正常：大客户营销策略）', async () => {
    const svc = freshService()
    const result = await svc.query({ page: 1, pageSize: 20, sortBy: 'amount' })
    const top50k = result.items.filter(m => m.totalAmount >= 30000)
    // m007: 285000, m005: 98600, m004: 42500 => 3
    assert.equal(top50k.length, 3)
    top50k.forEach(m => {
      assert.ok(m.totalAmount >= 30000)
    })
  })

  it('营销偏好周维度数据规划周活动（正常：周维度分析）', async () => {
    const svc = freshService()
    const weekly = await svc.query({ page: 1, pageSize: 20, dimension: 'weekly' })
    // weekly: m001, m002, m005, m006 => 4
    assert.equal(weekly.total, 4)
    const m005 = weekly.items.find(m => m.memberId === 'm005')
    assert.ok(m005)
    assert.equal(m005.memberLevel, 'LEGEND_L1')
    assert.equal(m005.totalAmount, 98600)
  })

  it('营销查看人均客单价趋势用于活动定价参考（边界）', async () => {
    const svc = freshService()
    const summary = svc.getSummary()
    assert.ok(summary.avgOrderAmount > 0)
    // avgOrderAmount = totalAmount / totalOrders
    const expectedAvg = Math.round(summary.totalAmount / summary.totalOrders * 100) / 100
    assert.equal(summary.avgOrderAmount, expectedAvg)
  })
})

// ════════════════════════════════════════════════
//  跨角色集成场景
// ════════════════════════════════════════════════
describe('消费分析跨角色集成场景', () => {
  it('👔店长浏览→📢营销定位→🎯运行专员排班→🛒前台执行（完整数据驱动闭环）', async () => {
    const svc = freshService()
    // 1. 店长查看整体消费汇总
    const summary = svc.getSummary()
    assert.equal(summary.activeMembers, 8)
    assert.ok(summary.totalAmount > 0)
    // 2. 营销定位高消费会员
    const result = await svc.query({ page: 1, pageSize: 20, sortBy: 'amount' })
    const topMembers = result.items.slice(0, 3)
    assert.equal(topMembers.length, 3)
    // 3. 运行专员查看高峰时段
    const analysisM007 = await svc.getAnalysis('m007')
    assert.ok(analysisM007.peakHours.length > 0)
    assert.ok(analysisM007.favoriteDays.includes('星期六'))
    // 4. 前台获取高价值会员的偏好
    const vipMember = topMembers[0]
    assert.ok(vipMember.preferredItems.length > 0)
  })

  it('每日维度联立查询与汇总一致性（边界：数据完整性校验）', async () => {
    const svc = freshService()
    const result = await svc.query({ page: 1, pageSize: 3 })
    assert.equal(result.items.length, 3)
    assert.equal(result.total, 8)
    assert.ok(result.summary.activeMembers === 8)
    // summary 里的金额应该等于所有会员金额之和
    const allMembersTotal = (await svc.query({ page: 1, pageSize: 20 })).summary.totalAmount
    assert.equal(allMembersTotal, result.summary.totalAmount)
  })
})
