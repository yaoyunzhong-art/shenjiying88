/**
 * Phase 103 多模态融合分析 Controller (V11 Sprint 3 Day 40)
 */

import {
  Controller, Get, Post, Delete, Param, Body, Query, HttpCode, HttpStatus,
} from '@nestjs/common'
import { MultimodalFusionService } from './multimodal-fusion.service'
import type {
  CreateFusionTaskDto, CrossModalSearchDto, ListFusionTasksQuery,
} from './multimodal-fusion.dto'
import type { FusionSource } from './multimodal-fusion.entity'

@Controller('fusion')
export class MultimodalFusionController {
  constructor(private readonly service: MultimodalFusionService) {}

  // ============ 融合任务 ============
  @Post('tasks')
  @HttpCode(HttpStatus.CREATED)
  async createTask(@Body() body: CreateFusionTaskDto) { return this.service.createFusionTask(body) }

  @Get('tasks')
  async listTasks(@Query() query: ListFusionTasksQuery) {
    const items = await this.service.listFusionTasks(query)
    return { items, total: items.length }
  }

  @Get('tasks/:id')
  async getTask(@Param('id') id: string) { return this.service.getFusionTask(id) }

  @Post('tasks/:id/cancel')
  @HttpCode(HttpStatus.OK)
  async cancelTask(@Param('id') id: string) { return this.service.cancelFusionTask(id) }

  // ============ 跨模态搜索 ============
  @Post('search')
  @HttpCode(HttpStatus.OK)
  async crossModalSearch(@Body() body: CrossModalSearchDto) {
    const items = await this.service.crossModalSearch(body)
    return { items, total: items.length }
  }

  // ============ 数据源索引 ============
  @Post('index/item')
  @HttpCode(HttpStatus.CREATED)
  async indexItem(@Body() body: { itemId: string; modality: FusionSource; text: string; metadata?: any }) {
    await this.service.indexItem(body.itemId, body.modality, body.text, body.metadata ?? {})
    return { indexed: true }
  }

  @Post('index/tabular')
  @HttpCode(HttpStatus.CREATED)
  async indexTabular(@Body() body: { seriesId: string; data: Array<{ ts: string; value: number }> }) {
    await this.service.indexTabularData(body.seriesId, body.data)
    return { indexed: true }
  }

  // ============ 模板与引擎 ============
  @Get('templates')
  async listTemplates() { return { items: this.service.listTemplates() } }

  @Get('engines')
  async listEngines() { return { items: this.service.listEngines() } }

  // ============ 统计 ============
  @Get('stats')
  async stats() { return this.service.getFusionStats() }
}