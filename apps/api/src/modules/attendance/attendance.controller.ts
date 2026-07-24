/**
 * attendance.controller.ts — 考勤管理 REST API
 */
import { Controller, Post, Body } from '@nestjs/common'
import { AttendanceService } from './attendance.service'

@Controller('attendance')
export class AttendanceController {
  constructor(private readonly service: AttendanceService) {}

  @Post('clock-in')
  clockIn(@Body() body: any) { return this.service.clockIn(body) }

  @Post('records')
  records(@Body() body: any) { return this.service.listRecords(body) }

  @Post('summary')
  summary(@Body() body: any) { return this.service.getSummary(body.period, body.from, body.to, body.storeId) }

  @Post('leave/approve')
  leaveApprove(@Body() body: any) { return this.service.approveLeave(body.id, body.approverId, body.approverName, 'approve', body.remark) }

  @Post('leave/reject')
  leaveReject(@Body() body: any) { return this.service.approveLeave(body.id, body.approverId, body.approverName, 'reject', body.remark) }
}
