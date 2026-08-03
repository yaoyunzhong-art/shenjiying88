import { adminWebBootstrap } from '../bootstrap'

export interface LoginResult {
  token: string
  refreshToken: string
  role: string
  permissions: string[]
  userId: string
  username?: string
  email?: string
  tenantId: string
  brandId: string
  storeId: string
  marketCode: string
  deliveryMode: 'api' | 'fallback'
}

export interface LoginHistoryEntry {
  id: string
  username: string
  ip: string
  timestamp: string
  success: boolean
  failReason: string
  userAgent: string
}

export interface SecurityScore {
  total: number
  success: number
  fail: number
  recentFail: number
  successRate: number
  uniqueIPs: number
  uniqueUsernames: number
}

export interface PasswordPolicy {
  minLength: number
  requireUpper: boolean
  requireLower: boolean
  requireNumber: boolean
  requireSpecial: boolean
  maxAgeDays: number
}

export interface LoginPageSnapshot {
  deliveryMode: 'api' | 'fallback'
  sourceLabel: 'login-api-live' | 'login-local-snapshot'
  generatedAt: string
  controlPlaneSource: string
  businessDataSource: string
  refreshPath: string
  note: string
  error?: string
  history: LoginHistoryEntry[]
  passwordPolicy: PasswordPolicy
  recommendedIps: Array<{ ip: string; label: string }>
  currentUser: {
    userId: string
    email?: string
    mobile?: string
    roles: string[]
    permissions: string[]
    tenantId: string
  } | null
  bootstrap: {
    tenantScopeResolver: string
    riskChallengeEnforcement: string
    revalidateOn: string[]
  }
}

interface AuthApiUser {
  userId: string
  tenantId: string
  mobile?: string
  email?: string
  nickname?: string
  roles: string[]
  permissions: string[]
}

interface AuthPasswordResponse {
  user: AuthApiUser
  accessToken: string
  refreshToken: string
  expiresIn: number
  tokenType: 'Bearer'
}

class LoginApiError extends Error {
  constructor(
    message: string,
    public readonly status?: number
  ) {
    super(message)
    this.name = 'LoginApiError'
  }
}

const DEFAULT_API_ORIGIN = 'http://localhost:3001'

export const PASSWORD_POLICY: PasswordPolicy = {
  minLength: 8,
  requireUpper: true,
  requireLower: true,
  requireNumber: true,
  requireSpecial: false,
  maxAgeDays: 90,
}

export const RECOMMENDED_IPS = [
  { ip: '192.168.1.0/24', label: '内网办公' },
  { ip: '10.0.0.0/8', label: 'VPN 接入' },
] as const

export const MOCK_LOGIN_HISTORY: LoginHistoryEntry[] = [
  { id: 'lh-1', username: 'admin', ip: '192.168.1.100', timestamp: '2026-07-16 04:30:00', success: true, failReason: '', userAgent: 'Chrome 128 / macOS' },
  { id: 'lh-2', username: 'admin', ip: '192.168.1.101', timestamp: '2026-07-15 18:22:00', success: true, failReason: '', userAgent: 'Chrome 128 / macOS' },
  { id: 'lh-3', username: 'operator', ip: '192.168.1.50', timestamp: '2026-07-15 14:10:00', success: false, failReason: '密码错误', userAgent: 'Safari / macOS' },
  { id: 'lh-4', username: 'admin', ip: '192.168.1.100', timestamp: '2026-07-15 09:05:00', success: true, failReason: '', userAgent: 'Chrome 128 / macOS' },
  { id: 'lh-5', username: 'admin', ip: '10.0.0.55', timestamp: '2026-07-14 22:45:00', success: false, failReason: 'IP不在白名单', userAgent: 'Firefox / Windows' },
  { id: 'lh-6', username: 'auditor', ip: '10.0.0.100', timestamp: '2026-07-14 16:30:00', success: true, failReason: '', userAgent: 'Safari / iOS' },
  { id: 'lh-7', username: 'admin', ip: '192.168.1.100', timestamp: '2026-07-14 08:15:00', success: true, failReason: '', userAgent: 'Chrome 128 / macOS' },
  { id: 'lh-8', username: 'operator', ip: '203.0.113.50', timestamp: '2026-07-13 19:45:00', success: false, failReason: '账户锁定', userAgent: 'Edge / Windows' },
]

function ensureTrailingSlash(value: string): string {
  return value.endsWith('/') ? value : `${value}/`
}

function resolveLoginApiBaseUrl(): string {
  const configured =
    process.env.M5_API_BASE_URL ??
    process.env.NEXT_PUBLIC_M5_API_BASE_URL ??
    process.env.NEXT_PUBLIC_API_URL ??
    DEFAULT_API_ORIGIN

  const normalized = configured.trim()
  if (!normalized.length) {
    return `${DEFAULT_API_ORIGIN}/api/v1/`
  }
  if (normalized.endsWith('/api/v1') || normalized.endsWith('/api/v1/')) {
    return ensureTrailingSlash(normalized)
  }
  if (normalized.endsWith('/api') || normalized.endsWith('/api/')) {
    return ensureTrailingSlash(`${normalized.replace(/\/$/, '')}/v1`)
  }
  return ensureTrailingSlash(`${normalized.replace(/\/$/, '')}/api/v1`)
}

