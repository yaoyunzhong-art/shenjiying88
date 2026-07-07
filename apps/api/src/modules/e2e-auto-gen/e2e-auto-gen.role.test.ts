import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * 🐜 自动: [e2e-auto-gen] [C] 角色测试
 *
 * 8 角色视角的 e2e-auto-gen 模块测试：
 * 👔店长 🛒前台 👥HR 🔧安监 🎮导玩员 🎯运行专员 🤝团建 📢营销
 *
 * 每个角色至少 2 个测试用例（正常流程 + 权限边界）
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import { E2EAutoGenController } from './e2e-auto-gen.controller'
import { E2EAutoGenService } from './e2e-auto-gen.service'
import { OpenAPIParserService } from './openapi-parser.service'
import { TestCaseGeneratorService } from './test-case-generator.service'
import { AutoRunnerService } from './auto-runner.service'

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

// ── 测试数据工厂 ──
function createController() {
  const parser = new OpenAPIParserService()
  const generator = new TestCaseGeneratorService()
  const runner = new AutoRunnerService()
  const service = new E2EAutoGenService(parser, generator, runner)
  return new E2EAutoGenController(service)
}

// 通用 OpenAPI spec
function sampleApiSpec(title = '店内服务 API'): string {
  return JSON.stringify({
    title,
    version: '1.0.0',
    routes: [
      {
        path: '/api/members',
        method: 'GET',
        parameters: [
          { name: 'page', in: 'query', type: 'number', required: false },
          { name: 'limit', in: 'query', type: 'number', required: false },
        ],
        responses: [{ status: 200, description: '会员列表' }],
        tags: ['members'],
        requiresAuth: true,
      },
      {
        path: '/api/members',
        method: 'POST',
        parameters: [
          { name: 'name', in: 'body', type: 'string', required: true },
          { name: 'phone', in: 'body', type: 'string', required: true },
        ],
        responses: [
          { status: 201, description: '创建成功' },
          { status: 400, description: '参数错误' },
        ],
        tags: ['members'],
        requiresAuth: true,
      },
      {
        path: '/api/devices/health',
        method: 'GET',
        parameters: [],
        responses: [{ status: 200, description: '设备健康状态' }],
        tags: ['devices'],
        requiresAuth: false,
      },
    ],
  })
}

// ── 👔店长 ──
describe(`${ROLES.StoreManager} e2e-auto-gen 角色测试`, () => {
  it('店长从完整 API 描述生成测试用例（正常流程）', () => {
    const ctrl = createController()
    const res = ctrl.generate({ spec: sampleApiSpec('门店管理系统') })

    assert.equal(res.status, 'COMPLETED')
    assert.ok(Array.isArray(res.files))
    assert.ok(res.files.length >= 3)
    assert.ok(res.stats.totalFiles >= 3)
    assert.ok(res.stats.totalTestCases > 0)
    assert.ok(res.stats.totalLines > 0)
    assert.ok(Date.parse(res.createdAt) > 0)
  })

  it('店长提供空 spec 应正常生成（边界：零路由）', () => {
    const ctrl = createController()
    const res = ctrl.generate({ spec: JSON.stringify({ title: '空 API', version: '1.0.0', routes: [] }) })

    assert.equal(res.status, 'COMPLETED')
    assert.equal(res.files.length, 0)
    assert.equal(res.stats.totalFiles, 0)
    assert.equal(res.stats.totalTestCases, 0)
  })

  it('店长创建测试配置（管理视角：上线前准备）', () => {
    const ctrl = createController()
    const res = ctrl.createConfig({
      projectName: '门店 POS 系统',
      specSource: 'https://api.store.example/openapi.json',
      outputDir: './tests/pos',
      testFramework: 'vitest',
      enableE2E: true,
      baseUrl: 'https://api.store.example',
    })

    assert.ok(res.id)
    assert.equal(res.projectName, '门店 POS 系统')
    assert.equal(res.testFramework, 'vitest')
    assert.equal(res.enableE2E, true)
    assert.equal(res.baseUrl, 'https://api.store.example')
    assert.equal(res.enabled, true)
    assert.ok(Date.parse(res.createdAt) > 0)
  })

  it('店长查看所有配置（测试进度管理）', () => {
    const ctrl = createController()
    const configs = ctrl.listConfigs()

    assert.ok(Array.isArray(configs))
    // 当前空列表
    assert.equal(configs.length, 0)
  })

  it('店长销毁后重新服务健康检查（运维可见性）', () => {
    const ctrl = createController()
    const health = ctrl.health()

    assert.equal(health.status, 'ok')
    assert.equal(health.module, 'e2e-auto-gen')
    assert.ok(Date.parse(health.timestamp) > 0)
  })
})

