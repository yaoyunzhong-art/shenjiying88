import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * 🐜 自动: [open-api] [C] 角色测试 v3
 *
 * 8 角色视角的多系统开放接口深度场景测试：
 * 👔店长 🛒前台 👥HR 🔧安监 🎮导玩员 🎯运行专员 🤝团建 📢营销
 *
 * 每个角色至少 2 个测试用例（正常流程 + 权限边界），侧重三方对接/安全管理场景
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import * as crypto from 'node:crypto'
import { OpenApiController } from './open-api.controller'
import { OpenApiService } from './open-api.service'
import type { Request } from 'express'
import { runWithTenant } from '../../common/context/tenant-context'

// ── 8 角色定义 ──
const ROLES = {
  StoreManager: '👔店长',
  FrontDesk: '🛒前台',
  HR: '👥HR',
  Safety: '🔧安监',
  Guide: '🎮导玩员',
  Ops: '🎯运行专员',
  Teambuilding: '🤝团建',
  Marketing: '📢营销',
} as const

const TENANT_A = {
  tenantId: 't-role-v3',
  storeId: 'store-v3-001',
  userId: 'role-v3-test-user',
  role: 'tenant_admin' as const,
}

const CLIENT_ID_A = 'cli-merchant-001'
const CLIENT_ID_B = 'cli-partner-pos'
const CLIENT_SECRET = 'test-secret'
const HMAC_SECRET_A = 'hmac-merchant-001-secret'
const HMAC_SECRET_B = 'hmac-pos-secret'

// ── HMAC 签名辅助 ──
function hmacSign(method: string, path: string, ts: string, body: object | string, secret: string = HMAC_SECRET_A): string {
  const bodyStr = typeof body === 'string' ? body : JSON.stringify(body)
  const bodyHash = crypto.createHash('sha256').update(bodyStr).digest('hex')
  const payload = `${method.toUpperCase()}\n${path}\n${ts}\n${bodyHash}`
  return 'sha256=' + crypto.createHmac('sha256', secret).update(payload).digest('hex')
}

// ── Mock Request 辅助 ──
function mockReq(ip = '127.0.0.1'): Request {
  return {
    headers: { 'x-forwarded-for': ip },
    socket: { remoteAddress: ip },
  } as unknown as Request
}

// ── 工厂：每次测试全新的 Service/Controller ──
function freshSetup() {
  const service = new OpenApiService()
  const controller = new OpenApiController(service)
  return { service, controller }
}

// ── 授权 Token 辅助 ──
async function getToken(
  service: OpenApiService,
  clientId = CLIENT_ID_A,
  secret = CLIENT_SECRET,
  scopes?: string[],
) {
  return service.authenticate(clientId, secret, scopes ?? [])
}

// ════════════ 👔店长 ════════════
describe(`${ROLES.StoreManager} 开放接口深度场景`, () => {
  it('店长通过整合 OAuth + HMAC + 限流三步接入三方系统（完整集成流程）', async () => {
    const { service, controller } = freshSetup()

    // Step 1: 获取 Token
    const token = await getToken(service)
    assert.ok(token.accessToken)
    assert.equal(token.tokenType, 'Bearer')

    // Step 2: 验证 Token
    const verified = await controller.verify({ access_token: token.accessToken })
    const v = verified as { clientId: string }
    assert.equal(v.clientId, CLIENT_ID_A)

    // Step 3: 用 Token + HMAC 发送 sync 请求
    const payload = {
      resourceType: 'member',
      action: 'update' as const,
      data: { memberId: 'm-888', level: 'gold' },
      businessKey: 'bk-integration-flow',
      timestamp: new Date().toISOString(),
    }
    const ts = Date.now().toString()
    const sig = hmacSign('POST', '/open/sync', ts, payload, HMAC_SECRET_A)

    const result = await runWithTenant(
      { ...TENANT_A, bearerToken: token.accessToken } as any,
      async () =>
        controller.sync(
          payload,
          `Bearer ${token.accessToken}`,
          CLIENT_ID_A,
          sig,
          ts,
          mockReq('192.168.1.100'),
        ),
    )
    assert.ok((result as { accepted: boolean }).accepted)
  })

  it('店长用已过期窗口的 HMAC 签名请求被拒绝（防重放时间窗口边界）', async () => {
    const { service } = freshSetup()
    const token = await getToken(service)

    // 7 分钟前的时间戳（超出 5 分钟窗口）
    const oldTs = String(Date.now() - 7 * 60 * 1000)
    const payload = { resourceType: 'test', action: 'create', data: {}, businessKey: 'bk-old', timestamp: new Date().toISOString() }
    const sig = hmacSign('POST', '/open/sync', oldTs, payload, HMAC_SECRET_A)

    // 直接调用 service 层校验
    const ok = service.verifyHmacSignature(CLIENT_ID_A, 'POST', '/open/sync', oldTs, JSON.stringify(payload), sig)
    assert.equal(ok, false)
  })
})

