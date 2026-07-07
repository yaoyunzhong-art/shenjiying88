/**
 * runbook.service.spec.ts — 运维手册 Service 纯函数式内联测试
 *
 * 覆盖：
 *   - Runbook CRUD: 创建/获取/列表/更新/删除
 *   - 列表筛选: 分类/严重级别/状态/标签
 *   - 告警映射: 绑定/查找
 *   - 执行报告: 生成 Markdown 报告
 *   - 关键步骤: 提取含 rollback/warning 的步骤
 *   - 验证: 完整/缺失字段/空步骤
 *   - 搜索: 标题/标签/步骤/前置条件
 *
 * 全部内联 mock，不依赖 NestJS DI。≥ 18 项测试。
 */

import { describe, it, expect, beforeEach } from 'vitest'

// ═══════════════════════════════════════════════════════════════
// 枚举常量
// ═══════════════════════════════════════════════════════════════

const RUNBOOK_CATEGORIES = ['deployment', 'scaling', '故障排查', '灾难恢复', '安全事件', '监控告警'] as const
const SEVERITIES = ['critical', 'high', 'medium', 'low'] as const
const STATUSES = ['draft', 'active', 'archived'] as const

// ═══════════════════════════════════════════════════════════════
// Types (内联)
// ═══════════════════════════════════════════════════════════════

interface InlineRunbookStep {
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

interface InlineRunbook {
  id: string
  title: string
  category: string
  severity: string
  applicableVersions: string[]
  prerequisites: string[]
  steps: InlineRunbookStep[]
  estimatedTotalMinutes: number
  relatedAlerts?: string[]
  relatedRunbooks?: string[]
  status: string
  createdAt: Date
  updatedAt: Date
  lastTestedAt?: Date
  tags: string[]
}

interface InlineAlertMapping {
  alertName: string
  severity: string
  possibleCauses: string[]
  runbookId: string
  autoAction?: string
}

interface InlineExecutionLog {
  step: number
  startedAt: Date
  completedAt?: Date
  success?: boolean
  output?: string
  error?: string
}

// ═══════════════════════════════════════════════════════════════
// 内联业务逻辑 — 对应 runbook.service.ts 核心函数
// ═══════════════════════════════════════════════════════════════

function inlineCreateRunbook(
  store: Map<string, InlineRunbook>,
  input: Omit<InlineRunbook, 'id' | 'createdAt' | 'updatedAt'>,
): InlineRunbook {
  const now = new Date()
  const id = `runbook-test-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
  const newRunbook: InlineRunbook = {
    ...input,
    id,
    createdAt: now,
    updatedAt: now,
  }
  store.set(newRunbook.id, newRunbook)
  return newRunbook
}

function inlineGetRunbook(
  store: Map<string, InlineRunbook>,
  id: string,
): InlineRunbook | null {
  return store.get(id) ?? null
}

function inlineListRunbooks(
  store: Map<string, InlineRunbook>,
  filter?: {
    category?: string
    severity?: string
    status?: string
    tag?: string
  },
): InlineRunbook[] {
  let result = Array.from(store.values())
  if (filter?.category) result = result.filter((r) => r.category === filter.category)
  if (filter?.severity) result = result.filter((r) => r.severity === filter.severity)
  if (filter?.status) result = result.filter((r) => r.status === filter.status)
  if (filter?.tag) result = result.filter((r) => r.tags.includes(filter.tag!))
  return result
}

function inlineUpdateRunbook(
  store: Map<string, InlineRunbook>,
  id: string,
  updates: Partial<InlineRunbook>,
): InlineRunbook {
  const existing = store.get(id)
  if (!existing) throw new Error(`Runbook not found: ${id}`)
  const updated: InlineRunbook = {
    ...existing,
    ...updates,
    id: existing.id,
    createdAt: existing.createdAt,
    updatedAt: new Date(),
  }
  store.set(id, updated)
  return updated
}

function inlineDeleteRunbook(
  store: Map<string, InlineRunbook>,
  id: string,
): void {
  if (!store.has(id)) throw new Error(`Runbook not found: ${id}`)
  store.delete(id)
}

function inlineMapAlert(
  alertMappings: Map<string, InlineAlertMapping>,
  alertName: string,
  runbookId: string,
  possibleCauses: string[],
  severity: string,
  autoAction?: string,
): InlineAlertMapping {
  const mapping: InlineAlertMapping = { alertName, runbookId, possibleCauses, severity, autoAction }
  alertMappings.set(alertName, mapping)
  return mapping
}

function inlineFindByAlert(
  alertMappings: Map<string, InlineAlertMapping>,
  alertName: string,
): InlineAlertMapping | null {
  return alertMappings.get(alertName) ?? null
}

function inlineGenerateExecutionReport(
  runbook: InlineRunbook,
  executionLog: InlineExecutionLog[],
): string {
  const lines: string[] = []
  lines.push('# Runbook 执行报告')
  lines.push('')
  lines.push(`**Runbook**: ${runbook.title}`)
  lines.push(`**执行时间**: ${new Date().toISOString()}`)
  lines.push(`**总计步骤**: ${runbook.steps.length}`)
  lines.push('')
  lines.push('---')
  lines.push('')

  let successCount = 0
  let failCount = 0

  for (const log of executionLog) {
    const step = runbook.steps.find((s) => s.stepNumber === log.step)
    if (!step) continue
    const status = log.success ? '✅ 成功' : log.error ? '❌ 失败' : '⏳ 进行中'
    lines.push(`## 步骤 ${log.step}: ${step.title}`)
    lines.push('')
    lines.push(`**状态**: ${status}`)
    lines.push(`**开始时间**: ${log.startedAt.toISOString()}`)
    if (log.completedAt) {
      const duration = Math.round((log.completedAt.getTime() - log.startedAt.getTime()) / 1000 / 60)
      lines.push(`**耗时**: ${duration} 分钟`)
    }
    if (log.output) { lines.push(''); lines.push('**输出**:'); lines.push('```'); lines.push(log.output); lines.push('```') }
    if (log.error) { lines.push(''); lines.push('**错误**:'); lines.push('```'); lines.push(log.error); lines.push('```') }
    lines.push('')
    if (log.success) successCount++
    else if (log.error) failCount++
  }

