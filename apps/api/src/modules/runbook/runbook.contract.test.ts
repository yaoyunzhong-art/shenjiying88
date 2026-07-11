import { describe, it, expect, beforeEach } from 'vitest'
/**
 * 🐜 自动: [runbook] [D] contract 测试补全
 *
 * Runbook 契约测试:
 * - 验证合约接口定义与类型完整性
 * - 验证工厂函数正确转换实体 → 合约
 * - 验证类别/严重度/状态枚举值
 * - 验证边界条件与数据完整性
 */

import {
  toRunbookContract,
  toAlertMappingContract,
  toRunbookStepContract,
} from './runbook.contract'
import type { RunbookContract, AlertMappingContract, RunbookStepContract } from './runbook.contract'

// ── 测试辅助 ──────────────────────────────────────────────────────────

function createSampleSteps(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    stepNumber: i + 1,
    title: `步骤 ${i + 1}`,
    description: `执行第 ${i + 1} 步操作`,
    command: `command-${i + 1}`,
    expectedOutput: `OK-${i + 1}`,
    estimatedMinutes: 5,
    rollbackCommand: `rollback-${i + 1}`,
  }))
}

// ══════════════════════════════════════════════════════════════════════
// 实体 → 合约转换
// ══════════════════════════════════════════════════════════════════════

describe('toRunbookContract', () => {
  it('正例: 将完整 Runbook 实体转换为合约子集', () => {
    const now = new Date('2026-07-11T04:00:00Z')
    const runbook = {
      id: 'rb-001',
      title: 'K8s 集群扩容',
      category: 'scaling',
      severity: 'critical' as const,
      applicableVersions: ['v2.0.0', 'v2.1.0'],
      prerequisites: ['kubectl', 'kubeconfig'],
      steps: createSampleSteps(3),
      estimatedTotalMinutes: 15,
      status: 'active' as const,
      createdAt: now,
      updatedAt: now,
      tags: ['k8s', '扩容', '生产'],
    }

    const contract = toRunbookContract(runbook)

    // 合约字段校验
    expect(contract.id).toBe('rb-001')
    expect(contract.title).toBe('K8s 集群扩容')
    expect(contract.category).toBe('scaling')
    expect(contract.severity).toBe('critical')
    expect(contract.applicableVersions).toEqual(['v2.0.0', 'v2.1.0'])
    expect(contract.prerequisites).toEqual(['kubectl', 'kubeconfig'])
    expect(contract.stepCount).toBe(3)
    expect(contract.estimatedTotalMinutes).toBe(15)
    expect(contract.status).toBe('active')
    expect(contract.tags).toEqual(['k8s', '扩容', '生产'])

    // 时间字段转换为 ISO 字符串
    expect(contract.createdAt).toBe('2026-07-11T04:00:00.000Z')
    expect(contract.updatedAt).toBe('2026-07-11T04:00:00.000Z')
  })

  it('正例: 最小合约 — 不含可选字段和步骤', () => {
    const now = new Date()
    const runbook = {
      id: 'rb-min',
      title: '最小手册',
      category: 'monitoring' as const,
      severity: 'low' as const,
      applicableVersions: [] as string[],
      prerequisites: [] as string[],
      steps: [] as any[],
      estimatedTotalMinutes: 0,
      status: 'draft' as const,
      createdAt: now,
      updatedAt: now,
      tags: [] as string[],
    }

    const contract = toRunbookContract(runbook)
    expect(contract.stepCount).toBe(0)
    expect(contract.applicableVersions).toEqual([])
    expect(contract.prerequisites).toEqual([])
    expect(contract.tags).toEqual([])
    expect(contract.estimatedTotalMinutes).toBe(0)
  })

  it('正例: 步骤数为零也能正确转换', () => {
    const now = new Date()
    const runbook = {
      id: 'rb-empty-steps',
      title: '空步骤手册',
      category: '故障排查' as const,
      severity: 'medium' as const,
      applicableVersions: ['v1.0.0'],
      prerequisites: ['无'],
      steps: [] as any[],
      estimatedTotalMinutes: 0,
      status: 'draft' as const,
      createdAt: now,
      updatedAt: now,
      tags: ['测试'],
    }

    const contract = toRunbookContract(runbook)
    expect(contract.stepCount).toBe(0)
  })

  it('边界: 大量步骤（100+）不会溢出', () => {
    const now = new Date()
    const runbook = {
      id: 'rb-large',
      title: '大型手册',
      category: '部署' as const,
      severity: 'high' as const,
      applicableVersions: ['v3.0.0'],
      prerequisites: ['服务器'],
      steps: createSampleSteps(150),
      estimatedTotalMinutes: 750,
      status: 'active' as const,
      createdAt: now,
      updatedAt: now,
      tags: ['大型'],
    }

    const contract = toRunbookContract(runbook)
    expect(contract.stepCount).toBe(150)
    expect(contract.estimatedTotalMinutes).toBe(750)
  })
})

