import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * 🐜 自动: [e2e-auto-gen] [C] 角色扩展测试
 *
 * 4 个附加角色视角：
 * 🛒前台 — 关注前端集成测试快速验证
 * 🎯运行专员 — 关注 CI 流水线自动化与报告
 * 🔧安监 — 关注安全测试用例和防御能力
 * 📢营销 — 关注营销活动 API 批量测试
 *
 * 每个角色 3 个测试用例（正常 + 业务异常 + 边界）
 * 共 12+ 个独立测试用例
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import { E2EAutoGenController } from './e2e-auto-gen.controller'
import { E2EAutoGenService } from './e2e-auto-gen.service'
import { OpenAPIParserService } from './openapi-parser.service'
import { TestCaseGeneratorService, type GeneratedTestCase } from './test-case-generator.service'
import { AutoRunnerService } from './auto-runner.service'

// ── 角色定义 ──
const ROLES = {
  FrontDesk: '🛒前台',
  Operations: '🎯运行专员',
  Security: '🔧安监',
  Marketing: '📢营销',
} as const

// ── 辅助工厂 ──
function createController() {
  const parser = new OpenAPIParserService()
  const generator = new TestCaseGeneratorService()
  const runner = new AutoRunnerService()
  const service = new E2EAutoGenService(parser, generator, runner)
  return new E2EAutoGenController(service)
}

function createService() {
  const parser = new OpenAPIParserService()
  const generator = new TestCaseGeneratorService()
  const runner = new AutoRunnerService()
  return new E2EAutoGenService(parser, generator, runner)
}

// 生成一个包含完整路由的 API spec 字符串
function fullApiSpec(title = '门店综合 API'): string {
  return JSON.stringify({
    title,
    version: '1.0.0',
    routes: [
      { path: '/api/members', method: 'GET', parameters: [{ name: 'page', in: 'query', type: 'number', required: false }, { name: 'limit', in: 'query', type: 'number', required: false }], responses: [{ status: 200, description: '会员列表' }], tags: ['members'], requiresAuth: true },
      { path: '/api/members', method: 'POST', parameters: [{ name: 'name', in: 'body', type: 'string', required: true }, { name: 'phone', in: 'body', type: 'string', required: true }], responses: [{ status: 201, description: '创建成功' }, { status: 400, description: '参数错误' }], tags: ['members'], requiresAuth: true },
      { path: '/api/products', method: 'GET', parameters: [], responses: [{ status: 200, description: '商品列表' }], tags: ['products'], requiresAuth: true },
      { path: '/api/products', method: 'POST', parameters: [{ name: 'name', in: 'body', type: 'string', required: true }, { name: 'price', in: 'body', type: 'number', required: true }], responses: [{ status: 201, description: '创建成功' }], tags: ['products'], requiresAuth: true },
      { path: '/api/orders', method: 'POST', parameters: [{ name: 'items', in: 'body', type: 'array', required: true }], responses: [{ status: 201, description: '下单成功' }], tags: ['orders'], requiresAuth: true },
      { path: '/api/health', method: 'GET', parameters: [], responses: [{ status: 200, description: '健康状态' }], tags: ['ops'], requiresAuth: false },
    ],
  })
}

