import type {
  ResolvedActorContext,
  RequestActorContext,
  RequestTenantContext,
  ActorType
} from './tenant.types'

/**
 * Contract types for tenant module cross-boundary communication.
 * These are the stable surface that other modules consume.
 */

/** External contract for resolved actor context (cross-module safe subset) */
export interface TenantActorContract {
  actorId: string
  actorType: ActorType
  actorName?: string
  roles: string[]
  permissions: string[]
  authenticated: boolean
  source: string
}

/** External contract for tenant resolution result */
export interface TenantResolveContract {
  requestId?: string
  effectiveTenantId: string
  effectiveBrandId?: string
  effectiveStoreId?: string
  effectiveMarketCode?: string
  actor: TenantActorContract | null
  source: string
}

/** External contract for tenant context summary */
export interface TenantContextContract {
  tenantId: string
  brandId?: string
  storeId?: string
  marketCode?: string
}

/** External contract for tenant scope check result */
export interface TenantScopeCheckContract {
  matches: boolean
  requiredTenantId?: string
  requiredBrandId?: string
  requiredStoreId?: string
  effectiveTenantId: string
  effectiveBrandId?: string
  effectiveStoreId?: string
}

/**
 * Convert internal ResolvedActorContext to cross-module contract.
 * Strips internal governance details and exposes only safe fields.
 */
export function toTenantResolveContract(
  ctx: ResolvedActorContext
): TenantResolveContract {
  const actor: TenantActorContract | null = ctx.actor
    ? {
        actorId: ctx.actor.actorId,
        actorType: ctx.actor.actorType,
        actorName: ctx.actor.actorName,
        roles: ctx.actor.roles,
        permissions: ctx.actor.permissions,
        authenticated: ctx.actor.authenticated,
        source: ctx.actor.source
      }
    : null

  return {
    effectiveTenantId: ctx.effectiveTenantId,
    effectiveBrandId: ctx.effectiveBrandId,
    effectiveStoreId: ctx.effectiveStoreId,
    effectiveMarketCode: ctx.effectiveMarketCode,
    actor,
    source: 'tenant-module'
  }
}

/**
 * Convert internal RequestTenantContext to cross-module contract.
 */
export function toTenantContextContract(
  ctx: RequestTenantContext
): TenantContextContract {
  return {
    tenantId: ctx.tenantId,
    brandId: ctx.brandId,
    storeId: ctx.storeId,
    marketCode: ctx.marketCode
  }
}

/**
 * Convert internal actor to cross-module contract.
 */
export function toTenantActorContract(
  actor: RequestActorContext | null
): TenantActorContract | null {
  if (!actor) return null
  return {
    actorId: actor.actorId,
    actorType: actor.actorType,
    actorName: actor.actorName,
    roles: actor.roles,
    permissions: actor.permissions,
    authenticated: actor.authenticated,
    source: actor.source
  }
}

/**
 * Build a scope check contract from resolution result and requirements.
 */
export function toTenantScopeCheckContract(
  ctx: ResolvedActorContext,
  requiredTenantId?: string,
  requiredBrandId?: string,
  requiredStoreId?: string
): TenantScopeCheckContract {
  const matches =
    (!requiredTenantId || ctx.effectiveTenantId === requiredTenantId) &&
    (!requiredBrandId || ctx.effectiveBrandId === requiredBrandId) &&
    (!requiredStoreId || ctx.effectiveStoreId === requiredStoreId)

  return {
    matches,
    requiredTenantId,
    requiredBrandId,
    requiredStoreId,
    effectiveTenantId: ctx.effectiveTenantId,
    effectiveBrandId: ctx.effectiveBrandId,
    effectiveStoreId: ctx.effectiveStoreId
  }
}

/**
 * Convert controller response shape to tenant resolve contract.
 */
export function toTenantControllerResponseToContract(
  response: Record<string, unknown>
): TenantResolveContract {
  return {
    requestId: response.requestId as string | undefined,
    effectiveTenantId: response.effectiveTenantId as string,
    effectiveBrandId: response.effectiveBrandId as string | undefined,
    effectiveStoreId: response.effectiveStoreId as string | undefined,
    effectiveMarketCode: response.effectiveMarketCode as string | undefined,
    actor: response.actor
      ? toTenantActorContract(response.actor as RequestActorContext)
      : null,
    source: (response.source as string) ?? 'tenant-module'
  }
}
