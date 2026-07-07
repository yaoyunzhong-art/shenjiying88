/**
 * OpenApiClient SDK (V9 需求 3 · V10 Day 5+6 补)
 *
 * 客户端 SDK: 集成 OAuth 2.0 client_credentials + HMAC 签名 + 幂等性
 *
 * 使用:
 *   const client = new OpenApiClient({
 *     baseUrl: 'https://api.shenjiying88.com',
 *     clientId: 'cli-merchant-001',
 *     clientSecret: 'your-secret',
 *     hmacSecret: 'hmac-secret',
 *   })
 *   await client.authenticate()
 *   await client.sync({ businessKey: 'order-123', data: {...} })
 *   await client.sendCommand({ commandType: 'print', ... })
 */

export interface OpenApiClientConfig {
  baseUrl: string
  clientId: string
  clientSecret: string
  hmacSecret: string
  /** 默认 scopes (默认全开) */
  scopes?: string[]
  /** 自定义 fetch 实现 (用于 SSR/Node) */
  fetch?: typeof fetch
}

export interface AccessToken {
  accessToken: string
  tokenType: string
  expiresIn: number
  scope: string[]
  issuedAt: string
  expiresAt: number
}

export interface SyncPayload<T = unknown> {
  businessKey: string
  data: T
}

export interface SyncResponse {
  businessKey: string
  accepted: boolean
  timestamp: string
}

export interface CommandPayload {
  commandType: string
  targetDeviceId: string
  params: Record<string, unknown>
  priority?: 'low' | 'normal' | 'high' | 'urgent'
}

export interface CommandResult {
  id: string
  status: 'pending' | 'success' | 'failed'
  commandType: string
  startedAt: string
  completedAt?: string
  durationMs?: number
}

export class OpenApiClient {
  private readonly config: Required<OpenApiClientConfig>
  private token: AccessToken | null = null

  constructor(config: OpenApiClientConfig) {
    this.config = {
      baseUrl: config.baseUrl.replace(/\/$/, ''),
      clientId: config.clientId,
      clientSecret: config.clientSecret,
      hmacSecret: config.hmacSecret,
      scopes: config.scopes ?? ['auth:read', 'sync:write', 'command:send'],
      fetch: config.fetch ?? (typeof fetch !== 'undefined' ? fetch.bind(globalThis) : (() => { throw new Error('No fetch available') }) as any),
    }
  }

  // ============ 1. OAuth 2.0 client_credentials ============

  async authenticate(): Promise<AccessToken> {
    const body = new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret,
      scope: this.config.scopes.join(' '),
    })

    const res = await this.config.fetch(`${this.config.baseUrl}/open/auth/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    })

    if (!res.ok) {
      throw new Error(`[OpenApiClient] Authentication failed: ${res.status}`)
    }
    const data = (await res.json()) as {
      access_token: string
      token_type: string
      expires_in: number
      scope: string[]
    }

    const now = Date.now()
    this.token = {
      accessToken: data.access_token,
      tokenType: data.token_type,
      expiresIn: data.expires_in,
      scope: data.scope,
      issuedAt: new Date(now).toISOString(),
      expiresAt: now + data.expires_in * 1000,
    }
    return this.token
  }

  private async ensureToken(): Promise<AccessToken> {
    if (!this.token || this.token.expiresAt < Date.now() + 30 * 1000) {
      return this.authenticate()
    }
    return this.token
  }

  // ============ 2. HMAC-SHA256 签名 ============

  private async sign(method: string, path: string, body: string): Promise<{
    timestamp: string
    signature: string
  }> {
    const timestamp = Date.now().toString()
    const bodyHash = await this.sha256Hex(body ?? '')
    const payload = `${method.toUpperCase()}\n${path}\n${timestamp}\n${bodyHash}`
    const signature = await this.hmacHex(payload)
    return { timestamp, signature: `sha256=${signature}` }
  }

  private async sha256Hex(text: string): Promise<string> {
    if (typeof crypto !== 'undefined' && crypto.subtle) {
      const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))
      return Array.from(new Uint8Array(buf))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('')
    }
    // Node.js fallback
    const nodeCrypto = await import('node:crypto')
    return nodeCrypto.createHash('sha256').update(text).digest('hex')
  }

  private async hmacHex(text: string): Promise<string> {
    if (typeof crypto !== 'undefined' && crypto.subtle) {
      const key = await crypto.subtle.importKey(
        'raw',
        new TextEncoder().encode(this.config.hmacSecret),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign'],
      )
      const buf = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(text))
      return Array.from(new Uint8Array(buf))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('')
    }
    const nodeCrypto = await import('node:crypto')
    return nodeCrypto.createHmac('sha256', this.config.hmacSecret).update(text).digest('hex')
  }

  // ============ 3. 通用签名请求 ============

  private async signedRequest<T>(
    method: string,
    path: string,
    body?: unknown,
    idempotencyKey?: string,
  ): Promise<T> {
    const token = await this.ensureToken()
    const bodyText = body !== undefined ? JSON.stringify(body) : ''
    const { timestamp, signature } = await this.sign(method, path, bodyText)

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Authorization: `${token.tokenType} ${token.accessToken}`,
      'X-HMAC-Timestamp': timestamp,
      'X-HMAC-Signature': signature,
      'X-Client-Id': this.config.clientId,
    }
    if (idempotencyKey) {
      headers['Idempotency-Key'] = idempotencyKey
    }

    const res = await this.config.fetch(`${this.config.baseUrl}${path}`, {
      method,
      headers,
      body: body !== undefined ? bodyText : undefined,
    })

    if (!res.ok) {
      const err = await res.text().catch(() => '')
      throw new Error(`[OpenApiClient] ${method} ${path} failed: ${res.status} ${err}`)
    }
    return (await res.json()) as T
  }

  // ============ 4. 数据同步 ============

  async sync<T>(payload: SyncPayload<T>, idempotencyKey?: string): Promise<SyncResponse> {
    return this.signedRequest<SyncResponse>('POST', '/open/sync', payload, idempotencyKey)
  }

  async syncBulk<T>(items: SyncPayload<T>[]): Promise<SyncResponse[]> {
    return this.signedRequest<SyncResponse[]>('POST', '/open/sync/bulk', { items })
  }

  // ============ 5. 指令下发 ============

  async sendCommand(payload: CommandPayload, idempotencyKey?: string): Promise<CommandResult> {
    return this.signedRequest<CommandResult>('POST', '/open/command', payload, idempotencyKey)
  }

  async getCommandStatus(commandId: string): Promise<CommandResult> {
    return this.signedRequest<CommandResult>('GET', `/open/command/${commandId}`)
  }

  // ============ 6. Token 管理 ============

  getToken(): AccessToken | null {
    return this.token
  }

  clearToken(): void {
    this.token = null
  }
}

/**
 * 工厂函数: 快速创建客户端
 */
export function createOpenApiClient(config: OpenApiClientConfig): OpenApiClient {
  return new OpenApiClient(config)
}
