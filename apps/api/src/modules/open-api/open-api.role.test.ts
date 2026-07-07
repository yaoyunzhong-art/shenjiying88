import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * 🐜 自动: [open-api] [C] 角色测试
 * 
 * 8 角色视角的 open-api 模块测试：
 * 👔店长 🛒前台 👥HR 🔧安监 🎮导玩员 🎯运行专员 🤝团建 📢营销
 * 
 * 每个角色至少 2 个测试用例（正常流程 + 权限边界）
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import * as crypto from 'node:crypto'
import { OpenApiController } from './open-api.controller'
import { OpenApiService } from './open-api.service'
import type { Request } from 'express'
import { runWithTenant } from '../../common/context/tenant-context'

// ── 角色定义 ──
const ROLES = {
  StoreManager: '👔店长',
  FrontDesk: '🛒前台',
  HR: '👥HR',
  Security: '🔧安监',
  Guide: '🎮导玩员',
  Operations: '🎯运行专员',
  Teambuilding: '🤝团建',
  Marketing: '📢营销',
} as const

const TENANT = {
  tenantId: 't-role-test',
  storeId: 'store-001',
  userId: 'role-test-user',
  role: 'tenant_admin' as const,
}

const CLIENT_ID = 'cli-merchant-001'
const CLIENT_SECRET = 'test-secret'
const HMAC_SECRET = 'hmac-merchant-001-secret'

// ── HMAC 签名辅助函数 ──
function hmacSign(method: string, path: string, ts: string, body: object | string): string {
  const bodyStr = typeof body === 'string' ? body : JSON.stringify(body)
  const bodyHash = crypto.createHash('sha256').update(bodyStr).digest('hex')
  const payload = `${method.toUpperCase()}\n${path}\n${ts}\n${bodyHash}`
  return 'sha256=' + crypto.createHmac('sha256', HMAC_SECRET).update(payload).digest('hex')
}

// ── Mock 辅助 ──
function mockReq(ip = '127.0.0.1'): Request {
  return {
    headers: { 'x-forwarded-for': ip },
    socket: { remoteAddress: ip },
  } as unknown as Request
}

// ── 测试夹具 ──
function freshService() {
  return new OpenApiService()
}

// ── 👔店长 ──
describe(`${ROLES.StoreManager} open-api 角色测试`, () => {
  it('店长通过开放接口查询已注册的客户端列表（运营管理）', async () => {
    const ctrl = new OpenApiController(freshService())

    const result = await runWithTenant(TENANT, async () =>
      ctrl.listClients('tenant-A'),
    )
    const clients = (result as { data: unknown[] }).data

    assert.ok(Array.isArray(clients))
    assert.equal(clients.length, 1)
    const client = clients[0] as { clientId: string; name: string; status: string }
    assert.equal(client.clientId, 'cli-merchant-001')
    assert.equal(client.status, 'active')
  })

  it('店长尝试用错误密钥获取 token 应被拒绝（权限边界）', async () => {
    const ctrl = new OpenApiController(freshService())
    const req = mockReq('127.0.0.1')

    await assert.rejects(
      () =>
        runWithTenant(TENANT, async () =>
          ctrl.authenticate(
            { client_id: CLIENT_ID, client_secret: 'wrong-secret' },
            req,
          ),
        ),
      (err: any) => {
        return err.response?.error === 'invalid_client'
      },
    )
  })
})

// ── 🛒前台 ──
describe(`${ROLES.FrontDesk} open-api 角色测试`, () => {
  it('前台通过 OAuth 获取 token 后调用 sync 同步数据', async () => {
    const service = freshService()
    const ctrl = new OpenApiController(service)

    const tokenResp = await service.authenticate(CLIENT_ID, CLIENT_SECRET, [])
    const syncPayload = {
      resourceType: 'member',
      action: 'create' as const,
      data: { name: '张三', phone: '13800138000' },
      businessKey: 'bk-001',
      timestamp: new Date().toISOString(),
    }
    const ts = Date.now().toString()
    const sig = hmacSign('POST', '/open/sync', ts, syncPayload)

    const result = await runWithTenant(
      { ...TENANT, bearerToken: tokenResp.accessToken } as any,
      async () => {
        return ctrl.sync(
          syncPayload,
          `Bearer ${tokenResp.accessToken}`,
          CLIENT_ID,
          sig,
          ts,
          mockReq('192.168.1.100'),
        )
      },
    )
    assert.ok((result as { accepted: boolean }).accepted)
  })

  it('前台使用 IP 不在白名单的客户端认证应被拒绝（权限边界）', async () => {
    const ctrl = new OpenApiController(freshService())

    await assert.rejects(
      () =>
        runWithTenant(TENANT, async () =>
          ctrl.authenticate(
            { client_id: CLIENT_ID, client_secret: CLIENT_SECRET },
            mockReq('10.0.0.99'),
          ),
        ),
      (err: any) => String(err).includes('IP not whitelisted'),
    )
  })
})