// ══════════════════════════════════════════════════════════════════════
// 🛒前台 — 前端集成测试快速验证
// ══════════════════════════════════════════════════════════════════════
describe(`${ROLES.FrontDesk} — 前端集成测试快速验证`, () => {
  it('前台从前端常用 API 描述快速生成测试（收银/会员/商品核心链路）', () => {
    const ctrl = createController()
    const res = ctrl.generate({
      spec: JSON.stringify({
        title: '前台收银 API',
        version: '1.0.0',
        routes: [
          { path: '/api/cashier/open', method: 'POST', parameters: [{ name: 'registerId', in: 'body', type: 'string', required: true }], responses: [{ status: 200, description: '开台成功' }], tags: ['cashier'], requiresAuth: true },
          { path: '/api/cashier/close', method: 'POST', parameters: [{ name: 'registerId', in: 'body', type: 'string', required: true }], responses: [{ status: 200, description: '关台成功' }], tags: ['cashier'], requiresAuth: true },
          { path: '/api/customers', method: 'GET', parameters: [{ name: 'keyword', in: 'query', type: 'string', required: false }], responses: [{ status: 200, description: '客户列表' }], tags: ['customers'], requiresAuth: true },
        ],
      }),
    })

    assert.equal(res.status, 'COMPLETED')
    assert.equal(res.files.length, 3)
    assert.ok(res.files.some(f => f.includes('cashier')))
    assert.ok(res.stats.totalTestCases >= 3, `应生成至少 3 个测试用例, 实际 ${res.stats.totalTestCases}`)
  })

  it('前台生成测试后确认文件路径可读（前端可引用路径进行验证）', () => {
    const ctrl = createController()
    const res = ctrl.generate({
      spec: fullApiSpec('前台验证 API'),
      outputDir: './frontend-tests/e2e',
    })

    assert.equal(res.status, 'COMPLETED')
    // 所有文件路径应以指定 outputDir 开头
    res.files.forEach(f => {
      assert.ok(f.startsWith('./frontend-tests/e2e'), `路径应以 frontend-tests/e2e 开头: ${f}`)
    })
    assert.ok(res.files.length > 0)
  })

  it('前台传空 routes 时应生成 0 个文件（边界：无 API 时行为正常）', () => {
    const ctrl = createController()
    const res = ctrl.generate({
      spec: JSON.stringify({ title: '空 API', version: '1.0.0', routes: [] }),
      outputDir: './empty-tests',
    })

    assert.equal(res.status, 'COMPLETED')
    assert.equal(res.files.length, 0)
    assert.equal(res.stats.totalFiles, 0)
    assert.equal(res.stats.totalTestCases, 0)
  })
})

// ══════════════════════════════════════════════════════════════════════
// 🎯运行专员 — CI 流水线自动化与报告
// ══════════════════════════════════════════════════════════════════════
describe(`${ROLES.Operations} — CI 流水线自动化与报告`, () => {
  it('运行专员创建配置后执行测试并获取通过/失败统计（完整 CI 流程）', async () => {
    // 创建配置
    const ctrl = createController()
    const config = ctrl.createConfig({
      projectName: '门店 CI 流水线',
      specSource: '/specs/ci-store.json',
      outputDir: './ci-tests',
      testFramework: 'vitest',
      enableE2E: true,
      baseUrl: 'https://api.ci.example.com',
    })
    assert.ok(config.id)

    // 直接验证 service 层的自动化报告能力（绕过 controller 直接测试 service）
    const service = createService()
    const runner = new AutoRunnerService()
    const generator = new TestCaseGeneratorService()
    const parser = new OpenAPIParserService()

    const table = parser.parseFromRoutes({
      title: 'CI 全量测试',
      version: '1.0.0',
      routes: [
        { path: '/api/health', method: 'GET', parameters: [], responses: [{ status: 200, description: 'OK' }], tags: ['ops'], requiresAuth: false },
        { path: '/api/users', method: 'GET', parameters: [], responses: [{ status: 200, description: '用户列表' }], tags: ['users'], requiresAuth: true },
      ],
    })

    const testCases = generator.generateBatch(table.routes)
    const { results, report } = await runner.run(testCases)

    assert.equal(report.totalCases, testCases.length)
    assert.ok(report.passed >= 0)
    assert.ok(report.failed >= 0)
    assert.ok(report.passRate >= 0 && report.passRate <= 1)
    assert.ok(report.durationMs > 0)
    assert.ok(report.byScenario.NORMAL, '应有 NORMAL 场景统计')
  })

  it('运行专员可以生成带所有参数类型的复杂 API 测试（运行态系统全面性检查）', () => {
    const ctrl = createController()
    const spec = JSON.stringify({
      title: '门店全功能 API',
      version: '2.0.0',
      routes: [
        { path: '/api/products/:id', method: 'GET', parameters: [{ name: 'id', in: 'path', type: 'string', required: true }], responses: [{ status: 200, description: '商品详情' }], tags: ['products'], requiresAuth: true },
        { path: '/api/products/:id', method: 'PUT', parameters: [{ name: 'id', in: 'path', type: 'string', required: true }, { name: 'name', in: 'body', type: 'string', required: true }, { name: 'price', in: 'body', type: 'number', required: true }], responses: [{ status: 200, description: '更新成功' }], tags: ['products'], requiresAuth: true },
        { path: '/api/products/:id', method: 'DELETE', parameters: [{ name: 'id', in: 'path', type: 'string', required: true }], responses: [{ status: 204, description: '删除成功' }], tags: ['products'], requiresAuth: true },
        { path: '/api/inventory/batch', method: 'POST', parameters: [{ name: 'items', in: 'body', type: 'array', required: true }], responses: [{ status: 200, description: '批量入库成功' }], tags: ['inventory'], requiresAuth: true },
        { path: '/api/reports/daily', method: 'GET', parameters: [{ name: 'date', in: 'query', type: 'string', required: true }, { name: 'storeId', in: 'query', type: 'string', required: false }], responses: [{ status: 200, description: '日报表' }], tags: ['reports'], requiresAuth: true },
        { path: '/api/reports/monthly', method: 'GET', parameters: [{ name: 'year', in: 'query', type: 'number', required: true }, { name: 'month', in: 'query', type: 'number', required: true }], responses: [{ status: 200, description: '月报表' }], tags: ['reports'], requiresAuth: true },
      ],
    })
    const res = ctrl.generate({ spec })

    assert.equal(res.status, 'COMPLETED')
    // 6 routes × 至少 4 个测试用例 = 至少 24 个总用例（每个 route: normal + boundary_empty + type_errors + security）
    assert.ok(res.stats.totalTestCases >= 24, `应生成 24+ 个测试用例, 实际 ${res.stats.totalTestCases}`)
    assert.equal(res.files.length, 6)
  })

  it('运行专员获取不存在的 report 应返回 undefined（边界：无效报告 ID）', () => {
    const ctrl = createController()
    const report = ctrl.getReport('non-existent-report-id')
    assert.equal(report, undefined)

    // 另一个不存在的任务
    const task = ctrl.getTask('invalid-uuid-task')
    assert.equal(task, undefined)
  })
})

