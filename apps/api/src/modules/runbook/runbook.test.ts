import { describe, it, expect, test, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest'
import { RunbookService } from './runbook.service'
import type { RunbookCategory, Severity, RunbookStatus } from './runbook.service'

describe('RunbookService', () => {
  let svc: RunbookService

  beforeEach(() => {
    svc = new RunbookService()
  })

  // ── 1. create → get 往返 ───────────────────────────────────────────────

  describe('create → get 往返', () => {
    it('create 后可以通过 get 获取', () => {
      const runbook = svc.create({
        title: '测试 Runbook',
        category: 'deployment',
        severity: 'high',
        applicableVersions: ['v1.0.0'],
        prerequisites: ['Docker 已安装'],
        steps: [
          {
            stepNumber: 1,
            title: '环境检查',
            description: '检查 Docker 版本',
            command: 'docker --version',
          },
        ],
        estimatedTotalMinutes: 10,
        status: 'draft',
        tags: ['测试'],
      })

      const found = svc.get(runbook.id)

      expect(found).not.toBeNull()
      expect(found!.id).toBe(runbook.id)
      expect(found!.title).toBe('测试 Runbook')
      expect(found!.category).toBe('deployment')
    })

    it('get 不存在的 Runbook 返回 null', () => {
      const found = svc.get('non-existent-id')
      expect(found).toBeNull()
    })

    it('create 自动生成 id 和时间戳', () => {
      const runbook = svc.create({
        title: '自动生成测试',
        category: '故障排查',
        severity: 'medium',
        applicableVersions: ['v1.0.0'],
        prerequisites: [],
        steps: [],
        estimatedTotalMinutes: 5,
        status: 'active',
        tags: [],
      })

      expect(runbook.id).toMatch(/^runbook-/)
      expect(runbook.createdAt).toBeInstanceOf(Date)
      expect(runbook.updatedAt).toBeInstanceOf(Date)
    })
  })

  // ── 2. list 分类筛选 ──────────────────────────────────────────────────

  describe('list 分类筛选', () => {
    it('list 返回所有预设 Runbook', () => {
      const all = svc.list()
      expect(all.length).toBeGreaterThan(0)
    })

    it('list 按 category 筛选', () => {
      const deployment = svc.list({ category: 'deployment' })
      for (const r of deployment) {
        expect(r.category).toBe('deployment')
      }
    })

    it('list 按 severity 筛选', () => {
      const critical = svc.list({ severity: 'critical' })
      for (const r of critical) {
        expect(r.severity).toBe('critical')
      }
    })

    it('list 按 status 筛选', () => {
      const active = svc.list({ status: 'active' })
      for (const r of active) {
        expect(r.status).toBe('active')
      }
    })

    it('list 按 tag 筛选', () => {
      const tagResults = svc.list({ tag: 'Docker' })
      for (const r of tagResults) {
        expect(r.tags).toContain('Docker')
      }
    })

    it('list 组合多个筛选条件', () => {
      const results = svc.list({
        category: 'deployment',
        severity: 'critical',
      })
      for (const r of results) {
        expect(r.category).toBe('deployment')
        expect(r.severity).toBe('critical')
      }
    })
  })

  // ── 3. update 更新字段 ────────────────────────────────────────────────

  describe('update 更新字段', () => {
    it('update 可以更新 title', () => {
      const runbook = svc.create({
        title: '原始标题',
        category: 'deployment',
        severity: 'high',
        applicableVersions: ['v1.0.0'],
        prerequisites: [],
        steps: [],
        estimatedTotalMinutes: 5,
        status: 'draft',
        tags: [],
      })

      const updated = svc.update(runbook.id, { title: '新标题' })

      expect(updated.title).toBe('新标题')
      expect(updated.id).toBe(runbook.id)
    })

    it('update 可以更新 status', () => {
      const runbook = svc.create({
        title: '状态测试',
        category: 'deployment',
        severity: 'high',
        applicableVersions: ['v1.0.0'],
        prerequisites: [],
        steps: [],
        estimatedTotalMinutes: 5,
        status: 'draft',
        tags: [],
      })

      const updated = svc.update(runbook.id, { status: 'active' })

      expect(updated.status).toBe('active')
    })

    it('update 可以更新 tags', () => {
      const runbook = svc.create({
        title: '标签测试',
        category: 'deployment',
        severity: 'high',
        applicableVersions: ['v1.0.0'],
        prerequisites: [],
        steps: [],
        estimatedTotalMinutes: 5,
        status: 'draft',
        tags: ['旧标签'],
      })

      const updated = svc.update(runbook.id, { tags: ['新标签', '另一个标签'] })

      expect(updated.tags).toEqual(['新标签', '另一个标签'])
    })

    it('update 不存在的 Runbook 抛出错误', () => {
      expect(() => {
        svc.update('non-existent-id', { title: '新标题' })
      }).toThrow('Runbook not found')
    })

    it('update 更新 updatedAt 时间戳', () => {
      const runbook = svc.create({
        title: '时间戳测试',
        category: 'deployment',
        severity: 'high',
        applicableVersions: ['v1.0.0'],
        prerequisites: [],
        steps: [],
        estimatedTotalMinutes: 5,
        status: 'draft',
        tags: [],
      })

      const originalUpdatedAt = runbook.updatedAt

      const updated = svc.update(runbook.id, { title: '修改' })

      expect(updated.updatedAt.getTime()).toBeGreaterThanOrEqual(
        originalUpdatedAt.getTime(),
      )
    })
  })

  // ── 4. delete 删除 ────────────────────────────────────────────────────

  describe('delete 删除', () => {
    it('delete 可以删除已创建的 Runbook', () => {
      const runbook = svc.create({
        title: '待删除',
        category: 'deployment',
        severity: 'high',
        applicableVersions: ['v1.0.0'],
        prerequisites: [],
        steps: [],
        estimatedTotalMinutes: 5,
        status: 'draft',
        tags: [],
      })

      svc.delete(runbook.id)

      expect(svc.get(runbook.id)).toBeNull()
    })

    it('delete 不存在的 Runbook 抛出错误', () => {
      expect(() => {
        svc.delete('non-existent-id')
      }).toThrow('Runbook not found')
    })

    it('delete 后 list 中不再包含该 Runbook', () => {
      const runbook = svc.create({
        title: '列表测试',
        category: 'deployment',
        severity: 'high',
        applicableVersions: ['v1.0.0'],
        prerequisites: [],
        steps: [],
        estimatedTotalMinutes: 5,
        status: 'draft',
        tags: [],
      })

      const allBefore = svc.list()
      expect(allBefore.some((r) => r.id === runbook.id)).toBe(true)

      svc.delete(runbook.id)

      const allAfter = svc.list()
      expect(allAfter.some((r) => r.id === runbook.id)).toBe(false)
    })
  })

  // ── 5. mapAlert → findByAlert 往返 ───────────────────────────────────

  describe('mapAlert → findByAlert 往返', () => {
    it('mapAlert 可以创建新的告警映射', () => {
      const runbook = svc.create({
        title: '告警映射测试',
        category: 'deployment',
        severity: 'high',
        applicableVersions: ['v1.0.0'],
        prerequisites: [],
        steps: [],
        estimatedTotalMinutes: 5,
        status: 'active',
        tags: [],
      })

      const mapping = svc.mapAlert(
        'ALERT_custom_test',
        runbook.id,
        ['原因1', '原因2'],
        'high',
        'auto-fix',
      )

      expect(mapping.alertName).toBe('ALERT_custom_test')
      expect(mapping.runbookId).toBe(runbook.id)
      expect(mapping.possibleCauses).toEqual(['原因1', '原因2'])
      expect(mapping.severity).toBe('high')
      expect(mapping.autoAction).toBe('auto-fix')
    })

    it('findByAlert 可以找到已映射的告警', () => {
      const runbook = svc.create({
        title: '查找告警测试',
        category: 'deployment',
        severity: 'high',
        applicableVersions: ['v1.0.0'],
        prerequisites: [],
        steps: [],
        estimatedTotalMinutes: 5,
        status: 'active',
        tags: [],
      })

      svc.mapAlert('ALERT_find_test', runbook.id, ['原因1'], 'critical')

      const found = svc.findByAlert('ALERT_find_test')

      expect(found).not.toBeNull()
      expect(found!.alertName).toBe('ALERT_find_test')
      expect(found!.runbookId).toBe(runbook.id)
    })

    it('findByAlert 找不到告警返回 null', () => {
      const found = svc.findByAlert('ALERT_non_existent')
      expect(found).toBeNull()
    })

    it('预设告警映射可以正常查找', () => {
      const found = svc.findByAlert('ALERT_cpu_high')
      expect(found).not.toBeNull()
      expect(found!.runbookId).toBe('troubleshoot-high-error-rate')
    })

    it('mapAlert 可以覆盖已有的映射', () => {
      const runbook1 = svc.create({
        title: '映射1',
        category: 'deployment',
        severity: 'high',
        applicableVersions: ['v1.0.0'],
        prerequisites: [],
        steps: [],
        estimatedTotalMinutes: 5,
        status: 'active',
        tags: [],
      })

      const runbook2 = svc.create({
        title: '映射2',
        category: 'deployment',
        severity: 'high',
        applicableVersions: ['v1.0.0'],
        prerequisites: [],
        steps: [],
        estimatedTotalMinutes: 5,
        status: 'active',
        tags: [],
      })

      svc.mapAlert('ALERT_override_test', runbook1.id, ['原因1'], 'low')
      svc.mapAlert('ALERT_override_test', runbook2.id, ['新原因'], 'high')

      const found = svc.findByAlert('ALERT_override_test')

      expect(found!.runbookId).toBe(runbook2.id)
      expect(found!.severity).toBe('high')
    })
  })

  // ── 6. generateExecutionReport 输出 Markdown ────────────────────────────

  describe('generateExecutionReport', () => {
    it('生成包含执行步骤的 Markdown 报告', () => {
      const runbook = svc.create({
        title: '报告生成测试',
        category: 'deployment',
        severity: 'high',
        applicableVersions: ['v1.0.0'],
        prerequisites: [],
        steps: [
          {
            stepNumber: 1,
            title: '步骤一',
            description: '执行第一步',
            command: 'echo step1',
          },
          {
            stepNumber: 2,
            title: '步骤二',
            description: '执行第二步',
            command: 'echo step2',
          },
        ],
        estimatedTotalMinutes: 10,
        status: 'active',
        tags: [],
      })

      const report = svc.generateExecutionReport(runbook.id, [
        {
          step: 1,
          startedAt: new Date('2024-06-20T10:00:00Z'),
          completedAt: new Date('2024-06-20T10:05:00Z'),
          success: true,
          output: 'step1 output',
        },
        {
          step: 2,
          startedAt: new Date('2024-06-20T10:05:00Z'),
          completedAt: new Date('2024-06-20T10:08:00Z'),
          success: false,
          error: 'step2 error',
        },
      ])

      expect(report).toContain('Runbook 执行报告')
      expect(report).toContain('报告生成测试')
      expect(report).toContain('步骤一')
      expect(report).toContain('步骤二')
      expect(report).toContain('✅ 成功')
      expect(report).toContain('❌ 失败')
      expect(report).toContain('step1 output')
      expect(report).toContain('step2 error')
    })

    it('报告包含执行摘要', () => {
      const runbook = svc.create({
        title: '摘要测试',
        category: 'deployment',
        severity: 'high',
        applicableVersions: ['v1.0.0'],
        prerequisites: [],
        steps: [
          {
            stepNumber: 1,
            title: '步骤一',
            description: '执行第一步',
          },
        ],
        estimatedTotalMinutes: 5,
        status: 'active',
        tags: [],
      })

      const report = svc.generateExecutionReport(runbook.id, [
        {
          step: 1,
          startedAt: new Date(),
          success: true,
        },
      ])

      expect(report).toContain('执行摘要')
      expect(report).toContain('成功')
      expect(report).toContain('失败')
    })

    it('对不存在的 Runbook 生成报告抛出错误', () => {
      expect(() => {
        svc.generateExecutionReport('non-existent-id', [])
      }).toThrow('Runbook not found')
    })
  })

  // ── 7. getCriticalSteps 返回关键步骤 ─────────────────────────────────

  describe('getCriticalSteps', () => {
    it('返回包含 rollbackCommand 的关键步骤', () => {
      const runbook = svc.create({
        title: '关键步骤测试',
        category: 'deployment',
        severity: 'high',
        applicableVersions: ['v1.0.0'],
        prerequisites: [],
        steps: [
          {
            stepNumber: 1,
            title: '普通步骤',
            description: '没有回滚命令',
          },
          {
            stepNumber: 2,
            title: '关键步骤',
            description: '有回滚命令',
            rollbackCommand: 'helm rollback',
          },
        ],
        estimatedTotalMinutes: 10,
        status: 'active',
        tags: [],
      })

      const critical = svc.getCriticalSteps(runbook.id)

      expect(critical.length).toBe(1)
      expect(critical[0].title).toBe('关键步骤')
    })

    it('返回包含 warningMessage 的关键步骤', () => {
      const runbook = svc.create({
        title: '警告步骤测试',
        category: 'deployment',
        severity: 'high',
        applicableVersions: ['v1.0.0'],
        prerequisites: [],
        steps: [
          {
            stepNumber: 1,
            title: '警告步骤',
            description: '有警告信息',
            warningMessage: '注意：此操作不可逆',
          },
        ],
        estimatedTotalMinutes: 5,
        status: 'active',
        tags: [],
      })

      const critical = svc.getCriticalSteps(runbook.id)

      expect(critical.length).toBe(1)
      expect(critical[0].warningMessage).toBe('注意：此操作不可逆')
    })

    it('预设 Runbook 有关键步骤', () => {
      const critical = svc.getCriticalSteps('deploy-api-single')

      expect(critical.length).toBeGreaterThan(0)
    })

    it('对不存在的 Runbook 获取关键步骤抛出错误', () => {
      expect(() => {
        svc.getCriticalSteps('non-existent-id')
      }).toThrow('Runbook not found')
    })
  })

  // ── 8. validate 验证问题 ───────────────────────────────────────────────

  describe('validate 验证问题', () => {
    it('有效 Runbook 通过验证', () => {
      const runbook = svc.create({
        title: '有效 Runbook',
        category: 'deployment',
        severity: 'high',
        applicableVersions: ['v1.0.0'],
        prerequisites: ['已安装 Docker'],
        steps: [
          {
            stepNumber: 1,
            title: '步骤1',
            description: '执行步骤1',
            command: 'echo test',
          },
        ],
        estimatedTotalMinutes: 5,
        status: 'active',
        tags: [],
      })

      const result = svc.validate(runbook.id)

      expect(result.valid).toBe(true)
      expect(result.errors.length).toBe(0)
    })

    it('缺少步骤的 Runbook 验证失败', () => {
      const runbook = svc.create({
        title: '无步骤 Runbook',
        category: 'deployment',
        severity: 'high',
        applicableVersions: ['v1.0.0'],
        prerequisites: [],
        steps: [],
        estimatedTotalMinutes: 0,
        status: 'draft',
        tags: [],
      })

      const result = svc.validate(runbook.id)

      expect(result.valid).toBe(false)
      expect(result.errors).toContain('必须包含至少一个步骤')
    })

    it('缺少标题的 Runbook 验证失败', () => {
      const runbook = svc.create({
        title: '',
        category: 'deployment',
        severity: 'high',
        applicableVersions: ['v1.0.0'],
        prerequisites: [],
        steps: [
          {
            stepNumber: 1,
            title: '步骤1',
            description: '描述',
          },
        ],
        estimatedTotalMinutes: 5,
        status: 'draft',
        tags: [],
      })

      const result = svc.validate(runbook.id)

      expect(result.valid).toBe(false)
      expect(result.errors).toContain('标题不能为空')
    })

    it('缺少前置条件的 Runbook 产生警告', () => {
      const runbook = svc.create({
        title: '无前置条件',
        category: 'deployment',
        severity: 'high',
        applicableVersions: ['v1.0.0'],
        prerequisites: [],
        steps: [
          {
            stepNumber: 1,
            title: '步骤1',
            description: '描述',
          },
        ],
        estimatedTotalMinutes: 5,
        status: 'draft',
        tags: [],
      })

      const result = svc.validate(runbook.id)

      expect(result.warnings).toContain('缺少前置条件说明')
    })

    it('未测试过的 Runbook 产生警告', () => {
      const runbook = svc.create({
        title: '未测试 Runbook',
        category: 'deployment',
        severity: 'high',
        applicableVersions: ['v1.0.0'],
        prerequisites: ['Docker'],
        steps: [
          {
            stepNumber: 1,
            title: '步骤1',
            description: '描述',
          },
        ],
        estimatedTotalMinutes: 5,
        status: 'draft',
        tags: [],
      })

      const result = svc.validate(runbook.id)

      expect(result.warnings).toContain('Runbook 尚未测试过')
    })

    it('步骤缺少描述产生警告', () => {
      const runbook = svc.create({
        title: '步骤描述测试',
        category: 'deployment',
        severity: 'high',
        applicableVersions: ['v1.0.0'],
        prerequisites: [],
        steps: [
          {
            stepNumber: 1,
            title: '步骤1',
            description: '',
          },
        ],
        estimatedTotalMinutes: 5,
        status: 'draft',
        tags: [],
      })

      const result = svc.validate(runbook.id)

      expect(result.warnings).toContain('步骤 1 缺少描述')
    })

    it('验证不存在的 Runbook 返回错误', () => {
      const result = svc.validate('non-existent-id')

      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Runbook not found: non-existent-id')
    })
  })

  // ── 9. search 关键词匹配 ───────────────────────────────────────────────

  describe('search 关键词匹配', () => {
    it('搜索标题关键词', () => {
      const results = svc.search('API')

      expect(results.length).toBeGreaterThan(0)
      expect(results.some((r) => r.title.includes('API'))).toBe(true)
    })

    it('搜索标签关键词', () => {
      const results = svc.search('Docker')

      expect(results.length).toBeGreaterThan(0)
      for (const r of results) {
        expect(
          r.title.includes('Docker') ||
            r.tags.some((t) => t.includes('Docker')),
        ).toBe(true)
      }
    })

    it('搜索步骤描述关键词', () => {
      const results = svc.search('MySQL')

      expect(results.length).toBeGreaterThan(0)
    })

    it('搜索前置条件关键词', () => {
      const results = svc.search('Ubuntu')

      expect(results.length).toBeGreaterThan(0)
    })

    it('搜索区分大小写', () => {
      const resultsLower = svc.search('api')
      const resultsUpper = svc.search('API')

      expect(resultsLower.length).toBe(resultsUpper.length)
    })

    it('搜索不存在的关键词返回空数组', () => {
      const results = svc.search('完全不存在的关键词xyz123')
      expect(results).toEqual([])
    })

    it('预设 Runbook 可被搜索到', () => {
      const results = svc.search('K8s')

      expect(results.length).toBeGreaterThan(0)
    })
  })

  // ── 10. list 按 severity/status/tag 筛选 ──────────────────────────────

  describe('list 按 severity/status/tag 筛选', () => {
    it('筛选 severity=critical', () => {
      const results = svc.list({ severity: 'critical' })

      for (const r of results) {
        expect(r.severity).toBe('critical')
      }
    })

    it('筛选 severity=high', () => {
      const results = svc.list({ severity: 'high' })

      for (const r of results) {
        expect(r.severity).toBe('high')
      }
    })

    it('筛选 status=active', () => {
      const results = svc.list({ status: 'active' })

      for (const r of results) {
        expect(r.status).toBe('active')
      }
    })

    it('筛选 status=draft', () => {
      const draft = svc.create({
        title: '草稿测试',
        category: 'deployment',
        severity: 'high',
        applicableVersions: ['v1.0.0'],
        prerequisites: [],
        steps: [],
        estimatedTotalMinutes: 5,
        status: 'draft',
        tags: [],
      })

      const results = svc.list({ status: 'draft' })

      expect(results.some((r) => r.id === draft.id)).toBe(true)
    })

    it('筛选 tag=部署', () => {
      const results = svc.list({ tag: '部署' })

      for (const r of results) {
        expect(r.tags).toContain('部署')
      }
    })

    it('筛选 tag=Kubernetes', () => {
      const results = svc.list({ tag: 'Kubernetes' })

      for (const r of results) {
        expect(r.tags).toContain('Kubernetes')
      }
    })

    it('组合筛选 severity + status', () => {
      const results = svc.list({
        severity: 'critical',
        status: 'active',
      })

      for (const r of results) {
        expect(r.severity).toBe('critical')
        expect(r.status).toBe('active')
      }
    })

    it('组合筛选 category + tag', () => {
      const results = svc.list({
        category: '故障排查',
        tag: 'API',
      })

      for (const r of results) {
        expect(r.category).toBe('故障排查')
        expect(r.tags).toContain('API')
      }
    })
  })
})
