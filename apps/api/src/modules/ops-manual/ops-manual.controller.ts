/**
 * 🐜 自动: [ops-manual] [A] controller 补全
 *
 * 运营手册 RESTful API:
 * - POST   /ops-manual/generate            生成运营手册
 * - POST   /ops-manual/export              导出手册 (markdown/html/checklist/pdf-json)
 * - POST   /ops-manual/search              搜索手册内容
 * - POST   /ops-manual/sop                 获取 SOP 步骤
 * - GET    /ops-manual/info                获取手册元信息
 * - POST   /ops-manual/records             创建手册生成记录
 * - GET    /ops-manual/records             查询手册生成记录列表
 * - GET    /ops-manual/records/:id         获取生成记录详情
 */

import { Controller, Get, Post, Body, Param, Query, HttpCode, HttpStatus, Logger, , UseGuards } from '@nestjs/common'
import { OpsManualService } from './ops-manual.service'
import type {
  GenerateManualDto,
  ExportManualDto,
  ExportManualResponseDto,
  SearchManualDto,
  SearchManualResponseDto,
  GetSopDto,
  GetSopResponseDto,
  ManualInfoQueryDto,
  ManualInfoResponseDto,
  CreateManualRecordDto,
  ManualRecordResponseDto,
  ManualRecordListResponseDto,
  ManualRecordQueryDto,
} from './ops-manual.dto'
import { TenantGuard } from '../agent/tenant.guard'

@Controller('ops-manual')
@UseGuards(TenantGuard)
export class OpsManualController {
  private readonly logger = new Logger(OpsManualController.name)

  constructor(private readonly service: OpsManualService) {}

  // ============ 手册生成 ============

  /** POST /ops-manual/generate */
  @Post('generate')
  @HttpCode(HttpStatus.CREATED)
  async generateManual(@Body() dto: GenerateManualDto): Promise<any> {
    this.logger.log(`POST /ops-manual/generate role=${dto.role}`)
    const manual = this.service.generateManual(dto.role)
    return {
      ...manual,
      lastUpdated: manual.lastUpdated.toISOString(),
    }
  }

  // ============ 手册导出 ============

  /** POST /ops-manual/export */
  @Post('export')
  @HttpCode(HttpStatus.OK)
  async exportManual(@Body() dto: ExportManualDto): Promise<ExportManualResponseDto> {
    this.logger.log(`POST /ops-manual/export role=${dto.role} format=${dto.format}`)
    const manual = this.service.generateManual(dto.role)
    let content: string
    switch (dto.format) {
      case 'markdown':
        content = this.service.exportMarkdown(manual)
        break
      case 'html':
        content = this.service.exportHTML(manual)
        break
      case 'checklist':
        content = this.service.exportChecklist(manual)
        break
      case 'pdf-json':
        content = this.service.exportPDFJSON(manual)
        break
      default:
        content = this.service.exportMarkdown(manual)
    }
    return {
      content,
      format: dto.format,
      role: dto.role,
      title: manual.title,
    }
  }

  // ============ 手册搜索 ============

  /** POST /ops-manual/search */
  @Post('search')
  @HttpCode(HttpStatus.OK)
  async searchManual(@Body() dto: SearchManualDto): Promise<SearchManualResponseDto> {
    this.logger.log(`POST /ops-manual/search role=${dto.role} keyword=${dto.keyword}`)
    const results = this.service.searchManual(dto.role, dto.keyword)
    return {
      results: results.map(r => ({
        sectionId: r.sectionId,
        title: r.title,
        matchedContent: r.matchedContent,
      })),
      total: results.length,
      keyword: dto.keyword,
      role: dto.role,
    }
  }

  // ============ SOP 查询 ============

  /** POST /ops-manual/sop */
  @Post('sop')
  @HttpCode(HttpStatus.OK)
  async getSOP(@Body() dto: GetSopDto): Promise<GetSopResponseDto> {
    this.logger.log(`POST /ops-manual/sop role=${dto.role} sectionId=${dto.sectionId}`)
    const steps = this.service.getSOP(dto.role, dto.sectionId)
    return {
      role: dto.role,
      sectionId: dto.sectionId,
      steps: steps.map(s => ({
        step: s.step,
        action: s.action,
        script: s.script,
        tips: s.tips,
      })),
    }
  }

  // ============ 手册元信息 ============

  /** GET /ops-manual/info */
  @Get('info')
  async getManualInfo(@Query() queryDto: ManualInfoQueryDto): Promise<ManualInfoResponseDto> {
    this.logger.log(`GET /ops-manual/info role=${queryDto.role}`)
    const info = this.service.getManualInfo(queryDto.role)
    return { ...info, lastUpdated: new Date().toISOString() }
  }

  // ============ 生成记录 CRUD (内存模拟) ============

  private records: ManualRecordResponseDto[] = []
  private idCounter = 0

  /** POST /ops-manual/records */
  @Post('records')
  @HttpCode(HttpStatus.CREATED)
  async createRecord(@Body() dto: CreateManualRecordDto): Promise<ManualRecordResponseDto> {
    this.logger.log(`POST /ops-manual/records role=${dto.role}`)
    const now = new Date().toISOString()
    const record: ManualRecordResponseDto = {
      id: `${++this.idCounter}`,
      tenantId: dto.tenantId,
      role: dto.role,
      title: dto.title,
      version: dto.version ?? '1.0.0',
      exportFormat: dto.exportFormat ?? 'markdown',
      content: dto.content,
      totalSections: dto.totalSections ?? 0,
      totalPages: dto.totalPages ?? 0,
      estimatedReadTime: dto.estimatedReadTime ?? 0,
      generatedBy: dto.generatedBy,
      createdAt: now,
      updatedAt: now,
    }
    this.records.push(record)
    return record
  }

  /** GET /ops-manual/records */
  @Get('records')
  async listRecords(@Query() queryDto: ManualRecordQueryDto): Promise<ManualRecordListResponseDto> {
    this.logger.log(`GET /ops-manual/records page=${queryDto.page ?? 1}`)
    let filtered = [...this.records]
    if (queryDto.tenantId) {
      filtered = filtered.filter(r => r.tenantId === queryDto.tenantId)
    }
    if (queryDto.role) {
      filtered = filtered.filter(r => r.role === queryDto.role)
    }
    const page = queryDto.page ?? 1
    const pageSize = queryDto.pageSize ?? 10
    const start = (page - 1) * pageSize
    const paged = filtered.slice(start, start + pageSize)
    return {
      data: paged,
      total: filtered.length,
      page,
      pageSize,
    }
  }

  /** GET /ops-manual/records/:id */
  @Get('records/:id')
  async getRecord(@Param('id') id: string): Promise<ManualRecordResponseDto | null> {
    this.logger.log(`GET /ops-manual/records/${id}`)
    return this.records.find(r => r.id === id) ?? null
  }
}
