/**
 * doc.controller.test.ts - API文档模块控制器测试
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { Test, TestingModule } from '@nestjs/testing'
import { DocController } from './doc.controller'
import { SwaggerGenService } from './swagger-gen.service'
import { DocExportFormatEnum } from './doc.dto'
import { NotFoundException } from '@nestjs/common'

describe('DocController', () => {
  let controller: DocController
  let service: SwaggerGenService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DocController],
      providers: [SwaggerGenService],
    }).compile()

    controller = module.get<DocController>(DocController)
    service = module.get<SwaggerGenService>(SwaggerGenService)
  })

  describe('POST /docs/generate', () => {
    it('正例: 生成 OpenAPI JSON 文档', () => {
      const result = controller.generate({
        title: 'Test API',
        version: '1.0.0',
        description: 'Test description',
        format: 'openapi-json' as any,
        servers: ['https://api.test.com'],
        tags: [],
      })

      expect(result.title).toBe('Test API')
      expect(result.version).toBe('1.0.0')
      expect(result.format).toBe('openapi-json')
      expect(result.content).toBeTruthy()
      expect(result.sizeBytes).toBeGreaterThan(0)
      expect(result.generatedAt).toBeTruthy()

      // 验证 JSON 可解析
      expect(() => JSON.parse(result.content)).not.toThrow()
    })

    it('正例: 生成 Redoc HTML 文档', () => {
      const result = controller.generate({
        title: 'Redoc API',
        version: '2.0.0',
        format: 'redoc-html' as any,
      })

      expect(result.format).toBe('redoc-html')
      expect(result.content).toContain('<redoc')
      expect(result.content).toContain('redoc.standalone.js')
    })

    it('正例: 生成 Postman Collection', () => {
      // 先注册一个端点
      controller.registerEndpoint({
        controllerName: 'TestController',
        method: 'GET',
        path: '/api/test',
        summary: 'Test endpoint',
      })

      const result = controller.generate({
        title: 'Postman API',
        version: '1.0.0',
        format: 'postman-collection' as any,
      })

      expect(result.format).toBe('postman-collection')
      expect(result.content).toContain('schema.getpostman.com')
    })

    it('正例: 生成 Insomnia 导出', () => {
      const result = controller.generate({
        title: 'Insomnia API',
        version: '1.0.0',
        format: 'insomnia-export' as any,
      })
      expect(result.format).toBe('insomnia-export')
      expect(result.content).toContain('_type')
    })

    it('边界: 空服务器列表', () => {
      const result = controller.generate({
        title: 'No Servers',
        version: '1.0.0',
        format: 'openapi-json' as any,
      })
      const parsed = JSON.parse(result.content)
      expect(parsed.servers).toBeDefined()
    })
  })

  describe('POST /docs/endpoints', () => {
    it('正例: 注册端点成功', () => {
      const result = controller.registerEndpoint({
        controllerName: 'UserController',
        method: 'GET',
        path: '/api/users',
        summary: 'Get users',
        description: '获取用户列表',
      })

      expect(result.success).toBe(true)
      expect(result.endpoint.controllerName).toBe('UserController')
      expect(result.endpoint.summary).toBe('Get users')
    })

    it('正例: 注册带弃用标记的端点', () => {
      const result = controller.registerEndpoint({
        controllerName: 'OldCtrl',
        method: 'POST',
        path: '/api/v1/old',
        summary: 'Legacy',
        deprecated: true,
      })
      expect(result.endpoint.deprecated).toBe(true)
    })
  })

  describe('POST /docs/schemas', () => {
    it('正例: 注册 Schema 成功', () => {
      const result = controller.registerSchema({
        name: 'User',
        schema: { type: 'object', properties: { id: { type: 'string' } } },
      })
      expect(result.success).toBe(true)
      expect(result.name).toBe('User')
    })
  })

  describe('POST /docs/security-schemes', () => {
    it('正例: 注册安全方案成功', () => {
      const result = controller.registerSecurityScheme({
        name: 'bearer',
        type: 'http',
        scheme: 'bearer',
        description: 'Bearer token',
      })
      expect(result.success).toBe(true)
      expect(result.name).toBe('bearer')
    })
  })

  describe('POST /docs/tags', () => {
    it('正例: 添加 Tag 成功', () => {
      const result = controller.addTag({
        name: 'users',
        description: '用户相关端点',
      })
      expect(result.success).toBe(true)
      expect(result.name).toBe('users')
    })
  })

  describe('GET /docs/stats', () => {
    it('正例: 初始统计为 0', () => {
      const stats = controller.getStats()
      expect(stats.totalEndpoints).toBe(0)
      expect(stats.totalSchemas).toBe(0)
      expect(stats.lastGeneratedAt).toBeUndefined()
    })

    it('正例: 注册后统计更新', () => {
      controller.registerEndpoint({
        controllerName: 'UserCtrl',
        method: 'GET',
        path: '/api/users',
        summary: 'Get users',
      })
      controller.registerEndpoint({
        controllerName: 'UserCtrl',
        method: 'POST',
        path: '/api/users',
        summary: 'Create user',
      })

      const stats = controller.getStats()
      expect(stats.totalEndpoints).toBe(2)
      expect(stats.endpointMethods.GET).toBe(1)
      expect(stats.endpointMethods.POST).toBe(1)
    })
  })

  describe('GET /docs/endpoints', () => {
    it('正例: 列出已注册端点', () => {
      controller.registerEndpoint({
        controllerName: 'TestCtrl',
        method: 'GET',
        path: '/api/test',
        summary: 'Test',
      })

      const list = controller.listEndpoints()
      expect(list).toHaveLength(1)
      expect(list[0].path).toBe('/api/test')
    })

    it('正例: 空列表', () => {
      const list = controller.listEndpoints()
      expect(list).toHaveLength(0)
    })
  })

  describe('GET /docs/endpoints/:path', () => {
    it('正例: 按路径查询端点', () => {
      controller.registerEndpoint({
        controllerName: 'Test',
        method: 'GET',
        path: '/api/hello',
        summary: 'Hello',
      })

      const ep = controller.getEndpointByPath('api/hello')
      expect(ep.path).toBe('/api/hello')
    })

    it('反例: 不存在的路径应抛 NotFoundException', () => {
      expect(() => controller.getEndpointByPath('api/nonexistent')).toThrow(NotFoundException)
    })
  })

  describe('GET /docs/index', () => {
    it('正例: 生成索引页 HTML', () => {
      const result = controller.getIndexPage('My Docs', '1.0.0')
      expect(result.html).toContain('<h1>')
      expect(result.html).toContain('My Docs')
      expect(result.generatedAt).toBeTruthy()
    })

    it('正例: 默认参数生成', () => {
      const result = controller.getIndexPage()
      expect(result.html).toContain('API Documentation Index')
    })
  })

  describe('GET /docs/health', () => {
    it('正例: 健康检查返回 ok', () => {
      const result = controller.healthCheck()
      expect(result.status).toBe('ok')
      expect(result.uptime).toBeGreaterThan(0)
    })
  })

  describe('GET /docs/config / POST /docs/config', () => {
    it('正例: 获取配置返回 null（默认无持久化）', () => {
      const config = controller.getConfig()
      expect(config).toBeNull()
    })

    it('正例: 更新配置成功', () => {
      const result = controller.updateConfig({ title: 'New Title' })
      expect(result.success).toBe(true)
    })
  })
})
