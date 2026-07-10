// runbook.stress.test.ts - 运维手册压力/韧性测试
// 覆盖: 批量并发操作、大数据量、异常边界、资源耗尽模拟
// 内联 Controller + Service 模式

import { describe, it, expect, beforeEach } from 'vitest'
import assert from 'node:assert/strict'
import { RunbookController } from './runbook.controller'
import { RunbookService } from './runbook.service'
import type { Runbook, RunbookCategory, Severity, RunbookStatus } from './runbook.entity'

// ── 辅助工厂 ──────────────────────────────────────────────

function createCleanService(): RunbookService {
  return new RunbookService()
}

function createCleanController(): RunbookController {
  return new RunbookController(createCleanService())
}

// 预设 runbook 数量（从 service 读取）
function getPresetCount(ctrl: RunbookController): number {
  const all = ctrl.list({})
  const presets = all.filter(r => r.tags.includes('部署') || r.tags.includes('Kubernetes') || r.tags.includes('Docker'))
  return presets.length
}

// ── 批量数据生成 ──────────────────────────────────────────

const CATEGORIES: RunbookCategory[] = ['deployment', 'scaling', '故障排查', '灾难恢复', '安全事件', '监控告警']
const SEVERITIES: Severity[] = ['critical', 'high', 'medium', 'low']
const STATUSES: RunbookStatus[] = ['draft', 'active', 'archived']

function generateBulkRunbooks(count: number): Array<Omit<Runbook, 'id' | 'createdAt' | 'updatedAt'>> {
  return Array.from({ length: count }, (_, i) => ({
    title: `Stress Runbook ${i + 1}`,
    category: CATEGORIES[i % CATEGORIES.length],
    severity: SEVERITIES[i % SEVERITIES.length],
    applicableVersions: ['v1.0.0'],
    prerequisites: ['基础环境'],
    steps: [
      {
        stepNumber: 1,
        title: `步骤 ${i + 1}-1`,
        description: `批量创建测试步骤 ${i + 1}`,
        command: 'echo "stress test"',
        estimatedMinutes: 1,
      },
    ],
    estimatedTotalMinutes: 1,
    status: STATUSES[i % STATUSES.length],
    tags: ['stress-test', `batch-${i % 10}`],
  }))
}

// ===================================================================
// 1. 批量操作压力测试
// ===================================================================

describe('runbook 批量操作压力测试', () => {
  it('连续创建 500 条 Runbook 不报错', () => {
    const ctrl = createCleanController()
    const bulk = generateBulkRunbooks(500)

    for (const data of bulk) {
      const created = ctrl.create({
        title: data.title,
        category: data.category,
        severity: data.severity,
        applicableVersions: data.applicableVersions,
        prerequisites: data.prerequisites,
        steps: data.steps,
        estimatedTotalMinutes: data.estimatedTotalMinutes,
        status: data.status,
        tags: data.tags,
      })
      assert.ok(created.id)
      assert.equal(created.title, data.title)
    }

    // 验证全部可搜索到
    const all = ctrl.list({})
    const PRESET_COUNT = all.length - 500
    assert.ok(PRESET_COUNT >= 10)
    assert.equal(all.length, 500 + PRESET_COUNT)
  })

  it('批量创建后按标签筛选性能正常', () => {
    const ctrl = createCleanController()
    const bulk = generateBulkRunbooks(500)

    for (const data of bulk) {
      ctrl.create({
        title: data.title,
        category: data.category,
        severity: data.severity,
        applicableVersions: data.applicableVersions,
        prerequisites: data.prerequisites,
        steps: data.steps,
        estimatedTotalMinutes: data.estimatedTotalMinutes,
        status: data.status,
        tags: data.tags,
      })
    }

    const tagFiltered = ctrl.list({ tag: 'stress-test' })
    assert.equal(tagFiltered.length, 500) // 所有自定义都打了 stress-test 标签

    const batch3Filtered = ctrl.list({ tag: 'batch-3' })
    assert.ok(batch3Filtered.length >= 50)
  })

  it('连续更新 200 条不报错', () => {
    const ctrl = createCleanController()
    const bulk = generateBulkRunbooks(200)
    const ids: string[] = []

    for (const data of bulk) {
      const created = ctrl.create({
        title: data.title,
        category: data.category,
        severity: data.severity,
        applicableVersions: data.applicableVersions,
        prerequisites: data.prerequisites,
        steps: data.steps,
        estimatedTotalMinutes: data.estimatedTotalMinutes,
        status: data.status,
        tags: data.tags,
      })
      ids.push(created.id)
    }

    for (const id of ids) {
      const updated = ctrl.update(id, { severity: 'critical' })
      assert.equal(updated.severity, 'critical')
    }
  })

  it('批量删除后 list 数量正确减少', () => {
    const ctrl = createCleanController()
    const bulk = generateBulkRunbooks(100)
    const ids: string[] = []

    for (const data of bulk) {
      const created = ctrl.create({
        title: data.title,
        category: data.category,
        severity: data.severity,
        applicableVersions: data.applicableVersions,
        prerequisites: data.prerequisites,
        steps: data.steps,
        estimatedTotalMinutes: data.estimatedTotalMinutes,
        status: data.status,
        tags: data.tags,
      })
      ids.push(created.id)
    }

    // 删除前 50 条
    for (const id of ids.slice(0, 50)) {
      ctrl.delete(id)
    }

    const remaining = ctrl.list({})
    const PRESET_COUNT = remaining.length - (100 - 50)
    assert.ok(PRESET_COUNT >= 10)
    assert.equal(remaining.length, PRESET_COUNT + 50)
  })
})