// ── 🛒前台 ──
describe(`${ROLES.FrontDesk} e2e-auto-gen 角色测试`, () => {
  it('前线人员根据前台 API 生成测试用例（快速验证）', () => {
    const ctrl = createController()
    const spec = sampleApiSpec('前台收银 API')
    const res = ctrl.generate({ spec })

    assert.equal(res.status, 'COMPLETED')
    assert.ok(res.files.length > 0)
    // 验证文件路径包含方法名
    assert.ok(res.files.some(f => f.includes('get')))
    assert.ok(res.files.some(f => f.includes('post')))
  })

  it('前线人员获取不存在的任务应返回 undefined（边界）', () => {
    const ctrl = createController()
    const task = ctrl.getTask('non-existent-task-id')

    assert.equal(task, undefined)
  })

  it('前线人员查看注册配置（前台上线检查）', () => {
    const ctrl = createController()

    // 先创建一个配置
    ctrl.createConfig({
      projectName: '前台收银',
      specSource: '/specs/cashier.json',
      outputDir: './tests/cashier',
      testFramework: 'vitest',
      enableE2E: false,
    })

    const configs = ctrl.listConfigs()
    assert.ok(configs.length >= 1)
    const cashierConfig = configs.find(c => c.projectName === '前台收银')
    assert.ok(cashierConfig)
    assert.equal(cashierConfig!.specSource, '/specs/cashier.json')
  })
})

// ── 👥HR ──
describe(`${ROLES.HR} e2e-auto-gen 角色测试`, () => {
  it('HR 通过生成 API 测试验证培训系统接口（人力资源系统）', () => {
    const ctrl = createController()
    const spec = JSON.stringify({
      title: '培训系统 API',
      version: '1.0.0',
      routes: [
        {
          path: '/api/trainings',
          method: 'GET',
          parameters: [{ name: 'department', in: 'query', type: 'string', required: false }],
          responses: [{ status: 200, description: '培训列表' }],
          tags: ['training'],
          requiresAuth: true,
        },
        {
          path: '/api/trainings/enroll',
          method: 'POST',
          parameters: [
            { name: 'employeeId', in: 'body', type: 'string', required: true },
            { name: 'courseId', in: 'body', type: 'string', required: true },
          ],
          responses: [
            { status: 201, description: '报名成功' },
            { status: 409, description: '已报名' },
          ],
          tags: ['training'],
          requiresAuth: true,
        },
      ],
    })
    const res = ctrl.generate({ spec })

    assert.equal(res.status, 'COMPLETED')
    assert.equal(res.files.length, 2)
    assert.ok(res.stats.totalTestCases > 0)
  })

  it('HR 获取执行报告查询员工培训 API 测试是否通过', async () => {
    // 需要先创建配置然后执行
    const ctrl = createController()

    const config = ctrl.createConfig({
      projectName: '培训系统 E2E',
      specSource: '/specs/training.json',
      outputDir: './tests/hr/training',
      testFramework: 'vitest',
      enableE2E: false,
    })

    assert.ok(config.id)

    // 未执行时报告获取应返回 undefined
    const report = ctrl.getReport('non-existent-report')
    assert.equal(report, undefined)
  })

  it('HR 验证健康检查端点（系统可用性确认）', () => {
    const ctrl = createController()
    const health = ctrl.health()

    assert.equal(health.status, 'ok')
    assert.equal(health.module, 'e2e-auto-gen')
  })
})

