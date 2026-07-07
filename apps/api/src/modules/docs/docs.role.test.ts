/**
 * docs.role.test.ts · 文档管理 5 角色视角测试
 *
 * 👥HR · 🎮导玩员 · 🔧安监 · 🤝团建 · 👔店长
 */

import { describe, it, expect, beforeEach } from 'vitest'
import assert from 'node:assert/strict'
import { DocController } from './doc.controller'
import { SwaggerGenService } from './swagger-gen.service'
import { DocExportFormatEnum } from './doc.dto'

// ── 角色定义 ──
const ROLES = {
  HR: '👥HR',
  Guide: '🎮导玩员',
  Safety: '🔧安监',
  Teambuilding: '🤝团建',
  TenantAdmin: '👔店长',
}

// ── 辅助函数 ──
function makeController(): DocController {
  return new DocController(new SwaggerGenService())
}

// ──────────────────── 👥 HR · 员工培训文档 ────────────────────
describe(`${ROLES.HR} docs 员工培训文档角色测试`, () => {
  let ctrl: DocController

  beforeEach(() => {
    ctrl = makeController()
  })

  it('HR 可以注册培训相关的 API 端点文档（正常流程）', () => {
    const result = ctrl.registerEndpoint({
      controllerName: 'TrainingController',
      method: 'GET',
      path: '/training/courses',
      summary: '获取培训课程列表',
      description: '员工可以根据部门查看可用的培训课程',
    })
    assert.equal(result.success, true)
    assert.equal(result.endpoint.controllerName, 'TrainingController')
    assert.equal(result.endpoint.path, '/training/courses')
  })

  it('HR 可以注册培训相关的 Schema 用于文档生成（正常流程）', () => {
    const result = ctrl.registerSchema({
      name: 'TrainingCourse',
      schema: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          duration: { type: 'number' },
          instructor: { type: 'string' },
        },
      },
    })
    assert.equal(result.success, true)
    assert.equal(result.name, 'TrainingCourse')
  })

  it('HR 可以生成员工培训手册文档（多种格式）', () => {
    ctrl.registerEndpoint({
      controllerName: 'TrainingController',
      method: 'GET',
      path: '/training/onboarding',
      summary: '新人入职培训',
    })

    const jsonDoc = ctrl.generate({
      title: '员工培训手册',
      version: '1.0.0',
      format: DocExportFormatEnum.OPENAPI_JSON,
      description: '新员工培训相关 API',
    })
    assert.equal(jsonDoc.title, '员工培训手册')
    assert.equal(jsonDoc.format, DocExportFormatEnum.OPENAPI_JSON)
    assert.ok(jsonDoc.sizeBytes > 0)

    const yamlDoc = ctrl.generate({
      title: '员工培训手册',
      version: '1.0.0',
      format: DocExportFormatEnum.OPENAPI_YAML,
    })
    assert.equal(yamlDoc.format, DocExportFormatEnum.OPENAPI_YAML)
    assert.ok(yamlDoc.content.length > 0)
  })

  it('HR 可以创建培训模块 Tag 方便分类（正常流程）', () => {
    const result = ctrl.addTag({ name: '员工培训', description: '员工培训相关的 API 文档' })
    assert.equal(result.success, true)
    assert.equal(result.name, '员工培训')
  })

  it('HR 可以查看文档统计了解培训文档完整度', () => {
    ctrl.registerEndpoint({
      controllerName: 'TrainingController',
      method: 'GET',
      path: '/training/courses',
      summary: '课程列表',
    })
    ctrl.registerEndpoint({
      controllerName: 'TrainingController',
      method: 'GET',
      path: '/training/enrollments',
      summary: '课程报名',
    })
    ctrl.registerSchema({ name: 'Course', schema: { type: 'object' } })
    ctrl.registerSchema({ name: 'Enrollment', schema: { type: 'object' } })

    const stats = ctrl.getStats()
    assert.equal(stats.totalEndpoints, 2)
    assert.equal(stats.totalSchemas, 2)
  })

  it('HR 生成文档时可以自定义服务器地址（正常流程）', () => {
    const doc = ctrl.generate({
      title: 'HR 文档',
      version: '2.0.0',
      format: DocExportFormatEnum.OPENAPI_JSON,
      servers: ['https://api.shenjiying.com/hr'],
    })
    assert.equal(doc.title, 'HR 文档')
    assert.equal(doc.version, '2.0.0')
    assert.ok(doc.sizeBytes > 0)
  })
})

