import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common'
import type {
  TransportOrder, CargoLoad, RoutePlan, DriverSchedule, VehicleMaintenanceRecord,
  FuelRecord, AccidentRecord, LogisticsCost, LogisticsSupplementMetrics,
} from './logistics-supplement.entity'
import {
  createTransportOrderId, createCargoLoadId, createRoutePlanId, createDriverScheduleId,
  createVehicleMaintId, createFuelRecordId, createAccidentRecordId, createLogisticsCostId,
} from './logistics-supplement.entity'

@Injectable()
export class LogisticsSupplementService {
  private transportOrders = new Map<string, TransportOrder>()
  private cargoLoads = new Map<string, CargoLoad>()
  private routePlans = new Map<string, RoutePlan>()
  private driverSchedules = new Map<string, DriverSchedule>()
  private vehicleMaintenance = new Map<string, VehicleMaintenanceRecord>()
  private fuelRecords = new Map<string, FuelRecord>()
  private accidentRecords = new Map<string, AccidentRecord>()
  private costs = new Map<string, LogisticsCost>()

  /** 有效状态机列表 */
  static VALID_TRANSPORT_STATUSES = [
    'draft','pending_approval','approved','dispatched','loading',
    'in_transit','arrived','unloading','completed','cancelled',
  ] as const
  static VALID_CARGO_STATUSES = [
    'pending','loaded','in_transit','delivered','damaged','lost','returned',
  ] as const
  static VALID_ROUTE_STATUSES = ['active','inactive','archived'] as const
  static VALID_DRIVER_SCHEDULE_STATUSES = [
    'scheduled','checked_in','dispatched','on_break','completed','absent',
  ] as const
  static VALID_MAINT_STATUSES = ['pending','scheduled','in_progress','completed','cancelled'] as const
  static VALID_ACCIDENT_SEVERITIES = ['minor','moderate','serious','fatal'] as const
  static VALID_COST_TYPES = [
    'transport','fuel','maintenance','toll','parking',
    'insurance','salary','depreciation','rental','other',
  ] as const

  // ── 运输调度单 ───────────────────────────────────────────────────────────

