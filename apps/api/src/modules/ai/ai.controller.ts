/**
 * ai.controller.ts — AI 分析 REST API
 */
import { Controller, Post, Body, UseGuards } from '@nestjs/common'
import { AiService } from './ai.service'
import { TenantGuard } from '../agent/tenant.guard'

@Controller('ai')
@UseGuards(TenantGuard)
export class AiController {
  constructor(private readonly service: AiService) {}

  /** 文本综合AI分析 */
  @Post('analyze')
  analyze(@Body() body: { text: string; topKKeywords?: number; maxCategories?: number }) {
    return this.service.analyzeText(body.text, body)
  }

  /** 情感打分 */
  @Post('sentiment')
  sentiment(@Body() body: { text: string }) {
    return this.service.sentimentScore(body.text)
  }

  /** 关键词提取 */
  @Post('keywords')
  keywords(@Body() body: { text: string; topK?: number }) {
    return this.service.extractKeywords(body.text)
  }
}
