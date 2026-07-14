import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Post,
  Query
} from '@nestjs/common'
import { LogisticsService } from './logistics.service'
import type {
  CleanScheduleStatus,
  MaterialRequestStatus,
  RepairOrderStatus
} from './logistics.entity'

@Controller('logistics')
export class LogisticsController {
  constructor(private readonly logisticsService: LogisticsService) {}

  @Post('inspections')
  create(@Headers('x-tenant-id') tenantId: string, @Body() body: any) {
    return this.logisticsService.createInspectionTask({
      tenantId,
      storeId: body.storeId,
      equipmentId: body.equipmentId,
      equipmentName: body.equipmentName,
      assigneeId: body.assigneeId,
      assigneeName: body.assigneeName,
      scheduledAt: body.scheduledAt
    })
  }

  @Get('inspections')
  list(
    @Headers('x-tenant-id') tenantId: string,
    @Query('status') status?: 'scheduled' | 'reminded' | 'completed',
    @Query('equipmentId') equipmentId?: string
  ) {
    return this.logisticsService.listInspectionTasks(tenantId, { status, equipmentId })
  }

  @Get('inspections/:id')
  detail(@Headers('x-tenant-id') tenantId: string, @Param('id') id: string) {
    return this.logisticsService.getInspectionTask(id, tenantId) ?? null
  }

  @Post('inspections/:id/remind')
  remind(
    @Headers('x-tenant-id') tenantId: string,
    @Param('id') id: string,
    @Body() body: { now?: string }
  ) {
    return this.logisticsService.sendInspectionReminder(id, tenantId, body?.now)
  }

  @Post('inspections/sweep/reminders')
  sweep(@Body() body: { now?: string }) {
    return this.logisticsService.sweepDueInspectionReminders(body?.now)
  }

  @Post('inspections/:id/result')
  recordResult(
    @Headers('x-tenant-id') tenantId: string,
    @Param('id') id: string,
    @Body()
    body: {
      status: 'normal' | 'warning' | 'fault'
      note: string
      inspectorId: string
      inspectorName: string
    }
  ) {
    return this.logisticsService.recordInspectionResult(id, tenantId, body)
  }

  @Post('clean-schedules')
  createCleanSchedule(@Headers('x-tenant-id') tenantId: string, @Body() body: any) {
    return this.logisticsService.createCleanSchedule({
      tenantId,
      storeId: body.storeId,
      assigneeId: body.assigneeId,
      assigneeName: body.assigneeName,
      shiftName: body.shiftName,
      shiftTime: body.shiftTime,
      scheduledDate: body.scheduledDate
    })
  }

  @Get('clean-schedules')
  listCleanSchedules(
    @Headers('x-tenant-id') tenantId: string,
    @Query('status') status?: CleanScheduleStatus,
    @Query('scheduledDate') scheduledDate?: string,
    @Query('assigneeId') assigneeId?: string,
    @Query('areaCode') areaCode?: string
  ) {
    return this.logisticsService.listCleanSchedules(tenantId, {
      status,
      scheduledDate,
      assigneeId,
      areaCode
    })
  }

  @Get('clean-schedules/:id')
  cleanScheduleDetail(@Headers('x-tenant-id') tenantId: string, @Param('id') id: string) {
    return this.logisticsService.getCleanSchedule(id, tenantId) ?? null
  }

  @Post('clean-schedules/:id/assign-area')
  assignCleanArea(
    @Headers('x-tenant-id') tenantId: string,
    @Param('id') id: string,
    @Body() body: { areaCode: string; areaName: string; assignedAt?: string }
  ) {
    return this.logisticsService.assignCleanArea(id, tenantId, body)
  }

  @Post('clean-schedules/:id/check-in')
  checkInCleanSchedule(
    @Headers('x-tenant-id') tenantId: string,
    @Param('id') id: string,
    @Body()
    body: {
      cleanerId: string
      cleanerName: string
      checkedInAt?: string
      note?: string
    }
  ) {
    return this.logisticsService.checkInCleanSchedule(id, tenantId, body)
  }

