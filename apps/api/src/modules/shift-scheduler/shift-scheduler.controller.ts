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
  Query,
  UseGuards,
} from '@nestjs/common'
import { TenantContext } from '../tenant/tenant.decorator'
import type { RequestTenantContext } from '../tenant/tenant.types'
import {
  CreateShiftScheduleDto,
  ShiftQueryDto,
  UpdateShiftScheduleDto,
  UpdateShiftStatusDto,
} from './shift-scheduler.dto'
import { ShiftSchedulerService } from './shift-scheduler.service'
import { TenantGuard } from '../agent/tenant.guard';

@Controller('shift-schedules')
@UseGuards(TenantGuard)
export class ShiftSchedulerController {
  constructor(private readonly shiftService: ShiftSchedulerService) {}

  // ── Shift CRUD ──

  @Post()
  createShift(
    @TenantContext() tenantContext: RequestTenantContext,
    @Body() body: CreateShiftScheduleDto,
  ) {
    return this.shiftService.createShift({
      tenantId: tenantContext.tenantId,
      employeeId: body.employeeId,
      employeeName: body.employeeName,
      date: body.date,
      shiftType: body.shiftType,
      startTime: body.startTime,
      endTime: body.endTime,
      location: body.location,
      remark: body.remark,
    })
  }

  @Get()
  listShifts(
    @TenantContext() tenantContext: RequestTenantContext,
    @Query() query: ShiftQueryDto,
  ) {
    return this.shiftService.listShifts(tenantContext.tenantId, {
      shiftType: query.shiftType,
      status: query.status,
      employeeId: query.employeeId,
      date: query.date,
      location: query.location,
    })
  }

  @Get(':shiftId')
  getShift(
    @TenantContext() tenantContext: RequestTenantContext,
    @Param('shiftId') shiftId: string,
  ) {
    const shift = this.shiftService.getShift(shiftId, tenantContext.tenantId)
    if (!shift) {
      throw new Error(`Shift schedule not found: ${shiftId}`)
    }
    return shift
  }

  @Patch(':shiftId')
  updateShift(
    @TenantContext() tenantContext: RequestTenantContext,
    @Param('shiftId') shiftId: string,
    @Body() body: UpdateShiftScheduleDto,
  ) {
    return this.shiftService.updateShift(shiftId, tenantContext.tenantId, body)
  }

  @Delete(':shiftId')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteShift(
    @TenantContext() tenantContext: RequestTenantContext,
    @Param('shiftId') shiftId: string,
  ): void {
    return this.shiftService.deleteShift(shiftId, tenantContext.tenantId)
  }

  @Patch(':shiftId/status')
  updateShiftStatus(
    @TenantContext() tenantContext: RequestTenantContext,
    @Param('shiftId') shiftId: string,
    @Body() body: UpdateShiftStatusDto,
  ) {
    return this.shiftService.updateShiftStatus(shiftId, body.status, tenantContext.tenantId)
  }

  // ── Weekly View ──

  @Get('analysis/weekly')
  getWeeklyShifts(
    @TenantContext() tenantContext: RequestTenantContext,
    @Query('fromDate') fromDate: string,
    @Query('toDate') toDate: string,
  ) {
    return this.shiftService.getWeeklyShifts(tenantContext.tenantId, fromDate, toDate)
  }

  @Get('analysis/employee-weekly')
  getEmployeeWeeklyShifts(
    @TenantContext() tenantContext: RequestTenantContext,
    @Query('employeeId') employeeId: string,
    @Query('fromDate') fromDate: string,
    @Query('toDate') toDate: string,
  ) {
    return this.shiftService.getEmployeeWeeklyShifts(
      tenantContext.tenantId,
      employeeId,
      fromDate,
      toDate,
    )
  }

  // ── Mock Seed ──

  @Post('seed')
  seedMockData(@TenantContext() tenantContext: RequestTenantContext) {
    this.shiftService.seedMockData(tenantContext.tenantId)
    return { message: 'Mock shift schedule data seeded' }
  }
}
