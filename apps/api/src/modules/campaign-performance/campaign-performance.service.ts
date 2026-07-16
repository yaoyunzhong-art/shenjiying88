// campaign-performance.service.ts — Phase3 活动效果评估服务
// 提供活动效果查询、ROI 计算、汇总统计（基于内存 Mock 数据）

import { randomUUID } from 'node:crypto'
import { Injectable } from '@nestjs/common'
import {
  CampaignRecord,
  CampaignStatus,
  CampaignType,
} from './campaign-performance.entity'

// ── In-memory store ──

const campaignStore = new Map<string, CampaignRecord>()

// ── Mock data seeded on first use ──

let seeded = false

function seedMockCampaigns(): void {
  if (seeded) return
  seeded = true

  const now = new Date().toISOString()

  interface MockCampaign {
    name: string
    type: CampaignType
    status: CampaignStatus
    storeId: string
    startDate: string
    endDate: string
    budget: number
    cost: number
    participants: number
    newMembers: number
    revenue: number
    satisfaction: number
  }

  const mockCampaigns: MockCampaign[] = [
    // ── discount（折扣促销）2 条 ──
    {
      name: '夏日冰饮7折狂欢',
      type: CampaignType.Discount,
      status: CampaignStatus.Active,
      storeId: 'store-001',
      startDate: '2026-07-01',
      endDate: '2026-07-31',
      budget: 50000,
      cost: 38000,
      participants: 1250,
      newMembers: 210,
      revenue: 192000,
      satisfaction: 4.5,
    },
    {
      name: '会员日满100减30',
      type: CampaignType.Discount,
      status: CampaignStatus.Completed,
      storeId: 'store-002',
      startDate: '2026-06-15',
      endDate: '2026-06-18',
      budget: 30000,
      cost: 28500,
      participants: 860,
      newMembers: 95,
      revenue: 129000,
      satisfaction: 4.2,
    },
    // ── coupon（优惠券）2 条 ──
    {
      name: '新品尝鲜8折券',
      type: CampaignType.Coupon,
      status: CampaignStatus.Active,
      storeId: 'store-003',
      startDate: '2026-07-10',
      endDate: '2026-08-10',
      budget: 20000,
      cost: 15000,
      participants: 680,
      newMembers: 180,
      revenue: 85000,
      satisfaction: 4.0,
    },
    {
      name: '老客回馈满200送50券',
      type: CampaignType.Coupon,
      status: CampaignStatus.Completed,
      storeId: 'store-001',
      startDate: '2026-05-20',
      endDate: '2026-06-20',
      budget: 25000,
      cost: 24000,
      participants: 720,
      newMembers: 45,
      revenue: 158000,
      satisfaction: 4.3,
    },
    // ── lucky_draw（抽奖）2 条 ──
    {
      name: '年中庆大转盘抽奖',
      type: CampaignType.LuckyDraw,
      status: CampaignStatus.Planned,
      storeId: 'store-004',
      startDate: '2026-08-01',
      endDate: '2026-08-15',
      budget: 40000,
      cost: 0,
      participants: 0,
      newMembers: 0,
      revenue: 0,
      satisfaction: 0,
    },
    {
      name: '五一幸运转转转',
      type: CampaignType.LuckyDraw,
      status: CampaignStatus.Completed,
      storeId: 'store-005',
      startDate: '2026-05-01',
      endDate: '2026-05-07',
      budget: 35000,
      cost: 32000,
      participants: 2100,
      newMembers: 320,
      revenue: 98000,
      satisfaction: 4.6,
    },
    // ── new_user（新用户活动）2 条 ──
    {
      name: '新人首单立减50',
      type: CampaignType.NewUser,
      status: CampaignStatus.Active,
      storeId: 'store-006',
      startDate: '2026-07-01',
      endDate: '2026-09-30',
      budget: 60000,
      cost: 25000,
      participants: 450,
      newMembers: 450,
      revenue: 135000,
      satisfaction: 4.7,
    },
    {
      name: '注册即送100积分',
      type: CampaignType.NewUser,
      status: CampaignStatus.Completed,
      storeId: 'store-002',
      startDate: '2026-04-01',
      endDate: '2026-06-30',
      budget: 45000,
      cost: 42000,
      participants: 980,
      newMembers: 980,
      revenue: 210000,
      satisfaction: 4.1,
    },
    // ── vip（会员专属）2 条 ──
    {
      name: 'VIP双倍积分周',
      type: CampaignType.Vip,
      status: CampaignStatus.Active,
      storeId: 'store-001',
      startDate: '2026-07-15',
      endDate: '2026-07-22',
      budget: 15000,
      cost: 8000,
      participants: 320,
      newMembers: 28,
      revenue: 72000,
      satisfaction: 4.8,
    },
    {
      name: 'VIP生日月专属礼遇',
      type: CampaignType.Vip,
      status: CampaignStatus.Cancelled,
      storeId: 'store-003',
      startDate: '2026-03-01',
      endDate: '2026-03-31',
      budget: 20000,
      cost: 0,
      participants: 0,
      newMembers: 0,
      revenue: 0,
      satisfaction: 0,
    },
  ]

  for (const m of mockCampaigns) {
    const record: CampaignRecord = {
      id: `campaign-${randomUUID()}`,
      name: m.name,
      type: m.type,
      status: m.status,
      storeId: m.storeId,
      startDate: m.startDate,
      endDate: m.endDate,
      budget: m.budget,
      cost: m.cost,
      participants: m.participants,
      newMembers: m.newMembers,
      revenue: m.revenue,
      satisfaction: m.satisfaction,
      createdAt: new Date(m.startDate + 'T00:00:00').toISOString(),
      updatedAt: now,
    }
    campaignStore.set(record.id, record)
  }
}

