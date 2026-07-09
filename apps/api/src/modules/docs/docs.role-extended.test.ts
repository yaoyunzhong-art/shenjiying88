/**
 * docs.role-extended.test.ts · 文档管理 8 角色扩展视角测试
 *
 * 🛒前台 · 🎯运行专员 · 📢营销 · 🤝团建 · 👔店长 · 🎮导玩员 · 👥HR · 🔧安监
 *
 * 每个角色至少 2 个测试用例（正常流程 + 权限边界）
 */

import { describe, it, expect, beforeEach } from 'vitest'
import assert from 'node:assert/strict'
import { DocController } from './doc.controller'
import { DocService } from './doc.service'
import { SwaggerGenService } from './swagger-gen.service'
import { DocExportFormatEnum } from './doc.dto'

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
}

// ── 辅助函数 ──
function makeController(): DocController {
  const swagger = new SwaggerGenService()
  const docService = new DocService(swagger)
  return new DocController(docService, swagger)
}

// ── 🛒前台：顾客服务文档 ──
describe(`${ROLES.FrontDesk} docs 前台服务文档角色测试`, () => {
  let ctrl: DocController

  beforeEach(() => {
    ctrl = makeController()
  })

  it('前台可以注册会员/收银相关端点（正常流程）', () => {
    const result = ctrl.registerEndpoint({
      controllerName: 'CashierController',
      method: 'POST',
      path: '/cashier/checkout',
      summary: '结账',
      description: '前台收银结账 API',
    })
    assert.equal(result.success, true)
    assert.equal(result.endpoint.controllerName, 'CashierController')
    assert.equal(result.endpoint.path, '/cashier/checkout')
  })

  it('前台可以生成收银操作手册（正常流程）', () => {
    ctrl.registerEndpoint({
      controllerName: 'CashierController',
      method: 'GET',
      path: '/cashier/member-lookup',
      summary: '会员查询',
    })
    const doc = ctrl.generate({
      title: '前台收银手册',
      version: '1.0.0',
      format: DocExportFormatEnum.OPENAPI_JSON,
      description: '前台日常收银操作文档',
      servers: ['https://api.shenjiying.com/cashier'],
    })
    assert.equal(doc.title, '前台收银手册')
    assert.equal(doc.format, DocExportFormatEnum.OPENAPI_JSON)
    assert.ok(doc.sizeBytes > 0)
    assert.ok(doc.content.length > 0)
  })

  it('前台可以注册收银相关的 Schema（正常流程）', () => {
    const result = ctrl.registerSchema({
      name: 'CheckoutRequest',
      schema: {
        type: 'object',
        properties: {
          memberId: { type: 'string' },
          items: { type: 'array', items: { type: 'object' } },
          total: { type: 'number' },
          paymentMethod: { type: 'string' },
        },
      },
    })
    assert.equal(result.success, true)
    assert.equal(result.name, 'CheckoutRequest')
  })

  it('前台列出所有端点应包含收银相关接口（正常流程）', () => {
    ctrl.registerEndpoint({
      controllerName: 'CashierController',
      method: 'POST',
      path: '/cashier/checkout',
      summary: '结账',
    })
    ctrl.registerEndpoint({
      controllerName: 'CashierController',
      method: 'GET',
      path: '/cashier/receipt',
      summary: '小票查询',
    })
    const endpoints = ctrl.listEndpoints()
    assert.equal(endpoints.length, 2)
    assert.ok(endpoints.some((e: any) => e.path === '/cashier/checkout'))
    assert.ok(endpoints.some((e: any) => e.path === '/cashier/receipt'))
  })

  it('前台查询不存在的端点应抛 NotFoundException（边界）', () => {
    assert.throws(
      () => ctrl.getEndpointByPath('cashier/nonexistent-payment'),
      /not found/,
    )
  })

  it('前台生成 Redoc 格式文档用于前台展示（正常流程）', () => {
    ctrl.registerEndpoint({
      controllerName: 'CashierController',
      method: 'GET',
      path: '/cashier/balance',
      summary: '余额查询',
    })
    const doc = ctrl.generate({
      title: '前台操作指引',
      version: '2.0.0',
      format: DocExportFormatEnum.REDOC_HTML,
    })
    assert.equal(doc.format, DocExportFormatEnum.REDOC_HTML)
    assert.ok(doc.content.length > 0)
  })
})

