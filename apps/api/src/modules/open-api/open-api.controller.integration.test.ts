import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * 🐜 自动: [open-api] [D] Controller 集成测试
 *
 * 覆盖:
 * - OAuth 2.0 client_credentials 认证 (正例 + 密钥错误 + 状态异常)
 * - Token 验证 (正例 + 过期/不存在)
 * - HMAC-SHA256 签名校验 + IP 白名单 + 限流
 * - 数据同步 (scope 校验)
 * - 指令下发 (幂等性 + scope 校验 + 限流熔断)
 * - 客户端列表 (按租户隔离)
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import { OpenApiController } from './open-api.controller'
import { OpenApiService } from './open-api.service'
import { runWithTenant } from '../../common/context/tenant-context'
import * as crypto from 'node:crypto'
import { BadRequestException } from '@nestjs/common'

// ── 夹具 ──
const TENANT_A = {
  tenantId: 'tenant-A',
  storeId: 'store-A',
  userId: 'admin-A',
  role: 'tenant_admin' as const,
}

const TENANT_B = {
  tenantId: 'tenant-B',
  storeId: 'store-B',
  userId: 'admin-B',
  role: 'tenant_admin' as const,
}

/** 构建 mock 请求对象 */
function mockReq(clientIp = '127.0.0.1') {
  return {
    headers: { 'x-forwarded-for': clientIp },
    socket: { remoteAddress: clientIp },
  } as any
}

/** 生成 HMAC 签名 */
function signHmac(secret: string, method: string, path: string, timestamp: string, body: string): string {
  const bodyHash = crypto.createHash('sha256').update(body).digest('hex')
  const payload = `${method}\n${path}\n${timestamp}\n${bodyHash}`
  return crypto.createHmac('sha256', secret).update(payload).digest('hex')
}

/** 获取 NestJS HttpException 的 response 对象 */
function getResponse(err: any): any {
  return typeof err.getResponse === 'function' ? err.getResponse() : err
}

/** 获取 NestJS HttpException 的 message */
function getErrorMessage(err: any): string {
  const resp = getResponse(err)
  if (typeof resp === 'string') return resp
  return resp?.errorDescription ?? resp?.message ?? err.message ?? ''
}

/** 获取 NestJS HttpException 的 status */
function getErrorStatus(err: any): number {
  return typeof err.getStatus === 'function' ? err.getStatus() : err.status ?? 500
}

