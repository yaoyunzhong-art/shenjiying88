import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * 🐜 自动: [e2e-auto-gen] [C] 角色测试 v3 —— 多角色深度场景
 *
 * 8 角色视角的 e2e-auto-gen 模块深度场景测试：
 * 👔店长 🛒前台 👥HR 🔧安监 🎮导玩员 🎯运行专员 🤝团建 📢营销
 *
 * 每个角色至少 2 个测试用例（正常流程 + 权限/数据边界）
 * 涵盖：生成 / 执行 / 配置管理 / 任务查询 / 报告查询
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

// ── 测试工厂 ──
function createController() {
  const parser = new OpenAPIParserService()
  const generator = new TestCaseGeneratorService()
  const runner = new AutoRunnerService()
  const service = new E2EAutoGenService(parser, generator, runner)
  return new E2EAutoGenController(service)
}

/** 生成通用门店 OpenAPI spec */
function storeApiSpec(): string {
  return JSON.stringify({
    title: '门店综合服务 API',
    version: '2.0.0',
    routes: [
      {
        path: '/api/stores/sales',
        method: 'GET',
        parameters: [
          { name: 'date', in: 'query', type: 'string', required: true },
          { name: 'storeId', in: 'query', type: 'string', required: true },
        ],
        responses: [{ status: 200, description: '销售日报' }],
        tags: ['sales'],
        requiresAuth: true,
      },
      {
        path: '/api/stores/inventory',
        method: 'POST',
        parameters: [
          { name: 'productId', in: 'body', type: 'string', required: true },
          { name: 'quantity', in: 'body', type: 'number', required: true },
        ],
        responses: [
          { status: 200, description: '库存更新成功' },
          { status: 400, description: '参数错误' },
        ],
        tags: ['inventory'],
        requiresAuth: true,
      },
      {
        path: '/api/stores/announcements',
        method: 'GET',
        parameters: [],
        responses: [{ status: 200, description: '公告列表' }],
        tags: ['announcements'],
        requiresAuth: false,
      },
      {
        path: '/api/team/activities',
        method: 'POST',
        parameters: [
          { name: 'title', in: 'body', type: 'string', required: true },
          { name: 'date', in: 'body', type: 'string', required: true },
          { name: 'budget', in: 'body', type: 'number', required: false },
        ],
        responses: [
          { status: 201, description: '活动创建成功' },
          { status: 422, description: '校验失败' },
        ],
        tags: ['team'],
        requiresAuth: true,
      },
    ],
  })
}

/** 生成最小 API spec（无认证路由） */
function publicApiSpec(): string {
  return JSON.stringify({
    title: '公共开放 API',
    version: '1.0.0',
    routes: [
      {
        path: '/api/public/health',
        method: 'GET',
        parameters: [],
        responses: [{ status: 200, description: '健康检查' }],
        tags: ['public'],
        requiresAuth: false,
      },
      {
        path: '/api/public/version',
        method: 'GET',
        parameters: [],
        responses: [{ status: 200, description: '版本信息' }],
        tags: ['public'],
        requiresAuth: false,
      },
    ],
  })
}

// ── 👔店长 场景 —— 门店维度配置与生成 ──
describe(`${ROLES.StoreManager} e2e-auto-gen 角色深度测试`, () => {
  it('店长通过配置创建 + 生成 => 完整的门店 API 测试套件', () => {
    const ctrl = createController()

    // 创建配置
    const config = ctrl.createConfig({
      projectName: '门店销售系统',
      specSource: 'openapi-v3',
      outputDir: './tests/stores',
      testFramework: 'vitest',
      enableE2E: true,
      baseUrl: 'https://api.store.example.com',
    })

    assert.ok(config.id)
    assert.equal(config.projectName, '门店销售系统')
    assert.equal(config.enabled, true)

    // 生成测试
    const res = ctrl.generate({ spec: storeApiSpec() })
    assert.equal(res.status, 'COMPLETED')
    assert.ok(res.files.length >= 4)
    assert.ok(res.stats.totalTestCases >= 4)
  })

  it('店长查询所有配置列表 => 返回刚创建的配置', () => {
    const ctrl = createController()
    ctrl.createConfig({
      projectName: '门店库存管理',
      specSource: 'openapi-v3',
    })
    const configs = ctrl.listConfigs()
    assert.ok(configs.length >= 1)
    const found = configs.find(c => c.projectName === '门店库存管理')
    assert.ok(found)
    assert.ok(found.id)
    assert.equal(found.enabled, true)
  })

  it('店长提供非 JSON spec => generate 应抛出异常', () => {
    const ctrl = createController()
    assert.throws(() => {
      ctrl.generate({ spec: '这不是 JSON 格式的数据' })
    }, /JSON|parse|expect/i)
  })
})

