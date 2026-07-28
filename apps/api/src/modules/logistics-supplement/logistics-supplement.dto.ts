import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsNumber,
  IsArray,
  IsBoolean,
  IsDateString,
  Min,
  Max,
  MaxLength,
  ArrayMinSize,
  ValidateNested,
} from 'class-validator'
import { Type } from 'class-transformer'
import type {
  TransportOrderStatus,
  TransportType,
  CargoStatus,
  RouteStatus,
  DriverScheduleStatus,
  VehicleMaintStatus,
  VehicleMaintType,
  AccidentSeverity,
  AccidentResponsibility,
  CostType,
} from './logistics-supplement.entity'

// ── 运输调度单 DTO ─────────────────────────────────────────────────────────

export class TransportOrderItemDto {
  @IsString() @IsNotEmpty() @MaxLength(100) cargoId!: string
  @IsString() @IsNotEmpty() @MaxLength(200) cargoName!: string
  @IsNumber() @Min(1) quantity!: number
  @IsString() @IsNotEmpty() @MaxLength(20) unit!: string
  @IsNumber() @Min(0.01) weightKg!: number
  @IsOptional() @IsNumber() @Min(0) volumeM3?: number
}

export class CreateTransportOrderDto {
  @IsString() @IsNotEmpty() @MaxLength(50) orderNumber!: string
  @IsEnum(['express','normal','bulk','cold_chain','dangerous'] as const) transportType!: TransportType
  @IsString() @IsNotEmpty() @MaxLength(50) originWarehouseCode!: string
  @IsString() @IsNotEmpty() @MaxLength(500) originAddress!: string
  @IsString() @IsNotEmpty() @MaxLength(50) destinationWarehouseCode!: string
  @IsString() @IsNotEmpty() @MaxLength(500) destinationAddress!: string
  @IsArray() @ArrayMinSize(1) @ValidateNested({ each: true })
  @Type(() => TransportOrderItemDto) items!: TransportOrderItemDto[]
  @IsOptional() @IsString() @MaxLength(50) driverId?: string
  @IsOptional() @IsString() @MaxLength(50) driverName?: string
  @IsOptional() @IsString() @MaxLength(20) vehiclePlate?: string
  @IsOptional() @IsDateString() scheduledPickupAt?: string
  @IsOptional() @IsDateString() estimatedArrivalAt?: string
  @IsOptional() @IsString() @MaxLength(1000) notes?: string
  @IsString() @IsNotEmpty() createdBy!: string
  @IsOptional() @IsString() @MaxLength(100) createdByName?: string
}

export class UpdateTransportOrderStatusDto {
  @IsEnum(['draft','pending_approval','approved','dispatched','loading','in_transit','arrived','unloading','completed','cancelled'] as const)
  status!: TransportOrderStatus
}

export class UpdateTransportOrderDto {
  @IsOptional() @IsEnum(['draft','pending_approval','approved','dispatched','loading','in_transit','arrived','unloading','completed','cancelled'] as const) status?: TransportOrderStatus
  @IsOptional() @IsString() @MaxLength(50) driverId?: string
  @IsOptional() @IsString() @MaxLength(50) driverName?: string
  @IsOptional() @IsString() @MaxLength(20) vehiclePlate?: string
  @IsOptional() @IsDateString() scheduledPickupAt?: string
  @IsOptional() @IsDateString() actualPickupAt?: string
  @IsOptional() @IsDateString() estimatedArrivalAt?: string
  @IsOptional() @IsDateString() actualArrivalAt?: string
  @IsOptional() @IsString() @MaxLength(1000) notes?: string
}

export class QueryTransportOrderDto {
  @IsOptional() @IsString() status?: TransportOrderStatus
  @IsOptional() @IsString() transportType?: TransportType
  @IsOptional() @IsString() driverId?: string
  @IsOptional() @IsString() vehiclePlate?: string
}

// ── 货物记录 DTO ───────────────────────────────────────────────────────────

export class CreateCargoLoadDto {
  @IsString() @IsNotEmpty() transportOrderId!: string
  @IsString() @IsNotEmpty() @MaxLength(100) cargoCode!: string
  @IsString() @IsNotEmpty() @MaxLength(200) cargoName!: string
  @IsNumber() @Min(1) quantity!: number
  @IsString() @IsNotEmpty() @MaxLength(20) unit!: string
  @IsNumber() @Min(0.01) weightKg!: number
  @IsOptional() @IsNumber() @Min(0) volumeM3?: number
  @IsOptional() @IsString() sealNumber?: string
  @IsOptional() @IsString() @MaxLength(50) loadedBy?: string
  @IsOptional() @IsString() @MaxLength(100) loadedByName?: string
}

