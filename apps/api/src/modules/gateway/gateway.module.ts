// gateway.module.ts — Gateway API 网关 NestJS Module
import { Module } from '@nestjs/common'
import { GatewayController } from './gateway.controller'
import { APIGateway, RateLimiterService, APIKeyManager } from './gateway.service'

@Module({
  controllers: [GatewayController],
  providers: [APIGateway, RateLimiterService, APIKeyManager],
  exports: [APIGateway, RateLimiterService, APIKeyManager],
})
export class GatewayModule {}
