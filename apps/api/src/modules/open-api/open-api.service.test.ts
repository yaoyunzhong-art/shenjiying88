import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * OpenApiService test (V9 Art 3, V10 Day 5 Phase 89)
 */

import assert from 'node:assert/strict'
import * as crypto from 'node:crypto'
import { OpenApiService } from './open-api.service'
import { runWithTenant } from '../../common/context/tenant-context'

const CTX = {
  tenantId: 'tenant-A',
  userId: 'admin-A',
  role: 'tenant_admin' as const,
}

describe('OpenApiService V10 Day 5 Phase 89', () => {
  let service: OpenApiService

  beforeEach(() => {
    service = new OpenApiService()
  })

  describe('OAuth 2.0 client_credentials', () => {
    it('success authentication', async () => {
      const token = await service.authenticate('cli-merchant-001', 'test-secret', [])
      assert.ok(token.accessToken)
      assert.equal(token.tokenType, 'Bearer')
      assert.equal(token.expiresIn, 3600)
      assert.ok(token.scope.length > 0)
    })

    it('wrong secret rejected', async () => {
      await assert.rejects(() => service.authenticate('cli-merchant-001', 'wrong-secret', []))
    })

    it('unknown client rejected', async () => {
      await assert.rejects(() => service.authenticate('cli-unknown', 'test-secret', []))
    })

    it('verifyToken valid', async () => {
      const token = await service.authenticate('cli-merchant-001', 'test-secret', [])
      const verified = await service.verifyToken(token.accessToken)
      assert.equal(verified.clientId, 'cli-merchant-001')
    })

    it('verifyToken invalid rejected', async () => {
      await assert.rejects(() => service.verifyToken('invalid-token'))
    })
  })

  describe('HMAC-SHA256 signature', () => {
    it('valid signature passes', () => {
      const method = 'POST'
      const path = '/open/sync'
      const timestamp = Date.now().toString()
      const body = JSON.stringify({ foo: 'bar' })
      const bodyHash = crypto.createHash('sha256').update(body).digest('hex')
      const payload = method + '\n' + path + '\n' + timestamp + '\n' + bodyHash
      const signature = 'sha256=' + crypto.createHmac('sha256', 'hmac-merchant-001-secret').update(payload).digest('hex')
      const ok = service.verifyHmacSignature('cli-merchant-001', method, path, timestamp, body, signature)
      assert.equal(ok, true)
    })

    it('wrong signature rejected', () => {
      const ok = service.verifyHmacSignature('cli-merchant-001', 'POST', '/open/sync', Date.now().toString(), '{}', 'sha256=wrong')
      assert.equal(ok, false)
    })

    it('expired timestamp rejected (5 min window)', () => {
      const oldTs = (Date.now() - 10 * 60 * 1000).toString()
      const body = '{}'
      const bodyHash = crypto.createHash('sha256').update(body).digest('hex')
      const payload = 'POST\n/open/sync\n' + oldTs + '\n' + bodyHash
      const signature = 'sha256=' + crypto.createHmac('sha256', 'hmac-merchant-001-secret').update(payload).digest('hex')
      const ok = service.verifyHmacSignature('cli-merchant-001', 'POST', '/open/sync', oldTs, body, signature)
      assert.equal(ok, false)
    })
  })

  describe('IP whitelist', () => {
    it('whitelisted IP passes', () => {
      assert.equal(service.verifyIpWhitelist('cli-merchant-001', '127.0.0.1'), true)
      assert.equal(service.verifyIpWhitelist('cli-merchant-001', '192.168.1.100'), true)
    })

    it('non-whitelisted IP rejected', () => {
      assert.equal(service.verifyIpWhitelist('cli-merchant-001', '10.0.0.1'), false)
    })

    it('no whitelist (partner) allows all', () => {
      assert.equal(service.verifyIpWhitelist('cli-partner-pos', '8.8.8.8'), true)
    })

    it('unknown client rejected', () => {
      assert.equal(service.verifyIpWhitelist('cli-unknown', '127.0.0.1'), false)
    })
  })

  describe('Rate limit (sliding window)', () => {
    it('first N requests allowed (N=rateLimitQps)', () => {
      for (let i = 0; i < 100; i++) {
        const r = service.checkRateLimit('cli-merchant-001')
        assert.equal(r.allowed, true)
      }
      const r = service.checkRateLimit('cli-merchant-001')
      assert.equal(r.allowed, false)
    })

    it('unknown client rejected', () => {
      const r = service.checkRateLimit('cli-unknown')
      assert.equal(r.allowed, false)
    })
  })

  describe('Command send + idempotency', () => {
    it('normal command send', async () => {
      const token = await service.authenticate('cli-merchant-001', 'test-secret', [])
      await runWithTenant({ ...CTX, bearerToken: token.accessToken } as any, async () => {
        const cmd = await service.sendCommand(
          'cli-merchant-001',
          { commandType: 'print', targetDeviceId: 'device-1', params: { text: 'hello' }, priority: 'normal' },
          undefined,
        )
        assert.equal(cmd.status, 'success')
        assert.equal(cmd.commandType, 'print')
        assert.ok(cmd.durationMs !== undefined)
      })
    })

    it('idempotency key returns same command', async () => {
      const token = await service.authenticate('cli-merchant-001', 'test-secret', [])
      const idemKey = 'idem-key-456'

      await runWithTenant({ ...CTX, bearerToken: token.accessToken } as any, async () => {
        const cmd1 = await service.sendCommand(
          'cli-merchant-001',
          { commandType: 'print', targetDeviceId: 'device-1', params: {}, priority: 'normal' },
          idemKey,
        )
        const cmd2 = await service.sendCommand(
          'cli-merchant-001',
          { commandType: 'print', targetDeviceId: 'device-1', params: {}, priority: 'normal' },
          idemKey,
        )
        assert.equal(cmd1.id, cmd2.id)
      })
    })
  })
})