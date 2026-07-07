/**
 * tenant-isolation.util.ts — Phase-15 task 3
 *
 * 跨租户访问保护 util,供 service / guard / interceptor 复用。
 *
 * 设计:
 *   - 纯函数,无 NestJS 依赖
 *   - 提供 canAccessTenant / assertSameTenant / canAccessBrand / canAccessStore
 *   - 平台 admin / system actor 可绕过隔离 (使用 canAccessTenant 第三个参数)
 *
 * 使用:
 *   - IdentityAccessGuard 已经基于 actorContext 做基础隔离
 *   - service 层在读写数据前额外 assertSameTenant(actorTenantId, resourceTenantId)
 *   - 跨租户访问时抛 TenantIsolationViolation 异常
 */

import { ForbiddenException } from '@nestjs/common'

/**
 * 平台级 system actor (绕过多租户隔离)
 */
export const SYSTEM_ACTOR_ID = 'system'

/**
 * 平台级 admin role / permission
 */
export const PLATFORM_ADMIN_PERMISSION = 'platform:admin'

/**
 * 跨租户访问违规异常 (ForbiddenException 子类,带结构化字段)
 */
export class TenantIsolationViolation extends ForbiddenException {
  constructor(
    public readonly actorTenantId: string,
    public readonly resourceTenantId: string,
    public readonly resourceKind: string,
    public readonly resourceId?: string
  ) {
    super(
      `Cross-tenant access denied: actor[${actorTenantId}] -> ${resourceKind}[${resourceTenantId ?? 'unknown'}]${resourceId ? `#${resourceId}` : ''}`
    )
    this.name = 'TenantIsolationViolation'
  }
}

/**
 * 判断 actor 是否能访问目标 tenant 资源
 *
 * @param actorTenantId 当前 actor 所属 tenant
 * @param resourceTenantId 资源所属 tenant
 * @param actorPermissions actor 拥有的权限列表 (含 platform admin 可绕隔离)
 * @returns true = 允许访问
 */
export function canAccessTenant(
  actorTenantId: string | undefined,
  resourceTenantId: string | undefined,
  actorPermissions: readonly string[] = []
): boolean {
  if (!actorTenantId) return false
  if (!resourceTenantId) return false
  if (actorTenantId === resourceTenantId) return true
  // platform admin 角色可跨租户
  if (actorPermissions.includes(PLATFORM_ADMIN_PERMISSION)) return true
  return false
}

/**
 * 校验两个 tenantId 相同,否则抛 TenantIsolationViolation
 */
export function assertSameTenant(
  actorTenantId: string | undefined,
  resourceTenantId: string | undefined,
  resourceKind: string,
  resourceId?: string
): void {
  if (!canAccessTenant(actorTenantId, resourceTenantId)) {
    throw new TenantIsolationViolation(
      actorTenantId ?? 'anonymous',
      resourceTenantId ?? 'unknown',
      resourceKind,
      resourceId
    )
  }
}

/**
 * 校验 actor 能在某 brand 范围内操作
 *
 * @param actorBrandId actor 当前激活的 brand (undefined = 跨 brand)
 * @param resourceBrandId 资源所属 brand
 * @param canAccessTenantResult canAccessTenant 的前置结果 (避免重复检查)
 */
export function canAccessBrand(
  actorBrandId: string | undefined,
  resourceBrandId: string | undefined,
  canAccessTenantResult: boolean
): boolean {
  if (!canAccessTenantResult) return false
  // brand 范围:undefined 表示 tenant-wide 资源,actor 任何 brand 都可访问
  if (!resourceBrandId) return true
  if (!actorBrandId) return true // actor 没指定 brand 时默认 tenant 范围
  return actorBrandId === resourceBrandId
}

/**
 * 校验 actor 能在某 store 范围内操作
 */
export function canAccessStore(
  actorStoreId: string | undefined,
  resourceStoreId: string | undefined,
  canAccessBrandResult: boolean
): boolean {
  if (!canAccessBrandResult) return false
  if (!resourceStoreId) return true
  if (!actorStoreId) return true
  return actorStoreId === resourceStoreId
}

/**
 * 一次性校验 tenant + brand + store 三级隔离,任一级失败抛 TenantIsolationViolation
 */
export function assertIsolation(
  actor: {
    tenantId?: string
    brandId?: string
    storeId?: string
    permissions?: readonly string[]
  },
  resource: {
    tenantId?: string
    brandId?: string
    storeId?: string
    kind: string
    id?: string
  }
): void {
  const tenantOk = canAccessTenant(actor.tenantId, resource.tenantId, actor.permissions)
  if (!tenantOk) {
    throw new TenantIsolationViolation(
      actor.tenantId ?? 'anonymous',
      resource.tenantId ?? 'unknown',
      resource.kind,
      resource.id
    )
  }
  const brandOk = canAccessBrand(actor.brandId, resource.brandId, tenantOk)
  if (!brandOk) {
    throw new TenantIsolationViolation(
      actor.tenantId ?? 'anonymous',
      resource.tenantId ?? 'unknown',
      `${resource.kind}.brand`,
      resource.brandId
    )
  }
  const storeOk = canAccessStore(actor.storeId, resource.storeId, brandOk)
  if (!storeOk) {
    throw new TenantIsolationViolation(
      actor.tenantId ?? 'anonymous',
      resource.tenantId ?? 'unknown',
      `${resource.kind}.store`,
      resource.storeId
    )
  }
}

/**
 * 批量校验一组资源同属 actor 的 tenant,返回不通过的资源列表 (用于 service 层批量查询时过滤)
 */
export function filterByTenantIsolation<T extends { tenantId?: string }>(
  actorTenantId: string | undefined,
  resources: readonly T[],
  actorPermissions: readonly string[] = []
): T[] {
  return resources.filter(r => canAccessTenant(actorTenantId, r.tenantId, actorPermissions))
}