  lines.push('---')
  lines.push('')
  lines.push('## 执行摘要')
  lines.push('')
  lines.push(`- **成功**: ${successCount}`)
  lines.push(`- **失败**: ${failCount}`)
  lines.push(`- **进行中**: ${executionLog.length - successCount - failCount}`)
  lines.push('')

  return lines.join('\n')
}

function inlineGetCriticalSteps(runbook: InlineRunbook): InlineRunbookStep[] {
  return runbook.steps.filter(
    (step) => step.rollbackCommand || step.warningMessage,
  )
}

function inlineValidate(runbook: InlineRunbook): { valid: boolean; errors: string[]; warnings: string[] } {
  const errors: string[] = []
  const warnings: string[] = []

  if (!runbook.title) errors.push('标题不能为空')
  if (runbook.steps.length === 0) errors.push('必须包含至少一个步骤')
  for (const step of runbook.steps) {
    if (!step.title) errors.push(`步骤 ${step.stepNumber} 缺少标题`)
    if (!step.description) warnings.push(`步骤 ${step.stepNumber} 缺少描述`)
    if (!step.command && !step.description) warnings.push(`步骤 ${step.stepNumber} 既没有命令也没有描述`)
  }
  if (runbook.prerequisites.length === 0) warnings.push('缺少前置条件说明')
  if (!runbook.lastTestedAt) warnings.push('Runbook 尚未测试过')

  return { valid: errors.length === 0, errors, warnings }
}

function inlineSearch(
  store: Map<string, InlineRunbook>,
  keyword: string,
): InlineRunbook[] {
  const lower = keyword.toLowerCase()
  const results: InlineRunbook[] = []
  for (const runbook of store.values()) {
    if (runbook.title.toLowerCase().includes(lower)) { results.push(runbook); continue }
    if (runbook.tags.some((t) => t.toLowerCase().includes(lower))) { results.push(runbook); continue }
    if (runbook.steps.some((s) => s.title.toLowerCase().includes(lower) || s.description.toLowerCase().includes(lower))) { results.push(runbook); continue }
    if (runbook.prerequisites.some((p) => p.toLowerCase().includes(lower))) { results.push(runbook); continue }
  }
  return results
}

// ═══════════════════════════════════════════════════════════════
// Mock 数据工厂
// ═══════════════════════════════════════════════════════════════

function makeStep(overrides: Partial<InlineRunbookStep> = {}): InlineRunbookStep {
  return {
    stepNumber: 1,
    title: '检查服务状态',
    description: '查看 API 服务运行状态',
    command: 'kubectl get pods',
    expectedOutput: 'Running',
    estimatedMinutes: 2,
    ...overrides,
  }
}

