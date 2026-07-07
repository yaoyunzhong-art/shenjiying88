// runbook.entity.test.ts - 运维手册实体单元测试
import { describe, it, expect } from 'vitest'
import type { Runbook, RunbookStep, AlertMapping, ExecutionLog } from './runbook.entity'

describe('Runbook 实体类型', () => {
  it('应能创建有效的 RunbookStep', () => {
    const step: RunbookStep = {
      stepNumber: 1,
      title: '环境检查',
      description: '检查服务器环境',
      command: 'uname -a',
      expectedOutput: 'Linux',
      estimatedMinutes: 5,
    }
    expect(step.stepNumber).toBe(1)
    expect(step.title).toBe('环境检查')
    expect(step.command).toBeDefined()
  })

  it('应能创建包含回滚命令的步骤', () => {
    const step: RunbookStep = {
      stepNumber: 2,
      title: '部署服务',
      description: '部署新版本',
      command: 'helm upgrade',
      rollbackCommand: 'helm rollback',
      warningMessage: '请确认备份完成',
    }
    expect(step.rollbackCommand).toBe('helm rollback')
    expect(step.warningMessage).toContain('备份')
  })

  it('应能创建完整的 Runbook', () => {
    const now = new Date()
    const runbook: Runbook = {
      id: 'rb-001',
      title: '数据库主从切换',
      category: '灾难恢复',
      severity: 'critical',
      applicableVersions: ['v2.0.0+'],
      prerequisites: ['主从架构已配置'],
      steps: [
        { stepNumber: 1, title: '检查主库', description: '确认主库故障' },
        { stepNumber: 2, title: '提升从库', description: '将从库提升为主库' },
      ],
      estimatedTotalMinutes: 20,
      relatedAlerts: ['ALERT_db_down'],
      status: 'active',
      createdAt: now,
      updatedAt: now,
      tags: ['数据库', '灾备'],
    }
    expect(runbook.id).toBe('rb-001')
    expect(runbook.category).toBe('灾难恢复')
    expect(runbook.steps).toHaveLength(2)
    expect(runbook.relatedAlerts).toContain('ALERT_db_down')
  })

  it('应能创建 AlertMapping', () => {
    const mapping: AlertMapping = {
      alertName: 'ALERT_cpu_high',
      severity: 'high',
      possibleCauses: ['流量突增', '内存泄漏'],
      runbookId: 'rb-scale-001',
      autoAction: 'scale-up',
    }
    expect(mapping.autoAction).toBe('scale-up')
    expect(mapping.possibleCauses).toHaveLength(2)
  })

  it('应能创建 ExecutionLog', () => {
    const log: ExecutionLog = {
      step: 1,
      startedAt: new Date(),
      completedAt: new Date(),
      success: true,
      output: 'All good',
    }
    expect(log.success).toBe(true)
    expect(log.step).toBe(1)
  })

  it('应支持 Runbook 状态枚举值', () => {
    const statuses = ['draft', 'active', 'archived'] as const
    const runbook: Runbook = {
      id: 'rb-test',
      title: '测试手册',
      category: 'deployment',
      severity: 'low',
      applicableVersions: ['v1'],
      prerequisites: [],
      steps: [],
      estimatedTotalMinutes: 0,
      status: 'draft',
      createdAt: new Date(),
      updatedAt: new Date(),
      tags: [],
    }
    expect(statuses).toContain(runbook.status)
  })

  it('应支持 Severity 枚举值', () => {
    const severities = ['critical', 'high', 'medium', 'low'] as const
    const severitiesSet = new Set(severities)
    expect(severitiesSet.has('critical')).toBe(true)
    expect(severitiesSet.has('high')).toBe(true)
    expect(severitiesSet.has('medium')).toBe(true)
    expect(severitiesSet.has('low')).toBe(true)
  })
})
