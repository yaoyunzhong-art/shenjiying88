import { Controller, Get, Post, Body, Query, Param, Injectable } from '@nestjs/common'
import { APIKeyService } from './services/api-key.service'
import { WebhookService } from './services/webhook.service'
import { SandboxService } from './services/sandbox.service'
import { UsageService } from './services/usage.service'
import { SignValidator } from './sign-validator'
import type {
  TenantId,
  APIKeyEnvironment,
  APIKeyScope,
  WebhookEventType,
  SandboxStatus
} from './openapi.entity'

/**
 * Phase-44 T174: OpenAPIController (开放 API 网关)
 *
 * 14 endpoint:
 *  API Key:
 *  POST /openapi/key/create        创建 API Key
 *  GET  /openapi/key/list          列出 API Key
 *  GET  /openapi/key/:keyId        查询单个
 *  POST /openapi/key/revoke        撤销
 *  GET  /openapi/key/stats         统计
 *
 *  Webhook:
 *  POST /openapi/webhook/subscribe 创建订阅
 *  GET  /openapi/webhook/list      列出订阅
 *  POST /openapi/webhook/pause     暂停
 *  POST /openapi/webhook/resume    恢复
 *  DELETE /openapi/webhook/:id     删除
 *  POST /openapi/webhook/dispatch  投递事件
 *  GET  /openapi/webhook/deliveries 投递日志
 *  GET  /openapi/webhook/dead-letter 死信
 *  POST /openapi/webhook/retry/:id 重试
 *
 *  Sandbox:
 *  POST /openapi/sandbox/create    创建沙箱
 *  GET  /openapi/sandbox/:id       查询
 *  POST /openapi/sandbox/cleanup   清理过期
 *
 *  Usage:
 *  POST /openapi/usage/bucket      创建桶
 *  GET  /openapi/usage/report      报表
 *
 *  Signature:
 *  POST /openapi/sign/verify       验证签名
 */

@Controller('openapi')
@Injectable()
export class OpenAPIController {
  constructor(
    private readonly apiKeySvc: APIKeyService,
    private readonly webhookSvc: WebhookService,
    private readonly sandboxSvc: SandboxService,
    private readonly usageSvc: UsageService,
    private readonly signValidator: SignValidator
  ) {}

  // ─── API Key ───

  @Post('key/create')
  createKey(@Body() body: {
    tenantId: TenantId
    environment: APIKeyEnvironment
    name: string
    scopes: APIKeyScope[]
    expiresAt?: string
    createdBy?: string
  }) {
    return this.apiKeySvc.create({
      ...body,
      createdBy: body.createdBy || 'admin'
    })
  }

  @Get('key/list')
  listKeys(@Query('tenantId') tenantId: TenantId, @Query('environment') environment?: APIKeyEnvironment) {
    return { keys: this.apiKeySvc.list(tenantId, environment) }
  }

  @Get('key/stats')
  keyStats(@Query('tenantId') tenantId: TenantId) {
    return this.apiKeySvc.stats(tenantId)
  }

  @Get('key/:keyId')
  getKey(@Query('tenantId') tenantId: TenantId, @Param('keyId') keyId: string) {
    return this.apiKeySvc.get(tenantId, keyId)
  }

  @Post('key/revoke')
  revokeKey(@Body() body: { tenantId: TenantId; keyId: string; reason: string }) {
    return this.apiKeySvc.revoke(body.tenantId, body.keyId, body.reason)
  }

  // ─── Webhook ───

  @Post('webhook/subscribe')
  subscribe(@Body() body: {
    tenantId: TenantId
    url: string
    events: WebhookEventType[]
    description?: string
    createdBy?: string
  }) {
    return this.webhookSvc.createSubscription({
      ...body,
      createdBy: body.createdBy || 'admin'
    })
  }

  @Get('webhook/list')
  listWebhooks(@Query('tenantId') tenantId: TenantId) {
    return { subscriptions: this.webhookSvc.listSubscriptions(tenantId) }
  }

  @Post('webhook/pause')
  pauseWebhook(@Body() body: { tenantId: TenantId; subId: string }) {
    return this.webhookSvc.pauseSubscription(body.tenantId, body.subId)
  }

  @Post('webhook/resume')
  resumeWebhook(@Body() body: { tenantId: TenantId; subId: string }) {
    return this.webhookSvc.resumeSubscription(body.tenantId, body.subId)
  }

  @Post('webhook/dispatch')
  async dispatchWebhook(@Body() body: {
    tenantId: TenantId
    subscriptionId: string
    eventType: WebhookEventType
    payload: Record<string, any>
  }) {
    return this.webhookSvc.dispatchEvent(body)
  }

  @Get('webhook/deliveries')
  listDeliveries(@Query('tenantId') tenantId: TenantId, @Query('status') status?: any, @Query('limit') limit?: string) {
    return { deliveries: this.webhookSvc.listDeliveries(tenantId, status, limit ? parseInt(limit, 10) : undefined) }
  }

  @Get('webhook/dead-letter')
  deadLetter(@Query('tenantId') tenantId: TenantId) {
    return { deadLetters: this.webhookSvc.listDeadLetter(tenantId) }
  }

  @Post('webhook/retry/:id')
  async retryDelivery(@Query('tenantId') tenantId: TenantId, @Param('id') id: string) {
    return this.webhookSvc.retryDelivery(tenantId, id)
  }

  @Get('webhook/stats')
  webhookStats(@Query('tenantId') tenantId: TenantId) {
    return this.webhookSvc.stats(tenantId)
  }

  // ─── Sandbox ───

  @Post('sandbox/create')
  createSandbox(@Body() body: {
    parentTenantId: TenantId
    name: string
    ttlDays?: number
    dataMaskingEnabled?: boolean
  }) {
    return this.sandboxSvc.create(body)
  }

  @Get('sandbox/list')
  listSandboxes(@Query('parentTenantId') parentTenantId: TenantId) {
    return { sandboxes: this.sandboxSvc.listByParent(parentTenantId) }
  }

  @Get('sandbox/check/:id')
  checkSandbox(@Param('id') id: string) {
    return this.sandboxSvc.get(id)
  }

  @Post('sandbox/status')
  setSandboxStatus(@Body() body: { sandboxTenantId: TenantId; status: SandboxStatus }) {
    return this.sandboxSvc.setStatus(body.sandboxTenantId, body.status)
  }

  @Post('sandbox/cleanup')
  cleanupSandbox() {
    return this.sandboxSvc.cleanupExpired()
  }

  // ─── Usage ───

  @Post('usage/bucket')
  createBucket(@Body() body: {
    tenantId: TenantId
    endpoint: string
    qps: number
    dailyQuota: number
    windowMs?: number
  }) {
    return this.usageSvc.createBucket(body)
  }

  @Post('usage/check')
  checkUsage(@Body() body: { tenantId: TenantId; keyId: string; endpoint: string }) {
    return this.usageSvc.checkRequest(body)
  }

  @Get('usage/report')
  usageReport(@Query('tenantId') tenantId: TenantId) {
    return this.usageSvc.report(tenantId)
  }

  @Get('usage/buckets')
  listBuckets(@Query('tenantId') tenantId: TenantId) {
    return { buckets: this.usageSvc.listBuckets(tenantId) }
  }

  // ─── Signature ───

  @Post('sign/verify')
  verifySignature(@Body() body: { secret: string; request: any }) {
    return this.signValidator.validate({ secret: body.secret, request: body.request })
  }
}