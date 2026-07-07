/**
 * 多系统对接 - Service (V9 需求 3 · V10 Day 5 Phase 89)
 *
 * 核心能力:
 * - OAuth 2.0 client_credentials 流程
 * - HMAC-SHA256 签名校验
 * - IP 白名单
 * - 限流 (滑动窗口 QPS)
 * - 幂等性 (Idempotency-Key)
 * - 3 类接口: /auth /sync /command
 */

import { Injectable, UnauthorizedException, ForbiddenException, BadRequestException, ConflictException } from '@nestjs/common'
import * as crypto from 'node:crypto'
import { requireTenantContext } from '../../common/context/tenant-context'
import type {
  OpenApiClient,
  OpenApiToken,
  OpenApiScope,
  SyncPayload,
  CommandPayload,
  CommandExecution,
  RateLimitBucket,
} from './open-api.entity'

@Injectable()
export class OpenApiService {
  private readonly clients = new Map<string, OpenApiClient>()              // clientId -> client
  private readonly tokens = new Map<string, OpenApiToken & { clientId: string }>()  // accessToken -> token
  private readonly commands: CommandExecution[] = []
  private readonly rateLimitBuckets = new Map<string, RateLimitBucket>()
  private readonly idempotencyKeys = new Map<string, string>() // key -> commandId

  constructor() {
    this.seed()
  }

  // ============ 1. OAuth 2.0 client_credentials ============

  /**
   * 客户端认证 (RFC 6749 Section 4.4)
   * 用 clientId + clientSecret 换取 access_token
   */
  async authenticate(
    clientId: string,
    clientSecret: string,
    requestedScopes: string[],
  ): Promise<OpenApiToken> {
    const client = this.clients.get(clientId)
    if (!client) {
      throw new UnauthorizedException({ error: 'invalid_client', errorDescription: 'Unknown client_id' })
    }
    if (client.status !== 'active') {
      throw new UnauthorizedException({ error: 'invalid_client', errorDescription: `Client is ${client.status}` })
    }

    // bcrypt 校验 (实际生产用 bcrypt.compare; 这里简化用 HMAC-SHA256 等价)
    const secretHash = crypto.createHash('sha256').update(clientSecret).digest('hex')
    if (secretHash !== client.clientSecretHash) {
      throw new UnauthorizedException({ error: 'invalid_client', errorDescription: 'Invalid client_secret' })
    }

    // 校验 scope
    const grantedScopes = this.intersectScopes(requestedScopes as OpenApiScope[], client.scopes)
    if (grantedScopes.length === 0) {
      throw new ForbiddenException({ error: 'invalid_scope', errorDescription: 'No valid scope' })
    }

    // 颁发 token
    const jti = `jti-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    const accessToken = crypto.randomBytes(32).toString('base64url')
    const expiresIn = 3600 // 1 小时
    const token: OpenApiToken & { clientId: string } = {
      accessToken,
      tokenType: 'Bearer',
      expiresIn,
      scope: grantedScopes,
      clientId,
      jti,
      issuedAt: new Date().toISOString(),
    }
    this.tokens.set(accessToken, token)

    // 自动过期清理
    setTimeout(() => this.tokens.delete(accessToken), expiresIn * 1000).unref?.()

    return token
  }

  /**
   * 校验 Bearer Token
   */
  async verifyToken(accessToken: string): Promise<OpenApiToken & { clientId: string }> {
    const token = this.tokens.get(accessToken)
    if (!token) {
      throw new UnauthorizedException({ error: 'invalid_token', errorDescription: 'Token not found or expired' })
    }
    return token
  }

  // ============ 2. HMAC-SHA256 签名校验 ============

  /**
   * 校验请求签名
   * Header: X-HMAC-Signature: sha256=<hex>
   * 计算: HMAC-SHA256(secret, METHOD + "\n" + PATH + "\n" + TIMESTAMP + "\n" + BODY_SHA256)
   */
  verifyHmacSignature(
    clientId: string,
    method: string,
    path: string,
    timestamp: string,
    body: string,
    signature: string,
  ): boolean {
    const client = this.clients.get(clientId)
    if (!client) return false

    // 5 分钟时间窗口 (防重放)
    const ts = parseInt(timestamp, 10)
    if (Number.isNaN(ts) || Math.abs(Date.now() - ts) > 5 * 60 * 1000) {
      return false
    }

    const bodyHash = crypto.createHash('sha256').update(body ?? '').digest('hex')
    const payload = `${method.toUpperCase()}\n${path}\n${timestamp}\n${bodyHash}`
    const expected = crypto.createHmac('sha256', client.hmacSecret).update(payload).digest('hex')
    const provided = signature.replace(/^sha256=/, '')

    // 长度不同直接拒绝 (避免 timingSafeEqual 抛错)
    if (expected.length !== provided.length) return false
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(provided))
  }

  // ============ 3. IP 白名单 ============

  verifyIpWhitelist(clientId: string, clientIp: string): boolean {
    const client = this.clients.get(clientId)
    if (!client) return false
    if (client.ipWhitelist.length === 0) return true // 无限制
    return client.ipWhitelist.some((cidr) => this.matchCidr(clientIp, cidr))
  }

  // ============ 4. 限流 (滑动窗口) ============

  checkRateLimit(clientId: string): { allowed: boolean; remaining: number } {
    const client = this.clients.get(clientId)
    if (!client) return { allowed: false, remaining: 0 }

    const now = Date.now()
    const windowMs = 1000 // 1 秒窗口
    const bucket = this.rateLimitBuckets.get(clientId)

    if (!bucket || now - bucket.windowStart >= windowMs) {
      this.rateLimitBuckets.set(clientId, { clientId, windowStart: now, count: 1, max: client.rateLimitQps })
      return { allowed: true, remaining: client.rateLimitQps - 1 }
    }

    if (bucket.count >= bucket.max) {
      return { allowed: false, remaining: 0 }
    }
    bucket.count++
    return { allowed: true, remaining: client.rateLimitQps - bucket.count }
  }

  // ============ 5. 数据同步 ============

  /**
   * 处理 sync 请求 (V9 需求 3)
   * 鉴权: OAuth Bearer + HMAC 签名 + IP 白名单
   * 幂等: 通过 businessKey
   */
  async handleSync<T>(clientId: string, payload: SyncPayload<T>): Promise<{ businessKey: string; accepted: true; timestamp: string }> {
    const token = await this.verifyToken(this.getBearerFromCtx())
    if (token.clientId !== clientId) {
      throw new ForbiddenException({ error: 'invalid_token', errorDescription: 'Token does not match client' })
    }
    if (!token.scope.includes('sync:write') && !token.scope.includes('sync:bulk')) {
      throw new ForbiddenException({ error: 'insufficient_scope', errorDescription: 'sync:write required' })
    }

    // 简化: 实际应用层处理 sync payload (Day 6+ 接入业务)
    return {
      businessKey: payload.businessKey,
      accepted: true,
      timestamp: new Date().toISOString(),
    }
  }

  // ============ 6. 指令下发 ============

  async sendCommand(
    clientId: string,
    payload: CommandPayload,
    idempotencyKey?: string,
  ): Promise<CommandExecution> {
    const token = await this.verifyToken(this.getBearerFromCtx())
    if (token.clientId !== clientId) {
      throw new ForbiddenException({ error: 'invalid_token' })
    }
    if (!token.scope.includes('command:send')) {
      throw new ForbiddenException({ error: 'insufficient_scope', errorDescription: 'command:send required' })
    }

    // 幂等性检查
    if (idempotencyKey && this.idempotencyKeys.has(idempotencyKey)) {
      const existingId = this.idempotencyKeys.get(idempotencyKey)!
      const existing = this.commands.find((c) => c.id === existingId)
      if (existing) return existing
    }

    const client = this.clients.get(clientId)!
    const cmd: CommandExecution = {
      id: `cmd-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      clientId,
      tenantId: client.tenantId,
      commandType: payload.commandType,
      targetDeviceId: payload.targetDeviceId,
      params: payload.params,
      priority: payload.priority,
      status: 'pending',
      idempotencyKey,
      startedAt: new Date().toISOString(),
    }
    this.commands.push(cmd)

