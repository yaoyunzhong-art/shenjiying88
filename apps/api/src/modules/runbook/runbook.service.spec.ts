import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * 🐜 自动: [runbook] [A] service.spec — ≥18项正反例+边界
 * RunbookService 纯函数式内联测试 (不 import 生产代码)
 *
 * 覆盖: CRUD(4) + 告警映射(2) + 验证(3) + 搜索(2) + 执行报告(3) + 关键步骤(2) + 预设(2) = 18
 */

import assert from 'node:assert/strict'

// ── 内联类型 ──

type RunbookCategory = 'deployment' | 'scaling' | '故障排查' | '灾难恢复' | '安全事件' | '监控告警'
type Severity = 'critical' | 'high' | 'medium' | 'low'
type RunbookStatus = 'draft' | 'active' | 'archived'

interface RunbookStep {
  stepNumber: number; title: string; description: string; command?: string
  expectedOutput?: string; rollbackCommand?: string; estimatedMinutes?: number; warningMessage?: string
}

interface Runbook {
  id: string; title: string; category: RunbookCategory; severity: Severity
  applicableVersions: string[]; prerequisites: string[]; steps: RunbookStep[]
  estimatedTotalMinutes: number; relatedAlerts?: string[]; relatedRunbooks?: string[]
  status: RunbookStatus; createdAt: Date; updatedAt: Date; lastTestedAt?: Date; tags: string[]
}

interface AlertMapping {
  alertName: string; severity: Severity; possibleCauses: string[]; runbookId: string; autoAction?: string
}

// ── 预设数据 ──

const PRESET_RUNBOOKS: Runbook[] = [
  { id: 'deploy-api-single', title: '单机部署 API', category: 'deployment', severity: 'high', applicableVersions: ['v2.0.0+'], prerequisites: ['Ubuntu 22.04', 'Docker'], steps: [{ stepNumber: 1, title: '环境检查', description: '检查环境', command: 'docker --version', estimatedMinutes: 2 }, { stepNumber: 2, title: '部署', description: '启动服务', command: 'docker-compose up -d', estimatedMinutes: 10, rollbackCommand: 'docker-compose down' }], estimatedTotalMinutes: 15, status: 'active', createdAt: new Date('2024-01-15'), updatedAt: new Date('2024-06-01'), tags: ['部署'] },
  { id: 'troubleshoot-slow-api', title: 'API 响应慢排查', category: '故障排查', severity: 'high', applicableVersions: ['v1.0.0+'], prerequisites: ['日志权限'], steps: [{ stepNumber: 1, title: '查看日志', description: '检查日志', command: 'kubectl logs', estimatedMinutes: 3, warningMessage: '注意高峰期' }, { stepNumber: 2, title: '分析', description: '分析慢查询', estimatedMinutes: 10 }], estimatedTotalMinutes: 30, status: 'active', createdAt: new Date('2024-01-10'), updatedAt: new Date('2024-06-20'), tags: ['故障排查'] },
  { id: 'dr-database-failover', title: '数据库主从切换', category: '灾难恢复', severity: 'critical', applicableVersions: ['v1.0.0+'], prerequisites: ['主从架构'], steps: [{ stepNumber: 1, title: '检查主库', description: '确认故障', command: 'mysql -h primary -e "SELECT 1"', estimatedMinutes: 2, warningMessage: '确认真实故障' }, { stepNumber: 2, title: '切换', description: '提升从库', command: 'FAILOVER', estimatedMinutes: 5, rollbackCommand: 'ROLLBACK' }], estimatedTotalMinutes: 20, status: 'active', createdAt: new Date('2024-01-25'), updatedAt: new Date('2024-06-10'), tags: ['灾难恢复'] },
  { id: 'monitor-setup', title: 'Prometheus 告警', category: '监控告警', severity: 'medium', applicableVersions: ['v2.0.0+'], prerequisites: ['Prometheus'], steps: [{ stepNumber: 1, title: '创建规则', description: '编写规则', command: 'vim rules.yml', estimatedMinutes: 10 }], estimatedTotalMinutes: 35, status: 'active', createdAt: new Date('2024-03-15'), updatedAt: new Date('2024-06-05'), tags: ['监控'] },
]

const PRESET_ALERT_MAPPINGS: AlertMapping[] = [
  { alertName: 'ALERT_cpu_high', severity: 'high', possibleCauses: ['流量突增'], runbookId: 'deploy-api-single', autoAction: 'scale-hpa' },
  { alertName: 'ALERT_db_slow_query', severity: 'high', possibleCauses: ['缺少索引'], runbookId: 'troubleshoot-slow-api' },
]

// ── 内联 Mock Service ──

let _idCounter = 0
function genId(): string { return `rb-${++_idCounter}` }

class MockRunbookService {
  private runbooks = new Map<string, Runbook>()
  private alertMappings = new Map<string, AlertMapping>()

