// gateway.controller.ts — Gateway API 网关 REST 控制器
import { Controller, Post, Get, Body, Param, Query, UsePipes, ValidationPipe, HttpCode, HttpStatus, NotFoundException, UseGuards } from '@nestjs/common'
import { APIGateway, RateLimiterService, APIKeyManager } from './gateway.service'
import { GatewayAnalyticsService } from './gateway-analytics.service'
import { AuthCheckDto, RouteLookupDto, QuotaSetDto, QuotaQueryDto, CreateApiKeyDto, RevokeApiKeyDto, AnalyticsQueryDto } from './gateway.dto'
import type { AuthResult, RateLimitResult, QuotaStatus, APIKey, GatewayLogEntry, GatewayAnalyticsSummary, EndpointAnalytics, ClientAnalytics, TimeSeriesPoint, AnomalyDetectionResult } from './gateway.entity'
import { TenantGuard } from '../agent/tenant.guard'

@Controller('gateway')
@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
@UseGuards(TenantGuard)
export class GatewayController {
  constructor(
    private readonly apiGateway: APIGateway,
    private readonly rateLimiter: RateLimiterService,
    private readonly apiKeyManager: APIKeyManager,
    private readonly analyticsService: GatewayAnalyticsService,
  ) {}

  /** 路由查找 — 根据 path/method 找到目标微服务 */
  @Post('route')
  @HttpCode(HttpStatus.OK)
  async routeLookup(@Body() dto: RouteLookupDto): Promise<{ found: boolean; service?: string; timeout?: number }> {
    const route = await this.apiGateway.routeRequest({
      path: dto.path,
      method: dto.method,
      headers: {},
    })
    if (!route) {
      return { found: false }
    }
    return { found: true, service: route.service, timeout: route.timeout }
  }

  /** 身份认证 — 验证 API Key */
  @Post('auth')
  @HttpCode(HttpStatus.OK)
  async authenticate(@Body() dto: AuthCheckDto): Promise<AuthResult> {
    return this.apiGateway.authenticate({
      path: dto.path,
      method: dto.method,
      headers: {
        'x-api-key': dto.apiKey,
      },
    })
  }

  /** 限流检查 */
  @Post('rate-limit')
  @HttpCode(HttpStatus.OK)
  async checkRateLimit(@Body() dto: { clientId: string; path: string; method: string }): Promise<RateLimitResult> {
    return this.apiGateway.rateLimit(dto.clientId, {
      path: dto.path,
      method: dto.method,
      headers: {},
    })
  }

  /** 消费令牌（检查 + 扣减） */
  @Post('rate-limit/consume')
  @HttpCode(HttpStatus.OK)
  async consumeToken(@Body() dto: { clientId: string; path: string; method: string }): Promise<RateLimitResult> {
    const endpoint = `${dto.method}:${dto.path}`
    return this.rateLimiter.consumeToken(dto.clientId, endpoint)
  }

  /** 查询配额状态 */
  @Post('quota')
  @HttpCode(HttpStatus.OK)
  async getQuotaStatus(@Body() dto: QuotaQueryDto): Promise<QuotaStatus | QuotaStatus[]> {
    return this.rateLimiter.getQuotaStatus(dto.clientId, dto.endpoint)
  }

  /** 修改配额 */
  @Post('quota/set')
  @HttpCode(HttpStatus.OK)
  async setQuota(@Body() dto: QuotaSetDto): Promise<{ success: boolean }> {
    await this.rateLimiter.setQuota(dto.clientId, dto.endpoint, {
      maxTokens: dto.maxTokens,
      refillRate: dto.refillRate,
    })
    return { success: true }
  }

  /** 创建 API Key */
  @Post('api-keys')
  @HttpCode(HttpStatus.CREATED)
  async createApiKey(@Body() dto: CreateApiKeyDto): Promise<APIKey> {
    return this.apiKeyManager.createAPIKey(dto.name, dto.ownerId, dto.scopes)
  }

  /** 列出用户的 API Keys */
  @Get('api-keys/:ownerId')
  async listApiKeys(@Param('ownerId') ownerId: string): Promise<APIKey[]> {
    return this.apiKeyManager.listAPIKeys(ownerId)
  }

  /** 吊销 API Key */
  @Post('api-keys/revoke')
  @HttpCode(HttpStatus.OK)
  async revokeApiKey(@Body() dto: RevokeApiKeyDto): Promise<{ success: boolean }> {
    const ok = await this.apiKeyManager.revokeAPIKey(dto.keyId)
    if (!ok) {
      throw new NotFoundException(`API Key ${dto.keyId} 不存在`)
    }
    return { success: true }
  }

  /** 获取网关请求日志 */
  @Get('logs')
  getRequestLogs(@Query('limit') limit?: string): GatewayLogEntry[] {
    const n = limit ? Math.min(Math.max(parseInt(limit, 10) || 100, 1), 1000) : 100
    return this.apiGateway.getRequestLogs(n)
  }

  // ============ Gateway Analytics ============

  /** 网关分析摘要 */
  @Get('analytics/summary')
  async getAnalyticsSummary(@Query() query?: AnalyticsQueryDto): Promise<GatewayAnalyticsSummary> {
    return this.analyticsService.getSummary(query)
  }

  /** 端点级分析 */
  @Get('analytics/endpoints')
  async getEndpointAnalytics(@Query() query?: AnalyticsQueryDto): Promise<EndpointAnalytics[]> {
    return this.analyticsService.getEndpointAnalytics(query)
  }

  /** 客户端分析 */
  @Get('analytics/clients')
  async getClientAnalytics(@Query() query?: AnalyticsQueryDto): Promise<ClientAnalytics[]> {
    return this.analyticsService.getClientAnalytics(query)
  }

  /** 请求时间序列 */
  @Get('analytics/timeseries')
  async getTimeSeries(@Query() query?: AnalyticsQueryDto): Promise<{ requests: TimeSeriesPoint[]; errors: TimeSeriesPoint[]; latencies: TimeSeriesPoint[] }> {
    return this.analyticsService.getTimeSeries(query)
  }

  /** 异常检测 */
  @Get('analytics/anomalies')
  async detectAnomalies(@Query() query?: AnalyticsQueryDto): Promise<AnomalyDetectionResult[]> {
    return this.analyticsService.detectAnomalies(query)
  }
}