    if (idempotencyKey) {
      this.idempotencyKeys.set(idempotencyKey, cmd.id)
    }

    // 模拟异步执行 (Day 6+ 接入设备 SDK)
    cmd.status = 'success'
    cmd.completedAt = new Date().toISOString()
    cmd.durationMs = 50

    return cmd
  }

  // ============ 7. 客户端管理 (CRUD - admin) ============

  listClients(tenantId: string): OpenApiClient[] {
    return Array.from(this.clients.values()).filter((c) => c.tenantId === tenantId)
  }

  getClient(clientId: string): OpenApiClient | null {
    return this.clients.get(clientId) ?? null
  }

  // ============ 内部工具 ============

  private intersectScopes(requested: OpenApiScope[], allowed: OpenApiScope[]): OpenApiScope[] {
    if (requested.length === 0) return allowed
    return requested.filter((s) => allowed.includes(s))
  }

  private matchCidr(ip: string, cidr: string): boolean {
    // 简化: 仅支持 exact IP + /24 子网
    if (!cidr.includes('/')) return ip === cidr
    const [subnet, bits] = cidr.split('/')
    const mask = -1 << (32 - parseInt(bits, 10))
    const ipNum = this.ipToInt(ip)
    const subnetNum = this.ipToInt(subnet)
    if (Number.isNaN(ipNum) || Number.isNaN(subnetNum)) return false
    return (ipNum & mask) === (subnetNum & mask)
  }

  private ipToInt(ip: string): number {
    return ip.split('.').reduce((acc, octet) => (acc << 8) + parseInt(octet, 10), 0) >>> 0
  }

  private getBearerFromCtx(): string {
    // V10 Day 5 简化: 实际从 req.headers.authorization 提取
    // 这里假定中间件已经处理并放入 tenantContext
    const ctx = requireTenantContext()
    return (ctx as any).bearerToken ?? ''
  }

  /** 种子: 2 个测试客户端 */
  private seed(): void {
    const now = new Date().toISOString()
    const secretHash = crypto.createHash('sha256').update('test-secret').digest('hex')
    const clients: OpenApiClient[] = [
      {
        clientId: 'cli-merchant-001',
        clientSecretHash: secretHash,
        name: '商户系统 1',
        tenantId: 'tenant-A',
        scopes: ['auth:read', 'auth:verify', 'sync:read', 'sync:write', 'sync:bulk', 'command:send', 'command:status'],
        ipWhitelist: ['127.0.0.1', '192.168.1.0/24'],
        rateLimitQps: 100,
        status: 'active',
        hmacSecret: 'hmac-merchant-001-secret',
        createdAt: now,
        updatedAt: now,
      },
      {
        clientId: 'cli-partner-pos',
        clientSecretHash: secretHash,
        name: '合作伙伴 POS',
        tenantId: 'tenant-B',
        scopes: ['sync:read', 'sync:bulk'],
        ipWhitelist: [],
        rateLimitQps: 50,
        status: 'active',
        hmacSecret: 'hmac-pos-secret',
        createdAt: now,
        updatedAt: now,
      },
    ]
    clients.forEach((c) => this.clients.set(c.clientId, c))
  }
}