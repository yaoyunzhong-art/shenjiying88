// auth.types.ts · 统一认证类型定义
// Phase-FP P0 · 2026-07-03

// ─── 登录类型 ────────────────────────────────────────────────────────────

export enum LoginType {
  MOBILE_SMS = 'mobile_sms',
  MOBILE_PASSWORD = 'mobile_password',
  WECHAT = 'wechat',
  WECHAT_MINIAPP = 'wechat_miniapp',
  EMAIL_PASSWORD = 'email_password',
  SSO = 'sso',
}

// ─── Token结构 ────────────────────────────────────────────────────────────

export interface AccessTokenPayload {
  sub: string;              // userId
  tid: string;             // tenantId
  bid?: string;            // brandId
  sid?: string;           // storeId
  roles: string[];        // 角色列表
  permissions: string[];   // 权限列表
  loginType: LoginType;    // 登录方式
  exp: number;            // 过期时间
  iat: number;           // 签发时间
  iss: string;           // 签发者
  jti: string;           // token唯一ID
}

export interface RefreshTokenPayload {
  sub: string;            // userId
  tid: string;           // tenantId
  type: 'refresh';
  exp: number;
  iat: number;
  jti: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: 'Bearer';
}

// ─── 会话结构 ────────────────────────────────────────────────────────────

export interface Session {
  sessionId: string;
  userId: string;
  tenantId: string;
  deviceInfo: DeviceInfo;
  createdAt: number;
  lastActiveAt: number;
  expiresAt: number;
  status: 'active' | 'expired' | 'revoked';
}

export interface DeviceInfo {
  deviceId: string;
  deviceType: 'web' | 'mobile' | 'tablet' | 'unknown';
  browser?: string;
  os?: string;
  ip?: string;
  userAgent?: string;
}

// ─── 认证结果 ────────────────────────────────────────────────────────────

export interface AuthResult {
  success: boolean;
  user?: UserInfo;
  tokens?: TokenPair;
  error?: AuthError;
}

export interface UserInfo {
  userId: string;
  tenantId: string;
  mobile?: string;
  email?: string;
  nickname?: string;
  roles: string[];
  avatar?: string;
}

export interface AuthError {
  code: string;
  message: string;
  retryAfter?: number;
}

// ─── 错误码 ────────────────────────────────────────────────────────────

export enum AuthErrorCode {
  INVALID_CREDENTIALS = 'AUTH_001',
  TOKEN_EXPIRED = 'AUTH_002',
  REFRESH_TOKEN_EXPIRED = 'AUTH_003',
  INVALID_TOKEN = 'AUTH_004',
  ACCOUNT_LOCKED = 'AUTH_005',
  ACCOUNT_DISABLED = 'AUTH_006',
  TENANT_EXPIRED = 'AUTH_007',
  SMS_CODE_ERROR = 'AUTH_008',
  SMS_CODE_EXPIRED = 'AUTH_009',
  SMS_RATE_LIMIT = 'AUTH_010',
  WECHAT_LOGIN_FAILED = 'AUTH_011',
  SSO_ERROR = 'AUTH_012',
  SESSION_EXPIRED = 'AUTH_013',
  SESSION_REVOKED = 'AUTH_014',
  MAX_SESSIONS_EXCEEDED = 'AUTH_015',
}

// ─── DTO ────────────────────────────────────────────────────────────

export interface LoginBySmsDto {
  mobile: string;
  code: string;
}

export interface LoginByPasswordDto {
  mobile?: string;
  email?: string;
  password: string;
  loginType: LoginType;
}

export interface RefreshTokenDto {
  refreshToken: string;
}

export interface LogoutDto {
  sessionId?: string;
  allSessions?: boolean;
}
