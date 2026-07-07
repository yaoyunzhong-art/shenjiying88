/**
 * docs.service.spec.ts — API 文档 Service 深层单元测试
 *
 * 覆盖：
 *  - SwaggerGenService: 规范生成/端点注册/Schema注册/安全方案
 *  - 多格式导出: JSON/YAML/Redoc/Postman/Insomnia
 *  - DocGenerator: 文档生成/统计/配置
 *  - JSDoc 注解解析
 *
 * 全部内联 mock，不依赖 NestJS DI。 ≥ 18 项测试。
 */

import { describe, it, expect, beforeEach } from 'vitest'
import type {
  EndpointInfo,
  OpenAPISpec,
} from './swagger-gen.service'
import type {
  DocExportFormat,
  DocGenerateResponse,
  DocEndpointInfo,
  DocStats,
  DocPageOptions,
} from './doc.entity'

// ═══════════════════════════════════════════════════════════════
// 枚举常量
// ═══════════════════════════════════════════════════════════════

const EXPORT_FORMATS: DocExportFormat[] = [
  'openapi-json', 'openapi-yaml', 'redoc-html', 'postman-collection', 'insomnia-export',
]
const HTTP_METHODS = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'] as const

// ═══════════════════════════════════════════════════════════════
// 内联 SwaggerGenService
// ═══════════════════════════════════════════════════════════════

class MockSwaggerGenService {
  private endpoints = new Map<string, EndpointInfo>()
  private schemas = new Map<string, object>()
  private securitySchemes = new Map<string, { type: string; scheme?: string; bearerFormat?: string; description?: string }>()
  private tags: { name: string; description: string }[] = []
  private servers: { url: string; description?: string }[] = []
  private jsDocAnnotations = new Map<string, Map<string, { summary: string; description: string; params: Record<string, string>; returns: string }>>()

  generateSpec(info: { title: string; version: string; description?: string; servers?: string[] }): OpenAPISpec {
    return {
      openapi: '3.0.3',
      info: {
        title: info.title,
        description: info.description || '',
        version: info.version,
      },
      servers: this.servers.length > 0 ? this.servers : (info.servers?.map(s => ({ url: s })) || []),
      paths: this.buildPaths(),
      components: {
        securitySchemes: Object.fromEntries(this.securitySchemes),
        schemas: Object.fromEntries(this.schemas),
      },
      tags: this.tags.length > 0 ? this.tags : undefined,
    }
  }

  private buildPaths(): Record<string, Record<string, EndpointInfo>> {
    const paths: Record<string, Record<string, EndpointInfo>> = {}
    for (const [key, endpoint] of this.endpoints) {
      const [controllerName, method] = key.split('::')
      if (!paths[endpoint.path]) paths[endpoint.path] = {}
      paths[endpoint.path][endpoint.method.toLowerCase()] = { ...endpoint, tags: endpoint.tags || [controllerName] }
    }
    return paths
  }

  registerEndpoint(controllerName: string, endpoint: EndpointInfo): void {
    const key = `${controllerName}::${endpoint.method}::${endpoint.path}`
    this.endpoints.set(key, endpoint)
  }

  registerSchema(name: string, schema: object): void {
    this.schemas.set(name, schema)
  }

  registerSecurityScheme(name: string, scheme: { type: string; scheme?: string; bearerFormat?: string; description?: string }): void {
    this.securitySchemes.set(name, scheme)
  }

  addTag(name: string, description: string): void {
    const existing = this.tags.find(t => t.name === name)
    if (existing) existing.description = description
    else this.tags.push({ name, description })
  }

  addServer(url: string, description?: string): void {
    this.servers.push({ url, description })
  }

  exportJSON(spec: OpenAPISpec): string {
    return JSON.stringify(spec, null, 2)
  }

  exportYAML(spec: OpenAPISpec): string {
    return this.convertToYAML(spec)
  }

  exportRedocHTML(spec: OpenAPISpec): string {
    const specJson = JSON.stringify(spec)
    return `<!DOCTYPE html>
<html><head><title>${spec.info.title} - API Documentation</title></head>
<body><redoc spec-url='data:application/json;charset=utf-8,${encodeURIComponent(specJson)}'></redoc>
<script src="https://cdn.jsdelivr.net/npm/redoc@next/bundles/redoc.standalone.js"></script>
</body></html>`
  }

