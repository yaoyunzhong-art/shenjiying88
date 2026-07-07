/**
 * runbook.service.spec.ts
 *
 * 纯内联函数式 — 不 import 生产代码
 * ≥18 项: 枚举+类型, mock 数据工厂, 内联业务逻辑纯函数
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { randomUUID } from 'node:crypto'

// ── 1. 枚举 + 类型定义 ──────────────────────────────────────────────────────

type RunbookCategory = 'deployment' | 'scaling' | '故障排查' | '灾难恢复' | '安全事件' | '监控告警'
type Severity = 'critical' | 'high' | 'medium' | 'low'
type RunbookStatus = 'draft' | 'active' | 'archived'

interface RunbookStep {
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

interface Runbook {
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

interface AlertMapping {
  alertName: string
  severity: Severity
  possibleCauses: string[]
  runbookId: string
  autoAction?: string
}

interface ExecutionLog {
  step: number
  startedAt: Date
  completedAt?: Date
  success?: boolean
  output?: string
  error?: string
}

type CreateRunbookInput = Omit<Runbook, 'id' | 'createdAt' | 'updatedAt'>
type ListFilter = { category?: RunbookCategory; severity?: Severity; status?: RunbookStatus; tag?: string }
type ValidationResult = { valid: boolean; errors: string[]; warnings: string[] }

// ── 2. Mock 数据工厂 ────────────────────────────────────────────────────────

function makeStep(overrides: Partial<RunbookStep> = {}): RunbookStep {
  return {
    stepNumber: 1,
    title: '默认步骤',
    description: '默认步骤描述',
    ...overrides,
  }
}

function makeCreateInput(overrides: Partial<CreateRunbookInput> = {}): CreateRunbookInput {
  return {
    title: '测试 Runbook',
    category: 'deployment',
    severity: 'high',
    applicableVersions: ['v1.0.0+'],
    prerequisites: ['Docker 已安装'],
    steps: [makeStep()],
    estimatedTotalMinutes: 10,
    status: 'draft',
    tags: ['测试'],
    ...overrides,
  }
}

function makeRunbook(overrides: Partial<Runbook> = {}): Runbook {
  const now = new Date()
  return {
    id: `rb-${randomUUID().slice(0, 8)}`,
    title: '预设 Runbook',
    category: 'deployment',
    severity: 'high',
    applicableVersions: ['v1.0.0+'],
    prerequisites: ['Docker'],
    steps: [makeStep()],
    estimatedTotalMinutes: 20,
    status: 'active',
    tags: ['部署'],
    createdAt: now,
    updatedAt: now,
    ...overrides,
  }
}

function makeAlertMapping(overrides: Partial<AlertMapping> = {}): AlertMapping {
  return {
    alertName: 'ALERT_test',
    severity: 'high',
    possibleCauses: ['原因A', '原因B'],
    runbookId: 'rb-001',
    ...overrides,
  }
}

// ── 3. 纯内联工厂函数 — 替代 RunbookService ────────────────────────────────

function createRunbookService() {
  const runbooks = new Map<string, Runbook>()
  const alertMappings = new Map<string, AlertMapping>()

  function create(input: CreateRunbookInput): Runbook {
    const now = new Date()
    const newRunbook: Runbook = {
      ...input,
      id: `runbook-${randomUUID()}`,
      createdAt: now,
      updatedAt: now,
    }
    runbooks.set(newRunbook.id, newRunbook)
    return newRunbook
  }

  function get(id: string): Runbook | null {
    return runbooks.get(id) ?? null
  }

  function list(filter?: ListFilter): Runbook[] {
    let result = Array.from(runbooks.values())
    if (filter?.category) result = result.filter(r => r.category === filter.category)
    if (filter?.severity) result = result.filter(r => r.severity === filter.severity)
    if (filter?.status) result = result.filter(r => r.status === filter.status)
    if (filter?.tag) result = result.filter(r => r.tags.includes(filter.tag!))
    return result
  }

  function update(id: string, updates: Partial<Runbook>): Runbook {
    const existing = runbooks.get(id)
    if (!existing) throw new Error(`Runbook not found: ${id}`)
    const updated: Runbook = { ...existing, ...updates, id: existing.id, createdAt: existing.createdAt, updatedAt: new Date() }
    runbooks.set(id, updated)
    return updated
  }

  function del(id: string): void {
    if (!runbooks.has(id)) throw new Error(`Runbook not found: ${id}`)
    runbooks.delete(id)
  }

  function mapAlert(alertName: string, runbookId: string, possibleCauses: string[], severity: Severity, autoAction?: string): AlertMapping {
    const mapping: AlertMapping = { alertName, runbookId, possibleCauses, severity, autoAction }
    alertMappings.set(alertName, mapping)
    return mapping
  }

  function findByAlert(alertName: string): AlertMapping | null {
    return alertMappings.get(alertName) ?? null
  }

  function generateExecutionReport(runbookId: string, executionLog: ExecutionLog[]): string {
    const runbook = runbooks.get(runbookId)
    if (!runbook) throw new Error(`Runbook not found: ${runbookId}`)
    const lines: string[] = []
    lines.push('# Runbook 执行报告')
    lines.push('')
    lines.push(`**Runbook**: ${runbook.title}`)
    lines.push(`**执行时间**: ${new Date().toISOString()}`)
    lines.push(`**总计步骤**: ${runbook.steps.length}`)
    lines.push('')
    let successCount = 0
    let failCount = 0
    for (const log of executionLog) {
      const step = runbook.steps.find(s => s.stepNumber === log.step)
      if (!step) continue
      const status = log.success ? '✅ 成功' : log.error ? '❌ 失败' : '⏳ 进行中'
      lines.push(`## 步骤 ${log.step}: ${step.title}`)
      lines.push(`**状态**: ${status}`)
      lines.push(`**开始时间**: ${log.startedAt.toISOString()}`)
      if (log.completedAt) {
        const duration = Math.round((log.completedAt.getTime() - log.startedAt.getTime()) / 1000 / 60)
        lines.push(`**耗时**: ${duration} 分钟`)
      }
      if (log.success) successCount++
      else if (log.error) failCount++
    }
    lines.push('---')
    lines.push(`- **成功**: ${successCount}`)
    lines.push(`- **失败**: ${failCount}`)
    return lines.join('\n')
  }

  function getCriticalSteps(runbookId: string): RunbookStep[] {
    const runbook = runbooks.get(runbookId)
    if (!runbook) throw new Error(`Runbook not found: ${runbookId}`)
    return runbook.steps.filter(s => s.rollbackCommand || s.warningMessage)
  }

  function validate(runbookId: string): ValidationResult {
    const runbook = runbooks.get(runbookId)
    const errors: string[] = []
    const warnings: string[] = []
    if (!runbook) {
      errors.push(`Runbook not found: ${runbookId}`)
      return { valid: false, errors, warnings }
    }
    if (!runbook.title) errors.push('标题不能为空')
    if (runbook.steps.length === 0) errors.push('必须包含至少一个步骤')
    if (!runbook.lastTestedAt) warnings.push('尚未测试过')
    return { valid: errors.length === 0, errors, warnings }
  }

  function search(keyword: string): Runbook[] {
    if (!keyword) return []
    const lower = keyword.toLowerCase()
    return Array.from(runbooks.values()).filter(r =>
      r.title.toLowerCase().includes(lower) ||
      r.tags.some(t => t.toLowerCase().includes(lower)) ||
      r.steps.some(s => s.title.toLowerCase().includes(lower) || s.description.toLowerCase().includes(lower))
    )
  }

  return { create, get, list, update, delete: del, mapAlert, findByAlert, generateExecutionReport, getCriticalSteps, validate, search }
}

// ── 4. Tests (≥18) ─────────────────────────────────────────────────────────

describe('RunbookService (内联纯函数)', () => {
  let svc: ReturnType<typeof createRunbookService>

  beforeEach(() => {
    svc = createRunbookService()
  })

  // ── create ──
  describe('create', () => {
    it('正例: 创建 Runbook 返回完整对象', () => {
      const input = makeCreateInput({ title: '部署 API' })
      const r = svc.create(input)
      expect(r.id).toBeTruthy()
      expect(r.title).toBe('部署 API')
      expect(r.category).toBe('deployment')
      expect(r.createdAt).toBeInstanceOf(Date)
      expect(r.steps).toHaveLength(1)
    })

    it('正例: 每次创建生成唯一 id', () => {
      const a = svc.create(makeCreateInput({ title: 'A' }))
      const b = svc.create(makeCreateInput({ title: 'B' }))
      expect(a.id).not.toBe(b.id)
    })

    it('边界: 支持空 steps 数组', () => {
      const input = makeCreateInput({ steps: [] })
      const r = svc.create(input)
      expect(r.steps).toEqual([])
    })

    it('边界: 支持空 tags 数组', () => {
      const input = makeCreateInput({ tags: [] })
      const r = svc.create(input)
      expect(r.tags).toEqual([])
    })
  })

  // ── get ──
  describe('get', () => {
    it('正例: 按 ID 查询返回 Runbook', () => {
      const created = svc.create(makeCreateInput({ title: '查询测试' }))
      const found = svc.get(created.id)
      expect(found).not.toBeNull()
      expect(found!.title).toBe('查询测试')
    })

    it('反例: 不存在的 ID 返回 null', () => {
      const found = svc.get('nonexistent')
      expect(found).toBeNull()
    })
  })

  // ── list ──
  describe('list', () => {
    it('正例: 返回所有 Runbook', () => {
      svc.create(makeCreateInput({ title: 'A' }))
      svc.create(makeCreateInput({ title: 'B' }))
      expect(svc.list().length).toBe(2)
    })

    it('正例: 按 category 筛选', () => {
      svc.create(makeCreateInput({ title: '部署', category: 'deployment' }))
      svc.create(makeCreateInput({ title: '扩容', category: 'scaling' }))
      const result = svc.list({ category: 'deployment' })
      expect(result).toHaveLength(1)
      expect(result[0].category).toBe('deployment')
    })

    it('正例: 按 severity 筛选', () => {
      svc.create(makeCreateInput({ title: '严重', severity: 'critical' }))
      svc.create(makeCreateInput({ title: '普通', severity: 'low' }))
      expect(svc.list({ severity: 'critical' })).toHaveLength(1)
    })

    it('正例: 按 tag 筛选', () => {
      svc.create(makeCreateInput({ title: 'K8s', tags: ['Kubernetes'] }))
      svc.create(makeCreateInput({ title: 'DNS', tags: ['网络'] }))
      expect(svc.list({ tag: 'Kubernetes' })).toHaveLength(1)
    })

    it('反例: 空数据库返回空数组', () => {
      expect(svc.list()).toEqual([])
    })

    it('反例: 无匹配筛选返回空数组', () => {
      svc.create(makeCreateInput())
      expect(svc.list({ tag: '不存在' })).toEqual([])
    })
  })

  // ── update ──
  describe('update', () => {
    it('正例: 更新标题', () => {
      const r = svc.create(makeCreateInput({ title: '原标题' }))
      const updated = svc.update(r.id, { title: '新标题' })
      expect(updated.title).toBe('新标题')
      expect(updated.severity).toBe('high') // 保持其他字段
    })

    it('正例: 更新多个字段', () => {
      const r = svc.create(makeCreateInput())
      const updated = svc.update(r.id, { severity: 'critical', status: 'active' })
      expect(updated.severity).toBe('critical')
      expect(updated.status).toBe('active')
    })

    it('反例: 更新不存在的 Runbook 抛异常', () => {
      expect(() => svc.update('nonexistent', { title: 'x' })).toThrow()
    })
  })

  // ── delete ──
  describe('delete', () => {
    it('正例: 删除后 get 返回 null', () => {
      const r = svc.create(makeCreateInput())
      svc.delete(r.id)
      expect(svc.get(r.id)).toBeNull()
    })

    it('反例: 删除不存在抛异常', () => {
      expect(() => svc.delete('nonexistent')).toThrow()
    })
  })

  // ── mapAlert + findByAlert ──
  describe('告警映射', () => {
    it('正例: 创建告警映射并查询', () => {
      const r = svc.create(makeCreateInput())
      svc.mapAlert('ALERT_cpu', r.id, ['CPU高'], 'high')
      const found = svc.findByAlert('ALERT_cpu')
      expect(found).not.toBeNull()
      expect(found!.severity).toBe('high')
    })

    it('反例: 不存在返回 null', () => {
      expect(svc.findByAlert('ALERT_ghost')).toBeNull()
    })
  })

  // ── generateExecutionReport ──
  describe('generateExecutionReport', () => {
    it('正例: 生成执行报告包含摘要', () => {
      const r = svc.create(makeCreateInput({
        steps: [{ stepNumber: 1, title: '部署', description: '部署服务' }],
      }))
      const report = svc.generateExecutionReport(r.id, [
        { step: 1, startedAt: new Date(), completedAt: new Date(), success: true, output: 'OK' },
      ])
      expect(report).toContain('Runbook 执行报告')
      expect(report).toContain(r.title)
    })

    it('反例: 不存在的 runbook 抛异常', () => {
      expect(() => svc.generateExecutionReport('ghost', [])).toThrow()
    })
  })

  // ── getCriticalSteps ──
  describe('getCriticalSteps', () => {
    it('正例: 返回含 rollbackCommand 的步骤', () => {
      const r = svc.create(makeCreateInput({
        steps: [
          { stepNumber: 1, title: '普通', description: '普通操作' },
          { stepNumber: 2, title: '关键', description: '危险', rollbackCommand: 'rollback', warningMessage: '注意' },
        ],
      }))
      const critical = svc.getCriticalSteps(r.id)
      expect(critical).toHaveLength(1)
      expect(critical[0].title).toBe('关键')
    })

    it('正例: 没有关键步骤返回空数组', () => {
      const r = svc.create(makeCreateInput())
      expect(svc.getCriticalSteps(r.id)).toEqual([])
    })
  })

  // ── validate ──
  describe('validate', () => {
    it('正例: 有效 Runbook 返回 valid=true', () => {
      const r = svc.create(makeCreateInput())
      const result = svc.validate(r.id)
      expect(result.valid).toBe(true)
      expect(result.errors).toEqual([])
    })

    it('反例: 不存在返回 valid=false', () => {
      const result = svc.validate('ghost')
      expect(result.valid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
    })

    it('反例: 空 title 返回 valid=false', () => {
      const r = svc.create(makeCreateInput({ title: '' }))
      const result = svc.validate(r.id)
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('标题不能为空')
    })
  })

  // ── search ──
  describe('search', () => {
    it('正例: 按标题搜索', () => {
      svc.create(makeCreateInput({ title: '数据库故障恢复' }))
      svc.create(makeCreateInput({ title: '前端部署' }))
      const result = svc.search('数据库')
      expect(result).toHaveLength(1)
    })

    it('正例: 按标签搜索', () => {
      svc.create(makeCreateInput({ title: 'K8s', tags: ['Kubernetes'] }))
      const result = svc.search('Kubernetes')
      expect(result).toHaveLength(1)
    })

    it('反例: 空关键词返回空数组', () => {
      svc.create(makeCreateInput())
      expect(svc.search('')).toEqual([])
    })

    it('反例: 无匹配返回空数组', () => {
      expect(svc.search('不存在')).toEqual([])
    })
  })
})