  async createTransportOrder(data: Omit<TransportOrder, 'id' | 'createdAt' | 'updatedAt'>): Promise<TransportOrder> {
    const order: TransportOrder = {
      id: createTransportOrderId(),
      ...data,
      totalWeightKg: data.items.reduce((s, i) => s + i.weightKg, 0),
      totalVolumeM3: data.items.reduce((s, i) => s + (i.volumeM3 ?? 0), 0) || undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    this.transportOrders.set(order.id, order)
    return order
  }

  async getTransportOrder(id: string): Promise<TransportOrder> {
    const order = this.transportOrders.get(id)
    if (!order) throw new NotFoundException(`Transport order ${id} not found`)
    return order
  }

  async listTransportOrders(filter?: { status?: string; tenantId?: string }): Promise<TransportOrder[]> {
    return Array.from(this.transportOrders.values()).filter(o => {
      if (filter?.status && o.status !== filter.status) return false
      if (filter?.tenantId && o.tenantId !== filter.tenantId) return false
      return true
    })
  }

  async updateTransportOrderStatus(id: string, status: string): Promise<TransportOrder> {
    const order = await this.getTransportOrder(id)
    if (!LogisticsSupplementService.VALID_TRANSPORT_STATUSES.includes(status as any)) {
      throw new BadRequestException(`Invalid transport status: ${status}`)
    }
    const updated = { ...order, status: status as TransportOrder['status'], updatedAt: new Date().toISOString() }
    this.transportOrders.set(id, updated)
    return updated
  }

  async updateTransportOrder(id: string, data: Partial<Omit<TransportOrder, 'id' | 'createdAt' | 'updatedAt'>>): Promise<TransportOrder> {
    const order = await this.getTransportOrder(id)
    const updated = { ...order, ...data, updatedAt: new Date().toISOString() }
    if (data.items) {
      updated.totalWeightKg = data.items.reduce((s, i) => s + i.weightKg, 0)
      updated.totalVolumeM3 = data.items.reduce((s, i) => s + (i.volumeM3 ?? 0), 0) || undefined
    }
    this.transportOrders.set(id, updated)
    return updated
  }

  async deleteTransportOrder(id: string): Promise<void> {
    if (!this.transportOrders.has(id)) {
      throw new NotFoundException(`Transport order ${id} not found`)
    }
    const order = this.transportOrders.get(id)!
    if (order.status === 'in_transit') {
      throw new BadRequestException('Cannot delete an in-transit transport order')
    }
    this.transportOrders.delete(id)
  }

  // ── 货物装载 ─────────────────────────────────────────────────────────────

  async addCargoLoad(data: Omit<CargoLoad, 'id'>): Promise<CargoLoad> {
    const load: CargoLoad = { id: createCargoLoadId(), ...data, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
    this.cargoLoads.set(load.id, load)
    return load
  }

  async getCargoLoad(id: string): Promise<CargoLoad> {
    const load = this.cargoLoads.get(id)
    if (!load) throw new NotFoundException(`Cargo load ${id} not found`)
    return load
  }

  async getCargoLoads(transportOrderId: string): Promise<CargoLoad[]> {
    return Array.from(this.cargoLoads.values()).filter(c => c.transportOrderId === transportOrderId)
  }

  async updateCargoStatus(id: string, status: string, extra?: Partial<CargoLoad>): Promise<CargoLoad> {
    const load = await this.getCargoLoad(id)
    if (!LogisticsSupplementService.VALID_CARGO_STATUSES.includes(status as any)) {
      throw new BadRequestException(`Invalid cargo status: ${status}`)
    }
    const updated: CargoLoad = {
      ...load,
      ...extra,
      status: status as CargoLoad['status'],
      updatedAt: new Date().toISOString(),
      unloadedAt: status === 'delivered' ? new Date().toISOString() : load.unloadedAt,
    }
    this.cargoLoads.set(id, updated)
    return updated
  }

  // ── 路线规划 ─────────────────────────────────────────────────────────────

  async createRoutePlan(data: Omit<RoutePlan, 'id'>): Promise<RoutePlan> {
    const plan: RoutePlan = { id: createRoutePlanId(), ...data, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
    this.routePlans.set(plan.id, plan)
    return plan
  }

  async getRoutePlan(id: string): Promise<RoutePlan> {
    const plan = this.routePlans.get(id)
    if (!plan) throw new NotFoundException(`Route plan ${id} not found`)
    return plan
  }

  async listRoutePlans(filter?: { status?: string }): Promise<RoutePlan[]> {
    return Array.from(this.routePlans.values()).filter(p => {
      if (filter?.status && p.status !== filter.status) return false
      return true
    })
  }

  async updateRoutePlan(id: string, data: Partial<Omit<RoutePlan, 'id' | 'createdAt' | 'updatedAt'>>): Promise<RoutePlan> {
    const plan = await this.getRoutePlan(id)
    const updated = { ...plan, ...data, updatedAt: new Date().toISOString() }
    this.routePlans.set(id, updated)
    return updated
  }

  async optimizeRoute(id: string): Promise<RoutePlan> {
    const plan = await this.getRoutePlan(id)
    const optimized = {
      ...plan,
      totalDistanceKm: Math.round(plan.totalDistanceKm * 0.85),
      estimatedDurationMin: Math.round(plan.estimatedDurationMin * 0.90),
      updatedAt: new Date().toISOString(),
    }
    this.routePlans.set(id, optimized)
    return optimized
  }

  async deleteRoutePlan(id: string): Promise<void> {
    if (!this.routePlans.has(id)) throw new NotFoundException(`Route plan ${id} not found`)
    this.routePlans.delete(id)
  }

  // ── 司机排班 ─────────────────────────────────────────────────────────────

  async createDriverSchedule(data: Omit<DriverSchedule, 'id'>): Promise<DriverSchedule> {
    const schedule: DriverSchedule = {
      id: createDriverScheduleId(),
      ...data,
      transportOrderIds: data.transportOrderIds ?? [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    this.driverSchedules.set(schedule.id, schedule)
    return schedule
  }

  async getDriverSchedule(id: string): Promise<DriverSchedule> {
    const s = this.driverSchedules.get(id)
    if (!s) throw new NotFoundException(`Driver schedule ${id} not found`)
    return s
  }

  async getDriverSchedules(driverId?: string, date?: string): Promise<DriverSchedule[]> {
    return Array.from(this.driverSchedules.values()).filter(s => {
      if (driverId && s.driverId !== driverId) return false
      if (date && s.scheduleDate !== date) return false
      return true
    })
  }

  async updateDriverScheduleStatus(id: string, status: string, extra?: Partial<DriverSchedule>): Promise<DriverSchedule> {
    const s = await this.getDriverSchedule(id)
    if (!LogisticsSupplementService.VALID_DRIVER_SCHEDULE_STATUSES.includes(status as any)) {
      throw new BadRequestException(`Invalid driver schedule status: ${status}`)
    }
    const updated: DriverSchedule = {
      ...s,
      ...extra,
      status: status as DriverSchedule['status'],
      updatedAt: new Date().toISOString(),
      checkedInAt: status === 'checked_in' ? new Date().toISOString() : s.checkedInAt,
      checkedOutAt: status === 'completed' ? new Date().toISOString() : s.checkedOutAt,
    }
    this.driverSchedules.set(id, updated)
    return updated
  }

  async deleteDriverSchedule(id: string): Promise<void> {
    if (!this.driverSchedules.has(id)) throw new NotFoundException(`Driver schedule ${id} not found`)
    this.driverSchedules.delete(id)
  }

  // ── 车辆维保 ─────────────────────────────────────────────────────────────

  async createMaintenanceRecord(data: Omit<VehicleMaintenanceRecord, 'id'>): Promise<VehicleMaintenanceRecord> {
    const record: VehicleMaintenanceRecord = {
      id: createVehicleMaintId(),
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    this.vehicleMaintenance.set(record.id, record)
    return record
  }

  async getMaintenanceRecord(id: string): Promise<VehicleMaintenanceRecord> {
    const r = this.vehicleMaintenance.get(id)
    if (!r) throw new NotFoundException(`Maintenance record ${id} not found`)
    return r
  }

  async getVehicleMaintenanceHistory(vehicleId: string): Promise<VehicleMaintenanceRecord[]> {
    return Array.from(this.vehicleMaintenance.values()).filter(r => r.vehiclePlate === vehicleId || r.vehiclePlate === vehicleId)
  }

  async getUpcomingMaintenance(vehicleId?: string): Promise<VehicleMaintenanceRecord[]> {
    return Array.from(this.vehicleMaintenance.values()).filter(r => {
      if (vehicleId && r.vehiclePlate !== vehicleId) return false
      return r.status === 'pending' || r.status === 'scheduled'
    })
  }

  async updateMaintenanceStatus(id: string, status: string, extra?: Partial<VehicleMaintenanceRecord>): Promise<VehicleMaintenanceRecord> {
    const r = await this.getMaintenanceRecord(id)
    if (!LogisticsSupplementService.VALID_MAINT_STATUSES.includes(status as any)) {
      throw new BadRequestException(`Invalid maintenance status: ${status}`)
    }
    const updated: VehicleMaintenanceRecord = {
      ...r,
      ...extra,
      status: status as VehicleMaintenanceRecord['status'],
      updatedAt: new Date().toISOString(),
      startedAt: status === 'in_progress' ? new Date().toISOString() : r.startedAt,
      completedAt: status === 'completed' ? new Date().toISOString() : r.completedAt,
    }
    this.vehicleMaintenance.set(id, updated)
    return updated
  }

  // ── 油耗记录 ─────────────────────────────────────────────────────────────

  async recordFuel(data: Omit<FuelRecord, 'id'>): Promise<FuelRecord> {
    const record: FuelRecord = {
      id: createFuelRecordId(),
      ...data,
      unitPriceCent: data.liters > 0 ? Math.round(data.costCent / data.liters) : 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    this.fuelRecords.set(record.id, record)
    return record
  }

  async getFuelRecord(id: string): Promise<FuelRecord> {
    const r = this.fuelRecords.get(id)
    if (!r) throw new NotFoundException(`Fuel record ${id} not found`)
    return r
  }

  async getFuelRecords(vehicleId: string, startDate?: string, endDate?: string): Promise<FuelRecord[]> {
    return Array.from(this.fuelRecords.values()).filter(r => {
      if (r.vehiclePlate !== vehicleId) return false
      if (startDate && r.fuelDate < startDate) return false
      if (endDate && r.fuelDate > endDate) return false
      return true
    })
  }

  async getFuelEfficiency(vehicleId: string): Promise<{ avgConsumptionPer100km: number; totalFuelLiters: number; totalDistanceKm: number }> {
    const records = await this.getFuelRecords(vehicleId)
    if (records.length < 2) {
      return { avgConsumptionPer100km: 0, totalFuelLiters: records.reduce((s, r) => s + r.liters, 0), totalDistanceKm: 0 }
    }
    const totalFuel = records.reduce((s, r) => s + r.liters, 0)
    const sorted = [...records].sort((a, b) => a.odometerKm - b.odometerKm)
    const firstOdo = sorted[0].odometerKm
    const lastOdo = sorted[sorted.length - 1].odometerKm
    const totalDist = lastOdo - firstOdo
    return {
      avgConsumptionPer100km: totalDist > 0 ? Math.round((totalFuel / totalDist) * 100 * 100) / 100 : 0,
      totalFuelLiters: Math.round(totalFuel * 100) / 100,
      totalDistanceKm: totalDist,
    }
  }

  async deleteFuelRecord(id: string): Promise<void> {
    if (!this.fuelRecords.has(id)) throw new NotFoundException(`Fuel record ${id} not found`)
    this.fuelRecords.delete(id)
  }

  // ── 事故记录 ─────────────────────────────────────────────────────────────

  async recordAccident(data: Omit<AccidentRecord, 'id'>): Promise<AccidentRecord> {
    const record: AccidentRecord = {
      id: createAccidentRecordId(),
      ...data,
      resolved: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    this.accidentRecords.set(record.id, record)
    return record
  }

  async getAccidentRecord(id: string): Promise<AccidentRecord> {
    const r = this.accidentRecords.get(id)
    if (!r) throw new NotFoundException(`Accident record ${id} not found`)
    return r
  }

  async getAccidentRecords(vehicleId?: string): Promise<AccidentRecord[]> {
    return Array.from(this.accidentRecords.values()).filter(r => {
      if (vehicleId && r.vehiclePlate !== vehicleId) return false
      return true
    })
  }

  async resolveAccident(id: string, resolution: string): Promise<AccidentRecord> {
    const r = await this.getAccidentRecord(id)
    if (r.resolved) throw new BadRequestException('Accident is already resolved')
    const updated: AccidentRecord = {
      ...r,
      resolved: true,
      resolution,
      resolvedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    this.accidentRecords.set(id, updated)
    return updated
  }

  // ── 物流成本核算 ─────────────────────────────────────────────────────────

  async recordCost(data: Omit<LogisticsCost, 'id'>): Promise<LogisticsCost> {
    const cost: LogisticsCost = {
      id: createLogisticsCostId(),
      ...data,
      totalCent: data.items.reduce((s, i) => s + i.amountCent, 0),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    this.costs.set(cost.id, cost)
    return cost
  }

  async getCost(id: string): Promise<LogisticsCost> {
    const c = this.costs.get(id)
    if (!c) throw new NotFoundException(`Cost record ${id} not found`)
    return c
  }

  async getCostSummary(startDate: string, endDate: string): Promise<{ totalCost: number; byType: Record<string, number>; byVehicle: Record<string, number> }> {
    const records = Array.from(this.costs.values()).filter(c => c.periodStart >= startDate && c.periodEnd <= endDate)
    const byType: Record<string, number> = {}
    const byVehicle: Record<string, number> = {}
    let total = 0
    for (const r of records) {
      for (const item of r.items) {
        total += item.amountCent
        byType[item.costType] = (byType[item.costType] ?? 0) + item.amountCent
      }
      if (r.vehiclePlate) {
        byVehicle[r.vehiclePlate] = (byVehicle[r.vehiclePlate] ?? 0) + r.totalCent
      }
    }
    return { totalCost: total, byType, byVehicle }
  }

  async deleteCost(id: string): Promise<void> {
    if (!this.costs.has(id)) throw new NotFoundException(`Cost record ${id} not found`)
    this.costs.delete(id)
  }

  // ── 统计指标 ─────────────────────────────────────────────────────────────

  async getMetrics(): Promise<LogisticsSupplementMetrics> {
    const orders = Array.from(this.transportOrders.values())
    const accidents = Array.from(this.accidentRecords.values())
    const fuelRecords = Array.from(this.fuelRecords.values())
    const maintRecords = Array.from(this.vehicleMaintenance.values())

    const totalTransportOrders = orders.length
    const inTransitOrders = orders.filter(o => o.status === 'in_transit').length
    const completedOrders = orders.filter(o => o.status === 'completed').length
    const cancelledOrders = orders.filter(o => o.status === 'cancelled').length

    const completedOrdersList = orders.filter(o => o.status === 'completed')

    // on-time delivery rate: orders completed and actualArrivalAt <= estimatedArrivalAt
    let onTimeCount = 0
    for (const o of completedOrdersList) {
      if (o.estimatedArrivalAt && o.actualArrivalAt) {
        if (new Date(o.actualArrivalAt) <= new Date(o.estimatedArrivalAt)) {
          onTimeCount++
        }
      }
    }
    const onTimeDeliveryRate = completedOrdersList.length > 0
      ? Math.round((onTimeCount / completedOrdersList.length) * 10000) / 100
      : 0

    // average delivery hours
    let totalHours = 0
    let counted = 0
    for (const o of completedOrdersList) {
      if (o.actualPickupAt && o.actualArrivalAt) {
        const hours = (new Date(o.actualArrivalAt).getTime() - new Date(o.actualPickupAt).getTime()) / 3600000
        totalHours += hours
        counted++
      }
    }
    const averageDeliveryHours = counted > 0 ? Math.round((totalHours / counted) * 100) / 100 : 0

    const drivers = new Set(orders.map(o => o.driverId).filter(Boolean))
    const vehicles = new Set(orders.map(o => o.vehiclePlate).filter(Boolean))

    return {
      totalTransportOrders,
      inTransitOrders,
      completedOrders,
      cancelledOrders,
      totalDrivers: drivers.size,
      totalVehicles: vehicles.size,
      totalAccidents: accidents.length,
      unresolvedAccidents: accidents.filter(a => !a.resolved).length,
      totalFuelCostCent: fuelRecords.reduce((s, r) => s + r.costCent, 0),
      totalMaintenanceCostCent: maintRecords.reduce((s, r) => s + (r.costCent ?? 0), 0),
      onTimeDeliveryRate,
      averageDeliveryHours,
    }
  }
}
