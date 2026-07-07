/**
 * LowcodeController · 低代码聚合管理 API
 * 提供模板管理、快照、组件库、页面导入导出、仪表盘等功能
 */

import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger'
import { LowcodeService } from './lowcode.service'
import { LowCodePageBuilder } from './lowcode-audit.service'
import {
  CreateTemplateDto,
  UpdateTemplateDto,
  CreateSnapshotDto,
  RegisterComponentDto,
  PageImportDto,
  DashboardStatsDto,
} from './lowcode.dto'

@ApiTags('低代码聚合管理')
@ApiBearerAuth()
@Controller('api/lowcode/admin')
export class LowcodeController {
  constructor(
    private readonly lowcodeService: LowcodeService,
    private readonly pageBuilder: LowCodePageBuilder,
  ) {}

  // ==================== 模板管理 ====================

  @Post('templates')
  @ApiOperation({ summary: '创建模板' })
  @ApiResponse({ status: HttpStatus.CREATED, description: '创建成功' })
  createTemplate(@Body() dto: CreateTemplateDto): Record<string, unknown> {
    const tpl = this.lowcodeService.registerTemplate({
      name: dto.name,
      description: dto.description,
      // 将 defaultProps 的 undefined 转为 {} 以满足实体非空约束
      components: dto.components.map(c => ({ ...c, defaultProps: c.defaultProps ?? {} })),
      createdBy: 'admin',
    })
    return {
      id: tpl.id,
      name: tpl.name,
      description: tpl.description,
      components: tpl.components,
      status: tpl.status,
      createdAt: tpl.createdAt,
      updatedAt: tpl.updatedAt,
    }
  }

  @Get('templates')
  @ApiOperation({ summary: '获取模板列表' })
  listTemplates(@Query('status') status?: string): Record<string, unknown>[] {
    return this.lowcodeService.listTemplates(status ? { status } : undefined).map((tpl) => ({
      id: tpl.id,
      name: tpl.name,
      description: tpl.description,
      components: tpl.components,
      status: tpl.status,
      createdAt: tpl.createdAt,
      updatedAt: tpl.updatedAt,
    }))
  }

  @Get('templates/:id')
  @ApiOperation({ summary: '获取模板详情' })
  getTemplate(@Param('id') id: string): Record<string, unknown> {
    const tpl = this.lowcodeService.getTemplate(id)
    if (!tpl) throw new Error(`Template not found: ${id}`)
    return {
      id: tpl.id,
      name: tpl.name,
      description: tpl.description,
      components: tpl.components,
      status: tpl.status,
      createdAt: tpl.createdAt,
      updatedAt: tpl.updatedAt,
    }
  }

  @Put('templates/:id')
  @ApiOperation({ summary: '更新模板' })
  updateTemplate(@Param('id') id: string, @Body() dto: UpdateTemplateDto): Record<string, unknown> {
    const tpl = this.lowcodeService.updateTemplate(id, {
      ...dto,
      // 同 registerTemplate，确保组件 defaultProps 非 undefined
      components: dto.components?.map(c => ({ ...c, defaultProps: c.defaultProps ?? {} })),
    })
    return {
      id: tpl.id,
      name: tpl.name,
      description: tpl.description,
      components: tpl.components,
      status: tpl.status,
      createdAt: tpl.createdAt,
      updatedAt: tpl.updatedAt,
    }
  }

  @Delete('templates/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '删除模板' })
  deleteTemplate(@Param('id') id: string): void {
    this.lowcodeService.deleteTemplate(id)
  }

  // ==================== 快照管理 ====================

  @Post('snapshots')
  @ApiOperation({ summary: '创建页面快照（版本）' })
  @ApiResponse({ status: HttpStatus.CREATED, description: '创建成功' })
  createSnapshot(@Body() dto: CreateSnapshotDto): Record<string, unknown> {
    const snap = this.lowcodeService.createSnapshot(dto.pageId, dto.changelog, dto.publishedBy)
    return {
      id: snap.id,
      pageId: snap.pageId,
      version: snap.version,
      changelog: snap.changelog,
      publishedBy: snap.publishedBy,
      createdAt: snap.createdAt,
    }
  }

  @Get('snapshots/:pageId')
  @ApiOperation({ summary: '获取页面快照列表' })
  listSnapshots(@Param('pageId') pageId: string): Record<string, unknown>[] {
    return this.lowcodeService.listSnapshots(pageId).map((s) => ({
      id: s.id,
      pageId: s.pageId,
      version: s.version,
      changelog: s.changelog,
      publishedBy: s.publishedBy,
      createdAt: s.createdAt,
    }))
  }

  // ==================== 组件库管理 ====================

  @Post('components')
  @ApiOperation({ summary: '注册组件到组件库' })
  @ApiResponse({ status: HttpStatus.CREATED, description: '注册成功' })
  registerComponent(@Body() dto: RegisterComponentDto): Record<string, unknown> {
    const comp = this.lowcodeService.registerComponent({
      name: dto.name,
      type: dto.type,
      defaultProps: dto.defaultProps,
      schema: dto.schema,
    })
    return {
      id: comp.id,
      name: comp.name,
      type: comp.type,
      defaultProps: comp.defaultProps,
      schema: comp.schema,
      status: comp.status,
      createdAt: comp.createdAt,
    }
  }

  @Get('components')
  @ApiOperation({ summary: '获取组件库列表' })
  listComponents(): Record<string, unknown>[] {
    return this.lowcodeService.listComponentLibrary().map((c) => ({
      id: c.id,
      name: c.name,
      type: c.type,
      defaultProps: c.defaultProps,
      schema: c.schema,
      status: c.status,
    }))
  }

  // ==================== 页面导入导出 ====================

  @Get('pages/:id/export')
  @ApiOperation({ summary: '导出页面为 JSON' })
  exportPage(@Param('id') id: string): Record<string, unknown> {
    return this.lowcodeService.exportPage(id) as unknown as Record<string, unknown>
  }

  @Post('pages/import')
  @ApiOperation({ summary: '从 JSON 导入页面' })
  @ApiResponse({ status: HttpStatus.CREATED, description: '导入成功' })
  importPage(@Body() dto: PageImportDto): Record<string, unknown> {
    const rawData = dto.data as unknown as {
      templateId: string
      name: string
      components: Record<string, unknown>[]
      status: string
      version: number
    }
    const page = this.lowcodeService.importPage(
      {
        templateId: rawData.templateId,
        name: rawData.name,
        components: rawData.components ?? [],
        status: rawData.status ?? 'draft',
        version: rawData.version ?? 1,
      },
      dto.name,
    )
    return {
      id: page.id,
      templateId: page.templateId,
      name: page.name,
      components: page.components,
      status: page.status,
      createdAt: page.createdAt,
      updatedAt: page.updatedAt,
    }
  }

  // ==================== 仪表盘统计 ====================

  @Get('dashboard')
  @ApiOperation({ summary: '获取仪表盘统计' })
  getDashboardStats(): DashboardStatsDto {
    return this.lowcodeService.getDashboardStats()
  }
}
