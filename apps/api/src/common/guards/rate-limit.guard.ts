// rate-limit.guard.ts · 全局限流 (BL-1: P0修复)
// 2026-07-26 · @nestjs/throttler v6
//
// 策略:
//   - GET 请求: 100 req/min (宽松 — 门店信息/时段查询)
//   - POST/PUT/PATCH/DELETE: 20 req/min (收紧 — 创建预约/支付/改期)
//   - 健康检查/文档: 跳过限流
//   - @Public() 端点纳入限流保护

import { Injectable, ExecutionContext } from '@nestjs/common'
import {
  ThrottlerGuard,
  ThrottlerException,
  ThrottlerRequest,
  ThrottlerLimitDetail,
} from '@nestjs/throttler'

@Injectable()
export class RateLimitGuard extends ThrottlerGuard {
  /**
   * 按方法前缀区分 tracker key
   */
  override async getTracker(req: Record<string, any>): Promise<string> {
    const method = req.method ?? 'GET'
    return `${method}:${req.ip ?? 'unknown'}`
  }

  /**
   * 跳过不需要限流的路径
   */
  override async shouldSkip(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest()
    if (!request) return true
    const path = request.path ?? ''
    if (path.startsWith('/api/v1/health')) return true
    if (path.startsWith('/docs') || path.startsWith('/api-json')) return true
    return false
  }

  /**
   * 限流处理 (v6 签名)
   */
  override async handleRequest(requestProps: ThrottlerRequest): Promise<boolean> {
    const result = await super.handleRequest(requestProps)
    return result
  }

  /**
   * 自定义限流错误体
   */
  override async throwThrottlingException(
    context: ExecutionContext,
    throttlerLimitDetail: ThrottlerLimitDetail,
  ): Promise<void> {
    const { timeToBlockExpire, totalHits, limit } = throttlerLimitDetail
    const waitSeconds = Math.ceil((timeToBlockExpire ?? 0) / 1000)
    throw new ThrottlerException(
      `请求过于频繁，请在 ${waitSeconds} 秒后重试 (限制: ${limit} 次/分钟, 当前: ${totalHits})`,
    )
  }
}
