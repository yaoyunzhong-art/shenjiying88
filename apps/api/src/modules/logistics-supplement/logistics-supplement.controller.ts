import {
  Controller, Get, Post, Patch, Delete,
  Param, Query, Body, UseGuards, UsePipes, ValidationPipe,
} from '@nestjs/common'
import { IdentityAccessGuard } from '../../common/guards/identity-access.guard'
import { LogisticsSupplementService } from './logistics-supplement.service'
import {
  CreateTransportOrderDto, UpdateTransportOrderStatusDto, UpdateTransportOrderDto,
  AddCargoLoadDto, UpdateCargoStatusDto,
  CreateRoutePlanDto, UpdateRoutePlanDto,
  CreateDriverScheduleDto, UpdateDriverScheduleStatusDto,
  CreateMaintenanceDto, UpdateVehicleMaintenanceDto,
  RecordFuelDto,
  RecordAccidentDto, ResolveAccidentDto,
  RecordCostDto,
  ListTransportOrdersQuery,
} from './logistics-supplement.dto'
import type {
  TransportOrder, CargoLoad, RoutePlan, DriverSchedule,
  VehicleMaintenanceRecord, FuelRecord, AccidentRecord, LogisticsCost,
  LogisticsSupplementMetrics,
} from './logistics-supplement.entity'

@Controller('logistics-supplement')
@UseGuards(IdentityAccessGuard)
@UsePipes(new ValidationPipe({ transform: true }))
export class LogisticsSupplementController {
  constructor(private readonly service: LogisticsSupplementService) {}

  // ── 运输调度单 ───────────────────────────────────────────────────────────

  @Post('transport-orders')
  createTransportOrder(@Body() dto: CreateTransportOrderDto): Promise<TransportOrder> {
    return this.service.createTransportOrder(dto)
  }

  @Get('transport-orders/:id')
  getTransportOrder(@Param('id') id: string): Promise<TransportOrder> {
    return this.service.getTransportOrder(id)
  }

  @Get('transport-orders')
  listTransportOrders(@Query() query: ListTransportOrdersQuery): Promise<TransportOrder[]> {
    return this.service.listTransportOrders(query)
  }

  @Patch('transport-orders/:id/status')
  updateTransportOrderStatus(
    @Param('id') id: string,
    @Body() dto: UpdateTransportOrderStatusDto,
  ): Promise<TransportOrder> {
    return this.service.updateTransportOrderStatus(id, dto.status)
  }

  @Patch('transport-orders/:id')
  updateTransportOrder(
    @Param('id') id: string,
    @Body() dto: UpdateTransportOrderDto,
  ): Promise<TransportOrder> {
    return this.service.updateTransportOrder(id, dto)
  }

  @Delete('transport-orders/:id')
  deleteTransportOrder(@Param('id') id: string): Promise<void> {
    return this.service.deleteTransportOrder(id)
  }

  // ── 货物装载 ─────────────────────────────────────────────────────────────

  @Post('cargo-loads')
  addCargoLoad(@Body() dto: AddCargoLoadDto): Promise<CargoLoad> {
    return this.service.addCargoLoad(dto)
  }

  @Get('cargo-loads')
  getCargoLoads(@Query('transportOrderId') id: string): Promise<CargoLoad[]> {
    return this.service.getCargoLoads(id)
  }

  @Get('cargo-loads/:id')
  getCargoLoad(@Param('id') id: string): Promise<CargoLoad> {
    return this.service.getCargoLoad(id)
  }

  @Patch('cargo-loads/:id/status')
  updateCargoStatus(
    @Param('id') id: string,
    @Body() dto: UpdateCargoStatusDto,
  ): Promise<CargoLoad> {
    return this.service.updateCargoStatus(id, dto.status, dto)
  }

  // ── 路线规划 ─────────────────────────────────────────────────────────────

  @Post('route-plans')
  createRoutePlan(@Body() dto: CreateRoutePlanDto): Promise<RoutePlan> {
    return this.service.createRoutePlan(dto)
  }

  @Get('route-plans')
  listRoutePlans(@Query('status') status?: string): Promise<RoutePlan[]> {
    return this.service.listRoutePlans({ status })
  }

  @Get('route-plans/:id')
  getRoutePlan(@Param('id') id: string): Promise<RoutePlan> {
    return this.service.getRoutePlan(id)
  }

  @Patch('route-plans/:id')
  updateRoutePlan(
    @Param('id') id: string,
    @Body() dto: UpdateRoutePlanDto,
  ): Promise<RoutePlan> {
    return this.service.updateRoutePlan(id, dto)
  }

  @Post('route-plans/:id/optimize')
  optimizeRoute(@Param('id') id: string): Promise<RoutePlan> {
    return this.service.optimizeRoute(id)
  }

  @Delete('route-plans/:id')
  deleteRoutePlan(@Param('id') id: string): Promise<void> {
    return this.service.deleteRoutePlan(id)
  }

  // ── 司机排班 ─────────────────────────────────────────────────────────────