function makeRunbook(overrides: Partial<InlineRunbook> = {}): InlineRunbook {
  return {
    id: 'rb-test-001',
    title: 'API 部署流程',
    category: 'deployment',
    severity: 'high',
    applicableVersions: ['v1.0.0+'],
    prerequisites: ['Docker 已安装', 'Kubectl 已配置'],
    steps: [makeStep()],
    estimatedTotalMinutes: 30,
    relatedAlerts: ['ALERT_service_down'],
    status: 'active',
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-06-01'),
    lastTestedAt: new Date('2026-06-01'),
    tags: ['部署', 'API', 'Docker'],
    ...overrides,
  }
}

function makeExecutionLog(overrides: Partial<InlineExecutionLog> = {}): InlineExecutionLog {
  return {
    step: 1,
    startedAt: new Date('2026-07-01T00:00:00Z'),
    completedAt: new Date('2026-07-01T00:02:00Z'),
    success: true,
    output: 'all pods running',
    ...overrides,
  }
}

// ═══════════════════════════════════════════════════════════════
// 测试套件
// ═══════════════════════════════════════════════════════════════

describe('RunbookService (内联纯函数)', () => {
  let runbookStore: Map<string, InlineRunbook>
  let alertMappings: Map<string, InlineAlertMapping>

  beforeEach(() => {
    runbookStore = new Map()
    alertMappings = new Map()
  })

  // ── 1. Runbook CRUD ─────────────────────────────────────────

  describe('1. Runbook CRUD', () => {
    it('创建 Runbook — 生成 id / createdAt / updatedAt', () => {
      const rb = inlineCreateRunbook(runbookStore, {
        title: '数据库主从切换',
        category: '灾难恢复',
        severity: 'critical',
        applicableVersions: ['v1.0.0+'],
        prerequisites: ['主从架构已配置'],
        steps: [makeStep({ stepNumber: 1, title: '检查从库同步' })],
        estimatedTotalMinutes: 20,
        status: 'draft',
        tags: ['灾难恢复', '数据库'],
      })
      expect(rb.id).toMatch(/^runbook-test-/)
      expect(rb.title).toBe('数据库主从切换')
      expect(rb.createdAt).toBeInstanceOf(Date)
      expect(rb.updatedAt).toEqual(rb.createdAt)
      expect(runbookStore.size).toBe(1)
    })

    it('获取 Runbook — 存在返回对象，不存在 null', () => {
      const rb = inlineCreateRunbook(runbookStore, { title: '测试', category: 'deployment', severity: 'low', applicableVersions: [], prerequisites: [], steps: [makeStep()], estimatedTotalMinutes: 5, status: 'draft', tags: [] })
      expect(inlineGetRunbook(runbookStore, rb.id)).toEqual(rb)
      expect(inlineGetRunbook(runbookStore, 'nonexistent')).toBeNull()
    })

    it('删除 Runbook — 存在时删除，不存在抛出异常', () => {
      const rb = inlineCreateRunbook(runbookStore, { title: '待删除', category: 'deployment', severity: 'low', applicableVersions: [], prerequisites: [], steps: [makeStep()], estimatedTotalMinutes: 5, status: 'draft', tags: [] })
      inlineDeleteRunbook(runbookStore, rb.id)
      expect(runbookStore.size).toBe(0)
      expect(() => inlineDeleteRunbook(runbookStore, 'nonexistent')).toThrow('not found')
    })

    it('更新 Runbook — 保留 id/createdAt，更新 updatedAt', () => {
      const rb = inlineCreateRunbook(runbookStore, { title: '旧标题', category: 'deployment', severity: 'low', applicableVersions: [], prerequisites: [], steps: [makeStep()], estimatedTotalMinutes: 5, status: 'draft', tags: [] })
      const updated = inlineUpdateRunbook(runbookStore, rb.id, { title: '新标题', severity: 'high' })
      expect(updated.title).toBe('新标题')
      expect(updated.severity).toBe('high')
      expect(updated.id).toBe(rb.id)
      expect(updated.createdAt).toEqual(rb.createdAt)
      expect(updated.updatedAt.getTime()).toBeGreaterThanOrEqual(rb.createdAt.getTime())
    })
  })

  // ── 2. 列表筛选 ─────────────────────────────────────────────

  describe('2. 列表筛选', () => {
    it('按分类筛选 — 只返回匹配的', () => {
      inlineCreateRunbook(runbookStore, { title: '部署', category: 'deployment', severity: 'high', applicableVersions: [], prerequisites: [], steps: [makeStep()], estimatedTotalMinutes: 10, status: 'active', tags: [] })
      inlineCreateRunbook(runbookStore, { title: '故障排查', category: '故障排查', severity: 'critical', applicableVersions: [], prerequisites: [], steps: [makeStep()], estimatedTotalMinutes: 10, status: 'active', tags: [] })
      inlineCreateRunbook(runbookStore, { title: '扩容', category: 'scaling', severity: 'medium', applicableVersions: [], prerequisites: [], steps: [makeStep()], estimatedTotalMinutes: 10, status: 'active', tags: [] })
      const list = inlineListRunbooks(runbookStore, { category: 'deployment' })
      expect(list).toHaveLength(1)
      expect(list[0].title).toBe('部署')
    })

    it('按严重级别筛选 — 只返回匹配的', () => {
      inlineCreateRunbook(runbookStore, { title: 'C1', category: 'deployment', severity: 'critical', applicableVersions: [], prerequisites: [], steps: [makeStep()], estimatedTotalMinutes: 5, status: 'active', tags: [] })
      inlineCreateRunbook(runbookStore, { title: 'H1', category: 'scaling', severity: 'high', applicableVersions: [], prerequisites: [], steps: [makeStep()], estimatedTotalMinutes: 5, status: 'active', tags: [] })
      expect(inlineListRunbooks(runbookStore, { severity: 'critical' })).toHaveLength(1)
    })

    it('按状态筛选 — 支持 draft / active / archived', () => {
      inlineCreateRunbook(runbookStore, { title: '草稿', category: 'deployment', severity: 'low', applicableVersions: [], prerequisites: [], steps: [makeStep()], estimatedTotalMinutes: 5, status: 'draft', tags: [] })
      inlineCreateRunbook(runbookStore, { title: '已归档', category: 'deployment', severity: 'low', applicableVersions: [], prerequisites: [], steps: [makeStep()], estimatedTotalMinutes: 5, status: 'archived', tags: [] })
      expect(inlineListRunbooks(runbookStore, { status: 'draft' })).toHaveLength(1)
      expect(inlineListRunbooks(runbookStore, { status: 'archived' })).toHaveLength(1)
      expect(inlineListRunbooks(runbookStore, { status: 'active' })).toHaveLength(0)
    })

    it('按标签筛选 — 精确匹配', () => {
      inlineCreateRunbook(runbookStore, { title: 'DB', category: '部署', severity: 'high', applicableVersions: [], prerequisites: [], steps: [makeStep()], estimatedTotalMinutes: 5, status: 'active', tags: ['数据库', '容灾'] })
      inlineCreateRunbook(runbookStore, { title: 'API', category: '部署', severity: 'high', applicableVersions: [], prerequisites: [], steps: [makeStep()], estimatedTotalMinutes: 5, status: 'active', tags: ['API', '部署'] })
      expect(inlineListRunbooks(runbookStore, { tag: '数据库' })).toHaveLength(1)
      expect(inlineListRunbooks(runbookStore, { tag: '部署' })).toHaveLength(1)
    })
  })

  // ── 3. 告警映射 ─────────────────────────────────────────────

  describe('3. 告警映射', () => {
    it('mapAlert — 绑定告警到 Runbook', () => {
      inlineCreateRunbook(runbookStore, { title: '慢查询排查', category: '故障排查', severity: 'high', applicableVersions: [], prerequisites: [], steps: [makeStep()], estimatedTotalMinutes: 30, status: 'active', tags: [] })
      const m = inlineMapAlert(alertMappings, 'ALERT_db_slow', 'rb-slow', ['缺少索引', '查询效率低'], 'high', 'kill-slow-queries')
      expect(m.alertName).toBe('ALERT_db_slow')
      expect(m.runbookId).toBe('rb-slow')
      expect(m.autoAction).toBe('kill-slow-queries')
    })

    it('findByAlert — 根据告警名查找映射', () => {
      inlineMapAlert(alertMappings, 'ALERT_cpu_high', 'rb-cpu', ['流量突增'], 'high')
      const found = inlineFindByAlert(alertMappings, 'ALERT_cpu_high')
      expect(found).toBeTruthy()
      expect(found!.runbookId).toBe('rb-cpu')
      expect(inlineFindByAlert(alertMappings, 'nonexistent')).toBeNull()
    })
  })

  // ── 4. 执行报告 & 关键步骤 ──────────────────────────────────

  describe('4. 执行报告 & 关键步骤', () => {
    it('generateExecutionReport — 生成 Markdown 格式报告', () => {
      const rb = inlineCreateRunbook(runbookStore, { title: '测试流程', category: 'deployment', severity: 'low', applicableVersions: [], prerequisites: ['工具已安装'], steps: [makeStep({ stepNumber: 1, title: '步骤一' })], estimatedTotalMinutes: 5, status: 'active', tags: [] })
      const report = inlineGenerateExecutionReport(rb, [makeExecutionLog({ step: 1, success: true, output: 'OK' })])
      expect(report).toContain('# Runbook 执行报告')
      expect(report).toContain('✅ 成功')
      expect(report).toContain('OK')
      expect(report).toContain('执行摘要')
      expect(report).toContain('- **成功**: 1')
      expect(report).toContain('- **失败**: 0')
    })

    it('getCriticalSteps — 只返回含 rollbackCommand 或 warningMessage 的步骤', () => {
      const rb = inlineCreateRunbook(runbookStore, { title: '关键步骤测试', category: 'deployment', severity: 'high', applicableVersions: [], prerequisites: [], steps: [
        makeStep({ stepNumber: 1, title: '普通步骤' }),
        makeStep({ stepNumber: 2, title: '有回滚', rollbackCommand: 'docker-compose down' }),
        makeStep({ stepNumber: 3, title: '有警告', warningMessage: '注意 SSL 证书' }),
      ], estimatedTotalMinutes: 10, status: 'active', tags: [] })
      const critical = inlineGetCriticalSteps(rb)
      expect(critical).toHaveLength(2)
      expect(critical.map((s) => s.title)).toEqual(['有回滚', '有警告'])
    })
  })

  // ── 5. 验证 ─────────────────────────────────────────────────

  describe('5. 验证', () => {
    it('validate — 完整 Runbook 返回 valid', () => {
      const rb = makeRunbook()
      const result = inlineValidate(rb)
      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('validate — 缺少 title 报错', () => {
      const rb = makeRunbook({ title: '' })
      const result = inlineValidate(rb)
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('标题不能为空')
    })

    it('validate — 空 steps 报错', () => {
      const rb = makeRunbook({ steps: [] })
      const result = inlineValidate(rb)
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('必须包含至少一个步骤')
    })

    it('validate — 缺少测试给出警告', () => {
      const rb = makeRunbook({ lastTestedAt: undefined })
      const result = inlineValidate(rb)
      expect(result.valid).toBe(true)
      expect(result.warnings).toContain('Runbook 尚未测试过')
    })
  })

  // ── 6. 搜索 ─────────────────────────────────────────────────

  describe('6. 搜索', () => {
    it('按标题关键词搜索', () => {
      inlineCreateRunbook(runbookStore, { title: '数据库主从切换', category: 'deployment', severity: 'high', applicableVersions: [], prerequisites: [], steps: [makeStep()], estimatedTotalMinutes: 10, status: 'active', tags: [] })
      inlineCreateRunbook(runbookStore, { title: 'API 服务部署', category: 'deployment', severity: 'high', applicableVersions: [], prerequisites: [], steps: [makeStep()], estimatedTotalMinutes: 10, status: 'active', tags: [] })
      expect(inlineSearch(runbookStore, '数据库')).toHaveLength(1)
      expect(inlineSearch(runbookStore, '部署')).toHaveLength(1)
    })

    it('按标签搜索', () => {
      inlineCreateRunbook(runbookStore, { title: 'R1', category: 'deployment', severity: 'low', applicableVersions: [], prerequisites: [], steps: [makeStep()], estimatedTotalMinutes: 5, status: 'active', tags: ['Kubernetes', 'Helm'] })
      expect(inlineSearch(runbookStore, 'helm')).toHaveLength(1)
      expect(inlineSearch(runbookStore, 'kubernetes')).toHaveLength(1)
    })

    it('按步骤描述搜索', () => {
      inlineCreateRunbook(runbookStore, { title: 'R', category: 'deployment', severity: 'low', applicableVersions: [], prerequisites: [], steps: [makeStep({ title: '检查 Metrics Server', description: '确认 Metrics Server 是否运行' })], estimatedTotalMinutes: 5, status: 'active', tags: [] })
      expect(inlineSearch(runbookStore, 'Metrics')).toHaveLength(1)
    })

    it('按前置条件搜索', () => {
      inlineCreateRunbook(runbookStore, { title: 'R', category: 'deployment', severity: 'low', applicableVersions: [], prerequisites: ['K8s 集群已就绪', 'kubectl 已配置'], steps: [makeStep()], estimatedTotalMinutes: 5, status: 'active', tags: [] })
      expect(inlineSearch(runbookStore, 'kubectl')).toHaveLength(1)
    })

    it('搜索无结果返回空数组', () => {
      expect(inlineSearch(runbookStore, 'nonexistent')).toEqual([])
    })
  })
})
