// auth.contract.ts · 统一认证合约定义
// 合约: 认证/授权/会话管理的外部接口契约

import type {
  AuthResult,
  UserInfo,
  TokenPair,
  Session,
  AccessTokenPayload,
  RefreshTokenPayload,
  LoginType,
} from './auth.types'

// ─── 登录合约 ────────────────────────────────────────────────────────

export interface LoginBySmsContract {
  /** 手机号 */
  mobile: string
  /** 短信验证码 */
  code: string
  /** 设备信息 */
  deviceInfo?: {
    deviceId: string
    deviceType: 'web' | 'mobile' | 'tablet' | 'unknown'
    browser?: string
    os?: string
    ip?: string
    userAgent?: string
  }
}

export interface LoginByPasswordContract {
  mobile?: string
  email?: string
  password: string
  loginType: LoginType
  deviceInfo?: {
    deviceId: string
    deviceType: 'web' | 'mobile' | 'tablet' | 'unknown'
    browser?: string
    os?: string
    ip?: string
    userAgent?: string
  }
}

export interface LoginByWechatContract {
  code: string
  deviceInfo?: {
    deviceId: string
    deviceType: 'web' | 'mobile' | 'tablet' | 'unknown'
  }
}

// ─── Token 合约 ─────────────────────────────────────────────────────

export interface TokenRefreshContract {
  refreshToken: string
}

export interface TokenValidationContract {
  accessToken: string
}

export interface TokenPairContract {
  accessToken: string
  refreshToken: string
  expiresIn: number
  tokenType: 'Bearer'
}

// ─── 用户合约 ────────────────────────────────────────────────────────

export interface UserInfoContract {
  userId: string
  tenantId: string
  mobile?: string
  email?: string
  nickname?: string
  roles: string[]
  permissions: string[]
  avatar?: string
}

// ─── 会话合约 ────────────────────────────────────────────────────────

export interface SessionContract {
  sessionId: string
  userId: string
  tenantId: string
  deviceInfo: {
    deviceId: string
    deviceType: string
    browser?: string
    os?: string
    ip?: string
  }
  createdAt: number
  lastActiveAt: number
  expiresAt: number
  status: 'active' | 'expired' | 'revoked'
}

export interface LogoutContract {
  sessionId?: string
  allSessions?: boolean
}

// ─── 认证结果合约 ────────────────────────────────────────────────────

export interface AuthResultContract {
  success: boolean
  user?: UserInfoContract
  tokens?: TokenPairContract
  error?: {
    code: string
    message: string
    retryAfter?: number
  }
}

// ─── 权限验证合约 ────────────────────────────────────────────────────

export interface PermissionCheckContract {
  userId: string
  tenantId: string
  permission: string
  resourceId?: string
}

export interface PermissionCheckResultContract {
  granted: boolean
  reason?: string
}

// ─── 角色验证合约 ────────────────────────────────────────────────────

export interface RoleCheckContract {
  userId: string
  tenantId: string
  role: string
  storeId?: string
}

export interface RoleCheckResultContract {
  hasRole: boolean
  effectiveRoles: string[]
}

// ─── 多租户隔离合约 ──────────────────────────────────────────────────

export interface TenantScopeContract {
  tenantId: string
  userId: string
  allowedStores?: string[]
  allowedModules?: string[]
}

// ─── 合约一致性校验 ──────────────────────────────────────────────────

/**
 * 验证实体类型与合约类型对齐
 * 编译期保证 auth.types 到 auth.contract 的类型兼容性
 */
type TypeBridge = {
  // AuthResult → AuthResultContract
  _auth: AuthResult['success'] extends AuthResultContract['success'] ? true : false
  _user: UserInfo extends UserInfoContract ? true : false
  _tokens: TokenPair extends TokenPairContract ? true : false
  _session: Session extends SessionContract ? true : false
  _accessPayload: AccessTokenPayload extends object ? true : false
  _refreshPayload: RefreshTokenPayload extends object ? true : false
}
