/**
 * Phase 96 SSO Service (V10 Sprint 2 Day 23)
 *
 * 核心能力:
 * 1. SAML 2.0 连接 CRUD + SP-initiated 登录
 * 2. OIDC 连接 CRUD + Authorization Code + PKCE
 * 3. 用户身份关联 (UserSsoIdentity)
 * 4. 自动 provisioning (按邮箱域名匹配租户)
 * 5. Just-in-Time 用户创建
 */

import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common'
import { randomUUID, createHash, createHmac } from 'node:crypto'
import { requireTenantContext } from '../../common/context/tenant-context'
import { encryptField, decryptField } from '../ai-model-config/encryption.util'
import {
  SsoConnection,
  UserSsoIdentity,
  SsoProtocol,
  SamlConfig,
  OidcConfig,
  generateConnectionId,
  generateIdentityId,
  generateSamlRequestId,
  generateOidcState,
  generatePkceVerifier,
  deriveCodeChallenge,
  extractEmailDomain,
  validateSamlConfig,
  validateOidcConfig,
  buildSamlAuthnRequest,
  buildOidcAuthUrl,
  parseSamlAssertion,
} from './sso.entity'
import type {
  CreateSamlConnectionDto,
  CreateOidcConnectionDto,
  UpdateSsoConnectionDto,
  SsoLoginInitiateDto,
  SsoLoginCompleteDto,
  SsoConnectionResponse,
  SsoLoginInitResponse,
  SsoLoginCompleteResponse,
} from './sso.dto'

// ============ Mock 用户存储 (Phase 96 dev) ============
interface SsoUser {
  id: string
  tenantId: string
  email: string
  displayName?: string
  role: string
  createdAt: string
}

@Injectable()
export class SsoService {
  /** SSO 连接存储 */
  private readonly connections = new Map<string, SsoConnection>()
  /** tenantId → connectionIds */
  private readonly connectionsByTenant = new Map<string, Set<string>>()
  /** name → connectionId (tenant 内唯一) */
  private readonly connectionsByName = new Map<string, string>()
  /** 用户身份关联 */
  private readonly identities = new Map<string, UserSsoIdentity>()
  /** connectionId → identityIds */
  private readonly identitiesByConnection = new Map<string, Set<string>>()
  /** (connectionId, subject) → identityId */
  private readonly identitiesBySubject = new Map<string, string>()

  /** 用户存储 (mock) */
  private readonly users = new Map<string, SsoUser>()
  /** tenantId → userIds */
  private readonly usersByTenant = new Map<string, Set<string>>()
  /** tenantId+email → userId */
  private readonly usersByTenantEmail = new Map<string, string>()

  /** PKCE state 临时存储 (实际生产用 Redis + TTL) */
  private readonly pkceStore = new Map<string, { codeVerifier: string; connectionId: string; redirectAfter?: string; expiresAt: number }>()
  /** SAML RequestId 临时存储 */
  private readonly samlRequestStore = new Map<string, { connectionId: string; redirectAfter?: string; expiresAt: number }>()

  // ============ 加密 (Phase 88) ============
  encryptSecret(plain: string): string {
    return encryptField(plain)
  }
  decryptSecret(encrypted: string): string {
    return decryptField(encrypted)
  }

  // ============ 1. 连接 CRUD ============