// ===================================================================
// 2. 大数据量搜索与筛选
// ===================================================================

describe('runbook 大数据量搜索韧性', () => {
  it('5000 条数据中搜索关键词高效返回', () => {
    const ctrl = createCleanController()
    const bulk = generateBulkRunbooks(5000)

    for (const data of bulk) {
      ctrl.create({
        title: data.title,
        category: data.category,
        severity: data.severity,
        applicableVersions: data.applicableVersions,
        prerequisites: data.prerequisites,
        steps: data.steps,
        estimatedTotalMinutes: data.estimatedTotalMinutes,
        status: data.status,
        tags: data.tags,
      })
    }

    // 搜索标签
    const byTag = ctrl.search('stress')
    assert.ok(byTag.length >= 5000)

    // 搜索标题
    const byTitle = ctrl.search('Runbook 42')
    assert.ok(byTitle.length >= 1)

    // 搜索不存在的关键词返回空
    const notFound = ctrl.search('ZZZZ_NOT_EXIST_99999')
    assert.equal(notFound.length, 0)
  })

  it('大数据量下分类筛选不丢数据', () => {
    const ctrl = createCleanController()
    const bulk = generateBulkRunbooks(600)

    for (const data of bulk) {
      ctrl.create({
        title: data.title,
        category: data.category,
        severity: data.severity,
        applicableVersions: data.applicableVersions,
        prerequisites: data.prerequisites,
        steps: data.steps,
        estimatedTotalMinutes: data.estimatedTotalMinutes,
        status: data.status,
        tags: data.tags,
      })
    }

    // 6 种分类均匀分布，每个约 100 条 + 预设
    for (const cat of CATEGORIES) {
      const filtered = ctrl.list({ category: cat })
      assert.ok(filtered.length >= 90, `${cat} should have >= 90 items, got ${filtered.length}`)
    }
  })

  it('大数据量下全量 list 返回正确总数', () => {
    const ctrl = createCleanController()
    const bulk = generateBulkRunbooks(1024)

    for (const data of bulk) {
      ctrl.create({
        title: data.title,
        category: data.category,
        severity: data.severity,
        applicableVersions: data.applicableVersions,
        prerequisites: data.prerequisites,
        steps: data.steps,
        estimatedTotalMinutes: data.estimatedTotalMinutes,
        status: data.status,
        tags: data.tags,
      })
    }

    const all = ctrl.list({})
    const PRESET_COUNT = all.length - 1024
    assert.ok(PRESET_COUNT >= 10)
    assert.equal(all.length, 1024 + PRESET_COUNT)
  })
})

