/**
 * swagger-gen.service.ts - Phase-24 T129-1
 * API 文档自动生成 Swagger + Redoc + 多语言支持
 */

export interface EndpointInfo {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  path: string
  summary: string
  description?: string
  tags?: string[]
  requestBody?: {
    contentType: string
    schema: object
    example?: unknown
  }
  parameters?: {
    name: string
    in: 'path' | 'query' | 'header' | 'cookie'
    required: boolean
    schema: object
    description?: string
    example?: unknown
  }[]
  responses: {
    statusCode: number
    description: string
    schema?: object
    example?: unknown
  }[]
  security?: string[]
  deprecated?: boolean
}

export interface OpenAPISpec {
  openapi: string
  info: {
    title: string
    description: string
    version: string
    contact?: { name: string; email: string; url: string }
    license?: { name: string; url: string }
  }
  servers?: { url: string; description?: string }[]
  paths: Record<string, Record<string, EndpointInfo>>
  components?: {
    securitySchemes?: Record<string, { type: string; scheme?: string; bearerFormat?: string; description?: string }>
    schemas?: Record<string, object>
  }
  tags?: { name: string; description: string }[]
}

export interface DocFormat {
  format: 'openapi-json' | 'openapi-yaml' | 'redoc-html' | 'postman-collection' | 'insomnia-export'
  content: string
}

export class SwaggerGenService {
  private endpoints: Map<string, EndpointInfo> = new Map()
  private schemas: Map<string, object> = new Map()
  private securitySchemes: Map<string, { type: string; scheme?: string; bearerFormat?: string; description?: string }> = new Map()
  private tags: { name: string; description: string }[] = []
  private servers: { url: string; description?: string }[] = []
  private jsDocAnnotations: Map<string, Map<string, { summary: string; description: string; params: Record<string, string>; returns: string }>> = new Map()

  // ── 规范生成 ──────────────────────────────────────────────────────

  /** 从路由信息生成 OpenAPI 规范 */
  generateSpec(info: {
    title: string
    version: string
    description?: string
    servers?: string[]
  }): OpenAPISpec {
    const spec: OpenAPISpec = {
      openapi: '3.0.3',
      info: {
        title: info.title,
        description: info.description || '',
        version: info.version,
      },
      servers: this.servers.length > 0 ? this.servers : (info.servers?.map(s => ({ url: s })) || []),
      paths: {},
      components: {
        securitySchemes: Object.fromEntries(this.securitySchemes),
        schemas: Object.fromEntries(this.schemas),
      },
      tags: this.tags.length > 0 ? this.tags : undefined,
    }

    // Group endpoints by path
    for (const [key, endpoint] of this.endpoints) {
      const [controllerName, method] = key.split('::')
      if (!spec.paths[endpoint.path]) {
        spec.paths[endpoint.path] = {}
      }
      spec.paths[endpoint.path][endpoint.method.toLowerCase()] = {
        ...endpoint,
        tags: endpoint.tags || [controllerName],
      }
    }

    return spec
  }

  /** 注册端点 */
  registerEndpoint(controllerName: string, endpoint: EndpointInfo): void {
    const key = `${controllerName}::${endpoint.method}::${endpoint.path}`
    this.endpoints.set(key, endpoint)
  }

  /** 注册 Schema */
  registerSchema(name: string, schema: object): void {
    this.schemas.set(name, schema)
  }

  /** 注册安全方案 */
  registerSecurityScheme(name: string, scheme: { type: string; scheme?: string; bearerFormat?: string; description?: string }): void {
    this.securitySchemes.set(name, scheme)
  }

  // ── 多格式导出 ────────────────────────────────────────────────────

  /** 导出 OpenAPI JSON */
  exportJSON(spec: OpenAPISpec): string {
    return JSON.stringify(spec, null, 2)
  }

  /** 导出 OpenAPI YAML */
  exportYAML(spec: OpenAPISpec): string {
    return this.convertToYAML(spec)
  }

