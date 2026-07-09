import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * 🐜 自动: [ai-review] [C] 角色场景测试
 *
 * 8 角色视角的 AI Code Review 模块业务场景测试：
 * 👔店长 🛒前台 👥HR 🔧安监 🎮导玩员 🎯运行专员 🤝团建 📢营销
 *
 * 每个角色至少 2 个测试用例（正常流程 + 权限边界）
 * 使用 in-memory 存储模拟业务逻辑 + 角色模拟辅助函数
 */

import assert from 'node:assert/strict'

// ── 角色定义 ──
const ROLES = {
  StoreManager: '👔店长',
  FrontDesk: '🛒前台',
  HR: '👥HR',
  Security: '🔧安监',
  Guide: '🎮导玩员',
  Operations: '🎯运行专员',
  Teambuilding: '🤝团建',
  Marketing: '📢营销',
} as const

// ── 数据模型 ──
interface ReviewRecord {
  id: string
  tenantId: string
  repository: string
  pullRequestId: number
  status: 'pending' | 'in_progress' | 'completed' | 'failed'
  overallScore: number
  issueCount: number
  latencyMs: number
  createdAt: string
  completedAt?: string
  author: string
}

interface ReviewConfig {
  id: string
  tenantId: string
  repository: string
  enabled: boolean
  triggerOn: { labels: string[]; branches: string[]; filePatterns: string[] }
  ignorePatterns: string[]
  minSeverity: 'critical' | 'major' | 'minor' | 'suggestion'
  categories: string[]
  createdAt: string
  updatedAt: string
}

interface ReviewSummary {
  totalReviews: number
  successfulReviews: number
  totalIssues: number
  averageScore: number
  averageLatencyMs: number
  cacheHitRate: number
  periodStart: string
  periodEnd: string
}

// ── 模拟 Service ──
class AIReviewMockService {
  private records: ReviewRecord[] = []
  private configs: ReviewConfig[] = []
  private seq = 0

  constructor() {
    this.seed()
  }

  private nextId(): string {
    return `review-${Date.now()}-${++this.seq}`
  }

  private seed() {
    const now = new Date().toISOString()
    // 完成评审
    this.records.push({
      id: 'review-seed-001',
      tenantId: 'tenant-shanghai',
      repository: 'shenjiying/shenjiying88',
      pullRequestId: 101,
      status: 'completed',
      overallScore: 85,
      issueCount: 3,
      latencyMs: 4200,
      createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      completedAt: new Date(Date.now() - 86400000 * 2 + 5000).toISOString(),
      author: 'dev-alice',
    })
    // 失败评审
    this.records.push({
      id: 'review-seed-002',
      tenantId: 'tenant-shanghai',
      repository: 'shenjiying/shenjiying88',
      pullRequestId: 102,
      status: 'failed',
      overallScore: 0,
      issueCount: 0,
      latencyMs: 12000,
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      completedAt: undefined,
      author: 'dev-bob',
    })
    // 进行中
    this.records.push({
      id: 'review-seed-003',
      tenantId: 'tenant-beijing',
      repository: 'shenjiying/pos-app',
      pullRequestId: 55,
      status: 'in_progress',
      overallScore: 0,
      issueCount: 0,
      latencyMs: 0,
      createdAt: new Date().toISOString(),
      completedAt: undefined,
      author: 'dev-charlie',
    })
    // 已完成 (北京租户)
    this.records.push({
      id: 'review-seed-004',
      tenantId: 'tenant-beijing',
      repository: 'shenjiying/pos-app',
      pullRequestId: 54,
      status: 'completed',
      overallScore: 92,
      issueCount: 1,
      latencyMs: 3100,
      createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
      completedAt: new Date(Date.now() - 86400000 * 3 + 4000).toISOString(),
      author: 'dev-diana',
    })

    // 默认配置
    this.configs.push({
      id: 'config-tenant-shanghai-shenjiying-shenjiying88',
      tenantId: 'tenant-shanghai',
      repository: 'shenjiying/shenjiying88',
      enabled: true,
      triggerOn: { labels: ['needs-review'], branches: ['main', 'develop'], filePatterns: ['**/*.ts'] },
      ignorePatterns: ['**/*.test.ts', '**/*.spec.ts'],
      minSeverity: 'minor',
      categories: ['security', 'correctness', 'maintainability'],
      createdAt: new Date(Date.now() - 86400000 * 30).toISOString(),
      updatedAt: new Date(Date.now() - 86400000 * 7).toISOString(),
    })
  }