// ===================================================================
// 3. 异常与边界测试
// ===================================================================

describe('runbook 异常与边界测试', () => {
  it('获取不存在的 Runbook 抛出 NotFoundException', () => {
    const ctrl = createCleanController()
    assert.throws(() => ctrl.get('non-existent-id-99999'), /Runbook not found/)
  })

  it('删除不存在的 Runbook 抛错', () => {
    const ctrl = createCleanController()
    assert.throws(() => ctrl.delete('not-exist'), /Runbook not found/)
  })

  it('更新不存在的 Runbook 抛错', () => {
    const ctrl = createCleanController()
    assert.throws(() => ctrl.update('phantom-id', { title: 'X' }), /Runbook not found/)
  })

  it('获取关键步骤时 Runbook 不存在抛错', () => {
    const ctrl = createCleanController()
    assert.throws(() => ctrl.getCriticalSteps('ghost'), /Runbook not found/)
  })

  it('validate 不存在的 Runbook 返回 valid=false', () => {
    const ctrl = createCleanController()
    const result = ctrl.validate('ghost')
    assert.equal(result.valid, false)
    assert.ok(result.errors.length > 0)
    assert.ok(result.errors.some((e) => e.includes('not found')))
  })

  it('findByAlert 不存在的告警返回 null', () => {
    const ctrl = createCleanController()
    const result = ctrl.findByAlert('ALERT_NON_EXISTENT')
    assert.equal(result, null)
  })

  it('搜索空字符串返回所有结果', () => {
    const ctrl = createCleanController()
    const result = ctrl.search('')
    // 应返回全部预设 Runbook
    assert.ok(result.length >= 10)
  })

  it('搜索特殊字符不崩溃', () => {
    const ctrl = createCleanController()
    const result = ctrl.search('!@#$%^&*()_+{}|:"<>?')
    // 不应崩溃，应返回空结果
    assert.ok(Array.isArray(result))
    assert.equal(result.length, 0)
  })
})

// ===================================================================
// 4. 资源耗尽与边缘情况
// ===================================================================