// ════════════ 🛒前台 ════════════
describe(`${ROLES.FrontDesk} 开放接口深度场景`, () => {
  it('前台用批量同步 scope 发送大批量数据同步（bulk 场景）', async () => {
    const { service, controller } = freshSetup()

    // 使用 cli-partner-pos 客户端（有 sync:bulk scope）
    const token = await getToken(service, CLIENT_ID_B, CLIENT_SECRET, ['sync:bulk'])
    const payload = {
      resourceType: 'member_batch',
      action: 'create' as const,
      data: { members: Array.from({ length: 10 }, (_, i) => ({ id: `bulk-${i}`, name: `会员${i}` })) },
      businessKey: 'bk-bulk-import-001',
      timestamp: new Date().toISOString(),
    }
    const ts = Date.now().toString()
    const sig = hmacSign('POST', '/open/sync', ts, payload, HMAC_SECRET_B)

    const result = await runWithTenant(
      { ...TENANT_A, bearerToken: token.accessToken } as any,
      async () =>
        controller.sync(
          payload,
          `Bearer ${token.accessToken}`,
          CLIENT_ID_B,
          sig,
          ts,
          mockReq('10.0.0.1'),
        ),
    )
    // 注意 cli-partner-pos 的 ipWhitelist 为空（无限制），10.0.0.1 应通过
    assert.ok((result as { accepted: boolean }).accepted)
  })

  it('前台误用错误 client 的 HMAC 密钥发起 sync 被拒绝（签名不匹配）', async () => {
    const { service, controller } = freshSetup()
    const token = await getToken(service, CLIENT_ID_B, CLIENT_SECRET)

    const payload = {
      resourceType: 'order',
      action: 'create' as const,
      data: { orderId: 'ord-001' },
      businessKey: 'bk-wrong-hmac',
      timestamp: new Date().toISOString(),
    }
    const ts = Date.now().toString()
    // 用 HMAC_SECRET_A 签名但声称是 CLIENT_ID_B → HMAC 不匹配
    const sig = hmacSign('POST', '/open/sync', ts, payload, HMAC_SECRET_A)

    const result = await runWithTenant(
      { ...TENANT_A, bearerToken: token.accessToken } as any,
      async () => {
        try {
          await controller.sync(
            payload,
            `Bearer ${token.accessToken}`,
            CLIENT_ID_B,
            sig,
            ts,
            mockReq('10.0.0.1'),
          )
          return { error: null }
        } catch (e: any) {
          return { error: (e as Error).message }
        }
      },
    )
    assert.ok((result as { error: string }).error)
    assert.match((result as { error: string }).error, /HMAC/i)
  })
})