function unwrapApiPayload<T>(payload: unknown): T {
  if (payload && typeof payload === 'object' && 'success' in payload && 'data' in payload) {
    const wrapped = payload as { success?: boolean; data?: T; message?: string }
    if (!wrapped.success) {
      throw new LoginApiError(wrapped.message ?? 'API error')
    }
    return wrapped.data as T
  }
  return payload as T
}

function readHeader(
  requestHeaders: Headers | HeadersInit | null | undefined,
  name: string
): string | undefined {
  if (!requestHeaders) return undefined
  const normalizedName = name.toLowerCase()
  if (requestHeaders instanceof Headers) {
    const value = requestHeaders.get(normalizedName) ?? requestHeaders.get(name)
    return value && value.trim() ? value : undefined
  }
  if (Array.isArray(requestHeaders)) {
    const headers = new Headers(requestHeaders)
    const value = headers.get(normalizedName) ?? headers.get(name)
    return value && value.trim() ? value : undefined
  }
  const record = requestHeaders as Record<string, string | undefined>
  const value = record[normalizedName] ?? record[name]
  return typeof value === 'string' && value.trim() ? value : undefined
}

async function fetchAuthPart<T>(path: string, init: RequestInit = {}): Promise<T> {
  const upstreamUrl = new URL(path, resolveLoginApiBaseUrl()).toString()
  let response: Response
  try {
    response = await fetch(upstreamUrl, {
      ...init,
      cache: 'no-store',
    })
  } catch (error) {
    throw new LoginApiError(
      error instanceof Error ? error.message : 'auth request failed'
    )
  }

  if (!response.ok) {
    const payload = (await response.json().catch(() => ({}))) as { message?: string }
    throw new LoginApiError(
      payload.message ?? `auth upstream failed: ${response.status}`,
      response.status
    )
  }

  const payload = await response.json()
  return unwrapApiPayload<T>(payload)
}

function normalizeApiLoginResult(
  username: string,
  payload: AuthPasswordResponse
): LoginResult {
  const role = payload.user.roles[0]?.toLowerCase() ?? 'tenant_admin'
  return {
    token: payload.accessToken,
    refreshToken: payload.refreshToken,
    role,
    permissions: payload.user.permissions,
    userId: payload.user.userId,
    username,
    email: payload.user.email,
    tenantId: payload.user.tenantId,
    brandId: 'brand-demo',
    storeId: 'store-001',
    marketCode: 'cn-mainland',
    deliveryMode: 'api',
  }
}

function isDemoCredential(username: string, password: string): boolean {
  return username.trim() === 'admin' && password === 'admin123'
}

function shouldUseFallbackLogin(
  error: unknown,
  username: string,
  password: string
): boolean {
  if (isDemoCredential(username, password)) {
    return true
  }
  if (error instanceof LoginApiError) {
    return typeof error.status !== 'number' || error.status >= 500
  }
  return true
}

function createFallbackSnapshot(error?: string): LoginPageSnapshot {
  return {
    deliveryMode: 'fallback',
    sourceLabel: 'login-local-snapshot',
    generatedAt: '2026-07-16 04:30:00',
    controlPlaneSource: 'loadLoginPageSnapshot -> adminWebBootstrap + MOCK_LOGIN_HISTORY fallback',
    businessDataSource: 'local login samples and security bootstrap snapshot',
    refreshPath: 'LoginPage -> loadLoginPageSnapshot',
    note: '当前登录页展示的是本地认证演练快照，已显式暴露来源态与安全策略证据。',
    error,
    history: MOCK_LOGIN_HISTORY,
    passwordPolicy: PASSWORD_POLICY,
    recommendedIps: [...RECOMMENDED_IPS],
    currentUser: null,
    bootstrap: {
      tenantScopeResolver: adminWebBootstrap.tenantScope.resolver,
      riskChallengeEnforcement: adminWebBootstrap.riskChallenge.enforcement,
      revalidateOn: [...adminWebBootstrap.tenantScope.revalidateOn],
    },
  }
}

export function computeSecurityScore(history: LoginHistoryEntry[]): SecurityScore {
  const total = history.length
  const success = history.filter((entry) => entry.success).length
  const fail = total - success
  const recentFail = history.filter((entry) => !entry.success && entry.timestamp.startsWith('2026-07-16')).length
  const uniqueIPs = new Set(history.map((entry) => entry.ip)).size
  const uniqueUsernames = new Set(history.map((entry) => entry.username)).size
  return {
    total,
    success,
    fail,
    recentFail,
    successRate: total > 0 ? Math.round((success / total) * 100) : 0,
    uniqueIPs,
    uniqueUsernames,
  }
}

