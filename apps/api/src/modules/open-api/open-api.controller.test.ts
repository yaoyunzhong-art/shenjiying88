import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * OpenApiController tests (V10 Day 5 Phase 89)
 *
 * Tests the REST endpoints directly by calling controller methods.
 * Uses the service seeded with test clients.
 */

import assert from 'node:assert/strict'
import * as crypto from 'node:crypto'
import { OpenApiController } from './open-api.controller'
import { OpenApiService } from './open-api.service'
import { runWithTenant } from '../../common/context/tenant-context'
import type { SyncPayload, CommandPayload } from './open-api.entity'

const CTX = {
  tenantId: 'tenant-A',
  userId: 'admin-A',
  role: 'tenant_admin' as const,
}

function mockReq(ip = '127.0.0.1', bearer = ''): any {
  return {
    headers: {
      'x-forwarded-for': ip,
      authorization: bearer ? `Bearer ${bearer}` : undefined,
    },
    socket: { remoteAddress: ip },
  }
}

describe('OpenApiController V10 Day 5 Phase 89', () => {
  let controller: OpenApiController
  let service: OpenApiService
  let validToken: string

  beforeEach(async () => {
    service = new OpenApiService()
    controller = new OpenApiController(service)

    // 预认证获取 token
    const tokenResp = await service.authenticate('cli-merchant-001', 'test-secret', [])
    validToken = tokenResp.accessToken
  })

  // ============ POST /open/auth ============

  describe('POST /open/auth - authenticate', () => {
    it('should authenticate with valid credentials from whitelisted IP', async () => {
      const result = await controller.authenticate(
        { client_id: 'cli-merchant-001', client_secret: 'test-secret' },
        mockReq('192.168.1.10'),
      )
      assert.ok(result.accessToken)
      assert.equal(result.tokenType, 'Bearer')
      assert.equal(result.expiresIn, 3600)
      assert.ok(Array.isArray(result.scope))
    })

    it('should reject wrong client_secret', async () => {
      await assert.rejects(
        () => controller.authenticate(
          { client_id: 'cli-merchant-001', client_secret: 'wrong' },
          mockReq('127.0.0.1'),
        ),
      )
    })

    it('should reject unknown client_id', async () => {
      await assert.rejects(
        () => controller.authenticate(
          { client_id: 'cli-unknown', client_secret: 'test-secret' },
          mockReq('127.0.0.1'),
        ),
      )
    })

    it('should reject request from non-whitelisted IP', async () => {
      await assert.rejects(
        () => controller.authenticate(
          { client_id: 'cli-merchant-001', client_secret: 'test-secret' },
          mockReq('10.0.0.1'),
        ),
      )
    })

    it('should authenticate partner with no IP whitelist from any IP', async () => {
      const result = await controller.authenticate(
        { client_id: 'cli-partner-pos', client_secret: 'test-secret' },
        mockReq('8.8.8.8'),
      )
      assert.ok(result.accessToken)
    })

    it('should pass scope parameter through', async () => {
      const result = await controller.authenticate(
        { client_id: 'cli-merchant-001', client_secret: 'test-secret', scope: 'sync:read sync:write' },
        mockReq('127.0.0.1'),
      )
      // scope should contain requested scopes
      const scopeNames = result.scope.map((s: string) => s)
      assert.ok(scopeNames.includes('sync:read'))
      assert.ok(scopeNames.includes('sync:write'))
    })
  })

  // ============ POST /open/verify ============

  describe('POST /open/verify - verify', () => {
    it('should verify a valid token', async () => {
      const result = await controller.verify({ access_token: validToken })
      assert.equal(result.clientId, 'cli-merchant-001')
      assert.equal(result.tokenType, 'Bearer')
    })

    it('should reject an invalid token', async () => {
      await assert.rejects(() => controller.verify({ access_token: 'invalid' }))
    })

    it('should reject an empty token', async () => {
      await assert.rejects(() => controller.verify({ access_token: '' }))
    })
  })

  // ============ POST /open/sync ============

  describe('POST /open/sync - sync', () => {
    const syncPayload: SyncPayload = {
      resourceType: 'order',
      action: 'create',
      data: { orderId: 'ORD-001', amount: 100 },
      businessKey: 'biz-order-001',
      timestamp: new Date().toISOString(),
    }

    function signSync(method: string, path: string, ts: string, body: string, secret: string): string {
      const bodyHash = crypto.createHash('sha256').update(body).digest('hex')
      const payload = `${method}\n${path}\n${ts}\n${bodyHash}`
      return 'sha256=' + crypto.createHmac('sha256', secret).update(payload).digest('hex')
    }

    it('should accept valid sync with correct HMAC and whitelisted IP', async () => {
      await runWithTenant({ ...CTX, bearerToken: validToken } as any, async () => {
        const ts = Date.now().toString()
        const body = JSON.stringify(syncPayload)
        const sig = signSync('POST', '/open/sync', ts, body, 'hmac-merchant-001-secret')

        const result = await controller.sync(
          syncPayload,
          `Bearer ${validToken}`,
          'cli-merchant-001',
          sig,
          ts,
          mockReq('192.168.1.50'),
        )
        assert.ok(result.accepted)
        assert.equal(result.businessKey, 'biz-order-001')
      })
    })

    it('should reject sync with invalid HMAC signature', async () => {
      const ts = Date.now().toString()
      await assert.rejects(
        () => controller.sync(
          syncPayload,
          `Bearer ${validToken}`,
          'cli-merchant-001',
          'sha256=bad',
          ts,
          mockReq('192.168.1.50'),
        ),
      )
    })

    it('should reject sync from non-whitelisted IP', async () => {
      const ts = Date.now().toString()
      const body = JSON.stringify(syncPayload)
      const sig = signSync('POST', '/open/sync', ts, body, 'hmac-merchant-001-secret')

      await assert.rejects(
        () => controller.sync(
          syncPayload,
          `Bearer ${validToken}`,
          'cli-merchant-001',
          sig,
          ts,
          mockReq('10.0.0.1'),
        ),
      )
    })

    it('should reject sync with expired timestamp', async () => {
      const oldTs = (Date.now() - 10 * 60 * 1000).toString()
      const body = JSON.stringify(syncPayload)
      const sig = signSync('POST', '/open/sync', oldTs, body, 'hmac-merchant-001-secret')

      await assert.rejects(
        () => controller.sync(
          syncPayload,
          `Bearer ${validToken}`,
          'cli-merchant-001',
          sig,
          oldTs,
          mockReq('127.0.0.1'),
        ),
      )
    })

    it('should reject sync without authorization header', async () => {
      const ts = Date.now().toString()
      const sig = signSync('POST', '/open/sync', ts, JSON.stringify(syncPayload), 'hmac-merchant-001-secret')

      await assert.rejects(
        () => controller.sync(
          syncPayload,
          undefined as any,
          'cli-merchant-001',
          sig,
          ts,
          mockReq('127.0.0.1'),
        ),
      )
    })
  })

  // ============ POST /open/command ============

  describe('POST /open/command - command', () => {
    const cmdPayload: CommandPayload = {
      commandType: 'print',
      targetDeviceId: 'printer-01',
      params: { document: 'receipt-001' },
      priority: 'high',
    }

    function signCmd(method: string, path: string, ts: string, body: string, secret: string): string {
      const bodyHash = crypto.createHash('sha256').update(body).digest('hex')
      const payload = `${method}\n${path}\n${ts}\n${bodyHash}`
      return 'sha256=' + crypto.createHmac('sha256', secret).update(payload).digest('hex')
    }

    it('should accept valid command with correct HMAC', async () => {
      await runWithTenant({ ...CTX, bearerToken: validToken } as any, async () => {
        const ts = Date.now().toString()
        const body = JSON.stringify(cmdPayload)
        const sig = signCmd('POST', '/open/command', ts, body, 'hmac-merchant-001-secret')

        const result = await controller.command(
          cmdPayload,
          `Bearer ${validToken}`,
          'cli-merchant-001',
          sig,
          ts,
          undefined,
          mockReq('192.168.1.50'),
        )
        assert.equal((result as any).status, 'success')
        assert.equal((result as any).commandType, 'print')
      })
    })

    it('should accept command with idempotency key', async () => {
      await runWithTenant({ ...CTX, bearerToken: validToken } as any, async () => {
        const ts = Date.now().toString()
        const body = JSON.stringify(cmdPayload)
        const sig = signCmd('POST', '/open/command', ts, body, 'hmac-merchant-001-secret')

        const result = await controller.command(
          cmdPayload,
          `Bearer ${validToken}`,
          'cli-merchant-001',
          sig,
          ts,
          'idem-test-001',
          mockReq('192.168.1.50'),
        )
        assert.equal((result as any).status, 'success')
      })
    })

    it('should reject command with invalid HMAC', async () => {
      const ts = Date.now().toString()
      await assert.rejects(
        () => controller.command(
          cmdPayload,
          `Bearer ${validToken}`,
          'cli-merchant-001',
          'sha256=invalid',
          ts,
          undefined,
          mockReq('127.0.0.1'),
        ),
      )
    })

    it('should reject command from non-whitelisted IP', async () => {
      const ts = Date.now().toString()
      const body = JSON.stringify(cmdPayload)
      const sig = signCmd('POST', '/open/command', ts, body, 'hmac-merchant-001-secret')

      await assert.rejects(
        () => controller.command(
          cmdPayload,
          `Bearer ${validToken}`,
          'cli-merchant-001',
          sig,
          ts,
          undefined,
          mockReq('10.0.0.1'),
        ),
      )
    })
  })

  // ============ GET /open/clients ============

  describe('GET /open/clients - listClients', () => {
    it('should list clients for a tenant', async () => {
      const result = await controller.listClients('tenant-A')
      assert.ok(Array.isArray(result.data))
      assert.ok(result.data.length >= 1)
      assert.equal(result.data[0].tenantId, 'tenant-A')
    })

    it('should return empty array for tenant with no clients', async () => {
      const result = await controller.listClients('tenant-unknown')
      assert.ok(Array.isArray(result.data))
      assert.equal(result.data.length, 0)
    })

    it('should filter clients by tenantId', async () => {
      const resultA = await controller.listClients('tenant-A')
      const resultB = await controller.listClients('tenant-B')
      assert.ok(resultA.data.length >= 1)
      assert.ok(resultB.data.length >= 1)
      // tenant-A and tenant-B have different clients
      const clientIdsA = resultA.data.map((c: any) => c.clientId)
      assert.ok(clientIdsA.includes('cli-merchant-001'))
      assert.ok(!clientIdsA.includes('cli-partner-pos'))
    })
  })
})