// ── 🎯运行专员：运维文档 ──
describe(`${ROLES.Operations} docs 运行专员运维文档角色测试`, () => {
  let ctrl: DocController

  beforeEach(() => {
    ctrl = makeController()
  })

  it('运行专员可以注册监控/运维相关端点（正常流程）', () => {
    const result = ctrl.registerEndpoint({
      controllerName: 'OpsController',
      method: 'GET',
      path: '/ops/metrics',
      summary: '系统指标',
      description: '运行专员查看系统运行指标',
    })
    assert.equal(result.success, true)
    assert.equal(result.endpoint.path, '/ops/metrics')
  })

  it('运行专员可以注册运维相关 Schema（正常流程）', () => {
    const result = ctrl.registerSchema({
      name: 'SystemMetrics',
      schema: {
        type: 'object',
        properties: {
          cpu: { type: 'number' },
          memory: { type: 'number' },
          disk: { type: 'number' },
          requestCount: { type: 'number' },
          errorRate: { type: 'number' },
          timestamp: { type: 'string' },
        },
      },
    })
    assert.equal(result.success, true)
    assert.equal(result.name, 'SystemMetrics')
  })

  it('运行专员可以生成 YAML 格式文档便于版本管理（正常流程）', () => {
    ctrl.registerEndpoint({
      controllerName: 'OpsController',
      method: 'GET',
      path: '/ops/health',
      summary: '健康检查',
    })
    ctrl.registerEndpoint({
      controllerName: 'OpsController',
      method: 'GET',
      path: '/ops/logs',
      summary: '查看日志',
    })
    const doc = ctrl.generate({
      title: '运维 API 文档',
      version: '3.0.0',
      format: DocExportFormatEnum.OPENAPI_YAML,
    })
    assert.equal(doc.format, DocExportFormatEnum.OPENAPI_YAML)
    assert.ok(doc.content.length > 0)
  })

  it('运行专员可以查看文档统计信息（正常流程）', () => {
    ctrl.registerEndpoint({
      controllerName: 'OpsController',
      method: 'GET',
      path: '/ops/metrics',
      summary: '指标',
    })
    ctrl.registerEndpoint({
      controllerName: 'OpsController',
      method: 'POST',
      path: '/ops/alert',
      summary: '告警',
    })
    ctrl.registerSchema({ name: 'AlertRule', schema: { type: 'object' } })

    const stats = ctrl.getStats()
    assert.equal(stats.totalEndpoints, 2)
    assert.equal(stats.totalSchemas, 1)
    // Method distribution
    assert.equal(stats.endpointMethods.GET, 1)
    assert.equal(stats.endpointMethods.POST, 1)
  })

  it('运行专员可以添加运维 Tag 进行分类（正常流程）', () => {
    const result = ctrl.addTag({ name: '运维管理', description: '运维管理与监控相关的 API 端点' })
    assert.equal(result.success, true)
    assert.equal(result.name, '运维管理')
  })

  it('运行专员可以更新文档配置（正常流程）', () => {
    const result = ctrl.updateConfig({
      title: '运维文档更新版',
      description: '运维 API 最新文档',
      enabledTags: ['运维管理'],
    })
    assert.equal(result.success, true)
  })

  it('运行专员可以通过路径查询运维端点（正常流程）', () => {
    ctrl.registerEndpoint({
      controllerName: 'OpsController',
      method: 'GET',
      path: '/ops/health',
      summary: '健康检查',
    })
    const ep = ctrl.getEndpointByPath('ops/health')
    assert.equal(ep.path, '/ops/health')
    assert.equal(ep.summary, '健康检查')
  })

  it('运行专员注册端点时标注废弃状态（边界）', () => {
    const result = ctrl.registerEndpoint({
      controllerName: 'OpsController',
      method: 'GET',
      path: '/ops/v1/metrics',
      summary: '旧版指标接口（已废弃）',
      deprecated: true,
      description: '请使用 /ops/metrics',
    })
    assert.equal(result.success, true)
    assert.equal(result.endpoint.deprecated, true)
  })

  it('运行专员生成 Insomnia 格式方便团队协作（正常流程）', () => {
    ctrl.registerEndpoint({
      controllerName: 'OpsController',
      method: 'GET',
      path: '/ops/health',
      summary: '健康检查',
    })
    const doc = ctrl.generate({
      title: '运维文档 - Insomnia',
      version: '1.0.0',
      format: DocExportFormatEnum.INSOMNIA_EXPORT,
    })
    assert.equal(doc.format, DocExportFormatEnum.INSOMNIA_EXPORT)
    assert.ok(doc.content.length > 0)
  })

  it('运行专员查看文档的健康检查接口（正常流程）', () => {
    const health = ctrl.healthCheck()
    assert.equal(health.status, 'ok')
    assert.ok(health.uptime >= 0)
  })
})