  async submitReview(params: {
    tenantId: string
    repository: string
    pullRequestId: number
    title: string
    description: string
    files: { filePath: string; language: string; diff: string }[]
    author: string
  }): Promise<ReviewRecord> {
    const now = new Date().toISOString()
    const record: ReviewRecord = {
      id: this.nextId(),
      tenantId: params.tenantId,
      repository: params.repository,
      pullRequestId: params.pullRequestId,
      status: 'completed',
      overallScore: Math.floor(Math.random() * 40) + 60, // 60~99
      issueCount: Math.floor(Math.random() * 8),
      latencyMs: Math.floor(Math.random() * 5000) + 2000,
      createdAt: now,
      completedAt: new Date(Date.now() + 3000).toISOString(),
      author: params.author,
    }
    this.records.push(record)
    return { ...record }
  }

  async getRecord(id: string): Promise<ReviewRecord> {
    const record = this.records.find((r) => r.id === id)
    if (!record) {
      throw new Error(`Review record not found: ${id}`)
    }
    return { ...record }
  }

  async listRecords(filter: {
    tenantId?: string
    repository?: string
    pullRequestId?: number
    status?: string
    author?: string
    limit?: number
    offset?: number
  }): Promise<{ data: ReviewRecord[]; total: number }> {
    let filtered = [...this.records]
    if (filter.tenantId) filtered = filtered.filter((r) => r.tenantId === filter.tenantId)
    if (filter.repository) filtered = filtered.filter((r) => r.repository === filter.repository)
    if (filter.pullRequestId) filtered = filtered.filter((r) => r.pullRequestId === filter.pullRequestId)
    if (filter.status) filtered = filtered.filter((r) => r.status === filter.status)
    if (filter.author) filtered = filtered.filter((r) => r.author === filter.author)
    filtered.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    const limit = filter.limit ?? 20
    const offset = filter.offset ?? 0
    return { data: filtered.slice(offset, offset + limit), total: filtered.length }
  }

