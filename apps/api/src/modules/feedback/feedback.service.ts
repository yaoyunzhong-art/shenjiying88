/**
 * 用户反馈/评价管理 - Service (V23)
 *
 * 核心能力:
 * - 反馈提交 (投诉/建议/评价/问题报告)
 * - 反馈列表/详情/筛选/分页
 * - 回复反馈
 * - 更新反馈状态/分配处理人
 * - 反馈统计
 */

import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common'
import type {
  Feedback,
  FeedbackType,
  FeedbackStatus,
  FeedbackSeverity,
  FeedbackSource,
  FeedbackTag,
  ReplyRecord,
  FeedbackStats,
  FeedbackQuery,
  FeedbackPage,
} from './feedback.entity'

@Injectable()
export class FeedbackService {
  private readonly feedbacks = new Map<string, Feedback>()

  constructor() {
    this.seed()
  }

  // ============ 1. 提交反馈 ============

  create(input: {
    type: FeedbackType
    content: string
    title: string
    source: FeedbackSource
    severity: FeedbackSeverity
    tags: FeedbackTag[]
    userId: string
    userName: string
    userContact?: string
    storeId?: string
    orderId?: string
    attachments?: string[]
    rating?: number
  }): Feedback {
    if (!input.userId || !input.userId.trim()) throw new BadRequestException('提交者ID不能为空')
    if (!input.content || !input.content.trim()) throw new BadRequestException('反馈内容不能为空')
    if (!input.title || !input.title.trim()) throw new BadRequestException('反馈标题不能为空')
    if (input.type === 'rating') {
      if (input.rating === undefined || input.rating === null) throw new BadRequestException('评价类型必须提供评分')
      if (input.rating < 1 || input.rating > 5) throw new BadRequestException('评分必须在 1-5 之间')
    }

    const id = `fb-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    const seedCount = this.feedbacks.size
    const feedbackNo = `FB-${String(seedCount + 1).padStart(6, '0')}`
    const now = new Date().toISOString()

    const feedback: Feedback = {
      id,
      feedbackNo,
      type: input.type,
      content: input.content.trim(),
      title: input.title.trim(),
      status: 'pending',
      source: input.source,
      severity: input.severity,
      tags: input.tags,
      userId: input.userId,
      userName: input.userName,
      userContact: input.userContact,
      storeId: input.storeId,
      orderId: input.orderId,
      attachments: input.attachments ?? [],
      rating: input.type === 'rating' ? input.rating : undefined,
      replies: [],
      assignedTo: undefined,
      assignedToName: undefined,
      resolution: undefined,
      resolvedAt: undefined,
      createdAt: now,
      updatedAt: now,
    }

    this.feedbacks.set(id, feedback)
    return feedback
  }

  // ============ 2. 查询反馈 ============

  query(query: FeedbackQuery): FeedbackPage {
    const page = query.page ?? 1
    const pageSize = query.pageSize ?? 20

    let items = Array.from(this.feedbacks.values())

    // 筛选
    if (query.type) items = items.filter((f) => f.type === query.type)
    if (query.status) items = items.filter((f) => f.status === query.status)
    if (query.severity) items = items.filter((f) => f.severity === query.severity)
    if (query.source) items = items.filter((f) => f.source === query.source)
    if (query.storeId) items = items.filter((f) => f.storeId === query.storeId)
    if (query.userId) items = items.filter((f) => f.userId === query.userId)
    if (query.tags && query.tags.length > 0) {
      items = items.filter((f) => query.tags!.some((t) => f.tags.includes(t as FeedbackTag)))
    }
    if (query.fromDate) items = items.filter((f) => f.createdAt >= query.fromDate!)
    if (query.toDate) items = items.filter((f) => f.createdAt <= query.toDate!)
    if (query.keyword) {
      const kw = query.keyword.toLowerCase()
      items = items.filter(
        (f) =>
          f.title.toLowerCase().includes(kw) ||
          f.content.toLowerCase().includes(kw) ||
          f.feedbackNo.toLowerCase().includes(kw) ||
          (f.userName && f.userName.toLowerCase().includes(kw)),
      )
    }

    // 按创建时间倒序
    items.sort((a, b) => b.createdAt.localeCompare(a.createdAt))

    const total = items.length
    const totalPages = Math.ceil(total / pageSize)
    const start = (page - 1) * pageSize
    const paged = items.slice(start, start + pageSize)

    return { items: paged, total, page, pageSize, totalPages }
  }

  getById(id: string): Feedback {
    const feedback = this.feedbacks.get(id)
    if (!feedback) throw new NotFoundException(`反馈 ${id} 不存在`)
    return feedback
  }

  getByFeedbackNo(feedbackNo: string): Feedback | null {
    for (const fb of this.feedbacks.values()) {
      if (fb.feedbackNo === feedbackNo) return fb
    }
    return null
  }

  // ============ 3. 回复反馈 ============

  reply(id: string, input: {
    content: string
    repliedBy: string
    repliedByName: string
    isSystem?: boolean
  }): Feedback {
    const feedback = this.getById(id)
    if (!input.content || !input.content.trim()) throw new BadRequestException('回复内容不能为空')
    if (!input.repliedBy || !input.repliedBy.trim()) throw new BadRequestException('回复人ID不能为空')

    const reply: ReplyRecord = {
      id: `reply-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      content: input.content.trim(),
      repliedBy: input.repliedBy,
      repliedByName: input.repliedByName,
      repliedAt: new Date().toISOString(),
      isSystem: input.isSystem ?? false,
    }

