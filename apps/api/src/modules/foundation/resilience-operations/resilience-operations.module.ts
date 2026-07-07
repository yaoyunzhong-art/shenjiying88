import { Global, Module } from '@nestjs/common'
import { ResilienceOperationsController } from './resilience-operations.controller'
import { ResilienceOperationsService } from './resilience-operations.service'
import { CircuitBreaker } from './circuit-breaker'
import { TokenBucket } from './rate-limiter'
import { HeterogeneousChannelRouter } from './heterogeneous-router'

/**
 * ResilienceOperationsModule · 弹性运营
 *
 * 包含:
 *  - ResilienceOperationsService / Controller: 弹性运营基础 CRUD
 *  - CircuitBreaker: 通用熔断器 (P2-1.1)
 *  - TokenBucket: 令牌桶限流器 (P2-1.2)
 *  - HeterogeneousChannelRouter: 异构通道路由 (P2-2.1)
 */
@Global()
@Module({
  controllers: [ResilienceOperationsController],
  providers: [
    ResilienceOperationsService,
    CircuitBreaker,
    TokenBucket,
    HeterogeneousChannelRouter
  ],
  exports: [
    ResilienceOperationsService,
    CircuitBreaker,
    TokenBucket,
    HeterogeneousChannelRouter
  ]
})
export class ResilienceOperationsModule {}