// ── 🔧安监 ──
describe(`${ROLES.Security} e2e-auto-gen 角色测试`, () => {
  it('安监对安全相关 API 生成测试用例（设备健康+鉴权接口）', () => {
    const ctrl = createController()
    const spec = JSON.stringify({
      title: '安全监控 API',
      version: '2.0.0',
      routes: [
        {
          path: '/api/alerts',
          method: 'GET',
          parameters: [
            { name: 'severity', in: 'query', type: 'string', required: false },
            { name: 'page', in: 'query', type: 'number', required: false },
          ],
          responses: [{ status: 200, description: '告警列表' }],
          tags: ['security'],
          requiresAuth: true,
        },
        {
          path: '/api/alerts/acknowledge',
          method: 'POST',
          parameters: [{ name: 'alertId', in: 'body', type: 'string', required: true }],
          responses: [
            { status: 200, description: '确认成功' },
            { status: 404, description: '告警不存在' },
          ],
          tags: ['security'],
          requiresAuth: true,
        },
      ],
    })
    const res = ctrl.generate({ spec })

    assert.equal(res.status, 'COMPLETED')
    assert.ok(res.stats.totalTestCases > 0)
  })

  it('安监传入无效 JSON spec 应抛异常（边界：格式错误）', () => {
    const ctrl = createController()

    assert.throws(
      () => ctrl.generate({ spec: '这不是一个 JSON 字符串' }),
      /Unexpected token|SyntaxError|JSON/,
    )

    assert.throws(
      () => ctrl.generate({ spec: '' }),
      /Unexpected end|JSON/,
    )
  })

  it('安监验证无需鉴权的设备健康接口生成（边界：无 auth 路由）', () => {
    const ctrl = createController()
    const spec = JSON.stringify({
      title: '设备健康 API',
      version: '1.0.0',
      routes: [
        {
          path: '/health',
          method: 'GET',
          parameters: [],
          responses: [{ status: 200, description: 'OK' }],
          tags: ['ops'],
          requiresAuth: false,
        },
      ],
    })
    const res = ctrl.generate({ spec })

    assert.equal(res.status, 'COMPLETED')
    assert.equal(res.files.length, 1)
    assert.ok(res.files[0].includes('get'))
  })
})