export class UpdateCargoStatusDto {
  @IsEnum(['pending','loaded','in_transit','delivered','damaged','lost','returned'] as const) status!: CargoStatus
  @IsOptional() @IsString() unloadingPhoto?: string
  @IsOptional() @IsString() @MaxLength(500) damagedDescription?: string
  @IsOptional() @IsString() @MaxLength(50) unloadedBy?: string
  @IsOptional() @IsString() @MaxLength(100) unloadedByName?: string
}

// ── 路线规划 DTO ───────────────────────────────────────────────────────────

export class RouteWaypointDto {
  @IsNumber() @Min(1) sequence!: number
  @IsString() @IsNotEmpty() @MaxLength(50) warehouseCode!: string
  @IsString() @IsNotEmpty() @MaxLength(500) address!: string
  @IsOptional() @IsDateString() estimatedArrivalAt?: string
}

export class CreateRoutePlanDto {
  @IsString() @IsNotEmpty() @MaxLength(200) name!: string
  @IsString() @IsNotEmpty() @MaxLength(50) originWarehouseCode!: string
  @IsString() @IsNotEmpty() @MaxLength(50) destinationWarehouseCode!: string
  @IsArray() @ArrayMinSize(1) @ValidateNested({ each: true })
  @Type(() => RouteWaypointDto) waypoints!: RouteWaypointDto[]
  @IsNumber() @Min(0) totalDistanceKm!: number
  @IsNumber() @Min(0) estimatedDurationMin!: number
  @IsOptional() @IsString() @MaxLength(50) preferredVehicleType?: string
  @IsOptional() @IsNumber() @Min(0) tollCost?: number
  @IsOptional() @IsString() @MaxLength(1000) notes?: string
  @IsString() @IsNotEmpty() createdBy!: string
}

export class UpdateRoutePlanDto {
  @IsOptional() @IsString() @MaxLength(200) name?: string
  @IsOptional() @IsEnum(['active','inactive','archived'] as const) status?: RouteStatus
  @IsOptional() @IsNumber() @Min(0) totalDistanceKm?: number
  @IsOptional() @IsNumber() @Min(0) estimatedDurationMin?: number
  @IsOptional() @IsNumber() @Min(0) tollCost?: number
  @IsOptional() @IsString() @MaxLength(1000) notes?: string
}

// ── 司机排班 DTO ───────────────────────────────────────────────────────────

export class CreateDriverScheduleDto {
  @IsString() @IsNotEmpty() @MaxLength(50) driverId!: string
  @IsString() @IsNotEmpty() @MaxLength(100) driverName!: string
  @IsOptional() @IsString() @MaxLength(20) driverPhone?: string
  @IsOptional() @IsString() @MaxLength(20) vehiclePlate?: string
  @IsString() @IsNotEmpty() scheduleDate!: string
  @IsString() @IsNotEmpty() @MaxLength(50) shiftName!: string
  @IsString() @IsNotEmpty() shiftStart!: string
  @IsString() @IsNotEmpty() shiftEnd!: string
  @IsOptional() @IsString({ each: true }) transportOrderIds?: string[]
  @IsOptional() @IsString() @MaxLength(500) notes?: string
  @IsString() @IsNotEmpty() createdBy!: string
}

export class UpdateDriverScheduleStatusDto {
  @IsEnum(['scheduled','checked_in','dispatched','on_break','completed','absent'] as const) status!: DriverScheduleStatus
  @IsOptional() @IsNumber() @Min(0) overtimeMinutes?: number
  @IsOptional() @IsString() @MaxLength(500) notes?: string
}

// ── 车辆维保记录 DTO ───────────────────────────────────────────────────────

export class CreateVehicleMaintenanceRecordDto {
  @IsString() @IsNotEmpty() @MaxLength(20) vehiclePlate!: string
  @IsOptional() @IsString() @MaxLength(50) vehicleModel?: string
  @IsNumber() @Min(0) odometerKm!: number
  @IsEnum(['routine_check','oil_change','tire_replacement','brake_service','engine_repair','transmission_service','ac_service','annual_inspection','other'] as const) maintType!: VehicleMaintType
  @IsString() @IsNotEmpty() @MaxLength(1000) description!: string
  @IsOptional() @IsDateString() scheduledAt?: string
  @IsOptional() @IsString() @MaxLength(200) serviceProvider?: string
  @IsOptional() @IsNumber() @Min(0) costCent?: number
  @IsOptional() @IsString({ each: true }) partsUsed?: string[]
  @IsOptional() @IsString() @MaxLength(500) notes?: string
  @IsString() @IsNotEmpty() operatorId!: string
  @IsString() @IsNotEmpty() @MaxLength(100) operatorName!: string
}