// ── 👥HR ──
describe(`${ROLES.HR} open-api 角色测试`, () => {
  it('HR 验证开放 API 返回的 token 有效性（员工管理对接）', async () => {
    const service = freshService()
    const ctrl = new OpenApiController(service)

    const result = await runWithTenant(TENANT, async () => {
      const tokenResp = await ctrl.authenticate(
        { client_id: CLIENT_ID, client_secret: CLIENT_SECRET },
        mockReq('192.168.1.50'),
      ) as { accessToken: string }

      const verifyResp = await ctrl.verify({ access_token: tokenResp.accessToken })
      const verified = verifyResp as { accessToken: string; clientId: string }
      assert.equal(verified.clientId, CLIENT_ID)
      return verified
    })
    assert.ok(result)
  })

  it('HR 验证伪造的 token 应报错（权限边界）', async () => {
    const ctrl = new OpenApiController(freshService())

    await assert.rejects(
      () =>
        runWithTenant(TENANT, async () =>
          ctrl.verify({ access_token: 'fake-token-12345' }),
        ),
      (err: any) => err.response?.error === 'invalid_token',
    )
  })
})

// ── 🔧安监 ──
describe(`${ROLES.Security} open-api 角色测试`, () => {
  it('安监验证 HMAC 签名错误的请求被正确拦截', async () => {
    const service = freshService()

    const verified = service.verifyHmacSignature(
      CLIENT_ID,
      'POST',
      '/open/sync',
      String(Date.now()),
      '{"test":true}',
      'sha256=invalid_wrong_signature',
    )
    assert.equal(verified, false)
  })

  it('安监校验时间戳超出 5 分钟窗口的请求被拒绝（防重放）', async () => {
    const service = freshService()
    const sixMinAgo = String(Date.now() - 6 * 60 * 1000)

    const verified = service.verifyHmacSignature(
      CLIENT_ID,
      'POST',
      '/open/sync',
      sixMinAgo,
      '{}',
      'sha256=whatever',
    )
    assert.equal(verified, false)
  })
})

// ── 🎮导玩员 ──
describe(`${ROLES.Guide} open-api 角色测试`, () => {
  it('导玩员通过开放 API 向设备下发指令（操控设备）', async () => {
    const service = freshService()
    const ctrl = new OpenApiController(service)

    const result = await runWithTenant(TENANT, async () => {
      const tokenResp = await service.authenticate(CLIENT_ID, CLIENT_SECRET, [])
      // 要通过 tenantContext 设置 bearerToken
      return await runWithTenant(
        { ...TENANT, bearerToken: tokenResp.accessToken } as any,
        async () => {
          const cmdPayload = {
            commandType: 'reboot',
            targetDeviceId: 'device-game-01',
            params: { reason: 'routine_reset' },
            priority: 'normal' as const,
          }
          const ts = Date.now().toString()
          const sig = hmacSign('POST', '/open/command', ts, cmdPayload)

          const cmdResp = await ctrl.command(
            cmdPayload,
            `Bearer ${tokenResp.accessToken}`,
            CLIENT_ID,
            sig,
            ts,
            'idem-001',
            mockReq('192.168.1.100'),
          )
          return cmdResp
        },
      )
    })

    const cmd = result as { id: string; status: string; commandType: string }
    assert.ok(cmd.id)
    assert.equal(cmd.status, 'success')
    assert.equal(cmd.commandType, 'reboot')
  })

  it('导玩员下发指令超出限频 QPS 上限应返回 rate_limited（边界）', async () => {
    const service = freshService()
    const ctrl = new OpenApiController(service)

    const tokenResp = await service.authenticate(CLIENT_ID, CLIENT_SECRET, [])

    const rateLimited = await runWithTenant(
      { ...TENANT, bearerToken: tokenResp.accessToken } as any,
      async () => {
        for (let i = 0; i < 105; i++) {
          const ts = Date.now().toString()
          const cmdPayload = {
            commandType: 'ping',
            targetDeviceId: 'device-99',
            params: {},
            priority: 'low' as const,
          }
          const sig = hmacSign('POST', '/open/command', ts, cmdPayload)

          const resp = await ctrl.command(
            cmdPayload,
            `Bearer ${tokenResp.accessToken}`,
            CLIENT_ID,
            sig,
            ts,
            `idem-burst-${i}`,
            mockReq('192.168.1.100'),
          ) as { error?: string }
          if (resp.error === 'rate_limited') return true
        }
        return false
      },
    )

    assert.ok(rateLimited, '应触发限流')
  })
})