// ══════════════════════════════════════════════════════════════════════
// 🔧安监 — 安全测试用例和防御能力验证
// ══════════════════════════════════════════════════════════════════════
describe(`${ROLES.Security} — 安全测试用例和防御能力验证`, () => {
  it('安监验证生成的测试用例包含安全场景（XSS/SQLi payload）', () => {
    const generator = new TestCaseGeneratorService()
    const parser = new OpenAPIParserService()

    const table = parser.parseFromRoutes({
      title: '安全审计 API',
      version: '1.0.0',
      routes: [
        { path: '/api/feedback', method: 'POST', parameters: [{ name: 'content', in: 'body', type: 'string', required: true }], responses: [{ status: 201, description: '提交成功' }], tags: ['feedback'], requiresAuth: true },
        { path: '/api/reports', method: 'POST', parameters: [{ name: 'title', in: 'body', type: 'string', required: true }], responses: [{ status: 201, description: '报告创建成功' }], tags: ['reports'], requiresAuth: true },
      ],
    })

    const allCases = generator.generateBatch(table.routes)

    // 应包含安全测试用例
    const securityCases = allCases.filter((c: GeneratedTestCase) => c.scenario === 'SECURITY')
    assert.ok(securityCases.length >= 2, `应有至少 2 个 SECURITY 用例, 实际 ${securityCases.length}`)

    // 安全用例应包含 xss/sqli 标签
    securityCases.forEach((c: GeneratedTestCase) => {
      assert.ok(c.tags.includes('security'), `用例 ${c.id} 应含 security 标签`)
      assert.ok(c.tags.includes('xss'), `用例 ${c.id} 应含 xss 标签`)
    })
  })

  it('安监验证 SECURITY 用例预期返回 4xx（边界：防御生效验证）', () => {
    const generator = new TestCaseGeneratorService()
    const parser = new OpenAPIParserService()

    const table = parser.parseFromRoutes({
      title: '安全验证 API',
      version: '1.0.0',
      routes: [
        { path: '/api/search', method: 'POST', parameters: [{ name: 'q', in: 'body', type: 'string', required: true }], responses: [{ status: 200, description: '搜索结果' }], tags: ['search'], requiresAuth: true },
      ],
    })

    const cases = generator.generateBatch(table.routes)
    const securityCase = cases.find((c: GeneratedTestCase) => c.scenario === 'SECURITY')
    assert.ok(securityCase, '应有 SECURITY 用例')

    // SECURITY 用例的 expectedStatus 应包含 400 或 422
    const expected = Array.isArray(securityCase!.expectedStatus)
      ? securityCase!.expectedStatus
      : [securityCase!.expectedStatus]
    assert.ok(expected.some(s => s >= 400 && s < 500), '安全用例预期应返回 4xx 错误码')
  })

  it('安监验证鉴权路由生成 auth header（权限完整性检查）', () => {
    const generator = new TestCaseGeneratorService()
    const parser = new OpenAPIParserService()

    const table = parser.parseFromRoutes({
      title: '权限验证 API',
      version: '1.0.0',
      routes: [
        { path: '/api/admin', method: 'GET', parameters: [], responses: [{ status: 200, description: '管理员' }], tags: ['admin'], requiresAuth: true },
        { path: '/api/health', method: 'GET', parameters: [], responses: [{ status: 200, description: 'OK' }], tags: ['ops'], requiresAuth: false },
      ],
    })

    const cases = generator.generateBatch(table.routes)

    // 需要鉴权的路由的正常用例应包含 Authorization header
    const adminNormalCase = cases.find((c: GeneratedTestCase) =>
      c.id.includes('GET-/api/admin') && c.scenario === 'NORMAL',
    )
    assert.ok(adminNormalCase, '应有 admin NORMAL 用例')
    assert.ok(adminNormalCase!.request.headers.Authorization, '鉴权路由应含 Authorization header')

    // 无需鉴权的路由的正常用例不应有 Authorization header
    const healthNormalCase = cases.find((c: GeneratedTestCase) =>
      c.id.includes('GET-/api/health') && c.scenario === 'NORMAL',
    )
    assert.ok(healthNormalCase, '应有 health NORMAL 用例')
    assert.equal(healthNormalCase!.request.headers.Authorization, undefined, '无需鉴权路由不应有 Authorization header')
  })
})

