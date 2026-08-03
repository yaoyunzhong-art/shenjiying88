/**
 * 薪资/薪酬管理 - Controller (V23)
 *
 * 端点：
 * - 薪资计算与 CRUD（创建/提交/查询/删除）
 * - 审批流程（审批/驳回/发放/取消）
 * - 薪资统计汇总
 */

import { Controller, Get, Post, Delete, Body, Param, Query, BadRequestException, UseGuards } from '@nestjs/common'
import { SalaryService } from './salary.service'
import type { PayrollRecord, SalaryStatus, SalaryMode } from './salary.entity'
import { TenantGuard } from '../agent/tenant.guard'

@Controller('salary')
@UseGuards(TenantGuard)
export class SalaryController {
  constructor(private readonly service: SalaryService) {}

  // ════════════════════════════════════════════════════
  // 薪资计算与 CRUD
  // ════════════════════════════════════════════════════

  /**
   * 创建/计算薪资单（草稿）
   * POST /salary/calculate
   */
  @Post('calculate')
  calculatePayroll(@Body() body: {
    employeeId: string
    employeeName: string
    storeId: string
    period: string
    mode: string
    baseSalary?: number
    bonus?: number
    overtimePay?: number
    commission?: number
    allowance?: number
    socialSecurity?: number
    housingFund?: number
    tax?: number
    otherDeductions?: number
    reimbursement?: number
    workingDays?: number
    attendanceDays?: number
    remark?: string
  }): PayrollRecord {
    if (!body.employeeId || !body.employeeName || !body.storeId || !body.period || !body.mode) {
      throw new BadRequestException('Missing required fields: employeeId, employeeName, storeId, period, mode')
    }
    const validModes = ['monthly', 'hourly', 'commission', 'mixed']
    if (!validModes.includes(body.mode)) {
      throw new BadRequestException(`Invalid mode: ${body.mode}. Valid modes: ${validModes.join(', ')}`)
    }
    return this.service.calculatePayroll({
      ...body,
      mode: body.mode as SalaryMode,
    })
  }

  /**
   * 提交审批（draft → pending）
   * POST /salary/submit/:id
   */
  @Post('submit/:id')
  submitPayroll(@Param('id') id: string): PayrollRecord {
    return this.service.submitPayroll(id)
  }

  /**
   * 获取薪资单详情（含审批历史）
   * GET /salary/:id
   */
  @Get(':id')
  getPayroll(@Param('id') id: string): PayrollRecord & { approvalHistory?: any[] } {
    const detail = this.service.getPayrollDetail(id)
    if (!detail) throw new BadRequestException(`Payroll ${id} not found`)
    return detail
  }

  /**
   * 薪资单列表（支持筛选）
   * GET /salary/list
   */
  @Get('list')
  listPayrolls(@Query() query: {
    status?: string
    storeId?: string
    employeeId?: string
    period?: string
    from?: string
    to?: string
  }): { items: PayrollRecord[]; total: number } {
    const items = this.service.listPayrolls({
      status: query.status as SalaryStatus | undefined,
      storeId: query.storeId,
      employeeId: query.employeeId,
      period: query.period,
      from: query.from,
      to: query.to,
    })
    return { items, total: items.length }
  }

  /**
   * 删除薪资单（仅 draft）
   * DELETE /salary/:id
   */
  @Delete(':id')
  deletePayroll(@Param('id') id: string): { success: boolean; id: string } {
    const deleted = this.service.deletePayroll(id)
    if (!deleted) throw new BadRequestException(`Payroll ${id} not found`)
    return { success: true, id }
  }

  // ════════════════════════════════════════════════════
  // 审批流程
  // ════════════════════════════════════════════════════

  /**
   * 审批操作（approve / reject）
   * POST /salary/approve/:id
   */
  @Post('approve/:id')
  approvePayroll(
    @Param('id') id: string,
    @Body() body: { action: 'approve' | 'reject'; approverId: string; approverName: string; remark?: string },
  ): PayrollRecord {
    if (!body.action || !body.approverId || !body.approverName) {
      throw new BadRequestException('Missing required fields: action, approverId, approverName')
    }
    return this.service.approvePayroll(id, body.action, body.approverId, body.approverName, body.remark)
  }

  /**
   * 执行发放（approved → paid）
   * POST /salary/pay/:id
   */
  @Post('pay/:id')
  payPayroll(
    @Param('id') id: string,
    @Body() body: { method: 'bank' | 'cash' | 'wechat' | 'alipay'; account: string; operatorId: string; operatorName: string },
  ): PayrollRecord {
    if (!body.method || !body.account || !body.operatorId || !body.operatorName) {
      throw new BadRequestException('Missing required fields: method, account, operatorId, operatorName')
    }
    return this.service.payPayroll(id, body.method, body.account, body.operatorId, body.operatorName)
  }

  /**
   * 取消薪资单
   * POST /salary/cancel/:id
   */
  @Post('cancel/:id')
  cancelPayroll(
    @Param('id') id: string,
    @Body() body: { operatorId: string; operatorName: string; remark?: string },
  ): PayrollRecord {
    if (!body.operatorId || !body.operatorName) {
      throw new BadRequestException('Missing required fields: operatorId, operatorName')
    }
    return this.service.cancelPayroll(id, body.operatorId, body.operatorName, body.remark)
  }

  // ════════════════════════════════════════════════════
  // 薪资统计
  // ════════════════════════════════════════════════════

  /**
   * 薪资统计汇总
   * GET /salary/summary
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
    totalEmployees: number
    totalGross: number
    totalDeductions: number
    totalNet: number
    totalPaid: number
    totalPending: number
    byStore: Record<string, number>
    byMode: Record<string, number>
  } {
    const p = period ?? 'monthly'
    if (!from || !to) {
      throw new BadRequestException('from and to are required')
    }
    return this.service.getSalarySummary(p, from, to, storeId)
  }
}