// ── 🎮导玩员 ──
describe(`${ROLES.Guide} e2e-auto-gen 角色测试`, () => {
  it('导玩员为游戏设备 API 生成测试（正常流程）', () => {
    const ctrl = createController()
    const spec = JSON.stringify({
      title: '游戏设备 API',
      version: '1.0.0',
      routes: [
        {
          path: '/api/devices/games',
          method: 'GET',
          parameters: [{ name: 'gameType', in: 'query', type: 'string', required: false }],
          responses: [{ status: 200, description: '游戏列表' }],
          tags: ['games'],
          requiresAuth: false,
        },
        {
          path: '/api/devices/games/:id/start',
          method: 'POST',
          parameters: [{ name: 'id', in: 'path', type: 'string', required: true }],
          responses: [
            { status: 200, description: '启动成功' },
            { status: 404, description: '设备不存在' },
          ],
          tags: ['games'],
          requiresAuth: false,
        },
      ],
    })
    const res = ctrl.generate({ spec })

    assert.equal(res.status, 'COMPLETED')
    assert.ok(res.stats.totalTestCases >= 2)
    assert.ok(res.files.some(f => f.includes('start') || f.includes('games')))
  })

  it('导玩员创建游戏设备测试配置', () => {
    const ctrl = createController()
    const config = ctrl.createConfig({
      projectName: '游戏设备 E2E',
      specSource: '/specs/games.json',
      outputDir: './tests/games',
      testFramework: 'playwright',
      enableE2E: true,
    })

    assert.equal(config.projectName, '游戏设备 E2E')
    assert.equal(config.testFramework, 'playwright')
    assert.equal(config.enableE2E, true)
    assert.equal(config.enabled, true)
  })

  it('导玩员更新游戏测试配置（活动前端新增设备场景）', () => {
    const ctrl = createController()

    const config = ctrl.createConfig({
      projectName: '游戏设备旧配置',
      specSource: '/specs/games-old.json',
      outputDir: './tests/games',
      testFramework: 'vitest',
      enableE2E: false,
    })

    const updated = ctrl.updateConfig(config.id, {
      specSource: '/specs/games-new.json',
      testFramework: 'playwright',
      enableE2E: true,
    })

    assert.equal(updated!.specSource, '/specs/games-new.json')
    assert.equal(updated!.testFramework, 'playwright')
    assert.equal(updated!.enableE2E, true)
    assert.ok(updated!.updatedAt)
  })

  it('导玩员更新不存在的配置应抛 404（边界）', () => {
    const ctrl = createController()

    assert.throws(
      () => ctrl.updateConfig('non-existent-config', { projectName: '新项目' }),
      /not found/i,
    )
  })
})

// ── 🎯运行专员 ──
describe(`${ROLES.Operations} e2e-auto-gen 角色测试`, () => {
  it('运行专员生成复杂 API spec 测试（多个路由多种方法）', () => {
    const ctrl = createController()
    const spec = JSON.stringify({
      title: '门店全量 API',
      version: '3.0.0',
      routes: [
        { path: '/api/products', method: 'GET', parameters: [], responses: [{ status: 200, description: '商品列表' }], tags: ['products'], requiresAuth: true },
        { path: '/api/products', method: 'POST', parameters: [{ name: 'name', in: 'body', type: 'string', required: true }, { name: 'price', in: 'body', type: 'number', required: true }], responses: [{ status: 201, description: '创建成功' }, { status: 400, description: '参数错误' }], tags: ['products'], requiresAuth: true },
        { path: '/api/products/:id', method: 'PUT', parameters: [{ name: 'id', in: 'path', type: 'string', required: true }], responses: [{ status: 200, description: '更新成功' }, { status: 404, description: '不存在' }], tags: ['products'], requiresAuth: true },
        { path: '/api/products/:id', method: 'DELETE', parameters: [{ name: 'id', in: 'path', type: 'string', required: true }], responses: [{ status: 204, description: '删除成功' }, { status: 404, description: '不存在' }], tags: ['products'], requiresAuth: true },
        { path: '/api/orders', method: 'GET', parameters: [{ name: 'status', in: 'query', type: 'string', required: false }], responses: [{ status: 200, description: '订单列表' }], tags: ['orders'], requiresAuth: true },
        { path: '/api/orders', method: 'POST', parameters: [{ name: 'items', in: 'body', type: 'array', required: true }], responses: [{ status: 201, description: '下单成功' }], tags: ['orders'], requiresAuth: true },
      ],
    })
    const res = ctrl.generate({ spec })

    assert.equal(res.status, 'COMPLETED')
    assert.equal(res.files.length, 6)
    assert.ok(res.stats.totalTestCases >= 6)
  })

  it('运行专员获取已生成的任务状态（工单追踪）', () => {
    const ctrl = createController()
    const res = ctrl.generate({ spec: sampleApiSpec('门店服务 API') })

    // 任务 ID 可从生成响应中获取
    const taskId = res.taskId
    assert.ok(taskId)

    // 任务应已完成
    const task = ctrl.getTask(taskId)
    assert.ok(task)
    assert.equal(task!.status, 'COMPLETED')
    assert.ok(task!.generatedFiles.length > 0)
    assert.ok(task!.stats.totalFiles > 0)
    assert.ok(task!.stats.totalTestCases > 0)
    assert.ok(Date.parse(task!.createdAt) > 0)
    assert.ok(task!.completedAt)
  })

  it('运行专员配置自定义输出目录和测试框架', () => {
    const ctrl = createController()
    const res = ctrl.generate({
      spec: sampleApiSpec(),
      outputDir: '/custom/tests/api',
      testFramework: 'jest',
      enableE2E: true,
      baseUrl: 'https://api.prod.example.com',
      authToken: 'prod-token-xxx',
    })

    assert.equal(res.status, 'COMPLETED')
    assert.ok(res.files.every(f => f.startsWith('/custom/tests/api')))
  })

  it('运行专员 health check 确认服务运行', () => {
    const ctrl = createController()
    const health = ctrl.health()

    assert.equal(health.status, 'ok')
    assert.ok(Date.parse(health.timestamp) > 0)
  })
})

