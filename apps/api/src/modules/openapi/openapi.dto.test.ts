import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * 🐜 自动: [openapi] DTO validation 测试
 *
 * 覆盖:
 *   CreateApiKeyDto / SubscribeWebhookDto / CreateSandboxDto
 *   CreateUsageBucketDto / RevokeApiKeyDto / DispatchWebhookDto
 *   CheckUsageDto / VerifySignatureDto / PauseResumeWebhookDto / SetSandboxStatusDto
 *   正例 + 反例 + 边界
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import { validate } from 'class-validator'
import { plainToInstance } from 'class-transformer'
import {
  CreateApiKeyDto,
  ListApiKeyDto,
  RevokeApiKeyDto,
  SubscribeWebhookDto,
  DispatchWebhookDto,
  PauseResumeWebhookDto,
  CreateSandboxDto,
  SetSandboxStatusDto,
  CreateUsageBucketDto,
  CheckUsageDto,
  VerifySignatureDto,
} from './openapi.dto'

describe('OpenAPI DTO', () => {
  // ── CreateApiKeyDto ──
  describe('CreateApiKeyDto', () => {
    it('accepts valid input', async () => {
      const dto = plainToInstance(CreateApiKeyDto, {
        tenantId: 'T001',
        environment: 'LIVE',
        name: 'Production API Key',
        scopes: ['orders:read', 'members:write'],
        createdBy: 'admin',
      })
      const errors = await validate(dto)
      assert.equal(errors.length, 0)
    })

    it('rejects empty tenantId', async () => {
      const dto = plainToInstance(CreateApiKeyDto, {
        tenantId: '',
        environment: 'LIVE',
        name: 'Test Key',
        scopes: ['read'],
      })
      const errors = await validate(dto)
      assert.ok(errors.length > 0)
      assert.ok(errors.some(e => e.property === 'tenantId'))
    })

    it('rejects invalid environment', async () => {
      const dto = plainToInstance(CreateApiKeyDto, {
        tenantId: 'T001',
        environment: 'INVALID',
        name: 'Test Key',
        scopes: ['read'],
      })
      const errors = await validate(dto)
      assert.ok(errors.length > 0)
      assert.ok(errors.some(e => e.property === 'environment'))
    })

    it('rejects missing required fields', async () => {
      const dto = plainToInstance(CreateApiKeyDto, {})
      const errors = await validate(dto)
      assert.ok(errors.length >= 4)
    })

    it('accepts optional expiresAt and createdBy', async () => {
      const dto = plainToInstance(CreateApiKeyDto, {
        tenantId: 'T001',
        environment: 'TEST',
        name: 'Test Key',
        scopes: ['read'],
        expiresAt: '2026-12-31T23:59:59Z',
        createdBy: 'ops',
      })
      const errors = await validate(dto)
      assert.equal(errors.length, 0)
    })
  })

  // ── SubscribeWebhookDto ──
  describe('SubscribeWebhookDto', () => {
    it('accepts valid webhook subscription', async () => {
      const dto = plainToInstance(SubscribeWebhookDto, {
        tenantId: 'T001',
        url: 'https://example.com/webhook',
        events: ['order.created', 'order.paid'],
        description: 'Order notifications',
        createdBy: 'admin',
      })
      const errors = await validate(dto)
      assert.equal(errors.length, 0)
    })

    it('rejects empty events array', async () => {
      const dto = plainToInstance(SubscribeWebhookDto, {
        tenantId: 'T001',
        url: 'https://example.com/webhook',
        events: [],
      })
      const errors = await validate(dto)
      assert.ok(errors.length > 0)
      assert.ok(errors.some(e => e.property === 'events'))
    })

    it('rejects missing url', async () => {
      const dto = plainToInstance(SubscribeWebhookDto, {
        tenantId: 'T001',
        events: ['order.created'],
      })
      const errors = await validate(dto)
      assert.ok(errors.length > 0)
      assert.ok(errors.some(e => e.property === 'url'))
    })
  })

  // ── CreateSandboxDto ──
  describe('CreateSandboxDto', () => {
    it('accepts valid sandbox creation', async () => {
      const dto = plainToInstance(CreateSandboxDto, {
        parentTenantId: 'T001',
        name: 'Staging Sandbox',
        ttlDays: 30,
        dataMaskingEnabled: true,
      })
      const errors = await validate(dto)
      assert.equal(errors.length, 0)
    })

    it('accepts sandbox with minimal fields', async () => {
      const dto = plainToInstance(CreateSandboxDto, {
        parentTenantId: 'T001',
        name: 'Quick Test',
      })
      const errors = await validate(dto)
      assert.equal(errors.length, 0)
    })

    it('rejects zero ttlDays', async () => {
      const dto = plainToInstance(CreateSandboxDto, {
        parentTenantId: 'T001',
        name: 'Test',
        ttlDays: 0,
      })
      const errors = await validate(dto)
      assert.ok(errors.length > 0)
      assert.ok(errors.some(e => e.property === 'ttlDays'))
    })

    it('rejects ttlDays > 365', async () => {
      const dto = plainToInstance(CreateSandboxDto, {
        parentTenantId: 'T001',
        name: 'Test',
        ttlDays: 500,
      })
      const errors = await validate(dto)
      assert.ok(errors.length > 0)
      assert.ok(errors.some(e => e.property === 'ttlDays'))
    })
  })

  // ── CreateUsageBucketDto ──
  describe('CreateUsageBucketDto', () => {
    it('accepts valid usage bucket', async () => {
      const dto = plainToInstance(CreateUsageBucketDto, {
        tenantId: 'T001',
        endpoint: '/api/orders',
        qps: 10,
        dailyQuota: 10000,
        windowMs: 60000,
      })
      const errors = await validate(dto)
      assert.equal(errors.length, 0)
    })

    it('rejects zero qps', async () => {
      const dto = plainToInstance(CreateUsageBucketDto, {
        tenantId: 'T001',
        endpoint: '/api/test',
        qps: 0,
        dailyQuota: 1000,
      })
      const errors = await validate(dto)
      assert.ok(errors.length > 0)
      assert.ok(errors.some(e => e.property === 'qps'))
    })
  })

  // ── RevokeApiKeyDto ──
  describe('RevokeApiKeyDto', () => {
    it('accepts valid revocation', async () => {
      const dto = plainToInstance(RevokeApiKeyDto, {
        tenantId: 'T001',
        keyId: 'sk_live_abc123',
        reason: 'Compromised key',
      })
      const errors = await validate(dto)
      assert.equal(errors.length, 0)
    })

    it('rejects empty reason', async () => {
      const dto = plainToInstance(RevokeApiKeyDto, {
        tenantId: 'T001',
        keyId: 'sk_test_xyz',
        reason: '',
      })
      const errors = await validate(dto)
      assert.ok(errors.length > 0)
      assert.ok(errors.some(e => e.property === 'reason'))
    })
  })

  // ── CheckUsageDto ──
  describe('CheckUsageDto', () => {
    it('accepts valid usage check', async () => {
      const dto = plainToInstance(CheckUsageDto, {
        tenantId: 'T001',
        keyId: 'sk_live_key_001',
        endpoint: '/api/orders',
      })
      const errors = await validate(dto)
      assert.equal(errors.length, 0)
    })
  })

  // ── VerifySignatureDto ──
  describe('VerifySignatureDto', () => {
    it('accepts valid signature verification', async () => {
      const dto = plainToInstance(VerifySignatureDto, {
        secret: 'whsec_abc123',
        request: { method: 'POST', url: '/api/test', body: '{}', timestamp: 1712345678, nonce: 'n1', signature: 'sig' },
      })
      const errors = await validate(dto)
      assert.equal(errors.length, 0)
    })

    it('rejects missing secret', async () => {
      const dto = plainToInstance(VerifySignatureDto, {
        request: { body: '{}' },
      })
      const errors = await validate(dto)
      assert.ok(errors.length > 0)
      assert.ok(errors.some(e => e.property === 'secret'))
    })
  })

  // ── SetSandboxStatusDto ──
  describe('SetSandboxStatusDto', () => {
    it('accepts valid status update', async () => {
      const dto = plainToInstance(SetSandboxStatusDto, {
        sandboxTenantId: 't-sandbox-001',
        status: 'ACTIVE',
      })
      const errors = await validate(dto)
      assert.equal(errors.length, 0)
    })

    it('rejects invalid status enum', async () => {
      const dto = plainToInstance(SetSandboxStatusDto, {
        sandboxTenantId: 't-sandbox-001',
        status: 'INVALID',
      })
      const errors = await validate(dto)
      assert.ok(errors.length > 0)
      assert.ok(errors.some(e => e.property === 'status'))
    })
  })

  // ── PauseResumeWebhookDto ──
  describe('PauseResumeWebhookDto', () => {
    it('accepts valid pause request', async () => {
      const dto = plainToInstance(PauseResumeWebhookDto, {
        tenantId: 'T001',
        subId: 'wh-sub-001',
      })
      const errors = await validate(dto)
      assert.equal(errors.length, 0)
    })

    it('rejects empty subId', async () => {
      const dto = plainToInstance(PauseResumeWebhookDto, {
        tenantId: 'T001',
        subId: '',
      })
      const errors = await validate(dto)
      assert.ok(errors.length > 0)
      assert.ok(errors.some(e => e.property === 'subId'))
    })
  })

  // ── DispatchWebhookDto ──
  describe('DispatchWebhookDto', () => {
    it('accepts valid dispatch request', async () => {
      const dto = plainToInstance(DispatchWebhookDto, {
        tenantId: 'T001',
        subscriptionId: 'wh-sub-001',
        eventType: 'order.created',
        payload: { orderId: 'ORD-001', amount: 99.99 },
      })
      const errors = await validate(dto)
      assert.equal(errors.length, 0)
    })

    it('rejects missing payload', async () => {
      const dto = plainToInstance(DispatchWebhookDto, {
        tenantId: 'T001',
        subscriptionId: 'wh-sub-001',
        eventType: 'order.created',
      })
      const errors = await validate(dto)
      assert.ok(errors.length > 0)
      assert.ok(errors.some(e => e.property === 'payload'))
    })
  })
})
