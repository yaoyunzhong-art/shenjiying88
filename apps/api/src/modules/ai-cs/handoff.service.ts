import { Injectable } from '@nestjs/common'
import { ConversationAdapter } from './datasources/conversation.adapter'
import type { HandoffTicket, HandoffRequest, HandoffResponse, Conversation, Message, HandoffReason } from './ai-cs.entity'

/**
 * Phase-41 T171: HandoffService (人工接管 + Ticket)
 *
 * DR-41-C: 置信度阈值 0.7 自动转人工
 *  - 触发原因: low-confidence / user-request / complex-query / sentiment-negative
 *  - 工单队列: 优先级排序
 *  - 上下文全量传递 (转人工后无信息丢失)
 *
 * 反模式 v4:
 *  - 工单持久化 (生产: Postgres)
 *  - 队列公平调度 (先到先服务)
 */

@Injectable()
export class HandoffService {
  // 内存队列 (生产: Redis Stream / RabbitMQ)
  private queue = new Map<string, HandoffTicket>()
  private ticketCounter = 0

  constructor(private readonly conversationAdapter: ConversationAdapter) {}

  /**
   * 创建转人工工单
   */
  createTicket(req: HandoffRequest): HandoffResponse {
    const conversation = this.conversationAdapter.query(req.tenantId, req.conversationId)
    if (!conversation) {
      throw new Error(`Conversation ${req.conversationId} not found in tenant ${req.tenantId}`)
    }

    const ticketId = `ticket-${++this.ticketCounter}`
    const lastUserMsg = [...conversation.messages].reverse().find(m => m.role === 'user')

    const ticket: HandoffTicket = {
      id: ticketId,
      tenantId: req.tenantId,
      conversationId: req.conversationId,
      reason: req.reason,
      priority: req.priority ?? this.inferPriority(req.reason, conversation),
      status: 'queued',
      agentId: req.agentId,
      summary: this.generateSummary(conversation),
      lastUserMessage: lastUserMsg?.content ?? '',
      context: [...conversation.messages],
      createdAt: new Date().toISOString()
    }

    this.queue.set(ticketId, ticket)
    this.conversationAdapter.updateStatus(req.tenantId, req.conversationId, 'HANDED_OFF')
    if (req.agentId) {
      this.conversationAdapter.updateAgent(req.tenantId, req.conversationId, req.agentId)
    }

    const queuePosition = this.calculateQueuePosition(req.tenantId, ticket.priority)
    return {
      ticket,
      estimatedWaitMs: this.estimateWaitMs(queuePosition),
      queuePosition
    }
  }

  /**
   * 坐席接单
   */
  assignAgent(tenantId: string, ticketId: string, agentId: string): HandoffTicket {
    const ticket = this.queue.get(ticketId)
    if (!ticket || ticket.tenantId !== tenantId) {
      throw new Error(`Ticket ${ticketId} not found in tenant ${tenantId}`)
    }
    ticket.agentId = agentId
    ticket.status = 'assigned'
    ticket.assignedAt = new Date().toISOString()
    return { ...ticket }
  }

  /**
   * 解决工单
   */
  resolve(tenantId: string, ticketId: string, rating?: number): HandoffTicket {
    const ticket = this.queue.get(ticketId)
    if (!ticket || ticket.tenantId !== tenantId) {
      throw new Error(`Ticket ${ticketId} not found in tenant ${tenantId}`)
    }
    ticket.status = 'resolved'
    ticket.resolvedAt = new Date().toISOString()
    if (rating !== undefined) ticket.rating = rating
    this.conversationAdapter.updateStatus(tenantId, ticket.conversationId, 'CLOSED')
    return { ...ticket }
  }

  /**
   * 查询工单
   */
  query(tenantId: string, ticketId: string): HandoffTicket | null {
    const t = this.queue.get(ticketId)
    if (!t || t.tenantId !== tenantId) return null
    return { ...t }
  }

  /**
   * 队列状态 (按租户)
   */
  queueStats(tenantId: string): { queued: number; assigned: number; resolved: number; abandoned: number } {
    const stats = { queued: 0, assigned: 0, resolved: 0, abandoned: 0 }
    for (const t of this.queue.values()) {
      if (t.tenantId !== tenantId) continue
      if (t.status === 'queued') stats.queued++
      else if (t.status === 'assigned' || t.status === 'in-progress') stats.assigned++
      else if (t.status === 'resolved') stats.resolved++
      else if (t.status === 'abandoned') stats.abandoned++
    }
    return stats
  }

  /**
   * 列出待处理工单 (按优先级 + 创建时间)
   */
  listQueued(tenantId: string): HandoffTicket[] {
    const priorityWeight: Record<string, number> = { urgent: 0, high: 1, medium: 2, low: 3 }
    return Array.from(this.queue.values())
      .filter(t => t.tenantId === tenantId && t.status === 'queued')
      .sort((a, b) => {
        const dp = priorityWeight[a.priority] - priorityWeight[b.priority]
        if (dp !== 0) return dp
        return a.createdAt.localeCompare(b.createdAt)
      })
      .map(t => ({ ...t }))
  }

  private generateSummary(conversation: Conversation): string {
    const userMsgs = conversation.messages.filter(m => m.role === 'user')
    const aiMsgs = conversation.messages.filter(m => m.role === 'ai')
    return `用户发起 ${userMsgs.length} 条消息, AI 回复 ${aiMsgs.length} 条。` +
           `状态: ${conversation.status}。` +
           `上下文摘要: ${conversation.context.slice(-3).join(' | ')}`
  }

  private inferPriority(reason: HandoffReason, conversation: Conversation): HandoffTicket['priority'] {
    if (reason === 'sentiment-negative') return 'urgent'
    if (reason === 'user-request') return 'high'
    if (reason === 'complex-query') return 'medium'
    if (reason === 'low-confidence' && conversation.metadata.totalMessages >= 3) return 'medium'
    return 'low'
  }

  private calculateQueuePosition(tenantId: string, priority: HandoffTicket['priority']): number {
    const queued = this.listQueued(tenantId)
    const higherPriorityCount = queued.filter(t => {
      const order = { urgent: 0, high: 1, medium: 2, low: 3 }
      return order[t.priority] < order[priority]
    }).length
    return higherPriorityCount + 1
  }

  private estimateWaitMs(queuePosition: number): number {
    // 假设每个坐席处理 1 张工单需 3 分钟
    return queuePosition * 3 * 60 * 1000
  }
}