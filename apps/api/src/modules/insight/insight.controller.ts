/**
 * Phase 94 智能分析 Controller (V10 Sprint 2 Day 16)
 *
 * 5 个 endpoints:
 * - POST /insight/generate        生成洞察 (含 LLM 调用)
 * - GET  /insight/list            列表查询 (cursor 分页)
 * - GET  /insight/:id             按 ID 查询
 * - GET  /insight/templates       列出所有可用模板
 * - POST /insight/cache/prune     清理过期缓存 (admin)
 */

import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common'
import { InsightService } from './insight.service'
import {
  GenerateInsightRequest,
  ListInsightRequest,
  InsightResponse,
} from './insight.dto'
import { listTemplates } from './insight.prompt'
import type { InsightTemplateType, InsightStatus } from './insight.entity'

@Controller('insight')
export class InsightController {
  constructor(private readonly service: InsightService) {}

  @Post('generate')
  @HttpCode(HttpStatus.OK)
  async generate(@Body() body: GenerateInsightRequest): Promise<InsightResponse> {
    return this.service.generate(body)
  }

  @Get('list')
  async list(
    @Query('templateType') templateType?: InsightTemplateType,
    @Query('status') status?: InsightStatus,
    @Query('limit') limit?: string,
    @Query('cursor') cursor?: string,
  ) {
    const req: ListInsightRequest = {
      templateType,
      status,
      limit: limit ? Number(limit) : undefined,
      cursor,
    }
    return this.service.list(req)
  }

  @Get('templates')
  async getTemplates() {
    return { items: listTemplates() }
  }

  @Get(':id')
  async getById(@Param('id') id: string): Promise<InsightResponse> {
    return this.service.getById(id)
  }

  @Post('cache/prune')
  @HttpCode(HttpStatus.OK)
  async pruneCache() {
    const pruned = this.service.pruneExpiredCache()
    return { pruned, ts: new Date().toISOString() }
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async delete(@Param('id') id: string): Promise<{ deleted: boolean }> {
    return this.service.deleteInsight(id)
  }
}
