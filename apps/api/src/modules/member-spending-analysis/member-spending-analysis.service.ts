import { Injectable, NotFoundException } from '@nestjs/common'
import { SpendingPeriod, type SpendingAnalysis } from './member-spending-analysis.entity'
import type { MemberSpendingDto, SpendingSummaryDto, SpendingQueryDto, SpendingListDto } from './member-spending-analysis.dto'

const MOCK_MEMBERS: MemberSpendingDto[] = [
  // daily - 4 members
  {
    memberId: 'm001', memberName: '张三', memberLevel: 'SVIP_L3',
    totalAmount: 15800, totalCount: 45, avgOrderAmount: 351.11,
    lastSpendDate: '2026-07-16', spendingFrequency: 3.2,
    preferredItems: ['包厢畅饮套餐', '果盘拼盘', '进口啤酒'],
    spendingTrend: 0.12
  },
  {
    memberId: 'm002', memberName: '李四', memberLevel: 'VIP_L1',
    totalAmount: 6800, totalCount: 22, avgOrderAmount: 309.09,
    lastSpendDate: '2026-07-14', spendingFrequency: 5.8,
    preferredItems: ['威士忌套餐', '牛排套餐'],
    spendingTrend: -0.05
  },
  {
    memberId: 'm003', memberName: '王五', memberLevel: 'REGULAR_L2',
    totalAmount: 2300, totalCount: 8, avgOrderAmount: 287.50,
    lastSpendDate: '2026-07-10', spendingFrequency: 11.5,
    preferredItems: ['单杯鸡尾酒', '小食拼盘'],
    spendingTrend: 0.03
  },
  {
    memberId: 'm004', memberName: '赵六', memberLevel: 'DIAMOND_L2',
    totalAmount: 42500, totalCount: 98, avgOrderAmount: 433.67,
    lastSpendDate: '2026-07-16', spendingFrequency: 1.8,
    preferredItems: ['珍藏红酒', '高端雪茄', 'VIP包厢'],
    spendingTrend: 0.21
  },
  // weekly - 4 members
  {
    memberId: 'm001', memberName: '张三', memberLevel: 'SVIP_L3',
    totalAmount: 15800, totalCount: 45, avgOrderAmount: 351.11,
    lastSpendDate: '2026-07-16', spendingFrequency: 3.2,
    preferredItems: ['包厢畅饮套餐', '果盘拼盘', '进口啤酒'],
    spendingTrend: 0.12
  },
  {
    memberId: 'm002', memberName: '李四', memberLevel: 'VIP_L1',
    totalAmount: 6800, totalCount: 22, avgOrderAmount: 309.09,
    lastSpendDate: '2026-07-14', spendingFrequency: 5.8,
    preferredItems: ['威士忌套餐', '牛排套餐'],
    spendingTrend: -0.05
  },
  {
    memberId: 'm005', memberName: '孙七', memberLevel: 'LEGEND_L1',
    totalAmount: 98600, totalCount: 156, avgOrderAmount: 632.05,
    lastSpendDate: '2026-07-15', spendingFrequency: 1.2,
    preferredItems: ['名庄红酒', '私人管家服务', '限量威士忌'],
    spendingTrend: 0.35
  },
  {
    memberId: 'm006', memberName: '周八', memberLevel: 'VIP_L2',
    totalAmount: 9200, totalCount: 31, avgOrderAmount: 296.77,
    lastSpendDate: '2026-07-12', spendingFrequency: 4.5,
    preferredItems: ['生啤套餐', '烧烤拼盘'],
    spendingTrend: 0.08
  },
  // monthly - 4 members
  {
    memberId: 'm001', memberName: '张三', memberLevel: 'SVIP_L3',
    totalAmount: 15800, totalCount: 45, avgOrderAmount: 351.11,
    lastSpendDate: '2026-07-16', spendingFrequency: 3.2,
    preferredItems: ['包厢畅饮套餐', '果盘拼盘', '进口啤酒'],
    spendingTrend: 0.12
  },
  {
    memberId: 'm004', memberName: '赵六', memberLevel: 'DIAMOND_L2',
    totalAmount: 42500, totalCount: 98, avgOrderAmount: 433.67,
    lastSpendDate: '2026-07-16', spendingFrequency: 1.8,
    preferredItems: ['珍藏红酒', '高端雪茄', 'VIP包厢'],
    spendingTrend: 0.21
  },
  {
    memberId: 'm007', memberName: '吴九', memberLevel: 'MYTH_L1',
    totalAmount: 285000, totalCount: 420, avgOrderAmount: 678.57,
    lastSpendDate: '2026-07-16', spendingFrequency: 0.9,
    preferredItems: ['定制酒会服务', '私人品鉴会', '名贵洋酒'],
    spendingTrend: 0.45
  },
  {
    memberId: 'm008', memberName: '郑十', memberLevel: 'REGULAR_L3',
    totalAmount: 4200, totalCount: 15, avgOrderAmount: 280.00,
    lastSpendDate: '2026-07-08', spendingFrequency: 7.3,
    preferredItems: ['招牌鸡尾酒', '薯条拼盘'],
    spendingTrend: 0.15
  }
]