  @Post('driver-schedules')
  createSchedule(@Body() dto: CreateDriverScheduleDto): Promise<DriverSchedule> {
    return this.service.createDriverSchedule(dto)
  }

  @Get('driver-schedules')
  getSchedules(
    @Query('driverId') driverId?: string,
    @Query('date') date?: string,
  ): Promise<DriverSchedule[]> {
    return this.service.getDriverSchedules(driverId, date)
  }

  @Get('driver-schedules/:id')
  getSchedule(@Param('id') id: string): Promise<DriverSchedule> {
    return this.service.getDriverSchedule(id)
  }

  @Patch('driver-schedules/:id/status')
  updateScheduleStatus(
    @Param('id') id: string,
    @Body() dto: UpdateDriverScheduleStatusDto,
  ): Promise<DriverSchedule> {
    return this.service.updateDriverScheduleStatus(id, dto.status, dto)
  }

  @Delete('driver-schedules/:id')
  deleteSchedule(@Param('id') id: string): Promise<void> {
    return this.service.deleteDriverSchedule(id)
  }

  // ── 车辆维保 ─────────────────────────────────────────────────────────────

  @Post('maintenance')
  createMaintenance(@Body() dto: CreateMaintenanceDto): Promise<VehicleMaintenanceRecord> {
    return this.service.createMaintenanceRecord(dto)
  }

  @Get('maintenance/:id')
  getMaintenance(@Param('id') id: string): Promise<VehicleMaintenanceRecord> {
    return this.service.getMaintenanceRecord(id)
  }

  @Get('maintenance/vehicle/:vehicleId/history')
  getMaintenanceHistory(@Param('vehicleId') vid: string): Promise<VehicleMaintenanceRecord[]> {
    return this.service.getVehicleMaintenanceHistory(vid)
  }

  @Get('maintenance/upcoming')
  getUpcomingMaintenance(@Query('vehicleId') vid?: string): Promise<VehicleMaintenanceRecord[]> {
    return this.service.getUpcomingMaintenance(vid)
  }

  @Patch('maintenance/:id/status')
  updateMaintenanceStatus(
    @Param('id') id: string,
    @Body() dto: UpdateVehicleMaintenanceDto,
  ): Promise<VehicleMaintenanceRecord> {
    return this.service.updateMaintenanceStatus(id, dto.status ?? 'pending', dto)
  }

  // ── 油耗记录 ─────────────────────────────────────────────────────────────

  @Post('fuel')
  recordFuel(@Body() dto: RecordFuelDto): Promise<FuelRecord> {
    return this.service.recordFuel(dto)
  }

  @Get('fuel/:id')
  getFuelRecord(@Param('id') id: string): Promise<FuelRecord> {
    return this.service.getFuelRecord(id)
  }

  @Get('fuel/:vehicleId')
  getFuelRecords(
    @Param('vehicleId') vid: string,
    @Query('startDate') sd?: string,
    @Query('endDate') ed?: string,
  ): Promise<FuelRecord[]> {
    return this.service.getFuelRecords(vid, sd, ed)
  }

  @Get('fuel/:vehicleId/efficiency')
  getFuelEfficiency(@Param('vehicleId') vid: string) {
    return this.service.getFuelEfficiency(vid)
  }

  @Delete('fuel/:id')
  deleteFuelRecord(@Param('id') id: string): Promise<void> {
    return this.service.deleteFuelRecord(id)
  }

  // ── 事故记录 ─────────────────────────────────────────────────────────────

  @Post('accidents')
  recordAccident(@Body() dto: RecordAccidentDto): Promise<AccidentRecord> {
    return this.service.recordAccident(dto)
  }

  @Get('accidents')
  getAccidents(@Query('vehicleId') vid?: string): Promise<AccidentRecord[]> {
    return this.service.getAccidentRecords(vid)
  }

  @Get('accidents/:id')
  getAccident(@Param('id') id: string): Promise<AccidentRecord> {
    return this.service.getAccidentRecord(id)
  }

  @Post('accidents/:id/resolve')
  resolveAccident(
    @Param('id') id: string,
    @Body() dto: ResolveAccidentDto,
  ): Promise<AccidentRecord> {
    return this.service.resolveAccident(id, dto.resolution)
  }

  // ── 物流成本核算 ─────────────────────────────────────────────────────────

  @Post('costs')
  recordCost(@Body() dto: RecordCostDto): Promise<LogisticsCost> {
    return this.service.recordCost(dto)
  }

  @Get('costs/:id')
  getCost(@Param('id') id: string): Promise<LogisticsCost> {
    return this.service.getCost(id)
  }

  @Get('costs/summary')
  getCostSummary(
    @Query('startDate') sd: string,
    @Query('endDate') ed: string,
  ) {
    return this.service.getCostSummary(sd, ed)
  }

  @Delete('costs/:id')
  deleteCost(@Param('id') id: string): Promise<void> {
    return this.service.deleteCost(id)
  }

  // ── 统计指标 ─────────────────────────────────────────────────────────────

  @Get('metrics')
  getMetrics(): Promise<LogisticsSupplementMetrics> {
    return this.service.getMetrics()
  }
}
