/**
 * open-platform-ringbeam.test.ts - P-49 开放平台圈梁对齐
 *
 * PRD 映射:
 *   PRD-014 → tenant-llm 多租户 AI 接入
 *   PRD-016 → open-api/openapi 开放平台基座
 *
 * 本圈梁优先校验 P0/P1 的关键验收点:
 *   AC-49-21/22 OAuth 成功与失败路径
 *   AC-49-23/24 HMAC 签名与过期窗口
 *   AC-49-25/26 API Key 生命周期
 *   AC-49-27 Webhook 重试/死信
 *   RQ-49-26/27 Sandbox 与 Usage 主链
 *   AC-49-28 OpenAPI 文档输出
 *   AC-49-01/05/06/07/08 tenant-llm 隔离、统计、审批与拒绝链路
 */

import { describe, it, expect } from 'vitest'
import * as crypto from 'node:crypto'
import { OpenApiService } from '../open-api/open-api.service'
import { OpenAPIController } from './openapi.controller'
import { APIKeyService } from './services/api-key.service'
import { WebhookService } from './services/webhook.service'
import { SandboxService } from './services/sandbox.service'
import { UsageService } from './services/usage.service'
import { KeyGenerator } from './key-generator'
import { SignValidator } from './sign-validator'
import { RateLimiter } from './rate-limiter'
import { WebhookDispatcher } from './webhook-dispatcher'
import { APIKeyAdapter } from './datasources/api-key.adapter'
import { WebhookAdapter } from './datasources/webhook.adapter'
import { SandboxAdapter } from './datasources/sandbox.adapter'
import { RateLimitAdapter } from './datasources/rate-limit.adapter'
import { QuotaAdapter } from './datasources/quota.adapter'
import { TenantLLMService } from '../tenant-llm/llm-config.service'

function makeOpenPlatformController(options?: {
  httpPoster?: (url: string, body: string, headers: Record<string, string>) => Promise<{
    success: boolean
    responseStatus?: number
    responseBody?: string
    errorMessage?: string
  }>
}): OpenAPIController {
  const apiKeyAdapter = new APIKeyAdapter()
  const webhookAdapter = new WebhookAdapter()
  const sandboxAdapter = new SandboxAdapter()
  const rateLimitAdapter = new RateLimitAdapter()
  const quotaAdapter = new QuotaAdapter()

  const keyGen = new KeyGenerator()
  const signValidator = new SignValidator()
  const rateLimiter = new RateLimiter(rateLimitAdapter)
  const dispatcher = new WebhookDispatcher(webhookAdapter)
  dispatcher.httpPoster = options?.httpPoster || (async () => ({ success: true, responseStatus: 200 }))

  const apiKeySvc = new APIKeyService(keyGen, apiKeyAdapter)
  const webhookSvc = new WebhookService(dispatcher, webhookAdapter)
  const sandboxSvc = new SandboxService(sandboxAdapter)
  const usageSvc = new UsageService(rateLimiter, quotaAdapter, rateLimitAdapter)

  return new OpenAPIController(apiKeySvc, webhookSvc, sandboxSvc, usageSvc, signValidator)
}

function makeTenantLLMService(): TenantLLMService {
  return new TenantLLMService({ canActivate: () => true } as any)
}

