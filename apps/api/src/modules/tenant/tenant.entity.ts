/**
 * 租户上下文解析实体。
 *
 * 定义演员类型枚举、租户上下文实体接口，
 * 以及租户上下文构建与解析工具函数。
 */
import type {
  ResolvedActorContext,
  RequestTenantContext,
  RequestActorContext,
  RequestGovernanceContext,
  ActorType,
  TenantScopeRequirement
} from './tenant.types'

export {
  type ActorType,
  type RequestTenantContext,
  type RequestActorContext,
  type RequestGovernanceContext,
  type ResolvedActorContext,
  type TenantScopeRequirement
}

/**
 * 默认租户 ID
 */
export const DEFAULT_TENANT_ID = 'tenant-demo'

/**
 * 默认市场代码
 */
export const DEFAULT_MARKET_CODE = 'default'

/**
 * 演员类型枚举值
 */
export const ActorTypes = {
  PlatformUser: 'platform-user',
  TenantUser: 'tenant-user',
  BrandUser: 'brand-user',
  StoreUser: 'store-user',
  EmployeeUser: 'employee-user',
  ServiceAccount: 'service-account'
} as const satisfies Record<string, ActorType>

/**
 * 构造默认的请求租户上下文
 */
export function createDefaultTenantContext(
  overrides?: Partial<RequestTenantContext>
): RequestTenantContext {
  return {
    tenantId: DEFAULT_TENANT_ID,
    marketCode: DEFAULT_MARKET_CODE,
    ...overrides
  }
}

/**
 * 构造默认的已解析演员上下文
 */
export function createEmptyResolvedActorContext(
  overrides?: Partial<ResolvedActorContext>
): ResolvedActorContext {
  return {
    authenticated: false,
    actor: null,
    tenantContext: createDefaultTenantContext(),
    effectiveTenantId: DEFAULT_TENANT_ID,
    effectiveMarketCode: DEFAULT_MARKET_CODE,
    roles: [],
    permissions: [],
    ...overrides
  }
}

/**
 * 确定有效的租户 ID：actor > tenant > 默认
 */
export function resolveEffectiveTenantId(
  actorContext?: RequestActorContext,
  tenantContext?: RequestTenantContext
): string {
  return actorContext?.tenantId ?? tenantContext?.tenantId ?? DEFAULT_TENANT_ID
}

/**
 * 确定有效的品牌 ID：actor > tenant
 */
export function resolveEffectiveBrandId(
  actorContext?: RequestActorContext,
  tenantContext?: RequestTenantContext
): string | undefined {
  return actorContext?.brandId ?? tenantContext?.brandId
}

/**
 * 确定有效的门店 ID：actor > tenant
 */
export function resolveEffectiveStoreId(
  actorContext?: RequestActorContext,
  tenantContext?: RequestTenantContext
): string | undefined {
  return actorContext?.storeId ?? tenantContext?.storeId
}

/**
 * 确定有效的市场代码：从 tenantContext 取
 */
export function resolveEffectiveMarketCode(
  tenantContext?: RequestTenantContext
): string {
  return tenantContext?.marketCode ?? DEFAULT_MARKET_CODE
}

/**
 * 检查演员是否已认证
 */
export function isActorAuthenticated(
  actorContext?: RequestActorContext
): boolean {
  return actorContext?.authenticated ?? false
}

/**
 * 将演员上下文格式化为摘要信息
 */
export function actorSummary(
  actorContext?: RequestActorContext
): string | null {
  if (!actorContext) return null
  const parts: string[] = []
  if (actorContext.actorName) parts.push(actorContext.actorName)
  if (actorContext.actorType) parts.push(`[${actorContext.actorType}]`)
  if (actorContext.roles.length > 0) parts.push(`roles:${actorContext.roles.join(',')}`)
  return parts.join(' ') || actorContext.actorId
}

/**
 * 判断租户作用域是否匹配
 */
export function matchesTenantScope(
  ctx: ResolvedActorContext,
  requirement?: TenantScopeRequirement
): boolean {
  if (!requirement) return true
  if (requirement.tenantId && ctx.effectiveTenantId !== requirement.tenantId)
    return false
  if (requirement.brandId && ctx.effectiveBrandId !== requirement.brandId)
    return false
  if (requirement.storeId && ctx.effectiveStoreId !== requirement.storeId)
    return false
  return true
}
