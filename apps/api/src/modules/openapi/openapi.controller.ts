import { Controller, Get, Post, Delete, Body, Query, Param, Injectable, NotFoundException, HttpCode, UseGuards } from '@nestjs/common'
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
import { TenantGuard } from '../agent/tenant.guard';

/**
 * Phase-44 T174 / P-44: OpenAPIController (开放 API 网关)
 *
 * P-44 补全端点:
 *  GET    /openapi/docs             开放 API 规范文档
 *  POST   /openapi/keys             创建 API Key (新式路径)
 *  GET    /openapi/keys             列出 API Key
 *  DELETE /openapi/keys/:id         删除/撤销 API Key
 *  GET    /openapi/usage            使用统计
 *
 * 已有端点:
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
@UseGuards(TenantGuard)
@Injectable()
export class OpenAPIController {
  constructor(
    private readonly apiKeySvc: APIKeyService,
    private readonly webhookSvc: WebhookService,
    private readonly sandboxSvc: SandboxService,
    private readonly usageSvc: UsageService,
    private readonly signValidator: SignValidator
  ) {}

  // ─── P-44 开放 API 规范文档 ───

  @Get('docs')
  getDocs() {
    const spec = this.buildOpenAPISpec()
    return spec
  }

  // ─── P-44 Keys 新式路径 (代理到已有实现) ───

  @Post('keys')
  @HttpCode(201)
  createKeyV2(@Body() body: {
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

  @Get('keys')
  listKeysV2(@Query('tenantId') tenantId: TenantId, @Query('environment') environment?: APIKeyEnvironment) {
    return { keys: this.apiKeySvc.list(tenantId, environment) }
  }

  @Delete('keys/:id')
  @HttpCode(204)
  deleteKeyV2(@Query('tenantId') tenantId: TenantId, @Param('id') id: string) {
    const result = this.apiKeySvc.revoke(tenantId, id, 'deleted_via_api')
    if (!result) {
      throw new NotFoundException(`API Key ${id} not found for tenant ${tenantId}`)
    }
    return
  }

  @Get('usage')
  getUsageV2(@Query('tenantId') tenantId: TenantId) {
    return this.usageSvc.report(tenantId)
  }

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

  // ─── 内部: 构建 OpenAPI 规范文档 ───

  private buildOpenAPISpec() {
    return {
      openapi: '3.1.0',
      info: {
        title: '开放 API 网关',
        version: '1.0.0',
        description: 'ShenJiYing OpenAPI Gateway — 商户 API Key 管理、Webhook 事件投递、沙箱环境、使用统计',
      },
      servers: [
        { url: '/', description: '当前环境' },
      ],
      paths: {
        '/openapi/docs': { get: { summary: '开放 API 规范文档', tags: ['开放平台'] } },
        '/openapi/keys': {
          post: { summary: '创建 API Key', tags: ['API Key'] },
          get: { summary: '列出 API Key', tags: ['API Key'] },
        },
        '/openapi/keys/{id}': { delete: { summary: '删除 API Key', tags: ['API Key'] } },
        '/openapi/key/create': { post: { summary: '创建 API Key (旧路径)', tags: ['API Key'] } },
        '/openapi/key/list': { get: { summary: '列出 API Key (旧路径)', tags: ['API Key'] } },
        '/openapi/key/{keyId}': { get: { summary: '查询单个 API Key', tags: ['API Key'] } },
        '/openapi/key/revoke': { post: { summary: '撤销 API Key', tags: ['API Key'] } },
        '/openapi/key/stats': { get: { summary: 'API Key 统计', tags: ['API Key'] } },
        '/openapi/webhook/subscribe': { post: { summary: '创建 Webhook 订阅', tags: ['Webhook'] } },
        '/openapi/webhook/list': { get: { summary: '列出 Webhook 订阅', tags: ['Webhook'] } },
        '/openapi/webhook/pause': { post: { summary: '暂停 Webhook', tags: ['Webhook'] } },
        '/openapi/webhook/resume': { post: { summary: '恢复 Webhook', tags: ['Webhook'] } },
        '/openapi/webhook/dispatch': { post: { summary: '投递 Webhook 事件', tags: ['Webhook'] } },
        '/openapi/webhook/deliveries': { get: { summary: '投递日志', tags: ['Webhook'] } },
        '/openapi/webhook/dead-letter': { get: { summary: '死信队列', tags: ['Webhook'] } },
        '/openapi/webhook/retry/{id}': { post: { summary: '重试投递', tags: ['Webhook'] } },
        '/openapi/webhook/stats': { get: { summary: 'Webhook 统计', tags: ['Webhook'] } },
        '/openapi/sandbox/create': { post: { summary: '创建沙箱', tags: ['沙箱'] } },
        '/openapi/sandbox/list': { get: { summary: '列出沙箱', tags: ['沙箱'] } },
        '/openapi/sandbox/check/{id}': { get: { summary: '查询沙箱', tags: ['沙箱'] } },
        '/openapi/sandbox/status': { post: { summary: '设置沙箱状态', tags: ['沙箱'] } },
        '/openapi/sandbox/cleanup': { post: { summary: '清理过期沙箱', tags: ['沙箱'] } },
        '/openapi/usage': { get: { summary: '使用统计', tags: ['用量'] } },
        '/openapi/usage/bucket': { post: { summary: '创建限流桶', tags: ['用量'] } },
        '/openapi/usage/check': { post: { summary: '检查配额', tags: ['用量'] } },
        '/openapi/usage/report': { get: { summary: '用量报表', tags: ['用量'] } },
        '/openapi/usage/buckets': { get: { summary: '列出限流桶', tags: ['用量'] } },
        '/openapi/sign/verify': { post: { summary: '验证签名', tags: ['签名'] } },
      },
      components: {
        securitySchemes: {
          ApiKeyAuth: {
            type: 'apiKey',
            in: 'header',
            name: 'X-API-Key',
            description: 'API Key 认证，格式: sk_live_xxx 或 sk_test_xxx',
          },
        },
        schemas: {
          APIKey: {
            type: 'object',
            properties: {
              keyId: { type: 'string', example: 'sk_live_abc123' },
              name: { type: 'string' },
              environment: { type: 'string', enum: ['LIVE', 'TEST', 'SANDBOX'] },
              status: { type: 'string', enum: ['ACTIVE', 'REVOKED', 'EXPIRED'] },
              scopes: { type: 'array', items: { type: 'string' } },
              createdAt: { type: 'string', format: 'date-time' },
              expiresAt: { type: 'string', format: 'date-time', nullable: true },
            },
          },
          WebhookSubscription: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              url: { type: 'string', format: 'uri' },
              events: { type: 'array', items: { type: 'string' } },
              status: { type: 'string', enum: ['ACTIVE', 'PAUSED', 'DISABLED'] },
            },
          },
        },
      },
    }
  }
}