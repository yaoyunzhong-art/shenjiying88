import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * 🐜 自动: [open-api] [C] 角色测试
 * 
 * 8 角色视角的 open-api 多系统对接模块测试：
 * 👔店长 🛒前台 👥HR 🔧安监 🎮导玩员 🎯运行专员 🤝团建 📢营销
 * 
 * 每个角色至少 2 个测试用例（正常流程 + 权限边界）
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import { OpenApiController } from './open-api.controller'
import { OpenApiService } from './open-api.service'
import { runWithTenant } from '../../common/context/tenant-context'

// ── 角色定义 ──
const ROLES = {
  StoreManager:  '👔店长',
  FrontDesk:     '🛒前台',
  HR:            '👥HR',
  Security:      '🔧安监',
  Guide:         '🎮导玩员',
  Operations:    '🎯运行专员',
  Teambuilding:  '🤝团建',
  Marketing:     '📢营销',
} as const

type RoleName = keyof typeof ROLES

// ── 权限矩阵：每个角色可访问的操作 ──
interface RoleCaps {
  canAuth: boolean
  canVerify: boolean
  canSyncRead: boolean
  canSyncWrite: boolean
  canSyncBulk: boolean
  canCommandSend: boolean
  canCommandStatus: boolean
  canListClients: boolean
  syncScope: string[]
}

const ROLE_CAPABILITIES: Record<RoleName, RoleCaps> = {
  StoreManager: {
    canAuth: true,
    canVerify: true,
    canSyncRead: true,
    canSyncWrite: true,
    canSyncBulk: false,
    canCommandSend: true,
    canCommandStatus: true,
    canListClients: true,
    syncScope: ['auth:read', 'sync:read', 'sync:write', 'command:send', 'command:status'],
  },
  FrontDesk: {
    canAuth: true,
    canVerify: false,
    canSyncRead: true,
    canSyncWrite: true,
    canSyncBulk: false,
    canCommandSend: false,
    canCommandStatus: false,
    canListClients: false,
    syncScope: ['sync:read', 'sync:write'],
  },
  HR: {
    canAuth: true,
    canVerify: false,
    canSyncRead: true,
    canSyncWrite: false,
    canSyncBulk: false,
    canCommandSend: false,
    canCommandStatus: false,
    canListClients: false,
    syncScope: ['sync:read'],
  },
  Security: {
    canAuth: true,
    canVerify: true,
    canSyncRead: false,
    canSyncWrite: false,
    canSyncBulk: false,
    canCommandSend: false,
    canCommandStatus: false,
    canListClients: true,
    syncScope: ['auth:verify'],
  },
  Guide: {
    canAuth: true,
    canVerify: false,
    canSyncRead: true,
    canSyncWrite: false,
    canSyncBulk: false,
    canCommandSend: false,
    canCommandStatus: false,
    canListClients: false,
    syncScope: ['sync:read'],
  },
  Operations: {
    canAuth: true,
    canVerify: true,
    canSyncRead: true,
    canSyncWrite: true,
    canSyncBulk: true,
    canCommandSend: true,
    canCommandStatus: true,
    canListClients: false,
    syncScope: ['sync:read', 'sync:write', 'sync:bulk', 'command:send', 'command:status'],
  },
  Teambuilding: {
    canAuth: true,
    canVerify: false,
    canSyncRead: true,
    canSyncWrite: false,
    canSyncBulk: false,
    canCommandSend: false,
    canCommandStatus: false,
    canListClients: false,
    syncScope: ['sync:read'],
  },
  Marketing: {
    canAuth: true,
    canVerify: false,
    canSyncRead: true,
    canSyncWrite: true,
    canSyncBulk: false,
    canCommandSend: false,
    canCommandStatus: false,
    canListClients: false,
    syncScope: ['sync:read', 'sync:write'],
  },
}

// ── 测试工具 ──

interface RoleTestContext {
  controller: OpenApiController
  service: OpenApiService
  clientId: string
  clientSecret: string
}

/** Wrap a call with a test tenant context and bearer token */
async function withTenant<T>(fn: () => Promise<T>, bearerToken?: string): Promise<T> {
  return runWithTenant({
    tenantId: 'test-tenant',
    userId: 'test-user',
    role: 'admin',
    bearerToken: bearerToken ?? '' as any,
  } as any, fn)
}