  async createSamlConnection(dto: CreateSamlConnectionDto): Promise<SsoConnection> {
    const ctx = requireTenantContext()
    const valid = validateSamlConfig(dto.saml)
    if (!valid.valid) throw new BadRequestException(valid.error)
    // 名称唯一性
    const nameKey = `${ctx.tenantId}:${dto.name}`
    if (this.connectionsByName.has(nameKey)) {
      throw new BadRequestException(`连接名称 "${dto.name}" 已存在`)
    }

    const now = new Date().toISOString()
    const conn: SsoConnection = {
      id: generateConnectionId(),
      tenantId: ctx.tenantId,
      protocol: 'saml',
      name: dto.name,
      status: 'active',
      saml: { ...dto.saml },
      isDefault: dto.isDefault ?? false,
      defaultRole: dto.defaultRole ?? 'operator',
      autoProvisionTenant: dto.autoProvisionTenant ?? false,
      allowedEmailDomains: dto.allowedEmailDomains ?? [],
      createdAt: now,
      updatedAt: now,
      createdBy: ctx.userId ?? 'system',
    }
    this.connections.set(conn.id, conn)
    this.connectionsByName.set(nameKey, conn.id)
    if (!this.connectionsByTenant.has(ctx.tenantId)) {
      this.connectionsByTenant.set(ctx.tenantId, new Set())
    }
    this.connectionsByTenant.get(ctx.tenantId)!.add(conn.id)

    if (conn.isDefault) await this.setAsDefault(conn.id, ctx.tenantId)

    return conn
  }

  async createOidcConnection(dto: CreateOidcConnectionDto): Promise<SsoConnection> {
    const ctx = requireTenantContext()
    const valid = validateOidcConfig(dto.oidc)
    if (!valid.valid) throw new BadRequestException(valid.error)
    const nameKey = `${ctx.tenantId}:${dto.name}`
    if (this.connectionsByName.has(nameKey)) {
      throw new BadRequestException(`连接名称 "${dto.name}" 已存在`)
    }

    const now = new Date().toISOString()
    // 加密 clientSecret
    const oidcCfg: OidcConfig = {
      ...dto.oidc,
      clientSecret: this.encryptSecret(dto.oidc.clientSecret),
    }
    const conn: SsoConnection = {
      id: generateConnectionId(),
      tenantId: ctx.tenantId,
      protocol: 'oidc',
      name: dto.name,
      status: 'active',
      oidc: oidcCfg,
      isDefault: dto.isDefault ?? false,
      defaultRole: dto.defaultRole ?? 'operator',
      autoProvisionTenant: dto.autoProvisionTenant ?? false,
      allowedEmailDomains: dto.allowedEmailDomains ?? [],
      createdAt: now,
      updatedAt: now,
      createdBy: ctx.userId ?? 'system',
    }
    this.connections.set(conn.id, conn)
    this.connectionsByName.set(nameKey, conn.id)
    if (!this.connectionsByTenant.has(ctx.tenantId)) {
      this.connectionsByTenant.set(ctx.tenantId, new Set())
    }
    this.connectionsByTenant.get(ctx.tenantId)!.add(conn.id)

    if (conn.isDefault) await this.setAsDefault(conn.id, ctx.tenantId)
    return conn
  }

  async listConnections(): Promise<SsoConnectionResponse[]> {
    const ctx = requireTenantContext()
    const ids = this.connectionsByTenant.get(ctx.tenantId) ?? new Set()
    return Array.from(ids)
      .map((id) => this.connections.get(id))
      .filter((c): c is SsoConnection => c != null)
      .map((c) => this.toConnectionResponse(c))
      .sort((a, b) => a.name.localeCompare(b.name))
  }

  async getConnection(id: string): Promise<SsoConnectionResponse> {
    const ctx = requireTenantContext()
    const c = this.connections.get(id)
    if (!c || c.tenantId !== ctx.tenantId) {
      throw new NotFoundException(`SSO 连接 ${id} 不存在`)
    }
    return this.toConnectionResponse(c)
  }

  /**
   * 获取完整连接配置 (含敏感字段, 仅 SSO 内部使用)
   */
  private getConnectionRaw(id: string): SsoConnection | null {
    return this.connections.get(id) ?? null
  }

