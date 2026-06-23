/**
 * 🐜 自动: [identity-access] [A] entity 补全
 * 
 * identity-access 模块的核心实体类型定义：
 * - ActorIdentity: 经过认证的参与者身份
 * - AccessPolicy: 访问控制策略
 * - AuthorizationRequest: 授权请求
 * - AuthorizationResult: 授权结果
 * - TenantScopeBinding: 租户作用域绑定
 */

// ── Actor Identity ──

/**
 * 已认证的参与者身份
 * 从请求头/JWT/Session 中解析的统一身份快照
 */
export interface ActorIdentity {
  /** 参与者唯一标识 */
  actorId: string
  /** 参与者类型: member / employee / device / system */
  actorType: 'member' | 'employee' | 'device' | 'system'
  /** 所属租户 ID */
  tenantId: string
  /** 所属品牌 ID（可选） */
  brandId?: string
  /** 所属门店 ID（可选） */
  storeId?: string
  /** 市场编码 */
  marketCode: string
  /** 分配的角色列表 */
  roles: string[]
  /** 分配的权限列表 */
  permissions: string[]
  /** 是否已认证 */
  authenticated: boolean
  /** 认证来源: jwt / session / device-token / api-key */
  authSource: 'jwt' | 'session' | 'device-token' | 'api-key'
  /** 认证时间 */
  authenticatedAt: string
}

// ── Access Policy ──

/**
 * 访问控制策略
 * 定义角色-权限-作用的映射关系
 */
export interface AccessPolicy {
  /** 策略唯一标识 */
  policyId: string
  /** 策略名称 */
  name: string
  /** 策略描述 */
  description?: string
  /** 作用域类型 */
  scopeType: 'tenant' | 'brand' | 'store' | 'market' | 'platform'
  /** 所需角色列表（满足任一即可） */
  requiredRoles: string[]
  /** 所需权限列表（需全部满足） */
  requiredPermissions: string[]
  /** 与所需角色/权限做 AND 还是 OR */
  strategy: 'ALL' | 'ANY'
  /** 是否启用 */
  enabled: boolean
  /** 优先级（数字越小优先级越高） */
  priority: number
}

// ── Authorization ──

/**
 * 授权请求
 */
export interface AuthorizationRequest {
  /** 请求的动作标识 */
  action: string
  /** 资源作用域 */
  resourceScope: {
    tenantId?: string
    brandId?: string
    storeId?: string
    marketCode?: string
  }
  /** 请求上下文 */
  context?: Record<string, unknown>
}

/**
 * 授权结果
 */
export interface AuthorizationResult {
  /** 授权状态 */
  status: 'allowed' | 'denied'
  /** 请求的动作 */
  action: string
  /** 参与者的身份快照 */
  actor: ActorIdentity | null
  /** 资源作用域 */
  resourceScope: AuthorizationRequest['resourceScope']
  /** 权限是否匹配 */
  permissionMatched: boolean
  /** 租户作用域是否匹配 */
  tenantScopeMatched: boolean
  /** 拒绝原因（status=denied 时） */
  denialReason?: string
  /** 授权时间 */
  decidedAt: string
  /** 执行的策略列表 */
  enforcedBy: string[]
}

// ── Tenant Scope Binding ──

/**
 * 租户作用域绑定
 * 用于将参与者绑定到特定的资源层级
 */
export interface TenantScopeBinding {
  /** 绑定 ID */
  bindingId: string
  /** 参与者 ID */
  actorId: string
  /** 租户 ID */
  tenantId: string
  /** 品牌 ID（可选：绑定到品牌层级） */
  brandId?: string
  /** 门店 ID（可选：绑定到门店层级） */
  storeId?: string
  /** 市场编码 */
  marketCode: string
  /** 绑定创建时间 */
  createdAt: string
  /** 绑定过期时间（可选） */
  expiresAt?: string
  /** 是否激活 */
  active: boolean
}

// ── Role Permission Map ──

/**
 * 角色-权限映射条目
 * 定义单个角色拥有的权限集合
 */
export interface RolePermissionEntry {
  /** 角色标识 */
  role: string
  /** 角色显示名称 */
  displayName: string
  /** 权限列表 */
  permissions: string[]
  /** 角色层级（用于继承） */
  level: number
  /** 父角色标识（可选：RBAC 继承） */
  parentRole?: string
}

// ── Access Audit Entry ──

/**
 * 访问审计条目
 * 用于记录所有授权决策以供后续审计
 */
export interface AccessAuditEntry {
  /** 审计条目 ID */
  auditId: string
  /** 参与者 ID */
  actorId: string
  /** 参与者类型 */
  actorType: ActorIdentity['actorType']
  /** 请求的动作 */
  action: string
  /** 资源标识 */
  resource: string
  /** 授权结果 */
  result: 'ALLOW' | 'DENY'
  /** 拒绝原因（result=DENY 时） */
  reason?: string
  /** 请求 IP */
  clientIp?: string
  /** 请求 User-Agent */
  userAgent?: string
  /** 审计时间 */
  timestamp: string
}

// ── Constants ──

/**
 * 预定义角色常量
 */
export const SYSTEM_ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  TENANT_ADMIN: 'TENANT_ADMIN',
  BRAND_MANAGER: 'BRAND_MANAGER',
  STORE_MANAGER: 'STORE_MANAGER',
  CASHIER: 'CASHIER',
  GUIDE: 'GUIDE',
  OPERATIONS: 'OPERATIONS',
  SECURITY_ADMIN: 'SECURITY_ADMIN',
  HR: 'HR',
  MARKETING: 'MARKETING',
  TEAMBUILDING: 'TEAMBUILDING',
} as const

export type SystemRole = (typeof SYSTEM_ROLES)[keyof typeof SYSTEM_ROLES]

/**
 * 预定义权限常量
 */
export const SYSTEM_PERMISSIONS = {
  FOUNDATION_GOVERNANCE_READ: 'foundation.governance.read',
  FOUNDATION_GOVERNANCE_WRITE: 'foundation.governance.write',
  FOUNDATION_RUNTIME_GOVERNANCE_READ: 'foundation.runtime-governance.read',
  FOUNDATION_RUNTIME_GOVERNANCE_WRITE: 'foundation.runtime-governance.write',
  WORKBENCH_READ: 'workbench.read',
  WORKBENCH_WRITE: 'workbench.write',
  MEMBER_READ: 'member.read',
  MEMBER_WRITE: 'member.write',
  LOYALTY_READ: 'loyalty.read',
  LOYALTY_WRITE: 'loyalty.write',
  ANALYTICS_READ: 'analytics.read',
  CASHIER_READ: 'cashier.read',
  CASHIER_WRITE: 'cashier.write',
  MARKET_READ: 'market.read',
  MARKET_WRITE: 'market.write',
  CAMPAIGN_READ: 'campaign.read',
  CAMPAIGN_WRITE: 'campaign.write',
  AI_RULE_ENGINE_READ: 'ai-rule-engine.read',
  AI_RULE_ENGINE_WRITE: 'ai-rule-engine.write',
  TENANT_CROSS_SCOPE: 'tenant:cross-scope',
  TENANT_ALL: 'tenant:*',
} as const

export type SystemPermission = (typeof SYSTEM_PERMISSIONS)[keyof typeof SYSTEM_PERMISSIONS]

/**
 * 认证来源常量
 */
export const AUTH_SOURCES = {
  JWT: 'jwt',
  SESSION: 'session',
  DEVICE_TOKEN: 'device-token',
  API_KEY: 'api-key',
} as const

export type AuthSource = (typeof AUTH_SOURCES)[keyof typeof AUTH_SOURCES]