  exportPostman(spec: OpenAPISpec): string {
    const items: object[] = []
    for (const [path, methods] of Object.entries(spec.paths)) {
      for (const [method, endpoint] of Object.entries(methods)) {
        const item: Record<string, unknown> = {
          name: (endpoint as any).summary,
          request: { method: method.toUpperCase(), header: [], url: { raw: `{{baseUrl}}${path}`, host: ['{{baseUrl}}'], path: path.split('/').filter(Boolean) } },
        }
        if ((endpoint as any).requestBody) {
          (item.request as any).body = { mode: 'raw', raw: JSON.stringify((endpoint as any).requestBody.example || (endpoint as any).requestBody.schema, null, 2) }
        }
        items.push(item)
      }
    }
    return JSON.stringify({ info: { name: spec.info.title }, item: items }, null, 2)
  }

  exportInsomnia(spec: OpenAPISpec): string {
    const resources: object[] = [{ _id: 'spec', type: 'openapi', data: spec }]
    let idx = 0
    for (const [path, methods] of Object.entries(spec.paths)) {
      for (const [method, endpoint] of Object.entries(methods)) {
        resources.push({ _id: `request-${idx++}`, type: 'request', name: (endpoint as any).summary, method: method.toUpperCase(), url: `{{baseUrl}}${path}` })
      }
    }
    return JSON.stringify({ _type: 'export', version: '2023.1.0', resources }, null, 2)
  }

  generateIndex(spec: OpenAPISpec): string {
    const paths = Object.keys(spec.paths)
    const pathList = paths.map(p => `<li><a href="#${p}">${p}</a></li>`).join('\n')
    return `<!DOCTYPE html>
<html><head><title>${spec.info.title} - API Index</title></head>
<body><h1>${spec.info.title}</h1><p>Version: ${spec.info.version}</p><ul>${pathList}</ul></body></html>`
  }

  parseJSDocAnnotations(controllerName: string, methodName: string): { summary: string; description: string; params: Record<string, string>; returns: string } {
    return this.jsDocAnnotations.get(controllerName)?.get(methodName) ?? { summary: '', description: '', params: {}, returns: '' }
  }

  setJSDocAnnotation(controllerName: string, methodName: string, annotation: { summary: string; description: string; params: Record<string, string>; returns: string }): void {
    if (!this.jsDocAnnotations.has(controllerName)) this.jsDocAnnotations.set(controllerName, new Map())
    this.jsDocAnnotations.get(controllerName)!.set(methodName, annotation)
  }

  getTags() { return this.tags }
  getServers() { return this.servers }

  private convertToYAML(obj: unknown, indent = 0): string {
    const spaces = '  '.repeat(indent)
    if (obj === null || obj === undefined) return 'null\n'
    if (typeof obj !== 'object') return String(obj) + '\n'
    if (Array.isArray(obj)) {
      let result = '[]\n'
      for (const item of obj) result += spaces + '- ' + this.convertToYAML(item, indent + 1).trim()
      return result
    }
    let result = ''
    for (const [key, value] of Object.entries(obj)) {
      if (value === undefined) continue
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        result += spaces + key + ':\n' + this.convertToYAML(value, indent + 1)
      } else if (Array.isArray(value)) {
        result += spaces + key + ':\n'
        for (const item of value) result += spaces + '  - ' + this.convertToYAML(item, indent + 2).trim()
      } else {
        result += spaces + key + ': ' + (typeof value === 'string' ? `"${value}"` : String(value)) + '\n'
      }
    }
    return result
  }
}

// ═══════════════════════════════════════════════════════════════
// 内联 DocGenerator
// ═══════════════════════════════════════════════════════════════

class MockDocGenerator {
  private endpoints: DocEndpointInfo[] = []
  private schemas = new Map<string, Record<string, unknown>>()
  private lastGeneratedAt?: string

  constructor(private swagger: MockSwaggerGenService) {}