// ── 🛒前台 场景 —— 前台收银相关测试生成 ──
describe(`${ROLES.FrontDesk} e2e-auto-gen 角色深度测试`, () => {
  it('前台生成收银 API 测试 => 返回完成状态且文件列表可读', () => {
    const ctrl = createController()
    const res = ctrl.generate({ spec: storeApiSpec() })

    assert.equal(res.status, 'COMPLETED')
    assert.ok(res.files.every(f => f.endsWith('.spec.ts')))
    assert.ok(res.files.some(f => f.includes('sales')))
  })

  it('前台查询不存在的任务 ID => 返回 undefined', () => {
    const ctrl = createController()
    const task = ctrl.getTask('non-existent-task-id')
    assert.equal(task, undefined)
  })

  it('前台查询不存在的报告 ID => 返回 undefined', () => {
    const ctrl = createController()
    const report = ctrl.getReport('non-existent-report-id')
    assert.equal(report, undefined)
  })
})

// ── 👥HR 场景 —— 人员/培训相关测试 ──
describe(`${ROLES.HR} e2e-auto-gen 角色深度测试`, () => {
  it('HR 生成员工培训系统测试 => 测试用例生成完整', () => {
    const ctrl = createController()
    const res = ctrl.generate({
      spec: JSON.stringify({
        title: '员工培训系统',
        version: '1.0.0',
        routes: [
          {
            path: '/api/training/courses',
            method: 'GET',
            parameters: [{ name: 'page', in: 'query', type: 'number', required: false }],
            responses: [{ status: 200, description: '课程列表' }],
            tags: ['training'],
            requiresAuth: true,
          },
        ],
      }),
    })

    assert.equal(res.status, 'COMPLETED')
    assert.equal(res.stats.totalFiles, 1)
    assert.ok(res.stats.totalTestCases > 0)
  })

  it('HR 创建配置后更新 => 配置字段正确变更', () => {
    const ctrl = createController()
    const config = ctrl.createConfig({
      projectName: 'HR 培训系统',
      specSource: 'swagger',
      outputDir: './tests/hr',
      testFramework: 'vitest',
    })

    const updated = ctrl.updateConfig(config.id, {
      projectName: 'HR 培训系统 v2',
      baseUrl: 'https://hr.api.example.com',
    })

    assert.equal(updated!.projectName, 'HR 培训系统 v2')
    assert.equal(updated!.baseUrl, 'https://hr.api.example.com')
    assert.equal(updated!.outputDir, './tests/hr')
    assert.ok((updated as any).updatedAt)
  })
})

// ── 🔧安监 场景 —— 安全审计与权限边界 ──
describe(`${ROLES.Security} e2e-auto-gen 角色深度测试`, () => {
  it('安监生成安全合规测试 => 所有路由均含 test case', () => {
    const ctrl = createController()
    const spec = JSON.stringify({
      title: '安全审计 API',
      version: '1.0.0',
      routes: [
        {
          path: '/api/audit/logs',
          method: 'GET',
          parameters: [],
          responses: [{ status: 200, description: '审计日志' }],
          tags: ['audit'],
          requiresAuth: true,
        },
        {
          path: '/api/audit/alerts',
          method: 'POST',
          parameters: [{ name: 'severity', in: 'body', type: 'string', required: true }],
          responses: [{ status: 201, description: '告警创建' }],
          tags: ['audit'],
          requiresAuth: true,
        },
      ],
    })
    const res = ctrl.generate({ spec })
    assert.equal(res.status, 'COMPLETED')
    assert.equal(res.stats.totalFiles, 2)
  })

  it('安监更新不存在的配置 ID => 抛出 NotFoundException', () => {
    const ctrl = createController()
    assert.throws(() => {
      ctrl.updateConfig('non-existent-config-id', { projectName: 'hack' })
    }, /not found/i)
  })

  it('安监验证生成结果的 stats 字段 => 各字段为合理数值', () => {
    const ctrl = createController()
    const res = ctrl.generate({ spec: storeApiSpec() })

    assert.equal(typeof res.stats.totalFiles, 'number')
    assert.ok(res.stats.totalFiles > 0)
    assert.equal(typeof res.stats.totalTestCases, 'number')
    assert.ok(res.stats.totalTestCases > 0)
    assert.equal(typeof res.stats.totalLines, 'number')
    assert.ok(res.stats.totalLines > 0)
  })
})

// ── 🎮导玩员 场景 —— 游戏/活动维度的测试生成 ──
describe(`${ROLES.Guide} e2e-auto-gen 角色深度测试`, () => {
  it('导玩员生成游戏活动测试 => 使用公共 API spec 无认证路由', () => {
    const ctrl = createController()
    const res = ctrl.generate({ spec: publicApiSpec() })

    assert.equal(res.status, 'COMPLETED')
    assert.equal(res.files.length, 2)
    assert.ok(res.files.every(f => f.endsWith('.spec.ts')))
  })

  it('导玩员使用自定义 outputDir 生成 => 文件路径包含自定义目录', () => {
    const ctrl = createController()
    const res = ctrl.generate({
      spec: publicApiSpec(),
      outputDir: './custom-games',
    })

    assert.ok(res.files.every(f => f.startsWith('./custom-games/')))
  })
})

