import {
  Body,
  Controller,
  Delete,
  Get,
  HttpException,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query
} from '@nestjs/common'
import { TenantContext } from '../tenant/tenant.decorator'
import type { RequestTenantContext } from '../tenant/tenant.types'
import {
  CreateReservationDto,
  ReservationQueryDto,
  UpdateReservationDto
} from './reservation.dto'
import { ReservationStatus } from './reservation.entity'
import { ReservationService } from './reservation.service'

@Controller('reservations')
export class ReservationController {
  constructor(private readonly reservationService: ReservationService) {}

  @Post()
  createReservation(
    @TenantContext() tenantContext: RequestTenantContext,
    @Body() body: CreateReservationDto
  ) {
    return this.reservationService.create({
      tenantId: tenantContext.tenantId,
      type: body.type,
      resourceId: body.resourceId,
      resourceName: body.resourceName,
      userId: body.userId,
      userName: body.userName,
      startTime: body.startTime,
      endTime: body.endTime,
      duration: body.duration,
      price: body.price,
      deposit: body.deposit,
      remark: body.remark
    })
  }

  @Get()
  findAll(
    @TenantContext() tenantContext: RequestTenantContext,
    @Query() query: ReservationQueryDto
  ) {
    return this.reservationService.findAll(tenantContext.tenantId, query)
  }

  @Get(':id')
  findOne(
    @TenantContext() tenantContext: RequestTenantContext,
    @Param('id') id: string
  ) {
    const reservation = this.reservationService.findOne(id, tenantContext.tenantId)
    if (!reservation) {
      throw new HttpException('Reservation not found', HttpStatus.NOT_FOUND)
    }
    return reservation
  }

  @Get('by-user/:userId')
  findByUser(
    @TenantContext() tenantContext: RequestTenantContext,
    @Param('userId') userId: string
  ) {
    return this.reservationService.findByUser(tenantContext.tenantId, userId)
  }

  @Get('by-resource/:resourceId')
  findByResource(
    @TenantContext() tenantContext: RequestTenantContext,
    @Param('resourceId') resourceId: string
  ) {
    return this.reservationService.findByResource(tenantContext.tenantId, resourceId)
  }

  @Get('by-timerange')
  findByTimeRange(
    @TenantContext() tenantContext: RequestTenantContext,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string
  ) {
    if (!startDate || !endDate) {
      throw new HttpException(
        'startDate and endDate are required',
        HttpStatus.BAD_REQUEST
      )
    }
    return this.reservationService.findByTimeRange(tenantContext.tenantId, startDate, endDate)
  }

  @Get('check-conflict')
  checkConflict(
    @TenantContext() tenantContext: RequestTenantContext,
    @Query('resourceId') resourceId: string,
    @Query('startTime') startTime: string,
    @Query('endTime') endTime: string
  ) {
    if (!resourceId || !startTime || !endTime) {
      throw new HttpException(
        'resourceId, startTime, and endTime are required',
        HttpStatus.BAD_REQUEST
      )
    }
    try {
      this.reservationService.checkConflict(
        tenantContext.tenantId,
        resourceId,
        startTime,
        endTime
      )
      return { hasConflict: false }
    } catch {
      return { hasConflict: true }
    }
  }

  @Patch(':id')
  updateReservation(
    @TenantContext() tenantContext: RequestTenantContext,
    @Param('id') id: string,
    @Body() body: UpdateReservationDto
  ) {
    // Status transitions
    if (body.status === ReservationStatus.Confirmed) {
      return this.reservationService.confirm(id, tenantContext.tenantId)
    }
    if (body.status === ReservationStatus.InProgress) {
      return this.reservationService.startProgress(id, tenantContext.tenantId)
    }
    if (body.status === ReservationStatus.Completed) {
      return this.reservationService.complete(id, tenantContext.tenantId)
    }
    if (body.status === ReservationStatus.Cancelled) {
      return this.reservationService.cancel(id, tenantContext.tenantId, body.remark)
    }

    // Field updates
    return this.reservationService.update(id, tenantContext.tenantId, {
      startTime: body.startTime,
      endTime: body.endTime,
      duration: body.duration,
      price: body.price,
      deposit: body.deposit,
      remark: body.remark,
      resourceName: body.resourceName
    })
  }

  @Delete(':id')
  cancelReservation(
    @TenantContext() tenantContext: RequestTenantContext,
    @Param('id') id: string,
    @Query('reason') reason?: string
  ) {
    return this.reservationService.cancel(id, tenantContext.tenantId, reason)
  }
}
