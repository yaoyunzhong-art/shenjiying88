/**
 * Phase 101 图像识别 Controller (V11 Sprint 3 Day 36)
 */

import {
  Controller, Get, Post, Delete, Param, Body, Query, HttpCode, HttpStatus,
} from '@nestjs/common'
import { ImageRecognitionService } from './image-recognition.service'
import type {
  CreateRecognitionDto, VisualSearchDto, DuplicateDetectionDto, ListRecognitionQuery,
} from './image-recognition.dto'

@Controller('image-recognition')
export class ImageRecognitionController {
  constructor(private readonly service: ImageRecognitionService) {}

  // ============ 识别任务 ============
  @Post('tasks')
  @HttpCode(HttpStatus.CREATED)
  async createRecognition(@Body() body: CreateRecognitionDto) {
    return this.service.createRecognition(body)
  }

  @Get('tasks')
  async listTasks(@Query() query: ListRecognitionQuery) {
    const items = await this.service.listRecognitionTasks(query)
    return { items, total: items.length }
  }

  @Get('tasks/:id')
  async getTask(@Param('id') id: string) { return this.service.getRecognitionResult(id) }

  @Post('tasks/:id/cancel')
  @HttpCode(HttpStatus.OK)
  async cancelTask(@Param('id') id: string) { return this.service.cancelRecognition(id) }

  // ============ 视觉搜索 ============
  @Post('visual-search')
  @HttpCode(HttpStatus.OK)
  async visualSearch(@Body() body: VisualSearchDto) {
    const items = await this.service.visualSearch(body)
    return { items, total: items.length }
  }

  // ============ 重复检测 ============
  @Post('duplicates')
  @HttpCode(HttpStatus.OK)
  async detectDuplicates(@Body() body: DuplicateDetectionDto) {
    return this.service.detectDuplicates(body)
  }

  // ============ 引擎元数据 ============
  @Get('engines')
  async listEngines() { return { items: this.service.listEngines() } }

  // ============ 统计 ============
  @Get('stats')
  async stats() { return this.service.getRecognitionStats() }
}