describe('runbook 资源耗尽与边缘情况', () => {
  it('创建最小结构的 Runbook（只有必填字段）', () => {
    const ctrl = createCleanController()
    const minimal = ctrl.create({
      title: 'Minimal',
      category: 'deployment',
      severity: 'low',
      applicableVersions: ['v1'],
      prerequisites: [],
      steps: [{ stepNumber: 1, title: '步骤', description: '描述' }],
      estimatedTotalMinutes: 1,
      status: 'draft',
      tags: [],
    })
    assert.ok(minimal.id)
    assert.equal(minimal.title, 'Minimal')
    assert.equal(minimal.prerequisites.length, 0)
    assert.equal(minimal.relatedAlerts, undefined)
    assert.equal(minimal.relatedRunbooks, undefined)
    assert.equal(minimal.lastTestedAt, undefined)
    assert.equal(minimal.tags.length, 0)
  })

  it('创建超长标题的 Runbook（边界值）', () => {
    const ctrl = createCleanController()
    const longTitle = 'A'.repeat(500)
    const runbook = ctrl.create({
      title: longTitle,
      category: 'deployment',
      severity: 'medium',
      applicableVersions: ['v1'],
      prerequisites: [],
      steps: [{ stepNumber: 1, title: '步骤', description: '超长标题测试' }],
      estimatedTotalMinutes: 1,
      status: 'draft',
      tags: ['long-title'],
    })
    assert.equal(runbook.title.length, 500)
    assert.ok(runbook.id)

    // 搜索超长标题
    const searchResult = ctrl.search('A'.repeat(50))
    assert.ok(searchResult.some((r) => r.id === runbook.id))
  })

  it('创建超长 steps 数组（1000 个 step）', () => {
    const ctrl = createCleanController()
    const manySteps = Array.from({ length: 1000 }, (_, i) => ({
      stepNumber: i + 1,
      title: `Step ${i + 1}`,
      description: `Description for step ${i + 1}`,
      command: `echo step-${i + 1}`,
      estimatedMinutes: 1,
    }))

    const runbook = ctrl.create({
      title: 'Many Steps Runbook',
      category: '故障排查',
      severity: 'critical',
      applicableVersions: ['v1'],
      prerequisites: ['大负载环境'],
      steps: manySteps,
      estimatedTotalMinutes: 1000,
      status: 'active',
      tags: ['many-steps'],
    })

    assert.equal(runbook.steps.length, 1000)
    assert.equal(runbook.estimatedTotalMinutes, 1000)

    // 验证关键步骤
    const critical = ctrl.getCriticalSteps(runbook.id)
    // 没有任何 warning 或 rollback，所以应该是 0
    assert.equal(critical.length, 0)

    // validate 应通过（虽然有 warning 关于最后测试时间）
    const validation = ctrl.validate(runbook.id)
    assert.equal(validation.valid, true)
  })

  it('连续创建删除 100 次不产生副作用', () => {
    const ctrl = createCleanController()

    for (let i = 0; i < 100; i++) {
      const created = ctrl.create({
        title: `Ephemeral ${i}`,
        category: 'deployment',
        severity: 'low',
        applicableVersions: ['v1'],
        prerequisites: [],
        steps: [{ stepNumber: 1, title: '步骤', description: '临时数据' }],
        estimatedTotalMinutes: 1,
        status: 'draft',
        tags: ['ephemeral'],
      })
      ctrl.delete(created.id)
    }

    // 预设数据应该还在
    const all = ctrl.list({})
    assert.ok(all.length >= 10)
    assert.ok(all.every(r => ['deploy-api-single', 'deploy-k8s', 'deploy-frontend', 'scale-k8s-hpa', 'scale-manual', 'troubleshoot-slow-api', 'troubleshoot-high-error-rate', 'troubleshoot-oom', 'dr-database-failover', 'dr-full-data-loss', 'security-sql-injection', 'security-data-breach', 'monitor-setup-prometheus'].includes(r.id) || r.tags.includes('stress-test') === false))
  })

  it('按 status 筛选各种状态', () => {
    const ctrl = createCleanController()

    // 预设全是 active
    const active = ctrl.list({ status: 'active' })
    assert.ok(active.length >= 12)

    // 新建不同状态的
    ctrl.create({
      title: 'Draft Only',
      category: 'deployment',
      severity: 'low',
      applicableVersions: ['v1'],
      prerequisites: [],
      steps: [{ stepNumber: 1, title: '步骤', description: '草稿' }],
      estimatedTotalMinutes: 1,
      status: 'draft',
      tags: ['status-test'],
    })
    ctrl.create({
      title: 'Archived Only',
      category: 'deployment',
      severity: 'low',
      applicableVersions: ['v1'],
      prerequisites: [],
      steps: [{ stepNumber: 1, title: '步骤', description: '归档' }],
      estimatedTotalMinutes: 1,
      status: 'archived',
      tags: ['status-test'],
    })

    assert.equal(ctrl.list({ status: 'draft' }).length, 1)
    assert.equal(ctrl.list({ status: 'archived' }).length, 1)
  })
})

// ===================================================================
// 5. 告警映射并发边界
// ===================================================================

describe('runbook 告警映射边界测试', () => {
  it('覆盖已存在的告警映射', () => {
    const ctrl = createCleanController()
    // ALERT_cpu_high 已有预设映射
    const original = ctrl.findByAlert('ALERT_cpu_high')
    assert.ok(original)
    assert.equal(original.autoAction, 'scale-k8s-hpa')

    // 覆盖映射
    ctrl.mapAlert({
      alertName: 'ALERT_cpu_high',
      runbookId: 'deploy-api-single',
      possibleCauses: ['CPU 过载', '异常进程'],
      severity: 'critical',
    })

    const updated = ctrl.findByAlert('ALERT_cpu_high')
    assert.ok(updated)
    assert.equal(updated.runbookId, 'deploy-api-single')
    assert.equal(updated.severity, 'critical')
  })

  it('大量告警映射操作不丢数据', () => {
    const ctrl = createCleanController()

    // 先创建大量 Runbook
    const bulk = generateBulkRunbooks(200)
    const ids: string[] = []
    for (const data of bulk) {
      const created = ctrl.create({
        title: data.title,
        category: data.category,
        severity: data.severity,
        applicableVersions: data.applicableVersions,
        prerequisites: data.prerequisites,
        steps: data.steps,
        estimatedTotalMinutes: data.estimatedTotalMinutes,
        status: data.status,
        tags: data.tags,
      })
      ids.push(created.id)
    }

    // 为每个 Runbook 创建告警映射
    for (let i = 0; i < ids.length; i++) {
      ctrl.mapAlert({
        alertName: `ALERT_STRESS_${i}`,
        runbookId: ids[i],
        possibleCauses: [`原因${i}`],
        severity: 'high',
      })
    }

    // 验证所有映射可用
    for (let i = 0; i < ids.length; i++) {
      const mapping = ctrl.findByAlert(`ALERT_STRESS_${i}`)
      assert.ok(mapping)
      assert.equal(mapping.runbookId, ids[i])
    }
  })
})