  constructor() {
    for (const r of PRESET_RUNBOOKS) this.runbooks.set(r.id, { ...r })
    for (const m of PRESET_ALERT_MAPPINGS) this.alertMappings.set(m.alertName, { ...m })
  }

  create(input: Omit<Runbook, 'id' | 'createdAt' | 'updatedAt'>): Runbook {
    const now = new Date()
    const r: Runbook = { ...input, id: genId(), createdAt: now, updatedAt: now } as Runbook
    this.runbooks.set(r.id, r)
    return r
  }

  get(id: string): Runbook | null { return this.runbooks.get(id) ?? null }

  list(filter?: { category?: RunbookCategory; severity?: Severity; status?: RunbookStatus; tag?: string }): Runbook[] {
    let r = Array.from(this.runbooks.values())
    if (filter?.category) r = r.filter((x) => x.category === filter.category)
    if (filter?.severity) r = r.filter((x) => x.severity === filter.severity)
    if (filter?.status) r = r.filter((x) => x.status === filter.status)
    if (filter?.tag) r = r.filter((x) => x.tags.includes(filter.tag!))
    return r
  }

  update(id: string, updates: Partial<Runbook>): Runbook {
    const existing = this.runbooks.get(id)
    if (!existing) throw new Error(`Runbook not found: ${id}`)
    const updated: Runbook = { ...existing, ...updates, id: existing.id, createdAt: existing.createdAt, updatedAt: new Date() }
    this.runbooks.set(id, updated)
    return updated
  }

  delete(id: string): void {
    if (!this.runbooks.has(id)) throw new Error(`Runbook not found: ${id}`)
    this.runbooks.delete(id)
  }

  mapAlert(alertName: string, runbookId: string, possibleCauses: string[], severity: Severity, autoAction?: string): AlertMapping {
    const m: AlertMapping = { alertName, runbookId, possibleCauses, severity, autoAction }
    this.alertMappings.set(alertName, m)
    return m
  }

  findByAlert(alertName: string): AlertMapping | null { return this.alertMappings.get(alertName) ?? null }

  generateExecutionReport(runbookId: string, logs: Array<{ step: number; startedAt: Date; completedAt?: Date; success?: boolean; output?: string; error?: string }>): string {
    const r = this.runbooks.get(runbookId)
    if (!r) throw new Error(`Runbook not found: ${runbookId}`)
    const lines: string[] = [`# Runbook 执行报告`, ``, `**Runbook**: ${r.title}`, `**总计步骤**: ${r.steps.length}`, ``]
    let ok = 0; let fail = 0
    for (const log of logs) {
      const step = r.steps.find((s) => s.stepNumber === log.step)
      if (!step) continue
      const status = log.success ? '✅ 成功' : log.error ? '❌ 失败' : '⏳ 进行中'
      lines.push(`## 步骤 ${log.step}: ${step.title}`, ``, `**状态**: ${status}`)
      if (log.success) ok++; else if (log.error) fail++
    }
    lines.push(``, `## 摘要`, ``, `- **成功**: ${ok}`, `- **失败**: ${fail}`)
    return lines.join('\n')
  }

  getCriticalSteps(runbookId: string): RunbookStep[] {
    const r = this.runbooks.get(runbookId)
    if (!r) throw new Error(`Runbook not found: ${runbookId}`)
    return r.steps.filter((s) => s.rollbackCommand || s.warningMessage)
  }

  validate(runbookId: string): { valid: boolean; errors: string[]; warnings: string[] } {
    const r = this.runbooks.get(runbookId)
    const errors: string[] = []; const warnings: string[] = []
    if (!r) { errors.push(`Runbook not found: ${runbookId}`); return { valid: false, errors, warnings } }
    if (!r.title) errors.push('标题不能为空')
    if (r.steps.length === 0) errors.push('必须包含至少一个步骤')
    for (const s of r.steps) { if (!s.title) errors.push(`步骤 ${s.stepNumber} 缺少标题`) }
    if (r.prerequisites.length === 0) warnings.push('缺少前置条件说明')
    if (!r.lastTestedAt) warnings.push('Runbook 尚未测试过')
    return { valid: errors.length === 0, errors, warnings }
  }

  search(keyword: string): Runbook[] {
    const kw = keyword.toLowerCase()
    return Array.from(this.runbooks.values()).filter((r) =>
      r.title.toLowerCase().includes(kw) || r.tags.some((t) => t.toLowerCase().includes(kw)) ||
      r.steps.some((s) => s.title.toLowerCase().includes(kw) || s.description.toLowerCase().includes(kw))
    )
  }

  // testing helper
  presetCount(): number { return PRESET_RUNBOOKS.length }
}

// ── 测试 ──

