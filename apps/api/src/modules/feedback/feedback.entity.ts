/**
 * 用户反馈/评价管理 - Entity (V23)
 *
 * 反馈类型:
 * - 投诉 (complaint): 对门店/商品/服务的正式投诉
 * - 建议 (suggestion): 功能/服务/流程改进建议
 * - 评价 (rating): 体验评分+评价内容
 * - 问题报告 (issue): 设备故障/系统问题报告
 *
 * 数据来源:
 * - 小程序/APP 用户直接提交
 * - AI 客服会话总结
 * - 门店扫码评价
 */

/** 反馈类型枚举 */
export type FeedbackType = 'complaint' | 'suggestion' | 'rating' | 'issue'

/** 反馈状态枚举 */
export type FeedbackStatus = 'pending' | 'processing' | 'resolved' | 'closed'

/** 反馈来源枚举 */
export type FeedbackSource = 'app' | 'miniapp' | 'store_qr' | 'ai_cs' | 'web'

/** 反馈严重程度枚举 */
export type FeedbackSeverity = 'low' | 'medium' | 'high' | 'critical'

/** 反馈标签 */
export type FeedbackTag =
  | 'service'      // 服务质量
  | 'product'      // 产品质量
  | 'environment'  // 门店环境
  | 'device'       // 设备故障
  | 'app'          // APP 功能
  | 'staff'        // 员工服务
  | 'price'        // 价格问题
  | 'other'        // 其他

/** 回复记录 */
export interface ReplyRecord {
  id: string
  content: string
  repliedBy: string
  repliedByName: string
  repliedAt: string
  isSystem?: boolean
}

/** 反馈实体 */
export interface Feedback {
  id: string
  /** 反馈编号 */
  feedbackNo: string
  /** 反馈类型 */
  type: FeedbackType
  /** 反馈内容 */
  content: string
  /** 标题/主题 */
  title: string
  /** 状态 */
  status: FeedbackStatus
  /** 来源 */
  source: FeedbackSource
  /** 严重程度 */
  severity: FeedbackSeverity
  /** 标签 */
  tags: FeedbackTag[]
  /** 提交用户 */
  userId: string
  /** 用户昵称 */
  userName: string
  /** 用户联系方式 */
  userContact?: string
  /** 关联门店 */
  storeId?: string
  /** 关联订单 */
  orderId?: string
  /** 附件/图片URL列表 */
  attachments: string[]
  /** 评分 (1-5, 仅 rating 类型) */
  rating?: number
  /** 回复记录 */
  replies: ReplyRecord[]
  /** 处理人 */
  assignedTo?: string
  /** 处理人姓名 */
  assignedToName?: string
  /** 处理备注 */
  resolution?: string
  /** 解决时间 */
  resolvedAt?: string
  /** 创建时间 */
  createdAt: string
  /** 更新时间 */
  updatedAt: string
}

/** 反馈统计 */
export interface FeedbackStats {
  total: number
  byType: Record<FeedbackType, number>
  byStatus: Record<FeedbackStatus, number>
  bySeverity: Record<FeedbackSeverity, number>
  bySource: Record<FeedbackSource, number>
  /** 平均评分 (仅 rating 类型) */
  averageRating?: number
  /** 今日新增 */
  todayNew: number
  /** 未处理 */
  pending: number
  /** 处理中 */
  processing: number
  /** 已解决 */
  resolved: number
  /** 平均响应时间(分钟) */
  avgResponseMinutes?: number
}

/** 反馈查询参数 */
export interface FeedbackQuery {
  type?: FeedbackType
  status?: FeedbackStatus
  severity?: FeedbackSeverity
  source?: FeedbackSource
  storeId?: string
  userId?: string
  tags?: FeedbackTag[]
  fromDate?: string
  toDate?: string
  keyword?: string
  page?: number
  pageSize?: number
}

/** 反馈分页结果 */
export interface FeedbackPage {
  items: Feedback[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}