export class UpdateVehicleMaintenanceDto {
  @IsOptional() @IsEnum(['pending','in_progress','completed','cancelled'] as const) status?: VehicleMaintStatus
  @IsOptional() @IsDateString() startedAt?: string
  @IsOptional() @IsDateString() completedAt?: string
  @IsOptional() @IsNumber() @Min(0) costCent?: number
  @IsOptional() @IsString({ each: true }) partsUsed?: string[]
  @IsOptional() @IsString() @MaxLength(500) notes?: string
}

// ── 油耗记录 DTO ───────────────────────────────────────────────────────────

export class CreateFuelRecordDto {
  @IsString() @IsNotEmpty() @MaxLength(20) vehiclePlate!: string
  @IsString() @IsNotEmpty() @MaxLength(50) driverId!: string
  @IsString() @IsNotEmpty() @MaxLength(100) driverName!: string
  @IsDateString() fuelDate!: string
  @IsNumber() @Min(0.01) liters!: number
  @IsNumber() @Min(0) costCent!: number
  @IsNumber() @Min(0) odometerKm!: number
  @IsOptional() @IsString() @MaxLength(100) stationName?: string
  @IsOptional() @IsString() @MaxLength(500) notes?: string
  @IsString() @IsNotEmpty() createdBy!: string
}

// ── 事故记录 DTO ───────────────────────────────────────────────────────────

export class CreateAccidentRecordDto {
  @IsOptional() @IsString() transportOrderId?: string
  @IsString() @IsNotEmpty() @MaxLength(20) vehiclePlate!: string
  @IsString() @IsNotEmpty() @MaxLength(50) driverId!: string
  @IsString() @IsNotEmpty() @MaxLength(100) driverName!: string
  @IsDateString() accidentAt!: string
  @IsString() @IsNotEmpty() @MaxLength(500) location!: string
  @IsEnum(['minor','moderate','serious','fatal'] as const) severity!: AccidentSeverity
  @IsEnum(['self','counterparty','shared','undefined'] as const) responsibility!: AccidentResponsibility
  @IsString() @IsNotEmpty() @MaxLength(2000) description!: string
  @IsOptional() @IsNumber() @Min(0) casualties?: number
  @IsOptional() @IsNumber() @Min(0) propertyDamageCent?: number
  @IsOptional() @IsString() @MaxLength(50) insuranceClaimId?: string
  @IsOptional() @IsNumber() @Min(0) insuranceClaimCent?: number
  @IsOptional() @IsString() @MaxLength(50) policeReportId?: string
  @IsString() @IsNotEmpty() createdBy!: string
}

export class ResolveAccidentDto {
  @IsString() @IsNotEmpty() @MaxLength(2000) resolution!: string
  @IsOptional() @IsNumber() @Min(0) insuranceClaimCent?: number
}

// ── 物流成本 DTO ───────────────────────────────────────────────────────────

export class LogisticsCostItemDto {
  @IsEnum(['transport','fuel','maintenance','toll','parking','insurance','salary','depreciation','rental','other'] as const) costType!: CostType
  @IsNumber() @Min(0) amountCent!: number
  @IsOptional() @IsString() @MaxLength(500) description?: string
}

export class CreateLogisticsCostDto {
  @IsOptional() @IsString() transportOrderId?: string
  @IsDateString() periodStart!: string
  @IsDateString() periodEnd!: string
  @IsArray() @ArrayMinSize(1) @ValidateNested({ each: true })
  @Type(() => LogisticsCostItemDto) items!: LogisticsCostItemDto[]
  @IsOptional() @IsString() @MaxLength(20) vehiclePlate?: string
  @IsOptional() @IsString() @MaxLength(500) notes?: string
  @IsString() @IsNotEmpty() createdBy!: string
}

// ── Controller 别名 / 查询 (依赖定义在后的基类，所以放在文件末尾) ──────────────

export class ListTransportOrdersQuery extends QueryTransportOrderDto {
  @IsOptional() @IsString() tenantId?: string
}

/** @deprecated 使用 CreateCargoLoadDto */
export class AddCargoLoadDto extends CreateCargoLoadDto {}

/** @deprecated 使用 CreateVehicleMaintenanceRecordDto */
export class CreateMaintenanceDto extends CreateVehicleMaintenanceRecordDto {}

/** @deprecated 使用 CreateFuelRecordDto */
export class RecordFuelDto extends CreateFuelRecordDto {}

/** @deprecated 使用 CreateAccidentRecordDto */
export class RecordAccidentDto extends CreateAccidentRecordDto {}

/** @deprecated 使用 CreateLogisticsCostDto */
export class RecordCostDto extends CreateLogisticsCostDto {}