// ── 🎯运行专员 ──
describe(`${ROLES.Operations} open-api 角色测试`, () => {
  it('运行专员通过幂等键重复提交指令应返回相同结果', async () => {
    const service = freshService()
    const ctrl = new OpenApiController(service)

    const tokenResp = await service.authenticate(CLIENT_ID, CLIENT_SECRET, [])

    const result = await runWithTenant(
      { ...TENANT, bearerToken: tokenResp.accessToken } as any,
      async () => {
        const cmdPayload = {
          commandType: 'open_door',
          targetDeviceId: 'device-door-01',
          params: {},
          priority: 'high' as const,
        }
        const ts1 = Date.now().toString()
        const sig1 = hmacSign('POST', '/open/command', ts1, cmdPayload)

        const first = await ctrl.command(
          cmdPayload,
          `Bearer ${tokenResp.accessToken}`,
          CLIENT_ID,
          sig1,
          ts1,
          'idem-same-key-001',
          mockReq('192.168.1.100'),
        ) as { id: string }

        const ts2 = Date.now().toString()
        const sig2 = hmacSign('POST', '/open/command', ts2, cmdPayload)

        const second = await ctrl.command(
          cmdPayload,
          `Bearer ${tokenResp.accessToken}`,
          CLIENT_ID,
          sig2,
          ts2,
          'idem-same-key-001',
          mockReq('192.168.1.100'),
        ) as { id: string }

        assert.equal(first.id, second.id)
        return { first, second }
      },
    )
    assert.ok(result)
  })

  it('运行专员操作已暂停的客户端应被拒绝（权限边界）', async () => {
    const service = freshService()
    const client = service.getClient(CLIENT_ID)
    const originalStatus = client!.status
    ;(client as any).status = 'suspended'

    try {
      await assert.rejects(
        () => service.authenticate(CLIENT_ID, CLIENT_SECRET, ['sync:read']),
        (err: any) => {
          return err.response?.error === 'invalid_client'
        },
      )
    } finally {
      ;(client as any).status = originalStatus
    }
  })
})

// ── 🤝团建 ──
describe(`${ROLES.Teambuilding} open-api 角色测试`, () => {
  it('团建专员调用 OAuth 认证获取有效的 Bearer token', async () => {
    const service = freshService()
    const ctrl = new OpenApiController(service)

    const result = await runWithTenant(TENANT, async () =>
      ctrl.authenticate(
        { client_id: CLIENT_ID, client_secret: CLIENT_SECRET, scope: 'sync:read command:send' },
        mockReq('192.168.1.50'),
      ),
    )
    const token = result as { accessToken: string; tokenType: string; expiresIn: number; scope: string[] }
    assert.ok(typeof token.accessToken === 'string' && token.accessToken.length > 0)
    assert.equal(token.tokenType, 'Bearer')
    assert.ok(token.expiresIn >= 3600)
    assert.ok(token.scope.includes('sync:read'))
    assert.ok(token.scope.includes('command:send'))
  })

  it('团建专员请求不允许的 scope 应被拒绝（权限边界）', async () => {
    const service = freshService()

    await assert.rejects(
      () => service.authenticate('cli-partner-pos', 'test-secret', ['command:send']),
      (err: any) => err.response?.error === 'invalid_scope',
    )
  })
})

// ── 📢营销 ──
describe(`${ROLES.Marketing} open-api 角色测试`, () => {
  it('营销专员通过同步接口批量同步活动数据', async () => {
    const service = freshService()
    const ctrl = new OpenApiController(service)

    const tokenResp = await service.authenticate(CLIENT_ID, CLIENT_SECRET, [])
    const payload = {
      resourceType: 'campaign',
      action: 'create' as const,
      data: { campaignName: '夏日促销', budget: 5000, startDate: '2026-07-01' },
      businessKey: 'campaign-summer-2026',
      timestamp: new Date().toISOString(),
    }
    const ts = Date.now().toString()
    const sig = hmacSign('POST', '/open/sync', ts, payload)

    const result = await runWithTenant(
      { ...TENANT, bearerToken: tokenResp.accessToken } as any,
      async () =>
        ctrl.sync(
          payload,
          `Bearer ${tokenResp.accessToken}`,
          CLIENT_ID,
          sig,
          ts,
          mockReq('192.168.1.100'),
        ),
    )
    assert.ok((result as { accepted: boolean }).accepted)
  })

  it('营销专员查询不同租户客户端应隔离（权限边界）', async () => {
    const ctrl = new OpenApiController(freshService())

    const result = await runWithTenant(TENANT, async () =>
      ctrl.listClients('tenant-B'),
    )
    const clients = (result as { data: unknown[] }).data

    assert.ok(Array.isArray(clients))
    assert.equal(clients.length, 1)
    const client = clients[0] as { clientId: string; name: string }
    assert.equal(client.clientId, 'cli-partner-pos')
  })
})