describe('🔵 OpenPlatformRingBeam: P-49 开放平台 PRD 对齐', () => {
  it('AC-49-21: 合法 client_credentials 可获取 Bearer Token', async () => {
    const svc = new OpenApiService()
    const token = await svc.authenticate('cli-merchant-001', 'test-secret', ['auth:verify', 'sync:write'])

    expect(token.tokenType).toBe('Bearer')
    expect(token.scope).toContain('auth:verify')
    expect(token.scope).toContain('sync:write')
    expect(token.expiresIn).toBeGreaterThan(0)
  })

  it('AC-49-22: 错误 client_secret 不会签发 token', async () => {
    const svc = new OpenApiService()
    let thrown: any

    try {
      await svc.authenticate('cli-merchant-001', 'wrong-secret', ['auth:verify'])
    } catch (error) {
      thrown = error
    }

    expect(thrown?.getStatus?.()).toBe(401)
    expect(thrown?.getResponse?.()).toMatchObject({ error: 'invalid_client' })
  })

  it('AC-49-23: 合法 HMAC 请求签名校验通过', () => {
    const svc = new OpenApiService()
    const method = 'POST'
    const path = '/api/v9/open/sync'
    const timestamp = String(Date.now())
    const body = JSON.stringify({ resourceType: 'order', action: 'create' })
    const bodyHash = crypto.createHash('sha256').update(body).digest('hex')
    const payload = `${method}\n${path}\n${timestamp}\n${bodyHash}`
    const signature = `sha256=${crypto.createHmac('sha256', 'hmac-merchant-001-secret').update(payload).digest('hex')}`

    const valid = svc.verifyHmacSignature('cli-merchant-001', method, path, timestamp, body, signature)
    expect(valid).toBe(true)
  })

  it('AC-49-24: 过期时间窗口的 HMAC 请求会被拒绝', () => {
    const svc = new OpenApiService()
    const method = 'POST'
    const path = '/api/v9/open/sync'
    const timestamp = String(Date.now() - 10 * 60 * 1000)
    const body = JSON.stringify({ resourceType: 'order', action: 'create' })
    const bodyHash = crypto.createHash('sha256').update(body).digest('hex')
    const payload = `${method}\n${path}\n${timestamp}\n${bodyHash}`
    const signature = `sha256=${crypto.createHmac('sha256', 'hmac-merchant-001-secret').update(payload).digest('hex')}`

    const valid = svc.verifyHmacSignature('cli-merchant-001', method, path, timestamp, body, signature)
    expect(valid).toBe(false)
  })

  it('AC-49-25: 创建并查询 API Key 时只返回租户内结果', () => {
    const ctrl = makeOpenPlatformController()
    const created = ctrl.createKeyV2({
      tenantId: 'tenant-p49',
      environment: 'LIVE',
      name: 'P49 Key',
      scopes: [{ resource: 'orders', actions: ['read'] }],
    })

    expect(created.apiKey.keyId).toMatch(/^sk_live_/)

    const ownKeys = ctrl.listKeysV2('tenant-p49')
    const otherKeys = ctrl.listKeysV2('tenant-other')

    expect(ownKeys.keys.length).toBe(1)
    expect(ownKeys.keys[0].tenantId).toBe('tenant-p49')
    expect((ownKeys.keys[0] as any).plaintextSecret).toBeUndefined()
    expect(ownKeys.keys[0].keyHash).toBeTruthy()
    expect(otherKeys.keys.length).toBe(0)
  })

  it('AC-49-26: 撤销 API Key 后校验返回 revoked', () => {
    const ctrl = makeOpenPlatformController()
    const created = ctrl.createKeyV2({
      tenantId: 'tenant-revoke',
      environment: 'TEST',
      name: 'Revoked Key',
      scopes: [{ resource: 'orders', actions: ['read'] }],
    })

    const deleted = ctrl.revokeKey({
      tenantId: 'tenant-revoke',
      keyId: created.apiKey.keyId,
      reason: 'manual-revoke',
    })
    const afterRevoke = deleted && created.apiKey.keyId
      ? (ctrl as any).apiKeySvc.validate('tenant-revoke', created.apiKey.keyId, 'orders', 'read')
      : null

    expect(deleted?.status).toBe('REVOKED')
    expect(afterRevoke).toMatchObject({ valid: false, reason: 'revoked' })
  })

  it('AC-49-27: Webhook 投递失败后进入重试并最终进入死信', async () => {
    const ctrl = makeOpenPlatformController({
      httpPoster: async () => ({
        success: false,
        responseStatus: 503,
        errorMessage: 'upstream_unavailable',
      }),
    })
    const sub = ctrl.subscribe({
      tenantId: 'tenant-hook',
      url: 'https://hooks.example.com/open-platform',
      events: ['order.created'],
    })

    let delivery = await ctrl.dispatchWebhook({
      tenantId: 'tenant-hook',
      subscriptionId: sub.id,
      eventType: 'order.created',
      payload: { id: 'evt-p49-001', orderNo: 'SO-001' },
    })

    expect(delivery.status).toBe('FAILED')
    expect(delivery.attempts).toBe(1)
    expect(delivery.nextRetryAt).toBeTruthy()

    for (let i = 0; i < 4; i++) {
      delivery = await ctrl.retryDelivery('tenant-hook', delivery.id)
    }

    const deadLetters = ctrl.deadLetter('tenant-hook')
    expect(delivery.status).toBe('DEAD_LETTER')
    expect(deadLetters.deadLetters).toHaveLength(1)
    expect(deadLetters.deadLetters[0].id).toBe(delivery.id)
  })

  it('RQ-49-26: Sandbox 创建、隔离与清理链路可执行', () => {
    const ctrl = makeOpenPlatformController()
    const sandbox = ctrl.createSandbox({
      parentTenantId: 'tenant-parent',
      name: 'P49 Sandbox',
      ttlDays: 1,
    })
    const ownSandboxes = ctrl.listSandboxes('tenant-parent')
    const otherSandboxes = ctrl.listSandboxes('tenant-other')
    const expired = ctrl.setSandboxStatus({
      sandboxTenantId: sandbox.tenantId,
      status: 'EXPIRED',
    })

    expect(sandbox.tenantId).toMatch(/^t-sandbox-/)
    expect(ownSandboxes.sandboxes).toHaveLength(1)
    expect(otherSandboxes.sandboxes).toHaveLength(0)
    expect(expired?.status).toBe('EXPIRED')

    const cleaned = ctrl.cleanupSandbox()

    expect(cleaned.cleaned).toBe(1)
    expect(cleaned.sandboxIds).toContain(sandbox.tenantId)
  })

  it('RQ-49-27: Usage 桶与报表按租户隔离聚合', () => {
    const ctrl = makeOpenPlatformController()
    ctrl.createBucket({
      tenantId: 'tenant-usage',
      endpoint: '/openapi/orders',
      qps: 10,
      dailyQuota: 5,
    })
    ctrl.checkUsage({
      tenantId: 'tenant-usage',
      keyId: 'sk_live_usage',
      endpoint: '/openapi/orders',
    })
    ctrl.checkUsage({
      tenantId: 'tenant-usage',
      keyId: 'sk_live_usage',
      endpoint: '/openapi/orders',
    })

    const ownReport = ctrl.getUsageV2('tenant-usage')
    const otherReport = ctrl.getUsageV2('tenant-other')

    expect(ownReport.totalBuckets).toBe(1)
    expect(ownReport.totalUsageToday).toBe(2)
    expect(ownReport.topEndpoints[0]).toMatchObject({ endpoint: '/openapi/orders' })
    expect(otherReport.totalBuckets).toBe(0)
    expect(otherReport.totalUsageToday).toBe(0)
  })

  it('AC-49-28: OpenAPI 文档返回 API Key 与 usage 路径', () => {
    const ctrl = makeOpenPlatformController()
    const doc = ctrl.getDocs()

    expect(doc.openapi).toBe('3.1.0')
    expect(doc.paths['/openapi/keys']).toBeDefined()
    expect(doc.paths['/openapi/usage']).toBeDefined()
    expect(doc.components.securitySchemes.ApiKeyAuth).toBeDefined()
  })

  it('AC-49-01: tenant-llm 配置创建后仅租户本人可见', async () => {
    const svc = makeTenantLLMService()
    const created = await svc.createConfig('tenant-a', {
      name: 'A Config',
      provider: 'deepseek',
      modelName: 'deepseek-chat',
      apiKey: 'sk-a',
    })

    const ownConfig = await svc.getConfig(created.id, 'tenant-a')
    const foreignConfig = await svc.getConfig(created.id, 'tenant-b')

    expect(ownConfig?.tenantId).toBe('tenant-a')
    expect(foreignConfig).toBeNull()
  })

  it('AC-49-05/06: tenant-llm 支持额度阈值保存与调用统计', async () => {
    const svc = makeTenantLLMService()
    const created = await svc.createConfig('tenant-metrics', {
      name: 'Metrics Config',
      provider: 'openai',
      modelName: 'gpt-4',
      apiKey: 'sk-metrics',
      quotaLimit: 1000,
      quotaAlertThreshold: 0.75,
    })

    await svc.logCall({
      configId: created.id,
      tenantId: 'tenant-metrics',
      promptTokens: 100,
      completionTokens: 50,
      totalTokens: 150,
      costEstimate: 0.015,
      currency: 'USD',
      latencyMs: 900,
      status: 'success',
    })
    await svc.logCall({
      configId: created.id,
      tenantId: 'tenant-metrics',
      promptTokens: 20,
      completionTokens: 10,
      totalTokens: 30,
      costEstimate: 0.003,
      currency: 'USD',
      latencyMs: 1200,
      status: 'error',
    })

    const detail = await svc.getConfig(created.id, 'tenant-metrics')
    const stats = await svc.getStats('tenant-metrics', created.id)

    expect(detail?.quotaLimit).toBe(1000)
    expect(detail?.quotaAlertThreshold).toBe(0.75)
    expect(detail?.quotaUsed).toBe(180)
    expect((detail as any)?.apiKey).toBeUndefined()
    expect(svc.getApiKey(created.id, 'tenant-metrics')).toBe('sk-metrics')
    expect(stats.totalCalls).toBe(2)
    expect(stats.successCalls).toBe(1)
    expect(stats.failedCalls).toBe(1)
    expect(stats.totalTokens).toBe(180)
    expect(stats.totalCost).toBe(0.018)
  })

  it('AC-49-07: tenant-llm 配置可进入审批通过流转', async () => {
    const svc = makeTenantLLMService()
    const created = await svc.createConfig('tenant-approve', {
      name: 'Approve Config',
      provider: 'openai',
      modelName: 'gpt-4',
      apiKey: 'sk-approve',
    })

    const approved = await svc.approveConfig(created.id, 'platform-admin', true)

    expect(approved?.status).toBe('approved')
    expect(approved?.enabled).toBe(true)
    expect(approved?.approvedBy).toBe('platform-admin')
  })

  it('AC-49-08: 普通运营审批会被拒绝并写入审计日志', async () => {
    const svc = makeTenantLLMService()
    const created = await svc.createConfig('tenant-ops', {
      name: 'Operator Config',
      provider: 'openai',
      modelName: 'gpt-4',
      apiKey: 'sk-ops',
    })

    await expect(
      svc.approveConfig(created.id, 'operator-001', true, {
        permissions: ['llm:view', 'llm:write'],
        actorRole: 'operator',
        reason: '普通运营无审批权限',
      })
    ).rejects.toThrow('缺少 llm:approve 权限')

    const config = await svc.getConfig(created.id, 'tenant-ops')
    const logs = svc.getAuditLogs('tenant-ops', created.id)

    expect(config?.status).toBe('pending')
    expect(config?.enabled).toBe(false)
    expect(logs[0]).toMatchObject({
      action: 'approve_denied',
      actorId: 'operator-001',
      actorRole: 'operator',
      success: false,
    })
  })
})