// ──────────────────── 🎮 导玩员 · 操作手册 ────────────────────
describe(`${ROLES.Guide} docs 操作手册角色测试`, () => {
  let ctrl: DocController

  beforeEach(() => {
    ctrl = makeController()
  })

  it('导玩员可以注册端点生成操作手册（正常流程）', () => {
    const result = ctrl.registerEndpoint({
      controllerName: 'GameController',
      method: 'POST',
      path: '/game/start',
      summary: '开始游戏',
      description: '导玩员为顾客开启游戏设备',
    })
    assert.equal(result.success, true)
    assert.equal(result.endpoint.method, 'POST')
    assert.equal(result.endpoint.summary, '开始游戏')
  })

  it('导玩员可以生成 Redoc 格式的操作手册（正常流程）', () => {
    ctrl.registerEndpoint({
      controllerName: 'GameController',
      method: 'GET',
      path: '/game/list',
      summary: '游戏列表',
    })

    const doc = ctrl.generate({
      title: '导玩操作手册',
      version: '1.0.0',
      format: DocExportFormatEnum.REDOC_HTML,
      description: '导玩员日常操作指引',
    })
    assert.equal(doc.title, '导玩操作手册')
    assert.equal(doc.format, DocExportFormatEnum.REDOC_HTML)
    assert.ok(doc.content.includes('redoc') || doc.content.length > 0)
  })

  it('导玩员可以查看生成的文档索引页（正常流程）', () => {
    const index = ctrl.getIndexPage('导玩操作手册', '1.0.0')
    assert.ok(index.html.length > 0)
    assert.ok(index.generatedAt)
  })

  it('导玩员可以列出所有已注册的操作端点（正常流程）', () => {
    ctrl.registerEndpoint({ controllerName: 'GameController', method: 'GET', path: '/game/arcade', summary: '街机列表' })
    ctrl.registerEndpoint({ controllerName: 'PrizeController', method: 'POST', path: '/prize/redeem', summary: '奖品兑换' })

    const endpoints = ctrl.listEndpoints()
    assert.ok(endpoints.length >= 2)
    assert.ok(endpoints.some((e: any) => e.path === '/game/arcade'))
  })

  it('导玩员注册端点时可以标注废弃状态（边界）', () => {
    const result = ctrl.registerEndpoint({
      controllerName: 'GameController',
      method: 'GET',
      path: '/game/legacy',
      summary: '旧版游戏接口',
      deprecated: true,
    })
    assert.equal(result.success, true)
    assert.equal(result.endpoint.deprecated, true)
  })

  it('导玩员可以生成 Postman Collection 供现场使用', () => {
    ctrl.registerEndpoint({ controllerName: 'GameController', method: 'GET', path: '/game/list', summary: '游戏列表' })
    const doc = ctrl.generate({
      title: '导玩员 API 集合',
      version: '1.0.0',
      format: DocExportFormatEnum.POSTMAN_COLLECTION,
    })
    assert.equal(doc.format, DocExportFormatEnum.POSTMAN_COLLECTION)
    assert.ok(doc.content.length > 0)
  })
})