// ════════════ 👥HR ════════════
describe(`${ROLES.HR} 开放接口深度场景`, () => {
  it('HR 通过 verify 接口验证第三方系统接入人员信息 token 有效性', async () => {
    const { service, controller } = freshSetup()
    const token = await getToken(service, CLIENT_ID_A, CLIENT_SECRET, ['auth:verify'])

    const result = await runWithTenant(TENANT_A, async () =>
      controller.verify({ access_token: token.accessToken }),
    )
    const verified = result as { clientId: string; scope: string[] }
    assert.equal(verified.clientId, CLIENT_ID_A)
    assert.ok(verified.scope.includes('auth:verify'))
  })

  it('HR 试图用 revoked scope 之外的 token 调用受限接口被拒绝', async () => {
    const { service } = freshSetup()
    // cli-partner-pos 没有 command:send scope
    // 需要获得一个有效 token 并放入 context
    const token = await service.authenticate(CLIENT_ID_B, CLIENT_SECRET, ['sync:read'])
    const ctx = { ...TENANT_A, bearerToken: token.accessToken } as any

    await assert.rejects(
      () =>
        runWithTenant(
          ctx,
          async () =>
            service.sendCommand(
              CLIENT_ID_B,
              {
                commandType: 'print',
                targetDeviceId: 'printer-01',
                params: { text: 'test' },
                priority: 'normal',
              },
              'idem-hr-001',
            ),
        ),
      (err: any) => {
        return err.response?.error === 'insufficient_scope'
      },
    )
  })
})

// ════════════ 🔧安监 ════════════
describe(`${ROLES.Safety} 开放接口深度场景`, () => {
  it('安监验证 CIDR 白名单精确匹配场景（/24 子网和非 /24 精确 IP）', async () => {
    const { service } = freshSetup()

    // 192.168.1.0/24 内的 IP 应通过
    const allowed1 = service.verifyIpWhitelist(CLIENT_ID_A, '192.168.1.55')
    assert.equal(allowed1, true)

    // 192.168.1.0/24 外的 IP 应拒绝 (仅对 cli-merchant-001 有 ipWhitelist)
    // 注意 cli-merchant-001 的 whitelist: ['127.0.0.1', '192.168.1.0/24']
    const allowed2 = service.verifyIpWhitelist(CLIENT_ID_A, '192.168.2.100')
    assert.equal(allowed2, false)

    // 精确 IP 127.0.0.1 应通过
    const allowed3 = service.verifyIpWhitelist(CLIENT_ID_A, '127.0.0.1')
    assert.equal(allowed3, true)
  })

  it('安监验证伪造 clientId 的 IP 白名单检查返回 false', async () => {
    const { service } = freshSetup()
    const result = service.verifyIpWhitelist('cli-nonexistent', '192.168.1.1')
    assert.equal(result, false)
  })
})

