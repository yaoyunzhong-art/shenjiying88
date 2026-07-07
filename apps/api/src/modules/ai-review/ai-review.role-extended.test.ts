import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * 🐜 自动: [ai-review] [C] 角色扩展测试 - 前置数据场景
 *
 * 设计思路:
 *   ai-review 模块的 role.test.ts 验证了"所有角色不可访问骨架端点 (submitReview 等)"，
 *   但 controller 中 getReviewHistory / getReviewSummary / createReviewConfig / getReviewConfig
 *   等端点已有内存存储实现。本扩展测试：
 *   
 *   1. 前置注入模拟数据，让已实现端点返回真实数据
 *   2. 8 角色视角验证功能可用性
 *   3. 验证配置 CRUD 完整生命周期（create/read/update/delete）
 *   4. 验证历史查询、摘要统计、分页等数据视图
 *   5. 边界：空仓库、分页超界、时间窗口
 *
 * 角色:
 *   👔店长 🛒前台 👥HR 🔧安监 🎮导玩员 🎯运行专员 🤝团建 📢营销
 *
 * ⚠️ injectReview 实现将 tenantId 设为 review.request.repository,
 *    因此测试查询时 tenantId 参数需传仓库名。
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import { AIReviewController } from './ai-review.controller'
import { AIReviewService } from './ai-review.service'
import type { ReviewResponse } from './ai-review.entity'

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

// ── 测试用仓库 / 租户 ID ──
// injectReview 使用 repository 作为 tenantId，所以 tenantId=repoName
const REPOS = {
  storeA: 'store-a/app',
  storeB: 'store-b/pos',
  hq: 'hq/hr',
  mkt: 'mkt/promo',
} as const

function createController(): AIReviewController {
  return new AIReviewController(
    new AIReviewService(
      {} as any,
      {} as any,
      { snapshot: () => ({ utilizationPct: 0.15 }) } as any,
    ),
  )
}

function makeReviewResponse(
  overrides: Partial<ReviewResponse> & { id: string; repository: string },
): ReviewResponse {
  return {
    request: {
      repository: overrides.repository,
      pullRequestId: 1,
      title: `PR: ${overrides.id}`,
    },
    overallScore: 85,
    issues: [],
    strengths: ['Good'],
    summary: 'Solid PR.',
    needsApproverReview: false,
    latencyMs: 1500,
    cacheHit: false,
    status: 'completed',
    completedAt: new Date().toISOString(),
    ...overrides,
  }
}

// ────────────────────────────────────────────────────
// 👔 店长 - 门店 A 视角
// ────────────────────────────────────────────────────
describe(`${ROLES.StoreManager} ai-review 扩展测试`, () => {
  const tenant = REPOS.storeA
  let ctrl: AIReviewController

  beforeEach(() => {
    ctrl = createController()
    ctrl.injectReview('review-a-01', makeReviewResponse({
      id: 'review-a-01', repository: tenant,
      overallScore: 92, latencyMs: 1500,
    }))
    ctrl.injectReview('review-a-02', makeReviewResponse({
      id: 'review-a-02', repository: tenant,
      overallScore: 78, latencyMs: 2200,
      issues: [{ id: 'i1', category: 'correctness', severity: 'major', message: 'Null pointer risk', filePath: 'src/payment.ts', lineStart: 42 }],
    }))
    // 门店 B 数据（repository = store-b/pos -> tenantId="store-b/pos"）
    ctrl.injectReview('review-b-01', makeReviewResponse({
      id: 'review-b-01', repository: REPOS.storeB,
      overallScore: 65, latencyMs: 3000,
    }))
  })

  it('查看门店A评审历史', async () => {
    const history = await ctrl.getReviewHistory(tenant, { repository: tenant })
    assert.equal(history.length, 2)
  })

  it('按仓库过滤历史', async () => {
    const history = await ctrl.getReviewHistory(tenant, { repository: tenant })
    assert.equal(history.length, 2)
  })

  it('查看摘要统计', async () => {
    const summary = await ctrl.getReviewSummary({
      tenantId: tenant, repository: tenant,
      periodStart: '2025-01-01', periodEnd: '2027-01-01',
    })
    assert.equal(summary.totalReviews, 2)
    assert.equal(summary.averageScore, (92 + 78) / 2)
  })

  it('创建门店A配置', async () => {
    const config = await ctrl.createReviewConfig({ tenantId: tenant, repository: tenant, enabled: true })
    assert.equal(config.tenantId, tenant)
    assert.equal(config.repository, tenant)
  })

  it('获取已创建的配置', async () => {
    const c = await ctrl.createReviewConfig({ tenantId: tenant, repository: 'store-a/mobile', enabled: true })
    const got = await ctrl.getReviewConfig(c.id)
    assert.equal(got.repository, 'store-a/mobile')
  })

  it('更新配置并验证变更', async () => {
    const c = await ctrl.createReviewConfig({ tenantId: tenant, repository: tenant, enabled: true })
    const updated = await ctrl.updateReviewConfig(c.id, { enabled: false })
    assert.equal(updated.enabled, false)
  })

  it('删除配置后无法获取', async () => {
    const c = await ctrl.createReviewConfig({ tenantId: tenant, repository: 'store-a/tmp', enabled: true })
    await ctrl.deleteReviewConfig(c.id)
    await assert.rejects(() => ctrl.getReviewConfig(c.id), /not found/)
  })

  it('看不到门店B数据（仓库过滤）', async () => {
    const history = await ctrl.getReviewHistory(tenant, { repository: REPOS.storeB })
    assert.equal(history.length, 0)
  })

  it('健康检查正常', async () => {
    const health = await ctrl.healthcheck()
    assert.equal(health.ok, true)
  })
})