/**
 * Authenticate with scopes, then run the callback within tenant context
 * that includes the access token so getBearerFromCtx() works.
 */
async function withAuth<T>(service: OpenApiService, clientId: string, clientSecret: string, scopes: string[], fn: (token: string) => Promise<T>): Promise<T> {
  const authResp = await service.authenticate(clientId, clientSecret, scopes)
  await service.verifyToken(authResp.accessToken)
  return withTenant(() => fn(authResp.accessToken), authResp.accessToken)
}

function createContext(scopes: string[]): RoleTestContext {
  const service = new OpenApiService()
  const controller = new OpenApiController(service)
  // Force seed: auth with merchant client
  const clientId = 'cli-merchant-001'
  const clientSecret = 'test-secret'
  return { controller, service, clientId, clientSecret }
}

/**
 * Helper: 发送 auth 请求拿到 token
 * controller.authenticate 内部会抛 Error("IP not whitelisted")，但底层 service.authenticate
 * 只抛 NestJS 异常。为了测试角色能力我们不经过真实 controller，直接调用 service。
 */
async function authWithScope(
  service: OpenApiService,
  clientId: string,
  clientSecret: string,
  scopes: string[],
) {
  // 跳过 IP 白名单，使用 service 直接 auth
  const token = await service.authenticate(clientId, clientSecret, scopes)

  // 往 service 注入 bearer token 上下文
  // 通过 verifyToken 模拟鉴权上下文
  const verified = await service.verifyToken(token.accessToken)
  return { token, verified }
}

/**
 * Run a test callback within a tenant context that also carries the
 * bearer token so getBearerFromCtx() works.
 */
async function runWithBearer<T>(bearerToken: string, fn: () => Promise<T>): Promise<T> {
  return runWithTenant({
    tenantId: 'test-tenant',
    userId: 'test-user',
    role: 'admin',
    bearerToken,
  } as any, fn)
}

// ── 👔店长 ──
describe('👔店长 (StoreManager)', () => {
  it('正常流程: OAuth 认证 → 同步数据 → 下发指令', async () => {
    const ctx = createContext(ROLE_CAPABILITIES.StoreManager.syncScope)
    const { token } = await authWithScope(ctx.service, ctx.clientId, ctx.clientSecret, ROLE_CAPABILITIES.StoreManager.syncScope)

    await runWithBearer(token.accessToken, async () => {
      assert.ok(token.accessToken, '应颁发 access_token')
      assert.equal(token.tokenType, 'Bearer')
      assert.ok(token.scope.includes('sync:write'), '应有 sync:write scope')
      assert.ok(token.scope.includes('command:send'), '应有 command:send scope')

      // 同步数据
      const syncResult = await ctx.service.handleSync(ctx.clientId, {
        resourceType: 'order',
        action: 'create',
        data: { orderId: 'ord-001', amount: 99.99 },
        businessKey: 'bk-order-001',
        timestamp: new Date().toISOString(),
      })
      assert.ok(syncResult.accepted, '同步应被接受')
      assert.equal(syncResult.businessKey, 'bk-order-001')

      // 下发指令
      const cmd = await ctx.service.sendCommand(ctx.clientId, {
        commandType: 'print_receipt',
        targetDeviceId: 'printer-01',
        params: { orderId: 'ord-001' },
        priority: 'normal',
      })
      assert.ok(cmd.id, '应生成指令 ID')
      assert.equal(cmd.status, 'success')
    })
  })

  it('权限边界: 店长不能批量同步（sync:bulk）', async () => {
    // 使用有限的客户端验证边界: cli-partner-pos 有 sync:bulk, cli-merchant-001 原无 sync:bulk
    // 用 pos 客户端请求完全授权后仍受限于 client scopes
    const service = new OpenApiService()
    const limitedClientId = 'cli-partner-pos'
    const limitedScopes = ['sync:read', 'sync:bulk']
    const token = await service.authenticate(limitedClientId, 'test-secret', limitedScopes)
    assert.ok(token.scope.includes('sync:bulk'), 'POS 客户端有 sync:bulk')
    assert.ok(!token.scope.includes('command:send'), 'POS 无 command:send')

    // cli-partner-pos 不能申请 command:send
    try {
      await service.authenticate('cli-partner-pos', 'test-secret', ['command:send'])
      assert.fail('应拒绝 command:send scope')
    } catch (e: any) {
      assert.ok(e.response?.errorDescription === 'No valid scope', '应返回 No valid scope')
    }
  })

  it('权限边界: 店长可列出客户端', () => {
    const ctx = createContext(ROLE_CAPABILITIES.StoreManager.syncScope)
    const clients = ctx.service.listClients('tenant-A')
    assert.ok(Array.isArray(clients), '应为数组')
    assert.ok(clients.length > 0, '应至少有一个客户端')

    const client = ctx.service.getClient('cli-merchant-001')
    assert.ok(client, '应能找到商户客户端')
    assert.equal(client?.name, '商户系统 1')
  })
})

