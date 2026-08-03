/**
 * 用户反馈/评价管理 - DTO (V23)
 *
 * 请求/响应 DTO 定义
 */

import 'reflect-metadata'

// ============ 创建反馈 ============

export class CreateFeedbackDto {
  type!: 'complaint' | 'suggestion' | 'rating' | 'issue'
  content!: string
  title!: string
  source!: 'app' | 'miniapp' | 'store_qr' | 'ai_cs' | 'web'
  severity!: 'low' | 'medium' | 'high' | 'critical'
  tags!: string[]
  userId!: string
  userName!: string
  userContact?: string
  storeId?: string
  orderId?: string
  attachments?: string[]
  rating?: number
}

// ============ 回复反馈 ============

export class ReplyFeedbackDto {
  content!: string
  repliedBy!: string
  repliedByName!: string
  isSystem?: boolean
}

// ============ 更新反馈 ============

export class UpdateFeedbackDto {
  status?: 'pending' | 'processing' | 'resolved' | 'closed'
  severity?: 'low' | 'medium' | 'high' | 'critical'
  assignedTo?: string
  assignedToName?: string
  resolution?: string
  tags?: string[]
}

// ============ 查询参数 ============

export class QueryFeedbackDto {
  type?: string
  status?: string
  severity?: string
  source?: string
  storeId?: string
  userId?: string
  tags?: string[]
  fromDate?: string
  toDate?: string
  keyword?: string
  page?: number
  pageSize?: number
}

// ============ 反馈统计 ============

export class FeedbackStatsResponseDto {
  total!: number
  byType!: Record<string, number>
  byStatus!: Record<string, number>
  bySeverity!: Record<string, number>
  bySource!: Record<string, number>
  averageRating?: number
  todayNew!: number
  pending!: number
  processing!: number
  resolved!: number
  avgResponseMinutes?: number
}

// ============ 反馈分页响应 ============

export class FeedbackPageDto {
  items!: any[]
  total!: number
  page!: number
  pageSize!: number
  totalPages!: number
}

// ============ 反馈详情响应 ============

export class FeedbackDetailDto {
  id!: string
  feedbackNo!: string
  type!: string
  content!: string
  title!: string
  status!: string
  source!: string
  severity!: string
  tags!: string[]
  userId!: string
  userName!: string
  userContact?: string
  storeId?: string
  orderId?: string
  attachments!: string[]
  rating?: number
  replies!: any[]
  assignedTo?: string
  assignedToName?: string
  resolution?: string
  resolvedAt?: string
  createdAt!: string
  updatedAt!: string
}