  async updateConnection(id: string, dto: UpdateSsoConnectionDto): Promise<SsoConnectionResponse> {
    const ctx = requireTenantContext()
    const c = this.connections.get(id)
    if (!c || c.tenantId !== ctx.tenantId) {
      throw new NotFoundException(`SSO 连接 ${id} 不存在`)
    }

    if (dto.name !== undefined) c.name = dto.name
    if (dto.status !== undefined) c.status = dto.status
    if (dto.isDefault !== undefined) c.isDefault = dto.isDefault
    if (dto.defaultRole !== undefined) c.defaultRole = dto.defaultRole
    if (dto.autoProvisionTenant !== undefined) c.autoProvisionTenant = dto.autoProvisionTenant
    if (dto.allowedEmailDomains !== undefined) c.allowedEmailDomains = dto.allowedEmailDomains
    if (dto.saml && c.protocol === 'saml') {
      Object.assign(c.saml!, dto.saml)
      const valid = validateSamlConfig(c.saml!)
      if (!valid.valid) throw new BadRequestException(valid.error)
    }
    if (dto.oidc && c.protocol === 'oidc') {
      if (dto.oidc.clientSecret !== undefined) {
        c.oidc!.clientSecret = this.encryptSecret(dto.oidc.clientSecret)
      }
      Object.assign(c.oidc!, dto.oidc)
      const valid = validateOidcConfig(c.oidc!)
      if (!valid.valid) throw new BadRequestException(valid.error)
    }
    c.updatedAt = new Date().toISOString()

    if (c.isDefault) await this.setAsDefault(c.id, c.tenantId)

    return this.toConnectionResponse(c)
  }

  async deleteConnection(id: string): Promise<void> {
    const ctx = requireTenantContext()
    const c = this.connections.get(id)
    if (!c || c.tenantId !== ctx.tenantId) {
      throw new NotFoundException(`SSO 连接 ${id} 不存在`)
    }
    this.connections.delete(id)
    this.connectionsByTenant.get(ctx.tenantId)?.delete(id)
    this.connectionsByName.delete(`${ctx.tenantId}:${c.name}`)
    // 保留 identities 记录 (审计用)
  }

  private async setAsDefault(connectionId: string, tenantId: string): Promise<void> {
    const ids = this.connectionsByTenant.get(tenantId) ?? new Set()
    for (const id of ids) {
      const c = this.connections.get(id)
      if (c && c.id !== connectionId && c.isDefault) {
        c.isDefault = false
      }
    }
  }

  // ============ 2. SP-initiated 登录 (生成跳转 URL) ============

  async initiateLogin(connectionId: string, dto: SsoLoginInitiateDto = {}): Promise<SsoLoginInitResponse> {
    const conn = this.getConnectionRaw(connectionId)
    if (!conn) throw new NotFoundException(`SSO 连接 ${connectionId} 不存在`)
    if (conn.status !== 'active') throw new BadRequestException(`SSO 连接未启用: ${conn.status}`)

    if (conn.protocol === 'saml') {
      return this.initiateSaml(conn, dto)
    }
    return this.initiateOidc(conn, dto)
  }

  private initiateSaml(conn: SsoConnection, dto: SsoLoginInitiateDto): SsoLoginInitResponse {
    if (!conn.saml) throw new BadRequestException('SAML 配置缺失')
    const requestId = generateSamlRequestId()
    const authnRequest = buildSamlAuthnRequest({
      spEntityId: conn.saml.spEntityId,
      acsUrl: conn.saml.acsUrl,
      id: requestId,
      forceAuthn: dto.forceAuthn,
    })
    // 存储 SAML RequestId (用于回调校验)
    this.samlRequestStore.set(requestId, {
      connectionId: conn.id,
      redirectAfter: dto.redirectAfter,
      expiresAt: Date.now() + 5 * 60 * 1000, // 5 分钟过期
    })
    // Base64 编码 SAML Request, 浏览器通过 POST 提交
    const samlRequestB64 = Buffer.from(authnRequest).toString('base64')
    // SSO URL 携带 SAMLRequest 参数 (实际生产用 HTTP-Redirect 绑定)
    const ssoUrl = new URL(conn.saml.ssoUrl)
    ssoUrl.searchParams.set('SAMLRequest', samlRequestB64)
    return {
      redirectUrl: ssoUrl.toString(),
      requestId,
    }
  }

