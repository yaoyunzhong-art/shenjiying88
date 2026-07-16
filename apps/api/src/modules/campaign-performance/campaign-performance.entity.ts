// campaign-performance.entity.ts — Phase3 活动效果评估实体
// 定义活动类型、状态枚举及活动记录接口

/**
 * 活动类型枚举
 */
export enum CampaignType {
  Discount = 'discount',
  Coupon = 'coupon',
  LuckyDraw = 'lucky_draw',
  NewUser = 'new_user',
  Vip = 'vip',
}

/**
 * 活动状态枚举
 */
export enum CampaignStatus {
  Planned = 'planned',
  Active = 'active',
  Completed = 'completed',
  Cancelled = 'cancelled',
}

/**
 * 活动记录接口
 */
export interface CampaignRecord {
  id: string
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
  createdAt: string
  updatedAt: string
}
