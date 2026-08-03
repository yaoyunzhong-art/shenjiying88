// notice.controller.ts · 公告通知 Controller
// Phase V23 · 2026-07-21

import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common'

import { TenantGuard } from '../agent/tenant.guard'
import { TenantContext } from '../tenant/tenant.decorator'
import type { RequestTenantContext } from '../tenant/tenant.types'
import {
  toNoticeContract,
  toNoticeListItemContract,
} from './notice.contract'
import {
  CreateNoticeDto,
  ListNoticeQueryDto,
  MarkReadDto,
  UpdateNoticeDto,
} from './notice.dto'
import { NoticeService } from './notice.service'

@UseGuards(TenantGuard)
@Controller('notices')
export class NoticeController {
  constructor(private readonly noticeService: NoticeService) {}

  /**
   * POST /notices — 创建公告草稿
   */
  @Post()
  create(
    @TenantContext() tenantContext: RequestTenantContext,
    @Body() body: CreateNoticeDto,
  ) {
    const notice = this.noticeService.create({
      title: body.title,
      content: body.content,
      scope: body.scope,
      priority: body.priority,
      authorId: body.authorId,
      authorName: body.authorName,
      summary: body.summary,
      coverUrl: body.coverUrl,
      tenantId: body.tenantId ?? tenantContext.tenantId,
      brandId: body.brandId ?? tenantContext.brandId,
      storeId: body.storeId ?? tenantContext.storeId,
      scheduledAt: body.scheduledAt,
      expireAt: body.expireAt,
      stickyOrder: body.stickyOrder,
      tags: body.tags,
    })
    return toNoticeContract(notice, body.authorId)
  }

  /**
   * GET /notices — 查询公告列表
   */
  @Get()
  list(
    @TenantContext() tenantContext: RequestTenantContext,
    @Query() query: ListNoticeQueryDto,
  ) {
    const { items, total } = this.noticeService.list({
      scope: query.scope,
      status: query.status,
      priority: query.priority,
      authorId: query.authorId,
      keyword: query.keyword,
      page: query.page,
      pageSize: query.pageSize,
    })
    return {
      items: items.map((n) => toNoticeListItemContract(n)),
      total,
    }
  }

  /**
   * GET /notices/published — 查询已发布的公告列表
   */
  @Get('published')
  listPublished(
    @Query() query: ListNoticeQueryDto,
  ) {
    const { items, total } = this.noticeService.listPublished({
      scope: query.scope,
      priority: query.priority,
      page: query.page,
      pageSize: query.pageSize,
    })
    return {
      items: items.map((n) => toNoticeListItemContract(n)),
      total,
    }
  }

  /**
   * GET /notices/:id — 获取公告详情
   */
  @Get(':id')
  getById(
    @Param('id') id: string,
    @Query('userId') userId?: string,
  ) {
    const notice = this.noticeService.getById(id)
    return notice ? toNoticeContract(notice, userId) : null
  }

  /**
   * PATCH /notices/:id — 更新公告
   */
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() body: UpdateNoticeDto,
  ) {
    const notice = this.noticeService.update(id, body)
    return toNoticeContract(notice)
  }

  /**
   * DELETE /notices/:id — 删除公告
   */
  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.noticeService.delete(id)
  }

  /**
   * POST /notices/:id/publish — 发布公告
   */
  @Post(':id/publish')
  publish(@Param('id') id: string) {
    const notice = this.noticeService.publish(id)
    return toNoticeContract(notice)
  }

  /**
   * POST /notices/:id/archive — 归档公告
   */
  @Post(':id/archive')
  archive(@Param('id') id: string) {
    const notice = this.noticeService.archive(id)
    return toNoticeContract(notice)
  }

  /**
   * POST /notices/:id/read — 标记已读
   */
  @Post(':id/read')
  markRead(
    @Param('id') id: string,
    @Body() body: MarkReadDto,
  ) {
    const notice = this.noticeService.markRead(id, body.userId)
    return toNoticeContract(notice, body.userId)
  }
}
