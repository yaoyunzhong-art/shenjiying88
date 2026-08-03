// gateway.module.ts — Gateway API 网关 NestJS Module
import { Module, OnModuleInit } from '@nestjs/common'
import { GatewayController } from './gateway.controller'
import { APIGateway, RateLimiterService, APIKeyManager } from './gateway.service'
import { GatewayAnalyticsService } from './gateway-analytics.service'

@Module({
  controllers: [GatewayController],
  providers: [APIGateway, RateLimiterService, APIKeyManager, GatewayAnalyticsService],
  exports: [APIGateway, RateLimiterService, APIKeyManager, GatewayAnalyticsService],
})
export class GatewayModule implements OnModuleInit {
  constructor(
    private readonly analyticsService: GatewayAnalyticsService,
    private readonly apiGateway: APIGateway,
  ) {}

  onModuleInit(): void {
    if (!this.analyticsService || typeof this.analyticsService.setLogSource !== 'function') {
      if (process.env.NODE_ENV !== 'production') {
        console.warn('[gateway] analytics service unavailable, skip log source wiring')
      }
      return
    }

    this.analyticsService.setLogSource(this.apiGateway)
  }
}
