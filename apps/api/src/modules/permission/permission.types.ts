// permission.types.ts · 权限控制类型定义
// Phase-FP P0 · 2026-07-03

// ─── 权限类型 ────────────────────────────────────────────────────────────

export enum PermissionLevel {
  PLATFORM = 'platform',
  TENANT = 'tenant',
  BRAND = 'brand',
  STORE = 'store',
  SELF = 'self',
}

// ─── 资源类型 ────────────────────────────────────────────────────────────

export enum ResourceType {
  TENANT = 'tenant',
  BRAND = 'brand',
  STORE = 'store',
  MEMBER = 'member',
  ORDER = 'order',
  PRODUCT = 'product',
  INVENTORY = 'inventory',
  FINANCE = 'finance',
  CAMPAIGN = 'campaign',
  COUPON = 'coupon',
  USER = 'user',
  ROLE = 'role',
  PERMISSION = 'permission',
  REPORT = 'report',
  CONFIG = 'config',
}

// ─── 操作类型 ────────────────────────────────────────────────────────────

export enum ActionType {
  CREATE = 'create',
  READ = 'read',
  UPDATE = 'update',
  DELETE = 'delete',
  EXECUTE = 'execute',
  MANAGE = 'manage',
}

// ─── 角色定义 ────────────────────────────────────────────────────────────

export interface Role {
  roleId: string
  roleName: string
  roleNameZh: string
  description?: string
  level: PermissionLevel
  permissions: string[]
  tenantId?: string
  createdAt: number
  updatedAt: number
}

// ─── 权限定义 ────────────────────────────────────────────────────────────

export interface Permission {
  permissionId: string
  permissionKey: string
  permissionName: string
  resourceType: ResourceType
  actions: ActionType[]
  description?: string
}

// ─── 用户权限上下文 ──────────────────────────────────────────────────────

export interface PermissionContext {
  userId: string
  tenantId: string
  brandId?: string
  storeId?: string
  roles: string[]
  permissions: string[]
}

// ─── 数据范围 ────────────────────────────────────────────────────────────

export enum DataScopeType {
  PLATFORM = 'platform',
  TENANT = 'tenant',
  BRAND = 'brand',
  STORE = 'store',
  SELF = 'self',
}

export interface DataScope {
  scopeType: DataScopeType
  allowedStoreIds?: string[]
  allowedBrandIds?: string[]
  ownOnly?: boolean
}

// ─── 权限检查请求 ────────────────────────────────────────────────────────

export interface PermissionCheckRequest {
  context: PermissionContext
  resource: string
  action: ActionType
  resourceId?: string
  data?: Record<string, any>
}

// ─── 权限检查结果 ────────────────────────────────────────────────────────

export interface PermissionCheckResult {
  allowed: boolean
  reason?: string
  requiredPermissions?: string[]
  dataScope?: DataScope
  evaluatedAt: number
}

// ─── 错误码 ────────────────────────────────────────────────────────────

export enum PermissionErrorCode {
  INSUFFICIENT_PERMISSION = 'PERM_001',
  TENANT_MISMATCH = 'PERM_002',
  STORE_MISMATCH = 'PERM_003',
  RESOURCE_NOT_FOUND = 'PERM_004',
  ROLE_NOT_FOUND = 'PERM_005',
  INVALID_CONTEXT = 'PERM_006',
}

// ─── DTO ────────────────────────────────────────────────────────────

export interface AssignRoleDto {
  userId: string
  roleId: string
  tenantId: string
  storeIds?: string[]
  brandIds?: string[]
}

export interface RevokeRoleDto {
  userId: string
  roleId: string
  tenantId: string
}

export interface CreateRoleDto {
  roleName: string
  roleNameZh: string
  description?: string
  level: PermissionLevel
  permissions: string[]
  tenantId?: string
}
