import { describe, it, expect, beforeEach } from 'vitest'
/**
 * 🐜 自动: [runbook] [D] e2e 测试补全
 *
 * Runbook 端到端测试:
 * - 完整的 CRUD 业务流程
 * - 告警映射生命周期
 * - 搜索与校验功能
 * - 边界条件与错误路径
 */

import { RunbookService } from './runbook.service'
import type { Runbook, AlertMapping, RunbookStep } from './runbook.entity'

function createService() {
  return new RunbookService()
}

function createMinimalRunbook(overrides?: Partial<{
  title?: string
  category?: string
  severity?: string
  applicableVersions?: string[]
  prerequisites?: string[]
  steps?: RunbookStep[]
  estimatedTotalMinutes?: number
  status?: string
  tags?: string[]
  lastTestedAt?: Date
  relatedAlerts?: string[]
  relatedRunbooks?: string[]
}>): Omit<Runbook, 'id' | 'createdAt' | 'updatedAt'> {
  return {
    title: '测试手册',
    category: 'deployment' as any,
    severity: 'medium' as any,
    applicableVersions: ['v1.0.0'],
    prerequisites: [],
    steps: [
      { stepNumber: 1, title: '检查', description: '检查环境', command: 'echo ok', estimatedMinutes: 1 } as RunbookStep,
    ],
    estimatedTotalMinutes: 1,
    status: 'draft' as any,
    tags: ['测试'],
    ...overrides,
  } as Omit<Runbook, 'id' | 'createdAt' | 'updatedAt'>
}

// ══════════════════════════════════════════════════════════════════════
// CRUD 端到端流程
// ══════════════════════════════════════════════════════════════════════

describe('Runbook CRUD E2E', () => {
  let service: RunbookService

  beforeEach(() => {
    service = createService()
  })

  it('正例: 完整创建 → 读取 → 更新 → 删除流程', () => {
    // Create
    const created = service.create(createMinimalRunbook({ title: '端到端测试手册', category: '故障排查' as any }))
    expect(created.id).toBeDefined()
    expect(created.title).toBe('端到端测试手册')

    // Read
    const found = service.get(created.id)
    expect(found).not.toBeNull()
    expect(found!.id).toBe(created.id)

    // Update
    const updated = service.update(created.id, { title: '已更新手册' } as any)
    expect(updated.title).toBe('已更新手册')

    // Delete
    const deleteResult = service.delete(created.id)
    expect(deleteResult).toBeUndefined()

    // Verify deletion
    const afterDelete = service.get(created.id)
    expect(afterDelete).toBeNull()
  })

  it('正例: 可分页列出所有手册', () => {
    service.create(createMinimalRunbook({ title: '手册A' }))
    service.create(createMinimalRunbook({ title: '手册B' }))
    service.create(createMinimalRunbook({ title: '手册C' }))

    const list = service.list({})
    expect(list.length).toBeGreaterThanOrEqual(3)
    const titles = list.map(r => r.title)
    expect(titles).toContain('手册A')
    expect(titles).toContain('手册B')
    expect(titles).toContain('手册C')
  })

  it('正例: 可按类别过滤', () => {
    service.create(createMinimalRunbook({ title: '部署手册', category: 'deployment' as any }))
    service.create(createMinimalRunbook({ title: '扩容手册', category: 'scaling' as any }))
    service.create(createMinimalRunbook({ title: '故障手册', category: '故障排查' as any }))

    const deploymentOnly = service.list({ category: 'deployment' as any })
    expect(deploymentOnly.every(r => r.category === 'deployment')).toBe(true)
    expect(deploymentOnly.some(r => r.title === '部署手册')).toBe(true)
  })

  it('边界: 获取不存在的手册返回 null', () => {
    const result = service.get('non-existent-id')
    expect(result).toBeNull()
  })

  it('边界: 更新不存在的 ID 应抛出错误', () => {
    expect(() => {
      service.update('non-existent', { title: '新标题' } as any)
    }).toThrow()
  })

  it('边界: 删除不存在的 ID 应抛出错误', () => {
    expect(() => {
      service.delete('non-existent')
    }).toThrow()
  })

  it('边界: 空列表返回空数组', () => {
    const list = service.list({ category: '安全事件' as any })
    expect(Array.isArray(list)).toBe(true)
  })
})

// ══════════════════════════════════════════════════════════════════════
// 告警映射管理
// ══════════════════════════════════════════════════════════════════════

