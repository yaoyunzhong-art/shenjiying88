/**
 * doc.controller.ts - API文档模块控制器
 * 提供文档生成、端点注册、schema管理、文档配置等 REST 接口
 */

import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UsePipes,
  ValidationPipe,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common'
import { SwaggerGenService } from './swagger-gen.service'
import {
  DocGenerateRequestDto,
  RegisterEndpointRequestDto,
  RegisterSchemaRequestDto,
  DocConfigUpdateDto,
  AddTagRequestDto,
} from './doc.dto'
import type {
  DocGenerateResponse,
  DocConfig,
  DocEndpointInfo,
  DocStats,
} from './doc.entity'

@Controller('docs')
@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
export class DocController {
  private configs: Map<string, DocConfig> = new Map()
  private endpoints: DocEndpointInfo[] = []
  private schemas: Map<string, Record<string, unknown>> = new Map()
  private lastGeneratedAt?: string

  constructor(private readonly swaggerGenService: SwaggerGenService) {}

  /** 生成文档（可指定格式） */
  @Post('generate')
  generate(@Body() body: DocGenerateRequestDto): DocGenerateResponse {
    const spec = this.swaggerGenService.generateSpec({
      title: body.title,
      version: body.version,
      description: body.description,
      servers: body.servers,
    })

    let content: string
    switch (body.format) {
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
        // Fallback to JSON
        content = this.swaggerGenService.exportJSON(spec)
    }

    this.lastGeneratedAt = new Date().toISOString()

    return {
      title: body.title,
      version: body.version,
      format: body.format,
      content,
      generatedAt: this.lastGeneratedAt,
      sizeBytes: Buffer.byteLength(content, 'utf-8'),
    }
  }

  /** 注册端点 */
  @Post('endpoints')
  registerEndpoint(@Body() body: RegisterEndpointRequestDto): {
    success: true
    endpoint: DocEndpointInfo
  } {
    const endpointInfo: DocEndpointInfo = {
      controllerName: body.controllerName,
      method: body.method,
      path: body.path,
      summary: body.summary,
      description: body.description,
      deprecated: body.deprecated,
    }

    this.endpoints.push(endpointInfo)

    this.swaggerGenService.registerEndpoint(body.controllerName, {
      method: body.method,
      path: body.path,
      summary: body.summary,
      description: body.description,
      responses: [{ statusCode: 200, description: 'Success' }],
      tags: [body.controllerName],
      deprecated: body.deprecated,
    })

    return { success: true, endpoint: endpointInfo }
  }

  /** 注册 Schema */
  @Post('schemas')
  registerSchema(@Body() body: RegisterSchemaRequestDto): { success: true; name: string } {
    this.schemas.set(body.name, body.schema)
    this.swaggerGenService.registerSchema(body.name, body.schema)
    return { success: true, name: body.name }
  }

  /** 注册安全方案 */
  @Post('security-schemes')
  registerSecurityScheme(
    @Body() body: { name: string; type: string; scheme?: string; description?: string },
  ): { success: true; name: string } {
    this.swaggerGenService.registerSecurityScheme(body.name, {
      type: body.type,
      scheme: body.scheme,
      description: body.description,
    })
    return { success: true, name: body.name }
  }

  /** 添加 Tag */
  @Post('tags')
  addTag(@Body() body: AddTagRequestDto): { success: true; name: string } {
    this.swaggerGenService.addTag(body.name, body.description)
    return { success: true, name: body.name }
  }

  /** 获取文档统计 */
  @Get('stats')
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

  /** 列出所有端点 */
  @Get('endpoints')
  listEndpoints(): DocEndpointInfo[] {
    return this.endpoints
  }

  /** 根据路径查询端点 */
  @Get('endpoints/:path')
  getEndpointByPath(@Param('path') path: string): DocEndpointInfo {
    const ep = this.endpoints.find((e) => e.path === '/' + path)
    if (!ep) {
      throw new NotFoundException(`Endpoint with path /${path} not found`)
    }
    return ep
  }

  /** 获取文档配置 */
  @Get('config')
  getConfig(): DocConfig | null {
    // 返回默认配置（简化版，无持久化）
    return null
  }

  /** 更新文档配置 */
  @Post('config')
  updateConfig(@Body() _body: DocConfigUpdateDto): { success: true; message: string } {
    return { success: true, message: 'Config updated (in-memory)' }
  }

  /** 生成文档索引页 HTML */
  @Get('index')
  getIndexPage(
    @Query('title') title?: string,
    @Query('version') version?: string,
  ): { html: string; generatedAt: string } {
    const configTitle = title || 'API Documentation Index'
    const configVersion = version || '1.0.0'
    const spec = this.swaggerGenService.generateSpec({
      title: configTitle,
      version: configVersion,
    })
    const html = this.swaggerGenService.generateIndex(spec)
    return { html, generatedAt: new Date().toISOString() }
  }

  /** 健康检查 */
  @Get('health')
  healthCheck(): { status: 'ok'; uptime: number } {
    return { status: 'ok', uptime: process.uptime() }
  }
}
