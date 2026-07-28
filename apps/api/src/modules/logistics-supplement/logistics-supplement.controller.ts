import {
  Controller, Get, Post, Patch, Param, Query, Body, UseGuards, UsePipes, ValidationPipe,
} from '@nestjs/common'
import { IdentityAccessGuard } from '../../common/guards/identity-access.guard'
import { LogisticsSupplementService } from './logistics-supplement.service'
import { CreateTransportOrderDto, UpdateTransportOrderStatusDto, AddCargoLoadDto, CreateRoutePlanDto, CreateDriverScheduleDto, CreateMaintenanceDto, RecordFuelDto, RecordAccidentDto, RecordCostDto, ListTransportOrdersQuery } from './logistics-supplement.dto'
import type { TransportOrder, CargoLoad, RoutePlan, DriverSchedule, VehicleMaintenanceRecord, FuelRecord, AccidentRecord, LogisticsCost } from './logistics-supplement.entity'

@Controller('logistics-supplement')
@UseGuards(IdentityAccessGuard)
@UsePipes(new ValidationPipe({ transform: true }))
export class LogisticsSupplementController {
  constructor(private readonly service: LogisticsSupplementService) {}

  @Post('transport-orders')
  createTransportOrder(@Body() dto: CreateTransportOrderDto): Promise<TransportOrder> { return this.service.createTransportOrder(dto) }

  @Get('transport-orders/:id')
  getTransportOrder(@Param('id') id: string): Promise<TransportOrder> { return this.service.getTransportOrder(id) }

  @Get('transport-orders')
  listTransportOrders(@Query() query: ListTransportOrdersQuery): Promise<TransportOrder[]> { return this.service.listTransportOrders(query) }

  @Patch('transport-orders/:id/status')
  updateStatus(@Param('id') id: string, @Body() dto: UpdateTransportOrderStatusDto): Promise<TransportOrder> { return this.service.updateTransportOrderStatus(id, dto.status) }

  @Post('cargo-loads')
  addCargoLoad(@Body() dto: AddCargoLoadDto): Promise<CargoLoad> { return this.service.addCargoLoad(dto) }

  @Get('cargo-loads')
  getCargoLoads(@Query('transportOrderId') id: string): Promise<CargoLoad[]> { return this.service.getCargoLoads(id) }

  @Post('route-plans')
  createRoutePlan(@Body() dto: CreateRoutePlanDto): Promise<RoutePlan> { return this.service.createRoutePlan(dto) }

  @Get('route-plans/:id')
  getRoutePlan(@Param('id') id: string): Promise<RoutePlan> { return this.service.getRoutePlan(id) }

  @Post('route-plans/:id/optimize')
  optimizeRoute(@Param('id') id: string): Promise<RoutePlan> { return this.service.optimizeRoute(id) }

  @Post('driver-schedules')
  createSchedule(@Body() dto: CreateDriverScheduleDto): Promise<DriverSchedule> { return this.service.createDriverSchedule(dto) }

  @Get('driver-schedules')
  getSchedules(@Query('driverId') driverId?: string, @Query('date') date?: string): Promise<DriverSchedule[]> { return this.service.getDriverSchedules(driverId, date) }

  @Post('maintenance')
  createMaintenance(@Body() dto: CreateMaintenanceDto): Promise<VehicleMaintenanceRecord> { return this.service.createMaintenanceRecord(dto) }

  @Get('maintenance/:vehicleId/history')
  getMaintenanceHistory(@Param('vehicleId') vid: string): Promise<VehicleMaintenanceRecord[]> { return this.service.getVehicleMaintenanceHistory(vid) }

  @Get('maintenance/upcoming')
  getUpcomingMaintenance(@Query('vehicleId') vid?: string): Promise<VehicleMaintenanceRecord[]> { return this.service.getUpcomingMaintenance(vid) }

  @Post('fuel')
  recordFuel(@Body() dto: RecordFuelDto): Promise<FuelRecord> { return this.service.recordFuel(dto) }

  @Get('fuel/:vehicleId')
  getFuelRecords(@Param('vehicleId') vid: string, @Query('startDate') sd?: string, @Query('endDate') ed?: string): Promise<FuelRecord[]> { return this.service.getFuelRecords(vid, sd, ed) }

  @Get('fuel/:vehicleId/efficiency')
  getFuelEfficiency(@Param('vehicleId') vid: string) { return this.service.getFuelEfficiency(vid) }

  @Post('accidents')
  recordAccident(@Body() dto: RecordAccidentDto): Promise<AccidentRecord> { return this.service.recordAccident(dto) }

  @Get('accidents')
  getAccidents(@Query('vehicleId') vid?: string): Promise<AccidentRecord[]> { return this.service.getAccidentRecords(vid) }

  @Post('costs')
  recordCost(@Body() dto: RecordCostDto): Promise<LogisticsCost> { return this.service.recordCost(dto) }

  @Get('costs/summary')
  getCostSummary(@Query('startDate') sd: string, @Query('endDate') ed: string) { return this.service.getCostSummary(sd, ed) }
}