// ────────────────────────────────────────────────────
// 🛒 前台 - 分页场景
// ────────────────────────────────────────────────────
describe(`${ROLES.FrontDesk} ai-review 扩展测试`, () => {
  const tenant = REPOS.storeA
  let ctrl: AIReviewController

  beforeEach(() => {
    ctrl = createController()
    for (let i = 0; i < 5; i++) {
      ctrl.injectReview(`review-fd-${i}`, makeReviewResponse({
        id: `review-fd-${i}`, repository: tenant,
        overallScore: 80 + i, latencyMs: 1500 + i * 100,
      }))
    }
  })

  it('分页第1页（limit=2, offset=0）', async () => {
    const page = await ctrl.getReviewHistory(tenant, { repository: tenant, limit: 2, offset: 0 })
    assert.equal(page.length, 2)
  })

  it('分页第2页（limit=2, offset=2）', async () => {
    const page = await ctrl.getReviewHistory(tenant, { repository: tenant, limit: 2, offset: 2 })
    assert.equal(page.length, 2)
  })

  it('分页最后一页不足（limit=2, offset=4）', async () => {
    const page = await ctrl.getReviewHistory(tenant, { repository: tenant, limit: 2, offset: 4 })
    assert.equal(page.length, 1)
  })

  it('offset 超界返回空', async () => {
    const page = await ctrl.getReviewHistory(tenant, { repository: tenant, limit: 10, offset: 100 })
    assert.equal(page.length, 0)
  })

  it('摘要包含全部5条', async () => {
    const summary = await ctrl.getReviewSummary({ tenantId: tenant, repository: tenant, periodStart: '2025-01-01', periodEnd: '2027-01-01' })
    assert.equal(summary.totalReviews, 5)
  })

  it('空仓库参数在历史查询中按 tenantId 过滤', async () => {
    const all = await ctrl.getReviewHistory(tenant, {})
    assert.equal(all.length, 5)
  })
})

// ────────────────────────────────────────────────────
// 👥 HR - 总部视角
// ────────────────────────────────────────────────────
describe(`${ROLES.HR} ai-review 扩展测试`, () => {
  const tenant = REPOS.hq
  let ctrl: AIReviewController

  beforeEach(() => {
    ctrl = createController()
    ctrl.injectReview('review-hr-01', makeReviewResponse({ id: 'review-hr-01', repository: tenant, overallScore: 90 }))
    ctrl.injectReview('review-hr-02', makeReviewResponse({ id: 'review-hr-02', repository: tenant, overallScore: 72 }))
  })

  it('查看总部评审历史', async () => {
    const history = await ctrl.getReviewHistory(tenant, { repository: tenant })
    assert.equal(history.length, 2)
  })

  it('摘要仅含总部数据', async () => {
    const summary = await ctrl.getReviewSummary({ tenantId: tenant, repository: tenant, periodStart: '2025-01-01', periodEnd: '2027-01-01' })
    assert.equal(summary.totalReviews, 2)
  })

  it('创建总部配置', async () => {
    const config = await ctrl.createReviewConfig({ tenantId: tenant, repository: 'hq/employee-db', enabled: true })
    assert.equal(config.tenantId, tenant)
  })

  it('获取不存在的配置抛错', async () => {
    await assert.rejects(() => ctrl.getReviewConfig('config-nonexistent'), /not found/)
  })

  it('健康检查正常', async () => {
    assert.equal((await ctrl.healthcheck()).ok, true)
  })
})