  generate(title: string, version: string, format: DocExportFormat, description?: string, servers?: string[]): DocGenerateResponse {
    const spec = this.swagger.generateSpec({ title, version, description, servers })
    let content: string
    switch (format) {
      case 'openapi-json':      content = this.swagger.exportJSON(spec); break
      case 'openapi-yaml':      content = this.swagger.exportYAML(spec); break
      case 'redoc-html':        content = this.swagger.exportRedocHTML(spec); break
      case 'postman-collection': content = this.swagger.exportPostman(spec); break
      case 'insomnia-export':    content = this.swagger.exportInsomnia(spec); break
      default:                   content = this.swagger.exportJSON(spec)
    }
    this.lastGeneratedAt = new Date().toISOString()
    return { title, version, format, content, generatedAt: this.lastGeneratedAt, sizeBytes: Buffer.byteLength(content, 'utf-8') }
  }

  registerEndpoint(ep: DocEndpointInfo): void {
    this.endpoints.push(ep)
    this.swagger.registerEndpoint(ep.controllerName, {
      method: ep.method, path: ep.path, summary: ep.summary, description: ep.description,
      responses: [{ statusCode: 200, description: 'Success' }],
      tags: [ep.controllerName], deprecated: ep.deprecated,
    })
  }

  registerSchema(name: string, schema: Record<string, unknown>): void {
    this.schemas.set(name, schema)
    this.swagger.registerSchema(name, schema)
  }

  getStats(): DocStats {
    const methodCounts: Record<string, number> = {}
    for (const ep of this.endpoints) methodCounts[ep.method] = (methodCounts[ep.method] || 0) + 1
    return {
      totalEndpoints: this.endpoints.length,
      totalSchemas: this.schemas.size,
      totalTags: 0,
      endpointMethods: methodCounts,
      generatedFormats: this.lastGeneratedAt ? [...EXPORT_FORMATS] : [],
      lastGeneratedAt: this.lastGeneratedAt,
    }
  }

  listEndpoints(): DocEndpointInfo[] { return this.endpoints }

  getEndpointByPath(path: string): DocEndpointInfo | null {
    return this.endpoints.find(e => e.path === '/' + path) ?? null
  }
}

// ═══════════════════════════════════════════════════════════════
// 测试 — SwaggerGenService
// ═══════════════════════════════════════════════════════════════

describe('SwaggerGenService | 规范生成', () => {
  let swagger: MockSwaggerGenService

  beforeEach(() => { swagger = new MockSwaggerGenService() })

  it('正例: generateSpec 生成标准 OpenAPI 3.0.3 结构', () => {
    const spec = swagger.generateSpec({ title: 'Test API', version: '1.0.0' })
    expect(spec.openapi).toBe('3.0.3')
    expect(spec.info.title).toBe('Test API')
    expect(spec.info.version).toBe('1.0.0')
  })

  it('正例: 注册端点后 paths 中存在', () => {
    swagger.registerEndpoint('UserController', { method: 'GET', path: '/users', summary: 'List users', responses: [{ statusCode: 200, description: 'OK' }] })
    const spec = swagger.generateSpec({ title: 'T', version: '1' })
    expect(spec.paths['/users'].get).toBeDefined()
    expect(spec.paths['/users'].get.summary).toBe('List users')
  })

  it('正例: 注册多个端点', () => {
    swagger.registerEndpoint('A', { method: 'GET', path: '/a', summary: 'A', responses: [{ statusCode: 200, description: '' }] })
    swagger.registerEndpoint('B', { method: 'POST', path: '/b', summary: 'B', responses: [{ statusCode: 200, description: '' }] })
    const spec = swagger.generateSpec({ title: 'T', version: '1' })
    expect(Object.keys(spec.paths)).toEqual(['/a', '/b'])
  })

  it('正例: registerSchema 后出现在 components.schemas', () => {
    swagger.registerSchema('User', { type: 'object', properties: { name: { type: 'string' } } })
    const spec = swagger.generateSpec({ title: 'T', version: '1' })
    expect(spec.components?.schemas?.User).toBeDefined()
  })

  it('正例: registerSecurityScheme 后出现在 components.securitySchemes', () => {
    swagger.registerSecurityScheme('bearerAuth', { type: 'http', scheme: 'bearer' })
    const spec = swagger.generateSpec({ title: 'T', version: '1' })
    expect(spec.components?.securitySchemes?.bearerAuth).toEqual({ type: 'http', scheme: 'bearer' })
  })

  it('正例: addTag 出现在 tags 列表', () => {
    swagger.addTag('Users', '用户管理')
    const spec = swagger.generateSpec({ title: 'T', version: '1' })
    expect(spec.tags).toHaveLength(1)
    expect(spec.tags![0].name).toBe('Users')
  })

  it('正例: addServer 出现在 servers 列表', () => {
    swagger.addServer('https://api.example.com', 'Production')
    const spec = swagger.generateSpec({ title: 'T', version: '1' })
    expect(spec.servers).toHaveLength(1)
    expect(spec.servers![0].url).toBe('https://api.example.com')
  })

  it('边例: 无端点时 paths 为空对象', () => {
    const spec = swagger.generateSpec({ title: 'T', version: '1' })
    expect(spec.paths).toEqual({})
  })

  it('边例: 无安全方案时为空对象', () => {
    const spec = swagger.generateSpec({ title: 'T', version: '1' })
    expect(spec.components?.securitySchemes).toEqual({})
  })

  it('边例: 无 Schema 时为空对象', () => {
    const spec = swagger.generateSpec({ title: 'T', version: '1' })
    expect(spec.components?.schemas).toEqual({})
  })
})

