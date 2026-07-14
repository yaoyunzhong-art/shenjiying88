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

@Controller('logistics/inspections')
export class LogisticsController {
  constructor(private readonly logisticsService: LogisticsService) {}

  @Post()
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

  @Get()
  list(
    @Headers('x-tenant-id') tenantId: string,
    @Query('status') status?: 'scheduled' | 'reminded' | 'completed',
    @Query('equipmentId') equipmentId?: string
  ) {
    return this.logisticsService.listInspectionTasks(tenantId, { status, equipmentId })
  }

  @Get(':id')
  detail(@Headers('x-tenant-id') tenantId: string, @Param('id') id: string) {
    return this.logisticsService.getInspectionTask(id, tenantId) ?? null
  }

  @Post(':id/remind')
  remind(
    @Headers('x-tenant-id') tenantId: string,
    @Param('id') id: string,
    @Body() body: { now?: string }
  ) {
    return this.logisticsService.sendInspectionReminder(id, tenantId, body?.now)
  }

  @Post('sweep/reminders')
  sweep(@Body() body: { now?: string }) {
    return this.logisticsService.sweepDueInspectionReminders(body?.now)
  }

  @Post(':id/result')
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
}