const MOCK_SPENDING_ANALYSES: SpendingAnalysis[] = [
  {
    memberId: 'm001', period: SpendingPeriod.DAILY,
    totalSpent: 15800, orderCount: 45,
    categoryBreakdown: { '酒水': 8500, '餐饮': 4800, '包厢': 2500 },
    peakHours: [20, 21, 22, 23],
    favoriteDays: ['星期五', '星期六'],
    createdAt: new Date().toISOString()
  },
  {
    memberId: 'm004', period: SpendingPeriod.WEEKLY,
    totalSpent: 42500, orderCount: 98,
    categoryBreakdown: { '酒水': 28000, '餐饮': 9500, '服务': 5000 },
    peakHours: [21, 22, 23, 0],
    favoriteDays: ['星期四', '星期五', '星期六'],
    createdAt: new Date().toISOString()
  },
  {
    memberId: 'm007', period: SpendingPeriod.MONTHLY,
    totalSpent: 285000, orderCount: 420,
    categoryBreakdown: { '酒水': 180000, '餐饮': 65000, '服务': 40000 },
    peakHours: [20, 21, 22, 23, 0, 1],
    favoriteDays: ['星期五', '星期六', '星期日'],
    createdAt: new Date().toISOString()
  }
]

@Injectable()
export class MemberSpendingAnalysisService {
  private readonly members: MemberSpendingDto[] = MOCK_MEMBERS
  private readonly analyses: SpendingAnalysis[] = MOCK_SPENDING_ANALYSES

  /**
   * 查询会员消费记录列表（分页）
   */
  async query(query: SpendingQueryDto): Promise<SpendingListDto> {
    const { page, pageSize, dimension, sortBy, storeId } = query
    let filtered = [...this.members]

    if (storeId) {
      filtered = filtered.filter(m => m.memberId.startsWith(storeId))
    }

    if (dimension) {
      // 模拟维度过滤：实际场景会按日/周/月聚合不同数据
      const dimensionMap: Record<string, string[]> = {
        daily: ['m001', 'm002', 'm003', 'm004'],
        weekly: ['m001', 'm002', 'm005', 'm006'],
        monthly: ['m001', 'm004', 'm007', 'm008']
      }
      const allowedIds = dimensionMap[dimension] ?? []
      filtered = filtered.filter(m => allowedIds.includes(m.memberId))
    }

    if (sortBy === 'amount') {
      filtered.sort((a, b) => b.totalAmount - a.totalAmount)
    } else if (sortBy === 'count') {
      filtered.sort((a, b) => b.totalCount - a.totalCount)
    } else if (sortBy === 'frequency') {
      filtered.sort((a, b) => a.spendingFrequency - b.spendingFrequency)
    }

    const total = filtered.length
    const start = (page - 1) * pageSize
    const items = filtered.slice(start, start + pageSize)

    const summary = this.getSummary()

    return { items, total, summary }
  }

  /**
   * 获取单个会员消费详情
   */
  async getMemberSpending(memberId: string): Promise<MemberSpendingDto> {
    const member = this.members.find(m => m.memberId === memberId)
    if (!member) throw new NotFoundException(`会员 ${memberId} 不存在`)
    return member
  }

  /**
   * 获取消费总览
   */
  getSummary(): SpendingSummaryDto {
    const totalAmount = this.members.reduce((acc, m) => acc + m.totalAmount, 0)
    const totalOrders = this.members.reduce((acc, m) => acc + m.totalCount, 0)
    const uniqueMembers = new Set(this.members.map(m => m.memberId)).size

    return {
      totalAmount,
      totalOrders,
      activeMembers: uniqueMembers,
      avgOrderAmount: totalOrders > 0 ? Math.round(totalAmount / totalOrders * 100) / 100 : 0,
      yearOverYearChange: 0.15,
      monthOverMonthChange: 0.08
    }
  }

  /**
   * 创建分析记录
   */
  async create(analysis: SpendingAnalysis): Promise<SpendingAnalysis> {
    const entry: SpendingAnalysis = {
      ...analysis,
      createdAt: new Date().toISOString()
    }
    this.analyses.push(entry)
    return entry
  }

  /**
   * 获取单个分析记录
   */
  async getAnalysis(analysisId: string): Promise<SpendingAnalysis | null> {
    const analysis = this.analyses.find(a => a.memberId === analysisId)
    if (!analysis) throw new NotFoundException(`分析记录 ${analysisId} 不存在`)
    return analysis
  }
}