// ── Helper: 计算 ROI ──

function computeROI(revenue: number, cost: number): number {
  if (cost <= 0) return 0
  return Number(((revenue / cost) * 100).toFixed(2))
}

// ── Helper: 转换为 DTO ──

function toPerformanceDto(record: CampaignRecord) {
  return {
    id: record.id,
    campaignName: record.name,
    type: record.type,
    startDate: record.startDate,
    endDate: record.endDate,
    budget: record.budget,
    actualCost: record.cost,
    participants: record.participants,
    newMembers: record.newMembers,
    revenue: record.revenue,
    roi: computeROI(record.revenue, record.cost),
    satisfaction: record.satisfaction,
  }
}

// ═══════════════════════════════════════════════════════════════════════
// Service
// ═══════════════════════════════════════════════════════════════════════

@Injectable()
export class CampaignPerformanceService {
  // ── 活动列表查询（支持按类型/状态/时间筛选） ──

  listCampaigns(filter?: {
    storeId?: string
    startDate?: string
    endDate?: string
    campaignType?: CampaignType
    status?: CampaignStatus
  }) {
    seedMockCampaigns()
    let records = Array.from(campaignStore.values())

    if (filter?.storeId) {
      records = records.filter((r) => r.storeId === filter.storeId)
    }
    if (filter?.campaignType) {
      records = records.filter((r) => r.type === filter.campaignType)
    }
    if (filter?.status) {
      records = records.filter((r) => r.status === filter.status)
    }
    if (filter?.startDate) {
      records = records.filter((r) => r.startDate >= filter.startDate!)
    }
    if (filter?.endDate) {
      records = records.filter((r) => r.endDate <= filter.endDate!)
    }

    // 按开始日期降序
    records.sort((a, b) => b.startDate.localeCompare(a.startDate))
    return records
  }

  // ── 单条详情 ──

  getCampaign(id: string): CampaignRecord | undefined {
    seedMockCampaigns()
    return campaignStore.get(id)
  }

  // ── 活动效果汇总 ──

  getSummary(filter?: {
    storeId?: string
    startDate?: string
    endDate?: string
    campaignType?: CampaignType
    status?: CampaignStatus
  }) {
    const records = this.listCampaigns(filter)
    const completed = records.filter((r) => r.status === CampaignStatus.Completed || r.status === CampaignStatus.Active)

    const totalCampaigns = records.length
    const totalBudget = records.reduce((s, r) => s + r.budget, 0)
    const totalCost = completed.reduce((s, r) => s + r.cost, 0)
    const totalRevenue = completed.reduce((s, r) => s + r.revenue, 0)
    const totalParticipants = completed.reduce((s, r) => s + r.participants, 0)
    const newMembersAcquired = completed.reduce((s, r) => s + r.newMembers, 0)
    const avgROI = totalCost > 0 ? Number(((totalRevenue / totalCost) * 100).toFixed(2)) : 0

    return {
      totalCampaigns,
      totalBudget,
      totalCost,
      totalRevenue,
      avgROI,
      totalParticipants,
      newMembersAcquired,
    }
  }

  // ── 创建活动记录 ──

  createCampaign(input: {
    name: string
    type: CampaignType
    startDate: string
    endDate: string
    budget: number
    cost: number
    participants: number
    newMembers: number
    revenue: number
    satisfaction: number
  }): CampaignRecord {
    const now = new Date().toISOString()
    const record: CampaignRecord = {
      id: `campaign-${randomUUID()}`,
      name: input.name,
      type: input.type,
      status: CampaignStatus.Planned,
      storeId: 'store-default',
      startDate: input.startDate,
      endDate: input.endDate,
      budget: input.budget,
      cost: input.cost,
      participants: input.participants,
      newMembers: input.newMembers,
      revenue: input.revenue,
      satisfaction: input.satisfaction,
      createdAt: now,
      updatedAt: now,
    }
    campaignStore.set(record.id, record)
    return record
  }

  // ═══════════════════════════════════════════════════════════════════
  // Test helpers
  // ═══════════════════════════════════════════════════════════════════

  resetStoresForTests(): void {
    campaignStore.clear()
    seeded = false
  }
}
