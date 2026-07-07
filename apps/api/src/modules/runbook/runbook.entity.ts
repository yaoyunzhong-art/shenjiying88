// runbook.entity.ts - 运维手册实体定义
export type RunbookCategory = 'deployment' | 'scaling' | '故障排查' | '灾难恢复' | '安全事件' | '监控告警'
export type Severity = 'critical' | 'high' | 'medium' | 'low'
export type RunbookStatus = 'draft' | 'active' | 'archived'

export interface RunbookStep {
  stepNumber: number
  title: string
  description: string
  command?: string
  expectedOutput?: string
  verificationCommand?: string
  rollbackCommand?: string
  estimatedMinutes?: number
  warningMessage?: string
}

export interface Runbook {
  id: string
  title: string
  category: RunbookCategory
  severity: Severity
  applicableVersions: string[]
  prerequisites: string[]
  steps: RunbookStep[]
  estimatedTotalMinutes: number
  relatedAlerts?: string[]
  relatedRunbooks?: string[]
  status: RunbookStatus
  createdAt: Date
  updatedAt: Date
  lastTestedAt?: Date
  tags: string[]
}

export interface AlertMapping {
  alertName: string
  severity: Severity
  possibleCauses: string[]
  runbookId: string
  autoAction?: string
}

export interface ExecutionLog {
  step: number
  startedAt: Date
  completedAt?: Date
  success?: boolean
  output?: string
  error?: string
}
