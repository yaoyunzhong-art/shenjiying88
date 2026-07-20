/**
 * db-knowledge.controller.ts — 数据库知识库控制器
 *
 * 提供对 DB 知识库的 RESTful 查询接口。
 * 所有接口在 DB 不可用时会优雅降级返回空值。
 */

import { Controller, Get, Post, Query, Param, Body, UsePipes, ValidationPipe, UseGuards } from '@nestjs/common'
import { DbKnowledgeService } from './db-knowledge.service'
import { SearchQueryDto, KindQueryDto, GroupQueryDto, CityQueryDto, PatternFilterDto } from './db-knowledge.dto'
import type { SearchResult, KnowledgeDoc, ExpertProfile, AcceptancePulse, PhaseRecord, PatternRecord, CompetitorVenue, DailyBrief } from './db-knowledge.entity'
import { TenantGuard } from '../agent/tenant.guard'

@Controller('db-knowledge')
@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
@UseGuards(TenantGuard)
export class DbKnowledgeController {
  constructor(private readonly dbKnowledgeService: DbKnowledgeService) {}

  /** GET /api/db-knowledge/status — 检查 DB 可用性 */
  @Get('status')
  status(): { available: boolean } {
    return { available: this.dbKnowledgeService.available }
  }

  /** GET /api/db-knowledge/search — 全文搜索知识文档 */
  @Get('search')
  async search(@Query() query: SearchQueryDto): Promise<SearchResult[]> {
    return this.dbKnowledgeService.search(query.query, query.kind, query.limit)
  }

  /** GET /api/db-knowledge/documents/:kind — 按种类查询文档 */
  @Get('documents/:kind')
  async getDocumentsByKind(@Param() params: KindQueryDto): Promise<KnowledgeDoc[]> {
    return this.dbKnowledgeService.getDocumentsByKind(params.kind)
  }

  /** GET /api/db-knowledge/experts — 查询专家列表 */
  @Get('experts')
  async getExperts(@Query() query: GroupQueryDto): Promise<ExpertProfile[]> {
    return this.dbKnowledgeService.getExperts(query.groupId)
  }

  /** GET /api/db-knowledge/pulses — 获取最近验收脉冲 */
  @Get('pulses')
  async getRecentPulses(@Query() query: GroupQueryDto): Promise<AcceptancePulse[]> {
    return this.dbKnowledgeService.getRecentPulses(query.limit ?? 20)
  }

  /** GET /api/db-knowledge/phases — 获取活跃阶段 */
  @Get('phases')
  async getActivePhases(): Promise<PhaseRecord[]> {
    return this.dbKnowledgeService.getActivePhases()
  }

  /** GET /api/db-knowledge/patterns — 获取反模式/正向模式 */
  @Get('patterns')
  async getPatterns(@Query() query: PatternFilterDto): Promise<PatternRecord[]> {
    return this.dbKnowledgeService.getPatterns(query.type)
  }

  /** GET /api/db-knowledge/venues — 按城市查询竞品场馆 */
  @Get('venues')
  async getVenuesByCity(@Query() query: CityQueryDto): Promise<CompetitorVenue[]> {
    return this.dbKnowledgeService.getVenuesByCity(query.city)
  }

  /** GET /api/db-knowledge/brief/today — 获取今日简报 */
  @Get('brief/today')
  async getTodayBrief(): Promise<DailyBrief | { message: string }> {
    const brief = await this.dbKnowledgeService.getTodayBrief()
    if (!brief) return { message: '今日暂无简报数据' }
    return brief
  }

  /** POST /api/db-knowledge/search/log — 记录搜索日志 */
  @Post('search/log')
  async logSearch(@Body() body: { query: string; count: number; durationMs: number }): Promise<{ logged: boolean }> {
    await this.dbKnowledgeService.logSearch(body.query, body.count, body.durationMs)
    return { logged: true }
  }
}