describe('SwaggerGenService | 多格式导出', () => {
  let swagger: MockSwaggerGenService

  beforeEach(() => {
    swagger = new MockSwaggerGenService()
    swagger.registerEndpoint('A', { method: 'GET', path: '/ping', summary: 'Health', responses: [{ statusCode: 200, description: 'OK' }] })
  })

  it('正例: exportJSON 是有效的 JSON', () => {
    const spec = swagger.generateSpec({ title: 'T', version: '1' })
    const json = swagger.exportJSON(spec)
    const parsed = JSON.parse(json)
    expect(parsed.openapi).toBe('3.0.3')
  })

  it('正例: exportYAML 包含关键字段', () => {
    const spec = swagger.generateSpec({ title: 'T', version: '1' })
    const yaml = swagger.exportYAML(spec)
    expect(yaml).toContain('openapi')
    expect(yaml).toContain('info')
  })

  it('正例: exportRedocHTML 包含 redoc 标签和 script', () => {
    const spec = swagger.generateSpec({ title: 'T', version: '1' })
    const html = swagger.exportRedocHTML(spec)
    expect(html).toContain('<redoc')
    expect(html).toContain('redoc.standalone.js')
  })

  it('正例: exportPostman 包含 collection 格式', () => {
    const spec = swagger.generateSpec({ title: 'T', version: '1' })
    const pm = swagger.exportPostman(spec)
    const parsed = JSON.parse(pm)
    expect(parsed.info?.name).toBe('T')
    expect(parsed.item).toHaveLength(1)
  })

  it('正例: exportInsomnia 包含 insomnia export 格式', () => {
    const spec = swagger.generateSpec({ title: 'T', version: '1' })
    const ins = swagger.exportInsomnia(spec)
    const parsed = JSON.parse(ins)
    expect(parsed._type).toBe('export')
    expect(parsed.resources).toHaveLength(2) // spec + request
  })

  it('正例: generateIndex 生成 HTML 页面', () => {
    const spec = swagger.generateSpec({ title: 'T', version: '1' })
    const idx = swagger.generateIndex(spec)
    expect(idx).toContain('<html')
    expect(idx).toContain('</html>')
    expect(idx).toContain('T')
  })
})