  private initiateOidc(conn: SsoConnection, dto: SsoLoginInitiateDto): SsoLoginInitResponse {
    if (!conn.oidc) throw new BadRequestException('OIDC 配置缺失')
    const codeVerifier = generatePkceVerifier()
    const codeChallenge = deriveCodeChallenge(codeVerifier)
    const state = generateOidcState()
    // 存储 state → codeVerifier + redirectAfter (回调时使用)
    this.pkceStore.set(state, {
      codeVerifier,
      connectionId: conn.id,
      redirectAfter: dto.redirectAfter,
      expiresAt: Date.now() + 10 * 60 * 1000, // 10 分钟过期
    })
    const oidc = conn.oidc
    const redirectUrl = buildOidcAuthUrl({
      authorizationEndpoint: oidc.authorizationEndpoint,
      clientId: oidc.clientId,
      redirectUri: oidc.redirectUri,
      scope: oidc.scope,
      state,
      codeChallenge,
    })
    return { redirectUrl, state, codeVerifier }
  }

  // ============ 3. 回调完成登录 ============

  async completeLogin(dto: SsoLoginCompleteDto): Promise<SsoLoginCompleteResponse> {
    if (dto.protocol === 'saml') {
      return this.completeSaml(dto.payload)
    }
    if (!dto.state) throw new BadRequestException('OIDC state 必填')
    return this.completeOidc(dto.payload, dto.state)
  }

  private async completeSaml(samlResponseB64: string): Promise<SsoLoginCompleteResponse> {
    // 1. Base64 解码 + 解析 SAML Response
    let samlXml: string
    try {
      samlXml = Buffer.from(samlResponseB64, 'base64').toString('utf-8')
    } catch {
      throw new BadRequestException('SAML Response Base64 解码失败')
    }
    const assertion = parseSamlAssertion(samlXml)
    if (!assertion.email) {
      throw new BadRequestException('SAML 断言中未找到 email 属性')
    }

    // 2. 从 SAML 响应推断 connectionId (实际生产需从 InResponseTo 关联)
    // 简化: 通过 email 域名匹配连接
    const conn = this.findConnectionByEmail(assertion.email)
    if (!conn) throw new ForbiddenException(`邮箱 ${assertion.email} 无匹配的 SSO 连接`)

    // 3. 校验邮箱域名白名单
    if (conn.allowedEmailDomains.length > 0) {
      const domain = extractEmailDomain(assertion.email)
      if (!conn.allowedEmailDomains.includes(domain)) {
        throw new ForbiddenException(`邮箱域名 ${domain} 不在白名单`)
      }
    }

    // 4. 用户处理 (JIT 创建 / 匹配现有)
    return this.handleUserLogin(conn, assertion.email, assertion.nameId)
  }

  private async completeOidc(code: string, state: string): Promise<SsoLoginCompleteResponse> {
    const stored = this.pkceStore.get(state)
    if (!stored) throw new BadRequestException('无效的 state')
    if (stored.expiresAt < Date.now()) {
      this.pkceStore.delete(state)
      throw new BadRequestException('state 已过期')
    }
    this.pkceStore.delete(state)

    const conn = this.getConnectionRaw(stored.connectionId)
    if (!conn || conn.protocol !== 'oidc' || !conn.oidc) {
      throw new NotFoundException('SSO 连接不存在或类型不匹配')
    }

    // 1. 用 code 换 token (实际生产需 HTTP POST)
    const tokenResp = await this.exchangeOidcCode(conn.oidc, code, stored.codeVerifier)
    // 2. 拿 userinfo
    const userinfo = await this.fetchOidcUserinfo(conn.oidc, tokenResp.access_token)
    if (!userinfo.email) {
      throw new BadRequestException('OIDC userinfo 未返回 email')
    }

    // 3. 邮箱白名单
    if (conn.allowedEmailDomains.length > 0) {
      const domain = extractEmailDomain(userinfo.email)
      if (!conn.allowedEmailDomains.includes(domain)) {
        throw new ForbiddenException(`邮箱域名 ${domain} 不在白名单`)
      }
    }

    return this.handleUserLogin(conn, userinfo.email, userinfo.sub ?? userinfo.email, userinfo.name)
  }

