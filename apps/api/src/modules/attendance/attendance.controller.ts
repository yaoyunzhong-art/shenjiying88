/**
 * attendance.controller.ts — 考勤管理 REST API
 */
import { Controller, Post, Body, UseGuards } from '@nestjs/common'
import { AttendanceService } from './attendance.service'
import { TenantGuard } from '../agent/tenant.guard'
import type { AttendanceCalcRequest } from './attendance.entity'
import {
  RequirePermissions,
  RequireTenantScope,
} from '../foundation/identity-access/identity-access.decorator'

@Controller('attendance')
@UseGuards(TenantGuard)
@RequireTenantScope()
export class AttendanceController {
  constructor(private readonly service: AttendanceService) {}

  @Post('clock-in')
  @RequirePermissions('att:clock')
  clockIn(@Body() body: AttendanceCalcRequest) { return this.service.clockIn(body) }

  @Post('records')
  @RequirePermissions('att:list')
  records(@Body() body: Record<string, unknown>) { return this.service.listRecords(body) }

  @Post('summary')
  @RequirePermissions('att:summary')
  summary(@Body() body: { period: string; from: string; to: string; storeId?: string }) { return this.service.getSummary(body.period, body.from, body.to, body.storeId) }

  @Post('leave/approve')
  @RequirePermissions('att:leave:approve')
  leaveApprove(@Body() body: { id: string; approverId: string; approverName: string; remark?: string }) { return this.service.approveLeave(body.id, body.approverId, body.approverName, 'approve', body.remark) }

  @Post('leave/reject')
  @RequirePermissions('att:leave:approve')
  leaveReject(@Body() body: { id: string; approverId: string; approverName: string; remark?: string }) { return this.service.approveLeave(body.id, body.approverId, body.approverName, 'reject', body.remark) }
}