// ────────────────────────────────────────────────────
// 🔧 安监 - 门店 B 视角（安全审计场景）
// ────────────────────────────────────────────────────
describe(`${ROLES.Security} ai-review 扩展测试`, () => {
  const tenant = REPOS.storeB
  let ctrl: AIReviewController

  beforeEach(() => {
    ctrl = createController()
    ctrl.injectReview('review-b-sec-01', makeReviewResponse({
      id: 'review-b-sec-01', repository: tenant,
      overallScore: 45, latencyMs: 4500,
      issues: [{ id: 'sec-1', category: 'security', severity: 'critical', message: 'Hardcoded credentials', filePath: 'config/auth.json' }],
    }))
    ctrl.injectReview('review-b-sec-02', makeReviewResponse({
      id: 'review-b-sec-02', repository: tenant,
      overallScore: 60, latencyMs: 3100,
    }))
  })

  it('查看门店B安全评审历史', async () => {
    const history = await ctrl.getReviewHistory(tenant, { repository: tenant })
    assert.equal(history.length, 2)
  })

  it('摘要统计', async () => {
    const summary = await ctrl.getReviewSummary({ tenantId: tenant, repository: tenant, periodStart: '2025-01-01', periodEnd: '2027-01-01' })
    assert.equal(summary.totalReviews, 2)
    assert.equal(summary.averageScore, (45 + 60) / 2)
  })

  it('看不到门店A数据', async () => {
    const history = await ctrl.getReviewHistory(tenant, { repository: REPOS.storeA })
    assert.equal(history.length, 0)
  })

  it('创建安全审计配置', async () => {
    const config = await ctrl.createReviewConfig({ tenantId: tenant, repository: 'store-b/audit', enabled: true })
    assert.equal(config.tenantId, tenant)
  })

  it('CRUD 完整生命周期', async () => {
    const created = await ctrl.createReviewConfig({ tenantId: tenant, repository: 'store-b/deploy', enabled: true, minSeverity: 'critical' })
    assert.equal(created.minSeverity, 'critical')
    const updated = await ctrl.updateReviewConfig(created.id, { enabled: false })
    assert.equal(updated.enabled, false)
    const got = await ctrl.getReviewConfig(created.id)
    assert.equal(got.enabled, false)
    await ctrl.deleteReviewConfig(created.id)
    await assert.rejects(() => ctrl.getReviewConfig(created.id), /not found/)
  })

  it('时间窗口超出范围返回0', async () => {
    const summary = await ctrl.getReviewSummary({ tenantId: tenant, repository: tenant, periodStart: '2020-01-01', periodEnd: '2020-12-31' })
    assert.equal(summary.totalReviews, 0)
  })
})

// ────────────────────────────────────────────────────
// 🎮 导玩员 - 门店 A 视角
// ────────────────────────────────────────────────────
describe(`${ROLES.Guide} ai-review 扩展测试`, () => {
  const tenant = REPOS.storeA
  let ctrl: AIReviewController

  beforeEach(() => {
    ctrl = createController()
    ctrl.injectReview('review-game-01', makeReviewResponse({ id: 'review-game-01', repository: tenant, overallScore: 88 }))
    ctrl.injectReview('review-game-02', makeReviewResponse({ id: 'review-game-02', repository: tenant, overallScore: 70 }))
  })

  it('查看门店A评审历史', async () => {
    const history = await ctrl.getReviewHistory(tenant, { repository: tenant })
    assert.equal(history.length, 2)
  })

  it('摘要统计', async () => {
    const summary = await ctrl.getReviewSummary({ tenantId: tenant, repository: tenant, periodStart: '2025-01-01', periodEnd: '2027-01-01' })
    assert.equal(summary.totalReviews, 2)
  })

  it('获取不存在的评审结果抛错', async () => {
    await assert.rejects(() => ctrl.getReviewResult('review-nonexistent'), /not found/)
  })

  it('健康检查正常', async () => {
    assert.equal((await ctrl.healthcheck()).ok, true)
  })
})