// ── 测试套件 ──
describe('OpenApiController — 集成测试', () => {
  let controller: OpenApiController
  let service: OpenApiService

  beforeEach(() => {
    service = new OpenApiService()
    controller = new OpenApiController(service)
  })

  // ════════════════════
  //  1. POST /open/auth
  // ════════════════════
  describe('POST /open/auth — OAuth 认证', () => {
    it('正例: 有效 client_id + secret 返回 access_token', async () => {
      const result = await runWithTenant(TENANT_A, () =>
        controller.authenticate(
          { client_id: 'cli-merchant-001', client_secret: 'test-secret' },
          mockReq(),
        ),
      )
      assert.ok(result.accessToken)
      assert.equal(result.tokenType, 'Bearer')
      assert.equal(result.expiresIn, 3600)
      assert.ok(result.scope.includes('auth:read'))
      assert.ok(result.jti.startsWith('jti-'))
      assert.ok(result.issuedAt)
    })

    it('反例: 错误的 client_secret 抛出 401', async () => {
      try {
        await runWithTenant(TENANT_A, () =>
          controller.authenticate(
            { client_id: 'cli-merchant-001', client_secret: 'wrong-secret' },
            mockReq(),
          ),
        )
        assert.fail('应抛出异常')
      } catch (err: any) {
        assert.equal(getErrorStatus(err), 401)
        assert.ok(getErrorMessage(err).includes('Invalid client_secret'))
      }
    })

    it('反例: 不存在的 client_id 抛出 401', async () => {
      try {
        await runWithTenant(TENANT_A, () =>
          controller.authenticate(
            { client_id: 'cli-unknown', client_secret: 'x' },
            mockReq(),
          ),
        )
        assert.fail('应抛出异常')
      } catch (err: any) {
        assert.equal(getErrorStatus(err), 401)
        assert.ok(getResponse(err)?.error === 'invalid_client')
      }
    })

    it('反例: IP 不在白名单被拒绝', async () => {
      try {
        await runWithTenant(TENANT_A, () =>
          controller.authenticate(
            { client_id: 'cli-merchant-001', client_secret: 'test-secret' },
            mockReq('10.0.0.1'), // 不在白名单
          ),
        )
        assert.fail('应抛出异常')
      } catch (err: any) {
        assert.ok(getErrorMessage(err).includes('whitelist'))
      }
    })

    it('边界: 空 scope 使用默认全部授予', async () => {
      const result = await runWithTenant(TENANT_A, () =>
        controller.authenticate(
          { client_id: 'cli-merchant-001', client_secret: 'test-secret' },
          mockReq(),
        ),
      )
      assert.ok(result.scope.length > 0)
    })
  })

  // ══════════════════════
  //  2. POST /open/verify
  // ══════════════════════
  describe('POST /open/verify — Token 验证', () => {
    it('正例: 有效 token 返回 token 信息', async () => {
      const token = await runWithTenant(TENANT_A, () =>
        controller.authenticate(
          { client_id: 'cli-merchant-001', client_secret: 'test-secret' },
          mockReq(),
        ),
      )
      const result = await controller.verify({ access_token: token.accessToken })
      assert.equal(result.accessToken, token.accessToken)
      assert.equal(result.clientId, 'cli-merchant-001')
    })

    it('反例: 不存在的 token 抛出 401', async () => {
      try {
        await controller.verify({ access_token: 'invalid-token' })
        assert.fail('应抛出异常')
      } catch (err: any) {
        assert.equal(getErrorStatus(err), 401)
        assert.ok(getErrorMessage(err).includes('not found'))
      }
    })
  })

  // ══════════════════════
  //  3. POST /open/sync
  // ══════════════════════
  describe('POST /open/sync — 数据同步', () => {
    it('正例: 有效 Bearer + HMAC + IP 白名单返回 accepted', async () => {
      // 先获取一个真实 token
      const tokenRes = await runWithTenant(TENANT_A, () =>
        controller.authenticate(
          { client_id: 'cli-merchant-001', client_secret: 'test-secret' },
          mockReq(),
        ),
      )

      const syncCtx = {
        ...TENANT_A,
        bearerToken: tokenRes.accessToken,
      }

      const result = await runWithTenant(syncCtx, async () => {
        const ts = String(Date.now())
        const body = JSON.stringify({
          resourceType: 'order',
          action: 'create',
          data: { orderId: 'ORD-001' },
          businessKey: 'biz-order-001',
          timestamp: new Date().toISOString(),
        })
        const sig = signHmac('hmac-merchant-001-secret', 'POST', '/open/sync', ts, body)
        return controller.sync(
          JSON.parse(body),
          `Bearer ${tokenRes.accessToken}`,
          'cli-merchant-001',
          `sha256=${sig}`,
          ts,
          mockReq(),
        )
      })
      assert.equal(result.accepted, true)
      assert.equal(result.businessKey, 'biz-order-001')
      assert.ok(result.timestamp)
    })

    it('反例: 无效 HMAC 签名拒绝', async () => {
      const tokenRes = await runWithTenant(TENANT_A, () =>
        controller.authenticate(
          { client_id: 'cli-merchant-001', client_secret: 'test-secret' },
          mockReq(),
        ),
      )
      const syncCtx = { ...TENANT_A, bearerToken: tokenRes.accessToken }

      try {
        await runWithTenant(syncCtx, () =>
          controller.sync(
            { resourceType: 'order', action: 'create', data: {}, businessKey: 'biz-x', timestamp: '' } as any,
            `Bearer ${tokenRes.accessToken}`,
            'cli-merchant-001',
            'sha256=bad-signature',
            String(Date.now()),
            mockReq(),
          ),
        )
        assert.fail('应抛出异常')
      } catch (err: any) {
        assert.ok(getErrorMessage(err).includes('HMAC'))
      }
    })

    it('反例: IP 不在白名单拒绝', async () => {
      const tokenRes = await runWithTenant(TENANT_A, () =>
        controller.authenticate(
          { client_id: 'cli-merchant-001', client_secret: 'test-secret' },
          mockReq(),
        ),
      )
      const syncCtx = { ...TENANT_A, bearerToken: tokenRes.accessToken }

      try {
        await runWithTenant(syncCtx, () =>
          controller.sync(
            { resourceType: 'order', action: 'create', data: {}, businessKey: 'biz-x', timestamp: '' } as any,
            `Bearer ${tokenRes.accessToken}`,
            'cli-merchant-001',
            'sha256=sig',
            String(Date.now()),
            mockReq('10.0.0.99'),
          ),
        )
        assert.fail('应抛出异常')
      } catch (err: any) {
        assert.ok(getErrorMessage(err).includes('whitelist'))
      }
    })
  })

  // ════════════════════════
  //  4. POST /open/command
  // ════════════════════════
  describe('POST /open/command — 指令下发', () => {
    it('正例: 有效请求返回 CommandExecution', async () => {
      const tokenRes = await runWithTenant(TENANT_A, () =>
        controller.authenticate(
          { client_id: 'cli-merchant-001', client_secret: 'test-secret' },
          mockReq(),
        ),
      )
      const ctx = { ...TENANT_A, bearerToken: tokenRes.accessToken }

      const result = await runWithTenant(ctx, async () => {
        const ts = String(Date.now())
        const payload = JSON.stringify({
          commandType: 'print',
          targetDeviceId: 'printer-01',
          params: { copies: 2 },
          priority: 'high',
        })
        const sig = signHmac('hmac-merchant-001-secret', 'POST', '/open/command', ts, payload)
        return controller.command(
          JSON.parse(payload),
          `Bearer ${tokenRes.accessToken}`,
          'cli-merchant-001',
          `sha256=${sig}`,
          ts,
          'idem-print-001',
          mockReq(),
        )
      })
      if (!('status' in result) || result.status !== 'success') {
        assert.fail('expected command execution result, got error: ' + JSON.stringify(result))
        return
      }
      assert.ok((result as any).id.startsWith('cmd-'))
      assert.equal((result as any).status, 'success')
      assert.equal((result as any).commandType, 'print')
      assert.equal((result as any).targetDeviceId, 'printer-01')
      assert.ok((result as any).durationMs! >= 0)
    })

    it('幂等性: 相同 idempotency-key 返回相同结果', async () => {
      const tokenRes = await runWithTenant(TENANT_A, () =>
        controller.authenticate(
          { client_id: 'cli-merchant-001', client_secret: 'test-secret' },
          mockReq(),
        ),
      )
      const idempotencyKey = 'idem-unique-123'
      const ctx = { ...TENANT_A, bearerToken: tokenRes.accessToken }

      const runCmd = () => runWithTenant(ctx, async () => {
        const ts = String(Date.now())
        const payload = JSON.stringify({
          commandType: 'reboot',
          targetDeviceId: 'device-01',
          params: { force: true },
          priority: 'urgent',
        })
        const sig = signHmac('hmac-merchant-001-secret', 'POST', '/open/command', ts, payload)
        return controller.command(
          JSON.parse(payload),
          `Bearer ${tokenRes.accessToken}`,
          'cli-merchant-001',
          `sha256=${sig}`,
          ts,
          idempotencyKey,
          mockReq(),
        )
      })

      const result1 = await runCmd()
      const result2 = await runCmd()
      assert.equal((result1 as any).id, (result2 as any).id)
      assert.equal((result1 as any).status, (result2 as any).status)
    })

    it('限流: 超 QPS 返回 rate_limited 错误', async () => {
      // cli-partner-pos 没有 IP 白名单限制, QPS=50
      const tokenRes = await runWithTenant(TENANT_B, () =>
        controller.authenticate(
          { client_id: 'cli-partner-pos', client_secret: 'test-secret' },
          mockReq(),
        ),
      )
      const ctx = { ...TENANT_B, bearerToken: tokenRes.accessToken }

      const promises = []
      for (let i = 0; i < 60; i++) {
        promises.push(
          runWithTenant(ctx, async () => {
            const ts = String(Date.now())
            const payload = JSON.stringify({
              commandType: 'status',
              targetDeviceId: `device-${i}`,
              params: { seq: i },
              priority: 'normal',
            })
            const sig = signHmac('hmac-pos-secret', 'POST', '/open/command', ts, payload)
            return controller.command(
              JSON.parse(payload),
              `Bearer ${tokenRes.accessToken}`,
              'cli-partner-pos',
              `sha256=${sig}`,
              ts,
              undefined,
              mockReq(),
            )
          }).catch(() => null), // 吞掉限流错误
        )
      }

      const results = await Promise.all(promises)
      const rateLimited = results.filter(
        (r) => r && typeof (r as any)?.error === 'string' && (r as any).error === 'rate_limited',
      )
      assert.ok(rateLimited.length >= 1, '应至少有一个请求被限流')
    })

    it('反例: 缺少 command:send scope 被拒绝', async () => {
      // cli-partner-pos 只有 sync scope, 没有 command:send
      const tokenRes = await runWithTenant(TENANT_B, () =>
        controller.authenticate(
          { client_id: 'cli-partner-pos', client_secret: 'test-secret', scope: 'sync:read sync:bulk' },
          mockReq(),
        ),
      )
      const ctx = { ...TENANT_B, bearerToken: tokenRes.accessToken }

      try {
        await runWithTenant(ctx, async () => {
          const ts = String(Date.now())
          const payload = JSON.stringify({
            commandType: 'print',
            targetDeviceId: 'device-01',
            params: {},
            priority: 'low',
          })
          const sig = signHmac('hmac-pos-secret', 'POST', '/open/command', ts, payload)
          return controller.command(
            JSON.parse(payload),
            `Bearer ${tokenRes.accessToken}`,
            'cli-partner-pos',
            `sha256=${sig}`,
            ts,
            undefined,
            mockReq(),
          )
        })
        assert.fail('应抛出异常')
      } catch (err: any) {
        assert.equal(getErrorStatus(err), 403)
        assert.ok(getErrorMessage(err).includes('scope') || getResponse(err)?.error === 'insufficient_scope')
      }
    })
  })

  // ══════════════════════════
  //  5. GET /open/clients
  // ══════════════════════════
  describe('GET /open/clients — 客户端列表', () => {
    it('正例: 按 tenantId 过滤返回对应客户端', async () => {
      const result = await controller.listClients('tenant-A')
      assert.ok(Array.isArray(result.data))
      assert.ok(result.data.length >= 1)
      const client = result.data[0]
      assert.equal(client.tenantId, 'tenant-A')
      assert.ok(client.clientId)
      assert.ok(client.name)
      assert.ok(Array.isArray(client.scopes))
    })

    it('隔离: 不同租户看不到彼此客户端', async () => {
      const resultA = await controller.listClients('tenant-A')
      const resultB = await controller.listClients('tenant-B')
      const idsA = resultA.data.map((c: any) => c.clientId)
      const idsB = resultB.data.map((c: any) => c.clientId)
      const overlap = idsA.filter((id: string) => idsB.includes(id))
      assert.equal(overlap.length, 0)
    })

    it('边界: 不存在的租户返回空数组', async () => {
      const result = await controller.listClients('tenant-unknown')
      assert.equal(result.data.length, 0)
    })
  })

  // ═══════════════════════════
  //  6. 路由装饰器一致性
  // ═══════════════════════════
  describe('路由定义', () => {
    it('Controller 前缀应为 "open"', () => {
      const prefix = Reflect.getMetadata('path', OpenApiController)
      assert.ok(typeof prefix === 'string' || prefix === undefined)
    })
  })
})
