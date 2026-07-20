/**
 * empower-card.controller.ts — 赋能卡片 API 端点 (ADR-045)
 *
 * GET    /api/empower-cards          — 列表/搜索
 * POST   /api/empower-cards          — 创建
 * GET    /api/empower-cards/:id      — 详情
 * POST   /api/empower-cards/match    — 派单自动匹配 top-3
 * POST   /api/empower-cards/:id/quote— 记录引用
 * POST   /api/empower-cards/decay    — 触发退化曲线
 * GET    /api/empower-cards/stats/today — 今日赋能评分
 */

import { Controller, Get, Post, Body, Param, Query, Logger, UseGuards } from '@nestjs/common'
import { EmpowerCardService } from './empower-card.service'
import type { CreateEmpowerCardDto, EmpowerCardHealthResponse, EmpowerCardSearchQuery, EmpowerCardEntity } from './empower-card.entity'
import { TenantGuard } from '../agent/tenant.guard'

@Controller('empower-cards')
@UseGuards(TenantGuard)
export class EmpowerCardController {
  private readonly logger = new Logger(EmpowerCardController.name)

  constructor(private readonly service: EmpowerCardService) {}

  @Post()
  async create(@Body() dto: CreateEmpowerCardDto): Promise<EmpowerCardEntity> {
    return this.service.create(dto)
  }

  @Get()
  async list(@Query('minFreshness') minFreshness?: string): Promise<EmpowerCardEntity[]> {
    return this.service.list(minFreshness ? parseInt(minFreshness, 10) : 0)
  }

  @Get(':id')
  async getById(@Param('id') id: string): Promise<EmpowerCardEntity> {
    return this.service.getById(id)
  }

  /** 搜索知识卡片 (关键词/标签/模块) */
  @Post('search')
  async search(@Body() query: EmpowerCardSearchQuery): Promise<any> {
    return this.service.search(query)
  }

  /** 派单自动匹配 top-3 */
  @Post('match')
  async matchForDispatch(
    @Body() body: { module: string; keywords?: string[] }
  ): Promise<EmpowerCardEntity[]> {
    return this.service.autoMatchForDispatch(body.module, body.keywords ?? [])
  }

  /** 记录引用 */
  @Post(':id/quote')
  async recordQuote(
    @Param('id') id: string,
    @Body() body: { taskName: string; moduleName: string; quotedBy: string }
  ): Promise<{ success: boolean }> {
    await this.service.recordQuote(id, body.taskName, body.moduleName, body.quotedBy)
    return { success: true }
  }

  /** 触发退化曲线 */
  @Post('decay')
  async applyDecay(): Promise<{ decayed: number; archived: number }> {
    return this.service.applyDecay()
  }

  /** 健康检查 */
  @Get('health')
  async healthCheck(): Promise<EmpowerCardHealthResponse> {
    return this.service.healthCheck()
  }

  /** 今日赋能评分 */
  @Get('stats/today')
  async getTodayScore(): Promise<{ score: number; quotes: number; newCards: number }> {
    return this.service.getTodayEmpowerScore()
  }
}