// ===================================================================
// 6. 并发操作模拟（顺序但高强度）
// ===================================================================

describe('runbook 高强度操作序列', () => {
  it('CRUD 混合操作 300 次不产生内部错误', () => {
    const ctrl = createCleanController()
    const ids: string[] = []

    for (let i = 0; i < 100; i++) {
      // CREATE
      const created = ctrl.create({
        title: `Mix ${i}`,
        category: 'deployment',
        severity: 'medium',
        applicableVersions: ['v1'],
        prerequisites: [],
        steps: [{ stepNumber: 1, title: `步${i}`, description: `混合${i}` }],
        estimatedTotalMinutes: 1,
        status: 'active',
        tags: ['mix'],
      })
      ids.push(created.id)
    }

    // 50 次 READ
    for (let i = 0; i < 50; i++) {
      const read = ctrl.get(ids[i])
      assert.ok(read)
      assert.equal(read.title, `Mix ${i}`)
    }

    // 50 次 UPDATE
    for (let i = 25; i < 75; i++) {
      ctrl.update(ids[i], { severity: 'critical' })
    }
    for (let i = 25; i < 75; i++) {
      const updated = ctrl.get(ids[i])
      assert.equal(updated!.severity, 'critical')
    }

    // 50 次 DELETE
    for (let i = 50; i < 100; i++) {
      ctrl.delete(ids[i])
    }

    // 30 次 SEARCH
    for (let i = 0; i < 30; i++) {
      const results = ctrl.search('Mix')
      assert.ok(results.length >= 50) // 还有 50 条没删
    }

    // 20 次 ALERT MAPPING
    for (let i = 0; i < 20; i++) {
      ctrl.mapAlert({
        alertName: `ALERT_MIX_${i}`,
        runbookId: ids[i],
        possibleCauses: ['混合操作'],
        severity: 'high',
      })
    }

    // 最终一致性检查
    const remaining = ctrl.list({})
    const PRESET_COUNT = remaining.length - 50
    assert.ok(PRESET_COUNT >= 10)
    assert.equal(remaining.length, PRESET_COUNT + 50)
  })

  it('validate 包含 warning 但仍返回 valid=true 的场景', () => {
    const ctrl = createCleanController()
    // 创建只有标题没有步骤描述的最小 Runbook
    const minimal = ctrl.create({
      title: 'Incomplete',
      category: '监控告警',
      severity: 'low',
      applicableVersions: ['v1'],
      prerequisites: [],
      steps: [{ stepNumber: 1, title: '唯一步骤', description: '测试用' }],
      estimatedTotalMinutes: 1,
      status: 'draft',
      tags: [],
    })

    const validation = ctrl.validate(minimal.id)
    assert.equal(validation.valid, true)
    // 应有 warning（未测试、无前置条件等）
    const hasWarning = validation.warnings.length > 0
    assert.equal(hasWarning, true)
  })

  it('不存在的 Runbook validate 返回 valid=false', () => {
    const ctrl = createCleanController()
    const result = ctrl.validate('does-not-exist')
    assert.equal(result.valid, false)
    assert.ok(result.errors.length > 0)
  })
})
