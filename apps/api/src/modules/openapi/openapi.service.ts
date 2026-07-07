/**
 * 🐜 自动: [openapi] [A] OpenAPIService 门面
 *
 * 实现 OpenAPIServiceContract 合约，包装底层 4 个 Service，
 * 供外部模块 (analytics, observability, tenant 等) 统一消费。
 *
 * 关联: openapi.contract.ts → OpenAPIServiceContract
 */

import { Injectable } from '@nestjs/common'
import { APIKeyService } from './services/api-key.service'
import { WebhookService } from './services/webhook.service'
import { SandboxService } from './services/sandbox.service'
import { UsageService } from './services/usage.service'
import { SignValidator } from './sign-validator'
import type {
  APIKeyContract,
  WebhookSubscriptionContract,
  SandboxContract,
  QuotaUsageContract,
  SignValidationContract,
  EventDispatchRequest,
  EventDispatchResponse,
} from './openapi.contract'
import type {
  APIKeyEnvironment,
  WebhookEventType,
  SignedRequest,
} from './openapi.entity'

@Injectable()
export class OpenAPIService {
  constructor(
    private readonly apiKeySvc: APIKeyService,
    private readonly webhookSvc: WebhookService,
    private readonly sandboxSvc: SandboxService,
    private readonly usageSvc: UsageService,
    private readonly signValidator: SignValidator,
  ) {}

  // ─── API Key ───

  async createKey(input: {
    tenantId: string
    environment: APIKeyEnvironment
    name: string
    scopes: { resource: string; actions: string[] }[]
    expiresAt?: string
    createdBy?: string
  }): Promise<APIKeyContract> {
    const result = this.apiKeySvc.create({
      ...input,
      createdBy: input.createdBy || 'admin',
    })
    return this.toAPIKeyContract(result.apiKey)
  }

  async getKey(tenantId: string, keyId: string): Promise<APIKeyContract | null> {
    const key = this.apiKeySvc.get(tenantId, keyId)
    return key ? this.toAPIKeyContract(key) : null
  }

  async listKeys(
    tenantId: string,
    environment?: APIKeyEnvironment,
  ): Promise<APIKeyContract[]> {
    return this.apiKeySvc
      .list(tenantId, environment)
      .map((k) => this.toAPIKeyContract(k))
  }

  async revokeKey(tenantId: string, keyId: string, reason: string): Promise<void> {
    this.apiKeySvc.revoke(tenantId, keyId, reason)
  }

  private toAPIKeyContract(key: any): APIKeyContract {
    return {
      id: key.id,
      tenantId: key.tenantId,
      keyId: key.keyId,
      environment: key.environment,
      name: key.name,
      scopes: key.scopes,
      status: key.status,
      createdAt: key.createdAt,
      createdBy: key.createdBy,
      expiresAt: key.expiresAt,
      lastUsedAt: key.lastUsedAt,
    }
  }

  // ─── Webhook ───

  async createWebhookSubscription(input: {
    tenantId: string
    url: string
    events: WebhookEventType[]
    description?: string
    createdBy?: string
  }): Promise<WebhookSubscriptionContract> {
    const sub = this.webhookSvc.createSubscription({
      ...input,
      createdBy: input.createdBy || 'admin',
    })
    return this.toWebhookContract(sub)
  }

  async listWebhookSubscriptions(
    tenantId: string,
  ): Promise<WebhookSubscriptionContract[]> {
    return this.webhookSvc
      .listSubscriptions(tenantId)
      .map((s) => this.toWebhookContract(s))
  }

  async dispatchWebhookEvent(
    req: EventDispatchRequest,
  ): Promise<EventDispatchResponse> {
    const result = await this.webhookSvc.dispatchEvent({
      tenantId: req.tenantId,
      subscriptionId: req.source,
      eventType: req.eventType,
      payload: req.payload,
    })
    return {
      accepted: result.status === 'SUCCESS',
      deliveryId: result.id,
    }
  }

  private toWebhookContract(sub: any): WebhookSubscriptionContract {
    return {
      id: sub.id,
      tenantId: sub.tenantId,
      url: sub.url,
      events: sub.events,
      status: sub.status,
      createdAt: sub.createdAt,
      createdBy: sub.createdBy,
    }
  }

  // ─── Sandbox ───

  async createSandbox(input: {
    parentTenantId: string
    name: string
    ttlDays?: number
    dataMaskingEnabled?: boolean
  }): Promise<SandboxContract> {
    const env = this.sandboxSvc.create(input)
    return {
      id: env.id,
      tenantId: env.tenantId,
      parentTenantId: env.parentTenantId,
      name: env.name,
      status: env.status,
      ttlDays: input.ttlDays ?? 30,
      createdAt: env.createdAt,
      expiresAt: env.expiresAt,
    }
  }

  // ─── Quota ───

  async checkQuota(tenantId: string): Promise<QuotaUsageContract> {
    const bucket = this.usageSvc.listBuckets(tenantId)[0]
    if (!bucket) {
      return {
        tenantId,
        periodKey: 'today',
        usedCount: 0,
        remainingCount: 0,
        overageCount: 0,
      }
    }
    const report = this.usageSvc.report(tenantId)
    return {
      tenantId,
      periodKey: 'today',
      usedCount: report.totalUsageToday,
      remainingCount: Math.max(0, bucket.dailyQuota - report.totalUsageToday),
      overageCount: Math.max(0, report.totalUsageToday - bucket.dailyQuota),
    }
  }

  // ─── Signature ───

  async verifySignature(
    secret: string,
    request: SignedRequest,
  ): Promise<SignValidationContract> {
    const result = this.signValidator.validate({ secret, request })
    return {
      valid: result.valid,
      error: result.valid ? undefined : result.reason,
    }
  }
}
