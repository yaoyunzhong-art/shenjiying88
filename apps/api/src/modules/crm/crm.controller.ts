/**
 * crm.controller.ts — CRM API 端点
 *
 * 提供客户管理全生命周期能力。
 *
 * 端点:
 *   GET    /api/crm/customers              — 列出客户
 *   POST   /api/crm/customers              — 创建客户
 *   GET    /api/crm/customers/:id           — 查询客户详情
 *   PUT    /api/crm/customers/:id           — 更新客户信息
 *   DELETE /api/crm/customers/:id           — 删除客户
 *   PATCH  /api/crm/customers/:id/score     — 更新客户评分(delta)
 *   PUT    /api/crm/customers/:id/score     — 设置客户评分(直接)
 *   POST   /api/crm/customers/:id/notes     — 添加备注
 *   GET    /api/crm/customers/:id/notes     — 获取备注列表
 *   POST   /api/crm/customers/:id/tags      — 添加标签
 *   DELETE /api/crm/customers/:id/tags/:tag — 移除标签
 *   PATCH  /api/crm/customers/:id/status    — 标记客户状态
 *   POST   /api/crm/customers/:id/interactions — 添加交互记录
 *   GET    /api/crm/customers/:id/interactions — 获取交互记录
 *   POST   /api/crm/customers/:id/tickets   — 创建工单
 *   GET    /api/crm/customers/:id/tickets   — 获取工单列表
 *   PATCH  /api/crm/customers/:id/tickets/:ticketId — 更新工单状态
 *   GET    /api/crm/stats                   — 客户统计
 */

import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common'

import { TenantGuard } from '../agent/tenant.guard'
import {
  CrmService,
  type CrmCustomerStatus,
  type CrmInteraction,
  type TicketPriority,
  type TicketStatus,
  type CreateCustomerDto,
  type UpdateCustomerDto,
} from './crm.service'

// ─── DTOs ───

class ListCustomersQueryDto {
  status?: CrmCustomerStatus
  search?: string
}

class CreateCustomerBodyDto implements CreateCustomerDto {
  name!: string
  email!: string
  phone!: string
  status?: CrmCustomerStatus
}

class UpdateCustomerBodyDto implements UpdateCustomerDto {
  name?: string
  email?: string
  phone?: string
  status?: CrmCustomerStatus
  totalSpentCents?: number
  visitCount?: number
  lastVisitAt?: string
  tags?: string[]
}

class UpdateScoreDto {
  delta!: number
}

class SetScoreDto {
  score!: number
}

class AddInteractionDto {
  type!: CrmInteraction['type']
  summary!: string
  details!: string
  createdBy!: string
}

class CreateTicketDto {
  subject!: string
  description!: string
  priority!: TicketPriority
  assignedTo!: string
}

class UpdateTicketStatusDto {
  status!: TicketStatus
}

class MarkStatusDto {
  status!: CrmCustomerStatus
}

class AddNoteDto {
  content!: string
  createdBy!: string
}

class AddTagDto {
  tag!: string
}

@UseGuards(TenantGuard)
@Controller('api/crm')
export class CrmController {
  constructor(private readonly svc: CrmService) {}

  /**
   * GET /api/crm/customers
   * 列出客户，支持按状态过滤和搜索。
   */
  @Get('customers')
  listCustomers(@Query() query: ListCustomersQueryDto) {
    const customers = this.svc.list(query.status, query.search)
    return { success: true, data: { customers, total: customers.length } }
  }

  /**
   * POST /api/crm/customers
   * 创建新客户。
   */
  @Post('customers')
  @HttpCode(HttpStatus.CREATED)
  createCustomer(@Body() body: CreateCustomerBodyDto) {
    const customer = this.svc.create(body)
    return { success: true, data: customer }
  }

  /**
   * GET /api/crm/customers/:id
   * 查询客户详情。
   */
  @Get('customers/:id')
  getCustomer(@Param('id') id: string) {
    const customer = this.svc.getById(id)
    return { success: true, data: customer }
  }

  /**
   * PUT /api/crm/customers/:id
   * 更新客户信息。
   */
  @Put('customers/:id')
  updateCustomer(@Param('id') id: string, @Body() body: UpdateCustomerBodyDto) {
    const customer = this.svc.update(id, body)
    return { success: true, data: customer }
  }

  /**
   * DELETE /api/crm/customers/:id
   * 删除客户。
   */
  @Delete('customers/:id')
  @HttpCode(HttpStatus.OK)
  deleteCustomer(@Param('id') id: string) {
    this.svc.delete(id)
    return { success: true, message: '客户已删除' }
  }

  // ─── 评分 ───