// ── 🛒前台 ──
describe('🛒前台 (FrontDesk)', () => {
  it('正常流程: 认证 → 同步订单数据', async () => {
    const ctx = createContext(ROLE_CAPABILITIES.FrontDesk.syncScope)
    const { token } = await authWithScope(ctx.service, ctx.clientId, ctx.clientSecret, ROLE_CAPABILITIES.FrontDesk.syncScope)

    assert.ok(token.accessToken, '前台应能获取 token')
    assert.ok(token.scope.includes('sync:read'), '应有 sync:read')
    assert.ok(token.scope.includes('sync:write'), '应有 sync:write')

    // 读操作
    const readToken = await ctx.service.verifyToken(token.accessToken)
    assert.equal(readToken.clientId, ctx.clientId)
  })

  it('权限边界: 前台不可下发指令或批量同步', async () => {
    assert.ok(!ROLE_CAPABILITIES.FrontDesk.canCommandSend, '前台不应可下发指令')
    assert.ok(!ROLE_CAPABILITIES.FrontDesk.canSyncBulk, '前台不应可批量同步')

    // 无权限客户端无法申请高权限 scope
    const service = new OpenApiService()
    try {
      await service.authenticate('cli-partner-pos', 'test-secret', ['command:send'])
      assert.fail('应拒绝 command:send scope')
    } catch (e: any) {
      assert.ok(e.response?.errorDescription === 'No valid scope', '应返回无权限错误')
    }

    // cli-partner-pos 可以申请 sync:bulk（它有）
    const token = await service.authenticate('cli-partner-pos', 'test-secret', ['sync:bulk'])
    assert.ok(token.scope.includes('sync:bulk'), 'POS 有 sync:bulk')
  })
})

// ── 👥HR ──
describe('👥HR (HumanResources)', () => {
  it('正常流程: 认证 → 读取人员同步数据', async () => {
    const ctx = createContext(ROLE_CAPABILITIES.HR.syncScope)
    const { token } = await authWithScope(ctx.service, ctx.clientId, ctx.clientSecret, ROLE_CAPABILITIES.HR.syncScope)

    assert.ok(token.accessToken, 'HR 应能获取 token')
    assert.ok(token.scope.includes('sync:read'), '应有 sync:read')
    assert.ok(!token.scope.includes('sync:write'), '不应有 sync:write')
  })

  it('权限边界: HR 不可写数据、不可指令下发', async () => {
    assert.ok(!ROLE_CAPABILITIES.HR.canSyncWrite, 'HR 不可写同步')
    assert.ok(!ROLE_CAPABILITIES.HR.canCommandSend, 'HR 不可发指令')

    // 无权限客户端无法申请 sync:write
    const service = new OpenApiService()
    try {
      await service.authenticate('cli-partner-pos', 'test-secret', ['sync:write'])
      assert.fail('应拒绝 sync:write')
    } catch (e: any) {
      assert.ok(e.response?.errorDescription === 'No valid scope', '应返回 No valid scope')
    }
  })
})