// ──────────────────── 🔧 安监 · 安全规范文档 ────────────────────
describe(`${ROLES.Safety} docs 安全规范文档角色测试`, () => {
  let ctrl: DocController

  beforeEach(() => {
    ctrl = makeController()
  })

  it('安监可以注册安全检查相关的 API 端点（正常流程）', () => {
    const result = ctrl.registerEndpoint({
      controllerName: 'SafetyController',
      method: 'GET',
      path: '/safety/inspections',
      summary: '安全检查记录列表',
      description: '安监人员查看门店安全检查记录',
    })
    assert.equal(result.success, true)
    assert.equal(result.endpoint.controllerName, 'SafetyController')
  })

  it('安监可以注册安全规范的 Schema 定义（正常流程）', () => {
    const result = ctrl.registerSchema({
      name: 'SafetyInspection',
      schema: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          storeId: { type: 'string' },
          inspector: { type: 'string' },
          result: { type: 'string', enum: ['pass', 'fail', 'pending'] },
          checkedAt: { type: 'string', format: 'date-time' },
        },
      },
    })
    assert.equal(result.success, true)
    assert.equal(result.name, 'SafetyInspection')
  })

  it('安监可以生成安监模块文档（正常流程）', () => {
    ctrl.registerEndpoint({
      controllerName: 'SafetyController',
      method: 'POST',
      path: '/safety/report-incident',
      summary: '上报安全事故',
    })

    const doc = ctrl.generate({
      title: '安全规范手册',
      version: '2.0.0',
      format: DocExportFormatEnum.OPENAPI_JSON,
      description: '门店安全规范 API 文档',
    })
    assert.equal(doc.title, '安全规范手册')
    assert.equal(doc.version, '2.0.0')
    assert.ok(doc.content.length > 0)
  })

  it('安监可以注册安全相关的 Tag 分类（正常流程）', () => {
    const result = ctrl.addTag({ name: '安全规范', description: '安全管理相关的 API 端点' })
    assert.equal(result.success, true)
  })

  it('安监可以通过路径查询已注册的安全端点（正常流程）', () => {
    ctrl.registerEndpoint({
      controllerName: 'SafetyController',
      method: 'GET',
      path: '/safety/inspections',
      summary: '检查列表',
    })

    const ep = ctrl.getEndpointByPath('safety/inspections')
    assert.equal(ep.path, '/safety/inspections')
    assert.equal(ep.controllerName, 'SafetyController')
  })

  it('安监查询不存在端点应抛出错误（边界）', () => {
    assert.throws(
      () => ctrl.getEndpointByPath('nonexistent-safety-endpoint'),
      /not found/,
    )
  })

  it('安监可以注册安全方案用于 API 鉴权文档（正常流程）', () => {
    const result = ctrl.registerSecurityScheme({
      name: 'api-key',
      type: 'apiKey',
      description: '安监用 API Key 鉴权',
    })
    assert.equal(result.success, true)
    assert.equal(result.name, 'api-key')
  })
})

// ──────────────────── 🤝 团建 · 团建活动文档 ────────────────────
describe(`${ROLES.Teambuilding} docs 团建活动文档角色测试`, () => {
  let ctrl: DocController

  beforeEach(() => {
    ctrl = makeController()
  })

  it('团建可以注册活动相关的 API 端点（正常流程）', () => {
    const result = ctrl.registerEndpoint({
      controllerName: 'TeambuildingController',
      method: 'GET',
      path: '/teambuilding/activities',
      summary: '获取团建活动列表',
      description: '团建活动预订与查询',
    })
    assert.equal(result.success, true)
    assert.equal(result.endpoint.path, '/teambuilding/activities')
  })

  it('团建可以注册活动 Schema 用于文档生成（正常流程）', () => {
    const result = ctrl.registerSchema({
      name: 'TeambuildingActivity',
      schema: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          capacity: { type: 'number' },
          price: { type: 'number' },
          duration: { type: 'number' },
        },
      },
    })
    assert.equal(result.success, true)
    assert.equal(result.name, 'TeambuildingActivity')
  })

  it('团建可以生成活动文档方便合作伙伴查看（正常流程）', () => {
    ctrl.registerEndpoint({
      controllerName: 'TeambuildingController',
      method: 'GET',
      path: '/teambuilding/packages',
      summary: '活动套餐',
    })

    const doc = ctrl.generate({
      title: '团建活动文档',
      version: '1.0.0',
      format: DocExportFormatEnum.INSOMNIA_EXPORT,
      description: '团建活动 API 接口文档',
    })
    assert.equal(doc.title, '团建活动文档')
    assert.equal(doc.format, DocExportFormatEnum.INSOMNIA_EXPORT)
    assert.ok(doc.content.length > 0)
  })

  it('团建可以列出所有活动端点（正常流程）', () => {
    ctrl.registerEndpoint({ controllerName: 'TeambuildingController', method: 'GET', path: '/teambuilding/venues', summary: '场地列表' })
    ctrl.registerEndpoint({ controllerName: 'TeambuildingController', method: 'POST', path: '/teambuilding/book', summary: '预订场地' })

    const endpoints = ctrl.listEndpoints()
    assert.ok(endpoints.length >= 2)
  })

  it('团建可以更新文档配置（正常流程）', () => {
    const result = ctrl.updateConfig({
      title: '团建 API 文档',
      version: '2.0.0',
      description: '团建活动相关接口',
    })
    assert.equal(result.success, true)
  })

  it('团建可以查看文档健康状态（正常流程）', () => {
    const health = ctrl.healthCheck()
    assert.equal(health.status, 'ok')
    assert.ok(health.uptime >= 0)
  })
})