describe('toAlertMappingContract', () => {
  it('正例: 完整告警映射转换', () => {
    const mapping = {
      alertName: 'ALERT_CPU_HIGH',
      severity: 'critical' as const,
      possibleCauses: ['CPU 超卖', '存在挖矿进程', '慢查询积压'],
      runbookId: 'rb-cpu-troubleshoot',
      autoAction: 'kubectl top pods',
    }

    const contract = toAlertMappingContract(mapping)
    expect(contract.alertName).toBe('ALERT_CPU_HIGH')
    expect(contract.severity).toBe('critical')
    expect(contract.possibleCauses).toHaveLength(3)
    expect(contract.runbookId).toBe('rb-cpu-troubleshoot')
    expect(contract.autoAction).toBe('kubectl top pods')
  })

  it('边界: 无自动处理动作的告警映射', () => {
    const mapping = {
      alertName: 'ALERT_DISK_FULL',
      severity: 'high' as const,
      possibleCauses: ['磁盘空间不足', '日志未轮转'],
      runbookId: 'rb-disk-cleanup',
    }

    const contract = toAlertMappingContract(mapping)
    expect(contract.alertName).toBe('ALERT_DISK_FULL')
    expect(contract.autoAction).toBeUndefined()
  })

  it('边界: 告警名称为空字符串', () => {
    const mapping = {
      alertName: '',
      severity: 'low' as const,
      possibleCauses: ['未知'],
      runbookId: 'rb-unknown',
    }

    const contract = toAlertMappingContract(mapping)
    expect(contract.alertName).toBe('')
  })

  it('边界: 原因列表为空', () => {
    const mapping = {
      alertName: 'ALERT_NETWORK',
      severity: 'medium' as const,
      possibleCauses: [] as string[],
      runbookId: 'rb-network',
    }

    const contract = toAlertMappingContract(mapping)
    expect(contract.possibleCauses).toEqual([])
  })
})

describe('toRunbookStepContract', () => {
  it('正例: 完整步骤转换', () => {
    const step = {
      stepNumber: 1,
      title: '检查服务状态',
      description: '使用 systemctl 检查服务运行状态',
      command: 'systemctl status nginx',
      expectedOutput: 'active (running)',
      verificationCommand: 'curl -I localhost',
      rollbackCommand: 'systemctl start nginx',
      estimatedMinutes: 3,
      warningMessage: '请勿在生产高峰期执行',
    }

    const contract = toRunbookStepContract(step)
    expect(contract.stepNumber).toBe(1)
    expect(contract.title).toBe('检查服务状态')
    expect(contract.command).toBe('systemctl status nginx')
    expect(contract.warningMessage).toBe('请勿在生产高峰期执行')
    expect(contract.estimatedMinutes).toBe(3)
  })

  it('边界: 最小步骤 — 不含可选字段', () => {
    const step = {
      stepNumber: 5,
      title: '最小步骤',
      description: '只有必填项',
    } as any

    const contract = toRunbookStepContract(step)
    expect(contract.stepNumber).toBe(5)
    expect(contract.title).toBe('最小步骤')
    expect(contract.description).toBe('只有必填项')
    expect(contract.command).toBeUndefined()
    expect(contract.warningMessage).toBeUndefined()
    expect(contract.estimatedMinutes).toBeUndefined()
  })

  it('边界: 极大 stepNumber', () => {
    const step = {
      stepNumber: 9999,
      title: '超长步骤号',
      description: '验证数值边界',
      estimatedMinutes: 0,
    } as any

    const contract = toRunbookStepContract(step)
    expect(contract.stepNumber).toBe(9999)
  })
})

// ══════════════════════════════════════════════════════════════════════
// 合约类型结构校验
// ══════════════════════════════════════════════════════════════════════

describe('RunbookContract 类型完整性', () => {
  it('RunbookContract 字段类型对齐', () => {
    const contract: RunbookContract = {
      id: 'string',
      title: 'string',
      category: 'string',
      severity: 'string',
      applicableVersions: ['v1'],
      prerequisites: ['prereq'],
      stepCount: 3,
      estimatedTotalMinutes: 10,
      status: 'string',
      createdAt: 'ISO string',
      updatedAt: 'ISO string',
      tags: ['tag1'],
    }

    expect(typeof contract.id).toBe('string')
    expect(typeof contract.title).toBe('string')
    expect(typeof contract.category).toBe('string')
    expect(typeof contract.severity).toBe('string')
    expect(Array.isArray(contract.applicableVersions)).toBe(true)
    expect(Array.isArray(contract.prerequisites)).toBe(true)
    expect(typeof contract.stepCount).toBe('number')
    expect(typeof contract.estimatedTotalMinutes).toBe('number')
    expect(typeof contract.status).toBe('string')
    expect(typeof contract.createdAt).toBe('string')
    expect(typeof contract.updatedAt).toBe('string')
    expect(Array.isArray(contract.tags)).toBe(true)
  })

  it('AlertMappingContract 字段类型校验', () => {
    const mapping: AlertMappingContract = {
      alertName: 'ALERT_X',
      severity: 'critical',
      possibleCauses: ['cause1'],
      runbookId: 'rb-001',
    }

    expect(typeof mapping.alertName).toBe('string')
    expect(Array.isArray(mapping.possibleCauses)).toBe(true)
    expect(mapping.autoAction).toBeUndefined()

    mapping.autoAction = 'kubectl describe pod'
    expect(typeof mapping.autoAction).toBe('string')
  })

  it('RunbookStepContract 字段类型校验', () => {
    const step: RunbookStepContract = {
      stepNumber: 1,
      title: '步骤',
      description: '描述',
      command: 'cmd',
    }

    expect(typeof step.stepNumber).toBe('number')
    expect(typeof step.title).toBe('string')
    expect(typeof step.description).toBe('string')
    expect(step.warningMessage).toBeUndefined()
  })
})