// ── 🎯运行专员 场景 —— 执行与配置管理 ──
describe(`${ROLES.Operations} e2e-auto-gen 角色深度测试`, () => {
  it('运行专员创建配置 → 更新配置 → 列表复核 => 配置生命周期完整', () => {
    const ctrl = createController()

    const config = ctrl.createConfig({
      projectName: '门店日常巡检',
      specSource: 'openapi-v3',
      outputDir: './tests/ops',
      baseUrl: 'https://ops.store.example.com',
    })

    // 更新
    ctrl.updateConfig(config.id, { enabled: false })
    // 列表查询
    const configs = ctrl.listConfigs()
    const found = configs.find(c => c.id === config.id)
    assert.ok(found)
    assert.equal(found!.enabled, false)
    assert.ok(found!.updatedAt)
  })

  it('运行专员执行测试前应先创建配置 => execute 会因缺少配置而报错', async () => {
    const ctrl = createController()
    try {
      await ctrl.execute({ configId: 'no-such-config' })
      assert.fail('应抛出 NotFoundException')
    } catch (err: any) {
      assert.ok(err.message?.includes('not found'))
    }
  })

  it('运行专员查询任务 => 新任务可被检索到', () => {
    const ctrl = createController()
    const res = ctrl.generate({ spec: storeApiSpec() })
    const task = ctrl.getTask(res.taskId)

    assert.ok(task)
    assert.equal(task!.id, res.taskId)
    assert.equal(task!.status, 'COMPLETED')
    assert.ok(task!.createdAt)
  })
})

// ── 🤝团建 场景 —— 团队活动与协作 ──
describe(`${ROLES.Teambuilding} e2e-auto-gen 角色深度测试`, () => {
  it('团建生成团队活动系统测试 => 返回完整的统计信息', () => {
    const ctrl = createController()
    const res = ctrl.generate({ spec: storeApiSpec() })

    assert.equal(res.status, 'COMPLETED')
    assert.ok(res.stats.totalFiles > 0)
    assert.ok(res.stats.totalTestCases > 0)
    assert.ok(res.stats.totalLines >= res.stats.totalTestCases * 10)
  })

  it('团建配置更新启用/禁用开关 => enabled 字段正确变化', () => {
    const ctrl = createController()
    const config = ctrl.createConfig({
      projectName: '秋季团建管理系统',
      specSource: 'openapi-v3',
      outputDir: './tests/team-building',
    })

    assert.equal(config.enabled, true)
    const updated = ctrl.updateConfig(config.id, { enabled: false })
    assert.equal(updated!.enabled, false)

    const updatedAgain = ctrl.updateConfig(config.id, { enabled: true })
    assert.equal(updatedAgain!.enabled, true)
  })

  it('团建健康检查端点 => 返回正常状态', () => {
    const ctrl = createController()
    const health = ctrl.health()

    assert.equal(health.status, 'ok')
    assert.equal(health.module, 'e2e-auto-gen')
    assert.ok(Date.parse(health.timestamp) > 0)
  })
})

// ── 📢营销 场景 —— 营销活动相关 ──
describe(`${ROLES.Marketing} e2e-auto-gen 角色深度测试`, () => {
  it('营销生成营销活动 API 测试 => 测试用例包含营销相关路由', () => {
    const ctrl = createController()
    const spec = JSON.stringify({
      title: '营销活动系统',
      version: '1.0.0',
      routes: [
        {
          path: '/api/promotions/coupons',
          method: 'POST',
          parameters: [
            { name: 'code', in: 'body', type: 'string', required: true },
            { name: 'discount', in: 'body', type: 'number', required: true },
          ],
          responses: [{ status: 201, description: '优惠券创建成功' }],
          tags: ['promotions'],
          requiresAuth: true,
        },
        {
          path: '/api/promotions/campaigns',
          method: 'GET',
          parameters: [{ name: 'status', in: 'query', type: 'string', required: false }],
          responses: [{ status: 200, description: '活动列表' }],
          tags: ['promotions'],
          requiresAuth: false,
        },
      ],
    })

    const res = ctrl.generate({
      spec,
      outputDir: './tests/promotions',
      testFramework: 'playwright',
      enableE2E: true,
    })

    assert.equal(res.status, 'COMPLETED')
    assert.equal(res.stats.totalFiles, 2)
    assert.ok(res.files.every(f => f.startsWith('./tests/promotions/')))
  })

  it('营销指定 testFramework 为 playwright => 生成仍正常完成', () => {
    const ctrl = createController()
    const res = ctrl.generate({
      spec: publicApiSpec(),
      testFramework: 'playwright',
    })

    assert.equal(res.status, 'COMPLETED')
    assert.ok(res.stats.totalTestCases > 0)
  })

  it('营销使用空 spec 对象 => 生成零路由测试', () => {
    const ctrl = createController()
    const res = ctrl.generate({ spec: JSON.stringify({ routes: [] }) })

    assert.equal(res.status, 'COMPLETED')
    assert.equal(res.files.length, 0)
    assert.equal(res.stats.totalFiles, 0)
    assert.equal(res.stats.totalTestCases, 0)
  })
})
