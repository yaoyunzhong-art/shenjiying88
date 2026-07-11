/**
 * 🐜 自动: [runbook] [D] contract 补全
 *
 * Runbook：运维手册跨模块合约类型
 * 定义 runbook 模块对外暴露的稳定合约接口，
 * 供其它模块（monitoring, ops-manual, deployment 等）消费。
 */
import type { RunbookStep } from './runbook.entity'

// ─── 合约子集 ──────────────────────────────────────────────────────────

/**
 * Runbook 合约（跨模块安全子集）
 * 只暴露必要的只读字段，隐藏内部实现细节
 */
export interface RunbookContract {
  id: string
  title: string
  category: string
  severity: string
  applicableVersions: string[]
  prerequisites: string[]
  stepCount: number
  estimatedTotalMinutes: number
  status: string
  createdAt: string
  updatedAt: string
  tags: string[]
}

/**
 * AlertMapping 合约
 */
export interface AlertMappingContract {
  alertName: string
  severity: string
  possibleCauses: string[]
  runbookId: string
  autoAction?: string
}

/**
 * RunbookStep 合约（精简版）
 */
export interface RunbookStepContract {
  stepNumber: number
  title: string
  description: string
  command?: string
  warningMessage?: string
  estimatedMinutes?: number
}

// ─── 合约工厂函数 ───────────────────────────────────────────────────────

/**
 * 从完整 Runbook 实体创建合约子集
 */
export function toRunbookContract(runbook: {
  id: string
  title: string
  category: string
  severity: string
  applicableVersions: string[]
  prerequisites: string[]
  steps: RunbookStep[]
  estimatedTotalMinutes: number
  status: string
  createdAt: Date
  updatedAt: Date
  tags: string[]
}): RunbookContract {
  return {
    id: runbook.id,
    title: runbook.title,
    category: runbook.category,
    severity: runbook.severity,
    applicableVersions: [...runbook.applicableVersions],
    prerequisites: [...runbook.prerequisites],
    stepCount: runbook.steps.length,
    estimatedTotalMinutes: runbook.estimatedTotalMinutes,
    status: runbook.status,
    createdAt: runbook.createdAt.toISOString(),
    updatedAt: runbook.updatedAt.toISOString(),
    tags: [...runbook.tags],
  }
}

/**
 * 从完整 AlertMapping 创建合约
 */
export function toAlertMappingContract(mapping: {
  alertName: string
  severity: string
  possibleCauses: string[]
  runbookId: string
  autoAction?: string
}): AlertMappingContract {
  return {
    alertName: mapping.alertName,
    severity: mapping.severity,
    possibleCauses: [...mapping.possibleCauses],
    runbookId: mapping.runbookId,
    autoAction: mapping.autoAction,
  }
}

/**
 * 从完整 RunbookStep 创建合约
 */
export function toRunbookStepContract(step: RunbookStep): RunbookStepContract {
  return {
    stepNumber: step.stepNumber,
    title: step.title,
    description: step.description,
    command: step.command,
    warningMessage: step.warningMessage,
    estimatedMinutes: step.estimatedMinutes,
  }
}
