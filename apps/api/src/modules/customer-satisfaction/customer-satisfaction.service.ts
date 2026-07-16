import { randomUUID } from 'node:crypto'
import { Injectable } from '@nestjs/common'
import type { RequestTenantContext } from '../tenant/tenant.types'
import { SatisfactionCategory, type CustomerSatisfaction } from './customer-satisfaction.entity'
import type { SatisfactionQueryDto, CreateSatisfactionDto } from './customer-satisfaction.dto'

const satisfactionStore = new Map<string, CustomerSatisfaction>()

function seedMockData() {
  if (satisfactionStore.size > 0) return

  const tenantId = 'default'
  const now = new Date().toISOString()

  const mockData: CustomerSatisfaction[] = [
    {
      id: 'sat-001', tenantId, storeId: 'store-001', customerName: '王小明',
      score: 5, category: SatisfactionCategory.Service,
      comment: '服务态度非常好，店员很热情', visitDate: '2026-07-10', createdAt: now,
    },
    {
      id: 'sat-002', tenantId, storeId: 'store-001', customerName: '李芳',
      score: 4, category: SatisfactionCategory.Device,
      comment: '设备体验不错，但篮球机有点旧了', visitDate: '2026-07-11', createdAt: now,
    },
    {
      id: 'sat-003', tenantId, storeId: 'store-001', customerName: '张强',
      score: 3, category: SatisfactionCategory.Price,
      comment: '价格稍微偏高，希望有更多优惠', visitDate: '2026-07-12', createdAt: now,
    },
    {
      id: 'sat-004', tenantId, storeId: 'store-002', customerName: '刘美丽',
      score: 5, category: SatisfactionCategory.Environment,
      comment: '环境非常干净，氛围很好', visitDate: '2026-07-10', createdAt: now,
    },
    {
      id: 'sat-005', tenantId, storeId: 'store-002', customerName: '陈晓东',
      score: 4, category: SatisfactionCategory.Overall,
      comment: '整体体验不错，会推荐朋友来', visitDate: '2026-07-13', createdAt: now,
    },
    {
      id: 'sat-006', tenantId, storeId: 'store-002', customerName: '赵雪',
      score: 2, category: SatisfactionCategory.Service,
      comment: '排队时间太长，服务速度需要提升', visitDate: '2026-07-14', createdAt: now,
    },
    {
      id: 'sat-007', tenantId, storeId: 'store-003', customerName: '孙大力',
      score: 4, category: SatisfactionCategory.Device,
      comment: 'VR设备效果很棒，很有沉浸感', visitDate: '2026-07-12', createdAt: now,
    },
    {
      id: 'sat-008', tenantId, storeId: 'store-003', customerName: '周文',
      score: 5, category: SatisfactionCategory.Price,
      comment: '性价比很高，会员价很划算', visitDate: '2026-07-11', createdAt: now,
    },
    {
      id: 'sat-009', tenantId, storeId: 'store-003', customerName: '吴美丽',
      score: 3, category: SatisfactionCategory.Environment,
      comment: '空调有点冷，其他都挺好的', visitDate: '2026-07-15', createdAt: now,
    },
    {
      id: 'sat-010', tenantId, storeId: 'store-001', customerName: '郑明',
      score: 4, category: SatisfactionCategory.Overall,
      comment: '总体满意，设备种类丰富，适合家庭娱乐', visitDate: '2026-07-15', createdAt: now,
    },
  ]

  for (const item of mockData) {
    satisfactionStore.set(item.id, item)
  }
}

@Injectable()
export class CustomerSatisfactionService {
  constructor() {
    seedMockData()
  }

  list(
    tenantContext: RequestTenantContext,
    query?: SatisfactionQueryDto,
  ): { items: CustomerSatisfaction[]; total: number } {
    let items = Array.from(satisfactionStore.values())
      .filter((r) => r.tenantId === tenantContext.tenantId)

    if (query?.storeId) {
      items = items.filter((r) => r.storeId === query.storeId)
    }
    if (query?.category) {
      items = items.filter((r) => r.category === query.category)
    }
    if (query?.startDate) {
      items = items.filter((r) => r.visitDate >= query.startDate!)
    }
    if (query?.endDate) {
      items = items.filter((r) => r.visitDate <= query.endDate!)
    }
    if (query?.minScore) {
      items = items.filter((r) => r.score >= query.minScore!)
    }

    items.sort((a, b) => b.visitDate.localeCompare(a.visitDate))
    return { items, total: items.length }
  }

  getById(id: string, tenantContext: RequestTenantContext): CustomerSatisfaction {
    const record = satisfactionStore.get(id)
    if (!record || record.tenantId !== tenantContext.tenantId) {
      throw new Error(`Customer satisfaction ${id} not found`)
    }
    return record
  }

  getSummary(tenantContext: RequestTenantContext) {
    const items = Array.from(satisfactionStore.values())
      .filter((r) => r.tenantId === tenantContext.tenantId)

    if (items.length === 0) {
      return {
        totalResponses: 0,
        avgScore: 0,
        bestCategory: '',
        worstCategory: '',
        scoreDistribution: {},
        responseRate: 0,
      }
    }

    const totalResponses = items.length
    const avgScore = Number((items.reduce((s, r) => s + r.score, 0) / totalResponses).toFixed(1))

    // Score distribution
    const scoreDistribution: Record<string, number> = { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 }
    for (const item of items) {
      const key = String(item.score)
      scoreDistribution[key] = (scoreDistribution[key] || 0) + 1
    }

    // Best and worst category by avg score
    const byCategory: Record<string, { count: number; totalScore: number }> = {}
    for (const item of items) {
      if (!byCategory[item.category]) byCategory[item.category] = { count: 0, totalScore: 0 }
      byCategory[item.category].count++
      byCategory[item.category].totalScore += item.score
    }

    let bestCategory = ''
    let bestAvg = 0
    let worstCategory = ''
    let worstAvg = Infinity
    for (const [category, data] of Object.entries(byCategory)) {
      const avg = data.totalScore / data.count
      if (avg > bestAvg) {
        bestAvg = avg
        bestCategory = category
      }
      if (avg < worstAvg) {
        worstAvg = avg
        worstCategory = category
      }
    }

    // Estimated response rate (mock: assume ~100 total customers per store on avg)
    const storeIds = new Set(items.map((r) => r.storeId))
    const estimatedTotalCustomers = storeIds.size * 100
    const responseRate = Number(((totalResponses / estimatedTotalCustomers) * 100).toFixed(1))

    return {
      totalResponses,
      avgScore,
      bestCategory,
      worstCategory,
      scoreDistribution,
      responseRate,
    }
  }

  create(
    tenantContext: RequestTenantContext,
    input: CreateSatisfactionDto,
  ): CustomerSatisfaction {
    const now = new Date().toISOString()
    const record: CustomerSatisfaction = {
      id: `sat-${randomUUID()}`,
      tenantId: tenantContext.tenantId,
      storeId: input.storeId,
      customerName: input.customerName,
      score: input.score,
      category: input.category,
      comment: input.comment,
      visitDate: input.visitDate,
      createdAt: now,
    }
    satisfactionStore.set(record.id, record)
    return record
  }

  delete(id: string, tenantContext: RequestTenantContext): void {
    const record = satisfactionStore.get(id)
    if (!record || record.tenantId !== tenantContext.tenantId) {
      throw new Error(`Customer satisfaction ${id} not found`)
    }
    satisfactionStore.delete(id)
  }
}