    feedback.replies.push(reply)

    // 如果当前是 pending，回复时自动改为 processing
    if (feedback.status === 'pending') {
      feedback.status = 'processing'
    }

    feedback.updatedAt = reply.repliedAt
    this.feedbacks.set(id, feedback)
    return feedback
  }

  // ============ 4. 更新反馈 ============

  update(id: string, patch: {
    status?: FeedbackStatus
    severity?: FeedbackSeverity
    assignedTo?: string
    assignedToName?: string
    resolution?: string
    tags?: FeedbackTag[]
    repliedBy?: string
    repliedByName?: string
  }): Feedback {
    const feedback = this.getById(id)
    const oldStatus = feedback.status

    if (patch.status !== undefined) feedback.status = patch.status
    if (patch.severity !== undefined) feedback.severity = patch.severity
    if (patch.assignedTo !== undefined) feedback.assignedTo = patch.assignedTo
    if (patch.assignedToName !== undefined) feedback.assignedToName = patch.assignedToName
    if (patch.resolution !== undefined) feedback.resolution = patch.resolution
    if (patch.tags !== undefined) feedback.tags = patch.tags

    // 标记解决时间
    if (patch.status === 'resolved' && !feedback.resolvedAt) {
      feedback.resolvedAt = new Date().toISOString()
    }
    if (patch.status === 'closed' && !feedback.resolvedAt) {
      feedback.resolvedAt = new Date().toISOString()
    }

    // 状态变为 closed 时自动添加系统回复
    if (patch.status === 'closed' && patch.repliedBy && oldStatus !== 'closed') {
      feedback.replies.push({
        id: `reply-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        content: '反馈已关闭',
        repliedBy: patch.repliedBy,
        repliedByName: patch.repliedByName ?? '系统',
        repliedAt: new Date().toISOString(),
        isSystem: true,
      })
    }

    feedback.updatedAt = new Date().toISOString()
    this.feedbacks.set(id, feedback)
    return feedback
  }

  // ============ 5. 删除反馈 ============

  delete(id: string): boolean {
    return this.feedbacks.delete(id)
  }

  // ============ 6. 统计 ============

  getStats(): FeedbackStats {
    const allItems = Array.from(this.feedbacks.values())

    const byType: Record<string, number> = { complaint: 0, suggestion: 0, rating: 0, issue: 0 }
    const byStatus: Record<string, number> = { pending: 0, processing: 0, resolved: 0, closed: 0 }
    const bySeverity: Record<string, number> = { low: 0, medium: 0, high: 0, critical: 0 }
    const bySource: Record<string, number> = { app: 0, miniapp: 0, store_qr: 0, ai_cs: 0, web: 0 }

    let totalRating = 0
    let ratingCount = 0
    const today = new Date().toISOString().slice(0, 10)
    let todayNew = 0

    let totalResponseMinutes = 0
    let responseCount = 0

    for (const fb of allItems) {
      // byType
      if (fb.type in byType) byType[fb.type]++
      // byStatus
      if (fb.status in byStatus) byStatus[fb.status]++
      // bySeverity
      if (fb.severity in bySeverity) bySeverity[fb.severity]++
      // bySource
      if (fb.source in bySource) bySource[fb.source]++

      // rating avg
      if (fb.type === 'rating' && fb.rating !== undefined) {
        totalRating += fb.rating
        ratingCount++
      }

      // todayNew
      if (fb.createdAt.startsWith(today)) todayNew++

      // avg response minutes
      if (fb.replies.length > 0 && !fb.replies[0].isSystem) {
        const created = new Date(fb.createdAt).getTime()
        const firstReply = new Date(fb.replies[0].repliedAt).getTime()
        const diffMinutes = (firstReply - created) / 60000
        if (diffMinutes > 0) {
          totalResponseMinutes += diffMinutes
          responseCount++
        }
      }
    }

    return {
      total: allItems.length,
      byType,
      byStatus,
      bySeverity,
      bySource,
      averageRating: ratingCount > 0 ? Math.round((totalRating / ratingCount) * 10) / 10 : undefined,
      todayNew,
      pending: byStatus.pending,
      processing: byStatus.processing,
      resolved: byStatus.resolved,
      avgResponseMinutes: responseCount > 0 ? Math.round((totalResponseMinutes / responseCount) * 10) / 10 : undefined,
    }
  }

  // ============ 7. 种子数据 ============

  private seed(): void {
    const now = new Date().toISOString()
    const yesterday = new Date(Date.now() - 86400000).toISOString()
    const twoDaysAgo = new Date(Date.now() - 2 * 86400000).toISOString()

    const seedData: Feedback[] = [
      {
        id: 'fb-seed-001', feedbackNo: 'FB-000001',
        type: 'complaint', content: '前台排队时间太长，等了15分钟才轮到', title: '排队时间过长',
        status: 'pending', source: 'app', severity: 'high', tags: ['service', 'staff'],
        userId: 'user-001', userName: '张明', userContact: '138xxxx1234',
        storeId: 'store-001', attachments: [],
        replies: [], createdAt: twoDaysAgo, updatedAt: twoDaysAgo,
      },
      {
        id: 'fb-seed-002', feedbackNo: 'FB-000002',
        type: 'suggestion', content: '建议增加自助下单机器，减少人工等待', title: '建议增加自助下单',
        status: 'processing', source: 'miniapp', severity: 'low', tags: ['service', 'app'],
        userId: 'user-002', userName: '李华', storeId: 'store-002', attachments: [],
        replies: [
          { id: 'reply-seed-1', content: '感谢您的建议，已提交产品部门评估', repliedBy: 'staff-001',
            repliedByName: '王店长', repliedAt: yesterday, isSystem: false },
        ],
        assignedTo: 'pm-001', assignedToName: '产品经理-张',
        createdAt: yesterday, updatedAt: now,
      },
      {
        id: 'fb-seed-003', feedbackNo: 'FB-000003',
        type: 'rating', content: '环境不错，服务态度很好', title: '好评',
        status: 'closed', source: 'store_qr', severity: 'low', tags: ['service', 'environment'],
        userId: 'user-003', userName: '王芳', storeId: 'store-001',
        attachments: [], rating: 5,
        replies: [
          { id: 'reply-seed-2', content: '感谢您的赞赏，欢迎再次光临', repliedBy: 'staff-001',
            repliedByName: '王店长', repliedAt: yesterday, isSystem: false },
        ],
        resolvedAt: yesterday, createdAt: twoDaysAgo, updatedAt: yesterday,
      },
      {
        id: 'fb-seed-004', feedbackNo: 'FB-000004',
        type: 'issue', content: '3号抓娃娃机卡币了，投币不出爪子', title: '3号娃娃机故障',
        status: 'resolved', source: 'app', severity: 'critical', tags: ['device', 'service'],
        userId: 'user-004', userName: '赵小龙', storeId: 'store-001',
        attachments: ['https://img.example.com/device-issue.jpg'],
        replies: [
          { id: 'reply-seed-3', content: '已派工程师前往维修，预计30分钟内处理', repliedBy: 'staff-002',
            repliedByName: '陈维护', repliedAt: yesterday, isSystem: false },
          { id: 'reply-seed-4', content: '设备已修复，可以正常使用', repliedBy: 'staff-002',
            repliedByName: '陈维护', repliedAt: now, isSystem: false },
        ],
        assignedTo: 'tech-001', assignedToName: '技术-刘',
        resolution: '3号娃娃机投币器卡币，已清理并测试正常',
        resolvedAt: now,
        createdAt: twoDaysAgo, updatedAt: now,
      },
      {
        id: 'fb-seed-005', feedbackNo: 'FB-000005',
        type: 'suggestion', content: '建议增加更多亲子活动', title: '亲子活动建议',
        status: 'pending', source: 'miniapp', severity: 'low', tags: ['service', 'other'],
        userId: 'user-005', userName: '孙女士', storeId: 'store-003', attachments: [],
        replies: [], createdAt: twoDaysAgo, updatedAt: twoDaysAgo,
      },
      {
        id: 'fb-seed-006', feedbackNo: 'FB-000006',
        type: 'complaint', content: '可乐味道不对，像是稀释过的', title: '饮料质量问题',
        status: 'processing', source: 'app', severity: 'high', tags: ['product', 'service'],
        userId: 'user-006', userName: '周勇', storeId: 'store-002', orderId: 'order-202607-001',
        attachments: [],
        replies: [
          { id: 'reply-seed-5', content: '非常抱歉，我已安排人员检查饮料机，将为您补发一杯', repliedBy: 'staff-003',
            repliedByName: '李店长', repliedAt: now, isSystem: false },
        ],
        assignedTo: 'store-002-mgr', assignedToName: '李店长',
        createdAt: yesterday, updatedAt: now,
      },
    ]

    for (const fb of seedData) {
      this.feedbacks.set(fb.id, fb)
    }
  }
}
