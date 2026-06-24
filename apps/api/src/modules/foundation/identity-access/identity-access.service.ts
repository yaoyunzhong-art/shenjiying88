import { Injectable } from '@nestjs/common'
import type {
  RequestActorContext,
  RequestTenantContext,
  ResolvedActorContext,
  TenantScopeRequirement
} from '../../tenant/tenant.types'
import type { FoundationModuleDescriptor } from '../foundation.types'

const PRIVILEGED_ROLES = new Set(['platform-admin', 'super-admin'])
const CROSS_SCOPE_PERMISSIONS = new Set(['tenant:cross-scope', 'tenant:*'])

@Injectable()
export class IdentityAccessService {
  private normalizeList(values: string[] = []) {
    return Array.from(
      new Set(
        values
          .map((value) => value.trim())
          .filter(Boolean)
      )
    )
  }

  private normalizeActorContext(actorContext?: RequestActorContext): RequestActorContext | null {
    if (!actorContext?.actorId) {
      return null
    }

    return {
      ...actorContext,
      roles: this.normalizeList(actorContext.roles),
      permissions: this.normalizeList(actorContext.permissions),
      authenticated: actorContext.authenticated !== false
    }
  }

  resolveActorContext(
    tenantContext: RequestTenantContext,
    actorContext?: RequestActorContext
  ): ResolvedActorContext {
    const actor = this.normalizeActorContext(actorContext)
    const roles = actor?.roles ?? []
    const permissions = actor?.permissions ?? []

    return {
      authenticated: Boolean(actor),
      actor,
      tenantContext,
      effectiveTenantId: actor?.tenantId ?? tenantContext.tenantId,
      effectiveBrandId: actor?.brandId ?? tenantContext.brandId,
      effectiveStoreId: actor?.storeId ?? tenantContext.storeId,
      effectiveMarketCode: tenantContext.marketCode ?? 'us-default',
      roles,
      permissions
    }
  }

  hasAnyRole(actorContext: RequestActorContext | undefined, requiredRoles: string[] = []) {
    if (requiredRoles.length === 0) {
      return true
    }

    const actor = this.normalizeActorContext(actorContext)

    if (!actor) {
      return false
    }

    return requiredRoles.some((role) => actor.roles.includes(role))
  }

  hasAllPermissions(actorContext: RequestActorContext | undefined, requiredPermissions: string[] = []) {
    if (requiredPermissions.length === 0) {
      return true
    }

    const actor = this.normalizeActorContext(actorContext)

    if (!actor) {
      return false
    }

    return requiredPermissions.every(
      (permission) => actor.permissions.includes(permission) || actor.permissions.includes('*')
    )
  }

  isPrivilegedActor(actorContext?: RequestActorContext) {
    const actor = this.normalizeActorContext(actorContext)

    if (!actor) {
      return false
    }

    return (
      actor.roles.some((role) => PRIVILEGED_ROLES.has(role)) ||
      actor.permissions.some((permission) => CROSS_SCOPE_PERMISSIONS.has(permission))
    )
  }

  validateTenantScope(
    tenantContext: RequestTenantContext,
    actorContext: RequestActorContext | undefined,
    requiredScope: TenantScopeRequirement
  ) {
    const resolved = this.resolveActorContext(tenantContext, actorContext)

    if (this.isPrivilegedActor(actorContext)) {
      return true
    }

    return (
      (!requiredScope.tenantId || resolved.effectiveTenantId === requiredScope.tenantId) &&
      (!requiredScope.brandId || resolved.effectiveBrandId === requiredScope.brandId) &&
      (!requiredScope.storeId || resolved.effectiveStoreId === requiredScope.storeId)
    )
  }

  authorizeAction(
    action: string,
    resourceScope: Record<string, string | undefined>,
    tenantContext?: RequestTenantContext,
    actorContext?: RequestActorContext
  ) {
    const resolved = tenantContext
      ? this.resolveActorContext(tenantContext, actorContext)
      : undefined
    const permissionMatched = this.hasAllPermissions(actorContext, action ? [action] : [])
    const tenantScopeMatched = tenantContext
      ? this.validateTenantScope(tenantContext, actorContext, resourceScope)
      : true

    return {
      status: permissionMatched && tenantScopeMatched ? 'allowed' : 'denied',
      action,
      resourceScope,
      actor: resolved?.actor ?? null,
      permissionMatched,
      tenantScopeMatched,
      enforcedBy: ['IdentityAccessGuard', 'IdentityAccessService.hasAllPermissions', 'tenant-scope-check']
    }
  }

  getDescriptor(): FoundationModuleDescriptor {
    return {
      key: 'identity-access',
      name: 'Identity Access Module',
      purpose: '统一认证、授权与租户隔离入口，避免门户或业务模块直接拼接身份策略。',
      inboundContracts: [
        'HTTP headers / JWT / session claims / device credentials',
        'TenantMiddleware tenant context',
        'Portal / Workbench requested scope'
      ],
      outboundContracts: ['Resolved actor context', 'Authorization decision', 'Tenant isolation guardrails'],
      capabilities: [
        {
          key: 'authentication',
          name: '认证入口',
          responsibilities: ['统一用户类型解析', '从请求头提取 actor/role/permissions', '输出标准访问上下文'],
          entrypoints: ['IdentityAccessService.resolveActorContext'],
          consumers: ['portal', 'workbench', 'lyt-adapter'],
          status: 'active'
        },
        {
          key: 'authorization',
          name: '授权入口',
          responsibilities: ['角色判定', '权限判定', 'Guard 元数据校验', '按市场和品牌差异化授权'],
          entrypoints: ['IdentityAccessGuard.canActivate', 'IdentityAccessService.authorizeAction'],
          consumers: ['portal', 'workbench'],
          status: 'active'
        },
        {
          key: 'tenant-isolation',
          name: '租户隔离入口',
          responsibilities: ['API 默认附加租户作用域', '按 tenant/brand/store 校验访问范围', '导出/缓存/文件链路隔离'],
          entrypoints: ['TenantMiddleware.use', 'IdentityAccessGuard.canActivate'],
          consumers: ['market', 'portal', 'workbench', 'lyt-adapter'],
          status: 'active'
        }
      ]
    }
  }
}