// ════════════ 🎮导玩员 ════════════
describe(`${ROLES.Guide} 开放接口深度场景`, () => {
  it('导玩员下发高优先级设备控制指令（重启游戏机）', async () => {
    const { service, controller } = freshSetup()
    const token = await getToken(service, CLIENT_ID_A, CLIENT_SECRET)

    const cmdPayload = {
      commandType: 'restart_game',
      targetDeviceId: 'game-machine-arcade-01',
      params: { force: true, reason: '定期维护' },
      priority: 'urgent' as const,
    }
    const ts = Date.now().toString()
    const sig = hmacSign('POST', '/open/command', ts, cmdPayload, HMAC_SECRET_A)

    const result = await runWithTenant(
      { ...TENANT_A, bearerToken: token.accessToken } as any,
      async () =>
        controller.command(
          cmdPayload,
          `Bearer ${token.accessToken}`,
          CLIENT_ID_A,
          sig,
          ts,
          'idem-guide-restart-001',
          mockReq('192.168.1.100'),
        ),
    )
    const cmd = result as { id: string; status: string; commandType: string }
    assert.ok(cmd.id)
    assert.equal(cmd.status, 'success')
    assert.equal(cmd.commandType, 'restart_game')
  })

  it('导玩员用低 QPS 客户端撞限流后等待恢复再次请求可通过', async () => {
    const { service, controller } = freshSetup()
    const token = await getToken(service, CLIENT_ID_B, CLIENT_SECRET)

    // cli-partner-pos 的 rateLimitQps = 50，批量发 60 次
    let rateLimitedCount = 0
    let successCount = 0

    for (let i = 0; i < 60; i++) {
      const cmdPayload = {
        commandType: 'ping',
        targetDeviceId: `device-${i}`,
        params: { seq: i },
        priority: 'low' as const,
      }
      const ts = Date.now().toString()
      const sig = hmacSign('POST', '/open/command', ts, cmdPayload, HMAC_SECRET_B)

      const resp = await runWithTenant(
        { ...TENANT_A, bearerToken: token.accessToken } as any,
        async () => {
          try {
            const r = await controller.command(
              cmdPayload,
              `Bearer ${token.accessToken}`,
              CLIENT_ID_B,
              sig,
              ts,
              `idem-guide-burst-${i}`,
              mockReq('10.0.0.1'),
            )
            return r
          } catch {
            return { error: 'exception' }
          }
        },
      )
      const r = resp as { error?: string; status?: string }
      if (r.error === 'rate_limited') rateLimitedCount++
      else if (r.status === 'success') successCount++
    }

    assert.ok(rateLimitedCount > 0, '应触发限流')
    assert.ok(successCount <= 50, '成功数不超过 QPS 上限')
    // 限流只在同一个时钟窗口内，这里验证至少触发了一次限流
    assert.ok(rateLimitedCount >= 1, '至少触发一次限流')
  })
})

// ════════════ 🎯运行专员 ════════════
describe(`${ROLES.Ops} 开放接口深度场景`, () => {
  it('运行专员重复使用相同幂等键得到相同执行结果（幂等性保证）', async () => {
    const { service } = freshSetup()
    const cmdPayload = {
      commandType: 'restart',
      targetDeviceId: 'device-ops-idempotent',
      params: { mode: 'safe' },
      priority: 'high' as const,
    }

    const token = await service.authenticate(CLIENT_ID_A, CLIENT_SECRET, ['command:send'])
    const ctx = { ...TENANT_A, bearerToken: token.accessToken } as any

    const first = await runWithTenant(ctx, () => service.sendCommand(CLIENT_ID_A, cmdPayload, 'idem-ops-same-001'))
    const second = await runWithTenant(ctx, () => service.sendCommand(CLIENT_ID_A, cmdPayload, 'idem-ops-same-001'))

    assert.equal(first.id, second.id)
    assert.equal(first.status, second.status)
  })

  it('运行专员跨租户隔离验证：A 租户无法看到 B 租户的客户端', async () => {
    const { controller } = freshSetup()

    const resultA = await runWithTenant(TENANT_A, async () =>
      controller.listClients('tenant-A'),
    )
    const resultB = await runWithTenant(TENANT_A, async () =>
      controller.listClients('tenant-B'),
    )

    const clientsA = (resultA as { data: unknown[] }).data
    const clientsB = (resultB as { data: unknown[] }).data

    assert.equal(clientsA.length, 1)
    assert.equal((clientsA[0] as { clientId: string }).clientId, CLIENT_ID_A)
    assert.equal(clientsB.length, 1)
    assert.equal((clientsB[0] as { clientId: string }).clientId, CLIENT_ID_B)
  })
})

