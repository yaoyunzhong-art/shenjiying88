/**
 * health.controller.ts · RAG 检索模块健康检查 (Phase-19 脚手架)
 *
 * 任务 5 要求:
 *   - GET /api/retrieval/health → { qdrant: ok, embedder: ok, lastIndexAt: ... }
 *
 * 设计:
 *   - 通过 RetrievalService.getComponentHealth() 获取内部状态
 *   - 返回 HTTP 200 + JSON (即使某组件 unavailable,便于 dashboard 采集)
 */

import { Controller, Get, UseGuards } from '@nestjs/common'
import { RetrievalService } from './retrieval.service'
import { TenantGuard } from '../agent/tenant.guard'

@Controller('api/retrieval')
@UseGuards(TenantGuard)
export class RetrievalHealthController {
  constructor(private readonly retrievalService: RetrievalService) {}

  /**
   * GET /api/retrieval/health
   *
   * Returns: {
   *   qdrant: 'ok' | 'degraded' | 'unavailable',
   *   embedder: 'ok' | 'degraded' | 'unavailable',
   *   lastIndexAt: string | null,   // ISO 8601
   *   checkedAt: string,            // ISO 8601
   *   module: 'retrieval',
   *   phase: 'phase-19'
   * }
   */
  @Get('health')
  async health(): Promise<{
    qdrant: string
    embedder: string
    lastIndexAt: string | null
    checkedAt: string
    module: string
    phase: string
  }> {
    const components = await this.retrievalService.getComponentHealth()
    return {
      qdrant: components.qdrant,
      embedder: components.embedder,
      lastIndexAt: components.lastIndexAt,
      checkedAt: new Date().toISOString(),
      module: 'retrieval',
      phase: 'phase-19',
    }
  }
}