// ── 📢营销：营销活动文档 ──
describe(`${ROLES.Marketing} docs 营销活动文档角色测试`, () => {
  let ctrl: DocController

  beforeEach(() => {
    ctrl = makeController()
  })

  it('营销可以注册活动/促销相关端点（正常流程）', () => {
    const result = ctrl.registerEndpoint({
      controllerName: 'MarketingController',
      method: 'POST',
      path: '/marketing/campaigns',
      summary: '创建营销活动',
      description: '营销人员创建新的营销活动',
    })
    assert.equal(result.success, true)
    assert.equal(result.endpoint.method, 'POST')
    assert.equal(result.endpoint.path, '/marketing/campaigns')
  })

  it('营销可以生成 Postman Collection 方便第三方开发（正常流程）', () => {
    ctrl.registerEndpoint({
      controllerName: 'MarketingController',
      method: 'GET',
      path: '/marketing/coupons',
      summary: '优惠券列表',
    })
    ctrl.registerEndpoint({
      controllerName: 'MarketingController',
      method: 'POST',
      path: '/marketing/coupons/redeem',
      summary: '核销优惠券',
    })
    const doc = ctrl.generate({
      title: '营销活动 API',
      version: '2.0.0',
      format: DocExportFormatEnum.POSTMAN_COLLECTION,
      description: '营销活动相关接口 Postman 集合',
    })
    assert.equal(doc.title, '营销活动 API')
    assert.equal(doc.format, DocExportFormatEnum.POSTMAN_COLLECTION)
    assert.ok(doc.content.length > 0)
  })

  it('营销可以注册活动相关 Schema（正常流程）', () => {
    const result = ctrl.registerSchema({
      name: 'Campaign',
      schema: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          type: { type: 'string', enum: ['discount', 'coupon', 'points'] },
          startDate: { type: 'string' },
          endDate: { type: 'string' },
          budget: { type: 'number' },
        },
        required: ['name', 'type', 'startDate'],
      },
    })
    assert.equal(result.success, true)
    assert.equal(result.name, 'Campaign')
  })

  it('营销可以添加活动 Tag 分类（正常流程）', () => {
    const result = ctrl.addTag({ name: '营销活动', description: '营销活动和促销相关的 API' })
    assert.equal(result.success, true)
    assert.equal(result.name, '营销活动')
  })

  it('营销可以生成 YAML 格式活动文档（正常流程）', () => {
    ctrl.registerEndpoint({
      controllerName: 'MarketingController',
      method: 'GET',
      path: '/marketing/analytics',
      summary: '营销分析',
    })
    const doc = ctrl.generate({
      title: '营销分析 API',
      version: '1.0.0',
      format: DocExportFormatEnum.OPENAPI_YAML,
      description: '营销数据分析接口',
    })
    assert.equal(doc.format, DocExportFormatEnum.OPENAPI_YAML)
    assert.ok(doc.content.length > 0)
  })

  it('营销注册端点时可以包含多服务器地址（正常流程）', () => {
    const result = ctrl.registerEndpoint({
      controllerName: 'MarketingController',
      method: 'GET',
      path: '/marketing/promotions',
      summary: '促销列表',
    })
    assert.equal(result.success, true)

    const doc = ctrl.generate({
      title: '营销 API',
      version: '1.0.0',
      format: DocExportFormatEnum.OPENAPI_JSON,
      servers: ['https://api.shenjiying.com', 'https://staging-api.shenjiying.com'],
    })
    assert.ok(doc.content.length > 0)
  })

  it('营销查看文档统计应反映营销模块覆盖情况（正常流程）', () => {
    ctrl.registerEndpoint({
      controllerName: 'MarketingController',
      method: 'GET',
      path: '/marketing/campaigns',
      summary: '活动列表',
    })
    ctrl.registerEndpoint({
      controllerName: 'MarketingController',
      method: 'POST',
      path: '/marketing/campaigns',
      summary: '创建活动',
    })
    ctrl.registerEndpoint({
      controllerName: 'MarketingController',
      method: 'DELETE',
      path: '/marketing/campaigns/:id',
      summary: '删除活动',
    })
    ctrl.registerSchema({ name: 'Campaign', schema: { type: 'object' } })
    ctrl.registerSchema({ name: 'CampaignStats', schema: { type: 'object' } })

    const stats = ctrl.getStats()
    assert.equal(stats.totalEndpoints, 3)
    assert.equal(stats.totalSchemas, 2)
    assert.equal(stats.endpointMethods.GET, 1)
    assert.equal(stats.endpointMethods.POST, 1)
    assert.equal(stats.endpointMethods.DELETE, 1)
    assert.ok(Array.isArray(stats.generatedFormats))
  })

  it('营销查询不存在的端点抛出异常（边界）', () => {
    assert.throws(
      () => ctrl.getEndpointByPath('marketing/unknown-activity'),
      /not found/,
    )
  })

  it('营销注册安全方案用于营销 API 鉴权文档（正常流程）', () => {
    const result = ctrl.registerSecurityScheme({
      name: 'marketing-jwt',
      type: 'http',
      scheme: 'bearer',
      description: '营销 API 使用 JWT Bearer Token',
    })
    assert.equal(result.success, true)
    assert.equal(result.name, 'marketing-jwt')
  })
})