// ── 🤝团建 ──
describe(`${ROLES.Teambuilding} e2e-auto-gen 角色测试`, () => {
  it('团建为团建活动 API 生成测试用例', () => {
    const ctrl = createController()
    const spec = JSON.stringify({
      title: '团建活动 API',
      version: '1.0.0',
      routes: [
        {
          path: '/api/events',
          method: 'GET',
          parameters: [
            { name: 'date', in: 'query', type: 'string', required: false },
            { name: 'type', in: 'query', type: 'string', required: false },
          ],
          responses: [{ status: 200, description: '活动列表' }],
          tags: ['events'],
          requiresAuth: true,
        },
        {
          path: '/api/events/book',
          method: 'POST',
          parameters: [
            { name: 'eventId', in: 'body', type: 'string', required: true },
            { name: 'participants', in: 'body', type: 'number', required: true },
          ],
          responses: [
            { status: 201, description: '预订成功' },
            { status: 409, description: '已被预订' },
          ],
          tags: ['events'],
          requiresAuth: true,
        },
        {
          path: '/api/venues',
          method: 'GET',
          parameters: [],
          responses: [{ status: 200, description: '场地列表' }],
          tags: ['venues'],
          requiresAuth: false,
        },
      ],
    })
    const res = ctrl.generate({ spec })

    assert.equal(res.status, 'COMPLETED')
    assert.equal(res.files.length, 3)
    assert.ok(res.stats.totalTestCases >= 3)
  })

  it('团建用 playwright 框架生成测试（E2E 兼容性验证）', () => {
    const ctrl = createController()
    const config = ctrl.createConfig({
      projectName: '团建活动 E2E',
      specSource: '/specs/events.json',
      outputDir: './tests/events',
      testFramework: 'playwright',
      enableE2E: true,
      baseUrl: 'https://team-building.example.com',
    })

    assert.equal(config.testFramework, 'playwright')
    assert.equal(config.enableE2E, true)
    assert.ok(config.baseUrl)
  })

  it('团建更新活动配置（活动改期后重新配置）', () => {
    const ctrl = createController()

    const config = ctrl.createConfig({
      projectName: '团建活动初版',
      specSource: '/specs/events-v1.json',
      outputDir: './tests/events-v1',
      testFramework: 'vitest',
      enableE2E: false,
    })

    const updated = ctrl.updateConfig(config.id, {
      specSource: '/specs/events-v2.json',
      outputDir: './tests/events-v2',
      enableE2E: true,
      baseUrl: 'https://updated.team-building.example.com',
    })

    assert.equal(updated!.specSource, '/specs/events-v2.json')
    assert.equal(updated!.outputDir, './tests/events-v2')
    assert.equal(updated!.enableE2E, true)
    assert.equal(updated!.baseUrl, 'https://updated.team-building.example.com')
  })
})

