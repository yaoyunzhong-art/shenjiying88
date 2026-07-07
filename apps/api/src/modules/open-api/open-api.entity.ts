/**
 * 多系统对接 - 实体定义 (V9 需求 3 · V10 Day 5 Phase 89)
 *
 * 设计: OAuth 2.0 client_credentials + HMAC-SHA256 + IP 白名单
 * 3 类接口: /auth /sync /command
 */

// ============ OAuth 2.0 Client ============

export interface OpenApiClient {
  clientId: string
  /** bcrypt 哈希存储 */
  clientSecretHash: string
  /** 客户端名称 (商户系统名) */
  name: string
  /** 租户 ID (关联内部 tenant) */
  tenantId: string
  /** 允许的 scopes */
  scopes: OpenApiScope[]
  /** IP 白名单 (CIDR 列表) */
  ipWhitelist: string[]
  /** 限流 (QPS) */
  rateLimitQps: number
  /** 状态 */
  status: 'active' | 'suspended' | 'revoked'
  /** HMAC 密钥 (用于签名校验, 与 clientSecret 不同) */
  hmacSecret: string
  createdAt: string
  updatedAt: string
  /** 过期时间 (可选) */
  expiresAt?: string
}

// ============ OAuth Scope ============

export type OpenApiScope =
  | 'auth:read'           // 读取身份信息
  | 'auth:verify'         // 验证 token
  | 'sync:read'           // 读取业务数据
  | 'sync:write'          // 写入业务数据
  | 'sync:bulk'           // 批量同步
  | 'command:send'        // 发送指令
  | 'command:status'      // 查询指令状态

// ============ OAuth Token ============

export interface OpenApiToken {
  accessToken: string
  tokenType: 'Bearer'
  expiresIn: number  // 秒
  scope: OpenApiScope[]
  clientId: string
  /** token 内部 ID (用于撤销) */
  jti: string
  issuedAt: string
}

// ============ 数据同步载荷 ============

export interface SyncPayload<T = unknown> {
  /** 同步类型 (order/member/inventory ...) */
  resourceType: string
  /** 同步动作 (create/update/delete) */
  action: 'create' | 'update' | 'delete'
  /** 业务数据 */
  data: T
  /** 业务主键 (幂等性键) */
  businessKey: string
  /** 时间戳 */
  timestamp: string
}

// ============ 指令下发 ============

export interface CommandPayload {
  /** 指令类型 (print/refund/open-door ...) */
  commandType: string
  /** 目标设备 ID */
  targetDeviceId: string
  /** 指令参数 */
  params: Record<string, unknown>
  /** 优先级 */
  priority: 'low' | 'normal' | 'high' | 'urgent'
  /** 期望响应超时 (ms) */
  expectedResponseMs?: number
}

// ============ 指令执行记录 ============

export interface CommandExecution {
  id: string
  clientId: string
  tenantId: string
  commandType: string
  targetDeviceId: string
  params: Record<string, unknown>
  priority: 'low' | 'normal' | 'high' | 'urgent'
  status: 'pending' | 'running' | 'success' | 'failed' | 'timeout'
  result?: unknown
  error?: string
  /** 幂等性键 (同一 key 重复提交不会重复执行) */
  idempotencyKey?: string
  durationMs?: number
  startedAt: string
  completedAt?: string
}

// ============ 限流配置 ============

export interface RateLimitBucket {
  clientId: string
  /** 滑动窗口开始时间 */
  windowStart: number
  /** 当前计数 */
  count: number
  /** 最大 QPS */
  max: number
}

// ============ 错误响应 ============

export interface OpenApiError {
  error: string
  errorDescription: string
  /** RFC 6749 OAuth 2.0 error codes */
  // invalid_request / invalid_client / invalid_grant / unauthorized_client / unsupported_grant_type / invalid_scope
}