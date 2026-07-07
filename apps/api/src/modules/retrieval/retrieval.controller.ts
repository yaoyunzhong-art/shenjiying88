/**
 * retrieval.controller.ts · 对外 REST 端点 (Phase-19 脚手架)
 *
 * 任务 4 要求:
 *   - POST /api/retrieval/query    检索入口
 *   - 鉴权: 仅 main agent 内部调用 (不上对外)
 *
 * 鉴权策略 (Pulse-71 接入):
 *   - 使用 @RequireRoles('INTERNAL_AGENT') decorator
 *   - 或单独 guard (RetrievalInternalGuard),校验 header `x-internal-token`
 *
 * 入参 DTO: RetrievalQueryDto (class-validator 校验)
 * 出参:   RetrievalResponse
 */

import { Body, Controller, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common'
import { RetrievalService } from './retrieval.service'
import type { RetrievalQuery, RetrievalResponse } from './retrieval.types'

@Controller('api/retrieval')
export class RetrievalController {
  constructor(private readonly retrievalService: RetrievalService) {}

  /**
   * POST /api/retrieval/query
   *
   * Body: { query: string, topK?: number, threshold?: number, collections?: [], phaseFilter?: [], pathPrefix?: string }
   * Returns: RetrievalResponse { results, totalHits, latencyMs, cacheHit, collections }
   *
   * ⚠️  当前未启用 Guard,Pulse-71 接入:
   *     @UseGuards(RetrievalInternalGuard)
   *     或在 main.ts 中通过 /api/retrieval/* 路由白名单限制
   */
  @Post('query')
  @HttpCode(HttpStatus.OK)
  async query(@Body() body: RetrievalQuery): Promise<RetrievalResponse> {
    return this.retrievalService.retrieveCode(body)
  }

  /**
   * POST /api/retrieval/query/knowledge
   * 知识库专用检索端点
   */
  @Post('query/knowledge')
  @HttpCode(HttpStatus.OK)
  async queryKnowledge(@Body() body: RetrievalQuery): Promise<RetrievalResponse> {
    return this.retrievalService.retrieveKnowledge(body)
  }
}

/**
 * ⚠️  Guard 占位类 (Pulse-71 实现)
 * 校验 x-internal-token 与 env INTERNAL_AGENT_TOKEN 一致
 */
// @Injectable()
// export class RetrievalInternalGuard implements CanActivate {
//   canActivate(context: ExecutionContext): boolean {
//     const req = context.switchToHttp().getRequest()
//     const token = req.headers['x-internal-token']
//     const expected = process.env.INTERNAL_AGENT_TOKEN
//     if (!expected || token !== expected) {
//       throw new ForbiddenException('internal agent only')
//     }
//     return true
//   }
// }