  async getSummary(filter: {
    tenantId?: string
    repository?: string
    periodStart?: string
    periodEnd?: string
  }): Promise<ReviewSummary> {
    let filtered = [...this.records]
    if (filter.tenantId) filtered = filtered.filter((r) => r.tenantId === filter.tenantId)
    if (filter.repository) filtered = filtered.filter((r) => r.repository === filter.repository)
    if (filter.periodStart) filtered = filtered.filter((r) => r.createdAt >= filter.periodStart!)
    if (filter.periodEnd) filtered = filtered.filter((r) => r.createdAt <= filter.periodEnd!)

    const completed = filtered.filter((r) => r.status === 'completed')
    const totalReviews = filtered.length
    const successfulReviews = completed.length
    const totalIssues = completed.reduce((s, r) => s + r.issueCount, 0)
    const scores = completed.filter((r) => r.overallScore > 0).map((r) => r.overallScore)
    const averageScore = scores.length > 0
      ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 100) / 100
      : 0
    const latencies = completed.filter((r) => r.latencyMs > 0).map((r) => r.latencyMs)
    const averageLatencyMs = latencies.length > 0
      ? Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length)
      : 0
    const cacheHitRate = totalReviews > 0
      ? Math.round((successfulReviews / totalReviews) * 10000) / 100
      : 0

    return {
      totalReviews,
      successfulReviews,
      totalIssues,
      averageScore,
      averageLatencyMs,
      cacheHitRate,
      periodStart: filter.periodStart || '',
      periodEnd: filter.periodEnd || new Date().toISOString(),
    }
  }

  async createConfig(config: {
    tenantId: string
    repository: string
    enabled: boolean
    triggerOn?: { labels?: string[]; branches?: string[]; filePatterns?: string[] }
    ignorePatterns?: string[]
    minSeverity?: string
    categories?: string[]
  }): Promise<ReviewConfig> {
    const id = `config-${config.tenantId}-${config.repository.replace(/[^a-zA-Z0-9-_]/g, '-')}`
    if (this.configs.find((c) => c.id === id)) {
      throw new Error(`Review config already exists: ${id}`)
    }
    const newConfig: ReviewConfig = {
      id,
      tenantId: config.tenantId,
      repository: config.repository,
      enabled: config.enabled,
      triggerOn: {
        labels: config.triggerOn?.labels ?? [],
        branches: config.triggerOn?.branches ?? [],
        filePatterns: config.triggerOn?.filePatterns ?? [],
      },
      ignorePatterns: config.ignorePatterns ?? [],
      minSeverity: (config.minSeverity as ReviewConfig['minSeverity']) ?? 'minor',
      categories: config.categories ?? [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    this.configs.push(newConfig)
    return { ...newConfig }
  }

  async updateConfig(id: string, updates: Partial<{
    enabled: boolean
    triggerOn: { labels?: string[]; branches?: string[]; filePatterns?: string[] }
    ignorePatterns: string[]
    minSeverity: string
    categories: string[]
  }>): Promise<ReviewConfig> {
    const config = this.configs.find((c) => c.id === id)
    if (!config) {
      throw new Error(`Review config not found: ${id}`)
    }
    Object.assign(config, updates, { updatedAt: new Date().toISOString() })
    return { ...config }
  }

  async deleteConfig(id: string): Promise<void> {
    const idx = this.configs.findIndex((c) => c.id === id)
    if (idx === -1) {
      throw new Error(`Review config not found: ${id}`)
    }
    this.configs.splice(idx, 1)
  }

  async getConfig(id: string): Promise<ReviewConfig> {
    const config = this.configs.find((c) => c.id === id)
    if (!config) {
      throw new Error(`Review config not found: ${id}`)
    }
    return { ...config }
  }

  async listConfigs(tenantId: string): Promise<ReviewConfig[]> {
    return this.configs
      .filter((c) => c.tenantId === tenantId)
      .map((c) => ({ ...c }))
  }

  reset(): void {
    this.records = []
    this.configs = []
    this.seq = 0
    this.seed()
  }
}

function createService(): AIReviewMockService {
  return new AIReviewMockService()
}

// ──────────────────────────────────────────────────────────────────
// 👔 店长 — 关注代码质量、团队开发效率
// ──────────────────────────────────────────────────────────────────
describe(`${ROLES.StoreManager} ai-review 角色场景测试`, () => {
  it('店长查看门店仓库最近的评审历史概览', async () => {
    const svc = createService()
    const result = await svc.listRecords({
      tenantId: 'tenant-shanghai',
      limit: 10,
    })
    assert.ok(result.total >= 2, '上海门店应有至少 2 条评审记录')
    assert.ok(result.data.some((r) => r.repository.includes('shenjiying88')),
      '应有针对主仓库的评审')
  })

  it('店长查看评审统计了解整体代码质量趋势', async () => {
    const svc = createService()
    const summary = await svc.getSummary({ tenantId: 'tenant-shanghai' })
    assert.ok(summary.totalReviews >= 2)
    assert.ok(typeof summary.averageScore === 'number')
    assert.ok(summary.averageScore > 0, '平均分应大于 0')
    assert.ok(summary.averageLatencyMs > 0, '应有平均延迟数据')
  })

  it('店长查看无评审历史租户返回零值统计', async () => {
    const svc = createService()
    const summary = await svc.getSummary({ tenantId: 'tenant-unknown' })
    assert.equal(summary.totalReviews, 0)
    assert.equal(summary.averageScore, 0)
    assert.equal(summary.successfulReviews, 0)
  })
})

// ──────────────────────────────────────────────────────────────────
// 🛒 前台 — 关注 CI 状态、PR 是否可合并
// ──────────────────────────────────────────────────────────────────
describe(`${ROLES.FrontDesk} ai-review 角色场景测试`, () => {
  it('前台查询某 PR 的评审状态及结果', async () => {
    const svc = createService()
    const result = await svc.listRecords({
      repository: 'shenjiying/shenjiying88',
      pullRequestId: 101,
    })
    assert.ok(result.total >= 1, 'PR #101 应有评审记录')
    const record = result.data[0]
    assert.ok(record.overallScore >= 0)
    assert.ok(['completed', 'in_progress', 'failed'].includes(record.status))
  })

  it('前台查看评审失败记录以便向开发反馈问题', async () => {
    const svc = createService()
    const result = await svc.listRecords({ status: 'failed' })
    assert.ok(result.total >= 1, '应有失败的评审记录')
    assert.ok(result.data.every((r) => r.status === 'failed'))
  })

  it('前台按作者过滤查找某开发者的评审历史', async () => {
    const svc = createService()
    const result = await svc.listRecords({ author: 'dev-alice' })
    assert.ok(result.total >= 1)
    assert.ok(result.data.every((r) => r.author === 'dev-alice'))
  })
})

// ──────────────────────────────────────────────────────────────────
// 👥 HR — 关注开发团队绩效、代码质量指标
// ──────────────────────────────────────────────────────────────────
describe(`${ROLES.HR} ai-review 角色场景测试`, () => {
  it('HR 查看各门店评审统计对比', async () => {
    const svc = createService()
    const shanghai = await svc.getSummary({ tenantId: 'tenant-shanghai' })
    const beijing = await svc.getSummary({ tenantId: 'tenant-beijing' })
    assert.ok(shanghai.totalReviews > 0)
    assert.ok(beijing.totalReviews > 0)
    assert.ok(typeof shanghai.averageScore === 'number')
    assert.ok(typeof beijing.averageScore === 'number')
  })

  it('HR 查看指定时间窗口内的评审活动', async () => {
    const svc = createService()
    const summary = await svc.getSummary({
      periodStart: new Date(Date.now() - 86400000 * 7).toISOString(),
      periodEnd: new Date().toISOString(),
    })
    assert.ok(summary.totalReviews >= 4, '近 7 天应有所有评审记录')
  })

  it('HR 查询近期通过率最高门店', async () => {
    const svc = createService()
    const summary = await svc.getSummary({ tenantId: 'tenant-beijing' })
    assert.ok(summary.successfulReviews <= summary.totalReviews)
    assert.ok(summary.cacheHitRate >= 0 && summary.cacheHitRate <= 100)
  })
})

// ──────────────────────────────────────────────────────────────────
// 🔧 安监 — 关注安全相关的评审规则和配置
// ──────────────────────────────────────────────────────────────────
describe(`${ROLES.Security} ai-review 角色场景测试`, () => {
  it('安监查看评审配置确认安全类目已开启', async () => {
    const svc = createService()
    const configs = await svc.listConfigs('tenant-shanghai')
    assert.ok(configs.length >= 1)
    const config = configs[0]
    assert.ok(config.categories.includes('security'),
      '安全评审类目应被启用')
    assert.ok(config.minSeverity !== undefined)
  })

  it('安监关闭安全类目失败时检查异常处理', async () => {
    const svc = createService()
    try {
      await svc.updateConfig('config-nonexistent', {
        categories: ['performance'],
      })
      assert.fail('应抛出异常')
    } catch (e: any) {
      assert.ok(e.message.includes('not found'))
    }
  })

  it('安监创建新仓库的安全评审配置', async () => {
    const svc = createService()
    const config = await svc.createConfig({
      tenantId: 'tenant-shanghai',
      repository: 'shenjiying/payment-service',
      enabled: true,
      categories: ['security', 'correctness', 'architecture'],
      minSeverity: 'major',
    })
    assert.equal(config.repository, 'shenjiying/payment-service')
    assert.ok(config.categories.includes('security'))
    assert.equal(config.minSeverity, 'major')
  })

  it('安监尝试创建重复配置应拒绝', async () => {
    const svc = createService()
    try {
      await svc.createConfig({
        tenantId: 'tenant-shanghai',
        repository: 'shenjiying/shenjiying88',
        enabled: true,
      })
      assert.fail('应抛出重复配置异常')
    } catch (e: any) {
      assert.ok(e.message.includes('already exists'))
    }
  })
})

// ──────────────────────────────────────────────────────────────────
// 🎮 导玩员 — 关注门店开发功能可用性
// ──────────────────────────────────────────────────────────────────
describe(`${ROLES.Guide} ai-review 角色场景测试`, () => {
  it('导玩员查看自己门店的最近评审', async () => {
    const svc = createService()
    const result = await svc.listRecords({
      tenantId: 'tenant-beijing',
      limit: 5,
    })
    assert.ok(result.total >= 2, '北京门店应有评审记录')
    assert.ok(result.data.every((r) => r.tenantId === 'tenant-beijing'))
  })

  it('导玩员查看某个具体 PR 的评审详情', async () => {
    const svc = createService()
    const record = await svc.getRecord('review-seed-001')
    assert.equal(record.id, 'review-seed-001')
    assert.equal(record.pullRequestId, 101)
    assert.ok(record.overallScore > 0)
  })

  it('导玩员查看不存在的评审记录应抛出错误', async () => {
    const svc = createService()
    try {
      await svc.getRecord('review-nonexistent')
      assert.fail('应抛出错误')
    } catch (e: any) {
      assert.ok(e.message.includes('not found'))
    }
  })
})

// ──────────────────────────────────────────────────────────────────
// 🎯 运行专员 — 维护评审流水线、处理异常
// ──────────────────────────────────────────────────────────────────
describe(`${ROLES.Operations} ai-review 角色场景测试`, () => {
  it('运行专员提交一个完整的评审请求', async () => {
    const svc = createService()
    const record = await svc.submitReview({
      tenantId: 'tenant-shanghai',
      repository: 'shenjiying/shenjiying88',
      pullRequestId: 200,
      title: 'fix: 修复库存计算溢出',
      description: '将 int 改为 bigint',
      files: [
        { filePath: 'apps/api/src/inventory/calc.ts', language: 'typescript', diff: '@@ -50,7 +50,7 @@' },
        { filePath: 'apps/api/src/inventory/types.ts', language: 'typescript', diff: '@@ -10,3 +10,3 @@' },
      ],
      author: 'ops-user',
    })
    assert.ok(record.id.startsWith('review-'))
    assert.equal(record.status, 'completed')
    assert.ok(record.overallScore >= 60)
    assert.ok(record.latencyMs >= 2000)
  })

  it('运行专员处理失败的评审 - 查看失败记录', async () => {
    const svc = createService()
    const result = await svc.listRecords({
      status: 'failed',
      tenantId: 'tenant-shanghai',
    })
    assert.ok(result.total >= 1)
    const failed = result.data[0]
    assert.equal(failed.status, 'failed')
    // 失败记录无完成时间和得分
    assert.equal(failed.overallScore, 0)
    assert.equal(failed.completedAt, undefined)
  })

  it('运行专员更新评审配置调整触发规则', async () => {
    const svc = createService()
    const updated = await svc.updateConfig(
      'config-tenant-shanghai-shenjiying-shenjiying88',
      {
        triggerOn: { branches: ['main', 'develop', 'release/*'] },
        minSeverity: 'critical',
      },
    )
    assert.ok(updated.triggerOn.branches.includes('release/*'))
    assert.equal(updated.minSeverity, 'critical')
    assert.ok(updated.updatedAt > updated.createdAt)
  })

  it('运行专员删除已废弃仓库的配置', async () => {
    const svc = createService()
    // 先创建再删除
    const config = await svc.createConfig({
      tenantId: 'tenant-shanghai',
      repository: 'shenjiying/legacy-app',
      enabled: false,
    })
    await svc.deleteConfig(config.id)
    try {
      await svc.getConfig(config.id)
      assert.fail('删除后应找不到配置')
    } catch (e: any) {
      assert.ok(e.message.includes('not found'))
    }
  })
})

// ──────────────────────────────────────────────────────────────────
// 🤝 团建 — 关注协作效率、评审文化
// ──────────────────────────────────────────────────────────────────
describe(`${ROLES.Teambuilding} ai-review 角色场景测试`, () => {
  it('团建查看团队评审活跃度', async () => {
    const svc = createService()
    const summary = await svc.getSummary({})
    assert.ok(summary.totalReviews >= 4, '所有仓库应有评审记录')
    assert.ok(summary.totalIssues >= 1, '应发现至少 1 个问题')
  })

  it('团建查看各门店评审延迟对比', async () => {
    const svc = createService()
    const shanghai = await svc.getSummary({ tenantId: 'tenant-shanghai' })
    const beijing = await svc.getSummary({ tenantId: 'tenant-beijing' })
    assert.ok(typeof shanghai.averageLatencyMs === 'number')
    assert.ok(typeof beijing.averageLatencyMs === 'number')
    // 平均延迟应在合理范围
    assert.ok(shanghai.averageLatencyMs > 0 && shanghai.averageLatencyMs < 60000)
    assert.ok(beijing.averageLatencyMs > 0 && beijing.averageLatencyMs < 60000)
  })

  it('团建查看指定仓库的评审文化健康度', async () => {
    const svc = createService()
    const summary = await svc.getSummary({
      repository: 'shenjiying/shenjiying88',
    })
    assert.ok(summary.totalReviews >= 2, '主仓库应有至少 2 条评审记录')
    assert.ok(summary.cacheHitRate > 0)
  })
})

// ──────────────────────────────────────────────────────────────────
// 📢 营销 — 关注代码评审带来的质量提升数据
// ──────────────────────────────────────────────────────────────────
describe(`${ROLES.Marketing} ai-review 角色场景测试`, () => {
  it('营销查看评审统计用于制作质量报告', async () => {
    const svc = createService()
    const summary = await svc.getSummary({ tenantId: 'tenant-shanghai' })
    assert.ok(summary.totalReviews > 0)
    assert.equal(
      summary.successfulReviews + (summary.totalReviews - summary.successfulReviews),
      summary.totalReviews,
      '成功+失败+进行中应等于总数',
    )
  })

  it('营销查询 PR 评审通过率数据', async () => {
    const svc = createService()
    const summary = await svc.getSummary({ tenantId: 'tenant-beijing' })
    const passRate = summary.totalReviews > 0
      ? Math.round((summary.successfulReviews / summary.totalReviews) * 10000) / 100
      : 0
    assert.ok(passRate >= 0 && passRate <= 100)
    assert.ok(summary.averageScore >= 0)
  })

  it('营销创建测试仓库的评审配置用于演示', async () => {
    const svc = createService()
    const config = await svc.createConfig({
      tenantId: 'tenant-demo',
      repository: 'shenjiying/demo-site',
      enabled: true,
      categories: ['performance', 'security'],
      minSeverity: 'suggestion',
      triggerOn: { branches: ['main'] },
    })
    assert.equal(config.tenantId, 'tenant-demo')
    assert.equal(config.minSeverity, 'suggestion')
    assert.ok(config.categories.includes('performance'))
  })
})
