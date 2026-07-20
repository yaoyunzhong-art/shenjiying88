/**
 * Phase 100 OCR + 文档解析 Controller (V11 Sprint 3 Day 33)
 */

import {
  Controller, Get, Post, Delete, Param, Body, Query, HttpCode, HttpStatus,
UseGuards,
} from '@nestjs/common'
import { OcrService } from './ocr.service'
import type {
  CreateOcrTaskDto, ParseDocumentDto,
  ListOcrTasksQuery, ListDocumentsQuery,
} from './ocr.dto'
import { TenantGuard } from '../agent/tenant.guard'

@Controller('ocr')
@UseGuards(TenantGuard)
export class OcrController {
  constructor(private readonly service: OcrService) {}

  // ============ OCR 任务 ============
  @Post('tasks')
  @HttpCode(HttpStatus.CREATED)
  async createTask(@Body() body: CreateOcrTaskDto) {
    return this.service.createOcrTask(body)
  }

  @Get('tasks')
  async listTasks(@Query() query: ListOcrTasksQuery) {
    const items = await this.service.listOcrTasks(query)
    return { items, total: items.length }
  }

  @Get('tasks/:id')
  async getTask(@Param('id') id: string) { return this.service.getOcrTask(id) }

  @Post('tasks/:id/cancel')
  @HttpCode(HttpStatus.OK)
  async cancelTask(@Param('id') id: string) { return this.service.cancelOcrTask(id) }

  @Delete('tasks/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteTask(@Param('id') id: string) { await this.service.deleteOcrTask(id) }

  // ============ OCR 文本块 ============
  @Get('tasks/:id/blocks')
  async listBlocks(@Param('id') id: string) {
    const items = await this.service.listOcrBlocks(id)
    return { items, total: items.length }
  }

  // ============ 文档解析 ============
  @Post('documents')
  @HttpCode(HttpStatus.CREATED)
  async parseDocument(@Body() body: ParseDocumentDto) { return this.service.parseDocument(body) }

  @Get('documents')
  async listDocuments(@Query() query: ListDocumentsQuery) {
    const items = await this.service.listDocuments(query)
    return { items, total: items.length }
  }

  @Get('documents/:id')
  async getDocument(@Param('id') id: string) { return this.service.getDocument(id) }

  @Delete('documents/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteDocument(@Param('id') id: string) { await this.service.deleteDocument(id) }

  // ============ 引擎元数据 ============
  @Get('engines')
  async listEngines() { return { items: this.service.listEngines() } }

  // ============ 统计 ============
  @Get('stats')
  async stats() { return this.service.getOcrStats() }
}