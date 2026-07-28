/**
 * logistics-supplement — 后勤补充模块 (P-30)
 *
 * 提供:
 * - 运输调度单 (TransportOrder)
 * - 货物装载 (CargoLoad)
 * - 路线规划 (RoutePlan)
 * - 司机排班 (DriverSchedule)
 * - 车辆维保 (VehicleMaintenanceRecord)
 * - 油耗记录 (FuelRecord)
 * - 事故记录 (AccidentRecord)
 * - 物流成本核算 (LogisticsCost)
 *
 * 后勤全链路管理，覆盖运输调度、货物追踪、路线优化、
 * 司机管理、维保管理、油耗统计、事故处理和成本核算。
 */

export { LogisticsSupplementModule } from './logistics-supplement.module'
export { LogisticsSupplementService } from './logistics-supplement.service'
export { LogisticsSupplementController } from './logistics-supplement.controller'
export * from './logistics-supplement.entity'
export * from './logistics-supplement.dto'