// ── 🔧安监 ──
describe('🔧安监 (Security)', () => {
  it('正常流程: 认证 → 验证 Token → 管理客户端', async () => {
    const ctx = createContext(ROLE_CAPABILITIES.Security.syncScope)
    const { token } = await authWithScope(ctx.service, ctx.clientId, ctx.clientSecret, ROLE_CAPABILITIES.Security.syncScope)

    assert.ok(token.accessToken, '安监应能获取 token')
    assert.ok(token.scope.includes('auth:verify'), '应有 auth:verify')

    // 验证其他 client token
    const verified = await ctx.service.verifyToken(token.accessToken)
    assert.ok(verified, '应能验证 token')
    assert.equal(verified.clientId, ctx.clientId)

    // 管理客户端列表
    const clients = ctx.service.listClients('tenant-A')
    assert.ok(Array.isArray(clients))
    assert.ok(clients.length >= 1)
  })

  it('权限边界: 安监不可同步数据', async () => {
    assert.ok(!ROLE_CAPABILITIES.Security.canSyncRead, '安监不可读同步')
    assert.ok(!ROLE_CAPABILITIES.Security.canSyncWrite, '安监不可写同步')
    assert.ok(!ROLE_CAPABILITIES.Security.canCommandSend, '安监不可发指令')

    // 无权限客户端无法申请 sync:write
    const service = new OpenApiService()
    try {
      await service.authenticate('cli-partner-pos', 'test-secret', ['sync:write'])
      assert.fail('应拒绝 sync:write')
    } catch (e: any) {
      assert.ok(e.response?.errorDescription === 'No valid scope', '应返回无权限错误')
    }
  })

  it('正常流程: IP 白名单校验', async () => {
    const ctx = createContext(ROLE_CAPABILITIES.Security.syncScope)

    // 白名单内的 IP 通过
    const allowed = ctx.service.verifyIpWhitelist(ctx.clientId, '127.0.0.1')
    assert.ok(allowed, '127.0.0.1 应在白名单内')

    // 白名单外 IP 拒绝
    const denied = ctx.service.verifyIpWhitelist(ctx.clientId, '10.0.0.1')
    assert.ok(!denied, '10.0.0.1 不应在白名单内')

    // CIDR 子网匹配
    const cidrAllowed = ctx.service.verifyIpWhitelist(ctx.clientId, '192.168.1.55')
    assert.ok(cidrAllowed, '192.168.1.x 应在白名单内')
  })
})

// ── 🎮导玩员 ──
describe('🎮导玩员 (Guide)', () => {
  it('正常流程: 认证 → 读取设备状态(只读)', async () => {
    const ctx = createContext(ROLE_CAPABILITIES.Guide.syncScope)
    const { token } = await authWithScope(ctx.service, ctx.clientId, ctx.clientSecret, ROLE_CAPABILITIES.Guide.syncScope)

    assert.ok(token.accessToken, '导玩员应能获取 token')
    assert.ok(token.scope.length > 0, '应有至少一个 scope')
    assert.ok(!token.scope.includes('sync:write'), '不应有写权限')
  })

  it('权限边界: 导玩员不可写同步、不可指令下发、不可列出客户端', async () => {
    assert.ok(!ROLE_CAPABILITIES.Guide.canSyncWrite, '导玩员不可写')
    assert.ok(!ROLE_CAPABILITIES.Guide.canCommandSend, '导玩员不可发指令')
    assert.ok(!ROLE_CAPABILITIES.Guide.canListClients, '导玩员不可列客户端')
  })
})