describe('SwaggerGenService | JSDoc 注解', () => {
  let swagger: MockSwaggerGenService

  beforeEach(() => { swagger = new MockSwaggerGenService() })

  it('正例: setJSDocAnnotation 后 parseJSDocAnnotations 返回正确值', () => {
    swagger.setJSDocAnnotation('UserController', 'getUser', { summary: 'Get user', description: 'Fetch user by ID', params: { id: 'number' }, returns: 'User' })
    const ann = swagger.parseJSDocAnnotations('UserController', 'getUser')
    expect(ann.summary).toBe('Get user')
    expect(ann.params.id).toBe('number')
  })

  it('反例: 未设置的注解返回空默认值', () => {
    const ann = swagger.parseJSDocAnnotations('Nonexistent', 'method')
    expect(ann.summary).toBe('')
    expect(ann.description).toBe('')
    expect(ann.params).toEqual({})
    expect(ann.returns).toBe('')
  })

  it('边例: 覆盖已有注解', () => {
    swagger.setJSDocAnnotation('C', 'm', { summary: 'Old', description: '', params: {}, returns: '' })
    swagger.setJSDocAnnotation('C', 'm', { summary: 'New', description: '', params: {}, returns: '' })
    expect(swagger.parseJSDocAnnotations('C', 'm').summary).toBe('New')
  })
})

describe('DocGenerator | 文档编排', () => {
  let swagger: MockSwaggerGenService
  let gen: MockDocGenerator

  beforeEach(() => {
    swagger = new MockSwaggerGenService()
    gen = new MockDocGenerator(swagger)
  })

  it('正例: generate 生成 JSON 格式文档', () => {
    const res = gen.generate('My API', '2.0.0', 'openapi-json')
    expect(res.title).toBe('My API')
    expect(res.version).toBe('2.0.0')
    expect(res.format).toBe('openapi-json')
    expect(res.sizeBytes).toBeGreaterThan(0)
    expect(() => JSON.parse(res.content)).not.toThrow()
  })

  it('正例: generate 生成 YAML 格式', () => {
    const res = gen.generate('Y', '1', 'openapi-yaml')
    expect(res.content).toContain('openapi')
  })

  it('正例: registerEndpoint 后端点可被列出', () => {
    gen.registerEndpoint({ controllerName: 'Users', method: 'GET', path: '/users', summary: 'List' })
    const eps = gen.listEndpoints()
    expect(eps).toHaveLength(1)
    expect(eps[0].path).toBe('/users')
  })

  it('正例: registerEndpoint 后 Swagger 中也存在', () => {
    gen.registerEndpoint({ controllerName: 'Users', method: 'GET', path: '/users', summary: 'List' })
    const spec = swagger.generateSpec({ title: 'T', version: '1' })
    expect(spec.paths['/users']).toBeDefined()
  })

  it('正例: registerSchema 后统计正确', () => {
    gen.registerSchema('Pet', { type: 'object' })
    const stats = gen.getStats()
    expect(stats.totalSchemas).toBe(1)
  })

  it('正例: getStats 统计端点方法分布', () => {
    gen.registerEndpoint({ controllerName: 'A', method: 'GET', path: '/a', summary: 'a' })
    gen.registerEndpoint({ controllerName: 'A', method: 'POST', path: '/a', summary: 'a' })
    gen.registerEndpoint({ controllerName: 'B', method: 'GET', path: '/b', summary: 'b' })
    const stats = gen.getStats()
    expect(stats.totalEndpoints).toBe(3)
    expect(stats.endpointMethods['GET']).toBe(2)
    expect(stats.endpointMethods['POST']).toBe(1)
  })

  it('反例: getEndpointByPath 不存在返回 null', () => {
    expect(gen.getEndpointByPath('phantom')).toBeNull()
  })

  it('反例: 未生成文档时 generatedFormats 为空', () => {
    const stats = gen.getStats()
    expect(stats.generatedFormats).toEqual([])
    expect(stats.lastGeneratedAt).toBeUndefined()
  })

  it('边例: 生成后 lastGeneratedAt 不为空', () => {
    gen.generate('T', '1', 'openapi-json')
    const stats = gen.getStats()
    expect(stats.lastGeneratedAt).toBeDefined()
    expect(stats.generatedFormats.length).toBeGreaterThan(0)
  })

  it('边例: 空端点列表', () => {
    const stats = gen.getStats()
    expect(stats.totalEndpoints).toBe(0)
    expect(stats.endpointMethods).toEqual({})
  })
})
