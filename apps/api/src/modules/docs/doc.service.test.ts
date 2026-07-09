/**
 * doc.service.test.ts - DocService 单元测试
 *
 * 覆盖：
 *   - DocService 基础构造与依赖注入
 *   - generate 文档生成（各格式）
 *   - registerEndpoint / listEndpoints / getEndpointByPath
 *   - registerSchema
 *   - getStats
 *   - getConfig / updateConfig
 *   - generateIndex
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { DocService } from './doc.service'
import { SwaggerGenService } from './swagger-gen.service'
import type { DocExportFormat } from './doc.entity'

// ═══════════════════════════════════════════════════════════════
// 辅助：创建真实 DocService 实例
// ═══════════════════════════════════════════════════════════════

function makeService(): DocService {
  const swagger = new SwaggerGenService()
  return new DocService(swagger)
}

// ═══════════════════════════════════════════════════════════════
// 测试套件
// ═══════════════════════════════════════════════════════════════

describe('DocService', () => {
  let service: DocService

  beforeEach(() => {
    service = makeService()
  })

  // ── generate ──────────────────────────────────────────────

  describe('generate()', () => {
    it('[D1] 生成 openapi-json 格式文档', () => {
      const res = service.generate('Test API', '1.0.0', 'openapi-json')
      expect(res.title).toBe('Test API')
      expect(res.version).toBe('1.0.0')
      expect(res.format).toBe('openapi-json')
      expect(res.sizeBytes).toBeGreaterThan(0)
      expect(() => JSON.parse(res.content)).not.toThrow()
    })

    it('[D2] 生成 openapi-yaml 格式文档', () => {
      const res = service.generate('YAML API', '2.0.0', 'openapi-yaml', 'A YAML test')
      expect(res.format).toBe('openapi-yaml')
      expect(res.content).toContain('openapi')
    })

    it('[D3] 生成 redoc-html 格式文档', () => {
      const res = service.generate('Redoc API', '1.0.0', 'redoc-html')
      expect(res.format).toBe('redoc-html')
      expect(res.content).toContain('<redoc')
    })

    it('[D4] 生成 postman-collection 格式文档', () => {
      const res = service.generate('Postman Coll', '1.0.0', 'postman-collection')
      expect(res.format).toBe('postman-collection')
      const parsed = JSON.parse(res.content)
      expect(parsed.info?.name).toBe('Postman Coll')
    })

    it('[D5] 生成 insomnia-export 格式文档', () => {
      const res = service.generate('Insomnia', '1.0.0', 'insomnia-export')
      expect(res.format).toBe('insomnia-export')
      const parsed = JSON.parse(res.content)
      expect(parsed._type).toBe('export')
    })

    it('[D6] 包含 description 和 servers 参数时生效', () => {
      const res = service.generate('Full', '1.0.0', 'openapi-json', 'Full description', ['https://api.example.com'])
      expect(res.sizeBytes).toBeGreaterThan(0)
      const parsed = JSON.parse(res.content)
      expect(parsed.info.description).toBe('Full description')
      expect(parsed.servers).toBeDefined()
    })
  })

  // ── registerEndpoint / listEndpoints / getEndpointByPath ──

  describe('registerEndpoint / listEndpoints / getEndpointByPath', () => {
    it('[D7] registerEndpoint 后 listEndpoints 可列出端点', () => {
      service.registerEndpoint({
        controllerName: 'Users',
        method: 'GET',
        path: '/users',
        summary: 'List users',
      })
      const eps = service.listEndpoints()
      expect(eps).toHaveLength(1)
      expect(eps[0].path).toBe('/users')
    })

    it('[D8] 注册多个端点后 listEndpoints 全部返回', () => {
      service.registerEndpoint({ controllerName: 'A', method: 'GET', path: '/a', summary: 'a' })
      service.registerEndpoint({ controllerName: 'B', method: 'POST', path: '/b', summary: 'b' })
      service.registerEndpoint({ controllerName: 'C', method: 'DELETE', path: '/c', summary: 'c' })
      expect(service.listEndpoints()).toHaveLength(3)
    })

    it('[D9] getEndpointByPath 精确查找', () => {
      service.registerEndpoint({ controllerName: 'Users', method: 'GET', path: '/users', summary: 'List' })
      service.registerEndpoint({ controllerName: 'Users', method: 'POST', path: '/users', summary: 'Create' })
      service.registerEndpoint({ controllerName: 'Posts', method: 'GET', path: '/posts', summary: 'List posts' })

      const ep = service.getEndpointByPath('users')
      expect(ep).not.toBeNull()
      expect(ep!.summary).toBe('List')
    })

    it('[D10] getEndpointByPath 不存在返回 null', () => {
      expect(service.getEndpointByPath('nonexistent')).toBeNull()
    })
  })

  // ── registerSchema ────────────────────────────────────────

  describe('registerSchema()', () => {
    it('[D11] 注册 schema 后可通过服务端 spec 验证', () => {
      service.registerSchema('User', {
        type: 'object',
        properties: { name: { type: 'string' } },
      })
      // generate 后 content 应包含该 schema
      const res = service.generate('Test', '1.0.0', 'openapi-json')
      const parsed = JSON.parse(res.content)
      expect(parsed.components?.schemas?.User).toBeDefined()
    })
  })

  // ── getStats ──────────────────────────────────────────────

  describe('getStats()', () => {
    it('[D12] 空状态返回零值', () => {
      const stats = service.getStats()
      expect(stats.totalEndpoints).toBe(0)
      expect(stats.totalSchemas).toBe(0)
      expect(stats.generatedFormats).toEqual([])
      expect(stats.lastGeneratedAt).toBeUndefined()
    })

    it('[D13] 注册端点后统计正确', () => {
      service.registerEndpoint({ controllerName: 'A', method: 'GET', path: '/a', summary: 'a' })
      service.registerEndpoint({ controllerName: 'A', method: 'POST', path: '/a', summary: 'a' })
      service.registerEndpoint({ controllerName: 'B', method: 'GET', path: '/b', summary: 'b' })

      const stats = service.getStats()
      expect(stats.totalEndpoints).toBe(3)
      expect(stats.endpointMethods['GET']).toBe(2)
      expect(stats.endpointMethods['POST']).toBe(1)
    })

    it('[D14] 注册 schema 后 totalSchemas 正确', () => {
      service.registerSchema('Pet', { type: 'object' })
      service.registerSchema('Owner', { type: 'object' })
      expect(service.getStats().totalSchemas).toBe(2)
    })

    it('[D15] 生成文档后 lastGeneratedAt 和 generatedFormats 不为空', () => {
      service.generate('T', '1', 'openapi-json')
      const stats = service.getStats()
      expect(stats.lastGeneratedAt).toBeDefined()
      expect(stats.generatedFormats.length).toBeGreaterThan(0)
      expect(stats.generatedFormats).toContain('openapi-json')
    })
  })

  // ── getConfig / updateConfig ──────────────────────────────

  describe('getConfig / updateConfig', () => {
    it('[D16] getConfig 默认返回 null', () => {
      expect(service.getConfig()).toBeNull()
    })

    it('[D17] updateConfig 返回确认消息', () => {
      const result = service.updateConfig()
      expect(result.success).toBe(true)
      expect(result.message).toContain('Config')
    })
  })

  // ── generateIndex ─────────────────────────────────────────

  describe('generateIndex()', () => {
    it('[D18] 生成索引包含 HTML 结构', () => {
      const result = service.generateIndex('My API', '2.0.0')
      expect(result.html).toContain('<html')
      expect(result.html).toContain('</html>')
      expect(result.html).toContain('My API')
      expect(result.generatedAt).toBeDefined()
    })
  })
})