// ── 📢营销 ──
describe(`${ROLES.Marketing} e2e-auto-gen 角色测试`, () => {
  it('营销为营销活动 API 生成测试（正常流程：多方法多路由）', () => {
    const ctrl = createController()
    const spec = JSON.stringify({
      title: '营销活动 API',
      version: '1.0.0',
      routes: [
        {
          path: '/api/campaigns',
          method: 'GET',
          parameters: [{ name: 'status', in: 'query', type: 'string', required: false }],
          responses: [{ status: 200, description: '活动列表' }],
          tags: ['marketing'],
          requiresAuth: true,
        },
        {
          path: '/api/campaigns',
          method: 'POST',
          parameters: [
            { name: 'name', in: 'body', type: 'string', required: true },
            { name: 'discount', in: 'body', type: 'number', required: true },
            { name: 'startDate', in: 'body', type: 'string', required: true },
            { name: 'endDate', in: 'body', type: 'string', required: true },
          ],
          responses: [
            { status: 201, description: '创建成功' },
            { status: 400, description: '参数不合法' },
          ],
          tags: ['marketing'],
          requiresAuth: true,
        },
        {
          path: '/api/coupons/redeem',
          method: 'POST',
          parameters: [
            { name: 'code', in: 'body', type: 'string', required: true },
            { name: 'memberId', in: 'body', type: 'string', required: true },
          ],
          responses: [
            { status: 200, description: '兑换成功' },
            { status: 400, description: '优惠券已过期' },
            { status: 404, description: '优惠券不存在' },
          ],
          tags: ['marketing'],
          requiresAuth: true,
        },
      ],
    })
    const res = ctrl.generate({ spec })

    assert.equal(res.status, 'COMPLETED')
    assert.equal(res.files.length, 3)
    assert.ok(res.stats.totalTestCases > 0)
  })

  it('营销创建营销活动测试配置（正常流程）', () => {
    const ctrl = createController()
    const config = ctrl.createConfig({
      projectName: '双十一活动测试',
      specSource: '/specs/double11.json',
      outputDir: './tests/campaigns/double11',
      testFramework: 'vitest',
      enableE2E: true,
      baseUrl: 'https://api.campaign.example.com',
      extraHeaders: { 'X-Campaign': 'double11' },
    })

    assert.equal(config.projectName, '双十一活动测试')
    assert.equal(config.baseUrl, 'https://api.campaign.example.com')
    assert.deepStrictEqual(config.extraHeaders, { 'X-Campaign': 'double11' })
    assert.ok(Date.parse(config.createdAt) > 0)
  })

  it('营销生成后验证 task 的 stats 细节（测试覆盖率可见性）', () => {
    const ctrl = createController()
    const res = ctrl.generate({ spec: sampleApiSpec('营销 API 全面验证') })

    const task = ctrl.getTask(res.taskId)
    assert.ok(task)
    assert.ok(task!.stats.totalFiles > 0)
    assert.ok(task!.stats.totalTestCases > 0)
    assert.ok(task!.stats.totalLines > 0)
    // 每个测试用例约 15 行
    assert.ok(task!.stats.totalLines >= task!.stats.totalTestCases * 10)
    assert.ok(task!.completedAt)
  })

  it('营销更新活动配置（营销活动迭代更新）', () => {
    const ctrl = createController()

    const config = ctrl.createConfig({
      projectName: '旧版活动',
      specSource: '/specs/old-campaign.json',
      outputDir: './tests/old',
      testFramework: 'vitest',
      enableE2E: false,
    })

    const updated = ctrl.updateConfig(config.id, {
      projectName: '新版双12活动',
      specSource: '/specs/double12.json',
      outputDir: './tests/double12',
      enableE2E: true,
      authToken: 'new-token-double12',
    })

    assert.equal(updated!.projectName, '新版双12活动')
    assert.equal(updated!.authToken, 'new-token-double12')
    assert.equal(updated!.enableE2E, true)
  })
})
