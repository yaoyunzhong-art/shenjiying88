import type { RequestTenantContext } from '../tenant/tenant.types'

/**
 * 联名项目状态枚举
 */
export enum CollabStatus {
  Draft = 'DRAFT',
  Negotiating = 'NEGOTIATING',
  Active = 'ACTIVE',
  Paused = 'PAUSED',
  Completed = 'COMPLETED',
  Cancelled = 'CANCELLED',
}

/**
 * 联名项目实体
 */
export interface CollabProject {
  projectId: string
  tenantContext: RequestTenantContext
  /** 租户 ID（RLS 多租户隔离字段） */
  tenantId?: string
  /** 联名项目名称 */
  name: string
  /** 关联品牌ID */
  brandId: string
  /** 品牌名称（冗余，便于查询展示） */
  brandName?: string
  /** 项目开始日期（ISO 8601） */
  startDate: string
  /** 项目结束日期（ISO 8601） */
  endDate: string
  /** 项目当前状态 */
  status: CollabStatus
  /** 分润比例（品牌方百分比，0-100） */
  revenueShareRate: number
  /** 项目总预算（分，单位：分） */
  budget: number
  /** 项目描述 */
  description?: string
  /** 创建时间 */
  createdAt: string
  /** 更新时间 */
  updatedAt: string
}
