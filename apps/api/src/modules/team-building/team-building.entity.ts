// team-building.entity.ts · WP-16 团建营销引擎
// BS-0207~BS-0216

import type { TeamBuildingType } from './team-building.service'

/**
 * 团建推荐请求
 */
export interface RecommendRequest {
  /** 参与人数 */
  participants: number
  /** 预算金额（分） */
  budget: number
  /** 年龄段: youth | adult | mixed */
  ageGroup: 'youth' | 'adult' | 'mixed'
  /** 偏好类型（可选） */
  preferredType?: TeamBuildingType
  /** 租户ID */
  tenantId: string
}

/**
 * 团建推荐结果（含设备校验）
 */
export interface RecommendResult {
  /** 方案ID */
  planId: string
  /** 方案名称 */
  name: string
  /** 方案类型 */
  type: TeamBuildingType
  /** 地点 */
  location: string
  /** 预算（分） */
  budget: number
  /** 匹配得分 0~100 */
  score: number
  /** 设备清单校验结果 */
  equipmentCheck: EquipmentCheckResult
  /** 推荐理由 */
  reason: string
  /** 是否推荐 */
  recommended: boolean
}

/**
 * 设备清单校验结果
 */
export interface EquipmentCheckResult {
  /** 校验通过 */
  passed: boolean
  /** 涉及设备清单 */
  items: EquipmentItem[]
  /** 总需求容量 */
  totalCapacityRequired: number
  /** 可用容量 */
  totalCapacityAvailable: number
  /** 失败原因（不通过时） */
  failReason?: string
}

/**
 * 方案涉及的游戏设备项
 */
export interface EquipmentItem {
  /** 设备名称 */
  name: string
  /** SKU */
  sku: string
  /** 单台容纳人数 */
  capacityPerUnit: number
  /** 需求台数 */
  requiredUnits: number
  /** 可用台数 */
  availableUnits: number
  /** 是否满足 */
  satisfied: boolean
}

/**
 * 团建活动事件
 */
export interface TeamBuildingEvent {
  id: string
  tenantId: string
  planId: string
  /** 活动名称 */
  name: string
  /** 活动日期 YYYY-MM-DD */
  eventDate: string
  /** 参与人数 */
  participants: number
  /** 实际参与人数（活动结束后更新） */
  actualParticipants?: number
  /** 总消费金额（分） */
  totalSpend?: number
  /** 平均满意度 1~5 */
  avgSatisfaction?: number
  /** 状态: scheduled | in_progress | completed | cancelled */
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
  /** 锁定的设备清单 */
  lockedEquipment: LockedEquipment[]
  /** 参与会员ID列表 */
  participantMemberIds: string[]
  /** 备注 */
  remark?: string
  createdAt: string
  updatedAt: string
}

/**
 * 锁定的时段设备
 */
export interface LockedEquipment {
  equipmentName: string
  sku: string
  /** 锁定数量 */
  qty: number
  /** 锁定日期 */
  date: string
  /** 锁定时间段 */
  timeSlot: string
}

/**
 * 团建报告
 */
export interface TeamBuildingReport {
  id: string
  eventId: string
  tenantId: string
  /** 报告标题 */
  title: string
  /** 参与人数 */
  participantCount: number
  /** 总消费（分） */
  totalSpend: number
  /** 人均消费（分） */
  avgSpend: number
  /** 平均满意度 1~5 */
  avgSatisfaction: number
  /** 满意度分布 */
  satisfactionBreakdown: SatisfactionBreakdown
  /** 活动设备使用情况 */
  equipmentUsage: EquipmentUsage[]
  /** CRM同步状态 */
  crmSyncStatus: 'pending' | 'synced' | 'failed'
  /** 备注 */
  remark?: string
  createdAt: string
}

export interface SatisfactionBreakdown {
  count5: number // 非常满意
  count4: number // 满意
  count3: number // 一般
  count2: number // 不满
  count1: number // 非常不满
}

export interface EquipmentUsage {
  name: string
  sku: string
  qty: number
  usageRate: number // 使用率 0~1
}

/**
 * CRM同步记录
 */
export interface CrmSyncRecord {
  id: string
  eventId: string
  memberIds: string[]
  totalSpend: number
  eventName: string
  syncStatus: 'pending' | 'synced' | 'failed'
  syncedAt?: string
  remark?: string
  createdAt: string
}

/**
 * 团建月度看板
 */
export interface TeamBuildingDashboard {
  /** 统计月份 YYYY-MM */
  month: string
  /** 当月活动数 */
  totalEvents: number
  /** 当月总参与人次 */
  totalParticipants: number
  /** 当月总消费（分） */
  totalSpend: number
  /** 人均消费（分） */
  avgSpendPerPerson: number
  /** 平均活动满意度 */
  avgSatisfaction: number
  /** 各类型活动分布 */
  byType: Record<TeamBuildingType, number>
  /** 各类型消费分布 */
  spendByType: Record<string, number>
  /** 月度趋势（近6月） */
  monthlyTrend: MonthlyTrend[]
  /** 方案使用排行 */
  topPlans: TopPlan[]
}

export interface MonthlyTrend {
  month: string
  eventCount: number
  participants: number
  totalSpend: number
}

export interface TopPlan {
  planId: string
  planName: string
  type: TeamBuildingType
  usedCount: number
  totalParticipants: number
  avgSatisfaction: number
}
