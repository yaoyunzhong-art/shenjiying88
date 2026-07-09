/**
 * doc.service.ts - API文档模块业务服务
 *
 * 职责：
 *   - 文档生成编排（委托给 SwaggerGenService）
 *   - 端点 / Schema / 配置的内存管理
 *   - 文档统计与查询
 */

import { Injectable } from '@nestjs/common'
import { SwaggerGenService } from './swagger-gen.service'
import type {
  DocExportFormat,
  DocGenerateResponse,
  DocConfig,
  DocEndpointInfo,
  DocStats,
} from './doc.entity'

@Injectable()
export class DocService {
  private endpoints: DocEndpointInfo[] = []
  private schemas: Map<string, Record<string, unknown>> = new Map()
  private lastGeneratedAt?: string

  constructor(private readonly swaggerGenService: SwaggerGenService) {}

  // ── 文档生成 ──────────────────────────────────────────────────────

  /**
   * 生成指定格式的 API 文档
   */
  generate(
    title: string,
    version: string,
    format: DocExportFormat,
    description?: string,
    servers?: string[],
    tags?: string[],
  ): DocGenerateResponse {
    const spec = this.swaggerGenService.generateSpec({
      title,
      version,
      description,
      servers,
    })

    let content: string
    switch (format) {
      case 'openapi-json':
        content = this.swaggerGenService.exportJSON(spec)
        break
      case 'openapi-yaml':
        content = this.swaggerGenService.exportYAML(spec)
        break
      case 'redoc-html':
        content = this.swaggerGenService.exportRedocHTML(spec)
        break
      case 'postman-collection':
        content = this.swaggerGenService.exportPostman(spec)
        break
      case 'insomnia-export':
        content = this.swaggerGenService.exportInsomnia(spec)
        break
      default:
        content = this.swaggerGenService.exportJSON(spec)
    }

    this.lastGeneratedAt = new Date().toISOString()

    return {
      title,
      version,
      format,
      content,
      generatedAt: this.lastGeneratedAt,
      sizeBytes: Buffer.byteLength(content, 'utf-8'),
    }
  }

  // ── 端点管理 ──────────────────────────────────────────────────────

  /**
   * 注册一个 API 端点到文档中
   */
  registerEndpoint(endpoint: DocEndpointInfo): void {
    this.endpoints.push(endpoint)
    this.swaggerGenService.registerEndpoint(endpoint.controllerName, {
      method: endpoint.method,
      path: endpoint.path,
      summary: endpoint.summary,
      description: endpoint.description,
      responses: [{ statusCode: 200, description: 'Success' }],
      tags: [endpoint.controllerName],
      deprecated: endpoint.deprecated,
    })
  }

  /**
   * 列出所有已注册的端点
   */
  listEndpoints(): DocEndpointInfo[] {
    return [...this.endpoints]
  }

  /**
   * 根据路径查找端点
   */
  getEndpointByPath(path: string): DocEndpointInfo | null {
    return this.endpoints.find((e) => e.path === '/' + path) ?? null
  }

  // ── Schema 管理 ───────────────────────────────────────────────────

  /**
   * 注册一个 JSON Schema 到文档组件
   */
  registerSchema(name: string, schema: Record<string, unknown>): void {
    this.schemas.set(name, schema)
    this.swaggerGenService.registerSchema(name, schema)
  }

  /**
   * 获取已注册的 schema 名称列表
   */
  listSchemaNames(): string[] {
    return Array.from(this.schemas.keys())
  }

  // ── 文档统计 ──────────────────────────────────────────────────────

  /**
   * 获取文档统计信息
   */
  getStats(): DocStats {
    const methodCounts: Record<string, number> = {}
    for (const ep of this.endpoints) {
      methodCounts[ep.method] = (methodCounts[ep.method] || 0) + 1
    }

    return {
      totalEndpoints: this.endpoints.length,
      totalSchemas: this.schemas.size,
      totalTags: 0,
      endpointMethods: methodCounts,
      generatedFormats: this.lastGeneratedAt
        ? ['openapi-json', 'openapi-yaml', 'redoc-html', 'postman-collection', 'insomnia-export']
        : [],
      lastGeneratedAt: this.lastGeneratedAt,
    }
  }

  // ── 配置管理 ──────────────────────────────────────────────────────

  /**
   * 获取默认文档配置（当前返回 null，待持久化）
   */
  getConfig(): DocConfig | null {
    return null
  }

  /**
   * 更新文档配置（当前为无操作，仅返回确认）
   */
  updateConfig(): { success: true; message: string } {
    return { success: true, message: 'Config updated (in-memory)' }
  }

  // ── 索引页面 ──────────────────────────────────────────────────────

  /**
   * 生成文档索引页面 HTML
   */
  generateIndex(title: string, version: string): { html: string; generatedAt: string } {
    const spec = this.swaggerGenService.generateSpec({ title, version })
    const html = this.swaggerGenService.generateIndex(spec)
    return { html, generatedAt: new Date().toISOString() }
  }
}