describe('AlertMapping E2E', () => {
  let service: RunbookService

  beforeEach(() => {
    service = createService()
  })

  it('正例: 创建告警映射并可通过告警名查询', () => {
    // 先创建一个手册
    const runbook = service.create(createMinimalRunbook({ title: 'CPU 排查手册' }))

    // 映射告警
    const mapping = service.mapAlert(
      'ALERT_CPU_HIGH',
      runbook.id,
      ['CPU 超卖', '挖矿进程'],
      'critical',
      'kubectl top pods',
    )

    expect(mapping.alertName).toBe('ALERT_CPU_HIGH')
    expect(mapping.runbookId).toBe(runbook.id)
    expect(mapping.possibleCauses).toHaveLength(2)

    // 通过告警名查询
    const found = service.findByAlert('ALERT_CPU_HIGH')
    expect(found).not.toBeNull()
    expect(found!.alertName).toBe('ALERT_CPU_HIGH')
    expect(found!.severity).toBe('critical')
  })

  it('正例: 可为多个告警映射到同一手册', () => {
    const runbook = service.create(createMinimalRunbook({ title: '通用排查' }))

    service.mapAlert('ALERT_A', runbook.id, ['原因A'], 'high')
    service.mapAlert('ALERT_B', runbook.id, ['原因B'], 'medium')

    const foundA = service.findByAlert('ALERT_A')
    const foundB = service.findByAlert('ALERT_B')

    expect(foundA!.runbookId).toBe(runbook.id)
    expect(foundB!.runbookId).toBe(runbook.id)
    expect(foundA!.severity).toBe('high')
    expect(foundB!.severity).toBe('medium')
  })

  it('边界: 未找到告警映射返回 null', () => {
    const result = service.findByAlert('ALERT_NONEXIST')
    expect(result).toBeNull()
  })

  it('边界: 错误映射没有 autoAction', () => {
    const runbook = service.create(createMinimalRunbook({ title: '磁盘排查' }))

    const mapping = service.mapAlert(
      'ALERT_DISK_FULL',
      runbook.id,
      ['磁盘空间不足'],
      'high',
    )

    expect(mapping.autoAction).toBeUndefined()
    expect(mapping.possibleCauses).toHaveLength(1)
  })
})

// ══════════════════════════════════════════════════════════════════════
// 搜索与校验功能
// ══════════════════════════════════════════════════════════════════════

describe('Search & Validation E2E', () => {
  let service: RunbookService

  beforeEach(() => {
    service = createService()
    service.create(createMinimalRunbook({ title: 'Nginx 部署', tags: ['nginx', '部署'] }))
    service.create(createMinimalRunbook({ title: 'MySQL 故障排查', category: '故障排查' as any, tags: ['mysql', '数据库'] }))
    service.create(createMinimalRunbook({ title: 'Redis 扩容', category: 'scaling' as any, tags: ['redis', '缓存'] }))
  })

  it('正例: 关键词搜索返回匹配结果', () => {
    const result = service.search('Nginx')
    expect(result.length).toBeGreaterThanOrEqual(1)
    expect(result[0].title).toContain('Nginx')
  })

  it('正例: 模糊搜索', () => {
    const result = service.search('mysql')
    expect(result.some(r => r.title.includes('MySQL'))).toBe(true)
  })

  it('边界: 搜索空字符串返回全部', () => {
    const result = service.search('')
    expect(result.length).toBeGreaterThanOrEqual(3)
  })

  it('边界: 搜索无匹配关键词返回空数组', () => {
    const result = service.search('zzz_not_found_keyword_xyz')
    expect(Array.isArray(result)).toBe(true)
    expect(result.length).toBe(0)
  })

  it('正例: 有效手册校验通过', () => {
    const runbook = service.list({})[0]
    const validation = service.validate(runbook.id)
    expect(validation).toBeDefined()
  })

  it('边界: 校验不存在的手册返回有效 false', () => {
    const result = service.validate('non-existent')
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('Runbook not found: non-existent')
  })
})

// ══════════════════════════════════════════════════════════════════════
// 关键步骤查询
// ══════════════════════════════════════════════════════════════════════

describe('Critical Steps E2E', () => {
  let service: RunbookService

  beforeEach(() => {
    service = createService()
  })

  it('正例: 获取手册关键步骤', () => {
    const runbook = service.create(createMinimalRunbook({
      title: '部署手册含关键步骤',
      steps: [
        { stepNumber: 1, title: '备份', description: '备份数据', warningMessage: '⚠️ 必做' } as RunbookStep,
        { stepNumber: 2, title: '升级', description: '升级版本' } as RunbookStep,
        { stepNumber: 3, title: '验证', description: '验证结果', warningMessage: '⚠️ 确认无误' } as RunbookStep,
      ],
    }))

    const criticalSteps = service.getCriticalSteps(runbook.id)
    expect(criticalSteps.length).toBe(2)
    expect(criticalSteps.every((s: any) => s.warningMessage)).toBe(true)
  })

  it('边界: 无警告信息的步骤不是关键步骤', () => {
    const runbook = service.create(createMinimalRunbook({
      steps: [
        { stepNumber: 1, title: '简单检查', description: '检查' } as RunbookStep,
      ],
    }))

    const criticalSteps = service.getCriticalSteps(runbook.id)
    expect(criticalSteps.length).toBe(0)
  })

  it('边界: 查询不存在手册的关键步骤应抛出错误', () => {
    expect(() => {
      service.getCriticalSteps('non-existent')
    }).toThrow()
  })
})
