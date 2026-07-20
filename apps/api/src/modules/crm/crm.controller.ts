/**
 * crm.controller.ts — CRM API 端点
 *
 * 提供客户管理、交互记录、工单管理等 CRM 能力。
 *
 * 端点:
 *   GET    /api/crm/customers             — 列出客户
 *   GET    /api/crm/customers/:id          — 查询客户
 *   PATCH  /api/crm/customers/:id/score    — 更新客户评分
 *   POST   /api/crm/customers/:id/interactions — 添加交互记录
 *   GET    /api/crm/customers/:id/interactions — 获取交互记录
 *   POST   /api/crm/customers/:id/tickets  — 创建工单
 *   GET    /api/crm/customers/:id/tickets  — 获取工单列表
 *   PATCH  /api/crm/customers/:id/tickets/:ticketId — 更新工单状态
 */

import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,

import { TenantGuard } from '../agent/tenant.guard'

} from '@nestjs/common'
import {
  CrmService,
  type CrmCustomerStatus,
  type CrmInteraction,
  type TicketPriority,
  type TicketStatus,
} from './crm.service'

class ListCustomersQueryDto {
  status?: CrmCustomerStatus
  search?: string
}

class UpdateScoreDto {
  delta!: number
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
   * GET /api/crm/customers/:id
   * 查询客户详情。
   */
  @Get('customers/:id')
  getCustomer(@Param('id') id: string) {
    const customer = this.svc.getById(id)
    return { success: true, data: customer }
  }

  /**
   * PATCH /api/crm/customers/:id/score
   * 更新客户评分。
   */
  @Patch('customers/:id/score')
  @HttpCode(HttpStatus.OK)
  updateScore(@Param('id') id: string, @Body() body: UpdateScoreDto) {
    const customer = this.svc.updateEngagementScore(id, body.delta)
    return { success: true, data: customer }
  }

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
}