// ────────────────────────────────────────────────────
// 🎯 运行专员 - 门店B 视角（运维大数据场景）
// ────────────────────────────────────────────────────
describe(`${ROLES.Operations} ai-review 扩展测试`, () => {
  const tenant = REPOS.storeB
  let ctrl: AIReviewController

  beforeEach(() => {
    ctrl = createController()
    const scores = [55, 63, 72, 81, 90, 47, 68, 74]
    scores.forEach((s, i) => {
      ctrl.injectReview(`review-ops-${i}`, makeReviewResponse({
        id: `review-ops-${i}`, repository: tenant,
        overallScore: s, latencyMs: 2000 + i * 50,
      }))
    })
  })

  it('查看全部8条运维评审', async () => {
    const history = await ctrl.getReviewHistory(tenant, { repository: tenant })
    assert.equal(history.length, 8)
  })

  it('摘要平均值正确', async () => {
    const summary = await ctrl.getReviewSummary({ tenantId: tenant, repository: tenant, periodStart: '2025-01-01', periodEnd: '2027-01-01' })
    assert.equal(summary.totalReviews, 8)
    assert.equal(summary.averageScore, (55 + 63 + 72 + 81 + 90 + 47 + 68 + 74) / 8)
  })

  it('分页每页3条', async () => {
    const p1 = await ctrl.getReviewHistory(tenant, { repository: tenant, limit: 3, offset: 0 })
    assert.equal(p1.length, 3)
    const p2 = await ctrl.getReviewHistory(tenant, { repository: tenant, limit: 3, offset: 3 })
    assert.equal(p2.length, 3)
    const p3 = await ctrl.getReviewHistory(tenant, { repository: tenant, limit: 3, offset: 6 })
    assert.equal(p3.length, 2)
  })

  it('创建带高级选项的配置', async () => {
    const config = await ctrl.createReviewConfig({
      tenantId: tenant, repository: 'store-b/deploy',
      enabled: true,
      triggerOn: { branches: ['main', 'release/*'], filePatterns: ['**/*.yml', '**/*.yaml'], labels: [] },
      minSeverity: 'critical',
      categories: ['security', 'correctness'],
    })
    assert.equal(config.minSeverity, 'critical')
    assert.ok(config.triggerOn.branches!.includes('main'))
  })

  it('更新配置后验证', async () => {
    const c = await ctrl.createReviewConfig({ tenantId: tenant, repository: 'store-b/monitoring', enabled: true })
    await ctrl.updateReviewConfig(c.id, { enabled: false })
    const got = await ctrl.getReviewConfig(c.id)
    assert.equal(got.enabled, false)
  })

  it('时间窗口过滤 — 超出范围返回0', async () => {
    const summary = await ctrl.getReviewSummary({ tenantId: tenant, repository: tenant, periodStart: '2020-01-01', periodEnd: '2020-12-31' })
    assert.equal(summary.totalReviews, 0)
  })
})

// ────────────────────────────────────────────────────
// 🤝 团建 - 总部视角
// ────────────────────────────────────────────────────
describe(`${ROLES.Teambuilding} ai-review 扩展测试`, () => {
  const tenant = REPOS.hq
  let ctrl: AIReviewController

  beforeEach(() => {
    ctrl = createController()
    ctrl.injectReview('review-tb-01', makeReviewResponse({ id: 'review-tb-01', repository: tenant, overallScore: 91, latencyMs: 1900 }))
    ctrl.injectReview('review-tb-02', makeReviewResponse({ id: 'review-tb-02', repository: tenant, overallScore: 85, latencyMs: 2400 }))
  })

  it('查看团建相关评审历史', async () => {
    const history = await ctrl.getReviewHistory(tenant, { repository: tenant })
    assert.equal(history.length, 2)
  })

  it('摘要统计', async () => {
    const summary = await ctrl.getReviewSummary({ tenantId: tenant, repository: tenant, periodStart: '2025-01-01', periodEnd: '2027-01-01' })
    assert.equal(summary.totalReviews, 2)
    assert.equal(summary.averageScore, (91 + 85) / 2)
  })

  it('创建团建配置', async () => {
    const config = await ctrl.createReviewConfig({ tenantId: tenant, repository: 'hq/team-building-app', enabled: true })
    assert.equal(config.tenantId, tenant)
  })

  it('删除配置后确认', async () => {
    const config = await ctrl.createReviewConfig({ tenantId: tenant, repository: 'hq/events-archive', enabled: true })
    await ctrl.deleteReviewConfig(config.id)
    await assert.rejects(() => ctrl.getReviewConfig(config.id), /not found/)
  })
})