  @Post('repairs')
  createRepairOrder(@Headers('x-tenant-id') tenantId: string, @Body() body: any) {
    return this.logisticsService.createRepairOrder({
      tenantId,
      storeId: body.storeId,
      inspectionTaskId: body.inspectionTaskId,
      equipmentId: body.equipmentId,
      equipmentName: body.equipmentName,
      issueDescription: body.issueDescription,
      reporterId: body.reporterId,
      reporterName: body.reporterName
    })
  }

  @Get('repairs')
  listRepairOrders(
    @Headers('x-tenant-id') tenantId: string,
    @Query('status') status?: RepairOrderStatus,
    @Query('equipmentId') equipmentId?: string,
    @Query('assigneeId') assigneeId?: string
  ) {
    return this.logisticsService.listRepairOrders(tenantId, { status, equipmentId, assigneeId })
  }

  @Get('repairs/:id')
  repairDetail(@Headers('x-tenant-id') tenantId: string, @Param('id') id: string) {
    return this.logisticsService.getRepairOrder(id, tenantId) ?? null
  }

  @Post('repairs/:id/assign')
  assignRepairOrder(
    @Headers('x-tenant-id') tenantId: string,
    @Param('id') id: string,
    @Body() body: { assigneeId: string; assigneeName: string; assignedAt?: string }
  ) {
    return this.logisticsService.assignRepairOrder(id, tenantId, body)
  }

  @Post('repairs/:id/start')
  startRepairOrder(
    @Headers('x-tenant-id') tenantId: string,
    @Param('id') id: string,
    @Body() body: { startedAt?: string }
  ) {
    return this.logisticsService.startRepairOrder(id, tenantId, body)
  }

  @Post('repairs/:id/complete')
  completeRepairOrder(
    @Headers('x-tenant-id') tenantId: string,
    @Param('id') id: string,
    @Body()
    body: {
      completionNote: string
      technicianId: string
      technicianName: string
      completedAt?: string
    }
  ) {
    return this.logisticsService.completeRepairOrder(id, tenantId, body)
  }

  @Post('repairs/:id/verify')
  verifyRepairOrder(
    @Headers('x-tenant-id') tenantId: string,
    @Param('id') id: string,
    @Body() body: { verifierId: string; verifierName: string; note: string; verifiedAt?: string }
  ) {
    return this.logisticsService.verifyRepairOrder(id, tenantId, body)
  }

  @Post('material-requests')
  createMaterialRequest(@Headers('x-tenant-id') tenantId: string, @Body() body: any) {
    return this.logisticsService.createMaterialRequest({
      tenantId,
      storeId: body.storeId,
      requesterId: body.requesterId,
      requesterName: body.requesterName,
      department: body.department,
      purpose: body.purpose,
      items: body.items
    })
  }

  @Get('material-requests')
  listMaterialRequests(
    @Headers('x-tenant-id') tenantId: string,
    @Query('status') status?: MaterialRequestStatus,
    @Query('requesterId') requesterId?: string,
    @Query('category') category?: string
  ) {
    return this.logisticsService.listMaterialRequests(tenantId, {
      status,
      requesterId,
      category
    })
  }

  @Get('material-requests/:id')
  materialRequestDetail(@Headers('x-tenant-id') tenantId: string, @Param('id') id: string) {
    return this.logisticsService.getMaterialRequest(id, tenantId) ?? null
  }

  @Post('material-requests/:id/approve')
  approveMaterialRequest(
    @Headers('x-tenant-id') tenantId: string,
    @Param('id') id: string,
    @Body() body: { approverId: string; approverName: string; note: string; approvedAt?: string }
  ) {
    return this.logisticsService.approveMaterialRequest(id, tenantId, body)
  }

  @Post('material-requests/:id/outbound')
  outboundMaterialRequest(
    @Headers('x-tenant-id') tenantId: string,
    @Param('id') id: string,
    @Body()
    body: {
      operatorId: string
      operatorName: string
      warehouseCode?: string
      note?: string
      outboundAt?: string
    }
  ) {
    return this.logisticsService.outboundMaterialRequest(id, tenantId, body)
  }
}
