import { Module } from '@nestjs/common'
import { OpenAPIController } from './openapi.controller'
import { KeyGenerator } from './key-generator'
import { SignValidator } from './sign-validator'
import { RateLimiter } from './rate-limiter'
import { WebhookDispatcher } from './webhook-dispatcher'
import { OpenAPIService } from './openapi.service'
import { APIKeyService } from './services/api-key.service'
import { WebhookService } from './services/webhook.service'
import { SandboxService } from './services/sandbox.service'
import { UsageService } from './services/usage.service'
import { APIKeyAdapter } from './datasources/api-key.adapter'
import { WebhookAdapter } from './datasources/webhook.adapter'
import { SandboxAdapter } from './datasources/sandbox.adapter'
import { RateLimitAdapter } from './datasources/rate-limit.adapter'
import { QuotaAdapter } from './datasources/quota.adapter'

/**
 * Phase-44 T174: OpenAPIModule (开放 API 模块)
 *
 * 16 providers:
 *  - 5 adapters
 *  - 4 engines (key-generator / sign-validator / rate-limiter / webhook-dispatcher)
 *  - 4 services
 *  - 1 controller
 */
@Module({
  controllers: [OpenAPIController],
  providers: [
    // 5 adapters
    APIKeyAdapter,
    WebhookAdapter,
    SandboxAdapter,
    RateLimitAdapter,
    QuotaAdapter,
    // 4 engines
    KeyGenerator,
    SignValidator,
    RateLimiter,
    WebhookDispatcher,
    // 4 services + 1 facade
    APIKeyService,
    WebhookService,
    SandboxService,
    UsageService,
    OpenAPIService,
    // Controller
    OpenAPIController
  ],
  exports: [
    OpenAPIService,
    KeyGenerator,
    SignValidator,
    RateLimiter,
    WebhookDispatcher,
    APIKeyService,
    WebhookService,
    SandboxService,
    UsageService
  ]
})
export class OpenAPIModule {}