/**
 * logistics — SSE后勤管理模块 (P-30)
 *
 * 提供:
 * - 设备巡检 (InspectionTask)
 * - 清洁排班 (CleanSchedule)
 * - 维修工单 (RepairOrder)
 * - 物料申领 (MaterialRequest)
 * - 设备维保 (MaintenanceOrder)
 * - 耗材采购 (ProcurementRequest)
 * - 供应商管理 (Supplier)
 * - 库存预留 (InventoryReservation)
 * - 设备巡检定时调度 (SchedulePlan)
 *
 * 九个子域的全生命周期管理。
 */

export { LogisticsModule } from './logistics.module'
export { LogisticsService } from './logistics.service'
export * from './logistics.entity'
export * from './logistics.supplier.entity'
export * from './logistics.inventory.entity'
export * from './logistics.schedule.entity'
