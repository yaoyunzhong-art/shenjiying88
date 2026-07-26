import { adminWebBootstrap } from '../bootstrap'

export interface LoginResult {
  token: string
  role: string
  permissions: string[]
  tenantId: string
  brandId: string
  storeId: string
  marketCode: string
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
  deliveryMode: 'fallback'
  sourceLabel: 'login-local-snapshot'
  generatedAt: string
  controlPlaneSource: string
  businessDataSource: string
  refreshPath: string
  note: string
  history: LoginHistoryEntry[]
  passwordPolicy: PasswordPolicy
  recommendedIps: Array<{ ip: string; label: string }>
  bootstrap: {
    tenantScopeResolver: string
    riskChallengeEnforcement: string
    revalidateOn: string[]
  }
}

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
    role: 'super_admin',
    tenantId: 'tenant-demo',
    brandId: 'brand-demo',
    storeId: 'store-001',
    marketCode: 'cn-mainland',
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

export async function loadLoginPageSnapshot(): Promise<LoginPageSnapshot> {
  return {
    deliveryMode: 'fallback',
    sourceLabel: 'login-local-snapshot',
    generatedAt: '2026-07-16 04:30:00',
    controlPlaneSource: 'loadLoginPageSnapshot -> adminWebBootstrap + MOCK_LOGIN_HISTORY',
    businessDataSource: 'local login samples and security bootstrap snapshot',
    refreshPath: 'LoginPage -> loadLoginPageSnapshot',
    note: '当前登录页展示的是本地认证演练快照，已显式暴露来源态与安全策略证据。',
    history: MOCK_LOGIN_HISTORY,
    passwordPolicy: PASSWORD_POLICY,
    recommendedIps: [...RECOMMENDED_IPS],
    bootstrap: {
      tenantScopeResolver: adminWebBootstrap.tenantScope.resolver,
      riskChallengeEnforcement: adminWebBootstrap.riskChallenge.enforcement,
      revalidateOn: [...adminWebBootstrap.tenantScope.revalidateOn],
    },
  }
}
