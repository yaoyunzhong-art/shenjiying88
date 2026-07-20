/**
 * logistics — SSE后勤管理模块 (P-30)
 *
 * 提供:
 * - 设备巡检 (InspectionTask)
 * - 清洁排班 (CleanSchedule)
 * - 维修工单 (RepairOrder)
 * - 物料申领 (MaterialRequest)
 *
 * 四个子域的全生命周期管理。
 */

export { LogisticsModule } from './logistics.module'
export { LogisticsService } from './logistics.service'
export * from './logistics.entity'
