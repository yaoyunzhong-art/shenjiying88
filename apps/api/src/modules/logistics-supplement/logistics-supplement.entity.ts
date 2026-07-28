/**
 * logistics-supplement.entity.ts
 * P-30 后勤补充模块 — 实体定义
 *
 * TransportOrder: 运输调度单
 * CargoLoad: 装运货物记录
 * RoutePlan: 路线规划
 * DriverSchedule: 司机排班
 * VehicleMaintenanceRecord: 车辆维保记录
 * FuelRecord: 油耗记录
 * AccidentRecord: 事故记录
 * LogisticsCost: 物流成本核算
 */

import { randomUUID } from 'node:crypto'

// ── ID 生成器 ───────────────────────────────────────────────────────────────

export function createTransportOrderId(): string { return `to-${randomUUID()}` }
export function createCargoLoadId(): string { return `cl-${randomUUID()}` }
export function createRoutePlanId(): string { return `rp-${randomUUID()}` }
export function createDriverScheduleId(): string { return `ds-${randomUUID()}` }
export function createVehicleMaintId(): string { return `vm-${randomUUID()}` }
export function createFuelRecordId(): string { return `fr-${randomUUID()}` }
export function createAccidentRecordId(): string { return `ac-${randomUUID()}` }
export function createLogisticsCostId(): string { return `lc-${randomUUID()}` }

// ── 运输调度单 ─────────────────────────────────────────────────────────────

export type TransportOrderStatus =
  | 'draft' | 'pending_approval' | 'approved' | 'dispatched'
  | 'loading' | 'in_transit' | 'arrived' | 'unloading' | 'completed' | 'cancelled'

export type TransportType = 'express' | 'normal' | 'bulk' | 'cold_chain' | 'dangerous'

export interface TransportOrderItem {
  cargoId: string
  cargoName: string
  quantity: number
  unit: string
  weightKg: number
  volumeM3?: number
}

export interface TransportOrder {
  id: string
  tenantId: string
  storeId?: string
  orderNumber: string
  transportType: TransportType
  status: TransportOrderStatus
  originWarehouseCode: string
  originAddress: string
  destinationWarehouseCode: string
  destinationAddress: string
  items: TransportOrderItem[]
  totalWeightKg: number
  totalVolumeM3?: number
  driverId?: string
  driverName?: string
  vehiclePlate?: string
  scheduledPickupAt?: string
  actualPickupAt?: string
  estimatedArrivalAt?: string
  actualArrivalAt?: string
  routePlanId?: string
  notes?: string
  createdBy: string
  createdByName?: string
  createdAt: string
  updatedAt: string
}

// ── 装运货物记录 ───────────────────────────────────────────────────────────

export type CargoStatus = 'pending' | 'loaded' | 'in_transit' | 'delivered' | 'damaged' | 'lost' | 'returned'

export interface CargoLoad {
  id: string
  tenantId: string
  transportOrderId: string
  cargoCode: string
  cargoName: string
  quantity: number
  unit: string
  weightKg: number
  volumeM3?: number
  status: CargoStatus
  loadingPhoto?: string
  unloadingPhoto?: string
  sealNumber?: string
  damagedDescription?: string
  loadedBy?: string
  loadedByName?: string
  loadedAt?: string
  unloadedBy?: string
  unloadedByName?: string
  unloadedAt?: string
  createdAt: string
  updatedAt: string
}

// ── 路线规划 ───────────────────────────────────────────────────────────────

export type RouteStatus = 'active' | 'inactive' | 'archived'

export interface RouteWaypoint {
  sequence: number
  warehouseCode: string
  address: string
  estimatedArrivalAt?: string
  actualArrivalAt?: string
}

export interface RoutePlan {
  id: string
  tenantId: string
  name: string
  originWarehouseCode: string
  destinationWarehouseCode: string
  waypoints: RouteWaypoint[]
  totalDistanceKm: number
  estimatedDurationMin: number
  preferredVehicleType?: string
  tollCost?: number
  status: RouteStatus
  notes?: string
  createdBy: string
  createdAt: string
  updatedAt: string
}

