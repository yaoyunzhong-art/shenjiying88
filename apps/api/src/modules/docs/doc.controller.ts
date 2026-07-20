/**
 * doc.controller.ts - API文档模块控制器
 * 提供文档生成、端点注册、schema管理、文档配置等 REST 接口
 */

import { Controller, Get, Post, Body, Param, Query, UsePipes, ValidationPipe, NotFoundException, BadRequestException, UseGuards } from '@nestjs/common'
import { DocService } from './doc.service'
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
import { TenantGuard } from '../agent/tenant.guard'

@Controller('docs')
@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
@UseGuards(TenantGuard)
export class DocController {
  constructor(
    private readonly docService: DocService,
    private readonly swaggerGenService: SwaggerGenService,
  ) {}

  /** 生成文档（可指定格式） */
  @Post('generate')
  generate(@Body() body: DocGenerateRequestDto): DocGenerateResponse {
    return this.docService.generate(
      body.title,
      body.version,
      body.format,
      body.description,
      body.servers,
      body.tags,
    )
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

    this.docService.registerEndpoint(endpointInfo)

    return { success: true, endpoint: endpointInfo }
  }

  /** 注册 Schema */
  @Post('schemas')
  registerSchema(@Body() body: RegisterSchemaRequestDto): { success: true; name: string } {
    this.docService.registerSchema(body.name, body.schema)
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
    return this.docService.getStats()
  }

  /** 列出所有端点 */
  @Get('endpoints')
  listEndpoints(): DocEndpointInfo[] {
    return this.docService.listEndpoints()
  }

  /** 根据路径查询端点 */
  @Get('endpoints/:path')
  getEndpointByPath(@Param('path') path: string): DocEndpointInfo {
    const ep = this.docService.getEndpointByPath(path)
    if (!ep) {
      throw new NotFoundException(`Endpoint with path /${path} not found`)
    }
    return ep
  }

  /** 获取文档配置 */
  @Get('config')
  getConfig(): DocConfig | null {
    return this.docService.getConfig()
  }

  /** 更新文档配置 */
  @Post('config')
  updateConfig(@Body() _body: DocConfigUpdateDto): { success: true; message: string } {
    return this.docService.updateConfig()
  }

  /** 生成文档索引页 HTML */
  @Get('index')
  getIndexPage(
    @Query('title') title?: string,
    @Query('version') version?: string,
  ): { html: string; generatedAt: string } {
    const configTitle = title || 'API Documentation Index'
    const configVersion = version || '1.0.0'
    return this.docService.generateIndex(configTitle, configVersion)
  }

  /** 健康检查 */
  @Get('health')
  healthCheck(): { status: 'ok'; uptime: number } {
    return { status: 'ok', uptime: process.uptime() }
  }
}