// ────────────────────────────────────────────────────
// 📢 营销 - 营销租户视角
// ────────────────────────────────────────────────────
describe(`${ROLES.Marketing} ai-review 扩展测试`, () => {
  const tenant = REPOS.mkt
  let ctrl: AIReviewController

  beforeEach(() => {
    ctrl = createController()
    ctrl.injectReview('review-mkt-01', makeReviewResponse({ id: 'review-mkt-01', repository: tenant, overallScore: 82, latencyMs: 1600 }))
    ctrl.injectReview('review-mkt-02', makeReviewResponse({ id: 'review-mkt-02', repository: tenant, overallScore: 76, latencyMs: 2100 }))
    ctrl.injectReview('review-mkt-03', makeReviewResponse({ id: 'review-mkt-03', repository: tenant, overallScore: 93, latencyMs: 1300 }))
  })

  it('查看全部3条营销评审', async () => {
    // injectReview 将 repository 作为 tenantId，3条数据 repository 均为 mkt/promo => tenantId=mkt/promo
    const history = await ctrl.getReviewHistory(tenant, {})
    assert.equal(history.length, 3)
  })

  it('按仓库过滤摘要', async () => {
    const summary = await ctrl.getReviewSummary({
      tenantId: tenant, repository: REPOS.mkt,
      periodStart: '2025-01-01', periodEnd: '2027-01-01',
    })
    assert.equal(summary.totalReviews, 3) // 全部3条均为 mkt/promo
    assert.equal(summary.averageScore, Math.round(((82 + 76 + 93) / 3) * 100) / 100) // (82+76+93)/3 = 83.67
  })

  it('创建营销配置', async () => {
    const config = await ctrl.createReviewConfig({ tenantId: tenant, repository: 'mkt/landing-page', enabled: true })
    assert.equal(config.tenantId, tenant)
  })

  it('看不到其他仓库数据', async () => {
    const history = await ctrl.getReviewHistory(tenant, { repository: 'hq/hr' })
    assert.equal(history.length, 0)
  })

  it('按仓库过滤不匹配返回0', async () => {
    const history = await ctrl.getReviewHistory(tenant, { repository: 'mkt/email-campaign' })
    assert.equal(history.length, 0)
  })
})

// ────────────────────────────────────────────────────
// 🔑 边界与隔离测试
// ────────────────────────────────────────────────────
describe('ai-review 边界与隔离测试', () => {
  it('不同仓库数据隔离', async () => {
    const ctrl = createController()
    ctrl.injectReview('r1', makeReviewResponse({ id: 'r1', repository: 'store-a/app', overallScore: 90 }))
    ctrl.injectReview('r2', makeReviewResponse({ id: 'r2', repository: 'store-b/pos', overallScore: 80 }))

    const a = await ctrl.getReviewHistory('store-a/app', { repository: 'store-a/app' })
    assert.equal(a.length, 1)
    assert.equal(a[0].repository, 'store-a/app')

    const b = await ctrl.getReviewHistory('store-b/pos', { repository: 'store-b/pos' })
    assert.equal(b.length, 1)
    assert.equal(b[0].repository, 'store-b/pos')
  })

  it('批量创建配置全部成功', async () => {
    const ctrl = createController()
    const repos = ['api', 'web', 'mobile', 'admin', 'worker']
    const configs = await Promise.all(
      repos.map(r => ctrl.createReviewConfig({ tenantId: 'batch-tenant', repository: `batch/${r}`, enabled: true }))
    )
    assert.equal(configs.length, 5)
    configs.forEach(c => assert.equal(c.tenantId, 'batch-tenant'))
  })
})
