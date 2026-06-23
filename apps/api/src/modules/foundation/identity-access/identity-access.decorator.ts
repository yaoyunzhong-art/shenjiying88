import { createParamDecorator, ExecutionContext, SetMetadata } from '@nestjs/common'
import type { RequestActorContext, TenantAwareRequest } from '../../tenant/tenant.types'

export interface TenantScopeMetadata {
  tenantIdParam?: string
  brandIdParam?: string
  storeIdParam?: string
  useRequestTenant?: boolean
}

export const ROLES_METADATA_KEY = 'identity-access:roles'
export const PERMISSIONS_METADATA_KEY = 'identity-access:permissions'
export const TENANT_SCOPE_METADATA_KEY = 'identity-access:tenant-scope'

export const CurrentActor = createParamDecorator((_data: unknown, ctx: ExecutionContext) => {
  const req = ctx.switchToHttp().getRequest<TenantAwareRequest>()
  return req.actorContext
})

export const RequireRoles = (...roles: string[]) => SetMetadata(ROLES_METADATA_KEY, roles)

export const RequirePermissions = (...permissions: string[]) =>
  SetMetadata(PERMISSIONS_METADATA_KEY, permissions)

export const RequireTenantScope = (metadata: TenantScopeMetadata = {}) =>
  SetMetadata(TENANT_SCOPE_METADATA_KEY, metadata)

export type CurrentActorValue = RequestActorContext | undefined