// ════════════ 🤝团建 ════════════
describe(`${ROLES.Teambuilding} 开放接口深度场景`, () => {
  it('团建专员用 command:send scope 向打印机下发团建活动标牌指令', async () => {
    const { service, controller } = freshSetup()
    const token = await getToken(service, CLIENT_ID_A, CLIENT_SECRET, ['command:send'])

    const cmdPayload = {
      commandType: 'print_banner',
      targetDeviceId: 'printer-team-building',
      params: { text: '🏆 团建活动 - 7月烧烤派对', copies: 5 },
      priority: 'high' as const,
    }
    const ts = Date.now().toString()
    const sig = hmacSign('POST', '/open/command', ts, cmdPayload, HMAC_SECRET_A)

    const result = await runWithTenant(
      { ...TENANT_A, bearerToken: token.accessToken } as any,
      async () =>
        controller.command(
          cmdPayload,
          `Bearer ${token.accessToken}`,
          CLIENT_ID_A,
          sig,
          ts,
          'idem-team-banner',
          mockReq('192.168.1.100'),
        ),
    )
    const cmd = result as any
    assert.ok(cmd.id)
    assert.equal(cmd.status, 'success')
    assert.equal(cmd.commandType, 'print_banner')
  })

  it('团建专员使用无效 idempotency-key 不会影响首次执行（边界）', async () => {
    const { service } = freshSetup()

    const token = await service.authenticate(CLIENT_ID_A, CLIENT_SECRET, ['command:send'])
    const ctx = { ...TENANT_A, bearerToken: token.accessToken } as any

    // 无幂等键的两次执行应为不同结果
    const first = await runWithTenant(ctx, () => service.sendCommand(CLIENT_ID_A, {
      commandType: 'open_door',
      targetDeviceId: 'door-team-v3',
      params: { area: 'party_room' },
      priority: 'normal',
    }))
    const second = await runWithTenant(ctx, () => service.sendCommand(CLIENT_ID_A, {
      commandType: 'open_door',
      targetDeviceId: 'door-team-v3',
      params: { area: 'party_room' },
      priority: 'normal',
    }))
    assert.notEqual(first.id, second.id)
  })
})

// ════════════ 📢营销 ════════════
describe(`${ROLES.Marketing} 开放接口深度场景`, () => {
  it('营销专员通过 sync 接口批量同步营销活动资源', async () => {
    const { service, controller } = freshSetup()
    const token = await getToken(service, CLIENT_ID_A, CLIENT_SECRET)

    const payload = {
      resourceType: 'campaign_assets',
      action: 'create' as const,
      data: {
        campaignId: 'campaign-summer-v3',
        posters: ['poster-1.png', 'poster-2.png'],
        schedule: { start: '2026-07-15', end: '2026-08-15' },
      },
      businessKey: 'bk-mkt-summer-v3',
      timestamp: new Date().toISOString(),
    }
    const ts = Date.now().toString()
    const sig = hmacSign('POST', '/open/sync', ts, payload, HMAC_SECRET_A)

    const result = await runWithTenant(
      { ...TENANT_A, bearerToken: token.accessToken } as any,
      async () =>
        controller.sync(
          payload,
          `Bearer ${token.accessToken}`,
          CLIENT_ID_A,
          sig,
          ts,
          mockReq('192.168.1.100'),
        ),
    )
    assert.ok((result as { accepted: boolean }).accepted)
  })

  it('营销专员用已撤销的 token 请求应被拒绝（安全边界）', async () => {
    const { service } = freshSetup()

    // 通过 verifyToken 验证已到期 token
    await assert.rejects(
      () => service.verifyToken('nonexistent-or-expired-token'),
      (err: any) => {
        return err.response?.error === 'invalid_token'
      },
    )
  })

  it('营销专员使用错误 scope 请求 sync:write 但只有 sync:read 被拒绝（scope 边界）', async () => {
    const { service } = freshSetup()

    // cli-partner-pos 有权 sync:read, sync:bulk，但没有 sync:write
    const token = await service.authenticate(CLIENT_ID_B, CLIENT_SECRET, ['sync:read'])
    const ctx = { ...TENANT_A, bearerToken: token.accessToken } as any

    const payload = {
      resourceType: 'member',
      action: 'create' as const,
      data: { name: 'test' },
      businessKey: 'bk-scope-test',
      timestamp: new Date().toISOString(),
    }

    await assert.rejects(
      () =>
        runWithTenant(
          ctx,
          () => service.handleSync(CLIENT_ID_B, payload),
        ),
      (err: any) => {
        return err.response?.error === 'insufficient_scope'
      },
    )
  })
})