  /**
   * PATCH /api/crm/customers/:id/score
   * 增量更新客户评分。
   */
  @Patch('customers/:id/score')
  @HttpCode(HttpStatus.OK)
  updateScore(@Param('id') id: string, @Body() body: UpdateScoreDto) {
    const customer = this.svc.updateEngagementScore(id, body.delta)
    return { success: true, data: customer }
  }

  /**
   * PUT /api/crm/customers/:id/score
   * 直接设置客户评分。
   */
  @Put('customers/:id/score')
  setScore(@Param('id') id: string, @Body() body: SetScoreDto) {
    const customer = this.svc.setEngagementScore(id, body.score)
    return { success: true, data: customer }
  }

  // ─── 备注 ───

  /**
   * POST /api/crm/customers/:id/notes
   * 添加客户备注。
   */
  @Post('customers/:id/notes')
  @HttpCode(HttpStatus.CREATED)
  addNote(@Param('id') id: string, @Body() body: AddNoteDto) {
    const note = this.svc.addNote(id, body.content, body.createdBy)
    return { success: true, data: note }
  }

  /**
   * GET /api/crm/customers/:id/notes
   * 获取客户备注列表。
   */
  @Get('customers/:id/notes')
  listNotes(@Param('id') id: string) {
    const notes = this.svc.listNotes(id)
    return { success: true, data: { notes, total: notes.length } }
  }

  // ─── 标签 ───

  /**
   * POST /api/crm/customers/:id/tags
   * 添加客户标签。
   */
  @Post('customers/:id/tags')
  @HttpCode(HttpStatus.CREATED)
  addTag(@Param('id') id: string, @Body() body: AddTagDto) {
    const customer = this.svc.addTag(id, body.tag)
    return { success: true, data: customer }
  }

  /**
   * DELETE /api/crm/customers/:id/tags/:tag
   * 移除客户标签。
   */
  @Delete('customers/:id/tags/:tag')
  @HttpCode(HttpStatus.OK)
  removeTag(@Param('id') id: string, @Param('tag') tag: string) {
    const customer = this.svc.removeTag(id, tag)
    return { success: true, data: customer }
  }

  // ─── 状态标记 ───

  /**
   * PATCH /api/crm/customers/:id/status
   * 标记客户状态。
   */
  @Patch('customers/:id/status')
  @HttpCode(HttpStatus.OK)
  markStatus(@Param('id') id: string, @Body() body: MarkStatusDto) {
    const customer = this.svc.markCustomer(id, body.status)
    return { success: true, data: customer }
  }

  // ─── 交互记录 ───

  /**
   * POST /api/crm/customers/:id/interactions
   * 添加客户交互记录。
   */
  @Post('customers/:id/interactions')
  @HttpCode(HttpStatus.CREATED)
  addInteraction(@Param('id') id: string, @Body() body: AddInteractionDto) {
    const interaction = this.svc.addInteraction(id, body)
    return { success: true, data: interaction }
  }

  /**
   * GET /api/crm/customers/:id/interactions
   * 获取客户交互记录。
   */
  @Get('customers/:id/interactions')
  listInteractions(@Param('id') id: string) {
    const interactions = this.svc.listInteractions(id)
    return { success: true, data: { interactions, total: interactions.length } }
  }

  // ─── 工单 ───

  /**
   * POST /api/crm/customers/:id/tickets
   * 创建客户工单。
   */
  @Post('customers/:id/tickets')
  @HttpCode(HttpStatus.CREATED)
  createTicket(@Param('id') id: string, @Body() body: CreateTicketDto) {
    const ticket = this.svc.createTicket(id, body)
    return { success: true, data: ticket }
  }

  /**
   * GET /api/crm/customers/:id/tickets
   * 获取客户工单列表。
   */
  @Get('customers/:id/tickets')
  listTickets(@Param('id') id: string) {
    const tickets = this.svc.listTickets(id)
    return { success: true, data: { tickets, total: tickets.length } }
  }

  /**
   * PATCH /api/crm/customers/:id/tickets/:ticketId
   * 更新工单状态。
   */
  @Patch('customers/:id/tickets/:ticketId')
  @HttpCode(HttpStatus.OK)
  updateTicketStatus(
    @Param('id') id: string,
    @Param('ticketId') ticketId: string,
    @Body() body: UpdateTicketStatusDto,
  ) {
    const ticket = this.svc.updateTicketStatus(id, ticketId, body.status)
    return { success: true, data: ticket }
  }

  /**
   * GET /api/crm/stats
   * 获取客户统计概览。
   */
  @Get('stats')
  getStats() {
    const stats = this.svc.getStats()
    return { success: true, data: stats }
  }
}