// ── 司机排班 ───────────────────────────────────────────────────────────────

export type DriverScheduleStatus = 'scheduled' | 'checked_in' | 'dispatched' | 'on_break' | 'completed' | 'absent'

export interface DriverSchedule {
  id: string
  tenantId: string
  driverId: string
  driverName: string
  driverPhone?: string
  vehiclePlate?: string
  scheduleDate: string
  shiftName: string
  shiftStart: string
  shiftEnd: string
  transportOrderIds: string[]
  status: DriverScheduleStatus
  checkedInAt?: string
  checkedOutAt?: string
  onBreakAt?: string
  breakEndAt?: string
  overtimeMinutes?: number
  notes?: string
  createdBy: string
  createdAt: string
  updatedAt: string
}

// ── 车辆维保记录 ───────────────────────────────────────────────────────────

export type VehicleMaintStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled'
export type VehicleMaintType = 'routine_check' | 'oil_change' | 'tire_replacement' | 'brake_service'
  | 'engine_repair' | 'transmission_service' | 'ac_service' | 'annual_inspection' | 'other'

export interface VehicleMaintenanceRecord {
  id: string
  tenantId: string
  vehiclePlate: string
  vehicleModel?: string
  odometerKm: number
  maintType: VehicleMaintType
  description: string
  status: VehicleMaintStatus
  scheduledAt?: string
  startedAt?: string
  completedAt?: string
  serviceProvider?: string
  costCent?: number
  partsUsed?: string[]
  notes?: string
  operatorId: string
  operatorName: string
  createdAt: string
  updatedAt: string
}

// ── 油耗记录 ───────────────────────────────────────────────────────────────

export interface FuelRecord {
  id: string
  tenantId: string
  vehiclePlate: string
  driverId: string
  driverName: string
  fuelDate: string
  liters: number
  costCent: number
  unitPriceCent: number
  odometerKm: number
  stationName?: string
  receiptPhoto?: string
  notes?: string
  createdBy: string
  createdAt: string
  updatedAt: string
}

// ── 事故记录 ───────────────────────────────────────────────────────────────

export type AccidentSeverity = 'minor' | 'moderate' | 'serious' | 'fatal'
export type AccidentResponsibility = 'self' | 'counterparty' | 'shared' | 'undefined'

export interface AccidentRecord {
  id: string
  tenantId: string
  transportOrderId?: string
  vehiclePlate: string
  driverId: string
  driverName: string
  accidentAt: string
  location: string
  severity: AccidentSeverity
  responsibility: AccidentResponsibility
  description: string
  casualties?: number
  propertyDamageCent?: number
  insuranceClaimId?: string
  insuranceClaimCent?: number
  policeReportId?: string
  resolved: boolean
  resolution?: string
  resolvedAt?: string
  createdBy: string
  createdAt: string
  updatedAt: string
}

// ── 物流成本核算 ───────────────────────────────────────────────────────────

export type CostType = 'transport' | 'fuel' | 'maintenance' | 'toll' | 'parking'
  | 'insurance' | 'salary' | 'depreciation' | 'rental' | 'other'

export interface LogisticsCostItem {
  costType: CostType
  amountCent: number
  description?: string
}

export interface LogisticsCost {
  id: string
  tenantId: string
  transportOrderId?: string
  periodStart: string
  periodEnd: string
  items: LogisticsCostItem[]
  totalCent: number
  vehiclePlate?: string
  notes?: string
  createdBy: string
  createdAt: string
  updatedAt: string
}

// ── 统计指标 ───────────────────────────────────────────────────────────────

export interface LogisticsSupplementMetrics {
  totalTransportOrders: number
  inTransitOrders: number
  completedOrders: number
  cancelledOrders: number
  totalDrivers: number
  totalVehicles: number
  totalAccidents: number
  unresolvedAccidents: number
  totalFuelCostCent: number
  totalMaintenanceCostCent: number
  onTimeDeliveryRate: number
  averageDeliveryHours: number
}