// ── 🤝团建扩展：活动预订完整文档 ──
describe(`${ROLES.Teambuilding} docs 团建活动文档扩展测试`, () => {
  let ctrl: DocController

  beforeEach(() => {
    ctrl = makeController()
  })

  it('团建可以注册活动预订整条链路的端点（正常流程）', () => {
    const e1 = ctrl.registerEndpoint({
      controllerName: 'TeambuildingController',
      method: 'GET',
      path: '/teambuilding/venues',
      summary: '场地查询',
    })
    const e2 = ctrl.registerEndpoint({
      controllerName: 'TeambuildingController',
      method: 'POST',
      path: '/teambooking/book',
      summary: '预订场地',
    })
    assert.equal(e1.success, true)
    assert.equal(e2.success, true)
  })

  it('团建可以生成红文格式文档方便团队查看（正常流程）', () => {
    ctrl.registerEndpoint({
      controllerName: 'TeambuildingController',
      method: 'GET',
      path: '/teambuilding/food-menu',
      summary: '餐饮菜单',
    })
    const doc = ctrl.generate({
      title: '团建文档',
      version: '1.0.0',
      format: DocExportFormatEnum.REDOC_HTML,
    })
    assert.equal(doc.format, DocExportFormatEnum.REDOC_HTML)
    assert.ok(doc.content.length > 0)
  })

  it('团建查看文档索引页（正常流程）', () => {
    const index = ctrl.getIndexPage('团建活动手册', '2.0.0')
    assert.ok(index.html.length > 0)
    assert.ok(index.generatedAt)
  })

  it('团建列出所有端点包含团建接口（正常流程）', () => {
    ctrl.registerEndpoint({
      controllerName: 'TeambuildingController',
      method: 'POST',
      path: '/teambuilding/review',
      summary: '活动评价',
    })
    const endpoints = ctrl.listEndpoints()
    assert.ok(endpoints.some((e: any) => e.path === '/teambuilding/review'))
  })
})

// ── 👔店长扩展：门店综合管理 ──
describe(`${ROLES.StoreManager} docs 门店文档扩展测试`, () => {
  let ctrl: DocController

  beforeEach(() => {
    ctrl = makeController()
  })

  it('店长可以注册多个门店管理端点（正常流程）', () => {
    const paths = ['/store/employees', '/store/schedule', '/store/reports', '/store/inventory']
    for (const p of paths) {
      const r = ctrl.registerEndpoint({
        controllerName: 'StoreController',
        method: 'GET',
        path: p,
        summary: p.replace('/store/', ''),
      })
      assert.equal(r.success, true)
    }
    assert.equal(ctrl.listEndpoints().length, 4)
  })

  it('店长可以生成 Insomnia 导出文件分享给区域经理（正常流程）', () => {
    ctrl.registerEndpoint({
      controllerName: 'StoreController',
      method: 'GET',
      path: '/store/sales-summary',
      summary: '销售汇总',
    })
    const doc = ctrl.generate({
      title: '门店管理 API',
      version: '1.0.0',
      format: DocExportFormatEnum.INSOMNIA_EXPORT,
    })
    assert.equal(doc.format, DocExportFormatEnum.INSOMNIA_EXPORT)
    assert.ok(doc.content.length > 0)
  })

  it('店长可以注册安全方案用于门店 API 鉴权（正常流程）', () => {
    const result = ctrl.registerSecurityScheme({
      name: 'store-api-key',
      type: 'apiKey',
      description: '门店 API Key 鉴权',
    })
    assert.equal(result.success, true)
    assert.equal(result.name, 'store-api-key')
  })
})

