import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common'
import { TenantContext } from '../tenant/tenant.decorator'
import type { RequestTenantContext } from '../tenant/tenant.types'
import {
  ApproveLeaveDto,
  CreateLeaveRequestDto,
  LeaveQueryDto,
} from './leave-request.dto'
import { LeaveRequestService } from './leave-request.service'
import { LeaveStatus } from './leave-request.entity'
import { TenantGuard } from '../agent/tenant.guard'
import { type LeaveStats } from './leave-request.entity'

@Controller('leave-requests')
@UseGuards(TenantGuard)
export class LeaveRequestController {
  constructor(private readonly leaveService: LeaveRequestService) {}

  // ── Leave CRUD ──

  @Post()
  createLeave(
    @TenantContext() tenantContext: RequestTenantContext,
    @Body() body: CreateLeaveRequestDto,
  ) {
    return this.leaveService.createLeave({
      tenantId: tenantContext.tenantId,
      employeeId: body.employeeId,
      employeeName: body.employeeName,
      type: body.type,
      startDate: body.startDate,
      endDate: body.endDate,
      days: body.days,
      reason: body.reason,
      approver: body.approver,
      remark: body.remark,
    })
  }

  @Get()
  listLeaves(
    @TenantContext() tenantContext: RequestTenantContext,
    @Query() query: LeaveQueryDto,
  ) {
    return this.leaveService.listLeaves(tenantContext.tenantId, {
      type: query.type,
      status: query.status,
      employeeId: query.employeeId,
      approver: query.approver,
      fromDate: query.fromDate,
      toDate: query.toDate,
    })
  }

  @Get(':leaveId')
  getLeave(
    @TenantContext() tenantContext: RequestTenantContext,
    @Param('leaveId') leaveId: string,
  ) {
    const leave = this.leaveService.getLeave(leaveId, tenantContext.tenantId)
    if (!leave) {
      throw new Error(`Leave request not found: ${leaveId}`)
    }
    return leave
  }

  // ── Approval Flow ──

  @Patch(':leaveId/approve')
  approveLeave(
    @TenantContext() tenantContext: RequestTenantContext,
    @Param('leaveId') leaveId: string,
    @Body() body: ApproveLeaveDto,
  ) {
    return this.leaveService.approveLeave(
      leaveId,
      body.status,
      tenantContext.tenantId,
      body.remark,
    )
  }

  @Patch(':leaveId/cancel')
  cancelLeave(
    @TenantContext() tenantContext: RequestTenantContext,
    @Param('leaveId') leaveId: string,
  ) {
    return this.leaveService.cancelLeave(leaveId, tenantContext.tenantId)
  }

  // ── Statistics ──

  @Get('stats')
  getStats(
    @TenantContext() tenantContext: RequestTenantContext,
  ): LeaveStats {
    return this.leaveService.getStats(tenantContext.tenantId)
  }

  // ── Mock Seed ──

  @Post('seed')
  seedMockData(@TenantContext() tenantContext: RequestTenantContext) {
    this.leaveService.seedMockData(tenantContext.tenantId)
    return { message: 'Mock leave request data seeded' }
  }
}