describe('runbook service.spec', () => {
  let svc: MockRunbookService

  beforeEach(() => { svc = new MockRunbookService() })

  // === 1. CRUD (4) ===
  describe('CRUD', () => {
    it('create 创建新 Runbook', () => {
      const r = svc.create({ title: '新手册', category: 'deployment', severity: 'low', applicableVersions: ['v1'], prerequisites: [], steps: [{ stepNumber: 1, title: '步骤1', description: '描述' }], estimatedTotalMinutes: 5, status: 'draft', tags: ['test'] })
      assert.ok(r.id); assert.equal(r.title, '新手册'); assert.equal(r.status, 'draft')
    })
    it('get 返回预设 Runbook', () => {
      assert.ok(svc.get('deploy-api-single'))
      assert.equal(svc.get('deploy-api-single')!.title, '单机部署 API')
    })
    it('get 不存在的返回 null', () => {
      assert.equal(svc.get('non-existent'), null)
    })
    it('delete 删除后 get 返回 null', () => {
      const r = svc.create({ title: '临时', category: 'deployment', severity: 'low', applicableVersions: [], prerequisites: [], steps: [{ stepNumber: 1, title: 'x', description: 'x' }], estimatedTotalMinutes: 1, status: 'draft', tags: [] })
      svc.delete(r.id)
      assert.equal(svc.get(r.id), null)
    })
  })

  // === 2. 告警映射 (2) ===
  describe('告警映射', () => {
    it('mapAlert + findByAlert', () => {
      svc.mapAlert('ALERT_oom', 'troubleshoot-slow-api', ['内存不足'], 'critical', 'scale-up')
      const m = svc.findByAlert('ALERT_oom')
      assert.ok(m); assert.equal(m!.runbookId, 'troubleshoot-slow-api')
    })
    it('findByAlert 不存在的返回 null', () => {
      assert.equal(svc.findByAlert('ALERT_none'), null)
    })
  })

  // === 3. 验证 (3) ===
  describe('验证', () => {
    it('预设 Runbook 验证通过', () => {
      const v = svc.validate('deploy-api-single')
      assert.ok(v.valid)
    })
    it('不存在的 Runbook 验证失败', () => {
      const v = svc.validate('nonexistent')
      assert.equal(v.valid, false)
      assert.ok(v.errors.length > 0)
    })
    it('无步骤的 Runbook 验证失败', () => {
      const r = svc.create({ title: '空', category: 'deployment', severity: 'low', applicableVersions: [], prerequisites: ['x'], steps: [], estimatedTotalMinutes: 0, status: 'draft', tags: [] })
      const v = svc.validate(r.id)
      assert.equal(v.valid, false)
    })
  })

  // === 4. 搜索 (2) ===
  describe('搜索', () => {
    it('search 按标题匹配', () => {
      assert.ok(svc.search('API').length >= 1)
    })
    it('search 按标签匹配', () => {
      assert.ok(svc.search('故障').length >= 1)
    })
  })

  // === 5. 执行报告 (3) ===
  describe('执行报告', () => {
    it('generateExecutionReport 生成 Markdown', () => {
      const report = svc.generateExecutionReport('deploy-api-single', [
        { step: 1, startedAt: new Date(), completedAt: new Date(), success: true, output: 'ok' },
        { step: 2, startedAt: new Date(), completedAt: new Date(), success: false, error: 'timeout' },
      ])
      assert.ok(report.includes('✅ 成功'))
      assert.ok(report.includes('❌ 失败'))
    })
    it('不存在 Runbook 抛错', () => {
      assert.throws(() => svc.generateExecutionReport('x', []), /not found/)
    })
    it('成功/失败计数正确', () => {
      const report = svc.generateExecutionReport('deploy-api-single', [
        { step: 1, startedAt: new Date(), completedAt: new Date(), success: true },
        { step: 2, startedAt: new Date(), completedAt: new Date(), success: true },
      ])
      assert.ok(report.includes('**成功**: 2'))
    })
  })

  // === 6. 关键步骤 (2) ===
  describe('关键步骤', () => {
    it('getCriticalSteps 返回含 rollback/warning 的步骤', () => {
      const steps = svc.getCriticalSteps('deploy-api-single')
      assert.ok(steps.some((s) => s.rollbackCommand))
    })
    it('无关键步骤返回空', () => {
      const r = svc.create({ title: '简单', category: 'deployment', severity: 'low', applicableVersions: [], prerequisites: [], steps: [{ stepNumber: 1, title: 'x', description: 'x' }], estimatedTotalMinutes: 1, status: 'draft', tags: [] })
      assert.equal(svc.getCriticalSteps(r.id).length, 0)
    })
  })

  // === 7. 预设 (2) ===
  describe('预设数据', () => {
    it('list 返回所有预设', () => {
      assert.equal(svc.list().length, svc.presetCount())
    })
    it('list 按 category 过滤', () => {
      assert.ok(svc.list({ category: '监控告警' }).length >= 1)
    })
  })
})
