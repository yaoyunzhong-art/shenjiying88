/**
 * 用户反馈/评价管理 - Controller (V23)
 *
 * 端点:
 * - 提交反馈 (POST /feedback)
 * - 反馈列表 (GET /feedback)
 * - 反馈详情 (GET /feedback/:id)
 * - 回复反馈 (POST /feedback/:id/reply)
 * - 更新反馈 (PATCH /feedback/:id)
 * - 删除反馈 (DELETE /feedback/:id)
 * - 统计 (GET /feedback/stats)
 * - 今天就到今天新增 (GET /feedback/today)
 */

import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  BadRequestException,
  UseGuards,
} from '@nestjs/common'
import { FeedbackService } from './feedback.service'
import type { Feedback, FeedbackPage, FeedbackQuery, FeedbackTag } from './feedback.entity'
import { TenantGuard } from '../agent/tenant.guard'

@Controller('feedback')
@UseGuards(TenantGuard)
export class FeedbackController {
  constructor(private readonly service: FeedbackService) {}

  // ══════════════════════════════════════════════════════════════
  // 提交反馈
  // ══════════════════════════════════════════════════════════════

  @Post()
  create(@Body() body: {
    type: 'complaint' | 'suggestion' | 'rating' | 'issue'
    content: string
    title: string
    source: 'app' | 'miniapp' | 'store_qr' | 'ai_cs' | 'web'
    severity: 'low' | 'medium' | 'high' | 'critical'
    tags: string[]
    userId: string
    userName: string
    userContact?: string
    storeId?: string
    orderId?: string
    attachments?: string[]
    rating?: number
  }): Feedback {
    return this.service.create(body as any)
  }

  // ══════════════════════════════════════════════════════════════
  // 反馈列表
  // ══════════════════════════════════════════════════════════════

  @Get()
  list(@Query() query: {
    type?: string
    status?: string
    severity?: string
    source?: string
    storeId?: string
    userId?: string
    tags?: string | string[]
    fromDate?: string
    toDate?: string
    keyword?: string
    page?: string
    pageSize?: string
  }): FeedbackPage {
    const q: FeedbackQuery = {}
    if (query.type) q.type = query.type as any
    if (query.status) q.status = query.status as any
    if (query.severity) q.severity = query.severity as any
    if (query.source) q.source = query.source as any
    if (query.storeId) q.storeId = query.storeId
    if (query.userId) q.userId = query.userId
    if (query.tags) {
      const rawTags = Array.isArray(query.tags) ? query.tags : [query.tags]
      q.tags = rawTags as FeedbackTag[]
    }
    if (query.fromDate) q.fromDate = query.fromDate
    if (query.toDate) q.toDate = query.toDate
    if (query.keyword) q.keyword = query.keyword
    if (query.page) q.page = parseInt(query.page, 10) || 1
    if (query.pageSize) q.pageSize = parseInt(query.pageSize, 10) || 20
    return this.service.query(q)
  }

  // ══════════════════════════════════════════════════════════════
  // 反馈统计
  // ══════════════════════════════════════════════════════════════

  @Get('stats')
  stats(): ReturnType<FeedbackService['getStats']> {
    return this.service.getStats()
  }

  // ══════════════════════════════════════════════════════════════
  // 反馈详情
  // ══════════════════════════════════════════════════════════════

  @Get(':id')
  getById(@Param('id') id: string): Feedback {
    const fb = this.service.getById(id)
    if (!fb) throw new BadRequestException(`反馈 ${id} 不存在`)
    return fb
  }

  // ══════════════════════════════════════════════════════════════
  // 回复反馈
  // ══════════════════════════════════════════════════════════════

  @Post(':id/reply')
  reply(
    @Param('id') id: string,
    @Body() body: {
      content: string
      repliedBy: string
      repliedByName: string
      isSystem?: boolean
    },
  ): Feedback {
    return this.service.reply(id, body)
  }

  // ══════════════════════════════════════════════════════════════
  // 更新反馈
  // ══════════════════════════════════════════════════════════════

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() body: {
      status?: 'pending' | 'processing' | 'resolved' | 'closed'
      severity?: 'low' | 'medium' | 'high' | 'critical'
      assignedTo?: string
      assignedToName?: string
      resolution?: string
      tags?: string[]
      repliedBy?: string
      repliedByName?: string
    },
  ): Feedback {
    return this.service.update(id, body as any)
  }

  // ══════════════════════════════════════════════════════════════
  // 删除反馈
  // ══════════════════════════════════════════════════════════════

  @Delete(':id')
  delete(@Param('id') id: string): { success: boolean; id: string } {
    // 检查是否存在
    this.service.getById(id)
    this.service.delete(id)
    return { success: true, id }
  }
}