// ──────────────────── 👔 店长 · 门店管理文档 ────────────────────
describe(`${ROLES.TenantAdmin} docs 门店管理文档角色测试`, () => {
  let ctrl: DocController

  beforeEach(() => {
    ctrl = makeController()
  })

  it('店长可以注册门店管理相关的 API 端点（正常流程）', () => {
    const result = ctrl.registerEndpoint({
      controllerName: 'StoreController',
      method: 'PUT',
      path: '/store/settings',
      summary: '更新门店设置',
      description: '店长可以更新门店的营业时间、公告等配置',
    })
    assert.equal(result.success, true)
    assert.equal(result.endpoint.controllerName, 'StoreController')
    assert.equal(result.endpoint.method, 'PUT')
  })

  it('店长可以注册门店管理 Schema（正常流程）', () => {
    const result = ctrl.registerSchema({
      name: 'StoreSettings',
      schema: {
        type: 'object',
        properties: {
          storeId: { type: 'string' },
          openTime: { type: 'string' },
          closeTime: { type: 'string' },
          announcement: { type: 'string' },
        },
      },
    })
    assert.equal(result.success, true)
    assert.equal(result.name, 'StoreSettings')
  })

  it('店长可以生成门店管理 API 文档（正常流程）', () => {
    ctrl.registerEndpoint({ controllerName: 'StoreController', method: 'GET', path: '/store/info', summary: '门店信息' })
    ctrl.registerEndpoint({ controllerName: 'StoreController', method: 'POST', path: '/store/announcement', summary: '发布公告' })

    const doc = ctrl.generate({
      title: '门店管理文档',
      version: '1.0.0',
      format: DocExportFormatEnum.OPENAPI_YAML,
      description: '门店日常运营管理 API 文档',
    })
    assert.equal(doc.title, '门店管理文档')
    assert.equal(doc.format, DocExportFormatEnum.OPENAPI_YAML)
    assert.ok(doc.content.length > 0)
  })

  it('店长可以查看文档统计了解门店模块覆盖情况', () => {
    ctrl.registerEndpoint({ controllerName: 'StoreController', method: 'GET', path: '/store/info', summary: '门店信息' })
    ctrl.registerEndpoint({ controllerName: 'StoreController', method: 'PUT', path: '/store/settings', summary: '更新设置' })
    ctrl.registerEndpoint({ controllerName: 'StoreController', method: 'GET', path: '/store/stats', summary: '门店统计' })
    ctrl.registerSchema({ name: 'StoreInfo', schema: { type: 'object' } })

    const stats = ctrl.getStats()
    assert.equal(stats.totalEndpoints, 3)
    assert.equal(stats.totalSchemas, 1)
    assert.equal(stats.endpointMethods.GET, 2)
    assert.equal(stats.endpointMethods.PUT, 1)
  })

  it('店长可以注册新端点为已废弃但保留兼容（边界）', () => {
    const result = ctrl.registerEndpoint({
      controllerName: 'StoreController',
      method: 'GET',
      path: '/store/legacy-setting',
      summary: '旧版设置接口',
      description: '已废弃，请使用 /store/settings',
      deprecated: true,
    })
    assert.equal(result.success, true)
    assert.equal(result.endpoint.deprecated, true)
  })

  it('店长可以同时查询已注册和未注册端点路径（边界）', () => {
    ctrl.registerEndpoint({ controllerName: 'StoreController', method: 'GET', path: '/store/info', summary: '门店信息' })

    // 已注册路径
    const existing = ctrl.getEndpointByPath('store/info')
    assert.equal(existing.path, '/store/info')

    // 未注册路径
    assert.throws(
      () => ctrl.getEndpointByPath('store/nonexistent'),
      /not found/,
    )
  })
})
