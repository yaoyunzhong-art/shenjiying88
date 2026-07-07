/**
 * doc.entity.test.ts - API文档模块实体测试
 */

import { describe, it, expect } from 'vitest'
import type {
  DocGenerateRequest,
  DocGenerateResponse,
  DocConfig,
  DocEndpointInfo,
  DocStats,
  DocPageOptions,
} from './doc.entity'

describe('DocEntity - 文档实体定义', () => {
  describe('DocGenerateRequest', () => {
    it('正例: 应该能构造完整生成请求', () => {
      const request: DocGenerateRequest = {
        title: 'My API',
        version: '1.0.0',
        description: 'API documentation',
        format: 'openapi-json',
        servers: ['https://api.example.com'],
        tags: ['users', 'orders'],
      }
      expect(request.title).toBe('My API')
      expect(request.version).toBe('1.0.0')
      expect(request.format).toBe('openapi-json')
      expect(request.servers).toHaveLength(1)
      expect(request.tags).toHaveLength(2)
    })

    it('正例: 最小请求 (仅必填)', () => {
      const request: DocGenerateRequest = {
        title: 'Minimal',
        version: '0.0.1',
        format: 'redoc-html',
      }
      expect(request.title).toBe('Minimal')
      expect(request.description).toBeUndefined()
      expect(request.servers).toBeUndefined()
    })

    it('边界: 空标题应该被允许', () => {
      const request: DocGenerateRequest = {
        title: '',
        version: '1.0.0',
        format: 'openapi-yaml',
      }
      // 实体层面允许空字符串（DTO 层面由 class-validator 限制）
      expect(request.title).toBe('')
    })
  })

  describe('DocGenerateResponse', () => {
    it('正例: 应该能构造完整响应对象', () => {
      const response: DocGenerateResponse = {
        title: 'My API',
        version: '1.0.0',
        format: 'postman-collection',
        content: '{"info":{}}',
        generatedAt: '2026-07-06T08:00:00.000Z',
        sizeBytes: 15,
      }
      expect(response.title).toBe('My API')
      expect(response.sizeBytes).toBe(15)
      expect(response.generatedAt).toBeTruthy()
    })

    it('边界: sizeBytes 可为 0 (空文档)', () => {
      const response: DocGenerateResponse = {
        title: 'Empty',
        version: '0.0.0',
        format: 'openapi-json',
        content: '',
        generatedAt: new Date().toISOString(),
        sizeBytes: 0,
      }
      expect(response.sizeBytes).toBe(0)
    })
  })

  describe('DocConfig', () => {
    it('正例: 应该能构造文档配置', () => {
      const config: DocConfig = {
        id: 'cfg-001',
        title: 'Production API',
        description: '生产环境 API 文档',
        version: '2.0.0',
        defaultFormat: 'redoc-html',
        servers: ['https://api.prod.com'],
        enabledTags: ['members', 'transactions'],
        securitySchemes: [
          { name: 'bearer', type: 'http', scheme: 'bearer' },
        ],
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-06-01T00:00:00.000Z',
      }
      expect(config.id).toBe('cfg-001')
      expect(config.securitySchemes).toHaveLength(1)
      expect(config.enabledTags).toContain('members')
    })
  })

  describe('DocEndpointInfo', () => {
    it('正例: 应该能构造端点信息', () => {
      const ep: DocEndpointInfo = {
        controllerName: 'MemberController',
        method: 'GET',
        path: '/api/members',
        summary: '获取成员列表',
        description: '支持分页和筛选',
      }
      expect(ep.method).toBe('GET')
      expect(ep.deprecated).toBeUndefined()
    })

    it('正例: 带弃用标记', () => {
      const ep: DocEndpointInfo = {
        controllerName: 'OldController',
        method: 'POST',
        path: '/api/v1/old',
        summary: '旧接口',
        deprecated: true,
      }
      expect(ep.deprecated).toBe(true)
    })

    it('边界: 所有 HTTP 方法都支持', () => {
      const methods: DocEndpointInfo['method'][] = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']
      for (const method of methods) {
        const ep: DocEndpointInfo = {
          controllerName: 'TestController',
          method,
          path: '/test',
          summary: `Test ${method}`,
        }
        expect(ep.method).toBe(method)
      }
    })
  })

  describe('DocStats', () => {
    it('正例: 应该能构造统计信息', () => {
      const stats: DocStats = {
        totalEndpoints: 42,
        totalSchemas: 15,
        totalTags: 8,
        endpointMethods: { GET: 20, POST: 12, PUT: 6, DELETE: 4 },
        generatedFormats: ['openapi-json', 'redoc-html'],
        lastGeneratedAt: '2026-07-06T00:00:00.000Z',
      }
      expect(stats.totalEndpoints).toBe(42)
      expect(stats.endpointMethods.GET).toBe(20)
    })

    it('边界: 空统计', () => {
      const stats: DocStats = {
        totalEndpoints: 0,
        totalSchemas: 0,
        totalTags: 0,
        endpointMethods: {},
        generatedFormats: [],
      }
      expect(stats.totalEndpoints).toBe(0)
      expect(Object.keys(stats.endpointMethods)).toHaveLength(0)
      expect(stats.lastGeneratedAt).toBeUndefined()
    })
  })

  describe('DocPageOptions', () => {
    it('正例: 应该能构造页面选项', () => {
      const options: DocPageOptions = {
        title: 'My API Docs',
        version: '1.0.0',
        description: '文档站',
        logoUrl: 'https://example.com/logo.png',
        theme: 'dark',
        showTags: true,
        sortEndpoints: 'alpha',
      }
      expect(options.theme).toBe('dark')
      expect(options.sortEndpoints).toBe('alpha')
    })

    it('正例: 所有主题值', () => {
      const themes: DocPageOptions['theme'][] = ['light', 'dark', 'auto']
      for (const theme of themes) {
        const opts: DocPageOptions = {
          title: 'Test',
          version: '1.0.0',
          theme,
        }
        expect(opts.theme).toBe(theme)
      }
    })

    it('边界: 最小选项', () => {
      const options: DocPageOptions = {
        title: 'Minimal',
        version: '1.0.0',
      }
      expect(options.logoUrl).toBeUndefined()
      expect(options.showTags).toBeUndefined()
    })
  })
})
