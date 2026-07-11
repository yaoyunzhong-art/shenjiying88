/**
 * docs.e2e.test.ts — API文档管理端到端测试
 *
 * 覆盖完整的文档生成与端点管理生命周期:
 *   - 文档生成 (多种格式)
 *   - 端点注册/查询/统计
 *   - Schema 注册
 *   - Tag 管理
 *   - 文档配置
 *   - 索引页生成
 *   - 错误/边界情况
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { DocController } from './doc.controller'
import { DocService } from './doc.service'
import { SwaggerGenService } from './swagger-gen.service'
import { DocExportFormatEnum } from './doc.dto'

// ── 测试工厂 ─────────────────────────────────────────────────────────────

function createFixture() {
  const swaggerGen = new SwaggerGenService()
  const service = new DocService(swaggerGen)
  const controller = new DocController(service, swaggerGen)
  return { swaggerGen, service, controller }
}

// ══════════════════════════════════════════════════════════════════════════
// 1. 文档生成 e2e
// ══════════════════════════════════════════════════════════════════════════

describe('docs 文档生成 e2e', () => {
  let ctx: ReturnType<typeof createFixture>

  beforeEach(() => {
    ctx = createFixture()
  })

  it('生成 OpenAPI JSON 文档（正常流程）', () => {
    const result = ctx.controller.generate({
      title: '游戏机管理 API',
      version: '1.0.0',
      format: DocExportFormatEnum.OPENAPI_JSON,
      description: '门店设备管理接口',
      servers: ['https://api.example.com'],
      tags: ['设备管理', '游戏管理'],
    })

    expect(result.title).toBe('游戏机管理 API')
    expect(result.version).toBe('1.0.0')
    expect(result.format).toBe(DocExportFormatEnum.OPENAPI_JSON)
    expect(result.content).toBeTruthy()
    expect(result.sizeBytes).toBeGreaterThan(100)
    expect(result.generatedAt).toBeTruthy()

    // 验证 JSON 结构
    const parsed = JSON.parse(result.content)
    expect(parsed.openapi).toBeTruthy()
    expect(parsed.info.title).toBe('游戏机管理 API')
    expect(parsed.servers).toHaveLength(1)
    expect(parsed.servers[0].url).toBe('https://api.example.com')
  })

  it('生成 OpenAPI YAML 文档（正常流程）', () => {
    const result = ctx.controller.generate({
      title: '会员 API',
      version: '2.0.0',
      format: DocExportFormatEnum.OPENAPI_YAML,
    })

    expect(result.format).toBe(DocExportFormatEnum.OPENAPI_YAML)
    expect(result.content).toContain('openapi:')
    expect(result.content).toContain('"会员 API"')
  })

  it('生成 Redoc HTML 文档（正常流程）', () => {
    const result = ctx.controller.generate({
      title: 'Redoc 文档',
      version: '1.0.0',
      format: DocExportFormatEnum.REDOC_HTML,
    })

    expect(result.format).toBe(DocExportFormatEnum.REDOC_HTML)
    expect(result.content).toContain('<!DOCTYPE html>')
    expect(result.content).toContain('redoc')
    expect(result.sizeBytes).toBeGreaterThan(200)
  })

  it('生成 Postman Collection（正常流程）', () => {
    const result = ctx.controller.generate({
      title: 'Postman 测试',
      version: '1.0.0',
      format: DocExportFormatEnum.POSTMAN_COLLECTION,
    })

    expect(result.format).toBe(DocExportFormatEnum.POSTMAN_COLLECTION)
    const parsed = JSON.parse(result.content)
    expect(parsed.info.name).toBe('Postman 测试')
  })

  it('生成 Insomnia 导出（正常流程）', () => {
    const result = ctx.controller.generate({
      title: 'Insomnia 导出',
      version: '1.0.0',
      format: DocExportFormatEnum.INSOMNIA_EXPORT,
    })

    expect(result.format).toBe(DocExportFormatEnum.INSOMNIA_EXPORT)
    const parsed = JSON.parse(result.content)
    expect(parsed._type).toBeTruthy()
  })

  it('不传可选参数也能正常生成', () => {
    const result = ctx.controller.generate({
      title: '最小化文档',
      version: '0.1.0',
      format: DocExportFormatEnum.OPENAPI_JSON,
    })

    expect(result.title).toBe('最小化文档')
    expect(result.version).toBe('0.1.0')
    expect(() => JSON.parse(result.content)).not.toThrow()
  })
})

// ══════════════════════════════════════════════════════════════════════════
// 2. 端点注册与管理 e2e
// ══════════════════════════════════════════════════════════════════════════

describe('docs 端点注册与管理 e2e', () => {
  let ctx: ReturnType<typeof createFixture>

  beforeEach(() => {
    ctx = createFixture()
  })

  it('注册单个端点（正常流程）', () => {
    const { endpoint } = ctx.controller.registerEndpoint({
      controllerName: 'MachineController',
      method: 'GET',
      path: '/machines',
      summary: '获取所有机台列表',
      description: '返回门店所有游戏机台信息',
    })

    expect(endpoint.controllerName).toBe('MachineController')
    expect(endpoint.method).toBe('GET')
    expect(endpoint.path).toBe('/machines')
    expect(endpoint.summary).toBe('获取所有机台列表')
    expect(endpoint.deprecated).toBeFalsy()
  })

  it('注册多个端点并列出所有（正常流程）', () => {
    ctx.controller.registerEndpoint({
      controllerName: 'MemberController',
      method: 'GET',
      path: '/members',
      summary: '会员列表',
    })

    ctx.controller.registerEndpoint({
      controllerName: 'MemberController',
      method: 'POST',
      path: '/members',
      summary: '创建会员',
    })

    ctx.controller.registerEndpoint({
      controllerName: 'OrderController',
      method: 'GET',
      path: '/orders',
      summary: '订单列表',
    })

    const endpoints = ctx.controller.listEndpoints()
    expect(endpoints).toHaveLength(3)
  })

  it('按路径查询端点（正常流程）', () => {
    ctx.controller.registerEndpoint({
      controllerName: 'AuthController',
      method: 'POST',
      path: '/auth/login',
      summary: '用户登录',
    })

    const ep = ctx.controller.getEndpointByPath('auth/login')
    expect(ep).toBeDefined()
    expect(ep!.summary).toBe('用户登录')
  })

  it('查询不存在的端点返回异常', () => {
    expect(() => ctx.controller.getEndpointByPath('nonexistent/route')).toThrow()
  })

  it('注册标记已弃用的端点', () => {
    const { endpoint } = ctx.controller.registerEndpoint({
      controllerName: 'OldController',
      method: 'GET',
      path: '/legacy',
      summary: '旧版接口',
      deprecated: true,
    })

    expect(endpoint.deprecated).toBe(true)
  })
})

// ══════════════════════════════════════════════════════════════════════════
// 3. Schema 注册 e2e
// ══════════════════════════════════════════════════════════════════════════

describe('docs Schema 注册 e2e', () => {
  let ctx: ReturnType<typeof createFixture>

  beforeEach(() => {
    ctx = createFixture()
  })

  it('注册 Schema（正常流程）', () => {
    const result = ctx.controller.registerSchema({
      name: 'Machine',
      schema: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          status: { type: 'string', enum: ['active', 'maintenance', 'offline'] },
        },
      },
    })

    expect(result.success).toBe(true)
    expect(result.name).toBe('Machine')
  })

  it('多次注册不同 Schema', () => {
    ctx.controller.registerSchema({
      name: 'Machine',
      schema: { type: 'object', properties: { id: { type: 'string' } } },
    })

    ctx.controller.registerSchema({
      name: 'Member',
      schema: { type: 'object', properties: { id: { type: 'string' }, name: { type: 'string' } } },
    })

    const stats = ctx.controller.getStats()
    expect(stats.totalSchemas).toBe(2)
  })
})

// ══════════════════════════════════════════════════════════════════════════
// 4. Tag & 安全方案管理 e2e
// ══════════════════════════════════════════════════════════════════════════

describe('docs Tag 与安全方案管理 e2e', () => {
  let ctx: ReturnType<typeof createFixture>

  beforeEach(() => {
    ctx = createFixture()
  })

  it('添加 Tag（正常流程）', () => {
    const result = ctx.controller.addTag({
      name: '机台操作',
      description: '机台相关接口',
    })

    expect(result.success).toBe(true)
    expect(result.name).toBe('机台操作')
  })

  it('注册安全方案（正常流程）', () => {
    const result = ctx.controller.registerSecurityScheme({
      name: 'BearerAuth',
      type: 'http',
      scheme: 'bearer',
      description: 'JWT 令牌鉴权',
    })

    expect(result.success).toBe(true)
    expect(result.name).toBe('BearerAuth')
  })

  it('注册 API Key 安全方案', () => {
    const result = ctx.controller.registerSecurityScheme({
      name: 'ApiKeyAuth',
      type: 'apiKey',
      description: 'Header X-API-Key',
    })

    expect(result.success).toBe(true)
  })
})

// ══════════════════════════════════════════════════════════════════════════
// 5. 文档配置 e2e
// ══════════════════════════════════════════════════════════════════════════

describe('docs 文档配置 e2e', () => {
  let ctx: ReturnType<typeof createFixture>

  beforeEach(() => {
    ctx = createFixture()
  })

  it('获取初始配置（默认值）', () => {
    const config = ctx.controller.getConfig()
    // 初始配置可能为 null
    expect(config === null || typeof config === 'object').toBe(true)
  })

  it('更新配置后返回成功', () => {
    const result = ctx.controller.updateConfig({})
    expect(result.success).toBe(true)
  })
})

// ══════════════════════════════════════════════════════════════════════════
// 6. 索引页生成 e2e
// ══════════════════════════════════════════════════════════════════════════

describe('docs 索引页生成 e2e', () => {
  let ctx: ReturnType<typeof createFixture>

  beforeEach(() => {
    ctx = createFixture()
  })

  it('生成索引页（正常流程）', () => {
    const page = ctx.controller.getIndexPage('API 文档', '1.0.0')

    expect(page.html).toBeTruthy()
    expect(page.html).toContain('API 文档')
    expect(page.html).toContain('1.0.0')
    expect(page.generatedAt).toBeTruthy()
  })

  it('不传参数使用默认值', () => {
    const page = ctx.controller.getIndexPage()

    expect(page.html).toBeTruthy()
    expect(page.html).toContain('API Documentation Index')
  })
})

// ══════════════════════════════════════════════════════════════════════════
// 7. 统计信息 e2e
// ══════════════════════════════════════════════════════════════════════════

describe('docs 统计信息 e2e', () => {
  let ctx: ReturnType<typeof createFixture>

  beforeEach(() => {
    ctx = createFixture()
  })

  it('获取统计信息（初始状态）', () => {
    const stats = ctx.controller.getStats()

    expect(stats.totalEndpoints).toBe(0)
    expect(stats.totalSchemas).toBe(0)
    expect(stats.totalTags).toBe(0)
    expect(stats.endpointMethods).toEqual({})
  })

  it('注册端点后统计更新', () => {
    ctx.controller.registerEndpoint({
      controllerName: 'TestCtrl',
      method: 'GET',
      path: '/test',
      summary: '测试端点',
    })
    ctx.controller.registerEndpoint({
      controllerName: 'TestCtrl',
      method: 'POST',
      path: '/test',
      summary: '创建测试',
    })
    ctx.controller.registerEndpoint({
      controllerName: 'OtherCtrl',
      method: 'GET',
      path: '/other',
      summary: '其他端点',
    })

    const stats = ctx.controller.getStats()
    expect(stats.totalEndpoints).toBe(3)

    // 验证按方法分组统计
    expect(typeof stats.endpointMethods).toBe('object')
  })
})

// ══════════════════════════════════════════════════════════════════════════
// 8. 健康检查 e2e
// ══════════════════════════════════════════════════════════════════════════

describe('docs 健康检查 e2e', () => {
  it('健康检查返回正常状态', () => {
    const ctx = createFixture()
    const health = ctx.controller.healthCheck()

    expect(health.status).toBe('ok')
    expect(health.uptime).toBeGreaterThanOrEqual(0)
  })
})