// ══════════════════════════════════════════════════════════════════════
// 📢营销 — 营销活动 API 批量测试
// ══════════════════════════════════════════════════════════════════════
describe(`${ROLES.Marketing} — 营销活动 API 批量测试`, () => {
  it('营销为多营销活动 API 批量生成测试（正常流程：生成、配置、列表可见）', () => {
    const ctrl = createController()
    // 第一步：批量生成营销相关 API 测试
    const spec = JSON.stringify({
      title: '营销活动 API Suite',
      version: '1.0.0',
      routes: [
        { path: '/api/campaigns', method: 'GET', parameters: [{ name: 'page', in: 'query', type: 'number', required: false }], responses: [{ status: 200, description: '活动列表' }], tags: ['marketing'], requiresAuth: true },
        { path: '/api/campaigns', method: 'POST', parameters: [{ name: 'name', in: 'body', type: 'string', required: true }, { name: 'discount', in: 'body', type: 'number', required: true }], responses: [{ status: 201, description: '创建成功' }], tags: ['marketing'], requiresAuth: true },
        { path: '/api/coupons', method: 'POST', parameters: [{ name: 'code', in: 'body', type: 'string', required: true }, { name: 'type', in: 'body', type: 'string', required: true }, { name: 'value', in: 'body', type: 'number', required: true }], responses: [{ status: 201, description: '优惠券创建成功' }], tags: ['marketing'], requiresAuth: true },
        { path: '/api/notifications/broadcast', method: 'POST', parameters: [{ name: 'title', in: 'body', type: 'string', required: true }, { name: 'content', in: 'body', type: 'string', required: true }], responses: [{ status: 200, description: '推送成功' }], tags: ['marketing'], requiresAuth: true },
      ],
    })
    const genRes = ctrl.generate({ spec })
    assert.equal(genRes.status, 'COMPLETED')
    assert.equal(genRes.files.length, 4)

    // 第二步：创建营销配置
    const config = ctrl.createConfig({
      projectName: '双十二营销测试',
      specSource: '/specs/double12-campaign.json',
      outputDir: './tests/campaign/double12',
      testFramework: 'vitest',
      enableE2E: true,
      baseUrl: 'https://api.campaign.example.com',
      extraHeaders: { 'X-Campaign-Season': 'double12' },
    })
    assert.ok(config.id)
    assert.equal(config.projectName, '双十二营销测试')
    assert.deepStrictEqual(config.extraHeaders, { 'X-Campaign-Season': 'double12' })

    // 第三步：列表可见
    const configs = ctrl.listConfigs()
    assert.ok(configs.some((c: any) => c.projectName === '双十二营销测试'))
  })

  it('营销更新活动配置时支持所有可选字段更新（边界：全字段更新）', () => {
    const ctrl = createController()
    const config = ctrl.createConfig({
      projectName: '初版活动',
      specSource: '/specs/v1.json',
      outputDir: './tests/v1',
      testFramework: 'vitest',
      enableE2E: false,
    })
    assert.ok(config.id)

    // 全字段更新
    const updated = ctrl.updateConfig(config.id, {
      projectName: '新版春节活动',
      specSource: '/specs/spring-festival.json',
      outputDir: './tests/spring-festival',
      testFramework: 'playwright',
      enableE2E: true,
      baseUrl: 'https://api.spring.example.com',
      authToken: 'spring-token-2026',
      extraHeaders: { 'X-Season': 'spring', 'X-Env': 'prod' },
      enabled: true,
    })

    assert.equal(updated!.projectName, '新版春节活动')
    assert.equal(updated!.specSource, '/specs/spring-festival.json')
    assert.equal(updated!.outputDir, './tests/spring-festival')
    assert.equal(updated!.testFramework, 'playwright')
    assert.equal(updated!.enableE2E, true)
    assert.equal(updated!.baseUrl, 'https://api.spring.example.com')
    assert.equal(updated!.authToken, 'spring-token-2026')
    assert.deepStrictEqual(updated!.extraHeaders, { 'X-Season': 'spring', 'X-Env': 'prod' })
    assert.equal(updated!.enabled, true)
    assert.ok(updated!.updatedAt)
  })

  it('营销生成营销测试后获取文件统计（测试覆盖度可视化）', () => {
    const ctrl = createController()
    const res = ctrl.generate({
      spec: JSON.stringify({
        title: '营销全量 API',
        version: '2.0.0',
        routes: [
          { path: '/api/campaigns', method: 'GET', parameters: [], responses: [{ status: 200, description: '列表' }], tags: ['marketing'], requiresAuth: true },
          { path: '/api/campaigns', method: 'POST', parameters: [{ name: 'name', in: 'body', type: 'string', required: true }], responses: [{ status: 201, description: '创建' }], tags: ['marketing'], requiresAuth: true },
          { path: '/api/coupons', method: 'GET', parameters: [], responses: [{ status: 200, description: '列表' }], tags: ['marketing'], requiresAuth: true },
          { path: '/api/coupons/redeem', method: 'POST', parameters: [{ name: 'code', in: 'body', type: 'string', required: true }], responses: [{ status: 200, description: '兑换' }], tags: ['marketing'], requiresAuth: true },
          { path: '/api/coupons', method: 'POST', parameters: [{ name: 'code', in: 'body', type: 'string', required: true }, { name: 'value', in: 'body', type: 'number', required: true }], responses: [{ status: 201, description: '创建' }], tags: ['marketing'], requiresAuth: true },
        ],
      }),
    })

    const task = ctrl.getTask(res.taskId)
    assert.ok(task, '应有任务记录')
    assert.ok(task!.stats.totalFiles >= 5)
    assert.ok(task!.stats.totalTestCases >= 15, `营销 API 应有 15+ 测试用例, 实际 ${task!.stats.totalTestCases}`)
    // 5 routes × 每个 route 生成 normal + boundary + type_error/security = 平均 ~3.6 个
    // totalLines 应合理（至少每 testCase × 行数）
    assert.ok(task!.stats.totalLines >= task!.stats.totalTestCases * 10, `totalLines(${task!.stats.totalLines}) < totalTestCases(${task!.stats.totalTestCases}) * 10`)
    assert.ok(task!.completedAt, '应有完成时间')
  })
})