  // ============ Mock OIDC HTTP 调用 (测试可注入) ============
  private oidcHttpClient: {
    exchangeCode: (params: any) => Promise<any>
    fetchUserinfo: (token: string) => Promise<any>
  } = {
    async exchangeCode(params: any) {
      // 实际生产: POST tokenEndpoint with form-urlencoded
      return { access_token: `mock-token-${params.code.slice(0, 8)}`, expires_in: 3600 }
    },
    async fetchUserinfo(_token: string) {
      // 实际生产: GET userinfoEndpoint with Bearer token
      return { sub: 'mock-sub', email: 'mock@example.com', name: 'Mock User' }
    },
  }
  setOidcHttpClient(client: typeof this.oidcHttpClient): void {
    this.oidcHttpClient = client
  }
  private async exchangeOidcCode(oidc: OidcConfig, code: string, codeVerifier: string) {
    return this.oidcHttpClient.exchangeCode({
      tokenEndpoint: oidc.tokenEndpoint,
      clientId: oidc.clientId,
      clientSecret: this.decryptSecret(oidc.clientSecret),
      code,
      redirectUri: oidc.redirectUri,
      codeVerifier,
    })
  }
  private async fetchOidcUserinfo(oidc: OidcConfig, token: string) {
    return this.oidcHttpClient.fetchUserinfo(token)
  }

  // ============ 4. 用户处理 (JIT) ============

  private findConnectionByEmail(email: string): SsoConnection | null {
    const domain = extractEmailDomain(email)
    for (const conn of this.connections.values()) {
      if (conn.status !== 'active') continue
      if (conn.allowedEmailDomains.length > 0 && !conn.allowedEmailDomains.includes(domain)) continue
      // 匹配 defaultRole 或第一个 active 连接
      if (conn.isDefault) return conn
    }
    // fallback: 第一个 active
    for (const conn of this.connections.values()) {
      if (conn.status === 'active') return conn
    }
    return null
  }

  private async handleUserLogin(
    conn: SsoConnection,
    email: string,
    subject: string,
    displayName?: string,
  ): Promise<SsoLoginCompleteResponse> {
    // 1. 查找或创建用户
    const userKey = `${conn.tenantId}:${email.toLowerCase()}`
    let userId = this.usersByTenantEmail.get(userKey)
    let isNewUser = false

    if (!userId) {
      // JIT 创建
      userId = `user-${randomUUID().slice(0, 8)}-${Date.now().toString(36)}`
      const now = new Date().toISOString()
      const user: SsoUser = {
        id: userId,
        tenantId: conn.tenantId,
        email: email.toLowerCase(),
        displayName,
        role: conn.defaultRole,
        createdAt: now,
      }
      this.users.set(userId, user)
      this.usersByTenantEmail.set(userKey, userId)
      if (!this.usersByTenant.has(conn.tenantId)) {
        this.usersByTenant.set(conn.tenantId, new Set())
      }
      this.usersByTenant.get(conn.tenantId)!.add(userId)
      isNewUser = true
    }

    // 2. 更新身份关联
    const subjectKey = `${conn.id}:${subject}`
    let identity = this.identitiesBySubject.get(subjectKey)
      ? this.identities.get(this.identitiesBySubject.get(subjectKey)!)
      : undefined

    if (identity) {
      identity.lastLoginAt = new Date().toISOString()
      identity.loginCount++
      if (displayName) identity.displayName = displayName
    } else {
      identity = {
        id: generateIdentityId(),
        userId: userId!,
        tenantId: conn.tenantId,
        connectionId: conn.id,
        protocol: conn.protocol,
        subject,
        email: email.toLowerCase(),
        displayName,
        lastLoginAt: new Date().toISOString(),
        loginCount: 1,
        createdAt: new Date().toISOString(),
      }
      this.identities.set(identity.id, identity)
      this.identitiesBySubject.set(subjectKey, identity.id)
      if (!this.identitiesByConnection.has(conn.id)) {
        this.identitiesByConnection.set(conn.id, new Set())
      }
      this.identitiesByConnection.get(conn.id)!.add(identity.id)
    }

    // 3. 签发访问令牌
    const accessToken = this.signAccessToken({
      userId: userId!,
      tenantId: conn.tenantId,
      email: email.toLowerCase(),
      role: this.users.get(userId!)?.role ?? conn.defaultRole,
      connectionId: conn.id,
    })

    return {
      userId: userId!,
      email: email.toLowerCase(),
      role: this.users.get(userId!)?.role ?? conn.defaultRole,
      isNewUser,
      tenantId: conn.tenantId,
      accessToken,
      refreshToken: `refresh-${randomUUID().slice(0, 16)}`,
      expiresIn: 3600,
    }
  }

