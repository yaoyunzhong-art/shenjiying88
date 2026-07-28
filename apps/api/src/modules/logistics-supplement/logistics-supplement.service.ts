import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common'
import type { TransportOrder, CargoLoad, RoutePlan, DriverSchedule, VehicleMaintenanceRecord, FuelRecord, AccidentRecord, LogisticsCost } from './logistics-supplement.entity'
import { createTransportOrderId } from './logistics-supplement.entity'

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

  // ── 运输调度单 ───────────────────────────────────────────────────────────

  async createTransportOrder(data: Omit<TransportOrder, 'id' | 'createdAt' | 'updatedAt'>): Promise<TransportOrder> {
    const order: TransportOrder = {
      id: createTransportOrderId(),
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
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
    const valid = ['draft','pending_approval','approved','dispatched','loading','in_transit','arrived','unloading','completed','cancelled']
    if (!valid.includes(status)) throw new BadRequestException(`Invalid status: ${status}`)
    const updated = { ...order, status: status as any, updatedAt: new Date() }
    this.transportOrders.set(id, updated)
    return updated
  }

  // ── 货物装载 ─────────────────────────────────────────────────────────────

  async addCargoLoad(data: Omit<CargoLoad, 'id'>): Promise<CargoLoad> {
    const load: CargoLoad = { id: `cl-${Date.now()}`, ...data }
    this.cargoLoads.set(load.id, load)
    return load
  }

  async getCargoLoads(transportOrderId: string): Promise<CargoLoad[]> {
    return Array.from(this.cargoLoads.values()).filter(c => c.transportOrderId === transportOrderId)
  }

  // ── 路线规划 ─────────────────────────────────────────────────────────────

  async createRoutePlan(data: Omit<RoutePlan, 'id'>): Promise<RoutePlan> {
    const plan: RoutePlan = { id: `rp-${Date.now()}`, ...data }
    this.routePlans.set(plan.id, plan)
    return plan
  }

  async getRoutePlan(id: string): Promise<RoutePlan> {
    const plan = this.routePlans.get(id)
    if (!plan) throw new NotFoundException(`Route plan ${id} not found`)
    return plan
  }

  async optimizeRoute(id: string): Promise<RoutePlan> {
    const plan = await this.getRoutePlan(id)
    // 模拟路线优化：预估距离减少 15%，时间减少 10%
    const optimized = {
      ...plan,
      estimatedDistanceKm: Math.round(plan.estimatedDistanceKm * 0.85),
      estimatedDurationMin: Math.round(plan.estimatedDurationMin * 0.90),
      optimized: true,
    }
    this.routePlans.set(id, optimized)
    return optimized
  }

  // ── 司机排班 ─────────────────────────────────────────────────────────────

  async createDriverSchedule(data: Omit<DriverSchedule, 'id'>): Promise<DriverSchedule> {
    const schedule: DriverSchedule = { id: `ds-${Date.now()}`, ...data }
    this.driverSchedules.set(schedule.id, schedule)
    return schedule
  }

  async getDriverSchedules(driverId?: string, date?: string): Promise<DriverSchedule[]> {
    return Array.from(this.driverSchedules.values()).filter(s => {
      if (driverId && s.driverId !== driverId) return false
      if (date && s.date !== date) return false
      return true
    })
  }

  // ── 车辆维保 ─────────────────────────────────────────────────────────────

  async createMaintenanceRecord(data: Omit<VehicleMaintenanceRecord, 'id'>): Promise<VehicleMaintenanceRecord> {
    const record: VehicleMaintenanceRecord = { id: `vm-${Date.now()}`, ...data }
    this.vehicleMaintenance.set(record.id, record)
    return record
  }

  async getVehicleMaintenanceHistory(vehicleId: string): Promise<VehicleMaintenanceRecord[]> {
    return Array.from(this.vehicleMaintenance.values()).filter(r => r.vehicleId === vehicleId)
  }

  async getUpcomingMaintenance(vehicleId?: string): Promise<VehicleMaintenanceRecord[]> {
    return Array.from(this.vehicleMaintenance.values()).filter(r => {
      if (vehicleId && r.vehicleId !== vehicleId) return false
      return r.status === 'scheduled'
    })
  }

  // ── 油耗记录 ─────────────────────────────────────────────────────────────

  async recordFuel(data: Omit<FuelRecord, 'id'>): Promise<FuelRecord> {
    const record: FuelRecord = { id: `fr-${Date.now()}`, ...data }
    this.fuelRecords.set(record.id, record)
    return record
  }

  async getFuelRecords(vehicleId: string, startDate?: string, endDate?: string): Promise<FuelRecord[]> {
    return Array.from(this.fuelRecords.values()).filter(r => {
      if (r.vehicleId !== vehicleId) return false
      if (startDate && r.date < startDate) return false
      if (endDate && r.date > endDate) return false
      return true
    })
  }

  async getFuelEfficiency(vehicleId: string): Promise<{ avgConsumptionPer100km: number; totalFuelLiters: number; totalDistanceKm: number }> {
    const records = await this.getFuelRecords(vehicleId)
    const totalFuel = records.reduce((s, r) => s + r.liters, 0)
    const totalDist = records.reduce((s, r) => s + r.odometerReading, 0) - (records[0]?.odometerReading ?? 0)
    return {
      avgConsumptionPer100km: totalDist > 0 ? Math.round((totalFuel / totalDist) * 100 * 100) / 100 : 0,
      totalFuelLiters: totalFuel,
      totalDistanceKm: totalDist,
    }
  }

  // ── 事故记录 ─────────────────────────────────────────────────────────────

  async recordAccident(data: Omit<AccidentRecord, 'id'>): Promise<AccidentRecord> {
    const record: AccidentRecord = { id: `ac-${Date.now()}`, ...data }
    this.accidentRecords.set(record.id, record)
    return record
  }

  async getAccidentRecords(vehicleId?: string): Promise<AccidentRecord[]> {
    return Array.from(this.accidentRecords.values()).filter(r => {
      if (vehicleId && r.vehicleId !== vehicleId) return false
      return true
    })
  }

  // ── 物流成本核算 ─────────────────────────────────────────────────────────

  async recordCost(data: Omit<LogisticsCost, 'id'>): Promise<LogisticsCost> {
    const cost: LogisticsCost = { id: `lc-${Date.now()}`, ...data }
    this.costs.set(cost.id, cost)
    return cost
  }

  async getCostSummary(startDate: string, endDate: string): Promise<{ totalCost: number; byType: Record<string, number>; byVehicle: Record<string, number> }> {
    const records = Array.from(this.costs.values()).filter(c => c.date >= startDate && c.date <= endDate)
    const byType: Record<string, number> = {}
    const byVehicle: Record<string, number> = {}
    let total = 0
    for (const r of records) {
      total += r.amount
      byType[r.costType] = (byType[r.costType] ?? 0) + r.amount
      byVehicle[r.vehicleId] = (byVehicle[r.vehicleId] ?? 0) + r.amount
    }
    return { totalCost: total, byType, byVehicle }
  }
}