export function validatePasswordPolicy(password: string): { valid: boolean; errors: string[] } {
  const errors: string[] = []
  if (password.length < PASSWORD_POLICY.minLength) {
    errors.push(`至少 ${PASSWORD_POLICY.minLength} 个字符`)
  }
  if (PASSWORD_POLICY.requireUpper && !/[A-Z]/.test(password)) {
    errors.push('需要至少一个大写字母')
  }
  if (PASSWORD_POLICY.requireLower && !/[a-z]/.test(password)) {
    errors.push('需要至少一个小写字母')
  }
  if (PASSWORD_POLICY.requireNumber && !/\d/.test(password)) {
    errors.push('需要至少一个数字')
  }
  if (PASSWORD_POLICY.requireSpecial && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('需要至少一个特殊字符')
  }
  return { valid: errors.length === 0, errors }
}

export function filterHistory(history: LoginHistoryEntry[], query: string, showOnlyFail: boolean): LoginHistoryEntry[] {
  let result = history
  if (showOnlyFail) {
    result = result.filter((entry) => !entry.success)
  }
  if (query.trim()) {
    const lower = query.toLowerCase()
    result = result.filter(
      (entry) =>
        entry.username.toLowerCase().includes(lower) ||
        entry.ip.includes(lower) ||
        entry.failReason.toLowerCase().includes(lower) ||
        entry.userAgent.toLowerCase().includes(lower)
    )
  }
  return result
}

export async function mockLoginApi(username: string, password: string): Promise<LoginResult> {
  await new Promise((resolve) => setTimeout(resolve, 300))

  if (!username.trim()) {
    throw new Error('请输入管理员账号')
  }
  if (password.length < 6) {
    throw new Error('至少 6 位字符')
  }
  if (username !== 'admin' || password !== 'admin123') {
    throw new Error('用户名或密码错误，请检查后重试')
  }

  return {
    token: 'mock-jwt-token',
    refreshToken: 'mock-refresh-token',
    role: 'super_admin',
    userId: `admin:${username.trim()}`,
    username: username.trim(),
    tenantId: 'tenant-demo',
    brandId: 'brand-demo',
    storeId: 'store-001',
    marketCode: 'cn-mainland',
    deliveryMode: 'fallback',
    permissions: [
      'dashboard:read',
      'dashboard:operations:read',
      'dashboard:growth:read',
      'foundation.governance.read',
      'workbench.read',
      'store:read',
      'settings:read',
      'identity-access:read',
      'identity-access:write',
      'user:read',
      'user:write',
      'security:read',
      'notification:read',
    ],
  }
}

export async function loginAdmin(username: string, password: string): Promise<LoginResult> {
  const normalizedUsername = username.trim()
  const requestBody = normalizedUsername.includes('@')
    ? {
        email: normalizedUsername,
        password,
        loginType: 'email_password',
      }
    : {
        mobile: normalizedUsername,
        password,
        loginType: 'mobile_password',
      }

  try {
    const result = await fetchAuthPart<AuthPasswordResponse>('auth/login/password', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    })
    return normalizeApiLoginResult(normalizedUsername, result)
  } catch (error) {
    if (!shouldUseFallbackLogin(error, normalizedUsername, password)) {
      throw error
    }
    return mockLoginApi(normalizedUsername, password)
  }
}

export async function loadLoginPageSnapshot(options?: {
  requestHeaders?: Headers | HeadersInit | null
}): Promise<LoginPageSnapshot> {
  const authorization = readHeader(options?.requestHeaders, 'authorization')
  if (!authorization) {
    return createFallbackSnapshot()
  }

  try {
    const currentUser = await fetchAuthPart<AuthApiUser>('auth/me', {
      method: 'GET',
      headers: {
        authorization,
      },
    })

    return {
      deliveryMode: 'api',
      sourceLabel: 'login-api-live',
      generatedAt: new Date().toISOString(),
      controlPlaneSource: 'loadLoginPageSnapshot -> auth/me',
      businessDataSource:
        'auth current session API response + fallback login history/password policy',
      refreshPath: 'LoginPage -> loadLoginPageSnapshot',
      note: '当前登录页已探测到真实认证会话；登录历史与密码策略面板仍保留 fallback 演练快照。',
      history: MOCK_LOGIN_HISTORY,
      passwordPolicy: PASSWORD_POLICY,
      recommendedIps: [...RECOMMENDED_IPS],
      currentUser: {
        userId: currentUser.userId,
        email: currentUser.email,
        mobile: currentUser.mobile,
        roles: currentUser.roles,
        permissions: currentUser.permissions,
        tenantId: currentUser.tenantId,
      },
      bootstrap: {
        tenantScopeResolver: adminWebBootstrap.tenantScope.resolver,
        riskChallengeEnforcement: adminWebBootstrap.riskChallenge.enforcement,
        revalidateOn: [...adminWebBootstrap.tenantScope.revalidateOn],
      },
    }
  } catch (error) {
    return createFallbackSnapshot(
      error instanceof Error
        ? `${error.message}，已回退到本地认证演练快照。`
        : 'auth/me 探测失败，已回退到本地认证演练快照。'
    )
  }
}
