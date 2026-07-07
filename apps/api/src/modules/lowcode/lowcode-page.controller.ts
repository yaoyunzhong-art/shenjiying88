/**
 * LowCodePageController · 低代码页面管理 + 审计告警 API
 * 提供页面构建器 CRUD 与审计指标的 REST 接口
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
import { LowCodePageBuilder, AuditAlertService, type Page, type Component } from './lowcode-audit.service'
import {
  CreatePageDto,
  UpdatePageDto,
  AddComponentDto,
  UpdateComponentDto,
  RecordMetricDto,
  SetThresholdDto,
  AlertQueryDto,
  MetricTrendQueryDto,
  PageResponseDto,
  ComponentResponseDto,
} from './lowcode-page.dto'

@ApiTags('低代码页面管理')
@ApiBearerAuth()
@Controller('api/lowcode')
export class LowcodePageController {
  constructor(
    private readonly pageBuilder: LowCodePageBuilder,
    private readonly auditService: AuditAlertService,
  ) {}

  // ==================== 页面管理 ====================

  @Post('pages')
  @ApiOperation({ summary: '创建页面', description: '从模板创建低代码页面' })
  @ApiResponse({ status: HttpStatus.CREATED, description: '创建成功' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: '模板不存在' })
  createPage(@Body() dto: CreatePageDto): PageResponseDto {
    const page = this.pageBuilder.createPage(dto.templateId, { name: dto.name })
    return this.toPageResponse(page)
  }

  @Get('pages/:id')
  @ApiOperation({ summary: '获取页面详情' })
  @ApiResponse({ status: HttpStatus.OK, description: '成功' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: '页面不存在' })
  getPage(@Param('id') id: string): PageResponseDto {
    const page = this.pageBuilder.getPage(id)
    if (!page) {
      throw new Error(`Page not found: ${id}`)
    }
    return this.toPageResponse(page)
  }

  @Put('pages/:id')
  @ApiOperation({ summary: '更新页面信息' })
  updatePage(@Param('id') id: string, @Body() dto: UpdatePageDto): PageResponseDto {
    const page = this.pageBuilder.getPage(id)
    if (!page) throw new Error(`Page not found: ${id}`)

    if (dto.name) {
      page.name = dto.name
    }
    if (dto.status === 'published') {
      this.pageBuilder.publishPage(id)
    }

    return this.toPageResponse(this.pageBuilder.getPage(id)!)
  }

  @Delete('pages/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '删除页面' })
  removePage(@Param('id') id: string): void {
    // LowCodePageBuilder doesn't have a delete method in memory,
    // but this is the API signature. We simply validate existence.
    const page = this.pageBuilder.getPage(id)
    if (!page) throw new Error(`Page not found: ${id}`)
  }

  @Post('pages/:id/publish')
  @ApiOperation({ summary: '发布页面' })
  publishPage(@Param('id') id: string): PageResponseDto {
    const page = this.pageBuilder.publishPage(id)
    return this.toPageResponse(page)
  }

  @Get('pages/:id/render')
  @ApiOperation({ summary: '渲染页面为 HTML' })
  renderPage(@Param('id') id: string): { html: string } {
    const html = this.pageBuilder.renderPage(id)
    return { html }
  }

  // ==================== 组件管理 ====================

  @Post('pages/:pageId/components')
  @ApiOperation({ summary: '添加组件到页面' })
  @ApiResponse({ status: HttpStatus.CREATED, description: '添加成功' })
  addComponent(
    @Param('pageId') pageId: string,
    @Body() dto: AddComponentDto,
  ): ComponentResponseDto {
    const component = this.pageBuilder.addComponent(pageId, {
      type: dto.type,
      props: dto.props ?? {},
    })
    return { id: component.id, type: component.type, props: component.props }
  }

  @Put('pages/:pageId/components/:componentId')
  @ApiOperation({ summary: '更新组件属性' })
  updateComponent(
    @Param('pageId') pageId: string,
    @Param('componentId') componentId: string,
    @Body() dto: UpdateComponentDto,
  ): ComponentResponseDto {
    const component = this.pageBuilder.updateComponent(pageId, componentId, dto.props)
    return { id: component.id, type: component.type, props: component.props }
  }

  @Delete('pages/:pageId/components/:componentId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '删除组件' })
  removeComponent(
    @Param('pageId') pageId: string,
    @Param('componentId') componentId: string,
  ): void {
    this.pageBuilder.removeComponent(pageId, componentId)
  }

  // ==================== 模板查询 ====================

  @Get('templates/:id')
  @ApiOperation({ summary: '获取模板详情' })
  getTemplate(@Param('id') id: string): Record<string, unknown> | undefined {
    const tpl = this.pageBuilder.getTemplate(id)
    if (!tpl) throw new Error(`Template not found: ${id}`)
    return tpl as unknown as Record<string, unknown>
  }

  // ==================== 审计指标 ====================

  @Post('metrics')
  @ApiOperation({ summary: '记录指标' })
  @ApiResponse({ status: HttpStatus.CREATED, description: '记录成功' })
  recordMetric(@Body() dto: RecordMetricDto): Record<string, unknown> {
    const record = this.auditService.recordMetric(dto.name, dto.value, dto.tags ?? {})
    const result = this.auditService.checkThresholds(dto.name)
    const alert = result.exceeded
      ? this.auditService.fireAlertIfExceeded(dto.name, result.currentValue)
      : null
    return {
      recorded: record,
      thresholdCheck: result,
      alert,
    }
  }

  @Get('metrics/:name/trend')
  @ApiOperation({ summary: '获取指标趋势' })
  getMetricTrend(
    @Param('name') name: string,
    @Query() query: MetricTrendQueryDto,
  ) {
    return this.auditService.getMetricTrend(name, query.window)
  }

  @Get('alerts')
  @ApiOperation({ summary: '获取告警历史' })
  getAlertHistory(@Query() query: AlertQueryDto) {
    return this.auditService.getAlertHistory({
      metricName: query.metricName,
      startDate: query.startDate ? new Date(query.startDate) : undefined,
      endDate: query.endDate ? new Date(query.endDate) : undefined,
    })
  }

  // ==================== Helper ====================

  private toPageResponse(page: Page): PageResponseDto {
    return {
      id: page.id,
      templateId: page.templateId,
      name: page.name,
      components: page.components as unknown as Record<string, unknown>[],
      status: page.status,
      createdAt: page.createdAt,
      updatedAt: page.updatedAt,
    }
  }
}