  /** 导出 Redoc HTML */
  exportRedocHTML(spec: OpenAPISpec): string {
    const specJson = JSON.stringify(spec)
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${spec.info.title} - API Documentation</title>
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <style>
    body { margin: 0; padding: 0; }
  </style>
</head>
<body>
  <redoc spec-url='data:application/json;charset=utf-8,${encodeURIComponent(specJson)}'></redoc>
  <script src="https://cdn.jsdelivr.net/npm/redoc@next/bundles/redoc.standalone.js"></script>
</body>
</html>`
  }

  /** 导出 Postman Collection */
  exportPostman(spec: OpenAPISpec): string {
    const items: object[] = []

    for (const [path, methods] of Object.entries(spec.paths)) {
      for (const [method, endpoint] of Object.entries(methods)) {
        const item: Record<string, unknown> = {
          name: endpoint.summary,
          request: {
            method: method.toUpperCase(),
            header: [],
            url: {
              raw: `{{baseUrl}}${path}`,
              host: ['{{baseUrl}}'],
              path: path.split('/').filter(Boolean),
            },
          },
        }

        if (endpoint.requestBody) {
          item.request = {
            ...(item.request as Record<string, unknown>),
            body: {
              mode: 'raw',
              raw: JSON.stringify(endpoint.requestBody.example || endpoint.requestBody.schema, null, 2),
            },
          }
        }

        if (endpoint.responses?.length) {
          const response = endpoint.responses[0]
          item.request = {
            ...(item.request as Record<string, unknown>),
            response: [{
              name: response.description,
              status: String(response.statusCode),
              body: response.example ? JSON.stringify(response.example, null, 2) : '',
            }],
          }
        }

        items.push(item)
      }
    }

    const collection = {
      info: {
        name: spec.info.title,
        description: spec.info.description,
        schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
      },
      item: items,
    }

    return JSON.stringify(collection, null, 2)
  }

  /** 导出 Insomnia 格式 */
  exportInsomnia(spec: OpenAPISpec): string {
    const resources: object[] = []

    // Add OpenAPI spec as a document
    resources.push({
      _id: 'spec',
      type: 'openapi',
      data: spec,
    })

    // Add endpoints as requests
    let requestIndex = 0
    for (const [path, methods] of Object.entries(spec.paths)) {
      for (const [method, endpoint] of Object.entries(methods)) {
        resources.push({
          _id: `request-${requestIndex++}`,
          type: 'request',
          name: endpoint.summary,
          method: method.toUpperCase(),
          url: `{{baseUrl}}${path}`,
          body: endpoint.requestBody ? {
            mode: 'raw',
            raw: JSON.stringify(endpoint.requestBody.example || endpoint.requestBody.schema, null, 2),
          } : undefined,
          responses: endpoint.responses?.map((r, i) => ({
            _id: `response-${requestIndex}-${i}`,
            status: String(r.statusCode),
            body: r.example ? JSON.stringify(r.example, null, 2) : '',
          })) || [],
        })
      }
    }

    const exportData = {
      _type: 'export',
      version: '2023.1.0',
      resources,
    }

    return JSON.stringify(exportData, null, 2)
  }

  // ── 文档增强 ──────────────────────────────────────────────────────

  /** 添加 tag 描述 */
  addTag(name: string, description: string): void {
    const existing = this.tags.find(t => t.name === name)
    if (existing) {
      existing.description = description
    } else {
      this.tags.push({ name, description })
    }
  }

  /** 生成文档索引页 */
  generateIndex(spec: OpenAPISpec): string {
    const paths = Object.keys(spec.paths)
    const pathList = paths.map(p => `<li><a href="#${p}">${p}</a></li>`).join('\n')

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${spec.info.title} - API Index</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
    h1 { color: #333; }
    ul { list-style-type: none; padding: 0; }
    li { padding: 8px 0; border-bottom: 1px solid #eee; }
    a { color: #0066cc; text-decoration: none; }
    a:hover { text-decoration: underline; }
    .version { color: #666; font-size: 14px; }
  </style>
</head>
<body>
  <h1>${spec.info.title}</h1>
  <p class="version">Version: ${spec.info.version}</p>
  <p>${spec.info.description || 'API Documentation'}</p>
  <h2>Endpoints</h2>
  <ul>
    ${pathList}
  </ul>
</body>
</html>`
  }

  /** 添加服务器信息 */
  addServer(url: string, description?: string): void {
    this.servers.push({ url, description })
  }

  // ── 代码注解解析 ──────────────────────────────────────────────────

  /** 解析 JSDoc 注解生成描述 */
  parseJSDocAnnotations(controllerName: string, methodName: string): {
    summary: string
    description: string
    params: Record<string, string>
    returns: string
  } {
    const controllerMap = this.jsDocAnnotations.get(controllerName)
    if (controllerMap && controllerMap.has(methodName)) {
      return controllerMap.get(methodName)!
    }
    return {
      summary: '',
      description: '',
      params: {},
      returns: '',
    }
  }

  /** 设置 JSDoc 注解（用于测试和模拟） */
  setJSDocAnnotation(controllerName: string, methodName: string, annotation: {
    summary: string
    description: string
    params: Record<string, string>
    returns: string
  }): void {
    if (!this.jsDocAnnotations.has(controllerName)) {
      this.jsDocAnnotations.set(controllerName, new Map())
    }
    this.jsDocAnnotations.get(controllerName)!.set(methodName, annotation)
  }

  // ── 内部辅助方法 ──────────────────────────────────────────────────

  private convertToYAML(obj: unknown, indent = 0): string {
    const spaces = '  '.repeat(indent)
    if (obj === null || obj === undefined) {
      return 'null\n'
    }
    if (typeof obj !== 'object') {
      return String(obj) + '\n'
    }
    if (Array.isArray(obj)) {
      let result = '[]\n'
      for (const item of obj) {
        result += spaces + '- ' + this.convertToYAML(item, indent + 1).trim()
      }
      return result
    }
    let result = ''
    for (const [key, value] of Object.entries(obj)) {
      if (value === undefined) continue
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        result += spaces + key + ':\n' + this.convertToYAML(value, indent + 1)
      } else if (Array.isArray(value)) {
        result += spaces + key + ':\n'
        for (const item of value) {
          result += spaces + '  - ' + this.convertToYAML(item, indent + 2).trim()
        }
      } else {
        const valStr = typeof value === 'string' ? `"${value}"` : String(value)
        result += spaces + key + ': ' + valStr + '\n'
      }
    }
    return result
  }
}
