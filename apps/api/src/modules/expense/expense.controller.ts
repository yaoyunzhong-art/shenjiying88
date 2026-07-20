/**
 * 费用报销 - Controller (V23)
 *
 * 端点：
 * - 费用申请 CRUD（创建/提交/查询/删除）
 * - 审批流程（审批/驳回/报销/取消）
 * - 费用统计汇总
 */

import { Controller, Get, Post, Delete, Body, Param, Query, BadRequestException, UseGuards } from '@nestjs/common'
import { ExpenseService } from './expense.service'
import type { ExpenseReimbursement, ExpenseCategory, ExpenseStatus } from './expense.entity'
import { TenantGuard } from '../agent/tenant.guard'

@Controller('expense')
@UseGuards(TenantGuard)
export class ExpenseController {
  constructor(private readonly service: ExpenseService) {}

  // ════════════════════════════════════════════════════
  // 费用申请
  // ════════════════════════════════════════════════════

  /**
   * 创建费用申请（草稿）
   * POST /expense/create
   */
  @Post('create')
  createExpense(@Body() body: {
    title: string
    category: string
    amount: number
    applicantId: string
    applicantName: string
    storeId: string
    expenseDate: string
    description: string
    attachments?: string[]
  }): ExpenseReimbursement {
    if (!body.title || !body.category || body.amount == null || !body.applicantId) {
      throw new BadRequestException('Missing required fields: title, category, amount, applicantId')
    }
    return this.service.createExpense({
      ...body,
      category: body.category as ExpenseCategory,
    })
  }

  /**
   * 提交审批（draft → pending）
   * POST /expense/submit/:id
   */
  @Post('submit/:id')
  submitExpense(@Param('id') id: string): ExpenseReimbursement {
    return this.service.submitExpense(id)
  }

  /**
   * 获取费用申请详情（含审批历史）
   * GET /expense/:id
   */
  @Get(':id')
  getExpense(@Param('id') id: string): ExpenseReimbursement & { approvalHistory?: any[] } {
    const detail = this.service.getExpenseDetail(id)
    if (!detail) throw new BadRequestException(`Expense ${id} not found`)
    return detail
  }

  /**
   * 费用申请列表（支持筛选）
   * GET /expense/list
   */
  @Get('list')
  listExpenses(@Query() query: {
    status?: string
    category?: string
    applicantId?: string
    storeId?: string
    from?: string
    to?: string
  }): { items: ExpenseReimbursement[]; total: number } {
    const items = this.service.listExpenses({
      status: query.status as ExpenseStatus | undefined,
      category: query.category as ExpenseCategory | undefined,
      applicantId: query.applicantId,
      storeId: query.storeId,
      from: query.from,
      to: query.to,
    })
    return { items, total: items.length }
  }

  /**
   * 删除费用申请（仅 draft）
   * DELETE /expense/:id
   */
  @Delete(':id')
  deleteExpense(@Param('id') id: string): { success: boolean; id: string } {
    const deleted = this.service.deleteExpense(id)
    if (!deleted) throw new BadRequestException(`Expense ${id} not found`)
    return { success: true, id }
  }

  // ════════════════════════════════════════════════════
  // 审批流程
  // ════════════════════════════════════════════════════

  /**
   * 审批操作（approve / reject）
   * POST /expense/approve/:id
   */
  @Post('approve/:id')
  approveExpense(
    @Param('id') id: string,
    @Body() body: { action: 'approve' | 'reject'; approverId: string; approverName: string; remark?: string },
  ): ExpenseReimbursement {
    if (!body.action || !body.approverId || !body.approverName) {
      throw new BadRequestException('Missing required fields: action, approverId, approverName')
    }
    return this.service.approveExpense(id, body.action, body.approverId, body.approverName, body.remark)
  }

  /**
   * 执行报销（approved → reimbursed）
   * POST /expense/reimburse/:id
   */
  @Post('reimburse/:id')
  reimburseExpense(
    @Param('id') id: string,
    @Body() body: { method: 'bank' | 'cash' | 'wechat' | 'alipay'; account: string; operatorId: string; operatorName: string },
  ): ExpenseReimbursement {
    if (!body.method || !body.account || !body.operatorId || !body.operatorName) {
      throw new BadRequestException('Missing required fields: method, account, operatorId, operatorName')
    }
    return this.service.reimburseExpense(id, body.method, body.account, body.operatorId, body.operatorName)
  }

  /**
   * 取消申请
   * POST /expense/cancel/:id
   */
  @Post('cancel/:id')
  cancelExpense(
    @Param('id') id: string,
    @Body() body: { operatorId: string; operatorName: string; remark?: string },
  ): ExpenseReimbursement {
    if (!body.operatorId || !body.operatorName) {
      throw new BadRequestException('Missing required fields: operatorId, operatorName')
    }
    return this.service.cancelExpense(id, body.operatorId, body.operatorName, body.remark)
  }

  // ════════════════════════════════════════════════════
  // 费用统计
  // ════════════════════════════════════════════════════

  /**
   * 费用统计汇总
   * GET /expense/summary
   */
  @Get('summary')
  getSummary(
    @Query('period') period: string,
    @Query('from') from: string,
    @Query('to') to: string,
    @Query('storeId') storeId?: string,
  ): {
    period: string
    from: string
    to: string
    totalApplications: number
    totalAmount: number
    totalReimbursed: number
    totalPending: number
    totalRejected: number
    byCategory: Record<string, number>
    byStore: Record<string, number>
  } {
    const p = period ?? 'monthly'
    if (!from || !to) {
      throw new BadRequestException('from and to are required')
    }
    return this.service.getExpenseSummary(p, from, to, storeId)
  }
}
