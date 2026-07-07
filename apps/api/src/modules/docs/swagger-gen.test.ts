import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * swagger-gen.test.ts - Phase-24 T129-1
 * SwaggerGenService API 文档生成服务单元测试
 */
import 'reflect-metadata'
import { SwaggerGenService, type OpenAPISpec, type EndpointInfo } from './swagger-gen.service'

describe('SwaggerGenService', () => {
  let svc: SwaggerGenService

  beforeEach(() => {
    svc = new SwaggerGenService()
  })

  // ── generateSpec ────────────────────────────────────────────────────────────

  describe('generateSpec', () => {
    it('生成有效 OpenAPI 3.0 规范', () => {
      const spec = svc.generateSpec({
        title: 'Test API',
        version: '1.0.0',
        description: 'Test API Description',
      })

      expect(spec.openapi).toBe('3.0.3')
      expect(spec.info.title).toBe('Test API')
      expect(spec.info.version).toBe('1.0.0')
      expect(spec.info.description).toBe('Test API Description')
    })

    it('生成规范包含 paths 对象', () => {
      const spec = svc.generateSpec({
        title: 'Test API',
        version: '1.0.0',
      })

      expect(spec.paths).toBeDefined()
      expect(typeof spec.paths).toBe('object')
    })
  })

  // ── registerEndpoint ────────────────────────────────────────────────────────

  describe('registerEndpoint', () => {
    it('注册端点后路径正确', () => {
      const endpoint: EndpointInfo = {
        method: 'GET',
        path: '/users',
        summary: '获取用户列表',
        responses: [{ statusCode: 200, description: '成功' }],
      }

      svc.registerEndpoint('UserController', endpoint)
      const spec = svc.generateSpec({ title: 'Test', version: '1.0.0' })

      expect(spec.paths['/users']).toBeDefined()
      expect(spec.paths['/users']['get']).toBeDefined()
      expect(spec.paths['/users']['get'].summary).toBe('获取用户列表')
    })

    it('注册多个端点到同一路径', () => {
      svc.registerEndpoint('UserController', {
        method: 'GET',
        path: '/users',
        summary: '获取用户列表',
        responses: [{ statusCode: 200, description: '成功' }],
      })

      svc.registerEndpoint('UserController', {
        method: 'POST',
        path: '/users',
        summary: '创建用户',
        responses: [{ statusCode: 201, description: '创建成功' }],
      })

      const spec = svc.generateSpec({ title: 'Test', version: '1.0.0' })

      expect(spec.paths['/users']['get']).toBeDefined()
      expect(spec.paths['/users']['post']).toBeDefined()
    })
  })

  // ── registerSchema ─────────────────────────────────────────────────────────

  describe('registerSchema', () => {
    it('组件中包含 schema', () => {
      svc.registerSchema('User', {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
        },
      })

      const spec = svc.generateSpec({ title: 'Test', version: '1.0.0' })

      expect(spec.components?.schemas).toBeDefined()
      expect(spec.components?.schemas?.['User']).toBeDefined()
      expect(spec.components?.schemas?.['User']).toEqual({
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
        },
      })
    })
  })

  // ── registerSecurityScheme ─────────────────────────────────────────────────

  describe('registerSecurityScheme', () => {
    it('添加 BearerAuth 安全方案', () => {
      svc.registerSecurityScheme('BearerAuth', {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'JWT Bearer Token 认证',
      })

      const spec = svc.generateSpec({ title: 'Test', version: '1.0.0' })

      expect(spec.components?.securitySchemes).toBeDefined()
      expect(spec.components?.securitySchemes?.['BearerAuth']).toBeDefined()
      expect(spec.components?.securitySchemes?.['BearerAuth'].type).toBe('http')
      expect(spec.components?.securitySchemes?.['BearerAuth'].scheme).toBe('bearer')
      expect(spec.components?.securitySchemes?.['BearerAuth'].bearerFormat).toBe('JWT')
    })
  })

  // ── exportJSON ─────────────────────────────────────────────────────────────

  describe('exportJSON', () => {
    it('输出有效 JSON', () => {
      const spec = svc.generateSpec({
        title: 'Test API',
        version: '1.0.0',
      })

      const json = svc.exportJSON(spec)

      expect(() => JSON.parse(json)).not.toThrow()
      const parsed = JSON.parse(json)
      expect(parsed.openapi).toBe('3.0.3')
      expect(parsed.info.title).toBe('Test API')
    })

    it('JSON 输出包含正确缩进', () => {
      const spec = svc.generateSpec({
        title: 'Test API',
        version: '1.0.0',
      })

      const json = svc.exportJSON(spec)

      expect(json).toContain('  "openapi": "3.0.3"')
    })
  })

  // ── exportYAML ─────────────────────────────────────────────────────────────

  describe('exportYAML', () => {
    it('输出有效 YAML', () => {
      const spec = svc.generateSpec({
        title: 'Test API',
        version: '1.0.0',
      })

      const yaml = svc.exportYAML(spec)

      expect(yaml).toContain('openapi: "3.0.3"')
      expect(yaml).toContain('title: "Test API"')
      expect(yaml).toContain('version: "1.0.0"')
    })

    it('YAML 输出带缩进', () => {
      const spec = svc.generateSpec({
        title: 'Test API',
        version: '1.0.0',
      })

      const yaml = svc.exportYAML(spec)

      // Check for indentation (2 spaces) in nested values
      expect(yaml).toContain('  title: "Test API"')
      expect(yaml).toContain('  version: "1.0.0"')
    })
  })

  // ── exportRedocHTML ────────────────────────────────────────────────────────

  describe('exportRedocHTML', () => {
    it('输出完整 HTML', () => {
      const spec = svc.generateSpec({
        title: 'Test API',
        version: '1.0.0',
      })

      const html = svc.exportRedocHTML(spec)

      expect(html).toContain('<!DOCTYPE html>')
      expect(html).toContain('</html>')
    })

    it('HTML 包含 Redoc CDN', () => {
      const spec = svc.generateSpec({
        title: 'Test API',
        version: '1.0.0',
      })

      const html = svc.exportRedocHTML(spec)

      expect(html).toContain('redoc@next')
      expect(html).toContain('cdn.jsdelivr.net')
    })

    it('HTML 包含内嵌 OpenAPI JSON', () => {
      const spec = svc.generateSpec({
        title: 'Test API',
        version: '1.0.0',
      })

      const html = svc.exportRedocHTML(spec)

      expect(html).toContain('application/json')
      expect(html).toContain('3.0.3')
    })
  })

  // ── exportPostman ──────────────────────────────────────────────────────────

  describe('exportPostman', () => {
    it('生成 Postman Collection', () => {
      svc.registerEndpoint('UserController', {
        method: 'GET',
        path: '/users',
        summary: '获取用户列表',
        responses: [{ statusCode: 200, description: '成功' }],
      })

      const spec = svc.generateSpec({ title: 'Test API', version: '1.0.0' })
      const postman = svc.exportPostman(spec)

      const parsed = JSON.parse(postman)
      expect(parsed.info).toBeDefined()
      expect(parsed.info.schema).toContain('postman.com')
      expect(parsed.item).toBeDefined()
      expect(Array.isArray(parsed.item)).toBe(true)
    })

    it('Postman Collection 包含端点请求', () => {
      svc.registerEndpoint('UserController', {
        method: 'GET',
        path: '/users',
        summary: '获取用户列表',
        responses: [{ statusCode: 200, description: '成功' }],
      })

      const spec = svc.generateSpec({ title: 'Test API', version: '1.0.0' })
      const postman = svc.exportPostman(spec)

      const parsed = JSON.parse(postman)
      expect(parsed.item[0].name).toBe('获取用户列表')
      expect(parsed.item[0].request.method).toBe('GET')
    })
  })

  // ── exportInsomnia ─────────────────────────────────────────────────────────

  describe('exportInsomnia', () => {
    it('生成 Insomnia 格式', () => {
      svc.registerEndpoint('UserController', {
        method: 'GET',
        path: '/users',
        summary: '获取用户列表',
        responses: [{ statusCode: 200, description: '成功' }],
      })

      const spec = svc.generateSpec({ title: 'Test API', version: '1.0.0' })
      const insomnia = svc.exportInsomnia(spec)

      const parsed = JSON.parse(insomnia)
      expect(parsed._type).toBe('export')
      expect(parsed.resources).toBeDefined()
      expect(Array.isArray(parsed.resources)).toBe(true)
    })

    it('Insomnia 导出包含 OpenAPI 文档', () => {
      const spec = svc.generateSpec({ title: 'Test API', version: '1.0.0' })
      const insomnia = svc.exportInsomnia(spec)

      const parsed = JSON.parse(insomnia)
      const openapiResource = parsed.resources.find((r: { type: string }) => r.type === 'openapi')
      expect(openapiResource).toBeDefined()
      expect(openapiResource.data.openapi).toBe('3.0.3')
    })
  })

  // ── addTag ─────────────────────────────────────────────────────────────────

  describe('addTag', () => {
    it('添加 tag 描述', () => {
      svc.addTag('users', '用户管理相关接口')

      const spec = svc.generateSpec({ title: 'Test', version: '1.0.0' })

      expect(spec.tags).toBeDefined()
      expect(spec.tags!.length).toBe(1)
      expect(spec.tags![0].name).toBe('users')
      expect(spec.tags![0].description).toBe('用户管理相关接口')
    })

    it('更新已有 tag 的描述', () => {
      svc.addTag('users', '第一次描述')
      svc.addTag('users', '更新后的描述')

      const spec = svc.generateSpec({ title: 'Test', version: '1.0.0' })

      expect(spec.tags!.length).toBe(1)
      expect(spec.tags![0].description).toBe('更新后的描述')
    })
  })

  // ── addServer ──────────────────────────────────────────────────────────────

  describe('addServer', () => {
    it('添加服务器', () => {
      svc.addServer('https://api.example.com', '生产环境')

      const spec = svc.generateSpec({ title: 'Test', version: '1.0.0' })

      expect(spec.servers).toBeDefined()
      expect(spec.servers!.length).toBe(1)
      expect(spec.servers![0].url).toBe('https://api.example.com')
      expect(spec.servers![0].description).toBe('生产环境')
    })
  })

  // ── generateIndex ───────────────────────────────────────────────────────────

  describe('generateIndex', () => {
    it('输出文档索引页', () => {
      svc.registerEndpoint('UserController', {
        method: 'GET',
        path: '/users',
        summary: '获取用户列表',
        responses: [{ statusCode: 200, description: '成功' }],
      })

      svc.registerEndpoint('UserController', {
        method: 'POST',
        path: '/users',
        summary: '创建用户',
        responses: [{ statusCode: 201, description: '创建成功' }],
      })

      const spec = svc.generateSpec({ title: 'Test API', version: '1.0.0' })
      const index = svc.generateIndex(spec)

      expect(index).toContain('<!DOCTYPE html>')
      expect(index).toContain('Test API')
      expect(index).toContain('1.0.0')
      expect(index).toContain('/users')
    })

    it('索引页包含所有端点', () => {
      svc.registerEndpoint('UserController', {
        method: 'GET',
        path: '/users',
        summary: '获取用户列表',
        responses: [{ statusCode: 200, description: '成功' }],
      })

      svc.registerEndpoint('OrderController', {
        method: 'GET',
        path: '/orders',
        summary: '获取订单列表',
        responses: [{ statusCode: 200, description: '成功' }],
      })

      const spec = svc.generateSpec({ title: 'Test API', version: '1.0.0' })
      const index = svc.generateIndex(spec)

      expect(index).toContain('/users')
      expect(index).toContain('/orders')
    })
  })

  // ── parseJSDocAnnotations ─────────────────────────────────────────────────

  describe('parseJSDocAnnotations', () => {
    it('返回空注解默认值', () => {
      const result = svc.parseJSDocAnnotations('NonExistentController', 'nonExistentMethod')

      expect(result.summary).toBe('')
      expect(result.description).toBe('')
      expect(result.params).toEqual({})
      expect(result.returns).toBe('')
    })

    it('返回已设置的注解', () => {
      svc.setJSDocAnnotation('UserController', 'getUsers', {
        summary: '获取用户列表',
        description: '返回所有用户信息',
        params: { id: '用户ID', name: '用户名' },
        returns: '用户数组',
      })

      const result = svc.parseJSDocAnnotations('UserController', 'getUsers')

      expect(result.summary).toBe('获取用户列表')
      expect(result.description).toBe('返回所有用户信息')
      expect(result.params).toEqual({ id: '用户ID', name: '用户名' })
      expect(result.returns).toBe('用户数组')
    })
  })
})