  // ============ 5. 访问令牌 (Mock JWT) ============

  private signAccessToken(payload: {
    userId: string
    tenantId: string
    email: string
    role: string
    connectionId: string
  }): string {
    const header = { alg: 'HS256', typ: 'JWT' }
    const now = Math.floor(Date.now() / 1000)
    const claims = { ...payload, iat: now, exp: now + 3600, sub: payload.userId }
    const headerB64 = Buffer.from(JSON.stringify(header)).toString('base64url')
    const payloadB64 = Buffer.from(JSON.stringify(claims)).toString('base64url')
    const secret = process.env.SSO_JWT_SECRET ?? 'mock-sso-secret-for-dev-only'
    const sig = createHmac('sha256', secret).update(`${headerB64}.${payloadB64}`).digest('base64url')
    return `${headerB64}.${payloadB64}.${sig}`
  }

  verifyAccessToken(token: string): { userId: string; tenantId: string; role: string; connectionId: string } | null {
    const parts = token.split('.')
    if (parts.length !== 3) return null
    const [headerB64, payloadB64, sig] = parts
    const secret = process.env.SSO_JWT_SECRET ?? 'mock-sso-secret-for-dev-only'
    const expectedSig = createHmac('sha256', secret).update(`${headerB64}.${payloadB64}`).digest('base64url')
    if (sig !== expectedSig) return null
    try {
      const claims = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf-8'))
      if (claims.exp < Math.floor(Date.now() / 1000)) return null
      return { userId: claims.userId, tenantId: claims.tenantId, role: claims.role, connectionId: claims.connectionId }
    } catch {
      return null
    }
  }

  // ============ 6. 用户身份查询 ============

  async listUserIdentities(userId: string): Promise<UserSsoIdentity[]> {
    const ctx = requireTenantContext()
    const result: UserSsoIdentity[] = []
    for (const identity of this.identities.values()) {
      if (identity.userId === userId && identity.tenantId === ctx.tenantId) {
        result.push(identity)
      }
    }
    return result
  }

  // ============ 7. 测试用统计 ============

  countConnections(): number { return this.connections.size }
  countUsers(): number { return this.users.size }
  countIdentities(): number { return this.identities.size }

  // ============ Helper: 脱敏连接响应 ============

  private toConnectionResponse(c: SsoConnection): SsoConnectionResponse {
    return {
      id: c.id,
      tenantId: c.tenantId,
      protocol: c.protocol,
      name: c.name,
      status: c.status,
      isDefault: c.isDefault,
      defaultRole: c.defaultRole,
      autoProvisionTenant: c.autoProvisionTenant,
      allowedEmailDomains: c.allowedEmailDomains,
      hasSaml: c.saml != null,
      hasOidc: c.oidc != null,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
      createdBy: c.createdBy,
    }
  }
}