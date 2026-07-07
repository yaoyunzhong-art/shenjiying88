import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * OpenApi DTO validation tests (V10 Day 5 Phase 89)
 */

import 'reflect-metadata'
import assert from 'node:assert'
import { validate } from 'class-validator'
import { plainToInstance } from 'class-transformer'
import {
  AuthRequestDto,
  VerifyTokenRequestDto,
  CommandPayloadDto,
  CommandRequestDto,
  ListClientsQueryDto,
  TokenResponseDto,
  ErrorResponseDto,
  CommandExecutionResponseDto,
} from './open-api.dto'

describe('OpenApi DTOs', () => {
  // ============ AuthRequestDto ============

  describe('AuthRequestDto', () => {
    it('should validate valid auth request', async () => {
      const dto = plainToInstance(AuthRequestDto, {
        client_id: 'cli-merchant-001',
        client_secret: 'test-secret',
        scope: 'sync:write command:send',
      })
      const errors = await validate(dto)
      assert.strictEqual(errors.length, 0)
    })

    it('should validate auth request with minimal fields', async () => {
      const dto = plainToInstance(AuthRequestDto, {
        client_id: 'cli-merchant-001',
        client_secret: 'test-secret',
      })
      const errors = await validate(dto)
      assert.strictEqual(errors.length, 0)
    })

    it('should reject missing client_id', async () => {
      const dto = plainToInstance(AuthRequestDto, {
        client_secret: 'test-secret',
      })
      const errors = await validate(dto)
      assert.ok(errors.length > 0)
      assert.ok(errors.some((e) => e.property === 'client_id'))
    })

    it('should reject missing client_secret', async () => {
      const dto = plainToInstance(AuthRequestDto, {
        client_id: 'cli-merchant-001',
      })
      const errors = await validate(dto)
      assert.ok(errors.length > 0)
      assert.ok(errors.some((e) => e.property === 'client_secret'))
    })

    it('should reject empty client_id', async () => {
      const dto = plainToInstance(AuthRequestDto, {
        client_id: '',
        client_secret: 'test-secret',
      })
      const errors = await validate(dto)
      assert.ok(errors.length > 0)
    })

    it('should reject empty client_secret', async () => {
      const dto = plainToInstance(AuthRequestDto, {
        client_id: 'cli-merchant-001',
        client_secret: '',
      })
      const errors = await validate(dto)
      assert.ok(errors.length > 0)
    })
  })

  // ============ VerifyTokenRequestDto ============

  describe('VerifyTokenRequestDto', () => {
    it('should validate valid verify token request', async () => {
      const dto = plainToInstance(VerifyTokenRequestDto, {
        access_token: 'abc123token',
      })
      const errors = await validate(dto)
      assert.strictEqual(errors.length, 0)
    })

    it('should reject empty access_token', async () => {
      const dto = plainToInstance(VerifyTokenRequestDto, {
        access_token: '',
      })
      const errors = await validate(dto)
      assert.ok(errors.length > 0)
    })

    it('should reject missing access_token', async () => {
      const dto = plainToInstance(VerifyTokenRequestDto, {})
      const errors = await validate(dto)
      assert.ok(errors.length > 0)
      assert.ok(errors.some((e) => e.property === 'access_token'))
    })
  })

  // ============ CommandPayloadDto ============

  describe('CommandPayloadDto', () => {
    it('should validate valid command payload', async () => {
      const dto = plainToInstance(CommandPayloadDto, {
        commandType: 'print',
        targetDeviceId: 'device-001',
        params: { text: 'hello' },
        priority: 'normal',
      })
      const errors = await validate(dto)
      assert.strictEqual(errors.length, 0)
    })

    it('should validate command with optional expectedResponseMs', async () => {
      const dto = plainToInstance(CommandPayloadDto, {
        commandType: 'open-door',
        targetDeviceId: 'door-01',
        params: { doorId: 'main' },
        priority: 'high',
        expectedResponseMs: 5000,
      })
      const errors = await validate(dto)
      assert.strictEqual(errors.length, 0)
    })

    it('should reject missing commandType', async () => {
      const dto = plainToInstance(CommandPayloadDto, {
        targetDeviceId: 'device-001',
        params: {},
        priority: 'normal',
      })
      const errors = await validate(dto)
      assert.ok(errors.length > 0)
      assert.ok(errors.some((e) => e.property === 'commandType'))
    })

    it('should reject missing targetDeviceId', async () => {
      const dto = plainToInstance(CommandPayloadDto, {
        commandType: 'print',
        params: {},
        priority: 'normal',
      })
      const errors = await validate(dto)
      assert.ok(errors.length > 0)
      assert.ok(errors.some((e) => e.property === 'targetDeviceId'))
    })

    it('should reject missing priority', async () => {
      const dto = plainToInstance(CommandPayloadDto, {
        commandType: 'print',
        targetDeviceId: 'device-001',
        params: {},
      })
      const errors = await validate(dto)
      assert.ok(errors.length > 0)
      assert.ok(errors.some((e) => e.property === 'priority'))
    })

    it('should reject invalid priority value', async () => {
      const dto = plainToInstance(CommandPayloadDto, {
        commandType: 'print',
        targetDeviceId: 'device-001',
        params: {},
        priority: 'critical',
      })
      const errors = await validate(dto)
      assert.ok(errors.length > 0)
      assert.ok(errors.some((e) => e.property === 'priority'))
    })

    it('should reject expectedResponseMs below 100', async () => {
      const dto = plainToInstance(CommandPayloadDto, {
        commandType: 'print',
        targetDeviceId: 'device-001',
        params: {},
        priority: 'normal',
        expectedResponseMs: 50,
      })
      const errors = await validate(dto)
      assert.ok(errors.length > 0)
      assert.ok(errors.some((e) => e.property === 'expectedResponseMs'))
    })

    it('should reject expectedResponseMs above 30000', async () => {
      const dto = plainToInstance(CommandPayloadDto, {
        commandType: 'print',
        targetDeviceId: 'device-001',
        params: {},
        priority: 'normal',
        expectedResponseMs: 99999,
      })
      const errors = await validate(dto)
      assert.ok(errors.length > 0)
      assert.ok(errors.some((e) => e.property === 'expectedResponseMs'))
    })

    it('should accept boundary values for priority enum', async () => {
      for (const p of ['low', 'normal', 'high', 'urgent'] as const) {
        const dto = plainToInstance(CommandPayloadDto, {
          commandType: 'print',
          targetDeviceId: 'device-001',
          params: {},
          priority: p,
        })
        const errors = await validate(dto)
        assert.strictEqual(errors.length, 0, `priority=${p} should be valid`)
      }
    })

    // ---- edge cases ----

    it('should reject empty commandType string', async () => {
      const dto = plainToInstance(CommandPayloadDto, {
        commandType: '',
        targetDeviceId: 'device-001',
        params: {},
        priority: 'normal',
      })
      const errors = await validate(dto)
      assert.ok(errors.length > 0)
    })

    it('should accept empty params object', async () => {
      const dto = plainToInstance(CommandPayloadDto, {
        commandType: 'ping',
        targetDeviceId: 'device-001',
        params: {},
        priority: 'low',
      })
      const errors = await validate(dto)
      assert.strictEqual(errors.length, 0)
    })
  })

  // ============ ListClientsQueryDto ============

  describe('ListClientsQueryDto', () => {
    it('should validate valid tenantId query', async () => {
      const dto = plainToInstance(ListClientsQueryDto, { tenantId: 'tenant-A' })
      const errors = await validate(dto)
      assert.strictEqual(errors.length, 0)
    })

    it('should reject missing tenantId', async () => {
      const dto = plainToInstance(ListClientsQueryDto, {})
      const errors = await validate(dto)
      assert.ok(errors.length > 0)
      assert.ok(errors.some((e) => e.property === 'tenantId'))
    })

    it('should reject empty tenantId', async () => {
      const dto = plainToInstance(ListClientsQueryDto, { tenantId: '' })
      const errors = await validate(dto)
      assert.ok(errors.length > 0)
    })
  })

  // ============ TokenResponseDto ============

  describe('TokenResponseDto', () => {
    it('should validate valid token response', async () => {
      const dto = plainToInstance(TokenResponseDto, {
        accessToken: 'abc123',
        tokenType: 'Bearer',
        expiresIn: 3600,
        scope: ['sync:write'],
        jti: 'jti-123',
        issuedAt: new Date().toISOString(),
      })
      const errors = await validate(dto)
      assert.strictEqual(errors.length, 0)
    })

    it('should reject invalid tokenType', async () => {
      const dto = plainToInstance(TokenResponseDto, {
        accessToken: 'abc123',
        tokenType: 'Mac',
        expiresIn: 3600,
        scope: ['sync:write'],
        jti: 'jti-123',
        issuedAt: new Date().toISOString(),
      })
      const errors = await validate(dto)
      assert.ok(errors.length > 0)
    })
  })

  // ============ ErrorResponseDto ============

  describe('ErrorResponseDto', () => {
    it('should validate valid error response', async () => {
      const dto = plainToInstance(ErrorResponseDto, {
        error: 'invalid_client',
        errorDescription: 'Unknown client_id',
      })
      const errors = await validate(dto)
      assert.strictEqual(errors.length, 0)
    })

    it('should reject missing error field', async () => {
      const dto = plainToInstance(ErrorResponseDto, {
        errorDescription: 'Something went wrong',
      })
      const errors = await validate(dto)
      assert.ok(errors.length > 0)
    })
  })

  // ============ CommandExecutionResponseDto ============

  describe('CommandExecutionResponseDto', () => {
    it('should validate complete response with completedAt', async () => {
      const dto = plainToInstance(CommandExecutionResponseDto, {
        id: 'cmd-001',
        clientId: 'cli-merchant-001',
        commandType: 'print',
        targetDeviceId: 'device-001',
        params: {},
        priority: 'normal',
        status: 'success',
        durationMs: 50,
        startedAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
      })
      const errors = await validate(dto)
      assert.strictEqual(errors.length, 0)
    })

    it('should validate minimal response without optional fields', async () => {
      const dto = plainToInstance(CommandExecutionResponseDto, {
        id: 'cmd-001',
        clientId: 'cli-merchant-001',
        commandType: 'print',
        targetDeviceId: 'device-001',
        params: {},
        priority: 'normal',
        status: 'pending',
        startedAt: new Date().toISOString(),
      })
      const errors = await validate(dto)
      assert.strictEqual(errors.length, 0)
    })

    it('should reject invalid status value', async () => {
      const dto = plainToInstance(CommandExecutionResponseDto, {
        id: 'cmd-001',
        clientId: 'cli-merchant-001',
        commandType: 'print',
        targetDeviceId: 'device-001',
        params: {},
        priority: 'normal',
        status: 'unknown',
        startedAt: new Date().toISOString(),
      })
      const errors = await validate(dto)
      assert.ok(errors.length > 0)
    })
  })
})
