/**
 * logistics.phase-p30-80.entity.ts
 * P-30 Phase 80% 新增实体
 *
 * 新增功能:
 * 1. 维修反馈闭环 (RepairFeedback/RepairKnowledge)
 * 2. 耗材库存预警 (ConsumableAlertRule/ConsumableAlert)
 * 3. 场馆巡检计划 (VenueInspectionRecord)
 * 4. 后勤报表 (LogisticsReport)
 */

import { randomUUID } from 'node:crypto'

// ═══════════════════════════════════════════
// 1. 维修反馈闭环
// ═══════════════════════════════════════════

export type FeedbackScore = 1 | 2 | 3 | 4 | 5

export interface RepairFeedback {
  id: string
  tenantId: string
  repairOrderId: string
  maintenanceOrderId?: string
  /** 评分 1-5 */
  score: FeedbackScore
  /** 评价内容 */
  comment: string
  /** 评价人 */
  reviewerId: string
  reviewerName: string
  /** 是否及时 */
  timely: boolean
  /** 质量满意度 */
  qualitySatisfied: boolean
  reviewedAt: string
  createdAt: string
}

export interface RepairKnowledge {
  id: string
  tenantId: string
  repairOrderId: string
  maintenanceOrderId?: string
  equipmentId: string
  equipmentName: string
  issueType: string
  issueDescription: string
  rootCause: string
  solution: string
  /** 涉及备件 */
  partsUsed?: string[]
  /** 维修耗时(小时) */
  repairHours?: number
  /** 关联技术人员ID */
  technicianId: string
  technicianName: string
  /** 是否推荐为常见问题 */
  isCommonCase: boolean
  tags: string[]
  createdAt: string
  updatedAt: string
}

// ═══════════════════════════════════════════
// 2. 耗材库存预警
// ═══════════════════════════════════════════

export type AlertTriggerType = 'low_stock' | 'over_stock' | 'expiry'

export interface ConsumableAlertRule {
  id: string
  tenantId: string
  itemId: string
  itemName: string
  /** 预警类型 */
  triggerType: AlertTriggerType
  /** 预警阈值 */
  threshold: number
  /** 预警等级 */
  alertLevel: 'info' | 'warning' | 'critical'
  /** 是否启用 */
  enabled: boolean
  /** 通知人列表 */
  notifyUserIds: string[]
  createdAt: string
  updatedAt: string
}

export interface ConsumableAlert {
  id: string
  tenantId: string
  ruleId: string
  itemId: string
  itemName: string
  currentStock: number
  threshold: number
  triggerType: AlertTriggerType
  alertLevel: 'info' | 'warning' | 'critical'
  message: string
  /** 是否已处理 */
  resolved: boolean
  resolvedAt?: string
  resolvedBy?: string
  createdAt: string
}

// ═══════════════════════════════════════════
// 3. 场馆巡检记录
// ═══════════════════════════════════════════

export type InspectionPlanType = 'daily' | 'weekly' | 'monthly'

export interface VenueInspectionRecord {
  id: string
  tenantId: string
  storeId: string
  planType: InspectionPlanType
  inspectorId: string
  inspectorName: string
  /** 检查时间 */
  inspectedAt: string
  /** 环境评分 1-10 */
  environmentScore: number
  /** 设备评分 1-10 */
  equipmentScore: number
  /** 安全评分 1-10 */
  safetyScore: number
  /** 总评 */
  totalScore: number
  /** 检查备注 */
  notes: string
  /** 问题列表 */
  issues: Array<{
    category: string
    description: string
    severity: 'low' | 'medium' | 'high'
    resolved: boolean
  }>
  createdAt: string
}

export interface VenueInspectionTrend {
  period: string
  environmentAvg: number
  equipmentAvg: number
  safetyAvg: number
  totalAvg: number
  recordCount: number
}

// ═══════════════════════════════════════════
// 4. 后勤报表
// ═══════════════════════════════════════════

export interface ExpenseSummary {
  totalMaintenance: number   // 维保支出（分）
  totalProcurement: number   // 采购支出（分）
  totalMaterial: number      // 物料申领价值（分）
  totalExpense: number       // 总支出
  periodStart: string
  periodEnd: string
  byCategory: Record<string, number>
}

export interface WorkOrderStats {
  totalRepairs: number
  openRepairs: number
  completedRepairs: number
  verifiedRepairs: number
  avgCompletionHours: number
  totalMaintenance: number
  inProgressMaintenance: number
  completedMaintenance: number
}

export interface SupplierRanking {
  supplierId: string
  supplierName: string
  avgScore: number
  evaluationCount: number
  contractCount: number
  totalContractAmount: number
}

export interface LogisticsReport {
  expenseSummary: ExpenseSummary
  workOrderStats: WorkOrderStats
  supplierRankings: SupplierRanking[]
  inspectionStats: {
    totalInspections: number
    avgScore: number
    pendingInspectionTasks: number
    totalSchedulePlans: number
  }
}

// ═══════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════

export function createRepairFeedbackId(): string {
  return `rfb-${randomUUID()}`
}

export function createRepairKnowledgeId(): string {
  return `rk-${randomUUID()}`
}

export function createConsumableAlertRuleId(): string {
  return `car-${randomUUID()}`
}

export function createConsumableAlertId(): string {
  return `ca-${randomUUID()}`
}

export function createVenueInspectionRecordId(): string {
  return `vir-${randomUUID()}`
}