// ── 🎮导玩员扩展：游戏操作文档 ──
describe(`${ROLES.Guide} docs 导玩操作文档扩展测试`, () => {
  let ctrl: DocController

  beforeEach(() => {
    ctrl = makeController()
  })

  it('导玩员注册多游戏端点并查看统计（正常流程）', () => {
    ctrl.registerEndpoint({
      controllerName: 'GameController',
      method: 'GET',
      path: '/game/arcade-list',
      summary: '街机列表',
    })
    ctrl.registerEndpoint({
      controllerName: 'GameController',
      method: 'POST',
      path: '/game/start',
      summary: '启动游戏',
    })
    ctrl.registerEndpoint({
      controllerName: 'GameController',
      method: 'POST',
      path: '/game/end',
      summary: '结束游戏',
    })
    ctrl.registerSchema({ name: 'GameSession', schema: { type: 'object' } })

    const stats = ctrl.getStats()
    assert.equal(stats.totalEndpoints, 3)
    assert.equal(stats.totalSchemas, 1)
  })

  it('导玩员可以注册游戏 Schema 包含多种属性（正常流程）', () => {
    const result = ctrl.registerSchema({
      name: 'GameDevice',
      schema: {
        type: 'object',
        properties: {
          deviceId: { type: 'string' },
          name: { type: 'string' },
          type: { type: 'string' },
          status: { type: 'string', enum: ['online', 'offline', 'maintenance'] },
          location: { type: 'string' },
        },
      },
    })
    assert.equal(result.success, true)
    assert.equal(result.name, 'GameDevice')
  })
})

// ── 👥HR扩展：培训文档 ──
describe(`${ROLES.HR} docs 培训文档扩展测试`, () => {
  let ctrl: DocController

  beforeEach(() => {
    ctrl = makeController()
  })

  it('HR 可以注册培训 + 考核端点并生成综合文档（正常流程）', () => {
    ctrl.registerEndpoint({
      controllerName: 'TrainingController',
      method: 'GET',
      path: '/training/assessments',
      summary: '考核列表',
    })
    ctrl.registerEndpoint({
      controllerName: 'TrainingController',
      method: 'POST',
      path: '/training/assessments/submit',
      summary: '提交考核',
    })
    const doc = ctrl.generate({
      title: '培训与考核 API',
      version: '1.5.0',
      format: DocExportFormatEnum.OPENAPI_JSON,
      description: '员工培训考核综合文档',
    })
    assert.equal(doc.title, '培训与考核 API')
    assert.equal(doc.version, '1.5.0')
    assert.ok(doc.content.length > 0)
  })

  it('HR 注册端点时可以附带详细描述说明使用方式（正常流程）', () => {
    const result = ctrl.registerEndpoint({
      controllerName: 'TrainingController',
      method: 'POST',
      path: '/training/enroll',
      summary: '报名培训',
      description: '员工报名参加培训课程，需提供 employeeId、courseId 和 preferredDate',
    })
    assert.equal(result.success, true)
    assert.ok(result.endpoint.description!.includes('employeeId'))
  })
})

// ── 🔧安监扩展：安全规范文档 ──
describe(`${ROLES.Security} docs 安全规范文档扩展测试`, () => {
  let ctrl: DocController

  beforeEach(() => {
    ctrl = makeController()
  })

  it('安监可以注册安全检查 + 设备的完整端点链（正常流程）', () => {
    ctrl.registerEndpoint({
      controllerName: 'SafetyController',
      method: 'GET',
      path: '/safety/devices',
      summary: '设备列表',
    })
    ctrl.registerEndpoint({
      controllerName: 'SafetyController',
      method: 'POST',
      path: '/safety/devices/inspect',
      summary: '设备巡检',
    })
    ctrl.registerEndpoint({
      controllerName: 'SafetyController',
      method: 'POST',
      path: '/safety/devices/maintenance',
      summary: '设备维修',
    })
    const stats = ctrl.getStats()
    assert.equal(stats.totalEndpoints, 3)
  })

  it('安监可以查看文档健康状态确保系统正常（正常流程）', () => {
    const health = ctrl.healthCheck()
    assert.equal(health.status, 'ok')
    assert.ok(health.uptime >= 0)
  })

  it('安监注册安全方案后可更新文档配置（正常流程）', () => {
    ctrl.registerSecurityScheme({
      name: 'safety-token',
      type: 'http',
      scheme: 'bearer',
      description: '安监 API 鉴权',
    })
    const result = ctrl.updateConfig({
      title: '安全规范文档 v2',
      description: '更新后的安全规范文档',
    })
    assert.equal(result.success, true)
  })
})