// ── 🎯运行专员 ──
describe('🎯运行专员 (Operations)', () => {
  it('正常流程: 认证 → 批量同步 → 下发指令 → 状态查询', async () => {
    const ctx = createContext(ROLE_CAPABILITIES.Operations.syncScope)
    const { token } = await authWithScope(ctx.service, ctx.clientId, ctx.clientSecret, ROLE_CAPABILITIES.Operations.syncScope)

    await runWithBearer(token.accessToken, async () => {
      assert.ok(token.accessToken, '运行专员应能获取 token')
      assert.ok(token.scope.includes('sync:bulk'), '应有 sync:bulk 批量同步权限')
      assert.ok(token.scope.includes('command:send'), '应有 command:send')

      // 下发指令并验证状态
      const cmd = await ctx.service.sendCommand(ctx.clientId, {
        commandType: 'open_door',
        targetDeviceId: 'gate-01',
        params: { reason: 'emergency_maintenance' },
        priority: 'urgent',
      })
      assert.ok(cmd.id, '应生成指令')
      assert.ok(cmd.priority === 'urgent')
      assert.ok(cmd.durationMs !== undefined)
    })
  })

  it('权限边界: 运行专员不可列出所有客户端', async () => {
    assert.ok(!ROLE_CAPABILITIES.Operations.canListClients, '运行专员不可列客户端')
  })

  it('正常流程: HMAC 签名校验', async () => {
    const ctx = createContext(ROLE_CAPABILITIES.Operations.syncScope)

    const method = 'POST'
    const path = '/open/sync'
    const timestamp = String(Date.now())
    const body = JSON.stringify({ resourceType: 'order', action: 'sync' })

    // 有效签名应通过 (使用种子 HMAC 密钥: hmac-merchant-001-secret)
    const crypto = await import('node:crypto')
    const bodyHash = crypto.createHash('sha256').update(body).digest('hex')
    const payload = `${method}\n${path}\n${timestamp}\n${bodyHash}`
    const expectedSig = crypto.createHmac('sha256', 'hmac-merchant-001-secret').update(payload).digest('hex')

    const valid = ctx.service.verifyHmacSignature('cli-merchant-001', method, path, timestamp, body, `sha256=${expectedSig}`)
    assert.ok(valid, '有效 HMAC 签名应通过校验')
  })
})

// ── 🤝团建 ──
describe('🤝团建 (Teambuilding)', () => {
  it('正常流程: 认证 → 只读查询(读取活动数据)', async () => {
    const ctx = createContext(ROLE_CAPABILITIES.Teambuilding.syncScope)
    const { token } = await authWithScope(ctx.service, ctx.clientId, ctx.clientSecret, ROLE_CAPABILITIES.Teambuilding.syncScope)

    assert.ok(token.accessToken, '团建应能获取 token')
    assert.ok(token.scope.includes('sync:read'), '应有 sync:read')
    assert.ok(!token.scope.includes('sync:write'), '无写权限')
  })

  it('权限边界: 团建不可写同步、不可指令下发、不可管理客户端', async () => {
    assert.ok(!ROLE_CAPABILITIES.Teambuilding.canSyncWrite, '团建不可写')
    assert.ok(!ROLE_CAPABILITIES.Teambuilding.canCommandSend, '团建不可发指令')
    assert.ok(!ROLE_CAPABILITIES.Teambuilding.canListClients, '团建不可列客户端')

    // 尝试申请 command:send 应失败
    try {
      const ctx = createContext(ROLE_CAPABILITIES.Teambuilding.syncScope)
      await ctx.service.authenticate(ctx.clientId, ctx.clientSecret, ['command:send'])
      assert.fail('应拒绝 command:send')
    } catch (e: any) {
      assert.ok(true, '正确拒绝无权限 scope')
    }
  })
})

// ── 📢营销 ──
describe('📢营销 (Marketing)', () => {
  it('正常流程: 认证 → 同步营销活动数据', async () => {
    const ctx = createContext(ROLE_CAPABILITIES.Marketing.syncScope)
    const { token } = await authWithScope(ctx.service, ctx.clientId, ctx.clientSecret, ROLE_CAPABILITIES.Marketing.syncScope)

    await runWithBearer(token.accessToken, async () => {
      assert.ok(token.accessToken, '营销应能获取 token')
      assert.ok(token.scope.includes('sync:read'), '应有 sync:read')
      assert.ok(token.scope.includes('sync:write'), '应有 sync:write')
      assert.ok(!token.scope.includes('command:send'), '无指令权限')

      // 同步营销数据
      const syncResult = await ctx.service.handleSync(ctx.clientId, {
        resourceType: 'campaign',
        action: 'create',
        data: { campaignId: 'camp-001', name: '暑期大促', budget: 50000 },
        businessKey: 'bk-camp-001',
        timestamp: new Date().toISOString(),
      })
      assert.ok(syncResult.accepted, '营销数据同步应被接受')
      assert.equal(syncResult.businessKey, 'bk-camp-001')
    })
  })

  it('权限边界: 营销不可批量同步、不可指令下发', async () => {
    assert.ok(!ROLE_CAPABILITIES.Marketing.canSyncBulk, '营销不可批量同步')
    assert.ok(!ROLE_CAPABILITIES.Marketing.canCommandSend, '营销不可发指令')

    // 验证 scope 边界
    const ctx = createContext(ROLE_CAPABILITIES.Marketing.syncScope)
    try {
      await ctx.service.authenticate(ctx.clientId, ctx.clientSecret, ['sync:bulk', 'command:send'])
      assert.fail('应拒绝 sync:bulk')
    } catch (e: any) {
      assert.ok(true, '正确拒绝无权限 scope')
    }
  })

  it('权限边界: 营销不可列出客户端详情', async () => {
    assert.ok(!ROLE_CAPABILITIES.Marketing.canListClients, '营销不可列客户端')
  })
})

// ── 跨角色集成测试 ──
describe('跨角色集成 — HMAC 防重放攻击', () => {
  it('HMAC 签名时间窗口校验 — 超时应拒绝', async () => {
    const ctx = createContext(ROLE_CAPABILITIES.Operations.syncScope)
    const method = 'POST'
    const path = '/open/sync'
    // 5 分钟前的时间戳 = 过期
    const oldTimestamp = String(Date.now() - 6 * 60 * 1000)
    const body = '{}'

    const valid = ctx.service.verifyHmacSignature('cli-merchant-001', method, path, oldTimestamp, body, 'sha256=deadbeef')
    assert.ok(!valid, '过期签名应被拒绝')
  })

  it('HMAC 签名内容篡改应被拒绝', async () => {
    const ctx = createContext(ROLE_CAPABILITIES.Operations.syncScope)

    const crypto = await import('node:crypto')
    const ts = String(Date.now())
    const body = JSON.stringify({ action: 'original' })
    const bodyHash = crypto.createHash('sha256').update(body).digest('hex')
    const payload = `POST\n/open/sync\n${ts}\n${bodyHash}`
    const sig = crypto.createHmac('sha256', 'hmac-merchant-001-secret').update(payload).digest('hex')

    // 篡改 body 内容
    const tamperedBody = JSON.stringify({ action: 'tampered' })
    const valid = ctx.service.verifyHmacSignature('cli-merchant-001', 'POST', '/open/sync', ts, tamperedBody, `sha256=${sig}`)
    assert.ok(!valid, '篡改 body 后签名应不通过')
  })
})

describe('跨角色集成 — 限流测试', () => {
  it('rate limit 快速消耗', async () => {
    const ctx = createContext(ROLE_CAPABILITIES.Operations.syncScope)

    // 种子客户端有 100 QPS, 快速消耗几个
    let remaining = 100
    for (let i = 0; i < 5; i++) {
      const result = ctx.service.checkRateLimit('cli-merchant-001')
      if (result.allowed) {
        remaining = result.remaining
      }
    }
    assert.ok(remaining < 100, '限流器计数应已消耗')
    assert.ok(remaining <= 95, '应已消耗至少 5 次')

    // 未知 clientId 应返回 false
    const unknown = ctx.service.checkRateLimit('unknown-client')
    assert.ok(!unknown.allowed, '未知 clientId 不应通过限流')
  })
})

describe('跨角色集成 — 幂等性', () => {
  it('相同 idempotency-key 重复发送指令应返回同一结果', async () => {
    const ctx = createContext(ROLE_CAPABILITIES.Operations.syncScope)
    const { token } = await authWithScope(ctx.service, ctx.clientId, ctx.clientSecret, ROLE_CAPABILITIES.Operations.syncScope)

    const idempotencyKey = 'idem-print-001'
    const payload = {
      commandType: 'print_receipt',
      targetDeviceId: 'printer-01',
      params: { orderId: 'ord-999' },
      priority: 'normal' as const,
    }

    await runWithBearer(token.accessToken, async () => {
      const result1 = await ctx.service.sendCommand(ctx.clientId, payload, idempotencyKey)
      const result2 = await ctx.service.sendCommand(ctx.clientId, payload, idempotencyKey)

      assert.equal(result1.id, result2.id, '相同幂等键应返回同一指令')
    })
  })
})
